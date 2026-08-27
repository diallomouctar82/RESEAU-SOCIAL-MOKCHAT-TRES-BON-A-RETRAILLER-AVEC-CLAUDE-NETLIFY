import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Sparkles, 
  X, 
  Unlock, 
  ArrowRight, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  AlertCircle, 
  Award,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { CareerPlateauDiagnosis, CareerAccelerationLever } from '../../types';

interface CareerPlateauUnlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagnosis: CareerPlateauDiagnosis;
  levers: CareerAccelerationLever[];
  onOpenCampus?: (subjectTitle?: string) => void;
  onOpenEvolutionPlans?: () => void;
}

export const CareerPlateauUnlockModal: React.FC<CareerPlateauUnlockModalProps> = ({
  isOpen,
  onClose,
  diagnosis,
  levers,
  onOpenCampus,
  onOpenEvolutionPlans
}) => {
  const [unlockedState, setUnlockedState] = useState(false);
  const [selectedLeverId, setSelectedLeverId] = useState<string>(levers[0]?.id);

  if (!isOpen) return null;

  const handleTriggerUnlock = () => {
    setUnlockedState(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-600/20 border border-rose-500/30 rounded-2xl text-rose-400">
              <AlertOctagon size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400">Anticipation des Plateaux</span>
                <span className="px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded-full text-[11px] font-bold border border-rose-500/30">
                  Déblocage Stratégique
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Détection de Plateau & Commande « Débloque ma situation »
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
          
          {/* Top Diagnosis Card */}
          <div className="bg-slate-800/70 border border-rose-500/30 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 text-sm font-bold text-rose-300">
                <AlertCircle size={17} className="text-rose-400" />
                <span>Diagnostic de Stagnation Potentielle</span>
              </div>
              <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                diagnosis.plateauRiskLevel === 'faible' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                diagnosis.plateauRiskLevel === 'moyen' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                Risque : {diagnosis.plateauRiskLevel.toUpperCase()}
              </span>
            </div>

            <div className="text-sm text-slate-200 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
              <strong className="text-white block mb-1">Causes Racines Identifiées :</strong>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {diagnosis.rootCauses.map((rc, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-rose-400">•</span> {rc}
                  </li>
                ))}
              </ul>
            </div>

            {/* Commande Débloque ma situation */}
            {!unlockedState ? (
              <div className="pt-2 flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-slate-400">
                  Vous vous sentez freiné dans votre progression ou en manque de perspectives ?
                </p>
                <button
                  onClick={handleTriggerUnlock}
                  className="px-5 py-2.5 bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm rounded-xl transition-all shadow-lg shadow-rose-600/20 flex items-center gap-2"
                >
                  <Unlock size={16} />
                  <span>Activer la Commande : « Débloque ma situation »</span>
                </button>
              </div>
            ) : (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-4 rounded-xl space-y-2 animate-fade-up">
                <div className="flex items-center gap-2 text-emerald-300 font-bold text-sm">
                  <CheckCircle2 size={16} /> Commande « Débloque ma situation » enclenchée avec succès
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  L'intelligence stratégique a recalculé vos 3 actions choc pour les 7 prochains jours : activation de 2 prises de contact ciblées, valorisation de votre preuve de compétence et recadrage de votre positionnement.
                </p>
              </div>
            )}
          </div>

          {/* Section Top Leviers d'Accélération */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Zap size={16} className="text-indigo-400" /> Vos 3 Leviers d'Accélération les Plus Puissants
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {levers.map(lever => {
                const isSelected = lever.id === selectedLeverId;
                return (
                  <div
                    key={lever.id}
                    onClick={() => setSelectedLeverId(lever.id)}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected 
                        ? 'bg-indigo-950/40 border-indigo-500 shadow-lg shadow-indigo-950/40' 
                        : 'bg-slate-800/60 border-slate-700 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-bold text-indigo-400">{lever.leverType.toUpperCase()}</span>
                        <span className="text-emerald-400 font-semibold">{lever.impactRating}</span>
                      </div>
                      <h4 className="text-sm font-bold text-white mb-2">{lever.title}</h4>
                      <p className="text-xs text-slate-400 mb-3 line-clamp-3">{lever.description}</p>
                    </div>

                    <div className="pt-2 border-t border-slate-700 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Délai d'Effet :</span>
                        <strong className="text-white">{lever.timeframeToEffect}</strong>
                      </div>
                      <div className="flex items-center justify-between text-slate-300">
                        <span>Effort Requis :</span>
                        <span className="text-amber-300 font-semibold">{lever.effortRequired}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Plateaux anticipés 3 à 6 mois avant qu'ils ne surviennent</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer le Module
          </button>
        </div>

      </div>
    </div>
  );
};
