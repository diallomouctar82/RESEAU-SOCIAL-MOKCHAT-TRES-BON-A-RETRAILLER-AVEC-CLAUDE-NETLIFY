// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS EDUCATION MAP & CURRICULUM SELECTOR — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Permet de choisir en toute simplicité :
// Pays → Système Éducatif → Cycle → Niveau → Filière → Matière → Objectif/Examen

import React, { useState } from 'react';
import { 
    Globe, 
    BookOpen, 
    Award, 
    CheckCircle2, 
    ChevronRight, 
    Sparkles, 
    Search, 
    ArrowRight, 
    ShieldCheck, 
    Layers, 
    Sliders, 
    Book, 
    Compass,
    GraduationCap,
    Clock,
    AlertCircle
} from 'lucide-react';
import { 
    EducationalCurriculumFramework, 
    EducationalCycle, 
    EducationalLevelInfo, 
    CurriculumSubject, 
    StudentPedagogicalProfile,
    LearningStylePreference,
    PedagogyPace
} from '../types';
import { OFFICIAL_CURRICULUMS, ACADEMIC_EQUIVALENCES } from '../services/curriculumRegistry';

interface CampusEducationMapProps {
    currentProfile: StudentPedagogicalProfile;
    onApplyCurriculum: (updatedProfile: Partial<StudentPedagogicalProfile>) => void;
    onClose?: () => void;
}

