import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * VF-4 — `ServerCaptioner` : ma voix, découpée en segments, transcrite (et
 * traduite) par la passerelle. Le découpeur Web Audio est remplacé par un
 * double qui émet des segments à la demande ; la passerelle par un espion.
 * Ce qui est vérifié est la LOGIQUE réelle : attente de la piste micro,
 * forme de la requête (WAV base64, indication de langue, cible), gestion de
 * la file (1 en vol + 1 en attente, le plus récent gagne), texte vide ignoré,
 * 3 échecs → indisponible, pause pendant que l'interprète parle, arrêt net.
 */

const rig = vi.hoisted(() => ({
    transcribe: vi.fn(),
    segmenters: [] as any[],
    supported: true,
    wavFromBlob: vi.fn(),
}));

vi.mock('../services/aiGateway', () => ({
    transcribeSpeechDetailed: rig.transcribe,
    generateSpeechDetailed: vi.fn(),
}));

vi.mock('../services/calls/pcmSegmenter', async (importOriginal) => {
    const real = await importOriginal<typeof import('../services/calls/pcmSegmenter')>();
    class FakePcmSegmenter {
        static isSupported() { return rig.supported; }
        started = false;
        stopped = false;
        constructor(public readonly options: any) { rig.segmenters.push(this); }
        async start() { this.started = true; }
        stop() { this.stopped = true; }
        pause() {}
        resume() {}
        /** Simule un segment détecté : 500 ms de PCM. */
        emit(durationMs = 500) {
            this.options.onSegment(new Int16Array(Math.round((16000 * durationMs) / 1000)).fill(1234), durationMs);
        }
    }
    return { ...real, PcmSegmenter: FakePcmSegmenter, blobToWav16kMono: rig.wavFromBlob };
});

const { ServerCaptioner, transcribeVoiceRecording } = await import('../services/calls/callInterpreter');

