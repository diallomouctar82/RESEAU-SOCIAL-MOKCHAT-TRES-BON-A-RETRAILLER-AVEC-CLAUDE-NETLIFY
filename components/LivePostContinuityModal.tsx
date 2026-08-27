import React, { useState } from 'react';
import { 
  X, CheckCircle2, Sparkles, FileText, ArrowRight, Download, 
  Calendar, MessageSquare, Compass, BookOpen, Video, Users, 
  CheckSquare, Award, Clock, Share2, Copy, BarChart3, ShieldCheck
} from 'lucide-react';
import { LiveStream, LiveActionItem } from '../types';

interface LivePostContinuityModalProps {
  isOpen: boolean;
  onClose: () => void;
  liveStream: LiveStream;
  actionItems?: LiveActionItem[];
  personalNotesCount?: number;
  onNavigateToTab?: (tab: string) => void;
}

export const LivePostContinuityModal: React.FC<LivePostContinuityModalProps> = ({
  isOpen,
  onClose,
  liveStream,
  actionItems = [],
  personalNotesCount = 0,
  onNavigateToTab
}) => {
  const [copiedSummary, setCopiedSummary] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>(actionItems.map(a => a.id));

  if (!isOpen) return null;

  const defaultSummary = `COMPTE-RENDU DE SESSION LIVE — DIALLO OS
Date : ${new Date().toLocaleDateString('fr-FR')} | Session : "${liveStream.title}"
Intervenant : ${liveStream.hostName} | Type : ${liveStream.type || 'Session Interactive'}

1. POINTS CLÉS ABORDÉS :
• Analyse du plan de cadrage opérationnel et des exigences de solvabilité.
• Présentation des dispositifs de soutien institutionnels et partenariats diaspora.
• Résolution des questions prioritaires sur la structuration juridique.

2. DÉCISIONS & ENGAGEMENTS :
• Validation de la feuille de route préliminaire sous 7 jours.
• Mise en place d'un dossier de suivi dédié dans le Hub d'Experts.

3. PROCHAINES ÉTAPES :
• Finalisation des livrables et consultation de suivi programmée.`;

  const handleCopy = () => {
    navigator.clipboard.writeText(defaultSummary);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 2000);
  };

  const handleDownloadMinutes = () => {
    const element = document.createElement("a");
    const file = new Blob([defaultSummary], {type: 'text/plain;charset=utf-8'});
    element.href = URL.createObjectURL(file);
    element.download = `Compte_Rendu_Live_${liveStream.id}_DialloOS.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const toggleTask = (id: string) => {
    setSelectedTasks(prev => 
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed inset-0 z-[280] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-white/15 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl space-y-0 my-8 animate-scale-in">
        
        {/* Header: Et Maintenant ? */}
        <div className="p-6 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border-b border-white/10 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-black uppercase flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-300" /> LIVE → ACTION
              </span>
              <span className="text-xs text-slate-400 font-bold">Session terminée avec succès</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white">Et Maintenant ? Continuité de votre Expérience</h2>
            <p className="text-xs text-slate-300">
              Transformez les apprentissages et décisions de ce Live en actions concrètes dans votre écosystème.
            </p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/5">
            <X size={20} />
          </button>
        </div>

        {/* Impact Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-4 bg-slate-950/60 border-b border-white/5 text-center">
          <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-white/5">
            <span className="text-lg font-black text-emerald-400">100%</span>
            <p className="text-[10px] text-slate-400 font-bold">Compte-rendu prêt</p>
          </div>
          <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-white/5">
            <span className="text-lg font-black text-indigo-400">{actionItems.length || 2}</span>
            <p className="text-[10px] text-slate-400 font-bold">Tâches générées</p>
          </div>
          <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-white/5">
            <span className="text-lg font-black text-amber-400">{personalNotesCount || 3}</span>
            <p className="text-[10px] text-slate-400 font-bold">Notes personnelles</p>
          </div>
          <div className="p-2.5 bg-slate-900/80 rounded-2xl border border-white/5">
            <span className="text-lg font-black text-purple-400">+120 XP</span>
            <p className="text-[10px] text-slate-400 font-bold">Compétences validées</p>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Section 1: Compte-Rendu & Synthèse Diallo OS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <FileText size={15} className="text-indigo-400" />
                Compte-Rendu Automatique & Décisions (Secrétaire IA)
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopy}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Copy size={12} />
                  <span>{copiedSummary ? 'Copié !' : 'Copier'}</span>
                </button>
                <button
                  onClick={handleDownloadMinutes}
                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                >
                  <Download size={12} />
                  <span>Télécharger</span>
                </button>
              </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-2xl border border-white/10 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
              {defaultSummary}
            </div>
          </div>

          {/* Section 2: Tâches détectées */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <CheckSquare size={15} className="text-emerald-400" />
              Tâches et Engagements à Intégrer à votre Planning
            </h3>
            <div className="space-y-2">
              {[
                { id: 't1', title: 'Rédiger la note de synthèse financière préliminaire', deadline: 'Sous 48h', tag: 'Finance' },
                { id: 't2', title: 'Planifier la consultation de cadrage juridique avec Maître Diallo', deadline: 'Vendredi', tag: 'Juridique' }
              ].map(task => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${selectedTasks.includes(task.id) ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-100' : 'bg-slate-950 border-white/5 text-slate-400'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${selectedTasks.includes(task.id) ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600'}`}>
                      {selectedTasks.includes(task.id) && <CheckCircle2 size={13} />}
                    </div>
                    <span className="text-xs font-bold text-slate-200">{task.title}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-slate-800 text-[10px] font-mono rounded-md text-slate-300">{task.deadline}</span>
                    <span className="px-2 py-0.5 bg-indigo-900/60 text-indigo-300 text-[10px] font-bold rounded-md">{task.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Passerelles Écosystème Immédiates */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Compass size={15} className="text-amber-400" />
              Où souhaitez-vous poursuivre cette session ?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              
              {/* Option 1: Parcours Projet */}
              <div 
                onClick={() => {
                  onClose();
                  if (onNavigateToTab) onNavigateToTab('experts');
                }}
                className="p-4 bg-slate-950/80 hover:bg-amber-950/20 border border-white/10 hover:border-amber-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Compass size={16} />
                  </div>
                  <ArrowRight size={15} className="text-slate-500 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-amber-300">Créer ou enrichir mon Parcours Projet</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Injecte les décisions et documents du Live dans votre dossier actif.
                </p>
              </div>

              {/* Option 2: Campus & Cours */}
              <div 
                onClick={() => {
                  onClose();
                  if (onNavigateToTab) onNavigateToTab('campus');
                }}
                className="p-4 bg-slate-950/80 hover:bg-teal-950/20 border border-white/10 hover:border-teal-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <BookOpen size={16} />
                  </div>
                  <ArrowRight size={15} className="text-slate-500 group-hover:text-teal-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-teal-300">Ouvrir le Module Campus</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Accéder au quiz de validation et obtenir votre attestation certifiante.
                </p>
              </div>

              {/* Option 3: Studio Créatif & Reels */}
              <div 
                onClick={() => {
                  onClose();
                  if (onNavigateToTab) onNavigateToTab('studio');
                }}
                className="p-4 bg-slate-950/80 hover:bg-pink-950/20 border border-white/10 hover:border-pink-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-pink-500/20 text-pink-400 flex items-center justify-center">
                    <Video size={16} />
                  </div>
                  <ArrowRight size={15} className="text-slate-500 group-hover:text-pink-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-pink-300">Créer des Reels & Extraits dans Studio</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Découpage automatique en vidéos 30s/60s et citations visuelles.
                </p>
              </div>

              {/* Option 4: Consultation 1-à-1 / Rendez-vous */}
              <div 
                onClick={() => {
                  onClose();
                  if (onNavigateToTab) onNavigateToTab('chat');
                }}
                className="p-4 bg-slate-950/80 hover:bg-purple-950/20 border border-white/10 hover:border-purple-500/50 rounded-2xl cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <ArrowRight size={15} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
                <h4 className="text-xs font-bold text-white group-hover:text-purple-300">Poursuivre en Consultation 1-à-1</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Prendre rendez-vous privé ou continuer dans Mok Chat sécurisé.
                </p>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-4">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-400 hover:text-white rounded-xl"
          >
            Fermer
          </button>
          
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all hover:scale-102"
          >
            <CheckCircle2 size={14} />
            <span>Valider et Synchroniser avec mon Compte</span>
          </button>
        </div>

      </div>
    </div>
  );
};
