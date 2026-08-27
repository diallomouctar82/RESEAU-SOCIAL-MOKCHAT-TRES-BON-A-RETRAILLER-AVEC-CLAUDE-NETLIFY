import { 
  CareerLiveDossier, 
  CareerTimelineEvent, 
  CareerNextBestAction, 
  CareerFollowUpStrategy, 
  CareerScheduledMeeting, 
  CareerDailyWeeklyBriefing,
  CareerPlanBRecommendation,
  RadarOpportunityItem,
  OpportunityUniverse
} from '../types';

export const INITIAL_LIVE_DOSSIERS: CareerLiveDossier[] = [
  // 1. EMPLOI : TechCorp Africa - Lead Architect Cloud (Entretien Demain !)
  {
    id: 'dos-emp-01',
    opportunityId: 'opp-job-1',
    title: 'Lead Architect Cloud & Systèmes Distribués',
    entityName: 'TechCorp Africa',
    entityLogoUrl: 'https://images.unsplash.com/photo-1549923746-c502d488b3ea?w=100&auto=format&fit=crop&q=80',
    universe: 'emploi',
    opportunityType: 'CDI Hybride (Dakar / Abidjan)',
    status: 'rendez_vous',
    workflowStage: 'Entretien Final & Présentation Technique',
    daysSinceLastContact: 1,
    isStalled: false,
    lastContactDate: 'Hier à 16:30',
    nextActionDueDate: 'Demain à 10:00',
    isUrgentDeadline: true,
    contactPerson: {
      name: 'Mme Awa Sow',
      role: 'Directrice des Ressources Humaines & Talents',
      email: 'a.sow@techcorp-africa.com',
      phone: '+221 77 890 12 34',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
    },
    targetOutcome: 'Décrocher l\'offre CDI à 48 000 000 FCFA / an + pack mobilité',
    matchScore: 94,
    documentsAttached: [
      { id: 'doc-cv-1', name: 'CV_Contextuel_Lead_Cloud_2026.pdf', type: 'CV Sur-Mesure', date: '20 Août 2026' },
      { id: 'doc-let-1', name: 'Note_Impact_Architectures_Distribuées.pdf', type: 'Note d\'Impact', date: '21 Août 2026' },
      { id: 'doc-cert-1', name: 'Certificat_Diallo_Cloud_Architect.pdf', type: 'Attestation Jumeau', date: '22 Août 2026' }
    ],
    timeline: [
      {
        id: 'tl-101',
        date: '18 Août 2026',
        formattedTime: '09:15',
        type: 'opportunite_detectee',
        title: 'Détection Radar Opportunité 94% Match',
        description: 'Repéré via l\'Agent de Veille Continue sur l\'axe Dakar / Abidjan.',
        author: 'system_diallo'
      },
      {
        id: 'tl-102',
        date: '20 Août 2026',
        formattedTime: '14:20',
        type: 'dossier_prepare',
        title: 'Salle de Préparation & Validation Quality Gate',
        description: 'CV contextuel et Note d\'impact validés par l\'utilisateur.',
        author: 'user'
      },
      {
        id: 'tl-103',
        date: '21 Août 2026',
        formattedTime: '10:00',
        type: 'candidature_validee',
        title: 'Candidature Transmise avec Jumeau Numérique',
        description: 'Dossier complet adressé à Mme Awa Sow.',
        author: 'user'
      },
      {
        id: 'tl-104',
        date: '23 Août 2026',
        formattedTime: '11:45',
        type: 'accuse_reception',
        title: 'Accusé de Réception & Présélection Validée',
        description: '« Votre profil correspond exactement à nos critères stratégiques. »',
        author: 'interlocutor',
        authorName: 'Mme Awa Sow'
      },
      {
        id: 'tl-105',
        date: '25 Août 2026',
        formattedTime: '15:10',
        type: 'demande_complement',
        title: 'Demande de Schéma d\'Architecture de Référence',
        description: 'L\'équipe technique souhaite un exemple de passage à l\'échelle multi-cloud.',
        author: 'interlocutor',
        authorName: 'M. Ousmane Diop (CTO)'
      },
      {
        id: 'tl-106',
        date: '26 Août 2026',
        formattedTime: '09:30',
        type: 'message_envoye',
        title: 'Schéma & Cas d\'Usage Transmis',
        description: 'Envoi du document de référence validé via Diallo OS.',
        author: 'user'
      },
      {
        id: 'tl-107',
        date: '26 Août 2026',
        formattedTime: '16:30',
        type: 'rendez_vous_fixe',
        title: 'Entretien Final Programmé avec la Direction',
        description: 'Invitation reçue pour la soutenance technique et l\'offre salariale.',
        author: 'interlocutor',
        authorName: 'Mme Awa Sow'
      }
    ],
    nextBestAction: {
      actionType: 'entrainer_oral',
      headline: 'Répéter les 3 arguments majeurs et la grille salariale',
      detailedReason: 'Votre entretien final a lieu demain à 10h00 avec le CTO et la DRH. Votre fiche flash et vos 5 points de négociation sont prêts.',
      recommendedDeadline: 'Ce soir avant 20h00',
      urgencyLevel: 'critique',
      suggestedDraftContent: 'Consulter la Fiche Flash J-0 et lancer une simulation 5 min sur le Coach 3D.'
    },
    followUpStrategy: {
      totalFollowUpsSent: 0,
      maxRecommendedFollowUps: 2,
      daysSinceLastExchange: 1,
      recommendedDelayDays: 3,
      antiSpamVerdict: 'attendre_delai_courtois',
      antiSpamExplanation: 'L\'entretien est programmé pour demain. Tout contact intermédiaire est inutile et pourrait être perçu comme intrusif.',
      suggestedAngle: 'Remerciement chaleureux post-entretien demain après-midi.',
      draftTemplate: {
        subject: 'Remerciements suite à notre échange de ce matin - Lead Architect',
        body: 'Bonjour Mme Sow, Je tiens à vous remercier ainsi que M. Diop pour la richesse de notre échange ce matin...',
        valuePropositionAdded: 'Récapitulatif des 3 chantiers prioritaires à engager dès le premier mois.'
      }
    },
    upcomingMeeting: {
      id: 'meet-101',
      dossierId: 'dos-emp-01',
      title: 'Grand Oral Technique & Discussion Package Salarial',
      entityName: 'TechCorp Africa',
      interlocutor: {
        name: 'Mme Awa Sow & M. Ousmane Diop',
        role: 'DRH & Chief Technology Officer',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
      },
      date: 'Demain (28 Août 2026)',
      time: '10:00 - 11:15 GMT',
      meetingType: 'entretien_embauche',
      locationOrLink: 'Google Meet (Lien dans le dossier)',
      isCompleted: false,
      flashPrepCard: {
        objective: 'Convaincre sur la maîtrise des coûts cloud (-35%) et valider un salaire cible de 48M FCFA/an.',
        contextSummary: 'TechCorp accélère sa migration sur 4 pays de la zone UEMOA. Ils ont besoin d\'un leader capable d\'aligner ingénieurs et rentabilité financière.',
        threeKeyArguments: [
          'Réduction prouvée de 40% des temps de latence inter-agences.',
          'Expérience de formation de 15 développeurs juniors en 6 mois.',
          'Double certification Cloud Architecture & Sécurité ISO 27001.'
        ],
        probableQuestions: [
          { question: 'Comment gérez-vous une coupure réseau transfrontalière critique ?', punchline: 'Mise en place d\'un fallback local avec synchronisation asynchrone sécurisée.' },
          { question: 'Quelles sont vos prétentions exactes ?', punchline: '48M FCFA annuel, avec prime d\'intéressement sur l\'optimisation de l\'infrastructure.' }
        ],
        questionsToAsk: [
          'Quel est le niveau d\'autonomie de l\'équipe sur le choix des briques open-source ?',
          'Quelles sont les priorités de déploiement pour le 4ème trimestre ?'
        ],
        targetOutcome: 'Accord de principe sur l\'offre ferme sous 48 heures.',
        keyDocsToHaveReady: ['CV Contextuel', 'Schéma d\'Architecture Multi-Pays', 'Grille de Compétences Jumeau']
      }
    },
    notes: [
      'M. Diop a particulièrement apprécié l\'approche souveraine des données UEMOA.',
      'Rappel : mentionner la disponibilité immédiate sous 15 jours.'
    ],
    isPrivate: true
  },

  // 2. CLIENTS B2B : Groupe Hôtelier Bano - Digitalisation & Bornes Interactives (À Relancer !)
  {
    id: 'dos-cli-02',
    opportunityId: 'opp-client-1',
    title: 'Digitalisation Accueil & Bornes Tactiles Multilingues',
    entityName: 'Groupe Hôtelier Bano',
    entityLogoUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=100&auto=format&fit=crop&q=80',
    universe: 'clients',
    opportunityType: 'Contrat B2B Forfait + Maintenance (18 500 €)',
    status: 'a_relancer',
    workflowStage: 'Devis & Proposition Transmise (Sans retour depuis 8 jours)',
    daysSinceLastContact: 8,
    isStalled: false,
    lastContactDate: '19 Août 2026',
    nextActionDueDate: 'Aujourd\'hui',
    isUrgentDeadline: true,
    contactPerson: {
      name: 'M. Mamadou Bano Diallo',
      role: 'Directeur Général des Opérations',
      email: 'm.diallo@hotelbano-resort.com',
      phone: '+224 622 11 22 33',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80'
    },
    targetOutcome: 'Signature du bon de commande de 18 500 € avec acompte de 40%',
    matchScore: 91,
    documentsAttached: [
      { id: 'doc-prop-1', name: 'Proposition_Commerciale_Bano_2026.pdf', type: 'Devis & Cahier des charges', date: '18 Août 2026' },
      { id: 'doc-dem-1', name: 'Demonstration_Interactive_Mockup.pdf', type: 'Maquette UI', date: '19 Août 2026' }
    ],
    timeline: [
      {
        id: 'tl-201',
        date: '14 Août 2026',
        formattedTime: '11:00',
        type: 'opportunite_detectee',
        title: 'Appel à projet B2B détecté',
        description: 'Modernisation des 3 complexes hôteliers de Conakry et Kamsar.',
        author: 'system_diallo'
      },
      {
        id: 'tl-202',
        date: '16 Août 2026',
        formattedTime: '15:30',
        type: 'rendez_vous_effectue',
        title: 'Rendez-vous Découverte avec M. Bano Diallo',
        description: 'Compréhension du besoin : accueil rapide des voyageurs d\'affaires et touristes internationaux.',
        author: 'user'
      },
      {
        id: 'tl-203',
        date: '19 Août 2026',
        formattedTime: '17:00',
        type: 'message_envoye',
        title: 'Envoi du Devis Détaillé & Maquette interactive',
        description: 'Montant : 18 500 € TTC avec délai de livraison sous 45 jours.',
        author: 'user'
      },
      {
        id: 'tl-204',
        date: '27 Août 2026',
        formattedTime: '08:00',
        type: 'note_privee',
        title: 'Délai d\'attente de 8 jours atteint',
        description: 'L\'IA recommande une relance polie apportant une nouvelle valeur sur la gestion hors-ligne.',
        author: 'system_diallo'
      }
    ],
    nextBestAction: {
      actionType: 'relancer',
      headline: 'Envoyer la relance polie avec l\'argument de continuité hors-ligne',
      detailedReason: 'Cela fait 8 jours que le devis a été envoyé sans retour. M. Bano avait mentionné que la décision devait être prise avant la fin du mois.',
      recommendedDeadline: 'Aujourd\'hui avant 16h00',
      urgencyLevel: 'prioritaire',
      suggestedDraftContent: 'Brouillon prêt : "Bonjour M. Diallo, je me permets de revenir vers vous avec une précision importante sur la continuité de service lors des coupures d\'énergie..."'
    },
    followUpStrategy: {
      totalFollowUpsSent: 0,
      maxRecommendedFollowUps: 3,
      daysSinceLastExchange: 8,
      recommendedDelayDays: 7,
      antiSpamVerdict: 'pret_a_relancer',
      antiSpamExplanation: 'Délai raisonnable (8 jours) atteint. Une relance apportant un complément technique est hautement opportune.',
      suggestedAngle: 'Sécurité d\'exploitation : fonctionnement des bornes en mode autonome hors-connexion.',
      draftTemplate: {
        subject: 'Complément technique suite à notre proposition - Bornes interactives Groupe Bano',
        body: 'Cher M. Bano Diallo,\n\nJ\'espère que vous allez bien.\n\nEn complément de notre devis transmis le 19 août, notre équipe a finalisé un module d\'autonomie locale qui permet aux bornes d\'enregistrer les passagers même en cas de coupure temporaire d\'Internet.\n\nSouhaitez-vous que nous fassions un point rapide de 10 minutes ce jeudi ou vendredi pour caler les derniers détails avant validation ?\n\nBien cordialement,',
        valuePropositionAdded: 'Garantie de zéro interruption d\'accueil des clients VIP.'
      }
    },
    notes: [
      'Le client est très sensible à la robustesse électrique et réseau.',
      'Prévoir un paiement en 3 tranches (40% commande, 40% livraison, 20% recette).'
    ],
    isPrivate: true
  },

  // 3. FONDS & BOURSES : Bourse d'Accélération CEDEAO Innovation (Urgent : Ferme dans 48h !)
  {
    id: 'dos-fon-03',
    opportunityId: 'opp-fund-1',
    title: 'Bourse d\'Excellence Innovation & Agro-Tech CEDEAO',
    entityName: 'Fonds Spécial CEDEAO / BAD',
    entityLogoUrl: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?w=100&auto=format&fit=crop&q=80',
    universe: 'fonds',
    opportunityType: 'Subvention Non Remboursable (35 000 USD)',
    status: 'urgent',
    workflowStage: 'Dernière pièce manquante : Attestation Bancaire & Business Plan V2',
    daysSinceLastContact: 2,
    isStalled: false,
    lastContactDate: '25 Août 2026',
    nextActionDueDate: 'Demain avant 23:59 GMT (Clôture)',
    isUrgentDeadline: true,
    contactPerson: {
      name: 'Secrétariat du Comité d\'Attribution',
      role: 'Pôle Financements & Émergence Régionale',
      email: 'grants-2026@cedeao-innovation.org',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'
    },
    targetOutcome: 'Obtenir l\'octroi de la subvention de 35 000 USD pour l\'achat d\'équipements',
    matchScore: 89,
    documentsAttached: [
      { id: 'doc-fnd-1', name: 'Formulaire_Officiel_Candidature_CEDEAO.pdf', type: 'Formulaire de candidature', date: '22 Août 2026' },
      { id: 'doc-fnd-2', name: 'Pitch_Deck_AgroTech_Diallo.pdf', type: 'Présentation de projet', date: '24 Août 2026' }
    ],
    timeline: [
      {
        id: 'tl-301',
        date: '10 Août 2026',
        formattedTime: '10:00',
        type: 'opportunite_detectee',
        title: 'Détection Bourse d\'Excellence CEDEAO',
        description: 'Subvention de 35 000 USD pour projets à fort impact économique local.',
        author: 'system_diallo'
      },
      {
        id: 'tl-302',
        date: '22 Août 2026',
        formattedTime: '16:00',
        type: 'dossier_prepare',
        title: 'Génération du Dossier Bailleurs & Budgétisation',
        description: 'Modélisation du plan de trésorerie et retour sur investissement social.',
        author: 'user'
      },
      {
        id: 'tl-303',
        date: '25 Août 2026',
        formattedTime: '14:00',
        type: 'demande_complement',
        title: 'Notification du jury : Pièce justificative manquante',
        description: 'Téléverser l\'attestation de domiciliation bancaire et l\'annexe d\'impact.',
        author: 'interlocutor',
        authorName: 'Secrétariat CEDEAO'
      }
    ],
    nextBestAction: {
      actionType: 'envoyer_pieces',
      headline: 'Téléverser l\'attestation bancaire et valider la soumission définitive',
      detailedReason: 'L\'appel ferme irrévocablement dans 48 heures. Tout retard disqualifiera automatiquement le dossier.',
      recommendedDeadline: 'Aujourd\'hui avant 18h00',
      urgencyLevel: 'critique',
      suggestedDraftContent: 'Télécharger l\'attestation générée dans Wallet & Finance puis valider le bouton de soumission.',
      suggestedExpert: {
        expertName: 'Dr. Thierno Diallo',
        expertRole: 'Expert Finance & Montage de Projets',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
        moduleLink: 'expert_council',
        contactReason: 'Relecture finale de l\'annexe financière avant soumission.'
      }
    },
    followUpStrategy: {
      totalFollowUpsSent: 0,
      maxRecommendedFollowUps: 1,
      daysSinceLastExchange: 2,
      recommendedDelayDays: 14,
      antiSpamVerdict: 'attendre_delai_courtois',
      antiSpamExplanation: 'Le jury délibérera entre le 1er et le 15 septembre. Aucune relance avant la date officielle de publication des résultats.',
      suggestedAngle: 'Attendre la proclamation officielle des lauréats.',
      draftTemplate: {
        subject: 'Confirmation de dépôt complet - Dossier #CED-2026-894',
        body: 'Madame, Monsieur, nous confirmons la transmission de l\'ensemble des pièces...',
        valuePropositionAdded: 'Impact mesuré : 40 emplois ruraux directs créés.'
      }
    },
    notes: [
      'Projet soutenu par 2 coopératives agricoles régionales.',
      'Vérifier que les montants sont bien convertis au cours USD/FCFA officiel.'
    ],
    isPrivate: true
  },

  // 4. ACHATS & SOURCING : Fournisseur Panneaux Solaires Monocristallins (En Attente Devis)
  {
    id: 'dos-ach-04',
    opportunityId: 'opp-supplier-1',
    title: 'Sourcing 500 Panneaux Solaires 550W Tier 1',
    entityName: 'Sino-African Green Power Ltd',
    entityLogoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=100&auto=format&fit=crop&q=80',
    universe: 'achats',
    opportunityType: 'Achat de Gros & Logistique CIF Port Conakry',
    status: 'en_attente',
    workflowStage: 'Demande de Cotation & Spécifications IEC transmises',
    daysSinceLastContact: 3,
    isStalled: false,
    lastContactDate: '24 Août 2026',
    nextActionDueDate: '29 Août 2026',
    isUrgentDeadline: false,
    contactPerson: {
      name: 'Mr. Zhang Wei & Kevin Barry',
      role: 'Responsables Export Afrique de l\'Ouest',
      email: 'sales-westafrica@sino-greenpower.com',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=80'
    },
    targetOutcome: 'Obtenir un tarif unitaire < 0,11 $/Watt CIF avec garantie constructeur 25 ans',
    matchScore: 88,
    documentsAttached: [
      { id: 'doc-ach-1', name: 'RFQ_Panneaux_Solaires_550W_Specs.pdf', type: 'Cahier des charges RFQ', date: '24 Août 2026' }
    ],
    timeline: [
      {
        id: 'tl-401',
        date: '20 Août 2026',
        formattedTime: '15:00',
        type: 'opportunite_detectee',
        title: 'Fournisseur Certifié Tier-1 identifié sur Marché Mondial',
        description: 'Éligibilité vérifiée avec audits d\'usines conformes.',
        author: 'system_diallo'
      },
      {
        id: 'tl-402',
        date: '24 Août 2026',
        formattedTime: '10:30',
        type: 'message_envoye',
        title: 'Demande de Cotation CIF Conakry Transmise',
        description: 'Volume cible : 1 conteneur 40 pieds HC (500 panneaux).',
        author: 'user'
      }
    ],
    nextBestAction: {
      actionType: 'attendre',
      headline: 'Attendre le retour de chiffrage maritime sous 48h',
      detailedReason: 'Le délai normal de cotation fret + usine pour ce volume est de 4 à 5 jours ouvrés. Aucun geste requis pour le moment.',
      recommendedDeadline: '29 Août 2026',
      urgencyLevel: 'normale',
      suggestedDraftContent: 'Le fournisseur traite actuellement avec sa compagnie maritime (Maersk / CMA CGM).'
    },
    followUpStrategy: {
      totalFollowUpsSent: 0,
      maxRecommendedFollowUps: 2,
      daysSinceLastExchange: 3,
      recommendedDelayDays: 5,
      antiSpamVerdict: 'attendre_delai_courtois',
      antiSpamExplanation: 'Délai standard de cotation industrielle non dépassé. Garder une posture d\'acheteur rigoureux sans précipitation.',
      suggestedAngle: 'Demande courtoise de confirmation de réception de l\'Incoterm CIF.',
      draftTemplate: {
        subject: 'Suivi RFQ #SOL-2026 - Panneaux 550W CIF Conakry',
        body: 'Bonjour M. Barry, j\'espère que votre semaine se déroule bien. Nous attendons votre retour de cotation avant d\'engager la lettre de crédit...',
        valuePropositionAdded: 'Confirmation de commande ferme dès validation des fiches techniques.'
      }
    },
    notes: [
      'Exiger un certificat d\'inspection SGS avant embarquement.',
      'Possibilité de coupler avec le module Marché Mondial pour le suivi douanier.'
    ],
    isPrivate: true
  },

  // 5. DOSSIER BLOQUÉ : Smart logistics SARL - Partenariat Distribution (>24 jours sans nouvelle)
  {
    id: 'dos-bloq-05',
    opportunityId: 'opp-stalled-1',
    title: 'Accord Cadre de Sous-Traitance Logistique',
    entityName: 'Smart Logistics SARL',
    entityLogoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=100&auto=format&fit=crop&q=80',
    universe: 'clients',
    opportunityType: 'Partenariat Commercial & Répartition de Flux',
    status: 'bloque',
    workflowStage: 'En attente depuis 24 jours après premier pitch',
    daysSinceLastContact: 24,
    isStalled: true,
    lastContactDate: '3 Août 2026',
    nextActionDueDate: 'Décision Stratégique Requise',
    isUrgentDeadline: false,
    contactPerson: {
      name: 'M. Ibrahim Camara',
      role: 'Directeur du Développement',
      email: 'i.camara@smartlogistics.gn',
      avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&auto=format&fit=crop&q=80'
    },
    targetOutcome: 'Signer un contrat cadre de flux logistiques mensuels',
    matchScore: 78,
    documentsAttached: [
      { id: 'doc-blo-1', name: 'Presentation_Partenariat_Logistique.pdf', type: 'Pitch Partenaire', date: '3 Août 2026' }
    ],
    timeline: [
      {
        id: 'tl-501',
        date: '1er Août 2026',
        formattedTime: '10:00',
        type: 'opportunite_detectee',
        title: 'Prise de contact initiée',
        description: 'Premier échange prometteur lors du Forum Économique.',
        author: 'user'
      },
      {
        id: 'tl-502',
        date: '3 Août 2026',
        formattedTime: '14:00',
        type: 'message_envoye',
        title: 'Envoi du protocole d\'accord préliminaire',
        description: 'Dossier transmis par email à M. Camara.',
        author: 'user'
      },
      {
        id: 'tl-503',
        date: '12 Août 2026',
        formattedTime: '09:00',
        type: 'relance_envoyee',
        title: 'Relance J+9 envoyée sans réponse',
        description: 'Message courtois demandant si un échange était possible.',
        author: 'user'
      },
      {
        id: 'tl-504',
        date: '27 Août 2026',
        formattedTime: '08:00',
        type: 'note_privee',
        title: 'Détection Dossier Bloqué (24 jours d\'inactivité)',
        description: 'L\'Agent de Continuité signale un silence prolongé et propose soit une ultime relance de rupture, soit l\'activation d\'un Plan B.',
        author: 'system_diallo'
      }
    ],
    nextBestAction: {
      actionType: 'action_plan_b',
      headline: 'Activer le Plan B ou envoyer le message de clôture courtoise',
      detailedReason: 'Ce dossier n\'a pas évolué depuis 24 jours malgré une première relance. Continuer à attendre consomme de la charge mentale.',
      recommendedDeadline: 'Sous 48h',
      urgencyLevel: 'normale',
      suggestedDraftContent: 'Message de rupture professionnelle bienveillante ou réallocation du temps sur 2 autres prospects chauds du Radar.'
    },
    followUpStrategy: {
      totalFollowUpsSent: 1,
      maxRecommendedFollowUps: 2,
      daysSinceLastExchange: 24,
      recommendedDelayDays: 0,
      antiSpamVerdict: 'ne_pas_harceler_cloturer',
      antiSpamExplanation: 'Silence de plus de 3 semaines après relance. Tout nouveau message standard serait contre-productif. Proposer un "break-up email" élégant.',
      suggestedAngle: 'Clôture élégante : "J\'en déduis que ce n\'est pas la priorité du moment, gardons le contact pour 2027."',
      draftTemplate: {
        subject: 'Clôture de notre dossier - Partenariat logistique',
        body: 'Cher M. Camara,\n\nSans nouvelles de votre part suite à mon message du 12 août, je suppose que vos priorités ont évolué ou que ce projet n\'est pas d\'actualité pour ce trimestre.\n\nJe me permets donc de clôturer ce dossier de notre côté pour ne pas vous encombrer. Je reste à votre disposition si le besoin se représentait à l\'avenir.\n\nTrès bonne continuation,',
        valuePropositionAdded: 'Libération d\'attention et posture de haute valeur professionnelle.'
      }
    },
    notes: [
      'Deux opportunités de substitution disponibles dans le Radar : Groupe Guicopres et Bolloré Transports.'
    ],
    isPrivate: true
  }
];

