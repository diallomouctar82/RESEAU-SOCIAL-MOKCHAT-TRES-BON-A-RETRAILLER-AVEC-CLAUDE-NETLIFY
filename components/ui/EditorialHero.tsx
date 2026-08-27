import React from 'react';
import { PlayCircle, ArrowRight, Sparkles, Compass, CheckCircle2, ChevronRight } from 'lucide-react';
import { UserProfile } from '../../types';

export interface EditorialHeroProps {
  userProfile: UserProfile;
  activeGoalTitle: string;
  activeGoalCategory: string;
  nextBestAction: {
    title: string;
    description: string;
    targetTab: string;
    actionLabel: string;
  };
  lastActivity?: {
    label: string;
    tab: string;
    timeAgo?: string;
  };
  onNavigate: (tab: string, context?: any) => void;
  onOpenCapModal?: () => void;
}

export const EditorialHero: React.FC<EditorialHeroProps> = ({
  userProfile,
  activeGoalTitle,
  activeGoalCategory,
  nextBestAction,
  lastActivity,
  onNavigate,
  onOpenCapModal
}) => {
  const firstName = userProfile.name.split(' ')[0] || 'Alexandre';

  return (
    <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-xl border border-slate-800">
      {/* Background ambient lighting - strictly controlled deep navy & subtle blue tone */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-blue-600/15 via-indigo-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-slate-800/40 rounded-full blur-2xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left Column: Personal Editorial Greeting & Active Cap */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-200 backdrop-blur-sm border border-white/10">
              <Compass size={13} className="text-blue-400" />
              BRIEFING QUOTIDIEN
            </span>
            <span className="text-xs font-semibold text-slate-400">
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
            Bonjour {firstName}. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-blue-100 to-white">
              Voici ce qui compte aujourd’hui.
            </span>
          </h1>

          <p className="text-base text-slate-300 font-normal leading-relaxed max-w-xl">
            Votre accompagnement progresse. Un cap prioritaire et une action clé sont prêts pour vous propulser vers vos résultats.
          </p>

          {/* Active Goal Pill */}
          <div className="pt-2">
            <div 
              onClick={onOpenCapModal}
              className="inline-flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2.5 rounded-2xl cursor-pointer transition-all group max-w-full"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                Cap
              </div>
              <div className="truncate text-left">
                <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                  <span>{activeGoalCategory}</span>
                  <span className="text-slate-600">•</span>
                  <span className="text-blue-300 group-hover:underline">Changer de cap</span>
                </div>
                <div className="text-sm font-bold text-white truncate">
                  {activeGoalTitle}
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-white group-hover:translate-x-0.5 transition-transform ml-2 shrink-0" />
            </div>
          </div>
        </div>

        {/* Right Column: Next Best Action & Instant Resume Card */}
        <div className="lg:col-span-5 space-y-4">
          {/* Highlight Next Best Action */}
          <div className="bg-gradient-to-b from-white/15 to-white/5 border border-white/15 rounded-2xl p-5 backdrop-blur-md shadow-lg">
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Sparkles size={13} />
                PROCHAINE MEILLEURE ACTION
              </span>
              <span className="text-xs font-medium text-slate-400">Étape prioritaire</span>
            </div>

            <h3 className="text-base font-bold text-white leading-snug mb-1.5">
              {nextBestAction.title}
            </h3>

            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              {nextBestAction.description}
            </p>

            <button
              onClick={() => onNavigate(nextBestAction.targetTab)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-xl font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2 group hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>{nextBestAction.actionLabel}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Quick Resume Card */}
          {lastActivity && (
            <div 
              onClick={() => onNavigate(lastActivity.tab)}
              className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-3.5 flex items-center justify-between cursor-pointer transition-all text-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-blue-600/30 text-blue-300 flex items-center justify-center shrink-0">
                  <PlayCircle size={16} />
                </div>
                <div>
                  <span className="text-slate-400">Reprendre là où vous étiez :</span>
                  <div className="font-bold text-white">{lastActivity.label}</div>
                </div>
              </div>
              <ArrowRight size={14} className="text-slate-400 shrink-0" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
