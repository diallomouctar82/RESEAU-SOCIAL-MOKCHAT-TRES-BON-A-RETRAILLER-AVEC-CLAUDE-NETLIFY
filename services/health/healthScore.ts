// Moteur de notation de la santé MokNet — fonctions pures, sans réseau ni
// base : c'est ce qui rend le chiffre affiché vérifiable par un test plutôt
// que par la confiance.
//
// Règle fondatrice : une ligne BLANCHE (non éprouvée) n'entre PAS dans la
// note. Elle réduit la COUVERTURE. Les deux chiffres voyagent toujours
// ensemble — « 84 sur 100, sur 71 % du périmètre mesuré » est une information
// honnête ; « 84 sur 100 » seul ne l'est pas, puisqu'il laisse croire que le
// reste a été contrôlé.
//
// Conséquence voulue : une sonde en panne fait BAISSER la couverture, jamais
// monter la note. Un « faux vert » n'est pas atteignable par accident.

import {
    DomainScore,
    HealthLineState,
    HealthReport,
    HealthStatus,
    ProbeOutcome,
} from './healthTypes';
import { HEALTH_DOMAINS, HEALTH_LINES, HEALTH_LINE_BY_ID } from './healthRegistry';

/**
 * Valeur numérique d'un statut mesuré. Le blanc est absent : il n'a pas de
 * valeur, c'est précisément ce que « non éprouvé » veut dire.
 */
const STATUS_VALUE: Record<Exclude<HealthStatus, 'blanc'>, number> = {
    vert: 100,
    jaune: 70,
    orange: 40,
    rouge: 0,
};

/** Ordre de gravité, du plus sain au plus grave. Sert à agréger un domaine. */
const SEVERITY_ORDER: HealthStatus[] = ['vert', 'jaune', 'orange', 'rouge'];

export function isMeasured(status: HealthStatus): status is Exclude<HealthStatus, 'blanc'> {
    return status !== 'blanc';
}

/** Le pire des statuts mesurés d'un ensemble ; `blanc` si aucun ne l'est. */
export function worstStatus(statuses: HealthStatus[]): HealthStatus {
    const measured = statuses.filter(isMeasured);
    if (measured.length === 0) return 'blanc';
    return measured.reduce((worst, current) =>
        SEVERITY_ORDER.indexOf(current) > SEVERITY_ORDER.indexOf(worst) ? current : worst,
    );
}

/**
 * Résultat par défaut d'une ligne jamais sondée. Explicitement blanc : c'est
 * l'état de départ de TOUTE ligne, y compris au premier affichage, pour qu'un
 * tableau de bord qui n'a pas encore tourné n'affiche jamais du vert.
 */
export function blankOutcome(lineId: string, reason: string): ProbeOutcome {
    return {
        lineId,
        status: 'blanc',
        proofLevel: 'non_eprouve',
        measured: reason,
        ranAt: new Date().toISOString(),
    };
}

/**
 * Note d'un domaine à partir de ses lignes.
 *
 * `score` : moyenne pondérée des SEULES lignes mesurées, ou `null` si aucune
 * ne l'est — jamais 0, qui se lirait « tout est cassé » là où le sens réel est
 * « on ne sait pas ».
 *
 * `coverage` : part du poids du domaine réellement mesurée, de 0 à 1.
 */
export function scoreDomain(domainId: string, states: HealthLineState[]): DomainScore {
    const domain = HEALTH_DOMAINS.find((d) => d.id === domainId);
    if (!domain) throw new Error(`Domaine de santé inconnu : ${domainId}`);

    const totalWeight = states.reduce((sum, s) => sum + s.line.weight, 0);
    const measuredStates = states.filter((s) => isMeasured(s.outcome.status));
    const measuredWeight = measuredStates.reduce((sum, s) => sum + s.line.weight, 0);

    const score = measuredWeight === 0
        ? null
        : measuredStates.reduce(
            (sum, s) => sum + s.line.weight * STATUS_VALUE[s.outcome.status as Exclude<HealthStatus, 'blanc'>],
            0,
        ) / measuredWeight;

    return {
        domain,
        score: score === null ? null : round1(score),
        coverage: totalWeight === 0 ? 0 : measuredWeight / totalWeight,
        status: worstStatus(states.map((s) => s.outcome.status)),
        lines: states,
    };
}

/**
 * Rapport complet. Les domaines sans aucune mesure sortent du calcul de la
 * note (leur poids quitte le dénominateur) et pèsent sur la couverture : c'est
 * la seule façon d'empêcher un domaine muet de tirer la note vers le haut ou
 * vers le bas sans preuve.
 */
export function buildReport(outcomes: ProbeOutcome[]): HealthReport {
    const byLine = new Map(outcomes.map((o) => [o.lineId, o]));

    const domains: DomainScore[] = HEALTH_DOMAINS.map((domain) => {
        const states: HealthLineState[] = HEALTH_LINES
            .filter((line) => line.domain === domain.id)
            .map((line) => ({
                line,
                outcome: byLine.get(line.id)
                    ?? blankOutcome(line.id, "Sonde jamais exécutée pour cette ligne."),
            }));
        return scoreDomain(domain.id, states);
    });

    const scored = domains.filter((d) => d.score !== null);
    const scoredWeight = scored.reduce((sum, d) => sum + d.domain.weight, 0);
    const score = scoredWeight === 0
        ? null
        : round1(scored.reduce((sum, d) => sum + d.domain.weight * (d.score as number), 0) / scoredWeight);

    const totalWeight = domains.reduce((sum, d) => sum + d.domain.weight, 0);
    const coverage = totalWeight === 0
        ? 0
        : domains.reduce((sum, d) => sum + d.domain.weight * d.coverage, 0) / totalWeight;

    const tally: Record<HealthStatus, number> = { vert: 0, jaune: 0, orange: 0, rouge: 0, blanc: 0 };
    for (const domain of domains) {
        for (const state of domain.lines) tally[state.outcome.status] += 1;
    }

    return {
        score,
        coverage,
        status: worstStatus(domains.map((d) => d.status)),
        domains,
        generatedAt: new Date().toISOString(),
        tally,
    };
}

