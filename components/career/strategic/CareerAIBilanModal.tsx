import React, { useState } from 'react';
import { 
  FileText, 
  Sparkles, 
  X, 
  CheckCircle2, 
  TrendingUp, 
  Mic, 
  Award, 
  Heart, 
  Users, 
  Target, 
  ShieldCheck, 
  Download,
  Share2
} from 'lucide-react';
import { CareerAIBilan } from '../../types';

interface CareerAIBilanModalProps {
  isOpen: boolean;
  onClose: () => void;
  bilan: CareerAIBilan;
  onOpenVoiceBilan?: () => void;
}

export const CareerAIBilanModal: React.FC<CareerAIBilanModalProps> = ({
  isOpen,
  onClose,
  bilan,
  onOpenVoiceBilan
}) => {
  const [downloaded, setDownloaded] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <FileText size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-indigo-400">Synthèse Globale Périodique</span>
                <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded-full text-[11px] font-bold border border-indigo-500/30">
                  Audit 5 Piliers
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Bilan de Carrière IA Approfondi
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
          
          {/* Top Period & Score Banner */}
          <div className="bg-slate-800/80 border border-indigo-500/30 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Période Auditée : {bilan.evaluationPeriod}
              </span>
              <h3 className="text-lg font-bold text-white">
                État Général de votre Trajectoire
              </h3>
              <p className="text-xs text-slate-400 mt-1">Généré le {bilan.generatedDate}</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-indigo-950/80 border border-indigo-500/40 rounded-xl text-center">
                <div className="text-xl font-black text-indigo-400">{bilan.overallMomentumScore}/100</div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Dynamique</span>
              </div>

              {onOpenVoiceBilan && (
                <button
                  onClick={onOpenVoiceBilan}
                  className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Mic size={15} />
                  <span>Bilan Vocal Coach 3D</span>
                </button>
              )}
            </div>
          </div>

          {/* 5 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* Pilier 1: Compétences */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                  <Award size={16} /> 1. Compétences Acquises
                </div>
                <span className="text-xs font-bold text-blue-300">{bilan.pillarScores.skillsAcquired}/100</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {bilan.pillarsDetails.skillsHighlights.map((s, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-blue-400">✓</span> {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pilier 2: Réseau */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs">
                  <Users size={16} /> 2. Réseau & Relations
                </div>
                <span className="text-xs font-bold text-indigo-300">{bilan.pillarScores.networkExpanded}/100</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {bilan.pillarsDetails.networkHighlights.map((n, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-indigo-400">✓</span> {n}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pilier 3: Résultats */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                  <CheckCircle2 size={16} /> 3. Résultats Obtenus
                </div>
                <span className="text-xs font-bold text-emerald-300">{bilan.pillarScores.resultsAchieved}/100</span>
              </div>
              <ul className="text-xs text-slate-300 space-y-1">
                {bilan.pillarsDetails.resultsHighlights.map((r, idx) => (
                  <li key={idx} className="flex items-center gap-1.5">
                    <span className="text-emerald-400">✓</span> {r}
                  </li>
                ))}
              </ul>
            </div>

            {/* Pilier 4: Progression Point B */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-purple-400 font-bold text-xs">
                  <Target size={16} /> 4. Progression Point B
                </div>
                <span className="text-xs font-bold text-purple-300">{bilan.pillarScores.progressionToPointB}/100</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Avancement mesuré à {bilan.pillarScores.progressionToPointB}% par rapport au cahier des charges initial.
              </p>
            </div>

            {/* Pilier 5: Énergie & Épanouissement */}
            <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                  <Heart size={16} /> 5. Énergie & Épanouissement
                </div>
                <span className="text-xs font-bold text-rose-300">{bilan.pillarScores.energyAndFulfillment}/100</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Indice de charge mentale optimal, alignement fort avec le projet personnel.
              </p>
            </div>

            {/* Action Download Report */}
            <div className="bg-slate-800/60 border border-indigo-500/30 rounded-2xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-xs font-bold text-white block mb-1">Rapport de Synthèse Complet</span>
                <p className="text-[11px] text-slate-400">PDF certifié pour entretiens annuels, banques ou candidatures d'élite.</p>
              </div>
              <button
                onClick={handleDownload}
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                {downloaded ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Download size={14} />}
                <span>{downloaded ? 'Rapport Téléchargé !' : 'Télécharger le Bilan (PDF)'}</span>
              </button>
            </div>

          </div>

          {/* Strategic Recommendation */}
          <div className="bg-gradient-to-r from-indigo-950/40 to-slate-800/70 border border-indigo-500/30 rounded-2xl p-5 space-y-2">
            <h4 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" /> Recommandation Stratégique pour le Prochain Trimestre :
            </h4>
            <p className="text-xs md:text-sm text-slate-200 leading-relaxed">
              {bilan.strategicRecommendation}
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Bilan archivé dans votre historique sécurisé de carrière</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer le Bilan
          </button>
        </div>

      </div>
    </div>
  );
};
