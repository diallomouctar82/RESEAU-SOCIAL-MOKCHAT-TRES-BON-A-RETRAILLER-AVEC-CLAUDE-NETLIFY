import { 
  CareerPointA, 
  CareerPointB, 
  CareerGapAnalysis, 
  CareerMissionPlan, 
  ProfessionalDigitalTwin,
  CareerSmartReminder,
  Coach3DSimulationSession
} from '../../types';

export const CAREER_ARCHETYPE_GOALS: {
  category: CareerPointB['category'];
  title: string;
  badge: string;
  icon: string;
  description: string;
  defaultDeadlineMonths: number;
  recommendedExperts: string[];
  successCriteria: string[];
}[] = [
  {
    category: 'first_job',
    title: 'Trouver mon premier emploi qualifié',
    badge: 'Insertion Pro',
    icon: 'GraduationCap',
    description: 'Structurer un CV d\'impact, cibler les entreprises qui recrutent des juniors et réussir les entretiens.',
    defaultDeadlineMonths: 3,
    recommendedExperts: ['agent-conseiller', 'agent-professeur', 'agent-creation'],
    successCriteria: ['CV & Portfolio validés ATS', '15 candidatures ciblées', '3 entretiens décrochés', '1 contrat CDI/CDD signé']
  },
  {
    category: 'executive_promotion',
    title: 'Devenir Directeur / Manager dans 2 ans',
    badge: 'Ascension Cadre',
    icon: 'TrendingUp',
    description: 'Développer le leadership stratégique, piloter des projets d\'envergure et négocier une promotion interne ou externe.',
    defaultDeadlineMonths: 24,
    recommendedExperts: ['agent-conseiller', 'agent-projet', 'agent-finance'],
    successCriteria: ['Certification Management validée', 'Direction d\'un projet pilote', 'Augmentation de responsabilité', 'Prise de poste Direction']
  },
  {
    category: 'expatriation',
    title: 'Travailler au Canada ou à l\'International',
    badge: 'Mobilité Globale',
    icon: 'Globe',
    description: 'Valider les équivalences de diplômes, réussir les tests de langue, obtenir le visa et signer une offre locale.',
    defaultDeadlineMonths: 12,
    recommendedExperts: ['agent-conseiller', 'agent-juridique', 'agent-diallo', 'agent-voyage'],
    successCriteria: ['Test de langue certifié (C1/IELTS)', 'Dossier d\'immigration/visa approuvé', 'CV adapté au format canadien/local', 'Offre d\'embauche internationale']
  },
  {
    category: 'career_switch',
    title: 'Changer de métier (Reconversion)',
    badge: 'Reconversion',
    icon: 'RotateCcw',
    description: 'Bilan de compétences transférables, parcours de formation accéléré sur Campus et transition sécurisée.',
    defaultDeadlineMonths: 6,
    recommendedExperts: ['agent-conseiller', 'agent-professeur', 'agent-coach'],
    successCriteria: ['Bilan de compétences validé', 'Formation certifiante achevée', 'Projet portfolio réalisé', 'Premier contrat dans le nouveau métier']
  },
  {
    category: 'acquire_clients',
    title: 'Trouver 20 nouveaux clients récurrents',
    badge: 'Développement B2B',
    icon: 'Users',
    description: 'Affiner l\'offre de service, lancer la prospection automatisée sur Marché Mondial et signer des contrats.',
    defaultDeadlineMonths: 3,
    recommendedExperts: ['agent-commerce', 'agent-creation', 'agent-projet'],
    successCriteria: ['Offre commerciale standardisée', '100 prospects qualifiés contactés', '20 propositions signées', 'Chiffre d\'affaires récurrent sécurisé']
  },
  {
    category: 'launch_business',
    title: 'Lancer mon activité & mon entreprise',
    badge: 'Entrepreneuriat',
    icon: 'Rocket',
    description: 'Du concept au premier euro : business plan, statuts juridiques, identité de marque et premières ventes.',
    defaultDeadlineMonths: 6,
    recommendedExperts: ['agent-projet', 'agent-juridique', 'agent-finance', 'agent-commerce'],
    successCriteria: ['Statuts enregistrés & compte pro ouvert', 'Offre validée sur le marché', 'Premières factures émises', 'Point mort atteint']
  },
  {
    category: 'find_co_founder',
    title: 'Trouver un associé / co-fondateur',
    badge: 'Partenariat Clé',
    icon: 'Handshake',
    description: 'Identifier un profil complémentaire dans le Réseau MOC, aligner la vision et signer le pacte d\'associés.',
    defaultDeadlineMonths: 4,
    recommendedExperts: ['agent-projet', 'agent-juridique', 'agent-coach'],
    successCriteria: ['Profil d\'associé idéal défini', '10 candidats rencontrés', 'Période d\'essai projet validée', 'Pacte d\'associés signé']
  },
  {
    category: 'find_investors',
    title: 'Trouver des investisseurs stratégiques',
    badge: 'Smart Money',
    icon: 'Briefcase',
    description: 'Constituer la Data Room, cartographier les Business Angels et fonds sectoriels, pitcher avec impact.',
    defaultDeadlineMonths: 6,
    recommendedExperts: ['agent-finance', 'agent-projet', 'agent-juridique', 'agent-commerce'],
    successCriteria: ['Data Room complète & Pitch Deck Studio', '30 investisseurs qualifiés contactés', 'Term Sheet reçue', 'Entrée au capital signée']
  },
  {
    category: 'raise_funds',
    title: 'Lever des fonds (Seed / Série A)',
    badge: 'Levée de Fonds',
    icon: 'DollarSign',
    description: 'Valorisation financière, modélisation des cashflows, due diligence juridique et clôture de tour de table.',
    defaultDeadlineMonths: 9,
    recommendedExperts: ['agent-finance', 'agent-juridique', 'agent-creation'],
    successCriteria: ['Modèle financier 3 ans validé', 'Due diligence financière & légale OK', 'Tour de table syndiqué', 'Fonds débloqués sur compte pro']
  },
  {
    category: 'international_sales',
    title: 'Vendre mes services & produits à l\'international',
    badge: 'Export Mondial',
    icon: 'Plane',
    description: 'Identifier les corridors d\'export porteurs, adapter les contrats & Incoterms et sécuriser les règlements Mok Trust.',
    defaultDeadlineMonths: 6,
    recommendedExperts: ['agent-commerce', 'agent-juridique', 'agent-diallo', 'agent-finance'],
    successCriteria: ['Étude de marché pays cible validée', 'Canaux de distribution établis', 'Contrats d\'exportation signés', 'Première commande internationale livrée']
  },
  {
    category: 'win_tender',
    title: 'Obtenir un marché ou remporter un appel d\'offres',
    badge: 'Marchés Publics / Privés',
    icon: 'FileCheck',
    description: 'Veille sur les marchés publics/privés, rédaction d\'une offre technique irréprochable et négociation finale.',
    defaultDeadlineMonths: 4,
    recommendedExperts: ['agent-commerce', 'agent-juridique', 'agent-projet'],
    successCriteria: ['Cahier des charges décortiqué', 'Mémoire technique Studio rédigé', 'Offre soumise dans les délais', 'Notification d\'attribution reçue']
  },
  {
    category: 'increase_revenue',
    title: 'Augmenter mes revenus de 50%',
    badge: 'Croissance Revenus',
    icon: 'TrendingUp',
    description: 'Optimisation de la valeur délivrée, diversification des sources de revenus et revalorisation tarifaire.',
    defaultDeadlineMonths: 6,
    recommendedExperts: ['agent-finance', 'agent-conseiller', 'agent-commerce'],
    successCriteria: ['Audit tarifaire & benchmark réalisé', 'Hausse de panier moyen / salaire négocié', 'Nouvelle offre génératrice de marge', '+50% de revenus nets mesurés']
  }
];

