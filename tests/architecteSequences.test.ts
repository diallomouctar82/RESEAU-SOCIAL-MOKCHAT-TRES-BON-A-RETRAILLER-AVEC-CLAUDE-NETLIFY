import { createHash } from 'node:crypto';
import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
    ARCHITECTE_PRESENTATION,
    ARCHITECTE_SEQUENCES,
    SEQUENCE_ENDED_HOLD_MS,
    createSequencePlayer,
    cueAt,
    findArchitecteSequence,
    formatSequenceDuration,
    hasSeenPresentation,
    nextSequenceStatus,
    rememberPresentationSeen,
    shouldOfferPresentation,
    toWebVtt,
    type SequencePlayerState,
    type SequenceVideoLike,
} from '../services/architecte/sequences';

/**
 * SÉQUENCES VIDÉO VALIDÉES — le modèle de la Direction (05/09/2026) protégé
 * par des tests : les fichiers livrés sont EXACTEMENT ceux validés
 * (empreintes), le lecteur rend la main au rig dans tous les cas d'échec, et
 * rien ne démarre sans un geste.
 */

const publicDir = path.resolve(process.cwd(), 'public');

describe('Registre des séquences validées', () => {
    it('livre la présentation validée avec ses deux sources et ses légendes', () => {
        expect(ARCHITECTE_SEQUENCES).toHaveLength(1);
        expect(findArchitecteSequence('presentation')).toBe(ARCHITECTE_PRESENTATION);
        expect(findArchitecteSequence('inconnue')).toBeNull();
        expect(ARCHITECTE_PRESENTATION.sources.map((s) => s.type)).toEqual(['video/mp4', 'video/webm']);
        expect(ARCHITECTE_PRESENTATION.provider).toBe('heygen');
        expect(ARCHITECTE_PRESENTATION.model.settings.expressiveness).toBe('medium');
        expect(ARCHITECTE_PRESENTATION.validatedBy).toBe('Direction Vision Smart');
    });

    it('les fichiers livrés sont EXACTEMENT ceux validés (taille et empreinte SHA-256)', () => {
        for (const source of ARCHITECTE_PRESENTATION.sources) {
            const file = path.join(publicDir, source.url);
            expect(statSync(file).size).toBe(source.sizeBytes);
            expect(createHash('sha256').update(readFileSync(file)).digest('hex')).toBe(source.sha256);
        }
        expect(statSync(path.join(publicDir, ARCHITECTE_PRESENTATION.posterUrl)).size).toBeGreaterThan(1000);
    });

    it('le fichier de légendes livré est généré depuis les mêmes repères que les sous-titres', () => {
        const vtt = readFileSync(path.join(publicDir, ARCHITECTE_PRESENTATION.captionsUrl), 'utf8');
        expect(vtt).toBe(toWebVtt(ARCHITECTE_PRESENTATION.cues));
        expect(vtt.startsWith('WEBVTT')).toBe(true);
        expect(vtt).toContain('00:00:06.450 --> 00:00:08.190');
    });

    it('les légendes couvrent la phrase entière, dans l’ordre, sans dépasser la durée', () => {
        const cues = ARCHITECTE_PRESENTATION.cues;
        expect(cues.map((c) => c.text).join(' ')).toBe(ARCHITECTE_PRESENTATION.text);
        cues.forEach((c, i) => {
            expect(c.endMs).toBeGreaterThan(c.startMs);
            if (i > 0) expect(c.startMs).toBeGreaterThanOrEqual(cues[i - 1].endMs);
        });
        expect(cues[cues.length - 1].endMs).toBeLessThanOrEqual(ARCHITECTE_PRESENTATION.durationMs);
        expect(cueAt(ARCHITECTE_PRESENTATION, 1000)?.text).toMatch(/^Bonjour/);
        expect(cueAt(ARCHITECTE_PRESENTATION, 1950)).toBeNull();
        expect(cueAt(ARCHITECTE_PRESENTATION, 7000)?.text).toMatch(/professionnelle/);
    });

    it('affiche une durée lisible en français', () => {
        expect(formatSequenceDuration(8190)).toBe('8,2 s');
        expect(formatSequenceDuration(-5)).toBe('0,0 s');
    });
});

describe('Machine d’états de lecture', () => {
    it('suit le cycle demande → lecture → fin, et tout échec mène à « failed »', () => {
        expect(nextSequenceStatus('idle', 'request')).toBe('loading');
        expect(nextSequenceStatus('loading', 'playing')).toBe('playing');
        expect(nextSequenceStatus('playing', 'ended')).toBe('ended');
        expect(nextSequenceStatus('ended', 'stop')).toBe('idle');
        expect(nextSequenceStatus('loading', 'error')).toBe('failed');
        expect(nextSequenceStatus('idle', 'playing')).toBe('idle');
        expect(nextSequenceStatus('failed', 'ended')).toBe('failed');
    });
});

class FakeVideo implements SequenceVideoLike {
    currentTime = 3;
    playCalls = 0;
    pauseCalls = 0;
    playResult: Promise<void> | void = Promise.resolve();
    private listeners = new Map<string, Set<() => void>>();
    play() {
        this.playCalls += 1;
        return this.playResult;
    }
    pause() {
        this.pauseCalls += 1;
    }
    addEventListener(type: string, listener: () => void) {
        if (!this.listeners.has(type)) this.listeners.set(type, new Set());
        this.listeners.get(type)!.add(listener);
    }
    removeEventListener(type: string, listener: () => void) {
        this.listeners.get(type)?.delete(listener);
    }
    fire(type: string) {
        this.listeners.get(type)?.forEach((l) => l());
    }
    listenerCount() {
        return [...this.listeners.values()].reduce((n, set) => n + set.size, 0);
    }
}

