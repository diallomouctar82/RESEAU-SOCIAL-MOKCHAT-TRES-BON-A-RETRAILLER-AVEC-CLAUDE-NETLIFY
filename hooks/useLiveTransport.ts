// Pont React entre le port LiveTransportProvider (services/live/) et l'UI du
// LIVE. Remplace la capture caméra/écran purement locale de SocialLive.tsx
// par une vraie publication/abonnement de pistes (LOOP 04/14) — ce hook ne
// connaît que le port, jamais livekit-client directement.

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitTransportProvider } from '../services/live/liveKitTransportProvider';
import type { LiveCameraFacing, LiveConnectionQuality, LiveConnectionState, LiveParticipantHandle, LiveTrackHandle, SendDataOptions } from '../services/live/liveTransportTypes';
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
    /**
     * Mission VF-3 (pré-connexion pendant la sonnerie) : publier le micro
     * dès la connexion (défaut true — comportement historique du LIVE et de
     * l'appelant). false pour l'APPELÉ : il se connecte à la room pendant
     * que ça sonne (jeton + signalisation faits d'avance) mais AUCUN média
     * n'est capté avant le décroché — l'activation passe ensuite par
     * `publishMicrophone()`.
     */
    publishAudioOnConnect?: boolean;
    /** HL-3 : profil audio du transport — 'call' pour un appel à deux (Opus parole, RED, DTX), 'live' (défaut) inchangé. */
    audioProfile?: 'live' | 'call';
    /**
     * HL-4 : messages du canal de données (sous-titres d'appel…). Lu via une
     * ref à chaque paquet — changer le callback ne reconnecte jamais la room.
     */
    onDataReceived?: (payload: Uint8Array, fromIdentity?: string) => void;
}

