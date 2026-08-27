import React, { useState, useRef, useEffect } from 'react';
import { 
  Heart, MessageCircle, Share2, Bookmark, Sparkles, Volume2, VolumeX, 
  Play, Pause, ChevronUp, ChevronDown, Bot, CheckCircle, GraduationCap, 
  Users, Briefcase, HelpCircle, Shield, ArrowRight, BookOpen, Scale, 
  Flame, Globe, Lightbulb, Compass, Award, ExternalLink, X, Send, 
  FileText, Sliders, Wifi, WifiOff, Eye, Check, AlertTriangle, MessageSquare,
  Timer, Target, Zap, Clock, ShoppingBag, FolderPlus, UserCheck, RefreshCw,
  Search, Scan, Mic, Camera, ArrowUpRight
} from 'lucide-react';
import { Reel, ReelCategory, ReelActionGateway, ReelQuiz, Comment, MemberProfile, ReelIntentType, ReelChallenge, TenMinutesSessionState } from '../types';
import { AGENTS, USER_PROFILE, REEL_CHALLENGES } from '../constants';

interface SmartReelViewerProps {
  reels: Reel[];
  initialReelId?: string;
  onClose?: () => void;
  onOpenDirectChat?: (conversationId?: string, member?: MemberProfile) => void;
  onOpenParcours?: (agentId?: string, title?: string) => void;
  onOpenCampus?: (courseId?: string) => void;
  onOpenTribe?: (tribeId?: string) => void;
  onCreateReel?: () => void;
}

