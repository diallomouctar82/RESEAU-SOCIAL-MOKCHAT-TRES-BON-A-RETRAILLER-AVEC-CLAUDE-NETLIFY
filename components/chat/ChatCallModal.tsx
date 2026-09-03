import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Maximize2, Minimize2,
  Volume2, VolumeX, Shield, SwitchCamera, User, Loader2, Languages, Wifi, WifiOff, Zap, RefreshCw, AlertTriangle, Ear, EarOff, ChevronDown
} from 'lucide-react';
import { ActiveCallSession } from '../../types';
import { useLiveTransport } from '../../hooks/useLiveTransport';
import type { LiveConnectionQuality, SendDataOptions } from '../../services/live/liveTransportTypes';
import { stopAll as stopAllRingtones } from '../../services/calls/ringtoneService';
import { computeCallLatency, formatLatency } from '../../services/calls/callFlow';
import { getCallSessionDeviceId } from '../../services/calls/callDevice';
import { warmUpAiGateway } from '../../services/aiGateway';
import { callRoomName } from '../../services/calls/callRoom';
import {
  assessAudioLink, describeAudioLink, describeCameraError, describeMediaError, formatAudioLinkLog, peerMediaNotice, pickRemoteForCall, remotesOfAccount,
  type AudioLinkSample, type AudioLinkVerdict,
} from '../../services/calls/callAudio';
import { translationService, getLanguageLabel, MESSAGING_LANGUAGES } from '../../services/translation/translationService';
import { myEffectiveLanguage } from '../../services/messaging/messageLanguage';
import {
  captionForReceiver, decodeCallData, encodeCallData, interpretationPlan, isInterpreterTrackForMe, isInterpreting, originalVoiceVolume,
  peerLanguageForInterpretation, shouldCaptionMyVoice, shouldRenderVoiceForPeer, speechTagFor,
  type CallCaptionMessage, type CallMediaMessage, type CallVoiceMessage,
} from '../../services/messaging/speechLanguage';
import { CallCaptioner, InterpreterVoice, InterpreterVoiceTrack, ServerCaptioner, captionLanguageFromTag, unlockInterpreterAudio } from '../../services/calls/callInterpreter';
import { recordCallEvent, startCallDiagnostics, stopCallDiagnostics } from '../../services/calls/callDiagnostics';
import { useScreenWakeLock } from '../../hooks/useScreenWakeLock';

/**
 * HL-3 : libellé + couleur de la qualité réseau RÉELLE rapportée par le
 * transport — jamais une estimation locale. Pure et exportée (testée).
 */
export const describeConnectionQuality = (quality: LiveConnectionQuality): { label: string; className: string; hint?: string } => {
  switch (quality) {
    case 'excellent': return { label: 'Réseau excellent', className: 'bg-emerald-600/80 text-white' };
    case 'good': return { label: 'Réseau bon', className: 'bg-emerald-700/80 text-white' };
    case 'poor': return { label: 'Réseau faible', className: 'bg-amber-600/85 text-white', hint: 'Coupures possibles : rapprochez-vous du Wi‑Fi ; des écouteurs évitent l’écho.' };
    case 'lost': return { label: 'Réseau perdu', className: 'bg-rose-600/85 text-white', hint: 'Reconnexion en cours…' };
    default: return { label: 'Réseau…', className: 'bg-slate-600/80 text-white' };
  }
};

interface PeerCaption {
  original: string;
  translated?: string;
  sourceLang: string | null;
  final: boolean;
  pending?: boolean;
}

/**
 * Appel 1-à-1 réel (Équipe I / LOOP I1 — « deux amis doivent pouvoir
 * s'appeler sans échec »).
 *
 * Avant ce correctif, AUCUN média ne traversait jamais le réseau : le « flux
 * distant » était une IMAGE de l'avatar du correspondant, l'onde audio une
 * animation factice, et un badge promettait un chiffrement de bout en bout
 * qui n'existait pas (même classe de fausse promesse retirée de la
 * messagerie au LOOP 07/17). La signalisation (invitation/accepté/refusé/
 * terminé, broadcast Supabase), elle, était réelle — elle est conservée.
 *
 * Le transport réutilise l'infrastructure LiveKit EXISTANTE du LIVE
 * (useLiveTransport → Edge Function livekit-token → live.moknet.net) :
 * room dédiée `call-{conversationId}`, les deux participants publient
 * micro (+ caméra si appel vidéo) et s'abonnent l'un à l'autre — jamais un
 * second moteur temps réel parallèle.
 *
 * Équipe 7 (loops 1+7 — « A doit voir/entendre B », « une interface digne
 * d'un téléphone ») :
 * - A2 : le blocage d'autoplay du navigateur est enfin traité — bouton
 *   « Activer le son » (même patron que SocialLive) branché sur
 *   audioPlaybackBlocked/startAudio du hook, sinon l'appel restait MUET
 *   sans aucun remède offert à l'utilisateur.
 * - A3 : chaque callback ref fait un vrai detach() au démontage/changement
 *   de piste (même discipline que RemoteParticipantTile du LIVE) — sans
 *   quoi l'élément retiré du DOM continuait de jouer (fuite/écho).
 * - A5 : les PERSONNES d'abord — flux distant plein cadre (l'écran partagé
 *   distant est affiché s'il existe), aperçu local en incrustation
 *   DÉPLAÇABLE au doigt, contrôles en rangée flottante (raccrocher rouge
 *   central) qui s'estompent après 3,5 s sans interaction et réapparaissent
 *   au toucher, états honnêtes (« Connexion… », « Reconnexion… », durée
 *   mm:ss).
 *
 * Bascule caméra avant/arrière (loop 7, dernier manque comblé) : exposée par
 * le port transport (setCameraFacing) via le hook (switchCamera). Le bouton
 * n'apparaît que si la bascule a un sens — caméra allumée ET plusieurs
 * caméras détectées (un poste avec une seule webcam ne l'affiche pas, comme
 * un téléphone n'affiche pas de bouton pour une caméra qu'il n'a pas).
 * L'aperçu local n'est miroité qu'en face AVANT (un texte filmé par la
 * caméra arrière doit rester lisible). Toujours aucun contournement direct
 * de livekit-client ici : ce composant ne connaît que le hook.
 */

/**
 * Durée d'appel « téléphone » : mm:ss, les minutes continuent au-delà de 59
 * (61:05 après une heure — jamais une remise à zéro trompeuse). Pure et
 * exportée pour être testée ; toute entrée invalide (négatif, NaN) affiche
 * honnêtement 00:00 plutôt que « NaN:NaN ».
 */
