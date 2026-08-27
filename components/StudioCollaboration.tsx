import React, { useState, useEffect } from 'react';
import { 
  Users, Share2, MessageSquare, FileText, Sparkles, Plus, CheckCircle2, 
  Clock, Flame, Award, Heart, MessageCircle, Download, Copy, ExternalLink, 
  Send, Filter, Search, BookOpen, Layers, Edit3, Trash2, ArrowUpRight, 
  FolderPlus, Check, Lightbulb, ShieldCheck, Eye, RefreshCw, X, SlidersHorizontal,
  Bookmark, UserPlus, Globe, Lock, HelpCircle
} from 'lucide-react';
import { 
  CoCreationProject, DiscussionCircle, SharedStudioResource, 
  CommunityCollaborationIdea, CoAuthorMember, CoCreationStatus, CoCreationType 
} from '../types';
import { useGlobal } from '../contexts/GlobalContext';

interface StudioCollaborationProps {
  initialStudioAsset?: {
    type: 'image' | 'video' | 'script' | 'prompt' | 'vision';
    contentOrUrl: string;
    title?: string;
  } | null;
  onClearInitialAsset?: () => void;
}

// Données initiales riches pour une expérience immédiate et vivante
const INITIAL_PROJECTS: CoCreationProject[] = [
  {
    id: 'proj-1',
    title: 'Guide Pratique : Création d’Entreprise Transfrontalière Diaspora-Afrique',
    subtitle: 'Cadre juridique, financement participatif et logistique opérationnelle',
    description: 'Un manuel collaboratif rédigé par des juristes, entrepreneurs et logisticiens de la communauté pour simplifier les démarches de création d\'entreprises entre la France, le Sénégal, la Guinée et la Côte d\'Ivoire.',
    type: 'guide',
    category: 'Entrepreneuriat & Juridique',
    status: 'co_writing',
    leadAuthor: {
      id: 'u-lead-1',
      name: 'Mamadou DIALLO',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'lead',
      isOnline: true,
      colorCode: '#2563EB'
    },
    coAuthors: [
      {
        id: 'u-co-1',
        name: 'Aminata BARRY',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        role: 'co_author',
        isOnline: true,
        colorCode: '#10B981'
      },
      {
        id: 'u-co-2',
        name: 'Dr. Ibrahima SOW',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        role: 'reviewer',
        isOnline: false,
        lastActiveAt: 'Il y a 15 min',
        colorCode: '#8B5CF6'
      }
    ],
    content: `# Guide Pratique : Création d’Entreprise Transfrontalière\n\n## 1. Synthèse Exécutive\nLa mobilité économique entre la diaspora et les pays d'origine exige une compréhension fine des régimes douaniers et des formes sociétaires adaptées (SAS, SARL UEMOA/OHADA).\n\n## 2. Étapes Clés\n1. Choix de la structure juridique (OHADA vs Régime Local).\n2. Domiciliation et compte bancaire multi-devises.\n3. Protocoles d'import-export et traçabilité douanière.\n\n## 3. Recommandations des Experts\n- Privilégier les incitations aux investissements de la zone ZLECAf.\n- Mettre en place un pacte d'associés clair dès l'amorçage.`,
    tags: ['Entrepreneuriat', 'OHADA', 'Diaspora', 'ZLECAf'],
    createdAt: '2026-08-20',
    updatedAt: 'Il y a 10 minutes',
    viewsCount: 342,
    likesCount: 58,
    sharesCount: 24,
    versions: [
      {
        id: 'v-1',
        versionNumber: 1,
        authorName: 'Mamadou DIALLO',
        timestamp: '2026-08-20 14:30',
        changeNote: 'Structure initiale et plan détaillé',
        contentSnapshot: '# Guide Pratique : Création d’Entreprise Transfrontalière\n\nPlan initial...'
      },
      {
        id: 'v-2',
        versionNumber: 2,
        authorName: 'Aminata BARRY',
        timestamp: '2026-08-24 11:15',
        changeNote: 'Ajout de la section OHADA et aspects fiscaux',
        contentSnapshot: '# Guide Pratique : Création d’Entreprise Transfrontalière\n\nAjout OHADA...'
      }
    ],
    comments: [
      {
        id: 'c-1',
        authorId: 'u-co-1',
        authorName: 'Aminata BARRY',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        sectionTitle: '2. Étapes Clés',
        text: 'J\'ai harmonisé les mentions relatives au capital minimum selon le droit OHADA révisé.',
        timestamp: 'Hier à 16:40',
        resolved: false
      }
    ],
    visibility: 'public',
    targetPublishModule: 'campus',
    isAiAssisted: true,
    aiSuggestionsCount: 6
  },
  {
    id: 'proj-2',
    title: 'Manifeste Pédagogique : L’Apprentissage Hybride & Multimodal en Afrique',
    subtitle: 'Démocratiser les savoirs scientifiques et techniques sans fracture numérique',
    description: 'Co-rédaction d\'un livre blanc sur l\'intégration de l\'IA et des outils hors-ligne dans les cursus scolaires et universitaires francophones.',
    type: 'manifesto',
    category: 'Éducation & Innovation',
    status: 'peer_review',
    leadAuthor: {
      id: 'u-lead-2',
      name: 'Pr. Mariama CAMARA',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      role: 'lead',
      isOnline: false,
      lastActiveAt: 'Il y a 1h',
      colorCode: '#EC4899'
    },
    coAuthors: [
      {
        id: 'u-co-3',
        name: 'Ousmane TOURE',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
        role: 'co_author',
        isOnline: true,
        colorCode: '#F59E0B'
      }
    ],
    content: `# Manifeste Pédagogique : L’Apprentissage Hybride\n\nL'accès au savoir universel ne doit plus être limité par la bande passante. Les architectures Local-First et les modèles multimodaux compacts permettent à chaque apprenant d'étudier à son rythme.`,
    tags: ['Éducation', 'LocalFirst', 'Campus', 'Inclusion'],
    createdAt: '2026-08-15',
    updatedAt: 'Hier',
    viewsCount: 512,
    likesCount: 89,
    sharesCount: 45,
    versions: [],
    comments: [],
    visibility: 'public',
    targetPublishModule: 'social_feed',
    isAiAssisted: true
  }
];

