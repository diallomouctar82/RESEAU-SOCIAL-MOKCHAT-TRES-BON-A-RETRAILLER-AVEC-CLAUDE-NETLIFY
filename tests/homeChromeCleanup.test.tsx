import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Nettoyage de l'accueil (DEC-2026-051) — ce que la Direction a demandé :
 * retirer de l'AFFICHAGE, à l'accueil, cinq éléments qui chargeaient
 * l'en-tête et la barre latérale, SANS supprimer les fonctions qu'ils
 * ouvraient.
 *
 * Deux familles d'assertions, volontairement :
 *  1. les éléments retirés n'existent plus dans le DOM de l'en-tête, de la
 *     barre latérale et du tableau de bord — jsdom ne connaît pas les
 *     classes responsives (`hidden 2xl:flex`), donc tout ce qui est rendu
 *     est cherché, quelle que soit la taille d'écran ;
 *  2. les fonctions restent atteignables par un autre chemin réel : les
 *     centres Google dans la navigation, le hub transversal depuis le
 *     tiroir mobile, Finance & Wallet dans la navigation, la trajectoire
 *     Point A → Point B toujours rendue sans sa carte de conseiller.
 *
 * Ce que ce test ne prouve PAS : l'aspect. Le jugement visuel appartient à
 * la Direction, sur les captures avant/après et l'aperçu de déploiement.
 */

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
vi.mock('../services/cloud', () => ({
    cloudService: { getAllPosts: async () => [], savePost: async () => {}, replaceAllPosts: async () => {} },
}));
vi.mock('../services/pwaService', () => ({ checkNetworkStatus: () => true }));
vi.mock('../hooks/usePushNotifications', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../hooks/usePushNotifications')>()),
    usePushNotifications: () => {},
}));
vi.mock('../hooks/useVoiceAssistant', () => ({
    useVoiceAssistant: () => ({
        isListening: false, isSpeaking: false, isSupported: false, volume: 0, transcript: '', error: null,
        startListening: vi.fn(async () => false), stopListening: vi.fn(), speak: vi.fn(),
        stopSpeaking: vi.fn(), setConversationalMode: vi.fn(),
    }),
}));
// Décor et satellites sans rapport avec le chrome testé : la nappe d'eau
// (canvas, absent de jsdom), la messagerie flottante, l'Architecte, Diallo OS.
vi.mock('../components/miroir/WaterMirror', () => ({ WaterMirror: () => null }));
vi.mock('../components/MoocChatFloating', () => ({ MoocChatFloating: () => null }));
vi.mock('../components/architecte/ArchitecteFloatingBar', () => ({ ArchitecteFloatingBar: () => null }));
vi.mock('../components/DialloOS', () => ({ DialloOS: () => null }));

import { Layout } from '../components/Layout';
import { Dashboard } from '../components/Dashboard';
import { GlobalProvider, useGlobal } from '../contexts/GlobalContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { GoalProvider } from '../contexts/GoalContext';

const CREDITS = 1000000;

const Accueil: React.FC = () => {
    const { userProfile, notifications, markNotificationRead } = useGlobal();
    return (
        <Layout
            activeTab="home"
            onTabChange={() => {}}
            notifications={notifications}
            onMarkRead={markNotificationRead}
            userProfile={userProfile}
            isSearchModalOpen={false}
            onOpenSearch={() => {}}
            onCloseSearch={() => {}}
            isGoalModalOpen={false}
            onOpenGoalModal={() => {}}
            onCloseGoalModal={() => {}}
        >
            <Dashboard userProfile={userProfile} onNavigate={() => {}} onOpenSearch={() => {}} onOpenCapModal={() => {}} />
        </Layout>
    );
};

function renderAccueil() {
    return render(
        <GlobalProvider><ThemeProvider><GoalProvider><Accueil /></GoalProvider></ThemeProvider></GlobalProvider>,
    );
}

beforeEach(() => {
    // Même solde que sur la capture de la Direction : « 1 000 000 » doit
    // disparaître de l'en-tête, pas seulement le libellé du compteur.
    window.localStorage.setItem('lmav_session_v2', JSON.stringify({
        email: 'direction@moknet.net', name: 'Amadou Diallo', credits: CREDITS,
    }));
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false, media: query, onchange: null,
        addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
});

