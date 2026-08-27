import React from 'react';
import { 
  Eye, 
  Maximize2, 
  Sparkles, 
  X, 
  Share2, 
  Sliders, 
  Moon, 
  Sun, 
  CheckCircle2, 
  ShieldCheck,
  Volume2
} from 'lucide-react';

interface FocusAndPresentationControlsProps {
  isFocusMode: boolean;
  onToggleFocusMode: () => void;
  isPresentationMode: boolean;
  onTogglePresentationMode: () => void;
}

export const FocusAndPresentationControls: React.FC<FocusAndPresentationControlsProps> = ({
  isFocusMode,
  onToggleFocusMode,
  isPresentationMode,
  onTogglePresentationMode
}) => {
  return (
    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-xl p-1 shadow-xs">
      {/* Concentration Mode (Zen) */}
      <button
        onClick={onToggleFocusMode}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
          isFocusMode 
            ? 'bg-blue-600 text-white shadow-xs' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
        title="Mode Concentration : masque les distractions, barres latérales et notifications"
        aria-label="Basculer le mode concentration"
      >
        <Eye size={14} />
        <span className="hidden sm:inline">Concentration</span>
      </button>

      {/* Presentation Mode */}
      <button
        onClick={onTogglePresentationMode}
        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
          isPresentationMode 
            ? 'bg-slate-900 text-white shadow-xs' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
        title="Mode Présentation : vue épurée pour projeter à un recruteur ou partenaire"
        aria-label="Basculer le mode présentation"
      >
        <Maximize2 size={14} />
        <span className="hidden sm:inline">Présentation</span>
      </button>
    </div>
  );
};
