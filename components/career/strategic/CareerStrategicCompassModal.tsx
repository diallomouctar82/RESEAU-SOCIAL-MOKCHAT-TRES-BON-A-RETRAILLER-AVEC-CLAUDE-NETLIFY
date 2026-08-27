import React, { useState } from 'react';
import { 
  Compass, 
  MapPin, 
  Target, 
  TrendingUp, 
  Zap, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  Sparkles,
  Layers,
  Clock,
  Gauge
} from 'lucide-react';
import { StrategicCareerCompass, CareerPaceMode } from '../../types';

interface CareerStrategicCompassModalProps {
  isOpen: boolean;
  onClose: () => void;
  compass: StrategicCareerCompass;
  onUpdateCompass?: (updated: StrategicCareerCompass) => void;
  onOpenCampus?: (subjectTitle?: string) => void;
  onOpenTrajectorySimulator?: () => void;
  onOpenEvolutionPlans?: () => void;
}

export const CareerStrategicCompassModal: React.FC<CareerStrategicCompassModalProps> = ({
  isOpen,
  onClose,
  compass,
  onUpdateCompass,
  onOpenCampus,
  onOpenTrajectorySimulator,
  onOpenEvolutionPlans
}) => {
  const [activePace, setActivePace] = useState<CareerPaceMode>(compass.whatIShouldDoNow.recommendedPace);
  const [showGoalReevaluation, setShowGoalReevaluation] = useState(false);
  const [tempGoal, setTempGoal] = useState(compass.whereIWantToGo.targetPointB);
  const [tempWhy, setTempWhy] = useState(compass.whereIWantToGo.strategicWhy);

  if (!isOpen) return null;

  const handleSaveGoal = () => {
    if (onUpdateCompass) {
      onUpdateCompass({
        ...compass,
        whereIWantToGo: {
          ...compass.whereIWantToGo,
          targetPointB: tempGoal,
          strategicWhy: tempWhy,
          isConfirmed: true
        }
      });
    }
    setShowGoalReevaluation(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Compass size={24} className="animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Boussole Stratégique 4D</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[11px] font-bold border border-indigo-500/30">
                  Orientation Permanente
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Votre Cap Professionnel en 4 Dimensions
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
          
          {/* Top Banner: Explicabilité & Règle d'or */}
          <div className="bg-indigo-950/30 border border-indigo-500/30 rounded-2xl p-4 flex items-start gap-3.5">
            <Sparkles size={20} className="text-indigo-400 shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-bold text-indigo-200">Philosophie de la Boussole : </span>
              <span className="text-indigo-300/90">
                La boussole synthétise en permanence votre réalité opérationnelle sans jamais figer votre destin. Elle s’adapte à chaque apprentissage, chaque opportunité et chaque réévaluation d'ambition.
              </span>
            </div>
          </div>

          {/* Grid 4 Dimensions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* DIMENSION 1: OÙ JE SUIS (POINT A) */}
            <div className="bg-slate-800/60 border border-slate-700/70 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-slate-600 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
                    <MapPin size={18} /> 1. OÙ JE SUIS (Situation Actuelle)
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-blue-500/20 text-blue-300 font-semibold rounded-lg border border-blue-500/30">
                    Niveau de Préparation : {compass.whereIAm.readinessScore}%
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {compass.whereIAm.currentRole}
                </h3>
                <p className="text-xs text-slate-400 mb-3">
                  Séniorité estimée : <strong className="text-slate-200">{compass.whereIAm.currentSeniority}</strong>
                </p>
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Actifs Déjà Capitalisés :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {compass.whereIAm.keyAssets.map((asset, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 bg-slate-900/80 border border-slate-700 text-slate-300 rounded-md">
                        ✓ {asset}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span>Ancrage Point A validé</span>
                <span className="text-blue-400 font-medium flex items-center gap-1">
                  17 critères audités <CheckCircle2 size={13} />
                </span>
              </div>
            </div>

            {/* DIMENSION 2: OÙ JE VEUX ALLER (POINT B) */}
            <div className="bg-slate-800/60 border border-emerald-500/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-emerald-500/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                    <Target size={18} /> 2. OÙ JE VEUX ALLER (Point B)
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-emerald-500/20 text-emerald-300 font-semibold rounded-lg border border-emerald-500/30 flex items-center gap-1">
                    <Clock size={12} /> Horizon {compass.whereIWantToGo.horizonMonths} mois
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {compass.whereIWantToGo.targetPointB}
                </h3>
                <p className="text-xs text-slate-300 bg-slate-900/60 p-3 rounded-xl border border-slate-700/60 leading-relaxed mb-3">
                  « {compass.whereIWantToGo.strategicWhy} »
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={() => setShowGoalReevaluation(!showGoalReevaluation)}
                  className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw size={13} /> Réévaluer mon objectif
                </button>
                <button 
                  onClick={onOpenTrajectorySimulator}
                  className="text-xs px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 rounded-lg font-medium transition-colors"
                >
                  Explorer 5 trajectoires ➔
                </button>
              </div>
            </div>

            {/* DIMENSION 3: OÙ LE MARCHÉ ÉVOLUE */}
            <div className="bg-slate-800/60 border border-amber-500/40 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-amber-500/60 transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                    <TrendingUp size={18} /> 3. OÙ LE MARCHÉ ÉVOLUE
                  </div>
                  <span className="text-xs px-2.5 py-1 bg-amber-500/20 text-amber-300 font-semibold rounded-lg border border-amber-500/30">
                    {compass.whereMarketEvolves.weakSignalsCount} Signaux Faibles Actifs
                  </span>
                </div>
                <div className="text-xs text-amber-200/90 font-medium mb-3 bg-amber-950/40 p-2.5 rounded-xl border border-amber-500/30">
                  {compass.whereMarketEvolves.growthTrend}
                </div>
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Compétences en Forte Demande :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {compass.whereMarketEvolves.hotSkillsInDemand.map((skill, idx) => (
                      <span key={idx} className="text-xs px-2.5 py-1 bg-slate-900/90 border border-amber-500/30 text-amber-200 rounded-md">
                        🔥 {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                <span>Sources vérifiées Observatoire 2026</span>
                <span className="text-amber-400 font-medium">Veille automatisée</span>
              </div>
            </div>

            {/* DIMENSION 4: CE QUE JE DOIS FAIRE MAINTENANT */}
            <div className="bg-gradient-to-br from-indigo-900/40 to-slate-800/80 border border-indigo-500/50 rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between hover:border-indigo-400 transition-all shadow-lg shadow-indigo-950/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-sm">
                    <Zap size={18} className="text-indigo-400 animate-pulse" /> 4. CE QUE JE DOIS FAIRE MAINTENANT
                  </div>
                  <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-700">
                    <button
                      onClick={() => setActivePace('acceleration')}
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-bold transition-all ${
                        activePace === 'acceleration' 
                          ? 'bg-indigo-600 text-white shadow' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🚀 Accélération
                    </button>
                    <button
                      onClick={() => setActivePace('equilibre')}
                      className={`text-[11px] px-2 py-0.5 rounded-lg font-bold transition-all ${
                        activePace === 'equilibre' 
                          ? 'bg-emerald-600 text-white shadow' 
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      🌱 Équilibre
                    </button>
                  </div>
                </div>

                <div className="bg-indigo-950/60 border border-indigo-400/30 p-3 rounded-xl mb-3">
                  <div className="text-xs text-indigo-300 font-bold uppercase tracking-wider mb-1">Priorité N°1 Immédiate :</div>
                  <div className="text-sm font-bold text-white">
                    {compass.whatIShouldDoNow.topPriorityAction}
                  </div>
                </div>

                <div className="text-xs text-slate-300 space-y-1">
                  <div>
                    <strong className="text-indigo-300">Levier d'Accélération : </strong>
                    {compass.whatIShouldDoNow.primaryLever}
                  </div>
                  <div>
                    <strong className="text-indigo-300">Prochaine Échéance : </strong>
                    <span className="text-amber-300 font-semibold">{compass.whatIShouldDoNow.nextMilestoneDeadline}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-700/60 flex items-center justify-between">
                <button
                  onClick={onOpenEvolutionPlans}
                  className="text-xs px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Gauge size={13} /> Voir le Plan 90 Jours
                </button>
                {onOpenCampus && (
                  <button
                    onClick={() => onOpenCampus('Anglais des Affaires Internationales & Négociation C1')}
                    className="text-xs px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl border border-slate-700 transition-colors"
                  >
                    Activer sur Campus ➔
                  </button>
                )}
              </div>
            </div>

          </div>

          {/* Formulaire de Réévaluation d'Objectif (Point B n'est pas une prison) */}
          {showGoalReevaluation && (
            <div className="bg-slate-800/90 border border-emerald-500/50 rounded-2xl p-5 space-y-4 animate-fade-up">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <RefreshCw size={16} /> Réévaluation Sans Jugement : « Ton objectif est-il toujours le même ? »
                </div>
                <span className="text-xs text-slate-400">Le Point B s'adapte à vos aspirations</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Nouvel Intitulé de l'Objectif (Point B) :</label>
                  <input
                    type="text"
                    value={tempGoal}
                    onChange={(e) => setTempGoal(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Fondateur d'Entreprise Export, Directeur Régional..."
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Pourquoi cet objectif ? (Motivation Profonde) :</label>
                  <input
                    type="text"
                    value={tempWhy}
                    onChange={(e) => setTempWhy(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Ex: Créer de la valeur, autonomie, impact panafricain..."
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowGoalReevaluation(false)}
                  className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold rounded-xl"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveGoal}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30"
                >
                  Confirmer la Mise à Jour du Cap
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Boussole recalculée en temps réel avec vos preuves & opportunités</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer la Boussole
          </button>
        </div>

      </div>
    </div>
  );
};
