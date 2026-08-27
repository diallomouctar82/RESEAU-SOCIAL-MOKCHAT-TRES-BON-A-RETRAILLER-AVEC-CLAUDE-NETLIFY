import React, { useState } from 'react';
import { ShieldAlert, X, AlertTriangle, CheckCircle, Lock, UserX } from 'lucide-react';
import { ChatMessage, ChatConversation } from '../../types';
import { mokChatService } from '../../services/mokChat';

interface ChatReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetMessage?: ChatMessage | null;
  conversation: ChatConversation;
  currentUserId: string;
  onBlockUser?: (userId: string) => void | Promise<void>;
}

export const ChatReportModal: React.FC<ChatReportModalProps> = ({
  isOpen,
  onClose,
  targetMessage,
  conversation,
  currentUserId,
  onBlockUser
}) => {
  const [reason, setReason] = useState<'fraud' | 'inappropriate' | 'spam' | 'harassment' | 'other'>('inappropriate');
  const [details, setDetails] = useState('');
  const [alsoBlock, setAlsoBlock] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const reportReasonLabels: Record<string, string> = {
      fraud: 'Suspicion de fraude ou paiement illicite',
      inappropriate: 'Propos injurieux ou contenu inapproprié',
      spam: 'Spam, publicité non sollicitée ou hameçonnage',
      harassment: 'Harcèlement ou intimidation',
      other: 'Autre infraction aux règles de la communauté'
    };

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await mokChatService.reportAbuse({
        reporterId: currentUserId,
        reportedUserId: conversation.isGroup ? undefined : conversation.participantId,
        conversationId: conversation.id,
        messageId: targetMessage?.id,
        reason,
        details: details ? `${reportReasonLabels[reason]} : ${details}` : reportReasonLabels[reason],
      });
      if (!conversation.isGroup && alsoBlock && onBlockUser) await onBlockUser(conversation.participantId);
      setIsSubmitted(true);
      window.setTimeout(() => {
        setIsSubmitted(false);
        onClose();
      }, 1600);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Le signalement n’a pas pu être transmis.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-70 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div role="dialog" aria-modal="true" aria-labelledby="chat-report-title" className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden animate-scale-up">
        
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              <ShieldAlert size={20} className="text-white" />
            </div>
            <div>
              <h3 id="chat-report-title" className="font-extrabold text-sm text-white">Signalement de sécurité</h3>
              <p className="text-[11px] text-rose-100">Enregistrement dans la file de modération</p>
            </div>
          </div>
          <button type="button" aria-label="Fermer le signalement" onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10">
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        {isSubmitted ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle size={32} />
            </div>
            <h4 className="font-extrabold text-slate-900 text-base">Signalement Envoyé avec Succès</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Le signalement a été enregistré pour examen.{!conversation.isGroup && alsoBlock ? ' Le membre a également été bloqué pour votre compte.' : ''}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            
            {/* Target Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-1">
              <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Membre concerné</div>
              <div className="flex items-center gap-2.5">
                <img src={conversation.participantAvatar} alt="" className="w-8 h-8 rounded-full object-cover" />
                <div className="min-w-0">
                  <div className="font-bold text-xs text-slate-900 truncate">{conversation.participantName}</div>
                  <div className="text-[10px] text-slate-500">{conversation.participantTitle || 'Membre Mok'}</div>
                </div>
              </div>
              {targetMessage?.text && (
                <div className="mt-2 pt-2 border-t border-slate-200/60 text-xs italic text-slate-700 line-clamp-2">
                  « {targetMessage.text} »
                </div>
              )}
            </div>

            {/* Reason selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Motif du signalement :</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value as any)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="inappropriate">Propos injurieux / Contenu inapproprié</option>
                <option value="fraud">Tentative d'arnaque / Paiement hors plateforme</option>
                <option value="harassment">Harcèlement ou menaces</option>
                <option value="spam">Spam / Message automatisé indésirable</option>
                <option value="other">Autre motif de sécurité</option>
              </select>
            </div>

            {/* Details input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Précisions (optionnel) :</label>
              <textarea
                rows={3}
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                placeholder="Décrivez brièvement le problème pour l'équipe de modération..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500/20 resize-none"
              />
            </div>

            {/* Block checkbox */}
            {!conversation.isGroup && <label className="flex items-center gap-2.5 p-3 bg-rose-50/60 border border-rose-100 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={alsoBlock}
                onChange={(e) => setAlsoBlock(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded-sm focus:ring-rose-500 accent-rose-600"
              />
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-900">
                <UserX size={14} className="text-rose-600" />
                <span>Bloquer immédiatement cet utilisateur</span>
              </div>
            </label>}

            {/* Buttons */}
            {submitError && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{submitError}</p>}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                <ShieldAlert size={14} />
                {isSubmitting ? 'Transmission…' : 'Transmettre à la modération'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