const INITIAL_CIRCLES: DiscussionCircle[] = [
  {
    id: 'circle-1',
    name: 'Cercle Créateurs Multimédia & Storytelling',
    tagline: 'Production vidéo, scripts d’impact et visuels Studio pour l\'Afrique créative',
    description: 'Espace d\'entraide et de co-création pour les monteurs, vidéastes, concepteurs de Reels et créateurs de cours du Campus.',
    category: 'Médias & Création',
    avatarUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=150',
    membersCount: 148,
    isJoined: true,
    isOfficial: true,
    activeTopic: 'Comment structurer une accroche vidéo de 3 secondes pour un cours de physique ?',
    createdAt: '2026-07-10',
    lastActivityAt: 'Il y a 5 min',
    tags: ['Vidéo', 'Studio', 'Reels', 'Scénarisation'],
    posts: [
      {
        id: 'cp-1',
        circleId: 'circle-1',
        authorId: 'u-1',
        authorName: 'Aissatou DIALLO',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
        authorTitle: 'Créatrice & Formatrice',
        content: 'Je viens de finaliser le script du module d’initiation à l\'agriculture biologique avec l\'aide du Studio. Qui souhaite relire et tester l\'avatar 3D de démonstration ?',
        timestamp: 'Il y a 20 min',
        likes: 12,
        userLiked: false,
        sharedStudioAsset: {
          title: 'Script Vidéo : Bio-Fertilisants Locaux (3 min)',
          type: 'script',
          urlOrContent: 'Introduction : Saviez-vous que 80% des fertilisants peuvent être produits localement avec des résidus organiques ?'
        }
      }
    ],
    activePoll: {
      id: 'poll-1',
      question: 'Quel format préférez-vous pour les tutoriels d\'artisanat ?',
      options: [
        { id: 'opt-1', text: 'Reels courts rythmés (< 60s)', votes: 45 },
        { id: 'opt-2', text: 'Vidéos pas-à-pas chapitrées (3-5 min)', votes: 78 },
        { id: 'opt-3', text: 'Fiches visuelles interactives', votes: 25 }
      ],
      totalVotes: 148
    }
  },
  {
    id: 'circle-2',
    name: 'Collectif Tech, Code & Intelligence Souveraine',
    tagline: 'Algorithmes, modèles multimodaux ouverts et développement d\'applications solidaires',
    description: 'Développeurs, ingénieurs et chercheurs travaillant sur des projets open source adaptés aux contraintes d\'infrastructure du continent.',
    category: 'Technologies & Code',
    avatarUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=150',
    membersCount: 230,
    isJoined: false,
    activeTopic: 'Optimisation de la synchronisation de données hors-ligne sans latence',
    createdAt: '2026-06-01',
    lastActivityAt: 'Il y a 2h',
    tags: ['Tech', 'OpenSource', 'LocalFirst', 'Offline'],
    posts: []
  },
  {
    id: 'circle-3',
    name: 'Pôle Juridique, Brevets & Propriété Intellectuelle',
    tagline: 'Protéger, formaliser et valoriser les innovations citoyennes',
    description: 'Accompagnement bénévole et co-rédaction de contrats-types, licences libres et dépôts de marques régionales.',
    category: 'Juridique & Conseil',
    avatarUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=150',
    membersCount: 94,
    isJoined: true,
    activeTopic: 'Modèle de contrat tripartite pour l\'exportation de produits transformés',
    createdAt: '2026-07-28',
    lastActivityAt: 'Hier',
    tags: ['Juridique', 'Brevets', 'Contrats', 'OHADA'],
    posts: []
  }
];

const INITIAL_RESOURCES: SharedStudioResource[] = [
  {
    id: 'res-1',
    title: 'Template de Pitch Vidéo Investisseur (90s)',
    description: 'Structure éprouvée pour pitcher un projet devant la commission d\'investissement du Marché Mondial.',
    type: 'template',
    category: 'Business & Pitch',
    authorName: 'Abdoulaye SYLLA',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    authorRole: 'Conseiller d\'Affaires',
    content: `[00:00 - 00:15] Accroche & Problème réel constaté sur le terrain\n[00:15 - 00:40] Notre Solution innovante et proposition de valeur unique\n[00:40 - 01:05] Modèle économique, traction et premiers résultats\n[01:05 - 01:30] L'Équipe, le besoin de financement et l'appel à l'action.`,
    downloadsCount: 184,
    likesCount: 67,
    isLiked: false,
    tags: ['Pitch', 'Investissement', 'Studio', 'Vidéo'],
    createdAt: '2026-08-12',
    accessLevel: 'free_public'
  },
  {
    id: 'res-2',
    title: 'Prompt Système : Générateur de Fiches Produits E-Commerce Vendeur',
    description: 'Prompt optimisé pour le Studio pour générer une description vendeuse, les caractéristiques techniques et les conditions d\'expédition en 3 langues.',
    type: 'prompt_library',
    category: 'E-Commerce & Marché',
    authorName: 'Fatoumata KEITA',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    content: `Rédige une fiche produit complète et attrayante pour le Marché Mondial Le Monde à Vous. Inclus : 1) Titre percutant 2) Histoire de l'artisan/producteur 3) Bénéfices concrets 4) Spécifications techniques 5) Conseils d'utilisation 6) Traduction en Français, Anglais et Arabe.`,
    downloadsCount: 310,
    likesCount: 112,
    isLiked: true,
    tags: ['Prompt', 'Marché', 'ECommerce', 'Multilingue'],
    createdAt: '2026-08-18',
    accessLevel: 'free_public'
  },
  {
    id: 'res-3',
    title: 'Canevas de Gestion de Projet Co-Créatif (Méthode Agile Solidaire)',
    description: 'Feuille de route pas-à-pas pour orchestrer une équipe de 3 à 8 co-créateurs sur un article ou un dossier d\'envergure.',
    type: 'project_framework',
    category: 'Méthodologie & Organisation',
    authorName: 'Mamadou DIALLO',
    authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    content: `Phase 1 : Cadrage & Rôles (Lead Author, Co-rédacteurs, Réviseur technique)\nPhase 2 : Sprint de recherche documentaire & sourcing\nPhase 3 : Co-écriture structurée par sections\nPhase 4 : Relecture croisée et validation déontologique\nPhase 5 : Publication et diffusion multicanale`,
    downloadsCount: 142,
    likesCount: 49,
    tags: ['Méthode', 'CoCréation', 'Agile', 'Équipe'],
    createdAt: '2026-08-22',
    accessLevel: 'free_public'
  }
];

const INITIAL_IDEAS: CommunityCollaborationIdea[] = [
  {
    id: 'idea-1',
    title: 'Atlas Numérique des Coopératives Agricoles et Artisans d’Afrique de l’Ouest',
    description: 'Créer un annuaire enrichi et cartographié des coopératives certifiées pour faciliter l’approvisionnement direct sans intermédiaires abusifs.',
    category: 'Agriculture & Économie Solidaire',
    authorName: 'Salif CONTE',
    authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    targetImpact: 'Connecter plus de 500 coopératives aux acheteurs internationaux du Marché.',
    neededSkills: ['Cartographie / SIG', 'Sourcing Terrain', 'Rédaction Web', 'Traduction Peul/Malinké/Wolof'],
    votesCount: 88,
    userVoted: false,
    volunteersCount: 14,
    userVolunteered: false,
    status: 'approved',
    createdAt: '2026-08-21'
  },
  {
    id: 'idea-2',
    title: 'Série de Vidéos Pédagogiques : Les Fondamentaux du Droit du Travail pour la Diaspora',
    description: 'Co-créer 10 capsules vidéo de 2 minutes avec des avatars 3D et infographies claires sur les contrats de travail, titres de séjour et droits sociaux.',
    category: 'Juridique & Social',
    authorName: 'Awa DIOP',
    authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    targetImpact: 'Informer 50 000 jeunes actifs et primo-arrivants sur leurs droits fondamentaux.',
    neededSkills: ['Juristes Droit Social', 'Scénaristes Vidéo', 'Comédiens Voix-Off'],
    votesCount: 124,
    userVoted: true,
    volunteersCount: 22,
    userVolunteered: true,
    status: 'in_progress',
    createdAt: '2026-08-16'
  },
  {
    id: 'idea-3',
    title: 'Manuel Libre : Programmation Python & IA pour les Lycées sans Internet Permanent',
    description: 'Écrire un cours illustré complet avec exercices exécutables localement et banques de données hors-ligne.',
    category: 'Éducation & Numérique',
    authorName: 'Boubacar DIALLO',
    authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    targetImpact: 'Équiper 100 établissements scolaires de ressources pédagogiques pérennes.',
    neededSkills: ['Professeurs d\'Informatique', 'Rédacteurs Pédagogiques', 'Graphistes'],
    votesCount: 65,
    userVoted: false,
    volunteersCount: 9,
    status: 'ideation',
    createdAt: '2026-08-25'
  }
];

