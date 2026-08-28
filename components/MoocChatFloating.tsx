import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Send, Paperclip, Mic, MicOff, Image, Video, Phone, PhoneCall, 
  PhoneOff, Search, Users, User, FileText, Smile, Shield, Info, Volume2, 
  Sparkles, Pin, ShieldAlert, ArrowLeft, CheckCheck, UserPlus, MoreVertical,
  Maximize2, Minimize2, Eye
} from 'lucide-react';
import { ChatConversation, ChatMessage, MemberProfile, UserProfile, ActiveCallSession } from '../types';
import { USER_PROFILE } from '../constants';
import { supabaseService } from '../services/supabaseClient';
import { isUuid, mokChatService, newClientMessageId, type SendMessageInput } from '../services/mokChat';
import { ChatMessageItem } from './chat/ChatMessageItem';
import { ChatCallModal } from './chat/ChatCallModal';
import { ChatReportModal } from './chat/ChatReportModal';
import { ChatMemberInfoModal } from './chat/ChatMemberInfoModal';

interface MoocChatFloatingProps {
  currentUser?: UserProfile;
  activeConversationId?: string | null;
  onCloseDirect?: () => void;
  onOpenMemberProfile?: (member: MemberProfile) => void;
}

const STORAGE_KEY_CONVERSATIONS = 'lmav_chat_conversations_cache_v3';
const createMediaPreview = (file: Blob): string => URL.createObjectURL(file);
const revokeMediaPreview = (url?: string | null): void => {
  if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
};

interface PendingAttachment {
  file: File;
  name: string;
  size: string;
  type: 'image' | 'video' | 'audio' | 'document';
  previewUrl: string;
}

interface RetryPayload {
  input: SendMessageInput;
}

