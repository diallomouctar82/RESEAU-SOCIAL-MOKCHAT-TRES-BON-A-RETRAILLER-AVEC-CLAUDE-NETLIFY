import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Mission VT — `InterpreterVoice` : la voix qui lit, dans MA langue, la
 * traduction de ce que dit l'autre. Vérifié ici, sans navigateur réel : la
 * voix HD (passerelle) est jouée quand elle arrive dans le budget ; au-delà
 * de 6 s, ou si le fournisseur tombe (« réponse sans audio »), la voix du
 * navigateur prend le relais — jamais un silence qui s'allonge pendant que
 * l'autre parle ; en retard de plusieurs phrases, la voix immédiate du
 * navigateur est préférée ; stop() coupe net.
 */

const rig = vi.hoisted(() => ({
    tts: vi.fn(),
    audios: [] as Array<{ src: string; onended: (() => void) | null; onerror: (() => void) | null; paused: boolean }>,
    utterances: [] as Array<{ text: string; lang: string; onend: (() => void) | null; onerror: (() => void) | null }>,
}));

vi.mock('../services/aiGateway', () => ({
    generateSpeechDetailed: rig.tts,
    transcribeSpeechDetailed: vi.fn(),
}));

const { InterpreterVoice, InterpreterVoiceTrack, HD_VOICE_BUDGET_MS, TRACK_VOICE_BUDGET_MS, TRACK_QUEUE_MAX, VOICE_BACKLOG_THRESHOLD, unlockInterpreterAudio, __resetInterpreterAudioForTests } = await import('../services/calls/callInterpreter');

/** Élément audio factice : « joue » 50 ms puis signale la fin. */
class FakeAudio {
    onended: (() => void) | null = null;
    onerror: (() => void) | null = null;
    paused = false;
    constructor(public readonly src: string) { rig.audios.push(this); }
    play() { setTimeout(() => this.onended?.(), 50); return Promise.resolve(); }
    pause() { this.paused = true; }
}

class FakeUtterance {
    lang = '';
    voice: unknown = null;
    rate = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public readonly text: string) {}
}

const synth = {
    getVoices: () => [],
    speak: (u: FakeUtterance) => { rig.utterances.push(u); setTimeout(() => u.onend?.(), 30); },
    cancel: vi.fn(),
};

beforeEach(() => {
    vi.useFakeTimers();
    rig.tts.mockReset();
    rig.audios.length = 0;
    rig.utterances.length = 0;
    synth.cancel.mockClear();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
    vi.stubGlobal('speechSynthesis', synth);
    (window as unknown as { speechSynthesis: unknown }).speechSynthesis = synth;
});

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

/**
 * Mission VT — `InterpreterVoiceTrack` : la voix de l'interprète que J'ENVOIE
 * au correspondant DANS l'appel (Web Audio → MediaStream → piste WebRTC),
 * vérifiée sur un contexte audio factice : décodage, source branchée sur la
 * sortie de la piste, « started » seulement quand du son entre, « ended » à la
 * fin (ou par le chien de garde), échecs honnêtes (budget, fournisseur,
 * contexte suspendu, audio illisible), stop() net, réveil au geste.
 */
