/**
 * SYNCHRO LABIALE DE L'ARCHITECTE.
 *
 * Ce module dit la vérité sur ce qu'il fait. Il existe TROIS niveaux, parce
 * que le navigateur ne donne pas le même accès au son selon le moteur vocal
 * réellement en train de parler :
 *
 *  - `amplitude_reelle` — voix HD lue par un élément `<audio>` (chaîne
 *    multimodale du Super-Admin via `voiceEngine.currentAudioElement`, quel
 *    que soit le fournisseur qui a produit le fichier) : on y branche un
 *    `AnalyserNode` et on mesure l'amplitude RÉELLE, échantillon par
 *    échantillon. La bouche suit la voix. C'est de la vraie synchro labiale.
 *
 *  - `rythme_des_mots` — moteur natif du navigateur (`speechSynthesis`).
 *    Aucun accès au signal audio : l'API n'expose pas de flux. On ne peut
 *    donc PAS mesurer l'amplitude. On s'appuie sur ce qui est réellement
 *    disponible — les événements de frontière de mot (`onboundary`) — pour
 *    ouvrir la bouche au rythme des syllabes. C'est synchronisé sur la
 *    parole, mais sur son RYTHME, pas sur son volume : jamais présenté
 *    comme autre chose.
 *
 *  - `aucune` — l'Architecte ne parle pas, la synchro est désactivée par la
 *    Direction, ou le système demande de réduire le mouvement. Bouche close.
 *
 * Module PUR : il ne crée aucun `AudioContext` et n'écoute aucun événement.
 * Il transforme des nombres en ouverture de bouche. Le branchement audio
 * réel vit dans `voiceEngine` et la page de démonstration ; la règle, elle,
 * se teste ici — y compris sur une phrase réellement mesurée (voir les tests).
 */

export type LipSyncLevel = 'visemes_alignes' | 'amplitude_reelle' | 'rythme_des_mots' | 'aucune';

export interface LipSyncInputs {
    isSpeaking: boolean;
    /** Moteur réellement en train de parler, tel que rapporté par `voiceEngine`. */
    engine: 'elevenlabs' | 'browser_native' | null;
    /** Réglage Super-Admin. */
    lipSyncEnabled: boolean;
    prefersReducedMotion: boolean;
    /**
     * `true` quand le clip HD en cours de lecture a été ALIGNÉ sur son texte
     * (piste de visèmes phonétiques, voir alignment.ts) ; absent ou `false`,
     * la bouche suit l'amplitude mesurée.
     */
    aligned?: boolean;
}

/**
 * Niveau réellement atteignable ici et maintenant.
 *
 * `prefers-reduced-motion` coupe la bouche comme le reste : une bouche qui
 * s'agite reste du mouvement, même quand tout le reste s'est immobilisé.
 */
export function resolveLipSyncLevel(inputs: LipSyncInputs): LipSyncLevel {
    if (!inputs.isSpeaking || !inputs.lipSyncEnabled || inputs.prefersReducedMotion) return 'aucune';
    if (inputs.engine === 'elevenlabs') return inputs.aligned ? 'visemes_alignes' : 'amplitude_reelle';
    if (inputs.engine === 'browser_native') return 'rythme_des_mots';
    return 'aucune';
}

/** Phrase affichable dans le Super-Admin — la Direction doit savoir ce qu'elle regarde. */
export const LIP_SYNC_LEVEL_LABEL: Record<LipSyncLevel, string> = {
    visemes_alignes:
        'Visèmes phonétiques — le texte prononcé est transcrit en phonèmes et calé sur le son de la voix HD avant la lecture : lèvres jointes sur b, p, m, dents sur f, v, s, bouche ouverte, étirée ou arrondie selon la voyelle, gestes et clignements planifiés sur la même partition.',
    amplitude_reelle: 'Synchro réelle — la bouche suit l’amplitude mesurée de la voix HD (chaîne vocale du Super-Admin).',
    rythme_des_mots:
        'Synchro au rythme des mots — le navigateur ne donne pas accès au signal audio de sa voix intégrée ; la bouche suit les frontières de mots, pas le volume.',
    aucune: 'Bouche immobile — l’Architecte ne parle pas, ou la synchro est désactivée.',
};

