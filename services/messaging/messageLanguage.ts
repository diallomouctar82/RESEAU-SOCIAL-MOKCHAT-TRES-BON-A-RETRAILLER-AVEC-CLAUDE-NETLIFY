import type { ChatMessage } from '../../types';
import { normalizeLanguage } from '../translation/translationService';

/**
 * Règles de langue de la messagerie.
 *
 * Un seul réglage existe : la langue de l'utilisateur lui-même
 * (`profiles.preferred_language`, liste « Ma langue »). On ne choisit JAMAIS
 * la langue de son interlocuteur — le système la détecte.
 *
 * « Par défaut » (aucune langue choisie, `null`) n'a AUCUN rôle de
 * traduction : on lit et on entend l'original, dans les deux sens. Dès
 * qu'une langue est choisie, elle pilote tout — texte, vocaux, appels.
 *
 * Détection : chaque message envoyé porte la langue déclarée par son auteur
 * au moment de l'envoi (`messages.metadata.original_language`, écrite par
 * `sendChatMessage`). La langue du destinataire est donc celle qu'il a
 * lui-même déclarée dans son dernier message — une donnée réelle, jamais une
 * langue devinée. Tant qu'il n'a rien écrit (ou qu'il est « Par défaut »),
 * on ne sait pas : on n'invente rien, et mes messages restent affichés tels
 * que je les ai écrits.
 */

/** Ma langue effective : un code normalisé, ou `undefined` en « Par défaut ». */
export function myEffectiveLanguage(preferredLanguage?: string | null): string | undefined {
    return normalizeLanguage(preferredLanguage ?? undefined);
}

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
 * - « Par défaut » → jamais de traduction, dans aucun sens ;
 * - message reçu   → ma langue, toujours ;
 * - message envoyé → la langue détectée de mon interlocuteur, pour voir ce
 *   qu'il lit réellement — seulement en conversation directe (dans un groupe,
 *   il n'y a pas UN destinataire) et seulement si elle est connue.
 * `undefined` signifie : afficher tel quel, aucune traduction.
 */
export function targetLanguageForMessage(params: {
    myLanguage?: string | null;
    recipientLanguage?: string;
    isMine: boolean;
    isGroup?: boolean;
}): string | undefined {
    const mine = myEffectiveLanguage(params.myLanguage);
    if (!mine) return undefined;
    if (!params.isMine) return mine;
    if (params.isGroup) return undefined;
    return params.recipientLanguage && params.recipientLanguage !== mine ? params.recipientLanguage : undefined;
}
