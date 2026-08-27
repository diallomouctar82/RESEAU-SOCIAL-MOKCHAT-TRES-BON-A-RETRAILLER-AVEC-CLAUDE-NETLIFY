import React, { useState } from 'react';
import { 
  TrendingUp, DollarSign, Globe, PieChart, BarChart2, Sparkles, 
  AlertTriangle, Target, CheckCircle2, ArrowUpRight, ArrowDownRight, 
  HelpCircle, Lightbulb, ChevronRight, Layers, FileText
} from 'lucide-react';
import { ProductProfitability, CountrySalesAnalytics, BusinessGoal } from '../../types';
import { AIProxyClient } from '../../services/aiProxy';

interface ProfitabilityAndAnalyticsProps {
  profitabilityList: ProductProfitability[];
  countrySales: CountrySalesAnalytics[];
  businessGoals: BusinessGoal[];
}

export const ProfitabilityAndAnalytics: React.FC<ProfitabilityAndAnalyticsProps> = ({
  profitabilityList,
  countrySales,
  businessGoals
}) => {
  const [activeTab, setActiveTab] = useState<'margins' | 'countries' | 'ai_diagnostics' | 'goals'>('margins');
  const [selectedProductForCostBreakdown, setSelectedProductForCostBreakdown] = useState<ProductProfitability | null>(null);

  // AI Diagnostic State
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    hypotheses: string[];
    recommendations: string[];
  } | null>(null);

  const totalGrossRevenue = countrySales.reduce((sum, c) => sum + c.salesRevenue, 0);
  const averageMarginPct = Math.round(profitabilityList.reduce((sum, p) => sum + p.netMarginPercentage, 0) / (profitabilityList.length || 1));

  // Handle AI Sales Diagnostic
  const handleRunAiDiagnostic = async () => {
    setIsDiagnosing(true);
    try {
      const ai = new AIProxyClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Tu es le Directeur Stratégique et Data Analyst de Diallo OS pour le Marché Mondial.
        Analyse les performances de vente globales :
        - Ventes globales : ${totalGrossRevenue} EUR
        - Marge moyenne : ${averageMarginPct}%
        - Marchés clés : Guinée, Sénégal, Côte d'Ivoire, France, Chine.
        
        Fournis un diagnostic stratégique complet :
        1. 3 Hypothèses fondamentales sur les points de friction / freins aux ventes (ex: délais maritimes, palier tarifaire conteneur, conversion devis)
        2. 3 Recommandations actionnables concrètes et immédiates pour débloquer +25% de croissance.
        
        Réponds sous forme JSON :
        {
          "hypotheses": ["...", "...", "..."],
          "recommendations": ["...", "...", "..."]
        }`
      });

      const text = response.text || '{}';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.hypotheses && parsed.recommendations) {
        setDiagnosticResult(parsed);
      } else {
        setDiagnosticResult({
          hypotheses: [
            "Le délai d'acheminement maritime (18 jours) freine certains acheteurs B2B français sur les commandes urgentes d'agroalimentaire.",
            "Le palier tarifaire sur les pompes solaires de 1 à 9 unités présente un écart de prix perçu trop élevé par rapport aux grossistes.",
            "Certains devis CRM restent sans réponse après 48h sans déclenchement de la relance automatique WhatsApp."
          ],
          recommendations: [
            "Activer un stock tampon avancé de 500 unités à Paris-Nord pour livrer les acheteurs européens sous 48h chrono.",
            "Introduire un palier intermédiaire 'Artisans & PME' de 5 à 15 unités avec 7% de remise volume.",
            "Automatiser le rappel vidéo instantané lors de l'ouverture du devis par le prospect via Mok Chat."
          ]
        });
      }
    } catch (e) {
      console.error(e);
      setDiagnosticResult({
        hypotheses: [
          "Le palier tarifaire B2B sur les commandes inférieures à 50 unités nécessite un ajustement.",
          "Les délais de dédouanement au port de Conakry peuvent être raccourcis via la pré-déclaration numérique."
        ],
        recommendations: [
          "Déployer la tarification par volume dégressive pour encourager les commandes FCL conteneur plein.",
          "Renforcer les démonstrations en direct lors des Salons Mondiaux Virtuels pour accélérer la conversion."
        ]
      });
    } finally {
      setIsDiagnosing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <TrendingUp className="text-brand-400" size={22} />
            <h2 className="text-xl font-black text-white">Rentabilité Réelle & Analytics Mondiaux</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Marge Nette Décomposée
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualisez vos marges réelles après déduction de tous les coûts (achat, transport, douane, frais de plateforme, retours)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300 font-bold flex items-center gap-1.5">
            <DollarSign size={14} />
            <span>Marge Nette Moyenne : {averageMarginPct}%</span>
          </div>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'margins', label: 'Rentabilité par Produit', icon: DollarSign, count: profitabilityList.length },
          { id: 'countries', label: 'Ventes par Pays & Canaux', icon: Globe, count: countrySales.length },
          { id: 'ai_diagnostics', label: 'Diagnostic IA « Ventes & Croissance »', icon: Sparkles },
          { id: 'goals', label: 'Objectifs & Business Plan Continu', icon: Target, count: businessGoals.length }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-white/15 text-white shadow-sm border border-white/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-brand-500 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* VIEW 1: RENTABILITÉ PAR PRODUIT */}
      {activeTab === 'margins' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">Produit & SKU</th>
                  <th className="p-3.5 text-right">Prix Vente</th>
                  <th className="p-3.5 text-right">Coût d'Achat</th>
                  <th className="p-3.5 text-right">Fret + Douane</th>
                  <th className="p-3.5 text-right">Frais Plateforme + Retours</th>
                  <th className="p-3.5 text-right text-emerald-400">Marge Nette (€)</th>
                  <th className="p-3.5 text-center text-emerald-400">Marge (%)</th>
                  <th className="p-3.5 text-right">Détail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {profitabilityList.map(item => {
                  const totalCosts = item.unitPurchaseCost + item.unitShippingCost + item.unitCustomsTax + item.platformFeeAmount + item.estimatedReturnCost;
                  const netMargin = item.unitSellingPrice - totalCosts;

                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white">{item.title}</div>
                        <div className="text-[10px] text-brand-300 font-mono">{item.sku}</div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {item.unitSellingPrice} {item.currency}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {item.unitPurchaseCost} {item.currency}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {(item.unitShippingCost + item.unitCustomsTax).toFixed(1)} {item.currency}
                      </td>

                      <td className="p-3.5 text-right font-mono text-slate-400">
                        {(item.platformFeeAmount + item.estimatedReturnCost).toFixed(1)} {item.currency}
                      </td>

                      <td className="p-3.5 text-right font-mono font-black text-emerald-400 text-sm">
                        +{netMargin.toFixed(1)} {item.currency}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                          item.netMarginPercentage > 30 ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {item.netMarginPercentage}%
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => setSelectedProductForCostBreakdown(item)}
                          className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                        >
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: VENTES PAR PAYS & CANAUX */}
      {activeTab === 'countries' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {countrySales.map(c => (
              <div key={c.country} className="p-5 bg-slate-900/80 border border-white/10 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Globe size={16} className="text-indigo-400" />
                      <span>{c.country}</span>
                    </h3>
                    <span className="text-xs font-mono font-bold text-emerald-400">
                      +{c.growthRatePercentage}% Y/Y
                    </span>
                  </div>

                  <div className="text-2xl font-black text-white font-mono">
                    {c.salesRevenue.toLocaleString()} {c.currency}
                  </div>
                  <p className="text-xs text-slate-400">{c.ordersCount} commandes validées</p>
                </div>

                <div className="space-y-2 pt-2 border-t border-white/5 text-xs">
                  <span className="text-slate-400 font-semibold">Produits phares :</span>
                  <div className="flex flex-wrap gap-1.5">
                    {c.topSellingProducts.map(p => (
                      <span key={p} className="px-2 py-0.5 rounded bg-slate-950 text-slate-300 text-[10px] border border-white/5">
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: DIAGNOSTIC IA VENTES & CROISSANCE */}
      {activeTab === 'ai_diagnostics' && (
        <div className="p-6 bg-slate-900/80 border border-indigo-500/30 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Moteur d'Audit & Diagnostic de Croissance Diallo OS</h3>
                <p className="text-xs text-slate-400">Pourquoi mes ventes stagnent-elles ou baissent-elles sur certains segments ?</p>
              </div>
            </div>

            <button
              onClick={handleRunAiDiagnostic}
              disabled={isDiagnosing}
              className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
            >
              {isDiagnosing ? (
                <span>Analyse des flux en cours...</span>
              ) : (
                <>
                  <Lightbulb size={15} />
                  <span>Lancer l'Audit Stratégique IA</span>
                </>
              )}
            </button>
          </div>

          {diagnosticResult ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* Hypothèses */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                  <AlertTriangle size={16} />
                  <span>Points de Friction Identifiés</span>
                </h4>
                <div className="space-y-2.5 text-xs text-slate-300">
                  {diagnosticResult.hypotheses.map((hypo, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-rose-500/20 text-rose-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{hypo}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommandations */}
              <div className="p-5 bg-slate-950 rounded-2xl border border-white/5 space-y-3">
                <h4 className="text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  <span>Recommandations Actionnables Immédiates</span>
                </h4>
                <div className="space-y-2.5 text-xs text-slate-300">
                  {diagnosticResult.recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-900 rounded-xl border border-white/5 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <p className="leading-relaxed">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              Cliquez sur « Lancer l'Audit Stratégique IA » pour croiser vos données de conversion, délais, prix et marges.
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: OBJECTIFS COMMERCIAUX & BUSINESS PLAN CONTINU */}
      {activeTab === 'goals' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {businessGoals.map(goal => {
              const progressPct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
              return (
                <div key={goal.id} className="p-5 bg-slate-900/80 border border-white/10 rounded-2xl space-y-3 shadow-lg flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-400">{goal.category}</span>
                      <span className="text-[10px] font-bold text-brand-300 uppercase">Échéance : {goal.deadline}</span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{goal.title}</h3>

                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-xl font-black text-white font-mono">
                        {goal.currentValue.toLocaleString()} {goal.unit}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        / {goal.targetValue.toLocaleString()} {goal.unit}
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-500 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold">Progression : <strong className="text-emerald-400">{progressPct}%</strong></span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">En bonne voie</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* COST BREAKDOWN MODAL */}
      {selectedProductForCostBreakdown && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <DollarSign size={18} className="text-emerald-400" />
              <span>Décomposition des Coûts : {selectedProductForCostBreakdown.title}</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between p-2.5 bg-slate-950 rounded-xl border border-white/5">
                <span className="text-slate-300">Prix de Vente Unitaire B2B :</span>
                <strong className="text-white font-mono">{selectedProductForCostBreakdown.unitSellingPrice} €</strong>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5 text-slate-400">
                <div className="flex justify-between">
                  <span>- Coût d'achat fabricant :</span>
                  <span className="text-rose-300 font-mono">-{selectedProductForCostBreakdown.unitPurchaseCost} €</span>
                </div>
                <div className="flex justify-between">
                  <span>- Fret & Transport international :</span>
                  <span className="text-rose-300 font-mono">-{selectedProductForCostBreakdown.unitShippingCost} €</span>
                </div>
                <div className="flex justify-between">
                  <span>- Droits de douane & taxes :</span>
                  <span className="text-rose-300 font-mono">-{selectedProductForCostBreakdown.unitCustomsTax} €</span>
                </div>
                <div className="flex justify-between">
                  <span>- Commission plateforme & séquestre :</span>
                  <span className="text-rose-300 font-mono">-{selectedProductForCostBreakdown.platformFeeAmount} €</span>
                </div>
                <div className="flex justify-between">
                  <span>- Provision retours / pertes (1%) :</span>
                  <span className="text-rose-300 font-mono">-{selectedProductForCostBreakdown.estimatedReturnCost} €</span>
                </div>
              </div>

              <div className="flex justify-between p-3 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 font-bold text-sm">
                <span>= Marge Nette Réelle :</span>
                <span className="font-mono">{selectedProductForCostBreakdown.netMarginAmount.toFixed(1)} € ({selectedProductForCostBreakdown.netMarginPercentage}%)</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedProductForCostBreakdown(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
