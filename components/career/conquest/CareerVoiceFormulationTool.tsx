import React, { useState, useRef } from 'react';
import { 
  Mic, 
  MicOff, 
  Sparkles, 
  Copy, 
  Check, 
  RotateCcw, 
  ArrowRight, 
  Loader2, 
  Languages, 
  Zap, 
  HeartHandshake,
  TrendingUp,
  Volume2
} from 'lucide-react';
import { AIProxyClient } from '../../../services/aiProxy';

interface CareerVoiceFormulationToolProps {
  onApplyFormulation?: (text: string) => void;
  contextOpportunityTitle?: string;
  contextEntityName?: string;
}

type FormulationTone = 'percutant' | 'court' | 'naturel' | 'anglais' | 'authentique';

export const CareerVoiceFormulationTool: React.FC<CareerVoiceFormulationToolProps> = ({
  onApplyFormulation,
  contextOpportunityTitle,
  contextEntityName
}) => {
  const [rawInput, setRawInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const [selectedTone, setSelectedTone] = useState<FormulationTone>('percutant');
  const [polishedResult, setPolishedResult] = useState('');
  const [copied, setCopied] = useState(false);

  const speechRecognitionRef = useRef<any>(null);

  const toggleSpeechRecognition = () => {
    if (isListening) {
      if (speechRecognitionRef.current) speechRecognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas supportée sur ce navigateur.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'fr-FR';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      setRawInput(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);

    speechRecognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  const handleTransform = async (overrideTone?: FormulationTone) => {
    const toneToUse = overrideTone || selectedTone;
    if (overrideTone) setSelectedTone(overrideTone);
    if (!rawInput.trim()) return;

    setIsTransforming(true);

    try {
      const apiKey = true;
      if (apiKey) {
        const ai = new AIProxyClient();

        const toneInstructions: Record<FormulationTone, string> = {
          percutant: 'Style exécutif, percutant, orienté résultats et chiffres, crédible au niveau C-Level.',
          court: 'Style ultra concis, sans fioritures (2 phrases maximum), droit au but.',
          naturel: 'Style fluide, chaleureux, professionnel sans être rigide ni ampoulé.',
          anglais: 'Traduction en anglais professionnel d\'élite (Global Business English).',
          authentique: 'Ton personnel, sincère, incarné, mettant en valeur la motivation profonde.'
        };

        const prompt = `Tu es le Copilote de Formulation Vocale et Écrite de la Famille Diallo (Le Monde à Vous).
Idée brute formulée spontanément par l'utilisateur :
"${rawInput}"

Contexte de l'opportunité : ${contextOpportunityTitle || 'Mission professionnelle'} chez ${contextEntityName || 'Organisation cible'}.
Consigne de ton : ${toneInstructions[toneToUse]}.

Transforme cette idée brute en un texte professionnel impeccable prêt à être envoyé ou prononcé.
Ne mets pas de texte d'introduction ni de conclusion, renvoie UNIQUEMENT le texte reformulé.`;

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ parts: [{ text: prompt }] }]
        });

        setPolishedResult(res.text?.trim() || '');
      } else {
        // Fallback intelligent
        if (toneToUse === 'court') {
          setPolishedResult(`Fort de mon expertise opérationnelle, je m'engage à accélérer vos résultats sur ${contextOpportunityTitle || 'cette mission'} avec une exécution mesurable.`);
        } else if (toneToUse === 'anglais') {
          setPolishedResult(`With extensive leadership in this field, I am eager to deliver immediate and measurable value for ${contextEntityName || 'your organization'}.`);
        } else {
          setPolishedResult(`Mon parcours de 8 années m'a permis de développer une méthode éprouvée pour répondre exactement aux exigences de ${contextOpportunityTitle || 'votre projet'}, garantissant rigueur et conformité.`);
        }
      }
    } catch (e) {
      console.error(e);
      setPolishedResult(rawInput);
    } finally {
      setIsTransforming(false);
    }
  };

  const copyToClipboard = () => {
    if (!polishedResult) return;
    navigator.clipboard.writeText(polishedResult);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 md:p-6 text-white space-y-4 shadow-xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-600/30 text-blue-400 rounded-xl border border-blue-500/40">
            <Mic size={18} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Assistant de Formulation Vocale & Stylistique</span>
              <span className="text-[10px] bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full font-bold border border-blue-700/50">
                IA Diallo
              </span>
            </h4>
            <p className="text-xs text-slate-400">
              Parlez ou écrivez naturellement votre idée : l'IA la convertit en argumentaire percutant.
            </p>
          </div>
        </div>

        <button
          onClick={toggleSpeechRecognition}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
            isListening 
              ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/30' 
              : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
          }`}
        >
          {isListening ? <MicOff size={14} /> : <Mic size={14} />}
          <span>{isListening ? 'Écoute en direct...' : 'Parler au micro'}</span>
        </button>
      </div>

      {/* RAW INPUT TEXTAREA */}
      <div className="relative">
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          placeholder='Exemple : "Je veux lui expliquer que j’ai travaillé cinq ans dans la distribution et que je peux développer leur marché en Guinée."'
          className="w-full h-24 bg-slate-950/80 border border-slate-800 rounded-2xl p-3 text-xs text-white placeholder-slate-500 resize-none outline-none focus:ring-2 focus:ring-blue-500"
        />
        {rawInput && (
          <button
            onClick={() => setRawInput('')}
            className="absolute top-2 right-2 p-1 text-slate-500 hover:text-slate-300 text-xs"
            title="Effacer"
          >
            <RotateCcw size={12} />
          </button>
        )}
      </div>

      {/* TONE SWITCHER CHIPS */}
      <div className="flex flex-wrap items-center gap-2 pt-1">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">Ton & Format :</span>
        {[
          { id: 'percutant', label: 'Plus Percutant & Chiffré', icon: TrendingUp },
          { id: 'court', label: 'Plus Court (2 phrases)', icon: Zap },
          { id: 'naturel', label: 'Plus Naturel', icon: HeartHandshake },
          { id: 'anglais', label: 'En Anglais (Business)', icon: Languages },
          { id: 'authentique', label: 'Authentique & Passionné', icon: Sparkles }
        ].map((tone) => (
          <button
            key={tone.id}
            onClick={() => handleTransform(tone.id as FormulationTone)}
            disabled={!rawInput.trim() || isTransforming}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              selectedTone === tone.id && polishedResult
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-40'
            }`}
          >
            <tone.icon size={13} />
            <span>{tone.label}</span>
          </button>
        ))}
      </div>

      {/* GENERATING INDICATOR */}
      {isTransforming && (
        <div className="p-4 bg-slate-950/60 rounded-2xl flex items-center justify-center gap-2 text-xs text-blue-400 font-bold border border-blue-900/40 animate-pulse">
          <Loader2 size={16} className="animate-spin" />
          <span>Transformation stylistique en cours...</span>
        </div>
      )}

      {/* POLISHED RESULT BOX */}
      {polishedResult && !isTransforming && (
        <div className="p-4 bg-slate-950 border border-blue-500/40 rounded-2xl space-y-3 animate-fade-up">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={13} className="text-yellow-400" />
              Formulation Professionnelle Recommandée
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={copyToClipboard}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium flex items-center gap-1 transition-all"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                <span>{copied ? 'Copié' : 'Copier'}</span>
              </button>
              {onApplyFormulation && (
                <button
                  onClick={() => onApplyFormulation(polishedResult)}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-all"
                >
                  <span>Insérer</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans bg-slate-900/80 p-3 rounded-xl border border-slate-800">
            "{polishedResult}"
          </p>
        </div>
      )}
    </div>
  );
};
