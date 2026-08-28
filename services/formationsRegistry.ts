// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CATALOGUE OFFICIEL DES FORMATIONS & DIPLÔMES CERTIFIANTS — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Écosystème complet : Inscription, Syllabus, Cours Théorique, Exercices,
// Mini-Quiz interactifs, Examens Certifiants et Délivrance de Diplômes Sécurisés.

import { Course, Lesson, AcademicLevel, QuizQuestion } from '../types';

export interface FormationInstructor {
    id: string;
    name: string;
    title: string;
    institution: string;
    avatar: string;
    bio: string;
}

export interface FormationModule {
    id: string;
    number: number;
    title: string;
    description: string;
    estimatedHours: number;
    lessons: Lesson[];
    quiz: QuizQuestion[];
}

export interface CertifyingFormation extends Course {
    category: 'Tech & IA' | 'Business & Commerce' | 'Droit & Gouvernance' | 'Santé & Sciences' | 'Fondamentaux & Langues' | 'Ingénierie & Métiers' | 'Doctorat & Recherche';
    certificationTitle: string;
    degreeLevel: string; // Ex: "Baccalauréat", "Licence / Bachelor (Bac+3)", "Master (Bac+5)", "Doctorat (Ph.D)", "Certification d'Élite"
    instructorsList: FormationInstructor[];
    prerequisites: string[];
    targetAudience: string;
    careerOutcomes: string[];
    ectsCredits: number;
    totalHours: number;
    passingScore: number; // Ex: 10 sur 20
    examDurationMinutes: number;
    modulesList: FormationModule[];
    examQuestions: QuizQuestion[];
    rating: number;
    reviewsCount: number;
    featured?: boolean;
}

