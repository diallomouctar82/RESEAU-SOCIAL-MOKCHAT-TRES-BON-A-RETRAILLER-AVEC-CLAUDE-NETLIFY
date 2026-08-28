import {
  StrategicCareerCompass,
  CareerGraphNode,
  SkillGraphItem,
  TransferableSkillMapping,
  CareerTrajectorySimulation,
  WhatIfScenario,
  MarketWeakSignal,
  EvolutionPlan90Days,
  YearlyMilestonePlan,
  CareerCheckpoint,
  CareerPlateauDiagnosis,
  PersonalDecisionCriterion,
  OpportunityComparisonItem,
  MultiExpertCareerCouncil,
  CareerAIBilan,
  CareerEvolutionTimelineStep,
  CareerPaceMode
} from '../types';

// ==========================================
// 1. BOUSSOLE STRATÉGIQUE PROFESSIONNELLE (4D)
// ==========================================

export const INITIAL_CAREER_COMPASS: StrategicCareerCompass = {
  whereIAm: {
    currentRole: 'Consultant & Développeur d\'Affaires B2B',
    keyAssets: ['Prospection & Pitch', 'Négociation commerciale', 'Esprit d\'initiative', 'Capacité de travail élevée'],
    currentSeniority: 'Confirmé (3 à 5 ans d\'expérience terrain)',
    readinessScore: 74
  },
  whereIWantToGo: {
    targetPointB: 'Directeur Commercial International & Développement Export',
    horizonMonths: 18,
    strategicWhy: 'Prendre la responsabilité d\'équipes pluridisciplinaires et piloter l\'expansion sur les corridors Afrique-Europe-Moyen-Orient.',
    isConfirmed: true
  },
  whereMarketEvolves: {
    growthTrend: '+14% de demande annuelle sur les profils hybrides Commerce B2B + Structuration FinTech/Supply Chain',
    hotSkillsInDemand: ['Négociation Grand Compte Multilingue', 'Maîtrise des Incoterms 2020 & Douanes', 'Pilotage CRM & IA d\'Aide à la Décision', 'Management d\'Équipes Distribuées'],
    emergingShifts: [
      'Digitalisation accélérée des appels d\'offres B2B transfrontaliers',
      'Exigence accrue de preuves d\'impact et de conformité ESG'
    ],
    weakSignalsCount: 4
  },
  whatIShouldDoNow: {
    topPriorityAction: 'Valider la certification Anglais des Affaires C1 & finaliser le premier contrat d\'export pilote',
    primaryLever: 'Certification Langue & Mandat d\'Export Pilote (+35% de crédibilité immédiate)',
    recommendedPace: 'acceleration',
    nextMilestoneDeadline: '15 Septembre 2026'
  }
};

// ==========================================
// 2. CAREER GRAPH (TRAJECTOIRES MULTIPLES NON-LINÉAIRES)
// ==========================================

export const INITIAL_CAREER_GRAPH_NODES: CareerGraphNode[] = [
  {
    id: 'current_role',
    roleTitle: 'Consultant & Chargé d\'Affaires B2B',
    tierLevel: 1,
    category: 'direct_promotion',
    avgTimeHorizonYears: 'Position Actuelle',
    avgCompensationBracket: '35k€ - 50k€',
    keySkillsRequired: ['Prospection', 'Vente B2B', 'Gestion de compte'],
    isUnlocked: true,
    matchScore: 100,
    description: 'Votre ancrage actuel : socle opérationnel solide en prospection et closing local.',
    connections: ['lead_business_dev', 'specialist_supply_export', 'consultant_independant', 'reconversion_data']
  },
  {
    id: 'lead_business_dev',
    roleTitle: 'Responsable / Lead Business Developer',
    tierLevel: 2,
    category: 'direct_promotion',
    avgTimeHorizonYears: '6 - 12 mois',
    avgCompensationBracket: '52k€ - 70k€',
    keySkillsRequired: ['Gestion de pipeline complexe', 'Recrutement commerciaux', 'Reporting CRM avancé'],
    isUnlocked: true,
    matchScore: 88,
    description: 'Évolution naturelle : structuration d\'équipe commerciale et pilotage d\'objectifs trimestriels.',
    connections: ['target_director', 'dir_regional']
  },
  {
    id: 'specialist_supply_export',
    roleTitle: 'Spécialiste Export & Corridors Commerciaux',
    tierLevel: 2,
    category: 'specialisation',
    avgTimeHorizonYears: '9 - 18 mois',
    avgCompensationBracket: '55k€ - 75k€',
    keySkillsRequired: ['Incoterms 2020', 'Financement du commerce international', 'Anglais C1'],
    isUnlocked: true,
    matchScore: 82,
    description: 'Voie de spécialisation technique : maîtrise des accords douaniers, logistique et devises.',
    connections: ['target_director', 'expat_manager']
  },
  {
    id: 'target_director',
    roleTitle: 'Directeur Commercial International (Point B)',
    tierLevel: 3,
    category: 'management',
    avgTimeHorizonYears: '18 - 24 mois',
    avgCompensationBracket: '75k€ - 110k€ + intéressement',
    keySkillsRequired: ['Stratégie de pénétration marché', 'Management interculturel', 'Négociation C-Level', 'Anglais C1/C2'],
    isUnlocked: true,
    matchScore: 74,
    description: 'Votre Objectif Cible : leadership complet sur l\'expansion internationale et la politique commerciale.',
    connections: ['general_management', 'entrepreneur_ceo']
  },
  {
    id: 'dir_regional',
    roleTitle: 'Directeur Régional Multi-Pays',
    tierLevel: 3,
    category: 'management',
    avgTimeHorizonYears: '2 - 3 ans',
    avgCompensationBracket: '80k€ - 120k€',
    keySkillsRequired: ['P&L Management', 'Stratégie multi-filiales', 'Gouvernance'],
    isUnlocked: false,
    matchScore: 68,
    description: 'Pilotage de plusieurs filiales régionales avec autonomie budgétaire complète.',
    connections: ['general_management']
  },
  {
    id: 'expat_manager',
    roleTitle: 'Country Manager / Directeur Filiale Étrangère',
    tierLevel: 3,
    category: 'international',
    avgTimeHorizonYears: '1 - 2 ans',
    avgCompensationBracket: '70k€ - 105k€ net + package expat',
    keySkillsRequired: ['Mobilité internationale', 'Législation locale', 'Adaptabilité culturelle', 'Leadership'],
    isUnlocked: true,
    matchScore: 78,
    description: 'Déploiement physique à l\'international avec mandat de création de filiale ex-nihilo.',
    connections: ['general_management', 'entrepreneur_ceo']
  },
  {
    id: 'entrepreneur_ceo',
    roleTitle: 'Fondateur / Dirigeant d\'Entreprise Import-Export',
    tierLevel: 4,
    category: 'entrepreneuriat',
    avgTimeHorizonYears: 'Autonomie totale',
    avgCompensationBracket: 'Variable selon marge nette',
    keySkillsRequired: ['Gestion de trésorerie', 'Levée de fonds', 'Vision produit', 'Résilience'],
    isUnlocked: true,
    matchScore: 70,
    description: 'Création de votre propre maison de négoce ou agence de conseil en développement d\'affaires.',
    connections: []
  },
  {
    id: 'consultant_independant',
    roleTitle: 'Conseiller Stratégique & Mandataire Indépendant',
    tierLevel: 2,
    category: 'independant',
    avgTimeHorizonYears: 'Immédiat - 3 mois',
    avgCompensationBracket: '500€ - 900€ TJM',
    keySkillsRequired: ['Personal branding', 'Offre packagée', 'Réseau de prescripteurs'],
    isUnlocked: true,
    matchScore: 85,
    description: 'Prestations de conseil à forte valeur ajoutée en mission pour des PME exportatrices.',
    connections: ['entrepreneur_ceo']
  },
  {
    id: 'reconversion_data',
    roleTitle: 'Product Manager B2B / Head of Revenue Operations',
    tierLevel: 2,
    category: 'reconversion',
    avgTimeHorizonYears: '12 - 18 mois (formation)',
    avgCompensationBracket: '60k€ - 85k€',
    keySkillsRequired: ['Data Analytics', 'Stack RevOps', 'Architecture CRM', 'Automatisation IA'],
    isUnlocked: false,
    matchScore: 58,
    description: 'Bifurcation vers la tech commerciale : optimisation des opérations de revenus et outillage data.',
    connections: ['general_management']
  },
  {
    id: 'general_management',
    roleTitle: 'Directeur Général / Associé Opérationnel (C-Level)',
    tierLevel: 5,
    category: 'management',
    avgTimeHorizonYears: '3 - 5 ans',
    avgCompensationBracket: '120k€ - 200k€ + Equity',
    keySkillsRequired: ['Gouvernance d\'entreprise', 'Finance stratégique', 'Vision globale', 'Leadership inspirant'],
    isUnlocked: false,
    matchScore: 62,
    description: 'Sommet exécutif : direction globale d\'une organisation et représentation auprès du conseil d\'administration.',
    connections: []
  }
];

