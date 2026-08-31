// Pont React entre le port LiveTransportProvider (services/live/) et l'UI du
// LIVE. Remplace la capture caméra/écran purement locale de SocialLive.tsx
// par une vraie publication/abonnement de pistes (LOOP 04/14) — ce hook ne
// connaît que le port, jamais livekit-client directement.

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitTransportProvider } from '../services/live/liveKitTransportProvider';
import type { LiveCameraFacing, LiveConnectionState, LiveParticipantHandle, LiveTrackHandle } from '../services/live/liveTransportTypes';
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
    /**
     * Loop 7 (appels) : face actuelle de la caméra locale — 'user' par
     * défaut, comme la capture livekit-client. Sert à l'UI pour ne PAS
     * miroiter l'aperçu local quand la caméra arrière filme.
     */
    cameraFacing: LiveCameraFacing;
    /**
     * Bascule avant/arrière de la caméra déjà publiée. L'état `cameraFacing`
     * ne change que si le transport a réellement réussi la bascule — un
     * échec (une seule caméra, permission) laisse l'état honnête et rejette.
     */
    switchCamera: () => Promise<void>;
    setMicrophoneEnabled: (enabled: boolean) => Promise<void>;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => Promise<void>;
    disconnect: () => Promise<void>;
    /**
     * Équipe 10 (L4) : relance une tentative complète (récupération de jeton
     * + connexion) après un échec — efface l'erreur affichée et rejoue
     * l'effet de connexion. Sans effet si le transport est désactivé.
     */
    retry: () => void;
}

