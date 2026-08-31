import { LIVE_VOICE_CAPABILITIES } from '../live/liveVoiceCommands';
import { CONTENT_VOICE_CAPABILITIES } from '../content/contentVoiceCommands';
import { SOCIAL_VOICE_CAPABILITIES } from '../social/socialVoiceCommands';
import { TASK_VOICE_CAPABILITIES } from '../tasks/taskVoiceCommands';
import { SETTINGS_VOICE_CAPABILITIES } from '../settings/settingsVoiceCommands';

/**
 * Capability Registry plateforme (LOOP 16/17, mission Architecte MOCnet).
 *
 * Source unique de vérité DÉRIVÉE, pas dupliquée : ce fichier n'invente
 * aucune capacité — il agrège et normalise les 5 registres par domaine déjà
 * réels et testés (`LIVE_VOICE_CAPABILITIES`/`CONTENT_VOICE_CAPABILITIES`/
 * `SOCIAL_VOICE_CAPABILITIES`/`TASK_VOICE_CAPABILITIES`/
 * `SETTINGS_VOICE_CAPABILITIES`), qui restent chacun la source de vérité de
 * LEUR domaine (« UNE CAPACITÉ, UN REGISTRE, PLUSIEURS INTERFACES » — ce
 * fichier est une interface supplémentaire, jamais une seconde copie qui
 * pourrait diverger). `confirmationRequired`/`fallback`/`requiredPermission`
 * sont calculés à partir des champs déjà présents
 * (`riskLevel`/`requiredRole`) plutôt que d'exiger une réécriture des
 * fichiers domaine — un changement de risque dans un registre domaine se
 * répercute donc automatiquement ici, sans double maintenance.
 *
 * `search` n'a jamais eu de tableau structuré
 * (`services/search/searchVoiceCommands.ts` : 3 actions codées en dur dans
 * son system prompt, sans `id`/`riskLevel`) — une seule entrée synthétique
 * est ajoutée ci-dessous, explicitement documentée comme telle plutôt que
 * silencieusement fabriquée à partir d'une source qui n'existe pas.
 *
 * Garde-fou anti-hallucination central : `assertCapabilityExists` doit être
 * appelée par tout futur code de l'Architecte avant de revendiquer ou
 * d'exécuter une capacité — une capacité absente de ce registre ne doit
 * jamais être présentée comme disponible.
 *
 * Portée volontairement limitée à l'agrégation + à la découverte (voir
 * `describeCapabilitiesForHumans`, câblée dans `DialloOS.tsx`) : un
 * routage central qui EXÉCUTERAIT réellement n'importe quelle capacité
 * depuis n'importe quel écran nécessiterait de donner à un point d'entrée
 * unique l'accès à l'état/aux actions de chaque écran cible (composeur,
 * liste de membres visibles, etc.) — un chantier de câblage inter-écrans
 * bien plus large qu'une seule LOOP, explicitement différé. Les 4
 * dispatchers existants (`dispatchVoiceAction`, `dispatchContentVoiceAction`,
 * `dispatchSocialVoiceAction`, et le futur dispatcher Tâches) restent donc
 * les points d'exécution réels, inchangés par ce fichier.
 */

export type CapabilityDomain = 'live' | 'content' | 'social' | 'tasks' | 'search' | 'settings';
export type CapabilityRiskLevel = 'low' | 'moderate' | 'high';

export interface PlatformCapability {
    id: string;
    domain: CapabilityDomain;
    actionType: string;
    description: string;
    riskLevel: CapabilityRiskLevel;
    /** Dérivé de riskLevel (tout ce qui n'est pas 'low') — pas un champ réécrit à la main par domaine. */
    confirmationRequired: boolean;
    /** Libellé lisible ; 'aucune (action personnelle)' pour les domaines sans notion de rôle (seul LIVE en a une aujourd'hui). */
    requiredPermission: string;
    /** Description honnête du repli si la couche vocale/IA est indisponible — jamais un blocage total, conformément à l'architecture de dégradation gracieuse déjà posée pour le LIVE. */
    fallback: string;
    /**
     * Recopié du registre domaine : écran qui enregistre réellement le handler
     * quand ce n'est PAS l'écran du domaine lui-même (cas `live.session.create`,
     * porté par le fil social). Absent = règle par défaut du domaine.
     */
    carriedBy?: string;
}

