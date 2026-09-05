// Campagne de réparation — le moteur de l'Assistant Santé Globale.
//
// Une campagne prend une PORTÉE (tout le lot, les rouges seuls, les oranges
// seuls, un domaine, un point) et la conduit boucle par boucle :
//
//   PLANIFIER → DIAGNOSTIQUER chaque point (aucune écriture)
//             → UNE confirmation humaine pour tout le lot
//             → RÉPARER point par point (sauvegarde, application, vérification,
//               journal : la séquence imposée par health-guardian)
//             → RESTAURER le lot en sens inverse si la Direction le demande.
//
// Ce que ce moteur ne fait JAMAIS :
//   • réparer sans diagnostic préalable ni sans la confirmation du lot ;
//   • continuer quand la situation devient incontrôlable (réseau, serveur,
//     droits, deux échecs de suite) : il s'arrête, dit pourquoi, et propose le
//     retour à l'état stable (restauration des sauvegardes du lot) ;
//   • faire croire qu'il répare quand le rang ne le permet pas : il passe en
//     mode DIAGNOSTIC et le dit ;
//   • toucher aux points qui n'ont pas de réparation automatique : il les
//     rapporte comme actions manuelles, avec l'endroit exact et les étapes.
//
// Fonctions pures + un exécuteur qui ne connaît le réseau que par les
// dépendances injectées : tout est testable sans navigateur ni base.

import {
    DiagnosisPlan,
    HealthBlockId,
    HealthLineState,
    HealthReport,
    HealthStatus,
    RemediationOutcome,
    RiskLevel,
} from '../healthTypes';
import { HEALTH_BLOCK_BY_ID } from '../healthRegistry';

// ─────────────────────────── Portée et plan ───────────────────────────

export type CampaignScope =
    | { kind: 'tout' }
    | { kind: 'rouges' }
    | { kind: 'oranges' }
    | { kind: 'bloc'; blocId: HealthBlockId }
    | { kind: 'ligne'; lineId: string };

/** `reparation` quand le rang permet d'appliquer ; `diagnostic` sinon — et on le dit. */
export type CampaignMode = 'reparation' | 'diagnostic';

export type CampaignItemKind = 'auto' | 'manuelle' | 'recommandee';

export interface CampaignItem {
    state: HealthLineState;
    kind: CampaignItemKind;
}

export interface CampaignRank {
    role: string | null;
    canRepair: boolean;
}

export interface CampaignPlan {
    scope: CampaignScope;
    label: string;
    mode: CampaignMode;
    /** Tous les points retenus, du plus grave au plus bénin. */
    items: CampaignItem[];
    autoItems: CampaignItem[];
    manualItems: CampaignItem[];
    recommendedItems: CampaignItem[];
}

const RISK_RANK: Record<RiskLevel, number> = { critique: 0, eleve: 1, moyen: 2, faible: 3 };
const STATUS_RANK: Record<HealthStatus, number> = { rouge: 0, orange: 1, blanc: 2, jaune: 3, vert: 4 };

export function scopeLabel(scope: CampaignScope, report?: HealthReport): string {
    switch (scope.kind) {
        case 'tout': return 'tout le lot';
        case 'rouges': return 'les rouges seuls';
        case 'oranges': return 'les oranges seuls';
        case 'bloc': return `le domaine « ${HEALTH_BLOCK_BY_ID.get(scope.blocId)?.title ?? scope.blocId} »`;
        case 'ligne': {
            const line = report?.domains.flatMap((d) => d.lines).find((l) => l.line.id === scope.lineId);
            return `le point « ${line?.line.title ?? scope.lineId} »`;
        }
    }
}

function aCorriger(state: HealthLineState): boolean {
    return state.outcome.status === 'rouge' || state.outcome.status === 'orange';
}

function trier(a: HealthLineState, b: HealthLineState): number {
    const parStatut = STATUS_RANK[a.outcome.status] - STATUS_RANK[b.outcome.status];
    if (parStatut !== 0) return parStatut;
    const parRisque = RISK_RANK[a.line.risk] - RISK_RANK[b.line.risk];
    if (parRisque !== 0) return parRisque;
    return b.line.weight - a.line.weight;
}

/**
 * Sélectionne les points d'une portée et les classe. Seuls les points ROUGES
 * ou ORANGES entrent dans une campagne : un vert n'a rien à réparer, un blanc
 * n'a pas été mesuré (on ne répare pas ce qu'on n'a pas vu).
 */
