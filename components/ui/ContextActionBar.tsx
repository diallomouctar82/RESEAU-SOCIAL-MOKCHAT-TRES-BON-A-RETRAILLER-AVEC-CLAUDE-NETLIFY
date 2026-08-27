import React from 'react';
import { Compass, ArrowRight, Sparkles, CheckCircle2, ChevronRight, X } from 'lucide-react';

export interface ContextActionBarProps {
  goalTitle: string;
  activeModuleLabel: string;
  nextStepTitle?: string;
  onNavigateToGoal?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ContextActionBar: React.FC<ContextActionBarProps> = ({
  goalTitle,
  activeModuleLabel,
  nextStepTitle,
  onNavigateToGoal,
  onDismiss,
  className = ''
}) => {
  return (
    <div className={`bg-slate-900 text-white rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-6 h-6 rounded-md bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
          <Compass size={14} />
        </div>
        <div className="flex items-center gap-2 text-xs truncate">
          <span className="text-slate-400 font-medium">Cap actif :</span>
          <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{goalTitle}</span>
          <ChevronRight size={12} className="text-slate-500 shrink-0" />
          <span className="text-orange-400 font-semibold bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40">
            {activeModuleLabel}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-auto">
        {nextStepTitle && (
          <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-300">
            <span className="text-slate-400">Prochaine étape :</span>
            <span className="font-medium text-white">{nextStepTitle}</span>
          </div>
        )}

        {onNavigateToGoal && (
          <button
            onClick={onNavigateToGoal}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1 shrink-0"
          >
            <span>Voir le Cap</span>
            <ArrowRight size={12} />
          </button>
        )}

        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="text-slate-400 hover:text-white p-0.5 rounded transition-colors"
            title="Masquer le rappel"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
};
