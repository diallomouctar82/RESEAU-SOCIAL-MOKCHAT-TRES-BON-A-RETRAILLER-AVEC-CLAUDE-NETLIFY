import React from 'react';
import { act, render, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ChatMessage } from '../types';

/**
 * VF-7 (revue contradictoire) : dans un fil DIRECT, une bulle reçue porte
 * toujours l'identité du correspondant — jamais « Membre ».
 *
 * Défaut trouvé par la revue : `mapDbMessageToChatMessage` estampille
 * `senderName: 'Membre'` quand le cache de profils de la conversation est
 * vide (fil qui vient d'être créé, paquet Realtime sans jointure), et
 * `ChatMessageItem` donnait la priorité à ce nom estampillé sur l'identité
 * du correspondant pourtant connue par l'en-tête de conversation.
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
    createDirectConversation: vi.fn(),
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
    // AU-11 : le composant arme le déverrouillage audio au montage — la
    // doublure doit exposer la fonction, sinon l'appel jette au rendu.
    primeRingtoneAudio: vi.fn(() => () => {}),
}));

const { ChatMessageItem } = await import('../components/chat/ChatMessageItem');
const { MoocChatFloating } = await import('../components/MoocChatFloating');

const bubbleProps = {
    currentUserId: 'me',
    onReply: vi.fn(),
    onReact: vi.fn(),
    onReport: vi.fn(),
    playingAudioId: null,
    onToggleAudio: vi.fn(),
};

const received: ChatMessage = {
    id: 'message-1',
    senderId: 'peer',
    senderName: 'Membre',
    text: 'Bonjour !',
    timestamp: new Date('2026-09-01T10:00:00Z'),
    isRead: true,
    status: 'read',
};

describe('ChatMessageItem — identité du correspondant dans un fil direct', () => {
    it('fil direct : le nom estampillé « Membre » ne masque jamais le correspondant', () => {
        render(
            <ChatMessageItem {...bubbleProps} message={received} isMe={false} isGroup={false} participantName="Amina VF" participantAvatar="/avatars/amina.png" />,
        );
        const avatar = screen.getByRole('img', { name: 'Amina VF' });
        expect(avatar).toHaveAttribute('src', '/avatars/amina.png');
        expect(screen.queryByRole('img', { name: 'Membre' })).not.toBeInTheDocument();
    });

    it('fil direct sans photo : initiales du correspondant, pas « M »', () => {
        render(
            <ChatMessageItem {...bubbleProps} message={received} isMe={false} participantName="Amina VF" />,
        );
        expect(screen.getByRole('img', { name: 'Amina VF' })).toHaveTextContent('AV');
    });

    it('groupe : le nom porté par le message reste l’identité de son expéditeur', () => {
        const fromFatou: ChatMessage = { ...received, id: 'message-2', senderName: 'Fatou Diop', senderAvatar: '/avatars/fatou.png' };
        render(
            <ChatMessageItem {...bubbleProps} message={fromFatou} isMe={false} isGroup participantName="Groupe Tribu" participantAvatar="/avatars/groupe.png" />,
        );
        const avatar = screen.getByRole('img', { name: 'Fatou Diop' });
        expect(avatar).toHaveAttribute('src', '/avatars/fatou.png');
        expect(screen.queryByRole('img', { name: 'Groupe Tribu' })).not.toBeInTheDocument();
    });
});

const currentUser = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Ivan VF',
    email: 'test@example.invalid',
    avatarUrl: '/avatars/ivan.png',
    role: 'citizen',
    preferredLanguage: null,
} as any;

const PEER_ID = '22222222-2222-4222-8222-222222222222';
const CONVERSATION_ID = '33333333-3333-4333-8333-333333333333';

const peerMember = {
    id: PEER_ID,
    name: 'Amina VF',
    avatarUrl: '/avatars/amina.png',
    title: 'Traductrice',
    bio: '',
    location: 'Dakar',
    joinedDate: '2026-01-01',
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    storiesCount: 0,
    reelsCount: 0,
    livesCount: 0,
    privacySettings: { profileVisibility: 'public', allowMessagesFrom: 'all', showOnlineStatus: true, allowTagging: true, showActivityFeed: true },
} as any;

let chatHandlers: { onMessage?: (m: any) => void; onUpdate?: (m: any) => void } = {};

const configureService = () => {
    service.getConversationsForUser.mockResolvedValue([]);
    service.getBlockedUserIds.mockResolvedValue([]);
    service.subscribeToPresence.mockReturnValue(() => {});
    service.subscribeToCallSignals.mockReturnValue(() => {});
    service.getConversationMessages.mockResolvedValue([]);
    service.markConversationRead.mockResolvedValue(undefined);
    service.subscribeToChat.mockImplementation((_id: string, handlers: any) => {
        chatHandlers = handlers;
        return () => {};
    });
    service.subscribeToTyping.mockReturnValue(() => {});
    service.subscribeToIncomingMessages.mockReturnValue(() => {});
    service.createDirectConversation.mockResolvedValue(CONVERSATION_ID);
};

describe('MoocChatFloating — premier message reçu dans une conversation qui vient d’être créée', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        chatHandlers = {};
        configureService();
        Object.defineProperty(Element.prototype, 'scrollIntoView', {
            configurable: true,
            value: vi.fn(),
        });
        localStorage.removeItem('lmav_chat_conversations_cache');
    });

    it('la bulle reçue et l’aperçu de réponse portent le nom du correspondant, jamais « Membre »', async () => {
        render(<MoocChatFloating currentUser={currentUser} pendingDirectChatMember={peerMember} />);

        await waitFor(() => expect(service.createDirectConversation).toHaveBeenCalledWith(currentUser.id, PEER_ID));
        await waitFor(() => expect(service.subscribeToChat).toHaveBeenCalledWith(CONVERSATION_ID, expect.any(Object)));
        expect(chatHandlers.onMessage).toBeTypeOf('function');

        // Paquet Realtime brut, sans jointure de profil — exactement ce que le serveur envoie.
        await act(async () => {
            chatHandlers.onMessage!({
                id: 'aaaaaaaa-0000-4000-8000-000000000001',
                conversation_id: CONVERSATION_ID,
                sender_id: PEER_ID,
                content: 'Salut Ivan !',
                message_type: 'text',
                created_at: '2026-09-01T10:00:00Z',
                client_message_id: null,
            });
        });
        const firstBubble = await screen.findByText('Salut Ivan !');
        const firstRow = firstBubble.closest('.justify-start') as HTMLElement;
        expect(firstRow).not.toBeNull();
        const peerAvatar = within(firstRow).getByRole('img', { name: 'Amina VF' });
        expect(peerAvatar.tagName).toBe('IMG');
        expect(peerAvatar).toHaveAttribute('src', '/avatars/amina.png');
        expect(within(firstRow).queryByRole('img', { name: 'Membre' })).not.toBeInTheDocument();

        // Réponse à ce premier message : l'aperçu cite l'expéditeur par son nom
        // (preuve que le cache de profils est bien rempli à la création du fil,
        // indépendamment de la priorité donnée au correspondant par la bulle).
        await act(async () => {
            chatHandlers.onMessage!({
                id: 'aaaaaaaa-0000-4000-8000-000000000002',
                conversation_id: CONVERSATION_ID,
                sender_id: PEER_ID,
                content: 'Tu es là ?',
                message_type: 'text',
                reply_to_id: 'aaaaaaaa-0000-4000-8000-000000000001',
                created_at: '2026-09-01T10:00:05Z',
                client_message_id: null,
            });
        });
        await screen.findByText('Tu es là ?');
        expect(screen.getByText('Amina VF :')).toBeInTheDocument();

        const windowElement = document.getElementById('mooc-chat-window')!;
        expect(windowElement.textContent).not.toContain('Membre :');
        expect(screen.queryByRole('img', { name: 'Membre' })).not.toBeInTheDocument();
    });
});
