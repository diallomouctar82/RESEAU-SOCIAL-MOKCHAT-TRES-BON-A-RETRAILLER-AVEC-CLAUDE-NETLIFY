import React, { useState, useEffect } from 'react';
import {
  Compass,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  X
} from 'lucide-react';
import { useGoal, GoalTemplate } from '../../contexts/GoalContext';

interface GuidedModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, context?: any) => void;
}

export const GuidedModeModal: React.FC<GuidedModeModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { goalTemplates, setCurrentGoal } = useGoal();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGoal, setSelectedGoal] = useState<GoalTemplate | null>(null);
  const [details, setDetails] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceAssistance, setVoiceAssistance] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Voice Speech synthesis
  const speakText = (text: string) => {
    if (!voiceAssistance || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'fr-FR';
    utterance.rate = 0.95; // slightly slower for high clarity
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Voice speech recognition
  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("La reconnaissance vocale n'est pas prise en charge sur ce navigateur.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'fr-FR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript.toLowerCase();
        if (currentStep !== 1) return;

        let matchedId: string | false =
          transcript.includes('emploi') || transcript.includes('travail') || transcript.includes('cv') ? 'goal-career' :
          transcript.includes('cours') || transcript.includes('formation') || transcript.includes('étudier') ? 'goal-education' :
          transcript.includes('visa') || transcript.includes('papiers') || transcript.includes('démarche') ? 'goal-admin' :
          transcript.includes('logement') || transcript.includes('maison') ? 'goal-housing' :
          transcript.includes('santé') || transcript.includes('médecin') ? 'goal-health' :
          transcript.includes('entreprise') || transcript.includes('import') || transcript.includes('export') ? 'goal-business' :
          transcript.includes('langue') ? 'goal-languages' : false;

        const matched = matchedId ? goalTemplates.find(g => g.id === matchedId) : undefined;
        if (matched) {
          setSelectedGoal(matched);
          goToStep(2, matched);
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const goToStep = (step: 1 | 2 | 3 | 4, goalObj?: GoalTemplate) => {
    setCurrentStep(step);
    const active = goalObj || selectedGoal;
    if (step === 1) {
      speakText("Bienvenue dans le mode guidé. Étape 1 : Dites-moi ou choisissez ce que vous souhaitez accomplir aujourd'hui.");
    } else if (step === 2 && active) {
      speakText(`Étape 2 : Pour ${active.title}, voici comment nous allons procéder ensemble.`);
    } else if (step === 3 && active) {
      speakText("Étape 3 : Si vous le souhaitez, ajoutez une précision sur votre situation. C'est facultatif.");
    } else if (step === 4 && active) {
      speakText("Étape 4 : Excellent. Vous pouvez maintenant accéder directement au module avec votre conseiller.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSelectedGoal(null);
      setDetails('');
      goToStep(1);
    } else {
      stopSpeaking();
    }
    return () => stopSpeaking();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-mode-title"
    >
      <div className="bg-white w-full max-w-3xl rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">

        {/* Top Guided Bar */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
              <Compass size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-widest font-black text-blue-300">Mode Guidé • Clarté Absolue</span>
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Étape {currentStep} sur 4</span>
              </div>
              <h2 id="guided-mode-title" className="text-xl font-bold text-white tracking-tight">
                {currentStep === 1 && "Étape 1 — Dis-moi ce que tu veux faire"}
                {currentStep === 2 && "Étape 2 — Voici comment nous allons procéder"}
                {currentStep === 3 && "Étape 3 — Une précision à ajouter ?"}
                {currentStep === 4 && "Étape 4 — Voici le résultat"}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Voice Guide Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                  setVoiceAssistance(false);
                } else {
                  setVoiceAssistance(true);
                  speakText(
                    currentStep === 1 ? "Étape 1 : Choisissez ce que vous souhaitez accomplir." :
                    currentStep === 2 ? `Étape 2 : Voici comment nous allons procéder.` :
                    currentStep === 3 ? "Étape 3 : Ajoutez une précision si vous le souhaitez." :
                    "Étape 4 : Tout est prêt pour continuer."
                  );
                }
              }}
              aria-label={voiceAssistance ? "Désactiver l'assistance vocale" : "Activer l'assistance vocale"}
              className={`p-2.5 rounded-xl border transition-all ${
                voiceAssistance
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30'
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {voiceAssistance ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Fermer le mode guidé"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="w-full bg-slate-100 h-1.5 flex">
          {[1, 2, 3, 4].map(s => (
            <div
              key={s}
              className={`flex-1 h-full transition-all duration-300 ${
                s <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
              }`}
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 overflow-y-auto flex-1 space-y-6">

          {/* STEP 1: SELECT GOAL */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex items-center justify-between gap-4">
                <p className="text-sm font-medium text-blue-950">
                  <span className="font-bold">Astuce :</span> Vous pouvez cliquer sur une option ou simplement parler avec le micro.
                </p>
                <button
                  onClick={toggleListening}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    isListening
                      ? 'bg-rose-600 text-white animate-pulse'
                      : 'bg-white text-slate-800 border border-slate-200 shadow-xs hover:bg-slate-50'
                  }`}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} className="text-blue-600" />}
                  <span>{isListening ? "Écoute en cours..." : "Parler"}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {goalTemplates.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoal?.id === goal.id;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => {
                        setSelectedGoal(goal);
                        goToStep(2, goal);
                      }}
                      className={`p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group hover:scale-[1.01] ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 group-hover:bg-blue-100 flex items-center justify-center text-slate-800 group-hover:text-blue-600 transition-colors shrink-0">
                          <Icon size={24} />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-sm leading-snug">
                            {goal.title}
                          </h3>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                            {goal.category} • Guidé par {goal.leadAgent}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-end text-xs font-bold text-blue-600 pt-2 border-t border-slate-100">
                        <span>Choisir</span>
                        <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: PROCESS OVERVIEW */}
          {currentStep === 2 && selectedGoal && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
                    <CheckCircle2 size={20} />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-blue-600 uppercase">Objectif Sélectionné</span>
                    <h3 className="text-lg font-black text-slate-900">{selectedGoal.title}</h3>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Voici comment {selectedGoal.leadAgent} va vous accompagner, étape par étape :
                </p>
              </div>

              <div className="space-y-3">
                {selectedGoal.steps.map((step, i) => (
                  <div key={i} className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{step}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: OPTIONAL DETAILS */}
          {currentStep === 3 && selectedGoal && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2">
                <h3 className="text-base font-bold text-slate-900">
                  Une précision sur votre situation ? (ou dictez-la à voix haute)
                </h3>
                <p className="text-xs text-slate-500">
                  Cette étape est facultative — vous pouvez aussi passer directement à la suite.
                </p>
              </div>
              <textarea
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                rows={4}
                placeholder="Exemple : je suis surtout disponible en soirée, ou j'ai déjà un dossier en cours..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* STEP 4: RESULT & LAUNCH */}
          {currentStep === 4 && selectedGoal && (
            <div className="space-y-6 text-center py-4 animate-fade-in">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 size={36} />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h3 className="text-2xl font-black text-slate-900">Tout est prêt !</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Votre dossier d'orientation a été initialisé. Vous allez être dirigé directement vers le module <strong className="text-slate-900">{selectedGoal.title}</strong> avec votre conseiller.
                </p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-lg mx-auto space-y-1">
                <span className="text-[11px] font-bold uppercase text-slate-400">Précision ajoutée :</span>
                <p className="text-xs text-slate-700">{details.trim() || 'Aucune — votre conseiller partira du diagnostic standard.'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            {currentStep > 1 ? (
              <button
                onClick={() => goToStep((currentStep - 1) as any)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft size={16} /> Précédent
              </button>
            ) : (
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-slate-500 font-bold text-xs hover:text-slate-800"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <button
                onClick={() => goToStep(3)}
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Continuer</span>
                <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={() => goToStep(4)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
              >
                <span>Valider</span>
                <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 4 && selectedGoal && (
              <button
                onClick={() => {
                  setCurrentGoal(selectedGoal);
                  onClose();
                  onNavigate(selectedGoal.targetTab, { guidedAnswers: { details } });
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
              >
                <span>Ouvrir {selectedGoal.title}</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