// ─────────────────────────────────────────────────────────────────────────
// Mesure de la voix : enveloppe RMS temporelle, normalisée par adaptation
// ─────────────────────────────────────────────────────────────────────────
//
// POURQUOI PAS LE SPECTRE EN OCTETS. `getByteFrequencyData` rend des décibels
// ramenés sur 0..255 entre −100 et −30 dB : le souffle d'un fichier de voix
// (−65 dB) vaut déjà « la moitié du volume » sur cette échelle, et la bouche
// restait ouverte à 0,9 pendant les silences (mesuré le 04/09 sur la phrase
// Vision Smart : corrélation son ↔ bouche 0,15, bouche ouverte sur 98 % des
// images). L'amplitude efficace (RMS) du signal TEMPOREL est linéaire : le
// silence vaut 0, une syllabe vaut sa vraie énergie.

/**
 * Fenêtre d'analyse TEMPORELLE : 2 048 échantillons ≈ 46 ms à 44,1 kHz.
 * C'est l'échelle d'une syllabe, pas d'une période de la voix (5 ms à
 * 200 Hz) : assez long pour lisser la porteuse, assez court pour suivre
 * chaque syllabe. IDENTIQUE dans `voiceEngine` et la page de démonstration.
 */
export const ANALYSER_FFT_SIZE = 2048;

/**
 * Avance de la bouche sur la voix ENTENDUE : la voix passe par un retard de
 * 60 ms avant la sortie audio, l'analyseur lit le signal NON retardé. Cette
 * avance compense le retard de la chaîne (fenêtre de 46 ms centrée sur le
 * passé, image suivante, inertie de la lèvre). Sans elle, la bouche suivait
 * la voix avec ~160 ms de retard (mesuré le 04/09) ; à 60 ms, encore 34 ms
 * derrière le son entendu (mesuré le 05/09 dans la page réelle) — la chaîne
 * vaut donc ~94 ms (`RENDER_LATENCY_MS`). S'y ajoutent l'avance VISUELLE
 * voulue (`VISUAL_LEAD_MS`, les lèvres précèdent le son) et la fenêtre de
 * coarticulation : 200 ms. Un cinquième de seconde de retard du son sur une
 * réponse qui a déjà mis des secondes à venir ne se remarque pas ; une
 * bouche en retard, si.
 */
export const LIP_SYNC_LOOKAHEAD_MS = 200;

/**
 * Retard de la chaîne d'affichage entre la lecture d'une forme et son
 * apparition à l'écran : centre de la fenêtre d'analyse (~23 ms), image
 * suivante, inertie de la lèvre. MESURÉ dans la page réelle le 05/09 par
 * corrélation image par image (résolution ±34 ms) : 94 ms d'après deux
 * mesures à 60 et 150 ms de retard du son, puis lecture à −46 ms qui donnait
 * 101 ms d'avance. Retenu 80 ms : l'avance mesurée tombe alors entre 50 et
 * 90 ms, la zone naturelle où les lèvres précèdent la voix.
 */
export const RENDER_LATENCY_MS = 80;

/**
 * Instant (horloge de l'appelant) auquel lire le tampon de formes pour qu'à
 * l'écran la bouche PRÉCÈDE de `VISUAL_LEAD_MS` le son entendu : le son
 * mesuré maintenant est entendu dans `heardDelayMs` ; la forme lue maintenant
 * s'affiche dans `RENDER_LATENCY_MS`.
 */
/**
 * Position de lecture (`audio.currentTime`) → son réellement entré dans le
 * graphe audio : l'élément média est en avance de sa file de décodage (une
 * ou deux tranches de 128 échantillons, mesuré 33 ± 25 ms le 05/09 sur le
 * navigateur de preuve, en comparant la piste phonétique lue sur
 * `currentTime` — bouche 100 ms avant le son — à l'analyseur, qui subit la
 * même file que la sortie — 69 ms). Ne s'applique qu'à la piste phonétique.
 */
export const MEDIA_PIPELINE_MS = 30;

export function mouthReadTime(now: number, heardDelayMs: number): number {
    return now - heardDelayMs + VISUAL_LEAD_MS + RENDER_LATENCY_MS;
}

