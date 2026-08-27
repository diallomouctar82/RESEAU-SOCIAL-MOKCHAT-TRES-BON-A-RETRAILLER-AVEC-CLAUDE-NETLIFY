import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  HelpCircle, 
  Clock, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export interface ActionableAISuggestionProps {
  id?: string;
  title: string;
  recommendation: string;
  whyExplanation: string;
  confidenceScore?: number;
  primaryActionLabel: string;
  onPrimaryAction: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  onDismiss?: () => void;
  badgeLabel?: string;
}

export const ActionableAISuggestion: React.FC<ActionableAISuggestionProps> = ({
  title,
  recommendation,
  whyExplanation,
  confidenceScore = 95,
  primaryActionLabel,
  onPrimaryAction,
  secondaryActionLabel = "Voir pourquoi",
  onSecondaryAction,
  onDismiss,
  badgeLabel = "Conseil Stratégique Diallo"
}) => {
  const [isWhyOpen, setIsWhyOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl p-5 sm:p-6 shadow-md border border-slate-700/80 relative overflow-hidden group">
      {/* Background glow subtle effect */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-orange-600/10 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-3">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center text-xs font-black shadow-xs">
              <Sparkles size={14} />
            </span>
            <span className="text-[11px] font-black uppercase text-orange-400 tracking-wider">
              {badgeLabel}
            </span>
            {confidenceScore && (
              <span className="bg-white/10 text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-white/5">
                Indice de pertinence : {confidenceScore}%
              </span>
            )}
          </div>

          {onDismiss && (
            <button
              onClick={() => {
                setIsDismissed(true);
                onDismiss();
              }}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Ignorer la recommandation"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Title & Core Recommendation */}
        <div>
          <h4 className="text-base font-black text-white tracking-tight">
            {title}
          </h4>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            {recommendation}
          </p>
        </div>

        {/* Why Explanation (Expandable) */}
        {isWhyOpen && (
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 space-y-1.5 animate-fade-in">
            <div className="flex items-center gap-1.5 text-orange-300 font-bold">
              <HelpCircle size={14} />
              <span>Pourquoi cette recommandation ?</span>
            </div>
            <p className="leading-relaxed opacity-90">
              {whyExplanation}
            </p>
          </div>
        )}

        {/* Action Buttons Zone */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => {
              setIsWhyOpen(!isWhyOpen);
              if (onSecondaryAction) onSecondaryAction();
            }}
            className="text-xs font-bold text-slate-300 hover:text-white flex items-center gap-1 transition-colors py-1"
          >
            <span>{isWhyOpen ? "Masquer l'explication" : secondaryActionLabel}</span>
            {isWhyOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setIsDismissed(true);
                if (onDismiss) onDismiss();
              }}
              className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Plus tard
            </button>

            <button
              onClick={onPrimaryAction}
              className="bg-orange-600 hover:bg-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-[1.02] transition-all"
            >
              <span>{primaryActionLabel}</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
