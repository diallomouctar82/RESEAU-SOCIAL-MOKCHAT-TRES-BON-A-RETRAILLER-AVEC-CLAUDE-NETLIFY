import React from 'react';
import { ArrowLeft, Sparkles, Layers, Search } from 'lucide-react';

export interface ContextActionBarProps {
  activeTabLabel: string;
  pillarLabel: string;
  description?: string;
  onBack: () => void;
  onOpenDialloOS: (prompt?: string) => void;
  onOpenTransversal: () => void;
  onOpenSearch: () => void;
  className?: string;
}

export const ContextActionBar: React.FC<ContextActionBarProps> = ({
  activeTabLabel,
  pillarLabel,
  description,
  onBack,
  onOpenDialloOS,
  onOpenTransversal,
  onOpenSearch,
  className = ''
}) => {
  return (
    <div className={`bg-slate-900 text-white rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-sm border border-slate-800 ${className}`}>
      <div className="flex items-center gap-2.5 min-w-0">
        <button
          onClick={onBack}
          className="w-6 h-6 rounded-md bg-white/10 hover:bg-white/20 text-white flex items-center justify-center shrink-0 transition-colors"
          title="Retour à l'accueil"
        >
          <ArrowLeft size={14} />
        </button>
        <div className="flex items-center gap-2 text-xs truncate">
          <span className="text-orange-400 font-semibold bg-orange-950/60 px-2 py-0.5 rounded border border-orange-800/40 shrink-0">
            {pillarLabel}
          </span>
          <span className="font-bold text-white truncate max-w-[200px] sm:max-w-xs">{activeTabLabel}</span>
          {description && (
            <span className="hidden md:inline text-slate-400 font-medium truncate max-w-xs">
              — {description}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto shrink-0">
        <button
          onClick={onOpenSearch}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Recherche universelle"
        >
          <Search size={14} />
        </button>
        <button
          onClick={onOpenTransversal}
          className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          title="Services transversaux"
        >
          <Layers size={14} />
        </button>
        <button
          onClick={() => onOpenDialloOS()}
          className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <Sparkles size={12} />
          <span>Diallo OS</span>
        </button>
      </div>
    </div>
  );
};
