import { 
  CareerMasterDossier, 
  CareerJournalEntry, 
  CareerAccomplishmentCelebration, 
  CareerAgentPermissionConfig, 
  CareerAgentActivityLogItem, 
  CareerDailyCommandData, 
  CareerWeeklyBriefingData, 
  CareerMonthlyBilanData, 
  CareerProfessionalImpactData, 
  CareerEmergencySituation, 
  CareerSurpriseOpportunityItem, 
  CareerCoherenceAuditResult, 
  CareerReturnContext 
} from '../types';

// ==========================================
// 🌟 INITIAL DATA: JOURNAL DE CARRIÈRE VIVANT
// ==========================================
export const INITIAL_CAREER_JOURNAL: CareerJournalEntry[] = [
  {
    id: 'j-001',
    timestamp: '12 Janvier 2026',
    type: 'decision',
    title: 'Définition du Point B & Choix de l\'archétype',
    description: 'Validation de l\'objectif : Direction du Développement International & Grands Comptes Émergents sous 18 mois.',
    lessonsLearned: 'Avoir un cap chiffré et contextualisé élimine 80% des sollicitations non alignées.',
    impactScore: 9,
    tags: ['Orientation', 'Point B', 'Stratégie']
  },
  {
    id: 'j-002',
    timestamp: '28 Janvier 2026',
    type: 'formation',
    title: 'Certification Négociation Stratégique & Incoterms 2020 (Campus)',
    description: 'Validation du module avancé avec simulation de closing complexe réussie à 94/100.',
    lessonsLearned: 'La maîtrise juridique des conditions de livraison renforce la crédibilité face aux directeurs des achats.',
    impactScore: 8,
    relatedEntity: 'Campus Mondial Diallo OS',
    tags: ['Campus', 'Compétences', 'Preuve']
  },
  {
    id: 'j-003',
    timestamp: '14 Février 2026',
    type: 'opportunite',
    title: 'Détection par le Radar : Mandat Export Afrique de l\'Ouest',
    description: 'Radar IA a qualifié une mission d\'expansion pour un consortium agro-industriel (Score MOK : 92%).',
    impactScore: 9,
    relatedEntity: 'AgroLogix Pan-Africa',
    tags: ['Radar', 'Opportunité']
  },
  {
    id: 'j-004',
    timestamp: '03 Mars 2026',
    type: 'echec_utile',
    title: 'Entretien exploratoire non concluant chez Sahel Logistics',
    description: 'Poste trop opérationnel / logistique pure, décalé de la composante stratégique recherchée.',
    lessonsLearned: 'Mieux qualifier le niveau de décision hiérarchique dès le premier cadrage pour ne pas diluer son temps.',
    impactScore: 7,
    relatedEntity: 'Sahel Logistics SA',
    tags: ['Enseignement', 'Échec Utile']
  },
  {
    id: 'j-005',
    timestamp: '18 Mars 2026',
    type: 'pivot_strategie',
    title: 'Ajustement de positionnement : Focus Grands Comptes & B2B',
    description: 'Décision collégiale avec le Conseil d\'Experts (Mamadou & Aïssata) de cibler prioritairement les deals > 100k€.',
    lessonsLearned: 'Moins de volume de candidatures, mais un dossier sur-mesure ultra-blindé par opportunité.',
    impactScore: 9,
    tags: ['Pivot', 'Conseil Experts']
  },
  {
    id: 'j-006',
    timestamp: '05 Avril 2026',
    type: 'rencontre',
    title: 'Mise en relation stratégique avec le VP Supply Chain Saliou Kéita',
    description: 'Échange constructif via recommandation MOK. Validation d\'un besoin d\'audit immédiat.',
    lessonsLearned: 'Les opportunités du marché caché se débloquent à 70% par confiance relationnelle préalable.',
    impactScore: 8,
    relatedEntity: 'West Africa Agro Export',
    tags: ['Réseau', 'Alliance']
  },
  {
    id: 'j-007',
    timestamp: '22 Avril 2026',
    type: 'realisation',
    title: 'Signature du premier mandat pilote de Structuration Export',
    description: 'Contrat d\'accompagnement stratégique validé (Budget : 28 500 € + Success Fee sur volume).',
    lessonsLearned: 'Le dossier de conquête personnalisé et la note de cadrage flash ont fait la différence en 48h.',
    impactScore: 10,
    relatedEntity: 'West Africa Agro Export',
    tags: ['Victoire', 'Résultat', 'Accomplissement']
  }
];

