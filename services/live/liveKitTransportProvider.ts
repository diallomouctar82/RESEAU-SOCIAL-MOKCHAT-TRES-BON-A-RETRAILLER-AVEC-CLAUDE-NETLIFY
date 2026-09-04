/**
 * Seule pièce du système qui connaît le SDK LiveKit. Implémente le port
 * `LiveTransportProvider` (liveTransportTypes.ts) — le reste de l'app ne doit
 * jamais importer `livekit-client` directement.
 */
import {
    AudioPresets,
    ConnectionQuality,
    ConnectionState,
    LocalAudioTrack,
    LocalParticipant,
    LocalTrackPublication,
    LocalVideoTrack,
    LogLevel,
    Participant,
    RemoteAudioTrack,
    RemoteParticipant,
    RemoteTrack,
    Room,
    RoomEvent,
    Track,
    TrackEvent,
    setLogExtension,
} from 'livekit-client';
import type {
    LiveAudioStats,
    LiveCameraFacing,
    LiveConnectParams,
    LiveConnectionQuality,
    LiveConnectionState,
    LiveIcePathInfo,
    LiveParticipantHandle,
    LiveTrackHandle,
    LiveTrackKind,
    LiveTransportDiagnostics,
    LiveTransportEvents,
    LiveTransportProvider,
    SendDataOptions,
} from './liveTransportTypes';
import { describeDisconnectReason, isInterpreterTrackName } from './liveTransportTypes';
import { isCallDiagnosticsActive, recordCallEvent } from '../calls/callDiagnostics';

/**
 * AU-7 : le journal interne du SDK (raisons de reconnexion, échecs de
 * négociation, états ICE) est la seule source qui dit POURQUOI une ligne se
 * rétablit ou tombe sur un vrai téléphone. Il est copié dans le rapport de
 * diagnostic d'appel quand un rapport est ouvert — le LIVE n'en produit pas,
 * et la console du navigateur reste alimentée comme avant. Installé une fois.
 */
let sdkLogSinkInstalled = false;
function installSdkLogSink(): void {
    if (sdkLogSinkInstalled) return;
    sdkLogSinkInstalled = true;
    try {
        setLogExtension((level, msg, context) => {
            if (!isCallDiagnosticsActive()) return;
            if (level < LogLevel.info) return;
            recordCallEvent(level >= LogLevel.warn ? 'error' : 'sdk', String(msg), context);
        });
    } catch { /* journal SDK indisponible : le rapport garde les événements de l'application */ }
}

