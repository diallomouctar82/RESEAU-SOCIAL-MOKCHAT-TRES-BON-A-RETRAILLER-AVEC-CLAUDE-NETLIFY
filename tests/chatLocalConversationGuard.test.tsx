import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

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
    // AU-11 : le composant arme le déverrouillage audio au montage — la
    // doublure doit exposer la fonction, sinon l'appel jette au rendu.
    primeRingtoneAudio: vi.fn(() => () => {}),
}));

const { MoocChatFloating } = await import('../components/MoocChatFloating');

const currentUser = {
    id: '11111111-1111-4111-8111-111111111111',
    name: 'Compte de test',
    email: 'test@example.invalid',
    avatarUrl: '/avatar-test.png',
    role: 'citizen',
    preferredLanguage: 'fr',
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

beforeEach(() => {
    vi.clearAllMocks();
    configureService();
    Object.defineProperty(Element.prototype, 'scrollIntoView', {
        configurable: true,
        value: vi.fn(),
    });
});

describe('frontière conversation locale / Supabase', () => {
    it('n’envoie jamais chat-u5 vers la colonne conversation_id UUID', async () => {
        localStorage.setItem('lmav_chat_conversations_cache', JSON.stringify([localConversation]));

        render(<MoocChatFloating currentUser={currentUser} activeConversationId="chat-u5" />);

        await waitFor(() => expect(service.getConversationsForUser).toHaveBeenCalled());
        expect(service.getConversationMessages).not.toHaveBeenCalled();
        expect(service.subscribeToChat).not.toHaveBeenCalled();
        expect(service.subscribeToTyping).not.toHaveBeenCalled();
        expect(service.markConversationRead).not.toHaveBeenCalled();
    });

    it('conserve le chargement et le Realtime pour une vraie conversation UUID', async () => {
        const conversationId = '22222222-2222-4222-8222-222222222222';

        render(<MoocChatFloating currentUser={currentUser} activeConversationId={conversationId} />);

        await waitFor(() => expect(service.getConversationMessages).toHaveBeenCalledWith(conversationId));
        expect(service.subscribeToChat).toHaveBeenCalledWith(conversationId, expect.any(Object));
        expect(service.subscribeToTyping).toHaveBeenCalledWith(conversationId, expect.any(Function));
    });
});
