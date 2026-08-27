import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Play, 
  Pause, 
  RotateCcw, 
  X, 
  Sparkles, 
  Eye, 
  Mic, 
  MicOff, 
  Type, 
  Clock, 
  Sliders, 
  CheckCircle2,
  Volume2
} from 'lucide-react';
import { ConquestVideoScriptData, RadarOpportunityItem } from '../../../types';

interface CareerTeleprompterModalProps {
  videoScript: ConquestVideoScriptData;
  opportunity: RadarOpportunityItem;
  onUpdateScript?: (updated: ConquestVideoScriptData) => void;
  onClose: () => void;
}

export const CareerTeleprompterModal: React.FC<CareerTeleprompterModalProps> = ({
  videoScript,
  opportunity,
  onUpdateScript,
  onClose
}) => {
  const [scriptData, setScriptData] = useState<ConquestVideoScriptData>(videoScript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedWPM, setSpeedWPM] = useState(scriptData.teleprompterSpeedWPM || 130);
  const [fontSize, setFontSize] = useState<number>(24); // px
  const [isMirror, setIsMirror] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isRecordingMic, setIsRecordingMic] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<any>(null);

  // Timer effect
  useEffect(() => {
    if (isPlaying) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isPlaying]);

  // Auto-scroll effect
  useEffect(() => {
    if (!isPlaying) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    let lastTimestamp = performance.now();
    const scrollStep = (timestamp: number) => {
      const delta = timestamp - lastTimestamp;
      lastTimestamp = timestamp;

      if (scrollContainerRef.current) {
        // speed formula : speedWPM * px_per_word / 60000 ms
        const pxPerSecond = (speedWPM / 60) * 18;
        scrollContainerRef.current.scrollTop += (pxPerSecond * delta) / 1000;
      }

      animationFrameRef.current = requestAnimationFrame(scrollStep);
    };

    animationFrameRef.current = requestAnimationFrame(scrollStep);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, speedWPM]);

  const handleReset = () => {
    setIsPlaying(false);
    setElapsedSeconds(0);
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-950 text-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[90vh] border border-slate-800">
        
        {/* HEADER BAR */}
        <div className="p-4 md:p-5 bg-slate-900 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-2xl">
              <Video size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Prompteur Vidéo & Pitch Studio</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800/50">
                  {opportunity.entity}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black truncate max-w-md md:max-w-xl">
                {scriptData.title}
              </h2>
            </div>
          </div>

          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* CONTROLS BAR */}
        <div className="bg-slate-900/80 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
          
          {/* Main Play / Pause Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-5 py-2 rounded-xl font-bold flex items-center gap-2 shadow-lg transition-all ${
                isPlaying 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
              }`}
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
              <span>{isPlaying ? 'Pause' : 'Démarrer'}</span>
            </button>

            <button
              onClick={handleReset}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all"
              title="Réinitialiser"
            >
              <RotateCcw size={15} />
            </button>

            {/* Timer Badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono">
              <Clock size={13} className="text-blue-400" />
              <span>{formatTime(elapsedSeconds)} / {formatTime(scriptData.targetDurationSeconds)}</span>
            </div>
          </div>

          {/* Speed & Font Size Controls */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Vitesse :</span>
              <button
                onClick={() => setSpeedWPM(Math.max(80, speedWPM - 10))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
              >
                -
              </button>
              <span className="font-mono text-blue-400 font-bold min-w-[50px] text-center">{speedWPM} WPM</span>
              <button
                onClick={() => setSpeedWPM(Math.min(220, speedWPM + 10))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
              >
                +
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Taille :</span>
              <button
                onClick={() => setFontSize(Math.max(18, fontSize - 2))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
              >
                A-
              </button>
              <span className="font-mono text-slate-300 min-w-[30px] text-center">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(40, fontSize + 2))}
                className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold"
              >
                A+
              </button>
            </div>

            <button
              onClick={() => setIsEditingText(!isEditingText)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold transition-all"
            >
              {isEditingText ? 'Fermer Édition' : 'Éditer Texte'}
            </button>
          </div>

        </div>

        {/* MAIN BODY VIEW */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* PROMPTER SCROLL VIEWPORT */}
          <div className="flex-1 bg-black relative flex flex-col overflow-hidden">
            
            {/* Guide line indicator in center */}
            <div className="absolute top-1/3 left-0 right-0 h-16 border-y border-blue-500/20 bg-blue-500/5 pointer-events-none z-10 flex items-center px-4 justify-between">
              <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-wider">Ligne de Regard Caméra</span>
              <span className="text-[10px] text-blue-400/60 font-bold uppercase tracking-wider">Hauteur des Yeux</span>
            </div>

            {isEditingText ? (
              <div className="p-6 flex-1 flex flex-col space-y-3">
                <textarea
                  value={scriptData.fullScriptText}
                  onChange={(e) => {
                    const updated = { ...scriptData, fullScriptText: e.target.value };
                    setScriptData(updated);
                    if (onUpdateScript) onUpdateScript(updated);
                  }}
                  className="w-full flex-1 bg-slate-900 border border-slate-700 rounded-2xl p-4 text-sm text-white resize-none outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div 
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto p-8 md:p-14 space-y-8 scroll-smooth text-center select-none"
                style={{
                  paddingTop: '35vh',
                  paddingBottom: '45vh',
                  fontSize: `${fontSize}px`,
                  lineHeight: '1.7'
                }}
              >
                <div className="max-w-2xl mx-auto font-medium text-slate-100 whitespace-pre-line tracking-wide">
                  {scriptData.fullScriptText}
                </div>
              </div>
            )}
          </div>

          {/* SIDEBAR POSTURE & TIPS */}
          <div className="w-full md:w-80 bg-slate-950 p-5 border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto space-y-4 text-xs">
            <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-400" /> Conseils de Posture & Répétition
            </h4>

            <div className="space-y-2.5">
              {scriptData.suggestedPostureTips.map((tip, idx) => (
                <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-bold">
                    <CheckCircle2 size={12} />
                    <span>Règle #{idx + 1}</span>
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-blue-950/40 border border-blue-800/40 rounded-2xl space-y-2">
              <span className="font-bold text-blue-300 block">⚡ Structure Recommandée (60s) :</span>
              <ul className="space-y-1 text-slate-300 text-[11px]">
                <li>• <strong>0-10s :</strong> Accroche & Identité</li>
                <li>• <strong>10-40s :</strong> Preuve de ROI & Chiffres</li>
                <li>• <strong>40-60s :</strong> Clôture & Appel à l'action</li>
              </ul>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
