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

const { voiceEngine, MIC_UNAVAILABLE_MESSAGE } = await import('../services/voiceEngine');

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
        expect(errors).toContain(MIC_UNAVAILABLE_MESSAGE);
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