export function useLiveTransport(options: UseLiveTransportOptions): UseLiveTransportResult {
    const { roomName, participantName, canPublish, enabled, publishVideoOnConnect = true } = options;
    const providerRef = useRef<LiveKitTransportProvider | null>(null);
    // Équipe 10 (L2) : promesse de démontage de la connexion PRÉCÉDENTE.
    // canPublish fait partie des dépendances de l'effet de connexion (voulu :
    // le jeton d'un spectateur est réellement restreint côté serveur —
    // vérifié dans supabase/functions/livekit-token, `canPublish:
    // body.canPublish !== false` — une promotion sur scène EXIGE donc un
    // nouveau jeton, c.-à-d. une reconnexion). Mais l'ancien cleanup lançait
    // disconnect() sans l'attendre : deux connexions à la MÊME identité
    // LiveKit se chevauchaient et le serveur pouvait évincer la mauvaise.
    // Chaque nouvelle tentative attend désormais ce démontage avant de se
    // connecter (sérialisation), et les callbacks d'un provider démonté sont
    // neutralisés (garde `cancelled`) pour ne plus écraser l'état du suivant.
    const teardownRef = useRef<Promise<void>>(Promise.resolve());
    // Équipe 10 (L4) : compteur de tentatives — retry() l'incrémente pour
    // rejouer l'effet de connexion (nouveau jeton compris) après un échec.
    const [connectAttempt, setConnectAttempt] = useState(0);
    const [connectionState, setConnectionState] = useState<LiveConnectionState>('disconnected');
    const [error, setError] = useState<string | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<LiveTrackHandle | null>(null);
    const [localScreenShareTrack, setLocalScreenShareTrack] = useState<LiveTrackHandle | null>(null);
    const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
    const [remoteParticipants, setRemoteParticipants] = useState<RemoteParticipantMedia[]>([]);
    const [audioPlaybackBlocked, setAudioPlaybackBlocked] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<LiveCameraFacing>('user');
    // Miroir de l'état pour que switchCamera garde des deps [] (même patron
    // que speakerMutedRef dans ChatCallModal) : deux bascules rapprochées
    // lisent toujours la face réellement courante.
    const cameraFacingRef = useRef<LiveCameraFacing>('user');

    useEffect(() => {
        if (!enabled || !roomName) return;
        let cancelled = false;
        const provider = new LiveKitTransportProvider();
        providerRef.current = provider;
        const previousTeardown = teardownRef.current;

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
                // Sérialisation (L2) : attendre que la connexion précédente —
                // MÊME identité LiveKit — soit réellement fermée avant d'en
                // ouvrir une nouvelle (consentement média, promotion sur
                // scène, retry) ; sinon les deux se disputent l'identité.
                await previousTeardown;
                if (cancelled) return;
                setError(null); // nouvelle tentative : l'erreur précédente ne la décrit plus.
                const { token, serverUrl } = await fetchLiveKitToken(roomName, participantName, canPublish);
                if (cancelled) return;

                await provider.connect({ serverUrl, token }, {
                    onConnectionStateChanged: (state) => { if (!cancelled) setConnectionState(state); },
                    onParticipantConnected: (p) => { if (!cancelled) upsertRemote(p.identity, { participant: p }); },
                    onParticipantDisconnected: (identity) => {
                        if (cancelled) return;
                        setRemoteParticipants((prev) => prev.filter((p) => p.participant.identity !== identity));
                    },
                    onTrackSubscribed: (track) => {
                        if (cancelled) return;
                        if (track.kind === 'video') upsertRemote(track.participantIdentity, { videoTrack: track });
                        else if (track.kind === 'audio') upsertRemote(track.participantIdentity, { audioTrack: track });
                        else if (track.kind === 'screen_share') upsertRemote(track.participantIdentity, { screenShareTrack: track });
                        else if (track.kind === 'screen_share_audio') upsertRemote(track.participantIdentity, { screenShareAudioTrack: track });
                    },
                    onTrackUnsubscribed: (identity, kind) => {
                        if (cancelled) return;
                        if (kind === 'video') upsertRemote(identity, { videoTrack: undefined });
                        else if (kind === 'audio') upsertRemote(identity, { audioTrack: undefined });
                        else if (kind === 'screen_share') upsertRemote(identity, { screenShareTrack: undefined });
                        else if (kind === 'screen_share_audio') upsertRemote(identity, { screenShareAudioTrack: undefined });
                    },
                    onLocalTrackPublished: (track) => {
                        if (cancelled) return;
                        if (track.kind === 'video') setLocalVideoTrack(track);
                        else if (track.kind === 'screen_share') setLocalScreenShareTrack(track);
                    },
                    onLocalTrackUnpublished: (kind) => {
                        if (cancelled) return;
                        if (kind === 'video') setLocalVideoTrack(null);
                        else if (kind === 'screen_share') setLocalScreenShareTrack(null);
                    },
                    onActiveSpeakersChanged: (identities) => {
                        if (cancelled) return;
                        const localId = provider.getLocalParticipant()?.identity;
                        setLocalIsSpeaking(!!localId && identities.includes(localId));
                    },
                    onAudioPlaybackChanged: (canPlay) => { if (!cancelled) setAudioPlaybackBlocked(!canPlay); },
                    onDisconnected: () => { if (!cancelled) setConnectionState('disconnected'); },
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
            // L2 : le démontage devient la promesse que la PROCHAINE tentative
            // attendra — plus jamais deux connexions simultanées à la même
            // identité. disconnect() est sans danger même si connect() était
            // encore en vol (le provider pose this.room avant d'attendre).
            teardownRef.current = provider.disconnect().catch(() => {});
            providerRef.current = null;
            setLocalVideoTrack(null);
            setLocalScreenShareTrack(null);
            setRemoteParticipants([]);
            // Nouvelle connexion = nouvelle capture, qui repart en face avant.
            cameraFacingRef.current = 'user';
            setCameraFacing('user');
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, roomName, participantName, canPublish, publishVideoOnConnect, connectAttempt]);

    // L4 : relance complète (jeton + connexion) après un échec — utilisée par
    // le bouton « Réessayer » du LIVE. Efface l'erreur pour que l'UI reflète
    // la tentative en cours, pas l'échec passé.
    const retry = useCallback(() => {
        setError(null);
        setConnectAttempt((n) => n + 1);
    }, []);

    const setCameraEnabled = useCallback(async (value: boolean) => {
        await providerRef.current?.setCameraEnabled(value);
    }, []);
    const switchCamera = useCallback(async () => {
        const provider = providerRef.current;
        if (!provider) return;
        const next = nextCameraFacing(cameraFacingRef.current);
        // L'état ne bascule QU'APRÈS le succès réel du transport — un rejet
        // (une seule caméra, capture impossible) laisse l'affichage honnête.
        await provider.setCameraFacing(next);
        cameraFacingRef.current = next;
        setCameraFacing(next);
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
        cameraFacing,
        switchCamera,
        setMicrophoneEnabled,
        startScreenShare,
        stopScreenShare,
        disconnect,
        retry,
    };
}

// ---------------------------------------------------------------------------
// Aides pures de mise en scène (Équipe 10 — loops 8-12). Exportées pour être
// testées unitairement (tests/liveStageResync.test.ts) et consommées par
// SocialLive.tsx. Aucun nouveau système : elles ne font que DÉRIVER
// l'affichage de l'état réel du transport ci-dessus.
// ---------------------------------------------------------------------------

/**
 * Loop 7 (appels) : face suivante de la bascule caméra — un simple
 * aller-retour avant ↔ arrière, jamais un troisième état. Pure et exportée
 * pour être testée (tests/liveStageResync.test.ts).
 */
export function nextCameraFacing(current: LiveCameraFacing): LiveCameraFacing {
    return current === 'user' ? 'environment' : 'user';
}

/**
 * L3 : un participant distant ne mérite une TUILE de scène que s'il publie
 * réellement un média — caméra, partage d'écran, ou au moins un micro
 * (quelqu'un sur scène en audio seul). TOUT le monde se connecte à la room
 * (spectateurs compris, sans rien publier) : une tuile par spectateur muet
 * réduisait le présentateur à 1/N de l'écran. Le son de partage d'écran seul
 * ne fait pas une tuile (il est joué par le puits audio, pas par la scène).
 */
export function hasPresentableMedia(media: Pick<RemoteParticipantMedia, 'videoTrack' | 'audioTrack' | 'screenShareTrack'>): boolean {
    return Boolean(media.videoTrack || media.screenShareTrack || media.audioTrack);
}

/**
 * L3 : classes de grille dérivées du nombre RÉEL de tuiles affichées —
 * 1 → pleine scène ; 2 → deux colonnes (empilées sur mobile, la vidéo garde
 * toute la largeur) ; 3-4 → 2x2 ; au-delà → auto-fit. Tailwind est chargé
 * via le Play CDN (index.html) : ces classes, valeurs arbitraires comprises,
 * sont compilées à l'exécution.
 */
export function stageGridClass(tileCount: number): string {
    if (tileCount <= 1) return 'grid-cols-1 grid-rows-1';
    if (tileCount === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (tileCount <= 4) return 'grid-cols-2';
    return 'grid-cols-2 md:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]';
}

export interface LiveBadgeState {
    label: string;
    className: string;
}

/**
 * L4 : badge d'état du direct dérivé de l'état RÉEL (session réelle +
 * transport) — plus jamais un « LIVE » rouge pulsant codé en dur pendant une
 * panne, une reconnexion ou un simple aperçu de démonstration.
 */
export function liveBadge(hasRealSession: boolean, state: LiveConnectionState, hasError: boolean): LiveBadgeState {
    if (!hasRealSession) return { label: 'APERÇU', className: 'bg-slate-700 text-slate-200' };
    if (hasError) return { label: 'INTERROMPU', className: 'bg-rose-700 text-white' };
    if (state === 'connected') return { label: 'LIVE', className: 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40' };
    if (state === 'reconnecting') return { label: 'RECONNEXION', className: 'bg-amber-500 text-slate-950 animate-pulse' };
    return { label: 'CONNEXION', className: 'bg-amber-500/80 text-slate-950' };
}

/**
 * L4 : compteur de spectateurs honnête — le nombre réel de participants
 * connectés au transport quand il est disponible (moi + distants), sinon le
 * compteur persisté de la ligne live_sessions réelle, sinon RIEN (null,
 * l'UI masque le compteur) : jamais le « 1420 » fictif de démonstration.
 */
export function realViewerCount(args: {
    hasRealSession: boolean;
    connectionState: LiveConnectionState;
    remoteParticipantCount: number;
    dbViewers?: number;
}): number | null {
    if (args.hasRealSession && args.connectionState === 'connected') return args.remoteParticipantCount + 1;
    if (args.hasRealSession && typeof args.dbViewers === 'number' && args.dbViewers >= 0) return args.dbViewers;
    return null;
}

/**
 * L3 : sur mobile, le panneau latéral (chat/Q&A) couvrait en permanence la
 * moitié basse de l'écran — la vidéo doit dominer par défaut. Le panneau
 * démarre replié sous le point de rupture md (768px, celui de `md:h-full`
 * dans SocialLive) ; la languette « rouvrir » et le chat restent à un tap.
 */
export function shouldStartPanelCollapsed(viewportWidth: number, mdBreakpointPx = 768): boolean {
    return viewportWidth < mdBreakpointPx;
}
