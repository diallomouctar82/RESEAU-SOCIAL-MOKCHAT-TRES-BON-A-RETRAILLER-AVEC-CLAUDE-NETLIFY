import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

/**
 * ÉQUIPE P (mission VF-1) — service worker `public/sw.js`, côté réception
 * des notifications push.
 *
 * Le fichier est servi tel quel (JavaScript pur, jamais transpilé) : il est
 * chargé ICI tel quel, dans un contexte `vm` isolé muni d'un faux `self`
 * (registration.showNotification/getNotifications, clients.matchAll/
 * openWindow, caches, fetch). Chaque test vérifie un engagement précis :
 * appel entrant frais → notification complète ET message aux fenêtres
 * ouvertes ; appel périmé → rien ; annulation → fermeture de la
 * notification du même callId ; clic → focus + message, ou ouverture d'une
 * fenêtre avec les bons paramètres ; JSON invalide → aucune exception.
 * Le comportement de cache historique est vérifié lui aussi : rien ne
 * doit avoir régressé en ajoutant le push.
 */

const SW_PATH = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../public/sw.js');
const SW_SOURCE = readFileSync(SW_PATH, 'utf8');

/* ─────────────────────────── Doublures du worker ───────────────────────── */

class FakeNotification {
    closed = false;
    close = vi.fn(() => {
        this.closed = true;
    });
    constructor(public title: string, public options: Record<string, any>) {}
    get tag(): string | undefined {
        return this.options.tag;
    }
    get data(): unknown {
        return this.options.data;
    }
}

class FakeWindowClient {
    focused = false;
    visibilityState: 'visible' | 'hidden' = 'hidden';
    messages: unknown[] = [];
    focus = vi.fn(async () => {
        this.focused = true;
        return this;
    });
    postMessage = vi.fn((message: unknown) => {
        this.messages.push(message);
    });
}

function loadServiceWorker() {
    const listeners = new Map<string, Array<(event: any) => void>>();
    const notifications: FakeNotification[] = [];
    const windowClients: FakeWindowClient[] = [];
    const subscribe = vi.fn(async (options: unknown) => ({ endpoint: 'https://push.example.org/renouvele', options }));
    const registration = {
        showNotification: vi.fn(async (title: string, options: Record<string, any>) => {
            notifications.push(new FakeNotification(title, options));
        }),
        getNotifications: vi.fn(async (filter?: { tag?: string }) =>
            notifications.filter((n) => !n.closed && (!filter?.tag || n.tag === filter.tag)),
        ),
        pushManager: { subscribe },
    };
    const clients = {
        matchAll: vi.fn(async () => windowClients.slice()),
        openWindow: vi.fn(async (_url: string) => null),
        claim: vi.fn(async () => undefined),
    };
    const self = {
        addEventListener: (type: string, handler: (event: any) => void) => {
            listeners.set(type, [...(listeners.get(type) ?? []), handler]);
        },
        // Origine du worker : les requêtes vers d'autres origines (API, CDN) ne
        // doivent jamais passer par le gestionnaire fetch.
        location: { origin: 'http://localhost' },
        registration,
        clients,
        skipWaiting: vi.fn(async () => undefined),
    };
    const cacheStore = { addAll: vi.fn(async () => undefined), put: vi.fn(), match: vi.fn(async (_key: string) => undefined as Response | undefined) };
    const caches = {
        open: vi.fn(async () => cacheStore),
        keys: vi.fn(async () => ['lmav-app-v6.4.1', 'lmav-app-v6.5.0', 'lmav-app-v6.6.0', 'lmav-ring-prefs-v1', 'autre-cache']),
        delete: vi.fn(async () => true),
        match: vi.fn(async () => undefined),
    };
    const fetchMock = vi.fn(async () => new Response('ok'));
    const consoleMock = { log: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() };
    const context = vm.createContext({
        self,
        caches,
        console: consoleMock,
        URL,
        Response,
        fetch: fetchMock,
        setTimeout,
        clearTimeout,
    });
    vm.runInContext(SW_SOURCE, context, { filename: 'sw.js' });

    /** Déclenche un événement et attend TOUT ce que le worker a confié à waitUntil. */
    async function dispatch(type: string, event: Record<string, any>) {
        const pending: Promise<unknown>[] = [];
        event.waitUntil = (promise: Promise<unknown>) => {
            pending.push(promise);
        };
        for (const handler of listeners.get(type) ?? []) handler(event);
        await Promise.all(pending);
    }

    return { dispatch, listeners, registration, clients, windowClients, notifications, subscribe, caches, cacheStore, fetchMock, consoleMock, self };
}

