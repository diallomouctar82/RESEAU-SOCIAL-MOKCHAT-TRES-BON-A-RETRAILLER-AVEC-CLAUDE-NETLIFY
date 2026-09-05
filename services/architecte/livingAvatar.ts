/**
 * AVATAR VIVANT — le mouvement qui fait qu'un portrait cesse d'être une image.
 *
 * Écrit d'après la compétence AI Core, playbook 15 § 3 « Animation vivante
 * légère » : respiration lente et NON MÉCANIQUE, clignement discret À
 * VARIATION NATURELLE, micro-mouvements de tête, le tout en CSS/SVG et jamais
 * en vidéo bouclée.
 *
 * Ce module est PUR et DÉTERMINISTE : il transforme un temps écoulé (en
 * millisecondes) en une pose. Aucune horloge interne, aucun `Math.random`,
 * aucun `requestAnimationFrame` — c'est l'appelant qui fournit le temps. Le
 * mouvement est donc entièrement vérifiable par test, ce qui est la seule
 * façon de prouver qu'il ne « boucle » pas mécaniquement.
 *
 * Il ne dépend d'aucune photo : il produit des transformations que le rendu
 * applique à n'importe quel portrait correctement calé (voir `PortraitRig`).
 */

// ─────────────────────────────────────────────────────────────────────────
// 1. CALAGE DU PORTRAIT
// ─────────────────────────────────────────────────────────────────────────

/**
 * Où se trouvent les éléments animables sur CE portrait, en pourcentage du
 * cadre. Sans ce calage, aucune animation crédible n'est possible : le code
 * ne peut pas deviner où sont les yeux et la mâchoire d'un visage qu'il n'a
 * jamais vu. C'est réglé une fois au Super-Admin, par photo.
 */
/**
 * Part du chemin parcourue vers une cible en `dtMs`, pour une constante de
 * temps `tauMs` : le même geste quelle que soit la cadence d'images. Les
 * constantes ci-dessous reproduisent exactement les facteurs par image
 * réglés à 60 i/s (0,06 · 0,035 · 0,08 · 0,12) et les rendent valables à
 * 30 ou 120 Hz.
 */
export function easeFactor(tauMs: number, dtMs: number): number {
    const dt = Number.isFinite(dtMs) && dtMs > 0 ? Math.min(dtMs, 100) : 1000 / 60;
    if (!Number.isFinite(tauMs) || tauMs <= 0) return 1;
    return 1 - Math.exp(-dt / tauMs);
}
/** Emphase (hochements sur le phrasé) : monte en ~270 ms, retombe en ~470 ms. */
export const EMPHASIS_RISE_MS = 269;
export const EMPHASIS_FALL_MS = 468;
/** Passage repos ↔ parole : ~200 ms. */
export const SPEAKING_BLEND_MS = 200;
/** Entrée/sortie d'une attitude d'écoute ou de réflexion : ~270 ms. */
export const ATTENTION_BLEND_MS = 269;
/** Largeur des lèvres d'une forme à la suivante : ~130 ms. */
export const LIP_WIDTH_MS = 130;

import type { GestureState } from './gestures';

export interface PortraitRig {
    /** Ligne des yeux (0 = haut du cadre, 100 = bas). */
    eyeLinePercent: number;
    /** Hauteur de la bande de paupière — l'épaisseur de l'œil visible. */
    eyeBandPercent: number;
    /** Ligne d'ouverture de la mâchoire : tout ce qui est en dessous descend. */
    jawLinePercent: number;
    /** Amplitude maximale de descente de la mâchoire, en % de la hauteur. */
    jawTravelPercent: number;
    /** Bas du menton : en dessous, la peau se comprime vers le cou — qui, lui, ne bouge pas. */
    chinLinePercent: number;
    /** Centre de chaque œil (0 = bord gauche, 100 = bord droit) — pour le regard et les paupières. */
    eyeLeftXPercent: number;
    eyeRightXPercent: number;
    /** Largeur d'un œil, en % de la largeur du cadre. */
    eyeWidthPercent: number;
    /** Ligne des sourcils (0 = haut, 100 = bas) — pour le haussement sur l'emphase. */
    browLinePercent: number;
}

