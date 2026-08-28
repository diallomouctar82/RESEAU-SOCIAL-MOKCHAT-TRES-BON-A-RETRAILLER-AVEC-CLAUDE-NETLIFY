import React from 'react';
import { 
  X, 
  Sparkles, 
  Compass, 
  Briefcase, 
  GraduationCap, 
  ShoppingBag, 
  Home as HomeIcon, 
  FileText, 
  Languages, 
  ArrowRight, 
  CheckCircle2,
  Users
} from 'lucide-react';
import { useGoal, GoalTemplate } from '../../contexts/GoalContext';

interface GoalOrientationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, context?: any) => void;
  onOpenDialloOS: (initialPrompt?: string) => void;
}

export const GoalOrientationModal: React.FC<GoalOrientationModalProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenDialloOS
}) => {
  const { goalTemplates, setCurrentGoal } = useGoal();

  if (!isOpen) return null;

  const handleSelectGoal = (template: GoalTemplate) => {
    setCurrentGoal(template);
    onNavigate(template.targetTab);
    onClose();
  };

  const handleCustomGoalPrompt = () => {
    onClose();
    onOpenDialloOS();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white flex justify-between items-center relative">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-500 to-purple-500 p-0.5 shadow-lg shadow-purple-500/30 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Compass size={24} className="text-purple-300 animate-spin-slow" />
              </div>
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-purple-300">Orientation par Objectifs</span>
              <h2 className="text-xl font-bold text-white tracking-tight">Que veux-tu accomplir aujourd'hui ?</h2>
              <p className="text-xs text-slate-300 mt-0.5">
                Choisissez votre grand objectif ou confiez votre intention libre à Diallo OS.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Custom Goal Banner */}
        <div className="p-4 bg-purple-50/70 border-b border-purple-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-purple-950 text-center sm:text-left">
            <Sparkles size={20} className="text-purple-600 shrink-0" />
            <span>
              <strong>Objectif sur-mesure ?</strong> Décrivez votre situation avec vos propres mots et laissez Diallo OS orchestrer les modules et agents pour vous.
            </span>
          </div>
          <button
            onClick={handleCustomGoalPrompt}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shrink-0 shadow-sm transition flex items-center gap-1.5"
          >
            <span>Dicter mon Objectif</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Goals Grid */}
        <div className="p-6 overflow-y-auto space-y-4 bg-slate-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {goalTemplates.map((tmpl) => {
              const Icon = tmpl.icon;
              return (
                <div
                  key={tmpl.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 group-hover:bg-indigo-600 text-indigo-600 group-hover:text-white flex items-center justify-center transition-colors shadow-xs">
                          <Icon size={22} />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                            {tmpl.category}
                          </span>
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-indigo-900 transition leading-snug">
                            {tmpl.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <div className="my-3 space-y-1.5 bg-slate-50/80 rounded-xl p-3 border border-slate-100">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        Étapes clés incluses :
                      </div>
                      {tmpl.steps.map((st, sIdx) => (
                        <div key={sIdx} className="flex items-center gap-2 text-xs text-slate-600">
                          <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          <span className="truncate">{st}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <Users size={13} className="text-indigo-600" />
                      <span>Guidé par <strong>{tmpl.leadAgent}</strong></span>
                    </div>
                    <button
                      onClick={() => handleSelectGoal(tmpl)}
                      className="px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
                    >
                      <span>Lancer</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Le Monde à Vous • Architecture par Besoins Humains & Continuité
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
