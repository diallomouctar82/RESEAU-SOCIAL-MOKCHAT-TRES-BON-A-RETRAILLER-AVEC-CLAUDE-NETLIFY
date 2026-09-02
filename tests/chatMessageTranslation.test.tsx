import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import type { ChatMessage } from '../types';
import type { TranslationResult } from '../services/translation/translationService';

/**
 * VF-4 (vérification G, chemin texte) — « Ma langue » doit être APPLIQUÉE
 * (les messages affichés sont retraduits dès qu'elle change) et PERSISTÉE
 * (écrite dans profiles.preferred_language, null compris, et relue au
 * rechargement). Les services distants sont remplacés par des doubles ; la
 * logique testée (MoocChatFloating, GlobalContext, fetchUserProfile) est la
 * vraie.
 */
const remote = vi.hoisted(() => ({
    service: {
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
        upsertProfile: vi.fn(async () => {}),
        getCurrentUser: vi.fn(async () => null),
        onAuthStateChange: vi.fn(() => ({ unsubscribe: vi.fn() })),
        getNotifications: vi.fn(async () => []),
        subscribeToNotifications: vi.fn(() => () => {}),
        markNotificationRead: vi.fn(async () => {}),
    },
    profileRow: { preferred_language: null as string | null },
    translate: vi.fn(),
}));

vi.mock('../services/supabaseClient', () => {
    // Chaîne minimale `from().select().eq().single()` (profil) et
    // `from().select().eq()` attendue directement (compétences, badges).
    const chain: any = {
        select: () => chain,
        eq: () => chain,
        single: async () => ({ data: { id: '11111111-1111-4111-8111-111111111111', email: 'test@example.invalid', name: 'Compte de test', role: 'citizen', level: 1, xp: 0, next_level_xp: 100, credits: 0, ...remote.profileRow }, error: null }),
        then: (onFulfilled: (v: unknown) => unknown) => Promise.resolve({ data: [], error: null }).then(onFulfilled),
    };
    return { supabaseService: remote.service, isSupabaseConfigured: true, supabase: { from: () => chain } };
});
vi.mock('../services/adminConfigService', () => ({ adminConfigService: {} }));
vi.mock('../services/messaging/messagingIntelligence', () => ({
    summarizeConversation: vi.fn(),
    assistRewriteMessage: vi.fn(),
    translateMessageText: vi.fn(),
}));
vi.mock('../services/calls/ringtoneService', () => ({
    startRinging: vi.fn(), stopRinging: vi.fn(), startRingback: vi.fn(), stopRingback: vi.fn(),
    // AU-11 : le composant arme le déverrouillage audio au montage — la
    // doublure doit exposer la fonction, sinon l'appel jette au rendu.
    primeRingtoneAudio: vi.fn(() => () => {}),
}));
vi.mock('../services/memory', () => ({ memoryService: { setCurrentUserId: vi.fn() } }));
vi.mock('../services/architecte/syncQueue', () => ({ setSyncQueueUser: vi.fn(), startSyncQueueAutoResume: vi.fn(() => () => {}) }));
vi.mock('../services/architecte/syncTaskHandlers', () => ({ installSyncTaskHandlers: vi.fn() }));
vi.mock('../services/translation/translationService', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/translation/translationService')>();
    return { ...real, translationService: { translateText: remote.translate } };
});

const message: ChatMessage = {
    id: 'message-1',
    senderId: 'author-1',
    text: 'Bonjour, comment allez-vous ?',
    originalLanguage: 'fr',
    timestamp: new Date('2026-09-01T10:00:00Z'),
    isRead: false,
    status: 'delivered',
};

const baseProps = {
    message,
    isMe: false,
    currentUserId: 'reader-1',
    onReply: vi.fn(),
    onReact: vi.fn(),
    onReport: vi.fn(),
    playingAudioId: null,
    onToggleAudio: vi.fn(),
};

