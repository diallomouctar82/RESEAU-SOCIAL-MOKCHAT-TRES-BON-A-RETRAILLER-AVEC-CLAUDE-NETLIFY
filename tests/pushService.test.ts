import React from 'react';
import { fireEvent, render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ÉQUIPE P (mission VF-1) — notifications push côté client : service,
 * enregistrement du service worker, hook silencieux et bandeau.
 *
 * jsdom n'a ni service worker, ni PushManager, ni Notification : tout passe
 * par des doublures minimales qui enregistrent ce que le service leur
 * demande (abonnement créé avec QUELLE clé, RPC appelée avec QUELS
 * arguments). Chaque assertion vise un engagement précis du contrat :
 * jamais de demande de permission hors d'un geste utilisateur, clés
 * transmises en base64url, sauvegarde bornée à une fois par 24 h et par
 * endpoint POUR CET UTILISATEUR (jamais partagée entre deux comptes),
 * déconnexion qui ne lève jamais, états honnêtes du bandeau.
 */

const mocks = vi.hoisted(() => ({
    rpc: vi.fn(),
    invoke: vi.fn(),
    deleteEq: vi.fn(),
}));

vi.mock('../services/supabaseClient', () => ({
    isSupabaseConfigured: true,
    supabase: {
        rpc: (...args: unknown[]) => mocks.rpc(...args),
        functions: { invoke: (...args: unknown[]) => mocks.invoke(...args) },
        from: (table: string) => ({
            delete: () => ({ eq: (column: string, value: string) => mocks.deleteEq(table, column, value) }),
        }),
    },
}));

import {
    arrayBufferToBase64Url,
    ensurePushSubscription,
    forgetPushSubscription,
    getPushPermissionState,
    isPushSupported,
    needsIosHomeScreenInstall,
    PUSH_SAVE_MARKER_PREFIX,
    PUSH_SAVE_TTL_MS,
    requestPushPermissionAndSubscribe,
    urlBase64ToUint8Array,
} from '../services/push/pushService';
import { getServiceWorkerRegistration } from '../services/pwaService';
import { __resetPushNotificationsForTests, usePushNotifications } from '../hooks/usePushNotifications';
import {
    PUSH_PROMPT_DISMISS_PREFIX,
    PUSH_PROMPT_TEXT,
    PushPermissionPrompt,
} from '../components/push/PushPermissionPrompt';

/* ─────────────────────────── Données de référence ──────────────────────── */

const USER_A = 'a1b2c3d4-0000-4000-8000-000000000001';
const USER_B = 'a1b2c3d4-0000-4000-8000-000000000002';

/** Clé VAPID P-256 non compressée : 65 octets, premier octet 0x04. */
const PUBLIC_KEY_BYTES = Uint8Array.from({ length: 65 }, (_, i) => (i * 7 + 4) % 256);
PUBLIC_KEY_BYTES[0] = 4;
const PUBLIC_KEY = Buffer.from(PUBLIC_KEY_BYTES).toString('base64url');
const P256DH_BYTES = Uint8Array.from({ length: 65 }, (_, i) => (255 - i) % 256);
const AUTH_BYTES = Uint8Array.from({ length: 16 }, (_, i) => (i * 13) % 256);
const P256DH_B64URL = Buffer.from(P256DH_BYTES).toString('base64url');
const AUTH_B64URL = Buffer.from(AUTH_BYTES).toString('base64url');

/* ────────────────────────── Doublures navigateur ───────────────────────── */

class FakePushSubscription {
    unsubscribe = vi.fn(async () => true);
    constructor(
        public endpoint: string,
        public options: { userVisibleOnly?: boolean; applicationServerKey?: unknown },
    ) {}
    getKey(name: 'p256dh' | 'auth'): ArrayBuffer {
        return (name === 'p256dh' ? P256DH_BYTES : AUTH_BYTES).slice().buffer;
    }
    toJSON() {
        return { endpoint: this.endpoint, keys: { p256dh: P256DH_B64URL, auth: AUTH_B64URL } };
    }
}

class FakePushManager {
    static counter = 0;
    subscription: FakePushSubscription | null = null;
    subscribe = vi.fn(async (options: { userVisibleOnly?: boolean; applicationServerKey?: unknown }) => {
        FakePushManager.counter += 1;
        this.subscription = new FakePushSubscription(`https://push.example.org/sub/${FakePushManager.counter}`, options);
        return this.subscription;
    });
    getSubscription = vi.fn(async () => this.subscription);
}

interface FakeEnvironment {
    pushManager: FakePushManager;
    serviceWorker: {
        getRegistration: ReturnType<typeof vi.fn>;
        register: ReturnType<typeof vi.fn>;
        emitMessage: (data: unknown) => void;
    };
    notification: { permission: NotificationPermission; requestPermission: ReturnType<typeof vi.fn> };
}

function installPushEnvironment(
    permission: NotificationPermission = 'granted',
    options: { hasRegistration?: boolean } = {},
): FakeEnvironment {
    const pushManager = new FakePushManager();
    const registration = { active: {}, scope: 'http://localhost:3000/', pushManager };
    const listeners = new Set<(event: MessageEvent) => void>();
    const serviceWorker = {
        getRegistration: vi.fn(async () => (options.hasRegistration === false ? undefined : registration)),
        register: vi.fn(async () => registration),
        ready: Promise.resolve(registration),
        addEventListener: vi.fn((type: string, handler: (event: MessageEvent) => void) => {
            if (type === 'message') listeners.add(handler);
        }),
        removeEventListener: vi.fn((_type: string, handler: (event: MessageEvent) => void) => {
            listeners.delete(handler);
        }),
        emitMessage: (data: unknown) => listeners.forEach((handler) => handler({ data } as MessageEvent)),
    };
    Object.defineProperty(window.navigator, 'serviceWorker', { configurable: true, value: serviceWorker });
    (window as any).PushManager = FakePushManager;
    const notification = {
        permission,
        requestPermission: vi.fn(async () => {
            notification.permission = 'granted';
            return 'granted' as NotificationPermission;
        }),
    };
    (window as any).Notification = notification;
    return { pushManager, serviceWorker, notification };
}

function uninstallPushEnvironment() {
    delete (window.navigator as any).serviceWorker;
    delete (window as any).PushManager;
    delete (window as any).Notification;
    delete (window.navigator as any).userAgent;
    delete (window.navigator as any).standalone;
}

function setUserAgent(value: string) {
    Object.defineProperty(window.navigator, 'userAgent', { configurable: true, get: () => value });
}

const IPHONE_UA =
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
    'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0 Mobile Safari/537.36';

type RpcResponse = { data: unknown; error: { message: string } | null };

/** RPC nominales : clé publique disponible, sauvegarde acceptée. */
function useNominalRpc(overrides: Partial<Record<string, (args?: unknown) => Promise<RpcResponse>>> = {}) {
    mocks.rpc.mockImplementation(async (fn: string, args?: unknown) => {
        const override = overrides[fn];
        if (override) return override(args);
        if (fn === 'get_push_public_key') return { data: PUBLIC_KEY, error: null };
        if (fn === 'save_push_subscription') return { data: 'b0000000-0000-4000-8000-000000000001', error: null };
        return { data: null, error: { message: `RPC inconnue : ${fn}` } };
    });
}

const saveCalls = () => mocks.rpc.mock.calls.filter((call) => call[0] === 'save_push_subscription');

beforeEach(() => {
    mocks.rpc.mockReset();
    mocks.invoke.mockReset();
    mocks.deleteEq.mockReset();
    mocks.deleteEq.mockResolvedValue({ error: null });
    FakePushManager.counter = 0;
    __resetPushNotificationsForTests();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'info').mockImplementation(() => {});
});

