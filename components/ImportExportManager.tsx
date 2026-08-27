import React, { useState } from 'react';
import { 
  Truck, 
  Globe, 
  MapPin, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Plane, 
  Ship, 
  Calendar, 
  DollarSign, 
  AlertTriangle, 
  ArrowRight, 
  Bot, 
  Sparkles, 
  Download, 
  Briefcase, 
  Plus, 
  Scale,
  Check,
  Building,
  UserCheck
} from 'lucide-react';
import { ImportExportProject, ImportExportRoadmapStep } from '../types';
import { GoogleGenAI } from '@google/genai';

interface ImportExportManagerProps {
  projects: ImportExportProject[];
  onOpenTradeExpert: (context: string) => void;
  onSelectProject?: (project: ImportExportProject) => void;
}

export const ImportExportManager: React.FC<ImportExportManagerProps> = ({
  projects,
  onOpenTradeExpert
}) => {
  const [selectedProject, setSelectedProject] = useState<ImportExportProject>(projects[0] || null);
  const [activeSubTab, setActiveSubTab] = useState<'roadmap' | 'landed_cost' | 'business_trip' | 'compliance'>('roadmap');
  const [isSimulatingRoadmap, setIsSimulatingRoadmap] = useState(false);
  const [simulationPrompt, setSimulationPrompt] = useState('');

  // Step toggle handler for UI interactivity
  const handleToggleStep = (stepNumber: number) => {
    if (!selectedProject) return;
    const updatedSteps = selectedProject.steps.map(s => {
      if (s.stepNumber === stepNumber) {
        const nextStatus = s.status === 'completed' ? 'in_progress' : s.status === 'in_progress' ? 'pending' : 'completed';
        return { ...s, status: nextStatus as any };
      }
      return s;
    });
    setSelectedProject({ ...selectedProject, steps: updatedSteps });
  };

  const handleToggleTripItem = (index: number) => {
    if (!selectedProject || !selectedProject.businessTripPlanned) return;
    const updatedList = [...selectedProject.businessTripPlanned.checklist];
    updatedList[index].done = !updatedList[index].done;
    setSelectedProject({
      ...selectedProject,
      businessTripPlanned: {
        ...selectedProject.businessTripPlanned,
        checklist: updatedList
      }
    });
  };

  const landed = selectedProject?.landedCostBreakdown;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-purple-500/20 rounded-3xl text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
              <Globe size={13} /> Parcours Guidé Import / Export
            </span>
            <span className="text-xs text-slate-400">Accompagnement de A à Z</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Feuille de Route Commerciale & Coût Rendu
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Du sourcing initial au dédouanement portuaire et à la livraison usine : 
            suivez chaque jalon réglementaire avec l'Expert Commerce Diallo et vos transitaires.
          </p>
        </div>

        <button
          onClick={() => onOpenTradeExpert(`Conseil stratégique pour le projet "${selectedProject?.title}"`)}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg transition-transform hover:scale-105 shrink-0 flex items-center gap-1.5"
        >
          <Sparkles size={16} />
          <span>Consulter l'Expert Douane/Fret</span>
        </button>
      </div>

      {selectedProject && (
        <div className="p-6 bg-slate-900 border border-white/10 rounded-3xl text-white space-y-6">
          
          {/* Project Summary Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-400 mb-1">
                <span className="uppercase tracking-wider">{selectedProject.type === 'import' ? 'Projet d\'Importation' : 'Projet d\'Exportation'}</span>
                <span>•</span>
                <span>Origine : {selectedProject.originCountry} → Destination : {selectedProject.destinationCountry}</span>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                {selectedProject.title}
              </h3>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase block">Budget Total Estimé</span>
                <span className="text-lg font-black text-emerald-400">
                  {selectedProject.budgetTotalEstimated.toLocaleString()} {selectedProject.currency}
                </span>
              </div>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex border-b border-white/10 pb-2 gap-2 overflow-x-auto">
            {[
              { id: 'roadmap', label: 'Feuille de route (7 Jalons)', icon: Clock },
              { id: 'landed_cost', label: 'Décomposition Coût Rendu (DDP)', icon: DollarSign },
              { id: 'business_trip', label: 'Mission Commerciale / Voyage', icon: Plane },
              { id: 'compliance', label: 'Réglementation & Douanes', icon: Scale },
            ].map(t => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  onClick={() => setActiveSubTab(t.id as any)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap ${
                    activeSubTab === t.id 
                      ? 'bg-purple-600 text-white shadow-sm' 
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <Icon size={14} />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* SUBTAB 1: ROADMAP */}
          {activeSubTab === 'roadmap' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Progression du dossier (Cliquez pour marquer un jalon)
                </span>
                <span className="text-xs text-purple-300 font-semibold">
                  Jalon en cours : Étape {selectedProject.currentStepIndex} / {selectedProject.steps.length}
                </span>
              </div>

              <div className="space-y-3">
                {selectedProject.steps.map(step => (
                  <div 
                    key={step.stepNumber}
                    onClick={() => handleToggleStep(step.stepNumber)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                      step.status === 'completed' 
                        ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                        : step.status === 'in_progress'
                        ? 'bg-purple-950/30 border-purple-500/40 text-purple-100 shadow-md ring-1 ring-purple-500/30'
                        : 'bg-slate-950/40 border-white/5 text-slate-400 opacity-80'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-8 h-8 rounded-xl font-bold flex items-center justify-center shrink-0 text-xs ${
                        step.status === 'completed' ? 'bg-emerald-500 text-black' : step.status === 'in_progress' ? 'bg-purple-500 text-white' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {step.status === 'completed' ? <Check size={16} /> : step.stepNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 font-bold uppercase">
                            {step.phase}
                          </span>
                          <span className="text-xs text-slate-400">
                            • {step.responsibleAgent}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1">
                          {step.title}
                        </h4>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {step.description}
                        </p>
                        {step.deliverables && (
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            {step.deliverables.map((deliv, dIdx) => (
                              <span key={dIdx} className="text-[10px] px-2 py-0.5 bg-black/40 rounded-md text-slate-300 border border-white/5 flex items-center gap-1">
                                <FileText size={10} className="text-purple-400" />
                                {deliv}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
                      <span className="text-xs font-mono text-purple-300">
                        {step.estimatedDuration}
                      </span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-1 ${
                        step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' : step.status === 'in_progress' ? 'bg-purple-500/20 text-purple-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {step.status === 'completed' ? 'Validé' : step.status === 'in_progress' ? 'En cours' : 'À venir'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBTAB 2: LANDED COST */}
          {activeSubTab === 'landed_cost' && landed && (
            <div className="space-y-6">
              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl">
                <h4 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                  <DollarSign size={16} className="text-emerald-400" />
                  <span>Architecture Financière du Coût Rendu (Landed Cost Breakdown)</span>
                </h4>
                <p className="text-xs text-slate-400 mb-4">
                  Chaque composante est classée selon son statut réel : Coût certain (connu) ou Coût estimatif basé sur les barèmes douaniers et maritimes actuels.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">1. Prix d'Achat Marchandise (FOB) :</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Connu</span>
                    </div>
                    <span className="text-base font-extrabold text-white">{landed.productCost.toLocaleString()} {landed.currency}</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">2. Fret Maritime / Aérien :</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Connu</span>
                    </div>
                    <span className="text-base font-extrabold text-blue-300">+{landed.transportCost.toLocaleString()} {landed.currency}</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">3. Assurance Marchandise Transportée :</span>
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">Connu</span>
                    </div>
                    <span className="text-base font-extrabold text-teal-300">+{landed.insuranceCost.toLocaleString()} {landed.currency}</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">4. Droits de Douane (DD) :</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Estimé</span>
                    </div>
                    <span className="text-base font-extrabold text-amber-300">+{landed.customsDutyCost.toLocaleString()} {landed.currency}</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">5. Taxes Locales & TVA à l'import :</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Estimé</span>
                    </div>
                    <span className="text-base font-extrabold text-amber-200">+{landed.vatLocalTaxCost.toLocaleString()} {landed.currency}</span>
                  </div>

                  <div className="p-3 bg-slate-900 border border-white/5 rounded-xl space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">6. Manutention Portuaire & Livraison :</span>
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 text-[10px]">Estimé</span>
                    </div>
                    <span className="text-base font-extrabold text-purple-300">+{landed.localHandlingCost.toLocaleString()} {landed.currency}</span>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">Coût Rendu Global (Landed Cost Total)</span>
                    <span className="text-xs text-slate-300">Rendu usine ou entrepôt avec tous frais inclus</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-emerald-400">
                    {landed.totalEstimated.toLocaleString()} {landed.currency}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 3: BUSINESS TRIP */}
          {activeSubTab === 'business_trip' && selectedProject.businessTripPlanned && (
            <div className="space-y-4">
              <div className="p-5 bg-slate-950/60 border border-white/10 rounded-2xl space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Mission d'Affaires & Inspection Usine</span>
                    <h4 className="text-base font-bold text-white mt-0.5">
                      {selectedProject.businessTripPlanned.destinationCity} ({selectedProject.businessTripPlanned.targetDates})
                    </h4>
                  </div>
                  <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-bold rounded-xl">
                    {selectedProject.businessTripPlanned.visaStatus}
                  </span>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">Fournisseurs & usines au programme :</span>
                  <div className="flex flex-wrap gap-2">
                    {selectedProject.businessTripPlanned.suppliersToMeet.map((s, idx) => (
                      <span key={idx} className="px-3 py-1.5 bg-slate-900 border border-white/10 rounded-xl text-xs text-white font-medium flex items-center gap-1.5">
                        <Building size={13} className="text-purple-400" />
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-xs font-bold text-slate-400 block mb-2">Checklist de préparation du voyage :</span>
                  <div className="space-y-2">
                    {selectedProject.businessTripPlanned.checklist.map((item, idx) => (
                      <div 
                        key={idx}
                        onClick={() => handleToggleTripItem(idx)}
                        className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-colors ${
                          item.done ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200' : 'bg-slate-900 border-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 text-xs">
                          <input type="checkbox" checked={item.done} onChange={() => {}} className="pointer-events-none" />
                          <span className={item.done ? 'line-through text-slate-400' : 'font-medium'}>{item.item}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold text-slate-500">{item.done ? 'Prêt' : 'À faire'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SUBTAB 4: COMPLIANCE & CUSTOMS */}
          {activeSubTab === 'compliance' && (
            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-4 bg-slate-950/60 border border-white/10 rounded-2xl space-y-3">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Scale size={15} /> Textes réglementaires & Contrôles documentaires
                </span>
                <p>
                  Pour ce type de marchandise, les autorités douanières exigent le respect de la nomenclature tarifaire et des contrôles avant embarquement (Programme BIVAC / AV).
                </p>
                <div className="space-y-2">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>Certificat de Conformité AV (Attestation de Vérification) :</span>
                    <span className="text-emerald-400 font-bold">Obligatoire au-delà de 5 000 USD</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-white/5 flex items-center justify-between">
                    <span>Exonération au titre du Code des Investissements :</span>
                    <span className="text-purple-400 font-bold">Dossier éligible sur demande</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
