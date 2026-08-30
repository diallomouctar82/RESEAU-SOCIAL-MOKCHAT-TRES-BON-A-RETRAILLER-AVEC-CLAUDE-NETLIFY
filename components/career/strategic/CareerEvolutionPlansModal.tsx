import React, { useState } from 'react';
import { 
  Calendar, 
  CheckCircle2, 
  Clock, 
  X, 
  Zap, 
  Heart, 
  Flag, 
  ArrowRight, 
  Gauge, 
  Layers, 
  Award, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { EvolutionPlan90Days, YearlyMilestonePlan, CareerCheckpoint, CareerPaceMode } from '../../../types';

interface CareerEvolutionPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
  plan90Days: EvolutionPlan90Days;
  yearlyPlan: YearlyMilestonePlan;
  checkpoints: CareerCheckpoint[];
  onToggleActionDone?: (period: 'month1' | 'month2' | 'month3', actionId: string) => void;
  onOpenCampus?: (subjectTitle?: string) => void;
}

export const CareerEvolutionPlansModal: React.FC<CareerEvolutionPlansModalProps> = ({
  isOpen,
  onClose,
  plan90Days,
  yearlyPlan,
  checkpoints,
  onToggleActionDone,
  onOpenCampus
}) => {
  const [activeTab, setActiveTab] = useState<'90days' | '1year' | 'checkpoints'>('90days');
  const [activePace, setActivePace] = useState<CareerPaceMode>(plan90Days.activePace);
  const [planState, setPlanState] = useState<EvolutionPlan90Days>(plan90Days);

  if (!isOpen) return null;

  const handleToggle = (period: 'month1' | 'month2' | 'month3', actionId: string) => {
    setPlanState(prev => {
      const monthKey = period === 'month1' ? 'month1_30d' : period === 'month2' ? 'month2_60d' : 'month3_90d';
      const updatedActions = prev[monthKey].priorityActions.map(act => 
        act.id === actionId ? { ...act, isDone: !act.isDone } : act
      );
      return {
        ...prev,
        [monthKey]: {
          ...prev[monthKey],
          priorityActions: updatedActions
        }
      };
    });
    if (onToggleActionDone) onToggleActionDone(period, actionId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Calendar size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Plans Temporels & Jalons</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[11px] font-bold border border-indigo-500/30">
                  Exécution Réaliste
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Plan d'Évolution 90 Jours, 1 An & Checkpoints
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

        {/* Sub-Tabs & Pace Switcher */}
        <div className="px-6 pt-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('90days')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
                activeTab === '90days'
                  ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Clock size={15} /> Plan 90 Jours (30-60-90j)
            </button>
            <button
              onClick={() => setActiveTab('1year')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
                activeTab === '1year'
                  ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Calendar size={15} /> Plan 1 An (T1 à T4)
            </button>
            <button
              onClick={() => setActiveTab('checkpoints')}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
                activeTab === 'checkpoints'
                  ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                  : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Flag size={15} /> 5 Checkpoints du Parcours
            </button>
          </div>

          {/* Rythme Mode Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActivePace('acceleration')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activePace === 'acceleration' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Zap size={13} /> Mode Accélération
            </button>
            <button
              onClick={() => setActivePace('equilibre')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activePace === 'equilibre' 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Heart size={13} /> Mode Équilibre
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* TAB 1: PLAN 90 JOURS */}
          {activeTab === '90days' && (
            <div className="space-y-6 animate-fade-up">
              
              <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider block mb-1">
                    Objectif Intermédiaire Recherché à J+90 :
                  </span>
                  <h4 className="text-base font-bold text-white">
                    « {planState.targetInterimGoal} »
                  </h4>
                </div>
                <div className="text-xs text-slate-400">
                  Rythme actif : <strong className="text-white capitalize">{activePace}</strong> (adapté à votre disponibilité)
                </div>
              </div>

              {/* 3 Columns Month 1, 2, 3 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* MOIS 1 (30j) */}
                <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold rounded-md">Mois 1 (30 jours)</span>
                      <span className="text-slate-400">Immédiat</span>
                    </div>
                    <h5 className="text-xs font-bold text-white mb-2">{planState.month1_30d.theme}</h5>
                    
                    <div className="space-y-2">
                      {planState.month1_30d.priorityActions.map(act => (
                        <div 
                          key={act.id} 
                          onClick={() => handleToggle('month1', act.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            act.isDone 
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-80' 
                              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input 
                              type="checkbox" 
                              checked={act.isDone} 
                              readOnly 
                              className="mt-0.5 rounded accent-emerald-500 cursor-pointer" 
                            />
                            <span>{act.title}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pl-5">
                            <span>Échéance : {act.deadline}</span>
                            <span className="text-indigo-400 font-bold">Impact {act.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400">
                    Focus compétences : {planState.month1_30d.focusSkills.join(', ')}
                  </div>
                </div>

                {/* MOIS 2 (60j) */}
                <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded-md">Mois 2 (60 jours)</span>
                      <span className="text-slate-400">Intermédiaire</span>
                    </div>
                    <h5 className="text-xs font-bold text-white mb-2">{planState.month2_60d.theme}</h5>
                    
                    <div className="space-y-2">
                      {planState.month2_60d.priorityActions.map(act => (
                        <div 
                          key={act.id} 
                          onClick={() => handleToggle('month2', act.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            act.isDone 
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-80' 
                              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input 
                              type="checkbox" 
                              checked={act.isDone} 
                              readOnly 
                              className="mt-0.5 rounded accent-emerald-500 cursor-pointer" 
                            />
                            <span>{act.title}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pl-5">
                            <span>Échéance : {act.deadline}</span>
                            <span className="text-indigo-400 font-bold">Impact {act.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700 text-[11px] text-slate-400">
                    Focus compétences : {planState.month2_60d.focusSkills.join(', ')}
                  </div>
                </div>

                {/* MOIS 3 (90j) */}
                <div className="bg-slate-800/70 border border-emerald-500/40 rounded-2xl p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-md">Mois 3 (90 jours)</span>
                      <span className="text-emerald-400 font-bold">Résultat</span>
                    </div>
                    <h5 className="text-xs font-bold text-white mb-2">{planState.month3_90d.theme}</h5>
                    
                    <div className="space-y-2">
                      {planState.month3_90d.priorityActions.map(act => (
                        <div 
                          key={act.id} 
                          onClick={() => handleToggle('month3', act.id)}
                          className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                            act.isDone 
                              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 line-through opacity-80' 
                              : 'bg-slate-900 border-slate-700 text-slate-200 hover:border-slate-500'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <input 
                              type="checkbox" 
                              checked={act.isDone} 
                              readOnly 
                              className="mt-0.5 rounded accent-emerald-500 cursor-pointer" 
                            />
                            <span>{act.title}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 pl-5">
                            <span>Échéance : {act.deadline}</span>
                            <span className="text-emerald-400 font-bold">Impact {act.impact}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-700 text-[11px] text-emerald-300 font-medium">
                    Critères de succès : {planState.month3_90d.successCriteria.length} indicateurs mesurables
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: PLAN 1 AN (T1 À T4) */}
          {activeTab === '1year' && (
            <div className="space-y-6 animate-fade-up">
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-2xl p-4">
                <h4 className="text-base font-bold text-white">{yearlyPlan.yearTarget}</h4>
                <p className="text-xs text-slate-400 mt-1">Chaque trimestre comporte un livrable concret et une réévaluation automatique du cap.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { q: 'Trimestre 1', data: yearlyPlan.quarter1 },
                  { q: 'Trimestre 2', data: yearlyPlan.quarter2 },
                  { q: 'Trimestre 3', data: yearlyPlan.quarter3 },
                  { q: 'Trimestre 4', data: yearlyPlan.quarter4 }
                ].map((item, idx) => (
                  <div 
                    key={idx}
                    className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
                      item.data.isCurrent 
                        ? 'bg-purple-950/40 border-purple-500 shadow-lg shadow-purple-950/40' 
                        : 'bg-slate-800/60 border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-purple-300">{item.q}</span>
                        {item.data.isCurrent && (
                          <span className="px-2 py-0.5 bg-purple-600 text-white font-bold rounded-md text-[10px]">
                            En Cours
                          </span>
                        )}
                      </div>
                      <h5 className="text-sm font-bold text-white mb-2">{item.data.title}</h5>
                      <p className="text-xs text-slate-300 mb-2 leading-relaxed">
                        <strong className="text-slate-400">Focus : </strong>{item.data.mainFocus}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-700 text-xs">
                      <strong className="text-purple-300 block mb-0.5">Livrable Attendu :</strong>
                      <span className="text-slate-300 text-[11px]">{item.data.expectedDeliverable}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 5 CHECKPOINTS */}
          {activeTab === 'checkpoints' && (
            <div className="space-y-4 animate-fade-up">
              {checkpoints.map(cp => {
                const statusStyles = {
                  valide: { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', text: 'Validé ✓' },
                  en_cours: { badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', text: 'En Cours ⏳' },
                  a_venir: { badge: 'bg-slate-800 text-slate-400 border-slate-700', text: 'À Venir' }
                }[cp.status];

                return (
                  <div 
                    key={cp.id} 
                    className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                          {cp.id}
                        </span>
                        <h4 className="text-base font-bold text-white">{cp.name}</h4>
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border ${statusStyles.badge}`}>
                          {statusStyles.text}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 pl-9">{cp.description}</p>
                      
                      <div className="pl-9 pt-2">
                        <span className="text-[11px] font-semibold text-slate-400 block mb-1">Critères de validation :</span>
                        <div className="flex flex-wrap gap-1.5">
                          {cp.keyValidationCriteria.map((crit, cIdx) => (
                            <span key={cIdx} className="text-[11px] px-2.5 py-0.5 bg-slate-900 border border-slate-700 text-slate-300 rounded-md">
                              • {crit}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-bold text-white">{cp.completionPercentage}%</div>
                        <span className="text-[10px] text-slate-400">Complétion</span>
                      </div>
                      <div className="w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="bg-indigo-500 h-full rounded-full transition-all" 
                          style={{ width: `${cp.completionPercentage}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Plans synchronisés avec votre agenda et vos disponibilités réelles</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer les Plans
          </button>
        </div>

      </div>
    </div>
  );
};