const translatedResult: TranslationResult = {
    originalText: message.text!,
    translatedText: 'Hello, how are you?',
    sourceLanguage: 'fr',
    targetLanguage: 'en',
    targetLanguageLabel: 'English',
    status: 'translated',
    engineId: 'test-engine',
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('ChatMessageItem — traduction automatique des messages reçus', () => {
    it('remplace le message par sa traduction dans la langue du lecteur, sans action manuelle', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const onTranslate = vi.fn(async () => translatedResult);

        render(
            <ChatMessageItem
                {...baseProps}
                autoTranslate
                translationTargetLanguage="en"
                onTranslate={onTranslate}
            />,
        );

        // Lecture directe dans la langue du destinataire : l'original n'est
        // plus affiché tant qu'il n'est pas explicitement demandé.
        expect(await screen.findByText('Hello, how are you?')).toBeInTheDocument();
        expect(screen.getByText('Traduit automatiquement · English')).toBeInTheDocument();
        expect(screen.queryByText(message.text!)).not.toBeInTheDocument();
        expect(onTranslate).toHaveBeenCalledTimes(1);
        expect(onTranslate).toHaveBeenCalledWith(message.text);
    });

    it('« Voir le message original » révèle le texte de départ, puis rebascule sur la traduction', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const onTranslate = vi.fn(async () => translatedResult);

        render(
            <ChatMessageItem
                {...baseProps}
                autoTranslate
                translationTargetLanguage="en"
                onTranslate={onTranslate}
            />,
        );

        const revealButton = await screen.findByRole('button', { name: 'Voir le message original' });
        await act(async () => { revealButton.click(); });

        expect(screen.getByText(message.text!)).toBeInTheDocument();
        expect(screen.queryByText('Hello, how are you?')).not.toBeInTheDocument();
        expect(screen.getByText('Message original · Français')).toBeInTheDocument();

        const backButton = screen.getByRole('button', { name: 'Voir la traduction' });
        await act(async () => { backButton.click(); });

        expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
        expect(screen.queryByText(message.text!)).not.toBeInTheDocument();
        // Aucun nouvel appel moteur : la bascule est purement locale.
        expect(onTranslate).toHaveBeenCalledTimes(1);
    });

    it('affiche l’original tant que la traduction n’est pas revenue — la lecture n’est jamais bloquée', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        let resolveTranslation!: (value: TranslationResult) => void;
        const onTranslate = vi.fn(() => new Promise<TranslationResult>((resolve) => {
            resolveTranslation = resolve;
        }));

        render(
            <ChatMessageItem
                {...baseProps}
                autoTranslate
                translationTargetLanguage="en"
                onTranslate={onTranslate}
            />,
        );

        expect(screen.getByText(message.text!)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Voir le message original' })).not.toBeInTheDocument();

        await act(async () => { resolveTranslation(translatedResult); });
        expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
    });

    it('ne propose aucune bascule quand l’auteur écrit déjà dans la langue du lecteur', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const onTranslate = vi.fn(async (): Promise<TranslationResult> => ({
            ...translatedResult,
            translatedText: message.text!,
            targetLanguage: 'fr',
            targetLanguageLabel: 'Français',
            status: 'unchanged',
        }));

        render(
            <ChatMessageItem
                {...baseProps}
                autoTranslate
                translationTargetLanguage="fr"
                onTranslate={onTranslate}
            />,
        );

        await waitFor(() => expect(onTranslate).toHaveBeenCalledTimes(1));
        expect(screen.getByText(message.text!)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Voir le message original' })).not.toBeInTheDocument();
    });

    it('ne déclenche pas de traduction automatique pour un message envoyé par le lecteur', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const onTranslate = vi.fn(async () => translatedResult);

        render(
            <ChatMessageItem
                {...baseProps}
                isMe
                autoTranslate={false}
                translationTargetLanguage="en"
                onTranslate={onTranslate}
            />,
        );

        expect(screen.getByText(message.text!)).toBeInTheDocument();
        await waitFor(() => expect(onTranslate).not.toHaveBeenCalled());
        expect(screen.queryByText('Hello, how are you?')).not.toBeInTheDocument();
    });

    it('conserve l’original et signale honnêtement une traduction indisponible', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        const onTranslate = vi.fn(async (): Promise<TranslationResult> => ({
            ...translatedResult,
            translatedText: message.text!,
            status: 'unavailable',
        }));

        render(
            <ChatMessageItem
                {...baseProps}
                autoTranslate
                translationTargetLanguage="en"
                onTranslate={onTranslate}
            />,
        );

        expect(screen.getByText(message.text!)).toBeInTheDocument();
        expect(await screen.findByText(/Traduction indisponible/)).toBeInTheDocument();
        expect(screen.getByText(message.text!)).toBeInTheDocument();
        expect(screen.queryByText('Hello, how are you?')).not.toBeInTheDocument();
    });

    it('ignore une ancienne réponse si le lecteur change de langue pendant la traduction', async () => {
        vi.stubGlobal('IntersectionObserver', undefined);
        let resolveEnglish!: (value: TranslationResult) => void;
        const onTranslateEnglish = vi.fn(() => new Promise<TranslationResult>((resolve) => {
            resolveEnglish = resolve;
        }));
        const arabicResult: TranslationResult = {
            ...translatedResult,
            translatedText: 'مرحباً، كيف حالك؟',
            targetLanguage: 'ar',
            targetLanguageLabel: 'العربية',
        };
        const onTranslateArabic = vi.fn(async () => arabicResult);

        const { rerender } = render(
            <ChatMessageItem
                {...baseProps}
                autoTranslate
                translationTargetLanguage="en"
                onTranslate={onTranslateEnglish}
            />,
        );
        await waitFor(() => expect(onTranslateEnglish).toHaveBeenCalledTimes(1));

        rerender(
            <ChatMessageItem
                {...baseProps}
                autoTranslate
                translationTargetLanguage="ar"
                onTranslate={onTranslateArabic}
            />,
        );
        expect(await screen.findByText('مرحباً، كيف حالك؟')).toBeInTheDocument();

        await act(async () => {
            resolveEnglish(translatedResult);
        });
        expect(screen.getByText('مرحباً، كيف حالك؟')).toBeInTheDocument();
        expect(screen.queryByText('Hello, how are you?')).not.toBeInTheDocument();
    });
});