// ==========================================
// 🌟 INITIAL DATA: PERMISSIONS DE L'AGENT
// ==========================================
export const INITIAL_AGENT_PERMISSIONS: CareerAgentPermissionConfig = {
  autoAnalyzeOpportunities: true,
  askBeforePrepareDossier: true,
  validateBeforeSendCommunication: true,
  neverSharePrivateDataWithoutConsent: true,
  isAgentPaused: false,
  autonomousMode: 'copilot',
  lastPausedAt: undefined
};

// ==========================================
// 🌟 INITIAL DATA: JOURNAL DES ACTIONS IA
// ==========================================
export const INITIAL_AGENT_LOGS: CareerAgentActivityLogItem[] = [
  {
    id: 'log-01',
    timestamp: 'Aujourd\'hui • 08:20',
    category: 'analyse',
    title: 'Veille Radar & Marché Caché',
    description: '19 nouvelles opportunités sectorielles scannées sur 4 plateformes et 3 bases d\'appels d\'offres.',
    outcomeBadge: '19 analysées',
    isAutomatic: true
  },
  {
    id: 'log-02',
    timestamp: 'Aujourd\'hui • 08:21',
    category: 'filtrage',
    title: 'Qualification MOK & Matching',
    description: '3 opportunités retenues avec score de compatibilité > 85% et alignées sur le Point B.',
    outcomeBadge: '3 qualifiées',
    isAutomatic: true
  },
  {
    id: 'log-03',
    timestamp: 'Aujourd\'hui • 08:35',
    category: 'mise_a_jour_dossier',
    title: 'Actualisation du Jumeau Pro & Dossier Vivant',
    description: 'Intégration de la recommandation certifiée de Saliou Kéita dans les preuves du profil.',
    outcomeBadge: 'Jumeau mis à jour',
    isAutomatic: true
  },
  {
    id: 'log-04',
    timestamp: 'Aujourd\'hui • 09:00',
    category: 'rappel',
    title: 'Préparation entretien stratégique 14h30',
    description: 'Fiche Flash et antisèche de négociation pré-générées pour l\'échange avec le DG d\'OmniLogistics.',
    outcomeBadge: 'Prêt pour 14h30',
    isAutomatic: true
  }
];

// ==========================================
// 🌟 INITIAL DATA: MA JOURNÉE CARRIÈRE
// ==========================================
export const INITIAL_DAILY_COMMAND: CareerDailyCommandData = {
  greeting: 'Bonjour. Voici la feuille de route de votre journée professionnelle.',
  dateStr: 'Jeudi 27 Août 2026',
  nextBestAction: {
    id: 'nba-01',
    title: 'Répéter les 3 objections clés pour l\'entretien OmniLogistics de 14h30',
    whyNow: 'Votre entretien décisionnel est dans quelques heures. Verrouiller la réponse sur le modèle de rémunération variable garantit 90% de chances de closing.',
    urgencyLevel: 'high',
    actionType: 'interview_prep',
    targetTab: 'simulator'
  },
  todayInterviewsCount: 1,
  urgentOpportunitiesCount: 2,
  receivedResponsesCount: 1,
  pendingActionsCount: 3,
  quickChecklist: [
    { id: 'c1', text: 'Vérifier la note de cadrage OmniLogistics', done: true, time: '10:00' },
    { id: 'c2', text: 'Entretien visio avec Mme Sow (DRH Groupe)', done: false, time: '14:30' },
    { id: 'c3', text: 'Relance stratégique courtoise pour le mandat Saliou K.', done: false, time: '16:45' }
  ]
};

