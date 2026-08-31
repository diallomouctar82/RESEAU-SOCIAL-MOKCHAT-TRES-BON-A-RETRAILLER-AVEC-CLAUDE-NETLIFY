import { 
  LayoutGrid, 
  FolderKanban, 
  GraduationCap, 
  Languages, 
  Briefcase, 
  HeartPulse, 
  Home as HomeIcon, 
  Wallet, 
  FileText, 
  Scale, 
  Globe, 
  Palette, 
  ShoppingBag, 
  Users, 
  MessageSquare, 
  ShieldCheck, 
  Shield,
  MapPin, 
  HardDrive, 
  Video, 
  Table, 
  Calendar, 
  Sparkles,
  Lock,
  Compass,
  LucideIcon
} from 'lucide-react';

export interface NavItemDef {
  id: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  category: 'Accueil & Cap' | 'Apprendre & Évoluer' | 'Vie & Services' | 'Créer & Entreprendre' | 'Communauté & Conseil';
  description: string;
  keywords: string[];
  badge?: string;
  transversalServices?: string[];
  legacyName?: string;
}

export interface TransversalServiceDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  tabTarget: string;
  integratedIn: string[];
  provider: 'Google Workspace' | 'Diallo Core' | 'Sécurité LMAV';
  status: 'Connecté' | 'Prêt' | 'Actif';
}

