import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Tests de la boucle de relance de la reconnaissance vocale.
 *
 * Défaut mesuré par l'audit navigateur du 30/08/2026 : sur une erreur micro
 * NON transitoire (`audio-capture` — pas de périphérique ou capture refusée),
 * la reprise automatique de `onend` relançait la reconnaissance toutes les
 * ~300 ms, indéfiniment (16 relances en ~5 s), sans jamais le signaler à
 * l'utilisateur : la barre restait sur « Connexion... ».
 *
 * Chaque assertion ci-dessous rougit si le garde-fou disparaît : le test A
 * compte les appels réels à `recognition.start()` après l'échec fatal.
 */

// La synthèse HD passe par l'orchestrateur : mockée ici pour piloter, test
// par test, sa disponibilité (les tests d'identité vocale simulent un
// fournisseur en panne — jamais un appel réseau réel dans un test).
const gateway = vi.hoisted(() => ({
    generateSpeech: vi.fn(async (_t?: unknown, _o?: unknown): Promise<string> => { throw new Error('fournisseur HD indisponible'); }),
}));
vi.mock('../services/aiGateway', () => ({
    generateSpeech: gateway.generateSpeech,
    generateSpeechDetailed: vi.fn(async (t: string, o?: unknown) => ({
        audioBase64: await gateway.generateSpeech(t, o),
        mimeType: 'audio/mpeg',
    })),
    generateText: vi.fn(async () => ''),
    generateJSON: vi.fn(async () => null),
    analyzeImage: vi.fn(async () => ''),
    AiGatewayNetworkError: class extends Error { readonly isNetwork = true; },
}));

// La fausse reconnaissance est installée AVANT l'import du moteur : le
// singleton est construit à l'import et capture la classe à ce moment-là.
class FakeRecognition {
    static startCalls = 0;
    static instances: FakeRecognition[] = [];
    continuous = false;
    interimResults = false;
    lang = '';
    onstart: ((e?: unknown) => void) | null = null;
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    constructor() { FakeRecognition.instances.push(this); }
    start() { FakeRecognition.startCalls += 1; this.onstart?.(); }
    // Volontairement muet : les tests pilotent `onend` explicitement, comme
    // le vrai navigateur le fait de façon asynchrone.
    stop() { /* no-op */ }
    abort() { /* no-op */ }
}
(window as any).webkitSpeechRecognition = FakeRecognition;

const { voiceEngine, VoiceEngine, MIC_UNAVAILABLE_MESSAGE, LISTEN_NETWORK_MESSAGE, SPEECH_OUTPUT_FAILED_MESSAGE } = await import('../services/voiceEngine');

/** La reconnaissance unique que le moteur a construite et réutilise. */
const rec = () => FakeRecognition.instances[0];

