import React, { useState } from 'react';
import { 
  Compass, 
  GitFork, 
  Network, 
  Award, 
  Calendar, 
  AlertOctagon, 
  Users, 
  Scale, 
  FileText, 
  Milestone, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  TrendingUp, 
  GraduationCap, 
  Layers, 
  ShieldCheck, 
  Clock, 
  Mic,
  RefreshCw,
  Gauge
} from 'lucide-react';
import {
  StrategicCareerCompass,
  CareerTrajectorySimulation,
  WhatIfScenario,
  CareerGraphNode,
  SkillGraphItem,
  TransferableSkillMapping,
  MarketWeakSignal,
  EvolutionPlan90Days,
  YearlyMilestonePlan,
  CareerCheckpoint,
  CareerPlateauDiagnosis,
  CareerAccelerationLever,
  MultiExpertCareerCouncil,
  PersonalDecisionMatrix,
  CareerAIBilan,
  CareerEvolutionTimelineStep
} from '../../../types';

import { CareerStrategicCompassModal } from './CareerStrategicCompassModal';
import { CareerTrajectorySimulatorModal } from './CareerTrajectorySimulatorModal';
import { CareerSkillGraphGapModal } from './CareerSkillGraphGapModal';
import { CareerSkillsPassportModal } from './CareerSkillsPassportModal';
import { CareerEvolutionPlansModal } from './CareerEvolutionPlansModal';
import { CareerPlateauUnlockModal } from './CareerPlateauUnlockModal';
import { CareerMultiExpertCouncilModal } from './CareerMultiExpertCouncilModal';
import { CareerDecisionMatrixModal } from './CareerDecisionMatrixModal';
import { CareerAIBilanModal } from './CareerAIBilanModal';
import { CareerEvolutionTimelineModal } from './CareerEvolutionTimelineModal';

interface CareerStrategicAdvisorHubProps {
  compass: StrategicCareerCompass;
  trajectories: CareerTrajectorySimulation[];
  whatIfScenarios: WhatIfScenario[];
  careerGraphNodes: CareerGraphNode[];
  skillGraph: SkillGraphItem[];
  transferableSkills: TransferableSkillMapping[];
  weakSignals: MarketWeakSignal[];
  plan90Days: EvolutionPlan90Days;
  yearlyPlan: YearlyMilestonePlan;
  checkpoints: CareerCheckpoint[];
  plateauDiagnosis: CareerPlateauDiagnosis;
  accelerationLevers: CareerAccelerationLever[];
  council: MultiExpertCareerCouncil;
  decisionMatrix: PersonalDecisionMatrix;
  bilan: CareerAIBilan;
  timelineSteps: CareerEvolutionTimelineStep[];
  userName: string;
  userRole: string;
  onOpenCampus?: (subjectTitle?: string) => void;
  onConsultExpert?: (expertName: string, role: string) => void;
  onOpenVoiceBilan?: () => void;
  onUpdateCompass?: (updated: StrategicCareerCompass) => void;
}