interface SourceCapability {
    id: string;
    actionType: string;
    description: string;
    riskLevel: string;
    requiredRole?: string;
    carriedBy?: string;
}

const DOMAIN_FALLBACK: Record<CapabilityDomain, string> = {
    live: "en cas d'échec de la reconnaissance vocale ou de l'IA, la barre d'actions tactile du LIVE reste pleinement fonctionnelle — la voix ne fait que déclencher autrement un bouton déjà existant, jamais une action qui n'existerait que par la voix.",
    content: "en cas d'échec de la reconnaissance vocale ou de l'IA, le composeur et ses actions manuelles (publier, corriger, joindre, programmer) restent pleinement fonctionnels.",
    social: "en cas d'échec de la reconnaissance vocale ou de l'IA, les boutons Suivre/Ajouter/Bloquer/Rechercher du fil social restent pleinement fonctionnels.",
    // Libellé mis à jour (G5) : depuis que l'Architecte porte lui-même les
    // handlers Tâches (`taskCapabilityHandlers.ts`, enregistrés par la barre
    // flottante montée partout), ces capacités sont exécutables depuis
    // n'importe quel écran — l'ancien texte « aucune UI Tâches n'existe
    // encore » était périmé.
    tasks: "les capacités Tâches sont portées par l'Architecte lui-même (aucun écran dédié requis) : en cas d'échec de la reconnaissance vocale ou de l'IA, la saisie clavier de la barre de l'Architecte reste pleinement fonctionnelle.",
    search: "le mot-clé déterministe (`processVoiceCommand`) reste toujours prioritaire et fonctionne entièrement sans IA — cette capacité vocale n'est qu'un repli, jamais l'inverse.",
    settings: "en cas d'échec de la reconnaissance vocale ou de l'IA, l'écran Paramètres reste pleinement fonctionnel — la voix ne fait que déclencher autrement un réglage déjà éditable à la main, jamais un réglage qui n'existerait que par la voix.",
};

const DOMAIN_HUMAN_LABEL: Record<CapabilityDomain, string> = {
    live: 'les sessions LIVE (micro, invitations, tours de parole, traduction, résumé...)',
    content: 'vos publications (créer, corriger, programmer, partager...)',
    social: 'votre réseau (demandes d\'amis, abonnements, blocage, recherche de personnes...)',
    // G5 : les 7 capacités tâches (+ le dossier de suivi) sont exécutables
    // partout — plus jamais présentées comme « pas encore accessibles ».
    tasks: 'vos tâches personnelles et dossiers de suivi (créer, terminer, replanifier, supprimer...) — disponibles partout',
    search: 'la recherche dans MokNet (profils, publications, cours)',
    settings: "vos réglages MokNet (langue, confidentialité, notifications, profil) et quelques commandes de l'appareil (vibration, plein écran, partage, écran allumé)",
};

function normalizeRequiredPermission(requiredRole?: string): string {
    if (requiredRole === 'host') return 'hôte du Live';
    if (requiredRole === 'on_stage') return 'participant sur scène';
    return 'aucune (action personnelle)';
}

function toPlatformCapability(domain: CapabilityDomain, source: SourceCapability): PlatformCapability {
    const riskLevel = (source.riskLevel as CapabilityRiskLevel) || 'low';
    return {
        id: source.id,
        domain,
        actionType: source.actionType,
        description: source.description,
        riskLevel,
        confirmationRequired: riskLevel !== 'low',
        requiredPermission: normalizeRequiredPermission(source.requiredRole),
        fallback: DOMAIN_FALLBACK[domain],
        carriedBy: source.carriedBy,
    };
}

const SEARCH_CAPABILITY: PlatformCapability = {
    id: 'search.universal.search',
    domain: 'search',
    actionType: 'SEARCH',
    description: "rechercher un terme dans les profils/publications/cours réels de MokNet. payload attendu : { \"query\": \"le terme énoncé, nettoyé des hésitations\" }",
    riskLevel: 'low',
    confirmationRequired: false,
    requiredPermission: 'aucune (lecture seule)',
    fallback: DOMAIN_FALLBACK.search,
};

