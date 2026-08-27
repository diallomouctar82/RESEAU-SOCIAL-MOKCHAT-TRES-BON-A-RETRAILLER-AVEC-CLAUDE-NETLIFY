import React, { useState, useEffect, useRef } from 'react';
import { 
    Globe, 
    Plane, 
    Briefcase, 
    GraduationCap, 
    HeartPulse, 
    MapPin, 
    CheckCircle, 
    AlertTriangle, 
    ArrowRight, 
    Loader2, 
    Sparkles, 
    Navigation, 
    Lock, 
    ShieldCheck, 
    Upload, 
    FileText, 
    Share2, 
    Search, 
    Eye, 
    Cloud, 
    RefreshCw, 
    Clock, 
    Server, 
    Plus, 
    Users, 
    Compass, 
    BrainCircuit, 
    Filter, 
    User, 
    Building2, 
    Scale, 
    ShoppingBag, 
    CheckCircle2,
    SlidersHorizontal,
    Layers
} from 'lucide-react';
import { COUNTRIES, AGENTS, DEFAULT_DOSSIERS } from '../constants';
import { MobilityProject, SimulationResult, Country, StoredDocument, DocCategory, DossierParcours, DossierCategory, ActiveMemoryItem } from '../types';
import { AIProxyClient } from '../services/aiProxy';
import { cloudService } from '../services/cloud';
import { dossierService } from '../services/dossierService';
import { memoryService } from '../services/memory';
import { ParcoursCreatorModal } from './ParcoursCreatorModal';
import { ParcoursDiagnosticHero } from './ParcoursDiagnosticHero';
import { ParcoursDetailView } from './ParcoursDetailView';
import { UnifiedCouncilRoom } from './UnifiedCouncilRoom';
import { useGlobal } from '../contexts/GlobalContext';

interface WorldHubProps {
    onNavigateToAgent: (agentId: string, initialMessage?: string) => void;
    onNavigate?: (tab: string, context?: any) => void;
}

