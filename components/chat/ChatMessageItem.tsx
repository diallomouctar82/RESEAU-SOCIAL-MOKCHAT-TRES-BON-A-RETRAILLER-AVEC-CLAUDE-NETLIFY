import React, { useState } from 'react';
import {
  Check, CheckCheck, Play, Pause, Download, FileText, Reply, Smile,
  MoreVertical, ShieldAlert, Trash2, Edit2, Pin, Volume2, Sparkles, Copy, CheckCircle2, Languages, AlertCircle
} from 'lucide-react';
import { ChatMessage } from '../../types';

interface ChatMessageItemProps {
  message: ChatMessage;
  isMe: boolean;
  currentUserId?: string;
  isGroup?: boolean;
  participantAvatar?: string;
  onReply: (message: ChatMessage) => void;
  onReact: (messageId: string, emoji: string) => void;
  onReport: (message: ChatMessage) => void;
  onDelete?: (messageId: string) => void;
  onEdit?: (message: ChatMessage) => void;
  onPin?: (messageId: string) => void;
  playingAudioId: string | null;
  onToggleAudio: (messageId: string, audioUrl?: string) => void;
  audioProgress?: number; // 0 to 100
  onOpenImageLightbox?: (imageUrl: string) => void;
  /** LOOP 07/17 : traduction à la demande — retourne toujours le texte d'origine à côté de la traduction, jamais un remplacement silencieux. */
  onTranslate?: (text: string) => Promise<{ translatedText: string; originalText: string; targetLanguage: string }>;
}

