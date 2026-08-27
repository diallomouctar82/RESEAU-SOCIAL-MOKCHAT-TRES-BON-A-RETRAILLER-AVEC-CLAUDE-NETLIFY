import React, { useState } from 'react';
import { 
  X, 
  Send, 
  Users, 
  MessageSquare, 
  Phone, 
  Video, 
  FolderLock, 
  CheckCircle, 
  Sparkles, 
  ShieldCheck, 
  Copy,
  Clock
} from 'lucide-react';
import { RelationalNode } from '../../../types';

interface CareerIntroductionModalProps {
  contact: RelationalNode;
  userName: string;
  userRole?: string;
  onSendIntroduction: (introData: {
    channel: 'chat' | 'call' | 'meet' | 'shared_space';
    messageText: string;
    targetNodeId: string;
  }) => void;
  onClose: () => void;
}

export const CareerIntroductionModal: React.FC<CareerIntroductionModalProps> = ({
  contact,
  userName,
  userRole,
  onSendIntroduction,
  onClose
}) => {
  const [selectedChannel, setSelectedChannel] = useState<'chat' | 'call' | 'meet' | 'shared_space'>('chat');
  const [introMessage, setIntroMessage] = useState<string>(() => {
    if (contact.facilitatorName) {
      return `Bonjour ${contact.name},\n\nJe me permets de vous contacter sur la recommandation bienveillante de ${contact.facilitatorName}.\n\nNous partageons tous deux des enjeux majeurs autour de ${contact.bidirectionalValue.commonInterests[0] || 'nos secteurs d\'activité'}.\n\nJe serais honoré d'échanger avec vous pendant une quinzaine de minutes afin de vous présenter nos retours d'expérience et explorer d'éventuelles synergies.\n\nBien cordialement,\n${userName}\n${userRole || 'Professionnel LMAV'}`;
    }
    return `Bonjour ${contact.name},\n\nJ'ai suivi avec un grand intérêt les réalisations de ${contact.organization} dans le domaine de ${contact.bidirectionalValue.commonInterests[0] || 'votre secteur'}.\n\nNous développons actuellement des solutions concrètes pour ${contact.bidirectionalValue.whatYouCanBring[0] || 'optimiser les opérations'}.\n\nSeriez-vous ouvert à un bref échange informel cette semaine ?\n\nBien à vous,\n${userName}`;
  });

  const [copied, setCopied] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(introMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    setIsSent(true);
    setTimeout(() => {
      onSendIntroduction({
        channel: selectedChannel,
        messageText: introMessage,
        targetNodeId: contact.id
      });
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 via-indigo-950/50 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Sparkles size={14} /> Mode Introduction Professionnelle
              </div>
              <h2 className="text-lg md:text-xl font-black text-white">
                Mise en Relation : {contact.name}
              </h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Contact Quick Context */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src={contact.avatarUrl} 
              alt={contact.name}
              className="w-10 h-10 rounded-full object-cover border border-slate-700" 
            />
            <div>
              <h4 className="text-xs font-bold text-white">{contact.name}</h4>
              <p className="text-[11px] text-slate-400">{contact.role} • <strong className="text-indigo-300">{contact.organization}</strong></p>
            </div>
          </div>
          {contact.facilitatorName && (
            <span className="text-[10px] bg-indigo-950 text-indigo-300 border border-indigo-800/60 px-2.5 py-1 rounded-lg">
              Facilitateur : {contact.facilitatorName}
            </span>
          )}
        </div>

        {/* Body Form */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Channel Selector */}
          <div className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Format d'introduction & canal privilégié
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'chat', label: 'Discussion Privée', icon: MessageSquare },
                { id: 'call', label: 'Appel Téléphonique', icon: Phone },
                { id: 'meet', label: 'Visio Google Meet', icon: Video },
                { id: 'shared_space', label: 'Espace Collaboratif', icon: FolderLock }
              ].map(c => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedChannel(c.id as any)}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1.5 ${
                      selectedChannel === c.id 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-md' 
                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon size={16} />
                    <span>{c.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editable Draft */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Message d'introduction (Personnalisable)
              </span>
              <button
                onClick={handleCopy}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                {copied ? <CheckCircle size={13} className="text-emerald-400" /> : <Copy size={13} />}
                <span>{copied ? 'Copié !' : 'Copier le texte'}</span>
              </button>
            </div>

            <textarea
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              rows={8}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs text-slate-200 leading-relaxed focus:outline-none focus:border-indigo-500 shadow-inner"
            />
          </div>

          {/* Quality & Human Validation Notice */}
          <div className="p-3.5 bg-slate-800/50 rounded-xl border border-slate-700/60 text-[11px] text-slate-400 flex items-center gap-2.5">
            <ShieldCheck size={18} className="text-emerald-400 shrink-0" />
            <span>Contrôle humain total : aucun message n'est envoyé sans votre relecture et validation expresse.</span>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSend}
            disabled={isSent || !introMessage.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-xl font-bold text-xs hover:from-indigo-500 hover:to-blue-500 shadow-lg shadow-indigo-600/30 flex items-center gap-2 disabled:opacity-50 transition-all"
          >
            {isSent ? <CheckCircle size={15} className="text-emerald-300" /> : <Send size={15} />}
            <span>{isSent ? 'Introduction Enregistrée !' : 'Valider & Lancer l\'Introduction'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
