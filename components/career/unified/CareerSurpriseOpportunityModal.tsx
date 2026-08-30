import React from 'react';
import { 
  Sparkles, 
  X, 
  Lightbulb, 
  TrendingUp, 
  MapPin, 
  DollarSign, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { CareerSurpriseOpportunityItem } from '../../../types';

interface CareerSurpriseOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunities: CareerSurpriseOpportunityItem[];
  onExploreOpportunity: (oppTitle: string) => void;
}

export const CareerSurpriseOpportunityModal: React.FC<CareerSurpriseOpportunityModalProps> = ({
  isOpen,
  onClose,
  opportunities,
  onExploreOpportunity
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-purple-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-500/20 border border-purple-400/30 rounded-2xl text-purple-300">
                <Lightbulb size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase tracking-wider">
                  <Sparkles size={14} /> Décloisonnement & Potentiel Inattendu
                </div>
                <h2 className="text-2xl font-black tracking-tight">Mode Opportunités Surprises</h2>
                <p className="text-purple-200 text-xs md:text-sm mt-1">
                  Des opportunités atypiques situées hors de votre bulle habituelle, parfaitement compatibles avec vos compétences transférables.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-full transition text-slate-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto">
          
          <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-xs md:text-sm text-purple-950 leading-relaxed flex items-start gap-3">
            <ShieldCheck size={18} className="text-purple-600 shrink-0 mt-0.5" />
            <div>
              <strong>Pourquoi cette vue existe-t-elle ?</strong> « Pour éviter que les algorithmes ne vous enferment dans un seul couloir. Ces opportunités valorisent vos forces réelles dans des secteurs émergents à haute valeur ajoutée. »
            </div>
          </div>

          <div className="space-y-4">
            {opportunities.map(opp => (
              <div 
                key={opp.id} 
                className="p-5 rounded-2xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition bg-white space-y-3"
              >
                <div className="flex justify-between items-start gap-3">
                  <div>
                    <div className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">{opp.entity}</div>
                    <h4 className="text-base font-black text-slate-900 mt-0.5">{opp.title}</h4>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 bg-purple-100 text-purple-800 rounded-full shrink-0">
                    Match Transférable : {opp.matchScore}%
                  </span>
                </div>

                <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><MapPin size={13} /> {opp.location}</span>
                  <span className="flex items-center gap-1"><DollarSign size={13} /> {opp.compensation}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 space-y-1.5 text-xs text-slate-700">
                  <div className="font-bold text-slate-900">Pourquoi cette opportunité vous est proposée :</div>
                  <p className="leading-relaxed">{opp.whyProposed}</p>
                  
                  <div className="pt-1.5 flex flex-wrap gap-1.5">
                    {opp.transferableSkillsMobilized.map((sk, idx) => (
                      <span key={idx} className="bg-purple-100/70 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded-md">
                        ✓ {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <span className="text-xs text-emerald-700 font-medium">
                    ⚡ {opp.strategicAdvantage}
                  </span>
                  <button
                    onClick={() => {
                      onExploreOpportunity(opp.title);
                      onClose();
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                  >
                    <span>Explorer ce dossier</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Mis à jour selon l'évolution du marché mondial
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
