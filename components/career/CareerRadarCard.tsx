import React, { useState } from 'react';
import { 
  RadarOpportunityItem, 
  CareerPointA, 
  CareerPointB 
} from '../../types';
import { 
  Briefcase, 
  ShoppingCart, 
  DollarSign, 
  Users, 
  MapPin, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  BookOpen, 
  Video, 
  Mail, 
  Bookmark, 
  BookmarkCheck, 
  ThumbsDown, 
  ChevronDown, 
  ChevronUp, 
  Compass, 
  Building2, 
  ExternalLink,
  MessageSquare,
  Award
} from 'lucide-react';

interface CareerRadarCardProps {
  opportunity: RadarOpportunityItem;
  pointA: CareerPointA;
  pointB: CareerPointB;
  onGenerateApproach: (opportunity: RadarOpportunityItem, actionType: 'mail' | 'dossier' | 'relance' | 'devis') => void;
  onOpenCoach3D: (opportunity: RadarOpportunityItem) => void;
  onOpenConquestWarRoom?: (opportunity: RadarOpportunityItem) => void;
  onOpenCampusCourse?: (courseId?: string, courseTitle?: string) => void;
  onToggleVaultSave: (opportunityId: string) => void;
  onOpenFeedback: (opportunity: RadarOpportunityItem) => void;
  onOpenDirectContact?: (opportunity: RadarOpportunityItem) => void;
}