describe('voiceEngine — abandon sur échec micro', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeRecognition.startCalls = 0;
        voiceEngine.setConversationalMode(true);
    });

    afterEach(() => {
        voiceEngine.setConversationalMode(false);
        voiceEngine.stopListening();
        vi.useRealTimers();
    });

    it("n'est PAS relancée après une erreur fatale (`audio-capture`) — fin de la boucle mesurée", async () => {
        const errors: string[] = [];
        const un = voiceEngine.addListener({ onError: (e) => errors.push(e) });

        await voiceEngine.startListening();
        expect(FakeRecognition.startCalls).toBe(1);

        rec().onerror?.({ error: 'audio-capture' });
        rec().onend?.();

        // La reprise automatique attend 300 ms : bien au-delà, toujours rien.
        await vi.advanceTimersByTimeAsync(2000);
        expect(FakeRecognition.startCalls).toBe(1);

        // Et l'échec est SIGNALÉ, pas silencieux.
        expect(errors).toContain(MIC_UNAVAILABLE_MESSAGE);
        un();
    });

    it('EST relancée après une erreur transitoire isolée (`network`) — la reprise légitime survit', async () => {
        await voiceEngine.startListening();
        const before = FakeRecognition.startCalls;

        rec().onerror?.({ error: 'network' });
        rec().onend?.();

        await vi.advanceTimersByTimeAsync(1000);
        expect(FakeRecognition.startCalls).toBe(before + 1);
    });

    it('abandonne aussi après le plafond de relances transitoires — jamais une boucle infinie', async () => {
        const errors: string[] = [];
        const un = voiceEngine.addListener({ onError: (e) => errors.push(e) });

        await voiceEngine.startListening();

        // 4 échecs consécutifs (le plafond) : chaque cycle échoue puis se
        // termine ; les relances intermédiaires sont attendues.
        for (let i = 0; i < 4; i++) {
            rec().onerror?.({ error: 'network' });
            rec().onend?.();
            await vi.advanceTimersByTimeAsync(1000);
        }

        const atCeiling = FakeRecognition.startCalls;
        await vi.advanceTimersByTimeAsync(3000);
        expect(FakeRecognition.startCalls).toBe(atCeiling);
        // Diagnostic HONNÊTE (mission Architecte §19-20) : une rafale
        // d'erreurs `network` n'est PAS un micro en panne — le message
        // distingue désormais la cause réseau (l'ancien libellé unique
        // « micro indisponible » posait un diagnostic faux).
        expect(errors).toContain(LISTEN_NETWORK_MESSAGE);
        expect(errors).not.toContain(MIC_UNAVAILABLE_MESSAGE);
        un();
    });

    it('un nouveau `startListening` explicite est une nouvelle chance — le verdict précédent ne bloque pas la personne', async () => {
        await voiceEngine.startListening();
        rec().onerror?.({ error: 'not-allowed' });
        rec().onend?.();
        await vi.advanceTimersByTimeAsync(2000);
        const afterGiveUp = FakeRecognition.startCalls;

        // La personne accorde l'autorisation puis réessaie : ça repart.
        await voiceEngine.startListening();
        expect(FakeRecognition.startCalls).toBe(afterGiveUp + 1);
    });

    it("de l'audio réel réarme le compteur : des erreurs espacées par de la vraie parole ne mènent jamais à l'abandon", async () => {
        const errors: string[] = [];
        const un = voiceEngine.addListener({ onError: (e) => errors.push(e) });

        await voiceEngine.startListening();
        for (let i = 0; i < 6; i++) {
            rec().onerror?.({ error: 'network' });
            // Parole réelle entre deux erreurs : le micro fonctionne.
            rec().onresult?.({
                resultIndex: 0,
                results: [Object.assign([{ transcript: 'bonjour' }], { isFinal: false })],
            });
            rec().onend?.();
            await vi.advanceTimersByTimeAsync(1000);
        }

        expect(errors).not.toContain(MIC_UNAVAILABLE_MESSAGE);
        un();
    });
});

describe('voiceEngine — respiration par ponctuation (Équipe B §2)', () => {
    it('la pause suit la ponctuation réellement écrite — jamais une valeur unique', () => {
        const question = VoiceEngine.breathAfterPhrase('Voulez-vous continuer ?');
        const point = VoiceEngine.breathAfterPhrase('Voici le chemin.');
        const articulation = VoiceEngine.breathAfterPhrase('Deux choses ;');
        const virgule = VoiceEngine.breathAfterPhrase('dans un premier temps,');

        expect(question).toBeGreaterThan(point);
        expect(point).toBeGreaterThan(articulation);
        expect(articulation).toBeGreaterThan(virgule);
        // Sobres : des respirations, pas des silences théâtraux.
        expect(question).toBeLessThanOrEqual(400);
        expect(virgule).toBeGreaterThanOrEqual(100);
    });
});

