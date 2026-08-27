import React, { useState } from 'react';
import { 
  ShoppingCart, Package, Truck, CheckCircle2, Clock, AlertCircle, FileText, 
  Search, Filter, QrCode, ArrowRight, RefreshCcw, ShieldCheck, Download, 
  ExternalLink, Box, Printer, Check, X, ShieldAlert
} from 'lucide-react';
import { BusinessOrder, BusinessOrderStage, ReturnRequest, ReturnItemStatus } from '../../types';

interface CentralOrderAndFulfillmentProps {
  orders: BusinessOrder[];
  returnRequests: ReturnRequest[];
  onUpdateOrderStage: (orderId: string, newStage: BusinessOrderStage) => void;
  onUpdateReturnStatus: (returnId: string, newStatus: ReturnRequest['status'], newStockStatus: ReturnItemStatus) => void;
  onOpenShipmentLogistics: (order: BusinessOrder) => void;
}

export const CentralOrderAndFulfillment: React.FC<CentralOrderAndFulfillmentProps> = ({
  orders,
  returnRequests,
  onUpdateOrderStage,
  onUpdateReturnStatus,
  onOpenShipmentLogistics
}) => {
  const [activeTab, setActiveTab] = useState<'all_orders' | 'to_prepare' | 'pick_pack_scan' | 'returns'>('all_orders');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<BusinessOrder | null>(null);

  // Pick / Pack Scanner Simulation State
  const [activePackingOrder, setActivePackingOrder] = useState<BusinessOrder | null>(null);
  const [scannedSkuInput, setScannedSkuInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  // Return Processing Modal
  const [selectedReturnForInspect, setSelectedReturnForInspect] = useState<ReturnRequest | null>(null);
  const [selectedInspectStockDest, setSelectedInspectStockDest] = useState<ReturnItemStatus>('remis_en_stock_vendable');

  const filteredOrders = orders.filter(o => {
    const matchSearch = o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        o.buyerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (o.buyerCompany && o.buyerCompany.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        o.items.some(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.sku.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchStage = stageFilter === 'all' || o.stage === stageFilter;
    return matchSearch && matchStage;
  });

  const ordersToPrepare = orders.filter(o => o.stage === 'preparation' || o.stage === 'payee' || o.stage === 'validee');

  // Handle Barcode Scan in Pick/Pack
  const handleSimulateScan = (skuToScan: string) => {
    if (!activePackingOrder) return;
    const itemIndex = activePackingOrder.items.findIndex(i => i.sku.toLowerCase() === skuToScan.toLowerCase());
    
    if (itemIndex > -1) {
      const updatedItems = [...activePackingOrder.items];
      updatedItems[itemIndex] = {
        ...updatedItems[itemIndex],
        isPicked: true,
        isPacked: true
      };
      
      const allPacked = updatedItems.every(i => i.isPacked);
      setActivePackingOrder({
        ...activePackingOrder,
        items: updatedItems
      });

      setScanFeedback({ status: 'success', message: `✅ Article vérifié et scanné : ${updatedItems[itemIndex].title}` });

      if (allPacked) {
        onUpdateOrderStage(activePackingOrder.id, 'expediee');
        setScanFeedback({ status: 'success', message: `🎉 Tous les articles ont été scannés et emballés ! Prêt pour expédition.` });
      }
    } else {
      setScanFeedback({ status: 'error', message: `❌ SKU "${skuToScan}" ne correspond à aucun article de cette commande.` });
    }
    setScannedSkuInput('');
  };

  return (
    <div className="space-y-6">
      {/* TOP HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <ShoppingCart className="text-brand-400" size={22} />
            <h2 className="text-xl font-black text-white">Commandes & Logistique de Préparation</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
              Workflow 7 Étapes
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Du paiement sous séquestre au prélèvement en rayon (Pick & Pack), expédition internationale et gestion des retours
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('to_prepare')}
            className="px-3.5 py-2 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Package size={14} />
            <span>À Préparer ({ordersToPrepare.length})</span>
          </button>
        </div>
      </div>

      {/* SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'all_orders', label: 'Toutes les Commandes', icon: ShoppingCart, count: orders.length },
          { id: 'to_prepare', label: 'File « À Préparer »', icon: Package, count: ordersToPrepare.length },
          { id: 'pick_pack_scan', label: 'Scanner Pick & Pack QR', icon: QrCode },
          { id: 'returns', label: 'Retours & Inspections', icon: RefreshCcw, count: returnRequests.length }
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

      {/* VIEW 1: TOUTES LES COMMANDES */}
      {activeTab === 'all_orders' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 text-slate-500" size={16} />
              <input
                type="text"
                placeholder="Rechercher numéro, acheteur, entreprise, SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
              />
            </div>

            <select
              value={stageFilter}
              onChange={(e) => setStageFilter(e.target.value)}
              className="px-3.5 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-brand-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="nouvelle">Nouvelle</option>
              <option value="validee">Validée</option>
              <option value="payee">Payée (Séquestre)</option>
              <option value="preparation">En Préparation</option>
              <option value="expediee">Expédiée / En Transit</option>
              <option value="livree">Livrée</option>
              <option value="terminee">Terminée</option>
            </select>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">Réf. Commande</th>
                  <th className="p-3.5">Client & Destination</th>
                  <th className="p-3.5">Articles & Emplacement</th>
                  <th className="p-3.5 text-right">Montant Total</th>
                  <th className="p-3.5 text-center">Séquestre</th>
                  <th className="p-3.5 text-center">Étape Workflow</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredOrders.map(order => {
                  const isPaid = order.paymentStatus === 'sequestre_bloque' || order.paymentStatus === 'debloque';
                  return (
                    <tr key={order.id} className="hover:bg-white/5 transition-colors">
                      <td className="p-3.5">
                        <div className="font-bold text-white font-mono">{order.orderNumber}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{order.createdAt}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-slate-200">{order.buyerName}</div>
                        <div className="text-[11px] text-slate-400">{order.buyerCompany || order.buyerCountry}</div>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="text-xs text-slate-300">
                              <strong className="text-white">{item.quantity}x</strong> {item.title} 
                              <span className="text-[10px] text-brand-300 font-mono ml-1.5">[{item.locationCode}]</span>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-bold text-white text-sm">
                        {order.totalAmount.toLocaleString()} {order.currency}
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isPaid ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                        }`}>
                          {order.paymentStatus === 'debloque' ? 'Débloqué' : 'Séquestre Actif'}
                        </span>
                      </td>

                      <td className="p-3.5 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          order.stage === 'expediee' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' :
                          order.stage === 'livree' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                          order.stage === 'preparation' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                          'bg-slate-800 text-slate-300'
                        }`}>
                          {order.stage}
                        </span>
                      </td>

                      <td className="p-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {order.stage === 'preparation' && (
                            <button
                              onClick={() => {
                                setActivePackingOrder(order);
                                setActiveTab('pick_pack_scan');
                              }}
                              className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm"
                            >
                              <Box size={12} />
                              <span>Pick & Pack</span>
                            </button>
                          )}

                          <button
                            onClick={() => setSelectedOrderForDetail(order)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                          >
                            <FileText size={14} />
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

      {/* VIEW 2: FILE « À PRÉPARER » */}
      {activeTab === 'to_prepare' && (
        <div className="space-y-4">
          <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-2xl flex items-center justify-between text-xs text-amber-200">
            <span>Ces commandes ont été payées sous séquestre et doivent être prélevées en rayon pour conditionnement d'expédition.</span>
            <span className="font-bold">{ordersToPrepare.length} commande(s) en attente</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ordersToPrepare.map(order => (
              <div key={order.id} className="p-5 bg-slate-900/80 border border-white/10 rounded-2xl space-y-4 shadow-lg flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-brand-300 text-sm">{order.orderNumber}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px] font-bold">
                      Date limite : {order.deadlinePreparation || 'Aujourd\'hui 18h'}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-sm font-bold text-white">{order.buyerCompany || order.buyerName}</h3>
                    <p className="text-xs text-slate-400">Destination : {order.buyerCountry} • Incoterm : {order.incoterm}</p>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-white/5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase">Liste de prélèvement (Pick List) :</span>
                    {order.items.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-950 rounded-xl flex items-center justify-between text-xs border border-white/5">
                        <div>
                          <div className="font-bold text-white">{item.quantity}x {item.title}</div>
                          <div className="text-[10px] text-slate-400 font-mono">Emplacement : <strong className="text-brand-300">{item.locationCode}</strong> ({item.warehouseName})</div>
                        </div>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono">
                          {item.sku}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-white">{order.totalAmount.toLocaleString()} {order.currency}</span>
                  <button
                    onClick={() => {
                      setActivePackingOrder(order);
                      setActiveTab('pick_pack_scan');
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-amber-600 to-brand-600 hover:from-amber-500 hover:to-brand-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-amber-900/30"
                  >
                    <QrCode size={13} />
                    <span>Lancer Session Scan & Emballage</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: SCANNER PICK & PACK */}
      {activeTab === 'pick_pack_scan' && (
        <div className="max-w-2xl mx-auto p-6 bg-slate-900/90 border border-white/10 rounded-3xl space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <QrCode size={20} className="text-brand-400" />
                <span>Station de Contrôle & Emballage Pick & Pack</span>
              </h3>
              <p className="text-xs text-slate-400">Scannez le code-barres / SKU de chaque article avant scellement du colis</p>
            </div>
            {activePackingOrder && (
              <span className="font-mono font-bold text-brand-300 text-xs px-2.5 py-1 rounded-lg bg-slate-800 border border-white/10">
                {activePackingOrder.orderNumber}
              </span>
            )}
          </div>

          {activePackingOrder ? (
            <div className="space-y-4">
              {/* Scan input */}
              <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 space-y-3">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Scanner Code-Barres / Saisie SKU :</span>
                  <span className="text-[11px] text-slate-500 font-normal">Appuyez sur Entrée ou cliquez pour valider</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={scannedSkuInput}
                    onChange={(e) => setScannedSkuInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSimulateScan(scannedSkuInput)}
                    placeholder="Ex: NRG-SOL-PUMP-5K ou scannez le QR..."
                    className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-brand-500"
                  />
                  <button
                    onClick={() => handleSimulateScan(scannedSkuInput)}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all"
                  >
                    Vérifier
                  </button>
                </div>

                {scanFeedback && (
                  <div className={`p-3 rounded-xl text-xs font-medium ${
                    scanFeedback.status === 'success' ? 'bg-emerald-950/70 text-emerald-200 border border-emerald-500/30' : 'bg-rose-950/70 text-rose-200 border border-rose-500/30'
                  }`}>
                    {scanFeedback.message}
                  </div>
                )}
              </div>

              {/* Items checklist */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-300">Articles à vérifier dans cette commande :</span>
                {activePackingOrder.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                      item.isPacked ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200' : 'bg-slate-950 border-white/10 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.isPacked ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {item.isPacked ? <Check size={14} /> : idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-white">{item.quantity}x {item.title}</div>
                        <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku} • Emplacement: {item.locationCode}</div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleSimulateScan(item.sku)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        item.isPacked ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                      }`}
                    >
                      {item.isPacked ? 'Colisé ✅' : 'Simuler Scan QR'}
                    </button>
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <button
                  onClick={() => alert("Impression du bordereau de colisage et de l'étiquette d'expédition...")}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5"
                >
                  <Printer size={14} />
                  <span>Imprimer Étiquette Colis</span>
                </button>

                <button
                  onClick={() => {
                    onOpenShipmentLogistics(activePackingOrder);
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-900/30"
                >
                  <Truck size={14} />
                  <span>Organiser l'Expédition Logistique</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 space-y-3">
              <Package size={40} className="mx-auto text-slate-600" />
              <p className="text-xs text-slate-400">Sélectionnez une commande dans la file « À Préparer » pour démarrer la vérification.</p>
              <button
                onClick={() => setActiveTab('to_prepare')}
                className="px-4 py-2 bg-brand-600 text-white rounded-xl text-xs font-bold"
              >
                Voir les Commandes à Préparer
              </button>
            </div>
          )}
        </div>
      )}

      {/* VIEW 4: GESTION DES RETOURS */}
      {activeTab === 'returns' && (
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-slate-900/60 shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] font-bold uppercase text-slate-400 border-b border-white/10">
                <tr>
                  <th className="p-3.5">Réf. Retour</th>
                  <th className="p-3.5">Commande & Acheteur</th>
                  <th className="p-3.5">Produit & Motif</th>
                  <th className="p-3.5 text-center">Quantité</th>
                  <th className="p-3.5 text-center">Statut Retour</th>
                  <th className="p-3.5 text-center">Statut Stock Destination</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {returnRequests.map(ret => (
                  <tr key={ret.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-white">{ret.returnNumber}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-200">{ret.buyerName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{ret.orderNumber}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{ret.productTitle}</div>
                      <div className="text-[11px] text-slate-400">{ret.reason}</div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-white">{ret.quantity}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {ret.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/5">
                        {ret.stockDestinationStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => setSelectedReturnForInspect(ret)}
                        className="px-2.5 py-1.5 bg-brand-600/20 hover:bg-brand-600/40 text-brand-300 border border-brand-500/30 rounded-lg text-xs font-bold transition-colors"
                      >
                        Inspecter
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* RETURN INSPECTION MODAL */}
      {selectedReturnForInspect && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <RefreshCcw size={18} className="text-brand-400" />
              <span>Inspection Colis Retour : {selectedReturnForInspect.returnNumber}</span>
            </h3>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/5 space-y-2 text-xs">
              <div><strong>Produit :</strong> {selectedReturnForInspect.productTitle} (x{selectedReturnForInspect.quantity})</div>
              <div><strong>Motif :</strong> {selectedReturnForInspect.reason}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Affectation Stock après Contrôle :</label>
                <select
                  value={selectedInspectStockDest}
                  onChange={(e) => setSelectedInspectStockDest(e.target.value as any)}
                  className="w-full mt-1 px-3.5 py-2 bg-slate-950 border border-white/10 rounded-xl text-white text-xs"
                >
                  <option value="remis_en_stock_vendable">Remis en Stock Vendable (Produit intact)</option>
                  <option value="endommage">Endommagé (En attente d'évaluation assurance)</option>
                  <option value="en_reparation">En Réparation / Reconditionnement</option>
                  <option value="rebut_perte">Rebut & Perte comptabilisée</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedReturnForInspect(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  onUpdateReturnStatus(selectedReturnForInspect.id, 'inspecte', selectedInspectStockDest);
                  setSelectedReturnForInspect(null);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30"
              >
                Clôturer Inspection & Valider Remboursement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ORDER DETAIL MODAL */}
      {selectedOrderForDetail && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 max-w-xl w-full space-y-4 shadow-2xl animate-fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedOrderForDetail.orderNumber}</h3>
                <p className="text-xs text-slate-400">Date : {selectedOrderForDetail.createdAt} • Incoterm : {selectedOrderForDetail.incoterm}</p>
              </div>
              <button onClick={() => setSelectedOrderForDetail(null)} className="text-slate-400 hover:text-white text-sm font-bold">✕</button>
            </div>

            <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/5 space-y-1.5 text-xs">
              <div><strong>Acheteur :</strong> {selectedOrderForDetail.buyerName} ({selectedOrderForDetail.buyerCompany || 'Particulier'})</div>
              <div><strong>Email / Tél :</strong> {selectedOrderForDetail.buyerEmail} • {selectedOrderForDetail.buyerPhone || 'Non renseigné'}</div>
              <div><strong>Paiement :</strong> {selectedOrderForDetail.paymentMethod} ({selectedOrderForDetail.paymentStatus})</div>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-300">Articles Commandés :</span>
              {selectedOrderForDetail.items.map((item, idx) => (
                <div key={idx} className="p-2.5 bg-slate-950 rounded-xl flex items-center justify-between text-xs border border-white/5">
                  <div>
                    <span className="font-bold text-white">{item.quantity}x {item.title}</span>
                    <div className="text-[10px] text-slate-400 font-mono">SKU: {item.sku} • Emplacement: {item.locationCode}</div>
                  </div>
                  <strong className="text-white font-mono">{item.totalPrice} {selectedOrderForDetail.currency}</strong>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedOrderForDetail(null)}
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
