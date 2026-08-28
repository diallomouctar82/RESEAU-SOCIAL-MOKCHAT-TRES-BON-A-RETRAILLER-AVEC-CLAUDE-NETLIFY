// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎓 CAMPUS EQUIVALENCE & GLOBAL BRIDGES COMPARATOR — LE MONDE À VOUS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Comparateur officiel de diplômes, conversion de notes et passerelles
// pour la mobilité internationale (Guinée, Sénégal, Côte d'Ivoire, France, USA, UK, Canada).

import React, { useState } from 'react';
import { 
    Globe, 
    ArrowRightLeft, 
    CheckCircle2, 
    AlertCircle, 
    BookOpen, 
    Award, 
    Sparkles, 
    School, 
    GraduationCap, 
    ChevronRight,
    ArrowRight
} from 'lucide-react';
import { AcademicEquivalenceComparison } from '../types';
import { ACADEMIC_EQUIVALENCES, OFFICIAL_CURRICULUMS } from '../services/curriculumRegistry';

interface CampusEquivalenceComparatorProps {
    onClose?: () => void;
    onSelectBridgePath?: (path: string) => void;
}

export const CampusEquivalenceComparator: React.FC<CampusEquivalenceComparatorProps> = ({
    onClose,
    onSelectBridgePath
}) => {
    const [selectedEquivalenceId, setSelectedEquivalenceId] = useState<string>(ACADEMIC_EQUIVALENCES[0]?.id || '');
    const [filterOrigin, setFilterOrigin] = useState<string>('ALL');

    const activeEquiv = ACADEMIC_EQUIVALENCES.find(e => e.id === selectedEquivalenceId) || ACADEMIC_EQUIVALENCES[0];

    const filteredEquivalences = filterOrigin === 'ALL' 
        ? ACADEMIC_EQUIVALENCES 
        : ACADEMIC_EQUIVALENCES.filter(e => e.sourceCountryCode === filterOrigin);

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden space-y-6">
            
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 sm:p-8">
                <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-2">
                    <Globe size={16} /> Mobilité Internationale & Reconnaissance Officielle
                </div>
                <h2 className="text-2xl sm:text-3xl font-black">
                    Passerelles & Équivalences Académiques Mondiales
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                    Comparez officiellement les diplômes de votre pays d'origine avec les standards internationaux (France, USA, UK, Sénégal, Guinée, Canada) et préparez les cours de mise à niveau avec Professeur Diallo.
                </p>
            </div>

            <div className="p-6 sm:p-8 space-y-6">
                
                {/* Filtres Rapides de Pays d'Origine */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                    <span className="text-xs font-bold text-slate-500 mr-2">Origine :</span>
                    <button
                        onClick={() => setFilterOrigin('ALL')}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filterOrigin === 'ALL' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                    >
                        Tous les pays
                    </button>
                    {['GN', 'SN', 'CI', 'FR', 'US', 'GB'].map(code => (
                        <button
                            key={code}
                            onClick={() => setFilterOrigin(code)}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${filterOrigin === code ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                        >
                            {code === 'GN' ? '🇬🇳 Guinée' : code === 'SN' ? '🇸🇳 Sénégal' : code === 'CI' ? '🇨🇮 Côte d\'Ivoire' : code === 'FR' ? '🇫🇷 France' : code === 'US' ? '🇺🇸 États-Unis' : '🇬🇧 UK'}
                        </button>
                    ))}
                </div>

                {/* Grille des Équivalences Disponibles */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {filteredEquivalences.map(eq => (
                        <div
                            key={eq.id}
                            onClick={() => setSelectedEquivalenceId(eq.id)}
                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${selectedEquivalenceId === eq.id ? 'border-indigo-600 bg-indigo-50/50 shadow-md' : 'border-slate-200 hover:border-slate-300 bg-slate-50'}`}
                        >
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-2">
                                <span>{eq.sourceCountryName}</span>
                                <ArrowRightLeft size={14} className="text-indigo-600" />
                                <span>{eq.targetCountryName}</span>
                            </div>
                            <h4 className="text-xs font-black text-slate-900 line-clamp-1 mb-1">{eq.sourceLevelName}</h4>
                            <p className="text-[11px] text-slate-600 line-clamp-1">➔ {eq.targetLevelName}</p>
                        </div>
                    ))}
                </div>

                {/* Détail de l'Équivalence Sélectionnée */}
                {activeEquiv && (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-up">
                        
                        {/* Titre & Statut */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                            <div>
                                <div className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-1">
                                    Correspondance Officielle
                                </div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {activeEquiv.sourceLevelName} ({activeEquiv.sourceCountryName}) ➔ {activeEquiv.targetLevelName} ({activeEquiv.targetCountryName})
                                </h3>
                            </div>
                            <div className="px-3.5 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-1.5 self-start">
                                <CheckCircle2 size={16} /> Équivalence Reconnue
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Matières Communes & Points Forts */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                    Matières Communes & Compétences Directes
                                </h4>
                                <ul className="space-y-2">
                                    {activeEquiv.sharedCompetenciesAndTopics.map((item, i) => (
                                        <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                            <span className="text-emerald-500 font-bold">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Écarts, Spécificités & Compléments */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                                <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                    <AlertCircle size={16} className="text-amber-500" />
                                    Spécificités & Différences d'Évaluation
                                </h4>
                                <ul className="space-y-2">
                                    {activeEquiv.divergentTopicsOrAdditions.map((item, i) => (
                                        <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                                            <span className="text-amber-500 font-bold">•</span>
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                        </div>

                        {/* Plan de Passerelle Recommandé */}
                        <div className="bg-indigo-900 text-white p-6 rounded-2xl space-y-4">
                            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
                                <Sparkles size={16} /> Plan de Passerelle & Coaching avec Professeur Diallo
                            </div>
                            <div className="space-y-2">
                                {activeEquiv.recommendedBridgePath.map((step, idx) => (
                                    <div key={idx} className="flex items-center gap-3 text-xs text-slate-200">
                                        <div className="w-5 h-5 rounded-full bg-indigo-700 text-amber-300 flex items-center justify-center font-bold text-[10px]">
                                            {idx + 1}
                                        </div>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-2 text-[11px] text-slate-300 italic border-t border-indigo-800">
                                Source légale : {activeEquiv.officialSourceNote}
                            </div>
                        </div>

                        {/* Tableau de Conversion des Notes */}
                        <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
                            <h4 className="font-bold text-xs text-slate-900 flex items-center gap-2">
                                <Award size={16} className="text-indigo-600" />
                                Grille de Conversion des Notes & Mentions
                            </h4>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
                                <div className="p-3 bg-slate-50 rounded-xl border">
                                    <div className="font-black text-slate-900 text-sm">16 - 20 / 20</div>
                                    <div className="text-[10px] text-emerald-600 font-bold">Mention Très Bien</div>
                                    <div className="text-[10px] text-slate-500">Grade A+ • GPA 4.0</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border">
                                    <div className="font-black text-slate-900 text-sm">14 - 15.9 / 20</div>
                                    <div className="text-[10px] text-indigo-600 font-bold">Mention Bien</div>
                                    <div className="text-[10px] text-slate-500">Grade A • GPA 3.5 - 3.7</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border">
                                    <div className="font-black text-slate-900 text-sm">12 - 13.9 / 20</div>
                                    <div className="text-[10px] text-amber-600 font-bold">Mention Assez Bien</div>
                                    <div className="text-[10px] text-slate-500">Grade B • GPA 3.0</div>
                                </div>
                                <div className="p-3 bg-slate-50 rounded-xl border">
                                    <div className="font-black text-slate-900 text-sm">10 - 11.9 / 20</div>
                                    <div className="text-[10px] text-slate-600 font-bold">Passable (Admis)</div>
                                    <div className="text-[10px] text-slate-500">Grade C • GPA 2.0 - 2.5</div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

            </div>
        </div>
    );
};
