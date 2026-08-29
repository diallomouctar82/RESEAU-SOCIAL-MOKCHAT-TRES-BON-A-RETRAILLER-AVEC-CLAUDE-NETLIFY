import { generateJSON } from '../aiGateway';
import { LiveVisualUniverse } from '../../types';

/**
 * Voix native branchée sur le LIVE (LOOP 09/14, prompts 2/7 et 4/7) —
 * interprétation d'une commande vocale en une action structurée, même
 * approche que DialloOS.tsx (generateJSON, pas une grammaire figée de
 * regex) : le langage naturel reste naturel, la compréhension vient du
 * LLM, l'exécution reste 100% déterministe côté client (jamais le LLM
 * n'exécute directement une action).
 *
 * Fin de LIVE (END_LIVE) délibérément absente de cette liste : action à
 * fort impact et peu réversible (coupe tout le monde) — prompt 5/7,
 * "évaluer le risque de l'action". Reste un geste explicite (bouton), pas
 * une commande vocale.
 */

export type LiveVoiceActionType =
    | 'TOGGLE_MIC'
    | 'TOGGLE_VIDEO'
    | 'TOGGLE_SCREEN_SHARE'
    | 'RAISE_HAND'
    | 'GIVE_FLOOR'
    | 'OPEN_TAB'
    | 'SEND_CHAT_MESSAGE'
    | 'REQUEST_SUMMARY'
    | 'SET_SUBTITLES_MODE'
    | 'TOGGLE_AUDIO_ONLY'
    | 'CHANGE_VISUAL_UNIVERSE'
    | 'SUMMON_EXPERT'
    | 'CREATE_SOLIDARITY_CAUSE'
    | 'ADD_SOLIDARITY_UPDATE'
    | 'DISCOVER_CAPABILITIES'
    | 'ASK_CLARIFICATION'
    | 'UNKNOWN';

export interface LiveVoiceAction {
    type: LiveVoiceActionType;
    payload?: {
        tabId?: string;
        text?: string;
        participantName?: string;
        mode?: 'off' | 'original' | 'translated' | 'bilingual';
        universe?: LiveVisualUniverse;
        title?: string;
        beneficiaryDescription?: string;
        beneficiaryType?: 'person' | 'community' | 'project' | 'medical' | 'complex';
        targetAmount?: number;
        updateText?: string;
        question?: string;
    };
    /** Toujours une phrase courte à dire à voix haute — jamais vide, même pour UNKNOWN (message d'incompréhension). L'IA doit savoir se taire : pas de bavardage au-delà. */
    spokenConfirmation: string;
}

export interface LiveVoiceCommandContext {
    liveTitle: string;
    isHost: boolean;
    isUserOnStage: boolean;
    raisedHandNames: string[];
    subtitlesMode: 'off' | 'original' | 'translated' | 'bilingual';
}

const SIDE_TABS = ['chat', 'qa', 'notes', 'decisions', 'agenda', 'products', 'polls', 'docs', 'assistant', 'solidarity'];
const UNIVERSES: LiveVisualUniverse[] = ['crystal', 'futuristic_blue', 'natural_fresh', 'violet_luxe', 'deep_ocean'];

/**
 * Registre de capacités du LIVE (LOOP 11/14, complément « Architecte » reçu
 * pendant LOOP 10/14) — auto-descriptif : chaque capacité déclare son
 * identifiant stable (convention domaine.objet.verbe), la description qui
 * alimente le prompt LLM, qui peut l'utiliser et son niveau de risque.
 * `dispatchVoiceAction` (SocialLive.tsx) lit CE registre pour la vérification
 * de permission — une seule source de vérité, jamais un `if (!isHost)`
 * dupliqué par action. Pas un registre plateforme entière (Social/Tribus/
 * Classroom...) — volontairement scopé au LIVE, sans bloquer une extension
 * future (voir le plan, section « Architecte »).
 */
export type LiveVoiceRequiredRole = 'anyone' | 'on_stage' | 'host';
export type LiveVoiceRiskLevel = 'low' | 'moderate' | 'high';

