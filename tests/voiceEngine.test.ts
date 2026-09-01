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

const { voiceEngine, VoiceEngine, MIC_UNAVAILABLE_MESSAGE, LISTEN_NETWORK_MESSAGE } = await import('../services/voiceEngine');

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