// ==========================================
// 3. SKILL GRAPH & ANALYSE DES ÉCARTS (SKILL GAP)
// ==========================================

export const INITIAL_SKILL_GRAPH: SkillGraphItem[] = [
  {
    id: 'sk_venteb2b',
    name: 'Vente B2B & Prospection Grand Compte',
    category: 'strategie_business',
    status: 'maitrisee',
    proofLevel: 'confirmee_par_realisation',
    requiredForPointB: true,
    frequencyInTargetOffersPercentage: 92,
    roiPotential: 'Socle indispensable (+40% de conversion)',
    estimatedTimeToAcquireWeeks: 0,
    isTransferable: true,
    transfersToSectors: ['SaaS Tech', 'Industrie', 'Agroalimentaire', 'Services Financiers'],
    proofDetails: {
      proofType: 'Contrats signés & Témoignages clients',
      verifiedDate: '12 Juin 2026',
      contextDescription: 'Génération de 450k€ de CA signé sur le dernier exercice.',
      evaluatorOrCertificate: 'Attestation Employeur & Portefeuille CRM'
    }
  },
  {
    id: 'sk_negotiation',
    name: 'Négociation Complexe & Accords Cadres',
    category: 'strategie_business',
    status: 'maitrisee',
    proofLevel: 'utilisee_professionnellement',
    requiredForPointB: true,
    frequencyInTargetOffersPercentage: 88,
    roiPotential: 'Augmente la taille moyenne des deals de 35%',
    estimatedTimeToAcquireWeeks: 2,
    isTransferable: true,
    transfersToSectors: ['Achat & Sourcing', 'Partenariats Public-Privé', 'Immobilier'],
    proofDetails: {
      proofType: 'Cycle de vente documenté',
      verifiedDate: '18 Juillet 2026',
      contextDescription: 'Négociation d\'un contrat pluriannuel de distribution.',
      evaluatorOrCertificate: 'Mok Trust Score 92%'
    }
  },
  {
    id: 'sk_english_biz',
    name: 'Anglais Professionnel des Affaires & Pitch C1',
    category: 'langues',
    status: 'fragile',
    proofLevel: 'en_apprentissage',
    requiredForPointB: true,
    frequencyInTargetOffersPercentage: 84,
    roiPotential: '+55% d\'offres internationales éligibles',
    recommendedCampusCurriculumId: 'curriculum_lang_en_biz',
    recommendedCampusSubjectTitle: 'Anglais des Affaires Internationales & Négociation C1',
    estimatedTimeToAcquireWeeks: 8,
    isTransferable: true,
    transfersToSectors: ['Tout secteur international', 'Organisations multilatérales'],
    proofDetails: {
      proofType: 'Évaluation intermédiaire Campus',
      verifiedDate: '05 Août 2026',
      contextDescription: 'Niveau B2 validé, entraînement C1 en cours (score 72/100).',
      evaluatorOrCertificate: 'Campus Global Diagnostic'
    }
  },
  {
    id: 'sk_incoterms',
    name: 'Incoterms 2020, Douanes & Chaîne Logistique Export',
    category: 'technique',
    status: 'absente',
    proofLevel: 'declaree',
    requiredForPointB: true,
    frequencyInTargetOffersPercentage: 68,
    roiPotential: 'Ouvre 70% des postes de Direction Export',
    recommendedCampusCurriculumId: 'curriculum_trade_export_2026',
    recommendedCampusSubjectTitle: 'Commerce International : Douanes, Incoterms & L/C',
    estimatedTimeToAcquireWeeks: 6,
    isTransferable: true,
    transfersToSectors: ['Supply Chain', 'Logistique Maritime', 'Négoce de Matières Premières']
  },
  {
    id: 'sk_leadership',
    name: 'Leadership & Management d\'Équipes Distribuées',
    category: 'leadership',
    status: 'fragile',
    proofLevel: 'evaluee',
    requiredForPointB: true,
    frequencyInTargetOffersPercentage: 79,
    roiPotential: 'Prérequis absolu pour tout poste de Direction',
    recommendedCampusCurriculumId: 'curriculum_mgmt_exec',
    recommendedCampusSubjectTitle: 'Management Stratégique & Conduite du Changement',
    estimatedTimeToAcquireWeeks: 10,
    isTransferable: true,
    transfersToSectors: ['Direction d\'Agence', 'Direction de Filiale', 'Conseil'],
    proofDetails: {
      proofType: 'Évaluation par les pairs & Mentorat',
      verifiedDate: '20 Août 2026',
      contextDescription: 'Encadrement réussi de 2 juniors en mission collaborative.',
      evaluatorOrCertificate: 'Mok Mentorship Guild'
    }
  },
  {
    id: 'sk_ia_revops',
    name: 'Pilotage RevOps & Automatisation Commerciale IA',
    category: 'digital_ia',
    status: 'emergente',
    proofLevel: 'demontree',
    requiredForPointB: false,
    frequencyInTargetOffersPercentage: 62,
    roiPotential: 'Différenciateur d\'élite (+25% de productivité commerciale)',
    estimatedTimeToAcquireWeeks: 3,
    isTransferable: true,
    transfersToSectors: ['Tech & Scale-ups', 'Conseil en Transformation Digitale'],
    proofDetails: {
      proofType: 'Mise en place de workflows automatisés',
      verifiedDate: '10 Août 2026',
      contextDescription: 'Conception de pipelines prédictifs et enrichissement de leads.',
      evaluatorOrCertificate: 'Certificat Spécialisation Le Monde à Vous'
    }
  },
  {
    id: 'sk_finance_com',
    name: 'Finance Commerciale, P&L & BFR Export',
    category: 'strategie_business',
    status: 'prioritaire',
    proofLevel: 'en_apprentissage',
    requiredForPointB: true,
    frequencyInTargetOffersPercentage: 74,
    roiPotential: 'Obligatoire pour les arbitrages budgétaires Direction',
    recommendedCampusCurriculumId: 'curriculum_fin_corp',
    recommendedCampusSubjectTitle: 'Analyse Financière & Gestion Budgétaire pour Directeurs',
    estimatedTimeToAcquireWeeks: 4,
    isTransferable: true,
    transfersToSectors: ['Direction Administrative et Financière', 'Private Equity', 'Banque']
  }
];

