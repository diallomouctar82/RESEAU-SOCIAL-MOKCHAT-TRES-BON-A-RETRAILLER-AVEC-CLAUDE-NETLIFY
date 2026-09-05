/**
 * GESTES PORTÉS PAR LA PAROLE — ce qui manquait pour « harmoniser la parole
 * et les mouvements » (Direction, 05/09).
 *
 * Un visage qui parle ne bouge pas au hasard : la tête marque les temps
 * forts, se relève et hausse brièvement les sourcils quand une phrase
 * commence, cligne et laisse filer le regard dans les pauses, change
 * d'inclinaison quand une phrase se termine. Ici, ces gestes sont DÉCLENCHÉS
 * PAR LA VOIX ELLE-MÊME (attaques de syllabes, force, silences), jamais par
 * une horloge : ils tombent donc toujours au bon moment, sur n'importe quelle
 * voix, sans rien connaître du texte.
 *
 * Aucun `Math.random` : les variantes viennent d'un hachage de l'index du
 * geste — identiques d'une exécution à l'autre, donc vérifiables au test — et
 * chaque mouvement passe par un RESSORT À AMORTISSEMENT CRITIQUE : il rejoint
 * sa cible sans dépasser ni osciller, ce qui ôte tout effet mécanique.
 *
 * Module pur : l'appelant fournit le temps, l'ouverture visée et le niveau.
 */
import { BLINK_DURATION_MS, blinkAmount } from './livingAvatar';

export interface GestureState {
    /** Hochement sur un temps fort : descente (% du cadre, positif = vers le bas) et roulis (degrés). */
    nodY: number;
    nodRotate: number;
    /** Relèvement de tête en début de phrase (% du cadre, négatif = vers le haut). */
    liftY: number;
    /** Inclinaison lente choisie à chaque fin de phrase (degrés). */
    tilt: number;
    /** Haussement bref des sourcils (0..1) en début de phrase. */
    brow: number;
    /** Regard qui s'échappe pendant une pause (% du cadre). */
    gazeX: number;
    gazeY: number;
    /** La tête suit le regard : translation horizontale (% du cadre). */
    turnX: number;
    /** Clignement demandé dans une pause : instant de départ (horloge de l'appelant), sinon `null`. */
    blinkStartedAt: number | null;
}

export const GESTURE_AT_REST: GestureState = {
    nodY: 0, nodRotate: 0, liftY: 0, tilt: 0, brow: 0, gazeX: 0, gazeY: 0, turnX: 0, blinkStartedAt: null,
};

/** Ouverture (normalisée 0..1) au-dessus de laquelle une syllabe commence, en dessous de laquelle elle finit. */
export const SYLLABLE_OPEN = 0.3;
export const SYLLABLE_CLOSE = 0.12;
/** Un temps fort ne se marque pas plus souvent que ça : au-delà, la tête sautille. */
export const BEAT_MIN_GAP_MS = 350;
/** Niveau de voix à partir duquel une syllabe est un temps fort. */
export const BEAT_LOUDNESS = 0.6;
/** Silence avant une syllabe qui en fait un début de phrase. */
export const PHRASE_GAP_MS = 500;
/** Silence continu qui devient une pause (clignement, regard). */
export const PAUSE_MS = 240;
/** Silence continu qui devient une fin de phrase (nouvelle inclinaison). */
export const SENTENCE_END_MS = 650;
/** Deux clignements demandés ne se suivent pas de plus près. */
export const BLINK_MIN_GAP_MS = 1200;
/** En parole, sans pause depuis ce délai, on cligne quand même à la fin d'une syllabe. */
export const BLINK_MAX_GAP_MS = 4500;
/** Un clignement de la table (ou d'une saccade) dans cette fenêtre suffit : pas de doublon dans une pause. */
export const BLINK_RECENT_MS = 900;

/** Hachage déterministe dans [0, 1) : une variante par index, jamais un tirage. */
export function hash01(index: number): number {
    const x = Math.sin((index + 1) * 12.9898) * 43758.5453;
    return x - Math.floor(x);
}

export interface Spring {
    x: number;
    v: number;
}

/**
 * Ressort à amortissement critique, pas semi-implicite et sous-pas de 8 ms au
 * plus : stable quelle que soit la durée d'image, sans dépassement.
 */
