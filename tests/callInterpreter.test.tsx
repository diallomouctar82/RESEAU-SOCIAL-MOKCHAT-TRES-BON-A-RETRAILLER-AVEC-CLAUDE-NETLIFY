import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    /** VF-4 : transcription serveur — double contrôlable (jsdom n'a pas de Web Audio). */
    serverSupported: false,
    serverCaptioners: [] as any[],
    localAudioTrack: null as MediaStreamTrack | null,
    /** Mission VT : identités qui parlent (détection serveur) — pilote « X parle… ». */
    activeSpeakers: [] as string[],
    /** Mission VT : la voix de l'interprète voyage DANS l'appel — publication de ma piste, piste reçue, rendu factice. */
    publishInterpreterAudio: vi.fn<(track: MediaStreamTrack) => Promise<void>>(async () => {}),
    unpublishInterpreterAudio: vi.fn(async () => {}),
    interpreterTrack: null as any,
    voiceTracks: [] as any[],
    voiceTrackSupported: true,
    unlock: vi.fn(),
    spokenOptions: [] as unknown[],
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
            activeSpeakerIds: rig.activeSpeakers,
            remoteParticipants: [{
                participant: { identity: 'peer-ivan', name: 'Ivan', isLocal: false, isSpeaking: false, audioEnabled: true, videoEnabled: false, isScreenSharing: false },
                audioTrack: { participantIdentity: 'peer-ivan', kind: 'audio', attach: vi.fn(), detach: vi.fn(), setVolume: rig.setVolume },
                ...(rig.interpreterTrack ? { interpreterAudioTrack: rig.interpreterTrack } : {}),
            }],
            publishInterpreterAudio: rig.publishInterpreterAudio,
            unpublishInterpreterAudio: rig.unpublishInterpreterAudio,
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
            getLocalAudioTrack: () => rig.localAudioTrack,
            mediaError: null,
            localAudioPublished: true,
            getAudioStats: async () => ({ at: Date.now(), local: null, remote: [], canPlaybackAudio: true }),
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
        speak(text: string, options?: unknown) { rig.spoken.push(text); rig.spokenOptions.push(options); this.o.onSpeakingChange?.(true); }
        stop() { this.o.onSpeakingChange?.(false); }
    }
    /** Mission VT : rendu de MA voix d'interprète dans la piste de l'appel — enregistreur, jamais de Web Audio ici. */
    class FakeVoiceTrack {
        static isSupported() { return rig.voiceTrackSupported; }
        spoken: Array<{ id: string; text: string }> = [];
        started = 0;
        stopped = false;
        disposed = false;
        track = { kind: 'audio', id: 'interp-track' };
        constructor(public readonly options: any) { rig.voiceTracks.push(this); }
        start() { this.started += 1; return this.track; }
        speak(id: string, text: string) { this.spoken.push({ id, text }); }
        stop() { this.stopped = true; }
        dispose() { this.disposed = true; }
    }
    class FakeServerCaptioner {
        static isSupported() { return rig.serverSupported; }
        stopped = false;
        constructor(public readonly options: any) { rig.serverCaptioners.push(this); }
        start() { return true; }
        stop() { this.stopped = true; }
    }
    return { ...real, InterpreterVoice: FakeVoice, ServerCaptioner: FakeServerCaptioner, InterpreterVoiceTrack: FakeVoiceTrack, unlockInterpreterAudio: rig.unlock };
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
    rig.serverSupported = false;
    rig.serverCaptioners.length = 0;
    rig.localAudioTrack = null;
    rig.activeSpeakers = [];
    rig.publishInterpreterAudio.mockReset();
    rig.publishInterpreterAudio.mockImplementation(async () => {});
    rig.unpublishInterpreterAudio.mockClear();
    rig.interpreterTrack = null;
    rig.voiceTracks.length = 0;
    rig.voiceTrackSupported = true;
    rig.unlock.mockClear();
    rig.spokenOptions.length = 0;
});

/** Dernier message envoyé sur le canal de données, décodé. */
const lastSent = () => decodeCallData(rig.sendData.mock.calls[rig.sendData.mock.calls.length - 1][0] as Uint8Array);