export const WorldHub: React.FC<WorldHubProps> = ({ onNavigateToAgent, onNavigate }) => {
    const { addNotification } = useGlobal();

    // 4 Global Modes: 'parcours' (default), 'mobility', 'safe', 'memory'
    const [viewMode, setViewMode] = useState<'parcours' | 'mobility' | 'safe' | 'memory'>('parcours');

    // --- PARCOURS STATE ---
    const [dossiers, setDossiers] = useState<DossierParcours[]>([]);
    const [selectedDossier, setSelectedDossier] = useState<DossierParcours | null>(null);
    const [isCreatorModalOpen, setIsCreatorModalOpen] = useState(false);
    const [isCouncilOpen, setIsCouncilOpen] = useState(false);
    const [scopeFilter, setScopeFilter] = useState<'all' | 'individual' | 'family' | 'organization'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [parcoursSearchQuery, setParcoursSearchQuery] = useState('');

    // --- MOBILITY STATE ---
    const [selectedOrigin, setSelectedOrigin] = useState<Country | null>(null);
    const [selectedDestination, setSelectedDestination] = useState<Country | null>(null);
    const [projectType, setProjectType] = useState<MobilityProject['type']>('work');
    const [projectDetails, setProjectDetails] = useState('');
    const [isSimulating, setIsSimulating] = useState(false);
    const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);

    // --- SAFE STATE ---
    const [isLocked, setIsLocked] = useState(true);
    const [authProgress, setAuthProgress] = useState(0);
    const [activeCategory, setActiveCategory] = useState<DocCategory | 'All'>('All');
    const [documents, setDocuments] = useState<StoredDocument[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isAnalyzingDoc, setIsAnalyzingDoc] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSyncTime, setLastSyncTime] = useState<string>('En attente');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // --- ACTIVE MEMORY STATE ---
    const [activeMemories, setActiveMemories] = useState<ActiveMemoryItem[]>([]);
    const [selectedMemoryLayer, setSelectedMemoryLayer] = useState<string>('all');

    // Initial Load for Parcours and Cloud Safe
    useEffect(() => {
        loadParcours();
        loadSafeDocs();
        loadMemories();
    }, []);

    const loadParcours = async () => {
        const loaded = await dossierService.getAllDossiers();
        setDossiers(loaded);
        if (loaded.length > 0 && !selectedDossier) {
            setSelectedDossier(loaded[0]);
        }
    };

    const loadSafeDocs = async () => {
        const files = await cloudService.getAllFiles();
        const mappedDocs: StoredDocument[] = files.map((f: any) => ({
            id: f.id,
            name: f.name,
            category: f.category as DocCategory,
            uploadDate: f.uploadDate.toLocaleDateString(),
            fileSize: cloudService.formatBytes(f.size),
            isVerified: true
        }));
        setDocuments(mappedDocs);
    };

    const loadMemories = async () => {
        const mems = await memoryService.getActiveMemories();
        setActiveMemories(mems);
    };

    // Safe Unlock Animation
    useEffect(() => {
        if (viewMode === 'safe' && isLocked) {
            const interval = setInterval(() => {
                setAuthProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setIsLocked(false), 400);
                        return 100;
                    }
                    return prev + 10;
                });
            }, 30);
            return () => clearInterval(interval);
        }
    }, [viewMode, isLocked]);

    // Handle new Parcours creation from Modal
    const handleParcoursCreated = (newDossier: DossierParcours) => {
        setDossiers(prev => [newDossier, ...prev]);
        setSelectedDossier(newDossier);
        setViewMode('parcours');
        addNotification("Parcours Prêt 🚀", `Votre parcours "${newDossier.title}" est actif avec votre équipe d'experts.`, "success");
    };

    // Handle Parcours update
    const handleUpdateParcours = async (updated: DossierParcours) => {
        setDossiers(prev => prev.map(d => d.id === updated.id ? updated : d));
        setSelectedDossier(updated);
        await dossierService.persist();
    };

    // --- MOBILITY ACTIONS ---
    const handleSimulation = async () => {
        if (!selectedOrigin || !selectedDestination || !projectDetails) return;
        setIsSimulating(true);
        setSimulationResult(null);

        try {
            const ai = new AIProxyClient();
            
            const prompt = `Agis comme Maître Diallo (Expert Juridique International) et Guide Diallo (Expert Voyage).
            
            Analyse ce projet de mobilité :
            - Origine : ${selectedOrigin.name}
            - Destination : ${selectedDestination.name}
            - Type : ${projectType}
            - Détails : ${projectDetails}

            Génère une réponse JSON stricte avec ces champs :
            {
                "feasibilityScore": number (0-100),
                "visaType": "Nom du visa probable",
                "estimatedCost": "Estimation budget (Devise locale)",
                "processingTime": "Estimation temps",
                "requirements": ["condition 1", "condition 2"],
                "advice": "Conseil stratégique court",
                "agentContactId": "ID de l'agent à contacter (2 pour juridique, 7 pour voyage, 3 pour emploi, 4 pour études)"
            }`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-flash-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const result = JSON.parse(response.text || '{}');
            setSimulationResult(result);

        } catch (e) {
            console.error(e);
            addNotification("Erreur Simulation", "Veuillez réessayer l'analyse.", "alert");
        } finally {
            setIsSimulating(false);
        }
    };

    // Convert Simulation into a Full Parcours
    const handleConvertSimulationToParcours = async () => {
        if (!simulationResult || !selectedDestination) return;

        const newParcours = await dossierService.createDossier({
            title: `Mobilité & Installation : ${selectedDestination.name}`,
            category: 'projet',
            goal: `Obtenir le ${simulationResult.visaType} pour ${selectedDestination.name} et finaliser l'installation.`,
            leadAgentId: simulationResult.agentContactId || '2',
            collaboratingAgentIds: [simulationResult.agentContactId || '2', '7', '3'],
            targetDate: simulationResult.processingTime || 'Dans 3 mois'
        });

        handleParcoursCreated(newParcours);
    };

    // --- SAFE ACTIONS ---
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzingDoc(true);
        
        try {
            const fileId = await cloudService.uploadFile(file, 'Identity');
            const newDoc: StoredDocument = {
                id: fileId,
                name: file.name,
                category: 'Identity',
                uploadDate: new Date().toLocaleDateString(),
                fileSize: cloudService.formatBytes(file.size),
                isVerified: true
            };
            setDocuments([newDoc, ...documents]);
            handleSync();
            addNotification("Document Sécurisé 🔒", `Le fichier ${file.name} a été crypté et archivé.`, "success");
        } catch (err) {
            console.error(err);
            addNotification("Erreur Upload", "Impossible d'uploader vers le Cloud Sécurisé.", "alert");
        } finally {
            setIsAnalyzingDoc(false);
        }
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setLastSyncTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        }, 1200);
    };

    // Filtered Parcours List
    const filteredParcours = dossiers.filter(d => {
        const matchScope = scopeFilter === 'all' || (d.scopeMode || 'individual') === scopeFilter;
        const matchCategory = categoryFilter === 'all' || d.category === categoryFilter;
        const matchSearch = d.title.toLowerCase().includes(parcoursSearchQuery.toLowerCase()) || d.goal.toLowerCase().includes(parcoursSearchQuery.toLowerCase());
        return matchScope && matchCategory && matchSearch;
    });

    const filteredDocs = documents.filter(doc => 
        (activeCategory === 'All' || doc.category === activeCategory) &&
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-100 overflow-y-auto animate-fade-in font-sans">
            
            {/* --- TOP UNIFIED HEADER --- */}
            <div className="bg-slate-950 text-white p-6 md:p-8 pb-14 relative overflow-hidden shrink-0 border-b border-slate-800">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600 rounded-full blur-[140px] opacity-20 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-purple-600 rounded-full blur-[110px] opacity-15 pointer-events-none"></div>
                
                <div className="relative z-10 max-w-7xl mx-auto space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-indigo-200 uppercase tracking-wider mb-2">
                                <Globe size={14} className="text-amber-400" />
                                <span>Monde / Mes Parcours de Vie</span>
                                <span className="text-slate-400 font-normal">• Point A ➔ Parcours ➔ Point B</span>
                            </div>
                            <h1 className="text-2xl md:text-4xl font-black tracking-tight text-white">
                                Moteur Universel d'Accomplissement
                            </h1>
                            <p className="text-sm text-slate-300 max-w-2xl mt-1">
                                Orchestration globale de vos objectifs, pièces d'identité, simulations et experts dédiés.
                            </p>
                        </div>

                        {/* Top Action Button */}
                        <div className="flex items-center gap-2.5">
                            <button
                                onClick={() => setIsCreatorModalOpen(true)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs md:text-sm px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 transition-all hover:scale-105"
                            >
                                <Plus size={18} />
                                <span>Nouveau Parcours</span>
                            </button>

                            <button
                                onClick={() => setIsCouncilOpen(true)}
                                className="bg-white/10 hover:bg-white/20 border border-white/20 text-slate-200 font-bold text-xs md:text-sm px-4 py-3 rounded-2xl transition-colors flex items-center gap-2"
                            >
                                <Users size={16} className="text-amber-400" />
                                <span>Le Conseil</span>
                            </button>
                        </div>
                    </div>

                    {/* Mode Navigation Switcher Tabs */}
                    <div className="flex flex-wrap items-center gap-2 pt-4">
                        <button 
                            onClick={() => setViewMode('parcours')}
                            className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${
                                viewMode === 'parcours' 
                                    ? 'bg-white text-slate-900 shadow-xl scale-105' 
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                            }`}
                        >
                            <Compass size={16} className={viewMode === 'parcours' ? 'text-indigo-600' : ''} />
                            <span>Mes Parcours ({dossiers.length})</span>
                        </button>

                        <button 
                            onClick={() => setViewMode('mobility')}
                            className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${
                                viewMode === 'mobility' 
                                    ? 'bg-white text-slate-900 shadow-xl scale-105' 
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                            }`}
                        >
                            <Plane size={16} className={viewMode === 'mobility' ? 'text-blue-600' : ''} />
                            <span>Simulateur Mobilité</span>
                        </button>

                        <button 
                            onClick={() => setViewMode('safe')}
                            className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${
                                viewMode === 'safe' 
                                    ? 'bg-white text-slate-900 shadow-xl scale-105' 
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                            }`}
                        >
                            <Lock size={16} className={viewMode === 'safe' ? 'text-emerald-600' : ''} />
                            <span>Coffre-Fort & Documents ({documents.length})</span>
                        </button>

                        <button 
                            onClick={() => setViewMode('memory')}
                            className={`px-5 py-2.5 rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 ${
                                viewMode === 'memory' 
                                    ? 'bg-white text-slate-900 shadow-xl scale-105' 
                                    : 'bg-white/10 text-slate-300 hover:bg-white/20 hover:text-white'
                            }`}
                        >
                            <BrainCircuit size={16} className={viewMode === 'memory' ? 'text-purple-600' : ''} />
                            <span>Mémoire Active Diallo OS</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT CONTAINER --- */}
            <div className="max-w-7xl mx-auto w-full px-4 md:px-6 py-6 space-y-6 -mt-6 relative z-20">
                
                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* MODE 1: MES PARCOURS DE VIE (PRIMARY ENGINE) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {viewMode === 'parcours' && (
                    <div className="space-y-6">
                        
                        {/* Selector & Scope filters bar */}
                        <div className="bg-white rounded-3xl p-4 md:p-5 shadow-sm border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                            
                            {/* Scope Selector: Personnel / Famille / Entreprise */}
                            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl overflow-x-auto w-full md:w-auto">
                                <button
                                    onClick={() => setScopeFilter('all')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${scopeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    Tous les périmètres
                                </button>
                                <button
                                    onClick={() => setScopeFilter('individual')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${scopeFilter === 'individual' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    <User size={13} /> Personnel
                                </button>
                                <button
                                    onClick={() => setScopeFilter('family')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${scopeFilter === 'family' ? 'bg-amber-100 text-amber-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    <Users size={13} /> Famille
                                </button>
                                <button
                                    onClick={() => setScopeFilter('organization')}
                                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${scopeFilter === 'organization' ? 'bg-purple-100 text-purple-900 shadow-sm font-black' : 'text-slate-600 hover:text-slate-900'}`}
                                >
                                    <Building2 size={13} /> Entreprise
                                </button>
                            </div>

                            {/* Search & Category Filter */}
                            <div className="flex items-center gap-2 w-full md:w-auto">
                                <div className="relative flex-1 md:w-56">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                    <input 
                                        type="text"
                                        value={parcoursSearchQuery}
                                        onChange={(e) => setParcoursSearchQuery(e.target.value)}
                                        placeholder="Rechercher un parcours..."
                                        className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                </div>

                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="all">Toutes catégories</option>
                                    <option value="projet">Projet & Mobilité</option>
                                    <option value="education">Éducation & Campus</option>
                                    <option value="carriere">Carrière & Emploi</option>
                                    <option value="juridique">Juridique & Visa</option>
                                    <option value="sante">Santé</option>
                                    <option value="logement">Logement</option>
                                </select>
                            </div>
                        </div>

                        {/* Horizontal Parcours Switcher Carousel */}
                        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
                            {filteredParcours.map((p) => {
                                const isSelected = selectedDossier?.id === p.id;
                                const leadAgent = AGENTS.find(a => a.id === p.leadAgentId);

                                return (
                                    <div
                                        key={p.id}
                                        onClick={() => setSelectedDossier(p)}
                                        className={`min-w-[280px] max-w-[320px] p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shrink-0 ${
                                            isSelected 
                                                ? 'bg-white border-indigo-600 ring-2 ring-indigo-100 shadow-md scale-[1.02]' 
                                                : 'bg-white/80 border-slate-200 hover:border-slate-300 hover:bg-white'
                                        }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between gap-1 mb-2">
                                                <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                                    {p.category}
                                                </span>
                                                <span className="text-xs font-black text-indigo-600">
                                                    {p.progress}%
                                                </span>
                                            </div>

                                            <h4 className="font-bold text-slate-900 text-sm line-clamp-1 mb-1" title={p.title}>
                                                {p.title}
                                            </h4>
                                            <p className="text-xs text-slate-500 line-clamp-2 leading-snug">
                                                {p.goal}
                                            </p>
                                        </div>

                                        <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                {leadAgent && (
                                                    <img src={leadAgent.avatar} alt={leadAgent.name} className="w-5 h-5 rounded-full object-cover" />
                                                )}
                                                <span className="text-[11px] text-slate-500 truncate max-w-[120px]">{leadAgent?.name || 'Diallo'}</span>
                                            </div>
                                            <span className="text-[10px] text-slate-400 font-semibold">{p.targetDate}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* ACTIVE PARCOURS HERO & DETAIL VIEW */}
                        {selectedDossier ? (
                            <div className="space-y-6">
                                {/* Diallo OS 4-Quadrant Diagnostic Hero */}
                                <ParcoursDiagnosticHero 
                                    parcours={selectedDossier}
                                    onNextActionClick={() => {
                                        const currentStep = selectedDossier.steps.find(s => s.status === 'in_progress') || selectedDossier.steps[0];
                                        if (currentStep?.gatewayTab && onNavigate) {
                                            onNavigate(currentStep.gatewayTab);
                                        } else {
                                            onNavigateToAgent(selectedDossier.leadAgentId, `Faisons un point immédiat sur la prochaine étape : "${selectedDossier.nextAction}".`);
                                        }
                                    }}
                                    onConveneCouncil={() => setIsCouncilOpen(true)}
                                    onTriggerPlanB={() => {
                                        addNotification("Mode Plan B", "Accédez à l'onglet Plan B pour simuler une nouvelle alternative.", "warning");
                                    }}
                                    onNavigateToTab={onNavigate}
                                    onOpenExpertHotline={(agentId) => onNavigateToAgent(agentId, `Bonjour, je vous contacte concernant le dossier "${selectedDossier.title}".`)}
                                />

                                {/* Full Interactive Timeline & Journey Details */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
                                    <ParcoursDetailView 
                                        parcours={selectedDossier}
                                        onUpdateParcours={handleUpdateParcours}
                                        onNavigateToTab={onNavigate}
                                        onOpenAgentChat={(agentId, prompt) => onNavigateToAgent(agentId, prompt)}
                                        onOpenCouncil={() => setIsCouncilOpen(true)}
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 space-y-4">
                                <Compass size={48} className="mx-auto text-slate-300" />
                                <h3 className="text-lg font-bold text-slate-800">Aucun parcours sélectionné</h3>
                                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                    Créez votre premier parcours de vie ou sélectionnez-en un dans la liste ci-dessus.
                                </p>
                                <button
                                    onClick={() => setIsCreatorModalOpen(true)}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md inline-flex items-center gap-2"
                                >
                                    <Plus size={16} /> Initialiser un Nouveau Parcours
                                </button>
                            </div>
                        )}

                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* MODE 2: SIMULATEUR MOBILITÉ & VISAS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {viewMode === 'mobility' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-in">
                        {/* Left Panel: Simulator Form */}
                        <div className="w-full md:w-1/2 p-8 border-r border-slate-100 flex flex-col justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                   <Navigation className="text-indigo-600" /> Paramètres du Projet de Mobilité
                                </h2>
                                
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pays d'origine</label>
                                        <select 
                                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                          value={selectedOrigin?.code || ''}
                                          onChange={(e) => setSelectedOrigin(COUNTRIES.find(c => c.code === e.target.value) || null)}
                                        >
                                            <option value="">Sélectionner le pays d'origine</option>
                                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Pays de destination visé</label>
                                        <select 
                                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                          value={selectedDestination?.code || ''}
                                          onChange={(e) => setSelectedDestination(COUNTRIES.find(c => c.code === e.target.value) || null)}
                                        >
                                            <option value="">Sélectionner une destination</option>
                                            {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Motif du projet</label>
                                        <div className="grid grid-cols-2 gap-2">
                                            {[
                                                { id: 'work', label: 'Travail & Emploi', icon: Briefcase },
                                                { id: 'study', label: 'Études & Master', icon: GraduationCap },
                                                { id: 'tourism', label: 'Séjour & Tourisme', icon: Plane },
                                                { id: 'health', label: 'Soins & Santé', icon: HeartPulse }
                                            ].map((type) => (
                                                <button
                                                    key={type.id}
                                                    type="button"
                                                    onClick={() => setProjectType(type.id as any)}
                                                    className={`p-3 rounded-xl border flex items-center gap-2 text-xs font-bold transition-all ${projectType === type.id ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                                >
                                                    <type.icon size={15} /> {type.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Détails (Âge, Diplômes, Économies, Délais...)</label>
                                        <textarea 
                                            value={projectDetails}
                                            onChange={(e) => setProjectDetails(e.target.value)}
                                            placeholder="Ex: J'ai 28 ans, titulaire d'un Master en informatique avec 3 ans d'expérience et 6000€ d'économies..."
                                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-indigo-500 outline-none text-xs leading-relaxed resize-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleSimulation}
                                disabled={isSimulating || !selectedOrigin || !selectedDestination || !projectDetails}
                                className={`w-full py-3.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 mt-6 transition-all ${isSimulating || !selectedOrigin ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:scale-[1.01]'}`}
                            >
                                {isSimulating ? <Loader2 className="animate-spin" size={16} /> : <Sparkles size={16} />}
                                {isSimulating ? 'Simulation multimodale en cours...' : 'Lancer la Simulation de Mobilité'}
                            </button>
                        </div>

                        {/* Right Panel: Simulation Results */}
                        <div className="w-full md:w-1/2 p-8 bg-slate-50 flex flex-col justify-center items-center relative overflow-hidden">
                            {!simulationResult ? (
                                <div className="text-center text-slate-400 max-w-xs">
                                    <Globe size={56} className="mx-auto mb-3 opacity-20 text-indigo-600" />
                                    <h3 className="text-base font-bold text-slate-700 mb-1">Prêt pour la simulation</h3>
                                    <p className="text-xs text-slate-500 leading-relaxed">
                                        Remplissez vos critères à gauche pour calculer votre score d'éligibilité, les visas recommandés et les pré-requis.
                                    </p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col justify-between animate-fade-in space-y-4">
                                    <div className="space-y-4">
                                        <div className="text-center">
                                            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Score de Faisabilité</div>
                                            <div className="text-4xl font-black text-indigo-600">
                                                {simulationResult.feasibilityScore}%
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-1">Voie d'Immigration / Visa Suggéré</div>
                                            <div className="font-bold text-indigo-700 text-base">{simulationResult.visaType}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Budget Estimé</div>
                                                <div className="font-bold text-slate-800 text-sm">{simulationResult.estimatedCost}</div>
                                            </div>
                                            <div className="bg-white p-3.5 rounded-2xl shadow-sm border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase mb-0.5">Délai de Traitement</div>
                                                <div className="font-bold text-slate-800 text-sm">{simulationResult.processingTime}</div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Conditions Préalables Recommandées</div>
                                            <ul className="space-y-1.5 text-xs text-slate-700">
                                                {simulationResult.requirements.map((req, i) => (
                                                    <li key={i} className="flex items-start gap-1.5">
                                                        <CheckCircle2 size={13} className="text-emerald-500 mt-0.5 shrink-0" />
                                                        <span>{req}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-indigo-50/80 p-3.5 rounded-2xl border border-indigo-100 text-xs text-indigo-900 italic">
                                            "{simulationResult.advice}"
                                        </div>
                                    </div>

                                    {/* Action to create Parcours directly */}
                                    <div className="pt-4 flex flex-col sm:flex-row gap-2">
                                        <button 
                                            onClick={handleConvertSimulationToParcours}
                                            className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <Compass size={15} />
                                            <span>Transformer en Parcours Officiel</span>
                                        </button>

                                        <button 
                                            onClick={() => {
                                                const agent = AGENTS.find(a => a.id === simulationResult.agentContactId) || AGENTS[1];
                                                onNavigateToAgent(agent.id, `Bonjour ${agent.name}, j'ai simulé mon projet pour ${selectedDestination?.name}. Score: ${simulationResult.feasibilityScore}%. Visa: ${simulationResult.visaType}.`);
                                            }}
                                            className="py-3 px-4 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-colors"
                                        >
                                            Chat Expert
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* MODE 3: COFFRE-FORT NUMÉRIQUE & DOCUMENTS */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {viewMode === 'safe' && (
                    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px] flex flex-col animate-fade-in">
                        {isLocked ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-12 bg-slate-50">
                                <div className="w-24 h-24 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-6 bg-white shadow-xl relative">
                                    <ShieldCheck size={48} className="text-emerald-500" />
                                    <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-100" />
                                        <circle cx="48" cy="48" r="44" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500" strokeDasharray={276} strokeDashoffset={276 - (276 * authProgress) / 100} />
                                    </svg>
                                </div>
                                <h2 className="text-xl font-extrabold uppercase tracking-widest text-slate-800 mb-2">Coffre-Fort Numérique</h2>
                                <p className="text-emerald-600 font-mono text-xs font-bold bg-emerald-50 px-3 py-1 rounded-full">
                                    {authProgress < 100 ? 'Vérification de la clé de chiffrement...' : 'Accès Déverrouillé'}
                                </p>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col p-6 space-y-6">
                                {/* Safe Toolbar */}
                                <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-xl">
                                            <Lock size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-sm">Pièces & Livrables Sécurisés</h3>
                                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                                                {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} />}
                                                Synchronisé • {lastSyncTime}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full md:w-auto">
                                        <button onClick={handleSync} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600"><RefreshCw size={16} /></button>
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                            <input 
                                                value={searchTerm} 
                                                onChange={(e) => setSearchTerm(e.target.value)} 
                                                placeholder="Rechercher un document..." 
                                                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500" 
                                            />
                                        </div>
                                        <button 
                                            onClick={() => fileInputRef.current?.click()} 
                                            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
                                        >
                                            <Upload size={14} />
                                            <span>Ajouter</span>
                                        </button>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                    </div>
                                </div>

                                {/* Category Chips */}
                                <div className="flex gap-2 overflow-x-auto pb-1">
                                    {['All', 'Identity', 'Work', 'Health', 'Education', 'Finance'].map(cat => (
                                        <button 
                                            key={cat} 
                                            onClick={() => setActiveCategory(cat as any)} 
                                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                        >
                                            {cat === 'All' ? 'Tous' : cat}
                                        </button>
                                    ))}
                                </div>

                                {/* Docs Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredDocs.map(doc => (
                                        <div key={doc.id} className="group border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-all bg-white flex items-center justify-between gap-3">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-3 rounded-xl bg-slate-100 text-slate-700 shrink-0">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="min-w-0">
                                                    <h4 className="font-bold text-slate-900 text-xs truncate" title={doc.name}>
                                                        {doc.name}
                                                    </h4>
                                                    <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                                                        <span>{doc.fileSize}</span>
                                                        <span>•</span>
                                                        <span>{doc.uploadDate}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button 
                                                    onClick={() => addNotification("Document", `Consultation de ${doc.name}`, "info")}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                                                >
                                                    <Eye size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => addNotification("Partage", `Lien sécurisé généré pour ${doc.name}`, "info")}
                                                    className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600"
                                                >
                                                    <Share2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══════════════════════════════════════════════════════════════ */}
                {/* MODE 4: MÉMOIRE ACTIVE TRANSVERSALE (5 COUCHES) */}
                {/* ═══════════════════════════════════════════════════════════════ */}
                {viewMode === 'memory' && (
                    <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 space-y-6 animate-fade-in">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                                    <BrainCircuit className="text-purple-600" size={22} />
                                    <span>Mémoire Active Diallo OS (5 Couches Transversales)</span>
                                </h3>
                                <p className="text-xs text-slate-500 mt-1">
                                    Maintient le contexte unifié entre tous les experts, parcours, sessions live et documents.
                                </p>
                            </div>

                            {/* Layer selector */}
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto text-xs font-bold">
                                {['all', 'personal', 'parcours', 'learning', 'documentary', 'conversational'].map((lay) => (
                                    <button
                                        key={lay}
                                        onClick={() => setSelectedMemoryLayer(lay)}
                                        className={`px-3 py-1.5 rounded-lg transition-colors capitalize ${selectedMemoryLayer === lay ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'}`}
                                    >
                                        {lay === 'all' ? 'Toutes' : lay}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Memory Items Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {activeMemories
                                .filter(m => selectedMemoryLayer === 'all' || (m.layer || 'parcours') === selectedMemoryLayer)
                                .map((mem) => (
                                    <div key={mem.id} className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-white hover:shadow-sm transition-all">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <span className="text-[10px] font-extrabold uppercase bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                                                Couche : {mem.layer || 'Parcours'} • {mem.category}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{mem.timestamp}</span>
                                        </div>
                                        <h5 className="font-bold text-slate-900 text-xs mb-1">{mem.key}</h5>
                                        <p className="text-xs text-slate-700 leading-relaxed">{mem.value}</p>
                                    </div>
                                ))}
                        </div>
                    </div>
                )}

            </div>

            {/* --- MODAL: PARCOURS CREATOR --- */}
            <ParcoursCreatorModal 
                isOpen={isCreatorModalOpen}
                onClose={() => setIsCreatorModalOpen(false)}
                onParcoursCreated={handleParcoursCreated}
            />

            {/* --- MODAL: UNIFIED COUNCIL ROOM --- */}
            {isCouncilOpen && (
                <UnifiedCouncilRoom 
                    onClose={() => setIsCouncilOpen(false)}
                />
            )}

        </div>
    );
};