export function stepSpring(s: Spring, target: number, omega: number, dtMs: number): void {
    let remaining = Number.isFinite(dtMs) && dtMs > 0 ? Math.min(dtMs, 100) / 1000 : 1 / 60;
    while (remaining > 0) {
        const dt = Math.min(remaining, 0.008);
        const a = omega * omega * (target - s.x) - 2 * omega * s.v;
        s.v += a * dt;
        s.x += s.v * dt;
        remaining -= dt;
    }
}

export interface ProsodyTracker {
    open: boolean;
    syllables: number;
    lastOnsetAt: number;
    lastBeatAt: number;
    silenceMs: number;
    pauseIndex: number;
    pauseNoted: boolean;
    sentenceNoted: boolean;
    phraseIndex: number;
    lastBlinkAt: number;
    blinkStartedAt: number | null;
    nodUntil: number;
    nodAmount: number;
    liftUntil: number;
    browUntil: number;
    browAmount: number;
    gazeUntil: number;
    gazeTarget: { x: number; y: number };
    tiltTarget: number;
    tiltSign: number;
    nodY: Spring;
    nodR: Spring;
    lift: Spring;
    brow: Spring;
    gazeX: Spring;
    gazeY: Spring;
    tilt: Spring;
}

export function createProsodyTracker(): ProsodyTracker {
    const spring = (): Spring => ({ x: 0, v: 0 });
    return {
        open: false, syllables: 0, lastOnsetAt: -Infinity, lastBeatAt: -Infinity,
        silenceMs: 0, pauseIndex: 0, pauseNoted: false, sentenceNoted: false, phraseIndex: 0,
        lastBlinkAt: -Infinity, blinkStartedAt: null,
        nodUntil: -Infinity, nodAmount: 0, liftUntil: -Infinity, browUntil: -Infinity, browAmount: 0,
        gazeUntil: -Infinity, gazeTarget: { x: 0, y: 0 }, tiltTarget: 0, tiltSign: 1,
        nodY: spring(), nodR: spring(), lift: spring(), brow: spring(), gazeX: spring(), gazeY: spring(), tilt: spring(),
    };
}

export interface ProsodyInput {
    /** Horloge de l'appelant (ms). */
    t: number;
    /** Ouverture visée, normalisée : 1 = voyelle « a » franche. */
    open: number;
    /** Niveau de voix (0..1), enveloppe adaptative. */
    loud: number;
    speaking: boolean;
    dtMs: number;
    /**
     * Temps écoulé de la pose (horloge des clignements de la table) : permet
     * de ne pas demander un clignement quand la table vient d'en jouer un.
     */
    elapsedMs?: number;
}

/** La table (ou une saccade) a-t-elle fait cligner dans la fenêtre récente ? */
export function blinkedRecently(elapsedMs: number, windowMs: number = BLINK_RECENT_MS): boolean {
    if (!Number.isFinite(elapsedMs)) return false;
    for (let d = 0; d <= windowMs; d += 20) if (blinkAmount(elapsedMs - d) > 0.3) return true;
    return false;
}

const clamp01 = (x: number) => (Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0);

