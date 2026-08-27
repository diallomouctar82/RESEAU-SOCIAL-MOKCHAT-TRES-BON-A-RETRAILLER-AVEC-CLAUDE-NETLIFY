// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS MOCK EXAM VIEW — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Salle d'Examen Blanc Chronométrée avec feedback pédagogique de Professeur Diallo

import React, { useState, useEffect } from 'react';
import { 
    Clock, 
    CheckCircle2, 
    AlertTriangle, 
    Award, 
    ArrowRight, 
    ArrowLeft, 
    RotateCcw, 
    FileText, 
    Sparkles, 
    ShieldCheck 
} from 'lucide-react';
import { MockExamBlueprint, QuizQuestion, MockExamReport } from '../types';

interface CampusMockExamViewProps {
    blueprint: MockExamBlueprint;
    onFinishExam: (report: MockExamReport) => void;
    onCancel: () => void;
}

export const CampusMockExamView: React.FC<CampusMockExamViewProps> = ({
    blueprint,
    onFinishExam,
    onCancel
}) => {
    // Calcul de toutes les questions aplaties
    const allQuestions: { question: QuizQuestion; sectionTitle: string; points: number }[] = [];
    blueprint.sections.forEach(sec => {
        sec.questions.forEach(q => {
            allQuestions.push({
                question: q,
                sectionTitle: sec.title,
                points: Math.round(sec.points / (sec.questions.length || 1))
            });
        });
    });

    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
    const [timeLeftSeconds, setTimeLeftSeconds] = useState(blueprint.durationMinutes * 60);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [finalReport, setFinalReport] = useState<MockExamReport | null>(null);

    // Minuteur d'examen
    useEffect(() => {
        if (isSubmitted || timeLeftSeconds <= 0) return;
        const timer = setInterval(() => {
            setTimeLeftSeconds(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    handleSubmitExam();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [isSubmitted, timeLeftSeconds]);

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? `${h}h ` : ''}${m.toString().padStart(2, '0')}m ${s.toString().padStart(2, '0')}s`;
    };

    const currentItem = allQuestions[currentIndex] || allQuestions[0];

    const handleSelectOption = (optionIndex: number) => {
        if (isSubmitted) return;
        setSelectedAnswers(prev => ({
            ...prev,
            [currentItem.question.id]: optionIndex
        }));
    };

    const handleSubmitExam = () => {
        if (isSubmitted) return;
        setIsSubmitted(true);

        let earnedPoints = 0;
        let totalPossible = 0;
        const mastered: string[] = [];
        const toReinforce: string[] = [];

        allQuestions.forEach(item => {
            totalPossible += item.points;
            const userAnswer = selectedAnswers[item.question.id];
            if (userAnswer === item.question.correctIndex) {
                earnedPoints += item.points;
                mastered.push(item.question.question);
            } else {
                toReinforce.push(item.question.question);
            }
        });

        // Calcul note ramenée sur 20
        const noteSur20 = totalPossible > 0 ? Number(((earnedPoints / totalPossible) * 20).toFixed(1)) : 0;
        const passed = noteSur20 >= blueprint.passingScore;

        const report: MockExamReport = {
            id: `rep-${Date.now()}`,
            examBlueprintId: blueprint.id,
            examTitle: blueprint.examName,
            takenAt: new Date().toISOString(),
            durationSpentSeconds: (blueprint.durationMinutes * 60) - timeLeftSeconds,
            score: noteSur20,
            passed: passed,
            competencyAnalysis: {
                mastered: mastered.slice(0, 3),
                partial: [],
                toReinforce: toReinforce.slice(0, 3)
            },
            examinerDialloFeedback: passed 
                ? `Félicitations pour cette belle épreuve ! Votre maîtrise des fondamentaux du programme (${blueprint.countryCode}) est solide. Vous abordez les examens officiels avec un avantage compétitif réel.`
                : `Ne baissez pas les bras. Cet examen blanc a permis de pointer précisément les notions à revoir. Nous allons consolider ces points ensemble dès aujourd'hui.`,
            prescribedRevisionActions: [
                'Revoir la leçon associée aux notions non validées',
                'Refaire l’exercice d’application avec le mode "Explique-moi autrement"',
                'Planifier une nouvelle session blanche dans 7 jours'
            ]
        };

        setFinalReport(report);
        onFinishExam(report);
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden max-w-4xl mx-auto my-6">
            {/* Header d'Examen */}
            <div className="bg-slate-950 text-white p-6 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                        <ShieldCheck size={16} /> Salle d'Évaluation Officielle • {blueprint.levelName}
                    </div>
                    <h2 className="text-xl md:text-2xl font-black">{blueprint.examName}</h2>
                </div>

                {!isSubmitted && (
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-700 rounded-2xl">
                        <Clock size={18} className={timeLeftSeconds < 300 ? 'text-rose-400 animate-pulse' : 'text-amber-400'} />
                        <span className="font-mono font-bold text-base">{formatTime(timeLeftSeconds)}</span>
                    </div>
                )}
            </div>

            {/* Corps d'Examen */}
            {!isSubmitted ? (
                <div className="p-6 md:p-8 space-y-6">
                    {/* Consignes & Progression */}
                    <div className="flex items-center justify-between text-xs text-slate-500 pb-4 border-b border-slate-100">
                        <span className="font-bold text-slate-800">
                            Question {currentIndex + 1} / {allQuestions.length} • {currentItem.sectionTitle}
                        </span>
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                            Valeur : {currentItem.points} pts
                        </span>
                    </div>

                    {/* Question text */}
                    <div className="text-base md:text-lg font-bold text-slate-900 leading-relaxed">
                        {currentItem.question.question}
                    </div>

                    {/* Options */}
                    <div className="space-y-3">
                        {currentItem.question.options.map((opt, idx) => {
                            const isSelected = selectedAnswers[currentItem.question.id] === idx;
                            return (
                                <button
                                    key={idx}
                                    onClick={() => handleSelectOption(idx)}
                                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-center gap-4 ${
                                        isSelected 
                                            ? 'border-slate-950 bg-slate-900 text-white shadow-md' 
                                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                                    }`}
                                >
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                                        isSelected ? 'bg-white text-slate-950' : 'bg-slate-100 text-slate-600'
                                    }`}>
                                        {String.fromCharCode(65 + idx)}
                                    </div>
                                    <span className="text-sm font-medium">{opt}</span>
                                </button>
                            );
                        })}
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                        <button
                            disabled={currentIndex === 0}
                            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
                            className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1.5"
                        >
                            <ArrowLeft size={16} /> Précédente
                        </button>

                        <div className="flex items-center gap-2">
                            {currentIndex < allQuestions.length - 1 ? (
                                <button
                                    onClick={() => setCurrentIndex(prev => Math.min(allQuestions.length - 1, prev + 1))}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-sm"
                                >
                                    Suivante <ArrowRight size={16} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleSubmitExam}
                                    className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 flex items-center gap-1.5 shadow-md"
                                >
                                    Rendre ma Copie & Évaluer <CheckCircle2 size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                /* Rapport de Note d'Examen */
                <div className="p-6 md:p-8 space-y-6">
                    <div className={`p-6 rounded-3xl text-center space-y-3 ${
                        finalReport?.passed ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'
                    }`}>
                        <div className="inline-flex p-3 rounded-2xl bg-white shadow-sm">
                            {finalReport?.passed ? <Award className="w-10 h-10 text-emerald-600" /> : <AlertTriangle className="w-10 h-10 text-amber-600" />}
                        </div>
                        <h3 className="text-2xl font-black text-slate-900">
                            Note Obtenue : {finalReport?.score} / 20
                        </h3>
                        <p className="text-sm font-bold text-slate-700">
                            {finalReport?.passed ? '🎉 Admis à l’Examen Blanc avec mention officielle' : '⚠️ Niveau en cours d’acquisition — Consolidation recommandée'}
                        </p>
                    </div>

                    {/* Feedback Professeur Diallo */}
                    <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 space-y-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                            <Sparkles size={16} /> Appréciation Personnalisée de Professeur Diallo
                        </div>
                        <p className="text-sm text-slate-300 leading-relaxed italic">
                            "{finalReport?.examinerDialloFeedback}"
                        </p>
                    </div>

                    {/* Prescriptions de révision */}
                    <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Plan d'Action Pédagogique Immédiat :</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {finalReport?.prescribedRevisionActions.map((action, idx) => (
                                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium flex items-start gap-2">
                                    <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px] shrink-0">{idx + 1}</span>
                                    <span>{action}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                        <button
                            onClick={onCancel}
                            className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all shadow-md"
                        >
                            Retourner au Campus
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
