// Pont React entre le port LiveTransportProvider (services/live/) et l'UI du
// LIVE. Remplace la capture caméra/écran purement locale de SocialLive.tsx
// par une vraie publication/abonnement de pistes (LOOP 04/14) — ce hook ne
// connaît que le port, jamais livekit-client directement.

import { useCallback, useEffect, useRef, useState } from 'react';
import { LiveKitTransportProvider } from '../services/live/liveKitTransportProvider';
import type { LiveAudioStats, LiveCameraFacing, LiveConnectionQuality, LiveConnectionState, LiveParticipantHandle, LiveTrackHandle, LiveTransportDiagnostics, SendDataOptions } from '../services/live/liveTransportTypes';
import { INTERPRETER_TRACK_NAME, describeDisconnectReason, isDuplicateIdentityReason, isInterpreterTrackName } from '../services/live/liveTransportTypes';
import { fetchLiveKitToken } from '../services/live/liveKitToken';
import { LiveAccessError, type LiveAccessRefusal } from '../services/live/liveAccessError';
import { recordCallEvent } from '../services/calls/callDiagnostics';

export interface RemoteParticipantMedia {
    participant: LiveParticipantHandle;
    videoTrack?: LiveTrackHandle;
    audioTrack?: LiveTrackHandle;
    screenShareTrack?: LiveTrackHandle;
    /** Équipe F3 : le SON d'un partage d'écran (onglet avec vidéo, extrait…) — souscrit par LiveKit mais jeté avant ce champ. */
    screenShareAudioTrack?: LiveTrackHandle;
    /**
     * Mission VT : la VOIX DE L'INTERPRÈTE rendue par le correspondant dans
     * MA langue, reçue comme piste audio de l'appel (jamais un fichier lu
     * localement — c'est ce qui restait muet sur les vrais téléphones).
     * Distincte de `audioTrack` (sa voix originale), que l'écran coupe
     * pendant l'interprétation.
     */
    interpreterAudioTrack?: LiveTrackHandle;
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
     * Mission AU : identifiant de CET appareil (services/calls/callDevice.ts),
     * transmis au serveur de jetons — dans une room d'appel, chaque appareil
     * reçoit sa propre identité LiveKit, deux appareils du même compte ne
     * s'évincent plus pendant la sonnerie. Sans effet pour une room de LIVE.
     */
    deviceId?: string;
    /**
     * AU-12 : conversation de l'appel — le nom de room contient désormais
     * l'identifiant de l'APPEL (une room par appel), le serveur de jetons ne
     * peut donc plus déduire la conversation du nom seul. Sans effet pour le LIVE.
     */
    conversationId?: string;
    /**
     * SAT-5 (LIVE seulement) : garde de la RELANCE AUTOMATIQUE. Quand la ligne
     * d'un direct tombe sans qu'on l'ait demandé, le hook demande à l'écran
     * « ce direct est-il encore ouvert ? » (lecture en base) AVANT chaque
     * nouvelle tentative — une room fermée par l'animateur n'est jamais
     * rejointe en boucle, c'est la raison pour laquelle le LIVE n'avait aucune
     * relance jusqu'ici. Sans cette option, comportement historique : bouton
     * « Réessayer » seulement. Un refus NOMMÉ du serveur (« complet ») ne
     * relance jamais, quel que soit le retour de cette garde. Si la garde
     * lève (base injoignable), on retente : le budget de 3 borne le doute.
     * Ignorée pour un appel (profil `call`), qui a sa propre règle.
     */
    autoRecover?: () => Promise<boolean>;
    /**
     * HL-4 : messages du canal de données (sous-titres d'appel…). Lu via une
     * ref à chaque paquet — changer le callback ne reconnecte jamais la room.
     */
    onDataReceived?: (payload: Uint8Array, fromIdentity?: string) => void;
}

