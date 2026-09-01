import type { ChatMessage } from '../../types';
import { normalizeLanguage } from '../translation/translationService';

/**
 * Règles de langue de la messagerie.
 *
 * Un seul réglage existe : la langue de l'utilisateur lui-même
 * (`profiles.preferred_language`). On ne choisit JAMAIS la langue de son
 * interlocuteur — le système la détecte.
 *
 * Détection : chaque message envoyé porte la langue déclarée par son auteur
 * au moment de l'envoi (`messages.metadata.original_language`, écrite par
 * `sendChatMessage`). La langue du destinataire est donc celle qu'il a
 * lui-même déclarée dans son dernier message — une donnée réelle, jamais une
 * langue devinée. Tant qu'il n'a rien écrit, on ne sait pas : on n'invente
 * rien, et mes messages restent affichés tels que je les ai écrits.
 */

/** Langue réellement déclarée par l'interlocuteur dans son dernier message. */
export function detectRecipientLanguage(
    messages: ChatMessage[],
    currentUserId: string,
): string | undefined {
    for (let i = messages.length - 1; i >= 0; i--) {
        const message = messages[i];
        if (message.senderId === currentUserId) continue;
        const language = normalizeLanguage(message.originalLanguage);
        if (language) return language;
    }
    return undefined;
}

/**
 * Langue dans laquelle un message donné doit m'être AFFICHÉ.
 * - message reçu   → ma langue, toujours ;
 * - message envoyé → la langue détectée de mon interlocuteur, pour voir ce
 *   qu'il lit réellement — seulement en conversation directe (dans un groupe,
 *   il n'y a pas UN destinataire) et seulement si elle est connue.
 * `undefined` signifie : afficher tel quel, aucune traduction.
 */
export function targetLanguageForMessage(params: {
    myLanguage: string;
    recipientLanguage?: string;
    isMine: boolean;
    isGroup?: boolean;
}): string | undefined {
    const mine = normalizeLanguage(params.myLanguage) || 'fr';
    if (!params.isMine) return mine;
    if (params.isGroup) return undefined;
    return params.recipientLanguage && params.recipientLanguage !== mine ? params.recipientLanguage : undefined;
}
