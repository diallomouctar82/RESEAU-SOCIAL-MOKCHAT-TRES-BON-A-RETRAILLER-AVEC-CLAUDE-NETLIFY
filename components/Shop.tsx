import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Star, 
  Filter, 
  ShoppingCart, 
  CreditCard, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle, 
  Store, 
  ArrowRight, 
  Bot, 
  Search, 
  Plus, 
  Globe, 
  Truck, 
  Building2, 
  Handshake, 
  Clock, 
  FileText, 
  Scale, 
  Sparkles, 
  Check, 
  ChevronRight, 
  X,
  Plane,
  Eye,
  MessageSquare,
  BadgePercent,
  Play,
  Compass,
  Bell,
  DollarSign,
  Radio
} from 'lucide-react';
import { 
  PRODUCTS, 
  AGENTS, 
  MOCK_RFQS, 
  MOCK_FREIGHT_FORWARDERS, 
  MOCK_TRADE_COMPANIES, 
  MOCK_IMPORT_EXPORT_PROJECTS, 
  MOCK_DEAL_NEGOTIATIONS 
} from '../constants';
import { 
  Product, 
  UserShop, 
  MarketIntent, 
  TradeDimension, 
  BuyRequestRFQ, 
  TradeQuote, 
  ImportExportProject, 
  TradeDealNegotiation 
} from '../types';
import { MarketIntentGuide } from './MarketIntentGuide';
import { ProductDetailModal } from './ProductDetailModal';
import { TradeRFQHub } from './TradeRFQHub';
import { ImportExportManager } from './ImportExportManager';
import { CompanyDirectory } from './CompanyDirectory';
import { TradeNegotiationCenter } from './TradeNegotiationCenter';
import { WorldTradeFairCenter } from './WorldTradeFairCenter';
import { TradeSourcingHub } from './TradeSourcingHub';
import { TradeTendersHub } from './TradeTendersHub';
import { TradePartnershipsHub } from './TradePartnershipsHub';
import { TradeCommercialMissionHub } from './TradeCommercialMissionHub';
import { TradeWatchdogHub } from './TradeWatchdogHub';
import { MokTrustCenter } from './MokTrustCenter';
import { TradeDisputeResolutionCenter } from './TradeDisputeResolutionCenter';
import { MokTrustReputationHub } from './MokTrustReputationHub';
import { MokTrustReportModal } from './MokTrustReportModal';
import { TradeBusinessOperatingSystem } from './TradeBusinessOperatingSystem';
import { TradeBusinessIntelligenceHub } from './TradeBusinessIntelligenceHub';

interface ShopProps {
  userCredits?: number;
  userShop?: UserShop;
  onPurchase?: (amount: number, itemTitle: string) => void;
  onOpenMyShop?: () => void;
  onOpenExpertChat?: (agentId?: string, initialPrompt?: string) => void;
  onWatchReel?: (reelId: string) => void;
  onOpenMokChatUser?: (userId: string, userName: string) => void;
  onOpenLiveRoom?: (sessionTitle: string, participantName: string) => void;
}

