import React, { useState } from 'react';
import { 
  Scale, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  MessageSquare, 
  UserCheck, 
  DollarSign, 
  ArrowRight, 
  Bot, 
  Sparkles, 
  ChevronRight, 
  Plus, 
  X, 
  Eye, 
  Send, 
  Paperclip, 
  Gavel, 
  Layers, 
  ExternalLink,
  ShieldAlert,
  Info
} from 'lucide-react';
import { 
  TradeDisputeCase, 
  DisputeType, 
  DisputeStage, 
  DisputeTimelineEvent 
} from '../types';
import { MOCK_TRADE_DISPUTE_CASES } from '../constants';

interface TradeDisputeResolutionCenterProps {
  onOpenExpertChat?: (agentId?: string, initialPrompt?: string) => void;
  onOpenMokChatUser?: (userId: string, userName: string) => void;
}

export const TradeDisputeResolutionCenter: React.FC<TradeDisputeResolutionCenterProps> = ({
  onOpenExpertChat,
  onOpenMokChatUser
}) => {
  const [disputesList, setDisputesList] = useState<TradeDisputeCase[]>(MOCK_TRADE_DISPUTE_CASES);
  const [selectedDispute, setSelectedDispute] = useState<TradeDisputeCase | null>(MOCK_TRADE_DISPUTE_CASES[0] || null);

  // New dispute modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState('CMD-2026-1049');
  const [newProductTitle, setNewProductTitle] = useState('Conteneur 20ft Huile d\'Argan Vierge');
  const [newDisputeType, setNewDisputeType] = useState<DisputeType>('retard');
  const [newClaimantDemand, setNewClaimantDemand] = useState<TradeDisputeCase['claimantDemand']>('remboursement_partiel');
  const [newAmount, setNewAmount] = useState(8500);
  const [newDescription, setNewDescription] = useState('');

  // Toast / feedback message
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Direct offer response state
  const [settlementOffer, setSettlementOffer] = useState('');
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // Appeal modal state
  const [showAppealModal, setShowAppealModal] = useState(false);
  const [appealReason, setAppealReason] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCreateDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription.trim()) return;

    const newCase: TradeDisputeCase = {
      id: `disp-2026-${Date.now().toString().slice(-4)}`,
      orderNumber: newOrderNumber,
      transactionId: `tx-${Date.now()}`,
      productTitle: newProductTitle,
      productImageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
      amount: newAmount,
      currency: 'EUR',
      disputeType: newDisputeType,
      stage: 'resolution_directe',
      buyerName: 'Amadou Diallo',
      buyerEmail: 'amadou.diallo@trade.gn',
      sellerName: 'Atlas Bio-Export SARL',
      sellerEmail: 'commercial@atlas-bio.ma',
      openedAt: 'Aujourd\'hui',
      claimantDemand: newClaimantDemand,
      proposedSettlementAmount: newAmount * 0.3,
      description: newDescription,
      evidenceDocs: [
        {
          name: 'Bon de livraison avec réserves.pdf',
          type: 'inspection_report',
          url: '#',
          uploadedBy: 'Acheteur'
        }
      ],
      timeline: [
        {
          id: `t-${Date.now()}`,
          date: 'Aujourd\'hui',
          author: 'Amadou Diallo (Acheteur)',
          role: 'buyer',
          action: 'Ouverture du dossier de réclamation',
          details: newDescription
        }
      ],
      canAppeal: true
    };

    setDisputesList([newCase, ...disputesList]);
    setSelectedDispute(newCase);
    setIsCreateModalOpen(false);
    setNewDescription('');
    showToast(`Dossier de litige ${newCase.orderNumber} ouvert avec succès. Phase de résolution directe amorcée.`);
  };

  const handleAcceptSettlement = () => {
    if (!selectedDispute) return;
    const updated = {
      ...selectedDispute,
      stage: 'clos_accorde' as DisputeStage,
      timeline: [
        ...selectedDispute.timeline,
        {
          id: `t-${Date.now()}`,
          date: 'À l\'instant',
          author: 'Amadou Diallo',
          role: 'buyer' as const,
          action: 'Accord amiable accepté',
          details: `Accord validé : indemnisation de ${selectedDispute.proposedSettlementAmount || 2400} ${selectedDispute.currency} virée depuis le compte séquestre.`
        }
      ]
    };
    setSelectedDispute(updated);
    setDisputesList(disputesList.map(d => d.id === updated.id ? updated : d));
    showToast('Accord accepté ! Le compte de séquestre va procéder à la régularisation financière.');
  };

  const handleEscalateToHumanMediator = () => {
    if (!selectedDispute) return;
    const updated = {
      ...selectedDispute,
      stage: 'mediateur_humain' as DisputeStage,
      timeline: [
        ...selectedDispute.timeline,
        {
          id: `t-${Date.now()}`,
          date: 'À l\'instant',
          author: 'Mok Trust Resolution Team',
          role: 'human_mediator' as const,
          action: 'Dossier transmis au Médiateur Commercial Assermenté',
          details: 'Maître B. Traoré, médiateur certifié OHADA, a été assigné au dossier. Convocation des parties sous 48h.'
        }
      ]
    };
    setSelectedDispute(updated);
    setDisputesList(disputesList.map(d => d.id === updated.id ? updated : d));
    showToast('Médiateur assermenté assigné au dossier.');
  };

  const handleEscalateToPaymentProvider = () => {
    if (!selectedDispute) return;
    const updated = {
      ...selectedDispute,
      stage: 'escalade_paiement' as DisputeStage,
      timeline: [
        ...selectedDispute.timeline,
        {
          id: `t-${Date.now()}`,
          date: 'À l\'instant',
          author: 'Passerelle de Paiement & Séquestre',
          role: 'payment_provider' as const,
          action: 'Dossier de chargeback / réclamation formelle bancaire ouvert',
          details: 'Gel des fonds chez le processeur de paiement en attente des pièces justificatives de livraison.'
        }
      ]
    };
    setSelectedDispute(updated);
    setDisputesList(disputesList.map(d => d.id === updated.id ? updated : d));
    showToast('Réclamation formelle transmise au processeur de paiement sous protocole Escrow.');
  };

  const handleSendDirectProposal = () => {
    if (!selectedDispute || !settlementOffer.trim()) return;
    setIsSubmittingProposal(true);
    setTimeout(() => {
      const newEvent: DisputeTimelineEvent = {
        id: `t-${Date.now()}`,
        date: 'À l\'instant',
        author: 'Amadou Diallo (Acheteur)',
        role: 'buyer',
        action: 'Nouvelle proposition de règlement amiable',
        details: settlementOffer
      };
      const updated = {
        ...selectedDispute,
        timeline: [...selectedDispute.timeline, newEvent]
      };
      setSelectedDispute(updated);
      setDisputesList(disputesList.map(d => d.id === updated.id ? updated : d));
      setSettlementOffer('');
      setIsSubmittingProposal(false);
      showToast('Votre proposition a été transmise à la partie adverse.');
    }, 600);
  };

  const handleSendAppeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDispute || !appealReason.trim()) return;
    const newEvent: DisputeTimelineEvent = {
      id: `t-${Date.now()}`,
      date: 'À l\'instant',
      author: 'Comité de Recours Diallo OS',
      role: 'human_mediator',
      action: 'Recours Formel Déposé (Procédure de Réexamen)',
      details: appealReason
    };
    const updated = {
      ...selectedDispute,
      timeline: [...selectedDispute.timeline, newEvent]
    };
    setSelectedDispute(updated);
    setDisputesList(disputesList.map(d => d.id === updated.id ? updated : d));
    setShowAppealModal(false);
    setAppealReason('');
    showToast('Votre recours a été enregistré et transmis au Collège de Réexamen.');
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Toast */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center justify-between animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border border-emerald-500/30">
              <Scale size={14} className="text-emerald-400" />
              MOK TRUST RESOLUTION CENTER
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Centre de Résolution des Litiges & Médiation Commerciale
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 max-w-2xl">
              Processus gradué en 5 étapes : résolution directe amiable, assistance IA Diallo OS de conciliation, médiateur humain certifié, escalade financière bancaire et recours.
            </p>
          </div>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/30 shrink-0"
          >
            <Plus size={16} />
            Ouvrir une Réclamation
          </button>
        </div>
      </div>

      {/* Layout Grid: Disputes List on left, Dossier Details on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Disputes List */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Dossiers en cours ({disputesList.length})
          </h3>

          <div className="space-y-3">
            {disputesList.map(d => {
              const isSelected = selectedDispute?.id === d.id;
              return (
                <div
                  key={d.id}
                  onClick={() => setSelectedDispute(d)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected 
                      ? 'bg-indigo-950/40 border-indigo-500 shadow-md' 
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-white text-xs">{d.orderNumber}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      d.stage === 'clos_accorde' ? 'bg-emerald-500/20 text-emerald-300' :
                      d.stage === 'mediateur_humain' ? 'bg-purple-500/20 text-purple-300' :
                      d.stage === 'escalade_paiement' ? 'bg-rose-500/20 text-rose-300' :
                      'bg-amber-500/20 text-amber-300'
                    }`}>
                      {d.stage === 'resolution_directe' ? 'Direct' :
                       d.stage === 'mediation_diallo_os' ? 'Médiation IA' :
                       d.stage === 'mediateur_humain' ? 'Médiateur' :
                       d.stage === 'escalade_paiement' ? 'Escalade' : 'Clos'}
                    </span>
                  </div>

                  <h4 className="text-xs text-slate-200 font-semibold line-clamp-1">{d.productTitle}</h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                    <span>{d.sellerName}</span>
                    <span className="font-bold text-white">{d.amount} {d.currency}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Dispute Dossier */}
        <div className="lg:col-span-8 space-y-6">
          {selectedDispute ? (
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
              {/* Dossier Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-slate-500">DOSSIER {selectedDispute.id}</span>
                    <span className="text-xs text-slate-400">• Commande {selectedDispute.orderNumber}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedDispute.productTitle}</h3>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2">
                    <span>Acheteur : <strong className="text-white">{selectedDispute.buyerName}</strong></span>
                    <span>•</span>
                    <span>Vendeur : <strong className="text-white">{selectedDispute.sellerName}</strong></span>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xl font-black text-amber-400">
                    {selectedDispute.amount.toLocaleString()} {selectedDispute.currency}
                  </div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Montant Sous Séquestre</span>
                </div>
              </div>

              {/* Dispute Progression Timeline Bar */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                  <span>Étape Actuelle du Litige :</span>
                  <span className="text-indigo-400 uppercase">
                    {selectedDispute.stage === 'resolution_directe' ? '1. Résolution Directe' :
                     selectedDispute.stage === 'mediation_diallo_os' ? '2. Conciliation Diallo OS' :
                     selectedDispute.stage === 'mediateur_humain' ? '3. Médiateur Assermenté' :
                     selectedDispute.stage === 'escalade_paiement' ? '4. Escalade Bancaire / Séquestre' : '5. Litige Résolu'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {['resolution_directe', 'mediation_diallo_os', 'mediateur_humain', 'escalade_paiement'].map((stg, i) => {
                    const isPassed = ['resolution_directe', 'mediation_diallo_os', 'mediateur_humain', 'escalade_paiement'].indexOf(selectedDispute.stage) >= i || selectedDispute.stage === 'clos_accorde';
                    return (
                      <div
                        key={stg}
                        className={`h-2 rounded-full transition-all ${
                          isPassed ? 'bg-indigo-500 shadow-sm' : 'bg-slate-800'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Description & Motifs */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Exposé du Litige & Demande Initiale :</span>
                <p className="text-slate-300 leading-relaxed">{selectedDispute.description}</p>
                <div className="text-slate-400 pt-1">
                  Demande du réclamant : <strong className="text-white capitalize">{selectedDispute.claimantDemand.replace('_', ' ')}</strong>
                </div>
              </div>

              {/* Diallo OS Mediation Proposal Block (if available) */}
              {selectedDispute.dialloMediationSummary && (
                <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-4 animate-fade-in">
                  <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs">
                    <Bot size={18} className="text-indigo-400" />
                    <span>Synthèse Objective de Conciliation par Diallo OS</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    {selectedDispute.dialloMediationSummary.factsSummary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase">Points d'Accord Identifiés :</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {selectedDispute.dialloMediationSummary.agreedPoints.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 space-y-1">
                      <span className="text-[10px] text-amber-400 font-bold uppercase">Options de Compromis Équilibrées :</span>
                      <ul className="list-disc list-inside text-slate-300 space-y-0.5">
                        {selectedDispute.dialloMediationSummary.suggestedCompromises.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 italic">
                    ℹ️ {selectedDispute.dialloMediationSummary.disclaimer}
                  </p>
                </div>
              )}

              {/* Evidence Vault */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Pièces Justificatives Déposées ({selectedDispute.evidenceDocs.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedDispute.evidenceDocs.map((doc, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <FileText size={15} className="text-indigo-400 shrink-0" />
                        <span className="text-white truncate">{doc.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">Par {doc.uploadedBy}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chronological Timeline */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  Journal Chronologique des Échanges
                </span>

                <div className="space-y-3">
                  {selectedDispute.timeline.map((evt) => (
                    <div key={evt.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1 text-xs">
                      <div className="flex items-center justify-between text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{evt.author}</span>
                          <span className={`px-2 py-0.2 rounded text-[10px] uppercase font-extrabold ${
                            evt.role === 'buyer' ? 'bg-indigo-500/20 text-indigo-300' :
                            evt.role === 'seller' ? 'bg-cyan-500/20 text-cyan-300' :
                            evt.role === 'diallo_ai' ? 'bg-purple-500/20 text-purple-300' :
                            'bg-amber-500/20 text-amber-300'
                          }`}>
                            {evt.role}
                          </span>
                        </div>
                        <span className="text-[10px]">{evt.date}</span>
                      </div>
                      <div className="font-semibold text-slate-200">{evt.action}</div>
                      {evt.details && <p className="text-slate-400 leading-relaxed pt-0.5">{evt.details}</p>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Negotiation Action Box */}
              {selectedDispute.stage !== 'clos_accorde' && (
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <span className="text-xs font-bold text-slate-300 block">
                    Formuler une contre-proposition ou un accord direct :
                  </span>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="Ex: J'accepte l'envoi express des pièces sous 5 jours + 1 000 EUR d'indemnité."
                      value={settlementOffer}
                      onChange={(e) => setSettlementOffer(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white outline-none focus:border-indigo-500"
                    />
                    <button
                      disabled={isSubmittingProposal}
                      onClick={handleSendDirectProposal}
                      className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shrink-0"
                    >
                      <Send size={13} />
                      Transmettre l'Offre
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleAcceptSettlement}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all"
                      >
                        ✓ Valider l'Accord Amiable
                      </button>

                      <button
                        onClick={handleEscalateToHumanMediator}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all"
                      >
                        Nommer un Médiateur Humain
                      </button>

                      <button
                        onClick={handleEscalateToPaymentProvider}
                        className="px-4 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all"
                      >
                        Escalade Séquestre Bancaire
                      </button>
                    </div>

                    {selectedDispute.canAppeal && (
                      <button
                        onClick={() => setShowAppealModal(true)}
                        className="text-xs text-slate-400 hover:text-white underline"
                      >
                        Déposer un Recours / Appel
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-3xl">
              Sélectionnez un litige pour consulter le dossier complet.
            </div>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: OUVRIR UNE NOUVELLE RÉCLAMATION
         ══════════════════════════════════════════════════════════════════════ */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Ouvrir un Dossier de Réclamation Commerciale</h3>
              <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateDispute} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">N° Commande / Transaction :</label>
                  <input
                    type="text"
                    value={newOrderNumber}
                    onChange={(e) => setNewOrderNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Marchandise / Service :</label>
                  <input
                    type="text"
                    value={newProductTitle}
                    onChange={(e) => setNewProductTitle(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Nature du Litige :</label>
                  <select
                    value={newDisputeType}
                    onChange={(e) => setNewDisputeType(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="non_recu">Colis / Conteneur non reçu</option>
                    <option value="retard">Retard de livraison majeur</option>
                    <option value="produit_different">Produit non conforme à l'échantillon</option>
                    <option value="quantite">Manquant sur le tonnage / colisage</option>
                    <option value="dommage">Avarie / Marchandise endommagée</option>
                    <option value="paiement">Problème de déblocage de séquestre</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-400 font-bold">Demande Souhaitée :</label>
                  <select
                    value={newClaimantDemand}
                    onChange={(e) => setNewClaimantDemand(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                  >
                    <option value="remplacement">Remplacement des articles</option>
                    <option value="remboursement_partiel">Remboursement partiel négocié</option>
                    <option value="remboursement_total">Annulation & Remboursement total</option>
                    <option value="nouvelle_livraison">Nouvelle expédition prioritaire</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Explication Précise des Faits :</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Décrivez les dates de chargement, les constats contradictoires au dépotage et les échanges préalables..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  Ouvrir le Dossier de Litige
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: RECOURS / APPEL DE DÉCISION
         ══════════════════════════════════════════════════════════════════════ */}
      {showAppealModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-4 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Procédure de Recours & Réexamen</h3>
              <button onClick={() => setShowAppealModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSendAppeal} className="space-y-4 text-xs">
              <p className="text-slate-400 leading-relaxed">
                Si vous estimez qu'une décision ou modération a été prise sans prise en compte d'un élément déterminant, vous pouvez solliciter une seconde revue collégiale.
              </p>

              <div className="space-y-1">
                <label className="text-slate-400 font-bold">Motif du Recours & Nouvelles Pièces :</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Exposez les nouveaux éléments ou contestations précises..."
                  value={appealReason}
                  onChange={(e) => setAppealReason(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 resize-none leading-relaxed"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAppealModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold"
                >
                  Déposer le Recours
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
