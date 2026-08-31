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
    /** Identifiant stable du participant — correspond à `profiles.id` côté MokNet. */
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
    onDisconnected?: (reason?: string) => void;
}

export interface LiveConnectParams {
    serverUrl: string;
    /** Jeton signé côté serveur (edge function `livekit-token`) — jamais de clé/secret côté client. */
    token: string;
}

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
}
