import React, { useState, useEffect, useRef } from 'react';
import { 
  Compass, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Sparkles, 
  Volume2, 
  VolumeX, 
  Mic, 
  MicOff, 
  X, 
  HelpCircle, 
  Briefcase, 
  GraduationCap, 
  Globe, 
  FileText, 
  Home, 
  HeartPulse, 
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { useDialogAccessibility } from './useDialogAccessibility';

export interface GuidedStep {
  stepNumber: number;
  title: string;
  subtitle: string;
  audioPrompt: string;
}

interface GuidedModeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: string, context?: any) => void;
}

const COMMON_GOALS = [
  {
    id: 'career',
    title: 'Trouver un emploi ou optimiser mon CV',
    desc: 'Bilan de compétences, CV Maître et préparation aux entretiens',
    icon: Briefcase,
    targetTab: 'career',
    stepsReq: ['Votre profil actuel', 'Vos diplômes ou expériences', 'Le pays ou secteur ciblé']
  },
  {
    id: 'campus',
    title: 'Suivre une formation ou certification',
    desc: 'Cours d\'élite avec Professeur Diallo et validation académique',
    icon: GraduationCap,
    targetTab: 'campus',
    stepsReq: ['Domaine souhaité', 'Niveau actuel', 'Temps disponible par semaine']
  },
  {
    id: 'admin',
    title: 'Faire une démarche de visa ou séjour',
    desc: 'Vérification de dossier consulaire et conformité juridique',
    icon: FileText,
    targetTab: 'admin-procedures',
    stepsReq: ['Passeport en cours de validité', 'Pays de destination', 'Motif du voyage']
  },
  {
    id: 'housing',
    title: 'Trouver un logement ou m\'installer',
    desc: 'Recherche vérifiée, calcul de budget et contrat certifié',
    icon: Home,
    targetTab: 'housing',
    stepsReq: ['Ville cible', 'Budget mensuel', 'Date d\'arrivée prévue']
  },
  {
    id: 'health',
    title: 'Consulter un professionnel de santé',
    desc: 'Orientation médicale confidentielle avec Docteur Diallo',
    icon: HeartPulse,
    targetTab: 'health',
    stepsReq: ['Description du besoin ou symptômes', 'Urgences exclues', 'Préférence de langue']
  },
  {
    id: 'shop',
    title: 'Acheter ou vendre à l\'international (B2B)',
    desc: 'Sourcing fournisseurs vérifiés, Incoterms et paiement sécurisé',
    icon: Globe,
    targetTab: 'shop',
    stepsReq: ['Produit ou matière première', 'Quantité souhaitée', 'Pays de livraison']
  }
];

