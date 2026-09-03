import React, { useState } from 'react';
import { 
  Plus, Bookmark, CheckSquare, Bell, Calendar, Compass, 
  UserCheck, FolderPlus, MessageSquare, Users, BookOpen, 
  Video, Sparkles, Search, ShieldCheck, ChevronDown, Check
} from 'lucide-react';

interface LiveSmartActionBarProps {
  liveStream?: any;
  currentLiveTitle?: string;
  onAddPersonalNote?: (text: string, category: 'reminder' | 'task' | 'project' | 'learning') => void;
  onCreateTask?: (title?: string) => void;
  onCreateReminder?: () => void;
  onBookAppointment?: () => void;
  onAddToParcours?: () => void;
  onRequestExpertHelp?: () => void;
  onSummonExpert?: (specialty: string) => void;
  onFactCheckSource?: () => void;
  onRequestInstantHelp?: () => void;
  onSaveResource?: () => void;
  onContinuePrivate?: () => void;
  onJoinTribe?: () => void;
  onOpenInCampus?: () => void;
  onSendToStudio?: () => void;
  onVerifyFact?: () => void;
}

export const LiveSmartActionBar: React.FC<LiveSmartActionBarProps> = ({
  liveStream,
  currentLiveTitle,
  onAddPersonalNote,
  onCreateTask,
  onCreateReminder,
  onBookAppointment,
  onAddToParcours,
  onRequestExpertHelp,
  onSummonExpert,
  onFactCheckSource,
  onRequestInstantHelp,
  onSaveResource,
  onContinuePrivate,
  onJoinTribe,
  onOpenInCampus,
  onSendToStudio,
  onVerifyFact
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [quickNoteText, setQuickNoteText] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteCategory, setNoteCategory] = useState<'reminder' | 'task' | 'project' | 'learning'>('project');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveQuickNote = () => {
    if (!quickNoteText.trim()) return;
    if (onAddPersonalNote) {
      onAddPersonalNote(quickNoteText.trim(), noteCategory);
    }
    setQuickNoteText('');
    setShowNoteInput(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="relative z-40">
      {/* Quick In-Live Action Floating Dock */}
      <div className="bg-slate-900/90 backdrop-blur-md border border-white/10 rounded-2xl p-1.5 shadow-2xl flex items-center gap-1">
        
        {/* Main Quick Action: Retenir pour moi */}
        <button
          onClick={() => setShowNoteInput(!showNoteInput)}
          className="px-3 py-1.5 live-orb live-orb--active !rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap transition-all active:scale-98"
          title="Mémoire Personnelle : Diallo, retiens ceci pour moi"
        >
          <Sparkles size={13} />
          <span className="hidden sm:inline">Diallo,</span> Retiens ceci
        </button>

        {/* Raccourcis rapides — repliés sous "Actions" sur mobile (même liste,
            juste déplacée) : les afficher tous en permanence sur un petit
            écran est ce qui rendait cette barre illisible (audit UX). */}
        <button
          onClick={() => onCreateTask && onCreateTask()}
          className="hidden sm:flex p-2 hover:bg-white/10 text-slate-300 hover:text-emerald-400 rounded-xl transition-colors text-xs font-semibold items-center gap-1"
          title="Créer une tâche issue du Live"
        >
          <CheckSquare size={15} />
          <span className="hidden md:inline text-[11px]">Tâche</span>
        </button>

        <button
          onClick={() => onBookAppointment && onBookAppointment()}
          className="hidden sm:flex p-2 hover:bg-white/10 text-slate-300 hover:text-indigo-400 rounded-xl transition-colors text-xs font-semibold items-center gap-1"
          title="Prendre rendez-vous avec l'intervenant"
        >
          <Calendar size={15} />
          <span className="hidden md:inline text-[11px]">RDV</span>
        </button>

        <button
          onClick={() => onAddToParcours && onAddToParcours()}
          className="hidden md:flex p-2 hover:bg-white/10 text-slate-300 hover:text-amber-400 rounded-xl transition-colors text-xs font-semibold items-center gap-1"
          title="Ajouter au parcours projet"
        >
          <Compass size={15} />
          <span className="hidden md:inline text-[11px]">Parcours</span>
        </button>

        <button
          onClick={() => onVerifyFact && onVerifyFact()}
          className="hidden lg:flex p-2 hover:bg-white/10 text-slate-300 hover:text-cyan-400 rounded-xl transition-colors text-xs font-semibold items-center gap-1"
          title="Vérifier une information (Fiche Source)"
        >
          <ShieldCheck size={15} />
          <span className="hidden lg:inline text-[11px]">Vérifier Source</span>
        </button>

        {/* Expand full action matrix */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${isExpanded ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-slate-400 hover:text-white'}`}
          title="Toutes les actions intelligentes"
        >
          <Plus size={14} className={`transition-transform duration-200 ${isExpanded ? 'rotate-45' : ''}`} />
          <span className="text-[11px] font-bold">Actions</span>
        </button>

        {savedSuccess && (
          <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 animate-fade-in">
            <Check size={12} /> Retenu dans vos notes !
          </span>
        )}
      </div>

      {/* Quick Personal Memory Input Popover */}
      {showNoteInput && (
        <div className="absolute bottom-full mb-2 left-0 w-80 sm:w-96 bg-slate-900 border border-indigo-500/30 rounded-2xl p-3 shadow-2xl space-y-2.5 animate-scale-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300">
              <Sparkles size={14} className="text-amber-300" /> Mémoire Personnelle du Live
            </div>
            <span className="text-[10px] text-slate-400">Strictement Privé 🔒</span>
          </div>

          <textarea
            value={quickNoteText}
            onChange={(e) => setQuickNoteText(e.target.value)}
            placeholder="« Diallo, retiens que le délai pour le dossier est fixé au 15 du mois prochain... »"
            rows={2}
            className="w-full bg-slate-950 border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-colors resize-none"
            autoFocus
          />

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              {[
                { id: 'project', label: 'Projet', icon: '🚀' },
                { id: 'task', label: 'Tâche', icon: '📋' },
                { id: 'reminder', label: 'Rappel', icon: '⏰' },
                { id: 'learning', label: 'Campus', icon: '🎓' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setNoteCategory(cat.id as any)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${noteCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setShowNoteInput(false)}
                className="px-2.5 py-1 text-slate-400 hover:text-white text-[11px] font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveQuickNote}
                disabled={!quickNoteText.trim()}
                className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-[11px] font-bold rounded-lg transition-colors"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Actions Grid Menu */}
      {isExpanded && (
        <div className="absolute bottom-full mb-2 left-0 sm:left-auto right-0 w-80 sm:w-[480px] bg-slate-900/95 backdrop-blur-xl border border-white/15 rounded-3xl p-4 shadow-2xl space-y-3 animate-scale-in">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-indigo-600/30 text-indigo-300 rounded-lg text-xs font-bold">
                LIVE → ACTION
              </span>
              <h4 className="text-xs font-black text-white">Passer à l'action sans quitter le Live</h4>
            </div>
            <button onClick={() => setIsExpanded(false)} className="text-slate-400 hover:text-white text-xs">
              Fermer
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            
            {/* Action 1: Ajouter à mes notes */}
            <button
              onClick={() => { setIsExpanded(false); setShowNoteInput(true); }}
              className="p-2.5 bg-slate-950/60 hover:bg-indigo-600/20 border border-white/5 hover:border-indigo-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Sparkles size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-indigo-300">Ajouter aux notes</p>
              <p className="text-[10px] text-slate-400">Mémoire privée Diallo</p>
            </button>

            {/* Action 2: Créer une tâche */}
            <button
              onClick={() => { setIsExpanded(false); if (onCreateTask) onCreateTask(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-emerald-600/20 border border-white/5 hover:border-emerald-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <CheckSquare size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-emerald-300">Créer une tâche</p>
              <p className="text-[10px] text-slate-400">Avec échéance & rappel</p>
            </button>

            {/* Action 3: Prendre RDV */}
            <button
              onClick={() => { setIsExpanded(false); if (onBookAppointment) onBookAppointment(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-purple-600/20 border border-white/5 hover:border-purple-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Calendar size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-purple-300">Prendre RDV</p>
              <p className="text-[10px] text-slate-400">Consultation privée</p>
            </button>

            {/* Action 4: Ajouter au parcours */}
            <button
              onClick={() => { setIsExpanded(false); if (onAddToParcours) onAddToParcours(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-amber-600/20 border border-white/5 hover:border-amber-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Compass size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-amber-300">Ajouter au parcours</p>
              <p className="text-[10px] text-slate-400">Intégrer au projet actif</p>
            </button>

            {/* Action 5: Demander aide expert (SOS) */}
            <button
              onClick={() => { setIsExpanded(false); if (onRequestExpertHelp) onRequestExpertHelp(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-rose-600/20 border border-white/5 hover:border-rose-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <UserCheck size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-rose-300">Aide d'un Expert</p>
              <p className="text-[10px] text-slate-400">Assistance immédiate</p>
            </button>

            {/* Action 6: Enregistrer cette ressource */}
            <button
              onClick={() => { setIsExpanded(false); if (onSaveResource) onSaveResource(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-cyan-600/20 border border-white/5 hover:border-cyan-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Bookmark size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-cyan-300">Enregistrer ressource</p>
              <p className="text-[10px] text-slate-400">Coffre-fort & docs</p>
            </button>

            {/* Action 7: Continuer en privé */}
            <button
              onClick={() => { setIsExpanded(false); if (onContinuePrivate) onContinuePrivate(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-blue-600/20 border border-white/5 hover:border-blue-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <MessageSquare size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-blue-300">Continuer en privé</p>
              <p className="text-[10px] text-slate-400">Mok Chat 1-à-1</p>
            </button>

            {/* Action 8: Rejoindre la Tribu */}
            <button
              onClick={() => { setIsExpanded(false); if (onJoinTribe) onJoinTribe(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-orange-600/20 border border-white/5 hover:border-orange-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Users size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-orange-300">Rejoindre la Tribu</p>
              <p className="text-[10px] text-slate-400">Communauté du live</p>
            </button>

            {/* Action 9: Ouvrir dans Campus */}
            <button
              onClick={() => { setIsExpanded(false); if (onOpenInCampus) onOpenInCampus(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-teal-600/20 border border-white/5 hover:border-teal-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-teal-600/20 text-teal-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <BookOpen size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-teal-300">Ouvrir dans Campus</p>
              <p className="text-[10px] text-slate-400">Cours & Quiz certifiant</p>
            </button>

            {/* Action 10: Envoyer dans Studio */}
            <button
              onClick={() => { setIsExpanded(false); if (onSendToStudio) onSendToStudio(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-pink-600/20 border border-white/5 hover:border-pink-500/40 rounded-2xl text-left transition-all group space-y-1"
            >
              <div className="w-7 h-7 rounded-xl bg-pink-600/20 text-pink-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                <Video size={14} />
              </div>
              <p className="text-xs font-bold text-white group-hover:text-pink-300">Envoyer dans Studio</p>
              <p className="text-[10px] text-slate-400">Extraits & Reels IA</p>
            </button>

            {/* Action 11: Vérifier la source */}
            <button
              onClick={() => { setIsExpanded(false); if (onVerifyFact) onVerifyFact(); }}
              className="p-2.5 bg-slate-950/60 hover:bg-cyan-600/20 border border-white/5 hover:border-cyan-500/40 rounded-2xl text-left transition-all group space-y-1 sm:col-span-2"
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <ShieldCheck size={14} />
                </div>
                <div>
                  <p className="text-xs font-bold text-white group-hover:text-cyan-300">Vérifier une information</p>
                  <p className="text-[10px] text-slate-400">Fiche Source officielle & Fact-checking Diallo OS</p>
                </div>
              </div>
            </button>

          </div>
        </div>
      )}

    </div>
  );
};
