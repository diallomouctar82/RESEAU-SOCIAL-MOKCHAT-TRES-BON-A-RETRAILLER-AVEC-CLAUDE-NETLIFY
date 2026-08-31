import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * TASK FORCE ARCHITECTE (mission P0, 31/08/2026) — la boucle conversationnelle
 * ne doit JAMAIS rester bloquée. Chaque test ci-dessous encode une cause
 * racine démontrée par l'audit (reproduction instrumentée) :
 * 1. Utterance PERDUE par le navigateur (aucun événement) → sans chien de
 *    garde, isSpeaking restait true pour toujours : voix muette ET micro
 *    jamais relancé (blocage irrécupérable).
 * 2. Verrou d'identité vocale posé au premier hoquet du fournisseur HD →
 *    toute la session condamnée à la voix navigateur, même muette.
 * 3. Repli navigateur qui ne dit AUCUNE phrase → faux « j'ai parlé »
 *    silencieux, jamais signalé.
 * 4. Propriétaire temporaire fantôme (dictée finie par silence) → session
 *    conversationnelle sourde à vie.
 * 5. Filet de reprise : session ni parlante ni écoutante → l'écoute repart
 *    toute seule.
 */

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
    stop() { /* piloté par les tests */ }
    abort() { /* no-op */ }
}
(window as any).webkitSpeechRecognition = FakeRecognition;

/** Fausse synthèse pilotable : chaque utterance est capturée, le test décide de son sort. */
const spokenUtterances: any[] = [];
const fakeSpeechSynthesis = {
    cancel: vi.fn(), pause: vi.fn(), resume: vi.fn(),
    speak: vi.fn((u: any) => { spokenUtterances.push(u); }),
    getVoices: () => [], speaking: false,
};

const { voiceEngine, SPEECH_OUTPUT_FAILED_MESSAGE } = await import('../services/voiceEngine');
const rec = () => FakeRecognition.instances[0];

beforeEach(() => {
    vi.useFakeTimers();
    FakeRecognition.startCalls = 0;
    spokenUtterances.length = 0;
    fakeSpeechSynthesis.speak.mockClear();
    (window as any).speechSynthesis = fakeSpeechSynthesis;
    (window as any).SpeechSynthesisUtterance = class {
        text: string; lang = ''; rate = 1; pitch = 1; voice: any = null;
        onstart: (() => void) | null = null;
        onend: (() => void) | null = null;
        onerror: ((e: unknown) => void) | null = null;
        constructor(text: string) { this.text = text; }
    };
    voiceEngine.setConversationalMode(true);
});

afterEach(() => {
    voiceEngine.stopSpeaking();
    voiceEngine.setConversationalMode(false);
    voiceEngine.stopListening();
    voiceEngine.releaseTemporaryOwnership('dictee');
    voiceEngine.releaseConversationalOwnership('barre');
    delete (window as any).speechSynthesis;
    delete (window as any).SpeechSynthesisUtterance;
    vi.useRealTimers();
});

describe('P0-1 — utterance perdue : le chien de garde débloque TOUJOURS la boucle', () => {
    it("une utterance sans aucun événement ne fige plus la session : la parole se termine et le micro repart", async () => {
        await voiceEngine.startListening();
        const before = FakeRecognition.startCalls;

        await voiceEngine.speak('Bonjour, je suis là.');
        // Le vrai navigateur émet `onend` quand la reco est stoppée pour la
        // lecture — le faux moteur ne le fait pas tout seul.
        rec().onend?.();
        // Le repli démarre après le différé anti-cancel (80 ms).
        await vi.advanceTimersByTimeAsync(100);
        expect(spokenUtterances.length).toBe(1);
        // L'utterance ne déclenche NI onstart NI onend NI onerror (perdue).

        // Chien de garde (2 s) + file vidée : fin de parole forcée.
        await vi.advanceTimersByTimeAsync(2500);
        expect(voiceEngine.getIsSpeaking()).toBe(false);

        // Et la reprise du micro (350 ms après la fin) a bien eu lieu.
        await vi.advanceTimersByTimeAsync(500);
        expect(FakeRecognition.startCalls).toBeGreaterThan(before);
    });
});

