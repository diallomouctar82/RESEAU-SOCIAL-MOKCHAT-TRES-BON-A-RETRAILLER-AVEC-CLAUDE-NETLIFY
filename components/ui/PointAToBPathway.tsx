import React from 'react';
import { Compass, CheckCircle2, ArrowRight, Sparkles, UserCheck, ShieldCheck } from 'lucide-react';

export interface PathwayStep {
  id: string;
  title: string;
  subtitle?: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  expertNote?: string;
}

export interface PointAToBPathwayProps {
  origin: {
    label: string;
    description: string;
    date?: string;
  };
  destination: {
    label: string;
    targetDate?: string;
    impact: string;
  };
  currentStepIndex: number;
  steps: PathwayStep[];
  leadAdvisor?: {
    name: string;
    role: string;
    avatar?: string;
  };
  compact?: boolean;
  onStepClick?: (stepIndex: number) => void;
  onOpenAdvisor?: () => void;
  className?: string;
}

export const PointAToBPathway: React.FC<PointAToBPathwayProps> = ({
  origin,
  destination,
  currentStepIndex,
  steps,
  leadAdvisor,
  compact = false,
  onStepClick,
  onOpenAdvisor,
  className = ''
}) => {
  const completedCount = steps.filter(s => s.status === 'completed').length;
  const progressPercent = Math.round(((completedCount + (steps[currentStepIndex]?.status === 'in_progress' ? 0.5 : 0)) / steps.length) * 100);

  if (compact) {
    return (
      <div className={`bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm transition-all hover:border-slate-300 ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              A
            </div>
            <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px] sm:max-w-[200px]">
              {origin.label}
            </span>
            <ArrowRight size={14} className="text-slate-400 shrink-0" />
            <div className="w-7 h-7 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold text-xs">
              B
            </div>
            <span className="text-xs font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[200px]">
              {destination.label}
            </span>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full">
              {progressPercent}% accompli
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
          <div 
            className="bg-gradient-to-r from-slate-900 via-blue-700 to-orange-600 h-full rounded-full transition-all duration-700" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden ${className}`}>
      {/* Subtle background ambient line */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-orange-500/5 via-blue-500/5 to-transparent rounded-full pointer-events-none blur-2xl" />

      {/* Header : The A to B Promise */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8 pb-6 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 tracking-wide">
              <Compass size={13} className="text-orange-600" />
              CAP STRATÉGIQUE ACTIF
            </span>
            <span className="text-xs font-medium text-slate-400">• Accompagnement Continu</span>
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <span>{origin.label}</span>
            <ArrowRight className="text-orange-600 shrink-0" size={22} />
            <span className="text-orange-600">{destination.label}</span>
          </h3>
          <p className="text-sm text-slate-500 mt-1 max-w-xl">
            {destination.impact}
          </p>
        </div>

        {leadAdvisor && (
          <div 
            onClick={onOpenAdvisor}
            className="flex items-center gap-3 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 px-4 py-2.5 rounded-xl cursor-pointer transition-all self-stretch lg:self-auto"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
              {leadAdvisor.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-medium text-slate-500 flex items-center gap-1">
                <ShieldCheck size={12} className="text-blue-600" />
                Conseiller Référent
              </div>
              <div className="text-sm font-bold text-slate-900">{leadAdvisor.name}</div>
            </div>
          </div>
        )}
      </div>

      {/* Trajectory Steps Timeline */}
      <div className="relative">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
          {steps.map((step, idx) => {
            const isCompleted = step.status === 'completed';
            const isInProgress = step.status === 'in_progress';
            const isUpcoming = step.status === 'upcoming';

            return (
              <div
                key={step.id || idx}
                onClick={() => onStepClick?.(idx)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative ${
                  isInProgress
                    ? 'bg-orange-50/50 border-orange-200 shadow-sm ring-1 ring-orange-400/30'
                    : isCompleted
                    ? 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-50'
                    : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? 'bg-slate-900 text-white'
                      : isInProgress
                      ? 'bg-orange-600 text-white animate-pulse'
                      : 'bg-slate-100 text-slate-400'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={14} /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-bold uppercase tracking-wider ${
                    isInProgress 
                      ? 'text-orange-700 bg-orange-100/80 px-2 py-0.5 rounded-full' 
                      : isCompleted 
                      ? 'text-slate-600' 
                      : 'text-slate-400'
                  }`}>
                    {isCompleted ? 'Validé' : isInProgress ? 'En cours' : 'À venir'}
                  </span>
                </div>

                <h4 className={`text-sm font-bold leading-snug mb-1 ${
                  isInProgress ? 'text-slate-900' : isCompleted ? 'text-slate-800' : 'text-slate-500'
                }`}>
                  {step.title}
                </h4>

                {step.subtitle && (
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {step.subtitle}
                  </p>
                )}

                {step.expertNote && isInProgress && (
                  <div className="mt-2.5 pt-2 border-t border-orange-200/60 text-[11px] text-orange-900/90 font-medium flex items-center gap-1.5">
                    <Sparkles size={12} className="text-orange-600 shrink-0" />
                    <span>{step.expertNote}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
