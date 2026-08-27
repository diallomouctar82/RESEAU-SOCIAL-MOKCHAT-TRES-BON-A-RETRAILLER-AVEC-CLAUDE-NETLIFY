import React, { useState } from 'react';
import {
  FileText,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Building2,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  PlusCircle,
  Download,
  Upload,
  Eye,
  Sliders,
  Check,
  Layers,
  Award,
  Filter
} from 'lucide-react';
import { 
  SmartTender, 
  TenderSubmission 
} from '../types';
import { 
  MOCK_SMART_TENDERS 
} from '../constants';

interface TradeTendersHubProps {
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenDealManager?: (dealId?: string) => void;
}

export const TradeTendersHub: React.FC<TradeTendersHubProps> = ({
  onOpenExpertChat,
  onOpenDealManager
}) => {
  const [activeTab, setActiveTab] = useState<'consult' | 'issuer_eval' | 'create_tender'>('consult');
  const [tendersList, setTendersList] = useState<SmartTender[]>(MOCK_SMART_TENDERS);
  const [selectedTender, setSelectedTender] = useState<SmartTender | null>(MOCK_SMART_TENDERS[0] || null);

  // Response Assistant Modal
  const [isRespondingModal, setIsRespondingModal] = useState(false);
  const [responseStep, setResponseStep] = useState<number>(1);
  const [submissionForm, setSubmissionForm] = useState({
    price: 43500,
    leadTime: 18,
    summary: 'Proposition conforme aux normes OMS avec transport maritime sécurisé et garantie 18 mois.'
  });
  const [submittedAlert, setSubmittedAlert] = useState<string | null>(null);

  // Create Tender Form
  const [newTenderForm, setNewTenderForm] = useState({
    title: 'Fourniture de 20 Groupes Électrogènes Insonorisés 50 kVA pour Centres Hospitaliers',
    sector: 'Énergie & Solaire Renouvelable',
    issuerType: 'ngo' as 'enterprise' | 'ngo' | 'institution' | 'project',
    issuerName: 'Programme Urgence Sanitaire',
    deadline: '20 Mai 2026',
    budget: 85000,
    currency: 'EUR',
    specs: 'Moteurs diesel 4 cylindres insonorisés <65dB à 7m avec inverseur automatique ATS et réservoir 24h.'
  });

  const handleLaunchResponseAssistant = () => {
    setIsRespondingModal(true);
    setResponseStep(1);
  };

  const handleConfirmSubmission = () => {
    if (!selectedTender) return;
    const newSubmission: TenderSubmission = {
      id: `sub-${Date.now()}`,
      tenderId: selectedTender.id,
      bidderId: 'u1',
      bidderName: 'Mon Entreprise / Consortium Partenaire',
      bidderCountry: 'Guinée',
      bidderFlag: '🇬🇳',
      submittedPrice: submissionForm.price,
      currency: selectedTender.currency,
      leadTimeDays: submissionForm.leadTime,
      technicalScore: 39,
      priceScore: 29,
      leadTimeScore: 9,
      experienceScore: 9,
      complianceScore: 10,
      totalScore: 96,
      complianceStatus: 'conforme',
      missingDocsAlerts: [],
      uploadedDocs: [
        { name: 'Offre_Technique_Signee.pdf', size: '2.1 MB', isVerified: true },
        { name: 'Bordereau_Prix_Unitaire.xlsx', size: '420 KB', isVerified: true }
      ],
      proposalSummary: submissionForm.summary,
      status: 'submitted',
      submittedAt: 'À l\'instant'
    };

    const updated = tendersList.map(t => {
      if (t.id === selectedTender.id) {
        return { ...t, submissions: [newSubmission, ...t.submissions] };
      }
      return t;
    });

    setTendersList(updated);
    setSelectedTender({ ...selectedTender, submissions: [newSubmission, ...selectedTender.submissions] });
    setIsRespondingModal(false);
    setSubmittedAlert(`Votre soumission pour l'Appel d'Offres ${selectedTender.codeRef} a été déposée et certifiée avec succès !`);
    setTimeout(() => setSubmittedAlert(null), 6000);
  };

  const handleCreateNewTender = () => {
    const created: SmartTender = {
      id: `tender-${Date.now()}`,
      codeRef: `AO-2026-${Date.now().toString().slice(-4)}`,
      title: newTenderForm.title,
      issuerType: newTenderForm.issuerType,
      issuerName: newTenderForm.issuerName,
      issuerCountry: 'Guinée',
      issuerFlag: '🇬🇳',
      sector: newTenderForm.sector,
      visibility: 'public',
      specificationsSummary: newTenderForm.specs,
      detailedRequirements: [
        'Conformité aux normes internationales d\'insonorisation',
        'Garantie pièces et main d\'œuvre de 2 ans sur site',
        'Livraison DDP Conakry et régions de l\'intérieur'
      ],
      criteriaWeights: {
        technical: 40,
        price: 30,
        leadTime: 10,
        experience: 10,
        compliance: 10
      },
      deadlineDate: newTenderForm.deadline,
      estimatedBudgetPublic: newTenderForm.budget,
      currency: newTenderForm.currency,
      mandatoryCertifications: ['RCCM légal', 'Attestation Fiscale à jour'],
      documentsRequired: [
        { name: 'Cahier_Des_Charges_Techniques.pdf', description: 'Spécifications complètes', mandatory: true }
      ],
      questionsAnswers: [],
      submissions: [],
      status: 'open',
      createdAt: 'Aujourd\'hui'
    };

    setTendersList([created, ...tendersList]);
    setSelectedTender(created);
    setActiveTab('consult');
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} />
                Appels d'Offres & RFQ Multi-Fournisseurs
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Centrale des Appels d'Offres & Marchés Publics/Privés
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Espace pour entreprises, ONG, bailleurs et institutions. Analyse IA du cahier des charges et grille d'évaluation multicritère.
            </p>
          </div>

          <button
            onClick={() => setActiveTab('create_tender')}
            className="px-5 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center gap-2 transition-colors shrink-0"
          >
            <PlusCircle size={16} />
            Publier un Appel d'Offres
          </button>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('consult')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'consult'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <FileText size={15} />
            Consulter les Appels d'Offres ({tendersList.length})
          </button>

          <button
            onClick={() => setActiveTab('issuer_eval')}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
              activeTab === 'issuer_eval'
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            <Award size={15} className="text-amber-400" />
            Grille d'Évaluation des Soumissions & Audit
          </button>
        </div>
      </div>

      {submittedAlert && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{submittedAlert}</span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 1: CONSULTATION DES APPELS D'OFFRES & ASSISTANT DE RÉPONSE
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'consult' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tenders List */}
          <div className="lg:col-span-1 space-y-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Marchés & Consultations Ouverts
            </h3>

            {tendersList.map(tender => (
              <div
                key={tender.id}
                onClick={() => setSelectedTender(tender)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedTender?.id === tender.id
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-bold text-indigo-400">{tender.codeRef}</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    Ouvert
                  </span>
                </div>
                <h4 className="text-xs font-bold text-white mt-1 line-clamp-2">{tender.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Émetteur : {tender.issuerName} • {tender.issuerFlag}
                </p>
                <p className="text-[10px] text-amber-300 mt-1">
                  Date limite : {tender.deadlineDate}
                </p>
              </div>
            ))}
          </div>

          {/* Tender Detail & AI Assistant */}
          {selectedTender && (
            <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-indigo-400">{selectedTender.codeRef}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs text-slate-400">{selectedTender.sector}</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                    {selectedTender.title}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Émis par : <strong className="text-slate-200">{selectedTender.issuerName}</strong> ({selectedTender.issuerCountry})
                  </p>
                </div>

                <div className="text-left sm:text-right space-y-1">
                  <div className="text-xs text-slate-400">Budget Estimatif :</div>
                  <div className="text-base font-black text-emerald-400">
                    {selectedTender.estimatedBudgetPublic ? `${selectedTender.estimatedBudgetPublic.toLocaleString()} ${selectedTender.currency}` : 'Non divulgué'}
                  </div>
                </div>
              </div>

              {/* Specifications Summary */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Objet & Termes de Référence
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-950 p-4 rounded-2xl border border-slate-800">
                  {selectedTender.specificationsSummary}
                </p>
              </div>

              {/* Detailed Requirements */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Exigences Techniques Majeures :
                </h4>
                <div className="space-y-1.5">
                  {selectedTender.detailedRequirements.map((req, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-indigo-400 font-bold">•</span>
                      <span>{req}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Evaluation Weights */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Barème de Notation Multicritère :
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Technique</span>
                    <p className="font-black text-indigo-400 mt-0.5">{selectedTender.criteriaWeights.technical}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Prix</span>
                    <p className="font-black text-emerald-400 mt-0.5">{selectedTender.criteriaWeights.price}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Délai</span>
                    <p className="font-black text-amber-400 mt-0.5">{selectedTender.criteriaWeights.leadTime}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Expérience</span>
                    <p className="font-black text-purple-400 mt-0.5">{selectedTender.criteriaWeights.experience}%</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[10px]">Conformité</span>
                    <p className="font-black text-teal-400 mt-0.5">{selectedTender.criteriaWeights.compliance}%</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', `Je prépare une offre pour l'Appel d'Offres ${selectedTender.codeRef} : ${selectedTender.title}`)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-2 transition-colors"
                >
                  <Bot size={14} className="text-amber-400" />
                  Consulter l'Expert Marchés Publics
                </button>

                <button
                  onClick={handleLaunchResponseAssistant}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-black shadow-md flex items-center gap-2 transition-all"
                >
                  <Sparkles size={15} className="text-amber-300" />
                  Assistant IA de Soumission d'Offre
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 2: GRILLE D'ÉVALUATION DES SOUMISSIONS & AUDIT
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'issuer_eval' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white">
                Grille Multicritère d'Évaluation des Offres Reçues
              </h3>
              <p className="text-xs text-slate-400">
                Traçabilité et audit des scores calculés selon le barème officiel.
              </p>
            </div>

            {selectedTender && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-indigo-400">{selectedTender.codeRef}</span>
                    <h4 className="text-sm font-bold text-white">{selectedTender.title}</h4>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold">
                    {selectedTender.submissions.length} Soumission(s)
                  </span>
                </div>

                {selectedTender.submissions.map(sub => (
                  <div
                    key={sub.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{sub.bidderFlag}</span>
                          <h5 className="font-bold text-white text-sm">{sub.bidderName}</h5>
                          <span className="text-xs text-slate-400">({sub.bidderCountry})</span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1">{sub.proposalSummary}</p>
                      </div>

                      <div className="text-right">
                        <div className="text-xl font-black text-emerald-400">
                          {sub.totalScore} / 100
                        </div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold">Score Global IA</span>
                      </div>
                    </div>

                    {/* Breakdown Scores */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs bg-slate-900/60 p-3 rounded-xl">
                      <div>
                        <span className="text-slate-400">Technique ({selectedTender.criteriaWeights.technical}%) :</span>
                        <p className="font-bold text-white">{sub.technicalScore} pts</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Prix Proposé :</span>
                        <p className="font-bold text-emerald-400">{sub.submittedPrice.toLocaleString()} {sub.currency}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Délai :</span>
                        <p className="font-bold text-white">{sub.leadTimeDays} jours</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Expérience :</span>
                        <p className="font-bold text-white">{sub.experienceScore} pts</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Statut Conformité :</span>
                        <p className="font-bold text-teal-400 uppercase">{sub.complianceStatus}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                      <span className="text-[11px] text-slate-400">Déposé le : {sub.submittedAt}</span>
                      <button
                        onClick={() => onOpenDealManager && onOpenDealManager(sub.id)}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors"
                      >
                        Attribuer le Marché & Ouvrir Dossier
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          TAB 3: PUBLIER UN NOUVEL APPEL D'OFFRES
         ══════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'create_tender' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-lg font-bold text-white">Publier un Appel d'Offres ou RFQ Institutionnel</h3>
              <p className="text-xs text-slate-400">Mettez en concurrence les fournisseurs certifiés avec traçabilité intégrale.</p>
            </div>
            <button onClick={() => setActiveTab('consult')} className="text-slate-400 hover:text-white text-xs font-bold">
              ← Retour
            </button>
          </div>

          <div className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-300">Intitulé officiel du Marché</label>
              <input
                type="text"
                value={newTenderForm.title}
                onChange={(e) => setNewTenderForm({ ...newTenderForm, title: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300">Secteur d'activité</label>
                <input
                  type="text"
                  value={newTenderForm.sector}
                  onChange={(e) => setNewTenderForm({ ...newTenderForm, sector: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300">Nom de l'Organisme / Entreprise Émettrice</label>
                <input
                  type="text"
                  value={newTenderForm.issuerName}
                  onChange={(e) => setNewTenderForm({ ...newTenderForm, issuerName: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-bold text-slate-300">Date limite de soumission</label>
                <input
                  type="text"
                  value={newTenderForm.deadline}
                  onChange={(e) => setNewTenderForm({ ...newTenderForm, deadline: e.target.value })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-bold text-slate-300">Budget Estimé ({newTenderForm.currency})</label>
                <input
                  type="number"
                  value={newTenderForm.budget}
                  onChange={(e) => setNewTenderForm({ ...newTenderForm, budget: Number(e.target.value) })}
                  className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-300">Spécifications techniques & Termes de référence</label>
              <textarea
                rows={4}
                value={newTenderForm.specs}
                onChange={(e) => setNewTenderForm({ ...newTenderForm, specs: e.target.value })}
                className="w-full mt-1 bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setActiveTab('consult')}
              className="px-4 py-2 rounded-xl bg-slate-950 text-slate-300 text-xs font-bold"
            >
              Annuler
            </button>
            <button
              onClick={handleCreateNewTender}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md"
            >
              Publier l'Appel d'Offres
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL: ASSISTANT IA DE RÉPONSE POUR LES FOURNISSEURS
         ══════════════════════════════════════════════════════════════════════ */}
      {isRespondingModal && selectedTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-xl rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-300 rounded-2xl">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Assistant IA de Soumission d'Offre</h3>
                  <p className="text-xs text-slate-400">{selectedTender.codeRef} - {selectedTender.title}</p>
                </div>
              </div>
              <button onClick={() => setIsRespondingModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            {/* Checklist of Conformity */}
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-400" />
                Vérification Automatique des Exigences Légales
              </span>

              <div className="space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-emerald-300">
                  <span>✓ RCCM & Agrément d'activité</span>
                  <span className="font-bold">Conforme</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300">
                  <span>✓ Quitus Fiscal & Attestations sociales</span>
                  <span className="font-bold">Valide</span>
                </div>
                <div className="flex items-center justify-between text-emerald-300">
                  <span>✓ Certificats techniques demandés</span>
                  <span className="font-bold">Conforme</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-300">Montant Total Proposé ({selectedTender.currency})</label>
                  <input
                    type="number"
                    value={submissionForm.price}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, price: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-300">Délai d'exécution (jours)</label>
                  <input
                    type="number"
                    value={submissionForm.leadTime}
                    onChange={(e) => setSubmissionForm({ ...submissionForm, leadTime: Number(e.target.value) })}
                    className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-300">Synthèse de la proposition technique :</label>
                <textarea
                  rows={4}
                  value={submissionForm.summary}
                  onChange={(e) => setSubmissionForm({ ...submissionForm, summary: e.target.value })}
                  className="w-full mt-1 bg-slate-900 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setIsRespondingModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-slate-300 text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSubmission}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs font-black shadow-md flex items-center gap-2"
              >
                <CheckCircle2 size={15} />
                Valider & Déposer la Soumission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