export const formatCallDuration = (sec: number): string => {
  const safe = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const mins = Math.floor(safe / 60);
  const s = safe % 60;
  return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface ChatCallModalProps {
  callSession: ActiveCallSession;
  /** Nom d'affichage local, transmis au jeton LiveKit. */
  localName: string;
  /**
   * HL-4 : « Ma langue » (profiles.preferred_language). `null`/absent =
   * « Par défaut » → l'appel est strictement inchangé (aucune reconnaissance,
   * aucune traduction, aucune voix). Un code = mode interprète : je lis et
   * j'entends l'autre dans cette langue.
   */
  myLanguage?: string | null;
  /**
   * Mission VT : changer « Ma langue » depuis l'écran d'appel — avant le
   * décroché ou en pleine conversation. Même réglage que l'en-tête de
   * conversation (`profiles.preferred_language`) ; '' = « Par défaut ».
   */
  /** Mission VT : langue dans laquelle JE veux ENTENDRE le correspondant pour CET appel — null = appel normal (voix originales), le défaut. */
  hearLanguage?: string | null;
  /** Choix de cette langue depuis l'écran d'appel (avant le décroché ou pendant) ; null = revenir à l'appel normal. */
  onHearLanguageChange?: (code: string | null) => void;
  isIncoming?: boolean;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
  /**
   * Mission AU : côté APPELANT, la voix du correspondant arrive alors que
   * l'appel est encore « en sonnerie » chez moi — son signal `call_accepted`
   * (broadcast éphémère) s'est perdu. Le média réel prime : le parent passe
   * l'appel en « connecté » (arrêt du retour d'appel, durée, lecture du son).
   * Sans cela, l'appelé m'entendait et moi jamais lui : audio à sens unique.
   */
  onRemoteMediaStarted?: () => void;
  /**
   * Revue AU-6 : le correspondant a quitté la room (ou sa connexion est
   * morte) depuis 25 s pendant un appel connecté — le parent termine l'appel
   * et l'explique. Sans ce callback, `onEndCall` est appelé.
   */
  onPeerLost?: () => void;
}

/** Revue AU-6 : absence du correspondant tolérée avant de conclure à un appel orphelin (fenêtre de reconnexion LiveKit comprise). */
export const PEER_LOST_TIMEOUT_MS = 25000;

/**
 * AU-13 : au-delà de ce nombre de rétablissements complets de la ligne PENDANT
 * un appel, ce n'est plus un incident réseau ponctuel — l'écran doit le dire.
 * Deux tolérées (un changement de réseau réel en produit une, parfois deux) ;
 * la troisième signe une ligne qui ne tient pas.
 */
export const LINE_FLAPPING_THRESHOLD = 3;

export const ChatCallModal: React.FC<ChatCallModalProps> = ({
  callSession,
  localName,
  myLanguage = null,
  hearLanguage = null,
  onHearLanguageChange,
  isIncoming = false,
  onAcceptCall,
  onRejectCall,
  onEndCall,
  onRemoteMediaStarted,
  onPeerLost,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  // Mission AU : identité d'appareil, lue une fois. Mission LT : propre à CET
  // ONGLET (suffixe tiré au chargement de la page) — deux onglets du même
  // navigateur qui reçoivent le même appel ne s'évincent plus l'un l'autre
  // (audit LT-0 : la boucle d'évictions faisait attendre 22 s la ligne).
  const deviceIdRef = useRef<string | null>(null);
  if (deviceIdRef.current === null) deviceIdRef.current = getCallSessionDeviceId();
  const [isVideoOff, setIsVideoOff] = useState(callSession.type === 'audio');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  // HL-4 : les paquets du canal de données sont routés vers le handler
  // COURANT via une ref — le hook ne se reconnecte jamais pour ça.
  const onDataRef = useRef<(payload: Uint8Array) => void>(() => {});

  // Mission VF-3 (latence au décroché) : le transport est actif DÈS la
  // sonnerie. L'audit VF-0 avait mesuré plusieurs secondes entre le décroché
  // et la première voix : avec `enabled: status === 'connected'`, le jeton
  // LiveKit, la signalisation et la négociation ne démarraient qu'APRÈS
  // l'acceptation. Désormais tout cela se fait pendant que ça sonne :
  //  - appelant : connexion + publication micro (+ caméra si vidéo) — le
  //    correspondant l'entend dès qu'il décroche ;
  //  - appelé : connexion SANS aucune publication (`publishAudioOnConnect`
  //    et `publishVideoOnConnect` à false) — aucun média capté avant le
  //    décroché ; l'activation passe par `publishMicrophone()` à
  //    l'acceptation, APRÈS l'arrêt de la sonnerie (VF-2).
  // Être connecté à la room ne fait pas un appel « en ligne » : seul le
  // signal `call_accepted` (status 'connected') connecte. HL-3 : profil audio
  // « parole » (Opus speech, RED, DTX) — moins de coupures sur réseau mobile.
  const transportEnabled = callSession.status === 'ringing' || callSession.status === 'connected';

  // AU-7 : RAPPORT DE DIAGNOSTIC — ouvert avec l'écran, envoyé au serveur en
  // cours d'appel puis à la fin avec son issue (ce qu'un vrai téléphone a vu :
  // états, reconnexions nommées par le SDK, chemin réseau, verdicts audio).
  const outcomeRef = useRef<string>('sonnerie');
  useEffect(() => {
    startCallDiagnostics({
      callId: callSession.callId,
      conversationId: callSession.conversationId || null,
      role: isIncoming ? 'appelé' : 'appelant',
      deviceId: deviceIdRef.current ?? 'inconnu',
    });
    return () => { void stopCallDiagnostics(outcomeRef.current); };
    // Un rapport par appel : l'identifiant d'appel est fixe pour toute la session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callSession.callId]);
  useEffect(() => {
    recordCallEvent('call', `statut de l’appel : ${callSession.status}`, { type: callSession.type });
    if (callSession.status === 'connected') outcomeRef.current = 'connecté';
  }, [callSession.status, callSession.type]);

  // AU-7 : ÉCRAN MAINTENU ALLUMÉ tant que l'appel est actif — la veille
  // automatique (30 s à 1 min) suspendait la page sur téléphone et coupait la
  // ligne « à la minute ».
  useScreenWakeLock(transportEnabled, (message) => recordCallEvent('call', message));

  const transport = useLiveTransport({
    // AU-12 : une room par APPEL (`call-<conversation>--<appel>`), plus une
    // room permanente par conversation. Les rapports de diagnostic de deux
    // vrais appareils ont montré une session fantôme d'un appel PRÉCÉDENT
    // encore présente dans la room commune, micro publié : le correspondant
    // entendait ce qu'elle captait — dont sa sonnerie — mêlé à la voix.
    roomName: callRoomName(callSession.conversationId, callSession.callId),
    conversationId: callSession.conversationId,
    participantName: localName,
    canPublish: true,
    enabled: transportEnabled,
    publishAudioOnConnect: !isIncoming,
    publishVideoOnConnect: !isIncoming && callSession.type === 'video',
    audioProfile: 'call',
    deviceId: deviceIdRef.current,
    onDataReceived: (payload) => onDataRef.current(payload),
  });

  // Mission AU : le correspondant est celui qui PUBLIE du média — pas
  // `remoteParticipants[0]`, qui pouvait être un second appareil silencieux
  // du même compte (connecté pendant la sonnerie, jamais décroché).
  // Revue AU-6 : et uniquement parmi les appareils du compte du CORRESPONDANT
  // (identité par appareil) — jamais un de mes propres appareils ni un
  // participant inattendu, qui pouvaient « connecter » l'appel ou capter
  // l'unique élément audio.
  const peerUserId = isIncoming ? callSession.initiatorId : callSession.receiverId;
  const remote = pickRemoteForCall(remotesOfAccount(transport.remoteParticipants, peerUserId));
  const transportConnected = transport.connectionState === 'connected';
  // « Média connecté » au sens de l'APPEL : transport connecté ET appel
  // accepté. Avec la pré-connexion, le transport peut être connecté pendant
  // la sonnerie — rien de ce qui en dépend (annonce de langue, sous-titres,
  // durée, qualité, lecture des pistes distantes) ne démarre avant le décroché.
  const mediaConnected = transportConnected && callSession.status === 'connected';
  const callAccepted = callSession.status === 'connected';

  // AU-7 : chaque changement d'état du transport est daté dans le rapport.
  useEffect(() => {
    recordCallEvent('transport', `hook : ${transport.connectionState}`, { error: transport.error, mediaError: transport.mediaError, micPublié: transport.localAudioPublished, lectureBloquée: transport.audioPlaybackBlocked });
    if (callAccepted && transport.connectionState === 'failed') outcomeRef.current = 'ligne perdue';
  }, [transport.connectionState, transport.error, transport.mediaError, transport.localAudioPublished, transport.audioPlaybackBlocked, callAccepted]);
  useEffect(() => {
    recordCallEvent('transport', remote ? 'correspondant présent' : 'correspondant absent', remote ? { identity: remote.participant.identity, audio: !!remote.audioTrack, video: !!remote.videoTrack } : undefined);
  }, [remote?.participant.identity, remote?.audioTrack, remote?.videoTrack]);

  // ── VF-2 / VF-3 : arrêt net de la sonnerie, activation différée, latence ──
  // Chronométrage (horloge locale) : décroché, transport connecté, première
  // voix distante — voir services/calls/callFlow.ts (computeCallLatency).
  const acceptedAtRef = useRef<number | null>(callSession.acceptedAt ?? null);
  const connectedAtRef = useRef<number | null>(null);
  const firstRemoteAudioAtRef = useRef<number | null>(null);
  const localMediaRequestedRef = useRef(false);
  const [latencyBadge, setLatencyBadge] = useState<string | null>(null);
  const [localMediaError, setLocalMediaError] = useState<string | null>(null);
  const publishMicrophoneRef = useRef(transport.publishMicrophone);
  publishMicrophoneRef.current = transport.publishMicrophone;
  const transportConnectedRef = useRef(transportConnected);
  transportConnectedRef.current = transportConnected;
  const localAudioPublishedRef = useRef(transport.localAudioPublished);
  localAudioPublishedRef.current = transport.localAudioPublished;

  const latencyMarks = useCallback(() => ({
    offerSentAt: callSession.offerSentAt ?? null,
    ringStartedAt: callSession.ringStartedAt ?? null,
    acceptedAt: acceptedAtRef.current,
    connectedAt: connectedAtRef.current,
    firstRemoteAudioAt: firstRemoteAudioAtRef.current,
  }), [callSession.offerSentAt, callSession.ringStartedAt]);

  // Décroché (clic local chez l'appelé, `call_accepted` reçu chez l'appelant) :
  // 1. plus RIEN ne sonne — avant toute ouverture du micro, sinon il capte la
  //    fin de la sonnerie et le correspondant l'entend (VF-2) ;
  // 2. l'appelé active son micro (+ caméra si vidéo) via l'activation
  //    différée ; l'appelant, s'il publie déjà, n'a rien à faire — mais si sa
  //    pré-connexion a échoué pendant la sonnerie, la même fonction relance
  //    jeton + connexion : un appel n'est jamais bloqué par la pré-connexion.
  useEffect(() => {
    if (callSession.status !== 'connected') return;
    acceptedAtRef.current ??= callSession.acceptedAt ?? Date.now();
    if (localMediaRequestedRef.current) return;
    localMediaRequestedRef.current = true;
    stopAllRingtones();
    // Mission AU : quel que soit le rôle, si mon micro n'est PAS réellement
    // publié au décroché (capture refusée pendant la sonnerie chez
    // l'appelant, ligne tombée, appareil évincé), on (re)demande — l'ancien
    // test « appelant déjà connecté = rien à faire » laissait un appelant
    // muet pour toute la durée de l'appel.
    if (isIncoming || !transportConnectedRef.current || !localAudioPublishedRef.current) {
      publishMicrophoneRef.current({ camera: callSession.type === 'video' }).catch((err) => {
        recordCallEvent('error', 'activation du micro au décroché en échec', err);
        setLocalMediaError(err instanceof Error ? err.message : String(err));
      });
    }
    // isIncoming et type sont fixes pour une session ; l'activation ne doit avoir lieu qu'une fois.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callSession.status]);

  // Mission AU : « Réessayer le micro » — DANS le geste utilisateur (les
  // navigateurs mobiles n'accordent la capture qu'à ce moment-là).
  const [retryingMic, setRetryingMic] = useState(false);
  const retryMicrophone = async () => {
    setRetryingMic(true);
    setLocalMediaError(null);
    try {
      // Revue AU-6 : `camera: false` explicite quand la caméra est coupée —
      // « Réessayer le micro » ne rallume jamais la caméra.
      await publishMicrophoneRef.current({ camera: callSession.type === 'video' && !isVideoOff });
    } catch (err) {
      setLocalMediaError(err instanceof Error ? err.message : String(err));
    } finally {
      setRetryingMic(false);
    }
  };
  // Revue AU-6 : sans ligne vivante, « Réessayer » relance jeton + connexion
  // (plusieurs secondes) — l'écran le dit et le bouton attend, au lieu de
  // réafficher l'ancienne erreur avec un bouton actif.
  const reconnectingForMic = callAccepted && !transport.localAudioPublished && transport.connectionState !== 'connected';

  // Mission AU : le MÉDIA du correspondant arrive alors que je suis encore
  // « en sonnerie » côté APPELANT → son `call_accepted` s'est perdu ; le
  // parent bascule en connecté. (Chez l'appelé, la piste de l'appelant est
  // attendue pendant la sonnerie : rien à faire.) Revue AU-6 : tout média
  // compte — un appelé dont le micro est refusé mais qui publie sa caméra
  // a bel et bien décroché.
  const onRemoteMediaStartedRef = useRef(onRemoteMediaStarted);
  onRemoteMediaStartedRef.current = onRemoteMediaStarted;
  const remoteMediaDuringRinging = !isIncoming && callSession.status === 'ringing' && !!(remote?.audioTrack || remote?.videoTrack || remote?.screenShareTrack);
  useEffect(() => {
    if (!remoteMediaDuringRinging) return;
    console.warn('[appel] média voix du correspondant reçue pendant la sonnerie : signal d’acceptation perdu, appel considéré connecté');
    onRemoteMediaStartedRef.current?.();
  }, [remoteMediaDuringRinging]);

  // Revue AU-6 : l'identité par appareil a supprimé l'éviction qui servait de
  // nettoyage implicite — un `call_ended` perdu laissait un appel « connecté »
  // sans correspondant, micro publié, indéfiniment. Désormais : correspondant
  // ABSENT de la room pendant 25 s (au-delà de la fenêtre de reconnexion du
  // transport) après y avoir été présent → l'appel se termine, avec un mot.
  const onPeerLostRef = useRef(onPeerLost);
  onPeerLostRef.current = onPeerLost;
  const onEndCallRef = useRef(onEndCall);
  onEndCallRef.current = onEndCall;
  const peerPresent = !!remote;
  const peerSeenRef = useRef(false);
  useEffect(() => { if (peerPresent) peerSeenRef.current = true; }, [peerPresent]);
  useEffect(() => {
    if (callSession.status !== 'connected' || peerPresent || !peerSeenRef.current) return;
    const timer = setTimeout(() => {
      console.warn('[appel] média correspondant absent de la room depuis 25 s — appel terminé');
      recordCallEvent('call', 'correspondant absent depuis 25 s — appel terminé');
      outcomeRef.current = 'correspondant perdu';
      stopAllRingtones();
      if (onPeerLostRef.current) onPeerLostRef.current();
      else onEndCallRef.current();
    }, PEER_LOST_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [callSession.status, peerPresent]);

  // Transport connecté après le décroché : instant « connectedAt ».
  useEffect(() => {
    if (!mediaConnected || connectedAtRef.current !== null) return;
    connectedAtRef.current = Date.now();
    console.info('[appel] latence', { phase: 'transport', role: isIncoming ? 'appelé' : 'appelant', ...computeCallLatency(latencyMarks()) });
  }, [mediaConnected, isIncoming, latencyMarks]);

  // Première voix distante réellement disponible après le décroché :
  // ceinture et bretelles sur la sonnerie (VF-2), mesure de latence et badge
  // discret « Connecté en 0,9 s » pendant 4 s (VF-3). Chez l'appelé, la piste
  // de l'appelant est souvent déjà là (il publie pendant la sonnerie) : le
  // délai mesuré est alors quasi nul — c'est exactement le gain recherché.
  const remoteAudioReady = callAccepted && !!remote?.audioTrack;
  useEffect(() => {
    if (!remoteAudioReady || firstRemoteAudioAtRef.current !== null) return;
    stopAllRingtones();
    firstRemoteAudioAtRef.current = Date.now();
    const latency = computeCallLatency(latencyMarks());
    console.info('[appel] latence', { phase: 'audio', role: isIncoming ? 'appelé' : 'appelant', ...latency });
    const shown = latency.acceptToAudioMs ?? latency.acceptToConnectedMs;
    if (shown !== null) setLatencyBadge(`Connecté en ${formatLatency(shown)}`);
  }, [remoteAudioReady, isIncoming, latencyMarks]);
  // Le badge s'efface seul après 4 s — minuteur indépendant de la piste
  // distante (un badge ne doit jamais rester affiché parce qu'une piste a
  // disparu entre-temps).
  useEffect(() => {
    if (!latencyBadge) return;
    const timer = setTimeout(() => setLatencyBadge(null), 4000);
    return () => clearTimeout(timer);
  }, [latencyBadge]);

  // Démontage de l'écran d'appel (fin, refus, expiration, erreur, pris en
  // charge ailleurs) : plus rien ne doit sonner, quel que soit le chemin.
  useEffect(() => () => stopAllRingtones(), []);

  // Décrocher / refuser / raccrocher : la sonnerie s'arrête ICI, de façon
  // synchrone, avant même que le parent ne change l'état — le micro ne peut
  // pas s'ouvrir sur une sonnerie encore audible.
  const handleAccept = () => {
    stopAllRingtones();
    // Mission VT : geste utilisateur → contextes audio de l'interprète réveillés, synthèse amorcée (iOS).
    unlockInterpreterAudio();
    // Mission LT : la LECTURE AUDIO du transport est débloquée DANS le geste
    // de décroché. Sur l'iPhone réel de l'audit, la ligne pré-connectée
    // pendant la sonnerie restait « lecture bloquée » (NotAllowedError) 22 s
    // après le décroché, jusqu'à un toucher de l'écran : la voix du
    // correspondant arrivait mais ne sortait pas du haut-parleur.
    void transport.startAudio();
    acceptedAtRef.current ??= Date.now();
    onAcceptCall();
  };
  /** Tout geste sur l'écran d'appel réveille l'audio de l'interprète et, si le navigateur bloque encore la lecture, le transport. */
  const onCallScreenGesture = () => {
    unlockInterpreterAudio();
    if (transport.audioPlaybackBlocked) void transport.startAudio();
  };
  const handleReject = () => {
    stopAllRingtones();
    onRejectCall();
  };
  const handleEnd = () => {
    stopAllRingtones();
    onEndCall();
  };

  // ── Interprète IA (HL-4) ────────────────────────────────────────────────
  // Chaque côté transcrit SA voix, dans SA langue, et envoie les segments à
  // l'autre par le canal de données ; le RÉCEPTEUR traduit dans SA langue,
  // affiche les sous-titres et — s'il le veut — entend une voix dans sa
  // langue pendant que l'original est atténué. « Par défaut » chez moi :
  // rien de tout cela ne s'exécute pour moi ; je transcris seulement si
  // l'autre, lui, a choisi une langue (il a besoin de mes sous-titres).
  // Mission VT : `myLang` = la langue dans laquelle je veux ENTENDRE le
  // correspondant pour CET appel (choisie dans l'écran d'appel ; null = appel
  // normal, voix originales — le défaut, comme un appel classique). La langue
  // du PROFIL (`myLanguage`) n'indique plus que ce que je PARLE (indication
  // pour la transcription et la reconnaissance du navigateur) : elle n'active
  // jamais la traduction à elle seule.
  const myLang = myEffectiveLanguage(hearLanguage);
  const hearTag = speechTagFor(hearLanguage);
  const spokenLang = myEffectiveLanguage(myLanguage);
  const mySpeechTag = speechTagFor(myLanguage, typeof navigator !== 'undefined' ? navigator.language : undefined);
  const [peerLanguage, setPeerLanguage] = useState<string | null>(null);
  const [peerCaption, setPeerCaption] = useState<PeerCaption | null>(null);
  const [recentCaptions, setRecentCaptions] = useState<PeerCaption[]>([]);
  const [myLiveText, setMyLiveText] = useState('');
  const [captionsUnavailable, setCaptionsUnavailable] = useState<string | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  // Mission VT : « l'interprète parle » = du son de l'interprète SORT
  // réellement chez moi — dans la piste que le correspondant (ou l'agent)
  // envoie dans l'appel (messages « voice » start/end), ou par le repli local
  // (voix de l'appareil). Mon micro capte alors ce son : le captioner le jette.
  const [remoteInterpreterSpeaking, setRemoteInterpreterSpeaking] = useState(false);
  const [localInterpreterSpeaking, setLocalInterpreterSpeaking] = useState(false);
  const interpreterSpeaking = remoteInterpreterSpeaking || localInterpreterSpeaking;
  // Mission VT : « ma langue seulement » — la voix ORIGINALE du correspondant
  // est COUPÉE dès que l'interprète me parle dans ma langue (elle n'était
  // qu'atténuée : on entendait les deux voix mélangées). « Entendre aussi
  // l'original » la rétablit, atténuée pendant que l'interprète parle. Sa
  // langue : celle qu'il PARLE réellement (détectée dans ses dernières
  // paroles), sinon celle qu'il a DÉCLARÉE (« hello ») — au test sur deux
  // téléphones, un correspondant déclaré « anglais » qui parlait français
  // était coupé sans rien à interpréter : silence, texte seul. Jamais une
  // coupure tant qu'on ignore ce qu'il parle.
  const [hearOriginal, setHearOriginal] = useState(false);
  const [peerSpokenLanguage, setPeerSpokenLanguage] = useState<string | null>(null);
  // Langue DÉCLARÉE du correspondant telle que reçue en dernier : quand il en
  // change en cours d'appel, la détection précédente est oubliée (elle
  // datait de l'ancienne langue) — la nouvelle déclaration prime jusqu'à ce
  // qu'il parle à nouveau.
  const peerDeclaredRef = useRef<string | null>(null);
  // Mission VT : le correspondant veut-il ENTENDRE la voix de l'interprète ? (« hello ».voice ; absent = oui)
  const [peerWantsVoice, setPeerWantsVoice] = useState(true);
  const peerWantsVoiceRef = useRef(true);
  peerWantsVoiceRef.current = peerWantsVoice;
  // Mission VT : un agent interprète (serveur GPU, participant tiers) est dans
  // la room — c'est lui qui rend la voix, mon navigateur lui laisse la place.
  const [agentPresent, setAgentPresent] = useState(false);
  const agentPresentRef = useRef(false);
  agentPresentRef.current = agentPresent;
  // VF-4 : le captioner actif est soit la transcription serveur, soit le
  // repli navigateur — les deux savent s'arrêter net.
  const captionerRef = useRef<{ stop: () => void } | null>(null);
  /** Repli LOCAL (voix de l'appareil) — seulement quand la voix n'arrive pas par la piste de l'appel. */
  const voiceRef = useRef<InterpreterVoice | null>(null);
  /** Mission VT : rendu de la voix que J'ENVOIE au correspondant dans la piste « interpreter » de l'appel. */
  const voiceTrackRef = useRef<InterpreterVoiceTrack | null>(null);
  const interpreterPublishedRef = useRef(false);
  const publishInterpreterAudioRef = useRef(transport.publishInterpreterAudio);
  publishInterpreterAudioRef.current = transport.publishInterpreterAudio;
  /** Sous-titres reçus (dans MA langue) par identifiant — repli local si l'émetteur signale un échec de voix. */
  const captionTextsRef = useRef(new Map<string, string>());
  const remoteVoiceWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const voiceEnabledRef = useRef(voiceEnabled);
  const sendDataRef = useRef<(payload: Uint8Array, options?: SendDataOptions) => Promise<void>>(transport.sendData);
  sendDataRef.current = transport.sendData;
  const lastInterimSentAtRef = useRef(0);
  // Miroirs lus par le captioner sans jamais le redémarrer : la piste micro
  // (publiée un peu après la connexion) et « l'interprète parle » (mon micro
  // entend alors mon haut-parleur — ce n'est pas ma voix).
  const getLocalAudioTrackRef = useRef(transport.getLocalAudioTrack);
  getLocalAudioTrackRef.current = transport.getLocalAudioTrack;
  const interpreterSpeakingRef = useRef(false);
  const remoteSpeakingRef = useRef(false);
  const localSpeakingRef = useRef(false);
  const syncSpeaking = useCallback(() => { interpreterSpeakingRef.current = remoteSpeakingRef.current || localSpeakingRef.current; }, []);

  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
    if (!voiceEnabled) voiceRef.current?.stop();
  }, [voiceEnabled]);

  // Mission VT : voix de l'interprète reçue par la piste de l'appel — état
  // « l'interprète parle » piloté par l'émetteur (« voice » start/end, chien
  // de garde 30 s) ; « failed » → je dis la phrase avec la voix de mon appareil.
  const rememberCaptionText = (id: string, text: string) => {
    const map = captionTextsRef.current;
    map.set(id, text);
    if (map.size > 20) { const oldest = map.keys().next().value; if (oldest !== undefined) map.delete(oldest); }
  };
  const setRemoteSpeaking = (speaking: boolean) => {
    remoteSpeakingRef.current = speaking;
    syncSpeaking();
    setRemoteInterpreterSpeaking(speaking);
    if (remoteVoiceWatchdogRef.current) { clearTimeout(remoteVoiceWatchdogRef.current); remoteVoiceWatchdogRef.current = null; }
    if (speaking) remoteVoiceWatchdogRef.current = setTimeout(() => { remoteVoiceWatchdogRef.current = null; setRemoteSpeaking(false); }, 30000);
  };
  const handleVoiceMessage = (msg: CallVoiceMessage) => {
    if (msg.state === 'start') {
      setRemoteSpeaking(true);
      recordCallEvent('voice', 'voix de l’interprète dans l’appel : début', { id: msg.id, durationMs: msg.durationMs });
      return;
    }
    setRemoteSpeaking(false);
    if (msg.state === 'end') { recordCallEvent('voice', 'voix de l’interprète dans l’appel : fin', { id: msg.id }); return; }
    const text = captionTextsRef.current.get(msg.id);
    recordCallEvent('voice', `voix non rendue par l’émetteur (${msg.reason ?? 'raison inconnue'}) — repli local ${text ? 'lancé' : 'impossible : texte inconnu'}`, { id: msg.id });
    console.info('[appel] voix interprète : échec chez l’émetteur, repli local', msg.reason ?? '');
    if (text && voiceEnabledRef.current) voiceRef.current?.speak(text, { browserOnly: true });
  };

  // Mission VT : rendu de MA voix d'interprète pour le correspondant, dans la
  // piste « interpreter » de l'appel — créée à la première phrase, publiée une
  // fois, chaque phrase annoncée par messages « voice ». Un échec est DIT au
  // correspondant (il la dira lui-même), jamais tu.
  const sendVoiceMessage = (message: Omit<CallVoiceMessage, 't' | 'v'>) => {
    void sendDataRef.current(encodeCallData({ t: 'voice', v: 1, ...message }), { reliable: true }).catch(() => {});
  };
  /** Le rendu de ma voix d'interprète (une seule instance par appel) — créé à la demande, langue ajustable en cours d'appel. */
  const ensureVoiceTrack = (targetLang: string | null): InterpreterVoiceTrack => {
    const lang = speechTagFor(targetLang);
    const existing = voiceTrackRef.current;
    if (existing) {
      // Mission LT : le correspondant change de langue d'écoute → même piste, langue de rendu mise à jour.
      if (existing.language !== lang) existing.setLanguage(lang);
      return existing;
    }
    const track = new InterpreterVoiceTrack({
      lang,
      onPhrase: (report) => {
        if (report.status === 'generated') {
          const merged = report.merged && report.merged > 1 ? ` (${report.merged} phrases rendues ensemble)` : '';
          recordCallEvent('voice', `voix HD générée en ${report.generateMs} ms — ${Math.round(report.durationMs / 100) / 10} s d’audio${merged}`, { id: report.id });
          console.info('[appel] voix interprète générée', { generateMs: report.generateMs, durationMs: report.durationMs, ...(report.merged ? { merged: report.merged } : {}) });
        } else if (report.status === 'started') {
          sendVoiceMessage({ id: report.id, state: 'start', durationMs: report.durationMs });
          recordCallEvent('voice', 'voix envoyée dans la piste de l’appel : début', { id: report.id, durationMs: report.durationMs });
          console.info('[appel] voix interprète envoyée dans l’appel', { id: report.id, durationMs: report.durationMs });
        } else if (report.status === 'ended') {
          sendVoiceMessage({ id: report.id, state: 'end' });
        } else {
          sendVoiceMessage({ id: report.id, state: 'failed', reason: report.reason });
          recordCallEvent('voice', `voix non rendue (${report.reason}) — le correspondant la dira lui-même`, { id: report.id });
          console.info('[appel] voix interprète non rendue :', report.reason);
        }
      },
    });
    voiceTrackRef.current = track;
    return track;
  };
  /**
   * Publie (une fois) la piste interprète sur l'appel. Une seule publication
   * en vol à la fois — la préparation anticipée (mission LT) et la première
   * phrase peuvent la demander en même temps. Renvoie false (raison dans
   * `lastPublishFailureRef`) plutôt que de lever : l'appelant décide quoi dire
   * au correspondant.
   */
  const interpreterPublishingRef = useRef<Promise<boolean> | null>(null);
  const lastPublishFailureRef = useRef<string | null>(null);
  const publishInterpreterTrack = (track: InterpreterVoiceTrack): Promise<boolean> => {
    if (interpreterPublishedRef.current) return Promise.resolve(true);
    if (interpreterPublishingRef.current) return interpreterPublishingRef.current;
    const attempt = (async () => {
      try {
        const publish = publishInterpreterAudioRef.current;
        if (!publish) throw new Error('transport sans piste auxiliaire');
        await publish(track.start());
        interpreterPublishedRef.current = true;
        lastPublishFailureRef.current = null;
        recordCallEvent('voice', 'piste interprète publiée dans l’appel');
        console.info('[appel] piste interprète publiée');
        return true;
      } catch (err) {
        const reason = err instanceof Error ? err.message : String(err);
        lastPublishFailureRef.current = reason;
        recordCallEvent('voice', `piste interprète : publication impossible (${reason})`);
        console.info('[appel] piste interprète : publication impossible', reason);
        return false;
      } finally {
        interpreterPublishingRef.current = null;
      }
    })();
    interpreterPublishingRef.current = attempt;
    return attempt;
  };
  const speakToPeer = async (id: string, text: string, targetLang: string | null): Promise<void> => {
    const track = ensureVoiceTrack(targetLang);
    const published = await publishInterpreterTrack(track);
    if (!published) {
      sendVoiceMessage({ id, state: 'failed', reason: `publication impossible : ${(lastPublishFailureRef.current ?? 'raison inconnue').slice(0, 80)}` });
      return;
    }
    track.speak(id, text);
  };
  const speakToPeerRef = useRef(speakToPeer);
  speakToPeerRef.current = speakToPeer;
  const ensureVoiceTrackRef = useRef(ensureVoiceTrack);
  ensureVoiceTrackRef.current = ensureVoiceTrack;
  const publishInterpreterTrackRef = useRef(publishInterpreterTrack);
  publishInterpreterTrackRef.current = publishInterpreterTrack;
  const unpublishInterpreterAudioRef = useRef(transport.unpublishInterpreterAudio);
  unpublishInterpreterAudioRef.current = transport.unpublishInterpreterAudio;
  // Nouvelle connexion (ligne retombée puis relancée) : la piste devra être republiée ; une reconnexion du SDK, elle, la conserve.
  useEffect(() => {
    if (transport.connectionState === 'disconnected' || transport.connectionState === 'failed') interpreterPublishedRef.current = false;
  }, [transport.connectionState]);

  // Mission AU : état RÉEL du micro du correspondant (message « media ») —
  // distingue « il se tait » de « son micro ne marche pas ».
  const [peerMedia, setPeerMedia] = useState<CallMediaMessage | null>(null);

  // Réception : « hello » (langue du pair, voix voulue), « media » (son micro),
  // « agent » (interprète serveur présent), « voice » (voix de l'interprète) et sous-titres.
  onDataRef.current = (payload) => {
    const msg = decodeCallData(payload);
    if (!msg) return;
    if (msg.t === 'hello') {
      if (peerDeclaredRef.current !== msg.lang) { peerDeclaredRef.current = msg.lang; setPeerSpokenLanguage(null); }
      setPeerLanguage(msg.lang);
      setPeerWantsVoice(msg.voice !== false);
      return;
    }
    if (msg.t === 'media') { setPeerMedia(msg); return; }
    if (msg.t === 'agent') {
      if (!agentPresentRef.current) { recordCallEvent('voice', 'agent interprète présent dans la room', { langs: msg.langs }); console.info('[appel] agent interprète présent'); }
      setAgentPresent(true);
      return;
    }
    if (msg.t === 'voice') { handleVoiceMessage(msg); return; }
    const plan = interpretationPlan({ myLanguage: hearLanguage, sourceLanguage: msg.lang });
    if (!plan.active) return; // « Par défaut » : l'appel reste tel quel.
    if (!msg.final) {
      setPeerCaption({ original: msg.text, sourceLang: msg.lang, final: false });
      return;
    }
    // Mission VT : langue réellement PARLÉE par le correspondant (détectée par
    // la transcription) — pilote la coupure de sa voix originale quand il n'a
    // pas déclaré de langue.
    const spokenLanguage = myEffectiveLanguage(msg.lang);
    if (spokenLanguage) setPeerSpokenLanguage(spokenLanguage);
    // VF-4 : si l'émetteur a déjà joint la traduction dans MA langue
    // (transcription serveur), elle est affichée et dite tout de suite —
    // zéro appel réseau. Même langue des deux côtés : l'original tel quel.
    const ready = captionForReceiver(msg, hearLanguage);
    if (!ready.needsTranslation) {
      const caption: PeerCaption = { original: msg.text, sourceLang: msg.lang, final: true, translated: ready.text };
      setPeerCaption((prev) => { if (prev?.final && prev.translated) setRecentCaptions((r) => [prev, ...r].slice(0, 2)); return caption; });
      if (ready.translatedByPeer && voiceEnabledRef.current) {
        // Mission VT : la voix arrive par la piste de l'appel (émetteur ou agent) —
        // rien n'est lu localement ; le texte est gardé pour le repli si elle échoue.
        if (msg.voice === 'sent' || msg.voice === 'agent') rememberCaptionText(msg.id, ready.text);
        else voiceRef.current?.speak(ready.text); // pair sans rendu dans l'appel : voix locale, comme avant
      }
      return;
    }
    const pending: PeerCaption = { original: msg.text, sourceLang: msg.lang, final: true, pending: true };
    setPeerCaption((prev) => { if (prev?.final && prev.translated) setRecentCaptions((r) => [prev, ...r].slice(0, 2)); return pending; });
    translationService
      .translateText({ text: msg.text, sourceLanguage: msg.lang ?? undefined, targetLanguage: plan.targetLanguage!, context: 'live' })
      .then((result) => {
        const translated = result.status === 'translated' ? result.translatedText : msg.text;
        setPeerCaption((prev) => (prev && prev.original === msg.text ? { ...prev, translated, pending: false } : prev));
        if (result.status === 'translated' && voiceEnabledRef.current) voiceRef.current?.speak(translated);
      })
      .catch(() => {
        setPeerCaption((prev) => (prev && prev.original === msg.text ? { ...prev, translated: msg.text, pending: false } : prev));
      });
  };

  // « hello » : j'annonce ma langue (et si je veux la voix de l'interprète)
  // dès que le média est là, et de nouveau à chaque arrivée d'un participant
  // — correspondant ou agent interprète — qui aurait manqué le premier.
  const remoteIdentities = transport.remoteParticipants.map((p) => p.participant.identity).join('|');
  useEffect(() => {
    if (!mediaConnected) return;
    void sendDataRef.current(encodeCallData({ t: 'hello', v: 1, lang: myLang ?? null, voice: voiceEnabled }), { reliable: true }).catch(() => {});
  }, [mediaConnected, remoteIdentities, myLang, voiceEnabled]);

  // ── Mission LT : tout ce qui peut être PRÊT avant la première phrase l'est ──
  // 1. La passerelle IA est préchauffée (isolat, connexion, classement,
  //    secrets) dès qu'une traduction devient probable — j'ai choisi une
  //    langue, ou le correspondant en a choisi une — une fois par appel.
  const warmedUpRef = useRef(false);
  const translationLikely = transportEnabled && (!!myLang || !!peerLanguage);
  useEffect(() => {
    if (!translationLikely || warmedUpRef.current) return;
    warmedUpRef.current = true;
    const startedAt = Date.now();
    void warmUpAiGateway('voice').then((ok) => {
      recordCallEvent('captions', `passerelle IA préchauffée : ${ok ? 'oui' : 'non'}`, { ms: Date.now() - startedAt });
      console.info('[appel] passerelle IA préchauffée', { ok, ms: Date.now() - startedAt });
    });
  }, [translationLikely]);
  // 2. La piste « interpreter » est créée et PUBLIÉE dès que je sais dans quelle
  //    langue le correspondant veut m'entendre (« hello »), plus seulement à
  //    la première phrase traduite (audit LT-0 : piste publiée 9–20 s après le
  //    micro). Elle reste silencieuse tant qu'aucune phrase n'est rendue ; la
  //    langue suit ses changements de choix sans republication.
  const earlyVoiceLang = mediaConnected && peerWantsVoice && !agentPresent
    ? (() => { const peer = myEffectiveLanguage(peerLanguage); return peer && peer !== spokenLang ? peer : null; })()
    : null;
  useEffect(() => {
    if (!earlyVoiceLang || !InterpreterVoiceTrack.isSupported()) return;
    const track = ensureVoiceTrackRef.current(earlyVoiceLang);
    void publishInterpreterTrackRef.current(track);
  }, [earlyVoiceLang]);
  // 3. Un agent interprète (serveur) s'annonce : c'est lui qui rend la voix —
  //    ma piste est arrêtée et dépubliée, jamais deux voix pour la même phrase.
  useEffect(() => {
    if (!agentPresent) return;
    const track = voiceTrackRef.current;
    if (!track) return;
    track.stop();
    if (interpreterPublishedRef.current) {
      interpreterPublishedRef.current = false;
      recordCallEvent('voice', 'agent interprète présent — ma piste interprète est dépubliée');
      void unpublishInterpreterAudioRef.current?.().catch(() => {});
    }
  }, [agentPresent]);

  // Mission AU : « media » — j'annonce l'état RÉEL de mon micro (publié /
  // coupé / indisponible avec la raison) à chaque changement, et de nouveau
  // quand le correspondant apparaît. Le canal de données passe par le serveur
  // (fiable), même quand aucun média ne part.
  // Revue AU-6 : « micro en cours d'activation » n'est PAS une indisponibilité
  // — rien n'est annoncé tant que la demande est en vol sans erreur (sinon
  // le correspondant lisait un avis alarmant à chaque début d'appel).
  const micFailure = localMediaError || transport.mediaError;
  const myMicState: CallMediaMessage['mic'] | null = transport.localAudioPublished ? (isMuted ? 'off' : 'on') : (micFailure ? 'unavailable' : null);
  const myMicReason = myMicState === 'unavailable' ? describeMediaError(micFailure) : undefined;
  useEffect(() => {
    if (!mediaConnected || !myMicState) return;
    const message: CallMediaMessage = { t: 'media', v: 1, mic: myMicState };
    if (myMicState === 'unavailable' && myMicReason) message.reason = myMicReason.slice(0, 160);
    void sendDataRef.current(encodeCallData(message), { reliable: true }).catch(() => {});
  }, [mediaConnected, remote?.participant.identity, myMicState, myMicReason]);

  // Mission AU : DIAGNOSTIC de la liaison, chaque sens jugé sur des compteurs
  // WebRTC réels toutes les 5 s (jamais estimé) — affiché à l'écran et
  // journalisé en console (`[appel] média …`), ce qu'un test sur vrai
  // appareil doit relever. Ne dépend pas de la lecture réussie : mesure
  // « octets reçus » ET « lecture autorisée » séparément.
  const [audioLink, setAudioLink] = useState<{ sample: AudioLinkSample; verdict: AudioLinkVerdict } | null>(null);
  const getAudioStatsRef = useRef(transport.getAudioStats);
  getAudioStatsRef.current = transport.getAudioStats;
  const getTransportDiagnosticsRef = useRef(transport.getTransportDiagnostics);
  getTransportDiagnosticsRef.current = transport.getTransportDiagnostics;
  useEffect(() => {
    if (!callAccepted) { setAudioLink(null); return; }
    let prev: AudioLinkSample | null = null;
    let disposed = false;
    const tick = async () => {
      try {
        const stats = await getAudioStatsRef.current();
        if (disposed) return;
        // AU-7 : chemin réseau réellement négocié, à chaque mesure — c'est ce
        // qui distingue « aucun paquet ne part » de « la ligne n'existe pas ».
        try {
          const net = await getTransportDiagnosticsRef.current();
          if (!disposed) recordCallEvent('network', `ligne ${net.connectionState}`, net);
        } catch { /* mesure réseau indisponible : le verdict audio suffit */ }
        const remoteAudio = stats.remote;
        const sample: AudioLinkSample = {
          at: stats.at,
          localPublished: !!stats.local,
          localMuted: !!stats.local?.muted,
          bytesSent: stats.local?.bytesSent ?? null,
          remoteAudioTracks: remoteAudio.length,
          bytesReceived: remoteAudio.length ? remoteAudio.reduce<number | null>((acc, r) => (r.bytesReceived === null ? acc : (acc ?? 0) + r.bytesReceived), null) : null,
          canPlaybackAudio: stats.canPlaybackAudio,
        };
        const verdict = assessAudioLink(prev, sample);
        prev = sample;
        setAudioLink({ sample, verdict });
        console.info(formatAudioLinkLog(isIncoming ? 'appelé' : 'appelant', sample, verdict));
        recordCallEvent('audio', `envoi=${verdict.sending} réception=${verdict.receiving}`, sample);
      } catch (err) {
        if (!disposed) console.warn('[appel] média mesure indisponible', err);
      }
    };
    const first = setTimeout(() => { void tick(); }, 1500);
    const timer = setInterval(() => { void tick(); }, 5000);
    return () => { disposed = true; clearTimeout(first); clearInterval(timer); };
  }, [callAccepted, isIncoming]);

  // Ma voix → sous-titres pour l'autre (seulement si l'un de nous a choisi une langue, micro ouvert).
  // VF-4 : transcription SERVEUR d'abord — ma piste micro est découpée en
  // segments et la passerelle renvoie le texte, la langue détectée et la
  // traduction dans la langue du correspondant (le récepteur n'a alors plus
  // rien à traduire). La reconnaissance du navigateur n'est plus qu'un repli,
  // et si elle manque aussi, l'écran le dit.
  // Mission LT : la langue du correspondant N'EST PLUS une dépendance de cet
  // effet — elle est lue via une ref à CHAQUE segment (`targetLanguage` sous
  // forme de fonction). Avant, chaque « hello » (langue choisie après le
  // décroché, changée en cours d'appel) REDÉMARRAIT la transcription et
  // jetait le segment en cours : première voix traduite 10–20 s après le
  // micro sur les téléphones de l'audit. Le transcripteur ne (re)démarre
  // plus que quand la transcription devient voulue/non voulue, quand MA
  // langue parlée change, ou quand le micro est (re)publié.
  const peerLanguageRef = useRef<string | null>(null);
  peerLanguageRef.current = peerLanguage;
  const spokenLangRef = useRef(spokenLang);
  spokenLangRef.current = spokenLang;
  const captionWanted = mediaConnected && !isMuted && shouldCaptionMyVoice({ myLanguage: hearLanguage, peerLanguage });
  useEffect(() => {
    if (!captionWanted) { setMyLiveText(''); return; }
    const declaredLang = captionLanguageFromTag(mySpeechTag) ?? null;
    /** Langue cible AU MOMENT du segment : celle du correspondant si elle diffère de la mienne. */
    const targetLanguageNow = (): string | undefined => {
      const peerLang = myEffectiveLanguage(peerLanguageRef.current);
      return peerLang && peerLang !== spokenLangRef.current ? peerLang : undefined;
    };
    const send = (text: string, final: boolean, detail?: { id?: string; lang?: string | null; translated?: string | null; targetLang?: string | null; voice?: CallCaptionMessage['voice'] }) => {
      const now = Date.now();
      if (!final) { if (now - lastInterimSentAtRef.current < 400) return; lastInterimSentAtRef.current = now; }
      const lang = detail?.lang !== undefined ? detail.lang : declaredLang;
      const attached = detail?.translated && detail.targetLang ? { translated: detail.translated, targetLang: detail.targetLang } : {};
      const voice = detail?.voice ? { voice: detail.voice } : {};
      void sendDataRef.current(
        encodeCallData({ t: 'caption', v: 1, id: detail?.id ?? crypto.randomUUID(), text, lang, final, ts: now, ...attached, ...voice }),
        { reliable: final },
      ).catch(() => {});
    };
    let disposed = false;
    let browser: CallCaptioner | null = null;
    let server: ServerCaptioner | null = null;
    const startBrowser = (): boolean => {
      if (disposed || !CallCaptioner.isSupported()) return false;
      browser = new CallCaptioner({
        lang: mySpeechTag,
        onInterim: (text) => { setMyLiveText(text); send(text, false); },
        onFinal: (text) => { setMyLiveText(''); send(text, true); },
        onUnavailable: (reason) => setCaptionsUnavailable(reason),
      });
      if (!browser.start()) { browser = null; return false; }
      captionerRef.current = browser;
      return true;
    };
    setCaptionsUnavailable(null);
    if (ServerCaptioner.isSupported()) {
      server = new ServerCaptioner({
        getTrack: () => getLocalAudioTrackRef.current(),
        // Indication de la langue que je PARLE (profil) — jamais celle que je veux entendre.
        languageHint: spokenLang,
        targetLanguage: targetLanguageNow,
        // Pas de texte partiel côté serveur : état local honnête seulement, rien n'est envoyé au correspondant.
        onInterim: (text) => setMyLiveText(text),
        onFinal: (caption) => {
          setMyLiveText('');
          const id = crypto.randomUUID();
          // Mission VT : la VOIX de cette phrase dans la langue du correspondant —
          // rendue par l'agent s'il est là, sinon par MON navigateur dans la piste
          // « interpreter » de l'appel ; 'none' = rendu impossible ici, le
          // correspondant la dira avec la voix de son appareil.
          const wanted = shouldRenderVoiceForPeer({ translated: caption.translated, targetLang: caption.targetLang, sourceLang: caption.language, peerWantsVoice: peerWantsVoiceRef.current, trackSupported: true });
          const voice: CallCaptionMessage['voice'] | undefined = !wanted ? undefined : agentPresentRef.current ? 'agent' : InterpreterVoiceTrack.isSupported() ? 'sent' : 'none';
          send(caption.text, true, { id, lang: caption.language || declaredLang, translated: caption.translated, targetLang: caption.targetLang, voice });
          if (voice === 'sent' && caption.translated) void speakToPeerRef.current(id, caption.translated, caption.targetLang ?? null);
        },
        onUnavailable: (reason) => {
          if (captionerRef.current === server) captionerRef.current = null;
          server = null;
          setMyLiveText('');
          console.info('[appel] sous-titres serveur indisponibles :', reason);
          recordCallEvent('captions', `serveur indisponible : ${reason}`);
          // Repli : reconnaissance du navigateur si elle existe ; sinon on le dit, jamais un silence inexpliqué.
          if (!startBrowser()) setCaptionsUnavailable(`Sous-titres indisponibles : ${reason}`);
        },
        // Mission VT : passerelle en difficulté → pause puis nouvel essai, dit honnêtement à l'écran ; effacé au retour.
        onDegraded: (reason, retryInMs) => {
          console.info('[appel] sous-titres serveur en difficulté :', reason, `nouvel essai dans ${Math.round(retryInMs / 1000)} s`);
          recordCallEvent('captions', `serveur en difficulté : ${reason}`, { retryInMs });
          setMyLiveText('');
          setCaptionsUnavailable(`${reason} — nouvel essai dans ${Math.round(retryInMs / 1000)} s.`);
        },
        onRecovered: () => {
          console.info('[appel] sous-titres serveur rétablis');
          recordCallEvent('captions', 'serveur rétabli');
          setCaptionsUnavailable(null);
        },
        isPaused: () => interpreterSpeakingRef.current,
      });
      if (server.start()) captionerRef.current = server;
    } else if (!startBrowser()) {
      setCaptionsUnavailable('Sous-titres indisponibles sur ce navigateur (ni capture audio, ni reconnaissance vocale).');
    }
    return () => {
      disposed = true;
      server?.stop();
      browser?.stop();
      if (captionerRef.current && (captionerRef.current === server || captionerRef.current === browser)) captionerRef.current = null;
      setMyLiveText('');
    };
    // Revue AU-6 : localAudioPublished — la transcription serveur abandonne
    // après 12 s sans piste ; elle repart quand le micro est réellement publié
    // (« Réessayer le micro » réussi), au lieu de rester muette tout l'appel.
    // Mission LT : peerLanguage/hearLanguage n'agissent que par `captionWanted`
    // (démarrage/arrêt) — la langue cible est lue via une ref à chaque segment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captionWanted, spokenLang, mySpeechTag, transport.localAudioPublished]);

  // Voix de l'interprète dans MA langue — n'existe qu'avec une langue choisie.
  // Le miroir `interpreterSpeakingRef` est posé AVANT le rendu : le captioner
  // serveur jette immédiatement ce que le micro capte pendant que la voix parle.
  useEffect(() => {
    if (!myLang) { voiceRef.current?.stop(); voiceRef.current = null; return; }
    const voice = new InterpreterVoice({
      lang: hearTag,
      onSpeakingChange: (speaking) => { localSpeakingRef.current = speaking; syncSpeaking(); setLocalInterpreterSpeaking(speaking); },
    });
    voiceRef.current = voice;
    return () => {
      voice.stop();
      if (voiceRef.current === voice) voiceRef.current = null;
      localSpeakingRef.current = false;
      syncSpeaking();
      setLocalInterpreterSpeaking(false);
    };
  }, [myLang, hearTag, syncSpeaking]);

  // Mission VT : la piste de l'interprète qui M'EST destinée — rendue par mon
  // correspondant (« interpreter ») ou par l'agent (« interpreter:<mon compte> »),
  // cherchée chez TOUS les participants : l'agent n'est pas le correspondant.
  const myUserId = isIncoming ? callSession.receiverId : callSession.initiatorId;
  const interpreterTrack = transport.remoteParticipants.find((p) => p.interpreterAudioTrack && isInterpreterTrackForMe(p.interpreterAudioTrack.name, myUserId))?.interpreterAudioTrack ?? null;
  useEffect(() => {
    if (!interpreterTrack) return;
    recordCallEvent('voice', 'piste interprète reçue dans l’appel', { name: interpreterTrack.name, from: interpreterTrack.participantIdentity });
    console.info('[appel] piste interprète reçue', { name: interpreterTrack.name, from: interpreterTrack.participantIdentity });
  }, [interpreterTrack]);

  // Mission VT : volume de la voix ORIGINALE du correspondant — COUPÉE quand
  // l'interprète me parle dans ma langue (« j'active le français : je
  // n'entends que le français »), sauf « Entendre aussi l'original » ;
  // inchangée hors interprétation (même langue, « Par défaut », sous-titres
  // seuls, langue de l'autre encore inconnue). Règle pure testée
  // (originalVoiceVolume), commune aux appels AUDIO et VIDÉO : c'est la même
  // piste audio distante dans les deux mises en page. Coupure par `muted` ET
  // volume : iPhone ignore le volume d'un élément audio (la voix originale y
  // restait entière au test), `muted` y est respecté.
  const peerLanguageForVoice = peerLanguageForInterpretation(peerLanguage, peerSpokenLanguage);
  const interpreting = isInterpreting({ myLanguage: myLang, peerLanguage: peerLanguageForVoice, voiceEnabled });
  const originalVolume = originalVoiceVolume({ myLanguage: myLang, peerLanguage: peerLanguageForVoice, voiceEnabled, hearOriginal, interpreterSpeaking, speakerMuted: isSpeakerMuted });
  const originalMuted = isSpeakerMuted || originalVolume === 0;
  const originalMutedRef = useRef(originalMuted);
  originalMutedRef.current = originalMuted;
  const originalVolumeRef = useRef(originalVolume);
  originalVolumeRef.current = originalVolume;
  useEffect(() => {
    remote?.audioTrack?.setVolume?.(originalVolume);
    const el = remoteAudioElRef.current;
    if (el) { el.muted = originalMuted; try { el.volume = originalVolume; } catch { /* volume non réglable (iOS) : muted suffit */ } }
  }, [originalVolume, originalMuted, remote?.audioTrack]);
  // La voix de l'interprète reçue n'est coupée que par le haut-parleur, « Sous-titres seuls »,
  // ou le retour en appel NORMAL (aucune langue choisie : une phrase traduite encore en
  // vol ne doit pas se superposer à la voix originale rétablie).
  const interpreterMuted = isSpeakerMuted || !voiceEnabled || !myLang;
  const interpreterMutedRef = useRef(interpreterMuted);
  interpreterMutedRef.current = interpreterMuted;
  useEffect(() => { if (interpreterAudioElRef.current) interpreterAudioElRef.current.muted = interpreterMuted; }, [interpreterMuted]);

  // Mission VT : le correspondant PARLE en ce moment (détection de parole du
  // serveur, toutes langues) — indispensable quand sa voix originale est
  // coupée : l'écran montre qu'il parle, l'interprète suit.
  const peerSpeaking = !!remote && (transport.activeSpeakerIds ?? []).includes(remote.participant.identity);

  // Fin d'appel / démontage : tout s'arrête net, aucune voix fantôme — ni
  // locale, ni dans la piste envoyée au correspondant.
  useEffect(() => {
    if (callSession.status !== 'connected') { voiceRef.current?.stop(); voiceTrackRef.current?.stop(); setPeerCaption(null); setRecentCaptions([]); }
  }, [callSession.status]);
  useEffect(() => () => {
    captionerRef.current?.stop();
    voiceRef.current?.stop();
    voiceTrackRef.current?.dispose();
    voiceTrackRef.current = null;
    if (remoteVoiceWatchdogRef.current) clearTimeout(remoteVoiceWatchdogRef.current);
  }, []);

  const interpreterActive = callSession.status === 'connected' && (!!myLang || !!peerLanguage);
  // Mission VT : le panneau sert d'abord à CHOISIR la langue dans laquelle
  // j'entends le correspondant — avant le décroché et pendant l'appel. Sans
  // choix, l'appel reste normal et le panneau le dit.
  const canChooseLanguage = !!onHearLanguageChange;
  const panelVisible = callSession.status === 'connected' ? (interpreterActive || canChooseLanguage) : (callSession.status === 'ringing' && canChooseLanguage);
  const quality = describeConnectionQuality(transport.connectionQuality);

  // Timer for duration when connected
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callSession.status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callSession.status]);

  // Sonnerie : DÉPLACÉE hors de ce composant (Équipe 8, loop 6). L'audio de
  // sonnerie (entrante, avec la sonnerie choisie par l'utilisateur et la
  // vibration coordonnée) et la tonalité de retour d'appel (côté appelant)
  // sont pilotés par MoocChatFloating via services/calls/ringtoneService —
  // l'UNIQUE source sonore. L'ancienne tonalité WebAudio locale de ce modal
  // (Équipe F2) se superposait à celle du service : deux générateurs pour un
  // même appel. Ce composant ne garde que l'AFFICHAGE de l'appel.

  // ── Attache des pistes réelles (Équipe 7, A3) ─────────────────────────
  // Même patron éprouvé que RemoteParticipantTile / localVideoTrackRef du
  // LIVE : callback refs AVEC detach() quand l'élément disparaît ou que la
  // piste change — l'ancienne version n'appelait jamais detach(), donc un
  // élément retiré du DOM continuait de jouer (fuite mémoire + écho).
  // L'audio vit dans ses propres éléments pour que couper la caméra ne
  // coupe jamais le son.

  // Le distant peut publier caméra ET partage d'écran : l'écran, s'il
  // existe, prend la scène (c'est ce que B veut montrer à A).
  const remoteMainTrack = remote?.screenShareTrack ?? remote?.videoTrack ?? null;
  const remoteMainIsScreen = !!remote?.screenShareTrack;

  const remoteVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) remoteMainTrack?.attach(el);
    else remoteMainTrack?.detach();
  }, [remoteMainTrack]);

  // Coupure haut-parleur appliquée via une ref miroir : jamais dans les
  // dépendances du callback ref, sinon chaque bascule détacherait puis
  // rattacherait la piste audio (micro-coupure audible).
  const speakerMutedRef = useRef(isSpeakerMuted);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const interpreterAudioElRef = useRef<HTMLAudioElement | null>(null);
  const remoteScreenAudioElRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    speakerMutedRef.current = isSpeakerMuted;
    if (remoteScreenAudioElRef.current) remoteScreenAudioElRef.current.muted = isSpeakerMuted;
  }, [isSpeakerMuted]);

  const remoteAudioRef = useCallback((el: HTMLAudioElement | null) => {
    remoteAudioElRef.current = el;
    if (el) {
      remote?.audioTrack?.attach(el);
      // Mission VT : règle « ma langue seulement » appliquée dès l'attache (muted + volume, jamais l'un sans l'autre).
      el.muted = originalMutedRef.current;
      try { el.volume = originalVolumeRef.current; } catch { /* iOS : volume non réglable */ }
    } else {
      remote?.audioTrack?.detach();
    }
  }, [remote?.audioTrack]);

  // Mission VT : la voix de l'interprète reçue dans l'appel — jouée par le
  // MÊME chemin que la voix originale (élément audio attaché à la piste),
  // celui qui a fonctionné sur les vrais téléphones.
  const interpreterAudioRef = useCallback((el: HTMLAudioElement | null) => {
    interpreterAudioElRef.current = el;
    if (el) {
      interpreterTrack?.attach(el);
      el.muted = interpreterMutedRef.current;
    } else {
      interpreterTrack?.detach();
    }
  }, [interpreterTrack]);

  // Son d'un partage d'écran distant (onglet avec vidéo…) — souscrit par le
  // hook (Équipe F3) mais jamais joué ici jusqu'à présent.
  const remoteScreenAudioRef = useCallback((el: HTMLAudioElement | null) => {
    remoteScreenAudioElRef.current = el;
    if (el) {
      remote?.screenShareAudioTrack?.attach(el);
      el.muted = speakerMutedRef.current;
    } else {
      remote?.screenShareAudioTrack?.detach();
    }
  }, [remote?.screenShareAudioTrack]);

  const localVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) transport.localVideoTrack?.attach(el);
    else transport.localVideoTrack?.detach();
  }, [transport.localVideoTrack]);
  const localScreenRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) transport.localScreenShareTrack?.attach(el);
    else transport.localScreenShareTrack?.detach();
  }, [transport.localScreenShareTrack]);

  const toggleMic = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try { await transport.setMicrophoneEnabled(!next); } catch { setIsMuted(!next); }
  };

  const toggleCamera = async () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    try { await transport.setCameraEnabled(!next); } catch { setIsVideoOff(!next); }
  };

  // Bascule avant/arrière (loop 7) : proposée seulement quand l'appareil a
  // réellement plusieurs caméras — enumerateDevices est réévalué une fois le
  // média connecté (avant la permission, les navigateurs masquent souvent la
  // liste réelle). Échec silencieux = pas de bouton, jamais un bouton mort.
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  useEffect(() => {
    if (!mediaConnected) return;
    let cancelled = false;
    (async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        if (!cancelled) setHasMultipleCameras(devices.filter((d) => d.kind === 'videoinput').length > 1);
      } catch { /* API indisponible : le bouton reste masqué */ }
    })();
    return () => { cancelled = true; };
  }, [mediaConnected]);

  const flipCamera = async () => {
    try { await transport.switchCamera(); } catch {
      // Une seule caméra réellement utilisable ou capture refusée : l'état
      // du hook n'a pas bougé, l'appel continue tel quel.
    }
  };

  const isScreenSharing = !!transport.localScreenShareTrack;
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) await transport.stopScreenShare();
      else await transport.startScreenShare();
    } catch {
      // Partage annulé ou non supporté : rien à casser, l'appel continue.
    }
  };

  const peerName = isIncoming ? callSession.initiatorName : callSession.receiverName;
  const peerAvatar = isIncoming ? callSession.initiatorAvatar : callSession.receiverAvatar;
  const showVideoLayout = callSession.status === 'connected' && (callSession.type === 'video' || !!remoteMainTrack || isScreenSharing);

  // État réseau honnête (Équipe 7, A5) : « Connexion… » tant que le média
  // n'est pas là, « Reconnexion… » quand le transport le dit — jamais un
  // écran figé sans explication.
  const connectionLabel =
    callSession.status !== 'connected' ? null
      : transport.connectionState === 'reconnecting' ? 'Reconnexion…'
        : transport.connectionState === 'failed' ? 'Connexion perdue'
          : !mediaConnected ? 'Connexion…'
            : null;

  // ── Chrome d'appel qui s'estompe (Équipe 7, A5) ───────────────────────
  // En vidéo connectée, barres et contrôles disparaissent après 3,5 s sans
  // interaction (les personnes prennent tout l'écran) et réapparaissent au
  // premier toucher/mouvement. Pendant la sonnerie ou en appel audio, tout
  // reste visible — rien à masquer d'important derrière.
  const canAutoHide = callSession.status === 'connected' && showVideoLayout;
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canAutoHideRef = useRef(canAutoHide);
  const lastMoveRevealRef = useRef(0);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!canAutoHideRef.current) return;
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);
  const onChromeMouseMove = useCallback(() => {
    if (!canAutoHideRef.current) return;
    const now = Date.now();
    if (now - lastMoveRevealRef.current < 500) return; // anti-tempête mousemove
    lastMoveRevealRef.current = now;
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    canAutoHideRef.current = canAutoHide;
    setControlsVisible(true);
    if (canAutoHide) scheduleHide();
    else if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [canAutoHide, scheduleHide]);

  const chromeShown = controlsVisible || !canAutoHide;
  const chromeClass = chromeShown ? 'opacity-100' : 'opacity-0 pointer-events-none';

  // ── Aperçu local déplaçable (Équipe 7, A5) ────────────────────────────
  // Incrustation façon téléphone : glissable au doigt/à la souris dans les
  // limites de la scène (pointer capture — un seul jeu d'événements pour
  // tactile et souris). Position null = coin haut-droit par défaut.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);
  const pipDragRef = useRef<{ dx: number; dy: number; dragging: boolean }>({ dx: 0, dy: 0, dragging: false });

  const onPipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pipDragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, dragging: true };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* non supporté */ }
  };
  const onPipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pipDragRef.current.dragging || !stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const pipRect = e.currentTarget.getBoundingClientRect();
    const margin = 8;
    const x = Math.min(
      Math.max(e.clientX - stageRect.left - pipDragRef.current.dx, margin),
      Math.max(margin, stageRect.width - pipRect.width - margin)
    );
    const y = Math.min(
      Math.max(e.clientY - stageRect.top - pipDragRef.current.dy, margin),
      Math.max(margin, stageRect.height - pipRect.height - margin)
    );
    setPipPos({ x, y });
  };
  const onPipPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pipDragRef.current.dragging = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
  };
  // La géométrie du cadre change (plein écran ↔ fenêtré) : des coordonnées
  // mémorisées pourraient sortir du champ — retour au coin par défaut.
  useEffect(() => { setPipPos(null); }, [isFullscreen]);

  return (
    /* Équipe 8 (loop 2) : z-[210] — l'interface d'appel passe AU-DESSUS de
       tout le reste de l'app (dock mobile et barre Architecte z-[60], fenêtre
       de chat z-[70], lightbox z-90, LIVE plein écran z-[200]) : un appel
       entrant est immédiatement visible où que soit l'utilisateur, sans
       jamais devoir ouvrir la messagerie. */
    <div className={`fixed inset-0 z-[210] flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all ${isFullscreen ? 'p-0' : 'p-0 sm:p-4'}`}>
      {/* AU-8 : SUR TÉLÉPHONE, L'APPEL PREND TOUT L'ÉCRAN — comme une vraie
          application d'appel. L'ancienne carte imposait sa hauteur par une
          proportion écrite dans la syntaxe de Tailwind 4 alors que le site
          charge Tailwind 3 (cdn.tailwindcss.com) : la classe était ignorée EN
          SILENCE, la carte n'avait donc plus aucune hauteur en dessous de
          640 px et se réduisait à la taille de son contenu — la bande étroite
          constatée sur iPhone. La variante `sm:` masquait le défaut sur
          ordinateur. Désormais : hauteur pleine sur téléphone, donc jamais de
          rétrécissement ; carte carrée seulement à partir de `sm`.
          Garde-fou de non-régression : tests/tailwindClassValidity.test.ts. */}
      <div
        className={`relative bg-slate-900 text-white shadow-2xl overflow-hidden flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full h-full rounded-none border-0' : 'w-full h-full rounded-none border-0 sm:h-auto sm:aspect-square sm:max-h-[85vh] sm:max-w-lg sm:rounded-3xl sm:border sm:border-slate-700/60'}`}
        onPointerDown={revealControls}
        onPointerUp={onCallScreenGesture}
        onMouseMove={onChromeMouseMove}
      >

        {/* L'audio distant vit HORS des deux mises en page (audio/vidéo) :
            il doit jouer dans les deux cas, dès que la piste réelle arrive.
            (+ le son d'un partage d'écran distant, jusqu'ici jeté.)
            VF-3 : jamais AVANT le décroché — avec la pré-connexion, la piste
            de l'appelant est souscrite pendant que ça sonne chez l'appelé ;
            sans élément attaché, rien n'est joué tant qu'il n'a pas décroché. */}
        {callAccepted && remote?.audioTrack && <audio ref={remoteAudioRef} autoPlay data-testid="original-audio" />}
        {callAccepted && interpreterTrack && <audio ref={interpreterAudioRef} autoPlay data-testid="interpreter-audio" />}
        {callAccepted && remote?.screenShareAudioTrack && <audio ref={remoteScreenAudioRef} autoPlay />}

        {/* Scène : le CORRESPONDANT occupe tout le cadre. */}
        <div ref={stageRef} className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">

          {showVideoLayout ? (
            <>
              {/* Flux distant RÉEL plein cadre — l'avatar n'est plus qu'un
                  état d'attente honnête tant que la piste du correspondant
                  n'est pas là. Un écran partagé s'affiche entier (contain),
                  un visage remplit le cadre (cover). */}
              <div className="w-full h-full relative flex items-center justify-center">
                {remoteMainTrack ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full ${remoteMainIsScreen ? 'object-contain bg-black' : 'object-cover'}`}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <img src={peerAvatar} className="w-24 h-24 rounded-full object-cover ring-2 ring-white/20" alt={peerName} />
                    {/* AU-8 : ne plus AFFIRMER « caméra coupée » alors qu'on ne
                        le sait pas. `videoEnabled` vient de l'état réel de
                        publication du correspondant côté SDK : quand il dit
                        non, c'est un fait ; sinon la caméra est publiée et
                        c'est nous qui attendons encore son image. */}
                    <span className="text-xs font-semibold">
                      {!remote
                        ? `En attente de ${peerName}…`
                        : remote.participant.videoEnabled === false
                          ? `${peerName} a coupé sa caméra`
                          : `En attente de l’image de ${peerName}…`}
                    </span>
                  </div>
                )}

                <div className={`absolute ${panelVisible ? 'bottom-[22rem]' : 'bottom-28'} left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-opacity duration-300 ${chromeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${remote ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                  <span>{peerName}</span>
                  {remoteMainIsScreen && <span className="text-[10px] font-semibold text-indigo-200">— partage d'écran</span>}
                </div>
              </div>

              {/* Aperçu local (caméra ou écran partagé) : incrustation
                  DÉPLAÇABLE — reste visible même quand le chrome s'estompe,
                  comme sur un vrai téléphone. */}
              <div
                /* AU-8 : même défaut ici — la proportion était écrite dans la
                   syntaxe de Tailwind 4, ignorée par le Tailwind 3 du site : la
                   vignette de MA caméra n'avait aucune hauteur. Syntaxe valide
                   en Tailwind 3 : les crochets, ci-dessous. */
                className={`absolute w-24 sm:w-32 aspect-[3/4] rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-800 z-30 touch-none cursor-grab active:cursor-grabbing select-none ${pipPos ? '' : 'top-16 right-3'}`}
                style={pipPos ? { left: pipPos.x, top: pipPos.y } : undefined}
                onPointerDown={onPipPointerDown}
                onPointerMove={onPipPointerMove}
                onPointerUp={onPipPointerEnd}
                onPointerCancel={onPipPointerEnd}
              >
                {isScreenSharing ? (
                  <video ref={localScreenRef} autoPlay playsInline muted className="w-full h-full object-cover pointer-events-none" />
                ) : transport.localVideoTrack && !isVideoOff ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className={`w-full h-full object-cover pointer-events-none ${transport.cameraFacing === 'user' ? 'scale-x-[-1]' : ''}`} />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center pointer-events-none">
                    <User size={24} />
                    <span className="text-[9px] mt-1">Caméra coupée</span>
                  </div>
                )}
                {isMuted && (
                  <div className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white pointer-events-none">
                    <MicOff size={10} />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Audio Calling Screen — pb-28 : les contrôles flottants (A5)
               recouvrent le bas de la scène, le contenu reste au-dessus.
               HL-5 : avec la carte de l'interprète, le contenu remonte
               (pb-60) pour que nom, état et durée restent lisibles. */
            <div className={`flex flex-col items-center justify-center px-6 pt-16 ${panelVisible ? 'pb-72 space-y-3' : 'pb-28 space-y-6'} text-center z-10 animate-fade-in`}>
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-indigo-600/30 animate-ping opacity-75"></div>
                <div className="absolute -inset-8 rounded-full bg-indigo-500/20 animate-pulse"></div>
                {/* VF-1 : un appel arrivé par push peut ne porter aucun avatar —
                    un repli neutre plutôt qu'une image vide (src=""). */}
                {peerAvatar ? (
                  <img
                    src={peerAvatar}
                    className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-indigo-500 shadow-2xl mx-auto"
                    alt={peerName}
                  />
                ) : (
                  <div className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-slate-800 ring-4 ring-indigo-500 shadow-2xl mx-auto flex items-center justify-center text-slate-300" aria-label={peerName}>
                    <User size={48} />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">{peerName}</h3>
                <p className="text-xs font-semibold text-indigo-300">
                  {callSession.status === 'ringing'
                    ? (isIncoming
                      ? (callSession.type === 'video' ? 'Appel vidéo entrant…' : 'Appel audio entrant…')
                      : 'Sonnerie en cours…')
                    : connectionLabel
                      ? connectionLabel
                      : remote?.audioTrack
                        ? 'Appel vocal connecté'
                        : `En attente de ${peerName}…`}
                </p>
                {/* VF-3 : pendant la sonnerie, état honnête de la ligne
                    préparée en avance — visible, discret, jamais alarmant :
                    un échec ici n'empêche rien, on retente au décroché. */}
                {callSession.status === 'ringing' && transportConnected && (
                  <p className="text-[10px] font-semibold text-emerald-300/90 inline-flex items-center gap-1 justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                    Ligne prête
                  </p>
                )}
                {callSession.status === 'ringing' && !transportConnected && transport.error && (
                  <p className="text-[10px] font-semibold text-slate-400">Ligne en attente : la connexion sera établie au décroché.</p>
                )}
                {callSession.status === 'connected' && mediaConnected && (
                  <p className="text-2xl font-mono font-bold text-white/90 tabular-nums pt-1">{formatCallDuration(duration)}</p>
                )}
              </div>

              {/* Indicateur d'activité — affiché UNIQUEMENT quand la piste
                  audio distante existe réellement (jamais une animation
                  au-dessus d'un silence). */}
              {callSession.status === 'connected' && remote?.audioTrack && (
                <div className="flex items-center justify-center gap-1.5 h-10 px-6 py-2 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
                  {[20, 45, 80, 60, 100, 75, 40, 90, 60, 30, 85, 45, 70, 95, 35].map((h, i) => (
                    <span
                      key={i}
                      style={{ height: `${h}%` }}
                      className="w-1 bg-indigo-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              )}

              {/* Erreur de transport : montrée comme telle une fois l'appel
                  accepté seulement — pendant la sonnerie, la ligne « en
                  attente » ci-dessus suffit (la connexion sera retentée). */}
              {callAccepted && transport.error && (
                <p className="text-[11px] font-semibold text-rose-300 max-w-xs">
                  Média indisponible : {transport.error}
                </p>
              )}
            </div>
          )}

        </div>

        {/* Mission AU : BANNIÈRE micro — en haut, au-dessus de tout, jamais
            masquée par la barre de commandes (l'ancien texte était caché
            sous elle), avec l'action qui répare : « Réessayer le micro »,
            exécutée dans le geste utilisateur. Tant que mon micro n'est pas
            publié, le correspondant N'ENTEND RIEN : c'est l'information la
            plus importante de l'écran après le bouton « Activer le son ». */}
        {/* Revue AU-6 : les avis du haut sont EMPILÉS dans un seul conteneur
            (bouton son, bannière micro, erreur caméra, avis du correspondant,
            conseil réseau) — plus jamais des positions absolues qui se
            recouvraient sur 390 px. */}
        {callAccepted && (
          <div className="absolute top-14 inset-x-3 z-40 flex flex-col items-stretch gap-2 pointer-events-none">
            {/* Équipe 7 (A2) : remède au silence d'autoplay — ne s'estompe
                JAMAIS : tant que le navigateur bloque le son, c'est l'action la
                plus importante de l'écran. */}
            {transport.audioPlaybackBlocked && (
              <button
                onClick={(e) => { e.stopPropagation(); unlockInterpreterAudio(); void transport.startAudio(); }}
                className="pointer-events-auto self-center px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-xl flex items-center gap-2"
              >
                <Volume2 size={14} /> Activer le son
              </button>
            )}

            {/* Mission AU : BANNIÈRE micro — avec l'action qui répare,
                « Réessayer le micro », exécutée dans le geste utilisateur. Tant
                que mon micro n'est pas publié, le correspondant N'ENTEND RIEN. */}
            {!transport.localAudioPublished && (micFailure || reconnectingForMic) && (
              <div role="alert" className="pointer-events-auto rounded-2xl bg-rose-600/95 text-white shadow-2xl px-3.5 py-2.5 flex items-start gap-2.5">
                <AlertTriangle size={16} className="flex-shrink-0 mt-0.5 text-amber-200" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="text-xs font-extrabold leading-snug">{peerName} ne vous entend pas — micro indisponible</p>
                  <p className="text-[11px] leading-snug text-rose-50/95">
                    {reconnectingForMic && !micFailure ? 'Reconnexion de la ligne et activation du micro…' : describeMediaError(micFailure)}
                  </p>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); void retryMicrophone(); }}
                    disabled={retryingMic || reconnectingForMic}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white text-rose-700 text-[11px] font-extrabold shadow disabled:opacity-60"
                  >
                    <RefreshCw size={12} className={retryingMic || reconnectingForMic ? 'animate-spin' : ''} />
                    {reconnectingForMic ? 'Reconnexion…' : retryingMic ? 'Activation…' : 'Réessayer le micro'}
                  </button>
                </div>
              </div>
            )}

            {/* Revue AU-6 : erreur CAMÉRA seule (micro publié) — avant, plus
                rien ne l'expliquait (permission refusée, webcam absente,
                caméra prise par une autre application). */}
            {transport.localAudioPublished && micFailure && callSession.type === 'video' && (
              <div role="status" className="pointer-events-auto rounded-2xl bg-amber-500/95 text-slate-950 shadow-xl px-3.5 py-2 text-[11px] font-semibold leading-snug flex items-start gap-2">
                <VideoOff size={14} className="flex-shrink-0 mt-0.5" />
                <span>Caméra indisponible : {describeCameraError(micFailure)}</span>
              </div>
            )}

            {/* Mission AU : ce que le correspondant annonce de SON micro — sinon
                « il se tait » et « son micro ne marche pas » sont indiscernables. */}
            {transport.localAudioPublished && peerMediaNotice(peerName, peerMedia) && (
              <div role="status" className={`pointer-events-auto rounded-2xl ${peerMedia?.mic === 'unavailable' ? 'bg-amber-500/95 text-slate-950' : 'bg-slate-800/90 text-slate-100'} shadow-xl px-3.5 py-2 text-[11px] font-semibold leading-snug flex items-start gap-2`}>
                <MicOff size={14} className="flex-shrink-0 mt-0.5" />
                <span>{peerMediaNotice(peerName, peerMedia)}</span>
              </div>
            )}

            {/* AU-13 : la ligne se rétablit EN BOUCLE. Les rapports de deux
                vrais appareils ont montré ce motif exact — une reconnexion
                toutes les ~16 s, chacune coupant le son des deux côtés. Sans
                ce message, l'utilisateur ne voit qu'un « micro non publié »
                et croit que son téléphone est en cause : c'est la LIGNE. */}
            {callAccepted && transport.reconnectCount >= LINE_FLAPPING_THRESHOLD && (
              <div role="status" data-testid="line-flapping-notice" className="pointer-events-auto rounded-2xl bg-amber-500/95 text-slate-950 shadow-xl px-3.5 py-2 text-[11px] font-semibold leading-snug flex items-start gap-2">
                <RefreshCw size={14} className="flex-shrink-0 mt-0.5 animate-spin" />
                <span>La ligne du serveur d’appel se rétablit en boucle ({transport.reconnectCount} fois) : le son sera coupé par intermittence des deux côtés. Ce n’est pas votre micro — c’est la connexion au serveur.</span>
              </div>
            )}

            {/* HL-3 : conseil honnête quand le réseau est réellement faible. */}
            {mediaConnected && quality.hint && !transport.audioPlaybackBlocked && (
              <div className="pointer-events-auto self-center max-w-[90%] px-3 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 text-[11px] font-semibold shadow-lg text-center">
                {quality.hint}
              </div>
            )}
          </div>
        )}

        {/* Mission AU : diagnostic des DEUX sens, mesuré sur les compteurs
            réels — discret, sous la barre du haut ; ne s'estompe pas quand un
            sens est en défaut (c'est précisément ce qu'il faut voir). */}
        {callAccepted && audioLink && (() => {
          const d = describeAudioLink(audioLink.verdict);
          const tone = (t: 'ok' | 'warn' | 'bad' | 'muted') => t === 'ok' ? 'text-emerald-300' : t === 'bad' ? 'text-rose-300' : t === 'muted' ? 'text-slate-300' : 'text-amber-200';
          const dot = (t: 'ok' | 'warn' | 'bad' | 'muted') => t === 'ok' ? 'bg-emerald-400' : t === 'bad' ? 'bg-rose-400' : t === 'muted' ? 'bg-slate-400' : 'bg-amber-300 animate-pulse';
          const anyBad = d.sending.tone === 'bad' || d.receiving.tone === 'bad';
          return (
            <div
              data-testid="audio-link-diagnostic"
              className={`absolute ${panelVisible ? 'bottom-[22rem]' : 'bottom-[6.5rem]'} right-3 z-20 rounded-xl bg-black/55 backdrop-blur-md px-2.5 py-1.5 text-[10px] font-bold flex flex-col gap-0.5 transition-opacity duration-300 ${anyBad ? 'opacity-100' : chromeClass}`}
              title="Mesuré sur les compteurs audio réels (octets envoyés / reçus), toutes les 5 s"
            >
              <span className={`inline-flex items-center gap-1.5 ${tone(d.sending.tone)}`}><span className={`w-1.5 h-1.5 rounded-full ${dot(d.sending.tone)}`}></span>{d.sending.label}</span>
              <span className={`inline-flex items-center gap-1.5 ${tone(d.receiving.tone)}`}><span className={`w-1.5 h-1.5 rounded-full ${dot(d.receiving.tone)}`}></span>{d.receiving.label}</span>
            </div>
          );
        })()}

        {/* ── Interprète IA (HL-4 / Mission VT) : sous-titres + choix de langue ──
            Visible dès la sonnerie quand la langue peut être choisie (avant
            le décroché), puis pendant l'appel. Chez moi en « Par défaut »
            alors que l'autre a une langue : une simple transparence (« vos
            paroles lui sont sous-titrées »). */}
        {panelVisible && (
          <div className="absolute inset-x-3 bottom-[7.25rem] z-30 pointer-events-none">
            <div className="pointer-events-auto mx-auto max-w-md rounded-2xl bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-2xl px-3.5 py-2.5 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-indigo-200 min-w-0 truncate">
                  <Languages size={12} className="flex-shrink-0" />
                  <span className="truncate">
                    {callSession.status !== 'connected'
                      ? 'Traduction vocale pour cet appel'
                      : myLang
                        ? `Interprète IA · ${peerLanguageForVoice && peerLanguageForVoice !== myLang ? `${getLanguageLabel(peerLanguageForVoice)} → ` : ''}${getLanguageLabel(myLang)}`
                        : peerLanguage
                          ? (peerWantsVoice && InterpreterVoiceTrack.isSupported()
                            ? `${peerName} vous entend en ${getLanguageLabel(peerLanguage)} (voix traduite)`
                            : `Vos paroles sont sous-titrées pour ${peerName}`)
                          : 'Appel normal · voix originales'}
                  </span>
                </span>
                {callSession.status === 'connected' && myLang && (
                  <div className="flex-shrink-0 flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setVoiceEnabled((v) => !v); }}
                      aria-pressed={voiceEnabled}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${voiceEnabled ? 'bg-indigo-600 text-white' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
                      title={voiceEnabled ? 'Voix de l’interprète activée — cliquer pour ne garder que les sous-titres' : 'Activer la voix de l’interprète'}
                    >
                      {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
                      <span>{voiceEnabled ? 'Voix' : 'Sous-titres seuls'}</span>
                    </button>
                    {/* Mission VT : « ma langue seule » (voix originale coupée) ↔ « original aussi » (atténuée pendant l'interprète). */}
                    {interpreting && (
                      <button
                        type="button"
                        data-testid="hear-original-toggle"
                        onClick={(e) => { e.stopPropagation(); setHearOriginal((v) => !v); }}
                        aria-pressed={hearOriginal}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${hearOriginal ? 'bg-amber-500 text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/20'}`}
                        title={hearOriginal
                          ? 'Vous entendez aussi la voix originale (atténuée pendant l’interprète) — cliquer pour n’entendre que votre langue'
                          : 'Vous n’entendez que votre langue — cliquer pour entendre aussi la voix originale'}
                      >
                        {hearOriginal ? <Ear size={12} /> : <EarOff size={12} />}
                        <span>{hearOriginal ? 'Original aussi' : 'Ma langue seule'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Mission VT : choix de la langue dans laquelle J'ENTENDS le
                  correspondant — avant le décroché et pendant l'appel, propre
                  à CET appel (jamais actif par défaut). Le changement remonte
                  au parent → hearLanguage → hello au correspondant (il rend sa
                  voix traduite dans la piste de l'appel) + interprète relancé
                  chez moi. Le geste déverrouille aussi l'audio (autoplay mobile).
                  Mission LT (demande utilisateur) : une CASE bien visible, avec
                  une liste déroulante clairement identifiable — la langue
                  active se lit d'un coup d'œil (drapeau + nom, état « Traduction
                  active » / « Appel normal »), et se change en un geste (44 px,
                  liste native du téléphone). */}
              {onHearLanguageChange && (
                <div
                  data-testid="call-language-box"
                  className={`rounded-xl border-2 px-3 py-2 transition-colors ${myLang ? 'border-emerald-400/90 bg-emerald-500/15' : 'border-white/25 bg-white/10'}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wide text-white min-w-0 truncate">
                      <Ear size={13} className="flex-shrink-0" />
                      <span className="truncate">Entendre {peerName} en</span>
                    </span>
                    <span
                      data-testid="call-language-state"
                      className={`flex-shrink-0 text-[10px] font-extrabold px-2 py-0.5 rounded-md ${myLang ? 'bg-emerald-400 text-slate-950' : 'bg-white/15 text-slate-100'}`}
                    >
                      {myLang ? 'Traduction active' : 'Appel normal'}
                    </span>
                  </div>
                  <div className="relative">
                    <select
                      data-testid="call-language-select"
                      aria-label={`Entendre ${peerName} en`}
                      value={myLang ?? ''}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); unlockInterpreterAudio(); onHearLanguageChange(e.target.value || null); }}
                      className="w-full h-11 appearance-none rounded-lg bg-white text-slate-900 pl-3 pr-10 text-sm font-extrabold shadow-inner focus:outline-none focus:ring-2 focus:ring-emerald-400 cursor-pointer"
                    >
                      <option value="">Voix originale · appel normal</option>
                      {MESSAGING_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>{`${l.flag} ${l.label}`}</option>
                      ))}
                    </select>
                    <ChevronDown size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-600" aria-hidden="true" />
                  </div>
                </div>
              )}
              {callSession.status !== 'connected' && (
                <p className="text-[10px] text-slate-400">
                  {myLang
                    ? `Vous entendrez ${peerName} en ${getLanguageLabel(myLang)} : sa voix originale sera coupée, une voix traduite la remplace.`
                    : `Sans choix, l’appel reste normal : vous entendez la voix originale de ${peerName}. Choisissez une langue pour l’entendre traduit dès le décroché.`}
                </p>
              )}
              {callSession.status === 'connected' && !myLang && (
                <p className="text-[10px] text-slate-400">Vous entendez la voix originale de {peerName}. Choisissez une langue pour l’entendre traduit, en temps réel.</p>
              )}

              {/* Mission VT : le correspondant parle (détection serveur) — visible
                  surtout quand sa voix originale est coupée ; sinon l'état
                  d'écoute honnête. */}
              {callSession.status === 'connected' && myLang && interpreting && (
                <p data-testid="peer-speaking" className={`text-[10px] font-semibold flex items-center gap-1.5 ${peerSpeaking ? 'text-emerald-300' : 'text-slate-400'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${peerSpeaking ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                  <span className="truncate">
                    {peerSpeaking
                      ? `${peerName} parle…`
                      : hearOriginal
                        ? `Voix originale audible, atténuée pendant l’interprète`
                        : `Voix originale coupée — vous n’entendez que ${getLanguageLabel(myLang)}`}
                  </span>
                </p>
              )}

              {myLang && (
                peerCaption ? (
                  <div className="space-y-0.5">
                    {recentCaptions.length > 0 && (
                      <p className="text-[11px] text-slate-400 truncate">{recentCaptions[0].translated}</p>
                    )}
                    <p className={`text-sm sm:text-base font-semibold leading-snug text-white ${peerCaption.final ? '' : 'italic text-slate-200'}`}>
                      {peerCaption.final
                        ? (peerCaption.translated ?? (peerCaption.pending ? '…' : peerCaption.original))
                        : peerCaption.original}
                    </p>
                    {peerCaption.final && peerCaption.translated && peerCaption.translated !== peerCaption.original && (
                      <p className="text-[11px] text-slate-300/90 italic truncate" title={peerCaption.original}>{peerCaption.original}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-300">
                    {peerLanguage
                      ? `${peerName} parle ${getLanguageLabel(peerLanguage)} — ses paroles arrivent ici dans votre langue.`
                      : `En attente des paroles de ${peerName}…`}
                  </p>
                )
              )}
              {myLiveText && <p className="text-[10px] text-indigo-200/80 truncate">Vous : {myLiveText}</p>}
              {captionsUnavailable && <p className="text-[10px] text-amber-300">{captionsUnavailable}</p>}
            </div>
          </div>
        )}

        {/* Top Floating Bar — s'estompe avec le reste du chrome en vidéo. */}
        <div className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between transition-opacity duration-300 ${chromeClass}`}>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Libellé HONNÊTE : le média WebRTC est chiffré en transit
                (DTLS-SRTP) — jamais présenté comme du bout-en-bout, qui
                n'existe pas ici (le serveur SFU voit les flux). */}
            <div className="px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
              <Shield size={12} className="text-indigo-200" />
              <span>Média chiffré en transit</span>
            </div>
            {/* HL-3 : qualité réseau RÉELLE (mesurée par le transport) — la
                cause la plus fréquente des coupures devient visible. */}
            {callSession.status === 'connected' && mediaConnected && transport.connectionQuality !== 'unknown' && (
              <div
                className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 ${quality.className}`}
                title={quality.hint || 'Qualité de connexion mesurée en direct'}
              >
                {transport.connectionQuality === 'lost' ? <WifiOff size={12} /> : <Wifi size={12} />}
                <span>{quality.label}</span>
              </div>
            )}
            {callSession.status === 'connected' && (
              connectionLabel ? (
                <div className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 ${connectionLabel === 'Connexion perdue' ? 'bg-rose-600/80 text-white' : 'bg-amber-600/80 text-white'}`}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>{connectionLabel}</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-full bg-emerald-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1 tabular-nums">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>{formatCallDuration(duration)}</span>
                </div>
              )
            )}
            {/* VF-3 : latence RÉELLE mesurée du décroché à la première voix
                distante — affichée 4 s, jamais une estimation. */}
            {latencyBadge && (
              <div className="px-2.5 py-1 rounded-full bg-slate-800/80 backdrop-blur-md text-[11px] font-bold text-emerald-200 flex items-center gap-1.5" title="Délai mesuré entre le décroché et la première voix de votre correspondant">
                <Zap size={12} className="text-emerald-300" />
                <span>{latencyBadge}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Rangée de contrôles flottante (Équipe 7, A5) — discrète, en bas,
            raccrocher rouge au CENTRE ; s'estompe après 3,5 s en vidéo. */}
        <div className={`absolute bottom-0 inset-x-0 z-20 p-4 pb-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center transition-opacity duration-300 ${chromeClass}`}>

          {isIncoming && callSession.status === 'ringing' ? (
            /* Équipe 8 (loop 2) : Décrocher/Refuser LARGES et tactiles
               (72 px — bien au-delà du minimum 44 px), vert/rouge sans
               ambiguïté, libellés explicites sous chaque bouton. */
            <div className="flex items-center justify-center gap-12 sm:gap-16 w-full">
              <div className="text-center space-y-1.5">
                <button
                  onClick={handleReject}
                  aria-label="Refuser l'appel"
                  className="w-[4.5rem] h-[4.5rem] rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all hover:scale-110 active:scale-95"
                >
                  <PhoneOff size={28} />
                </button>
                <span className="text-xs font-bold text-rose-300 block">Refuser</span>
              </div>

              <div className="text-center space-y-1.5">
                <button
                  onClick={handleAccept}
                  aria-label="Décrocher"
                  className="w-[4.5rem] h-[4.5rem] rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 transition-all hover:scale-110 active:scale-95 animate-bounce"
                >
                  <Phone size={28} />
                </button>
                <span className="text-xs font-bold text-emerald-300 block">Décrocher</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 py-3 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-2xl">
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isMuted ? 'Activer micro' : 'Couper micro'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isVideoOff ? 'Activer caméra' : 'Couper caméra'}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              {/* Bascule avant/arrière (loop 7) : uniquement quand la caméra
                  est allumée ET que l'appareil en a plusieurs — un poste à
                  webcam unique n'affiche pas un bouton sans effet. */}
              {hasMultipleCameras && !isVideoOff && (
                <button
                  onClick={flipCamera}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md bg-white/10 hover:bg-white/20 text-white"
                  title={transport.cameraFacing === 'user' ? 'Caméra arrière' : 'Caméra avant'}
                  aria-label="Basculer entre caméra avant et arrière"
                >
                  <SwitchCamera size={20} />
                </button>
              )}

              {/* Raccrocher : rouge, central, le plus gros — la sortie doit
                  être trouvable en une demi-seconde, comme sur un téléphone. */}
              <button
                onClick={handleEnd}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 mx-1"
                title="Raccrocher"
                aria-label="Raccrocher"
              >
                <PhoneOff size={26} />
              </button>

              <button
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isSpeakerMuted ? 'bg-amber-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Haut-parleur"
              >
                {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Partager l'écran"
              >
                <Monitor size={20} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
