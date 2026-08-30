import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  Video, 
  ArrowRight, 
  AlertCircle,
  Briefcase,
  Layers,
  ChevronRight,
  X
} from 'lucide-react';
import { CareerDailyWeeklyBriefing, CareerLiveDossier } from '../../../types';

interface CareerBriefingTomorrowModalProps {
  briefing: CareerDailyWeeklyBriefing;
  dossiers: CareerLiveDossier[];
  onOpenFlashSheetForDossier: (dossierId: string) => void;
  onClose: () => void;
}

export const CareerBriefingTomorrowModal: React.FC<CareerBriefingTomorrowModalProps> = ({
  briefing,
  dossiers,
  onOpenFlashSheetForDossier,
  onClose
}) => {
  const [viewMode, setViewMode] = useState<'tomorrow' | 'week'>('tomorrow');
  const { tomorrowBriefing, weeklyBriefing } = briefing;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/30 text-indigo-300 border border-indigo-400/30">
                Briefing Stratégique Diallo
              </span>
              <span className="text-xs text-slate-300 font-bold">
                {viewMode === 'tomorrow' ? tomorrowBriefing.date : weeklyBriefing.weekRange}
              </span>
            </div>
            <h2 className="text-xl font-black">
              {viewMode === 'tomorrow' ? '🌙 Prépare-moi pour Demain' : '📅 Vue Stratégique de ma Semaine'}
            </h2>
            <p className="text-xs text-slate-300">
              Anticipez vos échéances pour aborder vos rendez-vous en totale maîtrise
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

        {/* MODE SWITCHER */}
        <div className="p-2 bg-slate-100 flex gap-2 border-b border-slate-200">
          <button
            onClick={() => setViewMode('tomorrow')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'tomorrow' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Clock size={14} /> Demain ({tomorrowBriefing.keyActions.length} jalons)
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              viewMode === 'week' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Calendar size={14} /> Ma Semaine (Vision Globale)
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {viewMode === 'tomorrow' ? (
            <div className="space-y-6">
              
              {/* TOMORROW STATS */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-indigo-950">{tomorrowBriefing.meetingsCount}</span>
                  <p className="text-[11px] font-bold text-indigo-800 uppercase">Rendez-vous fixé</p>
                </div>
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-red-950">{tomorrowBriefing.urgentDeadlines}</span>
                  <p className="text-[11px] font-bold text-red-800 uppercase">Échéance critique</p>
                </div>
                <div className="col-span-2 sm:col-span-1 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
                  <span className="text-2xl font-black text-emerald-950">100%</span>
                  <p className="text-[11px] font-bold text-emerald-800 uppercase">Fiches Prêtes</p>
                </div>
              </div>

              {/* SCHEDULED ACTIONS LIST */}
              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600" /> Déroulé de votre journée de demain
                </h4>
                <div className="space-y-2.5">
                  {tomorrowBriefing.keyActions.map((action, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold text-slate-900">{action}</span>
                      <CheckCircle2 size={16} className="text-indigo-600 shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* FLASH PREP CARDS TRIGGER */}
              <div className="p-5 bg-indigo-50 border border-indigo-200 rounded-3xl space-y-3">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-sm text-indigo-950">Fiches Flash J-0 Prêtes pour Demain</h5>
                    <p className="text-xs text-indigo-800">
                      Répétez vos 3 arguments et vos punchlines clés avant d'aller vous coucher.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tomorrowBriefing.flashPrepDossierIds.map((dosId) => {
                    const dossier = dossiers.find(d => d.id === dosId);
                    if (!dossier) return null;
                    return (
                      <button
                        key={dosId}
                        onClick={() => onOpenFlashSheetForDossier(dosId)}
                        className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                      >
                        <FileText size={14} /> Fiche Flash : {dossier.entityName}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6">
              
              {/* STRATEGIC GOAL */}
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-1.5">
                <span className="text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                  🎯 Cap Stratégique de la Semaine
                </span>
                <p className="text-sm font-black text-emerald-950">
                  {weeklyBriefing.mainStrategicGoal}
                </p>
              </div>

              {/* WEEK STATS */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-xl font-black text-slate-900">{weeklyBriefing.meetingsPlannedCount}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">RDV Planifiés</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-xl font-black text-amber-700">{weeklyBriefing.followUpsDueCount}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Relance Due</p>
                </div>
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
                  <span className="text-xl font-black text-blue-700">{weeklyBriefing.stalledDossiersToResolveCount}</span>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-0.5">Dossier à Arbitrer</p>
                </div>
              </div>

              {/* KEY MILESTONES */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={14} className="text-blue-600" /> Les 3 Jalons Incontournables
                </h4>
                {weeklyBriefing.keyMilestones.map((ms, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-[10px] font-black shrink-0">
                      {idx + 1}
                    </span>
                    <span>{ms}</span>
                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
          >
            Fermer le Briefing
          </button>
        </div>

      </div>
    </div>
  );
};
