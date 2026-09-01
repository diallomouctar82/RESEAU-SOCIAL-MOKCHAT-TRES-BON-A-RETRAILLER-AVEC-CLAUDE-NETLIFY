import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../types';

/**
 * VF-7 : la photo et le nom du PROPRIÉTAIRE du compte s'affichent dans la
 * messagerie — carte d'identité en tête de la liste, avatar à droite de mes
 * bulles — et tout avatar manquant devient des initiales (jamais une photo
 * de banque d'images).
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

const { MessagingOwnerCard } = await import('../components/chat/MessagingOwnerCard');
const { ChatMessageItem } = await import('../components/chat/ChatMessageItem');
const { MoocChatFloating } = await import('../components/MoocChatFloating');

const STOCK_PLACEHOLDER = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop';

describe('MessagingOwnerCard — carte d’identité du propriétaire', () => {
    it('affiche la photo réelle, le nom, la mention « Vous » et le statut en ligne', () => {
        render(<MessagingOwnerCard name="Yaya Diallo" avatarUrl="/avatars/yaya.png" presence="online" />);
        const image = screen.getByRole('img', { name: 'Yaya Diallo' });
        expect(image.tagName).toBe('IMG');
        expect(image).toHaveAttribute('src', '/avatars/yaya.png');
        expect(screen.getByText('Yaya Diallo')).toBeInTheDocument();
        expect(screen.getByText('Vous')).toBeInTheDocument();
        expect(screen.getByText('Messagerie Privée')).toBeInTheDocument();
        expect(screen.getByText('Realtime')).toBeInTheDocument();
        expect(screen.getByText('· En ligne')).toBeInTheDocument();
    });

    it('photo absente → initiales ; statut « Hors ligne » quand la présence le dit, rien quand elle est inconnue', () => {
        const { rerender } = render(<MessagingOwnerCard name="Yaya Diallo" presence="offline" />);
        const avatar = screen.getByRole('img', { name: 'Yaya Diallo' });
        expect(avatar.tagName).toBe('SPAN');
        expect(avatar).toHaveTextContent('YD');
        expect(screen.getByText('· Hors ligne')).toBeInTheDocument();

        rerender(<MessagingOwnerCard name="Yaya Diallo" />);
        expect(screen.queryByText(/En ligne|Hors ligne/)).not.toBeInTheDocument();
    });

    it('ne présente jamais le cliché de banque d’images comme la photo du propriétaire', () => {
        const { container } = render(<MessagingOwnerCard name="Yaya Diallo" avatarUrl={STOCK_PLACEHOLDER} />);
        expect(container.querySelector('img')).toBeNull();
        expect(screen.getByRole('img', { name: 'Yaya Diallo' })).toHaveTextContent('YD');
    });
});

const baseMessage: ChatMessage = {
    id: 'message-1',
    senderId: 'me',
    text: 'Bonjour !',
    timestamp: new Date('2026-09-01T10:00:00Z'),
    isRead: true,
    status: 'read',
};

const bubbleProps = {
    currentUserId: 'me',
    onReply: vi.fn(),
    onReact: vi.fn(),
    onReport: vi.fn(),
    playingAudioId: null,
    onToggleAudio: vi.fn(),
};

/** Ligne racine d'une bulle : `[avatar] [bulle]` (reçue) ou `[bulle] [avatar]` (envoyée). */
const bubbleRow = (container: HTMLElement) => container.firstElementChild as HTMLElement;

describe('ChatMessageItem — mon avatar à droite de mes bulles', () => {
    it('bulle envoyée : ma photo réelle à DROITE, alt/title = mon nom', () => {
        const { container } = render(
            <ChatMessageItem {...bubbleProps} message={baseMessage} isMe currentUserName="Yaya Diallo" currentUserAvatar="/avatars/yaya.png" />,
        );
        const row = bubbleRow(container);
        const avatar = screen.getByRole('img', { name: 'Yaya Diallo' });
        expect(avatar.tagName).toBe('IMG');
        expect(avatar).toHaveAttribute('src', '/avatars/yaya.png');
        expect(avatar).toHaveAttribute('title', 'Yaya Diallo');
        expect(row.lastElementChild).toBe(avatar);
        expect(row.firstElementChild).not.toBe(avatar);
        expect(row.firstElementChild!.textContent).toContain('Bonjour !');
        expect(row.className).toContain('justify-end');
    });

    it('bulle envoyée sans photo : mes initiales à droite', () => {
        const { container } = render(
            <ChatMessageItem {...bubbleProps} message={baseMessage} isMe currentUserName="Yaya Diallo" />,
        );
        const avatar = screen.getByRole('img', { name: 'Yaya Diallo' });
        expect(avatar.tagName).toBe('SPAN');
        expect(avatar).toHaveTextContent('YD');
        expect(bubbleRow(container).lastElementChild).toBe(avatar);
    });

    it('bulle reçue inchangée : avatar du correspondant à GAUCHE, aucun avatar du propriétaire', () => {
        const received: ChatMessage = { ...baseMessage, id: 'message-2', senderId: 'peer', senderName: 'Amadou Diallo', senderAvatar: '/avatars/amadou.png' };
        const { container } = render(
            <ChatMessageItem {...bubbleProps} message={received} isMe={false} currentUserName="Yaya Diallo" currentUserAvatar="/avatars/yaya.png" />,
        );
        const row = bubbleRow(container);
        const avatar = screen.getByRole('img', { name: 'Amadou Diallo' });
        expect(avatar).toHaveAttribute('src', '/avatars/amadou.png');
        expect(row.firstElementChild).toBe(avatar);
        expect(row.className).toContain('justify-start');
        expect(screen.queryByRole('img', { name: 'Yaya Diallo' })).not.toBeInTheDocument();
    });

    it('bulle reçue sans photo ni nom d’expéditeur : initiales du correspondant, jamais le cliché Unsplash', () => {
        const received: ChatMessage = { ...baseMessage, id: 'message-3', senderId: 'peer' };
        const { container } = render(
            <ChatMessageItem {...bubbleProps} message={received} isMe={false} participantName="Amadou Diallo" participantAvatar={STOCK_PLACEHOLDER} />,
        );
        expect(container.innerHTML).not.toContain('unsplash');
        expect(screen.getByRole('img', { name: 'Amadou Diallo' })).toHaveTextContent('AD');
    });
});