export const DEFAULT_PORTRAIT_RIG: PortraitRig = {
    // Relevé sur le portrait DE FACE livré (`public/architecte/architecte.webp`) :
    // la photo validée par la Direction le 05/09/2026, cadrée au portrait d'usine
    // (pupilles à 46,3 % de la hauteur, écart 21,4 % de la largeur) et mesurée
    // par le MÊME moteur que l'option Super-Admin « avatar vivant depuis une
    // photo » (478 repères du visage, aucun avertissement).
    eyeLinePercent: 46.3,
    eyeBandPercent: 3.1,
    // La ligne de mâchoire est posée ENTRE LES LÈVRES : la lèvre du haut reste
    // fixe, celle du bas descend — c'est ainsi qu'une bouche s'ouvre.
    jawLinePercent: 64.9,
    jawTravelPercent: 5.7,
    // Menton à 78,7 %, pupilles à 39,3 et 60,7 % de la largeur, œil large de 8,1 %.
    chinLinePercent: 78.7,
    eyeLeftXPercent: 39.3,
    eyeRightXPercent: 60.7,
    eyeWidthPercent: 8.1,
    browLinePercent: 39.9,
};

export function clampPortraitRig(rig: Partial<PortraitRig>): PortraitRig {
    const clamp = (v: number, min: number, max: number, fallback: number) =>
        Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
    return {
        eyeLinePercent: clamp(rig.eyeLinePercent!, 5, 95, DEFAULT_PORTRAIT_RIG.eyeLinePercent),
        eyeBandPercent: clamp(rig.eyeBandPercent!, 2, 25, DEFAULT_PORTRAIT_RIG.eyeBandPercent),
        jawLinePercent: clamp(rig.jawLinePercent!, 10, 98, DEFAULT_PORTRAIT_RIG.jawLinePercent),
        jawTravelPercent: clamp(rig.jawTravelPercent!, 0, 12, DEFAULT_PORTRAIT_RIG.jawTravelPercent),
        chinLinePercent: clamp(rig.chinLinePercent!, 20, 99, DEFAULT_PORTRAIT_RIG.chinLinePercent),
        eyeLeftXPercent: clamp(rig.eyeLeftXPercent!, 5, 95, DEFAULT_PORTRAIT_RIG.eyeLeftXPercent),
        eyeRightXPercent: clamp(rig.eyeRightXPercent!, 5, 95, DEFAULT_PORTRAIT_RIG.eyeRightXPercent),
        eyeWidthPercent: clamp(rig.eyeWidthPercent!, 2, 30, DEFAULT_PORTRAIT_RIG.eyeWidthPercent),
        browLinePercent: clamp(rig.browLinePercent!, 5, 90, DEFAULT_PORTRAIT_RIG.browLinePercent),
    };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. RESPIRATION
// ─────────────────────────────────────────────────────────────────────────

/** ~14 respirations par minute au repos : le rythme d'une personne calme. */
export const BREATH_PERIOD_MS = 4300;
/** Seconde onde, de période volontairement NON multiple de la première. */
const BREATH_DRIFT_PERIOD_MS = 6700;

/**
 * Amplitude de respiration, entre -1 (fin d'expiration) et 1 (fin
 * d'inspiration).
 *
 * Deux sinusoïdes de périodes incommensurables plutôt qu'une seule : une
 * sinusoïde pure se reconnaît immédiatement comme une boucle de machine, ce
 * que le playbook interdit explicitement (« respiration lente et NON
 * MÉCANIQUE »). Leur somme ne se répète qu'après plusieurs minutes.
 */
export function breathPhase(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs)) return 0;
    const principal = Math.sin((2 * Math.PI * elapsedMs) / BREATH_PERIOD_MS);
    const derive = Math.sin((2 * Math.PI * elapsedMs) / BREATH_DRIFT_PERIOD_MS);
    return principal * 0.82 + derive * 0.18;
}

// ─────────────────────────────────────────────────────────────────────────
// 3. CLIGNEMENT
// ─────────────────────────────────────────────────────────────────────────

/** Durée d'un clignement humain : bref. Au-delà, l'avatar a l'air endormi. */
export const BLINK_DURATION_MS = 220;