describe('Interprète d’appel (ChatCallModal)', () => {
    it('utilise le profil audio « parole » pour la room d’appel et annonce ma langue', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        expect(rig.options.audioProfile).toBe('call');
        await waitFor(() => expect(rig.sendData).toHaveBeenCalled());
        const hello = decodeCallData(rig.sendData.mock.calls[0][0] as Uint8Array);
        // Mission VT : le « hello » annonce aussi si je veux ENTENDRE la voix de l'interprète (voice).
        expect(hello).toEqual({ t: 'hello', v: 1, lang: 'fr', voice: true });
    });

    it('Amina (fr) reçoit du russe : traduit vers fr, sous-titres, voix, original atténué', async () => {
        rig.translate.mockResolvedValue({ status: 'translated', translatedText: 'Bonjour Amina, on se voit mardi ?', originalText: 'Привет Амина, увидимся во вторник?', targetLanguage: 'fr', targetLanguageLabel: 'Français', sourceLanguage: 'ru' });
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);

        receive({ t: 'hello', v: 1, lang: 'ru' });
        expect(await screen.findByText(/Interprète IA · Русский → Français/)).toBeTruthy();

        receive({ t: 'caption', v: 1, id: 'c1', text: 'Привет Амина, увидимся во вторник?', lang: 'ru', final: true, ts: 1 });
        await waitFor(() => expect(rig.translate).toHaveBeenCalledWith(expect.objectContaining({ sourceLanguage: 'ru', targetLanguage: 'fr', context: 'live' })));
        expect(await screen.findByText('Bonjour Amina, on se voit mardi ?')).toBeTruthy();
        expect(screen.getByText('Привет Амина, увидимся во вторник?')).toBeTruthy(); // original conservé, en petit
        await waitFor(() => expect(rig.spoken).toEqual(['Bonjour Amina, on se voit mardi ?']));
        // Mission VT : la voix originale est COUPÉE (plus seulement atténuée) — « je n'entends que le français ».
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
        expect(rig.setVolume).not.toHaveBeenCalledWith(DUCKED_REMOTE_VOLUME);
        expect(screen.getByTestId('peer-speaking').textContent).toMatch(/Voix originale coupée — vous n’entendez que Français/);
    });

    it('« Par défaut » chez moi : rien n’est traduit ni dit, l’appel reste tel quel', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage={null} onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'caption', v: 1, id: 'c2', text: 'Привет', lang: 'ru', final: true, ts: 2 });
        await new Promise((r) => setTimeout(r, 30));
        expect(rig.translate).not.toHaveBeenCalled();
        expect(rig.spoken).toEqual([]);
        expect(screen.queryByText(/Interprète IA/)).toBeNull();
    });

    it('« Par défaut » chez moi mais l’autre a choisi une langue : transparence, mes paroles lui sont sous-titrées', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage={null} onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        // Mission VT : Ivan veut la voix (hello.voice absent = oui) et mon navigateur sait la rendre → il m'entend traduit.
        expect(await screen.findByText(/Ivan vous entend en Русский \(voix traduite\)/)).toBeTruthy();
        expect(rig.translate).not.toHaveBeenCalled();
    });

    it('même langue des deux côtés : sous-titres sans traduction ni voix', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'fr' });
        receive({ t: 'caption', v: 1, id: 'c3', text: 'Bonjour Amina', lang: 'fr', final: true, ts: 3 });
        expect(await screen.findByText('Bonjour Amina')).toBeTruthy();
        expect(rig.translate).not.toHaveBeenCalled();
        expect(rig.spoken).toEqual([]);
    });
});

