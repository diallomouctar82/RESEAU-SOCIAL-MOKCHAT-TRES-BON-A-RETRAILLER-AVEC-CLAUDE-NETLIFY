import React, { useState } from 'react';
import { 
  Sparkles, LayoutDashboard, Package, ShoppingCart, Users, Building2, 
  TrendingUp, Bot, ShieldCheck, Download, Upload, Shield, Clock, 
  ArrowRight, CheckCircle2, SlidersHorizontal, RefreshCw
} from 'lucide-react';
import { 
  MOCK_STOCK_ITEMS, MOCK_WAREHOUSES, MOCK_STOCK_MOVEMENTS, 
  MOCK_BUSINESS_ORDERS, MOCK_RETURN_REQUESTS, MOCK_CRM_CLIENTS, 
  MOCK_CRM_FOLLOWUPS, MOCK_SUPPORT_TICKETS, MOCK_SUPPLIERS, 
  MOCK_SUPPLIER_ORDERS, MOCK_PRODUCT_PROFITABILITIES, MOCK_COUNTRY_SALES, 
  MOCK_BUSINESS_GOALS, MOCK_BUSINESS_TEAM, MOCK_BUSINESS_AUDIT 
} from '../constants';
import { 
  StockItem, Warehouse, StockMovement, BusinessOrder, BusinessOrderStage, 
  ReturnRequest, ReturnItemStatus, CrmLeadClient, CrmFollowUp, 
  CustomerSupportTicket, SupplierItem, SupplierOrder, ProductProfitability, 
  CountrySalesAnalytics, BusinessGoal, BusinessTeamMember, BusinessAuditEntry, 
  BusinessRole 
} from '../types';

import { BusinessBriefingAndMetrics } from './business/BusinessBriefingAndMetrics';
import { CentralStockWarehouseManager } from './business/CentralStockWarehouseManager';
import { CentralOrderAndFulfillment } from './business/CentralOrderAndFulfillment';
import { CrmAndSalesCopilot } from './business/CrmAndSalesCopilot';
import { SuppliersAndProcurement } from './business/SuppliersAndProcurement';
import { ProfitabilityAndAnalytics } from './business/ProfitabilityAndAnalytics';
import { TalkToYourBusinessAssistant } from './business/TalkToYourBusinessAssistant';

interface TradeBusinessOperatingSystemProps {
  onOpenShipmentModal?: (order: BusinessOrder) => void;
  onOpenMokChatUser?: (userId: string, userName: string) => void;
  onBackToMarket?: () => void;
}