export function planCampaign(report: HealthReport, scope: CampaignScope, rank: CampaignRank): CampaignPlan {
    const toutes = report.domains.flatMap((d) => d.lines);
    const retenues = toutes.filter((state) => {
        if (!aCorriger(state)) return false;
        switch (scope.kind) {
            case 'tout': return true;
            case 'rouges': return state.outcome.status === 'rouge';
            case 'oranges': return state.outcome.status === 'orange';
            case 'bloc': return state.line.bloc === scope.blocId;
            case 'ligne': return state.line.id === scope.lineId;
        }
    }).sort(trier);

    const items: CampaignItem[] = retenues.map((state) => ({
        state,
        kind: state.line.remediation ? 'auto' : state.line.humanAction ? 'manuelle' : 'recommandee',
    }));

    return {
        scope,
        label: scopeLabel(scope, report),
        mode: rank.canRepair ? 'reparation' : 'diagnostic',
        items,
        autoItems: items.filter((i) => i.kind === 'auto'),
        manualItems: items.filter((i) => i.kind === 'manuelle'),
        recommendedItems: items.filter((i) => i.kind === 'recommandee'),
    };
}

// ─────────────────────────── Exécution ───────────────────────────

export interface CampaignDeps {
    diagnose(lineId: string, remediationId: string): Promise<DiagnosisPlan>;
    repair(lineId: string, remediationId: string, confirmationToken: string): Promise<RemediationOutcome>;
    restore(lineId: string, snapshotId: string): Promise<RemediationOutcome>;
}

export type CampaignPhase = 'diagnostic' | 'confirmation' | 'reparation' | 'termine' | 'arret';

/** Émis après CHAQUE boucle : c'est le « pourcentage de progression à chaque boucle ». */
export interface CampaignProgress {
    phase: CampaignPhase;
    loop: number;
    total: number;
    percent: number;
    /** Titre du point en cours, ou null entre deux phases. */
    current: string | null;
}

export interface ConsolidatedPlan {
    entries: { item: CampaignItem; plan: DiagnosisPlan }[];
    totalAffected: number;
    tables: string[];
}

export interface CampaignHooks {
    onProgress?: (progress: CampaignProgress) => void;
    /** UNE confirmation humaine pour tout le lot. `false` = rien n'est appliqué. */
    confirm: (plan: ConsolidatedPlan) => Promise<boolean>;
    /** Demande d'arrêt (bouton Arrêt) : relue avant chaque boucle. */
    isAborted?: () => boolean;
}

export type CampaignItemStatus =
    | 'reparee'        // appliquée, vérifiée, journalisée
    | 'echec'          // tentée, refusée ou en erreur — cause, étapes et lien fournis
    | 'diagnostiquee'  // mode diagnostic : le plan exact, rien d'appliqué
    | 'rien_a_faire'   // le diagnostic n'a trouvé aucun élément à corriger
    | 'manuelle'       // aucune réparation automatique : guide pas à pas
    | 'recommandee'    // aucune réparation automatique : recommandation
    | 'ignoree';       // non tentée (arrêt, refus, annulation)

export interface CampaignItemResult {
    item: CampaignItem;
    status: CampaignItemStatus;
    plan?: DiagnosisPlan;
    outcome?: RemediationOutcome;
    /** Cause exacte d'un échec, telle que renvoyée par le serveur ou constatée. */
    cause?: string;
    /** Étapes exactes à suivre (échec ou action manuelle). */
    steps: string[];
    /** Où aller : la fiche du point, et le lien du guide quand il existe. */
    link: { lineId: string; where?: string; manualUrl?: string };
    snapshotId?: string | null;
    verificationStatus?: HealthStatus | null;
}

export interface CampaignStop {
    motif: 'incontrolable' | 'annule' | 'refuse';
    detail: string;
}

export interface CampaignResult {
    plan: CampaignPlan;
    items: CampaignItemResult[];
    percent: number;
    counts: Record<CampaignItemStatus, number>;
    arret: CampaignStop | null;
    /** Sauvegardes prises par les réparations appliquées, dans l'ordre d'application. */
    snapshots: { lineId: string; snapshotId: string }[];
    startedAt: string;
    endedAt: string;
}

const MOTIFS_INCONTROLABLES = /réseau|network|fetch|délai|timeout|non-2xx|\b5\d\d\b|indisponible|authentification requise|non autorisé|réservée à l'admin/i;

