import React, { useState } from 'react';
import {
  Handshake,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  Building2,
  Globe,
  Sliders,
  DollarSign,
  Briefcase,
  Users,
  FileText,
  Video,
  Play,
  ArrowRight,
  ChevronRight,
  ShieldCheck,
  Bot,
  PlusCircle,
  Clock,
  Send,
  Filter
} from 'lucide-react';
import { 
  PartnershipItem, 
  PartnershipPipelineStage, 
  InvestorFundingProfile, 
  InvestorPitchDossier,
  DataRoomFile
} from '../types';
import { 
  MOCK_PARTNERSHIP_ITEMS, 
  MOCK_INVESTOR_PROFILES,
  MOCK_DATA_ROOM_FILES
} from '../constants';

interface TradePartnershipsHubProps {
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenMokChatUser?: (userId: string, userName: string) => void;
  onOpenLiveRoom?: (sessionTitle: string, participantName: string) => void;
}

const PIPELINE_STAGES: { id: PartnershipPipelineStage; label: string }[] = [
  { id: 'identifie', label: '1. Identifié' },
  { id: 'a_analyser', label: '2. À Analyser' },
  { id: 'pertinent', label: '3. Pertinent' },
  { id: 'contact_prepare', label: '4. Contact Prêt' },
  { id: 'contacte', label: '5. Contacté' },
  { id: 'reponse_recue', label: '6. Réponse Reçue' },
  { id: 'rendez_vous', label: '7. Rendez-vous' },
  { id: 'negociation', label: '8. Négociation' },
  { id: 'accord', label: '9. Accord / Protocole' },
  { id: 'actif', label: '10. Actif' },
  { id: 'suivi', label: '11. Suivi Périodique' }
];

