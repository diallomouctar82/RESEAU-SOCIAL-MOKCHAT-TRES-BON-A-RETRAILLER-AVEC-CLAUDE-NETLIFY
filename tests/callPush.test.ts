import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Mission VF-1 — pont application ↔ Web Push d'appel (services/calls/callPush.ts).
 *
 * Le client Supabase est remplacé par un double qui enregistre l'appel à
 * `functions.invoke` et renvoie ce que le test décide (succès, aucun
 * abonnement, erreur HTTP, jamais de réponse). Ce qui est vérifié : le corps
 * envoyé suit le contrat de `push-notify` à la lettre, la fonction ne lève
 * JAMAIS, le délai de 6 s est réellement borné, le journal ne contient
 * aucune donnée personnelle ; côté réception, seuls les messages du service
 * worker conformes au contrat sont relayés, l'URL de lancement est lue puis
 * NETTOYÉE, et un appel de plus de 40 s n'est plus frais.
 */

const rig = vi.hoisted(() => ({
    invoke: vi.fn<(name: string, options: { body: unknown; signal?: AbortSignal }) => Promise<{ data: unknown; error: unknown }>>(),
    configured: true,
}));

vi.mock('../services/supabaseClient', () => ({
    get isSupabaseConfigured() { return rig.configured; },
    supabase: { functions: { invoke: rig.invoke } },
    supabaseService: {},
}));

const {
    CALL_PUSH_FRESHNESS_MS,
    PUSH_INVOKE_TIMEOUT_MS,
    isFreshCallPayload,
    listenPushCallEvents,
    notifyCallPush,
    parsePushPayload,
    readPushLaunchParams,
} = await import('../services/calls/callPush');

const target = '33333333-3333-4333-8333-333333333333';
const conversation = '22222222-2222-4222-8222-222222222222';

beforeEach(() => {
    rig.invoke.mockReset();
    rig.configured = true;
    // Le résumé console.info est vérifié dans un test dédié ; ailleurs il ne fait que du bruit.
    vi.spyOn(console, 'info').mockImplementation(() => {});
});