/** Fait avancer le suiveur d'une image et rend les gestes à appliquer à la pose. */
export function updateProsody(tr: ProsodyTracker, input: ProsodyInput): GestureState {
    const { t, dtMs } = input;
    const open = clamp01(input.open);
    const loud = clamp01(input.loud);

    if (input.speaking) {
        if (open >= SYLLABLE_OPEN && !tr.open) {
            tr.open = true;
            tr.syllables += 1;
            // Le clignement de secours se compte depuis le début de la parole.
            if (tr.syllables === 1 && !Number.isFinite(tr.lastBlinkAt)) tr.lastBlinkAt = t;
            // Début de phrase : première syllabe, ou syllabe après un vrai silence.
            if (tr.syllables === 1 || t - tr.lastOnsetAt >= PHRASE_GAP_MS) {
                tr.phraseIndex += 1;
                const h = hash01(tr.phraseIndex * 7 + 3);
                tr.browAmount = 0.45 + 0.3 * h;
                tr.browUntil = t + 300 + 150 * h;
                tr.liftUntil = t + 320;
                // Un orateur détourne souvent le regard en commençant une phrase
                // (il cherche ses mots) et revient sur l'interlocuteur pour la
                // finir : une phrase sur deux environ, côté et durée variables.
                const r = hash01(tr.phraseIndex * 11 + 5);
                if (r > 0.5) {
                    tr.gazeTarget = { x: (r > 0.75 ? 1 : -1) * (0.45 + 0.3 * r), y: -0.25 - 0.2 * r };
                    tr.gazeUntil = t + 350 + 250 * r;
                }
            }
            // Temps fort : quatre sur cinq hochent, à des amplitudes différentes —
            // jamais tous, jamais pareil.
            if (loud >= BEAT_LOUDNESS && t - tr.lastBeatAt >= BEAT_MIN_GAP_MS) {
                tr.lastBeatAt = t;
                const h = hash01(tr.syllables);
                if (h > 0.2) {
                    tr.nodAmount = 0.6 + 0.4 * h;
                    tr.nodUntil = t + 130;
                }
            }
            tr.lastOnsetAt = t;
        } else if (open <= SYLLABLE_CLOSE && tr.open) {
            tr.open = false;
            // Trop longtemps sans cligner en parlant : on cligne à la fin d'une
            // syllabe, jamais en pleine voyelle.
            if (t - tr.lastBlinkAt >= BLINK_MAX_GAP_MS) {
                tr.blinkStartedAt = t;
                tr.lastBlinkAt = t;
            }
        }

        if (loud < 0.06 && open < 0.1) {
            tr.silenceMs += dtMs;
            if (tr.silenceMs >= PAUSE_MS && !tr.pauseNoted) {
                tr.pauseNoted = true;
                tr.pauseIndex += 1;
                const h = hash01(tr.pauseIndex * 13 + 1);
                const recent = input.elapsedMs !== undefined && blinkedRecently(input.elapsedMs);
                if (t - tr.lastBlinkAt >= BLINK_MIN_GAP_MS && !recent) {
                    tr.blinkStartedAt = t + 40;
                    tr.lastBlinkAt = t;
                }
                if (h > 0.6) {
                    tr.gazeTarget = { x: (h > 0.8 ? 1 : -1) * (0.35 + 0.25 * h), y: -0.2 - 0.15 * h };
                    tr.gazeUntil = t + 380 + 200 * h;
                }
            }
            if (tr.silenceMs >= SENTENCE_END_MS && !tr.sentenceNoted) {
                tr.sentenceNoted = true;
                tr.tiltSign = -tr.tiltSign;
                tr.tiltTarget = tr.tiltSign * (1.2 + 1.0 * hash01(tr.pauseIndex * 5 + 2));
            }
        } else {
            tr.silenceMs = 0;
            tr.pauseNoted = false;
            tr.sentenceNoted = false;
        }
    } else {
        // Fin de parole : les cibles reviennent au repos, les ressorts font le reste.
        tr.open = false;
        tr.silenceMs = 0;
        tr.pauseNoted = false;
        tr.sentenceNoted = false;
        tr.syllables = 0;
        tr.tiltTarget = 0;
    }

    const nodTarget = t < tr.nodUntil ? tr.nodAmount : 0;
    const liftTarget = t < tr.liftUntil ? 1 : 0;
    const browTarget = t < tr.browUntil ? tr.browAmount : 0;
    const gaze = t < tr.gazeUntil ? tr.gazeTarget : { x: 0, y: 0 };
    stepSpring(tr.nodY, nodTarget, 24, dtMs);
    stepSpring(tr.nodR, nodTarget, 24, dtMs);
    stepSpring(tr.lift, liftTarget, 14, dtMs);
    stepSpring(tr.brow, browTarget, 20, dtMs);
    stepSpring(tr.gazeX, gaze.x, 15, dtMs);
    stepSpring(tr.gazeY, gaze.y, 15, dtMs);
    stepSpring(tr.tilt, tr.tiltTarget, 2.6, dtMs);
    if (tr.blinkStartedAt !== null && t > tr.blinkStartedAt + BLINK_DURATION_MS + 50) tr.blinkStartedAt = null;

    // `+ 0` : jamais de -0 (les comparaisons d'égalité stricte le distinguent).
    // Amplitudes VISIBLES (Direction, 05/09 : à 0,45 % du cadre, un hochement
    // faisait deux pixels — invisible) : ~1 % du cadre et ~0,8° sur un temps fort.
    return {
        nodY: tr.nodY.x * 0.95 + 0,
        nodRotate: tr.nodR.x * 0.8 + 0,
        liftY: -tr.lift.x * 0.55 + 0,
        tilt: tr.tilt.x + 0,
        brow: tr.brow.x + 0,
        gazeX: tr.gazeX.x + 0,
        gazeY: tr.gazeY.x + 0,
        turnX: 0,
        blinkStartedAt: tr.blinkStartedAt,
    };
}

