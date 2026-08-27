import React from 'react';
import { Sparkles, TrendingUp, AlertTriangle, Package, ShoppingCart, Users, Truck, Clock, ArrowRight, CheckCircle2, ShieldCheck, DollarSign } from 'lucide-react';
import { StockItem, BusinessOrder, CrmLeadClient, CrmFollowUp } from '../../types';

interface BusinessBriefingProps {
  orders: BusinessOrder[];
  stockItems: StockItem[];
  clients: CrmLeadClient[];
  followUps: CrmFollowUp[];
  onNavigateToTab: (tabId: string) => void;
  onExecutePriorityAction: (actionType: string, payload?: any) => void;
}

export const BusinessBriefingAndMetrics: React.FC<BusinessBriefingProps> = ({
  orders,
  stockItems,
  clients,
  followUps,
  onNavigateToTab,
  onExecutePriorityAction
}) => {
  // Compute real dynamic counts
  const newOrdersCount = orders.filter(o => o.stage === 'nouvelle' || o.stage === 'validee').length;
  const toPrepareCount = orders.filter(o => o.stage === 'preparation').length;
  const pendingEscrowPaymentsCount = orders.filter(o => o.paymentStatus === 'sequestre_bloque').length;
  const lowStockItems = stockItems.filter(s => s.availableQuantity <= s.alertThreshold || s.forecastDaysUntilStockout <= 14);
  const urgentFollowUps = followUps.filter(f => f.priority === 'haute' && f.status === 'a_faire');

  const totalRevenue = orders.reduce((acc, o) => acc + (o.currency === 'USD' ? o.totalAmount * 0.92 : o.totalAmount), 0);
  const totalStockUnits = stockItems.reduce((acc, s) => acc + s.physicalQuantity, 0);

  return (
    <div className="space-y-6">
      {/* DIALLO OS BUSINESS BRIEFING HERO */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/70 to-slate-900 border border-indigo-500/30 p-6 sm:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
                <Sparkles size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30">
                    Diallo OS • Briefing Exécutif
                  </span>
                  <span className="text-xs text-slate-400">Temps Réel Mondial</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                  Bonjour Amadou. Voici votre activité aujourd'hui.
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onNavigateToTab('voice_copilot')}
                className="px-4 py-2 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-400/40 text-indigo-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
              >
                <span>🎙️ Parler à mon Business</span>
              </button>
            </div>
          </div>

          <p className="text-sm text-slate-300 max-w-4xl leading-relaxed">
            Votre hub commercial mondial est synchronisé sur <strong>5 entrepôts</strong> et <strong>4 pays clés</strong>. 
            Aucun incident critique n'est signalé sur vos paiements sous séquestre. Voici les priorités opérationnelles nécessitant votre validation.
          </p>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <ShoppingCart size={13} className="text-indigo-400" /> Commandes
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-white">{orders.length}</span>
                <span className="text-[10px] text-emerald-400 font-bold">+{newOrdersCount} nouv.</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Package size={13} className="text-amber-400" /> À Préparer
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-amber-300">{toPrepareCount}</span>
                <span className="text-[10px] text-slate-400">Pick/Pack</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-400" /> Séquestre Garanti
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-emerald-300">{pendingEscrowPaymentsCount}</span>
                <span className="text-[10px] text-emerald-400 font-semibold">100% sécurisé</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <AlertTriangle size={13} className="text-rose-400" /> Alerte Stock
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-rose-300">{lowStockItems.length}</span>
                <span className="text-[10px] text-rose-400 font-semibold">&lt; 14 jours</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <Users size={13} className="text-cyan-400" /> Relances CRM
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-cyan-300">{urgentFollowUps.length}</span>
                <span className="text-[10px] text-cyan-400 font-semibold">Haute priorité</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-white/10 flex flex-col justify-between">
              <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
                <DollarSign size={13} className="text-emerald-400" /> CA Engagé
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-bold text-white font-mono">{(totalRevenue / 1000).toFixed(0)}k€</span>
                <span className="text-[10px] text-emerald-400 font-semibold">+28% M/M</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ACTIONS PRIORITAIRES CARDS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-ping" />
            <span>Actions Prioritaires du Jour</span>
          </h3>
          <span className="text-xs text-slate-400">Recommandations calculées par Diallo OS</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Action 1: Stock restock */}
          <div className="p-4 bg-slate-900/90 border border-rose-500/30 rounded-2xl flex flex-col justify-between space-y-3 hover:border-rose-500/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold uppercase">
                  Rupture Imminente (9j)
                </span>
                <span className="text-[11px] text-slate-400">SKU: NRG-SOL-PUMP-5K</span>
              </div>
              <h4 className="text-sm font-bold text-white">Pompes Solaires 5.5kW : Stock Restant 24 U.</h4>
              <p className="text-xs text-slate-300">
                La demande actuelle (+4 vendues ce matin) entraînera une rupture sous 9 jours. Validez le réapprovisionnement de 50 unités auprès de Helios Tech.
              </p>
            </div>
            <button
              onClick={() => onExecutePriorityAction('reorder_solar_pumps')}
              className="w-full py-2 bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/30"
            >
              <span>Préparer Commande Fournisseur (50 U.)</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Action 2: Preparation Pick/Pack */}
          <div className="p-4 bg-slate-900/90 border border-amber-500/30 rounded-2xl flex flex-col justify-between space-y-3 hover:border-amber-500/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase">
                  À Préparer • 12 800 EUR
                </span>
                <span className="text-[11px] text-slate-400">CMD-2026-1049</span>
              </div>
              <h4 className="text-sm font-bold text-white">Consortium Minière SMB-Boké (4 Pompes)</h4>
              <p className="text-xs text-slate-300">
                Fonds sous séquestre validés. Le bon de prélèvement est prêt pour l'allée B-14 du port de Conakry. Date limite expédition : aujourd'hui 18h.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="w-full py-2 bg-gradient-to-r from-amber-600 to-brand-600 hover:from-amber-500 hover:to-brand-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-amber-900/30"
            >
              <span>Ouvrir Fiche Pick & Pack</span>
              <ArrowRight size={13} />
            </button>
          </div>

          {/* Action 3: CRM Follow-up */}
          <div className="p-4 bg-slate-900/90 border border-cyan-500/30 rounded-2xl flex flex-col justify-between space-y-3 hover:border-cyan-500/60 transition-all">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 text-[10px] font-bold uppercase">
                  Devis Expire Demain
                </span>
                <span className="text-[11px] text-slate-400">DEV-2026-087</span>
              </div>
              <h4 className="text-sm font-bold text-white">Épiceries Fines France (18 500 EUR)</h4>
              <p className="text-xs text-slate-300">
                Mme Leroy n'a pas encore validé le tarif de gros Fonio Bio. Un message d'accompagnement poli a été généré par l'Agent Commercial IA.
              </p>
            </div>
            <button
              onClick={() => onNavigateToTab('crm')}
              className="w-full py-2 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-cyan-900/30"
            >
              <span>Vérifier & Envoyer Relance IA</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
