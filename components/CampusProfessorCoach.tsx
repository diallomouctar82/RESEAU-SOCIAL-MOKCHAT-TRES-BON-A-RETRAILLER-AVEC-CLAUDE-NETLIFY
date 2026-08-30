// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS PROFESSOR 3D VIEW & MULTIMODAL COACH — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Coach interactif et pédagogique (Professeur Diallo) :
// - Dialogue vocal bidirectionnel (micro & synthèse vocale)
// - Caméra vidéo interactive avec reconnaissance d'objets, mouvement et OCR
// - Partage et analyse de documents, devoirs, exercices et fiches de cours
// - Reformulation "Explique-moi autrement" (4 modes cognitifs)
// - Suivi des compétences et accompagnement bienveillant

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    BrainCircuit, 
    Volume2, 
    VolumeX, 
    Send, 
    Sparkles, 
    HelpCircle, 
    RefreshCw, 
    CheckCircle2, 
    BookOpen, 
    MessageSquare,
    Maximize2,
    Minimize2,
    Sliders,
    Mic,
    MicOff,
    Camera,
    CameraOff,
    Paperclip,
    FileText,
    Image as ImageIcon,
    X,
    Eye,
    Activity,
    Scan,
    FlipHorizontal,
    FileCheck,
    Upload,
    Check,
    Radio,
    Headphones,
    Waves,
    GraduationCap,
    Lightbulb,
    ListOrdered,
    MapPin,
    Languages
} from 'lucide-react';
import { Avatar3D } from './Avatar3D';
import { VoiceSettingsModal } from './VoiceSettingsModal';
import { 
    StudentPedagogicalProfile, 
    LearningStylePreference 
} from '../types';
import { campusPedagogicalEngine } from '../services/campusPedagogicalEngine';
import { voiceEngine } from '../services/voiceEngine';
import { multimodalVisionService } from '../services/multimodalVision';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';

interface CampusProfessorCoachProps {
    profile: StudentPedagogicalProfile;
    currentSubjectName?: string;
    currentLessonTitle?: string;
    onApplyInsight?: (insight: string) => void;
}

interface AttachedDocument {
    name: string;
    type: string;
    dataUrl: string;
    sizeKb: number;
}

interface DetectedVisualEntity {
    label: string;
    confidence: number;
    box: { x: number; y: number; w: number; h: number };
    category: 'cahier' | 'livre' | 'calculatrice' | 'feuille_examen' | 'personne' | 'objet';
}

