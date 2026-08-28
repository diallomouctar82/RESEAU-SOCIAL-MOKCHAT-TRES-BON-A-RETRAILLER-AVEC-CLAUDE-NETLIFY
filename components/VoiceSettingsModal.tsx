import React, { useState } from 'react';
import { 
    X, 
    Volume2, 
    Sparkles, 
    Radio, 
    Play, 
    Square, 
    Check, 
    Headphones, 
    Sliders, 
    ShieldCheck, 
    Cpu,
    Globe
} from 'lucide-react';
import { 
    voiceEngine, 
    ELEVENLABS_CURATED_VOICES, 
    VoiceOption 
} from '../services/voiceEngine';

interface VoiceSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    currentAgentRole?: string;
    onVoiceChanged?: (voiceId: string) => void;
}

export const VoiceSettingsModal: React.FC<VoiceSettingsModalProps> = ({
    isOpen,
    onClose,
    currentAgentRole = 'professor',
    onVoiceChanged
}) => {
    const [selectedVoiceId, setSelectedVoiceId] = useState<string>(() => {
        return voiceEngine.getVoiceIdForAgent(currentAgentRole);
    });
    const [preferredEngine, setPreferredEngine] = useState<'auto' | 'elevenlabs' | 'browser'>(() => {
        return voiceEngine.getPreferredEngine();
    });
    const [isPlayingPreview, setIsPlayingPreview] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleSelectVoice = (voiceId: string) => {
        setSelectedVoiceId(voiceId);
        onVoiceChanged?.(voiceId);
    };

    const handleEngineChange = (engine: 'auto' | 'elevenlabs' | 'browser') => {
        setPreferredEngine(engine);
        voiceEngine.setPreferredEngine(engine);
    };

    const handleTestVoice = (voice: VoiceOption) => {
        if (isPlayingPreview === voice.id) {
            voiceEngine.stopSpeaking();
            setIsPlayingPreview(null);
        } else {
            voiceEngine.stopSpeaking();
            setIsPlayingPreview(voice.id);
            const sampleText = `Bonjour ! Je suis la voix haute fidélité pour ${voice.specialty}. L'excellence pédagogique et la rigueur sont au cœur de notre engagement.`;
            
            voiceEngine.speak(sampleText, {
                voiceId: voice.id,
                voiceName: voice.name,
                onEnd: () => setIsPlayingPreview(null)
            });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
            <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                
                {/* En-tête */}
                <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <Headphones size={20} />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h3 className="text-base font-bold text-white">Synthèse Vocale Haute Fidélité</h3>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 flex items-center gap-1 shadow-xs">
                                    <Sparkles size={10} /> ELEVENLABS HD
                                </span>
                            </div>
                            <p className="text-xs text-slate-400">
                                Voix neurales réalistes et diction fluide pour les experts et le campus
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={() => {
                            voiceEngine.stopSpeaking();
                            onClose();
                        }}
                        className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Corps de Configuration */}
                <div className="p-5 overflow-y-auto space-y-5 flex-1">
                    
                    {/* Statut Moteur Actif & Mode de Rendu */}
                    <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                                <Sliders size={14} className="text-blue-400" />
                                Mode de Rendu Vocal
                            </span>
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-slate-800 text-slate-300 border border-slate-700">
                                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                Via le registre IA central (Super Admin)
                            </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <button
                                onClick={() => handleEngineChange('auto')}
                                className={`p-3 rounded-xl border text-left transition-all ${preferredEngine === 'auto' ? 'bg-blue-600/20 border-blue-500 text-white shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                            >
                                <div className="text-xs font-bold flex items-center justify-between">
                                    <span>Automatique (Auto)</span>
                                    {preferredEngine === 'auto' && <Check size={14} className="text-blue-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">ElevenLabs HD avec secours navigateur automatique.</p>
                            </button>

                            <button
                                onClick={() => handleEngineChange('elevenlabs')}
                                className={`p-3 rounded-xl border text-left transition-all ${preferredEngine === 'elevenlabs' ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                            >
                                <div className="text-xs font-bold flex items-center justify-between">
                                    <span>ElevenLabs HD</span>
                                    {preferredEngine === 'elevenlabs' && <Check size={14} className="text-indigo-400" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Priorité maximale à la qualité audio studio.</p>
                            </button>

                            <button
                                onClick={() => handleEngineChange('browser')}
                                className={`p-3 rounded-xl border text-left transition-all ${preferredEngine === 'browser' ? 'bg-slate-800 border-slate-600 text-white shadow-sm' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                            >
                                <div className="text-xs font-bold flex items-center justify-between">
                                    <span>Système Local</span>
                                    {preferredEngine === 'browser' && <Check size={14} className="text-slate-300" />}
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Synthèse vocale native sans requête réseau.</p>
                            </button>
                        </div>
                    </div>

                    {/* Catalogue des Voix ElevenLabs par Expert Diallo */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                            <Radio size={14} className="text-indigo-400" />
                            Catalogue des Voix Spécialisées Diallo
                        </h4>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {Object.entries(ELEVENLABS_CURATED_VOICES).map(([key, voice]) => {
                                const isSelected = selectedVoiceId === voice.id;
                                const isPlaying = isPlayingPreview === voice.id;

                                return (
                                    <div
                                        key={key}
                                        onClick={() => handleSelectVoice(voice.id)}
                                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                            isSelected 
                                                ? 'bg-gradient-to-br from-slate-850 to-slate-900 border-blue-500 shadow-md ring-1 ring-blue-500/40' 
                                                : 'bg-slate-950/50 border-slate-800/80 hover:border-slate-700 text-slate-300'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-white">{voice.name}</span>
                                                    {isSelected && (
                                                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                                                    )}
                                                </div>
                                                <span className="text-[11px] text-indigo-300 block">{voice.specialty}</span>
                                            </div>

                                            {/* Bouton d'écoute d'échantillon */}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleTestVoice(voice);
                                                }}
                                                className={`p-2 rounded-xl border text-xs flex items-center gap-1 transition-all ${
                                                    isPlaying 
                                                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 animate-pulse' 
                                                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
                                                }`}
                                                title={isPlaying ? "Arrêter" : "Écouter un échantillon vocal"}
                                            >
                                                {isPlaying ? <Square size={12} className="fill-current" /> : <Play size={12} className="fill-current" />}
                                                <span className="text-[10px]">{isPlaying ? 'Stop' : 'Tester'}</span>
                                            </button>
                                        </div>

                                        <p className="text-[10px] text-slate-400 italic">
                                            {voice.preview}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Pied de page */}
                <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-emerald-500" />
                        <span>Cache audio intelligent & débit optimisé pour faible latence</span>
                    </div>

                    <button
                        onClick={() => {
                            voiceEngine.stopSpeaking();
                            onClose();
                        }}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-md transition-all"
                    >
                        Appliquer & Fermer
                    </button>
                </div>

            </div>
        </div>
    );
};