/**
 * Intervalles entre clignements, en millisecondes.
 *
 * Table FIXE et irrégulière plutôt qu'un `Math.random` : le playbook demande
 * une « variation naturelle », et un test ne peut rien prouver sur du hasard.
 * Les valeurs sont volontairement quelconques ; leur somme (≈ 78 s) est assez
 * longue pour qu'aucun œil ne perçoive la reprise du cycle.
 */
export const BLINK_INTERVALS_MS = [
    3100, 4700, 2600, 5900, 3400, 6300, 2900, 4100, 5200, 3700,
    6800, 2500, 4400, 5600, 3200, 4900,
] as const;

const BLINK_CYCLE_MS = BLINK_INTERVALS_MS.reduce((total, ms) => total + ms, 0);

/**
 * Fermeture de la paupière à l'instant donné : 0 = œil ouvert, 1 = fermé.
 *
 * La fermeture est plus rapide que la réouverture (35 % / 65 % de la durée),
 * comme un vrai clignement — une courbe symétrique donne un battement de
 * poupée.
 */
export function blinkAmount(elapsedMs: number): number {
    return Math.max(tableBlinkAmount(elapsedMs), saccadeBlinkAmount(elapsedMs));
}

/**
 * Courbe d'un clignement, `sinceStartMs` après son départ : fermeture plus
 * rapide que la réouverture (35 % / 65 %). 0 hors de la durée du clignement.
 */
export function blinkCurve(sinceStartMs: number): number {
    if (!Number.isFinite(sinceStartMs) || sinceStartMs < 0 || sinceStartMs >= BLINK_DURATION_MS) return 0;
    const phase = sinceStartMs / BLINK_DURATION_MS;
    return phase < 0.35 ? phase / 0.35 : 1 - (phase - 0.35) / 0.65;
}

/** Clignements de la table fixe seulement (sans ceux liés aux saccades). */
export function tableBlinkAmount(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
    const position = elapsedMs % BLINK_CYCLE_MS;
    let curseur = 0;
    for (const intervalle of BLINK_INTERVALS_MS) {
        const debut = curseur + intervalle;
        if (position < debut) return 0; // entre deux clignements : œil ouvert
        if (position < debut + BLINK_DURATION_MS) return blinkCurve(position - debut);
        curseur = debut + BLINK_DURATION_MS;
    }
    return 0;
}

// ─────────────────────────────────────────────────────────────────────────
// 4. MICRO-MOUVEMENTS DE TÊTE
// ─────────────────────────────────────────────────────────────────────────

/**
 * Dérive lente de la tête. Trois périodes premières entre elles : le
 * mouvement ne se répète pas à l'échelle d'une session, et ne peut donc pas
 * être perçu comme une boucle.
 */
export function headDrift(elapsedMs: number): { rotate: number; x: number; y: number } {
    if (!Number.isFinite(elapsedMs)) return { rotate: 0, x: 0, y: 0 };
    const t = elapsedMs / 1000;
    return {
        // Degrés. Relevé le 04/09 après retour de la Direction : la première
        // valeur (±0,8°) était invisible à l'écran. Un mouvement qui ne se
        // constate pas ne sert à rien ; au-delà de ~3°, la tête « flotte ».
        rotate: Math.sin(t / 4.7) * 2.1 + Math.sin(t / 8.9) * 0.8,
        // Pourcentages du cadre.
        x: Math.sin(t / 6.3) * 1.45,
        y: Math.cos(t / 5.1) * 0.95,
    };
}

/**
 * GESTES — ce qui distingue une présence d'une image qui bouge.
 *
 * Deux familles, toutes deux déterministes :
 *  - au repos, une INCLINAISON lente de la tête revient à intervalles
 *    irréguliers (table fixe), comme quelqu'un qui écoute ;
 *  - en parole, de petits HOCHEMENTS accompagnent les syllabes fortes — la
 *    tête suit la voix, pas seulement la bouche.
 */
export const TILT_INTERVALS_MS = [7400, 11200, 6100, 9800, 12600, 8300] as const;
const TILT_DURATION_MS = 2200;
const TILT_CYCLE_MS = TILT_INTERVALS_MS.reduce((a, b) => a + b, 0);