/**
 * Un échec « incontrôlable » est un échec dont la cause n'est pas le point
 * lui-même : réseau, serveur, droits. Continuer aveuglément multiplierait les
 * demi-mesures ; on s'arrête et on rend la main.
 */
export function isUncontrollable(cause: string): boolean {
    return MOTIFS_INCONTROLABLES.test(cause);
}

/** Étapes exactes après un échec — dérivées de la cause, jamais génériques quand on peut mieux. */
export function stepsForFailure(item: CampaignItem, cause: string): string[] {
    const { line } = item.state;
    const steps: string[] = [];
    if (/périmètre a changé/i.test(cause)) {
        steps.push("Relancer l'analyse : le nombre d'éléments concernés a changé depuis le diagnostic.");
        steps.push('Relancer la réparation de ce point seul (point par point) pour confirmer le nouveau périmètre.');
    } else if (/confirmation invalide|expirée/i.test(cause)) {
        steps.push('Relancer le diagnostic : une confirmation expire après cinq minutes.');
        steps.push('Confirmer à nouveau le lot, puis appliquer.');
    } else if (/non autorisé|réservée à l'admin|jeton/i.test(cause)) {
        steps.push("Faire poser le rang Admin Général sur votre compte (fiche « Un Admin Général reconnu par la base »).");
        steps.push('Se déconnecter puis se reconnecter, et relancer la campagne.');
    } else if (isUncontrollable(cause)) {
        steps.push('Vérifier la connexion et que le service répond (Relancer l\'analyse).');
        steps.push('Si le lot a déjà modifié des données, restaurer le lot pour revenir à l\'état stable.');
        steps.push("Relancer la campagne une fois le service revenu ; signaler à la Direction si l'échec persiste.");
    } else {
        steps.push('Ouvrir la fiche du point et lire la cause exacte ci-dessous.');
        steps.push('Relancer ce point seul (point par point) après avoir corrigé la cause.');
    }
    if (line.manual) {
        steps.push(`À défaut, action manuelle — ${line.manual.where} :`);
        steps.push(...line.manual.steps);
    } else if (line.recommendedAction) {
        steps.push(`À défaut, action recommandée : ${line.recommendedAction}`);
    }
    return steps;
}

function linkFor(item: CampaignItem): CampaignItemResult['link'] {
    const { line } = item.state;
    return { lineId: line.id, where: line.manual?.where, manualUrl: line.manual?.url };
}

function manualResult(item: CampaignItem): CampaignItemResult {
    const { line } = item.state;
    if (item.kind === 'manuelle' && line.manual) {
        return {
            item, status: 'manuelle',
            steps: [line.humanAction ?? '', ...line.manual.steps].filter(Boolean),
            link: linkFor(item),
        };
    }
    return {
        item, status: 'recommandee',
        steps: [line.recommendedAction ?? line.humanAction ?? "Voir la fiche du point."],
        link: linkFor(item),
    };
}

function emptyCounts(): Record<CampaignItemStatus, number> {
    return { reparee: 0, echec: 0, diagnostiquee: 0, rien_a_faire: 0, manuelle: 0, recommandee: 0, ignoree: 0 };
}

function conclure(
    plan: CampaignPlan,
    results: CampaignItemResult[],
    percent: number,
    arret: CampaignStop | null,
    startedAt: string,
): CampaignResult {
    const counts = emptyCounts();
    for (const r of results) counts[r.status] += 1;
    return {
        plan,
        items: results,
        percent,
        counts,
        arret,
        snapshots: results
            .filter((r) => r.status === 'reparee' && r.snapshotId)
            .map((r) => ({ lineId: r.item.state.line.id, snapshotId: r.snapshotId as string })),
        startedAt,
        endedAt: new Date().toISOString(),
    };
}

/**
 * Conduit la campagne. Ne lève jamais : tout échec devient un résultat avec
 * sa cause, ses étapes et son lien ; toute situation incontrôlable devient un
 * arrêt explicite.
 */