// ==========================================
// 🌟 INITIAL DATA: BRIEFING HEBDO & BILAN MENSUEL
// ==========================================
export const INITIAL_WEEKLY_BRIEFING: CareerWeeklyBriefingData = {
  weekRange: 'Semaine 34 (24 - 30 Août 2026)',
  accomplishments: [
    'Validation du dossier de conquête pour le Groupe Horizon',
    '3 nouveaux décideurs qualifiés ajoutés au cercle stratégique',
    'Score Jumeau Pro passé de 71% à 74%'
  ],
  newOpportunitiesDetected: 7,
  dossiersAdvanced: 3,
  responsesReceived: 2,
  skillsReinforced: ['Négociation B2B Grands Comptes', 'Audit de Conformité'],
  stuckDossiersAlerts: ['Dossier AfricTrade en attente de réponse depuis 12 jours (Relance conseillée)'],
  topPriorityForNextWeek: 'Clôturer le contrat cadre OmniLogistics et lancer le module Anglais des Affaires sur Campus.'
};

export const INITIAL_MONTHLY_BILAN: CareerMonthlyBilanData = {
  monthName: 'Août 2026',
  initialPointAMonthAgo: 'Consultant indépendant avec 2 mandats locaux ponctuels et prospection manuelle.',
  currentProgressState: 'Positionnement expert export Afrique de l\'Ouest reconnu, portefeuille qualifié à 95k€, mandat pilote signé.',
  progressPercentage: 74,
  blockersResolved: [
    'Clarification de la proposition de valeur (abandon des petites missions dispersées)',
    'Automatisation de la veille via le Radar IA'
  ],
  newSkillsMastered: [
    'Négociation contractuelle internationale',
    'Pilotage de consortiums d\'affaires'
  ],
  opportunitiesCreatedOrWon: [
    'Mandat West Africa Agro Export (28 500 €)',
    'Piste chaude Direction Commerciale OmniLogistics'
  ],
  nextMonthKeyMilestone: 'Signer le contrat cadre annuel et valider la certification B2B Business English.'
};

// ==========================================
// 🌟 INITIAL DATA: IMPACT PROFESSIONNEL & TRANSMISSION
// ==========================================
export const INITIAL_PROFESSIONAL_IMPACT: CareerProfessionalImpactData = {
  peopleHelpedCount: 14,
  projectsCompletedCount: 6,
  teamsAccompaniedCount: 3,
  knowledgeTransmittedCount: 22,
  reputationCertificationsCount: 4,
  mentorshipLiveSessionsCount: 5,
  tribesActiveContribution: [
    'Tribu Export & Négoce International',
    'Cercle des Dirigeants Commerciaux Afrique'
  ]
};

// ==========================================
// 🌟 INITIAL DATA: SITUATION D'URGENCE CARRIÈRE
// ==========================================
export const INITIAL_EMERGENCY_PRESETS: Record<string, CareerEmergencySituation> = {
  interview_soon: {
    isActive: true,
    emergencyType: 'interview_soon',
    headline: 'Entretien Décisionnel Imminent (Dans moins de 30 min)',
    targetEntity: 'OmniLogistics International',
    minutesRemaining: 28,
    emergencySteps: [
      { id: 'e1', instruction: 'Relire les 3 chiffres clés d\'impact de votre parcours', completed: true },
      { id: 'e2', instruction: 'Ouvrir l\'antisèche de négociation (prétentions & conditions)', completed: false },
      { id: 'e3', instruction: 'Tester votre micro et caméra dans le Coach 3D', completed: false }
    ],
    keyTalkingPoints: [
      '« J\'ai généré +35% de volume export en 8 mois sur un périmètre similaire. »',
      '« Ma méthode repose sur la sécurisation des flux et la réduction des délais douaniers de 40%. »',
      '« Je suis immédiatement opérationnel sur le corridor Dakar-Bamako-Abidjan. »'
    ],
    pitfallsToAvoid: [
      'Ne pas parler de salaire avant d\'avoir fait valider votre compréhension de leurs enjeux.',
      'Ne pas dénigrer vos anciens partenaires.',
      'Éviter le jargon trop technique sans bénéfice financier associé.'
    ]
  },
  dossier_urgent: {
    isActive: true,
    emergencyType: 'dossier_urgent',
    headline: 'Candidature / Offre à remettre avant 18h00',
    targetEntity: 'Banque Ouest-Africaine de Développement',
    minutesRemaining: 180,
    emergencySteps: [
      { id: 'ed1', instruction: 'Générer la lettre de motivation ultra-ciblée via le Quality Gate', completed: false },
      { id: 'ed2', instruction: 'Vérifier la concordance des termes clés avec l\'appel d\'offres', completed: false },
      { id: 'ed3', instruction: 'Exporter le PDF sécurisé certifié Mok Trust', completed: false }
    ],
    keyTalkingPoints: [
      'Alignement parfait avec le cahier des charges article 4.2',
      'Garantie de livraison sous 45 jours'
    ],
    pitfallsToAvoid: ['Oublier les annexes de références certifiées']
  }
};

