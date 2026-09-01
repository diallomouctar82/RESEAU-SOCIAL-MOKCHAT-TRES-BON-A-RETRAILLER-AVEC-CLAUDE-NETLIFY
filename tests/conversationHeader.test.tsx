import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGING_LANGUAGES } from '../services/translation/translationService';

/**
 * VF-8 : le sélecteur « Ma langue » est FIXE dans l'en-tête de conversation,
 * à côté du nom — jamais dans la zone de messages qui défile.
 *
 * Première partie : ConversationHeader seul (contrat du composant).
 * Seconde partie : MoocChatFloating monté avec ses services simulés (même
 * patron que chatLocalConversationGuard.test.tsx) — assertion STRUCTURELLE :
 * le sélecteur n'a aucun ancêtre `overflow-y-auto`.
 */

const service = vi.hoisted(() => ({
    getConversationsForUser: vi.fn(),
    getBlockedUserIds: vi.fn(),
    subscribeToPresence: vi.fn(),
    subscribeToCallSignals: vi.fn(),
    getConversationMessages: vi.fn(),
    markConversationRead: vi.fn(),
    subscribeToChat: vi.fn(),
    subscribeToTyping: vi.fn(),
    subscribeToIncomingMessages: vi.fn(),
    isConfigured: vi.fn(() => true),
    sendTypingSignal: vi.fn(),
}));

vi.mock('../services/supabaseClient', () => ({
    supabaseService: service,
    isSupabaseConfigured: true,
}));
vi.mock('../services/adminConfigService', () => ({ adminConfigService: {} }));
vi.mock('../services/messaging/messagingIntelligence', () => ({
    summarizeConversation: vi.fn(),
    assistRewriteMessage: vi.fn(),
    translateMessageText: vi.fn(),
}));
vi.mock('../services/calls/ringtoneService', () => ({
    startRinging: vi.fn(),
    stopRinging: vi.fn(),
    startRingback: vi.fn(),
    stopRingback: vi.fn(),
}));

const { ConversationHeader } = await import('../components/chat/ConversationHeader');
const { MoocChatFloating } = await import('../components/MoocChatFloating');

const peer = {
    name: 'Yaya Diallo',
    avatarUrl: '/avatars/yaya.png',
    verified: true,
    presence: 'online' as const,
    subtitle: 'Membre vérifié',
};

describe('ConversationHeader — « Ma langue » à côté du nom', () => {
    it('rend un unique <select aria-label="Ma langue"> : « Par défaut » (valeur vide) puis le catalogue avec drapeaux', () => {
        render(<ConversationHeader peer={peer} myLanguage="es" onLanguageChange={vi.fn()} onBack={vi.fn()} />);

        const select = screen.getByRole('combobox', { name: 'Ma langue' }) as HTMLSelectElement;
        expect(select.value).toBe('es');

        const options = Array.from(select.options);
        expect(options[0].value).toBe('');
        expect(options[0].textContent).toBe('Par défaut · aucune traduction');
        expect(options).toHaveLength(MESSAGING_LANGUAGES.length + 1);
        MESSAGING_LANGUAGES.forEach((lang, index) => {
            expect(options[index + 1].value).toBe(lang.code);
            expect(options[index + 1].textContent).toBe(`${lang.flag} ${lang.label}`);
        });

        // Libellé visible, et un seul sélecteur dans le DOM quelle que soit la largeur d'écran.
        expect(screen.getByText('Ma langue')).toBeInTheDocument();
        expect(screen.getAllByRole('combobox')).toHaveLength(1);
    });

    it('déclenche onLanguageChange avec le code choisi, et "" pour « Par défaut »', () => {
        const onLanguageChange = vi.fn();
        render(<ConversationHeader peer={peer} myLanguage="es" onLanguageChange={onLanguageChange} onBack={vi.fn()} />);
        const select = screen.getByRole('combobox', { name: 'Ma langue' });

        fireEvent.change(select, { target: { value: '' } });
        expect(onLanguageChange).toHaveBeenLastCalledWith('');

        fireEvent.change(select, { target: { value: 'fr' } });
        expect(onLanguageChange).toHaveBeenLastCalledWith('fr');
        expect(onLanguageChange).toHaveBeenCalledTimes(2);
    });

    it('affiche le correspondant (photo, nom, statut), « Il lit en … », les actions du parent, et déclenche retour/fiche', () => {
        const onBack = vi.fn();
        const onOpenPeer = vi.fn();
        render(
            <ConversationHeader
                peer={{ ...peer, presence: 'offline' }}
                myLanguage="es"
                peerReadsIn="Français"
                onLanguageChange={vi.fn()}
                onBack={onBack}
                onOpenPeer={onOpenPeer}
            >
                <button type="button">Appel Audio</button>
            </ConversationHeader>,
        );

        expect(screen.getByText('Yaya Diallo')).toBeInTheDocument();
        expect(screen.getByText('Membre vérifié')).toBeInTheDocument();
        expect(screen.getByText('Il lit en Français')).toBeInTheDocument();
        expect(screen.getByRole('img', { name: 'Yaya Diallo' })).toHaveAttribute('src', '/avatars/yaya.png');
        expect(screen.getByRole('button', { name: 'Appel Audio' })).toBeInTheDocument();

        fireEvent.click(screen.getByRole('button', { name: 'Retour à la liste' }));
        expect(onBack).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByText('Yaya Diallo'));
        expect(onOpenPeer).toHaveBeenCalledTimes(1);
    });

    it('« En ligne » quand le correspondant est présent ; « Il lit en » absent tant que sa langue n’est pas détectée', () => {
        render(<ConversationHeader peer={peer} myLanguage="fr" onLanguageChange={vi.fn()} onBack={vi.fn()} />);
        expect(screen.getByText('En ligne')).toBeInTheDocument();
        expect(screen.queryByText(/Il lit en/)).not.toBeInTheDocument();
    });

    it('photo absente → initiales du correspondant, jamais une photo de banque d’images', () => {
        const { container } = render(
            <ConversationHeader peer={{ name: 'Yaya Diallo' }} myLanguage="" onLanguageChange={vi.fn()} onBack={vi.fn()} />,
        );
        expect(screen.getByRole('img', { name: 'Yaya Diallo' })).toHaveTextContent('YD');
        expect(container.innerHTML).not.toContain('unsplash');
    });

    it('sélecteur lisible sur fond sombre, focus visible, cible ≥ 44 px', () => {
        render(<ConversationHeader peer={peer} myLanguage="" onLanguageChange={vi.fn()} onBack={vi.fn()} />);
        const select = screen.getByRole('combobox', { name: 'Ma langue' });
        expect(select.className).toContain('min-h-[44px]');
        expect(select.className).toContain('text-white');
        expect(select.className).toContain('focus-visible:ring-2');
        // Les options restent lisibles quand le menu déroulant s'ouvre (fond clair, texte sombre).
        Array.from((select as HTMLSelectElement).options).forEach((option) => {
            expect(option.className).toContain('text-slate-900');
        });
    });
});

