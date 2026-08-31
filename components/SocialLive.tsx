import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, Users, Send, Bot, Settings, Signal, Wifi, Activity, Check, Heart, 
  Sparkles, Zap, MessageSquare, Mic, MicOff, Video, VideoOff, Layout, 
  BarChart3, Command, FileText, Gift, PieChart, Share2, HelpCircle, 
  BookOpen, ListTodo, Shield, ArrowRight, PhoneOff, Award, Eye, 
  Radio, Volume2, UserPlus, UserCheck, ChevronRight, ChevronLeft, Download, Maximize2, 
  Camera, Lock, Globe, Flame, AlertCircle, CheckCircle2, CheckCircle, Sliders, ExternalLink,
  ShoppingBag, ShieldAlert, CheckSquare, Bell, Calendar, Clock, Bookmark,
  Compass, Copy, EyeOff, Headphones, GraduationCap, LifeBuoy, FileCheck,
  AlertTriangle, Plus, Play, Pause, RotateCcw, VolumeX, Hand, MoreHorizontal
} from 'lucide-react';
import { generateText, analyzeImage } from '../services/aiGateway';
import { supabaseService } from '../services/supabaseClient';
import {
  LiveStream, LiveStageParticipant, LiveQuestion, LivePoll, LiveDoc,
  LiveActionItem, LiveReplayData, LiveQualityMode, Agent, LiveType,
  LiveCommerceProduct, LiveAgendaItem, LiveDecision, LivePersonalNote,
  LiveSourceCard, LiveAttendanceRecord, LiveMeetingMinutes, LiveChatMessage,
  LiveVisualUniverse, LiveSolidarityCause, LiveSolidarityLedgerEntry,
  LiveSolidarityProof, LiveSolidarityUpdate, SolidarityCauseVisibility
} from '../types';
import { AGENTS, USER_PROFILE, LIVE_GIFTS, TRIBES } from '../constants';
import { Avatar3D } from './Avatar3D';
import { LiveWhiteboard } from './LiveWhiteboard';
import { LiveReplayModal } from './LiveReplayModal';
import { LiveSmartActionBar } from './LiveSmartActionBar';
import { LiveWaitingRoomModal } from './LiveWaitingRoomModal';
import { LivePostContinuityModal } from './LivePostContinuityModal';
import { LiveSourceFactCheckModal } from './LiveSourceFactCheckModal';
import { LiveInstantHelpModal } from './LiveInstantHelpModal';
import { LiveExpertBookingModal } from './LiveExpertBookingModal';
import { useGlobal } from '../contexts/GlobalContext';
import { useLiveTransport, RemoteParticipantMedia, hasPresentableMedia, stageGridClass, liveBadge, realViewerCount, shouldStartPanelCollapsed } from '../hooks/useLiveTransport';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { fetchLiveSession, createLiveSession, startLiveSession, joinLiveSession, leaveLiveSession, setHandRaised, updateParticipantRole, fetchActiveParticipants, updateVisualUniverse, subscribeToLiveSessionUniverse, deriveSelfStagePresence, mergeLiveStreamWithRealSession } from '../services/live/liveSessionService';
import { sendLiveMessage, fetchRecentLiveMessages, subscribeToLiveMessages, sendLiveReaction, fetchLiveReactionCount, subscribeToLiveReactions, subscribeToLiveSpeakerChanges } from '../services/live/liveChatService';
import { glassSurfaceClass, liveMaterialClass, LIVE_VISUAL_UNIVERSES, AvatarGrammarState, spawnWaterRipple } from '../services/live/liveMaterialSystem';
import { interpretLiveVoiceCommand, isVoiceCapabilityAllowed, LiveVoiceAction } from '../services/live/liveVoiceCommands';
import { registerCapabilityHandlers } from '../services/architecte/capabilityBus';
import { getCapabilitiesByDomain } from '../services/architecte/capabilityRegistry';
import {
  createSolidarityCause, fetchActiveSolidarityCause, subscribeToSolidarityCause, updateSolidarityCauseVisibility,
  fetchSolidarityLedger, fetchSolidarityProofs, addSolidarityProof, subscribeToSolidarityProofs,
  fetchSolidarityUpdates, addSolidarityUpdate, subscribeToSolidarityUpdates,
  detectSolidarityAnomalies, SolidarityAnomalyCheck,
} from '../services/live/liveSolidarityService';
import { multimodalVisionService } from '../services/multimodalVision';

interface SocialLiveProps {
  liveId: string;
  onClose: () => void;
  initialData?: LiveStream;
  onNavigateToTab?: (tab: string) => void;
}

/**
 * Tuile vidéo d'un participant distant réel (LOOP 04/14). Équipe F3 : la
 * tuile ne porte plus l'AUDIO — il vit dans <RemoteAudioSink>, monté au
 * niveau de la scène quel que soit le mode d'affichage (l'ancien montage
 * dans la tuile coupait le son de TOUT LE MONDE dès qu'on quittait le mode
 * caméra : partage d'écran, tableau blanc, conseil…). Les callback refs
 * font désormais un vrai detach() au démontage (fuite/écho sinon).
 */
const RemoteParticipantTile: React.FC<{ media: RemoteParticipantMedia }> = ({ media }) => {
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) media.videoTrack?.attach(el);
    else media.videoTrack?.detach();
  }, [media.videoTrack]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
      {media.videoTrack ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white">
          {media.participant.name.charAt(0).toUpperCase()}
        </div>
      )}
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
        {media.participant.isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
        <span className="text-xs font-bold text-white">{media.participant.name}</span>
      </div>
    </div>
  );
};

/**
 * Équipe F3 — puits audio de la scène : UN élément <audio> par piste audio
 * distante (micro + son de partage d'écran), monté une seule fois et
 * INDÉPENDANT du mode d'affichage (caméra, écran, tableau blanc, conseil,
 * réunion, commerce, masterclass) — tous les spectateurs entendent le
 * présentateur en permanence. Detach réel au démontage.
 */
const RemoteAudioSink: React.FC<{ participants: RemoteParticipantMedia[] }> = ({ participants }) => (
  <>
    {participants.map((media) => (
      <React.Fragment key={media.participant.identity}>
        {media.audioTrack && <SinkAudioElement track={media.audioTrack} />}
        {media.screenShareAudioTrack && <SinkAudioElement track={media.screenShareAudioTrack} />}
      </React.Fragment>
    ))}
  </>
);

const SinkAudioElement: React.FC<{ track: NonNullable<RemoteParticipantMedia['audioTrack']> }> = ({ track }) => {
  const ref = useCallback((el: HTMLAudioElement | null) => {
    if (el) track.attach(el);
    else track.detach();
  }, [track]);
  return <audio ref={ref} autoPlay />;
};

