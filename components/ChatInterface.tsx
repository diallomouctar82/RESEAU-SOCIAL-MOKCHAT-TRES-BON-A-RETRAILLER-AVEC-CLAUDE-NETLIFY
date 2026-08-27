import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Send, 
    Image as ImageIcon, 
    Mic, 
    MicOff,
    Loader2, 
    User, 
    Phone, 
    Sparkles, 
    FileText, 
    Database, 
    X,
    Camera,
    CameraOff,
    Scan,
    Volume2,
    VolumeX,
    Eye,
    Zap,
    Globe,
    Layers,
    Share2,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    Compass
} from 'lucide-react';
import { Agent, Message } from '../types';
import { AIProxyClient } from '../services/aiProxy';
import { SYSTEM_INSTRUCTION } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';
import { memoryService } from '../services/memory';
import { MultimodalCameraHUD } from './MultimodalCameraHUD';
import { VoiceInteractionBar } from './VoiceInteractionBar';
import { voiceEngine } from '../services/voiceEngine';

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
  const [showCameraHUD, setShowCameraHUD] = useState<boolean>(false);
  const [cameraLayout, setCameraLayout] = useState<'split' | 'floating'>('split');
  const [autoReadResponse, setAutoReadResponse] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const currentAvatarUrl = agent.avatarUrl;

  // Initialisation de la conversation
  useEffect(() => {
    const loadHistory = async () => {
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

  // Voice Engine Listener
  useEffect(() => {
      const unsubscribe = voiceEngine.addListener({
          onStart: () => setIsListeningVoice(true),
          onEnd: () => {
              setIsListeningVoice(false);
              setVoiceVolume(0);
          },
          onTranscript: (transcript, isFinal) => {
              if (isFinal && transcript.trim()) {
                  handleSendMessage(transcript);
              } else {
                  setInput(transcript);
              }
          },
          onSpeechVolume: (vol) => setVoiceVolume(vol)
      });
      return () => unsubscribe();
  }, []);

  const handleSendMessage = async (text: string = input, imageAttachment?: string) => {
    const messageText = text.trim();
    const activeImage = imageAttachment || selectedImage;

    if (!messageText && !activeImage) return;

    const newUserMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: messageText,
      timestamp: new Date(),
      images: activeImage ? [activeImage] : undefined
    };

    setMessages(prev => [...prev, newUserMsg]);
    setInput('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
        const ai = new AIProxyClient();
        
        // 1. Récupération du Contexte (RAG)
        let contextInjection = "";
        if (isContextActive) {
            contextInjection = await memoryService.retrieveContext(messageText, userProfile);
        }

        // 2. Construction de l'historique pour l'API
        const historyParts = messages.map(m => ({
            role: m.role,
            parts: [{ text: m.text }] 
        }));
        
        const currentParts: any[] = [];
        if (activeImage) {
            const cleanBase64 = activeImage.includes(',') ? activeImage.split(',')[1] : activeImage;
            currentParts.push({ inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } });
        }
        
        // Injection du contexte système dynamiquement
        const augmentedPrompt = isContextActive 
            ? `[CONTEXTE SYSTÈME DÉTECTÉ]:\n${contextInjection}\n\n[MESSAGE UTILISATEUR]: ${messageText}`
            : messageText;

        currentParts.push({ text: augmentedPrompt });

        const response = await ai.models.generateContent({
            model: agent.modelConfig.model,
            contents: [...historyParts, { role: 'user', parts: currentParts }],
            config: {
                systemInstruction: SYSTEM_INSTRUCTION + `\n\nTu es ${agent.name}, ${agent.title}. Spécialité: ${agent.specialty}. ${agent.description}. Utilise le [CONTEXTE SYSTÈME] pour personnaliser tes réponses avec un ton humain, chaleureux et rigoureux.`,
                // @ts-ignore
                thinkingConfig: agent.modelConfig.thinking ? { thinkingBudget: 1024 } : undefined 
            }
        });

        const responseText = response.text || "Désolé, je n'ai pas pu générer de réponse.";

        const newAiMsg: Message = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText,
            timestamp: new Date()
        };
        setMessages(prev => [...prev, newAiMsg]);

        // Auto-Lecture Vocale si activée
        if (autoReadResponse) {
            voiceEngine.speak(responseText, {
                voiceName: agent.metaProfile?.voiceId || 'Henri',
                rate: 1.05
            });
        }

    } catch (error) {
        console.error("Chat Error", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "Désolé, une erreur est survenue lors du traitement. Veuillez réessayer.",
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

  const handleVisionContextReceived = (summary: string, base64Snapshot?: string, ocrText?: string) => {
      const prompt = `J'ai scanné mon environnement avec la caméra multimodale :\n${summary}\n\nPux-tu me donner ton analyse experte et tes recommandations d'action immédiates ?`;
      handleSendMessage(prompt, base64Snapshot);
  };

  const getAgentQuickPrompts = () => {
      switch (agent.role) {
          case 'coach': // Diallo Langues
              return [
                  "Traduire le document à l'écran",
                  "Tester mon niveau de langue",
                  "Conseils de prononciation"
              ];
          case 'juridique': // Maître Diallo
              return [
                  "Vérifier la conformité de mon dossier visa",
                  "Procédure de titre de séjour",
                  "Recours refus administratif"
              ];
          case 'emploi': // Conseiller Diallo
              return [
                  "Optimiser mon CV international",
                  "Simulation d'entretien d'embauche",
                  "Offres disponibles pour mon profil"
              ];
          case 'education': // Professeur Diallo
              return [
                  "Équivalence de mes diplômes",
                  "Préparation aux examens",
                  "Trouver une bourse d'études"
              ];
          case 'sante': // Docteur Diallo
              return [
                  "Évaluer mes symptômes actuels",
                  "Numéros d'urgence médicale",
                  "Pharmacie et couverture santé"
              ];
          case 'logement': // Monsieur Diallo
              return [
                  "Calculer mes droits APL",
                  "Vérifier mon contrat de bail",
                  "Logement étudiant & garant"
              ];
          case 'voyage': // Guide Diallo
              return [
                  "Vérifier les exigences visa du pays",
                  "Trouver le vol le plus avantageux",
                  "Formalités douanières et bagages"
              ];
          default:
              return [
                  "Comment pouvez-vous m'aider aujourd'hui ?",
                  "Analyser mon profil",
                  "Résumer ma situation"
              ];
      }
  };

  const lastModelMsg = [...messages].reverse().find(m => m.role === 'model')?.text;

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-hidden">
      
      {/* 1. TOP HEADER MULTIMODAL */}
      <div className="bg-white px-4 sm:px-6 py-3.5 border-b border-gray-200 flex flex-wrap justify-between items-center shadow-xs z-10 gap-3">
        
        {/* Agent Info */}
        <div className="flex items-center gap-3.5">
            <div className="relative">
                <img src={agent.avatarUrl} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" />
                <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-white rounded-full animate-pulse shadow-xs" />
            </div>
            <div>
                <h2 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                    <span>{agent.name}</span>
                </h2>
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Sparkles size={13} className="text-blue-500" />
                    <span>{agent.title} • {agent.specialty}</span>
                </div>
            </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
            
            {/* Camera Vision Toggle */}
            <button
                onClick={() => setShowCameraHUD(!showCameraHUD)}
                className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs border ${showCameraHUD ? 'bg-blue-600 text-white border-blue-600 shadow-blue-500/20' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'}`}
                title={showCameraHUD ? "Masquer la caméra" : "Ouvrir la caméra & perception visuelle IA"}
            >
                <Camera size={16} className={showCameraHUD ? 'animate-pulse' : ''} />
                <span className="hidden sm:inline">{showCameraHUD ? 'Caméra Active' : 'Caméra & Vision IA'}</span>
            </button>

            {/* Mémoire Active Toggle */}
            <button 
                onClick={() => setIsContextActive(!isContextActive)}
                className={`px-3 py-2 rounded-2xl transition-all flex items-center gap-2 text-xs font-bold border ${isContextActive ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-100 text-slate-400 border-slate-200'}`}
                title="Accès Mémoire & Dossier utilisateur"
            >
                <Database size={15} />
                <span className="hidden md:inline">{isContextActive ? 'Mémoire Active' : 'Mémoire Off'}</span>
            </button>

            {/* Auto-Read Audio Toggle */}
            <button
                onClick={() => setAutoReadResponse(!autoReadResponse)}
                className={`p-2.5 rounded-2xl transition-all border ${autoReadResponse ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'}`}
                title={autoReadResponse ? "Lecture vocale automatique activée" : "Activer la lecture vocale automatique"}
            >
                {autoReadResponse ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1 hidden sm:block" />

            {/* Phone Live Call Button */}
            {onStartCall && (
                <button 
                    onClick={onStartCall} 
                    className="p-2.5 bg-blue-600 text-white rounded-2xl hover:bg-blue-700 transition-all shadow-md shadow-blue-600/30 hover:scale-105 flex items-center gap-1.5 font-bold text-xs"
                    title="Lancer l'appel vocal en direct"
                >
                    <Phone size={18} />
                    <span className="hidden lg:inline">Appel Direct</span>
                </button>
            )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: SPLIT / FLOATING CAMERA + CONVERSATION */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Side: Camera HUD when Active */}
        {showCameraHUD && (
            <div className="w-full lg:w-1/2 h-[340px] lg:h-full p-3 bg-slate-900 border-r border-slate-800 flex flex-col z-20">
                <MultimodalCameraHUD 
                    activeAgent={agent}
                    onSendVisionContextToChat={handleVisionContextReceived}
                />
            </div>
        )}

        {/* Right Side / Main: Messages Feed */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Message History */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-up group`}>
                        <div className={`flex gap-3.5 max-w-[92%] sm:max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`w-10 h-10 flex-shrink-0 relative ${msg.role === 'user' ? '' : 'mt-1'}`}>
                                <div className={`w-full h-full rounded-2xl flex items-center justify-center shadow-md overflow-hidden ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white ring-2 ring-blue-100'}`}>
                                    {msg.role === 'user' ? (
                                        <User size={20} />
                                    ) : (
                                        <img src={currentAvatarUrl} className="w-full h-full object-cover" />
                                    )}
                                </div>
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col gap-1.5 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`relative px-5 py-3.5 rounded-3xl shadow-xs text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 rounded-tl-none border border-slate-100 shadow-sm'}`}>
                                    
                                    {/* Images attachments */}
                                    {msg.images && msg.images.map((img, i) => (
                                        <div key={i} className="mb-3 rounded-2xl overflow-hidden border border-slate-200/50 shadow-md">
                                            <img src={img} className="max-w-full max-h-60 object-cover" />
                                        </div>
                                    ))}

                                    <div className="whitespace-pre-wrap">{msg.text}</div>
                                </div>

                                <div className="text-[10px] text-slate-400 px-2">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start animate-fade-up">
                        <div className="flex flex-row gap-3 max-w-[80%]">
                            <div className="w-10 h-10 rounded-2xl bg-white shadow-xs flex items-center justify-center p-0.5 ring-2 ring-blue-100 overflow-hidden">
                                <img src={currentAvatarUrl} className="w-full h-full rounded-2xl object-cover" />
                            </div>
                            <div className="bg-white px-5 py-3.5 rounded-3xl rounded-tl-none shadow-xs flex items-center gap-2 border border-slate-100">
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                <span className="text-xs text-slate-400 ml-1 font-medium">{agent.name} réfléchit...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Prompt Chips */}
            <div className="px-4 py-2 bg-white/80 backdrop-blur-sm border-t border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 flex-shrink-0">
                    <Sparkles size={12} className="text-blue-500" /> Suggestions :
                </span>
                {getAgentQuickPrompts().map((prompt, pIdx) => (
                    <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-3 py-1 rounded-full bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-medium border border-slate-200/60 whitespace-nowrap transition-all active:scale-95 flex-shrink-0"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Input Bar with Voice & Attachments */}
            <div className="p-3 sm:p-4 bg-white border-t border-slate-100">
                <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-50 p-2 rounded-3xl border border-slate-200 shadow-inner focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
                    
                    {/* Attachment Upload Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-full transition-all"
                        title="Ajouter une image ou un document"
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

                    {/* Camera Quick Toggle Button in Input */}
                    <button
                        onClick={() => setShowCameraHUD(!showCameraHUD)}
                        className={`p-2.5 rounded-full transition-all ${showCameraHUD ? 'text-blue-600 bg-blue-100' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`}
                        title="Ouvrir la caméra multimodale"
                    >
                        <Camera size={20} />
                    </button>

                    {/* Voice Dictation Button */}
                    <button
                        onClick={() => {
                            if (isListeningVoice) {
                                voiceEngine.stopListening();
                            } else {
                                voiceEngine.startListening('fr-FR');
                            }
                        }}
                        className={`p-2.5 rounded-full transition-all ${isListeningVoice ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`}
                        title={isListeningVoice ? "Arrêter la dictée" : "Dicter votre message"}
                    >
                        {isListeningVoice ? <MicOff size={20} /> : <Mic size={20} />}
                    </button>
                    
                    {/* Text Field */}
                    <div className="flex-1 py-2 max-h-32 overflow-y-auto">
                        {selectedImage && (
                            <div className="mb-2 relative w-fit">
                                <img src={selectedImage} className="h-16 rounded-xl border border-slate-200 object-cover" />
                                <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
                                >
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
                            placeholder={isListeningVoice ? "Écoute en cours... parlez !" : `Posez une question à ${agent.name}...`}
                            className="w-full bg-transparent outline-none text-slate-800 placeholder-slate-400 resize-none h-6 min-h-[24px] max-h-[120px] text-sm"
                            rows={1}
                        />
                    </div>

                    {/* Send Button */}
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() && !selectedImage}
                        className={`p-3 rounded-2xl transition-all shadow-md flex items-center justify-center ${(!input.trim() && !selectedImage) ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 hover:scale-105'}`}
                    >
                        <Send size={18} className={(!input.trim() && !selectedImage) ? '' : 'ml-0.5'} />
                    </button>
                </div>

                <div className="flex justify-between items-center mt-2 px-2 text-[10px] text-slate-400">
                    <div className="flex items-center gap-2">
                        {isContextActive && (
                            <span className="flex items-center gap-1 text-blue-600 font-bold">
                                <Database size={10} /> Mémoire & Contexte Actifs
                            </span>
                        )}
                        {showCameraHUD && (
                            <span className="flex items-center gap-1 text-emerald-600 font-bold">
                                <Eye size={10} /> Vision Multimodale Connectée
                            </span>
                        )}
                    </div>
                    <span>IA générative multimodale en temps réel.</span>
                </div>
            </div>

        </div>
      </div>

    </div>
  );
};
