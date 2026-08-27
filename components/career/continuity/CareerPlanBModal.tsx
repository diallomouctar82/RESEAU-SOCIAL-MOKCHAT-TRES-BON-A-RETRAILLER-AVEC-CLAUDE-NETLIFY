import React from 'react';
import { 
  ShieldCheck, 
  RotateCcw, 
  Sparkles, 
  ArrowRight, 
  Briefcase, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Layers,
  Award
} from 'lucide-react';
import { CareerPlanBRecommendation, RadarOpportunityItem } from '../../../types';

interface CareerPlanBModalProps {
  planB: CareerPlanBRecommendation;
  onSelectAlternativeOpportunity: (opp: RadarOpportunityItem) => void;
  onClose: () => void;
}

export const CareerPlanBModal: React.FC<CareerPlanBModalProps> = ({
  planB,
  onSelectAlternativeOpportunity,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-slate-950 via-blue-950 to-slate-950 text-white flex justify-between items-start">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30">
              Résilience & Capitalisation Continue (Diallo Plan B)
            </span>
            <h2 className="text-xl font-black">Ne jamais repartir de zéro : Mode Plan B Activé</h2>
            <p className="text-xs text-slate-300">
              Dossier clôturé : <strong className="text-white">{planB.opportunityTitle}</strong> chez <strong className="text-white">{planB.entityName}</strong>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* PRINCIPLE BANNER */}
          <div className="p-5 rounded-2xl bg-blue-50 border border-blue-200 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider">
              <Award size={16} className="text-blue-600" />
              <span>Règle d'Accomplissement : Un refus produit du capital pour la tentative suivante</span>
            </div>
            <p className="text-xs text-blue-950 leading-relaxed font-medium">
              Chaque heure passée à rédiger, chiffrer et vous entraîner n'est jamais perdue. Les documents et arguments créés sont réutilisables à 90% pour conquérir des cibles similaires.
            </p>
          </div>

          {/* 1. APPRENTISSAGES CLÉS EXTRAITS */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-amber-600" /> 1. Diagnostic objectif & Apprentissages
            </h4>
            <div className="space-y-2">
              {planB.keyLearningsExtracted.map((learning, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-start gap-2.5">
                  <CheckCircle2 size={15} className="text-emerald-600 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{learning}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 2. ACTIFS DU CAPITAL PRÊTS À RE-PROJETER */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600" /> 2. Vos actifs réutilisables immédiatement
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {planB.reusableCapitalAssets.map((asset, idx) => (
                <div key={idx} className="p-4 bg-indigo-50/50 border border-indigo-200 rounded-2xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-indigo-900 font-bold text-xs">
                    <FileText size={14} className="text-indigo-600" />
                    <span>{asset.assetName}</span>
                  </div>
                  <p className="text-[11px] text-indigo-950 leading-relaxed font-medium">
                    {asset.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. OPPORTUNITÉS DE SUBSTITUTION DU RADAR */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Briefcase size={14} className="text-emerald-600" /> 3. Opportunités alternatives hautement compatibles détectées
            </h4>
            <div className="space-y-3">
              {planB.alternativeRadarOpportunities.map((opp) => (
                <div key={opp.id} className="p-4 bg-white border border-slate-200 hover:border-emerald-300 rounded-2xl shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                        {opp.matchScore}% Match
                      </span>
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                        <Building2 size={12} /> {opp.entity} • {opp.location}
                      </span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-900">{opp.title}</h5>
                    <p className="text-xs text-slate-600 line-clamp-1">{opp.whyForMe}</p>
                  </div>
                  <button
                    onClick={() => onSelectAlternativeOpportunity(opp)}
                    className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shrink-0 shadow-sm transition-all"
                  >
                    <span>Engager avec mes assets prêts</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            Fermer le Plan B
          </button>
        </div>

      </div>
    </div>
  );
};
