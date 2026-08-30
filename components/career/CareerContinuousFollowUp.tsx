import React, { useState } from 'react';
import {
  BriefcaseBusiness,
  Sparkles,
  CheckCircle2,
  Clock,
  AlertCircle,
  Send,
  Mail,
  Video,
  DollarSign,
  FileText,
  Plus,
  Trash2,
  ArrowRight,
  Award,
  TrendingUp,
  BellRing,
  RotateCcw,
  ChevronRight,
  ExternalLink,
  Building2,
  Calendar,
  MessageSquare,
  X
} from 'lucide-react';
import { CareerMissionPlan, CareerSmartReminder, CareerActionItem, RadarOpportunityItem } from '../../types';
import { CareerResponseAnalyzerModal } from './conquest/CareerResponseAnalyzerModal';
import { StatusBadge } from '../ui/StatusBadge';

interface OpportunityItem {
  id: string;
  title: string;
  entity: string;
  location: string;
  description: string;
  status: 'detected' | 'contacted' | 'negotiation' | 'closed';
  matchScore: number;
  trustScore: number;
  tags: string[];
  type: 'job' | 'client' | 'investor' | 'supplier';
  lastActivityDate?: string;
}

interface CareerContinuousFollowUpProps {
  missionPlan: CareerMissionPlan;
  opportunities: OpportunityItem[];
  onUpdateOpportunityStatus: (id: string, status: OpportunityItem['status']) => void;
  onGenerateApproach: (opp: OpportunityItem, type: 'mail' | 'devis' | 'relance' | 'dossier') => void;
  onOpenCoach3D: () => void;
  onOpenStudio?: () => void;
  onToggleActionCompleted: (actionId: string) => void;
  onAddCustomAction: (action: CareerActionItem) => void;
  onRecordNewOutcome: (outcome: { metric: string; description: string; category: any }) => void;
}

