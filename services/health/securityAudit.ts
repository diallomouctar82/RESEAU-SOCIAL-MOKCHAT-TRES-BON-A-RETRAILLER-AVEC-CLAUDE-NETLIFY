// Le rapport de sécurité du 4 septembre 2026, intégré au tableau de bord.
//
// L'audit indépendant (lecture seule, dépôt + base de production, commit
// 97382a9) a noté MokNet 61 sur 100 : huit domaines pondérés, quatorze
// constats, trois vagues de correctifs (P0, P1, P2). Ce fichier en fait la
// RÉFÉRENCE du tableau de bord, et relie chaque constat aux lignes de santé
// qui le mesurent aujourd'hui. Deux chiffres en sortent, toujours côte à côte :
//
//   • la note de RÉFÉRENCE — 61, figée, celle de l'audit ;
//   • la note VIVANTE — recalculée à chaque mesure, sur les mêmes domaines et
//     les mêmes poids, à partir des lignes réellement mesurées.
//
// La note vivante ne « reproduit » pas le 61 : l'audit notait à dire d'expert,
// le tableau note au statut mesuré (vert 100, jaune 70, orange 40, rouge 0),
// et ne compte pas ce qu'il n'a pas mesuré. Les deux se lisent ensemble ; ni
// l'une ni l'autre n'est un vert par défaut.
//
// La progression d'une vague (P0, P1, P2) est la part de ses constats
// RÉSOLUS — c'est-à-dire dont TOUTES les lignes mesurées sont vertes. Un
// constat dont une ligne est blanche n'est pas résolu : il est « non mesuré »,
// et se voit comme tel.

import { HealthLineState, HealthReport, HealthStatus } from './healthTypes';
import { HEALTH_LINE_BY_ID } from './healthRegistry';
import { isMeasured, worstStatus } from './healthScore';

/** Provenance de la référence. Affichée telle quelle : c'est une citation, pas une mesure. */
export const SECURITY_AUDIT_REFERENCE = {
    date: '2026-09-04',
    dateLabel: '4 septembre 2026',
    commit: '97382a9',
    score: 61,
    status: 'orange' as HealthStatus,
    verdict: 'Socle solide, quatre non-conformités bloquantes',
    scope: 'Dépôt + base de production, lecture seule — aucune écriture, aucune exploitation exécutée.',
    /** Ce que l'audit annonçait : la levée de R-01, R-02 et R-03 porterait la note vers 82, celle de R-04 vers 88. */
    projection: { afterP0: 82, afterR04: 88 },
};

export type SecurityDomainId =
    | 'secrets' | 'supply' | 'authz' | 'schema' | 'headers' | 'deps' | 'edge' | 'quality';

export interface SecurityDomainRef {
    id: SecurityDomainId;
    title: string;
    /** Poids dans la note de sécurité, en pour cent. La somme vaut 100 (contrôlée par un test). */
    weight: number;
    /** Note attribuée par l'audit, sur 100. */
    auditScore: number;
    auditStatus: HealthStatus;
    /** Ce que l'audit a constaté, en une phrase. */
    auditNote: string;
    /** Lignes de santé qui MESURENT ce domaine aujourd'hui. */
    lineIds: string[];
}

