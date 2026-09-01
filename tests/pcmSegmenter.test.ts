import { describe, expect, it, vi } from 'vitest';
import {
    SEGMENT_SAMPLE_RATE, SegmenterCore, bytesToBase64, concatInt16, downsampleFloat32, encodeWav16kMono,
    floatTo16BitPcm, mixToMono, rms,
} from '../services/calls/pcmSegmenter';

/**
 * VF-4 — découpage de la voix en segments PCM pour la transcription serveur.
 * Tout est testé SANS Web Audio : trames synthétiques déterministes (un
 * « bruit » ±a a exactement a pour RMS), machine à états pure.
 */

const RATE = SEGMENT_SAMPLE_RATE;

/** Signal déterministe de RMS exactement `amplitude`, sur `ms` millisecondes. */
function tone(ms: number, amplitude: number): Float32Array {
    const out = new Float32Array(Math.round((RATE * ms) / 1000));
    for (let i = 0; i < out.length; i++) out[i] = i % 2 === 0 ? amplitude : -amplitude;
    return out;
}

function concatFloat(parts: Float32Array[]): Float32Array {
    const out = new Float32Array(parts.reduce((n, p) => n + p.length, 0));
    let offset = 0;
    for (const p of parts) { out.set(p, offset); offset += p.length; }
    return out;
}

/**
 * « Parole » synthétique : syllabes de 120 ms au niveau `amplitude` séparées
 * de creux de 40 ms au niveau ambiant `ambient` — une voix a toujours des
 * creux, c'est ce qui distingue une phrase d'un bruit continu.
 */
function speech(ms: number, amplitude: number, ambient = 0.001): Float32Array {
    const parts: Float32Array[] = [];
    let total = 0;
    while (total < ms) {
        const syllable = Math.min(120, ms - total); parts.push(tone(syllable, amplitude)); total += syllable;
        if (total >= ms) break;
        const gap = Math.min(40, ms - total); parts.push(tone(gap, ambient)); total += gap;
    }
    return concatFloat(parts);
}

/** Nourrit la machine par paquets de `chunk` échantillons (comme un ScriptProcessor). */
function feed(core: SegmenterCore, signal: Float32Array, chunk = 1365): void {
    for (let i = 0; i < signal.length; i += chunk) core.push(signal.subarray(i, Math.min(i + chunk, signal.length)));
}

describe('Fonctions pures — rééchantillonnage, niveau, PCM, WAV, base64', () => {
    it('48 kHz → 16 kHz : un tiers des échantillons, un signal constant est conservé', () => {
        const input = new Float32Array(4800).fill(0.25);
        const out = downsampleFloat32(input, 48000, 16000);
        expect(out.length).toBe(1600);
        expect(out[0]).toBeCloseTo(0.25, 6);
        expect(out[1599]).toBeCloseTo(0.25, 6);
    });

    it('même cadence → copie fidèle ; cadence plus basse → interpolation (8 kHz → 16 kHz double la longueur)', () => {
        const input = new Float32Array([0, 1, 0, -1]);
        const same = downsampleFloat32(input, 16000, 16000);
        expect(Array.from(same)).toEqual([0, 1, 0, -1]);
        expect(same).not.toBe(input);
        const up = downsampleFloat32(input, 8000, 16000);
        expect(up.length).toBe(8);
        expect(up[1]).toBeCloseTo(0.5, 6); // à mi-chemin entre 0 et 1
    });

    it('la moyenne de fenêtre atténue un repliement : une alternance ±1 à 48 kHz devient ~0 à 16 kHz', () => {
        const alternating = tone(100, 1); // ±1 à chaque échantillon
        const out = downsampleFloat32(alternating, 48000, 16000);
        expect(rms(out)).toBeLessThan(0.4);
    });

    it('rms : silence → 0, ±a → a, trame vide → 0', () => {
        expect(rms(new Float32Array(320))).toBe(0);
        expect(rms(tone(20, 0.3))).toBeCloseTo(0.3, 6);
        expect(rms(new Float32Array(0))).toBe(0);
    });

    it('floatTo16BitPcm : plage complète et écrêtage, jamais de débordement', () => {
        const out = floatTo16BitPcm(new Float32Array([1, -1, 2, -2, 0, 0.5]));
        expect(Array.from(out)).toEqual([32767, -32768, 32767, -32768, 0, 16384]);
    });

    it('mixToMono et concatInt16', () => {
        const mono = mixToMono([new Float32Array([1, 0]), new Float32Array([0, 1])]);
        expect(Array.from(mono)).toEqual([0.5, 0.5]);
        expect(mixToMono([]).length).toBe(0);
        expect(Array.from(concatInt16([new Int16Array([1, 2]), new Int16Array([3])]))).toEqual([1, 2, 3]);
    });

    it('encodeWav16kMono : en-tête RIFF canonique de 44 octets, PCM 16 bits mono 16 kHz petit-boutiste', () => {
        const pcm = new Int16Array([1, -1, 32767, -32768]);
        const wav = encodeWav16kMono(pcm);
        const view = new DataView(wav.buffer, wav.byteOffset, wav.byteLength);
        const ascii = (offset: number, length: number) => String.fromCharCode(...wav.subarray(offset, offset + length));
        expect(wav.length).toBe(44 + 8);
        expect(ascii(0, 4)).toBe('RIFF');
        expect(view.getUint32(4, true)).toBe(36 + 8);
        expect(ascii(8, 4)).toBe('WAVE');
        expect(ascii(12, 4)).toBe('fmt ');
        expect(view.getUint32(16, true)).toBe(16);
        expect(view.getUint16(20, true)).toBe(1);       // PCM
        expect(view.getUint16(22, true)).toBe(1);       // mono
        expect(view.getUint32(24, true)).toBe(16000);   // cadence
        expect(view.getUint32(28, true)).toBe(32000);   // octets/s
        expect(view.getUint16(32, true)).toBe(2);       // alignement
        expect(view.getUint16(34, true)).toBe(16);      // bits
        expect(ascii(36, 4)).toBe('data');
        expect(view.getUint32(40, true)).toBe(8);
        expect(view.getInt16(44, true)).toBe(1);
        expect(view.getInt16(46, true)).toBe(-1);
        expect(view.getInt16(48, true)).toBe(32767);
        expect(view.getInt16(50, true)).toBe(-32768);
    });

    it('bytesToBase64 : identique à Buffer sur un tampon plus grand qu\'un bloc (> 32 Ko)', () => {
        const bytes = new Uint8Array(100_003);
        for (let i = 0; i < bytes.length; i++) bytes[i] = (i * 7919 + 13) & 0xff;
        expect(bytesToBase64(bytes)).toBe(Buffer.from(bytes).toString('base64'));
        expect(bytesToBase64(new Uint8Array(0))).toBe('');
    });
});