export const MoocChatFloating: React.FC<MoocChatFloatingProps> = ({
  currentUser = USER_PROFILE,
  activeConversationId = null,
  onCloseDirect,
  onOpenMemberProfile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [nextMessageCursor, setNextMessageCursor] = useState<string | null>(null);
  const [showGroupCreator, setShowGroupCreator] = useState(false);
  const [groupTitle, setGroupTitle] = useState('');
  const [groupMemberIds, setGroupMemberIds] = useState<string[]>([]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(activeConversationId || null);
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'members'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Replying state
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // Message input state
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<PendingAttachment[]>([]);
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
  const [blockedUserIds, setBlockedUserIds] = useState<string[]>([]);

  // Online presences mapped by user id
  const [onlinePresences, setOnlinePresences] = useState<Record<string, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimeoutRef = useRef<any>(null);
  const retryPayloadsRef = useRef<Map<string, RetryPayload>>(new Map());
  const previewUrlsRef = useRef<Set<string>>(new Set());
  const discardRecordingRef = useRef(false);

  useEffect(() => () => {
    previewUrlsRef.current.forEach(revokeMediaPreview);
    previewUrlsRef.current.clear();
    audioPlayerRef.current?.pause();
  }, []);

  // Synchronize localStorage cache
  useEffect(() => {
    try {
      if (currentUser.id) localStorage.setItem(`${STORAGE_KEY_CONVERSATIONS}:${currentUser.id}`, JSON.stringify(conversations));
    } catch {}
  }, [conversations, currentUser.id]);

  // Open modal if external activeConversationId changed
  useEffect(() => {
    if (activeConversationId && isUuid(activeConversationId)) {
      setCurrentChatId(activeConversationId);
      setIsOpen(true);
    } else if (activeConversationId) {
      setLoadError('Cette conversation n’est plus valide. Ouvrez-la depuis votre liste synchronisée.');
    }
  }, [activeConversationId]);

  // Chargement réel : le cache n'est qu'une vue hors-ligne, jamais une source mockée.
  useEffect(() => {
    if (!isUuid(currentUser?.id)) {
      setConversations([]);
      setMembers([]);
      setLoadError('Une session Supabase authentifiée est requise pour utiliser MokChat.');
      return;
    }
    let active = true;
    try {
      const cached = localStorage.getItem(`${STORAGE_KEY_CONVERSATIONS}:${currentUser.id}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) {
          setConversations(parsed.filter((conversation): conversation is ChatConversation =>
            isUuid(conversation?.id) && isUuid(conversation?.participantId)
          ));
        }
      }
    } catch {}

    const load = async () => {
      if (!supabaseService.isConfigured()) {
        setLoadError('Connexion réseau requise pour synchroniser MokChat.');
        return;
      }
      setIsLoading(true);
      setLoadError(null);
      try {
        const remoteConversations = await mokChatService.listConversations(currentUser.id);
        if (!active) return;
        setConversations(remoteConversations);

        // Les fonctions annexes (annuaire, présence, blocage) sont chargées
        // indépendamment : leur indisponibilité ne doit jamais casser le texte.
        const [membersResult, blockedResult] = await Promise.allSettled([
          mokChatService.searchMembers('', currentUser.id),
          mokChatService.listBlockedUserIds(currentUser.id),
        ]);
        if (!active) return;
        if (membersResult.status === 'fulfilled') setMembers(membersResult.value);
        if (blockedResult.status === 'fulfilled') {
          const blocked = blockedResult.value;
          setBlockedUserIds(Array.from(blocked));
          setConversations(previous => previous.map(conversation => ({
            ...conversation,
            isBlocked: !conversation.isGroup && blocked.has(conversation.participantId),
          })));
        }
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'MokChat est temporairement indisponible.');
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [currentUser?.id]);

  // Recherche serveur de l'annuaire, sans réintroduire les membres fictifs.
  useEffect(() => {
    if (!isUuid(currentUser?.id) || activeTab !== 'members' || !supabaseService.isConfigured()) return;
    const timer = window.setTimeout(async () => {
      try {
        setMembers(await mokChatService.searchMembers(searchQuery, currentUser.id));
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Recherche indisponible.');
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [activeTab, searchQuery, currentUser?.id]);

  // Présence persistée et Realtime.
  useEffect(() => {
    if (!isUuid(currentUser?.id) || !supabaseService.isConfigured()) return;
    const syncPresence = (status: 'online' | 'away' | 'offline') => {
      void mokChatService.setPresence(currentUser.id, status).catch(() => undefined);
    };
    syncPresence(document.visibilityState === 'visible' ? 'online' : 'away');
    const heartbeat = window.setInterval(() => {
      syncPresence(document.visibilityState === 'visible' ? 'online' : 'away');
    }, 45_000);
    const handleVisibility = () => syncPresence(document.visibilityState === 'visible' ? 'online' : 'away');
    document.addEventListener('visibilitychange', handleVisibility);
    const unsubPresence = mokChatService.subscribeToPresence((userId, status) => {
      setOnlinePresences(prev => ({ ...prev, [userId]: status === 'online' }));
    });

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
          receiverAvatar: currentUser.avatarUrl,
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
      window.clearInterval(heartbeat);
      document.removeEventListener('visibilitychange', handleVisibility);
      syncPresence('offline');
      unsubPresence();
      unsubCalls();
    };
  }, [currentUser?.id, currentUser?.name, currentUser?.avatarUrl]);

  // Historique paginé + mise à jour Realtime de la conversation active.
  useEffect(() => {
    if (!isUuid(currentChatId) || !supabaseService.isConfigured()) return;
    let active = true;
    let refreshTimer: number | undefined;
    const refresh = async () => {
      try {
        const page = await mokChatService.loadMessages(currentChatId);
        if (!active) return;
        setNextMessageCursor(page.nextCursor);
        setConversations(prev => prev.map(conversation => {
          if (conversation.id !== currentChatId) return conversation;
          const unsynced = conversation.messages.filter(message => ['pending', 'sending', 'failed'].includes(message.status || ''));
          const remoteClientIds = new Set(page.messages.map(message => message.clientId).filter(Boolean));
          return { ...conversation, unreadCount: 0, messages: [...page.messages, ...unsynced.filter(message => !remoteClientIds.has(message.clientId))] };
        }));
        await mokChatService.markConversationRead(currentChatId);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : 'Historique indisponible.');
      }
    };
    void refresh();
    const scheduleRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void refresh(), 120);
    };
    const unsubscribe = mokChatService.subscribeToConversation(currentChatId, {
      onInsert: scheduleRefresh,
      onUpdate: scheduleRefresh,
      onDelete: scheduleRefresh,
      onReaction: scheduleRefresh,
    });
    return () => {
      active = false;
      if (refreshTimer) window.clearTimeout(refreshTimer);
      unsubscribe();
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

  const handleLoadOlderMessages = async () => {
    if (!currentChatId || !nextMessageCursor) return;
    try {
      const page = await mokChatService.loadMessages(currentChatId, nextMessageCursor);
      setNextMessageCursor(page.nextCursor);
      setConversations(prev => prev.map(conversation => conversation.id === currentChatId ? {
        ...conversation,
        messages: [...page.messages, ...conversation.messages.filter(existing => !page.messages.some(older => older.id === existing.id))],
      } : conversation));
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Impossible de charger les messages précédents.');
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c => {
    const matchesSearch = c.participantName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'direct') return !c.isGroup;
    if (activeTab === 'groups') return !!c.isGroup;
    return true;
  });

  // Filter members directory
  const filteredMembers = members.filter(m =>
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
        if (discardRecordingRef.current) {
          discardRecordingRef.current = false;
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        const audioUrl = createMediaPreview(audioBlob);
        previewUrlsRef.current.add(audioUrl);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
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
      discardRecordingRef.current = true;
      mediaRecorderRef.current.stop();
      setIsRecordingVoice(false);
      clearInterval(recordingTimerRef.current);
      setRecordedAudioBlob(null);
      if (recordedAudioUrl) {
        revokeMediaPreview(recordedAudioUrl);
        previewUrlsRef.current.delete(recordedAudioUrl);
      }
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
    const file = files.item(0);
    if (!file) return;
    const isImg = file.type.startsWith('image/');
    const isVid = file.type.startsWith('video/');
    const isAud = file.type.startsWith('audio/');

    const fileType = isImg ? 'image' : isVid ? 'video' : isAud ? 'audio' : 'document';
    const previewUrl = createMediaPreview(file);
    previewUrlsRef.current.add(previewUrl);
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;

    setAttachedFiles(prev => [...prev, {
      name: file.name,
      size: sizeStr,
      type: fileType,
      file,
      previewUrl,
    }]);
    e.target.value = '';
  };

  const updateOptimisticMessage = (temporaryId: string, updates: Partial<ChatMessage>, conversationId = currentChatId) => {
    setConversations(prev => prev.map(conversation => conversation.id === conversationId ? {
      ...conversation,
      messages: conversation.messages.map(message => message.id === temporaryId ? { ...message, ...updates } : message),
    } : conversation));
  };

  const transmitMessage = async (temporaryId: string, payload: RetryPayload) => {
    updateOptimisticMessage(temporaryId, { status: 'sending' }, payload.input.conversationId);
    try {
      const saved = await mokChatService.sendMessage(payload.input);
      setConversations(prev => prev.map(conversation => conversation.id === payload.input.conversationId ? {
        ...conversation,
        messages: conversation.messages.map(message => message.id === temporaryId ? {
          ...message,
          ...saved,
          senderName: currentUser.name,
          senderAvatar: currentUser.avatarUrl,
          senderRole: currentUser.role,
          status: 'sent',
        } : message),
      } : conversation));
      const previousUrl = conversations.flatMap(conversation => conversation.messages).find(message => message.id === temporaryId)?.mediaUrl;
      if (previousUrl?.startsWith('blob:')) {
        revokeMediaPreview(previousUrl);
        previewUrlsRef.current.delete(previousUrl);
      }
      retryPayloadsRef.current.delete(temporaryId);
      setLoadError(null);
    } catch (error) {
      retryPayloadsRef.current.set(temporaryId, payload);
      updateOptimisticMessage(temporaryId, { status: 'failed' }, payload.input.conversationId);
      setLoadError(error instanceof Error ? error.message : 'Échec de l’envoi. Réessayez.');
    }
  };

  // --- Send Message ---
  const handleSendMessage = async () => {
    if (!currentChatId) return;
    if (activeChat?.isBlocked || blockedUserIds.includes(activeChat?.participantId || '')) {
      setLoadError('Débloquez ce membre avant d’envoyer un message.');
      return;
    }
    if (!inputText.trim()) {
      if (attachedFiles.length > 0 || recordedAudioBlob) {
        setLoadError('Les pièces jointes et messages vocaux ne sont pas activés dans ce lot. Ajoutez du texte pour envoyer le message.');
      }
      return;
    }

    const clientId = newClientMessageId();
    const messageId = `pending-${clientId}`;
    const now = new Date();

    const newMessage: ChatMessage = {
      id: messageId,
      clientId,
      conversationId: currentChatId,
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      senderRole: currentUser.role || 'citizen',
      text: inputText.trim() || undefined,
      mediaType: 'text',
      timestamp: now,
      isRead: true,
      status: 'pending',
      replyTo: replyingTo ? {
        id: replyingTo.id,
        text: replyingTo.text,
        senderName: replyingTo.senderName,
        mediaType: replyingTo.mediaType
      } : undefined
    };

    // Optimistic Update
    setConversations(prev => prev.map(c => {
      if (c.id === currentChatId) {
        return {
          ...c,
          lastMessage: newMessage.text || 'Nouveau message',
          lastMessageTime: 'À l\'instant',
          messages: [...c.messages, newMessage]
        };
      }
      return c;
    }));

    const payload: RetryPayload = {
      input: {
        conversationId: currentChatId,
        senderId: currentUser.id,
        clientId,
        content: newMessage.text,
        replyToId: replyingTo?.id,
      },
    };
    retryPayloadsRef.current.set(messageId, payload);

    // Les aperçus locaux ne sont jamais persistés ni envoyés dans ce lot.
    attachedFiles.forEach(file => {
      revokeMediaPreview(file.previewUrl);
      previewUrlsRef.current.delete(file.previewUrl);
    });
    if (recordedAudioUrl) {
      revokeMediaPreview(recordedAudioUrl);
      previewUrlsRef.current.delete(recordedAudioUrl);
    }
    setInputText('');
    setAttachedFiles([]);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setReplyingTo(null);

    await transmitMessage(messageId, payload);
  };

  const handleRetryMessage = (messageId: string) => {
    const payload = retryPayloadsRef.current.get(messageId);
    if (payload) void transmitMessage(messageId, payload);
  };

  // --- Reactions Handler ---
  const handleToggleReaction = (messageId: string, emoji: string) => {
    if (!currentChatId) return;

    setConversations(prev => prev.map(c => {
      if (c.id === currentChatId) {
        const updatedMessages = c.messages.map(m => {
          if (m.id === messageId) {
            const reactions = { ...(m.reactions || {}) };
            const users = reactions[emoji] || [];
            const userIdx = users.indexOf(currentUser.id);

            if (userIdx > -1) {
              reactions[emoji] = users.filter(u => u !== currentUser.id);
              if (reactions[emoji].length === 0) delete reactions[emoji];
            } else {
              reactions[emoji] = [...users, currentUser.id];
            }

            void mokChatService.toggleReaction(messageId, currentUser.id, emoji, userIdx === -1).catch((error) => {
              setLoadError(error instanceof Error ? error.message : 'Réaction non synchronisée.');
            });

            return { ...m, reactions };
          }
          return m;
        });
        return { ...c, messages: updatedMessages };
      }
      return c;
    }));
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
      initiatorAvatar: currentUser.avatarUrl,
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
      callerAvatar: currentUser.avatarUrl
    });

    // Auto-connect after 2.5s for seamless interactive experience
    setTimeout(() => {
      setActiveCallSession(prev => prev?.callId === callId ? { ...prev, status: 'connected' } : prev);
    }, 2500);
  };

  // --- Block / Unblock User ---
  const handleToggleBlockUser = async (userId: string) => {
    const shouldBlock = !blockedUserIds.includes(userId);
    const previous = blockedUserIds;
    setBlockedUserIds(prev => shouldBlock ? [...prev, userId] : prev.filter(id => id !== userId));
    setConversations(prev => prev.map(conversation => conversation.participantId === userId ? { ...conversation, isBlocked: shouldBlock } : conversation));
    try {
      await mokChatService.setBlocked(currentUser.id, userId, shouldBlock);
      if (shouldBlock) {
        setMembers(prev => prev.filter(member => member.id !== userId));
      } else {
        setMembers(await mokChatService.searchMembers(searchQuery, currentUser.id));
      }
    } catch (error) {
      setBlockedUserIds(previous);
      setConversations(prev => prev.map(conversation => conversation.participantId === userId ? { ...conversation, isBlocked: !shouldBlock } : conversation));
      setLoadError(error instanceof Error ? error.message : 'Blocage non synchronisé.');
    }
  };

  // --- Start Chat with a Directory Member ---
  const handleStartDirectChat = async (member: MemberProfile) => {
    const existing = conversations.find(c => c.participantId === member.id);
    if (existing) {
      setCurrentChatId(existing.id);
      setActiveTab('all');
    } else {
      setIsLoading(true);
      try {
        const conversationId = await mokChatService.createConversation(currentUser.id, [member.id]);
        const newConversation: ChatConversation = {
          id: conversationId,
          participantId: member.id,
          participantName: member.name,
          participantAvatar: member.avatarUrl,
          participantTitle: member.title,
          participantCountry: member.country,
          lastMessage: 'Nouvelle conversation',
          lastMessageTime: new Date().toISOString(),
          unreadCount: 0,
          isOnline: Boolean(member.isOnline),
          messages: [],
        };
        setConversations(prev => prev.some(conversation => conversation.id === conversationId) ? prev : [newConversation, ...prev]);
        setCurrentChatId(conversationId);
        setActiveTab('all');
        setLoadError(null);
      } catch (error) {
        setLoadError(error instanceof Error ? error.message : 'Impossible de créer la conversation.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!groupTitle.trim() || groupMemberIds.length < 2) {
      setLoadError('Donnez un nom au groupe et sélectionnez au moins deux membres.');
      return;
    }
    setIsLoading(true);
    try {
      const conversationId = await mokChatService.createConversation(currentUser.id, groupMemberIds, groupTitle);
      const selectedMembers = members.filter(member => groupMemberIds.includes(member.id));
      const conversation: ChatConversation = {
        id: conversationId,
        participantId: selectedMembers[0]?.id || currentUser.id,
        participantName: groupTitle.trim(),
        participantAvatar: selectedMembers[0]?.avatarUrl || currentUser.avatarUrl,
        participantTitle: `${selectedMembers.length + 1} membres`,
        isGroup: true,
        groupMembersCount: selectedMembers.length + 1,
        groupMembers: selectedMembers.map(member => ({ id: member.id, name: member.name, avatar: member.avatarUrl })),
        lastMessage: 'Groupe créé',
        lastMessageTime: new Date().toISOString(),
        unreadCount: 0,
        isOnline: false,
        messages: [],
      };
      setConversations(prev => [conversation, ...prev]);
      setCurrentChatId(conversationId);
      setShowGroupCreator(false);
      setGroupMemberIds([]);
      setGroupTitle('');
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Impossible de créer le groupe.');
    } finally {
      setIsLoading(false);
    }
  };

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
                      {activeChat.isOnline || onlinePresences[activeChat.participantId] ? 'En ligne' : (activeChat.participantTitle || 'Membre Mok')}
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
                    <p className="text-[10px] text-slate-400">Accès privé contrôlé par votre session</p>
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
                      Annuaire ({members.length})
                    </button>
                  </div>

                  {loadError && (
                    <div role="alert" className="flex items-start justify-between gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
                      <span>{loadError}</span>
                      <button type="button" aria-label="Fermer l’alerte" onClick={() => setLoadError(null)}><X size={13} /></button>
                    </div>
                  )}

                  {activeTab === 'groups' && (
                    <button
                      type="button"
                      onClick={() => setShowGroupCreator(value => !value)}
                      className="w-full rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-2 text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                    >
                      {showGroupCreator ? 'Fermer la création' : 'Créer un groupe'}
                    </button>
                  )}

                  {activeTab === 'groups' && showGroupCreator && (
                    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Nom du groupe
                        <input
                          value={groupTitle}
                          onChange={(event) => setGroupTitle(event.target.value)}
                          maxLength={80}
                          className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                      </label>
                      <fieldset className="max-h-28 overflow-y-auto" aria-label="Membres du groupe">
                        {members.map(member => (
                          <label key={member.id} className="flex items-center gap-2 py-1 text-[11px] text-slate-700">
                            <input
                              type="checkbox"
                              checked={groupMemberIds.includes(member.id)}
                              onChange={() => setGroupMemberIds(prev => prev.includes(member.id) ? prev.filter(id => id !== member.id) : [...prev, member.id])}
                            />
                            <span>{member.name}</span>
                          </label>
                        ))}
                      </fieldset>
                      <button
                        type="button"
                        disabled={isLoading || !groupTitle.trim() || groupMemberIds.length < 2}
                        onClick={() => void handleCreateGroup()}
                        className="w-full rounded-xl bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-40"
                      >
                        Créer avec {groupMemberIds.length} membres
                      </button>
                    </div>
                  )}
                </div>

                {/* List Items */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                  {activeTab === 'members' ? (
                    /* Member Directory List */
                    isLoading ? (
                      <div role="status" className="p-8 text-center text-xs text-slate-500">Chargement de l’annuaire…</div>
                    ) : filteredMembers.length === 0 ? (
                      <div className="p-8 text-center text-slate-500 space-y-2">
                        <Users size={32} className="mx-auto text-slate-300" />
                        <p className="text-xs font-bold">Aucun membre visible</p>
                        <p className="text-[11px] text-slate-400">Essayez une autre recherche ou vérifiez votre connexion.</p>
                      </div>
                    ) : filteredMembers.map(member => (
                      <div
                        key={member.id}
                        onClick={() => handleStartDirectChat(member)}
                        className="p-3.5 hover:bg-indigo-50/50 flex items-center justify-between gap-3 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative">
                            <img src={member.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-200" />
                            {member.isOnline && (
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white"></span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-extrabold text-xs text-slate-900 truncate flex items-center gap-1.5">
                              <span>{member.name}</span>
                              {member.isVerified && <Shield size={12} className="text-blue-600" aria-label="Profil vérifié" />}
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
                              <img src={conv.participantAvatar} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100" />
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
                                {conv.isBlocked ? 'Membre bloqué — ouvrez les informations pour débloquer' : conv.lastMessage}
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

                  {nextMessageCursor && (
                    <button
                      type="button"
                      onClick={() => void handleLoadOlderMessages()}
                      className="mx-auto block rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Charger les messages précédents
                    </button>
                  )}
                  
                  {/* Access control notice */}
                  <div className="py-2 px-3 bg-indigo-50/70 border border-indigo-100/80 rounded-2xl text-center text-[10px] text-indigo-900 font-medium flex items-center justify-center gap-1.5 shadow-2xs">
                    <Shield size={13} className="text-indigo-600 flex-shrink-0" />
                    <span>Conversation privée protégée par authentification et règles d’accès Supabase.</span>
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
                        void mokChatService.deleteMessage(msgId).then(() => {
                          setConversations(prev => prev.map(c => c.id === currentChatId ? {
                            ...c,
                            messages: c.messages.filter(m => m.id !== msgId)
                          } : c));
                        }).catch((error) => setLoadError(error instanceof Error ? error.message : 'Suppression impossible.'));
                      }}
                      onPin={(msgId) => {
                        const target = activeChat.messages.find(message => message.id === msgId);
                        if (!target) return;
                        const nextPinned = !target.isPinned;
                        updateOptimisticMessage(msgId, { isPinned: nextPinned }, activeChat.id);
                        void mokChatService.setPinned(msgId, nextPinned).catch((error) => {
                          updateOptimisticMessage(msgId, { isPinned: target.isPinned }, activeChat.id);
                          setLoadError(error instanceof Error ? error.message : 'Épinglage impossible.');
                        });
                      }}
                      onRetry={handleRetryMessage}
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
                          onClick={() => {
                            revokeMediaPreview(file.previewUrl);
                            previewUrlsRef.current.delete(file.previewUrl);
                            setAttachedFiles(prev => prev.filter((_, i) => i !== idx));
                          }}
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
                      onClick={() => {
                        revokeMediaPreview(recordedAudioUrl);
                        previewUrlsRef.current.delete(recordedAudioUrl);
                        setRecordedAudioBlob(null);
                        setRecordedAudioUrl(null);
                      }}
                      className="p-1 hover:bg-indigo-100 text-slate-500 rounded-full"
                    >
                      <X size={14} />
                    </button>
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
                  
                  {/* File Attachment Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-2xl transition-colors"
                    title="Ajouter un fichier, une photo ou une vidéo"
                  >
                    <Paperclip size={18} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.zip"
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
                    className="flex-1 px-4 py-2.5 bg-slate-100 rounded-2xl text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
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
          conversation={{ ...activeChat, isBlocked: blockedUserIds.includes(activeChat.participantId) }}
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
            const mem = members.find(m => m.id === activeChat.participantId);
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
