import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import type { ChatMessage } from '../types';
import type { TranslationResult } from '../services/translation/translationService';

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