// ─────────────────────────────────────────────────────────────────────────
// PARTITION : gestes PLANIFIÉS sur la piste de voix alignée
// ─────────────────────────────────────────────────────────────────────────
//
// Quand le clip est aligné sur son texte (alignment.ts), on sait À L'AVANCE
// où tombent les syllabes accentuées, les débuts de phrase, les virgules et
// les points. Un orateur ANTICIPE : le hochement commence ~90 ms avant la
// syllabe forte, les sourcils montent avant le premier mot, le regard part
// chercher la phrase avant qu'elle ne sorte, le clignement tombe dans la
// pause. Le suiveur réactif ci-dessus ne peut que suivre (détection puis
// ressort : ≥ 100 ms de retard) ; la partition arrive à l'heure. Mêmes
// ressorts, mêmes amplitudes : seul l'instant de déclenchement change.

import type { VoiceTrack } from './alignment';

export type ProsodyEventKind = 'nod' | 'lift' | 'brow' | 'gaze' | 'blink' | 'tilt';

export interface ProsodyEvent {
    /** Instant de déclenchement, en millisecondes de piste. */
    t: number;
    kind: ProsodyEventKind;
    /** Amplitude (hochement, sourcils : 0..1 ; inclinaison : degrés signés ; relèvement : 1). */
    amount: number;
    /** Cible du regard (% du cadre). */
    x?: number;
    y?: number;
    /** Fin de la tenue (ms de piste) pour relèvement, sourcils, regard. */
    untilMs?: number;
}

export interface ProsodyScore {
    events: ProsodyEvent[];
    durationMs: number;
}

/** Anticipation d'un hochement sur la syllabe accentuée. */
export const NOD_LEAD_MS = 90;
/** Anticipation des sourcils et du relèvement sur le premier mot d'une phrase. */
export const PHRASE_LEAD_MS = 150;
/** Le regard part chercher la phrase un peu plus tôt encore. */
export const GAZE_LEAD_MS = 200;
/** En parole continue, sans pause depuis ce délai, on cligne à la fin d'une syllabe. */
export const SCORE_BLINK_MAX_GAP_MS = 3800;

