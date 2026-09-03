/**
 * Découpage de la voix en segments PCM prêts pour la transcription serveur
 * (mission VF-4 — « la traduction ne fonctionne pas »).
 *
 * L'interprète d'appel et les vocaux reposaient sur la reconnaissance vocale
 * du NAVIGATEUR, absente ou muette sur la plupart des téléphones : aucun
 * sous-titre, aucune traduction, et l'utilisateur concluait que la langue
 * choisie n'était pas prise en compte. Ce module fabrique, à partir de la
 * piste micro, des segments WAV 16 kHz mono 16 bits que la passerelle
 * transcrit (et traduit) côté serveur, quel que soit l'appareil.
 *
 * Deux couches, volontairement séparées :
 * - des fonctions PURES et une machine à états (`SegmenterCore`) sans Web
 *   Audio — testées unitairement avec des trames synthétiques ;
 * - `PcmSegmenter`, la seule pièce qui touche au navigateur (AudioContext,
 *   AudioWorklet avec repli ScriptProcessor), qui nourrit la première.
 */

export const SEGMENT_SAMPLE_RATE = 16000;

// ── Fonctions pures ─────────────────────────────────────────────────────────

/**
 * Rééchantillonnage d'un flux mono. À la baisse (cas courant : 48 kHz → 16 kHz)
 * chaque échantillon de sortie est la MOYENNE de la fenêtre source qu'il
 * recouvre — un anti-repliement simple, suffisant pour la parole. À la hausse
 * (rare), interpolation linéaire. Même cadence → copie telle quelle.
 */
export function downsampleFloat32(samples: Float32Array, fromRate: number, toRate: number = SEGMENT_SAMPLE_RATE): Float32Array {
    if (!(fromRate > 0) || !(toRate > 0)) throw new Error('downsampleFloat32 : cadence invalide.');
    if (fromRate === toRate) return new Float32Array(samples);
    const ratio = fromRate / toRate;
    const outLength = Math.floor(samples.length / ratio);
    const out = new Float32Array(outLength);
    if (ratio >= 1) {
        for (let i = 0; i < outLength; i++) {
            const start = Math.floor(i * ratio);
            const end = Math.min(Math.floor((i + 1) * ratio), samples.length);
            let sum = 0;
            let count = 0;
            for (let j = start; j < end; j++) { sum += samples[j]; count++; }
            out[i] = count > 0 ? sum / count : 0;
        }
        return out;
    }
    for (let i = 0; i < outLength; i++) {
        const pos = i * ratio;
        const i0 = Math.floor(pos);
        const i1 = Math.min(i0 + 1, samples.length - 1);
        const t = pos - i0;
        out[i] = samples[i0] * (1 - t) + samples[i1] * t;
    }
    return out;
}

/** Niveau efficace (RMS) d'une trame, entre 0 et 1. Trame vide → 0. */
export function rms(frame: Float32Array): number {
    if (frame.length === 0) return 0;
    let sum = 0;
    for (let i = 0; i < frame.length; i++) sum += frame[i] * frame[i];
    return Math.sqrt(sum / frame.length);
}

/** Float32 [-1, 1] → PCM 16 bits signé, avec écrêtage (jamais de débordement). */
export function floatTo16BitPcm(samples: Float32Array): Int16Array {
    const out = new Int16Array(samples.length);
    for (let i = 0; i < samples.length; i++) {
        const s = Math.max(-1, Math.min(1, samples[i]));
        out[i] = s < 0 ? Math.round(s * 32768) : Math.round(s * 32767);
    }
    return out;
}

/** Mélange N canaux en mono (moyenne échantillon par échantillon). Aucun canal → vide. */
export function mixToMono(channels: Float32Array[]): Float32Array {
    if (channels.length === 0) return new Float32Array(0);
    if (channels.length === 1) return new Float32Array(channels[0]);
    const length = Math.min(...channels.map((c) => c.length));
    const out = new Float32Array(length);
    for (let i = 0; i < length; i++) {
        let sum = 0;
        for (const channel of channels) sum += channel[i];
        out[i] = sum / channels.length;
    }
    return out;
}

