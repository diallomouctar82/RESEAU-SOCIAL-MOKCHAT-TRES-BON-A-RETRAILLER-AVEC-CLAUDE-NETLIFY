import React, { useState } from 'react';
import { 
  Briefcase, 
  Building2, 
  Calendar, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  FileText, 
  RotateCcw, 
  Send, 
  MessageSquare, 
  ShieldCheck, 
  AlertCircle, 
  Video, 
  Plus, 
  ArrowRight,
  HelpCircle,
  User,
  Paperclip,
  ExternalLink,
  Layers,
  ChevronRight
} from 'lucide-react';
import { CareerLiveDossier, CareerTimelineEvent, CareerNextBestAction } from '../../../types';

interface CareerLiveDossierModalProps {
  dossier: CareerLiveDossier;
  onUpdateDossier: (updated: CareerLiveDossier) => void;
  onOpenFollowUpModal: () => void;
  onOpenMeetingPrepModal: () => void;
  onOpenDebriefModal: () => void;
  onOpenPlanBModal: () => void;
  onOpenCoach3D?: () => void;
  onConsultExpert?: (expertName: string) => void;
  onClose: () => void;
}

export const CareerLiveDossierModal: React.FC<CareerLiveDossierModalProps> = ({
  dossier,
  onUpdateDossier,
  onOpenFollowUpModal,
  onOpenMeetingPrepModal,
  onOpenDebriefModal,
  onOpenPlanBModal,
  onOpenCoach3D,
  onConsultExpert,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'next_action' | 'follow_up' | 'meeting' | 'documents' | 'notes'>('timeline');
  const [newNoteText, setNewNoteText] = useState('');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const newEvent: CareerTimelineEvent = {
      id: `tl-note-${Date.now()}`,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
      formattedTime: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      type: 'note_privee',
      title: 'Note personnelle consignée',
      description: newNoteText.trim(),
      author: 'user'
    };

    const updated: CareerLiveDossier = {
      ...dossier,
      notes: [newNoteText.trim(), ...dossier.notes],
      timeline: [newEvent, ...dossier.timeline]
    };

    onUpdateDossier(updated);
    setNewNoteText('');
  };

  const getUniverseBadge = (universe: string) => {
    switch (universe) {
      case 'emploi': return { label: 'Emploi & Recrutement', color: 'bg-blue-100 text-blue-800 border-blue-200' };
      case 'clients': return { label: 'Client B2B & Prestation', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
      case 'fonds': return { label: 'Bourse & Financement', color: 'bg-purple-100 text-purple-800 border-purple-200' };
      case 'achats': return { label: 'Sourcing & Fournisseur', color: 'bg-amber-100 text-amber-800 border-amber-200' };
      default: return { label: 'Général', color: 'bg-slate-100 text-slate-800 border-slate-200' };
    }
  };

  const getEventBadge = (type: CareerTimelineEvent['type']) => {
    switch (type) {
      case 'opportunite_detectee': return { label: 'Détection Radar', color: 'bg-blue-500 text-white' };
      case 'dossier_prepare': return { label: 'Dossier Prêt', color: 'bg-indigo-500 text-white' };
      case 'candidature_validee': return { label: 'Action Transmise', color: 'bg-purple-500 text-white' };
      case 'accuse_reception': return { label: 'Accusé Réception', color: 'bg-emerald-500 text-white' };
      case 'demande_complement': return { label: 'Demande Pièces', color: 'bg-amber-500 text-white' };
      case 'reponse_recue': return { label: 'Réponse Reçue', color: 'bg-teal-500 text-white' };
      case 'relance_envoyee': return { label: 'Relance Envoyée', color: 'bg-orange-500 text-white' };
      case 'rendez_vous_fixe': return { label: 'RDV Programmé', color: 'bg-purple-600 text-white' };
      case 'rendez_vous_effectue': return { label: 'RDV Débriefé', color: 'bg-emerald-600 text-white' };
      case 'offre_recue': return { label: 'Offre Reçue', color: 'bg-emerald-700 text-white' };
      case 'contrat_signe': return { label: 'Signé & Gagné', color: 'bg-emerald-800 text-white' };
      case 'refus_enregistre': return { label: 'Refus Clôturé', color: 'bg-red-600 text-white' };
      case 'plan_b_active': return { label: 'Plan B Activé', color: 'bg-blue-600 text-white' };
      default: return { label: 'Événement', color: 'bg-slate-600 text-white' };
    }
  };

  const uniBadge = getUniverseBadge(dossier.universe);

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-up">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 max-h-[92vh] flex flex-col">
        
        {/* HEADER */}
        <div className="p-6 md:p-7 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${uniBadge.color}`}>
                  {uniBadge.label}
                </span>
                <span className="text-xs text-slate-300 font-bold bg-white/10 px-2.5 py-0.5 rounded-full">
                  Match : {dossier.matchScore}%
                </span>
                {dossier.isStalled && (
                  <span className="text-xs font-black text-amber-300 bg-amber-500/30 border border-amber-400/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <AlertCircle size={12} /> Dossier Bloqué ({dossier.daysSinceLastContact}j)
                  </span>
                )}
                {dossier.isUrgentDeadline && (
                  <span className="text-xs font-black text-red-300 bg-red-500/30 border border-red-400/30 px-2.5 py-0.5 rounded-full animate-pulse">
                    ⚡ Échéance Urgente
                  </span>
                )}
              </div>

              <h2 className="text-xl md:text-2xl font-black text-white">{dossier.title}</h2>
              
              <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 pt-1">
                <span className="flex items-center gap-1.5 font-bold text-white">
                  <Building2 size={13} className="text-blue-400" /> {dossier.entityName}
                </span>
                <span>• Contact : <strong className="text-white">{dossier.contactPerson.name}</strong> ({dossier.contactPerson.role})</span>
                <span>• Dernier contact : <strong>{dossier.lastContactDate}</strong></span>
              </div>

              <div className="pt-2 flex items-center gap-2 text-xs text-indigo-300 font-medium">
                <span>🎯 <strong>Objectif visé :</strong> {dossier.targetOutcome}</span>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/10 transition-all text-sm font-bold shrink-0"
            >
              ✕
            </button>
          </div>
        </div>

        {/* SUB NAVIGATION TABS */}
        <div className="px-6 py-2 bg-slate-100 border-b border-slate-200 overflow-x-auto flex gap-2">
          {[
            { id: 'timeline', label: `Timeline Vivante (${dossier.timeline.length})`, icon: Clock },
            { id: 'next_action', label: 'Prochain Meilleur Pas', icon: Sparkles },
            { id: 'follow_up', label: `Relance & Anti-Spam (${dossier.followUpStrategy.totalFollowUpsSent})`, icon: RotateCcw },
            { id: 'meeting', label: dossier.upcomingMeeting ? 'Rendez-vous Fixé 📅' : 'Rendez-vous', icon: Calendar },
            { id: 'documents', label: `Documents (${dossier.documentsAttached.length})`, icon: FileText },
            { id: 'notes', label: `Notes (${dossier.notes.length})`, icon: MessageSquare }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-slate-900 shadow-xs' 
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <tab.icon size={14} /> {tab.label}
            </button>
          ))}
        </div>

        {/* TAB CONTENT */}
        <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-800">
          
          {/* TAB 1: TIMELINE VIVANTE */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Clock size={14} className="text-blue-600" /> Chronologie Intégrale des Événements
                </h4>
                <span className="text-xs text-slate-500 font-medium">
                  Étape actuelle : <strong className="text-slate-800">{dossier.workflowStage}</strong>
                </span>
              </div>

              {/* TIMELINE LIST */}
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {dossier.timeline.map((evt, idx) => {
                  const badge = getEventBadge(evt.type);
                  return (
                    <div key={evt.id || idx} className="relative group">
                      <span className="absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white bg-blue-600 group-hover:scale-125 transition-all shadow-xs" />
                      
                      <div className="p-4 bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-2xl transition-all space-y-1.5 shadow-2xs">
                        <div className="flex flex-wrap justify-between items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${badge.color}`}>
                              {badge.label}
                            </span>
                            <h5 className="font-bold text-xs md:text-sm text-slate-900">{evt.title}</h5>
                          </div>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {evt.date} {evt.formattedTime && `• ${evt.formattedTime}`}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed">
                          {evt.description}
                        </p>

                        {evt.outcomeImpact && (
                          <div className="pt-1 text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 size={12} /> {evt.outcomeImpact}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* QUICK NOTE ENTRY */}
              <form onSubmit={handleAddNote} className="p-4 bg-slate-100 rounded-2xl flex gap-2">
                <input
                  type="text"
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  placeholder="Ajouter une note horodatée dans la timeline..."
                  className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={!newNoteText.trim()}
                  className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs font-bold shrink-0"
                >
                  Consigner
                </button>
              </form>
            </div>
          )}

          {/* TAB 2: PROCHAIN MEILLEUR PAS (NEXT BEST ACTION) */}
          {activeTab === 'next_action' && (
            <div className="space-y-5">
              <div className="p-6 rounded-3xl bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="px-3 py-1 bg-blue-600 text-white rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
                    <Sparkles size={12} /> Next Best Action — Prochain Meilleur Pas
                  </span>
                  <span className="text-xs font-bold text-slate-600">
                    Échéance conseillée : <strong className="text-slate-900">{dossier.nextBestAction.recommendedDeadline}</strong>
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-black text-slate-900">{dossier.nextBestAction.headline}</h3>
                  <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                    {dossier.nextBestAction.detailedReason}
                  </p>
                </div>

                {dossier.nextBestAction.suggestedDraftContent && (
                  <div className="p-4 bg-white rounded-2xl border border-blue-200 text-xs text-slate-800 font-medium">
                    💡 <strong>Contenu suggéré :</strong> "{dossier.nextBestAction.suggestedDraftContent}"
                  </div>
                )}

                {/* DIRECT ACTION BUTTONS */}
                <div className="pt-2 flex flex-wrap gap-2">
                  {dossier.nextBestAction.actionType === 'entrainer_oral' && (
                    <button
                      onClick={onOpenMeetingPrepModal}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <FileText size={14} /> Voir Fiche Flash J-0
                    </button>
                  )}
                  {dossier.nextBestAction.actionType === 'relancer' && (
                    <button
                      onClick={onOpenFollowUpModal}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <RotateCcw size={14} /> Préparer Relance IA
                    </button>
                  )}
                  {dossier.nextBestAction.actionType === 'action_plan_b' && (
                    <button
                      onClick={onOpenPlanBModal}
                      className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Layers size={14} /> Activer le Mode Plan B
                    </button>
                  )}
                  {onOpenCoach3D && (
                    <button
                      onClick={onOpenCoach3D}
                      className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                    >
                      <Video size={14} /> Simulation Vocale Coach 3D
                    </button>
                  )}
                </div>
              </div>

              {/* EXPERT ADVISOR SUGGESTION */}
              {dossier.nextBestAction.suggestedExpert && (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <img 
                      src={dossier.nextBestAction.suggestedExpert.avatarUrl} 
                      alt={dossier.nextBestAction.suggestedExpert.expertName} 
                      className="w-10 h-10 rounded-full object-cover border border-slate-300"
                    />
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{dossier.nextBestAction.suggestedExpert.expertName}</h5>
                      <span className="text-[11px] text-slate-500">{dossier.nextBestAction.suggestedExpert.expertRole}</span>
                      <p className="text-[11px] text-slate-600 mt-0.5">{dossier.nextBestAction.suggestedExpert.contactReason}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => onConsultExpert && onConsultExpert(dossier.nextBestAction.suggestedExpert!.expertName)}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shrink-0"
                  >
                    Consulter
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: RELANCE & ANTI-SPAM */}
          {activeTab === 'follow_up' && (
            <div className="space-y-5">
              <div className={`p-5 rounded-2xl border space-y-2 ${
                dossier.followUpStrategy.antiSpamVerdict === 'pret_a_relancer'
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-emerald-600" /> Diagnostic Anti-Harcèlement
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Relances : {dossier.followUpStrategy.totalFollowUpsSent} / {dossier.followUpStrategy.maxRecommendedFollowUps}
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-medium">
                  {dossier.followUpStrategy.antiSpamExplanation}
                </p>
              </div>

              <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Brouillon & Angle de Valeur Prévu
                </h4>
                <div className="space-y-1 text-xs">
                  <p><strong>Objet :</strong> {dossier.followUpStrategy.draftTemplate.subject}</p>
                  <p><strong>Angle de valeur :</strong> {dossier.followUpStrategy.suggestedAngle}</p>
                </div>
                <p className="text-xs text-slate-600 bg-white p-3.5 rounded-xl border border-slate-200 whitespace-pre-line leading-relaxed font-sans">
                  {dossier.followUpStrategy.draftTemplate.body}
                </p>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={onOpenFollowUpModal}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw size={14} /> Ouvrir le Générateur de Relances
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: RENDEZ-VOUS */}
          {activeTab === 'meeting' && (
            <div className="space-y-5">
              {dossier.upcomingMeeting ? (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                        {dossier.upcomingMeeting.meetingType === 'entretien_embauche' ? 'Entretien d\'Embauche' : 'Rendez-vous Client'}
                      </span>
                      <h3 className="text-base font-black text-slate-900">{dossier.upcomingMeeting.title}</h3>
                      <p className="text-xs text-slate-500 flex items-center gap-1">
                        <Clock size={13} /> {dossier.upcomingMeeting.date} à {dossier.upcomingMeeting.time}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-2xl border border-slate-200 space-y-2">
                    <h5 className="text-xs font-bold text-slate-900">Objectif du rendez-vous :</h5>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {dossier.upcomingMeeting.flashPrepCard.objective}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <button
                      onClick={onOpenMeetingPrepModal}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <FileText size={14} /> Ouvrir la Fiche de Préparation
                    </button>
                    <button
                      onClick={onOpenDebriefModal}
                      className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <CheckCircle2 size={14} /> Débriefer l'Échange (« Comment ça s'est passé ? »)
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-xs text-slate-400 space-y-3">
                  <Calendar size={32} className="mx-auto text-slate-300" />
                  <p>Aucun rendez-vous planifié pour l'instant sur ce dossier.</p>
                  <button
                    onClick={onOpenDebriefModal}
                    className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
                  >
                    Consigner un appel ou réunion informelle
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: DOCUMENTS ATTACHÉS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={14} className="text-blue-600" /> Pièces & Actifs Produits pour ce Dossier
              </h4>
              <div className="space-y-2.5">
                {dossier.documentsAttached.map(doc => (
                  <div key={doc.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        <FileText size={16} />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-slate-900">{doc.name}</h5>
                        <span className="text-[11px] text-slate-500">{doc.type} • Ajouté le {doc.date}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => alert(`Visualisation du document : ${doc.name}`)}
                      className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold"
                    >
                      Consulter
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: NOTES PERSONNELLES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare size={14} className="text-purple-600" /> Mémoire & Notes Personnelles
              </h4>
              <div className="space-y-2">
                {dossier.notes.map((note, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700">
                    "{note}"
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenPlanBModal}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Layers size={13} /> Activer Plan B
            </button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
