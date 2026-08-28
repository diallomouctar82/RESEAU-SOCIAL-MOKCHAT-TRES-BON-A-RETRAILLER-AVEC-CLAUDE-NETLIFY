import React, { useState, useEffect, useRef } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Maximize2, Minimize2,
  Volume2, VolumeX, Shield, Sparkles, User, RefreshCw
} from 'lucide-react';
import { ActiveCallSession } from '../../types';

interface ChatCallModalProps {
  callSession: ActiveCallSession;
  isIncoming?: boolean;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
}

export const ChatCallModal: React.FC<ChatCallModalProps> = ({
  callSession,
  isIncoming = false,
  onAcceptCall,
  onRejectCall,
  onEndCall
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callSession.type === 'audio');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Timer for duration when connected
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callSession.status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callSession.status]);

  // Request actual camera & mic if available
  useEffect(() => {
    if (callSession.status === 'connected' && callSession.type === 'video') {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        }).then(stream => {
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        }).catch(err => {
          console.warn("Camera/Microphone access skipped or unavailable:", err.message);
        });
      }
    }

    return () => {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [callSession.status, callSession.type]);

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
          const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = screenStream;
          }
          setIsScreenSharing(true);
          screenStream.getVideoTracks()[0].onended = () => {
            setIsScreenSharing(false);
          };
        }
      } catch (err) {
        console.warn("Screen share cancelled or unsupported");
      }
    } else {
      setIsScreenSharing(false);
      if (localStreamRef.current && localVideoRef.current) {
        localVideoRef.current.srcObject = localStreamRef.current;
      }
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`relative bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-lg aspect-4/5 sm:aspect-square max-h-[85vh]'}`}>
        
        {/* Top Floating Bar */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
              <Shield size={12} className="text-indigo-200" />
              <span>Chiffrement Bout-en-Bout LMAV</span>
            </div>
            {callSession.status === 'connected' && (
              <div className="px-2.5 py-1 rounded-full bg-emerald-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                <span>{formatDuration(duration)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors"
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Video or Audio Screen Content */}
        <div className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">
          
          {callSession.type === 'video' && callSession.status === 'connected' ? (
            <>
              {/* Remote simulated/real stream */}
              <div className="w-full h-full relative flex items-center justify-center">
                <img 
                  src={callSession.receiverAvatar || callSession.initiatorAvatar} 
                  className="w-full h-full object-cover filter brightness-90" 
                  alt="Correspondant" 
                />
                
                {/* Overlay Remote Info */}
                <div className="absolute bottom-24 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span>{callSession.receiverName || callSession.initiatorName}</span>
                </div>
              </div>

              {/* Local Video Stream Picture-in-Picture */}
              <div className="absolute top-16 right-4 w-28 sm:w-36 aspect-3/4 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-800 z-10">
                {!isVideoOff ? (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover scale-x-[-1]" 
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center">
                    <User size={24} />
                    <span className="text-[9px] mt-1">Caméra coupée</span>
                  </div>
                )}
                {isMuted && (
                  <div className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white">
                    <MicOff size={10} />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Audio Calling Visualizer Screen */
            <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center z-10 animate-fade-in">
              <div className="relative">
                {/* Audio pulse ripples */}
                <div className="absolute -inset-4 rounded-full bg-indigo-600/30 animate-ping opacity-75"></div>
                <div className="absolute -inset-8 rounded-full bg-indigo-500/20 animate-pulse"></div>
                <img 
                  src={isIncoming ? callSession.initiatorAvatar : callSession.receiverAvatar} 
                  className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-indigo-500 shadow-2xl mx-auto" 
                  alt="Correspondant" 
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">
                  {isIncoming ? callSession.initiatorName : callSession.receiverName}
                </h3>
                <p className="text-xs font-semibold text-indigo-300">
                  {callSession.status === 'ringing' ? (isIncoming ? 'Appel vocal entrant...' : 'Sonnerie en cours...') : 'Appel vocal haute fidélité connecté'}
                </p>
              </div>

              {/* Realtime voice audio waveform */}
              {callSession.status === 'connected' && (
                <div className="flex items-center justify-center gap-1.5 h-10 px-6 py-2 bg-white/5 rounded-2xl backdrop-blur-md border border-white/10">
                  {[20, 45, 80, 60, 100, 75, 40, 90, 60, 30, 85, 45, 70, 95, 35].map((h, i) => (
                    <span 
                      key={i} 
                      style={{ height: `${h}%` }}
                      className="w-1 bg-indigo-400 rounded-full animate-pulse"
                    />
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Bottom Control Bar */}
        <div className="p-5 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-4 z-20">
          
          {isIncoming && callSession.status === 'ringing' ? (
            /* Incoming call Answer / Reject buttons */
            <div className="flex items-center justify-center gap-12 w-full">
              <div className="text-center space-y-1">
                <button
                  onClick={onRejectCall}
                  className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/30 transition-all hover:scale-110 active:scale-95"
                >
                  <PhoneOff size={24} />
                </button>
                <span className="text-[11px] font-bold text-rose-300 block">Refuser</span>
              </div>

              <div className="text-center space-y-1">
                <button
                  onClick={onAcceptCall}
                  className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-600/30 transition-all hover:scale-110 active:scale-95 animate-bounce"
                >
                  <Phone size={24} />
                </button>
                <span className="text-[11px] font-bold text-emerald-300 block">Décrocher</span>
              </div>
            </div>
          ) : (
            /* Connected / Outgoing active call control buttons */
            <>
              {/* Mute Mic */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isMuted ? 'Activer micro' : 'Couper micro'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              {/* Toggle Video */}
              <button
                onClick={() => setIsVideoOff(!isVideoOff)}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isVideoOff ? 'Activer caméra' : 'Couper caméra'}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              {/* Screen Share */}
              <button
                onClick={toggleScreenShare}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Partager l'écran"
              >
                <Monitor size={20} />
              </button>

              {/* Speaker mute */}
              <button
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isSpeakerMuted ? 'bg-amber-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Haut-parleur"
              >
                {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              {/* End Call Button */}
              <button
                onClick={onEndCall}
                className="p-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold flex items-center gap-2 shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 ml-2"
                title="Raccrocher"
              >
                <PhoneOff size={20} />
                <span className="text-xs font-extrabold hidden sm:inline">Raccrocher</span>
              </button>
            </>
          )}

        </div>

      </div>
    </div>
  );
};
