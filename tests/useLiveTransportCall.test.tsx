import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * Revue AU-6 — machine à états du hook useLiveTransport pour un APPEL, sur un
 * double de transport qui rejoue les événements RÉELS du SDK (Disconnected
 * émis avant le rejet de connect, mute ≠ dépublication, fin de piste) :
 *  - une caméra coupée par l'utilisateur n'est JAMAIS republiée par la relance
 *    automatique ni par « Réessayer le micro » (défaut majeur corrigé) ;
 *  - un échec de connexion ne consomme qu'UNE relance (3 relances réelles) ;
 *  - la fin de piste micro n'est traitée que pour les appels (le LIVE laisse
 *    le SDK relancer seul) ;
 *  - l'activation différée survit à une pré-connexion en échec.
 */

const rig = vi.hoisted(() => ({
    providers: [] as any[],
    connectImpl: null as null | ((events: any, provider: any) => Promise<void>),
}));

vi.mock('../services/live/liveKitTransportProvider', () => ({
    LiveKitTransportProvider: class {
        events: any = null;
        calls: Record<string, unknown[][]> = {};
        connected = false;
        constructor() { rig.providers.push(this); }
        private log(name: string, ...args: unknown[]) { (this.calls[name] ??= []).push(args); }
        async connect(_params: unknown, events: any) {
            this.events = events;
            if (rig.connectImpl) return rig.connectImpl(events, this);
            this.connected = true;
            events.onConnectionStateChanged?.('connected');
        }
        async disconnect() { this.connected = false; }
        async setCameraEnabled(v: boolean) {
            this.log('setCameraEnabled', v);
            if (v) this.events?.onLocalTrackPublished?.({ participantIdentity: 'me', kind: 'video', attach() {}, detach() {} });
        }
        async setMicrophoneEnabled(v: boolean) {
            this.log('setMicrophoneEnabled', v);
            // Comme le SDK : activer publie ; couper met en sourdine SANS dépublier.
            if (v) this.events?.onLocalTrackPublished?.({ participantIdentity: 'me', kind: 'audio', attach() {}, detach() {} });
        }
        async setCameraFacing() {}
        async startScreenShare() {}
        async stopScreenShare() {}
        async sendData() {}
        async setLocalMetadata() {}
        async startAudio() {}
        canPlaybackAudio() { return true; }
        getLocalParticipant() { return { identity: 'me', name: 'me', isLocal: true, isSpeaking: false, audioEnabled: true, videoEnabled: true, isScreenSharing: false }; }
        getRemoteParticipants() { return []; }
        getConnectionState() { return this.connected ? 'connected' : 'disconnected'; }
        getLocalAudioTrack() { return null; }
        async getAudioStats() { return { at: 0, local: null, remote: [], canPlaybackAudio: true }; }
    },
}));

vi.mock('../services/live/liveKitToken', () => ({
    fetchLiveKitToken: vi.fn(async () => ({ token: 't', serverUrl: 'ws://bench' })),
}));

const { useLiveTransport } = await import('../hooks/useLiveTransport');

const flush = async (ms = 20) => { await act(async () => { await vi.advanceTimersByTimeAsync(ms); }); };
const last = () => rig.providers[rig.providers.length - 1];
const calls = (p: any, name: string) => (p.calls[name] ?? []) as unknown[][];

beforeEach(() => {
    vi.useFakeTimers();
    rig.providers.length = 0;
    rig.connectImpl = null;
    vi.spyOn(console, 'warn').mockImplementation(() => {});
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('useLiveTransport — appel : caméra coupée jamais republiée à l’insu de l’utilisateur (revue AU-6)', () => {
    it('appel vidéo : caméra coupée, puis déconnexion inattendue → la relance republie le micro mais PAS la caméra', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-1', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: true, publishVideoOnConnect: true }));
        await flush();
        const p1 = last();
        expect(calls(p1, 'setMicrophoneEnabled')).toEqual([[true]]);
        expect(calls(p1, 'setCameraEnabled')).toEqual([[true]]);

        await act(async () => { await result.current.setCameraEnabled(false); });
        expect(calls(p1, 'setCameraEnabled')).toEqual([[true], [false]]);

        act(() => { p1.events.onDisconnected('3'); });
        await flush(1000); // relance 1 : 700 ms
        expect(rig.providers.length).toBe(2);
        const p2 = last();
        expect(calls(p2, 'setMicrophoneEnabled')).toEqual([[true]]);
        expect(calls(p2, 'setCameraEnabled')).toEqual([]); // jamais [[true]] — c'était le défaut
    });

    it('« Réessayer le micro » avec caméra coupée (camera:false explicite) ne rallume pas la caméra ; caméra coupée + publishMicrophone sans option non plus', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-2', participantName: 'B', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: false, publishVideoOnConnect: false }));
        await flush();
        const p = last();
        await act(async () => { await result.current.publishMicrophone({ camera: true }); });
        expect(calls(p, 'setCameraEnabled')).toEqual([[true]]);
        await act(async () => { await result.current.setCameraEnabled(false); });
        await act(async () => { await result.current.publishMicrophone({ camera: false }); });
        await act(async () => { await result.current.publishMicrophone(); });
        expect(calls(p, 'setCameraEnabled')).toEqual([[true], [false]]);
        expect(calls(p, 'setMicrophoneEnabled').length).toBeGreaterThanOrEqual(3);
        // Réactivation EXPLICITE : la caméra repart.
        await act(async () => { await result.current.setCameraEnabled(true); });
        expect(calls(p, 'setCameraEnabled').at(-1)).toEqual([true]);
    });

    it('LIVE (profil live) : le comportement historique est conservé — la caméra revient après une nouvelle tentative', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'live-1', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live' }));
        await flush();
        await act(async () => { await result.current.setCameraEnabled(false); });
        act(() => { result.current.retry(); });
        await flush(50);
        expect(rig.providers.length).toBe(2);
        expect(calls(last(), 'setCameraEnabled')).toEqual([[true]]);
    });
});

