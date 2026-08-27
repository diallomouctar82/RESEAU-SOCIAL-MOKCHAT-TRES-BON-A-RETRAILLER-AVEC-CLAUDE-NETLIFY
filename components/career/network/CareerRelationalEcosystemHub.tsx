import React, { useState } from 'react';
import { 
  Users, 
  Target, 
  Radar, 
  Briefcase, 
  Building2, 
  Search, 
  Filter, 
  Sparkles, 
  ShieldCheck, 
  ArrowRight, 
  Plus, 
  MapPin, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ExternalLink, 
  ChevronRight, 
  Send, 
  Tv, 
  Film, 
  Award, 
  TrendingUp, 
  DollarSign, 
  HelpCircle,
  Compass,
  AlertCircle
} from 'lucide-react';
import { 
  RelationalNode, 
  IdealCustomerProfile, 
  CommercialBusinessSignal, 
  OpportunityCollaborativeTeam, 
  MentorshipConnection,
  RelationalEcosystemSummary
} from '../../../types';
import { 
  INITIAL_RELATIONAL_NODES, 
  INITIAL_IDEAL_CUSTOMER_PROFILE, 
  INITIAL_COMMERCIAL_SIGNALS, 
  INITIAL_COLLABORATIVE_TEAMS, 
  INITIAL_MENTORSHIPS,
  calculateRelationalSummary 
} from '../../../services/careerNetworkEngine';

import { CareerRelationshipMapModal } from './CareerRelationshipMapModal';
import { CareerWhoShouldIKnowModal } from './CareerWhoShouldIKnowModal';
import { CareerIntroductionModal } from './CareerIntroductionModal';
import { CareerContactDetailModal } from './CareerContactDetailModal';
import { CareerCollaborativeMissionModal } from './CareerCollaborativeMissionModal';
import { CareerMentorshipModal } from './CareerMentorshipModal';
import { CareerEcosystem360Modal } from './CareerEcosystem360Modal';