export interface UseLiveTransportResult {
    connectionState: LiveConnectionState;
    error: string | null;
    /**
     * SAT-3 : refus NOMMÉ du serveur de jetons — `live_full` avec les chiffres
     * réels quand le direct est plein, `transport_unconfigured` quand aucun
     * transport n'est configuré. `null` quand l'échec n'en est pas un (panne
     * réseau, 500) : l'écran doit alors garder son message d'interruption.
     *
     * Sans ce champ, tous les échecs se ressemblaient (`error` est une simple
     * chaîne) et un direct complet s'affichait comme une « Connexion… » sans
     * fin — la personne attendait une place qui ne viendrait jamais.
     */
    refusal: LiveAccessRefusal | null;
    /** HL-3 : qualité RÉELLE mesurée par le transport pour MA connexion (jamais estimée). */
    connectionQuality: LiveConnectionQuality;
    /** HL-3 : qualité rapportée pour le correspondant (appel à deux : le premier distant). */
    remoteConnectionQuality: LiveConnectionQuality;
    /** HL-4 : envoi sur le canal de données (publishData) — fiable par défaut. */
    sendData: (payload: Uint8Array, options?: SendDataOptions) => Promise<void>;
    localVideoTrack: LiveTrackHandle | null;
    localScreenShareTrack: LiveTrackHandle | null;
    localIsSpeaking: boolean;
    /** Mission VT : identités qui PARLENT en ce moment (détection de parole du serveur, toutes langues) — « X parle… » à l'écran d'appel même quand sa voix originale est coupée. */
    activeSpeakerIds: string[];
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
    /**
     * Mission AU : ma piste MICRO est réellement publiée sur la room (événement
     * du transport, jamais déduit d'une intention). false avant publication,
     * après une dépublication, et hors connexion.
     */
    localAudioPublished: boolean;
    /**
     * AU-13 : la ligne s'est-elle rétablie en BOUCLE pendant cet appel ?
     * Compte les reconnexions complètes du SDK depuis le début de la
     * tentative courante. Au-delà de deux, ce n'est plus un incident réseau
     * ponctuel : c'est une ligne qui ne tient pas, et l'écran doit le dire au
     * lieu de laisser croire à un problème de micro (le rapport de
     * diagnostic AU-7 a montré exactement ce motif sur deux vrais appareils :
     * une reconnexion toutes les ~16 s, chacune coupant le son des deux côtés).
     */
    reconnectCount: number;
    /** Mission AU : compteurs audio réels (envoi / réception / lecture) — référence stable (deps []). */
    getAudioStats: () => Promise<LiveAudioStats>;
    /** AU-7 : chemin réseau négocié + inventaire des pistes, pour le rapport de diagnostic — référence stable (deps []). */
    getTransportDiagnostics: () => Promise<LiveTransportDiagnostics>;
    startScreenShare: () => Promise<void>;
    stopScreenShare: () => Promise<void>;
    disconnect: () => Promise<void>;
    /**
     * Équipe 10 (L4) : relance une tentative complète (récupération de jeton
     * + connexion) après un échec — efface l'erreur affichée et rejoue
     * l'effet de connexion. Sans effet si le transport est désactivé.
     */
    retry: () => void;
    /**
     * VF-4 : piste micro locale réellement publiée (null avant publication ou
     * hors connexion) — lue à la demande par l'interprète d'appel pour la
     * transcription serveur. Référence stable (deps []).
     */
    getLocalAudioTrack: () => MediaStreamTrack | null;
    /**
     * Mission VT : publie la piste audio de l'INTERPRÈTE (voix rendue
     * localement dans la langue du correspondant) sur la room — rejette si la
     * ligne n'est pas connectée, l'appelant décide alors du repli (message
     * « voix indisponible » au correspondant). Référence stable (deps []).
     */
    publishInterpreterAudio: (track: MediaStreamTrack) => Promise<void>;
    unpublishInterpreterAudio: () => Promise<void>;
}

/** Média local voulu pour une connexion : micro et/ou caméra. */
interface WantedMedia {
    audio: boolean;
    video: boolean;
}

/** Résultat d'une publication : chaque média est jugé séparément. */
interface PublishOutcome {
    audioError: string | null;
    videoError: string | null;
}

const errorText = (err: unknown): string => (err instanceof Error ? (err.name && err.name !== 'Error' ? `${err.name}: ${err.message}` : err.message) : String(err));

/**
 * Publie le média voulu sur un provider connecté. Mission AU : le MICRO
 * d'abord, et chaque média est isolé — une caméra en échec (permission
 * refusée, périphérique absent, appel vidéo depuis un poste sans webcam) ne
 * doit plus jamais empêcher la voix de partir : c'était une cause d'audio à
 * sens unique en appel vidéo. Les erreurs sont RETOURNÉES, pas levées :
 * l'appelant décide (le micro compte plus que la caméra).
 */
async function publishWanted(provider: LiveKitTransportProvider, wanted: WantedMedia): Promise<PublishOutcome> {
    const outcome: PublishOutcome = { audioError: null, videoError: null };
    if (wanted.audio) {
        try { await provider.setMicrophoneEnabled(true); } catch (err) { outcome.audioError = errorText(err); }
    }
    if (wanted.video) {
        try { await provider.setCameraEnabled(true); } catch (err) { outcome.videoError = errorText(err); }
    }
    return outcome;
}

/**
 * Tentatives automatiques (jeton + connexion) quand la ligne tombe — puis
 * « Réessayer » à la main. Mission AU pour un appel qui VEUT du média ;
 * SAT-5 pour un direct dont l'écran confirme qu'il est encore ouvert. Même
 * budget, même délai croissant : 700 ms, 1,4 s, 2,8 s.
 */
const AUTO_RETRY_MAX = 3;
const autoRetryDelayMs = (attempt: number): number => Math.min(4000, 700 * 2 ** attempt);
/** SAT-5 : ce que l'écran affiche quand la garde répond que le direct n'est plus ouvert. */
export const LIVE_ENDED_MESSAGE = 'Ce direct est terminé.';