afterEach(() => {
    uninstallPushEnvironment();
});

/* ─────────────────────────── Conversion de clés ────────────────────────── */

describe('urlBase64ToUint8Array / arrayBufferToBase64Url', () => {
    it('décode l’alphabet URL (- _) sans remplissage en octets exacts', () => {
        // 0xfb 0xff 0xbf → base64 "+/+/" → base64url "-_-_"
        expect(Array.from(urlBase64ToUint8Array('-_-_'))).toEqual([0xfb, 0xff, 0xbf]);
        expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3]);
        expect(Array.from(urlBase64ToUint8Array(' AQ '))).toEqual([1]); // espaces tolérés, remplissage reconstitué
    });

    it('aller-retour sur une clé P-256 de 65 octets', () => {
        const bytes = urlBase64ToUint8Array(PUBLIC_KEY);
        expect(bytes.length).toBe(65);
        expect(bytes[0]).toBe(4);
        expect(Array.from(bytes)).toEqual(Array.from(PUBLIC_KEY_BYTES));
        expect(arrayBufferToBase64Url(bytes.buffer)).toBe(PUBLIC_KEY);
    });

    it('encode en base64url sans « = » ni « + » ni « / »', () => {
        expect(arrayBufferToBase64Url(Uint8Array.from([0xfb, 0xff, 0xbf, 0x01]).buffer)).toBe('-_-_AQ');
    });

    it('une chaîne illisible lève — jamais une clé vide silencieuse', () => {
        expect(() => urlBase64ToUint8Array('%%%')).toThrow();
    });
});

