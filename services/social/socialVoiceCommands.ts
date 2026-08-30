import { generateJSON } from '../aiGateway';

/**
 * Architecte — navigateur social (LOOP 05/17, mission Architecte MOCnet —
 * moteur social). Même patron que services/content/contentVoiceCommands.ts
 * et services/live/liveVoiceCommands.ts : interprétation en langage
 * naturel via generateJSON, exécution 100% déterministe côté client (voir
 * dispatchSocialVoiceAction dans components/SocialFeed.tsx) — le LLM ne
 * fait jamais l'action ni la résolution finale d'identité, il extrait
 * seulement l'intention et le nom tel qu'énoncé ; la résolution vers un
 * membre réel (et la gestion d'ambiguïté) reste du code déterministe.
 *
 * Portée volontairement limitée aux membres déjà visibles dans le fil
 * (liste transmise en contexte) — pas de recherche globale par la voix
 * dans cette LOOP (réservée à un futur moteur de recherche universelle,
 * LOOP 10-11/17).
 */

export type SocialVoiceActionType =
    | 'SEND_FRIEND_REQUEST'
    | 'ACCEPT_FRIEND_REQUEST'
    | 'DECLINE_FRIEND_REQUEST'
    | 'REMOVE_FRIEND'
    | 'FOLLOW'
    | 'UNFOLLOW'
    | 'BLOCK'
    | 'UNBLOCK'
    | 'SEARCH_PEOPLE'
    | 'DISCOVER_CAPABILITIES'
    | 'ASK_CLARIFICATION'
    | 'UNKNOWN';

export interface SocialVoiceAction {
    type: SocialVoiceActionType;
    payload?: {
        /** Nom tel qu'énoncé par l'utilisateur — jamais un id, la résolution vers un membre réel se fait côté client. */
        memberName?: string;
        query?: string;
        question?: string;
    };
    /** Toujours une phrase courte à dire à voix haute — jamais vide, même pour UNKNOWN. */
    spokenConfirmation: string;
}

export interface SocialVoiceCommandContext {
    /** Noms des membres actuellement visibles à l'écran — sert uniquement à mieux comprendre un nom mal prononcé, jamais une liste exhaustive de la plateforme. */
    visibleMemberNames: string[];
}

export type SocialVoiceRiskLevel = 'low' | 'moderate';

export interface SocialVoiceCapability {
    id: string;
    actionType: SocialVoiceActionType;
    description: string;
    riskLevel: SocialVoiceRiskLevel;
}

/**
 * Registre de capacités du moteur social (même convention que
 * CONTENT_VOICE_CAPABILITIES/LIVE_VOICE_CAPABILITIES : id =
 * domaine.objet.verbe). BLOCK est 'moderate' : action forte et
 * personnelle qui met fin à toute amitié/abonnement — confirmation
 * explicite exigée côté dispatch, jamais exécutée silencieusement même
 * si demandée avec insistance.
 */
export const SOCIAL_VOICE_CAPABILITIES: SocialVoiceCapability[] = [
    { id: 'social.friend.request', actionType: 'SEND_FRIEND_REQUEST', description: "envoyer une demande d'ami à une personne nommée, payload.memberName = le nom tel qu'énoncé", riskLevel: 'low' },
    { id: 'social.friend.accept', actionType: 'ACCEPT_FRIEND_REQUEST', description: "accepter une demande d'ami déjà reçue d'une personne nommée", riskLevel: 'low' },
    { id: 'social.friend.decline', actionType: 'DECLINE_FRIEND_REQUEST', description: "refuser une demande d'ami déjà reçue d'une personne nommée", riskLevel: 'low' },
    { id: 'social.friend.remove', actionType: 'REMOVE_FRIEND', description: 'retirer une personne nommée de ses amis (ne la bloque pas)', riskLevel: 'low' },
    { id: 'social.follow.start', actionType: 'FOLLOW', description: 'suivre (abonnement unilatéral, distinct de l\'amitié) une personne nommée', riskLevel: 'low' },
    { id: 'social.follow.stop', actionType: 'UNFOLLOW', description: 'ne plus suivre une personne nommée', riskLevel: 'low' },
    { id: 'social.block.add', actionType: 'BLOCK', description: 'bloquer une personne nommée — met fin à toute amitié/abonnement, action forte', riskLevel: 'moderate' },
    { id: 'social.block.remove', actionType: 'UNBLOCK', description: 'débloquer une personne nommée précédemment bloquée', riskLevel: 'low' },
    { id: 'social.people.search', actionType: 'SEARCH_PEOPLE', description: 'chercher des membres par nom ou mot-clé, payload.query', riskLevel: 'low' },
];

function buildSystemInstruction(ctx: SocialVoiceCommandContext): string {
    const actionsList = SOCIAL_VOICE_CAPABILITIES.map((c) => `- ${c.actionType} : ${c.description}`).join('\n');
    const namesHint = ctx.visibleMemberNames.length > 0
        ? `Personnes actuellement visibles à l'écran (aide à mieux comprendre un nom mal prononcé — ce n'est PAS forcément la liste complète de la communauté) : ${ctx.visibleMemberNames.join(', ')}.`
        : `Aucun membre visible à l'écran actuellement.`;
    return `Tu es l'assistant social de Le Monde à Vous (MokNet), branché sur le fil social/réseau actuellement ouvert par l'utilisateur.
Ta mission : transformer UNE commande vocale en UNE action JSON strictement parmi la liste ci-dessous. Ne jamais inventer un type d'action hors de cette liste. Tu n'exécutes jamais l'action toi-même — tu extrais seulement l'intention et le nom tel qu'énoncé, la résolution vers une vraie personne se fait ailleurs.

${namesHint}

Actions disponibles :
${actionsList}
- DISCOVER_CAPABILITIES : l'utilisateur demande ce qu'il peut faire ici. payload vide. spokenConfirmation résume en 2-3 phrases maximum, jamais une liste technique d'identifiants.
- ASK_CLARIFICATION : le nom de la personne visée est absent ou trop vague (ex. « ajoute-la en ami » sans avoir dit qui) — payload.question = UNE SEULE question courte.
- UNKNOWN : aucune action ne correspond à la commande.

Règle absolue anti-invention : n'invente jamais un nom de personne qui n'a pas été prononcé ou clairement désigné par l'utilisateur — si le nom est ambigu ou absent, utilise ASK_CLARIFICATION plutôt que de deviner.

Réponds UNIQUEMENT en JSON strict, sans texte autour :
{ "type": "...", "payload": { ... }, "spokenConfirmation": "courte phrase en français à dire à voix haute, une seule phrase" }`;
}

/**
 * Interprète une commande vocale du fil social. Dégradation gracieuse :
 * une IA indisponible ne doit jamais bloquer les actions manuelles
 * (boutons Suivre/Ajouter/Bloquer restent utilisables) — juste ne pas
 * exécuter cette commande vocale précise.
 */
export async function interpretSocialVoiceCommand(promptText: string, context: SocialVoiceCommandContext): Promise<SocialVoiceAction> {
    try {
        const action = await generateJSON<SocialVoiceAction>(promptText, { systemInstruction: buildSystemInstruction(context) });
        if (!action || !action.type) {
            return { type: 'UNKNOWN', spokenConfirmation: "Je n'ai pas compris cette commande, pouvez-vous reformuler ?" };
        }
        return action;
    } catch {
        return { type: 'UNKNOWN', spokenConfirmation: "Désolé, je n'ai pas pu traiter cette commande vocale." };
    }
}
