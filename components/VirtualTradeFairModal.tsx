import React, { useState } from 'react';
import { 
  X, 
  Building2, 
  Video, 
  MessageSquare, 
  Download, 
  CheckCircle2, 
  Globe, 
  Sparkles, 
  Filter, 
  Search, 
  ArrowRight,
  ShieldCheck,
  Package
} from 'lucide-react';
import { VirtualTradeFairBooth, Product } from '../types';
import { MOCK_VIRTUAL_FAIR_BOOTHS } from '../constants';

interface VirtualTradeFairModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartNegotiationWithBooth?: (booth: VirtualTradeFairBooth, product?: Product) => void;
}

export const VirtualTradeFairModal: React.FC<VirtualTradeFairModalProps> = ({
  isOpen,
  onClose,
  onStartNegotiationWithBooth
}) => {
  const [selectedPavilion, setSelectedPavilion] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBooth, setSelectedBooth] = useState<VirtualTradeFairBooth | null>(MOCK_VIRTUAL_FAIR_BOOTHS[0] || null);

  if (!isOpen) return null;

  const filteredBooths = MOCK_VIRTUAL_FAIR_BOOTHS.filter((booth) => {
    const matchesPavilion = selectedPavilion === 'all' || booth.country === selectedPavilion;
    const matchesSearch = booth.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          booth.pavilionSector.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPavilion && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/90 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-slate-950 border border-white/10 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col my-4 max-h-[95vh]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-brand-500/20 text-brand-400 rounded-2xl">
              <Globe size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">Salon Mondial Virtuel B2B & Pavillons Internationaux</h3>
                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase animate-pulse">
                  Édition 2026 Ouverte
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Rencontrez des fabricants vérifiés, assistez à des démonstrations en direct et initiez vos contrats commerciaux.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="px-6 py-3 bg-slate-900/60 border-b border-white/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedPavilion('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPavilion === 'all'
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              Tous les Pavillons
            </button>
            <button
              onClick={() => setSelectedPavilion('Chine')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPavilion === 'Chine'
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              🇨🇳 Pavillon Chine & Asie
            </button>
            <button
              onClick={() => setSelectedPavilion('Guinée')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedPavilion === 'Guinée'
                  ? 'bg-brand-600 text-white shadow'
                  : 'bg-white/5 text-slate-400 hover:text-white'
              }`}
            >
              🇬🇳 Pavillon Guinée & Afrique
            </button>
          </div>

          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher un exposant, machine..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-white/10 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-brand-500 w-56"
            />
          </div>
        </div>

        {/* Content Layout: Booths Grid (Left 4 cols) & Booth Interactive Showroom (Right 8 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-y-auto">
          
          {/* Left Column: Booths List */}
          <div className="lg:col-span-4 p-4 border-r border-white/10 space-y-3 bg-slate-950 overflow-y-auto">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Stands Exposants ({filteredBooths.length})
            </span>

            {filteredBooths.map((booth) => {
              const isSelected = selectedBooth?.id === booth.id;
              return (
                <div
                  key={booth.id}
                  onClick={() => setSelectedBooth(booth)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-2 ${
                    isSelected
                      ? 'bg-brand-950/40 border-brand-500 text-white shadow-lg'
                      : 'bg-slate-900/60 border-white/5 text-slate-300 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span>{booth.countryFlag}</span>
                      <span>{booth.companyName}</span>
                    </span>
                    {booth.isLiveNow && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 text-[10px] font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                        LIVE
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 truncate">
                    {booth.pavilionSector}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-white/5">
                    <span>Représentant : {booth.boothRepresentativeName}</span>
                    <span className="text-brand-400 font-semibold flex items-center gap-0.5">
                      Entrer sur le stand →
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Booth Detail */}
          {selectedBooth ? (
            <div className="lg:col-span-8 p-6 space-y-6 bg-slate-900 overflow-y-auto">
              
              {/* Booth Banner Header */}
              <div className="relative rounded-3xl overflow-hidden border border-white/10 h-48 bg-slate-950 flex flex-col justify-end p-6">
                <img
                  src={selectedBooth.bannerUrl}
                  alt={selectedBooth.companyName}
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />

                <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedBooth.logoUrl}
                      alt="Logo"
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg font-bold text-white">{selectedBooth.companyName}</h4>
                        <span className="text-base">{selectedBooth.countryFlag}</span>
                      </div>
                      <p className="text-xs text-brand-300 font-medium">
                        {selectedBooth.pavilionSector}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onStartNegotiationWithBooth) onStartNegotiationWithBooth(selectedBooth);
                      onClose();
                    }}
                    className="px-4 py-2.5 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs rounded-xl shadow-lg transition-transform hover:scale-105 flex items-center gap-1.5 shrink-0"
                  >
                    <Sparkles size={14} />
                    <span>Ouvrir un Dossier Commercial</span>
                  </button>
                </div>
              </div>

              {/* Booth Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/5 flex items-center gap-2.5">
                  <ShieldCheck size={18} className="text-emerald-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Vérification Diallo OS</span>
                    <span className="font-bold text-white">Fabricant Certifié B2B</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/5 flex items-center gap-2.5">
                  <Video size={18} className="text-rose-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Visio Showroom</span>
                    <span className="font-bold text-white">
                      {selectedBooth.isLiveNow ? 'Démonstration en Direct' : 'Sur Rendez-vous'}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-950 rounded-2xl border border-white/5 flex items-center gap-2.5">
                  <Download size={18} className="text-indigo-400" />
                  <div>
                    <span className="text-[10px] text-slate-400 block">Documentation</span>
                    <span className="font-bold text-white">Catalogue & Fiches PDF</span>
                  </div>
                </div>
              </div>

              {/* Featured Products on Booth */}
              <div className="space-y-3">
                <h5 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Package size={16} className="text-brand-400" />
                  <span>Produits & Lignes Exposés sur le Stand</span>
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedBooth.featuredProducts.slice(0, 4).map((p) => (
                    <div key={p.id} className="p-3.5 bg-slate-950 rounded-2xl border border-white/5 flex items-center gap-3">
                      <img src={p.imageUrl} alt={p.title} className="w-14 h-14 rounded-xl object-cover" />
                      <div className="flex-1 min-w-0">
                        <h6 className="text-xs font-bold text-white truncate">{p.title}</h6>
                        <span className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">
                          {p.price} {p.currency}
                        </span>
                        <span className="text-[10px] text-slate-400">MOQ : 500 unités</span>
                      </div>
                      <button
                        onClick={() => {
                          if (onStartNegotiationWithBooth) onStartNegotiationWithBooth(selectedBooth, p);
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-brand-600/30 hover:bg-brand-600 text-brand-300 hover:text-white rounded-lg text-[10px] font-bold transition-colors"
                      >
                        Négocier
                      </button>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          ) : (
            <div className="lg:col-span-8 p-12 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <Building2 size={36} className="text-slate-600" />
              <p>Sélectionnez un stand exposant sur la gauche pour visiter le showroom.</p>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
