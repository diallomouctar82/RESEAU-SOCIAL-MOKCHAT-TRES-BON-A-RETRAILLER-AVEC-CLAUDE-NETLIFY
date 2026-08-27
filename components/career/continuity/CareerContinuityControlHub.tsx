import React, { useState } from 'react';
import { 
  BriefcaseBusiness, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Send, 
  Mail, 
  Video, 
  DollarSign, 
  FileText, 
  Plus, 
  Trash2, 
  ArrowRight, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  BellRing, 
  RotateCcw,
  ChevronRight,
  ExternalLink,
  Building2,
  Calendar,
  MessageSquare,
  Layers,
  AlertTriangle,
  HelpCircle,
  Search,
  Filter
} from 'lucide-react';
import { 
  CareerMissionPlan, 
  CareerLiveDossier, 
  CareerDossierStatusFilter, 
  OpportunityUniverse, 
  CareerTimelineEvent, 
  CareerPostMeetingDebrief,
  CareerDailyWeeklyBriefing,
  RadarOpportunityItem
} from '../../../types';
import { INITIAL_LIVE_DOSSIERS, INITIAL_BRIEFING_DATA, generatePlanBForDossier } from '../../../services/careerContinuityEngine';
import { CareerLiveDossierModal } from './CareerLiveDossierModal';
import { CareerWhatShouldIDoNowModal } from './CareerWhatShouldIDoNowModal';
import { CareerBriefingTomorrowModal } from './CareerBriefingTomorrowModal';
import { CareerMeetingPrepModal } from './CareerMeetingPrepModal';
import { CareerPostMeetingDebriefModal } from './CareerPostMeetingDebriefModal';
import { CareerSmartFollowUpModal } from './CareerSmartFollowUpModal';
import { CareerPlanBModal } from './CareerPlanBModal';
import { CareerResponseAnalyzerModal } from '../conquest/CareerResponseAnalyzerModal';

interface CareerContinuityControlHubProps {
  missionPlan: CareerMissionPlan;
  opportunities?: any[];
  onOpenCoach3D: () => void;
  onOpenVault?: () => void;
  onConsultExpert?: (expertName: string) => void;
  onRecordNewOutcome: (outcome: { metric: string; description: string; category: any }) => void;
}

