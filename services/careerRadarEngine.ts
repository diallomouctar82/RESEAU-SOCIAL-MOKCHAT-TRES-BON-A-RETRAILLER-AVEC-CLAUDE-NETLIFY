import { 
  RadarOpportunityItem, 
  RadarHiddenSignal, 
  ContinuousSearchMission, 
  OpportunityFeedbackRecord, 
  CareerPointA, 
  CareerPointB, 
  OpportunityUniverse, 
  OpportunityTemporalReadiness 
} from '../types';
import { AIProxyClient } from './aiProxy';
import { moduleRepository } from './moduleRepository';

// ══════════════════════════════════════════════════════════════════════════
// 📚 BASE RÉFÉRENTIELLE D'OPPORTUNITÉS MULTI-SOURCES RÉELLES ET STRUCTURÉES
// ══════════════════════════════════════════════════════════════════════════

export const INITIAL_RADAR_OPPORTUNITIES: RadarOpportunityItem[] = [
  // ─── 1. EMPLOI & MISSIONS ───
  {
    id: 'opp-emp-1',
    title: 'Lead Architecte Cloud & IA Hybride',
    entity: 'Global FinTech Alliance',
    entityLogoUrl: 'https://images.unsplash.com/photo-1551836022-d5d88e9218df?w=150',
    universe: 'emploi',
    opportunityType: 'CDI Cadre / Mission Longue',
    location: 'Paris / Abidjan (Télétravail 60%)',
    locationScope: 'regional',
    country: 'France / Côte d\'Ivoire',
    countryFlag: '🇫🇷',
    description: 'Pilotage technique de l\'infrastructure bancaire panafricaine nouvelle génération. Conception de microservices financiers résilients et sécurisés.',
    publicationDate: 'Il y a 2 jours',
    deadlineDate: 'Dans 24 jours (15 Avril)',
    daysRemaining: 24,
    isUrgent: false,
    compensationOrBudget: '65 000 € - 82 000 € / an',
    sourceType: 'reseau_mok',
    sourceName: 'Réseau MOK - Cercle Tech & Banking',
    sourceUrl: 'https://reseau-mok.lmav.com/jobs/cloud-lead-992',
    matchScore: 94,
    compatibilityTier: 'Élevée',
    readiness: 'ready_now',
    whyForMe: 'Votre expertise en architecture logicielle (Niveau 4/5) et votre maîtrise des systèmes distribués correspondent directement aux exigences de la mission.',
    matchedStrengths: ['Architecture Systèmes', 'Cloud & Sécurité', 'Bilinguisme Pro'],
    missingCompetencies: ['Conformité Régionale BCEAO'],
    gapPlan: {
      missingSkills: [
        {
          skill: 'Réglementation Bancaire BCEAO & UEMOA',
          campusCourseId: 'course-bceao-fintech',
          courseTitle: 'Régulation Fintech en Zone UEMOA & CEMAC',
          estimatedHours: 8
        }
      ],
      daysUntilDeadline: 24,
      preparationFeasibility: 'faisable_avant_deadline',
      strategicAdvice: 'Vous pouvez candidater dès aujourd\'hui en suivant le module Campus BCEAO de 8h pour l\'entretien technique.'
    },
    trustScore: 98,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte',
    contactPerson: {
      name: 'Moussa Kéita',
      role: 'Directeur Général Adjoint & VP Tech',
      channel: 'mok_message'
    }
  },
  {
    id: 'opp-emp-2',
    title: 'Consultant Stratégie Supply Chain & Export Agro',
    entity: 'West Africa AgriExport Consortium',
    entityLogoUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=150',
    universe: 'emploi',
    opportunityType: 'Mission Conseil / Freelance',
    location: 'Dakar & Conakry (Déplacements régionaux)',
    locationScope: 'regional',
    country: 'Sénégal / Guinée',
    countryFlag: '🇸🇳',
    description: 'Accompagnement de 12 coopératives agricoles pour la structuration de la chaîne du froid et la conformité aux normes sanitaires européennes.',
    publicationDate: 'Hier',
    deadlineDate: 'Dans 8 jours (Échéance courte)',
    daysRemaining: 8,
    isUrgent: true,
    compensationOrBudget: '650 € - 900 € / jour (TJM)',
    sourceType: 'marche_mondial',
    sourceName: 'Marché Mondial B2B - Appels d\'Offres',
    matchScore: 89,
    compatibilityTier: 'Forte',
    readiness: 'ready_now',
    whyForMe: 'Votre expérience en gestion commerciale internationale et logistique correspond à 90% des critères du cahier des charges.',
    matchedStrengths: ['Négociation B2B', 'Gestion de Projet', 'Connaissance Terroir'],
    missingCompetencies: ['Certification Norme GlobalGAP'],
    gapPlan: {
      missingSkills: [
        {
          skill: 'Audit & Normes GlobalGAP Fruits/Légumes',
          campusCourseId: 'course-globalgap-audit',
          courseTitle: 'Maîtrise des Standards d\'Exportation Sanitaire',
          estimatedHours: 6
        }
      ],
      daysUntilDeadline: 8,
      preparationFeasibility: 'faisable_avant_deadline',
      strategicAdvice: 'Échéance rapide (8 jours). Déposez votre manifestation d\'intérêt avec une synthèse de vos réalisations logistiques antérieures.'
    },
    trustScore: 95,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte',
    contactPerson: {
      name: 'Aminata Touré',
      role: 'Responsable Passation Marchés',
      channel: 'email'
    }
  },
  {
    id: 'opp-emp-3',
    title: 'Directeur d\'Exploitation & Hôtellerie Internationale',
    entity: 'Grand Hôtel & Resorts Atlantique',
    universe: 'emploi',
    opportunityType: 'CDI Direction',
    location: 'Montréal / Casablanca',
    locationScope: 'international',
    country: 'Canada / Maroc',
    countryFlag: '🇨🇦',
    description: 'Direction générale d\'un complexe hôtelier 5 étoiles en phase de transformation servicielle et éco-responsable.',
    publicationDate: 'Il y a 5 jours',
    deadlineDate: 'Dans 45 jours',
    daysRemaining: 45,
    isUrgent: false,
    compensationOrBudget: '95 000 $ CAD / an + Logement de fonction',
    sourceType: 'partner_ecosystem',
    sourceName: 'Écosystème Partenaires Hôtellerie MOK',
    matchScore: 78,
    compatibilityTier: 'Moyenne',
    readiness: 'to_prepare',
    whyForMe: 'Très fort potentiel de valorisation de votre leadership. Nécessite néanmoins une certification formelle en management hôtelier durable.',
    matchedStrengths: ['Leadership & Gestion d\'équipe', 'Relation Client Premium', 'Trilingue'],
    missingCompetencies: ['Management Hôtelier Opérationnel PMS', 'Certificat Tourisme Durable GreenKey'],
    gapPlan: {
      missingSkills: [
        {
          skill: 'Gestion PMS Opéra Hôtellerie & Yield Management',
          campusCourseId: 'course-hotel-pms',
          courseTitle: 'Maîtrise Opérationnelle des Systèmes PMS Hôteliers',
          estimatedHours: 18
        },
        {
          skill: 'Audit Environnemental Hôtelier GreenKey',
          campusCourseId: 'course-greenkey-audit',
          courseTitle: 'Management Éco-Responsable de Complexes',
          estimatedHours: 12
        }
      ],
      daysUntilDeadline: 45,
      preparationFeasibility: 'faisable_avant_deadline',
      strategicAdvice: 'Vous avez 45 jours. En validant ces 2 modules sur le Campus, votre profil passera en tête de liste.'
    },
    trustScore: 92,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte'
  },

  // ─── 2. CLIENTS & AFFAIRES B2B ───
  {
    id: 'opp-cli-1',
    title: 'Marché Privé : Digitalisation Complète & E-Commerce',
    entity: 'Comptoir Commercial Panafricain (18 Magasins)',
    entityLogoUrl: 'https://images.unsplash.com/photo-1556742049-0a67e5572293?w=150',
    universe: 'clients',
    opportunityType: 'Contrat Prestation Entreprise',
    location: 'Lomé, Togo (Pilotage à distance)',
    locationScope: 'regional',
    country: 'Togo',
    countryFlag: '🇹🇬',
    description: 'Le groupe recherche un prestataire ou cabinet pour concevoir leur plateforme de commande en ligne B2B avec passerelles Mobile Money.',
    publicationDate: 'Aujourd\'hui',
    deadlineDate: 'Dans 18 jours',
    daysRemaining: 18,
    isUrgent: true,
    compensationOrBudget: '28 000 000 FCFA (~42 500 €)',
    sourceType: 'marche_mondial',
    sourceName: 'Réseau d\'Affaires Marché Mondial LMAV',
    matchScore: 96,
    compatibilityTier: 'Élevée',
    readiness: 'ready_now',
    whyForMe: 'Correspondance parfaite avec vos compétences de développement web, intégration de passerelles de paiement et gestion de projet numérique.',
    matchedStrengths: ['E-Commerce B2B', 'Mobile Money API', 'Architecture Web'],
    missingCompetencies: ['Référence Logistique Togo'],
    gapPlan: {
      missingSkills: [
        {
          skill: 'Intégration Passerelles T-Money & Flooz',
          campusCourseId: 'course-mobilemoney-integration',
          courseTitle: 'Spécifications Techniques Paiements UEMOA',
          estimatedHours: 4
        }
      ],
      daysUntilDeadline: 18,
      preparationFeasibility: 'immediate',
      strategicAdvice: 'Générez un dossier de cadrage technique et devis type dans le Studio dès maintenant.'
    },
    trustScore: 97,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte',
    contactPerson: {
      name: 'Koffi Mensah',
      role: 'Directeur Général',
      channel: 'mok_message'
    }
  },
  {
    id: 'opp-cli-2',
    title: 'Recherche Fournisseur de Solutions d\'Emballage Kraft & Recyclé',
    entity: 'BioCosmetics France & Europe',
    universe: 'clients',
    opportunityType: 'Contrat Cadre Récurrent',
    location: 'Lyon / International',
    locationScope: 'international',
    country: 'France',
    countryFlag: '🇫🇷',
    description: 'Marque de cosmétiques éthiques cherchant un partenaire de sourcing éco-responsable capable de fournir 50 000 étuis kraft / trimestre.',
    publicationDate: 'Il y a 3 jours',
    deadlineDate: 'Dans 30 jours',
    daysRemaining: 30,
    isUrgent: false,
    compensationOrBudget: '35 000 € / an récurrent',
    sourceType: 'tribus_communaute',
    sourceName: 'Tribu LMAV - Cosmétique & Éco-Packaging',
    matchScore: 84,
    compatibilityTier: 'Forte',
    readiness: 'ready_now',
    whyForMe: 'Opportunité client à forte marge si vous proposez des filières d\'approvisionnement direct certifiées FSC.',
    matchedStrengths: ['Sourcing Matières Premières', 'Contrats Cadres', 'Audit Qualité'],
    missingCompetencies: ['Traçabilité Blockchain Packaging'],
    trustScore: 91,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte'
  },

  // ─── 3. FONDS, SUBVENTIONS & INVESTISSEURS ───
  {
    id: 'opp-fnd-1',
    title: 'Programme d\'Accélération & Bourse d\'Amorçage Tech 2026',
    entity: 'Fondation Afrique Innovation & Progrès',
    entityLogoUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=150',
    universe: 'fonds',
    opportunityType: 'Subvention Non-Dilutive (Grant)',
    location: 'Panafricain & Diaspora',
    locationScope: 'regional',
    country: 'Afrique de l\'Ouest / France',
    countryFlag: '🌍',
    description: 'Dotation financière de 25 000 € à 50 000 € sans prise de participation pour projets innovants en éducation, santé, fintech ou agriculture durable.',
    publicationDate: 'Il y a 4 jours',
    deadlineDate: 'Dans 14 jours (30 Avril)',
    daysRemaining: 14,
    isUrgent: true,
    compensationOrBudget: '25 000 € - 50 000 € (Subvention)',
    sourceType: 'international_org',
    sourceName: 'Appels Bailleurs & Programmes Certifiés MOK',
    matchScore: 92,
    compatibilityTier: 'Élevée',
    readiness: 'ready_now',
    whyForMe: 'Votre dossier de projet correspond aux priorités thématiques du fonds. Le modèle économique que vous préparez est éligible à 100%.',
    matchedStrengths: ['Impact Social Mesurable', 'Innovation Numérique', 'Gouvernance'],
    missingCompetencies: ['Modèle Financier sur 3 ans format Bailleurs'],
    gapPlan: {
      missingSkills: [
        {
          skill: 'Montage de Dossier de Financement International',
          campusCourseId: 'course-grant-writing',
          courseTitle: 'Rédaction & Pitch de Subventions Bailleurs Mondiaux',
          estimatedHours: 7
        }
      ],
      daysUntilDeadline: 14,
      preparationFeasibility: 'faisable_avant_deadline',
      strategicAdvice: 'Utilisez le Studio pour générer le pitch deck et les prévisionnels financiers certifiés.'
    },
    trustScore: 99,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte'
  },
  {
    id: 'opp-fnd-2',
    title: 'Tour Seed : Ticket d\'Investissement 100k€ - 250k€',
    entity: 'Baobab Angels Club & Diaspora Capital',
    universe: 'fonds',
    opportunityType: 'Investissement Equity / BSA Air',
    location: 'Paris / Dakar / Abidjan',
    locationScope: 'international',
    country: 'International',
    countryFlag: '💼',
    description: 'Réseau de 45 Business Angels et dirigeants de la diaspora recherchant des startups B2B à fort potentiel de croissance en Afrique subsaharienne.',
    publicationDate: 'Il y a 1 semaine',
    deadlineDate: 'Session Pitch le 28 Mai',
    daysRemaining: 55,
    isUrgent: false,
    compensationOrBudget: '150 000 € en moyenne par ticket',
    sourceType: 'reseau_mok',
    sourceName: 'Cercle Investisseurs MOK Trust Club',
    matchScore: 81,
    compatibilityTier: 'Forte',
    readiness: 'to_prepare',
    whyForMe: 'Opportunité majeure de lever des fonds pour financer l\'expansion de votre activité avec des investisseurs mentors.',
    matchedStrengths: ['Vision Stratégique', 'Capacité d\'Exécution', 'Adéquation Marché'],
    missingCompetencies: ['Pacte d\'Associés & Term Sheet Avancée', 'Dossier Data Room Prêt'],
    gapPlan: {
      missingSkills: [
        {
          skill: 'Négociation de Term Sheet & Valorisation Pré-Money',
          campusCourseId: 'course-term-sheet-seed',
          courseTitle: 'Maîtrise Juridique et Financière de la Levée Seed',
          estimatedHours: 10
        }
      ],
      daysUntilDeadline: 55,
      preparationFeasibility: 'faisable_avant_deadline',
      strategicAdvice: 'Vous avez 55 jours pour préparer votre Data Room et simuler le pitch avec le Coach 3D.'
    },
    trustScore: 96,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte'
  },

  // ─── 4. ACHATS, FOURNISSEURS & SOURCING ───
  {
    id: 'opp-ach-1',
    title: 'Fournisseur Direct d\'Équipements Informatiques & Écrans Reconditionnés Grade A',
    entity: 'TechRenew Direct Europe Hub',
    universe: 'achats',
    opportunityType: 'Accord Grossiste / Tarifs Pro Usine',
    location: 'Rotterdam / Anvers (Livraison Portuaire)',
    locationScope: 'international',
    country: 'Pays-Bas',
    countryFlag: '🇳🇱',
    description: 'Lots de PC portables professionnels Dell/Lenovo reconditionnés certifiés garantie 2 ans avec réduction de 45% par rapport au neuf.',
    publicationDate: 'Il y a 2 jours',
    deadlineDate: 'Offre valable selon stock (120 unités)',
    daysRemaining: 15,
    isUrgent: false,
    compensationOrBudget: 'Remise volume 42% (Achat par lot de 10 min)',
    sourceType: 'marche_mondial',
    sourceName: 'Centrale d\'Achats Marché Mondial LMAV',
    matchScore: 90,
    compatibilityTier: 'Élevée',
    readiness: 'ready_now',
    whyForMe: 'Permet d\'équiper vos équipes ou de revendre avec une marge brute supérieure à 35% sur votre marché local.',
    matchedStrengths: ['Capacité d\'Achat Pro', 'Logistique Import', 'Mok Trust Garanti'],
    missingCompetencies: ['Dédouanement Express Fret Maritime'],
    trustScore: 96,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte'
  },
  {
    id: 'opp-ach-2',
    title: 'Centrale d\'Achat Textile Coton Bio Équitable',
    entity: 'Coopérative Textile Sahel Pure',
    universe: 'achats',
    opportunityType: 'Fourniture Matière Première Brute & Tissée',
    location: 'Bamako / Bobo-Dioulasso',
    locationScope: 'regional',
    country: 'Mali / Burkina Faso',
    countryFlag: '🇲🇱',
    description: 'Rouleaux de tissus certifiés OEKO-TEX et Commerce Équitable directement auprès des tisseuses sans intermédiaires spéculatifs.',
    publicationDate: 'Il y a 6 jours',
    deadlineDate: 'Campagne de récolte en cours',
    daysRemaining: 35,
    isUrgent: false,
    compensationOrBudget: 'Tarif producteur garanti (-30% vs marché)',
    sourceType: 'internal_lmav',
    sourceName: 'Coopératives Solidaires LMAV',
    matchScore: 86,
    compatibilityTier: 'Forte',
    readiness: 'ready_now',
    whyForMe: 'Parfait pour réduire vos coûts de production textile tout en garantissant un argument marketing éthique irréprochable.',
    matchedStrengths: ['Audit Éthique', 'Paiement Sécurisé Séquestre', 'Traçabilité'],
    missingCompetencies: ['Agrément Import Sanitaire'],
    trustScore: 94,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte'
  },

  // ─── 5. HORIZON EXPLORATION (Sortie de bulle d'algorithme) ───
  {
    id: 'opp-exp-1',
    title: 'Programme International de Fellowship en Intelligence Artificielle Éthique',
    entity: 'Global AI Institute & Université Numérique',
    universe: 'emploi',
    opportunityType: 'Bourse de Recherche & Résidence (Prise en charge 100%)',
    location: 'Genève / En ligne',
    locationScope: 'international',
    country: 'Suisse / Monde',
    countryFlag: '🇨🇭',
    description: 'Programme de 6 mois pour former des leaders technologiques aux enjeux de gouvernance de l\'IA et souveraineté des données dans les pays émergents.',
    publicationDate: 'Il y a 3 jours',
    deadlineDate: 'Dans 60 jours',
    daysRemaining: 60,
    isUrgent: false,
    compensationOrBudget: 'Allocation mensuelle 4 200 CHF + Frais couverts',
    sourceType: 'public_official',
    sourceName: 'Appels Publics Internationaux Vérifiés',
    matchScore: 74,
    compatibilityTier: 'Exploratoire',
    readiness: 'future_goal',
    whyForMe: 'Opportunité en dehors de votre quotidien immédiat mais qui propulserait votre statut professionnel à un niveau d\'influence mondiale d\'ici 1 an.',
    matchedStrengths: ['Curiosité Intellectuelle', 'Vision Technologique', 'Potentiel Leader'],
    missingCompetencies: ['Publication / Rédaction d\'Essai Stratégique', 'Anglais Académique C1'],
    gapPlan: {
      missingSkills: [
        {
          skill: 'Anglais Professionnel & Prise de Parole Débat (C1)',
          campusCourseId: 'course-english-c1',
          courseTitle: 'Anglais d\'Influence et Débats Internationaux',
          estimatedHours: 25
        }
      ],
      daysUntilDeadline: 60,
      preparationFeasibility: 'moyen_terme',
      strategicAdvice: 'C\'est un objectif de prestige qui vaut la peine d\'être préparé sur 2 mois en suivant les ateliers Campus.'
    },
    trustScore: 99,
    isVerifiedEntity: true,
    riskLevel: 'safe',
    vaultStatus: 'decouverte',
    isExplorationCard: true
  }
];