describe('useLiveTransport — appel : relance automatique de la ligne (revue AU-6)', () => {
    it('un échec de connexion (Disconnected émis PUIS rejet, comme le SDK) ne consomme qu’une relance : 3 relances réelles', async () => {
        rig.connectImpl = async (events) => { events.onDisconnected('7'); throw new Error('could not establish pc connection'); };
        renderHook(() => useLiveTransport({ roomName: 'call-3', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: true }));
        await flush();
        for (let i = 0; i < 8; i++) await flush(5000);
        expect(rig.providers.length).toBe(4); // 1 tentative + 3 relances (avant : 3, l'échec comptait double)
        const logs = (console.warn as any).mock.calls.map((c: unknown[]) => String(c[0])).filter((s: string) => s.includes('nouvelle tentative'));
        expect(logs).toEqual([
            expect.stringContaining('nouvelle tentative 1/3'),
            expect.stringContaining('nouvelle tentative 2/3'),
            expect.stringContaining('nouvelle tentative 3/3'),
        ]);
    });

    it('LIVE : aucune relance automatique (bouton « Réessayer » explicite)', async () => {
        rig.connectImpl = async (events) => { events.onDisconnected('7'); throw new Error('boom'); };
        renderHook(() => useLiveTransport({ roomName: 'live-2', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live' }));
        await flush();
        for (let i = 0; i < 4; i++) await flush(5000);
        expect(rig.providers.length).toBe(1);
    });

    it('appelé : pré-connexion en échec, puis décroché → publishMicrophone relance jeton + connexion et publie le micro', async () => {
        let fail = true;
        rig.connectImpl = async (events, provider) => {
            if (fail) { fail = false; events.onDisconnected('7'); throw new Error('pré-connexion en échec'); }
            provider.connected = true; events.onConnectionStateChanged?.('connected');
        };
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-4', participantName: 'B', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: false, publishVideoOnConnect: false }));
        await flush();
        expect(result.current.error).toContain('pré-connexion');
        // Rien à publier pendant la sonnerie → aucune relance automatique ; c'est le décroché qui relance.
        await flush(3000);
        expect(rig.providers.length).toBe(1);
        await act(async () => { await result.current.publishMicrophone({ camera: false }); });
        await flush(50);
        expect(rig.providers.length).toBe(2);
        expect(calls(last(), 'setMicrophoneEnabled')).toEqual([[true]]);
        expect(result.current.localAudioPublished).toBe(true);
    });
});

describe('useLiveTransport — fin de piste micro (revue AU-6)', () => {
    it('appel : fin de piste → republication (sourdine puis réactivation), bornée', async () => {
        renderHook(() => useLiveTransport({ roomName: 'call-5', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: true }));
        await flush();
        const p = last();
        act(() => { p.events.onLocalTrackEnded('audio'); });
        await flush();
        expect(calls(p, 'setMicrophoneEnabled')).toEqual([[true], [false], [true]]);
        act(() => { p.events.onLocalTrackEnded('audio'); });
        await flush();
        expect(calls(p, 'setMicrophoneEnabled')).toEqual([[true], [false], [true], [false], [true]]);
        act(() => { p.events.onLocalTrackEnded('audio'); }); // 3e : borne atteinte → message, pas de boucle
        await flush();
        expect(calls(p, 'setMicrophoneEnabled').length).toBe(5);
    });

    it('LIVE : fin de piste ignorée par le hook (le SDK relance seul, sans « micro coupé » diffusé aux spectateurs)', async () => {
        renderHook(() => useLiveTransport({ roomName: 'live-3', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live' }));
        await flush();
        const p = last();
        act(() => { p.events.onLocalTrackEnded('audio'); });
        await flush();
        expect(calls(p, 'setMicrophoneEnabled')).toEqual([[true]]);
    });
});