// ==========================================
// 🌟 INITIAL DATA: OPPORTUNITÉS SURPRISES
// ==========================================
export const INITIAL_SURPRISE_OPPORTUNITIES: CareerSurpriseOpportunityItem[] = [
  {
    id: 'surp-01',
    title: 'Directeur des Alliances Stratégiques Fintech B2B',
    entity: 'PaySahel Tech (Fintech)',
    location: 'Dakar / Hybride ou Remote',
    compensation: '55 000 € - 70 000 € + Stock Options',
    matchScore: 86,
    whyProposed: 'Même si ce poste est en Fintech et non en agro-logistique, vos compétences de négociation grands comptes, de structuration de partenariats institutionnels et d\'Incoterms sont transférables à 95% pour connecter les banques partenaires.',
    transferableSkillsMobilized: ['Négociation Grands Comptes', 'Structuration B2B', 'Gouvernance & Conformité'],
    strategicAdvantage: 'Exposition directe au secteur technologique en hypercroissance tout en valorisant votre carnet d\'adresses institutionnel.'
  },
  {
    id: 'surp-02',
    title: 'Senior Advisor & Mentor Résident en Accélération Export',
    entity: 'Hub Innovation Afrique & Francophonie',
    location: 'Abidjan / Missions ponctuelles',
    compensation: '850 € / jour (Mandat de 20 jours)',
    matchScore: 89,
    whyProposed: 'Opportunité idéale pour valoriser votre posture de mentor/transmission tout en bâtissant un réseau de niveau ministériel et fonds d\'investissement.',
    transferableSkillsMobilized: ['Transmission & Pédagogie', 'Audit Stratégique', 'Leadership d\'Influence'],
    strategicAdvantage: 'Renforce immédiatement votre réputation de référence sectorielle pour votre prochain Point B.'
  }
];

// ==========================================
// 🌟 INITIAL DATA: TEST DE COHÉRENCE DU PARCOURS
// ==========================================
export const INITIAL_COHERENCE_AUDIT: CareerCoherenceAuditResult = {
  isCoherent: true,
  coherenceScore: 92,
  initialGoalReminder: 'Direction du Développement International & Grands Comptes Émergents',
  recentActionsAlignment: 'parfait',
  diagnosisDetail: 'Toutes les actions récentes (certifications Campus, mandats ciblés, relations activées) concourent directement à l\'atteinte du Point B. Aucun signe de dispersion vers des missions secondaires.',
  suggestedAction: 'continuer'
};

// ==========================================
// 🌟 INITIAL DATA: MODE REPRISE (BON RETOUR)
// ==========================================
export const INITIAL_RETURN_CONTEXT: CareerReturnContext = {
  isReturningUser: true,
  lastActiveDate: 'Il y a 3 jours',
  daysSinceLastVisit: 3,
  lastActiveGoalTitle: 'Direction du Développement International & Grands Comptes',
  lastRecordedAction: 'Validation de l\'antisèche d\'entretien pour OmniLogistics',
  activeDossiersStillRelevant: 3,
  obsoleteElementsCount: 0,
  freshOpportunitiesCount: 4,
  recommendedResumeStep: 'Consulter l\'antisèche d\'entretien pour votre rendez-vous de 14h30.'
};