describe('accueil — éléments retirés de l’affichage', () => {
    it('l’en-tête ne porte plus le badge « v5.12 »', () => {
        renderAccueil();
        expect(screen.queryByText(/v5\.12/i)).toBeNull();
        // Le nom de la plateforme, lui, reste.
        expect(screen.getAllByText('Le Monde à Vous').length).toBeGreaterThan(0);
    });

    it('l’en-tête ne porte plus la pilule « Services » du hub transversal', () => {
        renderAccueil();
        expect(screen.queryByTitle(/Hub des Capacités Transversales/i)).toBeNull();
        expect(screen.queryByRole('button', { name: /^Services$/ })).toBeNull();
    });

    it('l’en-tête ne porte plus la bannière « Lier Google Workspace »', () => {
        renderAccueil();
        expect(screen.queryByText(/Lier Google Workspace/i)).toBeNull();
    });

    it('les en-têtes (ordinateur et téléphone) n’affichent plus le solde de crédits', () => {
        const { container } = renderAccueil();
        expect(screen.queryByTitle('Ouvrir Finance & Wallet')).toBeNull();
        const headers = Array.from(container.querySelectorAll('header'));
        expect(headers.length).toBe(2);
        for (const header of headers) {
            expect(header.textContent).not.toContain(CREDITS.toLocaleString());
            expect(header.textContent).not.toContain(String(CREDITS));
            expect(header.textContent).not.toContain('Ⓒ');
        }
    });

    it('le pied de la barre latérale ne porte plus « Services Transversaux · Google »', () => {
        renderAccueil();
        expect(screen.queryByTitle('Outils & Services Google Workspace')).toBeNull();
        expect(screen.queryByText('Services Transversaux')).toBeNull();
    });

    it('le tableau de bord n’affiche plus la carte « Conseiller Référent »', () => {
        renderAccueil();
        expect(screen.queryByText(/Conseiller Référent/i)).toBeNull();
        expect(screen.queryByText('Conseiller Diallo')).toBeNull();
    });
});

describe('accueil — les fonctions restent atteignables', () => {
    it('la trajectoire Point A → Point B est toujours rendue (sans sa carte de conseiller)', () => {
        renderAccueil();
        expect(screen.getByText('Diagnostic 360° & Trajectoire')).toBeInTheDocument();
        expect(screen.getByText('CV Maître & Dossier Talents')).toBeInTheDocument();
    });

    it('sur ordinateur, le hub transversal s’ouvre depuis le menu Compte et liste les quatre centres Google', () => {
        renderAccueil();
        expect(screen.queryByText(/Capacités & Services Transversaux/)).toBeNull();
        // Le menu Compte n'est monté qu'ouvert : on l'ouvre par l'avatar.
        fireEvent.click(screen.getByRole('button', { name: /Profile/ }));
        fireEvent.click(screen.getByTestId('compte-services-transversaux'));
        expect(screen.getByText(/Capacités & Services Transversaux/)).toBeInTheDocument();
        for (const label of [/Google Maps/i, /Google Drive/i, /Google Meet/i, /Google Chat/i]) {
            expect(screen.getAllByText(label).length).toBeGreaterThan(0);
        }
    });

    it('« Finance & Wallet » reste dans la navigation : le solde n’a pas disparu du produit', () => {
        renderAccueil();
        expect(screen.getAllByText(/Finance & Wallet/).length).toBeGreaterThan(0);
    });

    it('le hub transversal s’ouvre toujours depuis le tiroir mobile', () => {
        renderAccueil();
        expect(screen.queryByText(/Capacités & Services Transversaux/)).toBeNull();
        // Le tiroir est monté fermé (aria-hidden) : on l'ouvre par le dock.
        fireEvent.click(screen.getByTestId('dock-menu-toggle'));
        expect(screen.getByTestId('menu-lateral').closest('[aria-hidden]')).toHaveAttribute('aria-hidden', 'false');
        fireEvent.click(screen.getByRole('button', { name: /Services Transversaux Google & Sécurité/ }));
        expect(screen.getByText(/Capacités & Services Transversaux/)).toBeInTheDocument();
    });

    it('les autres commandes de l’en-tête sont intactes (recherche, Guide-moi, Mon Cap, Bilingue, notifications)', () => {
        const { container } = renderAccueil();
        const desktop = container.querySelector('header.hidden') as HTMLElement;
        expect(desktop).not.toBeNull();
        const h = within(desktop);
        expect(h.getByText(/Rechercher un espace/)).toBeInTheDocument();
        expect(h.getByRole('button', { name: /Mode guidé/ })).toBeInTheDocument();
        expect(h.getByText('Mon Cap')).toBeInTheDocument();
        expect(h.getByText('Bilingue')).toBeInTheDocument();
        expect(h.getByTitle('Scanner un document, texte ou QR Code')).toBeInTheDocument();
    });
});
