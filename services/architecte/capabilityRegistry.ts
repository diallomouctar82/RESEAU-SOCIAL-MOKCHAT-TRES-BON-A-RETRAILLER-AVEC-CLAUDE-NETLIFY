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
}

interface SourceCapability {
    id: string;
    actionType: string;
    description: string;
    riskLevel: string;
    requiredRole?: string;
}

const DOMAIN_FALLBACK: Record<CapabilityDomain, string> = {
    live: "en cas d'échec de la reconnaissance vocale ou de l'IA, la barre d'actions tactile du LIVE reste pleinement fonctionnelle — la voix ne fait que déclencher autrement un bouton déjà existant, jamais une action qui n'existerait que par la voix.",
    content: "en cas d'échec de la reconnaissance vocale ou de l'IA, le composeur et ses actions manuelles (publier, corriger, joindre, programmer) restent pleinement fonctionnels.",
    social: "en cas d'échec de la reconnaissance vocale ou de l'IA, les boutons Suivre/Ajouter/Bloquer/Rechercher du fil social restent pleinement fonctionnels.",
    tasks: "aucune UI Tâches n'existe encore pour héberger ce registre (voir LOOP 14-15/17) — capacité déclarée et testée en isolation, mais sans écran à secourir pour l'instant.",
    search: "le mot-clé déterministe (`processVoiceCommand`) reste toujours prioritaire et fonctionne entièrement sans IA — cette capacité vocale n'est qu'un repli, jamais l'inverse.",
    settings: "en cas d'échec de la reconnaissance vocale ou de l'IA, l'écran Paramètres reste pleinement fonctionnel — la voix ne fait que déclencher autrement un réglage déjà éditable à la main, jamais un réglage qui n'existerait que par la voix.",
};

const DOMAIN_HUMAN_LABEL: Record<CapabilityDomain, string> = {
    live: 'les sessions LIVE (micro, invitations, tours de parole, traduction, résumé...)',
    content: 'vos publications (créer, corriger, programmer, partager...)',
    social: 'votre réseau (demandes d\'amis, abonnements, blocage, recherche de personnes...)',
    tasks: 'vos tâches personnelles par la voix (pas encore accessible depuis un écran dédié)',
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

export const PLATFORM_CAPABILITY_REGISTRY: PlatformCapability[] = [
    ...LIVE_VOICE_CAPABILITIES.map((c) => toPlatformCapability('live', c)),
    ...CONTENT_VOICE_CAPABILITIES.map((c) => toPlatformCapability('content', c)),
    ...SOCIAL_VOICE_CAPABILITIES.map((c) => toPlatformCapability('social', c)),
    ...TASK_VOICE_CAPABILITIES.map((c) => toPlatformCapability('tasks', c)),
    ...SETTINGS_VOICE_CAPABILITIES.map((c) => toPlatformCapability('settings', c)),
    SEARCH_CAPABILITY,
];

export function getCapability(id: string): PlatformCapability | undefined {
    return PLATFORM_CAPABILITY_REGISTRY.find((c) => c.id === id);
}

export function isCapabilityRegistered(id: string): boolean {
    return getCapability(id) !== undefined;
}

export function getCapabilitiesByDomain(domain: CapabilityDomain): PlatformCapability[] {
    return PLATFORM_CAPABILITY_REGISTRY.filter((c) => c.domain === domain);
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
 * registre domaine). Câblée dans `DialloOS.tsx` pour répondre à « qu'est-ce
 * que tu peux faire ? » de façon 100% déterministe, sans appel LLM : la
 * réponse ne peut donc jamais contenir une capacité qui n'existe pas
 * réellement dans ce registre.
 */
export function describeCapabilitiesForHumans(): string {
    const domainsPresent = Array.from(new Set(PLATFORM_CAPABILITY_REGISTRY.map((c) => c.domain)));
    const parts = domainsPresent.map((d) => DOMAIN_HUMAN_LABEL[d]).filter(Boolean);
    return `Je peux vous aider avec : ${parts.join(' ; ')}. Dites-moi simplement ce que vous voulez faire.`;
}
