// Santé globale de MokNet — vocabulaire commun au client, à l'Edge Function
// `health-guardian` et à la base.
//
// Principe directeur, hérité de l'audit du 04/09/2026 : une ligne qui n'a pas
// pu être MESURÉE n'est jamais verte. Elle est BLANCHE, et le tableau de bord
// affiche séparément la santé (sur ce qui a été mesuré) et la couverture (la
// part du périmètre réellement mesurée). Sans cette séparation, une sonde en
// panne ferait monter la note au lieu de la faire baisser — le « faux vert »
// que la Constitution interdit.

/** Statuts officiels Vision Smart. Le jaune, l'orange et le blanc ne sont pas du vert. */
export type HealthStatus =
    | 'vert'    // conforme, démontré au niveau de preuve requis
    | 'jaune'   // conforme mais en attente / dépendance identifiée
    | 'orange'  // partiel, correction nécessaire
    | 'rouge'   // non conforme ou bloqué
    | 'blanc';  // non éprouvé — aucune conclusion possible

/**
 * Niveau de preuve derrière un constat. Ne jamais présenter un niveau
 * inférieur comme un niveau supérieur (Constitution § XIII).
 */
export type ProofLevel =
    | 'banc'         // 🧪 test, simulation, analyse statique du dépôt
    | 'reel'         // 🗄️ base et services représentatifs, données réelles
    | 'production'   // 🚀 version effectivement servie aux utilisateurs
    | 'non_eprouve'; // ⬜ rien n'a pu être mesuré

/** Les grands domaines de MokNet. L'union sert de clé de regroupement partout. */
export type HealthDomainId =
    | 'securite'
    | 'donnees'
    | 'ia'
    | 'messagerie'
    | 'live'
    | 'notifications'
    | 'stockage'
    | 'deploiement'
    | 'dependances'
    | 'gouvernance'
    | 'contenu'
    | 'experience';

export interface HealthDomain {
    id: HealthDomainId;
    /** Intitulé affiché. */
    title: string;
    /** Ce que le domaine protège, en une phrase — sert d'aide contextuelle. */
    purpose: string;
    /** Poids du domaine dans la note globale. La somme vaut 100. */
    weight: number;
}

/**
 * Les BLOCS du tableau de bord — le découpage demandé par la Direction le
 * 05/09/2026 : « ne mélange pas tout dans une seule liste ». Un bloc répond à
 * UNE question qu'un responsable se pose ; les 12 domaines techniques restent
 * l'unité de notation (poids), le bloc est l'unité de lecture.
 */
export type HealthBlockId =
    | 'securite'     // qui peut lire ou écrire quoi, et le modèle de droits tient-il ?
    | 'application'  // ce que le navigateur reçoit et installe réellement
    | 'connecteurs'  // les intégrations configurées (IA, notifications, transport)
    | 'live'         // les directs et les appels
    | 'vps'          // le serveur de direct sur le VPS
    | 'base'         // intégrité, tenue et versionnage des données
    | 'externes';    // les services tiers dont MokNet dépend

export interface HealthBlock {
    id: HealthBlockId;
    title: string;
    /** La question à laquelle le bloc répond — affichée sous son titre. */
    question: string;
}

/**
 * Niveau de risque d'une ligne QUAND elle n'est pas conforme. Écrit avant
 * toute mesure, comme l'attendu : il qualifie le problème, pas l'humeur du
 * jour. Le bloc de couleur (rouge/orange/vert) vient du statut MESURÉ ; le
 * niveau de risque dit ce que ce statut coûte.
 */
export type RiskLevel = 'critique' | 'eleve' | 'moyen' | 'faible';

/**
 * Guide pas à pas d'une action manuelle : l'endroit exact, un lien direct
 * quand il existe, et les étapes dans l'ordre. Présent UNIQUEMENT quand
 * aucune réparation automatique n'est possible — une action manuelle
 * proposée à côté d'un bouton qui réparerait tout seul serait un mensonge
 * par omission.
 *
 * Deux jetons sont résolus par l'interface : `{supabase}` → console du
 * projet Supabase servi, `{repo}` → dépôt GitHub de l'application.
 */
export interface ManualGuide {
    /** Où aller, en clair : « Supabase → Authentication → Attack Protection ». */
    where: string;
    /** Lien direct vers cet endroit, quand il existe. */
    url?: string;
    /** Étapes dans l'ordre, une phrase impérative chacune. */
    steps: string[];
}