/** Inclinaison de repos, en degrés, sur une demi-sinusoïde douce (0 hors geste). */
export function restTilt(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
    const position = elapsedMs % TILT_CYCLE_MS;
    let curseur = 0;
    let signe = 1;
    for (const intervalle of TILT_INTERVALS_MS) {
        const debut = curseur + intervalle;
        if (position < debut) return 0;
        if (position < debut + TILT_DURATION_MS) {
            const phase = (position - debut) / TILT_DURATION_MS;
            return Math.sin(phase * Math.PI) * 4.2 * signe;
        }
        curseur = debut + TILT_DURATION_MS;
        signe = -signe; // on alterne le côté d'un geste à l'autre
    }
    return 0;
}

/**
 * Hochement de parole : la tête accompagne le PHRASÉ, pas chaque syllabe.
 *
 * Première version : proportionnel à l'ouverture de bouche instantanée — la
 * tête sautillait à chaque syllabe, à 4-6 Hz, comme une marionnette (« pas
 * naturel », Direction, 04/09). L'entrée est désormais l'EMPHASE : une
 * enveloppe lente de la voix (≈ 0,4 s), calculée par l'appelant.
 */
export function speechNod(emphasis: number): { y: number; rotate: number } {
    const e = Math.min(1, Math.max(0, Number.isFinite(emphasis) ? emphasis : 0));
    // Réduit le 05/09 : les temps forts sont marqués par les gestes de prosodie
    // (services/architecte/gestures.ts) ; l'emphase ne porte plus qu'un fond.
    return { y: e * 0.45, rotate: e * 0.35 };
}

/**
 * Lèvres entrouvertes pendant une phrase : entre deux syllabes, une bouche qui
 * se referme complètement CLAQUE. Plancher d'ouverture à appliquer avant le
 * lissage, tant que l'Architecte parle.
 */
export const LIPS_PARTED_WHILE_SPEAKING = 0.05;

/**
 * Largeur de bouche pendant la parole : une bouche qui parle s'arrondit et
 * s'étire, elle ne fait pas que s'ouvrir. Facteur autour de 1, deux périodes
 * incommensurables — jamais un battement régulier. 1 hors parole.
 */
export function mouthWidthFactor(elapsedMs: number, speaking: boolean): number {
    if (!speaking || !Number.isFinite(elapsedMs)) return 1;
    const t = elapsedMs / 1000;
    return 1 + 0.08 * Math.sin((2 * Math.PI * t) / 0.93) + 0.06 * Math.sin((2 * Math.PI * t) / 1.71);
}

// ─────────────────────────────────────────────────────────────────────────
// 4 bis. REGARD
// ─────────────────────────────────────────────────────────────────────────

/**
 * Saccades du regard : à intervalles irréguliers, les yeux partent
 * brièvement de côté puis reviennent sur l'interlocuteur. Un regard
 * parfaitement fixe est ce qui trahit le plus vite une image.
 * Déplacements en % du cadre — moins d'un pour cent : la pupille bouge,
 * pas la tête.
 */
export const GAZE_INTERVALS_MS = [5200, 8700, 4100, 11300, 6600, 9400] as const;
const GAZE_TARGETS: readonly (readonly [number, number])[] = [
    [-0.9, 0.1], [0.7, -0.1], [-0.5, 0.2], [1.0, 0], [0.6, 0.2], [-0.8, -0.1],
];
const GAZE_HOLDS_MS = [900, 1400, 700, 1100, 1600, 800] as const;
/** Durée d'une saccade (aller ou retour) : un regard se déplace vite. */
export const GAZE_MOVE_MS = 90;
const GAZE_CYCLE_MS = GAZE_INTERVALS_MS.reduce((a, b, i) => a + b + 2 * GAZE_MOVE_MS + GAZE_HOLDS_MS[i], 0);

const smoothstep = (s: number) => s * s * (3 - 2 * s);

/** Instants de départ des saccades dans un cycle, et leur cible. */
export function gazeSaccadeStarts(): readonly { at: number; x: number; y: number }[] {
    const starts: { at: number; x: number; y: number }[] = [];
    let curseur = 0;
    for (let i = 0; i < GAZE_INTERVALS_MS.length; i += 1) {
        const depart = curseur + GAZE_INTERVALS_MS[i];
        starts.push({ at: depart, x: GAZE_TARGETS[i][0], y: GAZE_TARGETS[i][1] });
        curseur = depart + 2 * GAZE_MOVE_MS + GAZE_HOLDS_MS[i];
    }
    return starts;
}