export const MAIN_NAV_ITEMS: NavItemDef[] = [
  // ── 1. ACCUEIL & CAP ──
  {
    id: 'home',
    label: 'Accueil',
    shortLabel: 'Accueil',
    icon: LayoutGrid,
    category: 'Accueil & Cap',
    description: 'Briefing quotidien, objectifs actifs, priorités et orchestration Diallo OS.',
    keywords: ['accueil', 'tableau de bord', 'dashboard', 'home', 'demarrer', 'briefing', 'priorites', 'diallo os'],
    legacyName: 'Accueil'
  },
  {
    id: 'parcours',
    label: 'Mon Parcours de Vie',
    shortLabel: 'Parcours',
    icon: FolderKanban,
    category: 'Accueil & Cap',
    description: 'Vision globale de mes dossiers de vie, étapes franchies, jalons et accomplissements.',
    keywords: ['parcours', 'dossier', 'projet', 'etapes', 'jalons', 'accomplissement', 'mon parcours', 'suivi'],
    badge: 'Cap',
    legacyName: 'Mes Parcours / Dossiers'
  },

  // ── 2. APPRENDRE & ÉVOLUER ──
  {
    id: 'campus',
    label: 'Campus & Éducation',
    shortLabel: 'Campus',
    icon: GraduationCap,
    category: 'Apprendre & Évoluer',
    description: 'MOOCs interactifs, programmes éducatifs par pays, examens avec Professeur Diallo.',
    keywords: ['campus', 'cours', 'etudes', 'mooc', 'universite', 'examen', 'diplome', 'professeur', 'maths', 'science', 'informatique', 'formation', 'ecole'],
    transversalServices: ['Google Meet', 'Google Drive'],
    legacyName: 'Campus'
  },
  {
    id: 'languages',
    label: 'Langues & Immersion',
    shortLabel: 'Langues',
    icon: Languages,
    category: 'Apprendre & Évoluer',
    description: 'Apprentissage de 40+ langues mondiales, fiches mnémotechniques, audio natif et conversation.',
    keywords: ['langues', 'anglais', 'francais', 'espagnol', 'arabe', 'wolof', 'chinois', 'allemand', 'vocabulaire', 'traduction', 'immersion', 'accent'],
    legacyName: 'Langue'
  },
  {
    id: 'career',
    label: 'Carrière & Accomplissement',
    shortLabel: 'Carrière',
    icon: Briefcase,
    category: 'Apprendre & Évoluer',
    description: 'GPS trajectoire A➔B, CV maître, décodeur d’offres, simulateur 3D et conquête professionnelle.',
    keywords: ['carriere', 'cv', 'emploi', 'travail', 'job', 'stage', 'recrutement', 'entretien', 'salaire', 'nego', 'opportunite', 'jumeau pro', 'coach'],
    badge: 'Pro',
    transversalServices: ['Google Drive', 'Google Meet', 'Google Maps'],
    legacyName: 'Carrière'
  },

  // ── 3. VIE & SERVICES DU QUOTIDIEN ──
  {
    id: 'health',
    label: 'Santé & Bien-être',
    shortLabel: 'Santé',
    icon: HeartPulse,
    category: 'Vie & Services',
    description: 'Carnet de santé préventif, conseils hygiène de vie du Docteur Diallo, urgences & orientation.',
    keywords: ['sante', 'bien-etre', 'medecin', 'docteur', 'prevention', 'medical', 'ordonnance', 'hopital', 'urgence', 'vaccin', 'nutrition', 'sport'],
    transversalServices: ['Google Maps'],
    legacyName: 'Santé'
  },
  {
    id: 'housing',
    label: 'Habitat & Installation',
    shortLabel: 'Habitat',
    icon: HomeIcon,
    category: 'Vie & Services',
    description: 'Recherche de logement, baux, simulateur APL, accompagnement installation internationale.',
    keywords: ['logement', 'habitat', 'appartement', 'maison', 'location', 'achat', 'loyer', 'caution', 'apl', 'bail', 'quartier', 'installation', 'demenagement'],
    transversalServices: ['Google Maps', 'Google Drive'],
    legacyName: 'Logement'
  },
  {
    id: 'wallet',
    label: 'Finance & Wallet',
    shortLabel: 'Finance',
    icon: Wallet,
    category: 'Vie & Services',
    description: 'Comptes multi-devises, Crédits LMAV, conversion de devises, séquestre et historique sécurisé.',
    keywords: ['finance', 'wallet', 'argent', 'credit', 'devises', 'euro', 'dollar', 'gnf', 'cfa', 'paiement', 'sequestre', 'banque', 'virement', 'budget'],
    legacyName: 'Finance'
  },
  {
    id: 'admin-procedures',
    label: 'Mes Démarches',
    shortLabel: 'Démarches',
    icon: FileText,
    category: 'Vie & Services',
    description: 'Dossiers administratifs, formalités publiques, titres de séjour, formulaires et suivi des délais.',
    keywords: ['demarches', 'admin', 'titre de sejour', 'prefecture', 'formulaire', 'cerfa', 'pieces', 'justificatif', 'passeport', 'consulat', 'administration'],
    transversalServices: ['Google Drive', 'Google Calendar'],
    legacyName: 'Admin'
  },
  {
    id: 'legal',
    label: 'Droit & Juridique',
    shortLabel: 'Droit',
    icon: Scale,
    category: 'Vie & Services',
    description: 'Textes officiels, droits civiques, relecture de contrats et accompagnement juridique certifié.',
    keywords: ['juridique', 'droit', 'avocat', 'justice', 'contrat', 'loi', 'recours', 'conseil juridique', 'clause', 'litige', 'maitre diallo'],
    transversalServices: ['Google Drive'],
    legacyName: 'Juridique'
  },
  {
    id: 'world',
    label: 'Mobilité & Expatriation',
    shortLabel: 'Mobilité',
    icon: Globe,
    category: 'Vie & Services',
    description: 'Simulateur de visas, guides d’expatriation, formalités consulaires pour 195 pays du monde.',
    keywords: ['mobilite', 'voyage', 'visa', 'expatriation', 'pays', 'ambassade', 'consulat', 'aeroport', 'douane', 'monde', 'guide diallo'],
    transversalServices: ['Google Maps'],
    legacyName: 'Monde / WorldHub'
  },

  // ── 4. CRÉER & ENTREPRENDRE ──
  {
    id: 'studio',
    label: 'Studio Créatif',
    shortLabel: 'Studio',
    icon: Palette,
    category: 'Créer & Entreprendre',
    description: 'Production multimédia, scripts, visuels IA, générateurs de vidéos et design de contenus.',
    keywords: ['studio', 'creation', 'video', 'image', 'visuel', 'design', 'graphisme', 'marketing', 'multimedia', 'generateur', 'ia', 'avatar'],
    transversalServices: ['Google Drive'],
    legacyName: 'Studio'
  },
  {
    id: 'shop',
    label: 'Marché Mondial',
    shortLabel: 'Marché',
    icon: ShoppingBag,
    category: 'Créer & Entreprendre',
    description: 'Commerce B2B/B2C, import-export, fournisseurs mondiaux, devis RFQ, Incoterms et salons virtuels.',
    keywords: ['marche', 'boutique', 'commerce', 'import', 'export', 'fournisseur', 'b2b', 'vente', 'achat', 'rfq', 'devis', 'incoterm', 'fret', 'douane', 'produits'],
    badge: 'B2B',
    transversalServices: ['Google Maps', 'Google Meet', 'Google Chat'],
    legacyName: 'Marché Mondial'
  },

  // ── 5. COMMUNAUTÉ & CONSEIL ──
  {
    id: 'social',
    label: 'Réseau MOC',
    shortLabel: 'Réseau',
    icon: Users,
    category: 'Communauté & Conseil',
    description: 'Réseau social de confiance, fil d’actualité, Reels vidéo, Tribus thématiques et Lives interactifs.',
    keywords: ['reseau', 'social', 'moc', 'tribus', 'communaute', 'reels', 'live', 'fil', 'posts', 'amis', 'partage', 'video', 'chat'],
    transversalServices: ['Google Meet', 'Google Chat'],
    legacyName: 'Réseau Mok / Social'
  },
  {
    id: 'chat',
    label: 'Experts Diallo',
    shortLabel: 'Experts',
    icon: MessageSquare,
    category: 'Communauté & Conseil',
    description: 'Catalogue des spécialistes d’élite de la Famille Diallo pour un conseil humain direct.',
    keywords: ['experts', 'chat', 'diallo', 'conseiller', 'maitre', 'professeur', 'docteur', 'directeur', 'consultation', 'dialogue', 'assistance'],
    legacyName: 'Experts IA / Chat'
  },
  {
    id: 'council',
    label: 'Conseil des Sages',
    shortLabel: 'Conseil',
    icon: ShieldCheck,
    category: 'Communauté & Conseil',
    description: 'Délibération collégiale réunissant plusieurs experts Diallo pour arbitrer un dossier stratégique.',
    keywords: ['conseil', 'sages', 'deliberation', 'collegial', 'reunion', 'experts', 'dossier complexe', 'arbitrage'],
    legacyName: 'Conseil Réuni'
  },
  {
    id: 'admin',
    label: 'Tableau de Bord Super-Admin',
    shortLabel: 'Super-Admin',
    icon: Shield,
    category: 'Communauté & Conseil',
    description: 'Supervision globale souveraine, gestion de tous les comptes, rôles, modération, sauvegardes et configuration système.',
    keywords: ['admin', 'administrateur', 'super admin', 'comptes', 'utilisateurs', 'moderation', 'sauvegarde', 'systeme', 'roles', 'credits', 'configuration', 'dashboard admin'],
    badge: 'Super-Admin',
    legacyName: 'Console Super-Admin'
  }
];