export const SmartReelViewer: React.FC<SmartReelViewerProps> = ({
  reels,
  initialReelId,
  onClose,
  onOpenDirectChat,
  onOpenParcours,
  onOpenCampus,
  onOpenTribe,
  onCreateReel
}) => {
  // Navigation & Category Filter
  const [categoryFilter, setCategoryFilter] = useState<ReelCategory>('all');
  const [utilityBalance, setUtilityBalance] = useState<'entertain' | 'balanced' | 'learn'>('balanced');
  const [dataSaver, setDataSaver] = useState(false);
  const [discoveryMode, setDiscoveryMode] = useState(false);

  // Filtered Reels
  const filteredReels = reels.filter(r => {
    if (discoveryMode) return true; // Show everything across the spectrum
    if (categoryFilter !== 'all' && r.category !== categoryFilter) return false;
    if (utilityBalance === 'learn') {
      return r.category === 'learning' || r.category === 'expert' || r.category === 'legal' || r.category === 'career' || r.category === 'language' || r.category === 'project' || r.quiz;
    }
    return true;
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (initialReelId) {
      const idx = reels.findIndex(r => r.id === initialReelId);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });

  const activeReel = filteredReels[currentIndex] || filteredReels[0] || reels[0];

  // Video State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Interactions State
  const [likesCount, setLikesCount] = useState<Record<string, number>>({});
  const [isLikedMap, setIsLikedMap] = useState<Record<string, boolean>>({});
  const [isSavedMap, setIsSavedMap] = useState<Record<string, boolean>>({});
  const [followedAuthors, setFollowedAuthors] = useState<Record<string, boolean>>({});
  const [portfolioSaved, setPortfolioSaved] = useState<Record<string, boolean>>({});

  // Interactive Modals / Overlays
  const [showComments, setShowComments] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showChallengesModal, setShowChallengesModal] = useState(false);
  const [showPersonalizationModal, setShowPersonalizationModal] = useState(false);
  const [showDialloCopilotModal, setShowDialloCopilotModal] = useState(false);
  const [showVisualSearchModal, setShowVisualSearchModal] = useState(false);
  const [showIntentConversionModal, setShowIntentConversionModal] = useState<ReelIntentType | null>(null);

  // 10-Minute Sprint Session State
  const [tenMinSession, setTenMinSession] = useState<TenMinutesSessionState>({
    isActive: false,
    mode: 'learn',
    secondsRemaining: 600,
    reelsWatchedCount: 0,
    quizzesCompletedCount: 0,
    actionsTriggeredCount: 0,
    xpEarned: 0
  });
  const [showTenMinModal, setShowTenMinModal] = useState(false);
  const [showTenMinSummary, setShowTenMinSummary] = useState(false);

  // Selected Challenges interactive state
  const [challenges, setChallenges] = useState<ReelChallenge[]>(REEL_CHALLENGES);
  const [joinedChallenges, setJoinedChallenges] = useState<Record<string, boolean>>({
    'ch-english-30': true
  });

  // Quiz interactive state
  const [selectedQuizAnswer, setSelectedQuizAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Diallo AI Copilot contextual question state
  const [copilotQuestion, setCopilotQuestion] = useState('');
  const [copilotResponse, setCopilotResponse] = useState<string | null>(null);
  const [isCopilotThinking, setIsCopilotThinking] = useState(false);

  // Comments state
  const [commentsList, setCommentsList] = useState<Comment[]>([
    {
      id: 'c1',
      authorName: 'Mamadou Diallo',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      content: 'Explication ultra claire et directement actionnable pour mon entreprise ! Merci.',
      timestamp: 'Il y a 2h',
      likes: 14
    },
    {
      id: 'c2',
      authorName: 'Aïcha Traoré',
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      content: 'Est-ce que l\'Expert Projet peut aussi nous aider à trouver des subventions régionales ?',
      timestamp: 'Il y a 30 min',
      likes: 6
    }
  ]);
  const [newCommentText, setNewCommentText] = useState('');

  // 10-Minute Sprint Timer Effect
  useEffect(() => {
    let interval: any;
    if (tenMinSession.isActive && tenMinSession.secondsRemaining > 0) {
      interval = setInterval(() => {
        setTenMinSession(prev => {
          if (prev.secondsRemaining <= 1) {
            setShowTenMinSummary(true);
            return { ...prev, isActive: false, secondsRemaining: 0 };
          }
          return { ...prev, secondsRemaining: prev.secondsRemaining - 1 };
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tenMinSession.isActive, tenMinSession.secondsRemaining]);

  // Handle Play/Pause
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
  };

  // Keyboard navigation & timeupdate
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'j') {
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'k') {
        goToPrev();
      } else if (e.key === ' ') {
        e.preventDefault();
        togglePlay();
      } else if (e.key === 'm') {
        setIsMuted(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, filteredReels.length, isPlaying]);

  // Video progress updater
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const update = () => {
      if (v.duration) {
        setProgress((v.currentTime / v.duration) * 100);
      }
    };
    v.addEventListener('timeupdate', update);
    return () => v.removeEventListener('timeupdate', update);
  }, [activeReel]);

  // Reset states on reel change
  useEffect(() => {
    setSelectedQuizAnswer(null);
    setQuizSubmitted(false);
    setShowQuiz(false);
    setShowComments(false);
    setShowWhyModal(false);
    setShowImpactModal(false);
    setShowDialloCopilotModal(false);
    setShowVisualSearchModal(false);
    setShowIntentConversionModal(null);
    setIsPlaying(true);

    if (tenMinSession.isActive) {
      setTenMinSession(prev => ({
        ...prev,
        reelsWatchedCount: prev.reelsWatchedCount + 1,
        xpEarned: prev.xpEarned + 10
      }));
    }
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < filteredReels.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setCurrentIndex(0); // Loop
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const handleLike = (reelId: string) => {
    setIsLikedMap(prev => ({ ...prev, [reelId]: !prev[reelId] }));
    setLikesCount(prev => ({
      ...prev,
      [reelId]: (prev[reelId] || activeReel.likes) + (isLikedMap[reelId] ? -1 : 1)
    }));
  };

  const handleSave = (reelId: string) => {
    setIsSavedMap(prev => ({ ...prev, [reelId]: !prev[reelId] }));
  };

  const handleTogglePortfolio = (reelId: string) => {
    setPortfolioSaved(prev => {
      const next = !prev[reelId];
      alert(next ? "Reel ajouté à votre Portfolio comme preuve de réalisation !" : "Reel retiré de votre portfolio.");
      return { ...prev, [reelId]: next };
    });
  };

  const handleToggleFollow = (author: string) => {
    setFollowedAuthors(prev => ({ ...prev, [author]: !prev[author] }));
  };

  const handleAddComment = () => {
    if (!newCommentText.trim()) return;
    const newC: Comment = {
      id: `c-${Date.now()}`,
      authorName: USER_PROFILE.name,
      authorAvatar: USER_PROFILE.avatarUrl,
      content: newCommentText.trim(),
      timestamp: 'À l\'instant',
      likes: 0
    };
    setCommentsList(prev => [newC, ...prev]);
    setNewCommentText('');
  };

  // Start 10-Minute Sprint
  const startTenMinuteSession = (mode: 'learn' | 'discover' | 'objective' | 'entertain') => {
    setTenMinSession({
      isActive: true,
      mode,
      secondsRemaining: 600,
      reelsWatchedCount: 1,
      quizzesCompletedCount: 0,
      actionsTriggeredCount: 0,
      xpEarned: 20
    });
    setShowTenMinModal(false);
    if (mode === 'learn') setUtilityBalance('learn');
    if (mode === 'discover') setDiscoveryMode(true);
  };

  // Copilot Contextual Ask
  const askDialloCopilot = (customPrompt?: string) => {
    const prompt = customPrompt || copilotQuestion;
    if (!prompt.trim()) return;
    setIsCopilotThinking(true);
    setTimeout(() => {
      setIsCopilotThinking(false);
      if (prompt.includes('Pourquoi') || prompt.includes('pourquoi')) {
        setCopilotResponse(`Cette vidéo de ${activeReel.author} est pertinente car elle aborde directement « ${activeReel.tags?.join(', ') || activeReel.category} », un domaine aligné avec vos objectifs d'autonomie et de développement professionnel.`);
      } else if (prompt.includes('cours') || prompt.includes('apprendre')) {
        setCopilotResponse(`Diallo OS a identifié le cours certifiant correspondant sur le Campus Mok : « Masterclass Pratique & Méthodologie ${activeReel.category || 'Pro'} ». Durée : 4h30, 8 modules.`);
      } else if (prompt.includes('projet')) {
        setCopilotResponse(`Élément sauvegardé et lié à votre dossier d'incubation « Projet ${activeReel.actionGateway?.targetTitle || 'Général'} ». L'Expert Projet a pré-rempli la section ressources.`);
      } else {
        setCopilotResponse(`Analyse Diallo OS : « ${activeReel.description} ». Recommandation : Passer le quiz de vérification ou contacter ${activeReel.author} via Mok Chat pour structurer votre démarche.`);
      }
    }, 600);
  };

  const handleActionGatewayTrigger = (gateway: ReelActionGateway) => {
    if (tenMinSession.isActive) {
      setTenMinSession(prev => ({ ...prev, actionsTriggeredCount: prev.actionsTriggeredCount + 1, xpEarned: prev.xpEarned + 50 }));
    }

    if (gateway.type === 'expert' || gateway.type === 'career_coach') {
      if (onOpenParcours) {
        onOpenParcours(gateway.agentId, gateway.targetTitle);
      } else {
        alert(`Démarrage du parcours d'accompagnement avec l'Expert (${gateway.targetTitle})`);
      }
    } else if (gateway.type === 'campus') {
      if (onOpenCampus) {
        onOpenCampus(gateway.courseId);
      } else {
        alert(`Redirection vers le Campus : ${gateway.targetTitle}`);
      }
    } else if (gateway.type === 'tribe') {
      if (onOpenTribe) {
        onOpenTribe(gateway.tribeId);
      } else {
        alert(`Adhésion et ouverture de la Tribu : ${gateway.targetTitle}`);
      }
    } else if (gateway.type === 'legal_source') {
      if (gateway.legalArticle?.sourceUrl) {
        window.open(gateway.legalArticle.sourceUrl, '_blank');
      } else {
        alert(`Source légale officielle : ${gateway.legalArticle?.codeOrLaw} (${gateway.legalArticle?.articleNumber})`);
      }
    } else if (gateway.type === 'project') {
      if (onOpenParcours) {
        onOpenParcours('1', 'Incubation de Projet');
      } else {
        alert('Transmission du dossier à l\'Expert Projet Diallo OS');
      }
    } else if (gateway.type === 'commerce') {
      setShowIntentConversionModal('commerce_inquire');
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div id="smart-reels-container" className="relative w-full h-[88vh] max-h-[920px] bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col md:flex-row select-none">
      
      {/* 1. TOP UTILITY & NAVIGATION BAR */}
      <div className="absolute top-4 left-4 right-4 z-30 flex items-center justify-between pointer-events-auto">
        
        {/* Left Filter & Mode Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none max-w-[65%] py-1">
          {[
            { id: 'all', label: 'Tous', icon: '🌟' },
            { id: 'learning', label: 'Apprendre', icon: '🎓' },
            { id: 'expert', label: 'Experts', icon: '⚖️' },
            { id: 'career', label: 'Carrière', icon: '💼' },
            { id: 'project', label: 'Projets', icon: '🚀' },
            { id: 'commerce', label: 'Commerce', icon: '🌍' },
            { id: 'tribe', label: 'Tribus', icon: '🔥' },
            { id: 'language', label: 'Langues', icon: '🗣️' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => {
                setCategoryFilter(cat.id as ReelCategory);
                setCurrentIndex(0);
              }}
              className={`px-3 py-1 rounded-full text-xs font-black transition-all flex items-center gap-1 backdrop-blur-md whitespace-nowrap ${categoryFilter === cat.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30 ring-2 ring-white/30' : 'bg-black/50 text-slate-300 hover:bg-black/80 hover:text-white border border-white/10'}`}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Right Action Tools: 10-Min Sprint, Challenges, Diallo Co-pilot & Data Saver */}
        <div className="flex items-center gap-2 flex-shrink-0">
          
          {/* « J'ai 10 minutes » Mode Sprint */}
          {!tenMinSession.isActive ? (
            <button
              onClick={() => setShowTenMinModal(true)}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white rounded-full text-xs font-black shadow-md border border-white/20 transition-all"
              title="Lancer une session cadrée de 10 minutes"
            >
              <Timer size={13} />
              <span>J'ai 10 min</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-amber-500/20 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40 text-amber-300 text-xs font-black animate-pulse">
              <Timer size={14} className="animate-spin" />
              <span>{formatTimer(tenMinSession.secondsRemaining)}</span>
              <span className="text-[10px] text-amber-200">({tenMinSession.xpEarned} XP)</span>
              <button 
                onClick={() => {
                  setTenMinSession(prev => ({ ...prev, isActive: false }));
                  setShowTenMinSummary(true);
                }} 
                className="ml-1 text-slate-400 hover:text-white"
                title="Arrêter la session"
              >
                <X size={12} />
              </button>
            </div>
          )}

          {/* Challenges Utiles Button */}
          <button
            onClick={() => setShowChallengesModal(true)}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md text-amber-400 border border-white/10 hover:bg-black/80 transition-all"
            title="Challenges Utiles (30 jours anglais, 7 jours CV, etc.)"
          >
            <Zap size={16} />
          </button>

          {/* Personnalisation & Reset Algorithme */}
          <button
            onClick={() => setShowPersonalizationModal(true)}
            className="p-2 rounded-full bg-black/50 backdrop-blur-md text-slate-300 border border-white/10 hover:text-white hover:bg-black/80 transition-all"
            title="Personnaliser mes recommandations / Mode Découverte"
          >
            <Sliders size={16} />
          </button>

          {/* Mode Économie de Données */}
          <button
            onClick={() => setDataSaver(!dataSaver)}
            className={`p-2 rounded-full backdrop-blur-md border transition-all ${dataSaver ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' : 'bg-black/50 text-slate-300 border-white/10 hover:text-white'}`}
            title={dataSaver ? "Économie de données active (SD compressée)" : "Mode HD par défaut"}
          >
            {dataSaver ? <WifiOff size={15} /> : <Wifi size={15} />}
          </button>

          {/* Close Modal (if provided) */}
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 bg-black/60 text-white hover:bg-red-600/80 rounded-full backdrop-blur-md border border-white/10 transition-all"
              title="Fermer les Reels"
            >
              <X size={16} />
            </button>
          )}
        </div>

      </div>

      {/* 2. MAIN PLAYER STAGE (VERTICAL CENTERED) */}
      <div className="relative flex-1 h-full flex items-center justify-center bg-black overflow-hidden group">
        
        {/* The Vertical Video element */}
        <div className="relative w-full h-full max-w-[480px] bg-slate-900 overflow-hidden flex items-center justify-center">
          
          <video
            ref={videoRef}
            src={activeReel.videoUrl}
            poster={activeReel.thumbnailUrl}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onClick={togglePlay}
            className="w-full h-full object-cover cursor-pointer"
          />

          {/* Play/Pause Overlay Indicator on click */}
          {!isPlaying && (
            <div 
              onClick={togglePlay}
              className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs cursor-pointer z-10"
            >
              <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-2xl border border-white/30 hover:scale-110 transition-transform">
                <Play size={32} fill="white" className="ml-1" />
              </div>
            </div>
          )}

          {/* Top Progress Line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 z-20">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Top Floating Controls: Sound & Visual Search */}
          <div className="absolute top-20 right-4 flex flex-col gap-2 z-20">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-white border border-white/15 hover:bg-black/80 transition-all"
              title={isMuted ? "Activer le son" : "Couper le son"}
            >
              {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <button
              onClick={() => setShowVisualSearchModal(true)}
              className="p-2.5 rounded-full bg-black/50 backdrop-blur-md text-indigo-300 border border-indigo-400/30 hover:bg-indigo-900/60 transition-all"
              title="Recherche Visuelle IA (« Qu'est-ce que c'est ? »)"
            >
              <Scan size={18} />
            </button>
          </div>

          {/* AI Certified Expert & Synthetic Content Badges */}
          <div className="absolute top-20 left-4 z-20 flex flex-col gap-1.5 pointer-events-none">
            {activeReel.isVerifiedExpert && (
              <span className="px-2.5 py-1 bg-indigo-600/90 text-white text-[10px] font-black rounded-lg backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
                <CheckCircle size={11} className="text-blue-200" />
                <span>Expert Vérifié</span>
              </span>
            )}
            {activeReel.isSyntheticAi && (
              <span className="px-2.5 py-1 bg-purple-600/90 text-white text-[10px] font-black rounded-lg backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
                <Bot size={11} />
                <span>Copilote IA Spécialisé</span>
              </span>
            )}
            {discoveryMode && (
              <span className="px-2.5 py-1 bg-amber-500/90 text-white text-[10px] font-black rounded-lg backdrop-blur-md border border-white/20 shadow-md flex items-center gap-1">
                <Compass size={11} />
                <span>Mode Découverte Ouvert</span>
              </span>
            )}
          </div>

          {/* BOTTOM-LEFT: AUTHOR METADATA, CAPTION, ACTION GATEWAYS & INTENT BUTTONS */}
          <div className="absolute bottom-0 left-0 right-16 p-5 bg-gradient-to-t from-black/95 via-black/60 to-transparent z-20 space-y-2.5 pointer-events-auto">
            
            {/* Author Profile Row */}
            <div className="flex items-center gap-3">
              <img 
                src={activeReel.authorAvatar || USER_PROFILE.avatarUrl} 
                alt={activeReel.author} 
                className="w-10 h-10 rounded-full object-cover ring-2 ring-white/60 shadow-lg cursor-pointer"
                onClick={() => {
                  if (onOpenDirectChat) onOpenDirectChat(undefined, {
                    id: activeReel.authorId || 'u1',
                    name: activeReel.author,
                    role: activeReel.authorRole || 'Créateur',
                    avatar: activeReel.authorAvatar || USER_PROFILE.avatarUrl,
                    country: 'Guinée',
                    isOnline: true,
                    followers: 1200,
                    coursesCompleted: 8,
                    projectsCount: 3,
                    skills: ['Leadership', 'Innovation']
                  });
                }}
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-white font-black text-xs truncate">
                  <span>{activeReel.author}</span>
                  {activeReel.authorRole && (
                    <span className="text-[10px] text-slate-300 font-medium">({activeReel.authorRole})</span>
                  )}
                </div>
                {activeReel.musicTrack && (
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate">
                    <span>🎵 {activeReel.musicTrack}</span>
                  </div>
                )}
              </div>

              {/* Follow Button */}
              <button
                onClick={() => handleToggleFollow(activeReel.author)}
                className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ml-auto ${followedAuthors[activeReel.author] ? 'bg-white/20 text-white' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'}`}
              >
                {followedAuthors[activeReel.author] ? 'Abonné' : '+ Suivre'}
              </button>
            </div>

            {/* Reel Caption */}
            <p className="text-xs text-white/95 leading-relaxed font-medium line-clamp-2">
              {activeReel.description}
            </p>

            {/* PRIMARY INTENT CONVERSION STRIP (« JE VEUX LE FAIRE », « CANDIDATER », « APPRENDRE », « PROJET », « COMMERCE ») */}
            <div className="pt-0.5 flex flex-col gap-1.5">
              
              {/* Category-specific Intent Trigger */}
              {activeReel.category === 'language' || activeReel.category === 'learning' ? (
                <button
                  onClick={() => setShowIntentConversionModal('learn')}
                  className="w-full py-2 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5"><GraduationCap size={15} /> JE VEUX APPRENDRE</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Évaluation & Cours ➔</span>
                </button>
              ) : activeReel.category === 'career' ? (
                <button
                  onClick={() => setShowIntentConversionModal('apply')}
                  className="w-full py-2 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5"><Briefcase size={15} /> JE VEUX CANDIDATER</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Audit & CV ➔</span>
                </button>
              ) : activeReel.category === 'project' ? (
                <button
                  onClick={() => setShowIntentConversionModal('project')}
                  className="w-full py-2 px-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5"><Sparkles size={15} /> TRANSFORMER MON IDÉE EN PROJET</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Incubation ➔</span>
                </button>
              ) : activeReel.category === 'commerce' ? (
                <button
                  onClick={() => setShowIntentConversionModal('commerce_inquire')}
                  className="w-full py-2 px-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5"><ShoppingBag size={15} /> JE SUIS INTÉRESSÉ (ACHAT / IMPORT)</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Fiche Produit ➔</span>
                </button>
              ) : (
                <button
                  onClick={() => setShowIntentConversionModal('help_me_do_same')}
                  className="w-full py-2 px-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-95 text-white rounded-xl text-xs font-black shadow-lg flex items-center justify-between transition-all"
                >
                  <span className="flex items-center gap-1.5"><Zap size={15} /> AIDE-MOI À FAIRE PAREIL</span>
                  <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-md font-bold">Plan d'action ➔</span>
                </button>
              )}

              {/* Action Gateway Secondary Pill (if defined) */}
              {activeReel.actionGateway && (
                <button
                  onClick={() => handleActionGatewayTrigger(activeReel.actionGateway!)}
                  className="w-full py-1.5 px-2.5 bg-black/60 hover:bg-black/90 text-slate-200 border border-white/15 rounded-xl text-[11px] font-bold flex items-center justify-between backdrop-blur-md transition-all"
                >
                  <span className="truncate flex items-center gap-1.5">
                    {activeReel.actionGateway.type === 'campus' && <GraduationCap size={13} className="text-emerald-400" />}
                    {activeReel.actionGateway.type === 'expert' && <Bot size={13} className="text-indigo-400" />}
                    {activeReel.actionGateway.type === 'career_coach' && <Briefcase size={13} className="text-blue-400" />}
                    {activeReel.actionGateway.type === 'tribe' && <Users size={13} className="text-amber-400" />}
                    {activeReel.actionGateway.type === 'legal_source' && <Scale size={13} className="text-purple-400" />}
                    {activeReel.actionGateway.type === 'project' && <Sparkles size={13} className="text-orange-400" />}
                    <span className="truncate">{activeReel.actionGateway.label}</span>
                  </span>
                  <ArrowRight size={13} className="flex-shrink-0 text-slate-400" />
                </button>
              )}

            </div>

            {/* Quick Interactive Mini-Quiz Trigger */}
            {activeReel.quiz && (
              <button
                onClick={() => setShowQuiz(true)}
                className="w-full py-1 px-2.5 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-extrabold flex items-center justify-center gap-1.5 backdrop-blur-md border border-emerald-400/30 transition-all shadow-md"
              >
                <Lightbulb size={12} className="text-amber-300 animate-bounce" />
                <span>Mini-Quiz Vérification : Testez votre compréhension (XP)</span>
              </button>
            )}

          </div>

          {/* RIGHT FLOATING INTERACTION DOCK */}
          <div className="absolute bottom-6 right-3 flex flex-col items-center gap-3 z-20">
            
            {/* 1. Like Action */}
            <button
              onClick={() => handleLike(activeReel.id)}
              className="flex flex-col items-center gap-1 text-white group"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${isLikedMap[activeReel.id] ? 'bg-red-600 border-red-400 text-white scale-110' : 'bg-black/50 border-white/20 text-white hover:bg-black/80'}`}>
                <Heart size={20} fill={isLikedMap[activeReel.id] ? 'currentColor' : 'none'} className={isLikedMap[activeReel.id] ? 'animate-ping-once' : ''} />
              </div>
              <span className="text-[10px] font-black">{likesCount[activeReel.id] || activeReel.likes}</span>
            </button>

            {/* 2. Comments Action */}
            <button
              onClick={() => setShowComments(true)}
              className="flex flex-col items-center gap-1 text-white group"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all">
                <MessageCircle size={20} />
              </div>
              <span className="text-[10px] font-black">{activeReel.comments}</span>
            </button>

            {/* 3. Diallo OS Copilot Direct (« Explique-moi », « Pourquoi cette vidéo ? ») */}
            <button
              onClick={() => {
                setShowDialloCopilotModal(true);
                askDialloCopilot('Explique-moi cette vidéo et sa valeur pour moi');
              }}
              className="flex flex-col items-center gap-1 text-white group"
              title="Poser une question à Diallo OS sur cette vidéo"
            >
              <div className="w-11 h-11 rounded-full bg-purple-600/90 border border-purple-400/40 flex items-center justify-center backdrop-blur-md hover:bg-purple-600 transition-all">
                <Sparkles size={19} className="text-amber-300 animate-spin-slow" />
              </div>
              <span className="text-[9px] font-black text-purple-300">Diallo IA</span>
            </button>

            {/* 4. Save to Portfolio (Preuve de réalisation / Dossier) */}
            <button
              onClick={() => handleTogglePortfolio(activeReel.id)}
              className="flex flex-col items-center gap-1 text-white group"
              title="Ajouter à mon portfolio / Preuve de réalisation"
            >
              <div className={`w-11 h-11 rounded-full flex items-center justify-center backdrop-blur-md border transition-all ${portfolioSaved[activeReel.id] ? 'bg-amber-500 border-amber-300 text-white scale-110' : 'bg-black/50 border-white/20 text-white hover:bg-black/80'}`}>
                <FolderPlus size={19} />
              </div>
              <span className="text-[9px] font-black text-amber-300">Portfolio</span>
            </button>

            {/* 5. Mesure de l'Impact & Taux de passage à l'action */}
            <button
              onClick={() => setShowImpactModal(true)}
              className="flex flex-col items-center gap-1 text-white group"
              title="Mesure d'Impact utile & Taux de passage à l'action"
            >
              <div className="w-11 h-11 rounded-full bg-emerald-600/80 border border-emerald-400/40 flex items-center justify-center backdrop-blur-md hover:bg-emerald-600 transition-all">
                <Award size={19} className="text-emerald-200" />
              </div>
              <span className="text-[9px] font-black text-emerald-300">Impact</span>
            </button>

            {/* 6. Partage Mok Chat & Externe */}
            <button
              onClick={() => {
                if (onOpenDirectChat) {
                  onOpenDirectChat();
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert('Lien du Reel copié ! Partagez-le dans vos Tribus ou Mok Chat.');
                }
              }}
              className="flex flex-col items-center gap-1 text-white group"
              title="Transmettre dans Mok Chat ou copier le lien"
            >
              <div className="w-11 h-11 rounded-full bg-black/50 border border-white/20 flex items-center justify-center backdrop-blur-md hover:bg-black/80 transition-all">
                <Share2 size={19} />
              </div>
              <span className="text-[10px] font-black">{activeReel.shares}</span>
            </button>

          </div>

          {/* VERTICAL SWIPE NAVIGATION CONTROLLERS (DESKTOP) */}
          <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden md:flex flex-col gap-2 z-20">
            <button
              onClick={goToPrev}
              disabled={currentIndex === 0}
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/80 border border-white/10 disabled:opacity-20 transition-all shadow-lg"
              title="Reel précédent"
            >
              <ChevronUp size={22} />
            </button>
            <button
              onClick={goToNext}
              className="p-2 rounded-full bg-black/40 text-white hover:bg-black/80 border border-white/10 transition-all shadow-lg"
              title="Reel suivant"
            >
              <ChevronDown size={22} />
            </button>
          </div>

        </div>

      </div>

      {/* 3. SIDE PANEL: COMMENTS & AI SUMMARY */}
      {showComments && (
        <div className="absolute inset-y-0 right-0 w-full sm:w-96 bg-slate-900 border-l border-slate-800 z-40 flex flex-col p-4 shadow-2xl animate-slide-left">
          
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <MessageCircle size={18} className="text-indigo-400" />
              <h3 className="text-sm font-black text-white">Commentaires ({commentsList.length})</h3>
            </div>
            <button 
              onClick={() => setShowComments(false)}
              className="p-1 text-slate-400 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
          </div>

          {activeReel.commentSummary && (
            <div className="py-2.5 px-3 my-2 bg-indigo-950/60 rounded-2xl border border-indigo-500/30 text-xs space-y-2">
              <div className="flex items-center justify-between text-indigo-300 font-extrabold text-[11px]">
                <span className="flex items-center gap-1"><Sparkles size={12} /> Synthèse Diallo OS des discussions</span>
                <span className="text-[9px] bg-indigo-500/20 px-1.5 py-0.5 rounded">IA</span>
              </div>
              <p className="text-slate-300 text-[11px] leading-relaxed">
                Questions clés : {activeReel.commentSummary.frequentQuestions.join(' • ')}
              </p>
            </div>
          )}

          <div className="flex-1 overflow-y-auto space-y-3 py-2 scrollbar-thin">
            {commentsList.map(c => (
              <div key={c.id} className="p-3 bg-slate-800/60 rounded-2xl border border-slate-700/50 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={c.authorAvatar} className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-xs font-bold text-white">{c.authorName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400">{c.timestamp}</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed">{c.content}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold pt-1">
                  <span>❤️ {c.likes || 0}</span>
                  <span>•</span>
                  <button 
                    onClick={() => {
                      if (onOpenDirectChat) {
                        onOpenDirectChat();
                      } else {
                        alert(`Ouverture d'un échange direct avec ${c.authorName} dans Mok Chat`);
                      }
                    }}
                    className="text-indigo-400 hover:underline"
                  >
                    Répondre en privé
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={newCommentText}
              onChange={(e) => setNewCommentText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(); }}
              placeholder="Poser une question ou partager une opportunité..."
              className="flex-1 bg-slate-800 text-xs text-white placeholder-slate-400 rounded-xl px-3 py-2.5 outline-none border border-slate-700 focus:border-indigo-500"
            />
            <button
              onClick={handleAddComment}
              disabled={!newCommentText.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-xl disabled:opacity-30 hover:bg-indigo-500 transition-all"
            >
              <Send size={15} />
            </button>
          </div>

        </div>
      )}

      {/* 4. MODAL: PASSAGE DU PUBLIC AU PRIVÉ & CAPTEUR D'INTENTIONS EXPLICITES */}
      {showIntentConversionModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-5 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl shadow-md">
                  <Zap size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Passage à l'Action Structurée</h3>
                  <span className="text-[10px] text-slate-400">Diallo OS • Transition protégée du public au privé</span>
                </div>
              </div>
              <button onClick={() => setShowIntentConversionModal(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Consent Banner */}
            <div className="p-3 bg-indigo-950/60 rounded-2xl border border-indigo-500/30 flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed">
              <Shield size={16} className="text-indigo-400 flex-shrink-0 mt-0.5" />
              <p>
                <strong>Consentement & Confidentialité :</strong> Votre échange public ne sera pas copié automatiquement. Diallo OS crée un dossier privé sécurisé pour vous accompagner jusqu'au résultat.
              </p>
            </div>

            {/* SCENARIO 1: APPRENDRE */}
            {showIntentConversionModal === 'learn' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-white text-sm">🎓 Parcours d'Apprentissage Certifiant</h4>
                <p className="text-slate-300 leading-relaxed">
                  Vous souhaitez maîtriser : <strong>{activeReel.description}</strong>
                </p>
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">1. Évaluation de niveau initiale (10 questions)</div>
                      <div className="text-[10px] text-slate-400">Positionnement automatique sur le Campus</div>
                    </div>
                    <span className="text-emerald-400 font-bold text-[10px]">Prêt</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">2. Copilote Expert Langue / Compétence</div>
                      <div className="text-[10px] text-slate-400">Exercices quotidiens et pratique orale assistée</div>
                    </div>
                    <span className="text-indigo-400 font-bold text-[10px]">Inclus</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowIntentConversionModal(null);
                    if (onOpenCampus) onOpenCampus('course-mandarin-pro');
                    else alert('Démarrage du parcours d\'apprentissage sur le Campus Mok !');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white rounded-xl font-black shadow-lg"
                >
                  Démarrer mon Parcours Personnalisé
                </button>
              </div>
            )}

            {/* SCENARIO 2: CANDIDATER / EMPLOI */}
            {showIntentConversionModal === 'apply' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-white text-sm">💼 Candidature Suivie & Coach Carrière</h4>
                <p className="text-slate-300 leading-relaxed">
                  Offre identifiée : <strong>{activeReel.actionGateway?.targetTitle || 'Poste International'}</strong>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Échéance</span>
                    <span className="font-bold text-amber-400">{activeReel.actionGateway?.opportunityData?.deadline || '15 Septembre 2026'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-[10px] text-slate-400 block">Adéquation Profil</span>
                    <span className="font-bold text-emerald-400">92% de match</span>
                  </div>
                </div>
                <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700 space-y-1">
                  <span className="font-bold text-indigo-300">Plan d'action Diallo OS :</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    1. Audit de vos compétences ➔ 2. Adaptation CV & Lettre ➔ 3. Simulation entretien avec Coach Carrière.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowIntentConversionModal(null);
                    if (onOpenParcours) onOpenParcours('2', 'Candidature & Coach Carrière');
                    else alert('Dossier de candidature créé avec l\'Expert Carrière !');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl font-black shadow-lg"
                >
                  Préparer ma Candidature avec Coach Carrière
                </button>
              </div>
            )}

            {/* SCENARIO 3: TRANSFORMER MON IDÉE EN PROJET */}
            {showIntentConversionModal === 'project' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-white text-sm">🚀 Incubation & Cadrage de Projet</h4>
                <p className="text-slate-300 leading-relaxed">
                  Idée : <strong>{activeReel.description}</strong>
                </p>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                  <div className="font-bold text-white">Livrables du dossier privé :</div>
                  <ul className="list-disc list-inside text-[11px] text-slate-300 space-y-1">
                    <li>Note de cadrage & Étude d'opportunité</li>
                    <li>Estimation du budget prévisionnel & Seuil de rentabilité</li>
                    <li>Recherche de partenaires dans les Tribus actives</li>
                    <li>Calendrier d'exécution et jalons</li>
                  </ul>
                </div>
                <button
                  onClick={() => {
                    setShowIntentConversionModal(null);
                    if (onOpenParcours) onOpenParcours('1', 'Incubation de Projet');
                    else alert('Projet initialisé dans votre espace privé Diallo OS !');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:opacity-95 text-white rounded-xl font-black shadow-lg"
                >
                  Créer le Dossier Projet Privé
                </button>
              </div>
            )}

            {/* SCENARIO 4: COMMERCE & EXPORT */}
            {showIntentConversionModal === 'commerce_inquire' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-white text-sm">🌍 Demande Commerciale & Import/Export</h4>
                <p className="text-slate-300 leading-relaxed">
                  Vendeur : <strong>{activeReel.author}</strong> ({activeReel.authorRole})
                </p>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">Fiche Produit Marché Mok</span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">Vendeur Vérifié</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Mise en relation avec traduction multilingue, contrat type et séquestre sécurisé Diallo OS.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowIntentConversionModal(null);
                      if (onOpenDirectChat) onOpenDirectChat();
                      else alert('Ouverture de la négociation sécurisée dans Mok Chat');
                    }}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-black"
                  >
                    Contacter le Vendeur
                  </button>
                  <button
                    onClick={() => {
                      setShowIntentConversionModal(null);
                      alert('Fiche produit exportée vers votre dossier Marché !');
                    }}
                    className="py-3 px-4 bg-slate-800 hover:bg-slate-750 text-white rounded-xl font-bold border border-slate-700"
                  >
                    Voir au Marché
                  </button>
                </div>
              </div>
            )}

            {/* SCENARIO 5: AIDE-MOI À FAIRE PAREIL */}
            {showIntentConversionModal === 'help_me_do_same' && (
              <div className="space-y-3 text-xs">
                <h4 className="font-extrabold text-white text-sm">⚡ Dupliquer cette Réussite</h4>
                <p className="text-slate-300 leading-relaxed">
                  Diallo OS décompose les étapes clés de cette vidéo pour vous guider pas à pas.
                </p>
                <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 space-y-1.5">
                  <span className="font-bold text-indigo-300">Étapes générées :</span>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <div>1. Analyse des outils utilisés dans le Reel</div>
                    <div>2. Recommandation des modèles de documents associés</div>
                    <div>3. Suivi quotidien de votre progression</div>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowIntentConversionModal(null);
                    if (onOpenParcours) onOpenParcours('1', 'Duplication de Méthode');
                    else alert('Objectif ajouté à votre tableau de bord Diallo OS !');
                  }}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:opacity-95 text-white rounded-xl font-black shadow-lg"
                >
                  Ajouter à mes Objectifs Suivis
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* 5. MODAL: « J'AI 10 MINUTES » SPRINT D'APPRENTISSAGE */}
      {showTenMinModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-2xl">
                  <Timer size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Mode « J'ai 10 minutes »</h3>
                  <span className="text-[10px] text-slate-400">Micro-session ciblée • Zéro perte de temps</span>
                </div>
              </div>
              <button onClick={() => setShowTenMinModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Choisissez votre intention pour cette session de 10 minutes. Diallo OS composera un flux sur mesure et mesurera votre accomplissement.
            </p>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <button
                onClick={() => startTenMinuteSession('learn')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-emerald-500/30 text-left space-y-1 group transition-all"
              >
                <span className="text-xl">🎓</span>
                <div className="font-extrabold text-white group-hover:text-emerald-400">Apprendre</div>
                <div className="text-[10px] text-slate-400">Savoirs, astuces & mini-quiz</div>
              </button>
              <button
                onClick={() => startTenMinuteSession('objective')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-indigo-500/30 text-left space-y-1 group transition-all"
              >
                <span className="text-xl">🎯</span>
                <div className="font-extrabold text-white group-hover:text-indigo-400">Mon Objectif</div>
                <div className="text-[10px] text-slate-400">Avancer sur mon projet/CV</div>
              </button>
              <button
                onClick={() => startTenMinuteSession('discover')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-purple-500/30 text-left space-y-1 group transition-all"
              >
                <span className="text-xl">🧭</span>
                <div className="font-extrabold text-white group-hover:text-purple-400">Découvrir</div>
                <div className="text-[10px] text-slate-400">Hors de ma bulle habituelle</div>
              </button>
              <button
                onClick={() => startTenMinuteSession('entertain')}
                className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-750 border border-amber-500/30 text-left space-y-1 group transition-all"
              >
                <span className="text-xl">🌟</span>
                <div className="font-extrabold text-white group-hover:text-amber-400">Divertissement</div>
                <div className="text-[10px] text-slate-400">Culture, créations & détente</div>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. MODAL: BILAN DU SPRINT « VOILÀ CE QUE VOUS AVEZ ACCOMPLI » */}
      {showTenMinSummary && (
        <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/50 rounded-3xl p-6 space-y-5 shadow-2xl animate-scale-up text-center">
            
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto shadow-xl">
              <Award size={32} />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-white">Session de 10 Minutes Terminée !</h3>
              <p className="text-xs text-slate-300">
                Voilà ce que vous avez concrètement accompli pendant ces 10 minutes :
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <span className="text-lg font-black text-emerald-400">{tenMinSession.reelsWatchedCount}</span>
                <span className="text-[10px] text-slate-400 block">Vidéos utiles</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <span className="text-lg font-black text-indigo-400">{tenMinSession.quizzesCompletedCount || 1}</span>
                <span className="text-[10px] text-slate-400 block">Quiz validés</span>
              </div>
              <div className="p-3 bg-slate-800/80 rounded-2xl border border-slate-700">
                <span className="text-lg font-black text-amber-400">+{tenMinSession.xpEarned || 80}</span>
                <span className="text-[10px] text-slate-400 block">XP Gagnés</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-950/40 rounded-2xl border border-emerald-500/20 text-xs text-slate-300 text-left space-y-1">
              <span className="font-bold text-emerald-300">💡 Résultat enregistré :</span>
              <p className="text-[11px] leading-relaxed">
                Votre temps a été converti en compétences réelles sans boucle addictive. Vos progrès sont synchronisés avec votre profil Campus.
              </p>
            </div>

            <button
              onClick={() => setShowTenMinSummary(false)}
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg"
            >
              Reprendre mes Activités
            </button>

          </div>
        </div>
      )}

      {/* 7. MODAL: DIALLO OS COPILOTE CONTEXTUEL SUR LE REEL */}
      {showDialloCopilotModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-purple-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-purple-500/20 text-purple-400 rounded-xl">
                  <Bot size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Diallo OS Copilote</h3>
                  <span className="text-[10px] text-slate-400">Analyse de la vidéo en cours</span>
                </div>
              </div>
              <button onClick={() => setShowDialloCopilotModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                onClick={() => askDialloCopilot('Pourquoi cette vidéo est importante pour moi ?')}
                className="p-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-left text-slate-200 border border-slate-700"
              >
                ❓ Pourquoi pour moi ?
              </button>
              <button
                onClick={() => askDialloCopilot('Trouve-moi le cours complet sur le Campus')}
                className="p-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-left text-slate-200 border border-slate-700"
              >
                🎓 Trouver le cours complet
              </button>
              <button
                onClick={() => askDialloCopilot('Ajoute cette méthode à mon projet')}
                className="p-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-left text-slate-200 border border-slate-700"
              >
                📁 Ajouter à mon projet
              </button>
              <button
                onClick={() => askDialloCopilot('Trouve-moi l\'Expert compétent')}
                className="p-2 bg-slate-800 hover:bg-slate-750 rounded-xl text-left text-slate-200 border border-slate-700"
              >
                🤖 Trouver l'Expert
              </button>
            </div>

            {/* Response Box */}
            <div className="p-4 bg-slate-800/90 rounded-2xl border border-slate-700 min-h-[100px] text-xs text-slate-200 leading-relaxed">
              {isCopilotThinking ? (
                <div className="flex items-center gap-2 text-purple-300 animate-pulse">
                  <Sparkles size={16} /> Analyse contextuelle de la vidéo par Diallo OS...
                </div>
              ) : copilotResponse ? (
                <div>{copilotResponse}</div>
              ) : (
                <div className="text-slate-400">Posez une question ou cliquez sur une suggestion ci-dessus.</div>
              )}
            </div>

            {/* Free input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={copilotQuestion}
                onChange={(e) => setCopilotQuestion(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') askDialloCopilot(); }}
                placeholder="Ex: Comment appliquer cette astuce..."
                className="flex-1 bg-slate-800 text-xs text-white placeholder-slate-400 rounded-xl px-3 py-2.5 outline-none border border-slate-700"
              />
              <button
                onClick={() => askDialloCopilot()}
                className="p-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-500"
              >
                <Send size={14} />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 8. MODAL: RECHERCHE VISUELLE IA (« QU'EST-CE QUE C'EST ? ») */}
      {showVisualSearchModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Scan size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Recherche Visuelle IA</h3>
                  <span className="text-[10px] text-slate-400">Diallo Vision • Reconnaissance d'objets & savoir-faire</span>
                </div>
              </div>
              <button onClick={() => setShowVisualSearchModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-video border border-slate-700 bg-black">
              <img src={activeReel.thumbnailUrl} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 border-2 border-dashed border-indigo-400/80 m-4 rounded-xl flex items-center justify-center">
                <span className="px-3 py-1 bg-black/70 backdrop-blur-md text-[11px] text-white rounded-full font-bold">
                  Objet détecté : {activeReel.category === 'commerce' ? 'Denrée Agricole / Café' : 'Matériel / Compétence Tech'}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <button
                onClick={() => {
                  alert('Recherche de produits similaires déclenchée sur le Marché Mok !');
                  setShowVisualSearchModal(false);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-left flex items-center justify-between"
              >
                <span>🛍️ Trouver ce produit sur le Marché</span>
                <ArrowUpRight size={14} className="text-indigo-400" />
              </button>
              <button
                onClick={() => {
                  alert('Recherche des formations associées lancée sur le Campus Mok !');
                  setShowVisualSearchModal(false);
                }}
                className="w-full p-3 bg-slate-800 hover:bg-slate-750 text-white rounded-xl text-left flex items-center justify-between"
              >
                <span>🎓 Où puis-je apprendre à faire ça ?</span>
                <ArrowUpRight size={14} className="text-indigo-400" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 9. MODAL: CHALLENGES UTILES (30 Jours d'anglais, 7 jours CV, etc.) */}
      {showChallengesModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-amber-500/40 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up max-h-[85vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-amber-500/20 text-amber-400 rounded-2xl">
                  <Zap size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Challenges Utiles & Pédagogiques</h3>
                  <span className="text-[10px] text-slate-400">Progression par étapes • Réalisations certifiées</span>
                </div>
              </div>
              <button onClick={() => setShowChallengesModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {challenges.map(ch => {
                const isJoined = joinedChallenges[ch.id];
                return (
                  <div key={ch.id} className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-white text-xs">{ch.title}</h4>
                          <span className="text-[9px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                            +{ch.rewardXp} XP
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-0.5">{ch.tagline}</p>
                      </div>
                      <button
                        onClick={() => {
                          setJoinedChallenges(prev => ({ ...prev, [ch.id]: !prev[ch.id] }));
                          alert(isJoined ? `Désinscription du challenge ${ch.title}` : `Inscription réussie au challenge ${ch.title} !`);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${isJoined ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}
                      >
                        {isJoined ? '✓ Inscrit' : "S'inscrire"}
                      </button>
                    </div>

                    {/* Steps list */}
                    <div className="space-y-1.5 pt-1">
                      {ch.steps.map((st, idx) => (
                        <div key={idx} className="p-2 bg-slate-900/60 rounded-xl flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${st.completed ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                              {st.completed ? '✓' : st.day}
                            </span>
                            <span className={st.completed ? 'text-slate-400 line-through' : 'text-slate-200'}>{st.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400">{st.objective}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      )}

      {/* 10. MODAL: CONTRÔLE DE PERSONNALISATION & RÉINITIALISATION DU FLUX */}
      {showPersonalizationModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                  <Sliders size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Personnaliser mes Recommandations</h3>
                  <span className="text-[10px] text-slate-400">Contrôle algorithmique transparent</span>
                </div>
              </div>
              <button onClick={() => setShowPersonalizationModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-white block">Mode Découverte (Sans bulle de filtre)</span>
                <p className="text-[11px] text-slate-400">L'algorithme s'éloigne volontairement de vos habitudes pour explorer d'autres cultures et métiers.</p>
                <button
                  onClick={() => setDiscoveryMode(!discoveryMode)}
                  className={`w-full py-2 rounded-lg font-bold text-xs transition-all ${discoveryMode ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300'}`}
                >
                  {discoveryMode ? '✓ Mode Découverte Activé' : 'Activer le Mode Découverte'}
                </button>
              </div>

              <div className="p-3 bg-slate-800 rounded-xl space-y-2">
                <span className="font-bold text-white block">Réinitialisation complète</span>
                <p className="text-[11px] text-slate-400">Efface l'historique temporaire de visionnage pour repartir sur un flux neutre.</p>
                <button
                  onClick={() => {
                    alert('Flux de recommandations réinitialisé avec succès !');
                    setShowPersonalizationModal(false);
                  }}
                  className="w-full py-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg font-bold text-xs border border-red-500/40 transition-all flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={13} /> Réinitialiser mon flux
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 11. MODAL: MINI-QUIZ D'APPRENTISSAGE */}
      {showQuiz && activeReel.quiz && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-indigo-500/40 rounded-3xl p-6 space-y-5 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <GraduationCap size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Vérification des Connaissances</h3>
                  <span className="text-[10px] text-slate-400">Campus Mok • Validation instantanée</span>
                </div>
              </div>
              <button onClick={() => setShowQuiz(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {/* Question */}
            <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700">
              <h4 className="text-xs font-bold text-white leading-relaxed">
                {activeReel.quiz.question}
              </h4>
            </div>

            {/* Options */}
            <div className="space-y-2.5">
              {activeReel.quiz.options.map((opt, idx) => {
                const isSelected = selectedQuizAnswer === idx;
                const isCorrect = idx === activeReel.quiz!.correctIndex;
                let btnStyle = 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-750';
                
                if (quizSubmitted) {
                  if (isCorrect) {
                    btnStyle = 'bg-emerald-600/30 text-emerald-300 border-emerald-500 font-bold';
                  } else if (isSelected) {
                    btnStyle = 'bg-red-600/30 text-red-300 border-red-500';
                  }
                } else if (isSelected) {
                  btnStyle = 'bg-indigo-600 text-white border-indigo-400 font-bold';
                }

                return (
                  <button
                    key={idx}
                    onClick={() => {
                      if (!quizSubmitted) setSelectedQuizAnswer(idx);
                    }}
                    className={`w-full text-left p-3 rounded-xl border text-xs transition-all flex items-center justify-between ${btnStyle}`}
                  >
                    <span>{opt}</span>
                    {quizSubmitted && isCorrect && <Check size={16} className="text-emerald-400" />}
                  </button>
                );
              })}
            </div>

            {/* Explanation after submission */}
            {quizSubmitted && (
              <div className="p-3.5 bg-indigo-950/60 rounded-xl border border-indigo-500/30 space-y-1">
                <span className="text-[11px] font-bold text-indigo-300">💡 Explication pédagogique :</span>
                <p className="text-xs text-slate-300 leading-relaxed">{activeReel.quiz.explanation}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              {!quizSubmitted ? (
                <button
                  onClick={() => {
                    if (selectedQuizAnswer !== null) {
                      setQuizSubmitted(true);
                      if (tenMinSession.isActive) {
                        setTenMinSession(prev => ({ ...prev, quizzesCompletedCount: prev.quizzesCompletedCount + 1, xpEarned: prev.xpEarned + 30 }));
                      }
                    }
                  }}
                  disabled={selectedQuizAnswer === null}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded-xl text-xs font-black transition-all shadow-lg"
                >
                  Valider ma Réponse
                </button>
              ) : (
                <div className="w-full flex items-center gap-2">
                  <button
                    onClick={() => setShowQuiz(false)}
                    className="flex-1 py-2.5 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold"
                  >
                    Fermer
                  </button>
                  {activeReel.quiz.campusCourseId && (
                    <button
                      onClick={() => {
                        setShowQuiz(false);
                        if (onOpenCampus) onOpenCampus(activeReel.quiz!.campusCourseId);
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <BookOpen size={14} /> Approfondir sur Campus
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 12. MODAL: IMPACT UTILE & TAUX DE PASSAGE À L'ACTION */}
      {showImpactModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 space-y-5 shadow-2xl animate-scale-up">
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl">
                  <Award size={20} />
                </span>
                <div>
                  <h3 className="text-sm font-black text-white">Indicateur d'Impact Utile</h3>
                  <span className="text-[10px] text-slate-400">Au-delà des simples vues et likes</span>
                </div>
              </div>
              <button onClick={() => setShowImpactModal(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Apprenants engagés</span>
                <div className="text-lg font-black text-emerald-400">{activeReel.impactMetrics?.learnersStarted || 120}</div>
                <span className="text-[10px] text-slate-500">Ont démarré une leçon</span>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Parcours déclenchés</span>
                <div className="text-lg font-black text-indigo-400">{activeReel.impactMetrics?.parcoursTriggered || 34}</div>
                <span className="text-[10px] text-slate-500">Avec un Expert Diallo</span>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Taux de Passage à l'Action</span>
                <div className="text-lg font-black text-purple-400">14.8%</div>
                <span className="text-[10px] text-slate-500">Clic « Je veux le faire »</span>
              </div>
              <div className="p-3.5 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Score d'Utilité</span>
                <div className="text-lg font-black text-amber-400">{activeReel.impactMetrics?.utilityScore || 95}%</div>
                <span className="text-[10px] text-slate-500">Certifié par la communauté</span>
              </div>
            </div>

            <div className="p-3.5 bg-emerald-950/40 rounded-xl border border-emerald-500/20 text-xs text-slate-300 leading-relaxed">
              🌍 <strong>LE MONDE À VOUS</strong> valorise la progression réelle, la création d'emplois et l'entraide concrète plutôt que la seule captation d'attention.
            </div>

            <button
              onClick={() => setShowImpactModal(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black"
            >
              Fermer
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
