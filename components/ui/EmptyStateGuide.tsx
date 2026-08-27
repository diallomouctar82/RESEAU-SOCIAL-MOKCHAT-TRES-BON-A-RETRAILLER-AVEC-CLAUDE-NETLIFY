import React from 'react';
import { Compass, Sparkles, ArrowRight, FolderPlus } from 'lucide-react';

export interface EmptyStateGuideProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  icon?: React.ReactNode;
  advisorNote?: string;
  className?: string;
}

export const EmptyStateGuide: React.FC<EmptyStateGuideProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
  icon,
  advisorNote,
  className = ''
}) => {
  return (
    <div className={`bg-white border border-dashed border-slate-300/80 rounded-2xl p-8 sm:p-12 text-center max-w-lg mx-auto my-6 ${className}`}>
      <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-700 mx-auto flex items-center justify-center mb-4 shadow-xs">
        {icon || <Compass size={28} className="text-orange-600" />}
      </div>

      <h4 className="text-lg font-bold text-slate-900 mb-2">
        {title}
      </h4>

      <p className="text-sm text-slate-500 leading-relaxed mb-6">
        {description}
      </p>

      {advisorNote && (
        <div className="bg-orange-50 border border-orange-200/70 rounded-xl p-3 text-xs text-orange-950 mb-6 text-left flex items-start gap-2.5">
          <Sparkles size={16} className="text-orange-600 shrink-0 mt-0.5" />
          <span>{advisorNote}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3">
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-all shadow-sm flex items-center gap-2"
          >
            <span>{actionLabel}</span>
            <ArrowRight size={14} />
          </button>
        )}

        {secondaryActionLabel && onSecondaryAction && (
          <button
            onClick={onSecondaryAction}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm transition-colors"
          >
            {secondaryActionLabel}
          </button>
        )}
      </div>
    </div>
  );
};