/** Amplitude efficace (RMS, 0..1) d'un tampon temporel flottant (−1..1), tampon vide compris. */
export function rmsAmplitude(samples: ArrayLike<number>): number {
    if (!samples || samples.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < samples.length; i += 1) {
        const v = samples[i];
        total += v * v;
    }
    const rms = Math.sqrt(total / samples.length);
    return Number.isFinite(rms) ? rms : 0;
}

/** Crête typique d'une voix de synthèse normalisée — point de départ avant adaptation. */
export const VOICE_REFERENCE_RMS = 0.18;
/** Sous cette crête, ce n'est pas une voix : on n'amplifie jamais un souffle jusqu'à ouvrir la bouche. */
export const VOICE_PEAK_MIN = 0.04;
/** Constante de temps de la retombée de la crête : la bouche se ré-étalonne sur ~2 s. */
export const VOICE_PEAK_DECAY_MS = 1800;
/** RMS / crête : en dessous, bouche close (consonnes, silences). */
export const VOICE_CLOSED_RATIO = 0.16;
/** RMS / crête : au-dessus, grande ouverte. */
export const VOICE_OPEN_RATIO = 0.82;
/** Courbe entre fermé et ouvert : légèrement relevée, une voix vit surtout à mi-hauteur. */
export const VOICE_CURVE = 0.8;

/** Crête récente de la voix : état mutable, un par voix jouée. */
export interface VoiceEnvelope {
    peak: number;
}

export function createVoiceEnvelope(): VoiceEnvelope {
    return { peak: VOICE_REFERENCE_RMS };
}

/**
 * Ouverture visée (0..1) pour une amplitude efficace mesurée, `dtMs` après la
 * mesure précédente. Met à jour la crête : la bouche utilise toute sa course
 * quel que soit le volume du fichier ou du fournisseur de voix, et se
 * referme sur les consonnes et les silences de CETTE voix-là.
 */
export function voiceEnvelopeOpenness(envelope: VoiceEnvelope, rms: number, dtMs: number): number {
    const level = Number.isFinite(rms) && rms > 0 ? rms : 0;
    const dt = Number.isFinite(dtMs) && dtMs > 0 ? dtMs : 0;
    const decayed = VOICE_PEAK_MIN + (envelope.peak - VOICE_PEAK_MIN) * Math.exp(-dt / VOICE_PEAK_DECAY_MS);
    envelope.peak = Math.max(VOICE_PEAK_MIN, level, decayed);
    const ratio = level / envelope.peak;
    const normalised = (ratio - VOICE_CLOSED_RATIO) / (VOICE_OPEN_RATIO - VOICE_CLOSED_RATIO);
    if (normalised <= 0) return 0;
    return Math.min(1, normalised) ** VOICE_CURVE;
}

/**
 * Niveau publié (0..1, déjà ramené en ouverture visée par le suiveur) →
 * ouverture. Borne et ignore une valeur non numérique au lieu de propager
 * NaN jusqu'au rendu.
 */
export function amplitudeToOpenness(level: number): number {
    if (!Number.isFinite(level) || level <= 0) return 0;
    return Math.min(1, level);
}

/**
 * Lissage : une bouche a de l'inertie. Sans cela, l'ouverture saute d'une
 * image à l'autre et donne un claquement de mâchoire, pas une parole.
 * L'ouverture monte vite (une syllabe attaque) et retombe plus lentement.
 */
export const MOUTH_ATTACK_MS = 39;
export const MOUTH_RELEASE_MS = 67;
export const DEFAULT_FRAME_MS = 1000 / 60;

/**
 * Lissage EN TEMPS, pas en images : la même bouche sur un écran à 30, 60 ou
 * 120 Hz. Attaque ≈ 70 ms pour 80 % de l'ouverture, comme une lèvre qui
 * s'ouvre (un facteur de 0,55 par image ouvrait en deux images et claquait —
 * mesuré par simulation de la boucle réelle, 04/09) ; retombée plus lente.
 */
export function smoothOpenness(previous: number, target: number, dtMs: number = DEFAULT_FRAME_MS): number {
    const dt = Number.isFinite(dtMs) && dtMs > 0 ? Math.min(dtMs, 100) : DEFAULT_FRAME_MS;
    const tau = target > previous ? MOUTH_ATTACK_MS : MOUTH_RELEASE_MS;
    return previous + (target - previous) * (1 - Math.exp(-dt / tau));
}

