
import React, { useState, useEffect, useRef } from 'react';
import { AGENTS } from '../constants';
import { Agent, CouncilStep } from '../types';
import { AIProxyClient } from '../services/aiProxy';
import { Users, Sparkles, Send, CheckCircle, FileText, Play, RotateCcw, BrainCircuit, MessageSquare, Briefcase, Globe, Scale, HeartPulse, Home } from 'lucide-react';
import { Avatar3D } from './Avatar3D';
import {
    newExpertRecordId,
    parseCouncilSetup,
    saveCouncilResult,
} from '../services/expertPersistence';

interface CouncilRoomProps {
    onClose: () => void;
}

export const CouncilRoom: React.FC<CouncilRoomProps> = ({ onClose }) => {
    const [topic, setTopic] = useState('');
    const [isSessionStarted, setIsSessionStarted] = useState(false);
    const [activeAgents, setActiveAgents] = useState<Agent[]>([]);
    const [chatHistory, setChatHistory] = useState<{agentId: string, text: string}[]>([]);
    const [masterPlan, setMasterPlan] = useState<CouncilStep[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [currentSpeakerId, setCurrentSpeakerId] = useState<string | null>(null);
    const [sessionError, setSessionError] = useState<string | null>(null);
    const [persistenceLabel, setPersistenceLabel] = useState<string | null>(null);
    
    // Auto-scroll for chat
    const chatEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory]);

    const startCouncil = async () => {
        if (!topic.trim()) return;
        setIsSessionStarted(true);
        setIsProcessing(true);
        setSessionError(null);
        setPersistenceLabel(null);

        try {
            const ai = new AIProxyClient();
            
            // 1. SELECT AGENTS & INITIAL PLAN
            const setupPrompt = `
                L'utilisateur a un projet complexe : "${topic}".
                Tu es le "Président du Conseil". Analyse la demande et choisis les 3 agents les plus pertinents parmi :
                - Maître Diallo (Juridique) [ID: 2]
                - Conseiller Diallo (Emploi) [ID: 3]
                - Professeur Diallo (Éducation) [ID: 4]
                - Docteur Diallo (Santé) [ID: 5]
                - Monsieur Diallo (Logement) [ID: 6]
                - Guide Diallo (Voyage) [ID: 7]

                Génère un JSON strict :
                {
                    "selectedAgentIds": ["id1", "id2", "id3"],
                    "introMessage": "Message d'accueil du Président du Conseil expliquant la stratégie.",
                    "initialSteps": [
                        { "title": "Étape 1", "description": "Détail...", "assignedAgentId": "id1" },
                        { "title": "Étape 2", "description": "Détail...", "assignedAgentId": "id2" }
                    ]
                }
            `;

            const setupResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: setupPrompt,
                config: { responseMimeType: 'application/json' }
            });

            const setupData = parseCouncilSetup(setupResponse.text, new Set(AGENTS.map((agent) => agent.id)));
            
            const selected = AGENTS.filter(a => setupData.selectedAgentIds.includes(a.id));
            if (selected.length < 2) throw new Error('Le Conseil ne contient pas assez d’experts disponibles.');
            setActiveAgents(selected);
            const initialSteps: CouncilStep[] = setupData.initialSteps.map((step, index) => ({ ...step, id: `step-${index}`, status: 'pending' }));
            setMasterPlan(initialSteps);
            setChatHistory([{ agentId: 'system', text: setupData.introMessage }]);

            setIsProcessing(false);
            await runCouncilRound(selected, initialSteps, setupData.introMessage, newExpertRecordId());

        } catch (e) {
            console.error("Council Error", e);
            setSessionError(e instanceof Error ? e.message : 'Le Conseil n’a pas pu être lancé.');
            setIsProcessing(false);
        }
    };

    const runCouncilRound = async (agents: Agent[], currentSteps: CouncilStep[], introMessage: string, resultId: string) => {
        setIsProcessing(true);
        const roundDialogue: { agentId: string; text: string }[] = [];
        const completedAgentIds = new Set<string>();

        for (const agent of agents) {
            setCurrentSpeakerId(agent.id);
            
            try {
                const ai = new AIProxyClient();
                const context = `
                    Projet: "${topic}".
                    Tu es ${agent.name} (${agent.title}).
                    Les autres experts présents sont : ${agents.filter(a => a.id !== agent.id).map(a => a.name).join(', ')}.
                    Plan actuel : ${JSON.stringify(currentSteps)}.
                    
                    Interviens pour :
                    1. Valider ta partie du plan.
                    2. Ajouter une précision critique ou un document nécessaire.
                    3. Proposer une action concrète (ex: "Je vais rédiger ce contrat").
                    
                    Sois bref, professionnel et direct. Max 2 phrases.
                    Si tu produis un document, utilise la syntaxe [[FILE:type:titre:desc]].
                `;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: context
                });

                const text = response.text.trim();
                if (!text) throw new Error(`${agent.name} a renvoyé une contribution vide.`);
                roundDialogue.push({ agentId: agent.id, text });
                setChatHistory(prev => [...prev, { agentId: agent.id, text }]);
                
                // Parse for documents or updates (Simplified logic)
                if (text.includes('[[FILE:')) {
                    completedAgentIds.add(agent.id);
                }

            } catch (e) {
                console.error(e);
                setSessionError(e instanceof Error ? e.message : `La contribution de ${agent.name} est indisponible.`);
            }
        }

        try {
            if (roundDialogue.length === 0) throw new Error('Aucune contribution exploitable n’a été produite.');
            const updatedSteps = currentSteps.map((step) => completedAgentIds.has(step.assignedAgentId)
                ? { ...step, status: 'completed' as const }
                : step);
            setMasterPlan(updatedSteps);
            const saved = await saveCouncilResult({
                schemaVersion: 1,
                topic: topic.trim(),
                agentIds: agents.map((agent) => agent.id),
                dialogue: roundDialogue.map((entry) => ({
                    ...entry,
                    agentName: agents.find((agent) => agent.id === entry.agentId)?.name ?? 'Expert',
                })),
                synthesis: {
                    consensus: introMessage,
                    actionPlan: updatedSteps.map((step, index) => ({
                        priority: `P${index + 1}`,
                        action: `${step.title} — ${step.description}`,
                        owner: agents.find((agent) => agent.id === step.assignedAgentId)?.name ?? 'À attribuer',
                    })),
                    risksAndSafeguards: [],
                    requiredDocuments: [],
                    nextImmediateStep: updatedSteps[0]?.description ?? 'Valider le plan avec un professionnel qualifié.',
                },
                generatedAt: new Date().toISOString(),
            }, resultId);
            setPersistenceLabel(saved.syncStatus === 'synced' ? 'Session du Conseil synchronisée.' : 'Session conservée dans la file de synchronisation.');
        } catch (error) {
            setSessionError(error instanceof Error ? error.message : 'Le résultat du Conseil n’a pas pu être enregistré.');
        } finally {
            setCurrentSpeakerId(null);
            setIsProcessing(false);
        }
    };

    const downloadMasterPlan = () => {
        if (masterPlan.length === 0) return;
        const content = [
            `Conseil stratégique — ${topic}`,
            '',
            ...masterPlan.map((step, index) => `${index + 1}. ${step.title}\n${step.description}\nResponsable: ${AGENTS.find((agent) => agent.id === step.assignedAgentId)?.name ?? 'À attribuer'}`),
        ].join('\n\n');
        const url = URL.createObjectURL(new Blob([content], { type: 'text/plain;charset=utf-8' }));
        const link = document.createElement('a');
        link.href = url;
        link.download = `conseil-${new Date().toISOString().slice(0, 10)}.txt`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-full bg-slate-900 text-white animate-fade-up relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-900 to-black z-0 pointer-events-none"></div>
            
            {/* Header */}
            <div className="relative z-10 p-6 flex justify-between items-center border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
                        <Users size={24} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight">Conseil Stratégique</h1>
                        <p className="text-xs text-indigo-300 font-medium uppercase tracking-widest">Multi-Agent Intelligence System</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors"><RotateCcw size={20} /></button>
            </div>

            {/* MAIN CONTENT */}
            {!isSessionStarted ? (
                // SETUP SCREEN
                <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10">
                    <div className="max-w-2xl w-full text-center space-y-8">
                        <div className="relative inline-block">
                            <BrainCircuit size={80} className="text-indigo-500 mx-auto mb-4 animate-pulse" />
                            <div className="absolute inset-0 bg-indigo-500 blur-3xl opacity-20"></div>
                        </div>
                        <h2 className="text-4xl font-bold">Quel est votre Grand Projet ?</h2>
                        <p className="text-slate-400 text-lg">
                            Décrivez votre ambition. Le système convoquera automatiquement les meilleurs experts (Juridique, Finance, Voyage...) pour construire votre plan de bataille.
                        </p>
                        
                        <div className="relative group">
                            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                            <div className="relative bg-slate-800 rounded-xl p-2 flex items-center gap-2 border border-white/10">
                                <input 
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                    placeholder="Ex: Je veux créer une startup Tech au Sénégal en partant de France..."
                                    className="flex-1 bg-transparent border-none outline-none text-white p-4 placeholder-slate-500 text-lg"
                                    onKeyDown={(e) => e.key === 'Enter' && startCouncil()}
                                />
                                <button 
                                    onClick={startCouncil}
                                    className="p-4 bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-all shadow-lg text-white"
                                >
                                    <Play size={24} fill="currentColor" />
                                </button>
                            </div>
                        </div>

                        <div className="flex justify-center gap-4 text-sm text-slate-500">
                            <span className="flex items-center gap-1"><Briefcase size={14} /> Business</span>
                            <span className="flex items-center gap-1"><Globe size={14} /> Expatriation</span>
                            <span className="flex items-center gap-1"><Scale size={14} /> Juridique</span>
                            <span className="flex items-center gap-1"><Home size={14} /> Immo</span>
                        </div>
                    </div>
                </div>
            ) : (
                // ACTIVE SESSION
                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative z-10">
                    
                    {/* LEFT: THE BOARD (Visual Agents) */}
                    <div className="flex-1 p-8 flex flex-col items-center justify-center relative">
                        {/* Central Hologram (Topic) */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
                        <div className="z-10 text-center mb-12">
                            <h3 className="text-indigo-300 text-sm font-bold uppercase tracking-widest mb-2">Sujet du Conseil</h3>
                            <div className="text-2xl font-bold text-white max-w-lg leading-relaxed shadow-black drop-shadow-lg">"{topic}"</div>
                        </div>

                        {/* Agents Circle */}
                        <div className="flex gap-8 items-center justify-center flex-wrap max-w-4xl">
                            {activeAgents.map((agent) => (
                                <div key={agent.id} className={`relative transition-all duration-500 ${currentSpeakerId === agent.id ? 'scale-110 -translate-y-4' : 'opacity-80 grayscale hover:grayscale-0'}`}>
                                    <div className={`w-32 h-32 rounded-2xl overflow-hidden border-2 shadow-2xl relative ${currentSpeakerId === agent.id ? 'border-indigo-500 shadow-indigo-500/50' : 'border-white/10'}`}>
                                        <Avatar3D 
                                            avatarId={agent.id} 
                                            state={currentSpeakerId === agent.id ? 'speaking' : 'idle'}
                                            className="w-full h-full"
                                            showHud={false}
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
                                        <div className="absolute bottom-2 left-0 right-0 text-center">
                                            <div className="text-xs font-bold text-white">{agent.name}</div>
                                            <div className="text-[9px] text-slate-300 uppercase">{agent.specialty}</div>
                                        </div>
                                    </div>
                                    {currentSpeakerId === agent.id && (
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white text-slate-900 px-3 py-1 rounded-full text-xs font-bold animate-bounce whitespace-nowrap">
                                            Parle...
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Live Transcript Bubble */}
                        <div className="mt-12 w-full max-w-2xl">
                            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-2xl p-6 min-h-[150px] flex flex-col justify-end shadow-2xl">
                                {chatHistory.slice(-3).map((msg, i) => (
                                    <div key={i} className={`mb-3 last:mb-0 animate-fade-up ${msg.agentId === 'system' ? 'text-indigo-400 italic text-center' : ''}`}>
                                        {msg.agentId !== 'system' && (
                                            <span className="font-bold text-indigo-300 mr-2">
                                                {AGENTS.find(a => a.id === msg.agentId)?.name || 'Moi'}:
                                            </span>
                                        )}
                                        <span className="text-slate-200">{msg.text}</span>
                                    </div>
                                ))}
                                {isProcessing && <div className="text-slate-500 text-xs animate-pulse mt-2">Le conseil délibère...</div>}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: THE MASTER PLAN (Output) */}
                    <div className="w-full lg:w-96 bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/10 flex flex-col shadow-2xl z-20">
                        <div className="p-6 border-b border-white/10 bg-slate-800/50">
                            <h2 className="font-bold text-lg flex items-center gap-2 text-white">
                                <FileText className="text-indigo-500" /> Plan Stratégique
                            </h2>
                            <p className="text-xs text-slate-400 mt-1">Généré en temps réel par le conseil.</p>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {masterPlan.map((step, index) => {
                                const agent = AGENTS.find(a => a.id === step.assignedAgentId);
                                return (
                                    <div key={step.id} className="relative pl-6 border-l-2 border-white/10 last:border-0 pb-6">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${step.status === 'completed' ? 'bg-green-500 border-green-500' : 'bg-slate-900 border-indigo-500'}`}>
                                            {step.status === 'completed' && <CheckCircle size={10} className="text-white absolute inset-0 m-auto" />}
                                        </div>
                                        <div className="mb-1 text-xs font-bold text-indigo-400 uppercase tracking-wider">Étape {index + 1}</div>
                                        <h3 className="font-bold text-white text-sm mb-1">{step.title}</h3>
                                        <p className="text-xs text-slate-400 leading-relaxed mb-3">{step.description}</p>
                                        
                                        {agent && (
                                            <div className="flex items-center gap-2 bg-white/5 p-2 rounded-lg border border-white/5">
                                                <img src={agent.avatarUrl} alt="" className="w-6 h-6 rounded-full" />
                                                <span className="text-xs text-slate-300">Assigné à <b>{agent.name}</b></span>
                                            </div>
                                        )}

                                        {step.status === 'completed' && (
                                            <div className="mt-3">
                                                <button
                                                    type="button"
                                                    onClick={() => void navigator.clipboard.writeText(`${step.title}\n${step.description}`)}
                                                    className="w-full py-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 rounded text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <FileText size={12} /> Copier l’étape
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-white/10 bg-slate-800/50">
                            <button onClick={downloadMasterPlan} className="w-full py-3 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors shadow-lg flex items-center justify-center gap-2">
                                <Sparkles size={16} /> Télécharger le Master Plan
                            </button>
                        </div>
                    </div>

                </div>
            )}
            {(sessionError || persistenceLabel) && (
                <div role={sessionError ? 'alert' : 'status'} className={`absolute bottom-4 left-4 right-4 z-30 rounded-xl border px-4 py-3 text-sm ${sessionError ? 'border-red-400/40 bg-red-950/90 text-red-100' : 'border-emerald-400/40 bg-emerald-950/90 text-emerald-100'}`}>
                    {sessionError ?? persistenceLabel}
                </div>
            )}
        </div>
    );
};
