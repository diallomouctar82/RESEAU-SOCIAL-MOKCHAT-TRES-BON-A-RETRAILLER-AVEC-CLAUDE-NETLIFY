import React, { useState } from 'react';
import { 
  Sparkles, 
  Volume2, 
  Copy, 
  Check, 
  Download, 
  X, 
  Compass, 
  BookOpen, 
  Award, 
  Flame,
  ArrowRight,
  UserCheck
} from 'lucide-react';
import { CareerJournalEntry } from '../../../types';
import { generateCareerNarrative } from '../../../services/careerUnifiedEngine';

interface CareerNarrativeStoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  userRole?: string;
  pointA?: string;
  pointBSummary?: string;
  journal: CareerJournalEntry[];
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const CareerNarrativeStoryModal: React.FC<CareerNarrativeStoryModalProps> = ({
  isOpen,
  onClose,
  userName,
  userRole = 'Professionnel Confirmé',
  pointA = 'Position de départ',
  pointBSummary = 'Direction Commerciale',
  journal,
  onSpeak,
  isSpeaking = false
}) => {
  const [copied, setCopied] = useState(false);
  const narrative = generateCareerNarrative(userName, journal, pointA, pointBSummary, 'in_progress');


  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(narrative);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([narrative], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Recit_Parcours_${userName.replace(/\s+/g, '_')}_DialloOS.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 md:p-8 relative">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-500/20 border border-indigo-400/30 rounded-2xl text-indigo-400">
                <BookOpen size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  <Sparkles size={14} /> Mémoire Vivante & Récit de Parcours
                </div>
                <h2 className="text-2xl font-black tracking-tight">Raconte-moi mon parcours</h2>
                <p className="text-slate-300 text-xs md:text-sm mt-1">
                  La synthèse narrative continue de vos décisions, victoires, apprentissages et trajectoire.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-full transition text-slate-300 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-white/10">
            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
              <div className="text-xs text-slate-400">Point A (Départ)</div>
              <div className="text-xs font-bold text-white truncate mt-0.5">{pointA}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
              <div className="text-xs text-slate-400">Point B (Cap)</div>
              <div className="text-xs font-bold text-indigo-300 truncate mt-0.5">{pointBSummary}</div>
            </div>
            <div className="bg-white/5 rounded-xl p-3 text-center border border-white/5">
              <div className="text-xs text-slate-400">Événements Tracés</div>
              <div className="text-xs font-bold text-emerald-400 mt-0.5">{journal.length} entrées mémorisées</div>
            </div>
          </div>
        </div>

        {/* Narrative Body */}
        <div className="p-6 md:p-8 space-y-6 max-h-[60vh] overflow-y-auto text-slate-800 leading-relaxed text-sm md:text-base">
          
          <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
            <UserCheck className="text-indigo-600 shrink-0 mt-0.5" size={18} />
            <p className="text-xs md:text-sm text-indigo-900 leading-relaxed">
              <strong>Conseiller Diallo OS :</strong> « Ce récit est généré exclusivement à partir des faits réels, preuves auditées et décisions consignées dans votre Dossier Maître. Il n'invente rien et valorise votre véritable progression. »
            </p>
          </div>

          {/* Render Narrative Sections */}
          <div className="prose prose-indigo max-w-none space-y-4">
            {narrative.split('\n\n').map((paragraph, index) => {
              if (paragraph.startsWith('###')) {
                return (
                  <h3 key={index} className="text-lg font-black text-slate-900 border-b border-slate-100 pb-2 mt-4">
                    {paragraph.replace('###', '').trim()}
                  </h3>
                );
              }
              if (paragraph.startsWith('**') && paragraph.includes('**\n')) {
                const [title, ...rest] = paragraph.split('\n');
                return (
                  <div key={index} className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                    <div className="font-bold text-slate-900">{title.replace(/\*\*/g, '')}</div>
                    <div className="text-xs md:text-sm text-slate-700 whitespace-pre-line">{rest.join('\n')}</div>
                  </div>
                );
              }
              return (
                <div key={index} className="text-slate-700 text-xs md:text-sm whitespace-pre-line">
                  {paragraph}
                </div>
              );
            })}
          </div>

          {/* Recent Milestones Trace */}
          <div className="mt-8 pt-6 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Compass size={14} className="text-indigo-600" /> Journal Récent des Décisions & Victoires
            </h4>
            <div className="space-y-3">
              {journal.slice(-4).reverse().map(entry => (
                <div key={entry.id} className="p-3.5 bg-white rounded-xl border border-slate-200/80 shadow-xs flex items-start gap-3">
                  <div className={`p-2 rounded-lg text-xs font-bold shrink-0 ${
                    entry.type === 'realisation' ? 'bg-emerald-100 text-emerald-800' :
                    entry.type === 'echec_utile' ? 'bg-amber-100 text-amber-800' :
                    entry.type === 'decision' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                  }`}>
                    {entry.type === 'realisation' ? '🏆 Victoire' :
                     entry.type === 'echec_utile' ? '💡 Leçon' :
                     entry.type === 'decision' ? '🧭 Décision' : '⚡ Action'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <h5 className="text-xs font-bold text-slate-900 truncate">{entry.title}</h5>
                      <span className="text-[10px] text-slate-400 shrink-0 ml-2">{entry.timestamp}</span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{entry.description}</p>
                    {entry.lessonsLearned && (
                      <div className="mt-1 text-[11px] text-indigo-700 bg-indigo-50/70 px-2 py-0.5 rounded-md inline-block">
                        Enseignement : {entry.lessonsLearned}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 md:p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            {onSpeak && (
              <button
                onClick={() => onSpeak(narrative)}
                className={`px-4 py-2 rounded-xl text-xs md:text-sm font-bold flex items-center gap-2 transition ${
                  isSpeaking
                    ? 'bg-amber-500 text-white animate-pulse'
                    : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-500/20'
                }`}
              >
                <Volume2 size={16} />
                <span>{isSpeaking ? 'Lecture vocale en cours...' : 'Écouter le récit (Vocal)'}</span>
              </button>
            )}

            <button
              onClick={handleCopy}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition"
            >
              {copied ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
              <span>{copied ? 'Copié !' : 'Copier'}</span>
            </button>

            <button
              onClick={handleDownload}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition"
            >
              <Download size={14} />
              <span>Télécharger (.md)</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs md:text-sm font-bold transition"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
};
