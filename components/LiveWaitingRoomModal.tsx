import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, VideoOff, Mic, MicOff, Shield, Globe, FileText, CheckCircle2, 
  Clock, Users, AlertCircle, ArrowRight, X, Sparkles, Volume2
} from 'lucide-react';
import { LiveStream } from '../types';

interface LiveWaitingRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEnterLive: () => void;
  liveStream: LiveStream;
}

export const LiveWaitingRoomModal: React.FC<LiveWaitingRoomModalProps> = ({
  isOpen,
  onClose,
  onEnterLive,
  liveStream
}) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [audioLevel, setAudioLevel] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState(liveStream.language || 'Français');
  const [queuePosition] = useState(1);
  const [isReadyToEnter, setIsReadyToEnter] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startMediaPreview();
      const timer = setTimeout(() => setIsReadyToEnter(true), 3000);
      return () => {
        clearTimeout(timer);
        stopMediaPreview();
      };
    }
  }, [isOpen]);

  const startMediaPreview = async () => {
    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        console.warn("getUserMedia not available in this environment");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }

      // Audio Meter
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 32;
        src.connect(analyser);

        const buffer = new Uint8Array(analyser.frequencyBinCount);
        const loop = () => {
          if (!streamRef.current || !analyser) return;
          analyser.getByteFrequencyData(buffer);
          let sum = 0;
          for (let i = 0; i < buffer.length; i++) sum += buffer[i];
          setAudioLevel(Math.min(100, Math.round((sum / buffer.length) * 2.5)));
          requestAnimationFrame(loop);
        };
        loop();
      }
    } catch (e) {
      console.warn("Hardware test fallback", e);
    }
  };

  const stopMediaPreview = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const toggleCam = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(t => t.enabled = !isCameraOn);
    }
    setIsCameraOn(!isCameraOn);
  };

  const toggleMic = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(t => t.enabled = !isMicOn);
    }
    setIsMicOn(!isMicOn);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 animate-scale-in">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-b border-white/10 flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-[10px] font-black uppercase flex items-center gap-1">
                <Clock size={12} className="animate-spin" /> Salle d'Attente & Test Matériel
              </span>
              <span className="text-xs text-indigo-300 font-bold">Session Sécurisée Diallo OS</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">{liveStream.title}</h3>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          
          {/* Top: Video Test & Host Brief */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Left: Video Preview & Test Controls */}
            <div className="space-y-3">
              <div className="relative aspect-video bg-slate-950 rounded-2xl overflow-hidden border border-white/10 flex items-center justify-center">
                {isCameraOn ? (
                  <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
                ) : (
                  <div className="text-center space-y-2 text-slate-500">
                    <VideoOff size={32} className="mx-auto" />
                    <p className="text-xs">Caméra désactivée</p>
                  </div>
                )}

                {/* Audio Level Bar Overlay */}
                <div className="absolute bottom-2 left-2 right-2 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl flex items-center gap-2 border border-white/10">
                  <Volume2 size={13} className="text-emerald-400" />
                  <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-75"
                      style={{ width: `${isMicOn ? audioLevel : 0}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">{isMicOn ? `${audioLevel}%` : 'MUTE'}</span>
                </div>
              </div>

              {/* Hardware Test Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={toggleCam}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isCameraOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600/30 text-red-300 border border-red-500/30'}`}
                >
                  {isCameraOn ? <Video size={14} /> : <VideoOff size={14} />}
                  <span>{isCameraOn ? 'Caméra Active' : 'Caméra Coupée'}</span>
                </button>

                <button
                  onClick={toggleMic}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isMicOn ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-red-600/30 text-red-300 border border-red-500/30'}`}
                >
                  {isMicOn ? <Mic size={14} /> : <MicOff size={14} />}
                  <span>{isMicOn ? 'Micro Actif' : 'Micro Coupé'}</span>
                </button>
              </div>
            </div>

            {/* Right: Expert Info & Queue Status */}
            <div className="space-y-4 flex flex-col justify-between">
              
              <div className="p-4 bg-slate-950/70 border border-white/5 rounded-2xl space-y-3">
                <div className="flex items-center gap-3">
                  <img src={liveStream.hostAvatar} className="w-12 h-12 rounded-2xl object-cover ring-2 ring-indigo-500/30" />
                  <div>
                    <h4 className="text-xs font-bold text-white">{liveStream.hostName}</h4>
                    <p className="text-[11px] text-slate-400">{liveStream.description || 'Intervenant principal'}</p>
                    <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                      <CheckCircle2 size={11} /> En ligne & Prêt
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                  <span className="text-slate-400">Position dans la file :</span>
                  <span className="font-mono font-bold text-indigo-300">N° {queuePosition} (Vous êtes le prochain)</span>
                </div>
              </div>

              {/* Language Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Globe size={13} className="text-indigo-400" /> Votre langue de sous-titres personnalisée :
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {['Français', 'Anglais', 'Arabe', 'Pulaar', 'Wolof', 'Espagnol'].map(lang => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${selectedLanguage === lang ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Checklist of Documents to Prepare */}
          <div className="p-4 bg-indigo-950/30 border border-indigo-500/20 rounded-2xl space-y-2">
            <h5 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
              <FileText size={14} /> Documents recommandés pour cette session :
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Pièce d'identité ou passeport (si consultation)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Notes et questions prioritaires préparées</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Documents du projet ou contrat à analyser</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={13} className="text-emerald-400" />
                <span>Vision IA et floutage confidentiel actifs</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <Shield size={14} className="text-emerald-400" />
            <span>Chiffrement bout-en-bout & protection des données sensibles</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
            >
              Quitter
            </button>
            <button
              onClick={() => {
                stopMediaPreview();
                onEnterLive();
              }}
              className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all hover:scale-102"
            >
              <span>Rejoindre la Session Live</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