/**
 * On cligne souvent au moment où l'on déplace le regard : une saccade sur
 * deux s'accompagne d'un clignement qui la précède de 40 ms. Sans ce
 * couplage, regard et paupières vivent chacun leur vie — et ça se voit.
 */
export function saccadeBlinkAmount(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
    const position = elapsedMs % GAZE_CYCLE_MS;
    const starts = gazeSaccadeStarts();
    for (let i = 0; i < starts.length; i += 2) {
        const debut = starts[i].at - 40;
        if (position >= debut && position < debut + BLINK_DURATION_MS) {
            const phase = (position - debut) / BLINK_DURATION_MS;
            return phase < 0.35 ? phase / 0.35 : 1 - (phase - 0.35) / 0.65;
        }
    }
    return 0;
}

/** Ce vers quoi l'attention est tournée — change la posture du regard et de la tête. */
export type Attention = 'listening' | 'thinking' | null;

/**
 * Regard de réflexion : les yeux partent en haut, de côté, et y restent
 * en dérivant lentement — le geste universel de « je réfléchis ».
 */
export function thinkingGaze(elapsedMs: number): { x: number; y: number } {
    if (!Number.isFinite(elapsedMs)) return { x: 0, y: 0 };
    const t = elapsedMs / 1000;
    return { x: 0.75 + Math.sin(t / 1.9) * 0.15, y: -0.45 + Math.sin(t / 2.7) * 0.1 };
}

/**
 * Hochement d'écoute : de petits « oui » brefs à intervalles réguliers mais
 * espacés (~2,7 s), en % du cadre. Signale que l'on suit, sans agiter la tête.
 */
export function listeningNod(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs)) return 0;
    const s = Math.max(0, Math.sin((2 * Math.PI * elapsedMs) / 2700));
    return 0.35 * s * s * s;
}

/**
 * Haussement de sourcils au repos : de loin en loin, léger et lent (0..1).
 * En parole, l'emphase s'y ajoute — un visage qui parle bouge des sourcils.
 */
export function idleBrowRaise(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs)) return 0;
    const s = Math.max(0, Math.sin((2 * Math.PI * elapsedMs) / 9100));
    return 0.25 * s ** 6;
}

export function gazeOffset(elapsedMs: number): { x: number; y: number } {
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return { x: 0, y: 0 };
    const position = elapsedMs % GAZE_CYCLE_MS;
    let curseur = 0;
    for (let i = 0; i < GAZE_INTERVALS_MS.length; i += 1) {
        const depart = curseur + GAZE_INTERVALS_MS[i];
        if (position < depart) return { x: 0, y: 0 };
        const [tx, ty] = GAZE_TARGETS[i];
        const arrivee = depart + GAZE_MOVE_MS;
        const finTenue = arrivee + GAZE_HOLDS_MS[i];
        const retour = finTenue + GAZE_MOVE_MS;
        if (position < arrivee) {
            const k = smoothstep((position - depart) / GAZE_MOVE_MS);
            return { x: tx * k, y: ty * k };
        }
        if (position < finTenue) return { x: tx, y: ty };
        if (position < retour) {
            const k = 1 - smoothstep((position - finTenue) / GAZE_MOVE_MS);
            return { x: tx * k, y: ty * k };
        }
        curseur = retour;
    }
    return { x: 0, y: 0 };
}

/** Période du balancement latéral de parole — lent, jamais un tic. */
export const SPEECH_SWAY_PERIOD_MS = 2600;

/**
 * Balancement latéral pendant la parole, en % du cadre : quelqu'un qui
 * parle ne garde pas la tête vissée — elle se déplace un peu d'un côté à
 * l'autre au fil de la phrase. Nul hors parole (l'appelant ne l'ajoute pas).
 */
export function speechSway(elapsedMs: number): number {
    if (!Number.isFinite(elapsedMs)) return 0;
    // Deux périodes sans rapport simple et une amplitude divisée par deux : un
    // balancement à période unique de ±0,8 % lisait comme un métronome
    // (Direction, 05/09 : « stabilité », « pas naturel »).
    return Math.sin((2 * Math.PI * elapsedMs) / SPEECH_SWAY_PERIOD_MS) * 0.3
        + Math.sin((2 * Math.PI * elapsedMs) / (SPEECH_SWAY_PERIOD_MS * 1.63)) * 0.15;
}

