import React, { useState } from 'react';
import { 
  UserCheck, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  BookOpen, 
  ShieldCheck, 
  Share2, 
  Briefcase, 
  Layers, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Download,
  Copy,
  Zap
} from 'lucide-react';
import { ProfessionalDigitalTwin } from '../../types';

interface CareerDigitalTwinCardProps {
  twin: ProfessionalDigitalTwin;
  userName: string;
  userTitle?: string;
  onOpenCampus?: () => void;
  onOpenStudioCV?: () => void;
}

export const CareerDigitalTwinCard: React.FC<CareerDigitalTwinCardProps> = ({
  twin,
  userName,
  userTitle,
  onOpenCampus,
  onOpenStudioCV
}) => {
  const [copied, setCopied] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'outcomes' | 'skills' | 'learning' | 'preferences'>('outcomes');

  const handleCopyBio = () => {
    const bioText = `PROFIL CERTIFIÉ LE MONDE À VOUS - ${userName} (${userTitle || 'Expert'})\nScore de Réputation : ${twin.reputationScore}/100\nCompétences validées : ${twin.masteredSkills.map(s => s.name).join(', ')}\nRésultats certifiés : ${twin.concreteOutcomes.map(o => `${o.metric} (${o.date})`).join(' | ')}`;
    navigator.clipboard.writeText(bioText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl relative overflow-hidden space-y-6">
      {/* Background Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-500/30">
            {userName.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                <Sparkles size={12} /> Jumeau Professionnel Évolutif
              </span>
              <span className="text-[11px] text-slate-400">MàJ : {twin.lastUpdated}</span>
            </div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mt-1">
              {userName}
            </h3>
            <p className="text-xs md:text-sm text-slate-500 font-medium">
              {userTitle || 'Professionnel & Porteur de Projet'} • Ne recommencez jamais votre histoire à zéro
            </p>
          </div>
        </div>

        {/* Global Scores */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-center flex-1 md:flex-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Réputation Pro</span>
            <span className="text-xl font-black text-indigo-600">{twin.reputationScore} / 100</span>
          </div>

          <div className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-center flex-1 md:flex-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Preuves Validées</span>
            <span className="text-xl font-black text-emerald-600">{twin.concreteOutcomes.length}</span>
          </div>

          <button
            onClick={handleCopyBio}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm shrink-0"
          >
            {copied ? <CheckCircle2 size={15} className="text-emerald-400" /> : <Copy size={15} />}
            <span className="hidden sm:inline">{copied ? 'Copié !' : 'Partager Dossier'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 overflow-x-auto">
        {[
          { id: 'outcomes', label: `Résultats Réels (${twin.concreteOutcomes.length})`, icon: Award },
          { id: 'skills', label: `Compétences (${twin.masteredSkills.length})`, icon: Zap },
          { id: 'learning', label: `Formations en cours (${twin.learningInProgress.length})`, icon: BookOpen },
          { id: 'preferences', label: 'Préférences & Conditions', icon: ShieldCheck }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSubTab === tab.id 
                ? 'bg-white text-indigo-700 shadow-sm' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <tab.icon size={14} /> {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENT: OUTCOMES (Mesurer le résultat, pas l'activité) */}
      {activeSubTab === 'outcomes' && (
        <div className="space-y-3 animate-fade-up">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-slate-500 uppercase tracking-wider">
              Accomplissements Tangibles Certifiés (Pas de vanity metrics)
            </span>
            <span className="text-emerald-600 font-bold flex items-center gap-1">
              <ShieldCheck size={14} /> Données Immuables & Opposables
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {twin.concreteOutcomes.map((out) => (
              <div key={out.id} className="p-4 bg-emerald-50/40 border border-emerald-200/80 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0 mt-0.5">
                  <Award size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-sm text-slate-900 truncate">{out.metric}</h4>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full shrink-0">
                      {out.date}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">{out.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT: SKILLS */}
      {activeSubTab === 'skills' && (
        <div className="space-y-4 animate-fade-up">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {twin.masteredSkills.map((skill, i) => (
              <div key={i} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-900">{skill.name}</span>
                  <span className="text-xs font-black text-indigo-600">{skill.level}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="bg-gradient-to-r from-indigo-500 to-blue-500 h-full rounded-full" style={{ width: `${skill.level}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>{skill.endorsedCount} recommandations pairs</span>
                  {skill.verifiedDate && <span className="text-emerald-600 font-bold">Certifié le {skill.verifiedDate}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT: LEARNING IN PROGRESS (SYNC CAMPUS) */}
      {activeSubTab === 'learning' && (
        <div className="space-y-3 animate-fade-up">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {twin.learningInProgress.map((item, idx) => (
              <div key={idx} className="p-4 bg-purple-50/50 border border-purple-200 rounded-2xl space-y-2.5">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{item.title}</h4>
                    <span className="text-[10px] text-purple-700 font-semibold">{item.source}</span>
                  </div>
                  <span className="text-xs font-black text-purple-700">{item.progressPercent}%</span>
                </div>
                <div className="w-full bg-purple-200/60 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-600 h-full rounded-full" style={{ width: `${item.progressPercent}%` }} />
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-500">
                  <span>Complétion estimée : {item.estimatedCompletion}</span>
                  {onOpenCampus && (
                    <button 
                      onClick={onOpenCampus}
                      className="text-purple-700 font-bold hover:underline"
                    >
                      Reprendre le cours →
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONTENT: PREFERENCES */}
      {activeSubTab === 'preferences' && (
        <div className="space-y-3 text-xs text-slate-700 animate-fade-up">
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">Mode de travail favori</span>
            <p className="font-semibold text-slate-900">{twin.careerPreferences.remotePreference}</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">Attentes Salariales / Revenus</span>
            <p className="font-semibold text-slate-900">{twin.careerPreferences.salaryExpectation}</p>
          </div>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
            <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">Critères Non-Négociables</span>
            <div className="flex flex-wrap gap-1.5">
              {twin.careerPreferences.nonNegotiables.map((item, idx) => (
                <span key={idx} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 font-medium">
                  ✓ {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
