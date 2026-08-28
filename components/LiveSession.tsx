import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  PhoneOff,
  Activity,
  AlertTriangle,
  Camera,
  CameraOff,
  RefreshCw,
  Sparkles,
  Volume2,
  ShieldCheck
} from 'lucide-react';
import { SYSTEM_INSTRUCTION } from '../constants';
import { Agent } from '../types';
import { MultimodalCameraHUD } from './MultimodalCameraHUD';
import { aiRoutingService } from '../services/aiRoutingService';
import { voiceEngine } from '../services/voiceEngine';

type LiveScenario = 'general' | 'interview' | 'medical' | 'translator';
type CallStatus = 'disconnected' | 'connecting' | 'connected' | 'thinking' | 'speaking' | 'error';

interface LiveSessionProps {
  agent?: Agent;
  onClose?: () => void;
}

/**
 * Appel Expert résilient.
 *
 * Important: aucun secret IA n'est lu dans le navigateur. La conversation passe
 * par aiRoutingService -> /api/ai/chat (proxy serveur Netlify) avec bascule entre
 * fournisseurs. La voix utilise voiceEngine -> /api/tts (ElevenLabs côté serveur)
 * puis le moteur vocal natif comme repli gracieux.
 */
export const LiveSession: React.FC<LiveSessionProps> = ({ agent, onClose }) => {
  const [status, setStatus] = useState<CallStatus>('disconnected');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [scenario] = useState<LiveScenario>('general');
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [volume, setVolume] = useState(0);
  const [lastUserText, setLastUserText] = useState('');
  const [lastExpertText, setLastExpertText] = useState('');
  const [providerLabel, setProviderLabel] = useState(aiRoutingService.getActiveEngineInfo().name);
  const [ttsLabel, setTtsLabel] = useState<'ElevenLabs HD' | 'Voix système'>('ElevenLabs HD');
  const [liveVisionInsight, setLiveVisionInsight] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const busyRef = useRef(false);
  const lastHandledRef = useRef<{ text: string; at: number }>({ text: '', at: 0 });

  const activeAgent: Agent = agent || {
    id: 'diallo-live',
    name: 'Expert Diallo',
    title: 'Conseiller Polyglotte',
    specialty: 'Assistance Multimodale',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300',
    description: 'Accompagnement en direct',
    role: 'coach',
    modelConfig: { model: 'gemini-2.5-flash' }
  };

  const getScenarioInstruction = (s: LiveScenario) => {
    switch (s) {
      case 'interview':
        return "Conduis un entretien professionnel structuré, avec des questions courtes et une écoute active.";
      case 'medical':
        return "Aide à clarifier la situation avec prudence, sans diagnostic définitif, et oriente vers une prise en charge appropriée si nécessaire.";
      case 'translator':
        return "Traduis fidèlement et immédiatement ce que l'utilisateur demande, en restant naturel à l'oral.";
      default:
        return "Tu es en appel direct. Réponds de façon brève, naturelle, chaleureuse et concrète, comme dans une vraie conversation téléphonique.";
    }
  };

  const buildSystemInstruction = () => `${SYSTEM_INSTRUCTION}\n\nTu es ${activeAgent.name}, ${activeAgent.title}. Spécialité : ${activeAgent.specialty}. ${activeAgent.description}. ${getScenarioInstruction(scenario)} Évite les réponses trop longues à l'oral. Pose une seule question à la fois quand une clarification est nécessaire.`;

  const handleExpertTurn = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || busyRef.current) return;

    // Le Web Speech API peut remonter deux fois le même segment final selon le navigateur.
    const now = Date.now();
    if (lastHandledRef.current.text === text && now - lastHandledRef.current.at < 3500) return;
    lastHandledRef.current = { text, at: now };

    busyRef.current = true;
    setLastUserText(text);
    setStatus('thinking');
    setErrorMsg(null);
    voiceEngine.stopListening();
    voiceEngine.notifyConversationalTurn('ai_thinking');

    try {
      const result = await aiRoutingService.executeWithResilience({
        prompt: text,
        systemInstruction: buildSystemInstruction(),
        preferredModel: activeAgent.modelConfig?.model
      });

      if (!mountedRef.current) return;
      const responseText = result.text?.trim() || "Je vous écoute. Pouvez-vous préciser votre demande ?";
      setProviderLabel(result.providerUsed?.name || aiRoutingService.getActiveEngineInfo().name);
      setLastExpertText(responseText);
      setStatus('speaking');

      const voiceId = voiceEngine.getVoiceIdForAgent(activeAgent.role);
      await voiceEngine.speak(responseText, {
        voiceId,
        stability: 0.56,
        similarity_boost: 0.82,
        onStart: () => mountedRef.current && setStatus('speaking'),
        onEnd: () => {
          if (!mountedRef.current) return;
          setStatus('connected');
        }
      });
    } catch (error: any) {
      console.error('[LiveSession] expert turn failed', error);
      if (mountedRef.current) {
        setErrorMsg(error?.message || "Le moteur de conversation est temporairement indisponible.");
        setStatus('error');
      }
    } finally {
      busyRef.current = false;
      if (mountedRef.current && isMicEnabled && status !== 'disconnected') {
        // voiceEngine redémarre déjà automatiquement après la synthèse en mode conversationnel.
        voiceEngine.setConversationalMode(true);
      }
    }
  };

  const startSession = async () => {
    if (status === 'connecting' || status === 'connected' || status === 'thinking' || status === 'speaking') return;
    setStatus('connecting');
    setErrorMsg(null);

    try {
      if (!voiceEngine.isSpeechRecognitionSupported()) {
        throw new Error("La reconnaissance vocale n'est pas disponible dans ce navigateur. Utilisez Chrome/Edge récent ou le chat texte.");
      }

      voiceEngine.setConversationalMode(true);
      const started = await voiceEngine.startListening('fr-FR');
      if (!started) throw new Error("Le microphone n'a pas pu démarrer. Vérifiez son autorisation dans le navigateur.");
      if (mountedRef.current) {
        setIsMicEnabled(true);
        setStatus('connected');
      }
    } catch (error: any) {
      console.error('[LiveSession] start failed', error);
      if (mountedRef.current) {
        setStatus('error');
        setErrorMsg(error?.message || "Impossible de démarrer l'appel.");
      }
    }
  };

  const stopSession = () => {
    busyRef.current = false;
    voiceEngine.setConversationalMode(false);
    voiceEngine.stopListening();
    voiceEngine.stopSpeaking();
    setVolume(0);
    setStatus('disconnected');
  };

  const toggleMic = async () => {
    if (isMicEnabled) {
      voiceEngine.setConversationalMode(false);
      voiceEngine.stopListening();
      setIsMicEnabled(false);
      setVolume(0);
    } else {
      voiceEngine.setConversationalMode(true);
      const ok = await voiceEngine.startListening('fr-FR');
      if (ok) {
        setIsMicEnabled(true);
        setStatus('connected');
        setErrorMsg(null);
      } else {
        setErrorMsg("Impossible d'activer le microphone.");
        setStatus('error');
      }
    }
  };

  const handleHangUp = () => {
    stopSession();
    onClose?.();
  };

  useEffect(() => {
    mountedRef.current = true;
    const unsubscribeVoice = voiceEngine.addListener({
      onTranscript: (transcript, isFinal) => {
        if (isFinal && transcript.trim()) handleExpertTurn(transcript);
      },
      onSpeechVolume: value => setVolume(value),
      onError: error => {
        if (error !== 'no-speech') setErrorMsg(`Microphone : ${error}`);
      },
      onTtsEngineChange: engine => setTtsLabel(engine === 'elevenlabs' ? 'ElevenLabs HD' : 'Voix système'),
      onConversationalTurnChange: turn => {
        if (!mountedRef.current) return;
        if (turn === 'ai_thinking') setStatus('thinking');
        if (turn === 'ai_speaking') setStatus('speaking');
        if (turn === 'waiting_user') setStatus('connected');
      }
    });

    const unsubscribeRouting = aiRoutingService.subscribe(() => {
      const last = aiRoutingService.getLastExecutionInfo();
      if (last?.providerUsedName) setProviderLabel(last.providerUsedName);
    });

    // Le clic sur Vocal/Vidéo vient de l'utilisateur; on tente donc immédiatement le micro.
    const timer = window.setTimeout(() => startSession(), 80);

    return () => {
      mountedRef.current = false;
      window.clearTimeout(timer);
      unsubscribeVoice();
      unsubscribeRouting();
      voiceEngine.setConversationalMode(false);
      voiceEngine.stopListening();
      voiceEngine.stopSpeaking();
    };
    // Le changement d'expert remonte un nouveau LiveSession.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAgent.id]);

  const statusText = status === 'connecting' ? 'Connexion du microphone…'
    : status === 'thinking' ? `${activeAgent.name} prépare sa réponse…`
    : status === 'speaking' ? `${activeAgent.name} vous répond…`
    : status === 'connected' ? 'En direct — parlez naturellement'
    : status === 'error' ? (errorMsg || 'Connexion interrompue')
    : 'Appel terminé';

  return (
    <div className="flex flex-col lg:flex-row items-center justify-center h-full bg-slate-950 text-white p-4 sm:p-6 relative overflow-hidden gap-5">
      {(status === 'connected' || status === 'thinking' || status === 'speaking') && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 bg-blue-600 rounded-full blur-3xl opacity-15 animate-pulse" />
        </div>
      )}

      {isCameraOpen && (
        <div className="w-full lg:w-1/2 h-[340px] lg:h-[82vh] z-10 rounded-2xl overflow-hidden">
          <MultimodalCameraHUD
            activeAgent={activeAgent}
            onSendVisionContextToChat={(summary) => {
              setLiveVisionInsight(summary);
              handleExpertTurn(`Contexte caméra : ${summary}`);
            }}
          />
        </div>
      )}

      <div className={`z-10 flex flex-col items-center justify-center text-center gap-5 ${isCameraOpen ? 'w-full lg:w-1/2' : 'max-w-lg w-full'}`}>
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold">
            <ShieldCheck size={14} /> Appel Expert sécurisé & résilient
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Appel avec {activeAgent.name}</h2>
          <p className="text-sm text-slate-400">{activeAgent.title} • {activeAgent.specialty}</p>
        </div>

        <div className="relative">
          <img src={activeAgent.avatarUrl} alt={activeAgent.name} className="w-28 h-28 rounded-full object-cover border-4 border-slate-800 shadow-2xl" />
          <span className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 border-slate-950 ${status === 'error' ? 'bg-red-500' : status === 'disconnected' ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'}`} />
        </div>

        <div className="relative h-20 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${status === 'error' ? 'bg-red-500/15 text-red-400' : 'bg-blue-500/15 text-blue-300'}`} style={{ transform: `scale(${1 + Math.min(volume, 100) / 250})` }}>
            {status === 'connecting' || status === 'thinking' ? <RefreshCw className="animate-spin" size={28} /> : status === 'error' ? <AlertTriangle size={28} /> : status === 'speaking' ? <Volume2 className="animate-pulse" size={28} /> : <Activity size={28} />}
          </div>
        </div>

        <div className={`text-xs font-bold tracking-wide ${status === 'error' ? 'text-red-300' : 'text-blue-300'}`}>{statusText}</div>

        <div className="grid grid-cols-2 gap-2 w-full text-left text-[11px]">
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-500 mb-1">Moteur conversation</div>
            <div className="font-bold text-slate-200 truncate">{providerLabel}</div>
          </div>
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-3">
            <div className="text-slate-500 mb-1">Voix</div>
            <div className="font-bold text-slate-200">{ttsLabel}</div>
          </div>
        </div>

        {(lastUserText || lastExpertText) && (
          <div className="w-full bg-slate-900/75 border border-slate-800 rounded-2xl p-3 text-left space-y-2 max-h-36 overflow-y-auto">
            {lastUserText && <p className="text-xs text-slate-400"><span className="font-bold text-white">Vous :</span> {lastUserText}</p>}
            {lastExpertText && <p className="text-xs text-slate-300"><span className="font-bold text-blue-300">{activeAgent.name} :</span> {lastExpertText}</p>}
          </div>
        )}

        {liveVisionInsight && <div className="w-full text-[11px] text-cyan-200 bg-cyan-950/30 border border-cyan-800/40 p-2.5 rounded-xl">Vision : {liveVisionInsight}</div>}

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={toggleMic} className={`p-3.5 rounded-2xl border transition-all ${isMicEnabled ? 'bg-slate-800 border-slate-700 text-white' : 'bg-red-500/15 border-red-500/40 text-red-300'}`} title={isMicEnabled ? 'Couper le microphone' : 'Activer le microphone'}>
            {isMicEnabled ? <Mic size={20} /> : <MicOff size={20} />}
          </button>

          <button onClick={() => setIsCameraOpen(value => !value)} className={`p-3.5 rounded-2xl border transition-all ${isCameraOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-200'}`} title={isCameraOpen ? 'Fermer la caméra' : 'Activer la vidéo / caméra'}>
            {isCameraOpen ? <Camera size={20} /> : <CameraOff size={20} />}
          </button>

          {(status === 'error' || status === 'disconnected') && (
            <button onClick={startSession} className="px-4 py-3 bg-blue-600 hover:bg-blue-500 rounded-2xl text-xs font-bold flex items-center gap-2">
              <RefreshCw size={17} /> Réessayer
            </button>
          )}

          <button onClick={handleHangUp} className="px-5 py-3 bg-red-600 hover:bg-red-500 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-red-950/30">
            <PhoneOff size={18} /> Raccrocher
          </button>
        </div>

        <p className="text-[10px] text-slate-500 max-w-md">
          Si ElevenLabs n'est pas configuré ou devient indisponible, la voix système prend automatiquement le relais. Si un fournisseur de conversation échoue, le routeur IA passe au moteur suivant sans bloquer l'appel.
        </p>
      </div>
    </div>
  );
};