export const CERTIFYING_FORMATIONS_CATALOG: CertifyingFormation[] = [
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. DOCTORAT & RECHERCHE AVANCÉE
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'doc-ai-datascience',
        title: "Doctorat en Intelligence Artificielle & Modèles Fondamentaux",
        certificationTitle: "Doctorat d'État & Ph.D en Sciences Numériques et Intelligence Artificielle",
        degreeLevel: "Doctorat (Ph.D / Bac+8)",
        institution: "Académie Mondiale & Chaire IA Le Monde à Vous (en collab. CNRS & MIT Labs)",
        level: 'Doctorat',
        category: 'Tech & IA',
        duration: "3 Ans (Parcours Accéléré 12-24 Mois)",
        ectsCredits: 180,
        totalHours: 450,
        passingScore: 12,
        examDurationMinutes: 45,
        rating: 4.96,
        reviewsCount: 342,
        students: 1420,
        thumbnailUrl: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=900&auto=format&fit=crop&q=80",
        description: "Programme doctoral d'excellence dédié à la recherche théorique et appliquée sur les architectures de Transformers, la multimodalité temps réel, la robustesse mathématique et l'éthique de l'IA.",
        prerequisites: [
            "Master en Informatique, Mathématiques Appliquées, Physique Théorique ou diplôme d'Ingénieur équivalent",
            "Solide maîtrise du calcul matriciel, des probabilités continues et de l'optimisation convexe",
            "Expérience avancée en programmation (Python, PyTorch, C++)"
        ],
        targetAudience: "Chercheurs, directeurs R&D, architectes IA et professeurs d'université.",
        careerOutcomes: [
            "Directeur de Laboratoire de Recherche en IA",
            "Principal AI Research Scientist",
            "Professeur Titulaire de Chaire Universitaire",
            "Lead AI Architect pour institutions internationales"
        ],
        instructorsList: [
            {
                id: 'inst-diallo',
                name: "Professeur Diallo",
                title: "Professeur Émérite & Titulaire de la Chaire Pédagogique",
                institution: "Académie Mondiale Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                bio: "Spécialiste mondial des architectures cognitives, de la pédagogie adaptative et de la souveraineté technologique."
            },
            {
                id: 'inst-fatoumata',
                name: "Dr. Fatoumata Diallo",
                title: "Directrice de Recherche en Modèles Fondamentaux",
                institution: "Institut Polytechnique & MIT Fellow",
                avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
                bio: "Experte en alignement éthique, inférence probabiliste et compression de réseaux de neurones profonds."
            }
        ],
        objectives: [
            "Concevoir de nouvelles architectures de modèles multimodaux",
            "Formaliser les preuves de convergence des algorithmes d'apprentissage par renforcement",
            "Diriger des projets de recherche originaux publiables dans les conférences de rang A* (NeurIPS, ICML, CVPR)",
            "Soutenir une thèse de doctorat devant le jury académique international"
        ],
        modulesList: [
            {
                id: 'doc-ai-m1',
                number: 1,
                title: "Fondements Mathématiques & Théorie de l'Information pour l'IA",
                description: "Espaces hilbertiens, géométrie différentielle de l'optimisation, entropie relative et bornes de généralisation statistique.",
                estimatedHours: 40,
                lessons: [
                    {
                        id: 'doc-ai-l1',
                        title: "1.1 Théorème de transport optimal et métrique de Wasserstein dans l'entraînement génératif",
                        duration: "4h30",
                        completed: false,
                        isLocked: false,
                        content: `### 1. Théorème de Transport Optimal et Espaces de Wasserstein

Le problème de Monge-Kantorovitch reformule la comparaison entre deux distributions de probabilité $\\mu$ et $\\nu$ définies sur un espace métrique $(\\mathcal{X}, d)$ :

$$W_p(\\mu, \\nu) = \\left( \\inf_{\\gamma \\in \\Pi(\\mu, \\nu)} \\int_{\\mathcal{X} \\times \\mathcal{X}} d(x, y)^p \\, \\mathrm{d}\\gamma(x, y) \\right)^{1/p}$$

où $\\Pi(\\mu, \\nu)$ représente l'ensemble de tous les couplages dont les lois marginales sont $\\mu$ et $\\nu$.

#### A. Dualité de Kantorovich-Rubinstein
Pour $p = 1$, la dualité permet de transformer le problème infini de transport en une optimisation fonctionnelle sous contrainte de régularité Lipschitzienne :

$$W_1(\\mu, \\nu) = \\sup_{\\|f\\|_L \\le 1} \\left( \\mathbb{E}_{x \\sim \\mu}[f(x)] - \\mathbb{E}_{y \\sim \\nu}[f(y)] \\right)$$

Cette formulation élimine les discontinuités de gradients observées dans les divergences de Kullback-Leibler ou de Jensen-Shannon lorsque les variétés de données ont une intersection de mesure nulle.

#### B. Application aux Réseaux Adversaires Génératifs (WGAN) et Modèles de Diffusion
1. **Pénalisation de Gradient (WGAN-GP)** : En imposant la condition $\\mathbb{E}_{\\hat{x}} [(\\|\\nabla_{\\hat{x}} D(\\hat{x})\\|_2 - 1)^2]$, le discriminateur agit comme un potentiel de Kantorovich stable.
2. **Diffusion Score-Based** : Le transport de la mesure de bruit gaussienne vers la variété des données via des équations différentielles stochastiques (SDE) inverses s'interprète comme un flot de gradient dans l'espace de Wasserstein-2.

#### C. Synthèse Pédagogique du Professeur Diallo
En recherche doctorale, comprendre le transport optimal vous donne la clé géométrique universelle : vous ne comparez plus les densités point par point, mais vous mesurez l'énergie mécanique requise pour déformer une variété de données vers une autre.`
                    },
                    {
                        id: 'doc-ai-l2',
                        title: "1.2 Dynamique des gradients stochastiques et paysage de pertes non convexes",
                        duration: "3h45",
                        completed: false,
                        isLocked: false,
                        content: `### 2. Géométrie du Paysage d'Optimisation et Sur-Paramétrisation

Dans les régimes sur-paramétrés des réseaux profonds ($N \\gg P$), le paysage de la fonction de perte présente des propriétés remarquables :

1. **Absence quasi-totale de minima locaux sous-optimaux stricts** : la plupart des points critiques sont des cols de dimension élevée.
2. **Biais inductif implicite du SGD** : La descente de gradient stochastique sélectionne des minima plats à faible courbure hessienne, favorisant la généralisation hors distribution.

#### Approche par Théorie des Noyaux Tangents Réseau (NTK)
Lorsque la largeur des couches $m \\to \\infty$, la dynamique d'apprentissage converge vers une régression linéaire dans un espace hilbertien reproduisant associé au noyau invariant :

$$\\Theta(x, x') = \\lim_{m \\to \\infty} \\left\\langle \\nabla_\\theta f(x; \\theta_0), \\nabla_\\theta f(x'; \\theta_0) \\right\\rangle$$`
                    }
                ],
                quiz: [
                    {
                        id: 'q-doc-1',
                        question: "Pourquoi la distance de Wasserstein W1 est-elle supérieure à la divergence KL pour entraîner des modèles génératifs sur des variétés de basse dimension ?",
                        options: [
                            "Elle fournit une distance continue et différentiable presque partout même lorsque les supports des distributions sont disjoints.",
                            "Elle ne nécessite aucun calcul d'espérance mathématique.",
                            "Elle annule toujours les gradients des couches intermédiaires.",
                            "Elle est strictement égale à la distance euclidienne standard."
                        ],
                        correctIndex: 0,
                        explanation: "La distance de Wasserstein prend en compte la géométrie sous-jacente de l'espace métrique, garantissant un gradient informatif même quand les distributions n'ont aucun recouvrement de support."
                    }
                ]
            },
            {
                id: 'doc-ai-m2',
                number: 2,
                title: "Architectures de Modèles Fondamentaux & Inférence Multimodale",
                description: "Mécanismes d'attention sparses, modélisation de séquences d'états (Mamba/S4), alignement RLHF/DPO et inférence distribuée.",
                estimatedHours: 50,
                lessons: [
                    {
                        id: 'doc-ai-l3',
                        title: "2.1 Mécanismes d'attention linéaires et modèles à espace d'états sélectifs (SSM)",
                        duration: "4h00",
                        completed: false,
                        isLocked: false,
                        content: `### Modèles à Espace d'États Sélectifs (Selective State Space Models)

Face à la complexité quadratique $\\mathcal{O}(L^2)$ de l'auto-attention standard de Transformer, les architectures SSM discrétisent des équations différentielles continues :

$$h'(t) = A h(t) + B x(t)$$
$$y(t) = C h(t) + D x(t)$$

En rendant les matrices $B, C$ dépendantes de l'entrée $x_t$ (mécanisme de sélection), le modèle filtre l'information pertinente à travers une mémoire récurrente tout en conservant une complexité linéaire $\\mathcal{O}(L)$ et un parallélisme matériel complet à l'entraînement.`
                    }
                ],
                quiz: [
                    {
                        id: 'q-doc-2',
                        question: "Quel est l'avantage principal des architectures SSM sélectives par rapport aux Transformers standards lors de l'inférence sur de très longs contextes ?",
                        options: [
                            "La complexité de mémoire et de calcul d'inférence est en O(1) par pas temporel au lieu de stocker tout le cache KV en O(L).",
                            "Elles ne nécessitent aucun entraînement préalable.",
                            "Elles ne fonctionnent que sur du texte court.",
                            "Elles éliminent totalement l'usage des GPUs."
                        ],
                        correctIndex: 0,
                        explanation: "À l'inférence, un SSM sélectif n'a besoin que de maintenir son vecteur d'état interne caché h_t, supprimant l'explosion quadratique du cache Key-Value des Transformers."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-doc-1',
                question: "Dans le cadre de la dualité de Kantorovich-Rubinstein pour la distance de Wasserstein W1, quelle contrainte mathématique essentielle doit être respectée par la fonction critique f ?",
                options: [
                    "Être 1-Lipschitzienne sur tout le domaine métrique.",
                    "Être strictement convexe et bornée par zéro.",
                    "Avoir une intégrale nulle sur le compact considéré.",
                    "Être un polynôme de degré inférieur ou égal à 2."
                ],
                correctIndex: 0,
                explanation: "La dualité de Kantorovich-Rubinstein stipule que le supremum est calculé sur l'ensemble des fonctions 1-Lipschitziennes, ce qui est couramment approché par du gradient penalty (WGAN-GP) ou du spectral normalization."
            },
            {
                id: 'ex-doc-2',
                question: "Comment le théorème des Noyaux Tangents Réseau (NTK) caractérise-t-il l'apprentissage des réseaux de neurones lorsque la largeur des couches tend vers l'infini ?",
                options: [
                    "La dynamique des paramètres équivaut à une descente de gradient sur un modèle linéaire à noyau fixe calculé à l'initialisation.",
                    "Le réseau devient incapable de converger vers une perte nulle.",
                    "Toutes les matrices de poids s'annulent spontanément.",
                    "Le coût d'entraînement devient indépendant de la taille du jeu de données."
                ],
                correctIndex: 0,
                explanation: "En régime NTK (largeur infinie), les représentations internes ne changent pratiquement pas et la dynamique d'entraînement est régie analytiquement par un noyau invariant."
            },
            {
                id: 'ex-doc-3',
                question: "Quelle est la principale différence opérationnelle entre les méthodes d'alignement RLHF (PPO) et Direct Preference Optimization (DPO) ?",
                options: [
                    "DPO dérive une solution exacte sous forme close pour la politique optimale, éliminant le besoin d'un modèle de récompense explicite séparé et d'échantillonnage RL instable.",
                    "DPO utilise un réseau de neurones supplémentaire pour prédire la météo.",
                    "RLHF ne nécessite aucune donnée humaine alors que DPO en requiert des millions.",
                    "DPO ne peut fonctionner que sur des modèles de moins de 10 millions de paramètres."
                ],
                correctIndex: 0,
                explanation: "DPO réécrit mathématiquement la fonction de perte de préférence directement en fonction de la politique du modèle, évitant l'instabilité de l'optimisation par renforcement de PPO."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. MASTER : MBA STRATÉGIE & COMMERCE INTERNATIONAL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'master-mba-international',
        title: "MBA : Stratégie Internationale, Négociation & Macroéconomie",
        certificationTitle: "Diplôme de Master & MBA en Management Stratégique International",
        degreeLevel: "Master (Bac+5 / Grade de Master)",
        institution: "Institut des Hautes Études Commerciales Le Monde à Vous (en partenariat INSEAD)",
        level: 'Master',
        category: 'Business & Commerce',
        duration: "18 Mois (Parcours Continu ou Alterné)",
        ectsCredits: 120,
        totalHours: 320,
        passingScore: 10,
        examDurationMinutes: 30,
        rating: 4.94,
        reviewsCount: 520,
        students: 2890,
        thumbnailUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=900&auto=format&fit=crop&q=80",
        description: "Formation de haut niveau pour futurs dirigeants, directeurs de filiales internationales et négociateurs d'affaires. Maîtrise des fusions-acquisitions transfrontalières, du commerce Afrique-Asie-Europe-Amériques et de la finance stratégique.",
        prerequisites: [
            "Licence (Bac+3) ou Bachelor validé en Gestion, Économie, Droit, Ingénierie ou Commerce",
            "Expérience professionnelle recommandée ou fort projet d'entreprise"
        ],
        targetAudience: "Cadres dirigeants, directeurs commerciaux, fondateurs d'entreprises d'import-export et consultants en stratégie.",
        careerOutcomes: [
            "Directeur Général de Filiale Internationale",
            "Chief Strategy Officer (CSO)",
            "Directeur du Développement Commercial & Export",
            "Consultant Senior en Stratégie & M&A"
        ],
        instructorsList: [
            {
                id: 'inst-amadou',
                name: "Ing. Amadou Diallo",
                title: "Directeur de Chaire Commerce & Systèmes Stratégiques",
                institution: "Académie Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
                bio: "Négociateur international chevronné, spécialiste des accords bilatéraux et des hubs logistiques transfrontaliers."
            }
        ],
        objectives: [
            "Conduire des négociations commerciales de grande envergure avec accords Incoterms 2026",
            "Structurer le financement de projets internationaux et la couverture des risques de change",
            "Déployer des stratégies de pénétration de marché multiculturelles"
        ],
        modulesList: [
            {
                id: 'mba-m1',
                number: 1,
                title: "Gouvernance Mondiale & Stratégie d'Expansion",
                description: "Analyse géopolitique des flux commerciaux, zones de libre-échange (ZLECAF, ASEAN, UE) et chaîne de valeur globale.",
                estimatedHours: 35,
                lessons: [
                    {
                        id: 'mba-l1',
                        title: "1.1 Cartographie des corridors logistiques et structuration des filiales transfrontalières",
                        duration: "3h00",
                        completed: false,
                        isLocked: false,
                        content: `### Structuration des Opérations Internationales

L'expansion sur les marchés émergents requiert une analyse fine du triptyque :
1. **Risque de change et rapatriement des devises** : Stratégies de couverture par contrats à terme (FX Forwards) et swaps de devises.
2. **Conformité douanière & Incoterms 2026** : Choix optimal entre FOB, CIF et DDP selon la capacité de dédouanement local.
3. **Pactes d'actionnaires et joint-ventures locales** : Clauses de sortie conjointe (*tag-along / drag-along*), droit de préemption et clauses de médiation commerciale.`
                    }
                ],
                quiz: [
                    {
                        id: 'q-mba-1',
                        question: "Dans le cadre d'un contrat international sous Incoterm CIF (Cost, Insurance and Freight), à quel moment exact s'effectue le transfert des risques du vendeur à l'acheteur ?",
                        options: [
                            "Dès que les marchandises sont chargées à bord du navire au port d'embarquement.",
                            "À la livraison finale dans l'entrepôt de l'acheteur.",
                            "Au moment du paiement bancaire de la lettre de crédit.",
                            "Après le passage en douane import."
                        ],
                        correctIndex: 0,
                        explanation: "En Incoterm CIF, bien que le vendeur paie le fret et l'assurance jusqu'au port de destination, le transfert de risque intervient dès la mise à bord du navire au port de départ."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-mba-1',
                question: "Quelle clause juridique est indispensable pour garantir qu'un investisseur minoritaire puisse céder ses parts aux mêmes conditions que l'actionnaire majoritaire lors d'un rachat ?",
                options: [
                    "La clause de sortie conjointe (Tag-Along)",
                    "La clause d'inaliénabilité temporaire",
                    "La clause d'arbitrage forcé",
                    "La clause de non-concurrence simple"
                ],
                correctIndex: 0,
                explanation: "La clause de sortie conjointe (Tag-Along ou droit de suite) protège les actionnaires minoritaires en leur donnant le droit de vendre leurs titres si le majoritaire cède sa participation."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. LICENCE / BACHELOR : INFORMATIQUE & DÉVELOPPEMENT FULL-STACK
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'licence-fullstack-dev',
        title: "Bachelor / Licence en Informatique & Génie Logiciel Full-Stack",
        certificationTitle: "Licence Universitaire & Bachelor en Développement Logiciel & Cloud",
        degreeLevel: "Licence / Bachelor (Bac+3)",
        institution: "Faculté des Sciences & Technologies Le Monde à Vous (en partenariat Sorbonne & Polytechnique)",
        level: 'Licence',
        category: 'Tech & IA',
        duration: "3 Ans (ou VAE / Parcours Intensif 9 Mois)",
        ectsCredits: 180,
        totalHours: 400,
        passingScore: 10,
        examDurationMinutes: 30,
        rating: 4.92,
        reviewsCount: 780,
        students: 4500,
        thumbnailUrl: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=900&auto=format&fit=crop&q=80",
        description: "Formation complète d'ingénieur logiciel opérationnel : algorithmique, structures de données, architecture modulaire React/Node/TypeScript, bases de données relationnelles PostgreSQL/Supabase, sécurité et DevOps.",
        prerequisites: [
            "Baccalauréat Scientifique, Technique ou équivalent validé",
            "Appétence pour la logique algorithmique et la résolution de problèmes"
        ],
        targetAudience: "Étudiants post-bac, professionnels en reconversion, techniciens souhaitant obtenir un diplôme supérieur officiel.",
        careerOutcomes: [
            "Ingénieur Développeur Full-Stack (React / Node / TypeScript)",
            "Développeur Back-End & Architecte API",
            "Lead Front-End Engineer",
            "Consultant Cloud & DevOps Junior"
        ],
        instructorsList: [
            {
                id: 'inst-diallo',
                name: "Professeur Diallo",
                title: "Doyen Académique des Sciences Informatiques",
                institution: "Académie Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                bio: "Formateur de milliers d'ingénieurs à travers le monde, passionné par le code propre, robuste et résilient."
            }
        ],
        objectives: [
            "Concevoir des architectures web modulaires et sécurisées de bout en bout",
            "Maîtriser PostgreSQL, les index B-Tree et la modélisation relationnelle",
            "Implémenter des protocoles de sécurité stricts (JWT, OAuth2, RBAC, chiffrement AES-256)",
            "Déployer des applications conteneurisées avec CI/CD automatisé"
        ],
        modulesList: [
            {
                id: 'lic-fs-m1',
                number: 1,
                title: "Algorithmique Avancée & Typage Strict TypeScript",
                description: "Types génériques, inférence de types, gestion asynchrone par Promises/Event Loop et programmation fonctionnelle.",
                estimatedHours: 40,
                lessons: [
                    {
                        id: 'lic-fs-l1',
                        title: "1.1 Système de types statiques, Génériques et Inférence TypeScript",
                        duration: "2h30",
                        completed: false,
                        isLocked: false,
                        content: `### Maîtrise Approfondie de TypeScript

TypeScript transforme JavaScript en un environnement de développement sécurisé :
1. **Types conditionnels et Mapped Types** :
\`\`\`typescript
type NonNullableProperties<T> = {
    [K in keyof T]: NonNullable<T[K]>;
};
\`\`\`
2. **Discriminated Unions** : Utilisation d'un champ discriminant unique (\`type\` ou \`status\`) pour garantir l'exhaustivité des branches de traitement via \`never\`.
3. **Gestion des Promises & Event Loop** : Comprendre l'ordonnancement entre micro-tâches (Promises) et macro-tâches (\`setTimeout\`, I/O).`
                    }
                ],
                quiz: [
                    {
                        id: 'q-lic-1',
                        question: "Quel est l'effet de l'opérateur 'keyof' en TypeScript ?",
                        options: [
                            "Il produit une union de types littéraux représentant toutes les clés publiques d'un type objet.",
                            "Il supprime les clés d'un objet.",
                            "Il convertit un objet en chaîne JSON.",
                            "Il instancie automatiquement une classe abstraite."
                        ],
                        correctIndex: 0,
                        explanation: "'keyof T' extrait l'ensemble des clés connues de T sous forme d'une union de chaînes ou symboles."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-lic-1',
                question: "Quelle stratégie d'indexation dans PostgreSQL est la plus adaptée pour accélérer des recherches textuelles par préfixe ou trigrammes ?",
                options: [
                    "Un index GIN basé sur pg_trgm",
                    "Un index Hash classique",
                    "Un simple scan séquentiel sans index",
                    "Un index B-Tree ascendant standard"
                ],
                correctIndex: 0,
                explanation: "Les index GIN (Generalized Inverted Index) combinés à l'extension pg_trgm permettent des recherches full-text et partielles avec une vitesse optimale."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. SECONDAIRE : BACCALAURÉAT SCIENTIFIQUE & MATHÉMATIQUES AVANCÉES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'sec-bac-sciences-maths',
        title: "Baccalauréat Scientifique & Mathématiques d'Excellence",
        certificationTitle: "Diplôme Officiel du Baccalauréat Scientifique (Sciences Mathématiques & Physiques)",
        degreeLevel: "Secondaire / Baccalauréat (Niveau 4)",
        institution: "Lycée d'Excellence Le Monde à Vous (Conforme MEPU-A, Eduscol, Bac International)",
        level: 'Secondaire',
        category: 'Santé & Sciences',
        duration: "Programme Annuel de Terminale (9 Mois)",
        ectsCredits: 60,
        totalHours: 350,
        passingScore: 10,
        examDurationMinutes: 30,
        rating: 4.97,
        reviewsCount: 1200,
        students: 6200,
        thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=900&auto=format&fit=crop&q=80",
        description: "Préparation intégrale et intensive au Baccalauréat Scientifique : Analyse réelle, Fonctions exponentielles et logarithmes, Nombres complexes, Géométrie dans l'espace, Mécanique newtonienne et Thermodynamique.",
        prerequisites: [
            "Niveau Première Scientifique validé ou équivalent"
        ],
        targetAudience: "Élèves de Terminale candidats au Baccalauréat officiel et candidats libres préparant l'entrée dans les grandes écoles d'ingénieurs.",
        careerOutcomes: [
            "Accès direct aux Classes Préparatoires aux Grandes Écoles (CPGE)",
            "Entrée en Facultés de Médecine, Pharmacie et Odontologie",
            "Admission en Écoles d'Ingénieurs et Licences Scientifiques de rang mondial"
        ],
        instructorsList: [
            {
                id: 'inst-diallo',
                name: "Professeur Diallo",
                title: "Professeur Agrégé de Mathématiques & Physique",
                institution: "Lycée d'Excellence Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                bio: "Auteur de manuels de référence, formateur de lauréats nationaux au Baccalauréat."
            }
        ],
        objectives: [
            "Maîtriser l'étude complète des fonctions (limites, dérivées, convexité, intégration)",
            "Résoudre des équations différentielles linéaires d'ordre 1 et 2",
            "Appliquer les lois de Newton et les principes de conservation de l'énergie mécanique"
        ],
        modulesList: [
            {
                id: 'bac-m1',
                number: 1,
                title: "Analyse : Limites, Continuité, Dérivation & Convexité",
                description: "Théorème des valeurs intermédiaires, corollaire de la bijection, dérivée seconde et points d'inflexion.",
                estimatedHours: 30,
                lessons: [
                    {
                        id: 'bac-l1',
                        title: "1.1 Théorème des Valeurs Intermédiaires et Résolution d'Équations",
                        duration: "2h00",
                        completed: false,
                        isLocked: false,
                        content: `### Théorème des Valeurs Intermédiaires (TVI)

#### Énoncé Fondamental :
Soit $f$ une fonction continue sur un intervalle fermé $[a, b]$. Pour tout réel $k$ compris entre $f(a)$ et $f(b)$, il existe au moins un réel $c \\in [a, b]$ tel que :
$$f(c) = k$$

#### Corollaire de la Bijection (Strictement Monotone) :
Si en outre $f$ est **strictement monotone** (strictement croissante ou strictement décroissante) sur $[a, b]$, alors l'équation $f(x) = k$ admet une **unique solution** $\\alpha$ dans $[a, b]$.

#### Méthode de Rédaction Type Bac :
1. Prouver que $f$ est dérivable et continue sur $[a, b]$.
2. Calculer $f'(x)$ et dresser le tableau de variations complet.
3. Vérifier que $k$ appartient strictement à l'intervalle image $[f(a), f(b)]$.
4. Conclure rigoureusement d'après le corollaire du TVI.`
                    }
                ],
                quiz: [
                    {
                        id: 'q-bac-1',
                        question: "Si une fonction f est continue et strictement croissante sur [1, 5] avec f(1) = -3 et f(5) = 4, combien de solutions possède l'équation f(x) = 0 sur cet intervalle ?",
                        options: [
                            "Exactement une unique solution.",
                            "Une infinité de solutions.",
                            "Aucune solution car f(1) est négatif.",
                            "Deux solutions symétriques."
                        ],
                        correctIndex: 0,
                        explanation: "Puisque 0 est compris entre -3 et 4 et que la fonction est continue et strictement monotone, le corollaire du TVI garantit l'existence d'une unique solution."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-bac-1',
                question: "Quelle est la dérivée de la fonction f(x) = ln(x² + 1) sur R ?",
                options: [
                    "f'(x) = 2x / (x² + 1)",
                    "f'(x) = 1 / (x² + 1)",
                    "f'(x) = 2x ln(x)",
                    "f'(x) = (x² + 1) / 2x"
                ],
                correctIndex: 0,
                explanation: "La dérivée de ln(u(x)) est u'(x) / u(x). Ici u(x) = x² + 1 donc u'(x) = 2x, ce qui donne f'(x) = 2x / (x² + 1)."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 5. FONDAMENTAUX : ALPHABÉTISATION, CALCUL & CITOYENNETÉ
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'fond-alpha-emancipation',
        title: "Alphabétisation Citoyenne, Lecture du Quotidien & Calcul Commercial",
        certificationTitle: "Certificat d'Émancipation Fondamentale : Lecture, Écriture & Gestion Monétaire",
        degreeLevel: "Fondamentaux & Inclusion (Niveau Socle)",
        institution: "Chaire d'Inclusion & Alphabétisation Universelle Le Monde à Vous",
        level: 'Fondamentaux',
        category: 'Fondamentaux & Langues',
        duration: "Parcours Personnalisé à son Rythme (3 à 6 Mois)",
        ectsCredits: 30,
        totalHours: 120,
        passingScore: 10,
        examDurationMinutes: 20,
        rating: 4.99,
        reviewsCount: 2300,
        students: 9400,
        thumbnailUrl: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=900&auto=format&fit=crop&q=80",
        description: "Programme d'autonomie pour adultes et jeunes apprenants : apprendre à lire les documents officiels, écrire sans hésitation, maîtriser les 4 opérations mathématiques, gérer un budget commercial et utiliser un smartphone en toute sécurité.",
        prerequisites: [
            "Aucun prérequis scolaire nécessaire. Accompagnement bienveillant et oralisé."
        ],
        targetAudience: "Adultes, commerçants, artisans et toute personne désireuse d'acquérir une autonomie complète en lecture et calcul.",
        careerOutcomes: [
            "Gestion autonome d'un commerce ou atelier artisanal",
            "Capacité à signer et comprendre un contrat officiel",
            "Passerelle directe vers les formations professionnelles qualifiantes"
        ],
        instructorsList: [
            {
                id: 'inst-diallo',
                name: "Professeur Diallo",
                title: "Guide Pédagogique Fondamental",
                institution: "Académie Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                bio: "Défenseur de l'accès universel au savoir, utilisant des analogies vivantes du quotidien pour un apprentissage sans complexe."
            }
        ],
        objectives: [
            "Lire couramment les panneaux, étiquettes, ordonnances et formulaires",
            "Écrire son nom, ses messages et remplir les documents bancaires",
            "Calculer sans se tromper les totaux de vente, bénéfices et monnaies"
        ],
        modulesList: [
            {
                id: 'fond-m1',
                number: 1,
                title: "Les Mots Utiles de la Vie Quotidienne & du Travail",
                description: "Reconnaissance des lettres, syllabes courantes et lecture des écrits administratifs.",
                estimatedHours: 20,
                lessons: [
                    {
                        id: 'fond-l1',
                        title: "1.1 Reconnaître et Écrire les Mots Clés du Commerce et de la Santé",
                        duration: "1h30",
                        completed: false,
                        isLocked: false,
                        content: `### Bienvenue dans votre Cours d'Autonomie !

Le Professeur Diallo vous accompagne pas à pas. 

#### Les Mots Essentiels :
1. **FACTURE** : Document qui donne le prix de ce que vous avez acheté.
2. **REÇU / QUITTANCE** : Preuve que vous avez payé la somme demandée.
3. **SOLDE** : L'argent qui reste sur votre compte ou dans votre caisse.
4. **DATE** : Le jour, le mois et l'année (Exemple : 28 / 08 / 2026).

#### Règle d'or du Professeur Diallo :
Avant de signer un document, vérifiez toujours :
- Votre nom complet écrit correctement.
- Le montant exact en chiffres et en lettres.
- La date du jour.`
                    }
                ],
                quiz: [
                    {
                        id: 'q-fond-1',
                        question: "Si vous achetez un produit à 15 000 GNF et que vous donnez un billet de 20 000 GNF, combien le vendeur doit-il vous rendre ?",
                        options: [
                            "5 000 GNF",
                            "10 000 GNF",
                            "2 000 GNF",
                            "35 000 GNF"
                        ],
                        correctIndex: 0,
                        explanation: "20 000 - 15 000 = 5 000 GNF de monnaie à rendre."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-fond-1',
                question: "Que signifie le mot 'BÉNÉFICE' dans une activité commerciale ?",
                options: [
                    "L'argent qu'il vous reste après avoir déduit le prix d'achat et tous les frais.",
                    "L'argent total que vous avez donné au fournisseur.",
                    "Une dette que vous devez rembourser.",
                    "Le prix du loyer de la boutique."
                ],
                correctIndex: 0,
                explanation: "Le bénéfice est le gain net réalisé : Ventes totales - (Achats + Frais)."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 6. CERTIFICATION PRO : NÉGOCIATION COMMERCIALE & EXPORT MONDIAL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'pro-certif-export-trade',
        title: "Certification d'Élite : Négociation Commerciale Internationale & Export",
        certificationTitle: "Certificat Professionnel Supérieur en Négociation & Commerce Transfrontalier",
        degreeLevel: "Certification Professionnelle d'Élite (RNCP / Équivalence Internationale)",
        institution: "Institut du Commerce Mondial Le Monde à Vous (en collab. OMC & Chambres de Commerce)",
        level: 'Pro',
        category: 'Business & Commerce',
        duration: "4 Mois Intensifs",
        ectsCredits: 40,
        totalHours: 160,
        passingScore: 12,
        examDurationMinutes: 30,
        rating: 4.95,
        reviewsCount: 640,
        students: 3100,
        thumbnailUrl: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=900&auto=format&fit=crop&q=80",
        description: "Programme professionnel certifiant : négociation de contrats de vente B2B, gestion des lettres de crédit (Crédit Documentaire L/C), dédouanement et conformité phytosanitaire/technique pour l'exportation vers l'Afrique, l'Asie, l'Europe et les Amériques.",
        prerequisites: [
            "Niveau Bac ou expérience dans la vente, la logistique ou le commerce"
        ],
        targetAudience: "Commerçants, exportateurs de matières premières, importateurs, courtiers et consultants en approvisionnement.",
        careerOutcomes: [
            "Courtier en Commerce International & Export Broker",
            "Directeur d'Agence d'Import-Export",
            "Négociateur Achat Matières Premières & Produits Manufacturés"
        ],
        instructorsList: [
            {
                id: 'inst-amadou',
                name: "Ing. Amadou Diallo",
                title: "Expert en Commerce Extérieur & Négociation",
                institution: "Académie Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
                bio: "Plus de 20 ans d'arbitrage et de négoce international sur les 5 continents."
            }
        ],
        objectives: [
            "Rédiger et négocier une offre commerciale ferme avec toutes les clauses de réserve",
            "Sécuriser les paiements par Crédit Documentaire Irrévocable et Confirmé (Credoc)",
            "Calculer le prix de revient rendu (Landed Cost) et optimiser les droits de douane"
        ],
        modulesList: [
            {
                id: 'pro-exp-m1',
                number: 1,
                title: "Sécurisation Financière & Instruments de Paiement Internationaux",
                description: "Le Crédit Documentaire, la remise documentaire, les garanties bancaires à première demande.",
                estimatedHours: 25,
                lessons: [
                    {
                        id: 'pro-exp-l1',
                        title: "1.1 Le Crédit Documentaire Irrévocable et Confirmé pas à pas",
                        duration: "2h15",
                        completed: false,
                        isLocked: false,
                        content: `### Le Crédit Documentaire (Credoc / L/C)

Le crédit documentaire est l'outil souverain de sécurisation du paiement international :
1. **Principe fondamental** : La banque de l'acheteur s'engage irrévocablement à payer le vendeur contre présentation de documents strictement conformes (Connaissement maritime B/L, Facture commerciale, Certificat d'origine, Liste de colisage).
2. **Confirmation par la banque notificatrice** : Protège le vendeur contre le risque politique et le risque de faillite de la banque émettrice.
3. **Règle d'or de conformité UCP 600** : La moindre faute d'orthographe ou discordance de date entre le B/L et la facture autorise la banque à refuser le paiement.`
                    }
                ],
                quiz: [
                    {
                        id: 'q-pro-1',
                        question: "Pourquoi est-il crucial pour un exportateur d'exiger un crédit documentaire 'CONFIRMÉ' lorsqu'il vend dans un pays à risque politique élevé ?",
                        options: [
                            "Parce que la banque confirmatrice (dans le pays du vendeur) prend l'engagement ferme de payer même si la banque émettrice ou le pays acheteur fait défaut.",
                            "Parce que cela divise les frais de douane par deux.",
                            "Parce que cela dispense de fournir un connaissement maritime.",
                            "Parce que la marchandise est transportée gratuitement par avion."
                        ],
                        correctIndex: 0,
                        explanation: "La confirmation transfère le risque sur une banque de premier rang généralement située dans le pays ou la zone monétaire de l'exportateur."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-pro-1',
                question: "Quel document maritime constitue à la fois le reçu de la marchandise à bord, la preuve du contrat de transport et le titre de propriété de la cargaison ?",
                options: [
                    "Le Connaissement Maritime (Bill of Lading / B/L)",
                    "La facture proforma",
                    "Le certificat de pesage simple",
                    "La déclaration en douane export"
                ],
                correctIndex: 0,
                explanation: "Le Bill of Lading (B/L) est le seul document négociable valant titre de propriété de la cargaison en droit maritime international."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 7. MASTER EN DROIT INTERNATIONAL DES AFFAIRES & PRATIQUE OHADA
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'master-droit-ohada',
        title: "Master en Droit International des Affaires, Contrats & Arbitrage OHADA",
        certificationTitle: "Diplôme de Master d'État en Droit des Affaires & Arbitrage International",
        degreeLevel: "Master (Bac+5 / Grade de Master)",
        institution: "Faculté de Droit & Gouvernance Le Monde à Vous (en collab. CCJA & Barreau International)",
        level: 'Master',
        category: 'Droit & Gouvernance',
        duration: "2 Ans (ou Parcours Exécutif 12 Mois)",
        ectsCredits: 120,
        totalHours: 360,
        passingScore: 12,
        examDurationMinutes: 35,
        rating: 4.96,
        reviewsCount: 410,
        students: 2150,
        thumbnailUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=900&auto=format&fit=crop&q=80",
        description: "Programme juridique supérieur dédié à la maîtrise du droit uniforme des affaires OHADA, de la rédaction de contrats commerciaux internationaux complexes, des sûretés bancaires et de la conduite des arbitrages devant la CCJA et la CCI de Paris.",
        prerequisites: [
            "Licence en Droit, Sciences Politiques, Gestion d'Entreprise ou diplôme équivalent",
            "Capacité d'analyse juridique et maîtrise de la méthodologie du cas pratique"
        ],
        targetAudience: "Juristes d'entreprise, avocats stagiaires, notaires, magistrats, directeurs juridiques et consultants en conformité.",
        careerOutcomes: [
            "Directeur Juridique & Compliance Officer International",
            "Avocat d'Affaires spécialisé en Droit OHADA & Arbitrage",
            "Arbitre & Médiateur Commercial International",
            "Conseiller Juridique auprès d'institutions multilatérales (Banque Mondiale, BAD)"
        ],
        instructorsList: [
            {
                id: 'inst-diallo',
                name: "Professeur Diallo",
                title: "Doyen de la Faculté de Droit & Agrégé des Facultés de Droit",
                institution: "Académie Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
                bio: "Éminent juriste et arbitre international, auteur de plusieurs traités sur l'harmonisation du droit des affaires en Afrique."
            }
        ],
        objectives: [
            "Rédiger des contrats commerciaux transfrontaliers conformes à l'Acte Uniforme OHADA",
            "Structurer les garanties de paiement et sûretés (hypothèque, nantissement de compte, cautionnement)",
            "Conduire une procédure d'arbitrage commercial international de la saisine au prononcé de la sentence"
        ],
        modulesList: [
            {
                id: 'droit-ohada-m1',
                number: 1,
                title: "Droit des Sociétés Commerciales & Gouvernance selon l'Acte Uniforme OHADA",
                description: "Constitution des SAS, SARL, SA, pactes d'actionnaires, prévention des difficultés et responsabilité des dirigeants.",
                estimatedHours: 35,
                lessons: [
                    {
                        id: 'droit-ohada-l1',
                        title: "1.1 La Société par Actions Simplifiée (SAS) en droit OHADA révisé",
                        duration: "2h45",
                        completed: false,
                        isLocked: false,
                        content: `### La Société par Actions Simplifiée (SAS) en Espace OHADA

L'Acte Uniforme révisé relatif au droit des sociétés commerciales et du GIE (AUDSCGIE) a introduit la SAS, offrant une souplesse statutaire inédite :

#### 1. Liberté Contractuelle et Organisation des Pouvoirs
Contrairement à la Société Anonyme (SA) encadrée par des règles impératives strictes (Conseil d'Administration, Direction Générale) :
* Les associés de la SAS fixent librement dans les statuts les conditions dans lesquelles la société est dirigée (Président unique, Comité de direction, Directeurs généraux délégués).
* **Capital Minimum** : La loi OHADA ne fixe aucun capital minimum obligatoire pour la SAS (sauf clause statutaire contraire), favorisant l'amorçage de startups et filiales agiles.

#### 2. Clauses Statutaires Stratégiques
1. **Clause d'Inaliénabilité Temporaire** : Interdiction de céder les actions pendant une durée maximale de 10 ans.
2. **Clause d'Agrément** : Soumet toute cession d'actions à des tiers ou entre associés à l'accord préalable de l'assemblée ou du Président.
3. **Clause d'Exclusion** : Faculté d'obliger un actionnaire défaillant ou concurrent à céder ses titres à un prix fixé à dire d'expert (article 59 de l'AUDSCGIE).`
                    }
                ],
                quiz: [
                    {
                        id: 'q-droit-1',
                        question: "En droit OHADA, quelle est la durée maximale autorisée pour une clause d'inaliénabilité statutaire dans une SAS ?",
                        options: [
                            "10 ans",
                            "5 ans",
                            "2 ans",
                            "Illimitée"
                        ],
                        correctIndex: 0,
                        explanation: "L'Acte Uniforme relatif au droit des sociétés commerciales limite strictement la validité de la clause d'inaliénabilité à une durée maximale de 10 ans."
                    }
                ]
            },
            {
                id: 'droit-ohada-m2',
                number: 2,
                title: "Arbitrage International & Voies d'Exécution",
                description: "Convention d'arbitrage, constitution du tribunal arbitral, recours en annulation et exequatur devant la CCJA.",
                estimatedHours: 40,
                lessons: [
                    {
                        id: 'droit-ohada-l2',
                        title: "2.1 La Clause Compromissoire et l'Autonomie de la Convention d'Arbitrage",
                        duration: "3h00",
                        completed: false,
                        isLocked: false,
                        content: `### Principe de Séparabilité de la Clause Compromissoire

En droit de l'arbitrage international (Acte Uniforme OHADA & Règlement CCJA) :
* **Principe de Séparabilité / Autonomie** : La clause d'arbitrage insérée dans un contrat principal conserve sa validité et son autonomie juridique même en cas de nullité, résiliation ou inexistence du contrat principal.
* **Principe Compétence-Compétence** : Le tribunal arbitral est seul compétent pour statuer en priorité sur sa propre compétence et sur la validité de la convention d'arbitrage.

#### Exequatur et Contrôle de la CCJA :
La sentence arbitrale rendue sous l'égide de la CCJA bénéficie d'une force exécutoire immédiate dans les 17 États membres dès l'octroi de l'exequatur par le Président de la Cour Commune de Justice et d'Arbitrage.`
                    }
                ],
                quiz: [
                    {
                        id: 'q-droit-2',
                        question: "Que garantit le principe de séparabilité de la clause compromissoire ?",
                        options: [
                            "La clause d'arbitrage reste valable et efficace même si le contrat principal est frappé de nullité.",
                            "L'arbitre peut juger sans respecter le contradictoire.",
                            "Le contrat devient automatiquement gratuit.",
                            "L'arbitre est obligatoirement un juge d'État."
                        ],
                        correctIndex: 0,
                        explanation: "Le principe d'autonomie empêche une partie d'invoquer la nullité du contrat principal pour échapper à la juridiction de l'arbitre."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-droit-1',
                question: "Quelle juridiction suprême communautaire est compétente en dernier ressort pour interpréter les Actes Uniformes OHADA et accorder l'exequatur régional ?",
                options: [
                    "La Cour Commune de Justice et d'Arbitrage (CCJA) à Abidjan",
                    "La Cour Pénale Internationale (CPI)",
                    "La Cour Suprême de chaque pays membre sans recours",
                    "Le Tribunal de Commerce de Paris"
                ],
                correctIndex: 0,
                explanation: "La CCJA est la juridiction suprême supranationale garante de l'uniformité du droit des affaires dans l'espace OHADA."
            }
        ]
    },

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 8. DIPLÔME D'INGÉNIEUR EN ARCHITECTURES CLOUD & CYBERSÉCURITÉ
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    {
        id: 'ing-cloud-cyber',
        title: "Diplôme d'Ingénieur en Architectures Cloud Distribuées & Cybersécurité",
        certificationTitle: "Titre d'Ingénieur Diplômé d'État en Ingénierie Cloud, DevOps & Sécurité Systèmes",
        degreeLevel: "Master (Bac+5 / Grade d'Ingénieur)",
        institution: "Grande École d'Ingénieurs Le Monde à Vous (en partenariat CTI & Cloud Native Computing Foundation)",
        level: 'Ingénieur',
        category: 'Tech & IA',
        duration: "2 Ans (ou VAE / 12 Mois Intensifs)",
        ectsCredits: 120,
        totalHours: 380,
        passingScore: 12,
        examDurationMinutes: 40,
        rating: 4.98,
        reviewsCount: 610,
        students: 3400,
        thumbnailUrl: "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=900&auto=format&fit=crop&q=80",
        description: "Formation d'élite en conception de systèmes hautement disponibles, scalabilité horizontale, conteneurisation Kubernetes, sécurité Zero-Trust, chiffrement de bout en bout et observabilité temps réel.",
        prerequisites: [
            "Licence en Informatique, Mathématiques ou diplôme d'Ingénieur Bac+3 validé",
            "Maîtrise de Linux, des réseaux TCP/IP et d'au moins un langage (Go, Python, TypeScript, Rust)"
        ],
        targetAudience: "Développeurs seniors, administrateurs systèmes, architectes techniques et consultants DevOps.",
        careerOutcomes: [
            "Chief Information Security Officer (CISO / RSSI)",
            "Principal Cloud Solutions Architect (GCP / AWS / Azure)",
            "Lead Site Reliability Engineer (SRE)",
            "Expert en Sécurité & Cryptographie Appliquée"
        ],
        instructorsList: [
            {
                id: 'inst-amadou',
                name: "Ing. Amadou Diallo",
                title: "Directeur de l'École d'Ingénieurs & Architecte Cloud Fellow",
                institution: "Grande École Le Monde à Vous",
                avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
                bio: "Pionnier des infrastructures haute résilience et de la souveraineté numérique."
            }
        ],
        objectives: [
            "Concevoir des architectures multi-régions sans point unique de défaillance (SPOF)",
            "Implémenter une sécurité Zero-Trust avec mTLS et gestion fine des identités IAM",
            "Automatiser les pipelines CI/CD GitOps avec Kubernetes et Terraform"
        ],
        modulesList: [
            {
                id: 'cloud-m1',
                number: 1,
                title: "Architecture Haute Disponibilité & Résilience Distribuée",
                description: "Théorème CAP, consensus Raft/Paxos, réplication multi-maître et partitionnement de données.",
                estimatedHours: 40,
                lessons: [
                    {
                        id: 'cloud-l1',
                        title: "1.1 Le Théorème CAP et la Cohérence Éventuelle dans les Systèmes Cloud",
                        duration: "2h30",
                        completed: false,
                        isLocked: false,
                        content: `### Fondements des Systèmes Distribués & Théorème CAP

Dans tout système distribué asynchrone interconnecté par un réseau sujet à des pannes :

#### 1. Les Trois Piliers du Théorème de Brewer (CAP)
1. **Consistance (C - Cohérence)** : Chaque lecture reçoit l'écriture la plus récente ou une erreur.
2. **Disponibilité (A - Availability)** : Chaque requête non défaillante reçoit une réponse (sans garantie qu'elle contienne l'écriture la plus récente).
3. **Tolérance au Partitionnement (P - Partition Tolerance)** : Le système continue de fonctionner malgré la perte ou le retard de messages entre les nœuds.

*Théorème :* En présence inévitable d'un partitionnement réseau ($P$), un système distribué doit impérativement choisir entre **$CP$** (Cohérence stricte au détriment de la disponibilité) ou **$AP$** (Disponibilité maximale avec cohérence éventuelle - *Eventual Consistency*).`
                    }
                ],
                quiz: [
                    {
                        id: 'q-cloud-1',
                        question: "Face à une rupture de lien réseau entre deux datacenters (partition réseau), quel compromis impose le théorème CAP ?",
                        options: [
                            "Choisir entre maintenir la cohérence des données (CP) ou garantir la disponibilité des requêtes (AP).",
                            "Éteindre tous les serveurs immédiatement.",
                            "Remplacer les bases de données par des fichiers texte.",
                            "Le système peut garantir simultanément C, A et P sans aucun compromis."
                        ],
                        correctIndex: 0,
                        explanation: "Puisque les réseaux physiques ne peuvent garantir zéro panne (P est obligatoire), on doit arbitrer entre consistance stricte (CP) et disponibilité permanente (AP)."
                    }
                ]
            }
        ],
        examQuestions: [
            {
                id: 'ex-cloud-1',
                question: "Quel protocole de cryptographie asymétrique garantit à la fois l'authentification mutuelle du client et du serveur ainsi que le chiffrement en transit ?",
                options: [
                    "mTLS (Mutual Transport Layer Security)",
                    "HTTP simple sans certificat",
                    "Telnet avec mot de passe MD5",
                    "FTP anonyme"
                ],
                correctIndex: 0,
                explanation: "mTLS exige que le client ET le serveur présentent chacun un certificat X.509 valide signé par une autorité de certification reconnue."
            }
        ]
    }
];

export const ALL_CERTIFYING_FORMATIONS = CERTIFYING_FORMATIONS_CATALOG;

