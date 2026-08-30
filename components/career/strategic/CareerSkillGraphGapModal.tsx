import React, { useState } from 'react';
import { 
  Network, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  TrendingUp, 
  X, 
  GraduationCap, 
  Sparkles, 
  ShieldAlert, 
  ArrowRight, 
  HelpCircle,
  Eye,
  Filter,
  DollarSign
} from 'lucide-react';
import { SkillGraphItem, MarketWeakSignal } from '../../../types';

interface CareerSkillGraphGapModalProps {
  isOpen: boolean;
  onClose: () => void;
  skillGraph: SkillGraphItem[];
  weakSignals: MarketWeakSignal[];
  activeGoalTitle: string;
  onOpenCampus?: (subjectTitle?: string) => void;
}

export const CareerSkillGraphGapModal: React.FC<CareerSkillGraphGapModalProps> = ({
  isOpen,
  onClose,
  skillGraph,
  weakSignals,
  activeGoalTitle,
  onOpenCampus
}) => {
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<SkillGraphItem | null>(null);

  if (!isOpen) return null;

  const filteredSkills = skillGraph.filter(item => {
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    const matchesStat = filterStatus === 'all' || item.status === filterStatus;
    return matchesCat && matchesStat;
  });

  const masteredCount = skillGraph.filter(s => s.status === 'maitrisee').length;
  const fragileCount = skillGraph.filter(s => s.status === 'fragile').length;
  const missingCount = skillGraph.filter(s => s.status === 'absente').length;
  const priorityCount = skillGraph.filter(s => s.status === 'prioritaire').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/70 rounded-3xl w-full max-w-6xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Header */}
        <div className="p-6 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400">
              <Network size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-400">Skill Graph & Analyse des Écarts</span>
                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[11px] font-bold border border-blue-500/30">
                  Cartographie Objective
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
                Carte des Écarts & Passerelle Campus
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
          
          {/* Top Goal Summary & Gap Statistics */}
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Analyse des compétences requises pour l'objectif :
              </span>
              <h3 className="text-lg font-bold text-white">
                {activeGoalTitle}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              <div className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-center">
                <div className="text-xs font-bold text-emerald-400">{masteredCount}</div>
                <div className="text-[10px] text-slate-400 font-medium">Maîtrisées</div>
              </div>
              <div className="px-3 py-1.5 bg-amber-950/60 border border-amber-500/30 rounded-xl text-center">
                <div className="text-xs font-bold text-amber-400">{fragileCount}</div>
                <div className="text-[10px] text-slate-400 font-medium">Fragiles</div>
              </div>
              <div className="px-3 py-1.5 bg-rose-950/60 border border-rose-500/30 rounded-xl text-center">
                <div className="text-xs font-bold text-rose-400">{missingCount}</div>
                <div className="text-[10px] text-slate-400 font-medium">Absentes</div>
              </div>
              <div className="px-3 py-1.5 bg-indigo-950/60 border border-indigo-500/30 rounded-xl text-center">
                <div className="text-xs font-bold text-indigo-400">{priorityCount}</div>
                <div className="text-[10px] text-slate-400 font-medium">Prioritaires</div>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 flex-wrap text-xs">
              <span className="text-slate-400 font-medium flex items-center gap-1">
                <Filter size={13} /> Filtrer par statut :
              </span>
              {['all', 'maitrisee', 'fragile', 'absente', 'prioritaire', 'emergente'].map(stat => (
                <button
                  key={stat}
                  onClick={() => setFilterStatus(stat)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                    filterStatus === stat 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {stat === 'all' ? 'Toutes' : stat.charAt(0).toUpperCase() + stat.slice(1)}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-400">
              {filteredSkills.length} compétences cartographiées
            </span>
          </div>

          {/* Grid of Skill Gap Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredSkills.map(skill => {
              const statusColors = {
                maitrisee: 'border-emerald-500/40 bg-emerald-950/10 text-emerald-300',
                fragile: 'border-amber-500/40 bg-amber-950/10 text-amber-300',
                absente: 'border-rose-500/40 bg-rose-950/10 text-rose-300',
                prioritaire: 'border-indigo-500/50 bg-indigo-950/20 text-indigo-300',
                emergente: 'border-cyan-500/40 bg-cyan-950/10 text-cyan-300'
              }[skill.status];

              const statusLabels = {
                maitrisee: '✓ Maîtrisée',
                fragile: '⚠ Fragile',
                absente: '✕ Absente',
                prioritaire: '⚡ Prioritaire',
                emergente: '✨ Émergente'
              }[skill.status];

              return (
                <div 
                  key={skill.id}
                  className={`p-5 rounded-2xl border ${statusColors} space-y-4 flex flex-col justify-between hover:border-blue-400 transition-all`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-900 border border-slate-700">
                        {statusLabels}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Présente dans {skill.frequencyInTargetOffersPercentage}% des offres
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-white mb-1">
                      {skill.name}
                    </h4>

                    {/* Preuve & ROI */}
                    <div className="space-y-1.5 text-xs text-slate-300 mt-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Niveau de Preuve :</span>
                        <span className="font-semibold text-slate-200 capitalize">
                          {skill.proofLevel.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Potentiel ROI :</span>
                        <span className="font-semibold text-emerald-300">
                          {skill.roiPotential}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action & Passerelle Campus */}
                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock size={13} /> {skill.estimatedTimeToAcquireWeeks === 0 ? 'Acquis' : `~${skill.estimatedTimeToAcquireWeeks} semaines`}
                    </span>

                    {skill.recommendedCampusSubjectTitle && onOpenCampus && (
                      <button
                        onClick={() => onOpenCampus(skill.recommendedCampusSubjectTitle)}
                        className="px-3 py-1.5 bg-blue-600/30 hover:bg-blue-600/50 text-blue-300 border border-blue-500/40 rounded-xl font-bold transition-colors flex items-center gap-1.5"
                      >
                        <GraduationCap size={14} /> Voir sur Campus
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section Signaux Faibles & Veille du Marché */}
          <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
                <TrendingUp size={16} className="text-amber-400" />
                <span>Veille & Signaux Faibles Détectés sur votre Secteur</span>
              </div>
              <span className="text-xs text-slate-400">Observatoire Métiers & Compétences 2026</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {weakSignals.map(sig => (
                <div key={sig.id} className="bg-slate-900/80 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded font-semibold text-[10px]">
                      {sig.signalType.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500 text-[10px]">{sig.detectedDate}</span>
                  </div>
                  <h5 className="font-bold text-white">{sig.title}</h5>
                  <p className="text-slate-400 leading-relaxed text-[11px]">{sig.description}</p>
                  <div className="pt-2 border-t border-slate-800 text-[11px] text-amber-200 font-medium">
                    💡 <strong>Réponse recommandée :</strong> {sig.recommendedCountermeasure}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Campus forme vos compétences ➔ Carrière guide votre trajectoire</span>
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors"
          >
            Fermer le Skill Graph
          </button>
        </div>

      </div>
    </div>
  );
};
