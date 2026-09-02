/**
 * ÉQUIPE P (mission VF-1) — notifications push côté client.
 *
 * « La sonnerie doit se déclencher quand le correspondant n'est pas dans
 * l'application » : le signal d'appel temps réel (broadcast Supabase)
 * n'atteint que les onglets ouverts. Ce service abonne l'appareil au
 * service de push de son navigateur (Web Push) et enregistre cet abonnement
 * côté serveur (`save_push_subscription`) ; l'ENVOI est fait par la fonction
 * Edge `push-notify` (déclenchée par le flux d'appel), la RÉCEPTION par
 * `public/sw.js`.
 *
 * ── API ───────────────────────────────────────────────────────────────────
 *   isPushSupported()                     → service worker + PushManager +
 *                                           Notification + contexte sécurisé.
 *   getPushPermissionState()              → 'granted' | 'denied' | 'default'
 *                                           | 'unsupported'.
 *   ensurePushSubscription(userId)        → SILENCIEUX : ne demande jamais la
 *                                           permission. Abonnement existant
 *                                           réutilisé, sinon créé avec la clé
 *                                           publique du serveur ; sauvegardé
 *                                           au plus une fois par 24 h et par
 *                                           endpoint (marqueur localStorage
 *                                           PRÉFIXÉ PAR L'UTILISATEUR — jamais
 *                                           partagé entre deux comptes sur le
 *                                           même appareil).
 *   requestPushPermissionAndSubscribe()   → à appeler dans un GESTE
 *                                           utilisateur (clic « Activer ») :
 *                                           demande la permission, puis
 *                                           `ensurePushSubscription`.
 *   forgetPushSubscription()              → déconnexion : cet appareil ne
 *                                           doit plus sonner pour ce compte.
 *                                           Ne lève JAMAIS, ne bloque jamais.
 *   urlBase64ToUint8Array()               → clé VAPID base64url → octets.
 *
 * Aucun faux succès : chaque échec (clé indisponible, abonnement refusé,
 * enregistrement serveur refusé) est renvoyé avec son message ; l'appelant
 * l'affiche, il ne l'invente pas.
 */

import { isSupabaseConfigured, supabase } from '../supabaseClient';
import { getServiceWorkerRegistration } from '../pwaService';

export type PushPermissionState = 'granted' | 'denied' | 'default' | 'unsupported';

export type PushSubscriptionStatus = 'subscribed' | 'denied' | 'default' | 'unsupported' | 'error';

export interface PushSubscriptionResult {
    status: PushSubscriptionStatus;
    /** Endpoint du service de push (présent uniquement si `subscribed`). */
    endpoint?: string;
    /** Message d'échec lisible (présent uniquement si `error`). */
    error?: string;
}

/** Préfixe du marqueur « abonnement déjà enregistré » — suffixé par l'id utilisateur. */
export const PUSH_SAVE_MARKER_PREFIX = 'lmav_push_saved_v1:';

/** Un même endpoint n'est ré-enregistré côté serveur qu'après ce délai. */
export const PUSH_SAVE_TTL_MS = 24 * 60 * 60 * 1000;

interface SaveMarker {
    endpoint: string;
    savedAt: number;
}

/* ───────────────────────────── Capacités ───────────────────────────────── */

export const isPushSupported = (): boolean => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    if (!('serviceWorker' in navigator)) return false;
    if (!('PushManager' in window)) return false;
    if (!('Notification' in window)) return false;
    // Web Push exige un contexte sécurisé (https, ou localhost). Les moteurs
    // qui n'exposent pas `isSecureContext` sont laissés passer : le service
    // worker refuserait de toute façon l'enregistrement en http.
    if (typeof window.isSecureContext === 'boolean' && !window.isSecureContext) return false;
    return true;
};

export const getPushPermissionState = (): PushPermissionState => {
    if (!isPushSupported()) return 'unsupported';
    const permission = window.Notification.permission;
    return permission === 'granted' || permission === 'denied' ? permission : 'default';
};

const isIosDevice = (): boolean => {
    if (typeof navigator === 'undefined') return false;
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent || '')) return true;
    // iPadOS 13+ se présente comme un Mac de bureau : on le reconnaît à l'écran tactile.
    return navigator.platform === 'MacIntel' && (navigator.maxTouchPoints ?? 0) > 1;
};

export const isStandaloneDisplayMode = (): boolean => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
    if ((navigator as Navigator & { standalone?: boolean }).standalone === true) return true;
    try {
        return typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches;
    } catch {
        // matchMedia absent ou requête refusée : on ne peut rien affirmer de plus.
        return false;
    }
};

