import React, { useState, useEffect } from 'react';
import { Mic, MicOff, Volume2, VolumeX, Sparkles, Loader2, Play, Square, Activity } from 'lucide-react';
import { voiceEngine } from '../services/voiceEngine';
import { Agent } from '../types';

interface VoiceInteractionBarProps {
    agent: Agent;
    onTranscriptReceived: (transcript: string) => void;
    autoReadResponse: boolean;
    onToggleAutoRead: (val: boolean) => void;
    lastAgentMessageText?: string;
}

export const VoiceInteractionBar: React.FC<VoiceInteractionBarProps> = ({
    agent,
    onTranscriptReceived,
    autoReadResponse,
    onToggleAutoRead,
    lastAgentMessageText
}) => {
    const [isListening, setIsListening] = useState<boolean>(false);
    const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
    const [liveTranscript, setLiveTranscript] = useState<string>('');
    const [speechVolume, setSpeechVolume] = useState<number>(0);

    useEffect(() => {
        const unsubscribe = voiceEngine.addListener({
            onStart: () => setIsListening(true),
            onEnd: () => {
                setIsListening(false);
                setSpeechVolume(0);
            },
            onTranscript: (transcript, isFinal) => {
                setLiveTranscript(transcript);
                if (isFinal && transcript.trim()) {
                    onTranscriptReceived(transcript);
                    setLiveTranscript('');
                }
            },
            onSpeechVolume: (vol) => setSpeechVolume(vol),
            onError: (err) => {
                console.warn('Voice error:', err);
                setIsListening(false);
            }
        });

        return () => {
            unsubscribe();
            voiceEngine.stopListening();
            voiceEngine.stopSpeaking();
        };
    }, [onTranscriptReceived]);

    const toggleListening = async () => {
        if (isListening) {
            voiceEngine.stopListening();
        } else {
            setLiveTranscript('');
            await voiceEngine.startListening('fr-FR');
        }
    };

    const handlePlayVoice = (text: string) => {
        if (isSpeaking) {
            voiceEngine.stopSpeaking();
            setIsSpeaking(false);
        } else {
            setIsSpeaking(true);
            const voiceId = voiceEngine.getVoiceIdForAgent(agent.role);
            voiceEngine.speak(text, {
                voiceId: voiceId,
                onEnd: () => setIsSpeaking(false)
            });
        }
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
            {/* Left: Microphone & Waveform */}
            <div className="flex items-center gap-3">
                <button
                    onClick={toggleListening}
                    className={`relative p-3 rounded-2xl font-bold flex items-center justify-center transition-all shadow-md ${isListening ? 'bg-red-600 text-white animate-pulse shadow-red-600/40' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30'}`}
                    title={isListening ? 'Arrêter la dictée vocale' : 'Parler à voix haute'}
                >
                    {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                    {isListening && (
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-ping" />
                    )}
                </button>

                <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-200">
                            {isListening ? "Écoute active en cours..." : "Assistant Vocal Fluide"}
                        </span>
                        {isListening && (
                            <span className="text-[10px] bg-red-500/20 border border-red-500/40 text-red-300 px-2 py-0.5 rounded-full font-bold">
                                REC
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-slate-400 max-w-xs truncate">
                        {liveTranscript || (isListening ? "Parlez librement..." : `Discutez avec ${agent.name} à la voix.`)}
                    </p>
                </div>
            </div>

            {/* Audio Waveform visualization */}
            {isListening && (
                <div className="flex items-center gap-1 h-6 px-2">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(i => {
                        const height = Math.max(4, (speechVolume / 100) * 24 * (Math.sin(i + Date.now() / 200) + 1));
                        return (
                            <div 
                                key={i} 
                                className="w-1 bg-red-400 rounded-full transition-all duration-75"
                                style={{ height: `${height}px` }}
                            />
                        );
                    })}
                </div>
            )}

            {/* Right: Auto-read & Audio player */}
            <div className="flex items-center gap-2">
                {lastAgentMessageText && (
                    <button
                        onClick={() => handlePlayVoice(lastAgentMessageText)}
                        className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${isSpeaking ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'}`}
                        title={isSpeaking ? "Arrêter la lecture" : "Lire la dernière réponse"}
                    >
                        {isSpeaking ? <Square size={14} className="fill-amber-300" /> : <Play size={14} />}
                        <span className="hidden sm:inline">{isSpeaking ? 'Arrêter' : 'Écouter'}</span>
                    </button>
                )}

                <button
                    onClick={() => onToggleAutoRead(!autoReadResponse)}
                    className={`p-2 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${autoReadResponse ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' : 'bg-slate-800 border-slate-700 text-slate-400'}`}
                    title={autoReadResponse ? "Lecture vocale automatique activée" : "Lecture vocale automatique désactivée"}
                >
                    {autoReadResponse ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    <span className="hidden md:inline">Auto-lecture</span>
                </button>
            </div>
        </div>
    );
};
