// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 SALLE DE CLASSE & ENVIRONNEMENT D'APPRENTISSAGE — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect } from 'react';
import { 
    BookOpen, 
    Dumbbell, 
    Library, 
    HelpCircle, 
    CheckCircle2, 
    ArrowRight, 
    ArrowLeft, 
    Sparkles, 
    Award, 
    Check, 
    Clock, 
    FileText, 
    GraduationCap, 
    RotateCcw,
    Layers,
    School,
    Volume2,
    VolumeX,
    Pause,
    Play,
    Copy,
    ChevronDown,
    ChevronUp,
    Download,
    ExternalLink,
    MessageSquare
} from 'lucide-react';
import { Course, Lesson, QuizQuestion } from '../types';
import { CertifyingFormation } from '../services/formationsRegistry';
import { getRealCourseForSubject, RealSubjectCourse } from '../services/realCurriculumCourses';
import { CampusProfessorCoach } from './CampusProfessorCoach';
import { voiceEngine } from '../services/voiceEngine';
import { VoiceSettingsModal } from './VoiceSettingsModal';

interface CampusClassroomViewProps {
    course?: Course | CertifyingFormation;
    formation?: CertifyingFormation | Course;
    userProfile?: any;
    activeLesson?: Lesson | null;
    completedLessonIds?: string[];
    onSelectLesson?: (lesson: Lesson) => void;
    onCompleteLesson?: (lessonId: string) => void;
    onStartExam?: (formation?: any) => void;
    onBackToCatalog: () => void;
}