/**
 * iOS / iPadOS : le push Web n'existe qu'une fois l'application ajoutée à
 * l'écran d'accueil (Safari 16.4+). Dans un simple onglet, `PushManager`
 * n'est même pas exposé — proposer un bouton « Activer » y serait un
 * mensonge ; l'interface affiche la consigne d'installation à la place.
 */
export const needsIosHomeScreenInstall = (): boolean => isIosDevice() && !isStandaloneDisplayMode();

/* ─────────────────────────── Conversions de clés ───────────────────────── */

/** Clé VAPID (base64url, 65 octets attendus) → octets pour `applicationServerKey`. */
export const urlBase64ToUint8Array = (base64Url: string): Uint8Array => {
    const trimmed = base64Url.trim();
    const padding = '='.repeat((4 - (trimmed.length % 4)) % 4);
    const base64 = (trimmed + padding).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
    return bytes;
};

/** Octets → base64url sans remplissage (format attendu par `push-notify`). */
export const arrayBufferToBase64Url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

/* ─────────────────────── Marqueur « déjà enregistré » ──────────────────── */

const markerKey = (userId: string): string => `${PUSH_SAVE_MARKER_PREFIX}${userId}`;

const readSaveMarker = (userId: string): SaveMarker | null => {
    try {
        const raw = localStorage.getItem(markerKey(userId));
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<SaveMarker> | null;
        if (parsed && typeof parsed.endpoint === 'string' && typeof parsed.savedAt === 'number') {
            return { endpoint: parsed.endpoint, savedAt: parsed.savedAt };
        }
        return null;
    } catch {
        // Stockage indisponible ou valeur corrompue : on ré-enregistre, sans conséquence.
        return null;
    }
};

const writeSaveMarker = (userId: string, endpoint: string): void => {
    try {
        localStorage.setItem(markerKey(userId), JSON.stringify({ endpoint, savedAt: Date.now() } satisfies SaveMarker));
    } catch (err) {
        // L'abonnement EST enregistré côté serveur ; seul le rappel local
        // manque — la prochaine session le ré-enregistrera (idempotent).
        console.info('Marqueur push non mémorisé :', err instanceof Error ? err.message : err);
    }
};

const isRecentlySaved = (userId: string, endpoint: string): boolean => {
    const marker = readSaveMarker(userId);
    if (!marker || marker.endpoint !== endpoint) return false;
    const age = Date.now() - marker.savedAt;
    return age >= 0 && age < PUSH_SAVE_TTL_MS;
};

const clearSaveMarkers = (): void => {
    try {
        const doomed: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(PUSH_SAVE_MARKER_PREFIX)) doomed.push(key);
        }
        doomed.forEach((key) => localStorage.removeItem(key));
    } catch {
        // Stockage indisponible : rien à effacer.
    }
};

/* ──────────────────────────── Côté serveur ─────────────────────────────── */

/**
 * Clé publique VAPID : d'abord la RPC (lecture pure), puis la fonction Edge
 * `public_key` — qui génère la paire au premier appel de l'histoire du
 * projet (la RPC renvoie `null` tant qu'elle n'existe pas).
 */
const fetchPushPublicKey = async (): Promise<string> => {
    const { data, error } = await supabase.rpc('get_push_public_key');
    if (!error && typeof data === 'string' && data.trim()) return data.trim();

    const { data: fnData, error: fnError } = await supabase.functions.invoke('push-notify', {
        body: { action: 'public_key' },
    });
    if (fnError) {
        throw new Error(`Clé publique push indisponible : ${fnError.message || 'erreur réseau'}`);
    }
    const key = (fnData as { publicKey?: unknown } | null)?.publicKey;
    if (typeof key !== 'string' || !key.trim()) {
        throw new Error('Clé publique push absente de la réponse du serveur.');
    }
    return key.trim();
};

const subscriptionKeys = (subscription: PushSubscription): { p256dh: string; auth: string } | null => {
    try {
        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');
        if (p256dh && auth) {
            return { p256dh: arrayBufferToBase64Url(p256dh), auth: arrayBufferToBase64Url(auth) };
        }
    } catch {
        // `getKey` absent sur certains moteurs : repli sur la forme JSON ci-dessous.
    }
    const json = typeof subscription.toJSON === 'function' ? subscription.toJSON() : null;
    const keys = json?.keys;
    if (keys && typeof keys.p256dh === 'string' && typeof keys.auth === 'string') {
        return { p256dh: keys.p256dh, auth: keys.auth };
    }
    return null;
};

const saveSubscriptionOnServer = async (subscription: PushSubscription): Promise<void> => {
    const keys = subscriptionKeys(subscription);
    if (!keys) throw new Error("Clés de l'abonnement push illisibles.");
    const { error } = await supabase.rpc('save_push_subscription', {
        p_endpoint: subscription.endpoint,
        p_p256dh: keys.p256dh,
        p_auth: keys.auth,
        p_user_agent: typeof navigator !== 'undefined' ? String(navigator.userAgent || '').slice(0, 300) : '',
    });
    if (error) throw new Error(`Enregistrement de l'abonnement push refusé : ${error.message}`);
};

