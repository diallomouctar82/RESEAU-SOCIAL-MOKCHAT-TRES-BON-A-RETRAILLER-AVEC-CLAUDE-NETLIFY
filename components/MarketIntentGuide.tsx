import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Globe, 
  TrendingUp, 
  ArrowRight, 
  Package, 
  Truck, 
  Briefcase, 
  Scale, 
  Handshake, 
  Bot, 
  FileText, 
  DollarSign, 
  Compass, 
  ShieldCheck, 
  Building2, 
  HelpCircle, 
  Check, 
  Loader2, 
  ChevronRight,
  Send,
  Plane,
  Coins,
  BadgeCheck,
  Target,
  Users,
  Camera
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { MarketIntent, TradeDimension } from '../types';
import { TradeCommercialOrchestratorModal } from './TradeCommercialOrchestratorModal';
import { TradeCouncilMeetingModal } from './TradeCouncilMeetingModal';
import { TradeDocumentOcrModal } from './TradeDocumentOcrModal';

interface MarketIntentGuideProps {
  onSelectIntent: (intent: MarketIntent, contextData?: any) => void;
  onQuickQuery: (query: string) => void;
  onOpenTradeExpertChat: (initialPrompt?: string) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const MarketIntentGuide: React.FC<MarketIntentGuideProps> = ({
  onSelectIntent,
  onQuickQuery,
  onOpenTradeExpertChat,
  onNavigateToTab
}) => {
  const [naturalQuery, setNaturalQuery] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isOrchestratorModalOpen, setIsOrchestratorModalOpen] = useState(false);
  const [isCouncilModalOpen, setIsCouncilModalOpen] = useState(false);
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    intentDetected: MarketIntent;
    summary: string;
    suggestedTab: string;
    recommendedActions: string[];
    riskPoints: string[];
  } | null>(null);

  const intentCards: {
    id: MarketIntent;
    title: string;
    subtitle: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    color: string;
    bgColor: string;
    badge: string;
  }[] = [
    {
      id: 'buy',
      title: 'Acheter un produit ou matériel',
      subtitle: 'Catalogue B2B, B2C ou C2C avec devis et frais d\'expédition',
      icon: Package,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-500/10 border-blue-500/20 hover:border-blue-500/40',
      badge: 'Acheteur'
    },
    {
      id: 'sell',
      title: 'Vendre ou exposer mes produits',
      subtitle: 'Publiez votre catalogue, activez votre Vendeur IA et recevez des commandes',
      icon: TrendingUp,
      color: 'text-emerald-600 dark:text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40',
      badge: 'Vendeur'
    },
    {
      id: 'find_supplier',
      title: 'Trouver un fournisseur / Fabricant',
      subtitle: 'Sourcing international certifié (Chine, Afrique, Europe, Amériques)',
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20 hover:border-indigo-500/40',
      badge: 'Sourcing IA'
    },
    {
      id: 'find_buyer',
      title: 'Trouver des acheteurs & Répondre aux RFQ',
      subtitle: 'Consultez les appels d\'offres et demandes d\'achat ouvertes',
      icon: Handshake,
      color: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20 hover:border-amber-500/40',
      badge: 'Opportunités'
    },
    {
      id: 'import',
      title: 'Importer (Accompagnement A à Z)',
      subtitle: 'Feuille de route, calcul coût rendu (DDP), douane & transitaire',
      icon: Truck,
      color: 'text-purple-600 dark:text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20 hover:border-purple-500/40',
      badge: 'Parcours Guidé'
    },
    {
      id: 'export',
      title: 'Exporter mes matières ou produits finis',
      subtitle: 'Normes internationales, certificats phytosanitaires, incoterms',
      icon: Globe,
      color: 'text-teal-600 dark:text-teal-400',
      bgColor: 'bg-teal-500/10 border-teal-500/20 hover:border-teal-500/40',
      badge: 'Expansion'
    },
    {
      id: 'find_service',
      title: 'Trouver un service pro & transitaire',
      subtitle: 'Transitaires maritimes/aériens, juristes, traducteurs d\'affaires',
      icon: Briefcase,
      color: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20 hover:border-rose-500/40',
      badge: 'Partenaires'
    },
    {
      id: 'explain_to_diallo',
      title: 'Expliquer mon besoin à Diallo OS',
      subtitle: 'L\'IA analyse votre projet commercial et assemble la solution',
      icon: Bot,
      color: 'text-amber-500 dark:text-amber-300',
      bgColor: 'bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50',
      badge: 'Conseiller Dédié'
    }
  ];

  const handleAnalyzeQuery = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!naturalQuery.trim()) return;

    setIsAnalyzing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Tu es l'Expert Commerce International et Assistant Sourcing Diallo de la plateforme "LE MONDE À VOUS".