/**
 * Où la sonde s'exécute réellement. Déterminant pour la dégradation honnête :
 * une sonde `serveur` sans Edge Function déployée reste BLANCHE, elle ne
 * bascule pas au vert par défaut.
 */
export type ProbeLocation =
    | 'serveur'  // Edge Function health-guardian (service_role)
    | 'client'   // mesurable depuis le navigateur avec la session en cours
    | 'humain';  // constat qui demande une vérification humaine (console, hébergeur)

/**
 * Une réparation possible pour une ligne. Le client n'envoie QUE cet
 * identifiant : jamais de SQL, jamais de table, jamais de condition. Le
 * catalogue réel des opérations vit côté base (fonction
 * `health_apply_remediation`), hors de portée d'un appelant qui voudrait
 * élargir la portée d'une action.
 */
export interface RemediationRef {
    /** Identifiant catalogue, ex. `push.prune_dead_subscriptions`. */
    id: string;
    /** Ce que la réparation fait, en français, à afficher AVANT confirmation. */
    label: string;
    /** Conséquence exacte, affichée dans la modale de confirmation. */
    consequence: string;
    /**
     * `true` quand la restauration est possible : la sauvegarde préalable
     * suffit à revenir à l'état antérieur. Une réparation non réversible
     * n'est pas proposée dans cette version — elle expose `humanAction`.
     */
    reversible: boolean;
}

/** Une ligne du tableau de bord — l'unité de mesure et d'action. */
export interface HealthLine {
    /** Identifiant stable, ex. `securite.forge_credits`. Sert de clé de journal. */
    id: string;
    domain: HealthDomainId;
    title: string;
    /** Ce que la ligne protège concrètement — affiché sous le titre. */
    why: string;
    /** Poids relatif DANS son domaine. */
    weight: number;
    location: ProbeLocation;
    /** Résultat attendu, écrit AVANT toute mesure (Constitution § XIV). */
    expected: string;
    /** Bloc de lecture (voir `HealthBlockId`) — explicite pour chaque ligne. */
    bloc: HealthBlockId;
    /** CAUSE la plus probable quand la ligne n'est pas conforme, écrite a priori. */
    cause: string;
    /** IMPACT métier concret si la ligne reste non conforme. */
    impact: string;
    /** Niveau de risque quand la ligne n'est pas conforme. */
    risk: RiskLevel;
    /** Réparation contrôlée, quand il en existe une sûre et réversible. */
    remediation?: RemediationRef;
    /**
     * Renseigné quand aucune réparation automatique n'est possible : la ligne
     * affiche alors l'action humaine exacte au lieu d'un bouton qui mentirait.
     */
    humanAction?: string;
    /** Guide pas à pas de l'action humaine — obligatoire dès que `humanAction` existe. */
    manual?: ManualGuide;
    /**
     * Action recommandée pour une ligne qui n'a NI réparation automatique NI
     * action humaine décrite (contrôles de garantie : « si rouge, rétablir… »).
     */
    recommendedAction?: string;
}

/** Résultat d'une sonde pour une ligne — le quatuor ATTENDU/OBTENU/ÉCART/VERDICT. */
export interface ProbeOutcome {
    lineId: string;
    status: HealthStatus;
    proofLevel: ProofLevel;
    /** OBTENU : ce qui a réellement été mesuré, en clair. */
    measured: string;
    /** ÉCART : la différence avec l'attendu. Vide quand il n'y en a pas. */
    gap?: string;
    /** Éléments chiffrés bruts, pour le journal et le diagnostic détaillé. */
    evidence?: Record<string, unknown>;
    /** Horodatage de la mesure (ISO). */
    ranAt: string;
    /** Renseigné quand la sonde elle-même a échoué : le statut est alors blanc. */
    probeError?: string;
}

/** Une ligne enrichie de son dernier résultat — ce que l'interface affiche. */
export interface HealthLineState {
    line: HealthLine;
    outcome: ProbeOutcome;
}

/** Note d'un domaine, calculée sur ses seules lignes mesurées. */
export interface DomainScore {
    domain: HealthDomain;
    /** Note sur 100, ou `null` si aucune ligne du domaine n'a pu être mesurée. */
    score: number | null;
    /** Part du poids du domaine réellement mesurée, de 0 à 1. */
    coverage: number;
    /** Statut agrégé : le pire statut mesuré du domaine. */
    status: HealthStatus;
    lines: HealthLineState[];
}

