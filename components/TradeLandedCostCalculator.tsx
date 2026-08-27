import React, { useState, useEffect } from 'react';
import { 
  Calculator, 
  DollarSign, 
  TrendingUp, 
  Truck, 
  ShieldCheck, 
  FileSpreadsheet, 
  HelpCircle, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  RotateCcw,
  ArrowRight,
  Landmark,
  PackageCheck
} from 'lucide-react';
import { CommercialDossier } from '../types';

interface TradeLandedCostCalculatorProps {
  dossier: CommercialDossier;
  onUpdateBreakdown?: (updatedBreakdown: CommercialDossier['landedCostBreakdown'], updatedMargin: CommercialDossier['marginSimulation']) => void;
  isStandalone?: boolean;
}

export const TradeLandedCostCalculator: React.FC<TradeLandedCostCalculatorProps> = ({
  dossier,
  onUpdateBreakdown,
  isStandalone = false
}) => {
  // Local state for all line items
  const [productCost, setProductCost] = useState<number>(dossier.landedCostBreakdown?.productCost?.amount || dossier.totalAmount || 3500);
  const [productCostState, setProductCostState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.productCost?.state || 'confirmed');

  const [packagingCost, setPackagingCost] = useState<number>(dossier.landedCostBreakdown?.packagingCost?.amount || 0);
  const [packagingCostState, setPackagingCostState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.packagingCost?.state || 'confirmed');

  const [freightCost, setFreightCost] = useState<number>(dossier.landedCostBreakdown?.transportFreightCost?.amount || 620);
  const [freightCostState, setFreightCostState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.transportFreightCost?.state || 'confirmed');

  const [insuranceCost, setInsuranceCost] = useState<number>(dossier.landedCostBreakdown?.insuranceCost?.amount || 85);
  const [insuranceCostState, setInsuranceCostState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.insuranceCost?.state || 'confirmed');

  const [forwarderFee, setForwarderFee] = useState<number>(dossier.landedCostBreakdown?.forwarderFee?.amount || 250);
  const [forwarderFeeState, setForwarderFeeState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.forwarderFee?.state || 'estimated');

  const [customsDuty, setCustomsDuty] = useState<number>(dossier.landedCostBreakdown?.customsDutyCost?.amount || 480);
  const [customsDutyState, setCustomsDutyState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.customsDutyCost?.state || 'estimated');

  const [localTaxes, setLocalTaxes] = useState<number>(dossier.landedCostBreakdown?.localTaxesCost?.amount || 290);
  const [localTaxesState, setLocalTaxesState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.localTaxesCost?.state || 'estimated');

  const [warehousingCost, setWarehousingCost] = useState<number>(dossier.landedCostBreakdown?.warehousingCost?.amount || 120);
  const [warehousingCostState, setWarehousingCostState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.warehousingCost?.state || 'estimated');

  const [deliveryCost, setDeliveryCost] = useState<number>(dossier.landedCostBreakdown?.localDeliveryCost?.amount || 95);
  const [deliveryCostState, setDeliveryCostState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.localDeliveryCost?.state || 'estimated');

  const [miscCost, setMiscCost] = useState<number>(dossier.landedCostBreakdown?.miscFees?.amount || 50);
  const [miscCostState, setMiscCostState] = useState<'confirmed' | 'estimated' | 'unknown'>(dossier.landedCostBreakdown?.miscFees?.state || 'estimated');

  // Resale Margin State
  const [exchangeRate, setExchangeRate] = useState<number>(dossier.exchangeRateUsed || 9450);
  const [resalePricePerUnit, setResalePricePerUnit] = useState<number>(dossier.marginSimulation?.resalePricePerUnit || 12500);
  const [resaleCurrency, setResaleCurrency] = useState<string>(dossier.buyerCurrency || 'GNF');

  // Calculations
  const totalLandedCost = 
    productCost + packagingCost + freightCost + insuranceCost + 
    forwarderFee + customsDuty + localTaxes + warehousingCost + 
    deliveryCost + miscCost;

  const costPerUnit = dossier.quantity > 0 ? totalLandedCost / dossier.quantity : 0;
  const costPerUnitInLocalCurrency = costPerUnit * exchangeRate;

  const totalRevenueInLocalCurrency = resalePricePerUnit * dossier.quantity;
  const totalLandedCostInLocalCurrency = totalLandedCost * exchangeRate;
  const grossMarginAmount = totalRevenueInLocalCurrency - totalLandedCostInLocalCurrency;
  const grossMarginPercentage = totalRevenueInLocalCurrency > 0 
    ? (grossMarginAmount / totalRevenueInLocalCurrency) * 100 
    : 0;

  const breakEvenUnits = resalePricePerUnit > 0 
    ? Math.ceil(totalLandedCostInLocalCurrency / resalePricePerUnit) 
    : 0;

  const handleSaveToDossier = () => {
    if (onUpdateBreakdown) {
      onUpdateBreakdown(
        {
          productCost: { amount: productCost, state: productCostState },
          packagingCost: { amount: packagingCost, state: packagingCostState },
          transportFreightCost: { amount: freightCost, state: freightCostState },
          insuranceCost: { amount: insuranceCost, state: insuranceCostState },
          forwarderFee: { amount: forwarderFee, state: forwarderFeeState },
          customsDutyCost: { amount: customsDuty, state: customsDutyState },
          localTaxesCost: { amount: localTaxes, state: localTaxesState },
          warehousingCost: { amount: warehousingCost, state: warehousingCostState },
          localDeliveryCost: { amount: deliveryCost, state: deliveryCostState },
          miscFees: { amount: miscCost, state: miscCostState },
          totalLandedCost,
          currency: dossier.currency
        },
        {
          resalePricePerUnit,
          resaleCurrency,
          projectedGrossRevenue: totalRevenueInLocalCurrency,
          grossMarginAmount,
          grossMarginPercentage,
          breakEvenUnits
        }
      );
    }
  };

  const getBadgeForState = (state: 'confirmed' | 'estimated' | 'unknown') => {
    switch (state) {
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Confirmé</span>;
      case 'estimated':
        return <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold">Estimé</span>;
      case 'unknown':
        return <span className="px-2 py-0.5 rounded-md bg-slate-500/20 text-slate-400 text-[10px] font-bold">Inconnu</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 rounded-3xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
              <Calculator size={20} />
            </div>
            <h3 className="text-lg font-bold text-white">Calculateur de Coût de Revient Rendu (Landed Cost)</h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Visualisez chaque composante de coût de l'usine jusqu'à votre entrepôt pour éviter toute mauvaise surprise.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-slate-950/90 rounded-2xl border border-white/10 text-right">
            <span className="text-[10px] text-slate-400 block uppercase">Coût Rendu Global</span>
            <span className="text-lg font-bold text-emerald-400 font-mono">
              {totalLandedCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {dossier.currency}
            </span>
          </div>
          {onUpdateBreakdown && (
            <button
              onClick={handleSaveToDossier}
              className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl shadow-md transition-colors"
            >
              Enregistrer au Dossier
            </button>
          )}
        </div>
      </div>

      {/* Grid: Breakdown vs Margin Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Breakdown (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/90 border border-white/10 rounded-3xl p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <FileSpreadsheet size={16} className="text-brand-400" />
              <span>Décomposition des Postes de Coût</span>
            </span>
            <span className="text-[11px] text-slate-400">
              {dossier.quantity.toLocaleString()} {dossier.unit} • Incoterm : <strong className="text-brand-300">{dossier.agreedIncoterm}</strong>
            </span>
          </div>

          <div className="space-y-3">
            
            {/* 1. Product factory price */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">1. Prix Produit Usine (FOB / EXW)</span>
                  {getBadgeForState(productCostState)}
                </div>
                <span className="text-[10px] text-slate-400">Valeur brute négociée des marchandises</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={productCost}
                  onChange={(e) => setProductCost(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

            {/* 2. Packaging */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">2. Conditionnement & Emballage Export</span>
                  {getBadgeForState(packagingCostState)}
                </div>
                <span className="text-[10px] text-slate-400">Palettes NIMP 15, cartons renforcés, filmage</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={packagingCost}
                  onChange={(e) => setPackagingCost(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

            {/* 3. Transport Freight */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">3. Fret Maritime / Aérien International</span>
                  {getBadgeForState(freightCostState)}
                </div>
                <span className="text-[10px] text-slate-400">Transport principal du port d'origine au port d'arrivée</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={freightCost}
                  onChange={(e) => setFreightCost(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

            {/* 4. Insurance */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">4. Assurance Transport Maritime (ICC A)</span>
                  {getBadgeForState(insuranceCostState)}
                </div>
                <span className="text-[10px] text-slate-400">Couverture tous risques perte & avarie</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={insuranceCost}
                  onChange={(e) => setInsuranceCost(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

            {/* 5. Forwarder & Port Handling */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">5. Transitaire & Manutention Portuaire (THC)</span>
                  {getBadgeForState(forwarderFeeState)}
                </div>
                <span className="text-[10px] text-slate-400">Frais de dossier, acconage et passage quai</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={forwarderFee}
                  onChange={(e) => setForwarderFee(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

            {/* 6. Customs Duty */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">6. Droits de Douane (Tarif Extérieur Commun)</span>
                  {getBadgeForState(customsDutyState)}
                </div>
                <span className="text-[10px] text-slate-400">Droit de douane basé sur le code SH / TEC</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={customsDuty}
                  onChange={(e) => setCustomsDuty(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

            {/* 7. Local Taxes */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">7. Taxes Locales & Prélèvements (TVA/RTL)</span>
                  {getBadgeForState(localTaxesState)}
                </div>
                <span className="text-[10px] text-slate-400">TVA à l'importation récupérable ou redevance</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={localTaxes}
                  onChange={(e) => setLocalTaxes(parseFloat(e.target.value) || 0)}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

            {/* 8. Warehousing & Last mile delivery */}
            <div className="p-3 bg-slate-950/60 rounded-xl border border-white/5 flex items-center justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-white">8. Magasinage, Stockage & Livraison Finale</span>
                  {getBadgeForState(deliveryCostState)}
                </div>
                <span className="text-[10px] text-slate-400">Transport camion jusqu'au magasin de destination</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={warehousingCost + deliveryCost + miscCost}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setWarehousingCost(Math.round(val * 0.4));
                    setDeliveryCost(Math.round(val * 0.5));
                    setMiscCost(Math.round(val * 0.1));
                  }}
                  className="w-28 bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1 text-xs text-right font-mono font-bold text-white focus:border-brand-500 outline-none"
                />
                <span className="text-xs text-slate-400 w-8">{dossier.currency}</span>
              </div>
            </div>

          </div>

          {/* Unit Cost Recap */}
          <div className="p-4 bg-gradient-to-r from-indigo-950/60 to-brand-950/60 rounded-2xl border border-indigo-500/30 flex items-center justify-between">
            <div>
              <span className="text-xs text-indigo-300 font-bold block">Coût de Revient Unitaire Rendu Entrepôt</span>
              <span className="text-[11px] text-slate-400">Tous frais, droits de douane et fret inclus</span>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-white font-mono">
                {costPerUnit.toFixed(3)} {dossier.currency} / {dossier.unit}
              </div>
              <div className="text-xs font-bold text-emerald-400 font-mono">
                ≈ {Math.round(costPerUnitInLocalCurrency).toLocaleString()} {resaleCurrency}
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Margin & Reseller Simulation (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-white/10">
              <TrendingUp size={18} className="text-emerald-400" />
              <h4 className="text-sm font-bold text-white">Simulateur de Marge Revendeur</h4>
            </div>

            {/* Inputs for Resale */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Taux de Change (1 {dossier.currency} = X {resaleCurrency})
                </label>
                <input
                  type="number"
                  value={exchangeRate}
                  onChange={(e) => setExchangeRate(parseFloat(e.target.value) || 1)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-brand-500 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">
                  Prix de Revente Unitaire Conseillé ({resaleCurrency})
                </label>
                <input
                  type="number"
                  value={resalePricePerUnit}
                  onChange={(e) => setResalePricePerUnit(parseFloat(e.target.value) || 0)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-sm text-emerald-400 font-bold font-mono focus:border-brand-500 outline-none"
                />
              </div>
            </div>

            {/* Output Cards */}
            <div className="space-y-3 pt-2">
              
              <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/5 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Chiffre d'Affaires Brut Projeté</span>
                  <span className="text-white font-bold font-mono">
                    {totalRevenueInLocalCurrency.toLocaleString()} {resaleCurrency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Coût d'Acquisition Total Rendu</span>
                  <span className="text-rose-300 font-mono">
                    - {Math.round(totalLandedCostInLocalCurrency).toLocaleString()} {resaleCurrency}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 uppercase">Marge Brute Projetée</span>
                  <span className="text-base font-extrabold text-emerald-300 font-mono">
                    +{grossMarginPercentage.toFixed(1)}%
                  </span>
                </div>
                <div className="text-xl font-bold text-white font-mono">
                  {Math.round(grossMarginAmount).toLocaleString()} {resaleCurrency}
                </div>
                <p className="text-[10px] text-emerald-400/80">
                  Gain net prévisionnel après déduction intégrale des douanes et du fret.
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">Point Mort (Seuil de Rentabilité)</span>
                  <span className="text-[10px] text-slate-400">Unités à vendre pour couvrir 100% des frais</span>
                </div>
                <span className="text-sm font-bold text-indigo-400 font-mono">
                  {breakEvenUnits.toLocaleString()} / {dossier.quantity.toLocaleString()} {dossier.unit}
                </span>
              </div>

            </div>
          </div>

          {/* Expert Advice Note */}
          <div className="p-4 bg-slate-900/60 border border-white/5 rounded-3xl flex items-start gap-3 text-xs text-slate-300">
            <Info size={18} className="text-brand-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-white block mb-0.5">Conseil Logistique de Diallo OS</span>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Le groupage maritime (LCL) peut comporter des frais de dégroupage à l'arrivée. Optez pour un conteneur 20 pieds complet (FCL) dès 15 m³ pour réduire votre coût de revient de 18%.
              </p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
