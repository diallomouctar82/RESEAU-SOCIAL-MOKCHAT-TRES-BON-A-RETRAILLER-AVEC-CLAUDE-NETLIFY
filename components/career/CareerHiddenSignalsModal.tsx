import React from 'react';
import { 
  RadarHiddenSignal, 
  OpportunityUniverse 
} from '../../types';
import { 
  X, 
  Radio, 
  Sparkles, 
  Building2, 
  ArrowRight, 
  ExternalLink, 
  Mail, 
  MessageSquare, 
  CheckCircle,
  Lightbulb
} from 'lucide-react';

interface CareerHiddenSignalsModalProps {
  signals: RadarHiddenSignal[];
  onExploreSignal: (signal: RadarHiddenSignal, universe: OpportunityUniverse, angleApproach: string) => void;
  onClose: () => void;
}

export const CareerHiddenSignalsModal: React.FC<CareerHiddenSignalsModalProps> = ({
  signals,
  onExploreSignal,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* HEADER */}
        <div className="p-6 md:p-8 bg-slate-900 text-white flex justify-between items-start border-b border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-bold uppercase text-xs tracking-wider mb-1">
              <Radio size={16} className="animate-pulse" /> Détection de Signaux Faibles
            </div>
            <h2 className="text-2xl md:text-3xl font-black">
              Opportunités Non Publiées & Veille Réseau MOK
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1">
              L'Agent de Conquête identifie les besoins émergents réels avant même qu'une offre formelle ne soit diffusée.
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 bg-slate-50">
          
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <Lightbulb size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 space-y-1">
              <div className="font-bold">Comment fonctionne la détection de signaux faibles ?</div>
              <p className="leading-relaxed">
                Quand un dirigeant du Réseau MOK ou une institution partenaire annonce une levée de fonds, l'ouverture de filiales ou un nouveau marché, l'IA déduit les besoins opérationnels induits (recrutement, prestataires, logistique, achats) pour vous permettre d'arriver en premier.
              </p>
            </div>
          </div>

          {/* SIGNALS LIST */}
          <div className="space-y-6">
            {signals.map(signal => (
              <div 
                key={signal.id}
                className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 hover:border-amber-400 transition-all group"
              >
                {/* Author Info & Post Source */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={signal.avatarUrl} 
                      alt={signal.authorName} 
                      className="w-12 h-12 rounded-2xl object-cover border border-slate-200" 
                    />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-base">{signal.authorName}</h4>
                      <div className="text-xs text-slate-600 font-medium">
                        {signal.authorRole} • <strong className="text-slate-800">{signal.companyName}</strong>
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Détecté sur le {signal.sourcePlatform === 'reseau_mok' ? 'Réseau MOK' : 'Marché Mondial'} • {signal.detectedDate}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full border border-amber-200">
                      Indice Confiance {signal.confidenceIndex}%
                    </span>
                  </div>
                </div>

                {/* Excerpt */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs text-slate-700 italic font-medium leading-relaxed">
                  {signal.sourcePostExcerpt}
                </div>

                {/* Intelligent Deductions */}
                <div className="bg-blue-50/70 border border-blue-200 p-4 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-extrabold text-blue-950">
                    <Sparkles size={14} className="text-blue-600" /> Analyse & Déduction d'Opportunité
                  </div>
                  <p className="text-xs text-blue-900 leading-relaxed">
                    {signal.signalHypothesis}
                  </p>
                </div>

                {/* Action Suggestions */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] uppercase font-extrabold text-slate-500">
                    Angles d'approche recommandés :
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {signal.suggestedOpportunities.map((opp, idx) => (
                      <div key={idx} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 flex flex-col justify-between space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-bold uppercase bg-white px-2 py-0.5 rounded border text-slate-700">
                              {opp.universe}
                            </span>
                          </div>
                          <div className="font-extrabold text-slate-900 text-xs">{opp.title}</div>
                          <p className="text-[11px] text-slate-600 mt-1 leading-snug">
                            {opp.angleApproach}
                          </p>
                        </div>

                        <button
                          onClick={() => onExploreSignal(signal, opp.universe, opp.angleApproach)}
                          className="w-full py-2 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                        >
                          <MessageSquare size={13} /> Préparer l'Approche Spontanée
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-1.5">
            <CheckCircle size={14} className="text-emerald-600" />
            <span>Toutes les sources citées sont vérifiables et basées sur l'activité réelle de la communauté.</span>
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
