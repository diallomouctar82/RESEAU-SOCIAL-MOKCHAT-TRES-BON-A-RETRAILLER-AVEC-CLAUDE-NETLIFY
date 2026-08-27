import React, { useState } from 'react';
import { 
  FolderKanban, 
  CheckCircle2, 
  Circle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Scale, 
  DollarSign, 
  Truck, 
  FileText, 
  Video, 
  Package, 
  Languages, 
  Sparkles, 
  Bot, 
  ChevronRight, 
  ChevronDown, 
  Lock, 
  Unlock, 
  FileSpreadsheet, 
  TrendingUp, 
  Layers, 
  RotateCcw, 
  ExternalLink, 
  Download, 
  Upload, 
  Building2, 
  Star, 
  Plane, 
  Globe, 
  RefreshCw, 
  UserCheck, 
  MessageSquare,
  ArrowRight,
  ShieldAlert,
  Sliders,
  Send,
  Plus
} from 'lucide-react';
import { 
  CommercialDossier, 
  StructuredOffer, 
  SampleRequest, 
  LiveInspectionSession, 
  SupplierScorecard, 
  ClientRelationshipCard,
  VirtualTradeFairBooth
} from '../types';
import { 
  MOCK_COMMERCIAL_DOSSIERS, 
  MOCK_SUPPLIER_SCORECARDS, 
  MOCK_CLIENT_RELATIONSHIPS 
} from '../constants';
import { TradeNegotiationAssistantModal } from './TradeNegotiationAssistantModal';
import { TradeLandedCostCalculator } from './TradeLandedCostCalculator';
import { TradeLiveInspectionModal } from './TradeLiveInspectionModal';
import { TradeSampleModal } from './TradeSampleModal';
import { TradeQuoteComparisonModal } from './TradeQuoteComparisonModal';
import { TradeDisputeMediationModal } from './TradeDisputeMediationModal';
import { TradeBusinessTripModal } from './TradeBusinessTripModal';
import { VirtualTradeFairModal } from './VirtualTradeFairModal';

interface CommercialDossierManagerProps {
  onOpenExpertChat?: (agentId?: string, prompt?: string) => void;
  onNavigateToSection?: (sectionId: string) => void;
}

