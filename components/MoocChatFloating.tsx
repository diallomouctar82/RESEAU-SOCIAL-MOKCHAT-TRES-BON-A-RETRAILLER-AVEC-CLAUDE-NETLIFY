import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageCircle, X, Send, Paperclip, Mic, MicOff, Image, Video, Phone, PhoneCall,
  PhoneOff, Search, Users, User, FileText, Smile, Shield, Info, Volume2,
  Sparkles, Pin, ShieldAlert, ArrowLeft, CheckCheck, UserPlus, MoreVertical,
  Maximize2, Minimize2, Eye, Wand2, Languages
} from 'lucide-react';
import { ChatConversation, ChatMessage, MemberProfile, UserProfile, ActiveCallSession } from '../types';
import { MOCK_CHATS, MOCK_MEMBERS, USER_PROFILE } from '../constants';
import { supabaseService } from '../services/supabaseClient';
import { adminConfigService } from '../services/adminConfigService';
import { summarizeConversation, assistRewriteMessage } from '../services/messaging/messagingIntelligence';
import { translationService, MESSAGING_LANGUAGES } from '../services/translation/translationService';
import { detectRecipientLanguage, myEffectiveLanguage, targetLanguageForMessage } from '../services/messaging/messageLanguage';
import { languageCodeFromTag, speechTagFor } from '../services/messaging/speechLanguage';
import { CallCaptioner, InterpreterVoice, transcribeVoiceRecording } from '../services/calls/callInterpreter';
import { ChatMessageItem } from './chat/ChatMessageItem';
import { ChatCallModal } from './chat/ChatCallModal';
import { startRinging, stopRinging, startRingback, stopRingback, stopAll as stopAllRingtones } from '../services/calls/ringtoneService';
import { dedupeCallId, isHandledElsewhere, sessionFromPushPayload } from '../services/calls/callFlow';
import {
  isFreshCallPayload, listenPushCallEvents, notifyCallPush, readPushLaunchParams,
  type CallPushPayload, type PushAction, type PushLaunch,
} from '../services/calls/callPush';
import { ChatReportModal } from './chat/ChatReportModal';
import { ChatMemberInfoModal } from './chat/ChatMemberInfoModal';
import { ConversationHeader } from './chat/ConversationHeader';
import { MessagingOwnerCard } from './chat/MessagingOwnerCard';
import { InitialsAvatar } from './ui/InitialsAvatar';

interface MoocChatFloatingProps {
  currentUser?: UserProfile;
  /**
   * Enregistre la langue de l'utilisateur (`profiles.preferred_language`)
   * depuis le sélecteur « Ma langue » de la messagerie. Même chaîne que le
   * réglage équivalent des Paramètres : App.tsx → Layout.tsx → ici.
   */
  onUpdateProfile?: (updates: Partial<UserProfile>) => Promise<boolean> | void;
  activeConversationId?: string | null;
  onCloseDirect?: () => void;
  onOpenMemberProfile?: (member: MemberProfile) => void;
  /**
   * LOOP 06/17 (messagerie, fondation) : jusqu'ici aucun appelant ne
   * fournissait `activeConversationId` — le pont entre le bouton "Message"
   * du fil social (un vrai membre Supabase) et cette fenêtre flottante
   * n'a jamais existé, donc démarrer une PREMIÈRE conversation avec une
   * vraie personne n'avait aucun chemin fonctionnel dans l'UI. Ce nouveau
   * couple de props (remonté App.tsx → Layout.tsx → ici, même patron déjà
   * utilisé pour isGoalModalOpen/isSearchModalOpen dans Layout.tsx) comble
   * ce trou : quand un membre réel est déposé ici, on tente une vraie
   * création/récupération de conversation Supabase avant tout repli local.
   */
  pendingDirectChatMember?: MemberProfile;
  onConsumePendingDirectChatMember?: () => void;
  /** Équipe F1 (D12) : compteur-signal incrémenté par Layout quand une notification `target_action='chat'` est cliquée — ouvre le widget. */
  openWidgetSignal?: number;
  /**
   * Module exportable (route autonome `/messagerie`, application installée
   * sur le téléphone) : fenêtre ouverte d'emblée, bouton flottant masqué,
   * conteneur plein écran calé sous la barre du module (variable CSS
   * `--moknet-module-topbar`, posée par MessagingModuleStandalone).
   */
  standalone?: boolean;
}

const STORAGE_KEY_CONVERSATIONS = 'lmav_chat_conversations_cache';

// Les membres de l'Annuaire local (MOCK_MEMBERS, id 'u1'/'u2'/...) ne sont
// jamais de vrais comptes Supabase — tenter un appel réel avec un tel id
// échouerait de toute façon (colonne uuid) ; ce garde évite un aller-retour
// réseau inutile et garde le repli local explicite plutôt qu'implicite.
// Équipe 7 (appels, A1) : sorti du corps du composant (fonction pure, aucune
// capture) et exporté pour être testé — il garde désormais AUSSI
// handleStartCall : une conversation de repli locale (`chat-<memberId>`)
// n'existe pas dans `conversation_participants`, donc l'Edge Function
// livekit-token répondrait 403 (uuid invalide, erreur 22P02) et aucun média
// ne passerait jamais.
export const isLikelyRealId = (id?: string): id is string => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

/* ────────────────────────────────────────────────────────────────────────────
 * ÉQUIPE 8 (appel entrant — loops 2+3+6) : logiques PURES du flux de
 * sonnerie, extraites en fonctions testables. Le composant ne fait que les
 * consommer ; services/calls/ringtoneService.ts reste l'unique source
 * sonore (jamais deux générateurs superposés).
 * ──────────────────────────────────────────────────────────────────────── */

/**
 * Phase sonore dérivée de la session d'appel — le SEUL mapping
 * signaux → sonnerie/arrêt de tout le flux :
 *  - `call_invitation` reçu   → session ringing + entrant   → 'ring'
 *    (sonnerie choisie + vibration, via startRinging du service) ;
 *  - invitation ÉMISE          → session ringing + sortant  → 'ringback'
 *    (tonalité de retour côté appelant) ;
 *  - `call_accepted` (ou décrocher local) → status 'connected' → 'silent' ;
 *  - `call_ended`/`call_rejected` reçus, refus/raccrochage local,
 *    expiration 35 s côté appelant → session null → 'silent'.
 * Toute transition vers 'silent' arrête IMMÉDIATEMENT sonnerie ET ringback
 * — un seul point de vérité, donc aucun chemin de sortie oublié.
 */
export const ringingStateForCall = (
  session: { status: ActiveCallSession['status'] } | null,
  isIncoming: boolean
): 'ring' | 'ringback' | 'silent' => {
  if (!session || session.status !== 'ringing') return 'silent';
  return isIncoming ? 'ring' : 'ringback';
};

/**
 * Sonnerie à jouer pour un appel entrant : le choix PROFIL
 * (privacySettings.ringtoneId) prime s'il existe ; sinon `undefined`, et le
 * service retombe sur son cache local (lmav_ringtone_v1) puis la Signature
 * MokNet — jamais un id invalide transmis tel quel.
 */
export const resolveIncomingRingtoneId = (profileRingtoneId?: unknown): string | undefined =>
  typeof profileRingtoneId === 'string' && profileRingtoneId.trim().length > 0
    ? profileRingtoneId
    : undefined;

/**
 * Décision de notification navigateur pour un appel entrant (loop 3 —
 * limites web honnêtes : ceci ne fonctionne que si l'ONGLET VIT ; onglet
 * fermé = pas d'appel, il n'y a aucun push serveur dans cette app web).
 *  - onglet visible → 'none' (le modal plein écran suffit, jamais de bruit) ;
 *  - onglet caché + permission déjà accordée → 'show' ;
 *  - onglet caché + permission jamais demandée → 'request' (la demande n'a
 *    lieu qu'AU premier appel concerné — jamais au chargement de la page) ;
 *  - permission refusée ou API absente → 'none' : on ne simule rien d'autre,
 *    la sonnerie audio du service joue de toute façon tant que l'onglet vit.
 */
export const decideIncomingCallNotification = (
  documentHidden: boolean,
  permission: 'default' | 'granted' | 'denied' | 'unsupported'
): 'show' | 'request' | 'none' => {
  if (!documentHidden) return 'none';
  if (permission === 'granted') return 'show';
  if (permission === 'default') return 'request';
  return 'none';
};

/** Titre + corps de la notification d'appel entrant (nom réel + type). */
export const incomingCallNotificationText = (
  callerName: string,
  callType: 'audio' | 'video'
): { title: string; body: string } => ({
  title: callType === 'video' ? 'Appel vidéo entrant' : 'Appel audio entrant',
  body: `${callerName || 'Un membre'} vous appelle sur MokNet`,
});

/** Ce que la notification système d'un appel entrant transporte (même forme que la charge d'un push, v1). */
interface IncomingCallNotificationData {
  callId: string;
  conversationId?: string;
  callerId?: string;
  callerAvatar?: string;
}

/**
 * Mission VF-1 : affichage d'une notification système. `new Notification()`
 * JETTE sur mobile (Chrome Android, WebView) — la seule voie qui fonctionne
 * partout est `ServiceWorkerRegistration.showNotification()`. On passe donc
 * par le service worker enregistré s'il existe (`getRegistration`, jamais
 * `ready`, qui n'est jamais résolue sans service worker), avec repli sur le
 * constructeur direct uniquement en son absence (bureau sans service
 * worker). Les boutons Décrocher/Refuser et la charge `data` suivent le
 * contrat du service worker (Équipe P) : au clic, il relaie
 * `moknet-push-action` vers la fenêtre, ou l'ouvre avec `?pushAction=…`.
 * Aucun échec ne sort d'ici : l'appel ne dépend jamais de la notification.
 */
const showIncomingCallSystemNotification = async (
  title: string,
  body: string,
  data: (IncomingCallNotificationData & { callerName: string; callType: 'audio' | 'video' }) | undefined,
): Promise<void> => {
  const payload = data ? {
    v: 1,
    type: 'incoming_call',
    ts: Date.now(),
    callId: data.callId,
    conversationId: data.conversationId ?? null,
    from: { id: data.callerId ?? null, name: data.callerName, avatarUrl: data.callerAvatar ?? null },
    callType: data.callType,
    source: 'page',
  } : undefined;
  const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
  if (sw && typeof sw.getRegistration === 'function') {
    try {
      const registration = await sw.getRegistration();
      if (registration && typeof registration.showNotification === 'function') {
        // `tag` : un second signal du même appel REMPLACE la notification au
        // lieu d'en empiler une nouvelle. Les actions n'existent que sur les
        // notifications de service worker — le constructeur direct les ignore.
        await registration.showNotification(title, {
          body,
          tag: 'moknet-incoming-call',
          data: payload,
          ...({ actions: [{ action: 'accept', title: 'Décrocher' }, { action: 'reject', title: 'Refuser' }], vibrate: VIBRATION_HINT } as NotificationOptions),
        });
        return;
      }
    } catch (err) {
      console.warn('[appel] notification via le service worker impossible, repli', err);
    }
  }
  if (typeof Notification === 'undefined') return;
  const notif = new Notification(title, { body, tag: 'moknet-incoming-call', data: payload });
  notif.onclick = () => {
    try { window.focus(); } catch { /* focus refusé — sans gravité */ }
    notif.close();
  };
};
/** Motif de vibration de la notification (aligné sur VIBRATION_PATTERN du service de sonnerie). */
const VIBRATION_HINT = [300, 150, 300];

/**
 * Exécution (impure) de la décision ci-dessus. Best-effort intégral : aucun
 * échec (API absente, permission refusée, requestPermission rejetée sans
 * geste utilisateur, service worker absent) ne remonte jamais au flux
 * d'appel — la sonnerie du service reste le canal principal tant que
 * l'onglet vit ; hors application, c'est le Web Push (VF-1) qui sonne.
 */
const notifyIncomingCallIfHidden = (callerName: string, callType: 'audio' | 'video', call?: IncomingCallNotificationData): void => {
  try {
    const hidden = typeof document !== 'undefined' && document.hidden;
    const supported = typeof Notification !== 'undefined';
    const decision = decideIncomingCallNotification(
      hidden,
      supported ? Notification.permission : 'unsupported'
    );
    if (decision === 'none') return;
    const show = () => {
      const { title, body } = incomingCallNotificationText(callerName, callType);
      showIncomingCallSystemNotification(title, body, call ? { ...call, callerName, callType } : undefined)
        .catch((err) => console.warn('[appel] notification système impossible', err));
    };
    if (decision === 'show') show();
    else void Notification.requestPermission().then((p) => { if (p === 'granted') show(); }).catch(() => {});
  } catch (err) {
    // Jamais bloquant pour l'appel lui-même — mais jamais muet non plus.
    console.warn('[appel] notification d’appel entrant ignorée', err);
  }
};

/** Un appel ENTRANT qui sonne sans fin n'existe pas : 35 s côté appelant + marge pour un `call_ended` perdu. */
const INCOMING_RING_TIMEOUT_MS = 40_000;
/** Lancement par notification : temps accordé au chargement des conversations réelles avant d'agir sans elles. */
const PUSH_LAUNCH_GRACE_MS = 12_000;

