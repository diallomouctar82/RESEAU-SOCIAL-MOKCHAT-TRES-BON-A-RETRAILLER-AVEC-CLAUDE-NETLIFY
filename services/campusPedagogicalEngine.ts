// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS PEDAGOGICAL ENGINE — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Moteur d'IA Pédagogique pour Professeur Diallo :
// - Diagnostic initial des lacunes et forces
// - Construction du programme dynamique personnalisé
// - Adaptation au style d'apprentissage & reformulation "Explique-moi autrement"
// - Suivi de la maîtrise des compétences et répétition espacée
// - Génération d'évaluations adaptatives et examens blancs par pays

import { AIProxyClient } from './aiProxy';
import { 
    StudentPedagogicalProfile, 
    LearningStylePreference, 
    PedagogyPace, 
    StudentMasteryItem, 
    MockExamBlueprint,
    MockExamReport,
    EducationalCurriculumFramework
} from '../types';
import { OFFICIAL_CURRICULUMS, MOCK_EXAM_BLUEPRINTS, ACADEMIC_EQUIVALENCES } from './curriculumRegistry';

export class CampusPedagogicalEngine {
    private static instance: CampusPedagogicalEngine;

    private constructor() {}

    public static getInstance(): CampusPedagogicalEngine {
        if (!CampusPedagogicalEngine.instance) {
            CampusPedagogicalEngine.instance = new CampusPedagogicalEngine();
        }
        return CampusPedagogicalEngine.instance;
    }

    private getGenAI(): AIProxyClient {
        return new AIProxyClient();
    }

    /**
     * Initialise ou charge le profil pédagogique par défaut d'un apprenant
     */
    public getDefaultStudentProfile(userId: string): StudentPedagogicalProfile {
        const defaultFramework = OFFICIAL_CURRICULUMS[0]; // Guinée par défaut
        const defaultCycle = defaultFramework.cycles.find(c => c.id === 'gn-cycle-secondaire') || defaultFramework.cycles[0];
        const defaultLevel = defaultCycle.levels[0];

        return {
            id: `prof-${userId}`,
            userId: userId,
            selectedCountryCode: defaultFramework.countryCode,
            selectedCountryName: defaultFramework.countryName,
            selectedCountryFlag: defaultFramework.countryFlag,
            selectedSystemId: defaultFramework.id,
            selectedLevelCode: defaultLevel.code,
            selectedLevelName: defaultLevel.name,
            targetExamOrGoal: defaultLevel.officialExams?.[0] || 'Maîtrise complète du programme officiel',
            learningStyle: 'exemples_concrets',
            pace: 'standard',
            preferredLanguage: 'Français',
            isLiteracyPathway: false,
            hybridAddons: ['Compétences Numériques & IA', 'Anglais Pratique des Affaires'],
            diagnosticCompleted: true,
            diagnosticScoreOverall: 14.5,
            strengths: ['Raisonnement logique', 'Volonté d’apprentissage', 'Capacité de synthèse'],
            priorityGaps: ['Arithmétique modulaire approfondie', 'Gestion du temps lors des épreuves de 3h'],
            activeWorkingPlan: {
                todayObjectives: [
                    'Comprendre la notion d’asymptote oblique et branches infinies',
                    'Résoudre 3 exercices types du Baccalauréat Guinéen',
                    'Consolider la formule du théorème de convergence monotone'
                ],
                recommendedLessonTitle: 'Limites, Continuité et Dérivation des Fonctions',
                recommendedSubject: 'Mathématiques Approfondies',
                recommendedDurationMin: 45,
                weeklyTargetCompetencies: ['MATH-SM-01', 'MATH-SM-02', 'PHYS-SM-01'],
                monthlyMilestoneExam: 'Baccalauréat Blanc Trimestriel N°1',
                nextMockExamDate: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().split('T')[0]
            },
            masteryRegistry: [
                {
                    competencyId: 'MATH-SM-01',
                    competencyTitle: 'Calculer des limites de formes indéterminées et asymptotes',
                    subjectId: 'gn-sm-maths',
                    subjectName: 'Mathématiques Approfondies',
                    stage: 'pratique',
                    confidenceScore: 78,
                    lastPracticedAt: new Date().toISOString(),
                    lastEvaluationScore: 16,
                    nextRevisionRecommendedAt: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
                    mistakePatterns: ['Oubli occasionnel des croissances comparées en +infini'],
                    isFragile: false
                },
                {
                    competencyId: 'MATH-SM-02',
                    competencyTitle: 'Appliquer le Théorème des Valeurs Intermédiaires (TVI)',
                    subjectId: 'gn-sm-maths',
                    subjectName: 'Mathématiques Approfondies',
                    stage: 'compris',
                    confidenceScore: 65,
                    lastPracticedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
                    lastEvaluationScore: 13,
                    nextRevisionRecommendedAt: new Date(Date.now() + 2 * 24 * 3600 * 1000).toISOString(),
                    mistakePatterns: ['Oubli de vérifier la stricte monotonie avant d’affirmer l’unicité'],
                    isFragile: true
                },
                {
                    competencyId: 'ALPHA-01',
                    competencyTitle: 'Lecture et reconnaissance syllabique rapide',
                    subjectId: 'gn-sub-alpha-fr',
                    subjectName: 'Lecture & Écriture du Quotidien',
                    stage: 'maitrise',
                    confidenceScore: 95,
                    lastPracticedAt: new Date().toISOString(),
                    lastEvaluationScore: 19,
                    mistakePatterns: [],
                    isFragile: false
                }
            ],
            pedagogicalInsightsForCoach: [
                'Retient 2x plus vite lorsque le Professeur Diallo fait une analogie avec le commerce, l’économie réelle ou la construction.',
                'Encourager la verbalisation des étapes de calcul à haute voix.'
            ],
            totalMasteredCompetencies: 8,
            totalTrackedCompetencies: 14
        };
    }

