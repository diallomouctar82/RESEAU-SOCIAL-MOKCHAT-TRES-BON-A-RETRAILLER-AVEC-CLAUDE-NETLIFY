import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

const OAUTH_ERROR_KEYS = ['error', 'error_code', 'error_description'] as const;

export interface OAuthCallbackError {
    code: string;
    message: string;
    retryable: boolean;
}

/** Reads, then removes, OAuth errors so a refreshed callback is idempotent. */
export const consumeOAuthCallbackError = (): OAuthCallbackError | null => {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    const hash = new URLSearchParams(url.hash.replace(/^#/, ''));
    const read = (key: typeof OAUTH_ERROR_KEYS[number]) => url.searchParams.get(key) || hash.get(key);
    const code = read('error_code') || read('error');
    const description = read('error_description');
    if (!code && !description) return null;

    OAUTH_ERROR_KEYS.forEach((key) => {
        url.searchParams.delete(key);
        hash.delete(key);
    });
    url.hash = hash.toString() ? `#${hash.toString()}` : '';
    window.history.replaceState(window.history.state, document.title, `${url.pathname}${url.search}${url.hash}`);

    const normalized = `${code || ''} ${description || ''}`.toLowerCase();
    const stateExpired = normalized.includes('state') && (
        normalized.includes('missing') || normalized.includes('expired') || normalized.includes('not found')
    );
    return {
        code: code || 'oauth_callback_error',
        message: stateExpired
            ? 'La demande de connexion a expiré ou a déjà été utilisée. Relancez la connexion Google depuis cette page.'
            : (description || 'Google n’a pas pu terminer la connexion. Réessayez.'),
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
