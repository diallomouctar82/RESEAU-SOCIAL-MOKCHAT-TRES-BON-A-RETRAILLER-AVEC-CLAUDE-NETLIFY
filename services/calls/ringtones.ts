/**
 * ÉQUIPE 9 (Audio & Sonneries) — catalogue des sonneries d'appel MokNet.
 *
 * Cinq sonneries entièrement SYNTHÉTISÉES en WebAudio : aucun fichier
 * externe, aucun asset binaire, aucun accès réseau. Chaque sonnerie est une
 * spécification déclarative (notes, enveloppe, timbre, écho, durée de
 * boucle) interprétée par `services/calls/ringtoneService.ts` — le catalogue
 * lui-même ne touche jamais à l'API WebAudio, ce qui le rend trivialement
 * testable et lisible comme une partition.
 *
 * Règles d'harmonie appliquées partout :
 *  - toutes les fréquences appartiennent à une gamme consonante (pentatonique
 *    majeure ou accord parfait) — jamais de dissonance agressive ;
 *  - registre médium 349–880 Hz : présent sans être strident ;
 *  - enveloppes attack/release douces, volume plafonné par le GainNode
 *    maître du service (~0.25) — jamais un buzzer.
 */

/** Une note du motif. Les temps et durées sont en secondes. */
export interface RingtoneNote {
    /** Départ de la note dans l'itération du motif. */
    time: number;
    /** Fréquence fondamentale (Hz), tempérament égal La 440. */
    freq: number;
    /** Durée de tenue avant le relâchement (release s'ajoute ensuite). */
    duration: number;
    /** Gain crête relatif de la note (0..1, défaut 1). */
    velocity?: number;
    /** Glissando optionnel : fréquence atteinte en fin de tenue. */
    glideTo?: number;
}

/** Spécification déclarative complète d'une sonnerie. */
export interface RingtoneSpec {
    id: string;
    name: string;
    description: string;
    /** Forme d'onde de l'oscillateur principal. */
    waveform: OscillatorType;
    /** Attaque commune des notes (secondes). */
    attack: number;
    /** Relâchement commun des notes (secondes). */
    release: number;
    /** Gain de l'harmonique à l'octave (2×freq) ; 0 = timbre pur. */
    harmonic: number;
    /** Écho léger optionnel : délai (s) et gain du retour (<0.35). */
    echo?: { delay: number; gain: number };
    /**
     * Durée d'UNE itération complète, silence de respiration inclus.
     * Le service enchaîne les itérations à cette période exacte.
     */
    loopDuration: number;
    notes: RingtoneNote[];
}

/* Fréquences (Hz) — tempérament égal, La 440. */
const F4 = 349.23;
const G4 = 392.0;
const A4 = 440.0;
const B4 = 493.88;
const C5 = 523.25;
const CS5 = 554.37;
const D5 = 587.33;
const E5 = 659.25;
const FS5 = 739.99;
const G5 = 783.99;
const A5 = 880.0;

/** Id de la sonnerie par défaut — la signature sonore de MokNet. */
export const DEFAULT_RINGTONE_ID = 'signature';

/**
 * Petit générateur de trille pour « Classique » : `count` notes courtes
 * alternant entre deux hauteurs voisines, à partir de `start`, espacées de
 * `step` secondes — l'émulation adoucie du grelot de téléphone.
 */
function trill(
    start: number,
    count: number,
    step: number,
    freqA: number,
    freqB: number,
): RingtoneNote[] {
    const notes: RingtoneNote[] = [];
    for (let i = 0; i < count; i++) {
        notes.push({
            time: start + i * step,
            freq: i % 2 === 0 ? freqA : freqB,
            duration: 0.04,
            velocity: 0.55,
        });
    }
    return notes;
}