export async function runCampaign(plan: CampaignPlan, deps: CampaignDeps, hooks: CampaignHooks): Promise<CampaignResult> {
    const startedAt = new Date().toISOString();
    const results = new Map<string, CampaignItemResult>();
    for (const item of plan.manualItems) results.set(item.state.line.id, manualResult(item));
    for (const item of plan.recommendedItems) results.set(item.state.line.id, manualResult(item));

    const auto = plan.autoItems;
    const phases = plan.mode === 'reparation' ? 2 : 1;
    const total = auto.length * phases;
    let loop = 0;
    const percent = () => (total === 0 ? 100 : Math.round((loop / total) * 100));
    const progress = (phase: CampaignPhase, current: string | null) =>
        hooks.onProgress?.({ phase, loop, total, percent: percent(), current });

    const ordre = () => [...plan.items.map((i) => results.get(i.state.line.id)).filter((r): r is CampaignItemResult => Boolean(r))];

    if (auto.length === 0) {
        progress('termine', null);
        return conclure(plan, ordre(), 100, null, startedAt);
    }

    // ── Phase 1 : diagnostic de chaque point, aucune écriture.
    const diagnostiques: { item: CampaignItem; plan: DiagnosisPlan }[] = [];
    for (const item of auto) {
        const { line } = item.state;
        if (hooks.isAborted?.()) {
            results.set(line.id, { item, status: 'ignoree', steps: ['Campagne arrêtée avant ce point.'], link: linkFor(item) });
            continue;
        }
        progress('diagnostic', line.title);
        try {
            const diag = await deps.diagnose(line.id, line.remediation!.id);
            diagnostiques.push({ item, plan: diag });
            results.set(line.id, {
                item,
                status: diag.affectedCount === 0 ? 'rien_a_faire' : 'diagnostiquee',
                plan: diag,
                steps: [],
                link: linkFor(item),
            });
        } catch (err) {
            const cause = err instanceof Error ? err.message : String(err);
            results.set(line.id, { item, status: 'echec', cause, steps: stepsForFailure(item, cause), link: linkFor(item) });
            if (isUncontrollable(cause)) {
                loop += 1;
                progress('arret', line.title);
                marquerIgnores(auto, results, `Arrêt pendant le diagnostic : ${cause}`);
                return conclure(plan, ordre(), percent(), { motif: 'incontrolable', detail: `Diagnostic impossible sur « ${line.title} » : ${cause}` }, startedAt);
            }
        }
        loop += 1;
        progress('diagnostic', line.title);
    }

    if (hooks.isAborted?.()) {
        marquerIgnores(auto, results, 'Campagne arrêtée par la Direction.');
        progress('arret', null);
        return conclure(plan, ordre(), percent(), { motif: 'annule', detail: 'Arrêt demandé pendant le diagnostic. Rien n\'a été appliqué.' }, startedAt);
    }

    if (plan.mode === 'diagnostic') {
        progress('termine', null);
        return conclure(plan, ordre(), 100, null, startedAt);
    }

    // ── Phase 2 : UNE confirmation pour le lot réellement applicable.
    const applicables = diagnostiques.filter(({ plan: d }) => d.affectedCount > 0);
    for (const { item, plan: d } of applicables) {
        if (!d.confirmationToken) {
            const cause = "Aucun jeton de confirmation renvoyé : votre rang ne permet pas d'appliquer cette réparation.";
            results.set(item.state.line.id, { item, status: 'echec', plan: d, cause, steps: stepsForFailure(item, cause), link: linkFor(item) });
        }
    }
    const confirmables = applicables.filter(({ plan: d }) => Boolean(d.confirmationToken));
    if (confirmables.length === 0) {
        loop = total;
        progress('termine', null);
        return conclure(plan, ordre(), 100, null, startedAt);
    }

    progress('confirmation', null);
    const consolidated: ConsolidatedPlan = {
        entries: confirmables,
        totalAffected: confirmables.reduce((n, e) => n + e.plan.affectedCount, 0),
        tables: [...new Set(confirmables.flatMap((e) => e.plan.affectedTables ?? []))],
    };
    const accord = await hooks.confirm(consolidated);
    if (!accord) {
        for (const { item, plan: d } of confirmables) {
            results.set(item.state.line.id, { item, status: 'ignoree', plan: d, steps: ['Lot non confirmé : rien n\'a été appliqué.'], link: linkFor(item) });
        }
        loop = total;
        progress('arret', null);
        return conclure(plan, ordre(), percent(), { motif: 'refuse', detail: 'Lot non confirmé par la Direction : aucune modification.' }, startedAt);
    }

    // ── Phase 3 : réparation point par point, arrêt à la première dérive.
    let echecsConsecutifs = 0;
    for (let i = 0; i < confirmables.length; i += 1) {
        const { item, plan: d } = confirmables[i];
        const { line } = item.state;
        if (hooks.isAborted?.()) {
            for (const reste of confirmables.slice(i)) {
                results.set(reste.item.state.line.id, { item: reste.item, status: 'ignoree', plan: reste.plan, steps: ['Campagne arrêtée par la Direction avant ce point.'], link: linkFor(reste.item) });
            }
            progress('arret', line.title);
            return conclure(plan, ordre(), percent(), { motif: 'annule', detail: `Arrêt demandé avant « ${line.title} ». Les points déjà réparés restent restaurables.` }, startedAt);
        }
        progress('reparation', line.title);
        let cause: string | null = null;
        try {
            const outcome = await deps.repair(line.id, line.remediation!.id, d.confirmationToken);
            if (outcome.ok) {
                results.set(line.id, {
                    item, status: 'reparee', plan: d, outcome, steps: [], link: linkFor(item),
                    snapshotId: outcome.snapshotId, verificationStatus: outcome.verification?.status ?? null,
                });
                echecsConsecutifs = 0;
            } else {
                cause = outcome.message || 'Réparation refusée sans message.';
                results.set(line.id, { item, status: 'echec', plan: d, outcome, cause, steps: stepsForFailure(item, cause), link: linkFor(item), snapshotId: outcome.snapshotId });
            }
        } catch (err) {
            cause = err instanceof Error ? err.message : String(err);
            results.set(line.id, { item, status: 'echec', plan: d, cause, steps: stepsForFailure(item, cause), link: linkFor(item) });
        }
        loop += 1;
        if (cause !== null) {
            echecsConsecutifs += 1;
            const incontrolable = isUncontrollable(cause) || echecsConsecutifs >= 2;
            if (incontrolable) {
                for (const reste of confirmables.slice(i + 1)) {
                    results.set(reste.item.state.line.id, { item: reste.item, status: 'ignoree', plan: reste.plan, steps: ['Non tentée : la campagne s\'est arrêtée avant ce point.', 'Restaurer le lot si nécessaire, puis relancer après correction.'], link: linkFor(reste.item) });
                }
                progress('arret', line.title);
                const detail = isUncontrollable(cause)
                    ? `Situation incontrôlable sur « ${line.title} » : ${cause}`
                    : `Deux échecs consécutifs (dernier : « ${line.title} » — ${cause}) : arrêt par prudence.`;
                return conclure(plan, ordre(), percent(), { motif: 'incontrolable', detail }, startedAt);
            }
        }
        progress('reparation', line.title);
    }

    loop = total;
    progress('termine', null);
    return conclure(plan, ordre(), 100, null, startedAt);
}

