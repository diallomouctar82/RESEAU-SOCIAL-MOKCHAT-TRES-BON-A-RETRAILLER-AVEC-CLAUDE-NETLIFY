// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 MODAL D'INSCRIPTION OFFICIELLE & PRÉSENTATION DU CURSUS — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

import React, { useState } from 'react';
import { 
    X, 
    GraduationCap, 
    BookOpen, 
    Award, 
    Clock, 
    CheckCircle2, 
    ShieldCheck, 
    UserCheck, 
    Sparkles, 
    Layers, 
    ArrowRight, 
    Check, 
    AlertCircle, 
    ChevronRight,
    Briefcase,
    Globe2,
    Calendar
} from 'lucide-react';
import { CertifyingFormation } from '../services/formationsRegistry';
import { UserProfile } from '../types';

interface CampusCourseEnrollmentModalProps {
    formation: CertifyingFormation;
    userProfile: UserProfile;
    isEnrolled: boolean;
    onClose: () => void;
    onConfirmEnrollment: (formation: CertifyingFormation, mode: 'certifying' | 'free_audit') => void;
    onOpenClassroom: (formation: CertifyingFormation) => void;
}

export const CampusCourseEnrollmentModal: React.FC<CampusCourseEnrollmentModalProps> = ({
    formation,
    userProfile,
    isEnrolled,
    onClose,
    onConfirmEnrollment,
    onOpenClassroom
}) => {
    const [activeTab, setActiveTab] = useState<'overview' | 'syllabus' | 'faculty' | 'certification'>('overview');
    const [enrollmentMode, setEnrollmentMode] = useState<'certifying' | 'free_audit'>('certifying');
    const [acceptedHonorCode, setAcceptedHonorCode] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleEnroll = () => {
        setIsSubmitting(true);
        setTimeout(() => {
            setIsSubmitting(false);
            onConfirmEnrollment(formation, enrollmentMode);
        }, 600);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up my-auto">
                
                {/* Header avec Bannière et Informations Clés */}
                <div className="relative bg-slate-950 text-white p-6 sm:p-8 overflow-hidden shrink-0">
                    <div className="absolute inset-0 opacity-20 bg-cover bg-center" style={{ backgroundImage: `url(${formation.thumbnailUrl})` }}></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-transparent"></div>
                    
                    <button 
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur"
                    >
                        <X size={18} />
                    </button>

                    <div className="relative z-10 space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                                <Award size={13} /> {formation.degreeLevel}
                            </span>
                            <span className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                                {formation.category}
                            </span>
                            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                                ⭐ {formation.rating} ({formation.reviewsCount} avis)
                            </span>
                        </div>

                        <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                            {formation.title}
                        </h1>

                        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
                            {formation.description}
                        </p>

                        <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-xs text-slate-300 border-t border-white/10">
                            <div className="flex items-center gap-1.5 font-medium">
                                <GraduationCap size={15} className="text-emerald-400" />
                                <span>{formation.institution}</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Clock size={15} className="text-amber-400" />
                                <span>{formation.duration} • {formation.totalHours}h estimées</span>
                            </div>
                            <div className="flex items-center gap-1.5 font-medium">
                                <Layers size={15} className="text-indigo-400" />
                                <span>{formation.ectsCredits} Crédits ECTS / Unités</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Barre d'Onglets de Navigation */}
                <div className="flex border-b border-slate-200 bg-slate-50 px-6 gap-2 shrink-0 overflow-x-auto">
                    {[
                        { id: 'overview', label: 'Présentation & Compétences', icon: BookOpen },
                        { id: 'syllabus', label: `Syllabus (${formation.modulesList?.length || 1} Modules)`, icon: Layers },
                        { id: 'faculty', label: 'Corps Professoral & Mentors', icon: UserCheck },
                        { id: 'certification', label: 'Modalités & Diplôme Officiel', icon: Award }
                    ].map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={`py-3.5 px-4 font-bold text-xs flex items-center gap-2 border-b-2 whitespace-nowrap transition-all ${
                                    isActive 
                                    ? 'border-indigo-600 text-indigo-700 bg-white shadow-sm' 
                                    : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-100/50'
                                }`}
                            >
                                <Icon size={15} />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Contenu Déroulant des Onglets */}
                <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6">
                    
                    {/* ONGLET 1 : PRÉSENTATION & COMPÉTENCES */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fade-in">
                            
                            {/* Objectifs Pédagogiques */}
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-3">
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                    <Sparkles size={16} className="text-amber-500" /> Objectifs d'Apprentissage & Résultats Visés
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {formation.objectives?.map((obj, i) => (
                                        <div key={i} className="flex items-start gap-2.5 text-xs text-slate-700">
                                            <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                            <span>{obj}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Débouchés Professionnels */}
                            {formation.careerOutcomes && (
                                <div className="space-y-3">
                                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                                        <Briefcase size={16} className="text-indigo-600" /> Débouchés & Postes Clés Accessibles
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                        {formation.careerOutcomes.map((career, i) => (
                                            <div key={i} className="p-3 bg-white rounded-xl border border-slate-200 text-xs font-bold text-slate-800 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span>{career}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Prérequis */}
                            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-2">
                                <h3 className="text-xs font-black text-amber-900 uppercase tracking-wider flex items-center gap-2">
                                    <AlertCircle size={15} className="text-amber-600" /> Prérequis Académiques & Techniques Recommandés
                                </h3>
                                <ul className="space-y-1.5 text-xs text-amber-800">
                                    {formation.prerequisites.map((pre, idx) => (
                                        <li key={idx} className="flex items-start gap-2">
                                            <span className="font-bold">•</span>
                                            <span>{pre}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* ONGLET 2 : SYLLABUS DÉTAILLÉ */}
                    {activeTab === 'syllabus' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                                <span>Programme académique complet découpé en modules d'apprentissage progressifs.</span>
                                <span className="font-bold text-slate-900">{formation.modulesList?.length || 0} Modules • {formation.totalHours}h</span>
                            </div>

                            {formation.modulesList?.map(mod => (
                                <div key={mod.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
                                                Module {mod.number} • {mod.estimatedHours} Heures
                                            </div>
                                            <h4 className="text-base font-black text-slate-900">{mod.title}</h4>
                                            <p className="text-xs text-slate-500 mt-1">{mod.description}</p>
                                        </div>
                                        <div className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0">
                                            {mod.lessons?.length || 0} Leçons + Quiz
                                        </div>
                                    </div>

                                    {/* Liste des leçons du module */}
                                    <div className="pt-3 border-t border-slate-100 space-y-2">
                                        {mod.lessons?.map(lesson => (
                                            <div key={lesson.id} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl text-xs">
                                                <div className="flex items-center gap-2.5 font-medium text-slate-800">
                                                    <BookOpen size={14} className="text-slate-400" />
                                                    <span>{lesson.title}</span>
                                                </div>
                                                <span className="text-[11px] text-slate-400 font-mono">{lesson.duration}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ONGLET 3 : CORPS PROFESSORAL */}
                    {activeTab === 'faculty' && (
                        <div className="space-y-4 animate-fade-in">
                            <p className="text-xs text-slate-500 mb-4">
                                Les cours et les examens sont dispensés et validés par des membres émérites de la Famille DIALLO et du corps professoral international partenaire.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {formation.instructorsList?.map(inst => (
                                    <div key={inst.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex gap-4 items-start">
                                        <img 
                                            src={inst.avatar} 
                                            alt={inst.name} 
                                            className="w-14 h-14 rounded-2xl object-cover border-2 border-white shadow-sm shrink-0" 
                                        />
                                        <div className="space-y-1">
                                            <h4 className="text-sm font-black text-slate-900">{inst.name}</h4>
                                            <div className="text-[11px] font-bold text-indigo-600 leading-tight">{inst.title}</div>
                                            <div className="text-[10px] text-slate-400">{inst.institution}</div>
                                            <p className="text-xs text-slate-600 pt-1 leading-relaxed">{inst.bio}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ONGLET 4 : MODALITÉS D'EXAMEN & DIPLÔME OFFICIEL */}
                    {activeTab === 'certification' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl space-y-4">
                                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                                    <ShieldCheck size={16} /> Examen Certifiant & Titre Homologué
                                </div>
                                <h3 className="text-xl font-black">{formation.certificationTitle}</h3>
                                <p className="text-xs text-slate-300 leading-relaxed">
                                    À l'issue des modules de cours et de la validation des mini-quiz, l'étudiant est convoqué à l'épreuve terminale certifiante chronométrée. L'obtention d'une note minimale de {formation.passingScore}/20 donne lieu à la délivrance d'un diplôme officiel sécurisé par identifiant unique et horodatage cryptographique MokTrust.
                                </p>

                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur">
                                        <div className="text-[10px] text-slate-400 uppercase">Épreuve Finale</div>
                                        <div className="font-black text-white">{formation.examDurationMinutes} Minutes</div>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur">
                                        <div className="text-[10px] text-slate-400 uppercase">Note Minimale</div>
                                        <div className="font-black text-emerald-400">{formation.passingScore}/20</div>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur">
                                        <div className="text-[10px] text-slate-400 uppercase">Mention Possible</div>
                                        <div className="font-black text-amber-300">Très Bien (≥16)</div>
                                    </div>
                                    <div className="bg-white/10 p-3 rounded-xl backdrop-blur">
                                        <div className="text-[10px] text-slate-400 uppercase">Format Diplôme</div>
                                        <div className="font-black text-white">Sécurisé & Imprimable</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Section d'Inscription & Actions Bas de Page */}
                <div className="bg-slate-50 border-t border-slate-200 p-6 shrink-0 space-y-4">
                    
                    {isEnrolled ? (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                                    <CheckCircle2 size={22} />
                                </div>
                                <div>
                                    <div className="text-xs font-black text-emerald-800 uppercase tracking-wider">Vous êtes inscrit à cette formation</div>
                                    <div className="text-xs text-slate-500">Progression : {Math.round(formation.progress || 0)}% complété</div>
                                </div>
                            </div>

                            <button
                                onClick={() => onOpenClassroom(formation)}
                                className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <BookOpen size={16} /> Continuer les Cours en Salle de Classe <ArrowRight size={14} />
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Choix de l'Option d'Inscription */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <label 
                                    onClick={() => setEnrollmentMode('certifying')}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                        enrollmentMode === 'certifying' 
                                        ? 'border-indigo-600 bg-indigo-50/50' 
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <input 
                                        type="radio" 
                                        name="enroll_mode" 
                                        checked={enrollmentMode === 'certifying'} 
                                        onChange={() => setEnrollmentMode('certifying')}
                                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                            <Award size={14} className="text-amber-500" /> Parcours Certifiant avec Examen & Diplôme
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Accès illimité aux cours, suivi personnalisé par Professeur Diallo, passage de l'examen final et délivrance du diplôme officiel.
                                        </div>
                                    </div>
                                </label>

                                <label 
                                    onClick={() => setEnrollmentMode('free_audit')}
                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3 ${
                                        enrollmentMode === 'free_audit' 
                                        ? 'border-indigo-600 bg-indigo-50/50' 
                                        : 'border-slate-200 bg-white hover:border-slate-300'
                                    }`}
                                >
                                    <input 
                                        type="radio" 
                                        name="enroll_mode" 
                                        checked={enrollmentMode === 'free_audit'} 
                                        onChange={() => setEnrollmentMode('free_audit')}
                                        className="mt-1 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <div>
                                        <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                                            <BookOpen size={14} className="text-slate-600" /> Auditeur Libre (Consultation des Cours)
                                        </div>
                                        <div className="text-[11px] text-slate-500 mt-0.5">
                                            Accès direct aux modules et leçons pour autoformation sans délivrance de diplôme officiel.
                                        </div>
                                    </div>
                                </label>
                            </div>

                            {/* Validation et Engagement */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                                <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={acceptedHonorCode}
                                        onChange={(e) => setAcceptedHonorCode(e.target.checked)}
                                        className="rounded text-indigo-600 focus:ring-indigo-500"
                                    />
                                    <span>J'atteste de mon engagement pédagogique et accepte le règlement d'examen de l'Académie.</span>
                                </label>

                                <button
                                    disabled={!acceptedHonorCode || isSubmitting}
                                    onClick={handleEnroll}
                                    className="px-8 py-3.5 bg-slate-900 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-2xl font-black text-xs transition-all shadow-lg flex items-center justify-center gap-2 shrink-0"
                                >
                                    {isSubmitting ? (
                                        <span>Inscription en cours...</span>
                                    ) : (
                                        <>
                                            <Check size={16} className="text-emerald-400" /> 
                                            <span>Confirmer mon Inscription Gratuite</span>
                                            <ArrowRight size={14} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    )}

                </div>

            </div>
        </div>
    );
};
