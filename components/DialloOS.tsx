
import React, { useState, useEffect, useRef } from 'react';
import { Command, Mic, Sparkles, ArrowRight, X, Zap, Globe, Briefcase, Home, Activity, Scale, StopCircle, Loader2 } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { useNavigate } from 'react-router-dom'; // Assuming routing context, or passed prop
import { UserProfile } from '../types';

interface DialloOSProps {
    isOpen: boolean;
    onClose: () => void;
    onNavigate: (tab: string, context?: any) => void;
    userProfile: UserProfile;
}

type AIAction = {
    type: 'NAVIGATE' | 'NOTIFICATION' | 'EXECUTE';
    target?: string;
    payload?: any;
    explanation: string;
};

export const DialloOS: React.FC<DialloOSProps> = ({ isOpen, onClose, onNavigate, userProfile }) => {
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [aiResponse, setAiResponse] = useState<string | null>(null);
    const [activeAction, setActiveAction] = useState<AIAction | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleVoiceInput = () => {
        if (isListening) return;
        setIsListening(true);
        try {
            const recognition = new (window as any).webkitSpeechRecognition();
            recognition.lang = 'fr-FR';
            recognition.start();
            recognition.onresult = (event: any) => {
                const transcript = event.results[0][0].transcript;
                setInput(transcript);
                handleExecute(transcript);
                setIsListening(false);
            };
            recognition.onerror = () => setIsListening(false);
        } catch (e) {
            console.error("Voice not supported");
            setIsListening(false);
        }
    };

    const handleExecute = async (overrideInput?: string) => {
        const command = overrideInput || input;
        if (!command.trim()) return;

        setIsThinking(true);
        setAiResponse(null);
        setActiveAction(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            
            // SYSTEM PROMPT FOR OS CONTROL
            const systemPrompt = `Tu es Diallo OS, le système d'exploitation intelligent de l'application 'Le Monde à Vous'.
            L'utilisateur est : ${userProfile.name}, Niveau ${userProfile.level}.
            
            Ta mission : Analyser la demande de l'utilisateur et déterminer l'action UI à effectuer dans l'application.
            
            Les modules disponibles (target) sont :
            - 'home' (Dashboard)
            - 'social' (Réseau, Feed)
            - 'world' (Mobilité, Visas, Simulation voyage)
            - 'career' (Emploi, CV, Recrutement)
            - 'campus' (Formation, Cours)
            - 'wallet' (Banque, Transfert)
            - 'legal' (Juridique, Documents)
            - 'health' (Santé, SOS)
            - 'housing' (Logement)
            - 'chat' (Experts IA)
            - 'live' (Appel direct)
            - 'studio' (Création contenu)

            Réponds UNIQUEMENT en JSON strict au format suivant :
            {
                "type": "NAVIGATE",
                "target": "id_du_module",
                "explanation": "Court texte futuriste expliquant l'action (ex: 'Initialisation du protocole de recherche de logement...')",
                "payload": { "searchQuery": "..." } // Optionnel, données contextuelles
            }

            Exemple User: "Je veux partir travailler au Canada"
            Réponse JSON: { "type": "NAVIGATE", "target": "world", "explanation": "Activation du simulateur de mobilité vers le Canada.", "payload": { "country": "Canada", "intent": "work" } }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { text: systemPrompt },
                        { text: `Commande utilisateur : "${command}"` }
                    ]
                },
                config: { responseMimeType: 'application/json' }
            });

            const result = JSON.parse(response.text || '{}') as AIAction;
            
            setAiResponse(result.explanation);
            setActiveAction(result);

            // Execute Navigation with delay for effect
            if (result.type === 'NAVIGATE' && result.target) {
                setTimeout(() => {
                    onNavigate(result.target!, result.payload);
                    onClose();
                }, 2000);
            }

        } catch (e) {
            console.error(e);
            setAiResponse("Commande non reconnue. Veuillez reformuler.");
        } finally {
            setIsThinking(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop with Blur */}
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl transition-opacity duration-300" onClick={onClose}></div>

            <div className="relative w-full max-w-2xl bg-black rounded-3xl shadow-2xl border border-white/10 overflow-hidden animate-scale-in">
                {/* Animated Gradient Border */}
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500 via-purple-500 to-brand-500 opacity-20 animate-shimmer" style={{ backgroundSize: '200% 100%' }}></div>
                
                <div className="relative z-10 p-2">
                    {/* Search Bar */}
                    <div className="flex items-center gap-4 bg-slate-900/90 rounded-2xl p-4 border border-white/10">
                        <div className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-brand-600 text-white'}`}>
                            {isThinking ? <Loader2 className="animate-spin" /> : <Command size={24} />}
                        </div>
                        
                        <input 
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleExecute()}
                            placeholder="Demandez à Diallo OS... (ex: 'Trouve-moi un job au Canada')"
                            className="flex-1 bg-transparent text-xl font-medium text-white placeholder-slate-500 outline-none"
                        />
                        
                        <button onClick={handleVoiceInput} className="text-slate-400 hover:text-white transition-colors">
                            <Mic size={24} className={isListening ? 'text-red-500' : ''} />
                        </button>
                        
                        <button onClick={() => onClose()} className="text-slate-400 hover:text-white transition-colors ml-2">
                            <X size={24} />
                        </button>
                    </div>

                    {/* AI Feedback Area */}
                    <div className="min-h-[150px] p-6 flex flex-col justify-center items-center text-center">
                        {isThinking ? (
                            <div className="space-y-4">
                                <div className="flex gap-2 justify-center">
                                    <span className="w-3 h-3 bg-brand-400 rounded-full animate-bounce"></span>
                                    <span className="w-3 h-3 bg-brand-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-3 h-3 bg-brand-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                                <p className="text-brand-300 font-mono text-sm uppercase tracking-widest">Coordination Famille Diallo en cours...</p>
                            </div>
                        ) : aiResponse ? (
                            <div className="animate-fade-up space-y-4">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-bold uppercase tracking-wider">
                                    <Sparkles size={12} /> Cabinet Famille Diallo
                                </div>
                                <h3 className="text-2xl font-bold text-white leading-relaxed">
                                    "{aiResponse}"
                                </h3>
                                {activeAction?.target && (
                                    <div className="flex justify-center mt-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-400 bg-white/5 px-4 py-2 rounded-lg">
                                            <span>Redirection vers :</span>
                                            <span className="font-bold text-white uppercase">{activeAction.target}</span>
                                            <ArrowRight size={14} className="animate-pulse" />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full opacity-50">
                                {[
                                    { label: 'Carrière', icon: Briefcase, cmd: 'Cherche un emploi...' },
                                    { label: 'Voyage', icon: Globe, cmd: 'Simule mon visa...' },
                                    { label: 'Santé', icon: Activity, cmd: 'J\'ai de la fièvre...' },
                                    { label: 'Logement', icon: Home, cmd: 'Trouve un appart...' },
                                ].map((item, i) => (
                                    <button 
                                        key={i} 
                                        onClick={() => { setInput(item.cmd); handleExecute(item.cmd); }}
                                        className="flex flex-col items-center gap-2 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors border border-white/5"
                                    >
                                        <item.icon className="text-slate-300" />
                                        <span className="text-xs font-bold text-slate-400">{item.label}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Decorative Footer */}
                <div className="h-1 w-full bg-gradient-to-r from-brand-500 via-purple-600 to-brand-500"></div>
            </div>
        </div>
    );
};
