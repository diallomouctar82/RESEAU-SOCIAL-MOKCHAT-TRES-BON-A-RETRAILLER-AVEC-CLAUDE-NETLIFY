import { describe, expect, it } from 'vitest';
import { HEALTH_LINES } from '../services/health/healthRegistry';
import { buildReport } from '../services/health/healthScore';
import { HealthStatus, ProbeOutcome } from '../services/health/healthTypes';
import {
    SECURITY_AUDIT_REFERENCE,
    SECURITY_DOMAINS,
    SECURITY_FINDINGS,
    SECURITY_LOOPS,
    buildSecurityReport,
    validateSecurityReference,
} from '../services/health/securityAudit';

/**
 * Le rapport de sécurité du 4 septembre 2026 (61/100) est intégré au tableau
 * de bord comme RÉFÉRENCE ; la note vivante se recalcule sur les mêmes
 * domaines et les mêmes poids. Ces tests tiennent les deux honnêtes : la
 * référence doit rester exactement celle de l'audit, et la note vivante ne
 * doit jamais monter grâce à ce qui n'a pas été mesuré.
 */

const outcome = (lineId: string, status: HealthStatus): ProbeOutcome => ({
    lineId, status, proofLevel: status === 'blanc' ? 'non_eprouve' : 'reel', measured: status, ranAt: '2026-09-05T00:00:00.000Z',
});

const tout = (status: HealthStatus) => HEALTH_LINES.map((l) => outcome(l.id, status));

describe('référence de l\'audit', () => {
    it('est cohérente : poids à 100, lignes connues, vagues connues', () => {
        expect(validateSecurityReference()).toEqual([]);
    });

    it('reproduit exactement le 61 sur 100 de l\'audit à partir des notes par domaine', () => {
        const reference = SECURITY_DOMAINS.reduce((sum, d) => sum + d.weight * d.auditScore, 0) / 100;
        expect(Math.round(reference)).toBe(61);
        expect(SECURITY_AUDIT_REFERENCE.score).toBe(61);
    });

    it('porte les quatorze constats de l\'audit, répartis sur les trois vagues', () => {
        expect(SECURITY_FINDINGS).toHaveLength(14);
        expect(SECURITY_FINDINGS.filter((f) => f.loop === 'P0').map((f) => f.ref)).toEqual(['R-01', 'R-03', 'R-02']);
        expect(SECURITY_FINDINGS.filter((f) => f.loop === 'P1')).toHaveLength(6);
        expect(SECURITY_FINDINGS.filter((f) => f.loop === 'P2')).toHaveLength(5);
        expect(SECURITY_LOOPS.map((l) => l.id)).toEqual(['P0', 'P1', 'P2']);
    });
});

describe('note de sécurité vivante', () => {
    it('vaut 100 quand tout est vert, avec une couverture entière — sauf ce que le tableau ne peut pas mesurer', () => {
        const report = buildSecurityReport(buildReport(tout('vert')));
        expect(report.score).toBe(100);
        expect(report.coverage).toBeCloseTo(1, 5);
        expect(report.status).toBe('vert');
        // J-01b (adresse en dur dans le code) n'est mesuré par aucune ligne :
        // il reste « non mesuré » même quand tout le reste est vert.
        const j01b = report.findings.find((f) => f.finding.ref === 'J-01b')!;
        expect(j01b.status).toBe('blanc');
        expect(j01b.resolved).toBe(false);
        expect(j01b.finding.scope).toBeTruthy();
        expect(report.loops.filter((l) => l.loop.id !== 'P2').every((l) => l.percent === 100)).toBe(true);
        const p2 = report.loops.find((l) => l.loop.id === 'P2')!;
        expect(p2.resolved).toBe(p2.total - 1);
    });

    it('vaut null — pas 0 — quand rien n\'est mesuré, et aucune vague n\'avance', () => {
        const report = buildSecurityReport(buildReport(tout('blanc')));
        expect(report.score).toBeNull();
        expect(report.coverage).toBe(0);
        expect(report.status).toBe('blanc');
        expect(report.loops.every((l) => l.percent === 0 && l.resolved === 0)).toBe(true);
        expect(report.findings.every((f) => f.status === 'blanc' && !f.resolved)).toBe(true);
    });

    it('une ligne blanche réduit la couverture sans faire monter la note', () => {
        const base = tout('vert');
        const blanchie = base.map((o) => o.lineId === 'securite.forge_credits' ? outcome(o.lineId, 'blanc') : o);
        const report = buildSecurityReport(buildReport(blanchie));
        expect(report.score).toBe(100);
        expect(report.coverage).toBeLessThan(1);
        // Le constat R-01 n'est pas « résolu » : il n'a pas été mesuré.
        const r01 = report.findings.find((f) => f.finding.ref === 'R-01')!;
        expect(r01.status).toBe('blanc');
        expect(r01.resolved).toBe(false);
    });

    it('un constat n\'est résolu que si TOUTES ses lignes sont vertes', () => {
        const base = tout('vert');
        const degrade = base.map((o) => o.lineId === 'dependances.green_gate' ? outcome(o.lineId, 'blanc') : o);
        const report = buildSecurityReport(buildReport(degrade));
        const ci = report.findings.find((f) => f.finding.ref === 'CI')!;
        expect(ci.resolved).toBe(false);
        expect(ci.status).toBe('blanc');
        const p2 = report.loops.find((l) => l.loop.id === 'P2')!;
        // CI (dégradé ici) et J-01b (jamais mesurable) restent non résolus.
        expect(p2.resolved).toBe(p2.total - 2);
    });

    it('sur l\'état de production du 5 septembre 2026, la note reste orange et proche de l\'audit', () => {
        // Photographie réelle (fixture-prod du 05/09/2026) : forge et
        // portefeuille ouverts, script tiers exécuté, schéma non versionné,
        // CSP absente, dépense IA lisible, anon trop large, aucun super_admin.
        const rouges = new Set(['securite.forge_credits', 'securite.portefeuille_credit', 'deploiement.scripts_tiers', 'gouvernance.schema_versionne']);
        const oranges = new Set(['deploiement.csp', 'securite.depense_ia_publique', 'securite.grants_anon', 'gouvernance.rang_admin_general', 'ia.quota_par_utilisateur', 'securite.cors_fonctions', 'ia.budget_arme']);
        const outcomes = HEALTH_LINES.map((l) => {
            if (l.location === 'humain') return outcome(l.id, 'blanc');
            if (rouges.has(l.id)) return outcome(l.id, 'rouge');
            if (oranges.has(l.id)) return outcome(l.id, 'orange');
            return outcome(l.id, 'vert');
        });
        const report = buildSecurityReport(buildReport(outcomes));
        expect(report.status).toBe('rouge');
        expect(report.score).not.toBeNull();
        // Même ordre de grandeur que le 61 de l'audit : un écart de plus de
        // 15 points signifierait que la référence et la mesure ne parlent plus
        // de la même chose.
        expect(Math.abs((report.score as number) - SECURITY_AUDIT_REFERENCE.score)).toBeLessThan(15);
        expect(report.coverage).toBeLessThan(1);
        const p0 = report.loops.find((l) => l.loop.id === 'P0')!;
        expect(p0.percent).toBe(0);
    });
});
