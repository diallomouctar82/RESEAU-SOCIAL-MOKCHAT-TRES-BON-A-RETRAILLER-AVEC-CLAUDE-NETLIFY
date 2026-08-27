import React from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Send, 
  Share2, 
  DollarSign, 
  FileCheck, 
  X, 
  ShieldAlert,
  ArrowRight,
  RotateCcw
} from 'lucide-react';

export type RiskLevel = 'info' | 'moderate' | 'high' | 'critical';

export interface SmartConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  actionType?: 'delete' | 'publish' | 'pay' | 'share' | 'submit' | 'generic';
  riskLevel?: RiskLevel;
  dataAffectedNotice?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isProcessing?: boolean;
}

export const SmartConfirmModal: React.FC<SmartConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  actionType = 'generic',
  riskLevel = 'moderate',
  dataAffectedNotice,
  confirmLabel,
  cancelLabel = 'Annuler',
  isProcessing = false
}) => {
  if (!isOpen) return null;

  const getTheme = () => {
    switch (riskLevel) {
      case 'critical':
      case 'high':
        return {
          icon: ShieldAlert,
          iconBg: 'bg-rose-100 text-rose-600',
          confirmBtn: 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20',
          badgeText: 'Action Irréversible',
          badgeBg: 'bg-rose-50 text-rose-700 border-rose-200'
        };
      case 'moderate':
        return {
          icon: AlertTriangle,
          iconBg: 'bg-amber-100 text-amber-700',
          confirmBtn: 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20',
          badgeText: 'Confirmation Requise',
          badgeBg: 'bg-amber-50 text-amber-700 border-amber-200'
        };
      default:
        return {
          icon: FileCheck,
          iconBg: 'bg-blue-100 text-blue-700',
          confirmBtn: 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20',
          badgeText: 'Action Engageante',
          badgeBg: 'bg-blue-50 text-blue-700 border-blue-200'
        };
    }
  };

  const theme = getTheme();
  const Icon = theme.icon;

  const getDefaultConfirmText = () => {
    if (confirmLabel) return confirmLabel;
    switch (actionType) {
      case 'delete': return 'Confirmer la suppression';
      case 'publish': return 'Publier maintenant';
      case 'pay': return 'Valider le paiement';
      case 'share': return 'Partager le document';
      case 'submit': return 'Transmettre le dossier';
      default: return 'Confirmer l\'action';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-scale-up">
        
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center font-black shadow-xs shrink-0`}>
              <Icon size={24} />
            </div>
            <div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${theme.badgeBg}`}>
                {theme.badgeText}
              </span>
              <h3 id="confirm-modal-title" className="text-lg font-black text-slate-900 mt-1 leading-snug">
                {title}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-2 space-y-3">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {description}
          </p>

          {dataAffectedNotice && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block">Données & Périmètre impactés :</span>
              <p className="opacity-80">{dataAffectedNotice}</p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-6 pt-4 bg-slate-50/70 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-all disabled:opacity-50"
          >
            {cancelLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              onConfirm();
            }}
            disabled={isProcessing}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${theme.confirmBtn} disabled:opacity-50`}
          >
            {isProcessing ? (
              <span>Traitement...</span>
            ) : (
              <>
                <span>{getDefaultConfirmText()}</span>
                <ArrowRight size={14} />
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
