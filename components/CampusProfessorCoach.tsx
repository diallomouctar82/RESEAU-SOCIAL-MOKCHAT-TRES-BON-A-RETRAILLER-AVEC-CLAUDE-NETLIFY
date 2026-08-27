// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS PROFESSOR 3D VIEW & ADAPTIVE COACH — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Coach 3D interactif et pédagogique (Professeur Diallo) :
// - Reformulation vocale et écrite "Explique-moi autrement"
// - Suivi des lacunes et micro-quiz d'évaluation immédiate
// - Mode immersion et encouragements bienveillants

import React, { useState, useRef, useEffect } from 'react';
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
    Sliders
} from 'lucide-react';
import { Avatar3D } from './Avatar3D';
import { 
    StudentPedagogicalProfile, 
    LearningStylePreference 
} from '../types';
import { campusPedagogicalEngine } from '../services/campusPedagogicalEngine';
import { voiceEngine } from '../services/voiceEngine';

interface CampusProfessorCoachProps {
    profile: StudentPedagogicalProfile;
    currentSubjectName?: string;
    currentLessonTitle?: string;
    onApplyInsight?: (insight: string) => void;
}

export const CampusProfessorCoach: React.FC<CampusProfessorCoachProps> = ({
    profile,
    currentSubjectName = "Mathématiques Approfondies",
    currentLessonTitle = "Limites & Continuité",
    onApplyInsight
}) => {
    const [avatarState, setAvatarState] = useState<'idle' | 'speaking' | 'thinking' | 'routine'>('idle');
    const [audioEnabled, setAudioEnabled] = useState(false);
    const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string; timestamp: string }[]>([
        {
            role: 'model',
            text: `Bonjour ! Je suis le Professeur Diallo. Nous étudions ensemble selon le programme officiel de **${profile.selectedCountryName}** (${profile.selectedLevelName}). Que souhaitez-vous approfondir aujourd'hui ?`,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isExplainingOtherwise, setIsExplainingOtherwise] = useState(false);
    const [alternateMode, setAlternateMode] = useState<'analogie_simple' | 'decoupage_etapes' | 'exemple_terrain' | 'langage_facile_sans_jargon'>('analogie_simple');
    const chatBottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSendMessage = async (textToSend?: string) => {
        const query = textToSend || inputText;
        if (!query.trim() || isGenerating) return;

        setInputText('');
        setMessages(prev => [...prev, {
            role: 'user',
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);

        setIsGenerating(true);
        setAvatarState('thinking');

        try {
            const explanation = await campusPedagogicalEngine.explainConceptAdapted(
                query,
                currentSubjectName,
                profile.selectedCountryName,
                profile.selectedLevelName,
                profile.learningStyle
            );

            setAvatarState('speaking');
            setMessages(prev => [...prev, {
                role: 'model',
                text: explanation,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

            if (audioEnabled) {
                // Lecture audio synthétisée par voiceEngine
                voiceEngine.speak(explanation.slice(0, 200));
            }

            setTimeout(() => {
                setAvatarState('idle');
            }, 3000);

        } catch (e) {
            setAvatarState('idle');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExplainOtherwise = async (mode: 'analogie_simple' | 'decoupage_etapes' | 'exemple_terrain' | 'langage_facile_sans_jargon') => {
        if (isGenerating) return;
        setIsExplainingOtherwise(true);
        setAvatarState('thinking');

        const lastModelMsg = [...messages].reverse().find(m => m.role === 'model')?.text || currentLessonTitle;

        try {
            const alternative = await campusPedagogicalEngine.explainOtherwise(
                currentLessonTitle,
                currentSubjectName,
                lastModelMsg,
                mode
            );

            setAvatarState('speaking');
            setMessages(prev => [...prev, {
                role: 'model',
                text: `✨ **Reformulation (${mode.replace('_', ' ')}) :**\n\n${alternative}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);

            setTimeout(() => setAvatarState('idle'), 3000);
        } catch (e) {
            setAvatarState('idle');
        } finally {
            setIsExplainingOtherwise(false);
        }
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[650px]">
            {/* Header Coach */}
            <div className="bg-slate-900 text-white p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-black">
                        👨‍🏫
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

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setAudioEnabled(!audioEnabled)}
                        className={`p-2 rounded-xl text-xs font-bold transition-all ${
                            audioEnabled ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400 hover:text-white'
                        }`}
                        title={audioEnabled ? 'Voix activée' : 'Activer la voix'}
                    >
                        {audioEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
                    </button>
                </div>
            </div>

            {/* Zone Principale : 3D Avatar + Messages */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50">
                {/* Visualiseur Avatar 3D Réduit */}
                <div className="w-full md:w-56 bg-slate-900 p-4 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800 relative">
                    <div className="w-36 h-36 rounded-2xl overflow-hidden bg-slate-950 border border-slate-700 shadow-inner relative">
                        <Avatar3D 
                            avatarId="agent-campus"
                            state={avatarState}
                            showHud={false}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <div className="mt-3 text-center">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-0.5 bg-slate-800 rounded-full">
                            {avatarState === 'speaking' ? '🗣️ Enseigne...' : avatarState === 'thinking' ? '🧠 Réfléchit...' : '👂 À votre écoute'}
                        </span>
                    </div>

                    <div className="mt-4 w-full bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 text-[11px] text-slate-300">
                        <div className="font-bold text-emerald-400 mb-1 flex items-center gap-1">
                            <Sparkles size={12} /> Style Actif
                        </div>
                        <div className="capitalize">{profile.learningStyle.replace('_', ' ')}</div>
                    </div>
                </div>

                {/* Messages Chat */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white">
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
                                    <div className="prose prose-slate prose-sm max-w-none whitespace-pre-wrap">
                                        {msg.text}
                                    </div>
                                </div>
                                <span className="text-[10px] text-slate-400 mt-1 px-1">{msg.timestamp}</span>
                            </div>
                        ))}
                        <div ref={chatBottomRef} />
                    </div>

                    {/* Barre d'outils "Explique-moi autrement" */}
                    <div className="px-4 py-2 bg-emerald-50/50 border-t border-emerald-100 flex items-center justify-between gap-2 overflow-x-auto">
                        <span className="text-[11px] font-bold text-emerald-900 shrink-0 flex items-center gap-1">
                            <HelpCircle size={14} className="text-emerald-600" /> Pas tout à fait clair ?
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                            <button
                                onClick={() => handleExplainOtherwise('analogie_simple')}
                                className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
                            >
                                💡 Par analogie simple
                            </button>
                            <button
                                onClick={() => handleExplainOtherwise('decoupage_etapes')}
                                className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
                            >
                                🪜 Étape par étape
                            </button>
                            <button
                                onClick={() => handleExplainOtherwise('exemple_terrain')}
                                className="px-2.5 py-1 bg-white border border-emerald-200 rounded-lg text-[10px] font-bold text-emerald-800 hover:bg-emerald-100 transition-all"
                            >
                                🌍 Exemple local/terrain
                            </button>
                        </div>
                    </div>

                    {/* Saisie */}
                    <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Posez votre question à Professeur Diallo..."
                            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <button
                            onClick={() => handleSendMessage()}
                            disabled={!inputText.trim() || isGenerating}
                            className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all disabled:opacity-40 shadow-sm"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