/** Mission SN : dépose des réglages « sonnerie / vibration » comme le fait la page (Cache API). */
function storeRingPreferences(sw: ReturnType<typeof loadServiceWorker>, prefs: unknown) {
    sw.cacheStore.match.mockImplementation(async (key: string) =>
        key === '/__moknet/ring-preferences' ? new Response(JSON.stringify(prefs)) : undefined,
    );
}

const pushEvent = (payload: unknown, options: { invalidJson?: boolean } = {}) => ({
    data: {
        json: () => {
            if (options.invalidJson) throw new SyntaxError('Unexpected token < in JSON');
            return payload;
        },
        text: () => String(payload),
    },
});

const incomingCall = (overrides: Record<string, unknown> = {}) => ({
    v: 1,
    type: 'incoming_call',
    ts: Date.now(),
    callId: 'call-42',
    conversationId: 'conv-7',
    from: { id: 'user-a', name: 'Aïssatou Bah', avatarUrl: 'https://cdn.example.org/aissatou.png' },
    callType: 'video',
    ...overrides,
});

/* ───────────────────────────── Cache existant ──────────────────────────── */

describe('cache (comportement historique conservé)', () => {
    it('version de cache montée à lmav-app-v6.6.0, installation SANS précache obligatoire, skipWaiting', async () => {
        expect(SW_SOURCE).toMatch(/const CACHE_NAME = 'lmav-app-v6\.6\.0'/);
        const sw = loadServiceWorker();
        expect([...sw.listeners.keys()]).toEqual(
            expect.arrayContaining(['install', 'activate', 'fetch', 'push', 'notificationclick', 'pushsubscriptionchange']),
        );

        await sw.dispatch('install', {});
        expect(sw.caches.open).toHaveBeenCalledWith('lmav-app-v6.6.0');
        // Mission SN : plus AUCUN fichier n'est exigé à l'installation — le
        // précache de /metadata.json (404 en production) faisait échouer
        // l'installation, donc jamais de worker actif, donc jamais de push.
        expect(sw.cacheStore.addAll).not.toHaveBeenCalled();
        expect(sw.fetchMock).not.toHaveBeenCalled();
        expect(sw.self.skipWaiting).toHaveBeenCalledTimes(1);
    });

    it('mission SN : même un cache inaccessible ne fait pas échouer l’installation (skipWaiting quand même, sans exception)', async () => {
        const sw = loadServiceWorker();
        sw.caches.open.mockRejectedValueOnce(new Error('QuotaExceededError'));
        await expect(sw.dispatch('install', {})).resolves.toBeUndefined();
        expect(sw.self.skipWaiting).toHaveBeenCalledTimes(1);
        expect(sw.consoleMock.warn).toHaveBeenCalled();
    });

    it('activate purge les anciens caches (et seulement eux) puis prend le contrôle des pages — le cache des réglages de sonnerie survit', async () => {
        const sw = loadServiceWorker();
        await sw.dispatch('activate', {});
        expect(sw.caches.delete).toHaveBeenCalledWith('lmav-app-v6.4.1');
        expect(sw.caches.delete).toHaveBeenCalledWith('lmav-app-v6.5.0');
        expect(sw.caches.delete).toHaveBeenCalledWith('autre-cache');
        expect(sw.caches.delete).not.toHaveBeenCalledWith('lmav-app-v6.6.0');
        expect(sw.caches.delete).not.toHaveBeenCalledWith('lmav-ring-prefs-v1');
        expect(sw.clients.claim).toHaveBeenCalledTimes(1);
    });

    it('navigation : réseau d’abord, repli sur /index.html en cache si le réseau tombe', async () => {
        const sw = loadServiceWorker();
        sw.fetchMock.mockRejectedValueOnce(new Error('hors ligne'));
        let responded: Promise<unknown> | null = null;
        await sw.dispatch('fetch', {
            request: { method: 'GET', url: 'http://localhost/', mode: 'navigate' },
            respondWith: (promise: Promise<unknown>) => {
                responded = promise;
            },
        });
        await responded;
        expect(sw.fetchMock).toHaveBeenCalledTimes(1);
        expect(sw.caches.match).toHaveBeenCalledWith('/index.html');
    });

    it('requête vers une autre origine (API Supabase) : le worker ne s’interpose pas — réseau natif, jamais un faux « 503 Offline »', async () => {
        const sw = loadServiceWorker();
        const respondWith = vi.fn();
        await sw.dispatch('fetch', {
            request: { method: 'GET', url: 'https://rqciahtpixdjbyoajomg.supabase.co/rest/v1/profiles?select=*', mode: 'cors' },
            respondWith,
        });
        expect(respondWith).not.toHaveBeenCalled();
        expect(sw.fetchMock).not.toHaveBeenCalled();
        expect(sw.caches.match).not.toHaveBeenCalled();
    });

    it('ressource statique de la même origine : toujours servie par le worker (cache puis réseau)', async () => {
        const sw = loadServiceWorker();
        let responded: Promise<unknown> | null = null;
        await sw.dispatch('fetch', {
            request: { method: 'GET', url: 'http://localhost/assets/index-abc123.js', mode: 'cors' },
            respondWith: (promise: Promise<unknown>) => {
                responded = promise;
            },
        });
        await responded;
        expect(sw.caches.match).toHaveBeenCalledTimes(1);
        expect(sw.fetchMock).toHaveBeenCalledTimes(1);
    });
});