// ─────────────────────────────────────────────────────────────────────────
// 5. POSE COMPLÈTE
// ─────────────────────────────────────────────────────────────────────────

export interface LivingPose {
    /** Échelle de respiration appliquée à tout le portrait. */
    breathScale: number;
    /** Translation verticale de respiration, en % du cadre. */
    breathY: number;
    headRotate: number;
    headX: number;
    headY: number;
    /** 0 = œil ouvert, 1 = paupière close. */
    eyelid: number;
    /** 0 = bouche close, 1 = mâchoire à son ouverture maximale. */
    jawOpen: number;
    /** Facteur de largeur de la bouche (1 = largeur de la photo). */
    mouthWidth: number;
    /** Déplacement du regard, en % du cadre. */
    gazeX: number;
    gazeY: number;
    /** Haussement des sourcils (0 = au repos, 1 = maximum). */
    browRaise: number;
    /** Dents visibles entre des lèvres à peine entrouvertes (fricatives), 0..1. */
    mouthTeeth: number;
}

/** Pose strictement immobile — mouvement réduit, onglet caché, hors écran, réglage coupé. */
export const STILL_POSE: LivingPose = {
    breathScale: 1,
    breathY: 0,
    headRotate: 0,
    headX: 0,
    headY: 0,
    eyelid: 0,
    jawOpen: 0,
    mouthWidth: 1,
    gazeX: 0,
    gazeY: 0,
    browRaise: 0,
    mouthTeeth: 0,
};

export interface LivingPoseInputs {
    elapsedMs: number;
    /** Ouverture de bouche issue de la synchro labiale (0..1). */
    mouthOpenness: number;
    /**
     * Emphase de la voix (0..1) : enveloppe LENTE de l'ouverture, lissée par
     * l'appelant sur ~0,4 s. Pilote les hochements. Absente = pas de hochement.
     */
    emphasis?: number;
    /** `false` = pose figée. Décidé par l'appelant (`shouldAnimate`). */
    animated: boolean;
    /**
     * `true` quand l'Architecte parle : on ne cligne pas et on ne respire
     * qu'à peine pendant une phrase — l'attention doit aller à la bouche.
     */
    speaking: boolean;
    /**
     * Part « parole » LISSÉE (0..1), fournie par l'appelant sur ~200 ms.
     * Sans elle, chaque bascule parole ↔ repos faisait sauter d'un coup la
     * respiration, le balancement et l'inclinaison — un à-coup visible à
     * chaque fin de phrase (vu sur le journal de pose du rendu). Absente =
     * `speaking` converti en 0/1.
     */
    speakingBlend?: number;
    /**
     * Largeur de bouche décidée par l'appelant (forme de lèvres de la syllabe
     * en cours, déjà lissée). Absente = variation générique en parole.
     */
    mouthWidth?: number;
    /** Vers quoi l'attention est tournée, et sa part lissée (0..1). */
    attention?: Attention;
    attentionBlend?: number;
    /** Dents visibles (fricatives), déjà lissé par l'appelant. */
    mouthTeeth?: number;
    /** Gestes portés par la parole (services/architecte/gestures.ts), déjà lissés par ressorts. */
    gesture?: GestureState | null;
}

/**
 * La pose à appliquer, à cet instant précis.
 *
 * Point d'entrée UNIQUE du rendu : c'est la seule fonction à vérifier pour
 * savoir ce qui bouge à l'écran, et rien ne bouge sans passer par elle.
 */
