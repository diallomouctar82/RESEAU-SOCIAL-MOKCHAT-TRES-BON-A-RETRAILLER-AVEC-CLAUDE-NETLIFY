import React, { useState, useRef, useEffect } from 'react';
import { 
  Briefcase, 
  Search, 
  MapPin, 
  DollarSign, 
  Sparkles, 
  UserCheck, 
  ArrowRight, 
  Loader2, 
  Mic, 
  Video, 
  Send, 
  CheckCircle, 
  AlertCircle, 
  Globe, 
  Mail, 
  Clock, 
  Calendar, 
  ExternalLink, 
  Target, 
  BriefcaseBusiness, 
  ChevronRight, 
  X, 
  Copy, 
  ShoppingCart, 
  TrendingUp, 
  ShieldCheck, 
  Building2, 
  User, 
  FileText, 
  MessageCircle, 
  Radar, 
  Crosshair, 
  Phone,
  Navigation,
  Compass,
  Users,
  Award
} from 'lucide-react';
import { 
  UserProfile, 
  CareerMissionPlan, 
  CareerPointA, 
  CareerPointB, 
  ProfessionalDigitalTwin, 
  CareerGPSMilestone,
  RadarOpportunityItem,
  MasterResumeProfile,
  ConquestWarRoomDossier
} from '../types';
import { generateText, generateJSON, generateSpeechDetailed } from '../services/aiGateway';
import { Avatar3D } from './Avatar3D';

// Career Accomplishment Sub-components
import { CareerGoalSelector } from './career/CareerGoalSelector';
import { CareerGPSNavigator } from './career/CareerGPSNavigator';
import { CareerPointADiagnosticModal } from './career/CareerPointADiagnosticModal';
import { CareerDigitalTwinCard } from './career/CareerDigitalTwinCard';
import { CareerExpertCouncilModal } from './career/CareerExpertCouncilModal';
import { CareerCoach3DModal } from './career/CareerCoach3DModal';
import { CareerContinuousFollowUp } from './career/CareerContinuousFollowUp';
import { CareerContinuityControlHub } from './career/continuity/CareerContinuityControlHub';
import { CareerRadarOpportunities } from './career/CareerRadarOpportunities';
import { CareerConquestRoom } from './career/conquest/CareerConquestRoom';
import { CareerMasterResumeModal } from './career/conquest/CareerMasterResumeModal';
import { CareerRelationalEcosystemHub } from './career/network/CareerRelationalEcosystemHub';
import { CareerStrategicAdvisorHub } from './career/strategic/CareerStrategicAdvisorHub';
import { INITIAL_MISSION_PLAN, INITIAL_POINT_A, INITIAL_DIGITAL_TWIN } from './career/careerDefaults';
import { INITIAL_MASTER_RESUME, generateConquestDossierForOpportunity } from '../services/careerConquestDefaults';
import {
  INITIAL_CAREER_COMPASS,
  INITIAL_TRAJECTORY_SIMULATIONS,
  INITIAL_WHAT_IF_SCENARIOS,
  INITIAL_CAREER_GRAPH_NODES,
  INITIAL_SKILL_GRAPH,
  INITIAL_TRANSFERABLE_SKILLS,
  INITIAL_WEAK_SIGNALS,
  INITIAL_90_DAYS_PLAN,
  INITIAL_YEARLY_PLAN,
  INITIAL_CAREER_CHECKPOINTS,
  INITIAL_PLATEAU_DIAGNOSIS,
  INITIAL_CAREER_COUNCIL,
  INITIAL_DECISION_CRITERIA,
  INITIAL_OPPORTUNITY_COMPARISONS,
  INITIAL_CAREER_AI_BILAN,
  INITIAL_EVOLUTION_TIMELINE
} from '../services/careerStrategicEngine';

// Career Step 7/7 Unified Command & Accomplishment Components
import { CareerMasterCommandHub } from './career/unified/CareerMasterCommandHub';
import { CareerNarrativeStoryModal } from './career/unified/CareerNarrativeStoryModal';
import { CareerWhatShouldIDoModal } from './career/unified/CareerWhatShouldIDoModal';
import { CareerEmergencyModal } from './career/unified/CareerEmergencyModal';
import { CareerAccomplishmentCelebrationModal } from './career/unified/CareerAccomplishmentCelebrationModal';
import { CareerAgentPermissionsLogsModal } from './career/unified/CareerAgentPermissionsLogsModal';
import { CareerConversationalOnboardingModal } from './career/unified/CareerConversationalOnboardingModal';
import { CareerUniversalSearchModal } from './career/unified/CareerUniversalSearchModal';
import { CareerCoherenceAuditModal } from './career/unified/CareerCoherenceAuditModal';
import { CareerSurpriseOpportunityModal } from './career/unified/CareerSurpriseOpportunityModal';
import { CareerImpactTransmissionModal } from './career/unified/CareerImpactTransmissionModal';
import { 
  INITIAL_MASTER_DOSSIER, 
  INITIAL_CAREER_JOURNAL, 
  INITIAL_AGENT_PERMISSIONS, 
  INITIAL_AGENT_LOGS, 
  INITIAL_DAILY_COMMAND, 
  INITIAL_WEEKLY_BRIEFING, 
  INITIAL_MONTHLY_BILAN, 
  INITIAL_PROFESSIONAL_IMPACT, 
  INITIAL_SURPRISE_OPPORTUNITIES, 
  INITIAL_COHERENCE_AUDIT, 
  INITIAL_RETURN_CONTEXT, 
  INITIAL_CELEBRATION_DATA 
} from '../services/careerUnifiedEngine';
import { CareerMasterDossier, CareerAgentPermissionConfig } from '../types';


interface CareerCenterProps {
  userProfile: UserProfile;
  onNavigateToInterview?: () => void;
  onNavigate?: (tab: string) => void;
  onOpenExpertChat?: (agentId: string, initialPrompt?: string) => void;
}

