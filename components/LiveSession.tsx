import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { 
    Mic, 
    MicOff, 
    PhoneOff, 
    Activity, 
    AlertTriangle, 
    Briefcase, 
    Stethoscope, 
    Globe, 
    User, 
    RefreshCw,
    Camera,
    CameraOff,
    Eye,
    Scan,
    Layers,
    Sparkles,
    Send,
    X,
    ArrowLeft
} from 'lucide-react';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { SYSTEM_INSTRUCTION } from '../constants';
import { Agent, MultimodalVisionAnalysis } from '../types';
import { MultimodalCameraHUD } from './MultimodalCameraHUD';
import { mintLiveToken } from '../services/aiGateway';

const LIVE_MODEL = 'gemini-2.5-flash-native-audio-preview-09-2025';

type LiveScenario = 'general' | 'interview' | 'medical' | 'translator';

interface LiveSessionProps {
    agent?: Agent;
    onClose?: () => void;
}

export const LiveSession: React.FC<LiveSessionProps> = ({ agent, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [volume, setVolume] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scenario, setScenario] = useState<LiveScenario>('general');
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const [liveVisionInsight, setLiveVisionInsight] = useState<string | null>(null);
  
  // Audio Refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  useEffect(() => {
    // If agent provided, auto start
    if (agent && !isActive) {
        startSession();
    }
    return () => {
      stopSession();
    };
  }, [agent]);

  const getScenarioInstruction = (s: LiveScenario) => {
      switch(s) {
          case 'interview': return "Vous êtes un recruteur professionnel exigeant. Vous faites passer un entretien d'embauche. Posez des questions pertinentes sur le parcours, les compétences et les motivations.";
          case 'medical': return "Vous êtes un assistant de régulation médicale. Posez des questions précises sur les symptômes pour évaluer l'urgence. Restez calme et rassurant.";
          case 'translator': return "Vous êtes un traducteur universel. Traduisez instantanément et fidèlement tout ce que l'utilisateur dit.";
          default: return "Vous êtes en appel direct. Soyez bref, chaleureux, polyglotte et très utile. Vous êtes un membre éminent de la famille d'experts Diallo.";
      }
  };

  const startSession = async () => {
    if (status === 'connecting' || isActive) return;
    setStatus('connecting');
    setErrorMsg(null);

    try {
      const liveToken = await mintLiveToken(LIVE_MODEL);
      const ai = new GoogleGenAI({ apiKey: liveToken });

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      audioContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      let specificInstruction = "";
      if (agent) {
          specificInstruction = `Tu es ${agent.name}, ${agent.title}. Spécialité: ${agent.specialty}. ${agent.description}. 
          Tu es en appel vocal et visuel multimodal direct avec l'utilisateur. Écoute activement, réponds avec chaleur, empathie et pertinence.`;
      } else {
          specificInstruction = getScenarioInstruction(scenario);
      }

      const instruction = SYSTEM_INSTRUCTION + " " + specificInstruction;
      const voiceName = agent?.metaProfile?.voiceId || 'Henri';

      // IMPORTANT : ai.live.connect() renvoie une Promise qui rejette si la
      // connexion échoue (clé invalide, modèle indisponible, réseau...). Elle
      // doit être attendue (voir `await sessionPromise` plus bas) pour que ce
      // try/catch l'intercepte — sinon l'échec devient une rejection de
      // promesse non gérée : aucun feedback à l'écran, "rien ne se passe"
      // pour l'utilisateur alors que la connexion a bien échoué.
      const sessionPromise = ai.live.connect({
        model: LIVE_MODEL,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: instruction,
        },
        callbacks: {
          onopen: () => {
            console.log('Live session connected');
            setStatus('connected');
            setIsActive(true);

            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              if (!audioContextRef.current) return;

              const inputData = e.inputBuffer.getChannelData(0);
              let sum = 0;
              const step = Math.ceil(inputData.length / 50);
              for(let i=0; i<inputData.length; i+=step) sum += inputData[i] * inputData[i];
              setVolume(Math.min(100, Math.round(Math.sqrt(sum / (inputData.length / step)) * 300)));

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                 session.sendRealtimeInput([{
                    mimeType: 'audio/pcm;rate=16000',
                    data: pcmBlob
                 }]);
              }).catch(e => console.warn('Send audio error', e));
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: any) => {
             const serverContent = msg.serverContent;
             if (serverContent?.modelTurn?.parts) {
                for (const part of serverContent.modelTurn.parts) {
                    if (part.inlineData?.data) {
                        const audioBytes = base64ToUint8Array(part.inlineData.data);
                        if (outputContextRef.current) {
                            const audioBuffer = await decodeAudioData(outputContextRef.current, audioBytes, 24000);
                            playAudioChunk(audioBuffer);
                        }
                    }
                }
             }
             if (serverContent?.interrupted) {
                 stopAllPlayback();
             }
          },
          onerror: (err: any) => {
             console.error('Live session error', err);
             setStatus('error');
             setErrorMsg('La connexion en direct a rencontré un problème.');
             cleanupResources();
             setIsActive(false);
          },
          onclose: () => {
             // Ne pas écraser un message d'erreur déjà affiché : onclose peut
             // se déclencher juste après onerror (fermeture du socket suite à
             // l'échec), auquel cas le statut doit rester "error".
             setStatus(prev => prev === 'error' ? prev : 'disconnected');
             setIsActive(false);
          }
        }
      });

      // Sans ce await, un échec de connexion (clé invalide, modèle
      // indisponible...) ne remontait jamais jusqu'ici : c'était le bug
      // "je clique sur Démarrer l'Appel et rien ne se passe".
      await sessionPromise;

    } catch (e: any) {
      console.error('Live connect failed', e);
      setStatus('error');
      setErrorMsg(e?.message || 'Impossible de démarrer la session.');
      cleanupResources();
      setIsActive(false);
    }
  };

  const playAudioChunk = (buffer: AudioBuffer) => {
    if (!outputContextRef.current) return;
    const ctx = outputContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const now = ctx.currentTime;
    const startTime = Math.max(now, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + buffer.duration;

    sourcesRef.current.add(source);
    source.onended = () => {
        sourcesRef.current.delete(source);
    };
  };

  const stopAllPlayback = () => {
    for (const source of sourcesRef.current.values()) {
        try { source.stop(); } catch(e){}
    }
    sourcesRef.current.clear();
    nextStartTimeRef.current = 0;
  };

  // Libère micro/audio sans toucher au statut affiché — utilisé sur un échec
  // de connexion pour NE PAS écraser le message d'erreur qu'on vient de
  // poser (stopSession(), lui, remet toujours le statut à "disconnected" :
  // l'appeler depuis un catch effaçait silencieusement l'erreur et
  // ramenait l'écran à "Prêt pour la session" sans rien afficher — c'était
  // la cause du "je clique et rien ne se passe" une fois l'appel réellement
  // tenté).
  const cleanupResources = () => {
    stopAllPlayback();

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }
    if (inputSourceRef.current) {
      inputSourceRef.current.disconnect();
      inputSourceRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== 'closed') audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (outputContextRef.current) {
      if (outputContextRef.current.state !== 'closed') outputContextRef.current.close();
      outputContextRef.current = null;
    }
    setVolume(0);
  };

  const stopSession = () => {
    setIsActive(false);
    setStatus('disconnected');
    cleanupResources();
  };

  const handleHangUp = () => {
      stopSession();
      if (onClose) onClose();
  };

  // Toujours disponible, quel que soit l'état de connexion — sans lui,
  // un échec de connexion (ex. clé API/modèle indisponible) laissait
  // l'utilisateur bloqué dans cet écran sans aucun moyen d'en sortir.
  const handleClose = () => {
      stopSession();
      if (onClose) onClose();
  };

  const activeAgentMock: Agent = agent || {
      id: 'diallo-live',
      name: 'Expert Diallo',
      title: 'Conseiller Polyglotte',
      specialty: 'Assistance Multimodale Intelligente',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
      description: 'Expert en direct',
      role: 'coach',
      modelConfig: { model: 'gemini-2.5-flash' }
  };

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center h-full bg-slate-950 text-white p-4 sm:p-6 relative overflow-hidden gap-6">

      {/* Bouton retour / fermer — toujours visible, même avant/pendant une tentative de connexion */}
      {onClose && (
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 z-20 flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold backdrop-blur-sm border border-slate-700 transition-colors"
          title="Retour"
        >
          <ArrowLeft size={16} />
          <span>Retour</span>
        </button>
      )}

      {/* Background Ambient Glow */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center z-0 pointer-events-none">
          <div className="w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-20 animate-pulse" />
        </div>
      )}

      {/* Camera Live Perception Overlay / HUD */}
      {isCameraOpen ? (
        <div className="w-full lg:w-1/2 h-[380px] lg:h-[85vh] z-10">
          <MultimodalCameraHUD 
            activeAgent={activeAgentMock}
            onSendVisionContextToChat={(summary) => {
                setLiveVisionInsight(summary);
            }}
          />
        </div>
      ) : null}

      {/* Main Call Audio & Status Interface */}
      <div className={`z-10 flex flex-col items-center justify-center text-center space-y-6 animate-fade-up ${isCameraOpen ? 'w-full lg:w-1/2' : 'max-w-md w-full'}`}>
        
        {/* Header */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Sparkles size={14} />
            <span>Salon Vocal & Visuel IA</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {agent ? `Appel avec ${agent.name}` : 'Appel Expert Direct'}
          </h2>
          <p className="text-sm text-slate-400">
            {agent 
                ? `${agent.title} • ${agent.specialty}` 
                : (scenario === 'general' ? "Parlez naturellement avec nos experts." : scenario)
            }
          </p>
          {agent && (
            <div className="relative inline-block mt-2">
              <img 
                src={agent.avatarUrl} 
                className="w-24 h-24 rounded-full mx-auto border-4 border-slate-800 shadow-2xl object-cover" 
              />
              <span className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-slate-900 ${status === 'connected' ? 'bg-emerald-500 animate-ping' : 'bg-slate-500'}`} />
            </div>
          )}
        </div>

        {/* Visualizer Circle */}
        <div className="relative my-2">
          <div className={`w-36 h-36 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
            status === 'connected' ? 'border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)] bg-blue-950/30' : 
            status === 'error' ? 'border-red-500 bg-red-900/20' : 'border-slate-800 bg-slate-900/60'
          }`}>
             {status === 'connecting' ? (
                <Activity className="animate-spin text-blue-400" size={42} />
             ) : status === 'connected' ? (
                <div 
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-cyan-400 transition-transform duration-75 shadow-lg flex items-center justify-center text-white"
                  style={{ transform: `scale(${1 + volume / 80})` }}
                >
                  <Activity size={28} className="animate-pulse" />
                </div>
             ) : status === 'error' ? (
                <AlertTriangle className="text-red-500" size={42} />
             ) : (
                <MicOff className="text-slate-600" size={42} />
             )}
          </div>
        </div>

        {/* Status Text */}
        <div className={`text-xs font-bold tracking-wider uppercase ${status === 'error' ? 'text-red-400' : 'text-blue-400'}`}>
          {status === 'disconnected' && 'Prêt pour la session'}
          {status === 'connecting' && 'Connexion sécurisée en cours...'}
          {status === 'connected' && `En direct • Latence ultra-faible (${volume}% audio)`}
          {status === 'error' && (errorMsg || 'Erreur de connexion')}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3">
           {/* Camera Switch */}
           <button
              onClick={() => setIsCameraOpen(!isCameraOpen)}
              className={`p-3.5 rounded-2xl font-bold flex items-center gap-2 border transition-all ${isCameraOpen ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
              title={isCameraOpen ? "Masquer la caméra" : "Activer la caméra & détection"}
           >
              {isCameraOpen ? <CameraOff size={20} /> : <Camera size={20} />}
              <span className="text-xs">{isCameraOpen ? 'Caméra On' : 'Vision Caméra'}</span>
           </button>

           {/* Call / Hangup */}
           {!isActive ? (
             <button 
               onClick={startSession}
               className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-emerald-600/30 transform transition hover:scale-105 flex items-center gap-2 text-sm"
             >
               {status === 'error' ? <RefreshCw size={20} /> : <Mic size={20} />}
               <span>{status === 'error' ? 'Réessayer' : 'Démarrer l\'Appel'}</span>
             </button>
           ) : (
             <button 
               onClick={handleHangUp}
               className="bg-red-600 hover:bg-red-500 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-red-600/30 transform transition hover:scale-105 flex items-center gap-2 text-sm"
             >
               <PhoneOff size={20} />
               <span>Raccrocher</span>
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