export const INITIAL_BRIEFING_DATA: CareerDailyWeeklyBriefing = {
  todayDate: 'Jeudi 27 Août 2026',
  dailyTopPriorities: [
    {
      id: 'prio-1',
      time: '10:00 Demain',
      title: 'Grand Oral Final & Package Salarial',
      entity: 'TechCorp Africa',
      category: 'rendez_vous',
      dossierId: 'dos-emp-01',
      actionLabel: 'Répéter avec Fiche Flash J-0',
      urgency: 'critique',
      whyImportant: 'Entretien décisif pour l\'offre CDI à 48M FCFA.'
    },
    {
      id: 'prio-2',
      time: 'Avant 18h00',
      title: 'Pièce justificative Bourse CEDEAO (35 000 $)',
      entity: 'Fonds Spécial CEDEAO',
      category: 'document',
      dossierId: 'dos-fon-03',
      actionLabel: 'Téléverser l\'Attestation Bancaire',
      urgency: 'critique',
      whyImportant: 'Clôture irrévocable de l\'appel à projets dans 48h.'
    },
    {
      id: 'prio-3',
      time: 'Cet après-midi',
      title: 'Relance Devis Bornes Interactives (18 500 €)',
      entity: 'Groupe Hôtelier Bano',
      category: 'relance',
      dossierId: 'dos-cli-02',
      actionLabel: 'Envoyer Relance IA avec Valeur Ajoutée',
      urgency: 'haute',
      whyImportant: 'Délai de 8 jours atteint sans retour, décision prévue fin de mois.'
    },
    {
      id: 'prio-4',
      time: 'Optionnel',
      title: 'Arbitrage Dossier Bloqué (24 jours)',
      entity: 'Smart Logistics SARL',
      category: 'echeance',
      dossierId: 'dos-bloq-05',
      actionLabel: 'Clôturer et Activer Plan B',
      urgency: 'normale',
      whyImportant: 'Libérer la charge mentale et transférer les assets sur 2 pistes actives.'
    }
  ],
  tomorrowBriefing: {
    date: 'Vendredi 28 Août 2026',
    meetingsCount: 1,
    urgentDeadlines: 1,
    keyActions: [
      '10:00 - Entretien Final TechCorp Africa (Durée 1h15)',
      '15:00 - Point de suivi proposition Groupe Bano si relancé aujourd\'hui',
      '23:59 - Clôture officielle Bourse CEDEAO'
    ],
    flashPrepDossierIds: ['dos-emp-01', 'dos-fon-03']
  },
  weeklyBriefing: {
    weekRange: 'Semaine du 24 au 30 Août 2026',
    mainStrategicGoal: 'Transformer l\'opportunité TechCorp en CDI et sécuriser le financement CEDEAO.',
    keyMilestones: [
      'Jalon 1 : Finaliser l\'oral TechCorp avec négociation package.',
      'Jalon 2 : Dépôt 100% conforme du dossier CEDEAO avant clôture.',
      'Jalon 3 : Relance structurée des 2 devis B2B en cours.'
    ],
    followUpsDueCount: 1,
    meetingsPlannedCount: 1,
    stalledDossiersToResolveCount: 1
  },
  careerPulse: {
    goalHeadline: 'Directeur Technique / Lead Architect & Consultant B2B',
    progressPercent: 78,
    activeDossiersCount: 5,
    awaitingRepliesCount: 2,
    followUpsDueCount: 1,
    meetingsThisWeekCount: 1,
    urgentTodayCount: 2,
    certifiedResultsCount: 3,
    nextBestActionGlobal: {
      title: 'Répéter l\'entretien TechCorp Africa',
      subtitle: 'Entretien prévu demain à 10h00 avec la DRH et le CTO. Fiche Flash et Coach 3D prêts.',
      dossierId: 'dos-emp-01',
      actionType: 'entrainer_oral'
    }
  }
};