export const TradeBusinessOperatingSystem: React.FC<TradeBusinessOperatingSystemProps> = ({
  onOpenShipmentModal,
  onOpenMokChatUser,
  onBackToMarket
}) => {
  // Main Business OS Tab State
  const [activeTab, setActiveTab] = useState<
    'dashboard' | 'stock' | 'orders' | 'crm' | 'suppliers' | 'analytics' | 'voice_copilot' | 'team_audit'
  >('dashboard');

  // Active Role Simulation (RBAC)
  const [activeRole, setActiveRole] = useState<BusinessRole>('proprietaire');

  // Dynamic Live State
  const [stockList, setStockList] = useState<StockItem[]>(MOCK_STOCK_ITEMS);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(MOCK_WAREHOUSES);
  const [movements, setMovements] = useState<StockMovement[]>(MOCK_STOCK_MOVEMENTS);
  const [orders, setOrders] = useState<BusinessOrder[]>(MOCK_BUSINESS_ORDERS);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>(MOCK_RETURN_REQUESTS);
  const [crmClients, setCrmClients] = useState<CrmLeadClient[]>(MOCK_CRM_CLIENTS);
  const [crmFollowUps, setCrmFollowUps] = useState<CrmFollowUp[]>(MOCK_CRM_FOLLOWUPS);
  const [supportTickets, setSupportTickets] = useState<CustomerSupportTicket[]>(MOCK_SUPPORT_TICKETS);
  const [suppliersList, setSuppliersList] = useState<SupplierItem[]>(MOCK_SUPPLIERS);
  const [supplierOrdersList, setSupplierOrdersList] = useState<SupplierOrder[]>(MOCK_SUPPLIER_ORDERS);
  const [profitabilityList, setProfitabilityList] = useState<ProductProfitability[]>(MOCK_PRODUCT_PROFITABILITIES);
  const [countrySalesList, setCountrySalesList] = useState<CountrySalesAnalytics[]>(MOCK_COUNTRY_SALES);
  const [businessGoalsList, setBusinessGoalsList] = useState<BusinessGoal[]>(MOCK_BUSINESS_GOALS);
  const [teamMembers, setTeamMembers] = useState<BusinessTeamMember[]>(MOCK_BUSINESS_TEAM);
  const [auditLogs, setAuditLogs] = useState<BusinessAuditEntry[]>(MOCK_BUSINESS_AUDIT);

  // Success Banner State
  const [bannerNotice, setBannerNotice] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setBannerNotice(msg);
    setTimeout(() => setBannerNotice(null), 4500);
  };

  // HANDLERS
  const handleUpdateStock = (updatedItems: StockItem[]) => {
    setStockList(updatedItems);
    showNotification("Registre de stock central synchronisé.");
  };

  const handleAddStockMovement = (movement: StockMovement) => {
    setMovements([movement, ...movements]);
    
    // Add audit log
    const audit: BusinessAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: 'À l\'instant',
      actorId: 'usr-amadou',
      actorName: 'Amadou Diallo',
      actorRole: activeRole,
      action: 'Ajustement Stock',
      entity: 'StockItem',
      entityId: movement.productId,
      details: `${movement.type}: ${movement.quantity} unités (${movement.productTitle})`
    };
    setAuditLogs([audit, ...auditLogs]);
  };

  const handleUpdateOrderStage = (orderId: string, newStage: BusinessOrderStage) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, stage: newStage } : o);
    setOrders(updated);
    showNotification(`Statut de commande mis à jour : ${newStage.toUpperCase()}`);

    const targetOrder = orders.find(o => o.id === orderId);
    const audit: BusinessAuditEntry = {
      id: `aud-${Date.now()}`,
      timestamp: 'À l\'instant',
      actorId: 'usr-amadou',
      actorName: 'Amadou Diallo',
      actorRole: activeRole,
      action: 'Changement Étape Commande',
      entity: 'BusinessOrder',
      entityId: orderId,
      details: `Passage de ${targetOrder?.stage} à ${newStage} pour ${targetOrder?.orderNumber}`
    };
    setAuditLogs([audit, ...auditLogs]);
  };

  const handleUpdateReturnStatus = (returnId: string, newStatus: ReturnRequest['status'], newStockStatus: ReturnItemStatus) => {
    const updated = returnRequests.map(r => r.id === returnId ? { ...r, status: newStatus, stockDestinationStatus: newStockStatus } : r);
    setReturnRequests(updated);
    showNotification("Inspection du retour validée et stock réaffecté.");
  };

  const handleCreateSupplierOrder = (newOrder: SupplierOrder) => {
    setSupplierOrdersList([newOrder, ...supplierOrdersList]);
    showNotification(`Bon de Commande ${newOrder.orderNumber} émis vers ${newOrder.supplierName}.`);
  };

  const handleExecutePriorityAction = (actionType: string, payload?: any) => {
    if (actionType === 'reorder_solar_pumps') {
      const solarStock = stockList.find(s => s.sku === 'NRG-SOL-PUMP-5K') || stockList[1];
      const newPo: SupplierOrder = {
        id: `po-${Date.now()}`,
        orderNumber: `BC-PO-SOLAR-${Math.floor(Math.random() * 9000 + 1000)}`,
        supplierId: 'sup-helios',
        supplierName: 'Helios Tech Guangzhou',
        createdAt: 'Aujourd\'hui',
        expectedDeliveryDate: 'Sous 14 jours ouvrés',
        status: 'confirmee',
        destinationWarehouse: 'Hub Portuaire Conakry',
        items: [{
          productId: solarStock.productId,
          sku: solarStock.sku,
          title: solarStock.title,
          quantityOrdered: 50,
          quantityReceived: 0,
          unitCost: solarStock.unitCost,
          totalCost: 50 * solarStock.unitCost
        }],
        totalAmount: 50 * solarStock.unitCost,
        currency: 'USD',
        incoterm: 'FOB Port Guangzhou'
      };

      setSupplierOrdersList([newPo, ...supplierOrdersList]);
      showNotification(`✅ Réapprovisionnement urgent validé : 50 Pompes Solaires commandées chez Helios Tech.`);
      setActiveTab('suppliers');
    }
  };

  const handleExportData = () => {
    const backupData = {
      stock: stockList,
      orders: orders,
      crm: crmClients,
      suppliers: suppliersList,
      audit: auditLogs,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Diallo_OS_Business_Export_${Date.now()}.json`;
    a.click();
    showNotification("Sauvegarde certifiée de l'ensemble de votre Business OS exportée.");
  };

  return (
    <div className="space-y-6">
      {/* TOP STATUS BAR & ROLE SELECTOR */}
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Sparkles size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-brand-400">
                Business Operating System
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-[11px] text-slate-400">Diallo OS 4.0</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white">
              MON BUSINESS MONDIAL
            </h1>
          </div>
        </div>

        {/* Role switcher & Global Export */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* RBAC Role Switcher */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Shield size={14} className="text-brand-400" />
            <span className="text-slate-400">Rôle :</span>
            <select
              value={activeRole}
              onChange={(e) => setActiveRole(e.target.value as BusinessRole)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              <option value="proprietaire">Propriétaire / Dirigeant</option>
              <option value="admin">Administrateur</option>
              <option value="commercial">Responsable Commercial</option>
              <option value="gestionnaire_stock">Gestionnaire de Stock</option>
              <option value="logistique">Responsable Logistique</option>
              <option value="finance">Responsable Finance</option>
              <option value="service_client">Service Client</option>
            </select>
          </div>

          <button
            onClick={handleExportData}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Export Global JSON</span>
          </button>
        </div>
      </div>

      {/* SUCCESS BANNER */}
      {bannerNotice && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-lg animate-fade-down">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-400" />
            <span className="font-semibold">{bannerNotice}</span>
          </div>
          <button onClick={() => setBannerNotice(null)} className="text-emerald-400 hover:text-white">✕</button>
        </div>
      )}

      {/* GLOBAL NAVIGATION MENU */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'dashboard', label: 'Briefing & Cockpit', icon: LayoutDashboard },
          { id: 'stock', label: 'Stock Central & Hubs', icon: Package, count: stockList.length },
          { id: 'orders', label: 'Commandes & Pick/Pack', icon: ShoppingCart, count: orders.length },
          { id: 'crm', label: 'CRM & Pipeline 8 Étapes', icon: Users, count: crmClients.length },
          { id: 'suppliers', label: 'Fournisseurs & PO', icon: Building2, count: suppliersList.length },
          { id: 'analytics', label: 'Marge & Rentabilité', icon: TrendingUp },
          { id: 'voice_copilot', label: 'Copilote Vocal Diallo OS', icon: Bot, badge: 'IA' },
          { id: 'team_audit', label: 'Équipe & Audit RBAC', icon: ShieldCheck }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-lg shadow-brand-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Icon size={15} />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'}`}>
                  {tab.count}
                </span>
              )}
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* MODULE VIEWS */}

      {/* 1. BRIEFING & COCKPIT */}
      {activeTab === 'dashboard' && (
        <BusinessBriefingAndMetrics
          orders={orders}
          stockItems={stockList}
          clients={crmClients}
          followUps={crmFollowUps}
          onNavigateToTab={(tabId) => setActiveTab(tabId as any)}
          onExecutePriorityAction={handleExecutePriorityAction}
        />
      )}

      {/* 2. STOCK CENTRAL & MULTI-ENTREPÔTS */}
      {activeTab === 'stock' && (
        <CentralStockWarehouseManager
          stockList={stockList}
          warehouses={warehouses}
          movements={movements}
          suppliers={suppliersList}
          onUpdateStock={handleUpdateStock}
          onAddStockMovement={handleAddStockMovement}
          onPrepareReorder={(item) => {
            handleExecutePriorityAction('reorder_solar_pumps');
          }}
        />
      )}

      {/* 3. COMMANDES & LOGISTIQUE PICK / PACK */}
      {activeTab === 'orders' && (
        <CentralOrderAndFulfillment
          orders={orders}
          returnRequests={returnRequests}
          onUpdateOrderStage={handleUpdateOrderStage}
          onUpdateReturnStatus={handleUpdateReturnStatus}
          onOpenShipmentLogistics={(order) => {
            if (onOpenShipmentModal) onOpenShipmentModal(order);
            else showNotification(`Module expédition logistique initié pour la commande ${order.orderNumber}.`);
          }}
        />
      )}

      {/* 4. CRM & PIPELINE COMMERCIAL */}
      {activeTab === 'crm' && (
        <CrmAndSalesCopilot
          clients={crmClients}
          followUps={crmFollowUps}
          supportTickets={supportTickets}
          onAddFollowUp={(fu) => {
            setCrmFollowUps([fu, ...crmFollowUps]);
            showNotification("Nouvelle relance planifiée.");
          }}
          onUpdateClientStage={(clientId, newStage) => {
            const updated = crmClients.map(c => c.id === clientId ? { ...c, stage: newStage } : c);
            setCrmClients(updated);
            showNotification(`Prospect déplacé à l'étape : ${newStage}`);
          }}
          onSendAiFollowUpMessage={(fu) => {
            const updated = crmFollowUps.map(f => f.id === fu.id ? { ...f, status: 'fait' as const } : f);
            setCrmFollowUps(updated);
            showNotification(`Relance transmise à ${fu.clientName} via ${fu.channel}.`);
          }}
          onResolveTicket={(ticketId, notes) => {
            const updated = supportTickets.map(t => t.id === ticketId ? { ...t, status: 'resolu' as const } : t);
            setSupportTickets(updated);
            showNotification("Ticket de support client résolu avec succès.");
          }}
        />
      )}

      {/* 5. FOURNISSEURS & PO */}
      {activeTab === 'suppliers' && (
        <SuppliersAndProcurement
          suppliers={suppliersList}
          supplierOrders={supplierOrdersList}
          stockItems={stockList}
          onCreateSupplierOrder={handleCreateSupplierOrder}
        />
      )}

      {/* 6. RENTABILITÉ & ANALYTICS PAYS */}
      {activeTab === 'analytics' && (
        <ProfitabilityAndAnalytics
          profitabilityList={profitabilityList}
          countrySales={countrySalesList}
          businessGoals={businessGoalsList}
        />
      )}

      {/* 7. COPILOTE VOCAL DIALLO OS */}
      {activeTab === 'voice_copilot' && (
        <TalkToYourBusinessAssistant
          orders={orders}
          stockItems={stockList}
          clients={crmClients}
          followUps={crmFollowUps}
          profitabilityList={profitabilityList}
          onNavigateToTab={(tabId) => setActiveTab(tabId as any)}
          onExecutePriorityAction={handleExecutePriorityAction}
        />
      )}

      {/* 8. ÉQUIPE, RBAC ET JOURNAL D'AUDIT */}
      {activeTab === 'team_audit' && (
        <div className="space-y-6">
          {/* Team Members */}
          <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Collaborateurs & Permissions RBAC</h3>
                <p className="text-xs text-slate-400">Contrôlez les accès par rôle : Stock, Logistique, Commercial, Finance, Support</p>
              </div>
              <button 
                onClick={() => alert("Ajout d'un collaborateur : saisissez l'email et sélectionnez le rôle.")}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold"
              >
                + Inviter un Collaborateur
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {teamMembers.map(member => (
                <div key={member.id} className="p-4 bg-slate-950 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-bold text-white text-sm">{member.name}</div>
                    <div className="text-xs text-slate-400">{member.email}</div>
                    <span className="px-2 py-0.5 rounded bg-brand-500/20 text-brand-300 text-[10px] font-bold uppercase">
                      {member.role.replace('_', ' ')}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-bold">
                    {member.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Journal d'Audit Immuable (Audit Trail)</h3>
                <p className="text-xs text-slate-400">Historique horodaté de toutes les modifications de stocks, commandes, prix et accès</p>
              </div>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-white/5 bg-slate-950">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-900 text-[11px] font-bold text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="p-3.5">Horodatage</th>
                    <th className="p-3.5">Auteur & Rôle</th>
                    <th className="p-3.5">Action Réalisée</th>
                    <th className="p-3.5">Entité Cible</th>
                    <th className="p-3.5">Détails de l'Opération</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td className="p-3.5 text-slate-400 font-mono">{log.timestamp}</td>
                      <td className="p-3.5">
                        <strong className="text-white">{log.actorName}</strong>
                        <div className="text-[10px] text-brand-300 uppercase">{log.actorRole}</div>
                      </td>
                      <td className="p-3.5 font-semibold text-white">{log.action}</td>
                      <td className="p-3.5 font-mono text-slate-400">{log.entity}</td>
                      <td className="p-3.5 text-slate-300">{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
