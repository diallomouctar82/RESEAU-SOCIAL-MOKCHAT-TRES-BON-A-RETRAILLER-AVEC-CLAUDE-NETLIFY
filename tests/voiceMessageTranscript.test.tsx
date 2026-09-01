import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ChatMessageItem } from '../components/chat/ChatMessageItem';
import type { ChatMessage } from '../types';

/**
 * HL-2 — un vocal reçu porte la transcription réelle faite chez l'auteur ;
 * le lecteur la lit dans SA langue, l'audio original reste intact, et il
 * peut l'ÉCOUTER dans sa langue.
 */
const vocal: ChatMessage = {
    id: 'v1',
    senderId: 'ivan',
    senderName: 'Ivan',
    mediaType: 'audio',
    mediaUrl: 'https://example.invalid/vocal.webm',
    audioDuration: 7,
    transcript: 'Привет Амина, увидимся во вторник?',
    transcriptLanguage: 'ru',
    timestamp: new Date('2026-09-01T10:00:00Z'),
    isRead: true,
    status: 'delivered',
};

const noop = () => {};

describe('Vocal transcrit et traduit dans ma langue', () => {
    it('affiche la transcription sous le lecteur, la traduit automatiquement, garde l’original et propose l’écoute', async () => {
        const onTranslate = vi.fn(async (text: string) => ({
            status: 'translated' as const,
            originalText: text,
            translatedText: 'Bonjour Amina, on se voit mardi ?',
            targetLanguage: 'fr',
            targetLanguageLabel: 'Français',
            sourceLanguage: 'ru',
        }));
        const onSpeak = vi.fn();
        render(
            <ChatMessageItem
                message={vocal}
                isMe={false}
                onReply={noop}
                onReact={noop}
                onReport={noop}
                playingAudioId={null}
                onToggleAudio={noop}
                autoTranslate
                translationTargetLanguage="fr"
                onTranslate={onTranslate}
                onSpeakTranslation={onSpeak}
            />,
        );

        expect(screen.getByText(/Transcription automatique · Русский/)).toBeTruthy();
        await waitFor(() => expect(onTranslate).toHaveBeenCalledWith('Привет Амина, увидимся во вторник?'));
        expect(await screen.findByText('Bonjour Amina, on se voit mardi ?')).toBeTruthy();
        expect(screen.getByText(/Traduit automatiquement · Français/)).toBeTruthy();
        // Le lecteur audio original est toujours là.
        expect(screen.getByTitle('Écouter le vocal')).toBeTruthy();

        fireEvent.click(screen.getByText('Écouter dans ma langue'));
        expect(onSpeak).toHaveBeenCalledWith('Bonjour Amina, on se voit mardi ?');

        fireEvent.click(screen.getByText('Voir le message original'));
        expect(screen.getByText('Привет Амина, увидимся во вторник?')).toBeTruthy();
    });

    it('« Par défaut » (pas de cible) : transcription affichée telle quelle, aucune traduction, aucun bouton d’écoute', () => {
        render(
            <ChatMessageItem
                message={vocal}
                isMe={false}
                onReply={noop}
                onReact={noop}
                onReport={noop}
                playingAudioId={null}
                onToggleAudio={noop}
                autoTranslate={false}
            />,
        );
        expect(screen.getByText('Привет Амина, увидимся во вторник?')).toBeTruthy();
        expect(screen.queryByText(/Traduit automatiquement/)).toBeNull();
        expect(screen.queryByText('Écouter dans ma langue')).toBeNull();
    });

    it('un vocal sans transcription reste un vocal : lecteur seul, rien d’inventé', () => {
        render(
            <ChatMessageItem
                message={{ ...vocal, transcript: undefined, transcriptLanguage: undefined }}
                isMe={false}
                onReply={noop}
                onReact={noop}
                onReport={noop}
                playingAudioId={null}
                onToggleAudio={noop}
                autoTranslate
                translationTargetLanguage="fr"
                onTranslate={vi.fn()}
            />,
        );
        expect(screen.getByTitle('Écouter le vocal')).toBeTruthy();
        expect(screen.queryByText(/Transcription automatique/)).toBeNull();
    });
});
