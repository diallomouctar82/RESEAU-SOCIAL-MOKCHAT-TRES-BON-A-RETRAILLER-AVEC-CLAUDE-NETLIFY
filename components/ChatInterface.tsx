
import React, { useState, useRef, useEffect } from 'react';
import { Send, Image as ImageIcon, Mic, Loader2, User, Phone, MoreVertical, Sparkles, FileText, Database, X } from 'lucide-react';
import { Agent, Message } from '../types';
import { GoogleGenAI } from '@google/genai';
import { SYSTEM_INSTRUCTION } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';
import { memoryService } from '../services/memory';

interface ChatInterfaceProps {
  agent: Agent;
  initialMessage?: string;
  onStartCall?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent, initialMessage, onStartCall }) => {
  const { userProfile } = useGlobal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isContextActive, setIsContextActive] = useState(true); // Toggle RAG
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const currentAvatarUrl = agent.avatarUrl;

  useEffect(() => {
    const loadHistory = async () => {
        // Charger l'historique persistant si disponible
        // Pour l'instant, on initialise avec le message de bienvenue ou l'initial
        if (messages.length === 0) {
             if (initialMessage) {
                handleSendMessage(initialMessage);
            } else {
                setMessages([{
                    id: 'welcome',
                    role: 'model',
                    text: `Bonjour ${userProfile.name.split(' ')[0]} ! Je suis ${agent.name}, ${agent.title}. J'ai accès à votre dossier. Comment puis-je vous aider ?`,
                    timestamp: new Date()
                }]);
            }
        }
    };
    loadHistory();
  }, [agent.id, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text: string = input) => {
    if (!text.trim() && !selectedImage) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: text,
      timestamp: new Date(),
      images: selectedImage ? [selectedImage] : undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // 1. Récupération du Contexte (RAG)
        let contextInjection = "";
        if (isContextActive) {
            contextInjection = await memoryService.retrieveContext(text, userProfile);
        }

        // 2. Construction de l'historique pour l'API
        const historyParts = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }] 
        }));
        
        const currentParts: any[] = [];
        if (selectedImage) {
            currentParts.push({ inlineData: { mimeType: 'image/jpeg', data: selectedImage.split(',')[1] } });
        }
        
        // Injection du contexte système dynamiquement
        const augmentedPrompt = isContextActive 
            ? `[CONTEXTE SYSTÈME DÉTECTÉ]:\n${contextInjection}\n\n[QUESTION UTILISATEUR]: ${text}`
            : text;

        currentParts.push({ text: augmentedPrompt });

        const response = await ai.models.generateContent({
            model: agent.modelConfig.model,
            contents: [...historyParts, { role: 'user', parts: currentParts }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION + `\n\nTu es ${agent.name}, ${agent.title}. ${agent.description}. Utilise le [CONTEXTE SYSTÈME] pour personnaliser tes réponses (nom, documents, statut) si disponible.`,
                // @ts-ignore
                thinkingConfig: agent.modelConfig.thinking ? { thinkingBudget: 1024 } : undefined 
            }
        });

        const responseText = response.text || "Désolé, je n'ai pas pu répondre.";

        const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newAiMsg]);

        // Sauvegarde asynchrone (Simulation)
        // memoryService.saveConversation(agent.id, [...messages, newUserMsg, newAiMsg]);

    } catch (error) {
        console.error("Chat Error", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "Désolé, une erreur est survenue. Veuillez réessayer.",
            timestamp: new Date()
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSelectedImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      {/* Header */}
      <div className="bg-white px-6 py-4 border-b border-gray-200 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-4">
            <div className="relative">
                <img src={agent.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
                <h2 className="font-bold text-lg text-slate-800">{agent.name}</h2>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Sparkles size={12} className="text-brand-500" />
                    <span>{agent.title} • {agent.specialty}</span>
                </div>
            </div>
        </div>
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsContextActive(!isContextActive)}
                className={`p-2 rounded-full transition-all flex items-center gap-2 text-xs font-bold ${isContextActive ? 'bg-brand-50 text-brand-600 ring-1 ring-brand-200' : 'bg-slate-100 text-slate-400'}`}
                title="Accès Mémoire & Coffre-fort"
            >
                <Database size={16} />
                <span className="hidden md:inline">{isContextActive ? 'Mémoire Active' : 'Mémoire Off'}</span>
            </button>
            <div className="h-6 w-px bg-slate-200 mx-1"></div>
            {onStartCall && (
                <button onClick={onStartCall} className="p-3 bg-brand-600 text-white rounded-full hover:bg-brand-700 transition-colors shadow-lg hover:scale-105" title="Appel Audio">
                    <Phone size={20} />
                </button>
            )}
        </div>
      </div>

      {/* MESSAGES LIST */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-8 scroll-smooth">
        {messages.length === 0 && isLoading ? (
            <div className="flex justify-center items-center h-full text-slate-400 gap-2">
                <Loader2 className="animate-spin" /> Chargement de la mémoire...
            </div>
        ) : (
            messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up group`}>
                <div className={`flex gap-4 max-w-[90%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                
                {/* Avatar Container */}
                <div className={`w-10 h-10 flex-shrink-0 relative ${msg.role === 'user' ? '' : 'mt-1'}`}>
                    <div className={`w-full h-full rounded-full flex items-center justify-center shadow-md overflow-visible relative ${msg.role === 'user' ? 'bg-white' : 'bg-gradient-to-br from-brand-50 to-white ring-2 ring-brand-200'}`}>
                        {msg.role === 'user' ? (
                            <div className="w-full h-full rounded-full overflow-hidden flex items-center justify-center bg-white">
                                <User size={20} className="text-slate-400" />
                            </div>
                        ) : (
                            <div className="relative w-full h-full">
                                <img src={currentAvatarUrl} className="w-full h-full object-cover rounded-full" />
                                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse shadow-sm"></div>
                            </div>
                        )}
                    </div>
                </div>

                <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`relative px-6 py-4 rounded-3xl shadow-sm text-[15px] leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-tr-none shadow-brand-500/20' : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-slate-200/50'}`}>
                    {msg.images && msg.images.map((img, i) => (
                        <div key={i} className="mb-4 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                            <img src={img} className="max-w-full max-h-72 object-cover" />
                        </div>
                    ))}
                    <span className="whitespace-pre-wrap">{msg.text}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 px-2">
                        {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </div>
                </div>
                </div>
            </div>
            ))
        )}
        {isLoading && (
           <div className="flex justify-start animate-fade-up">
             <div className="flex flex-row gap-4 max-w-[80%]">
               <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center p-0.5 ring-2 ring-brand-200 relative">
                    <img src={currentAvatarUrl} className="w-full h-full rounded-full object-cover" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full animate-pulse"></div>
               </div>
               <div className="bg-white px-6 py-4 rounded-3xl rounded-tl-none shadow-sm flex items-center gap-3 border border-slate-100">
                 <div className="flex gap-1"><span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce"></span><span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-100"></span><span className="w-2 h-2 bg-brand-400 rounded-full animate-bounce delay-200"></span></div>
               </div>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto relative flex items-end gap-3 bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner focus-within:ring-2 focus-within:ring-brand-500/20 focus-within:border-brand-500 transition-all">
            <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-3 text-slate-400 hover:text-brand-600 hover:bg-white rounded-full transition-all"
            >
                <ImageIcon size={20} />
            </button>
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
            />
            
            <div className="flex-1 py-3 max-h-32 overflow-y-auto">
                {selectedImage && (
                    <div className="mb-2 relative w-fit">
                        <img src={selectedImage} className="h-16 rounded-lg border border-slate-200" />
                        <button 
                            onClick={() => setSelectedImage(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5"
                        >
                            <span className="sr-only">Supprimer</span>
                            <X size={12} />
                        </button>
                    </div>
                )}
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={`Posez une question à ${agent.name}...`}
                    className="w-full bg-transparent outline-none text-slate-700 resize-none h-6 min-h-[24px] max-h-[120px]"
                    style={{ height: 'auto', minHeight: '24px' }}
                    rows={1}
                />
            </div>

            <button 
                onClick={() => handleSendMessage()}
                disabled={!input.trim() && !selectedImage}
                className={`p-3 rounded-full transition-all shadow-md flex items-center justify-center ${(!input.trim() && !selectedImage) ? 'bg-slate-200 text-slate-400' : 'bg-brand-600 text-white hover:bg-brand-700 hover:scale-105'}`}
            >
                <Send size={20} className={(!input.trim() && !selectedImage) ? '' : 'ml-0.5'} />
            </button>
        </div>
        <div className="flex justify-center items-center mt-2 gap-2 text-[10px] text-slate-400">
            {isContextActive && <span className="flex items-center gap-1 text-brand-500 font-bold"><Database size={10} /> Contexte Actif</span>}
            <span>IA générative peut commettre des erreurs.</span>
        </div>
      </div>
    </div>
  );
};
