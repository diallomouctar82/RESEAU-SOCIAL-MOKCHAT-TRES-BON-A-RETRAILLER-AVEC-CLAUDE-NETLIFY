import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ANALYSER_FFT_SIZE, LIP_SYNC_LOOKAHEAD_MS, RENDER_LATENCY_MS, VISUAL_LEAD_MS, type MouthShape } from '../services/architecte/lipSync';

/**
 * Chaîne audio de la synchro labiale, telle que `voiceEngine` la construit
 * pour TOUTE voix HD servie par la chaîne vocale du Super-Admin (ElevenLabs,
 * Gemini TTS, Polly, Azure, Google, Cartesia, Play.ht… : le moteur ne voit
 * qu'un fichier audio, quel que soit le fournisseur retenu par la passerelle).
 *
 * Pièges réels, tous rencontrés :
 *  - la source branchée sur l'analyseur sans chemin vers la sortie REND LA
 *    VOIX MUETTE (DEC-2026-057) ;
 *  - le spectre en OCTETS (`getByteFrequencyData`) tient la bouche ouverte
 *    sur le souffle : mesuré le 04/09, bouche ouverte sur 98 % des images ;
 *  - sans avance, la bouche suit la voix avec ~160 ms de retard ;
 *  - le volume seul ouvre la bouche sur un « s » et la ferme sur une voyelle
 *    douce : la FORME vient du spectre (visèmes acoustiques, DEC-2026-060).
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
/** Spectres de banc, en dB par Hz : voyelle « a », fricative « s », rien. */
const SPECTRES = {
    a: (hz: number) => (hz >= 250 && hz <= 900 ? -20 : -95),
    s: (hz: number) => (hz >= 3500 && hz <= 7500 ? -30 : -95),
    silence: () => -140,
};
class FakeAnalyser extends FakeNode {
    fftSize = 2048;
    smoothingTimeConstant = 0.8;
    get frequencyBinCount() { return this.fftSize / 2; }
    /** Signal temporel : l'amplitude courante du banc, sur tout le tampon. */
    getFloatTimeDomainData(target: Float32Array) { target.fill(FakeAudioContext.sample); }
    /** Spectre courant du banc, en dB par bande — comme le vrai analyseur. */
    getFloatFrequencyData(target: Float32Array) {
        const spectre = SPECTRES[FakeAudioContext.spectre];
        for (let i = 0; i < target.length; i += 1) target[i] = spectre((i * 44100) / this.fftSize);
    }
    /** Piège : un spectre en octets « fort » même en silence — si le moteur le relit, la bouche s'ouvre à tort. */
    getByteFrequencyData(target: Uint8Array) { target.fill(200); }
}
class FakeDelay extends FakeNode {
    delayTime = { value: 0 };
}
class FakeAudioContext {
    static instances: FakeAudioContext[] = [];
    static sample = 0;
    static spectre: keyof typeof SPECTRES = 'silence';
    static outputLatency = 0.02;
    state = 'running';
    sampleRate = 44100;
    baseLatency = 0.01;
    get outputLatency() { return FakeAudioContext.outputLatency; }
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
/** Horloge pilotée : le moteur lit `performance.now()` pour dater ses mesures. */
let horloge = 0;
/** Joue une image d'animation (16 ms) : la boucle de mesure du moteur se réinscrit à chaque passage. */
const image = (n = 1) => { for (let i = 0; i < n; i += 1) { horloge += 16; frames.splice(0).forEach((cb) => cb(horloge)); } };

const fakeSpeechSynthesis = {
    cancel: vi.fn(), speak: vi.fn(), pause: vi.fn(), resume: vi.fn(),
    getVoices: () => [], speaking: false,
};

const { voiceEngine } = await import('../services/voiceEngine');

beforeEach(() => {
    horloge = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => horloge);
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
    FakeAudioContext.spectre = 'silence';
    FakeAudioContext.outputLatency = 0.02;
    frames.length = 0;
    (voiceEngine as any).audioCache = new Map();
    (voiceEngine as any).outputAudioContext = null;
    (voiceEngine as any).outputAnalyser = null;
    (voiceEngine as any).outputSourceElement = null;
});

afterEach(() => {
    voiceEngine.stopSpeaking();
    vi.unstubAllGlobals();
    delete (window as any).AudioContext;
    delete (window as any).speechSynthesis;
    delete (window as any).SpeechSynthesisUtterance;
});