// ─────────────────────────────────────────────────────────────────────────
// Rythme des mots (moteur natif)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Enveloppe d'un mot prononcé : la bouche s'ouvre à l'attaque puis se
 * referme, sur `WORD_ENVELOPE_MS`. `elapsedMs` est le temps écoulé depuis la
 * dernière frontière de mot signalée par `speechSynthesis`.
 *
 * Déterministe et sans horloge interne : le composant fournit le temps, la
 * courbe est vérifiable au test.
 */
export const WORD_ENVELOPE_MS = 260;

export function wordEnvelopeOpenness(elapsedMs: number, wordLength: number): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
    // Un mot long tient la bouche ouverte plus longtemps qu'un monosyllabe.
    const duration = WORD_ENVELOPE_MS * Math.min(2, Math.max(0.6, wordLength / 5));
    if (elapsedMs >= duration) return 0;
    const phase = elapsedMs / duration;
    // Sinus sur une demi-période : ouverture progressive, sommet au milieu,
    // fermeture — l'attaque brutale d'une rampe linéaire fait « robot ».
    const amplitude = Math.sin(phase * Math.PI);
    // Plafonné à 0,8 : une voix de synthèse n'articule pas comme un cri, et
    // une bouche constamment grande ouverte trahit l'animation.
    return amplitude * 0.8;
}

/**
 * Ouverture finale, quel que soit le niveau — point d'entrée unique du
 * composant, donc seule règle à vérifier pour savoir ce qui s'affiche.
 */