/* ──────────────────────────── Réception push ───────────────────────────── */

describe('push', () => {
    it('appel vidéo entrant frais → notification complète ET message moknet-push à TOUTES les fenêtres', async () => {
        const sw = loadServiceWorker();
        sw.windowClients.push(new FakeWindowClient(), new FakeWindowClient());
        const payload = incomingCall();

        await sw.dispatch('push', pushEvent(payload));

        expect(sw.registration.showNotification).toHaveBeenCalledTimes(1);
        const [title, options] = sw.registration.showNotification.mock.calls[0];
        expect(title).toBe('Appel vidéo de Aïssatou Bah');
        expect(options).toMatchObject({
            body: 'Touchez pour répondre',
            tag: 'call-call-42',
            renotify: true,
            requireInteraction: true,
            icon: 'https://cdn.example.org/aissatou.png',
            badge: '/icons/badge-72.png',
            vibrate: [300, 150, 300, 800, 300, 150, 300],
            actions: [
                { action: 'accept', title: 'Répondre' },
                { action: 'reject', title: 'Refuser' },
            ],
        });
        expect(options.data).toEqual(payload);

        expect(sw.clients.matchAll).toHaveBeenCalledWith({ type: 'window', includeUncontrolled: true });
        for (const client of sw.windowClients) {
            expect(client.messages).toEqual([{ type: 'moknet-push', payload }]);
        }
    });

    it('appel audio sans avatar → « Appel de … » et icône par défaut', async () => {
        const sw = loadServiceWorker();
        await sw.dispatch('push', pushEvent(incomingCall({ callType: 'audio', from: { id: 'user-a', name: 'Mamadou', avatarUrl: null } })));
        const [title, options] = sw.registration.showNotification.mock.calls[0];
        expect(title).toBe('Appel de Mamadou');
        expect(options.icon).toBe('/icons/icon-192.png');
    });

    it('appel périmé (> 40 s) → aucune notification, aucun message', async () => {
        const sw = loadServiceWorker();
        sw.windowClients.push(new FakeWindowClient());
        await sw.dispatch('push', pushEvent(incomingCall({ ts: Date.now() - 41_000 })));
        expect(sw.registration.showNotification).not.toHaveBeenCalled();
        expect(sw.windowClients[0].messages).toEqual([]);

        // Juste sous la limite : sonne encore.
        await sw.dispatch('push', pushEvent(incomingCall({ ts: Date.now() - 39_000 })));
        expect(sw.registration.showNotification).toHaveBeenCalledTimes(1);
    });

    it('call_cancelled → ferme la notification du même callId (les autres restent) ; reason=missed → « Appel manqué »', async () => {
        const sw = loadServiceWorker();
        sw.windowClients.push(new FakeWindowClient());
        await sw.dispatch('push', pushEvent(incomingCall({ callId: 'call-42' })));
        await sw.dispatch('push', pushEvent(incomingCall({ callId: 'call-99' })));
        expect(sw.notifications).toHaveLength(2);

        await sw.dispatch('push', pushEvent({ v: 1, type: 'call_cancelled', ts: Date.now(), callId: 'call-42', from: { id: 'user-a', name: 'Aïssatou Bah' }, reason: 'answered' }));
        expect(sw.registration.getNotifications).toHaveBeenCalledWith({ tag: 'call-call-42' });
        expect(sw.notifications[0].closed).toBe(true);
        expect(sw.notifications[1].closed).toBe(false);
        expect(sw.notifications).toHaveLength(2); // rien de nouveau pour un appel répondu ailleurs
        expect(sw.windowClients[0].messages.at(-1)).toMatchObject({ type: 'moknet-push', payload: { type: 'call_cancelled', callId: 'call-42' } });

        await sw.dispatch('push', pushEvent({ v: 1, type: 'call_cancelled', ts: Date.now(), callId: 'call-99', from: { id: 'user-a', name: 'Aïssatou Bah' }, reason: 'missed' }));
        expect(sw.notifications[1].closed).toBe(true);
        const missed = sw.notifications[2];
        expect(missed.title).toBe('Appel manqué de Aïssatou Bah');
        expect(missed.options.tag).toBe('missed-call-99');
        expect(missed.options.requireInteraction).toBeUndefined();
    });

    it('missed_call → « Appel manqué de … » sans requireInteraction', async () => {
        const sw = loadServiceWorker();
        await sw.dispatch('push', pushEvent({ v: 1, type: 'missed_call', ts: Date.now(), callId: 'call-1', from: { id: 'user-b', name: 'Fatou' } }));
        expect(sw.notifications[0].title).toBe('Appel manqué de Fatou');
        expect(sw.notifications[0].options.tag).toBe('missed-call-1');
        expect(sw.notifications[0].options.requireInteraction).toBeUndefined();
    });

    it('message → titre/corps fournis, sinon « Nouveau message de … » + aperçu', async () => {
        const sw = loadServiceWorker();
        await sw.dispatch('push', pushEvent({ v: 1, type: 'message', ts: Date.now(), conversationId: 'conv-7', from: { id: 'user-b', name: 'Fatou' }, title: 'Fatou (Campus)', body: 'On se voit à 18h ?' }));
        expect(sw.notifications[0].title).toBe('Fatou (Campus)');
        expect(sw.notifications[0].options.body).toBe('On se voit à 18h ?');
        expect(sw.notifications[0].options.tag).toBe('message-conv-7');

        await sw.dispatch('push', pushEvent({ v: 1, type: 'message', ts: Date.now(), conversationId: 'conv-8', from: { id: 'user-b', name: 'Fatou' }, messagePreview: 'Salut !' }));
        expect(sw.notifications[1].title).toBe('Nouveau message de Fatou');
        expect(sw.notifications[1].options.body).toBe('Salut !');
    });

    it('AU-10 : demande d’ami → notification au nom lu par le SERVEUR, jamais un titre fourni par l’expéditeur', async () => {
        const sw = loadServiceWorker();
        sw.windowClients.push(new FakeWindowClient());
        await sw.dispatch('push', pushEvent({
            v: 1,
            type: 'friend_request',
            ts: Date.now(),
            from: { id: 'user-c', name: 'Mariama Diallo', avatarUrl: 'https://cdn.example.org/mariama.png' },
            // Un expéditeur malveillant tenterait d'écrire lui-même le titre
            // affiché sur l'écran verrouillé de sa cible : il est ignoré.
            title: 'ALERTE BANCAIRE — cliquez ici',
            body: 'Votre compte est bloqué',
        }));
        expect(sw.notifications).toHaveLength(1);
        expect(sw.notifications[0].title).toBe('Mariama Diallo souhaite vous ajouter');
        expect(sw.notifications[0].options.body).toBe('Nouvelle demande d’ami sur MokNet');
        expect(sw.notifications[0].options.tag).toBe('friend-request-user-c');
        expect(sw.notifications[0].options.icon).toBe('https://cdn.example.org/mariama.png');
        // Une invitation n'est pas un appel : ni sonnerie insistante, ni actions.
        expect(sw.notifications[0].options.requireInteraction).toBeUndefined();
        expect(sw.notifications[0].options.actions).toBeUndefined();
        // La fenêtre ouverte est prévenue comme pour tout autre push.
        expect(sw.windowClients[0].messages).toHaveLength(1);
    });

    it('AU-10 : demande d’ami sans profil expéditeur → libellé neutre, jamais un nom inventé', async () => {
        const sw = loadServiceWorker();
        await sw.dispatch('push', pushEvent({ v: 1, type: 'friend_request', ts: Date.now(), from: null }));
        expect(sw.notifications[0].title).toBe('Un membre MokNet souhaite vous ajouter');
        expect(sw.notifications[0].options.tag).toBe('friend-request-moknet');
    });

    it('JSON invalide → aucune exception, aucune notification, aucun message', async () => {
        const sw = loadServiceWorker();
        sw.windowClients.push(new FakeWindowClient());
        await expect(sw.dispatch('push', pushEvent(null, { invalidJson: true }))).resolves.toBeUndefined();
        await expect(sw.dispatch('push', { data: null })).resolves.toBeUndefined();
        await expect(sw.dispatch('push', pushEvent('texte brut'))).resolves.toBeUndefined();
        expect(sw.registration.showNotification).not.toHaveBeenCalled();
        expect(sw.windowClients[0].messages).toEqual([]);
        expect(sw.consoleMock.warn).toHaveBeenCalled();
    });

    it('showNotification qui échoue → l’événement se termine sans exception', async () => {
        const sw = loadServiceWorker();
        sw.registration.showNotification.mockRejectedValue(new TypeError('actions non supportées'));
        await expect(sw.dispatch('push', pushEvent(incomingCall()))).resolves.toBeUndefined();
        expect(sw.consoleMock.warn).toHaveBeenCalled();
    });
});

