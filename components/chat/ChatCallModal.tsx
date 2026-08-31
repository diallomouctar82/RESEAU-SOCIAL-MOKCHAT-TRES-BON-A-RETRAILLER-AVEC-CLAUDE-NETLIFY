import React, { useState, useEffect, useCallback, useRef } from 'react';
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
 *
 * Équipe 7 (loops 1+7 — « A doit voir/entendre B », « une interface digne
 * d'un téléphone ») :
 * - A2 : le blocage d'autoplay du navigateur est enfin traité — bouton
 *   « Activer le son » (même patron que SocialLive) branché sur
 *   audioPlaybackBlocked/startAudio du hook, sinon l'appel restait MUET
 *   sans aucun remède offert à l'utilisateur.
 * - A3 : chaque callback ref fait un vrai detach() au démontage/changement
 *   de piste (même discipline que RemoteParticipantTile du LIVE) — sans
 *   quoi l'élément retiré du DOM continuait de jouer (fuite/écho).
 * - A5 : les PERSONNES d'abord — flux distant plein cadre (l'écran partagé
 *   distant est affiché s'il existe), aperçu local en incrustation
 *   DÉPLAÇABLE au doigt, contrôles en rangée flottante (raccrocher rouge
 *   central) qui s'estompent après 3,5 s sans interaction et réapparaissent
 *   au toucher, états honnêtes (« Connexion… », « Reconnexion… », durée
 *   mm:ss).
 *
 * NOTE pour l'équipe LIVE (useLiveTransport) : la bascule caméra
 * avant/arrière (facingMode) n'est PAS exposée par le port transport
 * (setCameraEnabled(boolean) seulement) — le bouton dédié sera ajouté ici
 * dès qu'une API du type switchCamera()/setCameraFacing('user'|'environment')
 * existera dans le hook. Aucun contournement direct de livekit-client ici :
 * ce composant ne connaît que le hook.
 */

/**
 * Durée d'appel « téléphone » : mm:ss, les minutes continuent au-delà de 59
 * (61:05 après une heure — jamais une remise à zéro trompeuse). Pure et
 * exportée pour être testée ; toute entrée invalide (négatif, NaN) affiche
 * honnêtement 00:00 plutôt que « NaN:NaN ».
 */
export const formatCallDuration = (sec: number): string => {
  const safe = Number.isFinite(sec) && sec > 0 ? Math.floor(sec) : 0;
  const mins = Math.floor(safe / 60);
  const s = safe % 60;
  return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

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

  // Sonnerie AUDIBLE (Équipe F2) : jusqu'ici la « sonnerie » était purement
  // visuelle — un appel entrant pouvait passer inaperçu. Tonalité générée
  // localement en WebAudio (aucun fichier à charger), cadence type téléphone
  // (entrant plus insistant que la tonalité de retour côté appelant),
  // vibration sur mobile, et arrêt NET à la connexion/fermeture — même
  // discipline anti-son-fantôme que stopSpeaking() du moteur vocal. Si le
  // navigateur bloque l'audio sans geste utilisateur, la sonnerie reste
  // visuelle : jamais une erreur, jamais un blocage de l'appel.
  useEffect(() => {
    if (callSession.status !== 'ringing') return;
    let ctx: AudioContext | null = null;
    let interval: ReturnType<typeof setInterval> | null = null;
    let stopped = false;
    const ringOnce = () => {
      if (!ctx || stopped || ctx.state !== 'running') return;
      const t0 = ctx.currentTime;
      // Double bip (ring-ring) pour l'entrant, bip long doux pour le retour d'appel.
      const bursts: Array<[number, number]> = isIncoming ? [[0, 0.45], [0.6, 0.45]] : [[0, 1.4]];
      for (const [offset, len] of bursts) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = isIncoming ? 440 : 425;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(ctx.destination);
        gain.gain.exponentialRampToValueAtTime(isIncoming ? 0.12 : 0.05, t0 + offset + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, t0 + offset + len);
        osc.start(t0 + offset);
        osc.stop(t0 + offset + len + 0.05);
      }
    };
    try {
      ctx = new AudioContext();
      void ctx.resume().then(() => { if (!stopped) ringOnce(); }).catch(() => {});
      interval = setInterval(ringOnce, isIncoming ? 2600 : 4000);
      if (isIncoming && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate([400, 250, 400]); } catch { /* non supporté */ }
      }
    } catch { /* AudioContext indisponible : sonnerie visuelle seule */ }
    return () => {
      stopped = true;
      if (interval) clearInterval(interval);
      if (ctx) { try { void ctx.close(); } catch { /* déjà fermé */ } }
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(0); } catch { /* non supporté */ }
      }
    };
  }, [callSession.status, isIncoming]);

  // ── Attache des pistes réelles (Équipe 7, A3) ─────────────────────────
  // Même patron éprouvé que RemoteParticipantTile / localVideoTrackRef du
  // LIVE : callback refs AVEC detach() quand l'élément disparaît ou que la
  // piste change — l'ancienne version n'appelait jamais detach(), donc un
  // élément retiré du DOM continuait de jouer (fuite mémoire + écho).
  // L'audio vit dans ses propres éléments pour que couper la caméra ne
  // coupe jamais le son.

  // Le distant peut publier caméra ET partage d'écran : l'écran, s'il
  // existe, prend la scène (c'est ce que B veut montrer à A).
  const remoteMainTrack = remote?.screenShareTrack ?? remote?.videoTrack ?? null;
  const remoteMainIsScreen = !!remote?.screenShareTrack;

  const remoteVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) remoteMainTrack?.attach(el);
    else remoteMainTrack?.detach();
  }, [remoteMainTrack]);

  // Coupure haut-parleur appliquée via une ref miroir : jamais dans les
  // dépendances du callback ref, sinon chaque bascule détacherait puis
  // rattacherait la piste audio (micro-coupure audible).
  const speakerMutedRef = useRef(isSpeakerMuted);
  const remoteAudioElRef = useRef<HTMLAudioElement | null>(null);
  const remoteScreenAudioElRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    speakerMutedRef.current = isSpeakerMuted;
    if (remoteAudioElRef.current) remoteAudioElRef.current.muted = isSpeakerMuted;
    if (remoteScreenAudioElRef.current) remoteScreenAudioElRef.current.muted = isSpeakerMuted;
  }, [isSpeakerMuted]);

  const remoteAudioRef = useCallback((el: HTMLAudioElement | null) => {
    remoteAudioElRef.current = el;
    if (el) {
      remote?.audioTrack?.attach(el);
      el.muted = speakerMutedRef.current;
    } else {
      remote?.audioTrack?.detach();
    }
  }, [remote?.audioTrack]);

  // Son d'un partage d'écran distant (onglet avec vidéo…) — souscrit par le
  // hook (Équipe F3) mais jamais joué ici jusqu'à présent.
  const remoteScreenAudioRef = useCallback((el: HTMLAudioElement | null) => {
    remoteScreenAudioElRef.current = el;
    if (el) {
      remote?.screenShareAudioTrack?.attach(el);
      el.muted = speakerMutedRef.current;
    } else {
      remote?.screenShareAudioTrack?.detach();
    }
  }, [remote?.screenShareAudioTrack]);

  const localVideoRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) transport.localVideoTrack?.attach(el);
    else transport.localVideoTrack?.detach();
  }, [transport.localVideoTrack]);
  const localScreenRef = useCallback((el: HTMLVideoElement | null) => {
    if (el) transport.localScreenShareTrack?.attach(el);
    else transport.localScreenShareTrack?.detach();
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

  const peerName = isIncoming ? callSession.initiatorName : callSession.receiverName;
  const peerAvatar = isIncoming ? callSession.initiatorAvatar : callSession.receiverAvatar;
  const showVideoLayout = callSession.status === 'connected' && (callSession.type === 'video' || !!remoteMainTrack || isScreenSharing);

  // État réseau honnête (Équipe 7, A5) : « Connexion… » tant que le média
  // n'est pas là, « Reconnexion… » quand le transport le dit — jamais un
  // écran figé sans explication.
  const connectionLabel =
    callSession.status !== 'connected' ? null
      : transport.connectionState === 'reconnecting' ? 'Reconnexion…'
        : transport.connectionState === 'failed' ? 'Connexion perdue'
          : !mediaConnected ? 'Connexion…'
            : null;

  // ── Chrome d'appel qui s'estompe (Équipe 7, A5) ───────────────────────
  // En vidéo connectée, barres et contrôles disparaissent après 3,5 s sans
  // interaction (les personnes prennent tout l'écran) et réapparaissent au
  // premier toucher/mouvement. Pendant la sonnerie ou en appel audio, tout
  // reste visible — rien à masquer d'important derrière.
  const canAutoHide = callSession.status === 'connected' && showVideoLayout;
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canAutoHideRef = useRef(canAutoHide);
  const lastMoveRevealRef = useRef(0);

  const scheduleHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!canAutoHideRef.current) return;
    hideTimerRef.current = setTimeout(() => setControlsVisible(false), 3500);
  }, []);
  const revealControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);
  const onChromeMouseMove = useCallback(() => {
    if (!canAutoHideRef.current) return;
    const now = Date.now();
    if (now - lastMoveRevealRef.current < 500) return; // anti-tempête mousemove
    lastMoveRevealRef.current = now;
    revealControls();
  }, [revealControls]);

  useEffect(() => {
    canAutoHideRef.current = canAutoHide;
    setControlsVisible(true);
    if (canAutoHide) scheduleHide();
    else if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    return () => { if (hideTimerRef.current) clearTimeout(hideTimerRef.current); };
  }, [canAutoHide, scheduleHide]);

  const chromeShown = controlsVisible || !canAutoHide;
  const chromeClass = chromeShown ? 'opacity-100' : 'opacity-0 pointer-events-none';

  // ── Aperçu local déplaçable (Équipe 7, A5) ────────────────────────────
  // Incrustation façon téléphone : glissable au doigt/à la souris dans les
  // limites de la scène (pointer capture — un seul jeu d'événements pour
  // tactile et souris). Position null = coin haut-droit par défaut.
  const stageRef = useRef<HTMLDivElement | null>(null);
  const [pipPos, setPipPos] = useState<{ x: number; y: number } | null>(null);
  const pipDragRef = useRef<{ dx: number; dy: number; dragging: boolean }>({ dx: 0, dy: 0, dragging: false });

  const onPipPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    pipDragRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top, dragging: true };
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* non supporté */ }
  };
  const onPipPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pipDragRef.current.dragging || !stageRef.current) return;
    const stageRect = stageRef.current.getBoundingClientRect();
    const pipRect = e.currentTarget.getBoundingClientRect();
    const margin = 8;
    const x = Math.min(
      Math.max(e.clientX - stageRect.left - pipDragRef.current.dx, margin),
      Math.max(margin, stageRect.width - pipRect.width - margin)
    );
    const y = Math.min(
      Math.max(e.clientY - stageRect.top - pipDragRef.current.dy, margin),
      Math.max(margin, stageRect.height - pipRect.height - margin)
    );
    setPipPos({ x, y });
  };
  const onPipPointerEnd = (e: React.PointerEvent<HTMLDivElement>) => {
    pipDragRef.current.dragging = false;
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* déjà relâché */ }
  };
  // La géométrie du cadre change (plein écran ↔ fenêtré) : des coordonnées
  // mémorisées pourraient sortir du champ — retour au coin par défaut.
  useEffect(() => { setPipPos(null); }, [isFullscreen]);

  return (
    <div className={`fixed inset-0 z-80 flex items-center justify-center bg-slate-950/80 backdrop-blur-md transition-all ${isFullscreen ? 'p-0' : 'p-2 sm:p-4'}`}>
      <div
        className={`relative bg-slate-900 text-white shadow-2xl border border-slate-700/60 overflow-hidden flex flex-col transition-all duration-300 ${isFullscreen ? 'w-full h-full rounded-none border-0' : 'w-full max-w-lg aspect-4/5 sm:aspect-square max-h-[85vh] rounded-3xl'}`}
        onPointerDown={revealControls}
        onMouseMove={onChromeMouseMove}
      >

        {/* L'audio distant vit HORS des deux mises en page (audio/vidéo) :
            il doit jouer dans les deux cas, dès que la piste réelle arrive.
            (+ le son d'un partage d'écran distant, jusqu'ici jeté.) */}
        {remote?.audioTrack && <audio ref={remoteAudioRef} autoPlay />}
        {remote?.screenShareAudioTrack && <audio ref={remoteScreenAudioRef} autoPlay />}

        {/* Scène : le CORRESPONDANT occupe tout le cadre. */}
        <div ref={stageRef} className="relative flex-1 bg-slate-950 flex items-center justify-center overflow-hidden">

          {showVideoLayout ? (
            <>
              {/* Flux distant RÉEL plein cadre — l'avatar n'est plus qu'un
                  état d'attente honnête tant que la piste du correspondant
                  n'est pas là. Un écran partagé s'affiche entier (contain),
                  un visage remplit le cadre (cover). */}
              <div className="w-full h-full relative flex items-center justify-center">
                {remoteMainTrack ? (
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className={`w-full h-full ${remoteMainIsScreen ? 'object-contain bg-black' : 'object-cover'}`}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-3 text-slate-300">
                    <img src={peerAvatar} className="w-24 h-24 rounded-full object-cover ring-2 ring-white/20" alt={peerName} />
                    <span className="text-xs font-semibold">
                      {remote ? `${peerName} — caméra coupée` : `En attente de ${peerName}…`}
                    </span>
                  </div>
                )}

                <div className={`absolute bottom-28 left-4 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-opacity duration-300 ${chromeClass}`}>
                  <span className={`w-2 h-2 rounded-full ${remote ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></span>
                  <span>{peerName}</span>
                  {remoteMainIsScreen && <span className="text-[10px] font-semibold text-indigo-200">— partage d'écran</span>}
                </div>
              </div>

              {/* Aperçu local (caméra ou écran partagé) : incrustation
                  DÉPLAÇABLE — reste visible même quand le chrome s'estompe,
                  comme sur un vrai téléphone. */}
              <div
                className={`absolute w-24 sm:w-32 aspect-3/4 rounded-2xl overflow-hidden border-2 border-white/40 shadow-2xl bg-slate-800 z-30 touch-none cursor-grab active:cursor-grabbing select-none ${pipPos ? '' : 'top-16 right-3'}`}
                style={pipPos ? { left: pipPos.x, top: pipPos.y } : undefined}
                onPointerDown={onPipPointerDown}
                onPointerMove={onPipPointerMove}
                onPointerUp={onPipPointerEnd}
                onPointerCancel={onPipPointerEnd}
              >
                {isScreenSharing ? (
                  <video ref={localScreenRef} autoPlay playsInline muted className="w-full h-full object-cover pointer-events-none" />
                ) : transport.localVideoTrack && !isVideoOff ? (
                  <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1] pointer-events-none" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400 p-2 text-center pointer-events-none">
                    <User size={24} />
                    <span className="text-[9px] mt-1">Caméra coupée</span>
                  </div>
                )}
                {isMuted && (
                  <div className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white pointer-events-none">
                    <MicOff size={10} />
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Audio Calling Screen — pb-28 : les contrôles flottants (A5)
               recouvrent le bas de la scène, le contenu reste au-dessus. */
            <div className="flex flex-col items-center justify-center px-6 pt-16 pb-28 space-y-6 text-center z-10 animate-fade-in">
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
                    ? (isIncoming
                      ? (callSession.type === 'video' ? 'Appel vidéo entrant…' : 'Appel vocal entrant…')
                      : 'Sonnerie en cours…')
                    : connectionLabel
                      ? connectionLabel
                      : remote?.audioTrack
                        ? 'Appel vocal connecté'
                        : `En attente de ${peerName}…`}
                </p>
                {callSession.status === 'connected' && mediaConnected && (
                  <p className="text-2xl font-mono font-bold text-white/90 tabular-nums pt-1">{formatCallDuration(duration)}</p>
                )}
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

        {/* Top Floating Bar — s'estompe avec le reste du chrome en vidéo. */}
        <div className={`absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between transition-opacity duration-300 ${chromeClass}`}>
          <div className="flex items-center gap-2">
            {/* Libellé HONNÊTE : le média WebRTC est chiffré en transit
                (DTLS-SRTP) — jamais présenté comme du bout-en-bout, qui
                n'existe pas ici (le serveur SFU voit les flux). */}
            <div className="px-2.5 py-1 rounded-full bg-indigo-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1.5 shadow-sm">
              <Shield size={12} className="text-indigo-200" />
              <span>Média chiffré en transit</span>
            </div>
            {callSession.status === 'connected' && (
              connectionLabel ? (
                <div className={`px-2.5 py-1 rounded-full backdrop-blur-md text-[11px] font-bold flex items-center gap-1.5 ${connectionLabel === 'Connexion perdue' ? 'bg-rose-600/80 text-white' : 'bg-amber-600/80 text-white'}`}>
                  <Loader2 size={12} className="animate-spin" />
                  <span>{connectionLabel}</span>
                </div>
              ) : (
                <div className="px-2.5 py-1 rounded-full bg-emerald-600/80 backdrop-blur-md text-[11px] font-bold text-white flex items-center gap-1 tabular-nums">
                  <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                  <span>{formatCallDuration(duration)}</span>
                </div>
              )
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-xs transition-colors"
              title={isFullscreen ? 'Quitter le plein écran' : 'Plein écran'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Équipe 7 (A2) : remède au silence d'autoplay — même patron que
            SocialLive. Ce bouton ne s'estompe JAMAIS : tant que le
            navigateur bloque le son, c'est l'action la plus importante de
            l'écran. */}
        {callSession.status === 'connected' && transport.audioPlaybackBlocked && (
          <button
            onClick={(e) => { e.stopPropagation(); void transport.startAudio(); }}
            className="absolute top-16 left-1/2 -translate-x-1/2 z-40 px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-xl flex items-center gap-2"
          >
            <Volume2 size={14} /> Activer le son
          </button>
        )}

        {/* Rangée de contrôles flottante (Équipe 7, A5) — discrète, en bas,
            raccrocher rouge au CENTRE ; s'estompe après 3,5 s en vidéo. */}
        <div className={`absolute bottom-0 inset-x-0 z-20 p-4 pb-5 bg-gradient-to-t from-black/80 via-black/40 to-transparent flex items-center justify-center transition-opacity duration-300 ${chromeClass}`}>

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
            <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 py-3 rounded-full bg-slate-950/70 backdrop-blur-md border border-white/10 shadow-2xl">
              <button
                onClick={toggleMic}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isMuted ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isMuted ? 'Activer micro' : 'Couper micro'}
              >
                {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isVideoOff ? 'bg-rose-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title={isVideoOff ? 'Activer caméra' : 'Couper caméra'}
              >
                {isVideoOff ? <VideoOff size={20} /> : <Video size={20} />}
              </button>

              {/* Raccrocher : rouge, central, le plus gros — la sortie doit
                  être trouvable en une demi-seconde, comme sur un téléphone. */}
              <button
                onClick={onEndCall}
                className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 mx-1"
                title="Raccrocher"
                aria-label="Raccrocher"
              >
                <PhoneOff size={26} />
              </button>

              <button
                onClick={() => setIsSpeakerMuted(!isSpeakerMuted)}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isSpeakerMuted ? 'bg-amber-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Haut-parleur"
              >
                {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
              </button>

              <button
                onClick={toggleScreenShare}
                className={`w-12 h-12 rounded-full flex items-center justify-center transition-all shadow-md ${isScreenSharing ? 'bg-indigo-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                title="Partager l'écran"
              >
                <Monitor size={20} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