export const MoocChatFloating: React.FC<MoocChatFloatingProps> = ({
  currentUser = USER_PROFILE,
  onUpdateProfile,
  activeConversationId = null,
  onCloseDirect,
  onOpenMemberProfile,
  pendingDirectChatMember,
  onConsumePendingDirectChatMember,
  openWidgetSignal = 0,
  standalone = false
}) => {
  // Module autonome : la fenêtre est le module, elle s'ouvre d'emblée.
  const [isOpen, setIsOpen] = useState<boolean>(standalone);
  const [conversations, setConversations] = useState<ChatConversation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CONVERSATIONS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return MOCK_CHATS;
  });

  const [currentChatId, setCurrentChatId] = useState<string | null>(activeConversationId || null);
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'members'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Replying state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Message input state
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: string; url: string }[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  // Intelligence de messagerie (LOOP 07/17) : résumé de conversation +
  // assistance de rédaction. État volontairement local et éphémère (jamais
  // persisté) — un résumé/une correction n'est jamais une vérité durable,
  // juste une aide ponctuelle relue par l'utilisateur avant d'agir.
  const [conversationSummary, setConversationSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  
  // Voice Recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  // Équipe F1 : drapeau d'annulation — le onstop asynchrone du recorder ne
  // doit jamais ressusciter un enregistrement que l'utilisateur a annulé.
  const voiceCancelledRef = useRef(false);
  const recordingTimerRef = useRef<any>(null);
  // HL-2 : transcription RÉELLE du vocal pendant l'enregistrement, chez
  // l'auteur, dans SA langue (reconnaissance dédiée — jamais le moteur de
  // l'Architecte). Elle voyage avec le message ; le lecteur la traduit dans
  // la sienne. Aucune transcription possible (navigateur sans API, micro
  // refusé) → le vocal part quand même, sans texte, jamais bloqué.
  const voiceCaptionerRef = useRef<CallCaptioner | null>(null);
  const voiceTranscriptPartsRef = useRef<string[]>([]);
  const voiceSpeechTagRef = useRef<string>('fr-FR');
  const [liveVoiceTranscript, setLiveVoiceTranscript] = useState('');
  const [recordedTranscript, setRecordedTranscript] = useState<string | null>(null);
  const [recordedTranscriptLanguage, setRecordedTranscriptLanguage] = useState<string | undefined>(undefined);
  // VF-4 : quand la reconnaissance du navigateur est absente ou n'a rien
  // produit (la plupart des téléphones), le vocal est transcrit par le
  // SERVEUR après l'enregistrement — état visible (« Transcription en
  // cours… »), message honnête si impossible, et le vocal part quoi qu'il
  // arrive. Le compteur invalide une réponse arrivée après une annulation,
  // un rejet ou un envoi.
  const [voiceTranscriptionPending, setVoiceTranscriptionPending] = useState(false);
  const [voiceTranscriptionNote, setVoiceTranscriptionNote] = useState<string | null>(null);
  const voiceTranscriptionSeqRef = useRef(0);
  const resetVoiceTranscriptionState = () => {
    voiceTranscriptionSeqRef.current += 1;
    setVoiceTranscriptionPending(false);
    setVoiceTranscriptionNote(null);
  };

  // Audio Playback state
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Calls & WebRTC state
  const [activeCallSession, setActiveCallSession] = useState<ActiveCallSession | null>(null);
  const [isIncomingCall, setIsIncomingCall] = useState(false);

  // Modals state
  const [showMemberInfo, setShowMemberInfo] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetMessage, setReportTargetMessage] = useState<ChatMessage | null>(null);
  const [lightboxImageUrl, setLightboxImageUrl] = useState<string | null>(null);
  // LOOP 06/17 : reutilise le vrai blocage (user_blocks, LOOP 04/17) au lieu
  // d'une liste locale distincte — "pas de second systeme de blocage
  // specifique a la messagerie" (spec moteur de messagerie). Peuple par un
  // vrai fetch, pas localStorage.
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);
  // Profils des participants par conversation — les charges realtime
  // (postgres_changes) ne portent que les colonnes de `messages`, jamais de
  // jointure vers `profiles` ; ce cache, rempli au chargement des
  // conversations, permet d'enrichir un message temps reel avec le nom/
  // avatar de son expediteur sans une requete supplementaire par message.
  const participantProfilesRef = useRef<Record<string, Record<string, { name: string; avatarUrl?: string; role?: string }>>>({});
  // Équipe F1 (D8) : last_read_at le plus récent des AUTRES participants,
  // par conversation — sert à dériver l'état « Lu » de MES messages à
  // l'affichage (created_at <= cette borne), jamais un flag par message.
  const othersLastReadAtRef = useRef<Record<string, string | null>>({});
  // Équipe F1 (D10) : qui est « en train d'écrire » dans la conversation
  // ouverte — éphémère (broadcast), avec TTL client par utilisateur.
  const [typingUsers, setTypingUsers] = useState<Record<string, { name: string; until: number }>>({});
  const typingSelfActiveRef = useRef(false);

  // Online presences mapped by user id
  const [onlinePresences, setOnlinePresences] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const videoInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);

  // Synchronize localStorage cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CONVERSATIONS, JSON.stringify(conversations));
    } catch {}
  }, [conversations]);

  // Open modal if external activeConversationId changed
  useEffect(() => {
    if (activeConversationId) {
      setCurrentChatId(activeConversationId);
      setIsOpen(true);
    }
  }, [activeConversationId]);

  // Équipe F1 (D12) : ouverture demandée par une notification de message
  // cliquée dans la cloche (Layout) — ouvre la liste des conversations.
  useEffect(() => {
    if (openWidgetSignal > 0) setIsOpen(true);
  }, [openWidgetSignal]);

  // Équipe F1 (D13) : un utilisateur Supabase réel ne garde jamais les
  // conversations de démonstration (MOCK_CHATS 'chat1'..'chat4') — elles
  // portaient des compteurs « non lus » fictifs (le badge « 6 » fantôme,
  // relu depuis le cache localStorage à chaque session) et des messages
  // inventés. Les fils réels et les fils locaux créés dans la session
  // (annuaire de démonstration) restent intacts.
  useEffect(() => {
    const isRealUser = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser?.id || '');
    if (!isRealUser) return;
    const mockIds = new Set(MOCK_CHATS.map(c => c.id));
    setConversations(prev => prev.some(c => mockIds.has(c.id)) ? prev.filter(c => !mockIds.has(c.id)) : prev);
  }, [currentUser?.id]);

  // Un résumé IA appartient à SA conversation — jamais laissé affiché en
  // rouvrant une autre discussion (LOOP 07/17).
  useEffect(() => {
    setConversationSummary(null);
  }, [currentChatId]);

  // Load Real Supabase Conversations (LOOP 06/17 — réécrit entièrement,
  // l'ancienne version interrogeait des colonnes `participant_one_id`/
  // `participant_two_id` qui n'ont jamais existé sur `conversations` :
  // chaque appel échouait silencieusement, `MoocChatFloating.tsx` ne
  // montrait donc jamais que `MOCK_CHATS` pour un utilisateur réel).
  useEffect(() => {
    const loadSupabaseData = async () => {
      if (!currentUser?.id) return;
      try {
        const [remoteConvs, blocked] = await Promise.all([
          supabaseService.getConversationsForUser(currentUser.id),
          supabaseService.getBlockedUserIds(currentUser.id),
        ]);
        setBlockedUserIds(blocked);

        if (remoteConvs && remoteConvs.length > 0) {
          const mapped: ChatConversation[] = remoteConvs.map((rc: any) => {
            const participants: any[] = rc.conversation_participants || [];
            const profileCache: Record<string, { name: string; avatarUrl?: string; role?: string }> = {};
            participants.forEach((p) => {
              if (p.profiles) profileCache[p.user_id] = { name: p.profiles.name, avatarUrl: p.profiles.avatar_url, role: p.profiles.role };
            });
            participantProfilesRef.current[rc.id] = profileCache;

            const others = participants.filter((p) => p.user_id !== currentUser.id);
            const other = others[0];
            const otherProfile = other ? profileCache[other.user_id] : undefined;
            othersLastReadAtRef.current[rc.id] = rc.others_last_read_at || null;

            return {
              id: rc.id,
              participantId: other?.user_id || '',
              participantName: rc.is_group ? (rc.title || 'Groupe') : (otherProfile?.name || 'Membre'),
              participantAvatar: otherProfile?.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
              participantRole: otherProfile?.role,
              isGroup: rc.is_group,
              groupMembersCount: rc.is_group ? participants.length : undefined,
              groupMembers: rc.is_group ? participants.map((p) => ({ id: p.user_id, name: profileCache[p.user_id]?.name || 'Membre', avatar: profileCache[p.user_id]?.avatarUrl || '' })) : undefined,
              lastMessage: rc.last_message_preview || '',
              lastMessageTime: rc.last_message_at ? new Date(rc.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
              // Équipe F1 (D13) : compteur RÉEL (HEAD count serveur borné par
              // mon last_read_at) — l'ancien 0 en dur rendait le badge inerte.
              unreadCount: typeof rc.unread_count === 'number' ? rc.unread_count : 0,
              isOnline: false,
              messages: [],
            } as ChatConversation;
          });

          setConversations(prev => {
            // Les conversations réelles font autorité — les entrées locales
            // (MOCK_CHATS ou un fil créé optimistiquement dans cette même
            // session) ne sont conservées que si Supabase ne les connaît
            // pas encore, pour ne jamais perdre des messages déjà affichés.
            const realIds = new Set(mapped.map(c => c.id));
            const keptLocal = prev.filter(c => !realIds.has(c.id) && !mapped.some(m => m.participantId === c.participantId && !m.isGroup && !c.isGroup));
            return [...mapped, ...keptLocal];
          });
        }
      } catch (err) {
        console.warn("Supabase fetch conversations fallback to local cache", err);
      }
    };

    loadSupabaseData();
  }, [currentUser?.id]);

  // Subscribe to Realtime Presence
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsubPresence = supabaseService.subscribeToPresence(
      { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatarUrl },
      (state) => {
        const presencesMap: Record<string, boolean> = {};
        Object.keys(state).forEach(key => {
          presencesMap[key] = true;
        });
        setOnlinePresences(presencesMap);
      }
    );

    // Subscribe to Call Signals
    const unsubCalls = supabaseService.subscribeToCallSignals(currentUser.id, (signal) => {
      if (!signal || typeof signal !== 'object') return;
      if (signal.type === 'call_invitation') {
        // Mission VF-1 : un même appel peut arriver DEUX fois (broadcast +
        // push relayé par le service worker) — un seul écran par callId.
        // Occupé (autre appel en cours) : l'invitation est ignorée, l'appelant
        // verra honnêtement « sans réponse » au bout de 35 s — l'ancienne
        // version remplaçait l'appel en cours par la nouvelle sonnerie.
        const current = activeCallSessionRef.current;
        if (current && current.callId !== signal.callId) return;
        if (!dedupeCallId(seenCallIdsRef.current, signal.callId)) return;
        setActiveCallSession({
          callId: signal.callId,
          conversationId: signal.conversationId ?? '',
          type: signal.callType || 'video',
          initiatorId: signal.callerId ?? '',
          initiatorName: signal.callerName ?? '',
          initiatorAvatar: signal.callerAvatar ?? '',
          receiverId: currentUser.id,
          receiverName: currentUser.name,
          receiverAvatar: currentUser.avatarUrl,
          status: 'ringing',
          durationSeconds: 0,
          ringStartedAt: Date.now(),
          origin: 'broadcast',
        });
        setIsIncomingCall(true);
        // Équipe 8 (loop 3) : onglet en arrière-plan au moment de l'appel →
        // notification système (nom + type réels), via le service worker
        // (VF-1 : le constructeur direct jette sur mobile). La permission
        // n'est demandée qu'ICI, au premier appel concerné — jamais au
        // chargement. Refusée ou API absente : rien d'autre n'est simulé
        // (la sonnerie du service joue si l'onglet vit).
        notifyIncomingCallIfHidden(signal.callerName || 'Un membre', signal.callType === 'audio' ? 'audio' : 'video', {
          callId: signal.callId, conversationId: signal.conversationId, callerId: signal.callerId, callerAvatar: signal.callerAvatar,
        });
      } else if (signal.type === 'call_accepted') {
        // Mission VF-2 : côté appelant, le retour d'appel cesse ICI, avant
        // même le rendu — jamais mêlé à la première voix de l'appelé.
        stopAllRingtones();
        const acceptedAt = Date.now();
        setActiveCallSession(prev => prev && (!signal.callId || prev.callId === signal.callId) ? { ...prev, status: 'connected', acceptedAt } : prev);
      } else if (signal.type === 'call_ended' || signal.type === 'call_rejected' || signal.type === 'call_cancelled') {
        // Équipe F2 : la notification « Appel manqué » de l'appelé est
        // désormais écrite CÔTÉ SERVEUR par l'APPELANT (notify_missed_call,
        // SECURITY DEFINER gardé par l'appartenance à une conversation
        // commune) — elle atteint la cloche même si l'app de l'appelé est
        // FERMÉE (le broadcast est éphémère). L'ancienne auto-notification
        // locale de l'appelé (LOOP I3) est retirée pour ne pas doubler.
        // VF : un signal qui concerne un AUTRE appel ne ferme pas le mien.
        const current = activeCallSessionRef.current;
        if (current && signal.callId && current.callId !== signal.callId) return;
        stopAllRingtones();
        setActiveCallSession(null);
        setIsIncomingCall(false);
      } else if (signal.type === 'call_handled_elsewhere') {
        // Mission VF-2 : un autre appareil/onglet de MON compte a décroché ou
        // refusé — ici, ça se tait et se ferme sans « appel manqué ».
        callActionsRef.current.closeHandledElsewhere(signal.callId);
      }
    });

    return () => {
      unsubPresence();
      unsubCalls();
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.avatarUrl]);

  // Convertit une ligne réelle de `messages` (LOOP 06/17 — vraies colonnes :
  // `content`/`attachment_url`/`message_type`/`metadata.reactions`/
  // `reply_to_id`/`edited_at`/`deleted_at`, jamais les noms fictifs
  // `text`/`sender_name`/`media_url`/`voice_url`/`reply_to` que l'ancien
  // code lisait sans qu'ils n'aient jamais existé) en `ChatMessage` pour
  // l'UI. Le nom/avatar de l'expéditeur vient du cache de profils construit
  // au chargement des conversations — un paquet realtime ne porte aucune
  // jointure.
  const mapDbMessageToChatMessage = (raw: any, conversationId: string, existingMessages: ChatMessage[]): ChatMessage => {
    const senderProfile = participantProfilesRef.current[conversationId]?.[raw.sender_id];
    const isDeleted = !!raw.deleted_at;
    const repliedTo = raw.reply_to_id ? existingMessages.find(m => m.id === raw.reply_to_id) : undefined;
    // Équipe F1 (D8) : « Lu » dérivé du last_read_at réel des autres
    // participants — jamais un état inventé par message.
    const othersLastReadAt = othersLastReadAtRef.current[conversationId];
    const isMine = raw.sender_id === currentUser.id;
    const readByOthers = isMine && !!othersLastReadAt && !!raw.created_at
      && new Date(raw.created_at).getTime() <= new Date(othersLastReadAt).getTime();
    return {
      id: raw.id,
      conversationId,
      senderId: raw.sender_id,
      senderName: raw.sender_id === currentUser.id ? currentUser.name : (senderProfile?.name || 'Membre'),
      senderAvatar: raw.sender_id === currentUser.id ? currentUser.avatarUrl : senderProfile?.avatarUrl,
      senderRole: raw.sender_id === currentUser.id ? currentUser.role : senderProfile?.role,
      text: isDeleted ? undefined : (raw.content || undefined),
      originalLanguage: isDeleted ? undefined : raw.metadata?.original_language,
      transcript: isDeleted ? undefined : (typeof raw.metadata?.transcript === 'string' ? raw.metadata.transcript : undefined),
      transcriptLanguage: isDeleted ? undefined : (typeof raw.metadata?.transcript_language === 'string' ? raw.metadata.transcript_language : undefined),
      mediaType: isDeleted ? undefined : (raw.attachment_url ? (raw.message_type || 'document') : 'text'),
      mediaUrl: isDeleted ? undefined : raw.attachment_url,
      timestamp: raw.created_at ? new Date(raw.created_at) : new Date(),
      isRead: readByOthers,
      status: readByOthers ? 'read' : ((raw.status as ChatMessage['status']) || 'sent'), // Lu dérivé du last_read_at réel, sinon valeur base — jamais fabriqué.
      audioDuration: typeof raw.metadata?.audio_duration === 'number' ? raw.metadata.audio_duration : undefined,
      reactions: raw.metadata?.reactions || {},
      replyTo: repliedTo ? { id: repliedTo.id, text: repliedTo.text, senderName: repliedTo.senderName, mediaType: repliedTo.mediaType } : undefined,
      isEdited: !!raw.edited_at,
      isDeleted,
    };
  };

  // Historique réel + abonnement temps réel (LOOP 06/17). Avant cette LOOP,
  // aucune fonction ne chargeait l'historique — seuls les messages arrivés
  // après ouverture (via `subscribeToChat`) étaient visibles.
  useEffect(() => {
    if (!currentChatId || !currentUser?.id) return;

    // Équipe F1 (D13) : ouvrir une conversation la marque lue — le badge
    // local retombe à 0 en même temps que markConversationRead côté serveur.
    setConversations(prev => prev.map(c => c.id === currentChatId && c.unreadCount ? { ...c, unreadCount: 0 } : c));
    setTypingUsers({});

    // Incident production 01/09/2026 : les fils locaux de démonstration
    // (`chat-u5`, `local-…`) ne sont pas des UUID PostgreSQL. Ils restent
    // utilisables en mode local, mais ne doivent JAMAIS atteindre les APIs
    // `messages`/Realtime, dont `conversation_id` est strictement de type
    // UUID. Sans cette frontière, l'ouverture d'un fil local déclenchait un
    // GET /messages 400 (22P02) et un abonnement Realtime invalide.
    if (!isLikelyRealId(currentChatId)) return;

    let cancelled = false;

    (async () => {
      const history = await supabaseService.getConversationMessages(currentChatId);
      if (cancelled || history.length === 0) return;
      setConversations(prev => prev.map(c => {
        if (c.id !== currentChatId) return c;
        const known = new Set(c.messages.map(m => m.id));
        const mapped = history.filter((h: any) => !known.has(h.id)).map((h: any) => mapDbMessageToChatMessage(h, currentChatId, c.messages));
        return { ...c, messages: [...mapped, ...c.messages].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) };
      }));
      supabaseService.markConversationRead(currentChatId, currentUser.id!).catch(() => {});
    })();

    const unsubChat = supabaseService.subscribeToChat(currentChatId, {
      onMessage: (newMsg) => {
        setConversations(prev => prev.map(c => {
          if (c.id !== currentChatId) return c;
          // Réconciliation avec l'envoi optimiste : le message local
          // temporaire porte `client_message_id` comme id le temps que le
          // serveur confirme — jamais un doublon, jamais un id qui reste
          // "sending" indéfiniment une fois l'écho temps réel arrivé.
          const optimisticIdx = c.messages.findIndex(m => m.id === newMsg.client_message_id);
          const incoming = mapDbMessageToChatMessage(newMsg, currentChatId, c.messages);
          let nextMessages: ChatMessage[];
          if (optimisticIdx >= 0) {
            nextMessages = [...c.messages];
            nextMessages[optimisticIdx] = incoming;
          } else if (c.messages.some(m => m.id === incoming.id)) {
            return c;
          } else {
            nextMessages = [...c.messages, incoming];
          }
          return {
            ...c,
            lastMessage: incoming.text || (incoming.mediaType && incoming.mediaType !== 'text' ? '📎 Fichier partagé' : ''),
            lastMessageTime: 'À l\'instant',
            messages: nextMessages
          };
        }));
        if (newMsg.sender_id !== currentUser.id) {
          supabaseService.markConversationRead(currentChatId, currentUser.id!).catch(() => {});
        }
      },
      onUpdate: (updatedMsg) => {
        setConversations(prev => prev.map(c => {
          if (c.id !== currentChatId) return c;
          return {
            ...c,
            messages: c.messages.map(m => m.id === updatedMsg.id ? mapDbMessageToChatMessage(updatedMsg, currentChatId, c.messages) : m)
          };
        }));
      },
      onDelete: (deletedMsgId) => {
        // Filet de sécurité pour une suppression définitive faite ailleurs
        // (ex. modération) — le chemin normal côté utilisateur est
        // désormais une suppression douce (`deleted_at`), reçue via onUpdate.
        setConversations(prev => prev.map(c => {
          if (c.id === currentChatId) {
            return {
              ...c,
              messages: c.messages.filter(m => m.id !== deletedMsgId)
            };
          }
          return c;
        }));
      }
    });

    // Équipe F1 (D10) : « en train d'écrire » — broadcast éphémère, TTL
    // client de 4 s par utilisateur (un signal isTyping=false l'efface tout
    // de suite ; un onglet fermé brutalement expire tout seul).
    const unsubTyping = supabaseService.subscribeToTyping(currentChatId, (payload) => {
      if (!payload || payload.userId === currentUser.id) return;
      setTypingUsers(prev => {
        const next = { ...prev };
        if (payload.isTyping) {
          next[payload.userId] = { name: payload.userName || 'Membre', until: Date.now() + 4000 };
        } else {
          delete next[payload.userId];
        }
        return next;
      });
    });
    const typingSweep = setInterval(() => {
      setTypingUsers(prev => {
        const now = Date.now();
        const expired = Object.keys(prev).filter(id => prev[id].until <= now);
        if (expired.length === 0) return prev;
        const next = { ...prev };
        expired.forEach(id => { delete next[id]; });
        return next;
      });
    }, 1500);

    return () => {
      cancelled = true;
      unsubChat();
      unsubTyping();
      clearInterval(typingSweep);
      typingSelfActiveRef.current = false;
    };
  }, [currentChatId, currentUser.id]);

  // Équipe F1 (D13) : compteurs « non lus » EN DIRECT pour les conversations
  // non ouvertes — flux global borné par la RLS de `messages` (le canal ne
  // délivre que les conversations dont je suis réellement membre).
  const currentChatIdRef = useRef<string | null>(null);
  currentChatIdRef.current = currentChatId;
  useEffect(() => {
    if (!currentUser?.id) return;
    const unsub = supabaseService.subscribeToIncomingMessages((raw) => {
      if (!raw || raw.sender_id === currentUser.id) return;
      if (raw.conversation_id === currentChatIdRef.current) return; // la conversation ouverte est lue au fil de l'eau.
      setConversations(prev => prev.map(c => c.id === raw.conversation_id
        ? {
            ...c,
            unreadCount: (c.unreadCount || 0) + 1,
            lastMessage: raw.deleted_at ? c.lastMessage : (raw.content || '📎 Fichier partagé'),
            lastMessageTime: 'À l\'instant',
          }
        : c));
    });
    return unsub;
  }, [currentUser?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (currentChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, currentChatId]);

  // Total unread count
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const activeChat = conversations.find(c => c.id === currentChatId);

  /**
   * Un seul réglage de langue : la MIENNE (`profiles.preferred_language`,
   * mémorisée sur le profil, donc retrouvée d'un appareil à l'autre).
   * « Par défaut » (`undefined`) = aucune traduction, on lit et on entend
   * l'original. Dès qu'une langue est choisie, elle pilote texte, vocaux et
   * appels. La langue de mon interlocuteur n'est jamais choisie : le système
   * la DÉTECTE à partir de la langue qu'il a lui-même déclarée dans son
   * dernier message. Tant qu'il n'a rien écrit, elle est inconnue et rien
   * n'est inventé.
   */
  const myLanguage = myEffectiveLanguage(currentUser.preferredLanguage);
  const recipientLanguage = useMemo(
    () => (activeChat && !activeChat.isGroup ? detectRecipientLanguage(activeChat.messages, currentUser.id) : undefined),
    [activeChat, currentUser.id],
  );

  const handleChangeMyLanguage = (code: string) => {
    const next = code || null; // '' = « Par défaut » → null persisté, jamais une langue inventée.
    if ((myLanguage ?? null) === next) return;
    void onUpdateProfile?.({ preferredLanguage: next });
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const isBlocked = blockedUserIds.includes(c.participantId);
    if (isBlocked && activeTab !== 'members') return false;

    const matchesSearch = c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'direct') return !c.isGroup;
    if (activeTab === 'groups') return !!c.isGroup;
    return true;
  });

  // Filter members directory
  const filteredMembers = MOCK_MEMBERS.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // --- Voice Recorder Engine ---
  // Équipe F1 : le type MIME était CODÉ EN DUR 'audio/webm' quel que soit
  // l'encodeur réel — un vocal enregistré sur Safari/iOS (audio/mp4)
  // devenait illisible PARTOUT (data-URI au type menteur). On négocie le
  // premier format réellement supporté et on étiquette le Blob avec le type
  // EFFECTIF du recorder.
  const pickSupportedAudioMime = (): string | undefined => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return undefined;
    return ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
      .find((t) => MediaRecorder.isTypeSupported(t));
  };
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickSupportedAudioMime();
      const mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      voiceCancelledRef.current = false;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        // Équipe F1 : « Annuler » remettait les états à null PUIS ce handler
        // asynchrone les réécrivait — l'enregistrement refusé ressuscitait
        // en « prêt à envoyer ». Le drapeau d'annulation coupe court.
        if (voiceCancelledRef.current) return;
        // HL-2 : arrêt en douceur de la reconnaissance — ses derniers mots
        // arrivent AVANT que le vocal soit déclaré prêt.
        const captioner = voiceCaptionerRef.current;
        voiceCaptionerRef.current = null;
        if (captioner) await captioner.finish();
        if (voiceCancelledRef.current) return;
        const transcript = voiceTranscriptPartsRef.current.join(' ').replace(/\s+/g, ' ').trim();
        setLiveVoiceTranscript('');
        setRecordedTranscript(transcript || null);
        setRecordedTranscriptLanguage(transcript ? (languageCodeFromTag(voiceSpeechTagRef.current) ?? myLanguage) : undefined);
        const effectiveType = mediaRecorder.mimeType || mime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: effectiveType });
        // VF-4 : rien du navigateur → transcription serveur (langue DÉTECTÉE
        // par le fournisseur, sinon ma langue). Jamais bloquant pour l'envoi.
        if (!transcript) {
          const seq = ++voiceTranscriptionSeqRef.current;
          setVoiceTranscriptionPending(true);
          setVoiceTranscriptionNote(null);
          transcribeVoiceRecording(audioBlob, myLanguage)
            .then((result) => {
              if (voiceTranscriptionSeqRef.current !== seq) return; // annulé, rejeté ou déjà envoyé entre-temps
              if (result.text) {
                setRecordedTranscript(result.text);
                setRecordedTranscriptLanguage(result.language);
              } else {
                setVoiceTranscriptionNote('Aucune parole reconnue dans ce vocal — il part tel quel.');
              }
            })
            .catch((err) => {
              if (voiceTranscriptionSeqRef.current !== seq) return;
              console.warn('Transcription serveur du vocal impossible', err);
              const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
              setVoiceTranscriptionNote(`Transcription indisponible${detail} — le vocal part tel quel.`);
            })
            .finally(() => { if (voiceTranscriptionSeqRef.current === seq) setVoiceTranscriptionPending(false); });
        }
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setRecordedAudioUrl(reader.result);
            // Équipe F1 (D7) : le Blob n'est posé qu'AVEC l'URL prête — le
            // bouton Envoyer ne peut plus partir dans la fenêtre où l'URL
            // n'existait pas encore (vocal perdu en silence).
            setRecordedAudioBlob(audioBlob);
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      mediaRecorder.start(100);
      setIsRecordingVoice(true);
      setRecordingDuration(0);

      // HL-2 : transcription en direct dans MA langue (ou celle du navigateur
      // en « Par défaut ») — best effort, le vocal n'en dépend jamais.
      voiceTranscriptPartsRef.current = [];
      setLiveVoiceTranscript('');
      setRecordedTranscript(null);
      setRecordedTranscriptLanguage(undefined);
      resetVoiceTranscriptionState();
      voiceSpeechTagRef.current = speechTagFor(myLanguage, typeof navigator !== 'undefined' ? navigator.language : undefined);
      const captioner = new CallCaptioner({
        lang: voiceSpeechTagRef.current,
        onInterim: (text) => setLiveVoiceTranscript(text),
        onFinal: (text) => { voiceTranscriptPartsRef.current.push(text); setLiveVoiceTranscript(''); },
      });
      voiceCaptionerRef.current = captioner.start() ? captioner : null;

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone non disponible ou refusé");
      alert("Veuillez autoriser l'accès au microphone pour enregistrer un message vocal.");
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      clearInterval(recordingTimerRef.current);
    }
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && isRecordingVoice) {
      voiceCancelledRef.current = true;
      voiceCaptionerRef.current?.stop();
      voiceCaptionerRef.current = null;
      voiceTranscriptPartsRef.current = [];
      setLiveVoiceTranscript('');
      setRecordedTranscript(null);
      setRecordedTranscriptLanguage(undefined);
      resetVoiceTranscriptionState();
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      clearInterval(recordingTimerRef.current);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
    }
  };

  // HL-2 : voix qui lit, dans MA langue, la traduction d'un vocal reçu —
  // instance dédiée (jamais le moteur de l'Architecte), recréée quand ma
  // langue change, coupée au démontage. Inexistante en « Par défaut ».
  const transcriptVoiceRef = useRef<InterpreterVoice | null>(null);
  useEffect(() => {
    transcriptVoiceRef.current?.stop();
    transcriptVoiceRef.current = myLanguage
      ? new InterpreterVoice({ lang: speechTagFor(myLanguage) })
      : null;
    return () => { transcriptVoiceRef.current?.stop(); transcriptVoiceRef.current = null; };
  }, [myLanguage]);
  const speakTranslatedTranscript = (text: string) => { transcriptVoiceRef.current?.speak(text); };

  // Équipe F1 (D10) : émission « en train d'écrire » — un seul signal
  // isTyping=true par rafale de frappe, isTyping=false après 2,5 s
  // d'inactivité ou à l'envoi. Broadcast éphémère, jamais une écriture base.
  const emitTypingSignal = (isTypingNow: boolean) => {
    if (!currentChatId || !currentUser?.id) return;
    if (!supabaseService.isConfigured() || !/^[0-9a-f]{8}-/i.test(currentChatId)) return; // conversation locale/démonstration — personne en face.
    if (isTypingNow) {
      if (!typingSelfActiveRef.current) {
        typingSelfActiveRef.current = true;
        void supabaseService.sendTypingSignal(currentChatId, { userId: currentUser.id, userName: currentUser.name, isTyping: true });
      }
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        typingSelfActiveRef.current = false;
        void supabaseService.sendTypingSignal(currentChatId, { userId: currentUser.id, userName: currentUser.name, isTyping: false });
      }, 2500);
    } else if (typingSelfActiveRef.current) {
      typingSelfActiveRef.current = false;
      clearTimeout(typingTimeoutRef.current);
      void supabaseService.sendTypingSignal(currentChatId, { userId: currentUser.id, userName: currentUser.name, isTyping: false });
    }
  };

  // --- Audio Player Toggle ---
  const togglePlayAudio = (messageId: string, audioUrl?: string) => {
    if (playingAudioId === messageId) {
      audioPlayerRef.current?.pause();
      setPlayingAudioId(null);
      setAudioProgress(0);
    } else {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
      }
      if (audioUrl) {
        const audio = new Audio(audioUrl);
        audioPlayerRef.current = audio;
        setPlayingAudioId(messageId);

        audio.ontimeupdate = () => {
          if (audio.duration) {
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        };

        audio.onended = () => {
          setPlayingAudioId(null);
          setAudioProgress(0);
        };

        // Équipe F1 (D6) : un échec de lecture est DIT, jamais un bouton qui
        // semble marcher sans son (source invalide, autoplay bloqué…).
        audio.onerror = () => {
          setPlayingAudioId(null);
          setAudioProgress(0);
          alert("Impossible de lire ce message vocal — le fichier audio est indisponible ou corrompu.");
        };
        audio.play().catch(() => {
          setPlayingAudioId(null);
          alert("La lecture audio a été bloquée par le navigateur. Touchez à nouveau le bouton de lecture.");
        });
      } else {
        // Équipe F1 (D6) : pas d'URL — le bouton est désactivé dans la bulle,
        // ce garde-fou couvre tout autre chemin d'appel.
        alert("Ce message vocal n'a pas de fichier audio associé.");
      }
    }
  };

  // --- File Upload Handler ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // `Array.from(FileList)` s'infère en `unknown[]` avec la configuration de
    // types de ce projet : on parcourt la FileList par son accesseur typé
    // `item(i)`, qui rend un vrai `File` sans dépendre de cette inférence.
    const selectedFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const entry = files.item(i);
      if (entry) selectedFiles.push(entry);
    }

    selectedFiles.forEach(file => {
      const isImg = file.type.startsWith('image/');
      const isVid = file.type.startsWith('video/');
      const isAud = file.type.startsWith('audio/');
      
      const fileType = isImg ? 'image' : isVid ? 'video' : isAud ? 'audio' : 'document';
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(0)} KB`;

      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setAttachedFiles(prev => [...prev, {
            name: file.name,
            size: sizeStr,
            type: fileType,
            url: reader.result as string
          }]);
        }
      };
      reader.readAsDataURL(file);
    });

    // Reset input so re-selecting same file works
    e.target.value = '';
  };

  // --- Send Message ---
  // LOOP 06/17 : réécrit pour la vraie table `messages`. Chaque message
  // porte désormais un id CLIENT (`crypto.randomUUID()`) qui sert à la fois
  // d'id d'affichage optimiste ET de `client_message_id` envoyé au serveur
  // — l'ancre d'idempotence (index unique déjà présent en base) qui rend un
  // double envoi (double clic, retry réseau) sans effet plutôt que de créer
  // un second message. `status` démarre honnêtement à 'sending' — jamais
  // 'sent' avant confirmation serveur réelle (l'ancien code l'affichait
  // 'sent' immédiatement, alors que l'envoi échouait systématiquement en
  // silence contre le vrai schéma).
  const isRealConversationId = (id: string) => !id.startsWith('chat-') && !id.startsWith('local-');
  // isLikelyRealId : désormais défini (et exporté) au niveau module — voir en
  // tête de fichier (Équipe 7, A1).

  const handleSendMessage = async () => {
    if (!currentChatId || (!inputText.trim() && attachedFiles.length === 0 && !recordedAudioBlob)) return;

    emitTypingSignal(false); // Équipe F1 (D10) : envoyer efface tout de suite « en train d'écrire » chez l'autre.
    const currentReplyTo = replyingTo;
    const filesToSend = [...attachedFiles];
    const textToSend = inputText.trim();
    const currentAudioBlob = recordedAudioBlob;
    let currentAudioUrl = recordedAudioUrl;
    // Équipe F1 : durée RÉELLE ou rien — l'ancien `|| 5` inventait 5 s.
    const currentAudioDuration = recordingDuration > 0 ? recordingDuration : undefined;
    // HL-2 : la transcription réelle du vocal voyage avec lui (jamais inventée).
    const currentTranscript = currentAudioBlob && recordedTranscript ? recordedTranscript : undefined;
    const currentTranscriptLanguage = currentTranscript ? recordedTranscriptLanguage : undefined;
    const canSync = supabaseService.isConfigured() && isRealConversationId(currentChatId);

    setInputText('');
    setAttachedFiles([]);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordedTranscript(null);
    setRecordedTranscriptLanguage(undefined);
    // VF-4 : une transcription serveur encore en vol ne s'attachera plus à
    // rien — le vocal part maintenant, tel quel (jamais retenu par elle).
    resetVoiceTranscriptionState();
    setReplyingTo(null);

    // Équipe F1 (D4) : le vocal partait en BASE64 DANS LA LIGNE — au-delà de
    // ~1 Mo, Supabase Realtime remplace l'enregistrement diffusé par un stub
    // et le destinataire recevait une BULLE VIDE (l'émetteur perdait même son
    // propre vocal à la réconciliation). Sur une vraie conversation, l'audio
    // monte désormais dans Storage et seule l'URL courte voyage. Un échec
    // d'upload ANNULE l'envoi et restitue le composeur — jamais de faux départ.
    if (canSync && currentAudioBlob && currentAudioUrl) {
      try {
        const ext = (currentAudioBlob.type.includes('mp4') ? 'm4a' : currentAudioBlob.type.includes('ogg') ? 'ogg' : 'webm');
        const file = new File([currentAudioBlob], `vocal-${Date.now()}.${ext}`, { type: currentAudioBlob.type || 'audio/webm' });
        const url = await supabaseService.uploadContentMedia(currentUser.id!, file, 'chat');
        if (!url) throw new Error('upload vocal failed');
        currentAudioUrl = url;
      } catch (err) {
        console.warn('Envoi du vocal impossible (upload Storage)', err);
        alert("L'envoi du message vocal a échoué (connexion instable ?). Il n'a pas été envoyé — réessayez.");
        setInputText(textToSend);
        setAttachedFiles(filesToSend);
        setRecordedAudioBlob(currentAudioBlob);
        setRecordedAudioUrl(recordedAudioUrl);
        setRecordedTranscript(currentTranscript ?? null);
        setRecordedTranscriptLanguage(currentTranscriptLanguage);
        setReplyingTo(currentReplyTo);
        return;
      }
    }

    type PendingSend = { msg: ChatMessage; clientMessageId: string; messageType: 'text' | 'image' | 'video' | 'audio' | 'document'; content?: string; attachmentUrl?: string };
    const pending: PendingSend[] = [];
    const makeReplyTo = () => currentReplyTo ? { id: currentReplyTo.id, text: currentReplyTo.text, senderName: currentReplyTo.senderName, mediaType: currentReplyTo.mediaType } : undefined;
    const baseMsg = (clientMessageId: string): Omit<ChatMessage, 'text' | 'mediaType' | 'mediaUrl' | 'fileName' | 'fileSize' | 'audioDuration'> => ({
      id: clientMessageId,
      conversationId: currentChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      senderRole: currentUser.role || 'citizen',
      // « Par défaut » → aucune langue déclarée : le moteur détecte la source
      // réelle côté lecteur, rien n'est inventé.
      originalLanguage: myLanguage,
      timestamp: new Date(),
      isRead: false,
      status: 'sending',
      replyTo: makeReplyTo(),
    });

    if (currentAudioUrl) {
      const clientMessageId = crypto.randomUUID();
      pending.push({
        msg: { ...baseMsg(clientMessageId), text: textToSend || undefined, mediaType: 'audio', mediaUrl: currentAudioUrl, audioDuration: currentAudioDuration, transcript: currentTranscript, transcriptLanguage: currentTranscriptLanguage },
        clientMessageId, messageType: 'audio', content: textToSend || undefined, attachmentUrl: currentAudioUrl,
      });
    } else if (filesToSend.length > 0) {
      filesToSend.forEach((file, i) => {
        const clientMessageId = crypto.randomUUID();
        pending.push({
          msg: { ...baseMsg(clientMessageId), text: i === 0 ? (textToSend || undefined) : undefined, mediaType: file.type as any, mediaUrl: file.url, fileName: file.name, fileSize: file.size },
          clientMessageId, messageType: file.type as any, content: i === 0 ? (textToSend || undefined) : undefined, attachmentUrl: file.url,
        });
      });
    } else if (textToSend) {
      const clientMessageId = crypto.randomUUID();
      pending.push({
        msg: { ...baseMsg(clientMessageId), text: textToSend, mediaType: 'text' },
        clientMessageId, messageType: 'text', content: textToSend,
      });
    }

    if (pending.length === 0) return;

    const newMessagesList = pending.map(p => p.msg);
    const lastMsg = newMessagesList[newMessagesList.length - 1];
    setConversations(prev => prev.map(c => {
      if (c.id === currentChatId) {
        return {
          ...c,
          lastMessage: lastMsg.text || (lastMsg.mediaType === 'audio' ? '🎙️ Message vocal' : lastMsg.mediaType === 'image' ? '📷 Photo' : lastMsg.mediaType === 'video' ? '🎥 Vidéo' : '📎 Fichier partagé'),
          lastMessageTime: 'À l\'instant',
          messages: [...c.messages, ...newMessagesList]
        };
      }
      return c;
    }));

    if (!canSync) return; // conversation locale seulement (démo/hors-ligne) — reste optimiste, jamais de fausse confirmation serveur.

    for (const p of pending) {
      try {
        const sent = await supabaseService.sendChatMessage({
          conversationId: currentChatId,
          senderId: currentUser.id,
          clientMessageId: p.clientMessageId,
          content: p.content,
          originalLanguage: myLanguage,
          attachmentUrl: p.attachmentUrl,
          messageType: p.messageType,
          transcript: p.msg.transcript,
          transcriptLanguage: p.msg.transcriptLanguage,
          // Corrigé : les deux branches de l'ancien ternaire valaient
          // `undefined` (probable copier-coller de la vérification de l'id
          // de CONVERSATION appliquée par erreur à l'id du MESSAGE cité) —
          // `reply_to_id` n'était donc jamais réellement envoyé à Supabase,
          // même en répondant explicitement à un message (la preview de
          // réponse locale de l'expéditeur ne survivait ni au rechargement
          // ni pour le destinataire, qui ne recevait aucun lien de réponse).
          // On ne cite que l'id d'un message déjà confirmé côté serveur
          // (status !== 'sending') : le message optimiste pas encore
          // confirmé n'existe pas encore comme ligne réelle, le référencer
          // violerait la contrainte de clé étrangère reply_to_id.
          replyToId: currentReplyTo && currentReplyTo.status !== 'sending' ? currentReplyTo.id : undefined,
          audioDurationSeconds: p.messageType === 'audio' ? currentAudioDuration : undefined,
        });
        if (sent) {
          setConversations(prev => prev.map(c => c.id === currentChatId ? {
            ...c,
            messages: c.messages.map(m => m.id === p.clientMessageId ? { ...m, id: sent.id, status: sent.status as ChatMessage['status'] } : m)
          } : c));
        }
      } catch (err) {
        console.warn('Erreur envoi message Supabase:', err);
        // Équipe F1 (D3) : un envoi ÉCHOUÉ s'affichait « Envoyé » (status
        // undefined → branche par défaut de la coche grise). État explicite.
        setConversations(prev => prev.map(c => c.id === currentChatId ? {
          ...c,
          messages: c.messages.map(m => m.id === p.clientMessageId ? { ...m, status: 'failed' } : m)
        } : c));
      }
    }
  };

  // --- Reactions Handler ---
  // LOOP 06/17 : remplace l'ancien lire-modifier-écrire local (qui appelait
  // `updateChatMessage({reactions})` — un payload sans rapport avec les
  // vraies colonnes, donc toujours silencieusement sans effet réel côté
  // serveur) par le RPC atomique `toggle_message_reaction` (verrou de ligne
  // côté base, jamais de condition de course entre deux personnes qui
  // réagissent au même instant). Optimiste localement pour la réactivité,
  // puis réconcilié avec la valeur réellement écrite en base ; en cas
  // d'échec (ex. non-membre de la conversation), l'état local est annulé
  // plutôt que de laisser croire à une réaction qui n'a pas été enregistrée.
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentChatId) return;
    const canSync = supabaseService.isConfigured() && isRealConversationId(currentChatId);

    let previousReactions: Record<string, string[]> | undefined;
    setConversations(prev => prev.map(c => {
      if (c.id === currentChatId) {
        const updatedMessages = c.messages.map(m => {
          if (m.id === messageId) {
            previousReactions = m.reactions;
            const reactions = { ...(m.reactions || {}) };
            const users = reactions[emoji] || [];
            const userIdx = users.indexOf(currentUser.id);

            if (userIdx > -1) {
              reactions[emoji] = users.filter(u => u !== currentUser.id);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = [...users, currentUser.id];
            }

            return { ...m, reactions };
          }
          return m;
        });
        return { ...c, messages: updatedMessages };
      }
      return c;
    }));

    if (!canSync) return;

    supabaseService.toggleMessageReaction(messageId, emoji).then((serverReactions) => {
      setConversations(prev => prev.map(c => c.id === currentChatId ? {
        ...c,
        messages: c.messages.map(m => m.id === messageId ? { ...m, reactions: serverReactions } : m)
      } : c));
    }).catch((err) => {
      console.warn('Erreur réaction Supabase, annulation locale:', err);
      setConversations(prev => prev.map(c => c.id === currentChatId ? {
        ...c,
        messages: c.messages.map(m => m.id === messageId ? { ...m, reactions: previousReactions } : m)
      } : c));
    });
  };

  // --- Résumé de conversation (LOOP 07/17) ---
  // Même patron que SocialLive.tsx::handleEndLive (seul précédent réel de
  // résumé IA dans ce dépôt) : matière première = vrais messages déjà
  // chargés, jamais rien d'inventé si la conversation est vide, dégradation
  // gracieuse si l'IA échoue.
  const handleSummarizeConversation = async () => {
    if (!activeChat || isSummarizing) return;
    setIsSummarizing(true);
    setConversationSummary(null);
    try {
      const summary = await summarizeConversation(
        activeChat.messages.map(m => ({ senderName: m.senderId === currentUser.id ? 'Moi' : (m.senderName || activeChat.participantName), text: m.text || '' }))
      );
      setConversationSummary(summary);
    } finally {
      setIsSummarizing(false);
    }
  };

  // --- Assistance de rédaction (LOOP 07/17) ---
  // Ne modifie que le champ de saisie — n'envoie jamais rien elle-même
  // (préparer n'est pas envoyer, principe transversal de la mission).
  const handleAssistRewrite = async () => {
    if (!inputText.trim() || isRewriting) return;
    setIsRewriting(true);
    try {
      const corrected = await assistRewriteMessage(inputText, 'corrige l\'orthographe, la grammaire et la clarté, garde un ton naturel');
      setInputText(corrected);
    } finally {
      setIsRewriting(false);
    }
  };

  // --- Start Call ---
  // Miroir de l'appel actif pour les décisions dans les handlers de signaux
  // (jamais un effet de bord dans un updater setState — StrictMode le
  // rejouerait et doublerait la notification d'appel manqué).
  const activeCallSessionRef = useRef<ActiveCallSession | null>(null);
  useEffect(() => { activeCallSessionRef.current = activeCallSession; }, [activeCallSession]);

  // Équipe I (LOOP I1) : identifiant du CORRESPONDANT pris dans la session
  // d'appel elle-même — l'ancien code routait accepter/refuser/raccrocher
  // via `activeChat.participantId` : si l'appelé n'avait pas cette
  // conversation ouverte (cas courant d'un appel entrant), son « Décrocher »
  // n'envoyait RIEN (ou au mauvais membre si un autre chat était ouvert) —
  // l'appelant ne se connectait jamais. C'était l'une des causes racines des
  // « appels qui échouent ».
  const callPeerId = (session: ActiveCallSession): string =>
    session.initiatorId === currentUser.id ? session.receiverId : session.initiatorId;

  // ── Équipe 8 (loops 2+6) : coordination sonnerie ↔ session d'appel ──────
  // UN seul effet déclaratif pilote TOUT l'audio de sonnerie via
  // services/calls/ringtoneService (unique source sonore ; l'ancienne
  // tonalité WebAudio locale de ChatCallModal est retirée — jamais deux
  // générateurs superposés) :
  //  - phase 'ring'     (invitation REÇUE, session ringing) → startRinging
  //    avec la sonnerie du PROFIL (privacySettings.ringtoneId) si choisie,
  //    sinon le cache local du service — vibration coordonnée incluse ;
  //  - phase 'ringback' (invitation ÉMISE, session ringing) → startRingback
  //    (tonalité « tuuut… tuuut » côté appelant, sans vibration) ;
  //  - phase 'silent'   (accepté / refusé / raccroché / call_ended ou
  //    call_rejected reçus / expiration 35 s / session nulle) → arrêt
  //    IMMÉDIAT des deux canaux. Le cleanup d'effet couvre aussi le
  //    démontage du composant et StrictMode (start* du service est
  //    idempotent) ; le service garde en dernier filet son propre arrêt de
  //    sécurité à 45 s (jamais une sonnerie orpheline).
  const callRingingPhase = ringingStateForCall(activeCallSession, isIncomingCall);
  const profileRingtoneId = resolveIncomingRingtoneId(currentUser?.privacySettings?.ringtoneId);
  useEffect(() => {
    if (callRingingPhase === 'ring') {
      void startRinging(profileRingtoneId);
    } else if (callRingingPhase === 'ringback') {
      void startRingback();
    } else {
      stopRinging();
      stopRingback();
      return;
    }
    return () => {
      stopRinging();
      stopRingback();
    };
  }, [callRingingPhase, activeCallSession?.callId, profileRingtoneId]);

  // Sonnerie sortante sans réponse : fin honnête après 35 s — jamais un
  // faux « connecté », et l'échec entre dans la cloche (LOOP I3).
  useEffect(() => {
    if (!activeCallSession || activeCallSession.status !== 'ringing' || isIncomingCall) return;
    const timer = setTimeout(() => {
      const session = activeCallSessionRef.current;
      if (!session || session.status !== 'ringing') return;
      stopAllRingtones();
      supabaseService.sendCallSignal(callPeerId(session), { type: 'call_ended', callId: session.callId, conversationId: session.conversationId });
      // Équipe F2 : trace serveur « Appel manqué » pour l'appelé — atteint
      // sa cloche même si son application est fermée.
      void supabaseService.notifyMissedCall(callPeerId(session));
      // Mission VF-1 : et son téléphone affiche « Appel manqué » à la place
      // de l'appel entrant (le push d'annulation remplace celui de l'appel,
      // même sujet côté service de push).
      void notifyCallPush({ topic: 'call_cancelled', targetUserId: callPeerId(session), conversationId: session.conversationId, callId: session.callId, payload: { reason: 'missed' } });
      void supabaseService.recordSelfNotification({
        title: 'Appel sans réponse',
        message: `${session.receiverName} n'a pas répondu à votre appel ${session.type === 'video' ? 'vidéo' : 'audio'}.`,
        type: 'info',
        targetAction: 'chat',
      });
      setActiveCallSession(null);
    }, 35000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCallSession?.callId, activeCallSession?.status, isIncomingCall]);

  // Mission VF : un appel ENTRANT qui sonne n'a pas non plus vocation à
  // sonner sans fin si le `call_ended` de l'appelant s'est perdu (broadcast
  // éphémère, onglet endormi) : fermeture silencieuse à 40 s — la trace
  // « manqué » est écrite par l'appelant, jamais ici.
  useEffect(() => {
    if (!activeCallSession || activeCallSession.status !== 'ringing' || !isIncomingCall) return;
    const ringingCallId = activeCallSession.callId;
    const timer = setTimeout(() => {
      const session = activeCallSessionRef.current;
      if (!session || session.status !== 'ringing' || session.callId !== ringingCallId) return;
      stopAllRingtones();
      setActiveCallSession(null);
      setIsIncomingCall(false);
    }, INCOMING_RING_TIMEOUT_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCallSession?.callId, activeCallSession?.status, isIncomingCall]);

  // ── Mission VF-2 (multi-appareils) & VF-1 (push) : actions d'appel ─────
  // Identifiants d'appel déjà vus (dédup broadcast / push / lancement),
  // canal inter-onglets du même navigateur, et miroir de l'utilisateur pour
  // les écouteurs enregistrés dans des effets (jamais une fermeture périmée).
  const seenCallIdsRef = useRef<Set<string>>(new Set());
  const callsChannelRef = useRef<BroadcastChannel | null>(null);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;
  const [callNotice, setCallNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!callNotice) return;
    const timer = setTimeout(() => setCallNotice(null), 6000);
    return () => clearTimeout(timer);
  }, [callNotice]);

  /**
   * Quand JE décroche ou refuse sur cet appareil, mes AUTRES appareils et
   * onglets qui sonnent encore doivent se taire : signal sur MON propre canal
   * (le broadcast ne revient pas à l'émetteur mais atteint les autres
   * connexions du compte), canal inter-onglets du même navigateur, et push
   * `call_cancelled` pour fermer la notification sur les téléphones.
   */
  const announceHandledElsewhere = (session: Pick<ActiveCallSession, 'callId' | 'conversationId'>, reason: 'answered' | 'rejected') => {
    const me = currentUserRef.current;
    if (!isLikelyRealId(me?.id)) return;
    supabaseService.sendCallSignal(me.id, { type: 'call_handled_elsewhere', callId: session.callId, conversationId: session.conversationId, reason });
    try {
      callsChannelRef.current?.postMessage({ type: 'call_handled_elsewhere', callId: session.callId });
    } catch (err) {
      console.warn('[appel] canal inter-onglets indisponible', err);
    }
    void notifyCallPush({ topic: 'call_cancelled', targetUserId: me.id, callId: session.callId, payload: { reason } });
  };

  /** `call_handled_elsewhere` reçu : si c'est l'appel qui sonne ICI, silence et fermeture — sans « appel manqué ». */
  const closeHandledElsewhere = (callId: string | null | undefined) => {
    if (!isHandledElsewhere({ type: 'call_handled_elsewhere', callId }, activeCallSessionRef.current)) return;
    stopAllRingtones();
    setActiveCallSession(null);
    setIsIncomingCall(false);
  };

  /**
   * Décrocher (bouton de l'écran d'appel, action de la notification, ou
   * lancement par notification). La sonnerie s'arrête AVANT tout le reste
   * (VF-2) ; `call_accepted` reste le SEUL signal qui connecte ; l'activation
   * du micro est faite par ChatCallModal une fois l'état 'connected' posé.
   * `isIncomingCall` reste VRAI pour tout l'appel : « je suis l'appelé »
   * détermine le nom/avatar affichés et le rôle du transport — l'ancien
   * passage à false au décroché faisait afficher à l'appelé son PROPRE nom.
   */
  const acceptCall = (session: ActiveCallSession) => {
    stopAllRingtones();
    const acceptedAt = Date.now();
    supabaseService.sendCallSignal(callPeerId(session), { type: 'call_accepted', callId: session.callId, conversationId: session.conversationId });
    announceHandledElsewhere(session, 'answered');
    setActiveCallSession({ ...session, status: 'connected', acceptedAt });
    setIsIncomingCall(true);
  };

  const rejectCall = (session: ActiveCallSession) => {
    stopAllRingtones();
    supabaseService.sendCallSignal(callPeerId(session), { type: 'call_rejected', callId: session.callId, conversationId: session.conversationId });
    announceHandledElsewhere(session, 'rejected');
    setActiveCallSession(null);
    setIsIncomingCall(false);
  };

  const endCall = (session: ActiveCallSession, incoming: boolean) => {
    stopAllRingtones();
    supabaseService.sendCallSignal(callPeerId(session), { type: 'call_ended', callId: session.callId, conversationId: session.conversationId });
    // Équipe F2 : annulation PENDANT la sonnerie sortante = appel manqué
    // pour l'appelé — trace serveur, même app fermée ; VF-1 : et « Appel
    // manqué » sur son téléphone à la place de l'appel entrant.
    if (session.status === 'ringing' && !incoming) {
      void supabaseService.notifyMissedCall(callPeerId(session));
      void notifyCallPush({ topic: 'call_cancelled', targetUserId: callPeerId(session), conversationId: session.conversationId, callId: session.callId, payload: { reason: 'missed' } });
    }
    setActiveCallSession(null);
    setIsIncomingCall(false);
  };

  /**
   * Push reçu fenêtre ouverte (relayé par le service worker) : un
   * `incoming_call` frais (≤ 40 s), non déjà vu, sans appel actif → même
   * traitement qu'un `call_invitation` (session construite depuis
   * `payload.from`) ; un `call_cancelled` → l'appel qui sonne ici se ferme.
   * Pas de notification système ici : le service worker l'a déjà affichée.
   */
  const handlePushPayload = (payload: CallPushPayload) => {
    const me = currentUserRef.current;
    if (!isLikelyRealId(me?.id)) return;
    if (payload.type === 'incoming_call') {
      if (!isFreshCallPayload(payload)) return;
      if (activeCallSessionRef.current) return;
      if (!dedupeCallId(seenCallIdsRef.current, payload.callId)) return;
      const session = sessionFromPushPayload(payload, { id: me.id, name: me.name, avatarUrl: me.avatarUrl }, Date.now());
      if (!session) return;
      setActiveCallSession(session);
      setIsIncomingCall(true);
      return;
    }
    if (payload.type === 'call_cancelled') {
      const current = activeCallSessionRef.current;
      if (!current || current.status !== 'ringing' || !payload.callId || current.callId !== payload.callId) return;
      stopAllRingtones();
      setActiveCallSession(null);
      setIsIncomingCall(false);
    }
  };

  /** Clic sur la notification (fenêtre existante) : décrocher, refuser ou ouvrir la conversation. */
  const handlePushAction = (action: PushAction, payload: CallPushPayload) => {
    const me = currentUserRef.current;
    if (!isLikelyRealId(me?.id)) return;
    const current = activeCallSessionRef.current;
    const sameCall = current && payload.callId && current.callId === payload.callId ? current : null;
    if (action === 'open') {
      if (payload.conversationId && isLikelyRealId(payload.conversationId)) {
        setCurrentChatId(payload.conversationId);
        setIsOpen(true);
      }
      return;
    }
    if (sameCall) {
      if (sameCall.status !== 'ringing') return; // déjà pris en charge ici
      if (action === 'accept') acceptCall(sameCall); else rejectCall(sameCall);
      return;
    }
    if (current || payload.type !== 'incoming_call') return; // un autre appel est en cours / charge inattendue
    if (!isFreshCallPayload(payload)) {
      if (action === 'accept') setCallNotice('Cet appel a expiré.');
      return;
    }
    const session = sessionFromPushPayload(payload, { id: me.id, name: me.name, avatarUrl: me.avatarUrl }, Date.now());
    if (!session || !dedupeCallId(seenCallIdsRef.current, session.callId)) return;
    if (action === 'accept') acceptCall(session); else rejectCall(session);
  };

  /**
   * Lancement de l'application par un clic sur la notification (aucune
   * fenêtre n'existait) : une fois l'utilisateur connecté et la conversation
   * réelle chargée (nom et avatar réels de l'appelant), on ouvre la
   * conversation puis on sonne/décroche/refuse selon l'action. Un appel
   * périmé (> 40 s) n'est jamais « accepté » dans le vide : message honnête.
   */
  const runPushLaunch = async (launch: PushLaunch, conv: ChatConversation | undefined) => {
    const me = currentUserRef.current;
    const convId = launch.conversationId && isLikelyRealId(launch.conversationId) ? launch.conversationId : null;
    if (convId) {
      setCurrentChatId(convId);
      setIsOpen(true);
    }
    if (launch.action === 'open' || launch.type !== 'incoming_call') return;
    const callerId = launch.fromUserId && isLikelyRealId(launch.fromUserId) ? launch.fromUserId : conv?.participantId;
    if (!launch.callId || !convId || !callerId || !isLikelyRealId(callerId) || !isLikelyRealId(me?.id)) return;
    if (launch.ts === null || !isFreshCallPayload({ ts: launch.ts })) {
      if (launch.action === 'accept') setCallNotice('Cet appel a expiré.');
      return;
    }
    if (activeCallSessionRef.current) return; // le broadcast est arrivé entre-temps : déjà pris en charge
    if (!dedupeCallId(seenCallIdsRef.current, launch.callId)) return;
    let callerName = conv && conv.participantId === callerId ? conv.participantName : '';
    let callerAvatar = conv && conv.participantId === callerId ? conv.participantAvatar : '';
    if (!callerName) {
      // Conversation absente de la liste : le profil réel de l'appelant, jamais un nom inventé.
      const profile = await supabaseService.getProfile(callerId);
      if (profile) { callerName = profile.name; callerAvatar = profile.avatar_url ?? ''; }
    }
    const session: ActiveCallSession = {
      callId: launch.callId,
      conversationId: convId,
      type: launch.callType ?? 'audio',
      initiatorId: callerId,
      initiatorName: callerName || 'Un membre MokNet',
      initiatorAvatar: callerAvatar,
      receiverId: me.id,
      receiverName: me.name,
      receiverAvatar: me.avatarUrl,
      status: 'ringing',
      durationSeconds: 0,
      ringStartedAt: Date.now(),
      origin: 'push_launch',
    };
    if (launch.action === 'accept') acceptCall(session);
    else rejectCall(session);
  };

  // Les écouteurs (signaux Supabase, canal inter-onglets, service worker)
  // sont enregistrés dans des effets : ils passent par cette ref pour
  // toujours appeler la version COURANTE des actions.
  const callActionsRef = useRef({ closeHandledElsewhere, handlePushPayload, handlePushAction });
  callActionsRef.current = { closeHandledElsewhere, handlePushPayload, handlePushAction };

  // Canal inter-onglets (même navigateur) pour `call_handled_elsewhere` —
  // complément instantané du signal Supabase. Un seul objet par composant :
  // un message posté sur cet objet n'y revient jamais (pas d'auto-fermeture).
  useEffect(() => {
    if (!isLikelyRealId(currentUser?.id) || typeof BroadcastChannel === 'undefined') return;
    let channel: BroadcastChannel;
    try {
      channel = new BroadcastChannel('moknet-calls');
    } catch (err) {
      console.warn('[appel] canal inter-onglets indisponible — les autres onglets recevront le signal Supabase', err);
      return;
    }
    callsChannelRef.current = channel;
    channel.onmessage = (event: MessageEvent) => {
      const data = event.data;
      if (data && typeof data === 'object' && data.type === 'call_handled_elsewhere') {
        callActionsRef.current.closeHandledElsewhere(typeof data.callId === 'string' ? data.callId : null);
      }
    };
    return () => {
      if (callsChannelRef.current === channel) callsChannelRef.current = null;
      channel.close();
    };
  }, [currentUser?.id]);

  // Messages du service worker : push arrivé fenêtre ouverte, clic sur la notification.
  useEffect(() => {
    if (!isLikelyRealId(currentUser?.id)) return;
    return listenPushCallEvents({
      onIncoming: (payload) => callActionsRef.current.handlePushPayload(payload),
      onAction: (action, payload) => callActionsRef.current.handlePushAction(action, payload),
    });
  }, [currentUser?.id]);

  // Lancement par notification : lu UNE fois (l'URL est nettoyée à la
  // lecture), consommé dès que l'utilisateur est réel et que la conversation
  // est chargée — ou après un délai borné si elle ne l'est jamais.
  const pushLaunchRef = useRef<PushLaunch | null | undefined>(undefined);
  const [launchGraceOver, setLaunchGraceOver] = useState(false);
  useEffect(() => {
    if (pushLaunchRef.current === undefined) pushLaunchRef.current = readPushLaunchParams();
    if (!pushLaunchRef.current) return;
    const timer = setTimeout(() => setLaunchGraceOver(true), PUSH_LAUNCH_GRACE_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const launch = pushLaunchRef.current;
    if (!launch || !isLikelyRealId(currentUser?.id)) return;
    const convId = launch.conversationId && isLikelyRealId(launch.conversationId) ? launch.conversationId : null;
    const conv = convId ? conversations.find(c => c.id === convId) : undefined;
    if (convId && !conv && !launchGraceOver) return;
    pushLaunchRef.current = null; // consommé une seule fois
    void runPushLaunch(launch, conv);
    // runPushLaunch lit l'état courant via des refs ; seuls l'utilisateur, la liste et le délai déclenchent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id, conversations, launchGraceOver]);

  const handleStartCall = (type: 'audio' | 'video') => {
    if (!activeChat) return;

    // Équipe 7 (A1) : une conversation de repli locale (`chat-<memberId>`,
    // membre de démonstration ou création serveur échouée) n'existe pas dans
    // `conversation_participants` — la room `call-chat-...` ferait répondre
    // 403 à l'Edge Function livekit-token (cast uuid en erreur 22P02) et
    // AUCUN média ne passerait jamais : l'appel « sonnait » dans le vide.
    // Message honnête à la place d'une session d'appel condamnée d'avance.
    if (!isLikelyRealId(activeChat.id)) {
      alert("Les appels ne sont possibles qu'avec un membre réel de la plateforme (conversation synchronisée). Envoyez d'abord un message : dès que la conversation existe côté serveur, l'appel devient disponible.");
      return;
    }

    const callId = `call-${Date.now()}`;
    const newSession: ActiveCallSession = {
      callId,
      conversationId: activeChat.id,
      type,
      initiatorId: currentUser.id,
      initiatorName: currentUser.name,
      initiatorAvatar: currentUser.avatarUrl,
      receiverId: activeChat.participantId,
      receiverName: activeChat.participantName,
      receiverAvatar: activeChat.participantAvatar,
      status: 'ringing',
      durationSeconds: 0,
      offerSentAt: Date.now(),
      origin: 'broadcast',
    };

    setActiveCallSession(newSession);
    setIsIncomingCall(false);

    // Send WebRTC Signal via Supabase
    supabaseService.sendCallSignal(activeChat.participantId, {
      type: 'call_invitation',
      callId,
      conversationId: activeChat.id,
      callType: type,
      callerId: currentUser.id,
      callerName: currentUser.name,
      callerAvatar: currentUser.avatarUrl
    });

    // Mission VF-1 : en tâche de fond, le Web Push qui fait sonner le
    // téléphone de l'appelé même hors application (onglet fermé, écran
    // verrouillé) — le broadcast ci-dessus n'atteint que les onglets ouverts.
    // Sans appareil abonné (`no_subscription`), l'appel continue tel quel.
    void notifyCallPush({ topic: 'incoming_call', targetUserId: activeChat.participantId, conversationId: activeChat.id, callId, payload: { callType: type } });

    // Équipe I (LOOP I1) : l'ancien code passait en « connecté » après 2,5 s
    // QUE L'APPELÉ AIT DÉCROCHÉ OU NON — l'appelant voyait un appel en cours
    // face à personne (le faux succès à l'origine des « appels qui
    // échouent »). Désormais, seul le signal réel `call_accepted` connecte ;
    // sans réponse, le timeout ci-dessous met fin honnêtement.
  };

  // --- Block / Unblock User ---
  // LOOP 06/17 : l'ancienne version ne touchait qu'un état React local —
  // rechargée, la personne redevenait débloquée, et l'autre partie n'était
  // jamais réellement empêchée d'écrire (la RLS `messages_insert_if_participant`
  // corrigée ce LOOP vérifie `are_users_blocked` côté serveur, mais seule une
  // vraie ligne dans `user_blocks` — pas un state local — active cette
  // protection). Réutilise mot pour mot `blockUser`/`unblockUser` du LOOP
  // 04/17, jamais un second mécanisme de blocage propre à la messagerie.
  const handleToggleBlockUser = async (userId: string) => {
    const wasBlocked = blockedUserIds.includes(userId);
    if (wasBlocked) {
      setBlockedUserIds(prev => prev.filter(id => id !== userId));
    } else {
      setBlockedUserIds(prev => [...prev, userId]);
      if (activeChat?.participantId === userId) {
        setCurrentChatId(null);
      }
    }

    if (!supabaseService.isConfigured() || !isLikelyRealId(currentUser?.id) || !isLikelyRealId(userId)) return;
    try {
      if (wasBlocked) {
        await supabaseService.unblockUser(currentUser.id, userId);
      } else {
        await supabaseService.blockUser(currentUser.id, userId);
      }
    } catch (err) {
      console.warn('Erreur blocage/déblocage Supabase, annulation locale:', err);
      setBlockedUserIds(prev => wasBlocked ? [...prev, userId] : prev.filter(id => id !== userId));
    }
  };

  // --- Start Chat with a Directory Member ---
  // LOOP 06/17 : pour un vrai membre (id Supabase réel — venant soit de
  // l'Annuaire local MOCK_MEMBERS soit, désormais, du pont
  // pendingDirectChatMember relié au fil social), tente une vraie création/
  // récupération de conversation (`createDirectConversation`, idempotent via
  // `direct_key`) avant tout repli. Le repli local (membre de démonstration,
  // Supabase non configuré, ou échec réseau) ne fabrique plus jamais un faux
  // "message de bienvenue" au nom de l'autre personne — contrairement à
  // l'ancien code, qui inventait des propos qu'elle n'avait jamais tenus :
  // la conversation démarre simplement vide, comme une vraie conversation
  // neuve rechargée depuis le serveur.
  const handleStartDirectChat = async (member: MemberProfile) => {
    const existing = conversations.find(c => c.participantId === member.id);
    if (existing) {
      setCurrentChatId(existing.id);
      setActiveTab('all');
      setIsOpen(true);
      return;
    }

    if (supabaseService.isConfigured() && isLikelyRealId(member.id) && isLikelyRealId(currentUser?.id)) {
      try {
        const conversationId = await supabaseService.createDirectConversation(currentUser.id, member.id);
        if (conversationId) {
          const newConv: ChatConversation = {
            id: conversationId,
            participantId: member.id,
            participantName: member.name,
            participantAvatar: member.avatarUrl,
            participantTitle: member.title,
            participantCountry: member.location,
            lastMessage: '',
            lastMessageTime: '',
            unreadCount: 0,
            isOnline: true,
            messages: []
          };
          setConversations(prev => [newConv, ...prev]);
          setCurrentChatId(conversationId);
          setActiveTab('all');
          setIsOpen(true);
          return;
        }
      } catch (err: any) {
        // LOOP 07/17 : un refus de permission (`allowMessagesFrom` du
        // destinataire) est un résultat réel et attendu, pas un incident
        // réseau — jamais un repli silencieux vers une fausse conversation
        // locale qui ne pourrait de toute façon jamais délivrer un message
        // (l'ancien comportement aurait laissé croire à un envoi réussi).
        if (err?.code === 'MESSAGING_NOT_ALLOWED') {
          alert(`${member.name} limite qui peut lui écrire. Suivez cette personne, ou attendez qu'elle accepte votre demande d'ami, pour pouvoir lui envoyer un message.`);
          return;
        }
        console.warn('Erreur création conversation Supabase, repli local:', err);
      }
    }

    const newConv: ChatConversation = {
      id: `chat-${member.id}`,
      participantId: member.id,
      participantName: member.name,
      participantAvatar: member.avatarUrl,
      participantTitle: member.title,
      participantCountry: member.location,
      lastMessage: 'Conversation initialisée',
      lastMessageTime: 'À l\'instant',
      unreadCount: 0,
      isOnline: true,
      messages: []
    };
    setConversations(prev => [newConv, ...prev]);
    setCurrentChatId(newConv.id);
    setActiveTab('all');
    setIsOpen(true);
  };

  // Pont "Message"/"Mooc Chat" du fil social (SocialFeed.tsx) → cette
  // fenêtre flottante (LOOP 06/17). Avant ce changement, `onOpenDirectChat`
  // n'était fourni par aucun appelant (App.tsx rendait `<SocialFeed
  // onOpenLive={...} />` sans lui), donc ces boutons ne faisaient
  // strictement rien pour un vrai membre — aucun chemin UI n'existait pour
  // démarrer une PREMIÈRE conversation avec une vraie personne. Remonté
  // App.tsx → Layout.tsx → ici, même patron que isGoalModalOpen/
  // isSearchModalOpen déjà utilisé dans Layout.tsx pour le même besoin
  // (un enfant profond doit ouvrir un composant monté plus haut).
  useEffect(() => {
    if (pendingDirectChatMember) {
      handleStartDirectChat(pendingDirectChatMember);
      onConsumePendingDirectChatMember?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingDirectChatMember]);

  return (
    <>
      {/* Floating Action Button - Positioned above dock on mobile & bottom right on desktop */}
      {/* Module autonome : masqué — la fenêtre occupe tout l'écran, rien à basculer. */}
      {!standalone && (
      <div
        id="mooc-chat-floating-container"
        className="fixed bottom-24 md:bottom-6 right-4 sm:right-6 z-40 flex items-center justify-end"
      >
        <button
          id="mooc-chat-toggle-btn"
          type="button"
          aria-label="Ouvrir la messagerie sécurisée"
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-3.5 sm:p-4 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-105 active:scale-95 transition-all duration-300 flex items-center justify-center border-2 border-white/20"
        >
          <MessageCircle size={24} className="text-white" />
          
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.5 min-w-[20px] h-5 bg-rose-500 text-white text-[11px] font-extrabold rounded-full flex items-center justify-center border-2 border-white animate-pulse">
              {totalUnread}
            </span>
          )}

          {/* Tooltip on desktop */}
          <span className="absolute right-full mr-3 px-3 py-1.5 bg-slate-900 text-white text-xs font-bold rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg hidden md:block">
            Messagerie Souveraine LMAV
          </span>
        </button>
      </div>
      )}

      {/* Main Chat Window Panel */}
      {isOpen && (
        <div
          id="mooc-chat-window"
          className={standalone
            // Module autonome : plein écran sous la barre du module — sans bordure, ombre ni animation de fenêtre flottante.
            ? "fixed inset-x-0 bottom-0 top-[var(--moknet-module-topbar,0px)] bg-white z-[70] flex flex-col overflow-hidden"
            : "fixed inset-x-2 sm:inset-x-auto bottom-20 md:bottom-24 sm:right-6 w-auto sm:w-[420px] md:w-[460px] h-[78vh] sm:h-[620px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-[70] flex flex-col overflow-hidden animate-scale-up"}
        >
          
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
            {activeChat ? (
              /* En-tête de conversation (VF-8), extrait dans ConversationHeader :
                 le sélecteur « Ma langue » y est FIXE, à côté du nom du
                 correspondant, hors de la zone de messages qui défile. Les
                 boutons d'action restent ici, handlers inchangés. */
              <ConversationHeader
                peer={{
                  name: activeChat.participantName,
                  avatarUrl: activeChat.participantAvatar,
                  verified: true,
                  presence: (activeChat.isOnline || onlinePresences[activeChat.participantId]) ? 'online' : 'offline',
                  subtitle: activeChat.participantTitle || 'Membre vérifié',
                }}
                myLanguage={myLanguage}
                onLanguageChange={handleChangeMyLanguage}
                peerReadsIn={recipientLanguage && recipientLanguage !== myLanguage
                  ? (MESSAGING_LANGUAGES.find((l) => l.code === recipientLanguage)?.label || recipientLanguage)
                  : undefined}
                onBack={() => setCurrentChatId(null)}
                onOpenPeer={() => setShowMemberInfo(true)}
              >
                {/* Call buttons in active chat */}
                <button
                  onClick={handleSummarizeConversation}
                  disabled={isSummarizing}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors disabled:opacity-50"
                  title="Résumer cette conversation (IA)"
                >
                  {isSummarizing ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin block"></span>
                  ) : (
                    <Sparkles size={16} />
                  )}
                </button>

                <button
                  onClick={() => handleStartCall('audio')}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Appel Audio"
                >
                  <Phone size={16} />
                </button>

                <button
                  onClick={() => handleStartCall('video')}
                  className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-sm"
                  title="Appel Vidéo"
                >
                  <Video size={16} />
                </button>

                <button
                  onClick={() => setShowMemberInfo(true)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  title="Détails du profil"
                >
                  <Info size={16} />
                </button>
              </ConversationHeader>
            ) : (
              /* Global Directory / Conversations List Header — VF-7 : la photo
                 et le nom du PROPRIÉTAIRE du compte, pas seulement une icône.
                 Le statut n'est affiché qu'une fois la présence Realtime
                 synchronisée : rien n'est inventé hors connexion. */
              <div className="flex items-center justify-between w-full gap-2">
                <MessagingOwnerCard
                  name={currentUser.name}
                  avatarUrl={currentUser.avatarUrl}
                  presence={Object.keys(onlinePresences).length > 0
                    ? (onlinePresences[currentUser.id] ? 'online' : 'offline')
                    : undefined}
                />

                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Body Content */}
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50 overflow-hidden">
            
            {/* VIEW 1: CONVERSATIONS LIST & DIRECTORY */}
            {!activeChat ? (
              <div className="flex-1 flex flex-col min-h-0">
                
                {/* Search & Tabs */}
                <div className="p-3 bg-white border-b border-slate-200/80 space-y-2.5">
                  <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Rechercher une discussion, un membre..."
                      className="w-full pl-9 pr-4 py-2 bg-slate-100 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </div>

                  <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold text-slate-600">
                    <button
                      onClick={() => setActiveTab('all')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'all' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Tout ({conversations.length})
                    </button>
                    <button
                      onClick={() => setActiveTab('direct')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'direct' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Directs
                    </button>
                    <button
                      onClick={() => setActiveTab('groups')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'groups' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Groupes
                    </button>
                    <button
                      onClick={() => setActiveTab('members')}
                      className={`flex-1 py-1.5 rounded-lg transition-all ${activeTab === 'members' ? 'bg-white text-indigo-700 shadow-xs' : 'hover:text-slate-900'}`}
                    >
                      Annuaire ({MOCK_MEMBERS.length})
                    </button>
                  </div>
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {activeTab === 'members' ? (
                    /* Member Directory List */
                    filteredMembers.map(member => (
                      <div
                        key={member.id}
                        onClick={() => handleStartDirectChat(member)}
                        className="p-3.5 hover:bg-indigo-50/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <InitialsAvatar name={member.name} avatarUrl={member.avatarUrl} size={40} className="ring-2 ring-slate-200" />
                            {onlinePresences[member.id] && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 truncate flex items-center gap-1.5">
                              <span>{member.name}</span>
                              <Shield size={12} className="text-blue-600" />
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{member.title}</div>
                            <div className="text-[9px] text-indigo-600 font-semibold">{member.location}</div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-bold shadow-xs flex items-center gap-1"
                        >
                          <MessageCircle size={12} />
                          <span>Écrire</span>
                        </button>
                      </div>
                    ))
                  ) : (
                    /* Existing Conversations List */
                    filteredConversations.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <MessageCircle size={32} className="mx-auto text-slate-300" />
                        <p className="text-xs font-bold">Aucune discussion trouvée</p>
                        <p className="text-[11px] text-slate-400">Explorez l'annuaire pour lancer une nouvelle conversation.</p>
                      </div>
                    ) : (
                      filteredConversations.map(conv => (
                        <div
                          key={conv.id}
                          onClick={() => setCurrentChatId(conv.id)}
                          className="p-3.5 hover:bg-indigo-50/60 flex items-center justify-between gap-3 cursor-pointer transition-colors bg-white"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="relative">
                              <InitialsAvatar name={conv.participantName} avatarUrl={conv.participantAvatar} size={44} className="ring-2 ring-slate-100" />
                              {(conv.isOnline || onlinePresences[conv.participantId]) && (
                                <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white"></span>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <div className="font-extrabold text-xs text-slate-900 truncate">
                                  {conv.participantName}
                                </div>
                                <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                                  {conv.lastMessageTime}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                {conv.lastMessage}
                              </p>
                            </div>
                          </div>

                          {conv.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold flex items-center justify-center flex-shrink-0">
                              {conv.unreadCount}
                            </span>
                          )}
                        </div>
                      ))
                    )
                  )}
                </div>

              </div>
            ) : (
              /* VIEW 2: ACTIVE CONVERSATION MESSAGES & RICH INPUT */
              <div className="flex-1 flex flex-col min-h-0">
                
                {/* Messages Stream */}
                <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-2">
                  
                  {/* Access Notice Banner — LOOP 07/17 : ne revendique plus un
                      chiffrement de bout-en-bout qui n'existe pas (aucune
                      bibliothèque E2E, `content` stocké en clair) — règle
                      anti-fausse-promesse. Affirme uniquement ce qui est
                      réellement garanti par la RLS (is_conversation_member). */}
                  <div className="py-2 px-3 bg-indigo-50/70 border border-indigo-100/80 rounded-2xl text-center text-[10px] text-indigo-900 font-medium flex items-center justify-center gap-1.5 shadow-2xs">
                    <Shield size={13} className="text-indigo-600 flex-shrink-0" />
                    <span>Cette conversation n'est visible que par ses membres.</span>
                  </div>

                  {/* « Ma langue » ne vit plus ici (VF-8) : le sélecteur est
                      FIXE dans l'en-tête de conversation (ConversationHeader),
                      à côté du nom — il ne défile plus avec les messages. */}

                  {/* Conversation Summary Banner (LOOP 07/17) */}
                  {conversationSummary && (
                    <div className="py-2.5 px-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2 shadow-2xs">
                      <Sparkles size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-bold block mb-0.5">Résumé (IA) :</span>
                        <span>{conversationSummary}</span>
                      </div>
                      <button onClick={() => setConversationSummary(null)} className="text-amber-500 hover:text-amber-700 flex-shrink-0">
                        <X size={13} />
                      </button>
                    </div>
                  )}

                  {activeChat.messages.map(msg => (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isMe={msg.senderId === currentUser.id}
                      currentUserId={currentUser.id}
                      isGroup={activeChat.isGroup}
                      participantAvatar={activeChat.participantAvatar}
                      participantName={activeChat.participantName}
                      /* VF-7 : mon identité (photo réelle, sinon initiales) à droite de mes bulles. */
                      currentUserName={currentUser.name}
                      currentUserAvatar={currentUser.avatarUrl}
                      onReply={(targetMsg) => setReplyingTo(targetMsg)}
                      onReact={handleToggleReaction}
                      onReport={(targetMsg) => {
                        setReportTargetMessage(targetMsg);
                        setShowReportModal(true);
                      }}
                      onDelete={(msgId) => {
                        setConversations(prev => prev.map(c => c.id === currentChatId ? {
                          ...c,
                          messages: c.messages.filter(m => m.id !== msgId)
                        } : c));
                        supabaseService.deleteChatMessage(msgId).catch(() => {});
                      }}
                      playingAudioId={playingAudioId}
                      onToggleAudio={togglePlayAudio}
                      audioProgress={audioProgress}
                      onOpenImageLightbox={(imgUrl) => setLightboxImageUrl(imgUrl)}
                      /* Entrant ET sortant : un message reçu est rendu dans MA
                         langue, un message que j'envoie est rendu dans celle de
                         mon interlocuteur — je vois donc ce qu'il lit vraiment.
                         Quand les deux langues coïncident, le service renvoie
                         `unchanged` sans aucun appel réseau. */
                      autoTranslate={Boolean(targetLanguageForMessage({ myLanguage, recipientLanguage, isMine: msg.senderId === currentUser.id, isGroup: activeChat.isGroup }))}
                      translationTargetLanguage={targetLanguageForMessage({ myLanguage, recipientLanguage, isMine: msg.senderId === currentUser.id, isGroup: activeChat.isGroup })}
                      /* « Par défaut » : aucune cible → aucun bouton « Traduire »,
                         aucun appel réseau — le réglage n'a pas de rôle de traduction. */
                      onTranslate={targetLanguageForMessage({ myLanguage, recipientLanguage, isMine: msg.senderId === currentUser.id, isGroup: activeChat.isGroup })
                        ? (text) => translationService.translateText({
                          text,
                          sourceLanguage: msg.originalLanguage,
                          targetLanguage: targetLanguageForMessage({ myLanguage, recipientLanguage, isMine: msg.senderId === currentUser.id, isGroup: activeChat.isGroup })!,
                          context: 'messaging',
                        })
                        : undefined}
                      /* HL-2 : écouter la traduction d'un vocal dans MA langue — seulement si j'en ai choisi une. */
                      onSpeakTranslation={myLanguage ? speakTranslatedTranscript : undefined}
                    />
                  ))}
                  
                  {/* Équipe F1 (D10) : « en train d'écrire » — éphémère, jamais persisté. */}
                  {Object.keys(typingUsers).length > 0 && (
                    <div className="flex items-center gap-2 px-1 text-[11px] text-slate-500 animate-pulse">
                      <span className="flex gap-0.5">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                      </span>
                      <span className="italic">
                        {Object.keys(typingUsers).map(id => typingUsers[id].name).join(', ')} {Object.keys(typingUsers).length > 1 ? 'écrivent…' : 'est en train d\'écrire…'}
                      </span>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Replying Banner */}
                {replyingTo && (
                  <div className="px-4 py-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between text-xs text-indigo-900 animate-slide-up">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-bold">Réponse à {replyingTo.senderName || 'Membre'} :</span>
                      <span className="italic truncate text-indigo-700">{replyingTo.text || 'Média'}</span>
                    </div>
                    <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-indigo-100 rounded-full">
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Attached Files Preview */}
                {attachedFiles.length > 0 && (
                  <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex flex-wrap gap-2">
                    {attachedFiles.map((file, idx) => (
                      <div key={idx} className="px-3 py-1.5 bg-white rounded-xl border border-slate-200 flex items-center gap-2 text-xs">
                        <FileText size={14} className="text-indigo-600" />
                        <span className="font-bold text-slate-800 truncate max-w-[120px]">{file.name}</span>
                        <button 
                          onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <X size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Voice Recording In-Progress Banner */}
                {isRecordingVoice && (
                  <div className="px-4 py-3 bg-rose-50 border-t border-rose-200 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 text-rose-700 text-xs font-bold animate-pulse">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                        <span>Enregistrement audio... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                      </div>
                      {/* HL-2 : ce que le navigateur comprend, en direct — l'auteur voit sa transcription se former. */}
                      {(liveVoiceTranscript || voiceTranscriptPartsRef.current.length > 0) && (
                        <p className="text-[11px] text-slate-600 italic truncate" title={[...voiceTranscriptPartsRef.current, liveVoiceTranscript].join(' ')}>
                          {[...voiceTranscriptPartsRef.current.slice(-1), liveVoiceTranscript].filter(Boolean).join(' ')}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={cancelVoiceRecording}
                        className="px-3 py-1 bg-white text-rose-600 border border-rose-200 rounded-lg text-xs font-bold hover:bg-rose-100"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={stopVoiceRecording}
                        className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 shadow-xs"
                      >
                        Terminer & Prêt
                      </button>
                    </div>
                  </div>
                )}

                {/* Recorded Audio Ready to Send Banner */}
                {recordedAudioUrl && !isRecordingVoice && (
                  <div className="px-4 py-2.5 bg-indigo-50 border-t border-indigo-200 flex items-center justify-between gap-3">
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                        <Volume2 size={16} className="text-indigo-600" />
                        <span>Message vocal prêt ({recordingDuration}s)</span>
                      </div>
                      {/* HL-2 : transcription réelle jointe au vocal — l'interlocuteur la lira dans SA langue.
                          VF-4 : faite par le serveur quand le navigateur n'a rien produit — état visible, jamais bloquant. */}
                      <p className="text-[11px] text-indigo-800/80 italic truncate" title={recordedTranscript ?? voiceTranscriptionNote ?? undefined}>
                        {recordedTranscript
                          ? `« ${recordedTranscript} »`
                          : voiceTranscriptionPending
                            ? 'Transcription en cours…'
                            : (voiceTranscriptionNote ?? 'Aucune transcription disponible — le vocal part tel quel.')}
                      </p>
                    </div>
                    <button
                      onClick={() => { setRecordedAudioBlob(null); setRecordedAudioUrl(null); setRecordedTranscript(null); setRecordedTranscriptLanguage(undefined); resetVoiceTranscriptionState(); }}
                      className="p-1 hover:bg-indigo-100 text-slate-500 rounded-full flex-shrink-0"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-1.5 sm:gap-2">
                  
                  {/* Image Attachment Button */}
                  <button
                    type="button"
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Envoyer une photo / image"
                  >
                    <Image size={18} />
                  </button>
                  <input
                    ref={imageInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Video Attachment Button */}
                  <button
                    type="button"
                    onClick={() => videoInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Envoyer une vidéo"
                  >
                    <Video size={18} />
                  </button>
                  <input
                    ref={videoInputRef}
                    type="file"
                    multiple
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Document & File Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Ajouter un document ou fichier (.pdf, .doc, .zip)"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip,.xls,.xlsx,.ppt,.pptx"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  {/* Main Text Input */}
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => { setInputText(e.target.value); emitTypingSignal(e.target.value.length > 0); }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={isRecordingVoice ? 'Enregistrement en cours...' : 'Écrivez un message...'}
                    disabled={isRecordingVoice}
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 min-w-0"
                  />

                  {/* Rewrite Assist Button (LOOP 07/17) — corrige uniquement
                      le champ de saisie, n'envoie jamais rien elle-même. */}
                  {inputText.trim() && (
                    <button
                      type="button"
                      onClick={handleAssistRewrite}
                      disabled={isRewriting}
                      className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 flex-shrink-0"
                      title="Corriger l'orthographe et la clarté (IA) — ne change jamais le sens ni n'envoie le message"
                    >
                      {isRewriting ? (
                        <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin block"></span>
                      ) : (
                        <Wand2 size={17} />
                      )}
                    </button>
                  )}

                  {/* Voice Record Button or Send Button */}
                  {!inputText.trim() && attachedFiles.length === 0 && !recordedAudioBlob ? (
                    <button
                      type="button"
                      onClick={isRecordingVoice ? stopVoiceRecording : startVoiceRecording}
                      className={`p-2.5 rounded-2xl transition-all shadow-sm ${isRecordingVoice ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600'}`}
                      title={isRecordingVoice ? 'Arrêter l\'enregistrement' : 'Enregistrer un vocal'}
                    >
                      <Mic size={18} />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendMessage}
                      className="p-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                      title="Envoyer"
                    >
                      <Send size={18} />
                    </button>
                  )}

                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* Audio & Video Call Modal — les signaux vont TOUJOURS au
          correspondant de la session d'appel (callPeerId), jamais via
          `activeChat` qui peut être fermé ou pointer un autre membre
          (cause racine d'appels qui n'aboutissaient jamais — LOOP I1).
          Équipe 8 (loop 2) : rendu au niveau RACINE du composant,
          INCONDITIONNELLEMENT dès qu'une session d'appel existe — jamais
          derrière `isOpen` (le widget de chat peut rester fermé) ni derrière
          une conversation ouverte. MoocChatFloating étant monté en permanence
          par Layout, un appel entrant s'affiche donc au-dessus de TOUTE page
          de l'app (z-[210] dans ChatCallModal), photo et nom réels de
          l'appelant inclus, sans jamais devoir ouvrir la messagerie. */}
      {activeCallSession && (
        <ChatCallModal
          callSession={activeCallSession}
          localName={currentUser.name}
          myLanguage={myLanguage}
          isIncoming={isIncomingCall}
          onAcceptCall={() => acceptCall(activeCallSession)}
          onRejectCall={() => rejectCall(activeCallSession)}
          onEndCall={() => endCall(activeCallSession, isIncomingCall)}
        />
      )}

      {/* Mission VF-1 : message honnête d'une action de notification qui
          n'a plus d'objet (« Cet appel a expiré. ») — au-dessus de tout,
          effacé seul après 6 s. */}
      {callNotice && (
        <div role="status" className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[212] px-4 py-2.5 rounded-2xl bg-slate-900 text-white text-xs font-bold shadow-2xl border border-white/10 flex items-center gap-2">
          <PhoneOff size={14} className="text-rose-300" />
          <span>{callNotice}</span>
        </div>
      )}

      {/* Member Info & Security Modal */}
      {showMemberInfo && activeChat && (
        <ChatMemberInfoModal
          isOpen={showMemberInfo}
          onClose={() => setShowMemberInfo(false)}
          conversation={activeChat}
          onStartCall={(type) => {
            setShowMemberInfo(false);
            handleStartCall(type);
          }}
          onToggleMute={() => {
            setConversations(prev => prev.map(c => c.id === activeChat.id ? { ...c, isMuted: !c.isMuted } : c));
          }}
          onToggleBlock={() => handleToggleBlockUser(activeChat.participantId)}
          onOpenReport={() => {
            setShowMemberInfo(false);
            setReportTargetMessage(null);
            setShowReportModal(true);
          }}
          onViewFullProfile={onOpenMemberProfile ? () => {
            const mem = MOCK_MEMBERS.find(m => m.id === activeChat.participantId);
            if (mem && onOpenMemberProfile) onOpenMemberProfile(mem);
          } : undefined}
        />
      )}

      {/* Super-Admin Moderation Report Modal */}
      {showReportModal && activeChat && (
        <ChatReportModal
          isOpen={showReportModal}
          onClose={() => {
            setShowReportModal(false);
            setReportTargetMessage(null);
          }}
          targetMessage={reportTargetMessage}
          conversation={activeChat}
          currentUserId={currentUser.id}
          currentUserName={currentUser.name}
          onBlockUser={(uid) => handleToggleBlockUser(uid)}
        />
      )}

      {/* Full-Screen Image Lightbox */}
      {lightboxImageUrl && (
        <div 
          className="fixed inset-0 z-90 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setLightboxImageUrl(null)}
        >
          <button 
            onClick={() => setLightboxImageUrl(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={24} />
          </button>
          <img 
            src={lightboxImageUrl} 
            className="max-w-full max-h-[90vh] rounded-2xl object-contain shadow-2xl" 
            alt="Média en plein écran" 
          />
        </div>
      )}
    </>
  );
};
