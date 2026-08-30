import React, { useState } from 'react';
import { 
  Navigation, 
  MapPin, 
  Flag, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  RotateCcw, 
  ExternalLink, 
  GraduationCap, 
  Store, 
  Palette, 
  Share2, 
  Globe, 
  DollarSign, 
  Scale, 
  Users, 
  Video, 
  ShieldCheck, 
  ChevronRight,
  TrendingUp,
  Award,
  Zap,
  HelpCircle,
  FileText,
  X
} from 'lucide-react';
import { CareerMissionPlan, CareerGPSMilestone } from '../../types';

interface CareerGPSNavigatorProps {
  missionPlan: CareerMissionPlan;
  onNavigateToTab?: (tab: string) => void;
  onOpenCoach3D: () => void;
  onOpenCouncil: () => void;
  onOpenDiagnostic: () => void;
  onUpdateMilestoneStatus: (milestoneId: string, status: CareerGPSMilestone['status'], recordedOutcome?: string) => void;
  onTriggerPlanB: (milestoneId: string) => void;
}

export const CareerGPSNavigator: React.FC<CareerGPSNavigatorProps> = ({
  missionPlan,
  onNavigateToTab,
  onOpenCoach3D,
  onOpenCouncil,
  onOpenDiagnostic,
  onUpdateMilestoneStatus,
  onTriggerPlanB
}) => {
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string>(
    missionPlan.milestones.find(m => m.status === 'in_progress')?.id || missionPlan.milestones[0]?.id || ''
  );
  const [outcomeInput, setOutcomeInput] = useState('');
  const [showPlanBModal, setShowPlanBModal] = useState<string | null>(null);

  const activeMilestone = missionPlan.milestones.find(m => m.id === selectedMilestoneId) || missionPlan.milestones[0];
  const completedMilestones = missionPlan.milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = missionPlan.milestones.length;

  const getModuleIcon = (mod: string) => {
    switch(mod) {
      case 'campus': return <GraduationCap size={16} className="text-purple-600" />;
      case 'shop': return <Store size={16} className="text-orange-600" />;
      case 'studio': return <Palette size={16} className="text-pink-600" />;
      case 'network': return <Share2 size={16} className="text-blue-600" />;
      case 'languages': return <Globe size={16} className="text-indigo-600" />;
      case 'finance': return <DollarSign size={16} className="text-emerald-600" />;
      case 'legal': return <Scale size={16} className="text-amber-600" />;
      case 'experts': return <Users size={16} className="text-teal-600" />;
      default: return <Sparkles size={16} className="text-blue-600" />;
    }
  };

  const getModuleLabel = (mod: string) => {
    switch(mod) {
      case 'campus': return 'Campus & Formations';
      case 'shop': return 'Marché Mondial B2B';
      case 'studio': return 'Studio Créatif';
      case 'network': return 'Réseau MOC';
      case 'languages': return 'Centre de Langues';
      case 'finance': return 'Financement & Wallet';
      case 'legal': return 'Centre Juridique';
      case 'experts': return 'Conseil d\'Experts Diallo';
      default: return 'Carrière Pro';
    }
  };

  const handleModuleClick = (mod: string) => {
    if (!onNavigateToTab) return;
    switch(mod) {
      case 'campus': onNavigateToTab('campus'); break;
      case 'shop': onNavigateToTab('shop'); break;
      case 'studio': onNavigateToTab('studio'); break;
      case 'network': onNavigateToTab('social'); break;
      case 'languages': onNavigateToTab('languages'); break;
      case 'finance': onNavigateToTab('wallet'); break;
      case 'legal': onNavigateToTab('legal'); break;
      case 'experts': onNavigateToTab('chat'); break;
      default: onNavigateToTab('career'); break;
    }
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* 🧭 GPS TOP COCKPIT BAR */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider">
              <Navigation size={14} className="animate-spin-slow" /> GPS de Carrière & Trajectoire Active
            </div>
            
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>{missionPlan.userGoal.title}</span>
            </h2>

            <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-300 pt-1">
              <span className="flex items-center gap-1.5 text-blue-300 font-semibold bg-blue-900/40 px-3 py-1 rounded-lg border border-blue-700/40">
                <MapPin size={14} className="text-blue-400" /> Point A : {missionPlan.pointA.currentTitle}
              </span>
              <span className="text-slate-500 font-bold">➔</span>
              <span className="flex items-center gap-1.5 text-emerald-300 font-semibold bg-emerald-900/40 px-3 py-1 rounded-lg border border-emerald-700/40">
                <Flag size={14} className="text-emerald-400" /> Point B : {missionPlan.userGoal.targetSalaryOrRevenue || 'Objectif Certifié'}
              </span>
              <span className="text-slate-400 flex items-center gap-1">
                <Clock size={14} /> Échéance : {missionPlan.userGoal.targetDeadlineMonths} mois
              </span>
            </div>
          </div>

          {/* Progress & Quick Actions */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3 w-full lg:w-auto shrink-0">
            <div className="bg-slate-800/80 backdrop-blur p-4 rounded-2xl border border-slate-700 w-full sm:w-auto text-right">
              <div className="flex justify-between sm:justify-end items-center gap-4 mb-2">
                <span className="text-xs text-slate-400 uppercase font-bold">Progression Trajectoire</span>
                <span className="text-2xl font-black text-emerald-400">{missionPlan.progressPercent}%</span>
              </div>
              <div className="w-full sm:w-48 bg-slate-700 h-2.5 rounded-full overflow-hidden">
                <div 
                  className="bg-blue-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${missionPlan.progressPercent}%` }}
                />
              </div>
              <div className="text-[11px] text-slate-400 mt-1.5 flex justify-between">
                <span>{completedMilestones} / {totalMilestones} phases accomplies</span>
                <span className="text-emerald-400 font-bold">{missionPlan.certifiedResultsCount} résultats validés</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={onOpenCouncil}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all border border-white/15 flex items-center justify-center gap-2"
              >
                <Users size={14} className="text-teal-400" /> Conseil d'Experts
              </button>
              <button
                onClick={onOpenCoach3D}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <Video size={14} /> Coach 3D Vocal
              </button>
            </div>
          </div>
        </div>

        {/* 🗺️ INTERACTIVE STEP PROGRESSION TIMELINE */}
        <div className="mt-8 pt-6 border-t border-slate-800 overflow-x-auto pb-2">
          <div className="flex items-center min-w-[760px] justify-between relative">
            <div className="absolute top-1/2 left-4 right-4 h-1 bg-slate-800 -translate-y-1/2 -z-0" />
            {missionPlan.milestones.map((milestone, idx) => {
              const isSelected = milestone.id === selectedMilestoneId;
              const isCompleted = milestone.status === 'completed';
              const isInProgress = milestone.status === 'in_progress';

              return (
                <button
                  key={milestone.id}
                  onClick={() => setSelectedMilestoneId(milestone.id)}
                  className="relative z-10 flex flex-col items-center group focus:outline-none"
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm transition-all duration-300 shadow-md ${
                    isCompleted 
                      ? 'bg-emerald-500 text-white ring-4 ring-emerald-500/20' 
                      : isInProgress 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 animate-pulse' 
                        : isSelected
                          ? 'bg-slate-700 text-white ring-4 ring-white/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700 group-hover:border-slate-500'
                  }`}>
                    {isCompleted ? <CheckCircle2 size={20} /> : milestone.phaseNumber}
                  </div>

                  <span className={`text-[11px] font-bold mt-2 max-w-[130px] text-center line-clamp-1 transition-colors ${
                    isSelected ? 'text-blue-300 font-extrabold' : 'text-slate-400 group-hover:text-slate-200'
                  }`}>
                    {milestone.title}
                  </span>

                  <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                    isCompleted 
                      ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' 
                      : isInProgress 
                        ? 'bg-blue-950 text-blue-300 border border-blue-800 font-bold' 
                        : 'bg-slate-800 text-slate-500'
                  }`}>
                    {isCompleted ? 'Accompli' : isInProgress ? 'En cours' : 'À venir'}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* 🚀 ACTIVE MILESTONE FOCUS CARD & GATEWAYS */}
      {activeMilestone && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-lg relative overflow-hidden">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-extrabold">
                  Phase {activeMilestone.phaseNumber} / {totalMilestones}
                </span>
                <span>• Durée estimée : {activeMilestone.estimatedDuration}</span>
                {activeMilestone.isResultCheckpoint && (
                  <span className="flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                    <Award size={13} /> Point de Résultat Certifié
                  </span>
                )}
              </div>

              <h3 className="text-2xl font-black text-slate-900">
                {activeMilestone.title}
              </h3>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed max-w-3xl">
                {activeMilestone.description}
              </p>
            </div>

            {/* Gateway Button into the Platform Ecosystem */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={() => handleModuleClick(activeMilestone.interconnectedModule)}
                className="flex-1 lg:flex-none px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2.5 group"
              >
                {getModuleIcon(activeMilestone.interconnectedModule)}
                <span>{activeMilestone.gatewayAction || `Ouvrir ${getModuleLabel(activeMilestone.interconnectedModule)}`}</span>
                <ExternalLink size={15} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </button>

              {activeMilestone.planBAlternative && (
                <button
                  onClick={() => setShowPlanBModal(activeMilestone.id)}
                  className="px-4 py-3.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5"
                >
                  <RotateCcw size={15} className="text-amber-600" /> Plan B / Recalcul
                </button>
              )}
            </div>
          </div>

          {/* Deliverables & Real Outcome Verification */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText size={15} className="text-blue-600" /> Livrable & Critère d'Accomplissement
                </span>
                <span className="text-xs font-bold text-blue-600">Phase {activeMilestone.phaseNumber}</span>
              </div>
              <p className="text-sm font-semibold text-slate-800 bg-white p-3 rounded-xl border border-slate-200">
                "{activeMilestone.deliverable}"
              </p>

              {activeMilestone.actualOutcomeRecorded ? (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-start gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Résultat vérifié :</span>
                    {activeMilestone.actualOutcomeRecorded}
                  </div>
                </div>
              ) : (
                <div className="space-y-2 pt-1">
                  <input
                    type="text"
                    value={outcomeInput}
                    onChange={(e) => setOutcomeInput(e.target.value)}
                    placeholder="Enregistrer la preuve ou le résultat obtenu (ex: Contrat signé, Note 18/20)..."
                    className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateMilestoneStatus(activeMilestone.id, 'completed', outcomeInput || 'Résultat validé par l\'utilisateur.');
                        setOutcomeInput('');
                      }}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all"
                    >
                      <CheckCircle2 size={14} /> Valider l'accomplissement réel
                    </button>
                    {activeMilestone.status !== 'in_progress' && (
                      <button
                        onClick={() => onUpdateMilestoneStatus(activeMilestone.id, 'in_progress')}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                      >
                        Activer
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Platform Backbone Links */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Zap size={15} className="text-amber-500" /> Écosystème mobilisé pour cette étape
              </span>
              
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'campus', name: 'Campus LMAV', desc: 'Formations & Examens', icon: GraduationCap },
                  { id: 'shop', name: 'Marché Mondial', desc: 'Sourcing & Clients B2B', icon: Store },
                  { id: 'studio', name: 'Studio Créatif', desc: 'CV, Pitch, Vidéos', icon: Palette },
                  { id: 'network', name: 'Réseau MOC', desc: 'Tribus & Contacts', icon: Share2 }
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleModuleClick(item.id)}
                    className="p-3 bg-white hover:bg-blue-50/50 rounded-xl border border-slate-200 hover:border-blue-300 text-left transition-all group"
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <item.icon size={15} className="text-slate-600 group-hover:text-blue-600" />
                      <span className="font-bold text-xs text-slate-900">{item.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{item.desc}</p>
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-between items-center text-xs">
                <span className="text-slate-500">Besoin d'un arbitrage ?</span>
                <button
                  onClick={onOpenCouncil}
                  className="text-blue-600 font-bold hover:underline flex items-center gap-1"
                >
                  Convoquer le Conseil d'Experts →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔄 PLAN B / REROUTING MODAL */}
      {showPlanBModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-6 md:p-8 space-y-6 border border-slate-100">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-100 text-amber-700 rounded-2xl">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900">Itinéraire Alternatif (Plan B)</h3>
                  <p className="text-xs text-slate-500">Recalcul intelligent en cas de blocage ou refus</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlanBModal(null)}
                className="text-slate-400 hover:text-slate-700 p-3 rounded-full hover:bg-slate-100 transition-colors"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-slate-700">
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200/80">
                <span className="font-bold text-amber-900 block mb-1">Condition de déclenchement :</span>
                <p className="text-amber-800 text-xs">{activeMilestone.planBAlternative?.triggerReason}</p>
              </div>

              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200/80">
                <span className="font-bold text-blue-900 block mb-1">Nouvelle Route Recommandée :</span>
                <p className="text-blue-800 text-xs font-semibold">{activeMilestone.planBAlternative?.fallbackRoute}</p>
              </div>

              <div className="space-y-2">
                <span className="font-bold text-xs uppercase tracking-wider text-slate-500">Actions d'adaptation immédiates :</span>
                <div className="space-y-1.5">
                  {activeMilestone.planBAlternative?.adaptedActions.map((action, i) => (
                    <div key={i} className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                      <ChevronRight size={14} className="text-blue-600 shrink-0" />
                      <span>{action}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowPlanBModal(null)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all"
              >
                Fermer
              </button>
              <button
                onClick={() => {
                  onTriggerPlanB(showPlanBModal);
                  setShowPlanBModal(null);
                }}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <RotateCcw size={14} /> Recalculer le parcours avec le Plan B
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