const liveTrack = () => ({ readyState: 'live', addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaStreamTrack);

const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

beforeEach(() => {
    vi.useFakeTimers();
    rig.transcribe.mockReset();
    rig.wavFromBlob.mockReset();
    rig.segmenters.length = 0;
    rig.supported = true;
});

afterEach(() => {
    vi.useRealTimers();
});

describe('ServerCaptioner — transcription serveur de ma voix', () => {
    it('attend la publication de la piste micro (elle suit la connexion de peu) puis s\'y attache', async () => {
        let track: MediaStreamTrack | null = null;
        const captioner = new ServerCaptioner({ getTrack: () => track, onFinal: vi.fn() });
        expect(captioner.start()).toBe(true);
        expect(rig.segmenters).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(600);
        expect(rig.segmenters).toHaveLength(0);
        track = liveTrack();
        await vi.advanceTimersByTimeAsync(300);
        expect(rig.segmenters).toHaveLength(1);
        expect(rig.segmenters[0].started).toBe(true);
        captioner.stop();
        expect(rig.segmenters[0].stopped).toBe(true);
    });

    it('aucune piste dans les 12 s → indisponible (le composant bascule sur son repli)', async () => {
        const onUnavailable = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: () => null, onFinal: vi.fn(), onUnavailable });
        captioner.start();
        await vi.advanceTimersByTimeAsync(12_500);
        expect(onUnavailable).toHaveBeenCalledWith('Micro indisponible pour la transcription.');
        expect(rig.segmenters).toHaveLength(0);
    });

    it('un segment part en WAV base64 avec indication et cible ; le texte, la langue et la traduction reviennent', async () => {
        rig.transcribe.mockResolvedValue({ text: 'Привет, Амина!', language: 'ru', translated: 'Bonjour, Amina !', targetLanguage: 'fr', providerId: 'gemini_stt' });
        const onFinal = vi.fn();
        const onInterim = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, languageHint: 'ru', targetLanguage: 'fr', onFinal, onInterim });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        rig.segmenters[0].emit(500);
        await flush();

        expect(rig.transcribe).toHaveBeenCalledTimes(1);
        const input = rig.transcribe.mock.calls[0][0];
        expect(input).toMatchObject({ mimeType: 'audio/wav', languageHint: 'ru', targetLanguage: 'fr' });
        const wav = Buffer.from(input.audioBase64, 'base64');
        expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
        expect(wav.readUInt32LE(24)).toBe(16000);
        expect(wav.length).toBe(44 + 8000 * 2); // 500 ms à 16 kHz, 16 bits
        expect(onFinal).toHaveBeenCalledWith({ text: 'Привет, Амина!', language: 'ru', translated: 'Bonjour, Amina !', targetLang: 'fr' });
        expect(onInterim.mock.calls.map((c) => c[0])).toEqual(['Transcription…', '']);
    });

    it('fournisseur sans langue ni traduction (Deepgram) : langue = indication donnée, traduction null', async () => {
        rig.transcribe.mockResolvedValue({ text: 'Bonjour à tous', language: '', translated: null, targetLanguage: null, providerId: 'deepgram' });
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, languageHint: 'fr', targetLanguage: 'ru', onFinal });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        rig.segmenters[0].emit();
        await flush();
        expect(onFinal).toHaveBeenCalledWith({ text: 'Bonjour à tous', language: 'fr', translated: null, targetLang: null });
    });

    it('texte vide (silence, bruit) → rien n\'est remonté, rien n\'est inventé', async () => {
        rig.transcribe.mockResolvedValue({ text: '', language: '', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        rig.segmenters[0].emit();
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(1);
        expect(onFinal).not.toHaveBeenCalled();
    });

    it('au plus 1 requête en vol + 1 en attente : le segment le plus récent gagne, les intermédiaires sont abandonnés', async () => {
        let resolveFirst!: (value: unknown) => void;
        rig.transcribe.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }));
        rig.transcribe.mockResolvedValue({ text: 'dernier', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        const segmenter = rig.segmenters[0];
        segmenter.emit(400);   // en vol
        segmenter.emit(500);   // en attente…
        segmenter.emit(600);   // …remplacé par celui-ci
        segmenter.emit(700);   // …puis par celui-ci (le plus récent)
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(1);
        resolveFirst({ text: 'premier', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(2);
        const secondWav = Buffer.from(rig.transcribe.mock.calls[1][0].audioBase64, 'base64');
        expect(secondWav.length).toBe(44 + Math.round(16000 * 0.7) * 2); // c'est bien le segment de 700 ms
        expect(onFinal.mock.calls.map((c) => c[0].text)).toEqual(['premier', 'dernier']);
    });

    it('3 échecs consécutifs → indisponible, arrêt, plus aucune requête', async () => {
        rig.transcribe.mockRejectedValue(new Error('Aucun fournisseur actif et configuré pour cette catégorie.'));
        const onUnavailable = vi.fn();
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal, onUnavailable });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        const segmenter = rig.segmenters[0];
        for (let i = 0; i < 3; i++) { segmenter.emit(); await flush(); }
        expect(rig.transcribe).toHaveBeenCalledTimes(3);
        expect(onUnavailable).toHaveBeenCalledTimes(1);
        expect(onUnavailable.mock.calls[0][0]).toMatch(/Transcription serveur indisponible \(Aucun fournisseur actif/);
        expect(segmenter.stopped).toBe(true);
        segmenter.emit();
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(3);
        expect(onFinal).not.toHaveBeenCalled();
    });

    it('un succès remet le compteur d\'échecs à zéro', async () => {
        rig.transcribe
            .mockRejectedValueOnce(new Error('x')).mockRejectedValueOnce(new Error('x'))
            .mockResolvedValueOnce({ text: 'ok', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' })
            .mockRejectedValueOnce(new Error('x')).mockRejectedValueOnce(new Error('x'));
        const onUnavailable = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal: vi.fn(), onUnavailable });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        for (let i = 0; i < 5; i++) { rig.segmenters[0].emit(); await flush(); }
        expect(rig.transcribe).toHaveBeenCalledTimes(5);
        expect(onUnavailable).not.toHaveBeenCalled();
    });

    it('segment capté pendant que l\'interprète parle : abandonné, jamais envoyé', async () => {
        rig.transcribe.mockResolvedValue({ text: 'x', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        let paused = true;
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal: vi.fn(), isPaused: () => paused });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        const segmenter = rig.segmenters[0];
        expect(segmenter.options.isPaused()).toBe(true); // le découpeur reçoit la même règle
        segmenter.emit();
        await flush();
        expect(rig.transcribe).not.toHaveBeenCalled();
        paused = false;
        segmenter.emit();
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(1);
    });

    it('stop() pendant une requête en vol : la réponse tardive n\'est jamais remontée', async () => {
        let resolveIt!: (value: unknown) => void;
        rig.transcribe.mockImplementationOnce(() => new Promise((resolve) => { resolveIt = resolve; }));
        const onFinal = vi.fn();
        const onInterim = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal, onInterim });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        rig.segmenters[0].emit();
        await flush();
        captioner.stop();
        resolveIt({ text: 'trop tard', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        await flush();
        expect(onFinal).not.toHaveBeenCalled();
        expect(onInterim.mock.calls.map((c) => c[0])).toEqual(['Transcription…']); // pas de '' après l'arrêt : plus aucun rappel
    });

    it('piste micro terminée (changement de micro) : rattachement à la nouvelle piste', async () => {
        const first = liveTrack();
        const second = liveTrack();
        let current: MediaStreamTrack | null = first;
        const captioner = new ServerCaptioner({ getTrack: () => current, onFinal: vi.fn() });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        expect(rig.segmenters).toHaveLength(1);
        current = second;
        rig.segmenters[0].options.onError('Piste micro terminée.');
        await vi.advanceTimersByTimeAsync(10);
        expect(rig.segmenters).toHaveLength(2);
        expect(rig.segmenters[0].stopped).toBe(true);
        expect(rig.segmenters[1].options.track).toBe(second);
        captioner.stop();
    });

    it('sans Web Audio : start() refuse et le dit', () => {
        rig.supported = false;
        const onUnavailable = vi.fn();
        expect(ServerCaptioner.isSupported()).toBe(false);
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal: vi.fn(), onUnavailable });
        expect(captioner.start()).toBe(false);
        expect(onUnavailable).toHaveBeenCalledWith('Capture audio non disponible sur ce navigateur.');
    });
});

