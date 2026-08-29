import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Send, Paperclip, Mic, MicOff, Image, Video, Phone, PhoneCall, 
  PhoneOff, Search, Users, User, FileText, Smile, Shield, Info, Volume2, 
  Sparkles, Pin, ShieldAlert, ArrowLeft, CheckCheck, UserPlus, MoreVertical,
  Maximize2, Minimize2, Eye
} from 'lucide-react';
import { ChatConversation, ChatMessage, MemberProfile, UserProfile, ActiveCallSession } from '../types';
import { MOCK_CHATS, MOCK_MEMBERS, USER_PROFILE } from '../constants';
import { supabaseService } from '../services/supabaseClient';
import { adminConfigService } from '../services/adminConfigService';
import { ChatMessageItem } from './chat/ChatMessageItem';
import { ChatCallModal } from './chat/ChatCallModal';
import { ChatReportModal } from './chat/ChatReportModal';
import { ChatMemberInfoModal } from './chat/ChatMemberInfoModal';

interface MoocChatFloatingProps {
  currentUser?: UserProfile;
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
}

const STORAGE_KEY_CONVERSATIONS = 'lmav_chat_conversations_cache';

export const MoocChatFloating: React.FC<MoocChatFloatingProps> = ({
  currentUser = USER_PROFILE,
  activeConversationId = null,
  onCloseDirect,
  onOpenMemberProfile,
  pendingDirectChatMember,
  onConsumePendingDirectChatMember
}) => {
  const [isOpen, setIsOpen] = useState(false);
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
  
  // Voice Recording state
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordedAudioBlob, setRecordedAudioBlob] = useState<Blob | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

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
              unreadCount: 0,
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
      { id: currentUser.id, name: currentUser.name, avatarUrl: currentUser.avatar },
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
      if (signal.type === 'call_invitation') {
        setActiveCallSession({
          callId: signal.callId,
          conversationId: signal.conversationId,
          type: signal.callType || 'video',
          initiatorId: signal.callerId,
          initiatorName: signal.callerName,
          initiatorAvatar: signal.callerAvatar,
          receiverId: currentUser.id,
          receiverName: currentUser.name,
          receiverAvatar: currentUser.avatar,
          status: 'ringing',
          durationSeconds: 0
        });
        setIsIncomingCall(true);
      } else if (signal.type === 'call_accepted') {
        setActiveCallSession(prev => prev ? { ...prev, status: 'connected' } : null);
        setIsIncomingCall(false);
      } else if (signal.type === 'call_ended' || signal.type === 'call_rejected') {
        setActiveCallSession(null);
        setIsIncomingCall(false);
      }
    });

    return () => {
      unsubPresence();
      unsubCalls();
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.avatar]);

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
    return {
      id: raw.id,
      conversationId,
      senderId: raw.sender_id,
      senderName: raw.sender_id === currentUser.id ? currentUser.name : (senderProfile?.name || 'Membre'),
      senderAvatar: raw.sender_id === currentUser.id ? currentUser.avatar : senderProfile?.avatarUrl,
      senderRole: raw.sender_id === currentUser.id ? currentUser.role : senderProfile?.role,
      text: isDeleted ? undefined : (raw.content || undefined),
      mediaType: isDeleted ? undefined : (raw.attachment_url ? (raw.message_type || 'document') : 'text'),
      mediaUrl: isDeleted ? undefined : raw.attachment_url,
      timestamp: raw.created_at ? new Date(raw.created_at) : new Date(),
      isRead: false, // dérivé plus bas depuis last_read_at de l'autre participant, jamais un flag par message inventé.
      status: (raw.status as ChatMessage['status']) || 'sent', // valeur réelle renvoyée par la base, jamais fabriquée côté client.
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

    return () => {
      cancelled = true;
      unsubChat();
    };
  }, [currentChatId, currentUser.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (currentChatId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [conversations, currentChatId]);

  // Total unread count
  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);
  const activeChat = conversations.find(c => c.id === currentChatId);

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
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setRecordedAudioUrl(reader.result);
          }
        };
        reader.readAsDataURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecordingVoice(true);
      setRecordingDuration(0);

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
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      clearInterval(recordingTimerRef.current);
      setRecordedAudioBlob(null);
      setRecordedAudioUrl(null);
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

        audio.play().catch(() => {
          setPlayingAudioId(null);
        });
      }
    }
  };

  // --- File Upload Handler ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
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
  // Les membres de l'Annuaire local (MOCK_MEMBERS, id 'u1'/'u2'/...) ne sont
  // jamais de vrais comptes Supabase — tenter un appel réel avec un tel id
  // échouerait de toute façon (colonne uuid) ; ce garde évite un aller-retour
  // réseau inutile et garde le repli local explicite plutôt qu'implicite.
  const isLikelyRealId = (id?: string): id is string => !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  const handleSendMessage = async () => {
    if (!currentChatId || (!inputText.trim() && attachedFiles.length === 0 && !recordedAudioBlob)) return;

    const currentReplyTo = replyingTo;
    const filesToSend = [...attachedFiles];
    const textToSend = inputText.trim();
    const currentAudioUrl = recordedAudioUrl;
    const currentAudioDuration = recordingDuration || 5;
    const canSync = supabaseService.isConfigured() && isRealConversationId(currentChatId);

    setInputText('');
    setAttachedFiles([]);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setReplyingTo(null);

    type PendingSend = { msg: ChatMessage; clientMessageId: string; messageType: 'text' | 'image' | 'video' | 'audio' | 'document'; content?: string; attachmentUrl?: string };
    const pending: PendingSend[] = [];
    const makeReplyTo = () => currentReplyTo ? { id: currentReplyTo.id, text: currentReplyTo.text, senderName: currentReplyTo.senderName, mediaType: currentReplyTo.mediaType } : undefined;
    const baseMsg = (clientMessageId: string): Omit<ChatMessage, 'text' | 'mediaType' | 'mediaUrl' | 'fileName' | 'fileSize' | 'audioDuration'> => ({
      id: clientMessageId,
      conversationId: currentChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatar,
      senderRole: currentUser.role || 'citizen',
      timestamp: new Date(),
      isRead: false,
      status: 'sending',
      replyTo: makeReplyTo(),
    });

    if (currentAudioUrl) {
      const clientMessageId = crypto.randomUUID();
      pending.push({
        msg: { ...baseMsg(clientMessageId), text: textToSend || undefined, mediaType: 'audio', mediaUrl: currentAudioUrl, audioDuration: currentAudioDuration },
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
          attachmentUrl: p.attachmentUrl,
          messageType: p.messageType,
          replyToId: currentReplyTo && isRealConversationId(currentReplyTo.id) ? undefined : undefined,
        });
        if (sent) {
          setConversations(prev => prev.map(c => c.id === currentChatId ? {
            ...c,
            messages: c.messages.map(m => m.id === p.clientMessageId ? { ...m, id: sent.id, status: sent.status as ChatMessage['status'] } : m)
          } : c));
        }
      } catch (err) {
        console.warn('Erreur envoi message Supabase:', err);
        setConversations(prev => prev.map(c => c.id === currentChatId ? {
          ...c,
          messages: c.messages.map(m => m.id === p.clientMessageId ? { ...m, status: undefined } : m)
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

  // --- Start Call ---
  const handleStartCall = (type: 'audio' | 'video') => {
    if (!activeChat) return;

    const callId = `call-${Date.now()}`;
    const newSession: ActiveCallSession = {
      callId,
      conversationId: activeChat.id,
      type,
      initiatorId: currentUser.id,
      initiatorName: currentUser.name,
      initiatorAvatar: currentUser.avatar,
      receiverId: activeChat.participantId,
      receiverName: activeChat.participantName,
      receiverAvatar: activeChat.participantAvatar,
      status: 'ringing',
      durationSeconds: 0
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
      callerAvatar: currentUser.avatar
    });

    // Auto-connect after 2.5s for seamless interactive experience
    setTimeout(() => {
      setActiveCallSession(prev => prev?.callId === callId ? { ...prev, status: 'connected' } : prev);
    }, 2500);
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
      } catch (err) {
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

      {/* Main Chat Window Panel */}
      {isOpen && (
        <div 
          id="mooc-chat-window"
          className="fixed inset-x-2 sm:inset-x-auto bottom-20 md:bottom-24 sm:right-6 w-auto sm:w-[420px] md:w-[460px] h-[78vh] sm:h-[620px] bg-white rounded-3xl shadow-2xl border border-slate-200/90 z-50 flex flex-col overflow-hidden animate-scale-up"
        >
          
          {/* Header */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between border-b border-white/10 flex-shrink-0">
            {activeChat ? (
              /* Active Chat Header with participant info & call actions */
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button 
                  onClick={() => setCurrentChatId(null)}
                  className="p-1.5 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
                  title="Retour à la liste"
                >
                  <ArrowLeft size={18} />
                </button>

                <div 
                  className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 flex-1"
                  onClick={() => setShowMemberInfo(true)}
                >
                  <div className="relative flex-shrink-0">
                    <img 
                      src={activeChat.participantAvatar} 
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-indigo-400" 
                      alt={activeChat.participantName} 
                    />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-slate-900 ${activeChat.isOnline || onlinePresences[activeChat.participantId] ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                  </div>

                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-white truncate flex items-center gap-1.5">
                      <span>{activeChat.participantName}</span>
                      <Shield size={12} className="text-blue-400" />
                    </div>
                    <div className="text-[10px] text-slate-300 truncate">
                      {activeChat.isOnline || onlinePresences[activeChat.participantId] ? 'En ligne' : (activeChat.participantTitle || 'Membre vérifié')}
                    </div>
                  </div>
                </div>

                {/* Call buttons in active chat */}
                <div className="flex items-center gap-1">
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
                </div>
              </div>
            ) : (
              /* Global Directory / Conversations List Header */
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 rounded-xl">
                    <MessageCircle size={18} className="text-white" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-white flex items-center gap-1.5">
                      <span>Messagerie Privée</span>
                      <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[9px] font-mono">
                        Realtime
                      </span>
                    </h3>
                    <p className="text-[10px] text-slate-400">Échanges chiffrés de bout-en-bout</p>
                  </div>
                </div>

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
                            <img src={member.avatar} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200" />
                            {member.isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 truncate flex items-center gap-1.5">
                              <span>{member.name}</span>
                              <Shield size={12} className="text-blue-600" />
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">{member.title}</div>
                            <div className="text-[9px] text-indigo-600 font-semibold">{member.country}</div>
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
                              <img src={conv.participantAvatar} className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100" />
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
                  
                  {/* Encryption Notice Banner */}
                  <div className="py-2 px-3 bg-indigo-50/70 border border-indigo-100/80 rounded-2xl text-center text-[10px] text-indigo-900 font-medium flex items-center justify-center gap-1.5 shadow-2xs">
                    <Shield size={13} className="text-indigo-600 flex-shrink-0" />
                    <span>Les messages et appels sont chiffrés de bout-en-bout. Personne d'autre ne peut les lire.</span>
                  </div>

                  {activeChat.messages.map(msg => (
                    <ChatMessageItem
                      key={msg.id}
                      message={msg}
                      isMe={msg.senderId === currentUser.id}
                      isGroup={activeChat.isGroup}
                      participantAvatar={activeChat.participantAvatar}
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
                    />
                  ))}
                  
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
                  <div className="px-4 py-3 bg-rose-50 border-t border-rose-200 flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping"></span>
                      <span>Enregistrement audio... {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                  <div className="px-4 py-2.5 bg-indigo-50 border-t border-indigo-200 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-indigo-900 text-xs font-bold">
                      <Volume2 size={16} className="text-indigo-600" />
                      <span>Message vocal prêt ({recordingDuration}s)</span>
                    </div>
                    <button
                      onClick={() => { setRecordedAudioBlob(null); setRecordedAudioUrl(null); }}
                      className="p-1 hover:bg-indigo-100 text-slate-500 rounded-full"
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
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    placeholder={isRecordingVoice ? 'Enregistrement en cours...' : 'Écrivez un message sécurisé...'}
                    disabled={isRecordingVoice}
                    className="flex-1 px-3.5 py-2.5 bg-slate-100 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50 min-w-0"
                  />

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

      {/* Audio & Video Call Modal */}
      {activeCallSession && (
        <ChatCallModal
          callSession={activeCallSession}
          isIncoming={isIncomingCall}
          onAcceptCall={() => {
            setActiveCallSession(prev => prev ? { ...prev, status: 'connected' } : null);
            setIsIncomingCall(false);
            if (activeChat) {
              supabaseService.sendCallSignal(activeChat.participantId, {
                type: 'call_accepted',
                callId: activeCallSession.callId
              });
            }
          }}
          onRejectCall={() => {
            if (activeChat) {
              supabaseService.sendCallSignal(activeChat.participantId, {
                type: 'call_rejected',
                callId: activeCallSession.callId
              });
            }
            setActiveCallSession(null);
            setIsIncomingCall(false);
          }}
          onEndCall={() => {
            if (activeChat) {
              supabaseService.sendCallSignal(activeChat.participantId, {
                type: 'call_ended',
                callId: activeCallSession.callId
              });
            }
            setActiveCallSession(null);
            setIsIncomingCall(false);
          }}
        />
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
