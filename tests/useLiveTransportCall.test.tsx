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
        /** AU-7 : rejoue la séquence RÉELLE du SDK — Reconnecting (pcManager absent : publier lève) puis Connected. */
        startReconnecting() { this.reconnecting = true; this.events?.onConnectionStateChanged?.('reconnecting'); }
        finishReconnecting() { this.reconnecting = false; this.connected = true; this.events?.onConnectionStateChanged?.('connected'); }
        async setCameraEnabled(v: boolean) {
            this.log('setCameraEnabled', v);
            if (v) this.events?.onLocalTrackPublished?.({ participantIdentity: 'me', kind: 'video', attach() {}, detach() {} });
        }
        async setMicrophoneEnabled(v: boolean) {
            this.log('setMicrophoneEnabled', v);
            if (this.reconnecting) throw new Error('UnexpectedConnectionState: pcManager is not ready');
            // Comme le SDK : activer publie ; couper met en sourdine SANS dépublier.
            if (v) this.events?.onLocalTrackPublished?.({ participantIdentity: 'me', kind: 'audio', attach() {}, detach() {} });
        }
        async setCameraFacing() {}
        async startScreenShare() {}
        async stopScreenShare() {}
        async sendData() {}
        // Mission VT : piste auxiliaire (voix de l'interprète) — journalisée, jamais de Web Audio ici.
        async publishAuxiliaryAudio(track: unknown, name: string) { this.log('publishAuxiliaryAudio', track, name); }
        async unpublishAuxiliaryAudio(name: string) { this.log('unpublishAuxiliaryAudio', name); }
        async setLocalMetadata() {}
        async startAudio() {}
        canPlaybackAudio() { return true; }
        getLocalParticipant() { return { identity: 'me', name: 'me', isLocal: true, isSpeaking: false, audioEnabled: true, videoEnabled: true, isScreenSharing: false }; }
        getRemoteParticipants() { return []; }
        getLocalAudioTrack() { return null; }
        async getAudioStats() { return { at: 0, local: null, remote: [], canPlaybackAudio: true }; }
        // AU-7 : état « reconnecting » simulable (le SDK rétablit la ligne seul).
        reconnecting = false;
        getConnectionState() { return this.reconnecting ? 'reconnecting' : this.connected ? 'connected' : 'disconnected'; }
        async getTransportDiagnostics() { return { at: 0, connectionState: this.getConnectionState(), publisher: null, subscriber: null, localTracks: [], remoteTracks: [] }; }
    },
}));

vi.mock('../services/calls/callDiagnostics', () => ({ recordCallEvent: vi.fn() }));

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

    it('mission LT : ÉVINCÉ par une identité dupliquée (raison 2) → AUCUNE relance (elle évincerait l’autre session à son tour), erreur explicite', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-dup', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: true }));
        await flush();
        const p = last();
        act(() => { p.events.onDisconnected('2'); });
        for (let i = 0; i < 4; i++) await flush(5000);
        expect(rig.providers.length).toBe(1);
        expect(result.current.connectionState).toBe('disconnected');
        expect(result.current.error).toMatch(/identité dupliquée/);
        // Une autre raison (délai de connexion, 14) relance bien, comme avant.
        act(() => { p.events.onDisconnected('14'); });
        await flush(1000);
        expect(rig.providers.length).toBe(2);
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

describe('useLiveTransport — AU-7 : décroché pendant que le SDK rétablit la ligne (iPhone réel)', () => {
    it('appelé : ligne en « reconnecting » au décroché → aucune publication dans le vide, aucune relance par-dessus, micro publié dès le retour à « connected »', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-7', participantName: 'B', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: false, publishVideoOnConnect: false }));
        await flush();
        const p = last();
        act(() => { p.startReconnecting(); });
        expect(result.current.connectionState).toBe('reconnecting');
        // Avant : setMicrophoneEnabled(true) était appelé ici et levait « pcManager is not ready ».
        await act(async () => { await result.current.publishMicrophone({ camera: false }); });
        expect(calls(p, 'setMicrophoneEnabled')).toEqual([]);
        expect(result.current.mediaError).toBeNull();
        await flush(5000);
        expect(rig.providers.length).toBe(1); // pas de nouvelle connexion lancée par-dessus celle du SDK
        act(() => { p.finishReconnecting(); });
        await flush();
        expect(calls(p, 'setMicrophoneEnabled')).toEqual([[true]]);
        expect(result.current.localAudioPublished).toBe(true);
        expect(result.current.connectionState).toBe('connected');
    });

    it('appel établi : « reconnecting » sans demande en attente → le retour à « connected » ne republie rien de lui-même', async () => {
        renderHook(() => useLiveTransport({ roomName: 'call-8', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: true }));
        await flush();
        const p = last();
        expect(calls(p, 'setMicrophoneEnabled')).toEqual([[true]]);
        act(() => { p.startReconnecting(); });
        act(() => { p.finishReconnecting(); });
        await flush();
        expect(calls(p, 'setMicrophoneEnabled')).toEqual([[true]]); // le SDK republie ses pistes seul
    });

    it('si le SDK abandonne (Disconnected) alors qu’une demande attendait, la relance automatique publie le micro', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-9', participantName: 'B', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: false, publishVideoOnConnect: false }));
        await flush();
        const p1 = last();
        act(() => { p1.startReconnecting(); });
        await act(async () => { await result.current.publishMicrophone({ camera: false }); });
        act(() => { p1.events.onDisconnected('14'); });
        await flush(1000);
        expect(rig.providers.length).toBe(2);
        expect(calls(last(), 'setMicrophoneEnabled')).toEqual([[true]]);
    });
});