// ==========================================
// 4. COMPÉTENCES TRANSFÉRABLES & MODE RECONVERSION
// ==========================================

export const INITIAL_TRANSFERABLE_SKILLS: TransferableSkillMapping[] = [
  {
    skillName: 'Prospection B2B & Qualification d\'Opportunités',
    acquiredInContext: 'Vente de prestations et solutions de service',
    transfersToRoles: [
      {
        roleTitle: 'Chargé d\'Investissement / Sourcing Dealflow',
        sector: 'Venture Capital & Private Equity',
        matchRelevanceScore: 84,
        whyItApplies: 'La capacité à identifier, contacter et qualifier des fondateurs repose sur les mêmes mécanismes de prospection rigoureuse.'
      },
      {
        roleTitle: 'Consultant en Recrutement Exécutif',
        sector: 'Chasse de têtes & Conseil RH',
        matchRelevanceScore: 90,
        whyItApplies: 'Chasser des profils rares et convaincre des cadres dirigeants exige le même talent d\'approche directe et d\'écoute active.'
      },
      {
        roleTitle: 'Développeur de Partenariats Public-Privé (PPP)',
        sector: 'Infrastructures & Énergie',
        matchRelevanceScore: 78,
        whyItApplies: 'Structuration de consortiums et cartographie des parties prenantes clés.'
      }
    ]
  },
  {
    skillName: 'Négociation & Gestion de Contrats Cadres',
    acquiredInContext: 'Closing de deals d\'affaires et partenariats',
    transfersToRoles: [
      {
        roleTitle: 'Acheteur Stratégique / Catégory Manager',
        sector: 'Grande Distribution & Industrie',
        matchRelevanceScore: 88,
        whyItApplies: 'Connaître les techniques de vente permet d\'être un négociateur d\'achats redoutablement efficace et équilibré.'
      },
      {
        roleTitle: 'Courtier en Financement de Projets',
        sector: 'Banque d\'Affaires & Négoce',
        matchRelevanceScore: 82,
        whyItApplies: 'Gestion de clauses complexes, garanties bancaires et structuration d\'accords.'
      }
    ]
  }
];

// ==========================================
// 5. SIMULATEUR DE TRAJECTOIRES (5 CHEMINS TYPES)
// ==========================================

