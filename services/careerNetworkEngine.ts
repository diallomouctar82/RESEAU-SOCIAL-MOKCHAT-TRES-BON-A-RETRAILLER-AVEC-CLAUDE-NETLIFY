import { 
  RelationalNode, 
  IdealCustomerProfile, 
  CommercialBusinessSignal, 
  OpportunityCollaborativeTeam, 
  MentorshipConnection,
  RelationalEcosystemSummary
} from '../types';

export const INITIAL_IDEAL_CUSTOMER_PROFILE: IdealCustomerProfile = {
  targetSector: 'Transformation Digitale, Agro-Industrie & Import-Export',
  targetCompanySize: 'PME & ETI (10 à 250 collaborateurs)',
  targetLocation: 'Afrique de l\'Ouest (Guinée, Sénégal, Côte d\'Ivoire) & Europe',
  budgetRange: '5 000 $ - 45 000 $ par mission',
  corePainPoints: [
    'Absence d\'architecture technologique robuste pour piloter les flux logistiques',
    'Difficulté à structurer des dossiers d\'exportation conformes aux normes UE/Internationales',
    'Perte de temps dans le suivi manuel des prospects et des approvisionnements'
  ],
  triggerCommercialSignals: [
    'Entreprise ouvrant une nouvelle filiale régionale',
    'Recrutement massif de commerciaux ou directeurs d\'exploitation',
    'Attribution récente d\'un marché public ou d\'une levée de fonds'
  ],
  valueProposition: 'J\'accompagne les dirigeants de PME et d\'organisations à automatiser leurs opérations stratégiques et sécuriser leurs marchés internationaux grâce à des solutions clé en main et éprouvées.',
  successStoriesProofs: [
    'Déploiement d\'un ERP agricole pour une coopérative de 450 producteurs (Guinée)',
    'Structuration de 1.2M$ de contrats d\'approvisionnement sécurisés via Mok Trust',
    'Certification officielle Lead Architect & Gestionnaire de Projets Internationaux'
  ]
};

