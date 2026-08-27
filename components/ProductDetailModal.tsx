import React, { useState } from 'react';
import { 
  X, 
  Calculator, 
  ShieldCheck, 
  Truck, 
  Ship, 
  Plane, 
  FileText, 
  Sparkles, 
  MessageSquare, 
  Check, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Scale, 
  Download, 
  Share2, 
  ShoppingBag, 
  Play, 
  HelpCircle,
  TrendingDown,
  Info,
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import { Product } from '../types';

interface ProductDetailModalProps {
  product: Product;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onStartNegotiation: (product: Product) => void;
  onOpenTradeExpert: (context: string) => void;
  onWatchReel?: (reelId: string) => void;
  onContactSeller: (sellerId: string, sellerName: string) => void;
  onReportProduct?: (productId: string, productTitle: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onStartNegotiation,
  onOpenTradeExpert,
  onWatchReel,
  onContactSeller,
  onReportProduct
}) => {
  const [orderQuantity, setOrderQuantity] = useState<number>(product.minOrderQuantity || 1);
  const [selectedIncoterm, setSelectedIncoterm] = useState<'EXW' | 'FOB' | 'CIF' | 'DDP'>('CIF');
  const [destinationCountry, setDestinationCountry] = useState('Guinée');
  const [activeTab, setActiveTab] = useState<'overview' | 'logistics' | 'customs' | 'documents'>('overview');

  // Calculations
  const unitPrice = product.price;
  const productSubtotal = unitPrice * orderQuantity;
  
  // Dynamic estimates based on Incoterm & quantity
  const shippingMultiplier = Math.max(1, orderQuantity / (product.minOrderQuantity || 1));
  const baseShipping = product.shippingEstimateCost || 50;
  const shippingTotal = selectedIncoterm === 'EXW' ? 0 : baseShipping * (selectedIncoterm === 'FOB' ? 0.3 : 1);
  
  const baseInsurance = product.insuranceEstimate || (productSubtotal * 0.015);
  const insuranceTotal = selectedIncoterm === 'EXW' || selectedIncoterm === 'FOB' ? 0 : baseInsurance;

  const baseCustoms = product.estimatedCustomsTax || (productSubtotal * 0.08);
  const customsTotal = selectedIncoterm === 'DDP' ? baseCustoms : 0; // In DDP, seller pays/includes; in CIF, buyer pays at port

  const totalEstimate = productSubtotal + shippingTotal + insuranceTotal + customsTotal;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl text-white my-8 max-h-[90vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-slate-950/80 sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <span className="text-xl">{product.originFlag || '🌍'}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-brand-500/20 text-brand-300 font-bold text-[10px] uppercase tracking-wider">
                  {product.dimensionType || 'B2C'}
                </span>
                {product.sellerVerified && (
                  <span className="flex items-center gap-1 text-emerald-400 text-xs font-semibold">
                    <ShieldCheck size={14} /> Vendeur Vérifié
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white truncate max-w-md mt-0.5">
                {product.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenTradeExpert(`Conseil sourcing & réglementation pour "${product.title}"`)}
              className="px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/30 rounded-xl text-indigo-200 text-xs font-bold transition-colors hidden sm:flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              <span>Avis Expert Diallo</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: Visuals & Seller */}
            <div className="lg:col-span-5 space-y-4">
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-950 border border-white/10 group">
                <img 
                  src={product.imageUrl} 
                  alt={product.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {product.linkedReelId && (
                  <button
                    onClick={() => onWatchReel && onWatchReel(product.linkedReelId!)}
                    className="absolute bottom-4 left-4 px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-1.5 transition-transform hover:scale-105"
                  >
                    <Play size={14} fill="white" />
                    <span>Voir en Reel vidéo</span>
                  </button>
                )}
              </div>

              {/* Seller Card */}
              <div className="p-4 bg-slate-950/60 border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-brand-600/20 text-brand-400 font-bold flex items-center justify-center text-sm border border-brand-500/20">
                      {product.sellerName ? product.sellerName.substring(0, 2).toUpperCase() : 'VM'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-1">
                        {product.sellerName || 'Fournisseur Certifié'} {product.sellerFlag}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {product.sellerCountry || 'International'} • {product.reviews || 12} transactions
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => onContactSeller(product.sellerId || 'seller-1', product.sellerName || 'Vendeur')}
                    className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-slate-200 transition-colors flex items-center justify-center gap-1"
                  >
                    <MessageSquare size={13} />
                    <span>Mok Chat direct</span>
                  </button>
                  <button
                    onClick={() => onStartNegotiation(product)}
                    className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1"
                  >
                    <Scale size={13} />
                    <span>Négocier le lot</span>
                  </button>
                </div>

                {onReportProduct && (
                  <button
                    onClick={() => onReportProduct(product.id, product.title)}
                    className="w-full py-1.5 text-[11px] text-slate-500 hover:text-amber-400 font-medium transition-colors flex items-center justify-center gap-1.5 pt-1 border-t border-white/5"
                  >
                    <ShieldAlert size={12} />
                    <span>Signaler une contrefaçon / non-conformité</span>
                  </button>
                )}
              </div>

              {/* Certifications Badge */}
              {product.certifications && product.certifications.length > 0 && (
                <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-2xl space-y-2">
                  <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck size={14} /> Certifications Officielles
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {product.certifications.map((cert, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px] rounded-lg font-medium">
                        {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Interactive Trade Details & Cost Engine */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* Navigation Tabs within Modal */}
              <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
                {[
                  { id: 'overview', label: 'Détails & Spécifications', icon: FileText },
                  { id: 'logistics', label: 'Logistique & Incoterms', icon: Truck },
                  { id: 'customs', label: 'Droits de Douane & Taxe', icon: Scale },
                  { id: 'documents', label: 'Documents & Contrat', icon: ShieldCheck },
                ].map(t => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveTab(t.id as any)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                        activeTab === t.id 
                          ? 'bg-brand-600 text-white shadow-sm' 
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">
                      Description du produit
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed">
                      {product.description}
                    </p>
                  </div>

                  {product.specifications && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                        Spécifications techniques
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {Object.entries(product.specifications).map(([key, val]) => (
                          <div key={key} className="p-2.5 bg-slate-950/40 border border-white/5 rounded-xl flex items-center justify-between text-xs">
                            <span className="text-slate-400">{key} :</span>
                            <span className="font-semibold text-slate-200">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.isService && product.serviceDetails && (
                    <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-2">
                      <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        Modalités de prestation
                      </span>
                      <p className="text-xs text-slate-300">
                        • Délai d'exécution : <strong>{product.serviceDetails.turnaroundTime}</strong>
                      </p>
                      <p className="text-xs text-slate-300">
                        • Langues supportées : <strong>{product.serviceDetails.languagesSupported?.join(', ')}</strong>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: LOGISTICS & INCOTERMS */}
              {activeTab === 'logistics' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                      <Truck size={15} /> Paramètres d'acheminement international
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="text-slate-400 block mb-1">Incoterm de référence :</label>
                        <select 
                          value={selectedIncoterm}
                          onChange={(e) => setSelectedIncoterm(e.target.value as any)}
                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-brand-500"
                        >
                          <option value="EXW">EXW (Départ usine vendeur)</option>
                          <option value="FOB">FOB (Franco à bord navire/avion)</option>
                          <option value="CIF">CIF (Coût, Assurance et Fret payé)</option>
                          <option value="DDP">DDP (Rendu droits acquittés - Clef en main)</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-slate-400 block mb-1">Pays de destination :</label>
                        <input 
                          type="text"
                          value={destinationCountry}
                          onChange={(e) => setDestinationCountry(e.target.value)}
                          className="w-full p-2.5 bg-slate-900 border border-white/10 rounded-xl text-white outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl text-xs text-blue-300 space-y-1">
                      <p className="font-semibold flex items-center gap-1">
                        <Info size={14} /> Définition de l'Incoterm {selectedIncoterm} :
                      </p>
                      <p className="text-[11px] text-slate-300">
                        {selectedIncoterm === 'EXW' && "L'acheteur gère la totalité du transport, douane export et import."}
                        {selectedIncoterm === 'FOB' && "Le vendeur dépose la marchandise au port d'embarquement. L'acheteur gère le fret et l'arrivée."}
                        {selectedIncoterm === 'CIF' && "Le vendeur prend en charge le fret principal et l'assurance maritime jusqu'au port de destination."}
                        {selectedIncoterm === 'DDP' && "Le vendeur livre à l'adresse finale avec tous droits de douane et taxes inclus."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: CUSTOMS & DUTIES */}
              {activeTab === 'customs' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <Scale size={15} /> Estimation Réglementation & Douanes
                    </span>
                    <p className="text-xs text-slate-300">
                      Estimation basée sur le Tarif Douanier CEDEAO / Harmonisé. 
                      L'Expert Douane Diallo vous aide à vérifier les taux précis et les exonérations applicables (Code des Investissements).
                    </p>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2 bg-slate-900/60 rounded-lg">
                        <span className="text-slate-400">Droits de douane indicatifs (DD) :</span>
                        <span className="font-semibold text-slate-200">5% à 10% de la valeur CIF</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-900/60 rounded-lg">
                        <span className="text-slate-400">TVA à l'importation :</span>
                        <span className="font-semibold text-slate-200">18% (récupérable pour entreprise)</span>
                      </div>
                      <div className="flex justify-between p-2 bg-slate-900/60 rounded-lg">
                        <span className="text-slate-400">Régime d'origine préférentielle :</span>
                        <span className="font-semibold text-emerald-400">Certificat d'Origine disponible</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: COMMERCIAL DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                      <FileText size={15} /> Pièces documentaires délivrées avec ce lot
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {[
                        'Facture Pro Forma normalisée',
                        'Certificat d\'Origine officiel',
                        'Liste de Colisage (Packing List)',
                        'Certificat de Conformité / Salubrité',
                        'Connaissement Maritime (Bill of Lading) ou LTA Aérien'
                      ].map((doc, i) => (
                        <div key={i} className="p-2.5 bg-slate-900 border border-white/5 rounded-xl flex items-center gap-2 text-slate-300">
                          <Check size={14} className="text-emerald-400 shrink-0" />
                          <span>{doc}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULATEUR DE COÛT RENDU (LANDED COST ENGINE) */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-950 to-indigo-950/40 border border-indigo-500/20 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator size={15} /> Calculateur de Coût Rendu Total (Landed Cost)
                  </span>
                  <span className="text-xs text-slate-400">
                    Origine : {product.originCountry || 'International'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase block">Marchandise</span>
                    <span className="text-sm font-bold text-white">{productSubtotal.toFixed(2)} {product.currency}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase block">Transport ({selectedIncoterm})</span>
                    <span className="text-sm font-bold text-blue-300">+{shippingTotal.toFixed(2)} {product.currency}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase block">Assurance</span>
                    <span className="text-sm font-bold text-teal-300">+{insuranceTotal.toFixed(2)} {product.currency}</span>
                  </div>
                  <div className="p-2.5 bg-slate-900/80 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-400 uppercase block">Total Indicatif</span>
                    <span className="text-base font-extrabold text-emerald-400">{totalEstimate.toFixed(2)} {product.currency}</span>
                  </div>
                </div>

                {/* Quantity input & Actions */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Quantité ({product.unit || 'unités'}) :</span>
                    <div className="flex items-center bg-slate-900 border border-white/10 rounded-xl p-1">
                      <button
                        onClick={() => setOrderQuantity(Math.max(product.minOrderQuantity || 1, orderQuantity - (product.minOrderQuantity || 1)))}
                        className="px-2 py-1 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        -
                      </button>
                      <input 
                        type="number"
                        min={product.minOrderQuantity || 1}
                        value={orderQuantity}
                        onChange={(e) => setOrderQuantity(Math.max(product.minOrderQuantity || 1, parseInt(e.target.value) || 1))}
                        className="w-16 text-center bg-transparent text-white font-bold text-xs outline-none"
                      />
                      <button
                        onClick={() => setOrderQuantity(orderQuantity + (product.minOrderQuantity || 1))}
                        className="px-2 py-1 text-slate-400 hover:text-white text-xs font-bold"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onAddToCart(product, orderQuantity)}
                      className="px-5 py-2.5 bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5"
                    >
                      <ShoppingBag size={14} />
                      <span>Commander le lot ({totalEstimate.toFixed(2)} {product.currency})</span>
                    </button>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </div>
  );
};