/** Concatène des trames Int16 en une seule. */
export function concatInt16(parts: Int16Array[]): Int16Array {
    let total = 0;
    for (const p of parts) total += p.length;
    const out = new Int16Array(total);
    let offset = 0;
    for (const p of parts) { out.set(p, offset); offset += p.length; }
    return out;
}

/**
 * Conteneur WAV (RIFF, PCM 16 bits, mono, petit-boutiste) autour d'un tampon
 * Int16 — en-tête canonique de 44 octets, tel que l'attend la passerelle.
 */
export function encodeWav16kMono(pcm: Int16Array, sampleRate: number = SEGMENT_SAMPLE_RATE): Uint8Array {
    const dataBytes = pcm.length * 2;
    const buffer = new ArrayBuffer(44 + dataBytes);
    const view = new DataView(buffer);
    const writeAscii = (offset: number, text: string) => { for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i)); };
    writeAscii(0, 'RIFF');
    view.setUint32(4, 36 + dataBytes, true);
    writeAscii(8, 'WAVE');
    writeAscii(12, 'fmt ');
    view.setUint32(16, 16, true);          // taille du bloc fmt
    view.setUint16(20, 1, true);           // PCM
    view.setUint16(22, 1, true);           // mono
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // octets/seconde
    view.setUint16(32, 2, true);           // alignement de bloc
    view.setUint16(34, 16, true);          // bits par échantillon
    writeAscii(36, 'data');
    view.setUint32(40, dataBytes, true);
    for (let i = 0; i < pcm.length; i++) view.setInt16(44 + i * 2, pcm[i], true);
    return new Uint8Array(buffer);
}

/**
 * Base64 par blocs : `String.fromCharCode(...bytes)` en un seul appel
 * dépasse la pile d'arguments dès quelques centaines de Ko (un segment de 9 s
 * fait 288 Ko, un vocal d'une minute près de 2 Mo).
 */
export function bytesToBase64(bytes: Uint8Array): string {
    const CHUNK = 0x8000;
    let binary = '';
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + CHUNK)));
    }
    return btoa(binary);
}

// ── Machine à états (sans Web Audio) ────────────────────────────────────────

export interface SegmenterCoreOptions {
    /** Cadence des trames reçues (défaut 16 kHz). */
    sampleRate?: number;
    /** Audio conservé AVANT le premier son détecté — le début du mot n'est jamais coupé (défaut 240 ms). */
    preRollMs?: number;
    /** Silence qui clôt un segment (défaut 700 ms). */
    silenceMs?: number;
    /** Durée maximale d'un segment, silence ou pas (défaut 9 s) — garde la latence bornée. */
    maxSegmentMs?: number;
    /** En dessous, le segment est un bruit bref (toux, clic) : ignoré (défaut 350 ms de parole). */
    minSpeechMs?: number;
    /** Plancher absolu du seuil de parole (défaut 0,008). */
    minThreshold?: number;
    /** Seuil = max(minThreshold, noiseFactor × plancher de bruit glissant) (défaut 3). */
    noiseFactor?: number;
    /**
     * Vrai pendant que l'interprète parle dans mon haut-parleur : ce que le
     * micro capte ALORS est jeté. Ce qui a été capté AVANT est ma voix — un
     * segment entamé est clos et émis (`closedBy: 'pause'`), jamais jeté.
     */
    isPaused?: () => boolean;
    onSegment: (pcm: Int16Array, durationMs: number, closedBy: SegmentClose) => void;
}

/**
 * Ce qui a clos un segment : un silence (fin de phrase), la durée maximale,
 * l'entrée en pause (l'interprète se met à parler — la parole d'avant est
 * gardée), ou la fin de la capture.
 */
export type SegmentClose = 'silence' | 'max' | 'pause' | 'flush';

/** Pas d'analyse : 20 ms — toutes les durées sont comptées en multiples de ce pas. */
const HOP_MS = 20;
/** Fenêtre du plancher de bruit glissant : 2 s (100 pas). */
const NOISE_WINDOW_HOPS = 100;

