import React, { useState } from 'react';
import {
  Users,
  Search,
  Bot,
  Sparkles,
  Send,
  CheckCircle2,
  Clock,
  Building2,
  Mail,
  Phone,
  MessageSquare,
  Globe,
  Sliders,
  Filter,
  PlusCircle,
  Award,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Eye,
  AlertCircle,
  RefreshCw,
  FileText,
  Calendar,
  Briefcase
} from 'lucide-react';
import { 
  ProspectionCampaign, 
  ProspectionProspect, 
  ProspectionProspectStatus, 
  LocalCommercialRepresentative 
} from '../types';
import { 
  MOCK_PROSPECTION_CAMPAIGNS, 
  MOCK_LOCAL_REPRESENTATIVES 
} from '../constants';

interface TradeProspectionHubProps {
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenMokChatUser?: (userId: string, userName: string) => void;
  onOpenLiveRoom?: (sessionTitle: string, participantName: string) => void;
  onOpenDealManager?: (dealId?: string) => void;
}

const PROSPECT_STATUSES: { id: ProspectionProspectStatus; label: string; color: string }[] = [
  { id: 'identifie', label: '1. Identifié', color: 'bg-slate-700 text-slate-300' },
  { id: 'a_contacter', label: '2. À Contacter', color: 'bg-blue-500/20 text-blue-300' },
  { id: 'contacte', label: '3. Contacté', color: 'bg-amber-500/20 text-amber-300' },
  { id: 'reponse_recue', label: '4. Réponse Reçue', color: 'bg-purple-500/20 text-purple-300' },
  { id: 'interesse', label: '5. Intéressé', color: 'bg-indigo-500/20 text-indigo-300' },
  { id: 'rendez_vous', label: '6. Rendez-vous Fixé', color: 'bg-cyan-500/20 text-cyan-300' },
  { id: 'offre_envoyee', label: '7. Offre Envoyée', color: 'bg-yellow-500/20 text-yellow-300' },
  { id: 'negociation', label: '8. En Négociation', color: 'bg-orange-500/20 text-orange-300' },
  { id: 'gagne', label: '9. Gagné / Client Actif', color: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'perdu', label: '10. Perdu', color: 'bg-rose-500/20 text-rose-300' },
  { id: 'relance_future', label: '11. Relance Future', color: 'bg-slate-500/20 text-slate-400' }
];