export const TradePartnershipsHub: React.FC<TradePartnershipsHubProps> = ({
  onOpenExpertChat,
  onOpenMokChatUser,
  onOpenLiveRoom
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'investors' | 'pitch_dossier' | 'data_room' | 'advisory_board'>('pipeline');
  const [partnersList, setPartnersList] = useState<PartnershipItem[]>(MOCK_PARTNERSHIP_ITEMS);
  const [selectedPartner, setSelectedPartner] = useState<PartnershipItem | null>(MOCK_PARTNERSHIP_ITEMS[0] || null);

  // Data Room State
  const [dataRoomFiles, setDataRoomFiles] = useState<DataRoomFile[]>(MOCK_DATA_ROOM_FILES);
  const [userRoleInDataRoom, setUserRoleInDataRoom] = useState<'owner' | 'partner' | 'investor' | 'expert'>('owner');
  const [dataRoomToast, setDataRoomToast] = useState<string | null>(null);

  // Advisory Board State
  const [advisoryTopic, setAdvisoryTopic] = useState('Validation de l\'accord de distribution exclusive et pacte d\'actionnaires avec Sahel Santé');
  const [isConveningBoard, setIsConveningBoard] = useState(false);
  const [boardSummary, setBoardSummary] = useState<string | null>(null);

  // Investors List
  const [investorsList] = useState<InvestorFundingProfile[]>(MOCK_INVESTOR_PROFILES);

  // Investor Pitch Dossier State
  const [pitchDossier, setPitchDossier] = useState<InvestorPitchDossier>({
    id: 'pitch-dossier-01',
    projectTitle: 'Déploiement d\'un Hub Logistique & Conditionnement Froid à Conakry',
    promoterName: 'Amadou Diallo (Agro-Export Guinée)',
    sector: 'Agroalimentaire & Logistique Froid',
    executiveSummary: 'Création du premier centre autonome d\'ensachage hermétique et stockage frigorifique solaire sous douane au Port de Conakry, réduisant les pertes post-récolte de 35% et multipliant les exports vers l\'Europe.',
    fundingNeeded: 250000,
    currency: 'EUR',
    allocationBreakdown: [
      { label: 'Chambres froides solaires 100 kWp', amount: 120000, percentage: 48 },
      { label: 'Ligne de tri & emballage hermétique', amount: 65000, percentage: 26 },
      { label: 'Fonds de roulement & certifications', amount: 45000, percentage: 18 },
      { label: 'Déploiement digital Diallo OS & ERP', amount: 20000, percentage: 8 }
    ],
    projectedRevenue3Y: 840000,
    keyMilestones: [
      'Mois 1-3 : Obtention de la concession portuaire et permis d\'implanter',
      'Mois 4-6 : Réception des équipements solaires et montage',
      'Mois 7-12 : Certification ISO 22000 et démarrage des contrats exportateurs'
    ],
    status: 'ready'
  });

  const [isPitchingLive, setIsPitchingLive] = useState(false);
  const [pitchSuccessAlert, setPitchSuccessAlert] = useState<string | null>(null);

  // Advance Partner Stage
  const handleAdvanceStage = (partnerId: string) => {
    const updated = partnersList.map(p => {
      if (p.id === partnerId) {
        const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === p.stage);
        const nextStage = PIPELINE_STAGES[Math.min(PIPELINE_STAGES.length - 1, currentIndex + 1)].id;
        return { ...p, stage: nextStage, lastInteractionDate: 'Aujourd\'hui' };
      }
      return p;
    });
    setPartnersList(updated);
    if (selectedPartner?.id === partnerId) {
      const currentIndex = PIPELINE_STAGES.findIndex(s => s.id === selectedPartner.stage);
      const nextStage = PIPELINE_STAGES[Math.min(PIPELINE_STAGES.length - 1, currentIndex + 1)].id;
      setSelectedPartner({ ...selectedPartner, stage: nextStage });
    }
  };

  const handleStartLivePitch = () => {
    setIsPitchingLive(true);
    setPitchSuccessAlert('Session Pitch Investisseur en Direct lancée avec procès-verbal automatique généré par Diallo OS !');
    setTimeout(() => setPitchSuccessAlert(null), 6000);
    if (onOpenLiveRoom) {
      onOpenLiveRoom('Pitch Investisseurs - Hub Froid Conakry', 'Fonds Sahel Capital & Business Angels');
    }
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Handshake size={14} />
                Partenariats & Investisseurs
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Pipeline des Partenariats & Levées de Fonds
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Gestion de votre pipeline partenariats en 11 étapes, mise en relation avec investisseurs et pitchs de projets en direct.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je souhaite structurer un accord de partenariat commercial international.')}
              className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center gap-1.5 transition-all"
            >
              <Bot size={15} />
              Expert Chef de Projet
            </button>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'pipeline'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Handshake size={15} />
            Pipeline Partenariats 11 Étapes ({partnersList.length})
          </button>

          <button
            onClick={() => setActiveTab('investors')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'investors'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <DollarSign size={15} className="text-emerald-400" />
            Espace Investisseurs & Fonds ({investorsList.length})
          </button>

          <button
            onClick={() => setActiveTab('pitch_dossier')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'pitch_dossier'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Sparkles size={15} className="text-amber-400" />
            Dossier Investisseur & Pitch
          </button>

          <button
            onClick={() => setActiveTab('data_room')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'data_room'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <ShieldCheck size={15} className="text-cyan-400" />
            Data Room Sécurisée ({dataRoomFiles.length})
          </button>

          <button
            onClick={() => setActiveTab('advisory_board')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'advisory_board'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Users size={15} className="text-purple-400" />
            Réunir le Conseil Diallo OS
          </button>
        </div>
      </div>

      {pitchSuccessAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{pitchSuccessAlert}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: PIPELINE DES PARTENARIATS EN 11 ÉTAPES
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pipeline' && (
        <div className="space-y-6">
          {/* Visual Stages Progress Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 overflow-x-auto">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Progression du Cycle Partenariat (11 Jalons Structurés)
            </span>
            <div className="flex items-center gap-2 min-w-max">
              {PIPELINE_STAGES.map((stg, idx) => (
                <div key={stg.id} className="flex items-center gap-1.5">
                  <span className={`px-2.5 py-1 rounded-xl text-[10px] font-bold ${
                    selectedPartner?.stage === stg.id
                      ? 'bg-indigo-600 text-white shadow'
                      : 'bg-slate-950 text-slate-400 border border-slate-800'
                  }`}>
                    {stg.label}
                  </span>
                  {idx < PIPELINE_STAGES.length - 1 && (
                    <ChevronRight size={12} className="text-slate-600" />
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Partners List */}
            <div className="lg:col-span-1 space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Partenariats en Cours
              </h3>

              {partnersList.map(item => (
                <div
                  key={item.id}
                  onClick={() => setSelectedPartner(item)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedPartner?.id === item.id
                      ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1">
                      <span>{item.partnerFlag}</span>
                      <span>{item.partnerName}</span>
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {item.confidenceScore}% Confiance
                    </span>
                  </div>
                  <p className="text-[11px] text-indigo-300 mt-1 capitalize font-medium">
                    Type : {item.partnerType} • {item.partnerCountry}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {item.objective}
                  </p>
                </div>
              ))}
            </div>

            {/* Selected Partner Detailed File */}
            {selectedPartner && (
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-indigo-400 capitalize">Partenariat {selectedPartner.partnerType}</span>
                      <span className="text-slate-600">•</span>
                      <span className="text-xs text-slate-400">{selectedPartner.partnerCountry}</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                      {selectedPartner.partnerName}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Contact : {selectedPartner.contactPerson} ({selectedPartner.contactEmail})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black uppercase">
                      Étape : {PIPELINE_STAGES.find(s => s.id === selectedPartner.stage)?.label}
                    </span>
                  </div>
                </div>

                {/* Objectives & Contributions */}
                <div className="space-y-4 text-xs">
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <span className="font-bold text-indigo-400 uppercase tracking-wider text-[10px]">
                      Objectif Stratégique du Partenariat :
                    </span>
                    <p className="text-slate-200 leading-relaxed">{selectedPartner.objective}</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="font-bold text-amber-400 uppercase tracking-wider text-[10px]">
                        Ressources & Apports Attendus :
                      </span>
                      <p className="text-slate-300">{selectedPartner.resourcesSought}</p>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                      <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">
                        Notre Contribution Proposée :
                      </span>
                      <p className="text-slate-300">{selectedPartner.contributionOffered}</p>
                    </div>
                  </div>
                </div>

                {/* Next Action Box */}
                <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Clock size={14} />
                      Prochaine Échéance : {selectedPartner.nextActionDate}
                    </span>
                    <span className="text-[11px] text-slate-400">Dernier échange : {selectedPartner.lastInteractionDate}</span>
                  </div>
                  <p className="text-xs text-slate-200">{selectedPartner.nextActionNote}</p>
                </div>

                {/* Actions Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                  <button
                    onClick={() => onOpenMokChatUser && onOpenMokChatUser(`partner-${selectedPartner.id}`, selectedPartner.contactPerson)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <Send size={13} />
                    Contacter sur Mok Chat
                  </button>

                  <button
                    onClick={() => handleAdvanceStage(selectedPartner.id)}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all"
                  >
                    <span>Faire Avancer au Jalon Suivant</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: ESPACE INVESTISSEURS & FONDS
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'investors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {investorsList.map(inv => (
              <div
                key={inv.id}
                className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-emerald-500/40 flex flex-col justify-between space-y-4 shadow-lg transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{inv.flag}</span>
                      <span>{inv.entityName}</span>
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                      {inv.type}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
                    <span className="text-slate-400 text-[10px]">Ticket d'Investissement :</span>
                    <p className="font-black text-emerald-400 text-sm mt-0.5">{inv.ticketRange}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-400">Secteurs Cibles :</span>
                    <p className="text-slate-300">{inv.focusSectors.join(' • ')}</p>
                  </div>

                  <div className="space-y-1 text-xs">
                    <span className="font-bold text-slate-400">Critères & Éligibilité :</span>
                    <ul className="text-slate-400 space-y-1">
                      {inv.requirements.map((r, i) => (
                        <li key={i}>• {r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => {
                      setActiveTab('pitch_dossier');
                    }}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Sparkles size={14} />
                    Soumettre mon Dossier Pitch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: MON DOSSIER INVESTISSEUR & PITCH DECK
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pitch_dossier' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  Dossier Prêt & Certifié
                </span>
                <span className="text-xs text-slate-400">{pitchDossier.sector}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-1">
                {pitchDossier.projectTitle}
              </h3>
              <p className="text-xs text-slate-400">Porteur du projet : {pitchDossier.promoterName}</p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-slate-400">Besoin de Financement :</span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {pitchDossier.fundingNeeded.toLocaleString()} {pitchDossier.currency}
              </div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Résumé Exécutif pour Investisseurs
            </h4>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
              {pitchDossier.executiveSummary}
            </p>
          </div>

          {/* Budget Allocation Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Allocation des Fonds Levés
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {pitchDossier.allocationBreakdown.map((item, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <span className="text-[10px] font-bold text-indigo-400">{item.percentage}% des fonds</span>
                  <h5 className="text-xs font-bold text-white">{item.label}</h5>
                  <p className="text-xs font-black text-emerald-400">{item.amount.toLocaleString()} {pitchDossier.currency}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Feuille de Route & Jalons Opérationnels
            </h4>
            <div className="space-y-1.5">
              {pitchDossier.keyMilestones.map((m, i) => (
                <div key={i} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 flex items-center gap-2">
                  <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je prépare mon argumentaire de pitch pour les investisseurs.')}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Bot size={15} />
              Simuler Session Questions/Réponses IA
            </button>

            <button
              onClick={handleStartLivePitch}
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs sm:text-sm font-black shadow-lg flex items-center gap-2 transition-all"
            >
              <Video size={16} />
              Démarrer le Pitch Live avec Enregistrement PV
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 4: DATA ROOM SÉCURISÉE MULTI-NIVEAUX
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'data_room' && (
        <div className="space-y-6">
          {dataRoomToast && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{dataRoomToast}</span>
              </div>
              <button onClick={() => setDataRoomToast(null)} className="text-slate-400 hover:text-white">✕</button>
            </div>
          )}

          {/* Role selector banner */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-cyan-400" />
                <h3 className="font-bold text-white text-base">Espace Coffre-Fort Sécurisé & Data Room</h3>
              </div>
              <p className="text-xs text-slate-400">
                Documents confidentiels certifiés avec horodatage, filigrane dynamique et contrôle granulaire des droits d'accès.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Mode de vue :</span>
              <select
                value={userRoleInDataRoom}
                onChange={(e) => setUserRoleInDataRoom(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
              >
                <option value="owner">Propriétaire (Tous droits)</option>
                <option value="partner">Partenaire Stratégique</option>
                <option value="investor">Investisseur / Fonds (Sous NDA)</option>
                <option value="expert">Expert & Juriste Diallo OS</option>
              </select>
            </div>
          </div>

          {/* Data Room Files Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Fichiers Protégés ({dataRoomFiles.length})
              </h4>
              <button
                onClick={() => {
                  const newFile: DataRoomFile = {
                    id: `file-${Date.now()}`,
                    title: 'Attestation Bancaire de Solvabilité & Garantie',
                    category: 'finance',
                    fileName: 'Attestation_Bancaire_Solvabilite.pdf',
                    fileType: 'PDF',
                    fileSize: '1.4 MB',
                    isConfidential: true,
                    confidentialityLevel: 'nda_required',
                    uploadDate: 'Aujourd\'hui',
                    uploadedAt: 'Aujourd\'hui',
                    accessLogs: [],
                    allowedRoles: ['owner', 'investor', 'expert'],
                    downloadCount: 0
                  };
                  setDataRoomFiles([newFile, ...dataRoomFiles]);
                  setDataRoomToast('Nouveau document crypté déposé dans la Data Room !');
                }}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle size={14} />
                Déposer un Document
              </button>
            </div>

            <div className="space-y-2">
              {dataRoomFiles.map(file => {
                const hasAccess = file.allowedRoles.includes(userRoleInDataRoom);
                return (
                  <div
                    key={file.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      hasAccess ? 'bg-slate-950 border-slate-800 hover:border-slate-700' : 'bg-slate-950/40 border-slate-800/40 opacity-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 text-cyan-400 shrink-0 mt-0.5">
                        <FileText size={18} />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-xs">{file.title}</span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900 text-slate-400 text-[10px] uppercase font-bold">
                            {file.fileType} • {file.fileSize}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                          <span className="capitalize text-indigo-400 font-semibold">{file.category}</span>
                          <span>•</span>
                          <span>Déposé le {file.uploadedAt}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        file.confidentialityLevel === 'public' ? 'bg-slate-800 text-slate-300' :
                        file.confidentialityLevel === 'partner_only' ? 'bg-indigo-500/20 text-indigo-300' :
                        file.confidentialityLevel === 'nda_required' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}>
                        {file.confidentialityLevel === 'nda_required' ? '🔒 NDA Exigé' :
                         file.confidentialityLevel === 'restricted' ? '⛔ Très Restreint' :
                         file.confidentialityLevel === 'partner_only' ? '🤝 Partenaires' : 'Public'}
                      </span>

                      {hasAccess ? (
                        <button
                          onClick={() => {
                            setDataRoomFiles(dataRoomFiles.map(f => f.id === file.id ? { ...f, downloadCount: f.downloadCount + 1 } : f));
                            setDataRoomToast(`Téléchargement sécurisé et tracé du fichier « ${file.title} » (Filigrane généré).`);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
                        >
                          Consulter ({file.downloadCount})
                        </button>
                      ) : (
                        <span className="text-xs text-rose-400 font-bold">Accès Non Autorisé</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 5: RÉUNIR LE CONSEIL (PROJET, FINANCE, JURIDIQUE, COMMERCE, ADMINISTRATIF)
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'advisory_board' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
                <Users size={14} />
                Conseil Stratégique Collégial Diallo OS
              </span>
              <h3 className="text-xl font-bold text-white">
                Réunir le Conseil des 5 Pôles Experts
              </h3>
              <p className="text-xs sm:text-sm text-slate-400">
                Soumettez un dossier de partenariat, une proposition d'investissement ou un contrat international. Les 5 experts (Chef de Projet, Finance, Juridique, Commerce, Administratif) délibèrent simultanément pour vous rendre une synthèse collégiale.
              </p>
            </div>

            {/* Input topic */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300">Dossier / Objet soumis au Conseil :</label>
              <textarea
                rows={3}
                value={advisoryTopic}
                onChange={(e) => setAdvisoryTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs sm:text-sm text-white outline-none focus:border-indigo-500 resize-none leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">5 Experts mobilisés : Projet • Finance • Droit • Commerce • Douanes</span>
              <button
                disabled={isConveningBoard}
                onClick={() => {
                  setIsConveningBoard(true);
                  setTimeout(() => {
                    setBoardSummary(`AVIS COLLÉGIAL DU CONSEIL DIALLO OS :
1. PÔLE JURIDIQUE : Clause d'exclusivité territoriale valide sous réserve d'inclure un minimum de commandes garanti (MOQ semestriel) de 40 000 EUR et clause d'arbitrage OHADA.
2. PÔLE FINANCE : Taux de rentabilité interne prévisionnel (TRI) estimé à 28.4% sur 3 ans. BFR initial sécurisé à hauteur de 45 000 EUR.
3. PÔLE COMMERCE : Opportunité de pénétration rapide du marché régional. Le partenaire possède déjà 42 points de distribution actifs.
4. PÔLE ADMINISTRATIF & DOUANE : Exonération partielle TEC CEDEAO confirmée avec le certificat d'origine communautaire.
5. PÔLE PROJET & SUIVI : Feuille de route validée en 3 phases. Recommandation : Signer le protocole d'accord et activer le jalon 9.`);
                    setIsConveningBoard(false);
                  }, 1000);
                }}
                className="px-6 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-600/30"
              >
                {isConveningBoard ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Délibération du Conseil en cours...
                  </>
                ) : (
                  <>
                    <Users size={16} />
                    Convoquer la Délibération du Conseil
                  </>
                )}
              </button>
            </div>

            {/* Board Summary Render */}
            {boardSummary && (
              <div className="p-6 rounded-2xl bg-slate-950 border border-purple-500/30 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <span className="text-xs font-black text-purple-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-400" />
                    Procès-Verbal de Délibération Collégiale
                  </span>
                  <span className="text-[10px] text-slate-400">Date : Séance du jour</span>
                </div>
                <pre className="text-xs text-slate-300 font-sans whitespace-pre-wrap leading-relaxed">
                  {boardSummary}
                </pre>
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                  <button
                    onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Pouvez-vous rédiger le protocole d\'accord final intégrant les recommandations du Conseil ?')}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
                  >
                    Rédiger le Protocole d'Accord
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