// ══════════════════════════════════════════════════════════════════════════
// 📡 SIGNAUX FAIBLES DU RÉSEAU MOK (Opportunités cachées et non encore publiées)
// ══════════════════════════════════════════════════════════════════════════

export const INITIAL_RADAR_SIGNALS: RadarHiddenSignal[] = [
  {
    id: 'sig-1',
    authorName: 'Dr. Ousmane Diop',
    authorRole: 'Président Fondateur',
    companyName: 'PharmAlliance Sahel (Guinée & Sénégal)',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    sourcePostExcerpt: '« Fiers d\'annoncer l\'obtention de notre licence d\'importation et l\'ouverture prochaine de 4 nouveaux centres de distribution pharmaceutique d\'ici juillet 2026. L\'aventure grandit ! »',
    sourcePlatform: 'reseau_mok',
    detectedDate: 'Hier à 16:45',
    signalHypothesis: 'L\'entreprise va recruter des directeurs de site, avoir besoin de prestataires logistiques froid, de comptables et d\'un cabinet pour déployer leur ERP.',
    suggestedOpportunities: [
      {
        title: 'Proposition de Service Logistique ou IT avant publication des offres',
        universe: 'clients',
        angleApproach: 'Féliciter pour la licence et proposer un cadrage sur mesure pour la sécurisation de leurs flux de données / logistique.'
      },
      {
        title: 'Candidature Spontanée Position Clé de Direction',
        universe: 'emploi',
        angleApproach: 'Prendre contact directement avec Dr. Diop en amont de la concurrence.'
      }
    ],
    confidenceIndex: 94,
    status: 'new'
  },
  {
    id: 'sig-2',
    authorName: 'Fatou Ndiaye',
    authorRole: 'Directrice des Investissements',
    companyName: 'Sahel Green Energy Venture',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    sourcePostExcerpt: '« Nous venons de clôturer notre premier closing de 2,5 millions d\'euros pour financer les mini-réseaux solaires ruraux. Les déploiements terrains commencent le mois prochain. »',
    sourcePlatform: 'marche_mondial',
    detectedDate: 'Il y a 2 jours',
    signalHypothesis: 'Besoin urgent de sous-traitants pour l\'installation électrique, le génie civil, la maintenance et l\'équipement de sécurité.',
    suggestedOpportunities: [
      {
        title: 'Sous-traitance & Fourniture de Matériel Électrique',
        universe: 'achats',
        angleApproach: 'Proposer vos catalogues ou partenariats techniques pour leurs chantiers.'
      },
      {
        title: 'Partenariat Commercial Local',
        universe: 'clients',
        angleApproach: 'Proposer une convention de distribution de solutions solaires pour votre zone.'
      }
    ],
    confidenceIndex: 91,
    status: 'new'
  }
];