/**
 * G7 — dossier de suivi. Entrée synthétique, comme `SEARCH_CAPABILITY` (et
 * documentée comme telle) : le registre domaine Tâches
 * (`services/tasks/taskVoiceCommands.ts`) décrit l'interprète vocal des
 * tâches personnelles et n'est pas modifié ici ; le dossier de suivi est une
 * capacité sœur du même domaine, dont le handler vit dans
 * `taskCapabilityHandlers.ts` (il possède déjà le `userId`) et est enregistré
 * partout par la barre de l'Architecte. C'est la version « bus » du cas
 * historique EXECUTE/target='create_dossier' — le cerveau mappe ce target
 * legacy vers cet identifiant, une seule implémentation d'écriture.
 *
 * Risque 'low', comme `task.item.create` : création personnelle non
 * destructive, même absence de confirmation que le chemin legacy remplacé
 * (aucune friction ajoutée par la migration).
 */
const DOSSIER_CAPABILITY: PlatformCapability = {
    id: 'task.dossier.create',
    domain: 'tasks',
    actionType: 'CREATE_DOSSIER',
    description: "ouvrir un vrai dossier de suivi pour une démarche. payload attendu : { \"titre\": \"Titre court et explicite\", \"categorie\": \"emploi|logement|sante|juridique|education|voyage|administration\", \"description\": \"Objectif en une phrase (optionnel)\" }",
    riskLevel: 'low',
    confirmationRequired: false,
    requiredPermission: 'aucune (action personnelle)',
    fallback: DOMAIN_FALLBACK.tasks,
};

export const PLATFORM_CAPABILITY_REGISTRY: PlatformCapability[] = [
    ...LIVE_VOICE_CAPABILITIES.map((c) => toPlatformCapability('live', c)),
    ...CONTENT_VOICE_CAPABILITIES.map((c) => toPlatformCapability('content', c)),
    ...SOCIAL_VOICE_CAPABILITIES.map((c) => toPlatformCapability('social', c)),
    ...TASK_VOICE_CAPABILITIES.map((c) => toPlatformCapability('tasks', c)),
    ...SETTINGS_VOICE_CAPABILITIES.map((c) => toPlatformCapability('settings', c)),
    SEARCH_CAPABILITY,
    DOSSIER_CAPABILITY,
];

export function getCapability(id: string): PlatformCapability | undefined {
    return PLATFORM_CAPABILITY_REGISTRY.find((c) => c.id === id);
}

export function isCapabilityRegistered(id: string): boolean {
    return getCapability(id) !== undefined;
}

/**
 * Capacités d'un domaine dont le handler est porté par l'écran du domaine
 * lui-même. Unique consommateur : cet écran (`SocialLive.tsx` pour 'live'),
 * qui enregistre un handler pour CHAQUE entrée renvoyée — les capacités
 * portées par un AUTRE écran (`carriedBy`, ex. `live.session.create` portée
 * par le fil social) sont donc exclues : les renvoyer ferait déclarer à
 * l'écran LIVE un handler générique qui « réussirait » sans rien faire, et
 * qui écraserait le vrai handler du fil social — deux faux succès d'un coup.
 */
export function getCapabilitiesByDomain(domain: CapabilityDomain): PlatformCapability[] {
    return PLATFORM_CAPABILITY_REGISTRY.filter((c) => c.domain === domain && !c.carriedBy);
}

/**
 * Garde-fou anti-hallucination central. À appeler avant toute revendication
 * ou tentative d'exécution d'une capacité par un futur code de
 * l'Architecte — lève une erreur explicite plutôt que de laisser passer
 * silencieusement une capacité non enregistrée.
 */
export function assertCapabilityExists(id: string): PlatformCapability {
    const capability = getCapability(id);
    if (!capability) {
        throw new Error(`Capacité inconnue du registre plateforme : "${id}" — l'Architecte ne doit jamais revendiquer une capacité non enregistrée.`);
    }
    return capability;
}

export interface CapabilityPermissionContext {
    isHost?: boolean;
    isUserOnStage?: boolean;
}