/** Construit la partition d'une piste alignée. Déterministe (hachages), donc testable. */
export function buildProsodyScore(track: VoiceTrack): ProsodyScore {
    const events: ProsodyEvent[] = [];
    const words = track.words;
    const phones = track.phones;
    if (words.length === 0) return { events, durationMs: track.durationMs };

    let lastBlinkAt = -Infinity;
    let lastNodAt = -Infinity;
    let sentenceIndex = -1;
    let tiltSign = 1;
    const blink = (t: number, minGap: number = BLINK_MIN_GAP_MS): boolean => {
        if (t - lastBlinkAt < minGap) return false;
        events.push({ t, kind: 'blink', amount: 1 });
        lastBlinkAt = t;
        return true;
    };

    // Débuts de phrase et de proposition : d'après la ponctuation du mot précédent.
    for (let wi = 0; wi < words.length; wi += 1) {
        const word = words[wi];
        const previous = wi > 0 ? words[wi - 1] : null;
        const startsSentence = wi === 0 || previous?.punctuation === '.';
        const startsClause = !startsSentence && previous?.punctuation === ',';
        if (startsSentence) {
            sentenceIndex += 1;
            const h = hash01(sentenceIndex * 7 + 3);
            const t = word.start;
            events.push({ t: t - PHRASE_LEAD_MS, kind: 'lift', amount: 1, untilMs: t + 200 });
            events.push({ t: t - PHRASE_LEAD_MS, kind: 'brow', amount: 0.45 + 0.3 * h, untilMs: t + 200 + 150 * h });
            // Une phrase sur deux : le regard s'échappe avant le premier mot et revient sur la première syllabe forte.
            const r = hash01(sentenceIndex * 11 + 5);
            const sentenceWords = words.slice(wi, words.findIndex((w, k) => k >= wi && w.punctuation === '.') + 1 || undefined);
            if (r > 0.5 && sentenceWords.length >= 3) {
                const firstStress = phones.find((p) => p.start >= t && p.stress >= 1);
                const until = Math.min(firstStress ? firstStress.start : t + 700, t + 700);
                events.push({ t: t - GAZE_LEAD_MS, kind: 'gaze', amount: 1, x: (r > 0.75 ? 1 : -1) * (0.45 + 0.3 * r), y: -0.25 - 0.2 * r, untilMs: until });
                // On cligne souvent en déplaçant le regard (la saccade cache le clignement).
                if (hash01(sentenceIndex * 3 + 1) > 0.35) blink(t - GAZE_LEAD_MS);
            }
        } else if (startsClause) {
            events.push({ t: word.start - 100, kind: 'brow', amount: 0.3, untilMs: word.start + 200 });
        }
    }

    // Syllabes accentuées → hochements anticipés ; pauses → clignements et inclinaisons ; secours en parole continue.
    const pauseStarts = phones
        .filter((p) => p.phone === '_' && (p.punctuation === ',' || p.punctuation === '.') && p.end - p.start >= 60)
        .map((p) => p.start);
    const pauseSoonAfter = (t: number): boolean => pauseStarts.some((s) => s >= t && s - t <= 1500);
    let beatIndex = 0;
    let pauseIndex = 0;
    for (const p of phones) {
        if (p.phone === '_') {
            const d = p.end - p.start;
            if ((p.punctuation === ',' || p.punctuation === '.') && d >= 60) {
                pauseIndex += 1;
                blink(p.start + 40);
                if (p.punctuation === '.') {
                    tiltSign = -tiltSign;
                    events.push({ t: p.start + 100, kind: 'tilt', amount: tiltSign * (1.2 + 1.0 * hash01(pauseIndex * 5 + 2)) });
                }
            }
            continue;
        }
        if (p.stress >= 0.5 && p.start - lastNodAt >= BEAT_MIN_GAP_MS) {
            beatIndex += 1;
            const h = hash01(beatIndex);
            if (h > 0.2) {
                lastNodAt = p.start;
                events.push({ t: p.start - NOD_LEAD_MS, kind: 'nod', amount: p.stress >= 1 ? 0.6 + 0.4 * h : 0.35 + 0.25 * h });
            }
        }
        // Trop longtemps sans cligner : à la fin de cette syllabe, jamais en
        // pleine voyelle — sauf si une pause arrive dans la seconde et demie :
        // on cligne alors dans la pause, comme un orateur.
        if (p.end - lastBlinkAt >= SCORE_BLINK_MAX_GAP_MS && !pauseSoonAfter(p.end)) blink(p.end);
    }
    // Fin de parole : un dernier clignement (souvent) et la tête revient droite.
    const last = phones[phones.length - 1];
    const endAt = last.phone === '_' ? last.start : last.end;
    if (hash01(words.length * 3 + 2) > 0.35) blink(endAt + 150);
    events.push({ t: endAt + 400, kind: 'tilt', amount: 0 });
    events.sort((a, b) => a.t - b.t);
    return { events, durationMs: track.durationMs };
}

export interface ScoreTracker {
    score: ProsodyScore;
    cursor: number;
    lastT: number;
    nodUntil: number;
    nodAmount: number;
    liftUntil: number;
    browUntil: number;
    browAmount: number;
    gazeUntil: number;
    gazeTarget: { x: number; y: number };
    tiltTarget: number;
    /** Départ du clignement en cours, en ms de PISTE. */
    blinkStartedAt: number | null;
    nodY: Spring;
    nodR: Spring;
    lift: Spring;
    brow: Spring;
    gazeX: Spring;
    gazeY: Spring;
    tilt: Spring;
    turn: Spring;
}

export function createScoreTracker(score: ProsodyScore): ScoreTracker {
    const spring = (): Spring => ({ x: 0, v: 0 });
    return {
        score, cursor: 0, lastT: -Infinity,
        nodUntil: -Infinity, nodAmount: 0, liftUntil: -Infinity, browUntil: -Infinity, browAmount: 0,
        gazeUntil: -Infinity, gazeTarget: { x: 0, y: 0 }, tiltTarget: 0, blinkStartedAt: null,
        nodY: spring(), nodR: spring(), lift: spring(), brow: spring(), gazeX: spring(), gazeY: spring(), tilt: spring(), turn: spring(),
    };
}