export interface UseLiveTransportResult {
    connectionState: LiveConnectionState;
    error: string | null;
    /** HL-3 : qualité RÉELLE mesurée par le transport pour MA connexion (jamais estimée). */
    connectionQuality: LiveConnectionQuality;
    /** HL-3 : qualité rapportée pour le correspondant (appel à deux : le premier distant). */
    remoteConnectionQuality: LiveConnectionQuality;
    /** HL-4 : envoi sur le canal de données (publishData) — fiable par défaut. */
    sendData: (payload: Uint8Array, options?: SendDataOptions) => Promise<void>;
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
    /**
     * Mission VF-3 : activation DIFFÉRÉE du micro (+ caméra si `camera`)
     * après une connexion sans publication (appelé qui décroche). Publie
     * immédiatement si la room est connectée ; si une tentative de
     * connexion est encore en vol, elle publiera dès la connexion ; s'il n'y
     * a plus de connexion vivante (jeton refusé pendant la sonnerie,
     * éviction par un autre appareil du même compte…), relance une tentative
     * complète — jeton + connexion — qui publiera ensuite. Un appel n'est
     * donc jamais bloqué par l'échec de sa pré-connexion. Rejette si la
     * capture elle-même échoue (permission refusée), l'erreur étant aussi
     * exposée dans `mediaError`.
     */
    publishMicrophone: (options?: { camera?: boolean }) => Promise<void>;
    /** Dernier échec de capture micro/caméra (permission refusée, périphérique absent) — null quand tout va bien. */
    mediaError: string | null;
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

/** Média local voulu pour une connexion : micro et/ou caméra. */
interface WantedMedia {
    audio: boolean;
    video: boolean;
}

/**
 * Publie le média voulu sur un provider connecté (caméra puis micro — ordre
 * historique du LIVE, conservé). Les erreurs remontent à l'appelant, qui
 * décide (avertissement au LIVE, message dans l'écran d'appel).
 */
async function publishWanted(provider: LiveKitTransportProvider, wanted: WantedMedia): Promise<void> {
    if (wanted.video) await provider.setCameraEnabled(true);
    if (wanted.audio) await provider.setMicrophoneEnabled(true);
}

export function useLiveTransport(options: UseLiveTransportOptions): UseLiveTransportResult {
    const { roomName, participantName, canPublish, enabled, publishVideoOnConnect = true, publishAudioOnConnect = true, audioProfile = 'live' } = options;
    const providerRef = useRef<LiveKitTransportProvider | null>(null);
    // HL-4 : le callback de données est lu via une ref — jamais dans les
    // dépendances de l'effet de connexion (un nouveau handler à chaque rendu
    // ne doit pas déclencher une reconnexion).
    const onDataReceivedRef = useRef(options.onDataReceived);
    onDataReceivedRef.current = options.onDataReceived;
    // VF-3 : les options « publier à la connexion » sont lues via une ref, PAS
    // dans les dépendances de l'effet — chez l'appelé elles ne bougent pas,
    // mais un changement de prop ne doit jamais provoquer une reconnexion
    // (et donc une coupure) en plein appel.
    const publishOnConnectRef = useRef<WantedMedia>({ audio: publishAudioOnConnect, video: publishVideoOnConnect });
    publishOnConnectRef.current = { audio: publishAudioOnConnect, video: publishVideoOnConnect };
    // Média voulu pour la tentative COURANTE (ou la prochaine) : initialisé
    // depuis publish*OnConnect à chaque tentative, puis complété par
    // publishMicrophone() — une demande différée survit à une reconnexion.
    const wantedMediaRef = useRef<WantedMedia | null>(null);
    // État réel de la tentative en cours, lu par publishMicrophone pour
    // choisir entre publier maintenant, attendre la connexion, ou relancer.
    const attemptRef = useRef<{ inFlight: boolean; connected: boolean }>({ inFlight: false, connected: false });
    const [mediaError, setMediaError] = useState<string | null>(null);
    const [connectionQuality, setConnectionQuality] = useState<LiveConnectionQuality>('unknown');
    const [remoteConnectionQuality, setRemoteConnectionQuality] = useState<LiveConnectionQuality>('unknown');
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
        attemptRef.current = { inFlight: true, connected: false };
        // Ce que cette tentative publiera une fois connectée : les options
        // « à la connexion », plus tout ce qu'une activation différée a déjà
        // demandé (appelé qui a décroché pendant que la connexion échouait).
        const deferred = wantedMediaRef.current;
        wantedMediaRef.current = {
            audio: publishOnConnectRef.current.audio || !!deferred?.audio,
            video: publishOnConnectRef.current.video || !!deferred?.video,
        };

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

                await provider.connect({ serverUrl, token, audioProfile }, {
                    onConnectionStateChanged: (state) => {
                        if (cancelled) return;
                        // Miroir synchrone pour publishMicrophone : après une
                        // éviction (même identité sur un autre appareil) ou une
                        // perte, la room n'est plus « connectée ».
                        if (state === 'connected') attemptRef.current.connected = true;
                        else if (state === 'disconnected' || state === 'failed') attemptRef.current.connected = false;
                        setConnectionState(state);
                    },
                    onDataReceived: (payload, from) => { if (!cancelled) onDataReceivedRef.current?.(payload, from); },
                    onConnectionQualityChanged: (identity, quality) => {
                        if (cancelled) return;
                        const localId = provider.getLocalParticipant()?.identity;
                        if (identity === localId) setConnectionQuality(quality);
                        else setRemoteConnectionQuality(quality);
                    },
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
                    onDisconnected: () => {
                        if (cancelled) return;
                        attemptRef.current.connected = false;
                        setConnectionState('disconnected');
                    },
                });
                if (cancelled) return;
                attemptRef.current = { inFlight: false, connected: true };

                // Participants déjà présents à la connexion — arrivent via ce
                // snapshot, pas via onParticipantConnected (réservé aux
                // arrivées ultérieures, voir LOOP 01/14).
                for (const p of provider.getRemoteParticipants()) upsertRemote(p.identity, { participant: p });

                // VF-3 : ce qui est publié ici est ce que cette tentative VEUT —
                // options « à la connexion » (appelant, LIVE) et/ou activation
                // différée déjà demandée (appelé qui a décroché entre-temps).
                // Appel audio (Équipe I) : seul le micro part — jamais un flash
                // de caméra non demandé ; appelé pendant la sonnerie : rien.
                const wanted = wantedMediaRef.current;
                if (canPublish && wanted && (wanted.audio || wanted.video)) {
                    try {
                        await publishWanted(provider, wanted);
                        if (!cancelled) setMediaError(null);
                    } catch (mediaErr) {
                        // Permission caméra/micro refusée ou périphérique absent : le
                        // LIVE reste utilisable (dégradation gracieuse), pas d'échec fatal.
                        console.warn('useLiveTransport: activation caméra/micro impossible', mediaErr);
                        if (!cancelled) setMediaError(mediaErr instanceof Error ? mediaErr.message : String(mediaErr));
                    }
                }
            } catch (err) {
                if (!cancelled) {
                    attemptRef.current = { inFlight: false, connected: false };
                    setError(err instanceof Error ? err.message : String(err));
                }
            }
        })();

        return () => {
            cancelled = true;
            attemptRef.current = { inFlight: false, connected: false };
            // L2 : le démontage devient la promesse que la PROCHAINE tentative
            // attendra — plus jamais deux connexions simultanées à la même
            // identité. disconnect() est sans danger même si connect() était
            // encore en vol (le provider pose this.room avant d'attendre).
            teardownRef.current = provider.disconnect().catch(() => {});
            providerRef.current = null;
            setLocalVideoTrack(null);
            setLocalScreenShareTrack(null);
            setRemoteParticipants([]);
            setConnectionQuality('unknown');
            setRemoteConnectionQuality('unknown');
            // Nouvelle connexion = nouvelle capture, qui repart en face avant.
            cameraFacingRef.current = 'user';
            setCameraFacing('user');
        };
        // publishVideoOnConnect / publishAudioOnConnect : lus via publishOnConnectRef, volontairement hors dépendances (VF-3).
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [enabled, roomName, participantName, canPublish, audioProfile, connectAttempt]);

    const sendData = useCallback(async (payload: Uint8Array, sendOptions?: SendDataOptions) => {
        await providerRef.current?.sendData(payload, sendOptions);
    }, []);

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
    // VF-3 : activation différée (voir UseLiveTransportResult.publishMicrophone).
    const publishMicrophone = useCallback(async (publishOptions?: { camera?: boolean }) => {
        const wanted: WantedMedia = { audio: true, video: !!publishOptions?.camera || !!wantedMediaRef.current?.video };
        wantedMediaRef.current = wanted;
        const provider = providerRef.current;
        const attempt = attemptRef.current;
        if (provider && attempt.connected) {
            try {
                await publishWanted(provider, wanted);
                setMediaError(null);
            } catch (mediaErr) {
                setMediaError(mediaErr instanceof Error ? mediaErr.message : String(mediaErr));
                throw mediaErr;
            }
            return;
        }
        // Tentative encore en vol : elle publiera `wanted` dès la connexion.
        if (attempt.inFlight) return;
        // Plus de connexion vivante (pré-connexion en échec, éviction) : on
        // repart — jeton + connexion — et la nouvelle tentative publiera.
        setError(null);
        setConnectAttempt((n) => n + 1);
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
        connectionQuality,
        remoteConnectionQuality,
        sendData,
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
        publishMicrophone,
        mediaError,
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