export const INITIAL_POINT_A: CareerPointA = {
  id: 'point-a-default',
  currentTitle: 'Consultant & Développeur Indépendant',
  educationLevel: 'Master 2 / Bac+5',
  diplomas: ['Diplôme d\'Ingénieur Informatique & Gestion', 'Certification Gestion de Projet Agile'],
  hardSkills: [
    { name: 'Architecture Web & Mobile (React, Node)', level: 85, category: 'Tech', verified: true },
    { name: 'Gestion de Projet & Stratégie', level: 75, category: 'Business', verified: true },
    { name: 'Négociation Commerciale B2B', level: 60, category: 'Commercial' },
    { name: 'Analyse Financière & Devis', level: 65, category: 'Finance' },
    { name: 'Conformité & Contrats', level: 50, category: 'Juridique' }
  ],
  softSkills: [
    'Communication multiculturelle',
    'Résolution de problèmes complexes',
    'Rigueur & autonomie',
    'Adaptabilité rapide'
  ],
  languages: [
    { language: 'Français', level: 'Natif', certified: true },
    { language: 'Anglais', level: 'B2', certified: true },
    { language: 'Espagnol', level: 'A2' }
  ],
  experiences: [
    {
      role: 'Lead Développeur & Consultant',
      company: 'Digital Solutions Global',
      duration: '3 ans (2022 - Présent)',
      highlights: ['Pilotage de 12 projets clients', 'Déploiement d\'applications haute disponibilité'],
      verified: true
    },
    {
      role: 'Chef de Projet Junior',
      company: 'InnovTech Africa',
      duration: '2 ans (2020 - 2022)',
      highlights: ['Coordination d\'équipe de 6 ingénieurs', 'Gestion des livrables et des budgets']
    }
  ],
  currentSituation: 'freelancer',
  location: 'Paris, France / Mobilité Afrique & Amérique du Nord',
  mobility: 'international',
  constraints: ['Disponibilité max 40h/semaine', 'Déplacements internationaux limités à 1 semaine/mois'],
  weeklyAvailabilityHours: 35,
  budgetOrResources: 'Trésorerie d\'amorçage de 15 000 € disponible',
  ambitions: [
    'Étendre ma clientèle sur 3 continents',
    'Créer une structure employant 10 personnes d\'ici 24 mois',
    'Générer un chiffre d\'affaires récurrent supérieur à 150k€/an'
  ],
  forces: [
    'Solide expertise technique et capacité d\'exécution',
    'Capacité d\'apprentissage accélérée',
    'Réseau professionnel actif dans 4 pays'
  ],
  faiblesses: [
    'Prospection commerciale à grande échelle non automatisée',
    'Anglais professionnel à hisser au niveau C1 pour les marchés nord-américains',
    'Processus de closing et de négociation de haut niveau à formaliser'
  ],
  trainingNeeds: [
    'Négociation Grands Comptes B2B (Campus)',
    'English for Global Business Mastery (Centre de Langues)',
    'Montage Juridique International (Maître Diallo)'
  ],
  cvUrl: 'https://storage.lmav.world/cv_verified_2025.pdf',
  portfolioUrls: ['https://portfolio.lmav.world/pro'],
  networkEstimatedContacts: 340
};

