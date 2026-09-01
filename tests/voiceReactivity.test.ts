import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * ÉQUIPE 1/2 — mission « Architecte opérationnel » (31/08/2026).
 *
 * Deux défauts de premier ordre mesurés par l'audit :
 * 1. DOUBLE EXÉCUTION : un transcript FINAL du moteur de reconnaissance
 *    laissait le timer VAD armé avec le même texte — 1,4 s plus tard, le
 *    MÊME final repartait : chaque commande vocale s'exécutait deux fois.
 * 2. FAN-OUT : le moteur est un singleton sans propriétaire — chaque écran
 *    monté recevait le même transcript et répondait aussi (« plusieurs
 *    intervenants »). La propriété de session (temporaire/conversationnelle)
 *    désigne un destinataire unique.
 */

const gateway = vi.hoisted(() => ({
    generateSpeech: vi.fn(async (_t?: unknown, _o?: unknown): Promise<string> => 'QVVESU8='),
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
    static instances: FakeRecognition[] = [];
    continuous = false;
    interimResults = false;
    lang = '';
    onstart: ((e?: unknown) => void) | null = null;
    onresult: ((e: unknown) => void) | null = null;
    onerror: ((e: { error: string }) => void) | null = null;
    onend: (() => void) | null = null;
    constructor() { FakeRecognition.instances.push(this); }
    start() { this.onstart?.(); }
    stop() { /* no-op — piloté par les tests */ }
    abort() { /* no-op */ }
}
(window as any).webkitSpeechRecognition = FakeRecognition;

const { voiceEngine } = await import('../services/voiceEngine');
const rec = () => FakeRecognition.instances[0];

/** Fabrique un événement onresult conforme à la Web Speech API. */
function speechEvent(text: string, isFinal: boolean) {
    const result = Object.assign([{ transcript: text }], { isFinal });
    return { resultIndex: 0, results: [result] };
}

describe('voiceEngine — un final ne part JAMAIS deux fois (double exécution)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        voiceEngine.setConversationalMode(true);
    });
    afterEach(() => {
        voiceEngine.setConversationalMode(false);
        voiceEngine.stopListening();
        vi.useRealTimers();
    });

    it('un transcript FINAL du moteur est émis une seule fois — le timer VAD ne le ré-émet pas 1,4 s après', async () => {
        const finals: string[] = [];
        const un = voiceEngine.addListener({
            onTranscript: (t, isFinal) => { if (isFinal) finals.push(t); },
        });
        await voiceEngine.startListening();

        rec().onresult?.(speechEvent('ouvre le module social', true));
        expect(finals).toEqual(['ouvre le module social']);

        // L'ancien défaut : à +1400 ms, le VAD ré-émettait le même texte.
        await vi.advanceTimersByTimeAsync(3000);
        expect(finals).toEqual(['ouvre le module social']);
        un();
    });

    it('un interim SANS final est bien finalisé par le VAD après le silence (comportement légitime conservé)', async () => {
        const finals: string[] = [];
        const un = voiceEngine.addListener({
            onTranscript: (t, isFinal) => { if (isFinal) finals.push(t); },
        });
        await voiceEngine.startListening();

        rec().onresult?.(speechEvent('bonjour architecte', false));
        expect(finals).toEqual([]);

        await vi.advanceTimersByTimeAsync(1500);
        expect(finals).toEqual(['bonjour architecte']);

        // Et une seule fois — pas de rejeu ensuite.
        await vi.advanceTimersByTimeAsync(3000);
        expect(finals).toEqual(['bonjour architecte']);
        un();
    });
});

describe('voiceEngine — propriété de la session vocale (fan-out)', () => {
    afterEach(() => {
        voiceEngine.releaseTemporaryOwnership('a');
        voiceEngine.releaseTemporaryOwnership('b');
        voiceEngine.releaseConversationalOwnership('a');
        voiceEngine.releaseConversationalOwnership('b');
    });

    it('sans aucun propriétaire, aucun filtre (comportement historique)', () => {
        expect(voiceEngine.getTranscriptOwner()).toBeNull();
    });

    it('la prise de main temporaire (dictée) prime sur la session conversationnelle', () => {
        voiceEngine.claimConversationalOwnership('a');
        expect(voiceEngine.getTranscriptOwner()).toBe('a');
        voiceEngine.claimTemporaryOwnership('b');
        expect(voiceEngine.getTranscriptOwner()).toBe('b');
        voiceEngine.releaseTemporaryOwnership('b');
        expect(voiceEngine.getTranscriptOwner()).toBe('a');
    });

    it("un release avec le mauvais identifiant ne vole jamais la session d'un autre", () => {
        voiceEngine.claimConversationalOwnership('a');
        voiceEngine.releaseConversationalOwnership('b');
        expect(voiceEngine.getTranscriptOwner()).toBe('a');
        voiceEngine.releaseConversationalOwnership('a');
        expect(voiceEngine.getTranscriptOwner()).toBeNull();
    });
});