/* ──────────── Mission SN : réglages sonnerie / vibration honorés ──────────── */

describe('push — réglages « Sonnerie » de l’appareil (mission SN)', () => {
    it('sonnerie coupée → notification d’appel toujours affichée, mais silencieuse et sans motif de vibration (le navigateur interdit les deux ensemble)', async () => {
        const sw = loadServiceWorker();
        storeRingPreferences(sw, { ringtoneEnabled: false, vibrationEnabled: true });
        await sw.dispatch('push', pushEvent(incomingCall()));
        expect(sw.caches.open).toHaveBeenCalledWith('lmav-ring-prefs-v1');
        expect(sw.registration.showNotification).toHaveBeenCalledTimes(1);
        const [, options] = sw.registration.showNotification.mock.calls[0];
        expect(options.silent).toBe(true);
        expect(options.vibrate).toBeUndefined();
        expect(options).toMatchObject({ requireInteraction: true, renotify: true, tag: 'call-call-42' });
        expect(options.actions).toHaveLength(2);
    });

    it('vibration coupée (sonnerie active) → notification sonore sans motif de vibration', async () => {
        const sw = loadServiceWorker();
        storeRingPreferences(sw, { ringtoneEnabled: true, vibrationEnabled: false });
        await sw.dispatch('push', pushEvent(incomingCall()));
        const [, options] = sw.registration.showNotification.mock.calls[0];
        expect(options.silent).toBeUndefined();
        expect(options.vibrate).toBeUndefined();
    });

    it('réglages illisibles ou absents → sonnerie ET vibration, comme avant (jamais une notification perdue)', async () => {
        const sw = loadServiceWorker();
        sw.cacheStore.match.mockImplementation(async () => new Response('{pas du json'));
        await sw.dispatch('push', pushEvent(incomingCall()));
        expect(sw.registration.showNotification).toHaveBeenCalledTimes(1);
        expect(sw.registration.showNotification.mock.calls[0][1].vibrate).toEqual([300, 150, 300, 800, 300, 150, 300]);

        sw.caches.open.mockRejectedValueOnce(new Error('cache indisponible'));
        await sw.dispatch('push', pushEvent(incomingCall({ callId: 'call-43' })));
        expect(sw.registration.showNotification).toHaveBeenCalledTimes(2);
        expect(sw.registration.showNotification.mock.calls[1][1].vibrate).toEqual([300, 150, 300, 800, 300, 150, 300]);
    });

    it('les réglages ne concernent que l’appel entrant : une demande d’ami vibre brièvement quoi qu’il arrive', async () => {
        const sw = loadServiceWorker();
        storeRingPreferences(sw, { ringtoneEnabled: false, vibrationEnabled: false });
        await sw.dispatch('push', pushEvent({ v: 1, type: 'friend_request', ts: Date.now(), from: { id: 'user-c', name: 'Mariama' } }));
        expect(sw.notifications[0].options.vibrate).toEqual([200, 100, 200]);
        expect(sw.notifications[0].options.silent).toBeUndefined();
    });
});