export const INITIAL_TRAJECTORY_SIMULATIONS: CareerTrajectorySimulation[] = [
  {
    id: 'traj_A',
    code: 'A',
    title: 'Trajectoire A : Progression Verticale & Leadership Direct',
    type: 'statut_quo_optimise',
    summary: 'Gravir les échelons au sein de votre écosystème en passant de Chargé d\'Affaires à Head of Sales puis Directeur Commercial.',
    targetHorizonMonths: 18,
    fitScore: 88,
    keyStages: [
      { stageOrder: 1, title: 'Consolidation & Over-Performance', duration: '3 à 6 mois', milestone: 'Dépasser les objectifs commerciaux de 20% et structurer les process de l\'équipe.' },
      { stageOrder: 2, title: 'Promotion Lead Commercial / Head of Sales', duration: '6 à 12 mois', milestone: 'Prise de management directe sur 4 à 6 commerciaux.' },
      { stageOrder: 3, title: 'Direction Commerciale Complète', duration: '12 à 18 mois', milestone: 'Prise en main du budget commercial et de la stratégie d\'expansion.' }
    ],
    skillsToAcquire: ['Management d\'équipe', 'Reporting financier P&L', 'Négociation C-Level'],
    keyOpportunities: ['Postes ouverts dans les PME en forte croissance', 'Promotions internes rapides'],
    constraintsAndRisks: ['Pression forte sur le résultat chiffré', 'Dépendance à la santé financière de l\'employeur'],
    estimatedFinancialInvestment: '0€ (Formation financée en continu)',
    potentialROI: '+45% à +75% de rémunération globale sous 18 mois',
    feasibilityRating: 'Accessible'
  },
  {
    id: 'traj_B',
    code: 'B',
    title: 'Trajectoire B : Hyper-Spécialisation Export & Corridors Internationaux',
    type: 'specialisation_pointue',
    summary: 'Devenir l\'expert de référence sur les flux d\'échanges transfrontaliers (Incoterms, devises, accords bilatéraux Afrique-Europe).',
    targetHorizonMonths: 14,
    fitScore: 92,
    keyStages: [
      { stageOrder: 1, title: 'Certification Douanes, Incoterms & Crédit Doc', duration: '2 mois', milestone: 'Obtention de la certification de spécialisation sur Campus.' },
      { stageOrder: 2, title: 'Premier Mandat Export Pilote', duration: '4 à 8 mois', milestone: 'Supervision de 3 corridors d\'exportation avec succès.' },
      { stageOrder: 3, title: 'Direction Export Régionale', duration: '8 à 14 mois', milestone: 'Pilotage des réseaux de distributeurs internationaux.' }
    ],
    skillsToAcquire: ['Incoterms 2020 & Douanes', 'Anglais C1 des affaires', 'Financement export'],
    keyOpportunities: ['Maison de négoce', 'Groupes industriels internationaux', 'Grandes coopératives'],
    constraintsAndRisks: ['Déplacements fréquents à l\'étranger', 'Complexité géopolitique et réglementaire'],
    estimatedFinancialInvestment: '250€ (Modules spécialisés Campus)',
    potentialROI: '+60% de valeur sur le marché international',
    feasibilityRating: 'Accessible'
  },
  {
    id: 'traj_C',
    code: 'C',
    title: 'Trajectoire C : Management Exécutif & Direction de Filiale',
    type: 'management_leadership',
    summary: 'Passer du rôle de contributeur individuel à celui de gestionnaire complet de centre de profit (P&L, RH, Opérations).',
    targetHorizonMonths: 24,
    fitScore: 78,
    keyStages: [
      { stageOrder: 1, title: 'Executive Mentoring & Gestion de Crise', duration: '6 mois', milestone: 'Accompagnement par un DG du réseau de mentors Mok.' },
      { stageOrder: 2, title: 'Direction Adjointe d\'une Business Unit', duration: '12 mois', milestone: 'Gestion déléguée d\'un budget de 2M€.' },
      { stageOrder: 3, title: 'Direction Générale de Filiale', duration: '18 à 24 mois', milestone: 'Nomination au comité de direction.' }
    ],
    skillsToAcquire: ['Finance d\'entreprise', 'Droit social & Gouvernance', 'Gestion de crise'],
    keyOpportunities: ['Filiales en création', 'Reprise de filiales régionales'],
    constraintsAndRisks: ['Forte charge mentale', 'Responsabilité juridique et humaine étendue'],
    estimatedFinancialInvestment: '500€ (Parcours Direction Campus)',
    potentialROI: 'Accès au statut Cadre Dirigeant & Bonus annuel significatif',
    feasibilityRating: 'Modérée'
  },
  {
    id: 'traj_D',
    code: 'D',
    title: 'Trajectoire D : Entrepreneuriat & Création d\'Agence de Négoce B2B',
    type: 'entrepreneuriat',
    summary: 'Capitaliser sur votre expertise commerciale pour lancer votre propre structure de courtage et développement d\'affaires.',
    targetHorizonMonths: 12,
    fitScore: 82,
    keyStages: [
      { stageOrder: 1, title: 'Lancement d\'une Activité de Conseil Indépendant', duration: '3 mois', milestone: 'Signer 2 premiers clients récurrents en mandat d\'apporteur.' },
      { stageOrder: 2, title: 'Création de l\'Équipe & Partenariats MOK', duration: '6 mois', milestone: 'Association avec un profil technique et un financier sur le Réseau MOC.' },
      { stageOrder: 3, title: 'Société de Négoce Opérationnelle', duration: '9 à 12 mois', milestone: 'Atteindre la rentabilité pérenne et recruter un premier salarié.' }
    ],
    skillsToAcquire: ['Gestion de trésorerie', 'Stratégie de tarification', 'Marketing B2B d\'attraction'],
    keyOpportunities: ['Marché Mondial Le Monde à Vous', 'Contrats d\'intermédiation exclusifs'],
    constraintsAndRisks: ['Absence de salaire garanti les 6 premiers mois', 'Gestion solitaire du risque initial'],
    estimatedFinancialInvestment: '1 500€ à 3 000€ (Capital d\'amorçage et immatriculation)',
    potentialROI: 'Liberté totale, valorisation de capital et revenus illimités à terme',
    feasibilityRating: 'Modérée'
  },
  {
    id: 'traj_E',
    code: 'E',
    title: 'Trajectoire E : Expatriation & Carrière Internationale (Canada / Golfe / Europe)',
    type: 'international_expatriation',
    summary: 'Transférer vos compétences vers un hub économique mondial à fort pouvoir d\'achat et dynamisme commercial.',
    targetHorizonMonths: 16,
    fitScore: 75,
    keyStages: [
      { stageOrder: 1, title: 'Mise en Conformité Dossier & Équivalences', duration: '4 mois', milestone: 'Attestation de comparabilité des diplômes et score IELTS 7.5.' },
      { stageOrder: 2, title: 'Radar d\'Opportunités Expat & Networking Ciblé', duration: '6 à 10 mois', milestone: 'Obtention d\'une offre avec visa de travail sponsorisé.' },
      { stageOrder: 3, title: 'Installation & Prise de Fonction', duration: '12 à 16 mois', milestone: 'Intégration réussie dans le pays d\'accueil.' }
    ],
    skillsToAcquire: ['Anglais C1 certifié', 'Culture des affaires nord-américaine/internationale', 'Procédures de visa'],
    keyOpportunities: ['Entreprises internationales en quête d\'experts multiculturels', 'Programmes d\'immigration qualifiée'],
    constraintsAndRisks: ['Dépaysement familial et administratif', 'Coût de la vie initial élevé'],
    estimatedFinancialInvestment: '3 500€ à 6 000€ (Tests, frais d\'immigration, installation)',
    potentialROI: 'Multiplication du salaire par 2 à 3, expérience internationale valorisable à vie',
    feasibilityRating: 'Exigeante'
  }
];

// ==========================================
// 6. SCÉNARIOS CONVERSATIONNELS « ET SI ? »
// ==========================================

export const INITIAL_WHAT_IF_SCENARIOS: WhatIfScenario[] = [
  {
    id: 'whatif_english',
    promptQuestion: 'Et si j\'apprenais l\'anglais des affaires niveau C1 dès ce semestre ?',
    category: 'langue',
    impactOnPointB: 'Accélère l\'atteinte du Point B de 6 mois en déverrouillant immédiatement 84% des offres de Direction Export.',
    newTrajectoryUnlocked: 'Trajectoire B (Spécialisation Export) & Trajectoire E (Expatriation)',
    timeframeImpact: '-6 mois sur l\'horizon global',
    marketOpeningsBonusPercent: 55,
    financialImpactEstimate: '+15k€ à +25k€ de prétention salariale annuelle',
    riskAssessment: 'Risque quasi nul, investissement temps de 4h/semaine sur 8 semaines.',
    suggestedFirstStep: 'Démarrer le module "Anglais des Affaires C1" sur Campus avec simulations orales hebdomadaires.'
  },
  {
    id: 'whatif_master',
    promptQuestion: 'Et si je faisais un Master / MBA Exécutif en cours du soir ou en ligne ?',
    category: 'diplome',
    impactOnPointB: 'Donne une légitimité institutionnelle forte pour postuler directement aux postes de Direction Générale dans les grands groupes.',
    newTrajectoryUnlocked: 'Trajectoire C (Direction de Filiale) & Postes C-Level institutionnels',
    timeframeImpact: '+12 mois d\'études mais bond de 2 échelons hiérarchiques à la sortie',
    marketOpeningsBonusPercent: 40,
    financialImpactEstimate: '+30k€ à +50k€ sur le long terme',
    riskAssessment: 'Forte charge horaire (12h/semaine) et investissement financier à planifier.',
    suggestedFirstStep: 'Consulter l\'équivalence des crédits académiques et les bourses disponibles sur Campus.'
  },
  {
    id: 'whatif_canada',
    promptQuestion: 'Et si je partais m\'installer au Canada ou aux Émirats Arabes Unis ?',
    category: 'pays',
    impactOnPointB: 'Bascule le projet dans un environnement à très forte demande pour les talents commerciaux bilingues.',
    newTrajectoryUnlocked: 'Trajectoire E : Carrière Internationale',
    timeframeImpact: 'Préparation 12 mois, réalisation effective sous 16 mois',
    marketOpeningsBonusPercent: 70,
    financialImpactEstimate: 'Salaire brut moyen de 90k$ CAD à 120k$ CAD (Canada) ou packages défiscalisés (Golfe)',
    riskAssessment: 'Nécessite une épargne de sécurité de 6 mois et l\'obtention du permis de travail.',
    suggestedFirstStep: 'Activer le Conseil Multi-Experts (Carrière + Juridique/Visa + Finance) pour valider le budget.'
  },
  {
    id: 'whatif_entrepreneur',
    promptQuestion: 'Et si je créais mon entreprise de négoce tout en gardant une mission freelance ?',
    category: 'entrepreneuriat',
    impactOnPointB: 'Supprime tout plafond de verre hiérarchique et fait de vous le décisionnaire final.',
    newTrajectoryUnlocked: 'Trajectoire D : Entrepreneuriat & Indépendance',
    timeframeImpact: 'Démarrage immédiat en activité secondaire / freelance de transition',
    marketOpeningsBonusPercent: 30,
    financialImpactEstimate: 'Revenus variables : 0€ au démarrage ➔ 80k€+ à partir de l\'An 2',
    riskAssessment: 'Risque financier modéré si sécurisé par des contrats de mandat freelance réguliers.',
    suggestedFirstStep: 'Publier votre profil sur la vitrine Marché Mondial et recruter un co-fondateur via l\'Espace Collaboratif.'
  }
];