/**
 * Détecteur d'activité vocale par énergie, à seuil adaptatif : une trame est
 * de la parole si son RMS dépasse max(0,008 ; 3 × plancher de bruit). Le
 * plancher est le MINIMUM du niveau sur les 2 dernières secondes — il épouse
 * le bruit ambiant (creux entre les mots, silences) et remonte de lui-même
 * quand un bruit de fond s'installe, sans jamais grimper au niveau de la
 * voix elle-même (une phrase a toujours des creux). La piste micro arrive
 * déjà débruitée et avec annulation d'écho (contraintes de capture de
 * l'appel) : le plancher reste bas en pratique.
 */
export class SegmenterCore {
    private readonly sampleRate: number;
    private readonly hopSamples: number;
    private readonly preRollHops: number;
    private readonly silenceMs: number;
    private readonly maxSegmentMs: number;
    private readonly minSpeechMs: number;
    private readonly minThreshold: number;
    private readonly noiseFactor: number;

    private pending = new Float32Array(0);
    private preRoll: Int16Array[] = [];
    private segment: Int16Array[] = [];
    private inSpeech = false;
    private segmentMs = 0;
    private speechMs = 0;
    private trailingSilenceMs = 0;
    /** Niveaux des derniers pas (anneau) — le plancher de bruit en est le minimum. */
    private readonly recentLevels = new Float32Array(NOISE_WINDOW_HOPS);
    private recentCount = 0;
    private recentIndex = 0;

    constructor(private readonly options: SegmenterCoreOptions) {
        this.sampleRate = options.sampleRate ?? SEGMENT_SAMPLE_RATE;
        this.hopSamples = Math.max(1, Math.round((this.sampleRate * HOP_MS) / 1000));
        this.preRollHops = Math.max(0, Math.round((options.preRollMs ?? 240) / HOP_MS));
        this.silenceMs = options.silenceMs ?? 700;
        this.maxSegmentMs = options.maxSegmentMs ?? 9000;
        this.minSpeechMs = options.minSpeechMs ?? 350;
        this.minThreshold = options.minThreshold ?? 0.008;
        this.noiseFactor = options.noiseFactor ?? 3;
    }

    /** Plancher de bruit glissant : minimum du niveau sur la fenêtre (0 tant que rien n'a été entendu). */
    get noiseFloor(): number {
        if (this.recentCount === 0) return 0;
        let min = Number.POSITIVE_INFINITY;
        for (let i = 0; i < this.recentCount; i++) if (this.recentLevels[i] < min) min = this.recentLevels[i];
        return min;
    }

    /** Seuil de parole courant (exposé pour les tests). */
    get threshold(): number {
        return Math.max(this.minThreshold, this.noiseFactor * this.noiseFloor);
    }

    /** Vrai si un segment est en cours de capture. */
    get isCapturing(): boolean {
        return this.inSpeech;
    }

    /** Nourrit la machine d'une trame Float32 à `sampleRate` (taille libre). */
    push(frame: Float32Array): void {
        if (frame.length === 0) return;
        if (this.options.isPaused?.()) {
            // L'interprète parle dans mon haut-parleur : le micro l'entend.
            // Rien de ce qui arrive MAINTENANT n'est ma voix — on jette, y
            // compris le pré-roll (qui contiendrait sa voix à la reprise).
            // Mais ce qui a été capté AVANT cet instant est bien ma voix (le
            // signal « il parle » précède le son) : un segment entamé est
            // clos et émis, jamais jeté — sinon, face à un interprète qui
            // parle 60 % du temps, une parole continue n'était plus jamais
            // transcrite (banc VT-1b : 88 s sans une seule phrase envoyée,
            // chaque segment tué par la pause suivante avant de se clore).
            if (this.inSpeech) this.finishSegment('pause');
            this.pending = new Float32Array(0);
            this.preRoll = [];
            return;
        }
        const merged = new Float32Array(this.pending.length + frame.length);
        merged.set(this.pending, 0);
        merged.set(frame, this.pending.length);
        let offset = 0;
        while (merged.length - offset >= this.hopSamples) {
            this.processHop(merged.subarray(offset, offset + this.hopSamples));
            offset += this.hopSamples;
        }
        this.pending = merged.slice(offset);
    }