export const SECURITY_DOMAINS: SecurityDomainRef[] = [
    {
        id: 'secrets',
        title: 'Secrets & gestion des clés',
        weight: 15, auditScore: 95, auditStatus: 'vert',
        auditNote: "Aucune clé en dur, aucun .env dans l'historique ; les fonctions *_internal du coffre ne sont pas exécutables par authenticated.",
        lineIds: ['securite.coffre_cles', 'ia.secrets_presents', 'notifications.vapid_configuree'],
    },
    {
        id: 'supply',
        title: "Chaîne d'approvisionnement front",
        weight: 15, auditScore: 25, auditStatus: 'rouge',
        auditNote: "Le build de production charge et exécute cdn.tailwindcss.com ; l'importmap pointe vers aistudiocdn.com. Ni SRI, ni CSP.",
        lineIds: ['deploiement.scripts_tiers'],
    },
    {
        id: 'authz',
        title: 'Authentification & autorisation',
        weight: 20, auditScore: 60, auditStatus: 'orange',
        auditNote: "RLS partout, politiques scopées auth.uid(), garde anti-élévation de rôle actif — mais deux fonctions ouvrent la forge de crédits.",
        lineIds: [
            'securite.forge_credits', 'securite.portefeuille_credit', 'securite.rls_couverture',
            'securite.garde_role', 'securite.secdef_search_path', 'securite.depense_ia_publique',
            'securite.grants_anon', 'securite.mots_de_passe_fuites', 'gouvernance.rang_admin_general',
            'messagerie.blocages_operationnels',
        ],
    },
    {
        id: 'schema',
        title: 'Gouvernance du schéma',
        weight: 10, auditScore: 30, auditStatus: 'rouge',
        auditNote: "89 tables et ~60 fonctions en production contre 2 migrations versionnées : le modèle de sécurité n'est ni revu, ni reproductible, ni restaurable.",
        lineIds: ['gouvernance.schema_versionne', 'gouvernance.tables_sans_politique', 'gouvernance.journal_actions'],
    },
    {
        id: 'headers',
        title: 'En-têtes & durcissement navigateur',
        weight: 10, auditScore: 55, auditStatus: 'orange',
        auditNote: "Quatre en-têtes posés et justifiés dans netlify.toml, HSTS par Netlify — mais aucune Content-Security-Policy.",
        lineIds: ['deploiement.csp', 'deploiement.entetes_securite', 'deploiement.https_strict'],
    },
    {
        id: 'deps',
        title: 'Dépendances',
        weight: 10, auditScore: 60, auditStatus: 'orange',
        auditNote: "1 vulnérabilité high sans correctif npm (xlsx@0.18.5) ; parc par ailleurs à jour, mais aucun contrôle automatisé dans la CI.",
        lineIds: ['dependances.vulnerabilites'],
    },
    {
        id: 'edge',
        title: 'Fonctions Edge (API serveur)',
        weight: 15, auditScore: 80, auditStatus: 'vert',
        auditNote: "Authentification systématique, gardes admin corrects, appartenance à la conversation vérifiée pour les jetons LiveKit ; push-notify est exemplaire.",
        lineIds: ['securite.cors_fonctions', 'ia.quota_par_utilisateur', 'ia.budget_arme'],
    },
    {
        id: 'quality',
        title: 'Qualité & non-régression',
        weight: 5, auditScore: 90, auditStatus: 'vert',
        auditNote: "Green Gate sans continue-on-error et sans secret ; rejoué : typage 0 erreur, 853/853 tests, build OK.",
        lineIds: ['dependances.green_gate'],
    },
];

export type SecurityLoopId = 'P0' | 'P1' | 'P2';

export interface SecurityLoopRef {
    id: SecurityLoopId;
    title: string;
    horizon: string;
}

export const SECURITY_LOOPS: SecurityLoopRef[] = [
    { id: 'P0', title: "Arrêt de l'hémorragie", horizon: 'Immédiat · même journée' },
    { id: 'P1', title: 'Remise à niveau du périmètre', horizon: 'Sous 1 à 2 semaines' },
    { id: 'P2', title: 'Défense en profondeur', horizon: 'Sous 1 mois' },
];

export interface SecurityFindingRef {
    /** Référence de l'audit : R-01 … J-01c, CI. */
    ref: string;
    loop: SecurityLoopId;
    title: string;
    auditStatus: HealthStatus;
    /** Action recommandée par l'audit, en une phrase. */
    action: string;
    effort: string;
    /** Lignes de santé qui mesurent ce constat aujourd'hui. */
    lineIds: string[];
    /** Précision quand le tableau ne mesure qu'une PARTIE du constat. */
    scope?: string;
}