describe('useLiveTransport — piste « interprète » dans l’appel (Mission VT)', () => {
    const handle = (name: string | undefined) => ({ participantIdentity: 'peer::d1', kind: 'audio', name, attach() {}, detach() {} });

    it('une piste audio nommée « interpreter » est rangée à part (interpreterAudioTrack), jamais prise pour le micro ; sa dépublication ne touche pas le micro', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-3', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call' }));
        await flush();
        const p = last();
        act(() => { p.events.onTrackSubscribed(handle(undefined)); });
        act(() => { p.events.onTrackSubscribed(handle('interpreter')); });
        expect(result.current.remoteParticipants).toHaveLength(1);
        expect(result.current.remoteParticipants[0].audioTrack?.name).toBeUndefined();
        expect(result.current.remoteParticipants[0].interpreterAudioTrack?.name).toBe('interpreter');
        act(() => { p.events.onTrackUnsubscribed('peer::d1', 'audio', 'interpreter'); });
        expect(result.current.remoteParticipants[0].interpreterAudioTrack).toBeUndefined();
        expect(result.current.remoteParticipants[0].audioTrack).toBeTruthy();
        // Piste d'un agent, nommée pour un compte précis : même rangement.
        act(() => { p.events.onTrackSubscribed(handle('interpreter:u1')); });
        expect(result.current.remoteParticipants[0].interpreterAudioTrack?.name).toBe('interpreter:u1');
    });

    it('publishInterpreterAudio publie sous le nom « interpreter » quand la ligne est connectée, refuse honnêtement sinon', async () => {
        const { result } = renderHook(() => useLiveTransport({ roomName: 'call-4', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call' }));
        await flush();
        const p = last();
        const track = { id: 't', kind: 'audio' } as unknown as MediaStreamTrack;
        await act(async () => { await result.current.publishInterpreterAudio(track); });
        expect(calls(p, 'publishAuxiliaryAudio')).toEqual([[track, 'interpreter']]);
        await act(async () => { await result.current.unpublishInterpreterAudio(); });
        expect(calls(p, 'unpublishAuxiliaryAudio')).toEqual([['interpreter']]);
        p.connected = false;
        await expect(result.current.publishInterpreterAudio(track)).rejects.toThrow(/Ligne non connectée/);
        expect(calls(p, 'publishAuxiliaryAudio')).toHaveLength(1);
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

/**
 * SAT-5 — la ligne d'un DIRECT tombe sans qu'on l'ait demandé. Le hook ne
 * relance que si l'écran fournit une garde `autoRecover` ET que cette garde
 * confirme, en base, que le direct est encore ouvert. Jamais sur un refus
 * nommé du serveur, jamais sur une éviction par identité dupliquée, et trois
 * fois au plus. Le doute (garde qui lève) n'est pas une clôture.
 */
const { LiveAccessError } = await import('../services/live/liveAccessError');
const { LIVE_ENDED_MESSAGE } = await import('../hooks/useLiveTransport');
const failingConnect = async (events: any) => { events.onDisconnected('7'); throw new Error('could not establish pc connection'); };
const directWarnings = () => (console.warn as any).mock.calls.map((c: unknown[]) => String(c[0])).filter((s: string) => s.startsWith('[direct]'));

describe('useLiveTransport — SAT-5 : relance automatique du DIRECT, gardée par l’état réel en base', () => {
    it('direct encore ouvert (garde → true) : 3 relances au plus, la garde est consultée AVANT chaque relance, pas une de plus', async () => {
        rig.connectImpl = failingConnect;
        const autoRecover = vi.fn(async () => true);
        const { result } = renderHook(() => useLiveTransport({ roomName: 'live-sat5-open', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live', autoRecover }));
        await flush();
        for (let i = 0; i < 8; i++) await flush(5000);
        expect(rig.providers.length).toBe(4); // 1 tentative + 3 relances
        expect(autoRecover).toHaveBeenCalledTimes(3); // le budget épuisé n'interroge plus la base
        expect(directWarnings().filter((s) => s.includes('nouvelle tentative'))).toEqual([
            expect.stringContaining('nouvelle tentative 1/3'),
            expect.stringContaining('nouvelle tentative 2/3'),
            expect.stringContaining('nouvelle tentative 3/3'),
        ]);
        expect(result.current.connectionState).toBe('disconnected');
        expect(result.current.error).not.toBe(LIVE_ENDED_MESSAGE);
    });

    it('direct clôturé par l’animateur (garde → false) : AUCUNE relance, l’écran dit « Ce direct est terminé. »', async () => {
        rig.connectImpl = failingConnect;
        const autoRecover = vi.fn(async () => false);
        const { result } = renderHook(() => useLiveTransport({ roomName: 'live-sat5-ended', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live', autoRecover }));
        await flush();
        for (let i = 0; i < 4; i++) await flush(5000);
        expect(rig.providers.length).toBe(1);
        expect(autoRecover).toHaveBeenCalledTimes(1);
        expect(result.current.error).toBe(LIVE_ENDED_MESSAGE);
        expect(directWarnings().some((s) => s.includes('nouvelle tentative'))).toBe(false);
    });

    it('base injoignable (garde qui LÈVE) : le doute n’est pas une clôture — on relance, borné par le même budget', async () => {
        rig.connectImpl = failingConnect;
        const autoRecover = vi.fn(async () => { throw new Error('fetch failed'); });
        const { result } = renderHook(() => useLiveTransport({ roomName: 'live-sat5-doubt', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live', autoRecover }));
        await flush();
        for (let i = 0; i < 8; i++) await flush(5000);
        expect(rig.providers.length).toBe(4);
        expect(result.current.error).not.toBe(LIVE_ENDED_MESSAGE);
    });

    it('refus NOMMÉ du serveur (direct complet, SAT-3) : jamais de relance, la base n’est même pas interrogée', async () => {
        rig.connectImpl = async () => { throw new LiveAccessError({ code: 'live_full', message: 'Ce direct est complet.' } as any, 'complet'); };
        const autoRecover = vi.fn(async () => true);
        const { result } = renderHook(() => useLiveTransport({ roomName: 'live-sat5-full', participantName: 'S', canPublish: false, enabled: true, audioProfile: 'live', autoRecover }));
        await flush();
        for (let i = 0; i < 4; i++) await flush(5000);
        expect(rig.providers.length).toBe(1);
        expect(autoRecover).not.toHaveBeenCalled();
        expect(result.current.refusal?.code).toBe('live_full');
    });

    it('direct établi puis ligne perdue (raison 3) : la garde est consultée, la ligne se rétablit seule ; une éviction par identité dupliquée (raison 2) ne relance jamais', async () => {
        const autoRecover = vi.fn(async () => true);
        const { result } = renderHook(() => useLiveTransport({ roomName: 'live-sat5-drop', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live', autoRecover }));
        await flush();
        const p1 = last();
        act(() => { p1.events.onDisconnected('3'); });
        await flush(1000); // relance 1 : 700 ms
        expect(autoRecover).toHaveBeenCalledTimes(1);
        expect(rig.providers.length).toBe(2);
        expect(result.current.connectionState).toBe('connected');
        const p2 = last();
        act(() => { p2.events.onDisconnected('2'); });
        for (let i = 0; i < 4; i++) await flush(5000);
        expect(rig.providers.length).toBe(2);
        expect(autoRecover).toHaveBeenCalledTimes(1);
        expect(result.current.error).toMatch(/identité dupliquée/);
    });

    it('une seule lecture en base à la fois : deux pertes rapprochées ne déclenchent qu’une garde en vol', async () => {
        let resolveGuard: (v: boolean) => void = () => {};
        const autoRecover = vi.fn(() => new Promise<boolean>((resolve) => { resolveGuard = resolve; }));
        renderHook(() => useLiveTransport({ roomName: 'live-sat5-once', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live', autoRecover }));
        await flush();
        const p1 = last();
        act(() => { p1.events.onDisconnected('3'); p1.events.onDisconnected('3'); });
        await flush();
        expect(autoRecover).toHaveBeenCalledTimes(1);
        act(() => { resolveGuard(true); });
        await flush(1000);
        expect(rig.providers.length).toBe(2);
    });

    it('APPEL : la garde `autoRecover` est ignorée — un appel relance sur ses propres règles (média voulu), garde jamais appelée', async () => {
        rig.connectImpl = failingConnect;
        const autoRecover = vi.fn(async () => false);
        renderHook(() => useLiveTransport({ roomName: 'call-sat5', participantName: 'A', canPublish: true, enabled: true, audioProfile: 'call', publishAudioOnConnect: true, autoRecover }));
        await flush();
        for (let i = 0; i < 8; i++) await flush(5000);
        expect(rig.providers.length).toBe(4);
        expect(autoRecover).not.toHaveBeenCalled();
    });

    it('la garde d’une tentative ANNULÉE ne parle plus : un direct changé entre-temps ne reçoit jamais le « terminé » de l’ancien', async () => {
        let resolveGuard: (v: boolean) => void = () => {};
        const autoRecover = vi.fn(() => new Promise<boolean>((resolve) => { resolveGuard = resolve; }));
        const { result, rerender } = renderHook(
            (p: { room: string }) => useLiveTransport({ roomName: p.room, participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live', autoRecover }),
            { initialProps: { room: 'live-sat5-A' } },
        );
        await flush();
        act(() => { last().events.onDisconnected('3'); });
        await flush();
        expect(autoRecover).toHaveBeenCalledTimes(1);
        rerender({ room: 'live-sat5-B' }); // nouvelle tentative, l'ancienne est annulée, sa garde vole encore
        await flush();
        expect(result.current.connectionState).toBe('connected');
        act(() => { resolveGuard(false); }); // l'ANCIEN direct est clôturé — cela ne concerne pas le nouveau
        await flush(50);
        expect(result.current.error).toBeNull();
        expect(result.current.connectionState).toBe('connected');
        expect(rig.providers.length).toBe(2);
    });

    it('démontage pendant que la garde est en vol : aucune relance après le démontage', async () => {
        let resolveGuard: (v: boolean) => void = () => {};
        const autoRecover = vi.fn(() => new Promise<boolean>((resolve) => { resolveGuard = resolve; }));
        const { unmount } = renderHook(() => useLiveTransport({ roomName: 'live-sat5-unmount', participantName: 'H', canPublish: true, enabled: true, audioProfile: 'live', autoRecover }));
        await flush();
        act(() => { last().events.onDisconnected('3'); });
        await flush();
        unmount();
        act(() => { resolveGuard(true); });
        for (let i = 0; i < 3; i++) await flush(5000);
        expect(rig.providers.length).toBe(1);
    });
});