export const CareerStrategicAdvisorHub: React.FC<CareerStrategicAdvisorHubProps> = ({
  compass,
  trajectories,
  whatIfScenarios,
  careerGraphNodes,
  skillGraph,
  transferableSkills,
  weakSignals,
  plan90Days,
  yearlyPlan,
  checkpoints,
  plateauDiagnosis,
  accelerationLevers,
  council,
  decisionMatrix,
  bilan,
  timelineSteps,
  userName,
  userRole,
  onOpenCampus,
  onConsultExpert,
  onOpenVoiceBilan,
  onUpdateCompass
}) => {
  // Modal states
  const [modalOpen, setModalOpen] = useState<{
    compass: boolean;
    trajectories: boolean;
    skillGraph: boolean;
    passport: boolean;
    plans: boolean;
    plateau: boolean;
    council: boolean;
    decisionMatrix: boolean;
    bilan: boolean;
    timeline: boolean;
  }>({
    compass: false,
    trajectories: false,
    skillGraph: false,
    passport: false,
    plans: false,
    plateau: false,
    council: false,
    decisionMatrix: false,
    bilan: false,
    timeline: false
  });

  const openModal = (name: keyof typeof modalOpen) => {
    setModalOpen(prev => ({ ...prev, [name]: true }));
  };

  const closeModal = (name: keyof typeof modalOpen) => {
    setModalOpen(prev => ({ ...prev, [name]: false }));
  };

  return (
    <div className="space-y-6">
      
      {/* 1. HERO STRATÉGIQUE : Boussole Active & Cap Point A ➔ Point B */}
      <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-black text-xs uppercase tracking-wider rounded-xl border border-indigo-500/30 flex items-center gap-1.5">
                <Compass size={14} className="animate-spin-slow" /> Étape 6/7 • Intelligence Stratégique & Trajectoires
              </span>
              <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-bold border border-emerald-500/30">
                Préparation Point B : {compass.whereIAm.readinessScore}%
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pilotez votre Carrière par Anticipation, Détectez vos Trajectoires
            </h1>
            
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Ne subissez plus les aléas : votre Agent Stratégique anticipe l’évolution de votre marché, cartographie vos compétences transférables, simule 5 futurs possibles et optimise vos décisions clés.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              onClick={() => openModal('compass')}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-2xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2"
            >
              <Compass size={16} />
              <span>Ouvrir la Boussole 4D</span>
            </button>
            <button
              onClick={() => openModal('trajectories')}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              <GitFork size={16} className="text-purple-400" />
              <span>Simulateur & Mode « Et Si ? »</span>
            </button>
          </div>
        </div>

        {/* Realtime 4D Quick Ribbon */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-blue-400 font-semibold block mb-1">1. Position Actuelle</span>
            <strong className="text-white text-sm">{compass.whereIAm.currentRole}</strong>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-emerald-400 font-semibold block mb-1">2. Objectif Cible (Point B)</span>
            <strong className="text-white text-sm">{compass.whereIWantToGo.targetPointB}</strong>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-amber-400 font-semibold block mb-1">3. Tendance Marché</span>
            <strong className="text-white text-sm">{compass.whereMarketEvolves.growthTrend}</strong>
          </div>
          <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
            <span className="text-indigo-400 font-semibold block mb-1">4. Priorité Immédiate</span>
            <strong className="text-white text-sm truncate block">{compass.whatIShouldDoNow.topPriorityAction}</strong>
          </div>
        </div>
      </div>

      {/* 2. GRILLE DES 8 PILIERS D'INTELLIGENCE STRATÉGIQUE */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* CARTE 1 : Boussole Stratégique 4D */}
        <div 
          onClick={() => openModal('compass')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                <Compass size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30">
                4 Dimensions
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Boussole Pro 4D</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Où je suis, où je veux aller, évolution du marché et plan d'action immédiat.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-indigo-400 font-bold">
            <span>Consulter & Réévaluer</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARTE 2 : Simulateur de Trajectoires */}
        <div 
          onClick={() => openModal('trajectories')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-purple-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-purple-600/20 border border-purple-500/30 rounded-2xl text-purple-400 group-hover:scale-110 transition-transform">
                <GitFork size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-purple-500/20 text-purple-300 font-bold rounded-lg border border-purple-500/30">
                5 Chemins
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Trajectoires & Mode « Et Si ? »</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Simulez 5 futurs possibles et testez des hypothèses conversationnelles en direct.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-purple-400 font-bold">
            <span>Simuler mes futurs</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARTE 3 : Skill Graph & Écarts */}
        <div 
          onClick={() => openModal('skillGraph')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-blue-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-blue-600/20 border border-blue-500/30 rounded-2xl text-blue-400 group-hover:scale-110 transition-transform">
                <Network size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-blue-500/20 text-blue-300 font-bold rounded-lg border border-blue-500/30">
                Passerelle Campus
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Skill Graph & Écarts</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Cartographie des compétences requises vs acquises avec calcul de ROI direct.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-blue-400 font-bold">
            <span>Analyser les écarts</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARTE 4 : Passeport de Compétences */}
        <div 
          onClick={() => openModal('passport')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-teal-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-teal-600/20 border border-teal-500/30 rounded-2xl text-teal-400 group-hover:scale-110 transition-transform">
                <Award size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-teal-500/20 text-teal-300 font-bold rounded-lg border border-teal-500/30">
                6 Niveaux de Preuve
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Passeport & Compétences Transférables</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Valorisez vos compétences vérifiées et découvrez des passerelles inattendues.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-teal-400 font-bold">
            <span>Ouvrir mon Passeport</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARTE 5 : Plans 90 Jours & 1 An */}
        <div 
          onClick={() => openModal('plans')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                <Calendar size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30">
                30-60-90j
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Plans 90 Jours & 1 An</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Exécution rythmée avec modes Accélération vs Équilibre et 5 checkpoints majeurs.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-indigo-400 font-bold">
            <span>Voir les jalons</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARTE 6 : Plateaux & Commande Débloque */}
        <div 
          onClick={() => openModal('plateau')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-rose-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-rose-600/20 border border-rose-500/30 rounded-2xl text-rose-400 group-hover:scale-110 transition-transform">
                <AlertOctagon size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 font-bold rounded-lg border border-rose-500/30">
                Anticipation
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Plateaux & « Débloque ma situation »</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Détectez la stagnation 6 mois avant et activez vos 3 leviers d'accélération d'élite.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-rose-400 font-bold">
            <span>Débloquer ma trajectoire</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARTE 7 : Conseil Multi-Experts */}
        <div 
          onClick={() => openModal('council')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-indigo-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-indigo-600/20 border border-indigo-500/30 rounded-2xl text-indigo-400 group-hover:scale-110 transition-transform">
                <Users size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-indigo-500/20 text-indigo-300 font-bold rounded-lg border border-indigo-500/30">
                Famille DIALLO
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Conseil Multi-Experts</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Délibération croisée : RH, Finance, Langues, Juridique, Logement et Pédagogie.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-indigo-400 font-bold">
            <span>Consulter le conseil</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

        {/* CARTE 8 : Matrice de Décision Personnelle */}
        <div 
          onClick={() => openModal('decisionMatrix')}
          className="bg-slate-800/70 hover:bg-slate-800 border border-slate-700/80 hover:border-emerald-500/60 rounded-3xl p-5 cursor-pointer transition-all flex flex-col justify-between space-y-4 group shadow-md"
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="p-3 bg-emerald-600/20 border border-emerald-500/30 rounded-2xl text-emerald-400 group-hover:scale-110 transition-transform">
                <Scale size={20} />
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-500/20 text-emerald-300 font-bold rounded-lg border border-emerald-500/30">
                10 Critères
              </span>
            </div>
            <h3 className="text-base font-bold text-white mb-1">Matrice Décisionnelle</h3>
            <p className="text-xs text-slate-400 line-clamp-2">
              Comparez des offres ou choix de carrière selon vos 10 priorités personnelles.
            </p>
          </div>
          <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-emerald-400 font-bold">
            <span>Comparer mes choix</span>
            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </div>

      </div>

      {/* 3. SECTION DU BAS : Bilan de Carrière IA & Frise « Mon Évolution » */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Banner Bilan IA */}
        <div className="bg-slate-800/90 border border-indigo-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText size={15} /> Bilan de Carrière Approfondi (Trimestriel)
              </span>
              <span className="text-xs text-emerald-400 font-bold">Score {bilan.overallMomentumScore}/100</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Audit Complet des 5 Piliers d'Accomplissement</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Consultez votre analyse rétrospective et prospective : compétences, réseau, résultats, progression vers le Point B et énergie vitale.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('bilan')}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20"
            >
              Consulter le Bilan Écrit
            </button>
            {onOpenVoiceBilan && (
              <button
                onClick={onOpenVoiceBilan}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <Mic size={14} className="text-purple-400" /> Bilan Vocal 3D
              </button>
            )}
          </div>
        </div>

        {/* Banner Frise Mon Évolution */}
        <div className="bg-slate-800/90 border border-emerald-500/30 rounded-3xl p-6 flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                <Milestone size={15} /> Visualisation Continue « Mon Évolution »
              </span>
              <span className="text-xs text-slate-400 font-medium">7 Étapes du Point 0 au Point B</span>
            </div>
            <h4 className="text-lg font-bold text-white mb-1">Frise Chronologique de votre Accomplissement</h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Revivez chaque étape franchie (Point de départ, apprentissages, opportunités, état actuel) et mesurez la distance restante vers votre Point B.
            </p>
          </div>
          <div>
            <button
              onClick={() => openModal('timeline')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
            >
              <span>Explorer la Frise Chronologique</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>

      </div>

      {/* 4. MODALS INTEGRATION */}
      <CareerStrategicCompassModal
        isOpen={modalOpen.compass}
        onClose={() => closeModal('compass')}
        compass={compass}
        onUpdateCompass={onUpdateCompass}
        onOpenCampus={onOpenCampus}
        onOpenTrajectorySimulator={() => {
          closeModal('compass');
          openModal('trajectories');
        }}
        onOpenEvolutionPlans={() => {
          closeModal('compass');
          openModal('plans');
        }}
      />

      <CareerTrajectorySimulatorModal
        isOpen={modalOpen.trajectories}
        onClose={() => closeModal('trajectories')}
        trajectories={trajectories}
        whatIfScenarios={whatIfScenarios}
        careerGraphNodes={careerGraphNodes}
        onOpenCampus={onOpenCampus}
      />

      <CareerSkillGraphGapModal
        isOpen={modalOpen.skillGraph}
        onClose={() => closeModal('skillGraph')}
        skillGraph={skillGraph}
        weakSignals={weakSignals}
        activeGoalTitle={compass.whereIWantToGo.targetPointB}
        onOpenCampus={onOpenCampus}
      />

      <CareerSkillsPassportModal
        isOpen={modalOpen.passport}
        onClose={() => closeModal('passport')}
        skillGraph={skillGraph}
        transferableSkills={transferableSkills}
        userName={userName}
        userRole={userRole}
        onOpenReconversion={() => {
          closeModal('passport');
          openModal('trajectories');
        }}
      />

      <CareerEvolutionPlansModal
        isOpen={modalOpen.plans}
        onClose={() => closeModal('plans')}
        plan90Days={plan90Days}
        yearlyPlan={yearlyPlan}
        checkpoints={checkpoints}
        onOpenCampus={onOpenCampus}
      />

      <CareerPlateauUnlockModal
        isOpen={modalOpen.plateau}
        onClose={() => closeModal('plateau')}
        diagnosis={plateauDiagnosis}
        levers={accelerationLevers}
        onOpenCampus={onOpenCampus}
        onOpenEvolutionPlans={() => {
          closeModal('plateau');
          openModal('plans');
        }}
      />

      <CareerMultiExpertCouncilModal
        isOpen={modalOpen.council}
        onClose={() => closeModal('council')}
        council={council}
        onConsultExpert={onConsultExpert}
      />

      <CareerDecisionMatrixModal
        isOpen={modalOpen.decisionMatrix}
        onClose={() => closeModal('decisionMatrix')}
        decisionMatrix={decisionMatrix}
      />

      <CareerAIBilanModal
        isOpen={modalOpen.bilan}
        onClose={() => closeModal('bilan')}
        bilan={bilan}
        onOpenVoiceBilan={onOpenVoiceBilan}
      />

      <CareerEvolutionTimelineModal
        isOpen={modalOpen.timeline}
        onClose={() => closeModal('timeline')}
        timelineSteps={timelineSteps}
      />

    </div>
  );
};
