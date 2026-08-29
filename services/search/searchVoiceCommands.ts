import { generateJSON } from '../aiGateway';

/**
 * Architecte — navigateur de recherche universelle (LOOP 11/17, mission
 * Architecte MOCnet — moteur de recherche universelle : intelligence).
 * Même patron que services/social/socialVoiceCommands.ts,
 * services/content/contentVoiceCommands.ts et
 * services/live/liveVoiceCommands.ts : interprétation en langage naturel
 * via generateJSON, exécution 100% déterministe côté client
 * (dispatchSearchVoiceAction dans UniversalSearchModal.tsx) — le LLM ne
 * touche jamais la base, il extrait seulement un terme de recherche propre
 * (ou demande une clarification) ; la requête réelle reste
 * `supabaseClient.ts::universalSearch` (RLS appliquée normalement).
 *
 * Portée volontairement étroite : cette couche ne fait QUE nettoyer/
 * clarifier une formulation orale avant de la transmettre au champ de
 * recherche existant — elle ne remplace jamais le chemin rapide et
 * déterministe déjà en place pour les intentions de navigation
 * (`processVoiceCommand` dans UniversalSearchModal.tsx, mots-clés →
 * onglet, sans appel IA). Cette couche n'intervient qu'en repli, quand
 * aucun mot-clé de navigation ne correspond.
 */

export type SearchVoiceActionType = 'SEARCH' | 'ASK_CLARIFICATION' | 'UNKNOWN';

export interface SearchVoiceAction {
    type: SearchVoiceActionType;
    payload?: {
        /** Terme de recherche nettoyé (sans "euh", hésitations, formules de politesse) — jamais un id, jamais inventé au-delà de ce que l'utilisateur a dit. */
        query?: string;
        question?: string;
    };
    /** Toujours une phrase courte à dire à voix haute — jamais vide. */
    spokenConfirmation: string;
}

function buildSystemInstruction(): string {
    return `Tu es l'assistant de recherche universelle de Le Monde à Vous (MokNet). L'utilisateur vient de prononcer une phrase dans la barre de recherche universelle (profils, publications, formations) après qu'aucun raccourci de navigation direct n'a été reconnu.

Ta mission : transformer cette phrase en UNE action JSON strictement parmi :
- SEARCH : payload.query = le terme de recherche nettoyé (sans hésitations "euh"/"hum", sans formule de politesse comme "peux-tu chercher" — juste le sujet réel de la recherche, dans les mots de l'utilisateur, jamais reformulé ou enrichi).
- ASK_CLARIFICATION : la phrase ne contient aucun sujet de recherche identifiable (ex. juste "cherche" tout seul, ou un silence transcrit) — payload.question = UNE SEULE question courte.
- UNKNOWN : la phrase ne ressemble à aucune demande de recherche.

Règle absolue anti-invention : ne complète jamais un nom, un lieu ou un sujet qui n'a pas été prononcé. Si la phrase est déjà un terme de recherche clair (ex. "trouve Fatou Diop" → query: "Fatou Diop"), ne l'enrichis pas.

Réponds UNIQUEMENT en JSON strict, sans texte autour :
{ "type": "...", "payload": { ... }, "spokenConfirmation": "courte phrase en français à dire à voix haute, une seule phrase" }`;
}

/**
 * Interprète une commande vocale de recherche universelle. Dégradation
 * gracieuse : une IA indisponible ne bloque jamais la recherche manuelle
 * (le champ de recherche texte reste pleinement utilisable) — juste pas
 * de nettoyage automatique de cette commande vocale précise ; l'appelant
 * peut toujours retomber sur le transcript brut comme terme de recherche.
 */
export async function interpretSearchVoiceCommand(promptText: string): Promise<SearchVoiceAction> {
    try {
        const action = await generateJSON<SearchVoiceAction>(promptText, { systemInstruction: buildSystemInstruction() });
        if (!action || !action.type) {
            return { type: 'UNKNOWN', spokenConfirmation: "Je n'ai pas compris, pouvez-vous reformuler ?" };
        }
        return action;
    } catch {
        return { type: 'UNKNOWN', spokenConfirmation: "Désolé, je n'ai pas pu traiter cette commande vocale." };
    }
}
