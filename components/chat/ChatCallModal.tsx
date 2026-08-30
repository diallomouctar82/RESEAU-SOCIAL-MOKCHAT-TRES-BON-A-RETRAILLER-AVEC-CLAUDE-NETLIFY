import React, { useState, useEffect, useCallback } from 'react';
import {
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Maximize2, Minimize2,
  Volume2, VolumeX, Shield, User, Loader2
} from 'lucide-react';
import { ActiveCallSession } from '../../types';
import { useLiveTransport } from '../../hooks/useLiveTransport';

/**
 * Appel 1-à-1 réel (Équipe I / LOOP I1 — « deux amis doivent pouvoir
 * s'appeler sans échec »).
 *
 * Avant ce correctif, AUCUN média ne traversait jamais le réseau : le « flux
 * distant » était une IMAGE de l'avatar du correspondant, l'onde audio une
 * animation factice, et un badge promettait un chiffrement de bout en bout
 * qui n'existait pas (même classe de fausse promesse retirée de la
 * messagerie au LOOP 07/17). La signalisation (invitation/accepté/refusé/
 * terminé, broadcast Supabase), elle, était réelle — elle est conservée.
 *
 * Le transport réutilise l'infrastructure LiveKit EXISTANTE du LIVE
 * (useLiveTransport → Edge Function livekit-token → live.moknet.net) :
 * room dédiée `call-{conversationId}`, les deux participants publient
 * micro (+ caméra si appel vidéo) et s'abonnent l'un à l'autre — jamais un
 * second moteur temps réel parallèle.
 */

interface ChatCallModalProps {
  callSession: ActiveCallSession;
  /** Nom d'affichage local, transmis au jeton LiveKit. */
  localName: string;
  isIncoming?: boolean;
  onAcceptCall: () => void;
  onRejectCall: () => void;
  onEndCall: () => void;
}

