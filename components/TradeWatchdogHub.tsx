import React, { useState } from 'react';
import {
  Bell,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Building2,
  Globe,
  Sliders,
  DollarSign,
  Briefcase,
  Bot,
  Layers,
  Filter,
  Check,
  PlusCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import { 
  AutonomousWatchdogAlert 
} from '../types';
import { 
  MOCK_WATCHDOG_ALERTS 
} from '../constants';

interface TradeWatchdogHubProps {
  onOpenExpertChat?: (expertId?: string, initialPrompt?: string) => void;
  onOpenDealManager?: (dealId?: string) => void;
  onOpenSalonSector?: (sectorName: string) => void;
}

export const TradeWatchdogHub: React.FC<TradeWatchdogHubProps> = ({
  onOpenExpertChat,
  onOpenDealManager,
  onOpenSalonSector
}) => {
  const [alertsList, setAlertsList] = useState<AutonomousWatchdogAlert[]>(MOCK_WATCHDOG_ALERTS);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [actionDoneMessage, setActionDoneMessage] = useState<string | null>(null);

  const filteredAlerts = alertsList.filter(a => {
    if (selectedFilter === 'all') return true;
    return a.type === selectedFilter;
  });

  const handleExecuteRecommendation = (alert: AutonomousWatchdogAlert) => {
    setActionDoneMessage(`Action exécutée pour l'alerte "${alert.title}" : Dossier commercial préparé avec Diallo OS !`);
    setTimeout(() => setActionDoneMessage(null), 5000);
  };

  const handleMarkAsRead = (alertId: string) => {
    setAlertsList(alertsList.map(a => a.id === alertId ? { ...a, isRead: true } : a));
  };

  return (
    <div className="space-y-6">
      {/* 🌟 Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Bell size={14} />
                Agent Commercial Autonome & Veille
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Veille Économique Stratégique & Alertes Marchés
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Surveillance continue des cours, nouvelles opportunités d'appels d'offres, évolution réglementaire douanière et détection de partenaires.
            </p>
          </div>

          <button
            onClick={() => onOpenExpertChat && onOpenExpertChat('agent-trade-consultant', 'Je souhaite configurer des alertes de veille sur mesure pour mon secteur.')}
            className="px-4 py-2.5 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold text-xs border border-amber-500/20 flex items-center gap-1.5 transition-all"
          >
            <Bot size={15} />
            Configurer l'Agent de Veille
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800">
          <button
            onClick={() => setSelectedFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Toutes les Alertes ({alertsList.length})
          </button>
          <button
            onClick={() => setSelectedFilter('price_drop')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'price_drop'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Opportunités de Prix
          </button>
          <button
            onClick={() => setSelectedFilter('tender_published')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'tender_published'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Nouveaux Appels d'Offres
          </button>
          <button
            onClick={() => setSelectedFilter('regulation_change')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'regulation_change'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Évolutions Réglementaires
          </button>
          <button
            onClick={() => setSelectedFilter('new_verified_supplier')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedFilter === 'new_verified_supplier'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            Nouveaux Fournisseurs
          </button>
        </div>
      </div>

      {actionDoneMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
          <span>{actionDoneMessage}</span>
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-4">
        {filteredAlerts.map(alert => (
          <div
            key={alert.id}
            className={`p-6 rounded-3xl border transition-all ${
              alert.priority === 'urgent'
                ? 'bg-slate-900 border-rose-500/40 shadow-lg'
                : alert.priority === 'high'
                ? 'bg-slate-900 border-amber-500/30 shadow-md'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  alert.priority === 'urgent' ? 'bg-rose-500/20 text-rose-300' :
                  alert.priority === 'high' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-blue-500/20 text-blue-300'
                }`}>
                  {alert.priority}
                </span>

                <span className="text-xs font-bold text-indigo-400">{alert.sector}</span>
                <span className="text-slate-600">•</span>
                <span className="text-xs text-slate-400">{alert.countryCorridor}</span>
              </div>

              <span className="text-[11px] text-slate-400">{alert.timestamp}</span>
            </div>

            <div className="py-3 space-y-2">
              <h3 className="text-base font-bold text-white">{alert.title}</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{alert.message}</p>
            </div>

            {/* AI Recommendation Box */}
            <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} />
                  Recommandation Diallo OS (Action Non-Contraignante) :
                </span>
                <p className="text-xs font-semibold text-white">{alert.recommendedAction}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleExecuteRecommendation(alert)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  <ArrowRight size={13} />
                  Appliquer la Recommandation
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
