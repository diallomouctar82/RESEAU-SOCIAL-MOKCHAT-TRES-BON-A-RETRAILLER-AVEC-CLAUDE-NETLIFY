import type { LiveInterpreterStage } from './liveInterpreterProducer';

/**
 * LIVE PLANÉTAIRE — la latence, en chiffres séparés (§18).
 *
 * « Le temps réel fonctionne » n'est pas une mesure. Ce module transforme le
 * flux d'étapes du producteur en nombres qu'on peut discuter : combien de
 * temps prend la reconnaissance, combien la traduction, combien la synthèse,
 * et surtout **combien de temps s'écoule entre la parole et la voix traduite
 * qui la remplace** — le seul chiffre que l'auditeur ressent vraiment.
 *
 * Trois règles de mesure, chacune contre une façon de se mentir :
 *
 * 1. **La médiane d'abord, jamais la moyenne.** Une seule phrase à 12 s
 *    suffit à rendre une moyenne mensongère dans les deux sens. La médiane
 *    dit ce que les gens vivent d'habitude ; le 90ᵉ centile dit ce qu'ils
 *    subissent quand ça va mal. Les deux ensemble, ou rien.
 *
 * 2. **On ne compte que ce qui est arrivé au bout.** Une phrase abandonnée
 *    n'a pas une latence de zéro : elle n'en a pas. La compter comme un
 *    succès instantané embellirait précisément les moments où la chaîne va
 *    mal. Elle est comptée à part, dans `abandonnees`.
 *
 * 3. **`voiced` = du son est sorti.** Le producteur n'émet cette étape
 *    qu'au démarrage réel de la lecture, pas à la mise en file — sans quoi
 *    on mesurerait la vitesse d'une file d'attente, pas celle d'une voix.
 */

/** Ce qu'on peut dire d'une série de mesures — jamais une moyenne seule. */
export interface LatencyStat {
    /** Nombre de mesures réellement observées. Zéro = on ne sait pas, et on le dit. */
    n: number;
    /** Médiane, en millisecondes — le cas ordinaire. */
    p50: number;
    /** 90ᵉ centile — le mauvais jour, celui qui fait abandonner. */
    p90: number;
    /** La pire mesure observée. */
    max: number;
}

export interface LiveLatencyReport {
    /** Parole → texte (transcription). */
    reconnaissance: LatencyStat;
    /** Texte → texte traduit, par langue produite. */
    traduction: LatencyStat;
    /** Parole → premier son de la voix traduite : LE chiffre vécu. */
    voixTotale: LatencyStat;
    /** Phrases arrivées en sous-titre faute de voix (§17) — un demi-succès, compté comme tel. */
    sousTitrees: number;
    /** Phrases qui n'ont produit ni voix ni sous-titre. */
    abandonnees: number;
    /** Langues réellement observées dans ces mesures. */
    langues: string[];
}

const VIDE: LatencyStat = { n: 0, p50: 0, p90: 0, max: 0 };

/**
 * Centile par rang, sur une série triée. Volontairement simple : sans
 * interpolation, un centile reste une mesure réellement observée, pas un
 * nombre calculé entre deux valeurs qui n'ont jamais existé.
 */
function centile(triees: number[], part: number): number {
    if (triees.length === 0) return 0;
    const rang = Math.min(triees.length - 1, Math.max(0, Math.ceil(part * triees.length) - 1));
    return triees[rang];
}

function stat(valeurs: number[]): LatencyStat {
    if (valeurs.length === 0) return { ...VIDE };
    const triees = [...valeurs].sort((a, b) => a - b);
    return {
        n: triees.length,
        p50: centile(triees, 0.5),
        p90: centile(triees, 0.9),
        max: triees[triees.length - 1],
    };
}

/**
 * Agrège les étapes observées. Accepte le flux tel quel, dans le désordre,
 * avec des doublons : un direct réel ne livre pas des mesures propres.
 */
export function summarizeLiveLatency(stages: LiveInterpreterStage[]): LiveLatencyReport {
    const reconnaissance: number[] = [];
    const traduction: number[] = [];
    const voix: number[] = [];
    const langues = new Set<string>();
    let sousTitrees = 0;
    let abandonnees = 0;

    for (const s of stages) {
        if (s.language) langues.add(s.language);
        switch (s.stage) {
            case 'transcribed':
                // La transcription est commune à toutes les langues : elle est
                // mesurée UNE fois par phrase, jamais une fois par langue —
                // sinon un intervenant écouté en trois langues verrait sa
                // reconnaissance comptée trois fois, et le chiffre ne voudrait
                // plus rien dire.
                if (s.sinceCaptureMs > 0) reconnaissance.push(s.sinceCaptureMs);
                break;
            case 'translated':
                // `ms` à 0 = la traduction offerte par la transcription
                // (aucun appel de plus). La compter comme « une traduction en
                // 0 ms » gonflerait artificiellement la performance du
                // traducteur : ce n'est pas lui qui a travaillé.
                if (s.ms > 0) traduction.push(s.ms);
                break;
            case 'voiced':
                voix.push(s.sinceCaptureMs);
                break;
            case 'subtitled':
                sousTitrees += 1;
                break;
            case 'failed':
                abandonnees += 1;
                break;
        }
    }

    return {
        reconnaissance: stat(reconnaissance),
        traduction: stat(traduction),
        voixTotale: stat(voix),
        sousTitrees,
        abandonnees,
        langues: [...langues].sort(),
    };
}

/**
 * La même chose, en une ligne lisible par un humain — pour l'écran de
 * diagnostic et le rapport de mission.
 *
 * Quand rien n'a encore été mesuré, elle le DIT au lieu d'afficher des zéros
 * qui se liraient comme « instantané ».
 */
export function describeLiveLatency(report: LiveLatencyReport): string {
    if (report.voixTotale.n === 0 && report.reconnaissance.n === 0) {
        return 'Aucune mesure pour l’instant — personne n’a encore parlé dans une langue à traduire.';
    }
    const ms = (v: LatencyStat) => (v.n === 0 ? 'non mesuré' : `${(v.p50 / 1000).toFixed(1)} s (p90 ${(v.p90 / 1000).toFixed(1)} s)`);
    const parts = [
        `reconnaissance ${ms(report.reconnaissance)}`,
        `traduction ${ms(report.traduction)}`,
        `parole → voix traduite ${ms(report.voixTotale)}`,
    ];
    if (report.sousTitrees > 0) parts.push(`${report.sousTitrees} phrase(s) lues au lieu d’être dites`);
    if (report.abandonnees > 0) parts.push(`${report.abandonnees} abandonnée(s)`);
    return parts.join(' · ');
}
