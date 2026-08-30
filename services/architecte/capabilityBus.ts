import {
    assertCapabilityExists,
    getCapability,
    isCapabilityAllowed,
    PLATFORM_CAPABILITY_REGISTRY,
    type CapabilityPermissionContext,
    type PlatformCapability,
} from './capabilityRegistry';

/**
 * Bus d'exécution de l'Architecte.
 *
 * C'est la pièce explicitement différée par la LOOP 16/17 : le registre
 * (`capabilityRegistry.ts`) savait DÉCRIRE 42 capacités, mais une seule
 * (`create_dossier`) était réellement exécutable depuis l'Architecte — les 41
 * autres vivaient à l'intérieur de leurs écrans (`SocialLive.tsx`,
 * `SocialFeed.tsx`) et n'étaient atteignables qu'en étant déjà sur cet écran,
 * micro ouvert. Le commentaire du registre disait qu'un routeur central
 * « nécessiterait de donner à un point d'entrée unique l'accès à l'état/aux
 * actions de chaque écran cible ».
 *
 * Ce fichier résout ce problème par **inversion de dépendance** plutôt que par
 * l'accès direct redouté : l'Architecte ne connaît RIEN de l'intérieur des
 * écrans. Ce sont les écrans (ou, pour un domaine sans écran comme les tâches,
 * un module de service dédié) qui DÉCLARENT « je sais exécuter ces
 * identifiants de capacité, voici comment » au moment de leur montage, et qui
 * se retirent proprement au démontage. L'Architecte ne fait qu'appeler un
 * identifiant.
 *
 * Conséquence directe et voulue : une capacité dont l'écran porteur n'est pas
 * monté est rapportée **`unavailable`** — jamais exécutée à moitié, jamais
 * présentée comme réussie. C'est la même discipline anti-faux-succès que celle
 * appliquée partout ailleurs dans ce dépôt (publication, amitié, blocage,
 * commentaires) : un état affiché doit correspondre à un état réel.
 *
 * Trois garde-fous, dans cet ordre, avant toute exécution :
 *   1. la capacité existe-t-elle dans le registre ? (anti-hallucination)
 *   2. l'appelant a-t-il la permission ? (vérifiée DANS LE CODE, jamais
 *      seulement dans le prompt du modèle)
 *   3. un handler réel est-il enregistré ? (sinon `unavailable`, honnêtement)
 */

/** Statuts d'exécution explicites — jamais un booléen qui écraserait la nuance entre « refusé », « indisponible » et « échoué ». */
export type CapabilityExecutionStatus =
    /** Le handler réel a confirmé le succès. */
    | 'done'
    /** Le handler a été appelé et a échoué (ou a levé). Le message porte la raison réelle. */
    | 'failed'
    /** Permission refusée par le registre (ex. capacité réservée à l'hôte du Live). */
    | 'denied'
    /** Capacité réelle et autorisée, mais aucun handler enregistré : l'écran qui la porte n'est pas ouvert. */
    | 'unavailable'
    /** Identifiant absent du registre plateforme — l'Architecte a tenté de revendiquer une capacité inexistante. */
    | 'unknown';

export interface CapabilityExecutionResult {
    status: CapabilityExecutionStatus;
    /** Message destiné à l'utilisateur, en français, toujours vrai vis-à-vis du statut. */
    message: string;
    capability?: PlatformCapability;
    data?: unknown;
}

/**
 * Contrat d'un handler réel. `ok` doit refléter le résultat RÉEL de l'action
 * (écriture en base confirmée, appel effectif...) — jamais un optimisme
 * anticipé. Lever une exception est également accepté : le bus la convertit en
 * `failed` avec son message.
 */
export type CapabilityHandler = (params: any) => Promise<{ ok: boolean; message: string; data?: unknown }>;

const handlers = new Map<string, CapabilityHandler>();

/**
 * Fournisseur de contexte de permission, par capacité enregistrée.
 *
 * L'écran qui porte une capacité est le SEUL à connaître la vérité sur les
 * rôles au moment T (« suis-je hôte de ce Live ? », « suis-je sur scène ? ») —
 * un point d'entrée générique comme la barre de l'Architecte ne peut pas le
 * savoir. Sans ce mécanisme, la vérification du bus s'exécuterait avec un
 * contexte vide et refuserait systématiquement les capacités liées à un rôle,
 * y compris à l'hôte légitime.
 *
 * C'est un getter (et non une valeur figée) pour rester juste après un
 * changement de rôle en cours de session, sans réenregistrer les handlers.
 */
const contextProviders = new Map<string, () => CapabilityPermissionContext>();

