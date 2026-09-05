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
    formatDateFr,
    formatExpressiveness,
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

    it('les vidéos DÉTOURÉES livrées (couleurs + matte empilés) sont exactement celles enregistrées', () => {
        expect(ARCHITECTE_PRESENTATION.cutoutSources.map((s) => s.type)).toEqual(['video/mp4', 'video/webm']);
        for (const source of ARCHITECTE_PRESENTATION.cutoutSources) {
            const file = path.join(publicDir, source.url);
            const bytes = readFileSync(file);
            expect(bytes.length).toBe(source.sizeBytes);
            expect(createHash('sha256').update(bytes).digest('hex')).toBe(source.sha256);
        }
        // Le masque de silhouette du portrait est un PNG avec alpha (couche rig de la sculpture).
        const mask = readFileSync(path.join(publicDir, 'architecte', 'architecte-silhouette.png'));
        expect(mask.subarray(1, 4).toString('ascii')).toBe('PNG');
        expect(mask[25]).toBe(6); // type de couleur 6 = RGBA
    });

    it('le calage de la vidéo sur le portrait est une petite correction, jamais un recadrage', () => {
        const a = ARCHITECTE_PRESENTATION.alignment;
        expect(a.scale).toBeGreaterThan(0.9);
        expect(a.scale).toBeLessThan(1.1);
        expect(Math.abs(a.dxPercent)).toBeLessThan(3);
        expect(Math.abs(a.dyPercent)).toBeLessThan(3);
        expect(a.originXPercent).toBeGreaterThan(40);
        expect(a.originXPercent).toBeLessThan(60);
    });

    it('le fichier de légendes livré est généré depuis les mêmes repères que les sous-titres', () => {
        const vtt = readFileSync(path.join(publicDir, ARCHITECTE_PRESENTATION.captionsUrl), 'utf8');
        expect(vtt).toBe(toWebVtt(ARCHITECTE_PRESENTATION.cues));
        expect(vtt.startsWith('WEBVTT')).toBe(true);
        expect(vtt).toContain('00:00:06.380 --> 00:00:09.060');
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
        expect(cueAt(ARCHITECTE_PRESENTATION, 2400)).toBeNull();
        expect(cueAt(ARCHITECTE_PRESENTATION, 7000)?.text).toMatch(/professionnelle/);
    });

    it('dit la date de validation et l’expressivité en français', () => {
        expect(formatDateFr('2026-09-05')).toBe('5 septembre 2026');
        expect(formatDateFr('2026-01-01')).toBe('1er janvier 2026');
        expect(formatDateFr('hier')).toBe('hier');
        expect(formatExpressiveness('medium')).toBe('moyenne');
        expect(formatExpressiveness('low')).toBe('faible');
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
    ended = false;
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

    it('la fin naturelle telle que les navigateurs la signalent (pause PUIS ended) passe bien par « ended »', () => {
        const player = createSequencePlayer();
        const video = new FakeVideo();
        const states: string[] = [];
        player.subscribe((s) => states.push(s.status));
        player.attach(video, 'presentation', 'sculpture');
        player.play('presentation');
        video.fire('playing');
        // Chromium, WebKit et Gecko : `pause` est émis avant `ended`, avec `video.ended` déjà vrai.
        video.ended = true;
        video.fire('pause');
        expect(player.getState().status).toBe('playing');
        video.fire('ended');
        expect(player.getState().status).toBe('ended');
        vi.advanceTimersByTime(SEQUENCE_ENDED_HOLD_MS + 1);
        expect(states).toEqual(['loading', 'playing', 'ended', 'idle']);
    });

    it('un second play() sur le même cadre pendant le chargement (double appui) ne bascule pas en échec', async () => {
        const player = createSequencePlayer();
        const video = new FakeVideo();
        let rejectFirst: (reason: unknown) => void = () => {};
        video.playResult = new Promise<void>((_, reject) => { rejectFirst = reject; });
        player.attach(video, 'presentation', 'sculpture');
        expect(player.play('presentation')).toBe(true);
        video.playResult = Promise.resolve();
        expect(player.play('presentation')).toBe(true);
        expect(video.pauseCalls).toBe(1);
        // Le navigateur rejette la PREMIÈRE promesse parce que notre pause() l'a interrompue.
        rejectFirst(Object.assign(new Error('The play() request was interrupted'), { name: 'AbortError' }));
        await Promise.resolve();
        await Promise.resolve();
        expect(player.getState().status).toBe('loading');
        video.fire('playing');
        expect(player.getState().status).toBe('playing');
        // Un AbortError isolé (sans second play) n'est pas non plus un refus.
        const player2 = createSequencePlayer();
        const video2 = new FakeVideo();
        video2.playResult = Promise.reject(Object.assign(new Error('interrupted'), { name: 'AbortError' }));
        player2.attach(video2, 'presentation', 'sculpture');
        player2.play('presentation');
        await Promise.resolve();
        await Promise.resolve();
        expect(player2.getState().status).toBe('loading');
        // Mais un refus réel d'une demande DÉPASSÉE est ignoré lui aussi : seule la dernière compte.
        const player3 = createSequencePlayer();
        const video3 = new FakeVideo();
        let rejectOld: (reason: unknown) => void = () => {};
        video3.playResult = new Promise<void>((_, reject) => { rejectOld = reject; });
        player3.attach(video3, 'presentation', 'sculpture');
        player3.play('presentation');
        video3.playResult = Promise.resolve();
        player3.play('presentation');
        rejectOld(Object.assign(new Error('not allowed'), { name: 'NotAllowedError' }));
        await Promise.resolve();
        await Promise.resolve();
        expect(player3.getState().status).toBe('loading');
    });

    it('stop(slot) n’arrête que le cadre nommé', () => {
        const player = createSequencePlayer();
        const sculpture = new FakeVideo();
        player.attach(sculpture, 'presentation', 'sculpture');
        player.play('presentation', 'sculpture');
        sculpture.fire('playing');
        player.stop('presentation');
        expect(player.getState().status).toBe('playing');
        player.stop('sculpture');
        expect(player.getState().status).toBe('idle');
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