describe('voiceEngine — chaîne audio de la synchro labiale (voix HD, tout fournisseur)', () => {
    it('la voix atteint la sortie par un court retard ; la bouche lit le spectre et le signal temporel non retardés', async () => {
        const niveaux: number[] = [];
        const formes: MouthShape[] = [];
        const off = voiceEngine.addListener({ onOutputVolume: (v) => niveaux.push(v), onMouthShape: (s) => formes.push(s) });
        FakeAudioContext.sample = 0.2; // voyelle franche…
        FakeAudioContext.spectre = 'a'; // …ouverte
        const lecture = voiceEngine.speak('Bonjour, je suis l’avatar de Vision Smart.');
        await vi.waitFor(() => expect(FakeAudio.instances).toHaveLength(1));

        const ctx = FakeAudioContext.instances[0];
        expect(ctx).toBeDefined();
        const source = ctx.sources[0];
        // Prise de mesure : un analyseur de 2 048 échantillons, spectre brut, sur le signal brut.
        expect(ctx.analysers).toHaveLength(1);
        expect(ctx.analysers[0].fftSize).toBe(ANALYSER_FFT_SIZE);
        expect(ctx.analysers[0].smoothingTimeConstant).toBe(0);
        expect(source.connections).toContain(ctx.analysers[0]);
        // JAMAIS MUETTE : un chemin mène de la source à la sortie…
        expect(reachesDestination(source, ctx.destination)).toBe(true);
        // …par le retard qui donne l'avance à la bouche, latence de sortie déduite (200 − 20 ms).
        expect(ctx.delays).toHaveLength(1);
        expect(ctx.delays[0].delayTime.value).toBeCloseTo((LIP_SYNC_LOOKAHEAD_MS - 20) / 1000, 6);
        expect(source.connections).toContain(ctx.delays[0]);
        expect(reachesDestination(ctx.delays[0], ctx.destination)).toBe(true);

        // ANTICIPATION : la forme publiée est lue (retard − avance visuelle − retard
        // d'affichage) dans le passé, soit 46 ms. Avant ce délai, la bouche reste
        // au repos ; ensuite la voyelle apparaît.
        const retardBouche = LIP_SYNC_LOOKAHEAD_MS - VISUAL_LEAD_MS - RENDER_LATENCY_MS;
        expect(retardBouche).toBeGreaterThan(0);
        image(2); // 32 ms : rien encore
        expect(formes.at(-1)!.open).toBe(0);
        image(Math.ceil(retardBouche / 16) + 3);
        // Voyelle « a » franche → mâchoire ouverte (amplitude de parole, pas un cri), lèvres ni jointes ni dents.
        const a = formes.at(-1)!;
        expect(a.open).toBeGreaterThan(0.3);
        expect(a.open).toBeLessThanOrEqual(0.62);
        expect(a.closed).toBeLessThan(0.2);
        expect(a.teeth).toBeLessThan(0.1);
        expect(niveaux.at(-1)).toBeGreaterThan(0.9);
        // Fricative « s », faible : dents visibles, mâchoire presque close.
        FakeAudioContext.sample = 0.02;
        FakeAudioContext.spectre = 's';
        image(Math.ceil(retardBouche / 16) + 6);
        const s = formes.at(-1)!;
        expect(s.teeth).toBeGreaterThan(0.5);
        expect(s.open).toBeLessThan(0.18);
        // Silence → lèvres jointes, niveau 0 (le spectre en octets dirait 200/255 : il n'est pas relu).
        FakeAudioContext.sample = 0;
        FakeAudioContext.spectre = 'silence';
        image(Math.ceil(retardBouche / 16) + 6);
        expect(formes.at(-1)!.open).toBe(0);
        expect(formes.at(-1)!.closed).toBeGreaterThan(0.9);
        expect(niveaux.at(-1)).toBe(0);
        // Souffle du fichier → toujours close.
        FakeAudioContext.sample = 0.004;
        image(Math.ceil(retardBouche / 16) + 6);
        expect(formes.at(-1)!.open).toBe(0);

        // Fin de lecture : la bouche revient au repos et la boucle s'arrête.
        FakeAudioContext.sample = 0.2;
        FakeAudioContext.spectre = 'a';
        FakeAudio.instances[0].onended?.();
        await lecture;
        expect(niveaux.at(-1)).toBe(0);
        expect(formes.at(-1)!.open).toBe(0);
        const avant = frames.length;
        image();
        expect(frames.length).toBeLessThanOrEqual(avant);
        off();
    });

    it('sortie audio lente (casque Bluetooth) : plus de retard sur la voix, la BOUCHE attend le son', async () => {
        FakeAudioContext.outputLatency = 0.22; // 220 ms
        const formes: MouthShape[] = [];
        const off = voiceEngine.addListener({ onMouthShape: (s) => formes.push(s) });
        FakeAudioContext.sample = 0.2;
        FakeAudioContext.spectre = 'a';
        const lecture = voiceEngine.speak('Bonjour.');
        await vi.waitFor(() => expect(FakeAudio.instances).toHaveLength(1));
        const ctx = FakeAudioContext.instances[0];
        expect(ctx.delays[0].delayTime.value).toBe(0);
        expect((voiceEngine as any).outputLatencyMs).toBeCloseTo(220, 3);
        // Pendant (220 − 60 − 94) ms, la bouche reste au repos : le son n'est pas encore entendu.
        image(3); // 48 ms
        expect(formes.filter((f) => f.open > 0)).toHaveLength(0);
        image(5); // 128 ms : la voyelle est maintenant entendue
        expect(formes.at(-1)!.open).toBeGreaterThan(0.3);
        FakeAudio.instances[0].onended?.();
        await lecture;
        off();
    });
});
