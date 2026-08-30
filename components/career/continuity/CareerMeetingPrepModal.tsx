import React from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  Briefcase, 
  Target, 
  CheckCircle2, 
  HelpCircle, 
  FileText, 
  Video, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  X
} from 'lucide-react';
import { CareerScheduledMeeting, CareerLiveDossier } from '../../../types';

interface CareerMeetingPrepModalProps {
  meeting: CareerScheduledMeeting;
  dossier: CareerLiveDossier;
  onLaunchCoach3D?: () => void;
  onOpenFlashSheet?: () => void;
  onClose: () => void;
}

export const CareerMeetingPrepModal: React.FC<CareerMeetingPrepModalProps> = ({
  meeting,
  dossier,
  onLaunchCoach3D,
  onOpenFlashSheet,
  onClose
}) => {
  const { flashPrepCard } = meeting;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Fiche de Préparation Automatique
              </span>
              <span className="text-xs text-slate-300 font-bold flex items-center gap-1">
                <Clock size={12} /> {meeting.date} • {meeting.time}
              </span>
            </div>
            <h2 className="text-xl font-black">{meeting.title}</h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <Briefcase size={13} /> {meeting.entityName} — Interlocuteur : <span className="text-white font-bold">{meeting.interlocutor.name}</span> ({meeting.interlocutor.role})
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-slate-400 hover:text-white p-3 rounded-xl hover:bg-white/10 transition-all text-sm font-bold"
          >
            <X size={18} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* 1. OBJECTIF & RÉSULTAT RECHERCHÉ */}
          <div className="p-5 rounded-2xl bg-indigo-50/80 border border-indigo-200 space-y-2">
            <div className="flex items-center gap-2 text-indigo-900 font-bold text-xs uppercase tracking-wider">
              <Target size={16} className="text-indigo-600" />
              <span>1. Pourquoi ce rendez-vous & Résultat recherché</span>
            </div>
            <p className="text-sm font-bold text-indigo-950">
              {flashPrepCard.objective}
            </p>
            <div className="pt-2 border-t border-indigo-200/60 flex items-center justify-between text-xs text-indigo-900 font-medium">
              <span>🎯 <strong>Résultat cible :</strong> {flashPrepCard.targetOutcome}</span>
            </div>
          </div>

          {/* 2. CONTEXTE & HISTORIQUE RÉSUMÉ */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-600" /> 2. Historique & Contexte de l'organisation
            </h4>
            <p className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 leading-relaxed">
              {flashPrepCard.contextSummary}
            </p>
          </div>

          {/* 3. LES 3 POINTS CLÉS À DÉFENDRE */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-emerald-600" /> 3. Vos 3 arguments majeurs (Incontournables)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {flashPrepCard.threeKeyArguments.map((arg, idx) => (
                <div key={idx} className="p-3.5 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-1">
                  <span className="text-[10px] font-black text-emerald-800 uppercase">Point {idx + 1}</span>
                  <p className="text-xs text-emerald-950 font-bold leading-snug">{arg}</p>
                </div>
              ))}
            </div>
          </div>

          {/* 4. QUESTIONS PROBABLES & PUNCHLINES */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <HelpCircle size={14} className="text-amber-600" /> 4. Questions probables & Punchlines préparées
            </h4>
            <div className="space-y-2.5">
              {flashPrepCard.probableQuestions.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                  <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-black">Q</span>
                    {item.question}
                  </p>
                  <p className="text-xs text-blue-900 bg-blue-50 p-2.5 rounded-xl border border-blue-100 font-medium">
                    💡 <strong>Réponse recommandée :</strong> {item.punchline}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 5. QUESTIONS À POSER À L'INTERLOCUTEUR */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-purple-600" /> 5. Questions intelligentes à poser à la fin
            </h4>
            <div className="space-y-1.5 bg-purple-50/50 p-4 rounded-2xl border border-purple-200">
              {flashPrepCard.questionsToAsk.map((q, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-purple-950 font-medium">
                  <CheckCircle2 size={14} className="text-purple-600 shrink-0 mt-0.5" />
                  <span>{q}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 6. DOCUMENTS À AVOIR SOUS LA MAIN */}
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-slate-600" /> 6. Documents & Liens prêts à dégainer
            </h4>
            <div className="flex flex-wrap gap-2">
              {flashPrepCard.keyDocsToHaveReady.map((doc, idx) => (
                <span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <FileText size={12} className="text-blue-600" /> {doc}
                </span>
              ))}
            </div>
          </div>

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">
            Lien d'accès : <strong className="text-slate-700">{meeting.locationOrLink}</strong>
          </span>
          <div className="flex gap-2 w-full sm:w-auto">
            {onLaunchCoach3D && (
              <button
                onClick={onLaunchCoach3D}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all"
              >
                <Video size={14} /> Simulation Vocale Coach 3D
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              C'est tout prêt !
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
