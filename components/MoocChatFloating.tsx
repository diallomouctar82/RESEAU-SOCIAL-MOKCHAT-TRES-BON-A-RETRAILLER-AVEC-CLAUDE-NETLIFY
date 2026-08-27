import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, X, Send, Paperclip, Mic, MicOff, Image, Video, Phone, PhoneCall, 
  PhoneOff, Monitor, Maximize2, Minimize2, Search, Users, User, Circle, FileText, 
  Play, Pause, Trash2, Check, CheckCheck, Sparkles, Smile, Shield, Info, Download, 
  ChevronRight, Volume2, ScreenShare, Share2
} from 'lucide-react';
import { ChatConversation, ChatMessage, MemberProfile, UserProfile } from '../types';
import { MOCK_CHATS, MOCK_MEMBERS, AGENTS, USER_PROFILE } from '../constants';

interface MoocChatFloatingProps {
  currentUser?: UserProfile;
  activeConversationId?: string | null;
  onCloseDirect?: () => void;
  onOpenMemberProfile?: (member: MemberProfile) => void;
}

export const MoocChatFloating: React.FC<MoocChatFloatingProps> = ({
  currentUser = USER_PROFILE,
  activeConversationId = null,
  onCloseDirect,
  onOpenMemberProfile
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState<ChatConversation[]>(MOCK_CHATS);
  const [currentChatId, setCurrentChatId] = useState<string | null>(activeConversationId || null);
  const [activeTab, setActiveTab] = useState<'all' | 'direct' | 'groups' | 'members'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Message input state
  const [inputText, setInputText] = useState('');
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string; type: string; url: string }[]>([]);
  
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
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Call & Screen Share state
  const [isInCall, setIsInCall] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('video');
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Open modal if external activeConversationId changed
  useEffect(() => {
    if (activeConversationId) {
      setCurrentChatId(activeConversationId);
      setIsOpen(true);
    }
  }, [activeConversationId]);

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

  // --- Voice Recorder ---
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordedAudioBlob(audioBlob);
        setRecordedAudioUrl(audioUrl);
        stream.getTracks().forEach(t => t.stop());
      };

      recorder.start();
      setIsRecordingVoice(true);
      setRecordingDuration(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn("Microphone access denied or error:", err);
      // Simulate voice recording for testing environment
      setIsRecordingVoice(true);
      setRecordingDuration(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
  };

  const cancelVoiceRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    clearInterval(recordingTimerRef.current);
    setIsRecordingVoice(false);
    setRecordedAudioBlob(null);
    setRecordedAudioUrl(null);
    setRecordingDuration(0);
  };

  const sendRecordedVoice = () => {
    if (!currentChatId) return;
    const duration = recordingDuration || 12;
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      mediaType: 'audio',
      audioDuration: duration,
      mediaUrl: recordedAudioUrl || 'https://assets.mixkit.co/active_storage/sfx/2874/2874-preview.mp3',
      text: `🎙️ Message vocal (${Math.floor(duration / 60)}:${(duration % 60).toString().padStart(2, '0')})`,
      timestamp: new Date(),
      isRead: true
    };

    appendMessageToChat(currentChatId, newMsg);
    cancelVoiceRecording();
  };

  // --- Send Standard Message ---
  const handleSendMessage = () => {
    if ((!inputText.trim() && attachedFiles.length === 0) || !currentChatId) return;

    let mediaType: 'text' | 'image' | 'video' | 'document' = 'text';
    let fileName: string | undefined = undefined;
    let fileSize: string | undefined = undefined;
    let mediaUrl: string | undefined = undefined;

    if (attachedFiles.length > 0) {
      const file = attachedFiles[0];
      fileName = file.name;
      fileSize = file.size;
      mediaUrl = file.url;
      if (file.type.includes('image')) mediaType = 'image';
      else if (file.type.includes('video')) mediaType = 'video';
      else mediaType = 'document';
    }

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderId: 'me',
      senderName: currentUser.name,
      senderAvatar: currentUser.avatarUrl,
      text: inputText.trim() || (fileName ? `Fichier partagé : ${fileName}` : undefined),
      mediaType,
      fileName,
      fileSize,
      mediaUrl,
      timestamp: new Date(),
      isRead: true
    };

    appendMessageToChat(currentChatId, newMsg);
    setInputText('');
    setAttachedFiles([]);

    // Optional simulated smart reply
    if (activeChat?.isAgent || activeChat?.participantId.startsWith('u')) {
      setTimeout(() => {
        const replyText = activeChat.isAgent 
          ? `Bonjour Amadou, votre message a bien été pris en compte par ${activeChat.participantName}. Nos analyses et documents sont à jour.`
          : `Merci pour ton message Amadou ! Je regarde ça et je te réponds dès que possible. 👍`;
        
        const autoReply: ChatMessage = {
          id: `msg-reply-${Date.now()}`,
          senderId: activeChat.participantId,
          senderName: activeChat.participantName,
          senderAvatar: activeChat.participantAvatar,
          text: replyText,
          timestamp: new Date(),
          isRead: false
        };
        appendMessageToChat(currentChatId, autoReply);
      }, 2500);
    }
  };

  const appendMessageToChat = (chatId: string, msg: ChatMessage) => {
    setConversations(prev => prev.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          lastMessage: msg.text || (msg.mediaType === 'audio' ? '🎙️ Message vocal' : '📎 Document partagé'),
          lastMessageTime: 'À l\'instant',
          messages: [...c.messages, msg]
        };
      }
      return c;
    }));
  };

  // --- Start Chat with Member ---
  const handleStartChatWithMember = (member: MemberProfile) => {
    const existingChat = conversations.find(c => c.participantId === member.id);
    if (existingChat) {
      setCurrentChatId(existingChat.id);
      setActiveTab('all');
    } else {
      const newChat: ChatConversation = {
        id: `chat-${Date.now()}`,
        participantId: member.id,
        participantName: member.name,
        participantAvatar: member.avatarUrl,
        participantTitle: member.title,
        lastMessage: 'Discussion démarrée',
        lastMessageTime: 'À l\'instant',
        unreadCount: 0,
        isOnline: member.privacySettings.showOnlineStatus,
        messages: [
          {
            id: `m-init-${Date.now()}`,
            senderId: 'system',
            text: `Vous êtes en contact avec ${member.name}. Cet échange est chiffré et sécurisé par Mooc.`,
            timestamp: new Date(),
            isRead: true
          }
        ]
      };
      setConversations([newChat, ...conversations]);
      setCurrentChatId(newChat.id);
      setActiveTab('all');
    }
  };

  // --- Audio / Video Calls with Screen Sharing ---
  const startCall = async (type: 'audio' | 'video') => {
    setCallType(type);
    setIsInCall(true);
    setIsMuted(false);
    setIsVideoOff(type === 'audio');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: type === 'video',
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current && type === 'video') {
        localVideoRef.current.srcObject = stream;
      }
    } catch (e) {
      console.warn("Could not access camera/mic for call preview:", e);
    }
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      if (screenStream) {
        screenStream.getTracks().forEach(t => t.stop());
        setScreenStream(null);
      }
      setIsScreenSharing(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
        setScreenStream(stream);
        setIsScreenSharing(true);
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = stream;
        }
        stream.getVideoTracks()[0].onended = () => {
          setIsScreenSharing(false);
          setScreenStream(null);
        };
      } catch (err) {
        console.warn("Screen share cancelled or not allowed:", err);
      }
    }
  };

  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(t => t.stop());
      setLocalStream(null);
    }
    if (screenStream) {
      screenStream.getTracks().forEach(t => t.stop());
      setScreenStream(null);
    }
    setIsInCall(false);
    setIsScreenSharing(false);
  };

  // Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    const fileUrl = URL.createObjectURL(file);
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    setAttachedFiles([{
      name: file.name,
      size: sizeStr,
      type: file.type || 'application/octet-stream',
      url: fileUrl
    }]);
  };

  return (
    <>
      {/* 1. PERMANENT FLOATING BUTTON */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative group p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full shadow-2xl hover:scale-105 transition-all duration-300 ring-4 ring-indigo-500/20 flex items-center justify-center"
          title="Mooc Chat - Messagerie, Groupes, Vocaux & Appels"
        >
          <div className="relative">
            <MessageCircle size={28} className="text-white" />
            {totalUnread > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
                {totalUnread}
              </span>
            )}
          </div>

          {/* Persistent Label Pill on Hover */}
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap text-xs font-bold pl-0 group-hover:pl-2 text-white">
            Mooc Chat
          </span>
        </button>
      </div>

      {/* 2. CHAT DRAWER / WINDOW */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[650px] max-h-[85vh] animate-scale-up">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between flex-shrink-0">
            {currentChatId && activeChat ? (
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => setCurrentChatId(null)}
                  className="p-1 hover:bg-white/10 rounded-lg text-white/80 hover:text-white"
                >
                  <ChevronRight size={20} className="rotate-180" />
                </button>
                <div className="relative cursor-pointer" onClick={() => {
                  const m = MOCK_MEMBERS.find(mem => mem.id === activeChat.participantId);
                  if (m && onOpenMemberProfile) onOpenMemberProfile(m);
                }}>
                  <img src={activeChat.participantAvatar} className="w-10 h-10 rounded-full object-cover border-2 border-white/40" />
                  {activeChat.isOnline && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-indigo-600 rounded-full"></span>
                  )}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white flex items-center gap-1.5 leading-tight">
                    {activeChat.participantName}
                    {activeChat.isAgent && <Sparkles size={13} className="text-amber-300" />}
                  </h4>
                  <p className="text-[11px] text-blue-100">
                    {activeChat.isGroup ? `${activeChat.groupMembersCount || 42} participants` : (activeChat.isOnline ? 'En ligne' : 'Hors ligne')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <MessageCircle size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-white">Mooc Chat Collaboratif</h3>
                  <p className="text-[11px] text-blue-100">Messagerie instantanée & Réseau</p>
                </div>
              </div>
            )}

            {/* Header Right Actions */}
            <div className="flex items-center gap-1">
              {currentChatId && activeChat && (
                <>
                  <button 
                    onClick={() => startCall('audio')}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Lancer un appel audio"
                  >
                    <Phone size={18} />
                  </button>
                  <button 
                    onClick={() => startCall('video')}
                    className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                    title="Lancer un appel vidéo & Partage d'écran"
                  >
                    <Video size={18} />
                  </button>
                </>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-full transition-colors ml-1"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* MAIN VIEW AREA */}
          {!currentChatId ? (
            /* CONVERSATIONS / GROUPS / MEMBERS LIST */
            <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
              
              {/* Search & Tabs */}
              <div className="p-3 bg-white border-b border-slate-100 space-y-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher une discussion, un groupe ou un membre..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex gap-1">
                  {[
                    { id: 'all', label: 'Tout' },
                    { id: 'direct', label: 'Privé' },
                    { id: 'groups', label: 'Groupes & Tribus' },
                    { id: 'members', label: 'Annuaire Membres' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* List Content */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {activeTab !== 'members' ? (
                  /* Conversations List */
                  filteredConversations.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs">
                      Aucune conversation trouvée.
                    </div>
                  ) : (
                    filteredConversations.map(chat => (
                      <div
                        key={chat.id}
                        onClick={() => setCurrentChatId(chat.id)}
                        className="flex items-center gap-3 p-3 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-100 cursor-pointer transition-all shadow-2xs group"
                      >
                        <div className="relative">
                          <img src={chat.participantAvatar} className="w-12 h-12 rounded-2xl object-cover" />
                          {chat.isOnline && (
                            <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full"></span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                              {chat.participantName}
                            </h4>
                            <span className="text-[10px] text-slate-400">{chat.lastMessageTime}</span>
                          </div>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{chat.lastMessage}</p>
                        </div>
                        {chat.unreadCount > 0 && (
                          <span className="px-2 py-0.5 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-xs">
                            {chat.unreadCount}
                          </span>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  /* Members Directory */
                  filteredMembers.map(member => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between p-3 bg-white hover:bg-slate-100/60 rounded-2xl border border-slate-100 transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img src={member.avatarUrl} className="w-10 h-10 rounded-xl object-cover" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">{member.name}</h4>
                          <p className="text-[11px] text-slate-500 truncate">{member.title}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onOpenMemberProfile && onOpenMemberProfile(member)}
                          className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-200 rounded-lg"
                        >
                          Profil
                        </button>
                        <button
                          onClick={() => handleStartChatWithMember(member)}
                          className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs"
                        >
                          Message
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          ) : (
            /* ACTIVE CHAT VIEW */
            <div className="flex flex-col flex-1 overflow-hidden bg-slate-50">
              
              {/* Messages Feed */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {activeChat?.messages.map((msg) => {
                  const isMe = msg.senderId === 'me' || msg.senderId === currentUser.id;
                  const isSystem = msg.senderId === 'system';

                  if (isSystem) {
                    return (
                      <div key={msg.id} className="text-center my-2">
                        <span className="px-3 py-1 bg-slate-200/80 text-slate-600 text-[10px] font-medium rounded-full">
                          {msg.text}
                        </span>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className={`flex gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}>
                      {!isMe && (
                        <img src={msg.senderAvatar || activeChat.participantAvatar} className="w-7 h-7 rounded-full object-cover self-end mb-1" />
                      )}

                      <div className={`max-w-[78%] rounded-2xl p-3 shadow-xs space-y-1.5 ${isMe ? 'bg-indigo-600 text-white rounded-br-xs' : 'bg-white text-slate-800 border border-slate-100 rounded-bl-xs'}`}>
                        
                        {/* Sender Name in groups */}
                        {activeChat.isGroup && !isMe && msg.senderName && (
                          <div className="text-[10px] font-extrabold text-indigo-500">{msg.senderName}</div>
                        )}

                        {/* Text Message */}
                        {msg.text && (
                          <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        )}

                        {/* Image Media */}
                        {msg.mediaType === 'image' && msg.mediaUrl && (
                          <div className="rounded-xl overflow-hidden max-h-48 border border-white/20">
                            <img src={msg.mediaUrl} className="w-full h-full object-cover" />
                          </div>
                        )}

                        {/* Video Media */}
                        {msg.mediaType === 'video' && msg.mediaUrl && (
                          <div className="rounded-xl overflow-hidden max-h-48 border border-white/20">
                            <video src={msg.mediaUrl} controls className="w-full h-full" />
                          </div>
                        )}

                        {/* Document Attachment */}
                        {msg.mediaType === 'document' && (
                          <div className={`p-2.5 rounded-xl flex items-center justify-between gap-3 ${isMe ? 'bg-indigo-700/60' : 'bg-slate-100'}`}>
                            <div className="flex items-center gap-2 truncate">
                              <FileText size={20} className={isMe ? 'text-blue-200' : 'text-indigo-600'} />
                              <div className="truncate">
                                <div className="text-xs font-bold truncate">{msg.fileName || 'Document Mooc'}</div>
                                <div className="text-[10px] opacity-75">{msg.fileSize || 'Fichier'}</div>
                              </div>
                            </div>
                            {msg.mediaUrl && (
                              <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className={`p-1 rounded-lg ${isMe ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-700'}`}>
                                <Download size={14} />
                              </a>
                            )}
                          </div>
                        )}

                        {/* Voice Audio Message */}
                        {msg.mediaType === 'audio' && (
                          <div className={`p-2 rounded-xl flex items-center gap-3 ${isMe ? 'bg-indigo-700/60' : 'bg-indigo-50'}`}>
                            <button
                              onClick={() => {
                                setPlayingAudioId(playingAudioId === msg.id ? null : msg.id);
                              }}
                              className={`w-8 h-8 rounded-full flex items-center justify-center shadow-xs transition-transform active:scale-95 ${isMe ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}
                            >
                              {playingAudioId === msg.id ? <Pause size={14} /> : <Play size={14} className="ml-0.5" />}
                            </button>
                            <div className="flex-1 space-y-1">
                              {/* Waveform graphic bars */}
                              <div className="flex items-center gap-0.5 h-4">
                                {[40, 70, 90, 60, 30, 80, 100, 50, 75, 45, 85, 30, 60, 95, 40].map((h, idx) => (
                                  <span 
                                    key={idx} 
                                    style={{ height: `${h}%` }}
                                    className={`w-1 rounded-full ${isMe ? (playingAudioId === msg.id ? 'bg-white' : 'bg-indigo-300') : (playingAudioId === msg.id ? 'bg-indigo-600' : 'bg-indigo-300')}`}
                                  ></span>
                                ))}
                              </div>
                              <div className={`text-[10px] flex justify-between ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>
                                <span>{msg.audioDuration || 15}s</span>
                                <span>Message vocal</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Timestamp & Read Receipts */}
                        <div className={`flex items-center justify-end gap-1 text-[9px] ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
                          <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {isMe && <CheckCheck size={12} className="text-blue-200" />}
                        </div>

                      </div>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Pending Attachments Preview */}
              {attachedFiles.length > 0 && (
                <div className="p-2 bg-indigo-50 border-t border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-indigo-900 truncate">
                    <Paperclip size={14} className="text-indigo-600" />
                    <span className="truncate">{attachedFiles[0].name} ({attachedFiles[0].size})</span>
                  </div>
                  <button onClick={() => setAttachedFiles([])} className="text-slate-400 hover:text-slate-600 p-1">
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* VOICE RECORDER BAR */}
              {isRecordingVoice ? (
                <div className="p-3 bg-red-50 border-t border-red-200 flex items-center justify-between animate-pulse">
                  <div className="flex items-center gap-2 text-red-600 text-xs font-bold">
                    <span className="w-3 h-3 bg-red-600 rounded-full animate-ping"></span>
                    <span>Enregistrement vocal : {Math.floor(recordingDuration / 60)}:{(recordingDuration % 60).toString().padStart(2, '0')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelVoiceRecording}
                      className="p-2 text-slate-500 hover:text-red-600 rounded-full hover:bg-red-100 transition-colors"
                      title="Annuler"
                    >
                      <Trash2 size={16} />
                    </button>
                    <button
                      onClick={() => { stopVoiceRecording(); sendRecordedVoice(); }}
                      className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5"
                    >
                      <Send size={13} />
                      Envoyer le vocal
                    </button>
                  </div>
                </div>
              ) : (
                /* STANDARD INPUT BAR */
                <div className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                  />
                  
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Joindre un fichier, photo, vidéo ou document"
                  >
                    <Paperclip size={18} />
                  </button>

                  <button
                    onClick={startVoiceRecording}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Enregistrer un message vocal"
                  >
                    <Mic size={18} />
                  </button>

                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleSendMessage(); }}
                    placeholder="Écrivez un message dans Mooc Chat..."
                    className="flex-1 bg-slate-100 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />

                  <button
                    onClick={handleSendMessage}
                    disabled={!inputText.trim() && attachedFiles.length === 0}
                    className="p-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl shadow-xs transition-all"
                  >
                    <Send size={16} />
                  </button>
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* 3. AUDIO / VIDEO CALL & SCREEN SHARE OVERLAY MODAL */}
      {isInCall && (
        <div className="fixed inset-0 z-60 bg-slate-950/90 backdrop-blur-xl flex flex-col items-center justify-between p-6 animate-fade-in text-white">
          
          {/* Call Header */}
          <div className="w-full max-w-4xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={activeChat?.participantAvatar || USER_PROFILE.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-indigo-500" />
              <div>
                <h3 className="font-bold text-lg text-white">{activeChat?.participantName || 'Session d\'appel Mooc'}</h3>
                <span className="text-xs text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  En direct • Sécurisé & Chiffré
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full text-xs font-bold">
              <Sparkles size={14} className="text-amber-400" />
              Assistant Mooc IA connecté
            </div>
          </div>

          {/* Call Video / Stage Area */}
          <div className="w-full max-w-4xl flex-1 my-6 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
            
            {/* Screen Share or Remote Stream Box */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative flex items-center justify-center shadow-2xl">
              {isScreenSharing ? (
                <div className="w-full h-full relative">
                  <video ref={screenShareVideoRef} autoPlay playsInline className="w-full h-full object-contain bg-black" />
                  <div className="absolute top-3 left-3 bg-indigo-600/90 px-2.5 py-1 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-md">
                    <ScreenShare size={14} />
                    Votre écran est partagé
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 space-y-3">
                  <img src={activeChat?.participantAvatar || AGENTS[1].avatarUrl} className="w-24 h-24 rounded-full mx-auto object-cover ring-4 ring-indigo-500/30" />
                  <h4 className="font-bold text-base">{activeChat?.participantName}</h4>
                  <p className="text-xs text-slate-400">Flux vidéo HD & Audio stéréo actif</p>
                </div>
              )}
            </div>

            {/* Local Video Box */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 relative flex items-center justify-center shadow-2xl">
              {!isVideoOff ? (
                <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 space-y-3">
                  <img src={currentUser.avatarUrl} className="w-20 h-20 rounded-full mx-auto object-cover ring-2 ring-slate-700" />
                  <span className="text-xs text-slate-400">Caméra désactivée</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-xs font-semibold">
                Vous ({currentUser.name})
              </div>
            </div>

          </div>

          {/* Call Control Buttons Bar */}
          <div className="flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-6 py-3.5 rounded-3xl shadow-2xl backdrop-blur-lg">
            
            {/* Mute Mic */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-3.5 rounded-2xl transition-all ${isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              title={isMuted ? 'Activer micro' : 'Couper micro'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            {/* Toggle Camera */}
            <button
              onClick={() => setIsVideoOff(!isVideoOff)}
              className={`p-3.5 rounded-2xl transition-all ${isVideoOff ? 'bg-rose-500 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              title={isVideoOff ? 'Activer caméra' : 'Couper caméra'}
            >
              <Video size={20} />
            </button>

            {/* Screen Share */}
            <button
              onClick={toggleScreenShare}
              className={`px-4 py-3.5 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold ${isScreenSharing ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-white hover:bg-slate-700'}`}
              title="Partager votre écran"
            >
              <ScreenShare size={20} />
              <span>{isScreenSharing ? 'Arrêter Partage' : 'Partager Écran'}</span>
            </button>

            {/* Hangup / End Call */}
            <button
              onClick={endCall}
              className="p-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl transition-all shadow-lg ml-2"
              title="Raccrocher l'appel"
            >
              <PhoneOff size={20} />
            </button>

          </div>

        </div>
      )}
    </>
  );
};
