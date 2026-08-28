// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({
    signInWithOAuth: vi.fn(),
    exchangeCodeForSession: vi.fn(),
    getSession: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn(),
}));

vi.mock('../services/supabaseClient', () => ({
    isSupabaseConfigured: true,
    getSupabaseClient: () => ({ auth }),
}));

import {
    completeOAuthCallback,
    consumeOAuthCallbackError,
    hasOAuthCallbackCode,
    signInWithGoogle,
} from '../services/auth';

describe('OAuth Google PKCE', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.history.replaceState({}, '', '/');
        auth.signInWithOAuth.mockResolvedValue({ data: {}, error: null });
    });

    it('demande uniquement l’identité Google et revient sur l’origine autorisée', async () => {
        await signInWithGoogle();

        expect(auth.signInWithOAuth).toHaveBeenCalledWith({
            provider: 'google',
            options: { redirectTo: `${window.location.origin}/` },
        });
    });

    it('échange le callback PKCE une seule fois puis retire le code de l’URL', async () => {
        const session = { access_token: 'access-token', user: { id: crypto.randomUUID() } };
        auth.exchangeCodeForSession.mockResolvedValue({ data: { session }, error: null });
        window.history.replaceState({}, '', '/?code=valid-code&next=%2Fprofile');

        expect(hasOAuthCallbackCode()).toBe(true);
        const [first, second] = await Promise.all([completeOAuthCallback(), completeOAuthCallback()]);

        expect(first).toBe(session);
        expect(second).toBe(session);
        expect(auth.exchangeCodeForSession).toHaveBeenCalledTimes(1);
        expect(auth.exchangeCodeForSession).toHaveBeenCalledWith('valid-code');
        expect(window.location.search).toBe('?next=%2Fprofile');
        expect(hasOAuthCallbackCode()).toBe(false);
    });

    it('nettoie un callback refusé et produit un message relançable', () => {
        window.history.replaceState({}, '', '/?error=access_denied&error_description=Consentement%20refusé');

        expect(consumeOAuthCallbackError()).toEqual({
            code: 'access_denied',
            message: 'Consentement refusé',
            retryable: true,
        });
        expect(window.location.search).toBe('');
        expect(consumeOAuthCallbackError()).toBeNull();
    });
});