export const CareerContinuityControlHub: React.FC<CareerContinuityControlHubProps> = ({
  missionPlan,
  opportunities = [],
  onOpenCoach3D,
  onOpenVault,
  onConsultExpert,
  onRecordNewOutcome
}) => {
  // Living Dossiers State
  const [dossiers, setDossiers] = useState<CareerLiveDossier[]>(INITIAL_LIVE_DOSSIERS);
  const [briefing, setBriefing] = useState<CareerDailyWeeklyBriefing>(INITIAL_BRIEFING_DATA);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState<CareerDossierStatusFilter>('all');
  const [universeFilter, setUniverseFilter] = useState<OpportunityUniverse | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [activeDossierForModal, setActiveDossierForModal] = useState<CareerLiveDossier | null>(null);
  const [showWhatToDoModal, setShowWhatToDoModal] = useState(false);
  const [showBriefingTomorrowModal, setShowBriefingTomorrowModal] = useState(false);
  
  const [dossierForFollowUp, setDossierForFollowUp] = useState<CareerLiveDossier | null>(null);
  const [dossierForMeetingPrep, setDossierForMeetingPrep] = useState<CareerLiveDossier | null>(null);
  const [dossierForDebrief, setDossierForDebrief] = useState<CareerLiveDossier | null>(null);
  const [dossierForPlanB, setDossierForPlanB] = useState<CareerLiveDossier | null>(null);
  const [dossierForResponseAnalysis, setDossierForResponseAnalysis] = useState<CareerLiveDossier | null>(null);

  // Outcome modal
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [newOutcomeMetric, setNewOutcomeMetric] = useState('');
  const [newOutcomeDesc, setNewOutcomeDesc] = useState('');
  const [newOutcomeCategory, setNewOutcomeCategory] = useState<'job' | 'revenue' | 'client' | 'funding' | 'contract'>('client');

  // Handlers for updates
  const handleUpdateDossier = (updated: CareerLiveDossier) => {
    setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));
    if (activeDossierForModal && activeDossierForModal.id === updated.id) {
      setActiveDossierForModal(updated);
    }
  };

  const handleDebriefSaved = (debrief: CareerPostMeetingDebrief, newEvent: CareerTimelineEvent) => {
    if (!dossierForDebrief) return;
    
    const updated: CareerLiveDossier = {
      ...dossierForDebrief,
      status: debrief.sentiment === 'defavorable' ? 'bloque' : 'a_faire_aujourdhui',
      workflowStage: `Débriefing validé : ${debrief.nextActionLabel}`,
      daysSinceLastContact: 0,
      lastContactDate: "Aujourd'hui",
      timeline: [newEvent, ...dossierForDebrief.timeline],
      nextBestAction: {
        actionType: 'preparer_document',
        headline: debrief.nextActionLabel,
        detailedReason: `Engagement pris lors de l'échange du ${debrief.date} : ${debrief.summary}`,
        recommendedDeadline: debrief.nextActionDueDate,
        urgencyLevel: 'haute'
      }
    };

    handleUpdateDossier(updated);
    setDossierForDebrief(null);
  };

  const handleFollowUpSent = (updatedDossier: CareerLiveDossier) => {
    handleUpdateDossier(updatedDossier);
    setDossierForFollowUp(null);
  };

  const handleCreateOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutcomeMetric.trim()) return;

    onRecordNewOutcome({
      metric: newOutcomeMetric.trim(),
      description: newOutcomeDesc.trim() || 'Résultat certifié.',
      category: newOutcomeCategory
    });

    setNewOutcomeMetric('');
    setNewOutcomeDesc('');
    setShowOutcomeModal(false);
  };

  // Filtered dossiers logic
  const filteredDossiers = dossiers.filter(d => {
    // Status filter
    if (statusFilter === 'a_faire_aujourdhui' && d.status !== 'a_faire_aujourdhui' && !d.isUrgentDeadline && d.status !== 'rendez_vous') return false;
    if (statusFilter === 'en_attente' && d.status !== 'en_attente') return false;
    if (statusFilter === 'a_relancer' && d.status !== 'a_relancer') return false;
    if (statusFilter === 'rendez_vous' && d.status !== 'rendez_vous') return false;
    if (statusFilter === 'reponse_recue' && d.status !== 'reponse_recue') return false;
    if (statusFilter === 'urgent' && !d.isUrgentDeadline) return false;
    if (statusFilter === 'bloque' && !d.isStalled && d.status !== 'bloque') return false;
    if (statusFilter === 'reussi' && d.status !== 'reussi') return false;
    
    // Universe filter
    if (universeFilter !== 'all' && d.universe !== universeFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        d.title.toLowerCase().includes(q) ||
        d.entityName.toLowerCase().includes(q) ||
        d.contactPerson.name.toLowerCase().includes(q)
      );
    }

    return true;
  });

  const getUniverseBadge = (universe: OpportunityUniverse) => {
    switch (universe) {
      case 'emploi': return { label: 'Emploi', color: 'bg-blue-50 text-blue-800 border-blue-200' };
      case 'clients': return { label: 'Client B2B', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
      case 'fonds': return { label: 'Bourse / Fonds', color: 'bg-purple-50 text-purple-800 border-purple-200' };
      case 'achats': return { label: 'Sourcing Achats', color: 'bg-amber-50 text-amber-800 border-amber-200' };
      default: return { label: 'Général', color: 'bg-slate-50 text-slate-800 border-slate-200' };
    }
  };

  const getStatusDisplay = (dossier: CareerLiveDossier) => {
    if (dossier.isStalled) {
      return { label: `Bloqué (${dossier.daysSinceLastContact}j)`, color: 'bg-red-50 text-red-800 border-red-200' };
    }
    if (dossier.status === 'rendez_vous') {
      return { label: 'Rendez-vous Fixé 📅', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' };
    }
    if (dossier.status === 'a_relancer') {
      return { label: 'À Relancer (J+8)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
    }
    if (dossier.status === 'urgent') {
      return { label: 'Urgent (<48h)', color: 'bg-red-50 text-red-800 border-red-200' };
    }
    if (dossier.status === 'en_attente') {
      return { label: 'En attente retour', color: 'bg-slate-100 text-slate-700 border-slate-200' };
    }
    if (dossier.status === 'reussi') {
      return { label: 'Résultat Certifié 🎉', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
    }
    return { label: 'En cours', color: 'bg-blue-50 text-blue-700 border-blue-200' };
  };

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* 🚀 1. CAREER PULSE & GLOBAL INTELLIGENCE BANNER */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-5">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 rounded-full text-[10px] font-black uppercase tracking-wider">
                  Agent de Continuité & Suivi Autonome (Diallo OS)
                </span>
                <span className="text-xs text-slate-400 font-bold">
                  {briefing.todayDate}
                </span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black">
                Pulse de Carrière & Pilotage des Conquêtes
              </h2>
              <p className="text-xs md:text-sm text-slate-300 flex items-center gap-2">
                Cap actuel : <strong className="text-white">{briefing.careerPulse.goalHeadline}</strong>
                <span className="text-emerald-400 font-black">• {briefing.careerPulse.progressPercent}% du parcours validé</span>
              </p>
            </div>

            {/* TWO HERO COMMAND BUTTONS */}
            <div className="flex flex-wrap gap-2.5 w-full lg:w-auto">
              <button
                onClick={() => setShowWhatToDoModal(true)}
                className="flex-1 sm:flex-none px-5 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25 transition-all transform hover:scale-[1.02] active:scale-95"
              >
                <Sparkles size={17} className="animate-spin" />
                <span>Que dois-je faire maintenant ?</span>
              </button>

              <button
                onClick={() => setShowBriefingTomorrowModal(true)}
                className="flex-1 sm:flex-none px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold text-xs md:text-sm rounded-2xl flex items-center justify-center gap-2 border border-white/15 backdrop-blur-md transition-all"
              >
                <Clock size={16} />
                <span>Prépare-moi pour demain</span>
              </button>
            </div>
          </div>

          {/* 6 METRICS CHIPS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2 border-t border-white/10">
            {[
              { label: 'Dossiers Engagés', value: dossiers.length, color: 'text-white' },
              { label: 'En Attente Retour', value: dossiers.filter(d => d.status === 'en_attente').length, color: 'text-blue-300' },
              { label: 'À Relancer (J+8)', value: dossiers.filter(d => d.status === 'a_relancer').length, color: 'text-amber-300' },
              { label: 'RDV cette semaine', value: dossiers.filter(d => d.status === 'rendez_vous').length, color: 'text-indigo-300' },
              { label: 'Échéances <48h', value: dossiers.filter(d => d.isUrgentDeadline).length, color: 'text-red-300' },
              { label: 'Résultats Certifiés', value: missionPlan.certifiedResultsCount || 3, color: 'text-emerald-400' }
            ].map((m, idx) => (
              <div key={idx} className="p-3 bg-white/5 border border-white/10 rounded-2xl text-center space-y-0.5">
                <span className={`text-xl font-black ${m.color}`}>{m.value}</span>
                <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider line-clamp-1">{m.label}</p>
              </div>
            ))}
          </div>

          {/* NEXT BEST ACTION GLOBAL BAR */}
          <div className="p-4 bg-gradient-to-r from-blue-900/40 via-indigo-900/40 to-slate-900/40 border border-blue-500/30 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-300 flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </span>
              <div>
                <h4 className="font-bold text-xs md:text-sm text-white">
                  Action n°1 recommandée : {briefing.careerPulse.nextBestActionGlobal.title}
                </h4>
                <p className="text-xs text-slate-300 line-clamp-1">
                  {briefing.careerPulse.nextBestActionGlobal.subtitle}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                const targetDossier = dossiers.find(d => d.id === briefing.careerPulse.nextBestActionGlobal.dossierId);
                if (targetDossier) {
                  setActiveDossierForModal(targetDossier);
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shrink-0 transition-all shadow-md shadow-blue-600/30"
            >
              <span>Exécuter l'action</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* 🧭 2. FILTERS & STATUS PILLARS */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
        
        {/* TOP ROW: UNIVERSES & SEARCH */}
        <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="flex overflow-x-auto gap-2 pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Tous les Univers' },
              { id: 'emploi', label: 'Emploi' },
              { id: 'clients', label: 'Clients B2B' },
              { id: 'fonds', label: 'Fonds & Bourses' },
              { id: 'achats', label: 'Achats & Sourcing' }
            ].map(u => (
              <button
                key={u.id}
                onClick={() => setUniverseFilter(u.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  universeFilter === u.id 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {u.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un dossier, contact..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={() => setShowOutcomeModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 shadow-xs"
            >
              <Plus size={14} /> <span className="hidden sm:inline">Certifier un Résultat</span>
            </button>
          </div>
        </div>

        {/* BOTTOM ROW: STATUS PILLARS (A FAIRE, EN ATTENTE, A RELANCER, RDV, URGENT, REUSSI) */}
        <div className="flex overflow-x-auto gap-2 pt-2 border-t border-slate-100 pb-1">
          {[
            { id: 'all', label: `Tous (${dossiers.length})`, icon: Layers },
            { id: 'a_faire_aujourdhui', label: `À Faire Aujourd'hui (${dossiers.filter(d => d.status === 'a_faire_aujourdhui' || d.isUrgentDeadline || d.status === 'rendez_vous').length})`, icon: Sparkles },
            { id: 'en_attente', label: `En Attente (${dossiers.filter(d => d.status === 'en_attente').length})`, icon: Clock },
            { id: 'a_relancer', label: `À Relancer (${dossiers.filter(d => d.status === 'a_relancer').length})`, icon: RotateCcw },
            { id: 'rendez_vous', label: `Rendez-vous (${dossiers.filter(d => d.status === 'rendez_vous').length})`, icon: Calendar },
            { id: 'urgent', label: `Urgent (${dossiers.filter(d => d.isUrgentDeadline).length})`, icon: AlertTriangle },
            { id: 'bloque', label: `Bloqués (${dossiers.filter(d => d.isStalled || d.status === 'bloque').length})`, icon: AlertCircle },
            { id: 'reussi', label: `Réussi (${dossiers.filter(d => d.status === 'reussi').length})`, icon: Award }
          ].map(st => (
            <button
              key={st.id}
              onClick={() => setStatusFilter(st.id as any)}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                statusFilter === st.id 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <st.icon size={13} />
              <span>{st.label}</span>
            </button>
          ))}
        </div>

      </div>

      {/* 📋 3. GRID OF LIVING DOSSIERS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {filteredDossiers.map(dossier => {
          const uniBadge = getUniverseBadge(dossier.universe);
          const statusBadge = getStatusDisplay(dossier);

          return (
            <div 
              key={dossier.id}
              className="bg-white rounded-3xl border border-slate-200 hover:border-blue-300 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              {/* TOP CARD BAR */}
              <div className="space-y-2">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-2.5">
                    {dossier.entityLogoUrl ? (
                      <img 
                        src={dossier.entityLogoUrl} 
                        alt={dossier.entityName} 
                        className="w-10 h-10 rounded-2xl object-cover border border-slate-200 shrink-0" 
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                        <Building2 size={18} />
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm md:text-base text-slate-900 line-clamp-1">{dossier.title}</h3>
                      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                        <span>{dossier.entityName}</span>
                        <span>• Match : <strong className="text-emerald-700">{dossier.matchScore}%</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-xl border shrink-0 ${statusBadge.color}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${uniBadge.color}`}>
                    {uniBadge.label}
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-lg border border-slate-200">
                    Étape : {dossier.workflowStage}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Dernier échange il y a {dossier.daysSinceLastContact} jours
                  </span>
                </div>
              </div>

              {/* TIMELINE MINI PREVIEW (LAST 2 EVENTS) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-black uppercase text-slate-500 tracking-wider">
                  <span className="flex items-center gap-1"><Clock size={12} /> Timeline Vivante</span>
                  <span>{dossier.timeline.length} événements</span>
                </div>
                <div className="space-y-1.5">
                  {dossier.timeline.slice(0, 2).map((evt, idx) => (
                    <div key={idx} className="text-xs flex items-start gap-2 text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                      <div className="flex-1">
                        <strong className="text-slate-900">{evt.title}</strong>
                        <span className="text-[11px] text-slate-400 ml-1.5">({evt.date})</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* NEXT BEST ACTION CARD */}
              <div className="p-4 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-blue-900">
                  <span className="flex items-center gap-1.5">
                    <Sparkles size={13} className="text-blue-600" /> Prochain Meilleur Pas (Diallo NBA)
                  </span>
                  <span className="text-slate-600 font-bold">{dossier.nextBestAction.recommendedDeadline}</span>
                </div>
                <p className="text-xs font-bold text-slate-900">
                  {dossier.nextBestAction.headline}
                </p>
                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                  {dossier.nextBestAction.detailedReason}
                </p>
              </div>

              {/* CONTEXTUAL ACTION BUTTONS */}
              <div className="pt-2 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                <button
                  onClick={() => setActiveDossierForModal(dossier)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileText size={13} /> Voir Dossier Vivant
                </button>

                <div className="flex flex-wrap gap-1.5">
                  {dossier.status === 'a_relancer' && (
                    <button
                      onClick={() => setDossierForFollowUp(dossier)}
                      className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                    >
                      <RotateCcw size={13} /> Relancer avec IA
                    </button>
                  )}

                  {dossier.upcomingMeeting && (
                    <button
                      onClick={() => setDossierForMeetingPrep(dossier)}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                    >
                      <Calendar size={13} /> Fiche RDV & Oral
                    </button>
                  )}

                  {dossier.upcomingMeeting && (
                    <button
                      onClick={() => setDossierForDebrief(dossier)}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                    >
                      <CheckCircle2 size={13} /> Débriefer
                    </button>
                  )}

                  {dossier.isStalled && (
                    <button
                      onClick={() => setDossierForPlanB(dossier)}
                      className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                    >
                      <Layers size={13} /> Plan B
                    </button>
                  )}
                </div>
              </div>

            </div>
          );
        })}

        {filteredDossiers.length === 0 && (
          <div className="col-span-full py-16 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-3">
            <Layers size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">Aucun dossier ne correspond à ce filtre.</p>
            <button
              onClick={() => { setStatusFilter('all'); setUniverseFilter('all'); setSearchQuery(''); }}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              Réinitialiser tous les filtres
            </button>
          </div>
        )}
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* MODALS */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* 1. LIVING DOSSIER FULL MODAL */}
      {activeDossierForModal && (
        <CareerLiveDossierModal
          dossier={activeDossierForModal}
          onUpdateDossier={handleUpdateDossier}
          onOpenFollowUpModal={() => {
            setDossierForFollowUp(activeDossierForModal);
            setActiveDossierForModal(null);
          }}
          onOpenMeetingPrepModal={() => {
            setDossierForMeetingPrep(activeDossierForModal);
            setActiveDossierForModal(null);
          }}
          onOpenDebriefModal={() => {
            setDossierForDebrief(activeDossierForModal);
            setActiveDossierForModal(null);
          }}
          onOpenPlanBModal={() => {
            setDossierForPlanB(activeDossierForModal);
            setActiveDossierForModal(null);
          }}
          onOpenCoach3D={onOpenCoach3D}
          onConsultExpert={onConsultExpert}
          onClose={() => setActiveDossierForModal(null)}
        />
      )}

      {/* 2. QUE DOIS-JE FAIRE MAINTENANT ? */}
      {showWhatToDoModal && (
        <CareerWhatShouldIDoNowModal
          briefing={briefing}
          dossiers={dossiers}
          onSelectDossierAction={(dossierId, actionType) => {
            const target = dossiers.find(d => d.id === dossierId);
            if (target) {
              setShowWhatToDoModal(false);
              if (actionType === 'rendez_vous') setDossierForMeetingPrep(target);
              else if (actionType === 'relance') setDossierForFollowUp(target);
              else setActiveDossierForModal(target);
            }
          }}
          onClose={() => setShowWhatToDoModal(false)}
        />
      )}

      {/* 3. PRÉPARE-MOI POUR DEMAIN & BRIEFING SEMAINE */}
      {showBriefingTomorrowModal && (
        <CareerBriefingTomorrowModal
          briefing={briefing}
          dossiers={dossiers}
          onOpenFlashSheetForDossier={(dossierId) => {
            const target = dossiers.find(d => d.id === dossierId);
            if (target) {
              setShowBriefingTomorrowModal(false);
              setDossierForMeetingPrep(target);
            }
          }}
          onClose={() => setShowBriefingTomorrowModal(false)}
        />
      )}

      {/* 4. FICHE DE PRÉPARATION RENDEZ-VOUS */}
      {dossierForMeetingPrep && dossierForMeetingPrep.upcomingMeeting && (
        <CareerMeetingPrepModal
          meeting={dossierForMeetingPrep.upcomingMeeting}
          dossier={dossierForMeetingPrep}
          onLaunchCoach3D={onOpenCoach3D}
          onClose={() => setDossierForMeetingPrep(null)}
        />
      )}

      {/* 5. DÉBRIEFING D'APRÈS-RENDEZ-VOUS */}
      {dossierForDebrief && (
        <CareerPostMeetingDebriefModal
          dossier={dossierForDebrief}
          onSaveDebrief={handleDebriefSaved}
          onClose={() => setDossierForDebrief(null)}
        />
      )}

      {/* 6. RELANCES INTELLIGENTES ANTI-SPAM */}
      {dossierForFollowUp && (
        <CareerSmartFollowUpModal
          dossier={dossierForFollowUp}
          onSendFollowUp={handleFollowUpSent}
          onClose={() => setDossierForFollowUp(null)}
        />
      )}

      {/* 7. CAPITALISATION PLAN B */}
      {dossierForPlanB && (
        <CareerPlanBModal
          planB={generatePlanBForDossier(dossierForPlanB)}
          onSelectAlternativeOpportunity={(opp) => {
            alert(`Opportunité sélectionnée : "${opp.title}" chez ${opp.entity}. Vos documents ont été transférés.`);
            setDossierForPlanB(null);
          }}
          onClose={() => setDossierForPlanB(null)}
        />
      )}

      {/* 8. MODAL D'ENREGISTREMENT DE RÉSULTAT */}
      {showOutcomeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 space-y-5 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <Award size={22} />
                <h3 className="text-lg font-black text-slate-900">Enregistrer un Résultat Certifié</h3>
              </div>
              <button onClick={() => setShowOutcomeModal(false)} className="text-slate-400 hover:text-slate-700">✕</button>
            </div>

            <form onSubmit={handleCreateOutcome} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Type de Résultat Obtenu
                </label>
                <select
                  value={newOutcomeCategory}
                  onChange={(e) => setNewOutcomeCategory(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="client">Client Signé & Contrat B2B</option>
                  <option value="job">Emploi Obtenu / Promotion</option>
                  <option value="revenue">Augmentation de Chiffre d'Affaires</option>
                  <option value="funding">Financement / Bourse Validée</option>
                  <option value="contract">Partenariat / Accord Cadre</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Intitulé du Résultat (Métrique clé)
                </label>
                <input
                  type="text"
                  value={newOutcomeMetric}
                  onChange={(e) => setNewOutcomeMetric(e.target.value)}
                  placeholder="Ex: Contrat de 18 500 € signé avec Groupe Bano, CDI TechCorp..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Détails & Preuve d'Accomplissement
                </label>
                <textarea
                  value={newOutcomeDesc}
                  onChange={(e) => setNewOutcomeDesc(e.target.value)}
                  placeholder="Explications ou lien de vérification..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Valider le Résultat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