/**
 * Enregistre un lot de handlers et renvoie la fonction de retrait
 * correspondante (à appeler au démontage de l'écran — signature pensée pour
 * être retournée directement depuis un `useEffect`).
 *
 * Chaque identifiant est validé contre le registre AU MOMENT DE
 * L'ENREGISTREMENT : un écran ne peut pas déclarer savoir exécuter une
 * capacité qui n'existe pas. L'erreur est levée tôt, au développement, plutôt
 * que de produire un `unknown` silencieux à l'usage.
 */
export function registerCapabilityHandlers(
    entries: Record<string, CapabilityHandler>,
    /** Contexte de permission fourni par l'écran porteur (voir `contextProviders`). Omis pour un domaine sans notion de rôle. */
    getContext?: () => CapabilityPermissionContext
): () => void {
    const ids = Object.keys(entries);
    for (const id of ids) {
        assertCapabilityExists(id);
        handlers.set(id, entries[id]);
        if (getContext) contextProviders.set(id, getContext);
    }
    return () => {
        for (const id of ids) {
            // Ne retirer que si c'est bien CE handler qui est encore en place :
            // évite qu'un démontage tardif n'efface l'enregistrement d'un écran
            // remonté entre-temps (React peut remonter avant de démonter).
            if (handlers.get(id) === entries[id]) {
                handlers.delete(id);
                contextProviders.delete(id);
            }
        }
    };
}

/** Une capacité est-elle réellement exécutable ici et maintenant (handler présent) ? */
export function isCapabilityExecutable(id: string): boolean {
    return handlers.has(id);
}

/** Identifiants réellement exécutables à cet instant — dépend des écrans montés. */
export function listExecutableCapabilityIds(): string[] {
    return Array.from(handlers.keys());
}

/**
 * Capacités réellement exécutables à cet instant, objets complets du registre.
 * Sert à construire un prompt qui ne propose QUE ce qui est faisable
 * maintenant, plutôt que les 42 théoriques — le modèle ne peut donc pas
 * suggérer une action qui échouerait aussitôt en `unavailable`.
 */
export function listExecutableCapabilities(): PlatformCapability[] {
    return PLATFORM_CAPABILITY_REGISTRY.filter((c) => handlers.has(c.id));
}

/**
 * Exécute réellement une capacité. Ne renvoie `done` que si le handler réel a
 * confirmé le succès.
 *
 * NB : la confirmation proportionnelle au risque
 * (`capability.confirmationRequired`) est délibérément laissée à l'appelant —
 * elle doit être posée à l'utilisateur AVANT d'arriver ici, dans l'interface
 * qui a le contexte pour la formuler. Le bus expose l'information
 * (`getCapability(id).confirmationRequired`) mais n'invente pas de dialogue.
 */
export async function executeCapability(
    id: string,
    params: any = {},
    ctx: CapabilityPermissionContext = {}
): Promise<CapabilityExecutionResult> {
    const capability = getCapability(id);
    if (!capability) {
        return {
            status: 'unknown',
            message: `Cette action ne fait pas partie de ce que je sais faire ("${id}").`,
        };
    }

    // Présence du handler AVANT la permission : sans écran porteur monté, la
    // raison réelle est « l'écran n'est pas ouvert », pas « vous n'avez pas le
    // droit ». Répondre `denied` ici induirait en erreur — un utilisateur qui
    // EST hôte se verrait dire qu'il ne l'est pas, simplement parce qu'aucun
    // direct n'est en cours. L'ordre inverse ne protège rien de plus : sans
    // handler, rien ne peut s'exécuter de toute façon.
    const handler = handlers.get(id);
    if (!handler) {
        return {
            status: 'unavailable',
            capability,
            message: `Cette action existe, mais elle n'est pilotable que depuis l'écran qui la porte, et il n'est pas ouvert.`,
        };
    }

    // Le contexte de l'écran porteur fait autorité sur celui de l'appelant :
    // lui seul sait si l'utilisateur est réellement hôte ou sur scène à cet
    // instant. Un appelant générique (barre de l'Architecte) n'a pas cette
    // information et ne doit pas faire refuser à tort une action légitime —
    // ni, à l'inverse, pouvoir se déclarer hôte pour contourner la règle.
    const effectiveCtx: CapabilityPermissionContext = { ...ctx, ...(contextProviders.get(id)?.() ?? {}) };

    if (!isCapabilityAllowed(id, effectiveCtx)) {
        return {
            status: 'denied',
            capability,
            message: `Cette action demande d'être ${capability.requiredPermission} — je ne peux pas la faire à votre place ici.`,
        };
    }

    try {
        const outcome = await handler(params ?? {});
        return {
            status: outcome.ok === true ? 'done' : 'failed',
            capability,
            message: outcome.message,
            data: outcome.data,
        };
    } catch (e: any) {
        return {
            status: 'failed',
            capability,
            message: e?.message || "L'action a échoué.",
        };
    }
}