export const TRANSVERSAL_SERVICES: TransversalServiceDef[] = [
  {
    id: 'google-maps',
    title: 'Google Maps & Géolocalisation',
    description: 'Cartographie interactive pour localiser opportunités, logements, cliniques, ambassades et routes logistiques.',
    icon: MapPin,
    tabTarget: 'google-maps',
    integratedIn: ['Habitat & Installation', 'Carrière & Accomplissement', 'Santé & Bien-être', 'Marché Mondial', 'Mobilité'],
    provider: 'Google Workspace',
    status: 'Connecté'
  },
  {
    id: 'google-drive',
    title: 'Google Drive & Coffre Documentaire',
    description: 'Stockage cloud sécurisé pour vos CVs, baux, justificatifs, pièces d’identité et contrats commerciaux.',
    icon: HardDrive,
    tabTarget: 'google-drive',
    integratedIn: ['Mes Démarches', 'Carrière & Accomplissement', 'Droit & Juridique', 'Campus', 'Studio Créatif'],
    provider: 'Google Workspace',
    status: 'Connecté'
  },
  {
    id: 'google-meet',
    title: 'Google Meet & Salons Vidéo',
    description: 'Visioconférences privées, simulations d’entretiens, soutenance d’examens et salons virtuels B2B.',
    icon: Video,
    tabTarget: 'google-meet',
    integratedIn: ['Carrière & Accomplissement', 'Campus & Éducation', 'Marché Mondial', 'Réseau MOC'],
    provider: 'Google Workspace',
    status: 'Connecté'
  },
  {
    id: 'google-chat',
    title: 'Google Chat & Salons Collaboratifs',
    description: 'Messagerie instantanée d’équipe, discussions commerciales B2B et échanges directs.',
    icon: MessageSquare,
    tabTarget: 'google-chat',
    integratedIn: ['Marché Mondial', 'Réseau MOC', 'Campus'],
    provider: 'Google Workspace',
    status: 'Connecté'
  },
  {
    id: 'diallo-os',
    title: 'Diallo OS Orchestrateur',
    description: 'Intelligence d’orchestration transversale convertissant toute intention humaine en plan d’action concret.',
    icon: Sparkles,
    tabTarget: 'diallo-os',
    integratedIn: ['Tous les modules de la plateforme'],
    provider: 'Diallo Core',
    status: 'Actif'
  },
  {
    id: 'digital-safe',
    title: 'Coffre-fort & Signature Numérique',
    description: 'Chiffrement de vos documents sensibles, certification de conformité et journaux d’audit.',
    icon: Lock,
    tabTarget: 'legal',
    integratedIn: ['Droit & Juridique', 'Mes Démarches', 'Finance & Wallet'],
    provider: 'Sécurité LMAV',
    status: 'Prêt'
  }
];