export function resolveMouthOpenness(
    level: LipSyncLevel,
    source: { amplitude?: number; elapsedMs?: number; wordLength?: number },
): number {
    if (level === 'amplitude_reelle') return amplitudeToOpenness(source.amplitude ?? 0);
    if (level === 'rythme_des_mots') return wordEnvelopeOpenness(source.elapsedMs ?? Infinity, source.wordLength ?? 5);
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────
// Visèmes acoustiques : du spectre à la FORME de la bouche
// ─────────────────────────────────────────────────────────────────────────
//
// Le volume seul ouvre la bouche sur tout ce qui est fort — un « s », un
// « f » — et la referme sur une voyelle douce : on voit que « ça ne colle
// pas » sans savoir pourquoi (Direction, 05/09 : « pas suffisamment
// synchronisé »). Une bouche humaine s'ouvre sur les VOYELLES, d'autant plus
// que la voyelle est ouverte (« a ») ; elle s'étire sur « i », s'arrondit sur
// « ou », se ferme sur « m », « b », « p » et laisse voir les dents sur les
// fricatives. Tout cela se lit dans le spectre :
//  - premier formant (F1) haut → mâchoire ouverte ; bas → presque close ;
//  - second formant (F2) haut → lèvres étirées ; bas → arrondies ;
//  - énergie surtout au-dessus de 3 kHz → fricative, dents visibles ;
//  - énergie seulement en dessous de 400 Hz, et faible → lèvres jointes.
// Calibré le 05/09 sur la phrase Vision Smart, image par image, avec
// l'analyseur du navigateur lui-même (voir tests et fixtures).

/** Bandes (Hz) lues dans le spectre — mêmes valeurs dans le moteur, la page de démonstration et les tests. */
export const SPEECH_BANDS_HZ = {
    low: [80, 400],
    f1: [400, 1000],
    mid: [1000, 2500],
    high: [3000, 8000],
    centroidF1: [250, 1000],
    centroidF2: [800, 2800],
} as const;

export interface SpectralBands {
    /** Amplitude efficace du signal temporel (0..1). */
    rms: number;
    /** Puissances linéaires par bande. */
    low: number;
    f1: number;
    mid: number;
    high: number;
    /** Centroïdes (Hz) des zones du premier et du second formant. */
    cF1: number;
    cF2: number;
}

/**
 * Traits spectraux d'une image : `freqDb` = `getFloatFrequencyData` (dB par
 * bande), `samples` = `getFloatTimeDomainData`. Pur : rien n'est lu ici.
 */
export function spectralBands(
    freqDb: ArrayLike<number>,
    samples: ArrayLike<number>,
    sampleRate: number,
    fftSize: number = ANALYSER_FFT_SIZE,
): SpectralBands {
    const n = freqDb ? freqDb.length : 0;
    const rms = rmsAmplitude(samples);
    if (n === 0 || !Number.isFinite(sampleRate) || sampleRate <= 0) {
        return { rms, low: 0, f1: 0, mid: 0, high: 0, cF1: 0, cF2: 0 };
    }
    const binOf = (hz: number) => Math.min(n - 1, Math.max(0, Math.round((hz * fftSize) / sampleRate)));
    const hzOf = (i: number) => (i * sampleRate) / fftSize;
    const power = (i: number) => {
        const db = freqDb[i];
        return Number.isFinite(db) ? 10 ** (db / 10) : 0;
    };
    const sum = ([a, b]: readonly [number, number]) => {
        let s = 0;
        for (let i = binOf(a); i <= binOf(b); i += 1) s += power(i);
        return s;
    };
    const centroid = ([a, b]: readonly [number, number]) => {
        let s = 0;
        let w = 0;
        for (let i = binOf(a); i <= binOf(b); i += 1) {
            const p = power(i);
            s += p * hzOf(i);
            w += p;
        }
        return w > 0 ? s / w : 0;
    };
    return {
        rms,
        low: sum(SPEECH_BANDS_HZ.low),
        f1: sum(SPEECH_BANDS_HZ.f1),
        mid: sum(SPEECH_BANDS_HZ.mid),
        high: sum(SPEECH_BANDS_HZ.high),
        cF1: centroid(SPEECH_BANDS_HZ.centroidF1),
        cF2: centroid(SPEECH_BANDS_HZ.centroidF2),
    };
}

/** Forme de bouche visée pour une image. */
export interface MouthShape {
    /** Ouverture de mâchoire (0..1 de la course du calage) — déjà ramenée à l'amplitude de parole. */
    open: number;
    /** Facteur de largeur des lèvres : < 1 arrondies (« ou »), > 1 étirées (« i »). */
    width: number;
    /** Dents visibles entre des lèvres à peine entrouvertes (fricatives « s », « f », « ch »). */
    teeth: number;
    /** Lèvres jointes (« m », « b », « p », silences). */
    closed: number;
    /** Niveau de voix (0..1) : l'enveloppe adaptative, pour les jauges et les gestes. */
    level: number;
}

export const MOUTH_AT_REST: MouthShape = { open: 0, width: 1, teeth: 0, closed: 1, level: 0 };

/**
 * Amplitude de parole : une voyelle « a » franche ouvre la mâchoire à 60 % de
 * la course du calage (la course complète est un cri). Relevé sur le banc à
 * pose fixée le 05/09 après le retour « la bouche s'ouvre beaucoup trop ».
 */
export const MAX_SPEECH_OPENNESS = 0.6;

const clamp01 = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x);
const smoothstep = (x: number, a: number, b: number) => {
    if (!Number.isFinite(x)) return 0;
    const t = clamp01((x - a) / (b - a));
    return t * t * (3 - 2 * t);
};
const toDb = (p: number) => 10 * Math.log10((Number.isFinite(p) && p > 0 ? p : 0) + 1e-12);

/**
 * Traits spectraux → forme de bouche, sans lissage (le composant lisse en
 * temps). Met à jour la crête de l'enveloppe comme `voiceEnvelopeOpenness`.
 */
