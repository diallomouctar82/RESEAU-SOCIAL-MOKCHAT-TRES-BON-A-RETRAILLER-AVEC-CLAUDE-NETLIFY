import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    __resetRingtoneServiceForTests,
    DEFAULT_RINGTONE_ID,
    getRingtones,
    getSelectedRingtoneId,
    isRingbackActive,
    isRinging,
    MASTER_GAIN,
    previewRingtone,
    RINGBACK_GAIN,
    RINGING_TIMEOUT_MS,
    RINGTONE_STORAGE_KEY,
    setSelectedRingtoneId,
    startRingback,
    startRinging,
    stopPreview,
    stopRingback,
    stopRinging,
    VIBRATION_PATTERN,
} from '../services/calls/ringtoneService';

/**
 * ÉQUIPE 9 (Audio & Sonneries) — tests du service de sonnerie.
 *
 * jsdom n'implémente pas WebAudio : tout passe par des doublures minimales
 * qui enregistrent ce que le service programme (oscillateurs, fréquences,
 * gains, arrêts). Chaque assertion vise un engagement précis du contrat :
 * jamais deux boucles superposées, arrêt VRAIMENT immédiat (stop sans
 * horodatage + vibrate(0)), aperçu borné à une itération, coupe-circuit à
 * 45 s, persistance localStorage.
 */

/* ─────────────────────── Doublures WebAudio minimales ─────────────────── */

class FakeAudioParam {
    value = 0;
    setValueAtTime = vi.fn();
    linearRampToValueAtTime = vi.fn();
    exponentialRampToValueAtTime = vi.fn();
    cancelScheduledValues = vi.fn();
}

class FakeAudioNode {
    connect = vi.fn();
    disconnect = vi.fn();
}

class FakeOscillator extends FakeAudioNode {
    type = 'sine';
    frequency = new FakeAudioParam();
    started = false;
    /** Vrai seulement après un stop() SANS horodatage — l'arrêt immédiat. */
    stoppedNow = false;
    start = vi.fn((_when?: number) => {
        this.started = true;
    });
    stop = vi.fn((when?: number) => {
        if (when === undefined) this.stoppedNow = true;
    });
}

class FakeGain extends FakeAudioNode {
    gain = new FakeAudioParam();
}

class FakeDelay extends FakeAudioNode {
    delayTime = new FakeAudioParam();
}

class FakeAudioContext {
    static instances: FakeAudioContext[] = [];
    static defaultState: AudioContextState = 'running';
    static resumeShouldFail = false;

    state: AudioContextState = FakeAudioContext.defaultState;
    currentTime = 0;
    destination = new FakeAudioNode();
    oscillators: FakeOscillator[] = [];
    gains: FakeGain[] = [];

    constructor() {
        FakeAudioContext.instances.push(this);
    }

    createOscillator() {
        const osc = new FakeOscillator();
        this.oscillators.push(osc);
        return osc;
    }

    createGain() {
        const gain = new FakeGain();
        this.gains.push(gain);
        return gain;
    }

    createDelay(_maxDelay?: number) {
        return new FakeDelay();
    }

    resume = vi.fn(async () => {
        if (FakeAudioContext.resumeShouldFail) throw new Error('autoplay bloqué');
        this.state = 'running';
    });

    close = vi.fn(async () => {
        this.state = 'closed';
    });
}

let vibrateMock: ReturnType<typeof vi.fn>;

/** Toutes les fréquences programmées sur les oscillateurs d'un contexte. */
function scheduledFreqs(ctx: FakeAudioContext): number[] {
    return ctx.oscillators.flatMap((osc) =>
        osc.frequency.setValueAtTime.mock.calls.map((call) => call[0] as number),
    );
}

beforeEach(() => {
    vi.useFakeTimers();
    FakeAudioContext.instances = [];
    FakeAudioContext.defaultState = 'running';
    FakeAudioContext.resumeShouldFail = false;
    (window as any).AudioContext = FakeAudioContext;
    vibrateMock = vi.fn(() => true);
    Object.defineProperty(window.navigator, 'vibrate', {
        configurable: true,
        writable: true,
        value: vibrateMock,
    });
});

afterEach(() => {
    __resetRingtoneServiceForTests();
    vi.useRealTimers();
    delete (window as any).AudioContext;
    delete (window.navigator as any).vibrate;
});

