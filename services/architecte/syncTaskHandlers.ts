import type { SyncTask, SyncTaskAction } from '../../types';
import { memoryService } from '../memory';
import { supabaseService } from '../supabaseClient';
import { getSyncQueueUser, PermanentSyncError, registerSyncTaskHandlers, type SyncTaskHandler } from './syncQueue';

/**
 * Traitements réels de la file de synchronisation hors-ligne.
 *
 * Séparé de `syncQueue.ts` pour la même raison que `taskCapabilityHandlers.ts`
 * est séparé de `capabilityBus.ts` : la mécanique de file ne doit rien savoir
 * des écritures, et les écritures ne doivent rien savoir de la file. Cela évite
 * aussi un cycle d'import entre la file et `supabaseClient`.
 *
 * Le paquet AI Studio faisait l'inverse — un `switch` inline dans
 * `processQueue` — et c'est précisément ce qui a permis au cas `CREATE_POST`
 * de manquer sans que rien ne le signale. Ici, le `Record<SyncTaskAction, …>`
 * ci-dessous est COMPLET par contrat de type : retirer une entrée fait échouer
 * la compilation.
 */

// --- Classification des échecs ----------------------------------------------

/**
 * Codes Postgres/PostgREST pour lesquels un réessai ne changera jamais rien.
 * Les distinguer évite de brûler cinq tentatives sur un refus définitif, et
 * surtout de laisser croire à l'utilisateur que « ça finira par passer ».
 */
const PERMANENT_PG_CODES = new Set([
    '42501', // insufficient_privilege — refusé par RLS
    '23503', // foreign_key_violation — la cible n'existe plus
    '23514', // check_violation — valeur hors contrainte
    '23502', // not_null_violation — champ obligatoire absent
    '22P02', // invalid_text_representation — UUID malformé, par exemple
    'PGRST116', // aucune ligne renvoyée là où une était attendue
]);

/** Violation d'unicité sur l'ancre d'idempotence : le serveur a déjà la donnée. */
const ALREADY_WRITTEN = '23505';

/**
 * Convertit une erreur d'écriture en décision de file.
 *
 * - `23505` → l'écriture précédente avait abouti : on renvoie sans lever, la
 *   tâche sort de la file. C'est exactement la sémantique déjà retenue dans
 *   `sendChatMessage`.
 * - code définitif → `PermanentSyncError` : abandon immédiat, signalé.
 * - reste → on relaie l'erreur telle quelle : échec transitoire, rejeu.
 */
function classifyWriteError(error: any, context: string): void {
    const code = error?.code;
    if (code === ALREADY_WRITTEN) return; // déjà écrit — succès idempotent
    if (typeof code === 'string' && PERMANENT_PG_CODES.has(code)) {
        throw new PermanentSyncError(`${context} — refus définitif du serveur (${code}) : ${error?.message || 'sans détail'}`);
    }
    throw error instanceof Error ? error : new Error(error?.message || `${context} — échec inconnu`);
}

// --- Lecture de payload -----------------------------------------------------
// Un payload malformé ne se répare pas en réessayant : c'est un échec définitif.

function requireString(payload: Record<string, unknown>, field: string, context: string): string {
    const value = payload[field];
    if (typeof value !== 'string' || value.trim() === '') {
        throw new PermanentSyncError(`${context} — champ « ${field} » manquant ou invalide.`);
    }
    return value;
}

function optionalString(payload: Record<string, unknown>, field: string): string | undefined {
    const value = payload[field];
    return typeof value === 'string' && value !== '' ? value : undefined;
}

// --- Traitements ------------------------------------------------------------

const CREATE_POST: SyncTaskHandler = async (task: SyncTask) => {
    const p = task.payload;
    const authorId = requireString(p, 'authorId', 'Publication');
    const content = requireString(p, 'content', 'Publication');

    assertActingForSelf(authorId, 'Publication');

    try {
        await supabaseService.createPost({
            author_id: authorId,
            content,
            image_url: optionalString(p, 'imageUrl') ?? null,
            video_url: optionalString(p, 'videoUrl') ?? null,
            audio_url: optionalString(p, 'audioUrl') ?? null,
            category: optionalString(p, 'category') ?? null,
            tags: Array.isArray(p.tags) ? p.tags : [],
            visibility: optionalString(p, 'visibility') ?? 'public',
            status: optionalString(p, 'status') ?? 'published',
            format: optionalString(p, 'format') ?? 'text',
            // Ancre d'idempotence (migration `architecte_sync_queue_post_idempotency_anchor`) :
            // un rejeu réutilise le même identifiant de tâche, donc le second
            // insert est rejeté en 23505 et traité comme un succès — jamais
            // une publication en double.
            client_post_id: task.id,
        });
    } catch (e: any) {
        classifyWriteError(e, 'Publication');
    }
};