const currentUser = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Yaya Diallo',
    email: 'test@example.invalid',
    avatarUrl: '/avatars/yaya.png',
    role: 'citizen',
    preferredLanguage: null,
} as any;

const localConversation = {
    id: 'chat-u5',
    participantId: 'u5',
    participantName: 'Membre de démonstration',
    participantAvatar: STOCK_PLACEHOLDER,
    lastMessage: 'À demain !',
    lastMessageTime: '10:02',
    unreadCount: 0,
    isOnline: false,
    messages: [
        { id: 'm1', senderId: 'u5', text: 'Bonjour Yaya, bien reçu.', timestamp: '2026-09-01T10:00:00Z', isRead: true, status: 'read' },
        { id: 'm2', senderId: currentUser.id, text: 'Parfait, merci !', timestamp: '2026-09-01T10:01:00Z', isRead: true, status: 'read' },
        { id: 'm3', senderId: currentUser.id, text: 'À demain !', timestamp: '2026-09-01T10:02:00Z', isRead: true, status: 'delivered' },
    ],
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

const openMessagingWindow = () => {
    if (!document.getElementById('mooc-chat-window')) {
        fireEvent.click(document.getElementById('mooc-chat-toggle-btn')!);
    }
    return document.getElementById('mooc-chat-window')!;
};

describe('MoocChatFloating — identité du propriétaire dans la messagerie', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        configureService();
        Object.defineProperty(Element.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
        });
        localStorage.setItem('lmav_chat_conversations_cache', JSON.stringify([localConversation]));
    });

    it('en tête de la liste : ma photo, mon nom et « Vous » remplacent l’icône anonyme', async () => {
        render(<MoocChatFloating currentUser={currentUser} />);
        const windowElement = openMessagingWindow();

        const ownerAvatar = await screen.findByRole('img', { name: 'Yaya Diallo' });
        expect(ownerAvatar).toHaveAttribute('src', '/avatars/yaya.png');
        expect(windowElement.contains(ownerAvatar)).toBe(true);
        expect(screen.getByText('Yaya Diallo')).toBeInTheDocument();
        expect(screen.getByText('Vous')).toBeInTheDocument();
        expect(screen.getByText('Messagerie Privée')).toBeInTheDocument();
        // Présence Realtime non synchronisée → aucun statut inventé.
        expect(screen.queryByText(/En ligne|Hors ligne/)).not.toBeInTheDocument();

        // Liste : le correspondant sans vraie photo apparaît en initiales, jamais en cliché Unsplash.
        expect(screen.getByRole('img', { name: 'Membre de démonstration' })).toHaveTextContent('MD');
        expect(windowElement.innerHTML).not.toContain('unsplash');
    });

    it('dans la conversation : mes bulles portent ma photo, celles du correspondant ses initiales', async () => {
        render(<MoocChatFloating currentUser={currentUser} activeConversationId="chat-u5" />);
        const windowElement = openMessagingWindow();

        await screen.findByText('Parfait, merci !');
        const mine = screen.getAllByRole('img', { name: 'Yaya Diallo' });
        expect(mine).toHaveLength(2);
        mine.forEach((avatar) => {
            expect(avatar).toHaveAttribute('src', '/avatars/yaya.png');
            expect(avatar).toHaveAttribute('title', 'Yaya Diallo');
            // À droite : dernier élément de la ligne de bulle.
            expect(avatar.parentElement!.lastElementChild).toBe(avatar);
        });

        // Correspondant : en-tête + bulle reçue, en initiales (son avatar est le cliché de repli).
        const peerAvatars = screen.getAllByRole('img', { name: 'Membre de démonstration' });
        expect(peerAvatars.length).toBeGreaterThanOrEqual(2);
        peerAvatars.forEach((avatar) => expect(avatar).toHaveTextContent('MD'));
        expect(windowElement.innerHTML).not.toContain('unsplash');
    });
});