describe('voiceEngine — identité vocale stable par session (Équipe B §9)', () => {
    beforeEach(() => {
        // Synthèse système factice : le repli navigateur doit pouvoir
        // « parler » sans navigateur réel.
        (window as any).speechSynthesis = {
            cancel: vi.fn(), speak: vi.fn(), pause: vi.fn(), resume: vi.fn(),
            getVoices: () => [], speaking: false,
        };
        (window as any).SpeechSynthesisUtterance = class {
            text: string; lang = ''; rate = 1; pitch = 1; voice: any = null;
            onend: (() => void) | null = null; onerror: ((e: unknown) => void) | null = null;
            constructor(text: string) { this.text = text; }
        };
        gateway.generateSpeech.mockClear();
        voiceEngine.setConversationalMode(true);
    });

    afterEach(() => {
        voiceEngine.stopSpeaking();
        voiceEngine.setConversationalMode(false);
        delete (window as any).speechSynthesis;
        delete (window as any).SpeechSynthesisUtterance;
    });

    it('après UN repli qui a RÉELLEMENT parlé, la session y RESTE — plus jamais une alternance de voix', async () => {
        // Task force P0 (S3-A) : le verrou ne se pose plus à l'entrée du
        // repli mais au premier `onstart` réel — une voix restée muette ne
        // verrouille jamais la session sur du silence. Le faux moteur fait
        // donc démarrer la voix pour poser le verrou, comme un vrai
        // navigateur qui parle.
        (window as any).speechSynthesis.speak = vi.fn((u: any) => { u.onstart?.(); });

        // 1er tour : le fournisseur HD échoue → repli navigateur (une bascule, assumée).
        await voiceEngine.speak('Bonjour, je vous écoute.');
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(1);
        expect(voiceEngine.getCurrentActiveEngine()).toBe('browser_native');
        // Le repli démarre après le différé anti-cancel (80 ms).
        await new Promise((r) => setTimeout(r, 120));

        // 2e tour : le moteur HD n'est PAS retenté en cours de session —
        // c'était l'origine de la « succession de voix » constatée.
        voiceEngine.stopSpeaking();
        await voiceEngine.speak('Voici la suite.');
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(1);
        expect(voiceEngine.getCurrentActiveEngine()).toBe('browser_native');
    });

    it('une NOUVELLE session redonne sa chance au moteur HD — le verrou ne survit pas à la session', async () => {
        await voiceEngine.speak('Premier tour.');
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(1);

        // Fermeture puis réouverture de la barre = nouvelle session.
        voiceEngine.stopSpeaking();
        voiceEngine.setConversationalMode(false);
        voiceEngine.setConversationalMode(true);

        await voiceEngine.speak('Nouvelle session.');
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(2);
    });
});

describe('voiceEngine — interruption naturelle (barge-in, Boucle 1 §15)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        FakeRecognition.startCalls = 0;
        voiceEngine.setConversationalMode(true);
    });

    afterEach(() => {
        (voiceEngine as any).isSpeaking = false;
        voiceEngine.setConversationalMode(false);
        voiceEngine.stopListening();
        vi.useRealTimers();
    });

    it("une vraie phrase prononcée PENDANT que l'IA parle la fait taire et est entendue", async () => {
        await voiceEngine.startListening();
        const heard: string[] = [];
        const un = voiceEngine.addListener({ onTranscript: (t) => heard.push(t) });
        const stopSpy = vi.spyOn(voiceEngine, 'stopSpeaking');

        (voiceEngine as any).isSpeaking = true;
        rec().onresult?.({
            resultIndex: 0,
            results: [Object.assign([{ transcript: 'attends, montre-moi plutôt le campus' }], { isFinal: false })],
        });

        expect(stopSpy).toHaveBeenCalledTimes(1);
        // stopSpeaking a réellement remis isSpeaking à false : la parole passe.
        expect(voiceEngine.getIsSpeaking()).toBe(false);
        expect(heard).toContain('attends, montre-moi plutôt le campus');
        stopSpy.mockRestore();
        un();
    });

    it("un fragment court (écho de la voix de synthèse) est ignoré : l'IA n'est PAS coupée", async () => {
        await voiceEngine.startListening();
        const heard: string[] = [];
        const un = voiceEngine.addListener({ onTranscript: (t) => heard.push(t) });
        const stopSpy = vi.spyOn(voiceEngine, 'stopSpeaking');

        (voiceEngine as any).isSpeaking = true;
        rec().onresult?.({
            resultIndex: 0,
            results: [Object.assign([{ transcript: 'le campus' }], { isFinal: false })],
        });

        expect(stopSpy).not.toHaveBeenCalled();
        expect(heard).toHaveLength(0);
        stopSpy.mockRestore();
        un();
    });
});