    /** Clôt un segment en cours (fin d'enregistrement) s'il contient assez de parole. */
    flush(): void {
        if (this.inSpeech) this.finishSegment('flush');
        this.pending = new Float32Array(0);
    }

    /** Abandonne tout ce qui est en cours sans rien émettre (le plancher de bruit appris est conservé). */
    reset(): void {
        this.discardCurrent();
        this.pending = new Float32Array(0);
        this.preRoll = [];
    }

    private processHop(hop: Float32Array): void {
        const level = rms(hop);
        this.recentLevels[this.recentIndex] = level;
        this.recentIndex = (this.recentIndex + 1) % NOISE_WINDOW_HOPS;
        if (this.recentCount < NOISE_WINDOW_HOPS) this.recentCount += 1;
        const isSpeech = level > this.threshold;
        const pcm = floatTo16BitPcm(hop);

        if (!this.inSpeech) {
            if (!isSpeech) {
                this.preRoll.push(pcm);
                if (this.preRoll.length > this.preRollHops) this.preRoll.splice(0, this.preRoll.length - this.preRollHops);
                return;
            }
            this.inSpeech = true;
            this.segment = [...this.preRoll, pcm];
            this.preRoll = [];
            this.segmentMs = (this.segment.length) * HOP_MS;
            this.speechMs = HOP_MS;
            this.trailingSilenceMs = 0;
            return;
        }

        this.segment.push(pcm);
        this.segmentMs += HOP_MS;
        if (isSpeech) { this.speechMs += HOP_MS; this.trailingSilenceMs = 0; }
        else this.trailingSilenceMs += HOP_MS;

        if (this.trailingSilenceMs >= this.silenceMs) this.finishSegment('silence');
        else if (this.segmentMs >= this.maxSegmentMs) this.finishSegment('max');
    }

    private finishSegment(closedBy: SegmentClose): void {
        const parts = this.segment;
        const durationMs = this.segmentMs;
        const speechMs = this.speechMs;
        this.discardCurrent();
        if (speechMs < this.minSpeechMs) return; // bruit bref, jamais envoyé
        this.options.onSegment(concatInt16(parts), durationMs, closedBy);
    }

    private discardCurrent(): void {
        this.inSpeech = false;
        this.segment = [];
        this.segmentMs = 0;
        this.speechMs = 0;
        this.trailingSilenceMs = 0;
    }
}

// ── Capture navigateur ──────────────────────────────────────────────────────

export interface PcmSegmenterOptions extends Omit<SegmenterCoreOptions, 'sampleRate'> {
    track: MediaStreamTrack;
    /** Erreur définitive de capture (contexte audio refusé, piste terminée) — l'appelant décide du repli. */
    onError?: (reason: string) => void;
}

type AudioContextCtor = new () => AudioContext;

function getAudioContextClass(): AudioContextCtor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as { AudioContext?: AudioContextCtor; webkitAudioContext?: AudioContextCtor };
    return w.AudioContext || w.webkitAudioContext || null;
}

/**
 * Code du processeur AudioWorklet : relaie l'entrée mono par paquets de 2048
 * échantillons (16 quanta de 128) — assez petits pour la réactivité, assez
 * grands pour ne pas noyer le fil principal de messages. Chargé depuis un
 * blob ; si le navigateur refuse (ancien Safari, politique de scripts),
 * repli sur ScriptProcessorNode.
 */
