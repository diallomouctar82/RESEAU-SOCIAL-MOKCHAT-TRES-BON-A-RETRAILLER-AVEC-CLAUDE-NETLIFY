import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYSER_FFT_SIZE, LIP_SYNC_LOOKAHEAD_MS } from '../services/architecte/lipSync';

/**
 * Chaîne audio de la synchro labiale, telle que `voiceEngine` la construit
 * pour TOUTE voix HD servie par la chaîne vocale du Super-Admin (ElevenLabs,
 * Gemini TTS, Polly, Azure, Google, Cartesia, Play.ht… : le moteur ne voit
 * qu'un fichier audio, quel que soit le fournisseur retenu par la passerelle).
 *
 * Trois pièges réels, tous rencontrés :
 *  - la source branchée sur l'analyseur sans chemin vers la sortie REND LA
 *    VOIX MUETTE (DEC-2026-054) ;
 *  - le spectre en octets (`getByteFrequencyData`) tient la bouche ouverte
 *    sur le souffle : mesuré le 04/09, bouche ouverte sur 98 % des images ;
 *  - sans avance, la bouche suit la voix avec ~160 ms de retard.
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

class FakeAudio {
    static instances: FakeAudio[] = [];
    src: string;
    currentTime = 0;
    onended: (() => void) | null = null;
    onerror: ((e: unknown) => void) | null = null;
    onpause: (() => void) | null = null;
    constructor(src: string) {
        this.src = src;
        FakeAudio.instances.push(this);
    }
    play() { return Promise.resolve(); }
    pause() { this.onpause?.(); }
}

class FakeNode {
    connections: FakeNode[] = [];
    constructor(public readonly kind: string) {}
    connect(node: FakeNode) { this.connections.push(node); return node; }
    disconnect() { /* no-op */ }
}
class FakeAnalyser extends FakeNode {
    fftSize = 2048;
    smoothingTimeConstant = 0.8;
    get frequencyBinCount() { return this.fftSize / 2; }
    /** Signal temporel : l'amplitude courante du banc, sur tout le tampon. */
    getFloatTimeDomainData(target: Float32Array) { target.fill(FakeAudioContext.sample); }
    /** Piège : un spectre en octets « fort » même en silence — si le moteur le relit, la bouche s'ouvre à tort. */
    getByteFrequencyData(target: Uint8Array) { target.fill(200); }
}
class FakeDelay extends FakeNode {
    delayTime = { value: 0 };
}
class FakeAudioContext {
    static instances: FakeAudioContext[] = [];
    static sample = 0;
    state = 'running';
    destination = new FakeNode('destination');
    sources: FakeNode[] = [];
    analysers: FakeAnalyser[] = [];
    delays: FakeDelay[] = [];
    constructor() { FakeAudioContext.instances.push(this); }
    createMediaElementSource() { const n = new FakeNode('source'); this.sources.push(n); return n; }
    createAnalyser() { const a = new FakeAnalyser('analyser'); this.analysers.push(a); return a; }
    createDelay() { const d = new FakeDelay('delay'); this.delays.push(d); return d; }
    resume() { return Promise.resolve(); }
}

/** Existe-t-il un chemin de connexions de `from` jusqu'à la sortie ? */
function reachesDestination(from: FakeNode, destination: FakeNode, seen = new Set<FakeNode>()): boolean {
    if (from === destination) return true;
    if (seen.has(from)) return false;
    seen.add(from);
    return from.connections.some((n) => reachesDestination(n, destination, seen));
}

const frames: FrameRequestCallback[] = [];
/** Joue une image d'animation : la boucle de mesure du moteur se réinscrit à chaque passage. */
const image = () => { frames.splice(0).forEach((cb) => cb(performance.now())); };

const fakeSpeechSynthesis = {
    cancel: vi.fn(), speak: vi.fn(), pause: vi.fn(), resume: vi.fn(),
    getVoices: () => [], speaking: false,
};

