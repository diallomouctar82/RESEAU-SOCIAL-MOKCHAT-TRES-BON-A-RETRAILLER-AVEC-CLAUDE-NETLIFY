import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Sparkles, 
  X, 
  FileText, 
  Video, 
  Mic, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  ArrowRight, 
  Layers, 
  Lock, 
  Send, 
  Zap, 
  Award, 
  Clock, 
  DollarSign, 
  Eye, 
  Edit3, 
  Copy, 
  Check, 
  RotateCcw, 
  Users, 
  Briefcase, 
  HelpCircle, 
  GraduationCap,
  MessageSquare
} from 'lucide-react';
import { 
  ConquestWarRoomDossier, 
  RadarOpportunityItem, 
  MasterResumeProfile,
  ContextualResumeData,
  ConquestApproachDocument,
  Coach3DSimulationSession
} from '../../../types';
import { CareerVoiceFormulationTool } from './CareerVoiceFormulationTool';
import { CareerContextualResumeEditor } from './CareerContextualResumeEditor';
import { CareerMasterResumeModal } from './CareerMasterResumeModal';
import { CareerTeleprompterModal } from './CareerTeleprompterModal';
import { CareerMeetingFlashModal } from './CareerMeetingFlashModal';
import { CareerQualityGateModal } from './CareerQualityGateModal';
import { CareerResponseAnalyzerModal } from './CareerResponseAnalyzerModal';
import { CareerCoach3DModal } from '../CareerCoach3DModal';

interface CareerConquestRoomProps {
  dossier: ConquestWarRoomDossier;
  masterResume: MasterResumeProfile;
  onUpdateDossier: (updated: ConquestWarRoomDossier) => void;
  onUpdateMasterResume: (updated: MasterResumeProfile) => void;
  onConfirmActionAndTransmit: (dossierId: string) => void;
  onClose: () => void;
  onOpenExpert?: (expertId: string) => void;
  onOpenCampus?: () => void;
}

type WarRoomTab = 'diagnostic_gap' | 'documents' | 'oral_video' | 'simulation_nego' | 'checklist_action';