// ==========================================
// 7. SIGNAUX FAIBLES & RISQUES D'OBSOLESCENCE CONSTRUCTIFS
// ==========================================

export const INITIAL_WEAK_SIGNALS: MarketWeakSignal[] = [
  {
    id: 'ws_01',
    title: 'Automatisation croissante de la prospection par e-mail générique',
    sector: 'Développement Commercial B2B',
    signalType: 'automatisation',
    trendVelocity: 'rapide',
    description: 'Les taux d\'ouverture des e-mails froids automatisés ont chuté de 45% en 18 mois. Les décideurs filtrent désormais massivement par IA.',
    impactOnUserGoal: 'Les profils qui se contentent de séquences e-mailing perdent en efficacité.',
    recommendedCountermeasure: 'Renforcer la prospection par recommandation chaude, présence sur les Lives sectoriels et événements physiques ciblés.',
    sourceConfidence: 'Données Observatoire B2B 2026 (Fiabilité 94%)',
    detectedDate: '24 Août 2026'
  },
  {
    id: 'ws_02',
    title: 'Exigence grandissante de traçabilité ESG sur les flux d\'importation',
    sector: 'Commerce International & Douanes',
    signalType: 'evolution_reglementaire',
    trendVelocity: 'progressive',
    description: 'Les réglementations européennes et africaines imposent de nouvelles déclarations de conformité carbone et éthique sur les marchandises.',
    impactOnUserGoal: 'Les Directeurs Commerciaux maîtrisant ces normes bénéficient d\'une prime d\'embauche de 20%.',
    recommendedCountermeasure: 'Intégrer le mini-module "Conformité RSE & Douanes Vertes" dans votre Passeport de Compétences.',
    sourceConfidence: 'Rapports OMC & Douanes Internationales (Fiabilité 98%)',
    detectedDate: '15 Août 2026'
  },
  {
    id: 'ws_03',
    title: 'Pénurie de négociateurs trilingues (Français - Anglais - Espagnol/Arabe)',
    sector: 'Corridors Émergents',
    signalType: 'penurie_talents',
    trendVelocity: 'rapide',
    description: 'Le volume d\'échanges Sud-Sud et Europe-Afrique augmente 2x plus vite que le vivier de cadres commerciaux maîtrisant 2 langues internationales.',
    impactOnUserGoal: 'Opportunité stratégique majeure : valider votre niveau d\'anglais vous place dans le top 5% des candidats.',
    recommendedCountermeasure: 'Faire de l\'anglais votre levier n°1 des 60 prochains jours.',
    sourceConfidence: 'Baromètre Recrutement Cadres Export 2026',
    detectedDate: '19 Août 2026'
  }
];

// ==========================================
// 8. PLANS D'ÉVOLUTION 90 JOURS & 1 AN
// ==========================================

export const INITIAL_90_DAYS_PLAN: EvolutionPlan90Days = {
  startDate: '1er Septembre 2026',
  activePace: 'acceleration',
  targetInterimGoal: 'Valider le niveau Anglais C1 et signer un premier mandat d\'export pilote structuré',
  month1_30d: {
    theme: 'Mois 1 (30 jours) : Fondations & Levée du Verrou Linguistique',
    priorityActions: [
      { id: 'act_30_1', title: 'Démarrer le cycle intensif Campus "Anglais Négociation C1" (3 sessions/sem)', isDone: true, deadline: '10 Septembre', impact: 'Haute' },
      { id: 'act_30_2', title: 'Auditer le Passeport de Compétences et ajouter les preuves de closing B2B', isDone: true, deadline: '15 Septembre', impact: 'Haute' },
      { id: 'act_30_3', title: 'Identifier 5 décideurs Export sur la Carte Relationnelle Intelligente', isDone: false, deadline: '25 Septembre', impact: 'Moyenne' }
    ],
    focusSkills: ['Anglais C1', 'Preuves de compétences']
  },
  month2_60d: {
    theme: 'Mois 2 (60 jours) : Spécialisation Douanes & Premier Pitch International',
    priorityActions: [
      { id: 'act_60_1', title: 'Suivre le module Incoterms 2020 & Logistique Export sur Campus', isDone: false, deadline: '15 Octobre', impact: 'Haute' },
      { id: 'act_60_2', title: 'Réaliser 3 simulations de négociation vocale en anglais avec le Coach 3D', isDone: false, deadline: '22 Octobre', impact: 'Moyenne' },
      { id: 'act_60_3', title: 'Initier 2 demandes d\'introduction qualifiée via les facilitateurs vérifiés', isDone: false, deadline: '30 Octobre', impact: 'Haute' }
    ],
    focusSkills: ['Incoterms 2020', 'Pitch International']
  },
  month3_90d: {
    theme: 'Mois 3 (90 jours) : Résultat Tangible & Clôture de Mandat Pilote',
    targetMilestoneResult: 'Contrat pilote validé ou offre d\'embauche formelle Direction Commerciale',
    priorityActions: [
      { id: 'act_90_1', title: 'Passer la certification officielle Anglais des Affaires C1', isDone: false, deadline: '15 Novembre', impact: 'Haute' },
      { id: 'act_90_2', title: 'Finaliser la négociation d\'un mandat export ou signer l\'offre cible', isDone: false, deadline: '25 Novembre', impact: 'Critique' },
      { id: 'act_90_3', title: 'Effectuer le Bilan de Carrière 90 jours avec le Conseil d\'Experts', isDone: false, deadline: '30 Novembre', impact: 'Haute' }
    ],
    successCriteria: [
      'Score C1 validé (>80%)',
      'Preuve de mandat d\'export enregistrée dans le Jumeau Pro',
      'Progression vers le Point B réévaluée à +85%'
    ]
  }
};