export const StudioCollaboration: React.FC<StudioCollaborationProps> = ({ 
  initialStudioAsset,
  onClearInitialAsset 
}) => {
  const { userProfile, addNotification } = useGlobal();

  // Navigation interne
  const [activeSection, setActiveSection] = useState<'projects' | 'circles' | 'resources' | 'ideas'>('projects');

  // États des données avec persistance locale
  const [projects, setProjects] = useState<CoCreationProject[]>(() => {
    try {
      const saved = localStorage.getItem('lmav_studio_collab_projects');
      return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
    } catch {
      return INITIAL_PROJECTS;
    }
  });

  const [circles, setCircles] = useState<DiscussionCircle[]>(() => {
    try {
      const saved = localStorage.getItem('lmav_studio_collab_circles');
      return saved ? JSON.parse(saved) : INITIAL_CIRCLES;
    } catch {
      return INITIAL_CIRCLES;
    }
  });

  const [resources, setResources] = useState<SharedStudioResource[]>(() => {
    try {
      const saved = localStorage.getItem('lmav_studio_collab_resources');
      return saved ? JSON.parse(saved) : INITIAL_RESOURCES;
    } catch {
      return INITIAL_RESOURCES;
    }
  });

  const [ideas, setIdeas] = useState<CommunityCollaborationIdea[]>(() => {
    try {
      const saved = localStorage.getItem('lmav_studio_collab_ideas');
      return saved ? JSON.parse(saved) : INITIAL_IDEAS;
    } catch {
      return INITIAL_IDEAS;
    }
  });

  // Sauvegarde automatique
  useEffect(() => {
    localStorage.setItem('lmav_studio_collab_projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('lmav_studio_collab_circles', JSON.stringify(circles));
  }, [circles]);

  useEffect(() => {
    localStorage.setItem('lmav_studio_collab_resources', JSON.stringify(resources));
  }, [resources]);

  useEffect(() => {
    localStorage.setItem('lmav_studio_collab_ideas', JSON.stringify(ideas));
  }, [ideas]);

  // État de l'éditeur de co-création actif
  const [selectedProject, setSelectedProject] = useState<CoCreationProject | null>(null);
  const [editorContent, setEditorContent] = useState('');
  const [editorTitle, setEditorTitle] = useState('');
  const [newCommentText, setNewCommentText] = useState('');
  const [aiAssistantPrompt, setAiAssistantPrompt] = useState('');
  const [isAiProcessing, setIsAiProcessing] = useState(false);

  // État du cercle actif
  const [selectedCircle, setSelectedCircle] = useState<DiscussionCircle | null>(null);
  const [circlePostContent, setCirclePostContent] = useState('');

  // Modals de création
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [newProjTitle, setNewProjTitle] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjType, setNewProjType] = useState<CoCreationType>('article');
  const [newProjCategory, setNewProjCategory] = useState('Général');

  const [showNewCircleModal, setShowNewCircleModal] = useState(false);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleTagline, setNewCircleTagline] = useState('');
  const [newCircleCategory, setNewCircleCategory] = useState('Création');

  const [showNewResourceModal, setShowNewResourceModal] = useState(false);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResDesc, setNewResDesc] = useState('');
  const [newResContent, setNewResContent] = useState('');
  const [newResType, setNewResType] = useState<SharedStudioResource['type']>('template');

  const [showNewIdeaModal, setShowNewIdeaModal] = useState(false);
  const [newIdeaTitle, setNewIdeaTitle] = useState('');
  const [newIdeaDesc, setNewIdeaDesc] = useState('');
  const [newIdeaImpact, setNewIdeaImpact] = useState('');
  const [newIdeaSkills, setNewIdeaSkills] = useState('');

  // Recherche & Filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');

  // Si un actif provient du Studio, proposer de le partager immédiatement
  useEffect(() => {
    if (initialStudioAsset) {
      setActiveSection('resources');
      setNewResTitle(initialStudioAsset.title || `Création Studio : ${initialStudioAsset.type.toUpperCase()}`);
      setNewResContent(initialStudioAsset.contentOrUrl);
      setShowNewResourceModal(true);
    }
  }, [initialStudioAsset]);

  // Actions de Co-Création de Projets
  const handleOpenProjectEditor = (project: CoCreationProject) => {
    setSelectedProject(project);
    setEditorContent(project.content);
    setEditorTitle(project.title);
  };

  const handleSaveProjectContent = () => {
    if (!selectedProject) return;
    const updated = projects.map(p => {
      if (p.id === selectedProject.id) {
        const newVersion = {
          id: `v-${Date.now()}`,
          versionNumber: (p.versions.length || 0) + 1,
          authorName: userProfile.name,
          timestamp: new Date().toLocaleString(),
          changeNote: 'Mise à jour collaborative en direct',
          contentSnapshot: editorContent
        };
        return {
          ...p,
          title: editorTitle,
          content: editorContent,
          updatedAt: 'À l’instant',
          versions: [newVersion, ...(p.versions || [])]
        };
      }
      return p;
    });
    setProjects(updated);
    setSelectedProject(prev => prev ? { ...prev, title: editorTitle, content: editorContent, updatedAt: 'À l’instant' } : null);
    addNotification('Projet Sauvegardé', 'Les modifications ont été synchronisées avec tous les co-auteurs.', 'success');
  };

  const handleCreateProject = () => {
    if (!newProjTitle.trim()) return;
    const newProj: CoCreationProject = {
      id: `proj-${Date.now()}`,
      title: newProjTitle,
      description: newProjDesc || 'Projet initié dans le Studio Collaboratif.',
      type: newProjType,
      category: newProjCategory,
      status: 'co_writing',
      leadAuthor: {
        id: userProfile.id || 'u-self',
        name: userProfile.name,
        avatarUrl: userProfile.avatarUrl,
        role: 'lead',
        isOnline: true,
        colorCode: '#2563EB'
      },
      coAuthors: [],
      content: `# ${newProjTitle}\n\n## Introduction\nDéfinissez ici les objectifs du projet et la contribution attendue de l'équipe.\n\n## Section 1 : Analyse & Opportunités\n...\n\n## Section 2 : Plan d'Action\n...`,
      tags: [newProjCategory, newProjType],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: 'À l’instant',
      viewsCount: 1,
      likesCount: 1,
      sharesCount: 0,
      versions: [],
      comments: [],
      visibility: 'public',
      targetPublishModule: 'social_feed',
      isAiAssisted: true
    };

    setProjects([newProj, ...projects]);
    setShowNewProjectModal(false);
    setNewProjTitle('');
    setNewProjDesc('');
    setSelectedProject(newProj);
    setEditorTitle(newProj.title);
    setEditorContent(newProj.content);
    addNotification('Nouveau Projet Créé', `"${newProj.title}" est maintenant ouvert à la co-création.`, 'success');
  };

  const handleAddProjectComment = () => {
    if (!selectedProject || !newCommentText.trim()) return;
    const newComment = {
      id: `c-${Date.now()}`,
      authorId: userProfile.id || 'u-self',
      authorName: userProfile.name,
      authorAvatar: userProfile.avatarUrl,
      text: newCommentText,
      timestamp: 'À l’instant',
      resolved: false
    };

    const updatedProjects = projects.map(p => {
      if (p.id === selectedProject.id) {
        return { ...p, comments: [newComment, ...(p.comments || [])] };
      }
      return p;
    });

    setProjects(updatedProjects);
    setSelectedProject(prev => prev ? { ...prev, comments: [newComment, ...(prev.comments || [])] } : null);
    setNewCommentText('');
    addNotification('Commentaire Ajouté', 'Votre remarque a été épinglée dans la marge du document.', 'info');
  };

  const handleToggleResolveComment = (commentId: string) => {
    if (!selectedProject) return;
    const updatedComments = selectedProject.comments.map(c => 
      c.id === commentId ? { ...c, resolved: !c.resolved } : c
    );
    const updatedProjects = projects.map(p => 
      p.id === selectedProject.id ? { ...p, comments: updatedComments } : p
    );
    setProjects(updatedProjects);
    setSelectedProject({ ...selectedProject, comments: updatedComments });
  };

  // Assistant IA Co-Pilote de Rédaction
  const handleAiAssistance = (action: 'plan' | 'enrich' | 'summary' | 'tone') => {
    setIsAiProcessing(true);
    setTimeout(() => {
      let addition = '';
      if (action === 'plan') {
        addition = `\n\n### 📋 Plan Recommandé par le Co-Pilote\n1. **Diagnostic de Terrain** : Chiffres clés et contexte socio-économique.\n2. **Cadre Méthodologique** : Rôles des intervenants et synergies interculturelles.\n3. **Livrables & Indicateurs d'Impact** : Mesure de la réussite concrète.\n4. **Feuille de Route Déployable** : Jalons à 30, 60 et 90 jours.`;
      } else if (action === 'enrich') {
        addition = `\n\n> 💡 **Enrichissement Recommandé** : Intégrer les retours d'expérience des coopératives locales et les dispositions récentes de la ZLECAf pour renforcer l'applicabilité pratique du document.`;
      } else if (action === 'summary') {
        addition = `\n\n### 📌 Synthèse Exécutive d'Équipe\nCe document établit les bases d'une coopération durable entre créateurs et experts du réseau, alliant rigueur méthodologique, souveraineté numérique et utilité collective immédiate.`;
      } else if (action === 'tone') {
        addition = `\n\n*✅ Contrôle Déontologique validé : Tonalité humaine, constructive, respectueuse des identités régionales et conforme aux valeurs de Le Monde à Vous.*`;
      }

      setEditorContent(prev => prev + addition);
      setIsAiProcessing(false);
      addNotification('Co-Pilote IA', 'La proposition a été intégrée dans votre document.', 'success');
    }, 1200);
  };

  // Publication directe vers le Fil Social
  const handlePublishProjectToFeed = () => {
    if (!selectedProject) return;
    const updated = projects.map(p => 
      p.id === selectedProject.id ? { ...p, status: 'published' as CoCreationStatus } : p
    );
    setProjects(updated);
    setSelectedProject({ ...selectedProject, status: 'published' });
    addNotification('Publication Réussie 🚀', `"${selectedProject.title}" est maintenant consultable par toute la communauté.`, 'success');
  };

  // Actions Cercles de Discussion
  const handleJoinCircle = (circleId: string) => {
    setCircles(circles.map(c => {
      if (c.id === circleId) {
        const isJoining = !c.isJoined;
        return {
          ...c,
          isJoined: isJoining,
          membersCount: isJoining ? c.membersCount + 1 : c.membersCount - 1
        };
      }
      return c;
    }));
    addNotification('Cercle Thématique', 'Votre adhésion au cercle a été mise à jour.', 'info');
  };

  const handlePostInCircle = () => {
    if (!selectedCircle || !circlePostContent.trim()) return;
    const newPost = {
      id: `cp-${Date.now()}`,
      circleId: selectedCircle.id,
      authorId: userProfile.id || 'u-self',
      authorName: userProfile.name,
      authorAvatar: userProfile.avatarUrl,
      authorTitle: userProfile.title || 'Membre Actif',
      content: circlePostContent,
      timestamp: 'À l’instant',
      likes: 1,
      userLiked: true
    };

    const updatedCircles = circles.map(c => {
      if (c.id === selectedCircle.id) {
        return {
          ...c,
          posts: [newPost, ...(c.posts || [])],
          lastActivityAt: 'À l’instant'
        };
      }
      return c;
    });

    setCircles(updatedCircles);
    setSelectedCircle(prev => prev ? { ...prev, posts: [newPost, ...(prev.posts || [])] } : null);
    setCirclePostContent('');
    addNotification('Message Publié', 'Votre contribution a été partagée dans le cercle.', 'success');
  };

  const handleVoteCirclePoll = (optionId: string) => {
    if (!selectedCircle || !selectedCircle.activePoll) return;
    const poll = selectedCircle.activePoll;
    if (poll.userVotedOptionId) return; // Déjà voté

    const updatedOptions = poll.options.map(opt => 
      opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
    );

    const updatedPoll = {
      ...poll,
      options: updatedOptions,
      totalVotes: poll.totalVotes + 1,
      userVotedOptionId: optionId
    };

    const updatedCircles = circles.map(c => 
      c.id === selectedCircle.id ? { ...c, activePoll: updatedPoll } : c
    );

    setCircles(updatedCircles);
    setSelectedCircle({ ...selectedCircle, activePoll: updatedPoll });
    addNotification('Vote Enregistré', 'Merci pour votre participation au sondage d’équipe !', 'success');
  };

  const handleCreateCircle = () => {
    if (!newCircleName.trim()) return;
    const newCircle: DiscussionCircle = {
      id: `circle-${Date.now()}`,
      name: newCircleName,
      tagline: newCircleTagline || 'Espace de réflexion et d’échange.',
      description: newCircleTagline,
      category: newCircleCategory,
      avatarUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=150',
      membersCount: 1,
      isJoined: true,
      activeTopic: 'Lancement du cercle & cadrage des premières initiatives',
      createdAt: new Date().toISOString().split('T')[0],
      lastActivityAt: 'À l’instant',
      tags: [newCircleCategory, 'Studio', 'CoCréation'],
      posts: []
    };

    setCircles([newCircle, ...circles]);
    setShowNewCircleModal(false);
    setNewCircleName('');
    setNewCircleTagline('');
    setSelectedCircle(newCircle);
    addNotification('Cercle Créé', `Bienvenue dans le cercle "${newCircle.name}".`, 'success');
  };

  // Actions Hub de Ressources
  const handlePublishResource = () => {
    if (!newResTitle.trim() || !newResContent.trim()) return;
    const newResource: SharedStudioResource = {
      id: `res-${Date.now()}`,
      title: newResTitle,
      description: newResDesc || 'Ressource partagée depuis le Studio Créatif.',
      type: newResType,
      category: 'Création & Partage',
      authorName: userProfile.name,
      authorAvatar: userProfile.avatarUrl,
      authorRole: userProfile.title || 'Créateur',
      content: newResContent,
      downloadsCount: 1,
      likesCount: 1,
      isLiked: true,
      tags: [newResType, 'Studio', 'Communauté'],
      createdAt: new Date().toISOString().split('T')[0],
      accessLevel: 'free_public'
    };

    setResources([newResource, ...resources]);
    setShowNewResourceModal(false);
    setNewResTitle('');
    setNewResDesc('');
    setNewResContent('');
    if (onClearInitialAsset) onClearInitialAsset();
    addNotification('Ressource Partagée 🌟', `"${newResource.title}" est maintenant disponible dans la bibliothèque partagée.`, 'success');
  };

  const handleCopyResource = (text: string) => {
    navigator.clipboard.writeText(text);
    addNotification('Copié dans le Presse-Papier', 'Le contenu a été copié et peut être réutilisé dans le Studio.', 'success');
  };

  // Actions Boîte à Idées
  const handleVoteIdea = (ideaId: string) => {
    setIdeas(ideas.map(i => {
      if (i.id === ideaId) {
        const hasVoted = i.userVoted;
        return {
          ...i,
          votesCount: hasVoted ? i.votesCount - 1 : i.votesCount + 1,
          userVoted: !hasVoted
        };
      }
      return i;
    }));
  };

  const handleVolunteerIdea = (ideaId: string) => {
    setIdeas(ideas.map(i => {
      if (i.id === ideaId) {
        const isVolunteered = i.userVolunteered;
        return {
          ...i,
          volunteersCount: isVolunteered ? i.volunteersCount - 1 : i.volunteersCount + 1,
          userVolunteered: !isVolunteered
        };
      }
      return i;
    }));
    addNotification('Ralliement Enregistré', 'Vous faites désormais partie de l’équipe pionnière sur cette idée.', 'info');
  };

  const handleTransformIdeaToProject = (idea: CommunityCollaborationIdea) => {
    const newProj: CoCreationProject = {
      id: `proj-${Date.now()}`,
      title: idea.title,
      description: idea.description,
      type: 'project',
      category: idea.category,
      status: 'co_writing',
      leadAuthor: {
        id: userProfile.id || 'u-self',
        name: userProfile.name,
        avatarUrl: userProfile.avatarUrl,
        role: 'lead',
        isOnline: true,
        colorCode: '#2563EB'
      },
      coAuthors: [
        {
          id: idea.authorId || 'u-idea-author',
          name: idea.authorName,
          avatarUrl: idea.authorAvatar,
          role: 'co_author',
          isOnline: true,
          colorCode: '#10B981'
        }
      ],
      content: `# ${idea.title}\n\n## 🎯 Vision & Objectif Collectif\n${idea.description}\n\n## 🚀 Impact Attendu\n${idea.targetImpact}\n\n## 🛠️ Compétences Mobilisées\n${idea.neededSkills.map(s => `- ${s}`).join('\n')}\n\n## 📅 Plan d'Action & Prochaines Échéances\n1. Cadrage et attribution des sous-tâches.\n2. Sourcing et développement des premiers modules.\n3. Revue communautaire et tests pilotes.`,
      tags: [idea.category, 'IdéeTransposée'],
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: 'À l’instant',
      viewsCount: 1,
      likesCount: idea.votesCount,
      sharesCount: 0,
      versions: [],
      comments: [],
      visibility: 'public',
      targetPublishModule: 'campus',
      isAiAssisted: true
    };

    setProjects([newProj, ...projects]);
    setIdeas(ideas.map(i => i.id === idea.id ? { ...i, status: 'launched', linkedProjectId: newProj.id } : i));
    setSelectedProject(newProj);
    setEditorTitle(newProj.title);
    setEditorContent(newProj.content);
    setActiveSection('projects');
    addNotification('Idée Transposée en Projet !', `Le projet collaboratif "${newProj.title}" est maintenant prêt pour la co-rédaction.`, 'success');
  };

  const handleCreateIdea = () => {
    if (!newIdeaTitle.trim() || !newIdeaDesc.trim()) return;
    const newIdea: CommunityCollaborationIdea = {
      id: `idea-${Date.now()}`,
      title: newIdeaTitle,
      description: newIdeaDesc,
      category: 'Initiative Citoyenne',
      authorName: userProfile.name,
      authorAvatar: userProfile.avatarUrl,
      authorId: userProfile.id,
      targetImpact: newIdeaImpact || 'Bénéficier à l\'ensemble de la communauté.',
      neededSkills: newIdeaSkills ? newIdeaSkills.split(',').map(s => s.trim()) : ['Polyvalence', 'Motivation'],
      votesCount: 1,
      userVoted: true,
      volunteersCount: 1,
      userVolunteered: true,
      status: 'ideation',
      createdAt: new Date().toISOString().split('T')[0]
    };

    setIdeas([newIdea, ...ideas]);
    setShowNewIdeaModal(false);
    setNewIdeaTitle('');
    setNewIdeaDesc('');
    setNewIdeaImpact('');
    setNewIdeaSkills('');
    addNotification('Idée Soumise au Collectif', 'Votre proposition est désormais ouverte aux votes et aux ralliements.', 'success');
  };

  return (
    <div className="space-y-8 animate-fade-up">
      {/* Bannière d'en-tête Co-Création & Collaboration */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden border border-blue-900/40">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 border border-blue-400/30 rounded-full text-blue-300 text-xs font-semibold uppercase tracking-wider">
              <Users size={14} /> Studio Co-Créatif & Collaboration Souveraine
            </div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Créez, Partagez et Construisez à Plusieurs
            </h2>
            <p className="text-blue-200/80 text-sm leading-relaxed">
              Un espace tout-en-un pour co-rédiger des articles majeurs, orchestrer des projets de développement, échanger au sein de cercles de réflexion et mutualiser vos ressources créatives.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all hover:scale-105 active:scale-95"
            >
              <FolderPlus size={18} /> Nouveau Projet
            </button>
            <button
              onClick={() => setShowNewCircleModal(true)}
              className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl font-semibold text-sm flex items-center gap-2 backdrop-blur transition-all"
            >
              <MessageSquare size={18} /> Créer un Cercle
            </button>
          </div>
        </div>

        {/* Sous-onglets de navigation */}
        <div className="flex items-center gap-2 mt-8 pt-6 border-t border-white/10 overflow-x-auto scrollbar-none">
          <button
            onClick={() => { setActiveSection('projects'); setSelectedProject(null); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSection === 'projects'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-blue-200/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileText size={16} /> Co-Création d'Articles & Projets ({projects.length})
          </button>
          <button
            onClick={() => { setActiveSection('circles'); setSelectedCircle(null); }}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSection === 'circles'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-blue-200/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <MessageSquare size={16} /> Cercles & Groupes de Discussion ({circles.length})
          </button>
          <button
            onClick={() => setActiveSection('resources')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSection === 'resources'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-blue-200/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Share2 size={16} /> Hub de Partage & Ressources ({resources.length})
          </button>
          <button
            onClick={() => setActiveSection('ideas')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all whitespace-nowrap ${
              activeSection === 'ideas'
                ? 'bg-blue-500 text-white shadow-md'
                : 'text-blue-200/70 hover:text-white hover:bg-white/5'
            }`}
          >
            <Lightbulb size={16} /> Boîte à Idées Collective ({ideas.length})
          </button>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 1 : CO-CRÉATION D'ARTICLES & PROJETS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeSection === 'projects' && (
        <div>
          {!selectedProject ? (
            <div className="space-y-6">
              {/* Filtres & Recherche de projets */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <div className="relative w-full sm:w-80">
                  <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Rechercher un projet, un article..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider mr-1 flex items-center gap-1">
                    <Filter size={14} /> Type :
                  </span>
                  {['all', 'guide', 'manifesto', 'article', 'project'].map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedCategoryFilter(type)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                        selectedCategoryFilter === type
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type === 'all' ? 'Tous' : type === 'guide' ? 'Guides' : type === 'manifesto' ? 'Manifestes' : type === 'article' ? 'Articles' : 'Projets'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grille des Projets Collaboratifs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {projects
                  .filter(p => selectedCategoryFilter === 'all' || p.type === selectedCategoryFilter)
                  .filter(p => !searchQuery || p.title.toLowerCase().includes(searchQuery.toLowerCase()) || p.description.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(project => (
                    <div 
                      key={project.id}
                      className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100 uppercase tracking-wide">
                              {project.type}
                            </span>
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                              {project.category}
                            </span>
                          </div>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1 ${
                            project.status === 'published' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            project.status === 'peer_review' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-blue-50 text-blue-700 border border-blue-200'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                            {project.status === 'published' ? 'Publié' : project.status === 'peer_review' ? 'En Relecture' : 'Co-Rédaction'}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {project.title}
                          </h3>
                          {project.subtitle && (
                            <p className="text-xs font-medium text-slate-500 mt-1">
                              {project.subtitle}
                            </p>
                          )}
                          <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">
                            {project.description}
                          </p>
                        </div>

                        {/* Co-auteurs */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-2 overflow-hidden">
                              <img
                                src={project.leadAuthor.avatarUrl}
                                alt={project.leadAuthor.name}
                                title={`${project.leadAuthor.name} (Auteur Principal)`}
                                className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                              />
                              {project.coAuthors.map(co => (
                                <img
                                  key={co.id}
                                  src={co.avatarUrl}
                                  alt={co.name}
                                  title={`${co.name} (${co.role})`}
                                  className="inline-block h-8 w-8 rounded-full ring-2 ring-white object-cover"
                                />
                              ))}
                            </div>
                            <span className="text-xs text-slate-500 font-medium">
                              {1 + project.coAuthors.length} co-auteurs
                            </span>
                          </div>

                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock size={12} /> {project.updatedAt}
                          </span>
                        </div>
                      </div>

                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1"><Eye size={14} /> {project.viewsCount}</span>
                          <span className="flex items-center gap-1"><Heart size={14} className="text-rose-500" /> {project.likesCount}</span>
                          <span className="flex items-center gap-1"><MessageCircle size={14} /> {project.comments?.length || 0}</span>
                        </div>

                        <button
                          onClick={() => handleOpenProjectEditor(project)}
                          className="px-4 py-2 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                        >
                          <Edit3 size={14} /> Ouvrir l’Espace de Co-Édition
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
               ESPACE DE CO-RÉDACTION EN DIRECT
               ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */
            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-fade-up">
              {/* Barre de contrôle supérieure de l'éditeur */}
              <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedProject(null)}
                      className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold"
                    >
                      ← Retour à la liste
                    </button>
                    <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded text-xs uppercase font-bold">
                      {selectedProject.type}
                    </span>
                    <span className="text-xs text-slate-400">
                      Dernière synchro : {selectedProject.updatedAt}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={editorTitle}
                    onChange={(e) => setEditorTitle(e.target.value)}
                    className="text-xl font-bold bg-transparent border-b border-transparent hover:border-slate-700 focus:border-blue-400 focus:outline-none w-full text-white"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {/* Avatars en direct */}
                  <div className="flex items-center gap-2 mr-3 px-3 py-1.5 bg-slate-800 rounded-xl border border-slate-700">
                    <span className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> Co-rédacteurs en direct :
                    </span>
                    <div className="flex -space-x-1.5 overflow-hidden">
                      <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-6 h-6 rounded-full ring-2 ring-slate-900 object-cover" />
                      {selectedProject.coAuthors.map(co => (
                        <img key={co.id} src={co.avatarUrl} alt={co.name} className="w-6 h-6 rounded-full ring-2 ring-slate-900 object-cover" />
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveProjectContent}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all"
                  >
                    <Check size={14} /> Sauvegarder
                  </button>

                  <button
                    onClick={handlePublishProjectToFeed}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all"
                  >
                    <Globe size={14} /> Publier dans le Réseau
                  </button>
                </div>
              </div>

              {/* Corps de l'Éditeur & Volet Latéral Collaboratif */}
              <div className="grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
                {/* Zone d'écriture Markdown / Contenu Riche */}
                <div className="lg:col-span-2 p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Edit3 size={14} /> Document Principal (Markdown Collaboratif)
                    </span>
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <span>{editorContent.split(/\s+/).filter(Boolean).length} mots</span>
                    </div>
                  </div>

                  <textarea
                    value={editorContent}
                    onChange={(e) => setEditorContent(e.target.value)}
                    rows={18}
                    className="w-full font-mono text-sm leading-relaxed text-slate-800 bg-slate-50/50 p-4 rounded-2xl border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder="Rédigez ici le contenu de votre article ou projet collaboratif..."
                  />

                  {/* Co-Pilote IA & Actions Rapides */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-2xl border border-blue-200/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                        <Sparkles size={16} className="text-blue-600" /> Co-Pilote de Rédaction & Synthèse
                      </span>
                      {isAiProcessing && (
                        <span className="text-xs text-blue-600 flex items-center gap-1 font-semibold animate-pulse">
                          <RefreshCw size={12} className="animate-spin" /> Génération en cours...
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleAiAssistance('plan')}
                        disabled={isAiProcessing}
                        className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold border border-blue-200 shadow-sm transition-all"
                      >
                        + Proposer un Plan Structuré
                      </button>
                      <button
                        onClick={() => handleAiAssistance('enrich')}
                        disabled={isAiProcessing}
                        className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold border border-blue-200 shadow-sm transition-all"
                      >
                        💡 Enrichir avec des Retours Terrain
                      </button>
                      <button
                        onClick={() => handleAiAssistance('summary')}
                        disabled={isAiProcessing}
                        className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold border border-blue-200 shadow-sm transition-all"
                      >
                        📌 Synthèse Exécutive d'Équipe
                      </button>
                      <button
                        onClick={() => handleAiAssistance('tone')}
                        disabled={isAiProcessing}
                        className="px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold border border-blue-200 shadow-sm transition-all"
                      >
                        🛡️ Contrôle Déontologique
                      </button>
                    </div>
                  </div>
                </div>

                {/* Volet Latéral : Commentaires en marge & Historique des Révisions */}
                <div className="p-6 space-y-6 bg-slate-50/70">
                  {/* Commentaires & Remarques d'Équipe */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                        <MessageSquare size={16} className="text-blue-600" /> Remarques & Révisions
                      </h4>
                      <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                        {selectedProject.comments?.length || 0}
                      </span>
                    </div>

                    {/* Formulaire d'ajout de commentaire */}
                    <div className="space-y-2">
                      <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Épingler une remarque ou suggestion pour l'équipe..."
                        rows={2}
                        className="w-full text-xs p-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleAddProjectComment}
                        disabled={!newCommentText.trim()}
                        className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1"
                      >
                        <Send size={12} /> Épingler la Remarque
                      </button>
                    </div>

                    {/* Liste des commentaires */}
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                      {selectedProject.comments?.map(comment => (
                        <div 
                          key={comment.id}
                          className={`p-3 rounded-xl border text-xs space-y-2 ${
                            comment.resolved ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-white border-slate-200 shadow-sm'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img src={comment.authorAvatar} alt={comment.authorName} className="w-5 h-5 rounded-full object-cover" />
                              <span className="font-bold text-slate-800">{comment.authorName}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                          </div>
                          {comment.sectionTitle && (
                            <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[10px] font-semibold">
                              Section : {comment.sectionTitle}
                            </span>
                          )}
                          <p className="text-slate-700 leading-relaxed">{comment.text}</p>
                          <button
                            onClick={() => handleToggleResolveComment(comment.id)}
                            className="text-[10px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                          >
                            {comment.resolved ? '✓ Résolu' : 'Marquer comme traité'}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Historique des versions */}
                  <div className="pt-4 border-t border-slate-200 space-y-3">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                      <Clock size={16} className="text-slate-600" /> Historique des Jalons
                    </h4>
                    <div className="space-y-2 text-xs">
                      {selectedProject.versions?.map(v => (
                        <div key={v.id} className="p-2.5 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                          <div>
                            <p className="font-bold text-slate-800">Version {v.versionNumber}</p>
                            <p className="text-[10px] text-slate-500">{v.authorName} • {v.timestamp}</p>
                            <p className="text-[10px] text-slate-600 italic mt-0.5">{v.changeNote}</p>
                          </div>
                          <button
                            onClick={() => {
                              setEditorContent(v.contentSnapshot);
                              addNotification('Version Restaurée', `Version ${v.versionNumber} chargée dans l'éditeur.`, 'info');
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[10px] font-bold"
                          >
                            Restaurer
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 2 : CERCLES & GROUPES DE DISCUSSION CRÉATIFS
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeSection === 'circles' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Liste des Cercles Thématiques */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Cercles de Réflexion</h3>
              <button
                onClick={() => setShowNewCircleModal(true)}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
              >
                <Plus size={14} /> Créer
              </button>
            </div>

            <div className="space-y-3">
              {circles.map(circle => (
                <div
                  key={circle.id}
                  onClick={() => setSelectedCircle(circle)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    selectedCircle?.id === circle.id
                      ? 'bg-blue-50 border-blue-400 shadow-sm'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <img src={circle.avatarUrl} alt={circle.name} className="w-12 h-12 rounded-xl object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900 truncate">{circle.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{circle.tagline}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span>{circle.membersCount} membres</span>
                        <span>•</span>
                        <span>{circle.lastActivityAt}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Espace de Discussion du Cercle Sélectionné */}
          <div className="lg:col-span-2">
            {selectedCircle ? (
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[640px]">
                {/* En-tête du cercle */}
                <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <img src={selectedCircle.avatarUrl} alt={selectedCircle.name} className="w-10 h-10 rounded-xl object-cover ring-2 ring-blue-500" />
                    <div>
                      <h4 className="text-base font-bold text-white">{selectedCircle.name}</h4>
                      <p className="text-xs text-blue-300/80">{selectedCircle.tagline}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleJoinCircle(selectedCircle.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      selectedCircle.isJoined
                        ? 'bg-white/10 text-white hover:bg-red-500/20 hover:text-red-300'
                        : 'bg-blue-600 text-white hover:bg-blue-500'
                    }`}
                  >
                    {selectedCircle.isJoined ? 'Membre Actif ✓' : 'Rejoindre le Cercle'}
                  </button>
                </div>

                {/* Sujet actif & Sondage instantané */}
                <div className="p-4 bg-blue-50/60 border-b border-blue-100 flex flex-col gap-3">
                  <div className="flex items-center gap-2 text-xs text-blue-900">
                    <span className="font-bold uppercase tracking-wider bg-blue-200 text-blue-900 px-2 py-0.5 rounded text-[10px]">
                      Sujet en cours :
                    </span>
                    <span className="font-medium">{selectedCircle.activeTopic}</span>
                  </div>

                  {selectedCircle.activePoll && (
                    <div className="bg-white p-3.5 rounded-2xl border border-blue-200 space-y-2.5">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                        <span>📊 Sondage : {selectedCircle.activePoll.question}</span>
                        <span className="text-slate-400 font-normal">{selectedCircle.activePoll.totalVotes} votes</span>
                      </div>
                      <div className="space-y-1.5">
                        {selectedCircle.activePoll.options.map(opt => {
                          const pct = selectedCircle.activePoll?.totalVotes 
                            ? Math.round((opt.votes / selectedCircle.activePoll.totalVotes) * 100) 
                            : 0;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => handleVoteCirclePoll(opt.id)}
                              className="w-full text-left p-2 rounded-xl border border-slate-200 hover:border-blue-400 text-xs relative overflow-hidden transition-all flex items-center justify-between"
                            >
                              <div 
                                className="absolute left-0 top-0 bottom-0 bg-blue-100/70 -z-0" 
                                style={{ width: `${pct}%` }} 
                              />
                              <span className="relative z-10 font-medium text-slate-800">{opt.text}</span>
                              <span className="relative z-10 font-bold text-blue-700">{pct}% ({opt.votes})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Fil des messages du cercle */}
                <div className="flex-1 p-6 overflow-y-auto space-y-4">
                  {selectedCircle.posts.length === 0 ? (
                    <div className="text-center py-12 text-slate-400 space-y-2">
                      <MessageSquare size={36} className="mx-auto opacity-30" />
                      <p className="text-sm">Soyez le premier à ouvrir la discussion dans ce cercle !</p>
                    </div>
                  ) : (
                    selectedCircle.posts.map(post => (
                      <div key={post.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img src={post.authorAvatar} alt={post.authorName} className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p className="text-xs font-bold text-slate-900">{post.authorName}</p>
                              <p className="text-[10px] text-slate-500">{post.authorTitle || 'Citoyen'} • {post.timestamp}</p>
                            </div>
                          </div>
                        </div>

                        <p className="text-sm text-slate-800 leading-relaxed">{post.content}</p>

                        {/* Actif partagé depuis le Studio */}
                        {post.sharedStudioAsset && (
                          <div className="p-3 bg-white rounded-xl border border-blue-200/80 space-y-1.5">
                            <span className="text-[10px] font-bold text-blue-600 uppercase flex items-center gap-1">
                              <Sparkles size={12} /> Actif Studio Partagé : {post.sharedStudioAsset.title}
                            </span>
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded-lg">
                              {post.sharedStudioAsset.urlOrContent}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Saisie d'un nouveau message */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-3">
                  <input
                    type="text"
                    value={circlePostContent}
                    onChange={(e) => setCirclePostContent(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handlePostInCircle()}
                    placeholder={`Participez à la discussion sur "${selectedCircle.name}"...`}
                    className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    onClick={handlePostInCircle}
                    disabled={!circlePostContent.trim()}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-300 text-white rounded-xl font-bold text-sm flex items-center gap-1.5 transition-all shadow-md"
                  >
                    <Send size={16} /> Envoyer
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-slate-400 flex flex-col items-center justify-center h-full space-y-3">
                <Users size={48} className="text-slate-300" />
                <h4 className="text-base font-bold text-slate-700">Sélectionnez un Cercle de Réflexion</h4>
                <p className="text-xs max-w-sm">Rejoignez un groupe thématique pour échanger des conseils, partager vos créations Studio et participer aux sondages.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 3 : HUB DE PARTAGE & RESSOURCES MUTUALISÉES
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeSection === 'resources' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Bibliothèque & Templates Partagés</h3>
              <p className="text-xs text-slate-500">Mutualisez vos prompts, templates de pitch, scripts vidéo et canevas de projets.</p>
            </div>
            <button
              onClick={() => setShowNewResourceModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Share2 size={16} /> Partager une Ressource
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {resources.map(res => (
              <div key={res.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[11px] rounded-lg uppercase">
                      {res.type.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-slate-400">{res.category}</span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900">{res.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{res.description}</p>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono text-xs text-slate-700 max-h-32 overflow-y-auto whitespace-pre-wrap">
                    {res.content}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={res.authorAvatar} alt={res.authorName} className="w-6 h-6 rounded-full object-cover" />
                    <span className="text-xs font-medium text-slate-700">{res.authorName}</span>
                  </div>

                  <button
                    onClick={() => handleCopyResource(res.content)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <Copy size={12} /> Copier
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          SECTION 4 : BOÎTE À IDÉES & MATRICE COLLECTIVE
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {activeSection === 'ideas' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Boîte à Idées & Initiatives Collectives</h3>
              <p className="text-xs text-slate-500">Proposez une idée de projet ou d’article, votez pour les plus prometteuses et ralliez l'équipe de co-création.</p>
            </div>
            <button
              onClick={() => setShowNewIdeaModal(true)}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus size={16} /> Soumettre une Idée
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {ideas.map(idea => (
              <div key={idea.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-[11px] rounded-lg">
                      {idea.category}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      idea.status === 'launched' ? 'bg-emerald-100 text-emerald-800' :
                      idea.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {idea.status === 'launched' ? 'Projet Lancé 🚀' : idea.status === 'approved' ? 'Approuvé' : 'En Idéation'}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-slate-900">{idea.title}</h4>
                  <p className="text-sm text-slate-600 leading-relaxed">{idea.description}</p>

                  <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs space-y-1">
                    <span className="font-bold text-blue-900">Impact visé :</span>
                    <p className="text-blue-800">{idea.targetImpact}</p>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {idea.neededSkills.map((skill, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] rounded-md font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleVoteIdea(idea.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        idea.userVoted
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <Heart size={14} className={idea.userVoted ? 'fill-current' : ''} /> {idea.votesCount}
                    </button>

                    <button
                      onClick={() => handleVolunteerIdea(idea.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                        idea.userVolunteered
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      <UserPlus size={14} /> {idea.volunteersCount} volontaires
                    </button>
                  </div>

                  {idea.status !== 'launched' && (
                    <button
                      onClick={() => handleTransformIdeaToProject(idea)}
                      className="px-3.5 py-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                    >
                      <Sparkles size={14} /> Lancer le Projet
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MODALS DE CRÉATION
         ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}

      {/* Modal Nouveau Projet */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <FolderPlus className="text-blue-600" /> Nouveau Projet Co-Créatif
              </h3>
              <button onClick={() => setShowNewProjectModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Titre du Projet ou de l'Article</label>
                <input
                  type="text"
                  value={newProjTitle}
                  onChange={(e) => setNewProjTitle(e.target.value)}
                  placeholder="Ex : Guide de l'Agro-Écologie Sahélienne..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type de Document</label>
                <select
                  value={newProjType}
                  onChange={(e) => setNewProjType(e.target.value as CoCreationType)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="article">Article Thématique</option>
                  <option value="guide">Guide Pratique / Manuel</option>
                  <option value="project">Dossier de Projet Opérationnel</option>
                  <option value="manifesto">Manifeste / Livre Blanc</option>
                  <option value="pitch">Pitch Commercial d'Équipe</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catégorie</label>
                <input
                  type="text"
                  value={newProjCategory}
                  onChange={(e) => setNewProjCategory(e.target.value)}
                  placeholder="Ex : Éducation, Agriculture, Droit..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description & Intentions</label>
                <textarea
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  rows={3}
                  placeholder="Décrivez l'objectif du document et les contributions recherchées..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="px-4 py-2 text-slate-600 font-bold text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateProject}
                disabled={!newProjTitle.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Initialiser l'Espace
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Nouveau Cercle */}
      {showNewCircleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="text-blue-600" /> Créer un Cercle de Discussion
              </h3>
              <button onClick={() => setShowNewCircleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Nom du Cercle</label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="Ex : Pôle Énergie Solaire & Transition..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Slogan ou Mission</label>
                <input
                  type="text"
                  value={newCircleTagline}
                  onChange={(e) => setNewCircleTagline(e.target.value)}
                  placeholder="Ex : Partage de retours d'expérience sur les installations hybrides."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Catégorie</label>
                <input
                  type="text"
                  value={newCircleCategory}
                  onChange={(e) => setNewCircleCategory(e.target.value)}
                  placeholder="Ex : Énergie, Artisanat, Tech..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewCircleModal(false)}
                className="px-4 py-2 text-slate-600 font-bold text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateCircle}
                disabled={!newCircleName.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Créer le Cercle
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Partager une Ressource */}
      {showNewResourceModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Share2 className="text-blue-600" /> Partager une Ressource Studio
              </h3>
              <button onClick={() => setShowNewResourceModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Titre de la Ressource</label>
                <input
                  type="text"
                  value={newResTitle}
                  onChange={(e) => setNewResTitle(e.target.value)}
                  placeholder="Ex : Template de Prompt pour Fiche Marché..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Type de Ressource</label>
                <select
                  value={newResType}
                  onChange={(e) => setNewResType(e.target.value as any)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="template">Template Réutilisable</option>
                  <option value="prompt_library">Prompt Studio Optimisé</option>
                  <option value="script">Script Vidéo / Audio</option>
                  <option value="project_framework">Canevas Méthodologique</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Contenu / Texte de la Ressource</label>
                <textarea
                  value={newResContent}
                  onChange={(e) => setNewResContent(e.target.value)}
                  rows={4}
                  placeholder="Collez ici le prompt, le script ou le template..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewResourceModal(false)}
                className="px-4 py-2 text-slate-600 font-bold text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handlePublishResource}
                disabled={!newResTitle.trim() || !newResContent.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Publier dans la Bibliothèque
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Soumettre une Idée */}
      {showNewIdeaModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl border border-slate-200 animate-scale-up">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lightbulb className="text-amber-500" /> Soumettre une Idée Collective
              </h3>
              <button onClick={() => setShowNewIdeaModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Titre de l'Idée</label>
                <input
                  type="text"
                  value={newIdeaTitle}
                  onChange={(e) => setNewIdeaTitle(e.target.value)}
                  placeholder="Ex : Manuel Pratique d'Irrigation Goutte-à-Goutte..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description de l'Initiative</label>
                <textarea
                  value={newIdeaDesc}
                  onChange={(e) => setNewIdeaDesc(e.target.value)}
                  rows={3}
                  placeholder="Expliquez en quelques lignes pourquoi cette idée est utile..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Impact Visé</label>
                <input
                  type="text"
                  value={newIdeaImpact}
                  onChange={(e) => setNewIdeaImpact(e.target.value)}
                  placeholder="Ex : Aider 200 maraîchers à doubler leur rendement."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Compétences Recherchées (séparées par des virgules)</label>
                <input
                  type="text"
                  value={newIdeaSkills}
                  onChange={(e) => setNewIdeaSkills(e.target.value)}
                  placeholder="Ex : Agronomie, Dessin Technique, Traduction..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowNewIdeaModal(false)}
                className="px-4 py-2 text-slate-600 font-bold text-sm"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateIdea}
                disabled={!newIdeaTitle.trim() || !newIdeaDesc.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-200 text-white rounded-xl font-bold text-sm shadow-md"
              >
                Ouvrir aux Votes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