describe('Lecteur de séquences', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('joue depuis le début, annonce chaque état, puis rend la main au rig après la fin', () => {
        const player = createSequencePlayer();
        const video = new FakeVideo();
        const states: SequencePlayerState[] = [];
        player.subscribe((s) => states.push(s));
        player.attach(video, 'presentation', 'demo');

        expect(player.play('presentation')).toBe(true);
        expect(video.currentTime).toBe(0);
        expect(video.playCalls).toBe(1);
        expect(player.getState()).toMatchObject({ key: 'presentation', slot: 'demo', status: 'loading' });

        video.fire('playing');
        expect(player.getState().status).toBe('playing');
        video.fire('ended');
        expect(player.getState().status).toBe('ended');
        vi.advanceTimersByTime(SEQUENCE_ENDED_HOLD_MS + 1);
        expect(player.getState()).toMatchObject({ key: null, slot: null, status: 'idle' });
        expect(states.map((s) => s.status)).toEqual(['loading', 'playing', 'ended', 'idle']);
    });

    it('sans vidéo attachée, refuse proprement : « failed » avec la raison, jamais d’exception', () => {
        const player = createSequencePlayer();
        expect(player.play('presentation')).toBe(false);
        expect(player.getState()).toMatchObject({ key: 'presentation', status: 'failed' });
        expect(player.getState().error).toMatch(/Aucune vidéo/);
    });

    it('un refus du navigateur (promesse rejetée) ou une erreur média mène à « failed » avec un message', async () => {
        const player = createSequencePlayer();
        const video = new FakeVideo();
        video.playResult = Promise.reject(new Error('NotAllowedError'));
        player.attach(video, 'presentation', 'demo');
        player.play('presentation');
        await Promise.resolve();
        await Promise.resolve();
        expect(player.getState().status).toBe('failed');
        expect(player.getState().error).toMatch(/refusée/);

        const player2 = createSequencePlayer();
        const video2 = new FakeVideo();
        player2.attach(video2, 'presentation', 'demo');
        player2.play('presentation');
        video2.fire('error');
        expect(player2.getState().status).toBe('failed');
    });

    it('choisit le cadre demandé, sinon le dernier attaché ; une pause extérieure rend la main', () => {
        const player = createSequencePlayer();
        const petit = new FakeVideo();
        const grand = new FakeVideo();
        player.attach(petit, 'presentation', 'panel');
        player.attach(grand, 'presentation', 'presentation');

        expect(player.play('presentation', 'panel')).toBe(true);
        expect(petit.playCalls).toBe(1);
        expect(grand.playCalls).toBe(0);
        expect(player.getState().slot).toBe('panel');

        expect(player.play('presentation')).toBe(true);
        expect(grand.playCalls).toBe(1);
        expect(petit.pauseCalls).toBeGreaterThanOrEqual(1);
        expect(player.getState().slot).toBe('presentation');

        grand.fire('playing');
        grand.fire('pause');
        expect(player.getState().status).toBe('idle');
    });

    it('détacher un cadre retire ses écouteurs et arrête sa lecture en cours', () => {
        const player = createSequencePlayer();
        const video = new FakeVideo();
        const attachment = player.attach(video, 'presentation', 'demo');
        player.play('presentation');
        video.fire('playing');
        attachment.detach();
        expect(video.listenerCount()).toBe(0);
        expect(player.getState().status).toBe('idle');
        expect(player.play('presentation')).toBe(false);
    });

    it('stop() coupe la vidéo et revient au repos, sans rien casser si rien ne joue', () => {
        const player = createSequencePlayer();
        const video = new FakeVideo();
        player.attach(video, 'presentation', 'demo');
        player.stop();
        expect(player.getState().status).toBe('idle');
        player.play('presentation');
        player.stop();
        expect(video.pauseCalls).toBeGreaterThanOrEqual(1);
        expect(player.getState().status).toBe('idle');
    });
});

describe('Proposer la présentation — jamais la lancer seule', () => {
    it('propose une seule fois par appareil, seulement si le réglage est actif', () => {
        const memoire = new Map<string, string>();
        const storage = { getItem: (k: string) => memoire.get(k) ?? null, setItem: (k: string, v: string) => { memoire.set(k, v); } };
        expect(hasSeenPresentation(storage)).toBe(false);
        expect(shouldOfferPresentation({ enabled: true, seen: hasSeenPresentation(storage), sequence: ARCHITECTE_PRESENTATION })).toBe(true);
        rememberPresentationSeen(storage);
        expect(hasSeenPresentation(storage)).toBe(true);
        expect(shouldOfferPresentation({ enabled: true, seen: true, sequence: ARCHITECTE_PRESENTATION })).toBe(false);
        expect(shouldOfferPresentation({ enabled: false, seen: false, sequence: ARCHITECTE_PRESENTATION })).toBe(false);
        expect(shouldOfferPresentation({ enabled: true, seen: false, sequence: null })).toBe(false);
    });

    it('un stockage qui lève une exception ne casse rien', () => {
        const casse = { getItem: () => { throw new Error('bloqué'); }, setItem: () => { throw new Error('bloqué'); } };
        expect(hasSeenPresentation(casse)).toBe(false);
        expect(() => rememberPresentationSeen(casse)).not.toThrow();
    });
});