export const INITIAL_YEARLY_PLAN: YearlyMilestonePlan = {
  yearTarget: 'Année 2026-2027 : Transition Réussie vers la Direction Commerciale Internationale',
  quarter1: {
    title: 'T1 : Montée en Puissance & Levée des Verrous',
    mainFocus: 'Anglais C1 + Incoterms 2020 + Consolidation du Capital Relationnel',
    expectedDeliverable: 'Passeport de compétences certifié à 85% et premier mandat pilote engagé',
    isCurrent: true
  },
  quarter2: {
    title: 'T2 : Déploiement Opérationnel & Missions Équipes',
    mainFocus: 'Pilotage d\'une mission export collective sur le Réseau MOC + Négociation C-Level',
    expectedDeliverable: 'Résultat chiffré supérieur à 100k€ sur l\'activité internationale',
    isCurrent: false
  },
  quarter3: {
    title: 'T3 : Reconnaissance & Visibilité Sectorielle',
    mainFocus: 'Animation d\'un Live sectoriel export + Mentorat de pairs juniors + Radar d\'offres exclusives',
    expectedDeliverable: 'Positionnement reconnu d\'expert export dans l\'écosystème',
    isCurrent: false
  },
  quarter4: {
    title: 'T4 : Consécration du Point B & Nouveau Cycle',
    mainFocus: 'Prise de poste Direction Commerciale Internationale ou Agence de Négoce autonome',
    expectedDeliverable: 'Point B atteint à 100% et définition du Point C (Horizon 3 ans)',
    isCurrent: false
  }
};

// ==========================================
// 9. CHECKPOINTS DE PARCOURS
// ==========================================

export const INITIAL_CAREER_CHECKPOINTS: CareerCheckpoint[] = [
  {
    id: 1,
    name: 'Checkpoint 1 : Fondations & Clarté Stratégique',
    description: 'Point A cartographié avec lucidité, Point B articulé et Jumeau Professionnel initialisé.',
    status: 'valide',
    completionPercentage: 100,
    keyValidationCriteria: [
      'Diagnostic 17 critères complété',
      'Point B défini parmi les 12 archétypes',
      'Jumeau Pro synchronisé'
    ],
    dateAchieved: '15 Août 2026'
  },
  {
    id: 2,
    name: 'Checkpoint 2 : Compétences & Preuves Vérifiées',
    description: 'Écarts critiques comblés sur Campus et preuves de niveau enregistrées.',
    status: 'en_cours',
    completionPercentage: 75,
    keyValidationCriteria: [
      'Vente B2B confirmée par réalisation',
      'Anglais C1 validé (en cours, 72%)',
      'Incoterms 2020 acquis sur Campus'
    ]
  },
  {
    id: 3,
    name: 'Checkpoint 3 : Visibilité & Capital Relationnel',
    description: 'Réseau activé, facilitateurs identifiés et studio de marque pro opérationnel.',
    status: 'en_cours',
    completionPercentage: 60,
    keyValidationCriteria: [
      'Au moins 10 contacts stratégiques qualifiés',
      'CV Maître et Portfolio exportables validés',
      'Synergies Tribus et Lives MOC activées'
    ]
  },
  {
    id: 4,
    name: 'Checkpoint 4 : Conquête d\'Opportunités & Négociations',
    description: 'Candidatures ciblées transmises, entretiens menés et relances courtoises J+7.',
    status: 'a_venir',
    completionPercentage: 35,
    keyValidationCriteria: [
      'Dossier vivant actif avec relances anti-spam',
      'Débriefings d\'entretiens vocaux enregistrés',
      'Au moins 2 opportunités au stade Négociation'
    ]
  },
  {
    id: 5,
    name: 'Checkpoint 5 : Résultat Tangible & Atteinte du Point B',
    description: 'Contrat signé, mandat validé ou prise de fonction effective.',
    status: 'a_venir',
    completionPercentage: 15,
    keyValidationCriteria: [
      'Validation contractuelle définitive',
      'Attestation de résultat par l\'employeur ou le client',
      'Transition vers le statut de Mentor et nouveau cycle'
    ]
  }
];

// ==========================================
// 10. DIAGNOSTIC DE PLATEAU & COMMANDE « DÉBLOQUE MA SITUATION »
// ==========================================

export const INITIAL_PLATEAU_DIAGNOSIS: CareerPlateauDiagnosis = {
  isPlateauDetected: false,
  stagnationDurationWeeks: 0,
  identifiedBlockers: [
    {
      cause: 'competence_bloquante',
      explanation: 'L\'absence de certification officielle Anglais C1 bloque l\'accès direct aux 30% d\'opportunités les plus rémunératrices.',
      severity: 'haute'
    },
    {
      cause: 'positionnement_trop_etroit',
      explanation: 'Les candidatures actuelles ciblent uniquement les cabinets parisiens sans exploiter les opportunités transfrontalières.',
      severity: 'moyenne'
    }
  ],
  unlockingAlternatives: [
    {
      id: 'unl_1',
      title: 'Alternative 1 : Levier Linguistique Accéléré',
      approachType: 'nouvelle_competence',
      actionDescription: 'Programmer 3 semaines intensives de pratique orale anglaise sur Campus avec simulations IA.',
      expectedImpact: '+55% d\'offres internationales éligibles immédiatement.'
    },
    {
      id: 'unl_2',
      title: 'Alternative 2 : Pivot Corridors Régionaux',
      approachType: 'nouveau_marche',
      actionDescription: 'Cibler les distributeurs basés à Casablanca, Abidjan et Dakar en recherche active de managers commerciaux formés aux standards internationaux.',
      expectedImpact: 'Moins de concurrence frontale et cycles de décision 2x plus courts.'
    },
    {
      id: 'unl_3',
      title: 'Alternative 3 : Réponse en Consortium Pluridisciplinaire',
      approachType: 'synergie_reseau',
      actionDescription: 'Former une équipe d\'opportunité avec un juriste et un financier du Réseau MOC pour remporter un appel d\'offres d\'envergure.',
      expectedImpact: 'Accès direct à un mandat à 80k€ sans attendre une embauche classique.'
    }
  ],
  topLeverHeadline: 'Levier N°1 Actuel : Valider l\'Anglais C1 des Affaires',
  topLeverReason: 'Ce levier unique débloque 4 opportunités sur 5 actuellement en attente dans votre Radar et augmente vos prétentions de 25%.'
};

// ==========================================
// 11. CONSEIL DE CARRIÈRE MULTI-EXPERTS (ORCHESTRATION)
// ==========================================

