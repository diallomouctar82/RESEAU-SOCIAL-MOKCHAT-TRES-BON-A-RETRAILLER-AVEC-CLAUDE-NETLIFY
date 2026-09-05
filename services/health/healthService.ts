// Point d'entrée UNIQUE du tableau de bord de santé.
//
// Deux sources de mesure, réunies ici en un seul rapport :
//
//   • SERVEUR — Edge Function `health-guardian` : droits, politiques,
//     contraintes, compteurs d'intégrité et d'exploitation.
//   • NAVIGATEUR — ce fichier : ce que l'utilisateur reçoit RÉELLEMENT
//     (en-têtes servis, origines exécutées, service worker, manifeste,
//     stockage local). Aucun serveur ne peut constater ces choses à sa place.
//
// Règle tenue de bout en bout : ce qui n'a pas pu être mesuré reste BLANC.
// Une fonction non déployée, un réseau coupé, un rang insuffisant produisent
// des lignes blanches — jamais des lignes vertes.

import { supabase } from '../supabaseClient';
import {
    DiagnosisPlan,
    HealthJournalEntry,
    HealthReport,
    ProbeOutcome,
    RemediationOutcome,
} from './healthTypes';
import { HEALTH_LINES } from './healthRegistry';
import { blankOutcome, buildReport, validateRegistry } from './healthScore';
import type {
    LiveEmergencyAction,
    LiveEmergencyOverview,
    LiveEmergencyPlan,
    LiveEmergencyResult,
} from './liveEmergency';

/** Rang de l'appelant, tel que la base le rapporte. */
export interface HealthRank {
    role: string | null;
    canRead: boolean;
    /** Vrai uniquement pour l'Admin Général (`super_admin`). */
    canRepair: boolean;
}

const RANG_INCONNU: HealthRank = { role: null, canRead: false, canRepair: false };

/**
 * `error.message` de supabase-js pour un échec HTTP est toujours le texte
 * générique « Edge Function returned a non-2xx status code » ; le vrai
 * message est dans le corps. Même lecture que `services/aiGateway.ts`, pour
 * la même raison : sans elle, l'administrateur ne voit jamais la cause réelle.
 */
async function readFunctionError(error: any): Promise<string> {
    try {
        const body = await error?.context?.json?.();
        if (body?.error) return String(body.error);
    } catch { /* corps illisible */ }
    return error?.message ? String(error.message) : 'Erreur inconnue.';
}

async function invoke<T>(body: Record<string, unknown>): Promise<{ data: T | null; error: string | null }> {
    try {
        const { data, error } = await supabase.functions.invoke('health-guardian', { body });
        if (error) return { data: null, error: await readFunctionError(error) };
        return { data: data as T, error: null };
    } catch (err) {
        return { data: null, error: err instanceof Error ? err.message : String(err) };
    }
}

// ─────────────────────── SONDES NAVIGATEUR ───────────────────────

const maintenant = () => new Date().toISOString();

function outcome(
    lineId: string,
    status: ProbeOutcome['status'],
    measured: string,
    extra: Partial<ProbeOutcome> = {},
): ProbeOutcome {
    return { lineId, status, proofLevel: 'production', measured, ranAt: maintenant(), ...extra };
}

/**
 * En-têtes RÉELLEMENT servis pour cette page. Mesure de niveau production :
 * elle ne lit pas `netlify.toml`, elle lit la réponse du serveur. C'est la
 * différence entre « la configuration dit » et « le navigateur reçoit ».
 */
