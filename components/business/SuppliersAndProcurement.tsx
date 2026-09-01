import React, { useState } from 'react';
import { 
  Building2, Globe, Star, ShieldCheck, Clock, AlertTriangle, 
  ArrowRight, FileText, Plus, CheckCircle2, RefreshCw, Filter, Search, 
  Scale, Truck, DollarSign, ChevronRight
} from 'lucide-react';
import { SupplierItem, SupplierOrder, StockItem } from '../../types';

interface SuppliersAndProcurementProps {
  suppliers: SupplierItem[];
  supplierOrders: SupplierOrder[];
  stockItems: StockItem[];
  onCreateSupplierOrder: (order: SupplierOrder) => void;
  onOpenSupplierComparison?: () => void;
}

export const SuppliersAndProcurement: React.FC<SuppliersAndProcurementProps> = ({
  suppliers,
  supplierOrders,
  stockItems,
  onCreateSupplierOrder,
  onOpenSupplierComparison
}) => {
  const [activeTab, setActiveTab] = useState<'directory' | 'orders' | 'comparator'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplierForDetail, setSelectedSupplierForDetail] = useState<SupplierItem | null>(null);

  // New PO modal
  const [isNewPoOpen, setIsNewPoOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState(suppliers[0]?.id || '');
  const [poItems, setPoItems] = useState<{ sku: string; title: string; quantity: number; unitCost: number }[]>([
    { sku: 'NRG-SOL-PUMP-5K', title: 'Pompes Solaires 5.5kW', quantity: 50, unitCost: 1950 }
  ]);
  const [poDestWarehouse, setPoDestWarehouse] = useState('Hub Portuaire Conakry');

  const filteredSuppliers = suppliers.filter(s =>
    s.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePoSubmit = () => {
    const supplier = suppliers.find(s => s.id === poSupplierId) || suppliers[0];
    const total = poItems.reduce((sum, item) => sum + (item.quantity * item.unitCost), 0);

    const newOrder: SupplierOrder = {
      id: `po-${Date.now()}`,
      orderNumber: `BC-PO-2026-${Math.floor(Math.random() * 9000 + 1000)}`,
      supplierId: supplier.id,
      supplierName: supplier.companyName,
      orderedAt: 'Aujourd\'hui',
      expectedDeliveryDate: 'Sous 14 jours ouvrés',
      status: 'confirmee',
      paymentStatus: 'en_attente',
      country: supplier.country,
      // Entrepôt de destination : le type porte l'identifiant ET le libellé.
      targetWarehouseId: poDestWarehouse,
      targetWarehouseName: poDestWarehouse,
      items: poItems.map(i => ({
        sku: i.sku,
        title: i.title,
        quantity: i.quantity,
        unitCost: i.unitCost,
        totalCost: i.quantity * i.unitCost
      })),
      totalAmount: total,
      currency: supplier.currency || 'USD',
      incoterm: 'FOB Port Export'
    };

    onCreateSupplierOrder(newOrder);
    setIsNewPoOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <Building2 className="text-brand-400" size={22} />
            <h2 className="text-xl font-black text-white">Fournisseurs & Approvisionnements</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              Mok Trust Audité
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Gérez vos commandes d'achat (PO), comparez les performances de vos fabricants et sécurisez votre chaîne logistique
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsNewPoOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-brand-900/30"
          >
            <Plus size={14} />
            <span>Nouveau Bon de Commande (PO)</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'directory', label: 'Fournisseurs Référencés', icon: Building2, count: suppliers.length },
          { id: 'orders', label: 'Bons de Commande & Réceptions', icon: FileText, count: supplierOrders.length },
          { id: 'comparator', label: 'Comparateur Multicritères', icon: Scale }
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

      {/* VIEW 1: ANNUAIRE FOURNISSEURS */}
      {activeTab === 'directory' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
            <input
              type="text"
              placeholder="Rechercher par nom d'usine, pays, catégorie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map(supplier => (
              <div 
                key={supplier.id} 
                onClick={() => setSelectedSupplierForDetail(supplier)}
                className="p-5 bg-slate-900/80 border border-white/10 hover:border-brand-500/40 rounded-2xl space-y-3 cursor-pointer transition-all shadow-lg flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">{supplier.companyName}</h3>
                      <p className="text-xs text-slate-400">{supplier.country} • {supplier.category}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                      {supplier.mokTrustScore}% Trust
                    </span>
                  </div>

                  {/* Multi-criteria ratings */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px]">
                    <div className="flex justify-between text-slate-400">
                      <span>Respect Délais :</span>
                      <strong className="text-emerald-400">{supplier.ratings.deliveryPunctuality}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Conformité Qualité :</span>
                      <strong className="text-emerald-400">{supplier.ratings.qualityConformity}%</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Compétitivité Prix :</span>
                      <strong className="text-brand-300">{supplier.ratings.priceCompetitiveness}/10</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Taux Litige :</span>
                      <strong className="text-slate-300">{supplier.ratings.disputeRate}%</strong>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Délai Moyen : <strong className="text-white">{supplier.averageLeadTimeDays} jours</strong></span>
                  <span className="text-brand-400 font-bold text-xs flex items-center gap-1">
                    <span>Fiche Fabricant</span>
                    <ChevronRight size={13} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 2: BONS DE COMMANDE (PO) */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">N° Bon de Commande (PO)</th>
                  <th className="p-3.5">Fournisseur & Pays</th>
                  <th className="p-3.5">Entrepôt Cible</th>
                  <th className="p-3.5 text-right">Montant Total</th>
                  <th className="p-3.5 text-center">Livraison Estimée</th>
                  <th className="p-3.5 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {supplierOrders.map(po => (
                  <tr key={po.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">{po.orderNumber}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-200">{po.supplierName}</div>
                      <div className="text-[10px] text-slate-400">Incoterm : {po.incoterm}</div>
                    </td>
                    <td className="p-3.5 font-semibold text-slate-300">{po.destinationWarehouse}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                      {po.totalAmount.toLocaleString()} {po.currency}
                    </td>
                    <td className="p-3.5 text-center text-xs text-slate-300">{po.expectedDeliveryDate}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: COMPARATEUR MULTICRITÈRES */}
      {activeTab === 'comparator' && (
        <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Tableau Comparatif des Fabricants Partenaires</h3>
              <p className="text-xs text-slate-400">Pondération automatique Diallo OS selon les données d'historique de livraison réelles</p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-[11px] font-bold text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">Fournisseur</th>
                  <th className="p-3.5 text-center">Score Mok Trust</th>
                  <th className="p-3.5 text-center">Délai Constaté</th>
                  <th className="p-3.5 text-center">Conformité Qualité</th>
                  <th className="p-3.5 text-center">Taux de Litige</th>
                  <th className="p-3.5 text-center">Recommandation Diallo OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {suppliers.map(s => (
                  <tr key={s.id}>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{s.companyName}</div>
                      <div className="text-[10px] text-slate-400">{s.country} • {s.category}</div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-emerald-400">{s.mokTrustScore}%</td>
                    <td className="p-3.5 text-center font-mono font-bold text-white">{s.averageLeadTimeDays} j</td>
                    <td className="p-3.5 text-center font-bold text-emerald-400">{s.ratings.qualityConformity}%</td>
                    <td className="p-3.5 text-center font-bold text-slate-300">{s.ratings.disputeRate}%</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold">
                        {s.ratings.deliveryPunctuality > 90 ? '⭐⭐⭐ Fabricant Privilégié' : 'Partenaire Validé'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* NEW PO MODAL */}
      {isNewPoOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-lg w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText size={18} className="text-brand-400" />
              <span>Émettre un Bon de Commande d'Achat (PO)</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Sélectionner le Fournisseur :</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.companyName} ({s.country})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Entrepôt de Destination Cible :</label>
                <select
                  value={poDestWarehouse}
                  onChange={(e) => setPoDestWarehouse(e.target.value)}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="Hub Portuaire Conakry">Hub Portuaire Conakry (Guinée)</option>
                  <option value="Entrepôt Dakar Port">Entrepôt Dakar Port (Sénégal)</option>
                  <option value="Hub Abidjan Vridi">Hub Abidjan Vridi (Côte d'Ivoire)</option>
                  <option value="Hub Logistique Paris-Nord">Hub Logistique Paris-Nord (France)</option>
                </select>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-white/5 space-y-1.5">
                <span className="text-xs font-bold text-slate-300">Article à commander :</span>
                <div className="flex justify-between text-xs text-white">
                  <span>50x Pompes Solaires 5.5kW</span>
                  <strong className="font-mono">97 500 USD</strong>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsNewPoOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreatePoSubmit}
                className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Valider & Transmettre PO au Fabricant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