export const INITIAL_RELATIONAL_NODES: RelationalNode[] = [
  {
    id: 'rel-1',
    name: 'Dr. Ousmane Bah',
    role: 'Directeur des Opérations & Supply Chain',
    organization: 'Sahel Agro-Logistics Group',
    category: 'clients',
    stage: 'echange_en_cours',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    location: 'Dakar, Sénégal',
    relevanceScore: 94,
    whyWeShouldTalk: 'Leur groupe étend actuellement son corridor de fret vers la Guinée et recherche un expert capable d\'auditer et d\'automatiser le traçage des cargaisons.',
    bidirectionalValue: {
      whatTheyCanBring: [
        'Contrat cadre d\'accompagnement sur 12 mois',
        'Accès direct aux directeurs de plateformes logistiques portuaires'
      ],
      whatYouCanBring: [
        'Expertise d\'intégration ERP & systèmes de traçabilité temps réel',
        'Maîtrise des standards douaniers CEDEAO et de la conformité Mok Trust'
      ],
      commonInterests: [
        'Corridors de transport transfrontaliers',
        'Numérisation des connaissements maritimes'
      ]
    },
    facilitatorContactId: 'rel-4',
    facilitatorName: 'Fatoumata Camara',
    email: 'ousmane.bah@sahel-agro.com',
    phone: '+221 77 456 89 20',
    lastInteractionDate: 'Il y a 3 jours',
    nextActionDueDate: 'Demain (J+4)',
    nextBestAction: 'Envoyer la note méthodologique synthétique (3 pages) avec cas d\'usage similaires.',
    notes: [
      'Entretien très constructif lors du webinaire logistique.',
      'A insisté sur la nécessité d\'une compatibilité mobile pour les agents de terrain.'
    ],
    documentsExchanged: [
      { id: 'doc-1', name: 'Synthese_Besoins_Sahel_Agro.pdf', date: '24 Août 2026', type: 'PDF' }
    ],
    agreedCommitments: [
      { id: 'com-1', text: 'Transmettre la proposition tarifaire ajustée avant vendredi 18h', byWhom: 'user', deadline: '28 Août 2026', completed: false },
      { id: 'com-2', text: 'Valider le périmètre avec le Directeur Financier', byWhom: 'contact', deadline: '30 Août 2026', completed: false }
    ],
    mocSynergies: {
      tribesSuggested: [
        { id: 'tr-1', name: 'Logistique & Fret Ouest-Africain', membersCount: 1420, reason: 'Discussions actives sur les liaisons Dakar-Conakry-Abidjan' }
      ],
      relevantLives: [
        { id: 'live-1', title: 'Dématérialisation douanière en zone UEMOA', host: 'Douanes & Commerce Hub', date: 'Demain 15h00', topic: 'Logistique' }
      ],
      reelsPortfolioIdea: 'Micro-démo : 3 minutes pour auditer un goulot d\'étranglement en entrepôt.'
    },
    isDirect: true,
    antiSpamScore: 100,
    canSendFollowUpToday: true
  },
  {
    id: 'rel-2',
    name: 'Sophie Laurent',
    role: 'Managing Partner - Impact Venture Africa',
    organization: 'Impact Growth Capital Europe',
    category: 'investisseurs',
    stage: 'rendez_vous',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    location: 'Paris & Abidjan',
    relevanceScore: 91,
    whyWeShouldTalk: 'Leur fonds clôture un ticket d\'amorçage de 150k€ - 500k€ pour des initiatives technologiques structurantes en Afrique subsaharienne.',
    bidirectionalValue: {
      whatTheyCanBring: [
        'Financement d\'amorçage et accès à un réseau de 40+ mentors européens',
        'Co-investissement avec les banques de développement'
      ],
      whatYouCanBring: [
        'Modèle économique prouvé sur le terrain avec métriques d\'exécution réelles',
        'Excellente ancrage local et maîtrise des leviers opérationnels'
      ],
      commonInterests: [
        'Financement durable et décarbonation des filières agricoles',
        'Gouvernance transparente certifiée Mok Trust'
      ]
    },
    email: 'sophie.laurent@impactventure.eu',
    lastInteractionDate: 'Il y a 6 jours',
    nextActionDueDate: '29 Août 2026 (14h30)',
    nextBestAction: 'Préparer la fiche flash 5 arguments et le prévisionnel financier 2026-2028.',
    notes: [
      'Pitch initial validé par l\'analyste senior.',
      'Point d\'attention : bien clarifier le coût d\'acquisition client.'
    ],
    documentsExchanged: [
      { id: 'doc-2', name: 'Executive_Pitch_Deck_LMAV.pdf', date: '21 Août 2026', type: 'PDF' }
    ],
    isDirect: true,
    antiSpamScore: 90,
    canSendFollowUpToday: false
  },
  {
    id: 'rel-3',
    name: 'Ibrahim Diallo',
    role: 'Directeur Général & Fondateur',
    organization: 'Kankan Agro-Tech Innovations',
    category: 'partenaires',
    stage: 'opportunite_ouverte',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    location: 'Conakry & Kankan',
    relevanceScore: 89,
    whyWeShouldTalk: 'Possède un réseau de 12 centres de collecte en Haute-Guinée et recherche un partenaire technique pour intégrer la commande en ligne et le paiement mobile.',
    bidirectionalValue: {
      whatTheyCanBring: [
        'Capacité de sourcing direct de 50 tonnes de miel et fruits séchés / mois',
        'Entrepôts équipés et flotte logistique régionale'
      ],
      whatYouCanBring: [
        'Plateforme e-commerce & traçabilité connectée',
        'Ouverture sur les marchés d\'exportation européens et diasporas'
      ],
      commonInterests: [
        'Commerce équitable et valorisation du terroir guinéen',
        'Paiements instantanés via Wallet LMAV'
      ]
    },
    phone: '+224 622 11 44 77',
    lastInteractionDate: 'Hier',
    nextActionDueDate: '31 Août 2026',
    nextBestAction: 'Coconstruire le protocole d\'accord de partenariat (MOU) et la répartition des rôles.',
    notes: [
      'Prêt à co-investir sur les serveurs locaux et le matériel d\'étiquetage.'
    ],
    isDirect: true,
    antiSpamScore: 100,
    canSendFollowUpToday: true
  },
  {
    id: 'rel-4',
    name: 'Fatoumata Camara',
    role: 'Secrétaire Générale & Facilitatrice de Réseau',
    organization: 'Chambre de Commerce & d\'Industrie',
    category: 'facilitateurs',
    stage: 'relation_a_entretenir',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    location: 'Conakry, Guinée',
    relevanceScore: 96,
    whyWeShouldTalk: 'Connectrice clé auprès des ministères, ambassades et délégations commerciales internationales.',
    bidirectionalValue: {
      whatTheyCanBring: [
        'Introductions chaleureuses auprès des grands comptes industriels',
        'Invitations exclusives aux tables rondes et délégations B2B'
      ],
      whatYouCanBring: [
        'Rapports d\'intelligence économique et veille technologique de premier ordre',
        'Interventions expertes lors des ateliers de formation pour les jeunes entrepreneurs'
      ],
      commonInterests: [
        'Rayonnement de l\'entrepreneuriat ouest-africain',
        'Formation continue certifiante'
      ]
    },
    email: 'fatoumata.camara@cci-guinee.org',
    lastInteractionDate: 'Il y a 10 jours',
    nextActionDueDate: 'Aujourd\'hui',
    nextBestAction: 'Lui envoyer un mot de remerciement pour la mise en relation avec Dr. Bah et partager une brève actualité utile.',
    notes: [
      'Très sensible aux démarches soignées, respectueuses et régulières.'
    ],
    isDirect: true,
    antiSpamScore: 100,
    canSendFollowUpToday: true
  },
  {
    id: 'rel-5',
    name: 'Marc Lefebvre',
    role: 'Directeur des Achats & Grands Comptes',
    organization: 'BioDistribute France & Benelux',
    category: 'prospects',
    stage: 'introduction',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    location: 'Lyon & Bruxelles',
    relevanceScore: 88,
    whyWeShouldTalk: 'Recherche activement des filières durables de miel certifié et de karité d\'Afrique de l\'Ouest pour son réseau de 180 magasins bio.',
    bidirectionalValue: {
      whatTheyCanBring: [
        'Commandes récurrentes de volumes certifiés avec paiement garanti à 30 jours',
        'Aide à l\'homologation Bio Europe / Ecocert'
      ],
      whatYouCanBring: [
        'Qualité garantie, traçabilité de la ruche au conditionnement',
        'Respect strict des quotas d\'humidité et d\'analyses de laboratoire'
      ],
      commonInterests: [
        'Filières éthiques sans intermédiaires abusifs',
        'Normes européennes d\'importation alimentaire'
      ]
    },
    facilitatorContactId: 'rel-4',
    facilitatorName: 'Fatoumata Camara',
    lastInteractionDate: 'Non contacté directement',
    nextActionDueDate: 'Cette semaine',
    nextBestAction: 'Demander à Fatoumata Camara une introduction courtoise en lui fournissant un pitch clé en main de 3 lignes.',
    notes: [
      'Identifié via le signal d\'affaires de recherche de fournisseurs bio.'
    ],
    isDirect: false,
    antiSpamScore: 100,
    canSendFollowUpToday: true
  },
  {
    id: 'rel-6',
    name: 'Prof. Amadou Sow',
    role: 'Expert Émérite en Commerce International & Négociation',
    organization: 'Institut Supérieur du Commerce & Académie MOK',
    category: 'mentors',
    stage: 'relation_a_entretenir',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    location: 'Paris & Dakar',
    relevanceScore: 98,
    whyWeShouldTalk: '30 ans d\'expérience dans les arbitrages commerciaux internationaux et la négociation d\'accords bilatéraux.',
    bidirectionalValue: {
      whatTheyCanBring: [
        'Conseils stratégiques de haut niveau sur les contrats complexes',
        'Revue critique bienveillante de vos dossiers d\'appels d\'offres'
      ],
      whatYouCanBring: [
        'Retours d\'expérience terrain et maîtrise des nouveaux outils IA',
        'Assistance pour la numérisation de ses supports de cours pour le Campus LMAV'
      ],
      commonInterests: [
        'Transmission intergénérationnelle du savoir commercial',
        'Éthique et excellence professionnelle'
      ]
    },
    email: 'amadou.sow@mok-academy.org',
    lastInteractionDate: 'Il y a 14 jours',
    nextActionDueDate: 'Dans 5 jours',
    nextBestAction: 'Programmer une session de mentorat de 30 min pour débriefer de la négociation Sahel Agro.',
    notes: [
      'A validé le profil de Jumeau Numérique avec mention d\'honneur.'
    ],
    isDirect: true,
    antiSpamScore: 100,
    canSendFollowUpToday: true
  }
];

