import React, { useState, useEffect } from 'react';
import { 
    FolderKanban, 
    MessageSquare, 
    Users, 
    GraduationCap, 
    FileText, 
    BrainCircuit, 
    Plus, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    Sparkles, 
    Search, 
    Filter, 
    Play, 
    Award, 
    ShieldCheck, 
    AlertTriangle, 
    ChevronRight, 
    Layers, 
    Check, 
    Trash2, 
    Edit3, 
    Download, 
    Camera, 
    Mic, 
    RefreshCw, 
    Calendar, 
    Send,
    BookOpen,
    HelpCircle,
    Eye,
    Briefcase,
    Building2,
    DollarSign,
    Scale,
    HeartPulse,
    Compass,
    Phone,
    Video,
    UserCheck,
    Bot,
    Upload,
    SlidersHorizontal,
    Globe2
} from 'lucide-react';
import { AGENTS, DEFAULT_DOSSIERS, INITIAL_COMPETENCIES } from '../constants';
import { Agent, DossierParcours, DossierStep, DossierTask, DossierDeliverable, DossierCategory, ActiveMemoryItem, CompetencyRecord, UserProfile } from '../types';
import { dossierService } from '../services/dossierService';
import { memoryService } from '../services/memory';
import { ChatInterface } from './ChatInterface';
import { LiveSession } from './LiveSession';
import { ExpertsCatalogue } from './ExpertsCatalogue';
import { ChefDeProjetSuite } from './ChefDeProjetSuite';
import { UnifiedCouncilRoom } from './UnifiedCouncilRoom';
import { generateText, generateJSON } from '../services/aiGateway';
import { useGlobal } from '../contexts/GlobalContext';

interface ExpertsHubProps {
    userProfile: UserProfile;
    initialTab?: 'catalogue' | 'dossiers' | 'session' | 'chef-projet' | 'council' | 'education' | 'bureau' | 'memory';
    onNavigate?: (tab: string) => void;
}

