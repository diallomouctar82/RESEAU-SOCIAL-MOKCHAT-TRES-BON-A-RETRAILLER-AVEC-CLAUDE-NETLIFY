import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * VF-4 — `ServerCaptioner` : ma voix, découpée en segments, transcrite (et
 * traduite) par la passerelle. Le découpeur Web Audio est remplacé par un
 * double qui émet des segments à la demande ; la passerelle par un espion.
 * Ce qui est vérifié est la LOGIQUE réelle : attente de la piste micro,
 * forme de la requête (WAV base64, indication de langue, cible, budget de
 * temps), gestion de la file (1 en vol + une file FIFO bornée à 3 — mission
 * VT, l'ancienne règle « le plus récent gagne » perdait des phrases), texte
 * vide ignoré, 3 échecs → indisponible, pause pendant que l'interprète
 * parle, arrêt net.
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
        /** Simule un segment détecté : 500 ms de PCM, clos par un silence sauf indication contraire. */
        emit(durationMs = 500, closedBy: 'silence' | 'max' | 'pause' | 'flush' = 'silence') {
            this.options.onSegment(new Int16Array(Math.round((16000 * durationMs) / 1000)).fill(1234), durationMs, closedBy);
        }
    }
    return { ...real, PcmSegmenter: FakePcmSegmenter, blobToWav16kMono: rig.wavFromBlob };
});

const { ServerCaptioner, transcribeVoiceRecording, STT_REQUEST_TIMEOUT_MS, MAX_QUEUED_SEGMENTS, STT_COOLDOWNS_MS } = await import('../services/calls/callInterpreter');

const liveTrack = () => ({ readyState: 'live', addEventListener: vi.fn(), removeEventListener: vi.fn() } as unknown as MediaStreamTrack);

const flush = async () => { for (let i = 0; i < 5; i++) await Promise.resolve(); };

