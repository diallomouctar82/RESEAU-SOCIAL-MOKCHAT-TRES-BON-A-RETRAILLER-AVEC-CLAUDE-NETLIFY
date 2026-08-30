import type { AbandonedSyncTask, SyncTask, SyncTaskAction } from '../../types';
import { checkNetworkStatus } from '../pwaService';

/**
 * Moteur de synchronisation hors-ligne de l'Architecte — « Lazarus ».
 *
 * Reconstruction du `src/services/syncService.ts` du paquet Architecte
 * (AI Studio). L'API publique du paquet est conservée telle quelle —
 * `addToQueue(action, payload)`, `processQueue()`, `getQueueSize()`, écoute de
 * l'événement `online` — parce que l'organisation d'origine est juste et que
 * c'est la seule pièce du paquet qui comble un manque réel : l'Architecte de
 * MokNet échouait honnêtement hors-ligne, mais ne rejouait rien au retour du
 * réseau.
 *
 * Quatre défauts mesurés dans l'implémentation reçue sont corrigés ici. Ils ne
 * sont pas théoriques : chacun a été constaté en lisant le fichier transmis.
 *
 * 1. PERTE DE DONNÉES SILENCIEUSE. `CREATE_POST` était déclaré dans
 *    `SyncTask['action']` mais n'avait aucun `case` dans le `switch` : la tâche
 *    tombait dans `default:`, qui journalisait un avertissement SANS lever.
 *    Une promesse résolue = tâche réussie = retirée de la file. Une publication
 *    faite hors-ligne disparaissait sans laisser de trace ni prévenir personne.
 *    → Corrigé structurellement : les gestionnaires sont fournis en
 *      `Record<SyncTaskAction, …>` COMPLET (voir `registerSyncTaskHandlers`),
 *      donc la compilation échoue si une action reste sans traitement. Et au
 *      cas où un gestionnaire manquerait malgré tout à l'exécution, la tâche
 *      est CONSERVÉE, jamais supprimée.
 *
 * 2. COURSE SUR LA FILE. `processQueue` lisait la file, itérait avec `await`,
 *    puis réécrivait `localStorage` avec les seules tâches échouées de son
 *    instantané de départ — effaçant toute tâche ajoutée pendant la boucle.
 *    → Corrigé : aucune réécriture globale depuis un instantané. Chaque
 *      mutation relit l'état courant et n'agit que sur la tâche concernée,
 *      par identifiant (`removeTask` / `patchTask`).
 *
 * 3. AUCUNE IDEMPOTENCE. `addToQueue` déclenchait `processQueue`, l'événement
 *    `online` aussi : deux passages concurrents pouvaient insérer deux fois la
 *    même chose.
 *    → Corrigé sur deux plans : un verrou `processing` empêche deux passages
 *      simultanés, et l'`id` UUID de la tâche — stable d'une tentative à
 *      l'autre — sert d'ancrage d'idempotence côté serveur
 *      (`messages.client_message_id`, `posts.client_post_id`), le mécanisme
 *      déjà éprouvé dans la messagerie de MokNet.
 *
 * 4. FILE PARTAGÉE ENTRE COMPTES. La clé `architect_sync_queue` était unique
 *    pour tout le navigateur : sur un appareil partagé, le second compte
 *    héritait des tâches en attente du premier — et les enverrait sous SON
 *    identité.
 *    → Corrigé : la clé est scindée par utilisateur (`setSyncQueueUser`), même
 *      convention que `memoryService.setCurrentUserId`.
 *
 * Un cinquième point relève de la discipline générale du dépôt plutôt que d'un
 * bug du paquet : après épuisement des tentatives, la tâche du paquet
 * disparaissait sans que l'utilisateur l'apprenne. Ici elle passe dans une
 * liste d'abandons consultable, et les abonnés en sont notifiés — un échec
 * n'est jamais silencieux.
 */

const STORAGE_PREFIX = 'lmav_architect_sync_queue_v1';
const ABANDONED_PREFIX = 'lmav_architect_sync_abandoned_v1';

/** Au-delà, on cesse de réessayer et on le DIT, plutôt que de boucler indéfiniment. */
export const MAX_SYNC_RETRIES = 5;

/**
 * Contrat d'un gestionnaire de tâche.
 *
 * - Résoudre = l'écriture serveur est confirmée, OU le serveur a signalé un
 *   doublon idempotent (23505 sur l'ancre client) — dans les deux cas le
 *   travail est fait, la tâche sort de la file.
 * - Lever = échec. Par défaut, l'échec est réputé transitoire (réseau) et la
 *   tâche sera rejouée. Lever une `PermanentSyncError` signale au contraire un
 *   refus définitif (payload invalide, permission refusée) : réessayer n'y
 *   changerait rien, la tâche est abandonnée immédiatement sans consommer
 *   cinq tentatives inutiles.
 */
export type SyncTaskHandler = (task: SyncTask) => Promise<void>;

/** Échec définitif : la tâche est abandonnée tout de suite, sans réessai. */
export class PermanentSyncError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'PermanentSyncError';
    }
}