export const GOAL_TEMPLATES = [
  {
    id: 'goal-career',
    title: 'Trouver un emploi ou propulser ma carrière',
    category: 'Carrière & Accomplissement',
    icon: Briefcase,
    targetTab: 'career',
    steps: ['Diagnostic de compétences Point A', 'Génération CV Maître adapté', 'Simulation d’entretien 3D avec Coach', 'Conquête du marché caché'],
    leadAgent: 'Conseiller Diallo'
  },
  {
    id: 'goal-education',
    title: 'Apprendre un métier, passer un examen ou étudier à l’étranger',
    category: 'Campus & Éducation',
    icon: GraduationCap,
    targetTab: 'campus',
    steps: ['Choix du programme académique', 'Cours interactifs & MOOCs', 'Évaluation certifiante avec Professeur Diallo', 'Équivalence internationale'],
    leadAgent: 'Professeur Diallo'
  },
  {
    id: 'goal-business',
    title: 'Créer mon entreprise, importer ou exporter des marchandises',
    category: 'Marché Mondial',
    icon: ShoppingBag,
    targetTab: 'shop',
    steps: ['Sourcing de fournisseurs certifiés', 'Calcul de coût complet (Incoterms 2020)', 'Séquestre financier sécurisé', 'Suivi logistique portuaire'],
    leadAgent: 'Directeur Diallo'
  },
  {
    id: 'goal-housing',
    title: 'Trouver un logement et réussir mon installation',
    category: 'Habitat & Installation',
    icon: HomeIcon,
    targetTab: 'housing',
    steps: ['Critères de recherche géolocalisée', 'Constitution du dossier locataire', 'Calcul des aides et simulation APL', 'Signature du bail et emménagement'],
    leadAgent: 'Monsieur Diallo'
  },
  {
    id: 'goal-admin',
    title: 'Effectuer une démarche administrative ou régler un titre de séjour',
    category: 'Mes Démarches & Droit',
    icon: FileText,
    targetTab: 'admin-procedures',
    steps: ['Audit des pièces justificatives', 'Remplissage des formulaires officiels', 'Prise de rendez-vous consulaire/préfecture', 'Recours et assistance juridique'],
    leadAgent: 'Officier & Maître Diallo'
  },
  {
    id: 'goal-languages',
    title: 'Apprendre une nouvelle langue pour voyager ou travailler',
    category: 'Langues & Immersion',
    icon: Languages,
    targetTab: 'languages',
    steps: ['Test de niveau initial', 'Fiches mnémotechniques quotidiennes', 'Immersion audio avec natifs', 'Certification de fluidité'],
    leadAgent: 'Diallo Langues'
  },
  {
    id: 'goal-health',
    title: 'Consulter un professionnel de santé',
    category: 'Santé & Bien-être',
    icon: HeartPulse,
    targetTab: 'health',
    steps: ['Description confidentielle du besoin', 'Orientation vers le bon spécialiste', 'Prise de rendez-vous', 'Suivi avec Docteur Diallo'],
    leadAgent: 'Docteur Diallo'
  }
];