export const CampusEducationMap: React.FC<CampusEducationMapProps> = ({
    currentProfile,
    onApplyCurriculum,
    onClose
}) => {
    const [selectedCountryCode, setSelectedCountryCode] = useState<string>(currentProfile.selectedCountryCode || 'GN');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCycleId, setSelectedCycleId] = useState<string>('');
    const [selectedLevelId, setSelectedLevelId] = useState<string>('');
    const [selectedStream, setSelectedStream] = useState<string>('');
    const [selectedExamGoal, setSelectedExamGoal] = useState<string>(currentProfile.targetExamOrGoal || '');
    const [selectedLearningStyle, setSelectedLearningStyle] = useState<LearningStylePreference>(currentProfile.learningStyle || 'exemples_concrets');
    const [selectedPace, setSelectedPace] = useState<PedagogyPace>(currentProfile.pace || 'standard');
    const [activeTab, setActiveTab] = useState<'picker' | 'equivalences' | 'pedagogy'>('picker');

    // Trouver le framework correspondant au pays sélectionné
    const activeFramework = OFFICIAL_CURRICULUMS.find(c => c.countryCode === selectedCountryCode) || OFFICIAL_CURRICULUMS[0];
    
    // Cycle sélectionné
    const activeCycle = activeFramework.cycles.find(c => c.id === selectedCycleId) || activeFramework.cycles[0];
    
    // Niveau sélectionné
    const activeLevel = activeCycle?.levels.find(l => l.id === selectedLevelId) || activeCycle?.levels[0];

    const handleSaveAndStart = () => {
        if (!activeLevel) return;

        onApplyCurriculum({
            selectedCountryCode: activeFramework.countryCode,
            selectedCountryName: activeFramework.countryName,
            selectedCountryFlag: activeFramework.countryFlag,
            selectedSystemId: activeFramework.id,
            selectedLevelCode: activeLevel.code,
            selectedLevelName: activeLevel.name,
            targetExamOrGoal: selectedExamGoal || activeLevel.officialExams?.[0] || 'Maîtrise complète du programme',
            learningStyle: selectedLearningStyle,
            pace: selectedPace,
            isLiteracyPathway: !!activeLevel.isLiteracyFoundation
        });

        if (onClose) onClose();
    };

    const filteredCurriculums = OFFICIAL_CURRICULUMS.filter(c => 
        c.countryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.systemName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
            {/* Header Navigation */}
            <div className="bg-slate-900 text-white p-6 md:p-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2">
                            <Globe size={16} /> Campus Mondial Multi-Programmes & Référentiels Officiels
                        </div>
                        <h2 className="text-2xl md:text-3xl font-black tracking-tight">
                            Carte Mondiale de l’Éducation & Personnalisation
                        </h2>
                        <p className="text-slate-300 text-sm mt-1">
                            Sélectionnez le pays, l'examen officiel préparé et la méthode d'enseignement qui vous correspond.
                        </p>
                    </div>

                    <div className="flex items-center bg-slate-800/80 rounded-2xl p-1 border border-slate-700">
                        <button 
                            onClick={() => setActiveTab('picker')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'picker' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            🌍 Référentiels Pays
                        </button>
                        <button 
                            onClick={() => setActiveTab('pedagogy')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'pedagogy' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            🧠 Style Pédagogique
                        </button>
                        <button 
                            onClick={() => setActiveTab('equivalences')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'equivalences' ? 'bg-emerald-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            🌉 Passerelles Mondiales
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: SÉLECTEUR DE RÉFÉRENTIELS */}
            {activeTab === 'picker' && (
                <div className="p-6 md:p-8 space-y-8">
                    {/* Étape 1 : Choix du Pays / Système */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">1</span>
                                Choisissez le Pays ou Système Éducatif de référence
                            </h3>
                            <div className="relative w-64">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input 
                                    type="text"
                                    placeholder="Rechercher un pays..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-slate-900 outline-none"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {filteredCurriculums.map((curr) => {
                                const isSelected = selectedCountryCode === curr.countryCode;
                                return (
                                    <button
                                        key={curr.countryCode}
                                        onClick={() => {
                                            setSelectedCountryCode(curr.countryCode);
                                            setSelectedCycleId('');
                                            setSelectedLevelId('');
                                        }}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all flex flex-col justify-between h-28 ${
                                            isSelected 
                                                ? 'border-emerald-600 bg-emerald-50/50 shadow-sm ring-2 ring-emerald-500/20' 
                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        <div className="text-2xl">{curr.countryFlag}</div>
                                        <div>
                                            <div className="font-bold text-slate-900 text-sm leading-tight">{curr.countryName}</div>
                                            <div className="text-[10px] text-slate-500 truncate mt-0.5">{curr.officialAuthority.split(' ')[0]}...</div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                            <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                            <span>
                                <strong>Source Officielle Vérifiée :</strong> {activeFramework.officialAuthority} (Révision des programmes : {activeFramework.lastCurriculumReviewYear})
                            </span>
                        </div>
                    </div>

                    {/* Étape 2 : Cycle & Niveau Académique */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-4">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">2</span>
                                Cycle & Niveau d’Enseignement
                            </h3>

                            <div className="space-y-3">
                                {activeFramework.cycles.map(cycle => (
                                    <div key={cycle.id} className="space-y-2">
                                        <div className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Layers size={14} /> {cycle.cycleName}
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                            {cycle.levels.map(level => {
                                                const isLvlSelected = (selectedLevelId || activeCycle?.levels[0]?.id) === level.id;
                                                return (
                                                    <button
                                                        key={level.id}
                                                        onClick={() => {
                                                            setSelectedCycleId(cycle.id);
                                                            setSelectedLevelId(level.id);
                                                            if (level.officialExams?.[0]) setSelectedExamGoal(level.officialExams[0]);
                                                        }}
                                                        className={`p-3 rounded-xl border text-left transition-all ${
                                                            isLvlSelected 
                                                                ? 'border-slate-900 bg-slate-900 text-white shadow-sm' 
                                                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                                                        }`}
                                                    >
                                                        <div className="font-bold text-xs">{level.name}</div>
                                                        <div className={`text-[10px] mt-0.5 ${isLvlSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                                                            {level.isLiteracyFoundation ? '✨ Alphabétisation & Calculs clés' : `${level.subjects.length} matières officielles`}
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Étape 3 : Matières et Examen visé */}
                        <div>
                            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2 mb-4">
                                <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs">3</span>
                                Programme & Examen Visé ({activeLevel?.name})
                            </h3>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Examen ou Concours Préparé
                                    </label>
                                    <select 
                                        value={selectedExamGoal} 
                                        onChange={(e) => setSelectedExamGoal(e.target.value)}
                                        className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-sm font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                                    >
                                        {activeLevel?.officialExams?.map(exam => (
                                            <option key={exam} value={exam}>{exam}</option>
                                        )) || <option value="Examen de passage standard">Examen de passage de niveau standard</option>}
                                        <option value="Perfectionnement & Autonomie Libre">Perfectionnement & Autonomie Libre</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                                        Matières Clés Incluses au Référentiel
                                    </label>
                                    <div className="space-y-2">
                                        {activeLevel?.subjects.map(subject => (
                                            <div key={subject.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                                                <div>
                                                    <div className="font-bold text-xs text-slate-900">{subject.name}</div>
                                                    <div className="text-[11px] text-slate-500 line-clamp-1">{subject.description}</div>
                                                </div>
                                                {subject.coefficient && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                                                        Coeff {subject.coefficient}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
                        <div className="text-xs text-slate-500">
                            🌍 <strong>Choix Libre :</strong> Votre pays physique ne vous limite pas. Vous pouvez changer de référentiel à tout moment sans perte de progression.
                        </div>
                        <button
                            onClick={handleSaveAndStart}
                            className="w-full sm:w-auto px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg"
                        >
                            Appliquer ce Programme au Campus <ArrowRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 2: PERSONNALISATION PÉDAGOGIQUE */}
            {activeTab === 'pedagogy' && (
                <div className="p-6 md:p-8 space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Comment apprenez-vous le plus efficacement ?</h3>
                        <p className="text-xs text-slate-500">Le Professeur Diallo adapte ses explications, exercices et supports à vos préférences cognitives.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { id: 'exemples_concrets', title: 'Exemples Concrets & Analogies', desc: 'Situations de la vie réelle, commerce, terrain, métaphores visuelles.', icon: '💡' },
                            { id: 'oral_audio', title: 'Explications Vocales & Audio', desc: 'Dialogues parlés, cours podcastés et répétition orale.', icon: '🎙️' },
                            { id: 'demonstration', title: 'Démonstrations Pas à Pas', desc: 'Rigueur formelle, justifications mathématiques et preuves complètes.', icon: '📐' },
                            { id: 'lecture_texte', title: 'Lecture Approfondie & Fiches', desc: 'Résumés structurés, définitions précises et synthèse markdown.', icon: '📖' },
                            { id: 'exercices_pratiques', title: 'Exercices & Mise en Situation', desc: 'Pratique intensive immédiate avec correction adaptative.', icon: '✍️' },
                            { id: 'conversation_coach', title: 'Dialogue Interactif avec Professeur Diallo', desc: 'Questions-réponses dynamiques et orientation bienveillante.', icon: '👨‍🏫' },
                        ].map(style => (
                            <button
                                key={style.id}
                                onClick={() => setSelectedLearningStyle(style.id as LearningStylePreference)}
                                className={`p-5 rounded-2xl border-2 text-left transition-all ${
                                    selectedLearningStyle === style.id 
                                        ? 'border-emerald-600 bg-emerald-50/50 shadow-sm' 
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <div className="text-2xl mb-2">{style.icon}</div>
                                <div className="font-bold text-slate-900 text-sm">{style.title}</div>
                                <div className="text-xs text-slate-500 mt-1">{style.desc}</div>
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex justify-end">
                        <button
                            onClick={handleSaveAndStart}
                            className="px-8 py-3.5 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2 shadow-lg text-sm"
                        >
                            Enregistrer mes Préférences Pédagogiques <CheckCircle2 size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* TAB 3: PASSERELLES ET ÉQUIVALENCES MONDIALES */}
            {activeTab === 'equivalences' && (
                <div className="p-6 md:p-8 space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-900 mb-1">Moteur d’Équivalences & Passerelles Internationales</h3>
                        <p className="text-xs text-slate-500">
                            Comparez deux systèmes éducatifs pour préparer une poursuite d'études ou une expatriation académique.
                        </p>
                    </div>

                    <div className="space-y-4">
                        {ACADEMIC_EQUIVALENCES.map((equiv, idx) => (
                            <div key={idx} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-bold text-slate-900 text-sm">{equiv.originCountry} ({equiv.originLevel})</span>
                                        <ArrowRight size={16} className="text-slate-400" />
                                        <span className="font-bold text-indigo-900 text-sm">{equiv.targetCountry} ({equiv.targetLevel})</span>
                                    </div>
                                    <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                                        {equiv.directEquivalenceTitle}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                        <div className="font-bold text-emerald-700 mb-1.5 flex items-center gap-1.5">
                                            <CheckCircle2 size={14} /> Socle Commun Acquis
                                        </div>
                                        <ul className="list-disc list-inside text-slate-600 space-y-1">
                                            {equiv.commonFoundations.map((c, i) => <li key={i}>{c}</li>)}
                                        </ul>
                                    </div>

                                    <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                                        <div className="font-bold text-amber-700 mb-1.5 flex items-center gap-1.5">
                                            <AlertCircle size={14} /> Passerelles Recommandées
                                        </div>
                                        <ul className="list-disc list-inside text-slate-600 space-y-1">
                                            {equiv.recommendedBridgePath.map((p, i) => <li key={i}>{p}</li>)}
                                        </ul>
                                    </div>
                                </div>

                                <div className="text-[11px] text-slate-400 italic">
                                    Source : {equiv.officialSourceNote}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
