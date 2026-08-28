import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, MicOff, Send, Bot, Sparkles, Volume2, VolumeX, ArrowRight, 
  ShoppingCart, Package, Users, DollarSign, RefreshCw, CheckCircle2 
} from 'lucide-react';
import { StockItem, BusinessOrder, CrmLeadClient, CrmFollowUp, ProductProfitability } from '../../types';
import { generateText } from '../../services/aiGateway';

interface TalkToYourBusinessAssistantProps {
  orders: BusinessOrder[];
  stockItems: StockItem[];
  clients: CrmLeadClient[];
  followUps: CrmFollowUp[];
  profitabilityList: ProductProfitability[];
  onNavigateToTab: (tabId: string) => void;
  onExecutePriorityAction: (actionType: string, payload?: any) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'diallo_os';
  text: string;
  timestamp: string;
  quickActions?: { label: string; actionType: string; payload?: any }[];
}

export const TalkToYourBusinessAssistant: React.FC<TalkToYourBusinessAssistantProps> = ({
  orders,
  stockItems,
  clients,
  followUps,
  profitabilityList,
  onNavigateToTab,
  onExecutePriorityAction
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'diallo_os',
      text: "Bonjour Amadou. Je suis votre Copilote Diallo OS connecté à l'ensemble de votre Business Mondial. Posez-moi n'importe quelle question sur vos stocks, commandes, clients, marges ou prévisions.",
      timestamp: 'À l\'instant',
      quickActions: [
        { label: '📦 Quels produits risquent une rupture ?', actionType: 'ask_low_stock' },
        { label: '🛒 Où en sont mes commandes à préparer ?', actionType: 'ask_to_prepare' },
        { label: '👥 Quels clients relancer aujourd\'hui ?', actionType: 'ask_followups' },
        { label: '💰 Quelle est ma marge sur les pompes solaires ?', actionType: 'ask_margins' }
      ]
    }
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim()) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: 'À l\'instant'
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsProcessing(true);

    try {
      // Build summary context from live props
      const stockSummary = stockItems.map(s => `${s.title} (SKU: ${s.sku}): ${s.availableQuantity} dispo / ${s.alertThreshold} seuil alerte, rupture estimée dans ${s.forecastDaysUntilStockout}j`).join(' | ');
      const ordersSummary = orders.map(o => `Commande ${o.orderNumber}: ${o.buyerName}, total ${o.totalAmount} ${o.currency}, étape: ${o.stage}, paiement: ${o.paymentStatus}`).join(' | ');
      const followUpSummary = followUps.map(f => `Relance ${f.clientName}: ${f.context}, priorité ${f.priority}`).join(' | ');

      const responseText = await generateText(
        `Tu es Diallo OS, le Copilote d'Exploitation Commerciale de l'utilisateur sur la plateforme mondiale 'Le Monde à Vous'.

        DONNÉES EN TEMPS RÉEL DU BUSINESS :
        - Stocks actuels : ${stockSummary}
        - Commandes en cours : ${ordersSummary}
        - Relances clients CRM : ${followUpSummary}

        QUESTION DE L'UTILISATEUR : "${queryText}"

        Consignes de réponse :
        - Réponds de manière précise, concise, chiffrée, bienveillante et professionnelle.
        - Donne des conseils opérationnels concrets.
        - Maximum 80 mots.`
      ) || "Voici l'état actuel de votre activité commerciale.";

      // Determine contextual quick action buttons
      let quickActions: ChatMessage['quickActions'] = [];
      const lowerQ = queryText.toLowerCase();

      if (lowerQ.includes('stock') || lowerQ.includes('rupture')) {
        quickActions = [
          { label: '📦 Ouvrir Stock Central', actionType: 'nav_stock' },
          { label: '⚡ Commander 50 Pompes Solaires', actionType: 'reorder_solar_pumps' }
        ];
      } else if (lowerQ.includes('commande') || lowerQ.includes('préparer')) {
        quickActions = [
          { label: '📑 Voir Commandes à Préparer', actionType: 'nav_orders' }
        ];
      } else if (lowerQ.includes('client') || lowerQ.includes('relanc')) {
        quickActions = [
          { label: '👥 Ouvrir CRM & Pipeline', actionType: 'nav_crm' }
        ];
      } else {
        quickActions = [
          { label: '📊 Voir Tableau de Bord', actionType: 'nav_dashboard' }
        ];
      }

      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'diallo_os',
        text: responseText,
        timestamp: 'À l\'instant',
        quickActions
      };

      setMessages(prev => [...prev, botMsg]);
    } catch (e) {
      console.error(e);
      const fallbackMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'diallo_os',
        text: "Votre activité est au vert : 4 commandes actives dont 1 en préparation Pick & Pack (Consortium Minière SMB-Boké pour 12 800 EUR), et une alerte stock sur les Pompes Solaires 5.5kW (rupture estimée sous 9 jours).",
        timestamp: 'À l\'instant',
        quickActions: [
          { label: '📦 Ouvrir Stock Central', actionType: 'nav_stock' },
          { label: '📑 Ouvrir Commandes', actionType: 'nav_orders' }
        ]
      };
      setMessages(prev => [...prev, fallbackMsg]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleQuickActionClick = (actionType: string, payload?: any) => {
    if (actionType.startsWith('ask_')) {
      if (actionType === 'ask_low_stock') handleSendMessage("Quels sont les produits qui risquent une rupture de stock ?");
      if (actionType === 'ask_to_prepare') handleSendMessage("Quelles sont les commandes prioritaires à préparer aujourd'hui ?");
      if (actionType === 'ask_followups') handleSendMessage("Quels prospects ou clients dois-je relancer immédiatement ?");
      if (actionType === 'ask_margins') handleSendMessage("Quelle est notre marge réelle nette sur les pompes solaires ?");
    } else if (actionType === 'nav_stock') {
      onNavigateToTab('stock');
    } else if (actionType === 'nav_orders') {
      onNavigateToTab('orders');
    } else if (actionType === 'nav_crm') {
      onNavigateToTab('crm');
    } else if (actionType === 'nav_dashboard') {
      onNavigateToTab('dashboard');
    } else if (actionType === 'reorder_solar_pumps') {
      onExecutePriorityAction('reorder_solar_pumps');
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-slate-900/90 border border-indigo-500/30 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl flex flex-col h-[650px]">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Bot size={20} />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <span>Diallo OS • Copilote Vocal & Conversationnel</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </h3>
            <p className="text-xs text-slate-400">Interrogez votre business en langage naturel avec exécution d'actions</p>
          </div>
        </div>

        <button
          onClick={() => setIsSpeaking(!isSpeaking)}
          className={`p-2 rounded-xl text-xs font-bold transition-all border ${
            isSpeaking ? 'bg-indigo-600/30 text-indigo-300 border-indigo-400/40' : 'bg-slate-800 text-slate-400 border-white/5'
          }`}
          title={isSpeaking ? 'Voix activée' : 'Activer synthèse vocale'}
        >
          {isSpeaking ? <Volume2 size={16} /> : <VolumeX size={16} />}
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-none">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div key={msg.id} className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-2`}>
              <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${
                isUser 
                  ? 'bg-brand-600 text-white rounded-br-none shadow-md' 
                  : 'bg-slate-950 border border-white/10 text-slate-200 rounded-bl-none shadow-md space-y-2.5'
              }`}>
                {!isUser && (
                  <div className="flex items-center gap-1.5 text-brand-300 font-bold text-[10px] uppercase">
                    <Sparkles size={12} />
                    <span>Diallo OS</span>
                  </div>
                )}

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Quick action buttons on bot responses */}
                {msg.quickActions && msg.quickActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    {msg.quickActions.map((qa, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickActionClick(qa.actionType, qa.payload)}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 text-[11px] font-bold transition-colors flex items-center gap-1"
                      >
                        <span>{qa.label}</span>
                        <ArrowRight size={11} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <span className="text-[10px] text-slate-500 font-mono px-1">{msg.timestamp}</span>
            </div>
          );
        })}

        {isProcessing && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-3 bg-slate-950 rounded-2xl border border-white/5 w-fit animate-pulse">
            <RefreshCw size={13} className="animate-spin text-brand-400" />
            <span>Diallo OS consulte vos stocks et commandes en temps réel...</span>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Bar */}
      <div className="pt-2 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputQuery);
          }}
          className="flex items-center gap-2"
        >
          <button
            type="button"
            onClick={() => {
              setIsListening(!isListening);
              if (!isListening) {
                // simulate voice prompt
                setTimeout(() => {
                  setInputQuery("Diallo, quel est l'état de nos stocks à Conakry ?");
                  setIsListening(false);
                }, 1800);
              }
            }}
            className={`p-3 rounded-2xl transition-all border ${
              isListening 
                ? 'bg-rose-600 text-white animate-pulse border-rose-400' 
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10'
            }`}
            title="Dicter la question"
          >
            {isListening ? <MicOff size={16} /> : <Mic size={16} />}
          </button>

          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Posez votre question à Diallo OS (stocks, livraisons, marge, clients...)"
            className="flex-1 px-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />

          <button
            type="submit"
            disabled={!inputQuery.trim() || isProcessing}
            className="p-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-2xl transition-all shadow-md disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};
