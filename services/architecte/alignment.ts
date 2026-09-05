/**
 * ALIGNEMENT TEXTE ↔ SON — caler les phonèmes du texte sur le clip de voix,
 * pour une bouche PHONÉTIQUE, calée sur le son à l'échantillon près.
 *
 * Playbook 15 § 5 (AI Core) : visèmes horodatés quand ils sont réellement
 * produits ; ici ils le sont : le texte (`phonemes.ts`) et le son complet
 * sont connus avant la lecture. Ce module cherche, parmi tous les découpages
 * possibles du signal en phonèmes successifs (dans l'ordre du texte), celui
 * qui explique le mieux ce qu'on entend — alignement forcé par programmation
 * dynamique (Viterbi semi-markovien) :
 *   - le son est mesuré toutes les 10 ms : énergie (dB par rapport à la crête
 *     de la voix), taux de passages par zéro (kHz), part haute du spectre ;
 *   - chaque CLASSE de phonème (voyelle ouverte, nasale, occlusive,
 *     sifflante, fricative faible, silence…) a une signature attendue sur
 *     ces trois mesures et une durée plausible ;
 *   - les pauses du texte (virgule, point) sont des silences obligatoires,
 *     les blancs entre mots des silences facultatifs.
 * Ce n'est pas un modèle acoustique appris ; c'est une méthode déterministe,
 * testable sur un vrai fichier, qui donne des frontières de phonèmes à
 * ± une ou deux images de son (10–20 ms) sur une voix de synthèse propre.
 *
 * Sortie : une PISTE (`VoiceTrack`) — phonèmes horodatés, mots horodatés,
 * niveau de voix par image, et la forme de bouche coarticulée à tout instant.
 *
 * Module pur : `Float32Array` en entrée, aucune API navigateur.
 */
import {
    acousticClass,
    isVowelPhone,
    scriptFromText,
    visemeTarget,
    type AcousticClass,
    type Phone,
    type Punctuation,
    type ScriptWord,
    type VisemeTarget,
} from './phonemes';
import { MAX_SPEECH_OPENNESS, MOUTH_AT_REST, type MouthShape } from './lipSync';

// ─────────────────────────────────────────────────────────────────────────
// 1. MESURES DU SON, toutes les 10 ms
// ─────────────────────────────────────────────────────────────────────────

export const FRAME_HOP_MS = 10;
export const FRAME_WINDOW_MS = 25;

export interface FrameFeatures {
    /** Nombre d'images de son. */
    count: number;
    /** Énergie efficace de chaque image (linéaire). */
    rms: Float32Array;
    /** Énergie en dB par rapport à la crête de la voix (0 = crête ; −40 = silence). */
    level: Float32Array;
    /** Logarithme du taux de passages par zéro en kHz (sifflantes : ≈ 2,4 ; voyelles : ≈ 0). */
    logZcr: Float32Array;
    /** Part haute : énergie de la dérivée première sur énergie (fricatives ≫ voyelles), ramenée à 44,1 kHz. */
    high: Float32Array;
    /**
     * Proéminence : énergie moins le maximum des ± 60 ms voisines (dB, ≤ 0).
     * Une voyelle est un sommet local (≈ 0) ; une occlusive, un creux. Sert au
     * CONTRÔLE (les fermetures alignées doivent tomber dans des creux), pas au
     * score : essayée dans le score le 05/09, elle décalait « avec » de 200 ms.
     */
    relative: Float32Array;
    /** Crête robuste (95ᵉ centile) ayant servi à normaliser. */
    peak: number;
    sampleRate: number;
}

