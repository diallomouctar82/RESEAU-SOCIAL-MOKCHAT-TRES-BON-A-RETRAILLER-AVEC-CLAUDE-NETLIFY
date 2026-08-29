import { generateJSON } from '../aiGateway';

/**
 * Création de contenu par la voix (LOOP 03/17, mission Architecte MOCnet —
 * moteur de contenu unifié). Même approche que
 * services/live/liveVoiceCommands.ts (déjà en production pour le LIVE) :
 * interprétation en langage naturel via generateJSON, exécution 100%
 * déterministe côté client (jamais le LLM n'écrit directement en base),
 * jamais de logique dupliquée entre bouton tactile et commande vocale — la
 * voix appelle exactement les mêmes fonctions que les boutons du composeur
 * (voir dispatchContentVoiceAction dans components/SocialFeed.tsx).
 *
 * Portée volontairement limitée au brouillon actuellement ouvert dans le
 * composeur (pas de résolution de référence vers un post déjà publié
 * ailleurs dans le fil — cette capacité relève du futur registre
 * plateforme, LOOP 16/17).
 */

export type ContentVoiceActionType =
    | 'SET_CONTENT'
    | 'REWRITE_STYLE'
    | 'SHORTEN'
    | 'EXPAND'
    | 'TRANSLATE'
    | 'SET_VISIBILITY'
    | 'SET_CATEGORY'
    | 'ADD_TAGS'
    | 'SAVE_DRAFT'
    | 'PUBLISH'
    | 'DISCARD_DRAFT'
    | 'DISCOVER_CAPABILITIES'
    | 'ASK_CLARIFICATION'
    | 'UNKNOWN';

export interface ContentVoiceAction {
    type: ContentVoiceActionType;
    payload?: {
        /** Pour SET_CONTENT/REWRITE_STYLE/SHORTEN/EXPAND/TRANSLATE : le texte complet à mettre dans le composeur (jamais un extrait ni une instruction — le texte prêt à l'emploi). */
        text?: string;
        style?: 'professional' | 'casual' | 'short' | 'simple';
        language?: string;
        visibility?: 'public' | 'private';
        category?: string;
        tags?: string[];
        question?: string;
    };
    /** Toujours une phrase courte à dire à voix haute — jamais vide, même pour UNKNOWN. */
    spokenConfirmation: string;
}

export interface ContentVoiceCommandContext {
    currentContent: string;
    currentVisibility: string;
    currentCategory?: string;
    hasMedia: boolean;
}

export type ContentVoiceRiskLevel = 'low' | 'moderate';

export interface ContentVoiceCapability {
    id: string;
    actionType: ContentVoiceActionType;
    description: string;
    riskLevel: ContentVoiceRiskLevel;
}

/**
 * Registre de capacités du moteur de contenu (auto-descriptif, même
 * convention que LIVE_VOICE_CAPABILITIES : id = domaine.objet.verbe).
 * PUBLISH et DISCARD_DRAFT sont 'moderate' : la publication reste un geste
 * délibéré (le brouillon est visible à l'écran avant qu'il ne soit dit),
 * l'abandon d'un brouillon demande une confirmation explicite côté
 * dispatch (irréversible, pas de corbeille pour un brouillon jamais
 * enregistré).
 */