describe('InterpreterVoiceTrack — la voix de l’interprète rendue DANS l’appel (Mission VT)', () => {
    class FakeSource {
        buffer: unknown = null;
        onended: (() => void) | null = null;
        started = false;
        stopped = false;
        connectedTo: unknown = null;
        connect(dest: unknown) { this.connectedTo = dest; }
        start() { this.started = true; }
        stop() { this.stopped = true; }
    }
    const destTrack = { kind: 'audio', id: 'interp', stop: vi.fn() };
    class FakeDestination { stream = { getAudioTracks: () => [destTrack], getTracks: () => [destTrack] }; }
    const audio = { contexts: [] as FakeAudioContext[], sources: [] as FakeSource[], resumeWorks: true, decodeFails: false, durationSec: 1.5 };
    class FakeAudioContext {
        state: 'suspended' | 'running' | 'closed' = 'running';
        resumeCalls = 0;
        constructor() { audio.contexts.push(this); }
        createMediaStreamDestination() { return new FakeDestination(); }
        createBufferSource() { const s = new FakeSource(); audio.sources.push(s); return s; }
        decodeAudioData(_buffer: ArrayBuffer, ok: (b: unknown) => void, fail: (e: unknown) => void) {
            if (audio.decodeFails) fail(new Error('corrompu')); else ok({ duration: audio.durationSec });
        }
        resume() { this.resumeCalls += 1; if (audio.resumeWorks) this.state = 'running'; return Promise.resolve(); }
        close() { this.state = 'closed'; return Promise.resolve(); }
    }
    const tick = async (ms = 1) => { await vi.advanceTimersByTimeAsync(ms); };
    const hd = () => rig.tts.mockResolvedValue({ audioBase64: btoa('abcd'), mimeType: 'audio/wav' });

    beforeEach(() => {
        audio.contexts.length = 0;
        audio.sources.length = 0;
        audio.resumeWorks = true;
        audio.decodeFails = false;
        audio.durationSec = 1.5;
        destTrack.stop.mockClear();
        vi.stubGlobal('AudioContext', FakeAudioContext);
        vi.stubGlobal('MediaStream', class {});
        (window as unknown as { AudioContext: unknown }).AudioContext = FakeAudioContext;
        (window as unknown as { MediaStream: unknown }).MediaStream = class {};
        __resetInterpreterAudioForTests();
    });

    it('isSupported : Web Audio avec sortie MediaStream requis — faux sans AudioContext', () => {
        expect(InterpreterVoiceTrack.isSupported()).toBe(true);
        vi.stubGlobal('AudioContext', undefined);
        (window as unknown as { AudioContext: unknown }).AudioContext = undefined;
        expect(InterpreterVoiceTrack.isSupported()).toBe(false);
    });

    it('start() crée le contexte UNE fois et renvoie la piste à publier (toujours la même)', () => {
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU' });
        expect(voice.track).toBeNull();
        const t1 = voice.start();
        const t2 = voice.start();
        expect(t1).toBe(destTrack);
        expect(t2).toBe(destTrack);
        expect(voice.track).toBe(destTrack);
        expect(audio.contexts).toHaveLength(1);
    });

    it('phrase rendue : voix HD décodée → source branchée sur la sortie de la piste → « started » quand le son entre → « ended » à la fin', async () => {
        hd();
        const reports: Array<Record<string, unknown>> = [];
        const speaking: boolean[] = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r), onSpeakingChange: (s) => speaking.push(s) });
        voice.start();
        voice.speak('p1', ' Привет Иван ');
        await tick();
        // La langue de lecture voyage avec le texte (une voix-modèle de langage traduisait sinon en parlant).
        expect(rig.tts).toHaveBeenCalledWith('Привет Иван', expect.objectContaining({ timeoutMs: TRACK_VOICE_BUDGET_MS, language: 'ru-RU' }));
        expect(reports.map((r) => r.status)).toEqual(['generated', 'started']);
        expect(reports[0]).toMatchObject({ id: 'p1', durationMs: 1500, bytes: btoa('abcd').length });
        expect(reports[1]).toMatchObject({ id: 'p1', durationMs: 1500 });
        expect(audio.sources).toHaveLength(1);
        expect(audio.sources[0].started).toBe(true);
        expect(audio.sources[0].connectedTo).toBeInstanceOf(FakeDestination);
        expect(voice.isSpeaking).toBe(true);
        expect(speaking).toEqual([true]);
        audio.sources[0].onended?.();
        await tick();
        expect(reports.map((r) => r.status)).toEqual(['generated', 'started', 'ended']);
        expect(voice.isSpeaking).toBe(false);
        expect(speaking).toEqual([true, false]);
    });

    it('les phrases se suivent, jamais ne se chevauchent : la seconde n’est générée qu’après la fin de la première', async () => {
        hd();
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU' });
        voice.start();
        voice.speak('p1', 'Une');
        voice.speak('p2', 'Deux');
        await tick();
        expect(rig.tts).toHaveBeenCalledTimes(1);
        expect(audio.sources).toHaveLength(1);
        audio.sources[0].onended?.();
        await tick();
        expect(rig.tts).toHaveBeenCalledTimes(2);
        expect(rig.tts).toHaveBeenLastCalledWith('Deux', expect.anything());
        expect(audio.sources).toHaveLength(2);
    });

    it('voix HD au-delà du budget de la piste (12 s, plus large que les 6 s de la voix locale) : phrase déclarée en échec — le correspondant la dira lui-même — et la file continue', async () => {
        expect(TRACK_VOICE_BUDGET_MS).toBeGreaterThan(HD_VOICE_BUDGET_MS);
        rig.tts.mockReturnValueOnce(new Promise(() => {})).mockResolvedValue({ audioBase64: btoa('ok'), mimeType: 'audio/wav' });
        const reports: Array<Record<string, unknown>> = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r) });
        voice.start();
        voice.speak('p1', 'Lente');
        voice.speak('p2', 'Rapide');
        await tick(HD_VOICE_BUDGET_MS + 5);
        expect(reports).toEqual([]); // 6 s : rien n'est encore abandonné
        await tick(TRACK_VOICE_BUDGET_MS - HD_VOICE_BUDGET_MS + 5);
        expect(reports[0]).toEqual({ id: 'p1', status: 'failed', reason: 'voix HD au-delà du budget (12 s)' });
        expect(reports.filter((r) => r.id === 'p2').map((r) => r.status)).toEqual(['generated', 'started']);
    });

    it('file bornée : au-delà de 3 phrases en attente, la plus ancienne est abandonnée et signalée — jamais un retard qui s’accumule', async () => {
        rig.tts.mockReturnValue(new Promise(() => {})); // la première phrase ne finit jamais de se générer
        const reports: Array<Record<string, unknown>> = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r) });
        voice.start();
        voice.speak('p0', 'En cours');
        await tick();
        for (let i = 1; i <= TRACK_QUEUE_MAX + 2; i++) voice.speak(`p${i}`, `Phrase ${i}`);
        expect(reports.map((r) => `${r.id}:${r.status}`)).toEqual(['p1:failed', 'p2:failed']);
        expect(reports[0].reason).toMatch(/en retard de 3 phrases/);
    });

    it('mission LT : les phrases arrivées pendant qu’une voix se rend sont FUSIONNÉES en une seule voix HD — aucune abandonnée, chaque phrase annoncée début/fin', async () => {
        hd();
        const reports: Array<Record<string, unknown>> = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r) });
        voice.start();
        voice.speak('p0', 'Première');
        await tick(); // p0 se rend (source en cours de lecture)
        expect(rig.tts).toHaveBeenCalledTimes(1);
        for (let i = 1; i <= TRACK_QUEUE_MAX; i++) voice.speak(`p${i}`, `Phrase ${i}`);
        audio.sources[0].onended?.();
        await tick();
        // UNE seule synthèse pour les trois phrases en attente, texte joint dans l'ordre.
        expect(rig.tts).toHaveBeenCalledTimes(2);
        expect(rig.tts).toHaveBeenLastCalledWith('Phrase 1 Phrase 2 Phrase 3', expect.anything());
        expect(reports.filter((r) => r.status === 'failed')).toEqual([]);
        const generated = reports.filter((r) => r.status === 'generated');
        expect(generated).toHaveLength(2);
        expect(generated[1]).toMatchObject({ id: 'p1', merged: 3 });
        expect(reports.filter((r) => r.status === 'started').map((r) => r.id)).toEqual(['p0', 'p1', 'p2', 'p3']);
        audio.sources[1].onended?.();
        await tick();
        expect(reports.filter((r) => r.status === 'ended').map((r) => r.id)).toEqual(['p0', 'p1', 'p2', 'p3']);
        expect(audio.sources).toHaveLength(2);
    });

    it('mission LT : la fusion s’arrête à la longueur maximale (temps réel) — au-delà, une nouvelle voix', async () => {
        hd();
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU' });
        voice.start();
        voice.speak('p0', 'Première');
        await tick();
        const longue = 'x'.repeat(200);
        voice.speak('p1', longue);
        voice.speak('p2', longue); // 200 + 1 + 200 > TRACK_BATCH_MAX_CHARS : ne tient pas avec p1
        voice.speak('p3', 'courte');
        audio.sources[0].onended?.();
        await tick();
        expect(rig.tts).toHaveBeenCalledTimes(2);
        expect(rig.tts).toHaveBeenLastCalledWith(longue, expect.anything());
        audio.sources[1].onended?.();
        await tick();
        expect(rig.tts).toHaveBeenCalledTimes(3);
        expect(rig.tts).toHaveBeenLastCalledWith(`${longue} courte`, expect.anything());
    });

    it('fournisseur en échec : la raison réelle est rapportée, rien n’est joué', async () => {
        rig.tts.mockRejectedValue(new Error('réponse sans audio'));
        const reports: Array<Record<string, unknown>> = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r) });
        voice.start();
        voice.speak('p1', 'Bonjour');
        await tick();
        expect(reports).toEqual([{ id: 'p1', status: 'failed', reason: 'réponse sans audio' }]);
        expect(audio.sources).toHaveLength(0);
        expect(voice.isSpeaking).toBe(false);
    });

    it('contexte audio suspendu (iOS hors geste) : échec honnête ; unlockInterpreterAudio() dans un geste le réveille et la phrase suivante passe', async () => {
        hd();
        audio.resumeWorks = false;
        const reports: Array<Record<string, unknown>> = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r) });
        voice.start();
        audio.contexts[0].state = 'suspended';
        voice.speak('p1', 'Bonjour');
        await tick();
        expect(reports).toEqual([{ id: 'p1', status: 'failed', reason: 'contexte audio suspendu — un toucher de l’écran le réveille' }]);
        audio.resumeWorks = true;
        unlockInterpreterAudio();
        expect(audio.contexts[0].state).toBe('running');
        voice.speak('p2', 'Encore');
        await tick();
        expect(reports.filter((r) => r.id === 'p2').map((r) => r.status)).toEqual(['generated', 'started']);
    });

    it('audio HD illisible : échec avec la cause du décodage', async () => {
        hd();
        audio.decodeFails = true;
        const reports: Array<Record<string, unknown>> = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r) });
        voice.start();
        voice.speak('p1', 'Bonjour');
        await tick();
        expect(reports).toEqual([{ id: 'p1', status: 'failed', reason: 'audio HD illisible (corrompu)' }]);
    });

    it('stop() coupe net : source arrêtée, file vidée (la phrase suivante n’est jamais générée), « parle » à faux', async () => {
        hd();
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU' });
        voice.start();
        voice.speak('p1', 'Une');
        voice.speak('p2', 'Deux');
        await tick();
        expect(voice.isSpeaking).toBe(true);
        voice.stop();
        expect(audio.sources[0].stopped).toBe(true);
        expect(voice.isSpeaking).toBe(false);
        await tick(10_000);
        expect(rig.tts).toHaveBeenCalledTimes(1);
        // Une nouvelle phrase après stop() repart normalement.
        voice.speak('p3', 'Trois');
        await tick();
        expect(rig.tts).toHaveBeenCalledTimes(2);
    });

    it('chien de garde : une source qui ne signale jamais sa fin libère la file après sa durée + 2 s', async () => {
        hd();
        const reports: Array<Record<string, unknown>> = [];
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU', onPhrase: (r) => reports.push(r) });
        voice.start();
        voice.speak('p1', 'Une');
        await tick();
        expect(reports.map((r) => r.status)).toEqual(['generated', 'started']);
        await tick(1500 + 2000 + 5);
        expect(reports.map((r) => r.status)).toEqual(['generated', 'started', 'ended']);
        expect(voice.isSpeaking).toBe(false);
    });

    it('unlockInterpreterAudio() : réveille les contextes vivants et amorce la synthèse du navigateur UNE seule fois, sans jamais lever', () => {
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU' });
        voice.start();
        audio.contexts[0].state = 'suspended';
        const before = audio.contexts[0].resumeCalls;
        unlockInterpreterAudio();
        unlockInterpreterAudio();
        expect(audio.contexts[0].resumeCalls).toBeGreaterThan(before);
        expect(audio.contexts[0].state).toBe('running');
        expect(rig.utterances).toHaveLength(1);
        expect(rig.utterances[0].text).toBe('');
        expect((rig.utterances[0] as unknown as { volume: number }).volume).toBe(0);
    });

    it('dispose() : piste et contexte libérés, plus jamais réveillé par un geste', () => {
        const voice = new InterpreterVoiceTrack({ lang: 'ru-RU' });
        voice.start();
        voice.dispose();
        expect(destTrack.stop).toHaveBeenCalled();
        expect(audio.contexts[0].state).toBe('closed');
        expect(voice.track).toBeNull();
        const calls = audio.contexts[0].resumeCalls;
        unlockInterpreterAudio();
        expect(audio.contexts[0].resumeCalls).toBe(calls);
        expect(() => voice.start()).toThrow(/déjà libéré/);
    });
});

