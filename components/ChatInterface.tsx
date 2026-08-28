import React, { useState, useRef, useEffect } from 'react';
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
    Globe,
    Layers,
    Share2,
    ChevronDown,
    ChevronUp,
    Compass,
    Activity,
    AlertTriangle,
    Copy,
    Check,
    ShieldCheck
} from 'lucide-react';
import { Agent, Message } from '../types';
import { SYSTEM_INSTRUCTION } from '../constants';
import { useGlobal } from '../contexts/GlobalContext';
import { memoryService } from '../services/memory';
import { generateTextDetailed } from '../services/aiGateway';
import { MultimodalCameraHUD } from './MultimodalCameraHUD';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { voiceEngine } from '../services/voiceEngine';

interface ExtendedMessage extends Message {
    isError?: boolean;
    /** Outils utilisés pour produire cette réponse (recherche web, dossier...). */
    toolsUsed?: string[];
}

/**
 * Action en attente d'accord. On conserve le prompt et l'instruction du tour
 * afin de pouvoir relancer l'orchestrateur à l'identique une fois la personne
 * d'accord — c'est ce second appel, et lui seul, qui déclenche l'écriture.
 */
interface PendingActionState {
    toolId: string;
    label: string;
    args: Record<string, unknown>;
    prompt: string;
    systemInstruction: string;
}

