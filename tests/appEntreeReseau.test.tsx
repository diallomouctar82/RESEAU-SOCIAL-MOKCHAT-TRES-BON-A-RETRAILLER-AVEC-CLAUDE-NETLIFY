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
    getSession: vi.fn(async (): Promise<unknown> => null),
    // Verrou d'entrée (DEC-2026-079) : verdict du serveur sur une session relue
    // depuis le stockage local — 'valide' | 'non-verifiee' | 'invalide'.
    verifierSession: vi.fn(async (session: { user?: { id?: string } }): Promise<unknown> => ({ statut: 'valide', session })),
    fetchUserProfile: vi.fn(async (id: string): Promise<unknown> => ({ id, name: 'Mamadou Test', role: 'membre', level: 1, credits: 0, xp: 0 })),
}));

vi.mock('../services/auth', () => ({
    getSession: () => h.getSession(),
    onAuthStateChange: (cb: (session: unknown, event: string) => void) => {
        h.authCallback = cb;
        return () => { h.authCallback = null; };
    },
    signOut: () => h.signOut(),
    verifierSession: (session: { user?: { id?: string } }) => h.verifierSession(session),
}));
vi.mock('../services/profile', () => ({
    fetchUserProfile: (id: string) => h.fetchUserProfile(id),
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

/** Session telle que supabase-js la relit depuis le stockage de l'appareil. */
const sessionStockee = (id = 'u-stockee', access_token = 'jeton-stocke') => ({ access_token, user: { id } });

beforeEach(() => {
    h.signOut.mockClear();
    h.getSession.mockReset();
    h.getSession.mockResolvedValue(null);
    h.verifierSession.mockReset();
    h.verifierSession.mockImplementation(async (session) => ({ statut: 'valide', session }));
    h.fetchUserProfile.mockReset();
    h.fetchUserProfile.mockImplementation(async (id: string) => ({ id, name: 'Mamadou Test', role: 'membre', level: 1, credits: 0, xp: 0 }));
    window.history.replaceState(null, '', '/');
});

/** Promesse pilotée à la main (pour rejouer un événement PENDANT un `await`). */
function differee<T>() {
    let resoudre!: (v: T) => void;
    const promesse = new Promise<T>((r) => { resoudre = r; });
    return { promesse, resoudre };
}

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

describe("Verrou d'entrée — accès public réservé aux sessions valides (Direction, 05/09/2026, DEC-2026-079)", () => {
    it("aucune session sur l'appareil : écran de connexion, aucune page interne, aucune vérification inutile", async () => {
        render(<App />);
        expect(await screen.findByTestId('ecran-connexion')).toBeInTheDocument();
        expect(screen.queryByTestId('app-layout')).toBeNull();
        expect(h.verifierSession).not.toHaveBeenCalled();
    });

    it("session locale REFUSÉE par le serveur (jeton périmé, révoqué, forgé, compte supprimé) : écran de connexion, jamais l'interface — avant : l'interface s'ouvrait", async () => {
        h.getSession.mockResolvedValue(sessionStockee());
        h.verifierSession.mockResolvedValue({ statut: 'invalide', raison: 'refus du serveur (401)' });
        render(<App />);
        expect(await screen.findByTestId('ecran-connexion')).toBeInTheDocument();
        expect(screen.queryByTestId('app-layout')).toBeNull();
        expect(screen.queryByTestId('ecran-reseau-moknet')).toBeNull();
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("session locale VALIDE (vérifiée par le serveur) : entrée directe sur Réseau MokNet, comme avant", async () => {
        h.getSession.mockResolvedValue(sessionStockee());
        render(<App />);
        const layout = await screen.findByTestId('app-layout');
        expect(layout).toHaveAttribute('data-tab', 'social');
        expect(screen.getByTestId('ecran-reseau-moknet')).toBeInTheDocument();
        expect(screen.queryByTestId('ecran-connexion')).toBeNull();
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("l'événement INITIAL_SESSION (même jeton rejoué par supabase-js) partage le verdict : une seule vérification, et un refus ferme aussi cette porte", async () => {
        const session = sessionStockee();
        h.getSession.mockResolvedValue(session);
        h.verifierSession.mockResolvedValue({ statut: 'invalide', raison: 'refus du serveur (401)' });
        render(<App />);
        await screen.findByTestId('ecran-connexion');
        await act(async () => { h.authCallback?.(session, 'INITIAL_SESSION'); });
        expect(screen.queryByTestId('app-layout')).toBeNull();
        expect(screen.getByTestId('ecran-connexion')).toBeInTheDocument();
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("INITIAL_SESSION avec un jeton refusé alors que getSession() n'avait rien vu : écran de connexion", async () => {
        h.verifierSession.mockResolvedValue({ statut: 'invalide', raison: 'refus du serveur (403)' });
        render(<App />);
        await screen.findByTestId('ecran-connexion');
        await act(async () => { h.authCallback?.(sessionStockee('u-autre', 'jeton-autre'), 'INITIAL_SESSION'); });
        expect(screen.queryByTestId('app-layout')).toBeNull();
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("connexion depuis l'écran (SIGNED_IN) : le jeton de la connexion est vérifié UNE fois, puis Réseau MokNet", async () => {
        render(<App />);
        await screen.findByTestId('ecran-connexion');
        const layout = await seConnecter();
        expect(layout).toHaveAttribute('data-tab', 'social');
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("SIGNED_IN portant un jeton que le serveur refuse (rejeu depuis un autre onglet, jeton forgé) : écran de connexion, jamais l'interface", async () => {
        h.verifierSession.mockResolvedValue({ statut: 'invalide', raison: 'refus du serveur (401)' });
        render(<App />);
        await screen.findByTestId('ecran-connexion');
        await act(async () => { h.authCallback?.(sessionStockee('u-forge', 'jeton-forge'), 'SIGNED_IN'); });
        expect(screen.queryByTestId('app-layout')).toBeNull();
        expect(screen.getByTestId('ecran-connexion')).toBeInTheDocument();
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("SIGNED_IN rejoué par supabase-js avec le jeton déjà refusé (retour sur l'onglet, BroadcastChannel) : le refus tient, aucune seconde vérification", async () => {
        const session = sessionStockee();
        h.getSession.mockResolvedValue(session);
        h.verifierSession.mockResolvedValue({ statut: 'invalide', raison: 'refus du serveur (401)' });
        render(<App />);
        await screen.findByTestId('ecran-connexion');
        await act(async () => { h.authCallback?.(session, 'SIGNED_IN'); });
        await act(async () => { h.authCallback?.(session, 'SIGNED_IN'); });
        expect(screen.queryByTestId('app-layout')).toBeNull();
        expect(screen.getByTestId('ecran-connexion')).toBeInTheDocument();
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("SIGNED_IN rejoué PENDANT la vérification initiale (course à l'initialisation) : le verdict tombe, l'interface ne s'ouvre jamais", async () => {
        const session = sessionStockee();
        const verdict = differee<unknown>();
        h.getSession.mockResolvedValue(session);
        h.verifierSession.mockReturnValue(verdict.promesse);
        render(<App />);
        await act(async () => { h.authCallback?.(session, 'SIGNED_IN'); });
        expect(screen.queryByTestId('app-layout')).toBeNull();
        await act(async () => { verdict.resoudre({ statut: 'invalide', raison: 'refus du serveur (401)' }); });
        expect(await screen.findByTestId('ecran-connexion')).toBeInTheDocument();
        expect(screen.queryByTestId('app-layout')).toBeNull();
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
    });

    it("déconnexion PENDANT le chargement du profil d'une session vérifiée : l'interface ne s'ouvre pas après coup", async () => {
        const session = sessionStockee();
        const profil = differee<unknown>();
        h.getSession.mockResolvedValue(session);
        h.fetchUserProfile.mockReturnValue(profil.promesse);
        render(<App />);
        await act(async () => {});
        expect(h.verifierSession).toHaveBeenCalledTimes(1);
        await act(async () => { h.authCallback?.(null, 'SIGNED_OUT'); });
        expect(screen.queryByTestId('app-layout')).toBeNull();
        // Le profil arrive APRÈS la déconnexion : il ne doit plus rien ouvrir.
        await act(async () => { profil.resoudre({ id: 'u-stockee', name: 'Mamadou Test', role: 'membre', level: 1, credits: 0, xp: 0 }); });
        expect(await screen.findByTestId('ecran-connexion')).toBeInTheDocument();
        expect(screen.queryByTestId('app-layout')).toBeNull();
    });

    it("serveur injoignable au démarrage (session locale non expirée, non vérifiée) : tolérance DITE — l'entrée reste possible", async () => {
        const session = sessionStockee();
        h.getSession.mockResolvedValue(session);
        h.verifierSession.mockResolvedValue({ statut: 'non-verifiee', session, raison: 'Failed to fetch' });
        render(<App />);
        expect(await screen.findByTestId('app-layout')).toHaveAttribute('data-tab', 'social');
    });

    it("déconnexion après une session vérifiée : écran de connexion, puis reconnexion sur Réseau MokNet", async () => {
        h.getSession.mockResolvedValue(sessionStockee());
        render(<App />);
        await screen.findByTestId('app-layout');
        fireEvent.click(screen.getByText('Se déconnecter'));
        expect(await screen.findByTestId('ecran-connexion')).toBeInTheDocument();
        await act(async () => { h.authCallback?.(null, 'SIGNED_OUT'); });
        expect(screen.queryByTestId('app-layout')).toBeNull();
        const layout = await seConnecter();
        expect(layout).toHaveAttribute('data-tab', 'social');
    });
});