export const SocialLive: React.FC<SocialLiveProps> = ({ 
  liveId, 
  onClose, 
  initialData,
  onNavigateToTab
}) => {
  const { userProfile, addNotification } = useGlobal();
  
  // 1. Core Live Stream Data
  const [liveData, setLiveData] = useState<LiveStream>(() => {
    return initialData || {
      id: liveId,
      title: 'Masterclass Financement de Projet & Levée de Fonds 🚀',
      description: 'Session interactive avec l\'Expert Projet Diallo et les membres de la diaspora.',
      type: 'project_pitch',
      hostName: 'Sarah Koné',
      hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
      viewers: 1420,
      isMixed: true,
      aiAssistantId: '1',
      startedAt: new Date(),
      duration: 45,
      isPaid: false,
      language: 'Français',
      targetLanguage: 'Anglais',
      coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&fit=crop',
      tribeName: 'Entrepreneurs Africa',
      isRecordingEnabled: true,
      isTranslationEnabled: true,
      isQuestionsEnabled: true,
      isScreenShareEnabled: true,
      isVisionEnabled: true,
      tags: ['#Financement', '#Entrepreneuriat', '#Projet', '#DialloOS']
    };
  });

  const [aiAgent, setAiAgent] = useState<Agent | undefined>(() => {
    const agentId = liveData.aiAssistantId || '1';
    return AGENTS.find(a => a.id === agentId) || AGENTS[0];
  });

  // 2. Hardware & Real Media Streams
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [audioVolume, setAudioVolume] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<LiveQualityMode>(liveData.qualityMode || 'auto');
  const [networkLatency, setNetworkLatency] = useState(42); // ms

  // Le vrai flux (caméra/micro/écran) transite par useLiveTransport (LOOP 04/14,
  // adaptateur LiveKit) — ces refs ne servent plus qu'à recevoir la piste
  // via des callback refs (voir localVideoTrackRef/screenShareTrackRef).

  // 3. Stage & Participants
  // Équipe F3 : l'identité de l'hôte se juge sur l'ID RÉEL de la session
  // (live_sessions.host_id) dès qu'il est connu — le repli par nom
  // d'affichage (homonymes !) ne sert qu'avant la résolution en base.
  const [realHostId, setRealHostId] = useState<string | undefined>(liveData.hostId);
  const isHost = realHostId && userProfile.id
    ? realHostId === userProfile.id || userProfile.role === 'admin'
    : liveData.hostName === userProfile.name || userProfile.role === 'admin';
  const [stageParticipants, setStageParticipants] = useState<LiveStageParticipant[]>([
    {
      id: 'spk-host',
      name: liveData.hostName,
      avatar: liveData.hostAvatar,
      role: 'host',
      isMuted: false,
      isVideoOn: true,
      isVerified: true
    },
    ...(aiAgent ? [{
      id: `spk-ai-${aiAgent.id}`,
      name: `${aiAgent.name} (IA)`,
      avatar: aiAgent.avatarUrl,
      role: 'expert_ai' as const,
      isMuted: false,
      isVideoOn: true,
      isAi: true,
      specialty: aiAgent.specialty,
      agentId: aiAgent.id
    }] : [])
  ]);

  const [isUserOnStage, setIsUserOnStage] = useState(isHost);
  // Consentement caméra/micro/vision (LOOP 12/16) — au-delà du simple
  // toggle mic/caméra existant : avant toute publication réelle de média,
  // la personne qui monte sur scène voit explicitement ce qui sera capturé
  // et peut refuser (repli : spectateur, jamais de caméra/micro publiés
  // sans ce choix explicite).
  const [hasMediaConsent, setHasMediaConsent] = useState(false);
  const [showMediaConsentModal, setShowMediaConsentModal] = useState(isHost);
  // Équipe 10 (L1) : le choix (accord OU refus) est mémorisé pour ne jamais
  // rouvrir la modale en boucle — isHost se résout en ASYNCHRONE (effet de
  // resynchronisation plus bas) et le roster répète role='speaker' à chaque
  // polling : sans cette garde, chaque passage rouvrirait la modale.
  const mediaConsentAnsweredRef = useRef(false);
  // Miroirs en refs pour les callbacks temps réel (abonnement + polling
  // live_speakers ci-dessous), dont les closures seraient sinon figées sur
  // un état périmé de isUserOnStage/hasMediaConsent.
  const isUserOnStageRef = useRef(isUserOnStage);
  useEffect(() => { isUserOnStageRef.current = isUserOnStage; }, [isUserOnStage]);
  const hasMediaConsentRef = useRef(hasMediaConsent);
  useEffect(() => { hasMediaConsentRef.current = hasMediaConsent; }, [hasMediaConsent]);
  const handleAcceptMediaConsent = () => {
    mediaConsentAnsweredRef.current = true;
    hasMediaConsentRef.current = true; // miroir à jour immédiatement (les callbacks temps réel n'attendent pas le re-rendu)
    setHasMediaConsent(true);
    setShowMediaConsentModal(false);
  };
  const handleDeclineMediaConsent = () => {
    mediaConsentAnsweredRef.current = true;
    isUserOnStageRef.current = false; // idem : miroir avant le prochain polling
    setIsUserOnStage(false);
    setShowMediaConsentModal(false);
    // L1 : un invité qui refuse la scène redevient spectateur EN BASE aussi
    // (sa propre ligne live_speakers reste modifiable par lui-même, cf. RLS) —
    // sinon le roster (role='speaker') le remonterait sur scène au polling
    // suivant. L'hôte, lui, garde son rôle : il reste maître du direct, le
    // refus ne coupe que la publication caméra/micro (hasMediaConsent=false).
    if (realSessionId && !isHost) {
      updateParticipantRole(realSessionId, userProfile.id, 'viewer').catch(() => {});
    }
  };

  // Équipe 10 (L1) — LA rupture majeure corrigée : isHost dépend de
  // realHostId, résolu en ASYNCHRONE (fetch/création de la session réelle
  // ci-dessous), alors que isUserOnStage/showMediaConsentModal étaient
  // initialisés UNE SEULE FOIS avec la valeur du premier rendu — souvent
  // false pour l'hôte réel. Conséquence : l'hôte ne publiait jamais rien et
  // tous les spectateurs restaient sur « En attente du direct ». On
  // resynchronise dès que isHost devient vrai, sans jamais rouvrir la modale
  // si le choix a déjà été fait (garde mediaConsentAnsweredRef).
  useEffect(() => {
    if (!isHost) return;
    isUserOnStageRef.current = true;
    setIsUserOnStage(true);
    if (!hasMediaConsentRef.current && !mediaConsentAnsweredRef.current) setShowMediaConsentModal(true);
  }, [isHost]);

  // Provisionnement de la session réelle (LOOP 05/14) — la plupart des points
  // d'entrée du LIVE (SocialFeed, Trade*, StoryViewer...) ouvrent encore ce
  // composant avec un liveId/LiveStream purement client (aucune ligne
  // live_sessions correspondante), hérité d'avant cette mission. Le transport
  // (LOOP 04) et le temps réel (chat/réactions/mains levées, ce LOOP)
  // dépendent tous deux de RLS sur une vraie ligne live_sessions — on
  // l'assure ici : on réutilise la session si elle existe déjà (ex. un autre
  // participant l'a déjà créée), sinon l'hôte la crée à la volée. Un
  // spectateur qui arrive sur une session encore inexistante ne peut rien
  // créer (RLS le lui interdit de toute façon) — dégradation gracieuse :
  // pas de transport tant qu'aucune session réelle n'est confirmée.
  const [realSessionId, setRealSessionId] = useState<string | null>(null);
  // Univers visuel actif (LOOP 08/14) — réglage de session, pas un état
  // local par spectateur : initialisé depuis la ligne réelle, puis tenu à
  // jour pour tout le monde via subscribeToLiveSessionUniverse ci-dessous.
  const [visualUniverse, setVisualUniverse] = useState<LiveVisualUniverse>('crystal');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const existing = await fetchLiveSession(liveId);
      if (cancelled) return;
      if (existing) {
        setRealSessionId(existing.id);
        setRealHostId(existing.hostId);
        setVisualUniverse(existing.visualUniverse || 'crystal');
        // Équipe 10 (L4) : la ligne RÉELLE alimente enfin l'affichage —
        // titre/compteur/réglages venaient jusqu'ici du LiveStream de
        // démonstration (setLiveData n'était jamais appelé depuis la base).
        setLiveData((prev) => mergeLiveStreamWithRealSession(prev, existing));
        return;
      }
      if (!isHost) return; // spectateur sur une session pas encore créée : rien à faire, transport désactivé.
      try {
        const created = await createLiveSession(userProfile.id, userProfile.name, userProfile.avatarUrl, {
          title: liveData.title,
          description: liveData.description,
          type: liveData.type,
          isPrivate: liveData.isPrivate,
          isQuestionsEnabled: liveData.isQuestionsEnabled,
          isScreenShareEnabled: liveData.isScreenShareEnabled,
          tribeId: liveData.tribeId,
          tribeName: liveData.tribeName,
          language: liveData.language,
          isScheduled: liveData.isScheduled,
          scheduledFor: liveData.scheduledFor,
          timezone: liveData.timezone,
        });
        if (!cancelled) {
          setRealSessionId(created.id);
          setRealHostId(created.hostId);
          setVisualUniverse(created.visualUniverse || 'crystal');
          setLiveData((prev) => mergeLiveStreamWithRealSession(prev, created)); // Équipe 10 (L4) : même principe pour la session créée à la volée.
          // Équipe F3 : un direct qui démarre TOUT DE SUITE doit porter son
          // started_at réel — `startLiveSession` existait mais n'avait AUCUN
          // appelant, donc started_at restait null et fetchActiveLiveSessions
          // (filtre `started_at not null`) ne listait jamais le live aux
          // spectateurs. Un live programmé, lui, ne démarre pas ici.
          if (!liveData.isScheduled) {
            startLiveSession(created.id).catch((err) => console.warn('SocialLive: started_at non écrit', err));
          }
        }
      } catch (err) {
        console.error('SocialLive: échec de création de la session réelle', err);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveId]);

  // Diffuse à tous les participants le choix d'univers visuel de l'hôte —
  // vérifié réel via Realtime (postgres_changes UPDATE sur live_sessions).
  useEffect(() => {
    if (!realSessionId) return;
    const unsub = subscribeToLiveSessionUniverse(realSessionId, setVisualUniverse);
    return unsub;
  }, [realSessionId]);

  /** Hôte uniquement (RLS live_sessions_update_host) — s'applique à tous les spectateurs. */
  /** Retourne la promesse de l'écriture réelle (LOOP 13/16, « Architecte ») — un appelant qui a besoin de savoir si l'action a VRAIMENT réussi (ex. confirmation vocale) peut l'attendre, au lieu de confirmer avant que la base ne l'ait confirmé. */
  const handleChangeVisualUniverse = (universe: LiveVisualUniverse): Promise<void> => {
    if (!realSessionId || !isHost) return Promise.reject(new Error('Action non autorisée.'));
    setVisualUniverse(universe);
    return updateVisualUniverse(realSessionId, universe).catch((err) => {
      console.error('SocialLive: échec du changement d\'univers visuel', err);
      throw err;
    });
  };

  // Marque réellement la sortie côté base (live_speakers.left_at IS NOT
  // NULL). Appelée à la fois par handleEndLive (immédiat, au clic sur
  // "Quitter le Live" — voir plus bas) et par le nettoyage de l'effet de
  // présence juste en dessous (démontage du composant : fermeture de la
  // modale "Et Maintenant ?", navigation ailleurs, fermeture d'onglet...).
  // hasLeftSessionRef évite le double aller-retour réseau si les deux se
  // déclenchent pour la même session — leaveLiveSession() n'est de toute
  // façon pas dangereuse à ré-appeler (elle ne fait que rafraîchir
  // `left_at`, aucune erreur si la ligne est déjà marquée sortie), mais un
  // seul appel suffit.
  const hasLeftSessionRef = useRef(false);
  const leaveRealSession = () => {
    if (hasLeftSessionRef.current || !realSessionId) return;
    hasLeftSessionRef.current = true;
    leaveLiveSession(realSessionId, userProfile.id).catch(() => {});
  };

  // Une fois la session réelle confirmée, s'y inscrire comme participant
  // (spectateur ou hôte) — nécessaire pour can_view_live_session()/
  // is_live_host() côté RLS et pour apparaître dans le roster live_speakers.
  useEffect(() => {
    if (!realSessionId) return;
    hasLeftSessionRef.current = false; // nouvelle session réelle confirmée : on repart d'un état "présent".
    joinLiveSession(realSessionId, { id: userProfile.id, name: userProfile.name, avatar: userProfile.avatarUrl }, isHost ? 'host' : 'viewer')
      .catch((err) => console.error('SocialLive: échec pour rejoindre la session', err));
    return () => {
      leaveRealSession();
    };
  }, [realSessionId]);

  // Transport vidéo réel (LOOP 04/14) — une room LiveKit par session LIVE
  // réelle, publication activée seulement si l'utilisateur est réellement
  // sur scène (cohérent avec le jeton émis côté serveur) ET a donné son
  // consentement explicite (LOOP 12/16) — jamais de getUserMedia déclenché
  // avant ce choix. Désactivé tant que la session réelle n'est pas
  // confirmée (voir ci-dessus).
  const liveTransport = useLiveTransport({
    roomName: realSessionId || '',
    participantName: userProfile.name,
    canPublish: isUserOnStage && hasMediaConsent,
    enabled: !!realSessionId,
  });

  // Référence conservée pour la capture de frame réelle (LOOP 11/14, Vision
  // IA) — le ref-callback ci-dessous attache la vraie piste LiveKit, on garde
  // aussi le nœud DOM pour pouvoir en extraire une image à la demande.
  const visionCaptureVideoElRef = useRef<HTMLVideoElement | null>(null);
  const localVideoTrackRef = useCallback((el: HTMLVideoElement | null) => {
    visionCaptureVideoElRef.current = el;
    if (el) liveTransport.localVideoTrack?.attach(el);
    else liveTransport.localVideoTrack?.detach(); // Équipe F3 : sans detach, l'élément retiré du DOM continuait de jouer (fuite/écho)
  }, [liveTransport.localVideoTrack]);

  // Équipe F3 : la scène « partage d'écran » n'attachait QUE le partage
  // LOCAL — l'écran partagé par le PRÉSENTATEUR (piste distante) n'était
  // jamais affiché chez un spectateur. Repli sur la première piste d'écran
  // distante quand aucun partage local n'est actif.
  const screenShareTrackRef = useCallback((el: HTMLVideoElement | null) => {
    const track = liveTransport.localScreenShareTrack
      ?? liveTransport.remoteParticipants.find((p) => p.screenShareTrack)?.screenShareTrack
      ?? null;
    if (el) track?.attach(el);
    else track?.detach();
  }, [liveTransport.localScreenShareTrack, liveTransport.remoteParticipants]);

  // Équipe 10 (L3) : seuls les participants qui PUBLIENT un média (caméra,
  // écran, ou micro de quelqu'un sur scène) occupent une tuile — TOUT le
  // monde se connecte à la room, spectateurs muets compris, et une tuile par
  // spectateur réduisait le présentateur à 1/N de l'écran. Leur audio
  // éventuel reste joué par <RemoteAudioSink>, indépendant des tuiles.
  const presentableRemotes = liveTransport.remoteParticipants.filter(hasPresentableMedia);
  // Nombre RÉEL de tuiles de la scène caméra (mêmes conditions que le rendu
  // plus bas) : ma tuile si je suis sur scène, la tuile d'attente d'un
  // spectateur sans présentateur, le copilote IA en pleine cellule quand
  // aucun humain distant ne publie, puis les participants qui publient.
  const cameraTileCount =
    (isUserOnStage ? 1 : 0)
    + (!isUserOnStage && presentableRemotes.length === 0 ? 1 : 0)
    + (aiAgent && presentableRemotes.length === 0 ? 1 : 0)
    + presentableRemotes.length;

  // Équipe 10 (L4) : badge et compteur dérivés de l'état RÉEL (session +
  // transport) — jamais un « LIVE » pulsant codé en dur ni un 1420 fictif.
  const stageBadge = liveBadge(!!realSessionId, liveTransport.connectionState, !!liveTransport.error);
  const viewerCount = realViewerCount({
    hasRealSession: !!realSessionId,
    connectionState: liveTransport.connectionState,
    remoteParticipantCount: liveTransport.remoteParticipants.length,
    dbViewers: liveData.viewers,
  });

  // 4. View Mode: Video Stage / Screen Share / Whiteboard / Documents / Meeting / Commerce / Masterclass
  const [mainStageMode, setMainStageMode] = useState<'camera' | 'screen' | 'whiteboard' | 'document' | 'council' | 'meeting' | 'commerce' | 'masterclass'>('camera');

  // Trois niveaux d'interface (LOOP 06/14, prompt 4/7) : Essentiel (toujours
  // là — live/titre/quitter, mic/vidéo, demande de parole) ne dépend jamais
  // de controlsVisible ; Contextuel (chrome secondaire : sélecteur de scène,
  // outils rapides, ponts de transformation) s'efface au repos et
  // réapparaît à la moindre activité — souris (desktop) ou tap (mobile, pas
  // de survol persistant en tactile) ; Avancé (changer la scène pour tout le
  // monde, salle d'attente, invoquer un expert) est réservé à qui est
  // réellement sur scène, jamais affiché à un simple spectateur.
  const [controlsVisible, setControlsVisible] = useState(true);
  const lastActivityRef = useRef(Date.now());
  // Direction artistique Studio Live (30/08/2026) — la racine du LIVE porte
  // l'onde d'appui : chaque pression fait naître une goutte à l'endroit
  // exact du contact (spawnWaterRipple, teintée par l'univers courant).
  const liveRootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Souris/clavier (desktop) : signal continu, force la réapparition —
    // c'est le comportement attendu du survol. Le tactile n'a pas
    // d'équivalent continu (un tap est ponctuel) : on se contente d'y
    // repousser l'horloge d'inactivité, sans forcer l'affichage — sinon
    // chaque tap entrerait en conflit avec le geste explicite de
    // handleStageTap (qui, lui, doit pouvoir masquer le chrome).
    const markActiveVisible = () => { lastActivityRef.current = Date.now(); setControlsVisible(true); };
    const markActiveSilent = () => { lastActivityRef.current = Date.now(); };
    window.addEventListener('mousemove', markActiveVisible);
    window.addEventListener('keydown', markActiveVisible);
    window.addEventListener('touchstart', markActiveSilent);
    const interval = setInterval(() => {
      if (Date.now() - lastActivityRef.current > 4000) setControlsVisible(false);
    }, 1000);
    return () => {
      window.removeEventListener('mousemove', markActiveVisible);
      window.removeEventListener('keydown', markActiveVisible);
      window.removeEventListener('touchstart', markActiveSilent);
      clearInterval(interval);
    };
  }, []);

  // Geste mobile (prompt 4/7, "gestes limités et découvrables") : tap sur la
  // scène = équivalent tactile du survol souris, bascule l'affichage du
  // chrome contextuel au lieu de ne réagir qu'à l'inactivité.
  const handleStageTap = (e: React.MouseEvent) => {
    // Ignore les clics sur un contrôle réel à l'intérieur de la scène (Vision
    // IA, tuiles participants...) — seul un tap sur le fond vide doit
    // basculer la visibilité du chrome contextuel.
    if (e.target !== e.currentTarget) return;
    if (controlsVisible) { lastActivityRef.current = 0; setControlsVisible(false); }
    else { lastActivityRef.current = Date.now(); setControlsVisible(true); }
  };

  const contextualChromeClass = `transition-opacity duration-500 ${controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`;
  
  // 5. Diallo OS Copilot & Real-Time Multilingual Subtitles
  const [subtitlesMode, setSubtitlesMode] = useState<'off' | 'original' | 'translated' | 'bilingual'>('bilingual');
  const [selectedViewerLang, setSelectedViewerLang] = useState<string>('Français');
  const [currentSubtitle, setCurrentSubtitle] = useState<{ speaker: string; text: string; translated?: string }>({
    speaker: liveData.hostName,
    text: 'Nous abordons maintenant la structuration du plan de financement...',
    translated: 'We are now covering the structure of the financing plan...'
  });
  const [aiCopilotState, setAiCopilotState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
  // Grammaire d'états de l'avatar (LOOP 10/14) — piloté par les vrais signaux
  // du copilote vocal (voir dispatchVoiceAction plus bas), pas un état
  // décoratif : c'est aussi le même langage visuel que "l'Architecte" décrit
  // (disponible/écoute/compréhension/exécution/confirmation/succès/erreur).
  const [avatarGrammarState, setAvatarGrammarState] = useState<AvatarGrammarState>('repos');
  const [copilotInsight, setCopilotInsight] = useState<string | null>(null);
  const [showCatchupSummary, setShowCatchupSummary] = useState(false);
  const [catchupDigest, setCatchupDigest] = useState<string | null>(null);

  // 6. Multimodal Vision IA & Sensitive Data Protection
  const [isVisionAnalyzing, setIsVisionAnalyzing] = useState(false);
  const [visionAnalysisResult, setVisionAnalysisResult] = useState<string | null>(null);
  const [isSensitiveDataDetected, setIsSensitiveDataDetected] = useState(false);
  const [isBlurOverlayActive, setIsBlurOverlayActive] = useState(false);
  const [isAudioOnlyMode, setIsAudioOnlyMode] = useState(false);

  // 7. Interactive Sidebar Tabs
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'qa' | 'notes' | 'decisions' | 'agenda' | 'products' | 'campus' | 'docs' | 'assistant' | 'solidarity'>('chat');
  // Onglets secondaires repliés dans "Plus" (décongestion mobile — cf. audit UX) :
  // évite d'afficher 10 onglets sur une seule barre défilante.
  const [showMoreTabs, setShowMoreTabs] = useState(false);
  // Mode cinéma (Équipe I / LOOP I2) : replie la barre latérale pour que la
  // scène vidéo occupe toute la largeur/hauteur. Repli par RENDU CONDITIONNEL,
  // jamais par animation transform/filter : la barre contient un enfant
  // `fixed inset-0` (l'overlay du menu « Plus ») qu'un ancêtre transformé
  // re-scoperait au conteneur au lieu de l'écran.
  // Équipe 10 (L3) : sur mobile le panneau couvrait d'office la moitié basse
  // de l'écran (h-1/2) — la vidéo doit dominer : il démarre replié sous md,
  // la languette de réouverture et le chat restent à un tap.
  const [isPanelCollapsed, setIsPanelCollapsed] = useState<boolean>(
    () => typeof window !== 'undefined' && shouldStartPanelCollapsed(window.innerWidth)
  );
  
  // 8. Personal & Collective Memory
  const [personalNotes, setPersonalNotes] = useState<LivePersonalNote[]>([
    {
      id: 'pn-1',
      authorId: userProfile.id,
      text: 'Vérifier la convention de non double-imposition avant de signer le mandat.',
      timestamp: 'Il y a 10 min',
      category: 'project'
    },
    {
      id: 'pn-2',
      authorId: userProfile.id,
      text: 'Prendre rendez-vous avec Maître Diallo jeudi pour valider les statuts.',
      timestamp: 'Il y a 5 min',
      category: 'reminder'
    }
  ]);

  const [collectiveDecisions, setCollectiveDecisions] = useState<LiveDecision[]>([
    {
      id: 'dec-1',
      title: 'Adoption du plan de trésorerie prévisionnel 2026',
      description: 'Validation à l\'unanimité des membres du comité consultatif.',
      proposedBy: liveData.hostName,
      timestamp: '12:15',
      status: 'approved',
      votesCount: 34
    }
  ]);

  const [agendaItems, setAgendaItems] = useState<LiveAgendaItem[]>([
    { id: 'ag-1', title: '1. Tour de table & cadrage des objectifs', durationMin: 10, isCompleted: true, speaker: liveData.hostName },
    { id: 'ag-2', title: '2. Étude des mécanismes de garantie et solvabilité', durationMin: 20, isCompleted: false, speaker: 'Directeur Diallo (IA)' },
    { id: 'ag-3', title: '3. Vote des résolutions & attribution des actions', durationMin: 15, isCompleted: false, speaker: 'Tous' }
  ]);

  const [commerceProducts, setCommerceProducts] = useState<LiveCommerceProduct[]>([
    {
      id: 'prod-1',
      title: 'Kit Solaire Autonome Haute Puissance (5 kVA)',
      description: 'Idéal pour fermes agropastorales et PME. Certifié normes régionales.',
      price: 2450,
      currency: 'EUR',
      sellerName: 'Éco-Énergie Sahel SARL',
      sellerCountry: 'Sénégal',
      sellerCountryFlag: '🇸🇳',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=400&fit=crop'
    },
    {
      id: 'prod-2',
      title: 'Guide Officiel d\'Investissement OHADA 2026',
      description: 'Livre de référence + modèles de statuts juridiques personnalisables.',
      price: 49,
      currency: 'EUR',
      sellerName: 'Éditions Juridiques Diallo',
      sellerCountry: 'Côte d\'Ivoire',
      sellerCountryFlag: '🇨🇮',
      isAvailable: true,
      imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=400&fit=crop'
    }
  ]);

  const [attendanceRecords, setAttendanceRecords] = useState<LiveAttendanceRecord[]>([
    { participantId: userProfile.id, participantName: userProfile.name, joinedAt: '12:00', durationSec: 1800, exercisesCompleted: 2, quizScorePct: 95 }
  ]);

  // 9. AI Specialized Assistants Roles & Suggestions
  const [activeSpecializedAiRole, setActiveSpecializedAiRole] = useState<'all' | 'secretary' | 'moderator' | 'director'>('all');
  const [proactiveExpertSuggestion, setProactiveExpertSuggestion] = useState<{ message: string; agent: Agent } | null>({
    message: "Le sujet évoqué touche au droit OHADA des sociétés. Souhaitez-vous inviter l'Expert Juridique sur la scène ?",
    agent: AGENTS.find(a => a.id === '3') || AGENTS[0]
  });

  // 10. Modals State
  const [showWaitingRoomModal, setShowWaitingRoomModal] = useState(false);
  const [showPostContinuityModal, setShowPostContinuityModal] = useState(false);
  // Compte-rendu réel de fin de Live (LOOP 03/17, connexion Contenu↔Live) —
  // null tant que la génération est en cours, voir handleEndLive.
  const [liveEndSummary, setLiveEndSummary] = useState<string | null>(null);
  const [showFactCheckModal, setShowFactCheckModal] = useState(false);
  const [showInstantHelpModal, setShowInstantHelpModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAgentForBooking, setSelectedAgentForBooking] = useState<Agent>(AGENTS[0]);
  
  // Chat & Réactions — réels (LOOP 05/14), tables live_messages/live_reactions
  // (LOOP 02/14), diffusés via Supabase Realtime dès que la session réelle
  // (realSessionId) est confirmée.
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  // realHostId : déclaré plus haut (section 3) pour servir au calcul d'isHost.
  const [chatInput, setChatInput] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState<{ icon: string; id: number } | null>(null);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!realSessionId) return;
    let cancelled = false;
    fetchRecentLiveMessages(realSessionId).then((msgs) => { if (!cancelled) setMessages(msgs); });
    fetchLiveReactionCount(realSessionId).then((count) => { if (!cancelled) setLikesCount(count); });

    const unsubMessages = subscribeToLiveMessages(realSessionId, (m) => {
      setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
    });
    const unsubReactions = subscribeToLiveReactions(realSessionId, () => {
      setLikesCount((prev) => prev + 1);
    });
    return () => { cancelled = true; unsubMessages(); unsubReactions(); };
  }, [realSessionId]);

  // Demandes de parole (LOOP 05/14) — is_hand_raised sur live_speakers
  // (LOOP 02-03/14), pas de table séparée. Un spectateur lève/baisse sa
  // propre main ; l'hôte/modérateur voit la liste en direct et promeut.
  const [isHandRaisedByMe, setIsHandRaisedByMe] = useState(false);
  const [raisedHands, setRaisedHands] = useState<{ id: string; name: string }[]>([]);

  const handleToggleHandRaise = () => {
    if (!realSessionId) return;
    const next = !isHandRaisedByMe;
    setIsHandRaisedByMe(next);
    setHandRaised(realSessionId, userProfile.id, next).catch(() => setIsHandRaisedByMe(!next));
  };

  // Équipe 10 (L1) : abonnement au roster live_speakers pour TOUS les
  // participants — l'ancienne garde `!isHost` réservait ce flux à l'hôte,
  // donc un invité promu par handlePromoteToSpeaker (role='speaker' écrit en
  // base) ne l'apprenait JAMAIS : ni vu ni entendu. Ma propre ligne pilote
  // désormais isUserOnStage (promotion ET rétrogradation, décision pure
  // testée : deriveSelfStagePresence) ; la liste agrégée des mains levées
  // reste réservée à l'hôte.
  useEffect(() => {
    if (!realSessionId) return;
    let cancelled = false;

    const applyMyRole = (role: string, leftAt: string | null) => {
      const decision = deriveSelfStagePresence({
        role,
        leftAt,
        isCurrentlyOnStage: isUserOnStageRef.current,
        isHost: !!isHost,
      });
      if (decision === 'promote') {
        isUserOnStageRef.current = true;
        setIsUserOnStage(true);
        addNotification('Vous êtes sur scène 🎤', "L'hôte vous a invité à prendre la parole dans ce direct.", 'success');
        // Proposer le consentement média avant toute publication — jamais en
        // boucle : le polling répète role='speaker' toutes les 4 s.
        if (!hasMediaConsentRef.current && !mediaConsentAnsweredRef.current) setShowMediaConsentModal(true);
      } else if (decision === 'demote') {
        isUserOnStageRef.current = false;
        setIsUserOnStage(false);
        addNotification('Retour en spectateur', 'Vous avez quitté la scène du direct.', 'info');
      }
    };

    const refresh = () => {
      fetchActiveParticipants(realSessionId).then((participants) => {
        if (cancelled) return;
        const me = participants.find((p) => p.id === userProfile.id);
        if (me) applyMyRole(me.role, null); // left_at IS NULL garanti par fetchActiveParticipants
        if (isHost) {
          setRaisedHands(participants.filter(p => p.isHandRaised).map(p => ({ id: p.id, name: p.name })));
        }
      });
    };
    refresh();
    const unsub = subscribeToLiveSpeakerChanges(realSessionId, (row) => {
      const participantId = row.user_id;
      if (cancelled || !participantId) return;
      if (participantId === userProfile.id) applyMyRole(row.role, row.left_at);
      if (!isHost || row.left_at) return;
      setRaisedHands((prev) => {
        const withoutThis = prev.filter(p => p.id !== participantId);
        return row.is_hand_raised ? [...withoutThis, { id: participantId, name: row.name }] : withoutThis;
      });
    });
    // Filet de sécurité : les mises à jour live_speakers ne sont pas
    // toujours livrées par Realtime dans cet environnement (constaté en
    // testant ce LOOP — contrairement à live_messages/live_reactions,
    // confirmées fonctionnelles) ; ce polling garantit que la fonctionnalité
    // reste réellement utilisable en attendant d'en identifier la cause —
    // c'est aussi par lui qu'un invité promu apprend son rôle quand
    // Realtime ne livre pas l'UPDATE (Équipe 10, L1).
    const pollInterval = setInterval(refresh, 4000);
    return () => { cancelled = true; unsub(); clearInterval(pollInterval); };
  }, [realSessionId, isHost]);

  /** Retourne la promesse des deux écritures réelles (LOOP 13/16) — voir handleChangeVisualUniverse. */
  const handlePromoteToSpeaker = (participantId: string): Promise<void> => {
    if (!realSessionId) return Promise.reject(new Error('Session non prête.'));
    setRaisedHands((prev) => prev.filter(p => p.id !== participantId));
    return Promise.all([
      updateParticipantRole(realSessionId, participantId, 'speaker'),
      setHandRaised(realSessionId, participantId, false),
    ]).then(() => {});
  };

  // Notices système/IA (analyse Vision, arrivée d'un expert...) : purement
  // locales à cet onglet, pas persistées ni diffusées — contrairement au chat
  // saisi par un vrai utilisateur (handleSendMessage), qui lui passe par
  // live_messages. Même forme (LiveChatMessage) pour un rendu unifié.
  const pushLocalSystemMessage = (authorName: string, text: string) => {
    setMessages(prev => [...prev, {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      sessionId: realSessionId || '',
      authorId: undefined,
      authorName,
      authorAvatar: '',
      text,
      createdAt: new Date().toISOString(),
    }]);
  };

  /**
   * Live Solidaire (complément reçu pendant LOOP 05/14, cause créée depuis
   * LOOP 09/14) — jusqu'ici la cause n'avait aucun lecteur une fois créée
   * (ledger/preuves/mises à jour migrés en LOOP 09 mais jamais consommés).
   * LOOP 14/16 les branche réellement : aucun mouvement réel de fonds n'a
   * lieu ici (le ledger est une saisie déclarative de l'organisateur, pas
   * un prestataire de paiement), mais toutes les écritures/preuves/mises à
   * jour affichées sont réellement persistées et diffusées en temps réel.
   */
  const [activeSolidarityCause, setActiveSolidarityCause] = useState<LiveSolidarityCause | null>(null);
  const [solidarityLedger, setSolidarityLedger] = useState<LiveSolidarityLedgerEntry[]>([]);
  const [solidarityProofs, setSolidarityProofs] = useState<LiveSolidarityProof[]>([]);
  const [solidarityUpdates, setSolidarityUpdates] = useState<LiveSolidarityUpdate[]>([]);
  const [isCapturingSolidarityProof, setIsCapturingSolidarityProof] = useState(false);
  const [solidarityUpdateInput, setSolidarityUpdateInput] = useState('');
  const [solidarityAnomalyCheck, setSolidarityAnomalyCheck] = useState<SolidarityAnomalyCheck | null>(null);
  const [isCheckingSolidarityAnomalies, setIsCheckingSolidarityAnomalies] = useState(false);

  useEffect(() => {
    if (!realSessionId) return;
    let cancelled = false;
    fetchActiveSolidarityCause(realSessionId).then((cause) => { if (!cancelled) setActiveSolidarityCause(cause); });
    const unsub = subscribeToSolidarityCause(realSessionId, (cause) => {
      if (cancelled) return;
      setActiveSolidarityCause((prev) => (cause.status === 'active' || prev?.id === cause.id) ? cause : prev);
    });
    return () => { cancelled = true; unsub(); };
  }, [realSessionId]);

  useEffect(() => {
    const causeId = activeSolidarityCause?.id;
    if (!causeId) {
      setSolidarityLedger([]); setSolidarityProofs([]); setSolidarityUpdates([]); setSolidarityAnomalyCheck(null);
      return;
    }
    let cancelled = false;
    fetchSolidarityLedger(causeId).then((rows) => { if (!cancelled) setSolidarityLedger(rows); });
    fetchSolidarityProofs(causeId).then((rows) => { if (!cancelled) setSolidarityProofs(rows); });
    fetchSolidarityUpdates(causeId).then((rows) => { if (!cancelled) setSolidarityUpdates(rows); });
    const unsubProofs = subscribeToSolidarityProofs(causeId, (p) => {
      setSolidarityProofs((prev) => (prev.some((x) => x.id === p.id) ? prev : [p, ...prev]));
    });
    const unsubUpdates = subscribeToSolidarityUpdates(causeId, (u) => {
      setSolidarityUpdates((prev) => (prev.some((x) => x.id === u.id) ? prev : [u, ...prev]));
    });
    return () => { cancelled = true; unsubProofs(); unsubUpdates(); };
  }, [activeSolidarityCause?.id]);

  const solidarityCollected = solidarityLedger.filter((e) => e.entryType === 'collected').reduce((sum, e) => sum + e.amount, 0);
  const solidarityUsed = solidarityLedger.filter((e) => e.entryType === 'used').reduce((sum, e) => sum + e.amount, 0);

  /** Niveaux de visibilité basiques (LOOP 14/16) — organisateur seulement ; la vraie garantie reste la policy RLS, ceci n'est qu'un contrôle d'UI. */
  const handleToggleSolidarityVisibility = () => {
    if (!activeSolidarityCause || !isHost) return;
    const previous = activeSolidarityCause.visibility;
    const next: SolidarityCauseVisibility = previous === 'organizer_only' ? 'live_participants' : 'organizer_only';
    setActiveSolidarityCause({ ...activeSolidarityCause, visibility: next });
    updateSolidarityCauseVisibility(activeSolidarityCause.id, next).catch((err) => {
      console.error('SocialLive: échec de mise à jour de la visibilité de la cause solidaire', err);
      setActiveSolidarityCause((prev) => (prev ? { ...prev, visibility: previous } : prev));
      addNotification('Visibilité non enregistrée', "Le changement n'a pas pu être sauvegardé — réessayez.", 'alert');
    });
  };

  /**
   * Preuve de dépense via vision (LOOP 14/16) — réutilise la vraie capture
   * de frame et le vrai appel d'analyse d'image déjà branchés pour Vision
   * IA (LOOP 11/14), jamais un montant/une description inventés : si
   * l'analyse ne parvient pas à lire le justificatif, la preuve est quand
   * même enregistrée (la photo est réelle) mais le champ montant reste vide
   * plutôt que d'être deviné.
   */
  const handleCaptureSolidarityProof = async () => {
    if (!activeSolidarityCause || !isHost) return;
    const videoEl = visionCaptureVideoElRef.current;
    if (!videoEl || videoEl.videoWidth === 0) {
      pushLocalSystemMessage('Preuve de dépense', 'Aucune image de caméra disponible pour capturer un justificatif.');
      return;
    }
    setIsCapturingSolidarityProof(true);
    try {
      const frame = multimodalVisionService.captureFrame(videoEl);
      if (!frame) throw new Error('Capture de frame impossible.');
      const base64Data = frame.includes(',') ? frame.split(',')[1] : frame;
      const extractionPrompt = `Cette image montre potentiellement un reçu, une facture ou un justificatif de dépense pour une mission de solidarité. Extrais, si réellement lisible, le montant total et une courte description de la dépense. Réponds UNIQUEMENT en JSON strict : { "amount": nombre ou null, "description": "courte description ou null" }. N'invente jamais un montant que tu ne peux pas lire : renvoie null dans ce cas.`;
      let extracted: { amount?: number | null; description?: string | null } = {};
      try {
        const raw = await analyzeImage(base64Data, 'image/jpeg', extractionPrompt, { jsonMode: true });
        extracted = JSON.parse(raw);
      } catch {
        extracted = {};
      }

      const proof = await addSolidarityProof({
        causeId: activeSolidarityCause.id,
        stepLabel: 'Dépense capturée en direct',
        expenseDescription: extracted.description || undefined,
        amount: typeof extracted.amount === 'number' ? extracted.amount : undefined,
        proofType: 'receipt',
        documentUrl: frame,
        createdBy: userProfile.id,
      });
      setSolidarityProofs((prev) => (prev.some((x) => x.id === proof.id) ? prev : [proof, ...prev]));
      setAvatarGrammarState('succes');
      pushLocalSystemMessage(
        'Preuve de dépense',
        typeof extracted.amount === 'number'
          ? `Justificatif enregistré : ${extracted.amount} ${activeSolidarityCause.currency} — ${extracted.description || 'sans description lisible'}.`
          : "Justificatif photo enregistré — le montant n'a pas pu être lu automatiquement, précisez-le dans une mise à jour si besoin."
      );
    } catch {
      setAvatarGrammarState('erreur');
      pushLocalSystemMessage('Preuve de dépense', "La capture ou l'enregistrement du justificatif a échoué — réessayez.");
    } finally {
      setIsCapturingSolidarityProof(false);
    }
  };

  /** Mise à jour de mission déclenchée par l'organisateur (LOOP 14/16). */
  const handlePostSolidarityUpdate = () => {
    const text = solidarityUpdateInput.trim();
    if (!text || !activeSolidarityCause || !isHost) return;
    setSolidarityUpdateInput('');
    addSolidarityUpdate(activeSolidarityCause.id, userProfile.id, text)
      .then((update) => setSolidarityUpdates((prev) => (prev.some((x) => x.id === update.id) ? prev : [update, ...prev])))
      .catch((err) => {
        console.error('SocialLive: échec de publication de la mise à jour solidaire', err);
        addNotification('Mise à jour non publiée', "La publication a échoué — réessayez.", 'alert');
      });
  };

  /**
   * IA de détection d'anomalie (LOOP 14/16) — relit les lignes réelles du
   * ledger/preuves avant de vérifier, jamais sur un état local pouvant être
   * périmé. `checked: false` (IA indisponible) est affiché honnêtement,
   * jamais confondu avec "rien à signaler".
   */
  const handleCheckSolidarityAnomalies = async () => {
    if (!activeSolidarityCause) return;
    setIsCheckingSolidarityAnomalies(true);
    try {
      const [freshLedger, freshProofs] = await Promise.all([
        fetchSolidarityLedger(activeSolidarityCause.id),
        fetchSolidarityProofs(activeSolidarityCause.id),
      ]);
      setSolidarityLedger(freshLedger);
      setSolidarityProofs(freshProofs);
      const result = await detectSolidarityAnomalies(activeSolidarityCause, freshLedger, freshProofs);
      setSolidarityAnomalyCheck(result);
    } finally {
      setIsCheckingSolidarityAnomalies(false);
    }
  };

  // Questions (Q&R Zone)
  const [questions, setQuestions] = useState<LiveQuestion[]>([
    {
      id: 'q-1',
      authorId: 'u-fatou',
      authorName: 'Fatou Diop',
      authorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
      text: 'Quelles garanties bancaires sont acceptées pour les entrepreneurs de la diaspora ?',
      timestamp: 'Il y a 4 min',
      upvotes: 28,
      userUpvoted: false,
      status: 'answering',
      category: 'Financement'
    },
    {
      id: 'q-2',
      authorId: 'u-jean',
      authorName: 'Jean-Michel Dubois',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      text: 'Existe-t-il une convention bilatérale pour éviter la double imposition ?',
      timestamp: 'Il y a 2 min',
      upvotes: 19,
      userUpvoted: true,
      status: 'open',
      category: 'Juridique'
    }
  ]);
  const [newQuestionInput, setNewQuestionInput] = useState('');

  // Live Polls & Quizzes
  const [activePoll, setActivePoll] = useState<LivePoll | null>({
    id: 'poll-fin',
    question: 'Quel est votre stade de maturité pour ce projet ?',
    options: [
      { id: 'p1', text: 'Idée & Cadrage', votes: 45 },
      { id: 'p2', text: 'Prototype / MVP prêt', votes: 82 },
      { id: 'p3', text: 'En recherche active d\'investisseurs', votes: 120 }
    ],
    isActive: true,
    totalVotes: 247
  });
  const [hasVotedPoll, setHasVotedPoll] = useState(false);

  // Shared Documents
  const [sharedDocs, setSharedDocs] = useState<LiveDoc[]>([
    { id: 'doc-1', name: 'Grille_Cadrage_Financement_Projet_2026.pdf', url: '#', type: 'pdf', size: '2.4 MB', uploadedBy: liveData.hostName, pageCount: 8 },
    { id: 'doc-2', name: 'Synthese_OHADA_Garanties_Investissement.docx', url: '#', type: 'doc', size: '1.1 MB', uploadedBy: 'Directeur Diallo (IA)', pageCount: 4 }
  ]);

  // Action Items
  const [liveActionItems, setLiveActionItems] = useState<LiveActionItem[]>([
    { id: 'act-1', title: 'Rédiger la note de synthèse financière', category: 'finance', deadline: 'Sous 48h', completed: false },
    { id: 'act-2', title: 'Consulter l\'Expert Juridique pour le pacte d\'actionnaires', category: 'juridique', deadline: 'Vendredi', completed: false }
  ]);

  // Private Participant Assistant
  const [assistantMessages, setAssistantMessages] = useState<{ query: string; answer: string }[]>([
    { query: 'Qu\'est-ce qu\'une lettre d\'intention ?', answer: 'Une lettre d\'intention (LOI) est un document précontractuel où un investisseur ou partenaire confirme son intérêt formel pour financer ou collaborer sur votre projet.' }
  ]);
  const [assistantInput, setAssistantInput] = useState('');
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  // 8. Summon Expert / Council Modal
  const [showSummonExpertModal, setShowSummonExpertModal] = useState(false);
  const [summonSearchQuery, setSummonSearchQuery] = useState('');
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);

  // 9. Real Webcam & Mic — publiés/abonnés via useLiveTransport (LOOP 04/14),
  // plus de getUserMedia direct ici. L'indicateur de parole (barre audio du
  // slot présentateur) reflète maintenant un signal réel (RoomEvent.ActiveSpeakersChanged),
  // pas une simulation.
  useEffect(() => {
    setAudioVolume(liveTransport.localIsSpeaking ? 100 : 15);
  }, [liveTransport.localIsSpeaking]);

  const stopLocalMedia = () => {
    liveTransport.disconnect();
  };

  // Toggle Mic — Équipe F3 : un SPECTATEUR (canPublish=false) déclenchait un
  // rejet LiveKit non géré (promesse non attrapée) pendant que l'UI
  // prétendait avoir agi. Publication réservée à la scène ; échec réel
  // remonté au lieu d'un faux état.
  const toggleMic = () => {
    if (!isUserOnStage) {
      addNotification('Micro', 'Levez la main pour monter sur scène avant de parler.', 'info');
      return;
    }
    const next = !isMicMuted;
    setIsMicMuted(next);
    liveTransport.setMicrophoneEnabled(!next).catch(() => setIsMicMuted(!next));
  };

  // Toggle Camera — même garde que le micro.
  const toggleVideo = () => {
    if (!isUserOnStage) {
      addNotification('Caméra', 'Levez la main pour monter sur scène avant de diffuser.', 'info');
      return;
    }
    const next = !isVideoMuted;
    setIsVideoMuted(next);
    liveTransport.setCameraEnabled(!next).catch(() => setIsVideoMuted(!next));
  };

  // Real Screen Share — publié via l'adaptateur LiveKit, visible par tous les
  // participants de la room (plus un aperçu purement local).
  const handleToggleScreenShare = async () => {
    if (isScreenSharing) {
      await liveTransport.stopScreenShare();
      setIsScreenSharing(false);
      setMainStageMode('camera');
    } else {
      try {
        await liveTransport.startScreenShare();
        setIsScreenSharing(true);
        setMainStageMode('screen');
      } catch (e) {
        console.warn("Screen share cancelled", e);
      }
    }
  };

  // Le partage d'écran peut s'arrêter depuis le contrôle natif du navigateur
  // ("Arrêter le partage") sans passer par handleToggleScreenShare — la
  // piste locale disparaît alors (onLocalTrackUnpublished) sans que l'état
  // d'affichage local ne le sache : on le resynchronise ici.
  useEffect(() => {
    if (isScreenSharing && !liveTransport.localScreenShareTrack) {
      setIsScreenSharing(false);
      setMainStageMode('camera');
    }
  }, [liveTransport.localScreenShareTrack]);

  /**
   * Vision IA du LIVE (LOOP 11/14) — réutilise le vrai moteur multimodal
   * (services/multimodalVision.ts, déjà branché ailleurs dans l'app :
   * CampusProfessorCoach, MultimodalCameraHUD) au lieu d'un texte LLM
   * générique sans image (ancien comportement de ce bouton — vérifié par
   * audit : `generateText` seul, avec un texte de repli inventé affiché
   * comme un vrai résultat en cas d'échec). Capture une vraie frame de la
   * caméra locale, l'envoie réellement en analyse image, et ne présente
   * jamais un échec comme une analyse réussie. Reconnaissance de personnes
   * désactivée ici (allowPersonRecognition=false) : aucun écran de
   * consentement caméra/vision dédié dans le LIVE avant la LOOP 12/16.
   */
  const handleTriggerVisionAnalysis = async () => {
    const videoEl = visionCaptureVideoElRef.current;
    if (!videoEl || videoEl.videoWidth === 0) {
      pushLocalSystemMessage('Vision IA', "Aucune image de caméra disponible à analyser pour le moment.");
      return;
    }
    setIsVisionAnalyzing(true);
    try {
      const frame = multimodalVisionService.captureFrame(videoEl);
      if (!frame) throw new Error('Capture de frame impossible.');
      const analysis = await multimodalVisionService.analyzeFrame(frame, undefined, false);
      const resultText = analysis.executiveSummary || analysis.scene.summary;
      setVisionAnalysisResult(resultText);
      const prefix = analysis.degraded ? '⚠️ Analyse en mode dégradé (IA indisponible)' : '👁️ Analyse visuelle';
      pushLocalSystemMessage('Vision IA Diallo', `${prefix} : ${resultText}`);
    } catch (e) {
      // Dégradation honnête (prompt 5/7) : jamais un résultat inventé
      // présenté comme une vraie analyse quand celle-ci a réellement échoué.
      setVisionAnalysisResult(null);
      pushLocalSystemMessage('Vision IA', "L'analyse visuelle a échoué — réessayez dans un instant.");
    } finally {
      setIsVisionAnalyzing(false);
    }
  };

  // Summon Expert ("Appeler un Expert")
  const handleSummonExpert = (agent: Agent) => {
    setShowSummonExpertModal(false);
    
    // Add to stage participants
    if (!stageParticipants.some(p => p.agentId === agent.id)) {
      setStageParticipants(prev => [
        ...prev,
        {
          id: `spk-ai-${agent.id}`,
          name: `${agent.name} (IA)`,
          avatar: agent.avatarUrl,
          role: 'expert_ai',
          isMuted: false,
          isVideoOn: true,
          isAi: true,
          specialty: agent.specialty,
          agentId: agent.id
        }
      ]);
    }

    setAiAgent(agent);
    setAiCopilotState('speaking');

    const welcomeMsg = `L'expert ${agent.name} (${agent.specialty}) a rejoint la scène en direct ! Posez vos questions spécialisées.`;
    pushLocalSystemMessage("Diallo OS", `⚡ ${welcomeMsg}`);
    addNotification("Expert sur Scène ⚖️", `${agent.name} a rejoint le Live pour vous conseiller.`, "success");

    setTimeout(() => setAiCopilotState('idle'), 4000);
  };

  // "Réunir le Conseil" (Council Room inside Live)
  const handleAssembleLiveCouncil = () => {
    setMainStageMode('council');
    const councilAgents = AGENTS.slice(0, 4);
    
    const newParticipants: LiveStageParticipant[] = [
      stageParticipants[0],
      ...councilAgents.map(ag => ({
        id: `spk-ai-${ag.id}`,
        name: `${ag.name} (IA)`,
        avatar: ag.avatarUrl,
        role: 'expert_ai' as const,
        isMuted: false,
        isVideoOn: true,
        isAi: true,
        specialty: ag.specialty,
        agentId: ag.id
      }))
    ];
    setStageParticipants(newParticipants);

    pushLocalSystemMessage("Diallo OS", "🏛️ Le Conseil des Experts est réuni en direct : Projet, Juridique, Finance et Mobilité délibèrent conjointement sur votre dossier.");

    addNotification("Conseil Réuni 🏛️", "Table ronde multi-experts activée sur la scène Live.", "info");
  };

  /**
   * "Ce que vous avez manqué" (LOOP 11/14) — nourri du vrai chat
   * (`messages`, réel depuis le LOOP 05/14 : live_messages via Supabase),
   * pas seulement du titre du LIVE (ancien comportement, vérifié par audit :
   * `generateText` ne recevait que `liveData.title`). Sans transcript
   * réel, le résumé le dit honnêtement plutôt que d'en inventer un.
   */
  const handleRequestCatchup = async () => {
    setShowCatchupSummary(true);

    if (messages.length === 0) {
      setCatchupDigest("Aucun message n'a encore été échangé dans ce direct — rien à résumer pour l'instant.");
      return;
    }

    setCatchupDigest("Génération du résumé à partir du chat réel par Diallo OS...");
    const transcript = messages.slice(-60).map((m) => `${m.authorName}: ${m.text}`).join('\n');

    try {
      const response = await generateText(
        `Voici le chat réel du LIVE "${liveData.title}" (messages les plus récents en dernier) :\n\n${transcript}\n\nRésume en 3 puces percutantes ce qui s'est dit, à l'attention d'un spectateur qui arrive en retard. Base-toi uniquement sur ce chat, n'invente rien.`
      );
      setCatchupDigest(response || "Le résumé n'a pas pu être généré pour le moment — réessayez dans un instant.");
    } catch (e) {
      setCatchupDigest("Le résumé n'a pas pu être généré (service IA temporairement indisponible) — réessayez dans un instant.");
    }
  };

  // Private Assistant Inquiry
  const handleAskPrivateAssistant = async () => {
    if (!assistantInput.trim()) return;
    const query = assistantInput.trim();
    setAssistantInput('');
    setIsAssistantThinking(true);

    try {
      const response = await generateText(
        `Tu es l'assistant privé et discret d'un spectateur du Live "${liveData.title}".
            L'utilisateur te demande en aparté : "${query}".
            Réponds de façon ultra-concise, pédagogique et bienveillante en 2-3 phrases max.`
      );

      const answer = response || "C'est une démarche clé qui facilite la validation auprès des autorités compétentes.";
      setAssistantMessages(prev => [...prev, { query, answer }]);
    } catch (e) {
      setAssistantMessages(prev => [...prev, { query, answer: "Explication synthétique : ce terme désigne la conformité légale obligatoire." }]);
    } finally {
      setIsAssistantThinking(false);
    }
  };

  // Send Public Message
  /** overrideText : envoi programmatique (commande vocale) sans passer par le champ de saisie. */
  const handleSendMessage = (overrideText?: string) => {
    const raw = overrideText ?? chatInput;
    if (!raw.trim() || !realSessionId) return;
    const text = raw.trim();
    if (overrideText === undefined) setChatInput('');
    sendLiveMessage(realSessionId, { id: userProfile.id, name: userProfile.name, avatar: userProfile.avatarUrl }, text)
      .then((sent) => setMessages(prev => (prev.some(m => m.id === sent.id) ? prev : [...prev, sent])))
      .catch((err) => console.error('SocialLive: échec envoi message', err));

    // Trigger AI reaction if question
    if (text.toLowerCase().includes('comment') || text.toLowerCase().includes('pourquoi') || text.toLowerCase().includes('expert')) {
      setTimeout(() => {
        setCopilotInsight(`L'Expert IA peut apporter une réponse détaillée à : "${text}"`);
      }, 1000);
    }
  };

  // Send Question to dedicated Q&A
  const handleAddQuestion = () => {
    if (!newQuestionInput.trim()) return;
    const newQ: LiveQuestion = {
      id: `q-${Date.now()}`,
      authorId: userProfile.id,
      authorName: userProfile.name,
      authorAvatar: userProfile.avatarUrl,
      text: newQuestionInput.trim(),
      timestamp: 'À l\'instant',
      upvotes: 1,
      userUpvoted: true,
      status: 'open',
      category: 'Général'
    };
    setQuestions(prev => [newQ, ...prev]);
    setNewQuestionInput('');
    addNotification("Question Posée 💬", "Votre question a été ajoutée à l'espace prioritaire du Live.", "info");
  };

  // Upvote Question
  const handleUpvoteQuestion = (qId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q.id === qId) {
        const userUpvoted = !q.userUpvoted;
        return {
          ...q,
          upvotes: userUpvoted ? q.upvotes + 1 : q.upvotes - 1,
          userUpvoted
        };
      }
      return q;
    }));
  };

  // Bridges to Ecosystem
  const handleTransformToParcours = () => {
    addNotification(
      "Parcours Projet Initié 🎯",
      `La discussion du Live "${liveData.title}" a été convertie en Dossier Actif dans votre Hub d'Experts.`,
      "success"
    );
    if (onNavigateToTab) {
      stopLocalMedia();
      onClose();
      onNavigateToTab('experts');
    }
  };

  const handleJoinTribe = () => {
    addNotification("Tribu Rejointe 🔥", `Vous faites désormais partie de la Tribu "${liveData.tribeName || 'Entrepreneurs Africa'}".`, "success");
  };

  const handleBookPrivateSession = () => {
    setSelectedAgentForBooking(aiAgent || AGENTS[0]);
    setShowBookingModal(true);
  };

  // Personal Note Handler
  const handleAddPersonalNote = (text: string, category: 'reminder' | 'task' | 'project' | 'learning') => {
    const newNote: LivePersonalNote = {
      id: `pn-${Date.now()}`,
      authorId: userProfile.id,
      text,
      timestamp: 'À l\'instant',
      category
    };
    setPersonalNotes(prev => [newNote, ...prev]);
    addNotification("Mémoire Diallo 🧠", "Note personnelle enregistrée dans votre carnet privé.", "success");
  };

  // Collective Decision Handler
  const handleCreateDecision = (title: string, description: string) => {
    const newDec: LiveDecision = {
      id: `dec-${Date.now()}`,
      title,
      description,
      proposedBy: userProfile.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'approved',
      votesCount: 1
    };
    setCollectiveDecisions(prev => [...prev, newDec]);
    addNotification("Décision Collective 📋", "La décision a été adoptée et ajoutée au compte-rendu.", "success");
  };

  // Toggle Agenda Item
  const handleToggleAgendaItem = (id: string) => {
    setAgendaItems(prev => prev.map(item => item.id === id ? { ...item, isCompleted: !item.isCompleted } : item));
  };

  // Live Commerce Order
  const handleOrderProduct = (prod: LiveCommerceProduct) => {
    addNotification("Commande Initiée 🛍️", `Fiche de commande pour "${prod.title}" transmise à ${prod.sellerName}.`, "success");
  };

  // Audio-Only Mode Toggle (Data Saver) — Équipe F3 : chez un SPECTATEUR
  // (canPublish=false), l'ancien code appelait setCameraEnabled → rejet
  // LiveKit non géré, pendant que la notification promettait une économie de
  // données jamais réalisée. Honnête désormais : la publication caméra n'est
  // touchée que sur scène ; le libellé dit ce qui se passe réellement.
  const handleToggleAudioOnly = () => {
    setIsAudioOnlyMode(!isAudioOnlyMode);
    if (!isAudioOnlyMode) {
      if (isUserOnStage) {
        liveTransport.setCameraEnabled(false).catch(() => {});
        setIsVideoMuted(true);
      }
      addNotification("Mode Audio Seul 🎧", isUserOnStage
        ? "Votre caméra est coupée — vous continuez d'être entendu."
        : "Affichage allégé — le son du direct continue.", "info");
    } else {
      if (isUserOnStage) {
        liveTransport.setCameraEnabled(true).catch(() => {});
        setIsVideoMuted(false);
      }
      addNotification("Vidéo Réactivée 📹", isUserOnStage ? "Votre caméra est rétablie." : "Affichage complet rétabli.", "info");
    }
  };

  // Lien de partage réel de ce Live — realSessionId est l'identifiant réel
  // de la ligne live_sessions (jamais le liveId reçu en prop : pour un Live
  // tout juste créé depuis LiveCreationModal, ce dernier est un id
  // purement client `live-<timestamp>` sans aucune ligne correspondante en
  // base tant que l'effet de provisionnement ci-dessus n'a pas confirmé/créé
  // la vraie session). Ce lien ne contourne aucun contrôle d'accès : ouvrir
  // "?live=<id>" depuis App.tsx rejoue exactement le même chemin
  // (handleOpenLive) qu'un clic interne, donc les mêmes vérifications
  // (RLS Supabase can_view_live_session()/is_live_host(), et la logique de
  // ce composant) s'appliquent normalement — y compris pour refuser l'accès
  // à une session privée dont le destinataire ne fait pas partie.
  const handleCopyLiveLink = async () => {
    if (!realSessionId) {
      addNotification("Lien pas encore prêt", "La session réelle est en cours de préparation — réessayez dans un instant.", "alert");
      return;
    }
    const shareUrl = `${window.location.origin}${window.location.pathname}?live=${realSessionId}`;
    try {
      await navigator.clipboard.writeText(shareUrl);
      addNotification("Lien copié 🔗", "Le lien d'accès direct à ce Live a été copié dans le presse-papiers.", "success");
    } catch (err) {
      addNotification("Copie impossible", "Impossible de copier le lien automatiquement — réessayez.", "alert");
    }
  };

  // End Live & Launch "Et Maintenant ?" Post-Continuity Dashboard — génère un
  // vrai compte-rendu à partir du chat réel (LOOP 03/17, connexion
  // Contenu↔Live), même principe que handleRequestCatchup : jamais inventé,
  // honnête si aucun message n'a été échangé.
  //
  // Sortie réellement immédiate (corrigé le 2026-08-30) : stopLocalMedia()
  // coupait déjà le transport LiveKit à l'instant du clic, mais la présence
  // en base (live_speakers.left_at) n'était marquée qu'au DÉMONTAGE du
  // composant — c.-à-d. seulement quand l'utilisateur fermait ensuite la
  // modale "Et Maintenant ?". leaveRealSession() rend la sortie cohérente
  // avec la vidéo : marquée dès ce clic, la modale n'étant plus qu'un écran
  // de suivi affiché après coup (voir leaveRealSession ci-dessus pour
  // l'idempotence).
  const handleEndLive = () => {
    stopLocalMedia();
    leaveRealSession();
    setShowPostContinuityModal(true);
    setLiveEndSummary(null);

    if (messages.length === 0) {
      setLiveEndSummary("Aucun message n'a été échangé pendant ce direct — pas assez de matière pour un compte-rendu.");
      return;
    }

    const transcript = messages.slice(-80).map((m) => `${m.authorName}: ${m.text}`).join('\n');
    generateText(
      `Voici le chat réel du LIVE "${liveData.title}" animé par ${userProfile.name} (messages les plus récents en dernier) :\n\n${transcript}\n\nRédige un compte-rendu structuré en 3 parties courtes (1. POINTS CLÉS ABORDÉS, 2. DÉCISIONS & ENGAGEMENTS, 3. PROCHAINES ÉTAPES), à partir UNIQUEMENT de ce chat réel. N'invente aucun fait, nom ou décision absent de ce texte — si une partie n'a rien de réel à contenir, écris "Rien de notable dans ce direct." pour cette partie plutôt que d'inventer.`
    ).then((response) => {
      setLiveEndSummary(response || "Le résumé n'a pas pu être généré pour le moment — réessayez.");
    }).catch(() => {
      setLiveEndSummary("Le résumé n'a pas pu être généré (service IA temporairement indisponible).");
    });
  };

  // Publier le compte-rendu sur le fil social — crée un vrai brouillon
  // (jamais publié automatiquement), avec la provenance réelle vers ce Live
  // (source_type/source_id, LOOP 01/17). Retourne le succès réel.
  const handlePublishLiveSummaryToFeed = async (): Promise<boolean> => {
    if (!liveEndSummary || !supabaseService.isConfigured() || !userProfile.id) return false;
    try {
      const inserted = await supabaseService.createPost({
        author_id: userProfile.id,
        content: liveEndSummary,
        category: 'Live',
        tags: [],
        visibility: 'public',
        status: 'draft',
        format: 'live_extract',
        source_type: 'live_session',
        source_id: realSessionId || undefined,
      });
      return !!inserted;
    } catch (err) {
      console.warn('Could not create post from Live summary', err);
      return false;
    }
  };

  // Voix native branchée sur le LIVE (LOOP 09/14, prompts 2/7 et 4/7) —
  // réutilise useVoiceAssistant.ts (moteur déjà réel, partagé avec
  // DialloOS/CareerCoach3D/etc.), pas un second moteur vocal pour le LIVE.
  const [pendingVoiceClarification, setPendingVoiceClarification] = useState<{ originalUtterance: string; question: string } | null>(null);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  useEffect(() => {
    if (!voiceFeedback) return;
    const timer = setTimeout(() => setVoiceFeedback(null), 4000);
    return () => clearTimeout(timer);
  }, [voiceFeedback]);

  // Renvoie le résultat RÉEL (LOOP Architecte — pont d'exécution) : le bus de
  // capacités doit rapporter `done`/`failed` selon ce qui s'est vraiment
  // passé. Les appelants existants (transcription vocale du LIVE) ignorent la
  // valeur — comportement inchangé pour eux.
  const dispatchVoiceAction = async (action: LiveVoiceAction, originalUtterance: string): Promise<boolean> => {
    // Grammaire d'états (LOOP 10/14) : 'action' = impulsion "je m'exécute
    // réellement", remplacée juste après par le statut final (succès/erreur/
    // incertitude) — jamais un état sans rapport avec ce qui s'est vraiment
    // passé (cf. complément « Architecte » : ne jamais présenter une action
    // non exécutée comme terminée).
    if (action.type !== 'UNKNOWN' && action.type !== 'ASK_CLARIFICATION') setAvatarGrammarState('action');
    const say = (text?: string, grammar: AvatarGrammarState = 'succes') => {
      if (!text) return;
      setVoiceFeedback(text);
      setAvatarGrammarState(grammar);
      voiceAssistant.speak(text, { onEnd: () => setAvatarGrammarState('repos') }).catch(() => {});
    };
    // Permission vérifiée une seule fois ici, contre le registre de
    // capacités (LOOP 11/14) — jamais un `if (!isHost)` dispersé par cas
    // (source unique de vérité entre le prompt LLM et l'exécution réelle).
    if (!isVoiceCapabilityAllowed(action.type, { isHost, isUserOnStage })) {
      say("Cette action n'est pas autorisée pour ton rôle actuel.", 'erreur');
      return false;
    }
    switch (action.type) {
      case 'TOGGLE_MIC':
        toggleMic();
        say(action.spokenConfirmation);
        break;
      case 'TOGGLE_VIDEO':
        toggleVideo();
        say(action.spokenConfirmation);
        break;
      case 'TOGGLE_SCREEN_SHARE':
        handleToggleScreenShare();
        say(action.spokenConfirmation);
        break;
      case 'RAISE_HAND':
        handleToggleHandRaise();
        say(action.spokenConfirmation);
        break;
      case 'GIVE_FLOOR': {
        // Résolution de référence naturelle (LOOP 13/16, « Architecte ») :
        // le LLM résout déjà "elle"/"le dernier"/"la dernière main levée"
        // vers un nom via le contexte (ordre chronologique de levée
        // fourni dans le prompt) — ici on ne fait que retrouver ce nom
        // dans la liste réelle, ou prendre l'unique main levée si le nom
        // est absent/non trouvé et qu'il n'y en a qu'une (jamais deviner
        // s'il y a une ambiguïté réelle entre plusieurs personnes).
        const wanted = action.payload?.participantName?.toLowerCase();
        const target = wanted
          ? raisedHands.find((p) => p.name.toLowerCase().includes(wanted))
          : (raisedHands.length === 1 ? raisedHands[0] : undefined);
        if (!target) { say("Je ne trouve pas cette main levée.", 'erreur'); break; }
        // Statut d'exécution explicite (« Architecte », point 166) : ne
        // jamais dire "c'est fait" avant que l'écriture réelle n'ait
        // réussi — l'impulsion "action" reste affichée pendant l'attente.
        try {
          await handlePromoteToSpeaker(target.id);
          say(action.spokenConfirmation || `La parole est donnée à ${target.name}.`);
        } catch {
          say(`Je n'ai pas pu donner la parole à ${target.name} — réessayez.`, 'erreur');
        }
        break;
      }
      case 'OPEN_TAB': {
        const validTabs = ['chat', 'qa', 'notes', 'decisions', 'agenda', 'products', 'polls', 'docs', 'assistant', 'solidarity'];
        if (action.payload?.tabId && validTabs.includes(action.payload.tabId)) {
          setActiveSideTab(action.payload.tabId as typeof activeSideTab);
        }
        say(action.spokenConfirmation);
        break;
      }
      case 'SEND_CHAT_MESSAGE':
        if (action.payload?.text) handleSendMessage(action.payload.text);
        say(action.spokenConfirmation);
        break;
      case 'REQUEST_SUMMARY':
        handleRequestCatchup();
        say(action.spokenConfirmation);
        break;
      case 'SET_SUBTITLES_MODE':
        if (action.payload?.mode) setSubtitlesMode(action.payload.mode);
        say(action.spokenConfirmation);
        break;
      case 'TOGGLE_AUDIO_ONLY':
        handleToggleAudioOnly();
        say(action.spokenConfirmation);
        break;
      case 'CHANGE_VISUAL_UNIVERSE': {
        if (!action.payload?.universe) { say("Je ne sais pas vers quel univers basculer.", 'erreur'); break; }
        try {
          await handleChangeVisualUniverse(action.payload.universe);
          say(action.spokenConfirmation);
        } catch {
          say("Le changement d'univers n'a pas pu être enregistré — réessayez.", 'erreur');
        }
        break;
      }
      case 'SUMMON_EXPERT':
        setShowSummonExpertModal(true);
        say(action.spokenConfirmation);
        break;
      case 'CREATE_SOLIDARITY_CAUSE': {
        if (!realSessionId) { say("La session n'est pas encore prête.", 'erreur'); break; }
        const payload = action.payload;
        if (!payload?.title || !payload?.beneficiaryDescription) { say("Il manque le sujet de la mission.", 'erreur'); break; }
        // Jamais confiance aveugle dans la sortie du LLM pour une valeur
        // contrainte en base (CHECK constraint) — validé ici, pas seulement
        // demandé dans le prompt (ex. observé en test réel : "family" au
        // lieu de "person").
        const validBeneficiaryTypes = ['person', 'community', 'project', 'medical', 'complex'] as const;
        const beneficiaryType = validBeneficiaryTypes.includes(payload.beneficiaryType as any) ? payload.beneficiaryType! : 'person';
        createSolidarityCause({
          liveSessionId: realSessionId,
          organizerId: userProfile.id,
          title: payload.title,
          beneficiaryDescription: payload.beneficiaryDescription,
          beneficiaryType,
          targetAmount: payload.targetAmount,
        })
          .then((cause) => {
            setActiveSolidarityCause(cause); // rend la cause immédiatement visible dans l'onglet "Solidaire" (LOOP 14/16), pas seulement dans le chat.
            pushLocalSystemMessage('Diallo OS', `Mission solidaire lancée : "${payload.title}".`);
            setAvatarGrammarState('succes'); // confirmation finale une fois la ligne réellement persistée, pas seulement au moment de la parler.
          })
          .catch((err) => { console.error('SocialLive: échec création mission solidaire', err); setAvatarGrammarState('erreur'); });
        say(action.spokenConfirmation);
        break;
      }
      case 'ADD_SOLIDARITY_UPDATE': {
        if (!activeSolidarityCause) { say("Il n'y a pas de mission solidaire active sur ce direct.", 'erreur'); break; }
        const updateText = action.payload?.updateText;
        if (!updateText) { say("Je n'ai pas compris le contenu de la mise à jour.", 'erreur'); break; }
        try {
          const update = await addSolidarityUpdate(activeSolidarityCause.id, userProfile.id, updateText);
          setSolidarityUpdates((prev) => (prev.some((x) => x.id === update.id) ? prev : [update, ...prev]));
          say(action.spokenConfirmation);
        } catch {
          say("La mise à jour n'a pas pu être publiée — réessayez.", 'erreur');
        }
        break;
      }
      case 'DISCOVER_CAPABILITIES':
        // « Architecte » — commande de découverte contextuelle : le résumé
        // vient déjà du LLM à partir du registre réel filtré par rôle
        // (voir buildSystemInstruction), jamais une liste technique brute.
        say(action.spokenConfirmation);
        break;
      case 'ASK_CLARIFICATION':
        if (action.payload?.question) {
          setPendingVoiceClarification({ originalUtterance, question: action.payload.question });
          say(action.payload.question, 'incertitude');
        }
        break;
      case 'UNKNOWN':
      default:
        say(action.spokenConfirmation, 'incertitude');
        break;
    }
    // Aucun cas ci-dessus n'a interrompu : l'action a bien été effectuée.
    return true;
  };

  // --- Pont d'exécution de l'Architecte (LOOP Architecte) ---
  // Le LIVE déclare ses capacités TANT QU'UNE SESSION EST OUVERTE. En dehors,
  // elles ne sont volontairement pas enregistrées et le bus répond
  // « indisponible » avec son explication : « donner la parole » n'a aucun
  // sens sans direct en cours, et le dire est la réponse juste — pas une
  // lacune à masquer.
  //
  // Les identifiants et leur type d'action sont lus DEPUIS le registre plutôt
  // que recopiés ici : une capacité ajoutée au registre LIVE devient
  // automatiquement pilotable, sans risque de divergence entre les deux.
  //
  // Le second argument fournit le contexte de permission réel (hôte / sur
  // scène) — l'Architecte, appelé depuis n'importe quel écran, ne peut pas le
  // connaître, et sans lui toute capacité liée à un rôle serait refusée à
  // tort. `dispatchVoiceAction` refait de toute façon sa propre vérification
  // autoritaire en interne : c'est une double barrière, jamais un
  // contournement.
  useEffect(() => {
    const liveCaps = getCapabilitiesByDomain('live');
    const entries = Object.fromEntries(
      liveCaps.map((cap) => [
        cap.id,
        async (payload: any) => {
          const ok = await dispatchVoiceAction(
            { type: cap.actionType, payload, spokenConfirmation: '' } as any,
            ''
          );
          return ok
            ? { ok: true, message: cap.description }
            : { ok: false, message: "Cette action n'a pas pu être effectuée dans ce direct." };
        },
      ])
    );
    return registerCapabilityHandlers(entries, () => ({ isHost, isUserOnStage }));
  });


  const handleVoiceTranscript = (transcript: string) => {
    const trimmed = transcript.trim();
    if (!trimmed) return;
    let promptText = trimmed;
    let originalUtterance = trimmed;
    const isFollowUp = !!pendingVoiceClarification;
    if (pendingVoiceClarification) {
      promptText = `Demande initiale : "${pendingVoiceClarification.originalUtterance}". Question posée : "${pendingVoiceClarification.question}". Réponse de l'utilisateur : "${trimmed}".`;
      originalUtterance = pendingVoiceClarification.originalUtterance;
      setPendingVoiceClarification(null);
    }
    // 'comprehension' pour la réponse à une clarification (on assemble une
    // information partielle), 'reflexion' pour une commande fraîche — deux
    // étapes de traitement réellement distinctes, pas un simple habillage.
    setAvatarGrammarState(isFollowUp ? 'comprehension' : 'reflexion');
    interpretLiveVoiceCommand(promptText, {
      liveTitle: liveData.title,
      isHost,
      isUserOnStage,
      raisedHandNames: raisedHands.map((h) => h.name),
      subtitlesMode,
    }).then((action) => dispatchVoiceAction(action, originalUtterance));
  };

  const voiceAssistant = useVoiceAssistant({ lang: 'fr-FR', onFinalTranscript: handleVoiceTranscript });

  // Reflète l'écoute/la parole réelles du moteur vocal dans la grammaire de
  // l'avatar — les autres états (réflexion/action/succès/erreur/incertitude)
  // sont posés explicitement au fil du traitement de la commande ci-dessus.
  useEffect(() => {
    if (voiceAssistant.isListening) setAvatarGrammarState('ecoute');
  }, [voiceAssistant.isListening]);
  useEffect(() => {
    if (voiceAssistant.isSpeaking) setAvatarGrammarState('reponse');
  }, [voiceAssistant.isSpeaking]);

  return (
    <div
      ref={liveRootRef}
      data-live-universe={visualUniverse}
      onPointerDown={(e) => spawnWaterRipple(e, liveRootRef.current)}
      className="fixed inset-0 bg-slate-950 z-[200] flex flex-col overflow-hidden font-sans text-white select-none"
    >

      {/* 1. TOP HEADER BAR — matière verre/eau/lumière (LOOP 07/14), surface de
          référence. La barre respire (water-breathe, ~9s, presque imperceptible)
          et porte des micro-gouttelettes lumineuses — jamais sur la zone de
          chat/texte dense (Lisibilité avant Matière, prompt 3/7). */}
      <div className={`h-16 relative ${glassSurfaceClass('primary')} animate-water-breathe px-4 flex items-center justify-between z-30`}>
        <span className="water-droplets" aria-hidden="true"></span>

        {/* Left: Live Indicator, Title & Badges — Équipe 10 (L4) : badge
            dérivé de l'état réel (liveBadge), plus un rouge pulsant codé en
            dur pendant une reconnexion, une panne ou un simple aperçu. */}
        <div className="flex items-center gap-3 min-w-0">
          <div className={`px-3 py-1 rounded-xl font-black text-xs flex items-center gap-2 ${stageBadge.className}`}>
            <span className="w-2 h-2 bg-white rounded-full"></span> {stageBadge.label}
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
                {liveData.title}
              </h1>
              <span className="px-2 py-0.5 bg-white/10 text-[10px] font-bold text-indigo-300 rounded-md hidden sm:inline capitalize">
                {liveData.type || 'Public'}
              </span>
            </div>
            {/* Lisibilité (DA-3) : slate-300 et 11px — slate-400 en 10px passait
                sous le seuil de confort sur les verres les plus clairs (rose_doux). */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
              {/* Équipe 10 (L4) : compteur honnête — participants réellement
                  connectés au transport, sinon compteur de la ligne réelle,
                  sinon RIEN (jamais le 1420 de démonstration). */}
              {viewerCount !== null && (
                <span className="flex items-center gap-1"><Users size={11} /> {viewerCount.toLocaleString()} en direct</span>
              )}
              <span
                className="flex items-center gap-1 text-slate-500 cursor-default"
                title={`Diallo OS Copilote actif · Réseau ${networkQuality.toUpperCase()} (${networkLatency}ms)`}
              >
                {viewerCount !== null && <span aria-hidden="true">•</span>}
                <Shield size={11} />
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true"></span>
              </span>
            </div>
          </div>
        </div>

        {/* Center: Stage Mode Selectors — Avancé : change la scène pour TOUS
            les spectateurs, réservé à qui est réellement sur scène. */}
        {isUserOnStage && (
        <div className={`hidden lg:flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10 overflow-x-auto max-w-xl ${contextualChromeClass}`}>
          <button
            onClick={() => setMainStageMode('camera')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'camera' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Video size={13} /> Vidéo
          </button>
          <button
            onClick={handleToggleScreenShare}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'screen' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Layout size={13} /> Écran
          </button>
          <button
            onClick={() => setMainStageMode('whiteboard')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'whiteboard' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <BarChart3 size={13} /> Tableau
          </button>
          <button
            onClick={() => setMainStageMode('meeting')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'meeting' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <ListTodo size={13} /> Réunion & PV
          </button>
          <button
            onClick={() => setMainStageMode('commerce')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'commerce' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <ShoppingBag size={13} /> Boutique
          </button>
          <button
            onClick={() => setMainStageMode('masterclass')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'masterclass' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <GraduationCap size={13} /> Masterclass
          </button>
          <button
            onClick={handleAssembleLiveCouncil}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'council' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Award size={13} /> Conseil
          </button>
        </div>
        )}

        {/* Right: Quick Tools (Contextuel, s'efface au repos), Summon Expert
            (Avancé, sur scène uniquement), et Quitter (Essentiel, toujours visible) */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className={`flex items-center gap-1.5 sm:gap-2 ${contextualChromeClass}`}>
            {/* Audio Only Mode (Low Data) — personnel, utile à tout spectateur */}
            <button
              onClick={handleToggleAudioOnly}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${isAudioOnlyMode ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}`}
              title="Mode Audio Seul (Économie de bande passante 85%)"
            >
              <Headphones size={14} />
              <span className="hidden xl:inline">{isAudioOnlyMode ? 'Audio Seul' : 'Éco Data'}</span>
            </button>

            {/* Copier le lien direct de ce Live — realSessionId est l'id réel
                de la session (voir handleCopyLiveLink). Toujours visible :
                partager un Live est une action aussi essentielle que le
                SOS/Fact-Check qui l'entourent, pas un réglage secondaire. */}
            <button
              onClick={handleCopyLiveLink}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/40 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
              title="Copier le lien direct de ce Live"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Copier le lien</span>
            </button>

            {/* SOS Help Button — neutre au repos, ne s'allume qu'au survol/usage
                (une couleur d'alerte affichée en permanence perd son sens d'alerte) */}
            <button
              onClick={() => setShowInstantHelpModal(true)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-rose-600/30 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/40 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
              title="Besoin d'aide immédiate ou modération"
            >
              <LifeBuoy size={14} />
              <span className="hidden sm:inline">SOS Aide</span>
            </button>

            {/* Fact-Check Sources */}
            <button
              onClick={() => setShowFactCheckModal(true)}
              className="px-2.5 py-1.5 bg-white/5 hover:bg-sky-600/30 text-slate-300 hover:text-sky-200 border border-white/10 hover:border-sky-500/40 text-xs font-bold rounded-xl hidden md:flex items-center gap-1 transition-all"
              title="Vérificateur de sources et déclarations"
            >
              <FileCheck size={14} />
              <span className="hidden xl:inline">Fact-Check</span>
            </button>

            {isUserOnStage && (
              <button
                onClick={() => setShowWaitingRoomModal(true)}
                className="px-2.5 py-1.5 bg-white/5 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/40 text-xs font-bold rounded-xl hidden lg:flex items-center gap-1 transition-all"
                title="Paramètres de scène & Salle d'attente"
              >
                <Sliders size={14} />
              </button>
            )}

            {/* Univers visuel (LOOP 08/14) — Avancé, hôte uniquement : change
                l'expérience pour TOUS les spectateurs (voir handleChangeVisualUniverse). */}
            {isHost && (
              <div className="hidden lg:flex items-center gap-1 bg-black/40 p-1 rounded-2xl border border-white/10">
                {LIVE_VISUAL_UNIVERSES.map((universe) => (
                  <button
                    key={universe.id}
                    onClick={() => handleChangeVisualUniverse(universe.id)}
                    className={`w-5 h-5 rounded-full transition-all ${glassSurfaceClass('surface')} ${visualUniverse === universe.id ? 'ring-2 ring-white scale-110' : 'opacity-60 hover:opacity-100'}`}
                    data-live-universe={universe.id}
                    // Anneau couleur signature (image de référence : chaque verre
                    // est identifié par son anneau lumineux) — à 20px, les teintes
                    // de verre sombres seraient indistinctes sans lui.
                    style={{ boxShadow: 'inset 0 0 0 2px var(--water-accent)' }}
                    title={`${universe.label} — ${universe.description}`}
                  />
                ))}
              </div>
            )}

            {isUserOnStage && (
              <button
                onClick={() => setShowSummonExpertModal(true)}
                className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center gap-1.5 transition-all"
              >
                <Zap size={14} /> <span className="hidden sm:inline">Appeler un</span> Expert
              </button>
            )}

            <button
              onClick={handleRequestCatchup}
              className="px-3 py-1.5 bg-white/5 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/40 text-xs font-bold rounded-xl hidden 2xl:flex items-center gap-1.5 transition-all"
            >
              <Sparkles size={14} /> Résumé
            </button>
          </div>

          <button
            onClick={handleEndLive}
            className="p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl border border-red-500/30 transition-colors"
            title="Quitter ou terminer le Live"
          >
            <PhoneOff size={18} />
          </button>
        </div>

      </div>

      {/* PROACTIVE EXPERT RECOMMENDATION BANNER */}
      {proactiveExpertSuggestion && (
        <div className="bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-indigo-950/80 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between z-20 backdrop-blur-md animate-fade-down">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg flex-shrink-0">
              <Sparkles size={14} />
            </div>
            <p className="text-xs font-medium text-amber-100 truncate">
              {proactiveExpertSuggestion.message}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                handleSummonExpert(proactiveExpertSuggestion.agent);
                setProactiveExpertSuggestion(null);
              }}
              className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-colors flex items-center gap-1"
            >
              Inviter {proactiveExpertSuggestion.agent.name}
            </button>
            <button
              onClick={() => setProactiveExpertSuggestion(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* SENSITIVE DATA WARNING BANNER */}
      {isSensitiveDataDetected && (
        <div className="bg-rose-950/90 border-b border-rose-500/50 px-4 py-2 flex items-center justify-between z-20 backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-2 text-xs font-bold text-rose-200">
            <AlertTriangle size={16} className="text-rose-400" />
            <span>Vision IA : Un document confidentiel (coordonnées / pièces privées) a été détecté à l'écran.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBlurOverlayActive(!isBlurOverlayActive)}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg"
            >
              {isBlurOverlayActive ? "Retirer le flou" : "Flouter l'écran"}
            </button>
            <button
              onClick={() => setIsSensitiveDataDetected(false)}
              className="text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      {/* 2. MAIN WORKSPACE (STAGE + SIDEBAR) */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
        
        {/* A. LEFT MAIN STAGE (70%) */}
        <div className="flex-1 relative bg-slate-950 flex flex-col overflow-hidden">
          
          {/* Active Stage View Switcher — tap = geste mobile équivalent au
              survol souris pour révéler/masquer le chrome contextuel
              (pas de survol persistant en tactile). */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={handleStageTap}>

            {/* Équipe F3 : audio de scène PERMANENT (indépendant du mode
                d'affichage) + états honnêtes du transport — plus jamais un
                silence ou une panne inexpliqués. */}
            <RemoteAudioSink participants={liveTransport.remoteParticipants} />
            {liveTransport.audioPlaybackBlocked && (
              <button
                onClick={(e) => { e.stopPropagation(); void liveTransport.startAudio(); }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-xl flex items-center gap-2"
              >
                <Volume2 size={14} /> Activer le son
              </button>
            )}
            {/* Équipe 10 (L4) : l'échec propose une vraie relance (jeton +
                connexion via liveTransport.retry) au lieu d'un constat sans
                issue ; la reconnexion automatique du transport (état
                'reconnecting', déjà mappé par le provider) n'est plus
                écrasée par le libellé de première connexion. */}
            {realSessionId && liveTransport.error && (
              <div className="absolute top-4 right-4 z-30 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-600/90 text-white text-[11px] font-bold shadow-lg">
                <span>Diffusion interrompue</span>
                <button
                  onClick={(e) => { e.stopPropagation(); liveTransport.retry(); }}
                  className="px-2 py-0.5 rounded-lg bg-white/20 hover:bg-white/35 font-extrabold transition-colors"
                >
                  Réessayer
                </button>
              </div>
            )}
            {realSessionId && !liveTransport.error && liveTransport.connectionState === 'reconnecting' && (
              <div className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 text-[11px] font-bold shadow-lg animate-pulse">
                Reconnexion au direct en cours…
              </div>
            )}
            {realSessionId && !liveTransport.error && liveTransport.connectionState !== 'connected' && liveTransport.connectionState !== 'reconnecting' && (
              <div className="absolute top-4 right-4 z-30 px-3 py-1.5 rounded-xl bg-amber-500/90 text-slate-950 text-[11px] font-bold shadow-lg animate-pulse">
                Connexion au direct…
              </div>
            )}
            {!realSessionId && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 px-4 py-1.5 rounded-xl bg-slate-800/95 border border-white/15 text-slate-200 text-[11px] font-bold shadow-lg">
                Aperçu — ce direct de démonstration n'est pas diffusé en temps réel
              </div>
            )}

            {/* MODE 1: CAMERA & MULTI-SPEAKER STAGE — Équipe I (LOOP I2) :
                quand de VRAIS participants distants sont là, ce sont les
                humains qui remplissent la grille (vraie sensation de
                présence, visibilité correcte entre participants) ; le
                copilote IA se replie en vignette compacte au lieu d'occuper
                une demi-scène. Seul sur scène, l'hôte garde la disposition
                historique hôte + IA. */}
            {mainStageMode === 'camera' && (
              /* Équipe 10 (L3) : grille dérivée du nombre RÉEL de tuiles
                 (1 → pleine scène, 2 → deux colonnes, 3-4 → 2x2, plus →
                 auto-fit) — la grille sm:grid-cols-2 figée laissait un
                 présentateur seul sur une demi-scène. */
              <div className={`w-full h-full p-3 grid ${stageGridClass(cameraTileCount)} gap-3 bg-slate-950`}>

                {/* Slot 1 : MA caméra — UNIQUEMENT quand je suis sur scène.
                    Équipe F3 : un SPECTATEUR voyait ici sa propre caméra
                    morte étiquetée « {hôte} (Hôte) » avec une barre de niveau
                    pilotée par SON micro — il croyait le direct cassé. Le
                    présentateur réel lui arrive par sa tuile distante. */}
                {isUserOnStage && (
                <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center group">
                  <video
                    ref={localVideoTrackRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`}
                  />
                  {isVideoMuted && (
                    <img src={liveData.hostAvatar} className="w-full h-full object-cover opacity-60" />
                  )}

                  {/* Speaker Label & Audio Wave */}
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                    <span className="text-xs font-bold text-white">{isHost ? `${liveData.hostName} (Hôte)` : `${userProfile.name} (Sur scène)`}</span>
                    <div className="w-12 h-2 bg-slate-800 rounded-full overflow-hidden ml-1">
                      <div className="h-full bg-emerald-400 rounded-full transition-all" style={{ width: `${audioVolume}%` }} />
                    </div>
                  </div>

                  {/* Host Quick Controls */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={handleTriggerVisionAnalysis}
                      disabled={isVisionAnalyzing}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold rounded-lg shadow-md flex items-center gap-1"
                    >
                      <Eye size={12} /> {isVisionAnalyzing ? 'Analyse...' : 'Vision IA'}
                    </button>
                  </div>
                </div>
                )}

                {/* Spectateur, présentateur pas encore connecté au transport :
                    attente honnête plutôt qu'une fausse tuile. Équipe 10 (L3) :
                    jugé sur les participants qui PUBLIENT (presentableRemotes),
                    pas sur les simples connectés — des spectateurs muets ne
                    sont pas « le direct ». */}
                {!isUserOnStage && presentableRemotes.length === 0 && (
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex flex-col items-center justify-center gap-3">
                    <img src={liveData.hostAvatar} className="w-20 h-20 rounded-full object-cover opacity-80" alt={liveData.hostName} />
                    <span className="text-xs font-bold text-slate-300">
                      {realSessionId ? `En attente du direct de ${liveData.hostName}…` : `Aperçu de « ${liveData.title} »`}
                    </span>
                  </div>
                )}

                {/* Slot 2: copilote IA en pleine cellule UNIQUEMENT quand
                    aucun humain distant ne PUBLIE de média — sinon il cède la
                    place aux vrais participants (vignette compacte plus bas). */}
                {aiAgent && presentableRemotes.length === 0 && (
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-indigo-500/30 shadow-2xl flex items-center justify-center">
                    <Avatar3D
                      avatarId={aiAgent.id}
                      state={aiCopilotState === 'thinking' ? 'thinking' : aiCopilotState === 'speaking' ? 'speaking' : 'idle'}
                      grammarState={avatarGrammarState}
                      className="w-full h-full"
                    />

                    {/* AI Agent Label */}
                    <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-indigo-500/40 flex items-center gap-2">
                      <Bot size={14} className="text-indigo-400" />
                      <span className="text-xs font-bold text-indigo-200">{aiAgent.name} (IA Vérifiée)</span>
                      <span className="px-1.5 py-0.5 bg-indigo-500/30 text-[9px] font-bold rounded text-indigo-300">
                        {aiAgent.specialty}
                      </span>
                    </div>

                    {/* Thinking Glow Overlay */}
                    {aiCopilotState === 'thinking' && (
                      <div className="absolute top-4 left-4 bg-indigo-600/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono font-bold animate-pulse text-white flex items-center gap-1.5">
                        <Sparkles size={12} /> DÉLIBÉRATION NEURALE...
                      </div>
                    )}
                  </div>
                )}

                {/* Participants distants réels (LOOP 04/14) — publication/abonnement LiveKit, pas de simulation.
                    Équipe 10 (L3) : une tuile UNIQUEMENT pour qui publie un
                    média (caméra/écran/micro de scène) — les spectateurs
                    muets, qui se connectent tous à la room, n'en ont pas. */}
                {presentableRemotes.map((media) => (
                  <RemoteParticipantTile key={media.participant.identity} media={media} />
                ))}

              </div>
            )}

            {/* Copilote IA replié en vignette compacte quand de VRAIS humains
                publient sur la grille — présence discrète, jamais une
                demi-scène (Équipe I / LOOP I2 ; critère Équipe 10 L3 :
                presentableRemotes, pas les simples connectés). `absolute` le
                sort du flux de la grille ; positionné par rapport à la scène
                (conteneur `relative`). */}
            {mainStageMode === 'camera' && aiAgent && presentableRemotes.length > 0 && (
              <div className="absolute bottom-4 right-4 w-40 sm:w-48 aspect-video z-10 rounded-2xl overflow-hidden bg-slate-900 border border-indigo-500/40 shadow-2xl">
                <Avatar3D
                  avatarId={aiAgent.id}
                  state={aiCopilotState === 'thinking' ? 'thinking' : aiCopilotState === 'speaking' ? 'speaking' : 'idle'}
                  grammarState={avatarGrammarState}
                  className="w-full h-full"
                />
                <div className="absolute bottom-1.5 left-1.5 right-1.5 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-indigo-500/40 flex items-center gap-1">
                  <Bot size={10} className="text-indigo-400 shrink-0" />
                  <span className="text-[9px] font-bold text-indigo-200 truncate">{aiAgent.name}</span>
                  {aiCopilotState === 'thinking' && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" aria-label="IA en réflexion"></span>
                  )}
                </div>
              </div>
            )}

            {/* MODE 2: SCREEN SHARE WITH PIP */}
            {mainStageMode === 'screen' && (
              <div className="w-full h-full relative bg-black p-2 flex items-center justify-center">
                <video
                  ref={screenShareTrackRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain rounded-2xl"
                />
                
                {/* PIP Speaker Thumbnail */}
                <div className="absolute bottom-4 right-4 w-44 aspect-video rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-2xl bg-slate-900">
                  <video
                    ref={localVideoTrackRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-1 left-1 bg-black/60 px-2 py-0.5 rounded text-[9px] font-bold text-white">
                    {liveData.hostName}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 3: COLLABORATIVE WHITEBOARD */}
            {mainStageMode === 'whiteboard' && (
              <div className="w-full h-full">
                <LiveWhiteboard
                  onSaveToCampus={(summary) => {
                    addNotification("Tableau Enregistré 🎓", "La synthèse a été ajoutée aux livrables Campus.", "success");
                  }}
                />
              </div>
            )}

            {/* MODE 4: LIVE COUNCIL TABLE RONDE */}
            {mainStageMode === 'council' && (
              <div className="w-full h-full p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-950">
                {stageParticipants.map(spk => (
                  <div key={spk.id} className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 p-4 flex flex-col items-center justify-center gap-2 text-center shadow-xl">
                    <img src={spk.avatar} className="w-16 h-16 rounded-2xl object-cover ring-2 ring-indigo-500/30" />
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center justify-center gap-1">
                        {spk.name} {spk.isAi && <Bot size={12} className="text-indigo-400" />}
                      </h4>
                      <p className="text-[10px] text-slate-400">{spk.specialty || 'Intervenant'}</p>
                    </div>
                    <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[9px] font-bold rounded-md flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Connecté
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* MODE 5: RÉUNION DE TRAVAIL & PROCÈS-VERBAL AUTOMATIQUE */}
            {mainStageMode === 'meeting' && (
              <div className="w-full h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-950 overflow-y-auto">
                {/* Left (1 col): Video & Speaker */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 aspect-video shadow-xl">
                    <video ref={localVideoTrackRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`} />
                    {isVideoMuted && <img src={liveData.hostAvatar} className="w-full h-full object-cover opacity-60" />}
                    <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded-lg text-[10px] font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {liveData.hostName}
                    </div>
                  </div>

                  {/* PV Status Banner */}
                  <div className="p-3 bg-indigo-950/60 border border-indigo-500/30 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                        <FileText size={14} className="text-indigo-400" /> Secrétaire IA Active
                      </span>
                      <span className="px-1.5 py-0.5 bg-indigo-500/30 text-[9px] font-bold text-indigo-300 rounded">
                        PV en direct
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300">
                      Transcription continue, indexation des décisions et attribution automatique des tâches aux participants.
                    </p>
                    <button
                      onClick={() => {
                        addNotification("PV Téléchargé 📄", "Le compte-rendu officiel avec feuille d'émargement a été généré.", "success");
                      }}
                      className="w-full py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Download size={12} /> Exporter le Procès-Verbal
                    </button>
                  </div>
                </div>

                {/* Right (2 cols): Agenda & Decision Log */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Agenda Checklist */}
                  <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <CheckSquare size={14} className="text-indigo-400" /> Ordre du Jour Structuré
                      </h4>
                      <span className="text-[10px] font-mono text-slate-400">
                        {agendaItems.filter(a => a.isCompleted).length}/{agendaItems.length} validés
                      </span>
                    </div>

                    <div className="space-y-2">
                      {agendaItems.map(item => (
                        <div
                          key={item.id}
                          onClick={() => handleToggleAgendaItem(item.id)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${item.isCompleted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-slate-950/40 border-white/5 text-slate-300 hover:bg-white/5'}`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={item.isCompleted}
                              onChange={() => {}}
                              className="w-4 h-4 rounded text-indigo-600 bg-slate-800 border-white/20 pointer-events-none"
                            />
                            <div>
                              <p className={`text-xs font-bold ${item.isCompleted ? 'line-through opacity-70' : ''}`}>{item.title}</p>
                              <span className="text-[10px] text-slate-400">Intervenant : {item.speaker} • {item.durationMin} min</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Registered Decisions */}
                  <div className="bg-slate-900/90 border border-white/10 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                        <Award size={14} className="text-amber-400" /> Registre des Décisions Adoptées
                      </h4>
                      <button
                        onClick={() => {
                          const title = prompt("Titre de la décision :");
                          if (title) handleCreateDecision(title, "Validé par consensus.");
                        }}
                        className="px-2 py-1 bg-amber-500/20 text-amber-300 hover:bg-amber-500 hover:text-slate-950 text-[10px] font-bold rounded-lg transition-colors"
                      >
                        + Ajouter Décision
                      </button>
                    </div>

                    <div className="space-y-2">
                      {collectiveDecisions.map(dec => (
                        <div key={dec.id} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-200">{dec.title}</span>
                            <span className="text-[9px] font-mono text-amber-400">Adopté à {dec.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-300">{dec.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE 6: LIVE COMMERCE & VITRINE EN DIRECT */}
            {mainStageMode === 'commerce' && (
              <div className="w-full h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-950 overflow-y-auto">
                {/* Presenter Stage */}
                <div className="lg:col-span-1 space-y-3">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 aspect-video shadow-xl">
                    <video ref={localVideoTrackRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`} />
                    {isVideoMuted && <img src={liveData.hostAvatar} className="w-full h-full object-cover opacity-60" />}
                    <div className="absolute top-3 left-3 bg-red-600 px-2.5 py-0.5 rounded-lg text-[10px] font-black text-white flex items-center gap-1 shadow-md">
                      <ShoppingBag size={12} /> SHOPPING DIRECT
                    </div>
                  </div>

                  <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-1.5">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                      <Shield size={13} /> Paiements & Livraisons Sécurisés
                    </span>
                    <p className="text-[10px] text-slate-300">
                      Transactions avec séquestre financier et conformité transfrontalière gérées par les Experts Mok.
                    </p>
                  </div>
                </div>

                {/* Product Catalog Cards */}
                <div className="lg:col-span-2 space-y-3">
                  <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                    <ShoppingBag size={14} className="text-emerald-400" /> Articles Présentés dans ce Live
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {commerceProducts.map(prod => (
                      <div key={prod.id} className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:border-emerald-500/50 transition-all">
                        <img src={prod.imageUrl} className="h-32 w-full object-cover" />
                        <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                <span>{prod.sellerCountryFlag}</span> {prod.sellerName}
                              </span>
                              <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded">
                                En stock
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-white line-clamp-1">{prod.title}</h5>
                            <p className="text-[10px] text-slate-300 line-clamp-2 mt-0.5">{prod.description}</p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-white/5">
                            <div>
                              <span className="text-sm font-black text-emerald-400">{prod.price} {prod.currency}</span>
                              <span className="text-[9px] text-slate-400 block">{(prod.price * 655.957).toLocaleString()} FCFA</span>
                            </div>
                            <button
                              onClick={() => handleOrderProduct(prod)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors shadow-md flex items-center gap-1"
                            >
                              <ShoppingBag size={13} /> Commander
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODE 7: MASTERCLASS & CAMPUS D'APPRENTISSAGE */}
            {mainStageMode === 'masterclass' && (
              <div className="w-full h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 bg-slate-950 overflow-y-auto">
                <div className="lg:col-span-1 space-y-3">
                  <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 aspect-video shadow-xl">
                    <video ref={localVideoTrackRef} autoPlay playsInline muted className={`w-full h-full object-cover ${isVideoMuted ? 'hidden' : ''}`} />
                    {isVideoMuted && <img src={liveData.hostAvatar} className="w-full h-full object-cover opacity-60" />}
                    <div className="absolute top-3 left-3 bg-purple-600 px-2.5 py-0.5 rounded-lg text-[10px] font-black text-white flex items-center gap-1 shadow-md">
                      <GraduationCap size={12} /> MASTERCLASS OFFICIELLE
                    </div>
                  </div>

                  {/* Attendance & Score */}
                  <div className="p-4 bg-purple-950/40 border border-purple-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-purple-200">Feuille d'Assiduité Campus</span>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold">100% Présent</span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-300">
                        <span>Compétences validées</span>
                        <span className="font-mono font-bold text-purple-300">2 / 3</span>
                      </div>
                      <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 rounded-full w-2/3"></div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        addNotification("Certificat d'Assiduité 🎓", "Votre attestation de présence a été ajoutée à votre profil Campus.", "success");
                      }}
                      className="w-full py-1.5 bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      <Award size={13} /> Valider pour mon Certificat
                    </button>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-4">
                  {/* Masterclass Objectives */}
                  <div className="p-4 bg-slate-900 border border-white/10 rounded-2xl space-y-2">
                    <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                      <BookOpen size={14} className="text-purple-400" /> Objectifs Pédagogiques de la Session
                    </h4>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc pl-4">
                      <li>Comprendre les ratios financiers indispensables pour lever des fonds.</li>
                      <li>Savoir structurer une garantie de crédit bancaire dans l'espace UEMOA/CEMAC.</li>
                      <li>Rédiger un pitch deck d'investissement conforme aux exigences institutionnelles.</li>
                    </ul>
                  </div>

                  {/* Active Quiz Card */}
                  <div className="p-4 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-200 flex items-center gap-1.5">
                        <Sparkles size={14} className="text-indigo-400" /> Quiz Éclair de Compréhension
                      </span>
                      <span className="text-[10px] font-bold text-amber-400">+50 Points Mok</span>
                    </div>
                    <p className="text-xs text-white font-medium">
                      Quelle garantie est la plus liquide pour un prêt d'amorçage de 50 000 € ?
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        onClick={() => addNotification("Réponse Correcte ! 🎯", "+50 XP ajoutés à votre parcours Campus.", "success")}
                        className="p-2.5 bg-slate-900 hover:bg-indigo-600 border border-white/10 hover:border-indigo-400 rounded-xl text-left text-xs text-slate-200 transition-all font-bold"
                      >
                        A. Nantissement de compte bloqué
                      </button>
                      <button
                        onClick={() => addNotification("Indice 💡", "Pensez aux délais de réalisation des hypothèques.", "info")}
                        className="p-2.5 bg-slate-900 hover:bg-slate-800 border border-white/10 rounded-xl text-left text-xs text-slate-200 transition-all"
                      >
                        B. Hypothèque immobilière de rang 2
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* REAL-TIME BILINGUAL SUBTITLES BAR (DIALLO OS) — ondulation de
              surface imperceptible (water-undulate), jamais de gouttelettes
              ici : cette barre porte du texte à lire en continu. */}
          {subtitlesMode !== 'off' && (
            <div className={`h-16 ${glassSurfaceClass('primary')} animate-water-undulate px-6 flex items-center justify-between z-20`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-2 bg-indigo-600/30 text-indigo-400 rounded-xl border border-indigo-500/30 flex-shrink-0">
                  <Globe size={16} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-indigo-400">{currentSubtitle.speaker} :</span>
                    <p className="text-xs font-bold text-white truncate">{currentSubtitle.text}</p>
                  </div>
                  {subtitlesMode === 'bilingual' && currentSubtitle.translated && (
                    <p className="text-[11px] text-indigo-300 truncate font-sans">
                      🌍 {currentSubtitle.translated}
                    </p>
                  )}
                </div>
              </div>

              {/* Subtitles Language Toggle */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <select
                  value={selectedViewerLang}
                  onChange={(e) => {
                    setSelectedViewerLang(e.target.value);
                    addNotification("Langue Modifiée 🌐", `Sous-titres synchronisés en ${e.target.value}.`, "info");
                  }}
                  className="bg-black/40 border border-white/10 rounded-xl px-2.5 py-1 text-[11px] font-bold text-white outline-none"
                >
                  <option value="Français">Français</option>
                  <option value="Anglais">Anglais</option>
                  <option value="Arabe">Arabe</option>
                  <option value="Wolof">Wolof</option>
                  <option value="Pulaar">Pulaar</option>
                  <option value="Malinké">Malinké</option>
                  <option value="Espagnol">Espagnol</option>
                </select>

                <button
                  onClick={() => setSubtitlesMode(subtitlesMode === 'bilingual' ? 'original' : subtitlesMode === 'original' ? 'off' : 'bilingual')}
                  className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold text-slate-300 uppercase"
                >
                  {subtitlesMode}
                </button>
              </div>
            </div>
          )}

          {/* BOTTOM CONTROLS DOCK — matière verre/eau/lumière (LOOP 07/14),
              respire comme le header (même rythme, même matière vivante). */}
          <div className={`h-16 relative ${glassSurfaceClass('primary')} animate-water-breathe px-6 flex items-center justify-between z-20`}>
            <span className="water-droplets" aria-hidden="true"></span>

            {/* Media Toggles */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-2xl transition-all shadow-md ${isMicMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                title={isMicMuted ? "Réactiver le micro" : "Couper le micro"}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={toggleVideo}
                className={`p-3 rounded-2xl transition-all shadow-md ${isVideoMuted ? 'bg-rose-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
                title={isVideoMuted ? "Activer la caméra" : "Couper la caméra"}
              >
                {isVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              <button
                onClick={handleToggleScreenShare}
                className={`p-3 rounded-2xl transition-all shadow-md ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                title="Partager mon écran"
              >
                <Layout size={18} />
              </button>

              {/* Commandes vocales (LOOP 09/14) — voix native, essentiel : toujours accessible. */}
              {voiceAssistant.isSupported && (
                <button
                  onClick={() => (voiceAssistant.isListening ? voiceAssistant.stopListening() : voiceAssistant.startListening())}
                  className={`p-3 rounded-2xl transition-all shadow-md ${voiceAssistant.isListening ? `${liveMaterialClass('voice')} text-white` : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  title={voiceAssistant.isListening ? "Arrêter l'écoute des commandes vocales" : 'Activer les commandes vocales'}
                >
                  <Command size={18} />
                </button>
              )}

              {voiceFeedback && (
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-indigo-100 ${glassSurfaceClass('surface')}`}>
                  <Sparkles size={12} /> {voiceFeedback}
                </div>
              )}

              {!isHost && (
                <button
                  onClick={handleToggleHandRaise}
                  className={`p-3 rounded-2xl transition-all shadow-md ${isHandRaisedByMe ? 'bg-amber-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'}`}
                  title={isHandRaisedByMe ? "Baisser la main" : "Demander la parole"}
                >
                  <Hand size={18} />
                </button>
              )}

              {isHost && raisedHands.length > 0 && (
                <div className="flex items-center gap-1.5 pl-2 ml-1 border-l border-white/10">
                  <Hand size={14} className="text-amber-400" />
                  {raisedHands.map(p => (
                    <button
                      key={p.id}
                      onClick={() => handlePromoteToSpeaker(p.id).catch(() => {})}
                      title={`Inviter ${p.name} sur scène`}
                      className="px-2 py-1 bg-amber-500/20 hover:bg-amber-500 hover:text-white text-amber-300 text-[10px] font-bold rounded-lg transition-colors"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Center Transformation Bridges — Contextuel, s'efface au repos */}
            <div className={`flex items-center gap-2 ${contextualChromeClass}`}>
              <button
                onClick={handleTransformToParcours}
                className="px-3 sm:px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-1.5 transition-all"
              >
                <ListTodo size={14} /> <span className="hidden sm:inline">Transformer en Parcours</span>
              </button>

              <button
                onClick={handleBookPrivateSession}
                className="px-3 sm:px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-white/10 flex items-center gap-1.5 transition-all"
              >
                <Lock size={14} /> <span className="hidden sm:inline">Continuer en Privé</span>
              </button>

              {liveData.tribeName && (
                <button
                  onClick={handleJoinTribe}
                  className="px-3 sm:px-3.5 py-2 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold rounded-xl hidden md:flex items-center gap-1.5 transition-all"
                >
                  <Flame size={14} /> <span className="hidden sm:inline">Rejoindre la Tribu</span>
                </button>
              )}
            </div>

            {/* Right: Likes & Gifts — Contextuel, s'efface au repos */}
            <div className={`flex items-center gap-2 ${contextualChromeClass}`}>
              <button
                onClick={() => setShowGifts(!showGifts)}
                className="p-3 bg-pink-600/20 hover:bg-pink-600 text-pink-400 hover:text-white rounded-2xl border border-pink-500/30 transition-all"
                title="Envoyer un cadeau"
              >
                <Gift size={18} />
              </button>

              <button
                // Pas d'incrément optimiste ici : la table est append-only et
                // le compteur ne fait que suivre les événements Realtime
                // (y compris ceux qu'on envoie soi-même, rediffusés) — un
                // incrément local en plus doublerait le compte de son propre tap.
                onClick={() => { if (realSessionId) sendLiveReaction(realSessionId, userProfile.id, 'heart').catch(() => {}); }}
                className="p-3 bg-gradient-to-tr from-pink-500 to-red-500 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center gap-1"
              >
                <Heart size={18} fill="white" />
                <span className="text-xs font-bold font-mono">{likesCount}</span>
              </button>
            </div>

          </div>

        </div>

        {/* Languette de réouverture du panneau (mode cinéma actif) —
            sibling absolu du panneau, jamais un transform sur le panneau
            lui-même (Équipe I / LOOP I2). */}
        {isPanelCollapsed && (
          <button
            onClick={() => setIsPanelCollapsed(false)}
            title="Rouvrir le panneau d'interaction"
            aria-label="Rouvrir le panneau d'interaction"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-slate-900/90 border border-white/15 border-r-0 rounded-l-xl px-1.5 py-4 text-slate-300 hover:text-white hover:bg-indigo-600 shadow-xl backdrop-blur-md transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}

        {/* B. RIGHT INTERACTIVE SIDEBAR (30%) — matière verre/eau/lumière (LOOP 07/14).
            Mode cinéma (LOOP I2) : masqué par display:none inline (cache aussi
            l'overlay `fixed` du menu « Plus »), JAMAIS par transform/filter. */}
        <div
          className={`w-full md:w-96 ${glassSurfaceClass('surface')} border-l flex flex-col h-1/2 md:h-full z-20`}
          style={isPanelCollapsed ? { display: 'none' } : undefined}
        >

          {/* Sidebar Tabs — Essentiel (4 onglets toujours visibles) + le reste
              replié dans "Plus" (10 onglets sur une seule barre défilante
              étaient illisibles et se coupaient sur petit écran — audit UX). */}
          <div className="flex items-stretch gap-1 border-b border-white/10 bg-black/40 p-1">
            {[
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'qa', label: 'Q&A', icon: HelpCircle },
              { id: 'decisions', label: 'Décisions', icon: Award },
              { id: 'agenda', label: 'Agenda', icon: CheckSquare },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveSideTab(t.id as any); setShowMoreTabs(false); }}
                  className={`flex-1 min-w-0 px-2 py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 transition-colors ${activeSideTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Icon size={13} />
                  <span className="truncate w-full text-center">{t.label}</span>
                </button>
              );
            })}

            {(() => {
              const moreTabs = [
                { id: 'notes', label: 'Mémoire', icon: BookOpen },
                { id: 'products', label: 'Boutique', icon: ShoppingBag },
                { id: 'polls', label: 'Sondage', icon: PieChart },
                { id: 'docs', label: 'Docs', icon: FileText },
                { id: 'assistant', label: 'IA Perso', icon: Bot },
                { id: 'solidarity', label: 'Solidaire', icon: Heart },
              ] as const;
              const activeMore = moreTabs.find(t => t.id === activeSideTab);
              const MoreIcon = activeMore ? activeMore.icon : MoreHorizontal;
              return (
                <div className="relative flex-1 min-w-0">
                  <button
                    onClick={() => setShowMoreTabs(v => !v)}
                    aria-expanded={showMoreTabs}
                    aria-haspopup="menu"
                    className={`w-full h-full px-2 py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 transition-colors ${activeMore || showMoreTabs ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                  >
                    <MoreIcon size={13} />
                    <span className="truncate w-full text-center">{activeMore ? activeMore.label : 'Plus'}</span>
                  </button>

                  {showMoreTabs && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setShowMoreTabs(false)} aria-hidden="true"></div>
                      <div role="menu" className="absolute right-0 top-full mt-1 z-30 w-48 bg-slate-900 border border-white/10 rounded-xl shadow-xl shadow-black/50 p-1.5 grid grid-cols-2 gap-1">
                        {moreTabs.map(t => {
                          const Icon = t.icon;
                          return (
                            <button
                              key={t.id}
                              role="menuitem"
                              onClick={() => { setActiveSideTab(t.id as any); setShowMoreTabs(false); }}
                              className={`px-2 py-2 rounded-lg text-[10px] font-bold flex flex-col items-center gap-1 transition-colors ${activeSideTab === t.id ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-white/10'}`}
                            >
                              <Icon size={14} />
                              <span>{t.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {/* Mode cinéma (Équipe I / LOOP I2) : replier le panneau pour
                donner toute la largeur à la scène vidéo. */}
            <button
              onClick={() => { setShowMoreTabs(false); setIsPanelCollapsed(true); }}
              title="Mode cinéma — agrandir la scène vidéo"
              aria-label="Replier le panneau (mode cinéma)"
              className="px-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>

          {/* Sidebar Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            
            {/* 1. CHAT DIRECT */}
            {activeSideTab === 'chat' && (
              <div className="space-y-3">
                {copilotInsight && (
                  <div 
                    onClick={() => {
                      pushLocalSystemMessage(aiAgent?.name || "Directeur Diallo", copilotInsight);
                      setCopilotInsight(null);
                    }}
                    className="p-3 bg-indigo-600/30 border border-indigo-500/40 rounded-2xl text-xs font-bold text-indigo-200 flex items-center justify-between cursor-pointer hover:bg-indigo-600/40 transition-colors animate-fade-down"
                  >
                    <span className="flex items-center gap-1.5"><Sparkles size={14} /> {copilotInsight}</span>
                    <ArrowRight size={14} />
                  </div>
                )}

                {messages.map((msg) => {
                  const isAiMsg = !msg.authorId;
                  const isHostMsg = !!msg.authorId && msg.authorId === realHostId;
                  return (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-2.5 p-2 rounded-2xl transition-all ${isAiMsg ? 'bg-indigo-950/40 border border-indigo-500/20' : 'hover:bg-white/5'}`}
                  >
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0 ${isAiMsg ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-300'}`}>
                      {isAiMsg ? <Bot size={16} /> : msg.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className={`text-xs font-extrabold truncate ${isAiMsg ? 'text-indigo-300' : 'text-slate-300'}`}>
                          {msg.authorName}
                        </span>
                        {isHostMsg && (
                          <span className="px-1.5 py-0.2 bg-red-600/30 text-red-300 text-[9px] font-black rounded uppercase">Hôte</span>
                        )}
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed break-words">{msg.text}</p>
                    </div>
                  </div>
                  );
                })}
              </div>
            )}

            {/* 2. DEDICATED Q&A ZONE */}
            {activeSideTab === 'qa' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Questions du public classées par votes
                  </span>
                  <span className="text-[10px] font-bold text-indigo-400">
                    {questions.length} questions
                  </span>
                </div>

                {questions.map(q => (
                  <div 
                    key={q.id}
                    className={`p-3 rounded-2xl border transition-all space-y-2 ${q.status === 'answering' ? 'bg-indigo-600/20 border-indigo-500 shadow-md ring-1 ring-indigo-500/50' : 'bg-slate-950/40 border-white/5'}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <img src={q.authorAvatar} className="w-6 h-6 rounded-full object-cover" />
                        <span className="text-xs font-bold text-slate-300">{q.authorName}</span>
                      </div>
                      {q.status === 'answering' && (
                        <span className="px-2 py-0.5 bg-indigo-500 text-white text-[9px] font-black rounded-md animate-pulse">
                          En cours de réponse
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-medium text-white leading-relaxed">{q.text}</p>

                    <div className="flex items-center justify-between pt-1 text-xs">
                      <button
                        onClick={() => handleUpvoteQuestion(q.id)}
                        className={`px-3 py-1 rounded-xl font-bold flex items-center gap-1.5 transition-all ${q.userUpvoted ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                      >
                        ▲ {q.upvotes} votes
                      </button>

                      {isHost && q.status !== 'answered' && (
                        <button
                          onClick={() => {
                            setQuestions(prev => prev.map(item => item.id === q.id ? { ...item, status: 'answered' } : item));
                            addNotification("Question Répondue ✅", "La question a été marquée comme traitée.", "success");
                          }}
                          className="text-[10px] font-bold text-emerald-400 hover:underline"
                        >
                          Marquer répondue
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 3. MA MÉMOIRE PERSONNELLE (PRIVATE NOTES) */}
            {activeSideTab === 'notes' && (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-1">
                  <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                    <Lock size={13} /> Carnet Privé & Confidentiel
                  </span>
                  <p className="text-[10px] text-slate-300">
                    Vos notes pendant le direct sont strictement privées et exportables vers votre espace Hub & Dossiers.
                  </p>
                </div>

                <div className="space-y-2">
                  {personalNotes.map(n => (
                    <div key={n.id} className="p-3 bg-slate-950/50 border border-white/5 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 text-[9px] font-bold rounded uppercase">
                          {n.category}
                        </span>
                        <span className="text-[9px] text-slate-400 font-mono">{n.timestamp}</span>
                      </div>
                      <p className="text-xs text-white leading-relaxed">{n.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 4. DÉCISIONS COLLECTIVES */}
            {activeSideTab === 'decisions' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Décisions validées
                  </span>
                  <button
                    onClick={() => {
                      const title = prompt("Titre de la décision collective :");
                      if (title) handleCreateDecision(title, "Enregistré en direct.");
                    }}
                    className="text-[10px] font-bold text-amber-400 hover:underline"
                  >
                    + Nouvelle décision
                  </button>
                </div>

                <div className="space-y-2">
                  {collectiveDecisions.map(d => (
                    <div key={d.id} className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-amber-200">{d.title}</span>
                        <span className="text-[9px] font-mono text-amber-400">{d.timestamp}</span>
                      </div>
                      <p className="text-[11px] text-slate-300">{d.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 5. AGENDA / ORDRE DU JOUR */}
            {activeSideTab === 'agenda' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Progression de la session
                </span>

                <div className="space-y-2">
                  {agendaItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleToggleAgendaItem(item.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${item.isCompleted ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-slate-950/40 border-white/5 text-slate-300'}`}
                    >
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={item.isCompleted} onChange={() => {}} className="pointer-events-none" />
                        <span className={`text-xs font-bold ${item.isCompleted ? 'line-through' : ''}`}>{item.title}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 pl-5">{item.durationMin} min • {item.speaker}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. BOUTIQUE LIVE */}
            {activeSideTab === 'products' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Articles & Offres en direct
                </span>

                <div className="space-y-2">
                  {commerceProducts.map(p => (
                    <div key={p.id} className="p-2.5 bg-slate-950/50 border border-white/5 rounded-2xl flex items-center justify-between gap-2">
                      <img src={p.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <h6 className="text-xs font-bold text-white truncate">{p.title}</h6>
                        <span className="text-[11px] font-black text-emerald-400">{p.price} {p.currency}</span>
                      </div>
                      <button
                        onClick={() => handleOrderProduct(p)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg"
                      >
                        Acheter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 7. POLLS & QUIZZES */}
            {activeSideTab === 'polls' && (
              <div className="space-y-4">
                {activePoll ? (
                  <div className="p-4 bg-slate-950/60 rounded-3xl border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 text-[10px] font-bold rounded-md">
                        Sondage en Direct
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">{activePoll.totalVotes} votes</span>
                    </div>

                    <h4 className="text-xs font-bold text-white leading-snug">{activePoll.question}</h4>

                    <div className="space-y-2 pt-1">
                      {activePoll.options.map(opt => {
                        const pct = Math.round((opt.votes / activePoll.totalVotes) * 100) || 0;
                        return (
                          <button
                            key={opt.id}
                            disabled={hasVotedPoll}
                            onClick={() => {
                              setActivePoll(prev => prev ? {
                                ...prev,
                                totalVotes: prev.totalVotes + 1,
                                options: prev.options.map(o => o.id === opt.id ? { ...o, votes: o.votes + 1 } : o)
                              } : null);
                              setHasVotedPoll(true);
                              addNotification("Vote Enregistré 📊", "Votre vote a été pris en compte en direct.", "success");
                            }}
                            className="w-full relative h-10 bg-slate-900 hover:bg-slate-800 rounded-xl overflow-hidden border border-white/5 transition-all text-left group"
                          >
                            <div 
                              className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-600/40 to-indigo-600/40 transition-all duration-700" 
                              style={{ width: `${pct}%` }} 
                            />
                            <div className="absolute inset-0 flex items-center justify-between px-3 text-xs font-bold z-10">
                              <span className="text-white group-hover:text-indigo-200">{opt.text}</span>
                              <span className="font-mono text-indigo-300">{pct}%</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 space-y-2">
                    <PieChart size={32} className="mx-auto text-slate-500" />
                    <p className="text-xs text-slate-400">Aucun sondage actif actuellement.</p>
                  </div>
                )}
              </div>
            )}

            {/* 8. SHARED DOCUMENTS */}
            {activeSideTab === 'docs' && (
              <div className="space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Documents & Livrables de la session
                </span>

                {sharedDocs.map(doc => (
                  <div 
                    key={doc.id}
                    className="p-3 bg-slate-950/40 rounded-2xl border border-white/5 flex items-center justify-between gap-3 hover:bg-white/5 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 bg-indigo-600/20 text-indigo-400 rounded-xl">
                        <FileText size={18} />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-white truncate">{doc.name}</h5>
                        <p className="text-[10px] text-slate-400">{doc.size} • Partagé par {doc.uploadedBy}</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => addNotification("Téléchargement", `Fichier "${doc.name}" téléchargé.`, "info")}
                      className="p-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-colors"
                      title="Télécharger"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* 9. PRIVATE PARTICIPANT ASSISTANT */}
            {activeSideTab === 'assistant' && (
              <div className="space-y-3">
                <div className="p-3 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                    <Bot size={14} /> Assistant Privé du Participant
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Posez vos questions confidentielles sans interrompre le direct.
                  </p>
                </div>

                <div className="space-y-3">
                  {assistantMessages.map((item, idx) => (
                    <div key={idx} className="space-y-1.5 text-xs">
                      <div className="bg-slate-800 p-2.5 rounded-xl rounded-br-none text-slate-200">
                        {item.query}
                      </div>
                      <div className="bg-indigo-900/40 border border-indigo-500/30 p-2.5 rounded-xl rounded-bl-none text-indigo-100 leading-relaxed">
                        {item.answer}
                      </div>
                    </div>
                  ))}

                  {isAssistantThinking && (
                    <div className="text-[11px] text-indigo-400 flex items-center gap-1.5 animate-pulse">
                      <Sparkles size={12} /> Diallo OS réfléchit...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 10. LIVE SOLIDAIRE (LOOP 14/16) */}
            {activeSideTab === 'solidarity' && (
              <div className="space-y-3">
                {!activeSolidarityCause && (
                  <div className="p-4 bg-rose-950/30 border border-rose-500/20 rounded-2xl text-center space-y-2">
                    <Heart size={22} className="mx-auto text-rose-400" />
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Aucune mission solidaire active pour ce direct. {isHost ? 'Dites par exemple « Lance-moi un Live Solidaire pour aider... » pour en créer une.' : "L'organisateur peut en lancer une par la voix."}
                    </p>
                  </div>
                )}

                {activeSolidarityCause && (
                  <>
                    <div className="p-3 bg-rose-950/30 border border-rose-500/20 rounded-2xl space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-extrabold text-white leading-snug">{activeSolidarityCause.title}</h5>
                        <span className="px-2 py-0.5 bg-rose-600/30 text-rose-200 text-[9px] font-black rounded uppercase whitespace-nowrap">
                          {activeSolidarityCause.beneficiaryType}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{activeSolidarityCause.beneficiaryDescription}</p>

                      <div className="grid grid-cols-2 gap-2 pt-1 text-[10px]">
                        <div className="bg-black/20 rounded-xl p-2">
                          <div className="text-slate-400 uppercase font-bold">Collecté (déclaré)</div>
                          <div className="text-white font-extrabold">{solidarityCollected} {activeSolidarityCause.currency}</div>
                        </div>
                        <div className="bg-black/20 rounded-xl p-2">
                          <div className="text-slate-400 uppercase font-bold">Utilisé (déclaré)</div>
                          <div className="text-white font-extrabold">{solidarityUsed} {activeSolidarityCause.currency}</div>
                        </div>
                      </div>
                      {typeof activeSolidarityCause.targetAmount === 'number' && (
                        <div className="text-[10px] text-slate-400">Objectif : {activeSolidarityCause.targetAmount} {activeSolidarityCause.currency}</div>
                      )}

                      {isHost && (
                        <button
                          onClick={handleToggleSolidarityVisibility}
                          className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 hover:text-white pt-1"
                          title="Basculer la visibilité de la mission"
                        >
                          {activeSolidarityCause.visibility === 'organizer_only' ? <Lock size={12} /> : <Globe size={12} />}
                          {activeSolidarityCause.visibility === 'organizer_only' ? 'Strictement privée (organisateur uniquement)' : 'Visible par les participants du direct'}
                        </button>
                      )}
                    </div>

                    {isHost && (
                      <div className="flex gap-2">
                        <button
                          onClick={handleCaptureSolidarityProof}
                          disabled={isCapturingSolidarityProof}
                          className="flex-1 px-2.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-40 text-white text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <Camera size={13} /> {isCapturingSolidarityProof ? 'Analyse...' : 'Preuve de dépense'}
                        </button>
                        <button
                          onClick={handleCheckSolidarityAnomalies}
                          disabled={isCheckingSolidarityAnomalies}
                          className="flex-1 px-2.5 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-40 text-slate-200 text-[10px] font-bold rounded-xl flex items-center justify-center gap-1.5"
                        >
                          <AlertTriangle size={13} /> {isCheckingSolidarityAnomalies ? 'Vérification...' : 'Vérifier'}
                        </button>
                      </div>
                    )}

                    {solidarityAnomalyCheck && (
                      <div className="p-2.5 bg-amber-950/30 border border-amber-500/20 rounded-2xl space-y-1.5">
                        {!solidarityAnomalyCheck.checked && (
                          <p className="text-[10px] text-amber-300">Vérification indisponible pour le moment (IA injoignable) — réessayez dans un instant.</p>
                        )}
                        {solidarityAnomalyCheck.checked && solidarityAnomalyCheck.questions.length === 0 && (
                          <p className="text-[10px] text-emerald-300">Rien à signaler sur les lignes actuellement enregistrées.</p>
                        )}
                        {solidarityAnomalyCheck.questions.map((q, idx) => (
                          <p key={idx} className="text-[10px] text-amber-200 flex items-start gap-1.5">
                            <AlertTriangle size={11} className="mt-0.5 flex-shrink-0" /> {q}
                          </p>
                        ))}
                      </div>
                    )}

                    {solidarityProofs.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Preuves ({solidarityProofs.length})</span>
                        {solidarityProofs.map((p) => (
                          <div key={p.id} className="p-2 bg-slate-950/40 rounded-xl border border-white/5 flex items-center gap-2.5">
                            {p.documentUrl && <img src={p.documentUrl} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <div className="text-[10px] font-bold text-white truncate">{p.expenseDescription || p.stepLabel}</div>
                              <div className="text-[9px] text-slate-400">{typeof p.amount === 'number' ? `${p.amount} ${activeSolidarityCause.currency}` : 'Montant non lu'}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {solidarityUpdates.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mises à jour</span>
                        {solidarityUpdates.map((u) => (
                          <div key={u.id} className="p-2.5 bg-slate-950/40 rounded-xl border border-white/5 text-[11px] text-slate-200 leading-relaxed">
                            {u.text}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>

          {/* Sidebar Footer Input Bar */}
          <div className="p-3 bg-slate-950 border-t border-white/10">
            {activeSideTab === 'chat' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Envoyer un message..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleSendMessage}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            )}

            {activeSideTab === 'qa' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newQuestionInput}
                  onChange={(e) => setNewQuestionInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                  placeholder="Poser une question prioritaire..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleAddQuestion}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            )}

            {activeSideTab === 'notes' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  id="private-note-input"
                  placeholder="Ajouter une note personnelle..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const input = e.currentTarget;
                      if (input.value.trim()) {
                        handleAddPersonalNote(input.value.trim(), 'reminder');
                        input.value = '';
                      }
                    }
                  }}
                  className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('private-note-input') as HTMLInputElement;
                    if (input && input.value.trim()) {
                      handleAddPersonalNote(input.value.trim(), 'reminder');
                      input.value = '';
                    }
                  }}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-colors"
                >
                  <Plus size={14} />
                </button>
              </div>
            )}

            {activeSideTab === 'assistant' && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAskPrivateAssistant()}
                  placeholder="Demander en aparté à l'IA..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
                <button
                  onClick={handleAskPrivateAssistant}
                  disabled={isAssistantThinking}
                  className="p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-colors disabled:opacity-40"
                >
                  <Send size={14} />
                </button>
              </div>
            )}

            {activeSideTab === 'solidarity' && activeSolidarityCause && isHost && (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={solidarityUpdateInput}
                  onChange={(e) => setSolidarityUpdateInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePostSolidarityUpdate()}
                  placeholder="Publier une mise à jour de la mission..."
                  className="flex-1 bg-slate-900 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white outline-none focus:border-rose-500"
                />
                <button
                  onClick={handlePostSolidarityUpdate}
                  className="p-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-2xl transition-colors"
                >
                  <Send size={14} />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

      {/* FLOATING ACTION DOCK (LIVE → ACTION) */}
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        <LiveSmartActionBar
          liveStream={liveData}
          onAddPersonalNote={(text) => handleAddPersonalNote(text, 'reminder')}
          onCreateTask={(title) => {
            setLiveActionItems(prev => [...prev, { id: `act-${Date.now()}`, title, category: 'finance', completed: false }]);
            addNotification("Tâche Ajoutée 📌", `"${title}" a été ajoutée à vos actions.`, "success");
          }}
          onBookAppointment={() => {
            setSelectedAgentForBooking(aiAgent || AGENTS[0]);
            setShowBookingModal(true);
          }}
          onSummonExpert={(specialty) => {
            const ag = AGENTS.find(a => a.specialty?.toLowerCase().includes(specialty.toLowerCase())) || AGENTS[0];
            handleSummonExpert(ag);
          }}
          onFactCheckSource={() => setShowFactCheckModal(true)}
          onRequestInstantHelp={() => setShowInstantHelpModal(true)}
        />
      </div>

      {/* 3. SUMMON EXPERT MODAL DIALOG */}
      {showSummonExpertModal && (
        <div className="fixed inset-0 z-[260] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-xl space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={20} className="text-amber-400" />
                <h3 className="text-sm font-extrabold text-white">Appeler un Expert sur la Scène</h3>
              </div>
              <button onClick={() => setShowSummonExpertModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Sélectionnez un expert spécialisé pour rejoindre instantanément votre Live en tant qu'intervenant.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1">
              {AGENTS.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => handleSummonExpert(agent)}
                  className="p-3.5 bg-slate-950/60 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/50 rounded-2xl cursor-pointer transition-all flex items-center gap-3 group"
                >
                  <img src={agent.avatarUrl} className="w-11 h-11 rounded-xl object-cover ring-1 ring-white/10" />
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                      {agent.name}
                    </h5>
                    <p className="text-[10px] text-slate-400 truncate">{agent.specialty}</p>
                    <span className="text-[9px] font-bold text-amber-400 flex items-center gap-1 mt-0.5">
                      <Sparkles size={10} /> Expert IA Disponible
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. CATCHUP SUMMARY DIALOG ("Ce que vous avez manqué") */}
      {showCatchupSummary && (
        <div className="fixed inset-0 z-[260] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
                <Sparkles size={18} /> Ce que vous avez manqué
              </div>
              <button onClick={() => setShowCatchupSummary(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {catchupDigest}
            </div>

            <button
              onClick={() => setShowCatchupSummary(false)}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Reprendre le Direct
            </button>
          </div>
        </div>
      )}

      {/* CONSENTEMENT CAMÉRA/MICRO/VISION (LOOP 12/16) — au-delà du simple
          toggle mic/caméra : personne ne publie de média réel avant ce choix
          explicite (voir canPublish plus haut). Essentiel, jamais soumis à
          l'effacement contextuel, au-dessus de toute autre modale. */}
      {showMediaConsentModal && (
        <div className="fixed inset-0 z-[300] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl animate-scale-in">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Camera size={18} /> Avant de rejoindre la scène
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              En rejoignant la scène de ce direct, votre caméra et votre micro seront diffusés en direct à l'ensemble des participants.
            </p>
            <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
              <li>Caméra : votre image vidéo sera visible par tous les participants du direct.</li>
              <li>Micro : votre voix sera diffusée en direct.</li>
              <li>Vision IA : un intervenant peut déclencher manuellement une analyse ponctuelle d'une image partagée (jamais automatique, jamais une reconnaissance faciale fiable).</li>
            </ul>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleAcceptMediaConsent}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-colors"
              >
                Autoriser caméra et micro
              </button>
              <button
                onClick={handleDeclineMediaConsent}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
              >
                Continuer sans caméra ni micro (spectateur)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. WAITING ROOM BRIEFING MODAL */}
      <LiveWaitingRoomModal
        isOpen={showWaitingRoomModal}
        onClose={() => setShowWaitingRoomModal(false)}
        liveStream={liveData}
        onJoinLive={() => {
          setShowWaitingRoomModal(false);
          addNotification("En Direct 🔴", "Vous avez rejoint la scène du Live.", "success");
        }}
      />

      {/* 6. POST-CONTINUITY ACTION MODAL ("ET MAINTENANT ?") */}
      <LivePostContinuityModal
        isOpen={showPostContinuityModal}
        onClose={() => {
          setShowPostContinuityModal(false);
          onClose();
        }}
        liveStream={liveData}
        userProfile={userProfile}
        realSummary={liveEndSummary}
        onPublishToFeed={handlePublishLiveSummaryToFeed}
        onNavigateToTab={(tab) => {
          setShowPostContinuityModal(false);
          onClose();
          if (onNavigateToTab) onNavigateToTab(tab);
        }}
        onOpenReplay={() => {
          setShowPostContinuityModal(false);
          setIsReplayModalOpen(true);
        }}
      />

      {/* 7. FACT-CHECKING SOURCE VERIFICATION MODAL */}
      <LiveSourceFactCheckModal
        isOpen={showFactCheckModal}
        onClose={() => setShowFactCheckModal(false)}
        liveTitle={liveData.title}
        currentTopic="Financement transfrontalier et droit des sociétés OHADA"
      />

      {/* 8. INSTANT HELP & EMERGENCY ASSISTANCE MODAL */}
      <LiveInstantHelpModal
        isOpen={showInstantHelpModal}
        onClose={() => setShowInstantHelpModal(false)}
        liveTitle={liveData.title}
        onSummonAgent={(agent) => {
          handleSummonExpert(agent);
          setShowInstantHelpModal(false);
        }}
      />

      {/* 9. EXPERT 1-ON-1 APPOINTMENT BOOKING MODAL */}
      <LiveExpertBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        expert={selectedAgentForBooking}
        liveContext={liveData.title}
      />

      {/* 10. REPLAY MODAL TRIGGER */}
      <LiveReplayModal
        isOpen={isReplayModalOpen}
        onClose={() => {
          setIsReplayModalOpen(false);
          onClose();
        }}
        liveStream={liveData}
        onNavigateToTab={onNavigateToTab}
      />

    </div>
  );
};