describe('P0-2 — le verrou d\'identité vocale ne se pose que sur une voix qui a PARLÉ', () => {
    it('après un repli entièrement muet, la réponse suivante retente le fournisseur HD', async () => {
        await voiceEngine.speak('Première réponse.');
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(1);
        // Repli muet : l'utterance part en erreur immédiate (aucun onstart).
        await vi.advanceTimersByTimeAsync(100);
        spokenUtterances.forEach((u) => u.onerror?.(new Error('no voice')));
        await vi.advanceTimersByTimeAsync(100);

        voiceEngine.stopSpeaking();
        await voiceEngine.speak('Deuxième réponse.');
        // L'ancien défaut : le verrou posé d'office bloquait ce retour au HD.
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(2);
    });

    it('après un repli qui a réellement parlé, la session garde cette voix (§9 conservé) puis le verrou EXPIRE', async () => {
        await voiceEngine.speak('Première réponse.');
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(1);
        await vi.advanceTimersByTimeAsync(100);
        // La voix démarre réellement : le verrou se pose.
        spokenUtterances[0]?.onstart?.();
        spokenUtterances[0]?.onend?.();
        await vi.advanceTimersByTimeAsync(500);

        voiceEngine.stopSpeaking();
        await voiceEngine.speak('Deuxième réponse.');
        // Dans le TTL : pas de retentative HD (identité stable, §9).
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(1);

        // Passé le TTL (60 s) : nouvelle chance au HD.
        await vi.advanceTimersByTimeAsync(61_000);
        voiceEngine.stopSpeaking();
        await voiceEngine.speak('Troisième réponse.');
        expect(gateway.generateSpeech).toHaveBeenCalledTimes(2);
    });
});

describe('P0-3 — un repli muet est SIGNALÉ, jamais un faux « j\'ai parlé »', () => {
    it('file vidée sans aucun onstart → SPEECH_OUTPUT_FAILED_MESSAGE émis', async () => {
        const errors: string[] = [];
        const un = voiceEngine.addListener({ onError: (e) => errors.push(e) });

        await voiceEngine.speak('Réponse condamnée au silence.');
        await vi.advanceTimersByTimeAsync(100);
        spokenUtterances.forEach((u) => u.onerror?.(new Error('no voice')));
        await vi.advanceTimersByTimeAsync(200);

        expect(errors).toContain(SPEECH_OUTPUT_FAILED_MESSAGE);
        expect(voiceEngine.getIsSpeaking()).toBe(false);
        un();
    });
});

describe('P0-4 — plus jamais de propriétaire temporaire fantôme', () => {
    it("une dictée finie par silence rend la main : la session conversationnelle d'un autre écran redevient entendante", async () => {
        voiceEngine.claimConversationalOwnership('barre');
        await voiceEngine.startListening();
        // La dictée d'un autre écran prend brièvement la main…
        voiceEngine.claimTemporaryOwnership('dictee');
        expect(voiceEngine.getTranscriptOwner()).toBe('dictee');
        // …et se termine par un silence (onend naturel, jamais de bouton stop).
        rec().onend?.();
        expect(voiceEngine.getTranscriptOwner()).toBe('barre');
        voiceEngine.releaseConversationalOwnership('barre');
    });

    it('hors session conversationnelle, la dictée GARDE la main entre deux segments (aucune régression)', async () => {
        voiceEngine.setConversationalMode(false);
        await voiceEngine.startListening();
        voiceEngine.claimTemporaryOwnership('dictee');
        rec().onend?.();
        expect(voiceEngine.getTranscriptOwner()).toBe('dictee');
        voiceEngine.releaseTemporaryOwnership('dictee');
    });
});

describe('P0-5 — filet « jamais bloqué » : la session se répare toute seule', () => {
    it("session ouverte, ni parole ni écoute → l'écoute est relancée par le filet (5 s)", async () => {
        // Aucune écoute démarrée : état « bloqué » simulé.
        const before = FakeRecognition.startCalls;
        await vi.advanceTimersByTimeAsync(5200);
        expect(FakeRecognition.startCalls).toBeGreaterThan(before);
    });

    it('après un abandon micro FATAL, le filet ne relance jamais (pas de boucle sur une permission refusée)', async () => {
        await voiceEngine.startListening();
        rec().onerror?.({ error: 'not-allowed' });
        rec().onend?.();
        const after = FakeRecognition.startCalls;
        await vi.advanceTimersByTimeAsync(12_000);
        expect(FakeRecognition.startCalls).toBe(after);
    });

    it('après un abandon RÉSEAU, la retentative est espacée (~15 s) — jamais immédiate, jamais infinie', async () => {
        await voiceEngine.startListening();
        for (let i = 0; i < 4; i++) {
            rec().onerror?.({ error: 'network' });
            rec().onend?.();
            await vi.advanceTimersByTimeAsync(1000);
        }
        const atCeiling = FakeRecognition.startCalls;
        // Sous 15 s : rien (le service vient d'échouer 4 fois).
        await vi.advanceTimersByTimeAsync(8000);
        expect(FakeRecognition.startCalls).toBe(atCeiling);
        // Passé ~15 s : UNE retentative.
        await vi.advanceTimersByTimeAsync(10_000);
        expect(FakeRecognition.startCalls).toBe(atCeiling + 1);
    });
});
