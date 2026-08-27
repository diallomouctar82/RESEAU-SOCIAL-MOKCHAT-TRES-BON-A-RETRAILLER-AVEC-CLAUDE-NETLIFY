import React from 'react';
import { 
  X, 
  Target, 
  Radar, 
  Users, 
  Briefcase, 
  TrendingUp, 
  CheckCircle2, 
  Award, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Compass,
  Building2,
  DollarSign
} from 'lucide-react';
import { RelationalEcosystemSummary, RelationalNode } from '../../../types';

interface CareerEcosystem360ModalProps {
  summary: RelationalEcosystemSummary;
  nodes: RelationalNode[];
  onOpenMap: () => void;
  onOpenWhoShouldIKnow: () => void;
  onClose: () => void;
}

export const CareerEcosystem360Modal: React.FC<CareerEcosystem360ModalProps> = ({
  summary,
  nodes,
  onOpenMap,
  onOpenWhoShouldIKnow,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Compass size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400">
                <Sparkles size={14} /> Vue Synthétique 360°
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Mon Écosystème Professionnel
              </h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Goal Anchor */}
        <div className="bg-slate-950 px-6 py-3.5 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Target size={15} className="text-blue-400 shrink-0" />
            <span className="text-slate-400">Cap stratégique :</span>
            <span className="font-bold text-white">{summary.activeGoalHeadline}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenMap}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 rounded-lg font-bold transition-all"
            >
              Voir la Carte Dynamique
            </button>
          </div>
        </div>

        {/* Body 8 Strategic Pillars */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Pillar 1: Mon Objectif & Valeur */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Target size={14} /> 1. Proposition de Valeur
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {summary.idealCustomerProfile.valueProposition}
            </p>
          </div>

          {/* Pillar 2: Opportunités & Pipeline */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Radar size={14} /> 2. Opportunités & Deals
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              <p>• Deals en cours : <strong className="text-emerald-400">{summary.activeDealsCount} dossiers</strong></p>
              <p>• Financements cibles : <strong className="text-white">{summary.fundingPipeline[0]?.targetAmount}</strong></p>
            </div>
          </div>

          {/* Pillar 3: Relations Stratégiques */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
              <Users size={14} /> 3. Capital Relationnel
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              <p>• Contacts qualifiés : <strong className="text-white">{summary.totalContacts}</strong></p>
              <p>• Haut impact (&gt;90%) : <strong className="text-indigo-300">{summary.highImpactContactsCount}</strong></p>
              <p>• Introductions en attente : <strong className="text-amber-400">{summary.pendingIntroductionsCount}</strong></p>
            </div>
          </div>

          {/* Pillar 4: Clients & ICP */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
              <Building2 size={14} /> 4. Cible Clients & B2B
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              <p>• Secteur : <strong className="text-white">{summary.idealCustomerProfile.targetSector}</strong></p>
              <p>• Panier moyen : <strong className="text-amber-400">{summary.idealCustomerProfile.budgetRange}</strong></p>
            </div>
          </div>

          {/* Pillar 5: Partenaires & Alliances */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
              <Briefcase size={14} /> 5. Partenariats Stratégiques
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              {summary.partnerSearches.map(p => (
                <p key={p.id}>• {p.roleNeeded} (<strong className="text-purple-300">{p.status}</strong>)</p>
              ))}
            </div>
          </div>

          {/* Pillar 6: Cercles & Missions Collectives */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
              <Users size={14} /> 6. Équipes d'Opportunité
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              <p>• Consortia constitués : <strong className="text-white">{summary.collaborativeTeams.length}</strong></p>
              <p>• Rôle : <strong className="text-rose-300">Chef de File & Coordinateur</strong></p>
            </div>
          </div>

          {/* Pillar 7: Prochaines Actions Prioritaires */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
              <Sparkles size={14} /> 7. Relances & Prochains Pas
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              <p>• Relances légitimes aujourd'hui : <strong className="text-emerald-400">{summary.followUpsDueTodayCount}</strong></p>
              <p>• Respect absolu du délai de courtoisie (J+7)</p>
            </div>
          </div>

          {/* Pillar 8: Résultats Tangibles Certifiés */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Award size={14} /> 8. Capital de Preuve
            </span>
            <div className="space-y-1 text-xs text-slate-300">
              <p>• Preuves auditées : <strong className="text-emerald-400">{summary.idealCustomerProfile.successStoriesProofs.length} cas réels</strong></p>
              <p>• Confiance : <strong className="text-white">Garantie Mok Trust</strong></p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