async function probeHeaders(): Promise<ProbeOutcome[]> {
    let res: Response;
    try {
        res = await fetch(window.location.origin + '/', { method: 'HEAD', cache: 'no-store' });
    } catch (err) {
        const raison = `En-têtes illisibles : ${err instanceof Error ? err.message : String(err)}`;
        return [
            blankOutcome('deploiement.entetes_securite', raison),
            blankOutcome('deploiement.csp', raison),
            blankOutcome('deploiement.https_strict', raison),
        ];
    }

    const get = (name: string) => res.headers.get(name);

    const ATTENDUS = ['x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy'];
    const manquants = ATTENDUS.filter((h) => !get(h));
    const entetes: ProbeOutcome = manquants.length === 0
        ? outcome('deploiement.entetes_securite', 'vert', 'Les quatre en-têtes de sécurité sont servis.')
        : outcome('deploiement.entetes_securite', manquants.length >= 3 ? 'rouge' : 'orange',
            `${manquants.length} en-tête(s) manquant(s) : ${manquants.join(', ')}.`,
            { gap: 'Attendu les quatre.', evidence: { manquants } });

    const csp = get('content-security-policy');
    const cspReport = get('content-security-policy-report-only');
    const cspOutcome: ProbeOutcome = csp
        ? outcome('deploiement.csp', 'vert', 'Une politique de sécurité du contenu est appliquée.')
        : cspReport
            ? outcome('deploiement.csp', 'orange',
                "Politique présente mais en mode observation seule (Report-Only).",
                { gap: "Elle n'empêche encore rien ; à basculer en application." })
            : outcome('deploiement.csp', 'orange', "Aucune Content-Security-Policy servie.",
                { gap: "Dernière barrière absente en cas d'injection." });

    const hsts = get('strict-transport-security');
    const chiffre = window.location.protocol === 'https:';
    const httpsOutcome: ProbeOutcome = chiffre && hsts
        ? outcome('deploiement.https_strict', 'vert', 'HTTPS avec HSTS actif.')
        : !chiffre
            ? outcome('deploiement.https_strict', 'rouge', `Page servie en ${window.location.protocol}`,
                { gap: 'Le trafic n\'est pas chiffré.' })
            : outcome('deploiement.https_strict', 'orange', 'HTTPS actif, mais sans en-tête HSTS.',
                { gap: 'Une première visite en clair peut être détournée.' });

    return [entetes, cspOutcome, httpsOutcome];
}

/**
 * Origines réellement exécutées par la page. Les feuilles de style et les
 * polices sont exclues : elles ne peuvent pas lire le jeton de session. Seul
 * ce qui s'exécute compte ici.
 */
function probeThirdPartyScripts(): ProbeOutcome {
    const ici = window.location.origin;
    const externes = Array.from(document.querySelectorAll<HTMLScriptElement>('script[src]'))
        .map((s) => s.src)
        .filter((src) => {
            try { return new URL(src, ici).origin !== ici; } catch { return false; }
        });

    const origines = [...new Set(externes.map((src) => {
        try { return new URL(src).origin; } catch { return src; }
    }))];

    if (origines.length === 0) {
        return outcome('deploiement.scripts_tiers', 'vert', 'Aucun script tiers exécuté.');
    }
    return outcome('deploiement.scripts_tiers', 'rouge',
        `${origines.length} origine(s) tierce(s) exécutée(s) : ${origines.join(', ')}.`,
        {
            gap: "Ce code s'exécute avec les droits de la page : il peut lire le jeton de session.",
            evidence: { origines },
        });
}

async function probeExperience(): Promise<ProbeOutcome[]> {
    const resultats: ProbeOutcome[] = [];

    // Service worker.
    if (!('serviceWorker' in navigator)) {
        resultats.push(outcome('experience.service_worker', 'rouge',
            "Ce navigateur ne gère pas les service workers.",
            { gap: "Ni notification d'appel, ni fonctionnement hors connexion." }));
    } else {
        try {
            const regs = await navigator.serviceWorker.getRegistrations();
            const actif = regs.some((r) => r.active);
            const controle = Boolean(navigator.serviceWorker.controller);
            resultats.push(
                actif && controle
                    ? outcome('experience.service_worker', 'vert', 'Service worker actif et contrôlant la page.')
                    : actif
                        ? outcome('experience.service_worker', 'orange',
                            "Service worker actif mais ne contrôle pas encore la page.",
                            { gap: 'Effectif au prochain chargement.' })
                        : outcome('experience.service_worker', 'rouge', "Aucun service worker enregistré.",
                            { gap: "Les appels entrants ne réveilleront pas le téléphone." }),
            );
        } catch (err) {
            resultats.push(blankOutcome('experience.service_worker',
                `État du service worker illisible : ${err instanceof Error ? err.message : String(err)}`));
        }
    }

    // Manifestes (application principale et module messagerie autonome).
    const manifestes: { lineId: string; url: string; libelle: string }[] = [
        { lineId: 'experience.manifeste', url: '/manifest.webmanifest', libelle: "Manifeste principal" },
        { lineId: 'experience.module_messagerie', url: '/manifests/messagerie.webmanifest', libelle: "Manifeste du module messagerie" },
    ];
    for (const m of manifestes) {
        try {
            const res = await fetch(m.url, { cache: 'no-store' });
            if (!res.ok) {
                resultats.push(outcome(m.lineId, 'rouge', `${m.libelle} : réponse ${res.status}.`,
                    { gap: "L'application ne peut pas être installée par ce chemin." }));
                continue;
            }
            const manifest = await res.json() as { name?: string; icons?: unknown[] };
            const complet = Boolean(manifest?.name) && Array.isArray(manifest?.icons) && manifest.icons.length > 0;
            resultats.push(complet
                ? outcome(m.lineId, 'vert', `${m.libelle} servi, nom et icônes présents.`)
                : outcome(m.lineId, 'orange', `${m.libelle} servi mais incomplet.`,
                    { gap: 'Nom ou icônes manquants : installation dégradée.' }));
        } catch (err) {
            resultats.push(blankOutcome(m.lineId,
                `${m.libelle} injoignable : ${err instanceof Error ? err.message : String(err)}`));
        }
    }

    // Stockage local.
    try {
        const cle = '__moknet_health__';
        window.localStorage.setItem(cle, '1');
        const relu = window.localStorage.getItem(cle);
        window.localStorage.removeItem(cle);
        resultats.push(relu === '1'
            ? outcome('experience.stockage_local', 'vert', 'Lecture et écriture locales opérationnelles.')
            : outcome('experience.stockage_local', 'rouge', "Écriture locale sans relecture possible.",
                { gap: "Session perdue à chaque rechargement." }));
    } catch (err) {
        resultats.push(outcome('experience.stockage_local', 'rouge',
            `Stockage local inaccessible : ${err instanceof Error ? err.message : String(err)}`,
            { gap: "Navigation privée ou site bloqué : l'utilisateur sera déconnecté à chaque rechargement." }));
    }

    return resultats;
}