    /**
     * Génère une explication sur-mesure d'un concept selon le style d'apprentissage
     */
    public async explainConceptAdapted(
        conceptTitle: string,
        subjectName: string,
        countryName: string,
        levelName: string,
        learningStyle: LearningStylePreference,
        userContextNote?: string
    ): Promise<string> {
        try {
            const ai = this.getGenAI();
            const prompt = `
                Tu es Professeur Diallo, Recteur Pédagogique et Enseignant Émérite de la Famille DIALLO.
                Tu ne te présentes JAMAIS comme une IA ou un robot.
                Tu enseignes avec bienveillance, rigueur mathématique et profondeur culturelle.
                
                L'étudiant étudie selon le référentiel suivant :
                - Pays : ${countryName}
                - Niveau : ${levelName}
                - Matière : ${subjectName}
                - Notion / Chapitre : "${conceptTitle}"
                - Style d'apprentissage privilégié de l'étudiant : ${learningStyle}
                ${userContextNote ? `- Contexte particulier : ${userContextNote}` : ''}

                RÈGLES D'ENSEIGNEMENT ADAPTÉ :
                1. Respecte STRICTEMENT le programme officiel du pays (${countryName}).
                2. Si le style est 'exemples_concrets' : utilise des analogies réelles, locales et parlantes (marché, géographie locale, métiers, ingénierie).
                3. Si le style est 'oral_audio' : structure une explication rythmée, fluide, idéale pour la lecture vocale.
                4. Si le style est 'demonstration' : écris la démonstration mathématique ou scientifique pas à pas avec chaque justification canonique.
                5. Termine toujours par une petite question de vérification rapide pour stimuler l'étudiant.
                
                Format : Markdown clair, aéré, élégant.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            return response.text || "Explication temporairement indisponible.";
        } catch (error) {
            console.error("Erreur CampusPedagogicalEngine.explainConceptAdapted:", error);
            return `### Explication par Professeur Diallo\n\nPour maîtriser **${conceptTitle}** en ${subjectName} (${countryName}) :\n\n1. **Définition Fondamentale** : Repartir de la propriété de base et identifier les hypothèses de départ.\n2. **Exemple Pratique** : Appliquer la formule sur un cas simple sans calculatrice.\n3. **Astuce d'Examen** : Vérifier systématiquement les conditions d'existence.\n\n*Quelle est la première étape qui vous pose difficulté ?*`;
        }
    }

