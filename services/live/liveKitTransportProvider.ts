/**
 * Seule pièce du système qui connaît le SDK LiveKit. Implémente le port
 * `LiveTransportProvider` (liveTransportTypes.ts) — le reste de l'app ne doit
 * jamais importer `livekit-client` directement.
 */
import {
    AudioPresets,
    ConnectionQuality,
    ConnectionState,
    LocalParticipant,
    LocalTrackPublication,
    LocalVideoTrack,
    Participant,
    RemoteParticipant,
    Room,
    RoomEvent,
    Track,
} from 'livekit-client';
import type {
    LiveCameraFacing,
    LiveConnectParams,
    LiveConnectionQuality,
    LiveConnectionState,
    LiveParticipantHandle,
    LiveTrackHandle,
    LiveTrackKind,
    LiveTransportEvents,
    LiveTransportProvider,
    SendDataOptions,
} from './liveTransportTypes';

const CONNECTION_STATE_MAP: Record<ConnectionState, LiveConnectionState> = {
    [ConnectionState.Disconnected]: 'disconnected',
    [ConnectionState.Connecting]: 'connecting',
    [ConnectionState.Connected]: 'connected',
    [ConnectionState.Reconnecting]: 'reconnecting',
    [ConnectionState.SignalReconnecting]: 'reconnecting',
};

const CONNECTION_QUALITY_MAP: Record<ConnectionQuality, LiveConnectionQuality> = {
    [ConnectionQuality.Excellent]: 'excellent',
    [ConnectionQuality.Good]: 'good',
    [ConnectionQuality.Poor]: 'poor',
    [ConnectionQuality.Lost]: 'lost',
    [ConnectionQuality.Unknown]: 'unknown',
};

const TRACK_SOURCE_TO_KIND: Partial<Record<Track.Source, LiveTrackKind>> = {
    [Track.Source.Camera]: 'video',
    [Track.Source.Microphone]: 'audio',
    [Track.Source.ScreenShare]: 'screen_share',
    [Track.Source.ScreenShareAudio]: 'screen_share_audio',
};

function toParticipantHandle(p: Participant, isLocal: boolean): LiveParticipantHandle {
    return {
        identity: p.identity,
        name: p.name || p.identity,
        isLocal,
        isSpeaking: p.isSpeaking,
        audioEnabled: p.isMicrophoneEnabled,
        videoEnabled: p.isCameraEnabled,
        isScreenSharing: p.isScreenShareEnabled,
        metadata: p.metadata,
    };
}

export class LiveKitTransportProvider implements LiveTransportProvider {
    private room: Room | null = null;

