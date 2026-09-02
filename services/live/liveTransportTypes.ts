/**
 * Frontière de transport du LIVE — le reste du système (rôles, chat, IA,
 * verre/eau/lumière) ne dépend jamais du SDK d'un fournisseur, uniquement de
 * ce port. `LiveKitTransportProvider` (liveKitTransportProvider.ts) est la
 * seule pièce qui change si le fournisseur change un jour (LiveKit
 * auto-hébergé → LiveKit Cloud, ou un autre fournisseur) — voir le plan de
 * mission (section "Architecture retenue — frontière de transport isolée").
 */

export type LiveConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'reconnecting'
    | 'failed';

export type LiveTrackKind = 'audio' | 'video' | 'screen_share' | 'screen_share_audio';

/** Face de la caméra locale — 'user' (avant, appels en face à face) ou 'environment' (arrière, montrer ce qu'on voit). */
export type LiveCameraFacing = 'user' | 'environment';

export interface LiveParticipantHandle {
    /**
     * Identifiant stable du participant — `profiles.id` dans une room de LIVE.
     * Mission AU : dans une room d'APPEL (`call-…`), `<profiles.id>::<deviceId>`
     * (une identité par appareil) — retrouver le compte avec
     * `userIdFromIdentity()` (services/calls/callDevice.ts), jamais par égalité.
     */
    identity: string;
    name: string;
    isLocal: boolean;
    isSpeaking: boolean;
    audioEnabled: boolean;
    videoEnabled: boolean;
    isScreenSharing: boolean;
    /** Métadonnées libres posées côté application (ex. rôle LIVE), jamais interprétées par le transport. */
    metadata?: string;
}

export interface LiveTrackHandle {
    participantIdentity: string;
    kind: LiveTrackKind;
    attach: (el: HTMLMediaElement) => void;
    detach: (el?: HTMLMediaElement) => void;
    /** Pistes audio distantes uniquement : volume 0..1 (HL-4, l'interprète atténue l'original pendant qu'il parle). */
    setVolume?: (volume: number) => void;
}

export interface LiveTransportEvents {
    onConnectionStateChanged?: (state: LiveConnectionState) => void;
    onParticipantConnected?: (participant: LiveParticipantHandle) => void;
    onParticipantDisconnected?: (identity: string) => void;
    onParticipantMetadataChanged?: (identity: string, metadata: string | undefined) => void;
    onTrackSubscribed?: (track: LiveTrackHandle) => void;
    onTrackUnsubscribed?: (participantIdentity: string, kind: LiveTrackKind) => void;
    /** Ma propre piste (caméra/micro/partage d'écran) vient d'être publiée — pour l'auto-aperçu, même contrat attach/detach que les pistes distantes. */
    onLocalTrackPublished?: (track: LiveTrackHandle) => void;
    onLocalTrackUnpublished?: (kind: LiveTrackKind) => void;
    onActiveSpeakersChanged?: (identities: string[]) => void;
    /**
     * Équipe F3 : le navigateur peut BLOQUER la lecture audio tant qu'aucun
     * geste utilisateur n'a eu lieu (politique d'autoplay). false = le son
     * est bloqué — l'UI doit proposer un bouton « Activer le son » qui
     * appelle `startAudio()` dans le handler de clic.
     */
    onAudioPlaybackChanged?: (canPlay: boolean) => void;
    /** Canal de données temps réel — utilisé par les LOOPs suivantes pour chat/réactions/demandes de parole en complément des tables persistées. */
    onDataReceived?: (payload: Uint8Array, fromIdentity: string | undefined) => void;
    /** HL-3 : qualité de connexion d'un participant (local compris), telle que mesurée par le transport. */
    onConnectionQualityChanged?: (identity: string, quality: LiveConnectionQuality) => void;
    onDisconnected?: (reason?: string) => void;
    /**
     * Mission AU : ma piste locale s'est TERMINÉE (micro débranché, capture
     * interrompue par le système — appel téléphonique, Siri, changement
     * d'application sur iOS). Le SDK ne la relance pas toujours : l'appelant
     * décide de republier.
     */
    onLocalTrackEnded?: (kind: LiveTrackKind) => void;
    /** Mission AU : échec de capture rapporté par le transport (permission refusée, périphérique absent) — message brut du navigateur. */
    onMediaDevicesError?: (message: string, kind: 'audio' | 'video' | undefined) => void;
}

/** Mission AU : mesure BRUTE de la liaison audio (compteurs WebRTC réels), jamais estimée. */
export interface LiveAudioStats {
    at: number;
    /** Ma piste micro : null si aucune piste n'est publiée. */
    local: { muted: boolean; bytesSent: number | null; packetsSent: number | null; audioLevel: number } | null;
    /** Une entrée par piste micro distante SOUSCRITE. */
    remote: Array<{ identity: string; bytesReceived: number | null; packetsReceived: number | null; concealedSamples: number | null; audioLevel: number }>;
    canPlaybackAudio: boolean;
}