async function runClientProbes(): Promise<ProbeOutcome[]> {
    const [entetes, experience] = await Promise.all([probeHeaders(), probeExperience()]);
    return [...entetes, probeThirdPartyScripts(), ...experience];
}

// ─────────────────────── API DU TABLEAU DE BORD ───────────────────────

export interface HealthSnapshot {
    report: HealthReport;
    rank: HealthRank;
    /** Renseigné quand les sondes serveur n'ont pas pu tourner. */
    serverError: string | null;
}

/**
 * Mesure complète. Les sondes serveur et navigateur tournent de front : elles
 * ne dépendent pas les unes des autres, les enchaîner ne ferait qu'additionner
 * leurs latences.
 */
/** Phases réelles d'une analyse, dans l'ordre où elles se terminent. */
export type HealthCheckPhase = 'serveur' | 'navigateur';

export async function runHealthCheck(options?: { onPhase?: (phase: HealthCheckPhase) => void }): Promise<HealthSnapshot> {
    const problemes = validateRegistry();
    if (problemes.length > 0) {
        // Un registre incohérent produirait une note fausse sans rien
        // signaler : mieux vaut refuser de noter que noter faux.
        throw new Error(`Registre de santé incohérent : ${problemes.join(' | ')}`);
    }

    // Les deux familles de sondes tournent de front ; chacune annonce sa fin
    // pour que l'Assistant affiche une progression RÉELLE, pas un sablier.
    const [serveur, client] = await Promise.all([
        invoke<{ outcomes: ProbeOutcome[]; rank: HealthRank }>({ action: 'probe' })
            .then((r) => { options?.onPhase?.('serveur'); return r; }),
        runClientProbes().then((r) => { options?.onPhase?.('navigateur'); return r; }),
    ]);

    const outcomes: ProbeOutcome[] = [...client];
    let serverError: string | null = null;
    let rank: HealthRank = RANG_INCONNU;

    if (serveur.error || !serveur.data) {
        serverError = serveur.error ?? 'Réponse vide des sondes serveur.';
        // Chaque ligne serveur devient BLANCHE avec la raison. Jamais verte.
        for (const line of HEALTH_LINES) {
            if (line.location === 'serveur') {
                outcomes.push(blankOutcome(line.id, `Sonde serveur indisponible : ${serverError}`));
            }
        }
    } else {
        outcomes.push(...serveur.data.outcomes);
        rank = serveur.data.rank ?? RANG_INCONNU;
    }

    // Les lignes de portée humaine ne sont mesurables par aucune sonde : elles
    // restent blanches et portent l'action à mener. Les compter en vert serait
    // le faux vert le plus facile à commettre.
    for (const line of HEALTH_LINES) {
        if (line.location === 'humain') {
            outcomes.push(blankOutcome(line.id, "Contrôle humain — non mesurable automatiquement."));
        }
    }

    return { report: buildReport(outcomes), rank, serverError };
}