const SEND_MESSAGE: SyncTaskHandler = async (task: SyncTask) => {
    const p = task.payload;
    const conversationId = requireString(p, 'conversationId', 'Message');
    const senderId = requireString(p, 'senderId', 'Message');

    assertActingForSelf(senderId, 'Message');

    const messageType = optionalString(p, 'messageType');
    try {
        // `sendChatMessage` traite déjà 23505 comme un no-op idempotent et
        // renvoie `null` : rien à faire de plus ici, la tâche sort de la file.
        await supabaseService.sendChatMessage({
            conversationId,
            senderId,
            clientMessageId: task.id,
            content: optionalString(p, 'content'),
            attachmentUrl: optionalString(p, 'attachmentUrl'),
            messageType: (messageType as any) || 'text',
            replyToId: optionalString(p, 'replyToId'),
        });
    } catch (e: any) {
        classifyWriteError(e, 'Message');
    }
};

const UPDATE_PROFILE: SyncTaskHandler = async (task: SyncTask) => {
    const p = task.payload;
    const id = requireString(p, 'id', 'Profil');

    assertActingForSelf(id, 'Profil');

    const { id: _ignored, ...fields } = p;
    if (Object.keys(fields).length === 0) {
        throw new PermanentSyncError('Profil — aucune modification à enregistrer.');
    }

    try {
        // Idempotent par nature : c'est un UPDATE de champs, pas un INSERT.
        // Rejouer la même mise à jour deux fois donne le même état final.
        await supabaseService.upsertProfile({ id, ...(fields as Record<string, unknown>) } as any);
    } catch (e: any) {
        classifyWriteError(e, 'Profil');
    }
};

/**
 * Journal d'activité.
 *
 * Le paquet écrivait dans une table `audit_logs` ouverte à l'écriture client.
 * Cette table existe bien dans MokNet, mais délibérément SANS aucune policy :
 * elle est réservée au `service_role`. Lui ajouter des policies d'écriture
 * client — ce que proposait le `schema.sql` reçu — permettrait à n'importe
 * quel compte authentifié de polluer ou de forger le journal d'audit. C'est
 * écarté.
 *
 * La destination retenue est `user_memory` avec `scope='recent_activity'` :
 * une table réelle, RLS stricte propriétaire-seul, dont ce périmètre est
 * exactement la vocation (« activité ponctuelle ») et qui n'avait jusqu'ici
 * aucun producteur.
 */
const LOG_EVENT: SyncTaskHandler = async (task: SyncTask) => {
    const p = task.payload;
    const key = requireString(p, 'key', 'Journal');
    const value = requireString(p, 'value', 'Journal');

    await memoryService.addOrUpdateMemory({
        category: 'context',
        key,
        value,
        agentId: optionalString(p, 'agentId'),
        verified: false,
        confidence: 1,
    });
};

/**
 * Trace d'une conversation avec l'Architecte.
 *
 * Le paquet visait `chat_history`, table inexistante ici et redondante avec
 * `conversations` / `messages` / `ai_call_log` déjà en service — la créer
 * installerait un système parallèle. La destination retenue est la couche
 * `conversational` de `user_memory`, prévue depuis l'origine pour
 * « l'historique des sessions d'experts et du Conseil ».
 */
const SAVE_CONVERSATION: SyncTaskHandler = async (task: SyncTask) => {
    const p = task.payload;
    const key = requireString(p, 'key', 'Conversation');
    const value = requireString(p, 'value', 'Conversation');

    await memoryService.addOrUpdateMemory({
        category: 'context',
        layer: 'conversational',
        key,
        value,
        agentId: optionalString(p, 'agentId'),
        verified: false,
        confidence: 1,
    });
};

// --- Garde-fou d'identité ---------------------------------------------------

/**
 * La file est scindée par utilisateur, mais son contenu vient de
 * `localStorage` : rien n'empêche techniquement une tâche d'y désigner
 * quelqu'un d'autre. On refuse définitivement plutôt que de laisser la RLS
 * décider — côté serveur, un UPDATE refusé par RLS ne lève pas d'erreur, il
 * renvoie zéro ligne, ce qui passerait pour un succès.
 */
function assertActingForSelf(subjectId: string, context: string): void {
    const owner = getSyncQueueUser();
    if (owner && subjectId !== owner) {
        throw new PermanentSyncError(`${context} — cette tâche vise un autre compte que le vôtre, elle ne sera pas envoyée.`);
    }
}

// --- Enregistrement ---------------------------------------------------------

/**
 * Enregistrement complet, exhaustif par contrat de type.
 *
 * `Record<SyncTaskAction, SyncTaskHandler>` : ajouter une action à l'union
 * sans lui donner de traitement ici casse la compilation. C'est le correctif
 * structurel du défaut du paquet — impossible de reproduire le cas
 * `CREATE_POST` déclaré mais non traité.
 */
const SYNC_TASK_HANDLERS: Record<SyncTaskAction, SyncTaskHandler> = {
    CREATE_POST,
    SEND_MESSAGE,
    UPDATE_PROFILE,
    LOG_EVENT,
    SAVE_CONVERSATION,
};

/** À appeler une fois au démarrage de l'application. */
export function installSyncTaskHandlers(): void {
    registerSyncTaskHandlers(SYNC_TASK_HANDLERS);
}

export { SYNC_TASK_HANDLERS };