export const Shop: React.FC<ShopProps> = ({ 
  userCredits = 0, 
  userShop, 
  onPurchase, 
  onOpenMyShop,
  onOpenExpertChat,
  onWatchReel,
  onOpenMokChatUser,
  onOpenLiveRoom
}) => {
  // Main Navigation Sections
  const [activeSection, setActiveSection] = useState<
    'hub' | 'business' | 'intelligence' | 'salon' | 'sourcing' | 'tenders' | 'partnerships' | 'missions' | 'watchdog' | 'catalog' | 'rfq' | 'import_export' | 'directory' | 'deals' | 'trust' | 'disputes' | 'reputation'
  >('hub');
  
  // Catalog Filtering & Search
  const [filterCategory, setFilterCategory] = useState<string>('Tout');
  const [filterDimension, setFilterDimension] = useState<'all' | 'B2B' | 'B2C' | 'C2C'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [originCountryFilter, setOriginCountryFilter] = useState<string>('all');
  
  // Modals & State
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [cart, setCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [purchaseSuccessBanner, setPurchaseSuccessBanner] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportProductContext, setReportProductContext] = useState<{ id?: string; title?: string }>({});

  // Dynamic Data Lists (can receive creations during session)
  const [allProducts, setAllProducts] = useState<Product[]>([...PRODUCTS, ...(userShop?.products || [])]);
  const [rfqList, setRfqList] = useState<BuyRequestRFQ[]>(MOCK_RFQS);
  const [dealList, setDealList] = useState<TradeDealNegotiation[]>(MOCK_DEAL_NEGOTIATIONS);
  const [projectList, setProjectList] = useState<ImportExportProject[]>(MOCK_IMPORT_EXPORT_PROJECTS);

  // Filter logic
  const filteredProducts = allProducts.filter(p => {
    const matchCategory = filterCategory === 'Tout' || p.category === filterCategory;
    const matchDimension = filterDimension === 'all' || (p.dimensionType || 'B2C') === filterDimension;
    const matchSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (p.originCountry && p.originCountry.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        (p.sellerName && p.sellerName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchOrigin = originCountryFilter === 'all' || (p.originCountry && p.originCountry.toLowerCase() === originCountryFilter.toLowerCase());
    return matchCategory && matchDimension && matchSearch && matchOrigin;
  });

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotalAmount = cart.reduce((sum, item) => {
    const unitP = item.product.price;
    const shipP = item.product.shippingEstimateCost || 0;
    return sum + (unitP * item.quantity) + (item.product.shippingAvailable ? shipP : 0);
  }, 0);

  // Handle Quick Intent Selection
  const handleIntentSelected = (intent: MarketIntent, contextData?: any) => {
    switch (intent) {
      case 'buy':
      case 'find_product':
        setActiveSection('catalog');
        break;
      case 'sell':
        if (onOpenMyShop) onOpenMyShop();
        break;
      case 'find_supplier':
        setActiveSection('directory');
        break;
      case 'find_buyer':
        setActiveSection('rfq');
        break;
      case 'import':
      case 'export':
        setActiveSection('import_export');
        break;
      case 'find_service':
        setActiveSection('directory');
        break;
      case 'explain_to_diallo':
        if (onOpenExpertChat) {
          onOpenExpertChat('1', "Bonjour Maître Diallo & Expert Commerce International, j'ai un projet commercial et je souhaite être guidé.");
        }
        break;
      default:
        setActiveSection('catalog');
    }
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    const existingIndex = cart.findIndex(c => c.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].quantity += quantity;
      setCart(updated);
    } else {
      setCart([...cart, { product, quantity }]);
    }
    setSelectedProductForDetail(null);
    setPurchaseSuccessBanner(`Ajouté au panier : ${product.title} (x${quantity})`);
    setTimeout(() => setPurchaseSuccessBanner(null), 4000);
  };

  const handleCheckoutCart = () => {
    if (cart.length === 0) return;
    if (onPurchase) {
      onPurchase(cartTotalAmount, `${cart.length} articles Marché Mondial`);
    }
    setCart([]);
    setIsCartOpen(false);
    setPurchaseSuccessBanner("Commande confirmée et transmise aux fournisseurs certifiés !");
    setTimeout(() => setPurchaseSuccessBanner(null), 5000);
  };

  const handleStartNegotiationFromProduct = (product: Product) => {
    const newDeal: TradeDealNegotiation = {
      id: `deal-${Date.now()}`,
      dealTitle: `Négociation : ${product.title}`,
      buyerId: 'u1',
      buyerName: 'Amadou Diallo',
      sellerId: product.sellerId || 'seller-1',
      sellerName: product.sellerName || 'Fournisseur Certifié',
      productId: product.id,
      productTitle: product.title,
      productImageUrl: product.imageUrl,
      initialPrice: product.price,
      currentOfferPrice: product.price * 0.92,
      targetPrice: product.price * 0.88,
      quantity: product.minOrderQuantity || 10,
      currency: product.currency,
      status: 'draft',
      agreedIncoterm: 'CIF Port de Conakry',
      paymentMilestones: ['30% à la commande', '70% à présentation du connaissement maritime'],
      history: [
        { party: 'buyer', amount: product.price * 0.92, notes: 'Offre initiale avec acompte rapide.', date: 'Aujourd\'hui' }
      ]
    };

    setDealList([newDeal, ...dealList]);
    setSelectedProductForDetail(null);
    setActiveSection('deals');
  };

  return (
    <div className="min-h-full bg-slate-950 text-white animate-fade-up pb-24">
      
      {/* 1. TOP STICKY GLOBAL HEADER */}
      <div className="bg-slate-900/90 border-b border-white/10 sticky top-0 z-30 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white shadow-lg">
              <Globe size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
                  Marché Mondial
                </h1>
                <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-black uppercase tracking-wider hidden sm:inline">
                  B2B • B2C • C2C
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light hidden sm:block">
                Acheter, vendre, importer & exporter avec accompagnement intelligent
              </p>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3 sm:gap-4">
            
            <button
              onClick={() => onOpenMyShop && onOpenMyShop()}
              className="px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center gap-1.5"
            >
              <Store size={14} className="text-emerald-400" />
              <span className="hidden md:inline">Espace Vendeur & IA</span>
              <span className="md:hidden">Vendre</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-300 border border-white/5">
              <span>Solde :</span>
              <span className="text-emerald-400 font-bold font-mono">{userCredits.toFixed(2)} Ⓒ</span>
            </div>

            {/* Cart Button */}
            <button 
              onClick={() => setIsCartOpen(true)}
              className="relative p-2.5 bg-brand-600/20 hover:bg-brand-600/30 border border-brand-500/30 rounded-xl text-brand-300 transition-colors"
            >
              <ShoppingCart size={20} />
              {cartItemCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-brand-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold shadow-md">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>

        </div>

        {/* Global Section Tabs Navigation Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'hub', label: 'Que voulez-vous faire ?', icon: Sparkles, badge: 'Guide' },
            { id: 'business', label: 'Mon Business OS', icon: Store, badge: 'Pilotage' },
            { id: 'intelligence', label: 'Intelligence & Stratégie', icon: Compass, badge: 'IA Global' },
            { id: 'salon', label: 'Salon Mondial Virtuel', icon: Globe, badge: 'Direct B2B' },
            { id: 'sourcing', label: 'Sourcing & Matching', icon: Compass, badge: 'IA' },
            { id: 'tenders', label: 'Appels d\'Offres & Marchés', icon: FileText },
            { id: 'partnerships', label: 'Partenariats & Investisseurs', icon: Handshake },
            { id: 'missions', label: 'Missions Commerciales', icon: Plane },
            { id: 'watchdog', label: 'Veille & Alertes', icon: Bell, badge: 'Auto' },
            { id: 'trust', label: 'Mok Trust & Vérifications', icon: ShieldCheck, badge: 'Sécurité' },
            { id: 'disputes', label: 'Litiges & Médiation', icon: Scale, badge: 'Escrow' },
            { id: 'reputation', label: 'Avis Vérifiés & Score', icon: Star, badge: '98.6%' },
            { id: 'catalog', label: 'Catalogue & Produits', icon: ShoppingBag, count: allProducts.length },
            { id: 'rfq', label: 'RFQ Fournisseurs', icon: Building2, count: rfqList.length },
            { id: 'import_export', label: 'Parcours Import/Export', icon: Truck, badge: 'Roadmap' },
            { id: 'directory', label: 'Entreprises & Transitaires', icon: Building2 },
            { id: 'deals', label: 'Négociations & Contrats', icon: Scale, count: dealList.length },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSection === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  isActive 
                    ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isActive ? 'bg-black/30 text-white' : 'bg-white/10 text-slate-400'}`}>
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Success Notification Banner */}
      {purchaseSuccessBanner && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 animate-fade-down">
          <div className="p-4 bg-emerald-950/80 border border-emerald-500/40 rounded-2xl flex items-center justify-between text-xs text-emerald-200 shadow-lg">
            <div className="flex items-center gap-2.5">
              <CheckCircle size={18} className="text-emerald-400" />
              <span className="font-semibold">{purchaseSuccessBanner}</span>
            </div>
            <button onClick={() => setPurchaseSuccessBanner(null)} className="text-emerald-400 hover:text-white">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTAINER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
        
        {/* VIEW 1: INTENT HUB (QUE VOULEZ-VOUS FAIRE ?) */}
        {activeSection === 'hub' && (
          <div className="space-y-10 animate-fade-in">
            <MarketIntentGuide
              onSelectIntent={handleIntentSelected}
              onQuickQuery={(q) => {
                setSearchQuery(q);
                setActiveSection('catalog');
              }}
              onOpenTradeExpertChat={(prompt) => {
                if (onOpenExpertChat) {
                  onOpenExpertChat('1', prompt || "Bonjour Expert Diallo, je souhaite optimiser ma stratégie commerciale.");
                }
              }}
              onNavigateToTab={(tabId) => {
                setActiveSection(tabId as any);
              }}
            />

            {/* Quick Teaser of Featured Products */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <ShoppingBag size={18} className="text-brand-400" />
                    <span>Opportunités & Produits à l'Exportation</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Lots certifiés disponibles immédiatement avec estimation de fret
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('catalog')}
                  className="text-xs font-bold text-brand-400 hover:underline flex items-center gap-1"
                >
                  <span>Voir tout le catalogue</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {allProducts.slice(0, 3).map(prod => (
                  <div 
                    key={prod.id}
                    onClick={() => setSelectedProductForDetail(prod)}
                    className="p-4 bg-slate-900 border border-white/10 hover:border-brand-500/40 rounded-3xl transition-all cursor-pointer group space-y-3 flex flex-col justify-between shadow-lg"
                  >
                    <div>
                      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-950 mb-3">
                        <img src={prod.imageUrl} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <span className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                          {prod.dimensionType || 'B2C'}
                        </span>
                        {prod.originFlag && (
                          <span className="absolute top-2.5 right-2.5 text-base drop-shadow-md">
                            {prod.originFlag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                        <span>{prod.category}</span>
                        {prod.sellerVerified && (
                          <span className="text-emerald-400 font-semibold flex items-center gap-0.5 text-[11px]">
                            <ShieldCheck size={12} /> {prod.sellerName}
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                        {prod.title}
                      </h4>
                      <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                        {prod.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-400 block">Prix Unitaire</span>
                        <span className="text-base font-extrabold text-emerald-400">
                          {prod.price} {prod.currency} {prod.unit ? `/ ${prod.unit}` : ''}
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForDetail(prod);
                        }}
                        className="px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>Détails & Devis</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Teaser of Open RFQs */}
            <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                    <Handshake size={18} className="text-amber-400" />
                    <span>Derniers Appels d'Offres d'Acheteurs Mondiaux</span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Répondez directement avec votre cotation officielle ou pro forma
                  </p>
                </div>
                <button
                  onClick={() => setActiveSection('rfq')}
                  className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1"
                >
                  <span>Tous les appels d'offres</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rfqList.slice(0, 2).map(r => (
                  <div key={r.id} className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[10px] font-bold">
                        {r.dimension} • {r.quantityRequested} {r.unit}
                      </span>
                      <span className="text-slate-400">{r.createdAt}</span>
                    </div>
                    <h5 className="font-bold text-sm text-white">{r.title}</h5>
                    <p className="text-xs text-slate-400 line-clamp-2">{r.description}</p>
                    <div className="pt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-400">Destination : {r.targetDestinationCountry}</span>
                      <button
                        onClick={() => setActiveSection('rfq')}
                        className="text-amber-400 font-bold hover:underline"
                      >
                        Soumettre un devis →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* VIEW: MON BUSINESS OS (CENTRAL OPERATING SYSTEM) */}
        {activeSection === 'business' && (
          <div className="animate-fade-in">
            <TradeBusinessOperatingSystem
              onOpenShipmentModal={(order) => {
                setActiveSection('import_export');
              }}
              onOpenMokChatUser={onOpenMokChatUser}
              onBackToMarket={() => setActiveSection('hub')}
            />
          </div>
        )}

        {/* VIEW: BUSINESS INTELLIGENCE & STRATÉGIE EXPORT */}
        {activeSection === 'intelligence' && (
          <div className="animate-fade-in">
            <TradeBusinessIntelligenceHub
              onOpenExpertChat={onOpenExpertChat}
              onOpenLiveRoom={onOpenLiveRoom}
              onNavigateSection={(sec) => {
                if (sec === 'sourcing' || sec === 'catalog' || sec === 'rfq' || sec === 'import_export' || sec === 'business') {
                  setActiveSection(sec as any);
                } else {
                  setActiveSection('hub');
                }
              }}
            />
          </div>
        )}

        {/* VIEW 2: CATALOGUE COMPLET */}
        {activeSection === 'catalog' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Search & Filter Bar */}
            <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher par produit, matière, pays d'origine ou fournisseur..."
                    className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-white/10 rounded-2xl text-xs sm:text-sm text-white placeholder-slate-400 outline-none focus:border-brand-500"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-slate-400" size={16} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={filterDimension}
                    onChange={(e) => setFilterDimension(e.target.value as any)}
                    className="p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="all">Toutes dimensions</option>
                    <option value="B2B">B2B (Entreprises & Usines)</option>
                    <option value="B2C">B2C (Consommateurs)</option>
                    <option value="C2C">C2C (Particuliers)</option>
                  </select>

                  <select
                    value={originCountryFilter}
                    onChange={(e) => setOriginCountryFilter(e.target.value)}
                    className="p-2.5 bg-slate-950 border border-white/10 rounded-xl text-xs text-white outline-none focus:border-brand-500 font-semibold"
                  >
                    <option value="all">Toutes origines</option>
                    <option value="Guinée">Guinée 🇬🇳</option>
                    <option value="Chine">Chine 🇨🇳</option>
                    <option value="France">France 🇫🇷</option>
                  </select>
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {['Tout', 'Physique', 'Service', 'Digital'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setFilterCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                      filterCategory === cat 
                        ? 'bg-white text-black font-bold shadow-sm' 
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map(product => (
                <div 
                  key={product.id}
                  onClick={() => setSelectedProductForDetail(product)}
                  className="p-5 bg-slate-900 border border-white/10 hover:border-brand-500/40 rounded-3xl transition-all cursor-pointer group space-y-4 flex flex-col justify-between shadow-lg"
                >
                  <div>
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 mb-3">
                      <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 flex items-center gap-1.5">
                        <span className="px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-bold text-white uppercase tracking-wider">
                          {product.dimensionType || 'B2C'}
                        </span>
                        {product.isService && (
                          <span className="px-2 py-0.5 rounded-full bg-indigo-600/80 text-[10px] font-bold text-white">
                            Service Pro
                          </span>
                        )}
                      </div>

                      {product.originFlag && (
                        <span className="absolute top-3 right-3 text-lg drop-shadow-md">
                          {product.originFlag}
                        </span>
                      )}

                      {/* Quick Add Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(product, product.minOrderQuantity || 1);
                        }}
                        className="absolute bottom-3 right-3 p-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:scale-110"
                      >
                        <Plus size={18} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span>{product.category}</span>
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star size={12} fill="currentColor" /> {product.rating} ({product.reviews})
                      </span>
                    </div>

                    <h3 className="font-bold text-base text-white group-hover:text-brand-300 transition-colors leading-snug line-clamp-1">
                      {product.title}
                    </h3>
                    
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {product.description}
                    </p>

                    {product.minOrderQuantity && (
                      <div className="mt-2.5 p-2 bg-slate-950/60 rounded-xl border border-white/5 text-[11px] text-slate-300 flex items-center justify-between">
                        <span>Quantité minimum (MOQ) :</span>
                        <span className="font-bold text-white">{product.minOrderQuantity} {product.unit || 'unités'}</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Prix Indicatif</span>
                      <span className="text-base sm:text-lg font-extrabold text-emerald-400">
                        {product.price} {product.currency} {product.unit ? `/ ${product.unit}` : ''}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {product.linkedReelId && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onWatchReel) onWatchReel(product.linkedReelId!);
                          }}
                          className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-300 rounded-xl transition-colors"
                          title="Voir le Reel vidéo"
                        >
                          <Play size={14} fill="currentColor" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProductForDetail(product);
                        }}
                        className="px-3.5 py-1.5 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1 shadow-sm"
                      >
                        <span>Consulter</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* VIEW 3: RFQ & APPELS D'OFFRES */}
        {activeSection === 'rfq' && (
          <TradeRFQHub
            rfqs={rfqList}
            onCreateRFQ={(newRfq) => {
              const fullRfq: BuyRequestRFQ = {
                id: `rfq-${Date.now()}`,
                title: newRfq.title || 'Besoin',
                category: newRfq.category || 'Général',
                dimension: newRfq.dimension || 'B2B',
                description: newRfq.description || '',
                quantityRequested: newRfq.quantityRequested || 100,
                unit: newRfq.unit || 'unités',
                targetPricePerUnit: newRfq.targetPricePerUnit,
                currency: newRfq.currency || 'EUR',
                targetDestinationCountry: newRfq.targetDestinationCountry || 'Guinée',
                targetDestinationCity: newRfq.targetDestinationCity,
                deadlineDate: newRfq.deadlineDate || '30/05/2026',
                buyerId: 'u1',
                buyerName: 'Amadou Diallo',
                buyerCountry: 'Guinée',
                buyerFlag: '🇬🇳',
                buyerVerified: true,
                specifications: newRfq.specifications || [],
                certificationsRequired: newRfq.certificationsRequired || [],
                createdAt: 'À l\'instant',
                status: 'open',
                quotesCount: 0,
                quotes: []
              };
              setRfqList([fullRfq, ...rfqList]);
              setPurchaseSuccessBanner("Votre appel d'offres (RFQ) a été publié avec succès !");
              setTimeout(() => setPurchaseSuccessBanner(null), 4000);
            }}
            onSubmitQuote={(rfqId, quote) => {
              setPurchaseSuccessBanner("Votre cotation commerciale a été soumise à l'acheteur !");
              setTimeout(() => setPurchaseSuccessBanner(null), 4000);
            }}
            onOpenDialloAssist={(context) => {
              if (onOpenExpertChat) onOpenExpertChat('1', context);
            }}
            onContactBuyer={(buyerId, buyerName) => {
              if (onOpenMokChatUser) onOpenMokChatUser(buyerId, buyerName);
            }}
          />
        )}

        {/* VIEW 4: IMPORT / EXPORT ROADMAP & LANDED COST */}
        {activeSection === 'import_export' && (
          <ImportExportManager
            projects={projectList}
            onOpenTradeExpert={(context) => {
              if (onOpenExpertChat) onOpenExpertChat('1', context);
            }}
          />
        )}

        {/* VIEW 5: ENTREPRISES & TRANSITAIRES */}
        {activeSection === 'directory' && (
          <CompanyDirectory
            companies={MOCK_TRADE_COMPANIES}
            forwarders={MOCK_FREIGHT_FORWARDERS}
            onContactCompany={(compId, compName) => {
              if (onOpenMokChatUser) onOpenMokChatUser(compId, compName);
            }}
            onOpenTradeExpert={(context) => {
              if (onOpenExpertChat) onOpenExpertChat('1', context);
            }}
          />
        )}

        {/* VIEW 6: NÉGOCIATIONS & CONTRATS */}
        {activeSection === 'deals' && (
          <TradeNegotiationCenter
            deals={dealList}
            onOpenTradeExpert={(context) => {
              if (onOpenExpertChat) onOpenExpertChat('1', context);
            }}
            onOpenMokChat={(partyId, partyName) => {
              if (onOpenMokChatUser) onOpenMokChatUser(partyId, partyName);
            }}
          />
        )}

        {/* VIEW 7: SALON MONDIAL VIRTUEL & PAVILLONS */}
        {activeSection === 'salon' && (
          <div className="animate-fade-in">
            <WorldTradeFairCenter
              onOpenExpertChat={onOpenExpertChat}
              onOpenMokChatUser={onOpenMokChatUser}
              onOpenLiveRoom={onOpenLiveRoom}
              onStartNegotiationWithBooth={(booth, product) => {
                if (product) {
                  handleStartNegotiationFromProduct(product);
                } else {
                  setActiveSection('deals');
                }
              }}
            />
          </div>
        )}

        {/* VIEW 8: SOURCING INTERNATIONAL & MATCHING */}
        {activeSection === 'sourcing' && (
          <div className="animate-fade-in">
            <TradeSourcingHub
              onOpenExpertChat={onOpenExpertChat}
              onOpenMokChatUser={onOpenMokChatUser}
              onOpenDealManager={(missionId) => setActiveSection('deals')}
            />
          </div>
        )}

        {/* VIEW 9: APPELS D'OFFRES & MARCHÉS PUBLICS/PRIVÉS */}
        {activeSection === 'tenders' && (
          <div className="animate-fade-in">
            <TradeTendersHub
              onOpenExpertChat={onOpenExpertChat}
              onOpenDealManager={(dealId) => setActiveSection('deals')}
            />
          </div>
        )}

        {/* VIEW 10: PARTENARIATS & INVESTISSEURS */}
        {activeSection === 'partnerships' && (
          <div className="animate-fade-in">
            <TradePartnershipsHub
              onOpenExpertChat={onOpenExpertChat}
              onOpenMokChatUser={onOpenMokChatUser}
              onOpenLiveRoom={onOpenLiveRoom}
            />
          </div>
        )}

        {/* VIEW 11: MISSIONS COMMERCIALES INTERNATIONALES */}
        {activeSection === 'missions' && (
          <div className="animate-fade-in">
            <TradeCommercialMissionHub
              onOpenExpertChat={onOpenExpertChat}
              onOpenLiveRoom={onOpenLiveRoom}
            />
          </div>
        )}

        {/* VIEW 12: VEILLE ÉCONOMIQUE & AGENT COMMERCIAL AUTONOME */}
        {activeSection === 'watchdog' && (
          <div className="animate-fade-in">
            <TradeWatchdogHub
              onOpenExpertChat={onOpenExpertChat}
              onOpenDealManager={(dealId) => setActiveSection('deals')}
              onOpenSalonSector={(sec) => setActiveSection('salon')}
            />
          </div>
        )}

        {/* VIEW 13: MOK TRUST & VÉRIFICATION IDENTITY */}
        {activeSection === 'trust' && (
          <div className="animate-fade-in">
            <MokTrustCenter
              onOpenExpertChat={onOpenExpertChat}
              onOpenDisputeCenter={() => setActiveSection('disputes')}
              onOpenReportModal={(listingId, productTitle) => {
                setReportProductContext({ id: listingId, title: productTitle });
                setIsReportModalOpen(true);
              }}
            />
          </div>
        )}

        {/* VIEW 14: LITIGES & MÉDIATION COMMERCIALE */}
        {activeSection === 'disputes' && (
          <div className="animate-fade-in">
            <TradeDisputeResolutionCenter
              onOpenExpertChat={onOpenExpertChat}
              onOpenMokChatUser={onOpenMokChatUser}
            />
          </div>
        )}

        {/* VIEW 15: RÉPUTATION MULTIDIMENSIONNELLE & AVIS D'ACHAT */}
        {activeSection === 'reputation' && (
          <div className="animate-fade-in">
            <MokTrustReputationHub
              onOpenExpertChat={onOpenExpertChat}
            />
          </div>
        )}

      </div>

      {/* COUNTERFEIT / ABNORMAL REPORT MODAL */}
      {isReportModalOpen && (
        <MokTrustReportModal
          initialListingId={reportProductContext.id || 'prod-sample-01'}
          initialProductTitle={reportProductContext.title || 'Marchandise signalée'}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}

      {/* PRODUCT DETAIL MODAL */}
      {selectedProductForDetail && (
        <ProductDetailModal
          product={selectedProductForDetail}
          onClose={() => setSelectedProductForDetail(null)}
          onAddToCart={(product, qty) => handleAddToCart(product, qty)}
          onStartNegotiation={(product) => handleStartNegotiationFromProduct(product)}
          onOpenTradeExpert={(context) => {
            if (onOpenExpertChat) onOpenExpertChat('1', context);
          }}
          onWatchReel={(reelId) => {
            if (onWatchReel) onWatchReel(reelId);
          }}
          onContactSeller={(sellerId, sellerName) => {
            if (onOpenMokChatUser) onOpenMokChatUser(sellerId, sellerName);
          }}
          onReportProduct={(prodId, prodTitle) => {
            setReportProductContext({ id: prodId, title: prodTitle });
            setIsReportModalOpen(true);
          }}
        />
      )}

      {/* CART DRAWER / MODAL */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md h-full bg-slate-900 border-l border-white/10 p-6 flex flex-col justify-between text-white shadow-2xl overflow-y-auto">
            
            <div>
              <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="text-brand-400" size={20} />
                  <h3 className="font-bold text-base text-white">Mon Panier International</h3>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-1 hover:bg-white/10 rounded-full">
                  <X size={20} />
                </button>
              </div>

              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-3">
                  <ShoppingBag size={40} className="mx-auto text-slate-600" />
                  <p className="text-sm">Votre panier est actuellement vide.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={idx} className="p-3 bg-slate-950/60 border border-white/5 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <img src={item.product.imageUrl} className="w-12 h-12 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h5 className="font-bold text-white truncate">{item.product.title}</h5>
                        <span className="text-slate-400">
                          {item.quantity} x {item.product.price} {item.product.currency}
                        </span>
                      </div>
                      <div className="text-right font-bold text-emerald-400">
                        {(item.quantity * item.product.price).toFixed(2)} {item.product.currency}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="pt-4 border-t border-white/10 space-y-4">
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Frais de dossier & transit :</span>
                    <span className="text-slate-200">Inclus</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-white pt-1 border-t border-white/5">
                    <span>Total Estimé :</span>
                    <span className="text-emerald-400 text-base font-extrabold">{cartTotalAmount.toFixed(2)} EUR</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckoutCart}
                  className="w-full py-3 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <CreditCard size={16} />
                  <span>Confirmer la commande sécurisée</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  );
};
