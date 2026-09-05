import { describe, expect, it } from 'vitest';
import { HEALTH_BLOCKS, HEALTH_LINES } from '../services/health/healthRegistry';
import { buildReport, scoreBlock } from '../services/health/healthScore';
import { HealthStatus, ProbeOutcome } from '../services/health/healthTypes';

/**
 * Les sept blocs de lecture (Sécurité, Application, Connecteurs, Live, VPS,
 * Base de données, Services externes) regroupent les mêmes lignes que les
 * douze domaines techniques. Ils doivent raconter la même histoire : mêmes
 * poids réels, même règle « le blanc ne vaut rien ».
 */

const outcome = (lineId: string, status: HealthStatus): ProbeOutcome => ({
    lineId, status, proofLevel: status === 'blanc' ? 'non_eprouve' : 'reel', measured: status, ranAt: '2026-09-05T00:00:00.000Z',
});
const tout = (status: HealthStatus) => HEALTH_LINES.map((l) => outcome(l.id, status));

describe('blocs de lecture', () => {
    it('sont sept, dans l\'ordre demandé par la Direction, et chacun a des lignes', () => {
        expect(HEALTH_BLOCKS.map((b) => b.id)).toEqual(['securite', 'application', 'connecteurs', 'live', 'vps', 'base', 'externes']);
        for (const block of HEALTH_BLOCKS) {
            expect(HEALTH_LINES.filter((l) => l.bloc === block.id).length).toBeGreaterThan(0);
        }
    });

    it('couvrent chaque ligne exactement une fois', () => {
        const report = buildReport(tout('vert'));
        const vues = report.blocks.flatMap((b) => b.lines.map((l) => l.line.id));
        expect(vues.sort()).toEqual(HEALTH_LINES.map((l) => l.id).sort());
    });

    it('tout au vert : chaque bloc à 100, couverture entière', () => {
        const report = buildReport(tout('vert'));
        for (const block of report.blocks) {
            expect(block.score).toBe(100);
            expect(block.coverage).toBeCloseTo(1, 5);
            expect(block.status).toBe('vert');
        }
    });

    it('un bloc entièrement blanc vaut null — jamais 0', () => {
        const report = buildReport(tout('blanc'));
        for (const block of report.blocks) {
            expect(block.score).toBeNull();
            expect(block.coverage).toBe(0);
            expect(block.status).toBe('blanc');
        }
    });

    it('un rouge dans un bloc rend le bloc rouge sans toucher les autres', () => {
        const outcomes = tout('vert').map((o) => o.lineId === 'vps.signalisation' ? outcome(o.lineId, 'rouge') : o);
        const report = buildReport(outcomes);
        const vps = report.blocks.find((b) => b.block.id === 'vps')!;
        expect(vps.status).toBe('rouge');
        expect(vps.score).toBeLessThan(100);
        expect(vps.tally.rouge).toBe(1);
        for (const other of report.blocks.filter((b) => b.block.id !== 'vps')) {
            expect(other.status).toBe('vert');
            expect(other.score).toBe(100);
        }
    });

    it('scoreBlock refuse un bloc inconnu', () => {
        const report = buildReport(tout('vert'));
        expect(() => scoreBlock('inconnu', report.domains)).toThrow(/inconnu/);
    });

    it('chaque problème porte cause, impact, niveau de risque et une voie d\'action', () => {
        for (const line of HEALTH_LINES) {
            expect(line.cause, line.id).toBeTruthy();
            expect(line.impact, line.id).toBeTruthy();
            expect(['critique', 'eleve', 'moyen', 'faible'], line.id).toContain(line.risk);
            const voies = [line.remediation, line.humanAction, line.recommendedAction].filter(Boolean).length;
            expect(voies, `${line.id} : aucune voie d'action`).toBeGreaterThan(0);
            if (line.humanAction) {
                expect(line.manual, `${line.id} : action humaine sans guide`).toBeTruthy();
                expect(line.manual!.steps.length, line.id).toBeGreaterThan(0);
                expect(line.manual!.where, line.id).toBeTruthy();
            }
        }
    });

    it('l\'action manuelle n\'apparaît que quand aucune réparation automatique n\'existe', () => {
        for (const line of HEALTH_LINES) {
            if (line.remediation) {
                expect(line.humanAction, `${line.id} : réparation ET action humaine`).toBeUndefined();
                expect(line.manual, `${line.id} : réparation ET guide manuel`).toBeUndefined();
            }
        }
    });
});
