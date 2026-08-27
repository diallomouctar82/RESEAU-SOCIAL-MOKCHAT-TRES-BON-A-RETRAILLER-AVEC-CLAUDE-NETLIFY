import React from 'react';
import { 
  X, Phone, Video, ShieldCheck, Bell, BellOff, UserX, UserCheck, 
  ShieldAlert, Lock, MapPin, Globe, CheckCircle2, FileText, Image as ImageIcon,
  Key, ExternalLink
} from 'lucide-react';
import { ChatConversation, MemberProfile } from '../../types';

interface ChatMemberInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: ChatConversation;
  onStartCall: (type: 'audio' | 'video') => void;
  onToggleMute: () => void;
  onToggleBlock: () => void;
  onOpenReport: () => void;
  onViewFullProfile?: (memberId: string) => void;
}

export const ChatMemberInfoModal: React.FC<ChatMemberInfoModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onStartCall,
  onToggleMute,
  onToggleBlock,
  onOpenReport,
  onViewFullProfile
}) => {
  if (!isOpen) return null;

  const mediaMessages = conversation.messages.filter(m => m.mediaUrl || m.attachments?.length);
  const audioMessages = conversation.messages.filter(m => m.mediaType === 'audio');

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
        
        {/* Top Banner */}
        <div className="relative h-28 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-4 flex justify-end">
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Profile Card Overlay */}
        <div className="px-5 pb-5 -mt-12 flex-1 overflow-y-auto space-y-4">
          
          <div className="text-center space-y-1">
            <div className="relative inline-block">
              <img 
                src={conversation.participantAvatar} 
                className="w-24 h-24 rounded-3xl object-cover ring-4 ring-white shadow-xl mx-auto" 
              />
              {conversation.isOnline && (
                <span className="absolute bottom-1 right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
              )}
            </div>
            
            <h3 className="font-extrabold text-slate-900 text-base flex items-center justify-center gap-1.5 pt-1">
              {conversation.participantName}
              <ShieldCheck size={16} className="text-blue-600" />
            </h3>
            
            <p className="text-xs font-semibold text-slate-500">{conversation.participantTitle || 'Membre vérifié LMAV'}</p>
            
            <div className="flex items-center justify-center gap-2 pt-1 text-[11px] text-slate-500">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold ${conversation.isOnline ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${conversation.isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                {conversation.isOnline ? 'En ligne' : (conversation.lastSeen ? `Vu ${conversation.lastSeen}` : 'Hors ligne')}
              </span>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full">
                KYC Vérifié
              </span>
            </div>
          </div>

          {/* Quick Call Action Bar */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              onClick={() => { onClose(); onStartCall('audio'); }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
            >
              <Phone size={16} className="text-indigo-600" />
              <span>Appel Audio</span>
            </button>
            <button
              onClick={() => { onClose(); onStartCall('video'); }}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Video size={16} />
              <span>Appel Vidéo</span>
            </button>
          </div>

          {/* Details & Metadata */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100 space-y-2.5 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <MapPin size={13} className="text-slate-400" /> Localisation
              </span>
              <span className="font-bold text-slate-800">{conversation.participantCountry || 'France / International'}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <Lock size={13} className="text-emerald-600" /> Chiffrement
              </span>
              <span className="font-bold text-emerald-700 font-mono text-[10px]">
                {conversation.encryptionFingerprint || 'SHA256-AES-LMAV-OK'}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <ImageIcon size={13} className="text-indigo-600" /> Médias & Fichiers
              </span>
              <span className="font-bold text-slate-800">{mediaMessages.length} partagés</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium flex items-center gap-1.5">
                <FileText size={13} className="text-amber-600" /> Messages vocaux
              </span>
              <span className="font-bold text-slate-800">{audioMessages.length} reçus</span>
            </div>
          </div>

          {/* Privacy & Safety Settings */}
          <div className="space-y-1 pt-1">
            <button
              onClick={onToggleMute}
              className="w-full p-2.5 hover:bg-slate-100 rounded-xl flex items-center justify-between text-xs font-bold text-slate-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                {conversation.isMuted ? <BellOff size={16} className="text-rose-500" /> : <Bell size={16} className="text-slate-500" />}
                <span>{conversation.isMuted ? 'Réactiver les notifications' : 'Mettre en sourdine'}</span>
              </div>
              <span className="text-[10px] text-slate-400">{conversation.isMuted ? 'Désactivé' : 'Actif'}</span>
            </button>

            <button
              onClick={onToggleBlock}
              className="w-full p-2.5 hover:bg-rose-50 rounded-xl flex items-center justify-between text-xs font-bold text-rose-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                {conversation.isBlocked ? <UserCheck size={16} className="text-emerald-600" /> : <UserX size={16} className="text-rose-600" />}
                <span>{conversation.isBlocked ? 'Débloquer cet utilisateur' : 'Bloquer cet utilisateur'}</span>
              </div>
              <span className="text-[10px] font-bold text-rose-500">{conversation.isBlocked ? 'Bloqué' : ''}</span>
            </button>

            <button
              onClick={() => { onClose(); onOpenReport(); }}
              className="w-full p-2.5 hover:bg-red-50 rounded-xl flex items-center gap-2 text-xs font-bold text-red-600 transition-colors"
            >
              <ShieldAlert size={16} />
              <span>Signaler un abus ou une fraude</span>
            </button>
          </div>

          {/* View Full Profile Button */}
          {onViewFullProfile && (
            <button
              onClick={() => { onClose(); onViewFullProfile(conversation.participantId); }}
              className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Voir le profil citoyen complet</span>
              <ExternalLink size={13} />
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