// ==========================================
// 🌟 INITIAL DATA: CÉLÉBRATION D'ACCOMPLISSEMENT
// ==========================================
export const INITIAL_CELEBRATION_DATA: CareerAccomplishmentCelebration = {
  goalId: 'goal-001',
  initialGoalTitle: 'Passer de Consultant Local à Directeur Commercial International',
  achievedResultTitle: 'Nommé Directeur du Développement Export chez OmniLogistics International',
  achievedDate: '27 Août 2026',
  totalDurationWeeks: 24,
  milestonesPassedCount: 5,
  skillsAcquired: [
    'Négociation B2B Grands Comptes (> 250k€)',
    'Gestion de consortiums d\'exportation',
    'Conformité douanière & Incoterms 2020',
    'Leadership d\'équipes multiculturelles'
  ],
  difficultiesOvercome: [
    'Refus initial de Sahel Logistics transformé en opportunité de recadrage',
    'Négociation salariale rehaussée de +28% grâce aux preuves auditées Mok Trust',
    'Passage d\'une posture d\'exécutant à une posture de partenaire stratégique'
  ],
  relationshipsCreatedCount: 18,
  keyDeliverables: [
    'Mandat d\'accompagnement export 28 500 €',
    'Contrat cadre annuel signé 68 000 € fixe + bonus',
    'Jumeau Professionnel certifié niveau 5'
  ],
  twinGainsSummary: 'Votre Jumeau Professionnel gagne +3 certifications officielles, un indice de réputation de 94/100 et un capital relationnel de 18 décideurs vérifiés.',
  nextSuggestedAmbitions: [
    {
      id: 'next-1',
      type: '90_first_days',
      title: 'Réussir mes 90 premiers jours à la Direction Export',
      description: 'Cartographier les parties prenantes internes, sécuriser une première victoire rapide (Quick Win à J+30) et asseoir votre autorité.',
      recommendedPace: 'Intensif & Structuré'
    },
    {
      id: 'next-2',
      type: 'promotion',
      title: 'Préparer la montée au Comité de Direction (VP International)',
      description: 'Identifier les indicateurs de rentabilité globale et bâtir l\'alliance avec le Directeur Général sous 18 mois.',
      recommendedPace: 'Stratégique & Rythmé'
    },
    {
      id: 'next-3',
      type: 'entrepreneurship',
      title: 'Créer ma propre société de négoce international & courtage',
      description: 'Capitaliser sur vos relations et mandats pour lancer votre structure indépendante en parallèle ou à terme.',
      recommendedPace: 'Progressif & Sécurisé'
    },
    {
      id: 'next-4',
      type: 'international',
      title: 'Expatriation & Direction de Hub Régional (Dubaï / Singapour / Paris)',
      description: 'Mobiliser les modules Logement, Juridique et Langues pour une mobilité mondiale d\'envergure.',
      recommendedPace: 'Horizon 12-24 mois'
    },
    {
      id: 'next-5',
      type: 'mentorship_transmission',
      title: 'Transmettre : Devenir Mentor & Former la nouvelle génération',
      description: 'Animer des Tribus sur Le Monde à Vous, mentorer 2 jeunes cadres prometteurs et publier des cas pratiques.',
      recommendedPace: 'Continu & Valorisé'
    }
  ]
};

// ==========================================
// 🌟 MASTER DOSSIER INITIAL COMPLET
// ==========================================
export const INITIAL_MASTER_DOSSIER: CareerMasterDossier = {
  dossierId: 'dossier-master-diallo-001',
  userId: 'user-001',
  currentStatus: 'in_progress',
  goalId: 'goal-001',
  goalTitle: 'Direction du Développement International & Grands Comptes Émergents',
  targetArchetypeId: 'dir_comm',
  pointASummary: 'Cadre commercial confirmé avec 6 ans d\'expérience, forte maîtrise terrain Afrique de l\'Ouest, souhaitant franchir un cap stratégique.',
  pointBSummary: 'Directeur du Développement International pilotant un portefeuille > 1.5 M€, bilingue professionnel, reconnu pour sa capacité de closing.',
  overallProgressPercentage: 74,
  activePace: 'accelere',
  permissions: INITIAL_AGENT_PERMISSIONS,
  activityLogs: INITIAL_AGENT_LOGS,
  journalEntries: INITIAL_CAREER_JOURNAL,
  dailyCommand: INITIAL_DAILY_COMMAND,
  weeklyBriefing: INITIAL_WEEKLY_BRIEFING,
  monthlyBilan: INITIAL_MONTHLY_BILAN,
  impactData: INITIAL_PROFESSIONAL_IMPACT,
  emergencySituation: INITIAL_EMERGENCY_PRESETS.interview_soon,
  surpriseOpportunities: INITIAL_SURPRISE_OPPORTUNITIES,
  coherenceAudit: INITIAL_COHERENCE_AUDIT,
  returnContext: INITIAL_RETURN_CONTEXT,
  lastCelebration: undefined
};

