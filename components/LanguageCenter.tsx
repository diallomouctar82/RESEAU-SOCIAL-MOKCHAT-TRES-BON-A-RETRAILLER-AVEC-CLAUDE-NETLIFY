
import React, { useState } from 'react';
import { Languages, Volume2, Play, BookOpen, MessageCircle, RotateCcw, Sparkles } from 'lucide-react';
import { AIProxyClient } from '../services/aiProxy';
import { UserProfile } from '../types';
import { DAILY_VOCABULARY, LANGUAGE_LESSONS } from '../constants';

interface LanguageCenterProps {
    userProfile: UserProfile;
}

export const LanguageCenter: React.FC<LanguageCenterProps> = ({ userProfile }) => {
    const [activeTab, setActiveTab] = useState<'daily' | 'practice' | 'translate'>('daily');
    const [conversation, setConversation] = useState<{role: 'user'|'model', text: string}[]>([]);
    const [input, setInput] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [selectedScenario, setSelectedScenario] = useState<string | null>(null);
    const [textToTranslate, setTextToTranslate] = useState('');
    const [translationResult, setTranslationResult] = useState('');
    const [isTranslating, setIsTranslating] = useState(false);

    const startScenario = (scenario: string) => {
        setSelectedScenario(scenario);
        setActiveTab('practice');
        setConversation([{ role: 'model', text: `(Scénario : ${scenario}) Bonjour ! Je suis prêt à pratiquer avec vous.` }]);
    };

    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setInput('');
        setConversation(prev => [...prev, { role: 'user', text: userMsg }]);
        setIsThinking(true);
        try {
            const ai = new AIProxyClient();
            const prompt = `Agis comme un prof de langue. Scénario: ${selectedScenario}. Dernier message: "${userMsg}". Réponds et corrige si besoin.`;
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: prompt });
            setConversation(prev => [...prev, { role: 'model', text: response.text || "Je n'ai pas compris." }]);
        } catch (e) { console.error(e); } finally { setIsThinking(false); }
    };

    const handleTranslate = async () => {
        if (!textToTranslate.trim()) return;
        setIsTranslating(true);
        try {
            const ai = new AIProxyClient();
            const response = await ai.models.generateContent({ model: 'gemini-2.5-flash', contents: `Traduis et explique : "${textToTranslate}"` });
            setTranslationResult(response.text || "Erreur.");
        } catch (e) { console.error(e); } finally { setIsTranslating(false); }
    };

    return (
        <div className="flex flex-col h-full bg-indigo-50 animate-fade-up">
            {/* Header */}
            <div className="bg-indigo-600 text-white p-8 shadow-lg">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div><h1 className="text-3xl font-bold">Centre Linguistique</h1><p className="text-indigo-100">Maîtrisez la langue, maîtrisez votre intégration.</p></div>
                    <div className="flex gap-2 bg-white/10 p-1 rounded-xl">
                        <button onClick={() => setActiveTab('daily')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'daily' ? 'bg-white text-indigo-600' : 'text-white'}`}>Quotidien</button>
                        <button onClick={() => setActiveTab('practice')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'practice' ? 'bg-white text-indigo-600' : 'text-white'}`}>Immersion</button>
                        <button onClick={() => setActiveTab('translate')} className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${activeTab === 'translate' ? 'bg-white text-indigo-600' : 'text-white'}`}>Traducteur</button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-5xl mx-auto">
                    {/* DAILY TAB */}
                    {activeTab === 'daily' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4"><h2 className="text-xl font-bold text-indigo-900">Vocabulaire</h2>{DAILY_VOCABULARY.map(c => (<div key={c.id} className="bg-white p-4 rounded-xl shadow-sm"><h3 className="font-bold">{c.word}</h3><p className="text-sm text-slate-500">{c.translation}</p></div>))}</div>
                            <div className="space-y-4"><h2 className="text-xl font-bold text-indigo-900">Missions</h2>{LANGUAGE_LESSONS.map(l => (<div key={l.id} className="bg-white p-6 rounded-xl shadow-sm"><h3 className="font-bold">{l.title}</h3><button onClick={() => startScenario(l.scenario)} className="mt-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Commencer</button></div>))}</div>
                        </div>
                    )}
                    {/* PRACTICE TAB */}
                    {activeTab === 'practice' && (
                        <div className="max-w-3xl mx-auto h-[500px] flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">{conversation.map((msg, i) => <div key={i} className={`p-3 rounded-xl max-w-[80%] ${msg.role === 'user' ? 'ml-auto bg-indigo-600 text-white' : 'bg-white border'}`}>{msg.text}</div>)}</div>
                            <div className="p-4 bg-white border-t flex gap-2"><input value={input} onChange={e => setInput(e.target.value)} className="flex-1 border rounded-xl px-4 py-2" /><button onClick={handleSendMessage} className="bg-indigo-600 text-white p-2 rounded-xl"><Play size={20} /></button></div>
                        </div>
                    )}
                    {/* TRANSLATE TAB */}
                    {activeTab === 'translate' && (
                        <div className="max-w-2xl mx-auto space-y-4">
                            <textarea value={textToTranslate} onChange={e => setTextToTranslate(e.target.value)} className="w-full h-32 p-4 border rounded-xl" placeholder="Texte à traduire..." />
                            <button onClick={handleTranslate} className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold">Traduire</button>
                            {translationResult && <div className="bg-white p-6 rounded-xl shadow-sm border-l-4 border-indigo-500">{translationResult}</div>}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
