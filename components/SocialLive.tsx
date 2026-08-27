
import React, { useState, useEffect, useRef } from 'react';
import { ACTIVE_LIVES, AGENTS, USER_PROFILE, LIVE_GIFTS } from '../constants';
import { LiveStream, DonationGoal, LiveLayoutMode, LiveDonor, Agent, LivePoll } from '../types';
import { X, Users, Send, Bot, Settings, Signal, Wifi, Activity, Check, Heart, Sparkles, Zap, MessageSquare, Mic, Video, Layout, BarChart3, Command, FileText, Gift, PieChart } from 'lucide-react';
import { GoogleGenAI, Modality } from '@google/genai';
import { decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { Avatar3D } from './Avatar3D';

interface SocialLiveProps {
    liveId: string;
    onClose: () => void;
    initialData?: LiveStream; 
}

export const SocialLive: React.FC<SocialLiveProps> = ({ liveId, onClose, initialData }) => {
    const [liveData] = useState<LiveStream>(initialData || ACTIVE_LIVES.find(l => l.id === liveId) || ACTIVE_LIVES[0]);
    const [aiAgent] = useState<Agent | undefined>(
        liveData.aiAssistantId ? AGENTS.find(a => a.id === liveData.aiAssistantId) : undefined
    );
    
    // Core State
    const [messages, setMessages] = useState<{user:string, text:string, isAi?:boolean, isHost?: boolean}[]>([
        { user: "System", text: `Bienvenue dans le Live de ${liveData.hostName} ! Posez vos questions.`, isAi: true }
    ]);
    const [inputMsg, setInputMsg] = useState('');
    const [viewers, setViewers] = useState(liveData.viewers);
    const [likes, setLikes] = useState(0);
    
    // Interactive State
    const [showGifts, setShowGifts] = useState(false);
    const [activeGiftAnimation, setActiveGiftAnimation] = useState<{icon: string, id: number} | null>(null);
    const [activePoll, setActivePoll] = useState<LivePoll | null>(null);
    
    // AI Co-Pilot State
    const [aiState, setAiState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const [aiActionSuggestion, setAiActionSuggestion] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Simulated Viewer Growth & Random Events
    useEffect(() => {
        const interval = setInterval(() => {
            setViewers(prev => prev + Math.floor(Math.random() * 5));
            if (Math.random() > 0.7) setLikes(prev => prev + Math.floor(Math.random() * 10));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = () => {
        if (!inputMsg.trim()) return;
        setMessages(prev => [...prev, { user: USER_PROFILE.name, text: inputMsg, isHost: true }]);
        setInputMsg('');
        if (inputMsg.toLowerCase().includes('question') && aiAgent) {
            setAiActionSuggestion("L'IA peut répondre à cette question technique.");
        }
    };

    const handleSendGift = (gift: typeof LIVE_GIFTS[0]) => {
        setShowGifts(false);
        // Animate Gift
        const animId = Date.now();
        setActiveGiftAnimation({ icon: gift.icon, id: animId });
        setTimeout(() => setActiveGiftAnimation(null), 3000);
        
        // Add system message
        setMessages(prev => [...prev, { user: "System", text: `${USER_PROFILE.name} a envoyé ${gift.name} ${gift.icon}`, isAi: true }]);
        
        // Trigger AI thanks
        if (aiAgent && Math.random() > 0.5) {
            setTimeout(() => {
                setAiState('speaking');
                setTimeout(() => setAiState('idle'), 2000);
            }, 1000);
        }
    };

    const startPoll = () => {
        const newPoll: LivePoll = {
            id: 'poll-1',
            question: 'Quel sujet pour le prochain live ?',
            options: [
                { id: 'o1', text: 'Intelligence Artificielle', votes: 12 },
                { id: 'o2', text: 'Immigration Canada', votes: 45 },
                { id: 'o3', text: 'Cryptomonnaies', votes: 8 }
            ],
            isActive: true,
            totalVotes: 65
        };
        setActivePoll(newPoll);
        setTimeout(() => setActivePoll(null), 10000); // Auto close after 10s for demo
    };

    const triggerAiAction = async (action: 'greet' | 'summarize' | 'analyze') => {
        if (!aiAgent) return;
        setAiState('thinking');
        
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
            let prompt = "";
            if (action === 'greet') prompt = `Salue les spectateurs de manière enthousiaste pour le live "${liveData.title}".`;
            if (action === 'summarize') prompt = "Résume les derniers sujets discutés dans le chat (invente des sujets pertinents).";
            if (action === 'analyze') prompt = "Analyse le sentiment général du chat et donne un conseil à l'animateur.";

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: [{ role: 'user', parts: [{ text: `Tu es ${aiAgent.name}. ${prompt}` }] }]
            });

            const text = response.text || "Je suis prêt.";
            setAiState('speaking');
            setMessages(prev => [...prev, { user: aiAgent.name, text, isAi: true }]);
            setTimeout(() => setAiState('idle'), 5000); 
        } catch (e) {
            setAiState('idle');
        }
    };

    return (
        <div className="fixed inset-0 bg-black z-[200] flex flex-col md:flex-row overflow-hidden font-sans text-white">
            
            {/* 1. MAIN STAGE */}
            <div className="flex-1 relative bg-gray-900 flex flex-col">
                
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                    <div className="flex items-center gap-3">
                        <div className="bg-red-600 px-3 py-1 rounded-md font-bold text-xs flex items-center gap-2 animate-pulse shadow-red-600/50 shadow-lg">
                            <div className="w-2 h-2 bg-white rounded-full"></div> LIVE
                        </div>
                        <div className="bg-black/40 backdrop-blur-md px-3 py-1 rounded-md flex items-center gap-2 text-xs border border-white/10 font-mono">
                            <Users size={14} /> {viewers.toLocaleString()}
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 bg-black/40 hover:bg-white/20 rounded-full backdrop-blur-md transition-colors border border-white/10">
                        <X size={20} />
                    </button>
                </div>

                {/* Gift Animation Layer */}
                {activeGiftAnimation && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none animate-bounce">
                        <div className="text-9xl filter drop-shadow-[0_0_20px_rgba(255,215,0,0.8)] animate-pulse">
                            {activeGiftAnimation.icon}
                        </div>
                    </div>
                )}

                {/* Poll Overlay */}
                {activePoll && (
                    <div className="absolute top-20 left-4 z-30 bg-white text-slate-900 p-4 rounded-2xl shadow-2xl w-64 animate-scale-in">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-bold text-sm">Sondage en cours</h3>
                            <PieChart size={16} className="text-brand-600" />
                        </div>
                        <p className="text-xs mb-3 font-medium">{activePoll.question}</p>
                        <div className="space-y-2">
                            {activePoll.options.map(opt => (
                                <div key={opt.id} className="relative h-8 bg-slate-100 rounded-lg overflow-hidden">
                                    <div className="absolute top-0 left-0 bottom-0 bg-brand-200 transition-all duration-1000" style={{ width: `${(opt.votes / activePoll.totalVotes) * 100}%` }}></div>
                                    <div className="absolute inset-0 flex justify-between items-center px-2 text-xs font-bold z-10">
                                        <span>{opt.text}</span>
                                        <span>{Math.round((opt.votes / activePoll.totalVotes) * 100)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Video Split */}
                <div className="flex-1 flex relative">
                    <div className={`relative ${aiAgent ? 'w-1/2 border-r border-white/10' : 'w-full'} h-full bg-slate-800`}>
                        <img src={liveData.hostAvatar} className="w-full h-full object-cover opacity-80" />
                        <div className="absolute bottom-4 left-4">
                            <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-sm font-bold flex items-center gap-2">
                                <span className="w-2 h-2 bg-green-500 rounded-full"></span> {liveData.hostName}
                            </div>
                        </div>
                    </div>

                    {aiAgent && (
                        <div className="w-1/2 h-full relative bg-black">
                            <Avatar3D 
                                avatarId={aiAgent.id} 
                                state={aiState === 'listening' ? 'idle' : aiState === 'thinking' ? 'thinking' : aiState === 'speaking' ? 'speaking' : 'idle'}
                                className="w-full h-full"
                            />
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                                {aiState === 'thinking' && <div className="bg-black/70 backdrop-blur-xl px-6 py-3 rounded-full border border-indigo-500/50 text-indigo-300 font-mono text-sm animate-pulse flex items-center gap-3"><Sparkles size={16} /> ANALYSE NEURALE...</div>}
                            </div>
                            <div className="absolute bottom-4 right-4 flex flex-col items-end gap-2">
                                {aiActionSuggestion && (
                                    <div className="bg-indigo-600 text-white p-3 rounded-xl rounded-br-none text-xs font-bold max-w-[200px] shadow-lg animate-fade-up cursor-pointer hover:bg-indigo-500 transition-colors" onClick={() => { triggerAiAction('analyze'); setAiActionSuggestion(null); }}>
                                        💡 {aiActionSuggestion}
                                    </div>
                                )}
                                <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg border border-indigo-500/30 text-sm font-bold flex items-center gap-2 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
                                    <Bot size={16} /> {aiAgent.name} (IA)
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Floating Reactions */}
                <div className="absolute bottom-20 right-4 flex flex-col gap-2 z-30 pointer-events-none">
                    <div className="animate-float-up text-4xl opacity-0" style={{ animationDelay: '0.2s' }}>❤️</div>
                    <div className="animate-float-up text-3xl opacity-0" style={{ animationDelay: '0.5s' }}>🔥</div>
                </div>

                {/* Command Center */}
                <div className="h-20 bg-gray-900 border-t border-white/10 flex items-center px-6 gap-4 z-30">
                    <div className="flex-1 flex gap-2 overflow-x-auto scrollbar-hide">
                        <button onClick={() => triggerAiAction('greet')} className="flex flex-col items-center justify-center w-16 h-full gap-1 group"><div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors"><Mic size={18} /></div><span className="text-[9px] font-bold text-gray-400 group-hover:text-white">Parler</span></button>
                        <button onClick={() => triggerAiAction('summarize')} className="flex flex-col items-center justify-center w-16 h-full gap-1 group"><div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors"><FileText size={18} /></div><span className="text-[9px] font-bold text-gray-400 group-hover:text-white">Résumer</span></button>
                        <button onClick={startPoll} className="flex flex-col items-center justify-center w-16 h-full gap-1 group"><div className="p-2 rounded-xl bg-white/5 group-hover:bg-white/10 border border-white/10 transition-colors"><PieChart size={18} /></div><span className="text-[9px] font-bold text-gray-400 group-hover:text-white">Sondage</span></button>
                    </div>
                    <button onClick={() => setLikes(prev => prev + 1)} className="p-3 bg-gradient-to-tr from-pink-500 to-red-500 rounded-full shadow-lg hover:scale-110 transition-transform active:scale-95"><Heart fill="white" size={24} /></button>
                </div>
            </div>

            {/* 2. INTERACTIVE SIDEBAR */}
            <div className="w-full md:w-96 bg-black border-l border-white/10 flex flex-col h-1/2 md:h-full z-20 relative">
                <div className="flex border-b border-white/10">
                    <button className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-white border-b-2 border-indigo-500 bg-white/5">Chat Direct</button>
                    <button className="flex-1 py-4 text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300">Classement</button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/20">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex items-start gap-3 animate-fade-up ${msg.isAi ? 'bg-indigo-900/20 p-3 rounded-xl border border-indigo-500/20' : ''}`}>
                            <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold border ${msg.isAi ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-gray-800 border-gray-700 text-gray-300'}`}>{msg.isAi ? <Bot size={16} /> : msg.user.charAt(0)}</div>
                            <div><div className="flex items-center gap-2 mb-0.5"><span className={`text-xs font-bold ${msg.isAi ? 'text-indigo-300' : 'text-gray-400'}`}>{msg.user}</span>{msg.isHost && <span className="bg-red-500/20 text-red-400 text-[9px] px-1.5 rounded uppercase font-bold border border-red-500/30">Hôte</span>}</div><p className={`text-sm leading-relaxed ${msg.isAi ? 'text-indigo-100' : 'text-gray-200'}`}>{msg.text}</p></div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-gray-900 border-t border-white/10 relative">
                    {showGifts && (
                        <div className="absolute bottom-full left-0 right-0 bg-gray-900 border-t border-white/10 p-4 grid grid-cols-5 gap-2 animate-fade-up">
                            {LIVE_GIFTS.map(gift => (
                                <button key={gift.id} onClick={() => handleSendGift(gift)} className="flex flex-col items-center gap-1 p-2 hover:bg-white/10 rounded-xl transition-colors">
                                    <span className="text-2xl">{gift.icon}</span>
                                    <span className="text-[10px] font-bold text-yellow-400">{gift.cost}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setShowGifts(!showGifts)} className="p-3 bg-pink-600 rounded-full text-white hover:bg-pink-500"><Gift size={20} /></button>
                        <div className="relative flex-1">
                            <input value={inputMsg} onChange={(e) => setInputMsg(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Envoyer un message..." className="w-full bg-black border border-gray-700 rounded-full pl-4 pr-12 py-3 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none transition-all placeholder-gray-600" />
                            <button onClick={handleSendMessage} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-full hover:bg-indigo-500 text-white transition-colors"><Send size={14} /></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