describe('Transcription serveur de ma voix (VF-4)', () => {
    it('ma voix part au serveur avec MA langue en indication et celle du correspondant en cible ; le sous-titre voyage avec sa traduction', async () => {
        rig.serverSupported = true;
        // Mission VT : `myLanguage` (profil) = ce que je PARLE (indication STT) ; `hearLanguage` = ce que je veux ENTENDRE.
        render(<ChatCallModal callSession={session} localName="Amina" myLanguage="fr" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        // Dès que J'AI une langue, ma voix est transcrite — sans cible tant que l'autre n'a pas annoncé la sienne.
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(1));
        expect(rig.serverCaptioners[0].options).toMatchObject({ languageHint: 'fr', targetLanguage: undefined });

        receive({ t: 'hello', v: 1, lang: 'ru' });
        // Le correspondant parle russe : redémarrage avec la cible, l'ancien captioner est arrêté.
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(2));
        expect(rig.serverCaptioners[0].stopped).toBe(true);
        const captioner = rig.serverCaptioners[1];
        expect(captioner.options).toMatchObject({ languageHint: 'fr', targetLanguage: 'ru' });
        expect(captioner.options.getTrack).toBeTypeOf('function');

        act(() => { captioner.options.onInterim('Transcription…'); });
        expect(await screen.findByText(/Vous : Transcription…/)).toBeTruthy();
        // Aucun texte partiel inventé n'est envoyé au correspondant.
        expect(rig.sendData.mock.calls.map((c) => decodeCallData(c[0] as Uint8Array)?.t)).not.toContain('caption');

        act(() => { captioner.options.onFinal({ text: 'Bonjour Ivan, on se voit mardi ?', language: 'fr', translated: 'Привет Иван, увидимся во вторник?', targetLang: 'ru' }); });
        await waitFor(() => expect(lastSent()).toMatchObject({
            t: 'caption', final: true, lang: 'fr',
            text: 'Bonjour Ivan, on se voit mardi ?', translated: 'Привет Иван, увидимся во вторник?', targetLang: 'ru',
        }));
        expect(rig.translate).not.toHaveBeenCalled();
    });

    it('sous-titre reçu déjà traduit dans MA langue : affiché et dit immédiatement, sans aucun appel de traduction', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        receive({ t: 'caption', v: 1, id: 'c4', text: 'Привет Амина, увидимся во вторник?', lang: 'ru', final: true, ts: 4, translated: 'Bonjour Amina, on se voit mardi ?', targetLang: 'fr' });
        expect(await screen.findByText('Bonjour Amina, on se voit mardi ?')).toBeTruthy();
        expect(screen.getByText('Привет Амина, увидимся во вторник?')).toBeTruthy();
        expect(rig.translate).not.toHaveBeenCalled();
        expect(rig.spoken).toEqual(['Bonjour Amina, on se voit mardi ?']);
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0)); // Mission VT : original coupé
        // Pendant que l'interprète parle, mon micro l'entend : le captioner serveur est en pause.
        const captioner = rig.serverCaptioners[rig.serverCaptioners.length - 1];
        expect(captioner.options.isPaused()).toBe(true);
    });

    it('traduction jointe dans une AUTRE langue que la mienne : traduite chez moi comme avant', async () => {
        rig.translate.mockResolvedValue({ status: 'translated', translatedText: 'Hello Amina', originalText: 'Привет Амина', targetLanguage: 'en', targetLanguageLabel: 'English', sourceLanguage: 'ru' });
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="en" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'caption', v: 1, id: 'c5', text: 'Привет Амина', lang: 'ru', final: true, ts: 5, translated: 'Bonjour Amina', targetLang: 'fr' });
        expect(await screen.findByText('Hello Amina')).toBeTruthy();
        expect(rig.translate).toHaveBeenCalledWith(expect.objectContaining({ targetLanguage: 'en' }));
    });

    it('transcription serveur indisponible et aucune reconnaissance navigateur : l’écran le dit honnêtement', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(1));
        act(() => { rig.serverCaptioners[0].options.onUnavailable('Micro indisponible pour la transcription.'); });
        expect(await screen.findByText(/Sous-titres indisponibles : Micro indisponible pour la transcription\./)).toBeTruthy();
    });

    it('Mission VT : passerelle en difficulté → l’écran le dit avec le délai du nouvel essai, puis s’efface au retour', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(1));
        const captioner = rig.serverCaptioners[0];
        act(() => { captioner.options.onDegraded('Transcription serveur en difficulté (délai dépassé)', 8000); });
        expect(await screen.findByText(/Transcription serveur en difficulté \(délai dépassé\) — nouvel essai dans 8 s\./)).toBeTruthy();
        expect(captioner.stopped).toBe(false); // la capture continue, aucun repli navigateur déclenché
        act(() => { captioner.options.onRecovered(); });
        await waitFor(() => expect(screen.queryByText(/en difficulté/)).toBeNull());
    });

    it('« Par défaut » des deux côtés : aucune capture, aucun captioner', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage={null} onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        await waitFor(() => expect(rig.sendData).toHaveBeenCalled()); // le « hello » part quand même
        await new Promise((r) => setTimeout(r, 30));
        expect(rig.serverCaptioners).toHaveLength(0);
    });

    it('« Par défaut » chez moi, l’autre a une langue : ma voix est transcrite (détection) et traduite dans SA langue', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage={null} onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(1));
        expect(rig.serverCaptioners[0].options).toMatchObject({ languageHint: undefined, targetLanguage: 'ru' });
    });
});