function marquerIgnores(auto: CampaignItem[], results: Map<string, CampaignItemResult>, motif: string): void {
    for (const item of auto) {
        if (!results.has(item.state.line.id)) {
            results.set(item.state.line.id, { item, status: 'ignoree', steps: [motif], link: linkFor(item) });
        }
    }
}

// ─────────────────────────── Retour à l'état stable ───────────────────────────

export interface RollbackResult {
    restored: number;
    failed: { lineId: string; title: string; cause: string }[];
}

/**
 * Restaure les sauvegardes du lot en ORDRE INVERSE d'application. C'est le
 * « retour à l'état stable initial » : chaque réparation appliquée avait sa
 * sauvegarde, on les rejoue de la dernière à la première.
 */
export async function rollbackCampaign(
    result: CampaignResult,
    deps: CampaignDeps,
    onProgress?: (done: number, total: number, current: string) => void,
): Promise<RollbackResult> {
    const aRestaurer = [...result.snapshots].reverse();
    const failed: RollbackResult['failed'] = [];
    let restored = 0;
    for (let i = 0; i < aRestaurer.length; i += 1) {
        const { lineId, snapshotId } = aRestaurer[i];
        const title = result.items.find((r) => r.item.state.line.id === lineId)?.item.state.line.title ?? lineId;
        onProgress?.(i, aRestaurer.length, title);
        try {
            const outcome = await deps.restore(lineId, snapshotId);
            if (outcome.ok) restored += 1;
            else failed.push({ lineId, title, cause: outcome.message || 'Restauration refusée sans message.' });
        } catch (err) {
            failed.push({ lineId, title, cause: err instanceof Error ? err.message : String(err) });
        }
    }
    onProgress?.(aRestaurer.length, aRestaurer.length, '');
    return { restored, failed };
}