export const INITIAL_COMMERCIAL_SIGNALS: CommercialBusinessSignal[] = [
  {
    id: 'sig-1',
    companyName: 'Sahel Agro-Logistics Group',
    companyLogoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=150&auto=format&fit=crop&q=80',
    signalType: 'croissance',
    headline: 'Extension du corridor logistique Sénégal-Guinée & digitalisation des entrepôts',
    detectedDate: '25 Août 2026',
    source: 'Communiqué Officiel & Veille Marché Mondial LMAV',
    confidenceScore: 96,
    potentialOpportunity: 'Marché d\'intégration de systèmes de gestion de flotte et d\'audit logistique.',
    suggestedApproachAngle: 'Mettre en avant votre certification d\'architecte de flux et votre présence sur l\'axe Conakry-Dakar.',
    matchedContact: {
      name: 'Dr. Ousmane Bah',
      role: 'Directeur des Opérations',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'sig-2',
    companyName: 'BioDistribute France & Benelux',
    companyLogoUrl: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80',
    signalType: 'recherche_prestataire',
    headline: 'Lancement d\'un appel à partenariats pour des filières de miel bio et de karité éthique',
    detectedDate: '23 Août 2026',
    source: 'Portail Marchés Européens & Veille Sectorielle',
    confidenceScore: 92,
    potentialOpportunity: 'Contrat d\'approvisionnement pluri-annuel sur 30 à 60 tonnes / an.',
    suggestedApproachAngle: 'Valoriser les analyses de conformité laboratoire et la traçabilité garantie Mok Trust.',
    matchedContact: {
      name: 'Marc Lefebvre',
      role: 'Directeur Achats',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    }
  },
  {
    id: 'sig-3',
    companyName: 'Consortium Énergie & Mines Fouta',
    companyLogoUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=150&auto=format&fit=crop&q=80',
    signalType: 'appel_offres',
    headline: 'Appel d\'offres pour la fourniture et l\'installation d\'un réseau IoT de surveillance environnementale',
    detectedDate: '26 Août 2026',
    source: 'Journal Officiel des Marchés Publics',
    confidenceScore: 89,
    potentialOpportunity: 'Marché d\'ingénierie et de supervision de 85 000 $ ouvert aux consortiums pluridisciplinaires.',
    suggestedApproachAngle: 'Constituer une équipe d\'opportunité combinant ingénieur IoT, juriste marchés et chef de projet.'
  }
];

export const INITIAL_COLLABORATIVE_TEAMS: OpportunityCollaborativeTeam[] = [
  {
    id: 'team-1',
    title: 'Consortium Réponse Appel d\'Offres IoT Environnement',
    targetOpportunityTitle: 'Surveillance & Capteurs Écologiques Miniers (Boké / Fouta)',
    targetOpportunityBudget: '85 000 $',
    status: 'constitution',
    requiredRoles: [
      {
        id: 'role-1',
        roleTitle: 'Chef de Projet & Coordinateur Opérationnel',
        skillsNeeded: ['Gestion de Projet', 'Conformité Mok Trust', 'Pilotage Budgétaire'],
        assignedMember: {
          id: 'user-me',
          name: 'Vous (Porteur du Dossier)',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          expertise: 'Architecture de Systèmes & Pilotage',
          reputationScore: 95,
          hasConsented: true
        }
      },
      {
        id: 'role-2',
        roleTitle: 'Ingénieur Télécoms & Capteurs IoT Terrain',
        skillsNeeded: ['Réseaux LoRaWAN', 'Capteurs environnementaux', 'Énergie Solaire'],
        assignedMember: {
          id: 'mem-2',
          name: 'Mamadou Diaby',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
          expertise: 'Ingénierie IoT & Systèmes Embarqués',
          reputationScore: 92,
          hasConsented: true
        }
      },
      {
        id: 'role-3',
        roleTitle: 'Juriste Spécialiste Droit Minier & Marchés Publics',
        skillsNeeded: ['Droit des Marchés Publics', 'Normes RSE / ESG', 'Contrats de Consortium'],
        assignedMember: {
          id: 'mem-3',
          name: 'Me. Aïssatou Diallo',
          avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=150&auto=format&fit=crop&q=80',
          expertise: 'Droit des Affaires & Contentieux',
          reputationScore: 97,
          hasConsented: true
        }
      }
    ],
    sharedTasks: [
      { id: 'task-1', title: 'Rédiger l\'accord de consortium préalable (MOU)', assigneeName: 'Me. Aïssatou Diallo', isDone: true, deadline: '26 Août 2026' },
      { id: 'task-2', title: 'Dimensionner l\'architecture technique et la liste des capteurs', assigneeName: 'Mamadou Diaby', isDone: false, deadline: '29 Août 2026' },
      { id: 'task-3', title: 'Consolider le bordereau des prix unitaires et le planning d\'exécution', assigneeName: 'Vous', isDone: false, deadline: '31 Août 2026' }
    ],
    sharedDocuments: [
      { id: 'sdoc-1', name: 'Cahier_Des_Charges_AO_Mines.pdf', uploadedBy: 'Vous', date: '25 Août 2026' },
      { id: 'sdoc-2', name: 'Projet_Accord_Consortium_V1.pdf', uploadedBy: 'Me. Aïssatou Diallo', date: '26 Août 2026' }
    ]
  }
];

export const INITIAL_MENTORSHIPS: MentorshipConnection[] = [
  {
    id: 'ment-1',
    mode: 'seeking_mentor',
    mentorOrMentee: {
      id: 'mentor-1',
      name: 'Prof. Amadou Sow',
      title: 'Expert en Négociations Stratégiques Internationales',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      domain: 'Commerce International & Arbitrage',
      yearsExperience: 32,
      reputationByCompetency: [
        { competency: 'Négociation B2B Grands Comptes', score: 99, proofCount: 45 },
        { competency: 'Droit Commercial Transfrontalier', score: 96, proofCount: 38 },
        { competency: 'Gouvernance & Éthique des Affaires', score: 98, proofCount: 52 }
      ]
    },
    status: 'actif',
    objectives: [
      'Sécuriser les clauses de révision tarifaire des contrats pluri-annuels',
      'Affiner la posture lors des oraux devant les comités d\'investissement'
    ],
    nextSessionDate: '3 Septembre 2026 (17h00)',
    voluntaryConsentBothSides: true
  },
  {
    id: 'ment-2',
    mode: 'becoming_mentor',
    mentorOrMentee: {
      id: 'mentee-1',
      name: 'Binta Condé',
      title: 'Jeune Fondatrice - Miel Pur de Dabola',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      domain: 'Agri-business & Export Débutant',
      yearsExperience: 2,
      reputationByCompetency: [
        { competency: 'Production Apicole Qualité', score: 90, proofCount: 12 },
        { competency: 'Motivation & Rigueur Terrain', score: 94, proofCount: 8 }
      ]
    },
    status: 'actif',
    objectives: [
      'Structurer son premier catalogue produit numérique sur Le Monde à Vous',
      'Apprendre à rédiger un devis conforme aux normes d\'importation'
    ],
    nextSessionDate: '5 Septembre 2026 (10h00)',
    voluntaryConsentBothSides: true
  }
];

export function calculateRelationalSummary(
  nodes: RelationalNode[],
  icp: IdealCustomerProfile = INITIAL_IDEAL_CUSTOMER_PROFILE,
  teams: OpportunityCollaborativeTeam[] = INITIAL_COLLABORATIVE_TEAMS,
  mentorships: MentorshipConnection[] = INITIAL_MENTORSHIPS
): RelationalEcosystemSummary {
  const highImpact = nodes.filter(n => n.relevanceScore >= 90).length;
  const activeDeals = nodes.filter(n => ['echange_en_cours', 'rendez_vous', 'opportunite_ouverte', 'negociation'].includes(n.stage)).length;
  const pendingIntros = nodes.filter(n => n.stage === 'introduction').length;
  const dueToday = nodes.filter(n => n.canSendFollowUpToday && (n.nextActionDueDate?.includes('Aujourd\'hui') || n.nextActionDueDate?.includes('Demain'))).length;

  return {
    activeGoalHeadline: 'Développement d\'Affaires, Partenariats & Missions d\'Exportation Stratégiques',
    totalContacts: nodes.length,
    highImpactContactsCount: highImpact,
    activeDealsCount: activeDeals,
    pendingIntroductionsCount: pendingIntros,
    followUpsDueTodayCount: dueToday,
    idealCustomerProfile: icp,
    partnerSearches: [
      { id: 'ps-1', roleNeeded: 'Distributeurs Agro-Alimentaires Bio', sector: 'Distribution Europe & CEDEAO', status: 'En cours (3 pistes)', matchesCount: 3 },
      { id: 'ps-2', roleNeeded: 'Partenaire Technique IoT & Énergie Solaire', sector: 'Ingénierie & Télécoms', status: 'Consortium formé', matchesCount: 2 }
    ],
    fundingPipeline: [
      { id: 'fp-1', funderName: 'Impact Growth Capital Europe', stage: 'Rendez-vous fixé (29 Août)', targetAmount: '150 000 $', nextStep: 'Pitch Deck & Fiche 5 Arguments' },
      { id: 'fp-2', funderName: 'Fonds d\'Appui aux Filières Vertes UEMOA', stage: 'Dossier déposé', targetAmount: '45 000 $', nextStep: 'Comité d\'évaluation le 10 Septembre' }
    ],
    collaborativeTeams: teams,
    mentorships: mentorships
  };
}

export function generateWhoShouldIKnowSuggestions(goal: string) {
  return [
    {
      category: 'Distributeurs & Acheteurs Grands Comptes',
      iconName: 'Building2',
      importance: 'Critique',
      whyNeeded: 'Pour transformer votre capacité de production en flux de revenus récurrents et prévisibles.',
      profilesFoundInNetwork: [
        { name: 'Marc Lefebvre (BioDistribute)', match: 92, via: 'Fatoumata Camara (CCI)' },
        { name: 'Consortium Retail Ouest-Africain', match: 87, via: 'Marché Mondial B2B' }
      ]
    },
    {
      category: 'Facilitateurs Institutionnels & Réseau',
      iconName: 'Users',
      importance: 'Haute',
      whyNeeded: 'Pour obtenir des introductions directes sans passer par des filtres impersonnels ou du démarchage à froid.',
      profilesFoundInNetwork: [
        { name: 'Fatoumata Camara (Secrétaire Générale CCI)', match: 96, via: 'Contact Direct' }
      ]
    },
    {
      category: 'Partenaires Techniques Complémentaires',
      iconName: 'Briefcase',
      importance: 'Haute',
      whyNeeded: 'Pour répondre ensemble à des appels d\'offres d\'envergure nécessitant des expertises combinées.',
      profilesFoundInNetwork: [
        { name: 'Mamadou Diaby (Ingénieur IoT)', match: 94, via: 'Tribu Tech & Agro' },
        { name: 'Me. Aïssatou Diallo (Juriste d\'Affaires)', match: 97, via: 'Conseil des Experts' }
      ]
    },
    {
      category: 'Mentors Émérites & Garants de Réputation',
      iconName: 'Award',
      importance: 'Stratégique',
      whyNeeded: 'Pour challenger vos décisions, vous ouvrir des portes de haut niveau et sécuriser votre gouvernance.',
      profilesFoundInNetwork: [
        { name: 'Prof. Amadou Sow (Académie MOK)', match: 98, via: 'Programme Mentorat LMAV' }
      ]
    }
  ];
}