export const SECURITY_FINDINGS: SecurityFindingRef[] = [
    {
        ref: 'R-01', loop: 'P0', auditStatus: 'rouge',
        title: 'Tout compte connecté peut se créditer sans limite',
        action: "Retirer award_xp_and_credits au rôle authenticated (mesure conservatoire), puis la réécrire avec un barème serveur.",
        effort: '1 requête, puis ½ j',
        lineIds: ['securite.forge_credits'],
    },
    {
        ref: 'R-03', loop: 'P0', auditStatus: 'rouge',
        title: 'Le portefeuille accepte un crédit déclaré par le client',
        action: "Interdire p_type = 'credit' depuis le client dans insert_wallet_transaction : un crédit ne naît que d'un encaissement constaté côté serveur.",
        effort: '½ j',
        lineIds: ['securite.portefeuille_credit'],
    },
    {
        ref: 'R-02', loop: 'P0', auditStatus: 'rouge',
        title: "Un script tiers s'exécute chez chaque visiteur, sans filet",
        action: "Supprimer cdn.tailwindcss.com et l'importmap aistudiocdn.com d'index.html ; passer Tailwind en dépendance de build.",
        effort: '½ à 1 j',
        lineIds: ['deploiement.scripts_tiers'],
    },
    {
        ref: 'R-04', loop: 'P1', auditStatus: 'rouge',
        title: "Le schéma de production n'est pas versionné",
        action: "supabase db pull pour capturer les tables et fonctions dans des migrations versionnées, puis revue de migration obligatoire.",
        effort: '1 à 2 j',
        lineIds: ['gouvernance.schema_versionne'],
    },
    {
        ref: 'O-01', loop: 'P1', auditStatus: 'orange',
        title: 'Aucun quota par utilisateur sur la passerelle IA',
        action: "Plafond par utilisateur et par fenêtre sur ai-gateway et mint-live-token, sur le modèle de push-notify (MAX_SENDS_PER_MINUTE).",
        effort: '1 j',
        lineIds: ['ia.quota_par_utilisateur'],
    },
    {
        ref: 'O-02', loop: 'P1', auditStatus: 'orange',
        title: 'Content-Security-Policy absente',
        action: "CSP en Report-Only dans netlify.toml, observer une semaine, puis appliquer — après R-02.",
        effort: '½ j + observation',
        lineIds: ['deploiement.csp'],
    },
    {
        ref: 'O-03', loop: 'P1', auditStatus: 'orange',
        title: 'Access-Control-Allow-Origin: * sur les fonctions Edge',
        action: "Remplacer * par une liste blanche des domaines MokNet dans chaque fonction.",
        effort: '2 h',
        lineIds: ['securite.cors_fonctions'],
    },
    {
        ref: 'O-04', loop: 'P1', auditStatus: 'orange',
        title: 'xlsx@0.18.5 : pollution de prototype, sans correctif npm',
        action: "Passer xlsx sur le canal officiel SheetJS (≥ 0.20.2) ou isoler l'analyse des classeurs dans un Worker dédié.",
        effort: '½ j',
        lineIds: ['dependances.vulnerabilites'],
    },
    {
        ref: 'O-06', loop: 'P1', auditStatus: 'orange',
        title: 'Protection des mots de passe compromis désactivée',
        action: "Activer la protection des mots de passe compromis dans la console Supabase Auth.",
        effort: '5 min',
        lineIds: ['securite.mots_de_passe_fuites'],
    },
    {
        ref: 'O-05', loop: 'P2', auditStatus: 'orange',
        title: 'Le rôle anon conserve un SELECT sur 78 tables',
        action: "REVOKE SELECT … FROM anon sur les tables sans vocation publique, en conservant le fil public et les profils.",
        effort: '½ j',
        lineIds: ['securite.grants_anon'],
    },
    {
        ref: 'J-01a', loop: 'P2', auditStatus: 'jaune',
        title: 'get_ai_spend() lisible par tout compte connecté',
        action: "Réserver get_ai_spend() aux administrateurs.",
        effort: '15 min',
        lineIds: ['securite.depense_ia_publique'],
    },
    {
        ref: 'J-01b', loop: 'P2', auditStatus: 'jaune',
        title: "Statut de super-administrateur déduit d'une adresse e-mail en dur",
        action: "Le rôle vient de la base, une seule source de vérité : poser le rang en base et supprimer l'adresse en dur du code.",
        effort: '2 h',
        // Volontairement SANS ligne : ce constat vit dans le code de
        // l'application (adminConfigService.ts), qu'aucune sonde de ce tableau
        // ne lit. Le rattacher à « Un Admin Général reconnu par la base »
        // l'aurait fait passer pour résolu dès qu'un compte porte le rang —
        // un compte de test suffirait. Il reste donc « non mesuré », ce qui
        // est la vérité.
        lineIds: [],
        scope: "Non mesurable par ce tableau : c'est le code de l'application qui doit cesser de déduire le rang d'une adresse. La ligne « Un Admin Général reconnu par la base » ne couvre que la moitié base.",
    },
    {
        ref: 'J-01c', loop: 'P2', auditStatus: 'jaune',
        title: 'Téléversements sans validation de type ni de taille',
        action: "Valider type MIME et taille avant téléversement, et poser les mêmes limites sur le bucket Storage.",
        effort: '½ j',
        lineIds: ['stockage.validation_televersement'],
    },
    {
        ref: 'CI', loop: 'P2', auditStatus: 'jaune',
        title: 'npm audit et balayage de secrets absents du Green Gate',
        action: "Ajouter npm audit --audit-level=high et un balayage de secrets au Green Gate ; brancher supabase db lint.",
        effort: '½ j',
        lineIds: ['dependances.vulnerabilites', 'dependances.green_gate'],
    },
];