export const GuidedModeModal: React.FC<GuidedModeModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedGoal, setSelectedGoal] = useState<typeof COMMON_GOALS[0] | null>(null);
  const [userCustomInput, setUserCustomInput] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceAssistance, setVoiceAssistance] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(isOpen, dialogRef, onClose);

  // Voice Speech synthesis
  const speakText = (text: string, force = false) => {
    if ((!voiceAssistance && !force) || !('speechSynthesis' in window)) return;
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
      setVoiceError("La reconnaissance vocale n'est pas prise en charge sur ce navigateur.");
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
      recognition.onerror = () => {
        setIsListening(false);
        setVoiceError("La dictée n’a pas pu démarrer. Vous pouvez saisir les informations au clavier.");
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (currentStep === 1) {
          setUserCustomInput(transcript);
          // Match closest goal
          const matched = COMMON_GOALS.find(g => 
            transcript.toLowerCase().includes('emploi') || 
            transcript.toLowerCase().includes('travail') ||
            transcript.toLowerCase().includes('cv') ? g.id === 'career' :
            transcript.toLowerCase().includes('cours') || 
            transcript.toLowerCase().includes('formation') ? g.id === 'campus' :
            transcript.toLowerCase().includes('visa') || 
            transcript.toLowerCase().includes('papiers') ? g.id === 'admin' :
            transcript.toLowerCase().includes('logement') || 
            transcript.toLowerCase().includes('maison') ? g.id === 'housing' : false
          );
          if (matched) {
            setSelectedGoal(matched);
            goToStep(2, matched);
          }
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
      setVoiceError("La dictée n’a pas pu démarrer. Vous pouvez saisir les informations au clavier.");
    }
  };

  const goToStep = (step: 1 | 2 | 3 | 4, goalObj?: typeof COMMON_GOALS[0]) => {
    setCurrentStep(step);
    const active = goalObj || selectedGoal;
    if (step === 1) {
      speakText("Bienvenue dans le mode guidé. Étape 1 : Dites-moi ou choisissez ce que vous souhaitez accomplir aujourd'hui.");
    } else if (step === 2 && active) {
      speakText(`Étape 2 : Pour ${active.title}, voici les trois éléments dont nous allons avoir besoin.`);
    } else if (step === 3 && active) {
      speakText("Étape 3 : Faisons-le ensemble pas à pas. Répondez simplement aux questions.");
    } else if (step === 4 && active) {
      speakText("Étape 4 : Excellent. Votre dossier est préparé. Vous pouvez maintenant accéder directement au résultat.");
    }
  };

  useEffect(() => {
    if (isOpen) {
      goToStep(1);
    } else {
      stopSpeaking();
    }
    return () => stopSpeaking();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guided-mode-title"
      aria-describedby="guided-mode-description"
    >
      <div className="bg-white w-full max-w-3xl rounded-2xl sm:rounded-[2rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[96dvh] sm:max-h-[90vh]">
        
        {/* Top Guided Bar */}
        <div className="bg-slate-900 text-white p-4 sm:p-6 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="hidden sm:flex w-10 h-10 rounded-xl bg-blue-600 items-center justify-center text-white font-black shadow-md" aria-hidden="true">
              <Compass size={22} />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] sm:text-[11px] uppercase tracking-widest font-black text-blue-300">Mode Guidé • Clarté Absolue</span>
                <span className="bg-white/10 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Étape {currentStep} sur 4</span>
              </div>
              <h2 id="guided-mode-title" className="mt-1 text-base sm:text-xl font-bold text-white tracking-tight leading-tight">
                {currentStep === 1 && "Étape 1 — Dis-moi ce que tu veux faire"}
                {currentStep === 2 && "Étape 2 — Voici ce dont nous avons besoin"}
                {currentStep === 3 && "Étape 3 — Faisons-le ensemble"}
                {currentStep === 4 && "Étape 4 — Voici le résultat"}
              </h2>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
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
                    currentStep === 2 ? `Étape 2 : Voici les éléments requis.` :
                    currentStep === 3 ? "Étape 3 : Remplissons ensemble les informations." :
                    "Étape 4 : Tout est prêt pour continuer.",
                    true,
                  );
                }
              }}
              aria-label={voiceAssistance ? "Désactiver l'assistance vocale" : "Activer l'assistance vocale"}
              aria-pressed={voiceAssistance}
              className={`a11y-touch-target p-2.5 rounded-xl border transition-all ${
                voiceAssistance 
                  ? 'bg-blue-600/20 text-blue-300 border-blue-500/30 hover:bg-blue-600/30' 
                  : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'
              }`}
            >
              {voiceAssistance ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>

            <button
              onClick={onClose}
              className="a11y-touch-target p-2.5 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Fermer le mode guidé"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Step Progress Indicator */}
        <div className="w-full bg-slate-100 h-1.5 flex" role="progressbar" aria-label="Progression du mode guidé" aria-valuemin={1} aria-valuemax={4} aria-valuenow={currentStep}>
          {[1, 2, 3, 4].map(s => (
            <div 
              key={s} 
              className={`flex-1 h-full transition-all duration-300 ${
                s <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
              }`}
              aria-hidden="true"
            />
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-8 overflow-y-auto flex-1 space-y-6" id="guided-mode-description">
          <p className="sr-only" aria-live="polite">Étape {currentStep} sur 4.</p>
          {voiceError && <p className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900" role="alert">{voiceError}</p>}
          
          {/* STEP 1: SELECT GOAL */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col items-stretch justify-between gap-3 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm font-medium text-blue-950">
                  <span className="font-bold">Astuce :</span> Vous pouvez cliquer sur une option ou simplement parler avec le micro.
                </p>
                <button
                  onClick={toggleListening}
                  aria-pressed={isListening}
                  className={`a11y-touch-target px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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
                {COMMON_GOALS.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = selectedGoal?.id === goal.id;
                  return (
                    <button
                      key={goal.id}
                      onClick={() => {
                        setSelectedGoal(goal);
                        goToStep(2, goal);
                      }}
                      aria-pressed={isSelected}
                      className={`min-h-[9rem] p-4 sm:p-5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 group hover:scale-[1.01] ${
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
                            {goal.desc}
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

          {/* STEP 2: REQUIREMENTS */}
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
                  Pour vous amener au meilleur résultat avec l'expert Diallo dédié, nous allons structurer ces 3 informations essentielles :
                </p>
              </div>

              <div className="space-y-3">
                {selectedGoal.stepsReq.map((req, i) => (
                  <div key={i} className="flex items-center gap-3.5 p-4 rounded-xl bg-white border border-slate-200">
                    <span className="w-7 h-7 rounded-full bg-slate-900 text-white text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm font-semibold text-slate-800">{req}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: INTERACTIVE INPUT */}
          {currentStep === 3 && selectedGoal && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-900">
                  Complétez ces précisions (ou dictez-les à voix haute) :
                </h3>
                {selectedGoal.stepsReq.map((req, i) => (
                  <div key={i} className="space-y-1.5">
                    <label htmlFor={`guided-answer-${i}`} className="block text-xs font-bold text-slate-700">
                      {i + 1}. {req}
                    </label>
                    <input
                      id={`guided-answer-${i}`}
                      type="text"
                      placeholder={`Exemple pour ${req.toLowerCase()}...`}
                      value={answers[`req_${i}`] || ''}
                      onChange={(e) => setAnswers({ ...answers, [`req_${i}`]: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
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

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left max-w-lg mx-auto space-y-2">
                <span className="text-[11px] font-bold uppercase text-slate-400">Récapitulatif des données saisies :</span>
                {selectedGoal.stepsReq.map((req, i) => (
                  <div key={i} className="text-xs text-slate-700 flex justify-between border-b border-slate-100 py-1">
                    <span className="text-slate-500">{req} :</span>
                    <span className="font-semibold text-slate-900">{answers[`req_${i}`] || 'Prêt pour l\'expert'}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200 flex flex-col-reverse items-stretch justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex">
            {currentStep > 1 ? (
              <button
                onClick={() => goToStep((currentStep - 1) as any)}
                className="a11y-touch-target w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center justify-center gap-1.5 transition-all"
              >
                <ArrowLeft size={16} /> Précédent
              </button>
            ) : (
              <button
                onClick={onClose}
                className="a11y-touch-target w-full sm:w-auto px-4 py-2 rounded-xl text-slate-500 font-bold text-xs hover:text-slate-800"
              >
                Annuler
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {currentStep === 2 && (
              <button
                onClick={() => goToStep(3)}
                className="a11y-touch-target w-full justify-center bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                <span>Faisons-le ensemble</span>
                <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 3 && (
              <button
                onClick={() => goToStep(4)}
                className="a11y-touch-target w-full justify-center bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-md transition-all"
              >
                <span>Valider mes informations</span>
                <ArrowRight size={16} />
              </button>
            )}

            {currentStep === 4 && selectedGoal && (
              <button
                onClick={() => {
                  onClose();
                  onNavigate(selectedGoal.targetTab, { guidedAnswers: answers });
                }}
                className="a11y-touch-target w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white px-5 sm:px-8 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg hover:scale-105 transition-all"
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