// ==========================================
// 🌟 HELPER FUNCTIONS: NARRATIVE ENGINE
// ==========================================

/**
 * Génère le récit continu et fluide du parcours de l'utilisateur ("Raconte-moi mon parcours")
 */
export function generateCareerNarrative(
  userName: string,
  journal: CareerJournalEntry[],
  pointA: string,
  pointB: string,
  status: string
): string {
  const decisions = journal.filter(j => j.type === 'decision' || j.type === 'pivot_strategie');
  const trainings = journal.filter(j => j.type === 'formation' || j.type === 'competence');
  const victories = journal.filter(j => j.type === 'realisation' || j.type === 'resultat');
  const learnings = journal.filter(j => j.type === 'echec_utile');

  return `### 📖 Le Récit de Votre Parcours — ${userName}

**1. Le Point de Départ & La Vision**
Vous avez démarré avec une situation clairement identifiée : *${pointA}*. Votre ambition a été formalisée autour d'un Point B ambitieux mais réaliste : **${pointB}**.

**2. Les Décisions & Pivots Stratégiques**
${decisions.map(d => `• **${d.timestamp}** : ${d.title}. *Enseignement : ${d.lessonsLearned || d.description}*`).join('\n')}

**3. Le Développement des Compétences Réelles**
Vous n'êtes pas resté dans la théorie. Vous avez forgé votre valeur à travers des preuves concrètes :
${trainings.map(t => `• ${t.title} (${t.timestamp}) — ${t.description}`).join('\n')}

**4. Les Épreuves et Enseignements Clés**
${learnings.length > 0 ? learnings.map(l => `• **${l.title}** : ${l.description} ➔ *Ce que nous en avons tiré : ${l.lessonsLearned}*`).join('\n') : '• Aucune rupture majeure : trajectoire maîtrisée.'}

**5. Les Victoires & Résultats Concrets**
${victories.map(v => `• 🏆 **${v.title}** (${v.timestamp}) : ${v.description}`).join('\n')}

**6. Aujourd'hui & Prochaine Étape**
Votre capital professionnel est désormais consolidé à **74% d'avancement**. Vous êtes en position de force pour concrétiser votre opportunité majeure ou définir votre prochaine ambition d'envergure.`;
}

/**
 * Universal Command : "Que dois-je faire maintenant pour avancer ?"
 */
export function askUniversalNextAction(dossier: CareerMasterDossier): {
  headline: string;
  topActions: {
    priority: number;
    title: string;
    reasonWhyNow: string;
    expectedGain: string;
    tabTarget: string;
    badge: string;
  }[];
} {
  return {
    headline: 'Voici les 3 actions prioritaires pour maximiser votre élan aujourd\'hui :',
    topActions: [
      {
        priority: 1,
        title: 'Préparer et verrouiller votre entretien OmniLogistics (14h30)',
        reasonWhyNow: 'C\'est l\'opportunité décisionnelle la plus avancée. 30 minutes de simulation dans le Coach 3D sécurisent vos réponses.',
        expectedGain: '+40% de confiance et closing du mandat sous 7 jours',
        tabTarget: 'simulator',
        badge: 'Urgent & Décisif'
      },
      {
        priority: 2,
        title: 'Envoyer la relance stratégique à Saliou Kéita',
        reasonWhyNow: 'Cela fait 5 jours que le devis pilote a été transmis. Le moment est idéal pour réaffirmer votre disponibilité.',
        expectedGain: 'Déblocage de l\'acompte de démarrage (8 500 €)',
        tabTarget: 'pipeline',
        badge: 'Capital Relationnel'
      },
      {
        priority: 3,
        title: 'Combler la compétence "Business English B2B" sur Campus',
        reasonWhyNow: '2 nouvelles opportunités multinationales qualifiées par le Radar exigent un niveau d\'anglais professionnel validé.',
        expectedGain: 'Accès au marché rémunéré en devises (+30% de revenus)',
        tabTarget: 'campus',
        badge: 'Compétence Clé'
      }
    ]
  };
}
