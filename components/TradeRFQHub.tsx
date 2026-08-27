import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  MapPin, 
  ShieldCheck, 
  Send, 
  FileText, 
  Sparkles, 
  ChevronRight, 
  MessageSquare, 
  Check, 
  X, 
  Scale, 
  DollarSign, 
  Handshake, 
  Building2, 
  Clock,
  ArrowUpRight,
  BadgeAlert
} from 'lucide-react';
import { BuyRequestRFQ, TradeQuote } from '../types';
import { GoogleGenAI } from '@google/genai';

interface TradeRFQHubProps {
  rfqs: BuyRequestRFQ[];
  onCreateRFQ: (newRfq: Partial<BuyRequestRFQ>) => void;
  onSubmitQuote: (rfqId: string, quote: Partial<TradeQuote>) => void;
  onOpenDialloAssist: (context: string) => void;
  onContactBuyer: (buyerId: string, buyerName: string) => void;
}

export const TradeRFQHub: React.FC<TradeRFQHubProps> = ({
  rfqs,
  onCreateRFQ,
  onSubmitQuote,
  onOpenDialloAssist,
  onContactBuyer
}) => {
  const [activeTab, setActiveTab] = useState<'browse' | 'my_rfqs' | 'create'>('browse');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDimension, setSelectedDimension] = useState<'all' | 'B2B' | 'B2C' | 'C2C'>('all');
  const [selectedRfq, setSelectedRfq] = useState<BuyRequestRFQ | null>(null);

  // New RFQ Form
  const [rfqTitle, setRfqTitle] = useState('');
  const [rfqCategory, setRfqCategory] = useState('Agroalimentaire & Matières Premières');
  const [rfqDimension, setRfqDimension] = useState<'B2B' | 'B2C' | 'C2C'>('B2B');
  const [rfqDesc, setRfqDesc] = useState('');
  const [rfqQuantity, setRfqQuantity] = useState(1000);
  const [rfqUnit, setRfqUnit] = useState('kg');
  const [rfqTargetPrice, setRfqTargetPrice] = useState<number | undefined>(undefined);
  const [rfqDestCountry, setRfqDestCountry] = useState('Guinée');
  const [rfqDestCity, setRfqDestCity] = useState('Conakry');
  const [rfqDeadline, setRfqDeadline] = useState('30/05/2026');
  const [rfqSpecs, setRfqSpecs] = useState('Carton résistant humidité, Norme ISO, Certificat phytosanitaire');
  const [isAiDrafting, setIsAiDrafting] = useState(false);

  // Quote Form
  const [isQuoting, setIsQuoting] = useState(false);
  const [quotePricePerUnit, setQuotePricePerUnit] = useState<number>(0);
  const [quoteLeadDays, setQuoteLeadDays] = useState<number>(15);
  const [quoteIncoterm, setQuoteIncoterm] = useState<'EXW' | 'FOB' | 'CIF' | 'DDP'>('CIF');
  const [quoteShipping, setQuoteShipping] = useState<number>(200);
  const [quoteNotes, setQuoteNotes] = useState('');

  const filteredRfqs = rfqs.filter(r => {
    const matchSearch = r.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        r.targetDestinationCountry.toLowerCase().includes(searchQuery.toLowerCase());
    const matchDim = selectedDimension === 'all' || r.dimension === selectedDimension;
    return matchSearch && matchDim;
  });

  const handleAiDraftRFQ = async () => {
    if (!rfqTitle) return;
    setIsAiDrafting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Rédige un cahier des charges / appel d'offres (RFQ) international professionnel pour l'achat suivant :
Produit recherché : "${rfqTitle}". Catégorie : ${rfqCategory}.
Génère une description détaillée avec critères de qualité, spécifications techniques recommandées, normes requises et Incoterm souhaité.
Réponds en texte clair et concis (environ 80-100 mots).`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      if (response.text) {
        setRfqDesc(response.text);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiDrafting(false);
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rfqTitle.trim()) return;

    const newRfq: Partial<BuyRequestRFQ> = {
      title: rfqTitle,
      category: rfqCategory,
      dimension: rfqDimension,
      description: rfqDesc,
      quantityRequested: rfqQuantity,
      unit: rfqUnit,
      targetPricePerUnit: rfqTargetPrice,
      currency: 'EUR',
      targetDestinationCountry: rfqDestCountry,
      targetDestinationCity: rfqDestCity,
      deadlineDate: rfqDeadline,
      specifications: rfqSpecs.split(',').map(s => s.trim()).filter(Boolean),
      certificationsRequired: ['Certificat d\'origine', 'Conformité'],
      createdAt: 'À l\'instant',
      status: 'open',
      quotesCount: 0,
      quotes: []
    };

    onCreateRFQ(newRfq);
    setActiveTab('browse');
    setRfqTitle('');
    setRfqDesc('');
  };

  const handleSubmitQuoteAction = () => {
    if (!selectedRfq) return;
    const newQuote: Partial<TradeQuote> = {
      supplierName: 'Mon Entreprise Export',
      supplierCountry: 'France',
      supplierFlag: '🇫🇷',
      supplierVerified: true,
      pricePerUnit: quotePricePerUnit,
      totalPrice: quotePricePerUnit * selectedRfq.quantityRequested,
      currency: selectedRfq.currency,
      unit: selectedRfq.unit,
      minOrderQty: selectedRfq.quantityRequested,
      leadTimeDays: quoteLeadDays,
      incotermProposed: quoteIncoterm,
      shippingEstimate: quoteShipping,
      notes: quoteNotes,
      status: 'pending',
      submittedAt: 'À l\'instant',
      commercialDocsAvailable: ['Facture Pro Forma', 'Certificat d\'origine']
    };

    onSubmitQuote(selectedRfq.id, newQuote);
    setIsQuoting(false);
    setSelectedRfq(null);
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 bg-slate-900 border border-white/10 rounded-3xl text-white">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Handshake size={13} /> Appels d'Offres & RFQ
            </span>
            <span className="text-xs text-slate-400">Marché Acheteurs B2B/B2C</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Demandes d'Achat & Cotations Ouvertes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
            Publiez vos besoins en volume pour recevoir des devis de fournisseurs certifiés, ou répondez aux demandes d'acheteurs mondiaux.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('create')}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
          >
            <Plus size={16} />
            <span>Publier un besoin (RFQ)</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          {[
            { id: 'browse', label: 'Toutes les demandes', count: rfqs.length },
            { id: 'create', label: 'Créer un appel d\'offres', icon: Plus }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === t.id 
                  ? 'bg-amber-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{t.label}</span>
              {t.count !== undefined && (
                <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] font-mono">
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Dimension Filter */}
        {activeTab === 'browse' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400 font-semibold mr-1 hidden sm:inline">Type :</span>
            {(['all', 'B2B', 'B2C', 'C2C'] as const).map(dim => (
              <button
                key={dim}
                onClick={() => setSelectedDimension(dim)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
                  selectedDimension === dim 
                    ? 'bg-white/20 text-white font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {dim === 'all' ? 'Tous' : dim}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* CREATE TAB */}
      {activeTab === 'create' && (
        <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl text-white space-y-6 animate-fade-down">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="text-amber-400" size={20} />
                <span>Formuler un appel d'offres / Demande d'achat (RFQ)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Précisez la quantité, l'unité, les normes et la destination pour obtenir des cotations fiables.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAiDraftRFQ}
              disabled={isAiDrafting || !rfqTitle}
              className="px-3.5 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 text-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles size={14} />
              <span>{isAiDrafting ? 'Rédaction IA en cours...' : 'Rédiger le cahier des charges avec Diallo OS'}</span>
            </button>
          </div>

          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Titre du besoin ou produit recherché *
                </label>
                <input 
                  type="text"
                  required
                  value={rfqTitle}
                  onChange={(e) => setRfqTitle(e.target.value)}
                  placeholder="Ex : Recherche 5000 sacs de riz parfumé 25kg ou 1000m² panneaux solaires"
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Catégorie
                </label>
                <select
                  value={rfqCategory}
                  onChange={(e) => setRfqCategory(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                >
                  <option value="Agroalimentaire & Matières Premières">Agroalimentaire & Matières Premières</option>
                  <option value="Emballage & Conditionnement">Emballage & Conditionnement</option>
                  <option value="Machines & Équipements">Machines & Équipements</option>
                  <option value="Électronique & High-Tech">Électronique & High-Tech</option>
                  <option value="Matériaux & BTP">Matériaux & BTP</option>
                  <option value="Textile & Mode">Textile & Mode</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Quantité demandée *
                </label>
                <input 
                  type="number"
                  required
                  min={1}
                  value={rfqQuantity}
                  onChange={(e) => setRfqQuantity(parseInt(e.target.value) || 1)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Unité de mesure
                </label>
                <input 
                  type="text"
                  value={rfqUnit}
                  onChange={(e) => setRfqUnit(e.target.value)}
                  placeholder="kg, tonnes, pièces, cartons"
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Prix cible unitaire (€, facultatif)
                </label>
                <input 
                  type="number"
                  step="0.01"
                  value={rfqTargetPrice || ''}
                  onChange={(e) => setRfqTargetPrice(parseFloat(e.target.value) || undefined)}
                  placeholder="Ex : 2.50"
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Dimension
                </label>
                <select
                  value={rfqDimension}
                  onChange={(e) => setRfqDimension(e.target.value as any)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                >
                  <option value="B2B">B2B (Entreprise à Entreprise)</option>
                  <option value="B2C">B2C (Grossiste à Consommateur)</option>
                  <option value="C2C">C2C (Particulier)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Pays de livraison *
                </label>
                <input 
                  type="text"
                  required
                  value={rfqDestCountry}
                  onChange={(e) => setRfqDestCountry(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Ville ou Port d'arrivée
                </label>
                <input 
                  type="text"
                  value={rfqDestCity}
                  onChange={(e) => setRfqDestCity(e.target.value)}
                  placeholder="Port Autonome de Conakry, Le Havre, etc."
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Date limite de réponse
                </label>
                <input 
                  type="text"
                  value={rfqDeadline}
                  onChange={(e) => setRfqDeadline(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 font-semibold block mb-1">
                Description détaillée & exigences
              </label>
              <textarea 
                rows={4}
                value={rfqDesc}
                onChange={(e) => setRfqDesc(e.target.value)}
                placeholder="Détaillez le conditionnement, l'usage final, les contraintes de transport..."
                className="w-full p-3 bg-slate-950 border border-white/10 rounded-xl text-sm text-white focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setActiveTab('browse')}
                className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform hover:scale-105"
              >
                Publier sur le Marché Mondial
              </button>
            </div>
          </form>
        </div>
      )}

      {/* BROWSE LIST */}
      {activeTab === 'browse' && (
        <div className="space-y-4">
          
          {/* Search bar */}
          <div className="relative">
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un appel d'offres par produit, pays de destination ou mot-clé..."
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-400 outline-none focus:border-amber-500"
            />
            <Search className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRfqs.map(rfq => (
              <div 
                key={rfq.id}
                className="p-5 bg-slate-900 border border-white/10 hover:border-amber-500/40 rounded-3xl transition-all text-white space-y-4 flex flex-col justify-between shadow-md group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-wider">
                        {rfq.dimension}
                      </span>
                      <span className="text-xs text-slate-400">
                        {rfq.category}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/5 text-slate-400">
                      {rfq.createdAt}
                    </span>
                  </div>

                  <h3 className="font-bold text-base text-white group-hover:text-amber-300 transition-colors leading-snug">
                    {rfq.title}
                  </h3>

                  <p className="text-xs text-slate-400 line-clamp-2 mt-1.5 leading-relaxed">
                    {rfq.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 mt-3 p-3 bg-slate-950/60 rounded-xl border border-white/5 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Volume demandé</span>
                      <span className="font-bold text-white">
                        {rfq.quantityRequested.toLocaleString()} {rfq.unit}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Destination</span>
                      <span className="font-bold text-slate-200 flex items-center gap-1">
                        <MapPin size={12} className="text-amber-400" />
                        {rfq.targetDestinationCountry} {rfq.targetDestinationCity && `(${rfq.targetDestinationCity})`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{rfq.buyerFlag}</span>
                    <div>
                      <div className="text-xs font-semibold text-slate-200 flex items-center gap-1">
                        {rfq.buyerName}
                        {rfq.buyerVerified && <ShieldCheck size={13} className="text-emerald-400" />}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {rfq.quotesCount} cotation(s) reçue(s) • Échéance : {rfq.deadlineDate}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedRfq(rfq);
                      setIsQuoting(true);
                      setQuotePricePerUnit(rfq.targetPricePerUnit || 1);
                    }}
                    className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                  >
                    <span>Soumettre un devis</span>
                    <ArrowUpRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* SUBMIT QUOTE MODAL */}
      {isQuoting && selectedRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-xl bg-slate-900 border border-white/10 rounded-3xl p-6 text-white space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Répondre à la demande d'achat
                </span>
                <h3 className="text-base font-bold text-white mt-0.5 truncate max-w-md">
                  {selectedRfq.title}
                </h3>
              </div>
              <button onClick={() => setIsQuoting(false)} className="p-1 hover:bg-white/10 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Prix unitaire proposé ({selectedRfq.currency}) :</label>
                  <input 
                    type="number"
                    step="0.01"
                    value={quotePricePerUnit}
                    onChange={(e) => setQuotePricePerUnit(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500 font-bold"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Délai de fabrication / expédition (Jours) :</label>
                  <input 
                    type="number"
                    value={quoteLeadDays}
                    onChange={(e) => setQuoteLeadDays(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Incoterm proposé :</label>
                  <select
                    value={quoteIncoterm}
                    onChange={(e) => setQuoteIncoterm(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                  >
                    <option value="EXW">EXW (Départ Usine)</option>
                    <option value="FOB">FOB (Franco à Bord)</option>
                    <option value="CIF">CIF (Fret & Assurance Inclus)</option>
                    <option value="DDP">DDP (Rendu Droits Acquittés)</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Frais de transport indicatifs (€) :</label>
                  <input 
                    type="number"
                    value={quoteShipping}
                    onChange={(e) => setQuoteShipping(parseFloat(e.target.value) || 0)}
                    className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Notes commerciales, conditionnement & garanties :</label>
                <textarea 
                  rows={3}
                  value={quoteNotes}
                  onChange={(e) => setQuoteNotes(e.target.value)}
                  placeholder="Précisez le conditionnement (sacs, fûts), les certifications fournies et les modalités de paiement..."
                  className="w-full p-2.5 bg-slate-950 border border-white/10 rounded-xl text-white outline-none focus:border-amber-500"
                />
              </div>

              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl flex items-center justify-between text-xs">
                <span className="text-slate-300">Total Pro Forma estimé :</span>
                <span className="text-base font-extrabold text-amber-400">
                  {(quotePricePerUnit * selectedRfq.quantityRequested + quoteShipping).toFixed(2)} {selectedRfq.currency}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsQuoting(false)}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-bold rounded-xl"
              >
                Fermer
              </button>
              <button
                type="button"
                onClick={handleSubmitQuoteAction}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5"
              >
                <Send size={14} />
                <span>Envoyer la cotation officielle</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
