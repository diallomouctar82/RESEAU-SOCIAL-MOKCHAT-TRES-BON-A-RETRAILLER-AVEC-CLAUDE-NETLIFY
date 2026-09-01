import { supabaseService } from '../supabaseClient';
import { normalizeLanguage } from '../translation/translationService';

/**
 * Mémorisation du couple de langues d'UNE conversation.
 *
 * « Ma langue » et « la langue de mon interlocuteur » sont un réglage
 * PERSONNEL : deux personnes d'une même conversation peuvent avoir des couples
 * différents (chacune lit dans sa propre langue). Le réglage est donc stocké
 * par utilisateur, jamais sur la conversation partagée.
 *
 * Support : la table `user_memory` (RLS owner-only, déjà en place) avec
 * `scope='durable_preference'` — ce scope porte déjà, côté base, un index
 * unique partiel sur (user_id, scope, category, key) : réenregistrer le même
 * couple REMPLACE la valeur au lieu d'empiler des lignes concurrentes. C'est
 * exactement la sémantique voulue, sans aucune migration.
 *
 * Le stockage est distant, donc le réglage suit l'utilisateur d'un appareil à
 * l'autre — contrairement à un `localStorage`, qui serait resté sur la machine
 * où le choix a été fait.
 */

/**
 * Catégorie dédiée. `services/memory.ts` l'EXCLUT explicitement de la
 * « Mémoire Active » : un réglage d'affichage n'est pas un fait mémorisé du
 * parcours de l'utilisateur, et n'a rien à faire ni dans ce panneau ni dans le
 * contexte envoyé aux modèles.
 */
export const MESSAGING_LANGUAGE_CATEGORY = 'messaging_language';
const SCOPE = 'durable_preference';

export interface ConversationLanguagePair {
    /** Langue dans laquelle JE lis et j'écris. */
    mine: string;
    /** Langue dans laquelle mon interlocuteur lit et écrit. */
    theirs: string;
}

/** Rejette toute valeur non reconnue plutôt que de la propager au moteur. */
function sanitize(pair: Partial<ConversationLanguagePair> | null | undefined): ConversationLanguagePair | null {
    const mine = normalizeLanguage(pair?.mine);
    const theirs = normalizeLanguage(pair?.theirs);
    if (!mine || !theirs) return null;
    return { mine, theirs };
}

/**
 * Sens de traduction d'un message donné. Extrait ici plutôt que laissé en
 * expression dans le JSX : c'est LA règle métier de cette fonctionnalité
 * (« entrant vers ma langue, sortant vers la sienne »), et une inversion y
 * serait invisible à la relecture. Testée directement.
 */
export function targetLanguageForMessage(pair: ConversationLanguagePair, isMine: boolean): string {
    return isMine ? pair.theirs : pair.mine;
}

export async function loadConversationLanguages(
    userId: string,
    conversationId: string,
): Promise<ConversationLanguagePair | null> {
    if (!userId || !conversationId) return null;
    try {
        const row = await supabaseService.getMemoryByKey(userId, SCOPE, MESSAGING_LANGUAGE_CATEGORY, conversationId);
        if (!row?.value) return null;
        return sanitize(JSON.parse(row.value));
    } catch {
        // Réglage indisponible (hors ligne, valeur illisible) : l'appelant
        // retombe sur ses valeurs par défaut. Jamais bloquant pour la lecture
        // des messages.
        return null;
    }
}

export async function saveConversationLanguages(
    userId: string,
    conversationId: string,
    pair: ConversationLanguagePair,
): Promise<boolean> {
    if (!userId || !conversationId) return false;
    const clean = sanitize(pair);
    if (!clean) return false;
    try {
        await supabaseService.upsertMemory(userId, {
            scope: SCOPE,
            category: MESSAGING_LANGUAGE_CATEGORY,
            key: conversationId,
            value: JSON.stringify(clean),
        });
        return true;
    } catch {
        return false;
    }
}
