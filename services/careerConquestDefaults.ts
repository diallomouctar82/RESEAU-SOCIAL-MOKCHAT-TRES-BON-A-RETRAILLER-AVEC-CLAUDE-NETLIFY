import { 
  MasterResumeProfile, 
  ConquestWarRoomDossier, 
  RadarOpportunityItem,
  ContextualResumeData,
  ConquestApproachDocument,
  ConquestGapAnalysis5D,
  ConquestPreparationScore,
  ConquestChecklistItem,
  ConquestFivePitches,
  ConquestVideoScriptData,
  QuickMeetingFlashCard,
  QualityControlVerification
} from '../types';

export const INITIAL_MASTER_RESUME: MasterResumeProfile = {
  id: 'master-cv-default',
  userId: 'user-current',
  fullName: 'Mamadou Diallo',
  headlineTitle: 'Directeur de Projet & Architecte Systèmes d\'Information',
  email: 'mamadou.diallo@pro.lmav.world',
  phone: '+224 620 00 11 22',
  location: 'Conakry & International (Mobilité Afrique de l\'Ouest / Europe)',
  linkedinOrWeb: 'https://mok.world/u/mamadou-diallo',
  summaryBio: 'Professionnel chevronné cumulant 8 années d\'expertise en pilotage de transformations numériques, déploiements d\'infrastructures et négociation de partenariats commerciaux stratégiques. Passionné par l\'impact économique concret et la rigueur d\'exécution.',
  lastUpdated: 'Aujourd\'hui',
  experiences: [
    {
      id: 'exp-1',
      role: 'Lead Architecte & Directeur de Projet Numérique',
      company: 'Innovatech Solutions West Africa',
      location: 'Dakar & Conakry',
      startDate: '2023-01',
      endDate: 'Présent',
      isCurrent: true,
      category: 'emploi',
      verifiedByLMav: true,
      description: 'Direction technique et opérationnelle d\'une équipe de 16 ingénieurs et consultants. Pilotage de grands comptes bancaires et logistiques.',
      keyAchievements: [
        'Déploiement d\'une plateforme fintech sécurisée traitant plus de 150 000 transactions mensuelles.',
        'Réduction des délais d\'intégration partenaires de 45 jours à moins de 72 heures.',
        'Négociation et signature de 4 contrats-cadres majeurs représentant 420 000 $ de budget annuel.'
      ],
      skillsUsed: ['Direction de projet', 'Architecture Cloud', 'Négociation B2B', 'Agile & Scrum', 'Sécurité des données'],
      metricsDelivered: ['+45% de volume de transaction', '16 collaborateurs encadrés', '99.98% de SLA garanti']
    },
    {
      id: 'exp-2',
      role: 'Consultant Stratégie & Systèmes d\'Information',
      company: 'Cabinet Conseil Afrique Émergence',
      location: 'Abidjan / International',
      startDate: '2020-03',
      endDate: '2022-12',
      isCurrent: false,
      category: 'freelance',
      verifiedByLMav: true,
      description: 'Accompagnement de PME et d\'institutions publiques dans leur transition numérique, audit organisationnel et choix technologiques.',
      keyAchievements: [
        'Audit complet des processus logistiques pour un groupe agroalimentaire régional.',
        'Rédaction de cahiers des charges et pilotage de 7 appels d\'offres internationaux.',
        'Économie moyenne de 22% sur les coûts d\'acquisition logicielle pour les clients.'
      ],
      skillsUsed: ['Audit de processus', 'Gestion d\'appels d\'offres', 'Conseil en gouvernance', 'Optimisation budgétaire'],
      metricsDelivered: ['7 appels d\'offres remportés', '-22% sur les coûts logiciels']
    },
    {
      id: 'exp-3',
      role: 'Ingénieur d\'Études & Développeur Full-Stack',
      company: 'Global Tech Hub',
      location: 'Paris / Télé-travail',
      startDate: '2017-09',
      endDate: '2020-02',
      isCurrent: false,
      category: 'emploi',
      verifiedByLMav: true,
      description: 'Conception d\'applications web transactionnelles haute performance et interfaçage d\'APIs bancaires.',
      keyAchievements: [
        'Développement de modules de paiement et réconciliation bancaire en temps réel.',
        'Mise en place de pipelines CI/CD réduisant le time-to-market des fonctionnalités de 40%.'
      ],
      skillsUsed: ['TypeScript', 'Node.js', 'PostgreSQL', 'APIs REST / GraphQL', 'DevOps'],
      metricsDelivered: ['12 micro-services déployés', '99.9% uptime']
    }
  ],
  education: [
    {
      id: 'edu-1',
      degree: 'Master 2 en Ingénierie des Systèmes d\'Information & Management',
      institution: 'Institut Supérieur des Technologies & de Gestion',
      location: 'France / Sénégal',
      graduationYear: '2017',
      honors: 'Mention Très Bien',
      fieldOfStudy: 'Informatique & Stratégie d\'Entreprise',
      keyCourses: ['Architecture d\'Entreprise', 'Droit des TIC', 'Management de l\'Innovation', 'Finance d\'Entreprise']
    },
    {
      id: 'edu-2',
      degree: 'Licence en Sciences Informatiques',
      institution: 'Université Général Lansana Conté',
      location: 'Conakry, Guinée',
      graduationYear: '2015',
      honors: 'Major de Promotion',
      fieldOfStudy: 'Sciences et Technologies',
      keyCourses: ['Algorithmique Avancée', 'Bases de Données', 'Réseaux & Télécoms']
    }
  ],
  skills: [
    { name: 'Direction & Pilotage de Projets Complexes', category: 'gestion_projet', level: 5, verified: true, verifiedSource: 'Campus LMAV' },
    { name: 'Architecture Logicielle & Solutions Cloud', category: 'technique', level: 5, verified: true, verifiedSource: 'Certificat Pro' },
    { name: 'Négociation Commerciale & Closing B2B', category: 'metier', level: 4, verified: true, verifiedSource: 'Peer Review' },
    { name: 'Gestion des Appels d\'Offres & Cahiers des Charges', category: 'metier', level: 5, verified: true },
    { name: 'Leadership & Gestion d\'Équipe Multiculturelle', category: 'soft_skills', level: 5, verified: true },
    { name: 'Communication & Éloquence Stratégique', category: 'soft_skills', level: 4, verified: true, verifiedSource: 'Coach 3D' },
    { name: 'Anglais Professionnel International (C1)', category: 'langues', level: 4, verified: true, verifiedSource: 'Centre de Langues' },
    { name: 'Français (Langue Maternelle / Excellence)', category: 'langues', level: 5, verified: true }
  ],
  languages: [
    { language: 'Français', proficiency: 'Bilingue / Langue maternelle', certifiedLevel: 'C2' },
    { language: 'Anglais', proficiency: 'Courant professionnel', certifiedLevel: 'C1' },
    { language: 'Pulaar / Peul', proficiency: 'Langue native', certifiedLevel: 'C2' },
    { language: 'Sousou', proficiency: 'Intermédiaire parlé', certifiedLevel: 'B1' }
  ],
  certifications: [
    { title: 'Project Management Professional (PMP Equivalency)', issuer: 'Campus Mondial LMAV', year: '2024', certificateId: 'CERT-PMP-8891' },
    { title: 'Cloud Architecture & Cyber-Resilience', issuer: 'International Cloud Academy', year: '2023', certificateId: 'CERT-CLD-3301' },
    { title: 'Négociation Stratégique Grands Comptes', issuer: 'Executive Business Institute', year: '2024', certificateId: 'CERT-NEG-7712' }
  ],
  portfolioProjects: [
    {
      title: 'Corridor Numérique UEMOA/CEDEAO',
      description: 'Interconnexion de 3 systèmes douaniers et marchands pour la facilitation des échanges transfrontaliers.',
      role: 'Directeur de Projet & Architecte Principal',
      tags: ['Interconnexion', 'Sécurité', 'Incoterms 2020', 'Multi-Pays'],
      url: 'https://proof.lmav.world/case-corridor'
    },
    {
      title: 'Plateforme B2B Séquestre & Paiements Sécurisés',
      description: 'Solution fintech garantissant le paiement à la livraison pour les importateurs et grossistes.',
      role: 'Lead Architecte',
      tags: ['Fintech', 'Séquestre', 'B2B', 'Garantie de Paiement'],
      url: 'https://proof.lmav.world/case-escrow'
    }
  ]
};

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// CONQUEST DOSSIER GENERATOR ENGINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export function generateConquestDossierForOpportunity(
  opportunity: RadarOpportunityItem,
  masterResume: MasterResumeProfile = INITIAL_MASTER_RESUME
): ConquestWarRoomDossier {
  const isClient = opportunity.universe === 'clients';
  const isFunds = opportunity.universe === 'fonds';
  const isPurchases = opportunity.universe === 'achats';
  const isJob = opportunity.universe === 'emploi';

  // 1. Gap Analysis 5D
  const gapAnalysis5D: ConquestGapAnalysis5D = {
    alreadyPossessed: [
      {
        item: 'Expérience avérée en direction opérationnelle et grands projets',
        detail: '8 ans d\'expérience validée dont 4 ans en responsabilité directe de budgets et d\'équipes.',
        proofExperience: 'Innovatech Solutions (2023-Présent)'
      },
      {
        item: 'Maîtrise des standards et de la gouvernance transfrontalière',
        detail: 'Déploiement réussi sur 3 pays avec gestion de la conformité réglementaire.',
        proofExperience: 'Cabinet Conseil Afrique Émergence'
      },
      {
        item: 'Communication bilingue Français / Anglais des affaires',
        detail: 'Certification C1 enregistrée au profil.',
        proofExperience: 'Certifications validées'
      }
    ],
    betterPresent: [
      {
        item: 'Mettre en avant les métriques de ROI chiffrées dès l\'en-tête',
        currentFormulation: 'Expérience en gestion de projet et optimisation budgétaire.',
        recommendedHighlight: '« A généré +420k$ de volume d\'affaires et réduit de 40% les délais de livraison opérationnelle ».'
      },
      {
        item: 'Valoriser l\'expertise spécifique au secteur de ' + opportunity.entity,
        currentFormulation: 'Mention générale de conseil en systèmes d\'information.',
        recommendedHighlight: `Contextualiser directement les cas d'usage répondant au besoin : "${opportunity.title}".`
      }
    ],
    realGaps: opportunity.missingCompetencies && opportunity.missingCompetencies.length > 0
      ? opportunity.missingCompetencies.map((comp, idx) => ({
          item: comp,
          impactLevel: idx === 0 ? 'bloquant' : 'compensable',
          suggestedCampusCourse: `Mastery ${comp} — Campus Mondial LMAV`
        }))
      : [
          {
            item: 'Certification sectorielle avancée spécifique',
            impactLevel: 'compensable',
            suggestedCampusCourse: 'Module d\'Accréditation Sectorielle Express'
          }
        ],
    quickWins: [
      {
        item: 'Ajuster les mots-clés du CV au référentiel exact de ' + opportunity.entity,
        action: 'Application automatique du filtre sémantique contextualisé',
        estimatedTimeMinutes: 5
      },
      {
        item: 'Préparer le pitch de 30 secondes personnalisé sur ' + opportunity.entity,
        action: 'Répétition audio assistée par le Coach 3D',
        estimatedTimeMinutes: 10
      },
      {
        item: 'Vérifier la liste des pièces justificatives et attestations de résultats',
        action: 'Génération de l\'archive de preuves vérifiées Le Monde à Vous',
        estimatedTimeMinutes: 5
      }
    ],
    strategicRisks: [
      {
        risk: 'Concurrence forte de profils locaux avec réseau pré-établi',
        mitigationAdvice: 'Mettre en avant l\'approche méthodologique rigoureuse et la garantie d\'exécution mesurable.',
        severity: 'medium'
      },
      {
        risk: 'Délais de décision serrés mentionnés dans l\'annonce',
        mitigationAdvice: 'Proposer un créneau d\'échange rapide dès le premier message avec ordre du jour structuré.',
        severity: 'low'
      }
    ]
  };

  // 2. Score de Préparation Explicable
  const matchScore = opportunity.matchScore || 85;
  const docScore = 80;
  const pitchScore = 75;
  const simScore = 60;
  const piecesScore = 85;
  const overallPrep = Math.round((docScore + pitchScore + simScore + piecesScore) / 4);

  const preparationScore: ConquestPreparationScore = {
    overallPreparationScore: overallPrep,
    compatibilityMatchScore: matchScore,
    statusVerdict: overallPrep >= 80 ? 'pret' : overallPrep >= 60 ? 'presque_pret' : 'preparation_importante_requise',
    verdictExplanation: overallPrep >= 80 
      ? 'Votre dossier est solide, vos arguments sont rodés et les pièces requises sont prêtes pour validation.'
      : 'Votre compatibilité est forte, mais un entraînement au Coach 3D et une relecture du message d\'accroche optimiseront vos chances.',
    breakdown: {
      documentsReadiness: docScore,
      pitchAndArgumentsReadiness: pitchScore,
      simulationTrainingReadiness: simScore,
      administrativePiecesReadiness: piecesScore
    },
    keyMissingPrerequisites: [
      'Entraînement simulation oral spécifique à l\'opportunité (1 session recommandée)',
      'Validation de la proposition personnalisée'
    ]
  };

  // 3. Contextual Resume
  const contextualResume: ContextualResumeData = {
    id: `ctx-cv-${opportunity.id}`,
    opportunityId: opportunity.id,
    opportunityTitle: opportunity.title,
    tailoredHeadline: `${masterResume.headlineTitle} — Spécialiste ${opportunity.title}`,
    tailoredSummary: `Expert reconnu avec 8 ans de réalisations mesurables, spécialement aligné avec les exigences de ${opportunity.entity}. Capable d'apporter immédiatement une valeur probante sur les enjeux de ${opportunity.title} avec rigueur et garantie de résultats.`,
    highlightedExperienceIds: ['exp-1', 'exp-2'],
    rephrasedAchievements: {
      'exp-1': [
        `Pilotage d'envergure en parfaite résonance avec ${opportunity.title}.`,
        'Encadrement de 16 experts et garantie de 99.98% de conformité aux objectifs.',
        'Génération de +420k$ de valeur économique directe avec respect strict des budgets.'
      ],
      'exp-2': [
        'Audit organisationnel et conduite d\'appels d\'offres stratégiques avec 100% de succès.',
        'Optimisation des dépenses opérationnelles de 22% pour les partenaires.'
      ]
    },
    prioritizedSkills: masterResume.skills.slice(0, 6).map(s => s.name),
    matchedKeywords: ['Pilotage', 'Stratégie', 'Exécution', 'ROI', 'Négociation', 'Partenariats'],
    languageVersion: 'Français (Standard International)',
    layoutTemplate: isClient ? 'impact_commercial' : isFunds ? 'academique_fonds' : 'moderne_executif',
    generatedAt: 'Généré à l\'instant'
  };

  // 4. Approach Documents
  const approachDocuments: ConquestApproachDocument[] = [];

  if (isJob) {
    approachDocuments.push({
      id: `doc-lettre-${opportunity.id}`,
      type: 'lettre_motivation',
      title: 'Lettre de Motivation Stratégique & Chiffrée',
      recipientName: opportunity.contactPerson?.name || 'Direction des Ressources Humaines',
      recipientRole: opportunity.contactPerson?.role || 'Responsable du Recrutement',
      subject: `Candidature au poste : ${opportunity.title} — Réf. LMAV/${opportunity.id.slice(0, 6).toUpperCase()}`,
      bodyContent: `Madame, Monsieur,\n\nVotre recherche d'un profil pour le poste de ${opportunity.title} au sein de ${opportunity.entity} fait directement écho à mes 8 années de direction opérationnelle et d'architecture de solutions d'envergure.\n\nAu cours de mes récentes missions, j'ai notamment eu l'opportunité de :\n- Piloter des projets stratégiques générant +45% de volume opérationnel et plus de 420 000 $ de budget annuel.\n- Encadrer des équipes pluridisciplinaires avec un niveau de rigueur garantissant 99.98% de respect des engagements contractuels.\n- Fluidifier les partenariats transfrontaliers et accélérer l'exécution des feuilles de route.\n\nCe qui m'attire particulièrement chez ${opportunity.entity}, c'est votre ambition sur ${opportunity.location} et votre exigence de qualité. Je serais ravi de vous exposer lors d'un premier échange la méthodologie concrète que je propose pour répondre à vos priorités dès le premier mois.\n\nJe vous remercie de l'attention portée à mon dossier et vous prie d'agréer mes salutations les plus distinguées.`,
      tone: 'professionnel_direct',
      language: 'Français',
      callToAction: 'Proposer un entretien de cadrage de 20 minutes',
      lastEditedAt: 'À l\'instant'
    });

    approachDocuments.push({
      id: `doc-msg-mok-${opportunity.id}`,
      type: 'message_reseau_mok',
      title: 'Message d\'Accroche Direct Réseau MOK',
      recipientName: opportunity.contactPerson?.name || 'Responsable Recrutement',
      subject: `Échange sur l'opportunité ${opportunity.title}`,
      bodyContent: `Bonjour ${opportunity.contactPerson?.name || 'Chère Équipe'},\n\nJ'ai relevé avec un grand intérêt votre publication concernant le rôle de ${opportunity.title} chez ${opportunity.entity}.\n\nAyant piloté avec succès des transformations comparables (avec des résultats mesurables de +45% d'efficacité et 16 collaborateurs encadrés), je dispose des atouts nécessaires pour une prise de fonction immédiate.\n\nSeriez-vous ouvert à un rapide échange de 15 minutes cette semaine pour faire connaissance et vous présenter mon approche ?\n\nBien cordialement,\nMamadou Diallo`,
      tone: 'chaleureux_mok',
      language: 'Français',
      callToAction: 'Demande d\'échange direct',
      lastEditedAt: 'À l\'instant'
    });
  } else if (isClient) {
    approachDocuments.push({
      id: `doc-prop-${opportunity.id}`,
      type: 'proposition_commerciale',
      title: 'Proposition de Valeur & Argumentaire Commercial',
      recipientName: opportunity.contactPerson?.name || 'Direction Générale / Décideur',
      subject: `Proposition de collaboration stratégique : ${opportunity.title}`,
      bodyContent: `Monsieur / Madame le Décideur chez ${opportunity.entity},\n\nFace aux enjeux actuels de votre marché, notre expertise permet de sécuriser vos déploiements tout en optimisant vos marges de façon garantie.\n\nNotre offre de service comprend :\n1. Cadrage et diagnostic opérationnel complet sous 10 jours ouvrés.\n2. Mise en place d'une feuille de route d'exécution avec jalons hebdomadaires transparents.\n3. Garantie de service avec contrat sous séquestre sécurisé Le Monde à Vous.\n\nNous nous tenons à votre disposition pour vous présenter notre étude de cas similaire réalisée pour un groupe leader régional.`,
      tone: 'impact_chiffre',
      language: 'Français',
      callToAction: 'Planifier une session de cadrage technique et budgétaire',
      lastEditedAt: 'À l\'instant'
    });

    approachDocuments.push({
      id: `doc-devis-${opportunity.id}`,
      type: 'devis_preparatoire',
      title: 'Cadre Budgétaire & Devis Préparatoire',
      subject: `Estimation budgétaire indicative — ${opportunity.title}`,
      bodyContent: `Objet : Devis Préparatoire et Modalités d'Intervention\n\nMontant estimé : ${opportunity.compensationOrBudget || 'Sur devis personnalisé'}\nModalités de paiement : 30% au démarrage, 40% au jalon intermédiaire, 30% à la livraison finale sous séquestre.\nDélai de validité de l'offre : 30 jours.`,
      tone: 'professionnel_direct',
      language: 'Français',
      callToAction: 'Validation conjointe du périmètre',
      lastEditedAt: 'À l\'instant'
    });
  } else if (isFunds) {
    approachDocuments.push({
      id: `doc-funds-${opportunity.id}`,
      type: 'dossier_bailleur',
      title: 'Note de Synthèse Exécutive pour le Bailleur / Fonds',
      subject: `Candidature au programme de financement : ${opportunity.title}`,
      bodyContent: `À l'attention du Comité de Sélection de ${opportunity.entity},\n\nNous vous soumettons notre dossier de candidature dans le cadre de ${opportunity.title}.\n\nPoints saillants du projet :\n- Problématique adressée : Structuration durable des corridors économiques et inclusion numérique.\n- Impact mesurable : Création directe d'emplois qualifiés et retour sur investissement social vérifiable.\n- Équipe dirigeante : 8 ans de gouvernance rigoureuse et antécédents 100% vérifiés.\n\nLe dossier complet avec annexes financières et matrice des risques est prêt pour votre examen.`,
      tone: 'courtois_diplomatique',
      language: 'Français',
      callToAction: 'Soumission officielle du dossier',
      lastEditedAt: 'À l\'instant'
    });
  } else {
    // Achats
    approachDocuments.push({
      id: `doc-rfq-${opportunity.id}`,
      type: 'proposition_commerciale',
      title: 'Demande de Cotation & Cahier des Charges Sourcing (RFQ)',
      subject: `Demande de cotation formelle (Incoterms 2020) — ${opportunity.title}`,
      bodyContent: `Cher partenaire ${opportunity.entity},\n\nDans le cadre de notre approvisionnement régulier, nous sollicitons votre meilleure offre de prix et délais de livraison pour : ${opportunity.title}.\n\nConditions souhaitées : CIF / FOB, paiement sécurisé par Lettre de Crédit ou Séquestre Le Monde à Vous.\nMerci de nous transmettre votre fiche technique et vos délais d'expédition.`,
      tone: 'professionnel_direct',
      language: 'Français',
      callToAction: 'Réception de la cotation sous 48h',
      lastEditedAt: 'À l\'instant'
    });
  }

  // Relance douce par défaut
  approachDocuments.push({
    id: `doc-relance-${opportunity.id}`,
    type: 'relance_douce',
    title: 'Modèle de Relance Bienveillante (J+7)',
    subject: `Suite à notre prise de contact — ${opportunity.title}`,
    bodyContent: `Bonjour,\n\nJe me permets de revenir vers vous concernant ma candidature/proposition du [Date] pour ${opportunity.title}.\n\nToujours très enthousiaste à l'idée d'apporter mon expertise à ${opportunity.entity}, je souhaitais m'assurer que vous aviez bien reçu l'ensemble des éléments transmis.\n\nRestant à votre entière disposition pour tout renseignement complémentaire,\nBien cordialement,\nMamadou Diallo`,
    tone: 'courtois_diplomatique',
    language: 'Français',
    callToAction: 'Confirmation de bonne réception',
    lastEditedAt: 'À l\'instant'
  });

  // 5. Five Pitches
  const pitches: ConquestFivePitches = {
    pitch15s: `Je m'appelle Mamadou Diallo, Directeur de Projet avec 8 ans d'expérience dans le déploiement de solutions numériques d'impact en Afrique et à l'international.`,
    pitch30s: `J'accompagne les organisations comme ${opportunity.entity} à concrétiser leurs objectifs sur ${opportunity.title}. Mon atout : une exécution rigoureuse, une équipe rodée et des résultats chiffrés dès le premier mois.`,
    pitch60s: `Bonjour, je suis Mamadou Diallo. En 8 ans de parcours, j'ai piloté des projets majeurs générant plus de 420k$ de valeur et touchant des centaines de milliers d'utilisateurs. Pour ${opportunity.entity}, je combine architecture technique d'élite et gestion humaine pragmatique afin de garantir le plein succès de ${opportunity.title}. Je vous propose un premier échange pour vous montrer nos réalisations.`,
    pitchProject: `Notre projet répond à un besoin critique du marché en combinant conformité internationale et efficacité locale. Nous avons déjà validé notre preuve de concept et notre gouvernance financière est certifiée. Avec le soutien de ${opportunity.entity}, nous pouvons démultiplier cet impact sur toute la sous-région.`,
    pitchClient: `Nous ne vendons pas des heures, nous garantissons des livrables sécurisés sous séquestre. En travaillant avec nous sur ${opportunity.title}, vous gagnez en sérénité, réduisez vos coûts de 20% et bénéficiez d'une traçabilité totale étape par étape.`
  };

  // 6. Video Script Data
  const videoScript: ConquestVideoScriptData = {
    id: `script-${opportunity.id}`,
    title: `Script Vidéo de Présentation — ${opportunity.title}`,
    targetDurationSeconds: 60,
    teleprompterSpeedWPM: 130,
    introHook: `Bonjour ! Si vous recherchez un professionnel déterminé et expérimenté pour faire réussir ${opportunity.title}, vous êtes au bon endroit.`,
    corePitchPoints: [
      `En 8 ans de pratique, j'ai transformé des défis opérationnels complexes en réussites mesurables.`,
      `Pour ${opportunity.entity}, j'apporte une double compétence rare : rigueur technique d'un côté, et vision business partenariale de l'autre.`,
      `Je m'engage sur des résultats concrets, vérifiés et documentés.`
    ],
    closingCallToAction: `Découvrez mon dossier complet et planifions notre premier échange dès cette semaine. À très bientôt !`,
    fullScriptText: `Bonjour !\n\nSi vous recherchez un professionnel déterminé et expérimenté pour faire réussir ${opportunity.title} chez ${opportunity.entity}, vous êtes au bon endroit.\n\nEn 8 ans de pratique, j'ai transformé des défis opérationnels complexes en réussites mesurables, notamment en pilotant des équipes de 16 experts et en générant des gains d'efficacité de 45%.\n\nPour ${opportunity.entity}, j'apporte une double compétence rare : la rigueur d'exécution d'un côté, et la vision stratégique partenariale de l'autre.\n\nJe m'engage sur des résultats concrets, vérifiés et documentés.\n\nDécouvrez mon dossier complet et planifions notre premier échange dès cette semaine. À très bientôt !`,
    suggestedPostureTips: [
      'Regarder directement la caméra (hauteur des yeux) pour créer la confiance',
      'Sourire franc au début et à la fin du script',
      'Articuler distinctement chaque chiffre clé (8 ans, 45%, 16 experts)',
      'Garder un fond neutre et bien éclairé'
    ]
  };

  // 7. Checklist
  const checklist: ConquestChecklistItem[] = [
    {
      id: 'chk-cv',
      category: 'document',
      label: 'CV Contextualisé & Alignement Mots-Clés',
      description: 'Adapter le CV maître aux exigences spécifiques de l\'offre.',
      isCompleted: true,
      isRequiredForSubmission: true,
      linkedActionType: 'edit_cv'
    },
    {
      id: 'chk-letter',
      category: 'document',
      label: 'Lettre / Message d\'Accroche Personnalisé',
      description: 'Rédiger une lettre percutante mentionnant des accomplissements chiffrés.',
      isCompleted: true,
      isRequiredForSubmission: true,
      linkedActionType: 'edit_letter'
    },
    {
      id: 'chk-pieces',
      category: 'verification',
      label: 'Pièces Justificatives & Attestations',
      description: 'Vérifier la validité des diplômes, certificats et références.',
      isCompleted: true,
      isRequiredForSubmission: true,
      linkedActionType: 'check_pieces'
    },
    {
      id: 'chk-oral-pitch',
      category: 'oral',
      label: 'Maîtrise du Pitch 30s & 60s',
      description: 'S\'entraîner à exprimer clairement sa valeur ajoutée.',
      isCompleted: false,
      isRequiredForSubmission: false,
      linkedActionType: 'teleprompter'
    },
    {
      id: 'chk-coach-sim',
      category: 'simulation',
      label: 'Simulation Coach 3D Réussie (Score ≥ 8/10)',
      description: 'Passer au moins une simulation d\'entretien interactive avec le Coach.',
      isCompleted: false,
      isRequiredForSubmission: false,
      linkedActionType: 'practice_coach'
    },
    {
      id: 'chk-quality',
      category: 'verification',
      label: 'Contrôle Qualité & Validation Humaine',
      description: 'Relecture finale par l\'utilisateur avant toute transmission.',
      isCompleted: false,
      isRequiredForSubmission: true,
      linkedActionType: 'view_flash'
    }
  ];

  // 8. Quality Control
  const qualityControl: QualityControlVerification = {
    isTargetRecipientVerified: true,
    isOpportunityMatchingVerified: true,
    areAllRequiredDocsAttached: true,
    isLanguageAndSpellingClean: true,
    isPersonalDataProtected: true,
    isFormatCompliant: true,
    isHumanValidated: false
  };

  // 9. Quick Meeting Flash Card
  const quickMeetingFlashCard: QuickMeetingFlashCard = {
    opportunityTitle: opportunity.title,
    entityName: opportunity.entity,
    interlocutorName: opportunity.contactPerson?.name || 'Le Recruteur / Décideur',
    interlocutorRole: opportunity.contactPerson?.role || 'Directeur / Responsable du projet',
    meetingObjective: isJob 
      ? 'Démontrer la pertinence de mon profil et décrocher l\'étape finale de sélection.'
      : isClient
      ? 'Cadrer le besoin client, traiter les objections et convenir d\'une proposition formelle.'
      : 'Présenter la solidité du projet et valider les critères d\'éligibilité.',
    threeMustNotForget: [
      'Citer l\'exemple concret de projet déployé sur 3 pays avec +45% d\'impact.',
      'Rappeler la disponibilité rapide et la flexibilité d\'organisation.',
      'Poser 2 questions stratégiques sur les priorités du premier trimestre.'
    ],
    flashPitchToDeliver: pitches.pitch30s,
    probableQuestionsAndBestAnswers: [
      {
        question: `Pourquoi devrions-nous vous choisir vous plutôt qu'un autre candidat pour ${opportunity.title} ?`,
        punchline: `Parce que je ne viens pas pour apprendre mais pour produire : mes 8 ans d'antécédents vérifiés et mes méthodes garantissent des résultats mesurables dès le premier mois.`
      },
      {
        question: 'Comment gérez-vous les imprévus ou les tensions dans une équipe ?',
        punchline: 'Par la clarté des objectifs, la transparence des données et une écoute active sans compromis sur la qualité finale.'
      },
      {
        question: 'Quelles sont vos prétentions salariales / budgétaires ?',
        punchline: `Mon positionnement est aligné sur le marché et la valeur apportée (${opportunity.compensationOrBudget || 'sur la base de nos standards'}), tout en restant ouvert à une structuration incentivée à la performance.`
      }
    ],
    negotiationBorders: {
      target: opportunity.compensationOrBudget || 'Tarif cible optimal',
      walkAwayMin: '90% du tarif cible avec contreparties (télétravail, formation, bonus)',
      leveragePoints: [
        'Disponibilité opérationnelle immédiate',
        'Garantie d\'exécution et antécédents certifiés Le Monde à Vous',
        'Polyvalence bilingue et multi-pays'
      ]
    },
    usefulDocsAttached: [
      'CV Contextualisé',
      'Lettre de motivation / Proposition',
      'Certificat de conformité Le Monde à Vous',
      '2 Recommandations professionnelles'
    ]
  };

  return {
    id: `dossier-${opportunity.id}`,
    opportunityId: opportunity.id,
    opportunity: opportunity,
    createdAt: new Date().toISOString(),
    lastActiveAt: 'À l\'instant',
    gapAnalysis5D,
    preparationScore,
    contextualResume,
    approachDocuments,
    portfolioSelectionIds: ['case-corridor', 'case-escrow'],
    pitches,
    videoScript,
    simulationHistory: [],
    checklist,
    qualityControl,
    quickMeetingFlashCard,
    actionStatus: 'en_preparation',
    responsesReceived: []
  };
}