describe('Mission VT — « ma langue seulement » (appel audio ET vidéo)', () => {
    const translatedCaption = {
        t: 'caption' as const, v: 1 as const, id: 'vt1', text: 'Привет Амина, увидимся во вторник?', lang: 'ru', final: true, ts: 10,
        translated: 'Bonjour Amina, on se voit mardi ?', targetLang: 'fr',
    };

    it('« Entendre aussi l’original » : la voix originale revient, atténuée seulement pendant que l’interprète parle', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
        const toggle = await screen.findByTestId('hear-original-toggle');
        expect(toggle.textContent).toContain('Ma langue seule');
        fireEvent.click(toggle);
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(1));
        expect(screen.getByTestId('hear-original-toggle').textContent).toContain('Original aussi');
        expect(screen.getByTestId('peer-speaking').textContent).toMatch(/Voix originale audible, atténuée pendant l’interprète/);
        receive(translatedCaption);
        await waitFor(() => expect(rig.spoken).toEqual(['Bonjour Amina, on se voit mardi ?']));
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(DUCKED_REMOTE_VOLUME));
    });

    it('appel VIDÉO : même règle, même panneau — voix originale coupée, bouton « Ma langue seule » présent, voix dite', async () => {
        render(<ChatCallModal callSession={{ ...session, type: 'video' }} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
        expect(await screen.findByTestId('hear-original-toggle')).toBeTruthy();
        expect(screen.getByTestId('peer-speaking').textContent).toMatch(/Voix originale coupée/);
        receive(translatedCaption);
        expect(await screen.findByText('Bonjour Amina, on se voit mardi ?')).toBeTruthy();
        expect(rig.spoken).toEqual(['Bonjour Amina, on se voit mardi ?']);
        expect(rig.setVolume).not.toHaveBeenCalledWith(DUCKED_REMOTE_VOLUME);
    });

    it('« Ivan parle… » : la détection de parole du serveur est montrée quand sa voix originale est coupée', async () => {
        rig.activeSpeakers = ['peer-ivan'];
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        expect((await screen.findByTestId('peer-speaking')).textContent).toContain('Ivan parle…');
    });

    it('correspondant en « Par défaut » qui parle russe : voix audible tant que sa langue est inconnue, coupée dès qu’elle est DÉTECTÉE', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: null });
        await waitFor(() => expect(rig.setVolume).toHaveBeenCalled());
        expect(rig.setVolume).not.toHaveBeenCalledWith(0);
        expect(screen.queryByTestId('hear-original-toggle')).toBeNull();
        receive(translatedCaption);
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
        expect(await screen.findByTestId('hear-original-toggle')).toBeTruthy();
    });

    it('même langue des deux côtés, puis « Sous-titres seuls » : la voix originale n’est jamais coupée', async () => {
        render(<ChatCallModal callSession={session} localName="Amina" hearLanguage="fr" onAcceptCall={() => {}} onRejectCall={() => {}} onEndCall={() => {}} />);
        receive({ t: 'hello', v: 1, lang: 'fr' });
        receive({ t: 'caption', v: 1, id: 'vt2', text: 'Bonjour Amina', lang: 'fr', final: true, ts: 11 });
        expect(await screen.findByText('Bonjour Amina')).toBeTruthy();
        expect(rig.setVolume).not.toHaveBeenCalledWith(0);
        expect(screen.queryByTestId('hear-original-toggle')).toBeNull();
        // L'autre passe au russe : coupé… puis « Sous-titres seuls » → audible, plus de bouton « original ».
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
        fireEvent.click(screen.getByText('Voix'));
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(1));
        expect(screen.queryByTestId('hear-original-toggle')).toBeNull();
    });
});

