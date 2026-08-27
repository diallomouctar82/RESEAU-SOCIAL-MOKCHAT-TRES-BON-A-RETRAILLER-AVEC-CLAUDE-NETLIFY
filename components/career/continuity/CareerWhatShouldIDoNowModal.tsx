import React from 'react';
import { 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  AlertTriangle, 
  Calendar, 
  FileText, 
  RotateCcw, 
  Briefcase,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CareerLiveDossier, CareerDailyWeeklyBriefing } from '../../../types';

interface CareerWhatShouldIDoNowModalProps {
  briefing: CareerDailyWeeklyBriefing;
  dossiers: CareerLiveDossier[];
  onSelectDossierAction: (dossierId: string, actionType: string) => void;
  onClose: () => void;
}

export const CareerWhatShouldIDoNowModal: React.FC<CareerWhatShouldIDoNowModalProps> = ({
  briefing,
  dossiers,
  onSelectDossierAction,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex justify-between items-start">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-500/30 text-blue-300 border border-blue-400/30">
              Arbitrage IA & Priorisation des démarches
            </span>
            <h2 className="text-xl font-black flex items-center gap-2">
              <Sparkles className="text-amber-400 animate-spin" size={20} /> Que dois-je faire maintenant ?
            </h2>
            <p className="text-xs text-slate-300">
              Analyse en temps réel de vos {dossiers.length} dossiers actifs — {briefing.todayDate}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-4 flex-1 text-slate-800">
          
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600 leading-relaxed font-medium">
            💡 Diallo a filtré la surcharge cognitive pour isoler <strong>exclusivement les actions à fort impact</strong> qui débloquent vos résultats.
          </div>

          <div className="space-y-3">
            {briefing.dailyTopPriorities.map((item, index) => {
              const dossier = dossiers.find(d => d.id === item.dossierId);
              return (
                <div 
                  key={item.id} 
                  className={`p-5 rounded-2xl border transition-all space-y-3 ${
                    item.urgency === 'critique' 
                      ? 'bg-red-50/50 border-red-200 shadow-xs' 
                      : item.urgency === 'haute' 
                      ? 'bg-amber-50/50 border-amber-200' 
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${
                        item.urgency === 'critique' 
                          ? 'bg-red-600 text-white' 
                          : item.urgency === 'haute' 
                          ? 'bg-amber-500 text-white' 
                          : 'bg-slate-700 text-white'
                      }`}>
                        {index + 1}
                      </span>
                      <div>
                        <h4 className="font-black text-sm text-slate-900 leading-snug">{item.title}</h4>
                        <span className="text-xs text-slate-500 font-bold">{item.entity}</span>
                      </div>
                    </div>
                    {item.time && (
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                        item.urgency === 'critique' ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {item.time}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed pl-8 font-medium">
                    🎯 <strong>Pourquoi :</strong> {item.whyImportant}
                  </p>

                  <div className="pl-8 pt-1 flex justify-end">
                    <button
                      onClick={() => onSelectDossierAction(item.dossierId, item.category)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs ${
                        item.urgency === 'critique'
                          ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/20'
                          : item.urgency === 'haute'
                          ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20'
                          : 'bg-slate-900 hover:bg-slate-800 text-white'
                      }`}
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Objectif en cours : <strong>{briefing.careerPulse.goalHeadline}</strong>
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            Compris, je m'y mets !
          </button>
        </div>

      </div>
    </div>
  );
};
