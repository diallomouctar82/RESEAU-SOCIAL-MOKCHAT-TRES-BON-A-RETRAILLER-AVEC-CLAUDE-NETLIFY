import React, { useState } from 'react';
import { 
  GitFork, 
  TrendingUp, 
  Sparkles, 
  X, 
  Globe, 
  Briefcase, 
  GraduationCap, 
  Building2, 
  HelpCircle, 
  ShieldAlert, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  Compass, 
  ArrowRight,
  Layers,
  Send,
  Zap
} from 'lucide-react';
import { CareerTrajectorySimulation, WhatIfScenario, CareerGraphNode } from '../../../types';
import { generateJSON } from '../../../services/aiGateway';

interface CareerTrajectorySimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  trajectories: CareerTrajectorySimulation[];
  whatIfScenarios: WhatIfScenario[];
  careerGraphNodes: CareerGraphNode[];
  onOpenCampus?: (subjectTitle?: string) => void;
}

export const CareerTrajectorySimulatorModal: React.FC<CareerTrajectorySimulatorModalProps> = ({
  isOpen,
  onClose,
  trajectories,
  whatIfScenarios,
  careerGraphNodes,
  onOpenCampus
}) => {
  const [selectedTrajectoryId, setSelectedTrajectoryId] = useState<string>(trajectories[1]?.id || trajectories[0]?.id);
  const [activeTab, setActiveTab] = useState<'trajectories' | 'what_if' | 'career_graph'>('trajectories');
  
  // Interactive "Et si ?" State
  const [customQuestion, setCustomQuestion] = useState('');
  const [scenariosList, setScenariosList] = useState<WhatIfScenario[]>(whatIfScenarios);
  const [isSimulating, setIsSimulating] = useState(false);

  if (!isOpen) return null;

  const selectedTrajectory = trajectories.find(t => t.id === selectedTrajectoryId) || trajectories[0];

  const handleSimulateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuestion.trim()) return;

    setIsSimulating(true);

    // Fallback conservateur si l'IA est indisponible : identique à l'ancien
    // comportement (garanti), mais désormais utilisé seulement en secours.
    const buildFallback = (): WhatIfScenario => ({
      id: `custom_${Date.now()}`,
      promptQuestion: customQuestion,
      category: 'specialisation',
      impactOnPointB: `Hypothèse testée : recalcule un gain de 4 à 8 mois en augmentant l'adéquation sectorielle de +28%.`,
      newTrajectoryUnlocked: 'Trajectoire Hybride Personnalisée',
      timeframeImpact: 'Optimisation de -4 mois estimée',
      marketOpeningsBonusPercent: 35,
      financialImpactEstimate: '+15k€ à +30k€ potentiel selon le degré d\'engagement',
      riskAssessment: 'Niveau de risque modéré : nécessite un temps d\'apprentissage dédié de 5h/semaine.',
      suggestedFirstStep: 'Découper cet objectif en un module d\'entraînement de 30 jours et valider une preuve concrète.'
    });

    try {
      const prompt = `Tu es le Simulateur Stratégique de Carrière de Le Monde à Vous.
Trajectoire actuellement à l'étude : "${selectedTrajectory?.title || 'Non définie'}" — ${selectedTrajectory?.summary || ''}.
Hypothèse posée par l'utilisateur : "${customQuestion}"

Analyse cette hypothèse avec rigueur et nuance (jamais comme une certitude ou une promesse figée).
Réponds en JSON strict avec exactement ces clés :
{
  "impactOnPointB": "Impact concret sur l'objectif Point B en 1-2 phrases...",
  "newTrajectoryUnlocked": "Nom court de la trajectoire ou variante débloquée...",
  "timeframeImpact": "Effet estimé sur le délai (ex: -2 mois, +3 mois, neutre)...",
  "marketOpeningsBonusPercent": 20,
  "financialImpactEstimate": "Estimation financière indicative...",
  "riskAssessment": "Niveau de risque et ce qu'il implique concrètement...",
  "suggestedFirstStep": "Premier pas concret et actionnable..."
}`;

      const parsed = await generateJSON<Partial<WhatIfScenario>>(prompt);
      const fallback = buildFallback();

      const newScenario: WhatIfScenario = {
        id: fallback.id,
        promptQuestion: customQuestion,
        category: 'specialisation',
        impactOnPointB: parsed?.impactOnPointB || fallback.impactOnPointB,
        newTrajectoryUnlocked: parsed?.newTrajectoryUnlocked || fallback.newTrajectoryUnlocked,
        timeframeImpact: parsed?.timeframeImpact || fallback.timeframeImpact,
        marketOpeningsBonusPercent: parsed?.marketOpeningsBonusPercent ?? fallback.marketOpeningsBonusPercent,
        financialImpactEstimate: parsed?.financialImpactEstimate || fallback.financialImpactEstimate,
        riskAssessment: parsed?.riskAssessment || fallback.riskAssessment,
        suggestedFirstStep: parsed?.suggestedFirstStep || fallback.suggestedFirstStep
      };

      setScenariosList(prev => [newScenario, ...prev]);
      setCustomQuestion('');
    } catch (err) {
      console.error('What-if simulation error', err);
      setScenariosList(prev => [buildFallback(), ...prev]);
      setCustomQuestion('');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400">
              <GitFork size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-400">Simulateur & Trajectoires</span>
                <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-full text-[11px] font-bold border border-purple-500/30">
                  Exploration des Futurs Possibles
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Simulateur de Trajectoires & Mode « Et Si ? »
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

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 bg-slate-950/60 border-b border-slate-800 flex gap-3 overflow-x-auto">
          <button
            onClick={() => setActiveTab('trajectories')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'trajectories'
                ? 'border-purple-500 text-purple-300 bg-purple-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <TrendingUp size={15} /> 5 Trajectoires Types (A à E)
          </button>
          <button
            onClick={() => setActiveTab('what_if')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'what_if'
                ? 'border-indigo-500 text-indigo-300 bg-indigo-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles size={15} /> Mode « Et Si ? » Conversationnel
          </button>
          <button
            onClick={() => setActiveTab('career_graph')}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'career_graph'
                ? 'border-emerald-500 text-emerald-300 bg-emerald-500/10'
                : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Layers size={15} /> Career Graph Non-Linéaire
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-200">
          
          {/* TAB 1: 5 TRAJECTOIRES TYPES */}
          {activeTab === 'trajectories' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* Disclaimer */}
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-3 text-xs text-slate-400">
                <ShieldAlert size={18} className="text-amber-400 shrink-0" />
                <span>
                  <strong className="text-slate-200">Règle Déontologique :</strong> Une simulation est un outil d'aide à la décision stratégique pour peser les opportunités, contraintes et investissements. Elle ne constitue en aucun cas une promesse certaine ou une prédiction figée.
                </span>
              </div>

              {/* Trajectories Selector (5 Badges) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {trajectories.map((traj) => {
                  const isSelected = traj.id === selectedTrajectoryId;
                  return (
                    <button
                      key={traj.id}
                      onClick={() => setSelectedTrajectoryId(traj.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                        isSelected 
                          ? 'bg-purple-950/40 border-purple-500 text-white shadow-lg shadow-purple-950/50' 
                          : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={`w-6 h-6 rounded-lg text-xs font-black flex items-center justify-center ${
                            isSelected ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {traj.code}
                          </span>
                          <span className="text-[11px] font-bold text-emerald-400">
                            Fit {traj.fitScore}%
                          </span>
                        </div>
                        <h4 className="text-xs font-bold line-clamp-2 text-white">
                          {traj.title.split(':')[1] || traj.title}
                        </h4>
                      </div>
                      <div className="mt-3 pt-2 border-t border-slate-700/50 flex items-center justify-between text-[11px] text-slate-400">
                        <span>{traj.targetHorizonMonths} mois</span>
                        <span className="text-purple-300 font-semibold">{traj.feasibilityRating}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected Trajectory Deep-Dive Card */}
              {selectedTrajectory && (
                <div className="bg-slate-800/70 border border-purple-500/30 rounded-3xl p-6 space-y-6 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-700">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-purple-400 mb-1">
                        <span>Trajectoire {selectedTrajectory.code}</span> • <span>Horizon Cible : {selectedTrajectory.targetHorizonMonths} mois</span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {selectedTrajectory.title}
                      </h3>
                      <p className="text-xs md:text-sm text-slate-300 mt-1 max-w-3xl">
                        {selectedTrajectory.summary}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="bg-purple-950/60 border border-purple-500/30 px-3.5 py-2 rounded-xl text-center">
                        <div className="text-[11px] text-purple-300 font-bold uppercase">Faisabilité</div>
                        <div className="text-sm font-bold text-white">{selectedTrajectory.feasibilityRating}</div>
                      </div>
                      <div className="bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-center">
                        <div className="text-[11px] text-emerald-300 font-bold uppercase">ROI Potentiel</div>
                        <div className="text-xs font-bold text-emerald-300">{selectedTrajectory.potentialROI}</div>
                      </div>
                    </div>
                  </div>

                  {/* 3 Key Stages (Timeline) */}
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Clock size={14} className="text-purple-400" /> Étapes Clés de la Trajectoire
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedTrajectory.keyStages.map((stage, idx) => (
                        <div key={idx} className="bg-slate-900/80 border border-slate-700/80 rounded-2xl p-4 space-y-2">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-black px-2 py-0.5 bg-purple-600/30 text-purple-300 rounded-md">
                              Étape {stage.stageOrder}
                            </span>
                            <span className="text-slate-400 font-medium">{stage.duration}</span>
                          </div>
                          <h5 className="text-sm font-bold text-white">{stage.title}</h5>
                          <p className="text-xs text-slate-400 leading-relaxed">
                            <strong className="text-slate-300">Jalon à valider : </strong>
                            {stage.milestone}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 2 Columns Details: Opportunities vs Risks/Investments */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-900/60 border border-emerald-500/30 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Opportunités & Compétences Clés
                      </h4>
                      <div className="space-y-2">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Compétences à consolider :</span>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedTrajectory.skillsToAcquire.map((sk, idx) => (
                              <span key={idx} className="text-xs px-2.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 rounded-md">
                                + {sk}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Débouchés cibles :</span>
                          <ul className="text-xs text-slate-300 space-y-1">
                            {selectedTrajectory.keyOpportunities.map((op, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="text-emerald-400">➔</span> {op}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                        <ShieldAlert size={14} /> Contraintes, Risques & Investissement
                      </h4>
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 block mb-1">Points de vigilance :</span>
                          <ul className="text-slate-300 space-y-1">
                            {selectedTrajectory.constraintsAndRisks.map((risk, idx) => (
                              <li key={idx} className="flex items-center gap-1.5">
                                <span className="text-amber-400">⚠</span> {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-slate-300">
                          <span>Investissement Financier Indicatif :</span>
                          <strong className="text-white">{selectedTrajectory.estimatedFinancialInvestment}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

            </div>
          )}

          {/* TAB 2: MODE « ET SI ? » CONVERSATIONNEL */}
          {activeTab === 'what_if' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* Input Interactive Form */}
              <form onSubmit={handleSimulateCustom} className="bg-slate-900/60 border border-indigo-500/30 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-300">
                  <Sparkles size={16} className="text-indigo-400" />
                  <span>Posez une hypothèse d'évolution : « Et si... ? »</span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    placeholder="Ex: Et si j'apprenais l'espagnol ? Et si je créais mon agence à Abidjan ? Et si je passais 6 mois en freelance ?"
                    className="flex-1 bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={isSimulating || !customQuestion.trim()}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs md:text-sm rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30 shrink-0"
                  >
                    {isSimulating ? <Zap size={15} className="animate-spin" /> : <Send size={15} />}
                    <span>Simuler l'Impact</span>
                  </button>
                </div>
                <div className="flex items-center gap-2 flex-wrap text-xs text-slate-400">
                  <span>Suggestions rapides :</span>
                  {['Et si j\'apprenais l\'anglais C1 ?', 'Et si je faisais un Master en ligne ?', 'Et si je partais au Canada ?'].map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCustomQuestion(sug)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </form>

              {/* Scenarios List */}
              <div className="space-y-4">
                {scenariosList.map((scen) => (
                  <div key={scen.id} className="bg-slate-800/70 border border-slate-700 rounded-2xl p-5 space-y-3 hover:border-indigo-500/40 transition-all">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <h4 className="text-base font-bold text-white flex items-center gap-2">
                        <span className="text-indigo-400">❓</span> {scen.promptQuestion}
                      </h4>
                      <span className="text-xs px-2.5 py-1 bg-indigo-600/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30">
                        + {scen.marketOpeningsBonusPercent}% d'ouvertures de marché
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 block font-semibold mb-1">Impact sur le Point B :</span>
                        <p className="text-slate-200">{scen.impactOnPointB}</p>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 block font-semibold mb-1">Impact Temporel & Financier :</span>
                        <p className="text-slate-200">
                          <strong>Délai :</strong> {scen.timeframeImpact}<br />
                          <strong>Gain :</strong> {scen.financialImpactEstimate}
                        </p>
                      </div>
                      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 block font-semibold mb-1">Premier Pas Recommandé :</span>
                        <p className="text-emerald-300 font-medium">{scen.suggestedFirstStep}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

          {/* TAB 3: CAREER GRAPH NON-LINÉAIRE */}
          {activeTab === 'career_graph' && (
            <div className="space-y-6 animate-fade-up">
              
              <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-4 text-xs text-slate-300 leading-relaxed">
                <strong className="text-white">Le Career Graph :</strong> Visualisation des nœuds d'évolution possibles à partir de votre position actuelle. Il intègre aussi bien la promotion verticale que les branches de spécialisation, d'expatriation, d'entrepreneuriat ou de reconversion.
              </div>

              {/* Grid of Nodes */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {careerGraphNodes.map((node) => (
                  <div 
                    key={node.id} 
                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                      node.isUnlocked
                        ? 'bg-slate-800/80 border-slate-700 hover:border-emerald-500/50'
                        : 'bg-slate-900/40 border-slate-800/80 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] px-2 py-0.5 bg-slate-900 text-slate-400 rounded-md font-mono">
                          Niveau {node.tierLevel}
                        </span>
                        <span className={`text-xs font-bold ${
                          node.matchScore >= 80 ? 'text-emerald-400' : node.matchScore >= 70 ? 'text-amber-400' : 'text-slate-400'
                        }`}>
                          Adéquation {node.matchScore}%
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-1">
                        {node.roleTitle}
                      </h4>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-2">
                        {node.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-700/60 text-[11px]">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Horizon :</span>
                        <strong className="text-white">{node.avgTimeHorizonYears}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Fourchette Indicative :</span>
                        <span className="text-emerald-300 font-semibold">{node.avgCompensationBracket}</span>
                      </div>
                      <div className="pt-1">
                        <span className="text-slate-400 block mb-1">Compétences nécessaires :</span>
                        <div className="flex flex-wrap gap-1">
                          {node.keySkillsRequired.map((sk, idx) => (
                            <span key={idx} className="px-1.5 py-0.5 bg-slate-900 text-slate-300 rounded text-[10px]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Toutes les simulations sont modifiables et recalculées en continu</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer le Simulateur
          </button>
        </div>

      </div>
    </div>
  );
};
