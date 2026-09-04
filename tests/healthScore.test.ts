import { describe, expect, it } from 'vitest';
import {
    blankOutcome, buildReport, isCertifiable, prioritisedLines,
    validateRegistry, verdictSentence, worstStatus,
} from '../services/health/healthScore';
import { HEALTH_LINES } from '../services/health/healthRegistry';
import { ProbeOutcome, HealthStatus } from '../services/health/healthTypes';

/**
 * Le moteur de notation est la seule chose qui transforme des mesures en un
 * chiffre affiché à la Direction. S'il ment, tout le tableau de bord ment
 * poliment. Ces tests vérifient la propriété qui compte le plus : une ligne
 * NON MESURÉE ne doit jamais faire monter la note.
 */

const mesure = (lineId: string, status: HealthStatus): ProbeOutcome => ({
    lineId,
    status,
    proofLevel: status === 'blanc' ? 'non_eprouve' : 'reel',
    measured: `état simulé : ${status}`,
    ranAt: new Date().toISOString(),
});

/** Toutes les lignes du registre au même statut — base de comparaison. */
const toutesA = (status: HealthStatus): ProbeOutcome[] =>
    HEALTH_LINES.map((l) => mesure(l.id, status));

describe('registre de santé — cohérence structurelle', () => {
    it('ne présente aucune incohérence', () => {
        expect(validateRegistry()).toEqual([]);
    });
});

describe('moteur de notation — le blanc ne vaut jamais du vert', () => {
    it('tout au vert donne 100 sur 100, couverture entière', () => {
        const report = buildReport(toutesA('vert'));
        expect(report.score).toBe(100);
        expect(report.coverage).toBe(1);
        expect(report.status).toBe('vert');
        expect(isCertifiable(report)).toBe(true);
    });

    it('tout au rouge donne 0 sur 100 — et 0 n\'est pas confondu avec l\'absence de mesure', () => {
        const report = buildReport(toutesA('rouge'));
        expect(report.score).toBe(0);
        expect(report.coverage).toBe(1);
        expect(report.status).toBe('rouge');
    });

    it('tout en blanc ne donne PAS 0 mais null — « on ne sait pas » n\'est pas « tout est cassé »', () => {
        const report = buildReport(toutesA('blanc'));
        expect(report.score).toBeNull();
        expect(report.coverage).toBe(0);
        expect(report.status).toBe('blanc');
        expect(isCertifiable(report)).toBe(false);
    });

    it('aucun résultat du tout équivaut à tout en blanc', () => {
        const report = buildReport([]);
        expect(report.score).toBeNull();
        expect(report.coverage).toBe(0);
        expect(report.tally.blanc).toBe(HEALTH_LINES.length);
        expect(report.tally.vert).toBe(0);
    });

    it("une sonde qui tombe fait BAISSER la couverture, jamais monter la note", () => {
        // Point central : on part d'un état mesuré partiellement dégradé, puis
        // les lignes rouges deviennent blanches (la sonde tombe). La note ne
        // doit pas s'améliorer par la disparition des mauvaises nouvelles.
        const rouges = HEALTH_LINES.slice(0, 6).map((l) => l.id);
        const mesureComplete = HEALTH_LINES.map((l) =>
            mesure(l.id, rouges.includes(l.id) ? 'rouge' : 'vert'));
        const avecSondeTombee = HEALTH_LINES.map((l) =>
            mesure(l.id, rouges.includes(l.id) ? 'blanc' : 'vert'));

        const complet = buildReport(mesureComplete);
        const degrade = buildReport(avecSondeTombee);

        expect(complet.coverage).toBe(1);
        expect(degrade.coverage).toBeLessThan(1);
        // La note peut mécaniquement remonter puisque les rouges sortent du
        // calcul — c'est précisément pourquoi la COUVERTURE l'accompagne
        // toujours, et pourquoi la certification devient impossible.
        expect(isCertifiable(degrade)).toBe(false);
        expect(degrade.tally.blanc).toBe(rouges.length);
    });

    it('un domaine entièrement blanc sort du calcul sans être compté à 0', () => {
        // Le domaine `experience` est mis en blanc, le reste au vert : la note
        // doit rester 100 (rien de mauvais n'a été mesuré) mais la couverture
        // doit chuter du poids de ce domaine.
        const report = buildReport(HEALTH_LINES.map((l) =>
            mesure(l.id, l.domain === 'experience' ? 'blanc' : 'vert')));
        expect(report.score).toBe(100);
        expect(report.coverage).toBeLessThan(1);
        expect(report.coverage).toBeGreaterThan(0.9);
        const experience = report.domains.find((d) => d.domain.id === 'experience')!;
        expect(experience.score).toBeNull();
        expect(experience.coverage).toBe(0);
    });

    it('la certification exige zéro rouge, zéro orange ET zéro blanc', () => {
        const unOrange = HEALTH_LINES.map((l, i) => mesure(l.id, i === 0 ? 'orange' : 'vert'));
        expect(isCertifiable(buildReport(unOrange))).toBe(false);

        const unBlanc = HEALTH_LINES.map((l, i) => mesure(l.id, i === 0 ? 'blanc' : 'vert'));
        expect(isCertifiable(buildReport(unBlanc))).toBe(false);

        const unJaune = HEALTH_LINES.map((l, i) => mesure(l.id, i === 0 ? 'jaune' : 'vert'));
        // Le jaune est une attente assumée : il n'interdit pas la certification.
        expect(isCertifiable(buildReport(unJaune))).toBe(true);
    });
});

