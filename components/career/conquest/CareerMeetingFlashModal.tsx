import React, { useState } from 'react';
import { 
  Zap, 
  Clock, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  ShieldAlert, 
  ChevronRight, 
  ChevronLeft, 
  Sparkles, 
  DollarSign, 
  FileText, 
  TrendingUp, 
  MessageSquare,
  HelpCircle
} from 'lucide-react';
import { QuickMeetingFlashCard, RadarOpportunityItem } from '../../../types';

interface CareerMeetingFlashModalProps {
  flashCard: QuickMeetingFlashCard;
  opportunity: RadarOpportunityItem;
  onClose: () => void;
}

export const CareerMeetingFlashModal: React.FC<CareerMeetingFlashModalProps> = ({
  flashCard,
  opportunity,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'flash_memo' | 'drill_5min'>('flash_memo');
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);

  const questions = flashCard.probableQuestionsAndBestAnswers || [];

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 text-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] border border-slate-800">
        
        {/* HEADER BAR */}
        <div className="p-5 bg-slate-950 flex justify-between items-center shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl animate-pulse">
              <Clock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Cockpit Flash Express</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-extrabold border border-amber-800/60">
                  Rendez-vous imminent
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black truncate max-w-md">
                {opportunity.entity} · {opportunity.title}
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

        {/* MODE SWITCHER */}
        <div className="flex bg-slate-950 px-6 border-b border-slate-800 gap-2">
          <button
            onClick={() => setActiveTab('flash_memo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'flash_memo'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText size={14} />
            <span>Fiche Synthétique 30 Min</span>
          </button>

          <button
            onClick={() => { setActiveTab('drill_5min'); setCurrentCardIndex(0); setShowAnswer(false); }}
            className={`py-3 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'drill_5min'
                ? 'border-amber-500 text-amber-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap size={14} />
            <span>Répétition Flash 5 Min ({questions.length} questions)</span>
          </button>
        </div>

        {/* BODY CONTENT */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-900 space-y-6">
          
          {/* TAB 1: FLASH MEMO */}
          {activeTab === 'flash_memo' && (
            <div className="space-y-5 text-xs">
              
              {/* INTERLOCUTOR & GOAL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interlocuteur :</span>
                  <p className="text-sm font-bold text-white">{flashCard.interlocutorName}</p>
                  <p className="text-xs text-blue-400">{flashCard.interlocutorRole} chez {flashCard.entityName}</p>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Objectif Clé du Rendez-vous :</span>
                  <p className="text-xs font-bold text-emerald-400 leading-snug">{flashCard.meetingObjective}</p>
                </div>
              </div>

              {/* 3 MUST NOT FORGET */}
              <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <AlertCircle size={14} />
                  <span>3 Éléments Cardinaux à ne Pas Oublier :</span>
                </div>
                <div className="space-y-1.5">
                  {flashCard.threeMustNotForget.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                      <span className="text-amber-400 font-black">#{idx + 1}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* FLASH PITCH TO DELIVER */}
              <div className="p-4 bg-slate-950 border border-blue-500/30 rounded-2xl space-y-2">
                <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles size={12} className="text-yellow-400" /> Pitch d'Introduction Prêt à Prononcer (30s)
                </span>
                <p className="text-xs md:text-sm text-slate-200 font-sans leading-relaxed bg-slate-900/80 p-3 rounded-xl border border-slate-800">
                  "{flashCard.flashPitchToDeliver}"
                </p>
              </div>

              {/* NEGOTIATION BORDERS */}
              {flashCard.negotiationBorders && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-300 uppercase tracking-wider">
                    <DollarSign size={14} className="text-emerald-400" />
                    <span>Lignes Rouges & Négociation :</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Cible Optimale :</span>
                      <span className="font-bold text-emerald-400 text-sm">{flashCard.negotiationBorders.target}</span>
                    </div>
                    <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Seuil Minimal Non Négociable :</span>
                      <span className="font-bold text-rose-400 text-sm">{flashCard.negotiationBorders.walkAwayMin}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Leviers de négociation :</span>
                    <ul className="space-y-1">
                      {flashCard.negotiationBorders.leveragePoints.map((lev, idx) => (
                        <li key={idx} className="text-slate-300 text-xs flex items-center gap-1.5">
                          <span className="text-blue-400">✓</span> {lev}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: DRILL 5 MIN */}
          {activeTab === 'drill_5min' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400 font-bold">Question {currentCardIndex + 1} sur {questions.length}</span>
                <span className="text-amber-400 font-semibold">Mode Flash Card Interactif</span>
              </div>

              {questions.length > 0 ? (
                <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 text-center min-h-[260px] flex flex-col justify-between">
                  <div className="space-y-3">
                    <span className="inline-block p-2 bg-blue-900/40 text-blue-400 rounded-xl border border-blue-800/50">
                      <HelpCircle size={22} />
                    </span>
                    <h3 className="text-base md:text-lg font-black text-white max-w-xl mx-auto leading-snug">
                      "{questions[currentCardIndex].question}"
                    </h3>
                  </div>

                  {showAnswer ? (
                    <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl space-y-2 animate-fade-up text-left">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 size={12} /> Réponse d'Impact / Punchline recommandée :
                      </span>
                      <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-medium">
                        "{questions[currentCardIndex].punchline}"
                      </p>
                    </div>
                  ) : (
                    <div>
                      <button
                        onClick={() => setShowAnswer(true)}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
                      >
                        Afficher la réponse d'impact
                      </button>
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                    <button
                      onClick={() => {
                        if (currentCardIndex > 0) {
                          setCurrentCardIndex(prev => prev - 1);
                          setShowAnswer(false);
                        }
                      }}
                      disabled={currentCardIndex === 0}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <ChevronLeft size={14} /> Précédente
                    </button>

                    <button
                      onClick={() => {
                        if (currentCardIndex < questions.length - 1) {
                          setCurrentCardIndex(prev => prev + 1);
                          setShowAnswer(false);
                        }
                      }}
                      disabled={currentCardIndex >= questions.length - 1}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-30 text-white rounded-xl text-xs font-bold flex items-center gap-1"
                    >
                      <span>Suivante</span>
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-8">Aucune question flash enregistrée pour cette opportunité.</p>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