const { voiceEngine } = await import('../services/voiceEngine');

beforeEach(() => {
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('AudioContext', FakeAudioContext);
    (window as any).AudioContext = FakeAudioContext;
    (window as any).requestAnimationFrame = (cb: FrameRequestCallback) => { frames.push(cb); return frames.length; };
    (window as any).cancelAnimationFrame = () => { /* no-op */ };
    (window as any).speechSynthesis = fakeSpeechSynthesis;
    (window as any).SpeechSynthesisUtterance = class {
        text: string; lang = ''; rate = 1; pitch = 1; voice: unknown = null;
        onend: (() => void) | null = null; onerror: ((e: unknown) => void) | null = null;
        constructor(text: string) { this.text = text; }
    };
    FakeAudio.instances = [];
    FakeAudioContext.instances = [];
    FakeAudioContext.sample = 0;
    frames.length = 0;
    (voiceEngine as any).audioCache = new Map();
});

afterEach(() => {
    voiceEngine.stopSpeaking();
    vi.unstubAllGlobals();
    delete (window as any).AudioContext;
    delete (window as any).speechSynthesis;
    delete (window as any).SpeechSynthesisUtterance;
});

describe('voiceEngine — chaîne audio de la synchro labiale (voix HD, tout fournisseur)', () => {
    it('la voix atteint la sortie par un retard de 60 ms ; la bouche lit le signal temporel non retardé', async () => {
        const niveaux: number[] = [];
        const off = voiceEngine.addListener({ onOutputVolume: (v) => niveaux.push(v) });
        FakeAudioContext.sample = 0.2; // syllabe franche
        const lecture = voiceEngine.speak('Bonjour, je suis l’avatar de Vision Smart.');
        await vi.waitFor(() => expect(FakeAudio.instances).toHaveLength(1));

        const ctx = FakeAudioContext.instances[0];
        expect(ctx).toBeDefined();
        const source = ctx.sources[0];
        // Prise de mesure : un analyseur temporel de 2 048 échantillons sur le signal brut.
        expect(ctx.analysers).toHaveLength(1);
        expect(ctx.analysers[0].fftSize).toBe(ANALYSER_FFT_SIZE);
        expect(source.connections).toContain(ctx.analysers[0]);
        // JAMAIS MUETTE : un chemin mène de la source à la sortie…
        expect(reachesDestination(source, ctx.destination)).toBe(true);
        // …par le retard qui donne l'avance à la bouche.
        expect(ctx.delays).toHaveLength(1);
        expect(ctx.delays[0].delayTime.value).toBeCloseTo(LIP_SYNC_LOOKAHEAD_MS / 1000, 6);
        expect(source.connections).toContain(ctx.delays[0]);
        expect(reachesDestination(ctx.delays[0], ctx.destination)).toBe(true);

        // Niveau publié : syllabe franche → bouche grande ouverte.
        image();
        image();
        expect(niveaux.at(-1)).toBeGreaterThan(0.9);
        // Silence → bouche close (le spectre en octets dirait 200/255 : il n'est pas relu).
        FakeAudioContext.sample = 0;
        image();
        expect(niveaux.at(-1)).toBe(0);
        // Souffle du fichier → toujours close.
        FakeAudioContext.sample = 0.004;
        image();
        expect(niveaux.at(-1)).toBe(0);
        // Syllabe plus douce → ouverte, mais moins.
        FakeAudioContext.sample = 0.1;
        image();
        const douce = niveaux.at(-1) ?? 0;
        expect(douce).toBeGreaterThan(0.2);
        expect(douce).toBeLessThan(0.9);

        // Fin de lecture : la bouche revient à zéro et la boucle s'arrête.
        FakeAudioContext.sample = 0.2;
        FakeAudio.instances[0].onended?.();
        await lecture;
        expect(niveaux.at(-1)).toBe(0);
        const avant = frames.length;
        image();
        expect(frames.length).toBeLessThanOrEqual(avant);
        off();
    });
});