type OpportunityStatus = 'detected' | 'analyzing' | 'contacted' | 'negotiation' | 'closed';
type SearchType = 'job' | 'client' | 'investor' | 'supplier';

interface Opportunity {
  id: string;
  title: string;
  entity: string;
  location: string;
  description: string;
  url?: string;
  status: OpportunityStatus;
  matchScore: number;
  trustScore: number;
  tags: string[];
  type: SearchType;
  contactPerson?: string;
}

type Tab = 'gps' | 'twin' | 'hunter' | 'network' | 'pipeline' | 'strategic' | 'simulator';

export const CareerCenter: React.FC<CareerCenterProps> = ({ 
  userProfile, 
  onNavigateToInterview,
  onNavigate,
  onOpenExpertChat
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('gps');
  
  // --- STEP 7/7: UNIFIED MASTER DOSSIER & MODAL STATES ---
  const [masterDossier, setMasterDossier] = useState<CareerMasterDossier>(() => {
    return {
      ...INITIAL_MASTER_DOSSIER,
      pointASummary: INITIAL_POINT_A.situationSummary,
      pointBSummary: INITIAL_MISSION_PLAN.userGoal.title,
      overallProgressPercentage: 74
    };
  });

  const [showNarrativeStoryModal, setShowNarrativeStoryModal] = useState(false);
  const [showWhatShouldIDoModal, setShowWhatShouldIDoModal] = useState(false);
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);
  const [showPermissionsLogsModal, setShowPermissionsLogsModal] = useState(false);
  const [showConversationalOnboardingModal, setShowConversationalOnboardingModal] = useState(false);
  const [showUniversalSearchModal, setShowUniversalSearchModal] = useState(false);
  const [showCoherenceAuditModal, setShowCoherenceAuditModal] = useState(false);
  const [showSurpriseOpportunityModal, setShowSurpriseOpportunityModal] = useState(false);
  const [showImpactTransmissionModal, setShowImpactTransmissionModal] = useState(false);

  // Toggle Pause de l'Agent IA
  const handleToggleAgentPause = () => {
    setMasterDossier(prev => {
      const isPaused = !prev.permissions.isAgentPaused;
      const updatedPermissions: CareerAgentPermissionConfig = {
        ...prev.permissions,
        isAgentPaused: isPaused,
        lastPausedAt: isPaused ? new Date().toLocaleTimeString() : undefined
      };
      const newLog = {
        id: `log-${Date.now()}`,
        timestamp: 'À l\'instant',
        category: 'recommandation' as const,
        title: isPaused ? 'Mise en pause de l\'Agent' : 'Reprise de l\'Agent',
        description: isPaused ? 'Veille et pré-générations suspendues par l\'utilisateur.' : 'Veille active et copilote réactivés.',
        outcomeBadge: isPaused ? 'Pause active' : 'Agent opérationnel',
        isAutomatic: false
      };
      return {
        ...prev,
        permissions: updatedPermissions,
        activityLogs: [newLog, ...prev.activityLogs]
      };
    });
  };

  const handleUpdateAgentPermissions = (updated: CareerAgentPermissionConfig) => {
    setMasterDossier(prev => ({
      ...prev,
      permissions: updated
    }));
  };

  // Next Ambition (Boucle d'accomplissement infinie)
  const handleSelectNextAmbition = (ambitionTitle: string, pace: string, modeType: string) => {
    // 1. Enrich Digital Twin
    setDigitalTwin(prev => ({
      ...prev,
      reputationScore: Math.min(100, prev.reputationScore + 5),
      capitalProofLevel: 5
    }));

    // 2. Update Mission Plan & Point B
    setMissionPlan(prev => ({
      ...prev,
      userGoal: {
        ...prev.userGoal,
        title: ambitionTitle,
        targetRole: ambitionTitle,
        horizonMonths: modeType === '90_first_days' ? 3 : 18
      }
    }));

    // 3. Update Master Dossier
    setMasterDossier(prev => ({
      ...prev,
      currentStatus: 'in_progress',
      pointASummary: `Parcours précédent validé avec succès (${prev.pointBSummary}).`,
      pointBSummary: ambitionTitle,
      overallProgressPercentage: 15,
      journalEntries: [
        {
          id: `j-${Date.now()}`,
          timestamp: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }),
          type: 'decision',
          title: `Lancement d'un nouveau cycle : ${ambitionTitle}`,
          description: `Consécration du cycle précédent et activation du mode ${modeType}.`,
          lessonsLearned: 'Chaque sommet atteint devient le point de départ de la prochaine aventure.',
          impactScore: 10,
          tags: ['Nouveau Cycle', 'Accomplissement', modeType]
        },
        ...prev.journalEntries
      ]
    }));

    setActiveTab('gps');
  };

  // Onboarding Complete
  const handleOnboardingComplete = (pointA: string, pointB: string, track: string) => {
    setMissionPlan(prev => ({
      ...prev,
      userGoal: {
        ...prev.userGoal,
        title: pointB,
        targetRole: pointB
      },
      pointA: {
        ...prev.pointA,
        situationSummary: pointA
      }
    }));

    setMasterDossier(prev => ({
      ...prev,
      pointASummary: pointA,
      pointBSummary: pointB
    }));

    setActiveTab('gps');
  };

  // --- ACCOMPLISHMENT & GPS STATE ---
  const [missionPlan, setMissionPlan] = useState<CareerMissionPlan>(INITIAL_MISSION_PLAN);
  const [digitalTwin, setDigitalTwin] = useState<ProfessionalDigitalTwin>(INITIAL_DIGITAL_TWIN);
  
  // Modals
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [showCouncilModal, setShowCouncilModal] = useState(false);
  const [showCoach3DModal, setShowCoach3DModal] = useState(false);
  const [showMasterResumeGlobal, setShowMasterResumeGlobal] = useState(false);


  // --- CONQUEST & MASTER RESUME STATE (Carrière 3/7) ---
  const [masterResume, setMasterResume] = useState<MasterResumeProfile>(() => {
    const saved = localStorage.getItem('lmav_master_resume');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      ...INITIAL_MASTER_RESUME,
      fullName: userProfile.name || INITIAL_MASTER_RESUME.fullName,
      email: userProfile.email || INITIAL_MASTER_RESUME.email
    };
  });

  const [activeConquestDossier, setActiveConquestDossier] = useState<ConquestWarRoomDossier | null>(null);
  const [conquestDossiersCache, setConquestDossiersCache] = useState<Record<string, ConquestWarRoomDossier>>({});

  const handleUpdateMasterResume = (updated: MasterResumeProfile) => {
    setMasterResume(updated);
    localStorage.setItem('lmav_master_resume', JSON.stringify(updated));
  };

  const handleOpenConquestWarRoom = (opportunity: RadarOpportunityItem) => {
    let dossier = conquestDossiersCache[opportunity.id];
    if (!dossier) {
      dossier = generateConquestDossierForOpportunity(opportunity, masterResume);
      setConquestDossiersCache(prev => ({ ...prev, [opportunity.id]: dossier }));
    }
    setActiveConquestDossier(dossier);
  };

  const handleUpdateConquestDossier = (updatedDossier: ConquestWarRoomDossier) => {
    setActiveConquestDossier(updatedDossier);
    setConquestDossiersCache(prev => ({
      ...prev,
      [updatedDossier.opportunityId]: updatedDossier
    }));
  };

  const handleConfirmActionAndTransmit = (dossierId: string) => {
    if (!activeConquestDossier) return;
    const opp = activeConquestDossier.opportunity;
    
    // 1. Update opportunity status in pipeline
    updateOpportunityStatus(opp.id, 'contacted');

    // 2. Add smart reminder to continuous follow-up
    const newReminder = {
      id: `rem-${Date.now()}`,
      opportunityId: opp.id,
      relatedEntityName: opp.entity,
      title: `Suivi d'action : ${opp.title}`,
      message: `Votre dossier complet a été validé et transmis à ${opp.entity}. Une relance courtoise est planifiée sous J+5.`,
      recommendedActionDate: 'Dans 5 jours',
      isRead: false,
      timestamp: 'À l\'instant',
      actionType: 'open_relance' as const,
      actionLabel: 'Préparer Relance J+5'
    };

    setMissionPlan(prev => ({
      ...prev,
      smartReminders: [newReminder, ...prev.smartReminders],
      certifiedResultsCount: prev.certifiedResultsCount + 1
    }));

    alert(`Action validée avec succès ! Le dossier pour "${opp.title}" (${opp.entity}) a été enregistré dans votre pipeline de Suivi Continu.`);
    setActiveConquestDossier(null);
  };

  // --- HUNTER STATE (Search) ---
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<SearchType>('job');
  const [isSearching, setIsSearching] = useState(false);
  const [scanLog, setScanLog] = useState<string[]>(["Système Hunter prêt. En attente de cible..."]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([
    {
      id: 'opp-init-1',
      title: 'Consultant Stratégie Digitale & Architecture',
      entity: 'Global FinTech Alliance (Paris/Montréal)',
      location: 'Hybride / International',
      description: 'Recherche d\'un expert pour piloter la refonte applicative et les flux de paiement.',
      status: 'detected',
      matchScore: 94,
      trustScore: 98,
      tags: ['Tech', 'High Value', 'Remote'],
      type: 'client'
    },
    {
      id: 'opp-init-2',
      title: 'Partenariat Commercial & Distribution Afrique de l\'Ouest',
      entity: 'AgroLogistics Dakar',
      location: 'Sénégal / Côte d\'Ivoire',
      description: 'Recherche d\'un représentant ou cabinet pour déployer une solution de traçabilité.',
      status: 'contacted',
      matchScore: 91,
      trustScore: 95,
      tags: ['B2B', 'Export', 'Contrat'],
      type: 'client'
    }
  ]);
  
  // --- ACTION STATE ---
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [isGeneratingAction, setIsGeneratingAction] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [actionType, setActionType] = useState<'mail' | 'dossier' | 'relance' | 'devis'>('mail');

  // --- SIMULATOR STATE ---
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [userAnswer, setUserAnswer] = useState('');
  const [feedback, setFeedback] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [avatarState, setAvatarState] = useState<'idle' | 'speaking' | 'thinking'>('idle');
  const audioContextRef = useRef<AudioContext | null>(null);

  // --- STRATEGIC ADVISOR STATE (Carrière 6/7) ---
  const [strategicCompass, setStrategicCompass] = useState(INITIAL_CAREER_COMPASS);
  const [trajectories] = useState(INITIAL_TRAJECTORY_SIMULATIONS);
  const [whatIfScenarios] = useState(INITIAL_WHAT_IF_SCENARIOS);
  const [careerGraphNodes] = useState(INITIAL_CAREER_GRAPH_NODES);
  const [skillGraph] = useState(INITIAL_SKILL_GRAPH);
  const [transferableSkills] = useState(INITIAL_TRANSFERABLE_SKILLS);
  const [weakSignals] = useState(INITIAL_WEAK_SIGNALS);
  const [plan90Days] = useState(INITIAL_90_DAYS_PLAN);
  const [yearlyPlan] = useState(INITIAL_YEARLY_PLAN);
  const [checkpoints] = useState(INITIAL_CAREER_CHECKPOINTS);
  const [plateauDiagnosis] = useState(INITIAL_PLATEAU_DIAGNOSIS);
  const [strategicCouncil] = useState(INITIAL_CAREER_COUNCIL);
  const [decisionMatrix] = useState({
    criteria: INITIAL_DECISION_CRITERIA,
    comparisons: INITIAL_OPPORTUNITY_COMPARISONS
  });
  const [aiBilan] = useState(INITIAL_CAREER_AI_BILAN);
  const [timelineSteps] = useState(INITIAL_EVOLUTION_TIMELINE);

  // Audio Cleanup
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const addLog = (log: string) => {
    setScanLog(prev => [...prev.slice(-4), log]);
  };

  // Select a new Goal / Archetype
  const handleSelectGoal = (goal: CareerPointB) => {
    setMissionPlan(prev => ({
      ...prev,
      userGoal: goal,
      progressPercent: 15
    }));
    setActiveTab('gps');
  };

  // Update Milestone Status
  const handleUpdateMilestoneStatus = (milestoneId: string, status: CareerGPSMilestone['status'], recordedOutcome?: string) => {
    setMissionPlan(prev => {
      const updatedMilestones = prev.milestones.map(m => {
        if (m.id === milestoneId) {
          return {
            ...m,
            status,
            actualOutcomeRecorded: recordedOutcome || m.actualOutcomeRecorded
          };
        }
        return m;
      });

      const completedCount = updatedMilestones.filter(m => m.status === 'completed').length;
      const progress = Math.round((completedCount / updatedMilestones.length) * 100);

      return {
        ...prev,
        milestones: updatedMilestones,
        progressPercent: progress,
        certifiedResultsCount: recordedOutcome ? prev.certifiedResultsCount + 1 : prev.certifiedResultsCount
      };
    });

    if (recordedOutcome) {
      // Sync to Digital Twin
      setDigitalTwin(prev => ({
        ...prev,
        reputationScore: Math.min(100, prev.reputationScore + 2),
        concreteOutcomes: [
          {
            id: `out-${Date.now()}`,
            metric: recordedOutcome,
            description: 'Accomplissement certifié dans le cadre du GPS de Carrière.',
            date: 'Aujourd\'hui',
            category: 'contract',
            verified: true
          },
          ...prev.concreteOutcomes
        ]
      }));
    }
  };

  // Plan B Trigger
  const handleTriggerPlanB = (milestoneId: string) => {
    setMissionPlan(prev => {
      const targetMilestone = prev.milestones.find(m => m.id === milestoneId);
      if (!targetMilestone?.planBAlternative) return prev;

      const alt = targetMilestone.planBAlternative;
      const updatedMilestones = prev.milestones.map(m => {
        if (m.id === milestoneId) {
          return {
            ...m,
            title: `[Plan B] ${alt.fallbackRoute}`,
            description: `Recalcul activé suite à : ${alt.triggerReason}. Déploiement des actions de contournement.`,
            status: 'in_progress' as const
          };
        }
        return m;
      });

      return {
        ...prev,
        milestones: updatedMilestones,
        lastRerouteReason: alt.triggerReason
      };
    });
  };

  // Action toggling
  const handleToggleActionCompleted = (actionId: string) => {
    setMissionPlan(prev => {
      const updatedActions = prev.activeActions.map(a => a.id === actionId ? { ...a, completed: !a.completed } : a);
      return {
        ...prev,
        activeActions: updatedActions
      };
    });
  };

  const handleAddCustomAction = (newAction: any) => {
    setMissionPlan(prev => ({
      ...prev,
      activeActions: [newAction, ...prev.activeActions]
    }));
  };

  const handleRecordNewOutcome = (outcomeData: { metric: string; description: string; category: any }) => {
    setMissionPlan(prev => ({
      ...prev,
      certifiedResultsCount: prev.certifiedResultsCount + 1
    }));

    setDigitalTwin(prev => ({
      ...prev,
      reputationScore: Math.min(100, prev.reputationScore + 3),
      concreteOutcomes: [
        {
          id: `out-${Date.now()}`,
          metric: outcomeData.metric,
          description: outcomeData.description,
          date: 'Aujourd\'hui',
          category: outcomeData.category,
          verified: true
        },
        ...prev.concreteOutcomes
      ]
    }));
  };

  // Hunter Search
  const handleHunterSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setOpportunities([]); 
    setScanLog(["🚀 Initialisation du protocole Hunter v2.0..."]);
    
    try {
      let typeLabel = '';
      let intent = '';
      switch(searchType) {
        case 'job': typeLabel = 'Offres d\'emploi'; intent = 'Trouver un poste CDI/Freelance'; break;
        case 'client': typeLabel = 'Clients potentiels'; intent = 'Vendre des services'; break;
        case 'investor': typeLabel = 'Investisseurs'; intent = 'Lever des fonds'; break;
        case 'supplier': typeLabel = 'Fournisseurs'; intent = 'Acheter du matériel pro'; break;
      }

      const searchPrompt = `Agis comme un expert en intelligence économique.
      Recherche active pour : "${searchQuery}".
      Cible : ${typeLabel}. Intention : ${intent}.
      Profil : ${userProfile.name}, ${userProfile.title || 'Professionnel'}.
      
      Trouve 4 opportunités pertinentes avec des noms d'entreprises réalistes.
      Format JSON strict :
      [{ "title": "...", "entity": "...", "location": "...", "description": "...", "matchScore": 85, "trustScore": 95, "tags": ["tag1"], "type": "${searchType}" }]`;

      const rawOpps = (await generateJSON<any[]>(searchPrompt)) || [];
      const newOpps: Opportunity[] = rawOpps.map((o: any, i: number) => ({
        id: `opp-${Date.now()}-${i}`,
        ...o,
        status: 'detected',
        type: searchType
      }));

      setOpportunities(newOpps);

    } catch (e: any) {
      console.warn("Hunter Fallback Mode", e);
      const mockOpps: Opportunity[] = [
        { 
          id: `opp-fb-1`, 
          title: `Mission ${searchQuery}`, 
          entity: 'Réseau International LMAV', 
          location: 'France / Remote', 
          description: 'Opportunité qualifiée correspondant à votre objectif d\'accomplissement.', 
          status: 'detected', 
          matchScore: 92, 
          trustScore: 95, 
          type: searchType, 
          tags: ['Prioritaire', 'Validé'] 
        },
        { 
          id: `opp-fb-2`, 
          title: `Mandat Commercial & Partenariat`, 
          entity: 'Consortium Global Partners', 
          location: 'International', 
          description: 'Projet d\'envergure recherchant un profil expert avec garanties Mok Trust.', 
          status: 'detected', 
          matchScore: 88, 
          trustScore: 90, 
          type: searchType, 
          tags: ['B2B', 'Export'] 
        }
      ];
      setOpportunities(mockOpps);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGenerateApproach = async (opp: Opportunity, type: typeof actionType) => {
    setIsGeneratingAction(true);
    setSelectedOpp(opp);
    setActionType(type);
    setGeneratedContent(null);

    try {
      const prompt = `Rédige un document professionnel percutant et élégant pour "${opp.title}" chez "${opp.entity}".
      Type : ${type} (mail de candidature / devis commercial / relance persuasive / dossier de présentation).
      Profil expéditeur : ${userProfile.name}, ${userProfile.title || 'Expert'}.
      Ton : Professionnel, axé sur les résultats, chaleureux et persuasif.`;

      const responseText = await generateText(prompt);

      setGeneratedContent(responseText || "Document généré avec succès.");
      if (opp.status === 'detected' && type !== 'relance') {
        updateOpportunityStatus(opp.id, 'contacted'); 
      }
    } catch (e) {
      console.error(e);
      setGeneratedContent(`Madame, Monsieur,\n\nFaisant suite à notre opportunité d'échange concernant ${opp.title} au sein de ${opp.entity}, je vous transmets par la présente notre dossier de proposition...\n\nBien cordialement,\n${userProfile.name}`);
    } finally {
      setIsGeneratingAction(false);
    }
  };

  const updateOpportunityStatus = (id: string, status: OpportunityStatus) => {
    setOpportunities(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  // --- 3D INTERVIEW SIMULATOR IN EMBEDDED TAB ---
  const startSimulation = async () => {
    if (!selectedOpp) return;
    setIsInterviewActive(true);
    setIsThinking(true);
    setAvatarState('thinking');
    try {
      const prompt = `Tu es recruteur ou décideur chez ${selectedOpp.entity}. Poste ou Sujet : ${selectedOpp.title}.
      Pose une question précise et percutante au candidat. Sois direct et concis.`;

      const resText = await generateText(prompt);
      const question = resText || "Bonjour. Présentez-vous et expliquez ce qui fait votre valeur ajoutée.";
      setCurrentQuestion(question);
      setIsThinking(false);
      speak(question);
    } catch(e) { 
      console.error(e); 
      setIsThinking(false); 
      setAvatarState('idle'); 
    }
  };

  const handleAnswerSubmit = async () => {
    setIsThinking(true);
    setAvatarState('thinking');
    try {
      const prompt = `Question : "${currentQuestion}". Réponse : "${userAnswer}".
      Donne une critique constructive (note /10 + 1 point fort + 1 axe d'amélioration).`;
      const resText = await generateText(prompt);
      setFeedback(resText || "Réponse bien reçue et analysée.");
    } catch(e) { 
      console.error(e); 
    } finally { 
      setIsThinking(false); 
      setAvatarState('idle'); 
    }
  };

  const speak = async (text: string) => {
    setAvatarState('speaking');
    try {
      const detail = await generateSpeechDetailed(text, { voiceId: 'Fenrir' });
      if (detail?.audioBase64) {
        // Type MIME réel du fournisseur retenu (mp3 ElevenLabs, wav Gemini...).
        const audio = new Audio(`data:${detail.mimeType};base64,` + detail.audioBase64);
        audio.onended = () => setAvatarState('idle');
        audio.onerror = () => setAvatarState('idle');
        await audio.play();
      } else {
        setAvatarState('idle');
      }
    } catch (e) {
      console.error(e);
      setAvatarState('idle');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
      
      {/* 🌟 UNIFIED TOP CARRIER HEADER */}
      <div className="bg-slate-900 text-white p-6 md:p-8 shrink-0 border-b border-slate-800">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div>
              <div className="flex items-center gap-2 text-blue-400 font-bold uppercase text-xs tracking-wider mb-2">
                <Compass size={16} className="text-blue-400" /> Système Intelligent d'Accomplissement Professionnel & Entrepreneurial
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-tight flex items-center gap-3">
                <span>Carrière & Conquête</span>
                <span className="text-xs px-3 py-1 bg-blue-600 rounded-full font-bold">
                  Point A ➔ Point B
                </span>
              </h1>
              <p className="text-slate-400 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
                De votre situation actuelle jusqu'à l'atteinte réelle de votre objectif : GPS intelligent, Jumeau Pro, Conseil d'Experts et Coach 3D.
              </p>
            </div>
            
            {/* Top Navigation Tabs & Master CV */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex bg-white/10 p-1.5 rounded-2xl backdrop-blur-md border border-white/10 overflow-x-auto max-w-full">
                {[
                  { id: 'gps', label: 'GPS & Objectif', icon: Navigation, badge: 'Itinéraire' },
                  { id: 'twin', label: 'Jumeau Pro', icon: UserCheck, badge: 'Évolutif' },
                  { id: 'hunter', label: 'Radar & Conquête', icon: Radar, badge: 'Opportunités' },
                  { id: 'network', label: 'Réseau & Capital Pro', icon: Users, badge: 'Écosystème' },
                  { id: 'pipeline', label: 'Suivi Continu', icon: BriefcaseBusiness, badge: 'Résultats' },
                  { id: 'strategic', label: 'Stratégie & Trajectoires', icon: Compass, badge: 'Intelligence 6/7' },
                  { id: 'simulator', label: 'Coach 3D Vocal', icon: Video, badge: 'Simulation' }
                ].map(tab => (
                  <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 whitespace-nowrap ${
                      activeTab === tab.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <tab.icon size={15} /> 
                    <span>{tab.label}</span>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowMasterResumeGlobal(true)}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs md:text-sm transition-all flex items-center gap-2 shadow-lg shadow-emerald-600/20 border border-emerald-400/30 whitespace-nowrap"
                title="Consulter et enrichir votre CV Maître universel"
              >
                <FileText size={15} />
                <span>Mon CV Maître</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- TAB CONTENT AREA --- */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth bg-slate-50">
        <div className="max-w-6xl mx-auto space-y-8">
          
          {/* 🌟 STEP 7/7: CENTRE DE COMMANDE CARRIÈRE & ACCOMPLISSEMENT UNIFIÉ */}
          <CareerMasterCommandHub 
            dossier={masterDossier}
            userName={userProfile.name}
            userRole={userProfile.title}
            opportunities={opportunities}
            activeViewTab={activeTab}
            onSelectTab={(tabId) => setActiveTab(tabId as any)}
            onOpenSearch={() => setShowUniversalSearchModal(true)}
            onOpenWhatShouldIDo={() => setShowWhatShouldIDoModal(true)}
            onOpenEmergency={() => setShowEmergencyModal(true)}
            onOpenNarrativeStory={() => setShowNarrativeStoryModal(true)}
            onOpenPermissionsLogs={() => setShowPermissionsLogsModal(true)}
            onOpenCelebration={() => setShowCelebrationModal(true)}
            onOpenSurpriseOpportunities={() => setShowSurpriseOpportunityModal(true)}
            onOpenImpactTransmission={() => setShowImpactTransmissionModal(true)}
            onOpenCoherenceAudit={() => setShowCoherenceAuditModal(true)}
            onOpenCoach3D={() => setShowCoach3DModal(true)}
            onOpenMasterResume={() => setShowMasterResumeGlobal(true)}
            onToggleAgentPause={handleToggleAgentPause}
          />

          {/* VIEW 1: GPS & OBJECTIF D'ACCOMPLISSEMENT */}
          {activeTab === 'gps' && (
            <div className="space-y-8 animate-fade-up">
              {/* Goal Input & Archetypes */}
              <CareerGoalSelector 
                onSelectGoal={handleSelectGoal}
                onOpenDiagnostic={() => setShowDiagnosticModal(true)}
                activeGoal={missionPlan.userGoal}
              />

              {/* Turn-by-Turn GPS Navigator */}
              <CareerGPSNavigator 
                missionPlan={missionPlan}
                onNavigateToTab={onNavigate}
                onOpenCoach3D={() => setShowCoach3DModal(true)}
                onOpenCouncil={() => setShowCouncilModal(true)}
                onOpenDiagnostic={() => setShowDiagnosticModal(true)}
                onUpdateMilestoneStatus={handleUpdateMilestoneStatus}
                onTriggerPlanB={handleTriggerPlanB}
              />
            </div>
          )}

          {/* VIEW 2: JUMEAU PROFESSIONNEL ÉVOLUTIF */}
          {activeTab === 'twin' && (
            <div className="animate-fade-up">
              <CareerDigitalTwinCard 
                twin={digitalTwin}
                userName={userProfile.name}
                userTitle={userProfile.title}
                onOpenCampus={() => onNavigate && onNavigate('campus')}
                onOpenStudioCV={() => onNavigate && onNavigate('studio')}
              />
            </div>
          )}

          {/* VIEW 3: RADAR INTELLIGENT D'OPPORTUNITÉS (Étape 2/7 & Conquête 3/7) */}
          {activeTab === 'hunter' && (
            <CareerRadarOpportunities 
              pointA={missionPlan.pointA}
              pointB={missionPlan.userGoal}
              onGenerateApproach={(opp, actionType) => handleGenerateApproach(opp as any, actionType)}
              onOpenCoach3D={(opp) => {
                setSelectedOpp(opp as any);
                setShowCoach3DModal(true);
              }}
              onOpenConquestWarRoom={handleOpenConquestWarRoom}
              onOpenCampusCourse={(courseId, courseTitle) => {
                if (onNavigate) onNavigate('campus');
              }}
              onNavigateToTab={onNavigate}
            />
          )}

          {/* VIEW 4: CAPITAL RELATIONNEL, RÉSEAU & PROSPECTION (Carrière 5/7) */}
          {activeTab === 'network' && (
            <div className="animate-fade-up">
              <CareerRelationalEcosystemHub 
                userName={userProfile.name}
                userRole={userProfile.title}
                activeGoalTitle={missionPlan.userGoal?.title || 'Expansion Commerciale & Rayonnement Pro'}
                onOpenCampusOrMoc={(type, idOrTitle) => {
                  if (onNavigate) {
                    if (type === 'tribe' || type === 'live' || type === 'reel') onNavigate('social');
                  }
                }}
                onNavigateToTab={onNavigate}
              />
            </div>
          )}

          {/* VIEW 5: SUIVI CONTINU & PIPELINE AUTONOME (Carrière 4/7) */}
          {activeTab === 'pipeline' && (
            <div className="animate-fade-up">
              <CareerContinuityControlHub 
                missionPlan={missionPlan}
                opportunities={opportunities as any}
                onOpenCoach3D={() => setShowCoach3DModal(true)}
                onOpenVault={() => onNavigate && onNavigate('vault')}
                onConsultExpert={(expertName) => onOpenExpertChat && onOpenExpertChat('agent-career-mokhtar', `Bonjour ${expertName}, j'ai besoin de vos conseils sur une de mes démarches en cours.`)}
                onRecordNewOutcome={handleRecordNewOutcome}
              />
            </div>
          )}

          {/* VIEW 6: INTELLIGENCE STRATÉGIQUE & TRAJECTOIRES (Carrière 6/7) */}
          {activeTab === 'strategic' && (
            <div className="animate-fade-up">
              <CareerStrategicAdvisorHub 
                compass={strategicCompass}
                trajectories={trajectories}
                whatIfScenarios={whatIfScenarios}
                careerGraphNodes={careerGraphNodes}
                skillGraph={skillGraph}
                transferableSkills={transferableSkills}
                weakSignals={weakSignals}
                plan90Days={plan90Days}
                yearlyPlan={yearlyPlan}
                checkpoints={checkpoints}
                plateauDiagnosis={plateauDiagnosis}
                accelerationLevers={plateauDiagnosis.unlockingAlternatives as any}
                council={strategicCouncil}
                decisionMatrix={decisionMatrix as any}
                bilan={aiBilan}
                timelineSteps={timelineSteps as any}
                userName={userProfile.name}
                userRole={userProfile.title || 'Professionnel Élite'}
                onOpenCampus={(subjectTitle) => {
                  if (onNavigate) onNavigate('campus');
                }}
                onConsultExpert={(expertName, role) => {
                  if (onOpenExpertChat) {
                    onOpenExpertChat('agent-career-mokhtar', `Bonjour ${expertName} (${role}), j'ai besoin de votre analyse stratégique sur mon parcours et mes opportunités cibles.`);
                  }
                }}
                onOpenVoiceBilan={() => {
                  setShowCoach3DModal(true);
                }}
                onUpdateCompass={(updated) => {
                  setStrategicCompass(updated);
                }}
              />
            </div>
          )}

          {/* VIEW 7: COACH 3D SIMULATEUR */}
          {activeTab === 'simulator' && (
            <div className="space-y-6 animate-fade-up">
              <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Coach 3D Vocal & Studio d'Entraînement</h3>
                  <p className="text-xs text-slate-500">Préparez vos entretiens, vos pitchs d'investisseurs et vos négociations commerciales.</p>
                </div>
                <button
                  onClick={() => setShowCoach3DModal(true)}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm"
                >
                  <Video size={15} /> Ouvrir Mode Immersion Complète
                </button>
              </div>

              {/* Embedded 3D Simulator Interface */}
              <div className="flex flex-col md:flex-row gap-6 min-h-[500px]">
                <div className="flex-1 rounded-3xl overflow-hidden shadow-xl relative bg-black border border-slate-800">
                  <Avatar3D 
                    avatarId="3" 
                    state={avatarState}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-white text-xs font-bold border border-white/10 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span>Coach : Conseiller Diallo</span>
                  </div>
                  <div className="absolute bottom-8 left-6 right-6 text-center">
                    <div className="bg-black/80 backdrop-blur p-4 rounded-2xl border border-white/10 max-w-xl mx-auto">
                      <h3 className="text-base md:text-lg font-bold text-white drop-shadow-lg leading-snug">
                        "{currentQuestion || 'Prêt pour la simulation. Cliquez sur Démarrer ci-dessous.'}"
                      </h3>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-96 bg-white rounded-3xl p-6 shadow-xl border border-slate-200 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="text-yellow-500" /> Votre Réponse
                    </h3>
                    <textarea 
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      placeholder="Tapez ou dictez votre réponse ici..."
                      className="w-full h-40 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 resize-none focus:ring-2 focus:ring-blue-500 outline-none text-xs leading-relaxed"
                    />

                    <div className="flex gap-2 mt-3">
                      {!isInterviewActive ? (
                        <button 
                          onClick={() => {
                            if (!selectedOpp && opportunities.length > 0) setSelectedOpp(opportunities[0]);
                            startSimulation();
                          }}
                          className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-blue-500 transition-colors shadow-md"
                        >
                          <Video size={16} /> Démarrer la Question
                        </button>
                      ) : (
                        <button 
                          onClick={handleAnswerSubmit}
                          disabled={isThinking || !userAnswer.trim()}
                          className="w-full bg-slate-900 text-white py-3.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors shadow-md disabled:opacity-50"
                        >
                          {isThinking ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                          <span>{isThinking ? 'Analyse...' : 'Envoyer & Analyser'}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {feedback && (
                    <div className="p-4 bg-blue-50 rounded-2xl text-xs text-blue-900 border border-blue-100 animate-fade-up space-y-2">
                      <span className="font-bold text-blue-950 block">Analyse & Feedback :</span>
                      <p className="leading-relaxed">{feedback}</p>
                      <button 
                        onClick={startSimulation} 
                        className="block pt-1 text-blue-700 font-bold hover:underline text-xs"
                      >
                        Question suivante →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* 🚀 MODAL 1: POINT A DIAGNOSTIC & GAP ENGINE */}
      {showDiagnosticModal && (
        <CareerPointADiagnosticModal 
          initialPointA={missionPlan.pointA}
          activeGoal={missionPlan.userGoal}
          onSaveAndRecalculate={(updatedPointA, newMission) => {
            setMissionPlan(prev => ({
              ...prev,
              pointA: updatedPointA,
              ...(newMission || {})
            }));
          }}
          onClose={() => setShowDiagnosticModal(false)}
        />
      )}

      {/* 👥 MODAL 2: INTERDISCIPLINARY EXPERT COUNCIL */}
      {showCouncilModal && (
        <CareerExpertCouncilModal 
          experts={missionPlan.councilRecommendations}
          activeGoal={missionPlan.userGoal}
          onOpenExpertChat={onOpenExpertChat}
          onNavigateToTab={onNavigate}
          onClose={() => setShowCouncilModal(false)}
        />
      )}

      {/* 🎙️ MODAL 3: VOICE & 3D INTERACTIVE COACH */}
      {showCoach3DModal && (
        <CareerCoach3DModal 
          userName={userProfile.name}
          userTitle={userProfile.title}
          activeGoalTitle={missionPlan.userGoal.title}
          onClose={() => setShowCoach3DModal(false)}
          onRecordSessionScore={(score, mode) => {
            setDigitalTwin(prev => ({
              ...prev,
              reputationScore: Math.min(100, prev.reputationScore + 1)
            }));
          }}
        />
      )}

      {/* 🚀 MODAL 4: SALLE DE PRÉPARATION & CONQUÊTE (Carrière 3/7) */}
      {activeConquestDossier && (
        <CareerConquestRoom 
          dossier={activeConquestDossier}
          masterResume={masterResume}
          onUpdateDossier={handleUpdateConquestDossier}
          onUpdateMasterResume={handleUpdateMasterResume}
          onConfirmActionAndTransmit={handleConfirmActionAndTransmit}
          onOpenCampus={(courseId, title) => {
            if (onNavigate) onNavigate('campus');
          }}
          onClose={() => setActiveConquestDossier(null)}
        />
      )}

      {/* 📄 MODAL 5: CV MAÎTRE UNIVERSEL (Source de Vérité) */}
      {showMasterResumeGlobal && (
        <CareerMasterResumeModal 
          masterResume={masterResume}
          onSave={(updated) => {
            handleUpdateMasterResume(updated);
            setShowMasterResumeGlobal(false);
          }}
          onClose={() => setShowMasterResumeGlobal(false)}
        />
      )}

      {/* 📄 OVERLAY GENERATED CONTENT (Mails, Devis, Relances) */}
      {generatedContent && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-up">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FileText className="text-blue-600" /> Brouillon d'Approche IA ({actionType})
              </h3>
              <button onClick={() => setGeneratedContent(null)} className="p-3 hover:bg-slate-200 rounded-full transition-colors" aria-label="Fermer">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto bg-white">
              <textarea 
                value={generatedContent}
                onChange={(e) => setGeneratedContent(e.target.value)}
                className="w-full h-80 p-4 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 font-sans text-sm leading-relaxed shadow-inner bg-slate-50/50"
              />
            </div>
            <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => navigator.clipboard.writeText(generatedContent)} 
                className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors flex items-center gap-2"
              >
                <Copy size={15} /> Copier le texte
              </button>
              <button 
                onClick={() => { 
                  alert('Action envoyée et enregistrée dans votre pipeline.'); 
                  setGeneratedContent(null); 
                }} 
                className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-500 shadow-md transition-all flex items-center gap-2"
              >
                <Send size={15} /> Valider & Envoyer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 STEP 7/7 MODALS : RÉCIT, QUE FAIRE, URGENCE, CÉLÉBRATION, PERMISSIONS & AUTRES */}
      
      {/* 1. Raconte-moi mon parcours (Récit dynamique) */}
      <CareerNarrativeStoryModal 
        isOpen={showNarrativeStoryModal}
        onClose={() => setShowNarrativeStoryModal(false)}
        journal={masterDossier.journalEntries}
        userName={userProfile.name}
        pointBSummary={masterDossier.pointBSummary}
      />

      {/* 2. Que dois-je faire maintenant ? (Moteur universel d'orientation) */}
      <CareerWhatShouldIDoModal 
        isOpen={showWhatShouldIDoModal}
        onClose={() => setShowWhatShouldIDoModal(false)}
        dossier={masterDossier}
        onExecuteAction={(tabTarget, actionTitle) => {
          setActiveTab(tabTarget as any);
        }}
      />

      {/* 3. J'ai une urgence (Entretien dans 1h, Dossier ce soir, Offre à négocier) */}
      <CareerEmergencyModal 
        isOpen={showEmergencyModal}
        onClose={() => setShowEmergencyModal(false)}
        onOpenCoachSimulation={() => {
          setActiveTab('simulator');
        }}
        onOpenMasterResume={() => {
          setShowMasterResumeGlobal(true);
        }}
      />

      {/* 4. Célébration & Nouvelle Ambition (Cycle infini d'accomplissement) */}
      <CareerAccomplishmentCelebrationModal 
        isOpen={showCelebrationModal}
        onClose={() => setShowCelebrationModal(false)}
        userName={userProfile.name}
        achievedGoalTitle={masterDossier.pointBSummary}
        celebrationData={INITIAL_CELEBRATION_DATA}
        onSelectNextAmbition={handleSelectNextAmbition}
      />

      {/* 5. Centre de Contrôle : Permissions & Logs d'actions de l'Agent */}
      <CareerAgentPermissionsLogsModal 
        isOpen={showPermissionsLogsModal}
        onClose={() => setShowPermissionsLogsModal(false)}
        permissions={masterDossier.permissions}
        logs={masterDossier.activityLogs}
        onUpdatePermissions={handleUpdateAgentPermissions}
        onClearLogs={() => {
          setMasterDossier(prev => ({ ...prev, activityLogs: [] }));
        }}
      />

      {/* 6. Onboarding Conversationnel Intelligent */}
      <CareerConversationalOnboardingModal 
        isOpen={showConversationalOnboardingModal}
        onClose={() => setShowConversationalOnboardingModal(false)}
        userName={userProfile.name}
        onCompleteOnboarding={handleOnboardingComplete}
      />

      {/* 7. Recherche Universelle */}
      <CareerUniversalSearchModal 
        isOpen={showUniversalSearchModal}
        onClose={() => setShowUniversalSearchModal(false)}
        journal={masterDossier.journalEntries}
        onSelectResult={(tabTarget) => {
          if (['gps', 'twin', 'hunter', 'network', 'pipeline', 'strategic', 'simulator'].includes(tabTarget)) {
            setActiveTab(tabTarget as any);
          } else if (tabTarget === 'campus' && onNavigate) {
            onNavigate('campus');
          }
        }}
      />

      {/* 8. Diagnostic & Cohérence du Parcours */}
      <CareerCoherenceAuditModal 
        isOpen={showCoherenceAuditModal}
        onClose={() => setShowCoherenceAuditModal(false)}
        audit={INITIAL_COHERENCE_AUDIT}
        onAdjustStrategy={() => {
          setActiveTab('strategic');
        }}
      />

      {/* 9. Opportunités Surprises & Décloisonnement */}
      <CareerSurpriseOpportunityModal 
        isOpen={showSurpriseOpportunityModal}
        onClose={() => setShowSurpriseOpportunityModal(false)}
        opportunities={INITIAL_SURPRISE_OPPORTUNITIES}
        onExploreOpportunity={(oppTitle) => {
          setActiveTab('hunter');
        }}
      />

      {/* 10. Mon Impact & Transmission Professionnelle */}
      <CareerImpactTransmissionModal 
        isOpen={showImpactTransmissionModal}
        onClose={() => setShowImpactTransmissionModal(false)}
        impact={masterDossier.impactData}
        userName={userProfile.name}
        onOpenMentorshipHub={() => {
          setActiveTab('network');
        }}
        onOpenTribes={() => {
          if (onNavigate) onNavigate('tribes');
        }}
      />

    </div>
  );
};
