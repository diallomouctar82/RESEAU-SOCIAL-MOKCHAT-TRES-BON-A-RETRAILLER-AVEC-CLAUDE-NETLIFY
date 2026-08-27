import React, { useState } from 'react';
import { 
  X, 
  Award, 
  Users, 
  Sparkles, 
  CheckCircle2, 
  Calendar, 
  ArrowRight, 
  BookOpen, 
  ShieldCheck, 
  Star,
  Clock,
  Send,
  UserCheck
} from 'lucide-react';
import { MentorshipConnection } from '../../../types';

interface CareerMentorshipModalProps {
  mentorships: MentorshipConnection[];
  userName: string;
  onUpdateMentorships: (updated: MentorshipConnection[]) => void;
  onClose: () => void;
}

export const CareerMentorshipModal: React.FC<CareerMentorshipModalProps> = ({
  mentorships,
  userName,
  onUpdateMentorships,
  onClose
}) => {
  const [activeMode, setActiveMode] = useState<'seeking_mentor' | 'becoming_mentor'>('seeking_mentor');
  const [showApplyModal, setShowApplyModal] = useState(false);

  const filtered = mentorships.filter(m => m.mode === activeMode);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-3 md:p-6 animate-fade-up">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] text-white">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-start bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Award size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
                <Sparkles size={14} /> Boucle d'Excellence & Transmission
              </div>
              <h2 className="text-xl font-black text-white">
                Mentorat Intelligent & Réputation Contextualisée
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                J'apprends ➔ Je maîtrise ➔ J'accomplis ➔ Je transmets.
              </p>
            </div>
          </div>
          
          <button 
            onClick={onClose}
            className="p-2.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="bg-slate-950 px-6 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveMode('seeking_mentor')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeMode === 'seeking_mentor' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookOpen size={14} /> Être Mentoré (Trouver un Mentor)
            </button>
            <button
              onClick={() => setActiveMode('becoming_mentor')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                activeMode === 'becoming_mentor' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Award size={14} /> Devenir Mentor (Transmettre)
            </button>
          </div>

          <span className="text-xs text-slate-400 hidden sm:inline">
            Consentement mutuel & engagement volontaire
          </span>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Active Mentorships Cards */}
          <div className="space-y-4">
            {filtered.map(item => (
              <div key={item.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <img 
                      src={item.mentorOrMentee.avatarUrl} 
                      alt={item.mentorOrMentee.name}
                      className="w-14 h-14 rounded-2xl object-cover border-2 border-amber-500/60 shadow-lg" 
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-white">{item.mentorOrMentee.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 font-bold border border-amber-800/40">
                          {item.mentorOrMentee.domain}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">{item.mentorOrMentee.title}</p>
                      <span className="text-[11px] text-slate-400 font-medium">{item.mentorOrMentee.yearsExperience} ans d'expérience</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/60 block">
                      Mentorat Actif
                    </span>
                    {item.nextSessionDate && (
                      <span className="text-[11px] text-slate-400 mt-1 block">
                        Prochaine session : <strong className="text-white">{item.nextSessionDate}</strong>
                      </span>
                    )}
                  </div>
                </div>

                {/* Contextual Reputation Breakdown (No universal score cliché) */}
                <div className="p-3.5 bg-slate-900/80 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <ShieldCheck size={13} className="text-amber-400" /> Réputation Contextualisée par Compétence
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {item.mentorOrMentee.reputationByCompetency.map((rep, i) => (
                      <div key={i} className="p-2 bg-slate-950 rounded-lg border border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-slate-300 truncate max-w-[130px]">{rep.competency}</span>
                        <span className="font-bold text-amber-400 shrink-0">{rep.score}% ({rep.proofCount} preuves)</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Objectives */}
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-300 block">Objectifs d'accompagnement :</span>
                  <ul className="space-y-1 text-slate-400">
                    {item.objectives.map((obj, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <CheckCircle2 size={13} className="text-amber-400 shrink-0 mt-0.5" />
                        <span>{obj}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>

        </div>

      </div>
    </div>
  );
};
