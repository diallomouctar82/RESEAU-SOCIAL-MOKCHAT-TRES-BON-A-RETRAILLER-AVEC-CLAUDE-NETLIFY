import React, { useState } from 'react';
import { 
  Sparkles, 
  ArrowRight, 
  Target, 
  Send, 
  GraduationCap, 
  TrendingUp, 
  Globe, 
  RotateCcw, 
  Users, 
  Rocket, 
  Handshake, 
  Briefcase, 
  DollarSign, 
  Plane, 
  FileCheck, 
  Search,
  CheckCircle2,
  Compass
} from 'lucide-react';
import { CAREER_ARCHETYPE_GOALS } from './careerDefaults';
import { CareerPointB } from '../../types';

interface CareerGoalSelectorProps {
  onSelectGoal: (goal: CareerPointB) => void;
  onOpenDiagnostic: () => void;
  activeGoal?: CareerPointB;
}

export const CareerGoalSelector: React.FC<CareerGoalSelectorProps> = ({
  onSelectGoal,
  onOpenDiagnostic,
  activeGoal
}) => {
  const [naturalInput, setNaturalInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(activeGoal?.category || null);

  const getIcon = (iconName: string) => {
    switch(iconName) {
      case 'GraduationCap': return <GraduationCap size={20} className="text-blue-500" />;
      case 'TrendingUp': return <TrendingUp size={20} className="text-emerald-500" />;
      case 'Globe': return <Globe size={20} className="text-indigo-500" />;
      case 'RotateCcw': return <RotateCcw size={20} className="text-amber-500" />;
      case 'Users': return <Users size={20} className="text-purple-500" />;
      case 'Rocket': return <Rocket size={20} className="text-rose-500" />;
      case 'Handshake': return <Handshake size={20} className="text-teal-500" />;
      case 'Briefcase': return <Briefcase size={20} className="text-blue-600" />;
      case 'DollarSign': return <DollarSign size={20} className="text-green-600" />;
      case 'Plane': return <Plane size={20} className="text-sky-500" />;
      case 'FileCheck': return <FileCheck size={20} className="text-amber-600" />;
      default: return <Target size={20} className="text-blue-500" />;
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalInput.trim()) return;

    const customGoal: CareerPointB = {
      id: `goal-${Date.now()}`,
      title: naturalInput,
      category: 'custom',
      rawUserInput: naturalInput,
      targetDeadlineMonths: 6,
      targetSalaryOrRevenue: 'À définir lors du diagnostic',
      targetLocation: 'International / France / Télétravail',
      successCriteria: [
        'Plan d\'action Point A → Point B validé',
        'Acquisition des compétences prioritaires',
        'Atteinte mesurable du résultat final'
      ],
      urgencyLevel: 'high'
    };

    onSelectGoal(customGoal);
    setNaturalInput('');
  };

  const handleSelectPreset = (preset: typeof CAREER_ARCHETYPE_GOALS[0]) => {
    setSelectedCategory(preset.category);
    const newGoal: CareerPointB = {
      id: `goal-${Date.now()}-${preset.category}`,
      title: preset.title,
      category: preset.category,
      rawUserInput: preset.title,
      targetDeadlineMonths: preset.defaultDeadlineMonths,
      successCriteria: preset.successCriteria,
      urgencyLevel: 'high'
    };
    onSelectGoal(newGoal);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-50 to-indigo-50/50 rounded-full blur-3xl -z-10 pointer-events-none" />

      {/* Header Banner */}
      <div className="max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/60 text-blue-700 text-xs font-bold tracking-wide uppercase mb-3">
          <Compass size={14} /> Moteur d'Accomplissement Professionnel & Entrepreneurial
        </div>
        <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
          Quel objectif voulez-vous accomplir ?
        </h2>
        <p className="text-slate-600 text-sm md:text-base mt-2 leading-relaxed">
          Exprimez votre ambition en langage naturel ou choisissez l'un des 12 grands objectifs types.
          L'IA calcule immédiatement votre point A, vos compétences manquantes et trace le meilleur chemin jusqu'au résultat concret.
        </p>
      </div>

      {/* Natural Language Prompt Box */}
      <form onSubmit={handleCustomSubmit} className="mb-8">
        <div className="flex flex-col md:flex-row gap-3 p-2 bg-slate-50 border-2 border-blue-500/30 hover:border-blue-500 rounded-2xl transition-all shadow-inner focus-within:ring-4 focus-within:ring-blue-100">
          <div className="flex-1 flex items-center px-4 gap-3">
            <Sparkles className="text-blue-600 shrink-0 animate-pulse" size={22} />
            <input 
              type="text"
              value={naturalInput}
              onChange={(e) => setNaturalInput(e.target.value)}
              placeholder="Ex: « Je veux trouver mon premier emploi » ou « Je veux lever 200k€ pour ma startup »..."
              className="w-full bg-transparent border-none outline-none text-slate-900 placeholder-slate-400 font-medium text-sm md:text-base py-3"
            />
          </div>
          <button
            type="submit"
            disabled={!naturalInput.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-7 py-3.5 rounded-xl shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all shrink-0"
          >
            <span>Transformer en Mission</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </form>

      {/* 12 Archetypes Grid */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Ou sélectionnez un objectif prédéfini (12 modèles d'accomplissement)
          </span>
          <button 
            onClick={onOpenDiagnostic}
            className="text-xs text-blue-600 hover:text-blue-800 font-bold hover:underline"
          >
            Modifier ma situation actuelle (Point A) →
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5">
          {CAREER_ARCHETYPE_GOALS.map((archetype) => {
            const isSelected = activeGoal?.category === archetype.category || selectedCategory === archetype.category;
            return (
              <button
                key={archetype.category}
                onClick={() => handleSelectPreset(archetype)}
                className={`text-left p-4 rounded-2xl border transition-all flex flex-col justify-between group relative overflow-hidden ${
                  isSelected 
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20 scale-[1.02]' 
                    : 'bg-slate-50/70 hover:bg-white text-slate-800 border-slate-200/80 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/15 text-white' : 'bg-white shadow-xs'}`}>
                      {getIcon(archetype.icon)}
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200/70 text-slate-600'
                    }`}>
                      {archetype.badge}
                    </span>
                  </div>

                  <h3 className={`font-bold text-sm leading-snug line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-900 group-hover:text-blue-600'}`}>
                    {archetype.title}
                  </h3>
                  <p className={`text-xs mt-1.5 line-clamp-2 leading-relaxed ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                    {archetype.description}
                  </p>
                </div>

                <div className="mt-3 pt-2.5 border-t border-black/5 flex items-center justify-between text-[11px] font-semibold">
                  <span className={isSelected ? 'text-blue-100' : 'text-slate-400'}>
                    Délai estimé : {archetype.defaultDeadlineMonths} mois
                  </span>
                  {isSelected ? (
                    <span className="flex items-center gap-1 text-white font-bold">
                      <CheckCircle2 size={13} /> Actif
                    </span>
                  ) : (
                    <span className="text-blue-600 group-hover:translate-x-0.5 transition-transform">
                      Activer →
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