describe('notifyCallPush (VF-1 — contrat push-notify, jamais une exception)', () => {
    it('envoie exactement le corps du contrat et renvoie ok quand au moins un appareil a reçu', async () => {
        rig.invoke.mockResolvedValue({ data: { total: 2, sent: 1, failed: 1, results: [] }, error: null });
        const result = await notifyCallPush({ topic: 'incoming_call', targetUserId: target, conversationId: conversation, callId: 'call-1', payload: { callType: 'audio' } });
        expect(result).toEqual({ ok: true, total: 2, sent: 1 });
        expect(rig.invoke).toHaveBeenCalledTimes(1);
        const [name, options] = rig.invoke.mock.calls[0];
        expect(name).toBe('push-notify');
        expect(options.body).toEqual({
            action: 'notify',
            topic: 'incoming_call',
            targetUserId: target,
            conversationId: conversation,
            callId: 'call-1',
            payload: { callType: 'audio' },
        });
        expect(options.signal).toBeInstanceOf(AbortSignal);
    });

    it('vers soi-même (autres appareils) : pas de conversationId, motif transmis', async () => {
        rig.invoke.mockResolvedValue({ data: { total: 1, sent: 1, failed: 0, results: [] }, error: null });
        await notifyCallPush({ topic: 'call_cancelled', targetUserId: target, callId: 'call-1', payload: { reason: 'answered' } });
        expect(rig.invoke.mock.calls[0][1].body).toMatchObject({ topic: 'call_cancelled', targetUserId: target, conversationId: undefined, payload: { reason: 'answered' } });
    });

    it('aucun appareil abonné → ok:false, reason no_subscription (l’appel continue sans push)', async () => {
        rig.invoke.mockResolvedValue({ data: { total: 0, sent: 0, failed: 0, results: [], reason: 'no_subscription' }, error: null });
        expect(await notifyCallPush({ topic: 'incoming_call', targetUserId: target, conversationId: conversation, callId: 'c' })).toEqual({ ok: false, total: 0, sent: 0, reason: 'no_subscription' });
    });

    it('tous les envois en échec → ok:false, reason all_failed', async () => {
        rig.invoke.mockResolvedValue({ data: { total: 1, sent: 0, failed: 1, results: [{ ok: false, status: 500 }] }, error: null });
        expect(await notifyCallPush({ topic: 'incoming_call', targetUserId: target, conversationId: conversation })).toEqual({ ok: false, total: 1, sent: 0, reason: 'all_failed' });
    });

    it('erreur HTTP (403, 429…) → ok:false avec le message serveur, sans lever', async () => {
        const error = Object.assign(new Error('Edge Function returned a non-2xx status code'), {
            context: { json: async () => ({ error: "Envoi réservé aux membres d'une conversation partagée." }) },
        });
        rig.invoke.mockResolvedValue({ data: null, error });
        expect(await notifyCallPush({ topic: 'incoming_call', targetUserId: target, conversationId: conversation })).toEqual({
            ok: false, reason: 'http_error', error: "Envoi réservé aux membres d'une conversation partagée.",
        });
    });

    it('invoke qui rejette (réseau) → ok:false, jamais une exception', async () => {
        rig.invoke.mockRejectedValue(new Error('Failed to fetch'));
        expect(await notifyCallPush({ topic: 'missed_call', targetUserId: target, conversationId: conversation })).toEqual({ ok: false, reason: 'http_error', error: 'Failed to fetch' });
    });

    it('réponse d’une forme inattendue → ok:false, invalid_response', async () => {
        rig.invoke.mockResolvedValue({ data: 'oui', error: null });
        expect(await notifyCallPush({ topic: 'message', targetUserId: target, conversationId: conversation })).toEqual({ ok: false, reason: 'invalid_response' });
    });

    it('Supabase non configuré → not_configured, sans aucun appel réseau', async () => {
        rig.configured = false;
        expect(await notifyCallPush({ topic: 'incoming_call', targetUserId: target, conversationId: conversation })).toEqual({ ok: false, reason: 'not_configured' });
        expect(rig.invoke).not.toHaveBeenCalled();
    });

    describe('délai borné à 6 s', () => {
        beforeEach(() => { vi.useFakeTimers(); });
        afterEach(() => { vi.useRealTimers(); });

        it('sans réponse de l’Edge Function → timeout à 6 s, requête annulée', async () => {
            let aborted = false;
            rig.invoke.mockImplementation((_name, options) => new Promise(() => {
                options.signal?.addEventListener('abort', () => { aborted = true; });
            }));
            const pending = notifyCallPush({ topic: 'incoming_call', targetUserId: target, conversationId: conversation, callId: 'call-t' });
            await vi.advanceTimersByTimeAsync(PUSH_INVOKE_TIMEOUT_MS - 1);
            expect(aborted).toBe(false);
            await vi.advanceTimersByTimeAsync(1);
            expect(await pending).toEqual({ ok: false, reason: 'timeout' });
            expect(aborted).toBe(true);
        });
    });

    it('journalise un résumé SANS donnée personnelle (ni identifiant, ni nom)', async () => {
        const info = vi.spyOn(console, 'info').mockImplementation(() => {});
        rig.invoke.mockResolvedValue({ data: { total: 1, sent: 1, failed: 0, results: [] }, error: null });
        await notifyCallPush({ topic: 'incoming_call', targetUserId: target, conversationId: conversation, callId: 'call-9', payload: { callType: 'video' } });
        expect(info).toHaveBeenCalledWith('[appel] push', { topic: 'incoming_call', ok: true, total: 1, sent: 1, reason: null });
        const logged = JSON.stringify(info.mock.calls);
        expect(logged).not.toContain(target);
        expect(logged).not.toContain(conversation);
        expect(logged).not.toContain('call-9');
    });
});

describe('isFreshCallPayload (VF-1 — un appel poussé n’a de sens que 40 s)', () => {
    it('≤ 40 s → frais ; au-delà → périmé', () => {
        const now = 1_700_000_100_000;
        expect(isFreshCallPayload({ ts: now - 5_000 }, now)).toBe(true);
        expect(isFreshCallPayload({ ts: now - CALL_PUSH_FRESHNESS_MS }, now)).toBe(true);
        expect(isFreshCallPayload({ ts: now - CALL_PUSH_FRESHNESS_MS - 1 }, now)).toBe(false);
    });

    it('horloge légèrement en avance (ts futur) → frais ; horodatage absent/invalide → périmé', () => {
        const now = 1_700_000_100_000;
        expect(isFreshCallPayload({ ts: now + 3_000 }, now)).toBe(true);
        expect(isFreshCallPayload({ ts: Number.NaN }, now)).toBe(false);
        expect(isFreshCallPayload(null, now)).toBe(false);
        expect(isFreshCallPayload(undefined, now)).toBe(false);
    });
});

describe('parsePushPayload (VF-1 — jamais pris sur parole)', () => {
    it('charge conforme au contrat → normalisée', () => {
        expect(parsePushPayload({
            v: 1, type: 'incoming_call', ts: 12345, callId: 'call-1', conversationId: conversation,
            from: { id: target, name: 'Ivan', avatarUrl: '/ivan.png' }, callType: 'video',
        })).toEqual({
            v: 1, type: 'incoming_call', ts: 12345, callId: 'call-1', conversationId: conversation,
            from: { id: target, name: 'Ivan', avatarUrl: '/ivan.png' }, callType: 'video', reason: null,
        });
    });

    it('type ou horodatage manquant, ou forme étrangère → null', () => {
        expect(parsePushPayload({ type: 'incoming_call' })).toBeNull();
        expect(parsePushPayload({ ts: 1 })).toBeNull();
        expect(parsePushPayload('incoming_call')).toBeNull();
        expect(parsePushPayload(null)).toBeNull();
    });

    it('champs inattendus ignorés, type d’appel inconnu → null, expéditeur sans id → null', () => {
        const parsed = parsePushPayload({ type: 'call_cancelled', ts: 1, callType: 'holo', from: { name: 'X' }, reason: 'missed', extra: 42 });
        expect(parsed).toEqual({ v: 1, type: 'call_cancelled', ts: 1, callId: null, conversationId: null, from: null, callType: null, reason: 'missed' });
    });
});

