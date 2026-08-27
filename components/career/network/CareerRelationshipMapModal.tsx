import React, { useState } from 'react';
import { 
  X, 
  Users, 
  Target, 
  Building2, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  ChevronRight,
  ExternalLink,
  Search,
  Filter,
  CheckCircle2,
  Compass,
  Briefcase
} from 'lucide-react';
import { RelationalNode } from '../../types';

interface CareerRelationshipMapModalProps {
  nodes: RelationalNode[];
  activeGoal: string;
  onSelectNode: (node: RelationalNode) => void;
  onOpenIntroduction: (node: RelationalNode) => void;
  onClose: () => void;
}

export const CareerRelationshipMapModal: React.FC<CareerRelationshipMapModalProps> = ({
  nodes,
  activeGoal,
  onSelectNode,
  onOpenIntroduction,
  onClose
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeNodeHighlight, setActiveNodeHighlight] = useState<RelationalNode | null>(nodes[0] || null);

  const filteredNodes = nodes.filter(node => {
    const matchesCat = selectedCategory === 'all' || node.category === selectedCategory;
    const matchesSearch = !searchQuery || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      node.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'Tous les Nœuds' },
    { id: 'clients', label: 'Clients & Prospects' },
    { id: 'partenaires', label: 'Partenaires' },
    { id: 'investisseurs', label: 'Investisseurs' },
    { id: 'facilitateurs', label: 'Facilitateurs Réseau' },
    { id: 'mentors', label: 'Mentors' }
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/60">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Compass size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-400">
                <Sparkles size={14} /> Cartographie Dynamique des Liens Utiles
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white">
                Carte Relationnelle Intelligente
              </h2>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Sub-bar: Goal Anchor & Search */}
        <div className="bg-slate-950/80 px-6 py-3 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300 w-full md:w-auto">
            <Target size={15} className="text-blue-400 shrink-0" />
            <span className="text-slate-400">Objectif d'ancrage :</span>
            <span className="font-semibold text-white truncate max-w-md">{activeGoal}</span>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text"
                placeholder="Filtrer par nom, entité..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-1 overflow-x-auto">
              {categories.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCategory(c.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                    selectedCategory === c.id 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Interactive Map & Node Details */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 gap-0">
          
          {/* Left Canvas: Graphical Network Hierarchy */}
          <div className="lg:col-span-7 p-6 overflow-y-auto bg-slate-950/40 border-r border-slate-800 space-y-6">
            
            {/* Visual Pathway: Moi -> Objectif -> Relations Directes -> Facilitateurs -> Opportunités */}
            <div className="space-y-4">
              
              {/* Level 1: Moi & Objectif */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-blue-900/40 to-slate-900 border border-blue-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shadow-md">
                    Moi
                  </div>
                  <div>
                    <span className="text-xs uppercase font-bold tracking-wider text-blue-400">Point A d'Émission</span>
                    <h4 className="text-sm font-bold text-white">Votre Position & Compétences Clés</h4>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400">Relations actives :</span>
                  <span className="ml-2 font-bold text-blue-300">{nodes.length} nœuds</span>
                </div>
              </div>

              {/* Connecting Line */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-500" />
              </div>

              {/* Level 2: Intermédiaires & Facilitateurs Directs */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <Users size={14} /> Facilitateurs & Relations Directes
                  </span>
                  <span className="text-slate-500">Mises en relation vérifiées</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nodes.filter(n => n.isDirect || n.category === 'facilitateurs').map(node => (
                    <div 
                      key={node.id}
                      onClick={() => setActiveNodeHighlight(node)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        activeNodeHighlight?.id === node.id 
                          ? 'bg-indigo-950/60 border-indigo-500 shadow-md ring-1 ring-indigo-500' 
                          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={node.avatarUrl} 
                          alt={node.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-600 shrink-0" 
                        />
                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-white truncate">{node.name}</h5>
                          <p className="text-[11px] text-slate-400 truncate">{node.role}</p>
                          <span className="text-[10px] text-indigo-300 font-medium">{node.organization}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-indigo-400 px-2 py-1 rounded-md bg-indigo-900/40 shrink-0">
                        {node.relevanceScore}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Connecting Line */}
              <div className="flex justify-center -my-2">
                <div className="w-0.5 h-6 bg-gradient-to-b from-indigo-500 to-emerald-500" />
              </div>

              {/* Level 3: Relations Potentielles & Opportunités Cibles */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Building2 size={14} /> Opportunités & Décisionnaires Cibles
                  </span>
                  <span className="text-slate-500">Introductions à forte valeur</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {nodes.filter(n => !n.isDirect && n.category !== 'facilitateurs').map(node => (
                    <div 
                      key={node.id}
                      onClick={() => setActiveNodeHighlight(node)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        activeNodeHighlight?.id === node.id 
                          ? 'bg-emerald-950/60 border-emerald-500 shadow-md ring-1 ring-emerald-500' 
                          : 'bg-slate-800/60 border-slate-700/60 hover:border-slate-600 hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img 
                          src={node.avatarUrl} 
                          alt={node.name}
                          className="w-10 h-10 rounded-full object-cover border border-slate-600 shrink-0" 
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <h5 className="text-xs font-bold text-white truncate">{node.name}</h5>
                            <span className="text-[9px] px-1.5 py-0.5 bg-emerald-900/60 text-emerald-300 rounded font-bold">Cible</span>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{node.role}</p>
                          <span className="text-[10px] text-slate-300 font-medium truncate">{node.organization}</span>
                        </div>
                      </div>
                      <span className="text-xs font-black text-emerald-400 px-2 py-1 rounded-md bg-emerald-900/40 shrink-0">
                        {node.relevanceScore}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Right Panel: Focused Node Deep Dive */}
          <div className="lg:col-span-5 p-6 overflow-y-auto bg-slate-900 space-y-6 flex flex-col justify-between">
            {activeNodeHighlight ? (
              <div className="space-y-6">
                
                {/* Node Identity Card */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <img 
                        src={activeNodeHighlight.avatarUrl} 
                        alt={activeNodeHighlight.name}
                        className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-500 shadow-lg"
                      />
                      <div>
                        <h4 className="font-bold text-base text-white">{activeNodeHighlight.name}</h4>
                        <p className="text-xs text-slate-300">{activeNodeHighlight.role}</p>
                        <p className="text-xs text-indigo-400 font-medium">{activeNodeHighlight.organization} • {activeNodeHighlight.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60">
                        {activeNodeHighlight.relevanceScore}% Pertinence
                      </div>
                    </div>
                  </div>

                  {/* Facilitator Badge if indirect */}
                  {activeNodeHighlight.facilitatorName && (
                    <div className="p-3 bg-indigo-950/50 border border-indigo-800/50 rounded-xl text-xs flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-indigo-400" />
                        <span className="text-slate-300">Introduction recommandée via :</span>
                        <span className="font-bold text-white">{activeNodeHighlight.facilitatorName}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* "Pourquoi nous devrions nous parler" */}
                <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/80 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                    <Sparkles size={14} /> Pourquoi nous devrions nous parler
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {activeNodeHighlight.whyWeShouldTalk}
                  </p>
                </div>

                {/* Bidirectional Value Exchange */}
                <div className="grid grid-cols-1 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="font-bold text-emerald-400 block">✨ Ce que cette relation peut apporter :</span>
                    <ul className="space-y-1 text-slate-300">
                      {activeNodeHighlight.bidirectionalValue.whatTheyCanBring.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-emerald-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                    <span className="font-bold text-blue-400 block">🤝 Ce que vous lui apportez :</span>
                    <ul className="space-y-1 text-slate-300">
                      {activeNodeHighlight.bidirectionalValue.whatYouCanBring.map((item, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <CheckCircle2 size={13} className="text-blue-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Action CTA */}
                <div className="pt-2 flex flex-col gap-2">
                  {activeNodeHighlight.stage === 'introduction' ? (
                    <button
                      onClick={() => onOpenIntroduction(activeNodeHighlight)}
                      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 rounded-xl font-bold text-xs hover:from-indigo-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30"
                    >
                      <Users size={16} /> Lancer le Mode Introduction
                    </button>
                  ) : (
                    <button
                      onClick={() => onSelectNode(activeNodeHighlight)}
                      className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold text-xs hover:bg-blue-500 transition-all flex items-center justify-center gap-2 shadow-lg"
                    >
                      <ArrowRight size={16} /> Ouvrir la Fiche Relationnelle & CRM
                    </button>
                  )}
                </div>

              </div>
            ) : (
              <div className="text-center py-16 text-slate-500 text-xs">
                Sélectionnez un nœud pour afficher l'analyse bidirectionnelle.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