const currentUser = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Compte de test',
    email: 'test@example.invalid',
    avatarUrl: '/avatar-test.png',
    role: 'citizen',
    // « Par défaut » : aucune traduction déclenchée au montage.
    preferredLanguage: null,
} as any;

const localConversation = {
    id: 'chat-u5',
    participantId: 'u5',
    participantName: 'Membre de démonstration',
    participantAvatar: '/avatar-demo.png',
    lastMessage: '',
    lastMessageTime: '',
    unreadCount: 0,
    isOnline: false,
    messages: [],
};

const configureService = () => {
    service.getConversationsForUser.mockResolvedValue([]);
    service.getBlockedUserIds.mockResolvedValue([]);
    service.subscribeToPresence.mockReturnValue(() => {});
    service.subscribeToCallSignals.mockReturnValue(() => {});
    service.getConversationMessages.mockResolvedValue([]);
    service.markConversationRead.mockResolvedValue(undefined);
    service.subscribeToChat.mockReturnValue(() => {});
    service.subscribeToTyping.mockReturnValue(() => {});
    service.subscribeToIncomingMessages.mockReturnValue(() => {});
};

/** Ouvre la fenêtre de messagerie si elle ne l'est pas déjà (bouton `#mooc-chat-toggle-btn`, conservé). */
const openMessagingWindow = () => {
    if (!document.getElementById('mooc-chat-window')) {
        fireEvent.click(document.getElementById('mooc-chat-toggle-btn')!);
    }
    return document.getElementById('mooc-chat-window')!;
};

describe('MoocChatFloating — « Ma langue » vit dans l’en-tête fixe, jamais dans la liste qui défile', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        configureService();
        Object.defineProperty(Element.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
        });
        localStorage.setItem('lmav_chat_conversations_cache', JSON.stringify([localConversation]));
    });

    it('monte le sélecteur dans l’en-tête de conversation, sans aucun ancêtre overflow-y-auto', async () => {
        render(<MoocChatFloating currentUser={currentUser} activeConversationId="chat-u5" />);
        const windowElement = openMessagingWindow();

        const select = await screen.findByRole('combobox', { name: 'Ma langue' });
        expect(windowElement.contains(select)).toBe(true);
        expect(screen.getAllByRole('combobox', { name: 'Ma langue' })).toHaveLength(1);
        expect((select as HTMLSelectElement).options[0].textContent).toBe('Par défaut · aucune traduction');

        // Assertion structurelle : rien ne défile entre le sélecteur et la fenêtre.
        expect(select.closest('.overflow-y-auto')).toBeNull();
        const scrollers = Array.from(windowElement.querySelectorAll('.overflow-y-auto'));
        expect(scrollers.length).toBeGreaterThan(0);
        scrollers.forEach((scroller) => expect(scroller.contains(select)).toBe(false));

        // Il est hébergé par le bandeau fixe de l'en-tête (flex-shrink-0), à côté du nom du correspondant…
        const header = select.closest('.flex-shrink-0');
        expect(header).not.toBeNull();
        expect(header!.textContent).toContain('Membre de démonstration');
        // …et PRÉCÈDE la zone de messages dans le DOM (il n'est plus sous le bandeau d'accès).
        const accessNotice = screen.getByText("Cette conversation n'est visible que par ses membres.");
        expect(select.compareDocumentPosition(accessNotice) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(accessNotice.closest('.overflow-y-auto')).not.toBeNull();
    });

    it('enregistre la langue choisie sur le profil (preferred_language), "" → « Par défaut » = null', async () => {
        const onUpdateProfile = vi.fn();
        render(<MoocChatFloating currentUser={currentUser} activeConversationId="chat-u5" onUpdateProfile={onUpdateProfile} />);
        openMessagingWindow();

        const select = await screen.findByRole('combobox', { name: 'Ma langue' });
        fireEvent.change(select, { target: { value: 'es' } });
        expect(onUpdateProfile).toHaveBeenCalledWith({ preferredLanguage: 'es' });
    });
});