/* ──────────────────────────── Abonnement ───────────────────────────────── */

/**
 * Abonnement silencieux — jamais de demande de permission ici (elle
 * n'est légitime que dans un geste utilisateur : voir
 * `requestPushPermissionAndSubscribe`).
 *
 * `force` : ré-enregistre même si le marqueur 24 h est encore valide (utilisé
 * après un `pushsubscriptionchange` du service worker, qui a changé
 * l'endpoint sans pouvoir le sauvegarder lui-même — il n'a pas de session).
 */
export const ensurePushSubscription = async (
    userId: string,
    options: { force?: boolean } = {},
): Promise<PushSubscriptionResult> => {
    if (!isPushSupported()) return { status: 'unsupported' };
    const permission = getPushPermissionState();
    if (permission === 'denied') return { status: 'denied' };
    if (permission === 'default') return { status: 'default' };
    if (!userId) return { status: 'error', error: 'Utilisateur inconnu : abonnement push non enregistré.' };
    if (!isSupabaseConfigured) {
        return { status: 'error', error: "Supabase non configuré : impossible d'enregistrer l'abonnement push." };
    }

    const registration = await getServiceWorkerRegistration();
    if (!registration) {
        return { status: 'error', error: 'Service worker indisponible : notifications push impossibles sur cet appareil.' };
    }

    try {
        let subscription = await registration.pushManager.getSubscription();
        if (!subscription) {
            const publicKey = await fetchPushPublicKey();
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(publicKey),
            });
        }
        if (options.force || !isRecentlySaved(userId, subscription.endpoint)) {
            await saveSubscriptionOnServer(subscription);
            writeSaveMarker(userId, subscription.endpoint);
        }
        return { status: 'subscribed', endpoint: subscription.endpoint };
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        console.warn('Abonnement push impossible :', message);
        return { status: 'error', error: message };
    }
};

const requestNotificationPermission = async (): Promise<PushPermissionState> => {
    try {
        const result = await new Promise<NotificationPermission>((resolve) => {
            // Safari < 16 n'a que l'ancienne signature à rappel ; les autres
            // moteurs renvoient une promesse (et honorent aussi le rappel —
            // résoudre deux fois la même valeur est sans effet).
            const maybePromise = window.Notification.requestPermission((legacy) => resolve(legacy));
            if (maybePromise && typeof (maybePromise as Promise<NotificationPermission>).then === 'function') {
                (maybePromise as Promise<NotificationPermission>).then(resolve);
            }
        });
        return result === 'granted' || result === 'denied' ? result : 'default';
    } catch (err) {
        console.warn('Demande de permission de notification refusée par le navigateur :', err);
        return getPushPermissionState();
    }
};

/** À appeler dans un geste utilisateur (clic) : les navigateurs ignorent une demande de permission spontanée. */
export const requestPushPermissionAndSubscribe = async (userId: string): Promise<PushSubscriptionResult> => {
    if (!isPushSupported()) return { status: 'unsupported' };
    let permission = getPushPermissionState();
    if (permission === 'default') permission = await requestNotificationPermission();
    if (permission === 'denied') return { status: 'denied' };
    if (permission === 'default') return { status: 'default' };
    return ensurePushSubscription(userId);
};

/* ────────────────────── AU-9 : état RÉEL de cet appareil ───────────────── */

/**
 * AU-9 — « le téléphone ne sonne jamais hors de l'application ».
 *
 * Mesuré avant d'écrire ce code : la table `push_subscriptions` était VIDE,
 * donc aucun appareil n'avait jamais pu être joint hors de l'application. Le
 * bandeau d'invitation existait, mais il est effaçable pour sept jours et,
 * sur iPhone dans un onglet, il ne propose aucun bouton (le push Web n'y
 * existe pas). Il manquait un endroit PERMANENT où lire l'état réel et agir.
 *
 * Cet état croise trois sources, jamais une intention :
 *  - ce que le navigateur permet (`isPushSupported`, `needsIosHomeScreenInstall`) ;
 *  - la permission réellement accordée (`Notification.permission`) ;
 *  - l'abonnement RÉELLEMENT enregistré côté serveur pour CET appareil
 *    (ligne `push_subscriptions` correspondant à l'endpoint courant).
 *
 * `granted_not_registered` est le cas important : la permission est accordée
 * mais le serveur n'a aucune adresse pour joindre l'appareil — il ne sonnera
 * jamais. Sans cette vérification, l'interface aurait annoncé « activées »
 * en se fiant à la seule permission du navigateur.
 */
