import { generateText } from '../aiGateway';

/**
 * LOOP 07/17 (Architecte MOCnet, mission messagerie — intelligence &
 * permissions). Trois capacités IA de la messagerie, regroupées ici plutôt
 * que dispersées dans `MoocChatFloating.tsx`/`ChatMessageItem.tsx` — même
 * séparation service/UI que `services/content/contentVoiceCommands.ts` et
 * `services/social/socialVoiceCommands.ts`. Même canal unique
 * `services/aiGateway.ts::generateText` que le reste du dépôt (aucun appel
 * IA direct dans les composants) — même discipline anti-hallucination et
 * dégradation gracieuse que `SocialLive.tsx::handleEndLive` (seul précédent
 * réel de résumé IA dans ce dépôt) : jamais bloquant, jamais un texte
 * inventé si l'IA échoue ou si la matière première est vide.
 */

/** Résumé honnête d'une conversation — jamais un fait/engagement/décision qui n'est pas explicitement dans les messages fournis. */
export async function summarizeConversation(
    messages: { senderName: string; text: string }[]
): Promise<string> {
    const usable = messages.filter((m) => m.text && m.text.trim().length > 0);
    if (usable.length === 0) {
        return "Rien à résumer pour l'instant — cette conversation ne contient aucun message texte.";
    }
    const transcript = usable.map((m) => `${m.senderName}: ${m.text}`).join('\n');
    const systemInstruction = `Tu résumes une conversation privée pour la personne qui la relit. Règle absolue anti-invention : ne mentionne jamais un fait, un engagement, un chiffre, une date ou une décision qui n'apparaît pas explicitement dans le texte fourni — en cas de doute, reste vague plutôt que d'inventer. 2 à 4 phrases maximum, en français, ton neutre. Réponds uniquement avec le résumé, sans préambule ni guillemets.`;
    try {
        const summary = await generateText(transcript, { systemInstruction });
        return summary?.trim() || "Résumé indisponible pour le moment — réessayez plus tard.";
    } catch {
        return "Résumé indisponible pour le moment — réessayez plus tard.";
    }
}

/**
 * Assistance de rédaction — corrige la FORME (orthographe/grammaire/clarté/
 * ton) sans jamais changer le FOND : n'ajoute jamais un engagement, un
 * chiffre, une promesse ou une information absente du brouillon original.
 * Ne modifie que le champ de saisie côté client — n'envoie jamais rien
 * elle-même (préparer n'est pas envoyer).
 */
export async function assistRewriteMessage(draftText: string, instruction: string): Promise<string> {
    const trimmed = draftText.trim();
    if (!trimmed) return draftText;
    const systemInstruction = `Tu corriges ou reformules le brouillon d'un message de messagerie privée, selon cette instruction précise : "${instruction}". Règle absolue : ne change jamais le sens, n'ajoute jamais une information, un engagement, un chiffre, une date ou une promesse absente du texte d'origine — corrige uniquement la forme. Réponds uniquement avec le texte corrigé, sans commentaire, sans guillemets.`;
    try {
        const result = await generateText(trimmed, { systemInstruction });
        return result?.trim() || draftText;
    } catch {
        return draftText;
    }
}