/**
 * Une santé n'est « certifiable » que si AUCUNE ligne n'est rouge ou orange
 * ET que tout le périmètre a été mesuré. Un domaine muet interdit la
 * certification aussi sûrement qu'un rouge : dans les deux cas, l'exigence
 * n'est pas démontrée (Constitution § XXXIII).
 */
export function isCertifiable(report: HealthReport): boolean {
    return report.tally.rouge === 0
        && report.tally.orange === 0
        && report.tally.blanc === 0;
}

/** Phrase de verdict, rédigée à partir des chiffres — jamais saisie à la main. */
export function verdictSentence(report: HealthReport): string {
    if (report.score === null) {
        return "Aucune ligne n'a pu être mesurée : la santé de MokNet est inconnue, pas bonne.";
    }
    const couverture = `${Math.round(report.coverage * 100)} % du périmètre mesuré`;
    if (isCertifiable(report)) {
        return `Toutes les lignes sont vertes sur ${couverture} : état certifiable.`;
    }
    const manques: string[] = [];
    if (report.tally.rouge > 0) manques.push(`${report.tally.rouge} ligne(s) rouge(s)`);
    if (report.tally.orange > 0) manques.push(`${report.tally.orange} orange(s)`);
    if (report.tally.blanc > 0) manques.push(`${report.tally.blanc} non éprouvée(s)`);
    return `Santé ${Math.round(report.score)} % sur ${couverture} — non certifiable : ${manques.join(', ')}.`;
}

/**
 * Lignes à traiter en priorité : les rouges d'abord, puis les oranges, puis
 * les non éprouvées ; à gravité égale, le poids réel dans la note globale
 * (poids du domaine × poids de la ligne) départage. C'est l'ordre dans lequel
 * l'interface propose d'agir.
 */
export function prioritisedLines(report: HealthReport): HealthLineState[] {
    const rank: Record<HealthStatus, number> = { rouge: 0, orange: 1, blanc: 2, jaune: 3, vert: 4 };
    return report.domains
        .flatMap((d) => d.lines.map((state) => ({ state, domainWeight: d.domain.weight })))
        .filter(({ state }) => state.outcome.status !== 'vert')
        .sort((a, b) => {
            const byRank = rank[a.state.outcome.status] - rank[b.state.outcome.status];
            if (byRank !== 0) return byRank;
            return (b.domainWeight * b.state.line.weight) - (a.domainWeight * a.state.line.weight);
        })
        .map(({ state }) => state);
}

/**
 * Contrôle d'intégrité du registre lui-même. Un registre incohérent produit
 * une note fausse sans rien signaler : ce garde-fou est appelé par les tests
 * et au démarrage du service.
 */
export function validateRegistry(): string[] {
    const problems: string[] = [];

    const domainTotal = HEALTH_DOMAINS.reduce((sum, d) => sum + d.weight, 0);
    if (domainTotal !== 100) {
        problems.push(`La somme des poids de domaine vaut ${domainTotal} au lieu de 100.`);
    }

    const seen = new Set<string>();
    for (const line of HEALTH_LINES) {
        if (seen.has(line.id)) problems.push(`Identifiant de ligne en double : ${line.id}`);
        seen.add(line.id);
        if (!HEALTH_DOMAINS.some((d) => d.id === line.domain)) {
            problems.push(`La ligne ${line.id} référence un domaine inconnu : ${line.domain}`);
        }
        if (line.weight <= 0) problems.push(`La ligne ${line.id} a un poids nul ou négatif.`);
        if (line.remediation && line.humanAction) {
            problems.push(`La ligne ${line.id} propose à la fois une réparation et une action humaine.`);
        }
        if (line.remediation && !line.remediation.reversible) {
            problems.push(`La ligne ${line.id} propose une réparation non réversible — interdit.`);
        }
        if (line.location === 'humain' && line.remediation) {
            problems.push(`La ligne ${line.id} est de portée humaine mais propose une réparation.`);
        }
        if (line.location === 'humain' && !line.humanAction) {
            problems.push(`La ligne ${line.id} est de portée humaine sans action humaine décrite.`);
        }
    }

    for (const domain of HEALTH_DOMAINS) {
        const lines = HEALTH_LINES.filter((l) => l.domain === domain.id);
        if (lines.length === 0) problems.push(`Le domaine ${domain.id} n'a aucune ligne.`);
        const total = lines.reduce((sum, l) => sum + l.weight, 0);
        if (lines.length > 0 && total !== 100) {
            problems.push(`Les poids du domaine ${domain.id} totalisent ${total} au lieu de 100.`);
        }
    }

    const remediationIds = HEALTH_LINES
        .map((l) => l.remediation?.id)
        .filter((id): id is string => Boolean(id));
    const dupes = remediationIds.filter((id, i) => remediationIds.indexOf(id) !== i);
    if (dupes.length > 0) {
        problems.push(`Identifiant(s) de réparation en double : ${[...new Set(dupes)].join(', ')}`);
    }

    return problems;
}

/** Toute ligne connue du registre — pratique pour les tests et l'interface. */
export function knownLineIds(): string[] {
    return [...HEALTH_LINE_BY_ID.keys()];
}

function round1(value: number): number {
    return Math.round(value * 10) / 10;
}