describe('SegmenterCore — détection de parole et découpage', () => {
    const build = (overrides: Partial<ConstructorParameters<typeof SegmenterCore>[0]> = {}) => {
        const onSegment = vi.fn<(pcm: Int16Array, durationMs: number) => void>();
        const core = new SegmenterCore({ onSegment, ...overrides });
        return { core, onSegment };
    };

    it('silence → 1 s de parole → silence : un seul segment, pré-roll et fin de segment compris', () => {
        const { core, onSegment } = build();
        feed(core, concatFloat([tone(600, 0.001), speech(1000, 0.2), tone(1500, 0.001)]));
        expect(onSegment).toHaveBeenCalledTimes(1);
        const [pcm, durationMs] = onSegment.mock.calls[0];
        // 240 ms de pré-roll + 1000 ms de parole + 700 ms de silence de clôture (à un pas de 20 ms près).
        expect(durationMs).toBeGreaterThanOrEqual(1900);
        expect(durationMs).toBeLessThanOrEqual(1980);
        expect(pcm.length).toBe((durationMs * RATE) / 1000);
        // Le début du segment est bien le pré-roll silencieux, la parole vient après.
        expect(Math.abs(pcm[0])).toBeLessThan(100);
        expect(Math.abs(pcm[Math.round((RATE * 500) / 1000)])).toBeGreaterThan(5000);
    });

    it('un bruit bref (< 350 ms de parole) n\'est jamais envoyé', () => {
        const { core, onSegment } = build();
        feed(core, concatFloat([tone(500, 0.001), tone(200, 0.3), tone(1500, 0.001)]));
        expect(onSegment).not.toHaveBeenCalled();
    });

    it('la parole qui commence dès la première trame est détectée (le pré-roll garde son début)', () => {
        const { core, onSegment } = build();
        feed(core, concatFloat([speech(1000, 0.2), tone(1000, 0.001)]));
        expect(onSegment).toHaveBeenCalledTimes(1);
        expect(onSegment.mock.calls[0][1]).toBeGreaterThanOrEqual(1500);
    });

    it('parole continue : coupée à 9 s au plus, puis un second segment', () => {
        const { core, onSegment } = build();
        feed(core, concatFloat([tone(300, 0.001), speech(12000, 0.2), tone(1000, 0.001)]));
        expect(onSegment).toHaveBeenCalledTimes(2);
        expect(onSegment.mock.calls[0][1]).toBeLessThanOrEqual(9000);
        expect(onSegment.mock.calls[0][1]).toBeGreaterThanOrEqual(8980);
        expect(onSegment.mock.calls[1][1]).toBeGreaterThan(3000);
    });

    it('seuil adaptatif : un bruit de fond installé relève le seuil, la vraie parole passe toujours', () => {
        const { core, onSegment } = build();
        feed(core, tone(3000, 0.05)); // ventilateur : RMS 0,05 pendant 3 s
        expect(core.threshold).toBeCloseTo(0.15, 6);
        expect(onSegment).not.toHaveBeenCalled();
        // Un murmure au niveau du bruit ne déclenche rien…
        feed(core, tone(800, 0.05));
        expect(onSegment).not.toHaveBeenCalled();
        // …une voix nette (dont les creux restent au niveau du ventilateur), si.
        feed(core, concatFloat([speech(1000, 0.4, 0.05), tone(1200, 0.05)]));
        expect(onSegment).toHaveBeenCalledTimes(1);
        expect(onSegment.mock.calls[0][1]).toBeLessThan(2100);
    });

    it('le plancher redescend dès que le calme revient : le seuil retrouve son minimum (0,008)', () => {
        const { core } = build();
        feed(core, tone(2000, 0.05));
        expect(core.threshold).toBeGreaterThan(0.1);
        feed(core, tone(100, 0.0005));
        expect(core.threshold).toBeCloseTo(0.008, 6);
    });

    it('un bruit de fond qui s\'installe en cours d\'appel devient du silence en 2 s au plus', () => {
        const { core, onSegment } = build();
        feed(core, tone(1000, 0.001));
        expect(core.threshold).toBeCloseTo(0.008, 6);
        feed(core, tone(2100, 0.05)); // le ventilateur démarre : d'abord pris pour de la parole…
        expect(core.threshold).toBeCloseTo(0.15, 6); // …puis le plancher l'a rejoint.
        feed(core, tone(2000, 0.05));
        // Le segment de bruit initial est clos (≈ 2 s de « parole » + 700 ms) et aucun autre ne suit.
        expect(onSegment).toHaveBeenCalledTimes(1);
        expect(onSegment.mock.calls[0][1]).toBeLessThan(3200);
    });

    it('le découpage ne dépend pas de la taille des paquets reçus', () => {
        const signal = concatFloat([tone(400, 0.001), speech(1500, 0.2), tone(900, 0.001), speech(800, 0.25), tone(1200, 0.001)]);
        const a = build(); feed(a.core, signal, 320);
        const b = build(); feed(b.core, signal, 4096);
        const c = build(); feed(c.core, signal, 1365);
        expect(a.onSegment).toHaveBeenCalledTimes(2);
        expect(b.onSegment).toHaveBeenCalledTimes(2);
        expect(c.onSegment).toHaveBeenCalledTimes(2);
        for (let i = 0; i < 2; i++) {
            expect(Math.abs(a.onSegment.mock.calls[i][1] - b.onSegment.mock.calls[i][1])).toBeLessThanOrEqual(40);
            expect(Math.abs(a.onSegment.mock.calls[i][1] - c.onSegment.mock.calls[i][1])).toBeLessThanOrEqual(40);
        }
    });

    it('en pause (l\'interprète parle dans mon haut-parleur) : tout est jeté, y compris un segment entamé', () => {
        let paused = false;
        const { core, onSegment } = build({ isPaused: () => paused });
        feed(core, concatFloat([tone(400, 0.001), speech(500, 0.2)]));
        expect(core.isCapturing).toBe(true);
        paused = true;
        feed(core, concatFloat([speech(1000, 0.2), tone(1000, 0.001)]));
        expect(core.isCapturing).toBe(false);
        expect(onSegment).not.toHaveBeenCalled();
        paused = false;
        feed(core, concatFloat([tone(300, 0.001), speech(1000, 0.2), tone(1000, 0.001)]));
        expect(onSegment).toHaveBeenCalledTimes(1);
    });

    it('flush() clôt un segment en cours (fin d\'enregistrement) ; reset() l\'abandonne', () => {
        const a = build();
        feed(a.core, concatFloat([tone(300, 0.001), speech(1000, 0.2)]));
        expect(a.onSegment).not.toHaveBeenCalled();
        a.core.flush();
        expect(a.onSegment).toHaveBeenCalledTimes(1);
        const b = build();
        feed(b.core, concatFloat([tone(300, 0.001), speech(1000, 0.2)]));
        b.core.reset();
        b.core.flush();
        expect(b.onSegment).not.toHaveBeenCalled();
    });
});
