/**
 * SYNCHRO LABIALE DE L'ARCHITECTE.
 *
 * Ce module dit la vérité sur ce qu'il fait. Il existe TROIS niveaux, parce
 * que le navigateur ne donne pas le même accès au son selon le moteur vocal
 * réellement en train de parler :
 *
 *  - `amplitude_reelle` — moteur ElevenLabs. La voix est lue par un élément
 *    `<audio>` (`voiceEngine.currentAudioElement`) : on peut y brancher un
 *    `AnalyserNode` et mesurer l'amplitude RÉELLE, échantillon par
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
 * réel vit dans le composant ; la règle, elle, se teste ici.
 */

export type LipSyncLevel = 'amplitude_reelle' | 'rythme_des_mots' | 'aucune';

export interface LipSyncInputs {
    isSpeaking: boolean;
    /** Moteur réellement en train de parler, tel que rapporté par `voiceEngine`. */
    engine: 'elevenlabs' | 'browser_native' | null;
    /** Réglage Super-Admin. */
    lipSyncEnabled: boolean;
    prefersReducedMotion: boolean;
}

/**
 * Niveau réellement atteignable ici et maintenant.
 *
 * `prefers-reduced-motion` coupe la bouche comme le reste : une bouche qui
 * s'agite reste du mouvement, même quand tout le reste s'est immobilisé.
 */
export function resolveLipSyncLevel(inputs: LipSyncInputs): LipSyncLevel {
    if (!inputs.isSpeaking || !inputs.lipSyncEnabled || inputs.prefersReducedMotion) return 'aucune';
    if (inputs.engine === 'elevenlabs') return 'amplitude_reelle';
    if (inputs.engine === 'browser_native') return 'rythme_des_mots';
    return 'aucune';
}

/** Phrase affichable dans le Super-Admin — la Direction doit savoir ce qu'elle regarde. */
export const LIP_SYNC_LEVEL_LABEL: Record<LipSyncLevel, string> = {
    amplitude_reelle: 'Synchro réelle — la bouche suit l’amplitude mesurée de la voix (moteur ElevenLabs).',
    rythme_des_mots:
        'Synchro au rythme des mots — le navigateur ne donne pas accès au signal audio de sa voix intégrée ; la bouche suit les frontières de mots, pas le volume.',
    aucune: 'Bouche immobile — l’Architecte ne parle pas, ou la synchro est désactivée.',
};

// ─────────────────────────────────────────────────────────────────────────
// Amplitude → ouverture
// ─────────────────────────────────────────────────────────────────────────

/** Sous ce niveau, c'est du bruit de fond : la bouche reste close plutôt que de trembler en silence. */
export const SILENCE_FLOOR = 0.04;
/** Au-dessus, on considère la bouche grande ouverte : au-delà le signal sature sans rien ajouter. */
export const LOUD_CEILING = 0.55;

/**
 * Amplitude normalisée (0..1) → ouverture de bouche (0..1).
 *
 * Deux corrections indispensables pour que ça ressemble à une bouche et non
 * à un vumètre :
 *  - plancher de silence, sinon la bouche vibre en permanence sur le bruit ;
 *  - courbe en racine, parce que l'amplitude d'une voix passe l'essentiel de
 *    son temps dans le bas de l'échelle : sans elle, la bouche resterait
 *    presque fermée pendant toute la phrase.
 */
export function amplitudeToOpenness(amplitude: number): number {
    if (!Number.isFinite(amplitude) || amplitude <= SILENCE_FLOOR) return 0;
    const span = LOUD_CEILING - SILENCE_FLOOR;
    const normalised = Math.min(1, (amplitude - SILENCE_FLOOR) / span);
    return Math.sqrt(normalised);
}

/**
 * Lissage : une bouche a de l'inertie. Sans cela, l'ouverture saute d'une
 * image à l'autre et donne un claquement de mâchoire, pas une parole.
 * L'ouverture monte vite (une syllabe attaque) et retombe plus lentement.
 */
export function smoothOpenness(previous: number, target: number): number {
    // Attaque en ~4 images à 60 i/s (≈ 70 ms pour 80 % de l'ouverture), comme
    // une lèvre qui s'ouvre — 0,55 ouvrait en deux images et claquait (mesuré
    // par simulation de la boucle réelle, 04/09). Retombée plus lente.
    const factor = target > previous ? 0.35 : 0.22;
    return previous + (target - previous) * factor;
}

/**
 * Amplitude moyenne d'un tampon d'analyse fréquentielle (`getByteFrequencyData`,
 * octets 0..255), ramenée entre 0 et 1. Séparé de la lecture du tampon lui-même
 * pour que la règle se teste sans `AudioContext`.
 */
export function averageAmplitude(bins: ArrayLike<number>): number {
    if (!bins || bins.length === 0) return 0;
    let total = 0;
    for (let i = 0; i < bins.length; i += 1) total += bins[i];
    return total / bins.length / 255;
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