export const CareerConquestRoom: React.FC<CareerConquestRoomProps> = ({
  dossier,
  masterResume,
  onUpdateDossier,
  onUpdateMasterResume,
  onConfirmActionAndTransmit,
  onClose,
  onOpenExpert,
  onOpenCampus
}) => {
  const [currentDossier, setCurrentDossier] = useState<ConquestWarRoomDossier>(dossier);
  const [activeTab, setActiveTab] = useState<WarRoomTab>('diagnostic_gap');
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [selectedPitchKey, setSelectedPitchKey] = useState<'pitch15s' | 'pitch30s' | 'pitch60s' | 'pitchProject' | 'pitchClient'>('pitch30s');
  
  // Modals state
  const [showMasterResumeModal, setShowMasterResumeModal] = useState(false);
  const [showTeleprompterModal, setShowTeleprompterModal] = useState(false);
  const [showMeetingFlashModal, setShowMeetingFlashModal] = useState(false);
  const [showQualityGateModal, setShowQualityGateModal] = useState(false);
  const [showResponseAnalyzerModal, setShowResponseAnalyzerModal] = useState(false);
  const [showCoach3DModal, setShowCoach3DModal] = useState(false);
  const [copiedPitch, setCopiedPitch] = useState(false);

  const opp = currentDossier.opportunity;
  const prep = currentDossier.preparationScore;
  const gap = currentDossier.gapAnalysis5D;

  const handleUpdateContextualResume = (updatedResume: ContextualResumeData) => {
    const updated = { ...currentDossier, contextualResume: updatedResume };
    setCurrentDossier(updated);
    onUpdateDossier(updated);
  };

  const handleUpdateApproachDoc = (newContent: string) => {
    const docs = [...currentDossier.approachDocuments];
    if (docs[selectedDocIndex]) {
      docs[selectedDocIndex].bodyContent = newContent;
      docs[selectedDocIndex].lastEditedAt = 'À l\'instant';
      const updated = { ...currentDossier, approachDocuments: docs };
      setCurrentDossier(updated);
      onUpdateDossier(updated);
    }
  };

  const handleToggleChecklistItem = (itemId: string) => {
    const updatedChecklist = currentDossier.checklist.map(item => 
      item.id === itemId ? { ...item, isCompleted: !item.isCompleted } : item
    );
    const completedCount = updatedChecklist.filter(i => i.isCompleted).length;
    const newPrepScore = Math.min(100, Math.round((completedCount / updatedChecklist.length) * 100));

    const updated = {
      ...currentDossier,
      checklist: updatedChecklist,
      preparationScore: {
        ...currentDossier.preparationScore,
        overallPreparationScore: newPrepScore,
        statusVerdict: newPrepScore >= 80 ? ('pret' as const) : newPrepScore >= 60 ? ('presque_pret' as const) : ('preparation_importante_requise' as const)
      }
    };
    setCurrentDossier(updated);
    onUpdateDossier(updated);
  };

  const handleRecordCoachScore = (score: number, mode: string) => {
    const newSim: Coach3DSimulationSession = {
      id: `sim-${Date.now()}`,
      type: 'interview',
      roleplayPersona: `Recruteur / Décideur (${opp.entity})`,
      contextTitle: `Simulation : ${opp.title}`,
      difficulty: 'intermediaire',
      turnCount: 4,
      performanceScore: score,
      strengths: ['Bonne articulation des chiffres clés', 'Posture professionnelle'],
      improvements: ['Préciser la méthodologie de gestion des risques'],
      idealPhrasingSuggested: 'Je propose un premier livrable sous 10 jours ouvrés.',
      date: 'À l\'instant'
    };

    const updated = {
      ...currentDossier,
      simulationHistory: [newSim, ...currentDossier.simulationHistory],
      preparationScore: {
        ...currentDossier.preparationScore,
        breakdown: {
          ...currentDossier.preparationScore.breakdown,
          simulationTrainingReadiness: Math.min(100, Math.round(score * 10))
        }
      }
    };
    setCurrentDossier(updated);
    onUpdateDossier(updated);
  };

  const handleCopyCurrentPitch = () => {
    const pitchText = currentDossier.pitches[selectedPitchKey];
    navigator.clipboard.writeText(pitchText);
    setCopiedPitch(true);
    setTimeout(() => setCopiedPitch(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-2 md:p-5 animate-fade-up">
      <div className="bg-slate-900 text-white w-full max-w-6xl rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[94vh] border border-slate-800">
        
        {/* TOP HEADER: OPPORTUNITY IDENTITY & QUICK ACTIONS */}
        <div className="p-4 md:p-5 bg-slate-950 flex flex-col md:flex-row md:items-center justify-between gap-3 shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 border border-blue-400/40 text-white rounded-2xl shadow-lg shadow-blue-600/30">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black text-blue-400 uppercase tracking-wider">Salle de Préparation & Cockpit de Conquête</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 text-[10px] font-bold border border-blue-800/60 uppercase">
                  {opp.universe}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold">
                  {opp.location}
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black text-white truncate max-w-xl">
                {opp.title} · <span className="text-blue-400">{opp.entity}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 30 Min Flash Button */}
            <button
              onClick={() => setShowMeetingFlashModal(true)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Zap size={13} className="text-yellow-400" />
              <span>Flash 30 min</span>
            </button>

            {/* Quality Gate Button */}
            <button
              onClick={() => setShowQualityGateModal(true)}
              className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
            >
              <Send size={13} />
              <span>Valider l'Action</span>
            </button>

            <button 
              onClick={onClose} 
              className="p-3 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors ml-1"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* STATUS & READINESS METRICS BAR */}
        <div className="bg-slate-950/70 px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Readiness vs Compatibility */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Compatibilité Radar :</span>
              <span className="font-mono font-black text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded-md border border-blue-800/40">
                {prep.compatibilityMatchScore}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Niveau de Préparation :</span>
              <span className={`font-mono font-black px-2 py-0.5 rounded-md border ${
                prep.overallPreparationScore >= 80 
                  ? 'text-emerald-400 bg-emerald-950/80 border-emerald-800/50' 
                  : prep.overallPreparationScore >= 60 
                  ? 'text-amber-400 bg-amber-950/80 border-amber-800/50' 
                  : 'text-rose-400 bg-rose-950/80 border-rose-800/50'
              }`}>
                {prep.overallPreparationScore}%
              </span>
            </div>

            {/* Verdict Badge */}
            <div className="flex items-center gap-1.5">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                prep.statusVerdict === 'pret'
                  ? 'bg-emerald-600 text-white'
                  : prep.statusVerdict === 'presque_pret'
                  ? 'bg-amber-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {prep.statusVerdict === 'pret' ? '⚡ Prêt à agir' : prep.statusVerdict === 'presque_pret' ? '🎯 Presque prêt' : '⚠️ Préparation requise'}
              </span>
            </div>
          </div>

          {/* Quick Tools Access */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowResponseAnalyzerModal(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <MessageSquare size={12} className="text-blue-400" />
              <span>Analyser Réponse Reçue</span>
            </button>

            <button
              onClick={() => setShowMasterResumeModal(true)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-all"
            >
              <FileText size={12} className="text-emerald-400" />
              <span>CV Maître</span>
            </button>
          </div>

        </div>

        {/* WORKSPACE NAVIGATION TABS */}
        <div className="flex border-b border-slate-800 bg-slate-950 px-6 gap-1 md:gap-2 overflow-x-auto">
          {[
            { id: 'diagnostic_gap', label: '1. Diagnostic & Gap Analysis 5D', icon: TrendingUp },
            { id: 'documents', label: '2. Atelier Documents & CV Contextuel', icon: FileText },
            { id: 'oral_video', label: '3. Atelier Oratoire, Pitchs & Vidéo', icon: Video },
            { id: 'simulation_nego', label: '4. Simulation Coach 3D & Négociation', icon: Mic },
            { id: 'checklist_action', label: '5. Checklist & Pilotage Action', icon: CheckCircle2 }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as WarRoomTab)}
              className={`py-3.5 px-3 md:px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* MAIN WORKSPACE BODY */}
        <div className="p-5 md:p-6 overflow-y-auto flex-1 bg-slate-900 space-y-6">
          
          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 1: DIAGNOSTIC & GAP ANALYSIS 5D
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'diagnostic_gap' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* STATUS & EXPLANATION BANNER */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Diagnostic Stratégique</span>
                    <span className="text-xs font-black text-slate-300">· « Est-ce que je suis prêt ? »</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans">
                    {prep.verdictExplanation}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 text-center text-xs shrink-0">
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Documents :</span>
                    <span className="font-bold text-emerald-400">{prep.breakdown.documentsReadiness}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Argumentaire :</span>
                    <span className="font-bold text-blue-400">{prep.breakdown.pitchAndArgumentsReadiness}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Oral / Coach 3D :</span>
                    <span className="font-bold text-amber-400">{prep.breakdown.simulationTrainingReadiness}%</span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">Pièces Reçues :</span>
                    <span className="font-bold text-emerald-400">{prep.breakdown.administrativePiecesReadiness}%</span>
                  </div>
                </div>
              </div>

              {/* 5-DIMENSIONS GAP MATRIX */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Ce que tu possèdes déjà */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                    <CheckCircle2 size={15} />
                    <span>1. Ce que tu possèdes déjà (Atouts Validés)</span>
                  </div>
                  <div className="space-y-2">
                    {gap.alreadyPossessed.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                        <strong className="text-white block">{item.item}</strong>
                        <p className="text-slate-400 text-[11px]">{item.detail}</p>
                        {item.proofExperience && (
                          <span className="inline-block text-[10px] text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 font-semibold">
                            Preuve : {item.proofExperience}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Ce qu'il faut mieux présenter */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
                    <Sparkles size={15} className="text-yellow-400" />
                    <span>2. Ce qu'il faut mieux présenter (Formulation)</span>
                  </div>
                  <div className="space-y-2">
                    {gap.betterPresent.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <strong className="text-white block">{item.item}</strong>
                        <div className="text-[11px] text-slate-400 line-through bg-slate-950 p-1.5 rounded">
                          Avant : {item.currentFormulation}
                        </div>
                        <div className="text-[11px] text-blue-300 bg-blue-950/60 p-1.5 rounded border border-blue-800/40">
                          <strong>Recommandé :</strong> {item.recommendedHighlight}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Ce qu'il te manque */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle size={15} />
                    <span>3. Ce qu'il te manque (Lacunes réelles)</span>
                  </div>
                  <div className="space-y-2">
                    {gap.realGaps.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1.5">
                        <div className="flex justify-between items-start">
                          <strong className="text-white">{item.item}</strong>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded capitalize ${
                            item.impactLevel === 'bloquant' ? 'bg-rose-950 text-rose-300 border border-rose-800/50' : 'bg-amber-950 text-amber-300'
                          }`}>
                            {item.impactLevel}
                          </span>
                        </div>
                        {item.suggestedCampusCourse && (
                          <div className="flex items-center justify-between text-[11px] text-blue-300 bg-blue-950/40 p-2 rounded-lg border border-blue-900/40">
                            <span className="flex items-center gap-1.5">
                              <GraduationCap size={13} /> {item.suggestedCampusCourse}
                            </span>
                            {onOpenCampus && (
                              <button onClick={onOpenCampus} className="text-xs font-bold text-blue-400 hover:underline">
                                Explorer →
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. Ce que nous pouvons améliorer rapidement (Quick Wins) */}
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5">
                  <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
                    <Zap size={15} className="text-yellow-400" />
                    <span>4. Actions Rapides (Quick Wins)</span>
                  </div>
                  <div className="space-y-2">
                    {gap.quickWins.map((item, idx) => (
                      <div key={idx} className="p-2.5 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                        <div className="flex justify-between items-start">
                          <strong className="text-white">{item.item}</strong>
                          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-800/40">
                            ~{item.estimatedTimeMinutes} min
                          </span>
                        </div>
                        <p className="text-slate-400 text-[11px]">{item.action}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* 5. RISQUES STRATÉGIQUES */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle size={15} />
                  <span>5. Ce qui constitue un risque & Parades Stratégiques</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {gap.strategicRisks.map((risk, idx) => (
                    <div key={idx} className="p-3 bg-slate-900/80 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex justify-between items-start">
                        <strong className="text-white">{risk.risk}</strong>
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Sévérité : {risk.severity}</span>
                      </div>
                      <p className="text-emerald-300 text-[11px] bg-slate-950 p-2 rounded-lg border border-slate-800">
                        🛡️ <strong>Parade :</strong> {risk.mitigationAdvice}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 2: ATELIER DOCUMENTS & CV CONTEXTUEL
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'documents' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* VOICE FORMULATION ASSISTANT EMBEDDED */}
              <CareerVoiceFormulationTool
                contextOpportunityTitle={opp.title}
                contextEntityName={opp.entity}
                onApplyFormulation={(text) => handleUpdateApproachDoc(text)}
              />

              {/* APPROACH DOCUMENTS TABS */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <FileText size={14} className="text-blue-400" /> Documents & Messages d'Approche
                  </h4>
                  <span className="text-xs text-slate-400 font-mono">
                    {currentDossier.approachDocuments.length} documents préparés
                  </span>
                </div>

                {/* Doc Picker */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {currentDossier.approachDocuments.map((doc, idx) => (
                    <button
                      key={doc.id}
                      onClick={() => setSelectedDocIndex(idx)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                        selectedDocIndex === idx
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      {doc.title}
                    </button>
                  ))}
                </div>

                {/* Selected Doc Editor */}
                {currentDossier.approachDocuments[selectedDocIndex] && (
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Objet / Sujet :</span>
                        <strong className="text-white text-xs">{currentDossier.approachDocuments[selectedDocIndex].subject}</strong>
                      </div>
                      <span className="text-slate-400 font-mono text-[10px]">
                        Dernière modif : {currentDossier.approachDocuments[selectedDocIndex].lastEditedAt}
                      </span>
                    </div>

                    <textarea
                      value={currentDossier.approachDocuments[selectedDocIndex].bodyContent}
                      onChange={(e) => handleUpdateApproachDoc(e.target.value)}
                      className="w-full h-48 bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs text-white resize-none outline-none focus:ring-2 focus:ring-blue-500 font-sans leading-relaxed"
                    />

                    <div className="flex justify-between items-center text-[11px] text-slate-400">
                      <span>💡 <strong>Objectif de clôture :</strong> {currentDossier.approachDocuments[selectedDocIndex].callToAction}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(currentDossier.approachDocuments[selectedDocIndex].bodyContent);
                          alert('Texte copié dans le presse-papier !');
                        }}
                        className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold flex items-center gap-1"
                      >
                        <Copy size={12} /> Copier
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* CONTEXTUAL CV EDITOR EMBEDDED */}
              <CareerContextualResumeEditor
                contextualResume={currentDossier.contextualResume}
                masterResume={masterResume}
                opportunity={opp}
                onUpdateContextualResume={handleUpdateContextualResume}
                onOpenMasterResume={() => setShowMasterResumeModal(true)}
              />

            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 3: ATELIER ORATOIRE, PITCHS & VIDÉO
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'oral_video' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* VIDEO SCRIPT & TELEPROMPTER CALLOUT */}
              <div className="p-5 md:p-6 bg-slate-900 border border-blue-800/50 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1.5 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                      <Video size={14} /> Vidéo de Présentation Studio
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-blue-900/60 text-blue-300 text-[10px] font-bold">
                      Format {currentDossier.videoScript.targetDurationSeconds}s
                    </span>
                  </div>
                  <h3 className="text-base font-black text-white">
                    Prompteur Interactif & Script Minuté pour {opp.entity}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Entraînez-vous avec notre prompteur défilant professionnel, contrôlez votre tempo et enregistrez votre vidéo de candidature.
                  </p>
                </div>

                <button
                  onClick={() => setShowTeleprompterModal(true)}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold shadow-xl shadow-blue-600/30 flex items-center gap-2 shrink-0 transition-all"
                >
                  <Video size={16} />
                  <span>Ouvrir le Prompteur Studio</span>
                </button>
              </div>

              {/* 5 DECLINED PITCHES */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <Sparkles size={14} className="text-yellow-400" /> Les 5 Déclinaisons de Pitch Personnel
                  </h4>
                  <button
                    onClick={handleCopyCurrentPitch}
                    className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    {copiedPitch ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    <span>{copiedPitch ? 'Copié !' : 'Copier le pitch'}</span>
                  </button>
                </div>

                {/* Pitch Selector Buttons */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {[
                    { id: 'pitch15s', label: '15s (Flash)', desc: 'Qui suis-je' },
                    { id: 'pitch30s', label: '30s (Accroche)', desc: 'Ce que j\'apporte' },
                    { id: 'pitch60s', label: '60s (Complet)', desc: 'Présentation Pro' },
                    { id: 'pitchProject', label: 'Pitch Projet', desc: 'Investisseurs' },
                    { id: 'pitchClient', label: 'Pitch Client', desc: 'Vente B2B' }
                  ].map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPitchKey(p.id as any)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        selectedPitchKey === p.id
                          ? 'bg-blue-600 border-blue-500 text-white shadow-md'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <strong className="block text-xs font-bold">{p.label}</strong>
                      <span className="text-[10px] opacity-80">{p.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Active Pitch Content Display */}
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-blue-400 font-bold uppercase">
                    <span>Texte à prononcer :</span>
                    <span>Durée estimée : ~{selectedPitchKey === 'pitch15s' ? '15s' : selectedPitchKey === 'pitch30s' ? '30s' : '60s'}</span>
                  </div>
                  <p className="text-xs md:text-sm text-slate-200 leading-relaxed font-sans font-medium">
                    "{currentDossier.pitches[selectedPitchKey]}"
                  </p>
                </div>
              </div>

            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 4: SIMULATION COACH 3D & NÉGOCIATION
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'simulation_nego' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* LAUNCH COACH 3D HERO CARD */}
              <div className="p-6 bg-slate-900 border border-blue-800/40 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Mic size={14} /> Simulateur d'Entretien Contextualisé
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-purple-900/60 text-purple-300 text-[10px] font-bold">
                      Jeu de Rôle Diallo
                    </span>
                  </div>
                  <h3 className="text-base md:text-lg font-black text-white">
                    Simulez l'entretien avec le profil exact de {opp.entity}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Le Coach 3D adopte la posture, le ton et les questions techniques spécifiques à l'offre : « {opp.title} ».
                  </p>
                </div>

                <button
                  onClick={() => setShowCoach3DModal(true)}
                  className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black shadow-xl shadow-blue-600/30 flex items-center gap-2 shrink-0 transition-all"
                >
                  <Video size={16} />
                  <span>Démarrer Simulation Vocale</span>
                </button>
              </div>

              {/* SIMULATION HISTORY & STATS */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Award size={14} className="text-yellow-400" /> Historique des Entraînements sur cette Opportunité
                </h4>

                {currentDossier.simulationHistory && currentDossier.simulationHistory.length > 0 ? (
                  <div className="space-y-3">
                    {currentDossier.simulationHistory.map((sim) => (
                      <div key={sim.id} className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white">{sim.contextTitle}</span>
                            <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded">
                              {sim.roleplayPersona}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Forces : {sim.strengths?.join(', ')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="text-base font-black text-emerald-400">{sim.performanceScore} / 10</span>
                          <span className="text-[10px] text-slate-500">{sim.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 text-center py-6">
                    Aucune simulation enregistrée sur cette opportunité. Lancez un premier entraînement vocal pour booster votre score de préparation.
                  </p>
                )}
              </div>

            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 5: CHECKLIST & PILOTAGE ACTION
             ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {activeTab === 'checklist_action' && (
            <div className="space-y-6 animate-fade-up">
              
              {/* DYNAMIC CHECKLIST */}
              <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 md:p-6 space-y-4">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <div>
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-emerald-400" /> Checklist Dynamique de Conquête
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Chaque case cochée élève votre score de préparation et garantit une action réussie.
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800/40">
                    {currentDossier.checklist.filter(i => i.isCompleted).length} / {currentDossier.checklist.length} Validés
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentDossier.checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleToggleChecklistItem(item.id)}
                      className={`p-3.5 rounded-2xl border text-xs flex items-start gap-3 cursor-pointer select-none transition-all ${
                        item.isCompleted
                          ? 'bg-slate-900 border-emerald-500/40 text-slate-200'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <div className={`mt-0.5 p-1 rounded-lg ${
                        item.isCompleted ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'
                      }`}>
                        <Check size={14} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <strong className={`font-bold text-xs ${item.isCompleted ? 'text-white' : 'text-slate-300'}`}>
                            {item.label}
                          </strong>
                          {item.isRequiredForSubmission && (
                            <span className="text-[9px] bg-rose-950 text-rose-300 px-1.5 py-0.5 rounded font-bold">
                              Obligatoire
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ACTION DISPATCH BAR */}
              <div className="p-5 bg-slate-900 border border-emerald-800/40 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Lock size={12} /> Étape Finale : Autorisation & Engagement
                  </span>
                  <p className="text-xs text-slate-200">
                    Prêt à engager cette démarche ? Le contrôle qualité vérifie tous les éléments avant enregistrement dans votre pipeline Suivi.
                  </p>
                </div>

                <button
                  onClick={() => setShowQualityGateModal(true)}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black shadow-lg shadow-emerald-600/30 flex items-center gap-2 shrink-0 transition-all"
                >
                  <Send size={15} />
                  <span>Ouvrir la Passerelle de Validation</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* SUB-MODALS */}
        {showMasterResumeModal && (
          <CareerMasterResumeModal
            masterResume={masterResume}
            onUpdateMasterResume={onUpdateMasterResume}
            onClose={() => setShowMasterResumeModal(false)}
          />
        )}

        {showTeleprompterModal && (
          <CareerTeleprompterModal
            videoScript={currentDossier.videoScript}
            opportunity={opp}
            onUpdateScript={(updated) => {
              const updatedDossier = { ...currentDossier, videoScript: updated };
              setCurrentDossier(updatedDossier);
              onUpdateDossier(updatedDossier);
            }}
            onClose={() => setShowTeleprompterModal(false)}
          />
        )}

        {showMeetingFlashModal && (
          <CareerMeetingFlashModal
            flashCard={currentDossier.quickMeetingFlashCard}
            opportunity={opp}
            onClose={() => setShowMeetingFlashModal(false)}
          />
        )}

        {showQualityGateModal && (
          <CareerQualityGateModal
            dossier={currentDossier}
            onConfirmAction={() => {
              setShowQualityGateModal(false);
              onConfirmActionAndTransmit(currentDossier.id);
            }}
            onClose={() => setShowQualityGateModal(false)}
          />
        )}

        {showResponseAnalyzerModal && (
          <CareerResponseAnalyzerModal
            opportunity={opp}
            onRecordAnalysis={(analysis) => {
              const updated = {
                ...currentDossier,
                responsesReceived: [analysis, ...currentDossier.responsesReceived],
                actionStatus: 'reponse_recue' as const
              };
              setCurrentDossier(updated);
              onUpdateDossier(updated);
            }}
            onClose={() => setShowResponseAnalyzerModal(false)}
          />
        )}

        {showCoach3DModal && (
          <CareerCoach3DModal
            userName={masterResume.fullName}
            userTitle={opp.title}
            activeGoalTitle={`Réussir l'opportunité ${opp.title} chez ${opp.entity}`}
            onClose={() => setShowCoach3DModal(false)}
            onRecordSessionScore={handleRecordCoachScore}
          />
        )}

      </div>
    </div>
  );
};
