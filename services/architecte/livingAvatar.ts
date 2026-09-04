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
export interface PortraitRig {
    /** Ligne des yeux (0 = haut du cadre, 100 = bas). */
    eyeLinePercent: number;
    /** Hauteur de la bande de paupière — l'épaisseur de l'œil visible. */
    eyeBandPercent: number;
    /** Ligne d'ouverture de la mâchoire : tout ce qui est en dessous descend. */
    jawLinePercent: number;
    /** Amplitude maximale de descente de la mâchoire, en % de la hauteur. */
    jawTravelPercent: number;
}

export const DEFAULT_PORTRAIT_RIG: PortraitRig = {
    // Relevé sur le portrait DE FACE livré (`public/architecte/architecte.webp`),
    // composé d'après la référence validée par la Direction le 04/09/2026 :
    // yeux à 45,5 % de la hauteur, mâchoire à 61 %, lèvres à 67,5 % — lus sur une grille posée sur le rendu, menton à 80 %.
    eyeLinePercent: 45.5,
    eyeBandPercent: 6,
    jawLinePercent: 61,
    jawTravelPercent: 5.2,
};

export function clampPortraitRig(rig: Partial<PortraitRig>): PortraitRig {
    const clamp = (v: number, min: number, max: number, fallback: number) =>
        Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
    return {
        eyeLinePercent: clamp(rig.eyeLinePercent!, 5, 95, DEFAULT_PORTRAIT_RIG.eyeLinePercent),
        eyeBandPercent: clamp(rig.eyeBandPercent!, 2, 25, DEFAULT_PORTRAIT_RIG.eyeBandPercent),
        jawLinePercent: clamp(rig.jawLinePercent!, 10, 98, DEFAULT_PORTRAIT_RIG.jawLinePercent),
        jawTravelPercent: clamp(rig.jawTravelPercent!, 0, 12, DEFAULT_PORTRAIT_RIG.jawTravelPercent),
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
export const BLINK_DURATION_MS = 145;

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
    if (!Number.isFinite(elapsedMs) || elapsedMs < 0) return 0;
    const position = elapsedMs % BLINK_CYCLE_MS;
    let curseur = 0;
    for (const intervalle of BLINK_INTERVALS_MS) {
        const debut = curseur + intervalle;
        if (position < debut) return 0; // entre deux clignements : œil ouvert
        if (position < debut + BLINK_DURATION_MS) {
            const phase = (position - debut) / BLINK_DURATION_MS;
            return phase < 0.35 ? phase / 0.35 : 1 - (phase - 0.35) / 0.65;
        }
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
        // Degrés — au-delà de 1°, la tête « flotte » et trahit le truc.
        rotate: Math.sin(t / 5.3) * 1.15 + Math.sin(t / 8.9) * 0.5,
        // Pourcentages du cadre.
        x: Math.sin(t / 7.1) * 0.9,
        y: Math.cos(t / 6.1) * 0.7,
    };
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
};

export interface LivingPoseInputs {
    elapsedMs: number;
    /** Ouverture de bouche issue de la synchro labiale (0..1). */
    mouthOpenness: number;
    /** `false` = pose figée. Décidé par l'appelant (`shouldAnimate`). */
    animated: boolean;
    /**
     * `true` quand l'Architecte parle : on ne cligne pas et on ne respire
     * qu'à peine pendant une phrase — l'attention doit aller à la bouche.
     */
    speaking: boolean;
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
    // Respiration atténuée pendant la parole : la poitrine se calme quand on
    // parle, et le mouvement de fond ne doit pas concurrencer la bouche.
    const ampleur = inputs.speaking ? 0.4 : 1;

    return {
        breathScale: 1 + respiration * 0.013 * ampleur,
        breathY: -respiration * 0.85 * ampleur,
        headRotate: derive.rotate,
        headX: derive.x,
        headY: derive.y,
        // On ne cligne pas en pleine phrase : le regard reste posé sur
        // l'interlocuteur tant qu'on lui parle.
        eyelid: inputs.speaking ? 0 : blinkAmount(inputs.elapsedMs),
        jawOpen,
    };
}