/** Note d'un bloc de lecture, calculée sur ses seules lignes mesurées. */
export interface BlockScore {
    block: HealthBlock;
    /** Note sur 100, ou `null` si aucune ligne du bloc n'a pu être mesurée. */
    score: number | null;
    /** Part du poids réel du bloc effectivement mesurée, de 0 à 1. */
    coverage: number;
    /** Le pire statut mesuré du bloc. */
    status: HealthStatus;
    lines: HealthLineState[];
    tally: Record<HealthStatus, number>;
}

/** Photographie complète de la santé de MokNet à un instant donné. */
export interface HealthReport {
    /**
     * Note globale sur 100, calculée UNIQUEMENT sur les lignes mesurées.
     * `null` quand rien n'a pu être mesuré — jamais 0, qui se lirait comme
     * « tout est cassé » alors que le vrai sens est « on ne sait pas ».
     */
    score: number | null;
    /** Part du périmètre réellement mesurée, de 0 à 1. À afficher À CÔTÉ du score. */
    coverage: number;
    status: HealthStatus;
    domains: DomainScore[];
    /** Les mêmes lignes, regroupées par bloc de lecture (voir `HealthBlockId`). */
    blocks: BlockScore[];
    generatedAt: string;
    /** Compte des lignes par statut, pour l'en-tête du tableau de bord. */
    tally: Record<HealthStatus, number>;
}

// ─────────────────────────── Cycle de réparation ───────────────────────────
//
// Toute action passe par la même séquence, sans raccourci possible :
//
//   DIAGNOSTIQUER → (confirmation humaine) → SAUVEGARDER → APPLIQUER
//                 → VÉRIFIER → JOURNALISER
//
// RESTAURER rejoue la sauvegarde d'une exécution précédente et repasse par
// vérification et journal.

export type HealthAction = 'probe' | 'diagnose' | 'repair' | 'restore' | 'verify' | 'journal';

/**
 * Ce qu'une réparation FERAIT, établi sans rien modifier. C'est le contenu de
 * la modale de confirmation : la personne voit le périmètre exact avant de
 * décider, et le jeton qu'elle renvoie lie sa confirmation à CE plan précis.
 */
export interface DiagnosisPlan {
    lineId: string;
    remediationId: string;
    /** Résumé rédigé côté serveur — l'interface n'a jamais à deviner. */
    summary: string;
    /** Nombre de lignes de base concernées. 0 = rien à faire. */
    affectedCount: number;
    /** Tables touchées, pour que la personne mesure la portée. */
    affectedTables: string[];
    /** Extrait des enregistrements concernés (plafonné), à titre de preuve. */
    sample: Record<string, unknown>[];
    reversible: boolean;
    /**
     * Jeton lié à ce plan, à renvoyer tel quel pour appliquer. Il expire vite
     * et ne vaut que pour ce couple (ligne, réparation) et ce périmètre : une
     * confirmation ne peut pas être rejouée sur un périmètre différent.
     */
    confirmationToken: string;
    expiresAt: string;
}

/** Résultat d'une réparation ou d'une restauration effectivement appliquée. */
export interface RemediationOutcome {
    lineId: string;
    remediationId: string;
    ok: boolean;
    /** Identifiant de la sauvegarde prise AVANT l'action — clé de restauration. */
    snapshotId: string | null;
    /** Nombre de lignes réellement modifiées. */
    changedCount: number;
    /** Contrôle d'après-action : la sonde rejouée, avec son nouveau verdict. */
    verification: ProbeOutcome | null;
    message: string;
    /** Identifiant de l'entrée de journal correspondante. */
    journalId: string | null;
}

/** Une entrée du journal des actions de santé (lue depuis `audit_logs`). */
export interface HealthJournalEntry {
    id: string;
    action: string;
    lineId: string | null;
    remediationId: string | null;
    actorId: string | null;
    actorName?: string | null;
    snapshotId: string | null;
    /** `true` quand la sauvegarde est encore restaurable. */
    restorable: boolean;
    changedCount: number | null;
    statusBefore: HealthStatus | null;
    statusAfter: HealthStatus | null;
    message: string;
    createdAt: string;
}