/** Établit ce qu'une réparation FERAIT, sans rien modifier. */
export async function diagnose(lineId: string, remediationId: string): Promise<DiagnosisPlan> {
    const { data, error } = await invoke<DiagnosisPlan>({ action: 'diagnose', lineId, remediationId });
    if (error || !data) throw new Error(error ?? 'Diagnostic sans réponse.');
    return data;
}

/**
 * Applique une réparation. Le jeton provient du diagnostic et lie la
 * confirmation au périmètre exact affiché : sans lui, le serveur refuse.
 */
export async function repair(
    lineId: string,
    remediationId: string,
    confirmationToken: string,
): Promise<RemediationOutcome & { outcomes?: ProbeOutcome[] }> {
    const { data, error } = await invoke<RemediationOutcome & { outcomes?: ProbeOutcome[] }>({
        action: 'repair', lineId, remediationId, confirmationToken,
    });
    if (error || !data) throw new Error(error ?? 'Réparation sans réponse.');
    return data;
}

/** Rétablit l'état antérieur depuis une sauvegarde. */
export async function restore(
    lineId: string,
    snapshotId: string,
): Promise<RemediationOutcome & { outcomes?: ProbeOutcome[] }> {
    const { data, error } = await invoke<RemediationOutcome & { outcomes?: ProbeOutcome[] }>({
        action: 'restore', lineId, snapshotId,
    });
    if (error || !data) throw new Error(error ?? 'Restauration sans réponse.');
    return data;
}

/** Journal des actions de santé, le plus récent d'abord. */
export async function loadJournal(limit = 50): Promise<HealthJournalEntry[]> {
    const { data, error } = await invoke<{ entries: any[] }>({ action: 'journal', limit });
    if (error || !data) throw new Error(error ?? 'Journal sans réponse.');
    return (data.entries ?? []).map((e): HealthJournalEntry => ({
        id: String(e.id),
        action: String(e.action ?? ''),
        lineId: e.line_id ?? null,
        remediationId: e.metadata?.remediationId ?? null,
        actorId: e.actor_id ?? null,
        actorName: e.actor_name ?? null,
        snapshotId: e.snapshot_id ?? null,
        restorable: e.restorable === true,
        changedCount: e.metadata?.changedCount ?? e.metadata?.restoredCount ?? null,
        statusBefore: e.metadata?.statusBefore ?? null,
        statusAfter: e.metadata?.statusAfter ?? null,
        message: e.metadata?.measuredAfter ?? '',
        createdAt: String(e.created_at),
    }));
}

// ─────────────────────── SAT-6 : SECOURS DU DIRECT ───────────────────────
//
// Même fonction Edge, même séquence que les réparations : DIAGNOSTIQUER →
// CONFIRMER (jeton signé) → APPLIQUER → VÉRIFIER → JOURNALISER. Le rang est
// contrôlé côté serveur à chaque appel ; ce fichier ne décide rien.

/** Les directs ouverts et l'état réel de leur room LiveKit (lecture, administrateurs). */
export async function loadLiveEmergencyOverview(): Promise<LiveEmergencyOverview> {
    const { data, error } = await invoke<LiveEmergencyOverview>({ action: 'live_emergency_overview' });
    if (error || !data) throw new Error(error ?? 'État des directs sans réponse.');
    return data;
}

/** Ce qu'un geste de secours FERAIT sur ce direct, sans rien modifier. */
export async function diagnoseLiveEmergency(action: LiveEmergencyAction, sessionId: string): Promise<LiveEmergencyPlan> {
    const { data, error } = await invoke<LiveEmergencyPlan>({
        action: 'live_emergency_diagnose', emergencyAction: action, sessionId,
    });
    if (error || !data) throw new Error(error ?? 'Diagnostic de secours sans réponse.');
    return data;
}

/** Applique le geste confirmé. Le serveur relit le rang et l'état du direct avant d'agir. */
export async function applyLiveEmergency(
    action: LiveEmergencyAction,
    sessionId: string,
    confirmationToken: string,
): Promise<LiveEmergencyResult> {
    const { data, error } = await invoke<LiveEmergencyResult>({
        action: 'live_emergency_apply', emergencyAction: action, sessionId, confirmationToken,
    });
    if (error || !data) throw new Error(error ?? 'Geste de secours sans réponse.');
    return data;
}

/** Réexporté pour que l'interface n'ait pas à connaître le moteur de score. */
export { buildReport, validateRegistry };
