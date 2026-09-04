import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
import { useLiveTransport, RemoteParticipantMedia, hasPresentableMedia, stageGridClass, liveBadge, realViewerCount, shouldStartPanelCollapsed, composeStage, orderStageAgents } from '../hooks/useLiveTransport';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { fetchLiveSession, createLiveSession, startLiveSession, joinLiveSession, leaveLiveSession, setHandRaised, updateParticipantRole, fetchActiveParticipants, updateVisualUniverse, subscribeToLiveSessionUniverse, deriveSelfStagePresence, deriveSelfMediaDirective, setParticipantMuted, setOwnMediaState, removeParticipant, inviteToLiveSession, mergeLiveStreamWithRealSession, summonExpertToLive, dismissExpertFromLive, splitRosterHumansAndAgents, deriveStageAgentIds, setFeaturedAgent, fetchFeaturedAgent, subscribeToFeaturedAgent } from '../services/live/liveSessionService';
import { sendLiveMessage, fetchRecentLiveMessages, subscribeToLiveMessages, sendLiveReaction, fetchLiveReactionCount, subscribeToLiveReactions, subscribeToLiveSpeakerChanges, postLiveAgentMessage } from '../services/live/liveChatService';
import { glassSurfaceClass, LIVE_MATERIAL_ANIMATION, LIVE_VISUAL_UNIVERSES, AvatarGrammarState, spawnWaterRipple } from '../services/live/liveMaterialSystem';
import { LiveBubbles, LiveVoiceWave } from './live/LiveMatter';
import { LiveParticipantsPanel, ROLE_LABELS } from './live/LiveParticipantsPanel';
import { LiveInviteModal } from './live/LiveInviteModal';
import { interpretLiveVoiceCommand, isVoiceCapabilityAllowed, LiveVoiceAction } from '../services/live/liveVoiceCommands';
import {
  decodeLiveParticipantMeta, listeningLanguageCode, speakerAudioDecision, subtitleForListener,
  type ListeningChoice, type LiveSubtitle,
} from '../services/live/liveListeningLanguage';
import { decodeCallData } from '../services/messaging/speechLanguage';
import { keepLiveTranscriptLine } from '../services/live/liveTranscriptService';
import { useLiveListeningLanguage } from '../hooks/useLiveListeningLanguage';
import { ListeningLanguagePicker } from './live/ListeningLanguagePicker';
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
const RemoteParticipantTile: React.FC<{ media: RemoteParticipantMedia; roleLabel?: string }> = ({ media, roleLabel }) => {
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) media.videoTrack?.attach(el);
    else media.videoTrack?.detach();
  }, [media.videoTrack]);

  return (
    <div className="live-pane flex items-center justify-center">
      {media.videoTrack ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <>
          {/* Sans caméra, la carte n'est pas un trou noir : la matière vit. */}
          <LiveBubbles count={4} />
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-light relative z-10 border-2"
            style={{ borderColor: 'var(--live-line)', color: 'var(--live-ink)', background: 'rgba(255,255,255,0.06)' }}
          >
            {media.participant.name.charAt(0).toUpperCase()}
          </div>
        </>
      )}
      {/* DS-L1 : pastille + onde de voix en tête de carte, plaque de nom en
          pied — le même vocabulaire que la carte de l'expert dans l'image. */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10">
        <LiveVoiceWave muted={!media.participant.isSpeaking} />
      </div>
      <div className="live-nameplate">
        <span className="truncate">{media.participant.name}</span>
        {/* MB-2 : le rôle sur la carte elle-même — sans lui, un spectateur
            voyait quatre visages sans savoir lequel anime. Le libellé vient du
            rôle RÉEL de `live_speakers` ; quand la personne n'est pas (encore)
            dans le roster, rien ne s'affiche — on n'invente pas un rôle pour
            remplir la carte.
            MB-1 : sur téléphone la plaque s'empile (voir `.live-nameplate` en
            requête média), donc le nom n'est plus amputé par le rôle. */}
        {roleLabel && (
          <span
            className="live-nameplate-role shrink-0 tracking-[0.18em] opacity-80"
            data-testid={`stage-role-${media.participant.identity}`}
          >
            {roleLabel}
          </span>
        )}
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
const RemoteAudioSink: React.FC<{ participants: RemoteParticipantMedia[]; listeningChoice?: ListeningChoice }> = ({ participants, listeningChoice = null }) => (
  <>
    {participants.map((media) => {
      // LIVE PLANÉTAIRE — décision PAR INTERVENANT, jamais globale : dans un
      // direct, je peux entendre l'un en version originale (il parle déjà ma
      // langue) et l'autre par l'interprète, au même instant.
      const mine = listeningLanguageCode(listeningChoice);
      const interpreterTrack = mine ? media.interpreterTracksByLanguage?.[mine] : undefined;
      const decision = speakerAudioDecision({
        myChoice: listeningChoice,
        speakerLanguage: decodeLiveParticipantMeta(media.metadata).spoken,
        interpreterAvailable: !!interpreterTrack,
      });
      return (
        <React.Fragment key={media.participant.identity}>
          {/* La voix originale est COUPÉE (`muted`), jamais retirée du DOM :
              elle doit reprendre instantanément si l'interprète s'arrête, et
              `muted` est la seule commande que les téléphones honorent
              réellement (le volume est ignoré sur iOS — mesuré côté appels). */}
          {media.audioTrack && (
            <SinkAudioElement
              track={media.audioTrack}
              muted={decision.originalVolume === 0}
              testId={`live-original-audio-${media.participant.identity}`}
            />
          )}
          {decision.interpreted && interpreterTrack && (
            <SinkAudioElement
              track={interpreterTrack}
              testId={`live-interpreter-audio-${media.participant.identity}`}
              language={mine ?? undefined}
            />
          )}
          {media.screenShareAudioTrack && <SinkAudioElement track={media.screenShareAudioTrack} />}
        </React.Fragment>
      );
    })}
  </>
);

/**
 * Un élément de son, nommé. Le nom (`data-testid`) et la langue rendue
 * (`data-language`) ne changent rien à ce qui s'entend : ils rendent le
 * chemin audio OBSERVABLE, exactement comme côté appels
 * (`original-audio` / `interpreter-audio`). Sans eux, « la bonne voix sort
 * du bon haut-parleur » ne se mesure pas — il faudrait le croire.
 */
const SinkAudioElement: React.FC<{
  track: NonNullable<RemoteParticipantMedia['audioTrack']>;
  muted?: boolean;
  testId?: string;
  language?: string;
}> = ({ track, muted, testId, language }) => {
  const ref = useCallback((el: HTMLAudioElement | null) => {
    if (el) track.attach(el);
    else track.detach();
  }, [track]);
  return <audio ref={ref} autoPlay muted={muted} data-testid={testId} data-language={language} />;
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
  /**
   * LV-1 — LA CAUSE RACINE de « personne ne voit rien, il n'y a pas de
   * spectateurs ».
   *
   * AVANT : un seul état `stageParticipants` initialisé sur un participant
   * FICTIF (`id: 'spk-host'`, nom repris de la carte du fil) — et la vraie
   * liste, pourtant relue en base toutes les 4 secondes par
   * `fetchActiveParticipants`, était JETÉE : on n'en gardait que mon propre
   * rôle et les mains levées. La scène ne montrait donc jamais les personnes
   * réellement connectées, quel qu'en soit le nombre.
   *
   * MAINTENANT, deux sources séparées et honnêtes :
   * - `realParticipants` : les humains, tels qu'ils sont EN BASE
   *   (`live_speakers`, `left_at IS NULL`). Personne d'inventé, jamais.
   * - `agentParticipants` : les agents IA convoqués, qui n'ont pas de ligne
   *   `live_speakers` — ce sont des présences pilotées par le client, et le
   *   code doit pouvoir le dire au lieu de les confondre avec des comptes.
   */
  const [realParticipants, setRealParticipants] = useState<LiveStageParticipant[]>([]);
  const [agentParticipants, setAgentParticipants] = useState<LiveStageParticipant[]>(
    aiAgent
      ? [{
          id: `spk-ai-${aiAgent.id}`,
          name: `${aiAgent.name} (IA)`,
          avatar: aiAgent.avatarUrl,
          role: 'expert_ai' as const,
          isMuted: false,
          isVideoOn: true,
          isAi: true,
          specialty: aiAgent.specialty,
          agentId: aiAgent.id,
        }]
      : [],
  );
  const stageParticipants = useMemo(
    () => [...realParticipants, ...agentParticipants],
    [realParticipants, agentParticipants],
  );

  /**
   * DS-L1 : agents que l'hôte a retirés de la scène. Une liste d'exclusion
   * plutôt qu'une suppression de `aiAgent` : le copilote reste disponible
   * (chat, commandes vocales, résumé) — c'est SA CARTE qui quitte la scène,
   * pas l'assistant qui disparaît du direct.
   */
  const [agentsRetires, setAgentsRetires] = useState<string[]>([]);

  /**
   * EX-5 — Expert actuellement mis en avant, lu depuis la SESSION
   * (`live_sessions.featured_agent_id`) et non depuis un état local : c'est ce
   * qui fait que la mise en avant est la même sur tous les écrans.
   */
  const [expertEnAvant, setExpertEnAvant] = useState<string | null>(null);

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
  // LV-3 : mêmes miroirs pour les deux décisions subies (micro coupé par
  // l'hôte, retrait du direct) — le polling toutes les 4 s lit ces refs, pas
  // l'état figé de sa closure.
  const isMicMutedRef = useRef(isMicMuted);
  useEffect(() => { isMicMutedRef.current = isMicMuted; }, [isMicMuted]);
  const presentInSessionRef = useRef(false);
  const removedByHostRef = useRef(false);
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
    removedByHostRef.current = false;
    joinLiveSession(realSessionId, { id: userProfile.id, name: userProfile.name, avatar: userProfile.avatarUrl }, isHost ? 'host' : 'viewer')
      .then(() => { presentInSessionRef.current = true; })
      .catch((err) => console.error('SocialLive: échec pour rejoindre la session', err));
    return () => {
      presentInSessionRef.current = false;
      leaveRealSession();
    };
  }, [realSessionId]);

  // Transport vidéo réel (LOOP 04/14) — une room LiveKit par session LIVE
  // réelle, publication activée seulement si l'utilisateur est réellement
  // sur scène (cohérent avec le jeton émis côté serveur) ET a donné son
  // consentement explicite (LOOP 12/16) — jamais de getUserMedia déclenché
  // avant ce choix. Désactivé tant que la session réelle n'est pas
  // confirmée (voir ci-dessus).
  // LP-7 — le canal de données de la room porte la parole du direct
  // (sous-titres). Le vrai traitement est écrit plus bas, là où la langue
  // d'écoute et le roster sont connus ; on ne passe ici qu'un relais, parce
  // que le transport se monte avant eux.
  const onLiveDataRef = useRef<(payload: Uint8Array, from?: string) => void>(() => { /* pas encore prêt */ });
  const liveTransport = useLiveTransport({
    roomName: realSessionId || '',
    participantName: userProfile.name,
    canPublish: isUserOnStage && hasMediaConsent,
    enabled: !!realSessionId,
    onDataReceived: (payload, from) => onLiveDataRef.current(payload, from),
  });

  // LIVE PLANÉTAIRE — MA langue d'écoute (LP-3).
  //
  // Deux moitiés indépendantes, tenues par un seul crochet :
  //  - AUDITEUR : tout le monde, y compris un spectateur sans micro ni
  //    caméra ; mon choix voyage dans mes métadonnées pour que les
  //    intervenants sachent quelles langues produire.
  //  - INTERVENANT : seulement si je suis réellement sur scène avec un micro
  //    publié ; une transcription, N traductions, une piste par LANGUE —
  //    jamais une par auditeur.
  //
  // Par défaut : Original. Personne n'entend une traduction sans l'avoir
  // demandée, et rien n'est produit tant que personne n'en demande.
  const interpreterAudibleRef = useRef(false);
  const listening = useLiveListeningLanguage({
    transport: liveTransport,
    canProduce: isUserOnStage && hasMediaConsent,
    myLanguageHint: userProfile.preferredLanguage || undefined,
    isInterpreterAudible: () => interpreterAudibleRef.current,
    // LP-7 — GARDER la parole, mais seulement les mots d'origine (les
    // traductions se recalculent) et seulement si l'animateur a activé
    // l'enregistrement : la base refuse l'écriture sinon, c'est elle qui fait
    // foi, pas cette condition côté écran.
    onTranscript: (line) => {
      if (line.targetLanguage || !realSessionId) return;
      void keepLiveTranscriptLine({
        sessionId: realSessionId,
        speakerId: userProfile.id,
        speakerName: userProfile.name,
        text: line.text,
        language: line.language,
      });
    },
  });
  // Une voix d'interprète sort de MON haut-parleur quand je suis abonné à une
  // piste dans MA langue chez quelqu'un que le serveur détecte en train de
  // parler : mon micro capte alors autre chose que ma voix, et le découpeur
  // doit se mettre en pause (leçon des appels — sans quoi on retraduit la
  // traduction).
  interpreterAudibleRef.current = (() => {
    const mine = listeningLanguageCode(listening.choice);
    if (!mine) return false;
    return liveTransport.remoteParticipants.some((p) =>
      !!p.interpreterTracksByLanguage?.[mine] && liveTransport.activeSpeakerIds.includes(p.participant.identity));
  })();

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
  // DS-L0 — les agents IA présents sur la scène : le copilote de la session
  // ET tous les experts convoqués (santé, enseignement, partenariats,
  // commercial, architecte…). `stageParticipants` les accumulait déjà
  // correctement ; c'est la SCÈNE qui ne leur donnait pas de carte.
  // DS-L1 : « inviter, retirer, gérer humain ET agent ».
  // EX-2 : la règle « qui est en scène » vit désormais dans une fonction pure
  // et testée (`deriveStageAgentIds`) — dès qu'un direct RÉEL existe, c'est
  // `live_speakers` qui fait autorité, y compris pour le copilote. Sans cela
  // la scène n'était identique chez tous que par coïncidence, et un retrait
  // décidé par l'animateur ne descendait que chez lui.
  const stageAgents = useMemo(() => {
    const ids = deriveStageAgentIds({
      hasRealSession: !!realSessionId,
      copilotId: aiAgent?.id,
      rosterAgentIds: stageParticipants.filter(p => p.isAi && p.agentId).map(p => p.agentId as string),
      retiredAgentIds: agentsRetires,
      knownAgentIds: AGENTS.map(a => a.id),
    });
    return ids.map(id => AGENTS.find(a => a.id === id)).filter((a): a is Agent => !!a);
  }, [aiAgent, realSessionId, stageParticipants, agentsRetires]);

  // Règle centrale (Direction, 03/09/2026) : six cartes au minimum, humains et
  // agents confondus. Une seule source de vérité — `composeStage`, testée à
  // part — décide qui occupe la scène ; le rendu ne fait que la suivre.
  // AVANT : la carte de l'agent n'existait que `si aucun humain distant ne
  // publiait`. On pouvait donc convoquer cinq experts et n'en voir aucun.
  const stage = composeStage({
    isUserOnStage,
    humans: presentableRemotes.map(m => ({ id: m.participant.identity, name: m.participant.identity })),
    agents: stageAgents.map(a => ({ id: a.id, name: a.name })),
    // EX-5 : l'expert mis en avant occupe la première carte et ne peut jamais
    // tomber dans le débordement.
    spotlightAgentId: expertEnAvant || undefined,
  });
  // La pastille de débordement occupe elle aussi une cellule : la grille doit
  // la compter, sinon la dernière rangée se déséquilibre.
  const cameraTileCount = stage.tiles.length + (stage.overflow > 0 ? 1 : 0);
  const humainsVisibles = new Set(
    stage.tiles.filter(t => t.kind === 'human').map(t => t.id.slice('human:'.length)),
  );
  // EX-6 : la scène est peinte DANS L'ORDRE décidé par `composeStage`, pas dans
  // l'ordre où le JSX se trouve écrit — règle isolée et testée à part.
  const { visibles: agentsVisibles, enTete: agentsEnTete } = orderStageAgents(stageAgents, stage.tiles);

  /**
   * MB-2 — Le rôle RÉEL de chaque personne présente sur la scène, pour
   * l'écrire sur sa carte. La source est `realParticipants`, c'est-à-dire
   * `live_speakers` : jamais une déduction, jamais un rôle de remplissage.
   * Une personne absente du roster n'a simplement pas d'étiquette — mieux
   * vaut ne rien dire que dire faux.
   */
  const roleParRemote = useMemo(
    () => new Map(realParticipants.map((p) => [p.id, ROLE_LABELS[p.role]] as const)),
    [realParticipants],
  );

  /**
   * La carte d'un expert sur la scène. Extraite du JSX pour pouvoir être
   * placée DEVANT ou APRÈS les cartes humaines selon `agentsEnTete` — c'est
   * ce qui donne son sens réel à « mettre à la une » (EX-5/EX-6) : la carte
   * passe vraiment en tête, elle ne reçoit pas qu'un libellé.
   */
  const renduTuileExpert = (aiAgent: Agent) => (
      <div key={aiAgent.id} data-testid={`stage-tile-agent-${aiAgent.id}`} className="live-pane live-pane--agent flex items-center justify-center">
        <LiveBubbles count={4} />
        <Avatar3D
          avatarId={aiAgent.id}
          state={aiCopilotState === 'thinking' ? 'thinking' : aiCopilotState === 'speaking' ? 'speaking' : 'idle'}
          grammarState={avatarGrammarState}
          className="w-full h-full"
        />

        {/* Une présence IA, pas une ligne d'annuaire : même pastille
            et même onde de voix qu'un humain — c'est ce qui la met
            sur un pied d'égalité sur la scène. */}
        <div className="absolute top-3 left-3 flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10">
          <Bot size={15} style={{ color: 'var(--live-accent)' }} />
          <LiveVoiceWave muted={aiCopilotState !== 'speaking'} />
        </div>

        <div className="live-nameplate">
          <span className="truncate">{aiAgent.name} — {aiAgent.specialty}</span>
          {/* EX-5 : la mise en avant est lue depuis la session, donc
              ce libellé apparaît chez TOUT LE MONDE, pas seulement
              chez l'animateur qui a appuyé. */}
          {expertEnAvant === aiAgent.id && (
            <span className="live-nameplate-role shrink-0 tracking-[0.18em]" data-testid={`stage-featured-${aiAgent.id}`}>À LA UNE</span>
          )}
          <span className="live-nameplate-role shrink-0 opacity-70 tracking-[0.18em]">IA</span>
        </div>

        {/* MB-1 — Les trois gestes de l'animateur sur un expert, en RAIL
            ÉTIQUETÉ au pied de la carte plutôt qu'en trois ronds de 36 px
            serrés dans le coin, distingués par un `title` qu'un téléphone
            n'affiche jamais (mesuré au banc : 36×36, aucun libellé). Chacun
            fait au moins 44 px et porte son nom. « À la une » est une
            BASCULE : son libellé dit ce que l'appui va faire, pas l'état
            courant — c'est la plaque de nom qui porte l'état (« À LA UNE »).
            Les handlers, eux, sont exactement ceux d'EX-4/EX-5. */}
        {isHost && (
          <div className="absolute inset-x-2 bottom-11 z-10 flex items-center justify-center gap-1.5 flex-wrap">
            <button
              onClick={(e) => { e.stopPropagation(); void handleBasculerMiseEnAvant(aiAgent.id); }}
              data-testid={`stage-feature-agent-${aiAgent.id}`}
              aria-label={expertEnAvant === aiAgent.id ? `Retirer ${aiAgent.name} de la une` : `Mettre ${aiAgent.name} à la une`}
              aria-pressed={expertEnAvant === aiAgent.id}
              className={`live-orb !rounded-xl min-h-[44px] px-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap ${expertEnAvant === aiAgent.id ? 'live-orb--active' : ''}`}
            >
              <Award size={15} />
              <span>{expertEnAvant === aiAgent.id ? 'Retirer de la une' : 'À la une'}</span>
            </button>

            {/* EX-4 : faire RÉPONDRE l'expert à ce qui vient d'être
                demandé dans le direct — hôte uniquement (la base
                refuse de toute façon les autres, 42501). Le geste est
                explicite : on ne déclenche jamais une réponse (ni la
                dépense qui va avec) dans le dos de l'animateur. */}
            <button
              onClick={(e) => { e.stopPropagation(); void faireRepondreExpertAuxQuestions(aiAgent); }}
              disabled={aiCopilotState === 'thinking'}
              data-testid={`stage-ask-agent-${aiAgent.id}`}
              aria-label={`Faire répondre ${aiAgent.name} aux questions du direct`}
              className="live-orb !rounded-xl min-h-[44px] px-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap disabled:opacity-50"
            >
              <MessageSquare size={15} />
              <span>Répondre</span>
            </button>

            {/* Retirer l'agent de la scène — hôte uniquement. */}
            <button
              onClick={(e) => { e.stopPropagation(); void handleRetirerAgentDeLaScene(aiAgent.id); }}
              data-testid={`stage-remove-agent-${aiAgent.id}`}
              aria-label={`Retirer ${aiAgent.name} de la scène`}
              className="live-orb live-orb--danger !rounded-xl min-h-[44px] px-2.5 flex items-center gap-1.5 text-[11px] font-bold whitespace-nowrap"
            >
              <X size={15} />
              <span>Retirer</span>
            </button>
          </div>
        )}

        {/* Thinking Glow Overlay */}
        {aiCopilotState === 'thinking' && (
          <div className="absolute top-14 left-3 z-10 px-3 py-1 rounded-full text-[10px] font-bold animate-pulse text-white flex items-center gap-1.5 bg-black/50 backdrop-blur-md border border-white/10 tracking-[0.16em]">
            <Sparkles size={12} style={{ color: 'var(--live-accent)' }} /> DÉLIBÉRATION
          </div>
        )}
      </div>
  );


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
  // LP-4 — la barre de sous-titres affichait une phrase française FIGÉE avec
  // sa « traduction » anglaise FIGÉE : `setCurrentSubtitle` n'était appelé
  // nulle part dans ce fichier, donc cet état initial ÉTAIT l'affichage,
  // pour toujours et pour tout le monde. C'était la partie la plus visible
  // de la promesse décorative relevée par l'audit LP-0.
  // Elle démarre désormais vide : la barre dit honnêtement qu'elle n'a rien
  // à montrer plutôt que d'inventer une phrase. Depuis LP-7, elle se remplit
  // pour de bon — avec la parole réellement captée dans le direct.
  const [currentSubtitle, setCurrentSubtitle] = useState<LiveSubtitle | null>(null);

  // LP-7 — un sous-titre reçu s'affiche, puis s'efface tout seul : sans cela,
  // la dernière phrase d'un intervenant qui s'est tu resterait à l'écran
  // jusqu'à la fin du direct, comme si elle venait d'être prononcée.
  const subtitleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current); }, []);

  onLiveDataRef.current = (payload, from) => {
    const message = decodeCallData(payload);
    if (!message || message.t !== 'caption') return;
    // Le nom vient du roster de la room, jamais du message : personne ne
    // choisit sous quel nom sa parole s'affiche chez les autres.
    const speaker = liveTransport.remoteParticipants
      .find((p) => p.participant.identity === from)?.participant.name;
    if (!speaker) return;
    const mine = subtitleForListener({
      caption: {
        text: message.text,
        lang: message.lang,
        translated: message.translated,
        targetLang: message.targetLang,
      },
      myChoice: listening.choice,
      speakerName: speaker,
    });
    if (!mine) return; // ce sous-titre est celui d'une autre langue que la mienne
    setCurrentSubtitle(mine);
    if (subtitleTimerRef.current) clearTimeout(subtitleTimerRef.current);
    subtitleTimerRef.current = setTimeout(() => setCurrentSubtitle(null), 8000);
  };
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
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'participants' | 'qa' | 'notes' | 'decisions' | 'agenda' | 'products' | 'campus' | 'docs' | 'assistant' | 'solidarity'>('chat');
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
  /**
   * EX-3 — Pont vers le moteur vocal, qui est déclaré plus bas dans ce
   * composant : l'abonnement temps réel ci-dessous en a besoin, mais sa
   * closure serait figée sur une valeur inexistante. Une ref remplie après
   * coup évite de déplacer tout le moteur vocal pour une seule ligne.
   */
  const direExpertARef = useRef<(texte: string, messageId?: string) => void>(() => {});
  /**
   * Identifiants des prises de parole déjà prononcées chez CE client, pour que
   * l'animateur qui déclenche l'expert ne l'entende pas deux fois (une fois
   * localement, une fois par l'écho temps réel de son propre message).
   */
  const parolesPrononceesRef = useRef<Set<string>>(new Set());
  const [showGifts, setShowGifts] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState<{ icon: string; id: number } | null>(null);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    if (!realSessionId) return;
    let cancelled = false;
    fetchRecentLiveMessages(realSessionId).then((msgs) => { if (!cancelled) setMessages(msgs); });
    fetchLiveReactionCount(realSessionId).then((count) => { if (!cancelled) setLikesCount(count); });

    const unsubMessages = subscribeToLiveMessages(realSessionId, (m) => {
      setMessages((prev) => {
        if (prev.some((x) => x.id === m.id)) return prev;
        // EX-3 : la parole d'un expert est prononcée à voix haute CHEZ CHACUN,
        // pas seulement chez l'animateur qui l'a déclenchée. Un message sans
        // `authorId` ne peut venir que de `post_live_agent_message` (tout
        // message humain porte author_id = auth.uid(), la policy l'impose),
        // c'est donc un discriminant fiable et non devinable.
        if (!m.authorId) direExpertARef.current(m.text, m.id);
        return [...prev, m];
      });
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

  /**
   * LV-3 — L'hôte a coupé mon micro. On coupe RÉELLEMENT la piste, on ne se
   * contente pas de l'afficher : une icône barrée pendant que la voix continue
   * de partir serait un mensonge à l'écran.
   */
  const applyForcedMute = () => {
    isMicMutedRef.current = true;
    setIsMicMuted(true);
    liveTransport.setMicrophoneEnabled(false).catch(() => {});
    addNotification('Micro coupé par l’animateur', "Votre micro a été coupé dans ce direct. Vous pouvez lever la main pour demander la parole.", 'info');
  };

  /**
   * LV-3 — L'hôte m'a retiré du direct : ma ligne `live_speakers` porte un
   * `left_at` que je n'ai pas posé. On quitte pour de bon (transport coupé,
   * écran fermé) — `hasLeftSessionRef` empêche de ré-écrire une sortie déjà
   * actée par l'hôte, et `removedByHostRef` empêche de répéter l'avis à
   * chaque tour de polling.
   */
  const applyRemovalByHost = () => {
    if (removedByHostRef.current) return;
    removedByHostRef.current = true;
    hasLeftSessionRef.current = true; // la sortie est déjà écrite en base par l'hôte
    presentInSessionRef.current = false;
    isUserOnStageRef.current = false;
    setIsUserOnStage(false);
    liveTransport.disconnect();
    addNotification('Vous avez quitté ce direct', "L'animateur vous a retiré du direct.", 'info');
    onClose();
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
        // LV-1 : LA correction de la cause racine — la vraie liste alimente
        // enfin la scène. Elle était lue ici depuis toujours, puis jetée.
        //
        // EX-2 : cette MÊME lecture alimente désormais aussi les experts
        // convoqués, qui ont enfin une ligne `live_speakers` (user_id NULL,
        // agent_id renseigné). Les deux listes restent séparées pour que tout
        // le code « humain » (couper un micro, retirer quelqu'un, mains
        // levées, ma propre ligne) continue de ne voir que des comptes —
        // aucune régression sur LV-1/LV-3.
        const { humans: humains, agents: experts } = splitRosterHumansAndAgents(participants);
        setRealParticipants(humains);
        setAgentParticipants(experts);
        const me = humains.find((p) => p.id === userProfile.id);
        if (me) {
          applyMyRole(me.role, null); // left_at IS NULL garanti par fetchActiveParticipants
          // LV-3 : l'hôte a coupé mon micro → je le coupe réellement, je ne me
          // contente pas d'un affichage. Décision pure et testée.
          const directive = deriveSelfMediaDirective({
            leftAt: null,
            isMutedInDb: me.isMuted,
            isMicOpenLocally: !isMicMutedRef.current,
            isCurrentlyPresent: true,
          });
          if (directive === 'force-mute') applyForcedMute();
        } else if (isUserOnStageRef.current || presentInSessionRef.current) {
          // Ma ligne a disparu des présents alors que j'étais là : l'hôte m'a
          // retiré (left_at posé). Un simple message serait malhonnête — on
          // quitte réellement.
          applyRemovalByHost();
        }
        if (isHost) {
          setRaisedHands(humains.filter(p => p.isHandRaised).map(p => ({ id: p.id, name: p.name })));
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

  /**
   * EX-2 — Le copilote de la session est lui aussi inscrit en base, une fois,
   * par l'animateur.
   *
   * Sans cela la scène n'était partagée que par COÏNCIDENCE : chaque client
   * affichait le copilote parce que son propre `aiAgent` retombait sur le même
   * défaut, pas parce qu'une source commune le disait. Conséquence concrète :
   * l'animateur pouvait le retirer sans que personne d'autre ne le voie
   * disparaître. Une ligne réelle règle les deux.
   *
   * Une seule tentative par session (la ref) : si l'animateur le retire
   * ensuite, il ne réapparaît pas dans son dos.
   */
  // EX-5 : qui est en avant à mon arrivée, puis à chaque changement décidé par
  // l'animateur. L'abonnement ne livre que les CHANGEMENTS — d'où la lecture
  // initiale, sans laquelle une personne rejoignant en cours de direct ne
  // verrait pas la mise en avant déjà décidée.
  useEffect(() => {
    if (!realSessionId) { setExpertEnAvant(null); return; }
    let annule = false;
    const relire = () => fetchFeaturedAgent(realSessionId).then((id) => { if (!annule) setExpertEnAvant(id); });
    relire();
    const stop = subscribeToFeaturedAgent(realSessionId, (id) => { if (!annule) setExpertEnAvant(id); });
    // Même filet de sécurité que le roster juste au-dessus, et pour la même
    // raison mesurée : les UPDATE de `live_sessions` ne sont pas toujours
    // livrés par Realtime. Sans cette relecture, « À LA UNE » ne descendait
    // que chez l'animateur — exactement le défaut que EX-5 corrige.
    const sonde = setInterval(relire, 4000);
    return () => { annule = true; stop(); clearInterval(sonde); };
  }, [realSessionId]);

  const copilotePersisteRef = useRef<string | null>(null);
  useEffect(() => {
    if (!realSessionId || !isHost || !aiAgent) return;
    const cle = `${realSessionId}:${aiAgent.id}`;
    if (copilotePersisteRef.current === cle) return;
    copilotePersisteRef.current = cle;
    summonExpertToLive(realSessionId, {
      id: aiAgent.id,
      name: aiAgent.name,
      avatarUrl: aiAgent.avatarUrl,
      specialty: aiAgent.specialty,
      isHuman: aiAgent.isHuman,
      // Échec silencieux assumé ici, et seulement ici : ce n'est pas un geste
      // de l'utilisateur mais une mise en cohérence d'arrière-plan. La carte
      // reste affichée localement dans tous les cas (stageAgents injecte
      // `aiAgent`), donc rien n'est masqué à l'écran.
    }).catch(() => {});
  }, [realSessionId, isHost, aiAgent]);

  /**
   * LV-3 — Commandes d'animation. Toutes écrivent EN BASE d'abord ; l'écran ne
   * ment jamais sur une action qui a échoué (message explicite, état inchangé),
   * et la personne visée l'apprend en relisant sa propre ligne.
   */
  const handleDemoteToViewer = (participantId: string) => {
    if (!realSessionId) return;
    updateParticipantRole(realSessionId, participantId, 'viewer')
      .then(() => setRealParticipants(prev => prev.map(p => p.id === participantId ? { ...p, role: 'viewer' } : p)))
      .catch((err) => addNotification('Action impossible', `Le rôle n'a pas pu être modifié : ${err?.message || 'erreur inconnue'}`, 'error'));
  };

  const handleToggleParticipantMute = (participantId: string, nextMuted: boolean) => {
    if (!realSessionId) return;
    setParticipantMuted(realSessionId, participantId, nextMuted)
      .then(() => setRealParticipants(prev => prev.map(p => p.id === participantId ? { ...p, isMuted: nextMuted } : p)))
      .catch((err) => addNotification('Action impossible', `Le micro n'a pas pu être modifié : ${err?.message || 'erreur inconnue'}`, 'error'));
  };

  const handleRemoveParticipant = (participantId: string) => {
    if (!realSessionId) return;
    const cible = realParticipants.find(p => p.id === participantId);
    if (!window.confirm(`Retirer ${cible?.name || 'cette personne'} du direct ?`)) return;
    removeParticipant(realSessionId, participantId)
      .then(() => {
        setRealParticipants(prev => prev.filter(p => p.id !== participantId));
        addNotification('Personne retirée', `${cible?.name || 'La personne'} a été retirée du direct.`, 'info');
      })
      .catch((err) => addNotification('Action impossible', `Le retrait a échoué : ${err?.message || 'erreur inconnue'}`, 'error'));
  };

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
  // DS-L0 — « Sur mobile, toutes les commandes essentielles doivent être
  // accessibles (inviter, retirer, gérer humain et agent) » (Direction,
  // 03/09/2026). Convoquer un expert était en `hidden md:flex`, la salle
  // d'attente et le sélecteur d'univers en `hidden lg:flex` : sur téléphone,
  // ces commandes n'existaient tout simplement pas. Cette feuille les rend
  // atteignables sans toucher à la disposition desktop.
  const [showMobileStageSheet, setShowMobileStageSheet] = useState(false);
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
    isMicMutedRef.current = next;
    liveTransport.setMicrophoneEnabled(!next).catch(() => {
      setIsMicMuted(!next);
      isMicMutedRef.current = !next;
    });
    // LV-1 : les autres doivent voir mon vrai état dans le panneau des
    // participants — sans cette écriture, la colonne `is_muted` resterait
    // figée à sa valeur d'arrivée pour tout le monde.
    if (realSessionId) setOwnMediaState(realSessionId, userProfile.id, { isMuted: next }).catch(() => {});
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
    if (realSessionId) setOwnMediaState(realSessionId, userProfile.id, { isVideoOn: !next }).catch(() => {});
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

  /**
   * EX-3 — Faire réellement PARLER un expert, et que tout le monde l'entende.
   *
   * AVANT : `setAiCopilotState('speaking')` puis retour à `'idle'` après un
   * `setTimeout(…, 4000)`. Purement décoratif : aucun appel d'intelligence,
   * aucun son, aucun message diffusé. L'onde de voix s'agitait quatre
   * secondes et c'était tout — d'où « les experts n'ont jamais pu répondre ».
   *
   * MAINTENANT, trois étapes réelles et vérifiables :
   *   1. des propos produits par le modèle, avec la persona de CET expert
   *      (`agentId` → ses propres outils et autorisations, définis en Super
   *      Admin) ;
   *   2. publiés dans `live_messages` sous SON identité, via le canal
   *      `post_live_agent_message` qui vérifie les droits en base ;
   *   3. prononcés à voix haute chez chaque spectateur, à la réception.
   *
   * Consigne anti-invention explicite : un expert qui ne sait pas doit le dire
   * et proposer la démarche, jamais fabriquer un article de loi ou un chiffre.
   */
  const faireParlerExpert = async (agent: Agent, consigne: string): Promise<boolean> => {
    if (!realSessionId) {
      addNotification("L'expert ne peut pas parler", "Ce direct n'est pas encore démarré.", 'error');
      return false;
    }
    setAiCopilotState('thinking');
    setAvatarGrammarState('reflexion');
    try {
      const texte = await generateText(consigne, {
        agentId: agent.id,
        systemInstruction:
          `Tu es ${agent.name}, ${agent.title}, spécialiste de ${agent.specialty}. ` +
          `Tu interviens EN DIRECT dans le live « ${liveData.title} » de MokNet, devant plusieurs personnes qui t'écoutent. ` +
          `Tu réponds à l'oral : 2 à 4 phrases courtes, en français, sans titre, sans liste à puces, sans formule administrative. ` +
          `Tu n'inventes jamais un article de loi, un chiffre, un diagnostic ou une référence que tu ne peux pas garantir : ` +
          `si tu ne sais pas, tu le dis franchement et tu indiques la démarche à suivre.`,
      });
      const propos = (texte || '').trim();
      if (!propos) {
        setAiCopilotState('idle');
        setAvatarGrammarState('incertitude');
        addNotification("L'expert n'a rien pu dire", "Le service d'intelligence n'a pas répondu — réessayez dans un instant.", 'error');
        return false;
      }
      const messageId = await postLiveAgentMessage(realSessionId, agent.id, propos);
      // EX-6 : la parole s'affiche AUSSI sur l'écran de qui l'a déclenchée,
      // sans attendre l'écho temps réel — même convention que l'envoi d'un
      // message ordinaire (dédoublonnage par identifiant). L'écriture est déjà
      // confirmée par le serveur, qui vient de renvoyer cet identifiant : on
      // n'affiche donc rien qui n'existe pas. Sans cela, l'animateur voyait un
      // chat vide juste après avoir fait parler l'expert — et `faire répondre`
      // se croyait sans matière.
      const nomAffiche = agent.isHuman ? agent.name : `${agent.name} (IA)`;
      setMessages((prev) => (prev.some((m) => m.id === messageId) ? prev : [...prev, {
        id: messageId,
        sessionId: realSessionId,
        authorName: nomAffiche,
        authorAvatar: agent.avatarUrl,
        text: propos,
        createdAt: new Date().toISOString(),
      }]));
      // Prononcé ici pour l'animateur, et marqué comme déjà dit pour que l'écho
      // temps réel de ce même message ne le répète pas. Les autres personnes,
      // elles, l'entendent par ce même écho.
      direExpertARef.current(propos, messageId);
      return true;
    } catch (err) {
      setAiCopilotState('idle');
      setAvatarGrammarState('erreur');
      const message = (err as Error)?.message || 'erreur inconnue';
      const refus = /permission|policy|42501|row-level/i.test(message);
      addNotification(
        "L'expert n'a pas pu prendre la parole",
        refus
          ? "Seul l'animateur (ou un modérateur) du direct peut faire parler un expert."
          : `Sa réponse n'a pas pu être diffusée : ${message}`,
        'error',
      );
      return false;
    }
  };

  /**
   * EX-5 — Mettre l'expert EN AVANT, puis l'en retirer. Un seul geste, qui
   * bascule : appuyer sur l'expert déjà en avant le fait redescendre au rang
   * des autres (il reste sur scène — le faire quitter la scène, c'est le
   * bouton de retrait, EX-2).
   */
  const handleBasculerMiseEnAvant = async (agentId: string) => {
    if (!realSessionId) return;
    const cible = expertEnAvant === agentId ? null : agentId;
    try {
      await setFeaturedAgent(realSessionId, cible);
      setExpertEnAvant(cible); // l'écho temps réel confirmera chez les autres
    } catch (err) {
      const message = (err as Error)?.message || 'erreur inconnue';
      addNotification(
        "La mise en avant n'a pas pu être appliquée",
        /permission|policy|42501|row-level/i.test(message)
          ? "Seul l'animateur du direct peut mettre un expert en avant."
          : message,
        'error',
      );
    }
  };

  /**
   * EX-4 — L'expert RÉPOND à ce qui a été demandé dans le direct.
   *
   * Il lit le vrai chat (`live_messages`, réel depuis le LOOP 05/14), pas un
   * sujet inventé : la réponse porte donc sur ce que les personnes présentes
   * ont réellement écrit. Sans message, il le dit au lieu de meubler.
   */
  const faireRepondreExpertAuxQuestions = async (agent: Agent) => {
    // EX-6 : on relit le chat EN BASE avant de répondre, au lieu de se fier au
    // seul miroir local. Ce miroir dépend de l'écho temps réel : s'il manque un
    // message, l'expert répondrait à côté — ou se croirait sans matière alors
    // que des gens ont écrit. La base est la seule source honnête ; le miroir
    // local sert de repli si la relecture échoue (réseau).
    const relus = realSessionId ? await fetchRecentLiveMessages(realSessionId).catch(() => null) : null;
    if (relus && relus.length) {
      setMessages((prev) => {
        const connus = new Set(prev.map((m) => m.id));
        const nouveaux = relus.filter((m) => !connus.has(m.id));
        return nouveaux.length ? [...prev, ...nouveaux] : prev;
      });
    }
    // Les messages d'expert n'ont pas d'`authorId` : on ne lui redonne jamais
    // sa propre parole à commenter (pas de boucle sur lui-même).
    const propos = (relus && relus.length ? relus : messages).filter((m) => m.authorId).slice(-12);
    if (propos.length === 0) {
      addNotification('Rien à répondre pour le moment', "Personne n'a encore écrit dans ce direct.", 'info');
      return;
    }
    const transcript = propos.map((m) => `${m.authorName} : ${m.text}`).join('\n');
    await faireParlerExpert(
      agent,
      `Voici les derniers messages écrits par les personnes présentes dans ce direct :\n\n${transcript}\n\n` +
        `Réponds à voix haute à ce qui relève de ta spécialité, en t'adressant directement à la personne concernée et en la nommant. ` +
        `Si rien ne relève de ta spécialité, dis-le en une phrase et indique ce sur quoi tu peux aider.`,
    );
  };

  /**
   * EX-2 — Faire REDESCENDRE un expert de la scène, pour tout le monde.
   *
   * AVANT : le bouton ne faisait qu'ajouter l'identifiant à `agentsRetires`,
   * une liste d'exclusion purement locale — l'expert restait affiché chez tous
   * les autres. Maintenant on pose `left_at` en base d'abord ; la liste locale
   * reste nécessaire pour le copilote par défaut, que `stageAgents` réinjecte
   * depuis `aiAgent` à chaque rendu.
   */
  const handleRetirerAgentDeLaScene = async (agentId: string) => {
    const retirerLocalement = () =>
      setAgentsRetires(prev => (prev.includes(agentId) ? prev : [...prev, agentId]));

    if (!realSessionId) { retirerLocalement(); return; }

    try {
      await dismissExpertFromLive(realSessionId, agentId);
      setAgentParticipants(prev => prev.filter(p => p.agentId !== agentId));
      retirerLocalement();
    } catch (err) {
      addNotification(
        "L'expert n'a pas pu être retiré",
        `La scène est inchangée : ${(err as Error)?.message || 'erreur inconnue'}`,
        'error',
      );
    }
  };

  /**
   * EX-2 — Faire monter un expert sur la scène, RÉELLEMENT et pour tout le
   * monde.
   *
   * AVANT : cette fonction ne faisait que des `setState`. L'expert
   * n'apparaissait que dans l'onglet de la personne qui avait appuyé ; aucun
   * spectateur ne le voyait, ce que le banc LV-6 avait mesuré (l'animatrice
   * voyait 3 cartes, la personne arrivée par le lien 2). C'est la raison pour
   * laquelle « appuyer ne donnait rien » depuis le début.
   *
   * MAINTENANT : on écrit d'abord une vraie ligne `live_speakers`, et l'écran
   * ne bouge qu'ensuite. Un refus (spectateur qui n'a pas le droit) est dit
   * franchement au lieu d'être maquillé en succès.
   */
  const handleSummonExpert = async (agent: Agent) => {
    setShowSummonExpertModal(false);

    const carteLocale: LiveStageParticipant = {
      id: `spk-ai-${agent.id}`,
      name: agent.isHuman ? agent.name : `${agent.name} (IA)`,
      avatar: agent.avatarUrl,
      role: agent.isHuman ? 'expert_human' : 'expert_ai',
      isMuted: false,
      isVideoOn: true,
      isAi: !agent.isHuman,
      specialty: agent.specialty,
      agentId: agent.id,
    };

    const monterSurScene = () => {
      // DS-L1 : réinviter un agent précédemment retiré lui rend sa carte.
      setAgentsRetires(prev => prev.filter(id => id !== agent.id));
      setAgentParticipants(prev =>
        prev.some(p => p.agentId === agent.id) ? prev : [...prev, carteLocale],
      );
      setAiAgent(agent);
      addNotification('Expert sur Scène ⚖️', `${agent.name} a rejoint le Live pour vous conseiller.`, 'success');
      // L'ancien `setAiCopilotState('speaking')` suivi d'un retour à 'idle'
      // après 4 s était purement décoratif : l'onde de voix s'agitait sans
      // qu'aucun son ne soit produit. L'état suit désormais une vraie prise de
      // parole (EX-3) ou reste au repos.
    };

    // Pas de session persistée (aperçu, direct non démarré) : le comportement
    // local d'origine reste le meilleur possible — on ne prétend rien de plus.
    if (!realSessionId) {
      monterSurScene();
      pushLocalSystemMessage('Diallo OS', `⚡ L'expert ${agent.name} (${agent.specialty}) a rejoint la scène.`);
      return;
    }

    try {
      await summonExpertToLive(realSessionId, {
        id: agent.id,
        name: agent.name,
        avatarUrl: agent.avatarUrl,
        specialty: agent.specialty,
        isHuman: agent.isHuman,
      });
      monterSurScene();
      // L'arrivée est annoncée à TOUT LE MONDE, plus seulement dans l'onglet de
      // l'animateur : `live_messages` exige `author_id = auth.uid()`, donc le
      // message part sous le nom de la personne qui invite — ce qui est
      // exactement ce qui s'est passé. La parole propre de l'expert (avec sa
      // propre identité) demande un canal dédié : c'est EX-3, pas un bricolage
      // d'attribution ici.
      sendLiveMessage(
        realSessionId,
        { id: userProfile.id, name: userProfile.name, avatar: userProfile.avatarUrl },
        `⚡ J'invite ${agent.name} (${agent.specialty}) sur la scène.`,
      )
        // Même convention que l'envoi d'un message ordinaire : l'annonce
        // apparaît aussi sur l'écran de qui l'a faite, sans dépendre de l'écho
        // temps réel (dédoublonnage par identifiant).
        .then((envoye) => setMessages(prev => (prev.some(m => m.id === envoye.id) ? prev : [...prev, envoye])))
        .catch(() => {});
      // EX-3 : l'expert se présente RÉELLEMENT — propos produits par le
      // modèle avec sa persona, diffusés à tout le monde, prononcés à voix
      // haute. C'est la différence entre « il est apparu » et « il est là ».
      void faireParlerExpert(
        agent,
        `Tu viens d'être invité(e) sur la scène de ce direct. Présente-toi en une phrase et invite les personnes présentes à te poser leurs questions sur ${agent.specialty}.`,
      );
    } catch (err) {
      const message = (err as Error)?.message || 'erreur inconnue';
      const refus = /permission|policy|42501|row-level/i.test(message);
      addNotification(
        "L'expert n'est pas monté sur scène",
        refus
          ? "Seul l'animateur (ou un modérateur) du direct peut faire monter un expert."
          : `L'invitation n'a pas pu être enregistrée : ${message}`,
        'error',
      );
    }
  };

  // "Réunir le Conseil" (Council Room inside Live)
  const handleAssembleLiveCouncil = () => {
    setMainStageMode('council');
    const councilAgents = AGENTS.slice(0, 4);
    
    // LV-1 : le conseil ne remplace QUE les agents. Les humains présents
    // viennent de la base et ne doivent jamais disparaître de la scène parce
    // qu'on a convoqué une table ronde (l'ancien code repartait de
    // `stageParticipants[0]`, c'est-à-dire de l'hôte FICTIF).
    const newParticipants: LiveStageParticipant[] = [
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
    setAgentParticipants(newParticipants);

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
    addNotification("Commande Initiée 🛍️", `Fiche de commande pour "${prod.name}" transmise à ${prod.sellerName}.`, "success");
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

  // ---------------------------------------------------------------------
  // LV-4 — INVITER. Trois chemins distincts (ami / agent IA / lien), parce
  // qu'ils n'ont pas les mêmes conséquences. Voir components/live/LiveInviteModal.
  // ---------------------------------------------------------------------
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteFriends, setInviteFriends] = useState<{ id: string; name: string; avatar?: string; title?: string }[]>([]);
  const [inviteFriendsLoading, setInviteFriendsLoading] = useState(false);
  const [inviteStates, setInviteStates] = useState<Record<string, 'idle' | 'sending' | 'sent' | 'error'>>({});
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [shareCopied, setShareCopied] = useState(false);
  const liveShareUrl = realSessionId
    ? `${window.location.origin}${window.location.pathname}?live=${realSessionId}`
    : '';

  // Chargement des VRAIS amis (relation acceptée uniquement) à l'ouverture.
  useEffect(() => {
    if (!showInviteModal || inviteFriends.length > 0) return;
    let annule = false;
    setInviteFriendsLoading(true);
    supabaseService.getFriendshipsForUser(userProfile.id)
      .then((relations) => {
        if (annule) return;
        const amis = (relations || [])
          .filter((r: any) => r.status === 'accepted')
          .map((r: any) => (r.requester_id === userProfile.id ? r.addressee : r.requester))
          .filter((p: any) => p && p.id)
          .map((p: any) => ({ id: p.id, name: p.name || 'Membre', avatar: p.avatar_url || undefined, title: p.title || undefined }));
        setInviteFriends(amis);
      })
      .catch(() => { if (!annule) setInviteFriends([]); })
      .finally(() => { if (!annule) setInviteFriendsLoading(false); });
    return () => { annule = true; };
  }, [showInviteModal, userProfile.id, inviteFriends.length]);

  const handleInviteFriend = (friendId: string) => {
    if (!realSessionId) return;
    setInviteStates(prev => ({ ...prev, [friendId]: 'sending' }));
    inviteToLiveSession(realSessionId, friendId)
      .then(() => setInviteStates(prev => ({ ...prev, [friendId]: 'sent' })))
      .catch((err) => {
        // Jamais un « Invité » affiché sur un échec : l'état revient à
        // « erreur » et porte la vraie raison renvoyée par la base.
        setInviteStates(prev => ({ ...prev, [friendId]: 'error' }));
        setInviteErrors(prev => ({ ...prev, [friendId]: err?.message || 'Invitation impossible' }));
      });
  };

  const handleCopyShareFromInvite = () => {
    if (!liveShareUrl) return;
    navigator.clipboard.writeText(liveShareUrl)
      .then(() => {
        setShareCopied(true);
        window.setTimeout(() => setShareCopied(false), 2200);
      })
      .catch(() => addNotification('Copie impossible', "Impossible de copier le lien automatiquement — sélectionnez-le à la main.", 'alert'));
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

  /**
   * EX-3 — Le pont annoncé plus haut : dès que le moteur vocal existe, la
   * parole d'un expert reçue par le canal temps réel est réellement
   * prononcée, chez CHAQUE spectateur.
   *
   * `aiCopilotState` cesse ici d'être décoratif : avant, il passait à
   * 'speaking' puis revenait à 'idle' après un `setTimeout(…, 4000)`
   * arbitraire, sans qu'aucun son n'ait jamais été produit. Il suit désormais
   * la synthèse vocale réelle — et si le navigateur refuse de parler (son non
   * débloqué, moteur indisponible), l'état retombe au repos plutôt que de
   * laisser croire à une prise de parole.
   */
  useEffect(() => {
    direExpertARef.current = (texte: string, messageId?: string) => {
      const propre = texte.replace(/^⚡\s*/, '').trim();
      if (!propre) return;
      if (messageId) {
        if (parolesPrononceesRef.current.has(messageId)) return;
        parolesPrononceesRef.current.add(messageId);
      }
      setAiCopilotState('speaking');
      setAvatarGrammarState('reponse');
      const finir = () => {
        setAiCopilotState('idle');
        setAvatarGrammarState('repos');
      };
      voiceAssistant.speak(propre, { onEnd: finir }).catch(finir);
    };
  }, [voiceAssistant]);

  // DS-L1 : l'abysse de l'image de référence (03/09/2026) remplace l'aplat
  // slate-950 ; le vignettage est une couche du fond lui-même (index.html).
  return (
    <div
      ref={liveRootRef}
      data-live-universe={visualUniverse}
      onPointerDown={(e) => spawnWaterRipple(e, liveRootRef.current)}
      className="fixed inset-0 live-abyss z-[200] flex flex-col overflow-hidden font-sans text-white select-none"
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
        {/* MB-1 : `flex-1` donne à ce groupe un vrai plancher de largeur.
            Sans lui, la rangée d'outils de droite prenait 354 px sur 390 et
            écrasait celui-ci à 3 px (mesuré) : la pastille d'état et le titre
            débordaient alors par-dessus les outils — le « chevauchement » vu
            à l'écran n'était pas un défaut de position, c'était un groupe
            réduit à rien. */}
        {/* MB-1 (mesuré à l'écran) : `flex-1` seul ne suffisait pas — le
            groupe gardait sa largeur INTRINSÈQUE comme plancher, donc le
            compteur « 3 en direct » se peignait par-dessus le premier outil.
            `min-w-0` autorise enfin ce groupe à se réduire, et ses enfants
            tronquent proprement au lieu de déborder. */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 overflow-hidden">
          {/* DS-L1 : à l'antenne, l'image de référence dit « ● EN DIRECT » en
              petites capitales espacées — pas une pastille rouge. Les états
              ANORMAUX (aperçu, interruption, reconnexion) gardent au contraire
              leur pastille de couleur : une anomalie doit rester bruyante. */}
          {stageBadge.isOnAir ? (
            <span className="live-onair shrink-0" data-testid="live-onair">En direct</span>
          ) : (
            <div className={`px-3 py-1 rounded-xl font-black text-xs flex items-center gap-2 ${stageBadge.className}`}>
              <span className="w-2 h-2 bg-white rounded-full"></span> {stageBadge.label}
            </div>
          )}

          <div className="min-w-0">
            {/* MB-1 : sur un téléphone, le titre du direct disparaît de la
                barre. Cinq commandes de 44 px, la pastille d'état et le
                compteur ne tiennent pas ensemble dans 390 px (mesuré : le
                groupe de gauche réduit à 107 px pour 216 px de contenu, d'où
                le compteur imprimé PAR-DESSUS le premier outil). Le titre est
                l'élément dont on a le moins besoin quand on est déjà DANS le
                direct — il revient dès 640 px. */}
            <div className="hidden sm:flex items-center gap-2">
              <h1 className="live-title text-[13px] sm:text-base truncate max-w-xs sm:max-w-md">
                {liveData.title}
              </h1>
              <span className="px-2 py-0.5 bg-white/10 text-[10px] font-bold text-indigo-300 rounded-md hidden sm:inline capitalize">
                {liveData.type || 'Public'}
              </span>
            </div>
            {/* Lisibilité (DA-3) : slate-300 et 11px — slate-400 en 10px passait
                sous le seuil de confort sur les verres les plus clairs (rose_doux). */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-300 min-w-0">
              {/* Équipe 10 (L4) : compteur honnête — participants réellement
                  connectés au transport, sinon compteur de la ligne réelle,
                  sinon RIEN (jamais le 1420 de démonstration).
                  MB-1 : `shrink-0` + `whitespace-nowrap` — sans eux, « 3 en
                  direct » se coupait en deux lignes et sortait de sa boîte. */}
              {viewerCount !== null && (
                <span className="flex items-center gap-1 shrink-0 whitespace-nowrap">
                  <Users size={11} /> {viewerCount.toLocaleString()}
                  <span className="hidden sm:inline">en direct</span>
                </span>
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
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'camera' ? 'live-orb--active !rounded-xl shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Video size={13} /> Vidéo
          </button>
          <button
            onClick={handleToggleScreenShare}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'screen' ? 'live-orb--active !rounded-xl shadow-md' : 'text-slate-400 hover:text-white'}`}
          >
            <Layout size={13} /> Écran
          </button>
          <button
            onClick={() => setMainStageMode('whiteboard')}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 whitespace-nowrap ${mainStageMode === 'whiteboard' ? 'live-orb--active !rounded-xl shadow-md' : 'text-slate-400 hover:text-white'}`}
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
            (Avancé, sur scène uniquement), et Quitter (Essentiel, toujours visible)
            MB-1 : sur un téléphone, ces outils ne tiennent pas à côté du titre.
            Ils DÉFILENT plutôt que d'écraser le reste — aucune commande n'est
            retirée, aucune n'est réduite sous 44 px, et l'affordance de
            défilement est celle que le pouce attend.
            MB-1 (correctif mesuré) : « Quitter » est SORTI de la zone
            défilante. Enfant direct d'un conteneur `overflow-x-auto`, il était
            le seul sans largeur plancher : le banc l'a mesuré écrasé à 20 px
            de large. Il est désormais hors du défilement et `shrink-0` — la
            commande la plus essentielle du direct ne peut plus ni rétrécir ni
            partir hors de l'écran. */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 max-w-[70%] sm:max-w-none">
          {/* LIVE PLANÉTAIRE (LP-4) — « J'écoute en… ».
              Placé HORS de la rangée défilante et HORS de
              `contextualChromeClass`, pour trois raisons de fond :
              1. il doit rester atteignable PENDANT le direct (§15), donc il
                 ne s'efface pas au repos comme le chrome contextuel ;
              2. il concerne TOUS les rôles — un spectateur sans micro ni
                 caméra y a droit exactement comme l'animateur, la traduction
                 ne dépend d'aucun droit de publication (§5) ;
              3. `shrink-0` : la leçon de MB-1 (« Quitter » mesuré écrasé à
                 20 px comme seul enfant d'un conteneur défilant) vaut ici —
                 la commande qui décide de ce que j'entends ne peut pas
                 rétrécir ni sortir de l'écran.
              Ce n'est PAS un réglage de la diffusion : mon choix ne change
              rien pour les autres. */}
          <ListeningLanguagePicker
            choice={listening.choice}
            onChoose={listening.choose}
            waitingForMyLanguage={listening.waitingForMyLanguage}
            producerError={listening.producerError}
            choiceBroadcastError={listening.choiceBroadcastError}
            className="shrink-0"
          />
          <div className={`flex items-center gap-1.5 sm:gap-2 min-w-0 overflow-x-auto no-scrollbar ${contextualChromeClass}`}>
            {/* Audio Only Mode (Low Data) — personnel, utile à tout spectateur */}
            <button
              onClick={handleToggleAudioOnly}
              className={`hidden sm:flex px-2.5 py-1.5 min-h-[44px] min-w-[44px] justify-center rounded-xl text-xs font-bold transition-all items-center gap-1 border ${isAudioOnlyMode ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white'}`}
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
              className="hidden sm:flex px-2.5 py-1.5 min-h-[44px] min-w-[44px] justify-center bg-white/5 hover:bg-indigo-600/30 text-slate-300 hover:text-indigo-200 border border-white/10 hover:border-indigo-500/40 text-xs font-bold rounded-xl items-center gap-1 transition-all"
              title="Copier le lien direct de ce Live"
            >
              <Share2 size={14} />
              <span className="hidden sm:inline">Copier le lien</span>
            </button>

            {/* SOS Help Button — neutre au repos, ne s'allume qu'au survol/usage
                (une couleur d'alerte affichée en permanence perd son sens d'alerte) */}
            <button
              onClick={() => setShowInstantHelpModal(true)}
              className="hidden sm:flex px-2.5 py-1.5 min-h-[44px] min-w-[44px] justify-center bg-white/5 hover:bg-rose-600/30 text-slate-300 hover:text-rose-200 border border-white/10 hover:border-rose-500/40 text-xs font-bold rounded-xl items-center gap-1 transition-all"
              title="Besoin d'aide immédiate ou modération"
            >
              <LifeBuoy size={14} />
              <span className="hidden sm:inline">SOS Aide</span>
            </button>

            {/* DS-L0 — accès mobile aux commandes de scène. `lg:hidden` : sur
                ordinateur les mêmes commandes restent à leur place, rien n'est
                dupliqué à l'écran. */}
            <button
              onClick={() => setShowMobileStageSheet(true)}
              data-testid="mobile-stage-commands"
              className="lg:hidden px-2.5 py-1.5 min-h-[44px] min-w-[44px] justify-center bg-white/5 hover:bg-cyan-600/30 text-slate-200 border border-white/10 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
              title="Gérer la scène : inviter, retirer, agents, univers"
              aria-label="Gérer la scène"
            >
              <Sliders size={14} />
              <span className="hidden sm:inline">Scène</span>
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
                className="px-3 py-1.5 min-h-[44px] live-orb live-orb--active !rounded-xl font-bold text-xs tracking-[0.08em] uppercase flex items-center gap-1.5 whitespace-nowrap"
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
            className="shrink-0 w-11 h-11 flex items-center justify-center bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-xl border border-red-500/30 transition-colors"
            title="Quitter ou terminer le Live"
            aria-label="Quitter ou terminer le Live"
          >
            <PhoneOff size={18} />
          </button>
        </div>

      </div>

      {/* PROACTIVE EXPERT RECOMMENDATION BANNER */}
      {proactiveExpertSuggestion && (
        <div className={`${glassSurfaceClass('surface')} border-x-0 border-t-0 px-4 py-2 flex items-center justify-between z-20 animate-fade-down`}>
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-1.5 rounded-lg flex-shrink-0 bg-white/5" style={{ color: 'var(--live-accent)' }}>
              <Sparkles size={14} />
            </div>
            <p className="text-xs font-medium truncate" style={{ color: 'var(--live-ink)' }}>
              {proactiveExpertSuggestion.message}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => {
                handleSummonExpert(proactiveExpertSuggestion.agent);
                setProactiveExpertSuggestion(null);
              }}
              className="px-3 py-1 min-h-[44px] live-orb live-orb--active !rounded-lg font-bold text-xs flex items-center gap-1"
            >
              Inviter {proactiveExpertSuggestion.agent.name}
            </button>
            <button
              onClick={() => setProactiveExpertSuggestion(null)}
              aria-label="Fermer la suggestion"
              className="text-slate-400 hover:text-white p-1 min-h-[44px] min-w-[44px] flex items-center justify-center"
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

        {/* DS-L1 — LA COLONNE D'EAU. Dans l'image de référence, ce n'est pas
            une bordure entre les deux zones : c'est une matière lumineuse qui
            s'écoule et QUI FAIT LA MISE EN PAGE. Positionnée en style inline
            (jamais une valeur arbitraire Tailwind) pour ne dépendre d'aucun
            ordre de feuille de style : le panneau fait 24rem = 384 px, la
            colonne en fait 130 et chevauche la couture (384 − 65 = 319).
            z-index 1 : au-dessus de la scène, JAMAIS au-dessus du texte du
            panneau de conversation. */}
        <span
          aria-hidden="true"
          className="live-current hidden md:block"
          style={{ right: isPanelCollapsed ? -65 : 319 }}
        />
        {!isPanelCollapsed && (
          <span
            aria-hidden="true"
            className="live-current live-current--h md:hidden"
            style={{ bottom: 'calc(50% - 55px)' }}
          />
        )}

        {/* A. LEFT MAIN STAGE (70%) */}
        <div className="flex-1 relative flex flex-col overflow-hidden">
          
          {/* Active Stage View Switcher — tap = geste mobile équivalent au
              survol souris pour révéler/masquer le chrome contextuel
              (pas de survol persistant en tactile). */}
          <div className="flex-1 relative flex items-center justify-center overflow-hidden" onClick={handleStageTap}>

            {/* Équipe F3 : audio de scène PERMANENT (indépendant du mode
                d'affichage) + états honnêtes du transport — plus jamais un
                silence ou une panne inexpliqués. */}
            <RemoteAudioSink participants={liveTransport.remoteParticipants} listeningChoice={listening.choice} />
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
              <div data-testid="live-stage-grid" className={`w-full h-full p-4 sm:p-5 grid ${stageGridClass(cameraTileCount)} gap-4`}>

                {/* EX-5/EX-6 — Un expert MIS À LA UNE occupe réellement la
                    première carte : son bloc passe devant la caméra et les
                    humains. Sans cela, « à la une » n'était qu'une étiquette
                    posée sur une carte restée à sa place. */}
                {agentsEnTete && agentsVisibles.map(renduTuileExpert)}

                {/* Slot 1 : MA caméra — UNIQUEMENT quand je suis sur scène.
                    Équipe F3 : un SPECTATEUR voyait ici sa propre caméra
                    morte étiquetée « {hôte} (Hôte) » avec une barre de niveau
                    pilotée par SON micro — il croyait le direct cassé. Le
                    présentateur réel lui arrive par sa tuile distante. */}
                {isUserOnStage && (
                <div className="live-pane flex items-center justify-center group">
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

                  {/* DS-L1 — la pastille du visage et L'ONDE DE VOIX en tête de
                      carte, exactement comme l'image de référence : on voit qui
                      parle sans avoir à le deviner. L'onde suit le VRAI niveau
                      audio (audioVolume), elle ne mime pas une parole absente. */}
                  <div className="absolute top-3 left-3 flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10">
                    <img
                      src={isHost ? liveData.hostAvatar : userProfile.avatarUrl}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border-2"
                      style={{ borderColor: 'var(--live-accent)' }}
                    />
                    <LiveVoiceWave level={audioVolume} muted={isMicMuted} />
                  </div>

                  {/* Plaque de nom en capitales espacées (registre de l'image).
                      MB-2 : le nom et le rôle sont DEUX spans. Réunis dans un
                      seul `truncate`, le rôle disparaissait le premier sur un
                      téléphone (mesuré : « SARAH KONÉ — H… ») — or c'est
                      justement l'information qui dit qui conduit le direct. */}
                  <div className="live-nameplate">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <span className="truncate">{isHost ? liveData.hostName : userProfile.name}</span>
                      {isMicMuted && <MicOff size={13} className="shrink-0 opacity-80" />}
                    </span>
                    <span className="live-nameplate-role shrink-0 tracking-[0.18em] opacity-80" data-testid="stage-role-self">
                      {isHost ? 'Animateur' : 'Sur scène'}
                    </span>
                  </div>

                  {/* Host Quick Controls — en orbe, dans le coin de la carte.
                      MB-1 : `live-hover-reveal` remplace `opacity-0
                      group-hover:opacity-100`, qui rendait cette commande
                      DÉFINITIVEMENT invisible au doigt (opacité effective 0
                      mesurée au banc sur téléphone). Elle s'efface toujours au
                      repos sur un ordinateur, où le survol existe. */}
                  <div className="live-hover-reveal absolute top-3 right-3 flex items-center gap-1.5">
                    <button
                      onClick={handleTriggerVisionAnalysis}
                      disabled={isVisionAnalyzing}
                      title={isVisionAnalyzing ? 'Analyse en cours' : 'Analyser la scène (Vision IA)'}
                      aria-label="Analyser la scène avec la Vision IA"
                      className="live-orb w-11 h-11 disabled:opacity-50"
                    >
                      <Eye size={17} />
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
                  <div className="live-pane flex flex-col items-center justify-center gap-3">
                    {/* Les bulles n'habillent QUE les tuiles sans vidéo — jamais
                        par-dessus une image réelle (l'image de référence les met
                        dans les cartes de débat, pas sur le visage). */}
                    <LiveBubbles />
                    <img
                      src={liveData.hostAvatar}
                      className="w-20 h-20 rounded-full object-cover opacity-85 border-2 relative z-10"
                      style={{ borderColor: 'var(--live-line)' }}
                      alt={liveData.hostName}
                    />
                    <span className="live-title text-[11px] relative z-10 text-center px-4">
                      {realSessionId ? `En attente du direct de ${liveData.hostName}` : `Aperçu — ${liveData.title}`}
                    </span>
                  </div>
                )}

                {/* Slot 2: copilote IA en pleine cellule UNIQUEMENT quand
                    aucun humain distant ne PUBLIE de média — sinon il cède la
                    place aux vrais participants (vignette compacte plus bas). */}
                {!agentsEnTete && agentsVisibles.map(renduTuileExpert)}

                {/* Participants distants réels (LOOP 04/14) — publication/abonnement LiveKit, pas de simulation.
                    Équipe 10 (L3) : une tuile UNIQUEMENT pour qui publie un
                    média (caméra/écran/micro de scène) — les spectateurs
                    muets, qui se connectent tous à la room, n'en ont pas. */}
                {presentableRemotes
                  .filter(media => humainsVisibles.has(media.participant.identity))
                  .map((media) => (
                    <RemoteParticipantTile
                      key={media.participant.identity}
                      media={media}
                      roleLabel={roleParRemote.get(media.participant.identity)}
                    />
                  ))}

                {/* Débordement : au-delà des six cartes, on le DIT — jamais des
                    présences qui disparaissent en silence. */}
                {stage.overflow > 0 && (
                  <div data-testid="stage-overflow" className="live-pane flex flex-col items-center justify-center text-center p-3">
                    <LiveBubbles count={3} />
                    <span className="text-3xl font-light relative z-10" style={{ color: 'var(--live-accent)' }}>+{stage.overflow}</span>
                    <span className="live-title text-[10px] mt-1.5 relative z-10">
                      {stage.overflow > 1 ? 'autres présences' : 'autre présence'}
                    </span>
                  </div>
                )}

              </div>
            )}

            {/* Copilote IA replié en vignette compacte quand de VRAIS humains
                publient sur la grille — présence discrète, jamais une
                demi-scène (Équipe I / LOOP I2 ; critère Équipe 10 L3 :
                presentableRemotes, pas les simples connectés). `absolute` le
                sort du flux de la grille ; positionné par rapport à la scène
                (conteneur `relative`). */}
            {/* DS-L0 : la vignette compacte du copilote est RETIRÉE. Elle
                existait parce que l'agent perdait sa carte dès qu'un humain
                publiait ; maintenant qu'il garde sa place sur la grille, la
                garder afficherait le même agent deux fois. */}

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
              <div className="w-full h-full p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
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
              <div className="w-full h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto">
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
              <div className="w-full h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto">
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
              <div className="w-full h-full p-4 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-y-auto">
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
                  {currentSubtitle ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-indigo-400">{currentSubtitle.speaker} :</span>
                        <p className="text-xs font-bold text-white truncate">{currentSubtitle.text}</p>
                      </div>
                      {subtitlesMode === 'bilingual' && currentSubtitle.translated && (
                        <p className="text-[11px] text-indigo-300 truncate font-sans">
                          🌍 {currentSubtitle.translated}
                        </p>
                      )}
                    </>
                  ) : (
                    // Honnêteté (§27) : tant que la parole du direct n'est pas
                    // réellement transcrite (LP-7), cette barre n'a rien à
                    // dire — elle le dit, au lieu d'afficher indéfiniment une
                    // phrase inventée avec sa fausse traduction.
                    <p className="text-[11px] text-slate-400 truncate" data-testid="subtitles-empty">
                      Aucun sous-titre pour l'instant.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* LP-4 : le sélecteur à sept libellés qui vivait ici ne
                    faisait qu'afficher une notification — il ne changeait
                    NI les sous-titres, NI l'audio. Il est retiré : la langue
                    d'écoute se choisit à un seul endroit, la pastille
                    « J'écoute en… » du bandeau, et ce choix pilote réellement
                    ce que l'on entend. Deux sélecteurs concurrents pour une
                    même intention, c'est exactement ce que la mission
                    précédente sur la messagerie avait dû défaire. */}

                {/* MB-1 : ce bouton affichait la valeur technique brute
                    (« bilingual », « original », « off ») à un public
                    francophone, dans une cible de 80×23 px. Il dit maintenant
                    ce qu'il fait, en français, dans une cible atteignable. */}
                <button
                  onClick={() => setSubtitlesMode(subtitlesMode === 'bilingual' ? 'original' : subtitlesMode === 'original' ? 'off' : 'bilingual')}
                  aria-label="Changer l'affichage des sous-titres"
                  className="px-2.5 py-1 min-h-[44px] flex items-center bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-bold text-slate-300 uppercase"
                >
                  {subtitlesMode === 'bilingual' ? 'Deux langues' : subtitlesMode === 'original' ? 'Langue d’origine' : 'Masqués'}
                </button>
              </div>
            </div>
          )}

          {/* BOTTOM CONTROLS DOCK — matière verre/eau/lumière (LOOP 07/14),
              respire comme le header (même rythme, même matière vivante). */}
          <div className={`h-16 relative ${glassSurfaceClass('primary')} animate-water-breathe px-6 flex items-center justify-between z-20`}>
            <span className="water-droplets" aria-hidden="true"></span>

            {/* Media Toggles */}
            <div className="flex items-center gap-2 shrink-0">
              {/* DS-L1 — commandes en ORBES, comme dans l'image de référence :
                  rondes, en verre, halo qui s'intensifie au survol. Un état
                  coupé reste rouge (une anomalie doit se voir), un état actif
                  prend l'accent de l'univers courant. 44 px = cible tactile. */}
              <button
                onClick={toggleMic}
                className={`live-orb w-11 h-11 ${isMicMuted ? 'live-orb--danger' : ''}`}
                title={isMicMuted ? "Réactiver le micro" : "Couper le micro"}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={toggleVideo}
                className={`live-orb w-11 h-11 ${isVideoMuted ? 'live-orb--danger' : ''}`}
                title={isVideoMuted ? "Activer la caméra" : "Couper la caméra"}
              >
                {isVideoMuted ? <VideoOff size={18} /> : <Video size={18} />}
              </button>

              <button
                onClick={handleToggleScreenShare}
                className={`live-orb w-11 h-11 ${isScreenSharing ? 'live-orb--active' : ''}`}
                title="Partager mon écran"
              >
                <Layout size={18} />
              </button>

              {/* Commandes vocales (LOOP 09/14) — voix native, essentiel : toujours accessible. */}
              {voiceAssistant.isSupported && (
                <button
                  onClick={() => (voiceAssistant.isListening ? voiceAssistant.stopListening() : voiceAssistant.startListening())}
                  className={`live-orb w-11 h-11 ${voiceAssistant.isListening ? `live-orb--active ${LIVE_MATERIAL_ANIMATION.voice}` : ''}`}
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
                  className={`live-orb w-11 h-11 ${isHandRaisedByMe ? 'bg-amber-500 text-white border-amber-300' : ''}`}
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

            {/* Center Transformation Bridges — Contextuel, s'efface au repos.
                MB-1 (correctif mesuré) : sur un téléphone, la barre demandait
                401 px de commandes pour 342 px utiles — le bouton cœur et son
                compteur sortaient de l'écran (mesuré : bord droit à 426 px
                pour un écran de 390), donc ni lisibles ni atteignables. Ces
                deux passerelles sont des actions d'APRÈS le direct, pas des
                gestes du pouce pendant : elles passent dans la feuille
                « Gérer la scène », où elles gagnent enfin un libellé au lieu
                d'être deux icônes muettes. Rien n'est retiré du téléphone. */}
            <div className={`hidden sm:flex items-center gap-2 shrink-0 ${contextualChromeClass}`}>
              <button
                onClick={handleTransformToParcours}
                className="px-3 sm:px-3.5 py-2 min-h-[44px] min-w-[44px] justify-center live-orb live-orb--active !rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
              >
                <ListTodo size={14} /> <span className="hidden sm:inline">Transformer en Parcours</span>
              </button>

              <button
                onClick={handleBookPrivateSession}
                className="px-3 sm:px-3.5 py-2 min-h-[44px] min-w-[44px] justify-center live-orb !rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
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
            <div className={`flex items-center gap-2 shrink-0 ${contextualChromeClass}`}>
              <button
                onClick={() => setShowGifts(!showGifts)}
                className={`live-orb w-11 h-11 ${showGifts ? 'live-orb--active' : ''}`}
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
                className="p-3 min-h-[44px] bg-gradient-to-tr from-pink-500 to-red-500 rounded-2xl shadow-lg hover:scale-110 active:scale-95 transition-transform flex items-center gap-1"
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
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 live-orb !rounded-r-none !rounded-l-xl border-r-0 min-w-[44px] justify-center px-1.5 py-4 shadow-xl transition-colors"
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
              // LV-1 : « voir qui est en ligne » est ESSENTIEL, pas un réglage
              // avancé — la pastille porte le nombre RÉEL de présents.
              { id: 'participants', label: 'Personnes', icon: Users, badge: stageParticipants.length },
              { id: 'qa', label: 'Q&A', icon: HelpCircle },
              { id: 'agenda', label: 'Agenda', icon: CheckSquare },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => { setActiveSideTab(t.id as any); setShowMoreTabs(false); }}
                  data-testid={`live-side-tab-${t.id}`}
                  className={`relative flex-1 min-w-0 px-2 py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 transition-colors ${activeSideTab === t.id ? 'live-orb--active shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Icon size={13} />
                  <span className="truncate w-full text-center">{t.label}</span>
                  {'badge' in t && (t as { badge: number }).badge > 0 && (
                    <span
                      className="absolute -top-0.5 right-1 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-bold flex items-center justify-center"
                      style={{ background: 'var(--live-accent)', color: '#04202a' }}
                    >
                      {(t as { badge: number }).badge}
                    </span>
                  )}
                </button>
              );
            })}

            {(() => {
              const moreTabs = [
                { id: 'decisions', label: 'Décisions', icon: Award },
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

            {/* LV-1 — QUI EST LÀ. La liste vient de live_speakers, jamais d'un
                état local : ce panneau n'existait pas, et c'est la première
                chose que la Direction a réclamée (« voir qui est en ligne »). */}
            {activeSideTab === 'participants' && (
              <LiveParticipantsPanel
                participants={stageParticipants}
                currentUserId={userProfile.id}
                isHost={!!isHost}
                onPromote={(id) => handlePromoteToSpeaker(id).catch((err) => addNotification('Action impossible', `La montée sur scène a échoué : ${err?.message || 'erreur inconnue'}`, 'error'))}
                onDemote={handleDemoteToViewer}
                onToggleMute={handleToggleParticipantMute}
                onRemove={handleRemoveParticipant}
                onInvite={() => setShowInviteModal(true)}
                onRemoveAgent={(agentId) => setAgentsRetires(prev => prev.includes(agentId) ? prev : [...prev, agentId])}
              />
            )}

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
                    // EX-6 : repère de lecture pour la preuve « l'expert parle
                    // chez TOUT LE MONDE ». Un message d'expert n'a pas de
                    // compte derrière (`author_id` nul) : c'est CE fait, et pas
                    // une classe de style, qui distingue sa parole.
                    data-testid="live-chat-message"
                    data-ai={isAiMsg ? '1' : '0'}
                    data-author={msg.authorName}
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
      {/* DS-L0 — feuille mobile des commandes de scène : inviter un agent,
          gérer les personnes (monter/retirer), choisir l'univers. Elle ne
          duplique aucune logique : elle ouvre exactement les mêmes écrans que
          les boutons desktop. */}
      {showMobileStageSheet && (
        <div className="fixed inset-0 z-[260] lg:hidden flex items-end" role="dialog" aria-label="Commandes de la scène">
          <button
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowMobileStageSheet(false)}
            aria-label="Fermer"
          />
          <div className={`relative w-full rounded-t-3xl p-4 pb-[max(1rem,env(safe-area-inset-bottom))] ${glassSurfaceClass('primary')} border-t border-white/15`}>
            <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-sm font-black text-white mb-3">Gérer la scène</h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                data-testid="mobile-invite-agent"
                onClick={() => { setShowMobileStageSheet(false); setShowSummonExpertModal(true); }}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-indigo-600/25 border border-indigo-400/40 text-left"
              >
                <Bot size={18} className="text-indigo-300" />
                <span className="text-xs font-bold text-white">Inviter un agent</span>
                <span className="text-[10px] text-indigo-200/80">Santé, enseignement, commercial…</span>
              </button>

              <button
                data-testid="mobile-manage-people"
                onClick={() => { setShowMobileStageSheet(false); setShowWaitingRoomModal(true); }}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-cyan-600/25 border border-cyan-400/40 text-left"
              >
                <Sliders size={18} className="text-cyan-300" />
                <span className="text-xs font-bold text-white">Personnes</span>
                <span className="text-[10px] text-cyan-200/80">Monter sur scène, retirer</span>
              </button>

              {/* MB-1 : les deux passerelles de la barre du bas. Sur téléphone
                  elles n'y tenaient pas (le cœur et son compteur sortaient de
                  l'écran) ET elles y étaient muettes — deux icônes sans mot.
                  Ici elles ont enfin leur nom et ce qu'elles font. */}
              <button
                data-testid="mobile-transform-parcours"
                onClick={() => { setShowMobileStageSheet(false); handleTransformToParcours(); }}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-emerald-600/25 border border-emerald-400/40 text-left"
              >
                <ListTodo size={18} className="text-emerald-300" />
                <span className="text-xs font-bold text-white">Transformer en Parcours</span>
                <span className="text-[10px] text-emerald-200/80">Garder ce direct comme étapes</span>
              </button>

              <button
                data-testid="mobile-private-session"
                onClick={() => { setShowMobileStageSheet(false); handleBookPrivateSession(); }}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-amber-600/25 border border-amber-400/40 text-left"
              >
                <Lock size={18} className="text-amber-300" />
                <span className="text-xs font-bold text-white">Continuer en Privé</span>
                <span className="text-[10px] text-amber-200/80">Prendre rendez-vous à deux</span>
              </button>

              {/* MB-1 : les trois outils personnels de la barre du haut. Sur
                  téléphone ils y étaient réduits à des icônes muettes ET
                  écrasaient la pastille d'état (mesuré : groupe de gauche à
                  107 px pour 216 px de contenu). Ici ils disent ce qu'ils
                  font. Ils restent à leur place sur un écran large. */}
              <button
                data-testid="mobile-audio-only"
                onClick={() => { setShowMobileStageSheet(false); handleToggleAudioOnly(); }}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-teal-600/25 border border-teal-400/40 text-left"
              >
                <Headphones size={18} className="text-teal-300" />
                <span className="text-xs font-bold text-white">{isAudioOnlyMode ? 'Revenir à la vidéo' : 'Audio seul'}</span>
                <span className="text-[10px] text-teal-200/80">Économiser la connexion</span>
              </button>

              <button
                data-testid="mobile-copy-link"
                onClick={() => { setShowMobileStageSheet(false); handleCopyLiveLink(); }}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-sky-600/25 border border-sky-400/40 text-left"
              >
                <Share2 size={18} className="text-sky-300" />
                <span className="text-xs font-bold text-white">Copier le lien</span>
                <span className="text-[10px] text-sky-200/80">Partager ce direct</span>
              </button>

              <button
                data-testid="mobile-sos"
                onClick={() => { setShowMobileStageSheet(false); setShowInstantHelpModal(true); }}
                className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-rose-600/25 border border-rose-400/40 text-left"
              >
                <LifeBuoy size={18} className="text-rose-300" />
                <span className="text-xs font-bold text-white">SOS Aide</span>
                <span className="text-[10px] text-rose-200/80">Modération, urgence</span>
              </button>

              {liveData.tribeName && (
                <button
                  data-testid="mobile-join-tribe"
                  onClick={() => { setShowMobileStageSheet(false); handleJoinTribe(); }}
                  className="flex flex-col items-start gap-1 p-3 rounded-2xl bg-purple-600/25 border border-purple-400/40 text-left"
                >
                  <Flame size={18} className="text-purple-300" />
                  <span className="text-xs font-bold text-white">Rejoindre la Tribu</span>
                  <span className="text-[10px] text-purple-200/80">{liveData.tribeName}</span>
                </button>
              )}
            </div>

            {isHost && (
              <div className="mt-4">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Univers de la salle</p>
                <div className="flex items-center gap-3 overflow-x-auto pb-1">
                  {LIVE_VISUAL_UNIVERSES.map((universe) => (
                    <button
                      key={universe.id}
                      onClick={() => handleChangeVisualUniverse(universe.id)}
                      // 44 px : cible tactile réelle, pas la pastille de 20 px du desktop.
                      className={`shrink-0 w-11 h-11 rounded-full transition-all ${glassSurfaceClass('surface')} ${visualUniverse === universe.id ? 'ring-2 ring-white scale-105' : 'opacity-70'}`}
                      data-live-universe={universe.id}
                      style={{ boxShadow: 'inset 0 0 0 3px var(--water-accent)' }}
                      aria-label={universe.label}
                      title={universe.label}
                    />
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowMobileStageSheet(false)}
              className="mt-4 w-full min-h-[44px] py-2.5 rounded-2xl bg-white/10 border border-white/15 text-xs font-bold text-slate-200"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* LV-4 — Inviter : un ami (vraie notification), un agent IA (monte tout
          de suite), ou le lien du direct. */}
      <LiveInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        friends={inviteFriends}
        friendsLoading={inviteFriendsLoading}
        inviteStates={inviteStates}
        inviteErrors={inviteErrors}
        onInviteFriend={handleInviteFriend}
        agents={AGENTS.filter(a => !stageAgents.some(sa => sa.id === a.id))}
        onInviteAgent={(agent) => { handleSummonExpert(agent); setShowInviteModal(false); }}
        shareUrl={liveShareUrl}
        onCopyShareUrl={handleCopyShareFromInvite}
        shareCopied={shareCopied}
        canInviteFriends={!!isHost && !!realSessionId}
      />

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