interface CareerRelationalEcosystemHubProps {
  userName: string;
  userRole?: string;
  activeGoalTitle: string;
  onOpenCampusOrMoc?: (type: 'tribe' | 'live' | 'reel', idOrTitle: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

type SubTab = 'pipeline_crm' | 'prospection_icp' | 'partners_funding' | 'moc_synergies';

export const CareerRelationalEcosystemHub: React.FC<CareerRelationalEcosystemHubProps> = ({
  userName,
  userRole,
  activeGoalTitle,
  onOpenCampusOrMoc,
  onNavigateToTab
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('pipeline_crm');
  
  // Data State
  const [nodes, setNodes] = useState<RelationalNode[]>(INITIAL_RELATIONAL_NODES);
  const [icp, setIcp] = useState<IdealCustomerProfile>(INITIAL_IDEAL_CUSTOMER_PROFILE);
  const [signals, setSignals] = useState<CommercialBusinessSignal[]>(INITIAL_COMMERCIAL_SIGNALS);
  const [teams, setTeams] = useState<OpportunityCollaborativeTeam[]>(INITIAL_COLLABORATIVE_TEAMS);
  const [mentorships, setMentorships] = useState<MentorshipConnection[]>(INITIAL_MENTORSHIPS);

  // Modals
  const [showMapModal, setShowMapModal] = useState(false);
  const [showWhoShouldIKnowModal, setShowWhoShouldIKnowModal] = useState(false);
  const [showEcosystem360Modal, setShowEcosystem360Modal] = useState(false);
  const [selectedContactForDetail, setSelectedContactForDetail] = useState<RelationalNode | null>(null);
  const [selectedContactForIntro, setSelectedContactForIntro] = useState<RelationalNode | null>(null);
  const [selectedTeamForMission, setSelectedTeamForMission] = useState<OpportunityCollaborativeTeam | null>(null);
  const [showMentorshipModal, setShowMentorshipModal] = useState(false);
  const [showWhoToFollowUpDialog, setShowWhoToFollowUpDialog] = useState(false);

  // Filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const summary: RelationalEcosystemSummary = calculateRelationalSummary(nodes, icp, teams, mentorships);

  // Handlers
  const handleUpdateContact = (updated: RelationalNode) => {
    setNodes(prev => prev.map(n => n.id === updated.id ? updated : n));
    if (selectedContactForDetail?.id === updated.id) {
      setSelectedContactForDetail(updated);
    }
  };

  const handleUpdateTeam = (updatedTeam: OpportunityCollaborativeTeam) => {
    setTeams(prev => prev.map(t => t.id === updatedTeam.id ? updatedTeam : t));
    if (selectedTeamForMission?.id === updatedTeam.id) {
      setSelectedTeamForMission(updatedTeam);
    }
  };

  const handleSendIntroduction = (introData: any) => {
    setNodes(prev => prev.map(n => {
      if (n.id === introData.targetNodeId) {
        return {
          ...n,
          stage: 'contact_initial',
          lastInteractionDate: 'Aujourd\'hui',
          nextBestAction: 'Attendre le retour sous 48h ou relancer avec jalon courtois.'
        };
      }
      return n;
    }));
  };

  const filteredNodes = nodes.filter(n => {
    const matchesCat = categoryFilter === 'all' || n.category === categoryFilter;
    const matchesSearch = !searchQuery || 
      n.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const dueFollowUps = nodes.filter(n => n.canSendFollowUpToday);

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* 🌟 1. HERO COCKPIT: PULSE RELATIONNEL & COMMANDES D'ACTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gradient-to-b from-indigo-600/20 via-blue-600/10 to-transparent rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 space-y-6">
          
          {/* Top Title & Vision Banner */}
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 font-bold uppercase text-xs tracking-wider mb-1.5">
                <Users size={15} /> Agent Autonome de Développement Professionnel & Entrepreneurial
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                Capital Relationnel, Réseau & Prospection
              </h2>
              <p className="text-slate-400 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
                Ne plus attendre qu'une opportunité apparaisse : identifier les bonnes personnes, créer des relations utiles et les transformer en résultats concrets.
              </p>
            </div>

            {/* Quick Strategic Actions */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowWhoShouldIKnowModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
              >
                <Sparkles size={15} /> Qui devrais-je connaître ?
              </button>

              <button
                onClick={() => setShowMapModal(true)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
              >
                <Compass size={15} /> Carte Relationnelle
              </button>

              <button
                onClick={() => setShowEcosystem360Modal(true)}
                className="px-4 py-2.5 bg-indigo-950/70 hover:bg-indigo-900 text-indigo-300 rounded-xl text-xs font-bold transition-all border border-indigo-700/50 flex items-center gap-2"
              >
                <Target size={15} /> Écosystème 360°
              </button>
            </div>
          </div>

          {/* Strategic Metrics Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Contacts Utiles', value: summary.totalContacts, icon: Users, color: 'text-white' },
              { label: 'Haut Impact (>90%)', value: summary.highImpactContactsCount, icon: Sparkles, color: 'text-indigo-400' },
              { label: 'Deals & Négociations', value: summary.activeDealsCount, icon: Briefcase, color: 'text-emerald-400' },
              { label: 'Introductions en Cours', value: summary.pendingIntroductionsCount, icon: Send, color: 'text-amber-400' },
              { label: 'Relances Courtoises J+7', value: summary.followUpsDueTodayCount, icon: Clock, color: 'text-blue-400' },
              { label: 'Consortia & Équipes', value: teams.length, icon: Building2, color: 'text-purple-400' }
            ].map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 text-slate-400 shrink-0">
                    <Icon size={16} />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-medium block uppercase tracking-wider">{m.label}</span>
                    <span className={`text-base font-black ${m.color}`}>{m.value}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* "Qui dois-je relancer / contacter aujourd'hui ?" Prompt Ribbon */}
          <div className="p-4 bg-slate-950/90 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
                <Clock size={18} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">« Qui dois-je contacter ou relancer aujourd'hui ? »</h4>
                <p className="text-[11px] text-slate-400">
                  {dueFollowUps.length > 0 
                    ? `${dueFollowUps.length} contact(s) ont atteint le délai de courtoisie légitime (J+7) avec apport de valeur prêt.` 
                    : 'Aucune relance urgente requise aujourd\'hui. Le timing de courtoisie est respecté.'}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowWhoToFollowUpDialog(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shrink-0"
            >
              Vérifier l'Arbitrage
            </button>
          </div>

        </div>
      </div>

      {/* 🧭 2. SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: 'pipeline_crm', label: 'Mini-CRM & Pipeline Relationnel', icon: Users },
          { id: 'prospection_icp', label: 'Trouver des Clients & Signaux B2B', icon: Target },
          { id: 'partners_funding', label: 'Partenaires & Pipeline Financement', icon: Building2 },
          { id: 'moc_synergies', label: 'Synergies Réseau MOC & Marque Pro', icon: Tv }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-3 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive 
                  ? 'bg-slate-900 text-white shadow-md' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 🚀 3. SUB-TAB CONTENT */}

      {/* ======================================================== */}
      {/* SUB-TAB 1: MINI-CRM & PIPELINE RELATIONNEL */}
      {/* ======================================================== */}
      {activeSubTab === 'pipeline_crm' && (
        <div className="space-y-6">
          
          {/* Controls Bar: Filters & Search */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex items-center gap-1 overflow-x-auto w-full md:w-auto">
              {[
                { id: 'all', label: 'Tous' },
                { id: 'clients', label: 'Clients' },
                { id: 'prospects', label: 'Prospects' },
                { id: 'partenaires', label: 'Partenaires' },
                { id: 'investisseurs', label: 'Investisseurs' },
                { id: 'facilitateurs', label: 'Facilitateurs' },
                { id: 'mentors', label: 'Mentors' }
              ].map(c => (
                <button
                  key={c.id}
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    categoryFilter === c.id 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Rechercher par nom, entité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Cards Grid of Relational Contacts */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNodes.map(contact => (
              <div 
                key={contact.id}
                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  
                  {/* Top Identity Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img 
                        src={contact.avatarUrl} 
                        alt={contact.name}
                        className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shrink-0" 
                      />
                      <div className="min-w-0">
                        <h4 className="font-bold text-sm text-slate-900 truncate">{contact.name}</h4>
                        <p className="text-xs text-slate-500 truncate">{contact.role}</p>
                        <span className="text-[11px] font-semibold text-blue-600 truncate block">{contact.organization}</span>
                      </div>
                    </div>

                    <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg shrink-0">
                      {contact.relevanceScore}%
                    </span>
                  </div>

                  {/* Stage Pill & Location */}
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] uppercase">
                      {contact.stage.replace('_', ' ')}
                    </span>
                    <span className="text-slate-400 text-[11px]">{contact.location}</span>
                  </div>

                  {/* Next Best Action */}
                  <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Prochaine Action</span>
                    <p className="text-slate-700 font-medium line-clamp-2 leading-relaxed">
                      {contact.nextBestAction || 'Maintenir le lien informel.'}
                    </p>
                  </div>

                  {/* Why We Should Talk Excerpt */}
                  <p className="text-[11px] text-slate-500 line-clamp-2 italic">
                    "{contact.whyWeShouldTalk}"
                  </p>

                </div>

                {/* Card Actions */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setSelectedContactForDetail(contact)}
                    className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
                  >
                    Fiche & Mémoire
                  </button>

                  {contact.stage === 'introduction' ? (
                    <button
                      onClick={() => setSelectedContactForIntro(contact)}
                      className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      Introduction
                    </button>
                  ) : (
                    <button
                      onClick={() => setSelectedContactForDetail(contact)}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-sm"
                    >
                      Suivi
                    </button>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 2: TROUVER DES CLIENTS & CLIENT IDÉAL IA (ICP) */}
      {/* ======================================================== */}
      {activeSubTab === 'prospection_icp' && (
        <div className="space-y-6">
          
          {/* ICP Configuration & Proposition of Value */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1.5">
                  <Target size={15} /> Profil du Client Idéal IA (ICP)
                </span>
                <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-0.5">
                  Ciblage & Proposition de Valeur Évolutive
                </h3>
              </div>
              <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl font-bold">
                Affinement continu basé sur vos victoires
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Secteur Cible</span>
                <p className="font-bold text-slate-800">{icp.targetSector}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Taille d'Entreprise</span>
                <p className="font-bold text-slate-800">{icp.targetCompanySize}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Zone Géographique</span>
                <p className="font-bold text-slate-800">{icp.targetLocation}</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 block">Panier / Budget Cible</span>
                <p className="font-bold text-blue-600">{icp.budgetRange}</p>
              </div>
            </div>

            {/* Core Value Proposition ("Pourquoi quelqu'un devrait travailler avec moi ?") */}
            <div className="p-5 bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Sparkles size={14} /> Réponse Clé : « Pourquoi travailler avec vous ? »
              </span>
              <p className="text-sm font-medium leading-relaxed">
                "{icp.valueProposition}"
              </p>
            </div>
          </div>

          {/* Commercial Signals Detected in Authorized Networks */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <Radar size={15} /> Signaux d'Affaires & Déclencheurs Commerciaux
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Opportunités Proactives Détectées
                </h3>
              </div>
              <span className="text-xs text-slate-500">{signals.length} signaux vérifiés</span>
            </div>

            <div className="space-y-3">
              {signals.map(sig => (
                <div key={sig.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-slate-900">{sig.companyName}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-blue-100 text-blue-800 uppercase">
                          {sig.signalType.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 mt-0.5">{sig.headline}</p>
                    </div>

                    <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg shrink-0">
                      {sig.confidenceScore}% Confiance
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200">
                    <div>
                      <span className="font-bold text-slate-500 block">Opportunité potentielle :</span>
                      <p className="text-slate-700">{sig.potentialOpportunity}</p>
                    </div>
                    <div>
                      <span className="font-bold text-blue-600 block">Angle d'approche suggéré :</span>
                      <p className="text-slate-700">{sig.suggestedApproachAngle}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 3: PARTENAIRES, INVESTISSEURS & CONSORTIA */}
      {/* ======================================================== */}
      {activeSubTab === 'partners_funding' && (
        <div className="space-y-6">
          
          {/* Funding Pipeline */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <DollarSign size={15} /> Pipeline de Financement & Fonds
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Investisseurs & Bourses en Négociation
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.fundingPipeline.map(fp => (
                <div key={fp.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900">{fp.funderName}</h4>
                      <span className="text-xs text-blue-600 font-semibold">{fp.stage}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-xl">
                      {fp.targetAmount}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600">Prochaine étape : <strong className="text-slate-800">{fp.nextStep}</strong></p>
                </div>
              ))}
            </div>
          </div>

          {/* Collaborative Teams & Consortia */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 flex items-center gap-1.5">
                  <Building2 size={15} /> Équipes d'Opportunité & Réponse Collective
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-0.5">
                  Consortia Pluridisciplinaires
                </h3>
              </div>
            </div>

            <div className="space-y-3">
              {teams.map(team => (
                <div key={team.id} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{team.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Cible : <strong className="text-slate-700">{team.targetOpportunityTitle}</strong></p>
                    <div className="flex items-center gap-3 text-xs text-slate-600 mt-2">
                      <span className="font-bold text-emerald-600">{team.targetOpportunityBudget}</span>
                      <span>•</span>
                      <span>{team.requiredRoles.length} experts mobilisés</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedTeamForMission(team)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-md transition-all shrink-0"
                  >
                    Ouvrir l'Espace Mission
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Mentorship Hub Launcher */}
          <div className="p-6 bg-gradient-to-r from-amber-950/80 via-slate-900 to-slate-900 text-white rounded-3xl border border-amber-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Award size={15} /> Boucle de Mentorat & Transmission
              </div>
              <h3 className="text-base font-bold">Mentorat Intelligent & Réputation de Compétence</h3>
              <p className="text-xs text-slate-300 max-w-xl">
                Trouvez un mentor d'élite pour sécuriser vos arbitrages ou devenez mentor pour valoriser vos accomplissements.
              </p>
            </div>

            <button
              onClick={() => setShowMentorshipModal(true)}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all shrink-0"
            >
              Accéder au Mentorat ({mentorships.length})
            </button>
          </div>

        </div>
      )}

      {/* ======================================================== */}
      {/* SUB-TAB 4: SYNERGIES RÉSEAU MOC & MARQUE PROFESSIONNELLE */}
      {/* ======================================================== */}
      {activeSubTab === 'moc_synergies' && (
        <div className="space-y-6">
          
          {/* Smart Visibility & Brand Strategy */}
          <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                <Sparkles size={15} /> Mode « Visibilité Intelligente »
              </span>
              <h3 className="text-lg md:text-xl font-bold text-slate-900 mt-0.5">
                Stratégie de Marque Professionnelle & Preuves
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Pas de course artificielle à la viralité : construction progressive d'une réputation solide et respectée.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-purple-700 block">1. Expertise Principale</span>
                <p className="text-xs text-slate-700">Direction de projets, architecture de flux logistiques et conformité d'exportation.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-blue-700 block">2. Vitrine Studio & Portfolio</span>
                <p className="text-xs text-slate-700">3 études de cas chiffrées, rapports d'audit et attestations vérifiées Mok Trust.</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-emerald-700 block">3. Canaux de Rayonnement</span>
                <p className="text-xs text-slate-700">Contributions aux Tribus clés, interventions ciblées lors des Lives sectoriels.</p>
              </div>
            </div>
          </div>

          {/* Direct Synergies with Réseau MOC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Recommended Tribus */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  <h4 className="font-bold text-sm text-slate-900">Tribus MOC Recommandées</h4>
                </div>
                <span className="text-xs text-slate-400">Contextuel</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { name: 'Agro-Entrepreneurs & Exportateurs CEDEAO', members: '2 850 membres', desc: 'Échanges quotidiens sur les corridors de fret et les normes d\'empotage.' },
                  { name: 'Lead Architects & Tech Leaders Afrique', members: '1 420 membres', desc: 'Partage de bonnes pratiques d\'intégration ERP et cloud souverain.' }
                ].map((tr, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{tr.name}</h5>
                      <p className="text-[11px] text-slate-500">{tr.desc}</p>
                    </div>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-1 rounded-md shrink-0">
                      {tr.members}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Smart Lives as Opportunity Generators */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv size={18} className="text-rose-600" />
                  <h4 className="font-bold text-sm text-slate-900">Lives Sectoriels comme Source d'Opportunités</h4>
                </div>
                <span className="text-xs text-slate-400">À venir</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { title: 'Financement des PME & Bourses Export', host: 'Banque d\'Investissement', time: 'Demain 16h00' },
                  { title: 'Traçabilité & Dématérialisation Portuaire', host: 'Douanes & Logistique Hub', time: 'Vendredi 11h00' }
                ].map((lv, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="text-xs font-bold text-slate-900">{lv.title}</h5>
                      <p className="text-[11px] text-slate-500">Animé par {lv.host} • {lv.time}</p>
                    </div>
                    <span className="text-[10px] bg-rose-50 text-rose-700 font-bold px-2 py-1 rounded-md shrink-0">
                      Live Pro
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 🚀 MODAL 1: RELATIONSHIP MAP MODAL */}
      {showMapModal && (
        <CareerRelationshipMapModal
          nodes={nodes}
          activeGoal={activeGoalTitle}
          onSelectNode={(n) => {
            setShowMapModal(false);
            setSelectedContactForDetail(n);
          }}
          onOpenIntroduction={(n) => {
            setShowMapModal(false);
            setSelectedContactForIntro(n);
          }}
          onClose={() => setShowMapModal(false)}
        />
      )}

      {/* 💡 MODAL 2: WHO SHOULD I KNOW MODAL */}
      {showWhoShouldIKnowModal && (
        <CareerWhoShouldIKnowModal
          activeGoal={activeGoalTitle}
          onConnectToCategory={(cat) => {
            setCategoryFilter('all');
            setActiveSubTab('pipeline_crm');
          }}
          onClose={() => setShowWhoShouldIKnowModal(false)}
        />
      )}

      {/* 🤝 MODAL 3: MODE INTRODUCTION MODAL */}
      {selectedContactForIntro && (
        <CareerIntroductionModal
          contact={selectedContactForIntro}
          userName={userName}
          userRole={userRole}
          onSendIntroduction={handleSendIntroduction}
          onClose={() => setSelectedContactForIntro(null)}
        />
      )}

      {/* 📄 MODAL 4: 360 CONTACT DETAIL & MEMORY CRM */}
      {selectedContactForDetail && (
        <CareerContactDetailModal
          contact={selectedContactForDetail}
          onUpdateContact={handleUpdateContact}
          onOpenIntroduction={(c) => {
            setSelectedContactForDetail(null);
            setSelectedContactForIntro(c);
          }}
          onOpenCampusOrMoc={onOpenCampusOrMoc}
          onClose={() => setSelectedContactForDetail(null)}
        />
      )}

      {/* 👥 MODAL 5: COLLABORATIVE MISSION & TEAMS */}
      {selectedTeamForMission && (
        <CareerCollaborativeMissionModal
          team={selectedTeamForMission}
          onUpdateTeam={handleUpdateTeam}
          onClose={() => setSelectedTeamForMission(null)}
        />
      )}

      {/* 🎓 MODAL 6: MENTORSHIP & TRANSMISSION */}
      {showMentorshipModal && (
        <CareerMentorshipModal
          mentorships={mentorships}
          userName={userName}
          onUpdateMentorships={setMentorships}
          onClose={() => setShowMentorshipModal(false)}
        />
      )}

      {/* 🌐 MODAL 7: 360 ECOSYSTEM MODAL */}
      {showEcosystem360Modal && (
        <CareerEcosystem360Modal
          summary={summary}
          nodes={nodes}
          onOpenMap={() => {
            setShowEcosystem360Modal(false);
            setShowMapModal(true);
          }}
          onOpenWhoShouldIKnow={() => {
            setShowEcosystem360Modal(false);
            setShowWhoShouldIKnowModal(true);
          }}
          onClose={() => setShowEcosystem360Modal(false)}
        />
      )}

      {/* ⏰ POPUP: "QUI DOIS-JE RELANCER AUJOURD'HUI ?" */}
      {showWhoToFollowUpDialog && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="text-blue-600" size={20} />
                <h3 className="font-bold text-slate-900 text-base">Arbitrage des Relances du Jour</h3>
              </div>
              <button onClick={() => setShowWhoToFollowUpDialog(false)} className="p-1 rounded-full hover:bg-slate-100 text-slate-400">
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {dueFollowUps.length > 0 ? (
                dueFollowUps.map(c => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-slate-900">{c.name}</h5>
                      <p className="text-slate-500">{c.organization} • <strong className="text-blue-600">{c.nextBestAction}</strong></p>
                    </div>
                    <button
                      onClick={() => {
                        setShowWhoToFollowUpDialog(false);
                        setSelectedContactForDetail(c);
                      }}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-500"
                    >
                      Ouvrir
                    </button>
                  </div>
                ))
              ) : (
                <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-center">
                  <CheckCircle2 className="mx-auto mb-1 text-emerald-600" size={20} />
                  <p className="font-bold">Personne à relancer aujourd'hui.</p>
                  <p className="text-[11px] text-emerald-700 mt-0.5">Tous vos contacts sont dans leur délai de courtoisie légitime.</p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowWhoToFollowUpDialog(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