const COMMON_EMOJIS = ['👍', '❤️', '🔥', '👏', '🎉', '💡', '🛡️'];

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  isMe,
  currentUserId,
  isGroup,
  participantAvatar,
  onReply,
  onReact,
  onReport,
  onDelete,
  onEdit,
  onPin,
  playingAudioId,
  onToggleAudio,
  audioProgress = 0,
  onOpenImageLightbox,
  onTranslate
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  const [translation, setTranslation] = useState<{ translatedText: string; targetLanguage: string } | null>(null);
  const [isTranslating, setIsTranslating] = useState(false);

  const isAudioPlaying = playingAudioId === message.id;

  const handleTranslate = async () => {
    if (!onTranslate || !message.text || isTranslating) return;
    setShowMenu(false);
    setIsTranslating(true);
    try {
      const result = await onTranslate(message.text);
      setTranslation({ translatedText: result.translatedText, targetLanguage: result.targetLanguage });
    } finally {
      setIsTranslating(false);
    }
  };

  const handleCopyText = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const formattedTime = (() => {
    if (!message.timestamp) return '';
    try {
      const d = typeof message.timestamp === 'string' ? new Date(message.timestamp) : message.timestamp;
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  })();

  return (
    <div className={`group relative flex gap-2.5 my-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
      
      {/* Remote Avatar */}
      {!isMe && (
        <img 
          src={message.senderAvatar || participantAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&fit=crop'} 
          className="w-7 h-7 rounded-full object-cover self-end mb-1 ring-1 ring-slate-200" 
          alt={message.senderName || 'Membre'} 
        />
      )}

      {/* Message Bubble Container */}
      <div className="relative max-w-[82%] sm:max-w-[75%]">
        
        {/* Reply Preview Header */}
        {message.replyTo && (
          <div className={`text-[10px] px-3 py-1.5 rounded-t-xl border-l-2 mb-0.5 truncate flex items-center gap-1.5 ${isMe ? 'bg-indigo-700/80 text-blue-100 border-white' : 'bg-slate-200/90 text-slate-700 border-indigo-600'}`}>
            <Reply size={11} className="rotate-180 flex-shrink-0" />
            <span className="font-bold truncate">{message.replyTo.senderName || 'Membre'} :</span>
            <span className="truncate italic opacity-90">{message.replyTo.text || (message.replyTo.mediaType === 'audio' ? 'Message vocal' : 'Fichier')}</span>
          </div>
        )}

        <div className={`rounded-2xl p-3 shadow-xs space-y-1.5 ${isMe ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-xs' : 'bg-white text-slate-900 border border-slate-200/80 rounded-bl-xs'}`}>
          
          {/* Sender Name in group chats */}
          {isGroup && !isMe && message.senderName && (
            <div className="flex items-center gap-1 text-[11px] font-extrabold text-indigo-600">
              <span>{message.senderName}</span>
              {message.senderRole === 'expert' && <span className="px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-md text-[9px]">Expert LMAV</span>}
            </div>
          )}

          {/* Text Content */}
          {message.text && (
            <p className="text-xs leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>
          )}

          {/* Translation (LOOP 07/17) — le texte d'origine reste toujours affiché au-dessus, jamais remplacé silencieusement. */}
          {translation && (
            <div className={`text-xs leading-relaxed whitespace-pre-wrap break-words pt-1.5 mt-1 border-t ${isMe ? 'border-white/20 text-indigo-50' : 'border-slate-200 text-slate-700'} italic`}>
              <span className={`not-italic text-[9px] font-bold uppercase tracking-wide block mb-0.5 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>Traduit ({translation.targetLanguage})</span>
              {translation.translatedText}
            </div>
          )}

          {/* Image Content */}
          {message.mediaType === 'image' && message.mediaUrl && (
            <div 
              className="rounded-xl overflow-hidden max-h-56 cursor-pointer border border-black/10 group/img relative"
              onClick={() => onOpenImageLightbox && onOpenImageLightbox(message.mediaUrl!)}
            >
              <img src={message.mediaUrl} className="w-full h-full object-cover transition-transform group-hover/img:scale-102" alt="Image partagée" />
              <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover/img:opacity-100 bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded-md backdrop-blur-xs">
                  Agrandir
                </span>
              </div>
            </div>
          )}

          {/* Video Content */}
          {message.mediaType === 'video' && message.mediaUrl && (
            <div className="rounded-xl overflow-hidden max-h-64 border border-black/10 bg-black">
              <video 
                src={message.mediaUrl} 
                controls 
                playsInline 
                preload="auto"
                className="w-full h-full max-h-64 rounded-xl bg-black object-contain"
                onEnded={(e) => {
                  const video = e.target as HTMLVideoElement;
                  video.currentTime = 0;
                }}
              />
            </div>
          )}

          {/* Document Content */}
          {message.mediaType === 'document' && (
            <div className={`p-2.5 rounded-xl flex items-center justify-between gap-3 ${isMe ? 'bg-white/15' : 'bg-slate-100'}`}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-lg ${isMe ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                  <FileText size={18} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate">{message.fileName || 'Document partagé'}</div>
                  <div className={`text-[10px] ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>{message.fileSize || 'Fichier'}</div>
                </div>
              </div>
              {message.mediaUrl && (
                <a 
                  href={message.mediaUrl} 
                  download={message.fileName || 'document'} 
                  target="_blank" 
                  rel="noreferrer"
                  className={`p-1.5 rounded-lg transition-colors ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                  title="Télécharger"
                >
                  <Download size={14} />
                </a>
              )}
            </div>
          )}

          {/* Voice Audio Player */}
          {message.mediaType === 'audio' && (
            <div className={`p-2.5 rounded-xl flex items-center gap-3 ${isMe ? 'bg-white/15' : 'bg-indigo-50/80 border border-indigo-100'}`}>
              <button
                type="button"
                onClick={() => onToggleAudio(message.id, message.mediaUrl)}
                disabled={!message.mediaUrl}
                className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95 flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed ${isMe ? 'bg-white text-indigo-700' : 'bg-indigo-600 text-white'}`}
                title={!message.mediaUrl ? 'Audio indisponible' : isAudioPlaying ? 'Mettre en pause' : 'Écouter le vocal'}
              >
                {isAudioPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
              </button>

              <div className="flex-1 space-y-1 min-w-0">
                {/* Waveform Graphic Bars */}
                <div className="flex items-center gap-0.5 h-5">
                  {[35, 60, 85, 45, 95, 30, 75, 100, 50, 70, 40, 80, 60, 90, 45, 65, 85, 30].map((h, idx) => {
                    const isPlayed = isAudioPlaying && ((idx / 18) * 100 <= (audioProgress || 0));
                    return (
                      <span
                        key={idx}
                        style={{ height: `${h}%` }}
                        className={`w-1 rounded-full transition-all duration-150 ${isMe ? (isPlayed ? 'bg-white font-bold' : 'bg-indigo-200/60') : (isPlayed ? 'bg-indigo-600' : 'bg-indigo-200')}`}
                      />
                    );
                  })}
                </div>

                <div className={`flex justify-between text-[10px] font-medium ${isMe ? 'text-indigo-100' : 'text-slate-500'}`}>
                  <span>{message.audioDuration ? `${Math.floor(message.audioDuration / 60)}:${(Math.round(message.audioDuration) % 60).toString().padStart(2, '0')}` : '--:--'}</span>
                  <span className="flex items-center gap-1">
                    <Volume2 size={11} /> {message.mediaUrl ? 'Vocal' : 'Audio indisponible'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Footer: Timestamp & Read Status & Pinned */}
          <div className={`flex items-center justify-end gap-1.5 text-[9px] font-medium pt-0.5 ${isMe ? 'text-indigo-200' : 'text-slate-400'}`}>
            {message.isPinned && <Pin size={10} className="text-amber-400" />}
            {message.isEdited && <span>(modifié)</span>}
            <span>{formattedTime}</span>
            {isMe && (
              message.status === 'failed' ? (
                <span className="flex items-center gap-0.5 text-rose-300 font-bold" title="Échec de l'envoi">
                  <AlertCircle size={12} /> Échec
                </span>
              ) : message.status === 'read' ? (
                <CheckCheck size={13} className="text-blue-300" title="Lu" />
              ) : message.status === 'delivered' ? (
                <CheckCheck size={13} className="text-slate-300" title="Distribué" />
              ) : message.status === 'sending' ? (
                <span className="w-2 h-2 border border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <Check size={13} className="text-slate-300" title="Envoyé" />
              )
            )}
          </div>

        </div>

        {/* Reaction Badges Container */}
        {message.reactions && Object.keys(message.reactions).length > 0 && (
          <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
            {Object.entries(message.reactions).map(([emoji, rawUsers]) => {
              const users = (rawUsers as string[] | undefined) || [];
              if (users.length === 0) return null;
              const hasReacted = currentUserId ? users.includes(currentUserId) : false;
              return (
                <button
                  key={emoji}
                  onClick={() => onReact(message.id, emoji)}
                  className={`px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 shadow-xs border transition-transform hover:scale-105 active:scale-95 ${hasReacted ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-200 text-slate-700'}`}
                >
                  <span>{emoji}</span>
                  <span className="text-[9px]">{users.length}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Hover Action Bar */}
        <div className={`absolute top-0 ${isMe ? '-left-20' : '-right-20'} opacity-0 group-hover:opacity-100 transition-opacity bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl shadow-md p-1 flex items-center gap-0.5 z-20`}>
          
          {/* Reaction Picker Button */}
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors"
              title="Ajouter une réaction"
            >
              <Smile size={14} />
            </button>

            {showEmojiPicker && (
              <div className="absolute bottom-full mb-1 left-0 bg-white rounded-2xl shadow-xl border border-slate-200 p-1.5 flex gap-1 z-30 animate-scale-up">
                {COMMON_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => { onReact(message.id, emoji); setShowEmojiPicker(false); }}
                    className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg text-base transition-transform hover:scale-120"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reply Button */}
          <button
            onClick={() => onReply(message)}
            className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors"
            title="Répondre"
          >
            <Reply size={14} />
          </button>

          {/* Copy Button */}
          {message.text && (
            <button
              onClick={handleCopyText}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors"
              title={copied ? 'Copié !' : 'Copier'}
            >
              {copied ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
            </button>
          )}

          {/* More Actions Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-slate-100 rounded-lg text-slate-600 hover:text-indigo-600 transition-colors"
            >
              <MoreVertical size={14} />
            </button>

            {showMenu && (
              <div className="absolute top-full mt-1 right-0 bg-white rounded-xl shadow-xl border border-slate-200 py-1 min-w-[140px] z-30 text-xs text-slate-700 animate-scale-up">
                {onPin && (
                  <button
                    onClick={() => { onPin(message.id); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2"
                  >
                    <Pin size={13} className="text-amber-500" />
                    <span>{message.isPinned ? 'Détacher' : 'Épingler'}</span>
                  </button>
                )}

                {onTranslate && message.text && !translation && (
                  <button
                    onClick={handleTranslate}
                    disabled={isTranslating}
                    className="w-full px-3 py-1.5 text-left hover:bg-slate-100 flex items-center gap-2 disabled:opacity-50"
                  >
                    <Languages size={13} className="text-indigo-500" />
                    <span>{isTranslating ? 'Traduction...' : 'Traduire'}</span>
                  </button>
                )}

                {isMe && onDelete && (
                  <button
                    onClick={() => { onDelete(message.id); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-rose-50 text-rose-600 flex items-center gap-2"
                  >
                    <Trash2 size={13} />
                    <span>Supprimer</span>
                  </button>
                )}

                {!isMe && (
                  <button
                    onClick={() => { onReport(message); setShowMenu(false); }}
                    className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-red-600 flex items-center gap-2"
                  >
                    <ShieldAlert size={13} />
                    <span>Signaler à l'admin</span>
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
