// Pont React entre le port LiveTransportProvider (services/live/) et l'UI du
// LIVE. Remplace la capture caméra/écran purement locale de SocialLive.tsx
// par une vraie publication/abonnement de pistes (LOOP 04/14) — ce hook ne
// connaît que le port, jamais livekit-client directement.

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitTransportProvider } from '../services/live/liveKitTransportProvider';
import type { LiveConnectionState, LiveParticipantHandle, LiveTrackHandle } from '../services/live/liveTransportTypes';
import { fetchLiveKitToken } from '../services/live/liveKitToken';

export interface RemoteParticipantMedia {
    participant: LiveParticipantHandle;
    videoTrack?: LiveTrackHandle;
    audioTrack?: LiveTrackHandle;
    screenShareTrack?: LiveTrackHandle;
    /** Équipe F3 : le SON d'un partage d'écran (onglet avec vidéo, extrait…) — souscrit par LiveKit mais jeté avant ce champ. */
    screenShareAudioTrack?: LiveTrackHandle;
}

export interface UseLiveTransportOptions {
    /** Identifiant de room LiveKit — un live_sessions.id par session, ou `call-{conversationId}` pour un appel 1-à-1 (Équipe I). */
    roomName: string;
    participantName: string;
    /** Reflète le rôle réel (sur scène ou spectateur) — doit correspondre au jeton émis côté serveur. */
    canPublish: boolean;
    /** Ne se connecte que lorsque true (ex. attendre que roomName soit connu). */
    enabled: boolean;
    /**
     * Publier la caméra dès la connexion (défaut true — comportement
     * historique du LIVE). false pour un APPEL AUDIO (Équipe I) : seul le
     * micro part, jamais un flash de caméra non demandé.
     */
    publishVideoOnConnect?: boolean;
}

export interface UseLiveTransportResult {
    connectionState: LiveConnectionState;
    error: string | null;
    localVideoTrack: LiveTrackHandle | null;
    localScreenShareTrack: LiveTrackHandle | null;
    localIsSpeaking: boolean;
    remoteParticipants: RemoteParticipantMedia[];
    /** Équipe F3 : true quand le navigateur bloque la lecture audio (autoplay sans geste) — afficher un bouton qui appelle startAudio(). */
    audioPlaybackBlocked: boolean;
    /** À appeler DANS un handler de clic pour débloquer la lecture audio. */
    startAudio: () => Promise<void>;
    setCameraEnabled: (enabled: boolean) => Promise<void>;
    setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => Promise<void>;
    disconnect: () => Promise<void>;
}