export interface ScoreInput {
    /** Instant courant, en ms de piste (peut être négatif avant le premier son). */
    t: number;
    dtMs: number;
    /** Horloge de la pose (ms écoulées) au même instant : pour dater le clignement dans cette horloge. */
    elapsedMs: number;
}

/**
 * Fait avancer la partition jusqu'à `t` et rend les gestes à appliquer. Un
 * retour en arrière de l'horloge (relecture) rembobine la partition.
 */
export function updateScore(tr: ScoreTracker, input: ScoreInput): GestureState {
    const { t, dtMs } = input;
    if (t < tr.lastT - 200) {
        tr.cursor = 0;
        tr.blinkStartedAt = null;
    }
    tr.lastT = t;
    const events = tr.score.events;
    while (tr.cursor < events.length && events[tr.cursor].t <= t) {
        const e = events[tr.cursor];
        tr.cursor += 1;
        // Un événement dépassé de beaucoup (onglet caché, saut) n'est pas rejoué.
        if (t - e.t > 400) continue;
        switch (e.kind) {
            case 'nod': tr.nodAmount = e.amount; tr.nodUntil = e.t + 130; break;
            case 'lift': tr.liftUntil = e.untilMs ?? e.t + 320; break;
            case 'brow': tr.browAmount = e.amount; tr.browUntil = e.untilMs ?? e.t + 350; break;
            case 'gaze': tr.gazeTarget = { x: e.x ?? 0, y: e.y ?? 0 }; tr.gazeUntil = e.untilMs ?? e.t + 500; break;
            case 'blink': tr.blinkStartedAt = e.t; break;
            case 'tilt': tr.tiltTarget = e.amount; break;
            default: break;
        }
    }
    const nodTarget = t < tr.nodUntil ? tr.nodAmount : 0;
    const liftTarget = t < tr.liftUntil ? 1 : 0;
    const browTarget = t < tr.browUntil ? tr.browAmount : 0;
    const gaze = t < tr.gazeUntil ? tr.gazeTarget : { x: 0, y: 0 };
    stepSpring(tr.nodY, nodTarget, 24, dtMs);
    stepSpring(tr.nodR, nodTarget, 24, dtMs);
    stepSpring(tr.lift, liftTarget, 14, dtMs);
    stepSpring(tr.brow, browTarget, 20, dtMs);
    stepSpring(tr.gazeX, gaze.x, 15, dtMs);
    stepSpring(tr.gazeY, gaze.y, 15, dtMs);
    // La tête SUIT le regard, plus lentement et pour un quart du chemin.
    stepSpring(tr.turn, gaze.x * 0.25, 7, dtMs);
    stepSpring(tr.tilt, tr.tiltTarget, 2.6, dtMs);
    if (tr.blinkStartedAt !== null && t > tr.blinkStartedAt + BLINK_DURATION_MS + 50) tr.blinkStartedAt = null;
    return {
        nodY: tr.nodY.x * 0.95 + 0,
        nodRotate: tr.nodR.x * 0.8 + 0,
        liftY: -tr.lift.x * 0.55 + 0,
        tilt: tr.tilt.x + 0,
        brow: tr.brow.x + 0,
        gazeX: tr.gazeX.x + 0,
        gazeY: tr.gazeY.x + 0,
        turnX: tr.turn.x + 0,
        // Daté dans l'horloge de la pose : la piste et la pose n'ont pas la même origine.
        blinkStartedAt: tr.blinkStartedAt !== null ? input.elapsedMs - (t - tr.blinkStartedAt) : null,
    };
}

/**
 * Quand la piste s'achève (fin de parole), le suiveur réactif reprend la
 * main : il hérite de l'état des ressorts pour que rien ne saute — la tête
 * revient droite en douceur au lieu de se redresser d'un coup.
 */
export function adoptSprings(from: ScoreTracker, to: ProsodyTracker): void {
    const copy = (a: Spring, b: Spring) => { b.x = a.x; b.v = a.v; };
    copy(from.nodY, to.nodY);
    copy(from.nodR, to.nodR);
    copy(from.lift, to.lift);
    copy(from.brow, to.brow);
    copy(from.gazeX, to.gazeX);
    copy(from.gazeY, to.gazeY);
    copy(from.tilt, to.tilt);
    to.tiltTarget = from.tiltTarget;
}
