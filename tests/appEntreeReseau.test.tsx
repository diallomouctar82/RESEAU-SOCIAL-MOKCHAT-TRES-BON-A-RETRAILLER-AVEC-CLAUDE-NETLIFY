/**
 * ENTRÉE DIRECTE SUR RÉSEAU MOKNET (Direction, 05/09/2026) : « dès la
 * première ouverture, connexion ou inscription, entrée directe sur Réseau
 * MokNet, sans rechargement ». L'application réelle (`App`) est montée avec
 * ses fournisseurs ; seuls les écrans et les services réseau sont remplacés
 * par des doublures — ce qui est prouvé ici est la logique d'entrée d'App.tsx.
 */
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const h = vi.hoisted(() => ({
    authCallback: null as null | ((session: unknown, event: string) => void),
    signOut: vi.fn(async () => {}),
    getSession: vi.fn(async () => null),
}));

vi.mock('../services/auth', () => ({
    getSession: () => h.getSession(),
    onAuthStateChange: (cb: (session: unknown, event: string) => void) => {
        h.authCallback = cb;
        return () => { h.authCallback = null; };
    },
    signOut: () => h.signOut(),
}));
vi.mock('../services/profile', () => ({
    fetchUserProfile: async (id: string) => ({ id, name: 'Mamadou Test', role: 'membre', level: 1, credits: 0, xp: 0 }),
}));
vi.mock('../services/push/pushService', () => ({ forgetPushSubscription: async () => {} }));
vi.mock('../services/modules/standaloneMode', () => ({ detectStandaloneModule: () => null }));
vi.mock('../services/supabaseClient', () => {
    const base: Record<string, unknown> = { isConfigured: () => false };
    const service = new Proxy(base, {
        get(target, prop: string) {
            if (prop in target) return target[prop];
            return async () => [];
        },
    });
    return {
        supabaseService: service,
        isSupabaseConfigured: false,
        supabase: { auth: { getSession: async () => ({ data: { session: null } }) } },
    };
});
vi.mock('../components/Layout', () => ({
    Layout: ({ children, activeTab, onLogout, onTabChange }: { children: React.ReactNode; activeTab: string; onLogout: () => void; onTabChange: (t: string) => void }) => (
        <div data-testid="app-layout" data-tab={activeTab}>
            <button type="button" onClick={onLogout}>Se déconnecter</button>
            <button type="button" onClick={() => onTabChange('home')}>Aller au tableau de bord</button>
            {children}
        </div>
    ),
}));
vi.mock('../components/Auth', () => ({ Auth: () => <div data-testid="ecran-connexion">Connexion ou inscription</div> }));
vi.mock('../components/SocialFeed', () => ({ SocialFeed: () => <div data-testid="ecran-reseau-moknet">Réseau MokNet</div> }));
vi.mock('../components/Dashboard', () => ({ Dashboard: () => <div data-testid="ecran-tableau-de-bord">Tableau de bord</div> }));
vi.mock('../components/ChatInterface', () => ({ ChatInterface: () => null }));
vi.mock('../components/LiveSession', () => ({ LiveSession: () => null }));
vi.mock('../components/SocialLive', () => ({ SocialLive: () => null }));
vi.mock('../components/Studio', () => ({ Studio: () => null }));
vi.mock('../components/Campus', () => ({ Campus: () => null }));
vi.mock('../components/Shop', () => ({ Shop: () => null }));
vi.mock('../components/Profile', () => ({ Profile: () => null }));
vi.mock('../components/MyShop', () => ({ MyShop: () => null }));
vi.mock('../components/WorldHub', () => ({ WorldHub: () => null }));
vi.mock('../components/CareerCenter', () => ({ CareerCenter: () => null }));
vi.mock('../components/HealthCenter', () => ({ HealthCenter: () => null }));
vi.mock('../components/HousingCenter', () => ({ HousingCenter: () => null }));
vi.mock('../components/LegalCenter', () => ({ LegalCenter: () => null }));
vi.mock('../components/Wallet', () => ({ Wallet: () => null }));
vi.mock('../components/architecte/ArchitecteDemoPage', () => ({ ArchitecteDemoPage: () => null }));
vi.mock('../components/ResetPassword', () => ({ ResetPassword: () => null }));
vi.mock('../components/LanguageCenter', () => ({ LanguageCenter: () => null }));
vi.mock('../components/CouncilRoom', () => ({ CouncilRoom: () => null }));
vi.mock('../components/ExpertsHub', () => ({ ExpertsHub: () => null }));
vi.mock('../components/GoogleDriveCenter', () => ({ GoogleDriveCenter: () => null }));
vi.mock('../components/GoogleMapsExplorer', () => ({ GoogleMapsExplorer: () => null }));
vi.mock('../components/GoogleChatCenter', () => ({ GoogleChatCenter: () => null }));
vi.mock('../components/GoogleMeetCenter', () => ({ GoogleMeetCenter: () => null }));
vi.mock('../components/AdminDashboard', () => ({ AdminDashboard: () => null }));