// ─────────────────────────── Calcul vivant ───────────────────────────

const STATUS_VALUE: Record<Exclude<HealthStatus, 'blanc'>, number> = {
    vert: 100, jaune: 70, orange: 40, rouge: 0,
};

export interface SecurityDomainScore {
    domain: SecurityDomainRef;
    /** Note vivante sur 100, `null` si aucune ligne du domaine n'est mesurée. */
    score: number | null;
    coverage: number;
    status: HealthStatus;
    lines: HealthLineState[];
}

export interface SecurityFindingState {
    finding: SecurityFindingRef;
    /** Le pire statut mesuré de ses lignes ; blanc si aucune n'est mesurée. */
    status: HealthStatus;
    /** Vrai quand TOUTES ses lignes sont mesurées ET vertes. */
    resolved: boolean;
    lines: HealthLineState[];
}

export interface SecurityLoopProgress {
    loop: SecurityLoopRef;
    findings: SecurityFindingState[];
    resolved: number;
    total: number;
    /** Part résolue, de 0 à 100 — entier. */
    percent: number;
}

export interface SecurityReport {
    reference: typeof SECURITY_AUDIT_REFERENCE;
    /** Note vivante sur 100, `null` si rien n'est mesuré. */
    score: number | null;
    coverage: number;
    status: HealthStatus;
    domains: SecurityDomainScore[];
    findings: SecurityFindingState[];
    loops: SecurityLoopProgress[];
}

function statesFor(report: HealthReport): Map<string, { state: HealthLineState; poids: number }> {
    const index = new Map<string, { state: HealthLineState; poids: number }>();
    for (const domain of report.domains) {
        for (const state of domain.lines) {
            index.set(state.line.id, { state, poids: domain.domain.weight * state.line.weight });
        }
    }
    return index;
}

/**
 * Note vivante de sécurité, sur les huit domaines de l'audit et leurs poids.
 * Même règle que la santé : une ligne blanche ne vaut rien, elle réduit la
 * couverture. Un domaine sans aucune mesure sort du calcul.
 */