describe('« Ma langue » — appliquée aux messages affichés et persistée (VF-4, chemin texte)', () => {
    const ME = '11111111-1111-4111-8111-111111111111';
    const PEER = '33333333-3333-4333-8333-333333333333';
    const CONVERSATION = '22222222-2222-4222-8222-222222222222';
    const currentUser = (preferredLanguage: string | null) => ({
        id: ME, name: 'Compte de test', email: 'test@example.invalid', avatarUrl: '/avatar-test.png', role: 'citizen', preferredLanguage,
    }) as any;

    beforeEach(() => {
        vi.stubGlobal('IntersectionObserver', undefined);
        remote.translate.mockReset();
        remote.service.upsertProfile.mockClear();
        remote.profileRow.preferred_language = null;
        remote.service.getConversationsForUser.mockResolvedValue([{
            id: CONVERSATION, is_group: false, title: null, last_message_preview: 'Привет', last_message_at: null, unread_count: 0,
            conversation_participants: [
                { user_id: ME, profiles: { name: 'Compte de test', avatar_url: '/avatar-test.png', role: 'citizen' } },
                { user_id: PEER, profiles: { name: 'Ivan', avatar_url: '/ivan.png', role: 'citizen' } },
            ],
        }]);
        remote.service.getBlockedUserIds.mockResolvedValue([]);
        remote.service.subscribeToPresence.mockReturnValue(() => {});
        remote.service.subscribeToCallSignals.mockReturnValue(() => {});
        // L'historique arrive APRÈS la liste des conversations (comme en
        // production : la liste est demandée en premier) — le composant ne
        // range un historique que dans une conversation déjà connue.
        remote.service.getConversationMessages.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve([{
            id: '44444444-4444-4444-8444-444444444444', sender_id: PEER, content: 'Привет Амина', message_type: 'text',
            metadata: { original_language: 'ru' }, created_at: '2026-09-01T10:00:00Z', status: 'delivered',
        }]), 30)));
        remote.service.markConversationRead.mockResolvedValue(undefined);
        remote.service.subscribeToChat.mockReturnValue(() => {});
        remote.service.subscribeToTyping.mockReturnValue(() => {});
        remote.service.subscribeToIncomingMessages.mockReturnValue(() => {});
        Object.defineProperty(Element.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() });
        // Le double traduit vers la cible demandée — c'est la cible qui est sous test.
        remote.translate.mockImplementation(async (req: { text: string; targetLanguage: string; sourceLanguage?: string }) => ({
            originalText: req.text,
            translatedText: req.targetLanguage === 'fr' ? 'Bonjour Amina' : req.targetLanguage === 'en' ? 'Hello Amina' : req.text,
            sourceLanguage: 'ru', targetLanguage: req.targetLanguage, targetLanguageLabel: req.targetLanguage,
            status: req.targetLanguage === 'ru' ? 'unchanged' : 'translated', engineId: 'double',
        }));
    });

    it('le sélecteur reflète la langue persistée du profil ; un changement est persisté (null pour « Par défaut »)', async () => {
        const { MoocChatFloating } = await import('../components/MoocChatFloating');
        const onUpdateProfile = vi.fn(async () => true);
        render(<MoocChatFloating currentUser={currentUser('ru')} activeConversationId={CONVERSATION} onUpdateProfile={onUpdateProfile} />);
        const select = await screen.findByLabelText('Ma langue') as HTMLSelectElement;
        expect(select.value).toBe('ru');

        fireEvent.change(select, { target: { value: 'fr' } });
        expect(onUpdateProfile).toHaveBeenCalledWith({ preferredLanguage: 'fr' });
        fireEvent.change(select, { target: { value: '' } });
        expect(onUpdateProfile).toHaveBeenCalledWith({ preferredLanguage: null });
    });

    it('changer « Ma langue » retraduit les messages affichés dans la nouvelle langue', async () => {
        const { MoocChatFloating } = await import('../components/MoocChatFloating');
        const { rerender } = render(<MoocChatFloating currentUser={currentUser('fr')} activeConversationId={CONVERSATION} />);
        expect(await screen.findByText('Bonjour Amina')).toBeInTheDocument();
        expect(remote.translate).toHaveBeenCalledWith(expect.objectContaining({ text: 'Привет Амина', sourceLanguage: 'ru', targetLanguage: 'fr', context: 'messaging' }));

        // La langue persistée change (profil mis à jour) → le message reçu est retraduit vers la nouvelle langue.
        rerender(<MoocChatFloating currentUser={currentUser('en')} activeConversationId={CONVERSATION} />);
        expect(await screen.findByText('Hello Amina')).toBeInTheDocument();
        expect(remote.translate).toHaveBeenCalledWith(expect.objectContaining({ targetLanguage: 'en' }));
        expect(screen.queryByText('Bonjour Amina')).not.toBeInTheDocument();

        // « Par défaut » : plus aucune traduction, l'original est lu tel quel.
        rerender(<MoocChatFloating currentUser={currentUser(null)} activeConversationId={CONVERSATION} />);
        expect(await screen.findByText('Привет Амина')).toBeInTheDocument();
        expect(screen.queryByText('Hello Amina')).not.toBeInTheDocument();
    });

    it('la langue choisie est écrite dans profiles.preferred_language (null compris) et relue au rechargement', async () => {
        const { GlobalProvider, useGlobal } = await import('../contexts/GlobalContext');
        const { fetchUserProfile } = await import('../services/profile');
        let api: ReturnType<typeof useGlobal> | null = null;
        const Probe: React.FC = () => { api = useGlobal(); return <span data-testid="lang">{api.userProfile.preferredLanguage ?? 'défaut'}</span>; };

        const first = render(<GlobalProvider><Probe /></GlobalProvider>);
        await act(async () => { await api!.updateUserProfile({ id: ME, preferredLanguage: 'ru' }); });
        expect(remote.service.upsertProfile).toHaveBeenLastCalledWith(expect.objectContaining({ id: ME, preferred_language: 'ru' }));
        expect(screen.getByTestId('lang').textContent).toBe('ru');

        await act(async () => { await api!.updateUserProfile({ preferredLanguage: null }); });
        // `null` est une valeur légitime (« Par défaut ») : elle est ÉCRITE, jamais remplacée par l'ancienne langue.
        expect(remote.service.upsertProfile).toHaveBeenLastCalledWith(expect.objectContaining({ preferred_language: null }));
        expect(screen.getByTestId('lang').textContent).toBe('défaut');

        await act(async () => { await api!.updateUserProfile({ preferredLanguage: 'ru' }); });
        first.unmount();
        // Rechargement (mode local) : la session persistée est relue telle quelle.
        render(<GlobalProvider><Probe /></GlobalProvider>);
        expect(screen.getByTestId('lang').textContent).toBe('ru');

        // Rechargement (compte réel) : profiles.preferred_language est relu tel quel, null compris.
        remote.profileRow.preferred_language = 'ru';
        expect((await fetchUserProfile(ME))?.preferredLanguage).toBe('ru');
        remote.profileRow.preferred_language = null;
        expect((await fetchUserProfile(ME))?.preferredLanguage).toBeNull();
    });
});
