import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  MapPin, 
  ShieldCheck, 
  Star, 
  Globe, 
  MessageSquare, 
  ExternalLink, 
  Check, 
  Truck, 
  Award, 
  FileText, 
  ArrowUpRight,
  Filter,
  Users,
  Briefcase
} from 'lucide-react';
import { TradeCompanyProfile, FreightForwarderProfile } from '../types';

interface CompanyDirectoryProps {
  companies: TradeCompanyProfile[];
  forwarders: FreightForwarderProfile[];
  onContactCompany: (companyId: string, companyName: string) => void;
  onOpenTradeExpert: (context: string) => void;
}

export const CompanyDirectory: React.FC<CompanyDirectoryProps> = ({
  companies,
  forwarders,
  onContactCompany,
  onOpenTradeExpert
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'companies' | 'forwarders'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('all');

  const filteredCompanies = companies.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                        c.sector.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        c.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCountry = selectedCountry === 'all' || c.country.toLowerCase() === selectedCountry.toLowerCase();
    return matchSearch && matchCountry;
  });

  const filteredForwarders = forwarders.filter(f => {
    const matchSearch = f.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        f.servedRoutes.some(r => r.toLowerCase().includes(searchQuery.toLowerCase())) ||
                        f.headquartersCountry.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Building2 size={13} /> Répertoire des Entreprises & Transitaires
            </span>
            <span className="text-xs text-slate-400">Vérification de Conformité</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Fournisseurs, Fabricants & Transitaires Certifiés
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Accédez aux profils complets des entreprises partenaires, avis d'acheteurs, routes maritimes et contact direct via Mok Chat.
          </p>
        </div>

        <button
          onClick={() => onOpenTradeExpert("Aide pour l'audit et la vérification documentaire d'un fournisseur")}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center gap-1.5"
        >
          <ShieldCheck size={16} />
          <span>Vérifier une entreprise avec l'IA</span>
        </button>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 border-b border-white/10 sm:border-0 pb-2 sm:pb-0">
          {[
            { id: 'all', label: 'Tout le réseau', count: companies.length + forwarders.length },
            { id: 'companies', label: 'Fabricants & Fournisseurs', count: companies.length },
            { id: 'forwarders', label: 'Transitaires & Logistique', count: forwarders.length }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 ${
                activeTab === t.id 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <span>{t.label}</span>
              <span className="px-1.5 py-0.5 rounded-full bg-black/40 text-[10px] font-mono">
                {t.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <input 
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher une entreprise, pays, port..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 outline-none focus:border-indigo-500"
          />
          <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
        </div>
      </div>

      {/* Grid of Companies & Forwarders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* COMPANIES */}
        {(activeTab === 'all' || activeTab === 'companies') && filteredCompanies.map(c => (
          <div 
            key={c.id}
            className="p-5 bg-slate-900 border border-white/10 hover:border-indigo-500/40 rounded-3xl transition-all text-white space-y-4 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img src={c.logoUrl} alt={c.name} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-white">{c.name}</h3>
                      <span className="text-base">{c.countryFlag}</span>
                    </div>
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <MapPin size={11} className="text-indigo-400" />
                      {c.city}, {c.country} • {c.sector}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full text-[11px] font-bold">
                  <ShieldCheck size={13} />
                  <span>Vérifié</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                {c.description}
              </p>

              <div className="grid grid-cols-3 gap-2 my-3 p-2.5 bg-slate-950/60 rounded-xl border border-white/5 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Note Acheteurs</span>
                  <span className="font-bold text-amber-400 flex items-center justify-center gap-0.5">
                    <Star size={11} fill="currentColor" /> {c.rating} ({c.reviewsCount})
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Transactions</span>
                  <span className="font-bold text-emerald-400">{c.transactionsCompleted}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Score Confiance</span>
                  <span className="font-bold text-indigo-400">{c.reputationScore}%</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 font-semibold mr-1">Marchés desservis :</span>
                {c.servedMarkets.map((m, idx) => (
                  <span key={idx} className="px-2 py-0.5 bg-white/5 rounded-md text-[10px] text-slate-300 border border-white/5">
                    {m}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Contact : <strong>{c.contactPerson}</strong>
              </span>
              <button
                onClick={() => onContactCompany(c.id, c.name)}
                className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <MessageSquare size={13} />
                <span>Mok Chat Direct</span>
              </button>
            </div>
          </div>
        ))}

        {/* FORWARDERS */}
        {(activeTab === 'all' || activeTab === 'forwarders') && filteredForwarders.map(f => (
          <div 
            key={f.id}
            className="p-5 bg-slate-900 border border-white/10 hover:border-blue-500/40 rounded-3xl transition-all text-white space-y-4 shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <img src={f.logoUrl} alt={f.companyName} className="w-12 h-12 rounded-2xl object-cover border border-white/10" />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-white">{f.companyName}</h3>
                      <span className="text-base">{f.flag}</span>
                    </div>
                    <span className="text-xs text-blue-300 flex items-center gap-1">
                      <Truck size={12} />
                      Transitaire Maritime & Aérien Agréé
                    </span>
                  </div>
                </div>

                <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full text-[10px] font-bold">
                  {f.transitTimeEstimateDays}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-300">
                <div>
                  <span className="text-slate-400 font-semibold block mb-1">Routes régulières :</span>
                  <div className="space-y-1">
                    {f.servedRoutes.map((r, rIdx) => (
                      <div key={rIdx} className="p-1.5 bg-slate-950/60 rounded-lg text-[11px] text-slate-200 flex items-center gap-1.5">
                        <span className="text-blue-400 font-bold">🚢</span>
                        <span>{r}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Tarif indicatif :</span>
                  <span className="font-bold text-emerald-400">{f.pricingGuideline}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-400" />
                Dédouanement portuaire inclus
              </span>
              <button
                onClick={() => onContactCompany(f.id, f.companyName)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <MessageSquare size={13} />
                <span>Demander une cotation</span>
              </button>
            </div>
          </div>
        ))}

      </div>

    </div>
  );
};
