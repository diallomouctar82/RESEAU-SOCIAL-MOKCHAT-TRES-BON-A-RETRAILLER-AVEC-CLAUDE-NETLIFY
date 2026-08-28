// @vitest-environment jsdom
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
    listener: undefined as undefined | ((event: string, session: unknown) => void),
    fetchUserProfile: vi.fn(),
}));

vi.mock('../services/auth', () => ({
    hasOAuthCallbackCode: () => false,
    completeOAuthCallback: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: (listener: (event: string, session: unknown) => void) => {
        state.listener = listener;
        return () => undefined;
    },
}));

vi.mock('../services/profile', () => ({
    fetchUserProfile: state.fetchUserProfile,
    updateOwnProfile: vi.fn(),
}));

vi.mock('../services/supabaseClient', () => ({ isSupabaseConfigured: true }));

import { GlobalProvider, useGlobal } from '../contexts/GlobalContext';

const Probe = () => {
    const { isAuthenticated, isAuthChecking, userProfile, authError } = useGlobal();
    return <output>{JSON.stringify({ isAuthenticated, isAuthChecking, name: userProfile.name, authError })}</output>;
};

describe('session et profil', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        state.listener = undefined;
    });

    it('hydrate une seule fois le profil du UUID authentifié malgré un événement répété', async () => {
        const userId = crypto.randomUUID();
        const session = { access_token: 'session-token', user: { id: userId } };
        state.fetchUserProfile.mockResolvedValue({
            id: userId,
            email: 'utilisateur@example.com',
            name: 'Utilisateur vérifié',
            role: 'user',
            accountStatus: 'active',
            citizenshipId: '',
            level: 1,
            xp: 0,
            nextLevelXp: 500,
            credits: 0,
            avatarUrl: '',
            preferredLanguage: 'fr',
            twoFactorEnabled: false,
            skills: [],
            badges: [],
            interests: [],
        });

        render(<GlobalProvider><Probe /></GlobalProvider>);
        expect(state.listener).toBeTypeOf('function');
        state.listener?.('SIGNED_IN', session);
        state.listener?.('TOKEN_REFRESHED', session);

        await waitFor(() => expect(screen.getByText(/Utilisateur vérifié/)).toBeTruthy());
        expect(screen.getByText(/"isAuthenticated":true/)).toBeTruthy();
        expect(state.fetchUserProfile).toHaveBeenCalledTimes(1);
        expect(state.fetchUserProfile).toHaveBeenCalledWith(userId);
    });
});
