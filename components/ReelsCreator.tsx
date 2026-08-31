
import React, { useState, useRef, useEffect } from 'react';
import { Video, Sparkles, Wand2, Music, Type, Share2, Download, X, Play, Pause, ChevronRight, Upload, Mic, RefreshCw, Languages, TrendingUp, Layers, CheckCircle, Camera, Circle, StopCircle, Zap, Timer, RotateCcw, Sticker, Scissors, Palette, Move, Send, FileText, AlignCenter, Volume2, AudioWaveform, Film, ZapOff } from 'lucide-react';
import { generateText, generateJSON, generateImage, generateSpeechDetailed } from '../services/aiGateway';
import { ReelDraft } from '../types';

interface ReelsCreatorProps {
    onClose: () => void;
    onPublish: (reel: ReelDraft) => void;
}

interface OverlayElement {
    id: string;
    type: 'text' | 'sticker';
    content: string; // Text or Image URL
    x: number;
    y: number;
    scale: number;
}

interface TimelineTrack {
    id: string;
    type: 'video' | 'audio' | 'effect' | 'voice' | 'transition';
    name: string;
    color: string;
    start: number;
    duration: number;
}

export const ReelsCreator: React.FC<ReelsCreatorProps> = ({ onClose, onPublish }) => {
    // Stage: 'upload' -> 'editor' -> 'publish'
    const [stage, setStage] = useState<'upload' | 'editor' | 'publish'>('upload');
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    
    // Camera State
    const [isCameraMode, setIsCameraMode] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [camSpeed, setCamSpeed] = useState(1);
    const [camTimer, setCamTimer] = useState(0);
    const liveVideoRef = useRef<HTMLVideoElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const streamRef = useRef<MediaStream | null>(null);
    const timerIntervalRef = useRef<number | null>(null);

    // AI Teleprompter State
    const [isTeleprompterOpen, setIsTeleprompterOpen] = useState(false);
    const [scriptTopic, setScriptTopic] = useState('');
    const [teleprompterText, setTeleprompterText] = useState('');
    const [isGeneratingScript, setIsGeneratingScript] = useState(false);

    // AI Director & Editor State
    const [directorPrompt, setDirectorPrompt] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [activeTool, setActiveTool] = useState<'director' | 'stickers' | 'subs' | 'magic' | 'voice'>('director');
    const [overlays, setOverlays] = useState<OverlayElement[]>([]);
    const [tracks, setTracks] = useState<TimelineTrack[]>([
        { id: 't1', type: 'video', name: 'Rush Original', color: 'bg-blue-600', start: 0, duration: 100 }
    ]);
    const [montageStyle, setMontageStyle] = useState<'dynamic' | 'vlog' | 'cinematic'>('dynamic');
    
    // Voiceover State
    const [voiceText, setVoiceText] = useState('');
    const [isGeneratingVoice, setIsGeneratingVoice] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Publish State
    const [caption, setCaption] = useState('');
    const [hashtags, setHashtags] = useState<string[]>([]);
    const [viralScore, setViralScore] = useState<number>(0);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);

    // Action Gateway & Utility State
    const [selectedCategory, setSelectedCategory] = useState<string>('learning');
    const [actionType, setActionType] = useState<'none' | 'expert' | 'campus' | 'tribe' | 'career_coach' | 'project' | 'legal_source'>('campus');
    const [actionLabel, setActionLabel] = useState('Approfondir sur le Campus');
    const [actionTargetTitle, setActionTargetTitle] = useState('Module de formation certifiant');
    const [includeQuiz, setIncludeQuiz] = useState(false);
    const [quizQuestion, setQuizQuestion] = useState('Quelle est la règle essentielle abordée dans cette vidéo ?');
    const [quizOpt1, setQuizOpt1] = useState('Méthode STAR');
    const [quizOpt2, setQuizOpt2] = useState('Improvisation');
    const [quizExplanation, setQuizExplanation] = useState('La méthode STAR garantit une clarté structurée lors des entretiens.');

    // Guided Mode for Beginners (« Diallo, aide-moi à publier ma première vidéo »)
    const [isGuidedMode, setIsGuidedMode] = useState(false);
    const [guidedStep, setGuidedStep] = useState<number>(1);
    const [guidedTopic, setGuidedTopic] = useState('');
    const [guidedAppearOnScreen, setGuidedAppearOnScreen] = useState(true);
    const [guidedVoiceType, setGuidedVoiceType] = useState<'my_voice' | 'ai_narration'>('ai_narration');
    const [guidedAiDraft, setGuidedAiDraft] = useState('');
    const [isTranslatingMultilingual, setIsTranslatingMultilingual] = useState(false);
    const [enableAfricanLanguages, setEnableAfricanLanguages] = useState(true);

    const videoRef = useRef<HTMLVideoElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopCameraStream();
            if (audioContextRef.current) audioContextRef.current.close();
        };
    }, []);

    // --- CAMERA ACTIONS ---

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            streamRef.current = stream;
            if (liveVideoRef.current) {
                liveVideoRef.current.srcObject = stream;
            }
            setIsCameraMode(true);
        } catch (err) {
            console.error("Camera access denied:", err);
            alert("Impossible d'accéder à la caméra. Vérifiez vos permissions.");
        }
    };

    const stopCameraStream = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startRecording = () => {
        if (!streamRef.current) return;
        
        chunksRef.current = [];
        const recorder = new MediaRecorder(streamRef.current);
        mediaRecorderRef.current = recorder;

        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                chunksRef.current.push(e.data);
            }
        };

        recorder.onstop = () => {
            const blob = new Blob(chunksRef.current, { type: 'video/mp4' });
            const url = URL.createObjectURL(blob);
            setVideoSrc(url);
            setIsCameraMode(false);
            setStage('editor');
            stopCameraStream();
        };

        // Delay for timer if set
        if (camTimer > 0) {
            setTimeout(() => {
                recorder.start();
                setIsRecording(true);
                startTimer();
            }, camTimer * 1000);
        } else {
            recorder.start();
            setIsRecording(true);
            startTimer();
        }
    };

    const startTimer = () => {
        setRecordingTime(0);
        timerIntervalRef.current = window.setInterval(() => {
            setRecordingTime(prev => prev + 1);
        }, 1000);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        }
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    // --- AI SCRIPT GENERATOR (Teleprompter) ---

    const handleGenerateScript = async () => {
        if (!scriptTopic.trim()) return;
        setIsGeneratingScript(true);
        try {
            const prompt = `Écris un script court (30-45 secondes) et percutant pour une vidéo verticale (Reel/TikTok) sur le sujet : "${scriptTopic}".
            Style : Dynamique, engageant, direct. Pas d'intro inutile.
            Format : Texte brut uniquement, prêt à être lu.`;

            const response = await generateText(prompt);
            setTeleprompterText(response || "Erreur de génération.");
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingScript(false);
        }
    };

    // --- AI & EDITING ACTIONS ---

    const handleGenerateVeo = async () => {
        if (!directorPrompt) return;
        setIsProcessing(true);
        try {
            // Simulation of Veo call
            await new Promise(resolve => setTimeout(resolve, 2000));
            setVideoSrc("https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4"); 
            setStage('editor');
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateSticker = async () => {
        if (!directorPrompt) return;
        setIsProcessing(true);
        try {
            const imageUrl = await generateImage(
                `A high quality, isolated sticker of ${directorPrompt}, white outline, transparent background style`,
                { params: { aspectRatio: '1:1' } }
            );

            if (imageUrl) {
                const newSticker: OverlayElement = {
                    id: Date.now().toString(),
                    type: 'sticker',
                    content: imageUrl,
                    x: 50,
                    y: 50,
                    scale: 1
                };
                setOverlays(prev => [...prev, newSticker]);
                // Add to timeline visual
                setTracks(prev => [...prev, {
                    id: `tk-${Date.now()}`,
                    type: 'effect',
                    name: 'Sticker IA',
                    color: 'bg-purple-500',
                    start: 20,
                    duration: 30
                }]);
                setDirectorPrompt('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleGenerateVoiceover = async () => {
        if (!voiceText) return;
        setIsGeneratingVoice(true);
        try {
            // Note : la voix générée dépend désormais du fournisseur vocal actif
            // (ElevenLabs par défaut) et non plus de la voix Gemini "Fenrir".
            const speech = await generateSpeechDetailed(voiceText);
            if (speech?.audioBase64) {
                setTracks(prev => [...prev, {
                    id: `voice-${Date.now()}`,
                    type: 'voice',
                    name: 'Voix IA',
                    color: 'bg-orange-500',
                    start: 0,
                    duration: 50
                }]);

                // Play for preview
                const audio = new Audio(`data:${speech.mimeType};base64,${speech.audioBase64}`);
                audio.play().catch(() => {});

                setVoiceText('');
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingVoice(false);
        }
    };

    const handleAutoMontage = async () => {
        setIsProcessing(true);
        try {
            const prompt = `Agis comme un monteur vidéo professionnel. J'ai un rush vidéo brut de 100% de durée.
            Je veux un montage de style : ${montageStyle} (Dynamic: coupes rapides, Vlog: naturel, Cinematic: lent et fluide).
            
            Génère un plan de montage en JSON qui découpe la vidéo en segments intéressants et ajoute des transitions.
            Format JSON attendu :
            [
              { "type": "clip", "name": "Intro", "start": 0, "duration": 15 },
              { "type": "transition", "name": "Zoom In", "start": 15, "duration": 2 },
              { "type": "clip", "name": "Action", "start": 17, "duration": 20 },
              { "type": "transition", "name": "Fade", "start": 37, "duration": 2 },
              { "type": "clip", "name": "Outro", "start": 39, "duration": 10 }
            ]
            `;

            const editPlan = await generateJSON<any[]>(prompt);

            // Transform JSON into Tracks
            const newTracks: TimelineTrack[] = [];
            
            // Clear existing video tracks to replace with montage
            const otherTracks = tracks.filter(t => t.type !== 'video' && t.type !== 'transition');
            
            editPlan.forEach((item: any, index: number) => {
                if (item.type === 'clip') {
                    newTracks.push({
                        id: `clip-${index}`,
                        type: 'video',
                        name: item.name,
                        color: index % 2 === 0 ? 'bg-blue-600' : 'bg-blue-500',
                        start: item.start,
                        duration: item.duration
                    });
                } else if (item.type === 'transition') {
                    newTracks.push({
                        id: `trans-${index}`,
                        type: 'transition',
                        name: item.name,
                        color: 'bg-yellow-500',
                        start: item.start,
                        duration: item.duration
                    });
                }
            });

            setTracks([...otherTracks, ...newTracks]);

        } catch (e) {
            console.error("Auto Montage Error", e);
            alert("Erreur lors du montage automatique.");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleViralAnalysis = async () => {
        setStage('publish');
        setIsProcessing(true);
        try {
            const prompt = `Analyse le concept d'un Reel. Génère une légende virale, des hashtags, un score et des suggestions d'amélioration.
            Réponds en JSON : { "caption": "...", "hashtags": ["..."], "score": 85, "suggestions": ["..."] }`;

            const result = await generateJSON<any>(prompt);
            setCaption(result.caption);
            setHashtags(result.hashtags);
            setViralScore(result.score);
            setAiSuggestions(result.suggestions || []);
            
            generateThumbnails();
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessing(false);
        }
    };

    const generateThumbnails = async () => {
        setGeneratedThumbnails([
            "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&fit=crop",
            "https://images.unsplash.com/photo-1628157588553-5eeea00af15c?w=200&fit=crop",
            "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&fit=crop"
        ]);
    };

    const togglePlay = () => {
        if (videoRef.current) {
            if (isPlaying) videoRef.current.pause();
            else videoRef.current.play();
            setIsPlaying(!isPlaying);
        }
    };

    // --- RENDER ---

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col md:flex-row text-white font-sans animate-fade-up">
            
            {/* 1. VISUAL WORKSPACE */}
            <div className={`relative ${stage === 'upload' ? 'w-full h-full' : 'w-full md:w-2/3 h-1/2 md:h-full'} bg-gray-900 flex items-center justify-center transition-all duration-500 overflow-hidden`}>
                
                {!isCameraMode && (
                    <button onClick={onClose} className="absolute top-6 left-6 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full hover:bg-white/20 border border-white/10 transition-all"><X /></button>
                )}
                
                {/* UPLOAD SCREEN */}
                {stage === 'upload' && !isCameraMode && (
                    <div className="text-center space-y-8 p-8 max-w-lg relative z-10">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 rounded-full blur-[120px] pointer-events-none"></div>
                        
                        <div className="relative">
                            <h1 className="text-6xl font-black tracking-tighter mb-2">Studio <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Infinity</span></h1>
                            <p className="text-gray-400 text-lg font-light">L'outil de création ultime. De l'idée à la viralité.</p>
                        </div>
                        
                        {/* MODE CRÉATION GUIDÉE DÉBUTANT */}
                        <div className="pt-2">
                            <button
                                onClick={() => {
                                    setIsGuidedMode(true);
                                    setGuidedStep(1);
                                }}
                                className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-2xl font-black text-xs shadow-xl flex items-center justify-center gap-2 border border-white/20 transition-transform active:scale-95"
                            >
                                <Sparkles size={16} className="text-amber-300" />
                                <span>« Diallo, aide-moi à publier ma première vidéo » (Mode Guidé)</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => fileInputRef.current?.click()} className="group py-8 px-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-purple-500/50 transition-all flex flex-col items-center justify-center gap-4">
                                <div className="p-4 bg-purple-600/20 rounded-full text-purple-400 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                                <span className="font-bold text-sm uppercase tracking-widest">Importer</span>
                            </button>
                            <button onClick={startCamera} className="group py-8 px-4 bg-white/5 border border-white/10 rounded-3xl hover:bg-white/10 hover:border-red-500/50 transition-all flex flex-col items-center justify-center gap-4">
                                <div className="p-4 bg-red-600/20 rounded-full text-red-400 group-hover:scale-110 transition-transform"><Camera size={32} /></div>
                                <span className="font-bold text-sm uppercase tracking-widest">Caméra AI</span>
                            </button>
                            <input type="file" ref={fileInputRef} className="hidden" accept="video/*" onChange={(e) => { const f = e.target.files?.[0]; if(f) { setVideoSrc(URL.createObjectURL(f)); setStage('editor'); } }} />
                        </div>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10"></div></div>
                            <div className="relative flex justify-center text-xs font-bold uppercase tracking-widest text-gray-500"><span className="px-2 bg-gray-900">Génération Vidéo</span></div>
                        </div>

                        <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-1 rounded-2xl shadow-xl">
                            <div className="flex items-center bg-black/60 rounded-xl p-2 border border-white/10">
                                <Wand2 className="text-pink-500 ml-2 animate-pulse" size={20} />
                                <input 
                                    value={directorPrompt}
                                    onChange={(e) => setDirectorPrompt(e.target.value)}
                                    placeholder="Ex: Drone view of futuristic Dakar..."
                                    className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-3 text-white placeholder-gray-500"
                                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateVeo()}
                                />
                                <button onClick={handleGenerateVeo} className="p-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg hover:opacity-90 shadow-lg">
                                    {isProcessing ? <RefreshCw className="animate-spin" size={16} /> : <ChevronRight size={16} />}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* CAMERA MODE WITH TELEPROMPTER */}
                {isCameraMode && (
                    <div className="absolute inset-0 bg-black z-50">
                        <video ref={liveVideoRef} autoPlay muted className="w-full h-full object-cover transform scale-x-[-1]" />
                        
                        {/* Teleprompter Overlay */}
                        {isTeleprompterOpen && teleprompterText && (
                            <div className="absolute top-20 left-0 right-0 h-64 bg-black/40 backdrop-blur-sm z-40 overflow-hidden pointer-events-none fade-mask">
                                <div className="animate-scroll-text px-8 text-2xl font-bold text-white/90 text-center leading-relaxed">
                                    {teleprompterText}
                                </div>
                                <style>{`
                                    @keyframes scroll-text {
                                        0% { transform: translateY(100%); }
                                        100% { transform: translateY(-100%); }
                                    }
                                    .animate-scroll-text {
                                        animation: scroll-text ${teleprompterText.length / 5}s linear infinite;
                                    }
                                    .fade-mask {
                                        mask-image: linear-gradient(to bottom, transparent, black 20%, black 80%, transparent);
                                    }
                                `}</style>
                            </div>
                        )}

                        {/* Teleprompter Controls */}
                        {isTeleprompterOpen && !teleprompterText && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md p-6 rounded-3xl border border-white/20 w-80 z-50">
                                <h3 className="text-white font-bold mb-2 flex items-center gap-2"><FileText size={18} /> Script Générateur</h3>
                                <input 
                                    value={scriptTopic} 
                                    onChange={e => setScriptTopic(e.target.value)} 
                                    placeholder="Sujet de la vidéo..." 
                                    className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-sm text-white mb-4 outline-none focus:border-brand-500"
                                />
                                <button 
                                    onClick={handleGenerateScript}
                                    disabled={isGeneratingScript}
                                    className="w-full bg-brand-600 text-white py-2 rounded-xl font-bold flex items-center justify-center gap-2"
                                >
                                    {isGeneratingScript ? <RefreshCw className="animate-spin" size={16} /> : <Wand2 size={16} />}
                                    Générer Script
                                </button>
                            </div>
                        )}

                        {/* Camera Toolbar Right */}
                        <div className="absolute top-12 right-4 flex flex-col gap-4 bg-black/20 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                            <button onClick={() => setCamSpeed(camSpeed === 1 ? 2 : camSpeed === 2 ? 0.5 : 1)} className="p-2 text-white hover:text-brand-400 transition-colors flex flex-col items-center gap-1">
                                <Zap size={24} /> <span className="text-[10px] font-bold">{camSpeed}x</span>
                            </button>
                            <button onClick={() => setCamTimer(camTimer === 0 ? 3 : camTimer === 3 ? 10 : 0)} className="p-2 text-white hover:text-brand-400 transition-colors flex flex-col items-center gap-1">
                                <Timer size={24} /> <span className="text-[10px] font-bold">{camTimer > 0 ? camTimer + 's' : 'Off'}</span>
                            </button>
                            <button onClick={() => setIsTeleprompterOpen(!isTeleprompterOpen)} className={`p-2 transition-colors flex flex-col items-center gap-1 ${isTeleprompterOpen ? 'text-brand-400 bg-white/10 rounded-xl' : 'text-white'}`}>
                                <FileText size={24} /> <span className="text-[10px] font-bold">Script</span>
                            </button>
                        </div>

                        {/* Top Controls */}
                        <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                            <button onClick={() => { setIsCameraMode(false); stopCameraStream(); }} className="text-white p-2 hover:bg-white/20 rounded-full"><X size={24} /></button>
                            {isRecording && (
                                <div className="bg-red-600 px-3 py-1 rounded-full text-xs font-bold animate-pulse flex items-center gap-2 shadow-lg">
                                    <span className="w-2 h-2 bg-white rounded-full"></span> {formatTime(recordingTime)}
                                </div>
                            )}
                            <div className="w-8"></div>
                        </div>

                        {/* Shutter */}
                        <div className="absolute bottom-0 left-0 right-0 p-12 flex justify-center items-center bg-gradient-to-t from-black/80 to-transparent">
                            {!isRecording ? (
                                <button onClick={startRecording} className="w-20 h-20 rounded-full border-[6px] border-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                    <div className="w-16 h-16 bg-red-600 rounded-full"></div>
                                </button>
                            ) : (
                                <button onClick={stopRecording} className="w-20 h-20 rounded-full border-[6px] border-white flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                                    <div className="w-8 h-8 bg-red-600 rounded-lg"></div>
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* VIDEO EDITOR PREVIEW */}
                {videoSrc && !isCameraMode && (
                    <div className="relative h-full aspect-[9/16] bg-black shadow-2xl overflow-hidden group">
                        <video 
                            ref={videoRef}
                            src={videoSrc}
                            className="w-full h-full object-cover"
                            loop
                            onClick={togglePlay}
                        />
                        
                        {/* Overlays Layer */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            {overlays.map(overlay => (
                                <div 
                                    key={overlay.id}
                                    style={{ left: overlay.x + '%', top: overlay.y + '%' }}
                                    className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-move hover:ring-2 ring-white rounded-lg"
                                >
                                    {overlay.type === 'sticker' && <img src={overlay.content} className="w-32 h-32 object-contain drop-shadow-xl" />}
                                </div>
                            ))}
                        </div>

                        {!isPlaying && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20 pointer-events-none">
                                <Play size={64} className="opacity-50" />
                            </div>
                        )}
                        
                        {/* MULTI-TRACK TIMELINE VISUALIZATION */}
                        {stage === 'editor' && (
                            <div className="absolute bottom-4 left-4 right-4 h-32 bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 flex flex-col p-2 gap-1 overflow-hidden animate-fade-up">
                                <div className="flex justify-between px-2 text-[10px] text-gray-400 font-mono">
                                    <span>00:00</span><span>00:15</span><span>00:30</span>
                                </div>
                                <div className="flex-1 relative overflow-hidden space-y-1">
                                    {tracks.map((track, i) => (
                                        <div key={track.id} className="relative h-6 rounded bg-white/5 w-full overflow-hidden">
                                            <div 
                                                className={`absolute top-0 bottom-0 ${track.color} opacity-80 rounded flex items-center px-2 text-[8px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20`}
                                                style={{ left: `${track.start}%`, width: `${track.duration}%` }}
                                            >
                                                {track.name}
                                            </div>
                                        </div>
                                    ))}
                                    {/* Playhead */}
                                    <div className="absolute top-0 bottom-0 w-0.5 bg-white left-[10%] shadow-[0_0_10px_white] z-10"></div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* 2. EDITOR TOOLS SIDEBAR */}
            {stage !== 'upload' && (
                <div className="w-full md:w-1/3 bg-gray-950 border-l border-white/10 flex flex-col h-1/2 md:h-full z-20">
                    
                    {/* Tool Tabs */}
                    <div className="flex border-b border-white/10 overflow-x-auto scrollbar-hide">
                        {[
                            { id: 'director', label: 'IA Director', icon: Sparkles },
                            { id: 'magic', label: 'Montage IA', icon: Scissors },
                            { id: 'stickers', label: 'Stickers', icon: Sticker },
                            { id: 'voice', label: 'Voix IA', icon: Mic },
                            { id: 'subs', label: 'Sous-titres', icon: Type }
                        ].map((tool) => (
                            <button 
                                key={tool.id}
                                onClick={() => setActiveTool(tool.id as any)} 
                                className={`flex-1 min-w-[80px] py-4 text-[10px] font-bold uppercase flex flex-col items-center gap-1.5 transition-colors ${activeTool === tool.id ? 'text-purple-400 bg-white/5 border-b-2 border-purple-400' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                <tool.icon size={18} /> {tool.label}
                            </button>
                        ))}
                    </div>

                    {/* Tool Content Panel */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        
                        {activeTool === 'director' && (
                            <div className="space-y-4">
                                <div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl">
                                    <h3 className="text-purple-300 font-bold mb-2 flex items-center gap-2"><Sparkles size={16} /> Assistant Réalisateur</h3>
                                    <p className="text-xs text-purple-100 mb-4">Je peux améliorer votre vidéo, proposer des idées ou ajouter des effets.</p>
                                    <div className="flex gap-2">
                                        <input 
                                            className="flex-1 bg-black/30 border border-purple-500/30 rounded-lg px-3 py-2 text-sm outline-none focus:border-purple-500"
                                            placeholder="Ex: Ajoute un filtre cinéma..."
                                        />
                                        <button className="p-2 bg-purple-600 rounded-lg hover:bg-purple-500"><Send size={16} /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button className="p-3 bg-gray-800 rounded-xl text-xs font-bold hover:bg-gray-700 text-left">🎵 Musique Tendance</button>
                                    <button className="p-3 bg-gray-800 rounded-xl text-xs font-bold hover:bg-gray-700 text-left">🎨 Étalonnage Auto</button>
                                </div>
                            </div>
                        )}

                        {activeTool === 'voice' && (
                            <div className="space-y-4">
                                <div className="bg-orange-900/20 border border-orange-500/30 p-4 rounded-xl">
                                    <h3 className="text-orange-300 font-bold mb-2 flex items-center gap-2"><Volume2 size={16} /> Générateur Voix Off</h3>
                                    <p className="text-xs text-orange-100 mb-4">Transformez du texte en narration professionnelle.</p>
                                    <textarea 
                                        value={voiceText}
                                        onChange={e => setVoiceText(e.target.value)}
                                        className="w-full bg-black/30 border border-orange-500/30 rounded-lg p-3 text-sm outline-none focus:border-orange-500 h-24 mb-3"
                                        placeholder="Le texte à narrer..."
                                    />
                                    <button 
                                        onClick={handleGenerateVoiceover}
                                        disabled={isGeneratingVoice || !voiceText}
                                        className="w-full py-2 bg-orange-600 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-orange-500"
                                    >
                                        {isGeneratingVoice ? <RefreshCw className="animate-spin" size={14} /> : <AudioWaveform size={14} />}
                                        Générer & Ajouter
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeTool === 'stickers' && (
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-gray-400 uppercase">Générateur de Stickers IA</label>
                                <div className="flex gap-2">
                                    <input 
                                        value={directorPrompt}
                                        onChange={(e) => setDirectorPrompt(e.target.value)}
                                        placeholder="Ex: Chat cyberpunk..."
                                        className="flex-1 bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                                    />
                                    <button 
                                        onClick={handleGenerateSticker}
                                        disabled={isProcessing}
                                        className="p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white shadow-lg hover:scale-105 transition-transform"
                                    >
                                        {isProcessing ? <RefreshCw className="animate-spin" size={20} /> : <Wand2 size={20} />}
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-2 mt-4">
                                    {['🔥', '🚀', '💯', '❤️', '👀', '🎉'].map((emoji, i) => (
                                        <button key={i} className="aspect-square bg-gray-800 rounded-xl flex items-center justify-center text-3xl hover:bg-gray-700 transition-colors">
                                            {emoji}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTool === 'magic' && (
                            <div className="space-y-6 text-center">
                                <div className="p-6 bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl border border-white/10">
                                    <Scissors size={40} className="mx-auto text-purple-400 mb-4" />
                                    <h3 className="font-bold text-lg mb-2">Montage Automatique IA</h3>
                                    <p className="text-xs text-gray-300 mb-6">L'IA analyse vos rushes, coupe les silences, choisit les meilleurs moments et ajoute des transitions.</p>
                                    
                                    <div className="flex gap-2 mb-6 justify-center">
                                        <button onClick={() => setMontageStyle('dynamic')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${montageStyle === 'dynamic' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-purple-500/30 text-purple-300'}`}>Dynamique</button>
                                        <button onClick={() => setMontageStyle('vlog')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${montageStyle === 'vlog' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-purple-500/30 text-purple-300'}`}>Vlog</button>
                                        <button onClick={() => setMontageStyle('cinematic')} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${montageStyle === 'cinematic' ? 'bg-purple-600 border-purple-500 text-white' : 'bg-transparent border-purple-500/30 text-purple-300'}`}>Ciné</button>
                                    </div>

                                    <button 
                                        onClick={handleAutoMontage}
                                        disabled={isProcessing}
                                        className="w-full py-3 bg-white text-purple-900 font-bold rounded-xl shadow-lg hover:bg-gray-100 flex items-center justify-center gap-2"
                                    >
                                        {isProcessing ? <RefreshCw className="animate-spin" /> : <Film />}
                                        Lancer le Montage
                                    </button>
                                </div>
                            </div>
                        )}

                    </div>

                    {/* Publish Footer */}
                    <div className="p-6 border-t border-white/10 bg-gray-900">
                        {stage === 'editor' ? (
                            <button 
                                onClick={handleViralAnalysis}
                                className="w-full py-4 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl font-bold flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform shadow-xl shadow-purple-900/50"
                            >
                                <TrendingUp size={20} /> Suivant
                            </button>
                        ) : (
                            <div className="space-y-4 animate-fade-up">
                                <div className="flex items-center justify-between bg-gray-800 p-3 rounded-xl border border-gray-700">
                                    <span className="text-xs font-bold uppercase text-gray-400">Viral Score</span>
                                    <span className="text-2xl font-black text-green-400">{viralScore}/100</span>
                                </div>
                                
                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase">Catégorie d'Impact</label>
                                    <select
                                        value={selectedCategory}
                                        onChange={(e) => setSelectedCategory(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-500"
                                    >
                                        <option value="learning">🎓 Apprentissage & Masterclass</option>
                                        <option value="expert">⚖️ Conseil Expert Spécialisé</option>
                                        <option value="career">💼 Emploi & Carrière</option>
                                        <option value="project">🚀 Lancement de Projet / Financement</option>
                                        <option value="legal">📜 Juridique & Droit OHADA</option>
                                        <option value="tribe">🔥 Action Communautaire & Tribu</option>
                                        <option value="language">🗣️ Langues & Négociation</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-400 mb-1.5 block uppercase">Passerelle d'Action (Transformer en Action)</label>
                                    <div className="space-y-2">
                                        <select
                                            value={actionType}
                                            onChange={(e) => setActionType(e.target.value as any)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-purple-500"
                                        >
                                            <option value="none">Aucune action directe</option>
                                            <option value="campus">🎓 Rediriger vers un cours sur le Campus</option>
                                            <option value="expert">🤖 Démarrer un parcours avec un Copilote Expert</option>
                                            <option value="career_coach">💼 Audit CV & Simulation Entretien</option>
                                            <option value="project">🚀 Incubation de Projet Diallo OS</option>
                                            <option value="tribe">👥 Rejoindre une Tribu active</option>
                                            <option value="legal_source">⚖️ Article de loi officiel (OHADA, etc.)</option>
                                        </select>
                                        {actionType !== 'none' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <input
                                                    type="text"
                                                    value={actionLabel}
                                                    onChange={(e) => setActionLabel(e.target.value)}
                                                    placeholder="Libellé du bouton"
                                                    className="bg-gray-800 border border-gray-700 rounded-xl p-2 text-xs text-white outline-none"
                                                />
                                                <input
                                                    type="text"
                                                    value={actionTargetTitle}
                                                    onChange={(e) => setActionTargetTitle(e.target.value)}
                                                    placeholder="Titre de la cible"
                                                    className="bg-gray-800 border border-gray-700 rounded-xl p-2 text-xs text-white outline-none"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="text-xs font-bold text-gray-500 mb-2 block">Légende Optimisée</label>
                                    <textarea 
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 text-sm h-20 focus:ring-1 focus:ring-purple-500 outline-none"
                                    />
                                </div>

                                {/* MULTILINGUAL & AFRICAN LANGUAGES ACCESSIBILITY */}
                                <div className="p-3.5 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Languages size={16} className="text-indigo-400" />
                                            <span className="text-xs font-bold text-indigo-200">Accessibilité Multilingue Diallo OS</span>
                                        </div>
                                        <input 
                                            type="checkbox"
                                            checked={enableAfricanLanguages}
                                            onChange={(e) => setEnableAfricanLanguages(e.target.checked)}
                                            className="accent-indigo-500 rounded h-4 w-4"
                                        />
                                    </div>
                                    <p className="text-[10px] text-indigo-300/80 leading-relaxed">
                                        Conserver l'audio original tout en générant automatiquement les sous-titres et doublages en langues africaines (Wolof, Bambara, Lingala, Swahili, Haoussa, Yoruba) + EN/AR.
                                    </p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button onClick={() => setStage('editor')} className="flex-1 py-3 bg-gray-800 rounded-xl font-bold text-sm hover:bg-gray-700">Retour</button>
                                    <button 
                                        onClick={() => {
                                            onPublish({
                                                id: Date.now().toString(),
                                                videoUrl: videoSrc || '',
                                                caption,
                                                hashtags,
                                                viralScore,
                                                aiSuggestions,
                                                category: selectedCategory as any,
                                                actionGateway: actionType !== 'none' ? {
                                                    type: actionType as any,
                                                    label: actionLabel,
                                                    targetTitle: actionTargetTitle
                                                } : undefined
                                            });
                                            onClose();
                                        }}
                                        className="flex-[2] py-3 bg-green-600 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-500 shadow-lg"
                                    >
                                        <CheckCircle size={18} /> Publier le Reel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 3. GUIDED CREATION WIZARD FOR BEGINNERS (6 ÉTAPES) */}
            {isGuidedMode && (
                <div className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-gray-900 border border-purple-500/40 rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 animate-fade-up">
                        {/* Header */}
                        <div className="flex items-center justify-between border-b border-white/10 pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 bg-gradient-to-tr from-purple-600 to-indigo-600 rounded-xl text-white">
                                    <Sparkles size={20} />
                                </div>
                                <div>
                                    <h2 className="text-base font-black text-white">Diallo Studio — Création Guidée</h2>
                                    <p className="text-xs text-purple-300">Étape {guidedStep} sur 6 : {
                                        guidedStep === 1 ? 'Votre Message & Objectif' :
                                        guidedStep === 2 ? 'Votre Format Préféré' :
                                        guidedStep === 3 ? 'Génération du Script IA' :
                                        guidedStep === 4 ? 'Voix & Narration' :
                                        guidedStep === 5 ? 'Passerelle d\'Action' :
                                        'Aperçu & Publication'
                                    }</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsGuidedMode(false)}
                                className="p-2 text-gray-400 hover:text-white rounded-full hover:bg-white/10"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                            <div
                                className="bg-gradient-to-r from-purple-500 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
                                style={{ width: `${(guidedStep / 6) * 100}%` }}
                            />
                        </div>

                        {/* Step 1 */}
                        {guidedStep === 1 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white">Que souhaitez-vous partager ou transmettre ?</h3>
                                <p className="text-xs text-gray-400">Pas besoin d'expérience. Dites-le simplement avec vos propres mots :</p>
                                <textarea
                                    value={guidedTopic}
                                    onChange={(e) => setGuidedTopic(e.target.value)}
                                    placeholder="Ex: Je veux expliquer comment négocier son premier contrat d'exportation en Afrique de l'Ouest..."
                                    className="w-full h-28 bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none"
                                />
                                <div className="flex flex-wrap gap-2">
                                    {['Conseil pratique', 'Opportunité d\'affaires', 'Explication juridique', 'Retour d\'expérience'].map((tag) => (
                                        <button
                                            key={tag}
                                            onClick={() => setGuidedTopic(prev => (prev ? prev + ' • ' + tag : tag))}
                                            className="px-3 py-1 bg-white/5 hover:bg-purple-600/30 border border-white/10 rounded-full text-[11px] text-gray-300"
                                        >
                                            + {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 2 */}
                        {guidedStep === 2 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white">Comment préférez-vous apparaître ?</h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => setGuidedAppearOnScreen(true)}
                                        className={`p-4 rounded-2xl border text-left transition-all ${
                                            guidedAppearOnScreen
                                                ? 'bg-purple-900/30 border-purple-500 text-white shadow-lg'
                                                : 'bg-gray-950 border-gray-800 text-gray-400'
                                        }`}
                                    >
                                        <Camera size={24} className="mb-2 text-purple-400" />
                                        <div className="font-bold text-xs text-white">Face caméra</div>
                                        <div className="text-[10px] text-gray-400 mt-1">Avec prompteur défilant automatique pour lire sans stress.</div>
                                    </button>
                                    <button
                                        onClick={() => setGuidedAppearOnScreen(false)}
                                        className={`p-4 rounded-2xl border text-left transition-all ${
                                            !guidedAppearOnScreen
                                                ? 'bg-purple-900/30 border-purple-500 text-white shadow-lg'
                                                : 'bg-gray-950 border-gray-800 text-gray-400'
                                        }`}
                                    >
                                        <Wand2 size={24} className="mb-2 text-pink-400" />
                                        <div className="font-bold text-xs text-white">Visuels + Voix Off</div>
                                        <div className="text-[10px] text-gray-400 mt-1">Diallo assemble des images pertinentes avec narration.</div>
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step 3 */}
                        {guidedStep === 3 && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-bold text-white">Script Structuré par l'IA Diallo</h3>
                                    <button
                                        onClick={async () => {
                                            if (!guidedTopic) return;
                                            setIsGeneratingScript(true);
                                            try {
                                                const res = await generateText(
                                                    `Crée un script court percutant de 30 secondes pour un Reel d'impact sur : "${guidedTopic}".
                                                    Structure : 1. Accroche directe (3s), 2. Le point clé actionnable (20s), 3. Appel à l'action claire (7s).`
                                                );
                                                setGuidedAiDraft(res || '');
                                            } catch (err) {
                                                setGuidedAiDraft(`Accroche : Saviez-vous que 80% des démarches échouent par manque de méthode claire ?\n\nConseil : Pour réussir, appliquez la règle des 3 étapes simples dès aujourd'hui.\n\nAction : Cliquez sur le bouton ci-dessous pour démarrer.`);
                                            } finally {
                                                setIsGeneratingScript(false);
                                            }
                                        }}
                                        className="text-xs text-purple-400 hover:text-purple-300 font-bold flex items-center gap-1"
                                    >
                                        <RefreshCw size={12} className={isGeneratingScript ? 'animate-spin' : ''} />
                                        {guidedAiDraft ? 'Régénérer' : 'Générer automatiquement'}
                                    </button>
                                </div>
                                <textarea
                                    value={guidedAiDraft || (guidedTopic ? `Voici votre message : ${guidedTopic}\n\n1. L'Accroche : Pourquoi ce sujet est crucial.\n2. Le Point Clé : L'explication étape par étape.\n3. L'Action : Ce que le spectateur doit faire maintenant.` : '')}
                                    onChange={(e) => setGuidedAiDraft(e.target.value)}
                                    placeholder="Cliquez sur 'Générer automatiquement'..."
                                    className="w-full h-32 bg-gray-950 border border-gray-800 rounded-2xl p-4 text-xs text-white placeholder-gray-600 focus:border-purple-500 outline-none leading-relaxed"
                                />
                            </div>
                        )}

                        {/* Step 4 */}
                        {guidedStep === 4 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white">Voix & Accessibilité Langues</h3>
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            onClick={() => setGuidedVoiceType('ai_narration')}
                                            className={`p-3 rounded-xl border text-left text-xs font-bold ${
                                                guidedVoiceType === 'ai_narration' ? 'bg-indigo-900/40 border-indigo-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400'
                                            }`}
                                        >
                                            <Sparkles size={16} className="mb-1 text-indigo-400" />
                                            Voix Off IA HD
                                        </button>
                                        <button
                                            onClick={() => setGuidedVoiceType('my_voice')}
                                            className={`p-3 rounded-xl border text-left text-xs font-bold ${
                                                guidedVoiceType === 'my_voice' ? 'bg-indigo-900/40 border-indigo-500 text-white' : 'bg-gray-950 border-gray-800 text-gray-400'
                                            }`}
                                        >
                                            <Mic size={16} className="mb-1 text-indigo-400" />
                                            Mon propre enregistrement
                                        </button>
                                    </div>

                                    <div className="p-3 bg-purple-950/30 border border-purple-500/30 rounded-xl text-xs space-y-1">
                                        <div className="font-bold text-purple-200 flex items-center gap-1.5">
                                            <Languages size={14} /> Traduction & Sous-titres automatiques
                                        </div>
                                        <p className="text-[11px] text-purple-300/80">
                                            Votre contenu sera automatiquement sous-titré et audible en Wolof, Bambara, Lingala, Swahili, Haoussa, Yoruba, Français et Anglais.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 5 */}
                        {guidedStep === 5 && (
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-white">Où orienter les spectateurs intéressés ?</h3>
                                <p className="text-xs text-gray-400">Chaque Reel Mok doit permettre au spectateur de passer à l'action :</p>
                                <div className="space-y-2">
                                    {[
                                        { type: 'campus', title: '🎓 Suivre un cours certifiant sur le Campus Mok', desc: 'Permet d\'apprendre et valider les compétences' },
                                        { type: 'expert', title: '🤖 Démarrer un parcours avec un Copilote Expert', desc: 'Conseil personnalisé immédiat' },
                                        { type: 'tribe', title: '👥 Rejoindre la Tribu dédiée', desc: 'Échanger avec une communauté active' },
                                        { type: 'career_coach', title: '💼 Préparer un entretien / Coaching', desc: 'Simulations et révision de CV' }
                                    ].map((opt) => (
                                        <button
                                            key={opt.type}
                                            onClick={() => {
                                                setActionType(opt.type as any);
                                                setActionLabel(opt.title.split(' ')[1] + ' Immédiat');
                                                setActionTargetTitle(opt.title);
                                            }}
                                            className={`w-full p-3 rounded-2xl border text-left transition-all ${
                                                actionType === opt.type
                                                    ? 'bg-purple-900/30 border-purple-500 text-white shadow-lg'
                                                    : 'bg-gray-950 border-gray-800 text-gray-400 hover:border-gray-700'
                                            }`}
                                        >
                                            <div className="font-bold text-xs text-white">{opt.title}</div>
                                            <div className="text-[10px] text-gray-400">{opt.desc}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 6 */}
                        {guidedStep === 6 && (
                            <div className="space-y-4">
                                <div className="p-4 bg-gray-950 border border-emerald-500/30 rounded-2xl space-y-3">
                                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                                        <CheckCircle size={16} /> Prêt pour publication
                                    </div>
                                    <div className="text-xs text-white font-semibold">
                                        {guidedTopic || 'Votre Reel d\'impact Diallo OS'}
                                    </div>
                                    <div className="text-[11px] text-gray-400 leading-relaxed bg-gray-900 p-2.5 rounded-xl border border-gray-800">
                                        {guidedAiDraft || 'Script optimisé avec appel à l\'action vers ' + actionTargetTitle}
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] text-purple-300">
                                        <Sparkles size={12} /> Passerelle configurée : <span className="font-bold text-white">{actionTargetTitle}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step Navigation Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-white/10">
                            {guidedStep > 1 ? (
                                <button
                                    onClick={() => setGuidedStep(prev => prev - 1)}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold"
                                >
                                    Précédent
                                </button>
                            ) : (
                                <div />
                            )}

                            {guidedStep < 6 ? (
                                <button
                                    onClick={() => setGuidedStep(prev => prev + 1)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white rounded-xl text-xs font-black shadow-lg"
                                >
                                    Étape Suivante →
                                </button>
                            ) : (
                                <button
                                    onClick={() => {
                                        onPublish({
                                            id: Date.now().toString(),
                                            videoUrl: videoSrc || 'https://assets.mixkit.co/videos/preview/mixkit-business-people-meeting-in-an-office-42861-large.mp4',
                                            caption: guidedTopic || 'Nouvelle opportunité & méthode par Diallo Studio',
                                            hashtags: ['#MokStudio', '#Impact', '#DialloOS'],
                                            viralScore: 92,
                                            aiSuggestions: ['Publier le matin pour maximiser l\'impact'],
                                            category: selectedCategory as any,
                                            actionGateway: {
                                                type: actionType !== 'none' ? actionType as any : 'campus',
                                                label: actionLabel || 'Passer à l\'action',
                                                targetTitle: actionTargetTitle || 'Formation et Action Immédiate'
                                            }
                                        });
                                        setIsGuidedMode(false);
                                        onClose();
                                    }}
                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg flex items-center gap-1.5"
                                >
                                    <CheckCircle size={14} /> Publier Maintenant
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