export interface SyncQueueSnapshot {
    pending: SyncTask[];
    abandoned: AbandonedSyncTask[];
}

export interface SyncQueueRunResult {
    /** Tâches réellement confirmées côté serveur pendant ce passage. */
    processed: number;
    /** Tâches encore en attente d'un prochain passage (échec transitoire). */
    retrying: number;
    /** Tâches définitivement abandonnées pendant ce passage. */
    abandoned: number;
    /** Renseigné quand aucun traitement n'a eu lieu — jamais présenté comme un succès. */
    skipped?: 'offline' | 'already_running' | 'empty';
}

// --- Utilisateur courant ----------------------------------------------------

let currentUserId: string | null = null;

/**
 * Attache la file à un utilisateur. À appeler à la connexion et à la
 * déconnexion (avec `null`) — même point de câblage que
 * `memoryService.setCurrentUserId` dans `GlobalContext`.
 */
export function setSyncQueueUser(userId: string | null): void {
    if (currentUserId === userId) return;
    currentUserId = userId;
    emit();
}

export function getSyncQueueUser(): string | null {
    return currentUserId;
}

function queueKey(): string {
    return `${STORAGE_PREFIX}::${currentUserId ?? 'anonymous'}`;
}

function abandonedKey(): string {
    return `${ABANDONED_PREFIX}::${currentUserId ?? 'anonymous'}`;
}

// --- Persistance ------------------------------------------------------------
// Tout accès à `localStorage` est protégé : le navigateur peut lever en mode
// privé, quand le stockage est plein, ou quand le site est chargé dans un
// contexte qui bloque les données de site.

function readList<T>(key: string): T[] {
    if (typeof window === 'undefined') return [];
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
        return [];
    }
}

