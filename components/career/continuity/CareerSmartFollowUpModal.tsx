import React, { useState } from 'react';
import { 
  RotateCcw, 
  ShieldCheck, 
  Clock, 
  Sparkles, 
  Send, 
  Copy, 
  Check, 
  AlertTriangle, 
  CheckCircle2,
  Calendar,
  MessageSquare,
  FileText
} from 'lucide-react';
import { CareerLiveDossier, CareerTimelineEvent } from '../../../types';

interface CareerSmartFollowUpModalProps {
  dossier: CareerLiveDossier;
  onSendFollowUp: (updatedDossier: CareerLiveDossier, newEvent: CareerTimelineEvent) => void;
  onClose: () => void;
}

export const CareerSmartFollowUpModal: React.FC<CareerSmartFollowUpModalProps> = ({
  dossier,
  onSendFollowUp,
  onClose
}) => {
  const { followUpStrategy, contactPerson } = dossier;
  const [subject, setSubject] = useState(followUpStrategy.draftTemplate.subject);
  const [body, setBody] = useState(followUpStrategy.draftTemplate.body);
  const [valueAdd, setValueAdd] = useState(followUpStrategy.draftTemplate.valuePropositionAdded);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleValidateAndLog = (e: React.FormEvent) => {
    e.preventDefault();

    const newEvent: CareerTimelineEvent = {
      id: `tl-fol-${Date.now()}`,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      formattedTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: 'relance_envoyee',
      title: `Relance Intelligente envoyée (N° ${followUpStrategy.totalFollowUpsSent + 1})`,
      description: `Objet : ${subject}. Angle de valeur : ${valueAdd}`,
      author: 'user',
      outcomeImpact: 'Dossier remis en attente d\'un retour sous 7 jours.'
    };

    const updatedDossier: CareerLiveDossier = {
      ...dossier,
      status: 'en_attente',
      daysSinceLastContact: 0,
      lastContactDate: "Aujourd'hui",
      workflowStage: `Relance N°${followUpStrategy.totalFollowUpsSent + 1} envoyée`,
      timeline: [newEvent, ...dossier.timeline],
      followUpStrategy: {
        ...dossier.followUpStrategy,
        totalFollowUpsSent: dossier.followUpStrategy.totalFollowUpsSent + 1,
        daysSinceLastExchange: 0,
        antiSpamVerdict: 'attendre_delai_courtois',
        antiSpamExplanation: `Relance N°${followUpStrategy.totalFollowUpsSent + 1} transmise. Laisser un délai de 7 à 10 jours avant tout nouveau contact.`
      }
    };

    onSendFollowUp(updatedDossier, newEvent);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 text-white flex justify-between items-start">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/30 text-amber-300 border border-amber-400/30">
              Générateur de Relances Anti-Spam (Diallo Continuity)
            </span>
            <h2 className="text-xl font-black">Relance Contextualisée & Apport de Valeur</h2>
            <p className="text-xs text-slate-300">
              Destinataire : <strong className="text-white">{contactPerson.name}</strong> ({contactPerson.role}) chez <strong className="text-white">{dossier.entityName}</strong>
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
        <form onSubmit={handleValidateAndLog} className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* ANTI-SPAM STATUS CARD */}
          <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            followUpStrategy.antiSpamVerdict === 'pret_a_relancer'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : followUpStrategy.antiSpamVerdict === 'attendre_delai_courtois'
              ? 'bg-amber-50 border-amber-200 text-amber-900'
              : 'bg-red-50 border-red-200 text-red-900'
          }`}>
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Diagnostic Anti-Harcèlement & Timing</span>
              </div>
              <p className="text-xs font-semibold leading-relaxed">
                {followUpStrategy.antiSpamExplanation}
              </p>
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white shadow-2xs border border-slate-200">
                ⏱️ Dernier échange : <strong>{dossier.daysSinceLastContact} jours</strong>
              </span>
              <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white shadow-2xs border border-slate-200">
                📬 Relances effectuées : <strong>{followUpStrategy.totalFollowUpsSent} / {followUpStrategy.maxRecommendedFollowUps}</strong>
              </span>
            </div>
          </div>

          {/* ADDED VALUE EXPLANATION */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-black text-blue-900 uppercase tracking-wider">
              <Sparkles size={14} className="text-blue-600" />
              <span>Règle d'or Diallo : Ne jamais relancer « pour savoir où ça en est »</span>
            </div>
            <p className="text-xs text-blue-950 leading-relaxed font-medium">
              Chaque relance doit apporter un élément nouveau (mise à jour technique, précision sur un jalon, étude de cas ou article d'actualité sectoriel).
            </p>
          </div>

          {/* FORM FIELDS */}
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Objet du message
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Valeur ajoutée insérée dans la relance
              </label>
              <input
                type="text"
                value={valueAdd}
                onChange={(e) => setValueAdd(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-blue-900 outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Corps du message courtois
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  <span>{copied ? 'Copié dans le presse-papier' : 'Copier le texte'}</span>
                </button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={7}
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-amber-500 leading-relaxed font-sans"
                required
              />
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-slate-500">
              Canal conseillé : <strong>{contactPerson.email || 'Email / Message Réseau MOK'}</strong>
            </span>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-amber-600/20"
              >
                <CheckCircle2 size={15} /> Valider & Consigner dans la Timeline
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