/* ─────────────────────────────── Catalogue ─────────────────────────────── */

describe('catalogue', () => {
    it('contient au moins 5 sonneries aux ids uniques, dont la sonnerie par défaut', () => {
        const ringtones = getRingtones();
        expect(ringtones.length).toBeGreaterThanOrEqual(5);
        const ids = ringtones.map((r) => r.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(ids).toContain(DEFAULT_RINGTONE_ID);
    });

    it('chaque sonnerie est jouable en boucle : notes contenues dans la durée du motif, nom et description présents', () => {
        for (const spec of getRingtones()) {
            expect(spec.name.trim().length).toBeGreaterThan(0);
            expect(spec.description.trim().length).toBeGreaterThan(0);
            expect(spec.notes.length).toBeGreaterThan(0);
            expect(spec.loopDuration).toBeGreaterThanOrEqual(2);
            expect(spec.loopDuration).toBeLessThanOrEqual(3.5);
            for (const note of spec.notes) {
                const end = note.time + spec.attack + note.duration + spec.release;
                expect(end).toBeLessThanOrEqual(spec.loopDuration);
            }
        }
    });

    it('reste harmonieuse et non stridente : registre médium, vélocités bornées, écho borné', () => {
        for (const spec of getRingtones()) {
            for (const note of spec.notes) {
                expect(note.freq).toBeGreaterThanOrEqual(300);
                expect(note.freq).toBeLessThanOrEqual(1000);
                expect(note.velocity ?? 1).toBeLessThanOrEqual(1);
            }
            if (spec.echo) expect(spec.echo.gain).toBeLessThanOrEqual(0.35);
        }
        expect(MASTER_GAIN).toBeLessThanOrEqual(0.3);
    });
});

/* ─────────────────────────── Sonnerie entrante ─────────────────────────── */

describe('startRinging / stopRinging', () => {
    it('sonne ET vibre en boucle — un seul événement pilote les deux', async () => {
        const audible = await startRinging();
        expect(audible).toBe(true);
        expect(isRinging()).toBe(true);

        const ctx = FakeAudioContext.instances[0];
        const perIteration = ctx.oscillators.length;
        expect(perIteration).toBeGreaterThan(0);
        expect(vibrateMock).toHaveBeenCalledWith(VIBRATION_PATTERN);

        // La boucle réitère le motif (Signature : 2,6 s) et la vibration se répète.
        await vi.advanceTimersByTimeAsync(2600);
        expect(ctx.oscillators.length).toBe(perIteration * 2);
        const patternCalls = vibrateMock.mock.calls.filter((c) => Array.isArray(c[0]));
        expect(patternCalls.length).toBeGreaterThanOrEqual(2);
    });

    it('deux startRinging successifs ne superposent JAMAIS deux boucles', async () => {
        await startRinging();
        const timersAfterFirst = vi.getTimerCount(); // sécurité + vibration + boucle
        const ctx = FakeAudioContext.instances[0];
        const firstBatch = ctx.oscillators.slice();
        expect(firstBatch.length).toBeGreaterThan(0);

        await startRinging();
        // Même empreinte de timers qu'une seule sonnerie : rien ne s'accumule.
        expect(vi.getTimerCount()).toBe(timersAfterFirst);
        // Les oscillateurs de la première boucle ont été stoppés immédiatement.
        expect(firstBatch.every((osc) => osc.stoppedNow)).toBe(true);
        // Et l'AudioContext est réutilisé, pas dupliqué.
        expect(FakeAudioContext.instances.length).toBe(1);
    });

    it('stopRinging arrête TOUT, immédiatement : oscillateurs, vibrate(0), timers', async () => {
        await startRinging();
        const ctx = FakeAudioContext.instances[0];
        expect(ctx.oscillators.length).toBeGreaterThan(0);
        vibrateMock.mockClear();

        stopRinging();

        expect(ctx.oscillators.every((osc) => osc.stoppedNow)).toBe(true);
        expect(vibrateMock).toHaveBeenCalledWith(0);
        expect(vi.getTimerCount()).toBe(0);
        expect(isRinging()).toBe(false);

        // Plus rien ne repart ensuite.
        const count = ctx.oscillators.length;
        await vi.advanceTimersByTimeAsync(10_000);
        expect(ctx.oscillators.length).toBe(count);
    });

    it('coupe-circuit : arrêt automatique après 45 s de sonnerie continue', async () => {
        await startRinging();
        const ctx = FakeAudioContext.instances[0];

        await vi.advanceTimersByTimeAsync(RINGING_TIMEOUT_MS);

        expect(isRinging()).toBe(false);
        expect(ctx.oscillators.every((osc) => osc.stoppedNow)).toBe(true);
        expect(vibrateMock).toHaveBeenCalledWith(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('joue la sonnerie choisie en localStorage quand aucun id n’est passé', async () => {
        setSelectedRingtoneId('kora');
        await startRinging();
        // F4 (349.23 Hz) ouvre le motif Kora et n'existe dans aucune autre sonnerie.
        expect(scheduledFreqs(FakeAudioContext.instances[0])).toContain(349.23);
    });

    it('un id explicite prime sur le choix stocké', async () => {
        setSelectedRingtoneId('pulse');
        await startRinging('kora');
        expect(scheduledFreqs(FakeAudioContext.instances[0])).toContain(349.23);
    });

    it('autoplay bloqué (resume refusé) : vibration seule, audible=false, coupe-circuit toujours armé', async () => {
        FakeAudioContext.defaultState = 'suspended';
        FakeAudioContext.resumeShouldFail = true;

        const audible = await startRinging();

        expect(audible).toBe(false);
        expect(vibrateMock).toHaveBeenCalledWith(VIBRATION_PATTERN);
        expect(isRinging()).toBe(true); // ça « sonne » encore : par vibration
        expect(FakeAudioContext.instances[0].oscillators.length).toBe(0);

        await vi.advanceTimersByTimeAsync(RINGING_TIMEOUT_MS);
        expect(isRinging()).toBe(false);
        expect(vibrateMock).toHaveBeenCalledWith(0);
    });

    it('contexte suspendu mais resume accepté : la sonnerie est audible', async () => {
        FakeAudioContext.defaultState = 'suspended';
        const audible = await startRinging();
        expect(audible).toBe(true);
        expect(FakeAudioContext.instances[0].resume).toHaveBeenCalled();
    });

    it('API WebAudio absente : vibration seule, et stopRinging nettoie tout', async () => {
        delete (window as any).AudioContext;
        const audible = await startRinging();
        expect(audible).toBe(false);
        expect(vibrateMock).toHaveBeenCalledWith(VIBRATION_PATTERN);
        expect(vi.getTimerCount()).toBe(2); // sécurité + vibration, aucune boucle audio

        stopRinging();
        expect(vi.getTimerCount()).toBe(0);
    });
});

/* ──────────────────────────────── Aperçu ───────────────────────────────── */

describe('previewRingtone', () => {
    it('joue UNE itération puis s’arrête seule (la promesse se résout)', async () => {
        const done = vi.fn();
        const preview = previewRingtone('pulse').then(done);
        await vi.advanceTimersByTimeAsync(0); // laisse l'itération se programmer

        const ctx = FakeAudioContext.instances[0];
        const scheduled = ctx.oscillators.length;
        expect(scheduled).toBeGreaterThan(0);
        expect(done).not.toHaveBeenCalled();

        await vi.advanceTimersByTimeAsync(2200); // loopDuration de Pulse
        await preview;

        expect(done).toHaveBeenCalledTimes(1);
        expect(ctx.oscillators.every((osc) => osc.stoppedNow)).toBe(true);
        expect(vi.getTimerCount()).toBe(0);

        // Surtout : PAS de réitération après la fin.
        await vi.advanceTimersByTimeAsync(10_000);
        expect(ctx.oscillators.length).toBe(scheduled);
    });

    it('l’aperçu ne vibre jamais', async () => {
        const preview = previewRingtone('signature');
        await vi.advanceTimersByTimeAsync(2600);
        await preview;
        expect(vibrateMock).not.toHaveBeenCalled();
    });

    it('stopPreview interrompt l’aperçu en cours et résout sa promesse', async () => {
        const done = vi.fn();
        const preview = previewRingtone('signature').then(done);
        await vi.advanceTimersByTimeAsync(100);
        expect(done).not.toHaveBeenCalled();

        stopPreview();
        await preview;

        expect(done).toHaveBeenCalledTimes(1);
        const ctx = FakeAudioContext.instances[0];
        expect(ctx.oscillators.every((osc) => osc.stoppedNow)).toBe(true);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('un id inconnu ne joue rien et se résout aussitôt', async () => {
        await previewRingtone('inexistante');
        expect(FakeAudioContext.instances.length).toBe(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('startRinging coupe l’aperçu en cours — jamais deux sons superposés', async () => {
        const done = vi.fn();
        const preview = previewRingtone('kora').then(done);
        await vi.advanceTimersByTimeAsync(50);
        const previewOscs = FakeAudioContext.instances[0].oscillators.slice();

        await startRinging();
        await preview;

        expect(done).toHaveBeenCalledTimes(1);
        expect(previewOscs.every((osc) => osc.stoppedNow)).toBe(true);
        expect(isRinging()).toBe(true);
    });
});

/* ──────────────────────── Retour d'appel (sortant) ─────────────────────── */

describe('startRingback / stopRingback', () => {
    it('tonalité distincte de la sonnerie entrante : 440+480 Hz simultanés, gain discret 0.12, sans vibration', async () => {
        const audible = await startRingback();
        expect(audible).toBe(true);
        expect(isRingbackActive()).toBe(true);

        const ctx = FakeAudioContext.instances[0];
        const freqs = scheduledFreqs(ctx);
        expect(freqs).toContain(440);
        expect(freqs).toContain(480); // 480 Hz n'existe dans AUCUNE sonnerie du catalogue
        expect(ctx.gains.some((g) => g.gain.value === RINGBACK_GAIN)).toBe(true);
        expect(vibrateMock).not.toHaveBeenCalled();

        // 1 s de son / 3 s de silence : une seule salve (2 oscillateurs) par période de 4 s.
        expect(ctx.oscillators.length).toBe(2);
        await vi.advanceTimersByTimeAsync(4000);
        expect(ctx.oscillators.length).toBe(4);
    });

    it('deux startRingback successifs ne superposent jamais deux boucles', async () => {
        await startRingback();
        const timersAfterFirst = vi.getTimerCount(); // sécurité + boucle
        const ctx = FakeAudioContext.instances[0];
        const firstBatch = ctx.oscillators.slice();

        await startRingback();
        expect(vi.getTimerCount()).toBe(timersAfterFirst);
        expect(firstBatch.every((osc) => osc.stoppedNow)).toBe(true);
    });

    it('stopRingback coupe tout immédiatement, et le coupe-circuit 45 s existe aussi', async () => {
        await startRingback();
        const ctx = FakeAudioContext.instances[0];
        stopRingback();
        expect(isRingbackActive()).toBe(false);
        expect(ctx.oscillators.every((osc) => osc.stoppedNow)).toBe(true);
        expect(vi.getTimerCount()).toBe(0);

        await startRingback();
        await vi.advanceTimersByTimeAsync(RINGING_TIMEOUT_MS);
        expect(isRingbackActive()).toBe(false);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('canaux indépendants : stopRingback ne coupe pas la sonnerie entrante', async () => {
        await startRinging();
        const ctx = FakeAudioContext.instances[0];
        const ringOscs = ctx.oscillators.slice();
        await startRingback();

        expect(isRinging()).toBe(true);
        expect(isRingbackActive()).toBe(true);

        stopRingback();
        expect(isRinging()).toBe(true);
        expect(ringOscs.some((osc) => osc.stoppedNow)).toBe(false);

        stopRinging();
        expect(isRinging()).toBe(false);
    });
});

/* ─────────────────────── Persistance du choix local ────────────────────── */

describe('getSelectedRingtoneId / setSelectedRingtoneId', () => {
    it('persiste le choix en localStorage sous lmav_ringtone_v1', () => {
        setSelectedRingtoneId('kora');
        expect(window.localStorage.getItem(RINGTONE_STORAGE_KEY)).toBe('kora');
        expect(getSelectedRingtoneId()).toBe('kora');
    });

    it('repli sur la Signature MokNet : rien de stocké, id inconnu écrit, ou valeur corrompue', () => {
        expect(getSelectedRingtoneId()).toBe(DEFAULT_RINGTONE_ID);

        setSelectedRingtoneId('sonnerie-disparue');
        expect(window.localStorage.getItem(RINGTONE_STORAGE_KEY)).toBe(DEFAULT_RINGTONE_ID);

        window.localStorage.setItem(RINGTONE_STORAGE_KEY, 'valeur-zombie');
        expect(getSelectedRingtoneId()).toBe(DEFAULT_RINGTONE_ID);
    });
});