export function useLiveTransport(options: UseLiveTransportOptions): UseLiveTransportResult {
    const { roomName, participantName, canPublish, enabled, publishVideoOnConnect = true } = options;
    const providerRef = useRef<LiveKitTransportProvider | null>(null);
    const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<LiveTrackHandle | null>(null);
    const [localScreenShareTrack, setLocalScreenShareTrack] = useState<LiveTrackHandle | null>(null);
    const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
    const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipantMedia[]>([]);
    const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);

    useEffect(() => {
        if (!enabled || !roomName) return;
        let cancelled = false;
        const provider = new LiveKitTransportProvider();
        providerRef.current = provider;

        const upsertRemote = (identity: string, patch: Partial<RemoteParticipantMedia>) => {
            setRemoteParticipants((prev) => {
                const idx = prev.findIndex((p) => p.participant.identity === identity);
                if (idx === -1) {
                    // Équipe F3 : une piste peut arriver AVANT le handle
                    // participant — l'ancienne version la jetait (« un futur
                    // snapshot la complètera » : faux, le snapshot ne remonte
                    // jamais les pistes déjà souscrites) → tuile muette et
                    // noire jusqu'au rechargement. On crée une entrée
                    // provisoire, complétée quand le handle réel arrive.
                    const participant: LiveParticipantHandle = patch.participant ?? {
                        identity,
                        name: identity,
                        isLocal: false,
                        isSpeaking: false,
                        audioEnabled: true,
                        videoEnabled: true,
                        isScreenSharing: false,
                    };
                    return [...prev, { ...patch, participant } as RemoteParticipantMedia];
                }
                const next = [...prev];
                next[idx] = { ...next[idx], ...patch };
                return next;
            });
        };

        (async () => {
            try {
                const { token, serverUrl } = await fetchLiveKitToken(roomName, participantName, canPublish);
                if (cancelled) return;

                await provider.connect({ serverUrl, token }, {
                    onConnectionStateChanged: (state) => setConnectionState(state),
                    onParticipantConnected: (p) => upsertRemote(p.identity, { participant: p }),
                    onParticipantDisconnected: (identity) => {
                        setRemoteParticipants((prev) => prev.filter((p) => p.participant.identity !== identity));
                    },
                    onTrackSubscribed: (track) => {
                        if (track.kind === 'video') upsertRemote(track.participantIdentity, { videoTrack: track });
                        else if (track.kind === 'audio') upsertRemote(track.participantIdentity, { audioTrack: track });
                        else if (track.kind === 'screen_share') upsertRemote(track.participantIdentity, { screenShareTrack: track });
                        else if (track.kind === 'screen_share_audio') upsertRemote(track.participantIdentity, { screenShareAudioTrack: track });
                    },
                    onTrackUnsubscribed: (identity, kind) => {
                        if (kind === 'video') upsertRemote(identity, { videoTrack: undefined });
                        else if (kind === 'audio') upsertRemote(identity, { audioTrack: undefined });
                        else if (kind === 'screen_share') upsertRemote(identity, { screenShareTrack: undefined });
                        else if (kind === 'screen_share_audio') upsertRemote(identity, { screenShareAudioTrack: undefined });
                    },
                    onLocalTrackPublished: (track) => {
                        if (track.kind === 'video') setLocalVideoTrack(track);
                        else if (track.kind === 'screen_share') setLocalScreenShareTrack(track);
                    },
                    onLocalTrackUnpublished: (kind) => {
                        if (kind === 'video') setLocalVideoTrack(null);
                        else if (kind === 'screen_share') setLocalScreenShareTrack(null);
                    },
                    onActiveSpeakersChanged: (identities) => {
                        const localId = provider.getLocalParticipant()?.identity;
                        setLocalIsSpeaking(!!localId && identities.includes(localId));
                    },
                    onAudioPlaybackChanged: (canPlay) => setAudioPlaybackBlocked(!canPlay),
                    onDisconnected: () => setConnectionState('disconnected'),
                });
                if (cancelled) return;

                // Participants déjà présents à la connexion — arrivent via ce
                // snapshot, pas via onParticipantConnected (réservé aux
                // arrivées ultérieures, voir LOOP 01/14).
                for (const p of provider.getRemoteParticipants()) upsertRemote(p.identity, { participant: p });

                if (canPublish) {
                    try {
                        // Appel audio (Équipe I) : seul le micro part à la
                        // connexion — jamais un flash de caméra non demandé.
                        if (publishVideoOnConnect) await provider.setCameraEnabled(true);
                        await provider.setMicrophoneEnabled(true);
                    } catch (mediaErr) {
                        // Permission caméra/micro refusée ou périphérique absent : le
                        // LIVE reste utilisable (dégradation gracieuse), pas d'échec fatal.
                        console.warn('useLiveTransport: activation caméra/micro impossible', mediaErr);
                    }
                }
            } catch (err) {
                if (!cancelled) setError(err instanceof Error ? err.message : String(err));
            }
        })();

        return () => {
            cancelled = true;
            provider.disconnect();
            providerRef.current = null;
            setLocalVideoTrack(null);
            setLocalScreenShareTrack(null);
            setRemoteParticipants([]);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, roomName, participantName, canPublish, publishVideoOnConnect]);

    const setCameraEnabled = useCallback(async (value: boolean) => {
        await providerRef.current?.setCameraEnabled(value);
    }, []);
    const setMicrophoneEnabled = useCallback(async (value: boolean) => {
        await providerRef.current?.setMicrophoneEnabled(value);
    }, []);
    const startScreenShare = useCallback(async () => {
        await providerRef.current?.startScreenShare();
    }, []);
    const stopScreenShare = useCallback(async () => {
        await providerRef.current?.stopScreenShare();
    }, []);
    const disconnect = useCallback(async () => {
        await providerRef.current?.disconnect();
    }, []);
    const startAudio = useCallback(async () => {
        try {
            await providerRef.current?.startAudio();
            setAudioPlaybackBlocked(!(providerRef.current?.canPlaybackAudio() ?? true));
        } catch {
            // le navigateur a encore refusé — l'état bloqué reste affiché
        }
    }, []);

    return {
        connectionState,
        error,
        localVideoTrack,
        localScreenShareTrack,
        localIsSpeaking,
        remoteParticipants,
        audioPlaybackBlocked,
        startAudio,
        setCameraEnabled,
        setMicrophoneEnabled,
        startScreenShare,
        stopScreenShare,
        disconnect,
    };
}
