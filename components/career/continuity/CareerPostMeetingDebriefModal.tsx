import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Mic, 
  MicOff, 
  Sparkles, 
  Clock, 
  Calendar, 
  FileCheck, 
  ThumbsUp, 
  AlertCircle, 
  ThumbsDown,
  ArrowRight,
  Send,
  MessageSquare,
  X
} from 'lucide-react';
import { CareerLiveDossier, CareerPostMeetingDebrief, CareerTimelineEvent } from '../../../types';

interface CareerPostMeetingDebriefModalProps {
  dossier: CareerLiveDossier;
  onSaveDebrief: (debrief: CareerPostMeetingDebrief, newEvent: CareerTimelineEvent) => void;
  onClose: () => void;
}

export const CareerPostMeetingDebriefModal: React.FC<CareerPostMeetingDebriefModalProps> = ({
  dossier,
  onSaveDebrief,
  onClose
}) => {
  const [sentiment, setSentiment] = useState<CareerPostMeetingDebrief['sentiment']>('tres_positif');
  const [rawText, setRawText] = useState('');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceTimer, setVoiceTimer] = useState(0);

  // Structured breakdown
  const [summary, setSummary] = useState('');
  const [keyDecisions, setKeyDecisions] = useState<string[]>([
    'Accord de principe sur les compétences techniques validées.',
    'Transmission attendue d\'une proposition commerciale / devis ajusté.'
  ]);
  const [newDecisionInput, setNewDecisionInput] = useState('');
  
  const [userCommitment, setUserCommitment] = useState('Envoyer le devis / document complémentaire avant vendredi.');
  const [interlocutorCommitment, setInterlocutorCommitment] = useState('Retour du comité de direction début de semaine prochaine.');
  const [nextActionLabel, setNextActionLabel] = useState('Finaliser et transmettre la proposition ajustée.');
  const [nextActionDueDate, setNextActionDueDate] = useState('Vendredi à 17:00');

  // Simulation voice record
  const toggleRecording = () => {
    if (!isRecordingVoice) {
      setIsRecordingVoice(true);
      setVoiceTimer(0);
      const interval = setInterval(() => {
        setVoiceTimer(t => {
          if (t >= 8) {
            clearInterval(interval);
            setIsRecordingVoice(false);
            setRawText("Diallo, l'échange s'est super bien passé avec Mme Sow et M. Diop. Ils ont adoré l'architecture souveraine. Ils veulent qu'on leur envoie une version adaptée avec un démarrage au 15 du mois prochain.");
            setSummary("L'entretien a confirmé l'adéquation technique et culturelle. La direction souhaite une proposition de démarrage sous 15 jours.");
            setSentiment('tres_positif');
            return 8;
          }
          return t + 1;
        });
      }, 1000);
    } else {
      setIsRecordingVoice(false);
    }
  };

  const handleAddDecision = () => {
    if (newDecisionInput.trim()) {
      setKeyDecisions([...keyDecisions, newDecisionInput.trim()]);
      setNewDecisionInput('');
    }
  };

  const handleRemoveDecision = (index: number) => {
    setKeyDecisions(keyDecisions.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const debrief: CareerPostMeetingDebrief = {
      id: `deb-${Date.now()}`,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      sentiment,
      summary: summary || rawText || 'Compte rendu du rendez-vous enregistré.',
      keyDecisionsAgreed: keyDecisions,
      nextCommitmentsUser: [userCommitment],
      nextCommitmentsInterlocutor: [interlocutorCommitment],
      nextActionLabel,
      nextActionDueDate,
      audioTranscript: rawText,
      notes: `Débriefing validé par l'utilisateur pour le dossier ${dossier.entityName}.`
    };

    const newEvent: CareerTimelineEvent = {
      id: `tl-deb-${Date.now()}`,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      formattedTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: 'rendez_vous_effectue',
      title: `Compte Rendu d'Échange : ${sentiment === 'tres_positif' ? 'Très Positif' : sentiment === 'positif_avec_conditions' ? 'Positif sous conditions' : 'Mitigé'}`,
      description: summary || rawText || 'Rendez-vous effectué et débriefé avec succès.',
      author: 'user',
      outcomeImpact: `Prochaine action : ${nextActionLabel} (Échéance : ${nextActionDueDate})`
    };

    onSaveDebrief(debrief, newEvent);
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[90vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 bg-slate-900 text-white flex justify-between items-start">
          <div className="space-y-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
              Débriefing Instantané & Clôture d'Échange
            </span>
            <h2 className="text-xl font-black">Comment s'est passé votre rendez-vous ?</h2>
            <p className="text-xs text-slate-300">
              Dossier : <strong className="text-white">{dossier.title}</strong> chez <strong className="text-white">{dossier.entityName}</strong>
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

        {/* CONTENT */}
        <form onSubmit={handleSubmit} className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* QUICK VOICE DICTATION OR TEXT */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={15} className="text-blue-600" /> Mode Vocal Rapide ou Récit Libre
              </label>
              <button
                type="button"
                onClick={toggleRecording}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                  isRecordingVoice 
                    ? 'bg-red-600 text-white animate-pulse' 
                    : 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                }`}
              >
                {isRecordingVoice ? <MicOff size={14} /> : <Mic size={14} />}
                <span>{isRecordingVoice ? `Enregistrement en cours (${voiceTimer}s)...` : 'Dicter à Diallo OS'}</span>
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              placeholder="Ex: « L'entretien s'est très bien passé. Ils m'ont demandé une proposition pour vendredi et ont validé le tarif... »"
              rows={3}
              className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 leading-relaxed"
            />
          </div>

          {/* 1. SENTIMENT GÉNÉRAL */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              1. Bilan & Ressenti Global
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'tres_positif', label: 'Très Positif 🔥', icon: ThumbsUp, color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                { id: 'positif_avec_conditions', label: 'Positif (Sous réserve) ⚖️', icon: CheckCircle2, color: 'border-blue-500 bg-blue-50 text-blue-900' },
                { id: 'mitige', label: 'Mitigé / Hésitant 🤔', icon: AlertCircle, color: 'border-amber-500 bg-amber-50 text-amber-900' },
                { id: 'defavorable', label: 'Défavorable ❌', icon: ThumbsDown, color: 'border-red-500 bg-red-50 text-red-900' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSentiment(s.id as any)}
                  className={`p-3 rounded-2xl border text-xs font-bold text-center transition-all ${
                    sentiment === s.id 
                      ? `${s.color} shadow-sm ring-2 ring-slate-900/10` 
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. DÉCISIONS CONCRÈTES CONVENUES */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wider block">
              2. Décisions ou accords validés pendant l'échange
            </label>
            <div className="space-y-2">
              {keyDecisions.map((dec, idx) => (
                <div key={idx} className="flex items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <span className="font-medium text-slate-800 flex items-center gap-2">
                    <CheckCircle2 size={14} className="text-emerald-600 shrink-0" />
                    {dec}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDecision(idx)}
                    aria-label="Retirer cette décision"
                    className="text-slate-400 hover:text-red-600 p-2 -m-1 text-xs rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDecisionInput}
                  onChange={(e) => setNewDecisionInput(e.target.value)}
                  placeholder="Ajouter une décision convenue..."
                  className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  onClick={handleAddDecision}
                  className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold"
                >
                  Ajouter
                </button>
              </div>
            </div>
          </div>

          {/* 3. ENGAGEMENTS CROISÉS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Votre engagement (Ce que vous devez faire)
              </label>
              <input
                type="text"
                value={userCommitment}
                onChange={(e) => setUserCommitment(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Engagement de l'interlocuteur (Ce qu'il doit faire)
              </label>
              <input
                type="text"
                value={interlocutorCommitment}
                onChange={(e) => setInterlocutorCommitment(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none"
              />
            </div>
          </div>

          {/* 4. PROCHAINE MEILLEURE ACTION PROGRAMMÉE */}
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
            <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <FileCheck size={15} className="text-emerald-700" /> Prochaine Action Programmée dans votre Suivi
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2">
                <input
                  type="text"
                  value={nextActionLabel}
                  onChange={(e) => setNextActionLabel(e.target.value)}
                  placeholder="Intitulé de la prochaine action..."
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-slate-900 outline-none"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={nextActionDueDate}
                  onChange={(e) => setNextActionDueDate(e.target.value)}
                  placeholder="Échéance (ex: Vendredi 17h)"
                  className="w-full p-2.5 bg-white border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20"
            >
              <CheckCircle2 size={15} /> Enregistrer dans la Timeline Vivante
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
