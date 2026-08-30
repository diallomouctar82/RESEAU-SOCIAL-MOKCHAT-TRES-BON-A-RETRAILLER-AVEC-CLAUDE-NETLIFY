// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 SALLE D'EXAMEN CERTIFIANT OFFICIEL & DÉLIBÉRATION DU JURY — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState, useEffect } from 'react';
import { 
    GraduationCap, 
    Clock, 
    Award, 
    CheckCircle2, 
    AlertTriangle, 
    ArrowRight, 
    ArrowLeft, 
    RotateCcw, 
    Sparkles, 
    ShieldCheck, 
    Printer, 
    BookOpen, 
    Check, 
    X,
    Trophy,
    HelpCircle,
    Flag
} from 'lucide-react';
import { QuizQuestion, Certificate, UserProfile } from '../types';
import { CertifyingFormation } from '../services/formationsRegistry';
import { cloudService } from '../services/cloud';

interface CampusCertifyingExamViewProps {
    formation: CertifyingFormation;
    userProfile: UserProfile;
    onFinishExam: (certificate: Certificate | null, score: number, passed: boolean) => void;
    onViewCertificate?: (certificate: Certificate) => void;
    onBackToClassroom: () => void;
}

export const CampusCertifyingExamView: React.FC<CampusCertifyingExamViewProps> = ({
    formation,
    userProfile,
    onFinishExam,
    onViewCertificate,
    onBackToClassroom
}) => {
    // Phases: 'convocation' | 'in_progress' | 'deliberation' | 'result'
    const [phase, setPhase] = useState<'convocation' | 'in_progress' | 'deliberation' | 'result'>('convocation');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [userAnswers, setUserAnswers] = useState<Record<string, number>>({});
    const [flaggedQuestions, setFlaggedQuestions] = useState<string[]>([]);
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(formation.examDurationMinutes * 60);
    const [finalScore, setFinalScore] = useState(0);
    const [passed, setPassed] = useState(false);
    const [mention, setMention] = useState('');
    const [generatedCertificate, setGeneratedCertificate] = useState<Certificate | null>(null);

    // Initialisation des questions
    useEffect(() => {
        if (formation.examQuestions && formation.examQuestions.length > 0) {
            setQuestions(formation.examQuestions);
        } else {
            // Fallback questions si non définies
            setQuestions([
                {
                    id: 'q1',
                    question: `Quels sont les principes fondamentaux régissant le domaine de "${formation.title}" ?`,
                    options: [
                        "Rigueur méthodologique, application des théories validées et respect de la déontologie.",
                        "Approche intuitive sans vérification empirique.",
                        "Usage exclusif de modèles non vérifiés.",
                        "Aucune contrainte normative particulière."
                    ],
                    correctIndex: 0,
                    explanation: "La rigueur et l'application stricte des méthodes éprouvées sont requises pour la validation académique."
                }
            ]);
        }
    }, [formation]);

    // Chronomètre pendant l'examen
    useEffect(() => {
        if (phase !== 'in_progress') return;

        const interval = setInterval(() => {
            setTimeLeftSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    handleAutoSubmit();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [phase, userAnswers]);

    const handleStartExam = () => {
        setPhase('in_progress');
        setTimeLeftSeconds(formation.examDurationMinutes * 60);
    };

    const handleSelectOption = (questionId: string, optionIndex: number) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: optionIndex
        }));
    };

    const handleToggleFlag = (questionId: string) => {
        setFlaggedQuestions(prev => 
            prev.includes(questionId) ? prev.filter(id => id !== questionId) : [...prev, questionId]
        );
    };

    const handleAutoSubmit = () => {
        handleSubmitExam();
    };

    const handleSubmitExam = async () => {
        setPhase('deliberation');

        // Calcul de la note sur 20
        let correctCount = 0;
        questions.forEach(q => {
            if (userAnswers[q.id] === q.correctIndex) {
                correctCount++;
            }
        });

        const totalQ = questions.length || 1;
        const scoreOutOf20 = (correctCount / totalQ) * 20;
        const isExamPassed = scoreOutOf20 >= (formation.passingScore || 10);

        let calculatedMention = "Mention Passable";
        if (scoreOutOf20 >= 16) calculatedMention = "Mention Très Bien avec Félicitations du Jury";
        else if (scoreOutOf20 >= 14) calculatedMention = "Mention Bien";
        else if (scoreOutOf20 >= 12) calculatedMention = "Mention Assez Bien";

        setFinalScore(scoreOutOf20);
        setPassed(isExamPassed);
        setMention(calculatedMention);

        // Simulation délibération du jury
        setTimeout(async () => {
            let cert: Certificate | null = null;
            if (isExamPassed) {
                cert = {
                    id: `CERT-${Date.now()}`,
                    courseId: formation.id,
                    courseTitle: formation.certificationTitle || formation.title,
                    studentName: userProfile.name,
                    issueDate: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }),
                    grade: scoreOutOf20,
                    serialNumber: `LMAV-CERT-${formation.id.toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`,
                    institution: formation.institution
                };

                await cloudService.issueCertificate(cert);
                setGeneratedCertificate(cert);
            }

            setPhase('result');
            onFinishExam(cert, scoreOutOf20, isExamPassed);
        }, 1800);
    };

    const formatTimer = (secs: number) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 1. PHASE CONVOCATION & CONSIGNES OFFICIELLES
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (phase === 'convocation') {
        return (
            <div className="max-w-3xl mx-auto p-4 sm:p-8 animate-fade-up space-y-6">
                
                <button
                    onClick={onBackToClassroom}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1.5 transition-colors -ml-2.5 px-2.5 py-2 rounded-lg"
                >
                    <ArrowLeft size={14} /> Retour à la Salle de Classe
                </button>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
                    
                    <div className="bg-slate-950 text-white p-6 sm:p-8 space-y-3 relative overflow-hidden">
                        <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                            <ShieldCheck size={16} /> Épreuve Terminale Officielle de Certification
                        </div>
                        <h1 className="text-xl sm:text-2xl font-black">{formation.certificationTitle}</h1>
                        <p className="text-xs text-slate-300">
                            Session individuelle sous la présidence du Professeur Diallo • {formation.institution}
                        </p>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        
                        {/* Récapitulatif Candidat & Conditions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Candidat Convoqué</div>
                                <div className="text-sm font-black text-slate-900">{userProfile.name}</div>
                                <div className="text-[11px] text-slate-500">ID: {userProfile.id}</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Durée de l'Épreuve</div>
                                <div className="text-sm font-black text-amber-600 flex items-center gap-1">
                                    <Clock size={16} /> {formation.examDurationMinutes} Minutes
                                </div>
                                <div className="text-[11px] text-slate-500">{questions.length} Questions</div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                                <div className="text-[10px] text-slate-400 font-bold uppercase">Seuil d'Admission</div>
                                <div className="text-sm font-black text-emerald-600 flex items-center gap-1">
                                    <Award size={16} /> {formation.passingScore}/20 minimum
                                </div>
                                <div className="text-[11px] text-slate-500">Diplôme Officiel</div>
                            </div>
                        </div>

                        {/* Consignes du Jury */}
                        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
                            <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                                <AlertTriangle size={16} className="text-amber-600" /> Consignes et Règlement des Examens
                            </h3>
                            <ul className="space-y-2 text-xs text-amber-900/90 leading-relaxed">
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">•</span>
                                    <span>L'épreuve est minutée. Dès le lancement, le compte à rebours ne peut être mis en pause.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">•</span>
                                    <span>Vous pouvez naviguer librement entre les questions et marquer celles que vous souhaitez relire.</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="font-bold">•</span>
                                    <span>Toute note supérieure ou égale à {formation.passingScore}/20 génère instantanément votre diplôme officiel certifié.</span>
                                </li>
                            </ul>
                        </div>

                        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100">
                            <div className="text-xs text-slate-500 text-center sm:text-left">
                                Êtes-vous prêt ? Assurez-vous d'avoir une connexion stable.
                            </div>
                            <button
                                onClick={handleStartExam}
                                className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black text-xs transition-all shadow-xl flex items-center justify-center gap-2"
                            >
                                <Sparkles size={16} className="text-amber-400" />
                                <span>Entrer dans la Salle d'Examen</span>
                                <ArrowRight size={14} />
                            </button>
                        </div>

                    </div>

                </div>

            </div>
        );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 2. PHASE DÉLIBÉRATION EN DIRECT DU JURY
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (phase === 'deliberation') {
        return (
            <div className="max-w-xl mx-auto my-20 p-8 bg-white rounded-3xl border border-slate-200 shadow-2xl text-center space-y-6 animate-fade-up">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto animate-bounce shadow-inner">
                    <GraduationCap size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-slate-900">Délibération du Jury Académique</h2>
                    <p className="text-xs text-slate-500">
                        Le Professeur Diallo et le Conseil d'Évaluation examinent vos réponses et calculent votre note officielle...
                    </p>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div className="bg-indigo-600 h-full w-2/3 animate-pulse"></div>
                </div>
            </div>
        );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 3. PHASE RÉSULTAT & DIPLÔME OFFICIEL
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    if (phase === 'result') {
        return (
            <div className="max-w-3xl mx-auto p-4 sm:p-8 animate-fade-up space-y-8">
                
                <div className={`p-8 rounded-3xl border shadow-xl text-center space-y-6 ${
                    passed ? 'bg-emerald-50/70 border-emerald-200' : 'bg-rose-50/70 border-rose-200'
                }`}>
                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center mx-auto shadow-lg ${
                        passed ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}>
                        {passed ? <Trophy size={40} /> : <AlertTriangle size={40} />}
                    </div>

                    <div className="space-y-1">
                        <span className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full ${
                            passed ? 'bg-emerald-200 text-emerald-900' : 'bg-rose-200 text-rose-900'
                        }`}>
                            {passed ? "Examen Validé avec Succès" : "Examen Non Validé"}
                        </span>
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 pt-2">
                            {passed ? "Félicitations du Jury Académique !" : "Note Insuffisante pour l'Admission"}
                        </h1>
                        <p className="text-xs text-slate-600 max-w-lg mx-auto">
                            {passed 
                                ? `Le jury a proclamé votre admission au titre de : ${formation.certificationTitle}.` 
                                : `Vous n'avez pas atteint la note d'admission requise (${formation.passingScore}/20). Révisez les leçons clés et retentez l'épreuve.`
                            }
                        </p>
                    </div>

                    {/* Note Obtenue */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 max-w-md mx-auto shadow-sm space-y-2">
                        <div className="text-[10px] text-slate-400 font-bold uppercase">Note Officielle Attribuée</div>
                        <div className="text-4xl sm:text-5xl font-black text-slate-900">
                            {finalScore.toFixed(1)} <span className="text-lg text-slate-400 font-normal">/ 20</span>
                        </div>
                        {passed && (
                            <div className="text-xs font-bold text-amber-700 bg-amber-50 py-1 px-3 rounded-lg inline-block">
                                ⭐ {mention}
                            </div>
                        )}
                    </div>

                    {/* Certificat & Actions */}
                    {passed && generatedCertificate ? (
                        <div className="space-y-4 pt-2">
                            <div className="bg-slate-900 text-white p-6 rounded-2xl text-left space-y-2 shadow-lg relative overflow-hidden">
                                <div className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-1.5">
                                    <ShieldCheck size={14} /> Diplôme Officiel Enregistré
                                </div>
                                <div className="text-lg font-bold">{generatedCertificate.courseTitle}</div>
                                <div className="text-xs text-slate-400 font-mono">
                                    N° de Série : {generatedCertificate.serialNumber} • Délivré le {generatedCertificate.issueDate}
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                                {onViewCertificate && (
                                    <button
                                        onClick={() => onViewCertificate(generatedCertificate)}
                                        className="px-6 py-3 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-700 hover:to-indigo-700 text-white rounded-2xl font-black text-xs shadow transition-all flex items-center gap-2"
                                    >
                                        <Printer size={15} /> Voir mon Diplôme Officiel
                                    </button>
                                )}
                                <button
                                    onClick={onBackToClassroom}
                                    className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow transition-all"
                                >
                                    Retour aux Cours
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={handleStartExam}
                                className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow flex items-center gap-2"
                            >
                                <RotateCcw size={14} /> Retenter l'Épreuve
                            </button>
                            <button
                                onClick={onBackToClassroom}
                                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-50"
                            >
                                Revoir les Modules de Cours
                            </button>
                        </div>
                    )}

                </div>

            </div>
        );
    }

    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // 4. PHASE ÉPREUVE EN COURS (SALLE D'EXAMEN MINUTÉE)
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const currentQ = questions[currentQuestionIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(userAnswers).length;

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-fade-up space-y-6">
            
            {/* Top Bar Chronomètre & Progression */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-4 sticky top-4 z-30">
                <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-700 font-black text-xs flex items-center justify-center">
                        Q{currentQuestionIndex + 1}
                    </span>
                    <div>
                        <div className="text-xs font-black text-slate-900">
                            Question {currentQuestionIndex + 1} sur {totalQuestions}
                        </div>
                        <div className="text-[11px] text-slate-500">
                            {answeredCount} répondues • {totalQuestions - answeredCount} restantes
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`px-4 py-2 rounded-xl font-mono font-black text-sm flex items-center gap-2 ${
                        timeLeftSeconds < 180 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-slate-900 text-white'
                    }`}>
                        <Clock size={16} />
                        <span>{formatTimer(timeLeftSeconds)}</span>
                    </div>

                    <button
                        onClick={handleSubmitExam}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5"
                    >
                        <Check size={14} /> Terminer & Soumettre
                    </button>
                </div>
            </div>

            {/* Navigation Rapide entre Questions */}
            <div className="flex gap-1.5 overflow-x-auto pb-2">
                {questions.map((q, idx) => {
                    const isAnswered = userAnswers[q.id] !== undefined;
                    const isFlagged = flaggedQuestions.includes(q.id);
                    const isCurrent = currentQuestionIndex === idx;

                    return (
                        <button
                            key={q.id}
                            onClick={() => setCurrentQuestionIndex(idx)}
                            className={`w-9 h-9 rounded-xl font-bold text-xs shrink-0 flex items-center justify-center transition-all ${
                                isCurrent 
                                ? 'bg-indigo-600 text-white ring-2 ring-indigo-600 ring-offset-2' 
                                : isFlagged
                                ? 'bg-amber-100 text-amber-800 border border-amber-300'
                                : isAnswered
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                            {idx + 1}
                        </button>
                    );
                })}
            </div>

            {/* Énoncé de la Question */}
            {currentQ && (
                <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
                    
                    <div className="flex items-start justify-between gap-4">
                        <h2 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                            {currentQ.question}
                        </h2>
                        <button
                            onClick={() => handleToggleFlag(currentQ.id)}
                            aria-label="Marquer pour relecture"
                            aria-pressed={flaggedQuestions.includes(currentQ.id)}
                            className={`p-2.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
                                flaggedQuestions.includes(currentQ.id)
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                            title="Marquer pour relecture"
                        >
                            <Flag size={14} className={flaggedQuestions.includes(currentQ.id) ? 'fill-amber-500' : ''} />
                        </button>
                    </div>

                    {/* Options de Réponses */}
                    <div className="space-y-3 pt-2">
                        {currentQ.options.map((option, optIdx) => {
                            const isSelected = userAnswers[currentQ.id] === optIdx;
                            return (
                                <button
                                    key={optIdx}
                                    onClick={() => handleSelectOption(currentQ.id, optIdx)}
                                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all flex items-start gap-3.5 ${
                                        isSelected
                                        ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-bold shadow-sm'
                                        : 'border-slate-100 bg-white hover:border-indigo-200 hover:bg-slate-50 text-slate-800 font-medium'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${
                                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {String.fromCharCode(65 + optIdx)}
                                    </div>
                                    <span className="text-xs sm:text-sm leading-relaxed mt-0.5">{option}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Boutons Suivant / Précédent */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <button
                            disabled={currentQuestionIndex === 0}
                            onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
                            className="px-5 py-2.5 rounded-xl font-bold text-xs text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
                        >
                            <ArrowLeft size={14} /> Question précédente
                        </button>

                        {currentQuestionIndex < totalQuestions - 1 ? (
                            <button
                                onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
                                className="px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                Question suivante <ArrowRight size={14} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitExam}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                            >
                                <Check size={14} /> Valider l'Examen
                            </button>
                        )}
                    </div>

                </div>
            )}

        </div>
    );
};