/* ─────────────────────────── Clic de notification ──────────────────────── */

describe('notificationclick', () => {
    it('« accept » avec une fenêtre ouverte → fermeture, focus, message moknet-push-action ; jamais openWindow', async () => {
        const sw = loadServiceWorker();
        const hidden = new FakeWindowClient();
        const visible = new FakeWindowClient();
        visible.visibilityState = 'visible';
        sw.windowClients.push(hidden, visible);
        const payload = incomingCall();
        const notification = new FakeNotification('Appel vidéo de Aïssatou Bah', { tag: 'call-call-42', data: payload });

        await sw.dispatch('notificationclick', { notification, action: 'accept' });

        expect(notification.close).toHaveBeenCalledTimes(1);
        expect(visible.focus).toHaveBeenCalledTimes(1); // la fenêtre visible est préférée à la fenêtre cachée
        expect(visible.messages).toEqual([{ type: 'moknet-push-action', action: 'accept', payload }]);
        expect(hidden.messages).toEqual([]);
        expect(sw.clients.openWindow).not.toHaveBeenCalled();
    });

    it('sans fenêtre → openWindow avec les paramètres encodés', async () => {
        const sw = loadServiceWorker();
        const payload = incomingCall({ callId: 'call 42/é', conversationId: 'conv-7', ts: 1725220000000 });
        const notification = new FakeNotification('Appel', { data: payload });

        await sw.dispatch('notificationclick', { notification, action: 'reject' });

        expect(sw.clients.openWindow).toHaveBeenCalledTimes(1);
        const opened = sw.clients.openWindow.mock.calls[0][0] as string;
        expect(opened.startsWith('/?')).toBe(true);
        expect(opened).toContain('callId=call%2042%2F%C3%A9');
        const params = new URL(opened, 'http://localhost').searchParams;
        expect(Object.fromEntries(params.entries())).toEqual({
            pushAction: 'reject',
            pushType: 'incoming_call',
            callId: 'call 42/é',
            conv: 'conv-7',
            from: 'user-a',
            callType: 'video',
            ts: '1725220000000',
        });
    });

    it('clic sur le corps (sans action) → pushAction=open ; champs absents omis', async () => {
        const sw = loadServiceWorker();
        const notification = new FakeNotification('Nouveau message de Fatou', {
            data: { v: 1, type: 'message', ts: 1725220000000, conversationId: 'conv-8', from: { id: 'user-b', name: 'Fatou' } },
        });
        await sw.dispatch('notificationclick', { notification, action: '' });
        const params = new URL(sw.clients.openWindow.mock.calls[0][0] as string, 'http://localhost').searchParams;
        expect(params.get('pushAction')).toBe('open');
        expect(params.get('pushType')).toBe('message');
        expect(params.get('conv')).toBe('conv-8');
        expect(params.has('callId')).toBe(false);
        expect(params.has('callType')).toBe(false);
    });

    it('focus refusé ou données absentes → aucune exception', async () => {
        const sw = loadServiceWorker();
        const client = new FakeWindowClient();
        client.focus.mockRejectedValue(new Error('InvalidAccessError'));
        sw.windowClients.push(client);
        await expect(sw.dispatch('notificationclick', { notification: new FakeNotification('x', {}), action: 'accept' })).resolves.toBeUndefined();
        expect(client.messages).toEqual([{ type: 'moknet-push-action', action: 'accept', payload: {} }]);
    });
});

