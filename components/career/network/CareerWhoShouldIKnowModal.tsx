import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Target, 
  Users, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Building2, 
  Briefcase, 
  Award,
  Globe,
  Send,
  UserPlus
} from 'lucide-react';
import { generateWhoShouldIKnowSuggestions } from '../../../services/careerNetworkEngine';

interface CareerWhoShouldIKnowModalProps {
  activeGoal: string;
  onConnectToCategory: (category: string) => void;
  onClose: () => void;
}

export const CareerWhoShouldIKnowModal: React.FC<CareerWhoShouldIKnowModalProps> = ({
  activeGoal,
  onConnectToCategory,
  onClose
}) => {
  const suggestions = generateWhoShouldIKnowSuggestions(activeGoal);
  const [selectedCategory, setSelectedCategory] = useState(suggestions[0]);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Users size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Sparkles size={14} /> Intelligence Stratégique de Réseau
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                « Qui devrais-je connaître pour mon objectif ? »
              </h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-3 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Goal Anchor Banner */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Target size={15} className="text-blue-400" />
            <span className="text-slate-400">Cap stratégique :</span>
            <span className="font-bold text-white">{activeGoal}</span>
          </div>
          <span className="px-2.5 py-1 bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 rounded-lg font-semibold">
            Déduction sémantique Point B
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Left: 4 Categories identified */}
          <div className="md:col-span-5 space-y-3">
            <span className="text-xs uppercase font-bold text-slate-400 tracking-wider block">
              Catégories de profils indispensables
            </span>

            {suggestions.map((cat, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedCategory(cat)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                  selectedCategory.category === cat.category 
                    ? 'bg-blue-950/60 border-blue-500 shadow-md ring-1 ring-blue-500' 
                    : 'bg-slate-800/40 border-slate-700/60 hover:bg-slate-800 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{cat.category}</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    cat.importance === 'Critique' ? 'bg-rose-900/60 text-rose-300' :
                    cat.importance === 'Stratégique' ? 'bg-amber-900/60 text-amber-300' :
                    'bg-blue-900/60 text-blue-300'
                  }`}>
                    {cat.importance}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                  {cat.whyNeeded}
                </p>
              </div>
            ))}
          </div>

          {/* Right: Focused Detail & Direct Network Matches */}
          <div className="md:col-span-7 p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Raison d'être stratégique</span>
                <h3 className="text-base font-bold text-white mt-1">{selectedCategory.category}</h3>
                <p className="text-xs text-slate-300 leading-relaxed mt-2 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                  {selectedCategory.whyNeeded}
                </p>
              </div>

              {/* Profiles found in authorized networks */}
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Profils & Pistes détectées dans les cercles autorisés
                </span>

                <div className="space-y-2">
                  {selectedCategory.profilesFoundInNetwork.map((p, i) => (
                    <div key={i} className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <h5 className="text-xs font-bold text-white">{p.name}</h5>
                        <span className="text-[11px] text-slate-400">Accès : <strong className="text-indigo-300">{p.via}</strong></span>
                      </div>
                      <span className="text-xs font-black text-emerald-400 bg-emerald-950 px-2 py-1 rounded border border-emerald-800/40">
                        {p.match}% Match
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Anti-Spam Ethics Reminder */}
              <div className="p-3 bg-blue-950/40 border border-blue-800/40 rounded-xl text-[11px] text-blue-200 flex items-center gap-2">
                <ShieldCheck size={16} className="text-blue-400 shrink-0" />
                <span>Règle LMAV : Jamais de démarchage de masse. Chaque approche est ultra-ciblée avec apport immédiat de valeur.</span>
              </div>

            </div>

            <button
              onClick={() => {
                onConnectToCategory(selectedCategory.category);
                onClose();
              }}
              className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30"
            >
              <UserPlus size={16} /> Explorer et activer les mises en relation pour cette catégorie
            </button>

          </div>

        </div>

      </div>
    </div>
  );
};