export const ExpertsHub: React.FC<ExpertsHubProps> = ({ userProfile, initialTab = 'catalogue', onNavigate }) => {
    const { addNotification } = useGlobal();
    const [activeTab, setActiveTab] = useState<'catalogue' | 'dossiers' | 'session' | 'chef-projet' | 'council' | 'education' | 'bureau' | 'memory'>(initialTab);
    
    // Dossiers State
    const [dossiers, setDossiers] = useState<DossierParcours[]>([]);
    const [selectedDossier, setSelectedDossier] = useState<DossierParcours | null>(null);
    const [dossierFilter, setDossierFilter] = useState<string>('all');
    const [showNewDossierModal, setShowNewDossierModal] = useState(false);
    
    // New Dossier Form
    const [newTitle, setNewTitle] = useState('');
    const [newCategory, setNewCategory] = useState<DossierCategory>('projet');
    const [newGoal, setNewGoal] = useState('');
    const [newLeadAgent, setNewLeadAgent] = useState('8'); // Directeur Diallo
    const [newTargetDate, setNewTargetDate] = useState('Dans 3 mois');

    // Selected Agent for Session & Live Call
    const [selectedAgent, setSelectedAgent] = useState<Agent>(AGENTS.find(a => a.id === '8') || AGENTS[0]);
    const [initialSessionMessage, setInitialSessionMessage] = useState<string | undefined>(undefined);
    const [isLiveCallActive, setIsLiveCallActive] = useState<boolean>(false);

    // Active Memory State
    const [memories, setMemories] = useState<ActiveMemoryItem[]>([]);
    const [memoryFilter, setMemoryFilter] = useState<string>('all');
    const [newMemKey, setNewMemKey] = useState('');
    const [newMemValue, setNewMemValue] = useState('');
    const [newMemCat, setNewMemCat] = useState<ActiveMemoryItem['category']>('decision');

    // Competencies State
    const [competencies, setCompetencies] = useState<CompetencyRecord[]>(INITIAL_COMPETENCIES);

    // Bureau Numérique State
    const [docType, setDocType] = useState<'contract' | 'report' | 'letter' | 'budget'>('report');
    const [docTitle, setDocTitle] = useState('');
    const [docContextInput, setDocContextInput] = useState('');
    const [generatedDocContent, setGeneratedDocContent] = useState<string | null>(null);
    const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);

    // École Numérique State
    const [academicLevel, setAcademicLevel] = useState<string>('Supérieur / Professionnel');
    const [examSubject, setExamSubject] = useState<string>('Gestion de Projet & Stratégie');
    const [examQuestion, setExamQuestion] = useState<string | null>(null);
    const [examUserAnswer, setExamUserAnswer] = useState<string>('');
    const [examEvaluation, setExamEvaluation] = useState<{ score: number; feedback: string; status: 'acquis' | 'en_cours' | 'a_renforcer' } | null>(null);
    const [isEvaluatingExam, setIsEvaluatingExam] = useState(false);

    useEffect(() => {
        loadAllData();
    }, []);

    // LOOP 13/17 (mémoire contextuelle, multi-appareils) : un ajout/une
    // modification/une suppression de mémoire sur un autre appareil déjà
    // ouvert apparaît désormais ici en direct, au lieu de rester invisible
    // jusqu'au rechargement complet de la page.
    useEffect(() => {
        const unsubscribe = memoryService.subscribeToChanges(() => {
            memoryService.getActiveMemories().then(setMemories);
        });
        return unsubscribe;
    }, []);

    const loadAllData = async () => {
        const loadedDossiers = await dossierService.getAllDossiers();
        setDossiers(loadedDossiers);
        if (loadedDossiers.length > 0 && !selectedDossier) {
            setSelectedDossier(loadedDossiers[0]);
        }

        const loadedMemories = await memoryService.getActiveMemories();
        setMemories(loadedMemories);
    };

    // --- DOSSIER ACTIONS ---
    const handleCreateDossier = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newTitle.trim() || !newGoal.trim()) return;

        const created = await dossierService.createDossier({
            title: newTitle,
            category: newCategory,
            goal: newGoal,
            leadAgentId: newLeadAgent,
            collaboratingAgentIds: [newLeadAgent, '2', '3'],
            targetDate: newTargetDate
        });

        setDossiers(prev => [created, ...prev]);
        setSelectedDossier(created);
        setShowNewDossierModal(false);
        setNewTitle('');
        setNewGoal('');
        addNotification("Parcours Initialisé", `Le dossier "${created.title}" a été créé avec succès.`, "success");
    };

    const handleToggleTask = async (taskId: string) => {
        if (!selectedDossier) return;
        const updated = await dossierService.toggleTask(selectedDossier.id, taskId);
        if (updated) {
            setSelectedDossier({ ...updated });
            setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));
        }
    };

    const handleAdvanceStep = async (stepId: string) => {
        if (!selectedDossier) return;
        const updated = await dossierService.updateStepStatus(selectedDossier.id, stepId, 'completed', 100);
        if (updated) {
            setSelectedDossier({ ...updated });
            setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));
            addNotification("Étape Validée", "L'étape a été clôturée et enregistrée dans le parcours.", "success");
        }
    };

    const handleLaunchSessionForDossier = (dossier: DossierParcours) => {
        const lead = AGENTS.find(a => a.id === dossier.leadAgentId) || AGENTS[0];
        setSelectedAgent(lead);
        setSelectedDossier(dossier);
        setInitialSessionMessage(`Bonjour ${lead.name}. Je souhaite avancer sur mon dossier "${dossier.title}". Prochaine action recommandée : ${dossier.nextAction}. Faisons le point étape par étape.`);
        setActiveTab('session');
    };

    // --- AGENT ACTIONS FROM CATALOGUE ---
    const handleSelectAgentForChat = (agent: Agent, prompt?: string) => {
        setSelectedAgent(agent);
        if (prompt) {
            setInitialSessionMessage(prompt);
        } else {
            setInitialSessionMessage(undefined);
        }
        setActiveTab('session');
    };

    const handleStartCallWithAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsLiveCallActive(true);
    };

    const handleStartVideoWithAgent = (agent: Agent) => {
        setSelectedAgent(agent);
        setIsLiveCallActive(true);
    };

    const handleCreateDossierWithAgent = (agent: Agent) => {
        setNewLeadAgent(agent.id);
        setShowNewDossierModal(true);
    };

    // --- ACTIVE MEMORY ACTIONS ---
    const handleAddMemory = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMemKey.trim() || !newMemValue.trim()) return;

        const created = await memoryService.addOrUpdateMemory({
            category: newMemCat,
            key: newMemKey,
            value: newMemValue,
            agentId: selectedAgent.id,
            dossierId: selectedDossier?.id,
            confidence: 0.98
        });

        setMemories(prev => [created, ...prev]);
        setNewMemKey('');
        setNewMemValue('');
        addNotification("Mémoire Active", "Élément mémorisé avec succès.", "success");
    };

    const handleDeleteMemory = async (id: string) => {
        await memoryService.deleteMemory(id);
        setMemories(prev => prev.filter(m => m.id !== id));
        addNotification("Mémoire Mise à Jour", "Élément supprimé de la mémoire active.", "info");
    };

    // --- BUREAU NUMÉRIQUE DOCUMENT GENERATION ---
    const handleGenerateOfficialDocument = async () => {
        if (!docTitle.trim()) return;
        setIsGeneratingDoc(true);
        try {
            const prompt = `En tant qu'expert professionnel de haut niveau de la famille Diallo, rédige un document officiel formel, rigoureux, complet et prêt à l'emploi.
            Type de document : ${docType}
            Titre : ${docTitle}
            Dossier concerné : ${selectedDossier?.title || 'Général'}
            Contexte et éléments spécifiques fournis par l'usager : ${docContextInput}
            Rédige avec toutes les mentions d'usage, clauses légales/techniques, structure soignée et présentation impeccable.`;

            const resText = await generateText(prompt);

            const content = resText || 'Document généré avec succès.';
            setGeneratedDocContent(content);

            // Enregistrer comme livrable si un dossier est actif
            if (selectedDossier) {
                await dossierService.addDeliverable(selectedDossier.id, {
                    title: docTitle,
                    description: `Document officiel rédigé par ${selectedAgent.name}.`,
                    category: docType === 'contract' ? 'legal' : docType === 'budget' ? 'financial' : 'official',
                    status: 'final',
                    authorAgentName: selectedAgent.name,
                    content: content
                });
                addNotification("Livrable Archivé", `Le document "${docTitle}" a été rédigé et rattaché au dossier "${selectedDossier.title}".`, "success");
            }
        } catch (e: any) {
            addNotification("Erreur", "Impossible de rédiger le document.", "warning");
        } finally {
            setIsGeneratingDoc(false);
        }
    };

    // --- ÉCOLE NUMÉRIQUE EXAM GENERATION & EVALUATION ---
    const handleGenerateExamQuestion = async () => {
        setIsEvaluatingExam(true);
        setExamEvaluation(null);
        setExamUserAnswer('');
        try {
            const prompt = `Tu es Professeur Diallo, Doyen de l'Éducation.
            Génère une question d'évaluation approfondie et concrète de niveau : ${academicLevel} sur le sujet : "${examSubject}".
            La question doit évaluer la maîtrise conceptuelle et pratique de l'apprenant (mise en situation, calcul ou cas pratique).`;

            const resText = await generateText(prompt);

            setExamQuestion(resText || 'Question prête.');
        } catch (e: any) {
            addNotification("Erreur", "Impossible de générer la question.", "warning");
        } finally {
            setIsEvaluatingExam(false);
        }
    };

    const handleEvaluateExamAnswer = async () => {
        if (!examUserAnswer.trim() || !examQuestion) return;
        setIsEvaluatingExam(true);
        try {
            const prompt = `Tu es Professeur Diallo. Évalue la réponse de l'étudiant avec bienveillance et rigueur.
            Niveau : ${academicLevel}
            Question : ${examQuestion}
            Réponse de l'étudiant : ${examUserAnswer}

            Réponds STRICTEMENT au format JSON :
            {
              "score": 85, // Note sur 100
              "status": "acquis" | "en_cours" | "a_renforcer",
              "feedback": "Commentaire pédagogique détaillé, points forts et axes d'amélioration précis."
            }`;

            const parsed = (await generateJSON<any>(prompt)) || {};
            setExamEvaluation(parsed);

            // Mémoriser le résultat dans la mémoire active
            await memoryService.addOrUpdateMemory({
                category: 'skill',
                key: `Évaluation: ${examSubject}`,
                value: `Score: ${parsed.score}/100 - Statut: ${parsed.status}. ${parsed.feedback}`,
                agentId: '4'
            });

            addNotification("Évaluation Clôturée", `Score obtenu : ${parsed.score}/100. Résultat mémorisé.`, "success");
        } catch (e: any) {
            addNotification("Erreur", "Impossible d'évaluer la réponse.", "warning");
        } finally {
            setIsEvaluatingExam(false);
        }
    };

    // Filtered Dossiers
    const filteredDossiers = dossiers.filter(d => {
        if (dossierFilter === 'all') return true;
        return d.category === dossierFilter;
    });

    // Filtered Memories
    const filteredMemories = memories.filter(m => {
        if (memoryFilter === 'all') return true;
        return m.category === memoryFilter;
    });

    return (
        <div className="flex flex-col h-full bg-slate-100 overflow-hidden">
            
            {/* 1. TOP HEADER & MAIN NAVIGATION BAR */}
            <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0 shadow-xs z-10">
                {/* DEC-2026-055 : le titre et le sous-titre ne sont plus
                    affichés — le panneau des experts doit être au premier
                    plan dès l'entrée. Le titre reste lisible par les
                    lecteurs d'écran. */}
                <h1 className="sr-only">Espace Experts</h1>

                {/* Main Navigation Tabs — le voile dégradé (mobile) rend le
                    débordement horizontal visible : la barre est masquée
                    (no-scrollbar) et les onglets hors écran passaient
                    inaperçus sur téléphone. */}
                <div className="relative w-full md:w-auto">
                <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('catalogue')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'catalogue' 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <Users size={14} /> Équipe & Experts
                    </button>

                    <button
                        onClick={() => setActiveTab('dossiers')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'dossiers' 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <FolderKanban size={14} /> Parcours & Dossiers ({dossiers.length})
                    </button>

                    <button
                        onClick={() => setActiveTab('session')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'session' 
                                ? 'bg-blue-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <MessageSquare size={14} /> Entretien Multimodal
                    </button>

                    <button
                        onClick={() => setActiveTab('chef-projet')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'chef-projet' 
                                ? 'bg-gradient-to-r from-blue-700 to-indigo-700 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <Layers size={14} /> Chef de Projet (10 Phases)
                    </button>

                    <button
                        onClick={() => setActiveTab('council')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'council' 
                                ? 'bg-indigo-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <Sparkles size={14} /> Conseil des Experts
                    </button>

                    <button
                        onClick={() => setActiveTab('bureau')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'bureau' 
                                ? 'bg-purple-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <FileText size={14} /> Bureau Numérique
                    </button>

                    <button
                        onClick={() => setActiveTab('education')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'education' 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <GraduationCap size={14} /> École Numérique
                    </button>

                    <button
                        onClick={() => setActiveTab('memory')}
                        className={`px-3.5 py-2 rounded-2xl transition-all flex items-center gap-1.5 whitespace-nowrap ${
                            activeTab === 'memory' 
                                ? 'bg-blue-600 text-white shadow-xs' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                        }`}
                    >
                        <BrainCircuit size={14} /> Mémoire Active
                    </button>
                </div>
                <div aria-hidden="true" className="md:hidden pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white to-transparent" />
                </div>
            </div>

            {/* 2. MAIN ACTIVE VIEW CONTAINER */}
            <div className="flex-1 overflow-hidden relative">
                
                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 1: CATALOGUE DES EXPERTS IA & HUMAINS VÉRIFIÉS
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'catalogue' && (
                    <ExpertsCatalogue 
                        onSelectAgentForChat={handleSelectAgentForChat}
                        onStartCallWithAgent={handleStartCallWithAgent}
                        onStartVideoWithAgent={handleStartVideoWithAgent}
                        onCreateDossierWithAgent={handleCreateDossierWithAgent}
                        onShareDocWithAgent={(agent) => {
                            setSelectedAgent(agent);
                            setActiveTab('bureau');
                        }}
                        dossiers={dossiers}
                    />
                )}

                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 2: PARCOURS DE VIE & DOSSIERS ACTIFS (5 ÉTAPES & SUIVI LONGITUDINAL)
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'dossiers' && (
                    <div className="h-full flex flex-col md:flex-row overflow-hidden">
                        
                        {/* Dossiers Sidebar */}
                        <div className="w-full md:w-80 lg:w-96 bg-white border-r border-slate-200 flex flex-col shrink-0">
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center">
                                <div>
                                    <h2 className="font-bold text-sm text-slate-800">Mes Parcours ({dossiers.length})</h2>
                                    <p className="text-[11px] text-slate-400">Objectifs suivis dans le temps</p>
                                </div>
                                <button
                                    onClick={() => setShowNewDossierModal(true)}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs transition-all"
                                >
                                    <Plus size={14} /> Nouveau
                                </button>
                            </div>

                            {/* Category Filter Pills */}
                            <div className="px-4 py-2 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100">
                                {['all', 'projet', 'education', 'carriere', 'administration', 'sante'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setDossierFilter(cat)}
                                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize whitespace-nowrap transition-all ${
                                            dossierFilter === cat 
                                                ? 'bg-slate-900 text-white' 
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                        }`}
                                    >
                                        {cat === 'all' ? 'Tous' : cat}
                                    </button>
                                ))}
                            </div>

                            {/* Dossiers List */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
                                {filteredDossiers.map(dossier => {
                                    const lead = AGENTS.find(a => a.id === dossier.leadAgentId) || AGENTS[0];
                                    const isSelected = selectedDossier?.id === dossier.id;

                                    return (
                                        <div
                                            key={dossier.id}
                                            onClick={() => setSelectedDossier(dossier)}
                                            className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                                isSelected 
                                                    ? 'bg-blue-50/80 border-blue-500 shadow-xs ring-1 ring-blue-500' 
                                                    : 'bg-white border-slate-200/80 hover:bg-slate-50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-1.5">
                                                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                                                    {dossier.category}
                                                </span>
                                                <span className="text-[11px] font-black text-blue-600">
                                                    {dossier.progress}%
                                                </span>
                                            </div>

                                            <h3 className="font-bold text-xs text-slate-900 line-clamp-1 mb-1">{dossier.title}</h3>
                                            
                                            {/* Progress Bar */}
                                            <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden mb-2">
                                                <div 
                                                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                                                    style={{ width: `${dossier.progress}%` }}
                                                />
                                            </div>

                                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                                                <div className="flex items-center gap-1.5">
                                                    <img src={lead.avatarUrl} className="w-4 h-4 rounded-full object-cover" />
                                                    <span className="truncate max-w-[120px]">{lead.name}</span>
                                                </div>
                                                <span className="text-[10px] text-slate-400">{dossier.lastActiveDate}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Dossier Detail Roadmap View */}
                        <div className="flex-1 bg-slate-50 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
                            {selectedDossier ? (
                                <div className="max-w-4xl mx-auto space-y-6">
                                    
                                    {/* Dossier Header Card */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                                        {selectedDossier.category}
                                                    </span>
                                                    <span className="text-xs text-slate-400">Échéance cible : {selectedDossier.targetDate}</span>
                                                </div>
                                                <h2 className="text-xl sm:text-2xl font-black text-slate-900">{selectedDossier.title}</h2>
                                            </div>

                                            <button
                                                onClick={() => handleLaunchSessionForDossier(selectedDossier)}
                                                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all shrink-0"
                                            >
                                                <MessageSquare size={16} /> Continuer avec l'Expert
                                            </button>
                                        </div>

                                        {/* Goal Box */}
                                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Objectif Chiffré & Validé</p>
                                            <p className="text-xs sm:text-sm text-slate-800 font-medium leading-relaxed">{selectedDossier.goal}</p>
                                        </div>

                                        {/* Next Action Banner */}
                                        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-2 text-xs text-emerald-900 font-medium">
                                                <Sparkles size={18} className="text-emerald-600 shrink-0" />
                                                <span><strong>Prochaine Action Recommandée :</strong> {selectedDossier.nextAction}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* 5-Step Continuous Accompaniment Roadmap */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                            <Layers size={18} className="text-blue-600" />
                                            Feuille de Route & Jalons de Réalisation
                                        </h3>

                                        <div className="space-y-3">
                                            {selectedDossier.steps.map((step, idx) => {
                                                const assigned = AGENTS.find(a => a.id === step.assignedAgentId) || AGENTS[0];
                                                const isDone = step.status === 'completed';
                                                const isInProgress = step.status === 'in_progress';

                                                return (
                                                    <div 
                                                        key={step.id}
                                                        className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                                                            isDone 
                                                                ? 'bg-slate-50 border-slate-200 text-slate-500' 
                                                                : isInProgress
                                                                ? 'bg-blue-50/60 border-blue-300 ring-1 ring-blue-500/20'
                                                                : 'bg-white border-slate-200'
                                                        }`}
                                                    >
                                                        <div className="space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                                                    isDone ? 'bg-emerald-600 text-white' : isInProgress ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                                                                }`}>
                                                                    {isDone ? '✓' : step.stepNumber}
                                                                </span>
                                                                <h4 className="font-bold text-xs sm:text-sm text-slate-900">{step.title}</h4>
                                                            </div>
                                                            <p className="text-xs text-slate-600">{step.description}</p>
                                                            {step.deliverableTitle && (
                                                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-100/60 px-2 py-0.5 rounded-md">
                                                                    <FileText size={12} /> Livrable : {step.deliverableTitle}
                                                                </span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-2 self-end sm:self-center">
                                                            {!isDone && (
                                                                <button
                                                                    onClick={() => handleAdvanceStep(step.id)}
                                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-all shadow-xs"
                                                                >
                                                                    <Check size={14} /> Valider l'Étape
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Action Tasks Check-list */}
                                    <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                                        <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                            <CheckCircle2 size={18} className="text-emerald-600" />
                                            Tâches Opérationnelles & Formalités
                                        </h3>

                                        <div className="space-y-2">
                                            {selectedDossier.tasks.map(task => (
                                                <div 
                                                    key={task.id}
                                                    onClick={() => handleToggleTask(task.id)}
                                                    className="p-3.5 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-200 flex items-center gap-3 cursor-pointer transition-all"
                                                >
                                                    <input 
                                                        type="checkbox" 
                                                        checked={task.completed} 
                                                        onChange={() => {}}
                                                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 pointer-events-none"
                                                    />
                                                    <span className={`text-xs font-medium flex-1 ${task.completed ? 'line-through text-slate-400' : 'text-slate-800 font-bold'}`}>
                                                        {task.title}
                                                    </span>
                                                    {task.priority === 'high' && (
                                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-100 text-red-700 rounded-md">
                                                            Prioritaire
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3">
                                    <FolderKanban size={48} className="text-slate-300" />
                                    <h3 className="font-bold text-slate-700">Aucun dossier sélectionné</h3>
                                    <p className="text-xs text-slate-400 max-w-sm">
                                        Créez un nouveau parcours de vie pour bénéficier d'un accompagnement longitudinal de bout en bout.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 3: ENTRETIEN MULTIMODAL (CHAT, CAMÉRA HUD, AUDIO LIVE)
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'session' && (
                    <div className="h-full flex flex-col overflow-hidden">
                        <ChatInterface 
                            agent={selectedAgent} 
                            initialMessage={initialSessionMessage}
                            onStartCall={() => setIsLiveCallActive(true)}
                        />
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 4: CHEF DE PROJET IA (DIRECTEUR DIALLO) - 10 PHASES
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'chef-projet' && (
                    <ChefDeProjetSuite 
                        activeDossier={selectedDossier}
                        onAttachDeliverableToDossier={async (deliv) => {
                            if (selectedDossier) {
                                await dossierService.addDeliverable(selectedDossier.id, {
                                    title: deliv.title,
                                    description: 'Livrable produit dans la suite Chef de Projet.',
                                    category: 'projet',
                                    status: 'final',
                                    authorAgentName: 'Chef de Projet Diallo',
                                    content: deliv.content
                                });
                                addNotification("Livrable Archivé", `Document rattaché au dossier "${selectedDossier.title}".`, "success");
                            }
                        }}
                        onNotification={addNotification}
                    />
                )}

                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 5: CONSEIL DES EXPERTS (RÉUNIR LE CONSEIL)
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'council' && (
                    <UnifiedCouncilRoom 
                        activeDossier={selectedDossier}
                        onAttachStrategyToDossier={async (strat) => {
                            if (selectedDossier) {
                                await dossierService.addDeliverable(selectedDossier.id, {
                                    title: strat.title,
                                    description: 'Stratégie arrêtée en Conseil des Experts.',
                                    category: 'strategy',
                                    status: 'final',
                                    authorAgentName: 'Conseil des Experts Diallo',
                                    content: strat.content
                                });
                            }
                        }}
                        onNotification={addNotification}
                    />
                )}

                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 6: BUREAU NUMÉRIQUE & LIVRABLES OFFICIELS
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'bureau' && (
                    <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 bg-slate-50">
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                                    <FileText size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">Bureau Numérique & Rédacteur d'Actes</h2>
                                    <p className="text-xs text-slate-500">Contrats certifiés, statuts SAS/SARL, rapports techniques, budgets et courriers</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Type d'Acte / Livrable</label>
                                    <select 
                                        value={docType}
                                        onChange={(e: any) => setDocType(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                    >
                                        <option value="report">Note de Cadrage / Rapport Technique</option>
                                        <option value="contract">Statuts Juridiques / Contrat de Bail / Prestation</option>
                                        <option value="letter">Lettre Administrative / Motivation / Recours</option>
                                        <option value="budget">Modèle de Budget Prévisionnel Détaillé</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre du Document</label>
                                    <input 
                                        type="text"
                                        value={docTitle}
                                        onChange={(e) => setDocTitle(e.target.value)}
                                        placeholder="Ex: Statuts Juridiques SAS Diallo Agroalimentaire"
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1.5">Contexte, Clauses Clés & Instructions Spécifiques</label>
                                <textarea 
                                    rows={3}
                                    value={docContextInput}
                                    onChange={(e) => setDocContextInput(e.target.value)}
                                    placeholder="Précisez les montants, identités des signataires, obligations particulières, délais..."
                                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed"
                                />
                            </div>

                            <button
                                onClick={handleGenerateOfficialDocument}
                                disabled={isGeneratingDoc || !docTitle.trim()}
                                className="w-full py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-purple-600/20 flex items-center justify-center gap-2"
                            >
                                {isGeneratingDoc ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                Rédiger & Archiver dans le Dossier Actif
                            </button>
                        </div>

                        {generatedDocContent && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 animate-fade-up">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                                    <h3 className="font-bold text-sm text-slate-900">{docTitle}</h3>
                                    <button 
                                        onClick={() => addNotification("Export PDF", "Document téléchargé au format officiel.", "info")}
                                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5"
                                    >
                                        <Download size={14} /> Exporter PDF
                                    </button>
                                </div>
                                <div className="prose prose-sm max-w-none text-xs text-slate-700 whitespace-pre-wrap font-mono bg-slate-50 p-6 rounded-2xl border border-slate-200 leading-relaxed">
                                    {generatedDocContent}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 7: ÉCOLE NUMÉRIQUE & ÉVALUATIONS PÉDAGOGIQUES
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'education' && (
                    <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 bg-slate-50">
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                                    <GraduationCap size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900">École Numérique & Certification Pédagogique</h2>
                                    <p className="text-xs text-slate-500">Professeur Diallo • Évaluation continue basée sur la maîtrise réelle</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Niveau Académique / Cursus</label>
                                    <select 
                                        value={academicLevel}
                                        onChange={(e) => setAcademicLevel(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                    >
                                        <option value="Fondamental & Alphabétisation">Fondamental & Alphabétisation</option>
                                        <option value="Secondaire / Baccalauréat">Secondaire / Baccalauréat</option>
                                        <option value="Supérieur / Professionnel">Supérieur / Professionnel / Master</option>
                                        <option value="Certification Linguistique">Certification Linguistique (A1-C2)</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Matière ou Compétence à Évaluer</label>
                                    <input 
                                        type="text"
                                        value={examSubject}
                                        onChange={(e) => setExamSubject(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleGenerateExamQuestion}
                                disabled={isEvaluatingExam}
                                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2"
                            >
                                {isEvaluatingExam ? <RefreshCw className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                Lancer une Évaluation Diagnostique
                            </button>
                        </div>

                        {examQuestion && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 animate-fade-up">
                                <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                                    <BookOpen size={16} /> Énoncé de l'Évaluation
                                </div>
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                                    {examQuestion}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Votre Réponse Pédagogique Détaillée</label>
                                    <textarea 
                                        rows={4}
                                        value={examUserAnswer}
                                        onChange={(e) => setExamUserAnswer(e.target.value)}
                                        placeholder="Développez votre raisonnement, étapes de calcul ou proposition..."
                                        className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500"
                                    />
                                </div>

                                <button
                                    onClick={handleEvaluateExamAnswer}
                                    disabled={isEvaluatingExam || !examUserAnswer.trim()}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
                                >
                                    {isEvaluatingExam ? <RefreshCw className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                    Soumettre pour Correction Détaillée
                                </button>
                            </div>
                        )}

                        {examEvaluation && (
                            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 animate-fade-up">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                                        <Award size={20} className="text-amber-500" /> Bilan & Certification de Maîtrise
                                    </h3>
                                    <span className="text-sm font-black px-3.5 py-1 bg-emerald-100 text-emerald-900 rounded-full">
                                        Score : {examEvaluation.score} / 100
                                    </span>
                                </div>

                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    {examEvaluation.feedback}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* ═════════════════════════════════════════════════════════════════════
                     TAB 8: CONSOLE DE MÉMOIRE ACTIVE & TRANSPARENCE TOTALE
                   ═════════════════════════════════════════════════════════════════════ */}
                {activeTab === 'memory' && (
                    <div className="h-full overflow-y-auto p-6 max-w-5xl mx-auto space-y-6 bg-slate-50">
                        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                                        <BrainCircuit size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">Console de Mémoire Active</h2>
                                        <p className="text-xs text-slate-500">Transparence totale, contrôle et isolation par dossier</p>
                                    </div>
                                </div>
                            </div>

                            {/* Add Memory Item Form */}
                            <form onSubmit={handleAddMemory} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3">
                                <div className="sm:col-span-3">
                                    <select
                                        value={newMemCat}
                                        onChange={(e: any) => setNewMemCat(e.target.value)}
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                    >
                                        <option value="objective">Objectif</option>
                                        <option value="decision">Décision</option>
                                        <option value="step">Étape</option>
                                        <option value="difficulty">Blocage</option>
                                        <option value="skill">Compétence</option>
                                        <option value="preference">Préférence</option>
                                    </select>
                                </div>
                                <div className="sm:col-span-4">
                                    <input 
                                        type="text"
                                        value={newMemKey}
                                        onChange={(e) => setNewMemKey(e.target.value)}
                                        placeholder="Clé (ex: Budget Validé)"
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>
                                <div className="sm:col-span-4">
                                    <input 
                                        type="text"
                                        value={newMemValue}
                                        onChange={(e) => setNewMemValue(e.target.value)}
                                        placeholder="Détail retenu..."
                                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                                    />
                                </div>
                                <div className="sm:col-span-1">
                                    <button 
                                        type="submit"
                                        className="w-full h-full min-h-[36px] bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-xs"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Memories Table */}
                        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-sm text-slate-900">Éléments Mémorisés ({filteredMemories.length})</h3>
                                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                                    {['all', 'objective', 'decision', 'step', 'difficulty', 'skill', 'preference'].map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setMemoryFilter(c)}
                                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize ${
                                                memoryFilter === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                                            }`}
                                        >
                                            {c === 'all' ? 'Tous' : c}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                {filteredMemories.map(mem => (
                                    <div key={mem.id} className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center gap-4">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                                    {mem.category}
                                                </span>
                                                <strong className="text-xs font-bold text-slate-900">{mem.key}</strong>
                                                <span className="text-[10px] text-slate-400">• {mem.timestamp}</span>
                                            </div>
                                            <p className="text-xs text-slate-600 truncate">{mem.value}</p>
                                        </div>

                                        <button 
                                            onClick={() => handleDeleteMemory(mem.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-all"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div>

            {/* 🆕 MODAL: CRÉER UN NOUVEAU DOSSIER */}
            {showNewDossierModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 animate-scale-in">
                        <div className="flex justify-between items-center">
                            <h3 className="text-lg font-black text-slate-900">Nouveau Parcours de Vie</h3>
                            <button onClick={() => setShowNewDossierModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
                        </div>

                        <form onSubmit={handleCreateDossier} className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Titre du Dossier</label>
                                <input 
                                    type="text" 
                                    required
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    placeholder="Ex: Implantation Usine de Conditionnement"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Catégorie</label>
                                    <select 
                                        value={newCategory}
                                        onChange={(e: any) => setNewCategory(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                    >
                                        <option value="projet">Projet / Entreprise</option>
                                        <option value="education">Éducation / Diplôme</option>
                                        <option value="carriere">Carrière / Emploi</option>
                                        <option value="administration">Administration / Visa</option>
                                        <option value="sante">Santé & Bien-être</option>
                                        <option value="logement">Logement / Habitat</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Expert Référent</label>
                                    <select 
                                        value={newLeadAgent}
                                        onChange={(e) => setNewLeadAgent(e.target.value)}
                                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                                    >
                                        {AGENTS.map(a => (
                                            <option key={a.id} value={a.id}>{a.name} ({a.title})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Objectif Chiffré ou Concret</label>
                                <textarea 
                                    rows={3}
                                    required
                                    value={newGoal}
                                    onChange={(e) => setNewGoal(e.target.value)}
                                    placeholder="Ex: Valider le budget de 85 000€ et obtenir l'agrément ministériel d'ici septembre..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button 
                                    type="button" 
                                    onClick={() => setShowNewDossierModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit" 
                                    className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs"
                                >
                                    Créer le Parcours
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 📞 LIVE VOCAL & VIDEO CALL MODAL */}
            {isLiveCallActive && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md">
                    <div className="w-full max-w-3xl h-[85vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 relative">
                        <LiveSession 
                            agent={selectedAgent} 
                            onClose={() => setIsLiveCallActive(false)} 
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
