import React from 'react';
import { act, cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * SAT-3 — l'écran quand le direct est complet.
 *
 * Deux niveaux vérifiés ici, sur le VRAI hook et le VRAI composant :
 *
 *  1. Le hook de transport expose le refus du serveur comme un état à part
 *     (`refusal`), distinct du message d'erreur — sans quoi « complet » et
 *     « la ligne a lâché » restent indiscernables et l'écran ne peut rien dire
 *     de vrai.
 *  2. L'écran rend les chiffres RÉELS du serveur, et rien quand ils manquent.
 *
 * Ce que ces cas remplacent : un « Connexion au direct… » qui pulsait sans fin
 * alors que la porte serveur (SAT-2) avait déjà refusé l'entrée.
 */

const rig = vi.hoisted(() => ({
    providers: [] as any[],
    token: null as null | (() => Promise<{ token: string; serverUrl: string }>),
}));

vi.mock('../services/live/liveKitTransportProvider', () => ({
    LiveKitTransportProvider: class {
        events: any = null;
        connected = false;
        constructor() { rig.providers.push(this); }
        async connect(_params: unknown, events: any) {
            this.events = events;
            this.connected = true;
            events.onConnectionStateChanged?.('connected');
        }
        async disconnect() { this.connected = false; }
        async setCameraEnabled() {}
        async setMicrophoneEnabled() {}
        async setCameraFacing() {}
        async startScreenShare() {}
        async stopScreenShare() {}
        async sendData() {}
        async publishAuxiliaryAudio() {}
        async unpublishAuxiliaryAudio() {}
        async setLocalMetadata() {}
        async startAudio() {}
        canPlaybackAudio() { return true; }
        getLocalParticipant() { return null; }
        getRemoteParticipants() { return []; }
        getLocalAudioTrack() { return null; }
        async getAudioStats() { return { at: 0, local: null, remote: [], canPlaybackAudio: true }; }
        getConnectionState() { return this.connected ? 'connected' : 'disconnected'; }
        async getTransportDiagnostics() { return { at: 0, connectionState: this.getConnectionState(), publisher: null, subscriber: null, localTracks: [], remoteTracks: [] }; }
    },
}));

vi.mock('../services/calls/callDiagnostics', () => ({ recordCallEvent: vi.fn() }));

vi.mock('../services/live/liveKitToken', () => ({
    fetchLiveKitToken: vi.fn(async () => {
        if (rig.token) return rig.token();
        return { token: 't', serverUrl: 'ws://banc' };
    }),
}));

const { LiveAccessError } = await import('../services/live/liveAccessError');
const { useLiveTransport } = await import('../hooks/useLiveTransport');
const { LiveFullNotice } = await import('../components/live/LiveFullNotice');

const ROOM = '3f8a1c2e-9b41-4d7a-8e55-0a1b2c3d4e5f';
const COMPLET = { code: 'live_full', message: 'Ce direct est complet.', occupied: 12, capacity: 12 };

const flush = async (ms = 20) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };

