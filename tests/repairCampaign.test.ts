import { describe, expect, it, vi } from 'vitest';
import { HEALTH_LINES } from '../services/health/healthRegistry';
import { buildReport } from '../services/health/healthScore';
import { DiagnosisPlan, HealthStatus, ProbeOutcome, RemediationOutcome } from '../services/health/healthTypes';
import {
    CampaignDeps,
    CampaignProgress,
    isUncontrollable,
    planCampaign,
    rollbackCampaign,
    runCampaign,
    scopeLabel,
    stepsForFailure,
} from '../services/health/assistant/repairCampaign';

/**
 * Le moteur de campagne conduit les réparations boucle par boucle. Ces tests
 * tiennent ses promesses : une portée choisie ne touche que ses points, la
 * progression est dite à chaque boucle, un échec porte sa cause et ses
 * étapes, une situation incontrôlable arrête tout et laisse restaurer, et
 * sans le rang il n'applique rien — il le dit.
 */

const outcome = (lineId: string, status: HealthStatus): ProbeOutcome => ({
    lineId, status, proofLevel: status === 'blanc' ? 'non_eprouve' : 'reel', measured: `mesure ${status}`, ranAt: '2026-09-05T00:00:00.000Z',
});

/** Photographie proche de la production du 5/09 : rouges, oranges, blancs. */
function rapportProduction() {
    const rouges = new Set(['securite.forge_credits', 'securite.portefeuille_credit', 'deploiement.scripts_tiers', 'gouvernance.schema_versionne', 'live.transcriptions_a_purger']);
    const oranges = new Set(['contenu.stories_expirees', 'notifications.abonnements_morts', 'securite.grants_anon', 'securite.depense_ia_publique', 'deploiement.csp', 'ia.budget_arme', 'securite.cors_fonctions']);
    return buildReport(HEALTH_LINES.map((l) => {
        if (l.location === 'humain') return outcome(l.id, 'blanc');
        if (rouges.has(l.id)) return outcome(l.id, 'rouge');
        if (oranges.has(l.id)) return outcome(l.id, 'orange');
        return outcome(l.id, 'vert');
    }));
}

const ADMIN_GENERAL = { role: 'super_admin', canRepair: true };
const ADMIN = { role: 'admin', canRepair: false };

function plan(lineId: string, remediationId: string, affectedCount: number, token: string | null): DiagnosisPlan {
    return {
        lineId, remediationId, summary: '', affectedCount, affectedTables: ['t'], sample: [], reversible: true,
        confirmationToken: token as string, expiresAt: '2026-09-05T00:05:00.000Z',
    };
}

function outcomeOk(lineId: string, remediationId: string, snapshotId = `snap-${lineId}`): RemediationOutcome {
    return { lineId, remediationId, ok: true, snapshotId, changedCount: 3, verification: outcome(lineId, 'vert'), message: 'ok', journalId: 'j' };
}

function depsSaines(): CampaignDeps & { appliques: string[]; restaures: string[] } {
    const appliques: string[] = [];
    const restaures: string[] = [];
    return {
        appliques, restaures,
        diagnose: vi.fn(async (lineId, remediationId) => plan(lineId, remediationId, 3, `jeton-${lineId}`)),
        repair: vi.fn(async (lineId, remediationId) => { appliques.push(lineId); return outcomeOk(lineId, remediationId); }),
        restore: vi.fn(async (lineId, snapshotId) => { restaures.push(snapshotId); return outcomeOk(lineId, 'r', snapshotId); }),
    };
}

describe('planification d\'une campagne', () => {
    const report = rapportProduction();

    it('« tout le lot » retient tous les rouges et oranges, rien d\'autre, du plus grave au plus bénin', () => {
        const p = planCampaign(report, { kind: 'tout' }, ADMIN_GENERAL);
        expect(p.items.length).toBe(report.tally.rouge + report.tally.orange);
        expect(p.items.every((i) => i.state.outcome.status === 'rouge' || i.state.outcome.status === 'orange')).toBe(true);
        expect(p.items[0].state.outcome.status).toBe('rouge');
        expect(p.items[0].state.line.risk).toBe('critique');
        expect(p.autoItems.length + p.manualItems.length + p.recommendedItems.length).toBe(p.items.length);
        expect(p.mode).toBe('reparation');
    });

    it('« les rouges seuls » et « les oranges seuls » ne se recouvrent pas', () => {
        const r = planCampaign(report, { kind: 'rouges' }, ADMIN_GENERAL);
        const o = planCampaign(report, { kind: 'oranges' }, ADMIN_GENERAL);
        expect(r.items.every((i) => i.state.outcome.status === 'rouge')).toBe(true);
        expect(o.items.every((i) => i.state.outcome.status === 'orange')).toBe(true);
        expect(r.items.length + o.items.length).toBe(report.tally.rouge + report.tally.orange);
    });

    it('« par domaine » ne touche qu\'au domaine demandé', () => {
        const p = planCampaign(report, { kind: 'bloc', blocId: 'securite' }, ADMIN_GENERAL);
        expect(p.items.length).toBeGreaterThan(0);
        expect(p.items.every((i) => i.state.line.bloc === 'securite')).toBe(true);
        expect(scopeLabel(p.scope)).toContain('Sécurité');
    });

    it('« point par point » ne retient que le point, et rien si le point est vert', () => {
        const p = planCampaign(report, { kind: 'ligne', lineId: 'contenu.stories_expirees' }, ADMIN_GENERAL);
        expect(p.items.map((i) => i.state.line.id)).toEqual(['contenu.stories_expirees']);
        expect(p.items[0].kind).toBe('auto');
        const vert = planCampaign(report, { kind: 'ligne', lineId: 'securite.rls_couverture' }, ADMIN_GENERAL);
        expect(vert.items).toEqual([]);
    });

    it('sans le rang, la campagne est un DIAGNOSTIC — jamais une réparation déguisée', () => {
        expect(planCampaign(report, { kind: 'tout' }, ADMIN).mode).toBe('diagnostic');
    });
});