export function resolveLivingPose(inputs: LivingPoseInputs): LivingPose {
    const jawOpen = Math.min(1, Math.max(0, Number.isFinite(inputs.mouthOpenness) ? inputs.mouthOpenness : 0));

    // Immobile : la bouche AUSSI. Une bouche qui s'agite sur un visage figé
    // est plus dérangeante qu'un portrait parfaitement statique.
    if (!inputs.animated) return { ...STILL_POSE, jawOpen: 0 };

    const respiration = breathPhase(inputs.elapsedMs);
    const derive = headDrift(inputs.elapsedMs);
    // Toute influence de la parole passe par une part LISSÉE : rien ne saute
    // quand une phrase commence ou finit.
    const blend = Math.min(1, Math.max(0, Number.isFinite(inputs.speakingBlend!) ? inputs.speakingBlend! : inputs.speaking ? 1 : 0));
    // Respiration atténuée pendant la parole : la poitrine se calme quand on
    // parle, et le mouvement de fond ne doit pas concurrencer la bouche.
    const ampleur = 1 - 0.4 * blend;

    const emphasis = Math.min(1, Math.max(0, Number.isFinite(inputs.emphasis!) ? inputs.emphasis! : 0));
    // L'emphase est déjà une enveloppe lente : le hochement s'éteint de
    // lui-même en fin de phrase, sans coupure.
    const nod = speechNod(emphasis);
    // Attention : réflexion → regard en haut de côté ; écoute → petits « oui »
    // et saccades réduites. Toujours par part lissée : rien ne saute.
    const att = Math.min(1, Math.max(0, Number.isFinite(inputs.attentionBlend!) ? inputs.attentionBlend! : inputs.attention ? 1 : 0));
    const saccade = gazeOffset(inputs.elapsedMs);
    const pensif = inputs.attention === 'thinking' ? thinkingGaze(inputs.elapsedMs) : { x: 0, y: 0 };
    const reflexion = inputs.attention === 'thinking' ? att : 0;
    const ecoute = inputs.attention === 'listening' ? att : 0;
    const nodEcoute = listeningNod(inputs.elapsedMs) * ecoute;
    const regard = {
        x: saccade.x * (1 - 0.5 * ecoute) * (1 - reflexion) + pensif.x * reflexion,
        y: saccade.y * (1 - 0.5 * ecoute) * (1 - reflexion) + pensif.y * reflexion,
    };
    const sway = speechSway(inputs.elapsedMs) * blend;
    // L'inclinaison d'écoute continue pendant la parole : la couper à la
    // volée faisait basculer la tête d'un coup en fin de phrase.
    const tilt = restTilt(inputs.elapsedMs);
    const g = inputs.gesture ?? null;
    const blinkDemande = g && g.blinkStartedAt !== null ? blinkCurve(inputs.elapsedMs - g.blinkStartedAt) : 0;
    // PENDANT LA PAROLE, le mouvement suit la voix (playbook 09, chorégraphie
    // du mouvement : « mouvement utile », pas d'animation décorative
    // omniprésente) : la dérive lente et l'inclinaison de repos s'effacent au
    // profit des gestes de prosodie ; les clignements viennent des pauses de
    // la voix, plus de la table (Direction, 05/09 : « les gestes et les yeux
    // ne suivent pas naturellement »).
    const calme = 1 - 0.65 * blend;
    const clignementTable = blend < 0.5 ? blinkAmount(inputs.elapsedMs) : 0;
    // RÉFLEXE VESTIBULO-OCULAIRE : quand la tête hoche ou se relève, les yeux
    // restent sur l'interlocuteur — ils glissent en sens inverse dans l'orbite.
    // Et quand la tête suit le regard, les yeux reviennent d'autant vers le
    // centre. Sans ce couplage, tête et yeux bougent chacun de leur côté
    // (Direction, 05/09 : « les yeux ne suivent pas naturellement »).
    const turnX = g && Number.isFinite(g.turnX) ? g.turnX : 0;
    // Gains discrets : à 0,5, les yeux sautaient à chaque hochement (65 % de
    // l'énergie du regard vertical au-dessus de 3 Hz, mesuré le 05/09).
    const vor = { x: -0.25 * turnX, y: g ? -0.2 * (g.nodY + g.liftY) : 0 };

    return {
        // Respiration visible sans devenir un effet : 1,5 % d'échelle, les
        // épaules montent avec — devant un fond qui, lui, ne bouge pas.
        // Respiration : 1,1 % d'échelle (1,5 % faisait « pulser » le portrait à
        // 400 px : 6 px de croissance visibles), les épaules montent de 0,7 %.
        breathScale: 1 + respiration * 0.011 * ampleur,
        breathY: -respiration * 0.7 * ampleur,
        headRotate: derive.rotate * calme + tilt * (1 - blend) + nod.rotate + (g ? g.nodRotate + g.tilt : 0),
        headX: derive.x * calme + sway + turnX,
        headY: derive.y * calme + nod.y + nodEcoute + (g ? g.nodY + g.liftY : 0),
        // On cligne AUSSI en parlant : un visage qui ne cligne plus dès qu'il
        // parle se fige — constaté sur la vidéo du 04/09, où deux clignements
        // en 29 s ne suffisaient pas à convaincre.
        // Au repos : clignements de la table et des saccades ; en parole : ceux
        // que la voix demande (pauses, débuts de phrase), et eux seuls.
        eyelid: Math.max(clignementTable, blinkDemande),
        jawOpen,
        mouthWidth: Number.isFinite(inputs.mouthWidth!)
            ? inputs.mouthWidth!
            : 1 + (mouthWidthFactor(inputs.elapsedMs, true) - 1) * blend,
        gazeX: regard.x + (g ? g.gazeX : 0) + vor.x,
        gazeY: regard.y + (g ? g.gazeY : 0) + vor.y,
        // Les sourcils ne montent plus à chaque syllabe forte (0,9 × emphase :
        // mécanique) ; ils marquent les débuts de phrase par les gestes.
        browRaise: Math.min(1, idleBrowRaise(inputs.elapsedMs) + emphasis * 0.35 + (g ? g.brow : 0)),
        mouthTeeth: Math.min(1, Math.max(0, Number.isFinite(inputs.mouthTeeth!) ? inputs.mouthTeeth! : 0)),
    };
}