export function mouthShapeFromBands(bands: SpectralBands, envelope: VoiceEnvelope, dtMs: number): MouthShape {
    const level = voiceEnvelopeOpenness(envelope, bands.rms, dtMs);
    const peak = envelope.peak > 0 ? envelope.peak : VOICE_PEAK_MIN;
    // Audible sans être une voyelle forte : les fricatives sont faibles, elles
    // seraient effacées par le seuil de fermeture de l'enveloppe.
    const audible = smoothstep(bands.rms / peak, 0.04, 0.1);
    const voiced = bands.low + bands.f1 + bands.mid;
    const fric = voiced + bands.high > 0 ? bands.high / (voiced + bands.high) : 0;
    // « Sourd » : il ne reste que le grave (nasale à lèvres jointes, occlusive,
    // queue de silence) — et faible, sinon c'est une voyelle arrondie.
    const dull = smoothstep(toDb(bands.low) - toDb(bands.mid), 18, 28);
    const closed = Math.max(dull * (1 - smoothstep(level, 0.2, 0.45)), 1 - smoothstep(bands.rms / peak, 0.03, 0.08));
    const vowelOpen = smoothstep(bands.cF1, 290, 760);
    const spread = smoothstep(bands.cF2, 1300, 2300);
    const teeth = smoothstep(fric, 0.35, 0.8) * audible * (1 - closed);
    const jaw = level * (0.28 + 0.72 * vowelOpen) * (1 - 0.85 * teeth) * (1 - closed);
    return {
        // Une fricative entrouvre les lèvres juste assez pour montrer les dents (banc : 0,12 se voit, 0,06 non).
        open: Math.min(1, jaw * MAX_SPEECH_OPENNESS + teeth * 0.12),
        width: 0.9 + 0.28 * spread + 0.06 * vowelOpen + 0.06 * teeth,
        teeth,
        closed,
        level,
    };
}

/** Constantes de temps du lissage de forme : lèvres et dents plus vives que la mâchoire. */
export const MOUTH_WIDTH_MS = 90;
export const MOUTH_TEETH_MS = 80;
export const MOUTH_CLOSED_MS = 35;

/** Lissage EN TEMPS de la forme (l'ouverture passe par `smoothOpenness`). */
export function smoothMouthShape(previous: MouthShape, target: MouthShape, dtMs: number): MouthShape {
    const dt = Number.isFinite(dtMs) && dtMs > 0 ? Math.min(dtMs, 100) : DEFAULT_FRAME_MS;
    const k = (tau: number) => 1 - Math.exp(-dt / tau);
    return {
        open: smoothOpenness(previous.open, target.open, dt),
        width: previous.width + (target.width - previous.width) * k(MOUTH_WIDTH_MS),
        teeth: previous.teeth + (target.teeth - previous.teeth) * k(MOUTH_TEETH_MS),
        closed: previous.closed + (target.closed - previous.closed) * k(MOUTH_CLOSED_MS),
        level: target.level,
    };
}

// ─────────────────────────────────────────────────────────────────────────
// Anticipation et coarticulation : la bouche PRÉCÈDE le son, sans à-coups
// ─────────────────────────────────────────────────────────────────────────
//
// Sur un visage réel, les articulateurs bougent AVANT que le son sorte : la
// mâchoire s'ouvre 50 à 100 ms avant la voyelle, les lèvres se joignent avant
// le « p ». Une bouche exactement calée sur l'énergie du son paraît donc en
// RETARD (Direction, 05/09 : « la voix part d'un côté, les lèvres de
// l'autre »). Et une forme calculée image par image saute d'un visème à
// l'autre : une vraie bouche glisse entre eux (coarticulation).
//
// Les deux se règlent avec la même mémoire : les formes brutes sont
// conservées sur une courte durée ; la forme affichée est lue un peu EN
// AVANCE sur le son entendu (`VISUAL_LEAD_MS`) et moyennée sur une fenêtre
// triangulaire centrée (`COARTICULATION_WINDOW_MS`) — un lissage sans retard
// de phase, possible parce que le son entendu est lui-même retardé
// (`LIP_SYNC_LOOKAHEAD_MS`) ou, au montage, parce que tout le son est connu.

/** La bouche est affichée ce nombre de millisecondes AVANT le son entendu. */
export const VISUAL_LEAD_MS = 60;
/** Demi-largeur de la fenêtre de coarticulation (ms). */
export const COARTICULATION_WINDOW_MS = 40;
/** Mémoire conservée par le tampon de formes (ms). */
export const MOUTH_BUFFER_MS = 800;

export interface MouthShapeSample {
    at: number;
    shape: MouthShape;
}

/**
 * Tampon de formes horodatées. `push` à chaque mesure, `at(t)` pour lire la
 * forme coarticulée à l'instant `t` (horloge de l'appelant). Pur, sans
 * horloge interne : testable, et identique en temps réel comme au montage.
 */
export class MouthShapeBuffer {
    private samples: MouthShapeSample[] = [];