export const CampusClassroomView: React.FC<CampusClassroomViewProps> = ({
    course,
    formation,
    userProfile,
    activeLesson,
    completedLessonIds = [],
    onSelectLesson,
    onCompleteLesson,
    onStartExam,
    onBackToCatalog
}) => {
    const activeCourse = formation || course;

    // Détection si c'est un cours officiel du programme national
    const matchedRealCourse: RealSubjectCourse | null = activeCourse 
        ? getRealCourseForSubject(activeCourse.id, (activeCourse as any).chapterId || activeCourse.id)
        : null;

    // Récupération sécurisée et mise à plat de toutes les leçons
    const allLessons: Lesson[] = (activeCourse?.lessons && activeCourse.lessons.length > 0)
        ? activeCourse.lessons
        : ((activeCourse as any)?.modulesList 
            ? (activeCourse as any).modulesList.flatMap((m: any) => m.lessons || [])
            : (matchedRealCourse ? matchedRealCourse.lessons : []));

    const [internalActiveLesson, setInternalActiveLesson] = useState<Lesson | null>(
        activeLesson || (allLessons.length > 0 ? allLessons[0] : null)
    );
    const [internalCompletedIds, setInternalCompletedIds] = useState<string[]>(completedLessonIds);

    const currentLesson = activeLesson || internalActiveLesson || (allLessons.length > 0 ? allLessons[0] : null);
    const currentCompletedIds = (completedLessonIds && completedLessonIds.length > 0) ? completedLessonIds : internalCompletedIds;

    const [activeTab, setActiveTab] = useState<'theory' | 'practice' | 'quiz' | 'resources'>('theory');
    const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [isSolutionRevealed, setIsSolutionRevealed] = useState(false);
    const [isCoachOpen, setIsCoachOpen] = useState(false);

    // Audio Recitation du Professeur Diallo (ElevenLabs HD + Fallback Web Speech)
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [isVoiceSettingsOpen, setIsVoiceSettingsOpen] = useState(false);
    const [currentVoiceId, setCurrentVoiceId] = useState<string>(() => voiceEngine.getVoiceIdForAgent('professor'));

    useEffect(() => {
        const unsubscribe = voiceEngine.addListener({
            onSpeakingStateChange: (speaking) => {
                setIsPlayingAudio(speaking);
            }
        });
        return () => {
            unsubscribe();
            voiceEngine.stopSpeaking();
        };
    }, []);

    // Arrêt de l'audio lors du changement de leçon
    useEffect(() => {
        voiceEngine.stopSpeaking();
        setIsPlayingAudio(false);
        setIsSolutionRevealed(false);
        setQuizSubmitted(false);
        setQuizAnswers({});
    }, [currentLesson?.id]);

    const toggleAudioLecture = () => {
        if (!currentLesson) return;

        if (isPlayingAudio) {
            voiceEngine.stopSpeaking();
            setIsPlayingAudio(false);
        } else {
            const textToRead = `Leçon : ${currentLesson.title}. ` + (currentLesson.content || "Contenu du cours préparé par le Professeur Diallo.");
            setIsPlayingAudio(true);
            voiceEngine.speak(textToRead, {
                voiceId: currentVoiceId,
                onEnd: () => setIsPlayingAudio(false)
            });
        }
    };

    if (!activeCourse) {
        return (
            <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 m-6 space-y-4">
                <p className="text-slate-600 font-medium text-sm">Aucune formation sélectionnée.</p>
                <button 
                    onClick={onBackToCatalog} 
                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold shadow hover:bg-slate-800"
                >
                    Retour au Catalogue
                </button>
            </div>
        );
    }

    const totalLessons = allLessons.length || 1;
    const completedCount = currentCompletedIds.filter(id => allLessons.some(l => l.id === id)).length;
    const progressPercent = Math.round((completedCount / totalLessons) * 100);

    const handleSelectLesson = (lesson: Lesson) => {
        setInternalActiveLesson(lesson);
        setQuizSubmitted(false);
        setQuizAnswers({});
        if (onSelectLesson) {
            onSelectLesson(lesson);
        }
    };

    const handleCompleteCurrentLesson = (lessonId: string) => {
        if (!currentCompletedIds.includes(lessonId)) {
            setInternalCompletedIds(prev => [...prev, lessonId]);
        }
        if (onCompleteLesson) {
            onCompleteLesson(lessonId);
        }
    };

    const handleStartExamAction = () => {
        if (onStartExam) {
            onStartExam(activeCourse);
        }
    };

    // Détermination des questions de quiz pour la leçon active
    const currentQuiz: QuizQuestion[] = matchedRealCourse?.quizQuestions || (activeCourse as any)?.examQuestions?.slice(0, 3) || [
        {
            id: `qz-${currentLesson?.id || 'default'}-1`,
            question: `Quelle est la démarche essentielle enseignée dans la leçon "${currentLesson?.title || 'Fondamentaux'}" ?`,
            options: [
                "L'application rigoureuse des définitions, la vérification des hypothèses et le raisonnement étape par étape.",
                "L'omission des étapes intermédiaires de calcul et la conjecture non démontrée.",
                "L'acceptation passive d'un résultat sans vérification critique.",
                "La mémorisation sans mise en pratique concrète."
            ],
            correctIndex: 0,
            explanation: "La méthode du Professeur Diallo repose sur la vérification scrupuleuse des hypothèses théoriques avant toute application pratique."
        },
        {
            id: `qz-${currentLesson?.id || 'default'}-2`,
            question: "Face à une situation complexe ou un problème d'examen, quel est le premier réflexe méthodologique ?",
            options: [
                "Identifier les données connues, formaliser les équations ou principes directeurs et structurer une démarche pas à pas.",
                "Donner une estimation hâtive sans poser les calculs.",
                "Changer arbitrairement les paramètres du problème.",
                "Recourir à une réponse sans justification."
            ],
            correctIndex: 0,
            explanation: "La décomposition analytique en sous-objectifs clairs permet de résoudre n'importe quelle problématique de haut niveau."
        }
    ];

    const handleQuizSelect = (qId: string, optIdx: number) => {
        setQuizAnswers(prev => ({
            ...prev,
            [qId]: optIdx
        }));
    };

    const handleValidateQuiz = () => {
        setQuizSubmitted(true);
        if (currentLesson) {
            handleCompleteCurrentLesson(currentLesson.id);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fade-up">
            
            {/* Top Navigation Bar */}
            <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30 shadow-xs">
                <div className="flex items-center gap-3">
                    <button
                        onClick={onBackToCatalog}
                        aria-label="Retour au Catalogue"
                        className="p-2.5 hover:bg-slate-100 rounded-xl text-slate-500 transition-colors"
                        title="Retour au Catalogue"
                    >
                        <ArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                                {activeCourse.level}
                            </span>
                            <h1 className="text-sm sm:text-base font-black text-slate-900 line-clamp-1">
                                {activeCourse.title}
                            </h1>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <School size={12} /> {activeCourse.institution} • {completedCount}/{totalLessons} leçons validées ({progressPercent}%)
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Audio Recitation Button */}
                    <button
                        onClick={toggleAudioLecture}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${
                            isPlayingAudio
                            ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-slate-200'
                        }`}
                        title="Écouter le cours dicté en voix haute fidélité par le Professeur Diallo"
                    >
                        {isPlayingAudio ? <Pause size={14} /> : <Volume2 size={14} className="text-indigo-600" />}
                        <span>{isPlayingAudio ? "Pause Voix" : "Écouter Prof. Diallo"}</span>
                    </button>

                    {/* Paramètres Voix ElevenLabs HD */}
                    <button
                        onClick={() => setIsVoiceSettingsOpen(true)}
                        className="px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-900 border border-amber-500/30 hover:border-amber-400 flex items-center gap-1 shadow-xs"
                        title="Configurer la voix ElevenLabs du Professeur Diallo"
                    >
                        <Sparkles size={13} className="text-amber-600" />
                        <span className="hidden sm:inline text-[11px] font-bold">Voix HD</span>
                    </button>

                    {/* Progression */}
                    <div className="hidden md:flex items-center gap-2">
                        <div className="w-28 bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                        </div>
                        <span className="text-xs font-bold text-slate-600 font-mono">{progressPercent}%</span>
                    </div>

                    <button
                        onClick={handleStartExamAction}
                        className="px-4 py-2 bg-slate-900 hover:bg-amber-600 text-white rounded-xl text-xs font-black transition-all shadow flex items-center gap-1.5"
                    >
                        <Award size={15} /> Passer l'Examen Certifiant
                    </button>
                </div>
            </div>

            {/* Layout Principal : Contenu de la Leçon + Sidebar Modules */}
            <div className="flex-1 flex overflow-hidden">
                
                {/* Zone Centrale : Leçon & Onglets */}
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6">
                    
                    {currentLesson ? (
                        <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden space-y-6">
                            
                            {/* Onglets de la Leçon */}
                            <div className="flex border-b border-slate-200 bg-slate-50/70 p-2 gap-2 overflow-x-auto">
                                {[
                                    { id: 'theory', label: 'Théorie & Synthèse', icon: BookOpen, activeColor: 'text-indigo-700 border-indigo-600' },
                                    { id: 'practice', label: 'Travaux Pratiques & Cas Réels', icon: Dumbbell, activeColor: 'text-emerald-700 border-emerald-600' },
                                    { id: 'quiz', label: 'Mini-Quiz de Validation', icon: HelpCircle, activeColor: 'text-amber-700 border-amber-600' },
                                    { id: 'resources', label: 'Ressources & Bibliothèque', icon: Library, activeColor: 'text-purple-700 border-purple-600' }
                                ].map(tab => {
                                    const Icon = tab.icon;
                                    const isActive = activeTab === tab.id;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                                                isActive
                                                ? `bg-white shadow-sm font-black text-slate-900 border ${tab.activeColor}`
                                                : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                                            }`}
                                        >
                                            <Icon size={15} />
                                            <span>{tab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Contenu de l'Onglet Actif */}
                            <div className="p-6 sm:p-10 space-y-6">
                                
                                <div className="space-y-2 border-b border-slate-100 pb-4">
                                    <div className="flex items-center justify-between text-xs text-slate-400">
                                        <span className="flex items-center gap-1.5"><Clock size={13} /> Durée estimée : {currentLesson.duration}</span>
                                        {currentCompletedIds.includes(currentLesson.id) && (
                                            <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                                                <CheckCircle2 size={12} /> Leçon Validée
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                                        {currentLesson.title}
                                    </h2>
                                </div>

                                {/* ONGLET 1 : THÉORIE */}
                                {activeTab === 'theory' && (
                                    <div className="prose prose-slate max-w-none prose-sm sm:prose-base space-y-6">
                                        {currentLesson.content ? (
                                            <div className="space-y-4">
                                                {/* Bannière Pédagogique Professeur Diallo */}
                                                <div className="bg-gradient-to-r from-indigo-50 via-slate-50 to-blue-50 border border-indigo-100 rounded-2xl p-4 flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                                        <GraduationCap size={18} />
                                                    </div>
                                                    <div className="text-xs text-indigo-950">
                                                        <span className="font-bold">Encadrement Académique :</span> Cours rédigé et structuré selon les standards officiels d'excellence du Professeur Diallo.
                                                    </div>
                                                </div>

                                                <div className="whitespace-pre-wrap font-serif text-slate-800 leading-relaxed text-[15px] sm:text-[16px] selection:bg-indigo-100">
                                                    {currentLesson.content}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="space-y-4 text-slate-700 leading-relaxed">
                                                <p>
                                                    Ce module d'apprentissage approfondit les principes fondamentaux et méthodologiques nécessaires pour maîtriser le programme officiel de <strong>{activeCourse.title}</strong>.
                                                </p>
                                                <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-5 space-y-2">
                                                    <h4 className="text-xs font-black text-indigo-900 uppercase tracking-wider flex items-center gap-2">
                                                        <Sparkles size={15} className="text-indigo-600" /> Notions Essentielles à Retenir
                                                    </h4>
                                                    <ul className="space-y-1.5 text-xs text-indigo-950">
                                                        <li>• Compréhension claire des définitions et axiomes de base.</li>
                                                        <li>• Application des théorèmes directeurs dans des contextes réels.</li>
                                                        <li>• Vérification critique de chaque résultat intermédiaire.</li>
                                                    </ul>
                                                </div>
                                            </div>
                                        )}

                                        <div className="pt-8 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
                                            <div className="text-xs text-slate-500">
                                                Prêt à consolider ? Passez aux exercices pratiques pour vous entraîner.
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <button
                                                    onClick={() => setActiveTab('practice')}
                                                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5"
                                                >
                                                    <Dumbbell size={14} className="text-emerald-600" /> Passer aux TP
                                                </button>
                                                <button
                                                    onClick={() => handleCompleteCurrentLesson(currentLesson.id)}
                                                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow flex items-center gap-2"
                                                >
                                                    <Check size={16} /> Valider la Leçon (+50 XP)
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* ONGLET 2 : TRAVAUX PRATIQUES */}
                                {activeTab === 'practice' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                                            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                                                <Dumbbell size={16} className="text-emerald-600" /> 
                                                {matchedRealCourse?.practicalExercise.title || "Cas Pratique d'Application Directe & Épreuve Officielle"}
                                            </h3>
                                            <p className="text-xs text-slate-600 leading-relaxed">
                                                {matchedRealCourse?.practicalExercise.context || "Mettez en pratique les concepts théoriques à travers cet exercice guidé. Analysez rigoureusement l'énoncé avant de consulter le corrigé détaillé."}
                                            </p>
                                        </div>

                                        {/* Énoncé */}
                                        <div className="p-6 bg-white border-2 border-slate-100 rounded-2xl space-y-4 shadow-xs">
                                            <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <FileText size={14} className="text-indigo-600" /> Énoncé du Problème :
                                            </div>
                                            <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                                                {matchedRealCourse?.practicalExercise.problemStatement || 
                                                    `Sur la base des notions étudiées dans « ${currentLesson.title} », analysez le scénario proposé, identifiez les variables clés, formulez les hypothèses nécessaires et détaillez votre démarche de résolution étape par étape.`
                                                }
                                            </p>

                                            {/* Étapes Guidées */}
                                            <div className="space-y-2 pt-3 border-t border-slate-100">
                                                <div className="text-[11px] font-bold text-slate-500 uppercase">Démarche Guidée :</div>
                                                <ul className="space-y-1.5 text-xs text-slate-700 font-sans">
                                                    {(matchedRealCourse?.practicalExercise.guidedSteps || [
                                                        "1. Définir les variables et hypothèses fondamentales.",
                                                        "2. Appliquer les formules et théorèmes directeurs du cours.",
                                                        "3. Calculer les résultats intermédiaires avec précision.",
                                                        "4. Conclure et vérifier la cohérence du résultat final."
                                                    ]).map((step, idx) => (
                                                        <li key={idx} className="flex items-start gap-2">
                                                            <span className="w-4 h-4 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                                                                {idx + 1}
                                                            </span>
                                                            <span>{step}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        {/* Bouton Révélation du Corrigé */}
                                        <div className="border border-emerald-100 rounded-2xl overflow-hidden bg-emerald-50/40">
                                            <button
                                                onClick={() => setIsSolutionRevealed(!isSolutionRevealed)}
                                                className="w-full p-4 flex items-center justify-between text-left hover:bg-emerald-50/80 transition-colors"
                                            >
                                                <div className="flex items-center gap-2 text-xs font-black text-emerald-900">
                                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                                    <span>{isSolutionRevealed ? "Masquer le Corrigé Détaillé & Barème" : "Afficher le Corrigé Détaillé Officiel (Barème Pas à Pas)"}</span>
                                                </div>
                                                {isSolutionRevealed ? <ChevronUp size={16} className="text-emerald-700" /> : <ChevronDown size={16} className="text-emerald-700" />}
                                            </button>

                                            {isSolutionRevealed && (
                                                <div className="p-6 bg-white border-t border-emerald-100 text-xs sm:text-sm text-slate-800 space-y-4 font-serif leading-relaxed whitespace-pre-wrap animate-fade-in">
                                                    {matchedRealCourse?.practicalExercise.detailedSolution || `### Corrigé Type & Recommandations du Professeur Diallo

1. **Identification des Données :**
   Posez clairement l'ensemble des éléments connus et le domaine de validité.

2. **Démonstration Rigoureuse :**
   Chaque étape doit mentionner explicitement le théorème ou la règle juridique/technique appliquée.

3. **Vérification de l'Ordre de Grandeur :**
   Assurez-vous que le résultat final a une signification physique, financière ou logique cohérente avec le contexte.`}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex justify-end gap-3 pt-2">
                                            <button
                                                onClick={() => setActiveTab('quiz')}
                                                className="px-6 py-3 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-bold text-xs transition-all shadow flex items-center gap-2"
                                            >
                                                Passer au Mini-Quiz de Validation <ArrowRight size={14} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ONGLET 3 : MINI-QUIZ */}
                                {activeTab === 'quiz' && (
                                    <div className="space-y-6 animate-fade-in">
                                        <div className="space-y-2">
                                            <h3 className="text-base font-black text-slate-900">
                                                Mini-Quiz de Validation des Connaissances
                                            </h3>
                                            <p className="text-xs text-slate-500">
                                                Répondez aux questions ci-dessous pour vérifier votre assimilation avant de poursuivre votre cursus.
                                            </p>
                                        </div>

                                        <div className="space-y-4">
                                            {currentQuiz.map((q, idx) => (
                                                <div key={q.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                                                    <div className="text-xs font-black text-slate-900 flex items-center gap-2">
                                                        <span className="w-5 h-5 rounded-md bg-indigo-600 text-white flex items-center justify-center text-[10px]">
                                                            {idx + 1}
                                                        </span>
                                                        <span>{q.question}</span>
                                                    </div>

                                                    <div className="space-y-2">
                                                        {q.options.map((opt, optIdx) => {
                                                            const isSelected = quizAnswers[q.id] === optIdx;
                                                            const isCorrect = optIdx === q.correctIndex;
                                                            return (
                                                                <button
                                                                    key={optIdx}
                                                                    onClick={() => handleQuizSelect(q.id, optIdx)}
                                                                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start gap-2.5 ${
                                                                        isSelected 
                                                                        ? (quizSubmitted 
                                                                            ? (isCorrect ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold' : 'bg-rose-50 border-rose-500 text-rose-950 font-bold')
                                                                            : 'bg-indigo-50 border-indigo-600 text-indigo-900 font-bold')
                                                                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                                                                    }`}
                                                                >
                                                                    <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                                                        isSelected 
                                                                        ? (quizSubmitted ? (isCorrect ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white') : 'bg-indigo-600 text-white')
                                                                        : 'bg-slate-100 text-slate-500'
                                                                    }`}>
                                                                        {String.fromCharCode(65 + optIdx)}
                                                                    </div>
                                                                    <span className="mt-0.5">{opt}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>

                                                    {quizSubmitted && (
                                                        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 animate-fade-in">
                                                            <strong>Explication du Professeur :</strong> {q.explanation}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex justify-end gap-3">
                                            <button
                                                onClick={handleValidateQuiz}
                                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs transition-all shadow flex items-center gap-2"
                                            >
                                                <Check size={16} /> Valider mes Réponses & Enregistrer (+50 XP)
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* ONGLET 4 : RESSOURCES */}
                                {activeTab === 'resources' && (
                                    <div className="space-y-4 animate-fade-in">
                                        <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                            <Library size={16} className="text-purple-600" /> Ressources Pédagogiques & Bibliographie Officielle
                                        </h3>
                                        <div className="space-y-3 text-xs text-slate-700">
                                            {(matchedRealCourse?.officialResources || [
                                                {
                                                    title: `Fiche Synthèse Officielle (${activeCourse.title})`,
                                                    type: "Fiche Synthèse",
                                                    description: "Résumé concis des théorèmes, formules et méthodologies indispensables."
                                                },
                                                {
                                                    title: "Annales et Sujets Corrigés d'Examens d'État",
                                                    type: "Annales Corrigées",
                                                    description: "Recueil d'épreuves officielles avec barème de correction du jury."
                                                },
                                                {
                                                    title: "Manuel de Référence et Textes Fondateurs",
                                                    type: "Manuel Officiel",
                                                    description: "Ouvrage complet validé par la Chaire Pédagogique Le Monde à Vous."
                                                }
                                            ]).map((res, rIdx) => (
                                                <div key={rIdx} className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-4 shadow-xs">
                                                    <div className="space-y-1">
                                                        <div className="font-bold text-slate-900 flex items-center gap-2">
                                                            <FileText size={14} className="text-indigo-600" /> {res.title}
                                                        </div>
                                                        <div className="text-[11px] text-slate-500">{res.description}</div>
                                                    </div>
                                                    <span className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-[10px] font-bold uppercase shrink-0">
                                                        {res.type}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                            </div>

                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-400">
                            <BookOpen size={48} className="mx-auto mb-3 opacity-30" />
                            <p className="text-xs">Sélectionnez une leçon dans le sommaire à droite pour commencer.</p>
                        </div>
                    )}

                </div>

                {/* Sidebar Droite : Sommaire des Modules & Leçons */}
                <div className="w-80 bg-white border-l border-slate-200 flex flex-col h-full z-20 shrink-0">
                    <div className="p-4 border-b border-slate-200 space-y-1 bg-slate-50">
                        <div className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={14} className="text-indigo-600" /> Sommaire du Cursus
                        </div>
                        <div className="text-[11px] text-slate-500">
                            {allLessons.length} leçons • {completedCount} validées
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-3 space-y-1.5">
                        {allLessons.map((lesson, idx) => {
                            const isCompleted = currentCompletedIds.includes(lesson.id);
                            const isActive = currentLesson?.id === lesson.id;

                            return (
                                <button
                                    key={lesson.id}
                                    onClick={() => handleSelectLesson(lesson)}
                                    className={`w-full text-left p-3 rounded-2xl border transition-all flex items-start gap-3 ${
                                        isActive
                                        ? 'bg-indigo-50 border-indigo-600 text-indigo-950 font-bold shadow-xs'
                                        : isCompleted
                                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                                        : 'bg-white border-slate-100 hover:border-slate-200 text-slate-700'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                                        isCompleted
                                        ? 'bg-emerald-500 text-white'
                                        : isActive
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-slate-100 text-slate-500'
                                    }`}>
                                        {isCompleted ? <Check size={12} /> : idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="text-xs font-bold truncate">{lesson.title}</div>
                                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">{lesson.duration}</div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {/* Examen Final CTA */}
                    <div className="p-4 border-t border-slate-200 bg-slate-50 space-y-2">
                        <button
                            onClick={handleStartExamAction}
                            className="w-full py-3 bg-slate-900 hover:bg-amber-600 text-white rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow"
                        >
                            <Award size={15} /> Passer l'Examen Certifiant
                        </button>
                    </div>
                </div>

            </div>

            {/* Modal de Sélection des Voix ElevenLabs */}
            <VoiceSettingsModal
                isOpen={isVoiceSettingsOpen}
                onClose={() => setIsVoiceSettingsOpen(false)}
                currentAgentRole="professor"
                onVoiceChanged={(vId) => setCurrentVoiceId(vId)}
            />

        </div>
    );
};