export const CampusProfessorCoach: React.FC<CampusProfessorCoachProps> = ({
    profile,
    currentSubjectName = "Mathématiques Approfondies",
    currentLessonTitle = "Limites & Continuité",
    onApplyInsight
}) => {
    // États de l'Avatar et de la Synthèse Vocale
    const [avatarState, setAvatarState] = useState<'idle' | 'speaking' | 'thinking' | 'routine'>('idle');
    const [audioEnabled, setAudioEnabled] = useState(true); // Voix active par défaut pour immersion
    const [isConversationalMode, setIsConversationalMode] = useState(false);
    const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
    const [currentVoiceId, setCurrentVoiceId] = useState<string>(() => voiceEngine.getVoiceIdForAgent('professor'));

    // Messages du Chat
    const [messages, setMessages] = useState<{ 
        role: 'user' | 'model'; 
        text: string; 
        timestamp: string;
        attachment?: { type: 'image' | 'doc'; name: string; url?: string };
        detectedObjects?: string[];
    }[]>([
        {
            role: 'model',
            text: `Bonjour ! Je suis le Professeur Diallo. Nous étudions ensemble selon le programme officiel de **${profile.selectedCountryName}** (${profile.selectedLevelName}).\n\nVous pouvez me poser vos questions à l'écrit, me **parler au micro**, activer la **caméra pour me montrer votre exercice** ou **partager un document**. Que souhaitez-vous approfondir aujourd'hui ?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);

    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExplainingOtherwise, setIsExplainingOtherwise] = useState(false);

    // Mode d'Affichage Multimodal : Avatar 3D vs Caméra Live
    const [viewMode, setViewMode] = useState<'avatar' | 'camera'>('avatar');
    
    // États Caméra & Reconnaissance d'Objets / Mouvements
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [motionLevel, setMotionLevel] = useState<number>(0);
    const [detectedEntities, setDetectedEntities] = useState<DetectedVisualEntity[]>([]);
    const [isScanningVisual, setIsScanningVisual] = useState(false);
    const [autoScanEnabled, setAutoScanEnabled] = useState(false);

    // Documents & Fichiers Partagés
    const [attachedDoc, setAttachedDoc] = useState<AttachedDocument | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const chatBottomRef = useRef<HTMLDivElement>(null);

    // Ref pour éviter les fermetures lexicales périmées dans les listeners audio
    const isConversationalModeRef = useRef(isConversationalMode);
    isConversationalModeRef.current = isConversationalMode;

    const isGeneratingRef = useRef(isGenerating);
    isGeneratingRef.current = isGenerating;

    // 1. Moteur vocal partagé (hook centralisé unique au-dessus de voiceEngine.ts —
    // remplace l'ancien câblage manuel de voiceEngine.addListener ci-dessus ;
    // comportement strictement identique : même micro, même synthèse, même turn-taking).
    const {
        isListening,
        isSpeaking,
        volume: speechVolume,
        conversationalTurn,
        error: voiceError,
        startListening,
        stopListening,
        speak,
        stopSpeaking,
        setConversationalMode,
    } = useVoiceAssistant({
        lang: 'fr-FR',
        voiceId: currentVoiceId,
        onFinalTranscript: (transcript) => {
            setInputText(transcript);
            if (isConversationalModeRef.current && transcript.trim() && !isGeneratingRef.current) {
                handleSendMessage(transcript.trim());
            }
        },
        onInterimTranscript: (transcript) => {
            setInputText(transcript);
        },
    });

    // Avis micro (reproduit le console.warn auparavant émis par le onError câblé à la main)
    useEffect(() => {
        if (voiceError) {
            console.warn("Avis micro Campus:", voiceError);
        }
    }, [voiceError]);

    // Pilotage de l'avatar selon l'état de synthèse vocale (ex onSpeakingStateChange)
    useEffect(() => {
        if (isSpeaking) {
            setAvatarState('speaking');
        } else if (!isGeneratingRef.current) {
            setAvatarState('idle');
        }
    }, [isSpeaking]);

    // Pilotage de l'avatar selon le tour conversationnel (ex onConversationalTurnChange)
    useEffect(() => {
        if (conversationalTurn === 'ai_thinking') {
            setAvatarState('thinking');
        }
    }, [conversationalTurn]);

    // Nettoyage à la désactivation du coach (identique à l'ancien useEffect)
    useEffect(() => {
        return () => {
            stopListening();
            stopSpeaking();
            setConversationalMode(false);
        };
    }, [stopListening, stopSpeaking, setConversationalMode]);

    const toggleListening = async () => {
        if (isListening) {
            stopListening();
        } else {
            // Arrêter toute synthèse en cours si l'utilisateur prend la parole (barge-in)
            stopSpeaking();
            const success = await startListening('fr-FR');
            if (!success) {
                alert("Impossible d'accéder au microphone. Veuillez autoriser l'accès au micro dans votre navigateur.");
            }
        }
    };

    const toggleConversationalMode = async () => {
        const nextState = !isConversationalMode;
        setIsConversationalMode(nextState);
        setConversationalMode(nextState);

        if (nextState) {
            setAudioEnabled(true);
            stopSpeaking();
            await startListening('fr-FR');
        } else {
            stopListening();
        }
    };

    // Scroll automatique vers le bas du chat
    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isGenerating]);

    // 2. Gestion de la Caméra et Détection d'Objets / Mouvement
    const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
        setCameraError(null);
        try {
            if (cameraStream) {
                cameraStream.getTracks().forEach(t => t.stop());
            }

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraStream(stream);
            setIsCameraActive(true);
            setCameraFacing(facing);
            setViewMode('camera');
        } catch (err: any) {
            console.error("Accès caméra refusé ou indisponible:", err);
            setCameraError("Impossible d'accéder à la caméra. Mode simulé pédagogique activé.");
            setIsCameraActive(true);
            setViewMode('camera');
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(t => t.stop());
            setCameraStream(null);
        }
        setIsCameraActive(false);
        setViewMode('avatar');
    };

    const toggleCameraFacing = () => {
        const nextFacing = cameraFacing === 'user' ? 'environment' : 'user';
        startCamera(nextFacing);
    };

    // Boucle d'analyse optique temps réel (mouvement et objets de travail)
    useEffect(() => {
        let animFrameId: number;

        const processVideoFrame = () => {
            if (isCameraActive && videoRef.current && canvasOverlayRef.current) {
                const video = videoRef.current;
                const canvas = canvasOverlayRef.current;
                
                if (video.readyState >= 2) {
                    canvas.width = video.videoWidth || 640;
                    canvas.height = video.videoHeight || 480;
                    const ctx = canvas.getContext('2d');
                    
                    if (ctx) {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        // Détection de mouvement optique
                        const motion = multimodalVisionService.detectMotion(video);
                        setMotionLevel(motion.motionLevel);

                        // Dessiner les zones de mouvement (BoundingBox exprimée en 0-1000e du cadre)
                        if (motion.hasMotion && motion.activeZones.length > 0) {
                            ctx.strokeStyle = 'rgba(16, 185, 129, 0.6)';
                            ctx.lineWidth = 2;
                            motion.activeZones.forEach(z => {
                                const zx = (z.xmin / 1000) * canvas.width;
                                const zy = (z.ymin / 1000) * canvas.height;
                                const zw = ((z.xmax - z.xmin) / 1000) * canvas.width;
                                const zh = ((z.ymax - z.ymin) / 1000) * canvas.height;
                                ctx.strokeRect(zx, zy, zw, zh);
                            });
                        }

                        // Dessiner les boîtes des objets détectés
                        detectedEntities.forEach(ent => {
                            const bx = ent.box.x * canvas.width;
                            const by = ent.box.y * canvas.height;
                            const bw = ent.box.w * canvas.width;
                            const bh = ent.box.h * canvas.height;

                            ctx.strokeStyle = ent.category === 'cahier' || ent.category === 'feuille_examen' ? '#10B981' : '#3B82F6';
                            ctx.lineWidth = 2;
                            ctx.strokeRect(bx, by, bw, bh);

                            ctx.fillStyle = ent.category === 'cahier' || ent.category === 'feuille_examen' ? '#10B981' : '#3B82F6';
                            ctx.fillRect(bx, by - 22, bw, 22);

                            ctx.fillStyle = '#ffffff';
                            ctx.font = 'bold 12px Inter, sans-serif';
                            ctx.fillText(`${ent.label} (${Math.round(ent.confidence * 100)}%)`, bx + 6, by - 6);
                        });
                    }
                }
            }
            animFrameId = requestAnimationFrame(processVideoFrame);
        };

        if (isCameraActive) {
            animFrameId = requestAnimationFrame(processVideoFrame);
        }

        return () => {
            if (animFrameId) cancelAnimationFrame(animFrameId);
        };
    }, [isCameraActive, detectedEntities]);

    // Déclencheur du Scan Visuel (Snapshot + Analyse Pédagogique par Professeur Diallo)
    const handleScanAndAnalyze = async () => {
        if (!videoRef.current && !cameraError) return;
        setIsScanningVisual(true);
        setAvatarState('thinking');

        try {
            let snapshotBase64 = '';
            if (videoRef.current) {
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = videoRef.current.videoWidth || 640;
                tempCanvas.height = videoRef.current.videoHeight || 480;
                const ctx = tempCanvas.getContext('2d');
                if (ctx) {
                    ctx.drawImage(videoRef.current, 0, 0);
                    snapshotBase64 = tempCanvas.toDataURL('image/jpeg', 0.85);
                }
            }

            // Message utilisateur avec snapshot (l'analyse réelle du contenu est faite par
            // Professeur Diallo ci-dessous via l'IA multimodale — aucune détection d'objets
            // n'est simulée ici pour ne jamais afficher un résultat de vision inventé)
            const userMsg = "Professeur Diallo, pouvez-vous analyser ce que je vous montre à la caméra ?";
            setMessages(prev => [
                ...prev,
                {
                    role: 'user',
                    text: userMsg,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    attachment: snapshotBase64 ? { type: 'image', name: 'Capture Caméra • Exercice en cours', url: snapshotBase64 } : undefined
                }
            ]);

            // Analyse multimodale par Professeur Diallo
            const analysis = await campusPedagogicalEngine.analyzeHomeworkOrDocument(
                snapshotBase64 || "Exercice de mathématiques capturé à la caméra",
                "image/jpeg",
                userMsg,
                currentSubjectName,
                profile.selectedCountryName,
                profile.selectedLevelName,
                profile.learningStyle
            );

            setAvatarState('speaking');
            setMessages(prev => [
                ...prev,
                {
                    role: 'model',
                    text: `🔍 **Analyse Visuelle Caméra • ${currentSubjectName}**\n\n${analysis.textExplanation}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);

            if (audioEnabled) {
                speak(analysis.textExplanation, {
                    voiceId: currentVoiceId,
                    onStart: () => setAvatarState('speaking'),
                    onEnd: () => {
                        setAvatarState('idle');
                        if (isConversationalModeRef.current) {
                            startListening('fr-FR');
                        }
                    }
                });
            } else {
                setTimeout(() => setAvatarState('idle'), 2500);
            }
        } catch (e) {
            console.error("Erreur scan visuel:", e);
            setAvatarState('idle');
        } finally {
            setIsScanningVisual(false);
        }
    };

    // 3. Gestion du Partage de Documents (Fichiers, PDF, Photos)
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            processSelectedFile(file);
        }
    };

    const processSelectedFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setAttachedDoc({
                name: file.name,
                type: file.type,
                dataUrl: dataUrl,
                sizeKb: Math.round(file.size / 1024)
            });
        };
        reader.readAsDataURL(file);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) {
            processSelectedFile(file);
        }
    };

    const removeAttachedDoc = () => {
        setAttachedDoc(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // 4. Envoi du Message (Texte + Audio + Document joint)
    const handleSendMessage = async (textToSend?: string) => {
        const query = textToSend || inputText;
        const currentDoc = attachedDoc;

        if ((!query.trim() && !currentDoc) || isGenerating) return;

        setInputText('');
        setAttachedDoc(null);
        if (fileInputRef.current) fileInputRef.current.value = '';

        // Si l'utilisateur parle ou écrit, on interrompt toute lecture en cours pour réactivité immédiate (barge-in)
        stopSpeaking();

        // Message de l'élève
        setMessages(prev => [
            ...prev,
            {
                role: 'user',
                text: query || (currentDoc ? `Voici mon document : ${currentDoc.name}` : ''),
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                attachment: currentDoc ? {
                    type: currentDoc.type.startsWith('image/') ? 'image' : 'doc',
                    name: currentDoc.name,
                    url: currentDoc.dataUrl
                } : undefined
            }
        ]);

        setIsGenerating(true);
        setAvatarState('thinking');

        try {
            let explanation = '';

            if (currentDoc) {
                // Analyse d'un document ou exercice joint
                const analysis = await campusPedagogicalEngine.analyzeHomeworkOrDocument(
                    currentDoc.dataUrl,
                    currentDoc.type,
                    query,
                    currentSubjectName,
                    profile.selectedCountryName,
                    profile.selectedLevelName,
                    profile.learningStyle
                );
                explanation = `📄 **Analyse de votre document (${currentDoc.name}) :**\n\n${analysis.textExplanation}`;
            } else {
                // Explication de cours ordinaire adaptée
                explanation = await campusPedagogicalEngine.explainConceptAdapted(
                    query,
                    currentSubjectName,
                    profile.selectedCountryName,
                    profile.selectedLevelName,
                    profile.learningStyle
                );
            }

            setAvatarState('speaking');
            setMessages(prev => [
                ...prev,
                {
                    role: 'model',
                    text: explanation,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);

            if (audioEnabled) {
                speak(explanation, {
                    voiceId: currentVoiceId,
                    onStart: () => setAvatarState('speaking'),
                    onEnd: () => {
                        setAvatarState('idle');
                        if (isConversationalModeRef.current) {
                            // Relance l'écoute pour le tour de l'utilisateur
                            startListening('fr-FR');
                        }
                    }
                });
            } else {
                setTimeout(() => {
                    setAvatarState('idle');
                }, 2500);
            }

        } catch (e) {
            setAvatarState('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    // 5. Reformulation "Explique-moi autrement"
    const handleExplainOtherwise = async (mode: 'analogie_simple' | 'decoupage_etapes' | 'exemple_terrain' | 'langage_facile_sans_jargon') => {
        if (isGenerating) return;
        setIsExplainingOtherwise(true);
        setAvatarState('thinking');
        stopSpeaking();

        const lastModelMsg = [...messages].reverse().find(m => m.role === 'model')?.text || currentLessonTitle;

        try {
            const alternative = await campusPedagogicalEngine.explainOtherwise(
                currentLessonTitle,
                currentSubjectName,
                lastModelMsg,
                mode
            );

            setAvatarState('speaking');
            setMessages(prev => [
                ...prev,
                {
                    role: 'model',
                    text: `✨ **Reformulation (${mode.replace(/_/g, ' ')}) :**\n\n${alternative}`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);

            if (audioEnabled) {
                speak(alternative, {
                    voiceId: currentVoiceId,
                    onStart: () => setAvatarState('speaking'),
                    onEnd: () => {
                        setAvatarState('idle');
                        if (isConversationalModeRef.current) {
                            startListening('fr-FR');
                        }
                    }
                });
            } else {
                setTimeout(() => setAvatarState('idle'), 2500);
            }
        } catch (e) {
            setAvatarState('idle');
        } finally {
            setIsExplainingOtherwise(false);
        }
    };

    return (
        <div 
            className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[700px] transition-all"
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
        >
            {/* Header Coach avec Actions Multimodales Complètes */}
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                        <GraduationCap size={20} />
                    </div>
                    <div>
                        <div className="font-bold text-sm flex items-center gap-2">
                            Professeur Diallo
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                            Programme {profile.selectedCountryName} • {profile.selectedLevelName}
                        </div>
                    </div>
                </div>

                {/* Boutons d'Action Multimodaux */}
                <div className="flex items-center gap-2">
                    {/* Mode Conversationnel Continu (Mains Libres / Fluidité Totale) */}
                    <button
                        onClick={toggleConversationalMode}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                            isConversationalMode 
                                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/30 font-black animate-pulse' 
                                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                        }`}
                        title={isConversationalMode ? "Désactiver le mode mains libres" : "Activer le dialogue vocal fluide continu (sans clic)"}
                    >
                        <Radio size={14} className={isConversationalMode ? 'animate-spin' : ''} />
                        <span className="text-[11px]">{isConversationalMode ? 'Mains Libres : ACTIF' : 'Mode Dialogue Continu'}</span>
                    </button>

                    {/* Bascule Mode Caméra Live / Avatar 3D */}
                    {isCameraActive ? (
                        <button
                            onClick={stopCamera}
                            aria-label="Arrêter la caméra"
                            className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 hover:bg-rose-500/30 transition-all min-h-[36px]"
                            title="Arrêter la caméra"
                        >
                            <CameraOff size={14} />
                            <span className="hidden sm:inline">Quitter Caméra</span>
                        </button>
                    ) : (
                        <button
                            onClick={() => startCamera('user')}
                            aria-label="Activer la caméra pour montrer un exercice ou un objet"
                            className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 hover:bg-slate-700 hover:text-white transition-all min-h-[36px]"
                            title="Activer la caméra pour montrer un exercice ou un objet"
                        >
                            <Camera size={14} />
                            <span className="hidden sm:inline">Caméra</span>
                        </button>
                    )}

                    {/* Microphone Vocal Manuel */}
                    <button
                        onClick={toggleListening}
                        aria-label={isListening ? "Arrêter l'écoute vocale" : "Parler au Professeur Diallo (Vocal)"}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                            isListening
                                ? 'bg-rose-500 text-white animate-pulse shadow-lg shadow-rose-500/30'
                                : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
                        }`}
                        title={isListening ? "Arrêter l'écoute vocale" : "Parler au Professeur Diallo (Vocal)"}
                    >
                        {isListening ? <Mic size={16} className="animate-bounce" /> : <MicOff size={16} />}
                    </button>

                    {/* Synthèse Vocale Lecture */}
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        aria-label={audioEnabled ? 'Synthèse vocale activée' : 'Activer la voix de Professeur Diallo'}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all ${
                            audioEnabled ? 'bg-emerald-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={audioEnabled ? 'Synthèse vocale activée' : 'Activer la voix de Professeur Diallo'}
                    >
                        {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>

                    {/* Paramètres Voix ElevenLabs HD */}
                    <button
                        onClick={() => setIsVoiceSettingsOpen(true)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 hover:border-amber-400 flex items-center gap-1 shadow-xs"
                        title="Configurer la voix haute fidélité ElevenLabs du Professeur Diallo"
                    >
                        <Headphones size={14} className="text-amber-400" />
                        <span className="hidden lg:inline text-[10px]">Voix HD</span>
                    </button>
                </div>
            </div>

            {/* Zone Principale : Split Gauche (Avatar/Caméra) + Droite (Chat & Documents) */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50 relative">
                
                {/* Overlay Glisser-Déposer de Fichiers */}
                {isDragging && (
                    <div className="absolute inset-0 z-50 bg-emerald-900/80 backdrop-blur-sm flex flex-col items-center justify-center text-white border-4 border-dashed border-emerald-400 m-2 rounded-2xl animate-fade-in">
                        <Upload size={48} className="animate-bounce mb-3 text-emerald-300" />
                        <div className="text-lg font-bold">Déposez votre document ou exercice ici</div>
                        <div className="text-xs text-emerald-200 mt-1">Professeur Diallo analysera le contenu et vous guidera pas à pas</div>
                    </div>
                )}

                {/* Panneau Latéral Gauche : Avatar 3D OU Caméra Vidéo avec Reconnaissance */}
                <div className="w-full md:w-72 bg-slate-900 p-4 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-slate-800 shrink-0">
                    
                    {/* Vue 1 : Caméra Vidéo Live avec HUD Reconnaissance d'Objets & Mouvements */}
                    {isCameraActive ? (
                        <div className="w-full flex-1 flex flex-col items-center justify-between">
                            <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-inner relative group">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className="w-full h-full object-cover"
                                />
                                <canvas
                                    ref={canvasOverlayRef}
                                    className="absolute inset-0 w-full h-full pointer-events-none"
                                />

                                {/* Badge Mouvement Live */}
                                <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700 text-[10px] text-emerald-400 font-bold flex items-center gap-1.5">
                                    <Activity size={10} className={motionLevel > 15 ? 'animate-spin text-emerald-400' : 'text-slate-500'} />
                                    <span>Mouv: {motionLevel}%</span>
                                </div>

                                {/* Switch Caméra */}
                                <button
                                    onClick={toggleCameraFacing}
                                    aria-label="Retourner la caméra"
                                    className="absolute top-2 right-2 p-2.5 rounded-lg bg-slate-900/80 hover:bg-slate-800 text-white transition-all text-[10px]"
                                    title="Retourner la caméra"
                                >
                                    <FlipHorizontal size={12} />
                                </button>
                            </div>

                            {/* Barre de Scan et d'Analyse d'Objets */}
                            <div className="w-full mt-3 space-y-2">
                                <button
                                    onClick={handleScanAndAnalyze}
                                    disabled={isScanningVisual}
                                    className="w-full py-2 px-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
                                >
                                    <Scan size={14} className={isScanningVisual ? 'animate-spin' : ''} />
                                    <span>{isScanningVisual ? 'Analyse en cours...' : 'Scanner mon exercice'}</span>
                                </button>

                                <div className="p-2 bg-slate-800/80 rounded-xl border border-slate-700 text-[10px] text-slate-300 space-y-1">
                                    <div className="font-bold text-emerald-400 flex items-center gap-1">
                                        <Eye size={10} /> Reconnaissance Active
                                    </div>
                                    <div className="text-slate-400">
                                        Pointez votre cahier, tableau ou feuille vers la caméra pour une analyse instantanée.
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* Vue 2 : Avatar 3D Professeur Diallo avec Radar Acoustique */
                        <div className="w-full flex-1 flex flex-col items-center justify-between">
                            <div className="w-44 h-44 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-inner relative flex items-center justify-center">
                                <Avatar3D 
                                    avatarId="agent-campus"
                                    state={avatarState}
                                    showHud={false}
                                    className="w-full h-full object-cover"
                                />
                                
                                {isListening && (
                                    <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 bg-rose-500/90 backdrop-blur-md rounded-xl text-[10px] text-white font-bold flex items-center justify-between shadow-lg">
                                        <span className="flex items-center gap-1.5">
                                            <Mic size={12} className="animate-bounce" /> Écoute...
                                        </span>
                                        <div className="flex items-center gap-0.5 h-3">
                                            {[...Array(5)].map((_, i) => (
                                                <div 
                                                    key={i} 
                                                    className="w-1 bg-white rounded-full transition-all duration-75"
                                                    style={{ height: `${Math.max(3, Math.min(12, (speechVolume * 15) * (i + 1) * 0.25))}px` }}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                            
                            {/* Indicateur de Statut de Dialogue */}
                            <div className="mt-3 text-center w-full">
                                {isConversationalMode ? (
                                    <div className="px-3 py-1.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1.5">
                                        <Waves size={13} className="animate-pulse text-emerald-400" />
                                        <span>
                                            {conversationalTurn === 'user_speaking' ? 'Vous parlez...' :
                                             conversationalTurn === 'ai_thinking' ? 'Professeur Diallo réfléchit...' :
                                             conversationalTurn === 'ai_speaking' ? 'Professeur Diallo s\'exprime...' :
                                             'À vous la parole (Mains libres)'}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 py-1 bg-slate-800 rounded-full border border-slate-700 inline-flex items-center gap-1.5">
                                        {avatarState === 'speaking' ? (<><Volume2 size={11} className="text-emerald-400" /> Enseigne...</>) : avatarState === 'thinking' ? (<><BrainCircuit size={11} className="text-indigo-400" /> Réfléchit...</>) : (<><Mic size={11} /> En attente</>)}
                                    </span>
                                )}
                            </div>

                            <div className="mt-3 w-full bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-[11px] text-slate-300">
                                <div className="font-bold text-emerald-400 mb-0.5 flex items-center gap-1 text-[10px]">
                                    <Sparkles size={11} /> Style Pédagogique
                                </div>
                                <div className="capitalize font-medium text-xs text-white">
                                    {profile.learningStyle.replace(/_/g, ' ')}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Panneau Droit : Discussion, Pièces Jointes & Saisie */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
                    
                    {/* Zone de Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => (
                            <div
                                key={idx}
                                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                            >
                                <div className={`max-w-[85%] p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-slate-900 text-white rounded-tr-none' 
                                        : 'bg-slate-100 text-slate-800 rounded-tl-none border border-slate-200'
                                }`}>
                                    {/* Aperçu Pièce Jointe Image / Document */}
                                    {msg.attachment && (
                                        <div className="mb-3 p-2 bg-slate-950/20 rounded-xl border border-slate-300/30 overflow-hidden">
                                            {msg.attachment.type === 'image' && msg.attachment.url ? (
                                                <div className="space-y-1.5">
                                                    <img 
                                                        src={msg.attachment.url} 
                                                        alt={msg.attachment.name}
                                                        className="max-h-48 rounded-lg object-contain bg-slate-900/50 w-full" 
                                                    />
                                                    <div className="text-[11px] font-bold opacity-80 flex items-center gap-1">
                                                        <ImageIcon size={12} /> {msg.attachment.name}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 p-2 bg-slate-800 text-white rounded-lg text-xs font-bold">
                                                    <FileText size={16} className="text-emerald-400" />
                                                    <span className="truncate">{msg.attachment.name}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Badges d'Objets Visuels Détectés */}
                                    {msg.detectedObjects && msg.detectedObjects.length > 0 && (
                                        <div className="mb-2 flex flex-wrap gap-1">
                                            {msg.detectedObjects.map((obj, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md text-[10px] font-bold">
                                                    🏷️ {obj}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="prose prose-slate prose-sm max-w-none whitespace-pre-wrap">
                                        {msg.text}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                            </div>
                        ))}

                        {isGenerating && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 p-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce [animation-delay:0.4s]"></div>
                                <span className="text-slate-600 font-medium">Professeur Diallo rédige une explication détaillée...</span>
                            </div>
                        )}

                        <div ref={chatBottomRef} />
                    </div>

                    {/* Barre d'outils "Explique-moi autrement" */}
                    <div className="px-4 py-2 bg-emerald-50/60 border-t border-emerald-100 flex items-center justify-between gap-2 overflow-x-auto">
                        <span className="text-[11px] font-bold text-emerald-900 shrink-0 flex items-center gap-1">
                            <HelpCircle size={14} className="text-emerald-600" /> Pas tout à fait clair ?
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => handleExplainOtherwise('analogie_simple')}
                                disabled={isGenerating || isExplainingOtherwise}
                                className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                <Lightbulb size={11} /> Analogie simple
                            </button>
                            <button
                                onClick={() => handleExplainOtherwise('decoupage_etapes')}
                                disabled={isGenerating || isExplainingOtherwise}
                                className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                <ListOrdered size={11} /> Étape par étape
                            </button>
                            <button
                                onClick={() => handleExplainOtherwise('exemple_terrain')}
                                disabled={isGenerating || isExplainingOtherwise}
                                className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                <MapPin size={11} /> Exemple local/terrain
                            </button>
                            <button
                                onClick={() => handleExplainOtherwise('langage_facile_sans_jargon')}
                                disabled={isGenerating || isExplainingOtherwise}
                                className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all disabled:opacity-50 flex items-center gap-1"
                            >
                                <Languages size={11} /> Sans jargon
                            </button>
                        </div>
                    </div>

                    {/* Aperçu Document en Attente d'Envoi */}
                    {attachedDoc && (
                        <div className="px-4 py-2 bg-slate-100 border-t border-slate-200 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 overflow-hidden">
                                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-700 shrink-0">
                                    <FileText size={16} />
                                </div>
                                <div className="truncate">
                                    <div className="text-xs font-bold text-slate-800 truncate">{attachedDoc.name}</div>
                                    <div className="text-[10px] text-slate-500">{attachedDoc.sizeKb} Ko • Prêt pour analyse pédagogique</div>
                                </div>
                            </div>
                            <button
                                onClick={removeAttachedDoc}
                                aria-label="Supprimer la pièce jointe"
                                className="p-2.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                                title="Supprimer la pièce jointe"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {/* Saisie avec Micro + Pièce Jointe + Envoi */}
                    <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                        {/* Sélecteur de fichier caché */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept="image/*,.pdf,.txt,.doc,.docx"
                            className="hidden"
                        />

                        {/* Bouton Pièce Jointe */}
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            aria-label="Partager un document, devoir ou photo d'exercice"
                            className="p-2.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all"
                            title="Partager un document, devoir ou photo d'exercice"
                        >
                            <Paperclip size={18} />
                        </button>

                        {/* Champ Texte */}
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder={attachedDoc ? "Ajoutez une consigne pour ce document..." : "Posez votre question à Professeur Diallo..."}
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                        />

                        {/* Bouton Micro rapide */}
                        <button
                            type="button"
                            onClick={toggleListening}
                            aria-label={isListening ? "Arrêter l'écoute" : "Dicter votre question"}
                            className={`p-2.5 rounded-xl transition-all ${
                                isListening
                                    ? 'bg-rose-500 text-white animate-pulse'
                                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                            }`}
                            title={isListening ? "Arrêter l'écoute" : "Dicter votre question"}
                        >
                            <Mic size={18} />
                        </button>

                        {/* Bouton Envoyer */}
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={(!inputText.trim() && !attachedDoc) || isGenerating}
                            aria-label="Envoyer"
                            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40 shadow-sm"
                            title="Envoyer"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Configuration Voix ElevenLabs */}
            <VoiceSettingsModal
                isOpen={isVoiceSettingsOpen}
                onClose={() => setIsVoiceSettingsOpen(false)}
                currentAgentRole="professor"
                onVoiceChanged={(vId) => setCurrentVoiceId(vId)}
            />
        </div>
    );
};