    /**
     * Mode "Explique-moi autrement" : Déclenche une pédagogie alternative immédiate
     */
    public async explainOtherwise(
        conceptTitle: string,
        subjectName: string,
        currentExplanation: string,
        mode: 'analogie_simple' | 'decoupage_etapes' | 'exemple_terrain' | 'langage_facile_sans_jargon'
    ): Promise<string> {
        try {
            const ai = this.getGenAI();
            const prompt = `
                Tu es Professeur Diallo, Enseignant d'élite de la Famille DIALLO.
                L'étudiant n'a pas compris la première explication sur "${conceptTitle}" (${subjectName}).
                
                Explication précédente :
                "${currentExplanation.slice(0, 300)}..."
                
                Mode de reformulation demandé : ${mode}
                
                MISSION :
                - Ne répète SURTOUT PAS les mêmes phrases ni les mêmes formules sèches.
                - Si 'analogie_simple' : compare le concept à une situation du quotidien (un robinet qui coule, une voiture qui accélère, une balance au marché).
                - Si 'decoupage_etapes' : décompose le problème en 3 mini-étapes élémentaires inratables.
                - Si 'langage_facile_sans_jargon' : explique avec des mots simples comme à un proche sans jargon prétentieux.
                
                Ton ton est chaleureux, patient et ultra-encourageant.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            return response.text || "Je reformule pour vous...";
        } catch (error) {
            return `Pas d'inquiétude ! Reprenons ensemble depuis le début : imaginez que ${conceptTitle} fonctionne exactement comme un mécanisme simple du quotidien...`;
        }
    }

    /**
     * Génère un test de diagnostic initial pour évaluer le niveau réel
     */
    public async runInitialDiagnostic(
        countryCode: string,
        levelCode: string,
        subjectName: string
    ): Promise<{ questions: any[]; instructions: string }> {
        try {
            const ai = this.getGenAI();
            const prompt = `
                Génère un test de diagnostic initial officiel pour un étudiant en ${levelCode} (${countryCode}) en ${subjectName}.
                5 Questions ciblées pour identifier les forces et lacunes réelles (du niveau basique au niveau examen).
                
                Format JSON strict :
                {
                    "instructions": "Consignes de passation",
                    "questions": [
                        {
                            "id": "diag_q1",
                            "competency": "Code compétence évaluée",
                            "question": "Texte question",
                            "options": ["A", "B", "C", "D"],
                            "correctIndex": 0,
                            "explanation": "Pourquoi c'est la bonne réponse",
                            "domain": "comprehension | raisonnement | calcul"
                        }
                    ]
                }
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: { responseMimeType: 'application/json' }
            });

            const parsed = JSON.parse(response.text || '{}');
            return {
                instructions: parsed.instructions || "Répondez sans aide extérieure pour calibrer votre parcours optimal.",
                questions: parsed.questions || []
            };
        } catch (e) {
            return {
                instructions: "Test d'évaluation initiale de vos acquis.",
                questions: [
                    {
                        id: 'd1',
                        competency: 'BASES-01',
                        question: 'Quelle est la première étape pour résoudre une équation f(x) = 0 ?',
                        options: [
                            'Déterminer le domaine de définition',
                            'Dériver immédiatement la fonction',
                            'Tracer la courbe au hasard',
                            'Remplacer x par 0'
                        ],
                        correctIndex: 0,
                        explanation: 'Le domaine de définition est le prérequis obligatoire avant toute étude.'
                    }
                ]
            };
        }
    }

    /**
     * Analyse des performances et ajustement du moteur de maîtrise
     */
    public updateMasteryAfterExercise(
        currentRegistry: StudentMasteryItem[],
        competencyId: string,
        score: number, // note sur 20
        subjectId: string,
        subjectName: string,
        competencyTitle: string
    ): StudentMasteryItem[] {
        const existingIndex = currentRegistry.findIndex(item => item.competencyId === competencyId);
        let newStage: StudentMasteryItem['stage'] = 'decouverte';

        if (score >= 18) newStage = 'consolide';
        else if (score >= 14) newStage = 'maitrise';
        else if (score >= 10) newStage = 'pratique';
        else if (score >= 6) newStage = 'compris';
        else newStage = 'en_apprentissage';

        const isFragile = score < 12;
        const confidenceScore = Math.min(100, Math.max(10, Math.round(score * 5)));

        const updatedItem: StudentMasteryItem = {
            competencyId,
            competencyTitle,
            subjectId,
            subjectName,
            stage: newStage,
            confidenceScore,
            lastPracticedAt: new Date().toISOString(),
            lastEvaluationScore: score,
            nextRevisionRecommendedAt: new Date(Date.now() + (isFragile ? 2 : 7) * 24 * 3600 * 1000).toISOString(),
            mistakePatterns: isFragile ? ['Nécessite une révision guidée avant examen blanc'] : [],
            isFragile
        };

        if (existingIndex >= 0) {
            const copy = [...currentRegistry];
            copy[existingIndex] = updatedItem;
            return copy;
        } else {
            return [...currentRegistry, updatedItem];
        }
    }
}

export const campusPedagogicalEngine = CampusPedagogicalEngine.getInstance();
