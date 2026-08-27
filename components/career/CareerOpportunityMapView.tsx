import React, { useState } from 'react';
import { 
  RadarOpportunityItem, 
  OpportunityLocationScope 
} from '../../types';
import { 
  Globe, 
  MapPin, 
  Building2, 
  Sparkles, 
  ExternalLink, 
  ArrowRight, 
  Briefcase, 
  DollarSign, 
  Users, 
  ShoppingCart,
  Compass
} from 'lucide-react';

interface CareerOpportunityMapViewProps {
  opportunities: RadarOpportunityItem[];
  onSelectOpportunity: (opportunity: RadarOpportunityItem) => void;
}

const REGIONS_DATA: { id: OpportunityLocationScope; label: string; countDesc: string; icon: any }[] = [
  { id: 'local', label: 'Proximité Locale', countDesc: 'Dans votre ville et zone immédiate', icon: MapPin },
  { id: 'national', label: 'Échelle Nationale', countDesc: 'Sur l\'ensemble du pays', icon: Building2 },
  { id: 'regional', label: 'Régional & Corridors (UEMOA/CEDEAO/Europe)', countDesc: 'Afrique de l\'Ouest, Maghreb & Europe', icon: Compass },
  { id: 'international', label: 'International & Mondial', countDesc: 'Amériques, Asie & reste du monde', icon: Globe },
  { id: 'remote', label: '100% Télétravail & Nomade', countDesc: 'Missions sans contrainte géographique', icon: Sparkles }
];

export const CareerOpportunityMapView: React.FC<CareerOpportunityMapViewProps> = ({
  opportunities,
  onSelectOpportunity
}) => {
  const [selectedScope, setSelectedScope] = useState<OpportunityLocationScope | 'all'>('all');

  const filteredOpps = selectedScope === 'all' 
    ? opportunities 
    : opportunities.filter(o => o.locationScope === selectedScope);

  const getCountForScope = (scope: OpportunityLocationScope) => {
    return opportunities.filter(o => o.locationScope === scope).length;
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6 animate-fade-up">
      
      {/* MAP HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 font-bold uppercase text-xs tracking-wider mb-1">
            <Globe size={15} /> Cartographie Géographique d'Opportunités
          </div>
          <h3 className="text-xl font-black text-slate-900">
            Explorer les Opportunités par Rayon d'Action
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Du local jusqu'à l'international : visualisez la densité des opportunités selon votre mobilité.
          </p>
        </div>

        {/* Global scope filter pills */}
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => setSelectedScope('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedScope === 'all'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            Tous ({opportunities.length})
          </button>
          {REGIONS_DATA.map(region => (
            <button
              key={region.id}
              onClick={() => setSelectedScope(region.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedScope === region.id
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <region.icon size={13} />
              <span>{region.label.split(' ')[0]}</span>
              <span className="text-[10px] font-extrabold bg-white/30 px-1 rounded-full">
                {getCountForScope(region.id)}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* INTERACTIVE REGION PANELS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {REGIONS_DATA.map(reg => {
          const count = getCountForScope(reg.id);
          const isSelected = selectedScope === reg.id;
          return (
            <button
              key={reg.id}
              onClick={() => setSelectedScope(isSelected ? 'all' : reg.id)}
              className={`p-4 rounded-2xl border text-left transition-all space-y-2 ${
                isSelected 
                  ? 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-400/30' 
                  : 'bg-slate-50 border-slate-200 hover:bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <reg.icon className={isSelected ? 'text-blue-600' : 'text-slate-500'} size={18} />
                <span className={`text-lg font-black ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                  {count}
                </span>
              </div>
              <div>
                <div className="font-bold text-xs text-slate-900 line-clamp-1">{reg.label}</div>
                <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{reg.countDesc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* OPPORTUNITIES MATCHING THE SELECTED GEOGRAPHY */}
      <div className="space-y-3 pt-2">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Opportunités détectées dans cette zone ({filteredOpps.length}) :
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOpps.map(opp => (
            <div 
              key={opp.id}
              onClick={() => onSelectOpportunity(opp)}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex justify-between items-start gap-3 group"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                    {opp.universe}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {opp.countryFlag} {opp.location}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                  {opp.title}
                </h4>
                <div className="text-xs text-slate-500 line-clamp-1">
                  {opp.entity} • {opp.compensationOrBudget || 'Rémunération alignée'}
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className="text-sm font-black text-blue-600">{opp.matchScore}%</div>
                <div className="text-[10px] text-slate-400 font-bold">Match</div>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