describe('transcribeVoiceRecording — vocal enregistré, transcrit par le serveur', () => {
    // FileReader (repli de lecture du blob, jsdom n'a pas Blob.arrayBuffer) a besoin des vraies horloges.
    beforeEach(() => { vi.useRealTimers(); });

    it('décode le vocal en WAV 16 kHz et renvoie le texte avec la langue DÉTECTÉE', async () => {
        rig.wavFromBlob.mockResolvedValue({ wav: new Uint8Array([82, 73, 70, 70, 0, 0, 0, 0]), durationMs: 1200 });
        rig.transcribe.mockResolvedValue({ text: 'Привет Амина', language: 'ru-RU', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        const result = await transcribeVoiceRecording(new Blob([new Uint8Array([1, 2, 3])], { type: 'audio/webm;codecs=opus' }), 'fr');
        expect(rig.transcribe).toHaveBeenCalledWith({ audioBase64: Buffer.from([82, 73, 70, 70, 0, 0, 0, 0]).toString('base64'), mimeType: 'audio/wav', languageHint: 'fr' });
        expect(result).toEqual({ text: 'Привет Амина', language: 'ru' });
    });

    it('navigateur incapable de décoder son conteneur : l\'audio brut part avec son type réel ; langue = indication si non détectée', async () => {
        rig.wavFromBlob.mockRejectedValue(new Error('decodeAudioData indisponible'));
        rig.transcribe.mockResolvedValue({ text: 'Bonjour', language: '', translated: null, targetLanguage: null, providerId: 'deepgram' });
        const bytes = new Uint8Array([9, 8, 7, 6]);
        const result = await transcribeVoiceRecording(new Blob([bytes], { type: 'audio/mp4' }), 'fr');
        expect(rig.transcribe).toHaveBeenCalledWith({ audioBase64: Buffer.from(bytes).toString('base64'), mimeType: 'audio/mp4', languageHint: 'fr' });
        expect(result).toEqual({ text: 'Bonjour', language: 'fr' });
    });

    it('échec de la passerelle → rejet explicite (le composant l\'affiche, le vocal part quand même)', async () => {
        rig.wavFromBlob.mockResolvedValue({ wav: new Uint8Array([1]), durationMs: 10 });
        rig.transcribe.mockRejectedValue(new Error('Aucun fournisseur actif et configuré pour cette catégorie.'));
        await expect(transcribeVoiceRecording(new Blob([new Uint8Array([1])], { type: 'audio/webm' }), 'fr'))
            .rejects.toThrow('Aucun fournisseur actif');
    });
});
