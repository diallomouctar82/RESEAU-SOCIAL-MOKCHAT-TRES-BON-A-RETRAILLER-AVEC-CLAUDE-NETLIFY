import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DUCKED_REMOTE_VOLUME, decodeCallData, encodeCallData } from '../services/messaging/speechLanguage';

/**
 * HL-4 — l'interprète d'appel, testé sans navigateur réel : le transport est
 * remplacé par un double qui expose le callback de données, la traduction
 * par un espion, la voix par un enregistreur. Ce qui est vérifié ici est la
 * LOGIQUE réelle de ChatCallModal (règles « Par défaut », traduction chez le
 * récepteur, voix + atténuation, transparence), pas un mock de la logique.
 */

const rig = vi.hoisted(() => ({
    options: null as any,
    sendData: vi.fn<(payload: Uint8Array, options?: unknown) => Promise<void>>(async () => {}),
    setVolume: vi.fn(),
    translate: vi.fn(),
    spoken: [] as string[],
}));

vi.mock('../hooks/useLiveTransport', () => ({
    useLiveTransport: (opts: any) => {
        rig.options = opts;
        return {
            connectionState: 'connected',
            error: null,
            connectionQuality: 'good',
            remoteConnectionQuality: 'good',
            sendData: rig.sendData,
            localVideoTrack: null,
            localScreenShareTrack: null,
            localIsSpeaking: false,
            remoteParticipants: [{
                participant: { identity: 'peer-ivan', name: 'Ivan', isLocal: false, isSpeaking: false, audioEnabled: true, videoEnabled: false, isScreenSharing: false },
                audioTrack: { participantIdentity: 'peer-ivan', kind: 'audio', attach: vi.fn(), detach: vi.fn(), setVolume: rig.setVolume },
            }],
            audioPlaybackBlocked: false,
            startAudio: vi.fn(),
            setCameraEnabled: vi.fn(),
            cameraFacing: 'user',
            switchCamera: vi.fn(),
            setMicrophoneEnabled: vi.fn(),
            startScreenShare: vi.fn(),
            stopScreenShare: vi.fn(),
            disconnect: vi.fn(),
            retry: vi.fn(),
        };
    },
}));

vi.mock('../services/translation/translationService', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/translation/translationService')>();
    return { ...real, translationService: { translateText: rig.translate } };
});

vi.mock('../services/calls/callInterpreter', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/calls/callInterpreter')>();
    class FakeVoice {
        constructor(private readonly o: { onSpeakingChange?: (s: boolean) => void }) {}
        speak(text: string) { rig.spoken.push(text); this.o.onSpeakingChange?.(true); }
        stop() { this.o.onSpeakingChange?.(false); }
    }
    return { ...real, InterpreterVoice: FakeVoice };
});

const { ChatCallModal } = await import('../components/chat/ChatCallModal');

const session = {
    callId: 'call-1',
    conversationId: '4bdb32a4-c71a-420d-9ec3-8d2f0572fd61',
    type: 'audio' as const,
    initiatorId: 'me',
    initiatorName: 'Amina',
    initiatorAvatar: '/a.png',
    receiverId: 'peer-ivan',
    receiverName: 'Ivan',
    receiverAvatar: '/i.png',
    status: 'connected' as const,
    durationSeconds: 0,
};

const receive = (message: Parameters<typeof encodeCallData>[0]) => act(() => { rig.options.onDataReceived(encodeCallData(message)); });

beforeEach(() => {
    rig.sendData.mockClear();
    rig.setVolume.mockClear();
    rig.translate.mockReset();
    rig.spoken.length = 0;
});

describe('Interprète d’appel (ChatCallModal)', () => {
    it('utilise le profil audio « parole » pour la room d’appel et annonce ma langue', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" myLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        expect(rig.options.audioProfile).toBe('call');
        await waitFor(() => expect(rig.sendData).toHaveBeenCalled());
        const hello = decodeCallData(rig.sendData.mock.calls[0][0] as Uint8Array);
        expect(hello).toEqual({ t: 'hello', v: 1, lang: 'fr' });
    });

    it('Amina (fr) reçoit du russe : traduit vers fr, sous-titres, voix, original atténué', async () => {
        rig.translate.mockResolvedValue({ status: 'translated', translatedText: 'Bonjour Amina, on se voit mardi ?', originalText: 'Привет Амина, увидимся во вторник?', targetLanguage: 'fr', targetLanguageLabel: 'Français', sourceLanguage: 'ru' });
        render(<ChatCallModal callSession={session} localName="Amina" myLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);

        receive({ t: 'hello', v: 1, lang: 'ru' });
        expect(await screen.findByText(/Interprète IA · Русский → Français/)).toBeTruthy();

        receive({ t: 'caption', v: 1, id: 'c1', text: 'Привет Амина, увидимся во вторник?', lang: 'ru', final: true, ts: 1 });
        await waitFor(() => expect(rig.translate).toHaveBeenCalledWith(expect.objectContaining({ sourceLanguage: 'ru', targetLanguage: 'fr', context: 'live' })));
        expect(await screen.findByText('Bonjour Amina, on se voit mardi ?')).toBeTruthy();
        expect(screen.getByText('Привет Амина, увидимся во вторник?')).toBeTruthy(); // original conservé, en petit
        await waitFor(() => expect(rig.spoken).toEqual(['Bonjour Amina, on se voit mardi ?']));
        await waitFor(() => expect(rig.setVolume).toHaveBeenCalledWith(DUCKED_REMOTE_VOLUME));
    });

    it('« Par défaut » chez moi : rien n’est traduit ni dit, l’appel reste tel quel', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" myLanguage={null} onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'caption', v: 1, id: 'c2', text: 'Привет', lang: 'ru', final: true, ts: 2 });
        await new Promise((r) => setTimeout(r, 30));
        expect(rig.translate).not.toHaveBeenCalled();
        expect(rig.spoken).toEqual([]);
        expect(screen.queryByText(/Interprète IA/)).toBeNull();
    });

    it('« Par défaut » chez moi mais l’autre a choisi une langue : transparence, mes paroles lui sont sous-titrées', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" myLanguage={null} onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        expect(await screen.findByText(/Vos paroles sont sous-titrées pour Ivan/)).toBeTruthy();
        expect(rig.translate).not.toHaveBeenCalled();
    });

    it('même langue des deux côtés : sous-titres sans traduction ni voix', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" myLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'fr' });
        receive({ t: 'caption', v: 1, id: 'c3', text: 'Bonjour Amina', lang: 'fr', final: true, ts: 3 });
        expect(await screen.findByText('Bonjour Amina')).toBeTruthy();
        expect(rig.translate).not.toHaveBeenCalled();
        expect(rig.spoken).toEqual([]);
    });
});
