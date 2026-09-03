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

const { InterpreterVoice, HD_VOICE_BUDGET_MS, VOICE_BACKLOG_THRESHOLD } = await import('../services/calls/callInterpreter');

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

describe('InterpreterVoice — voix de l’interprète garantie (Mission VT)', () => {
    it('voix HD dans le budget : jouée telle quelle, le navigateur n’est pas sollicité, l’état « parle » encadre la lecture', async () => {
        rig.tts.mockResolvedValue({ audioBase64: 'QUJD', mimeType: 'audio/mpeg' });
        const speaking: boolean[] = [];
        const voice = new InterpreterVoice({ lang: 'fr-FR', onSpeakingChange: (s) => speaking.push(s) });
        voice.speak('Bonjour Ivan.');
        await vi.advanceTimersByTimeAsync(200);
        expect(rig.tts).toHaveBeenCalledWith('Bonjour Ivan.', { timeoutMs: HD_VOICE_BUDGET_MS });
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