export const CONTENT_VOICE_CAPABILITIES: ContentVoiceCapability[] = [
    { id: 'content.post.compose', actionType: 'SET_CONTENT', description: "rédiger le texte du brouillon à partir d'un sujet/d'une idée donnée par la voix (ex. \"fais-moi une publication sur...\"), payload.text = le texte complet proposé", riskLevel: 'low' },
    { id: 'content.post.rewrite_style', actionType: 'REWRITE_STYLE', description: "réécrire le brouillon actuel dans un style différent en conservant le sens, payload.style: professional|casual|short|simple, payload.text = le texte réécrit complet", riskLevel: 'low' },
    { id: 'content.post.shorten', actionType: 'SHORTEN', description: 'raccourcir le brouillon actuel en conservant le sens, payload.text = le texte raccourci complet', riskLevel: 'low' },
    { id: 'content.post.expand', actionType: 'EXPAND', description: 'développer/étoffer le brouillon actuel en conservant le sens, payload.text = le texte développé complet', riskLevel: 'low' },
    { id: 'content.post.translate', actionType: 'TRANSLATE', description: 'traduire le brouillon actuel, payload.language = la langue cible, payload.text = le texte traduit complet', riskLevel: 'low' },
    { id: 'content.post.set_visibility', actionType: 'SET_VISIBILITY', description: 'changer la visibilité du brouillon, payload.visibility: public|private', riskLevel: 'low' },
    { id: 'content.post.set_category', actionType: 'SET_CATEGORY', description: 'changer la catégorie de la publication, payload.category', riskLevel: 'low' },
    { id: 'content.post.add_tags', actionType: 'ADD_TAGS', description: 'ajouter des mots-clés/tags au brouillon, payload.tags (tableau de chaînes, sans le symbole #)', riskLevel: 'low' },
    { id: 'content.post.save_draft', actionType: 'SAVE_DRAFT', description: 'enregistrer le brouillon sans le publier — ne le rend visible à personne d\'autre', riskLevel: 'low' },
    { id: 'content.post.publish', actionType: 'PUBLISH', description: 'publier réellement le contenu maintenant, le rendre visible selon la visibilité choisie', riskLevel: 'moderate' },
    { id: 'content.post.discard', actionType: 'DISCARD_DRAFT', description: 'abandonner le brouillon en cours sans le sauvegarder', riskLevel: 'moderate' },
];

function buildSystemInstruction(ctx: ContentVoiceCommandContext): string {
    const actionsList = CONTENT_VOICE_CAPABILITIES.map((c) => `- ${c.actionType} : ${c.description}`).join('\n');
    return `Tu es l'assistant de création de contenu de Le Monde à Vous (MokNet), branché sur le composeur de publication actuellement ouvert par l'utilisateur.
Ta mission : transformer UNE commande vocale en UNE action JSON strictement parmi la liste ci-dessous. Ne jamais inventer un type d'action hors de cette liste.

État actuel du composeur :
- Contenu actuel : "${ctx.currentContent || '(vide)'}"
- Visibilité actuelle : ${ctx.currentVisibility}
- Catégorie actuelle : ${ctx.currentCategory || '(aucune)'}
- Média déjà attaché (image/vidéo/document) : ${ctx.hasMedia ? 'oui' : 'non'}

Actions disponibles :
${actionsList}
- DISCOVER_CAPABILITIES : l'utilisateur demande ce qu'il peut faire ici (« Qu'est-ce que je peux faire ? », « Aide »). payload vide. spokenConfirmation résume en 2-3 phrases maximum, jamais une liste technique d'identifiants.
- ASK_CLARIFICATION : le sujet est trop vague pour SET_CONTENT (ex. « fais-moi une publication » sans aucun sujet donné) — payload.question = UNE SEULE question courte, jamais plusieurs à la fois.
- UNKNOWN : aucune action ne correspond à la commande.

Règle absolue de préservation du sens (REWRITE_STYLE, SHORTEN, EXPAND, TRANSLATE) : reformule uniquement la forme — ne change jamais une affirmation, un chiffre, un engagement ou une information factuelle présente dans le texte d'origine.
Règle absolue anti-invention (SET_CONTENT) : si l'utilisateur donne un sujet vague sans aucun fait vérifiable à transmettre, rédige un texte de présentation neutre du sujet — n'invente jamais un fait, un chiffre, une date ou une citation qui n'a pas été fourni.

Réponds UNIQUEMENT en JSON strict, sans texte autour :
{ "type": "...", "payload": { ... }, "spokenConfirmation": "courte phrase en français à dire à voix haute, une seule phrase" }`;
}

/**
 * Interprète une commande vocale du composeur de contenu. Dégradation
 * gracieuse : une IA indisponible ne doit jamais bloquer la création
 * manuelle (boutons/clavier restent utilisables) — juste ne pas exécuter
 * cette commande vocale précise.
 */
export async function interpretContentVoiceCommand(promptText: string, context: ContentVoiceCommandContext): Promise<ContentVoiceAction> {
    try {
        const action = await generateJSON<ContentVoiceAction>(promptText, { systemInstruction: buildSystemInstruction(context) });
        if (!action || !action.type) {
            return { type: 'UNKNOWN', spokenConfirmation: "Je n'ai pas compris cette commande, pouvez-vous reformuler ?" };
        }
        return action;
    } catch {
        return { type: 'UNKNOWN', spokenConfirmation: "Désolé, je n'ai pas pu traiter cette commande vocale." };
    }
}