/**
 * Vérification de permission généralisée. Seul le domaine `live` porte
 * aujourd'hui une notion de rôle (`isVoiceCapabilityAllowed` dans
 * `liveVoiceCommands.ts` reste la vérification RÉELLEMENT active pour le
 * dispatch LIVE existant, lue depuis la même donnée source — cette
 * fonction est la même logique généralisée pour un futur consommateur
 * plateforme, pas une seconde implémentation concurrente). Une capacité
 * inconnue n'est jamais autorisée (garde-fou anti-hallucination).
 */
export function isCapabilityAllowed(id: string, ctx: CapabilityPermissionContext = {}): boolean {
    const capability = getCapability(id);
    if (!capability) return false;
    if (capability.domain !== 'live') return true;
    if (capability.requiredPermission === 'hôte du Live') return !!ctx.isHost;
    if (capability.requiredPermission === 'participant sur scène') return !!ctx.isUserOnStage;
    return true;
}

/** Listing technique (id/domaine/risque) — pour un prompt LLM ou un écran d'admin/debug, jamais pour une réponse affichée à un utilisateur final. */
export function buildPlatformCapabilitiesSummary(): string {
    return PLATFORM_CAPABILITY_REGISTRY
        .map((c) => `- [${c.domain}] ${c.id} : ${c.description} (risque ${c.riskLevel}${c.confirmationRequired ? ', confirmation requise' : ''})`)
        .join('\n');
}

/**
 * Résumé humain, groupé par domaine — jamais une liste technique
 * d'identifiants (même principe que DISCOVER_CAPABILITIES dans chaque
 * registre domaine). Câblée dans `DialloOS.tsx` et dans le cerveau
 * (`architecteBrain.ts`) pour répondre à « qu'est-ce que tu peux faire ? »
 * de façon 100% déterministe, sans appel LLM : la réponse ne peut donc
 * jamais contenir une capacité qui n'existe pas réellement dans ce registre.
 *
 * DÉCOUVERTE HONNÊTE (G5) : quand l'appelant fournit la liste des
 * identifiants réellement exécutables à cet instant
 * (`listExecutableCapabilityIds()` du bus — passée en paramètre plutôt
 * qu'importée ici, pour ne pas créer de dépendance circulaire
 * registre → bus → registre), la réponse distingue ce qui est faisable
 * ICI ET MAINTENANT de ce qui ne le devient que depuis l'écran concerné.
 * Sans ce paramètre (appelant historique), l'ancien résumé global est
 * conservé tel quel.
 */
export function describeCapabilitiesForHumans(executableCapabilityIds?: readonly string[]): string {
    const domainsPresent = Array.from(new Set(PLATFORM_CAPABILITY_REGISTRY.map((c) => c.domain)));

    if (!executableCapabilityIds) {
        const parts = domainsPresent.map((d) => DOMAIN_HUMAN_LABEL[d]).filter(Boolean);
        return `Je peux vous aider avec : ${parts.join(' ; ')}. Dites-moi simplement ce que vous voulez faire.`;
    }

    const executable = new Set(executableCapabilityIds);
    const executableNow = domainsPresent.filter((d) =>
        PLATFORM_CAPABILITY_REGISTRY.some((c) => c.domain === d && executable.has(c.id))
    );
    const fromTheirScreen = domainsPresent.filter((d) => !executableNow.includes(d));

    const nowParts = executableNow.map((d) => DOMAIN_HUMAN_LABEL[d]).filter(Boolean);
    const laterParts = fromTheirScreen.map((d) => DOMAIN_HUMAN_LABEL[d]).filter(Boolean);

    if (nowParts.length === 0) {
        // Rien d'exécutable ici (aucun écran porteur monté, pas de session) :
        // on le dit — jamais une liste qui laisserait croire à une action
        // immédiate impossible.
        return `Ici, je peux surtout vous guider et naviguer. Depuis l'écran concerné, je peux aussi agir sur : ${laterParts.join(' ; ')}. Dites-moi simplement ce que vous voulez faire.`;
    }

    return `Je peux vous aider avec : ${nowParts.join(' ; ')}${
        laterParts.length > 0 ? ` — et, depuis l'écran concerné : ${laterParts.join(' ; ')}` : ''
    }. Dites-moi simplement ce que vous voulez faire.`;
}