export const INITIAL_MISSION_PLAN: CareerMissionPlan = {
  id: 'mission-plan-1',
  userGoal: {
    id: 'goal-active-1',
    title: 'Trouver 20 nouveaux clients récurrents à l\'international',
    category: 'acquire_clients',
    rawUserInput: 'Je veux développer mon activité à l\'international et signer 20 clients réguliers.',
    targetDeadlineMonths: 4,
    targetSalaryOrRevenue: '12 000 € / mois de CA récurrent',
    targetLocation: 'Europe de l\'Ouest, Afrique de l\'Ouest, Amérique du Nord',
    targetCompanyOrIndustry: 'Entreprises en transformation numérique & PME exportatrices',
    successCriteria: [
      'Offre B2B packagée et traduite (FR/EN)',
      'Tunnel de prospection Marché Mondial opérationnel',
      '20 contrats-cadres signés avec séquestre Mok Trust',
      'Plateforme de suivi client déployée'
    ],
    urgencyLevel: 'high'
  },
  pointA: INITIAL_POINT_A,
  gaps: {
    competencyGaps: [
      {
        skill: 'Techniques de Closing & Négociation Grands Comptes',
        currentLevel: 60,
        requiredLevel: 85,
        suggestedCampusCourseId: 'course-b2b-sales-mastery',
        courseTitle: 'Négociation Stratégique & Closing International (Campus)',
        estimatedHoursToLearn: 12
      },
      {
        skill: 'Anglais Professionnel de Vente (Niveau C1)',
        currentLevel: 70,
        requiredLevel: 90,
        suggestedCampusCourseId: 'course-english-c1-business',
        courseTitle: 'English for Global Deals & Pitching (Langues)',
        estimatedHoursToLearn: 18
      }
    ],
    experienceGaps: [
      'Absence de cas clients documentés au format nord-américain',
      'Processus de contractualisation internationale standardisé manquant'
    ],
    networkGaps: [
      'Faible pénétration dans les réseaux de décisionnaires au Canada et au Sénégal'
    ],
    languageGaps: [
      {
        language: 'Anglais',
        current: 'B2 (Intermédiaire supérieur)',
        target: 'C1 (Professionnel autonome fluide)',
        suggestedPracticeModule: 'Simulation de Négociation Vocale Coach 3D'
      }
    ],
    certificationGaps: [
      'Badge de Vendeur Certifié Mok Trust Niveau 3'
    ],
    overallReadinessScore: 78,
    keySuccessLever: 'Automatisation de la prospection via Marché Mondial + Rehaussement de l\'offre en anglais avec le Coach 3D.'
  },
  progressPercent: 42,
  milestones: [
    {
      id: 'm-1',
      phaseNumber: 1,
      title: 'Diagnostic Point A & Structuration de l\'Offre',
      description: 'Audit des forces, définition du catalogue de services standardisé avec livrables clairs et grille tarifaire.',
      estimatedDuration: 'Semaine 1-2',
      status: 'completed',
      interconnectedModule: 'studio',
      gatewayAction: 'Ouvrir Studio Créatif',
      deliverable: 'Plaquette commerciale B2B (PDF & Web)',
      isResultCheckpoint: true,
      actualOutcomeRecorded: 'Offre packagée en 3 offres claires validée par le Conseil d\'Experts.'
    },
    {
      id: 'm-2',
      phaseNumber: 2,
      title: 'Validation de l\'Anglais Commercial & Entraînement Coach 3D',
      description: 'Simulations vocales intensives de pitch et d\'objections clients en anglais avec le Coach 3D.',
      estimatedDuration: 'Semaine 3',
      status: 'completed',
      interconnectedModule: 'career',
      gatewayAction: 'Lancer Coach 3D',
      deliverable: 'Score de fluidité > 8.5/10 au simulateur',
      isResultCheckpoint: true,
      actualOutcomeRecorded: 'Session validée avec 9/10 en simulation "Pitch Client B2B".'
    },
    {
      id: 'm-3',
      phaseNumber: 3,
      title: 'Activation du Scanner & Prospection Marché Mondial',
      description: 'Lancement des agents Hunter sur l\'Europe et l\'Afrique pour identifier 100 décideurs qualifiés.',
      estimatedDuration: 'Semaine 4-6',
      status: 'in_progress',
      interconnectedModule: 'shop',
      gatewayAction: 'Ouvrir Marché Mondial',
      deliverable: 'Pipeline de 30 prospects chauds contactés',
      isResultCheckpoint: false,
      planBAlternative: {
        triggerReason: 'Taux de réponse < 10% sur les e-mails froids',
        fallbackRoute: 'Activation du Réseau MOC (Tribus d\'affaires & Reels de démonstration)',
        adaptedActions: [
          'Publier un Reel démonstratif de réalisation',
          'Intervenir dans un Live B2B spécialisé',
          'Demander des introductions via les membres certifiés MOC'
        ]
      }
    },
    {
      id: 'm-4',
      phaseNumber: 4,
      title: 'Rendez-vous de Closing & Négociation avec Séquestre',
      description: 'Mener les entretiens de cadrage, proposer des devis avec séquestre Mok Trust pour rassurer les clients internationaux.',
      estimatedDuration: 'Semaine 7-10',
      status: 'pending',
      interconnectedModule: 'legal',
      gatewayAction: 'Ouvrir Juridique & Contrats',
      deliverable: '10 premiers contrats-cadres signés',
      isResultCheckpoint: true
    },
    {
      id: 'm-5',
      phaseNumber: 5,
      title: 'Industrialisation & Atteinte du Point B (20 Clients)',
      description: 'Clôture de la 20ème signature, mise en place des prélèvements récurrents et fidélisation.',
      estimatedDuration: 'Semaine 11-16',
      status: 'pending',
      interconnectedModule: 'finance',
      gatewayAction: 'Ouvrir Wallet & Facturation',
      deliverable: 'Chiffre d\'affaires récurrent > 12k€/mois certifié',
      isResultCheckpoint: true
    }
  ],
  activeActions: [
    {
      id: 'act-1',
      title: 'Envoyer la relance personnalisée au prospect TechNova Canada (sans réponse depuis 5 jours)',
      priority: 'high',
      deadline: 'Aujourd\'hui 17h00',
      estimatedMinutes: 10,
      completed: false,
      moduleLink: 'career_relance',
      smartReminderText: 'TechNova Canada n\'a pas répondu. Le modèle d\'e-mail persuasif est prêt.',
      category: 'prospection'
    },
    {
      id: 'act-2',
      title: 'Réaliser la simulation "Gestion des objections prix" avec le Coach 3D avant l\'appel de demain',
      priority: 'high',
      deadline: 'Demain 10h00',
      estimatedMinutes: 15,
      completed: false,
      moduleLink: 'career_simulator',
      smartReminderText: 'Entretien commercial prévu demain à 14h. Entraîne-toi sur le simulateur.',
      category: 'simulation'
    },
    {
      id: 'act-3',
      title: 'Terminer le module Campus "Contrats de Prestation Internationaux" (Maître Diallo)',
      priority: 'medium',
      deadline: 'Dans 3 jours',
      estimatedMinutes: 45,
      completed: false,
      moduleLink: 'campus',
      smartReminderText: 'Il te reste 2 leçons pour valider la certification juridique B2B.',
      category: 'formation'
    },
    {
      id: 'act-4',
      title: 'Publier la nouvelle étude de cas client sur le Réseau MOC / Tribu Entreprendre',
      priority: 'medium',
      deadline: 'Vendredi',
      estimatedMinutes: 20,
      completed: false,
      moduleLink: 'network',
      smartReminderText: 'Valorise ton dernier succès pour attirer des leads entrants.',
      category: 'reseautage'
    }
  ],
  smartReminders: [
    {
      id: 'rem-1',
      type: 'follow_up',
      title: 'Relance prioritaire en attente',
      message: 'L\'entreprise AgroExport Dakar a consulté ta proposition il y a 48h. Veux-tu générer la relance automatique ?',
      timestamp: 'Il y a 2h',
      actionLabel: 'Préparer la relance',
      actionType: 'open_relance',
      relatedEntityName: 'AgroExport Dakar',
      isRead: false
    },
    {
      id: 'rem-2',
      type: 'interview_prep',
      title: 'Simulation d\'entretien recommandée',
      message: 'Ton échange avec le Directeur des Opérations de LogisTech est calé pour demain. Lance un entraînement vocal 3D.',
      timestamp: 'Il y a 5h',
      actionLabel: 'Lancer le Coach 3D',
      actionType: 'open_simulator',
      relatedEntityName: 'LogisTech Europe',
      isRead: false
    },
    {
      id: 'rem-3',
      type: 'new_opportunity',
      title: 'Nouvelle opportunité à 94% de match',
      message: 'Un appel d\'offres pour l\'architecture d\'une plateforme de traçabilité vient d\'être publié sur Marché Mondial.',
      timestamp: 'Hier',
      actionLabel: 'Examiner l\'offre',
      actionType: 'open_opportunity',
      relatedEntityName: 'Chambre de Commerce Internationale',
      isRead: true
    }
  ],
  councilRecommendations: [
    {
      agentId: 'agent-conseiller',
      agentName: 'Conseiller Diallo',
      role: 'Superviseur Carrière & Stratégie',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      specialty: 'Trajectoire & Insertion Marché',
      verdict: 'Trajectoire validée avec une probabilité de succès à 88%.',
      recommendation: 'Concentre les efforts sur les 3 prochaines semaines sur le closing direct avec le support des modèles d\'approche IA.',
      status: 'approved',
      prescribedTool: 'Scanner & Pipeline de Suivi',
      gatewayTab: 'career'
    },
    {
      agentId: 'agent-commerce',
      agentName: 'Directeur Commercial Diallo',
      role: 'Expert Marché Mondial & Négociation',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      specialty: 'Vente B2B & Export',
      verdict: 'Offre tarifaire compétitive, levier de croissance identifié.',
      recommendation: 'Adosse systématiquement les propositions au séquestre Mok Trust pour annuler la frilosité des clients étrangers.',
      status: 'approved',
      prescribedTool: 'Marché Mondial / RFQ Hub',
      gatewayTab: 'shop'
    },
    {
      agentId: 'agent-juridique',
      agentName: 'Maître Diallo',
      role: 'Expert Juridique & Conformité',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      specialty: 'Droit des Affaires & Contrats',
      verdict: 'Attention requise sur les clauses de propriété intellectuelle transfrontalières.',
      recommendation: 'Utiliser la matrice contractuelle standardisée Le Monde à Vous avec clause d\'arbitrage intégrée.',
      status: 'action_required',
      prescribedTool: 'Centre Juridique & Contrats',
      gatewayTab: 'legal'
    },
    {
      agentId: 'agent-diallo',
      agentName: 'Diallo Langues',
      role: 'Expert Immersion Linguistique',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      specialty: 'Anglais des Affaires & Diplomatie',
      verdict: 'Niveau B2 suffisant pour démarrer, passage en C1 recommandé.',
      recommendation: 'Pratiquer 15 minutes par jour sur le Coach 3D avec accentuation des verbes d\'action.',
      status: 'approved',
      prescribedTool: 'Centre de Langues & Coach 3D',
      gatewayTab: 'languages'
    }
  ],
  certifiedResultsCount: 2
};