// ─────────────────────────────────────────────────────────────────────────
// 6. FORMES DE LÈVRES
// ─────────────────────────────────────────────────────────────────────────

/**
 * Largeurs de bouche successives, une par syllabe : une bouche qui parle
 * s'arrondit (« o », « ou ») et s'étire (« é », « i »), elle ne fait pas que
 * s'ouvrir. Sans phonèmes (l'amplitude seule est mesurée), la variété vient
 * d'une suite FIXE — déterministe, donc testable — parcourue à chaque attaque
 * de syllabe. Autour de 1 = largeur de la photo.
 */
export const LIP_SHAPES: readonly number[] = [1, 0.88, 1.1, 0.94, 1.06, 0.82, 1, 1.12];

/** Une syllabe sur trois se termine lèvres jointes (« m », « b », « p »), brièvement. */
export const LIP_CLOSURE_EVERY = 3;
export const LIP_CLOSURE_MS = 90;

/** Seuils de détection d'une attaque et d'une retombée de syllabe sur la cible d'ouverture. */
export const SYLLABLE_ONSET = 0.3;
export const SYLLABLE_RELEASE = 0.12;

// ─────────────────────────────────────────────────────────────────────────
// 7. CADENCE : qualité de rendu adaptée à l'appareil
// ─────────────────────────────────────────────────────────────────────────

/** Au-delà de cette durée médiane d'image (ms), l'appareil ne suit pas : on baisse la résolution. */
export const FRAME_SLOW_MS = 40;
/** En deçà de cette durée médiane, l'appareil a de la marge : on remonte la résolution, un cran à la fois. */
export const FRAME_FAST_MS = 20;
export const QUALITY_STEP = 0.25;
export const MIN_QUALITY = 0.5;

/** Médiane d'une série (0 si vide). */
export function medianOf(values: readonly number[]): number {
    const sorted = values.filter((v) => Number.isFinite(v)).sort((a, b) => a - b);
    if (sorted.length === 0) return 0;
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * Qualité de rendu suivante d'après la durée médiane des images : un cran de
 * moins quand l'appareil dépasse 40 ms par image (< 25 images/s), un cran de
 * plus quand il reste sous 20 ms. Entre les deux, rien ne change — un film à
 * 30 images/s (33 ms) garde sa pleine résolution.
 */
export function adaptQuality(quality: number, medianFrameMs: number): number {
    const q = Number.isFinite(quality) ? Math.min(1, Math.max(MIN_QUALITY, quality)) : 1;
    if (!Number.isFinite(medianFrameMs) || medianFrameMs <= 0) return q;
    if (medianFrameMs > FRAME_SLOW_MS) return Math.max(MIN_QUALITY, q - QUALITY_STEP);
    if (medianFrameMs < FRAME_FAST_MS && q < 1) return Math.min(1, q + QUALITY_STEP);
    return q;
}