import App from '../App';

async function seConnecter() {
    await act(async () => { h.authCallback?.({ user: { id: 'u1' } }, 'SIGNED_IN'); });
    return screen.findByTestId('app-layout');
}

beforeEach(() => {
    h.signOut.mockClear();
    window.history.replaceState(null, '', '/');
});

describe("Entrée directe sur Réseau MokNet (Direction, 05/09/2026)", () => {
    it("première ouverture puis connexion : Réseau MokNet s'affiche directement — pas le tableau de bord", async () => {
        render(<App />);
        expect(await screen.findByTestId('ecran-connexion')).toBeInTheDocument();
        const layout = await seConnecter();
        expect(layout).toHaveAttribute('data-tab', 'social');
        expect(screen.getByTestId('ecran-reseau-moknet')).toBeInTheDocument();
        expect(screen.queryByTestId('ecran-tableau-de-bord')).toBeNull();
    });

    it("déconnexion puis reconnexion : encore Réseau MokNet (avant : le tableau de bord)", async () => {
        render(<App />);
        await screen.findByTestId('ecran-connexion');
        await seConnecter();
        fireEvent.click(screen.getByText('Se déconnecter'));
        expect(await screen.findByTestId('ecran-connexion')).toBeInTheDocument();
        expect(h.signOut).toHaveBeenCalledTimes(1);
        const layout = await seConnecter();
        expect(layout).toHaveAttribute('data-tab', 'social');
        expect(screen.getByTestId('ecran-reseau-moknet')).toBeInTheDocument();
        expect(screen.queryByTestId('ecran-tableau-de-bord')).toBeNull();
    });

    it("un retour d'historique sans état connu ramène sur Réseau MokNet, jamais sur un écran vide ni sur le tableau de bord", async () => {
        render(<App />);
        await screen.findByTestId('ecran-connexion');
        await seConnecter();
        fireEvent.click(screen.getByText('Aller au tableau de bord'));
        expect(screen.getByTestId('app-layout')).toHaveAttribute('data-tab', 'home');
        await act(async () => { window.dispatchEvent(new PopStateEvent('popstate', { state: null })); });
        expect(screen.getByTestId('app-layout')).toHaveAttribute('data-tab', 'social');
        expect(screen.getByTestId('ecran-reseau-moknet')).toBeInTheDocument();
    });

    it("garde-fou : aucun rechargement de page sur le chemin ouverture → connexion/inscription → entrée", () => {
        const racine = resolve(__dirname, '..');
        for (const fichier of ['App.tsx', 'components/Auth.tsx', 'services/auth.ts']) {
            const source = readFileSync(resolve(racine, fichier), 'utf8');
            expect(source, fichier).not.toMatch(/location\.reload\(|location\.assign\(|location\.replace\(|location\.href\s*=/);
        }
    });
});
