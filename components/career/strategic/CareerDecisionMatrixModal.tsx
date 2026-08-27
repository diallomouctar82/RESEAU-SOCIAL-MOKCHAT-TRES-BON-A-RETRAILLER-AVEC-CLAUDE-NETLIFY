import React, { useState } from 'react';
import { 
  Scale, 
  Sparkles, 
  X, 
  CheckCircle2, 
  Sliders, 
  ArrowRight, 
  BarChart3, 
  Award, 
  HelpCircle,
  Plus
} from 'lucide-react';
import { PersonalDecisionMatrix, DecisionCriteriaConfig, OpportunityEvaluation } from '../../types';

interface CareerDecisionMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  decisionMatrix: PersonalDecisionMatrix;
}

export const CareerDecisionMatrixModal: React.FC<CareerDecisionMatrixModalProps> = ({
  isOpen,
  onClose,
  decisionMatrix
}) => {
  const [criteriaList, setCriteriaList] = useState<DecisionCriteriaConfig[]>(decisionMatrix.criteria);
  const [opportunities, setOpportunities] = useState<OpportunityEvaluation[]>(decisionMatrix.evaluatedOpportunities);
  const [activeView, setActiveView] = useState<'matrix' | 'adjust_weights'>('matrix');

  if (!isOpen) return null;

  const handleWeightChange = (criteriaId: string, newWeight: number) => {
    const updated = criteriaList.map(c => c.id === criteriaId ? { ...c, userWeight: newWeight } : c);
    setCriteriaList(updated);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Scale size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">Matrice Décisionnelle</span>
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-500/30">
                  10 Critères Pondérés
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Matrice de Décision Personnelle & Comparateur
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

        {/* View Switcher */}
        <div className="px-6 pt-3 bg-slate-950/60 border-b border-slate-800 flex gap-3">
          <button
            onClick={() => setActiveView('matrix')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
              activeView === 'matrix'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <BarChart3 size={15} /> Comparaison Multicritères
          </button>
          <button
            onClick={() => setActiveView('adjust_weights')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 ${
              activeView === 'adjust_weights'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sliders size={15} /> Ajuster mes 10 Priorités
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* TAB 1: COMPARATEUR MULTICRITÈRES */}
          {activeView === 'matrix' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* Opportunities Compared Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {opportunities.map(opp => (
                  <div key={opp.opportunityId} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                      <div>
                        <h4 className="text-base font-bold text-white">{opp.opportunityTitle}</h4>
                        <span className="text-xs text-slate-400">{opp.organizationName}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-400">{opp.totalWeightedScore.toFixed(1)}/100</div>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold">Score Global</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-emerald-400 font-bold block mb-1">Forces Principales :</span>
                        <div className="flex flex-wrap gap-1">
                          {opp.prosHighlights.map((pro, pIdx) => (
                            <span key={pIdx} className="px-2 py-0.5 bg-emerald-950/60 text-emerald-300 rounded text-[11px]">
                              ✓ {pro}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                        <span className="text-rose-400 font-bold block mb-1">Points de Frottement / Risques :</span>
                        <div className="flex flex-wrap gap-1">
                          {opp.consHighlights.map((con, cIdx) => (
                            <span key={cIdx} className="px-2 py-0.5 bg-rose-950/60 text-rose-300 rounded text-[11px]">
                              ⚠ {con}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 text-slate-300">
                        <strong className="text-indigo-300">Synthèse d'Adéquation : </strong>
                        {opp.fitSummary}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table of 10 Criteria Detail */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 overflow-x-auto">
                <h4 className="text-sm font-bold text-white mb-3">Détail des Notes par Critère</h4>
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700">
                      <th className="pb-2">Critère</th>
                      <th className="pb-2">Poids</th>
                      {opportunities.map(opp => (
                        <th key={opp.opportunityId} className="pb-2 text-right">{opp.opportunityTitle}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {criteriaList.map(crit => (
                      <tr key={crit.id} className="hover:bg-slate-800/50">
                        <td className="py-2.5 font-medium text-slate-200">{crit.name}</td>
                        <td className="py-2.5 text-slate-400 font-mono">{crit.userWeight}/10</td>
                        {opportunities.map(opp => (
                          <td key={opp.opportunityId} className="py-2.5 text-right font-bold text-emerald-300">
                            {opp.criteriaScores[crit.id] || 7}/10
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 2: AJUSTER MES 10 PRIORITÉS */}
          {activeView === 'adjust_weights' && (
            <div className="space-y-4 animate-fade-up">
              <p className="text-xs text-slate-300 bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-2xl">
                Ajustez le poids de chaque critère selon vos priorités actuelles. Votre matrice recalculera instantanément le score de pertinence de chaque opportunité.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {criteriaList.map(crit => (
                  <div key={crit.id} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{crit.name}</span>
                      <span className="font-mono text-emerald-400 font-bold">{crit.userWeight} / 10</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{crit.description}</p>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={crit.userWeight}
                      onChange={(e) => handleWeightChange(crit.id, parseInt(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>La matrice éclaire votre décision sans jamais décider à votre place</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer la Matrice
          </button>
        </div>

      </div>
    </div>
  );
};