export const generatePlanBForDossier = (dossier: CareerLiveDossier): CareerPlanBRecommendation => {
  return {
    failedDossierId: dossier.id,
    entityName: dossier.entityName,
    opportunityTitle: dossier.title,
    keyLearningsExtracted: [
      `Votre proposition technique sur "${dossier.title}" est solide et a été certifiée par le Jumeau Numérique.`,
      `Le temps de réponse supérieur à ${dossier.daysSinceLastContact} jours indique une contrainte budgétaire ou organisationnelle propre à ${dossier.entityName}, et non un défaut de compétence.`,
      `L'ensemble des documents rédigés (CV ciblé, note d'impact, devis) constitue un actif réutilisable immédiatement à 90%.`
    ],
    reusableCapitalAssets: [
      {
        assetName: 'Dossier d\'expertise & Spécifications techniques',
        type: 'dossier',
        description: 'Prêt à être re-projeté sur un autre acteur du même secteur.'
      },
      {
        assetName: 'Pitch 2 minutes & Argumentaire de valeur',
        type: 'pitch',
        description: 'Format rodé mettant en avant le gain de productivité et la sécurité.'
      },
      {
        assetName: 'Grille tarifaire & Cadre contractuel',
        type: 'proposition',
        description: 'Conditions générales et clauses de garantie adaptables en 3 minutes.'
      }
    ],
    alternativeRadarOpportunities: [
      {
        id: 'alt-opp-1',
        title: 'Directeur des Opérations & Partenariats Logistiques',
        entity: 'Groupe Guicopres Transports',
        universe: dossier.universe,
        opportunityType: 'Contrat Cadre B2B ou Poste Exécutif',
        location: 'Conakry & Axe Maritime International',
        locationScope: 'regional',
        country: 'Guinée',
        countryFlag: '🇬🇳',
        description: 'Recherche urgente d\'un partenaire technique pour piloter la modernisation des flux de fret.',
        publicationDate: 'Hier',
        matchScore: 92,
        compatibilityTier: 'Élevée',
        readiness: 'ready_now',
        whyForMe: 'Votre dossier complet est directement transférable avec 92% d\'alignement.',
        matchedStrengths: ['Gestion de flux complexes', 'Négociation B2B', 'Maîtrise régionale'],
        missingCompetencies: [],
        trustScore: 96,
        isVerifiedEntity: true,
        riskLevel: 'safe',
        vaultStatus: 'decouverte',
        sourceType: 'reseau_mok',
        sourceName: 'Signal Fort Réseau MOK'
      },
      {
        id: 'alt-opp-2',
        title: 'Consultant Stratégie Supply Chain & Distribution',
        entity: 'Bolloré Logistics West Africa',
        universe: dossier.universe,
        opportunityType: 'Mission d\'accompagnement 6 mois renouvelable',
        location: 'Abidjan & Dakar',
        locationScope: 'regional',
        country: 'Côte d\'Ivoire',
        countryFlag: '🇨🇮',
        description: 'Mission de cadrage pour l\'intégration de solutions IoT et bornes de suivi en temps réel.',
        publicationDate: 'Il y a 3 jours',
        matchScore: 88,
        compatibilityTier: 'Forte',
        readiness: 'ready_now',
        whyForMe: 'Très forte valorisation de vos compétences en systèmes distribués.',
        matchedStrengths: ['Architecture Cloud', 'Suivi temps réel', 'Leadership'],
        missingCompetencies: [],
        trustScore: 98,
        isVerifiedEntity: true,
        riskLevel: 'safe',
        vaultStatus: 'decouverte',
        sourceType: 'marche_mondial',
        sourceName: 'Marché Mondial B2B'
      }
    ]
  };
};
