import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
    Camera, 
    CameraOff, 
    Eye, 
    Zap, 
    FileText, 
    Globe, 
    Users, 
    Scan, 
    RefreshCw, 
    Layers, 
    ShieldCheck, 
    ShieldAlert, 
    Maximize2, 
    Minimize2, 
    Volume2, 
    VolumeX, 
    Sparkles, 
    Check, 
    Plus, 
    Trash2, 
    Lock, 
    ChevronRight,
    AlertCircle,
    Activity,
    Compass,
    Sun,
    Send
} from 'lucide-react';
import { 
    Agent, 
    DetectedObject, 
    MotionDetectionResult, 
    OcrBlock, 
    SceneUnderstanding, 
    RecognizedPerson, 
    EnrolledPerson, 
    MultimodalVisionAnalysis, 
    VisionFeatureMode 
} from '../types';
import { multimodalVisionService } from '../services/multimodalVision';

interface MultimodalCameraHUDProps {
    activeAgent: Agent;
    onSendVisionContextToChat: (summary: string, base64Snapshot?: string, ocrText?: string) => void;
    compact?: boolean;
}

export const MultimodalCameraHUD: React.FC<MultimodalCameraHUDProps> = ({
    activeAgent,
    onSendVisionContextToChat,
    compact = false
}) => {
    // Media & Hardware State
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
    const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
    const [hasPermissionError, setHasPermissionError] = useState<string | null>(null);

    // Vision Analysis State
    const [activeMode, setActiveMode] = useState<VisionFeatureMode>('all');
    const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
    const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(false);
    const [latestAnalysis, setLatestAnalysis] = useState<MultimodalVisionAnalysis | null>(null);
    const [motionResult, setMotionResult] = useState<MotionDetectionResult>({
        hasMotion: false,
        motionLevel: 0,
        activeZones: [],
        timestamp: Date.now()
    });

    // Privacy & Person Authorization
    const [isPersonAuthAllowed, setIsPersonAuthAllowed] = useState<boolean>(true);
    const [showEnrollModal, setShowEnrollModal] = useState<boolean>(false);
    const [enrolledPersons, setEnrolledPersons] = useState<EnrolledPerson[]>([]);
    const [newPersonName, setNewPersonName] = useState<string>('');
    const [newPersonRole, setNewPersonRole] = useState<string>('');

    // UI & HUD State
    const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
    const [copiedOcrId, setCopiedOcrId] = useState<string | null>(null);
    const [hudFlash, setHudFlash] = useState<boolean>(false);
    const animationFrameRef = useRef<number | null>(null);
    const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Initialiser la liste des personnes
    useEffect(() => {
        setEnrolledPersons(multimodalVisionService.getEnrolledPersons());
    }, []);

    // 1. Démarrage du flux vidéo
    const startCamera = async (facing: 'user' | 'environment' = cameraFacing) => {
        setHasPermissionError(null);
        try {
            if (stream) {
                stream.getTracks().forEach(t => t.stop());
            }

            const constraints: MediaStreamConstraints = {
                video: {
                    facingMode: facing,
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            };

            const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                await videoRef.current.play();
            }

            setStream(mediaStream);
            setIsCameraActive(true);
            setCameraFacing(facing);
        } catch (err: any) {
            console.error('Erreur accès caméra:', err);
            setHasPermissionError(
                err.name === 'NotAllowedError' 
                    ? "Accès caméra refusé. Veuillez autoriser la caméra dans votre navigateur." 
                    : "Impossible d'accéder au périphérique vidéo."
            );
            setIsCameraActive(false);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(t => t.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setIsCameraActive(false);
        setAutoScanEnabled(false);
    };

    // Auto-start camera when component mounts
    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
        };
    }, []);

    // 2. Traitement d'analyse de mouvement client-side à haute fréquence (60fps)
    const runMotionLoop = useCallback(() => {
        if (videoRef.current && isCameraActive && videoRef.current.readyState >= 2) {
            const motion = multimodalVisionService.detectMotion(videoRef.current);
            setMotionResult(motion);
            drawHudOverlay(motion);
        }
        animationFrameRef.current = requestAnimationFrame(runMotionLoop);
    }, [isCameraActive, activeMode, latestAnalysis, isPersonAuthAllowed]);

    useEffect(() => {
        if (isCameraActive) {
            animationFrameRef.current = requestAnimationFrame(runMotionLoop);
        }
        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
        };
    }, [isCameraActive, runMotionLoop]);

    // 3. Rendu du HUD sur le Canvas Overlay
    const drawHudOverlay = (currentMotion: MotionDetectionResult) => {
        const canvas = canvasOverlayRef.current;
        const video = videoRef.current;
        if (!canvas || !video || video.videoWidth === 0) return;

        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
        }

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        const w = canvas.width;
        const h = canvas.height;

        // Grille et réticule central de visée
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(w * 0.15, h * 0.15, w * 0.7, h * 0.7);

        // --- A. DÉTECTION DE MOUVEMENT (HUD Cyan/Jaune) ---
        if ((activeMode === 'all' || activeMode === 'motion') && currentMotion.hasMotion) {
            currentMotion.activeZones.forEach(zone => {
                const bx = (zone.xmin / 1000) * w;
                const by = (zone.ymin / 1000) * h;
                const bw = ((zone.xmax - zone.xmin) / 1000) * w;
                const bh = ((zone.ymax - zone.ymin) / 1000) * h;

                // Zone de mouvement pulsante
                ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
                ctx.fillRect(bx, by, bw, bh);

                ctx.strokeStyle = '#eab308';
                ctx.lineWidth = 2;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(bx, by, bw, bh);
                ctx.setLineDash([]);

                // Tag
                ctx.fillStyle = '#eab308';
                ctx.font = 'bold 11px system-ui';
                ctx.fillText(`⚡ MOUVEMENT (${currentMotion.motionLevel}%)`, bx + 4, by - 6);
            });
        }

        // Si aucune analyse Gemini pour le reste, on s'arrête
        if (!latestAnalysis) return;

        // --- B. DÉTECTION D'OBJETS (HUD Bleu / Émeraude) ---
        if (activeMode === 'all' || activeMode === 'objects') {
            latestAnalysis.objects.forEach(obj => {
                const bx = (obj.box.xmin / 1000) * w;
                const by = (obj.box.ymin / 1000) * h;
                const bw = ((obj.box.xmax - obj.box.xmin) / 1000) * w;
                const bh = ((obj.box.ymax - obj.box.ymin) / 1000) * h;

                const color = obj.category === 'document' ? '#10b981' : '#3b82f6';

                // Bounding Box
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                ctx.strokeRect(bx, by, bw, bh);

                // Corner Reticles
                const cornerLen = 12;
                ctx.lineWidth = 3;
                // Top-Left
                ctx.beginPath();
                ctx.moveTo(bx, by + cornerLen);
                ctx.lineTo(bx, by);
                ctx.lineTo(bx + cornerLen, by);
                ctx.stroke();
                // Top-Right
                ctx.beginPath();
                ctx.moveTo(bx + bw - cornerLen, by);
                ctx.lineTo(bx + bw, by);
                ctx.lineTo(bx + bw, by + cornerLen);
                ctx.stroke();
                // Bottom-Left
                ctx.beginPath();
                ctx.moveTo(bx, by + bh - cornerLen);
                ctx.lineTo(bx, by + bh);
                ctx.lineTo(bx + cornerLen, by + bh);
                ctx.stroke();
                // Bottom-Right
                ctx.beginPath();
                ctx.moveTo(bx + bw - cornerLen, by + bh);
                ctx.lineTo(bx + bw, by + bh);
                ctx.lineTo(bx + bw, by + bh - cornerLen);
                ctx.stroke();

                // Tag & Badge
                ctx.fillStyle = color;
                const tagText = `${obj.labelFr || obj.label} • ${Math.round(obj.confidence * 100)}%`;
                const textWidth = ctx.measureText(tagText).width;
                ctx.fillRect(bx, Math.max(0, by - 22), textWidth + 12, 22);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px system-ui';
                ctx.fillText(tagText, bx + 6, Math.max(15, by - 7));
            });
        }

        // --- C. OCR & TEXT READER (HUD Violet / Indigo) ---
        if (activeMode === 'all' || activeMode === 'ocr') {
            latestAnalysis.ocrBlocks.forEach(ocr => {
                const bx = (ocr.box.xmin / 1000) * w;
                const by = (ocr.box.ymin / 1000) * h;
                const bw = ((ocr.box.xmax - ocr.box.xmin) / 1000) * w;
                const bh = ((ocr.box.ymax - ocr.box.ymin) / 1000) * h;

                ctx.fillStyle = 'rgba(139, 92, 246, 0.18)';
                ctx.fillRect(bx, by, bw, bh);

                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(bx, by, bw, bh);

                // Petite étiquette texte
                ctx.fillStyle = '#8b5cf6';
                const displayText = ocr.text.length > 25 ? ocr.text.substring(0, 22) + '...' : ocr.text;
                ctx.font = 'bold 10px system-ui';
                ctx.fillText(`📄 ${displayText}`, bx + 4, Math.max(12, by - 4));
            });
        }

        // --- D. PERSONNES IDENTIFIÉES & AUTORISÉES (HUD Cyan / Vert / Rouge) ---
        if ((activeMode === 'all' || activeMode === 'people') && isPersonAuthAllowed) {
            latestAnalysis.recognizedPersons.forEach(person => {
                const bx = (person.box.xmin / 1000) * w;
                const by = (person.box.ymin / 1000) * h;
                const bw = ((person.box.xmax - person.box.xmin) / 1000) * w;
                const bh = ((person.box.ymax - person.box.ymin) / 1000) * h;

                const isAuth = person.isAuthorized;
                const color = isAuth ? '#06b6d4' : '#f97316';

                ctx.strokeStyle = color;
                ctx.lineWidth = 2.5;
                ctx.strokeRect(bx, by, bw, bh);

                // Badge
                ctx.fillStyle = color;
                const personText = `${isAuth ? '✓' : '!'} ${person.name} (${isAuth ? 'Autorisé' : 'Inconnu'})`;
                const textWidth = ctx.measureText(personText).width;
                ctx.fillRect(bx, Math.max(0, by - 24), textWidth + 14, 24);

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 11px system-ui';
                ctx.fillText(personText, bx + 7, Math.max(16, by - 8));
            });
        }
    };

    // 4. Déclencheur d'analyse IA multimodale
    const handleTriggerScan = async () => {
        if (!videoRef.current || isAnalyzing || !isCameraActive) return;

        setIsAnalyzing(true);
        setHudFlash(true);
        setTimeout(() => setHudFlash(false), 300);

        try {
            const frameBase64 = multimodalVisionService.captureFrame(videoRef.current, 1024);
            if (!frameBase64) throw new Error("Capture impossible");

            const analysis = await multimodalVisionService.analyzeFrame(
                frameBase64,
                { name: activeAgent.name, specialty: activeAgent.specialty, title: activeAgent.title },
                isPersonAuthAllowed
            );

            setLatestAnalysis(analysis);
        } catch (error: any) {
            console.error("Erreur de scan IA:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Auto-scan périodique
    useEffect(() => {
        if (autoScanEnabled && isCameraActive) {
            autoScanTimerRef.current = setInterval(() => {
                if (!isAnalyzing) {
                    handleTriggerScan();
                }
            }, 6000);
        } else if (autoScanTimerRef.current) {
            clearInterval(autoScanTimerRef.current);
            autoScanTimerRef.current = null;
        }

        return () => {
            if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
        };
    }, [autoScanEnabled, isCameraActive, isAnalyzing]);

    // 5. Envoi des insights à l'expert actif
    const handleTransferToAgent = () => {
        if (!latestAnalysis || !videoRef.current) return;
        const frameBase64 = multimodalVisionService.captureFrame(videoRef.current, 600);

        const ocrSummary = latestAnalysis.ocrBlocks.map(b => b.text).join(' | ');
        const objectsSummary = latestAnalysis.objects.map(o => o.labelFr || o.label).join(', ');
        const personsSummary = latestAnalysis.recognizedPersons.map(p => `${p.name} (${p.isAuthorized ? 'Autorisé' : 'Non répertorié'})`).join(', ');

        const comprehensiveObservation = `[OBSERVATION VISION MULTIMODALE EN TEMPS RÉEL]:
- Synthèse scène : ${latestAnalysis.scene.summary}
- Type environnement : ${latestAnalysis.scene.environmentType} (Éclairage: ${latestAnalysis.scene.lighting})
${objectsSummary ? `- Objets détectés : ${objectsSummary}` : ''}
${ocrSummary ? `- Textes / OCR lus : "${ocrSummary}"` : ''}
${personsSummary ? `- Personnes identifiées : ${personsSummary}` : ''}
${latestAnalysis.scene.suggestedActions?.length ? `- Recommandations : ${latestAnalysis.scene.suggestedActions.join(' ; ')}` : ''}

Merci d'analyser ces éléments en tant que ${activeAgent.name}, ${activeAgent.title}.`;

        onSendVisionContextToChat(comprehensiveObservation, frameBase64 || undefined, ocrSummary);
    };

    // Enrôlement d'une nouvelle personne
    const handleAddPerson = () => {
        if (!newPersonName.trim()) return;
        const newP = multimodalVisionService.saveEnrolledPerson({
            name: newPersonName.trim(),
            role: newPersonRole.trim() || 'Membre vérifié',
            isAuthorized: true,
            notes: 'Enrôlé via la console multimodale'
        });
        setEnrolledPersons(multimodalVisionService.getEnrolledPersons());
        setNewPersonName('');
        setNewPersonRole('');
    };

    const handleDeletePerson = (id: string) => {
        multimodalVisionService.deleteEnrolledPerson(id);
        setEnrolledPersons(multimodalVisionService.getEnrolledPersons());
    };

    const handleToggleAuth = (id: string) => {
        multimodalVisionService.togglePersonAuthorization(id);
        setEnrolledPersons(multimodalVisionService.getEnrolledPersons());
    };

    return (
        <div className={`flex flex-col bg-slate-950 text-white rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative ${isFullscreen ? 'fixed inset-4 z-50' : 'w-full h-full'}`}>
            
            {/* Flash Effect on Scan */}
            {hudFlash && (
                <div className="absolute inset-0 bg-blue-500/20 backdrop-blur-xs z-30 pointer-events-none transition-opacity duration-300 animate-pulse" />
            )}

            {/* Header: Modes & Controls */}
            <div className="bg-slate-900/90 backdrop-blur-md px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 z-20">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
                        <Eye size={18} className="animate-pulse" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-100">Perception Multimodale</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                                Live 30 FPS
                            </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                            Connecté à <span className="text-blue-300 font-medium">{activeAgent.name}</span> ({activeAgent.title})
                        </p>
                    </div>
                </div>

                {/* Mode Selector Tabs */}
                <div className="flex items-center bg-slate-950/80 p-1 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
                    <button
                        onClick={() => setActiveMode('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeMode === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Layers size={13} />
                        <span>Tout</span>
                    </button>
                    <button
                        onClick={() => setActiveMode('objects')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeMode === 'objects' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Scan size={13} />
                        <span>Objets</span>
                    </button>
                    <button
                        onClick={() => setActiveMode('motion')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeMode === 'motion' ? 'bg-yellow-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Zap size={13} />
                        <span>Mouvement</span>
                    </button>
                    <button
                        onClick={() => setActiveMode('ocr')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeMode === 'ocr' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        <FileText size={13} />
                        <span>OCR</span>
                    </button>
                    <button
                        onClick={() => setActiveMode('scene')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeMode === 'scene' ? 'bg-teal-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Globe size={13} />
                        <span>Scène</span>
                    </button>
                    <button
                        onClick={() => setActiveMode('people')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${activeMode === 'people' ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                        <Users size={13} />
                        <span>Personnes</span>
                    </button>
                </div>

                {/* Right Quick Actions */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowEnrollModal(true)}
                        title="Gestion des personnes autorisées"
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${isPersonAuthAllowed ? 'bg-slate-800/80 border-slate-700 text-cyan-300 hover:bg-slate-700' : 'bg-orange-500/10 border-orange-500/30 text-orange-400'}`}
                    >
                        <ShieldCheck size={16} />
                        <span className="hidden sm:inline">Personnes ({enrolledPersons.length})</span>
                    </button>

                    <button
                        onClick={() => startCamera(cameraFacing === 'user' ? 'environment' : 'user')}
                        title="Changer de caméra (Avant / Arrière)"
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all"
                    >
                        <RefreshCw size={16} />
                    </button>

                    <button
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        title={isFullscreen ? "Réduire" : "Plein écran"}
                        className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 transition-all"
                    >
                        {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                    </button>
                </div>
            </div>

            {/* Video Viewport & Canvas Overlay Container */}
            <div className="relative flex-1 bg-black min-h-[320px] max-h-[580px] flex items-center justify-center overflow-hidden">
                {hasPermissionError ? (
                    <div className="p-8 text-center max-w-md space-y-4">
                        <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-full flex items-center justify-center text-red-400 mx-auto">
                            <CameraOff size={32} />
                        </div>
                        <h4 className="font-bold text-lg text-slate-100">Caméra Non Accessible</h4>
                        <p className="text-sm text-slate-400">{hasPermissionError}</p>
                        <button
                            onClick={() => startCamera()}
                            className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-2xl text-sm font-bold transition-all shadow-lg shadow-blue-600/30"
                        >
                            Réessayer l'autorisation
                        </button>
                    </div>
                ) : (
                    <>
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />
                        <canvas
                            ref={canvasOverlayRef}
                            className="absolute inset-0 w-full h-full object-cover pointer-events-none z-10"
                        />

                        {/* Top Overlay HUD Badges */}
                        <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-20 pointer-events-none">
                            {/* Motion Sensor HUD */}
                            <div className="bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800 text-xs flex items-center gap-2.5 pointer-events-auto">
                                <Activity size={14} className={motionResult.hasMotion ? 'text-yellow-400 animate-pulse' : 'text-slate-500'} />
                                <span className="text-slate-300 font-medium">Mouvement :</span>
                                <div className="w-16 bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full transition-all duration-100 ${motionResult.motionLevel > 50 ? 'bg-yellow-400' : 'bg-blue-500'}`} 
                                        style={{ width: `${motionResult.motionLevel}%` }}
                                    />
                                </div>
                                <span className="font-bold text-xs text-slate-100">{motionResult.motionLevel}%</span>
                            </div>

                            {/* Scene Context Tag */}
                            {latestAnalysis && (
                                <div className="hidden sm:flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3.5 py-1.5 rounded-2xl border border-slate-800 text-xs pointer-events-auto">
                                    <Sun size={13} className="text-amber-400" />
                                    <span className="text-slate-300">{latestAnalysis.scene.environmentType} • {latestAnalysis.scene.lighting}</span>
                                </div>
                            )}
                        </div>

                        {/* Bottom Floating Control Bar */}
                        <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 z-20">
                            {/* Auto-Scan Switch */}
                            <button
                                onClick={() => setAutoScanEnabled(!autoScanEnabled)}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold border flex items-center gap-2 transition-all shadow-lg backdrop-blur-md ${autoScanEnabled ? 'bg-emerald-600/90 border-emerald-400 text-white' : 'bg-slate-900/80 border-slate-700 text-slate-300 hover:bg-slate-800'}`}
                            >
                                <span className={`w-2 h-2 rounded-full ${autoScanEnabled ? 'bg-white animate-ping' : 'bg-slate-500'}`} />
                                {autoScanEnabled ? 'Auto-Scan Continu Actif' : 'Activer Auto-Scan'}
                            </button>

                            {/* Main Trigger Button */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleTriggerScan}
                                    disabled={isAnalyzing}
                                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2.5 shadow-xl shadow-blue-600/40 transition-all active:scale-95"
                                >
                                    {isAnalyzing ? (
                                        <>
                                            <RefreshCw size={18} className="animate-spin text-blue-200" />
                                            <span>Analyse Multimodale...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles size={18} />
                                            <span>Scanner la Vue</span>
                                        </>
                                    )}
                                </button>

                                {latestAnalysis && (
                                    <button
                                        onClick={handleTransferToAgent}
                                        title="Transférer l'observation à l'expert Diallo"
                                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                                    >
                                        <Send size={15} />
                                        <span className="hidden md:inline">Envoyer à {activeAgent.name}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Analysis Results Drawer & Smart Action Cards */}
            {latestAnalysis && (
                <div className="bg-slate-900/95 border-t border-slate-800 p-4 space-y-3 max-h-48 overflow-y-auto z-20">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Sparkles size={16} className="text-blue-400" />
                            <span className="font-bold text-xs text-slate-200">Synthèse de Perception IA :</span>
                        </div>
                        <span className="text-[11px] text-slate-500">
                            {new Date(latestAnalysis.timestamp).toLocaleTimeString()}
                        </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                        {latestAnalysis.scene.summary}
                    </p>

                    {/* Quick Tags: Objects & OCR highlights */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                        {latestAnalysis.objects.map(obj => (
                            <span 
                                key={obj.id}
                                className="px-2.5 py-1 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-[11px] font-medium flex items-center gap-1.5"
                            >
                                <Scan size={12} />
                                {obj.labelFr || obj.label} ({Math.round(obj.confidence * 100)}%)
                            </span>
                        ))}

                        {latestAnalysis.ocrBlocks.map(ocr => (
                            <button
                                key={ocr.id}
                                onClick={() => {
                                    navigator.clipboard.writeText(ocr.text);
                                    setCopiedOcrId(ocr.id);
                                    setTimeout(() => setCopiedOcrId(null), 2000);
                                }}
                                title="Cliquer pour copier le texte lu"
                                className="px-2.5 py-1 rounded-xl bg-purple-500/10 border border-purple-500/30 hover:bg-purple-500/20 text-purple-300 text-[11px] font-medium flex items-center gap-1.5 transition-all"
                            >
                                <FileText size={12} />
                                <span className="max-w-[150px] truncate">"{ocr.text}"</span>
                                {copiedOcrId === ocr.id ? <Check size={12} className="text-green-400" /> : null}
                            </button>
                        ))}

                        {latestAnalysis.recognizedPersons.map(p => (
                            <span
                                key={p.id}
                                className={`px-2.5 py-1 rounded-xl text-[11px] font-medium flex items-center gap-1.5 border ${p.isAuthorized ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300' : 'bg-orange-500/10 border-orange-500/30 text-orange-300'}`}
                            >
                                <Users size={12} />
                                {p.name} {p.isAuthorized ? '(✓ Autorisé)' : '(⚠️ Non répertorié)'}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal: Face Recognition & Enrolled Persons Management */}
            {showEnrollModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                                    <ShieldCheck size={22} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-100 text-base">Personnes de Confiance & Biométrie</h3>
                                    <p className="text-xs text-slate-400">Gestion de la reconnaissance faciale autorisée</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowEnrollModal(false)}
                                className="text-slate-400 hover:text-white p-2 rounded-xl bg-slate-800/60"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Privacy Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
                            <div className="space-y-0.5">
                                <div className="font-bold text-xs text-slate-200">Reconnaissance de personnes</div>
                                <div className="text-[11px] text-slate-400">Autoriser l'IA à identifier les visages selon le RGPD</div>
                            </div>
                            <input
                                type="checkbox"
                                checked={isPersonAuthAllowed}
                                onChange={(e) => setIsPersonAuthAllowed(e.target.checked)}
                                className="w-5 h-5 accent-cyan-500 cursor-pointer"
                            />
                        </div>

                        {/* Enrolled Persons List */}
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            <div className="text-xs font-bold text-slate-400 px-1">Membres Enrôlés ({enrolledPersons.length}) :</div>
                            {enrolledPersons.map(p => (
                                <div key={p.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 text-xs">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${p.isAuthorized ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-500'}`}>
                                            {p.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-200">{p.name}</div>
                                            <div className="text-[11px] text-slate-400">{p.role}</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleToggleAuth(p.id)}
                                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${p.isAuthorized ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                                        >
                                            {p.isAuthorized ? '✓ Autorisé' : 'Bloqué'}
                                        </button>
                                        <button
                                            onClick={() => handleDeletePerson(p.id)}
                                            className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Add Person Form */}
                        <div className="space-y-3 pt-2 border-t border-slate-800">
                            <div className="text-xs font-bold text-slate-300">Enrôler une nouvelle personne :</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <input
                                    type="text"
                                    placeholder="Nom complet (ex: Aïssatou Sow)"
                                    value={newPersonName}
                                    onChange={(e) => setNewPersonName(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                                <input
                                    type="text"
                                    placeholder="Rôle (ex: Avocat / Étudiant)"
                                    value={newPersonRole}
                                    onChange={(e) => setNewPersonRole(e.target.value)}
                                    className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                            </div>
                            <button
                                onClick={handleAddPerson}
                                disabled={!newPersonName.trim()}
                                className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-600/30"
                            >
                                <Plus size={16} />
                                Ajouter aux personnes autorisées
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