export const TradeProspectionHub: React.FC<TradeProspectionHubProps> = ({
  onOpenExpertChat,
  onOpenMokChatUser,
  onOpenLiveRoom,
  onOpenDealManager
}) => {
  const [activeTab, setActiveTab] = useState<'campaigns' | 'representatives' | 'distributors_search' | 'create_campaign'>('campaigns');
  
  // Campaigns state
  const [campaignsList, setCampaignsList] = useState<ProspectionCampaign[]>(MOCK_PROSPECTION_CAMPAIGNS);
  const [selectedCampaign, setSelectedCampaign] = useState<ProspectionCampaign>(MOCK_PROSPECTION_CAMPAIGNS[0]);
  const [selectedProspect, setSelectedProspect] = useState<ProspectionProspect | null>(MOCK_PROSPECTION_CAMPAIGNS[0]?.prospects[0] || null);

  // Representatives state
  const [repsList] = useState<LocalCommercialRepresentative[]>(MOCK_LOCAL_REPRESENTATIVES);
  const [selectedRep, setSelectedRep] = useState<LocalCommercialRepresentative | null>(MOCK_LOCAL_REPRESENTATIVES[0] || null);

  // Filter state for prospects inside campaign
  const [prospectStatusFilter, setProspectStatusFilter] = useState<string>('all');
  const [prospectSearch, setProspectSearch] = useState<string>('');

  // AI Prospecting Agent Action Alert
  const [agentNotification, setAgentNotification] = useState<string | null>(null);

  // Distributor Search Assistant State
  const [distributorQuery, setDistributorQuery] = useState({
    country: 'Sénégal',
    sector: 'Santé & Dispositifs Médicaux',
    size: 'Moyenne à Grande (Grossiste agréé)',
    targetZone: 'Dakar & Axe Diamniadio'
  });
  const [isSearchingDistributors, setIsSearchingDistributors] = useState(false);
  const [distributorSearchResult, setDistributorSearchResult] = useState<string | null>(null);

  // New Campaign Form State
  const [newCampaignForm, setNewCampaignForm] = useState({
    title: '50 Pharmacies & Grossistes Médicaux en Côte d\'Ivoire',
    targetSector: 'Santé & Produits Pharmaceutiques',
    targetCountry: 'Côte d\'Ivoire',
    targetCity: 'Abidjan (Plateau, Yopougon, Treichville)',
    targetProfile: 'Officines privées, cliniques et centrales d\'achat',
    objective: 'Développer le réseau de distribution des kits de diagnostic rapide avec paiement sécurisé.'
  });

  const filteredProspects = selectedCampaign.prospects.filter(p => {
    const matchStatus = prospectStatusFilter === 'all' || p.status === prospectStatusFilter;
    const matchSearch = p.companyName.toLowerCase().includes(prospectSearch.toLowerCase()) ||
                        p.city.toLowerCase().includes(prospectSearch.toLowerCase()) ||
                        p.contactName.toLowerCase().includes(prospectSearch.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Handle Validate AI Message Draft
  const handleValidateDraft = (prospectId: string) => {
    const updatedCampaigns = campaignsList.map(camp => {
      if (camp.id === selectedCampaign.id) {
        return {
          ...camp,
          prospects: camp.prospects.map(pr => {
            if (pr.id === prospectId) {
              return {
                ...pr,
                customMessageValidated: true,
                status: 'contacte' as ProspectionProspectStatus,
                lastInteractionDate: 'Aujourd\'hui',
                history: [
                  ...pr.history,
                  { date: 'Aujourd\'hui', action: 'Message personnalisé validé et transmis', note: 'Canal sélectionné : ' + pr.channel }
                ]
              };
            }
            return pr;
          })
        };
      }
      return camp;
    });

    setCampaignsList(updatedCampaigns);
    const updatedSelected = updatedCampaigns.find(c => c.id === selectedCampaign.id);
    if (updatedSelected) {
      setSelectedCampaign(updatedSelected);
      const updatedPr = updatedSelected.prospects.find(p => p.id === prospectId);
      if (updatedPr) setSelectedProspect(updatedPr);
    }

    setAgentNotification(`Message personnalisé approuvé et transmis avec succès à ${selectedProspect?.contactName} via ${selectedProspect?.channel.toUpperCase()} !`);
    setTimeout(() => setAgentNotification(null), 5000);
  };

  // Handle Advance Prospect Status
  const handleUpdateStatus = (prospectId: string, newStatus: ProspectionProspectStatus) => {
    const updatedCampaigns = campaignsList.map(camp => {
      if (camp.id === selectedCampaign.id) {
        return {
          ...camp,
          prospects: camp.prospects.map(pr => {
            if (pr.id === prospectId) {
              return {
                ...pr,
                status: newStatus,
                lastInteractionDate: 'Aujourd\'hui',
                history: [
                  ...pr.history,
                  { date: 'Aujourd\'hui', action: `Statut mis à jour : ${newStatus}`, note: 'Action manuelle validée' }
                ]
              };
            }
            return pr;
          })
        };
      }
      return camp;
    });

    setCampaignsList(updatedCampaigns);
    const updatedSelected = updatedCampaigns.find(c => c.id === selectedCampaign.id);
    if (updatedSelected) {
      setSelectedCampaign(updatedSelected);
      const updatedPr = updatedSelected.prospects.find(p => p.id === prospectId);
      if (updatedPr) setSelectedProspect(updatedPr);
    }
  };

  // Handle Create Campaign
  const handleCreateCampaign = () => {
    const newCamp: ProspectionCampaign = {
      id: `camp-${Date.now()}`,
      title: newCampaignForm.title,
      targetSector: newCampaignForm.targetSector,
      targetCountry: newCampaignForm.targetCountry,
      targetCountryFlag: '🇨🇮',
      targetCity: newCampaignForm.targetCity,
      targetProfile: newCampaignForm.targetProfile,
      objective: newCampaignForm.objective,
      totalProspects: 15,
      contactedCount: 0,
      responsesCount: 0,
      meetingsCount: 0,
      dealsWonCount: 0,
      createdAt: 'À l\'instant',
      status: 'active',
      prospects: [
        {
          id: `prosp-${Date.now()}-1`,
          companyName: 'Pharmacie Principale du Plateau',
          activity: 'Grande officine & Dépôt hospitalier',
          country: 'Côte d\'Ivoire',
          countryFlag: '🇨🇮',
          city: 'Abidjan',
          contactName: 'Dr. Koffi Assane',
          contactRole: 'Directeur Général',
          email: 'k.assane@pharmaplateau.ci',
          phone: '+225 27 20 21 00 00',
          source: 'Ordre National des Pharmaciens de Côte d\'Ivoire',
          channel: 'email',
          status: 'a_contacter',
          relevanceScore: 94,
          scoreReasons: ['Emplacement stratégique Plateau', 'Fort volume d\'achat', 'Solvabilité A+'],
          customMessageDraft: 'Cher Dr. Assane, Diallo OS a analysé vos besoins récurrents en matériel de diagnostic. Nous vous proposons un approvisionnement direct avec remise volume.',
          customMessageValidated: false,
          notes: 'Premier contact ciblé préparé par l\'Agent de Prospection IA.',
          history: [
            { date: 'Aujourd\'hui', action: 'Génération de la fiche prospect', note: 'Créé via l\'assistant Diallo OS' }
          ]
        }
      ]
    };

    setCampaignsList([newCamp, ...campaignsList]);
    setSelectedCampaign(newCamp);
    setSelectedProspect(newCamp.prospects[0]);
    setActiveTab('campaigns');
    setAgentNotification('Nouvelle campagne de prospection ciblée créée avec 15 premiers prospects qualifiés !');
    setTimeout(() => setAgentNotification(null), 5000);
  };

  const handleRunDistributorSearch = () => {
    setIsSearchingDistributors(true);
    setTimeout(() => {
      setIsSearchingDistributors(false);
      setDistributorSearchResult(`✅ Analyse terminée par Diallo OS : 8 distributeurs majeurs identifiés au ${distributorQuery.country} correspondant à vos critères (Capacité d'importation certifiée, solvabilité vérifiée, aucun litige en cours). Vous pouvez les ajouter directement à votre campagne de prospection.`);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Users size={14} />
                Prospection Commerciale & Réseau Terrain
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <Bot size={13} className="text-emerald-400" />
                Agent IA Anti-Spam & Messages Personnalisés
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Campagnes de Prospection & Représentants Locaux
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Ciblez des marchés précis (ex: 50 pharmacies au Sénégal), qualifiez vos prospects, préparez des messages hyper-personnalisés validés avant envoi et mandatez des représentants locaux agréés.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je souhaite lancer une campagne de prospection commerciale internationale ciblée.')}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Bot size={15} />
              Conseiller Prospection Diallo OS
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'campaigns'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users size={15} />
            Campagnes Actives ({campaignsList.length})
          </button>

          <button
            onClick={() => setActiveTab('representatives')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'representatives'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award size={15} className="text-amber-400" />
            Représentants Commerciaux Locaux ({repsList.length})
          </button>

          <button
            onClick={() => setActiveTab('distributors_search')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'distributors_search'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Search size={15} />
            Trouver des Distributeurs Ciblés
          </button>

          <button
            onClick={() => setActiveTab('create_campaign')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'create_campaign'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <PlusCircle size={15} />
            Nouvelle Campagne Ciblée
          </button>
        </div>
      </div>

      {agentNotification && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{agentNotification}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: CAMPAGNES DE PROSPECTION & STATUTS
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'campaigns' && (
        <div className="space-y-6">
          {/* Campaign Selector Banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{selectedCampaign.targetCountryFlag}</span>
                <div>
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">Campagne Active</span>
                  <h3 className="text-base font-bold text-white">{selectedCampaign.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{selectedCampaign.targetSector} • {selectedCampaign.targetCity}</p>
                </div>
              </div>

              {/* Campaign Switcher Pills */}
              <div className="flex items-center gap-2">
                {campaignsList.map(camp => (
                  <button
                    key={camp.id}
                    onClick={() => {
                      setSelectedCampaign(camp);
                      setSelectedProspect(camp.prospects[0] || null);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                      selectedCampaign.id === camp.id
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                    }`}
                  >
                    <span>{camp.targetCountryFlag}</span>
                    <span className="truncate max-w-[120px]">{camp.title}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Campaign Key Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-4 border-t border-slate-800">
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Cibles</span>
                <div className="text-lg font-black text-white">{selectedCampaign.totalProspects}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Contactés</span>
                <div className="text-lg font-black text-indigo-400">{selectedCampaign.contactedCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Réponses</span>
                <div className="text-lg font-black text-purple-400">{selectedCampaign.responsesCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Rendez-vous</span>
                <div className="text-lg font-black text-cyan-400">{selectedCampaign.meetingsCount}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-center col-span-2 sm:col-span-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Accords Gagnés</span>
                <div className="text-lg font-black text-emerald-400">{selectedCampaign.dealsWonCount}</div>
              </div>
            </div>
          </div>

          {/* Main Grid: Prospects List & Detailed Prospect Card */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Prospects List (5 cols) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Search & Filter */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filtrer prospect, ville, contact..."
                    value={prospectSearch}
                    onChange={(e) => setProspectSearch(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  <button
                    onClick={() => setProspectStatusFilter('all')}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                      prospectStatusFilter === 'all'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}
                  >
                    Tous ({selectedCampaign.prospects.length})
                  </button>
                  {PROSPECT_STATUSES.map(st => (
                    <button
                      key={st.id}
                      onClick={() => setProspectStatusFilter(st.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all ${
                        prospectStatusFilter === st.id
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Prospects Cards List */}
              <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                {filteredProspects.map(prosp => {
                  const statusInfo = PROSPECT_STATUSES.find(s => s.id === prosp.status) || PROSPECT_STATUSES[0];
                  return (
                    <div
                      key={prosp.id}
                      onClick={() => setSelectedProspect(prosp)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        selectedProspect?.id === prosp.id
                          ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                          : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-white">{prosp.companyName}</span>
                            <span className="text-[11px] text-slate-500">({prosp.city})</span>
                          </div>
                          <p className="text-[11px] text-indigo-400 font-medium">{prosp.contactName} • {prosp.contactRole}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                          {prosp.relevanceScore}% match
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2 mt-3 pt-2 border-t border-slate-800/80">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Canal : {prosp.channel.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Selected Prospect Deep Dive & AI Outreach (7 cols) */}
            <div className="lg:col-span-7">
              {selectedProspect ? (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                  {/* Prospect Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base">{selectedProspect.countryFlag}</span>
                        <h3 className="text-lg font-bold text-white">{selectedProspect.companyName}</h3>
                        <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                          {selectedProspect.relevanceScore}% Pertinence
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">{selectedProspect.activity} • {selectedProspect.city}, {selectedProspect.country}</p>
                    </div>

                    {/* Status Changer Dropdown */}
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-500 block uppercase font-bold">Changer de Jalon :</span>
                      <select
                        value={selectedProspect.status}
                        onChange={(e) => handleUpdateStatus(selectedProspect.id, e.target.value as ProspectionProspectStatus)}
                        className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                      >
                        {PROSPECT_STATUSES.map(st => (
                          <option key={st.id} value={st.id}>{st.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contact Info & Verified Source */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Contact Professionnel</span>
                      <div className="text-xs font-bold text-white">{selectedProspect.contactName}</div>
                      <div className="text-xs text-slate-400">{selectedProspect.contactRole}</div>
                      <div className="flex items-center gap-3 pt-1 text-xs text-indigo-300">
                        <span className="flex items-center gap-1"><Mail size={12} /> {selectedProspect.email}</span>
                        <span className="flex items-center gap-1"><Phone size={12} /> {selectedProspect.phone}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Source & Critères de Matching</span>
                      <div className="text-xs text-emerald-400 flex items-center gap-1 font-semibold">
                        <ShieldCheck size={13} /> {selectedProspect.source}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProspect.scoreReasons.map((r, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px]">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* AI Prospecting Agent Message Box */}
                  <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                        <Bot size={15} />
                        Message Personnalisé Préparé par Diallo OS (Anti-Spam)
                      </span>
                      {selectedProspect.customMessageValidated ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
                          <CheckCircle2 size={12} /> Validé & Transmis
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                          <Clock size={12} /> En attente de validation humaine
                        </span>
                      )}
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-mono">
                      {selectedProspect.customMessageDraft}
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      Note de l'Agent : « Message adapté à l'activité spécifique de {selectedProspect.companyName}. Aucun envoi massif non sollicité ne sera effectué sans votre accord formel. »
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      {!selectedProspect.customMessageValidated ? (
                        <button
                          onClick={() => handleValidateDraft(selectedProspect.id)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                        >
                          <Send size={13} />
                          Valider et Envoyer via {selectedProspect.channel.toUpperCase()}
                        </button>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => onOpenMokChatUser && onOpenMokChatUser(`usr-${selectedProspect.id}`, selectedProspect.contactName)}
                            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <MessageSquare size={13} />
                            Ouvrir sur Mok Chat
                          </button>
                          <button
                            onClick={() => onOpenLiveRoom && onOpenLiveRoom(`Rendez-vous Commercial ${selectedProspect.companyName}`, selectedProspect.contactName)}
                            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
                          >
                            <Calendar size={13} />
                            Planifier Session Live B2B
                          </button>
                          <button
                            onClick={() => onOpenDealManager && onOpenDealManager()}
                            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all border border-slate-700"
                          >
                            <Briefcase size={13} />
                            Ouvrir Dossier Commercial
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* History Logs */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Historique des Échanges & Actions</span>
                    <div className="space-y-1.5">
                      {selectedProspect.history.map((h, i) => (
                        <div key={i} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                            <span className="font-bold text-white">{h.action}</span>
                            <span className="text-slate-500">•</span>
                            <span className="text-slate-400">{h.note}</span>
                          </div>
                          <span className="text-[10px] text-slate-500 shrink-0">{h.date}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-12 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-500 text-sm">
                  Sélectionnez un prospect dans la liste pour voir sa fiche complète et l'assistant de message.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: REPRÉSENTANTS COMMERCIAUX LOCAUX
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'representatives' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award size={18} className="text-amber-400" />
              Réseau des Représentants Commerciaux Locaux Agréés
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Une entreprise étrangère peut mandater un professionnel ou cabinet local pour assurer sa prospection terrain, négocier avec les grossistes, superviser le dédouanement et assurer le suivi des ventes en toute confiance.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {repsList.map(rep => (
              <div
                key={rep.id}
                className="bg-slate-900 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 flex flex-col justify-between space-y-4 shadow-lg transition-all"
              >
                <div className="space-y-4">
                  {/* Avatar & Header */}
                  <div className="flex items-start gap-3">
                    <img src={rep.avatarUrl} alt={rep.name} className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500/40" />
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm">{rep.countryFlag}</span>
                        <h4 className="font-bold text-white text-sm">{rep.name}</h4>
                      </div>
                      <p className="text-xs text-indigo-400 font-semibold">{rep.company}</p>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                        {rep.badge}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 line-clamp-3 leading-relaxed">
                    {rep.bio}
                  </p>

                  {/* Sectors & Regions */}
                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Zones Couvertes :</span>
                      <p className="text-xs text-slate-300">{rep.regionsCovered.join(', ')}</p>
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Langues Maîtrisées :</span>
                      <p className="text-xs text-indigo-300">{rep.languages.join(' • ')}</p>
                    </div>
                  </div>

                  {/* Services */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Missions Types :</span>
                    <ul className="space-y-1">
                      {rep.availableServices.map((srv, idx) => (
                        <li key={idx} className="text-[11px] text-slate-400 flex items-start gap-1.5">
                          <CheckCircle2 size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{srv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Footer Rate & Action */}
                <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-slate-500">Taux Journalier Estimé</span>
                    <div className="text-sm font-black text-white">{rep.dailyRateEstimate} {rep.currency} / jour</div>
                  </div>

                  <button
                    onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', `Je souhaite mandater le représentant local ${rep.name} (${rep.country}) pour une mission de prospection.`)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow"
                  >
                    Mandater
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: RECHERCHE DE DISTRIBUTEURS CIBLÉS
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'distributors_search' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="max-w-2xl space-y-2">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Search size={18} className="text-indigo-400" />
              Moteur de Recherche de Distributeurs & Grossistes
            </h3>
            <p className="text-xs text-slate-400">
              Définissez votre profil de distributeur idéal pour que Diallo OS croise les registres de commerce officiels, bases douanières et réseaux certifiés.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Pays Cible</label>
              <input
                type="text"
                value={distributorQuery.country}
                onChange={(e) => setDistributorQuery({ ...distributorQuery, country: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Secteur / Produits</label>
              <input
                type="text"
                value={distributorQuery.sector}
                onChange={(e) => setDistributorQuery({ ...distributorQuery, sector: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Taille & Capacité</label>
              <input
                type="text"
                value={distributorQuery.size}
                onChange={(e) => setDistributorQuery({ ...distributorQuery, size: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Zone Géographique</label>
              <input
                type="text"
                value={distributorQuery.targetZone}
                onChange={(e) => setDistributorQuery({ ...distributorQuery, targetZone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRunDistributorSearch}
              disabled={isSearchingDistributors}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              {isSearchingDistributors ? (
                <>
                  <RefreshCw size={15} className="animate-spin" />
                  Recherche & Audit IA en cours...
                </>
              ) : (
                <>
                  <Search size={15} />
                  Lancer la Recherche de Distributeurs
                </>
              )}
            </button>
          </div>

          {distributorSearchResult && (
            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-200 text-xs sm:text-sm leading-relaxed space-y-3 animate-fade-in">
              <p>{distributorSearchResult}</p>
              <button
                onClick={() => setActiveTab('campaigns')}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5"
              >
                Voir les Distributeurs dans la Campagne
                <ArrowRight size={13} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: CRÉER UNE NOUVELLE CAMPAGNE DE PROSPECTION
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create_campaign' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 max-w-3xl">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <PlusCircle size={18} className="text-indigo-400" />
              Configurer une Campagne de Prospection IA
            </h3>
            <p className="text-xs text-slate-400">
              Définissez votre cible (ex: 50 pharmacies au Sénégal ou torréfacteurs en Europe). Diallo OS qualifie la liste et rédige les propositions sur-mesure.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Intitulé de la Campagne</label>
              <input
                type="text"
                value={newCampaignForm.title}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, title: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Secteur d'Activité</label>
                <input
                  type="text"
                  value={newCampaignForm.targetSector}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, targetSector: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400">Pays Cible</label>
                <input
                  type="text"
                  value={newCampaignForm.targetCountry}
                  onChange={(e) => setNewCampaignForm({ ...newCampaignForm, targetCountry: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Villes & Régions Ciblées</label>
              <input
                type="text"
                value={newCampaignForm.targetCity}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, targetCity: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Profil des Décideurs Cibles</label>
              <input
                type="text"
                value={newCampaignForm.targetProfile}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, targetProfile: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-400">Objectif Commercial & Proposition de Valeur</label>
              <textarea
                rows={3}
                value={newCampaignForm.objective}
                onChange={(e) => setNewCampaignForm({ ...newCampaignForm, objective: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={handleCreateCampaign}
              className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all"
            >
              <PlusCircle size={15} />
              Générer la Campagne avec Diallo OS
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
