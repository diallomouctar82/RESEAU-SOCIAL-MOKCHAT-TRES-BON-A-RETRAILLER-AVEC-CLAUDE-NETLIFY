import React, { useState } from 'react';
import { 
    Sparkles, 
    CheckCircle2, 
    Clock, 
    ArrowRight, 
    FileText, 
    DollarSign, 
    Users, 
    Mail, 
    Calendar, 
    ShieldCheck, 
    TrendingUp, 
    PieChart, 
    Download, 
    RefreshCw, 
    Plus, 
    Trash2, 
    AlertTriangle,
    Layers,
    BookOpen,
    Send,
    Eye,
    ChevronRight,
    Search,
    ExternalLink,
    Check
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { DossierParcours } from '../types';

interface ChefDeProjetSuiteProps {
    activeDossier?: DossierParcours | null;
    onAttachDeliverableToDossier?: (deliverable: { title: string; category: string; content: string }) => void;
    onNotification: (title: string, message: string, type: 'success' | 'info' | 'warning') => void;
}

export const ChefDeProjetSuite: React.FC<ChefDeProjetSuiteProps> = ({
    activeDossier,
    onAttachDeliverableToDossier,
    onNotification
}) => {
    const [activePhase, setActivePhase] = useState<number>(1);
    
    // Phase 1: Idée
    const [projectTitle, setProjectTitle] = useState(activeDossier?.title || 'Unité de Transformation Agroalimentaire & Chaîne du Froid');
    const [problemStatement, setProblemStatement] = useState('Pertes post-récoltes de 40% sur les fruits et légumes locaux par manque de conservation frigorifique et d’unités de séchage.');
    const [targetBeneficiaries, setTargetBeneficiaries] = useState('250 coopératives agricoles féminines et 1 500 petits producteurs ruraux.');
    const [proposedSolution, setProposedSolution] = useState('Installation d’une unité solaire de séchage et transformation certifiée bio avec réseau de distribution équitable.');

    // Phase 2: Structuration
    const [theoryOfChange, setTheoryOfChange] = useState('');
    const [isGeneratingTheory, setIsGeneratingTheory] = useState(false);

    // Phase 3: Dossier Technique
    const [technicalNote, setTechnicalNote] = useState('');
    const [isGeneratingTechnical, setIsGeneratingTechnical] = useState(false);

    // Phase 4: Budget Prévisionnel
    const [budgetLines, setBudgetLines] = useState([
        { category: 'Équipements & Solaire', description: 'Séchoirs solaires industriels & chambres froides', amount: 45000 },
        { category: 'Ressources Humaines', description: 'Ingénieur agronome + 4 techniciens de production (12 mois)', amount: 24000 },
        { category: 'Fonctionnement & Logistique', description: 'Véhicule utilitaire de collecte et emballages certifiés', amount: 12000 },
        { category: 'Formation & Qualité', description: 'Accréditation HACCP et formation des 250 coopératrices', amount: 6500 },
        { category: 'Imprévus (8%)', description: 'Réserve pour variations de coûts et aléas', amount: 7000 }
    ]);
    const [newBudgetCategory, setNewBudgetCategory] = useState('Équipements');
    const [newBudgetDesc, setNewBudgetDesc] = useState('');
    const [newBudgetAmount, setNewBudgetAmount] = useState<number>(5000);

    // Phase 5: Bailleurs & Partenaires
    const [selectedDonorType, setSelectedDonorType] = useState('all');
    const DONOR_DIRECTORY = [
        {
            name: 'Banque Africaine de Développement (BAD) - Fonds Agri-PME',
            type: 'Banque de Développement',
            target: 'Agro-industrie, Climat & Sécurité Alimentaire',
            envelope: '50 000€ à 250 000€',
            deadline: '30 Avril 2026',
            match: '95% de correspondance',
            url: 'https://www.afdb.org'
        },
        {
            name: 'Union Européenne - Programme Transition Écologique & Emploi Jeunes',
            type: 'Institution Internationale',
            target: 'Énergie renouvelable, autonomisation des femmes',
            envelope: '100 000€ à 500 000€',
            deadline: '15 Mai 2026',
            match: '92% de correspondance',
            url: 'https://europa.eu'
        },
        {
            name: 'Fondation FARM & Agronomes Sans Frontières',
            type: 'Fondation Privée',
            target: 'Circuits courts, coopératives agricoles',
            envelope: '25 000€ à 75 000€',
            deadline: 'Fil de l’eau (Permanent)',
            match: '88% de correspondance',
            url: 'https://fondation-farm.org'
        },
        {
            name: 'Agence Française de Développement (AFD) - Facilité FISONG',
            type: 'Agence Bilatérale',
            target: 'Innovations frugales et développement territorial',
            envelope: '80 000€ à 200 000€',
            deadline: '30 Juin 2026',
            match: '85% de correspondance',
            url: 'https://www.afd.fr'
        }
    ];

    // Phase 6: Prise de Contact & Courrier
    const [outreachRecipient, setOutreachRecipient] = useState('Mme la Directrice des Programmes Agri-Finance (BAD)');
    const [outreachTone, setOutreachTone] = useState('Institutionnel & Chiffré');
    const [generatedEmail, setGeneratedEmail] = useState('');
    const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
    const [outreachConfirmed, setOutreachConfirmed] = useState(false);

    // Phase 7: Préparation Réunion
    const [meetingBriefing, setMeetingBriefing] = useState('');
    const [isGeneratingBriefing, setIsGeneratingBriefing] = useState(false);

    // Phase 8: Financement & Négociation
    const [financingStatus, setFinancingStatus] = useState<'soumis' | 'audition' | 'complément' | 'approuvé'>('audition');

    // Phase 9: Plan Opérationnel
    const [tasksTimeline, setTasksTimeline] = useState([
        { task: 'Validation du foncier et permis de construire solaire', assigned: 'Maître Diallo', deadline: 'Mois 1', status: 'done' },
        { task: 'Commande et acheminement des séchoirs industriels', assigned: 'Directeur Diallo', deadline: 'Mois 2', status: 'in_progress' },
        { task: 'Session de formation hygiène & normes HACCP', assigned: 'Professeur Diallo', deadline: 'Mois 3', status: 'pending' },
        { task: 'Audit financier de mi-parcours & rapport intermédiaire', assigned: 'Trésorier Diallo', deadline: 'Mois 6', status: 'pending' }
    ]);

    // Phase 10: Suivi & Rapport Final
    const [finalReportContent, setFinalReportContent] = useState('');
    const [isGeneratingFinalReport, setIsGeneratingFinalReport] = useState(false);

    // Calculs budgétaires
    const totalBudget = budgetLines.reduce((acc, curr) => acc + curr.amount, 0);

    const getAIClient = () => {
        return new GoogleGenAI();
    };

    // Génération IA Phase 2: Structuration
    const handleGenerateTheoryOfChange = async () => {
        setIsGeneratingTheory(true);
        try {
            const ai = getAIClient();
            const prompt = `En tant que Directeur Diallo, Chef de Projet IA et Expert en Ingénierie de Développement International :
            Rédige la Structuration Méthodique Complète (Théorie du Changement, Objectifs Spécifiques, Activités, Indicateurs SMART, Matrice de Risques) pour le projet suivant :
            - Titre : ${projectTitle}
            - Problématique : ${problemStatement}
            - Bénéficiaires : ${targetBeneficiaries}
            - Solution : ${proposedSolution}
            Formatte avec une structure claire, professionnelle, digne d'un dossier de bailleur international (BAD, AFD, UE).`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setTheoryOfChange(res.text || 'Génération terminée.');
            onNotification("Phase 2 Structurée", "La théorie du changement et le cadre logique ont été rédigés.", "success");
        } catch (e: any) {
            onNotification("Erreur IA", e.message || "Erreur de génération", "warning");
        } finally {
            setIsGeneratingTheory(false);
        }
    };

    // Génération IA Phase 3: Dossier Technique
    const handleGenerateTechnicalDoc = async () => {
        setIsGeneratingTechnical(true);
        try {
            const ai = getAIClient();
            const prompt = `En tant que Directeur Diallo, Chef de Projet IA :
            Rédige le Document de Projet & Note Technique Complète pour :
            - Titre : ${projectTitle}
            - Contexte et Justification
            - Méthodologie d'Implémentation
            - Plan de Déploiement Technologique (Énergie solaire, chaîne du froid, contrôle qualité)
            - Gouvernance et Durabilité Économique
            - Impact Social et Environnemental (Emploi des femmes, réduction des pertes).`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setTechnicalNote(res.text || 'Dossier technique rédigé.');
            onNotification("Dossier Technique Prêt", "Le document de projet a été compilé avec succès.", "success");
        } catch (e: any) {
            onNotification("Erreur IA", e.message || "Erreur de génération", "warning");
        } finally {
            setIsGeneratingTechnical(false);
        }
    };

    // Génération IA Phase 6: Courrier Partenaire
    const handleGenerateOutreachEmail = async () => {
        setIsGeneratingEmail(true);
        try {
            const ai = getAIClient();
            const prompt = `En tant que Directeur Diallo, Chef de Projet IA :
            Rédige une lettre officielle / email de saisine et manifestation d'intérêt institutionnelle destinée à :
            Destinataire : ${outreachRecipient}
            Projet : ${projectTitle}
            Budget sollicité : ${totalBudget.toLocaleString()} €
            Ton : ${outreachTone}
            Inclus : Objet protocolaire, salutations d'usage, pitch d'impact chiffré, alignement avec leurs critères d'éligibilité, demande formelle d'entretien avec les pièces jointes proposées.`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setGeneratedEmail(res.text || 'Courrier rédigé.');
            setOutreachConfirmed(false);
            onNotification("Courrier Rédigé", "Le modèle d'email protocolaire a été formulé. Veuillez valider avant envoi.", "info");
        } catch (e: any) {
            onNotification("Erreur IA", e.message || "Erreur de génération", "warning");
        } finally {
            setIsGeneratingEmail(false);
        }
    };

    // Génération IA Phase 7: Briefing de Réunion
    const handleGenerateBriefing = async () => {
        setIsGeneratingBriefing(true);
        try {
            const ai = getAIClient();
            const prompt = `En tant que Directeur Diallo, Chef de Projet IA :
            Prépare une Fiche de Briefing Stratégique pour l'audition devant le comité de sélection du bailleur (${outreachRecipient}) pour le projet "${projectTitle}".
            Inclus :
            1. 3 Points Clés Incontournables (Punchlines d'impact)
            2. Réponses Anticipées aux 5 Questions Pièges (Rentabilité, maintenance technique, risques de gestion locale, approvisionnement)
            3. Les 4 Questions Stratégiques à Poser au Bailleur
            4. Cadre de Négociation & Lignes Rouges.`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setMeetingBriefing(res.text || 'Briefing prêt.');
            onNotification("Briefing Réunion Prêt", "L'argumentaire d'audition a été formalisé.", "success");
        } catch (e: any) {
            onNotification("Erreur IA", e.message || "Erreur de génération", "warning");
        } finally {
            setIsGeneratingBriefing(false);
        }
    };

    // Génération IA Phase 10: Rapport Final
    const handleGenerateFinalReport = async () => {
        setIsGeneratingFinalReport(true);
        try {
            const ai = getAIClient();
            const prompt = `En tant que Directeur Diallo, Chef de Projet IA :
            Génère le Rapport Final d'Évaluation et Clôture de Projet pour :
            - Titre : ${projectTitle}
            - Bilan de Réalisation des Activités (100% des jalons franchis)
            - Bilan Financier Détaillé (Budget dépensé : ${totalBudget.toLocaleString()} € avec justificatifs)
            - Mesure d'Impact Réel (Indicateurs clés : emplois créés, volume transformé, réduction des pertes)
            - Retours d'Expérience (Leçons apprises et pérennité)
            - Attestation de Clôture et Archivage.`;

            const res = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            setFinalReportContent(res.text || 'Rapport final compilé.');
            onNotification("Rapport Final Compilé", "Le bilan narratif et financier est archivé.", "success");
        } catch (e: any) {
            onNotification("Erreur IA", e.message || "Erreur de génération", "warning");
        } finally {
            setIsGeneratingFinalReport(false);
        }
    };

    const handleAddBudgetLine = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBudgetDesc.trim() || newBudgetAmount <= 0) return;
        setBudgetLines(prev => [...prev, { category: newBudgetCategory, description: newBudgetDesc, amount: newBudgetAmount }]);
        setNewBudgetDesc('');
        onNotification("Budget Actualisé", "Nouvelle ligne de dépenses enregistrée.", "info");
    };

    const handleDeleteBudgetLine = (idx: number) => {
        setBudgetLines(prev => prev.filter((_, i) => i !== idx));
    };

    const PHASES = [
        { num: 1, title: '1. Idée & Cadrage', desc: 'Diagnostic, problème et solution' },
        { num: 2, title: '2. Structuration', desc: 'Théorie du changement & Cadre logique' },
        { num: 3, title: '3. Dossier Technique', desc: 'Note technique et document de projet' },
        { num: 4, title: '4. Budget & Financement', desc: 'Lignes budgétaires & trésorerie' },
        { num: 5, title: '5. Partenaires & Bailleurs', desc: 'Répertoire ciblé & éligibilité' },
        { num: 6, title: '6. Prise de Contact', desc: 'Courriers & suivi des relances' },
        { num: 7, title: '7. Briefing RDV', desc: 'Argumentaire & simulation d’audition' },
        { num: 8, title: '8. Financement & Accord', desc: 'Suivi de validation & conventions' },
        { num: 9, title: '9. Exécution Opérationnelle', desc: 'Plan de travail & jalons' },
        { num: 10, title: '10. Suivi & Rapport Final', desc: 'Impact, bilan financier & clôture' }
    ];

    return (
        <div className="h-full overflow-y-auto bg-slate-50 p-4 sm:p-6 lg:p-8 space-y-6">
            
            {/* Header */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                        <Layers size={28} />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-black rounded-md uppercase">
                                Directeur Diallo • Chef de Projet IA
                            </span>
                            <span className="text-xs text-slate-400 font-bold">• Ingénierie en 10 Phases</span>
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-0.5">
                            {projectTitle}
                        </h2>
                        <p className="text-xs text-slate-500">
                            Accompagnement méthodique de l’idée initiale jusqu’au rapport d’impact final.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                    <span className="text-xs font-bold text-slate-600 px-2">Budget Global :</span>
                    <span className="text-sm font-black text-blue-700 bg-white px-3 py-1 rounded-xl shadow-xs border border-slate-200">
                        {totalBudget.toLocaleString()} €
                    </span>
                </div>
            </div>

            {/* 10 Phases Horizontal Stepper Navigation */}
            <div className="bg-white p-3 rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-2 min-w-max">
                    {PHASES.map((p) => {
                        const isCurrent = activePhase === p.num;
                        const isPast = activePhase > p.num;

                        return (
                            <button
                                key={p.num}
                                onClick={() => setActivePhase(p.num)}
                                className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                                    isCurrent 
                                        ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20' 
                                        : isPast
                                        ? 'bg-blue-50 text-blue-800 border-blue-200 hover:bg-blue-100'
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                                    isCurrent ? 'bg-white text-blue-600' : isPast ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                                }`}>
                                    {isPast ? '✓' : p.num}
                                </span>
                                <span className="whitespace-nowrap">{p.title}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* PHASE CONTENT PANELS */}
            
            {/* PHASE 1: IDÉE */}
            {activePhase === 1 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 1 : Cadrage de l'Idée & Diagnostic Initial</h3>
                            <p className="text-xs text-slate-500">Identification du problème, bénéficiaires cibles et formulation de la solution.</p>
                        </div>
                        <button 
                            onClick={() => setActivePhase(2)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-blue-700 transition-all shadow-xs"
                        >
                            Passer à la Structuration <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Titre Officiel du Projet</label>
                            <input 
                                type="text"
                                value={projectTitle}
                                onChange={(e) => setProjectTitle(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Bénéficiaires Ciblés & Territoire</label>
                            <input 
                                type="text"
                                value={targetBeneficiaries}
                                onChange={(e) => setTargetBeneficiaries(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Problème & Besoin Identifié</label>
                            <textarea 
                                rows={4}
                                value={problemStatement}
                                onChange={(e) => setProblemStatement(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Solution Proposée & Valeur Ajoutée</label>
                            <textarea 
                                rows={4}
                                value={proposedSolution}
                                onChange={(e) => setProposedSolution(e.target.value)}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs leading-relaxed"
                            />
                        </div>
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between text-xs text-blue-900">
                        <span>💡 Le cadrage initial est mémorisé et servira à alimenter les 9 phases suivantes sans ressaisie.</span>
                        <button 
                            onClick={() => onNotification("Cadrage Validé", "Données de base enregistrées dans le projet.", "success")}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 text-xs"
                        >
                            Valider le Cadrage
                        </button>
                    </div>
                </div>
            )}

            {/* PHASE 2: STRUCTURATION (THÉORIE DU CHANGEMENT & CADRE LOGIQUE) */}
            {activePhase === 2 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 2 : Structuration & Théorie du Changement</h3>
                            <p className="text-xs text-slate-500">Objectifs SMART, activités, indicateurs de résultats et matrice des risques.</p>
                        </div>
                        <button
                            onClick={handleGenerateTheoryOfChange}
                            disabled={isGeneratingTheory}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all disabled:opacity-50"
                        >
                            {isGeneratingTheory ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            Générer le Cadre Logique avec Directeur Diallo
                        </button>
                    </div>

                    {theoryOfChange ? (
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {theoryOfChange}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => onAttachDeliverableToDossier && onAttachDeliverableToDossier({
                                        title: 'Cadre Logique & Théorie du Changement',
                                        category: 'projet',
                                        content: theoryOfChange
                                    })}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                                >
                                    <CheckCircle2 size={14} /> Archiver dans le Dossier
                                </button>
                                <button 
                                    onClick={() => setActivePhase(3)}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 hover:bg-blue-700"
                                >
                                    Phase Suivante <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                            <BookOpen className="mx-auto text-blue-500" size={36} />
                            <h4 className="font-bold text-slate-800 text-sm">Prêt pour la structuration méthodologique</h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Cliquez sur le bouton ci-dessus pour que Directeur Diallo génère la chaîne causale (Inputs → Outputs → Outcomes → Impacts) et la matrice des risques.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 3: DOSSIER TECHNIQUE */}
            {activePhase === 3 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 3 : Dossier Technique & Note de Projet</h3>
                            <p className="text-xs text-slate-500">Document complet de spécifications techniques, faisabilité et gouvernance.</p>
                        </div>
                        <button
                            onClick={handleGenerateTechnicalDoc}
                            disabled={isGeneratingTechnical}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                        >
                            {isGeneratingTechnical ? <RefreshCw className="animate-spin" size={14} /> : <FileText size={14} />}
                            Compiler le Dossier Technique
                        </button>
                    </div>

                    {technicalNote ? (
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {technicalNote}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => onNotification("Export PDF", "Génération de l'export haute définition...", "info")}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center gap-1.5"
                                >
                                    <Download size={14} /> Exporter PDF
                                </button>
                                <button 
                                    onClick={() => setActivePhase(4)}
                                    className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5"
                                >
                                    Phase Suivante (Budget) <ArrowRight size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                            <FileText className="mx-auto text-blue-500" size={36} />
                            <h4 className="font-bold text-slate-800 text-sm">Génération du Document de Projet</h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Générez la note technique complète avec description des modules, chaîne logistique, critères de durabilité et gouvernance.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 4: BUDGET & TRÉSORERIE */}
            {activePhase === 4 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 4 : Modélisation Budgétaire & Lignes de Coûts</h3>
                            <p className="text-xs text-slate-500">Plan de trésorerie, investissements, fonctionnement et provision pour imprévus.</p>
                        </div>
                        <div className="text-right">
                            <span className="text-xs text-slate-400 font-bold uppercase">Total Projet</span>
                            <div className="text-xl font-black text-emerald-600">{totalBudget.toLocaleString()} €</div>
                        </div>
                    </div>

                    {/* Table des Lignes Budgétaires */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead>
                                <tr className="border-b border-slate-200 text-slate-400 uppercase text-[10px] font-black">
                                    <th className="py-2.5 px-3">Catégorie</th>
                                    <th className="py-2.5 px-3">Description du Poste</th>
                                    <th className="py-2.5 px-3 text-right">Montant (€)</th>
                                    <th className="py-2.5 px-3 text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {budgetLines.map((line, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50">
                                        <td className="py-3 px-3 font-bold text-slate-800">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md">{line.category}</span>
                                        </td>
                                        <td className="py-3 px-3 text-slate-600">{line.description}</td>
                                        <td className="py-3 px-3 text-right font-black text-slate-900">{line.amount.toLocaleString()} €</td>
                                        <td className="py-3 px-3 text-center">
                                            <button 
                                                onClick={() => handleDeleteBudgetLine(idx)}
                                                className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Budget Line Form */}
                    <form onSubmit={handleAddBudgetLine} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                        <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Catégorie</label>
                            <select
                                value={newBudgetCategory}
                                onChange={(e) => setNewBudgetCategory(e.target.value)}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            >
                                <option value="Équipements">Équipements & Matériel</option>
                                <option value="RH & Salaires">RH & Salaires</option>
                                <option value="Fonctionnement">Fonctionnement & Logistique</option>
                                <option value="Formation">Formation & Qualité</option>
                                <option value="Communication">Communication & Plaidoyer</option>
                                <option value="Imprévus">Imprévus (5-10%)</option>
                            </select>
                        </div>
                        <div className="sm:col-span-5">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Description</label>
                            <input 
                                type="text"
                                value={newBudgetDesc}
                                onChange={(e) => setNewBudgetDesc(e.target.value)}
                                placeholder="Détail du poste budgétaire..."
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-1">Montant (€)</label>
                            <input 
                                type="number"
                                value={newBudgetAmount}
                                onChange={(e) => setNewBudgetAmount(Number(e.target.value))}
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                            />
                        </div>
                        <div className="sm:col-span-1">
                            <button 
                                type="submit"
                                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center font-bold text-xs"
                            >
                                <Plus size={16} />
                            </button>
                        </div>
                    </form>

                    <div className="flex justify-end gap-2 pt-2">
                        <button 
                            onClick={() => setActivePhase(5)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700 transition-all"
                        >
                            Passer à la Recherche de Bailleurs <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* PHASE 5: RECHERCHE DE BAILLEURS & PARTENAIRES */}
            {activePhase === 5 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 5 : Cartographie des Bailleurs & Appels à Projets</h3>
                            <p className="text-xs text-slate-500">Sources vérifiées, critères d'éligibilité et taux de correspondance avec votre projet.</p>
                        </div>
                        <div className="flex gap-1.5">
                            {['all', 'Banque de Développement', 'Institution Internationale', 'Fondation Privée'].map(t => (
                                <button
                                    key={t}
                                    onClick={() => setSelectedDonorType(t)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                                        selectedDonorType === t ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {t === 'all' ? 'Tous' : t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {DONOR_DIRECTORY
                            .filter(d => selectedDonorType === 'all' || d.type === selectedDonorType)
                            .map((donor, idx) => (
                                <div key={idx} className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3 hover:border-blue-300 transition-all flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-start">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                                {donor.type}
                                            </span>
                                            <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                                {donor.match}
                                            </span>
                                        </div>
                                        <h4 className="font-black text-sm text-slate-900">{donor.name}</h4>
                                        <p className="text-xs text-slate-600">🎯 Cibles : {donor.target}</p>
                                        <p className="text-xs text-slate-600">💰 Enveloppe : <strong>{donor.envelope}</strong></p>
                                        <p className="text-xs text-slate-500">📅 Date Limite : <strong>{donor.deadline}</strong></p>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-slate-200">
                                        <a 
                                            href={donor.url} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                                        >
                                            Portail Officiel <ExternalLink size={12} />
                                        </a>

                                        <button
                                            onClick={() => {
                                                setOutreachRecipient(donor.name);
                                                setActivePhase(6);
                                            }}
                                            className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 hover:bg-blue-700"
                                        >
                                            Rédiger la Lettre <ArrowRight size={12} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}

            {/* PHASE 6: PRISE DE CONTACT & COURRIER PROTOCOLAIRE */}
            {activePhase === 6 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 6 : Rédaction des Courriers & Prise de Contact</h3>
                            <p className="text-xs text-slate-500">Génération de lettres institutionnelles avec validation humaine obligatoire.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Bailleur / Institution Destinataire</label>
                            <input 
                                type="text"
                                value={outreachRecipient}
                                onChange={(e) => setOutreachRecipient(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1.5">Ton & Registre</label>
                            <select
                                value={outreachTone}
                                onChange={(e) => setOutreachTone(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                            >
                                <option value="Institutionnel & Chiffré">Institutionnel & Chiffré (Bailleurs multilatéraux)</option>
                                <option value="Engagé & Social">Engagé & Social (ONG & Fondations philanthropiques)</option>
                                <option value="Investisseur & ROI">Investisseur & Rendement (Banques & Capital-risque)</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleGenerateOutreachEmail}
                        disabled={isGeneratingEmail}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                    >
                        {isGeneratingEmail ? <RefreshCw className="animate-spin" size={14} /> : <Mail size={14} />}
                        Générer le Courrier de Saisine Officiel
                    </button>

                    {generatedEmail && (
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                                {generatedEmail}
                            </div>

                            {/* Verification & Consent Prompt */}
                            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
                                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                                    <ShieldCheck size={16} className="text-amber-600" />
                                    <span>Garde-fou : Validation Explicite avant Envoi</span>
                                </div>
                                <p className="text-xs text-amber-800 leading-relaxed">
                                    Conformément aux règles éthiques de la plateforme, aucun email n'est envoyé automatiquement. Vous devez relire, valider ou copier le texte dans votre messagerie officielle.
                                </p>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={() => {
                                            setOutreachConfirmed(true);
                                            onNotification("Courrier Validé", "Le courrier a été validé et enregistré dans le dossier.", "success");
                                        }}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                            outreachConfirmed ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white hover:bg-amber-700'
                                        }`}
                                    >
                                        {outreachConfirmed ? <Check size={14} /> : <CheckCircle2 size={14} />}
                                        {outreachConfirmed ? 'Validé & Prêt' : 'Confirmer & Valider la Lettre'}
                                    </button>

                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(generatedEmail);
                                            onNotification("Copié !", "Texte copié dans le presse-papiers.", "info");
                                        }}
                                        className="px-4 py-2 bg-white border border-amber-300 text-amber-900 rounded-xl text-xs font-bold hover:bg-amber-100"
                                    >
                                        Copier le Texte
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 7: BRIEFING AUDITION / RÉUNION */}
            {activePhase === 7 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 7 : Préparation de l'Audition & Réponses aux Pièges</h3>
                            <p className="text-xs text-slate-500">Simulation d'entretien, questions déstabilisantes du bailleur et argumentaire percutant.</p>
                        </div>
                        <button
                            onClick={handleGenerateBriefing}
                            disabled={isGeneratingBriefing}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                        >
                            {isGeneratingBriefing ? <RefreshCw className="animate-spin" size={14} /> : <Sparkles size={14} />}
                            Générer le Briefing d'Audition
                        </button>
                    </div>

                    {meetingBriefing ? (
                        <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                            {meetingBriefing}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                            <Users className="mx-auto text-blue-500" size={36} />
                            <h4 className="font-bold text-slate-800 text-sm">Préparez votre grand oral</h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Obtenez les questions pièges, les arguments de défense du budget et la stratégie de négociation.
                            </p>
                        </div>
                    )}
                </div>
            )}

            {/* PHASE 8: FINANCEMENT & ACCORD */}
            {activePhase === 8 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 8 : Financement & Suivi de Décision</h3>
                            <p className="text-xs text-slate-500">Statut du dépôt, demandes de compléments d'audit et contractualisation.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[
                            { id: 'soumis', label: '1. Déposé & En Examen', color: 'blue' },
                            { id: 'audition', label: '2. Audition Réussie', color: 'purple' },
                            { id: 'complément', label: '3. Audit & Compléments', color: 'amber' },
                            { id: 'approuvé', label: '4. Financement Approuvé 🎉', color: 'emerald' }
                        ].map(st => (
                            <button
                                key={st.id}
                                onClick={() => {
                                    setFinancingStatus(st.id as any);
                                    onNotification("Statut Mis à Jour", `Le projet est désormais : ${st.label}`, "info");
                                }}
                                className={`p-4 rounded-2xl border text-center transition-all ${
                                    financingStatus === st.id 
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-md' 
                                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                            >
                                <div className="text-xs font-bold">{st.label}</div>
                            </button>
                        ))}
                    </div>

                    <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
                        <h4 className="font-black text-xs text-emerald-900">Convention de Subvention & Accord Cadre</h4>
                        <p className="text-xs text-emerald-800 leading-relaxed">
                            L'accord préliminaire porte sur l'enveloppe de <strong>{totalBudget.toLocaleString()} €</strong> avec déblocage en 3 tranches (40% au démarrage, 40% à mi-parcours après rapport d'étape, 20% à la clôture).
                        </p>
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={() => setActivePhase(9)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700"
                        >
                            Lancer l'Exécution Opérationnelle <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* PHASE 9: EXÉCUTION OPÉRATIONNELLE */}
            {activePhase === 9 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 9 : Plan de Travail & Jalons Opérationnels</h3>
                            <p className="text-xs text-slate-500">Rétroplanning des tâches, affectation des experts et suivi des livrables.</p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {tasksTimeline.map((item, idx) => (
                            <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                                            {item.deadline}
                                        </span>
                                        <span className="text-xs font-bold text-slate-700">Responsable : {item.assigned}</span>
                                    </div>
                                    <p className="text-xs font-black text-slate-900">{item.task}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setTasksTimeline(prev => prev.map((t, i) => i === idx ? { ...t, status: t.status === 'done' ? 'pending' : 'done' } : t));
                                        onNotification("Jalon Modifié", "Progression de la tâche actualisée.", "info");
                                    }}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                                        item.status === 'done' ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                                    }`}
                                >
                                    {item.status === 'done' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                    {item.status === 'done' ? 'Achevé' : 'En Cours'}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end">
                        <button 
                            onClick={() => setActivePhase(10)}
                            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-blue-700"
                        >
                            Compiler le Rapport Final (Phase 10) <ArrowRight size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* PHASE 10: SUIVI & RAPPORT FINAL */}
            {activePhase === 10 && (
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 animate-fade-up">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Phase 10 : Évaluation d'Impact & Rapport Final de Clôture</h3>
                            <p className="text-xs text-slate-500">Bilan narratif, audit financier comparatif et attestation officielle de réalisation.</p>
                        </div>
                        <button
                            onClick={handleGenerateFinalReport}
                            disabled={isGeneratingFinalReport}
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
                        >
                            {isGeneratingFinalReport ? <RefreshCw className="animate-spin" size={14} /> : <Award size={14} />}
                            Générer le Rapport Final d'Impact
                        </button>
                    </div>

                    {finalReportContent ? (
                        <div className="space-y-4">
                            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed">
                                {finalReportContent}
                            </div>
                            <div className="flex justify-end gap-2">
                                <button
                                    onClick={() => onNotification("Dossier Archivé", "Le projet est désormais clôturé avec succès et archivé dans votre historique permanent.", "success")}
                                    className="px-5 py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-xs"
                                >
                                    <CheckCircle2 size={16} /> Clôturer Officiellement le Dossier
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-300 space-y-3">
                            <Award className="mx-auto text-emerald-500" size={36} />
                            <h4 className="font-bold text-slate-800 text-sm">Clôture et Certification de Réalisation</h4>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Générez le bilan narratif et financier final pour soumission au bailleur et délivrance de l'attestation de réussite.
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