    /** `keepMs` : mémoire conservée — courte en temps réel, toute la phrase au montage. */
    constructor(private readonly keepMs: number = MOUTH_BUFFER_MS) {}

    push(at: number, shape: MouthShape): void {
        if (!Number.isFinite(at)) return;
        // Les mesures arrivent dans l'ordre ; une horloge qui recule repart de zéro.
        const last = this.samples[this.samples.length - 1];
        if (last && at < last.at) this.samples = [];
        this.samples.push({ at, shape });
        const limit = at - this.keepMs;
        while (this.samples.length > 2 && this.samples[0].at < limit) this.samples.shift();
    }

    get size(): number {
        return this.samples.length;
    }

    clear(): void {
        this.samples = [];
    }

    /** Forme coarticulée à l'instant `t` : moyenne pondérée (triangle) des mesures à ± `windowMs`. */
    at(t: number, windowMs: number = COARTICULATION_WINDOW_MS): MouthShape {
        const n = this.samples.length;
        if (n === 0) return MOUTH_AT_REST;
        if (!Number.isFinite(t)) return this.samples[n - 1].shape;
        // Avant la première mesure, le son n'avait pas commencé : repos, strictement.
        if (t < this.samples[0].at) return MOUTH_AT_REST;
        if (t > this.samples[n - 1].at + windowMs) return this.samples[n - 1].shape;
        const acc = { open: 0, width: 0, teeth: 0, closed: 0, level: 0 };
        let poids = 0;
        let nearest = this.samples[n - 1];
        let dist = Infinity;
        for (const s of this.samples) {
            const d = Math.abs(s.at - t);
            if (d < dist) {
                dist = d;
                nearest = s;
            }
            if (d > windowMs) continue;
            const w = 1 - d / (windowMs + 1e-9);
            acc.open += s.shape.open * w;
            acc.width += s.shape.width * w;
            acc.teeth += s.shape.teeth * w;
            acc.closed += s.shape.closed * w;
            acc.level += s.shape.level * w;
            poids += w;
        }
        if (poids <= 0) return nearest.shape;
        return {
            open: acc.open / poids,
            width: acc.width / poids,
            teeth: acc.teeth / poids,
            closed: acc.closed / poids,
            level: acc.level / poids,
        };
    }
}

// ─────────────────────────────────────────────────────────────────────────
// Horloge du son : position de lecture lissée
// ─────────────────────────────────────────────────────────────────────────

/**
 * `audio.currentTime` avance par paliers sur certains navigateurs (15 à
 * 40 ms) : lue telle quelle, la bouche saccaderait. L'horloge extrapole la
 * position entre deux lectures (temps réel écoulé) et se recale en douceur
 * à chaque nouvelle valeur — jamais un saut, jamais de dérive : l'écart à la
 * vraie position reste sous le palier.
 */
export interface AudioClock {
    /** `mediaMs` : position lue ; `nowMs` : horloge de l'appelant. Rend la position estimée. */
    update(mediaMs: number, nowMs: number): number;
    reset(): void;
}

export function createAudioClock(): AudioClock {
    let lastMedia = NaN;
    let lastNow = NaN;
    let estimate = NaN;
    return {
        update(mediaMs: number, nowMs: number): number {
            if (!Number.isFinite(mediaMs) || !Number.isFinite(nowMs)) return Number.isFinite(estimate) ? estimate : 0;
            const predicted = Number.isFinite(estimate) && Number.isFinite(lastNow) ? estimate + Math.max(0, nowMs - lastNow) : mediaMs;
            if (!Number.isFinite(lastMedia) || mediaMs !== lastMedia) {
                // Nouvelle lecture : recalage à mi-chemin si l'écart est petit
                // (palier du navigateur), saut franc s'il est grand (retour en arrière, pause).
                estimate = Math.abs(predicted - mediaMs) < 80 ? predicted + (mediaMs - predicted) * 0.5 : mediaMs;
                lastMedia = mediaMs;
            } else {
                estimate = predicted;
            }
            lastNow = nowMs;
            return estimate;
        },
        reset(): void {
            lastMedia = NaN;
            lastNow = NaN;
            estimate = NaN;
        },
    };
}