export const INITIAL_CAREER_COUNCIL: MultiExpertCareerCouncil = {
  decisionTopic: 'Opportunité de Direction Commerciale basée à Dubaï avec couverture Afrique de l\'Est (Package 95k$ net + Prime Export)',
  consultedExperts: [
    {
      expertId: 'exp_career',
      name: 'Mamadou DIALLO (Expert Carrière)',
      domain: 'Carrière',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80',
      analysis: 'Cette opportunité correspond exactement à votre Point B à 92%. Le périmètre géographique valide immédiatement votre statut de Directeur International.',
      verdict: 'Favorable',
      keyRecommendations: [
        'Vérifier l\'autonomie sur le budget de recrutement de l\'équipe locale.',
        'Négocier une clause de révision salariale après les 6 premiers mois.'
      ]
    },
    {
      expertId: 'exp_finance',
      name: 'Aïssata DIALLO (Experte Finance & Patrimoine)',
      domain: 'Finance',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80',
      analysis: 'Sur le plan financier, la fiscalité émiratie (0% impôt sur le revenu) améliore votre capacité d\'épargne nette de +180% par rapport à une opportunité européenne équivalente.',
      verdict: 'Favorable',
      keyRecommendations: [
        'Prévoir une réserve d\'installation équivalente à 4 mois de loyer à Dubaï (loyers souvent annuels).',
        'Maintenir une couverture prévoyance santé internationale complète (CFE ou équivalent).'
      ]
    },
    {
      expertId: 'exp_lang',
      name: 'Amadou DIALLO (Expert Langues & Interculturel)',
      domain: 'Langues',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      analysis: 'Le milieu d\'affaires à Dubaï et en Afrique de l\'Est fonctionne à 100% en anglais. Votre niveau actuel B2/C1 doit être sécurisé sans délai.',
      verdict: 'Conditionné',
      keyRecommendations: [
        'Finaliser le module C1 sur Campus avant la date de prise de poste.',
        'S\'entraîner au vocabulaire spécifique des contrats de distribution régionaux.'
      ]
    },
    {
      expertId: 'exp_legal',
      name: 'Fatoumata DIALLO (Experte Juridique & Mobilité)',
      domain: 'Juridique',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
      analysis: 'Le contrat relève du droit du travail émirati (MOHRE). Les visas de travail pour cadre supérieur sont délivrés rapidement si les diplômes sont authentifiés.',
      verdict: 'Vigilance',
      keyRecommendations: [
        'Exiger la prise en charge intégrale des frais de visa et de relocalisation par l\'employeur.',
        'Vérifier l\'absence de clause de non-concurrence excessivement restrictive sur la zone MENA.'
      ]
    }
  ],
  orchestratedSynthesis: {
    mainConclusion: 'L\'opportunité est hautement recommandable et propulse votre carrière vers son Point B avec 12 mois d\'avance. La condition impérative de succès est la validation de l\'anglais C1 et la négociation du package d\'installation.',
    riskLevel: 'Modéré',
    actionableRoadmap: [
      '1. Valider formellement la proposition salariale avec prise en charge du logement M1.',
      '2. Engager la procédure de légalisation des diplômes avec le support administratif.',
      '3. Réaliser 5 simulations d\'entretiens finaux avec le Coach 3D Vocal.'
    ]
  }
};

// ==========================================
// 12. MATRICE DE DÉCISION PERSONNELLE & COMPARATEUR
// ==========================================

export const INITIAL_DECISION_CRITERIA: PersonalDecisionCriterion[] = [
  { id: 'crit_remun', name: 'Rémunération & Avantages', weight: 9, iconName: 'DollarSign' },
  { id: 'crit_progress', name: 'Potentiel d\'Apprentissage & Évolution', weight: 9, iconName: 'TrendingUp' },
  { id: 'crit_autonomy', name: 'Autonomie & Responsabilités', weight: 8, iconName: 'Compass' },
  { id: 'crit_balance', name: 'Équilibre de Vie & Flexibilité', weight: 7, iconName: 'Heart' },
  { id: 'crit_intl', name: 'Mobilité & Rayonnement International', weight: 8, iconName: 'Globe' },
  { id: 'crit_stability', name: 'Stabilité & Sécurité de l\'Emploi', weight: 6, iconName: 'ShieldCheck' },
  { id: 'crit_impact', name: 'Sens, Utilité & Impact', weight: 8, iconName: 'Sparkles' }
];

export const INITIAL_OPPORTUNITY_COMPARISONS: OpportunityComparisonItem[] = [
  {
    id: 'opp_dubai',
    title: 'Directeur Commercial MENA & Afrique de l\'Est',
    organization: 'Global Trade Hub Ltd (Dubaï)',
    type: 'CDI International / Expatriation',
    scoresByCriterion: {
      crit_remun: 10,
      crit_progress: 9,
      crit_autonomy: 9,
      crit_balance: 6,
      crit_intl: 10,
      crit_stability: 7,
      crit_impact: 8
    },
    pros: [
      'Rémunération nette exceptionnelle (0% impôt)',
      'Rayonnement direct sur 8 pays',
      'Propulse immédiatement au Point B'
    ],
    cons: [
      'Dépaysement initial et rythme soutenu',
      'Déplacements fréquents'
    ],
    calculatedScore: 88,
    aiCommentary: 'Option N°1 pour accélérer au maximum votre carrière. Recommandée si vous êtes prêt pour une mobilité internationale immédiate.'
  },
  {
    id: 'opp_paris_scaleup',
    title: 'Head of Sales France & Europe du Sud',
    organization: 'FinTech Logistics SAS (Paris)',
    type: 'CDI Cadre',
    scoresByCriterion: {
      crit_remun: 7,
      crit_progress: 8,
      crit_autonomy: 8,
      crit_balance: 8,
      crit_intl: 6,
      crit_stability: 8,
      crit_impact: 7
    },
    pros: [
      'Cadre de travail stable et hybride (2j télétravail)',
      'Équipe déjà en place (4 commerciaux)',
      'Stock-options (BSPCE) incluses'
    ],
    cons: [
      'Fiscalité française standard',
      'Moins d\'ouverture sur les marchés émergents'
    ],
    calculatedScore: 76,
    aiCommentary: 'Option de grande qualité offrant un équilibre parfait entre vie personnelle et évolution hiérarchique locale.'
  },
  {
    id: 'opp_freelance_consortium',
    title: 'Mandat Exclusif d\'Apporteur d\'Affaires & Conseil Export',
    organization: 'Consortium Partenaires MOK',
    type: 'Mandat Indépendant / Freelance',
    scoresByCriterion: {
      crit_remun: 8,
      crit_progress: 9,
      crit_autonomy: 10,
      crit_balance: 7,
      crit_intl: 8,
      crit_stability: 5,
      crit_impact: 9
    },
    pros: [
      'Liberté totale d\'organisation et choix des clients',
      'Marge directe de 15% sur chaque contrat signé',
      'Création immédiate de votre marque personnelle'
    ],
    cons: [
      'Pas de salaire fixe garanti',
      'Gestion administrative complète à votre charge'
    ],
    calculatedScore: 80,
    aiCommentary: 'Idéal si votre ambition profonde penche vers l\'entrepreneuriat et l\'indépendance sans intermédiaire.'
  }
];