export function buildSecurityReport(report: HealthReport): SecurityReport {
    const index = statesFor(report);

    const domains: SecurityDomainScore[] = SECURITY_DOMAINS.map((domain) => {
        const entries = domain.lineIds
            .map((id) => index.get(id))
            .filter((e): e is { state: HealthLineState; poids: number } => Boolean(e));
        const total = entries.reduce((sum, e) => sum + e.poids, 0);
        const measured = entries.filter((e) => isMeasured(e.state.outcome.status));
        const measuredWeight = measured.reduce((sum, e) => sum + e.poids, 0);
        const score = measuredWeight === 0
            ? null
            : Math.round(measured.reduce(
                (sum, e) => sum + e.poids * STATUS_VALUE[e.state.outcome.status as Exclude<HealthStatus, 'blanc'>],
                0,
            ) / measuredWeight * 10) / 10;
        return {
            domain,
            score,
            coverage: total === 0 ? 0 : measuredWeight / total,
            status: worstStatus(entries.map((e) => e.state.outcome.status)),
            lines: entries.map((e) => e.state),
        };
    });

    const scored = domains.filter((d) => d.score !== null);
    const scoredWeight = scored.reduce((sum, d) => sum + d.domain.weight, 0);
    const score = scoredWeight === 0
        ? null
        : Math.round(scored.reduce((sum, d) => sum + d.domain.weight * (d.score as number), 0) / scoredWeight * 10) / 10;
    const coverage = domains.reduce((sum, d) => sum + d.domain.weight * d.coverage, 0) / 100;

    const findings: SecurityFindingState[] = SECURITY_FINDINGS.map((finding) => {
        const lines = finding.lineIds
            .map((id) => index.get(id)?.state)
            .filter((s): s is HealthLineState => Boolean(s));
        const statuses = lines.map((l) => l.outcome.status);
        const pire = worstStatus(statuses);
        // Un constat dont une ligne n'a pas été mesurée n'est pas « vert » :
        // il est non mesuré — sauf si une autre de ses lignes est déjà rouge
        // ou orange, auquel cas le défaut constaté prime sur l'inconnu.
        const status: HealthStatus = (pire === 'rouge' || pire === 'orange')
            ? pire
            : statuses.includes('blanc') ? 'blanc' : pire;
        return {
            finding,
            status,
            resolved: lines.length > 0 && statuses.every((s) => s === 'vert'),
            lines,
        };
    });

    const loops: SecurityLoopProgress[] = SECURITY_LOOPS.map((loop) => {
        const own = findings.filter((f) => f.finding.loop === loop.id);
        const resolved = own.filter((f) => f.resolved).length;
        return {
            loop,
            findings: own,
            resolved,
            total: own.length,
            percent: own.length === 0 ? 0 : Math.round((resolved / own.length) * 100),
        };
    });

    return {
        reference: SECURITY_AUDIT_REFERENCE,
        score,
        coverage,
        status: worstStatus(domains.map((d) => d.status)),
        domains,
        findings,
        loops,
    };
}

/**
 * Contrôle d'intégrité de la référence : poids à 100, lignes existantes,
 * constats rattachés à une vague connue. Appelé par les tests.
 */
export function validateSecurityReference(): string[] {
    const problems: string[] = [];
    const total = SECURITY_DOMAINS.reduce((sum, d) => sum + d.weight, 0);
    if (total !== 100) problems.push(`Les poids des domaines de sécurité totalisent ${total} au lieu de 100.`);

    const reference = Math.round(
        SECURITY_DOMAINS.reduce((sum, d) => sum + d.weight * d.auditScore, 0) / 100,
    );
    if (reference !== SECURITY_AUDIT_REFERENCE.score) {
        problems.push(`La moyenne pondérée des notes d'audit vaut ${reference}, pas ${SECURITY_AUDIT_REFERENCE.score}.`);
    }

    for (const domain of SECURITY_DOMAINS) {
        if (domain.lineIds.length === 0) problems.push(`Le domaine de sécurité ${domain.id} n'a aucune ligne.`);
        for (const id of domain.lineIds) {
            if (!HEALTH_LINE_BY_ID.has(id)) problems.push(`Le domaine ${domain.id} cite une ligne inconnue : ${id}`);
        }
    }

    const loops = new Set(SECURITY_LOOPS.map((l) => l.id));
    const refs = new Set<string>();
    for (const finding of SECURITY_FINDINGS) {
        if (refs.has(finding.ref)) problems.push(`Constat en double : ${finding.ref}`);
        refs.add(finding.ref);
        if (!loops.has(finding.loop)) problems.push(`Le constat ${finding.ref} cite une vague inconnue : ${finding.loop}`);
        if (finding.lineIds.length === 0 && !finding.scope) {
            problems.push(`Le constat ${finding.ref} n'est mesuré par aucune ligne et ne dit pas pourquoi.`);
        }
        for (const id of finding.lineIds) {
            if (!HEALTH_LINE_BY_ID.has(id)) problems.push(`Le constat ${finding.ref} cite une ligne inconnue : ${id}`);
        }
    }
    return problems;
}
