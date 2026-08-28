import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const OAUTH_ERROR_KEYS = ['error', 'error_code', 'error_description'] as const;
const OAUTH_CALLBACK_KEYS = ['code', 'sb_flow_id', ...OAUTH_ERROR_KEYS] as const;

let callbackExchange: Promise<Session | null> | null = null;
let callbackCode: string | null = null;

export interface OAuthCallbackError {
    code: string;
    message: string;
    retryable: boolean;
}

const replaceOAuthCallbackUrl = (url: URL): void => {
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    OAUTH_CALLBACK_KEYS.forEach((key) => {
        url.searchParams.delete(key);
        hash.delete(key);
    });
    url.hash = hash.toString() ? `#${hash.toString()}` : '';
    window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`);
};

const oauthErrorMessage = (code?: string | null, description?: string | null): string => {
    const normalized = `${code || ''} ${description || ''}`.toLowerCase();
    const stateExpired = normalized.includes('state') && (
        normalized.includes('missing') || normalized.includes('expired') || normalized.includes('not found')
    );
    return stateExpired
        ? 'La demande de connexion a expiré ou a déjà été utilisée. Relancez la connexion Google depuis cette page.'
        : (description || 'Google n’a pas pu terminer la connexion. Réessayez.');
};

export const hasOAuthCallbackCode = (): boolean => {
    if (typeof window === 'undefined') return false;
    return Boolean(new URL(window.location.href).searchParams.get('code'));
};

/**
 * Échange explicitement et une seule fois le code PKCE reçu de Supabase.
 * Le nettoyage de l'URL après succès empêche tout rejeu au rafraîchissement.
 */
export const completeOAuthCallback = async (): Promise<Session | null> => {
    if (!isSupabaseConfigured || typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');
    if (!code) return null;

    if (callbackExchange && callbackCode === code) return callbackExchange;
    callbackCode = code;
    callbackExchange = (async () => {
        const { data, error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
        if (error) throw error;
        replaceOAuthCallbackUrl(url);
        return data.session;
    })().catch((error) => {
        callbackExchange = null;
        callbackCode = null;
        replaceOAuthCallbackUrl(url);
        throw error;
    });
    return callbackExchange;
};

/** Reads, then removes, OAuth errors so a refreshed callback is idempotent. */
export const consumeOAuthCallbackError = (): OAuthCallbackError | null => {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    const read = (key: typeof OAUTH_ERROR_KEYS[number]) => url.searchParams.get(key) || hash.get(key);
    const code = read('error_code') || read('error');
    const description = read('error_description');
    if (!code && !description) return null;

    replaceOAuthCallbackUrl(url);
    return {
        code: code || 'oauth_callback_error',
        message: oauthErrorMessage(code, description),
        retryable: true,
    };
};

/**
 * Connexion d'identité minimale. Les scopes Google Workspace sont demandés
 * séparément et ne sont jamais ajoutés silencieusement à ce consentement.
 */
export const signInWithGoogle = async (): Promise<void> => {
    if (!isSupabaseConfigured) {
        throw new Error('Connexion indisponible : la configuration Supabase publique est absente.');
    }
    const redirectUrl = new URL('/', window.location.origin);
    const { error } = await getSupabaseClient().auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: redirectUrl.toString(),
        },
    });
    if (error) throw error;
};

export const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured) return;
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw error;
};

export const getSession = async (): Promise<Session | null> => {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await getSupabaseClient().auth.getSession();
    if (error) {
        console.error('Erreur récupération session Supabase:', error);
        return null;
    }
    return data.session;
};

export const onAuthStateChange = (
    callback: (event: AuthChangeEvent, session: Session | null) => void,
): (() => void) => {
    if (!isSupabaseConfigured) {
        queueMicrotask(() => callback('INITIAL_SESSION', null));
        return () => {};
    }
    const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
        callback(event, session);
    });
    return () => data.subscription.unsubscribe();
};

export type { Session, User };