describe('exécution d\'une campagne', () => {
    const report = rapportProduction();

    it('dit la progression à CHAQUE boucle, diagnostique puis répare, et finit à 100 %', async () => {
        const p = planCampaign(report, { kind: 'oranges' }, ADMIN_GENERAL);
        const deps = depsSaines();
        const progres: CampaignProgress[] = [];
        const confirm = vi.fn(async () => true);
        const result = await runCampaign(p, deps, { onProgress: (x) => progres.push(x), confirm });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(result.percent).toBe(100);
        expect(result.arret).toBeNull();
        expect(result.counts.reparee).toBe(p.autoItems.length);
        expect(result.counts.manuelle + result.counts.recommandee).toBe(p.items.length - p.autoItems.length);
        expect(deps.appliques.length).toBe(p.autoItems.length);
        // Une boucle = un pourcentage ; la suite est croissante et se termine à 100.
        const pourcentages = progres.map((x) => x.percent);
        for (let i = 1; i < pourcentages.length; i += 1) expect(pourcentages[i]).toBeGreaterThanOrEqual(pourcentages[i - 1]);
        expect(pourcentages[pourcentages.length - 1]).toBe(100);
        expect(progres.some((x) => x.phase === 'confirmation')).toBe(true);
        expect(result.snapshots.length).toBe(p.autoItems.length);
    });

    it('sans le rang : diagnostic de chaque point, rien d\'appliqué, aucune confirmation demandée', async () => {
        const p = planCampaign(report, { kind: 'rouges' }, ADMIN);
        const deps = depsSaines();
        (deps.diagnose as any).mockImplementation(async (lineId: string, remediationId: string) => plan(lineId, remediationId, 3, null));
        const confirm = vi.fn(async () => true);
        const result = await runCampaign(p, deps, { confirm });
        expect(confirm).not.toHaveBeenCalled();
        expect(deps.repair).not.toHaveBeenCalled();
        expect(result.counts.diagnostiquee).toBe(p.autoItems.length);
        expect(result.percent).toBe(100);
    });

    it('un lot refusé n\'applique rien et le dit', async () => {
        const p = planCampaign(report, { kind: 'rouges' }, ADMIN_GENERAL);
        const deps = depsSaines();
        const result = await runCampaign(p, deps, { confirm: async () => false });
        expect(deps.repair).not.toHaveBeenCalled();
        expect(result.arret?.motif).toBe('refuse');
        expect(result.counts.ignoree).toBe(p.autoItems.length);
    });

    it('un échec porte sa cause, ses étapes et son lien — et la campagne continue sur le point suivant', async () => {
        const p = planCampaign(report, { kind: 'oranges' }, ADMIN_GENERAL);
        const deps = depsSaines();
        const premier = p.autoItems[0].state.line.id;
        (deps.repair as any).mockImplementation(async (lineId: string, remediationId: string) => {
            if (lineId === premier) return { ...outcomeOk(lineId, remediationId), ok: false, message: 'Le périmètre a changé depuis votre confirmation (3 → 2).' };
            deps.appliques.push(lineId);
            return outcomeOk(lineId, remediationId);
        });
        const result = await runCampaign(p, deps, { confirm: async () => true });
        const echec = result.items.find((r) => r.item.state.line.id === premier)!;
        expect(echec.status).toBe('echec');
        expect(echec.cause).toMatch(/périmètre a changé/);
        expect(echec.steps[0]).toMatch(/Relancer l'analyse/);
        expect(echec.link.lineId).toBe(premier);
        expect(result.arret).toBeNull();
        expect(result.counts.reparee).toBe(p.autoItems.length - 1);
    });

    it('une situation incontrôlable (réseau, serveur, droits) arrête tout, marque le reste « non tenté » et garde les sauvegardes', async () => {
        const p = planCampaign(report, { kind: 'oranges' }, ADMIN_GENERAL);
        const deps = depsSaines();
        const second = p.autoItems[1].state.line.id;
        (deps.repair as any).mockImplementation(async (lineId: string, remediationId: string) => {
            if (lineId === second) throw new Error('La connexion au service IA a échoué — vérifiez votre réseau.');
            deps.appliques.push(lineId);
            return outcomeOk(lineId, remediationId);
        });
        const result = await runCampaign(p, deps, { confirm: async () => true });
        expect(result.arret?.motif).toBe('incontrolable');
        expect(result.counts.reparee).toBe(1);
        expect(result.counts.echec).toBe(1);
        expect(result.counts.ignoree).toBe(p.autoItems.length - 2);
        expect(result.snapshots).toEqual([{ lineId: p.autoItems[0].state.line.id, snapshotId: `snap-${p.autoItems[0].state.line.id}` }]);
        expect(result.percent).toBeLessThan(100);
    });

    it('deux échecs consécutifs, même « ordinaires », arrêtent la campagne par prudence', async () => {
        const p = planCampaign(report, { kind: 'oranges' }, ADMIN_GENERAL);
        const deps = depsSaines();
        (deps.repair as any).mockImplementation(async (lineId: string, remediationId: string) => ({ ...outcomeOk(lineId, remediationId), ok: false, message: 'Refus métier.' }));
        const result = await runCampaign(p, deps, { confirm: async () => true });
        expect(result.arret?.motif).toBe('incontrolable');
        expect(result.arret?.detail).toMatch(/Deux échecs consécutifs/);
        expect(result.counts.echec).toBe(2);
    });

    it('un diagnostic sans rien à corriger ne demande aucune confirmation', async () => {
        const p = planCampaign(report, { kind: 'ligne', lineId: 'contenu.stories_expirees' }, ADMIN_GENERAL);
        const deps = depsSaines();
        (deps.diagnose as any).mockImplementation(async (lineId: string, remediationId: string) => plan(lineId, remediationId, 0, null));
        const confirm = vi.fn(async () => true);
        const result = await runCampaign(p, deps, { confirm });
        expect(confirm).not.toHaveBeenCalled();
        expect(result.counts.rien_a_faire).toBe(1);
        expect(result.percent).toBe(100);
    });

    it('l\'arrêt demandé par la Direction est honoré avant la boucle suivante', async () => {
        const p = planCampaign(report, { kind: 'oranges' }, ADMIN_GENERAL);
        const deps = depsSaines();
        let stop = false;
        (deps.repair as any).mockImplementation(async (lineId: string, remediationId: string) => { deps.appliques.push(lineId); stop = true; return outcomeOk(lineId, remediationId); });
        const result = await runCampaign(p, deps, { confirm: async () => true, isAborted: () => stop });
        expect(result.arret?.motif).toBe('annule');
        expect(result.counts.reparee).toBe(1);
        expect(result.counts.ignoree).toBe(p.autoItems.length - 1);
    });

    it('la restauration du lot rejoue les sauvegardes en ordre inverse', async () => {
        const p = planCampaign(report, { kind: 'oranges' }, ADMIN_GENERAL);
        const deps = depsSaines();
        const result = await runCampaign(p, deps, { confirm: async () => true });
        const retour = await rollbackCampaign(result, deps);
        expect(retour.restored).toBe(result.snapshots.length);
        expect(retour.failed).toEqual([]);
        expect(deps.restaures).toEqual([...result.snapshots].reverse().map((s) => s.snapshotId));
    });
});

describe('qualification des échecs', () => {
    it('reconnaît ce qui est incontrôlable', () => {
        expect(isUncontrollable('La connexion au service IA a échoué — vérifiez votre réseau.')).toBe(true);
        expect(isUncontrollable('Edge Function returned a non-2xx status code')).toBe(true);
        expect(isUncontrollable("Non autorisé : cette action est réservée à l'Admin Général (rôle super_admin).")).toBe(true);
        expect(isUncontrollable('Le périmètre a changé depuis votre confirmation (3 → 2).')).toBe(false);
    });

    it('donne des étapes adaptées à la cause, puis l\'action manuelle du point quand elle existe', () => {
        const report = rapportProduction();
        const item = planCampaign(report, { kind: 'ligne', lineId: 'securite.forge_credits' }, ADMIN_GENERAL).items[0];
        expect(stepsForFailure(item, 'Confirmation invalide ou expirée. Relancez le diagnostic.')[0]).toMatch(/cinq minutes/);
        expect(stepsForFailure(item, "Non autorisé : réservée à l'Admin Général")[0]).toMatch(/rang Admin Général/);
        const manuel = planCampaign(report, { kind: 'ligne', lineId: 'deploiement.scripts_tiers' }, ADMIN_GENERAL).items[0];
        const etapes = stepsForFailure({ ...manuel, kind: 'auto' }, 'erreur inconnue');
        expect(etapes.some((e) => e.startsWith('À défaut, action manuelle'))).toBe(true);
    });
});