// ==========================================
// 13. BILAN DE CARRIÈRE IA GÉNÉRÉ
// ==========================================

export const INITIAL_CAREER_AI_BILAN: CareerAIBilan = {
  generatedAt: '27 Août 2026',
  userName: 'Professionnel Élite',
  currentObjective: 'Directeur Commercial International & Développement Export (Point B)',
  whatYouAccomplished: [
    'Diagnostic complet Point A réalisé avec lucidité sur 17 critères clés.',
    '450k€ de chiffre d\'affaires commercial généré et attesté par preuves réelles.',
    'Constitution d\'un portefeuille de 24 contacts stratégiques dont 4 décideurs de niveau C-Level.',
    'Activation du Studio de Marque Pro avec CV Maître universel et Portfolio exportable.'
  ],
  whatYouMasterNow: [
    'Prospection B2B et qualification de leads grands comptes (Preuve confirmée).',
    'Négociation d\'accords cadres complexes et contractualisation.',
    'Pilotage CRM moderne et automatisation des relances courtoises.',
    'Animation d\'équipes de mission collaborative pluridisciplinaires.'
  ],
  whatHasChangedInContext: [
    'La demande du marché pour les profils bilingues orientés corridors Sud-Nord a augmenté de +14%.',
    'Le réseau de partenaires MOK vous a identifié comme profil à haut potentiel pour 3 opportunités d\'envergure.',
    'Votre score de préparation au Point B est passé de 42% à 74% en 4 mois d\'activité structurée.'
  ],
  currentCoreStrengths: [
    'Aisance relationnelle et crédibilité commerciale immédiate.',
    'Discipline dans le suivi des dossiers (Dossier Vivant et timing courtois).',
    'Capacité d\'adaptation à des environnements pluriculturels.'
  ],
  currentOpenOpportunities: [
    'Offre Direction Dubaï / Afrique de l\'Est (Adéquation 88%).',
    'Poste Head of Sales Scale-up Paris (Adéquation 76%).',
    'Mandat d\'Apporteur d\'Affaires Consortium MOK (Adéquation 80%).'
  ],
  criticalGapsToClose: [
    'Passage officiel de l\'anglais de B2 à C1 (en cours, 72/100).',
    'Maîtrise des Incoterms 2020 et garanties bancaires export (Module Campus en attente).'
  ],
  recommendedNextTrajectory: 'Trajectoire B (Spécialisation Export) combinée à une transition vers Trajectoire E (International).',
  advisorNextPeriodRecommendation: 'Concentrer 80% de votre énergie d\'apprentissage sur les 30 prochains jours pour valider la certification Anglais C1 sur Campus. C\'est la clé de voûte qui déverrouille l\'offre internationale à 95k$.',
  factsVsRecommendationsDisclaimers: 'Ce bilan est un diagnostic d\'aide à la décision stratégique basé sur vos réalisations et les données observées du marché. Les prévisions et opportunités constituent des orientations suggérées et ne constituent en aucun cas une garantie formelle de résultat sans votre engagement continu.'
};

// ==========================================
// 14. VISUALISATION CHRONOLOGIQUE « MON ÉVOLUTION »
// ==========================================

export const INITIAL_EVOLUTION_TIMELINE: CareerEvolutionTimelineStep[] = [
  {
    id: 'evo_1',
    status: 'completed',
    timeframe: 'Il y a 12 mois',
    category: 'Situation Initiale',
    title: 'Pratique Commerciale Intuitive & Non Structurée',
    description: 'Ventes opportunistes sans méthode de prospection prédictive, pas de jumeau pro ni d\'objectif à 18 mois.',
    keyMilestones: ['Prise de conscience du besoin de structurer la trajectoire professionnelle.'],
    achievementBadge: 'Passé'
  },
  {
    id: 'evo_2',
    status: 'completed',
    timeframe: 'Il y a 6 mois',
    category: 'Point de Départ',
    title: 'Diagnostic Point A & Définition du Point B',
    description: 'Cartographie lucide des compétences, identification des lacunes et choix de la Direction Commerciale Export.',
    keyMilestones: ['Diagnostic Point A terminé et objectif Point B confirmé.'],
    achievementBadge: 'Fondation Validée'
  },
  {
    id: 'evo_3',
    status: 'completed',
    timeframe: 'Il y a 3 mois',
    category: 'Compétences Acquises',
    title: 'Socle Vente B2B, Négociation & RevOps IA',
    description: 'Validation de preuves réelles de closing et entraînement continu aux méthodes modernes.',
    keyMilestones: ['Preuves de vente B2B et de négociation consolidées.'],
    achievementBadge: 'Preuves Auditées'
  },
  {
    id: 'evo_4',
    status: 'completed',
    timeframe: 'Mois Dernier',
    category: 'Opportunités Détectées',
    title: 'Activation du Radar & Capital Relationnel',
    description: 'Détection de 3 opportunités majeures et mise en relation avec 4 facilitateurs C-Level.',
    keyMilestones: ['Trois opportunités qualifiées et quatre facilitateurs activés.'],
    achievementBadge: 'Réseau Connecté'
  },
  {
    id: 'evo_5',
    status: 'current',
    timeframe: 'Temps Présent (27 Août 2026)',
    category: 'Aujourd\'hui',
    title: 'Carrefour Décisionnel & Levée du Verrou Anglais C1',
    description: 'Score de préparation à 74%, choix d\'une trajectoire internationale et arbitrage des offres.',
    keyMilestones: ['Arbitrer les offres et finaliser le niveau d\'anglais C1.'],
    achievementBadge: 'Momentum Clé'
  },
  {
    id: 'evo_6',
    status: 'upcoming',
    timeframe: 'Automne 2026',
    category: 'Prochaine Étape (30-60 jours)',
    title: 'Validation Certification C1 & Mandat Export',
    description: 'Validation de l\'anglais des affaires sur Campus et closing du premier mandat transfrontalier.',
    keyMilestones: ['Valider le niveau C1 et conclure un premier mandat export.'],
    achievementBadge: 'Objectif J+60'
  },
  {
    id: 'evo_7',
    status: 'upcoming',
    timeframe: 'Horizon 12 - 18 mois',
    category: 'Point B Cible',
    title: 'Directeur Commercial International & Développement Export',
    description: 'Poste exécutif confirmé, équipe internationale managée, atteinte pleine de l\'accomplissement professionnel.',
    keyMilestones: ['Prendre la direction d\'une équipe commerciale internationale.'],
    achievementBadge: 'Point B Visé'
  }
];