const WORKLET_SOURCE = `
class MokNetPcmTap extends AudioWorkletProcessor {
  constructor() { super(); this.buffer = new Float32Array(2048); this.filled = 0; }
  process(inputs) {
    const channel = inputs[0] && inputs[0][0];
    if (channel) {
      let offset = 0;
      while (offset < channel.length) {
        const take = Math.min(channel.length - offset, this.buffer.length - this.filled);
        this.buffer.set(channel.subarray(offset, offset + take), this.filled);
        this.filled += take; offset += take;
        if (this.filled === this.buffer.length) { this.port.postMessage(this.buffer.slice(0)); this.filled = 0; }
      }
    }
    return true;
  }
}
registerProcessor('moknet-pcm-tap', MokNetPcmTap);
`;

export class PcmSegmenter {
    /** AudioContext + MediaStream : ce qu'il faut pour écouter une piste micro. */
    static isSupported(): boolean {
        return getAudioContextClass() !== null && typeof MediaStream !== 'undefined';
    }

    private readonly core: SegmenterCore;
    private context: AudioContext | null = null;
    private source: MediaStreamAudioSourceNode | null = null;
    private tap: AudioNode | null = null;
    private sink: GainNode | null = null;
    private workletUrl: string | null = null;
    private paused = false;
    private stopped = false;
    private started = false;
    private readonly onTrackEnded = () => { this.options.onError?.('Piste micro terminée.'); };

    constructor(private readonly options: PcmSegmenterOptions) {
        this.core = new SegmenterCore({
            ...options,
            sampleRate: SEGMENT_SAMPLE_RATE,
            isPaused: () => this.paused || (this.options.isPaused?.() ?? false),
        });
    }

    async start(): Promise<void> {
        if (this.started || this.stopped) return;
        this.started = true;
        const Ctx = getAudioContextClass();
        if (!Ctx) throw new Error('Web Audio indisponible sur ce navigateur.');
        if (this.options.track.readyState === 'ended') throw new Error('Piste micro terminée.');
        const context = new Ctx();
        this.context = context;
        if (context.state === 'suspended') {
            try { await context.resume(); } catch { /* reprendra au prochain geste ; les trames arriveront alors */ }
        }
        if (this.stopped) { await this.teardown(); return; }
        const stream = new MediaStream([this.options.track]);
        const source = context.createMediaStreamSource(stream);
        this.source = source;
        // Un nœud d'analyse doit être relié à la destination pour être
        // cadencé par certains navigateurs : on passe par un gain à zéro —
        // rien de ma voix n'est rejoué dans mon haut-parleur.
        const sink = context.createGain();
        sink.gain.value = 0;
        sink.connect(context.destination);
        this.sink = sink;

        const inputRate = context.sampleRate;
        const onFrame = (frame: Float32Array) => {
            if (this.stopped) return;
            this.core.push(downsampleFloat32(frame, inputRate, SEGMENT_SAMPLE_RATE));
        };

        let tap: AudioNode | null = null;
        if (typeof AudioWorkletNode !== 'undefined' && context.audioWorklet && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            try {
                const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: 'application/javascript' }));
                this.workletUrl = url;
                await context.audioWorklet.addModule(url);
                if (this.stopped) { await this.teardown(); return; }
                const node = new AudioWorkletNode(context, 'moknet-pcm-tap', { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
                node.port.onmessage = (event: MessageEvent) => { if (event.data instanceof Float32Array) onFrame(event.data); };
                tap = node;
            } catch {
                tap = null; // repli ci-dessous
            }
        }
        if (!tap) {
            const ctxLegacy = context as AudioContext & { createScriptProcessor?: (bufferSize: number, inputs: number, outputs: number) => ScriptProcessorNode };
            if (typeof ctxLegacy.createScriptProcessor !== 'function') {
                await this.teardown();
                throw new Error('Aucun mode de capture audio disponible (AudioWorklet et ScriptProcessor absents).');
            }
            const processor = ctxLegacy.createScriptProcessor(4096, 1, 1);
            processor.onaudioprocess = (event: AudioProcessingEvent) => {
                // Copie : le tampon d'entrée est recyclé par le navigateur.
                onFrame(new Float32Array(event.inputBuffer.getChannelData(0)));
            };
            tap = processor;
        }
        this.tap = tap;
        source.connect(tap);
        tap.connect(sink);
        this.options.track.addEventListener('ended', this.onTrackEnded);
    }

    /** Suspend l'analyse (l'interprète parle) : les trames sont jetées, un segment entamé est abandonné. */
    pause(): void { this.paused = true; this.core.reset(); }
    resume(): void { this.paused = false; }

    /** Ferme le contexte, déconnecte tout ; sans effet si déjà arrêté. Rien n'est émis après. */
    stop(): void {
        if (this.stopped) return;
        this.stopped = true;
        this.core.reset();
        void this.teardown();
    }

    private async teardown(): Promise<void> {
        this.options.track.removeEventListener('ended', this.onTrackEnded);
        try { this.source?.disconnect(); } catch { /* déjà déconnecté */ }
        try { this.tap?.disconnect(); } catch { /* déjà déconnecté */ }
        try { this.sink?.disconnect(); } catch { /* déjà déconnecté */ }
        const tap = this.tap as (AudioNode & { onaudioprocess?: unknown; port?: MessagePort }) | null;
        if (tap) {
            if ('onaudioprocess' in tap) tap.onaudioprocess = null;
            if (tap.port) tap.port.onmessage = null;
        }
        this.source = null; this.tap = null; this.sink = null;
        if (this.workletUrl) { try { URL.revokeObjectURL(this.workletUrl); } catch { /* rien */ } this.workletUrl = null; }
        const context = this.context;
        this.context = null;
        if (context && context.state !== 'closed') {
            try { await context.close(); } catch { /* déjà fermé */ }
        }
    }
}

