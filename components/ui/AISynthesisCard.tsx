import React, { useState } from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  HelpCircle, 
  ArrowRight, 
  FileText, 
  Download, 
  Share2, 
  Copy, 
  Check,
  ListTodo
} from 'lucide-react';

export interface AISynthesisCardProps {
  topic: string;
  sourceContext: string; // e.g. "Live Élite avec Ibrahima Diallo", "Réunion Stratégique B2B", "Session de Cours Campus"
  summary: string;
  keyDecisions: string[];
  actionItems: Array<{ task: string; assignee?: string; due?: string }>;
  openQuestions?: string[];
  onSaveToDrive?: () => void;
  onExportPdf?: () => void;
}

export const AISynthesisCard: React.FC<AISynthesisCardProps> = ({
  topic,
  sourceContext,
  summary,
  keyDecisions,
  actionItems,
  openQuestions = [],
  onSaveToDrive,
  onExportPdf
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = `SYNTHÈSE PAR DIALLO — ${topic}\nContexte : ${sourceContext}\n\nRÉSUMÉ :\n${summary}\n\nDÉCISIONS CLÉS :\n${keyDecisions.map(d => `- ${d}`).join('\n')}\n\nACTIONS PROPOSÉES :\n${actionItems.map(a => `- ${a.task}`).join('\n')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden space-y-0">
      
      {/* Header */}
      <div className="bg-slate-900 text-white p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black shadow-md">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-300">
              Synthèse & Clarté Décisionnelle • Diallo OS
            </span>
            <h3 className="text-lg font-black text-white leading-tight">
              {topic}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              Contexte : {sourceContext}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-all text-xs font-bold flex items-center gap-1.5"
            title="Copier le texte complet"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
            <span>{copied ? 'Copié' : 'Copier'}</span>
          </button>

          {onSaveToDrive && (
            <button
              onClick={onSaveToDrive}
              className="p-2 rounded-xl bg-white/10 text-slate-300 hover:text-white hover:bg-white/20 transition-all text-xs font-bold flex items-center gap-1.5"
              title="Sauvegarder dans Google Drive"
            >
              <FileText size={14} />
              <span>Drive</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Body */}
      <div className="p-6 sm:p-8 space-y-6">
        
        {/* Résumé Exécutif */}
        <div className="space-y-2">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
            Résumé Exécutif
          </h4>
          <p className="text-sm text-slate-800 leading-relaxed font-medium bg-slate-50 p-4 rounded-2xl border border-slate-100">
            {summary}
          </p>
        </div>

        {/* 2 Colonnes : Décisions & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Décisions Clés */}
          <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-emerald-600" /> Décisions Validées
            </h4>
            <ul className="space-y-2">
              {keyDecisions.map((dec, i) => (
                <li key={i} className="text-xs text-slate-800 flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                  <span className="font-medium">{dec}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions & Prochaines Étapes */}
          <div className="space-y-3 p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
            <h4 className="text-xs font-black uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
              <ListTodo size={15} className="text-blue-600" /> Plan d'Action Recommandé
            </h4>
            <ul className="space-y-2">
              {actionItems.map((act, i) => (
                <li key={i} className="text-xs text-slate-800 flex items-start justify-between gap-2 border-b border-blue-200/30 pb-1.5 last:border-0 last:pb-0">
                  <div className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span className="font-semibold">{act.task}</span>
                  </div>
                  {act.due && (
                    <span className="text-[10px] bg-white px-2 py-0.5 rounded-full text-slate-500 font-bold border border-blue-100 shrink-0">
                      {act.due}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Questions Ouvertes si existantes */}
        {openQuestions.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h4 className="text-xs font-bold uppercase text-slate-600 flex items-center gap-1.5">
              <HelpCircle size={14} className="text-slate-500" /> Points Ouverts & Réflexions Futures
            </h4>
            <ul className="space-y-1">
              {openQuestions.map((q, i) => (
                <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                  <span className="text-slate-400 font-bold">•</span>
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>

    </div>
  );
};