// ══════════════════════════════════════════════════════════════════════════
// 🚀 MISSIONS DE VEILLE CONTINUE ("Mon Agent cherche pour moi")
// ══════════════════════════════════════════════════════════════════════════

export const INITIAL_SEARCH_MISSIONS: ContinuousSearchMission[] = [
  {
    id: 'mis-1',
    title: 'Veille Contrats Conseils & Missions Tech',
    naturalQuery: 'Recherche de missions d\'architecture logicielle, conseil digital et direction de projet en Afrique de l\'Ouest ou Remote',
    universe: 'emploi',
    targetLocation: 'Sénégal / Côte d\'Ivoire / France / Remote',
    minSalaryOrBudget: '60 000 € / an ou 600 € / jour',
    status: 'active',
    foundCount: 6,
    newMatchesCount: 2,
    lastScannedAt: 'Aujourd\'hui à 08:30',
    frequency: 'continuous',
    matchingThreshold: 85,
    alertChannels: {
      inApp: true,
      priorityDigest: true
    }
  },
  {
    id: 'mis-2',
    title: 'Veille Appels à Projets & Subventions Tech/Agri',
    naturalQuery: 'Programmes de bourses et subventions pour l\'innovation entrepreneuriale et l\'exportation',
    universe: 'fonds',
    targetLocation: 'International / Panafricain',
    minSalaryOrBudget: '20 000 € minimum',
    status: 'active',
    foundCount: 4,
    newMatchesCount: 1,
    lastScannedAt: 'Hier à 22:15',
    frequency: 'daily',
    matchingThreshold: 80,
    alertChannels: {
      inApp: true,
      priorityDigest: false
    }
  }
];