/** Durée (ms) du segment WAV 16 kHz 16 bits reçu par la passerelle — identifie sans ambiguïté QUEL segment est parti. */
const wavMs = (audioBase64: string) => Math.round(((Buffer.from(audioBase64, 'base64').length - 44) / 2 / 16000) * 1000);

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
        // Mission VT : budget de temps par requête (8 s) — une phrase qui arrive 30 s plus tard est périmée.
        expect(STT_REQUEST_TIMEOUT_MS).toBe(8000);
        expect(input).toMatchObject({ mimeType: 'audio/wav', languageHint: 'ru', targetLanguage: 'fr', timeoutMs: STT_REQUEST_TIMEOUT_MS });
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

    it('Mission VT — 1 requête en vol + file FIFO : les segments en attente partent dans l’ORDRE de parole, aucun n’est perdu tant que la file n’est pas pleine', async () => {
        let resolveFirst!: (value: unknown) => void;
        rig.transcribe.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }));
        rig.transcribe.mockImplementation(async (input: { audioBase64: string }) => ({ text: `segment-${wavMs(input.audioBase64)}`, language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' }));
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        const segmenter = rig.segmenters[0];
        segmenter.emit(400);   // en vol (serveur lent)
        segmenter.emit(500);   // en attente (1)
        segmenter.emit(600);   // en attente (2)
        segmenter.emit(700);   // en attente (3)
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(1);
        resolveFirst({ text: 'premier', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        for (let i = 0; i < 8; i++) await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(4);
        expect(rig.transcribe.mock.calls.slice(1).map((c) => wavMs(c[0].audioBase64))).toEqual([500, 600, 700]);
        expect(onFinal.mock.calls.map((c) => c[0].text)).toEqual(['premier', 'segment-500', 'segment-600', 'segment-700']);
    });

    it('Mission VT — file pleine (3 en attente) : le plus ANCIEN cède la place, la conversation reste actuelle', async () => {
        expect(MAX_QUEUED_SEGMENTS).toBe(3);
        let resolveFirst!: (value: unknown) => void;
        rig.transcribe.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }));
        rig.transcribe.mockImplementation(async (input: { audioBase64: string }) => ({ text: `segment-${wavMs(input.audioBase64)}`, language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' }));
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        const segmenter = rig.segmenters[0];
        segmenter.emit(400);   // en vol
        segmenter.emit(500);   // en attente — sera le seul abandonné
        segmenter.emit(600);
        segmenter.emit(700);
        segmenter.emit(800);   // file pleine : 500 cède la place
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(1);
        resolveFirst({ text: 'premier', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        for (let i = 0; i < 8; i++) await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(4);
        expect(rig.transcribe.mock.calls.slice(1).map((c) => wavMs(c[0].audioBase64))).toEqual([600, 700, 800]);
        expect(onFinal.mock.calls.map((c) => c[0].text)).toEqual(['premier', 'segment-600', 'segment-700', 'segment-800']);
    });

    it('Mission VT — stop() vide la file : aucun segment en attente ne part après l’arrêt', async () => {
        let resolveFirst!: (value: unknown) => void;
        rig.transcribe.mockImplementationOnce(() => new Promise((resolve) => { resolveFirst = resolve; }));
        rig.transcribe.mockResolvedValue({ text: 'x', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal: vi.fn() });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        rig.segmenters[0].emit(400);
        rig.segmenters[0].emit(500);
        await flush();
        captioner.stop();
        resolveFirst({ text: 'premier', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        for (let i = 0; i < 4; i++) await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(1);
    });

    it('Mission VT — 3 échecs consécutifs → PAUSE (8 s) puis nouvel essai, jamais un abandon définitif ; retour signalé', async () => {
        expect(STT_COOLDOWNS_MS).toEqual([8000, 16000, 30000]);
        rig.transcribe.mockRejectedValue(new Error('Aucun fournisseur actif et configuré pour cette catégorie.'));
        const onUnavailable = vi.fn();
        const onDegraded = vi.fn();
        const onRecovered = vi.fn();
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal, onUnavailable, onDegraded, onRecovered });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        const segmenter = rig.segmenters[0];
        for (let i = 0; i < 3; i++) { segmenter.emit(); await flush(); }
        expect(rig.transcribe).toHaveBeenCalledTimes(3);
        expect(onUnavailable).not.toHaveBeenCalled(); // plus jamais « indisponible » pour une panne de passerelle
        expect(onDegraded).toHaveBeenCalledTimes(1);
        expect(onDegraded.mock.calls[0][0]).toMatch(/Transcription serveur en difficulté \(Aucun fournisseur actif/);
        expect(onDegraded.mock.calls[0][1]).toBe(8000);
        expect(segmenter.stopped).toBe(false); // la capture continue
        // Pendant la pause : les segments sont abandonnés, aucune requête.
        await vi.advanceTimersByTimeAsync(4000);
        segmenter.emit(); await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(3);
        // Après la pause : nouvel essai ; la passerelle répond → rétabli.
        rig.transcribe.mockResolvedValue({ text: 'de retour', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        await vi.advanceTimersByTimeAsync(4100);
        segmenter.emit(); await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(4);
        expect(onRecovered).toHaveBeenCalledTimes(1);
        expect(onFinal.mock.calls.map((c) => c[0].text)).toEqual(['de retour']);
    });

    it('Mission VT — pauses croissantes (8 s, 16 s, 30 s) tant que la passerelle échoue ; remises à zéro par un succès', async () => {
        rig.transcribe.mockRejectedValue(new Error('x'));
        const onDegraded = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, onFinal: vi.fn(), onDegraded });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        const segmenter = rig.segmenters[0];
        for (let i = 0; i < 3; i++) { segmenter.emit(); await flush(); }
        expect(onDegraded.mock.calls.map((c) => c[1])).toEqual([8000]);
        await vi.advanceTimersByTimeAsync(8100);
        for (let i = 0; i < 3; i++) { segmenter.emit(); await flush(); }
        expect(onDegraded.mock.calls.map((c) => c[1])).toEqual([8000, 16000]);
        await vi.advanceTimersByTimeAsync(16100);
        for (let i = 0; i < 3; i++) { segmenter.emit(); await flush(); }
        expect(onDegraded.mock.calls.map((c) => c[1])).toEqual([8000, 16000, 30000]);
        await vi.advanceTimersByTimeAsync(30100);
        rig.transcribe.mockResolvedValueOnce({ text: 'ok', language: 'fr', translated: null, targetLanguage: null, providerId: 'gemini_stt' });
        segmenter.emit(); await flush();
        rig.transcribe.mockRejectedValue(new Error('x'));
        for (let i = 0; i < 3; i++) { segmenter.emit(); await flush(); }
        expect(onDegraded.mock.calls.map((c) => c[1])).toEqual([8000, 16000, 30000, 8000]); // un succès remet la série à zéro
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

    it('segment clos PAR l\'entrée en pause (ma voix d\'avant que l\'interprète parle) : transcrit même si la pause est en cours', async () => {
        rig.transcribe.mockResolvedValue({ text: 'oui', language: 'fr', translated: 'да', targetLanguage: 'ru', providerId: 'gemini_stt' });
        const onFinal = vi.fn();
        const captioner = new ServerCaptioner({ getTrack: liveTrack, targetLanguage: 'ru', onFinal, isPaused: () => true });
        captioner.start();
        await vi.advanceTimersByTimeAsync(10);
        rig.segmenters[0].emit(6000, 'pause');
        await flush();
        expect(rig.transcribe).toHaveBeenCalledTimes(1);
        expect(wavMs(rig.transcribe.mock.calls[0][0].audioBase64)).toBe(6000);
        expect(onFinal).toHaveBeenCalledWith({ text: 'oui', language: 'fr', translated: 'да', targetLang: 'ru' });
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