export const INITIAL_DIGITAL_TWIN: ProfessionalDigitalTwin = {
  id: 'twin-default',
  userId: 'user-current',
  lastUpdated: 'Aujourd\'hui à 09:30',
  reputationScore: 92,
  profileStrengthScore: 88,
  verifiedCredentialsCount: 6,
  masteredSkills: [
    { name: 'Architecture Logicielle & Cloud', level: 90, endorsedCount: 18, verifiedDate: '2025-01-15' },
    { name: 'Gestion de Projet Agile & Scrum', level: 85, endorsedCount: 14, verifiedDate: '2025-02-10' },
    { name: 'Négociation Commerciale B2B', level: 75, endorsedCount: 9, verifiedDate: '2025-04-20' },
    { name: 'Anglais Professionnel International', level: 80, endorsedCount: 12, verifiedDate: '2025-05-12' },
    { name: 'Contrats de Prestation & Devis', level: 70, endorsedCount: 7 }
  ],
  learningInProgress: [
    { title: 'Négociation Stratégique Grands Comptes', source: 'Campus LMAV', progressPercent: 65, estimatedCompletion: 'Dans 4 jours' },
    { title: 'English for Global Business Mastery', source: 'Centre de Langues', progressPercent: 40, estimatedCompletion: 'Dans 2 semaines' }
  ],
  completedProjects: [
    {
      title: 'Plateforme E-commerce & Logistique Transfrontalière',
      role: 'Lead Architecte & Chef de Projet',
      outcome: 'Déploiement réussi dans 3 pays, 150k transactions traitées.',
      proofUrl: 'https://proof.lmav.world/proj-884',
      year: '2024'
    },
    {
      title: 'Système de Facturation & Séquestre B2B',
      role: 'Consultant Solution',
      outcome: 'Réduction des délais d\'encaissement de 45 jours à 48 heures.',
      proofUrl: 'https://proof.lmav.world/proj-712',
      year: '2024'
    }
  ],
  concreteOutcomes: [
    {
      id: 'out-1',
      metric: 'Premier Contrat International Signé',
      description: 'Signature d\'un contrat-cadre de 18 000 € avec une entreprise de distribution à Abidjan.',
      date: '2025-03-14',
      category: 'contract',
      verified: true
    },
    {
      id: 'out-2',
      metric: 'Certification Campus Validée',
      description: 'Obtention du certificat "Gestion de Projets d\'Envergure" avec mention Très Bien (18/20).',
      date: '2025-02-01',
      category: 'exam',
      verified: true
    },
    {
      id: 'out-3',
      metric: '5 Nouveaux Clients Récurrents',
      description: 'Acquisition de 5 clients sous contrat de maintenance mensuelle.',
      date: '2025-04-30',
      category: 'client',
      verified: true
    }
  ],
  careerPreferences: {
    remotePreference: 'Hybride ou 100% Remote avec déplacements ponctuels',
    salaryExpectation: '100k€ - 140k€ / an (ou 12k€/mois en freelance)',
    preferredCultures: ['Entreprises internationales innovantes', 'Environnements agiles', 'Tech & Impact'],
    nonNegotiables: ['Paiement sécurisé garanti', 'Autonomie organisationnelle', 'Alignement éthique']
  },
  networkGraphNodesCount: 340,
  acceptedOpportunitiesCount: 7,
  declinedOpportunitiesCount: 2
};