export type PushDeviceState =
    | 'unsupported'
    | 'needs_ios_install'
    | 'denied'
    | 'default'
    | 'granted_not_registered'
    | 'active';

export interface PushDeviceStatus {
    state: PushDeviceState;
    /** Endpoint du service de push de cet appareil, quand il en a un. */
    endpoint: string | null;
    /** Date du dernier enregistrement serveur (ISO), quand la ligne existe. */
    registeredAt: string | null;
    /** Nombre d'appareils enregistrés pour ce compte (null si la lecture a échoué). */
    deviceCount: number | null;
    /** Message d'échec réel de la vérification, jamais inventé. */
    error?: string;
}

export const getPushDeviceStatus = async (userId: string): Promise<PushDeviceStatus> => {
    const empty = { endpoint: null, registeredAt: null, deviceCount: null } as const;
    if (needsIosHomeScreenInstall()) return { state: 'needs_ios_install', ...empty };
    if (!isPushSupported()) return { state: 'unsupported', ...empty };
    const permission = getPushPermissionState();
    if (permission === 'denied') return { state: 'denied', ...empty };
    if (permission === 'default') return { state: 'default', ...empty };
    if (!userId || !isSupabaseConfigured) {
        return { state: 'granted_not_registered', ...empty, error: 'Session absente : impossible de vérifier l’enregistrement.' };
    }

    let endpoint: string | null = null;
    try {
        const registration = await getServiceWorkerRegistration();
        endpoint = (await registration?.pushManager.getSubscription())?.endpoint ?? null;
    } catch (err) {
        return { state: 'granted_not_registered', ...empty, error: err instanceof Error ? err.message : String(err) };
    }

    // La RLS de `push_subscriptions` ne laisse lire que ses propres lignes :
    // ce compte, cet appareil — jamais l'appareil de quelqu'un d'autre.
    const { data, error } = await supabase
        .from('push_subscriptions')
        .select('endpoint, updated_at')
        .order('updated_at', { ascending: false });
    if (error) {
        return { state: endpoint ? 'granted_not_registered' : 'granted_not_registered', endpoint, registeredAt: null, deviceCount: null, error: error.message };
    }
    const rows = (data ?? []) as Array<{ endpoint: string; updated_at: string | null }>;
    const mine = endpoint ? rows.find((row) => row.endpoint === endpoint) : undefined;
    return {
        state: mine ? 'active' : 'granted_not_registered',
        endpoint,
        registeredAt: mine?.updated_at ?? null,
        deviceCount: rows.length,
    };
};

/** Phrase honnête pour chaque état — jamais « activé » quand le serveur n'a aucune adresse. */
export const describePushDeviceState = (state: PushDeviceState): string => {
    switch (state) {
        case 'active': return 'Cet appareil sonnera même hors de l’application.';
        case 'granted_not_registered': return 'Autorisation accordée, mais cet appareil n’est pas encore enregistré auprès du serveur : il ne sonnera pas hors de l’application.';
        case 'default': return 'Non activé : cet appareil ne sonnera pas quand vous êtes hors de l’application.';
        case 'denied': return 'Notifications refusées pour ce site : cet appareil ne peut pas sonner hors de l’application.';
        case 'needs_ios_install': return 'Sur iPhone et iPad, la sonnerie hors application n’existe qu’une fois MokNet ajouté à l’écran d’accueil.';
        case 'unsupported': return 'Ce navigateur ne permet pas la sonnerie hors application.';
    }
};

/**
 * Déconnexion : désabonnement navigateur + suppression de la ligne serveur
 * (par endpoint ; la RLS ne laisse supprimer que ses propres lignes). La
 * suppression serveur n'aboutit que si une session existe encore au moment
 * de l'appel — sinon la ligne est purgée par `push-notify` à la première
 * remise refusée (410 Gone après le désabonnement navigateur). Dans tous les
 * cas, cet appareil ne sonne plus pour ce compte. Ne lève jamais.
 */
export const forgetPushSubscription = async (): Promise<void> => {
    try {
        clearSaveMarkers();
        if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
        const registration = await navigator.serviceWorker.getRegistration('/');
        const subscription = registration ? await registration.pushManager?.getSubscription() : null;
        if (!subscription) return;

        if (isSupabaseConfigured) {
            const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', subscription.endpoint);
            if (error) console.warn("Suppression de l'abonnement push côté serveur impossible :", error.message);
        }
        const unsubscribed = await subscription.unsubscribe();
        if (!unsubscribed) console.warn('Le navigateur a refusé le désabonnement push.');
    } catch (err) {
        console.warn('forgetPushSubscription :', err instanceof Error ? err.message : err);
    }
};