function writeList<T>(key: string, value: T[]): boolean {
    if (typeof window === 'undefined') return false;
    try {
        window.localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch {
        // Quota dépassé ou stockage indisponible : on ne prétend pas avoir
        // enregistré. L'appelant reçoit `false` et peut le dire.
        return false;
    }
}

export function getQueue(): SyncTask[] {
    return readList<SyncTask>(queueKey());
}

export function getAbandonedTasks(): AbandonedSyncTask[] {
    return readList<AbandonedSyncTask>(abandonedKey());
}

/** API du paquet, conservée telle quelle. */
export function getQueueSize(): number {
    return getQueue().length;
}

// --- Abonnés ----------------------------------------------------------------

type SyncQueueListener = (snapshot: SyncQueueSnapshot) => void;
const listeners = new Set<SyncQueueListener>();

/** S'abonner à l'état de la file. Renvoie la fonction de désabonnement. */
export function subscribeToSyncQueue(listener: SyncQueueListener): () => void {
    listeners.add(listener);
    listener({ pending: getQueue(), abandoned: getAbandonedTasks() });
    return () => {
        listeners.delete(listener);
    };
}

function emit(): void {
    if (listeners.size === 0) return;
    const snapshot: SyncQueueSnapshot = { pending: getQueue(), abandoned: getAbandonedTasks() };
    listeners.forEach((l) => {
        try {
            l(snapshot);
        } catch {
            /* un abonné qui lève ne doit pas empêcher les autres d'être notifiés */
        }
    });
}

// --- Mutations ciblées (correctif du défaut n° 2) ----------------------------
// Chacune relit l'état courant juste avant d'écrire, et n'agit que sur une
// tâche identifiée. Une tâche ajoutée entre-temps survit toujours.

function removeTask(id: string): void {
    writeList(
        queueKey(),
        getQueue().filter((t) => t.id !== id)
    );
}

function patchTask(id: string, patch: Partial<SyncTask>): void {
    writeList(
        queueKey(),
        getQueue().map((t) => (t.id === id ? { ...t, ...patch } : t))
    );
}

function abandonTask(task: SyncTask, reason: AbandonedSyncTask['reason'], error: string): void {
    removeTask(task.id);
    const entry: AbandonedSyncTask = {
        ...task,
        lastError: error,
        abandonedAt: Date.now(),
        reason,
    };
    writeList(abandonedKey(), [...getAbandonedTasks(), entry]);
}

/** Retire une tâche abandonnée de la liste (après l'avoir montrée à l'utilisateur). */
export function clearAbandonedTask(id: string): void {
    writeList(
        abandonedKey(),
        getAbandonedTasks().filter((t) => t.id !== id)
    );
    emit();
}

export function clearAllAbandonedTasks(): void {
    writeList<AbandonedSyncTask>(abandonedKey(), []);
    emit();
}

// --- Gestionnaires ----------------------------------------------------------

let handlers: Record<SyncTaskAction, SyncTaskHandler> | null = null;

/** Verrou : un seul passage de `processQueue` à la fois (correctif du défaut n° 3). */
let processing = false;

/**
 * Enregistre les gestionnaires réels.
 *
 * Le paramètre est un `Record` COMPLET, pas un `Partial` : c'est ce qui fait
 * échouer la compilation si une action de `SyncTaskAction` reste sans
 * traitement — le correctif structurel du bug `CREATE_POST` du paquet.
 */
export function registerSyncTaskHandlers(entries: Record<SyncTaskAction, SyncTaskHandler>): void {
    handlers = entries;
}

export function areSyncHandlersRegistered(): boolean {
    return handlers !== null;
}

// --- API publique (identique à celle du paquet) -----------------------------

/**
 * Met une tâche en file et tente de la traiter tout de suite — comportement du
 * paquet, conservé : c'est ce qui rend la file transparente quand le réseau va
 * bien. Hors-ligne, `processQueue` s'arrête immédiatement et la tâche attend
 * l'événement `online`.
 *
 * Renvoie l'identifiant de la tâche (l'ancre d'idempotence), ou `null` si la
 * mise en file elle-même a échoué (stockage indisponible) — auquel cas
 * l'appelant NE DOIT PAS présenter l'action comme enregistrée.
 */
export function addToQueue(action: SyncTaskAction, payload: Record<string, unknown>): string | null {
    const task: SyncTask = {
        id: generateTaskId(),
        action,
        payload,
        timestamp: Date.now(),
        retryCount: 0,
    };

    const saved = writeList(queueKey(), [...getQueue(), task]);
    if (!saved) return null;

    emit();
    void processQueue();
    return task.id;
}

/**
 * Traite la file. Sûr à appeler en concurrence : le verrou `processing`
 * garantit un seul passage à la fois.
 *
 * Aucune temporisation exponentielle n'est intégrée, délibérément : le
 * traitement est déclenché par événement (mise en file, retour du réseau,
 * appel explicite) et non par une boucle de sondage — il n'y a donc rien à
 * espacer. Une tâche en échec attend simplement le prochain déclencheur.
 */
export async function processQueue(): Promise<SyncQueueRunResult> {
    const empty: SyncQueueRunResult = { processed: 0, retrying: 0, abandoned: 0 };

    if (processing) return { ...empty, skipped: 'already_running' };
    if (!checkNetworkStatus()) return { ...empty, skipped: 'offline' };

    const ids = getQueue().map((t) => t.id);
    if (ids.length === 0) return { ...empty, skipped: 'empty' };

    processing = true;
    const result: SyncQueueRunResult = { processed: 0, retrying: 0, abandoned: 0 };

    try {
        for (const id of ids) {
            // Relecture : la tâche a pu être retirée entre-temps (autre onglet,
            // déconnexion, purge). On ne travaille jamais sur un instantané.
            const task = getQueue().find((t) => t.id === id);
            if (!task) continue;

            // Le réseau peut retomber en cours de passage : on s'arrête là et
            // on garde le reste pour le prochain `online`.
            if (!checkNetworkStatus()) break;

            const handler = handlers?.[task.action];
            if (!handler) {
                // Défaut n° 1 du paquet : ici la tâche est CONSERVÉE. Aucune
                // action déclarée ne peut disparaître faute de traitement.
                patchTask(task.id, {
                    lastError: `Aucun traitement enregistré pour l'action ${task.action}.`,
                });
                result.retrying += 1;
                continue;
            }

            try {
                await handler(task);
                removeTask(task.id);
                result.processed += 1;
            } catch (e: any) {
                const message = e?.message || 'Échec inconnu';

                if (e instanceof PermanentSyncError) {
                    abandonTask(task, 'permanent', message);
                    result.abandoned += 1;
                    continue;
                }

                const nextRetryCount = task.retryCount + 1;
                if (nextRetryCount >= MAX_SYNC_RETRIES) {
                    abandonTask(task, 'max_retries', message);
                    result.abandoned += 1;
                } else {
                    patchTask(task.id, { retryCount: nextRetryCount, lastError: message });
                    result.retrying += 1;
                }
            }
        }
    } finally {
        processing = false;
        emit();
    }

    return result;
}

function generateTaskId(): string {
    // UUID v4 : `messages.client_message_id` est de type `uuid NOT NULL` en
    // base — un identifiant textuel libre y serait rejeté.
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Repli pour les contextes sans `crypto.randomUUID` (navigateurs anciens,
    // certains environnements de test) — format UUID v4 valide.
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

// --- Reprise automatique au retour du réseau (comportement du paquet) -------

let onlineListenerAttached = false;

/**
 * Attache l'écoute de l'événement `online`. Idempotent : appelable plusieurs
 * fois sans empiler les écouteurs. Appelé au démarrage de l'application.
 */
export function startSyncQueueAutoResume(): () => void {
    if (typeof window === 'undefined' || onlineListenerAttached) return () => {};
    const onOnline = () => {
        void processQueue();
    };
    window.addEventListener('online', onOnline);
    onlineListenerAttached = true;
    return () => {
        window.removeEventListener('online', onOnline);
        onlineListenerAttached = false;
    };
}

/** Remise à zéro complète — réservée aux tests. */
export function __resetSyncQueueForTests(): void {
    handlers = null;
    processing = false;
    listeners.clear();
    currentUserId = null;
    onlineListenerAttached = false;
}
