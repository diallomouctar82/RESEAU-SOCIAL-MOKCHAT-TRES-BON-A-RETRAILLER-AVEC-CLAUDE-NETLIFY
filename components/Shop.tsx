
import React, { useState } from 'react';
import { ShoppingBag, Star, Filter, ShoppingCart, CreditCard, CheckCircle, ShieldCheck, AlertCircle, Store, ArrowRight, Bot, Search, Plus } from 'lucide-react';
import { PRODUCTS, AGENTS } from '../constants';
import { Product, UserShop } from '../types';

interface ShopProps {
    userCredits?: number;
    userShop?: UserShop;
    onPurchase?: (amount: number, itemTitle: string) => void;
    onOpenMyShop?: () => void;
}

export const Shop: React.FC<ShopProps> = ({ userCredits = 0, userShop, onPurchase, onOpenMyShop }) => {
  const [filter, setFilter] = useState('Tout');
  // ... (logic remains same, focus on UI)
  const [cart, setCart] = useState<Product[]>([]);
  const allProducts = [...PRODUCTS, ...(userShop?.products || [])];
  const filteredProducts = filter === 'Tout' ? allProducts : allProducts.filter(p => p.category === filter);

  return (
    <div className="min-h-full bg-[#fbfbfd] animate-fade-up">
        {/* Apple-style Header */}
        <div className="bg-white border-b border-gray-100 sticky top-0 z-20 bg-opacity-80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Store. <span className="text-slate-400 font-normal">Le meilleur pour votre réussite.</span></h1>
                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium text-slate-600">
                        <span>Solde:</span>
                        <span className="text-slate-900 font-bold">{userCredits} Ⓒ</span>
                    </div>
                    <button className="relative p-2 text-slate-500 hover:text-brand-600 transition-colors">
                        <ShoppingCart size={24} />
                        {cart.length > 0 && <span className="absolute top-0 right-0 w-4 h-4 bg-brand-600 rounded-full text-[10px] text-white flex items-center justify-center font-bold">{cart.length}</span>}
                    </button>
                </div>
            </div>
        </div>

        <div className="max-w-7xl mx-auto px-6 py-12 space-y-16">
            
            {/* Hero Banner */}
            <div className="relative rounded-3xl overflow-hidden h-[500px] bg-black text-white flex items-center">
                <img src="https://images.unsplash.com/photo-1556761175-5973dc0f32e7?w=1600&q=80" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                <div className="relative z-10 p-12 max-w-2xl">
                    <h2 className="text-5xl font-bold mb-6 leading-tight">Pack Entrepreneur <br/> Digital 2025.</h2>
                    <p className="text-xl text-gray-300 mb-8 font-light">Tout ce dont vous avez besoin pour lancer votre business en ligne, validé par nos experts.</p>
                    <button className="bg-white text-black px-8 py-3 rounded-full font-bold text-lg hover:bg-gray-100 transition-colors">Découvrir le Pack</button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex justify-center">
                <div className="inline-flex bg-slate-200/50 p-1 rounded-xl">
                    {['Tout', 'Service', 'Digital', 'Physique'].map(cat => (
                        <button 
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${filter === cat ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                {filteredProducts.map(product => (
                    <div key={product.id} className="group cursor-pointer">
                        <div className="bg-white rounded-[2rem] aspect-square overflow-hidden mb-6 shadow-sm group-hover:shadow-xl transition-all duration-500 relative">
                            <img src={product.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => setCart([...cart, product])} className="bg-black text-white p-3 rounded-full shadow-lg hover:scale-110 transition-transform">
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">Nouveau</div>
                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors">{product.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed line-clamp-2">{product.description}</p>
                            <div className="pt-2 text-lg font-medium text-slate-900">{product.price} Ⓒ</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Seller Promo */}
            <div className="bg-gray-100 rounded-3xl p-12 text-center">
                <Store size={48} className="mx-auto mb-4 text-slate-400" />
                <h2 className="text-3xl font-bold mb-4">Vendez vos créations.</h2>
                <p className="text-slate-500 mb-8 max-w-xl mx-auto">Rejoignez des milliers de créateurs et utilisez notre Assistant IA pour propulser vos ventes.</p>
                <button onClick={onOpenMyShop} className="text-brand-600 font-bold text-lg hover:underline flex items-center justify-center gap-2">
                    Ouvrir ma boutique <ArrowRight size={20} />
                </button>
            </div>
        </div>
    </div>
  );
};