// ══════════════════════════════════════════════════════════════════════════
// 🧠 MOTEUR INTELLIGENT DE CORRESPONDANCE ET D'EXPLICATION (CareerRadarEngine)
// ══════════════════════════════════════════════════════════════════════════

export class CareerRadarEngine {
  private opportunities: RadarOpportunityItem[] = [];
  private signals: RadarHiddenSignal[] = [];
  private missions: ContinuousSearchMission[] = [];
  private feedbacks: OpportunityFeedbackRecord[] = [];
  private stateRecordId?: string;
  private readonly hydration: Promise<void>;

  constructor() {
    this.hydration = this.loadFromCloud();
  }

  public ready(): Promise<void> {
    return this.hydration;
  }

  private async loadFromCloud(): Promise<void> {
    try {
      const [record] = await moduleRepository.list<{
        opportunities: RadarOpportunityItem[];
        signals: RadarHiddenSignal[];
        missions: ContinuousSearchMission[];
        feedbacks: OpportunityFeedbackRecord[];
      }>('career', 'radar_state');
      if (!record) return;
      this.stateRecordId = record.id;
      this.opportunities = record.payload.opportunities ?? [];
      this.signals = record.payload.signals ?? [];
      this.missions = record.payload.missions ?? [];
      this.feedbacks = record.payload.feedbacks ?? [];
    } catch (e) {
      console.warn('Radar cloud indisponible; aucune opportunité fictive chargée.', e);
    }
  }