/* ─────────────────────────── États de permission ───────────────────────── */

describe('isPushSupported / getPushPermissionState', () => {
    it('sans PushManager (ou service worker) : non supporté', () => {
        expect(isPushSupported()).toBe(false);
        expect(getPushPermissionState()).toBe('unsupported');
    });

    it('reflète Notification.permission quand tout est là', () => {
        const env = installPushEnvironment('granted');
        expect(isPushSupported()).toBe(true);
        expect(getPushPermissionState()).toBe('granted');
        env.notification.permission = 'denied';
        expect(getPushPermissionState()).toBe('denied');
        env.notification.permission = 'default';
        expect(getPushPermissionState()).toBe('default');
    });
});

/* ──────────────────────────── ensurePushSubscription ───────────────────── */

describe('ensurePushSubscription', () => {
    it('crée l’abonnement avec la clé serveur et l’enregistre : endpoint, p256dh, auth en base64url, user agent', async () => {
        const env = installPushEnvironment('granted');
        useNominalRpc();

        const result = await ensurePushSubscription(USER_A);

        expect(result).toEqual({ status: 'subscribed', endpoint: 'https://push.example.org/sub/1' });
        expect(env.pushManager.subscribe).toHaveBeenCalledTimes(1);
        const options = env.pushManager.subscribe.mock.calls[0][0];
        expect(options.userVisibleOnly).toBe(true);
        expect(Array.from(options.applicationServerKey as Uint8Array)).toEqual(Array.from(PUBLIC_KEY_BYTES));

        expect(saveCalls()).toHaveLength(1);
        expect(saveCalls()[0][1]).toEqual({
            p_endpoint: 'https://push.example.org/sub/1',
            p_p256dh: P256DH_B64URL,
            p_auth: AUTH_B64URL,
            p_user_agent: expect.any(String),
        });
        expect(/^[A-Za-z0-9_-]+$/.test(P256DH_B64URL) && /^[A-Za-z0-9_-]+$/.test(AUTH_B64URL)).toBe(true);
        expect(env.notification.requestPermission).not.toHaveBeenCalled();

        const marker = JSON.parse(window.localStorage.getItem(`${PUSH_SAVE_MARKER_PREFIX}${USER_A}`) || 'null');
        expect(marker.endpoint).toBe('https://push.example.org/sub/1');
        expect(typeof marker.savedAt).toBe('number');
    });

    it('clé absente de la RPC (jamais générée) : repli sur la fonction Edge public_key', async () => {
        installPushEnvironment('granted');
        useNominalRpc({ get_push_public_key: async () => ({ data: null, error: null }) });
        mocks.invoke.mockResolvedValue({ data: { publicKey: PUBLIC_KEY }, error: null });

        const result = await ensurePushSubscription(USER_A);

        expect(result.status).toBe('subscribed');
        expect(mocks.invoke).toHaveBeenCalledWith('push-notify', { body: { action: 'public_key' } });
    });

    it('clé indisponible partout : erreur explicite, aucun abonnement, aucune sauvegarde', async () => {
        const env = installPushEnvironment('granted');
        useNominalRpc({ get_push_public_key: async () => ({ data: null, error: { message: 'indisponible' } }) });
        mocks.invoke.mockResolvedValue({ data: null, error: { message: 'Edge Function returned 503' } });

        const result = await ensurePushSubscription(USER_A);

        expect(result.status).toBe('error');
        expect(result.error).toMatch(/Clé publique push indisponible/);
        expect(env.pushManager.subscribe).not.toHaveBeenCalled();
        expect(saveCalls()).toHaveLength(0);
    });

    it('permission refusée : denied, sans RPC ni abonnement', async () => {
        const env = installPushEnvironment('denied');
        useNominalRpc();
        expect(await ensurePushSubscription(USER_A)).toEqual({ status: 'denied' });
        expect(mocks.rpc).not.toHaveBeenCalled();
        expect(env.pushManager.subscribe).not.toHaveBeenCalled();
    });

    it('permission jamais demandée : default — et surtout on ne la demande PAS ici', async () => {
        const env = installPushEnvironment('default');
        useNominalRpc();
        expect(await ensurePushSubscription(USER_A)).toEqual({ status: 'default' });
        expect(env.notification.requestPermission).not.toHaveBeenCalled();
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it('navigateur sans push : unsupported', async () => {
        expect(await ensurePushSubscription(USER_A)).toEqual({ status: 'unsupported' });
    });

    it('abonnement existant : pas de nouvelle sauvegarde dans les 24 h, ré-enregistré après (ou si forcé)', async () => {
        installPushEnvironment('granted');
        useNominalRpc();

        await ensurePushSubscription(USER_A);
        await ensurePushSubscription(USER_A);
        expect(saveCalls()).toHaveLength(1);

        const key = `${PUSH_SAVE_MARKER_PREFIX}${USER_A}`;
        const marker = JSON.parse(window.localStorage.getItem(key) || '{}');
        window.localStorage.setItem(key, JSON.stringify({ ...marker, savedAt: Date.now() - PUSH_SAVE_TTL_MS - 1 }));
        await ensurePushSubscription(USER_A);
        expect(saveCalls()).toHaveLength(2);

        await ensurePushSubscription(USER_A, { force: true });
        expect(saveCalls()).toHaveLength(3);
    });

    it('un autre endpoint (abonnement renouvelé) invalide le marqueur', async () => {
        const env = installPushEnvironment('granted');
        useNominalRpc();
        await ensurePushSubscription(USER_A);
        env.pushManager.subscription = new FakePushSubscription('https://push.example.org/sub/renouvele', {});
        await ensurePushSubscription(USER_A);
        expect(saveCalls()).toHaveLength(2);
        expect(saveCalls()[1][1]).toMatchObject({ p_endpoint: 'https://push.example.org/sub/renouvele' });
    });

    it('le marqueur est propre à l’utilisateur : un second compte sur le même appareil enregistre à son tour', async () => {
        installPushEnvironment('granted');
        useNominalRpc();
        await ensurePushSubscription(USER_A);
        await ensurePushSubscription(USER_B);
        expect(saveCalls()).toHaveLength(2);
        expect(window.localStorage.getItem(`${PUSH_SAVE_MARKER_PREFIX}${USER_A}`)).not.toBeNull();
        expect(window.localStorage.getItem(`${PUSH_SAVE_MARKER_PREFIX}${USER_B}`)).not.toBeNull();
    });

    it('sauvegarde serveur refusée : error avec le message réel, aucun marqueur écrit', async () => {
        installPushEnvironment('granted');
        useNominalRpc({ save_push_subscription: async () => ({ data: null, error: { message: 'permission denied for function' } }) });

        const result = await ensurePushSubscription(USER_A);

        expect(result.status).toBe('error');
        expect(result.error).toMatch(/permission denied for function/);
        expect(window.localStorage.getItem(`${PUSH_SAVE_MARKER_PREFIX}${USER_A}`)).toBeNull();
    });

    it('service worker inenregistrable : error, jamais une exception', async () => {
        const env = installPushEnvironment('granted', { hasRegistration: false });
        env.serviceWorker.register.mockRejectedValue(new Error('SecurityError'));
        useNominalRpc();
        const result = await ensurePushSubscription(USER_A);
        expect(result.status).toBe('error');
        expect(result.error).toMatch(/Service worker inactif/);
    });
});

/* ──────────────────────── requestPushPermissionAndSubscribe ────────────── */

describe('requestPushPermissionAndSubscribe', () => {
    it('demande la permission puis s’abonne quand elle est accordée', async () => {
        const env = installPushEnvironment('default');
        useNominalRpc();
        const result = await requestPushPermissionAndSubscribe(USER_A);
        expect(env.notification.requestPermission).toHaveBeenCalledTimes(1);
        expect(result.status).toBe('subscribed');
        expect(saveCalls()).toHaveLength(1);
    });

    it('refus dans la boîte de dialogue : denied, sans abonnement', async () => {
        const env = installPushEnvironment('default');
        env.notification.requestPermission.mockImplementation(async () => {
            env.notification.permission = 'denied';
            return 'denied';
        });
        useNominalRpc();
        expect(await requestPushPermissionAndSubscribe(USER_A)).toEqual({ status: 'denied' });
        expect(env.pushManager.subscribe).not.toHaveBeenCalled();
    });

    it('ancienne signature à rappel (Safari) : la réponse arrive quand même', async () => {
        const env = installPushEnvironment('default');
        env.notification.requestPermission.mockImplementation((callback?: (p: NotificationPermission) => void) => {
            env.notification.permission = 'granted';
            callback?.('granted');
            return undefined;
        });
        useNominalRpc();
        expect((await requestPushPermissionAndSubscribe(USER_A)).status).toBe('subscribed');
    });
});

/* ───────────────────────────── Déconnexion ─────────────────────────────── */

describe('forgetPushSubscription', () => {
    it('désabonne le navigateur, supprime la ligne par endpoint et efface les marqueurs', async () => {
        const env = installPushEnvironment('granted');
        useNominalRpc();
        await ensurePushSubscription(USER_A);
        const subscription = env.pushManager.subscription!;

        await forgetPushSubscription();

        expect(mocks.deleteEq).toHaveBeenCalledWith('push_subscriptions', 'endpoint', subscription.endpoint);
        expect(subscription.unsubscribe).toHaveBeenCalledTimes(1);
        expect(window.localStorage.getItem(`${PUSH_SAVE_MARKER_PREFIX}${USER_A}`)).toBeNull();
    });

    it('ne lève jamais : sans service worker, enregistrement en échec, ou désabonnement qui jette', async () => {
        await expect(forgetPushSubscription()).resolves.toBeUndefined();

        const env = installPushEnvironment('granted');
        env.serviceWorker.getRegistration.mockRejectedValue(new Error('InvalidStateError'));
        await expect(forgetPushSubscription()).resolves.toBeUndefined();

        env.serviceWorker.getRegistration.mockResolvedValue({ pushManager: env.pushManager });
        env.pushManager.subscription = new FakePushSubscription('https://push.example.org/sub/x', {});
        env.pushManager.subscription.unsubscribe.mockRejectedValue(new Error('AbortError'));
        mocks.deleteEq.mockResolvedValue({ error: { message: 'session absente' } });
        await expect(forgetPushSubscription()).resolves.toBeUndefined();
    });
});

/* ──────────────────────── getServiceWorkerRegistration ─────────────────── */

describe('getServiceWorkerRegistration', () => {
    it('réutilise l’enregistrement existant, sinon enregistre /sw.js', async () => {
        const env = installPushEnvironment('granted');
        expect(await getServiceWorkerRegistration()).not.toBeNull();
        expect(env.serviceWorker.register).not.toHaveBeenCalled();

        env.serviceWorker.getRegistration.mockResolvedValue(undefined);
        expect(await getServiceWorkerRegistration()).not.toBeNull();
        expect(env.serviceWorker.register).toHaveBeenCalledWith('/sw.js');
    });

    it('null sans support — jamais une exception', async () => {
        expect(await getServiceWorkerRegistration()).toBeNull();
    });
});

/* ────── Mission SN : un enregistrement n'est rendu qu'avec un worker ACTIF ────── */

class FakeWorker {
    private listeners = new Set<() => void>();
    constructor(public state: ServiceWorkerState = 'installing') {}
    addEventListener(type: string, handler: () => void) {
        if (type === 'statechange') this.listeners.add(handler);
    }
    removeEventListener(_type: string, handler: () => void) {
        this.listeners.delete(handler);
    }
    transition(state: ServiceWorkerState) {
        this.state = state;
        this.listeners.forEach((handler) => handler());
    }
}

function makeRegistration(worker: FakeWorker | null, pushManager: FakePushManager, active: object | null = null) {
    return { active, installing: worker, waiting: null, scope: 'http://localhost:3000/', pushManager };
}

describe('getServiceWorkerRegistration — worker ACTIF exigé (mission SN)', () => {
    it('worker en cours d’installation : l’enregistrement n’est rendu qu’une fois ACTIVÉ — l’abonnement réussit ensuite', async () => {
        const env = installPushEnvironment('granted', { hasRegistration: false });
        useNominalRpc();
        const worker = new FakeWorker('installing');
        const registration = makeRegistration(worker, env.pushManager);
        env.serviceWorker.register.mockResolvedValue(registration);

        let settled = false;
        const pending = getServiceWorkerRegistration().then((result) => {
            settled = true;
            return result;
        });
        await new Promise((resolve) => setTimeout(resolve, 30));
        expect(settled).toBe(false); // pas d'enregistrement inactif rendu à pushManager.subscribe

        worker.transition('installed');
        (registration as { active: object | null }).active = worker;
        worker.transition('activating');
        expect(await pending).toBe(registration);
        expect(env.serviceWorker.register).toHaveBeenCalledTimes(1);

        expect((await ensurePushSubscription(USER_A)).status).toBe('subscribed');
        expect(env.pushManager.subscribe).toHaveBeenCalledTimes(1);
    });

    it('installation en échec (worker redondant) : /sw.js est ré-enregistré UNE fois et l’enregistrement actif est rendu', async () => {
        const env = installPushEnvironment('granted', { hasRegistration: false });
        const brokenWorker = new FakeWorker('installing');
        const broken = makeRegistration(brokenWorker, env.pushManager);
        const fresh = makeRegistration(null, env.pushManager, { state: 'activated' });
        env.serviceWorker.register.mockResolvedValueOnce(broken).mockResolvedValueOnce(fresh);

        const pending = getServiceWorkerRegistration();
        await new Promise((resolve) => setTimeout(resolve, 10));
        brokenWorker.transition('redundant'); // ce que le navigateur fait quand cache.addAll échoue à l'installation

        expect(await pending).toBe(fresh);
        expect(env.serviceWorker.register).toHaveBeenCalledTimes(2);
        expect(env.serviceWorker.register).toHaveBeenNthCalledWith(2, '/sw.js');
    });

    it('jamais activé (deux délais écoulés) : null, et ensurePushSubscription dit « Service worker inactif » — pas de faux enregistrement', async () => {
        vi.useFakeTimers();
        try {
            const env = installPushEnvironment('granted', { hasRegistration: false });
            useNominalRpc();
            env.serviceWorker.register.mockImplementation(async () => makeRegistration(new FakeWorker('installing'), env.pushManager));

            const pending = ensurePushSubscription(USER_A);
            await vi.advanceTimersByTimeAsync(8_100);
            await vi.advanceTimersByTimeAsync(8_100);
            const result = await pending;

            expect(result.status).toBe('error');
            expect(result.error).toMatch(/Service worker inactif/);
            expect(env.serviceWorker.register).toHaveBeenCalledTimes(2);
            expect(env.pushManager.subscribe).not.toHaveBeenCalled();
            expect(saveCalls()).toHaveLength(0);
        } finally {
            vi.useRealTimers();
        }
    });
});

/* ────────────────────────────── iOS ────────────────────────────────────── */

describe('needsIosHomeScreenInstall', () => {
    it('iPhone dans un simple onglet : installation requise', () => {
        setUserAgent(IPHONE_UA);
        expect(needsIosHomeScreenInstall()).toBe(true);
    });

    it('iPhone déjà sur l’écran d’accueil (navigator.standalone) : rien à installer', () => {
        setUserAgent(IPHONE_UA);
        Object.defineProperty(window.navigator, 'standalone', { configurable: true, value: true });
        expect(needsIosHomeScreenInstall()).toBe(false);
    });

    it('Android : rien à installer', () => {
        setUserAgent(ANDROID_UA);
        expect(needsIosHomeScreenInstall()).toBe(false);
    });
});

/* ─────────────────────────── usePushNotifications ──────────────────────── */

describe('usePushNotifications', () => {
    it('permission accordée : abonnement silencieux UNE fois par session, remontage compris', async () => {
        installPushEnvironment('granted');
        useNominalRpc();

        const first = renderHook(() => usePushNotifications(USER_A));
        await waitFor(() => expect(saveCalls()).toHaveLength(1));
        await waitFor(() => expect(first.result.current.lastResult?.status).toBe('subscribed'));
        first.unmount();

        const second = renderHook(() => usePushNotifications(USER_A));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(saveCalls()).toHaveLength(1);
        expect(second.result.current.permission).toBe('granted');
    });

    it('permission non demandée : rien n’est demandé ni abonné', async () => {
        const env = installPushEnvironment('default');
        useNominalRpc();
        renderHook(() => usePushNotifications(USER_A));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(env.notification.requestPermission).not.toHaveBeenCalled();
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it('identifiant de démonstration (profil pas encore chargé) : ignoré', async () => {
        installPushEnvironment('granted');
        useNominalRpc();
        renderHook(() => usePushNotifications('u1'));
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(mocks.rpc).not.toHaveBeenCalled();
    });

    it('moknet-push-resubscribed (service worker) : ré-enregistrement forcé même dans les 24 h', async () => {
        const env = installPushEnvironment('granted');
        useNominalRpc();
        renderHook(() => usePushNotifications(USER_A));
        await waitFor(() => expect(saveCalls()).toHaveLength(1));

        env.serviceWorker.emitMessage({ type: 'moknet-push-resubscribed', endpoint: 'https://push.example.org/sub/1' });
        await waitFor(() => expect(saveCalls()).toHaveLength(2));

        env.serviceWorker.emitMessage({ type: 'autre-chose' });
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(saveCalls()).toHaveLength(2);
    });
});

/* ─────────────────────────── PushPermissionPrompt ──────────────────────── */

describe('PushPermissionPrompt', () => {
    const mount = (userId: string | null) => render(React.createElement(PushPermissionPrompt, { userId }));

    it('visible seulement si supporté ET permission « default » ET utilisateur réel', () => {
        const env = installPushEnvironment('default');
        const { unmount } = mount(USER_A);
        expect(screen.getByText(PUSH_PROMPT_TEXT)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Activer' })).toBeInTheDocument();
        unmount();

        expect(mount('u1').container).toBeEmptyDOMElement();
        expect(mount(null).container).toBeEmptyDOMElement();

        env.notification.permission = 'granted';
        expect(mount(USER_A).container).toBeEmptyDOMElement();
        env.notification.permission = 'denied';
        expect(mount(USER_A).container).toBeEmptyDOMElement();

        uninstallPushEnvironment();
        expect(mount(USER_A).container).toBeEmptyDOMElement();
    });

    it('« Plus tard » masque le bandeau 7 jours pour CET utilisateur seulement', () => {
        installPushEnvironment('default');
        const { container, unmount } = mount(USER_A);
        fireEvent.click(screen.getByRole('button', { name: 'Plus tard' }));
        expect(container).toBeEmptyDOMElement();
        const stored = Number(window.localStorage.getItem(`${PUSH_PROMPT_DISMISS_PREFIX}${USER_A}`));
        expect(Math.abs(Date.now() - stored)).toBeLessThan(5000);
        unmount();

        expect(mount(USER_A).container).toBeEmptyDOMElement();
        expect(mount(USER_B).container).not.toBeEmptyDOMElement();
    });

    it('« Activer » refusé par le navigateur : explique comment réactiver, sans faux succès', async () => {
        const env = installPushEnvironment('default');
        env.notification.requestPermission.mockImplementation(async () => {
            env.notification.permission = 'denied';
            return 'denied';
        });
        useNominalRpc();
        mount(USER_A);

        fireEvent.click(screen.getByRole('button', { name: 'Activer' }));

        expect(await screen.findByText('Notifications refusées.')).toBeInTheDocument();
        expect(screen.getByText(/réactiver/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Activer' })).not.toBeInTheDocument();
        expect(screen.queryByText(/activées/)).not.toBeInTheDocument();
        expect(saveCalls()).toHaveLength(0);
    });

    it('« Activer » accordé : abonnement enregistré puis confirmation', async () => {
        installPushEnvironment('default');
        useNominalRpc();
        mount(USER_A);

        fireEvent.click(screen.getByRole('button', { name: 'Activer' }));

        expect(await screen.findByText(/Notifications activées/)).toBeInTheDocument();
        expect(saveCalls()).toHaveLength(1);
    });

    it('« Activer » en échec réel : le message du serveur est affiché, avec « Réessayer »', async () => {
        installPushEnvironment('default');
        useNominalRpc({ save_push_subscription: async () => ({ data: null, error: { message: 'fonction absente' } }) });
        mount(USER_A);

        fireEvent.click(screen.getByRole('button', { name: 'Activer' }));

        expect(await screen.findByText('Activation impossible')).toBeInTheDocument();
        expect(screen.getByText(/fonction absente/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Réessayer' })).toBeInTheDocument();
        expect(screen.queryByText(/activées/)).not.toBeInTheDocument();
    });

    it('iPhone dans un onglet : consigne « Partager → Sur l’écran d’accueil », aucun bouton inerte', () => {
        // Safari iOS n'expose pas PushManager hors écran d'accueil : aucun environnement push installé.
        setUserAgent(IPHONE_UA);
        mount(USER_A);
        expect(screen.getByText(PUSH_PROMPT_TEXT)).toBeInTheDocument();
        expect(screen.getByText(/Partager/)).toBeInTheDocument();
        expect(screen.getByText(/Sur l'écran d'accueil/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Activer' })).not.toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Plus tard' })).toBeInTheDocument();
    });
});
