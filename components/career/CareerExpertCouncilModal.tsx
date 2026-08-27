import React, { useState } from 'react';
import { 
  Users, 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  MessageSquare, 
  ExternalLink, 
  ShieldCheck, 
  ArrowRight,
  Briefcase,
  Scale,
  DollarSign,
  Globe,
  Rocket
} from 'lucide-react';
import { CareerCouncilExpert, CareerPointB } from '../../types';

interface CareerExpertCouncilModalProps {
  experts: CareerCouncilExpert[];
  activeGoal: CareerPointB;
  onOpenExpertChat?: (agentId: string, initialPrompt?: string) => void;
  onNavigateToTab?: (tab: string) => void;
  onClose: () => void;
}

export const CareerExpertCouncilModal: React.FC<CareerExpertCouncilModalProps> = ({
  experts,
  activeGoal,
  onOpenExpertChat,
  onNavigateToTab,
  onClose
}) => {
  const [selectedExpertId, setSelectedExpertId] = useState<string>(experts[0]?.agentId || '');

  const activeExpert = experts.find(e => e.agentId === selectedExpertId) || experts[0];

  const handleConsultExpert = (expert: CareerCouncilExpert) => {
    if (onOpenExpertChat) {
      onOpenExpertChat(
        expert.agentId, 
        `Bonjour ${expert.agentName}, je consulte le Conseil d'Experts concernant mon objectif : "${activeGoal.title}". Voici votre recommandation : "${expert.recommendation}". Comment démarrer concrètement ?`
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-up">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200">
        
        {/* HEADER */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-2xl">
              <Users size={22} />
            </div>
            <div>
              <div className="text-xs font-bold text-teal-400 uppercase tracking-wider">
                Diallo OS • Équipe Virtuelle Dédiée
              </div>
              <h2 className="text-xl md:text-2xl font-black">
                Conseil d'Experts Interdisciplinaire
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* MISSION CONTEXT BAR */}
        <div className="p-4 bg-teal-50/70 border-b border-teal-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs text-teal-900">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-teal-600 shrink-0" />
            <span className="font-bold">Mission analysée par le Conseil :</span>
            <span className="font-extrabold text-teal-950">"{activeGoal.title}"</span>
          </div>
          <span className="px-2.5 py-1 bg-white border border-teal-200 rounded-full font-bold text-[11px] text-teal-800">
            {experts.length} Experts réunis
          </span>
        </div>

        {/* BODY */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* EXPERTS LIST (SIDEBAR) */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Collège d'Experts mobilisés
            </span>
            {experts.map((expert) => {
              const isSelected = expert.agentId === selectedExpertId;
              return (
                <button
                  key={expert.agentId}
                  onClick={() => setSelectedExpertId(expert.agentId)}
                  className={`w-full p-3 rounded-2xl text-left border transition-all flex items-center gap-3 ${
                    isSelected 
                      ? 'bg-teal-600 text-white border-teal-600 shadow-md' 
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200'
                  }`}
                >
                  <img 
                    src={expert.avatarUrl} 
                    alt={expert.agentName} 
                    className="w-10 h-10 rounded-xl object-cover border border-white/20 shrink-0" 
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-xs truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                      {expert.agentName}
                    </h4>
                    <p className={`text-[10px] truncate ${isSelected ? 'text-teal-100' : 'text-slate-500'}`}>
                      {expert.role}
                    </p>
                  </div>
                  {expert.status === 'approved' ? (
                    <CheckCircle2 size={15} className={isSelected ? 'text-teal-200' : 'text-emerald-500'} />
                  ) : (
                    <AlertCircle size={15} className={isSelected ? 'text-amber-200' : 'text-amber-500'} />
                  )}
                </button>
              );
            })}
          </div>

          {/* ACTIVE EXPERT DELIBERATION DETAIL */}
          {activeExpert && (
            <div className="md:col-span-2 bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <div className="flex items-center gap-3">
                    <img 
                      src={activeExpert.avatarUrl} 
                      alt={activeExpert.agentName} 
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-md"
                    />
                    <div>
                      <h3 className="text-lg font-black text-slate-900">{activeExpert.agentName}</h3>
                      <p className="text-xs font-semibold text-teal-700">{activeExpert.role}</p>
                      <span className="text-[11px] text-slate-400">Spécialité : {activeExpert.specialty}</span>
                    </div>
                  </div>

                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    activeExpert.status === 'approved' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {activeExpert.status === 'approved' ? '✓ Avis Favorable' : '⚠ Action Requise'}
                  </span>
                </div>

                {/* Verdict Box */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Verdict Collégial</span>
                  <p className="text-sm font-bold text-slate-900">{activeExpert.verdict}</p>
                </div>

                {/* Recommendation Box */}
                <div className="p-4 bg-white rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-teal-600 block">Feuille de Route Recommandée</span>
                  <p className="text-xs text-slate-700 leading-relaxed">{activeExpert.recommendation}</p>
                </div>

                {/* Prescribed Tool */}
                <div className="p-3 bg-teal-50/80 rounded-xl border border-teal-200 text-xs text-teal-900 flex items-center justify-between">
                  <span className="font-semibold">Outil prescrit : <strong>{activeExpert.prescribedTool}</strong></span>
                  {activeExpert.gatewayTab && onNavigateToTab && (
                    <button
                      onClick={() => {
                        onNavigateToTab(activeExpert.gatewayTab!);
                        onClose();
                      }}
                      className="text-teal-700 hover:text-teal-900 font-bold underline flex items-center gap-1"
                    >
                      Ouvrir l'outil →
                    </button>
                  )}
                </div>
              </div>

              {/* ACTION: INSTANT CONSULTATION */}
              <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3">
                <button
                  onClick={() => handleConsultExpert(activeExpert)}
                  className="px-6 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare size={16} />
                  <span>Démarrer un échange direct avec {activeExpert.agentName}</span>
                </button>
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
          <span>Tous les experts partagent la mémoire continue de votre dossier.</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