interface ChatInterfaceProps {
  agent: Agent;
  initialMessage?: string;
  onStartCall?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ agent, initialMessage, onStartCall }) => {
  const { userProfile } = useGlobal();
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingActionState | null>(null);
  const [isContextActive, setIsContextActive] = useState(true); // Toggle RAG
  const [showCameraHUD, setShowCameraHUD] = useState<boolean>(false);
  const [autoReadResponse, setAutoReadResponse] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState<boolean>(false);
  const [voiceVolume, setVoiceVolume] = useState<number>(0);
  const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState<boolean>(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

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
                    text: `Bonjour ${userProfile.name.split(' ')[0]} ! Je suis ${agent.name}, ${agent.title}. J'ai accès à votre dossier souverain. Comment puis-je vous accompagner aujourd'hui ?`,
                    timestamp: new Date()
                }]);
            }
        }
    };
    loadHistory();
  }, [agent.id, initialMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Voice Engine Listener
  useEffect(() => {
      const unsubscribe = voiceEngine.addListener({
          onStart: () => setIsListeningVoice(true),
          onEnd: () => {
              setIsListeningVoice(false);
              setVoiceVolume(0);
          },
          onSpeakingStateChange: (speaking) => {
              if (!speaking) {
                  setPlayingMessageId(null);
              }
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
      return () => {
          unsubscribe();
          voiceEngine.stopSpeaking();
      };
  }, []);

  const handleToggleMessageAudio = (msgId: string, text: string) => {
      if (playingMessageId === msgId) {
          voiceEngine.stopSpeaking();
          setPlayingMessageId(null);
      } else {
          setPlayingMessageId(msgId);
          const voiceId = voiceEngine.getVoiceIdForAgent(agent.role);
          voiceEngine.speak(text, {
              voiceId: voiceId,
              onEnd: () => setPlayingMessageId(null)
          });
      }
  };

  const handleCopyText = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const handleSendMessage = async (text: string = input, imageAttachment?: string) => {
    const messageText = text.trim();
    const activeImage = imageAttachment || selectedImage;

    if (!messageText && !activeImage) return;

    const newUserMsg: ExtendedMessage = {
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
        // 1. Récupération du Contexte (RAG)
        let contextInjection = "";
        if (isContextActive) {
            contextInjection = await memoryService.retrieveContext(messageText, userProfile);
        }

        // 2. Préparation du prompt enrichi
        const augmentedPrompt = isContextActive 
            ? `[CONTEXTE UTILISATEUR & DOSSIER]:\n${contextInjection}\n\n[MESSAGE DE L'UTILISATEUR]:\n${messageText}`
            : messageText;

        const systemInstruction = SYSTEM_INSTRUCTION +
          `\n\nTu es ${agent.name}, ${agent.title}. Spécialité : ${agent.specialty}. ${agent.description}. ` +
          `Tu t'exprimes avec rigueur, bienveillance et des solutions concrètes, en incarnant pleinement ce personnage de la Famille Diallo.`;

        // 3. Exécution via le registre IA central (Super Admin → Connecteurs IA) :
        // sélection automatique du fournisseur actif + bascule en cas d'échec,
        // seul chemin officiel pour tout appel IA de l'application.
        // `agentId` détermine les outils auxquels CET expert a droit (recherche
        // web, dossier de la personne, actions) selon la matrice d'autorisations
        // réglée par l'administrateur — aucun outil n'est codé en dur ici.
        const { text: responseText, toolsUsed, pendingAction: action } = await generateTextDetailed(
            augmentedPrompt,
            { systemInstruction, agentId: agent.id },
        );

        const newAiMsg: ExtendedMessage = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: responseText || (action
                ? "Je peux m'en occuper — confirmez-moi simplement l'action ci-dessous."
                : "Je n'ai pas pu formuler de réponse cette fois-ci. Reformulez votre question ou réessayez dans un instant."),
            timestamp: new Date(),
            toolsUsed,
        };

        setMessages(prev => [...prev, newAiMsg]);

        // Une action attend l'accord explicite de la personne : rien n'a encore
        // été écrit côté serveur, et rien ne le sera tant qu'elle n'aura pas
        // confirmé (voir handleConfirmAction).
        if (action) setPendingAction({ ...action, prompt: augmentedPrompt, systemInstruction });

        // Auto-Lecture Vocale si activée
        if (autoReadResponse) {
            const voiceId = voiceEngine.getVoiceIdForAgent(agent.role);
            setPlayingMessageId(newAiMsg.id);
            voiceEngine.speak(responseText, {
                voiceId: voiceId,
                onEnd: () => setPlayingMessageId(null)
            });
        }

    } catch (error: any) {
        console.error("Erreur de l'orchestrateur IA :", error);
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: error?.message?.includes('Aucun fournisseur')
                ? "Aucun fournisseur IA n'est actuellement actif. Un administrateur doit en configurer un dans Super Admin → Connecteurs & Modèles IA."
                : "Une erreur est survenue lors de la génération de la réponse. Réessayez dans un instant.",
            timestamp: new Date(),
            isError: true
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  /**
   * Accord donné : on relance l'orchestrateur avec `confirmedAction`. C'est ce
   * second appel qui autorise l'écriture — refuser revient simplement à ne rien
   * renvoyer, aucune donnée n'ayant été modifiée entre-temps.
   */
  const handleConfirmAction = async () => {
    if (!pendingAction || isLoading) return;
    const action = pendingAction;
    setPendingAction(null);
    setIsLoading(true);
    try {
        const { text, toolsUsed } = await generateTextDetailed(action.prompt, {
            systemInstruction: action.systemInstruction,
            agentId: agent.id,
            confirmedAction: { toolId: action.toolId, args: action.args },
        });
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: text || "C'est fait.",
            timestamp: new Date(),
            toolsUsed,
        }]);
    } catch (error: any) {
        setMessages(prev => [...prev, {
            id: (Date.now() + 1).toString(),
            role: 'model',
            text: "L'action n'a pas pu être réalisée. Rien n'a été modifié.",
            timestamp: new Date(),
            isError: true,
        }]);
    } finally {
        setIsLoading(false);
    }
  };

  const handleRefuseAction = () => {
    setPendingAction(null);
    setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Entendu, je n'ai rien créé. Dites-moi comment vous préférez procéder.",
        timestamp: new Date(),
    }]);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setSelectedImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleVisionContextReceived = (summary: string, base64Snapshot?: string) => {
      const prompt = `J'ai scanné mon environnement avec la caméra multimodale :\n${summary}\n\nPeux-tu me donner ton analyse experte et tes recommandations d'action immédiates ?`;
      handleSendMessage(prompt, base64Snapshot);
  };

  const getAgentQuickPrompts = () => {
      switch (agent.role) {
          case 'coach':
              return [
                  "Traduire le document à l'écran",
                  "Tester mon niveau de langue",
                  "Conseils de prononciation"
              ];
          case 'juridique':
              return [
                  "Vérifier la conformité de mon dossier visa",
                  "Procédure de titre de séjour",
                  "Recours refus administratif"
              ];
          case 'emploi':
              return [
                  "Optimiser mon CV international",
                  "Simulation d'entretien d'embauche",
                  "Offres disponibles pour mon profil"
              ];
          case 'education':
              return [
                  "Équivalence de mes diplômes",
                  "Préparation aux examens",
                  "Trouver une bourse d'études"
              ];
          case 'sante':
              return [
                  "Évaluer mes symptômes actuels",
                  "Numéros d'urgence médicale",
                  "Pharmacie et couverture santé"
              ];
          case 'logement':
              return [
                  "Calculer mes droits APL",
                  "Vérifier mon contrat de bail",
                  "Logement étudiant & garant"
              ];
          case 'voyage':
              return [
                  "Vérifier les exigences visa du pays",
                  "Trouver le vol le plus avantageux",
                  "Formalités douanières et bagages"
              ];
          default:
              return [
                  "Analyser mon profil",
                  "Résumer ma situation",
                  "Plan d'action immédiat"
              ];
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50 backdrop-blur-xs overflow-hidden">
      
      {/* 1. TOP HEADER MULTIMODAL & LIVE AI STATUS */}
      <div className="bg-slate-900 border-b border-slate-800 px-4 sm:px-6 py-3.5 flex flex-wrap justify-between items-center z-10 gap-3">
        
        {/* Agent Info & Avatar */}
        <div className="flex items-center gap-3.5">
            <div className="relative">
                <img src={agent.avatarUrl} className="w-12 h-12 rounded-2xl object-cover border-2 border-slate-700 shadow-md" alt={agent.name} />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-emerald-400 border-2 border-slate-900 rounded-full animate-pulse shadow-xs" />
            </div>
            <div>
                <div className="flex items-center gap-2">
                    <h2 className="font-bold text-base sm:text-lg text-white tracking-tight">
                        {agent.name}
                    </h2>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                        Expert Diallo
                    </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                    <Sparkles size={13} className="text-amber-400" />
                    <span>{agent.title} • {agent.specialty}</span>
                </div>
            </div>
        </div>

        {/* Live Active AI Provider Status Badge & Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">

            {/* Camera Vision Toggle */}
            <button
                onClick={() => setShowCameraHUD(!showCameraHUD)}
                className={`px-3 py-1.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs border cursor-pointer ${
                    showCameraHUD 
                        ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20' 
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750'
                }`}
                title={showCameraHUD ? "Masquer la caméra" : "Ouvrir la caméra & vision multimodale"}
            >
                <Camera size={15} className={showCameraHUD ? 'animate-pulse' : ''} />
                <span className="hidden md:inline">{showCameraHUD ? 'Caméra Active' : 'Vision IA'}</span>
            </button>

            {/* Memory / Dossier RAG Toggle */}
            <button 
                onClick={() => setIsContextActive(!isContextActive)}
                className={`px-3 py-1.5 rounded-2xl transition flex items-center gap-1.5 text-xs font-bold border cursor-pointer ${
                    isContextActive 
                        ? 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60 shadow-xs' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title="Accès au dossier souverain et mémoire utilisateur"
            >
                <Database size={14} />
                <span className="hidden lg:inline">{isContextActive ? 'Mémoire Active' : 'Mémoire Off'}</span>
            </button>

            {/* Auto-Read Audio Toggle */}
            <button
                onClick={() => setAutoReadResponse(!autoReadResponse)}
                className={`p-2 rounded-2xl transition border cursor-pointer ${
                    autoReadResponse 
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-xs' 
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
                title={autoReadResponse ? "Lecture vocale automatique activée" : "Activer la lecture vocale automatique"}
            >
                {autoReadResponse ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            {/* ElevenLabs HD Voice Button */}
            <button
                onClick={() => setIsVoiceSettingsOpen(true)}
                className="px-2.5 py-1.5 rounded-2xl transition border border-amber-500/40 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                title="Voix HD ElevenLabs des Experts Diallo"
            >
                <Sparkles size={13} className="text-amber-400" />
                <span className="hidden sm:inline">Voix HD</span>
            </button>

            {/* Phone Call Button */}
            {onStartCall && (
                <button 
                    onClick={onStartCall} 
                    className="p-2 bg-blue-600 text-white rounded-2xl hover:bg-blue-500 transition shadow-md shadow-blue-600/30 flex items-center gap-1.5 font-bold text-xs cursor-pointer"
                    title="Lancer l'appel vocal en direct"
                >
                    <Phone size={16} />
                    <span className="hidden xl:inline">Appel</span>
                </button>
            )}
        </div>
      </div>

      {/* 2. MAIN WORKSPACE: SPLIT / FLOATING CAMERA + CONVERSATION */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        
        {/* Left Side: Camera HUD when Active */}
        {showCameraHUD && (
            <div className="w-full lg:w-1/2 h-[320px] lg:h-full p-3 bg-slate-950 border-r border-slate-800 flex flex-col z-20">
                <MultimodalCameraHUD 
                    activeAgent={agent}
                    onSendVisionContextToChat={handleVisionContextReceived}
                />
            </div>
        )}

        {/* Right Side / Main: Messages Feed */}
        <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-900/30">
            
            {/* Message History Feed */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 scroll-smooth">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn group`}>
                        <div className={`flex gap-3 max-w-[94%] sm:max-w-[82%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            {/* Avatar */}
                            <div className={`w-9 h-9 shrink-0 relative ${msg.role === 'user' ? '' : 'mt-1'}`}>
                                <div className={`w-full h-full rounded-xl flex items-center justify-center shadow-md overflow-hidden ${
                                    msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-800 ring-1 ring-slate-700'
                                }`}>
                                    {msg.role === 'user' ? (
                                        <User size={18} />
                                    ) : (
                                        <img src={currentAvatarUrl} className="w-full h-full object-cover" alt={agent.name} />
                                    )}
                                </div>
                            </div>

                            {/* Bubble */}
                            <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`relative px-4 py-3 rounded-2xl shadow-xs text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-blue-600 text-white rounded-tr-none' 
                                        : 'bg-slate-850 text-slate-100 rounded-tl-none border border-slate-750 shadow-md'
                                }`}>
                                    
                                    {/* Images attachments */}
                                    {msg.images && msg.images.map((img, i) => (
                                        <div key={i} className="mb-2.5 rounded-xl overflow-hidden border border-slate-700 shadow-md">
                                            <img src={img} className="max-w-full max-h-56 object-cover" alt="Pièce jointe" />
                                        </div>
                                    ))}

                                    <div className="whitespace-pre-wrap">{msg.text}</div>

                                    {/* Metadata & Actions for Model Responses */}
                                    {msg.role === 'model' && (
                                        <div className="mt-2.5 pt-2 border-t border-slate-750 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => handleToggleMessageAudio(msg.id, msg.text)}
                                                    className={`px-2 py-0.5 rounded-md text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer ${
                                                        playingMessageId === msg.id
                                                            ? 'bg-amber-500 text-slate-950 font-bold shadow-xs animate-pulse'
                                                            : 'text-slate-400 hover:text-amber-300 hover:bg-slate-800'
                                                    }`}
                                                    title="Écouter avec la voix HD ElevenLabs"
                                                >
                                                    <Volume2 size={12} className={playingMessageId === msg.id ? 'animate-spin' : ''} />
                                                    <span>{playingMessageId === msg.id ? 'Lecture...' : 'Écouter'}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleCopyText(msg.id, msg.text)}
                                                    className="px-2 py-0.5 rounded-md text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition flex items-center gap-1 cursor-pointer"
                                                    title="Copier la réponse"
                                                >
                                                    {copiedMessageId === msg.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                                                    <span>{copiedMessageId === msg.id ? 'Copié' : 'Copier'}</span>
                                                </button>
                                            </div>

                                            {/* Indicateur d'erreur */}
                                            {msg.isError && (
                                                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-mono">
                                                    <AlertTriangle size={10} /> Erreur
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="text-[10px] text-slate-500 px-1">
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex justify-start animate-fadeIn">
                        <div className="flex flex-row gap-3 max-w-[80%]">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 shadow-xs flex items-center justify-center p-0.5 ring-1 ring-slate-700 overflow-hidden">
                                <img src={currentAvatarUrl} className="w-full h-full rounded-xl object-cover" alt={agent.name} />
                            </div>
                            <div className="bg-slate-850 px-4 py-3 rounded-2xl rounded-tl-none shadow-md flex items-center gap-2 border border-slate-750">
                                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce" />
                                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                                <span className="w-2 h-2 bg-amber-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                                <span className="text-xs text-slate-400 ml-1 font-medium">{agent.name} analyse avec rigueur...</span>
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Quick Action Prompt Suggestions */}
            <div className="px-4 py-2 bg-slate-900/80 backdrop-blur-md border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
                <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                    <Sparkles size={12} className="text-amber-400" /> Suggestions :
                </span>
                {getAgentQuickPrompts().map((prompt, pIdx) => (
                    <button
                        key={pIdx}
                        onClick={() => handleSendMessage(prompt)}
                        className="px-3 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium border border-slate-700/80 whitespace-nowrap transition active:scale-95 shrink-0 cursor-pointer shadow-xs"
                    >
                        {prompt}
                    </button>
                ))}
            </div>

            {/* Demande d'accord avant toute écriture dans l'application.
                Tant que la personne n'a pas confirmé, rien n'a été modifié :
                l'orchestrateur a suspendu son tour côté serveur. */}
            {pendingAction && (
                <div className="px-3 sm:px-4 pt-3 bg-slate-900 border-t border-slate-800">
                    <div className="max-w-4xl mx-auto p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/40">
                        <div className="flex items-start gap-3">
                            <ShieldCheck size={18} className="text-amber-400 shrink-0 mt-0.5" />
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-amber-200">Confirmation requise</p>
                                <p className="text-sm text-slate-200 mt-1">{pendingAction.label}</p>
                                <p className="text-[11px] text-slate-400 mt-1">
                                    Rien n'a encore été enregistré. Cette action ne sera effectuée qu'avec votre accord.
                                </p>
                                <div className="flex items-center gap-2 mt-3">
                                    <button
                                        onClick={handleConfirmAction}
                                        disabled={isLoading}
                                        className="px-4 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition disabled:opacity-50"
                                    >
                                        Confirmer
                                    </button>
                                    <button
                                        onClick={handleRefuseAction}
                                        className="px-4 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold hover:text-white transition"
                                    >
                                        Annuler
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Bar with Multi-Capabilities */}
            <div className="p-3 sm:p-4 bg-slate-900 border-t border-slate-800">
                <div className="max-w-4xl mx-auto relative flex items-end gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 shadow-inner focus-within:border-amber-500/80 transition-all">
                    
                    {/* Attachment Upload Button */}
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2 text-slate-400 hover:text-amber-400 hover:bg-slate-900 rounded-xl transition cursor-pointer"
                        title="Ajouter une image ou un document"
                    >
                        <ImageIcon size={19} />
                    </button>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                    />

                    {/* Camera Toggle Button */}
                    <button
                        onClick={() => setShowCameraHUD(!showCameraHUD)}
                        className={`p-2 rounded-xl transition cursor-pointer ${
                            showCameraHUD ? 'text-amber-400 bg-amber-500/20' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                        }`}
                        title="Ouvrir la caméra multimodale"
                    >
                        <Camera size={19} />
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
                        className={`p-2 rounded-xl transition cursor-pointer ${
                            isListeningVoice ? 'bg-rose-500 text-white animate-pulse' : 'text-slate-400 hover:text-amber-400 hover:bg-slate-900'
                        }`}
                        title={isListeningVoice ? "Arrêter la dictée" : "Dicter votre message"}
                    >
                        {isListeningVoice ? <MicOff size={19} /> : <Mic size={19} />}
                    </button>
                    
                    {/* Textarea Field */}
                    <div className="flex-1 py-1.5 max-h-32 overflow-y-auto">
                        {selectedImage && (
                            <div className="mb-2 relative w-fit">
                                <img src={selectedImage} className="h-16 rounded-xl border border-slate-700 object-cover" alt="Aperçu" />
                                <button 
                                    onClick={() => setSelectedImage(null)}
                                    className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full p-1 shadow-md hover:bg-rose-700 transition"
                                >
                                    <X size={11} />
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
                            placeholder={isListeningVoice ? "Écoute en cours... parlez !" : `Échangez avec ${agent.name}...`}
                            className="w-full bg-transparent outline-none text-slate-100 placeholder-slate-500 resize-none h-6 min-h-[24px] max-h-[120px] text-sm"
                            rows={1}
                        />
                    </div>

                    {/* Send Button */}
                    <button 
                        onClick={() => handleSendMessage()}
                        disabled={!input.trim() && !selectedImage}
                        className={`p-2.5 rounded-xl transition shadow-md flex items-center justify-center cursor-pointer ${
                            (!input.trim() && !selectedImage) 
                                ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 font-bold active:scale-95'
                        }`}
                    >
                        <Send size={16} />
                    </button>
                </div>

                <div className="flex justify-between items-center mt-2 px-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2">
                        {isContextActive && (
                            <span className="flex items-center gap-1 text-emerald-400 font-medium">
                                <Database size={10} /> Mémoire Souveraine Active
                            </span>
                        )}
                        {showCameraHUD && (
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                                <Eye size={10} /> Vision Multimodale Active
                            </span>
                        )}
                    </div>
                </div>
            </div>

        </div>
      </div>

      {/* Modal de Sélection des Voix ElevenLabs */}
      <VoiceSettingsModal
          isOpen={isVoiceSettingsOpen}
          onClose={() => setIsVoiceSettingsOpen(false)}
          currentAgentRole={agent.role}
      />

    </div>
  );
};