export const CareerRadarCard: React.FC<CareerRadarCardProps> = ({
  opportunity,
  pointA,
  pointB,
  onGenerateApproach,
  onOpenCoach3D,
  onOpenConquestWarRoom,
  onOpenCampusCourse,
  onToggleVaultSave,
  onOpenFeedback,
  onOpenDirectContact
}) => {
  const [showGapDetails, setShowGapDetails] = useState(false);
  const [showTrustDetails, setShowTrustDetails] = useState(false);

  // Universe icon & color
  const getUniverseMeta = () => {
    switch (opportunity.universe) {
      case 'emploi':
        return { label: 'Emploi & Mission', icon: Briefcase, color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'clients':
        return { label: 'Client & Affaire B2B', icon: Users, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'fonds':
        return { label: 'Fonds & Subvention', icon: DollarSign, color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'achats':
        return { label: 'Achat & Sourcing', icon: ShoppingCart, color: 'bg-amber-50 text-amber-700 border-amber-200' };
    }
  };

  const universeMeta = getUniverseMeta();

  // Readiness badge
  const getReadinessBadge = () => {
    switch (opportunity.readiness) {
      case 'ready_now':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" /> Prêt Maintenant
          </span>
        );
      case 'to_prepare':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock size={12} className="text-amber-600" /> À Préparer (Plan d'action)
          </span>
        );
      case 'future_goal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Compass size={12} className="text-indigo-600" /> Objectif Futur
          </span>
        );
    }
  };

  const isSavedInVault = opportunity.vaultStatus !== 'decouverte' && opportunity.vaultStatus !== 'abandonnee';

  return (
    <div className={`bg-white rounded-3xl p-6 border transition-all duration-300 relative flex flex-col justify-between space-y-5 group ${
      opportunity.isExplorationCard 
        ? 'border-indigo-300 shadow-md shadow-indigo-100/50 bg-indigo-50/40' 
        : 'border-slate-200 hover:border-blue-400 hover:shadow-xl'
    }`}>
      
      {/* 🌟 TOP BADGES & MATCH HEADER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${universeMeta.color}`}>
              <universeMeta.icon size={13} /> {universeMeta.label}
            </span>
            {getReadinessBadge()}
            {opportunity.isUrgent && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-700 border border-rose-200 animate-pulse">
                Échéance Courte
              </span>
            )}
            {opportunity.isExplorationCard && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 border border-purple-200">
                ✨ Horizon d'Exploration
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => onToggleVaultSave(opportunity.id)}
              title={isSavedInVault ? "Enregistrée dans votre coffre" : "Enregistrer dans le coffre d'opportunités"}
              className={`p-2 rounded-xl transition-colors ${
                isSavedInVault 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
              }`}
            >
              {isSavedInVault ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
            </button>
            
            <button 
              onClick={() => onOpenFeedback(opportunity)}
              title="Pourquoi cette opportunité ne m'intéresse pas ?"
              className="p-2 rounded-xl text-slate-300 hover:text-slate-500 hover:bg-slate-100 transition-colors"
            >
              <ThumbsDown size={16} />
            </button>

            <div className="flex flex-col items-end pl-2">
              <div className="flex items-center gap-1">
                <span className="text-xl font-black text-slate-900">{opportunity.matchScore}%</span>
                <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider bg-blue-50 px-1.5 py-0.5 rounded">
                  Match IA
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">{opportunity.compatibilityTier} compatibilité</span>
            </div>
          </div>
        </div>

        {/* TITLE & ENTITY */}
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg md:text-xl leading-snug group-hover:text-blue-600 transition-colors">
            {opportunity.title}
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap font-medium">
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <Building2 size={13} className="text-slate-400" /> {opportunity.entity}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-500">
              <MapPin size={13} className="text-slate-400" /> {opportunity.location} {opportunity.countryFlag}
            </span>
            <span>•</span>
            <span className="text-slate-500 font-semibold">{opportunity.opportunityType}</span>
          </div>
        </div>
      </div>

      {/* 📝 DESCRIPTION */}
      <p className="text-xs md:text-sm text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
        {opportunity.description}
      </p>

      {/* 💡 WHY FOR ME (TRANSPARENT MATCHING) */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950">
            <Sparkles size={14} className="text-blue-600" /> Pourquoi cette opportunité pour moi ?
          </div>
          <span className="text-[10px] text-blue-700 font-semibold bg-white/80 px-2 py-0.5 rounded-full border border-blue-100">
            Point A ➔ Point B
          </span>
        </div>
        <p className="text-xs text-blue-900 leading-relaxed">
          {opportunity.whyForMe}
        </p>

        {/* Matched & Missing Skills Pills */}
        <div className="pt-1 flex flex-wrap gap-1.5">
          {opportunity.matchedStrengths.map((str, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-100/80 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
              <CheckCircle2 size={10} className="text-emerald-600" /> {str}
            </span>
          ))}
          {opportunity.missingCompetencies.map((gap, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-100/80 text-amber-900 px-2 py-0.5 rounded-md border border-amber-200">
              <AlertCircle size={10} className="text-amber-600" /> À combler : {gap}
            </span>
          ))}
        </div>
      </div>

      {/* 🎯 GAP ANALYSIS & PLAN D'ACTION AVANT ÉCHÉANCE (EXPANDABLE) */}
      {opportunity.gapPlan && (
        <div className="bg-amber-50/50 border border-amber-200/70 rounded-2xl p-3 space-y-2 text-xs">
          <button 
            onClick={() => setShowGapDetails(!showGapDetails)}
            className="w-full flex items-center justify-between text-amber-950 font-bold text-left"
          >
            <div className="flex items-center gap-1.5">
              <BookOpen size={14} className="text-amber-700" /> 
              <span>Plan de préparation avant échéance ({opportunity.daysRemaining} jours restants)</span>
            </div>
            {showGapDetails ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>

          {showGapDetails && (
            <div className="pt-2 space-y-2.5 border-t border-amber-200/60 animate-fade-up">
              <p className="text-amber-900 text-[11px] leading-relaxed">
                {opportunity.gapPlan.strategicAdvice}
              </p>
              
              <div className="space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-amber-800">Modules Campus recommandés :</div>
                {opportunity.gapPlan.missingSkills.map((item, idx) => (
                  <div key={idx} className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-800 text-xs">{item.courseTitle}</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>Compétence : {item.skill}</span>
                        <span>•</span>
                        <span className="font-medium text-amber-800">~{item.estimatedHours}h d'apprentissage</span>
                      </div>
                    </div>
                    {onOpenCampusCourse && (
                      <button 
                        onClick={() => onOpenCampusCourse(item.campusCourseId, item.courseTitle)}
                        className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-bold whitespace-nowrap transition-colors flex items-center gap-1"
                      >
                        Ouvrir Campus <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ℹ️ METADATA & TRUST BAR */}
      <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100 flex-wrap gap-2">
        <div className="flex items-center gap-3">
          {opportunity.compensationOrBudget && (
            <span className="font-bold text-slate-800 flex items-center gap-1">
              <DollarSign size={13} className="text-emerald-600" /> {opportunity.compensationOrBudget}
            </span>
          )}
          {opportunity.deadlineDate && (
            <span className="flex items-center gap-1 font-medium text-slate-600">
              <Calendar size={13} className="text-slate-400" /> {opportunity.deadlineDate}
            </span>
          )}
        </div>

        {/* Mok Trust / Anti-Fraud Badge */}
        <div className="relative">
          <button 
            onClick={() => setShowTrustDetails(!showTrustDetails)}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 hover:bg-emerald-100 transition-colors"
          >
            <ShieldCheck size={12} className="text-emerald-600" /> Mok Trust {opportunity.trustScore}/100
          </button>
          
          {showTrustDetails && (
            <div className="absolute bottom-full right-0 mb-2 w-64 bg-slate-900 text-white p-3 rounded-xl shadow-2xl text-[11px] z-30 space-y-1.5 animate-fade-up">
              <div className="font-bold flex items-center gap-1 text-emerald-400">
                <ShieldCheck size={13} /> Source & Confiance Vérifiées
              </div>
              <p className="text-slate-300 text-[10px] leading-relaxed">
                Source : <span className="text-white font-semibold">{opportunity.sourceName}</span>. Aucune demande financière préalable requise. Entité vérifiée.
              </p>
              <div className="text-[10px] text-slate-400">
                Publié : {opportunity.publicationDate}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 🚀 CALL TO ACTIONS ("Que faisons-nous maintenant ?") */}
      <div className="pt-2 flex flex-col sm:flex-row gap-2">
        {onOpenConquestWarRoom ? (
          <button 
            onClick={() => onOpenConquestWarRoom(opportunity)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-600/20"
          >
            <ShieldCheck size={16} /> 
            <span>Salle de Préparation & Conquête</span>
          </button>
        ) : (
          <button 
            onClick={() => onGenerateApproach(
              opportunity, 
              opportunity.universe === 'achats' ? 'devis' : 'mail'
            )}
            className="flex-1 bg-slate-900 hover:bg-blue-600 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Mail size={15} /> 
            <span>
              {opportunity.universe === 'achats' ? 'Demander Devis Fournisseur' : 
               opportunity.universe === 'fonds' ? 'Préparer Dossier Bailleurs' :
               opportunity.universe === 'clients' ? 'Envoyer Proposition Commerciale' :
               'Postuler avec Jumeau Pro'}
            </span>
          </button>
        )}

        <button 
          onClick={() => onOpenCoach3D(opportunity)}
          title="Simuler l'entretien ou le pitch avec le Coach 3D"
          className="px-4 py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
        >
          <Video size={15} /> 
          <span>Simulateur 3D</span>
        </button>

        {opportunity.contactPerson && onOpenDirectContact && (
          <button 
            onClick={() => onOpenDirectContact(opportunity)}
            title={`Contacter directement ${opportunity.contactPerson.name}`}
            className="px-3.5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
          >
            <MessageSquare size={15} />
          </button>
        )}
      </div>

    </div>
  );
};