/**
 * Mission VT (correction après le test sur deux téléphones : « uniquement en
 * texte ») — la voix de l'interprète ne dépend plus d'une lecture locale sur
 * le téléphone du récepteur : l'ÉMETTEUR la rend dans une piste « interpreter »
 * de l'appel (même chemin que sa voix, prouvé sur les deux téléphones), le
 * RÉCEPTEUR la joue comme la voix de l'appel et coupe l'original (muted).
 */
describe('Mission VT — la voix de l’interprète voyage DANS l’appel (piste WebRTC)', () => {
    const translated = { t: 'caption' as const, v: 1 as const, id: 'vt10', text: 'Привет Амина', lang: 'ru', final: true, ts: 20, translated: 'Bonjour Amina', targetLang: 'fr' };
    const props = { localName: 'Amina', onAcceptCall: () => {}, onRejectCall: () => {}, onEndCall: () => {} };
    const finalPhrase = (captioner: any, text: string, translatedText: string) => act(() => { captioner.options.onFinal({ text, language: 'fr', translated: translatedText, targetLang: 'ru' }); });

    it('ÉMETTEUR : ma phrase traduite part avec voice=sent, la piste interprète est publiée UNE fois, la voix y est rendue, « voice » start/end/failed préviennent le correspondant', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(2));
        const captioner = rig.serverCaptioners[1];
        finalPhrase(captioner, 'Bonjour Ivan', 'Привет Иван');
        await waitFor(() => expect(lastSent()).toMatchObject({ t: 'caption', voice: 'sent', translated: 'Привет Иван', targetLang: 'ru' }));
        const sentId = (lastSent() as { id: string }).id;
        await waitFor(() => expect(rig.publishInterpreterAudio).toHaveBeenCalledTimes(1));
        expect(rig.voiceTracks).toHaveLength(1);
        expect(rig.publishInterpreterAudio).toHaveBeenCalledWith(rig.voiceTracks[0].track);
        await waitFor(() => expect(rig.voiceTracks[0].spoken).toEqual([{ id: sentId, text: 'Привет Иван' }]));
        expect(rig.voiceTracks[0].options.lang).toMatch(/^ru/);
        // Deuxième phrase : même piste, aucune seconde publication.
        finalPhrase(captioner, 'À mardi', 'До вторника');
        await waitFor(() => expect(rig.voiceTracks[0].spoken).toHaveLength(2));
        expect(rig.publishInterpreterAudio).toHaveBeenCalledTimes(1);
        expect(rig.voiceTracks).toHaveLength(1);
        // Les messages « voice » partent quand du son entre RÉELLEMENT dans la piste, puis à la fin, ou en échec.
        act(() => { rig.voiceTracks[0].options.onPhrase({ id: sentId, status: 'started', durationMs: 900 }); });
        await waitFor(() => expect(lastSent()).toEqual({ t: 'voice', v: 1, id: sentId, state: 'start', durationMs: 900 }));
        act(() => { rig.voiceTracks[0].options.onPhrase({ id: sentId, status: 'ended' }); });
        await waitFor(() => expect(lastSent()).toEqual({ t: 'voice', v: 1, id: sentId, state: 'end' }));
        act(() => { rig.voiceTracks[0].options.onPhrase({ id: sentId, status: 'failed', reason: 'voix HD au-delà du budget (6 s)' }); });
        await waitFor(() => expect(lastSent()).toEqual({ t: 'voice', v: 1, id: sentId, state: 'failed', reason: 'voix HD au-delà du budget (6 s)' }));
        // Rien n'a été lu localement chez moi : la voix est pour l'autre.
        expect(rig.spoken).toEqual([]);
    });

    it('ÉMETTEUR : le correspondant ne veut pas la voix (hello.voice=false) → sous-titre sans « voice », rien n’est rendu ni publié', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'ru', voice: false });
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(2));
        finalPhrase(rig.serverCaptioners[1], 'Bonjour Ivan', 'Привет Иван');
        await waitFor(() => expect(lastSent()).toMatchObject({ t: 'caption', translated: 'Привет Иван' }));
        expect((lastSent() as { voice?: string }).voice).toBeUndefined();
        await new Promise((r) => setTimeout(r, 20));
        expect(rig.publishInterpreterAudio).not.toHaveBeenCalled();
        expect(rig.voiceTracks).toHaveLength(0);
    });

    it('ÉMETTEUR : un agent interprète est dans la room → voice=agent, mon navigateur ne publie rien (l’agent rend la voix)', async () => {
        rig.serverSupported = true;
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        receive({ t: 'agent', v: 1, role: 'interpreter', langs: ['fr', 'ru'] });
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(2));
        finalPhrase(rig.serverCaptioners[1], 'Bonjour Ivan', 'Привет Иван');
        await waitFor(() => expect(lastSent()).toMatchObject({ t: 'caption', voice: 'agent' }));
        await new Promise((r) => setTimeout(r, 20));
        expect(rig.publishInterpreterAudio).not.toHaveBeenCalled();
        expect(rig.voiceTracks).toHaveLength(0);
    });

    it('ÉMETTEUR : rendu impossible ici (Web Audio absent) → voice=none, le correspondant la dira avec sa propre voix', async () => {
        rig.serverSupported = true;
        rig.voiceTrackSupported = false;
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(2));
        finalPhrase(rig.serverCaptioners[1], 'Bonjour Ivan', 'Привет Иван');
        await waitFor(() => expect(lastSent()).toMatchObject({ t: 'caption', voice: 'none' }));
        await new Promise((r) => setTimeout(r, 20));
        expect(rig.publishInterpreterAudio).not.toHaveBeenCalled();
    });

    it('ÉMETTEUR : publication de la piste refusée → le correspondant est prévenu (voice failed), jamais un silence', async () => {
        rig.serverSupported = true;
        rig.publishInterpreterAudio.mockRejectedValueOnce(new Error('Ligne non connectée'));
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.serverCaptioners.length).toBe(2));
        finalPhrase(rig.serverCaptioners[1], 'Bonjour Ivan', 'Привет Иван');
        await waitFor(() => expect(lastSent()).toMatchObject({ t: 'voice', state: 'failed', reason: 'publication impossible : Ligne non connectée' }));
        const captionId = (decodeCallData(rig.sendData.mock.calls.find((c) => decodeCallData(c[0] as Uint8Array)?.t === 'caption')![0] as Uint8Array) as { id: string }).id;
        expect((lastSent() as { id: string }).id).toBe(captionId);
        expect(rig.voiceTracks[0].spoken).toEqual([]);
    });

    it('RÉCEPTEUR : sous-titre voice=sent → rien n’est lu localement (la voix arrive par la piste) ; « voice » start/end pilote « l’interprète parle » ; failed → repli avec la voix de l’appareil', async () => {
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        receive({ ...translated, voice: 'sent' });
        expect(await screen.findByText('Bonjour Amina')).toBeTruthy();
        expect(rig.spoken).toEqual([]);
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
        fireEvent.click(await screen.findByTestId('hear-original-toggle'));
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(1));
        receive({ t: 'voice', v: 1, id: 'vt10', state: 'start', durationMs: 800 });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(DUCKED_REMOTE_VOLUME));
        receive({ t: 'voice', v: 1, id: 'vt10', state: 'end' });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(1));
        receive({ t: 'voice', v: 1, id: 'vt10', state: 'failed', reason: 'voix HD au-delà du budget (6 s)' });
        await waitFor(() => expect(rig.spoken).toEqual(['Bonjour Amina']));
        expect(rig.spokenOptions[0]).toEqual({ browserOnly: true });
    });

    it('RÉCEPTEUR : la piste interprète reçue est jouée par un élément audio dédié ; l’original est MUET (muted, pas seulement volume 0 — iPhone)', async () => {
        const attach = vi.fn();
        rig.interpreterTrack = { participantIdentity: 'peer-ivan', kind: 'audio', name: 'interpreter', attach, detach: vi.fn(), setVolume: vi.fn() };
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        const interp = await screen.findByTestId('interpreter-audio') as HTMLAudioElement;
        expect(attach).toHaveBeenCalledWith(interp);
        expect(interp.muted).toBe(false);
        const original = screen.getByTestId('original-audio') as HTMLAudioElement;
        expect(original.muted).toBe(false);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(original.muted).toBe(true));
        fireEvent.click(await screen.findByTestId('hear-original-toggle'));
        await waitFor(() => expect(original.muted).toBe(false));
        // « Sous-titres seuls » : la voix reçue est coupée.
        fireEvent.click(screen.getByText('Voix'));
        await waitFor(() => expect(interp.muted).toBe(true));
    });

    it('RÉCEPTEUR : seule la piste qui m’est destinée est jouée — « interpreter:<mon compte> » oui, celle d’un autre compte non', async () => {
        rig.interpreterTrack = { participantIdentity: 'agent', kind: 'audio', name: 'interpreter:someone-else', attach: vi.fn(), detach: vi.fn() };
        const { unmount } = render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        await new Promise((r) => setTimeout(r, 20));
        expect(screen.queryByTestId('interpreter-audio')).toBeNull();
        unmount();
        rig.interpreterTrack = { participantIdentity: 'agent', kind: 'audio', name: 'interpreter:me', attach: vi.fn(), detach: vi.fn() };
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        expect(await screen.findByTestId('interpreter-audio')).toBeTruthy();
    });

    it('langue DÉTECTÉE prioritaire : déclaré « anglais » mais parle français (ma langue) → l’original n’est PAS coupé ; une nouvelle déclaration remet la détection à zéro', async () => {
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'en' });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
        receive({ t: 'caption', v: 1, id: 'd1', text: 'Bonjour Amina, je parle français', lang: 'fr', final: true, ts: 30 });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(1));
        expect(screen.queryByTestId('hear-original-toggle')).toBeNull();
        expect(rig.spoken).toEqual([]);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        await waitFor(() => expect(rig.setVolume).toHaveBeenLastCalledWith(0));
    });

    it('sélecteur « Ma langue » dans l’écran d’appel : pendant l’appel ET dès la sonnerie ; le choix remonte au profil et déverrouille l’audio', async () => {
        const onLanguageChange = vi.fn();
        const { unmount } = render(<ChatCallModal callSession={session} hearLanguage={null} onHearLanguageChange={onLanguageChange} {...props} />);
        const select = await screen.findByTestId('call-language-select') as HTMLSelectElement;
        expect(select.value).toBe('');
        expect(screen.getByText(/Vous entendez la voix originale de Ivan\. Choisissez une langue pour l’entendre traduit/)).toBeTruthy();
        expect(screen.getByText('Appel normal · voix originales')).toBeTruthy();
        fireEvent.change(select, { target: { value: 'fr' } });
        expect(onLanguageChange).toHaveBeenCalledWith('fr');
        expect(rig.unlock).toHaveBeenCalled();
        unmount();
        // Appel entrant, pas encore décroché : je choisis ma langue AVANT de répondre.
        render(<ChatCallModal callSession={{ ...session, status: 'ringing' }} hearLanguage="fr" isIncoming onHearLanguageChange={onLanguageChange} {...props} />);
        expect((await screen.findByTestId('call-language-select') as HTMLSelectElement).value).toBe('fr');
        expect(screen.getByText('Traduction vocale pour cet appel')).toBeTruthy();
        expect(screen.getByText(/Vous entendrez Amina en Français/)).toBeTruthy();
    });

    it('sans possibilité de changer la langue (pas de profil), aucun sélecteur ; le panneau reste celui de l’interprète', async () => {
        render(<ChatCallModal callSession={session} hearLanguage="fr" {...props} />);
        receive({ t: 'hello', v: 1, lang: 'ru' });
        expect(await screen.findByText(/Interprète IA · Русский → Français/)).toBeTruthy();
        expect(screen.queryByTestId('call-language-select')).toBeNull();
    });
});
