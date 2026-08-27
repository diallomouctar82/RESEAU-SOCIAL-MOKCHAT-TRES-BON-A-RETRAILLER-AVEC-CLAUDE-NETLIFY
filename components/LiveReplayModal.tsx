import React, { useState } from 'react';
import { 
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, BookOpen, 
  Layers, Share2, Download, Video, CheckCircle2, Clock, Users, ArrowRight,
  ListTodo, Award, FileText, Bot, Bookmark, ExternalLink, HelpCircle
} from 'lucide-react';
import { LiveStream, LiveReplayData, LiveActionItem } from '../types';
import { useGlobal } from '../contexts/GlobalContext';

interface LiveReplayModalProps {
  replayData?: LiveReplayData;
  liveStream?: LiveStream;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab?: (tab: string) => void;
}

export const LiveReplayModal: React.FC<LiveReplayModalProps> = ({
  replayData,
  liveStream,
  isOpen,
  onClose,
  onNavigateToTab
}) => {
  const { addNotification } = useGlobal();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(120); // 2:00
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'chapters' | 'transcript' | 'summary' | 'actions' | 'resources'>('chapters');
  const [isExportingToCampus, setIsExportingToCampus] = useState(false);
  const [isExportingToStudio, setIsExportingToStudio] = useState(false);

  if (!isOpen) return null;

  const title = replayData?.title || liveStream?.title || 'Replay Intelligent du Live';
  const hostName = replayData?.hostName || liveStream?.hostName || 'Sarah Koné';
  const duration = replayData?.duration || liveStream?.duration || 45;
  const durationSec = duration * 60;

  const defaultChapters = [
    { title: 'Ouverture & Présentation du Sujet', timeSec: 0, summary: 'Accueil des participants et introduction des objectifs.' },
    { title: 'Modélisation du Budget & Dossier Financier', timeSec: 360, summary: 'Méthodologie de cadrage des coûts d\'amorçage et de trésorerie.' },
    { title: 'Intervention de l\'Expert IA Diallo', timeSec: 900, summary: 'Analyse sectorielle, subventions disponibles et partenariats diaspora.' },
    { title: 'Questions / Réponses & Études de Cas', timeSec: 1800, summary: 'Échanges interactifs sur les démarches administratives et bancaires.' },
    { title: 'Feuille de Route & Actions Concrètes', timeSec: 2400, summary: 'Synthèse opérationnelle et transformation en jalons suivis.' }
  ];

  const chapters = replayData?.chapters || defaultChapters;

  const defaultTranscript = [
    { speaker: hostName, text: 'Bienvenue à tous pour cette session exceptionnelle consacrée au financement de projets.', timeSec: 5, isAi: false },
    { speaker: 'Participant A', text: 'Comment peut-on justifier les prévisions de chiffre d\'affaires pour une structure en démarrage ?', timeSec: 375, isAi: false },
    { speaker: 'Directeur Diallo (IA)', text: 'Pour une structure en phase d\'amorçage, basez-vous sur une étude de marché triangulée : benchmarks locaux, lettres d\'intention clients et ratios de marge prudents.', timeSec: 920, isAi: true },
    { speaker: hostName, text: 'Exactement. Et Diallo OS a généré directement la grille de calcul dans notre espace partagé.', timeSec: 1040, isAi: false },
    { speaker: 'Directeur Diallo (IA)', text: 'Toutes les actions validées aujourd\'hui peuvent être basculées dans votre tableau de bord personnel.', timeSec: 2420, isAi: true }
  ];

  const transcript = replayData?.transcript || defaultTranscript;

  const defaultActions: LiveActionItem[] = [
    { id: 'act-1', title: 'Compléter la grille de coûts d\'exploitation', category: 'finance', deadline: 'Sous 5 jours', completed: false },
    { id: 'act-2', title: 'Rédiger la note de cadrage avec l\'Expert Projet Diallo', category: 'projet', deadline: 'Vendredi 18h', completed: true },
    { id: 'act-3', title: 'Vérifier la conformité juridique OHADA / France', category: 'juridique', deadline: 'Semaine prochaine', completed: false }
  ];

  const [actions, setActions] = useState<LiveActionItem[]>(replayData?.actionItems || defaultActions);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSeek = (timeSec: number) => {
    setCurrentTime(timeSec);
    setIsPlaying(true);
  };

  const handleTransformToParcours = () => {
    addNotification(
      "Parcours Créé avec Succès 🎯",
      `Le contenu du Live "${title}" a été converti en Parcours Projet actif dans votre Hub d'Experts.`,
      "success"
    );
    if (onNavigateToTab) {
      onClose();
      onNavigateToTab('experts');
    }
  };

  const handleExportToCampus = () => {
    setIsExportingToCampus(true);
    setTimeout(() => {
      setIsExportingToCampus(false);
      addNotification(
        "Publié dans Campus 🎓",
        `Le Replay, les chapitres et le quiz auto-généré sont désormais disponibles comme cours sur le Campus.`,
        "success"
      );
    }, 1200);
  };

  const handleExportToStudio = () => {
    setIsExportingToStudio(true);
    setTimeout(() => {
      setIsExportingToStudio(false);
      addNotification(
        "Extraits Studio Générés 🎬",
        `3 Reels courts, un teaser vidéo et une citation graphique ont été ajoutés à votre Studio Créatif.`,
        "success"
      );
      if (onNavigateToTab) {
        onClose();
        onNavigateToTab('studio');
      }
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/10 rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] text-white animate-scale-in">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
              <Sparkles size={20} />
            </div>
            <div>
              <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span> Replay Intelligent Diallo OS
              </span>
              <h2 className="text-base font-extrabold text-white truncate max-w-md sm:max-w-xl">
                {title}
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Left: Video & Controls (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col gap-4 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20 overflow-y-auto">
            
            {/* Player Canvas Box */}
            <div className="relative aspect-video rounded-3xl overflow-hidden bg-slate-950 border border-white/10 shadow-2xl flex items-center justify-center group">
              <img 
                src={liveStream?.coverImage || 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1000&fit=crop'} 
                className="w-full h-full object-cover opacity-70" 
                alt="Replay Thumbnail" 
              />
              
              {/* Play Overlay */}
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="absolute p-5 bg-indigo-600/90 hover:bg-indigo-500 text-white rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center border border-indigo-400/50"
              >
                {isPlaying ? <Pause size={28} /> : <Play size={28} className="ml-1" fill="currentColor" />}
              </button>

              {/* Timestamp & Host Badge */}
              <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span> Replay Enregistré
              </div>
              <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-xs font-mono border border-white/10">
                {formatTime(currentTime)} / {formatTime(durationSec)}
              </div>
            </div>

            {/* Timeline Bar with Chapter Markers */}
            <div className="space-y-2 bg-slate-950/60 p-3 rounded-2xl border border-white/5">
              <div className="relative w-full h-3 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all"
                  style={{ width: `${(currentTime / durationSec) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white"
                  >
                    {isPlaying ? <Pause size={14} /> : <Play size={14} fill="currentColor" />}
                  </button>
                  <button 
                    onClick={() => handleSeek(Math.max(0, currentTime - 10))}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-[10px] font-bold"
                  >
                    -10s
                  </button>
                  <button 
                    onClick={() => handleSeek(Math.min(durationSec, currentTime + 10))}
                    className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-slate-300 text-[10px] font-bold"
                  >
                    +10s
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400">Vitesse :</span>
                  {[1, 1.25, 1.5, 2].map(speed => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${playbackSpeed === speed ? 'bg-indigo-600 text-white' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick Action Bridges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              <button 
                onClick={handleTransformToParcours}
                className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl text-left border border-indigo-400/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-blue-200">Parcours de Vie</span>
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs font-extrabold text-white">Transformer en Projet</p>
              </button>

              <button 
                onClick={handleExportToCampus}
                disabled={isExportingToCampus}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-2xl text-left border border-white/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-purple-300">Campus & MOOC</span>
                  <BookOpen size={14} className="text-purple-300" />
                </div>
                <p className="text-xs font-extrabold text-white">
                  {isExportingToCampus ? 'Publication...' : 'Publier sur Campus'}
                </p>
              </button>

              <button 
                onClick={handleExportToStudio}
                disabled={isExportingToStudio}
                className="p-3 bg-slate-800/80 hover:bg-slate-700/80 rounded-2xl text-left border border-white/10 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] font-black uppercase text-pink-300">Studio Créatif</span>
                  <Video size={14} className="text-pink-300" />
                </div>
                <p className="text-xs font-extrabold text-white">
                  {isExportingToStudio ? 'Génération...' : 'Créer Reels & Clips'}
                </p>
              </button>
            </div>

          </div>

          {/* Right: Chapters, Transcript & AI Digest (5 cols) */}
          <div className="lg:col-span-5 flex flex-col h-full bg-slate-900 overflow-hidden">
            
            {/* Tabs */}
            <div className="flex border-b border-white/10 bg-black/30 p-1">
              {[
                { id: 'chapters', label: 'Chapitres' },
                { id: 'transcript', label: 'Transcription' },
                { id: 'actions', label: 'Actions' },
                { id: 'summary', label: 'Synthèse IA' }
              ].map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id as any)}
                  className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-colors ${activeTab === t.id ? 'bg-white/10 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Tab Panels */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              
              {/* 1. Chapters View */}
              {activeTab === 'chapters' && (
                <div className="space-y-2.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Navigation instantanée par chapitres
                  </span>
                  {chapters.map((chap, idx) => (
                    <div
                      key={idx}
                      onClick={() => handleSeek(chap.timeSec)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${currentTime >= chap.timeSec && (idx === chapters.length - 1 || currentTime < chapters[idx + 1].timeSec) ? 'bg-indigo-600/20 border-indigo-500/50 shadow-md' : 'bg-slate-950/40 border-white/5 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-extrabold text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-white/10 text-[10px] flex items-center justify-center font-mono">
                            {idx + 1}
                          </span>
                          {chap.title}
                        </span>
                        <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                          {formatTime(chap.timeSec)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 pl-7 leading-relaxed">
                        {chap.summary}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 2. Synchronized Transcript */}
              {activeTab === 'transcript' && (
                <div className="space-y-3">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Transcription textuelle synchronisée
                  </span>
                  {transcript.map((item, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => handleSeek(item.timeSec)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all ${Math.abs(currentTime - item.timeSec) < 30 ? 'bg-indigo-900/30 border-indigo-500/40' : 'bg-slate-950/30 border-white/5 hover:bg-white/5'}`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className={`flex items-center gap-1.5 ${item.isAi ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {item.isAi && <Bot size={12} />} {item.speaker}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500">{formatTime(item.timeSec)}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{item.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* 3. Action Items */}
              {activeTab === 'actions' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Actions relevées par Diallo OS
                    </span>
                    <span className="text-[10px] font-bold text-emerald-400">
                      {actions.filter(a => a.completed).length}/{actions.length} validées
                    </span>
                  </div>

                  {actions.map((act) => (
                    <div 
                      key={act.id}
                      onClick={() => {
                        setActions(prev => prev.map(a => a.id === act.id ? { ...a, completed: !a.completed } : a));
                      }}
                      className="p-3 bg-slate-950/40 hover:bg-slate-950/60 rounded-2xl border border-white/5 flex items-start gap-3 cursor-pointer transition-all"
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center ${act.completed ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 bg-black/40'}`}>
                        {act.completed && <CheckCircle2 size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-bold ${act.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {act.title}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1">
                          <span className="px-1.5 py-0.5 bg-white/5 rounded text-[9px] uppercase font-bold text-indigo-300">{act.category}</span>
                          {act.deadline && <span>Échéance : {act.deadline}</span>}
                        </div>
                      </div>
                    </div>
                  ))}

                  <button 
                    onClick={handleTransformToParcours}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-md mt-2 flex items-center justify-center gap-2"
                  >
                    <ListTodo size={14} /> Synchroniser avec mon dossier
                  </button>
                </div>
              )}

              {/* 4. AI Synthesis */}
              {activeTab === 'summary' && (
                <div className="space-y-4">
                  <div className="p-4 bg-indigo-950/40 rounded-2xl border border-indigo-500/20 space-y-2">
                    <h4 className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles size={14} /> Synthèse Globale du Live
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Cette session a permis de clarifier les leviers de financement de projets transfrontaliers. 
                      L'intervention de l'Expert Projet Diallo a fourni la structure complète du plan de trésorerie 
                      et identifié 3 guichets de subventions prioritaires pour l'amorçage.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Points Clés Retenus</span>
                    <ul className="space-y-2 text-xs text-slate-300">
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5"></span>
                        <span>Constitution d'un dossier bancaire conforme aux normes internationales.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                        <span>Mise à profit des garanties de la diaspora et des fonds d'impact.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5"></span>
                        <span>Accompagnement continu via le dossier actif dans l'espace membre.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};
