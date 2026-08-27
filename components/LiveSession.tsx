
import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Activity, AlertTriangle, Briefcase, Stethoscope, Globe, User, RefreshCw } from 'lucide-react';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import { SYSTEM_INSTRUCTION } from '../constants';
import { Agent } from '../types';

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
          case 'interview': return "Vous êtes un recruteur professionnel exigeant. Vous faites passer un entretien d'embauche. Posez des questions pertinentes sur le parcours, les défauts et qualités. Soyez réaliste.";
          case 'medical': return "Vous êtes un assistant de régulation médicale (type SAMU). Posez des questions précises sur les symptômes pour évaluer l'urgence. Restez calme et rassurant. Ne faites pas de diagnostic final mais orientez.";
          case 'translator': return "Vous êtes un traducteur universel. Traduisez tout ce que l'utilisateur dit en Anglais si c'est en Français, et vice-versa. Soyez précis et direct.";
          default: return "Vous êtes au téléphone en direct. Soyez bref, chaleureux et très utile. Vous êtes un expert de la plateforme Le Monde à Vous.";
      }
  };

  const startSession = async () => {
    if (status === 'connecting' || isActive) return;
    setStatus('connecting');
    setErrorMsg(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      // Initialize Audio Contexts with fallback for sample rate
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      
      // Try to stick to 16k/24k but be flexible if browser insists on default
      const inputCtx = new AudioContextClass({ sampleRate: 16000 });
      const outputCtx = new AudioContextClass({ sampleRate: 24000 });
      
      audioContextRef.current = inputCtx;
      outputContextRef.current = outputCtx;

      // Resume context if suspended (browser policy)
      if (inputCtx.state === 'suspended') await inputCtx.resume();
      if (outputCtx.state === 'suspended') await outputCtx.resume();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Dynamic Instruction based on Agent or Scenario
      let specificInstruction = "";
      if (agent) {
          specificInstruction = `Tu es ${agent.name}, ${agent.title}. Spécialité: ${agent.specialty}. ${agent.description}. 
          PERSONNALITÉ: ${agent.metaProfile?.voiceId === 'Fenrir' ? 'Calme et profond' : agent.metaProfile?.voiceId === 'Kore' ? 'Douce et professionnelle' : 'Dynamique'}.
          Agis comme un expert humain au téléphone. Écoute activement, sois empathique et apporte des solutions concrètes.`;
      } else {
          specificInstruction = getScenarioInstruction(scenario);
      }

      const instruction = SYSTEM_INSTRUCTION + " " + specificInstruction;
      const voiceName = agent?.metaProfile?.voiceId || 'Kore';

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          systemInstruction: instruction,
        },
        callbacks: {
          onopen: () => {
            console.log('Session opened');
            setStatus('connected');
            setIsActive(true);

            // Stream audio from the microphone to the model.
            const source = inputCtx.createMediaStreamSource(stream);
            inputSourceRef.current = source;
            
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;

            processor.onaudioprocess = (e) => {
              // Critical: check if still active to avoid sending data after close
              if (!audioContextRef.current) return;

              const inputData = e.inputBuffer.getChannelData(0);
              // Simple volume meter
              let sum = 0;
              // Optimize volume calculation loop
              const step = Math.ceil(inputData.length / 50);
              for(let i=0; i<inputData.length; i+=step) sum += inputData[i] * inputData[i];
              setVolume(Math.min(100, Math.sqrt(sum / (inputData.length/step)) * 500));

              const pcmBlob = createPcmBlob(inputData);
              sessionPromise.then(session => {
                  session.sendRealtimeInput({ media: pcmBlob });
              }).catch(e => {
                  // Suppress errors if session is closing
                  console.debug("Session stream info", e);
              });
            };

            source.connect(processor);
            processor.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            // Handle Interruption
            const interrupted = msg.serverContent?.interrupted;
            if (interrupted) {
                console.log("Model interrupted");
                for (const source of sourcesRef.current.values()) {
                    try { source.stop(); } catch(e){}
                    sourcesRef.current.delete(source);
                }
                if (outputContextRef.current) {
                    nextStartTimeRef.current = outputContextRef.current.currentTime;
                }
            }

            // Handle Audio Data
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              const ctx = outputContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, ctx.currentTime);
              
              const audioBuffer = await decodeAudioData(
                base64ToUint8Array(audioData),
                ctx,
                24000,
                1
              );
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.addEventListener('ended', () => {
                  sourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              sourcesRef.current.add(source);
              nextStartTimeRef.current += audioBuffer.duration;
            }
          },
          onclose: () => {
            console.log('Session closed');
            stopSession();
          },
          onerror: (err) => {
            console.error('Session error', err);
            setStatus('error');
            // Friendly error message for "Service Unavailable"
            setErrorMsg("Service momentanément indisponible ou surchargé. Veuillez réessayer.");
            stopSession();
          }
        }
      });
    } catch (e: any) {
      console.error(e);
      setStatus('error');
      setErrorMsg(e.message || "Erreur lors de l'initialisation de l'appel.");
      stopSession(); // ensure cleanup
    }
  };

  const stopSession = () => {
    setIsActive(false);
    if (status !== 'error') setStatus('disconnected');
    
    // Stop all playing audio sources
    for (const source of sourcesRef.current.values()) {
        try { source.stop(); } catch(e){}
    }
    sourcesRef.current.clear();

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

  const handleHangUp = () => {
      stopSession();
      if (onClose) onClose();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-white p-6 relative overflow-hidden">
      {/* Background Pulse Animation */}
      {isActive && (
        <div className="absolute inset-0 flex items-center justify-center z-0">
          <div className="w-64 h-64 bg-brand-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
        </div>
      )}

      <div className="z-10 flex flex-col items-center max-w-md w-full text-center space-y-8 animate-fade-up">
        <div className="space-y-4">
          <h2 className="text-3xl font-bold">{agent ? `Appel avec ${agent.name}` : 'Appel Expert Direct'}</h2>
          <p className="text-slate-400">
            {agent 
                ? `${agent.title} • ${agent.specialty}` 
                : (scenario === 'general' ? "Parlez naturellement avec nos experts." : scenario)
            }
          </p>
          {agent && <img src={agent.avatarUrl} className="w-24 h-24 rounded-full mx-auto border-4 border-slate-700 shadow-2xl" />}
        </div>

        {/* Scenario Selector (Only if no agent specified) */}
        {!isActive && !agent && (
            <div className="grid grid-cols-2 gap-3 w-full">
                <button onClick={() => setScenario('general')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${scenario === 'general' ? 'bg-brand-600 border-brand-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                    <User /> <span className="text-xs font-bold">Standard</span>
                </button>
                <button onClick={() => setScenario('interview')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${scenario === 'interview' ? 'bg-purple-600 border-purple-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                    <Briefcase /> <span className="text-xs font-bold">Entretien</span>
                </button>
                <button onClick={() => setScenario('medical')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${scenario === 'medical' ? 'bg-red-600 border-red-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                    <Stethoscope /> <span className="text-xs font-bold">Médical</span>
                </button>
                <button onClick={() => setScenario('translator')} className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-colors ${scenario === 'translator' ? 'bg-green-600 border-green-500' : 'bg-slate-800 border-slate-700 hover:bg-slate-700'}`}>
                    <Globe /> <span className="text-xs font-bold">Traduction</span>
                </button>
            </div>
        )}

        {/* Visualizer / Status */}
        <div className="relative mt-4">
          <div className={`w-40 h-40 rounded-full border-4 flex items-center justify-center transition-all duration-300 ${
            status === 'connected' ? 'border-brand-500 shadow-[0_0_30px_rgba(37,99,235,0.5)]' : 
            status === 'error' ? 'border-red-500 bg-red-900/20' : 'border-slate-700'
          }`}>
             {status === 'connecting' ? (
                <Activity className="animate-spin text-brand-400" size={48} />
             ) : status === 'connected' ? (
                <div 
                  className={`w-32 h-32 rounded-full transition-transform duration-75 ${agent ? 'bg-brand-600' : scenario === 'interview' ? 'bg-purple-600' : scenario === 'medical' ? 'bg-red-600' : 'bg-brand-600'}`}
                  style={{ transform: `scale(${1 + volume / 100})` }}
                />
             ) : status === 'error' ? (
                <AlertTriangle className="text-red-500" size={48} />
             ) : (
                <MicOff className="text-slate-600" size={48} />
             )}
          </div>
        </div>

        <div className={`text-sm font-medium tracking-wide uppercase ${status === 'error' ? 'text-red-400' : 'text-brand-400'}`}>
          {status === 'disconnected' && 'Prêt à appeler'}
          {status === 'connecting' && 'Connexion sécurisée...'}
          {status === 'connected' && 'En ligne • Sécurisé'}
          {status === 'error' && (errorMsg || 'Erreur de connexion')}
        </div>

        {/* Controls */}
        <div className="flex gap-6">
           {!isActive ? (
             <button 
               onClick={startSession}
               className="bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-full font-bold shadow-lg transform transition hover:scale-105 flex items-center gap-3"
             >
               {status === 'error' ? <RefreshCw size={24} /> : <Mic size={24} />}
               {status === 'error' ? 'Réessayer' : 'Lancer l\'Appel'}
             </button>
           ) : (
             <button 
               onClick={handleHangUp}
               className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-full font-bold shadow-lg transform transition hover:scale-105 flex items-center gap-3"
             >
               <PhoneOff size={24} />
               Raccrocher
             </button>
           )}
        </div>
      </div>
    </div>
  );
};