/* ─────────────────────────── Changement d'abonnement ───────────────────── */

describe('pushsubscriptionchange', () => {
    it('se réabonne avec la clé de l’ancien abonnement et prévient les fenêtres (moknet-push-resubscribed)', async () => {
        const sw = loadServiceWorker();
        sw.windowClients.push(new FakeWindowClient());
        const applicationServerKey = Uint8Array.from([4, 1, 2, 3]);

        await sw.dispatch('pushsubscriptionchange', { oldSubscription: { options: { applicationServerKey } } });

        expect(sw.subscribe).toHaveBeenCalledWith({ userVisibleOnly: true, applicationServerKey });
        expect(sw.windowClients[0].messages).toEqual([{ type: 'moknet-push-resubscribed', endpoint: 'https://push.example.org/renouvele' }]);
    });

    it('sans clé connue → pas de réabonnement aveugle, mais la page est prévenue pour le faire elle-même', async () => {
        const sw = loadServiceWorker();
        sw.windowClients.push(new FakeWindowClient());
        await sw.dispatch('pushsubscriptionchange', { oldSubscription: null });
        expect(sw.subscribe).not.toHaveBeenCalled();
        expect(sw.windowClients[0].messages).toEqual([{ type: 'moknet-push-resubscribed', endpoint: null }]);
    });

    it('réabonnement refusé → aucune exception', async () => {
        const sw = loadServiceWorker();
        sw.subscribe.mockRejectedValue(new Error('AbortError'));
        await expect(
            sw.dispatch('pushsubscriptionchange', { oldSubscription: { options: { applicationServerKey: Uint8Array.from([4]) } } }),
        ).resolves.toBeUndefined();
        expect(sw.consoleMock.warn).toHaveBeenCalled();
    });
});