/** Mesure le signal mono image par image. `samples` en −1..1. */
export function extractFeatures(samples: Float32Array, sampleRate: number): FrameFeatures {
    const hop = Math.max(1, Math.round((sampleRate * FRAME_HOP_MS) / 1000));
    const win = Math.max(2, Math.round((sampleRate * FRAME_WINDOW_MS) / 1000));
    const count = samples.length >= win ? Math.floor((samples.length - win) / hop) + 1 : 0;
    const rms = new Float32Array(count);
    const zcr = new Float32Array(count);
    const high = new Float32Array(count);
    const highScale = sampleRate / 44100;
    for (let k = 0; k < count; k += 1) {
        const start = k * hop;
        let sq = 0;
        let crossings = 0;
        let diff = 0;
        let prev = samples[start];
        for (let i = 0; i < win; i += 1) {
            const v = samples[start + i];
            sq += v * v;
            if (i > 0) {
                if ((v >= 0) !== (prev >= 0)) crossings += 1;
                const d = v - prev;
                diff += d * d;
            }
            prev = v;
        }
        rms[k] = Math.sqrt(sq / win);
        zcr[k] = (crossings / win) * sampleRate;
        high[k] = rms[k] > 1e-6 ? (Math.sqrt(diff / win) / rms[k]) * highScale : 0;
    }
    const sorted = Array.from(rms).sort((a, b) => a - b);
    const peak = count ? Math.max(1e-4, sorted[Math.min(count - 1, Math.floor(count * 0.95))]) : 1e-4;
    const level = new Float32Array(count);
    const logZcr = new Float32Array(count);
    for (let k = 0; k < count; k += 1) {
        level[k] = 20 * Math.log10(Math.max(rms[k], 1e-6) / peak);
        logZcr[k] = Math.log(zcr[k] / 1000 + 0.2);
    }
    const relative = new Float32Array(count);
    const reach = 6;
    for (let k = 0; k < count; k += 1) {
        let top = -Infinity;
        for (let j = Math.max(0, k - reach); j <= Math.min(count - 1, k + reach); j += 1) if (level[j] > top) top = level[j];
        relative[k] = level[k] - top;
    }
    return { count, rms, level, logZcr, high, relative, peak, sampleRate };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. SIGNATURES DES CLASSES ET DURÉES PLAUSIBLES
// ─────────────────────────────────────────────────────────────────────────

export interface ClassModel {
    level: [number, number];
    logZcr: [number, number];
    high: [number, number];
    /** Durées min / typique / max, en images de 10 ms. */
    dur: [number, number, number];
}

/** Relevé le 05/09/2026 sur la voix HD de la phrase Vision Smart (énergie dB, ln(kHz), part haute). */
export const ACOUSTIC_MODELS: Record<AcousticClass, ClassModel> = {
    V_OPEN: { level: [-6, 6], logZcr: [0.0, 0.7], high: [0.10, 0.10], dur: [4, 10, 35] },
    V_MID: { level: [-8, 6], logZcr: [0.1, 0.7], high: [0.12, 0.10], dur: [3, 8, 30] },
    V_CLOSE: { level: [-11, 6], logZcr: [0.2, 0.8], high: [0.14, 0.12], dur: [3, 7, 25] },
    SCHWA: { level: [-14, 7], logZcr: [0.1, 0.8], high: [0.12, 0.12], dur: [0, 4, 12] },
    GLIDE: { level: [-11, 7], logZcr: [0.2, 0.8], high: [0.12, 0.12], dur: [2, 5, 12] },
    NASAL: { level: [-17, 6], logZcr: [-0.2, 0.7], high: [0.08, 0.08], dur: [2, 6, 16] },
    LIQUID: { level: [-14, 7], logZcr: [0.3, 0.9], high: [0.14, 0.12], dur: [2, 5, 14] },
    STOP_U: { level: [-28, 9], logZcr: [1.0, 1.3], high: [0.30, 0.30], dur: [2, 7, 16] },
    STOP_V: { level: [-24, 8], logZcr: [0.0, 1.0], high: [0.15, 0.20], dur: [2, 6, 14] },
    FRIC_S: { level: [-20, 7], logZcr: [2.4, 0.5], high: [0.70, 0.35], dur: [3, 9, 22] },
    FRIC_Z: { level: [-16, 7], logZcr: [1.6, 0.8], high: [0.40, 0.30], dur: [2, 6, 16] },
    FRIC_F: { level: [-22, 8], logZcr: [1.4, 0.9], high: [0.35, 0.30], dur: [2, 7, 18] },
    SIL: { level: [-40, 10], logZcr: [1.5, 1.5], high: [0.50, 0.50], dur: [0, 5, 400] },
};

/**
 * Vraisemblance gaussienne PLAFONNÉE (à trois écarts-types) : une image
 * aberrante — souffle, clic, glide dévoisé — ne peut pas à elle seule
 * décaler tout un mot.
 */
const gauss = (x: number, [mean, sd]: [number, number]): number => {
    const z = (x - mean) / sd;
    return Math.max(-4.5, -0.5 * z * z);
};

/** Score de chaque image pour chaque classe, puis sommes cumulées (segment = différence de deux sommes). */
function cumulativeScores(f: FrameFeatures): Record<AcousticClass, Float64Array> {
    const out = {} as Record<AcousticClass, Float64Array>;
    for (const cls of Object.keys(ACOUSTIC_MODELS) as AcousticClass[]) {
        const m = ACOUSTIC_MODELS[cls];
        const cum = new Float64Array(f.count + 1);
        for (let k = 0; k < f.count; k += 1) {
            cum[k + 1] = cum[k] + gauss(f.level[k], m.level) + gauss(f.logZcr[k], m.logZcr) + gauss(f.high[k], m.high);
        }
        out[cls] = cum;
    }
    return out;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. SEGMENTS À ALIGNER, tirés du texte
// ─────────────────────────────────────────────────────────────────────────

/** Score par image d'un segment « joker » : un bruit inexpliqué (clic, glide dévoisé, souffle) que le texte ne prévoit pas. */
export const FILLER_FRAME_SCORE = -1.2;

interface Segment {
    phone: Phone | '_';
    cls: AcousticClass | 'FILLER';
    minD: number;
    typD: number;
    maxD: number;
    /** Pénalité fixe si le segment est utilisé (silences facultatifs entre mots). */
    usePenalty: number;
    wordIndex: number;
    stress: number;
    /** Pause portée par le segment silence (ponctuation), sinon ''. */
    punctuation: Punctuation | 'start' | 'end' | 'gap';
}

function segmentsFromScript(words: ScriptWord[]): Segment[] {
    const segs: Segment[] = [];
    segs.push({ phone: '_', cls: 'SIL', minD: 0, typD: 8, maxD: 400, usePenalty: 0, wordIndex: -1, stress: 0, punctuation: 'start' });
    words.forEach((word, wi) => {
        word.phones.forEach((phone, pi) => {
            const cls = acousticClass(phone);
            const [minD, typD0, maxD0] = ACOUSTIC_MODELS[cls].dur;
            const stress = word.stress[pi] ?? 0;
            // Syllabe accentuée (fin de groupe) : voyelle allongée.
            const typD = stress >= 1 && isVowelPhone(phone) ? Math.round(typD0 * 1.6) : typD0;
            const maxD = stress >= 1 && isVowelPhone(phone) ? Math.round(maxD0 * 1.5) : maxD0;
            segs.push({ phone, cls, minD, typD, maxD, usePenalty: 0, wordIndex: wi, stress, punctuation: '' });
            // Entre deux phonèmes d'un mot : un joker FACULTATIF et court, pour
            // qu'un bruit imprévu n'oblige pas à décaler tout le mot.
            if (pi < word.phones.length - 1) segs.push({ phone: '_', cls: 'FILLER', minD: 0, typD: 4, maxD: 12, usePenalty: 5, wordIndex: wi, stress: 0, punctuation: 'gap' });
        });
        // Une phrase se termine presque toujours par un vrai silence ; une
        // virgule, pas toujours (la voix HD enchaîne « Bonjour, je suis ») :
        // la pause de virgule est FACULTATIVE, celle du point a un plancher.
        if (word.punctuation === '.') segs.push({ phone: '_', cls: 'SIL', minD: 5, typD: 32, maxD: 200, usePenalty: 0, wordIndex: wi, stress: 0, punctuation: '.' });
        else if (word.punctuation === ',') segs.push({ phone: '_', cls: 'SIL', minD: 0, typD: 20, maxD: 120, usePenalty: 0, wordIndex: wi, stress: 0, punctuation: ',' });
        else if (wi < words.length - 1) segs.push({ phone: '_', cls: 'SIL', minD: 0, typD: 3, maxD: 14, usePenalty: 4, wordIndex: wi, stress: 0, punctuation: 'gap' });
    });
    segs.push({ phone: '_', cls: 'SIL', minD: 0, typD: 8, maxD: 400, usePenalty: 0, wordIndex: -1, stress: 0, punctuation: 'end' });
    return segs;
}

/** A priori de durée (log-normal, écart-type 0,6 en log) : décourage les découpages absurdes. */
function durationPrior(seg: Segment, d: number): number {
    if (d <= 0) return 0;
    const z = (Math.log(d) - Math.log(Math.max(1, seg.typD))) / 0.6;
    return -0.5 * z * z - seg.usePenalty;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. VITERBI SEMI-MARKOVIEN
// ─────────────────────────────────────────────────────────────────────────

export interface AlignedPhone {
    phone: Phone | '_';
    cls: AcousticClass;
    /** Bornes en millisecondes de son. */
    start: number;
    end: number;
    wordIndex: number;
    stress: number;
    punctuation: Punctuation | 'start' | 'end' | 'gap';
}

/** Aligne les segments sur les images ; renvoie les segments horodatés (les facultatifs de durée 0 sont omis). */
function alignSegments(segs: Segment[], f: FrameFeatures): AlignedPhone[] {
    const T = f.count;
    const M = segs.length;
    if (T === 0 || M === 0) return [];
    const cum = cumulativeScores(f);
    const filler = new Float64Array(T + 1);
    for (let k = 0; k < T; k += 1) filler[k + 1] = filler[k] + FILLER_FRAME_SCORE;
    const NEG = -Infinity;
    // best[m][t] : meilleur score pour avoir placé les m premiers segments sur les t premières images.
    const best: Float64Array[] = [];
    const back: Int16Array[] = [];
    for (let m = 0; m <= M; m += 1) {
        best.push(new Float64Array(T + 1).fill(NEG));
        back.push(new Int16Array(T + 1));
    }
    best[0][0] = 0;
    for (let m = 0; m < M; m += 1) {
        const seg = segs[m];
        const c = seg.cls === 'FILLER' ? filler : cum[seg.cls];
        const prev = best[m];
        const cur = best[m + 1];
        const bp = back[m + 1];
        for (let t = 0; t <= T; t += 1) {
            let bestScore = NEG;
            let bestD = 0;
            const dMax = Math.min(seg.maxD, t);
            for (let d = seg.minD; d <= dMax; d += 1) {
                const before = prev[t - d];
                if (before === NEG) continue;
                const score = before + (d > 0 ? c[t] - c[t - d] : 0) + durationPrior(seg, d);
                if (score > bestScore) {
                    bestScore = score;
                    bestD = d;
                }
            }
            cur[t] = bestScore;
            bp[t] = bestD;
        }
    }
    if (best[M][T] === NEG) return [];
    const out: AlignedPhone[] = [];
    let t = T;
    for (let m = M; m >= 1; m -= 1) {
        const d = back[m][t];
        const seg = segs[m - 1];
        if (d > 0 && seg.cls !== 'FILLER') {
            out.push({
                phone: seg.phone,
                cls: seg.cls,
                start: (t - d) * FRAME_HOP_MS,
                end: t * FRAME_HOP_MS,
                wordIndex: seg.wordIndex,
                stress: seg.stress,
                punctuation: seg.punctuation,
            });
        }
        t -= d;
    }
    out.reverse();
    return out;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. PISTE DE VOIX : phonèmes, mots, niveau, forme de bouche à tout instant
// ─────────────────────────────────────────────────────────────────────────

export interface AlignedWord {
    text: string;
    index: number;
    start: number;
    end: number;
    punctuation: Punctuation;
    syllables: number;
}

export interface MouthKeyframe {
    t: number;
    target: VisemeTarget;
}

export interface VoiceTrack {
    /** Le texte tel qu'aligné. */
    text: string;
    durationMs: number;
    phones: AlignedPhone[];
    words: AlignedWord[];
    /** Niveau de voix (0..1) par image de 10 ms — pour les jauges, le halo, la modulation de l'ouverture. */
    levels: Float32Array;
    keyframes: MouthKeyframe[];
}

/** Pour lire le niveau à l'instant `t`. */
export function trackLevelAt(track: VoiceTrack, tMs: number): number {
    if (!Number.isFinite(tMs) || track.levels.length === 0) return 0;
    const k = Math.floor(tMs / FRAME_HOP_MS);
    if (k < 0 || k >= track.levels.length) return 0;
    return track.levels[k];
}

const smoothstep01 = (x: number): number => {
    const t = x <= 0 ? 0 : x >= 1 ? 1 : x;
    return t * t * (3 - 2 * t);
};

function keyframesFromPhones(phones: AlignedPhone[]): MouthKeyframe[] {
    const keys: MouthKeyframe[] = [];
    for (const p of phones) {
        const d = p.end - p.start;
        const target = visemeTarget(p.phone);
        if (p.phone === '_') {
            // Une vraie pause referme la bouche ; un blanc bref entre deux mots
            // laisse la coarticulation faire (pas de claquement).
            if (d >= 60) {
                keys.push({ t: p.start + 30, target });
                keys.push({ t: p.end - 30, target });
            }
            continue;
        }
        const held = p.cls !== 'V_OPEN' && p.cls !== 'V_MID' && p.cls !== 'V_CLOSE' && p.cls !== 'SCHWA' && p.cls !== 'GLIDE';
        if (held) {
            // Consonne : la forme est ATTEINTE dès le début du segment et tenue.
            keys.push({ t: p.start + Math.min(8, d * 0.2), target });
            if (d > 30) keys.push({ t: p.end - Math.min(8, d * 0.2), target });
        } else if (d > 80) {
            keys.push({ t: p.start + d * 0.3, target });
            keys.push({ t: p.end - d * 0.25, target });
        } else {
            keys.push({ t: p.start + d * 0.45, target });
        }
    }
    keys.sort((a, b) => a.t - b.t);
    return keys;
}

/** Interpolation lisse entre les images-clés : la forme coarticulée à `t`. */
export function trackTargetAt(track: VoiceTrack, tMs: number): VisemeTarget {
    const keys = track.keyframes;
    const rest = visemeTarget('_');
    if (!Number.isFinite(tMs) || keys.length === 0) return rest;
    if (tMs <= keys[0].t - 60) return rest;
    if (tMs < keys[0].t) return blendTargets(rest, keys[0].target, smoothstep01((tMs - (keys[0].t - 60)) / 60));
    const last = keys[keys.length - 1];
    if (tMs >= last.t + 80) return rest;
    if (tMs >= last.t) return blendTargets(last.target, rest, smoothstep01((tMs - last.t) / 80));
    // Recherche binaire de l'intervalle.
    let lo = 0;
    let hi = keys.length - 1;
    while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (keys[mid].t <= tMs) lo = mid;
        else hi = mid;
    }
    const a = keys[lo];
    const b = keys[hi];
    const span = Math.max(1, b.t - a.t);
    return blendTargets(a.target, b.target, smoothstep01((tMs - a.t) / span));
}

function blendTargets(a: VisemeTarget, b: VisemeTarget, x: number): VisemeTarget {
    const y = 1 - x;
    return {
        open: a.open * y + b.open * x,
        width: a.width * y + b.width * x,
        teeth: a.teeth * y + b.teeth * x,
        closed: a.closed * y + b.closed * x,
    };
}

/**
 * Forme de bouche à l'instant `t` de la piste, dans l'unité du moteur
 * (`MouthShape`) : ouverture ramenée à l'amplitude de parole et modulée par
 * le niveau réel de la voix (une syllabe faible ouvre moins), dents,
 * largeur, lèvres jointes, niveau.
 */
export function trackShapeAt(track: VoiceTrack, tMs: number): MouthShape {
    const target = trackTargetAt(track, tMs);
    const level = trackLevelAt(track, tMs);
    const modulation = 0.7 + 0.3 * level;
    const open = Math.min(1, target.open * MAX_SPEECH_OPENNESS * modulation * (1 - target.closed) + target.teeth * 0.12);
    return { open, width: target.width, teeth: target.teeth, closed: target.closed, level };
}

/** Niveau 0..1 par image : énergie linéaire par rapport à la crête, courbe douce, jamais négatif. */
function levelsFromFeatures(f: FrameFeatures): Float32Array {
    const out = new Float32Array(f.count);
    for (let k = 0; k < f.count; k += 1) {
        const ratio = f.rms[k] / f.peak;
        out[k] = Math.min(1, Math.max(0, Math.pow(ratio, 0.8)));
    }
    return out;
}

/**
 * Construit la piste : phonétise le texte, mesure le son, aligne, dérive les
 * mots et les images-clés. `null` si le texte n'a aucun phonème ou si le son
 * est trop court pour être aligné.
 */
export function buildVoiceTrack(samples: Float32Array, sampleRate: number, text: string): VoiceTrack | null {
    const words = scriptFromText(text);
    if (words.length === 0) return null;
    const f = extractFeatures(samples, sampleRate);
    if (f.count < 5) return null;
    const phones = alignSegments(segmentsFromScript(words), f);
    if (phones.length === 0) return null;
    const alignedWords: AlignedWord[] = words.map((w, index) => {
        const own = phones.filter((p) => p.wordIndex === index && p.phone !== '_');
        return {
            text: w.text,
            index,
            start: own.length ? own[0].start : 0,
            end: own.length ? own[own.length - 1].end : 0,
            punctuation: w.punctuation,
            syllables: w.syllables,
        };
    });
    return {
        text,
        durationMs: f.count * FRAME_HOP_MS,
        phones,
        words: alignedWords,
        levels: levelsFromFeatures(f),
        keyframes: keyframesFromPhones(phones),
    };
}

/** Mélange les canaux d'un `AudioBuffer` en mono (sans dépendre de l'API : n'importe quel objet à `getChannelData`). */
export function mixToMono(buffer: { numberOfChannels: number; length: number; getChannelData(c: number): Float32Array }): Float32Array {
    const n = buffer.numberOfChannels;
    if (n <= 1) return buffer.getChannelData(0);
    const out = new Float32Array(buffer.length);
    for (let c = 0; c < n; c += 1) {
        const data = buffer.getChannelData(c);
        for (let i = 0; i < out.length; i += 1) out[i] += data[i] / n;
    }
    return out;
}

/** Transcription lisible d'une piste (planches, tests). */
export function trackToString(track: VoiceTrack): string {
    return track.phones.map((p) => `${p.phone}@${p.start}-${p.end}`).join(' ');
}

export { MOUTH_AT_REST };