export function useLiveTransport(options: UseLiveTransportOptions): UseLiveTransportResult {
    const { roomName, participantName, canPublish, enabled, publishVideoOnConnect = true, publishAudioOnConnect = true, audioProfile = 'live', deviceId, conversationId, autoRecover } = options;
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
    // AU-7 : publication demandée PENDANT que le SDK rétablit lui-même la
    // ligne (« reconnecting ») — sur un iPhone réel, publier à cet instant
    // levait « pcManager is not ready » et le micro ne partait jamais. La
    // demande attend le retour à « connected » et s'exécute alors.
    const pendingPublishRef = useRef(false);
    const [mediaError, setMediaError] = useState<string | null>(null);
    // Mission AU : état RÉEL de publication du micro (événements du transport).
    const [localAudioPublished, setLocalAudioPublished] = useState(false);
    // Mission AU : ce que l'utilisateur VEUT pour son micro (true = ouvert).
    // Lu après chaque publication : un « couper le micro » demandé avant la
    // publication (pendant la connexion) est appliqué dès qu'elle aboutit —
    // avant, il était perdu et le correspondant entendait un micro réputé coupé.
    const micWishRef = useRef(true);
    // Revue AU-6 (défaut majeur) : même miroir pour la CAMÉRA — « couper la
    // caméra » ne fait qu'une mise en sourdine côté SDK, et la relance
    // automatique / « Réessayer le micro » la RALLUMAIENT à l'insu de
    // l'utilisateur (aperçu local « Caméra coupée », correspondant qui voit
    // l'image). Une caméra coupée n'est plus jamais republiée par le hook ;
    // seule une action explicite (setCameraEnabled(true)) la relance.
    // Réservé aux appels : le LIVE garde son comportement historique.
    const camWishRef = useRef(true);
    const isCallRef = useRef(audioProfile === 'call');
    isCallRef.current = audioProfile === 'call';
    // SAT-5 : garde de relance du LIVE, lue au moment de la chute de ligne —
    // changer le callback ne reconnecte jamais la room (même patron que
    // onDataReceived). `recoverCheckRef` : une seule lecture en base à la
    // fois, jamais deux relances armées par deux chutes rapprochées.
    const autoRecoverRef = useRef(autoRecover);
    autoRecoverRef.current = autoRecover;
    const recoverCheckRef = useRef(false);
    // Mission AU : relances automatiques d'un APPEL dont la ligne tombe alors
    // qu'il veut du média (pré-connexion en échec, déconnexion inattendue).
    const autoRetryRef = useRef(0);
    const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    // Republication après fin de piste : bornée par connexion (jamais une boucle).
    const audioRepublishRef = useRef(0);
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
    // AU-13 : nombre de rétablissements complets de la ligne pendant cette
    // tentative — mesuré sur les transitions réelles du transport, jamais estimé.
    const [reconnectCount, setReconnectCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    // SAT-3 : le refus NOMMÉ du serveur, à côté du message d'erreur. Distinct
    // de `error` à dessein — « le direct est complet » et « la ligne a lâché »
    // n'appellent pas le même écran, et rien ne permettait de les distinguer.
    const [refusal, setRefusal] = useState<LiveAccessRefusal | null>(null);
    const [localVideoTrack, setLocalVideoTrack] = useState<LiveTrackHandle | null>(null);
    const [localScreenShareTrack, setLocalScreenShareTrack] = useState<LiveTrackHandle | null>(null);
    const [localIsSpeaking, setLocalIsSpeaking] = useState(false);
    // Mission VT : identités qui PARLENT en ce moment (serveur, toutes
    // langues) — l'écran d'appel montre que le correspondant parle même quand
    // sa voix originale est coupée au profit de l'interprète.
    const [activeSpeakerIds, setActiveSpeakerIds] = useState<string[]>([]);
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
        audioRepublishRef.current = 0;
        setReconnectCount(0);
        const isCall = audioProfile === 'call';
        // Mission AU : la ligne d'un appel tombe alors qu'il veut du média →
        // relance automatique (jeton + connexion), avec délai croissant et
        // plafond ; au-delà, l'erreur reste affichée et « Réessayer » existe.
        // SAT-5 : le LIVE relance aussi, mais seulement si l'écran fournit une
        // garde `autoRecover` ET qu'elle confirme, en base, que le direct est
        // encore ouvert — une room fermée par l'animateur n'est jamais
        // rejointe en boucle. Sans garde : bouton explicite, comme avant.
        const armRetry = (attempt: number) => {
            if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
            retryTimerRef.current = setTimeout(() => {
                retryTimerRef.current = null;
                if (cancelled) return;
                setConnectAttempt((k) => k + 1);
            }, autoRetryDelayMs(attempt));
        };
        const scheduleAutoRetry = (reason: string, opts?: { refused?: boolean }): boolean => {
            if (cancelled) return false;
            // SAT-3 : un refus NOMMÉ du serveur (direct complet, transport non
            // configuré) n'est pas une panne — relancer reviendrait à marteler
            // une porte fermée, et à chaque coup consommer une place de lecture.
            if (opts?.refused) return false;
            if (isCall) {
                const wanted = wantedMediaRef.current;
                if (!wanted || !(wanted.audio || wanted.video)) return false;
            } else if (!autoRecoverRef.current) {
                return false;
            }
            if (autoRetryRef.current >= AUTO_RETRY_MAX) return false;
            if (isCall) {
                const n = autoRetryRef.current++;
                console.warn(`[appel] média ligne perdue (${reason}) — nouvelle tentative ${n + 1}/${AUTO_RETRY_MAX} dans ${autoRetryDelayMs(n)} ms`);
                recordCallEvent('transport', `ligne perdue (${reason}) — relance ${n + 1}/${AUTO_RETRY_MAX} dans ${autoRetryDelayMs(n)} ms`);
                armRetry(n);
                return true;
            }
            // LIVE : la garde d'abord, la relance ensuite. Une lecture en base à
            // la fois ; le compteur n'est consommé que si l'on relance vraiment.
            if (recoverCheckRef.current) return false;
            recoverCheckRef.current = true;
            const guard = autoRecoverRef.current;
            void (async () => {
                let stillOpen = true;
                try {
                    stillOpen = await guard();
                } catch {
                    // Base injoignable : le doute ne vaut pas un abandon — la
                    // tentative suivante tranchera, et le budget la borne.
                    stillOpen = true;
                }
                recoverCheckRef.current = false;
                if (cancelled) return;
                if (!stillOpen) {
                    console.warn(`[direct] ligne perdue (${reason}) — le direct n'est plus ouvert, aucune relance`);
                    setError(LIVE_ENDED_MESSAGE);
                    return;
                }
                // Le budget a été vérifié AVANT la garde et une seule garde vole
                // à la fois : le revérifier ici serait une ligne que rien ne
                // peut faire rougir (contre-épreuve CE3), donc pas de ligne.
                const n = autoRetryRef.current++;
                console.warn(`[direct] ligne perdue (${reason}) — nouvelle tentative ${n + 1}/${AUTO_RETRY_MAX} dans ${autoRetryDelayMs(n)} ms`);
                armRetry(n);
            })();
            return true;
        };
        // Mission AU : appliquer le média voulu et le souhait de micro courant ;
        // rapporte chaque échec séparément (le micro d'abord).
        const applyWanted = async (wanted: WantedMedia): Promise<PublishOutcome> => {
            const outcome = await publishWanted(provider, wanted);
            if (wanted.audio && !outcome.audioError && !micWishRef.current) {
                try { await provider.setMicrophoneEnabled(false); } catch { /* le micro reste ouvert : l'UI reflète l'état réel via localAudioPublished */ }
            }
            return outcome;
        };
        // Ce que cette tentative publiera une fois connectée : les options
        // « à la connexion », plus tout ce qu'une activation différée a déjà
        // demandé (appelé qui a décroché pendant que la connexion échouait).
        const deferred = wantedMediaRef.current;
        wantedMediaRef.current = {
            audio: publishOnConnectRef.current.audio || !!deferred?.audio,
            // Appel : une caméra que l'utilisateur a coupée reste coupée après
            // une relance (revue AU-6) — jamais republiée à son insu.
            video: (publishOnConnectRef.current.video || !!deferred?.video) && (!isCallRef.current || camWishRef.current),
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
                setRefusal(null); // idem pour le refus : une place a pu se libérer entre-temps.
                const { token, serverUrl } = await fetchLiveKitToken(roomName, participantName, canPublish, deviceId, conversationId);
                if (cancelled) return;

                await provider.connect({ serverUrl, token, audioProfile }, {
                    onConnectionStateChanged: (state) => {
                        if (cancelled) return;
                        // Miroir synchrone pour publishMicrophone : après une
                        // éviction (même identité sur un autre appareil) ou une
                        // perte, la room n'est plus « connectée ». AU-7 : une
                        // ligne EN RECONNEXION ne l'est pas non plus — publier
                        // à cet instant échouait (« pcManager is not ready »).
                        const wasConnected = attemptRef.current.connected;
                        if (state === 'connected') attemptRef.current.connected = true;
                        else if (state === 'disconnected' || state === 'failed' || state === 'reconnecting') attemptRef.current.connected = false;
                        // AU-13 : une ligne ÉTABLIE qui repart en reconnexion est
                        // un rétablissement réel — c'est ce qui coupe le son. On
                        // les compte pour pouvoir le dire honnêtement à l'écran.
                        if (state === 'reconnecting' && wasConnected) setReconnectCount((n) => n + 1);
                        setConnectionState(state);
                        // AU-7 : la ligne est revenue et une publication attendait —
                        // elle part maintenant (micro d'abord, caméra isolée).
                        if (state === 'connected' && !wasConnected && pendingPublishRef.current && !attemptRef.current.inFlight) {
                            pendingPublishRef.current = false;
                            const wanted = wantedMediaRef.current;
                            if (wanted && (wanted.audio || wanted.video)) {
                                recordCallEvent('media', 'ligne rétablie — publication différée exécutée', wanted);
                                void applyWanted(wanted).then((outcome) => {
                                    if (cancelled) return;
                                    setMediaError(outcome.audioError ?? outcome.videoError);
                                });
                            }
                        }
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
                        // Mission VT : la piste nommée « interpreter[:compte] » est la voix de l'interprète, jamais le micro.
                        else if (track.kind === 'audio' && isInterpreterTrackName(track.name)) upsertRemote(track.participantIdentity, { interpreterAudioTrack: track });
                        else if (track.kind === 'audio') upsertRemote(track.participantIdentity, { audioTrack: track });
                        else if (track.kind === 'screen_share') upsertRemote(track.participantIdentity, { screenShareTrack: track });
                        else if (track.kind === 'screen_share_audio') upsertRemote(track.participantIdentity, { screenShareAudioTrack: track });
                    },
                    onTrackUnsubscribed: (identity, kind, name) => {
                        if (cancelled) return;
                        if (kind === 'video') upsertRemote(identity, { videoTrack: undefined });
                        else if (kind === 'audio' && isInterpreterTrackName(name)) upsertRemote(identity, { interpreterAudioTrack: undefined });
                        else if (kind === 'audio') upsertRemote(identity, { audioTrack: undefined });
                        else if (kind === 'screen_share') upsertRemote(identity, { screenShareTrack: undefined });
                        else if (kind === 'screen_share_audio') upsertRemote(identity, { screenShareAudioTrack: undefined });
                    },
                    onLocalTrackPublished: (track) => {
                        if (cancelled) return;
                        if (track.kind === 'video') setLocalVideoTrack(track);
                        else if (track.kind === 'screen_share') setLocalScreenShareTrack(track);
                        else if (track.kind === 'audio') setLocalAudioPublished(true);
                    },
                    onLocalTrackUnpublished: (kind) => {
                        if (cancelled) return;
                        if (kind === 'video') setLocalVideoTrack(null);
                        else if (kind === 'screen_share') setLocalScreenShareTrack(null);
                        else if (kind === 'audio') setLocalAudioPublished(false);
                    },
                    // Mission AU : ma capture micro s'est terminée (périphérique
                    // débranché, interruption système) — republication bornée,
                    // seulement si le micro est voulu ouvert ; coupé, c'est la
                    // réactivation qui relancera la capture. Revue AU-6 :
                    // réservé aux APPELS — pour le LIVE, le SDK relance déjà
                    // seul la capture (LocalParticipant.handleTrackEnded), et
                    // doubler son travail par un mute/unmute diffusait un
                    // « micro coupé » à tous les spectateurs.
                    onLocalTrackEnded: (kind) => {
                        if (cancelled || !isCall || kind !== 'audio') return;
                        if (!wantedMediaRef.current?.audio || !attemptRef.current.connected) return;
                        if (audioRepublishRef.current >= 2) {
                            setMediaError('Le micro a été coupé par le système et n’a pas pu être relancé. Réessayez le micro.');
                            return;
                        }
                        audioRepublishRef.current += 1;
                        console.warn('[appel] média piste micro terminée — republication');
                        (async () => {
                            try {
                                await provider.setMicrophoneEnabled(false);
                                if (cancelled || !micWishRef.current) return;
                                await provider.setMicrophoneEnabled(true);
                                if (!cancelled) setMediaError(null);
                            } catch (err) {
                                if (!cancelled) setMediaError(errorText(err));
                            }
                        })();
                    },
                    onMediaDevicesError: (message, kind) => {
                        if (cancelled || kind === 'video') return;
                        setMediaError((prev) => prev ?? message);
                    },
                    onActiveSpeakersChanged: (identities) => {
                        if (cancelled) return;
                        const localId = provider.getLocalParticipant()?.identity;
                        setLocalIsSpeaking(!!localId && identities.includes(localId));
                        setActiveSpeakerIds(identities);
                    },
                    onAudioPlaybackChanged: (canPlay) => { if (!cancelled) setAudioPlaybackBlocked(!canPlay); },
                    onDisconnected: (reason) => {
                        if (cancelled) return;
                        attemptRef.current.connected = false;
                        setLocalAudioPublished(false);
                        setConnectionState('disconnected');
                        // Revue AU-6 : un échec de Room.connect émet Disconnected
                        // PUIS rejette — la relance de cet échec appartient au
                        // `catch` de la tentative, sinon il était compté deux fois
                        // (2 relances réelles au lieu de 3).
                        if (attemptRef.current.inFlight) return;
                        // Mission LT : ÉVINCÉ par une autre session portant la même
                        // identité (raison 2). Relancer ici évincerait l'autre à son
                        // tour — la boucle mesurée sur un iPhone réel (22 s pour se
                        // connecter). L'identité est désormais propre à l'onglet
                        // (callDevice.ts) ; si cela arrive quand même, on le dit et
                        // on laisse la main : « Réessayer » reste possible.
                        if (isDuplicateIdentityReason(reason)) {
                            recordCallEvent('transport', 'évincé : une autre session porte la même identité — aucune relance automatique', { reason });
                            console.warn('[appel] média ligne reprise par une autre session de cet appel (identité dupliquée) — aucune relance automatique');
                            setError('Connexion remplacée par une autre session de cet appel (identité dupliquée).');
                            return;
                        }
                        // Mission AU : déconnexion INATTENDUE d'un appel établi (pas
                        // un démontage — `cancelled` l'aurait neutralisée) → relance.
                        scheduleAutoRetry(`déconnexion${reason ? ` ${reason} (${describeDisconnectReason(reason)})` : ''}`);
                    },
                });
                if (cancelled) return;
                attemptRef.current = { inFlight: false, connected: true };
                autoRetryRef.current = 0;
                pendingPublishRef.current = false; // cette tentative publie `wanted` ci-dessous : rien n'attend plus.

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
                    // Permission caméra/micro refusée ou périphérique absent : le
                    // LIVE reste utilisable (dégradation gracieuse), pas d'échec
                    // fatal. Mission AU : le micro est jugé à part — une caméra
                    // en échec ne cache plus un micro qui, lui, est parti.
                    const outcome = await applyWanted(wanted);
                    if (cancelled) return;
                    const firstError = outcome.audioError ?? outcome.videoError;
                    if (firstError) console.warn('useLiveTransport: activation caméra/micro impossible', outcome);
                    setMediaError(firstError);
                }
            } catch (err) {
                if (!cancelled) {
                    attemptRef.current = { inFlight: false, connected: false };
                    recordCallEvent('error', 'connexion en échec', err);
                    setError(err instanceof Error ? err.message : String(err));
                    // SAT-3 : le serveur a nommé sa raison → l'écran peut la dire.
                    // Sinon `null` : on ne transforme jamais une panne en « complet ».
                    setRefusal(err instanceof LiveAccessError ? err.refusal : null);
                    // Mission AU : la pré-connexion d'un appel a échoué alors
                    // qu'une activation différée (décroché) l'attend, ou l'appelant
                    // n'a pas pu se connecter — on repart seul, jeton compris.
                    scheduleAutoRetry('connexion en échec', { refused: err instanceof LiveAccessError });
                }
            }
        })();

        return () => {
            cancelled = true;
            attemptRef.current = { inFlight: false, connected: false };
            pendingPublishRef.current = false;
            if (retryTimerRef.current) { clearTimeout(retryTimerRef.current); retryTimerRef.current = null; }
            setLocalAudioPublished(false);
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
    }, [enabled, roomName, participantName, canPublish, audioProfile, deviceId, conversationId, connectAttempt]);

    // Le transport se (ré)active : le compteur de relances automatiques repart
    // de zéro (un nouvel appel n'hérite pas des échecs du précédent).
    useEffect(() => { autoRetryRef.current = 0; }, [enabled, roomName]);

    const sendData = useCallback(async (payload: Uint8Array, sendOptions?: SendDataOptions) => {
        await providerRef.current?.sendData(payload, sendOptions);
    }, []);

    // L4 : relance complète (jeton + connexion) après un échec — utilisée par
    // le bouton « Réessayer » du LIVE. Efface l'erreur pour que l'UI reflète
    // la tentative en cours, pas l'échec passé.
    const retry = useCallback(() => {
        setError(null);
        setRefusal(null);
        setConnectAttempt((n) => n + 1);
    }, []);

    const setCameraEnabled = useCallback(async (value: boolean) => {
        // Revue AU-6 : le souhait est mémorisé AVANT l'appel au transport —
        // une caméra coupée ne sera plus republiée par une relance.
        camWishRef.current = value;
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
        // Mission AU : le souhait est mémorisé AVANT l'appel au transport — s'il
        // n'y a pas encore de piste (connexion en cours), il sera appliqué à
        // la publication ; s'il y en a une, l'appel ci-dessous l'applique.
        micWishRef.current = value;
        await providerRef.current?.setMicrophoneEnabled(value);
    }, []);
    // VF-3 : activation différée (voir UseLiveTransportResult.publishMicrophone).
    const publishMicrophone = useCallback(async (publishOptions?: { camera?: boolean }) => {
        // Revue AU-6 : `camera: false` explicite (« Réessayer le micro » avec la
        // caméra coupée) ne rallume JAMAIS la caméra ; et une caméra coupée par
        // l'utilisateur pendant l'appel reste coupée quoi qu'ait voulu la
        // connexion initiale.
        const cameraWanted = publishOptions?.camera === false
            ? false
            : (!!publishOptions?.camera || !!wantedMediaRef.current?.video) && (!isCallRef.current || camWishRef.current);
        const wanted: WantedMedia = { audio: true, video: cameraWanted };
        wantedMediaRef.current = wanted;
        const provider = providerRef.current;
        const attempt = attemptRef.current;
        if (provider && attempt.connected) {
            // Mission AU : micro d'abord, caméra isolée ; le souhait « micro
            // coupé » posé pendant la sonnerie est appliqué après publication.
            const outcome = await publishWanted(provider, wanted);
            if (wanted.audio && !outcome.audioError && !micWishRef.current) {
                try { await provider.setMicrophoneEnabled(false); } catch { /* état réel reflété par localAudioPublished */ }
            }
            const firstError = outcome.audioError ?? outcome.videoError;
            setMediaError(firstError);
            // Seul un micro absent est un échec pour l'appelant : la caméra en
            // échec est signalée (mediaError) mais la voix, elle, passe.
            if (outcome.audioError) throw new Error(outcome.audioError);
            return;
        }
        // Tentative encore en vol : elle publiera `wanted` dès la connexion.
        if (attempt.inFlight) return;
        // AU-7 : le SDK rétablit lui-même la ligne (« reconnecting ») — on ne
        // relance PAS une connexion par-dessus (elle démonterait la sienne) et
        // on ne publie pas dans le vide : la demande part au retour à
        // « connected » (voir onConnectionStateChanged). L'écran affiche
        // « Reconnexion… » pendant ce temps, jamais une erreur brute.
        if (provider && provider.getConnectionState() === 'reconnecting') {
            pendingPublishRef.current = true;
            recordCallEvent('media', 'publication différée : ligne en reconnexion', wanted);
            setMediaError(null);
            return;
        }
        // Plus de connexion vivante (pré-connexion en échec, éviction) : on
        // repart — jeton + connexion — et la nouvelle tentative publiera.
        // Revue AU-6 : l'ancienne erreur de capture ne décrit plus cette
        // relance — effacée, l'UI montre « reconnexion » plutôt qu'un message
        // périmé avec un bouton réactivé.
        setError(null);
        setMediaError(null);
        autoRetryRef.current = 0;
        setConnectAttempt((n) => n + 1);
    }, []);
    const getAudioStats = useCallback(async (): Promise<LiveAudioStats> => {
        const provider = providerRef.current;
        if (!provider) return { at: Date.now(), local: null, remote: [], canPlaybackAudio: true };
        return provider.getAudioStats();
    }, []);
    const getTransportDiagnostics = useCallback(async (): Promise<LiveTransportDiagnostics> => {
        const provider = providerRef.current;
        if (!provider?.getTransportDiagnostics) {
            return { at: Date.now(), connectionState: provider?.getConnectionState() ?? 'disconnected', publisher: null, subscriber: null, localTracks: [], remoteTracks: [] };
        }
        return provider.getTransportDiagnostics();
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
    const getLocalAudioTrack = useCallback((): MediaStreamTrack | null => {
        return providerRef.current?.getLocalAudioTrack() ?? null;
    }, []);
    // Mission VT : la piste de l'interprète part par le transport de l'appel.
    // Rejet honnête hors connexion — jamais une publication « en attente »
    // silencieuse : l'appelant prévient le correspondant que la voix manque.
    const publishInterpreterAudio = useCallback(async (track: MediaStreamTrack): Promise<void> => {
        const provider = providerRef.current;
        if (!provider || provider.getConnectionState() !== 'connected') throw new Error('Ligne non connectée : la piste de l’interprète ne peut pas être publiée maintenant.');
        await provider.publishAuxiliaryAudio(track, INTERPRETER_TRACK_NAME);
    }, []);
    const unpublishInterpreterAudio = useCallback(async (): Promise<void> => {
        await providerRef.current?.unpublishAuxiliaryAudio(INTERPRETER_TRACK_NAME);
    }, []);

    return {
        connectionState,
        error,
        refusal,
        connectionQuality,
        remoteConnectionQuality,
        sendData,
        localVideoTrack,
        localScreenShareTrack,
        localIsSpeaking,
        activeSpeakerIds,
        remoteParticipants,
        audioPlaybackBlocked,
        startAudio,
        setCameraEnabled,
        cameraFacing,
        switchCamera,
        setMicrophoneEnabled,
        publishMicrophone,
        mediaError,
        localAudioPublished,
        reconnectCount,
        getAudioStats,
        getTransportDiagnostics,
        startScreenShare,
        stopScreenShare,
        disconnect,
        retry,
        getLocalAudioTrack,
        publishInterpreterAudio,
        unpublishInterpreterAudio,
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
    // DS-L0 : cinq et six cartes sont la charge NOMINALE d'un LIVE MokNet
    // (1 hôte + 5 invités, humains et agents confondus), pas un cas extrême.
    // Deux colonnes sur téléphone (3 rangées), trois sur ordinateur (2
    // rangées) — l'auto-fit précédent laissait des cartes de 220 px perdues
    // au milieu d'un écran large dès qu'on dépassait quatre présences.
    if (tileCount <= STAGE_VISIBLE_MAX) return 'grid-cols-2 md:grid-cols-3';
    return 'grid-cols-2 md:[grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]';
}

/**
 * DS-L0 — règle centrale posée par la Direction le 3 septembre 2026 : la scène
 * d'un LIVE MokNet montre **six cartes au minimum** (1 hôte + 5 invités),
 * **humains et agents IA confondus**.
 *
 * Le défaut corrigé ici était structurel, pas cosmétique : le comptage de
 * l'ancienne scène n'accordait de carte à l'agent IA que
 * `si aucun humain distant ne publiait`. On pouvait donc inviter cinq experts
 * (santé, enseignement, partenariats, commercial, architecte…) — ils
 * entraient bien dans la liste des intervenants — et n'en voir AUCUN dès
 * qu'une seule personne allumait sa caméra. « Humains plus agents confondus »
 * était donc impossible à l'écran.
 */
export const STAGE_VISIBLE_MAX = 6;

export type StageTileKind = 'self' | 'human' | 'agent' | 'placeholder';

export interface StageTile {
    /** Identifiant stable : clé de rendu et ancre de vérification. */
    id: string;
    name: string;
    kind: StageTileKind;
}

export interface StageComposition {
    tiles: StageTile[];
    /** Présences réelles qui ne tiennent pas dans les cartes visibles. */
    overflow: number;
    /** Total réel, cartes visibles + débordement — jamais un chiffre décoratif. */
    presenceCount: number;
}

/**
 * Compose la scène : moi (si je suis sur scène), puis les humains qui
 * publient, puis les agents invités — **toujours**, jamais sous condition.
 * L'emplacement d'attente n'apparaît que si la scène serait autrement vide.
 */
export function composeStage(input: {
    isUserOnStage: boolean;
    selfName?: string;
    humans: ReadonlyArray<{ id: string; name: string }>;
    agents: ReadonlyArray<{ id: string; name: string }>;
    max?: number;
    /**
     * EX-5 — expert mis en avant par l'animateur (live_sessions.featured_agent_id).
     * Sa carte passe en PREMIÈRE position et ne peut jamais tomber dans le
     * débordement : « mettre en avant » n'aurait aucun sens si la personne
     * mise en avant pouvait rester invisible parce que la scène est pleine.
     */
    spotlightAgentId?: string;
}): StageComposition {
    const max = Math.max(1, input.max ?? STAGE_VISIBLE_MAX);
    const toutes: StageTile[] = [];

    if (input.isUserOnStage) {
        toutes.push({ id: 'self', name: input.selfName || 'Vous', kind: 'self' });
    }
    for (const h of input.humans) toutes.push({ id: `human:${h.id}`, name: h.name, kind: 'human' });
    for (const a of input.agents) toutes.push({ id: `agent:${a.id}`, name: a.name, kind: 'agent' });

    if (input.spotlightAgentId) {
        const cle = `agent:${input.spotlightAgentId}`;
        const index = toutes.findIndex((t) => t.id === cle);
        // Mettre en avant un expert absent de la scène ne fabrique pas sa carte :
        // on ne montre jamais une présence qui n'est pas là.
        if (index > 0) toutes.unshift(...toutes.splice(index, 1));
    }

    if (toutes.length === 0) {
        return {
            tiles: [{ id: 'placeholder', name: 'En attente du présentateur', kind: 'placeholder' }],
            overflow: 0,
            presenceCount: 0,
        };
    }

    return {
        tiles: toutes.slice(0, max),
        overflow: Math.max(0, toutes.length - max),
        presenceCount: toutes.length,
    };
}

/**
 * EX-6 — De l'ordre DÉCIDÉ par `composeStage` à l'ordre réellement PEINT.
 *
 * `composeStage` place l'expert mis en avant en première carte, mais le rendu
 * écrivait ses cartes d'agent dans un bloc fixe, toujours après la caméra et
 * les humains : la mise en avant ne déplaçait rien à l'écran (mesuré au banc,
 * position 2 sur 3 pour l'expert « à la une »). Cette règle rend les deux
 * cohérents — et elle est testable, contrairement au JSX.
 *
 * `enTete` dit si le bloc des experts doit passer DEVANT le reste : c'est le
 * cas exactement quand la toute première carte revient à un agent.
 */
export function orderStageAgents<T extends { id: string }>(
    agents: ReadonlyArray<T>,
    tiles: ReadonlyArray<StageTile>,
): { visibles: T[]; enTete: boolean } {
    const rang = new Map(tiles.map((t, i) => [t.id, i] as const));
    const visibles = agents
        .filter((a) => rang.has(`agent:${a.id}`))
        .sort((x, y) => (rang.get(`agent:${x.id}`) as number) - (rang.get(`agent:${y.id}`) as number));
    return { visibles, enTete: tiles[0]?.kind === 'agent' };
}

export interface LiveBadgeState {
    label: string;
    className: string;
    /**
     * DS-L1 : vrai UNIQUEMENT quand le direct passe réellement. L'image de
     * référence affiche « ● EN DIRECT » en petites capitales, pas une pastille
     * rouge — mais les états anormaux (aperçu, interruption, reconnexion)
     * doivent rester bruyants. Ce champ évite de redériver la condition dans
     * la vue : une seule source de vérité pour « on est à l'antenne ».
     */
    isOnAir: boolean;
}

/**
 * L4 : badge d'état du direct dérivé de l'état RÉEL (session réelle +
 * transport) — plus jamais un « LIVE » rouge pulsant codé en dur pendant une
 * panne, une reconnexion ou un simple aperçu de démonstration.
 */
export function liveBadge(hasRealSession: boolean, state: LiveConnectionState, hasError: boolean, isFull = false): LiveBadgeState {
    if (!hasRealSession) return { label: 'APERÇU', className: 'bg-slate-700 text-slate-200', isOnAir: false };
    // SAT-3 : « COMPLET » passe AVANT « INTERROMPU ». Un direct plein n'a pas
    // été interrompu — on n'y est jamais entré. Dire « interrompu » ferait
    // croire à une panne et enverrait la personne chercher un problème qui
    // n'existe pas chez elle.
    if (isFull) return { label: 'COMPLET', className: 'bg-amber-500 text-slate-950', isOnAir: false };
    if (hasError) return { label: 'INTERROMPU', className: 'bg-rose-700 text-white', isOnAir: false };
    if (state === 'connected') return { label: 'LIVE', className: 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/40', isOnAir: true };
    if (state === 'reconnecting') return { label: 'RECONNEXION', className: 'bg-amber-500 text-slate-950 animate-pulse', isOnAir: false };
    return { label: 'CONNEXION', className: 'bg-amber-500/80 text-slate-950', isOnAir: false };
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
