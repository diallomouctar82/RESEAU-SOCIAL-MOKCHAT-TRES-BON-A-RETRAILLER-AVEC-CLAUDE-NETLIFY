// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS DIAGNOSTIC & POSITIONING MODAL (POINT A ➔ POINT B) — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Test de positionnement initial, cartographie des compétences officielles
// et calibration dynamique du plan de travail avec Professeur Diallo.

import React, { useState } from 'react';
import { 
    Target, 
    CheckCircle2, 
    AlertTriangle, 
    Sparkles, 
    BrainCircuit, 
    ArrowRight, 
    X, 
    RotateCcw, 
    Award,
    Clock,
    Zap,
    BookOpen
} from 'lucide-react';
import { StudentPedagogicalProfile, StudentMasteryItem } from '../types';
import { campusPedagogicalEngine } from '../services/campusPedagogicalEngine';

interface CampusDiagnosticModalProps {
    profile: StudentPedagogicalProfile;
    onUpdateProfile: (updated: Partial<StudentPedagogicalProfile>) => void;
    onClose: () => void;
}

export const CampusDiagnosticModal: React.FC<CampusDiagnosticModalProps> = ({
    profile,
    onUpdateProfile,
    onClose
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'quiz' | 'plan'>('overview');
    
    // Mini Quiz de Positionnement
    const [currentQIndex, setCurrentQIndex] = useState(0);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [isQuizCompleted, setIsQuizCompleted] = useState(false);

    // Questions de diagnostic adaptées au niveau actuel
    const diagnosticQuestions = [
        {
            q: "Dans l'étude des fonctions, comment levez-vous l'indétermination de type '0/0' pour une fraction rationnelle en x = a ?",
            options: [
                "En factorisant par (x - a) au numérateur et au dénominateur puis en simplifiant",
                "En remplaçant immédiatement x par 0",
                "En appliquant une racine carrée globale",
                "En disant que la limite n'existe jamais"
            ],
            correct: 0,
            competencyCode: "MATH-SM-01",
            competencyName: "Calcul de limites et formes indéterminées"
        },
        {
            q: "Quel est le principe fondamental du Théorème des Valeurs Intermédiaires (TVI) sous condition de stricte monotonie ?",
            options: [
                "L'équation f(x) = k admet une unique solution dans l'intervalle [a, b]",
                "La fonction est obligatoirement constante",
                "La dérivée s'annule toujours en a et en b",
                "La fonction tend toujours vers +l'infini"
            ],
            correct: 0,
            competencyCode: "MATH-SM-02",
            competencyName: "Théorème des Valeurs Intermédiaires (TVI) et bijection"
        },
        {
            q: "D'après le Théorème de Bézout, deux entiers a et b sont premiers entre eux si et seulement si :",
            options: [
                "Il existe (u, v) dans Z² tels que a*u + b*v = 1",
                "Leur produit a * b est un nombre premier",
                "a divise obligatoirement b",
                "Leur somme a + b = 100"
            ],
            correct: 0,
            competencyCode: "MATH-SM-03",
            competencyName: "Arithmétique & Équations diophantiennes"
        },
        {
            q: "En mécanique newtonienne, lorsque seule la force de pesanteur s'exerce sur un projectile sans frottement, le vecteur accélération :",
            options: [
                "Est constant et égal au vecteur pesanteur g (a = g)",
                "Dépend de la masse du projectile",
                "Est nul au sommet de la trajectoire",
                "Augmente continuellement avec la vitesse"
            ],
            correct: 0,
            competencyCode: "PHYS-SM-01",
            competencyName: "Lois de Newton et balistique"
        },
        {
            q: "Pour organiser vos révisions d'examen officiel avec Professeur Diallo, quelle est la méthode la plus efficace ?",
            options: [
                "Pratiquer la répétition espacée et traiter des annales d'examens blancs chronométrées",
                "Relire passivement son cours la veille de l'épreuve",
                "Mémoriser les résultats sans comprendre la démarche",
                "Ne réviser que les matières où l'on est déjà très fort"
            ],
            correct: 0,
            competencyCode: "METH-01",
            competencyName: "Méthodologie d'Examen & Rigueur"
        }
    ];

    const handleSelectOption = (optIdx: number) => {
        setAnswers(prev => ({ ...prev, [currentQIndex]: optIdx }));
    };

    const handleNextQuestion = () => {
        if (currentQIndex < diagnosticQuestions.length - 1) {
            setCurrentQIndex(prev => prev + 1);
        } else {
            // Terminer le diagnostic et mettre à jour les compétences
            setIsQuizCompleted(true);
            let correctCount = 0;
            diagnosticQuestions.forEach((q, idx) => {
                if (answers[idx] === q.correct) correctCount++;
            });

            const newMasteredCount = Math.min(profile.totalTrackedCompetencies, Math.max(4, correctCount * 3));
            
            onUpdateProfile({
                totalMasteredCompetencies: newMasteredCount,
                activeWorkingPlan: {
                    ...profile.activeWorkingPlan,
                    todayObjectives: [
                        `Consolider : ${diagnosticQuestions[0].competencyName}`,
                        `Approfondir : ${diagnosticQuestions[2].competencyName}`,
                        `Passer 1 exercice guidé avec Professeur Diallo`
                    ]
                }
            });
            setActiveTab('plan');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-3xl w-full overflow-hidden my-8">
                
                {/* Header */}
                <div className="bg-slate-900 text-white p-6 sm:p-8 flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <BrainCircuit size={16} /> Diagnostic Initial & Cartographie Pédagogique
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black">
                            Votre Positionnement : Point A ➔ Point B
                        </h2>
                        <p className="text-xs text-slate-300 mt-1">
                            Référentiel : <span className="text-white font-bold">{profile.selectedCountryName}</span> • {profile.selectedLevelName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Fermer"
                        className="p-2.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-200 bg-slate-50 p-2 gap-2">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'overview' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Target size={14} /> Cartographie des Compétences
                    </button>
                    <button 
                        onClick={() => setActiveTab('quiz')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'quiz' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Sparkles size={14} /> Test de Diagnostic Rapide (5 min)
                    </button>
                    <button 
                        onClick={() => setActiveTab('plan')}
                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'plan' ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <Zap size={14} /> Plan d'Étude Recalibré
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8">
                    
                    {/* TAB 1: OVERVIEW */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Taux de Maîtrise Actuel</div>
                                    <div className="text-2xl font-black text-slate-900">
                                        {profile.totalMasteredCompetencies} sur {profile.totalTrackedCompetencies} Compétences
                                    </div>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Objectif : <span className="font-bold text-indigo-600">{profile.targetExamOrGoal}</span>
                                    </p>
                                </div>
                                <div className="text-center sm:text-right">
                                    <button 
                                        onClick={() => setActiveTab('quiz')}
                                        className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-md"
                                    >
                                        Lancer le Test de Diagnostic <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Liste des Compétences du Référentiel — reflète le masteryRegistry réel de l'apprenant */}
                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">État des Compétences Clés du Programme :</h4>

                                {profile.masteryRegistry.length === 0 ? (
                                    <div className="p-4 bg-slate-50 border border-dashed border-slate-300 rounded-xl text-xs text-slate-500 text-center">
                                        Aucune compétence évaluée pour le moment. Lancez le test de diagnostic ci-dessous pour démarrer votre cartographie.
                                    </div>
                                ) : profile.masteryRegistry.map((item) => {
                                    const isReinforce = item.isFragile || ['non_aborde', 'decouverte', 'en_apprentissage'].includes(item.stage);
                                    const isMastered = !isReinforce && ['maitrise', 'consolide'].includes(item.stage);
                                    const bucket = isReinforce ? 'reinforce' : isMastered ? 'mastered' : 'progress';
                                    const style = {
                                        reinforce: { wrap: 'bg-rose-50/70 border-rose-200', icon: AlertTriangle, iconColor: 'text-rose-600', text: 'text-rose-700', badgeBg: 'bg-rose-100 text-rose-800', badgeLabel: 'À renforcer' },
                                        progress: { wrap: 'bg-amber-50/70 border-amber-200', icon: Clock, iconColor: 'text-amber-600', text: 'text-amber-700', badgeBg: 'bg-amber-100 text-amber-800', badgeLabel: 'En consolidation' },
                                        mastered: { wrap: 'bg-emerald-50/70 border-emerald-200', icon: CheckCircle2, iconColor: 'text-emerald-600', text: 'text-emerald-700', badgeBg: 'bg-emerald-100 text-emerald-800', badgeLabel: 'Maîtrisée' }
                                    }[bucket];
                                    const Icon = style.icon;
                                    return (
                                        <div key={item.competencyId} className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${style.wrap}`}>
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Icon size={18} className={`${style.iconColor} shrink-0`} />
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold text-slate-900 truncate">{item.competencyTitle}</div>
                                                    <div className={`text-[10px] font-mono ${style.text}`}>{item.competencyId} • {item.subjectName} ({item.confidenceScore}%)</div>
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg shrink-0 ${style.badgeBg}`}>{style.badgeLabel}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* TAB 2: DIAGNOSTIC QUIZ */}
                    {activeTab === 'quiz' && (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>Question {currentQIndex + 1} sur {diagnosticQuestions.length}</span>
                                <span>{diagnosticQuestions[currentQIndex].competencyCode}</span>
                            </div>

                            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                                <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed mb-4">
                                    {diagnosticQuestions[currentQIndex].q}
                                </h3>

                                <div className="space-y-2.5">
                                    {diagnosticQuestions[currentQIndex].options.map((opt, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => handleSelectOption(idx)}
                                            className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs font-medium ${answers[currentQIndex] === idx ? 'border-indigo-600 bg-indigo-50 text-indigo-900 font-bold' : 'border-slate-200 hover:border-slate-300 bg-white text-slate-700'}`}
                                        >
                                            <span className="font-bold mr-2 opacity-60">{String.fromCharCode(65 + idx)}.</span>
                                            {opt}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <button 
                                    disabled={currentQIndex === 0}
                                    onClick={() => setCurrentQIndex(prev => prev - 1)}
                                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 disabled:opacity-30"
                                >
                                    Précédent
                                </button>
                                <button 
                                    disabled={answers[currentQIndex] === undefined}
                                    onClick={handleNextQuestion}
                                    className="px-6 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all disabled:opacity-40 flex items-center gap-2"
                                >
                                    {currentQIndex < diagnosticQuestions.length - 1 ? 'Question Suivante' : 'Valider le Diagnostic'} <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: PLAN D'ÉTUDE RECALIBRÉ */}
                    {activeTab === 'plan' && (
                        <div className="space-y-6 animate-fade-up">
                            <div className="p-5 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase">
                                    <Sparkles size={16} /> Bilan Réalisé par Professeur Diallo
                                </div>
                                <h3 className="text-lg font-bold">Votre Plan d'Étude Personnalisé est Prêt !</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    Vos points forts et priorités de révision ont été calibrés. Votre travail quotidien est optimisé pour maximiser votre réussite à l'épreuve officielle ({profile.targetExamOrGoal}).
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Objectifs Prioritaires Recommandés :</h4>
                                {profile.activeWorkingPlan.todayObjectives.map((obj, i) => (
                                    <div key={i} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 text-xs text-slate-800">
                                        <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                                        <span>{obj}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button 
                                    onClick={onClose}
                                    className="px-8 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-md transition-all flex items-center gap-2"
                                >
                                    Appliquer et Commencer l'Étude <CheckCircle2 size={16} />
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};
