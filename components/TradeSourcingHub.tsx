import React, { useState } from 'react';
import {
  Compass,
  Search,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Globe,
  Sliders,
  ExternalLink,
  MessageSquare,
  Bot,
  PlusCircle,
  FileText,
  Clock,
  Layers,
  ChevronDown,
  Check,
  Zap,
  Tag
} from 'lucide-react';
import { 
  BusinessMatch, 
  SourcingMission, 
  SourcingShortlistItem 
} from '../types';
import { 
  MOCK_BUSINESS_MATCHES, 
  MOCK_SOURCING_MISSIONS 
} from '../constants';

interface TradeSourcingHubProps {
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenMokChatUser?: (userId: string, userName: string) => void;
  onOpenDealManager?: (missionId?: string) => void;
}

export const TradeSourcingHub: React.FC<TradeSourcingHubProps> = ({
  onOpenExpertChat,
  onOpenMokChatUser,
  onOpenDealManager
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'matching' | 'missions' | 'agent'>('matching');
  
  // Business Matching State
  const [matchesList, setMatchesList] = useState<BusinessMatch[]>(MOCK_BUSINESS_MATCHES);
  const [selectedMatch, setSelectedMatch] = useState<BusinessMatch | null>(MOCK_BUSINESS_MATCHES[0] || null);

  // Sourcing Missions State
  const [missionsList, setMissionsList] = useState<SourcingMission[]>(MOCK_SOURCING_MISSIONS);
  const [selectedMission, setSelectedMission] = useState<SourcingMission | null>(MOCK_SOURCING_MISSIONS[0] || null);
  
  // New Mission Modal / Form
  const [isCreatingMission, setIsCreatingMission] = useState(false);
  const [newMissionForm, setNewMissionForm] = useState({
    title: 'Sourcing Panneaux Photovoltaïques Bifaciaux 550W & Batteries LiFePO4',
    sector: 'Énergie & Solaire Renouvelable',
    product: 'Panneaux solaires Tier 1 certifiés IEC + Onduleurs hybrides',
    quantity: 500,
    unit: 'Panneaux',
    budget: 65000,
    currency: 'EUR',
    countries: 'Chine, Turquie, Allemagne',
    certifications: 'CE, IEC 61215, ISO 9001',
    leadTime: 35,
    destinationPort: 'Port de Conakry (CIF)'
  });

  // Contact Modal for Shortlisted Supplier
  const [contactingSupplier, setContactingSupplier] = useState<SourcingShortlistItem | null>(null);
  const [diplomaticMessage, setDiplomaticMessage] = useState<string>('');
  const [contactSuccessAlert, setContactSuccessAlert] = useState<string | null>(null);

  // Open Contact Supplier Modal with AI drafted message
  const handleOpenContactModal = (item: SourcingShortlistItem) => {
    setContactingSupplier(item);
    const draft = `Bonjour ${item.supplierName},\n\nNous vous contactons via la plateforme LE MONDE À VOUS dans le cadre de notre mission d'approvisionnement pour "${item.productTitle}".\n\nNous avons pris connaissance de vos capacités de production (${item.productionCapacity}) et de vos certifications (${item.certifications.join(', ')}).\n\nNous souhaitons recevoir votre meilleure offre formelle CIF Port de Conakry ainsi qu'une confirmation des délais de fabrication (${item.leadTimeDays} jours).\n\nDans l'attente de votre retour,\nDirection des Achats & Approvisionnements.`;
    setDiplomaticMessage(draft);
  };

  const handleSendSupplierMessage = () => {
    if (!contactingSupplier) return;
    setContactSuccessAlert(`Message commercial officiel transmis avec succès à ${contactingSupplier.supplierName} ! Suivi activé dans vos négociations.`);
    setContactingSupplier(null);
    setTimeout(() => setContactSuccessAlert(null), 5000);
  };

  const handleCreateMission = () => {
    const created: SourcingMission = {
      id: `src-mission-${Date.now()}`,
      title: newMissionForm.title,
      requesterId: 'u1',
      requesterName: 'Amadou Diallo',
      targetSector: newMissionForm.sector,
      targetProduct: newMissionForm.product,
      specifications: [
        'Rendement module > 21.5% avec garantie de performance linéaire 25 ans',
        'Cadre aluminium anodisé résistant à l\'atmosphère saline côtière',
        'Contrôle qualité pré-embarquement SGS / BIVAC exigé'
      ],
      quantityTarget: newMissionForm.quantity,
      unit: newMissionForm.unit,
      budgetMax: newMissionForm.budget,
      currency: newMissionForm.currency,
      acceptedCountries: newMissionForm.countries.split(',').map(c => c.trim()),
      requiredCertifications: newMissionForm.certifications.split(',').map(c => c.trim()),
      leadTimeMaxDays: newMissionForm.leadTime,
      destinationPortCity: newMissionForm.destinationPort,
      selectionCriteria: ['Prix unitaire', 'Solidité financière', 'Support technique'],
      status: 'brief_active',
      createdAt: 'Aujourd\'hui',
      shortlist: []
    };
    setMissionsList([created, ...missionsList]);
    setSelectedMission(created);
    setIsCreatingMission(false);
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Compass size={14} />
                Sourcing & Matching Mondial
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Sourcing International & Moteur Business Match
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Rapprochement automatique des offres et besoins mondiaux, missions de recherche guidées et sourcing web qualifié.
            </p>
          </div>

          <button
            onClick={() => setIsCreatingMission(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-colors shrink-0"
          >
            <PlusCircle size={16} />
            Lancer une Mission Sourcing
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveSubTab('matching')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'matching'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Zap size={15} className="text-amber-400" />
            « Je cherche ↔ Je propose » Business Match ({matchesList.length})
          </button>

          <button
            onClick={() => setActiveSubTab('missions')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'missions'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Compass size={15} />
            Missions de Sourcing & Shortlists ({missionsList.length})
          </button>

          <button
            onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je veux lancer un sourcing approfondi avec l\'Agent Sourcing Diallo OS.')}
            className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center gap-1.5 transition-all ml-auto"
          >
            <Bot size={15} />
            Agent Sourcing IA
          </button>
        </div>
      </div>

      {contactSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{contactSuccessAlert}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 1: BUSINESS MATCHING (JE CHERCHE ↔ JE PROPOSE)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'matching' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Matches List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Correspondances Économiques Détectées
            </h3>

            {matchesList.map(match => (
              <div
                key={match.id}
                onClick={() => setSelectedMatch(match)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedMatch?.id === match.id
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1">
                    <span>{match.seekerFlag}</span>
                    <span className="truncate max-w-[110px]">{match.seekerName}</span>
                    <span className="text-slate-500">↔</span>
                    <span>{match.offererFlag}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black">
                    {match.matchingScore}%
                  </span>
                </div>

                <p className="text-xs text-indigo-300 mt-2 line-clamp-1 font-medium">
                  {match.sector}
                </p>

                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                  {match.seekerNeed}
                </p>
              </div>
            ))}
          </div>

          {/* Match Detail & Explanation */}
          {selectedMatch && (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              {/* Header Match */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">{selectedMatch.corridor}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{selectedMatch.sector}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">
                    Analyse du Rapprochement Économique
                  </h3>
                </div>

                <div className="p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-center">
                  <div className="text-xl font-black text-indigo-300">{selectedMatch.matchingScore}%</div>
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Score IA Explicable</div>
                </div>
              </div>

              {/* Both Sides Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                    <span>{selectedMatch.seekerFlag}</span> Demandeur / Acheteur
                  </span>
                  <h4 className="text-xs font-bold text-white">{selectedMatch.seekerName}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedMatch.seekerNeed}</p>
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                    <span>{selectedMatch.offererFlag}</span> Offreur / Fabricant
                  </span>
                  <h4 className="text-xs font-bold text-white">{selectedMatch.offererName}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{selectedMatch.offererProposition}</p>
                </div>
              </div>

              {/* Score Breakdown / Explanation */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Sparkles size={14} className="text-amber-400" />
                  Détail de la Décision & Justification des Critères
                </h4>

                <div className="space-y-2">
                  {selectedMatch.scoreBreakdown.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-start gap-3 text-xs"
                    >
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold text-white">{item.label} : </span>
                        <span className="text-slate-300">{item.explanation}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onOpenMokChatUser && onOpenMokChatUser(`match-${selectedMatch.id}`, selectedMatch.offererName)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <MessageSquare size={14} />
                  Ouvrir Discussion Mok Chat
                </button>

                <button
                  onClick={() => onOpenDealManager && onOpenDealManager(selectedMatch.id)}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all"
                >
                  Initier Dossier Commercial Tripartite
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SUB-TAB 2: MISSIONS SOURCING & SHORTLISTS COMPARATIVES
         ══════════════════════════════════════════════════════════════════════ */}
      {activeSubTab === 'missions' && (
        <div className="space-y-6">
          {/* Active Missions List */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Vos Dossiers de Sourcing
              </h3>
              {missionsList.map(mission => (
                <div
                  key={mission.id}
                  onClick={() => setSelectedMission(mission)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedMission?.id === mission.id
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{mission.targetSector}</span>
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                      {mission.shortlist.length} Fournisseurs
                    </span>
                  </div>
                  <h4 className="text-xs font-bold text-white mt-1">{mission.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Budget : {mission.budgetMax.toLocaleString()} {mission.currency} • {mission.quantityTarget} {mission.unit}
                  </p>
                </div>
              ))}
            </div>

            {/* Mission Shortlist Comparator Matrix */}
            {selectedMission && (
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">{selectedMission.targetSector}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">Réf : {selectedMission.id}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {selectedMission.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Cahier des charges : {selectedMission.targetProduct}
                  </p>
                </div>

                {/* Shortlist Table / Matrix */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Grille Comparative Fournisseurs ({selectedMission.shortlist.length})</span>
                    <span className="text-[11px] text-indigo-400">Sources vérifiées par Diallo OS</span>
                  </h4>

                  <div className="space-y-4">
                    {selectedMission.shortlist.map(item => (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4 shadow-sm"
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{item.countryFlag}</span>
                              <h5 className="font-bold text-white text-sm">{item.supplierName}</h5>
                              <span className="text-xs text-slate-400">({item.city}, {item.country})</span>
                            </div>
                            <p className="text-xs text-indigo-300 mt-0.5">{item.productTitle}</p>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              item.sourceType === 'plateforme_certifiee' ? 'bg-emerald-500/20 text-emerald-300' :
                              item.sourceType === 'partenaire_verifie' ? 'bg-blue-500/20 text-blue-300' :
                              'bg-amber-500/20 text-amber-300'
                            }`}>
                              {item.sourceType === 'plateforme_certifiee' ? 'Plateforme Certifiée' :
                               item.sourceType === 'partenaire_verifie' ? 'Partenaire Vérifié' : 'Source Externe Web'}
                            </span>
                          </div>
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-900/60 p-3 rounded-xl">
                          <div>
                            <span className="text-slate-400">Prix Estimé :</span>
                            <p className="font-bold text-white">{item.availablePriceEstimate.toLocaleString()} {item.currency}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Délai Fab. :</span>
                            <p className="font-bold text-white">{item.leadTimeDays} jours</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Capacité :</span>
                            <p className="font-bold text-white truncate">{item.productionCapacity}</p>
                          </div>
                          <div>
                            <span className="text-slate-400">Certifications :</span>
                            <p className="font-bold text-emerald-400 truncate">{item.certifications.join(', ')}</p>
                          </div>
                        </div>

                        {/* Risks & Unknowns */}
                        {item.risksAndUnknowns && item.risksAndUnknowns.length > 0 && (
                          <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300 space-y-1">
                            <span className="font-bold flex items-center gap-1.5">
                              <AlertTriangle size={13} />
                              Points d'attention & Inconnues identifiés :
                            </span>
                            {item.risksAndUnknowns.map((r, i) => (
                              <p key={i} className="text-slate-300 pl-4">• {r}</p>
                            ))}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
                          <button
                            onClick={() => handleOpenContactModal(item)}
                            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                          >
                            <MessageSquare size={13} />
                            Préparer Contact Diplomatique IA
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CRÉATION D'UNE MISSION DE SOURCING
         ══════════════════════════════════════════════════════════════════════ */}
      {isCreatingMission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-2xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Créer une Mission de Sourcing International</h3>
                <p className="text-xs text-slate-400">Diallo OS recherchera les fabricants conformes à votre cahier des charges.</p>
              </div>
              <button onClick={() => setIsCreatingMission(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-300">Intitulé de la mission</label>
                <input
                  type="text"
                  value={newMissionForm.title}
                  onChange={(e) => setNewMissionForm({ ...newMissionForm, title: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300">Secteur d'activité</label>
                  <input
                    type="text"
                    value={newMissionForm.sector}
                    onChange={(e) => setNewMissionForm({ ...newMissionForm, sector: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">Produit ou Ligne recherchée</label>
                  <input
                    type="text"
                    value={newMissionForm.product}
                    onChange={(e) => setNewMissionForm({ ...newMissionForm, product: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="font-bold text-slate-300">Quantité Cible</label>
                  <input
                    type="number"
                    value={newMissionForm.quantity}
                    onChange={(e) => setNewMissionForm({ ...newMissionForm, quantity: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">Unité</label>
                  <input
                    type="text"
                    value={newMissionForm.unit}
                    onChange={(e) => setNewMissionForm({ ...newMissionForm, unit: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">Budget Max ({newMissionForm.currency})</label>
                  <input
                    type="number"
                    value={newMissionForm.budget}
                    onChange={(e) => setNewMissionForm({ ...newMissionForm, budget: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300">Pays acceptés</label>
                  <input
                    type="text"
                    value={newMissionForm.countries}
                    onChange={(e) => setNewMissionForm({ ...newMissionForm, countries: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">Port / Ville de destination</label>
                  <input
                    type="text"
                    value={newMissionForm.destinationPort}
                    onChange={(e) => setNewMissionForm({ ...newMissionForm, destinationPort: e.target.value })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsCreatingMission(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateMission}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
              >
                Valider & Déployer l'Agent Sourcing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: CONTACT DIPLOMATIQUE & COMMERCIAL IA
         ══════════════════════════════════════════════════════════════════════ */}
      {contactingSupplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-500/20 text-indigo-300 rounded-2xl">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Contacter {contactingSupplier.supplierName}</h3>
                  <p className="text-xs text-slate-400">Message diplomatique préparé par l'IA et soumis à votre validation</p>
                </div>
              </div>
              <button onClick={() => setContactingSupplier(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="space-y-2 text-xs">
              <label className="font-bold text-slate-300">Corps du message commercial :</label>
              <textarea
                rows={8}
                value={diplomaticMessage}
                onChange={(e) => setDiplomaticMessage(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 text-white outline-none focus:border-indigo-500 leading-relaxed font-sans"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setContactingSupplier(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleSendSupplierMessage}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black shadow-md flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                Valider et Envoyer l'Offre
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