/**
 * AU-7 : chemin réseau RÉELLEMENT négocié par chaque connexion pair-à-pair
 * (publication = ce que j'envoie, souscription = ce que je reçois), lu dans
 * les statistiques WebRTC — jamais estimé. Aucune adresse locale : seuls le
 * TYPE de candidat (host/srflx/prflx/relay) et le protocole (udp/tcp) sont
 * conservés côté local ; côté distant, c'est notre serveur.
 */
export interface LiveIcePathInfo {
    state: string | null;
    local: { type: string | null; protocol: string | null } | null;
    remote: { type: string | null; protocol: string | null; address: string | null; port: number | null } | null;
    bytesSent: number | null;
    bytesReceived: number | null;
    currentRoundTripTime: number | null;
}

export interface LiveTransportDiagnostics {
    at: number;
    connectionState: LiveConnectionState;
    publisher: LiveIcePathInfo | null;
    subscriber: LiveIcePathInfo | null;
    localTracks: Array<{ kind: LiveTrackKind; muted: boolean }>;
    remoteTracks: Array<{ identity: string; kind: LiveTrackKind }>;
}

export interface LiveConnectParams {
    serverUrl: string;
    /** Jeton signé côté serveur (edge function `livekit-token`) — jamais de clé/secret côté client. */
    token: string;
    /**
     * Mission « Harmonisation de la langue » (HL-3, fluidité des appels) :
     * profil audio. `call` = conversation à deux — encodage Opus « parole »
     * (plus robuste aux pertes de paquets qu'un préréglage musique, moins de
     * coupures sur réseau mobile), redondance RED + DTX gardés. `live`
     * (défaut) = comportement historique du LIVE, inchangé.
     */
    audioProfile?: 'live' | 'call';
}

/** Qualité de connexion RÉELLE rapportée par le transport (jamais estimée côté UI). */
export type LiveConnectionQuality = 'excellent' | 'good' | 'poor' | 'lost' | 'unknown';

export interface SendDataOptions {
    reliable?: boolean;
    destinationIdentities?: string[];
}

/**
 * Port transport-agnostique. Toute nouvelle implémentation (autre fournisseur,
 * ou une version mock pour les tests) doit satisfaire exactement cette forme.
 */
export interface LiveTransportProvider {
    connect(params: LiveConnectParams, events: LiveTransportEvents): Promise<void>;
    disconnect(): Promise<void>;
    setCameraEnabled(enabled: boolean): Promise<void>;
    /**
     * Bascule la caméra locale déjà PUBLIÉE sur l'autre face (avant/arrière,
     * loop 7 des appels). Rejette avec un message clair si aucune caméra
     * n'est active — l'UI ne montre le bouton que quand la bascule a un sens
     * (caméra allumée ET plusieurs caméras détectées).
     */
    setCameraFacing(facing: LiveCameraFacing): Promise<void>;
    setMicrophoneEnabled(enabled: boolean): Promise<void>;
    startScreenShare(): Promise<void>;
    stopScreenShare(): Promise<void>;
    sendData(payload: Uint8Array, options?: SendDataOptions): Promise<void>;
    setLocalMetadata(metadata: string): Promise<void>;
    /** Équipe F3 : à appeler DANS un handler de geste utilisateur pour débloquer la lecture audio refusée par la politique d'autoplay. */
    startAudio(): Promise<void>;
    /** true si le navigateur autorise actuellement la lecture audio des pistes distantes. */
    canPlaybackAudio(): boolean;
    getLocalParticipant(): LiveParticipantHandle | null;
    getRemoteParticipants(): LiveParticipantHandle[];
    getConnectionState(): LiveConnectionState;
    /**
     * VF-4 : la piste micro LOCALE réellement publiée (MediaStreamTrack), pour
     * la transcription serveur de l'interprète d'appel — null tant que le
     * micro n'est pas publié. Lecture seule : l'appelant n'arrête jamais
     * cette piste, il l'écoute.
     */
    getLocalAudioTrack(): MediaStreamTrack | null;
    /** Mission AU : compteurs audio réels (envoi/réception) pour juger chaque sens séparément et journaliser un appel sur vrai appareil. */
    getAudioStats(): Promise<LiveAudioStats>;
    /** AU-7 : chemin réseau négocié et pistes réelles — pour le rapport de diagnostic d'appel (facultatif pour un double de test). */
    getTransportDiagnostics?(): Promise<LiveTransportDiagnostics>;
}
