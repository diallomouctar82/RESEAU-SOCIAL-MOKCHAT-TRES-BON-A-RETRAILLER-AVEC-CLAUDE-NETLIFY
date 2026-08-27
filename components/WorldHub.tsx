
import React, { useState, useEffect, useRef } from 'react';
import { Globe, Plane, Briefcase, GraduationCap, HeartPulse, MapPin, CheckCircle, AlertTriangle, ArrowRight, Loader2, Sparkles, Navigation, Lock, ShieldCheck, Upload, FileText, Share2, Search, Eye, Cloud, RefreshCw, Clock, Server } from 'lucide-react';
import { COUNTRIES, AGENTS } from '../constants';
import { MobilityProject, SimulationResult, Country, StoredDocument, DocCategory } from '../types';
import { GoogleGenAI } from '@google/genai';
import { cloudService } from '../services/cloud';

interface WorldHubProps {
    onNavigateToAgent: (agentId: string, initialMessage?: string) => void;
}

export const WorldHub: React.FC<WorldHubProps> = ({ onNavigateToAgent }) => {
    const [viewMode, setViewMode] = useState<'mobility' | 'safe'>('mobility');

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

    // Initial Load for Safe
    useEffect(() => {
        const loadDocs = async () => {
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
        loadDocs();
    }, []);

    // Unlock Animation when switching to Safe tab
    useEffect(() => {
        if (viewMode === 'safe' && isLocked) {
            const interval = setInterval(() => {
                setAuthProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setTimeout(() => setIsLocked(false), 500);
                        return 100;
                    }
                    return prev + 5;
                });
            }, 30);
            return () => clearInterval(interval);
        }
    }, [viewMode, isLocked]);

    // --- MOBILITY ACTIONS ---
    const handleSimulation = async () => {
        if (!selectedOrigin || !selectedDestination || !projectDetails) return;
        setIsSimulating(true);
        setSimulationResult(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
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
                "requirements": ["condition 1", "condition 2", ...],
                "advice": "Conseil stratégique court",
                "agentContactId": "ID de l'agent à contacter (2 pour juridique, 7 pour voyage, 3 pour emploi, 4 pour études)"
            }`;

            const response = await ai.models.generateContent({
                model: 'gemini-3-pro-preview',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const result = JSON.parse(response.text || '{}');
            setSimulationResult(result);

        } catch (e) {
            console.error(e);
            alert("Erreur lors de la simulation. Veuillez réessayer.");
        } finally {
            setIsSimulating(false);
        }
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
        } catch (err) {
            console.error(err);
            alert("Erreur d'upload vers le Cloud Sécurisé.");
        } finally {
            setIsAnalyzingDoc(false);
        }
    };

    const handleSync = () => {
        setIsSyncing(true);
        setTimeout(() => {
            setIsSyncing(false);
            setLastSyncTime(new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}));
        }, 1500);
    };

    const filteredDocs = documents.filter(doc => 
        (activeCategory === 'All' || doc.category === activeCategory) &&
        doc.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
            {/* Header Unified */}
            <div className="bg-slate-900 text-white p-8 pb-16 relative overflow-hidden shrink-0">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-600 rounded-full blur-[100px] opacity-20"></div>
                <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-600 rounded-full blur-[100px] opacity-10"></div>
                
                <div className="relative z-10 max-w-4xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur border border-white/20 px-4 py-1.5 rounded-full text-xs font-bold text-white uppercase tracking-wider">
                        <Globe size={14} /> Espace Monde & Documents
                    </div>
                    <h1 className="text-3xl md:text-5xl font-bold">Votre Avenir, Vos Papiers</h1>
                    <p className="text-slate-300 max-w-2xl mx-auto text-lg">
                        Préparez votre mobilité internationale et sécurisez vos documents essentiels dans un seul espace blindé.
                    </p>

                    {/* Tabs Switcher */}
                    <div className="flex justify-center gap-4 mt-8">
                        <button 
                            onClick={() => setViewMode('mobility')}
                            className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${viewMode === 'mobility' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <Plane size={18} /> Projet Mobilité
                        </button>
                        <button 
                            onClick={() => setViewMode('safe')}
                            className={`px-6 py-3 rounded-full font-bold transition-all flex items-center gap-2 ${viewMode === 'safe' ? 'bg-emerald-500 text-white shadow-xl scale-105' : 'bg-white/10 text-white hover:bg-white/20'}`}
                        >
                            <Lock size={18} /> Coffre-fort
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content Card - Overlap Header */}
            <div className="flex-1 overflow-y-auto px-4 pb-8 -mt-8 relative z-20">
                
                {/* MODE MOBILITY */}
                {viewMode === 'mobility' && (
                    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden flex flex-col md:flex-row min-h-[600px] animate-fade-up">
                        
                        {/* Left Panel: Simulator Form */}
                        <div className="w-full md:w-1/2 p-8 border-r border-slate-100 flex flex-col">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                               <Navigation className="text-brand-600" /> Paramètres du Projet
                            </h2>
                            
                            <div className="space-y-6 flex-1">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">De quel pays partez-vous ?</label>
                                    <select 
                                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                                      value={selectedOrigin?.code || ''}
                                      onChange={(e) => setSelectedOrigin(COUNTRIES.find(c => c.code === e.target.value) || null)}
                                    >
                                        <option value="">Sélectionner un pays d'origine</option>
                                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Où voulez-vous aller ?</label>
                                    <select 
                                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-brand-500 outline-none"
                                      value={selectedDestination?.code || ''}
                                      onChange={(e) => setSelectedDestination(COUNTRIES.find(c => c.code === e.target.value) || null)}
                                    >
                                        <option value="">Sélectionner une destination</option>
                                        {COUNTRIES.map(c => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nature du projet</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'work', label: 'Travail', icon: Briefcase },
                                            { id: 'study', label: 'Études', icon: GraduationCap },
                                            { id: 'tourism', label: 'Tourisme', icon: Plane },
                                            { id: 'health', label: 'Santé', icon: HeartPulse }
                                        ].map((type) => (
                                            <button
                                                key={type.id}
                                                onClick={() => setProjectType(type.id as any)}
                                                className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${projectType === type.id ? 'bg-brand-50 border-brand-500 text-brand-700 font-bold' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                                            >
                                                <type.icon size={16} /> {type.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Détails (Âge, Diplômes, Budget...)</label>
                                    <textarea 
                                        value={projectDetails}
                                        onChange={(e) => setProjectDetails(e.target.value)}
                                        placeholder="Ex: J'ai 28 ans, un Master en Info, et 5000€ d'économies..."
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl h-24 focus:ring-2 focus:ring-brand-500 outline-none text-sm"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleSimulation}
                                disabled={isSimulating || !selectedOrigin || !selectedDestination || !projectDetails}
                                className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 mt-6 transition-all ${isSimulating || !selectedOrigin ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-brand-600 text-white hover:bg-brand-700 hover:scale-[1.02]'}`}
                            >
                                {isSimulating ? <Loader2 className="animate-spin" /> : <Sparkles />}
                                {isSimulating ? 'Analyse en cours...' : 'Lancer la Simulation'}
                            </button>
                        </div>

                        {/* Right Panel: Results */}
                        <div className="w-full md:w-1/2 p-8 bg-slate-50 flex flex-col justify-center items-center relative overflow-hidden">
                            {!simulationResult ? (
                                <div className="text-center text-slate-400 max-w-xs">
                                    <Globe size={64} className="mx-auto mb-4 opacity-20" />
                                    <h3 className="text-lg font-medium text-slate-600 mb-2">En attente de données</h3>
                                    <p className="text-sm">Remplissez le formulaire à gauche pour obtenir une analyse complète de votre projet.</p>
                                </div>
                            ) : (
                                <div className="w-full h-full flex flex-col animate-fade-up">
                                    <div className="text-center mb-6">
                                        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Score de Faisabilité</div>
                                        <div className="relative inline-flex items-center justify-center">
                                            <svg className="w-32 h-32 transform -rotate-90">
                                                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-200" />
                                                <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                                                    className={simulationResult.feasibilityScore > 70 ? "text-green-500" : simulationResult.feasibilityScore > 40 ? "text-orange-500" : "text-red-500"}
                                                    strokeDasharray={377}
                                                    strokeDashoffset={377 - (377 * simulationResult.feasibilityScore) / 100}
                                                    style={{ transition: 'stroke-dashoffset 1s ease-out' }}
                                                />
                                            </svg>
                                            <span className="absolute text-3xl font-bold text-slate-800">{simulationResult.feasibilityScore}%</span>
                                        </div>
                                    </div>

                                    <div className="space-y-4 flex-1 overflow-y-auto pr-2">
                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-1">Visa Recommandé</div>
                                            <div className="font-bold text-brand-600 text-lg">{simulationResult.visaType}</div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Budget Estimé</div>
                                                <div className="font-bold text-slate-800">{simulationResult.estimatedCost}</div>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Délais</div>
                                                <div className="font-bold text-slate-800">{simulationResult.processingTime}</div>
                                            </div>
                                        </div>

                                        <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                                            <div className="text-xs font-bold text-slate-400 uppercase mb-2">Pré-requis Clés</div>
                                            <ul className="space-y-2">
                                                {simulationResult.requirements.map((req, i) => (
                                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                                                        <CheckCircle size={14} className="text-green-500 mt-0.5 shrink-0" /> {req}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                                            <AlertTriangle className="text-blue-500 shrink-0" size={20} />
                                            <p className="text-sm text-blue-800 italic">"{simulationResult.advice}"</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={() => {
                                            const agent = AGENTS.find(a => a.id === simulationResult.agentContactId) || AGENTS[1];
                                            onNavigateToAgent(agent.id, `Bonjour ${agent.name}, j'ai simulé mon projet pour ${selectedDestination?.name}. Score: ${simulationResult.feasibilityScore}%. Visa: ${simulationResult.visaType}. Pouvez-vous m'aider à constituer le dossier ?`);
                                        }}
                                        className="mt-6 w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors"
                                    >
                                        Lancer la procédure avec l'Expert <ArrowRight size={18} />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* MODE SAFE */}
                {viewMode === 'safe' && (
                    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden min-h-[600px] flex flex-col">
                        
                        {isLocked ? (
                            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 relative overflow-hidden">
                                <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=1600&q=80')] opacity-5 bg-cover"></div>
                                <div className="z-10 text-center animate-fade-up">
                                    <div className="w-32 h-32 rounded-full border-4 border-emerald-500/30 flex items-center justify-center mb-8 relative bg-white shadow-xl">
                                        <ShieldCheck size={64} className="text-emerald-500" />
                                        <svg className="absolute inset-0 w-full h-full transform -rotate-90">
                                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-transparent" />
                                            <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-emerald-500" strokeDasharray={377} strokeDashoffset={377 - (377 * authProgress) / 100} />
                                        </svg>
                                    </div>
                                    <h2 className="text-2xl font-bold tracking-widest uppercase mb-2 text-slate-800">Coffre-Fort Sécurisé</h2>
                                    <p className="text-emerald-600 font-mono text-sm font-bold bg-emerald-50 px-3 py-1 rounded-full">{authProgress < 100 ? 'Authentification Biométrique...' : 'Accès Autorisé'}</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col animate-fade-up">
                                {/* Safe Toolbar */}
                                <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-100 text-emerald-600 p-2 rounded-lg">
                                            <Lock size={24} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-800">Mes Documents</h3>
                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                {isSyncing ? <RefreshCw size={10} className="animate-spin" /> : <Cloud size={10} />}
                                                Synchronisé • {lastSyncTime}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 w-full md:w-auto">
                                        <button onClick={handleSync} className="p-2 border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500"><RefreshCw size={20} /></button>
                                        <div className="relative flex-1 md:w-64">
                                            <Search className="absolute left-3 top-1/2 -translate-x-1/2 text-slate-400" size={16} />
                                            <input value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Rechercher..." className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
                                        </div>
                                        <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl font-bold shadow-lg flex items-center gap-2 transition-all"><Upload size={18} /> <span className="hidden sm:inline">Ajouter</span></button>
                                        <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
                                    </div>
                                </div>

                                {/* Categories */}
                                <div className="px-6 pt-4 flex gap-2 overflow-x-auto pb-2">
                                    {['All', 'Identity', 'Work', 'Health', 'Education', 'Finance'].map(cat => (
                                        <button key={cat} onClick={() => setActiveCategory(cat as any)} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${activeCategory === cat ? 'bg-emerald-600 text-white shadow-md' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{cat === 'All' ? 'Tous' : cat}</button>
                                    ))}
                                </div>

                                {/* Doc Grid */}
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto max-h-[600px]">
                                    {isAnalyzingDoc && (
                                        <div className="border-2 border-dashed border-emerald-500 bg-emerald-50 rounded-2xl p-6 flex flex-col items-center justify-center text-emerald-700 animate-pulse"><Upload size={32} className="mb-2" /><span className="font-bold">Chiffrement & Upload...</span></div>
                                    )}
                                    {filteredDocs.length === 0 && !isAnalyzingDoc && (
                                        <div className="col-span-full text-center py-20 text-gray-400">
                                            <FileText size={48} className="mx-auto mb-4 opacity-20" />
                                            <p>Le coffre est vide. Ajoutez vos documents importants.</p>
                                        </div>
                                    )}
                                    {filteredDocs.map(doc => (
                                        <div key={doc.id} className="group border border-slate-200 rounded-2xl p-4 hover:shadow-lg transition-all cursor-pointer relative bg-white hover:border-emerald-500 flex items-center gap-4">
                                            <div className={`p-3 rounded-xl flex-shrink-0 ${doc.category === 'Identity' ? 'bg-blue-50 text-blue-600' : doc.category === 'Health' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}`}><FileText size={24} /></div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-slate-900 text-sm truncate mb-1" title={doc.name}>{doc.name}</h3>
                                                <div className="text-[10px] text-slate-500 flex items-center gap-2"><span>{doc.fileSize}</span><span>•</span><span>{doc.uploadDate}</span></div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"><Eye size={16} /></button>
                                                <button className="p-2 hover:bg-emerald-50 rounded-lg text-emerald-600"><Share2 size={16} /></button>
                                            </div>
                                            {doc.isVerified && <div className="absolute top-2 right-2 text-emerald-500" title="Vérifié"><CheckCircle size={12} /></div>}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};
