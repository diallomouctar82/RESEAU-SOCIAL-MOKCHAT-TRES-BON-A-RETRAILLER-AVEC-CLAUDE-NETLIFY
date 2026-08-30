import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    __resetSyncQueueForTests,
    addToQueue,
    getAbandonedTasks,
    getQueue,
    getQueueSize,
    MAX_SYNC_RETRIES,
    PermanentSyncError,
    processQueue,
    registerSyncTaskHandlers,
    setSyncQueueUser,
    type SyncTaskHandler,
} from '../services/architecte/syncQueue';
import type { SyncTaskAction } from '../types';
import { setOnline } from './setup';

/**
 * Tests de la file de synchronisation hors-ligne.
 *
 * Le paquet Architecte livrait UN test pour ce moteur :
 *
 *     syncService.addToQueue('SAVE_CONVERSATION', {...});
 *     expect(syncService.getQueueSize()).toBeGreaterThanOrEqual(1);
 *
 * Il ne pouvait pas échouer utilement. `addToQueue` déclenche `processQueue`,
 * donc la file ne reste peuplée QUE si l'écriture échoue : ce test valide le
 * chemin d'échec en prétendant valider la mise en file. Et il ne touche ni à
 * `processQueue`, ni à l'idempotence, ni au cas qui perdait réellement des
 * données.
 *
 * Les tests ci-dessous couvrent précisément ce qui manquait, et chacun est
 * écrit pour pouvoir échouer si le correctif correspondant était retiré.
 */

const OWNER = '11111111-1111-4111-8111-111111111111';

/** Jeu de gestionnaires complet, avec un espion sur chaque action. */
function handlersWith(overrides: Partial<Record<SyncTaskAction, SyncTaskHandler>> = {}) {
    const noop: SyncTaskHandler = async () => {};
    return {
        CREATE_POST: overrides.CREATE_POST ?? noop,
        SEND_MESSAGE: overrides.SEND_MESSAGE ?? noop,
        UPDATE_PROFILE: overrides.UPDATE_PROFILE ?? noop,
        LOG_EVENT: overrides.LOG_EVENT ?? noop,
        SAVE_CONVERSATION: overrides.SAVE_CONVERSATION ?? noop,
    } as Record<SyncTaskAction, SyncTaskHandler>;
}

beforeEach(() => {
    __resetSyncQueueForTests();
    setSyncQueueUser(OWNER);
});

describe('Mise en file', () => {
    it("conserve la tâche hors ligne, au lieu de la traiter aussitôt", () => {
        setOnline(false);
        registerSyncTaskHandlers(handlersWith());

        const id = addToQueue('CREATE_POST', { content: 'hors ligne' });

        expect(id).not.toBeNull();
        expect(getQueueSize()).toBe(1);
        expect(getQueue()[0]).toMatchObject({ action: 'CREATE_POST', retryCount: 0 });
    });

    it("attribue un identifiant UUID stable, utilisable comme ancre d'idempotence serveur", () => {
        setOnline(false);
        registerSyncTaskHandlers(handlersWith());

        const id = addToQueue('SEND_MESSAGE', { conversationId: 'c', senderId: OWNER });

        // `messages.client_message_id` est de type `uuid NOT NULL` en base :
        // un identifiant textuel libre y serait rejeté.
        expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(getQueue()[0].id).toBe(id);
    });

    it('renvoie « hors ligne » sans rien traiter quand le réseau est coupé', async () => {
        setOnline(false);
        const spy = vi.fn(async () => {});
        registerSyncTaskHandlers(handlersWith({ CREATE_POST: spy }));

        addToQueue('CREATE_POST', { content: 'x' });
        const result = await processQueue();

        expect(result.skipped).toBe('offline');
        expect(spy).not.toHaveBeenCalled();
        expect(getQueueSize()).toBe(1);
    });
});