function pathFromStats(report: RTCStatsReport): LiveIcePathInfo | null {
    const byId = new Map<string, Record<string, unknown>>();
    report.forEach((stat) => { byId.set(String((stat as { id: string }).id), stat as unknown as Record<string, unknown>); });
    let pair: Record<string, unknown> | undefined;
    for (const stat of byId.values()) {
        if (stat.type === 'transport' && typeof stat.selectedCandidatePairId === 'string') {
            pair = byId.get(stat.selectedCandidatePairId);
            if (pair) break;
        }
    }
    if (!pair) {
        for (const stat of byId.values()) {
            if (stat.type === 'candidate-pair' && (stat.nominated === true || stat.state === 'succeeded')) { pair = stat; break; }
        }
    }
    if (!pair) return null;
    const local = typeof pair.localCandidateId === 'string' ? byId.get(pair.localCandidateId) : undefined;
    const remote = typeof pair.remoteCandidateId === 'string' ? byId.get(pair.remoteCandidateId) : undefined;
    const num = (v: unknown) => (typeof v === 'number' ? v : null);
    const str = (v: unknown) => (typeof v === 'string' ? v : null);
    return {
        state: str(pair.state),
        local: local ? { type: str(local.candidateType), protocol: str(local.protocol) } : null,
        remote: remote ? { type: str(remote.candidateType), protocol: str(remote.protocol), address: str(remote.address ?? remote.ip), port: num(remote.port) } : null,
        bytesSent: num(pair.bytesSent),
        bytesReceived: num(pair.bytesReceived),
        currentRoundTripTime: num(pair.currentRoundTripTime),
    };
}

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
    /** Mission AU : désabonnement de `TrackEvent.Ended` par sorte de piste locale (revue AU-6). */
    private endedListeners = new Map<LiveTrackKind, () => void>();

    async connect(params: LiveConnectParams, events: LiveTransportEvents): Promise<void> {
        // HL-3 (fluidité des appels) : pour un appel à deux, encodage Opus
        // « parole » (24 kb/s, bien plus tolérant aux pertes de paquets que le
        // préréglage musique par défaut → moins de coupures sur réseau mobile)
        // avec redondance RED et DTX ; capture micro avec annulation d'écho,
        // réduction de bruit et gain automatique explicitement demandés. Le
        // LIVE garde strictement ses réglages historiques.
        // AU-8 : `adaptiveStream` DÉSACTIVÉ pour un appel — c'est lui qui faisait
        // disparaître l'image du correspondant au bout de quelques secondes.
        // Le flux adaptatif observe la taille et la visibilité de l'élément
        // <video> auquel la piste est attachée et SE DÉSABONNE quand il le juge
        // invisible ; le SDK émet alors `TrackUnsubscribed`, la piste distante
        // est retirée de l'état (voir plus bas, RoomEvent.TrackUnsubscribed →
        // onTrackUnsubscribed) et l'écran d'appel retombe sur la vignette
        // d'attente : « on ne voit plus la personne ». Or l'écran d'appel a
        // justement eu, jusqu'à ce correctif, une hauteur nulle sur téléphone
        // (classe Tailwind 4 ignorée par le Tailwind 3 du site) — condition
        // parfaite pour être jugé invisible. Même corrigée, la mesure reste
        // fragile à chaque transition (plein écran, rotation, incrustation
        // déplacée), et pour un appel À DEUX le flux du correspondant n'est pas
        // un contenu qu'on peut mettre en pause : c'est TOUT le contenu.
        // `dynacast` suit, pour la même raison : sans abonné actif il cesse de
        // publier les couches vidéo, ce qui rallonge la reprise. Le LIVE, lui,
        // affiche N vignettes dont beaucoup hors écran : les deux réglages y
        // gardent tout leur sens et restent strictement inchangés.
        // Mission LT (latence de connexion) : `singlePeerConnection: false` —
        // le SDK 2.17 tente d'abord le chemin de signalisation « v1 » (une
        // seule connexion pair-à-pair), que notre serveur 1.8.4 ne connaît
        // pas : 404, erreur « v1 RTC path not found », puis nouvel essai sur le
        // chemin « v0 ». Mesuré dans les rapports d'appels réels : 0,8 s
        // perdu à CHAQUE connexion, avant le premier octet. Le chemin v0 est
        // de toute façon celui qui finit par servir ; on y va directement.
        const room = params.audioProfile === 'call'
            ? new Room({
                adaptiveStream: false,
                dynacast: false,
                singlePeerConnection: false,
                audioCaptureDefaults: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                publishDefaults: { audioPreset: AudioPresets.speech, dtx: true, red: true },
            })
            // LV-6 : `singlePeerConnection: false` vaut AUSSI pour le LIVE. La
            // raison est propre au serveur (1.8.4 ne connaît pas le chemin
            // « v1 »), pas au type de session — le banc LV-6 a montré la même
            // erreur `WebSocket … /rtc/v1` des deux côtés d'un direct, donc les
            // mêmes 0,8 s perdus avant le premier octet. `adaptiveStream` et
            // `dynacast`, eux, restent activés pour le LIVE : ils y gardent
            // tout leur sens (N vignettes dont beaucoup hors écran).
            : new Room({ adaptiveStream: true, dynacast: true, singlePeerConnection: false });
        this.room = room;

        // AU-7 : tout ce que le SDK sait d'une ligne qui vacille va au rapport
        // de diagnostic (quand un appel en tient un) — raisons de reconnexion,
        // déconnexion nommée, publications/souscriptions réelles.
        if (params.audioProfile === 'call') {
            installSdkLogSink();
            room.on(RoomEvent.Reconnecting, () => { recordCallEvent('transport', 'SDK : reconnexion complète en cours'); });
            room.on(RoomEvent.SignalReconnecting, () => { recordCallEvent('transport', 'SDK : signalisation en reconnexion'); });
            room.on(RoomEvent.Reconnected, () => { recordCallEvent('transport', 'SDK : reconnecté'); });
            room.on(RoomEvent.Connected, () => { recordCallEvent('transport', 'SDK : connecté', { serverUrl: params.serverUrl }); });
            room.on(RoomEvent.TrackSubscribed, (track: RemoteTrack, pub, participant: RemoteParticipant) => {
                recordCallEvent('media', `piste distante souscrite : ${track.source}${pub.trackName ? ` (${pub.trackName})` : ''}`, { from: participant.identity });
            });
            room.on(RoomEvent.TrackUnsubscribed, (track: RemoteTrack, pub, participant: RemoteParticipant) => {
                recordCallEvent('media', `piste distante retirée : ${track.source}${pub.trackName ? ` (${pub.trackName})` : ''}`, { from: participant.identity });
            });
            room.on(RoomEvent.LocalTrackPublished, (publication: LocalTrackPublication) => {
                recordCallEvent('media', `ma piste publiée : ${publication.source}${publication.trackName ? ` (${publication.trackName})` : ''}`, { codec: publication.mimeType, sid: publication.trackSid });
            });
            room.on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
                recordCallEvent('media', `ma piste dépubliée : ${publication.source}`);
            });
            room.on(RoomEvent.ParticipantConnected, (p: RemoteParticipant) => { recordCallEvent('transport', 'participant arrivé', { identity: p.identity }); });
            room.on(RoomEvent.ParticipantDisconnected, (p: RemoteParticipant) => { recordCallEvent('transport', 'participant parti', { identity: p.identity }); });
            room.on(RoomEvent.MediaDevicesError, (error: Error, deviceKind?: MediaDeviceKind) => {
                recordCallEvent('error', `capture impossible (${deviceKind ?? 'périphérique'})`, error);
            });
        }

        room.on(RoomEvent.ConnectionQualityChanged, (quality: ConnectionQuality, participant: Participant) => {
            events.onConnectionQualityChanged?.(participant.identity, CONNECTION_QUALITY_MAP[quality] ?? 'unknown');
        });

        room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
            recordCallEvent('transport', `état de connexion : ${state}`);
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
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant: RemoteParticipant) => {
            // Mission VT : la piste AUXILIAIRE de l'interprète (source « inconnue »
            // pour le SDK) est reconnue par son nom de publication — c'est de
            // l'audio, distinct du micro du correspondant.
            const auxiliary = track.kind === Track.Kind.Audio && isInterpreterTrackName(publication.trackName);
            const kind = auxiliary ? 'audio' : TRACK_SOURCE_TO_KIND[track.source];
            if (!kind) return;
            const handle: LiveTrackHandle = {
                participantIdentity: participant.identity,
                kind,
                name: auxiliary ? publication.trackName : undefined,
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
        room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant: RemoteParticipant) => {
            const auxiliary = track.kind === Track.Kind.Audio && isInterpreterTrackName(publication.trackName);
            const kind = auxiliary ? 'audio' : TRACK_SOURCE_TO_KIND[track.source];
            if (!kind) return;
            events.onTrackUnsubscribed?.(participant.identity, kind, auxiliary ? publication.trackName : undefined);
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
            // Mission AU : fin de la capture (micro débranché, interruption
            // système sur mobile). Revue AU-6 : abonnement durable (`on`) —
            // après une relance, le SDK remplace le MediaStreamTrack DANS le
            // même objet piste sans nouvelle publication, une 2e coupure doit
            // donc atteindre le même écouteur ; il est retiré à la dépublication.
            const onEnded = () => { events.onLocalTrackEnded?.(kind); };
            this.endedListeners.get(kind)?.();
            track.on(TrackEvent.Ended, onEnded);
            this.endedListeners.set(kind, () => { track.off(TrackEvent.Ended, onEnded); });
        });
        room.on(RoomEvent.MediaDevicesError, (error: Error, deviceKind?: MediaDeviceKind) => {
            const kind = deviceKind === 'audioinput' ? 'audio' : deviceKind === 'videoinput' ? 'video' : undefined;
            events.onMediaDevicesError?.(error?.name ? `${error.name}: ${error.message}` : String(error), kind);
        });
        room.on(RoomEvent.LocalTrackUnpublished, (publication: LocalTrackPublication) => {
            const kind = TRACK_SOURCE_TO_KIND[publication.source];
            if (!kind) return;
            this.endedListeners.get(kind)?.();
            this.endedListeners.delete(kind);
            events.onLocalTrackUnpublished?.(kind);
        });
        room.on(RoomEvent.Disconnected, (reason) => {
            // Mission LT : la raison est aussi LISIBLE dans le rapport (« identité dupliquée », « délai de connexion »…).
            recordCallEvent('transport', 'SDK : déconnecté', { reason: reason !== undefined ? String(reason) : 'inconnue', motif: describeDisconnectReason(reason) });
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
        for (const off of this.endedListeners.values()) off();
        this.endedListeners.clear();
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

    /**
     * Mission VT : la voix de l'interprète part dans l'appel comme une piste
     * audio ordinaire (même encodage « parole » que le micro). Source
     * « inconnue » côté SDK — jamais un second micro, qui perturberait l'état
     * `isMicrophoneEnabled` — reconnue chez le récepteur par son nom.
     * Idempotent : une piste déjà publiée sous ce nom n'est pas republiée.
     */
    async publishAuxiliaryAudio(track: MediaStreamTrack, name: string): Promise<void> {
        const local = this.requireLocalParticipant();
        if (local.getTrackPublicationByName(name)?.track) return;
        await local.publishTrack(track, { name, source: Track.Source.Unknown, audioPreset: AudioPresets.speech, dtx: true, red: true, stopMicTrackOnMute: false });
    }

    async unpublishAuxiliaryAudio(name: string): Promise<void> {
        const local = this.room?.localParticipant;
        const track = local?.getTrackPublicationByName(name)?.track;
        // La piste appartient au rendu (contexte audio de l'interprète) : dépubliée sans être arrêtée.
        if (local && track) await local.unpublishTrack(track, false);
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

    /**
     * Mission AU : compteurs WebRTC RÉELS — octets/paquets envoyés par ma
     * piste micro, reçus par chaque piste micro distante souscrite. `null`
     * quand le navigateur ne fournit pas la mesure (jamais un chiffre
     * inventé) ; un échec de getStats sur une piste n'empêche pas les autres.
     */
    async getAudioStats(): Promise<LiveAudioStats> {
        const room = this.room;
        const at = Date.now();
        if (!room) return { at, local: null, remote: [], canPlaybackAudio: true };

        const localPub = room.localParticipant.getTrackPublication(Track.Source.Microphone);
        const localTrack = localPub?.track;
        let local: LiveAudioStats['local'] = null;
        if (localTrack instanceof LocalAudioTrack) {
            let bytesSent: number | null = null;
            let packetsSent: number | null = null;
            try {
                const stats = await localTrack.getSenderStats();
                bytesSent = typeof stats?.bytesSent === 'number' ? stats.bytesSent : null;
                packetsSent = typeof stats?.packetsSent === 'number' ? stats.packetsSent : null;
            } catch { /* mesure indisponible : null, jamais un chiffre inventé */ }
            local = { muted: localTrack.isMuted || !!localPub?.isMuted, bytesSent, packetsSent, audioLevel: room.localParticipant.audioLevel };
        }

        const remote: LiveAudioStats['remote'] = [];
        for (const participant of room.remoteParticipants.values()) {
            const track = participant.getTrackPublication(Track.Source.Microphone)?.track;
            if (!(track instanceof RemoteAudioTrack)) continue;
            let bytesReceived: number | null = null;
            let packetsReceived: number | null = null;
            let concealedSamples: number | null = null;
            try {
                const stats = await track.getReceiverStats();
                bytesReceived = typeof stats?.bytesReceived === 'number' ? stats.bytesReceived : null;
                packetsReceived = typeof stats?.packetsReceived === 'number' ? stats.packetsReceived : null;
                concealedSamples = typeof stats?.concealedSamples === 'number' ? stats.concealedSamples : null;
            } catch { /* idem */ }
            remote.push({ identity: participant.identity, bytesReceived, packetsReceived, concealedSamples, audioLevel: participant.audioLevel });
        }
        return { at, local, remote, canPlaybackAudio: room.canPlaybackAudio };
    }

    /**
     * AU-7 : chemin réseau RÉELLEMENT négocié (candidats ICE retenus, protocole,
     * aller-retour) pour chaque connexion — celle qui publie (ma piste micro)
     * et celle qui reçoit (première piste micro distante) — plus l'inventaire
     * des pistes. Une mesure indisponible vaut null, jamais un chiffre inventé.
     */
    async getTransportDiagnostics(): Promise<LiveTransportDiagnostics> {
        const room = this.room;
        const at = Date.now();
        const connectionState: LiveConnectionState = room ? (CONNECTION_STATE_MAP[room.state] ?? 'disconnected') : 'disconnected';
        if (!room) return { at, connectionState, publisher: null, subscriber: null, localTracks: [], remoteTracks: [] };

        let publisher: LiveIcePathInfo | null = null;
        const localTracks: LiveTransportDiagnostics['localTracks'] = [];
        for (const pub of room.localParticipant.trackPublications.values()) {
            const kind = TRACK_SOURCE_TO_KIND[pub.source];
            if (kind) localTracks.push({ kind, muted: pub.isMuted });
            if (!publisher && pub.track?.sender) {
                try { publisher = pathFromStats(await pub.track.sender.getStats()); } catch { /* mesure indisponible */ }
            }
        }

        let subscriber: LiveIcePathInfo | null = null;
        const remoteTracks: LiveTransportDiagnostics['remoteTracks'] = [];
        for (const participant of room.remoteParticipants.values()) {
            for (const pub of participant.trackPublications.values()) {
                const kind = TRACK_SOURCE_TO_KIND[pub.source];
                if (kind && pub.track) remoteTracks.push({ identity: participant.identity, kind });
                const receiver = (pub.track as RemoteTrack | undefined)?.receiver;
                if (!subscriber && receiver) {
                    try { subscriber = pathFromStats(await receiver.getStats()); } catch { /* mesure indisponible */ }
                }
            }
        }
        return { at, connectionState, publisher, subscriber, localTracks, remoteTracks };
    }

    private requireLocalParticipant(): LocalParticipant {
        if (!this.room) throw new Error('LiveKitTransportProvider: appel avant connect()');
        return this.room.localParticipant;
    }
}
