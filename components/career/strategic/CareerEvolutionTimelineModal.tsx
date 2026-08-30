import React from 'react';
import { 
  Milestone, 
  CheckCircle2, 
  Clock, 
  Target, 
  X, 
  Sparkles, 
  ArrowRight, 
  GraduationCap, 
  Briefcase, 
  Award,
  Zap
} from 'lucide-react';
import { CareerEvolutionTimelineStep } from '../../../types';

interface CareerEvolutionTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  timelineSteps: CareerEvolutionTimelineStep[];
}

export const CareerEvolutionTimelineModal: React.FC<CareerEvolutionTimelineModalProps> = ({
  isOpen,
  onClose,
  timelineSteps
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Milestone size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Frise Chronologique Continue</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-500/30">
                  Du Point A au Point B
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Mon Évolution & Chemin d'Accomplissement
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed flex items-center gap-3">
            <Sparkles size={18} className="text-emerald-400 shrink-0" />
            <span>
              Mesurez le chemin parcouru depuis votre Point de Départ et visualisez avec netteté les jalons qui vous séparent de votre Point B final.
            </span>
          </div>

          {/* Timeline Vertical Track */}
          <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700">
            {timelineSteps.map((step, idx) => {
              const isPast = step.status === 'completed';
              const isCurrent = step.status === 'current';
              const isFuture = step.status === 'upcoming';

              return (
                <div key={step.id} className="relative group">
                  {/* Marker Dot */}
                  <div className={`absolute -left-6 sm:-left-8 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold transition-all ${
                    isPast 
                      ? 'bg-emerald-600 border-emerald-400 text-white' 
                      : isCurrent 
                      ? 'bg-indigo-600 border-indigo-400 text-white ring-4 ring-indigo-500/20 animate-pulse' 
                      : 'bg-slate-900 border-slate-600 text-slate-400'
                  }`}>
                    {isPast ? '✓' : idx + 1}
                  </div>

                  {/* Step Card */}
                  <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                    isCurrent 
                      ? 'bg-indigo-950/40 border-indigo-500/80 shadow-lg shadow-indigo-950/50' 
                      : isPast 
                      ? 'bg-slate-800/70 border-slate-700' 
                      : 'bg-slate-900/40 border-slate-800/80 opacity-80'
                  }`}>
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-400">{step.timeframe}</span>
                        {isCurrent && (
                          <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded font-bold text-[10px] border border-indigo-500/30">
                            Position Actuelle
                          </span>
                        )}
                        {isPast && (
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded font-bold text-[10px]">
                            Accompli
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-400 capitalize">{step.category}</span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-1.5">{step.title}</h4>
                    <p className="text-xs text-slate-300 mb-3 leading-relaxed">{step.description}</p>

                    <div className="space-y-1 text-xs">
                      {step.keyMilestones.map((m, mIdx) => (
                        <div key={mIdx} className="flex items-center gap-2 text-slate-400">
                          <span className="text-emerald-400 text-[10px]">•</span>
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>

                    {step.achievementBadge && (
                      <div className="mt-3 pt-2.5 border-t border-slate-700/60 flex items-center gap-1.5 text-xs text-amber-300 font-medium">
                        <Award size={14} className="text-amber-400" />
                        <span>Badge Capitalisé : <strong>{step.achievementBadge}</strong></span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Chaque progrès est automatiquement consigné dans votre frise</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer la Frise
          </button>
        </div>

      </div>
    </div>
  );
};