L'utilisateur formule un besoin commercial libre : "${naturalQuery}".

Analyse ce besoin et réponds UNIQUEMENT en JSON avec la structure exacte suivante :
{
  "intentDetected": "buy" | "sell" | "find_supplier" | "find_buyer" | "import" | "export" | "find_service" | "explain_to_diallo",
  "summary": "Résumé limpide du besoin et stratégie en 1 phrase percutante",
  "suggestedTab": "catalog" | "rfq" | "import_export" | "forwarders" | "directory" | "deals" | "my_shop",
  "recommendedActions": [
    "Action concrète 1",
    "Action concrète 2",
    "Action concrète 3"
  ],
  "riskPoints": [
    "Point de vigilance réglementaire ou douanier",
    "Point de vigilance logistique ou paiement"
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      const text = response.text || '{}';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      setAnalysisResult(parsed);
    } catch (err) {
      console.warn('AI analysis fallback:', err);
      setAnalysisResult({
        intentDetected: 'import',
        summary: `Votre recherche "${naturalQuery}" nécessite un sourcing de fournisseurs certifiés et un chiffrage du coût rendu.`,
        suggestedTab: 'catalog',
        recommendedActions: [
          'Consulter les fournisseurs et produits certifiés au catalogue',
          'Publier un appel d\'offres (RFQ) pour recevoir des cotations sous 24h',
          'Vérifier les droits de douane et frais de transport avec l\'Expert Logistique'
        ],
        riskPoints: [
          'Exiger une facture pro forma avec Incoterm précis (FOB, CIF ou DDP)',
          'Privilégier un paiement échelonné ou crédit documentaire sécurisé'
        ]
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 border border-white/10 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      {/* Header */}
      <div className="relative z-10 max-w-3xl mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/30 text-brand-300 text-xs font-bold uppercase tracking-wider mb-3">
          <Globe size={13} />
          <span>Moteur d'Affaires Internationales • Marché Mondial</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
          Que voulez-vous faire aujourd'hui ?
        </h2>
        <p className="text-slate-400 text-sm sm:text-base mt-2 font-light">
          Acheter, vendre, importer, exporter, trouver un fabricant ou négocier un contrat international. 
          Diallo OS et l’Expert Commerce vous accompagnent du premier contact jusqu’au déchargement.
        </p>
      </div>

      {/* Natural Language Input (Diallo OS Commerce Search) */}
      <div className="relative z-10 mb-8">
        <form onSubmit={handleAnalyzeQuery} className="relative">
          <div className="relative flex items-center">
            <input 
              type="text"
              value={naturalQuery}
              onChange={(e) => setNaturalQuery(e.target.value)}
              placeholder="Ex : Je veux importer 5000 cartons de médicaments de Chine vers la Guinée avec dédouanement..."
              className="w-full pl-12 pr-32 py-4 bg-white/5 hover:bg-white/10 focus:bg-slate-900 border border-white/15 focus:border-brand-500 rounded-2xl text-white placeholder-slate-400 text-sm sm:text-base transition-all outline-none shadow-inner"
            />
            <Search className="absolute left-4 text-slate-400" size={20} />
            <button
              type="submit"
              disabled={isAnalyzing || !naturalQuery.trim()}
              className="absolute right-2 px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg flex items-center gap-1.5"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Analyse...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Analyser</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-slate-400">
          <span className="font-semibold text-slate-500">Exemples rapides :</span>
          {[
            'Importer du café de Guinée en France',
            'Trouver fournisseur emballage carton ISO 9001',
            'Transitaire fret maritime Chine - Conakry',
            'Publier une demande de cotation (RFQ)'
          ].map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setNaturalQuery(chip);
                onQuickQuery(chip);
              }}
              className="px-2.5 py-1 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-lg text-slate-300 text-[11px] transition-colors"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Master AI Orchestration Action Bar (Step 7/7) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={() => setIsOrchestratorModalOpen(true)}
            className="p-3.5 bg-gradient-to-r from-brand-600/30 to-indigo-600/30 hover:from-brand-600/50 hover:to-indigo-600/50 border border-brand-500/40 rounded-2xl flex items-center gap-3 text-left transition-all hover:scale-[1.02] shadow-lg group"
          >
            <div className="p-2.5 rounded-xl bg-brand-500/30 text-brand-300 group-hover:scale-110 transition-transform">
              <Target size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-brand-300 block">Diallo OS</span>
              <span className="text-xs font-bold text-white block">Créer un Objectif & Parcours</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsCouncilModalOpen(true)}
            className="p-3.5 bg-gradient-to-r from-indigo-600/30 to-cyan-600/30 hover:from-indigo-600/50 hover:to-cyan-600/50 border border-indigo-500/40 rounded-2xl flex items-center gap-3 text-left transition-all hover:scale-[1.02] shadow-lg group"
          >
            <div className="p-2.5 rounded-xl bg-indigo-500/30 text-indigo-300 group-hover:scale-110 transition-transform">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">5 Experts Réunis</span>
              <span className="text-xs font-bold text-white block">Réunir le Conseil Commercial</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsOcrModalOpen(true)}
            className="p-3.5 bg-gradient-to-r from-emerald-600/30 to-teal-600/30 hover:from-emerald-600/50 hover:to-teal-600/50 border border-emerald-500/40 rounded-2xl flex items-center gap-3 text-left transition-all hover:scale-[1.02] shadow-lg group"
          >
            <div className="p-2.5 rounded-xl bg-emerald-500/30 text-emerald-300 group-hover:scale-110 transition-transform">
              <Camera size={20} />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block">Vision IA OCR</span>
              <span className="text-xs font-bold text-white block">Scanner Facture / B/L / Doc</span>
            </div>
          </button>
        </div>
      </div>

      {/* AI Analysis Result Card (if query analyzed) */}
      {analysisResult && (
        <div className="relative z-10 mb-8 p-5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl animate-fade-down space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-400">
                <Bot size={20} />
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">
                  Diagnostic Intelligent Diallo OS
                </span>
                <h4 className="text-sm sm:text-base font-bold text-white mt-0.5">
                  {analysisResult.summary}
                </h4>
              </div>
            </div>
            <button
              onClick={() => onOpenTradeExpertChat(naturalQuery)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors shrink-0 flex items-center gap-1"
            >
              <span>Parler à l'Expert</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1 mb-2">
                <Check size={14} /> Actions recommandées :
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {analysisResult.recommendedActions.map((act, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-400 font-bold">•</span>
                    <span>{act}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-white/5">
              <span className="text-[11px] font-bold text-amber-400 flex items-center gap-1 mb-2">
                <Scale size={14} /> Points de vigilance & Douane :
              </span>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {analysisResult.riskPoints.map((risk, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-400 font-bold">⚠️</span>
                    <span>{risk}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* The 8 Strategic Intent Cards */}
      <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {intentCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.id}
              onClick={() => onSelectIntent(card.id)}
              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer group flex flex-col justify-between ${card.bgColor}`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl bg-black/40 ${card.color}`}>
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-slate-300">
                    {card.badge}
                  </span>
                </div>
                <h3 className="font-bold text-white text-sm sm:text-base group-hover:text-brand-300 transition-colors mb-1.5 leading-snug">
                  {card.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {card.subtitle}
                </p>
              </div>

              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">
                <span>Démarrer</span>
                <ChevronRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Trust & Security Banner */}
      <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span>Vérification documentaire des entreprises</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Coins size={16} className="text-amber-400" />
            <span>Estimations douanes & Incoterms transparents</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Plane size={16} className="text-indigo-400" />
            <span>Transitaires connectés & suivi de fret</span>
          </div>
        </div>
        <button
          onClick={() => onOpenTradeExpertChat()}
          className="text-brand-400 hover:text-brand-300 font-bold hover:underline flex items-center gap-1"
        >
          <span>Consulter la charte de confiance</span>
          <ArrowRight size={13} />
        </button>
      </div>
      {/* MODALS */}
      <TradeCommercialOrchestratorModal
        isOpen={isOrchestratorModalOpen}
        onClose={() => setIsOrchestratorModalOpen(false)}
        initialQuery={naturalQuery || undefined}
        onNavigateToSection={(sectionId) => {
          if (onNavigateToTab) onNavigateToTab(sectionId);
        }}
      />

      <TradeCouncilMeetingModal
        isOpen={isCouncilModalOpen}
        onClose={() => setIsCouncilModalOpen(false)}
        initialTopic={naturalQuery || undefined}
      />

      <TradeDocumentOcrModal
        isOpen={isOcrModalOpen}
        onClose={() => setIsOcrModalOpen(false)}
      />
    </div>
  );
};