beforeEach(() => {
    vi.useFakeTimers();
    rig.providers.length = 0;
    rig.token = null;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

describe('SAT-3 · le hook expose le refus, distinct de la panne', () => {
    it('un direct plein remonte le code ET les chiffres jusqu’à l’UI', async () => {
        rig.token = async () => { throw new LiveAccessError(COMPLET, 'repli'); };
        const { result } = renderHook(() => useLiveTransport({ roomName: ROOM, participantName: 'Awa', canPublish: false, enabled: true }));
        await flush();
        expect(result.current.refusal).toEqual(COMPLET);
        expect(result.current.error).toBe('Ce direct est complet.');
        // Aucune connexion n'a été tentée : le jeton n'a jamais été délivré.
        expect(rig.providers[0].connected).toBe(false);
    });

    it('une panne ordinaire laisse le refus à null — jamais un faux « complet »', async () => {
        rig.token = async () => { throw new Error('Ligne coupée'); };
        const { result } = renderHook(() => useLiveTransport({ roomName: ROOM, participantName: 'Awa', canPublish: false, enabled: true }));
        await flush();
        expect(result.current.error).toBe('Ligne coupée');
        expect(result.current.refusal).toBeNull();
    });

    it('« Réessayer » efface le refus et rejoue une tentative complète — une place peut s’être libérée', async () => {
        rig.token = async () => { throw new LiveAccessError(COMPLET, 'repli'); };
        const { result } = renderHook(() => useLiveTransport({ roomName: ROOM, participantName: 'Awa', canPublish: false, enabled: true }));
        await flush();
        expect(result.current.refusal).toEqual(COMPLET);

        rig.token = null; // quelqu'un est parti : la porte rouvre
        act(() => { result.current.retry(); });
        await flush();
        expect(result.current.refusal).toBeNull();
        expect(result.current.error).toBeNull();
        expect(result.current.connectionState).toBe('connected');
    });

    it('un direct qui se remplit APRÈS coup repasse en refus (pas de refus figé)', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: ROOM, participantName: 'Awa', canPublish: false, enabled: true }));
        await flush();
        expect(result.current.refusal).toBeNull();

        rig.token = async () => { throw new LiveAccessError(COMPLET, 'repli'); };
        act(() => { result.current.retry(); });
        await flush();
        expect(result.current.refusal).toEqual(COMPLET);
    });
});

describe("SAT-3 · l'écran dit la vérité, avec les chiffres du serveur", () => {
    it('affiche les chiffres réels et les deux issues', () => {
        const onRetry = vi.fn();
        const onLeave = vi.fn();
        render(<LiveFullNotice refusal={COMPLET} onRetry={onRetry} onLeave={onLeave} />);

        expect(screen.getByText('Ce direct est complet')).toBeTruthy();
        const chiffres = screen.getByTestId('live-full-counts').textContent ?? '';
        expect(chiffres).toContain('12');
        expect(chiffres).toContain('places');
        // « à l'instant » : le compteur est une photo, pas un direct.
        expect(chiffres).toContain("à l'instant");

        fireEvent.click(screen.getByTestId('live-full-retry'));
        expect(onRetry).toHaveBeenCalledTimes(1);
        fireEvent.click(screen.getByTestId('live-full-leave'));
        expect(onLeave).toHaveBeenCalledTimes(1);
    });

    it("n'invente AUCUN chiffre quand le serveur ne les a pas donnés", () => {
        render(<LiveFullNotice refusal={{ code: 'live_full', message: 'Ce direct est complet.' }} onRetry={() => {}} />);
        expect(screen.queryByTestId('live-full-counts')).toBeNull();
        expect(screen.getByTestId('live-full-no-counts').textContent).toContain('Toutes les places sont prises');
        // L'issue reste offerte même sans chiffre : jamais une impasse.
        expect(screen.getByTestId('live-full-retry')).toBeTruthy();
    });

    it('accorde le pluriel sur les vrais nombres (une place, une personne)', () => {
        render(<LiveFullNotice refusal={{ code: 'live_full', message: '', occupied: 1, capacity: 1 }} onRetry={() => {}} />);
        const chiffres = screen.getByTestId('live-full-counts').textContent ?? '';
        expect(chiffres).toContain('personne y est');
        expect(chiffres).toContain('1 place');
        expect(chiffres).not.toContain('places');
    });

    it('« Quitter » n’apparaît que si une sortie est réellement câblée', () => {
        render(<LiveFullNotice refusal={COMPLET} onRetry={() => {}} />);
        expect(screen.queryByTestId('live-full-leave')).toBeNull();
    });

    it('est annoncé aux lecteurs d’écran et les commandes tiennent le doigt (44 px)', () => {
        render(<LiveFullNotice refusal={COMPLET} onRetry={() => {}} onLeave={() => {}} />);
        expect(screen.getByTestId('live-full-notice').getAttribute('role')).toBe('alert');
        for (const id of ['live-full-retry', 'live-full-leave']) {
            expect(screen.getByTestId(id).className).toContain('min-h-[44px]');
        }
    });
});