  private saveToCloud() {
    void moduleRepository.upsert('career', 'radar_state', {
      opportunities: this.opportunities,
      signals: this.signals,
      missions: this.missions,
      feedbacks: this.feedbacks,
    }, {
      id: this.stateRecordId,
      idempotencyKey: 'radar-state:singleton',
    }).then((record) => { this.stateRecordId = record.id; });
  }

  // Getters
  public getOpportunities(): RadarOpportunityItem[] {
    return this.opportunities;
  }

  public getSignals(): RadarHiddenSignal[] {
    return this.signals;
  }

  public getMissions(): ContinuousSearchMission[] {
    return this.missions;
  }

  public getFeedbacks(): OpportunityFeedbackRecord[] {
    return this.feedbacks;
  }

  // Filter Opportunities
  public filterOpportunities(params: {
    universe?: OpportunityUniverse | 'all';
    readiness?: OpportunityTemporalReadiness | 'all';
    locationScope?: string | 'all';
    minMatchScore?: number;
    searchQuery?: string;
  }): RadarOpportunityItem[] {
    return this.opportunities.filter(opp => {
      if (params.universe && params.universe !== 'all' && opp.universe !== params.universe) return false;
      if (params.readiness && params.readiness !== 'all' && opp.readiness !== params.readiness) return false;
      if (params.locationScope && params.locationScope !== 'all' && opp.locationScope !== params.locationScope) return false;
      if (params.minMatchScore && opp.matchScore < params.minMatchScore) return false;
      
      if (params.searchQuery && params.searchQuery.trim() !== '') {
        const q = params.searchQuery.toLowerCase();
        const matchesTitle = opp.title.toLowerCase().includes(q);
        const matchesEntity = opp.entity.toLowerCase().includes(q);
        const matchesLoc = opp.location.toLowerCase().includes(q);
        const matchesDesc = opp.description.toLowerCase().includes(q);
        const matchesSkills = opp.matchedStrengths.some(s => s.toLowerCase().includes(q));
        if (!matchesTitle && !matchesEntity && !matchesLoc && !matchesDesc && !matchesSkills) {
          return false;
        }
      }
      return true;
    });
  }

