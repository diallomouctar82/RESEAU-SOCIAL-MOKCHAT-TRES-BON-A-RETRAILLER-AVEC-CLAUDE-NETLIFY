import React, { useState } from 'react';
import { 
    Sparkles, 
    ArrowRight, 
    CheckCircle2, 
    AlertTriangle, 
    MapPin, 
    Clock, 
    Users, 
    Layers, 
    ShieldAlert, 
    RotateCcw, 
    Calendar, 
    ExternalLink, 
    MessageSquare, 
    Phone, 
    Video, 
    FileText, 
    Check, 
    Flame,
    Zap,
    Scale,
    GraduationCap,
    ShoppingBag,
    Briefcase,
    Globe
} from 'lucide-react';
import { DossierParcours } from '../types';
import { AGENTS } from '../constants';

interface ParcoursDiagnosticHeroProps {
    parcours: DossierParcours;
    onNextActionClick: () => void;
    onConveneCouncil: () => void;
    onTriggerPlanB: () => void;
    onNavigateToTab?: (tab: string) => void;
    onOpenExpertHotline?: (agentId: string) => void;
}

export const ParcoursDiagnosticHero: React.FC<ParcoursDiagnosticHeroProps> = ({
    parcours,
    onNextActionClick,
    onConveneCouncil,
    onTriggerPlanB,
    onNavigateToTab,
    onOpenExpertHotline
}) => {
    const [isPlanBModalOpen, setIsPlanBModalOpen] = useState(false);

    const leadAgent = AGENTS.find(a => a.id === parcours.leadAgentId) || AGENTS[0];
    const currentStep = parcours.steps.find(s => s.status === 'in_progress') || parcours.steps[0];
    const completedTasksCount = parcours.tasks.filter(t => t.completed).length;
    const totalTasksCount = parcours.tasks.length;
    const completedStepsCount = parcours.steps.filter(s => s.status === 'completed').length;

    // Determine gateway destination based on active step
    const getGatewayTabFromStep = (step: typeof currentStep) => {
        if (!step) return 'chat';
        if (step.gatewayTab) return step.gatewayTab;
        if (step.gatewayModule === 'campus') return 'campus';
        if (step.gatewayModule === 'career') return 'career';
        if (step.gatewayModule === 'market') return 'shop';
        if (step.gatewayModule === 'legal') return 'legal';
        if (step.gatewayModule === 'wallet') return 'wallet';
        if (step.gatewayModule === 'safe') return 'world';
        return 'chat';
    };

    return (
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-brand-900 text-white rounded-3xl p-6 md:p-8 shadow-2xl border border-slate-800 relative overflow-hidden">
            {/* Ambient background glows */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-slate-800/40 rounded-full blur-[100px] pointer-events-none"></div>

            <div className="relative z-10 space-y-6">
                
                {/* Top bar: Header & Context */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-brand-500/20 text-blue-300 border border-brand-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                                <Sparkles size={12} className="text-amber-400" />
                                Moteur d'Orchestration Diallo OS
                            </span>
                            <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                                <Clock size={13} /> Échéance : <strong className="text-slate-200">{parcours.targetDate}</strong>
                            </span>
                            {parcours.scopeMode && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${
                                    parcours.scopeMode === 'family' ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' :
                                    parcours.scopeMode === 'organization' ? 'bg-brand-500/20 text-blue-300 border-brand-500/40' :
                                    'bg-slate-800 text-slate-400 border-slate-700'
                                }`}>
                                    {parcours.scopeMode === 'family' ? 'Mode Famille' : parcours.scopeMode === 'organization' ? 'Mode Organisation' : 'Mode Individuel'}
                                </span>
                            )}
                        </div>

                        <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight flex items-center gap-3">
                            {parcours.title}
                        </h2>
                        <p className="text-sm text-slate-300 mt-1 max-w-2xl">
                            {parcours.goal}
                        </p>
                    </div>

                    {/* Right side quick actions */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={onConveneCouncil}
                            className="bg-brand-600/30 hover:bg-brand-600/50 text-blue-200 border border-brand-500/40 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        >
                            <Users size={15} /> Réunir le Conseil
                        </button>

                        <button
                            onClick={onTriggerPlanB}
                            className="bg-slate-800/80 hover:bg-slate-700 text-amber-300 border border-amber-500/30 px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
                        >
                            <ShieldAlert size={15} /> Plan B & Pivot
                        </button>
                    </div>
                </div>

                {/* Main 4-Quadrant Diagnostic Matrix */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Quadrant 1: Où nous en sommes */}
                    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                                <span className="flex items-center gap-1.5 text-blue-300">
                                    <MapPin size={14} /> 1. Où nous en sommes
                                </span>
                                <span className="text-blue-400 font-extrabold text-sm">{parcours.progress}%</span>
                            </div>
                            
                            {/* Progress bar */}
                            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden mb-3">
                                <div 
                                    className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-700"
                                    style={{ width: `${parcours.progress}%` }}
                                />
                            </div>

                            <p className="text-xs font-semibold text-slate-200 line-clamp-2">
                                Étape {currentStep?.stepNumber || 1} / {parcours.steps.length} : {currentStep?.title}
                            </p>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Jalons validés :</span>
                            <span className="font-bold text-slate-200">{completedStepsCount} / {parcours.steps.length}</span>
                        </div>
                    </div>

                    {/* Quadrant 2: Ce qui a été réalisé */}
                    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center text-xs font-bold uppercase tracking-wider text-emerald-400 mb-2 gap-1.5">
                                <CheckCircle2 size={14} /> 2. Ce qui est réalisé
                            </div>
                            
                            <ul className="space-y-1.5 text-xs text-slate-300">
                                {parcours.steps.filter(s => s.status === 'completed').slice(0, 2).map((s, idx) => (
                                    <li key={idx} className="flex items-start gap-1.5 line-clamp-1">
                                        <Check size={12} className="text-emerald-400 shrink-0 mt-0.5" />
                                        <span className="truncate">{s.title}</span>
                                    </li>
                                ))}
                                {parcours.deliverables.length > 0 && (
                                    <li className="flex items-start gap-1.5 text-[11px] text-emerald-300">
                                        <Check size={12} className="shrink-0 mt-0.5" />
                                        <span>{parcours.deliverables.length} livrable(s) certifié(s)</span>
                                    </li>
                                )}
                            </ul>
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Tâches clôturées :</span>
                            <span className="font-bold text-emerald-400">{completedTasksCount} / {totalTasksCount}</span>
                        </div>
                    </div>

                    {/* Quadrant 3: Ce qui bloque ou alerte */}
                    <div className="bg-slate-900/70 backdrop-blur border border-slate-800 p-4 rounded-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center text-xs font-bold uppercase tracking-wider text-amber-400 mb-2 gap-1.5">
                                <AlertTriangle size={14} /> 3. Ce qui bloque / vigilance
                            </div>

                            {parcours.difficulties && parcours.difficulties.length > 0 ? (
                                <p className="text-xs text-amber-200 line-clamp-2 leading-relaxed">
                                    {parcours.difficulties[0]}
                                </p>
                            ) : (
                                <p className="text-xs text-slate-400 italic">
                                    Aucun blocage critique détecté. Progression nominale.
                                </p>
                            )}
                        </div>

                        <div className="pt-2 mt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                            <span>Risque estimé :</span>
                            <span className="font-bold text-emerald-400">Faible / Maîtrisé</span>
                        </div>
                    </div>

                    {/* Quadrant 4: Prochaine Action Immédiate (HERO CALL TO ACTION) */}
                    <div className="bg-gradient-to-br from-brand-600 to-brand-900 p-4 rounded-2xl flex flex-col justify-between shadow-xl text-white">
                        <div>
                            <div className="flex items-center text-xs font-extrabold uppercase tracking-wider text-amber-300 mb-1.5 gap-1.5">
                                <Zap size={14} className="fill-current" /> 4. Prochaine Action Directe
                            </div>
                            
                            <p className="text-xs font-medium text-white line-clamp-2 leading-snug mb-3">
                                {parcours.nextAction || currentStep?.description || "Poursuivre les actions en cours avec l'expert référent."}
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                const targetTab = getGatewayTabFromStep(currentStep);
                                if (onNavigateToTab && targetTab !== 'chat') {
                                    onNavigateToTab(targetTab);
                                } else {
                                    onNextActionClick();
                                }
                            }}
                            className="w-full min-h-11 bg-white text-brand-900 hover:bg-brand-50 font-black text-xs py-2.5 px-3 rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-brand-700"
                        >
                            <span>{currentStep?.gatewayActionLabel || "Exécuter maintenant"}</span>
                            <ArrowRight size={14} />
                        </button>
                    </div>

                </div>

                {/* Assigned Expert Team Bar */}
                <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-400">
                    <div className="flex items-center gap-3">
                        <span className="font-semibold text-slate-300">Équipe d'Experts dédiée :</span>
                        <div className="flex items-center -space-x-2">
                            {parcours.collaboratingAgentIds.map((agId) => {
                                const ag = AGENTS.find(a => a.id === agId);
                                if (!ag) return null;
                                return (
                                    <button
                                        key={ag.id}
                                        onClick={() => onOpenExpertHotline && onOpenExpertHotline(ag.id)}
                                        title={`${ag.name} (${ag.role}) - Cliquez pour ouvrir l'assistance`}
                                        className="relative group focus:outline-none"
                                    >
                                        <img 
                                            src={ag.avatarUrl}
                                            alt={ag.name}
                                            className="w-8 h-8 rounded-full border-2 border-slate-900 object-cover group-hover:scale-110 group-hover:border-blue-400 transition-transform shadow-md" 
                                        />
                                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded-md shadow-xl whitespace-nowrap z-20 border border-slate-700">
                                            {ag.name}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">Besoin d'un point d'orientation ?</span>
                        <button
                            onClick={() => onOpenExpertHotline && onOpenExpertHotline(leadAgent.id)}
                            className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                        >
                            <MessageSquare size={13} className="text-blue-400" />
                            Direct avec {leadAgent.name}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