describe('Traitement', () => {
    it('retire la tâche une fois le traitement confirmé', async () => {
        setOnline(false);
        const spy = vi.fn(async () => {});
        registerSyncTaskHandlers(handlersWith({ CREATE_POST: spy }));
        addToQueue('CREATE_POST', { content: 'x' });

        setOnline(true);
        const result = await processQueue();

        expect(spy).toHaveBeenCalledTimes(1);
        expect(result.processed).toBe(1);
        expect(getQueueSize()).toBe(0);
    });

    it(
        "CONSERVE une tâche dont l'action n'a aucun gestionnaire — c'est le bug qui perdait la publication",
        async () => {
            // Reproduction exacte du défaut du paquet : `CREATE_POST` était
            // déclaré dans le type mais n'avait aucun `case`, tombait dans
            // `default:` qui journalisait SANS lever, donc la tâche était
            // réputée réussie et retirée. Ici elle DOIT rester.
            setOnline(false);
            registerSyncTaskHandlers({
                ...handlersWith(),
                CREATE_POST: undefined as unknown as SyncTaskHandler,
            });
            addToQueue('CREATE_POST', { content: 'ne doit pas disparaître' });

            setOnline(true);
            const result = await processQueue();

            expect(result.processed).toBe(0);
            expect(result.retrying).toBe(1);
            expect(getQueueSize()).toBe(1);
            expect(getQueue()[0].lastError).toContain('CREATE_POST');
            expect(getAbandonedTasks()).toHaveLength(0);
        }
    );

    it("n'efface pas une tâche ajoutée PENDANT le traitement", async () => {
        // Le paquet réécrivait localStorage depuis son instantané de départ :
        // toute tâche ajoutée pendant la boucle était effacée.
        setOnline(true);
        let secondId: string | null = null;
        registerSyncTaskHandlers(
            handlersWith({
                CREATE_POST: async () => {
                    secondId = addToQueue('LOG_EVENT', { key: 'ajoutée pendant', value: 'x' });
                },
            })
        );
        addToQueue('CREATE_POST', { content: 'première' });
        await processQueue();

        expect(secondId).not.toBeNull();
        const restante = getQueue();
        expect(restante).toHaveLength(1);
        expect(restante[0].id).toBe(secondId);
        expect(restante[0].action).toBe('LOG_EVENT');
    });

    it('ne traite pas deux fois la même tâche si deux passages sont lancés en parallèle', async () => {
        setOnline(false);
        let resolve!: () => void;
        const gate = new Promise<void>((r) => { resolve = r; });
        const spy = vi.fn(async () => { await gate; });
        registerSyncTaskHandlers(handlersWith({ CREATE_POST: spy }));
        addToQueue('CREATE_POST', { content: 'x' });

        setOnline(true);
        const premier = processQueue();
        const second = await processQueue(); // pendant que le premier est bloqué

        expect(second.skipped).toBe('already_running');
        resolve();
        await premier;
        expect(spy).toHaveBeenCalledTimes(1);
        expect(getQueueSize()).toBe(0);
    });
});

describe('Échecs', () => {
    it('incrémente les tentatives sur un échec transitoire et garde la tâche', async () => {
        setOnline(false);
        registerSyncTaskHandlers(
            handlersWith({ CREATE_POST: async () => { throw new Error('réseau instable'); } })
        );
        addToQueue('CREATE_POST', { content: 'x' });

        setOnline(true);
        const result = await processQueue();

        expect(result.retrying).toBe(1);
        expect(getQueue()[0].retryCount).toBe(1);
        expect(getQueue()[0].lastError).toBe('réseau instable');
        expect(getAbandonedTasks()).toHaveLength(0);
    });

    it("abandonne après MAX_SYNC_RETRIES et le SIGNALE, au lieu de disparaître en silence", async () => {
        setOnline(false);
        registerSyncTaskHandlers(
            handlersWith({ CREATE_POST: async () => { throw new Error('toujours en échec'); } })
        );
        addToQueue('CREATE_POST', { content: 'x' });
        setOnline(true);

        for (let i = 0; i < MAX_SYNC_RETRIES; i++) await processQueue();

        expect(getQueueSize()).toBe(0);
        const abandonnées = getAbandonedTasks();
        expect(abandonnées).toHaveLength(1);
        expect(abandonnées[0].reason).toBe('max_retries');
        expect(abandonnées[0].lastError).toBe('toujours en échec');
    });

    it("abandonne IMMÉDIATEMENT un refus définitif, sans brûler cinq tentatives", async () => {
        setOnline(false);
        registerSyncTaskHandlers(
            handlersWith({
                CREATE_POST: async () => { throw new PermanentSyncError('42501 — refusé par RLS'); },
            })
        );
        addToQueue('CREATE_POST', { content: 'x' });

        setOnline(true);
        const result = await processQueue();

        expect(result.abandoned).toBe(1);
        expect(getQueueSize()).toBe(0);
        expect(getAbandonedTasks()[0].reason).toBe('permanent');
    });
});

describe('Isolation par compte', () => {
    it("ne montre jamais à un second compte les tâches en attente du premier", () => {
        setOnline(false);
        registerSyncTaskHandlers(handlersWith());

        addToQueue('CREATE_POST', { content: 'appartient à Alice' });
        expect(getQueueSize()).toBe(1);

        // Sur un appareil partagé, le paquet utilisait UNE clé pour tout le
        // navigateur : le second compte héritait des tâches du premier et les
        // aurait envoyées sous son identité.
        setSyncQueueUser('22222222-2222-4222-8222-222222222222');
        expect(getQueueSize()).toBe(0);
        expect(getQueue()).toEqual([]);

        setSyncQueueUser(OWNER);
        expect(getQueueSize()).toBe(1);
    });
});
