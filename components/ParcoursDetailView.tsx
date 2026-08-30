import React, { useState } from 'react';
import { 
    CheckCircle2, 
    Circle, 
    Clock, 
    ArrowRight, 
    Sparkles, 
    FileText, 
    Plus, 
    Trash2, 
    Edit3, 
    Download, 
    Upload, 
    MessageSquare, 
    Video, 
    Phone, 
    Layers, 
    ShieldCheck, 
    AlertTriangle, 
    ChevronRight, 
    BrainCircuit, 
    Send, 
    Share2, 
    Calendar, 
    Award, 
    ExternalLink, 
    Users, 
    Building2, 
    Scale, 
    ShoppingBag, 
    Briefcase, 
    GraduationCap, 
    HeartPulse, 
    Home, 
    Check, 
    RotateCcw,
    X,
    Lock,
    ShieldAlert,
    Compass
} from 'lucide-react';
import { DossierParcours, DossierStep, DossierTask, DossierDeliverable, DossierDocument, ActiveMemoryItem } from '../types';
import { AGENTS } from '../constants';
import { dossierService } from '../services/dossierService';
import { memoryService } from '../services/memory';
import { useGlobal } from '../contexts/GlobalContext';
import { generateJSON } from '../services/aiGateway';

interface ParcoursDetailViewProps {
    parcours: DossierParcours;
    onUpdateParcours: (updated: DossierParcours) => void;
    onNavigateToTab?: (tab: string, context?: any) => void;
    onOpenAgentChat?: (agentId: string, initialPrompt?: string) => void;
    onOpenCouncil?: () => void;
}

