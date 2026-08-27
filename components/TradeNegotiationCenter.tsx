import React, { useState } from 'react';
import { 
  Handshake, 
  Scale, 
  ArrowRight, 
  Clock, 
  DollarSign, 
  ShieldCheck, 
  Check, 
  X, 
  FileText, 
  Bot, 
  Sparkles, 
  Send, 
  MessageSquare,
  TrendingDown,
  Building,
  FolderKanban,
  Layers
} from 'lucide-react';
import { TradeDealNegotiation } from '../types';
import { GoogleGenAI } from '@google/genai';
import { CommercialDossierManager } from './CommercialDossierManager';

interface TradeNegotiationCenterProps {
  deals: TradeDealNegotiation[];
  onOpenTradeExpert: (context: string) => void;
  onOpenMokChat: (partyId: string, partyName: string) => void;
}

export const TradeNegotiationCenter: React.FC<TradeNegotiationCenterProps> = ({
  deals,
  onOpenTradeExpert,
  onOpenMokChat
}) => {
  const [viewMode, setViewMode] = useState<'dossiers' | 'quick_negotiation'>('dossiers');
  const [dealList, setDealList] = useState<TradeDealNegotiation[]>(deals);
  const [selectedDeal, setSelectedDeal] = useState<TradeDealNegotiation>(deals[0] || null);
  const [counterAmount, setCounterAmount] = useState<number>(selectedDeal?.currentOfferPrice || 0);
  const [counterNote, setCounterNote] = useState('');
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const handleSendCounter = () => {
    if (!selectedDeal || !counterAmount) return;
    const newEntry = {
      party: 'buyer' as const,
      amount: counterAmount,
      notes: counterNote || 'Contre-proposition formulée dans la négociation.',
      date: 'Aujourd\'hui'
    };

    const updated = {
      ...selectedDeal,
      currentOfferPrice: counterAmount,
      history: [...selectedDeal.history, newEntry],
      status: 'offer_sent' as const
    };

    setSelectedDeal(updated);
    setDealList(dealList.map(d => d.id === updated.id ? updated : d));
    setCounterNote('');
  };

  const handleAskAiStrategy = async () => {
    if (!selectedDeal) return;
    setIsAiSuggesting(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Tu es l'Expert Négociation Commerciale Internationale Diallo.
Dossier en cours : "${selectedDeal.dealTitle}".
Prix initial vendeur : ${selectedDeal.initialPrice} ${selectedDeal.currency}/unité.
Offre actuelle : ${selectedDeal.currentOfferPrice} ${selectedDeal.currency}/unité.
Quantité totale : ${selectedDeal.quantity} unités.
Incoterm discuté : ${selectedDeal.agreedIncoterm || 'CIF'}.

Donne une recommandation tactique percutante en 3 points :
1. Contre-offre de prix recommandée et justification
2. Leviers de négociation non monétaires (délais de paiement, acompte, emballage offert)
3. Clause juridique protectrice à insérer dans le contrat`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      setAiSuggestion(response.text || 'Négociation conseillée basée sur le volume.');
    } catch (e) {
      console.error(e);
      setAiSuggestion("Proposez 4.45€/kg en augmentant l'acompte initial à 40% et en demandant l'inclusion des sacs étanches.");
    } finally {
      setIsAiSuggesting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 border border-white/10 rounded-3xl">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('dossiers')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'dossiers'
                ? 'bg-brand-600 text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <FolderKanban size={16} />
            <span>Dossiers Commerciaux (Bout-en-Bout)</span>
          </button>

          <button
            onClick={() => setViewMode('quick_negotiation')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === 'quick_negotiation'
                ? 'bg-brand-600 text-white shadow-lg'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
            }`}
          >
            <Scale size={16} />
            <span>Négociation Rapide B2B ({dealList.length})</span>
          </button>
        </div>

        <span className="text-[11px] text-slate-400 hidden sm:inline">
          Module 2 : Traçabilité, Séquestre, Live Usine & Médiation
        </span>
      </div>

      {/* Render Selected View */}
      {viewMode === 'dossiers' ? (
        <CommercialDossierManager
          onOpenExpertChat={(agentId, prompt) => onOpenTradeExpert(prompt || '')}
        />
      ) : (
        <div className="space-y-6">
          {/* Header */}
          <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                  <Handshake size={13} /> Négociation & Contrats Commerciaux
                </span>
                <span className="text-xs text-slate-400">Transactions B2B Sécurisées</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Espace de Négociation & Formalisation
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Négociez les prix unitaires, les Incoterms et les échéances de paiement avec assistance tactique de Diallo OS.
              </p>
            </div>

            <button
              onClick={() => onOpenTradeExpert("Aide pour la rédaction et relecture d'un contrat de vente international")}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center gap-1.5"
            >
              <FileText size={16} />
              <span>Générer le contrat commercial</span>
            </button>
          </div>

          {selectedDeal && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* LEFT: Negotiation Dashboard */}
              <div className="lg:col-span-7 space-y-5">
                <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl text-white space-y-5 shadow-lg">
                  
                  <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <img src={selectedDeal.productImageUrl} alt={selectedDeal.productTitle} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                      <div>
                        <h3 className="font-bold text-base text-white">{selectedDeal.dealTitle}</h3>
                        <span className="text-xs text-slate-400">
                          Volume : {selectedDeal.quantity.toLocaleString()} unités • {selectedDeal.agreedIncoterm || 'CIF'}
                        </span>
                      </div>
                    </div>

                    <span className="px-3 py-1 bg-amber-500/20 text-amber-300 rounded-full text-xs font-bold">
                      {selectedDeal.status === 'counter_received' ? 'Contre-offre reçue' : 'En négociation'}
                    </span>
                  </div>

                  {/* Price Metrics comparison */}
                  <div className="grid grid-cols-3 gap-3 p-4 bg-slate-950/60 rounded-2xl border border-white/5 text-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Prix Catalogue Vendeur</span>
                      <span className="text-sm font-bold text-slate-300">{selectedDeal.initialPrice.toFixed(2)} {selectedDeal.currency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-400 uppercase block">Offre Actuelle</span>
                      <span className="text-base font-extrabold text-amber-400">{selectedDeal.currentOfferPrice.toFixed(2)} {selectedDeal.currency}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase block">Montant Total du Lot</span>
                      <span className="text-base font-extrabold text-emerald-400">
                        {(selectedDeal.currentOfferPrice * selectedDeal.quantity).toLocaleString()} {selectedDeal.currency}
                      </span>
                    </div>
                  </div>

                  {/* History of Rounds */}
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-3">
                      Historique des échanges & propositions
                    </span>
                    <div className="space-y-2.5">
                      {selectedDeal.history.map((h, idx) => (
                        <div 
                          key={idx}
                          className={`p-3.5 rounded-2xl border flex items-start justify-between gap-3 text-xs ${
                            h.party === 'buyer' 
                              ? 'bg-blue-950/20 border-blue-500/20 text-blue-100 ml-4' 
                              : 'bg-slate-950/60 border-white/5 text-slate-300 mr-4'
                          }`}
                        >
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-white">
                                {h.party === 'buyer' ? 'Acheteur (Vous)' : selectedDeal.sellerName}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono">{h.date}</span>
                            </div>
                            <p className="text-xs text-slate-300">{h.notes}</p>
                          </div>
                          <span className="text-xs font-extrabold font-mono text-emerald-400 shrink-0">
                            {h.amount.toFixed(2)} {selectedDeal.currency}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Counter-Offer Action Box */}
                  <div className="p-4 bg-slate-950 border border-white/10 rounded-2xl space-y-3">
                    <span className="text-xs font-bold text-white uppercase tracking-wider block">
                      Formuler une nouvelle proposition au vendeur
                    </span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Nouveau prix unitaire ({selectedDeal.currency}) :</label>
                        <input 
                          type="number"
                          step="0.05"
                          value={counterAmount}
                          onChange={(e) => setCounterAmount(parseFloat(e.target.value) || 0)}
                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-bold text-sm outline-none focus:border-emerald-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] text-slate-400 block mb-1">Argument commercial & conditions :</label>
                        <input 
                          type="text"
                          value={counterNote}
                          onChange={(e) => setCounterNote(e.target.value)}
                          placeholder="Ex : Validation immédiate avec acompte sous 48h si expédition le 15..."
                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-xs outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                      <button
                        type="button"
                        onClick={() => onOpenMokChat(selectedDeal.sellerId, selectedDeal.sellerName)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                      >
                        <MessageSquare size={13} />
                        <span>Discuter sur Mok Chat</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSendCounter}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                      >
                        <Send size={14} />
                        <span>Transmettre la contre-offre</span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* RIGHT: Diallo Tactical Advisor */}
              <div className="lg:col-span-5 space-y-4">
                <div className="p-6 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 rounded-3xl text-white space-y-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                        <Bot size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Copilote Négociation Diallo OS</h4>
                        <span className="text-[10px] text-indigo-300">Analyse de marché & clauses</span>
                      </div>
                    </div>

                    <button
                      onClick={handleAskAiStrategy}
                      disabled={isAiSuggesting}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 disabled:opacity-50"
                    >
                      <Sparkles size={13} />
                      <span>{isAiSuggesting ? 'Analyse...' : 'Conseil Tactique'}</span>
                    </button>
                  </div>

                  {aiSuggestion ? (
                    <div className="p-4 bg-slate-950/80 border border-white/5 rounded-2xl space-y-2 animate-fade-down text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                      {aiSuggestion}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-950/40 border border-white/5 rounded-2xl text-xs text-slate-400 space-y-2">
                      <p>
                        Cliquez sur <strong>Conseil Tactique</strong> pour obtenir une recommandation d'Incoterm, des arguments de prix et les clauses de sécurité à exiger avant signature.
                      </p>
                      <div className="p-2.5 bg-indigo-950/20 border border-indigo-500/20 rounded-xl text-[11px] text-indigo-300">
                        💡 <em>Astuce Diallo :</em> Pour 2 tonnes de café, négociez l'inclusion des emballages hermétiques GrainPro plutôt qu'une simple baisse de prix.
                      </div>
                    </div>
                  )}

                  {/* Milestones in deal */}
                  <div className="pt-2 border-t border-white/10">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                      Modalités de paiement convenues
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {selectedDeal.paymentMilestones?.map((m, idx) => (
                        <div key={idx} className="p-2 bg-slate-950/60 border border-white/5 rounded-xl text-slate-300 flex items-center gap-2">
                          <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
                          <span>{m}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  );
};
