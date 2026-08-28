// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CURRICULUM REGISTRY — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Référentiels éducatifs nationaux et internationaux vérifiés
// Conformes aux programmes des Ministères de l'Éducation respectifs.

import { 
    EducationalCurriculumFramework, 
    AcademicEquivalenceComparison, 
    StudentPedagogicalProfile,
    MockExamBlueprint
} from '../types';

export const OFFICIAL_CURRICULUMS: EducationalCurriculumFramework[] = [
    // 🇬🇳 GUINÉE (MEPU-A & MESRSI)
    {
        id: 'curr-gn',
        countryCode: 'GN',
        countryName: 'Guinée',
        countryFlag: '🇬🇳',
        systemName: 'Système Éducatif Guinéen (MEPU-A)',
        officialAuthority: "Ministère de l'Enseignement Pré-Universitaire et de l'Alphabétisation de Guinée",
        lastCurriculumReviewYear: 2026,
        verificationSourceUrl: 'https://mepua.gov.gn',
        cycles: [
            {
                id: 'gn-cycle-fondamental',
                cycleName: 'Alphabétisation & Fondamentaux Pour Tous',
                levels: [
                    {
                        id: 'gn-alpha-adult',
                        code: 'gn_alpha_base',
                        name: 'Alphabétisation Adultes & Calcul Émancipateur',
                        academicLevel: 'Fondamentaux',
                        ageOrTargetAudience: 'Adultes et Jeunes non scolarisés',
                        isLiteracyFoundation: true,
                        officialExams: ['Attestation de Lecture, Écriture et Calcul Utile'],
                        subjects: [
                            {
                                id: 'gn-sub-alpha-fr',
                                code: 'alpha_fr',
                                name: 'Lecture & Écriture du Quotidien',
                                description: 'Reconnaissance des lettres, syllabes, écriture de son nom, lecture des panneaux et contrats simples.',
                                officialObjectives: ['Savoir lire un document administratif', 'Remplir un formulaire', 'Communiquer par message écrit'],
                                chapters: [
                                    {
                                        id: 'gn-ch-alpha-1',
                                        title: 'Les 26 Lettres et les Sons de Base',
                                        description: 'Voyelles, consonnes et syllabation pratique.',
                                        orderIndex: 1,
                                        estimatedHours: 15,
                                        competencies: [
                                            {
                                                id: 'gn-comp-alpha-1',
                                                code: 'ALPHA-01',
                                                title: 'Identifier et prononcer les voyelles et consonnes simples',
                                                description: 'Reconnaissance visuelle et sonore de l’alphabet.',
                                                cognitiveDomain: 'memorisation',
                                                keyConcepts: ['Voyelles', 'Consonnes', 'Son', 'Graphie']
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'gn-sub-calc-base',
                                code: 'calc_base',
                                name: 'Calcul Commercial & Gestion Monétaire',
                                description: 'Additions, soustractions, calcul des rendus de monnaie en GNF/FCFA/EUR, pourcentages de bénéfice.',
                                officialObjectives: ['Calculer un total de commande', 'Vérifier la monnaie', 'Calculer une marge commerciale'],
                                chapters: [
                                    {
                                        id: 'gn-ch-calc-1',
                                        title: 'Les 4 Opérations appliquées au Marché',
                                        description: 'Sommes, déductions, multiplications rapides et divisions équitables.',
                                        orderIndex: 1,
                                        estimatedHours: 20,
                                        competencies: [
                                            {
                                                id: 'gn-comp-calc-1',
                                                code: 'CALC-01',
                                                title: 'Effectuer des calculs monétaires instantanés sans erreur',
                                                description: 'Calcul mental et posé appliqué aux transactions.',
                                                cognitiveDomain: 'application_pratique',
                                                keyConcepts: ['Monnaie', 'Addition', 'Soustraction', 'Prix unitaire']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            },
            {
                id: 'gn-cycle-secondaire',
                cycleName: 'Enseignement Secondaire & Lycée Guinéen',
                levels: [
                    {
                        id: 'gn-tle-sm',
                        code: 'gn_tle_sm',
                        name: 'Terminale Sciences Mathématiques (SM)',
                        academicLevel: 'Lycee',
                        ageOrTargetAudience: '17-19 ans & Candidats Libres au Bac',
                        streams: ['Sciences Mathématiques'],
                        officialExams: ['Baccalauréat Unique Guinéen - Option SM'],
                        subjects: [
                            {
                                id: 'gn-sm-maths',
                                code: 'gn_maths_sm',
                                name: 'Mathématiques Approfondies (Coeff 5)',
                                coefficient: 5,
                                hoursPerWeek: 6,
                                description: 'Analyse réelle, suites numériques, calcul intégral, équations différentielles, géométrie dans l’espace, arithmétique et probabilités.',
                                officialObjectives: [
                                    'Maîtriser l’étude complète des fonctions transcendantes (ln, exp, puissances)',
                                    'Calculer des intégrales et résoudre des équations différentielles linéaires',
                                    'Maîtriser les théorèmes d’arithmétique de Gauss et Bézout'
                                ],
                                chapters: [
                                    {
                                        id: 'gn-sm-ch-fonctions',
                                        title: 'Limites, Continuité et Dérivation des Fonctions',
                                        description: 'Théorème des valeurs intermédiaires, bijection, dérivées successives et branches infinies.',
                                        orderIndex: 1,
                                        estimatedHours: 25,
                                        competencies: [
                                            {
                                                id: 'gn-comp-math-01',
                                                code: 'MATH-SM-01',
                                                title: 'Calculer des limites de formes indéterminées et asymptotes',
                                                description: 'Utilisation des croissances comparées et factorisations canoniques.',
                                                cognitiveDomain: 'resolution_probleme',
                                                keyConcepts: ['Limite', 'Forme indéterminée', 'Asymptote oblique', 'Croissance comparée']
                                            },
                                            {
                                                id: 'gn-comp-math-02',
                                                code: 'MATH-SM-02',
                                                title: 'Appliquer le Théorème des Valeurs Intermédiaires (TVI) et la bijection',
                                                description: 'Démontrer l’existence et l’unicité d’une racine pour f(x)=k.',
                                                cognitiveDomain: 'raisonnement',
                                                keyConcepts: ['TVI', 'Monotonie stricte', 'Continuité', 'Corollaire de bijection']
                                            }
                                        ]
                                    },
                                    {
                                        id: 'gn-sm-ch-arithmetique',
                                        title: 'Arithmétique & Congruences',
                                        description: 'Divisibilité dans Z, PGCD, PPCM, algorithme d’Euclide, théorème de Gauss et de Bézout.',
                                        orderIndex: 2,
                                        estimatedHours: 20,
                                        competencies: [
                                            {
                                                id: 'gn-comp-math-03',
                                                code: 'MATH-SM-03',
                                                title: 'Résoudre les équations diophantiennes ax + by = c dans Z²',
                                                description: 'Recherche de solution particulière avec l’algorithme d’Euclide étendu.',
                                                cognitiveDomain: 'resolution_probleme',
                                                keyConcepts: ['Bézout', 'Gauss', 'Équation diophantienne', 'Congruence modulo n']
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'gn-sm-physique',
                                code: 'gn_phys_sm',
                                name: 'Physique-Chimie (Coeff 4)',
                                coefficient: 4,
                                hoursPerWeek: 5,
                                description: 'Mécanique de Newton, oscillateurs, électromagnétisme, optique ondulatoire et cinétique chimique.',
                                officialObjectives: ['Appliquer les lois de Newton aux mouvements de projectiles et satellites', 'Étudier les circuits RLC'],
                                chapters: [
                                    {
                                        id: 'gn-sm-ch-mecanique',
                                        title: 'Lois de Newton & Mouvements dans un Champ de Pesanteur',
                                        description: 'Équations horaires, trajectoire parabolique et conservation de l’énergie.',
                                        orderIndex: 1,
                                        estimatedHours: 22,
                                        competencies: [
                                            {
                                                id: 'gn-comp-phys-01',
                                                code: 'PHYS-SM-01',
                                                title: 'Établir les équations différentielles et horaires du mouvement d’un projectile',
                                                description: 'Projection dans un repère cartésien avec vitesse initiale et angle de tir.',
                                                cognitiveDomain: 'application_pratique',
                                                keyConcepts: ['Vecteur accélération', 'Équation horaire', 'Portée', 'Flèche']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'gn-tle-se',
                        code: 'gn_tle_se',
                        name: 'Terminale Sciences Expérimentales (SE)',
                        academicLevel: 'Lycee',
                        ageOrTargetAudience: '17-19 ans',
                        streams: ['Sciences Expérimentales'],
                        officialExams: ['Baccalauréat Unique Guinéen - Option SE'],
                        subjects: [
                            {
                                id: 'gn-se-biologie',
                                code: 'gn_bio_se',
                                name: 'Biologie & Géologie (SVT - Coeff 4)',
                                coefficient: 4,
                                hoursPerWeek: 5,
                                description: 'Génétique mendélienne, transmission des caractères, immunologie, tectonique des plaques.',
                                officialObjectives: ['Résoudre des croisements génétiques', 'Comprendre la réponse immunitaire humorale et cellulaire'],
                                chapters: [
                                    {
                                        id: 'gn-se-ch-genetique',
                                        title: 'Génétique Formelle & Hérédité Humaine',
                                        description: 'Monohybridisme, dihybridisme, gènes liés et brassage chromosomique.',
                                        orderIndex: 1,
                                        estimatedHours: 25,
                                        competencies: [
                                            {
                                                id: 'gn-comp-bio-01',
                                                code: 'BIO-SE-01',
                                                title: 'Interpréter un arbre généalogique et calculer les probabilités génétiques',
                                                description: 'Détermination du mode de transmission (dominant, récessif, autosomique ou lié à l’X).',
                                                cognitiveDomain: 'raisonnement',
                                                keyConcepts: ['Allèle', 'Locus', 'Crossing-over', 'Brassage interchromosomique']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'gn-tle-ss',
                        code: 'gn_tle_ss',
                        name: 'Terminale Sciences Sociales (SS)',
                        academicLevel: 'Lycee',
                        ageOrTargetAudience: '17-19 ans',
                        streams: ['Sciences Sociales / Littéraire'],
                        officialExams: ['Baccalauréat Unique Guinéen - Option SS'],
                        subjects: [
                            {
                                id: 'gn-ss-philo',
                                code: 'gn_philo_ss',
                                name: 'Philosophie & Pensée Critique (Coeff 4)',
                                coefficient: 4,
                                hoursPerWeek: 4,
                                description: 'La Conscience, l’Inconscient, l’État, la Liberté, la Justice, la Technique et l’Histoire.',
                                officialObjectives: ['Rédiger une dissertation philosophique structurée', 'Effectuer un commentaire de texte argumenté'],
                                chapters: [
                                    {
                                        id: 'gn-ss-ch-etat-liberte',
                                        title: 'L’État, le Droit et la Liberté Individuelle',
                                        description: 'Pensée politique de Hobbes, Rousseau, Montesquieu et penseurs africains contemporains.',
                                        orderIndex: 1,
                                        estimatedHours: 20,
                                        competencies: [
                                            {
                                                id: 'gn-comp-philo-01',
                                                code: 'PHILO-SS-01',
                                                title: 'Construire une problématique philosophique et un plan antithétique',
                                                description: 'Formulation d’une tension conceptuelle et problématisation d’un sujet de dissertation.',
                                                cognitiveDomain: 'argumentation',
                                                keyConcepts: ['Contrat social', 'Légitimité', 'Souveraineté', 'Liberté civile']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // 🇸🇳 SÉNÉGAL (MEN & MESRI)
    {
        id: 'curr-sn',
        countryCode: 'SN',
        countryName: 'Sénégal',
        countryFlag: '🇸🇳',
        systemName: 'Système Éducatif Sénégalais (Office du Bac)',
        officialAuthority: "Ministère de l'Éducation Nationale du Sénégal",
        lastCurriculumReviewYear: 2026,
        verificationSourceUrl: 'https://officedubac.sn',
        cycles: [
            {
                id: 'sn-cycle-lycee',
                cycleName: 'Secondaire Général & Séries du Baccalauréat',
                levels: [
                    {
                        id: 'sn-tle-s',
                        code: 'sn_tle_s',
                        name: 'Terminale S1 / S2 (Séries Scientifiques)',
                        academicLevel: 'Lycee',
                        streams: ['S1 - Mathématiques & Physiques', 'S2 - Sciences Expérimentales'],
                        officialExams: ['Baccalauréat Sénégalais (Série S)'],
                        subjects: [
                            {
                                id: 'sn-maths-s',
                                code: 'sn_maths_s',
                                name: 'Mathématiques Série S',
                                coefficient: 6,
                                hoursPerWeek: 7,
                                description: 'Nombres complexes, géométrie plane, calcul différentiel et intégral, probabilités conditionnelles.',
                                officialObjectives: ['Résoudre les problèmes de synthèse de géométrie complexe', 'Étudier les lois de probabilités'],
                                chapters: [
                                    {
                                        id: 'sn-ch-complexes',
                                        title: 'Nombres Complexes & Transformations Géométriques',
                                        description: 'Forme algébrique, trigonométrique, exponentielle et similitudes directes.',
                                        orderIndex: 1,
                                        estimatedHours: 25,
                                        competencies: [
                                            {
                                                id: 'sn-comp-cx-01',
                                                code: 'SN-MATH-01',
                                                title: 'Caractériser une similitude directe du plan complexe (centre, rapport, angle)',
                                                description: 'Écriture complexe z\' = az + b et interprétation géométrique.',
                                                cognitiveDomain: 'resolution_probleme',
                                                keyConcepts: ['Similitude', 'Angle', 'Rapport', 'Point fixe']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'sn-tle-l',
                        code: 'sn_tle_l',
                        name: 'Terminale L1 / L2 (Séries Littéraires)',
                        academicLevel: 'Lycee',
                        streams: ['L1 - Langues Anciennes & Modernes', 'L2 - Sciences Humaines'],
                        officialExams: ['Baccalauréat Sénégalais (Série L)'],
                        subjects: [
                            {
                                id: 'sn-francais-l',
                                code: 'sn_fr_l',
                                name: 'Littérature & Français (Coeff 5)',
                                coefficient: 5,
                                hoursPerWeek: 6,
                                description: 'Littérature négro-africaine, romantisme, réalisme, analyse stylistique et commentaire composé.',
                                officialObjectives: ['Analyser les œuvres majeures de Senghor, Birago Diop, Aimé Césaire et Victor Hugo'],
                                chapters: [
                                    {
                                        id: 'sn-ch-negritude',
                                        title: 'La Négritude & la Littérature Engagée Africaine',
                                        description: 'Contexte historique, esthétique poétique et impact politique mondial.',
                                        orderIndex: 1,
                                        estimatedHours: 20,
                                        competencies: [
                                            {
                                                id: 'sn-comp-lit-01',
                                                code: 'SN-LIT-01',
                                                title: 'Analyser la portée esthétique et mémorielle de l’engagement poétique',
                                                description: 'Commentaire composé avec étude de figures de style et rythmes.',
                                                cognitiveDomain: 'argumentation',
                                                keyConcepts: ['Négritude', 'Rythme', 'Métaphore', 'Emancipation culturelle']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // 🇫🇷 FRANCE (Éducation Nationale)
    {
        id: 'curr-fr',
        countryCode: 'FR',
        countryName: 'France',
        countryFlag: '🇫🇷',
        systemName: 'Système Éducatif Français (Réforme du Baccalauréat)',
        officialAuthority: "Ministère de l'Éducation Nationale et de la Jeunesse (Eduscol)",
        lastCurriculumReviewYear: 2026,
        verificationSourceUrl: 'https://eduscol.education.fr',
        cycles: [
            {
                id: 'fr-cycle-lycee',
                cycleName: 'Lycée Général & Technologique',
                levels: [
                    {
                        id: 'fr-tle-gen',
                        code: 'fr_tle_gen',
                        name: 'Terminale Générale (Spécialités)',
                        academicLevel: 'Lycee',
                        streams: ['Spécialités Maths / Physique', 'Spécialités SES / HGGSP', 'Spécialités NSI / SVT'],
                        officialExams: ['Baccalauréat Général Français & Grand Oral'],
                        subjects: [
                            {
                                id: 'fr-spe-maths',
                                code: 'fr_maths_spe',
                                name: 'Spécialité Mathématiques (Coeff 16)',
                                coefficient: 16,
                                hoursPerWeek: 6,
                                description: 'Combinatoire et dénombrement, vecteurs et orthogonalité dans l’espace, suites et récurrence, fonctions trigonométriques et lois de probabilités continues (loi binomiale, loi normale).',
                                officialObjectives: ['Démontrer par récurrence', 'Calculer des probabilités et espérances', 'Préparer le Grand Oral'],
                                chapters: [
                                    {
                                        id: 'fr-ch-recurrence',
                                        title: 'Suites Numériques, Limites et Démonstration par Récurrence',
                                        description: 'Initialisation, hérédité, conclusion et théorème de convergence monotone.',
                                        orderIndex: 1,
                                        estimatedHours: 20,
                                        competencies: [
                                            {
                                                id: 'fr-comp-rec-01',
                                                code: 'FR-MATH-01',
                                                title: 'Rédiger une démonstration rigoureuse par récurrence',
                                                description: 'Vérification de la propriété au rang initial puis transmission au rang k+1.',
                                                cognitiveDomain: 'raisonnement',
                                                keyConcepts: ['Initialisation', 'Hérédité', 'Majoration', 'Théorème de convergence']
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                id: 'fr-spe-ses',
                                code: 'fr_ses_spe',
                                name: 'Sciences Économiques et Sociales (SES - Coeff 16)',
                                coefficient: 16,
                                hoursPerWeek: 6,
                                description: 'Sources de la croissance, commerce international, structure sociale, action publique environnementale et crises financières.',
                                officialObjectives: ['Maîtriser la dissertation économique et l’épreuve composée (EC1, EC2, EC3)'],
                                chapters: [
                                    {
                                        id: 'fr-ch-croissance',
                                        title: 'Quelles sont les sources et les défis de la croissance économique ?',
                                        description: 'Facteurs de production, productivité globale des facteurs (PGF), progrès technique endogène et soutenabilité écologique.',
                                        orderIndex: 1,
                                        estimatedHours: 22,
                                        competencies: [
                                            {
                                                id: 'fr-comp-ses-01',
                                                code: 'FR-SES-01',
                                                title: 'Expliquer comment les institutions et l’innovation stimulent la croissance',
                                                description: 'Théorie de Schumpeter, destruction créatrice et droits de propriété.',
                                                cognitiveDomain: 'comprehension',
                                                keyConcepts: ['PGF', 'Progrès technique endogène', 'Destruction créatrice', 'Capital humain']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // 🇺🇸 ÉTATS-UNIS & INTERNATIONAL (US High School & AP / SAT)
    {
        id: 'curr-us',
        countryCode: 'US',
        countryName: 'États-Unis / International (K-12 & AP)',
        countryFlag: '🇺🇸',
        systemName: 'US Curriculum, Advanced Placement (AP) & SAT/ACT',
        officialAuthority: 'College Board / US Department of Education Standards',
        lastCurriculumReviewYear: 2026,
        verificationSourceUrl: 'https://apcentral.collegeboard.org',
        cycles: [
            {
                id: 'us-cycle-highschool',
                cycleName: 'High School (Grades 9-12) & College Prep',
                levels: [
                    {
                        id: 'us-grade-12-ap',
                        code: 'us_ap_grade12',
                        name: 'Grade 12 / AP Scholar Track (Calculus & Computer Science)',
                        academicLevel: 'Lycee',
                        streams: ['AP STEM Track', 'AP Business & Social Track'],
                        officialExams: ['AP Calculus BC Exam', 'SAT Reasoning Test', 'AP Computer Science A'],
                        subjects: [
                            {
                                id: 'us-ap-calculus',
                                code: 'us_ap_calc_bc',
                                name: 'AP Calculus BC (College Board Credit)',
                                hoursPerWeek: 6,
                                description: 'Differential and integral calculus, series, Taylor polynomials, parametric and polar curves.',
                                officialObjectives: ['Master derivative and integral applications for US University Credits'],
                                chapters: [
                                    {
                                        id: 'us-ch-taylor',
                                        title: 'Taylor and Maclaurin Series & Infinite Convergence',
                                        description: 'Power series, radius of convergence, and Taylor polynomial approximations.',
                                        orderIndex: 1,
                                        estimatedHours: 24,
                                        competencies: [
                                            {
                                                id: 'us-comp-calc-01',
                                                code: 'US-CALC-01',
                                                title: 'Construct and analyze Taylor series approximations for analytic functions',
                                                description: 'Apply ratio test and calculate error bound using Lagrange remainder.',
                                                cognitiveDomain: 'resolution_probleme',
                                                keyConcepts: ['Taylor Series', 'Convergence Tests', 'Power Series', 'Error Bound']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // 🇬🇧 ROYAUME-UNI (A-Levels & Cambridge International)
    {
        id: 'curr-uk',
        countryCode: 'GB',
        countryName: 'Royaume-Uni / Cambridge International',
        countryFlag: '🇬🇧',
        systemName: 'UK National Curriculum (GCSE & GCE A-Levels)',
        officialAuthority: 'Ofqual / Cambridge Assessment International Education (CAIE)',
        lastCurriculumReviewYear: 2026,
        verificationSourceUrl: 'https://cambridgeinternational.org',
        cycles: [
            {
                id: 'uk-cycle-alevels',
                cycleName: 'Sixth Form / GCE Advanced Level (Year 12-13)',
                levels: [
                    {
                        id: 'uk-alevel-y13',
                        code: 'uk_alevel_y13',
                        name: 'A-Level Year 13 (Core STEM & Humanities)',
                        academicLevel: 'Lycee',
                        streams: ['A-Level Mathematics', 'A-Level Physics', 'A-Level Economics'],
                        officialExams: ['Cambridge International A-Levels'],
                        subjects: [
                            {
                                id: 'uk-sub-maths-pure',
                                code: 'uk_pure_maths',
                                name: 'Pure Mathematics (P1, P2, P3)',
                                hoursPerWeek: 6,
                                description: 'Trigonometric identities, differential equations, vectors, numerical methods.',
                                officialObjectives: ['Achieve Grade A* in Cambridge International Mathematics Paper 3'],
                                chapters: [
                                    {
                                        id: 'uk-ch-diff-eq',
                                        title: 'First and Second Order Differential Equations',
                                        description: 'Separation of variables and integrating factors.',
                                        orderIndex: 1,
                                        estimatedHours: 20,
                                        competencies: [
                                            {
                                                id: 'uk-comp-diff-01',
                                                code: 'UK-MATH-01',
                                                title: 'Solve first order linear differential equations using integrating factors',
                                                description: 'Formulation of general and particular solutions with boundary conditions.',
                                                cognitiveDomain: 'resolution_probleme',
                                                keyConcepts: ['Integrating Factor', 'General Solution', 'Boundary Value']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    },

    // 🇨🇮 CÔTE D'IVOIRE (MENA)
    {
        id: 'curr-ci',
        countryCode: 'CI',
        countryName: 'Côte d’Ivoire',
        countryFlag: '🇨🇮',
        systemName: 'Système Éducatif Ivoirien (DECO / MENA)',
        officialAuthority: "Ministère de l'Éducation Nationale et de l'Alphabétisation de Côte d'Ivoire",
        lastCurriculumReviewYear: 2026,
        verificationSourceUrl: 'https://men-deco.org',
        cycles: [
            {
                id: 'ci-cycle-lycee',
                cycleName: 'Enseignement Secondaire Général (Séries C, D, A)',
                levels: [
                    {
                        id: 'ci-tle-c',
                        code: 'ci_tle_c',
                        name: 'Terminale C (Mathématiques & Sciences Physiques)',
                        academicLevel: 'Lycee',
                        streams: ['Série C'],
                        officialExams: ['Baccalauréat Ivoirien Série C'],
                        subjects: [
                            {
                                id: 'ci-maths-c',
                                code: 'ci_maths_c',
                                name: 'Mathématiques Série C (Coeff 5)',
                                coefficient: 5,
                                hoursPerWeek: 6,
                                description: 'Barycentres, isométries du plan, calcul intégral, probabilités.',
                                officialObjectives: ['Résoudre les problèmes de concours et du Bac C ivoirien'],
                                chapters: [
                                    {
                                        id: 'ci-ch-barycentres',
                                        title: 'Barycentres & Lignes de Niveau dans le Plan',
                                        description: 'Fonctions vectorielles de Leibniz, ensembles de points vérifiant des relations scalaires.',
                                        orderIndex: 1,
                                        estimatedHours: 18,
                                        competencies: [
                                            {
                                                id: 'ci-comp-bary-01',
                                                code: 'CI-MATH-01',
                                                title: 'Déterminer la nature et les éléments caractéristiques d’une ligne de niveau',
                                                description: 'Réduction de sommes scalaires pondérées à l’aide du barycentre.',
                                                cognitiveDomain: 'resolution_probleme',
                                                keyConcepts: ['Barycentre', 'Ligne de niveau', 'Cercle', 'Médiatrice']
                                            }
                                        ]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌉 MATRICE DES PASSERELLES & ÉQUIVALENCES ENTRE SYSTÈMES ACADÉMIQUES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const ACADEMIC_EQUIVALENCES: AcademicEquivalenceComparison[] = [
    {
        originCountry: 'Guinée',
        originSystem: 'Système Guinéen (MEPU-A)',
        originLevel: 'Terminale Sciences Mathématiques (SM)',
        targetCountry: 'France',
        targetSystem: 'Système Français (Eduscol)',
        targetLevel: 'Terminale Générale (Spécialités Maths & Physique)',
        directEquivalenceTitle: 'Équivalence Académique Niveau 4 (Baccalauréat Scientifique)',
        confidenceLevel: 'forte_reconnaissance_academique',
        commonFoundations: [
            'Étude complète des fonctions (ln, exponentielle, trigonométrie)',
            'Calcul différentiel et intégral approfondi',
            'Lois de Newton et mécanique classique en Physique',
            'Géométrie dans l’espace et produit scalaire'
        ],
        divergentTopicsOrAdditions: [
            'Arithmétique avancée (Bézout/Gauss) plus poussée dans le programme guinéen',
            'Combinatoire et dénombrement moderne plus standardisé dans le programme français',
            'Épreuve du Grand Oral spécifique à la France (préparation à l’éloquence)'
        ],
        recommendedBridgePath: [
            'Module Passerelle : Maîtrise de la combinatoire et des probabilités discrètes',
            'Atelier Éloquence avec Conseiller & Professeur Diallo pour le Grand Oral',
            'Validation des acquis via un Examen Blanc Franco-Guinéen'
        ],
        officialSourceNote: 'Conforme aux conventions de coopération universitaire France-Guinée (Campus France & MESRSI).'
    },
    {
        originCountry: 'Sénégal',
        originSystem: 'Office du Bac Sénégalais',
        originLevel: 'Terminale S1 / S2',
        targetCountry: 'Canada / Québec',
        targetSystem: 'Système Collégial Québécois (CÉGEP)',
        targetLevel: 'Diplôme d’Études Collégiales (DEC Sciences de la Nature)',
        directEquivalenceTitle: 'Admissibilité directe au CÉGEP ou 1ère année universitaire B.Sc.',
        confidenceLevel: 'forte_reconnaissance_academique',
        commonFoundations: [
            'Calcul différentiel (Calculus I)',
            'Chimie générale et organique de base',
            'Biologie cellulaire et génétique'
        ],
        divergentTopicsOrAdditions: [
            'Rapports de laboratoire informatisés selon les normes québécoises',
            'Cours de formation générale obligatoire (Philosophie collégiale et Éthique)'
        ],
        recommendedBridgePath: [
            'Familiarisation avec le format des examens de mi-session universitaires nord-américains',
            'Renforcement en anglais académique (TOEFL / IELTS B2+)'
        ],
        officialSourceNote: 'Protocole d’évaluation du Ministère de l’Immigration, de la Francisation et de l’Intégration (MIFI Québec).'
    },
    {
        originCountry: 'France',
        originSystem: 'Baccalauréat Français',
        originLevel: 'Terminale Générale',
        targetCountry: 'États-Unis',
        targetSystem: 'US High School / Undergraduate',
        targetLevel: 'High School Diploma with AP College Credits',
        directEquivalenceTitle: 'Direct Freshman Year Admission with AP Course Waivers',
        confidenceLevel: 'forte_reconnaissance_academique',
        commonFoundations: [
            'Mathématiques avancées équivalentes à AP Calculus AB/BC',
            'Sciences physiques équivalentes à AP Physics 1 & 2',
            'Économie approfondie équivalente à AP Micro/Macro Economics'
        ],
        divergentTopicsOrAdditions: [
            'Format de test standardisé QCM rapide (SAT/ACT)',
            'Importance du dossier extra-scolaire et de la lettre de motivation (Personal Statement)'
        ],
        recommendedBridgePath: [
            'Entraînement au SAT Reasoning Test avec minuterie',
            'Atelier de rédaction du Personal Statement avec Professeur Diallo'
        ],
        officialSourceNote: 'Guide d’évaluation comparative des diplômes du National Association of Credential Evaluation Services (NACES).'
    }
];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 EXEMPLES D'ÉPREUVES D'EXAMENS BLANCS OFFICIELS PAR PAYS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export const MOCK_EXAM_BLUEPRINTS: MockExamBlueprint[] = [
    {
        id: 'exam-bac-gn-sm-maths',
        examName: 'Baccalauréat Unique Guinéen Blanc — Mathématiques Option SM',
        countryCode: 'GN',
        subjectName: 'Mathématiques Approfondies',
        levelName: 'Terminale Sciences Mathématiques',
        durationMinutes: 180, // 3 heures
        totalPoints: 20,
        passingScore: 10,
        instructions: [
            'Calculatrice non autorisée ou selon consignes du Ministère.',
            'La clarté de la rédaction et la rigueur des démonstrations constituent 20% de la note finale.',
            'Toutes les réponses doivent être rigoureusement justifiées.'
        ],
        sections: [
            {
                id: 'sec-1-analyse',
                title: 'Exercice 1 : Analyse, Limites et Fonctions Transcendantes (8 points)',
                points: 8,
                questions: [
                    {
                        id: 'gn-q1',
                        question: 'Soit la fonction f(x) = (ln x) / x pour x > 0. Quelle est la limite de f(x) quand x tend vers +infini ?',
                        options: [
                            '0 (par croissance comparée standard)',
                            '+infini',
                            '1',
                            '-infini'
                        ],
                        correctIndex: 0,
                        explanation: 'D’après les théorèmes fondamentaux de croissances comparées au programme de Terminale SM guinéenne, lim (ln x)/x = 0 quand x -> +infini.',
                        difficulty: 'medium'
                    },
                    {
                        id: 'gn-q2',
                        question: 'Quelle est la valeur de x où la fonction f(x) = (ln x) / x atteint son maximum absolu sur ]0, +infini[ ?',
                        options: [
                            'x = e, avec un maximum f(e) = 1/e',
                            'x = 1, avec un maximum f(1) = 0',
                            'x = e², avec un maximum f(e²) = 2/e²',
                            'La fonction n’admet pas de maximum fini'
                        ],
                        correctIndex: 0,
                        explanation: 'f\'(x) = (1 - ln x) / x². La dérivée s’annule et change de signe en ln x = 1 soit x = e. Le maximum vaut f(e) = 1/e.',
                        difficulty: 'medium'
                    }
                ]
            },
            {
                id: 'sec-2-arithmetique',
                title: 'Exercice 2 : Arithmétique & Théorème de Gauss/Bézout (6 points)',
                points: 6,
                questions: [
                    {
                        id: 'gn-q3',
                        question: 'Deux entiers a et b sont premiers entre eux. D’après le théorème de Bézout, quelle égalité est vérifiée ?',
                        options: [
                            'Il existe deux entiers relatifs u et v tels que au + bv = 1',
                            'Il existe k tel que a = k * b',
                            'a et b sont obligatoirement deux nombres premiers',
                            'Le PGCD(a, b) = a * b'
                        ],
                        correctIndex: 0,
                        explanation: 'Le théorème de Bézout énonce que deux entiers a et b sont premiers entre eux si et seulement s’il existe (u,v) dans Z² tels que au + bv = 1.',
                        difficulty: 'easy'
                    }
                ]
            },
            {
                id: 'sec-3-proba',
                title: 'Exercice 3 : Probabilités et Variables Aléatoires (6 points)',
                points: 6,
                questions: [
                    {
                        id: 'gn-q4',
                        question: 'Dans une urne contenant 5 boules rouges et 3 boules vertes, on tire successivement 2 boules sans remise. Quelle est la probabilité d’obtenir 2 boules rouges ?',
                        options: [
                            '5/14 (soit (5/8) * (4/7))',
                            '25/64',
                            '1/2',
                            '15/56'
                        ],
                        correctIndex: 0,
                        explanation: 'P(R1 ∩ R2) = P(R1) * P(R2|R1) = (5/8) * (4/7) = 20/56 = 5/14.',
                        difficulty: 'medium'
                    }
                ]
            }
        ]
    },
    {
        id: 'exam-bac-fr-maths',
        examName: 'Baccalauréat Général Français Blanc — Spécialité Mathématiques',
        countryCode: 'FR',
        subjectName: 'Mathématiques Spécialité',
        levelName: 'Terminale Générale',
        durationMinutes: 240, // 4 heures
        totalPoints: 20,
        passingScore: 10,
        instructions: [
            'L’usage de la calculatrice avec mode examen actif est autorisé.',
            'Le candidat doit traiter les 4 exercices obligatoires.'
        ],
        sections: [
            {
                id: 'fr-sec-1-suites',
                title: 'Exercice 1 : Suites numériques et récurrence (5 points)',
                points: 5,
                questions: [
                    {
                        id: 'fr-q1',
                        question: 'Soit la suite définie par u(0)=1 et u(n+1) = 0.5 * u(n) + 3. Quelle est la limite L de la suite (u_n) ?',
                        options: [
                            'L = 6',
                            'L = 3',
                            'L = +infini',
                            'L = 0'
                        ],
                        correctIndex: 0,
                        explanation: 'La suite converge vers le point fixe vérifiant L = 0.5*L + 3 <=> 0.5*L = 3 <=> L = 6.',
                        difficulty: 'medium'
                    },
                    {
                        id: 'fr-q2',
                        question: 'Quelle est la dérivée de la fonction f(x) = x * exp(-x) ?',
                        options: [
                            'f\'(x) = (1 - x) * exp(-x)',
                            'f\'(x) = exp(-x)',
                            'f\'(x) = -x * exp(-x)',
                            'f\'(x) = (1 + x) * exp(-x)'
                        ],
                        correctIndex: 0,
                        explanation: 'En appliquant la formule (u*v)\' = u\'v + uv\', on obtient 1*exp(-x) + x*(-exp(-x)) = (1 - x)*exp(-x).',
                        difficulty: 'medium'
                    }
                ]
            }
        ]
    },
    {
        id: 'exam-bac-sn-maths',
        examName: 'Baccalauréat Sénégalais Blanc — Mathématiques Séries S1/S2',
        countryCode: 'SN',
        subjectName: 'Mathématiques Générales',
        levelName: 'Terminale S1 / S2',
        durationMinutes: 240,
        totalPoints: 20,
        passingScore: 10,
        instructions: [
            'Épreuve conforme aux standards de l’Office du Baccalauréat du Sénégal.',
            'Rigueur mathématique et clarté de la rédaction exigées.'
        ],
        sections: [
            {
                id: 'sn-sec-1-complexes',
                title: 'Exercice 1 : Nombres Complexes & Transformations du Plan (5 points)',
                points: 5,
                questions: [
                    {
                        id: 'sn-q1',
                        question: 'Soit le nombre complexe z = 1 + i*sqrt(3). Quelle est sa forme exponentielle ?',
                        options: [
                            '2 * exp(i * pi/3)',
                            '2 * exp(i * pi/6)',
                            'sqrt(2) * exp(i * pi/3)',
                            '4 * exp(i * pi/4)'
                        ],
                        correctIndex: 0,
                        explanation: '|z| = sqrt(1 + 3) = 2. cos(theta) = 1/2 et sin(theta) = sqrt(3)/2, donc theta = pi/3.',
                        difficulty: 'medium'
                    }
                ]
            },
            {
                id: 'sn-sec-2-integrales',
                title: 'Exercice 2 : Intégration par parties & Équations Différentielles (7 points)',
                points: 7,
                questions: [
                    {
                        id: 'sn-q2',
                        question: 'Quelle est la solution générale de l’équation différentielle y\' - 2y = 0 ?',
                        options: [
                            'y(x) = C * exp(2x) avec C constante réelle',
                            'y(x) = C * exp(-2x)',
                            'y(x) = 2x + C',
                            'y(x) = exp(x²/2) + C'
                        ],
                        correctIndex: 0,
                        explanation: 'Les solutions de y\' - ay = 0 sont de la forme y(x) = C * exp(ax), ici a = 2.',
                        difficulty: 'easy'
                    }
                ]
            }
        ]
    },
    {
        id: 'exam-alpha-calc-utile',
        examName: 'Évaluation Fondamentale — Lecture, Écriture & Calcul Commercial Utile',
        countryCode: 'GN',
        subjectName: 'Fondamentaux Pratiques',
        levelName: 'Alphabétisation Adultes',
        durationMinutes: 45,
        totalPoints: 20,
        passingScore: 10,
        instructions: [
            'Test pratique adapté à la vie quotidienne et aux transactions de marché.',
            'Questions orales et écrites simples.'
        ],
        sections: [
            {
                id: 'alpha-sec-1-monnaie',
                title: 'Module 1 : Calcul Monétaire et Rendu de Monnaie (10 points)',
                points: 10,
                questions: [
                    {
                        id: 'alpha-q1',
                        question: 'Un client achète 3 sacs de riz à 25 000 GNF l’unité et vous donne un billet de 100 000 GNF. Combien devez-vous lui rendre ?',
                        options: [
                            '25 000 GNF (Total = 75 000 GNF, 100 000 - 75 000 = 25 000)',
                            '15 000 GNF',
                            '35 000 GNF',
                            '20 000 GNF'
                        ],
                        correctIndex: 0,
                        explanation: '3 x 25 000 = 75 000 GNF. 100 000 - 75 000 = 25 000 GNF de monnaie à rendre.',
                        difficulty: 'easy'
                    },
                    {
                        id: 'alpha-q2',
                        question: 'Sur un panneau de pharmacie, vous lisez "OUVERT DE 08H00 À 20H00". Combien d’heures la pharmacie reste-t-elle ouverte dans la journée ?',
                        options: [
                            '12 heures (20 - 8 = 12)',
                            '10 heures',
                            '14 heures',
                            '8 heures'
                        ],
                        correctIndex: 0,
                        explanation: 'De 8h du matin à 20h du soir, il y a exactement 20 - 8 = 12 heures.',
                        difficulty: 'easy'
                    }
                ]
            }
        ]
    }
];