export const ParcoursDetailView: React.FC<ParcoursDetailViewProps> = ({
    parcours,
    onUpdateParcours,
    onNavigateToTab,
    onOpenAgentChat,
    onOpenCouncil
}) => {
    const { addNotification } = useGlobal();

    // Active sub-tab within the journey view
    const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'tasks' | 'documents' | 'experts' | 'memory' | 'planb'>('timeline');

    // Task creation state
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState<'low' | 'medium' | 'high'>('high');

    // Plan B state
    const [isGeneratingPlanB, setIsGeneratingPlanB] = useState(false);
    const [customPivotReason, setCustomPivotReason] = useState('');

    // Document / Deliverable creation modal
    const [showDeliverableModal, setShowDeliverableModal] = useState(false);
    const [deliverableTitle, setDeliverableTitle] = useState('');
    const [deliverableCategory, setDeliverableCategory] = useState('Attestation');
    const [isCertifyingDeliverable, setIsCertifyingDeliverable] = useState(false);

    // Active Memory item addition
    const [newMemKey, setNewMemKey] = useState('');
    const [newMemVal, setNewMemVal] = useState('');
    const [newMemLayer, setNewMemLayer] = useState<'personal' | 'parcours' | 'learning' | 'documentary' | 'conversational'>('parcours');

    const leadAgent = AGENTS.find(a => a.id === parcours.leadAgentId) || AGENTS[0];

    // Toggle Task completion
    const handleToggleTask = async (taskId: string) => {
        const updatedTasks = parcours.tasks.map(t => {
            if (t.id === taskId) {
                return { ...t, completed: !t.completed };
            }
            return t;
        });

        // Recalculate progress
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const newProgress = Math.round((completedCount / (updatedTasks.length || 1)) * 60 + (parcours.steps.filter(s => s.status === 'completed').length / (parcours.steps.length || 1)) * 40);

        const updated = {
            ...parcours,
            tasks: updatedTasks,
            progress: Math.min(100, Math.max(parcours.progress, newProgress))
        };

        onUpdateParcours(updated);
        await dossierService.persist();
    };

    // Add new task
    const handleAddTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTaskTitle.trim()) return;

        const newTask: DossierTask = {
            id: `task-${Date.now()}`,
            title: newTaskTitle.trim(),
            completed: false,
            assignedAgentId: parcours.leadAgentId,
            priority: newTaskPriority,
            deadline: 'Prochainement'
        };

        const updated = {
            ...parcours,
            tasks: [newTask, ...parcours.tasks]
        };

        onUpdateParcours(updated);
        setNewTaskTitle('');
        addNotification("Tâche Ajoutée", `Nouvelle tâche ajoutée au parcours.`, "info");
    };

    // Advance or toggle step status
    const handleStepStatusChange = async (stepId: string, newStatus: DossierStep['status']) => {
        const updatedSteps = parcours.steps.map(s => {
            if (s.id === stepId) {
                return {
                    ...s,
                    status: newStatus,
                    progress: newStatus === 'completed' ? 100 : newStatus === 'in_progress' ? 50 : 0
                };
            }
            return s;
        });

        const completedSteps = updatedSteps.filter(s => s.status === 'completed').length;
        const totalProgress = Math.round((completedSteps / updatedSteps.length) * 100);

        const updated = {
            ...parcours,
            steps: updatedSteps,
            progress: totalProgress
        };

        onUpdateParcours(updated);
        addNotification("Étape Mise à Jour", `Statut d'étape modifié avec succès.`, "success");
    };

    // Generate Dynamic Plan B Pivot with Gemini
    const handleGenerateDynamicPlanB = async () => {
        setIsGeneratingPlanB(true);
        try {
            const prompt = `L'utilisateur suit le parcours : "${parcours.title}" avec l'objectif : "${parcours.goal}".
            Un blocage est survenu ou un pivot est nécessaire : "${customPivotReason || 'Imprévu administratif ou réglementaire'}".
            Propose une stratégie alternative "PLAN B" réaliste, constructive et immédiate pour atteindre un résultat équivalent ou sécuriser la suite.
            Réponds en JSON avec :
            {
                "title": "Titre du Plan B",
                "triggerCondition": "Condition d'activation",
                "description": "Explication détaillée de la nouvelle trajectoire",
                "impactOnTimeline": "+X jours/semaines",
                "suggestedAgentId": "2",
                "revisedStepsSummary": "Résumé des nouvelles étapes prioritaires"
            }`;

            const parsed = await generateJSON<any>(prompt);
            const newPlanB = {
                id: `pb-${Date.now()}`,
                title: parsed.title || 'Plan B de Contingence',
                triggerCondition: parsed.triggerCondition || customPivotReason,
                description: parsed.description || 'Trajectoire alternative proposée par Diallo OS.',
                impactOnTimeline: parsed.impactOnTimeline || '+15 jours',
                suggestedAgentId: parsed.suggestedAgentId || '2',
                revisedStepsSummary: parsed.revisedStepsSummary || 'Réajustement des étapes clés'
            };

            const updated = {
                ...parcours,
                planBAlternatives: [newPlanB, ...(parcours.planBAlternatives || [])],
                nextAction: `Activer le Plan B : ${newPlanB.title}`
            };

            onUpdateParcours(updated);
            addNotification("Plan B Généré", "Une stratégie de pivot optimisée a été intégrée au parcours.", "warning");
            setCustomPivotReason('');
        } catch (e) {
            console.error(e);
            addNotification("Info Plan B", "Stratégie de secours enregistrée.", "info");
        } finally {
            setIsGeneratingPlanB(false);
        }
    };

    // Add Active Memory item
    const handleAddMemoryItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemKey.trim() || !newMemVal.trim()) return;

        const newMem = await memoryService.addOrUpdateMemory({
            category: 'decision',
            key: newMemKey,
            value: newMemVal,
            layer: newMemLayer,
            agentId: parcours.leadAgentId,
            dossierId: parcours.id
        });

        setNewMemKey('');
        setNewMemVal('');
        addNotification("Mémoire Active Enrichie", `Élément mémorisé dans la couche ${newMemLayer}.`, "success");
    };

    // Certify Deliverable
    const handleCreateCertifiedDeliverable = async () => {
        if (!deliverableTitle.trim()) return;
        setIsCertifyingDeliverable(true);

        setTimeout(() => {
            const newDeliv: DossierDeliverable = {
                id: `deliv-${Date.now()}`,
                title: deliverableTitle.trim(),
                description: `Document officiel certifié et validé par ${leadAgent.name} pour le parcours "${parcours.title}".`,
                category: deliverableCategory,
                status: 'final',
                createdAt: new Date().toLocaleDateString('fr-FR'),
                authorAgentName: leadAgent.name,
                gradeOrScore: 95,
                certificateHash: `LMAV-CERT-${Math.floor(Math.random()*900000)+100000}`
            };

            const updated = {
                ...parcours,
                deliverables: [newDeliv, ...parcours.deliverables]
            };

            onUpdateParcours(updated);
            setIsCertifyingDeliverable(false);
            setShowDeliverableModal(false);
            setDeliverableTitle('');
            addNotification("Livrable Certifié 📜", `Le livrable "${newDeliv.title}" a été signé et scellé.`, "success");
        }, 1200);
    };

    return (
        <div className="space-y-6">
            
            {/* Sub-Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-2">
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setActiveSubTab('timeline')}
                        className={`px-4 py-2 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                            activeSubTab === 'timeline'
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <Compass size={15} />
                        <span>Chronologie Point A ➔ Point B</span>
                    </button>

                    <button
                        onClick={() => setActiveSubTab('tasks')}
                        className={`px-4 py-2 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                            activeSubTab === 'tasks'
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <CheckCircle2 size={15} />
                        <span>Tâches ({parcours.tasks.filter(t => t.completed).length}/{parcours.tasks.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveSubTab('documents')}
                        className={`px-4 py-2 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                            activeSubTab === 'documents'
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <FileText size={15} />
                        <span>Livrables & Coffre ({parcours.deliverables.length + parcours.documents.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveSubTab('experts')}
                        className={`px-4 py-2 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                            activeSubTab === 'experts'
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <Users size={15} />
                        <span>Équipe d'Experts ({parcours.collaboratingAgentIds.length})</span>
                    </button>

                    <button
                        onClick={() => setActiveSubTab('planb')}
                        className={`px-4 py-2 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                            activeSubTab === 'planb'
                                ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20'
                                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
                        }`}
                    >
                        <ShieldAlert size={15} />
                        <span>Plan B & Pivots</span>
                    </button>

                    <button
                        onClick={() => setActiveSubTab('memory')}
                        className={`px-4 py-2 min-h-11 rounded-xl text-xs font-bold transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1 ${
                            activeSubTab === 'memory'
                                ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                    >
                        <BrainCircuit size={15} />
                        <span>Mémoire Active (5 Couches)</span>
                    </button>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={onOpenCouncil}
                        className="text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm"
                    >
                        <Users size={14} className="text-amber-400" />
                        Convoquer le Conseil
                    </button>
                </div>
            </div>

            {/* TAB 1: TIMELINE POINT A -> POINT B -> RÉSULTAT -> CONTINUITÉ */}
            {activeSubTab === 'timeline' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* POINT A: Starting Situation Card */}
                    <div className="bg-slate-50 border-2 border-blue-200 rounded-3xl p-5 md:p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-brand-600 text-white flex items-center justify-center font-black text-sm shadow-md">
                                    A
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 bg-brand-100 px-2 py-0.5 rounded-full">
                                        Point de Départ (Diagnostic Initial)
                                    </span>
                                    <h4 className="text-base font-black text-slate-900 mt-0.5">
                                        Situation Initiale & Compétences d'Entrée
                                    </h4>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500 font-semibold">
                                Initié le {parcours.startDate}
                            </span>
                        </div>

                        <p className="text-sm text-slate-700 leading-relaxed mb-4">
                            {parcours.pointA?.initialStatus || "Diagnostic initial recueilli avec l'expert référent. Identification des contraintes et validation des objectifs chiffrés."}
                        </p>

                        {/* Starting skills & constraints chips */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-3 border-t border-slate-200">
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1.5">
                                    Compétences / Atouts initiaux :
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(parcours.pointA?.startingSkills || ['Motivation', 'Bases métier']).map((sk, idx) => (
                                        <span key={idx} className="text-xs bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 font-medium">
                                            ✓ {sk}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <span className="text-[11px] font-bold uppercase text-amber-700 block mb-1.5">
                                    Contraintes / Délais à respecter :
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                    {(parcours.pointA?.constraints || ['Échéance fixée à ' + parcours.targetDate]).map((ct, idx) => (
                                        <span key={idx} className="text-xs bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 font-medium">
                                            ⚠️ {ct}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* INTERMEDIATE STEPS (THE JOURNEY) */}
                    <div className="space-y-4 pl-4 md:pl-8 border-l-2 border-dashed border-blue-300 ml-4 md:ml-6 relative">
                        {parcours.steps.map((step, index) => {
                            const stepAgent = AGENTS.find(a => a.id === step.assignedAgentId) || leadAgent;
                            const isCurrent = step.status === 'in_progress';
                            const isDone = step.status === 'completed';
                            const isBlocked = step.status === 'blocked';
                            const isPlanB = step.status === 'alternative_plan_b';

                            return (
                                <div 
                                    key={step.id} 
                                    className={`relative bg-white rounded-2xl p-5 border transition-all duration-300 ${
                                        isCurrent 
                                            ? 'border-brand-500 ring-2 ring-brand-100 shadow-lg' 
                                            : isDone 
                                            ? 'border-emerald-200 bg-emerald-50/20' 
                                            : isBlocked
                                            ? 'border-red-300 bg-red-50/20'
                                            : isPlanB
                                            ? 'border-amber-300 bg-amber-50/30'
                                            : 'border-slate-200 shadow-sm opacity-90'
                                    }`}
                                >
                                    {/* Timeline indicator node */}
                                    <div className={`absolute -left-[31px] md:-left-[47px] top-6 w-8 h-8 rounded-full border-4 border-white flex items-center justify-center text-xs font-black shadow-md ${
                                        isDone 
                                            ? 'bg-emerald-500 text-white' 
                                            : isCurrent 
                                            ? 'bg-brand-600 text-white animate-pulse' 
                                            : isBlocked
                                            ? 'bg-red-500 text-white'
                                            : 'bg-slate-200 text-slate-600'
                                    }`}>
                                        {isDone ? <Check size={14} /> : step.stepNumber}
                                    </div>

                                    {/* Step Header */}
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                                                isDone ? 'bg-emerald-100 text-emerald-800 border-emerald-300' :
                                                isCurrent ? 'bg-brand-100 text-brand-700 border-blue-300' :
                                                isBlocked ? 'bg-red-100 text-red-800 border-red-300' :
                                                'bg-slate-100 text-slate-600 border-slate-200'
                                            }`}>
                                                Étape {step.stepNumber} • {
                                                    isDone ? 'Validée & Clôturée' :
                                                    isCurrent ? 'En cours d’exécution' :
                                                    isBlocked ? 'Bloquée / Alerte' :
                                                    'En attente'
                                                }
                                            </span>

                                            {step.estimatedDuration && (
                                                <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                                                    <Clock size={12} /> {step.estimatedDuration}
                                                </span>
                                            )}
                                        </div>

                                        {/* Status Switcher Actions */}
                                        <div className="flex items-center gap-1.5">
                                            {!isDone && (
                                                <button
                                                    onClick={() => handleStepStatusChange(step.id, 'completed')}
                                                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                                                >
                                                    <Check size={13} /> Valider l'étape
                                                </button>
                                            )}
                                            {!isCurrent && !isDone && (
                                                <button
                                                    onClick={() => handleStepStatusChange(step.id, 'in_progress')}
                                                    className="bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold px-3 py-1.5 rounded-xl border border-blue-200 transition-colors"
                                                >
                                                    Activer
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Title & Description */}
                                    <h4 className="text-base font-bold text-slate-900 mb-1">
                                        {step.title}
                                    </h4>
                                    <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-4">
                                        {step.description}
                                    </p>

                                    {/* Bottom details & Gateway Actions */}
                                    <div className="pt-3 border-t border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/60 p-3 rounded-xl">
                                        
                                        {/* Assigned Expert */}
                                        <div className="flex items-center gap-2">
                                            <img 
                                                src={stepAgent.avatarUrl}
                                                alt={stepAgent.name} 
                                                className="w-7 h-7 rounded-full object-cover border border-slate-300"
                                            />
                                            <div className="text-xs">
                                                <span className="text-slate-500">Expert dédié :</span>{' '}
                                                <strong className="text-slate-800">{stepAgent.name}</strong>
                                            </div>
                                        </div>

                                        {/* Deliverable expected */}
                                        {step.deliverableTitle && (
                                            <div className="text-xs text-slate-600 flex items-center gap-1.5">
                                                <Award size={14} className="text-amber-500 shrink-0" />
                                                <span>Livrable : <strong>{step.deliverableTitle}</strong></span>
                                            </div>
                                        )}

                                        {/* Gateway button if present */}
                                        {step.gatewayActionLabel && onNavigateToTab && (
                                            <button
                                                onClick={() => onNavigateToTab(step.gatewayTab || (step.gatewayModule === 'campus' ? 'campus' : step.gatewayModule === 'market' ? 'shop' : 'chat'))}
                                                className="bg-white hover:bg-brand-50 text-brand-700 border border-blue-200 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-colors self-start md:self-auto"
                                            >
                                                <span>{step.gatewayActionLabel}</span>
                                                <ArrowRight size={13} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* POINT B: Final Target Goal Card */}
                    <div className="bg-gradient-to-br from-brand-900 via-slate-900 to-slate-950 text-white rounded-3xl p-5 md:p-6 shadow-xl border border-brand-900">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-9 h-9 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-sm shadow-md">
                                    B
                                </div>
                                <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                                        Point d'Arrivée (Objectif Concret Réussi)
                                    </span>
                                    <h4 className="text-base font-black text-white mt-0.5">
                                        Résultat Final & Attestation Officielle
                                    </h4>
                                </div>
                            </div>
                            <span className="text-xs text-blue-300 font-semibold">
                                Cible : {parcours.targetDate}
                            </span>
                        </div>

                        <p className="text-sm text-slate-200 leading-relaxed mb-4">
                            {parcours.pointB?.targetGoal || parcours.goal}
                        </p>

                        {/* Certification & Deliverable outcome */}
                        <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="text-slate-300 flex items-center gap-2">
                                <Award size={16} className="text-amber-400" />
                                <span>Attestation attendue : <strong>{parcours.pointB?.certificationExpected || 'Attestation de Réalisation & Certification'}</strong></span>
                            </div>

                            <button
                                onClick={() => setShowDeliverableModal(true)}
                                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow-md flex items-center justify-center gap-1.5 transition-transform active:scale-95"
                            >
                                <FileText size={14} />
                                Émettre un Livrable Certifié
                            </button>
                        </div>
                    </div>

                    {/* CONTINUITY PLAN CARD */}
                    {parcours.continuityPlan && (
                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-5 shadow-sm">
                            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase mb-2">
                                <Sparkles size={16} className="text-emerald-600" />
                                <span>Continuité & Pérennisation (Post-Réussite)</span>
                            </div>
                            <h5 className="font-bold text-slate-900 text-sm mb-1">
                                {parcours.continuityPlan.nextPhaseTitle}
                            </h5>
                            <ul className="space-y-1 text-xs text-slate-700">
                                {parcours.continuityPlan.recommendations.map((rec, i) => (
                                    <li key={i} className="flex items-center gap-1.5">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                        <span>{rec}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 2: TASKS & CHECKLISTS */}
            {activeSubTab === 'tasks' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Add Task Form */}
                    <form onSubmit={handleAddTask} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center gap-3">
                        <input 
                            type="text"
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            placeholder="Ajouter une action concrète à réaliser..."
                            className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 w-full"
                        />

                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <select
                                value={newTaskPriority}
                                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                                className="bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700"
                            >
                                <option value="high">Priorité Haute</option>
                                <option value="medium">Priorité Moyenne</option>
                                <option value="low">Priorité Basse</option>
                            </select>

                            <button
                                type="submit"
                                className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-1.5 whitespace-nowrap"
                            >
                                <Plus size={16} /> Ajouter
                            </button>
                        </div>
                    </form>

                    {/* Task List */}
                    <div className="space-y-2">
                        {parcours.tasks.map((task) => (
                            <div
                                key={task.id}
                                onClick={() => handleToggleTask(task.id)}
                                role="button"
                                tabIndex={0}
                                aria-pressed={task.completed}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handleToggleTask(task.id); } }}
                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 ${
                                    task.completed
                                        ? 'bg-slate-50/80 border-slate-200 text-slate-400 line-through'
                                        : 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm text-slate-900'
                                }`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-colors ${
                                        task.completed 
                                            ? 'bg-emerald-500 border-emerald-500 text-white' 
                                            : 'border-slate-300 hover:border-brand-500 bg-white'
                                    }`}>
                                        {task.completed && <Check size={14} />}
                                    </div>
                                    <span className="text-sm font-semibold truncate">
                                        {task.title}
                                    </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                                        task.priority === 'high' ? 'bg-red-50 text-red-700 border border-red-200' :
                                        task.priority === 'medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                        'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}>
                                        {task.priority}
                                    </span>
                                    {task.deadline && (
                                        <span className="text-xs text-slate-400">
                                            {task.deadline}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 3: DELIVERABLES & COFFRE */}
            {activeSubTab === 'documents' && (
                <div className="space-y-6 animate-fade-in">
                    
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-bold text-slate-900 text-base">
                                Livrables Certifiés & Pièces du Parcours
                            </h4>
                            <p className="text-xs text-slate-500">
                                Documents scellés avec hash d'authenticité et archivés dans le Coffre Sécurisé.
                            </p>
                        </div>

                        <button
                            onClick={() => setShowDeliverableModal(true)}
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md flex items-center gap-1.5"
                        >
                            <Plus size={15} /> Nouveau Livrable
                        </button>
                    </div>

                    {/* Deliverables Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {parcours.deliverables.map((deliv) => (
                            <div key={deliv.id} className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                            <ShieldCheck size={12} /> Certifié Final
                                        </span>
                                        <span className="text-[11px] text-slate-400 font-medium">
                                            {deliv.createdAt}
                                        </span>
                                    </div>

                                    <h5 className="font-bold text-slate-900 text-sm mb-1">
                                        {deliv.title}
                                    </h5>
                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
                                        {deliv.description}
                                    </p>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-[11px] text-slate-400 font-medium">
                                        Signé : {deliv.authorAgentName}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => addNotification("Téléchargement", `Téléchargement du livrable "${deliv.title}" certifié.`, "info")}
                                            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                            title="Télécharger"
                                            aria-label={`Télécharger ${deliv.title}`}
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            onClick={() => addNotification("Google Drive", `Export du livrable vers Google Drive réussi.`, "success")}
                                            className="p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-lg hover:bg-brand-50 text-brand-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                            title="Sauvegarder dans Google Drive"
                                            aria-label={`Sauvegarder ${deliv.title} dans Google Drive`}
                                        >
                                            <Share2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Uploaded raw documents */}
                        {parcours.documents.map((doc) => (
                            <div key={doc.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full">
                                            Justificatif
                                        </span>
                                        <span className="text-[11px] text-slate-400">
                                            {doc.fileSize || 'PDF'}
                                        </span>
                                    </div>
                                    <h5 className="font-bold text-slate-800 text-sm mb-1">
                                        {doc.title}
                                    </h5>
                                </div>

                                <div className="pt-2 text-xs text-slate-400 flex items-center justify-between">
                                    <span>Version {doc.version}</span>
                                    <button
                                        onClick={() => addNotification("Ouverture", `Ouverture de la pièce jointe ${doc.title}.`, "info")}
                                        className="text-brand-600 hover:underline font-semibold py-2 px-1 -my-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 rounded"
                                    >
                                        Consulter
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 4: EXPERTS HOTLINE */}
            {activeSubTab === 'experts' && (
                <div className="space-y-6 animate-fade-in">
                    <div className="text-xs text-slate-500 mb-2">
                        Ces experts composent votre cellule dédiée. Vous pouvez les solliciter en direct à tout moment.
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {parcours.collaboratingAgentIds.map((agId) => {
                            const ag = AGENTS.find(a => a.id === agId);
                            if (!ag) return null;
                            const isLead = ag.id === parcours.leadAgentId;

                            return (
                                <div key={ag.id} className={`p-5 rounded-2xl border bg-white flex flex-col justify-between shadow-sm ${isLead ? 'border-blue-400 ring-2 ring-brand-50' : 'border-slate-200'}`}>
                                    <div>
                                        <div className="flex items-center gap-3 mb-3">
                                            <img src={ag.avatarUrl} alt={ag.name} className="w-12 h-12 rounded-2xl object-cover border border-slate-200 shadow-sm" />
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <h5 className="font-bold text-slate-900 text-sm">{ag.name}</h5>
                                                    {isLead && (
                                                        <span className="text-[9px] font-black bg-brand-600 text-white px-1.5 py-0.5 rounded-md uppercase">
                                                            Pilote
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500">{ag.role}</p>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-600 line-clamp-2 mb-4 leading-relaxed">
                                            {ag.description}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                                        <button
                                            onClick={() => onOpenAgentChat && onOpenAgentChat(ag.id, `Bonjour ${ag.name}, faisons un point sur le parcours "${parcours.title}".`)}
                                            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <MessageSquare size={13} /> Chat Dédié
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (onNavigateToTab) onNavigateToTab('live');
                                                addNotification("Session Live", `Appel vidéo initié avec ${ag.name}.`, "info");
                                            }}
                                            className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                                            title="Lancer un appel vidéo"
                                            aria-label={`Lancer un appel vidéo avec ${ag.name}`}
                                        >
                                            <Video size={15} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB 5: PLAN B & PIVOTS */}
            {activeSubTab === 'planb' && (
                <div className="space-y-6 animate-fade-in">
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6 shadow-sm">
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase mb-2">
                            <ShieldAlert size={18} className="text-amber-600" />
                            <span>Générateur de Trajectoire Alternative (Plan B & Pivot)</span>
                        </div>
                        <p className="text-xs text-slate-600 mb-4 max-w-xl leading-relaxed">
                            En cas de rejet de visa, de changement réglementaire, de devis dépassé ou d'échec d'examen, Diallo OS recalcule instantanément une trajectoire de contournement sans perdre vos acquis.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-2">
                            <input 
                                type="text"
                                value={customPivotReason}
                                onChange={(e) => setCustomPivotReason(e.target.value)}
                                placeholder="Indiquez l'imprévu (ex: Refus de visa 3D, délai fournisseur allongé, budget limité)..."
                                className="flex-1 bg-white border border-amber-300 rounded-xl px-4 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                            <button
                                onClick={handleGenerateDynamicPlanB}
                                disabled={isGeneratingPlanB}
                                className="bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center justify-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
                            >
                                {isGeneratingPlanB ? <RotateCcw className="animate-spin" size={15} /> : <Sparkles size={15} />}
                                Calculer le Plan B
                            </button>
                        </div>
                    </div>

                    {/* Saved Plan B alternatives */}
                    <div className="space-y-3">
                        {(parcours.planBAlternatives || []).map((pb) => (
                            <div key={pb.id} className="bg-white border border-amber-200 rounded-2xl p-5 shadow-sm hover:border-amber-400 transition-colors">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-900 px-2.5 py-0.5 rounded-full border border-amber-300">
                                        {pb.triggerCondition}
                                    </span>
                                    <span className="text-xs font-bold text-slate-500">
                                        Délai : {pb.impactOnTimeline}
                                    </span>
                                </div>
                                <h5 className="font-bold text-slate-900 text-base mb-1">{pb.title}</h5>
                                <p className="text-xs text-slate-600 leading-relaxed mb-3">{pb.description}</p>
                                
                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-500">Conseiller recommandé : {AGENTS.find(a => a.id === pb.suggestedAgentId)?.name || 'Directeur Diallo'}</span>
                                    <button 
                                        onClick={() => {
                                            const updated = {
                                                ...parcours,
                                                nextAction: `Activer le plan alternatif : ${pb.title}`
                                            };
                                            onUpdateParcours(updated);
                                            addNotification("Plan B Activé", `La trajectoire "${pb.title}" est maintenant active.`, "warning");
                                        }}
                                        className="bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold px-3 py-1.5 rounded-lg border border-amber-300 transition-colors"
                                    >
                                        Basculer sur ce Plan B
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* TAB 6: ACTIVE MEMORY EXPLORER */}
            {activeSubTab === 'memory' && (
                <div className="space-y-6 animate-fade-in">
                    
                    {/* Add memory entry */}
                    <form onSubmit={handleAddMemoryItem} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-600">
                            Enrichir la Mémoire Active du Parcours :
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <select
                                value={newMemLayer}
                                onChange={(e) => setNewMemLayer(e.target.value as any)}
                                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-700"
                            >
                                <option value="parcours">Couche Parcours (Jalons / Décisions)</option>
                                <option value="personal">Couche Personnelle (Identité / Profil)</option>
                                <option value="learning">Couche Apprentissage (Compétences)</option>
                                <option value="documentary">Couche Documentaire (Contrats / Preuves)</option>
                                <option value="conversational">Couche Conversationnelle (Conseils)</option>
                            </select>
                            <input 
                                type="text" 
                                value={newMemKey} 
                                onChange={(e) => setNewMemKey(e.target.value)} 
                                placeholder="Clé / Sujet (ex: Choix du statut SAS)" 
                                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                            />
                            <input 
                                type="text" 
                                value={newMemVal} 
                                onChange={(e) => setNewMemVal(e.target.value)} 
                                placeholder="Détail mémorisé (ex: Capital fixé à 10 000€)" 
                                className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center gap-1"
                        >
                            <Plus size={14} /> Mémoriser dans Diallo OS
                        </button>
                    </form>

                    {/* Decisions history */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
                        <h5 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                            <BrainCircuit size={16} className="text-brand-600" />
                            Décisions Actives & Orientations Validées
                        </h5>
                        <ul className="space-y-2 text-xs text-slate-700">
                            {parcours.decisions.map((dec, i) => (
                                <li key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                    <Check size={14} className="text-emerald-500 shrink-0 mt-0.5" />
                                    <span>{dec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* MODAL: CREATE CERTIFIED DELIVERABLE */}
            {showDeliverableModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-brand-600">
                                <Award size={20} />
                                <h4 className="font-bold text-slate-900 text-base">Émettre un Livrable Certifié</h4>
                            </div>
                            <button onClick={() => setShowDeliverableModal(false)} aria-label="Fermer" className="p-2.5 min-w-11 min-h-11 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500">
                                <X size={18} />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500">
                            Génère une attestation officielle avec signature cryptographique de l'expert référent.
                        </p>

                        <div className="space-y-3">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Titre du livrable :</label>
                                <input 
                                    type="text"
                                    value={deliverableTitle}
                                    onChange={(e) => setDeliverableTitle(e.target.value)}
                                    placeholder="Ex: Attestation de Maîtrise B2 / Rapport de Cadrage Commercial"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase block mb-1">Catégorie :</label>
                                <select
                                    value={deliverableCategory}
                                    onChange={(e) => setDeliverableCategory(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-800"
                                >
                                    <option value="Attestation">Attestation de Réussite</option>
                                    <option value="Rapport Technique">Rapport Technique</option>
                                    <option value="Contrat Juridique">Contrat / Statuts</option>
                                    <option value="Bilan Financier">Bilan Financier & BFR</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-2 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowDeliverableModal(false)}
                                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleCreateCertifiedDeliverable}
                                disabled={isCertifyingDeliverable || !deliverableTitle.trim()}
                                className="bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-brand-600 text-white font-bold text-xs px-5 py-2 rounded-xl shadow-md flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
                            >
                                {isCertifyingDeliverable ? "Certification en cours..." : "Sceller & Signer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
