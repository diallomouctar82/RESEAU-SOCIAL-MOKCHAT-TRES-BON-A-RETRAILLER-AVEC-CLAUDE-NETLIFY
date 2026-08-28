import React, { useState, useRef, useEffect } from 'react';
import { 
  Video, 
  Mic, 
  MicOff, 
  Sparkles, 
  X, 
  Send, 
  Loader2, 
  Volume2, 
  CheckCircle2, 
  Award, 
  RotateCcw, 
  TrendingUp, 
  MessageSquare, 
  Briefcase, 
  DollarSign, 
  Users, 
  Zap,
  Target
} from 'lucide-react';
import { Avatar3D } from '../Avatar3D';
import { generateText, generateJSON, generateSpeech } from '../../services/aiGateway';
import { Coach3DSimulationSession } from '../../types';
import { MOCK_COACH_SESSIONS } from './careerDefaults';

interface CareerCoach3DModalProps {
  userName: string;
  userTitle?: string;
  activeGoalTitle?: string;
  onClose: () => void;
  onRecordSessionScore?: (score: number, mode: string) => void;
}

type SimulationMode = 'interview' | 'pitch' | 'sales_nego' | 'salary_nego' | 'public_speaking';

export const CareerCoach3DModal: React.FC<CareerCoach3DModalProps> = ({
  userName,
  userTitle,
  activeGoalTitle,
  onClose,
  onRecordSessionScore
}) => {
  const [selectedMode, setSelectedMode] = useState<SimulationMode>('interview');
  const [difficulty, setDifficulty] = useState<'debutant' | 'intermediaire' | 'expert'>('intermediaire');
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'speaking' | 'thinking'>('idle');
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  // Evaluation State
  const [lastEvaluation, setLastEvaluation] = useState<{
    score: number;
    feedback: string;
    strengths: string[];
    improvements: string[];
    idealPhrasing: string;
  } | null>(null);

  const [sessionHistory, setSessionHistory] = useState<Coach3DSimulationSession[]>(MOCK_COACH_SESSIONS);
  const [turnCount, setTurnCount] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    // Cleanup AudioContext on unmount
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    };
  }, []);

  const getPersonaDetails = (mode: SimulationMode) => {
    switch(mode) {
      case 'interview':
        return {
          title: 'Entretien d\'Embauche Sélectif',
          persona: 'Directeur des Ressources Humaines exigeant',
          desc: 'Teste votre capacité à valoriser vos réussites et à répondre aux questions déstabilisantes.'
        };
      case 'pitch':
        return {
          title: 'Pitch Projet & Levée de Fonds',
          persona: 'Investisseur Venture Capital & Business Angel',
          desc: 'Évalue la clarté du modèle économique, la taille du marché et la crédibilité de l\'équipe.'
        };
      case 'sales_nego':
        return {
          title: 'Vente & Négociation B2B',
          persona: 'Directeur des Achats Grand Compte',
          desc: 'Entraînez-vous à défendre votre valeur, à traiter les objections de prix et à closer le deal.'
        };
      case 'salary_nego':
        return {
          title: 'Négociation Salariale & TJM',
          persona: 'Vice-Président / Responsable des Rémunérations',
          desc: 'Apprenez à justifier une augmentation ou un tarif journalier élevé avec des arguments chiffrés.'
        };
      case 'public_speaking':
        return {
          title: 'Prise de Parole & Confiance en Soi',
          persona: 'Coach Mental & Maître de l\'Éloquence Diallo',
          desc: 'Travaillez l\'impact vocal, la structure d\'argumentation et la sérénité sous pression.'
        };
    }
  };

  // TTS Speech Engine
  const speakText = async (text: string) => {
    setAvatarState('speaking');
    try {
      const base64 = await generateSpeech(text, { voiceId: 'Fenrir' });
      if (base64) {
        const audio = new Audio(`data:audio/mpeg;base64,${base64}`);
        audio.onended = () => setAvatarState('idle');
        audio.onerror = () => setAvatarState('idle');
        await audio.play();
      } else {
        setAvatarState('idle');
      }
    } catch (e) {
      console.warn("TTS Error", e);
      setAvatarState('idle');
    }
  };

  // Start Voice Recognition (Web Speech API)
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
      setUserAnswer(prev => prev ? `${prev} ${transcript}` : transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  };

  // Start Simulation Session
  const handleStartSimulation = async () => {
    setIsSessionActive(true);
    setIsThinking(true);
    setAvatarState('thinking');
    setLastEvaluation(null);
    setUserAnswer('');
    setTurnCount(1);

    const persona = getPersonaDetails(selectedMode);

    try {
      const prompt = `Tu es le Coach 3D interactif de Le Monde à Vous.
        Rôle: ${persona.persona}.
        Mode: ${persona.title}.
        Difficulté: ${difficulty}.
        Candidat: ${userName} (${userTitle || 'Professionnel'}).
        Objectif du candidat: ${activeGoalTitle || 'Réussir la mission'}.

        Pose la première question percutante et réaliste de la simulation. Sois concis, direct et immersif (maximum 2 phrases).`;

      const res = await generateText(prompt);
      const q = res?.trim() || `Bonjour ${userName}, présentez-vous et expliquez pourquoi votre proposition est la plus pertinente.`;
      setCurrentQuestion(q);
      speakText(q);
    } catch (e) {
      console.error(e);
      setCurrentQuestion(`Bonjour ${userName}. Quelle est votre plus grande réussite professionnelle récente ?`);
    } finally {
      setIsThinking(false);
    }
  };

  // Submit Answer & Evaluate
  const handleSubmitAnswer = async () => {
    if (!userAnswer.trim()) return;
    if (isListening && speechRecognitionRef.current) {
      speechRecognitionRef.current.stop();
      setIsListening(false);
    }

    setIsThinking(true);
    setAvatarState('thinking');

    const persona = getPersonaDetails(selectedMode);

    try {
      const apiKey = process.env.API_KEY || (window as any).GEMINI_API_KEY;
      if (apiKey) {
        const ai = new GoogleGenAI({ apiKey });
        const prompt = `Tu es un examinateur expert et coach professionnel d'élite.
        Contexte: ${persona.title} (${persona.persona}).
        Question posée: "${currentQuestion}"
        Réponse de l'utilisateur: "${userAnswer}"

        Fournis une évaluation rigoureuse en JSON strict :
        {
          "score": 8.5, // Note sur 10
          "feedback": "Explication claire et constructive en 2 phrases...",
          "strengths": ["Force 1", "Force 2"],
          "improvements": ["Point à corriger"],
          "idealPhrasing": "Exemple de reformulation percutante...",
          "nextQuestion": "La prochaine question difficile pour continuer la simulation..."
        }`;

        const res = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: { responseMimeType: 'application/json' }
        });

        const evalData = JSON.parse(res.text || '{}');
        const score = evalData.score || 8.0;

        setLastEvaluation({
          score: score,
          feedback: evalData.feedback || 'Bonne réponse dans l\'ensemble.',
          strengths: evalData.strengths || ['Clarté du propos'],
          improvements: evalData.improvements || ['Ajouter des chiffres concrets'],
          idealPhrasing: evalData.idealPhrasing || 'Une réponse plus percutante aurait inclus un exemple mesuré.'
        });

        if (onRecordSessionScore) {
          onRecordSessionScore(score, persona.title);
        }

        // Add to history
        const newSessionRecord: Coach3DSimulationSession = {
          id: `sim-${Date.now()}`,
          type: selectedMode,
          roleplayPersona: persona.persona,
          contextTitle: persona.title,
          difficulty: difficulty,
          turnCount: turnCount,
          performanceScore: score,
          strengths: evalData.strengths || ['Assurance'],
          improvements: evalData.improvements || ['Précision'],
          idealPhrasingSuggested: evalData.idealPhrasing || '',
          date: 'À l\'instant'
        };

        setSessionHistory(prev => [newSessionRecord, ...prev.slice(0, 4)]);

        // Next Question
        if (evalData.nextQuestion) {
          setTimeout(() => {
            setCurrentQuestion(evalData.nextQuestion);
            setUserAnswer('');
            setTurnCount(prev => prev + 1);
            speakText(evalData.nextQuestion);
          }, 3500);
        }

      }
    } catch (e) {
      console.error(e);
      setLastEvaluation({
        score: 7.5,
        feedback: 'Réponse claire et audible. Approfondissez les résultats chiffrés.',
        strengths: ['Bonne élocution', 'Pertinence'],
        improvements: ['Illustrer par une métrique de ROI'],
        idealPhrasing: 'Par exemple : J\'ai permis de réduire les délais de 35% tout en doublant le volume.'
      });
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 text-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* HEADER */}
        <div className="p-5 md:p-6 bg-slate-950 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600/30 border border-blue-500/40 text-blue-400 rounded-2xl">
              <Video size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Coach 3D Vocal & Simulateur</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-extrabold border border-blue-700/50">
                  Diallo Intelligence
                </span>
              </div>
              <h2 className="text-lg md:text-xl font-black">
                Entraînement & Prise de Confiance
              </h2>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* SIMULATION MODE PICKER (IF NOT ACTIVE) */}
        {!isSessionActive && (
          <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 bg-slate-900">
            <div>
              <h3 className="text-lg font-black text-white mb-1">
                Choisissez votre scénario d'entraînement
              </h3>
              <p className="text-xs text-slate-400">
                Le Coach 3D adopte la posture, le ton et les questions exactes de votre futur interlocuteur.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { id: 'interview', label: 'Entretien d\'Embauche', icon: Briefcase, desc: 'Recruteur RH sélectif' },
                { id: 'pitch', label: 'Pitch Projet & Levée', icon: Sparkles, desc: 'Investisseur VC & Business Angel' },
                { id: 'sales_nego', label: 'Vente & Closing B2B', icon: Users, desc: 'Directeur des Achats' },
                { id: 'salary_nego', label: 'Négociation Salariale', icon: DollarSign, desc: 'Manager / Décideur RH' },
                { id: 'public_speaking', label: 'Prise de Parole & Confiance', icon: Zap, desc: 'Coach d\'Éloquence Diallo' }
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setSelectedMode(mode.id as any)}
                  className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                    selectedMode === mode.id 
                      ? 'bg-blue-600/30 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-slate-900/60 rounded-xl text-blue-400">
                      <mode.icon size={18} />
                    </div>
                    <span className="font-bold text-sm text-white">{mode.label}</span>
                  </div>
                  <p className="text-xs text-slate-400">{mode.desc}</p>
                </button>
              ))}
            </div>

            {/* Difficulty Selector */}
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Niveau d'exigence :</span>
              {(['debutant', 'intermediaire', 'expert'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setDifficulty(lvl)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-all ${
                    difficulty === lvl ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                onClick={handleStartSimulation}
                className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl font-black text-sm shadow-xl shadow-blue-600/30 flex items-center gap-2 transition-all"
              >
                <Video size={18} /> Démarrer la session en direct
              </button>
            </div>
          </div>
        )}

        {/* ACTIVE SIMULATION INTERFACE */}
        {isSessionActive && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* 3D AVATAR VIEWPORT */}
            <div className="flex-1 bg-black relative flex flex-col items-center justify-center p-4 min-h-[300px] md:min-h-[460px]">
              <Avatar3D 
                avatarId="3" 
                state={avatarState}
                className="w-full h-full object-cover"
              />

              {/* Status Badge */}
              <div className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-full text-white text-xs font-bold border border-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>Coach : Conseiller Diallo ({getPersonaDetails(selectedMode).persona})</span>
              </div>

              {/* Question Subtitles Box */}
              <div className="absolute bottom-6 left-6 right-6 text-center">
                <div className="bg-black/75 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl max-w-2xl mx-auto">
                  <div className="text-[10px] text-blue-400 font-bold uppercase tracking-wider mb-1 flex items-center justify-center gap-1.5">
                    <Volume2 size={12} /> Question #{turnCount}
                  </div>
                  <h3 className="text-sm md:text-base font-bold text-white leading-snug">
                    "{currentQuestion || 'Préparation de la question...'}"
                  </h3>
                </div>
              </div>
            </div>

            {/* RESPONSE & EVALUATION SIDEBAR */}
            <div className="w-full md:w-96 bg-slate-950 p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-800 overflow-y-auto max-h-[460px]">
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-yellow-400" /> Votre Réponse Vocale ou Écrite
                  </h4>
                  <button
                    onClick={toggleSpeechRecognition}
                    className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all ${
                      isListening ? 'bg-red-600 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                    <span>{isListening ? 'Écoute...' : 'Micro'}</span>
                  </button>
                </div>

                <textarea
                  value={userAnswer}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Parlez au micro ou tapez votre réponse ici..."
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-2xl p-3.5 text-xs text-white placeholder-slate-500 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                />

                <button
                  onClick={handleSubmitAnswer}
                  disabled={isThinking || !userAnswer.trim()}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                >
                  {isThinking ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>{isThinking ? 'Analyse du Coach...' : 'Envoyer & Évaluer'}</span>
                </button>

                {/* REAL-TIME EVALUATION CARD */}
                {lastEvaluation && (
                  <div className="p-4 bg-slate-900 border border-blue-500/40 rounded-2xl space-y-2.5 animate-fade-up">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Score Performance</span>
                      <span className="text-base font-black text-emerald-400">{lastEvaluation.score} / 10</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {lastEvaluation.feedback}
                    </p>

                    {lastEvaluation.idealPhrasing && (
                      <div className="p-2.5 bg-blue-950/60 rounded-xl border border-blue-800/50 text-[11px] text-blue-200">
                        <strong className="block text-blue-300">💡 Formulation idéale :</strong>
                        "{lastEvaluation.idealPhrasing}"
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* FOOTER ACTIONS */}
              <div className="pt-4 border-t border-slate-800 flex justify-between gap-2">
                <button
                  onClick={() => setIsSessionActive(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all"
                >
                  Changer de Scénario
                </button>
                <button
                  onClick={handleStartSimulation}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <RotateCcw size={13} /> Recommencer
                </button>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