export const CareerContinuousFollowUp: React.FC<CareerContinuousFollowUpProps> = ({
  missionPlan,
  opportunities,
  onUpdateOpportunityStatus,
  onGenerateApproach,
  onOpenCoach3D,
  onOpenStudio,
  onToggleActionCompleted,
  onAddCustomAction,
  onRecordNewOutcome
}) => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'reminders' | 'actions' | 'outcomes'>('pipeline');
  const [newActionTitle, setNewActionTitle] = useState('');
  const [newActionPriority, setNewActionPriority] = useState<'high' | 'medium' | 'low'>('high');

  // Outcome creation form
  const [newOutcomeMetric, setNewOutcomeMetric] = useState('');
  const [newOutcomeDesc, setNewOutcomeDesc] = useState('');
  const [newOutcomeCategory, setNewOutcomeCategory] = useState<'job' | 'revenue' | 'client' | 'funding' | 'contract'>('client');
  const [showOutcomeModal, setShowOutcomeModal] = useState(false);
  const [opportunityToAnalyze, setOpportunityToAnalyze] = useState<OpportunityItem | null>(null);

  const handleCreateAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActionTitle.trim()) return;

    const newAction: CareerActionItem = {
      id: `act-${Date.now()}`,
      title: newActionTitle.trim(),
      priority: newActionPriority,
      deadline: 'Sous 48h',
      estimatedMinutes: 20,
      completed: false,
      moduleLink: 'career',
      smartReminderText: 'Action planifiée pour l\'atteinte du Point B.',
      category: 'prospection'
    };

    onAddCustomAction(newAction);
    setNewActionTitle('');
  };

  const handleCreateOutcome = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOutcomeMetric.trim()) return;

    onRecordNewOutcome({
      metric: newOutcomeMetric.trim(),
      description: newOutcomeDesc.trim() || 'Résultat validé.',
      category: newOutcomeCategory
    });

    setNewOutcomeMetric('');
    setNewOutcomeDesc('');
    setShowOutcomeModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      
      {/* 🔔 PROACTIVE AI REMINDER BANNER */}
      {missionPlan.smartReminders.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-300/60 rounded-3xl p-5 md:p-6 shadow-sm">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wider">
              <BellRing size={16} className="text-amber-600 animate-bounce" />
              <span>Accompagnement Proactif & Relances Intelligentes (Diallo Follow-up)</span>
            </div>
            <span className="text-xs font-extrabold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {missionPlan.smartReminders.filter(r => !r.isRead).length} alertes actives
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {missionPlan.smartReminders.map((rem) => (
              <div key={rem.id} className="p-3.5 bg-white rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-2.5">
                <div>
                  <div className="flex justify-between items-start gap-1">
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{rem.title}</h4>
                    <span className="text-[10px] text-slate-400 shrink-0">{rem.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {rem.message}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[10px] text-amber-700 font-bold">{rem.relatedEntityName || 'Général'}</span>
                  <button
                    onClick={() => {
                      if (rem.actionType === 'open_simulator') onOpenCoach3D();
                      else if (rem.actionType === 'open_relance' && opportunities[0]) onGenerateApproach(opportunities[0], 'relance');
                      else setActiveTab('pipeline');
                    }}
                    className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <span>{rem.actionLabel}</span>
                    <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TOP NAVIGATION CHIPS */}
      <div className="flex justify-between items-center bg-white p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto gap-2">
        <div className="flex gap-2">
          {[
            { id: 'pipeline', label: 'Pipeline Opportunités (Kanban)', icon: BriefcaseBusiness },
            { id: 'actions', label: `Actions Prioritaires (${missionPlan.activeActions.filter(a => !a.completed).length})`, icon: Sparkles },
            { id: 'outcomes', label: `Résultats Réels (${missionPlan.certifiedResultsCount})`, icon: Award }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-slate-900 text-white shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <tab.icon size={15} /> {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowOutcomeModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
        >
          <Plus size={14} /> Enregistrer un Résultat Certifié
        </button>
      </div>

      {/* VIEW 1: KANBAN PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1000px]">
            {[
              { id: 'detected', label: '1. Détecté & Qualifié', color: 'bg-blue-500' },
              { id: 'contacted', label: '2. Contacté / Dossier Envoyé', color: 'bg-indigo-500' },
              { id: 'negotiation', label: '3. Négociation & Entretien', color: 'bg-purple-500' },
              { id: 'closed', label: '4. Gagné & Signé (Résultat)', color: 'bg-emerald-500' }
            ].map((col) => {
              const colOpps = opportunities.filter(o => o.status === col.id);
              return (
                <div key={col.id} className="w-80 shrink-0 bg-slate-100/70 p-4 rounded-3xl border border-slate-200 min-h-[460px] flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${col.color}`} />
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">{col.label}</h4>
                      </div>
                      <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full text-slate-500 shadow-2xs">
                        {colOpps.length}
                      </span>
                    </div>

                    <div className="space-y-3">
                      {colOpps.map((opp) => (
                        <div key={opp.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-all space-y-3">
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h5 className="font-bold text-sm text-slate-900 line-clamp-1">{opp.title}</h5>
                              <span className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                <Building2 size={12} /> {opp.entity}
                              </span>
                            </div>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                              {opp.matchScore}%
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                            "{opp.description}"
                          </p>

                          {/* Contextual Action Buttons */}
                          <div className="space-y-1.5 pt-1">
                            {col.id === 'detected' && (
                              <button
                                onClick={() => onGenerateApproach(opp, opp.type === 'supplier' ? 'devis' : 'mail')}
                                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                              >
                                <Mail size={13} /> {opp.type === 'supplier' ? 'Demander Devis' : 'Générer Approche IA'}
                              </button>
                            )}

                            {col.id === 'contacted' && (
                              <div className="space-y-1.5">
                                <button
                                  onClick={() => onGenerateApproach(opp, 'relance')}
                                  className="w-full py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <RotateCcw size={13} /> Relancer avec IA
                                </button>
                                <button
                                  onClick={() => setOpportunityToAnalyze(opp)}
                                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <MessageSquare size={13} /> Analyser Réponse Reçue
                                </button>
                              </div>
                            )}

                            {col.id === 'negotiation' && (
                              <div className="space-y-1.5">
                                <button
                                  onClick={onOpenCoach3D}
                                  className="w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <Video size={13} /> Simulation Coach 3D
                                </button>
                                <button
                                  onClick={() => setOpportunityToAnalyze(opp)}
                                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                                >
                                  <MessageSquare size={13} /> Décoder Contre-Proposition
                                </button>
                              </div>
                            )}

                            {col.id === 'closed' && (
                              <div className="p-2 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1">
                                <CheckCircle2 size={14} className="text-emerald-600" />
                                <span>Résultat Certifié & Enregistré</span>
                              </div>
                            )}

                            {/* Step Progression Trigger */}
                            {col.id !== 'closed' && (
                              <button
                                onClick={() => onUpdateOpportunityStatus(
                                  opp.id, 
                                  col.id === 'detected' ? 'contacted' : col.id === 'contacted' ? 'negotiation' : 'closed'
                                )}
                                className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all"
                              >
                                <span>Faire avancer à l'étape suivante</span>
                                <ChevronRight size={13} />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}

                      {colOpps.length === 0 && (
                        <div className="py-12 text-center text-xs text-slate-400">
                          Aucune opportunité à cette étape.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: ACTION ITEMS CHECKLIST */}
      {activeTab === 'actions' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-xl font-black text-slate-900">
                Actions Prioritaires Vers le Point B
              </h3>
              <p className="text-xs text-slate-500">
                Chaque action accomplie recalcule dynamiquement vos chances d'atteindre l'objectif.
              </p>
            </div>

            <form onSubmit={handleCreateAction} className="flex gap-2 w-full sm:w-auto">
              <input
                type="text"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Ajouter une action (ex: Relancer client X)..."
                className="p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-72"
              />
              <button
                type="submit"
                disabled={!newActionTitle.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm"
              >
                <Plus size={15} /> Ajouter
              </button>
            </form>
          </div>

          <div className="space-y-2.5">
            {missionPlan.activeActions.map((action) => (
              <div 
                key={action.id} 
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                  action.completed 
                    ? 'bg-slate-50/60 border-slate-200 opacity-60' 
                    : 'bg-white border-slate-200 hover:border-blue-300 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggleActionCompleted(action.id)}
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                      action.completed 
                        ? 'bg-emerald-500 text-white' 
                        : 'border-2 border-slate-300 hover:border-blue-500 text-transparent'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                  </button>

                  <div>
                    <h4 className={`text-xs md:text-sm font-bold ${action.completed ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                      {action.title}
                    </h4>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1"><Clock size={12} /> {action.deadline}</span>
                      <span>• {action.estimatedMinutes} min</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        action.priority === 'high' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                      }`}>
                        {action.priority === 'high' ? 'Priorité Haute' : 'Normal'}
                      </span>
                    </div>
                  </div>
                </div>

                {action.smartReminderText && !action.completed && (
                  <span className="hidden md:inline text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                    💡 {action.smartReminderText}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 3: OUTCOMES (MESURER LE RÉSULTAT, PAS L'ACTIVITÉ) */}
      {activeTab === 'outcomes' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-md space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
                <Award size={16} /> Principes d'Accomplissement Certifié
              </div>
              <h3 className="text-xl font-black text-slate-900 mt-1">
                Résultats Réels Enregistrés
              </h3>
              <p className="text-xs text-slate-500">
                La plateforme mesure les contrats signés, fonds levés, compétences certifiées et emplois obtenus.
              </p>
            </div>

            <button
              onClick={() => setShowOutcomeModal(true)}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-2"
            >
              <Plus size={15} /> Ajouter un Résultat
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {missionPlan.pointA.experiences.map((exp, i) => (
              <div key={i} className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900">{exp.role}</h4>
                    <span className="text-xs text-slate-500">{exp.company} • {exp.duration}</span>
                  </div>
                  {exp.verified && (
                    <StatusBadge status="verified" label="Vérifié" size="sm" />
                  )}
                </div>
                <div className="space-y-1 pt-1">
                  {exp.highlights.map((hl, j) => (
                    <p key={j} className="text-xs text-slate-600 flex items-start gap-1.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span>{hl}</span>
                    </p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: RECORD REAL OUTCOME */}
      {showOutcomeModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl p-6 md:p-8 space-y-5 border border-slate-100">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-emerald-700">
                <Award size={22} />
                <h3 className="text-lg font-black text-slate-900">Enregistrer un Résultat Certifié</h3>
              </div>
              <button onClick={() => setShowOutcomeModal(false)} className="p-3 -m-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateOutcome} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Type de Résultat Obtenu
                </label>
                <select
                  value={newOutcomeCategory}
                  onChange={(e) => setNewOutcomeCategory(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="client">Client Signé & Contrat B2B</option>
                  <option value="job">Emploi Obtenu / Promotion</option>
                  <option value="revenue">Augmentation de Chiffre d'Affaires</option>
                  <option value="funding">Financement / Investisseur Validé</option>
                  <option value="contract">Partenariat / Accord Cadre</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Intitulé du Résultat (Métrique clé)
                </label>
                <input
                  type="text"
                  value={newOutcomeMetric}
                  onChange={(e) => setNewOutcomeMetric(e.target.value)}
                  placeholder="Ex: Contrat de 25k€ signé avec TechCorp, CDI Lead Dev..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Détails & Preuve d'Accomplissement
                </label>
                <textarea
                  value={newOutcomeDesc}
                  onChange={(e) => setNewOutcomeDesc(e.target.value)}
                  placeholder="Explications ou lien de vérification..."
                  rows={3}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowOutcomeModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20"
                >
                  Valider le Résultat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🧠 MODAL: ANALYSE & DÉCODAGE DE RÉPONSE REÇUE (Carrière 3/7) */}
      {opportunityToAnalyze && (
        <CareerResponseAnalyzerModal 
          opportunity={opportunityToAnalyze as any}
          onRecordAnalysis={(analysis) => {
            alert(`Analyse enregistrée ! Énergie de négociation : ${analysis.detectedSentiment}. Action recommandée : ${analysis.actionPlan}`);
            if (analysis.responseType === 'entretien_propose') {
              onUpdateOpportunityStatus(opportunityToAnalyze.id, 'negotiation');
            }
            setOpportunityToAnalyze(null);
          }}
          onClose={() => setOpportunityToAnalyze(null)}
        />
      )}

    </div>
  );
};
