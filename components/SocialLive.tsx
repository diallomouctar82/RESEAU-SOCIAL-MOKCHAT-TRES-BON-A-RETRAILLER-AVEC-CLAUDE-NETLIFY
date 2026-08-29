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
  AlertTriangle, Plus, Play, Pause, RotateCcw, VolumeX, Hand
} from 'lucide-react';
import { generateText } from '../services/aiGateway';
import {
  LiveStream, LiveStageParticipant, LiveQuestion, LivePoll, LiveDoc,
  LiveActionItem, LiveReplayData, LiveQualityMode, Agent, LiveType,
  LiveCommerceProduct, LiveAgendaItem, LiveDecision, LivePersonalNote,
  LiveSourceCard, LiveAttendanceRecord, LiveMeetingMinutes, LiveChatMessage,
  LiveVisualUniverse
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
import { useLiveTransport, RemoteParticipantMedia } from '../hooks/useLiveTransport';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { fetchLiveSession, createLiveSession, joinLiveSession, leaveLiveSession, setHandRaised, updateParticipantRole, fetchActiveParticipants, updateVisualUniverse, subscribeToLiveSessionUniverse } from '../services/live/liveSessionService';
import { sendLiveMessage, fetchRecentLiveMessages, subscribeToLiveMessages, sendLiveReaction, fetchLiveReactionCount, subscribeToLiveReactions, subscribeToLiveSpeakerChanges } from '../services/live/liveChatService';
import { glassSurfaceClass, liveMaterialClass, LIVE_VISUAL_UNIVERSES, AvatarGrammarState } from '../services/live/liveMaterialSystem';
import { interpretLiveVoiceCommand, isVoiceCapabilityAllowed, LiveVoiceAction } from '../services/live/liveVoiceCommands';
import { createSolidarityCause } from '../services/live/liveSolidarityService';
import { multimodalVisionService } from '../services/multimodalVision';

interface SocialLiveProps {
  liveId: string;
  onClose: () => void;
  initialData?: LiveStream;
  onNavigateToTab?: (tab: string) => void;
}

/**
 * Tuile vidéo d'un participant distant réel (LOOP 04/14) — piste vidéo +
 * piste audio (élément séparé, on ne veut jamais couper le son d'un autre
 * participant) attachées via callback ref dès qu'elles sont disponibles.
 */
const RemoteParticipantTile: React.FC<{ media: RemoteParticipantMedia }> = ({ media }) => {
  const videoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && media.videoTrack) media.videoTrack.attach(el);
  }, [media.videoTrack]);
  const audioRef = useCallback((el: HTMLAudioElement | null) => {
    if (el && media.audioTrack) media.audioTrack.attach(el);
  }, [media.audioTrack]);

  return (
    <div className="relative rounded-3xl overflow-hidden bg-slate-900 border border-white/10 shadow-2xl flex items-center justify-center">
      {media.videoTrack ? (
        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
      ) : (
        <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center text-xl font-bold text-white">
          {media.participant.name.charAt(0).toUpperCase()}
        </div>
      )}
      <audio ref={audioRef} autoPlay />
      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
        {media.participant.isSpeaking && <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>}
        <span className="text-xs font-bold text-white">{media.participant.name}</span>
      </div>
    </div>
  );
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
  const isHost = liveData.hostName === userProfile.name || userProfile.role === 'admin';
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

  const [stageInvitation, setStageInvitation] = useState<{ inviterName: string } | null>(null);
  const [isUserOnStage, setIsUserOnStage] = useState(isHost);

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
        });
        if (!cancelled) {
          setRealSessionId(created.id);
          setRealHostId(created.hostId);
          setVisualUniverse(created.visualUniverse || 'crystal');
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
  const handleChangeVisualUniverse = (universe: LiveVisualUniverse) => {
    if (!realSessionId || !isHost) return;
    setVisualUniverse(universe);
    updateVisualUniverse(realSessionId, universe).catch((err) => console.error('SocialLive: échec du changement d\'univers visuel', err));
  };

  // Une fois la session réelle confirmée, s'y inscrire comme participant
  // (spectateur ou hôte) — nécessaire pour can_view_live_session()/
  // is_live_host() côté RLS et pour apparaître dans le roster live_speakers.
  useEffect(() => {
    if (!realSessionId) return;
    joinLiveSession(realSessionId, { id: userProfile.id, name: userProfile.name, avatar: userProfile.avatarUrl }, isHost ? 'host' : 'viewer')
      .catch((err) => console.error('SocialLive: échec pour rejoindre la session', err));
    return () => {
      leaveLiveSession(realSessionId, userProfile.id).catch(() => {});
    };
  }, [realSessionId]);

  // Transport vidéo réel (LOOP 04/14) — une room LiveKit par session LIVE
  // réelle, publication activée seulement si l'utilisateur est réellement
  // sur scène (cohérent avec le jeton émis côté serveur). Désactivé tant que
  // la session réelle n'est pas confirmée (voir ci-dessus).
  const liveTransport = useLiveTransport({
    roomName: realSessionId || '',
    participantName: userProfile.name,
    canPublish: isUserOnStage,
    enabled: !!realSessionId,
  });

  // Référence conservée pour la capture de frame réelle (LOOP 11/14, Vision
  // IA) — le ref-callback ci-dessous attache la vraie piste LiveKit, on garde
  // aussi le nœud DOM pour pouvoir en extraire une image à la demande.
  const visionCaptureVideoElRef = useRef<HTMLVideoElement | null>(null);
  const localVideoTrackRef = useCallback((el: HTMLVideoElement | null) => {
    visionCaptureVideoElRef.current = el;
    if (el && liveTransport.localVideoTrack) liveTransport.localVideoTrack.attach(el);
  }, [liveTransport.localVideoTrack]);

  const screenShareTrackRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && liveTransport.localScreenShareTrack) liveTransport.localScreenShareTrack.attach(el);
  }, [liveTransport.localScreenShareTrack]);

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
  const [activeSideTab, setActiveSideTab] = useState<'chat' | 'qa' | 'notes' | 'decisions' | 'agenda' | 'products' | 'campus' | 'docs' | 'assistant'>('chat');
  
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
  const [showFactCheckModal, setShowFactCheckModal] = useState(false);
  const [showInstantHelpModal, setShowInstantHelpModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedAgentForBooking, setSelectedAgentForBooking] = useState<Agent>(AGENTS[0]);
  
  // Chat & Réactions — réels (LOOP 05/14), tables live_messages/live_reactions
  // (LOOP 02/14), diffusés via Supabase Realtime dès que la session réelle
  // (realSessionId) est confirmée.
  const [messages, setMessages] = useState<LiveChatMessage[]>([]);
  const [realHostId, setRealHostId] = useState<string | undefined>(liveData.hostId);
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

  useEffect(() => {
    if (!realSessionId || !isHost) return; // seul l'hôte a besoin de la liste agrégée des mains levées
    let cancelled = false;
    const refresh = () => {
      fetchActiveParticipants(realSessionId).then((participants) => {
        if (cancelled) return;
        setRaisedHands(participants.filter(p => p.isHandRaised).map(p => ({ id: p.id, name: p.name })));
      });
    };
    refresh();
    const unsub = subscribeToLiveSpeakerChanges(realSessionId, (row) => {
      const participantId = row.user_id;
      if (!participantId || row.left_at) return;
      setRaisedHands((prev) => {
        const withoutThis = prev.filter(p => p.id !== participantId);
        return row.is_hand_raised ? [...withoutThis, { id: participantId, name: row.name }] : withoutThis;
      });
    });
    // Filet de sécurité : les mises à jour live_speakers ne sont pas
    // toujours livrées par Realtime dans cet environnement (constaté en
    // testant ce LOOP — contrairement à live_messages/live_reactions,
    // confirmées fonctionnelles) ; ce polling garantit que la fonctionnalité
    // reste réellement utilisable en attendant d'en identifier la cause.
    const pollInterval = setInterval(refresh, 4000);
    return () => { cancelled = true; unsub(); clearInterval(pollInterval); };
  }, [realSessionId, isHost]);

  const handlePromoteToSpeaker = (participantId: string) => {
    if (!realSessionId) return;
    updateParticipantRole(realSessionId, participantId, 'speaker').catch(() => {});
    setHandRaised(realSessionId, participantId, false).catch(() => {});
    setRaisedHands((prev) => prev.filter(p => p.id !== participantId));
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

  // Toggle Mic
  const toggleMic = () => {
    liveTransport.setMicrophoneEnabled(isMicMuted);
    setIsMicMuted(!isMicMuted);
  };

  // Toggle Camera
  const toggleVideo = () => {
    liveTransport.setCameraEnabled(isVideoMuted);
    setIsVideoMuted(!isVideoMuted);
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

  // Audio-Only Mode Toggle (Data Saver)
  const handleToggleAudioOnly = () => {
    setIsAudioOnlyMode(!isAudioOnlyMode);
    if (!isAudioOnlyMode) {
      liveTransport.setCameraEnabled(false);
      setIsVideoMuted(true);
      addNotification("Mode Audio Seul 🎧", "Flux vidéo coupé pour économiser jusqu'à 85% de données mobiles.", "info");
    } else {
      liveTransport.setCameraEnabled(true);
      setIsVideoMuted(false);
      addNotification("Vidéo Réactivée 📹", "Flux visuel HD rétabli.", "info");
    }
  };

  // End Live & Launch "Et Maintenant ?" Post-Continuity Dashboard
  const handleEndLive = () => {
    stopLocalMedia();
    setShowPostContinuityModal(true);
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

  const dispatchVoiceAction = (action: LiveVoiceAction, originalUtterance: string) => {
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
      return;
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
        const wanted = action.payload?.participantName?.toLowerCase();
        const target = wanted
          ? raisedHands.find((p) => p.name.toLowerCase().includes(wanted))
          : (raisedHands.length === 1 ? raisedHands[0] : undefined);
        if (!target) { say("Je ne trouve pas cette main levée.", 'erreur'); break; }
        handlePromoteToSpeaker(target.id);
        say(action.spokenConfirmation || `La parole est donnée à ${target.name}.`);
        break;
      }
      case 'OPEN_TAB': {
        const validTabs = ['chat', 'qa', 'notes', 'decisions', 'agenda', 'products', 'polls', 'docs', 'assistant'];
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
      case 'CHANGE_VISUAL_UNIVERSE':
        if (action.payload?.universe) handleChangeVisualUniverse(action.payload.universe);
        say(action.spokenConfirmation);
        break;
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
          .then(() => {
            pushLocalSystemMessage('Diallo OS', `Mission solidaire lancée : "${payload.title}".`);
            setAvatarGrammarState('succes'); // confirmation finale une fois la ligne réellement persistée, pas seulement au moment de la parler.
          })
          .catch((err) => { console.error('SocialLive: échec création mission solidaire', err); setAvatarGrammarState('erreur'); });
        say(action.spokenConfirmation);
        break;
      }
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
  };

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
    <div data-live-universe={visualUniverse} className="fixed inset-0 bg-slate-950 z-[200] flex flex-col overflow-hidden font-sans text-white select-none">
      
      {/* 1. TOP HEADER BAR — matière verre/eau/lumière (LOOP 07/14), surface de référence */}
      <div className={`h-16 ${glassSurfaceClass('primary')} px-4 flex items-center justify-between z-30`}>
        
        {/* Left: Live Indicator, Title & Badges */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="bg-red-600 px-3 py-1 rounded-xl font-black text-xs flex items-center gap-2 animate-pulse shadow-lg shadow-red-600/40">
            <span className="w-2 h-2 bg-white rounded-full"></span> LIVE
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
            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><Users size={11} /> {liveData.viewers.toLocaleString()} en direct</span>
              <span>•</span>
              <span className="flex items-center gap-1"><Shield size={11} className="text-emerald-400" /> Diallo OS Copilote</span>
              <span>•</span>
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <Wifi size={11} /> {networkQuality.toUpperCase()} ({networkLatency}ms)
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
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 border ${isAudioOnlyMode ? 'bg-emerald-600/30 text-emerald-300 border-emerald-500/50' : 'bg-slate-800 text-slate-400 border-white/10 hover:text-white'}`}
              title="Mode Audio Seul (Économie de bande passante 85%)"
            >
              <Headphones size={14} />
              <span className="hidden xl:inline">{isAudioOnlyMode ? 'Audio Seul' : 'Éco Data'}</span>
            </button>

            {/* SOS Help Button */}
            <button
              onClick={() => setShowInstantHelpModal(true)}
              className="px-2.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/40 text-rose-300 border border-rose-500/40 text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
              title="Besoin d'aide immédiate ou modération"
            >
              <LifeBuoy size={14} />
              <span className="hidden sm:inline">SOS Aide</span>
            </button>

            {/* Fact-Check Sources */}
            <button
              onClick={() => setShowFactCheckModal(true)}
              className="px-2.5 py-1.5 bg-sky-600/20 hover:bg-sky-600/40 text-sky-300 border border-sky-500/40 text-xs font-bold rounded-xl hidden md:flex items-center gap-1 transition-all"
              title="Vérificateur de sources et déclarations"
            >
              <FileCheck size={14} />
              <span className="hidden xl:inline">Fact-Check</span>
            </button>

            {isUserOnStage && (
              <button
                onClick={() => setShowWaitingRoomModal(true)}
                className="px-2.5 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-300 border border-indigo-500/40 text-xs font-bold rounded-xl hidden lg:flex items-center gap-1 transition-all"
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
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold rounded-xl hidden 2xl:flex items-center gap-1.5 transition-all"
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

            {/* MODE 1: CAMERA & MULTI-SPEAKER STAGE */}
            {mainStageMode === 'camera' && (
              <div className="w-full h-full p-3 grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-950">
                
                {/* Slot 1: Presenter / Host Stream */}
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
                    <span className="text-xs font-bold text-white">{liveData.hostName} (Hôte)</span>
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

                {/* Slot 2: Co-Pilot AI Agent or Invited Guest */}
                {aiAgent && (
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

                {/* Participants distants réels (LOOP 04/14) — publication/abonnement LiveKit, pas de simulation. */}
                {liveTransport.remoteParticipants.map((media) => (
                  <RemoteParticipantTile key={media.participant.identity} media={media} />
                ))}

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

          {/* REAL-TIME BILINGUAL SUBTITLES BAR (DIALLO OS) */}
          {subtitlesMode !== 'off' && (
            <div className={`h-16 ${glassSurfaceClass('primary')} px-6 flex items-center justify-between z-20`}>
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

          {/* BOTTOM CONTROLS DOCK — matière verre/eau/lumière (LOOP 07/14) */}
          <div className={`h-16 ${glassSurfaceClass('primary')} px-6 flex items-center justify-between z-20`}>
            
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
                      onClick={() => handlePromoteToSpeaker(p.id)}
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

        {/* B. RIGHT INTERACTIVE SIDEBAR (30%) — matière verre/eau/lumière (LOOP 07/14) */}
        <div className={`w-full md:w-96 ${glassSurfaceClass('surface')} border-l flex flex-col h-1/2 md:h-full z-20`}>

          {/* Sidebar Tabs */}
          <div className="flex border-b border-white/10 bg-black/40 p-1 overflow-x-auto">
            {[
              { id: 'chat', label: 'Chat', icon: MessageSquare },
              { id: 'qa', label: 'Q&A', icon: HelpCircle },
              { id: 'notes', label: 'Mémoire', icon: BookOpen },
              { id: 'decisions', label: 'Décisions', icon: Award },
              { id: 'agenda', label: 'Agenda', icon: CheckSquare },
              { id: 'products', label: 'Boutique', icon: ShoppingBag },
              { id: 'polls', label: 'Sondage', icon: PieChart },
              { id: 'docs', label: 'Docs', icon: FileText },
              { id: 'assistant', label: 'IA Perso', icon: Bot }
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSideTab(t.id as any)}
                  className={`px-2.5 py-1.5 rounded-xl text-[10px] font-bold flex flex-col items-center gap-0.5 transition-colors whitespace-nowrap ${activeSideTab === t.id ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  <Icon size={13} />
                  <span>{t.label}</span>
                </button>
              );
            })}
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
