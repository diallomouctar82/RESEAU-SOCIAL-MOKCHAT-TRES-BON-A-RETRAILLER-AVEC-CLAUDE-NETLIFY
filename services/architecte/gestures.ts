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
    /** Clignement demandé dans une pause : instant de départ (horloge de l'appelant), sinon `null`. */
    blinkStartedAt: number | null;
}

export const GESTURE_AT_REST: GestureState = {
    nodY: 0, nodRotate: 0, liftY: 0, tilt: 0, brow: 0, gazeX: 0, gazeY: 0, blinkStartedAt: null,
};

/** Ouverture (normalisée 0..1) au-dessus de laquelle une syllabe commence, en dessous de laquelle elle finit. */
export const SYLLABLE_OPEN = 0.3;
export const SYLLABLE_CLOSE = 0.12;
/** Un temps fort ne se marque pas plus souvent que ça : au-delà, la tête sautille. */
export const BEAT_MIN_GAP_MS = 420;
/** Niveau de voix à partir duquel une syllabe est un temps fort. */
export const BEAT_LOUDNESS = 0.7;
/** Silence avant une syllabe qui en fait un début de phrase. */
export const PHRASE_GAP_MS = 500;
/** Silence continu qui devient une pause (clignement, regard). */
export const PAUSE_MS = 240;
/** Silence continu qui devient une fin de phrase (nouvelle inclinaison). */
export const SENTENCE_END_MS = 650;
/** Deux clignements demandés ne se suivent pas de plus près. */
export const BLINK_MIN_GAP_MS = 2500;
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
            // Début de phrase : première syllabe, ou syllabe après un vrai silence.
            if (tr.syllables === 1 || t - tr.lastOnsetAt >= PHRASE_GAP_MS) {
                tr.phraseIndex += 1;
                const h = hash01(tr.phraseIndex * 7 + 3);
                tr.browAmount = 0.3 + 0.3 * h;
                tr.browUntil = t + 260 + 120 * h;
                tr.liftUntil = t + 280;
            }
            // Temps fort : trois sur quatre hochent, à des amplitudes différentes —
            // jamais tous, jamais pareil.
            if (loud >= BEAT_LOUDNESS && t - tr.lastBeatAt >= BEAT_MIN_GAP_MS) {
                tr.lastBeatAt = t;
                const h = hash01(tr.syllables);
                if (h > 0.25) {
                    tr.nodAmount = 0.55 + 0.45 * h;
                    tr.nodUntil = t + 120;
                }
            }
            tr.lastOnsetAt = t;
        } else if (open <= SYLLABLE_CLOSE && tr.open) {
            tr.open = false;
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
                if (h > 0.3) {
                    tr.gazeTarget = { x: (h > 0.65 ? 1 : -1) * (0.35 + 0.25 * h), y: -0.2 - 0.15 * h };
                    tr.gazeUntil = t + 380 + 200 * h;
                }
            }
            if (tr.silenceMs >= SENTENCE_END_MS && !tr.sentenceNoted) {
                tr.sentenceNoted = true;
                tr.tiltSign = -tr.tiltSign;
                tr.tiltTarget = tr.tiltSign * (0.8 + 1.0 * hash01(tr.pauseIndex * 5 + 2));
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
    return {
        nodY: tr.nodY.x * 0.45 + 0,
        nodRotate: tr.nodR.x * 0.35 + 0,
        liftY: -tr.lift.x * 0.3 + 0,
        tilt: tr.tilt.x + 0,
        brow: tr.brow.x + 0,
        gazeX: tr.gazeX.x + 0,
        gazeY: tr.gazeY.x + 0,
        blinkStartedAt: tr.blinkStartedAt,
    };
}
