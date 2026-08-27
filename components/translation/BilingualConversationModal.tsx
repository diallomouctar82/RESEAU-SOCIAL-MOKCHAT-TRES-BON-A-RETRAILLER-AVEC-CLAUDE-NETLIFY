import React, { useState, useEffect } from 'react';
import { 
  Languages, 
  Mic, 
  MicOff, 
  Volume2, 
  ArrowRightLeft, 
  Sparkles, 
  X, 
  Check, 
  MessageSquare,
  Globe,
  Radio
} from 'lucide-react';

interface BilingualConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MessageItem {
  id: string;
  speaker: 'person_a' | 'person_b';
  originalText: string;
  translatedText: string;
  langFrom: string;
  langTo: string;
  timestamp: string;
}

const SUPPORTED_LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية (Arabe)', flag: '🇸🇦' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', label: '中文 (Chinois)', flag: '🇨🇳' },
  { code: 'pt', label: 'Português', flag: '🇵🇹' },
  { code: 'ff', label: 'Pulaar / Fulfulde', flag: '🌍' },
  { code: 'mnk', label: 'Maninka / Mandingue', flag: '🌍' },
  { code: 'sos', label: 'Soussou', flag: '🌍' },
  { code: 'wo', label: 'Wolof', flag: '🇸🇳' }
];