export const MOCK_COACH_SESSIONS: Coach3DSimulationSession[] = [
  {
    id: 'sim-1',
    type: 'pitch',
    roleplayPersona: 'Investisseur VC Exigeant',
    contextTitle: 'Pitch de présentation de l\'offre B2B',
    difficulty: 'intermediaire',
    turnCount: 5,
    performanceScore: 8.5,
    strengths: ['Clarté de la proposition de valeur', 'Chiffrage réaliste du ROI', 'Assurance vocale'],
    improvements: ['Anticiper davantage la question sur les barrières à l\'entrée concurrentielle'],
    idealPhrasingSuggested: 'Notre technologie réduit de 60% le temps de traitement tout en garantissant un séquestre sans risque.',
    date: 'Hier à 16h45'
  },
  {
    id: 'sim-2',
    type: 'sales_nego',
    roleplayPersona: 'Directeur des Achats Grand Compte',
    contextTitle: 'Négociation d\'un contrat-cadre annuel',
    difficulty: 'expert',
    turnCount: 6,
    performanceScore: 9.0,
    strengths: ['Défense ferme de la marge', 'Contre-propositions sur le volume', 'Écoute active des contraintes client'],
    improvements: ['Proposer plus tôt l\'option de paiement trimestriel échelonné'],
    idealPhrasingSuggested: 'Nous pouvons intégrer un bonus d\'engagement si le volume annuel est contractualisé dès aujourd\'hui.',
    date: 'Il y a 3 jours'
  }
];