// ─────────────────────────────────────────────────────────────────────────
// C1 (Direction, 05/09/2026) — « après sa présentation, il ne porte plus la
// conversation ». Sur téléphone, la voix HD passait par un contexte audio
// créé HORS geste, resté `suspended` : l'élément « jouait » jusqu'au bout,
// aucun son ne sortait, l'analyseur ne voyait rien — et une première phrase
// refusée par la lecture automatique rendait `true` (silence pris pour un
// succès, aucun repli). Chaque test ci-dessous rougit si l'un de ces
// garde-fous disparaît.
// ─────────────────────────────────────────────────────────────────────────
describe('voiceEngine — C1 : lecture HD déverrouillée dans le geste, jamais un silence pris pour un succès', () => {
    class FakeAnalyser {
        fftSize = 2048; frequencyBinCount = 1024; smoothingTimeConstant = 0;
        connect = vi.fn(); getFloatTimeDomainData = vi.fn(); getFloatFrequencyData = vi.fn(); getByteFrequencyData = vi.fn();
    }
    class FakeAudioContext {
        static instances: FakeAudioContext[] = [];
        /** Le navigateur accorde-t-il `resume()` ? (faux = aucun geste encore, Safari/iOS) */
        static allowResume = true;
        state: 'suspended' | 'running' | 'closed' = 'suspended';
        sampleRate = 44100; baseLatency = 0; destination = {};
        resume = vi.fn(async () => { if (FakeAudioContext.allowResume) this.state = 'running'; });
        close = vi.fn(async () => { this.state = 'closed'; });
        createMediaElementSource = vi.fn(() => ({ connect: vi.fn() }));
        createMediaStreamSource = vi.fn(() => ({ connect: vi.fn() }));
        createAnalyser = vi.fn(() => new FakeAnalyser());
        createDelay = vi.fn(() => ({ delayTime: { value: 0 }, connect: vi.fn() }));
        decodeAudioData = vi.fn(async () => { throw new Error('pas de décodage sur le banc'); });
        constructor() { FakeAudioContext.instances.push(this); }
    }
    const playCalls: HTMLMediaElement[] = [];
    let playRejects = false;
    const hadRaf = typeof window.requestAnimationFrame === 'function';

    beforeEach(() => {
        FakeAudioContext.instances = [];
        FakeAudioContext.allowResume = true;
        playCalls.length = 0;
        playRejects = false;
        (window as any).AudioContext = FakeAudioContext;
        if (!hadRaf) {
            (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => setTimeout(() => cb(performance.now()), 16) as unknown as number;
            (window as any).cancelAnimationFrame = (id: number) => clearTimeout(id);
        }
        Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
            configurable: true,
            value: vi.fn(function (this: HTMLMediaElement) {
                playCalls.push(this);
                if (playRejects) return Promise.reject(new Error('NotAllowedError: lecture automatique refusée'));
                // Un vrai navigateur finit par émettre `ended` : ici juste après le démarrage.
                const element = this;
                setTimeout(() => element.dispatchEvent(new Event('ended')), 0);
                return Promise.resolve();
            }),
        });
        Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', { configurable: true, value: vi.fn() });
        gateway.generateSpeech.mockReset();
        gateway.generateSpeech.mockImplementation(async () => 'AAAA');
        // Le moteur est un singleton : l'état de lecture repart à zéro.
        const engine = voiceEngine as any;
        engine.playbackElement = null;
        engine.playbackUnlocked = false;
        engine.playbackUnlocking = false;
        engine.outputContextRefused = false;
        engine.startAnnouncedEpoch = -1;
        engine.outputAudioContext = null;
        engine.outputSourceElement = null;
        engine.outputAnalyser = null;
        engine.sessionEngineLock = null;
        engine.audioCache.clear();
        voiceEngine.setConversationalMode(false);
    });

    afterEach(() => {
        voiceEngine.stopSpeaking();
        voiceEngine.stopListening();
        delete (window as any).AudioContext;
        delete (window as any).speechSynthesis;
        delete (window as any).SpeechSynthesisUtterance;
        if (!hadRaf) { delete (window as any).requestAnimationFrame; delete (window as any).cancelAnimationFrame; }
    });

    const attendre = (ms: number) => new Promise((r) => setTimeout(r, ms));

    it("unlockPlayback (dans le geste) : démarre le contexte de sortie et joue un clip silencieux sur UN élément réutilisable — idempotent", async () => {
        voiceEngine.unlockPlayback();
        expect(FakeAudioContext.instances).toHaveLength(1);
        expect(FakeAudioContext.instances[0].resume).toHaveBeenCalledTimes(1);
        expect(playCalls).toHaveLength(1);
        expect((playCalls[0] as HTMLAudioElement).src).toContain('data:audio/wav;base64,');
        await attendre(5);
        expect(voiceEngine.isPlaybackUnlocked()).toBe(true);
        // Un second geste ne rejoue rien : l'élément est déjà autorisé.
        voiceEngine.unlockPlayback();
        expect(playCalls).toHaveLength(1);
    });

    it("la voix HD passe par l'élément déverrouillé, relié UNE fois au graphe quand le contexte tourne — phrase après phrase, jamais un `new Audio()` par phrase", async () => {
        const un = voiceEngine.addListener({ onMouthShape: () => {} });
        voiceEngine.unlockPlayback();
        await attendre(5);
        const element = playCalls[0];
        await voiceEngine.speak('Bonjour.');
        await voiceEngine.speak('Voici la suite.');
        const ctx = FakeAudioContext.instances[0];
        expect(ctx.state).toBe('running');
        expect(ctx.createMediaElementSource).toHaveBeenCalledTimes(1);
        expect(ctx.createMediaElementSource).toHaveBeenCalledWith(element);
        // Clip silencieux + deux phrases : trois lectures, toutes sur LE même élément.
        expect(playCalls).toHaveLength(3);
        expect(playCalls.every((e) => e === element)).toBe(true);
        expect((element as HTMLAudioElement).src).toContain('data:audio/mpeg;base64,AAAA');
        expect(voiceEngine.getCurrentActiveEngine()).toBe('elevenlabs');
        un();
    });

    it("contexte de sortie qui ne démarre pas (aucun geste accordé) : l'élément n'est PAS relié au graphe — la voix sort en direct au lieu de se perdre", async () => {
        FakeAudioContext.allowResume = false;
        const un = voiceEngine.addListener({ onMouthShape: () => {} });
        await voiceEngine.speak('Bonjour.');
        const ctx = FakeAudioContext.instances[0];
        expect(ctx.state).toBe('suspended');
        expect(ctx.resume).toHaveBeenCalled();
        expect(ctx.createMediaElementSource).not.toHaveBeenCalled();
        expect(playCalls).toHaveLength(1);
        expect(voiceEngine.getCurrentActiveEngine()).toBe('elevenlabs');
        un();
    });

    it("première phrase refusée par la lecture automatique : repli navigateur immédiat, `onEnd` une seule fois — jamais un silence pris pour un succès", async () => {
        playRejects = true;
        (window as any).speechSynthesis = {
            cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(), getVoices: () => [], speaking: false,
            speak: vi.fn((u: any) => { u.onstart?.(); setTimeout(() => u.onend?.(), 0); }),
        };
        (window as any).SpeechSynthesisUtterance = class {
            text: string; lang = ''; rate = 1; pitch = 1; voice: any = null;
            onstart: (() => void) | null = null; onend: (() => void) | null = null; onerror: ((e: unknown) => void) | null = null;
            constructor(text: string) { this.text = text; }
        };
        const ends: number[] = [];
        await voiceEngine.speak('Bonjour.', { onEnd: () => ends.push(1) });
        // Repli : 80 ms de différé anti-cancel, puis la respiration de fin de phrase (250 ms).
        await attendre(600);
        expect(playCalls).toHaveLength(1);
        expect((window as any).speechSynthesis.speak).toHaveBeenCalledTimes(1);
        expect(voiceEngine.getCurrentActiveEngine()).toBe('browser_native');
        expect(ends).toHaveLength(1);
    });


    it("relais HD → repli SANS synthèse navigateur : `onEnd` UNE fois, message honnête, micro relancé — jamais un `onEnd` perdu (constat 1 de la revue)", async () => {
        playRejects = true;
        delete (window as any).speechSynthesis;
        const errors: string[] = []; const ends: number[] = []; const starts: number[] = [];
        const un = voiceEngine.addListener({ onError: (e) => errors.push(e) });
        voiceEngine.setConversationalMode(true);
        await voiceEngine.speak('Bonjour.', { onStart: () => starts.push(1), onEnd: () => ends.push(1) });
        expect(ends).toHaveLength(1);
        expect(starts).toHaveLength(1);
        expect(errors).toContain(SPEECH_OUTPUT_FAILED_MESSAGE);
        // Le tour est clos : l'écoute conversationnelle repart d'elle-même.
        const avant = FakeRecognition.startCalls;
        await attendre(450);
        expect(FakeRecognition.startCalls).toBe(avant + 1);
        un();
    });

    it("chemin relais avec synthèse navigateur : `onStart` une seule fois (le HD l'a déjà émis), `onEnd` une seule fois", async () => {
        playRejects = true;
        (window as any).speechSynthesis = {
            cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(), getVoices: () => [], speaking: false,
            speak: vi.fn((u: any) => { u.onstart?.(); setTimeout(() => u.onend?.(), 0); }),
        };
        (window as any).SpeechSynthesisUtterance = class {
            text: string; lang = ''; rate = 1; pitch = 1; voice: any = null;
            onstart: (() => void) | null = null; onend: (() => void) | null = null; onerror: ((e: unknown) => void) | null = null;
            constructor(text: string) { this.text = text; }
        };
        const starts: number[] = []; const ends: number[] = [];
        await voiceEngine.speak('Bonjour.', { onStart: () => starts.push(1), onEnd: () => ends.push(1) });
        await attendre(600);
        expect(starts).toHaveLength(1);
        expect(ends).toHaveLength(1);
    });

    it("iPhone / iPad : la voix HD n'est JAMAIS reliée au graphe Web Audio (interrupteur silencieux) — elle sort en direct, la bouche suit la piste", async () => {
        const ua = Object.getOwnPropertyDescriptor(Navigator.prototype, 'userAgent');
        Object.defineProperty(navigator, 'userAgent', { configurable: true, get: () => 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' });
        try {
            expect(VoiceEngine.prefersDirectPlayback()).toBe(true);
            const un = voiceEngine.addListener({ onMouthShape: () => {} });
            voiceEngine.unlockPlayback();
            await attendre(5);
            await voiceEngine.speak('Bonjour.');
            const ctx = FakeAudioContext.instances[0];
            expect(ctx.state).toBe('running');
            expect(ctx.createMediaElementSource).not.toHaveBeenCalled();
            expect(playCalls).toHaveLength(2); // clip silencieux + la phrase, sur l'élément déverrouillé
            expect(playCalls[1]).toBe(playCalls[0]);
            un();
        } finally {
            if (ua) Object.defineProperty(navigator, 'userAgent', ua); else delete (navigator as any).userAgent;
        }
        // iPad qui se présente en Mac tactile.
        expect(VoiceEngine.prefersDirectPlayback({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 5 } as Navigator)).toBe(true);
        expect(VoiceEngine.prefersDirectPlayback({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)', platform: 'MacIntel', maxTouchPoints: 0 } as Navigator)).toBe(false);
        expect(VoiceEngine.prefersDirectPlayback({ userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/120', platform: 'Linux armv8l', maxTouchPoints: 5 } as Navigator)).toBe(false);
    });

    it("rien à dire (texte vide ou vidé par le nettoyage) : le tour se clôt, `onEnd` n'est jamais perdu", async () => {
        const ends: number[] = [];
        await voiceEngine.speak('', { onEnd: () => ends.push(1) });
        await voiceEngine.speak('***', { onEnd: () => ends.push(1) });
        expect(ends).toHaveLength(2);
        expect(playCalls).toHaveLength(0);
    });

    it("deux gestes dans la même seconde ne lancent qu'UN clip silencieux (déverrouillage en cours)", async () => {
        voiceEngine.unlockPlayback();
        voiceEngine.unlockPlayback();
        expect(playCalls).toHaveLength(1);
        await attendre(5);
        expect(voiceEngine.isPlaybackUnlocked()).toBe(true);
    });

    it("contexte refusé hors geste : mémorisé jusqu'au prochain geste — pas 150 ms d'attente à chaque phrase, et réessai après `unlockPlayback()`", async () => {
        FakeAudioContext.allowResume = false;
        const un = voiceEngine.addListener({ onMouthShape: () => {} });
        await voiceEngine.speak('Bonjour.');
        const ctx = FakeAudioContext.instances[0];
        expect(ctx.resume).toHaveBeenCalledTimes(1);
        await voiceEngine.speak('Encore.');
        expect(ctx.resume).toHaveBeenCalledTimes(1);          // refus mémorisé : pas de nouvelle attente
        FakeAudioContext.allowResume = true;
        voiceEngine.unlockPlayback();                          // geste : nouvelle chance
        await attendre(5);
        await voiceEngine.speak('Et maintenant.');
        expect(ctx.state).toBe('running');
        expect(ctx.createMediaElementSource).toHaveBeenCalledTimes(1);
        un();
    });
});
