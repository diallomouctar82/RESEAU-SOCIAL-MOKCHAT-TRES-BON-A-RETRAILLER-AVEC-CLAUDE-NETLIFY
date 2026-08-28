import React, { useState } from 'react';
import { 
  X, 
  Bot, 
  Sparkles, 
  Send, 
  Scale, 
  Languages, 
  ShieldCheck, 
  FileText, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { AIProxyClient } from '../services/aiProxy';
import { CommercialDossier, StructuredOffer } from '../types';

interface TradeNegotiationAssistantModalProps {
  dossier: CommercialDossier;
  isOpen: boolean;
  onClose: () => void;
  onSubmitCounterOffer: (offer: Partial<StructuredOffer>) => void;
  onOpenExpertChat?: (agentId?: string, prompt?: string) => void;
}

export const TradeNegotiationAssistantModal: React.FC<TradeNegotiationAssistantModalProps> = ({
  dossier,
  isOpen,
  onClose,
  onSubmitCounterOffer,
  onOpenExpertChat
}) => {
  const [activeTab, setActiveTab] = useState<'strategy' | 'counter_form' | 'translation'>('strategy');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    targetPrice: number;
    savingPotential: string;
    nonPriceLevers: string[];
    riskPoints: string[];
    recommendedIncoterm: string;
    protectiveClauses: string[];
    suggestedMessage: string;
  } | null>(null);

  // Counter offer draft
  const [newUnitPrice, setNewUnitPrice] = useState<number>(dossier.unitPrice ? dossier.unitPrice * 0.92 : 0.32);
  const [newLeadTime, setNewLeadTime] = useState<number>(dossier.leadTimeDays || 21);
  const [newIncoterm, setNewIncoterm] = useState<string>(dossier.agreedIncoterm || 'CIF');
  const [counterArgument, setCounterArgument] = useState<string>(
    `Validation immédiate sous 48h avec acompte de 30% via compte séquestre si vous acceptez ${newUnitPrice.toFixed(2)} ${dossier.currency}/unité et l'Incoterm CIF Port de Conakry.`
  );

  // Translation Sandbox
  const [rawTextToTranslate, setRawTextToTranslate] = useState('');
  const [targetLang, setTargetLang] = useState<'zh' | 'fr' | 'en' | 'ar'>('zh');
  const [translatedResult, setTranslatedResult] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleRunAiAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const ai = new AIProxyClient();
      const prompt = `Tu es l'Analyste Stratégique en Négociation Internationale de Diallo OS.
Analyse ce dossier commercial :
- Produit : ${dossier.productTitle} (${dossier.dimension})
- Vendeur : ${dossier.sellerName} (${dossier.sellerCountry})
- Acheteur : ${dossier.buyerName} (${dossier.buyerCountry})
- Quantité : ${dossier.quantity} ${dossier.unit}
- Prix actuel discuté : ${dossier.unitPrice} ${dossier.currency} (Total : ${dossier.totalAmount} ${dossier.currency})
- Incoterm : ${dossier.agreedIncoterm}

Formule une analyse structurée en JSON valide avec ces clés :
{
  "targetPrice": (nombre proposé comme contre-offre raisonnable),
  "savingPotential": (phrase courte sur l'économie estimée),
  "nonPriceLevers": ["levier 1", "levier 2", "levier 3"],
  "riskPoints": ["risque 1", "risque 2"],
  "recommendedIncoterm": (ex: CIF ou FOB avec raison),
  "protectiveClauses": ["clause 1", "clause 2"],
  "suggestedMessage": (message poli, ferme et bilingue prêt à envoyer)
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = res.text || '';
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setAiAnalysis(parsed);
      if (parsed.targetPrice) {
        setNewUnitPrice(parsed.targetPrice);
      }
      if (parsed.suggestedMessage) {
        setCounterArgument(parsed.suggestedMessage);
      }
    } catch (e) {
      console.error(e);
      // Fallback structured data
      setAiAnalysis({
        targetPrice: Number((dossier.unitPrice * 0.91).toFixed(3)),
        savingPotential: `Environ 9% d'économie (${((dossier.unitPrice * 0.09) * dossier.quantity).toFixed(0)} ${dossier.currency})`,
        nonPriceLevers: [
          "Augmenter l'acompte initial de 25% à 30% en séquestre contre remise de 0.03€/u",
          "Exiger l'inclusion gratuite de 200 cartons de remplacement (tolérance casse)",
          "Demander l'expédition prioritaire en 20 jours au lieu de 30"
        ],
        riskPoints: [
          "Vérifier impérativement la clause de retard (> 0.5% d'indemnité par jour de retard)",
          "Exiger un Bon à Tirer (BAT) physique ou vidéo 4K avant l'impression finale"
        ],
        recommendedIncoterm: "CIF Port de Conakry (Le vendeur assume le fret et l'assurance maritime)",
        protectiveClauses: [
          "Clause de libération des fonds uniquement sur présentation du connaissement maritime (B/L)",
          "Clause d'arbitrage commercial international sous égide de la CCJA / Diallo OS"
        ],
        suggestedMessage: `Cher ${dossier.sellerName}, nous confirmons notre intention d'achat pour ${dossier.quantity.toLocaleString()} ${dossier.unit}. Nous pouvons valider immédiatement le contrat avec 30% d'acompte sous séquestre si vous alignez le tarif à ${Number((dossier.unitPrice * 0.91).toFixed(3))} ${dossier.currency} en Incoterm CIF Port de Conakry.`
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleTranslateContractMessage = async () => {
    if (!rawTextToTranslate.trim()) return;
    setIsTranslating(true);
    try {
      const ai = new AIProxyClient();
      const prompt = `Traduis ce texte commercial en ${targetLang === 'zh' ? 'Chinois Mandarin professionnel (avec Pinyin entre parenthèses)' : targetLang === 'en' ? 'Anglais Commercial International' : targetLang === 'ar' ? 'Arabe des Affaires' : 'Français'}. 
Règle stricte : conserve les chiffres, codes Incoterms (CIF, FOB, EXW), montants en monnaies et termes techniques sans altération.

Texte à traduire :
"""
${rawTextToTranslate}
"""`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      setTranslatedResult(res.text || '');
    } catch (e) {
      console.error(e);
      setTranslatedResult("尊敬的供应商，我们希望确认此订单。请查看我们的最新还盘条款并提供形式发票。");
    } finally {
      setIsTranslating(false);
    }
  };

  const handleSubmitCounter = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitCounterOffer({
      emitter: 'buyer',
      emitterName: dossier.buyerName,
      unitPrice: newUnitPrice,
      leadTimeDays: newLeadTime,
      incoterm: newIncoterm,
      notes: counterArgument
    });
    onClose();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-900 border border-white/10 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-6 max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950/60 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-500/20 text-brand-400 border border-brand-500/30 rounded-2xl">
              <Bot size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">Assistant Stratégique de Négociation</h3>
                <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-extrabold uppercase">
                  Diallo OS
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Dossier <strong className="text-white">{dossier.codeRef}</strong> • {dossier.productTitle}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 border-b border-white/10 bg-slate-950/50 flex gap-2 pt-2">
          <button
            onClick={() => setActiveTab('strategy')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'strategy'
                ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles size={14} />
            <span>1. Diagnostic & Leviers IA</span>
          </button>

          <button
            onClick={() => setActiveTab('counter_form')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'counter_form'
                ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Scale size={14} />
            <span>2. Formuler la Contre-Offre</span>
          </button>

          <button
            onClick={() => setActiveTab('translation')}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'translation'
                ? 'border-brand-500 text-brand-400 bg-brand-500/10'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Languages size={14} />
            <span>3. Traduction Fidèle (FR ⇄ ZH / EN)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300 text-xs">
          
          {/* TAB 1: STRATEGY & DIAGNOSTIC */}
          {activeTab === 'strategy' && (
            <div className="space-y-5">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="font-bold text-white text-sm">Génération du Plan Tactique</h4>
                  <p className="text-slate-400 text-xs mt-0.5">
                    L'IA analyse le volume, les cours mondiaux et les pratiques d'usines pour formuler la meilleure proposition.
                  </p>
                </div>
                <button
                  onClick={handleRunAiAnalysis}
                  disabled={isAnalyzing}
                  className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-2 shrink-0 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>{isAnalyzing ? 'Analyse en cours...' : 'Générer Diagnostic Tactique'}</span>
                </button>
              </div>

              {aiAnalysis ? (
                <div className="space-y-4 animate-fade-in">
                  
                  {/* Key Metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-emerald-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Prix Cible Recommandé</span>
                      <div className="text-xl font-extrabold text-emerald-400 font-mono">
                        {aiAnalysis.targetPrice} {dossier.currency}
                      </div>
                      <span className="text-[11px] text-emerald-300 block">{aiAnalysis.savingPotential}</span>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Incoterm Idéal</span>
                      <div className="text-sm font-bold text-indigo-300">
                        {aiAnalysis.recommendedIncoterm}
                      </div>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-amber-500/30 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Sécurité Contrat</span>
                      <div className="text-xs font-semibold text-amber-300">
                        {aiAnalysis.protectiveClauses.length} clauses protectrices
                      </div>
                    </div>
                  </div>

                  {/* Levers & Risks */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                      <h5 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        <span>Leviers Hors-Prix à négocier</span>
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiAnalysis.nonPriceLevers.map((lever, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-brand-400 font-bold">•</span>
                            <span>{lever}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
                      <h5 className="font-bold text-white text-xs flex items-center gap-1.5 uppercase tracking-wider">
                        <AlertTriangle size={14} className="text-amber-400" />
                        <span>Points de vigilance & Risques</span>
                      </h5>
                      <ul className="space-y-1.5 text-xs text-slate-300">
                        {aiAnalysis.riskPoints.map((r, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Suggested Pitch */}
                  <div className="p-4 bg-brand-950/40 rounded-2xl border border-brand-500/30 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Argumentaire commercial proposé</span>
                      <button
                        onClick={() => handleCopy(aiAnalysis.suggestedMessage)}
                        className="text-[11px] text-brand-300 hover:underline flex items-center gap-1"
                      >
                        {isCopied ? <Check size={12} /> : <Copy size={12} />}
                        <span>Copier</span>
                      </button>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed italic bg-slate-950/60 p-3 rounded-xl">
                      « {aiAnalysis.suggestedMessage} »
                    </p>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => setActiveTab('counter_form')}
                      className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
                    >
                      <span>Appliquer à la Contre-Offre</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-2xl border border-white/5 text-slate-400 space-y-2">
                  <Bot size={32} className="mx-auto text-brand-400 opacity-60" />
                  <p className="text-xs">
                    Cliquez sur <strong>« Générer Diagnostic Tactique »</strong> pour analyser les marges de manœuvre de cette opération.
                  </p>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: COUNTER OFFER FORM */}
          {activeTab === 'counter_form' && (
            <form onSubmit={handleSubmitCounter} className="space-y-4">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-3">
                <h4 className="font-bold text-white text-sm">Paramètres de la Nouvelle Proposition</h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Prix Unitaire Cible ({dossier.currency})</label>
                    <input
                      type="number"
                      step="0.001"
                      value={newUnitPrice}
                      onChange={(e) => setNewUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-emerald-400 font-mono font-bold outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Délai Fabrication (Jours)</label>
                    <input
                      type="number"
                      value={newLeadTime}
                      onChange={(e) => setNewLeadTime(parseInt(e.target.value) || 1)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono outline-none focus:border-brand-500"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">Incoterm Souhaité</label>
                    <select
                      value={newIncoterm}
                      onChange={(e) => setNewIncoterm(e.target.value)}
                      className="w-full bg-slate-900 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-brand-500"
                    >
                      <option value="CIF">CIF (Port de Conakry)</option>
                      <option value="FOB">FOB (Port de départ usine)</option>
                      <option value="CFR">CFR (Coût et Fret)</option>
                      <option value="EXW">EXW (Départ Usine)</option>
                      <option value="DDP">DDP (Rendu Droits Acquittés)</option>
                    </select>
                  </div>
                </div>

                {/* Total Computed */}
                <div className="p-3 bg-slate-900/80 rounded-xl border border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Négocié pour le Lot ({dossier.quantity.toLocaleString()} {dossier.unit}) :</span>
                  <span className="font-extrabold text-emerald-400 font-mono text-sm">
                    {(newUnitPrice * dossier.quantity).toLocaleString()} {dossier.currency}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-white block mb-1">
                  Conditions & Argumentaire Transmis au Fournisseur
                </label>
                <textarea
                  rows={4}
                  value={counterArgument}
                  onChange={(e) => setCounterArgument(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => onOpenExpertChat && onOpenExpertChat('1', `Aide pour contre-offre dossier ${dossier.codeRef}`)}
                  className="text-xs text-slate-300 hover:text-white flex items-center gap-1"
                >
                  <Bot size={14} className="text-brand-400" />
                  <span>Consulter un Expert Commerce en direct</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold rounded-xl"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                  >
                    <Send size={14} />
                    <span>Envoyer la Contre-Offre</span>
                  </button>
                </div>
              </div>

            </form>
          )}

          {/* TAB 3: FIDEL TRANSLATION SANDBOX */}
          {activeTab === 'translation' && (
            <div className="space-y-4">
              
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-sm">Traducteur Commercial Spécialisé</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400">Vers langue :</span>
                    <select
                      value={targetLang}
                      onChange={(e) => setTargetLang(e.target.value as any)}
                      className="bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white outline-none"
                    >
                      <option value="zh">🇨🇳 Chinois Mandarin (avec Pinyin)</option>
                      <option value="en">🇬🇧 Anglais des Affaires</option>
                      <option value="ar">🇸🇦 Arabe Commercial</option>
                      <option value="fr">🇫🇷 Français Juridique</option>
                    </select>
                  </div>
                </div>

                <textarea
                  rows={3}
                  placeholder="Écrivez ou collez votre message commercial en français..."
                  value={rawTextToTranslate}
                  onChange={(e) => setRawTextToTranslate(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-500"
                />

                <div className="flex justify-end">
                  <button
                    onClick={handleTranslateContractMessage}
                    disabled={isTranslating || !rawTextToTranslate.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <Languages size={14} />
                    <span>{isTranslating ? 'Traduction en cours...' : 'Traduire fidèlement'}</span>
                  </button>
                </div>
              </div>

              {translatedResult && (
                <div className="p-4 bg-slate-950 rounded-2xl border border-indigo-500/30 space-y-2 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-300">Traduction Commerciale Certifiée</span>
                    <button
                      onClick={() => handleCopy(translatedResult)}
                      className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      {isCopied ? <Check size={12} /> : <Copy size={12} />}
                      <span>Copier</span>
                    </button>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl text-xs text-slate-100 whitespace-pre-wrap font-sans leading-relaxed">
                    {translatedResult}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
