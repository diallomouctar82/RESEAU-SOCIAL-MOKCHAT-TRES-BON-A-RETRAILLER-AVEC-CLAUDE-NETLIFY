import { describe, expect, it } from 'vitest';
import { HEALTH_LINES } from '../services/health/healthRegistry';
import { buildReport } from '../services/health/healthScore';
import { buildSecurityReport } from '../services/health/securityAudit';
import { HealthStatus, ProbeOutcome } from '../services/health/healthTypes';
import {
    contextForLlm,
    explainLine,
    findLineByText,
    helpText,
    narrateCampaign,
    narrateReport,
    normaliser,
    parseIntent,
} from '../services/health/assistant/assistantBrain';
import { planCampaign, runCampaign } from '../services/health/assistant/repairCampaign';

const outcome = (lineId: string, status: HealthStatus): ProbeOutcome => ({
    lineId, status, proofLevel: status === 'blanc' ? 'non_eprouve' : 'reel', measured: `mesure ${status}`, ranAt: '2026-09-05T00:00:00.000Z',
});

function rapport() {
    const rouges = new Set(['securite.forge_credits', 'deploiement.scripts_tiers']);
    const oranges = new Set(['contenu.stories_expirees', 'deploiement.csp']);
    return buildReport(HEALTH_LINES.map((l) => {
        if (l.location === 'humain') return outcome(l.id, 'blanc');
        if (rouges.has(l.id)) return outcome(l.id, 'rouge');
        if (oranges.has(l.id)) return outcome(l.id, 'orange');
        return outcome(l.id, 'vert');
    }));
}

describe('narration du bilan', () => {
    it('dit l\'état, la santé, la sécurité, les comptes, les priorités et le rang — sans jamais inventer', () => {
        const report = rapport();
        const texte = narrateReport({ report, securite: buildSecurityReport(report), rank: { role: 'admin', canRepair: false } });
        expect(texte).toMatch(/état rouge/);
        expect(texte).toMatch(/Santé \d+ % sur \d+ % du périmètre mesuré/);
        expect(texte).toMatch(/Sécurité \d+ % aujourd'hui, contre 61 % à l'audit/);
        expect(texte).toMatch(/2 rouges, 2 oranges/);
        expect(texte).toMatch(/Priorités : /);
        expect(texte).toMatch(/réparer exige le rang Admin Général/);
        expect(texte.length).toBeLessThan(1200);
    });

    it('dit que la santé est inconnue quand rien n\'est mesuré', () => {
        const report = buildReport(HEALTH_LINES.map((l) => outcome(l.id, 'blanc')));
        expect(narrateReport({ report, securite: null, rank: { role: 'super_admin', canRepair: true } })).toMatch(/inconnue, pas bonne/);
    });
});

describe('intentions', () => {
    const report = rapport();

    it('reconnaît analyser, restaurer, arrêter et aide', () => {
        expect(parseIntent('Analyse toute l\'application')).toEqual({ kind: 'analyser' });
        expect(parseIntent('lance le scan')).toEqual({ kind: 'analyser' });
        expect(parseIntent('restaure le lot')).toEqual({ kind: 'restaurer' });
        expect(parseIntent('stop')).toEqual({ kind: 'arreter' });
        expect(parseIntent('aide')).toEqual({ kind: 'aide' });
    });

    it('reconnaît les portées de réparation : tout, rouges, oranges, domaine, point', () => {
        expect(parseIntent('Répare tout le lot')).toEqual({ kind: 'reparer', scope: { kind: 'tout' } });
        expect(parseIntent('répare les rouges')).toEqual({ kind: 'reparer', scope: { kind: 'rouges' } });
        expect(parseIntent('corrige les oranges seulement')).toEqual({ kind: 'reparer', scope: { kind: 'oranges' } });
        expect(parseIntent('répare le domaine live')).toEqual({ kind: 'reparer', scope: { kind: 'bloc', blocId: 'live' } });
        expect(parseIntent('répare la base de données')).toEqual({ kind: 'reparer', scope: { kind: 'bloc', blocId: 'base' } });
        expect(parseIntent('répare les stories retirées à leur expiration', report))
            .toEqual({ kind: 'reparer', scope: { kind: 'ligne', lineId: 'contenu.stories_expirees' } });
    });

    it('ne devine JAMAIS une portée de réparation ambiguë : il demande de préciser', () => {
        const i = parseIntent('répare');
        expect(i.kind).toBe('preciser');
    });

    it('explique un point retrouvé par son titre, et pose une question libre sinon', () => {
        const e = parseIntent('explique l\'attribution de crédits réservée au serveur', report);
        expect(e).toEqual({ kind: 'expliquer', lineId: 'securite.forge_credits', query: "explique l'attribution de crédits réservée au serveur" });
        expect(parseIntent('combien de temps dure une sauvegarde ?', report).kind).toBe('question');
    });

    it('retrouve un point par ses mots, sans accents ni majuscules', () => {
        expect(normaliser('Élévation de RÔLE')).toBe('elevation de role');
        expect(findLineByText('attribution credits serveur', report)?.line.id).toBe('securite.forge_credits');
        expect(findLineByText('bonjour', report)).toBeNull();
    });
});

describe('explications et campagne', () => {
    const report = rapport();

    it('explique un point avec constat, cause, impact, risque et voie d\'action honnête', () => {
        const state = report.domains.flatMap((d) => d.lines).find((l) => l.line.id === 'securite.forge_credits')!;
        const texte = explainLine(state, { role: 'admin', canRepair: false });
        expect(texte).toMatch(/rouge — critique ou bloquant/);
        expect(texte).toMatch(/Cause probable :/);
        expect(texte).toMatch(/Impact :/);
        expect(texte).toMatch(/risque critique/);
        expect(texte).toMatch(/votre rang ne permet que le diagnostic/);
    });

    it('raconte une campagne : réparés, échecs, manuels, arrêt', async () => {
        const plan = planCampaign(report, { kind: 'tout' }, { role: 'super_admin', canRepair: true });
        const result = await runCampaign(plan, {
            diagnose: async (lineId, remediationId) => ({ lineId, remediationId, summary: '', affectedCount: 2, affectedTables: [], sample: [], reversible: true, confirmationToken: 'j', expiresAt: '' }),
            repair: async (lineId, remediationId) => ({ lineId, remediationId, ok: true, snapshotId: 's', changedCount: 2, verification: outcome(lineId, 'vert'), message: 'ok', journalId: 'j' }),
            restore: async () => { throw new Error('non appelé'); },
        }, { confirm: async () => true });
        const texte = narrateCampaign(result);
        expect(texte).toMatch(/100 % parcouru/);
        expect(texte).toMatch(/réparé/);
        expect(texte).toMatch(/à faire à la main/);
        expect(helpText({ role: 'admin', canRepair: false })).toMatch(/diagnostic seulement/);
    });

    it('prépare un contexte compact et factuel pour la passerelle IA', () => {
        const ctx = JSON.parse(contextForLlm({ report, securite: buildSecurityReport(report), rank: { role: 'admin', canRepair: false } }));
        expect(ctx.etat).toBe('rouge');
        expect(ctx.securite.audit).toBe(61);
        expect(ctx.lignesNonVertes.length).toBe(report.tally.rouge + report.tally.orange + report.tally.blanc + report.tally.jaune);
        expect(ctx.lignesNonVertes.every((l: any) => l.titre && l.statut && l.risque)).toBe(true);
    });
});