describe('agrégation par gravité', () => {
    it('retient le pire statut mesuré', () => {
        expect(worstStatus(['vert', 'orange', 'jaune'])).toBe('orange');
        expect(worstStatus(['vert', 'rouge', 'orange'])).toBe('rouge');
        expect(worstStatus(['vert', 'vert'])).toBe('vert');
    });

    it('ignore le blanc dans le pire statut, mais renvoie blanc si rien n\'est mesuré', () => {
        expect(worstStatus(['blanc', 'vert'])).toBe('vert');
        expect(worstStatus(['blanc', 'blanc'])).toBe('blanc');
        expect(worstStatus([])).toBe('blanc');
    });
});

describe('ordre de traitement', () => {
    it('propose les rouges avant les oranges, puis les non éprouvées', () => {
        const report = buildReport(HEALTH_LINES.map((l, i) =>
            mesure(l.id, i === 3 ? 'rouge' : i === 1 ? 'orange' : i === 2 ? 'blanc' : 'vert')));
        const ordre = prioritisedLines(report).map((s) => s.outcome.status);
        expect(ordre[0]).toBe('rouge');
        expect(ordre[1]).toBe('orange');
        expect(ordre[2]).toBe('blanc');
    });

    it('exclut les lignes vertes de la liste des priorités', () => {
        const report = buildReport(toutesA('vert'));
        expect(prioritisedLines(report)).toEqual([]);
    });
});

describe('phrase de verdict', () => {
    it('dit explicitement que la santé est inconnue quand rien n\'est mesuré', () => {
        expect(verdictSentence(buildReport([]))).toContain('inconnue');
    });

    it('mentionne toujours la couverture à côté de la note', () => {
        const phrase = verdictSentence(buildReport(toutesA('vert')));
        expect(phrase).toContain('100 % du périmètre mesuré');
    });

    it('énumère ce qui manque quand ce n\'est pas certifiable', () => {
        const report = buildReport(HEALTH_LINES.map((l, i) => mesure(l.id, i === 0 ? 'rouge' : 'vert')));
        const phrase = verdictSentence(report);
        expect(phrase).toContain('non certifiable');
        expect(phrase).toContain('1 ligne(s) rouge(s)');
    });
});

describe('résultat par défaut', () => {
    it('est blanc et porte la raison', () => {
        const o = blankOutcome('securite.forge_credits', 'Sonde indisponible.');
        expect(o.status).toBe('blanc');
        expect(o.proofLevel).toBe('non_eprouve');
        expect(o.measured).toBe('Sonde indisponible.');
    });
});