export interface LiveVoiceCapability {
    id: string;
    actionType: LiveVoiceActionType;
    description: string;
    requiredRole: LiveVoiceRequiredRole;
    riskLevel: LiveVoiceRiskLevel;
}

export const LIVE_VOICE_CAPABILITIES: LiveVoiceCapability[] = [
    { id: 'live.microphone.toggle', actionType: 'TOGGLE_MIC', description: 'couper/réactiver son micro', requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.camera.toggle', actionType: 'TOGGLE_VIDEO', description: 'couper/réactiver sa caméra', requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.screen_share.toggle', actionType: 'TOGGLE_SCREEN_SHARE', description: "démarrer/arrêter le partage d'écran", requiredRole: 'on_stage', riskLevel: 'low' },
    { id: 'live.hand.toggle', actionType: 'RAISE_HAND', description: 'lever ou baisser sa main pour demander la parole', requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.participant.give_floor', actionType: 'GIVE_FLOOR', description: "donner la parole à quelqu'un dont la main est levée, payload.participantName", requiredRole: 'host', riskLevel: 'moderate' },
    { id: 'live.sidebar.open_tab', actionType: 'OPEN_TAB', description: `ouvrir un onglet de la barre latérale (${SIDE_TABS.join(', ')}), payload.tabId`, requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.chat.send', actionType: 'SEND_CHAT_MESSAGE', description: "envoyer un message dans le chat, payload.text = le texte exact à envoyer (sans les mots d'introduction comme \"dis dans le chat que\")", requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.summary.request', actionType: 'REQUEST_SUMMARY', description: 'demander un résumé du direct en cours', requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.subtitles.set_mode', actionType: 'SET_SUBTITLES_MODE', description: 'changer le mode sous-titres/traduction, payload.mode', requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.audio_only.toggle', actionType: 'TOGGLE_AUDIO_ONLY', description: 'basculer en mode audio seul (économie de données)', requiredRole: 'anyone', riskLevel: 'low' },
    { id: 'live.visual_universe.change', actionType: 'CHANGE_VISUAL_UNIVERSE', description: "changer l'univers visuel pour tout le monde, payload.universe", requiredRole: 'host', riskLevel: 'moderate' },
    { id: 'live.expert.summon', actionType: 'SUMMON_EXPERT', description: 'appeler un expert IA sur scène', requiredRole: 'host', riskLevel: 'moderate' },
    {
        id: 'live.solidarity.create',
        actionType: 'CREATE_SOLIDARITY_CAUSE',
        description: "lancer une mission de solidarité depuis ce LIVE, payload.title, payload.beneficiaryDescription, payload.beneficiaryType = EXACTEMENT une de ces 5 valeurs, jamais une autre (une famille ou une personne seule = \"person\" ; un groupe/village/quartier = \"community\" ; une infrastructure/un projet = \"project\" ; une prise en charge médicale = \"medical\" ; une mission à étapes multiples = \"complex\") : person|community|project|medical|complex. payload.targetAmount (nombre, optionnel — ne JAMAIS le demander en clarification, il peut être ajouté plus tard)",
        requiredRole: 'host',
        riskLevel: 'moderate',
    },
    {
        id: 'live.solidarity.post_update',
        actionType: 'ADD_SOLIDARITY_UPDATE',
        description: "publier une mise à jour sur la mission solidaire en cours (avancement, étape franchie...), payload.updateText = le texte exact de la mise à jour",
        requiredRole: 'host',
        riskLevel: 'low',
    },
];

/** Le seul appel autorisé pour vérifier une permission de commande vocale — jamais un `if (!isHost)` dispersé ailleurs dans le dispatch. */
export function isVoiceCapabilityAllowed(actionType: LiveVoiceActionType, ctx: { isHost: boolean; isUserOnStage: boolean }): boolean {
    const capability = LIVE_VOICE_CAPABILITIES.find((c) => c.actionType === actionType);
    if (!capability) return true; // ASK_CLARIFICATION / UNKNOWN : pas des capacités MokNet, jamais bloquées ici.
    if (capability.requiredRole === 'host') return ctx.isHost;
    if (capability.requiredRole === 'on_stage') return ctx.isUserOnStage;
    return true;
}

function buildSystemInstruction(ctx: LiveVoiceCommandContext): string {
    const actionsList = LIVE_VOICE_CAPABILITIES.map((c) => `- ${c.actionType} : ${c.description}${c.requiredRole !== 'anyone' ? ` (réservé — ${c.requiredRole === 'host' ? 'hôte' : 'personnes sur scène'})` : ''}`).join('\n');
    return `Tu es le copilote vocal du LIVE "${ctx.liveTitle}" sur Le Monde à Vous (MokNet).
Ta mission : transformer UNE commande vocale en UNE action JSON strictement parmi la liste ci-dessous. Ne jamais inventer un type d'action hors de cette liste.

Contexte de la personne qui parle :
- Rôle : ${ctx.isHost ? "hôte du LIVE (peut donner la parole, changer l'univers visuel, inviter un expert, lancer une mission solidaire)" : 'spectateur (ne peut pas exécuter les actions réservées à l\'hôte)'}
- Sur scène : ${ctx.isUserOnStage ? 'oui' : 'non'}
- Mains levées actuellement, dans l'ordre chronologique de levée (la dernière de la liste est la plus récente) — pour résoudre "elle"/"lui"/"la dernière main levée"/"le dernier" vers cette personne (GIVE_FLOOR, payload.participantName) : ${ctx.raisedHandNames.join(', ') || 'aucune'}
- Univers visuels disponibles (CHANGE_VISUAL_UNIVERSE, payload.universe) : ${UNIVERSES.join(', ')}
- Mode sous-titres actuel (SET_SUBTITLES_MODE, payload.mode: off|original|translated|bilingual) : ${ctx.subtitlesMode}

Actions disponibles :
${actionsList}
- DISCOVER_CAPABILITIES : la personne demande ce qu'elle peut faire ici (« Qu'est-ce que je peux faire ? », « Que peux-tu faire ? », « Aide », « Comment ça marche ? »). payload vide. spokenConfirmation doit résumer en langage naturel (2-3 phrases maximum, jamais une liste technique d'identifiants) les actions RÉELLEMENT disponibles pour CETTE personne parmi celles listées ci-dessus (respecte les mentions "réservé" selon son rôle), regroupées par thème (ex. média, interaction, animation).
- ASK_CLARIFICATION : le titre OU la description du bénéficiaire manque encore pour CREATE_SOLIDARITY_CAUSE — payload.question = UNE SEULE question courte (ne jamais poser plusieurs questions à la fois : demande uniquement l'information réellement manquante)
- UNKNOWN : aucune action ne correspond à la commande

Réponds UNIQUEMENT en JSON strict, sans texte autour :
{ "type": "...", "payload": { ... }, "spokenConfirmation": "courte phrase en français à dire à voix haute, une seule phrase, jamais de bavardage" }`;
}

/**
 * Interprète une commande vocale. `promptText` est normalement le
 * transcript brut ; en cas de clarification en cours (ASK_CLARIFICATION
 * précédent), l'appelant compose un prompt combinant la demande d'origine
 * et la réponse à la question posée (voir SocialLive.tsx).
 */
export async function interpretLiveVoiceCommand(promptText: string, context: LiveVoiceCommandContext): Promise<LiveVoiceAction> {
    try {
        const action = await generateJSON<LiveVoiceAction>(promptText, { systemInstruction: buildSystemInstruction(context) });
        if (!action || !action.type) {
            return { type: 'UNKNOWN', spokenConfirmation: "Je n'ai pas compris cette commande, pouvez-vous reformuler ?" };
        }
        return action;
    } catch {
        // Dégradation gracieuse (prompt 5/7) : une IA indisponible ne doit
        // jamais bloquer le LIVE — juste ne pas exécuter cette commande.
        return { type: 'UNKNOWN', spokenConfirmation: "Désolé, je n'ai pas pu traiter cette commande vocale." };
    }
}