    async connect(params: LiveConnectParams, events: LiveTransportEvents): Promise<void> {
        // HL-3 (fluidité des appels) : pour un appel à deux, encodage Opus
        // « parole » (24 kb/s, bien plus tolérant aux pertes de paquets que le
        // préréglage musique par défaut → moins de coupures sur réseau mobile)
        // avec redondance RED et DTX ; capture micro avec annulation d'écho,
        // réduction de bruit et gain automatique explicitement demandés. Le
        // LIVE garde strictement ses réglages historiques.
        const room = params.audioProfile === 'call'
            ? new Room({
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                publishDefaults: { audioPreset: AudioPresets.speech, dtx: true, red: true },
            })
            : new Room({ adaptiveStream: true, dynacast: true });
        this.room = room;

        room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant: Participant) => {
            events.onConnectionQualityChanged?.(participant.identity, CONNECTION_QUALITY_MAP[quality] ?? 'unknown');
        });

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
            events.onConnectionStateChanged?.(CONNECTION_STATE_MAP[state] ?? 'disconnected');
        });
        room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => {
            events.onParticipantConnected?.(toParticipantHandle(p, false));
        });
        room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => {
            events.onParticipantDisconnected?.(p.identity);
        });
        room.on(RoomEvent.ParticipantMetadataChanged, (metadata: string | undefined, p: Participant) => {
            events.onParticipantMetadataChanged?.(p.identity, metadata);
        });
        room.on(RoomEvent.TrackSubscribed, (track, _publication, participant: RemoteParticipant) => {
            const kind = TRACK_SOURCE_TO_KIND[track.source];
            if (!kind) return;
            const handle: LiveTrackHandle = {
                participantIdentity: participant.identity,
                kind,
                attach: (el) => { track.attach(el); },
                detach: (el) => { if (el) track.detach(el); else track.detach(); },
                // HL-4 : atténuation de l'audio distant pendant que l'interprète
                // parle — via l'API de piste (s'applique à tous ses éléments).
                setVolume: kind === 'audio' || kind === 'screen_share_audio'
                    ? (volume) => { (track as unknown as { setVolume?: (v: number) => void }).setVolume?.(Math.max(0, Math.min(1, volume))); }
                    : undefined,
            };
            events.onTrackSubscribed?.(handle);
        });
        room.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant: RemoteParticipant) => {
            const kind = TRACK_SOURCE_TO_KIND[track.source];
            if (!kind) return;
            events.onTrackUnsubscribed?.(participant.identity, kind);
        });
        room.on(RoomEvent.ActiveSpeakersChanged, (speakers: Participant[]) => {
            events.onActiveSpeakersChanged?.(speakers.map((s) => s.identity));
        });
        room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
            events.onDataReceived?.(payload, participant?.identity);
        });
        room.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
            const track = publication.track;
            const kind = TRACK_SOURCE_TO_KIND[publication.source];
            if (!track || !kind) return;
            const handle: LiveTrackHandle = {
                participantIdentity: room.localParticipant.identity,
                kind,
                attach: (el) => { track.attach(el); },
                detach: (el) => { if (el) track.detach(el); else track.detach(); },
            };
            events.onLocalTrackPublished?.(handle);
        });
        room.on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
            const kind = TRACK_SOURCE_TO_KIND[publication.source];
            if (!kind) return;
            events.onLocalTrackUnpublished?.(kind);
        });
        room.on(RoomEvent.Disconnected, (reason) => {
            events.onDisconnected?.(reason !== undefined ? String(reason) : undefined);
        });
        // Équipe F3 : lecture audio bloquée par la politique d'autoplay du
        // navigateur (aucun geste utilisateur) — remonté à l'UI pour afficher
        // un bouton « Activer le son » au lieu d'un silence inexpliqué.
        room.on(RoomEvent.AudioPlaybackStatusChanged, () => {
            events.onAudioPlaybackChanged?.(room.canPlaybackAudio);
        });

        await room.connect(params.serverUrl, params.token);
    }

    async disconnect(): Promise<void> {
        await this.room?.disconnect();
        this.room = null;
    }

    async setCameraEnabled(enabled: boolean): Promise<void> {
        await this.requireLocalParticipant().setCameraEnabled(enabled);
    }

    async setCameraFacing(facing: LiveCameraFacing): Promise<void> {
        // restartTrack remplace la capture de la piste DÉJÀ publiée (mêmes
        // abonnés, même publication) — jamais un unpublish/republish qui
        // ferait clignoter la tuile chez le correspondant.
        const track = this.requireLocalParticipant().getTrackPublication(Track.Source.Camera)?.track;
        if (!(track instanceof LocalVideoTrack)) {
            throw new Error('Caméra inactive — activez la caméra avant de basculer avant/arrière.');
        }
        await track.restartTrack({ facingMode: facing });
    }

    async setMicrophoneEnabled(enabled: boolean): Promise<void> {
        await this.requireLocalParticipant().setMicrophoneEnabled(enabled);
    }

    async startScreenShare(): Promise<void> {
        await this.requireLocalParticipant().setScreenShareEnabled(true);
    }

    async stopScreenShare(): Promise<void> {
        await this.requireLocalParticipant().setScreenShareEnabled(false);
    }

    async sendData(payload: Uint8Array, options?: SendDataOptions): Promise<void> {
        await this.requireLocalParticipant().publishData(payload, {
            reliable: options?.reliable ?? true,
            destinationIdentities: options?.destinationIdentities,
        });
    }

    async setLocalMetadata(metadata: string): Promise<void> {
        await this.requireLocalParticipant().setMetadata(metadata);
    }

    async startAudio(): Promise<void> {
        await this.room?.startAudio();
    }

    canPlaybackAudio(): boolean {
        return this.room?.canPlaybackAudio ?? true;
    }

    getLocalParticipant(): LiveParticipantHandle | null {
        const p = this.room?.localParticipant;
        return p ? toParticipantHandle(p, true) : null;
    }

    getRemoteParticipants(): LiveParticipantHandle[] {
        if (!this.room) return [];
        return Array.from(this.room.remoteParticipants.values()).map((p) => toParticipantHandle(p, false));
    }

    getConnectionState(): LiveConnectionState {
        if (!this.room) return 'disconnected';
        return CONNECTION_STATE_MAP[this.room.state] ?? 'disconnected';
    }

    getLocalAudioTrack(): MediaStreamTrack | null {
        return this.room?.localParticipant.getTrackPublication(Track.Source.Microphone)?.track?.mediaStreamTrack ?? null;
    }

    private requireLocalParticipant(): LocalParticipant {
        if (!this.room) throw new Error('LiveKitTransportProvider: appel avant connect()');
        return this.room.localParticipant;
    }
}