export const RINGTONES: readonly RingtoneSpec[] = [
    {
        /**
         * La signature sonore de l'app : arpège pentatonique de LA majeur
         * (A4 → C#5 → E5 → A5) qui monte puis se pose sur F#5 — chaleureux,
         * moderne, immédiatement identifiable, jamais strident. Sinus +
         * harmonique d'octave légère, écho discret : pensé comme les
         * sonneries mélodiques des apps d'appel modernes, pas un buzzer.
         */
        id: DEFAULT_RINGTONE_ID,
        name: 'Signature MokNet',
        description: 'Arpège doux et chaleureux — la sonnerie officielle de MokNet.',
        waveform: 'sine',
        attack: 0.02,
        release: 0.28,
        harmonic: 0.18,
        echo: { delay: 0.26, gain: 0.22 },
        loopDuration: 2.6,
        notes: [
            { time: 0.0, freq: A4, duration: 0.3, velocity: 0.85 },
            { time: 0.16, freq: CS5, duration: 0.3, velocity: 0.9 },
            { time: 0.32, freq: E5, duration: 0.3, velocity: 0.95 },
            { time: 0.48, freq: A5, duration: 0.45, velocity: 1.0 },
            { time: 0.82, freq: FS5, duration: 0.55, velocity: 0.8 },
        ],
    },
    {
        /**
         * Hommage à l'identité guinéenne de MokNet : ostinato pincé inspiré
         * du kumbengo de kora, alternance basse/aigu en FA majeur
         * pentatonique. Onde triangle à attaque quasi instantanée et longue
         * résonance = corde pincée.
         */
        id: 'kora',
        name: 'Kora',
        description: 'Motif pincé inspiration mandingue, alternance basse et aigu.',
        waveform: 'triangle',
        attack: 0.005,
        release: 0.5,
        harmonic: 0.25,
        echo: { delay: 0.22, gain: 0.18 },
        loopDuration: 2.8,
        notes: [
            { time: 0.0, freq: F4, duration: 0.12, velocity: 0.9 },
            { time: 0.15, freq: C5, duration: 0.12, velocity: 0.75 },
            { time: 0.3, freq: A4, duration: 0.12, velocity: 0.8 },
            { time: 0.45, freq: D5, duration: 0.12, velocity: 0.75 },
            { time: 0.6, freq: C5, duration: 0.12, velocity: 0.7 },
            { time: 0.78, freq: G4, duration: 0.12, velocity: 0.8 },
            { time: 0.93, freq: A4, duration: 0.12, velocity: 0.7 },
            { time: 1.08, freq: F4, duration: 0.12, velocity: 0.85 },
        ],
    },
    {
        /**
         * Minimalisme assumé : deux notes sinus en quinte montante
         * (A4 → E5), beaucoup de silence. Pour qui veut être prévenu sans
         * mélodie.
         */
        id: 'pulse',
        name: 'Pulse',
        description: 'Deux notes minimalistes, sobres et espacées.',
        waveform: 'sine',
        attack: 0.012,
        release: 0.25,
        harmonic: 0.12,
        loopDuration: 2.2,
        notes: [
            { time: 0.0, freq: A4, duration: 0.22, velocity: 0.85 },
            { time: 0.3, freq: E5, duration: 0.3, velocity: 0.75 },
        ],
    },
    {
        /**
         * Montée douce sur l'accord parfait de DO étalé (G4 → C5 → E5 → G5) :
         * attaques lentes qui se chevauchent en nappes consonantes — un lever
         * de jour, l'appel le moins intrusif du catalogue.
         */
        id: 'aurore',
        name: 'Aurore',
        description: 'Montée douce en nappes, l’appel le plus feutré.',
        waveform: 'sine',
        attack: 0.12,
        release: 0.45,
        harmonic: 0.15,
        echo: { delay: 0.3, gain: 0.2 },
        loopDuration: 3.0,
        notes: [
            { time: 0.0, freq: G4, duration: 0.45, velocity: 0.55 },
            { time: 0.38, freq: C5, duration: 0.45, velocity: 0.65 },
            { time: 0.76, freq: E5, duration: 0.45, velocity: 0.7 },
            { time: 1.14, freq: G5, duration: 0.6, velocity: 0.6 },
        ],
    },
    {
        /**
         * Le téléphone d'antan, adouci : double trille A4/B4 (2 × 8 notes de
         * 55 ms) sur la cadence « dring… dring », en sinus au lieu du grelot
         * métallique. Familier sans être agressif.
         */
        id: 'classique',
        name: 'Classique',
        description: 'Sonnerie téléphonique traditionnelle, version adoucie.',
        waveform: 'sine',
        attack: 0.008,
        release: 0.045,
        harmonic: 0.2,
        loopDuration: 2.4,
        notes: [...trill(0, 8, 0.055, A4, B4), ...trill(0.64, 8, 0.055, A4, B4)],
    },
];

/** Retrouve une sonnerie par id — `undefined` si l'id est inconnu. */
export function getRingtone(id: string): RingtoneSpec | undefined {
    return RINGTONES.find((r) => r.id === id);
}
