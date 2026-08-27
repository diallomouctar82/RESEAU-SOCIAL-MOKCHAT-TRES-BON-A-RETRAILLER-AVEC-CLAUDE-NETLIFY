import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Briefcase, 
  DollarSign, 
  Globe, 
  Scale, 
  Home, 
  GraduationCap, 
  MessageSquare, 
  ShieldCheck
} from 'lucide-react';
import { MultiExpertCareerCouncil } from '../../types';

interface CareerMultiExpertCouncilModalProps {
  isOpen: boolean;
  onClose: () => void;
  council: MultiExpertCareerCouncil;
  onConsultExpert?: (expertName: string, role: string) => void;
}

export const CareerMultiExpertCouncilModal: React.FC<CareerMultiExpertCouncilModalProps> = ({
  isOpen,
  onClose,
  council,
  onConsultExpert
}) => {
  const [selectedExpertIdx, setSelectedExpertIdx] = useState<number>(0);

  if (!isOpen) return null;

  const expertIcons: Record<string, any> = {
    'expert_carriere': Briefcase,
    'expert_finance': DollarSign,
    'expert_langues': Globe,
    'expert_juridique': Scale,
    'expert_logement_mobilite': Home,
    'expert_campus_pedagogique': GraduationCap
  };

  const selectedExpert = council.participatingExperts[selectedExpertIdx] || council.participatingExperts[0];
  const IconComponent = expertIcons[selectedExpert.expertType] || Users;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Intelligence Collective</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[11px] font-bold border border-indigo-500/30">
                  Famille DIALLO & Experts Associés
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Conseil de Carrière Multi-Experts
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* Top Session Theme & Harmonized Synthesis */}
          <div className="bg-gradient-to-br from-indigo-950/60 to-slate-800/80 border border-indigo-500/40 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                Thématique du Conseil : {council.sessionTheme}
              </span>
              <span className="text-xs text-slate-400">Dernière délibération : {council.deliberationDate}</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles size={17} className="text-indigo-400" /> Synthèse Stratégique Harmonisée :
              </h3>
              <p className="text-xs md:text-sm text-slate-200 leading-relaxed bg-slate-900/80 p-3.5 rounded-xl border border-slate-700/60">
                {council.harmonizedSynthesis}
              </p>
            </div>
          </div>

          {/* Expert Tabs (Avatars) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {council.participatingExperts.map((exp, idx) => {
              const isSelected = idx === selectedExpertIdx;
              const ExpIcon = expertIcons[exp.expertType] || Users;
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedExpertIdx(idx)}
                  className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    isSelected 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-lg shadow-indigo-950/50' 
                      : 'bg-slate-800/60 border-slate-700/70 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-indigo-400">
                      <ExpIcon size={16} />
                    </div>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white truncate">{exp.expertName.split(' ')[0]}</h5>
                    <span className="text-[10px] text-slate-400 line-clamp-1">{exp.expertRole}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Detailed View for Selected Expert */}
          {selectedExpert && (
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-6 space-y-4 animate-fade-up">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-indigo-900/40 border border-indigo-500/30 rounded-2xl text-indigo-300">
                    <IconComponent size={22} />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white">{selectedExpert.expertName}</h4>
                    <p className="text-xs text-indigo-300">{selectedExpert.expertRole}</p>
                  </div>
                </div>

                {onConsultExpert && (
                  <button
                    onClick={() => onConsultExpert(selectedExpert.expertName, selectedExpert.expertRole)}
                    className="px-3.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto"
                  >
                    <MessageSquare size={13} /> Consulter en Direct
                  </button>
                )}
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <strong className="text-slate-300 block mb-1">Avis Spécifique de l'Expert :</strong>
                  <p className="text-slate-200 bg-slate-900/70 p-3.5 rounded-xl border border-slate-800 leading-relaxed">
                    {selectedExpert.pointOfView}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <strong className="text-emerald-400 block mb-1">Recommandation Principale :</strong>
                    <span className="text-slate-300">{selectedExpert.specificRecommendation}</span>
                  </div>
                  <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                    <strong className="text-amber-400 block mb-1">Point de Vigilance Majeur :</strong>
                    <span className="text-slate-300">{selectedExpert.riskFlag}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Conseil convoqué lors de chaque choix de bifurcation majeur</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer le Conseil
          </button>
        </div>

      </div>
    </div>
  );
};