export const CommercialDossierManager: React.FC<CommercialDossierManagerProps> = ({
  onOpenExpertChat,
  onNavigateToSection
}) => {
  // State for dossiers list
  const [dossiers, setDossiers] = useState<CommercialDossier[]>(MOCK_COMMERCIAL_DOSSIERS);
  const [selectedDossierId, setSelectedDossierId] = useState<string>(
    MOCK_COMMERCIAL_DOSSIERS[0]?.id || ''
  );

  // Active Tab within the selected Dossier
  const [activeTab, setActiveTab] = useState<
    | 'checklist'
    | 'negotiation'
    | 'landed_cost'
    | 'escrow_payment'
    | 'logistics_customs'
    | 'sample_inspection'
    | 'vault_contracts'
    | 'reception_dispute'
    | 'crm_scorecard'
  >('checklist');

  // Modals state
  const [isNegAssistantOpen, setIsNegAssistantOpen] = useState(false);
  const [isLiveInspectionOpen, setIsLiveInspectionOpen] = useState(false);
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isQuotesModalOpen, setIsQuotesModalOpen] = useState(false);
  const [isDisputeModalOpen, setIsDisputeModalOpen] = useState(false);
  const [isBusinessTripOpen, setIsBusinessTripOpen] = useState(false);
  const [isVirtualFairOpen, setIsVirtualFairOpen] = useState(false);

  // Current active dossier
  const dossier = dossiers.find((d) => d.id === selectedDossierId) || dossiers[0];

  if (!dossier) {
    return (
      <div className="p-12 text-center text-slate-400 bg-slate-900 rounded-3xl border border-white/10">
        <FolderKanban size={36} className="mx-auto text-slate-500 mb-3" />
        <p>Aucun dossier commercial en cours.</p>
      </div>
    );
  }

  // Update handlers
  const handleUpdateDossier = (updatedDossier: CommercialDossier) => {
    setDossiers(dossiers.map((d) => (d.id === updatedDossier.id ? updatedDossier : d)));
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const updatedChecklist = dossier.checklist.map((item) => {
      if (item.id === itemId) {
        return { ...item, isDone: !item.isDone };
      }
      return item;
    });

    const doneCount = updatedChecklist.filter((i) => i.isDone).length;
    const updatedDossier: CommercialDossier = {
      ...dossier,
      checklist: updatedChecklist,
      currentStepIndex: doneCount
    };
    handleUpdateDossier(updatedDossier);
  };

  const handleAddCounterOffer = (newOffer: Partial<StructuredOffer>) => {
    const fullOffer: StructuredOffer = {
      id: `off-v${(dossier.offersHistory.length || 0) + 1}`,
      versionNumber: (dossier.offersHistory.length || 0) + 1,
      emitter: newOffer.emitter || 'buyer',
      emitterName: newOffer.emitterName || dossier.buyerName,
      productId: dossier.productId,
      productTitle: dossier.productTitle,
      quantity: newOffer.quantity || dossier.quantity,
      unit: newOffer.unit || dossier.unit,
      unitPrice: newOffer.unitPrice || dossier.unitPrice,
      totalPrice: (newOffer.unitPrice || dossier.unitPrice) * (newOffer.quantity || dossier.quantity),
      currency: dossier.currency,
      availability: newOffer.availability || 'Sous 15 jours',
      leadTimeDays: newOffer.leadTimeDays || dossier.leadTimeDays,
      incoterm: newOffer.incoterm || dossier.agreedIncoterm,
      incotermLocation: newOffer.incotermLocation || dossier.destinationCity,
      transportMode: newOffer.transportMode || 'sea_fcl',
      validityDeadline: newOffer.validityDeadline || 'Dans 14 jours',
      specialConditions: newOffer.specialConditions || [],
      attachedDocuments: newOffer.attachedDocuments || [],
      notes: newOffer.notes || '',
      createdAt: 'Aujourd\'hui',
      status: 'pending'
    };

    const updatedDossier: CommercialDossier = {
      ...dossier,
      offersHistory: [...dossier.offersHistory, fullOffer],
      unitPrice: fullOffer.unitPrice,
      totalAmount: fullOffer.totalPrice,
      status: 'negociation',
      statusLabel: 'Contre-Offre transmise au vendeur'
    };

    handleUpdateDossier(updatedDossier);
  };

  const handleSaveInspectionReport = (session: LiveInspectionSession) => {
    const updatedDossier: CommercialDossier = {
      ...dossier,
      liveInspection: session,
      checklist: dossier.checklist.map((item) =>
        item.category === 'verification' ? { ...item, isDone: true } : item
      )
    };
    handleUpdateDossier(updatedDossier);
  };

  const handleSaveSample = (sample: SampleRequest) => {
    const updatedDossier: CommercialDossier = {
      ...dossier,
      sampleRequest: sample
    };
    handleUpdateDossier(updatedDossier);
  };

  const handleSaveDispute = (dispute: NonNullable<CommercialDossier['disputeData']>) => {
    const updatedDossier: CommercialDossier = {
      ...dossier,
      disputeData: dispute,
      status: 'litige',
      statusLabel: 'Médiation Commerciale en Cours'
    };
    handleUpdateDossier(updatedDossier);
  };

  const handleSignContract = () => {
    const updatedDossier: CommercialDossier = {
      ...dossier,
      isSignedByBuyer: true,
      buyerSignatureData: {
        signerName: dossier.buyerName,
        timestamp: 'À l\'instant (26/02/2026 11:20 GMT)',
        integrityHash: 'SHA256:d8a9271cbe5012f9011a45bb3820fa91823abce12837f619001928374a89bc21'
      },
      status: 'commande',
      statusLabel: 'Contrat signé par les deux parties'
    };
    handleUpdateDossier(updatedDossier);
  };

  // Stepper calculations
  const totalSteps = dossier.checklist.length || 13;
  const completedSteps = dossier.checklist.filter((i) => i.isDone).length;
  const progressPercentage = Math.round((completedSteps / totalSteps) * 100);

  return (
    <div className="space-y-6">
      
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. TOP HEADER: DOSSIER CODE REF & WORKSPACE SWITCHER */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="p-3 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-2xl shrink-0">
              <FolderKanban size={26} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg bg-slate-950 border border-white/10 text-brand-400 font-mono text-xs font-extrabold tracking-wider">
                  {dossier.codeRef}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                  {dossier.dimension} • {dossier.tradeType === 'import' ? 'Importation' : 'Exportation'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                  {dossier.statusLabel}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {dossier.title}
              </h2>
            </div>
          </div>

          {/* Quick Ecosystem Shortcuts */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => setIsVirtualFairOpen(true)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Globe size={14} className="text-brand-400" />
              <span>Salon Mondial Virtuel</span>
            </button>

            <button
              onClick={() => setIsBusinessTripOpen(true)}
              className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <Plane size={14} className="text-amber-400" />
              <span>Voyage Commercial</span>
            </button>

            {/* Dossier Selector Dropdown if multiple */}
            {dossiers.length > 1 && (
              <select
                value={selectedDossierId}
                onChange={(e) => setSelectedDossierId(e.target.value)}
                className="bg-slate-950 border border-white/10 text-xs font-bold text-white rounded-xl px-3 py-2 outline-none focus:border-brand-500"
              >
                {dossiers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.codeRef} - {d.buyerCountry} ⇄ {d.sellerCountry}
                  </option>
                ))}
              </select>
            )}
          </div>

        </div>

        {/* Parties Card (Acheteur ⇄ Vendeur) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2 text-xs">
          
          <div className="p-3 bg-slate-950/70 rounded-2xl border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Acheteur (Importateur)</span>
            <div className="font-bold text-white flex items-center gap-1.5 truncate">
              <span>{dossier.buyerFlag}</span>
              <span className="truncate">{dossier.buyerName}</span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Profil & RCCM Vérifiés</span>
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-2xl border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Vendeur (Fournisseur)</span>
            <div className="font-bold text-white flex items-center gap-1.5 truncate">
              <span>{dossier.sellerFlag}</span>
              <span className="truncate">{dossier.sellerName}</span>
            </div>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} />
              <span>Licence Export & Usine B2B</span>
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-2xl border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Trajet & Logistique</span>
            <div className="font-bold text-white truncate">
              {dossier.originCity} → {dossier.destinationCity}
            </div>
            <span className="text-[10px] text-amber-300 font-mono">
              Incoterm : {dossier.agreedIncoterm}
            </span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-2xl border border-white/5 space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Volume & Montant Négocié</span>
            <div className="font-bold text-emerald-400 font-mono text-sm">
              {dossier.totalAmount.toLocaleString()} {dossier.currency}
            </div>
            <span className="text-[10px] text-slate-400">
              {dossier.quantity.toLocaleString()} {dossier.unit} @ {dossier.unitPrice} {dossier.currency}
            </span>
          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* LINEAR STATUS STEPPER (DIALLO OS GUIDANCE ENGINE) */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="p-4 bg-slate-950/90 rounded-2xl border border-white/5 space-y-3">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-brand-400 shrink-0" />
              <span className="text-slate-300">
                <strong>Progression de la transaction :</strong> Étape <span className="text-brand-300 font-bold">{completedSteps}</span> sur <span className="font-bold">{totalSteps}</span> ({progressPercentage}% accompli)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-400">
                Prochaine étape : <strong className="text-amber-300">Paiement séquestre (Acompte 30%)</strong>
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-white/5">
            <div
              className="h-full bg-gradient-to-r from-brand-600 via-indigo-500 to-emerald-500 transition-all duration-500"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

        </div>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. TAB NAVIGATION (9 MODULAR TILES) */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
        
        <button
          onClick={() => setActiveTab('checklist')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'checklist'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 size={15} />
          <span>1. Checklist Intelligente</span>
        </button>

        <button
          onClick={() => setActiveTab('negotiation')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'negotiation'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Scale size={15} />
          <span>2. Négociation & Offres</span>
        </button>

        <button
          onClick={() => setActiveTab('landed_cost')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'landed_cost'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <FileSpreadsheet size={15} />
          <span>3. Coûts & Simulateur Marge</span>
        </button>

        <button
          onClick={() => setActiveTab('escrow_payment')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'escrow_payment'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign size={15} />
          <span>4. Paiement Sécurisé (Escrow)</span>
        </button>

        <button
          onClick={() => setActiveTab('logistics_customs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'logistics_customs'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Truck size={15} />
          <span>5. Logistique & Douane</span>
        </button>

        <button
          onClick={() => setActiveTab('sample_inspection')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'sample_inspection'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Video size={15} />
          <span>6. Échantillons & Live</span>
        </button>

        <button
          onClick={() => setActiveTab('vault_contracts')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'vault_contracts'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Lock size={15} />
          <span>7. Coffre-Fort & Contrat</span>
        </button>

        <button
          onClick={() => setActiveTab('reception_dispute')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'reception_dispute'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert size={15} />
          <span>8. Réception & Litiges</span>
        </button>

        <button
          onClick={() => setActiveTab('crm_scorecard')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
            activeTab === 'crm_scorecard'
              ? 'bg-brand-600 text-white shadow-lg'
              : 'bg-slate-900 border border-white/5 text-slate-400 hover:text-white'
          }`}
        >
          <Building2 size={15} />
          <span>9. CRM & Scorecard</span>
        </button>

      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 3. TAB BODIES */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: CHECKLIST INTELLIGENTE */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'checklist' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-400" />
                <span>Checklist Intelligente de la Transaction</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Chaque étape doit être validée de manière contradictoire avant de débloquer le jalon suivant.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsNegAssistantOpen(true)}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Bot size={14} />
                <span>Négocier avec Diallo</span>
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {dossier.checklist.map((item) => (
              <div
                key={item.id}
                onClick={() => handleToggleChecklistItem(item.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-start gap-4 ${
                  item.isDone
                    ? 'bg-emerald-950/30 border-emerald-500/30 text-white'
                    : item.isCurrent
                    ? 'bg-brand-950/40 border-brand-500 text-white shadow-md'
                    : 'bg-slate-950/60 border-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <div className="mt-0.5 shrink-0 text-emerald-400">
                  {item.isDone ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Circle size={20} className={item.isCurrent ? 'text-brand-400' : 'text-slate-500'} />
                  )}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-xs">
                      Étape {item.stepNumber} : {item.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-slate-400 uppercase">
                      Resp : {item.responsibleParty}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>

                  {item.criticalDocNeeded && (
                    <div className="mt-2 text-[11px] text-amber-300 flex items-center gap-1.5 font-medium">
                      <AlertTriangle size={13} className="shrink-0" />
                      <span>Document bloquant requis : {item.criticalDocNeeded}</span>
                    </div>
                  )}

                  {item.riskNote && (
                    <div className="mt-1 text-[11px] text-rose-300 flex items-center gap-1.5 font-medium">
                      <ShieldAlert size={13} className="shrink-0" />
                      <span>Alerte sécurité : {item.riskNote}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: NÉGOCIATION & OFFRES STRUCTURÉES */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'negotiation' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale size={18} className="text-brand-400" />
                <span>Historique Inaltérable des Offres & Contre-Offres</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Toutes les versions de devis sont horodatées et conservées pour éviter tout malentendu.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setIsQuotesModalOpen(true)}
                className="px-3.5 py-2 bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Layers size={14} className="text-indigo-400" />
                <span>Comparer les devis</span>
              </button>

              <button
                onClick={() => setIsNegAssistantOpen(true)}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Bot size={14} />
                <span>Négocier / Contre-offre</span>
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {dossier.offersHistory.map((offer) => (
              <div
                key={offer.id}
                className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-lg bg-brand-500/20 text-brand-300 font-mono text-xs font-bold">
                      Version {offer.versionNumber}
                    </span>
                    <span className="font-bold text-white text-xs">
                      Émetteur : {offer.emitterName}
                    </span>
                    <span className="text-[11px] text-slate-400">({offer.createdAt})</span>
                  </div>

                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    offer.status === 'accepted'
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : offer.status === 'countered'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-500/20 text-slate-400'
                  }`}>
                    {offer.status === 'accepted' ? '✓ Accord Validé' : offer.status === 'countered' ? 'Contre-Offre Suivante' : 'En attente'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Prix Unitaire</span>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {offer.unitPrice} {offer.currency} / {offer.unit}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Quantité / Total</span>
                    <span className="text-sm font-bold font-mono text-white">
                      {offer.quantity.toLocaleString()} {offer.unit} ({offer.totalPrice.toLocaleString()} {offer.currency})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Incoterm & Lieu</span>
                    <span className="text-sm font-bold text-amber-300">
                      {offer.incoterm} {offer.incotermLocation}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Délai Fabrication</span>
                    <span className="text-sm font-bold text-white">
                      {offer.leadTimeDays} jours
                    </span>
                  </div>
                </div>

                {offer.specialConditions.length > 0 && (
                  <div className="p-3 bg-slate-900 rounded-xl border border-white/5 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Conditions & Modalités</span>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {offer.specialConditions.map((cond, idx) => (
                        <li key={idx} className="flex items-start gap-1.5">
                          <span className="text-brand-400 font-bold">•</span>
                          <span>{cond}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 3: COÛTS DE REVIENT & SIMULATEUR DE MARGE */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'landed_cost' && (
        <TradeLandedCostCalculator
          dossier={dossier}
          onUpdateBreakdown={(breakdown, margin) => {
            const updatedDossier: CommercialDossier = {
              ...dossier,
              landedCostBreakdown: breakdown,
              marginSimulation: margin
            };
            handleUpdateDossier(updatedDossier);
          }}
        />
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 4: PAIEMENT PROTÉGÉ & SÉQUESTRE (ESCROW) */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'escrow_payment' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign size={18} className="text-emerald-400" />
                <span>Paiement Protégé par Séquestre Partenaire (Escrow)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Les fonds sont bloqués sur un compte neutre agréé et libérés étape par étape selon les preuves d'embarquement.
              </p>
            </div>

            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
              <ShieldCheck size={16} />
              <span>Partenaire Agréé : {dossier.escrowPartnerName}</span>
            </span>
          </div>

          {/* Milestones List */}
          <div className="space-y-4">
            {dossier.paymentMilestones.map((ms, idx) => (
              <div
                key={ms.id}
                className="p-5 bg-slate-950 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">
                      Jalon {idx + 1} : {ms.label}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-white/10 text-slate-300 text-[10px] font-mono font-bold">
                      {ms.percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    Condition de déblocage : <strong>{ms.triggerCondition === 'order_signing' ? 'Signature du contrat' : ms.triggerCondition === 'bl_copy_issued' ? 'Remise du connaissement maritime (B/L)' : 'Réception conforme'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-lg font-bold text-emerald-400 font-mono block">
                      {ms.amount.toLocaleString()} {ms.currency}
                    </span>
                    <span className="text-[10px] text-slate-400 uppercase font-bold">
                      {ms.status === 'escrow_held' ? 'Séquestré sur compte tiers' : ms.status === 'released_to_seller' ? 'Libéré au vendeur' : 'En attente de versement'}
                    </span>
                  </div>

                  <button
                    onClick={() => {
                      const updatedMilestones = dossier.paymentMilestones.map((m) =>
                        m.id === ms.id ? { ...m, status: 'escrow_held' as const, paidAt: 'Aujourd\'hui' } : m
                      );
                      handleUpdateDossier({ ...dossier, paymentMilestones: updatedMilestones });
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors"
                  >
                    Séquestrer l'acompte
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-slate-950/80 rounded-2xl border border-white/5 text-xs text-slate-400 leading-relaxed">
            <strong className="text-white block mb-1">Architecture Financière Sécurisée :</strong>
            LE MONDE À VOUS ne détient aucun fonds en interne. Tous les séquestres et transferts internationaux sont opérés par des établissements bancaires et prestataires de paiement internationaux agréés (SWIFT / BCEAO / CEDEAO).
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 5: LOGISTIQUE, DOUANE & SUIVI */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'logistics_customs' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck size={18} className="text-brand-400" />
                <span>Suivi Logistique & Formalités Douanières</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Suivi maritime/aérien en temps réel et accompagnement par le transitaire agréé.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-slate-950 border border-white/10 rounded-xl text-xs text-slate-300 font-mono font-bold">
                Tracking : {dossier.trackingNumber}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-4">
            <span className="text-xs font-bold text-white uppercase tracking-wider block">
              Journal des Événements d'Acheminement
            </span>

            <div className="space-y-3">
              {dossier.trackingEvents.map((ev) => (
                <div key={ev.id} className="flex items-start gap-3 p-3 bg-slate-900 rounded-xl border border-white/5">
                  <div className="p-2 bg-brand-500/20 text-brand-400 rounded-lg shrink-0 mt-0.5">
                    <Truck size={14} />
                  </div>
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{ev.statusText} • {ev.locationName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{ev.timestamp}</span>
                    </div>
                    <p className="text-slate-300 mt-0.5">{ev.detail}</p>
                    <span className="text-[10px] text-slate-400 font-mono block mt-1">
                      Transporteur : {ev.carrierName} ({ev.carrierTrackingCode})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Forwarder Contact Card */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/40 to-slate-950 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl">
                <Building2 size={20} />
              </div>
              <div>
                <h4 className="font-bold text-white text-xs">Transitaire en Charge : {dossier.logisticsProviderName}</h4>
                <p className="text-[11px] text-slate-300">
                  Dédouanement au Port de Conakry • Gestion BIVAC & Déclaration en Douane Unique (DDU)
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenExpertChat && onOpenExpertChat('10', `Assistance dédouanement pour dossier ${dossier.codeRef}`)}
              className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-xs rounded-xl transition-colors"
            >
              Échanger avec le Transitaire
            </button>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 6: ÉCHANTILLONS & INSPECTION LIVE */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'sample_inspection' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Video size={18} className="text-rose-400" />
                <span>Échantillonnage (BAT) & Inspection Vidéo en Direct</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Validez la qualité du produit à distance avant expédition maritime.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsSampleModalOpen(true)}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Package size={14} />
                <span>Gérer l'Échantillon (BAT)</span>
              </button>

              <button
                onClick={() => setIsLiveInspectionOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <Video size={14} />
                <span>Lancer le Live Usine</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Sample Card */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-3">
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                Échantillon Physique Expédié
              </span>
              {dossier.sampleRequest ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Quantité :</span>
                    <span className="text-white font-bold">{dossier.sampleRequest.quantityRequested} {dossier.sampleRequest.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Suivi Express DHL :</span>
                    <span className="text-amber-300 font-mono">{dossier.sampleRequest.trackingNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Verdict Acheteur :</span>
                    <span className="text-emerald-400 font-bold">✓ Conforme & Validé</span>
                  </div>
                  <p className="text-[11px] text-slate-300 pt-2 border-t border-white/5 italic">
                    « {dossier.sampleRequest.buyerEvaluation?.comments} »
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Aucun échantillon physique demandé pour le moment.</p>
              )}
            </div>

            {/* Live Inspection Card */}
            <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-3">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
                Dernière Inspection Usine en Direct
              </span>
              {dossier.liveInspection ? (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Date de session :</span>
                    <span className="text-white font-bold">{dossier.liveInspection.scheduledAt}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Points validés :</span>
                    <span className="text-emerald-400 font-bold">
                      {dossier.liveInspection.inspectionItems.filter((i) => i.checked).length} / {dossier.liveInspection.inspectionItems.length}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 text-[11px] text-slate-300">
                    {dossier.liveInspection.aiGeneratedRecap}
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Aucune session d'inspection vidéo enregistrée.</p>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 7: COFFRE-FORT NUMÉRIQUE & CONTRAT */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'vault_contracts' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock size={18} className="text-brand-400" />
                <span>Coffre-Fort Numérique & Signature Électronique</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Documents certifiés avec empreinte d'intégrité SHA-256 et contrat commercial tripartite.
              </p>
            </div>

            <button
              onClick={handleSignContract}
              disabled={dossier.isSignedByBuyer}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                dossier.isSignedByBuyer
                  ? 'bg-emerald-500/20 text-emerald-300 cursor-default'
                  : 'bg-brand-600 hover:bg-brand-500 text-white shadow-lg'
              }`}
            >
              <ShieldCheck size={16} />
              <span>{dossier.isSignedByBuyer ? '✓ Contrat Signé par Vous' : 'Signer le Contrat Commercial'}</span>
            </button>
          </div>

          {/* Documents Grid */}
          <div className="space-y-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
              Pièces Justificatives & Certificats Vérifiés
            </span>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {dossier.vaultDocuments.map((doc) => (
                <div key={doc.id} className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <FileText size={18} className="text-brand-400" />
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      ✓ Vérifié
                    </span>
                  </div>
                  <h5 className="font-bold text-white text-xs truncate">{doc.title}</h5>
                  <p className="text-[10px] text-slate-400 font-mono truncate">{doc.fileName} ({doc.fileSize})</p>
                  {doc.verificationDetails && (
                    <p className="text-[10px] text-slate-400 border-t border-white/5 pt-1 italic">
                      {doc.verificationDetails}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contract Text */}
          {dossier.contractText && (
            <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider block">
                Texte du Contrat de Vente Commerciale Internationale
              </span>
              <pre className="p-4 bg-slate-900 rounded-xl text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                {dossier.contractText}
              </pre>
            </div>
          )}

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 8: RÉCEPTION, LITIGES & RÉACHAT */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'reception_dispute' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert size={18} className="text-amber-400" />
                <span>Réception, Gestion des Anomalies & Réapprovisionnement</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Confirmez la conformité à l'arrivée ou déclenchez la médiation structurée.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsDisputeModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <AlertTriangle size={14} />
                <span>Signaler un problème (Litige)</span>
              </button>

              <button
                onClick={() => {
                  const updated: CommercialDossier = {
                    ...dossier,
                    status: 'transaction_terminee',
                    statusLabel: 'Réception Conforme & Clôturée'
                  };
                  handleUpdateDossier(updated);
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 size={14} />
                <span>Confirmer Réception Conforme</span>
              </button>
            </div>
          </div>

          {/* Dispute details if any */}
          {dossier.disputeData ? (
            <div className="p-5 bg-rose-950/40 border border-rose-500/30 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-rose-300 text-sm flex items-center gap-1.5">
                  <Scale size={16} />
                  <span>Dossier de Médiation Ouvert (#{dossier.disputeData.id})</span>
                </span>
                <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold text-[10px] uppercase">
                  {dossier.disputeData.status}
                </span>
              </div>
              <p className="text-slate-200">
                Montant réclamé : <strong className="text-rose-400">{dossier.disputeData.claimAmount} {dossier.currency}</strong>
              </p>
              <div className="space-y-1">
                {dossier.disputeData.mediationNotes.map((note, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded-lg text-slate-300">
                    • {note}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-white/5 text-xs text-slate-400">
              Aucun litige ou réclamation ouverte sur ce dossier.
            </div>
          )}

          {/* 1-Click Reorder Box */}
          <div className="p-5 bg-gradient-to-r from-brand-950/60 to-indigo-950/60 rounded-2xl border border-brand-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h4 className="font-bold text-white text-sm">Commander à nouveau (Réachat en 1 Clic)</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Générez un nouveau bon de commande basé sur les mêmes tarifs et conditions validées.
              </p>
            </div>
            <button
              onClick={() => {
                alert(`Nouveau dossier commercial généré avec succès pour réapprovisionnement de 10 000 boîtes.`);
              }}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw size={14} />
              <span>Commander à nouveau</span>
            </button>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────── */}
      {/* TAB 9: CRM & SCORECARDS */}
      {/* ─────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'crm_scorecard' && (
        <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 space-y-6">
          
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 size={18} className="text-brand-400" />
                <span>CRM Fournisseurs & Relations Clients B2B</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Historique des volumes d'affaires, régularité des prix et alertes de réapprovisionnement proactif.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Supplier Scorecard */}
            {MOCK_SUPPLIER_SCORECARDS[0] && (
              <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MOCK_SUPPLIER_SCORECARDS[0].flag}</span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{MOCK_SUPPLIER_SCORECARDS[0].supplierName}</h4>
                      <span className="text-[10px] text-slate-400">Partenaire depuis {MOCK_SUPPLIER_SCORECARDS[0].relationshipStartDate}</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs font-mono">
                    Score : {MOCK_SUPPLIER_SCORECARDS[0].priceStabilityScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Commandes</span>
                    <span className="font-bold text-white">{MOCK_SUPPLIER_SCORECARDS[0].totalOrdersCount}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Volume</span>
                    <span className="font-bold text-emerald-400">{MOCK_SUPPLIER_SCORECARDS[0].totalVolumeAmount.toLocaleString()} €</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Conformité</span>
                    <span className="font-bold text-indigo-300">{MOCK_SUPPLIER_SCORECARDS[0].conformityRatePercentage}%</span>
                  </div>
                </div>

                {MOCK_SUPPLIER_SCORECARDS[0].proactiveRestockAlert && (
                  <div className="p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-amber-300 font-bold">
                      <Sparkles size={13} />
                      <span>Alerte Réapprovisionnement Diallo OS</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      {MOCK_SUPPLIER_SCORECARDS[0].proactiveRestockAlert.reason}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Client Relationship Card */}
            {MOCK_CLIENT_RELATIONSHIPS[0] && (
              <div className="p-5 bg-slate-950 rounded-2xl border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{MOCK_CLIENT_RELATIONSHIPS[0].flag}</span>
                    <div>
                      <h4 className="font-bold text-white text-xs">{MOCK_CLIENT_RELATIONSHIPS[0].clientName}</h4>
                      <span className="text-[10px] text-slate-400">Fréquence d'achat : tous les {MOCK_CLIENT_RELATIONSHIPS[0].buyingFrequencyMonths} mois</span>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-brand-500/20 text-brand-300 font-bold text-xs">
                    Client Fidèle
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Total Achats</span>
                    <span className="font-bold text-emerald-400">{MOCK_CLIENT_RELATIONSHIPS[0].totalPurchasesAmount.toLocaleString()} €</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl">
                    <span className="text-[10px] text-slate-400 block">Dernière Commande</span>
                    <span className="font-bold text-white">{MOCK_CLIENT_RELATIONSHIPS[0].lastOrderDate}</span>
                  </div>
                </div>

                {MOCK_CLIENT_RELATIONSHIPS[0].proactiveSalesReminder && (
                  <div className="p-3 bg-indigo-950/30 border border-indigo-500/20 rounded-xl text-xs space-y-1">
                    <div className="flex items-center gap-1.5 text-indigo-300 font-bold">
                      <Send size={13} />
                      <span>Rappel Commercial Proactif</span>
                    </div>
                    <p className="text-[11px] text-slate-300 italic">
                      « {MOCK_CLIENT_RELATIONSHIPS[0].proactiveSalesReminder.suggestedPitch} »
                    </p>
                  </div>
                )}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 4. MODALS INTEGRATION */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      
      {/* AI Tactical Negotiation Modal */}
      <TradeNegotiationAssistantModal
        dossier={dossier}
        isOpen={isNegAssistantOpen}
        onClose={() => setIsNegAssistantOpen(false)}
        onSubmitCounterOffer={handleAddCounterOffer}
        onOpenExpertChat={onOpenExpertChat}
      />

      {/* Live Factory Inspection Modal */}
      <TradeLiveInspectionModal
        dossier={dossier}
        isOpen={isLiveInspectionOpen}
        onClose={() => setIsLiveInspectionOpen(false)}
        onSaveInspectionReport={handleSaveInspectionReport}
      />

      {/* Physical Sample (BAT) Modal */}
      <TradeSampleModal
        dossier={dossier}
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSaveSampleRequest={handleSaveSample}
      />

      {/* Quote Comparison Matrix Modal */}
      <TradeQuoteComparisonModal
        dossier={dossier}
        isOpen={isQuotesModalOpen}
        onClose={() => setIsQuotesModalOpen(false)}
      />

      {/* Dispute & Mediation Modal */}
      <TradeDisputeMediationModal
        dossier={dossier}
        isOpen={isDisputeModalOpen}
        onClose={() => setIsDisputeModalOpen(false)}
        onSubmitDispute={handleSaveDispute}
        onOpenExpertChat={onOpenExpertChat}
      />

      {/* Business Trip Assistant Modal */}
      <TradeBusinessTripModal
        isOpen={isBusinessTripOpen}
        onClose={() => setIsBusinessTripOpen(false)}
      />

      {/* Virtual Trade Fair Modal */}
      <VirtualTradeFairModal
        isOpen={isVirtualFairOpen}
        onClose={() => setIsVirtualFairOpen(false)}
      />

    </div>
  );
};