export const ChatCallModal: React.FC<ChatCallModalProps> = ({
  callSession,
  localName,
  isIncoming = false,
  onAcceptCall,
  onRejectCall,
  onEndCall
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callSession.type === 'audio');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [duration, setDuration] = useState(0);

  // Média réel : connexion UNIQUEMENT une fois l'appel accepté des deux
  // côtés (status 'connected' arrive par la signalisation) — pendant la
  // sonnerie, rien ne part.
  const transport = useLiveTransport({
    roomName: `call-${callSession.conversationId}`,
    participantName: localName,
    canPublish: true,
    enabled: callSession.status === 'connected',
    publishVideoOnConnect: callSession.type === 'video',
  });

  const remote = transport.remoteParticipants[0] ?? null;
  const mediaConnected = transport.connectionState === 'connected';

  // Timer for duration when connected
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callSession.status === 'connected') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callSession.status]);

  // Attache des pistes réelles — même patron éprouvé que
  // RemoteParticipantTile du LIVE (LOOP 04/14) : callback refs, l'audio dans
  // son propre élément pour que couper la caméra ne coupe jamais le son.
  const remoteVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && remote?.videoTrack) remote.videoTrack.attach(el);
  }, [remote?.videoTrack]);
  const remoteAudioRef = useCallback((el: HTMLAudioElement | null) => {
    if (el && remote?.audioTrack) {
      remote.audioTrack.attach(el);
      el.muted = isSpeakerMuted;
    }
  }, [remote?.audioTrack, isSpeakerMuted]);
  const localVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && transport.localVideoTrack) transport.localVideoTrack.attach(el);
  }, [transport.localVideoTrack]);
  const localScreenRef = useCallback((el: HTMLVideoElement | null) => {
    if (el && transport.localScreenShareTrack) transport.localScreenShareTrack.attach(el);
  }, [transport.localScreenShareTrack]);

  const toggleMic = async () => {
    const next = !isMuted;
    setIsMuted(next);
    try { await transport.setMicrophoneEnabled(!next); } catch { setIsMuted(!next); }
  };

  const toggleCamera = async () => {
    const next = !isVideoOff;
    setIsVideoOff(next);
    try { await transport.setCameraEnabled(!next); } catch { setIsVideoOff(!next); }
  };

  const isScreenSharing = !!transport.localScreenShareTrack;
  const toggleScreenShare = async () => {
    try {
      if (isScreenSharing) await transport.stopScreenShare();
      else await transport.startScreenShare();
    } catch {
      // Partage annulé ou non supporté : rien à casser, l'appel continue.
    }
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const peerName = isIncoming ? callSession.initiatorName : callSession.receiverName;
  const peerAvatar = isIncoming ? callSession.initiatorAvatar : callSession.receiverAvatar;
  const showVideoLayout = callSession.status === 'connected' && (callSession.type === 'video' || !!remote?.videoTrack || isScreenSharing);

  return (
    <div className={`fixed inset-0 z-80 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all ${isFullscreen ? 'p-0' : 'p-4'}`}>
      <div className={`relative bg-slate-900 text-white rounded-3xl shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full h-full rounded-none' : 'w-full max-w-lg aspect-4/5 sm:aspect-square max-h-[85vh]'}`}>

        {/* L'audio distant vit HORS des deux mises en page (audio/vidéo) :
            il doit jouer dans les deux cas, dès que la piste réelle arrive. */}
        {remote?.audioTrack && <audio ref={remoteAudioRef} autoPlay />}

        {/* Top Floating Bar */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Libellé HONNÊTE : le média WebRTC est chiffré en transit
                (DTLS-SRTP) — jamais présenté comme du bout-en-bout, qui
                n'existe pas ici (le serveur SFU voit les flux). */}
            <div className="px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
              <Shield size={12} className="text-indigo-200" />
              <span>Média chiffré en transit</span>
            </div>
            {callSession.status === 'connected' && (
              mediaConnected ? (
                <div className="px-2.5 py-1 rounded-full bg-emerald-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>{formatDuration(duration)}</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-full bg-amber-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5">
                  <Loader2 size={12} className="animate-spin" />
                  <span>Connexion du média…</span>
                </div>
              )
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

          {showVideoLayout ? (
            <>
              {/* Flux distant RÉEL — l'avatar n'est plus qu'un état d'attente
                  honnête tant que la piste vidéo du correspondant n'est pas là. */}
              <div className="w-full h-full relative flex items-center justify-center">
                {remote?.videoTrack ? (
                  <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <img src={peerAvatar} className="w-24 h-24 rounded-full object-cover ring-2 ring-white/20" alt={peerName} />
                    <span className="text-xs font-semibold">
                      {remote ? `${peerName} — caméra coupée` : `En attente de ${peerName}…`}
                    </span>
                  </div>
                )}

                <div className="absolute bottom-24 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${remote ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                  <span>{peerName}</span>
                </div>
              </div>

              {/* Local (caméra ou écran partagé) en incrustation */}
              <div className="absolute top-16 right-4 w-28 sm:w-36 aspect-3/4 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-800 z-10">
                {isScreenSharing ? (
                  <video ref={localScreenRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                ) : transport.localVideoTrack && !isVideoOff ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" />
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
            /* Audio Calling Screen */
            <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center z-10 animate-fade-in">
              <div className="relative">
                <div className="absolute -inset-4 rounded-full bg-indigo-600/30 animate-ping opacity-75"></div>
                <div className="absolute -inset-8 rounded-full bg-indigo-500/20 animate-pulse"></div>
                <img
                  src={peerAvatar}
                  className="relative w-28 h-28 sm:w-36 sm:h-36 rounded-full object-cover ring-4 ring-indigo-500 shadow-2xl mx-auto"
                  alt={peerName}
                />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-extrabold text-white">{peerName}</h3>
                <p className="text-xs font-semibold text-indigo-300">
                  {callSession.status === 'ringing'
                    ? (isIncoming ? 'Appel vocal entrant…' : 'Sonnerie en cours…')
                    : remote?.audioTrack
                      ? 'Appel vocal connecté'
                      : mediaConnected
                        ? `En attente de ${peerName}…`
                        : 'Connexion du média…'}
                </p>
              </div>

              {/* Indicateur d'activité — affiché UNIQUEMENT quand la piste
                  audio distante existe réellement (jamais une animation
                  au-dessus d'un silence). */}
              {callSession.status === 'connected' && remote?.audioTrack && (
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

              {transport.error && (
                <p className="text-[11px] font-semibold text-rose-300 max-w-xs">
                  Média indisponible : {transport.error}
                </p>
              )}
            </div>
          )}

        </div>

        {/* Bottom Control Bar */}
        <div className="p-5 bg-slate-950/90 backdrop-blur-md border-t border-slate-800 flex items-center justify-center gap-4 z-20">

          {isIncoming && callSession.status === 'ringing' ? (
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
            <>
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isMuted ? 'Activer micro' : 'Couper micro'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isVideoOff ? 'Activer caméra' : 'Couper caméra'}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Partager l'écran"
              >
                <Monitor size={20} />
              </button>

              <button
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={`p-3.5 rounded-2xl transition-all shadow-md ${isSpeakerMuted ? 'bg-amber-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Haut-parleur"
              >
                {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

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