// ── Vocaux enregistrés (MediaRecorder) ──────────────────────────────────────

/** Octets d'un Blob — `arrayBuffer()` quand il existe, FileReader sinon (anciens WebKit). */
export function readBlobBytes(blob: Blob): Promise<ArrayBuffer> {
    if (typeof blob.arrayBuffer === 'function') return blob.arrayBuffer();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            if (reader.result instanceof ArrayBuffer) resolve(reader.result);
            else reject(new Error('Lecture du blob impossible.'));
        };
        reader.onerror = () => reject(reader.error ?? new Error('Lecture du blob impossible.'));
        reader.readAsArrayBuffer(blob);
    });
}

/**
 * Décode un enregistrement (webm/opus, mp4, ogg…) avec le décodeur du
 * navigateur, mélange en mono, rééchantillonne à 16 kHz et renvoie un WAV —
 * le même format que les segments d'appel, donc le même chemin serveur.
 * Rejette si le navigateur ne sait pas décoder ce conteneur ; l'appelant
 * choisit alors son repli (envoi de l'audio brut, ou vocal sans texte).
 */
export async function blobToWav16kMono(blob: Blob): Promise<{ wav: Uint8Array; durationMs: number }> {
    const Ctx = getAudioContextClass();
    if (!Ctx) throw new Error('Web Audio indisponible sur ce navigateur.');
    const bytes = await readBlobBytes(blob);
    const context = new Ctx();
    try {
        const decoded = await new Promise<AudioBuffer>((resolve, reject) => {
            // Forme à rappel : la promesse de decodeAudioData n'existe pas sur d'anciens WebKit.
            const maybePromise = context.decodeAudioData(bytes.slice(0), resolve, reject);
            if (maybePromise && typeof (maybePromise as Promise<AudioBuffer>).then === 'function') {
                (maybePromise as Promise<AudioBuffer>).then(resolve, reject);
            }
        });
        const channels: Float32Array[] = [];
        for (let c = 0; c < decoded.numberOfChannels; c++) channels.push(decoded.getChannelData(c));
        const mono = downsampleFloat32(mixToMono(channels), decoded.sampleRate, SEGMENT_SAMPLE_RATE);
        return { wav: encodeWav16kMono(floatTo16BitPcm(mono)), durationMs: Math.round((mono.length / SEGMENT_SAMPLE_RATE) * 1000) };
    } finally {
        if (context.state !== 'closed') { try { await context.close(); } catch { /* déjà fermé */ } }
    }
}
