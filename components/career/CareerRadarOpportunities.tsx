import React, { useState, useEffect } from 'react';
import { 
  RadarOpportunityItem, 
  RadarHiddenSignal, 
  ContinuousSearchMission, 
  OpportunityFeedbackRecord, 
  CareerPointA, 
  CareerPointB, 
  OpportunityUniverse, 
  OpportunityTemporalReadiness, 
  OpportunityLocationScope,
  OpportunityVaultStatus
} from '../../types';
import { careerRadarEngine } from '../../services/careerRadarEngine';
import { CareerRadarCard } from './CareerRadarCard';
import { CareerOpportunityVaultModal } from './CareerOpportunityVaultModal';
import { CareerActiveMissionsModal } from './CareerActiveMissionsModal';
import { CareerHiddenSignalsModal } from './CareerHiddenSignalsModal';
import { CareerOpportunityFeedbackModal } from './CareerOpportunityFeedbackModal';
import { CareerOpportunityMapView } from './CareerOpportunityMapView';

import { 
  Radar, 
  Search, 
  Sparkles, 
  Briefcase, 
  Users, 
  DollarSign, 
  ShoppingCart, 
  Compass, 
  FolderLock, 
  Radio, 
  Sliders, 
  MapPin, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Loader2, 
  Globe, 
  Grid, 
  Map, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface CareerRadarOpportunitiesProps {
  pointA: CareerPointA;
  pointB: CareerPointB;
  onGenerateApproach: (opportunity: RadarOpportunityItem, actionType: 'mail' | 'dossier' | 'relance' | 'devis') => void;
  onOpenCoach3D: (opportunity: RadarOpportunityItem) => void;
  onOpenConquestWarRoom?: (opportunity: RadarOpportunityItem) => void;
  onOpenCampusCourse?: (courseId?: string, courseTitle?: string) => void;
  onNavigateToTab?: (tab: string) => void;
}

const QUICK_INTENT_PRESETS: { label: string; query: string; universe: OpportunityUniverse }[] = [
  { label: '🎯 Lead Architecte Cloud UEMOA', query: 'Lead architecte cloud et sécurité bancaire en Afrique de l\'Ouest', universe: 'emploi' },
  { label: '🤝 Clients Grands Comptes E-Commerce', query: 'Marchés privés e-commerce et digitalisation pour réseaux de magasins', universe: 'clients' },
  { label: '💰 Subventions Bailleurs & Seed 2026', query: 'Programmes de bourses d\'amorçage et subventions d\'innovation technologique', universe: 'fonds' },
  { label: '📦 Sourcing Grossiste Informatique', query: 'Fournisseur direct grossiste ordinateurs portables reconditionnés certifiés', universe: 'achats' }
];

export const CareerRadarOpportunities: React.FC<CareerRadarOpportunitiesProps> = ({
  pointA,
  pointB,
  onGenerateApproach,
  onOpenCoach3D,
  onOpenConquestWarRoom,
  onOpenCampusCourse,
  onNavigateToTab
}) => {
  // State from Engine
  const [opportunities, setOpportunities] = useState<RadarOpportunityItem[]>([]);
  const [signals, setSignals] = useState<RadarHiddenSignal[]>([]);
  const [missions, setMissions] = useState<ContinuousSearchMission[]>([]);

  // Search & Filter State
  const [naturalQuery, setNaturalQuery] = useState('');
  const [selectedUniverse, setSelectedUniverse] = useState<OpportunityUniverse | 'all' | 'exploration'>('all');
  const [selectedReadiness, setSelectedReadiness] = useState<OpportunityTemporalReadiness | 'all'>('all');
  const [selectedScope, setSelectedScope] = useState<OpportunityLocationScope | 'all'>('all');
  const [isScanning, setIsScanning] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>([]);
  const [displayMode, setDisplayMode] = useState<'grid' | 'map'>('grid');

  // Modals State
  const [showVaultModal, setShowVaultModal] = useState(false);
  const [showMissionsModal, setShowMissionsModal] = useState(false);
  const [showSignalsModal, setShowSignalsModal] = useState(false);
  const [feedbackOpportunity, setFeedbackOpportunity] = useState<RadarOpportunityItem | null>(null);

  // Load initial data
  useEffect(() => {
    let active = true;
    void careerRadarEngine.ready().then(() => {
      if (active) refreshData();
    });
    return () => { active = false; };
  }, []);

  const refreshData = () => {
    setOpportunities([...careerRadarEngine.getOpportunities()]);
    setSignals([...careerRadarEngine.getSignals()]);
    setMissions([...careerRadarEngine.getMissions()]);
  };

  // Perform Natural Language Radar Scan
  const handleExecuteScan = async (queryToRun?: string, universeToRun?: OpportunityUniverse) => {
    const q = queryToRun !== undefined ? queryToRun : naturalQuery;
    const u = universeToRun !== undefined ? universeToRun : (selectedUniverse === 'all' || selectedUniverse === 'exploration' ? 'emploi' : selectedUniverse);
    
    if (!q.trim()) return;

    setIsScanning(true);
    setScanLog([
      `🚀 Activation de l'Agent de Conquête v2.0...`,
      `📡 Décodage de l'intention : "${q}"`,
      `🔍 Scan croisé : Réseau MOK, Marché Mondial, Appels Bailleurs et Partenaires...`,
      `🧠 Calcul de la compatibilité explicable pour ${pointB.title}...`
    ]);

    try {
      await careerRadarEngine.executeRadarScan({
        naturalQuery: q,
        universe: u,
        pointA,
        pointB
      });
      refreshData();
    } catch (e) {
      console.error('Radar Scan error', e);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle Vault Toggle Save
  const handleToggleVaultSave = (opportunityId: string) => {
    careerRadarEngine.toggleFavorite(opportunityId);
    const opp = opportunities.find(o => o.id === opportunityId);
    if (opp && opp.vaultStatus === 'decouverte') {
      careerRadarEngine.updateVaultStatus(opportunityId, 'a_etudier');
    }
    refreshData();
  };

  // Handle Vault Status Update
  const handleUpdateVaultStatus = (opportunityId: string, newStatus: OpportunityVaultStatus, notes?: string) => {
    careerRadarEngine.updateVaultStatus(opportunityId, newStatus, notes);
    refreshData();
  };

  // Handle Feedback
  const handleSaveFeedback = (record: Omit<OpportunityFeedbackRecord, 'id' | 'timestamp'>) => {
    careerRadarEngine.recordFeedback(record);
    if (record.action === 'declined') {
      careerRadarEngine.updateVaultStatus(record.opportunityId, 'refusee');
    }
    refreshData();
  };

  // Handle Missions creation
  const handleCreateMission = (missionData: any) => {
    careerRadarEngine.createSearchMission(missionData);
    refreshData();
  };

  const handleToggleMission = (missionId: string) => {
    careerRadarEngine.toggleMissionStatus(missionId);
    refreshData();
  };

  const handleDeleteMission = (missionId: string) => {
    careerRadarEngine.deleteMission(missionId);
    refreshData();
  };

  // Filtered Opportunities for rendering
  const filteredOpportunities = opportunities.filter(opp => {
    if (selectedUniverse === 'exploration') {
      if (!opp.isExplorationCard) return false;
    } else if (selectedUniverse !== 'all' && opp.universe !== selectedUniverse) {
      return false;
    }

    if (selectedReadiness !== 'all' && opp.readiness !== selectedReadiness) return false;
    if (selectedScope !== 'all' && opp.locationScope !== selectedScope) return false;

    return true;
  });

  const vaultCount = opportunities.filter(o => o.isFavorite || (o.vaultStatus !== 'decouverte' && o.vaultStatus !== 'abandonnee')).length;
  const activeMissionsCount = missions.filter(m => m.status === 'active').length;

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* 🌟 1. RADAR INTENT SEARCH HERO */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-b from-blue-600/20 to-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
        
        <div className="relative z-10 space-y-6 max-w-4xl">
          <div>
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider mb-2">
              <Radar size={16} className="animate-spin" style={{ animationDuration: '8s' }} /> 
              Radar Intelligent Multi-Sources & Agent de Conquête
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              Quelles opportunités peuvent réellement vous rapprocher de votre objectif ?
            </h2>
            <p className="text-slate-400 text-xs md:text-sm mt-1 leading-relaxed">
              Ne cherchez plus au hasard. Le Radar analyse vos compétences réelles (Point A), votre cible (Point B), et vous propose des pistes qualifiées avec explications transparentes.
            </p>
          </div>

          {/* Natural Language Search Bar */}
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl flex flex-col md:flex-row gap-2 relative">
            <div className="flex-1 relative flex items-center">
              <Search className="absolute left-3.5 text-slate-400" size={18} />
              <input
                value={naturalQuery}
                onChange={(e) => setNaturalQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleExecuteScan()}
                placeholder="Ex: 'Je cherche des subventions pour un projet AgriTech' ou 'Clients e-commerce à Dakar'..."
                className="w-full bg-transparent border-none outline-none text-white pl-10 pr-4 py-2 text-xs md:text-sm placeholder-slate-400 font-medium"
              />
            </div>
            <button
              onClick={() => handleExecuteScan()}
              disabled={isScanning || !naturalQuery.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50 whitespace-nowrap"
            >
              {isScanning ? <Loader2 size={16} className="animate-spin" /> : <Radar size={16} />}
              <span>{isScanning ? 'Scan en cours...' : 'Activer le Radar'}</span>
            </button>
          </div>

          {/* Scanning Live Feedback Overlay */}
          {isScanning && (
            <div className="bg-slate-950/90 border border-blue-500/30 p-4 rounded-2xl space-y-2 animate-fade-up">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-400">
                <Loader2 size={14} className="animate-spin" /> Analyse en temps réel
              </div>
              <div className="space-y-1 font-mono text-[11px] text-slate-300">
                {scanLog.map((log, i) => (
                  <div key={i} className="animate-fade-up">{log}</div>
                ))}
              </div>
            </div>
          )}

          {/* Quick Intent Chips */}
          <div className="space-y-2">
            <div className="text-[11px] uppercase font-bold text-slate-400 flex items-center gap-1.5">
              <Sparkles size={12} className="text-yellow-400" /> Suggestions d'intentions fréquentes :
            </div>
            <div className="flex gap-2 flex-wrap">
              {QUICK_INTENT_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setNaturalQuery(preset.query);
                    setSelectedUniverse(preset.universe);
                    handleExecuteScan(preset.query, preset.universe);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 text-xs text-slate-300 hover:text-white transition-all font-medium flex items-center gap-1.5"
                >
                  <span>{preset.label}</span>
                  <ArrowRight size={11} className="opacity-60" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 📡 2. AGENT BANNERS & QUICK LAUNCHERS (Missions, Signals, Vault) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Banner 1: Mon Agent cherche pour moi */}
        <div 
          onClick={() => setShowMissionsModal(true)}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Radar size={20} className="group-hover:rotate-45 transition-transform" />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-xs md:text-sm">
                Mon Agent Cherche Pour Moi
              </div>
              <div className="text-[11px] text-slate-500">
                {activeMissionsCount > 0 ? `${activeMissionsCount} veille(s) active(s) 24h/24` : 'Activer une veille permanente'}
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-blue-600 transition-colors" />
        </div>

        {/* Banner 2: Signaux Faibles Réseau MOK */}
        <div 
          onClick={() => setShowSignalsModal(true)}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-amber-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold relative">
              <Radio size={20} />
              {signals.length > 0 && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 absolute -top-1 -right-1 animate-ping" />
              )}
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-xs md:text-sm">
                Signaux Faibles & Réseau MOK
              </div>
              <div className="text-[11px] text-slate-500">
                {signals.length} opportunité(s) non publiée(s)
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-amber-600 transition-colors" />
        </div>

        {/* Banner 3: Coffre d'Opportunités */}
        <div 
          onClick={() => setShowVaultModal(true)}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-3 group"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FolderLock size={20} />
            </div>
            <div>
              <div className="font-extrabold text-slate-900 text-xs md:text-sm">
                Coffre d'Opportunités
              </div>
              <div className="text-[11px] text-slate-500">
                {vaultCount} piste(s) conservée(s) & suivies
              </div>
            </div>
          </div>
          <ArrowRight size={16} className="text-slate-400 group-hover:text-emerald-600 transition-colors" />
        </div>

      </div>

      {/* 🧭 3. FILTRES MULTI-UNIVERS, HORIZONS & VUES */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        
        {/* Row 1: The 4 Universes + Horizons */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          
          <div className="flex bg-slate-100 p-1 rounded-2xl overflow-x-auto max-w-full">
            {[
              { id: 'all', label: 'Toutes', count: opportunities.length },
              { id: 'emploi', label: 'Emploi & Missions', icon: Briefcase, count: opportunities.filter(o => o.universe === 'emploi').length },
              { id: 'clients', label: 'Clients B2B', icon: Users, count: opportunities.filter(o => o.universe === 'clients').length },
              { id: 'fonds', label: 'Fonds & Bourses', icon: DollarSign, count: opportunities.filter(o => o.universe === 'fonds').length },
              { id: 'achats', label: 'Achats & Sourcing', icon: ShoppingCart, count: opportunities.filter(o => o.universe === 'achats').length },
              { id: 'exploration', label: '✨ Horizons Nouveaux', icon: Compass, count: opportunities.filter(o => o.isExplorationCard).length }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedUniverse(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  selectedUniverse === tab.id
                    ? 'bg-white text-slate-900 shadow-md font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                {tab.icon && <tab.icon size={13} />}
                <span>{tab.label}</span>
                <span className="text-[10px] text-slate-400 font-bold">({tab.count})</span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle (Grid vs Map) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl shrink-0 self-end lg:self-auto">
            <button
              onClick={() => setDisplayMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                displayMode === 'grid' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Grid size={15} /> <span>Grille</span>
            </button>
            <button
              onClick={() => setDisplayMode('map')}
              className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                displayMode === 'map' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Map size={15} /> <span>Cartographie</span>
            </button>
          </div>
        </div>

        {/* Row 2: Temporal Readiness & Geographic Scope */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
          
          {/* Temporal Readiness Tabs */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs font-bold text-slate-500 mr-1">Échéance & Préparation :</span>
            {[
              { id: 'all', label: 'Tous' },
              { id: 'ready_now', label: '⚡ Prêt Maintenant', color: 'text-emerald-700' },
              { id: 'to_prepare', label: '🎯 À Préparer', color: 'text-amber-700' },
              { id: 'future_goal', label: '🌟 Objectif Futur', color: 'text-indigo-700' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setSelectedReadiness(r.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                  selectedReadiness === r.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Geographic Scope Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500">Rayon :</span>
            <select
              value={selectedScope}
              onChange={(e) => setSelectedScope(e.target.value as any)}
              className="bg-slate-100 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes zones</option>
              <option value="local">Proximité Locale</option>
              <option value="national">National</option>
              <option value="regional">Régional (UEMOA/CEDEAO/Europe)</option>
              <option value="international">International</option>
              <option value="remote">100% Télétravail</option>
            </select>
          </div>

        </div>

      </div>

      {/* 📊 4. OPPORTUNITIES DISPLAY (GRID OR MAP) */}
      {displayMode === 'map' ? (
        <CareerOpportunityMapView 
          opportunities={filteredOpportunities}
          onSelectOpportunity={(opp) => {
            setDisplayMode('grid');
          }}
        />
      ) : (
        <div className="space-y-6">
          {filteredOpportunities.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
              <Radar size={48} className="mx-auto text-slate-300" />
              <h3 className="text-lg font-bold text-slate-700">Aucune opportunité ne correspond à ces critères exacts.</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Élargissez vos filtres géographiques ou lancez un scan avec une nouvelle intention en langage naturel ci-dessus.
              </p>
              <button
                onClick={() => {
                  setSelectedUniverse('all');
                  setSelectedReadiness('all');
                  setSelectedScope('all');
                }}
                className="px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-500"
              >
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredOpportunities.map(opp => (
                <CareerRadarCard
                  key={opp.id}
                  opportunity={opp}
                  pointA={pointA}
                  pointB={pointB}
                  onGenerateApproach={onGenerateApproach}
                  onOpenCoach3D={onOpenCoach3D}
                  onOpenConquestWarRoom={onOpenConquestWarRoom}
                  onOpenCampusCourse={onOpenCampusCourse}
                  onToggleVaultSave={handleToggleVaultSave}
                  onOpenFeedback={(oppToFeedback) => setFeedbackOpportunity(oppToFeedback)}
                  onOpenDirectContact={(oppWithContact) => {
                    alert(`Connexion directe avec ${oppWithContact.contactPerson?.name} (${oppWithContact.contactPerson?.role}) via le canal sécurisé Mok.`);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* 🔒 MODAL 1: COFFRE D'OPPORTUNITÉS */}
      {showVaultModal && (
        <CareerOpportunityVaultModal
          opportunities={opportunities}
          onUpdateStatus={handleUpdateVaultStatus}
          onGenerateApproach={onGenerateApproach}
          onOpenCoach3D={onOpenCoach3D}
          onClose={() => setShowVaultModal(false)}
        />
      )}

      {/* 🤖 MODAL 2: MON AGENT CHERCHE POUR MOI (MISSIONS) */}
      {showMissionsModal && (
        <CareerActiveMissionsModal
          missions={missions}
          onCreateMission={handleCreateMission}
          onToggleMission={handleToggleMission}
          onDeleteMission={handleDeleteMission}
          onClose={() => setShowMissionsModal(false)}
        />
      )}

      {/* 📡 MODAL 3: SIGNAUX FAIBLES RÉSEAU MOK */}
      {showSignalsModal && (
        <CareerHiddenSignalsModal
          signals={signals}
          onExploreSignal={(sig, univ, angle) => {
            setShowSignalsModal(false);
            setNaturalQuery(angle);
            setSelectedUniverse(univ);
            handleExecuteScan(angle, univ);
          }}
          onClose={() => setShowSignalsModal(false)}
        />
      )}

      {/* 💬 MODAL 4: FEEDBACK & APPRENTISSAGE DU RADAR */}
      {feedbackOpportunity && (
        <CareerOpportunityFeedbackModal
          opportunity={feedbackOpportunity}
          onSaveFeedback={handleSaveFeedback}
          onClose={() => setFeedbackOpportunity(null)}
        />
      )}

    </div>
  );
};