export const BilingualConversationModal: React.FC<BilingualConversationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [langA, setLangA] = useState('fr');
  const [langB, setLangB] = useState('en');
  const [activeSpeaker, setActiveSpeaker] = useState<'person_a' | 'person_b' | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [inputTextA, setInputTextA] = useState('');
  const [inputTextB, setInputTextB] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);

  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: '1',
      speaker: 'person_a',
      originalText: "Bonjour, je viens pour l'entretien d'embauche de Lead Engineer.",
      translatedText: "Hello, I am here for the Lead Engineer job interview.",
      langFrom: 'Français',
      langTo: 'English',
      timestamp: '14:30'
    },
    {
      id: '2',
      speaker: 'person_b',
      originalText: "Welcome! We are very impressed by your profile. Please tell us about your experience.",
      translatedText: "Bienvenue ! Nous sommes très impressionnés par votre profil. Parlez-nous de votre expérience.",
      langFrom: 'English',
      langTo: 'Français',
      timestamp: '14:31'
    }
  ]);

  const swapLanguages = () => {
    const temp = langA;
    setLangA(langB);
    setLangB(temp);
  };

  const getLangMeta = (code: string) => SUPPORTED_LANGS.find(l => l.code === code) || SUPPORTED_LANGS[0];

  const handleSpeakText = (text: string, langCode: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langCode === 'en' ? 'en-US' : langCode === 'fr' ? 'fr-FR' : 'fr-FR';
    window.speechSynthesis.speak(utterance);
  };

  const handleSendMessage = (speaker: 'person_a' | 'person_b', text: string) => {
    if (!text.trim()) return;

    setIsTranslating(true);
    const sourceLang = speaker === 'person_a' ? getLangMeta(langA) : getLangMeta(langB);
    const targetLang = speaker === 'person_a' ? getLangMeta(langB) : getLangMeta(langA);

    setTimeout(() => {
      // Mock translated output
      let translated = "";
      if (speaker === 'person_a') {
        translated = `[Translated to ${targetLang.label}] ${text}`;
        setInputTextA('');
      } else {
        translated = `[Traduit en ${targetLang.label}] ${text}`;
        setInputTextB('');
      }

      const newMsg: MessageItem = {
        id: Date.now().toString(),
        speaker,
        originalText: text,
        translatedText: translated,
        langFrom: sourceLang.label,
        langTo: targetLang.label,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, newMsg]);
      setIsTranslating(false);
      
      // Speak target translation
      handleSpeakText(translated, speaker === 'person_a' ? langB : langA);
    }, 600);
  };

  if (!isOpen) return null;

  const metaA = getLangMeta(langA);
  const metaB = getLangMeta(langB);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bilingual-title"
    >
      <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center text-white font-black shadow-md">
              <Languages size={22} />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase text-orange-400 tracking-wider">
                Traduction Universelle & Directe
              </span>
              <h2 id="bilingual-title" className="text-lg font-bold text-white tracking-tight">
                Mode Conversation Bilingue Face-à-Face
              </h2>
            </div>
          </div>

          {/* Quick Lang Switcher in Header */}
          <div className="flex items-center gap-2 bg-slate-800 p-1 rounded-xl border border-slate-700">
            <select
              value={langA}
              onChange={(e) => setLangA(e.target.value)}
              className="bg-transparent text-xs font-bold text-white px-2 py-1 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGS.map(l => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>

            <button
              onClick={swapLanguages}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700 transition-colors"
              title="Inverser les langues"
            >
              <ArrowRightLeft size={14} />
            </button>

            <select
              value={langB}
              onChange={(e) => setLangB(e.target.value)}
              className="bg-transparent text-xs font-bold text-white px-2 py-1 focus:outline-none cursor-pointer"
            >
              {SUPPORTED_LANGS.map(l => (
                <option key={l.code} value={l.code} className="bg-slate-900 text-white">
                  {l.flag} {l.label}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
            aria-label="Fermer la conversation bilingue"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Conversation Stream */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50">
          <div className="text-center">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-slate-200 shadow-xs">
              Échange en direct • Détection vocale et restitution fluide
            </span>
          </div>

          {messages.map((msg) => {
            const isA = msg.speaker === 'person_a';
            return (
              <div 
                key={msg.id} 
                className={`flex flex-col ${isA ? 'items-start' : 'items-end'}`}
              >
                <div className={`max-w-[85%] rounded-2xl p-4 shadow-xs space-y-2 border ${
                  isA 
                    ? 'bg-white border-slate-200 text-slate-900' 
                    : 'bg-slate-900 border-slate-800 text-white'
                }`}>
                  <div className="flex items-center justify-between gap-3 text-[11px] font-bold opacity-70 border-b pb-1.5 border-slate-100 dark:border-slate-800">
                    <span>{isA ? `Interlocuteur A (${msg.langFrom})` : `Interlocuteur B (${msg.langFrom})`}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  <p className="text-sm font-medium leading-snug">
                    {msg.originalText}
                  </p>

                  <div className={`pt-2 border-t flex items-center justify-between gap-2 ${
                    isA ? 'border-slate-100 text-orange-900 bg-orange-50/50 p-2.5 rounded-xl' : 'border-slate-800 text-orange-200 bg-slate-800/80 p-2.5 rounded-xl'
                  }`}>
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-70">
                        Traduit en {msg.langTo} :
                      </span>
                      <p className="text-xs font-semibold mt-0.5">
                        {msg.translatedText}
                      </p>
                    </div>
                    <button
                      onClick={() => handleSpeakText(msg.translatedText, isA ? langB : langA)}
                      className="p-1.5 rounded-lg bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 transition-colors shrink-0"
                      title="Écouter la traduction"
                    >
                      <Volume2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dual Input Split Controls */}
        <div className="p-4 bg-white border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Person A Control Box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span>{metaA.flag}</span>
                <span>Interlocuteur A ({metaA.label})</span>
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Parler ou écrire en ${metaA.label}...`}
                value={inputTextA}
                onChange={(e) => setInputTextA(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('person_a', inputTextA)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => handleSendMessage('person_a', inputTextA)}
                className="bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 shrink-0"
              >
                Traduire
              </button>
            </div>
          </div>

          {/* Person B Control Box */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <span>{metaB.flag}</span>
                <span>Interlocuteur B ({metaB.label})</span>
              </span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Speak or type in ${metaB.label}...`}
                value={inputTextB}
                onChange={(e) => setInputTextB(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage('person_b', inputTextB)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={() => handleSendMessage('person_b', inputTextB)}
                className="bg-orange-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-orange-700 shrink-0"
              >
                Traduire
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