describe('InterpreterVoice — voix de l’interprète garantie (Mission VT)', () => {
    it('voix HD dans le budget : jouée telle quelle, le navigateur n’est pas sollicité, l’état « parle » encadre la lecture', async () => {
        rig.tts.mockResolvedValue({ audioBase64: 'QUJD', mimeType: 'audio/mpeg' });
        const speaking: boolean[] = [];
        const voice = new InterpreterVoice({ lang: 'fr-FR', onSpeakingChange: (s) => speaking.push(s) });
        voice.speak('Bonjour Ivan.');
        await vi.advanceTimersByTimeAsync(200);
        // La langue de LECTURE part avec le texte : Gemini TTS, modèle de langage, traduisait sinon en parlant (banc VT).
        expect(rig.tts).toHaveBeenCalledWith('Bonjour Ivan.', { timeoutMs: HD_VOICE_BUDGET_MS, language: 'fr-FR' });
        expect(rig.audios.map((a) => a.src)).toEqual(['data:audio/mpeg;base64,QUJD']);
        expect(rig.utterances).toHaveLength(0);
        expect(speaking).toEqual([true, false]);
    });

    it('voix HD au-delà du budget (6 s) : la voix du navigateur prend le relais dans MA langue ; la réponse tardive est ignorée', async () => {
        expect(HD_VOICE_BUDGET_MS).toBe(6000);
        let resolveLate!: (value: unknown) => void;
        rig.tts.mockImplementation(() => new Promise((resolve) => { resolveLate = resolve; }));
        const speaking: boolean[] = [];
        const voice = new InterpreterVoice({ lang: 'fr-FR', onSpeakingChange: (s) => speaking.push(s) });
        voice.speak('Bonjour Ivan.');
        await vi.advanceTimersByTimeAsync(HD_VOICE_BUDGET_MS - 100);
        expect(rig.utterances).toHaveLength(0);
        await vi.advanceTimersByTimeAsync(200);
        expect(rig.utterances.map((u) => [u.text, u.lang])).toEqual([['Bonjour Ivan.', 'fr-FR']]);
        resolveLate({ audioBase64: 'QUJD', mimeType: 'audio/mpeg' });
        await vi.advanceTimersByTimeAsync(200);
        expect(rig.audios).toHaveLength(0); // la voix HD arrivée trop tard ne se superpose jamais
        expect(speaking).toEqual([true, false]);
    });

    it('fournisseur en panne (« réponse sans audio », crédits épuisés) : navigateur immédiatement, jamais un silence inexpliqué', async () => {
        rig.tts.mockRejectedValue(new Error("Le fournisseur n'a pas renvoyé d'audio."));
        const voice = new InterpreterVoice({ lang: 'ru-RU' });
        voice.speak('Привет Амина.');
        await vi.advanceTimersByTimeAsync(100);
        expect(rig.audios).toHaveLength(0);
        expect(rig.utterances.map((u) => [u.text, u.lang])).toEqual([['Привет Амина.', 'ru-RU']]);
    });

    it('en retard de plusieurs phrases : la voix immédiate du navigateur remplace la HD pour rattraper la conversation', async () => {
        expect(VOICE_BACKLOG_THRESHOLD).toBe(2);
        rig.tts.mockResolvedValue({ audioBase64: 'QUJD', mimeType: 'audio/mpeg' });
        const voice = new InterpreterVoice({ lang: 'fr-FR' });
        voice.speak('Une.');    // prise immédiatement (rien derrière) → HD
        voice.speak('Deux.');   // sera prise avec 2 phrases derrière → navigateur
        voice.speak('Trois.');  // 1 derrière → HD
        voice.speak('Quatre.'); // 0 derrière → HD
        await vi.advanceTimersByTimeAsync(2000);
        expect(rig.tts.mock.calls.map((c) => c[0])).toEqual(['Une.', 'Trois.', 'Quatre.']);
        expect(rig.utterances.map((u) => u.text)).toEqual(['Deux.']);
    });

    it('stop() coupe net : la file est vidée, plus aucune voix ne part', async () => {
        let resolveHd!: (value: unknown) => void;
        rig.tts.mockImplementation(() => new Promise((resolve) => { resolveHd = resolve; }));
        const speaking: boolean[] = [];
        const voice = new InterpreterVoice({ lang: 'fr-FR', onSpeakingChange: (s) => speaking.push(s) });
        voice.speak('Une.');
        voice.speak('Deux.');
        await vi.advanceTimersByTimeAsync(10); // « Une. » est en vol chez le fournisseur — rien ne sort encore
        voice.stop();
        resolveHd({ audioBase64: 'QUJD', mimeType: 'audio/mpeg' }); // la réponse arrive après l'arrêt
        await vi.advanceTimersByTimeAsync(2000);
        expect(rig.tts).toHaveBeenCalledTimes(1);
        expect(rig.utterances).toHaveLength(0);
        expect(rig.audios).toHaveLength(0);
        // « L'interprète parle » ne s'est jamais allumé : aucun son n'est sorti (la génération HD n'est pas de la parole).
        expect(speaking).toEqual([]);
    });

    it('« l’interprète parle » ne s’allume qu’au moment où du son SORT (lecture HD ou voix du navigateur), jamais pendant la génération', async () => {
        let resolveHd!: (value: unknown) => void;
        rig.tts.mockImplementation(() => new Promise((resolve) => { resolveHd = resolve; }));
        const speaking: Array<[boolean, number]> = [];
        const t0 = Date.now();
        const voice = new InterpreterVoice({ lang: 'fr-FR', onSpeakingChange: (s) => speaking.push([s, Date.now() - t0]) });
        voice.speak('Bonjour Ivan.');
        await vi.advanceTimersByTimeAsync(3000); // 3 s de génération : le micro d'appel ne doit PAS être en pause
        expect(speaking).toEqual([]);
        resolveHd({ audioBase64: 'QUJD', mimeType: 'audio/mpeg' });
        await vi.advanceTimersByTimeAsync(200);
        expect(speaking.map((s) => s[0])).toEqual([true, false]);
        expect(speaking[0][1]).toBeGreaterThanOrEqual(3000);
    });

    it('stop() puis speak() aussitôt (changement de langue) : l’ancienne file ne reprend jamais, une seule voix parle', async () => {
        let resolveOld!: (value: unknown) => void;
        rig.tts.mockImplementationOnce(() => new Promise((resolve) => { resolveOld = resolve; }));
        rig.tts.mockResolvedValue({ audioBase64: 'TkVX', mimeType: 'audio/mpeg' });
        const speaking: boolean[] = [];
        const voice = new InterpreterVoice({ lang: 'fr-FR', onSpeakingChange: (s) => speaking.push(s) });
        voice.speak('Ancienne.');
        await vi.advanceTimersByTimeAsync(10); // « Ancienne. » en vol chez le fournisseur
        voice.stop();
        voice.speak('Nouvelle.');
        await vi.advanceTimersByTimeAsync(200);
        expect(rig.audios.map((a) => a.src)).toEqual(['data:audio/mpeg;base64,TkVX']);
        resolveOld({ audioBase64: 'T0xE', mimeType: 'audio/mpeg' }); // la réponse de l'ancienne file arrive après coup
        await vi.advanceTimersByTimeAsync(200);
        expect(rig.audios.map((a) => a.src)).toEqual(['data:audio/mpeg;base64,TkVX']); // jamais jouée
        expect(rig.utterances).toHaveLength(0);
        expect(speaking).toEqual([true, false]); // une seule lecture réelle : celle de la file neuve
    });

    it('phrase vide ou blanche : rien n’est dit, rien n’est demandé', async () => {
        const voice = new InterpreterVoice({ lang: 'fr-FR' });
        voice.speak('   ');
        await vi.advanceTimersByTimeAsync(100);
        expect(rig.tts).not.toHaveBeenCalled();
        expect(rig.utterances).toHaveLength(0);
    });
});
