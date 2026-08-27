
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Image as ImageIcon, RotateCcw, Zap, Send, Wand2, ArrowRight, Instagram, Video, Type, Check, RefreshCw, Sparkles, Loader2, Maximize2 } from 'lucide-react';
import { AIProxyClient } from '../services/aiProxy';
import { Post, ReelDraft } from '../types';

interface UniversalCreatorProps {
    onClose: () => void;
    onPublish: (content: any, type: 'post' | 'story' | 'reel') => void;
}

type CreatorMode = 'story' | 'post' | 'reel';

export const UniversalCreator: React.FC<UniversalCreatorProps> = ({ onClose, onPublish }) => {
    const [step, setStep] = useState<'capture' | 'edit' | 'share'>('capture');
    const [mode, setMode] = useState<CreatorMode>('post');
    const [mediaSrc, setMediaSrc] = useState<string | null>(null);
    const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
    
    // Camera Logic
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    
    // AI & Editing
    const [caption, setCaption] = useState('');
    const [isGeneratingCaption, setIsGeneratingCaption] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
    const [analysis, setAnalysis] = useState<string | null>(null);

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
            streamRef.current = stream;
            if (videoRef.current) videoRef.current.srcObject = stream;
            setIsCameraActive(true);
        } catch (e) {
            console.error("Camera error", e);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setIsCameraActive(false);
    };

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        const context = canvasRef.current.getContext('2d');
        if (!context) return;

        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        const dataUrl = canvasRef.current.toDataURL('image/jpeg');
        setMediaSrc(dataUrl);
        setMediaType('image');
        setStep('edit');
        stopCamera();
        
        // Auto-analyze with Gemini immediately
        analyzeImage(dataUrl);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            setMediaSrc(result);
            setMediaType(file.type.startsWith('video') ? 'video' : 'image');
            setStep('edit');
            stopCamera();
            if (file.type.startsWith('image')) analyzeImage(result);
        };
        reader.readAsDataURL(file);
    };

    const analyzeImage = async (base64Image: string) => {
        try {
            const ai = new AIProxyClient();
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: base64Image.split(',')[1] } },
                        { text: "Décris cette image en 3 mots-clés pour l'analyse contextuelle." }
                    ]
                }
            });
            setAnalysis(response.text || null);
        } catch (e) {
            console.error("Analysis failed", e);
        }
    };

    const generateMagicCaption = async (vibe: 'fun' | 'pro' | 'poetic') => {
        if (!mediaSrc || mediaType !== 'image') return;
        setIsGeneratingCaption(true);
        
        try {
            const ai = new AIProxyClient();
            const prompt = `Tu es un expert des réseaux sociaux. Regarde cette image et écris une légende parfaite pour un post ${mode}.
            Style: ${vibe === 'fun' ? 'Drôle et engageant' : vibe === 'pro' ? 'Professionnel et inspirant' : 'Poétique et artistique'}.
            Ajoute 3-5 hashtags pertinents.
            Réponds uniquement avec le texte de la légende.`;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: {
                    parts: [
                        { inlineData: { mimeType: 'image/jpeg', data: mediaSrc.split(',')[1] } },
                        { text: prompt }
                    ]
                }
            });
            
            if (response.text) {
                setCaption(response.text);
                setAiSuggestions(prev => [...prev, response.text!]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGeneratingCaption(false);
        }
    };

    const handlePublish = () => {
        const newPost = {
            id: Date.now().toString(),
            content: caption,
            imageUrl: mediaSrc,
            timestamp: 'À l\'instant',
            likes: 0,
            comments: 0,
            type: mode === 'story' ? 'story' : 'news',
            category: 'Général'
        };
        onPublish(newPost, mode);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black z-[100] flex flex-col animate-scale-in text-white font-sans overflow-hidden">
            
            {/* TOP BAR */}
            <div className="absolute top-0 left-0 right-0 p-4 z-20 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
                <button onClick={onClose} className="p-2 bg-white/10 rounded-full backdrop-blur-md"><X size={24} /></button>
                <div className="flex bg-black/40 rounded-full p-1 backdrop-blur-md border border-white/10">
                    <button onClick={() => setMode('post')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'post' ? 'bg-white text-black' : 'text-gray-300'}`}>Post</button>
                    <button onClick={() => setMode('story')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'story' ? 'bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-lg' : 'text-gray-300'}`}>Story</button>
                    <button onClick={() => setMode('reel')} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${mode === 'reel' ? 'bg-white text-black' : 'text-gray-300'}`}>Reel</button>
                </div>
                <div className="w-10"></div>
            </div>

            {/* MAIN CONTENT */}
            <div className="flex-1 relative bg-gray-900 flex items-center justify-center">
                
                {/* STEP 1: CAPTURE */}
                {step === 'capture' && (
                    <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                        <canvas ref={canvasRef} className="hidden" />
                        
                        {/* AI Vision Overlay */}
                        <div className="absolute top-1/4 left-0 right-0 text-center pointer-events-none opacity-60">
                            <Maximize2 className="mx-auto text-white/50 w-64 h-64 border-2 border-white/20 rounded-3xl p-4" />
                            <p className="text-xs font-mono mt-2 text-brand-300 tracking-widest">GEMINI VISION READY</p>
                        </div>

                        {/* Controls */}
                        <div className="absolute bottom-0 left-0 right-0 p-8 pb-12 bg-gradient-to-t from-black via-black/50 to-transparent flex justify-between items-center">
                            <label className="p-4 rounded-full bg-white/10 backdrop-blur-md cursor-pointer hover:bg-white/20 transition-all">
                                <ImageIcon size={24} />
                                <input type="file" className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                            </label>
                            
                            <button 
                                onClick={handleCapture}
                                className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center relative group"
                            >
                                <div className="w-16 h-16 bg-white rounded-full transition-transform group-hover:scale-90"></div>
                            </button>
                            
                            <button className="p-4 rounded-full bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all">
                                <RotateCcw size={24} />
                            </button>
                        </div>
                    </>
                )}

                {/* STEP 2: EDIT & AI */}
                {step === 'edit' && mediaSrc && (
                    <div className="w-full h-full flex flex-col relative">
                        <div className="flex-1 relative overflow-hidden bg-black">
                            {mediaType === 'image' ? (
                                <img src={mediaSrc} className="w-full h-full object-contain" />
                            ) : (
                                <video src={mediaSrc} controls className="w-full h-full object-contain" />
                            )}
                            
                            {/* Analysis Badge */}
                            {analysis && (
                                <div className="absolute top-20 left-4 bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-lg flex items-center gap-2 animate-fade-up">
                                    <Sparkles size={12} className="text-yellow-400" />
                                    <span className="text-[10px] font-bold text-white uppercase">{analysis}</span>
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-900 border-t border-white/10 p-6 space-y-6">
                            {/* Magic Caption Generator */}
                            <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                        <Wand2 size={14} className="text-purple-400" /> Légende IA
                                    </label>
                                    <div className="flex gap-2">
                                        <button onClick={() => generateMagicCaption('fun')} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors">Fun</button>
                                        <button onClick={() => generateMagicCaption('pro')} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors">Pro</button>
                                        <button onClick={() => generateMagicCaption('poetic')} className="text-[10px] px-2 py-1 bg-white/5 rounded hover:bg-white/10 transition-colors">Art</button>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <textarea 
                                        value={caption}
                                        onChange={(e) => setCaption(e.target.value)}
                                        placeholder="Écrivez une légende ou laissez l'IA faire..."
                                        className="w-full bg-black/40 border border-white/20 rounded-xl p-3 text-sm focus:border-brand-500 outline-none h-24 resize-none placeholder-gray-600"
                                    />
                                    {isGeneratingCaption && (
                                        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center rounded-xl">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 size={24} className="animate-spin text-purple-400" />
                                                <span className="text-xs font-bold text-purple-200">Rédaction magique...</span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <button onClick={() => {setStep('capture'); setCaption(''); setMediaSrc(null); startCamera();}} className="flex-1 py-3.5 bg-gray-800 rounded-xl font-bold text-sm text-gray-400 hover:bg-gray-700 transition-colors">
                                    Annuler
                                </button>
                                <button onClick={handlePublish} className="flex-[2] py-3.5 bg-gradient-to-r from-brand-600 to-purple-600 rounded-xl font-bold text-sm text-white shadow-lg hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                                    <Send size={16} /> Publier {mode === 'story' ? 'Story' : 'Post'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