describe('readPushLaunchParams (VF-1 — lecture puis NETTOYAGE de l’URL)', () => {
    const setUrl = (url: string) => window.history.replaceState({}, '', url);

    it('lit les paramètres du service worker et les retire de l’URL, en gardant les autres', () => {
        setUrl(`/?tab=chat&pushAction=accept&pushType=incoming_call&callId=call-5&conv=${conversation}&from=${target}&callType=audio&ts=1700000000000#/home`);
        expect(readPushLaunchParams()).toEqual({
            action: 'accept', type: 'incoming_call', callId: 'call-5', conversationId: conversation, fromUserId: target, callType: 'audio', ts: 1700000000000,
        });
        expect(window.location.search).toBe('?tab=chat');
        expect(window.location.hash).toBe('#/home');
        // Une seconde lecture (rechargement) ne rejoue jamais l'action.
        expect(readPushLaunchParams()).toBeNull();
        setUrl('/');
    });

    it('sans pushAction, ou action inconnue → null et URL intacte', () => {
        setUrl('/?tab=chat');
        expect(readPushLaunchParams()).toBeNull();
        expect(window.location.search).toBe('?tab=chat');
        setUrl('/?pushAction=explode&callId=x');
        expect(readPushLaunchParams()).toBeNull();
        expect(window.location.search).toBe('?pushAction=explode&callId=x');
        setUrl('/');
    });

    it('horodatage ou type d’appel invalides → null pour ces champs seulement', () => {
        setUrl('/?pushAction=open&pushType=message&ts=hier&callType=holo');
        expect(readPushLaunchParams()).toEqual({ action: 'open', type: 'message', callId: null, conversationId: null, fromUserId: null, callType: null, ts: null });
        expect(window.location.search).toBe('');
        setUrl('/');
    });
});

describe('listenPushCallEvents (VF-1 — messages du service worker filtrés)', () => {
    let sw: EventTarget;
    beforeEach(() => {
        sw = new EventTarget();
        Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: sw });
    });
    afterEach(() => {
        Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
    });

    const post = (data: unknown) => sw.dispatchEvent(new MessageEvent('message', { data }));
    const payload = { v: 1, type: 'incoming_call', ts: 5, callId: 'call-1', conversationId: conversation, from: { id: target, name: 'Ivan', avatarUrl: null }, callType: 'audio' };

    it('moknet-push → onIncoming ; moknet-push-action → onAction ; le reste est ignoré', () => {
        const onIncoming = vi.fn();
        const onAction = vi.fn();
        const stop = listenPushCallEvents({ onIncoming, onAction });

        post({ type: 'moknet-push', payload });
        post({ type: 'moknet-push-action', action: 'accept', payload });
        post({ type: 'moknet-push-action', action: 'launch', payload }); // action inconnue
        post({ type: 'moknet-push', payload: { hello: true } });          // charge non conforme
        post({ type: 'other', payload });
        post('texte');
        post(null);

        expect(onIncoming).toHaveBeenCalledTimes(1);
        expect(onIncoming).toHaveBeenCalledWith(expect.objectContaining({ type: 'incoming_call', callId: 'call-1' }));
        expect(onAction).toHaveBeenCalledTimes(1);
        expect(onAction).toHaveBeenCalledWith('accept', expect.objectContaining({ callId: 'call-1' }));

        stop();
        post({ type: 'moknet-push', payload });
        expect(onIncoming).toHaveBeenCalledTimes(1);
    });

    it('un gestionnaire qui jette ne casse pas l’écoute des messages suivants', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        const onIncoming = vi.fn().mockImplementationOnce(() => { throw new Error('boum'); });
        listenPushCallEvents({ onIncoming, onAction: vi.fn() });
        post({ type: 'moknet-push', payload });
        post({ type: 'moknet-push', payload });
        expect(onIncoming).toHaveBeenCalledTimes(2);
        expect(warn).toHaveBeenCalled();
    });

    it('sans service worker (navigateur ancien) → ne fait rien, désabonnement inoffensif', () => {
        Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: undefined });
        const stop = listenPushCallEvents({ onIncoming: vi.fn(), onAction: vi.fn() });
        expect(() => stop()).not.toThrow();
    });
});