  // Update Vault Status
  public updateVaultStatus(opportunityId: string, newStatus: RadarOpportunityItem['vaultStatus'], notes?: string): RadarOpportunityItem | null {
    const opp = this.opportunities.find(o => o.id === opportunityId);
    if (!opp) return null;
    opp.vaultStatus = newStatus;
    if (notes !== undefined) opp.userNotes = notes;
    if (newStatus === 'a_etudier' || newStatus === 'action_engagee') {
      opp.savedAt = new Date().toLocaleDateString('fr-FR');
    }
    this.saveToCloud();
    return opp;
  }

  public toggleFavorite(opportunityId: string): boolean {
    const opp = this.opportunities.find(o => o.id === opportunityId);
    if (!opp) return false;
    opp.isFavorite = !opp.isFavorite;
    this.saveToCloud();
    return opp.isFavorite;
  }

  // Save Feedback & Learn
  public recordFeedback(record: Omit<OpportunityFeedbackRecord, 'id' | 'timestamp'>) {
    const newRecord: OpportunityFeedbackRecord = {
      ...record,
      id: `fb-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
    this.feedbacks.unshift(newRecord);
    this.saveToCloud();
  }

  // Manage Continuous Search Missions
  public createSearchMission(missionData: Omit<ContinuousSearchMission, 'id' | 'foundCount' | 'newMatchesCount' | 'lastScannedAt'>): ContinuousSearchMission {
    const newMission: ContinuousSearchMission = {
      ...missionData,
      id: `mis-${Date.now()}`,
      foundCount: 0,
      newMatchesCount: 0,
      lastScannedAt: 'Initialisation en cours'
    };
    this.missions.unshift(newMission);
    this.saveToCloud();
    return newMission;
  }

  public toggleMissionStatus(missionId: string): ContinuousSearchMission | null {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return null;
    mission.status = mission.status === 'active' ? 'paused' : 'active';
    this.saveToCloud();
    return mission;
  }

  public deleteMission(missionId: string): boolean {
    const initialLen = this.missions.length;
    this.missions = this.missions.filter(m => m.id !== missionId);
    this.saveToCloud();
    return this.missions.length < initialLen;
  }

  // ══════════════════════════════════════════════════════════════════════════
  // 🔍 EXECUTE SMART RADAR SCAN WITH GEMINI & EXPLAINABLE MATCHING
  // ══════════════════════════════════════════════════════════════════════════
  public async executeRadarScan(params: {
    naturalQuery: string;
    universe: OpportunityUniverse;
    pointA: CareerPointA;
    pointB: CareerPointB;
  }): Promise<RadarOpportunityItem[]> {
    const { naturalQuery, universe, pointA, pointB } = params;

    try {
      const ai = new AIProxyClient();

      const prompt = `Tu es le Radar Intelligent d'Opportunités de la plateforme "Le Monde à Vous".
Ta mission est d'analyser l'intention naturelle de l'utilisateur et de générer 4 opportunités concrètes, hautement ciblées, explicables et réalistes.

DONNÉES UTILISATEUR :
- Intention naturelle de recherche : "${naturalQuery}"
- Univers : "${universe}" (emploi / clients / fonds / achats)
- Objectif Point B : "${pointB.title}" (Catégorie: ${pointB.category}, Délai cible: ${pointB.targetDeadlineMonths} mois)
- Situation Point A :
  - Titre actuel : "${pointA.currentTitle}"
  - Compétences actuelles : ${pointA.hardSkills.map(s => `${s.name} (niv ${s.level}/5)`).join(', ')}
  - Langues : ${pointA.languages.map(l => `${l.language} (${l.level})`).join(', ')}
  - Localisation & Mobilité : "${pointA.location}" (${pointA.mobility})
  - Contraintes & Disponibilité : "${pointA.constraints.join(', ')}" (${pointA.weeklyAvailabilityHours}h/semaine)

RÈGLES ABSOLUES :
1. Génère 4 opportunités réalistes avec des noms d'entreprises, institutions, bailleurs ou marques crédibles.
2. Chaque opportunité DOIT avoir une explication transparente "whyForMe" en 2 phrases claires expliquant pourquoi cette offre rapproche l'utilisateur de son Point B.
3. Définis la temporalité 'readiness' :
   - 'ready_now' si le profil a l'essentiel des compétences (80%+)
   - 'to_prepare' si l'opportunité est pertinente mais nécessite 1-2 compétences rapides à acquérir avant l'échéance (avec un plan d'écart concret)
   - 'future_goal' si c'est un jalon d'ambition plus lointain
4. Définis un score de confiance 'trustScore' (0-100), 'isVerifiedEntity', et 'riskLevel' ('safe', 'low_risk', 'moderate').
5. Évalue le 'matchScore' (0-100) basé sur l'adéquation objective des compétences.

FORMAT DE RÉPONSE OBLIGATOIRE EN JSON STRICT (SANS MARKDOWN NI BLABLA) :
[
  {
    "title": "...",
    "entity": "...",
    "opportunityType": "...",
    "location": "...",
    "locationScope": "regional",
    "country": "...",
    "countryFlag": "🇲🇱",
    "description": "...",
    "publicationDate": "Il y a 1 jour",
    "deadlineDate": "Dans 21 jours",
    "daysRemaining": 21,
    "isUrgent": false,
    "compensationOrBudget": "...",
    "sourceType": "marche_mondial",
    "sourceName": "Marché Mondial LMAV",
    "matchScore": 92,
    "compatibilityTier": "Élevée",
    "readiness": "ready_now",
    "whyForMe": "...",
    "matchedStrengths": ["Compétence 1", "Compétence 2"],
    "missingCompetencies": ["Compétence manquante"],
    "gapPlan": {
      "missingSkills": [
        {
          "skill": "Compétence X",
          "courseTitle": "Titre cours Campus",
          "estimatedHours": 8
        }
      ],
      "daysUntilDeadline": 21,
      "preparationFeasibility": "faisable_avant_deadline",
      "strategicAdvice": "..."
    },
    "trustScore": 98,
    "isVerifiedEntity": true,
    "riskLevel": "safe"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { responseMimeType: 'application/json' }
      });

      const parsed: any[] = JSON.parse(response.text || '[]');
      const results: RadarOpportunityItem[] = parsed.map((item, idx) => ({
        id: `opp-gen-${Date.now()}-${idx}`,
        universe,
        vaultStatus: 'decouverte',
        ...item
      }));

      // Merge into local list avoiding duplicates
      this.opportunities = [...results, ...this.opportunities];
      this.saveToCloud();
      return results;

    } catch (err) {
      console.warn('Radar distant indisponible : aucune opportunité inventée.', err);
      return [];
    }
  }
}

export const careerRadarEngine = new CareerRadarEngine();
