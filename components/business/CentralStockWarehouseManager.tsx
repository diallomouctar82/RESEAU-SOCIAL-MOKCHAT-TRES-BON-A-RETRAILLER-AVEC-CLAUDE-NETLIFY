import React, { useState } from 'react';
import { 
  Package, Warehouse as WarehouseIcon, Globe, ArrowRightLeft, AlertTriangle, 
  Plus, Search, RefreshCw, BarChart2, ShieldAlert, CheckCircle2, QrCode, 
  Sparkles, History, Filter, FileText, ChevronRight, Layers, Sliders
} from 'lucide-react';
import { StockItem, Warehouse, StockMovement, SupplierItem } from '../../types';
import { GoogleGenAI } from '@google/genai';

interface CentralStockWarehouseManagerProps {
  stockList: StockItem[];
  warehouses: Warehouse[];
  movements: StockMovement[];
  suppliers: SupplierItem[];
  onUpdateStock: (updatedItems: StockItem[]) => void;
  onAddStockMovement: (movement: StockMovement) => void;
  onPrepareReorder: (stockItem: StockItem) => void;
}

export const CentralStockWarehouseManager: React.FC<CentralStockWarehouseManagerProps> = ({
  stockList,
  warehouses,
  movements,
  suppliers,
  onUpdateStock,
  onAddStockMovement,
  onPrepareReorder
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'warehouses' | 'countries' | 'movements' | 'audit_counts'>('inventory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWarehouseFilter, setSelectedWarehouseFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedItemForDetail, setSelectedItemForDetail] = useState<StockItem | null>(null);

  // Quick Adjustment Modal State
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [adjustItem, setAdjustItem] = useState<StockItem | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<StockMovement['type']>('correction_inventaire');
  const [adjustNotes, setAdjustNotes] = useState('');

  // AI Product Addition Modal
  const [isAiAddModalOpen, setIsAiAddModalOpen] = useState(false);
  const [aiAddInput, setAiAddInput] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // Filtered Stock Items
  const filteredStock = stockList.filter(item => {
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategoryFilter === 'all' || item.category === selectedCategoryFilter;
    const matchWarehouse = selectedWarehouseFilter === 'all' || 
      item.warehouseQuantities.some(w => w.warehouseId === selectedWarehouseFilter && w.quantity > 0);
    return matchSearch && matchCategory && matchWarehouse;
  });

  // Calculate country aggregations
  const countryStockBreakdown: { [country: string]: { units: number; itemsCount: number; warehouses: string[] } } = {};
  stockList.forEach(item => {
    item.warehouseQuantities.forEach(wq => {
      if (!countryStockBreakdown[wq.country]) {
        countryStockBreakdown[wq.country] = { units: 0, itemsCount: 0, warehouses: [] };
      }
      countryStockBreakdown[wq.country].units += wq.quantity;
      if (!countryStockBreakdown[wq.country].warehouses.includes(wq.warehouseName)) {
        countryStockBreakdown[wq.country].warehouses.push(wq.warehouseName);
      }
    });
  });

  // Handle stock adjustment submit
  const handleSaveAdjustment = () => {
    if (!adjustItem || adjustQty === 0) return;
    const isIncrement = adjustQty > 0;
    const newPhysical = Math.max(0, adjustItem.physicalQuantity + adjustQty);
    const newAvailable = Math.max(0, newPhysical - adjustItem.reservedQuantity);

    const updatedList = stockList.map(item => {
      if (item.id === adjustItem.id) {
        return {
          ...item,
          physicalQuantity: newPhysical,
          availableQuantity: newAvailable
        };
      }
      return item;
    });

    onUpdateStock(updatedList);

    // Create traceable movement record
    const newMovement: StockMovement = {
      id: `mv-${Date.now()}`,
      date: 'À l\'instant',
      productId: adjustItem.productId,
      productSku: adjustItem.sku,
      productTitle: adjustItem.title,
      type: adjustType,
      quantity: adjustQty,
      originLocation: isIncrement ? 'Ajustement Manuel / Comptage' : adjustItem.warehouseQuantities[0]?.warehouseName || 'Entrepôt',
      destinationLocation: isIncrement ? adjustItem.warehouseQuantities[0]?.warehouseName || 'Entrepôt' : 'Ajustement Dépréciation',
      referenceDoc: `AJUST-${Math.floor(Math.random() * 9000 + 1000)}`,
      performedBy: 'Amadou Diallo (Responsable Stocks)',
      notes: adjustNotes || 'Correction d\'inventaire validée sur le registre central.'
    };

    onAddStockMovement(newMovement);
    setIsAdjustModalOpen(false);
    setAdjustItem(null);
    setAdjustQty(0);
    setAdjustNotes('');
  };

  // AI Product Classifier / Builder
  const handleGenerateAiProduct = async () => {
    if (!aiAddInput.trim()) return;
    setIsAiProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Tu es le moteur de classification et de création de fiches produits pour la plateforme mondiale de commerce Diallo OS.
        L'utilisateur décrit un produit ou lot à ajouter : "${aiAddInput}".
        
        Génère une structure JSON valide avec :
        - title: Titre professionnel export
        - sku: Code SKU standardisé (ex: AGR-CAC-01, NRG-SOL-02)
        - category: Catégorie marchande appropriée
        - unitCost: Coût d'achat estimé (nombre)
        - sellingPrice: Prix de vente recommandé (nombre)
        - currency: "USD" ou "EUR"
        - initialQty: Quantité physique initiale (nombre)
        - alertThreshold: Seuil d'alerte conseillé (nombre)
        - packaging: Conditionnement (ex: Sacs jute 50kg, Cartons 10kg, Fût 200L)
        - leadTimeDays: Délai moyen de réappro fournisseur en jours
        - tierPrices: Tableau de 3 paliers de prix [{minQuantity: 1, maxQuantity: 49, unitPrice: ..., label: "Détail/Petits lots"}, {minQuantity: 50, maxQuantity: 499, unitPrice: ..., label: "Grossiste"}, {minQuantity: 500, unitPrice: ..., label: "Conteneur FCL"}]

        Réponds UNIQUEMENT avec l'objet JSON.`
      });

      const text = response.text || '{}';
      const cleanJson = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      if (parsed.title && parsed.sku) {
        const newStockItem: StockItem = {
          id: `stk-${Date.now()}`,
          productId: `prod-${Date.now()}`,
          sku: parsed.sku,
          title: parsed.title,
          category: parsed.category || 'Matières Premières & Agroalimentaire',
          imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
          variant: {
            packaging: parsed.packaging || 'Conditionnement standard'
          },
          physicalQuantity: parsed.initialQty || 500,
          reservedQuantity: 0,
          availableQuantity: parsed.initialQty || 500,
          inTransitQuantity: 0,
          damagedOrBlockedQuantity: 0,
          alertThreshold: parsed.alertThreshold || 100,
          unitCost: parsed.unitCost || 50,
          sellingPrice: parsed.sellingPrice || 80,
          currency: parsed.currency || 'USD',
          tierPricing: parsed.tierPrices || [
            { minQuantity: 1, maxQuantity: 49, unitPrice: parsed.sellingPrice || 80, currency: parsed.currency || 'USD', label: 'Petits lots' },
            { minQuantity: 50, unitPrice: (parsed.sellingPrice || 80) * 0.88, currency: parsed.currency || 'USD', label: 'Grossiste B2B' }
          ],
          warehouseQuantities: [
            { warehouseId: 'wh-conakry', warehouseName: 'Hub Portuaire Conakry', country: 'Guinée', quantity: parsed.initialQty || 500 }
          ],
          forecastDaysUntilStockout: 30,
          reorderQuantitySuggested: (parsed.initialQty || 500) * 2,
          supplierLeadTimeDays: parsed.leadTimeDays || 14,
          lastRestockedAt: 'Aujourd\'hui',
          qrCode: `QR-${parsed.sku}`
        };

        onUpdateStock([newStockItem, ...stockList]);
        
        onAddStockMovement({
          id: `mv-${Date.now()}`,
          date: 'À l\'instant',
          productId: newStockItem.productId,
          productSku: newStockItem.sku,
          productTitle: newStockItem.title,
          type: 'entree',
          quantity: newStockItem.physicalQuantity,
          originLocation: 'Création Catalogue Assistée IA',
          destinationLocation: 'Hub Portuaire Conakry',
          referenceDoc: `INIT-${newStockItem.sku}`,
          performedBy: 'Diallo OS AI Catalog Builder',
          notes: 'Fiche créée et qualifiée automatiquement par Diallo OS.'
        });

        setIsAiAddModalOpen(false);
        setAiAddInput('');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Package className="text-brand-400" size={22} />
            <h2 className="text-xl font-black text-white">Stock Central & Multi-Entrepôts</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Source Unique de Vérité
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gestion temps réel des stocks physiques, réservés et en transit avec synchronisation multicanale et réservation automatique
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsAiAddModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-brand-900/40"
          >
            <Sparkles size={14} />
            <span>Ajouter Produit par IA</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'inventory', label: 'Inventaire Global (SKU)', icon: Layers, count: stockList.length },
          { id: 'warehouses', label: 'Entrepôts & Hubs', icon: WarehouseIcon, count: warehouses.length },
          { id: 'countries', label: 'Vision Multi-Pays', icon: Globe, count: Object.keys(countryStockBreakdown).length },
          { id: 'movements', label: 'Mouvements & Traçabilité', icon: ArrowRightLeft, count: movements.length },
          { id: 'audit_counts', label: 'Inventaires Tournants & Écarts', icon: BarChart2 }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
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

      {/* VIEW 1: INVENTAIRE GLOBAL PAR SKU */}
      {activeSubTab === 'inventory' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Rechercher par SKU, titre, catégorie..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={selectedWarehouseFilter}
              onChange={(e) => setSelectedWarehouseFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Tous les entrepôts</option>
              {warehouses.map(w => (
                <option key={w.id} value={w.id}>{w.name} ({w.country})</option>
              ))}
            </select>

            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Toutes les catégories</option>
              <option value="Matières Premières & Agroalimentaire">Agroalimentaire & Matières Premières</option>
              <option value="Énergies Renouvelables & Machinisme">Énergies & Machinisme</option>
              <option value="Cosmétiques & Huiles Précieuses">Cosmétiques & Huiles</option>
            </select>
          </div>

          {/* Stock Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">Produit & SKU</th>
                  <th className="p-3.5 text-center">Physique</th>
                  <th className="p-3.5 text-center text-amber-400">Réservé</th>
                  <th className="p-3.5 text-center text-emerald-400">Disponible</th>
                  <th className="p-3.5 text-center text-indigo-400">En Transit</th>
                  <th className="p-3.5 text-center">Prévision Rupture</th>
                  <th className="p-3.5 text-right">Prix Unitaire</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredStock.map(item => {
                  const isLow = item.availableQuantity <= item.alertThreshold || item.forecastDaysUntilStockout <= 14;
                  return (
                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <img src={item.imageUrl} alt={item.title} className="w-10 h-10 rounded-xl object-cover border border-white/10" />
                          <div>
                            <div className="font-bold text-white flex items-center gap-1.5">
                              <span>{item.title}</span>
                              {isLow && (
                                <span className="px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 text-[9px] font-bold border border-rose-500/30">
                                  Seuil Alerte
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-brand-300 font-semibold">{item.sku}</span>
                              <span>•</span>
                              <span>{item.variant?.packaging || item.category}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5 text-center font-bold text-slate-200">
                        {item.physicalQuantity}
                      </td>

                      <td className="p-3.5 text-center font-bold text-amber-300">
                        {item.reservedQuantity}
                      </td>

                      <td className="p-3.5 text-center font-black text-emerald-400 text-sm">
                        {item.availableQuantity}
                      </td>

                      <td className="p-3.5 text-center font-semibold text-indigo-300">
                        +{item.inTransitQuantity}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            item.forecastDaysUntilStockout <= 10 
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            ~{item.forecastDaysUntilStockout} jours
                          </span>
                          <span className="text-[9px] text-slate-500 mt-0.5">Selon rythme actuel</span>
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-white">
                        {item.sellingPrice} {item.currency}
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setAdjustItem(item);
                              setAdjustQty(0);
                              setIsAdjustModalOpen(true);
                            }}
                            title="Ajuster le stock manuellement"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                          >
                            <Sliders size={13} />
                          </button>

                          <button
                            onClick={() => onPrepareReorder(item)}
                            title="Préparer réapprovisionnement"
                            className="px-2.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                          >
                            <RefreshCw size={11} />
                            <span>Réappro</span>
                          </button>

                          <button
                            onClick={() => setSelectedItemForDetail(item)}
                            title="Voir détail SKU & Fiche"
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs transition-colors"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: MULTI-ENTREPÔTS */}
      {activeSubTab === 'warehouses' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {warehouses.map(wh => {
            const occupancyPct = Math.round((wh.currentOccupiedUnits / wh.totalCapacityUnits) * 100);
            return (
              <div key={wh.id} className="p-5 bg-slate-900/80 border border-white/10 rounded-2xl space-y-4 hover:border-brand-500/40 transition-all shadow-lg flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-bold uppercase tracking-wider">
                      {wh.type}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{wh.country}</span>
                  </div>

                  <h3 className="text-base font-bold text-white">{wh.name}</h3>
                  <p className="text-xs text-slate-400">{wh.address}, {wh.city}</p>
                </div>

                <div className="space-y-3 pt-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Occupation</span>
                      <span className="font-bold">{wh.currentOccupiedUnits.toLocaleString()} / {wh.totalCapacityUnits.toLocaleString()} U. ({occupancyPct}%)</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${occupancyPct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                    <span>Responsable : <strong className="text-slate-200">{wh.managerName}</strong></span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">Actif</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: VISION MULTI-PAYS */}
      {activeSubTab === 'countries' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(countryStockBreakdown).map(([country, data]) => (
              <div key={country} className="p-5 bg-slate-900/80 border border-white/10 rounded-2xl space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{country}</h3>
                  <Globe size={18} className="text-indigo-400" />
                </div>
                <div className="text-2xl font-black text-brand-300 font-mono">
                  {data.units.toLocaleString()} <span className="text-xs font-normal text-slate-400">unités stockées</span>
                </div>
                <div className="text-xs text-slate-400 space-y-1 pt-1 border-t border-white/5">
                  <div className="font-semibold text-slate-300">Entrepôts rattachés :</div>
                  {data.warehouses.map(wh => (
                    <div key={wh} className="flex items-center gap-1.5 text-slate-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                      <span>{wh}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: MOUVEMENTS ET TRAÇABILITÉ */}
      {activeSubTab === 'movements' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">Date & Heure</th>
                  <th className="p-3.5">Produit & SKU</th>
                  <th className="p-3.5">Type de Mouvement</th>
                  <th className="p-3.5 text-center">Quantité</th>
                  <th className="p-3.5">Origine → Destination</th>
                  <th className="p-3.5">Réf. Document</th>
                  <th className="p-3.5">Opérateur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {movements.map(m => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5 text-slate-400 font-mono">{m.date}</td>
                      <td className="p-3.5">
                        <div className="font-bold text-white">{m.productTitle}</div>
                        <div className="text-[11px] font-mono text-brand-300">{m.productSku}</div>
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-800 text-slate-300 border border-white/5">
                          {m.type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className={`p-3.5 text-center font-bold font-mono text-sm ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {isPositive ? `+${m.quantity}` : m.quantity}
                      </td>
                      <td className="p-3.5 text-xs text-slate-300">
                        <span>{m.originLocation}</span> → <strong className="text-white">{m.destinationLocation}</strong>
                      </td>
                      <td className="p-3.5 font-mono text-slate-400 font-semibold">{m.referenceDoc}</td>
                      <td className="p-3.5 text-slate-300">{m.performedBy}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 5: INVENTAIRES TOURNANTS & ÉCARTS */}
      {activeSubTab === 'audit_counts' && (
        <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Module d'Inventaire Tournant & Détection d'Écarts</h3>
              <p className="text-xs text-slate-400">Rapprochement automatique entre le stock logique et les comptages physiques par code-barres / QR</p>
            </div>
            <button 
              onClick={() => alert("Session d'inventaire tournant initiée. Scannez les emplacements avec votre terminal mobile ou caméra.")}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-900/30"
            >
              <QrCode size={14} />
              <span>Démarrer Inventaire Tournant</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
              <span className="text-xs text-slate-400">Taux de Précision Stock</span>
              <div className="text-2xl font-black text-emerald-400 font-mono">99.4%</div>
              <p className="text-[11px] text-slate-500">Dernier inventaire complet : 15 Jan 2026</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
              <span className="text-xs text-slate-400">Écart Net Constaté (30j)</span>
              <div className="text-2xl font-black text-white font-mono">-7 unités</div>
              <p className="text-[11px] text-slate-500">2 avaries de transport réaffectées en rebut</p>
            </div>
            <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 space-y-1">
              <span className="text-xs text-slate-400">Prochain Inventaire Tournant</span>
              <div className="text-2xl font-black text-brand-300 font-mono">Vendredi 14:00</div>
              <p className="text-[11px] text-slate-500">Zone Allée B (Machinisme Solaire)</p>
            </div>
          </div>
        </div>
      )}

      {/* ADJUSTMENT MODAL */}
      {isAdjustModalOpen && adjustItem && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sliders size={18} className="text-brand-400" />
              <span>Ajuster Stock : {adjustItem.title}</span>
            </h3>
            <p className="text-xs text-slate-400">
              Stock physique actuel : <strong className="text-white">{adjustItem.physicalQuantity} U.</strong> (Dispo : {adjustItem.availableQuantity})
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Variation de Quantité (+ ou -)</label>
                <input
                  type="number"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(parseInt(e.target.value) || 0)}
                  placeholder="Ex: +50 ou -10"
                  className="w-full mt-1 px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white font-mono text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Motif du Mouvement</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value as any)}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="correction_inventaire">Correction Inventaire / Comptage</option>
                  <option value="entree">Entrée Exceptionnelle</option>
                  <option value="dommage">Dommage / Avarie</option>
                  <option value="perte">Perte / Rebut</option>
                  <option value="retour">Réintégration Retour Client</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Justification / Réf. Audit</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Expliquez la raison du mouvement pour le journal d'audit..."
                  rows={2}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAdjustModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveAdjustment}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Enregistrer Mouvement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI ADD PRODUCT MODAL */}
      {isAiAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Ajout de Produit Express par IA</h3>
                <p className="text-xs text-slate-400">Décrivez ou dictez votre produit, Diallo OS configure la fiche, le SKU et les paliers B2B</p>
              </div>
            </div>

            <div className="space-y-3">
              <textarea
                value={aiAddInput}
                onChange={(e) => setAiAddInput(e.target.value)}
                placeholder="Ex: Nous avons reçu 200 fûts de 200L d'huile de sésame bio de Haute-Guinée, coût d'achat 180 USD, prix de vente conseillé 290 USD, livraison sous 10 jours..."
                rows={4}
                className="w-full px-3.5 py-3 bg-slate-950 border border-white/10 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />

              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <Sparkles size={12} className="text-brand-400" />
                <span>Diallo OS calcule automatiquement les paliers 1-49, 50-499, et 500+ FCL</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsAiAddModalOpen(false)}
                disabled={isAiProcessing}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleGenerateAiProduct}
                disabled={isAiProcessing || !aiAddInput.trim()}
                className="px-5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg disabled:opacity-50"
              >
                {isAiProcessing ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Génération de la fiche...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} />
                    <span>Qualifier & Publier au Stock Central</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL MODAL */}
      {selectedItemForDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img src={selectedItemForDetail.imageUrl} alt={selectedItemForDetail.title} className="w-14 h-14 rounded-2xl object-cover border border-white/10" />
                <div>
                  <h3 className="text-base font-bold text-white">{selectedItemForDetail.title}</h3>
                  <p className="text-xs font-mono text-brand-300">{selectedItemForDetail.sku} • {selectedItemForDetail.category}</p>
                </div>
              </div>
              <button onClick={() => setSelectedItemForDetail(null)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            {/* Pricing Tiers */}
            <div className="p-4 bg-slate-950 rounded-2xl border border-white/5 space-y-2">
              <span className="text-xs font-bold text-slate-300">Stratégie Tarifaire par Volume B2B</span>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                {selectedItemForDetail.tierPricing?.map((tier, idx) => (
                  <div key={idx} className="p-2 bg-slate-900 rounded-xl border border-white/5">
                    <div className="text-[10px] text-slate-400">{tier.label || `Qté: ${tier.minQuantity}+`}</div>
                    <div className="font-bold text-brand-300 font-mono mt-0.5">{tier.unitPrice} {tier.currency}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Warehouse breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Répartition par Entrepôt</span>
              <div className="space-y-1.5">
                {selectedItemForDetail.warehouseQuantities.map((wh, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl text-xs border border-white/5">
                    <span className="text-slate-300">{wh.warehouseName} ({wh.country})</span>
                    <strong className="text-white font-mono">{wh.quantity} unités</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedItemForDetail(null)}
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
