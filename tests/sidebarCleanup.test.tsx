import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Nettoyage du menu (DEC-2026-052) — seconde loupe du nettoyage visuel
 * demandé par la Direction : retirer de la barre latérale d'ordinateur le
 * bouton « L'Architecte », le bloc « Mes Favoris » et le bloc « Récents »,
 * sans toucher au Live, à la sécurité, à l'authentification ni aux
 * fonctions qui marchent.
 *
 * Deux familles d'assertions :
 *  1. les éléments retirés ne sont plus dans la barre latérale ;
 *  2. ce qui doit rester reste — les piliers et leurs entrées (une seule
 *     fois chacune : « non répétitif »), l'étoile de favori sur chaque
 *     entrée (visuel cible de la Direction), la pastille flottante de
 *     l'Architecte (toujours montée), le tiroir mobile (inchangé).
 *
 * Non couvert ici : l'aspect. Le jugement visuel appartient à la Direction,
 * sur les captures avant/après et l'aperçu de déploiement.
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
vi.mock('../components/miroir/WaterMirror', () => ({ WaterMirror: () => null }));
vi.mock('../components/MoocChatFloating', () => ({ MoocChatFloating: () => null }));
vi.mock('../components/DialloOS', () => ({ DialloOS: () => null }));
// La pastille flottante est remplacée par un témoin : ce test prouve qu'elle
// est toujours MONTÉE par Layout (le chemin réel vers l'Architecte), pas son
// comportement interne, couvert par tests/ArchitecteFloatingBar.test.tsx.
vi.mock('../components/architecte/ArchitecteFloatingBar', () => ({
    ArchitecteFloatingBar: (props: { openSignal: number }) => (
        <div data-testid="architecte-flottant" data-open-signal={String(props.openSignal)} />
    ),
}));

import { Layout } from '../components/Layout';
import { GlobalProvider, useGlobal } from '../contexts/GlobalContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { GoalProvider } from '../contexts/GoalContext';

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
            <div>contenu</div>
        </Layout>
    );
};

function renderAccueil() {
    const utils = render(
        <GlobalProvider><ThemeProvider><GoalProvider><Accueil /></GoalProvider></ThemeProvider></GlobalProvider>,
    );
    // Barre latérale d'ordinateur = premier <aside> ; le second est le tiroir mobile.
    const asides = utils.container.querySelectorAll('aside');
    expect(asides.length).toBe(2);
    return { ...utils, sidebar: asides[0] as HTMLElement, drawer: asides[1] as HTMLElement };
}

beforeEach(() => {
    // Un utilisateur qui AVAIT des favoris et des récents en mémoire locale :
    // ils ne doivent plus produire aucun affichage.
    window.localStorage.setItem('lmav_nav_favorites', JSON.stringify(['career', 'campus', 'housing', 'shop']));
    window.localStorage.setItem('lmav_nav_recents', JSON.stringify(['social', 'parcours', 'admin-procedures', 'languages']));
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
        matches: false, media: query, onchange: null,
        addEventListener: vi.fn(), removeEventListener: vi.fn(), addListener: vi.fn(), removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }));
});

describe('barre latérale — éléments retirés de l’affichage', () => {
    it('ne porte plus le bouton « L’Architecte »', () => {
        const { sidebar } = renderAccueil();
        expect(within(sidebar).queryByRole('button', { name: /Ouvrir l’Architecte|Ouvrir l'Architecte/ })).toBeNull();
        expect(within(sidebar).queryByText("L'Architecte")).toBeNull();
    });

    it('ne porte plus le bloc « Mes Favoris », même avec des favoris en mémoire locale', () => {
        const { sidebar } = renderAccueil();
        expect(within(sidebar).queryByText(/Mes Favoris/i)).toBeNull();
    });

    it('garde l’étoile de favori sur chaque entrée épinglée (visuel cible de la Direction)', () => {
        const { sidebar } = renderAccueil();
        // Quatre favoris en mémoire locale → quatre étoiles « pleines », une par entrée.
        expect(within(sidebar).getAllByTitle('Retirer des favoris').length).toBe(4);
        // Les autres entrées gardent leur étoile d'épinglage (révélée au survol).
        expect(within(sidebar).getAllByTitle('Épingler dans mes favoris').length).toBeGreaterThan(0);
    });

    it('ne porte plus le bloc « Récents », même avec des récents en mémoire locale', () => {
        const { sidebar } = renderAccueil();
        expect(within(sidebar).queryByText(/^Récents$/)).toBeNull();
    });
});

describe('barre latérale — ce qui reste, et une seule fois', () => {
    it('chaque entrée des piliers apparaît exactement une fois (menu non répétitif)', () => {
        const { sidebar } = renderAccueil();
        for (const label of ['Campus & Éducation', 'Carrière & Accomplissement', 'Habitat & Installation', 'Marché Mondial', 'Finance & Wallet']) {
            expect(within(sidebar).getAllByText(label).length).toBe(1);
        }
        for (const pilier of ['Accueil & Cap', 'Apprendre & Évoluer', 'Vie & Services', 'Créer & Entreprendre', 'Communauté & Conseil']) {
            expect(within(sidebar).getByText(pilier)).toBeInTheDocument();
        }
    });

    it('l’Architecte reste montée par sa pastille flottante', () => {
        renderAccueil();
        expect(screen.getByTestId('architecte-flottant')).toBeInTheDocument();
    });

    it('le pied de barre latérale (messagerie, compte) est intact', () => {
        const { sidebar } = renderAccueil();
        expect(within(sidebar).getByTestId('sidebar-messaging-slot')).toBeInTheDocument();
        expect(within(sidebar).getByText('Messagerie')).toBeInTheDocument();
    });

    it('le tiroir mobile n’est pas touché', () => {
        const { drawer } = renderAccueil();
        expect(within(drawer).getByRole('button', { name: /Services Transversaux Google & Sécurité/, hidden: true })).toBeInTheDocument();
        expect(within(drawer).getAllByText('Campus & Éducation', { ignore: false }).length).toBeGreaterThan(0);
    });
});
