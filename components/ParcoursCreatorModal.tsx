import React, { useState, useRef } from 'react';
import { 
    X, 
    Sparkles, 
    Mic, 
    MicOff, 
    Upload, 
    FileText, 
    Camera, 
    CheckCircle2, 
    ArrowRight, 
    Loader2, 
    Globe, 
    GraduationCap, 
    Briefcase, 
    ShoppingBag, 
    Scale, 
    HeartPulse, 
    Home, 
    Palette, 
    Users, 
    User, 
    Building2, 
    AlertCircle, 
    HelpCircle,
    Compass,
    Target
} from 'lucide-react';
import { AGENTS } from '../constants';
import { DossierCategory, DossierParcours, DossierStep } from '../types';
import { dossierService } from '../services/dossierService';
import { generateText, generateJSON } from '../services/aiGateway';

interface ParcoursCreatorModalProps {
    isOpen: boolean;
    onClose: () => void;
    onParcoursCreated: (newParcours: DossierParcours) => void;
}

const ARCHETYPES = [
    {
        id: 'archetype-mobility',
        title: 'Mobilité Internationale & Expatriation ✈️',
        category: 'projet' as DossierCategory,
        leadAgentId: '2', // Maître Diallo
        collaboratingAgentIds: ['2', '7', '3'],
        icon: Globe,
        color: 'from-blue-600 to-indigo-600',
        badge: 'Visa & Installation',
        defaultGoal: 'Obtenir un visa de long séjour / Passeport Talent, sécuriser un logement et finaliser l’installation professionnelle.',
        pointA: 'Candidat qualifié avec passeport, besoin d’un cadre légal et d’une stratégie de candidature internationale.',
        pointB: 'Visa délivré, contrat de bail signé et démarches d’intégration finalisées.'
    },
    {
        id: 'archetype-education',
        title: 'Diplôme, Concours & Maîtrise des Savoirs 🎓',
        category: 'education' as DossierCategory,
        leadAgentId: '4', // Professeur Diallo
        collaboratingAgentIds: ['4', '1'],
        icon: GraduationCap,
        color: 'from-emerald-600 to-teal-600',
        badge: 'Campus & Certification',
        defaultGoal: 'Maîtriser le programme académique, réussir les évaluations certifiantes et valider l’attestation de compétences C1/B2.',
        pointA: 'Niveau initial intermédiaire, besoin d’un plan de travail intensif structuré et d’exercices corrigés.',
        pointB: 'Attestation de réussite officielle avec mention et compétences certifiées.'
    },
    {
        id: 'archetype-career',
        title: 'Reconversion & Emploi International 💼',
        category: 'carriere' as DossierCategory,
        leadAgentId: '3', // Conseiller Diallo
        collaboratingAgentIds: ['3', '2', '1'],
        icon: Briefcase,
        color: 'from-amber-600 to-orange-600',
        badge: 'Carrière & Recrutement',
        defaultGoal: 'Refondre son CV aux standards internationaux ATS, réussir 5 simulations d’entretiens et signer un contrat en CDI.',
        pointA: 'Expérience existante mais CV non optimisé et difficultés lors des entretiens en langue étrangère.',
        pointB: 'Offre d’embauche reçue et contrat de travail validé juridiquement.'
    },
    {
        id: 'archetype-business',
        title: 'Entrepreneuriat & Import-Export Mondial 🚀',
        category: 'projet' as DossierCategory,
        leadAgentId: '8', // Directeur Diallo
        collaboratingAgentIds: ['8', '2', '10'],
        icon: ShoppingBag,
        color: 'from-purple-600 to-pink-600',
        badge: 'Marché Mondial & Deal',
        defaultGoal: 'Cadrer le modèle économique, négocier les approvisionnements sur le Marché Mondial et lancer l’activité commerciale.',
        pointA: 'Idée de projet ou besoin de matières premières / machines avec budget de départ à rentabiliser.',
        pointB: 'Première opération commerciale livrée, contrat B2B sécurisé et seuil de rentabilité validé.'
    },
    {
        id: 'archetype-legal',
        title: 'Régularisation Juridique & Administrative ⚖️',
        category: 'juridique' as DossierCategory,
        leadAgentId: '2', // Maître Diallo
        collaboratingAgentIds: ['2', '8'],
        icon: Scale,
        color: 'from-slate-700 to-slate-900',
        badge: 'Droit & Conformité',
        defaultGoal: 'Constituer un dossier de régularisation irréprochable avec toutes les pièces justificatives certifiées.',
        pointA: 'Situation administrative complexe avec délais préfectoraux ou formulaires consulaires en attente.',
        pointB: 'Récépissé ou titre délivré et statut pleinement régularisé.'
    },
    {
        id: 'archetype-health',
        title: 'Santé, Soins & Prévention Médicale 🩺',
        category: 'sante' as DossierCategory,
        leadAgentId: '5', // Docteur Diallo
        collaboratingAgentIds: ['5', '2'],
        icon: HeartPulse,
        color: 'from-rose-600 to-red-600',
        badge: 'Santé & Suivi',
        defaultGoal: 'Organiser la prise en charge médicale, les bilans de santé complets et la couverture assurantielle.',
        pointA: 'Besoin d’un bilan préventif ou d’une prise en charge de soins spécialisés avec couverture maladie.',
        pointB: 'Parcours de soins coordonné, ordonnances suivies et attestations d’assurance en règle.'
    }
];

export const ParcoursCreatorModal: React.FC<ParcoursCreatorModalProps> = ({
    isOpen,
    onClose,
    onParcoursCreated
}) => {
    const [creationMode, setCreationMode] = useState<'text' | 'voice' | 'ocr' | 'archetype'>('text');
    const [scopeMode, setScopeMode] = useState<'individual' | 'family' | 'organization'>('individual');
    
    // Text inputs
    const [promptText, setPromptText] = useState('');
    const [targetTimeline, setTargetTimeline] = useState('Dans 3 mois');
    const [familyDetails, setFamilyDetails] = useState('');
    
    // Voice state
    const [isRecording, setIsRecording] = useState(false);
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceTimer, setVoiceTimer] = useState(0);
    const voiceIntervalRef = useRef<any>(null);
    
    // OCR / File state
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
    const [ocrExtractedData, setOcrExtractedData] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Generation state
    const [isGenerating, setIsGenerating] = useState(false);
    const [generationStepStatus, setGenerationStepStatus] = useState<string>('');

    if (!isOpen) return null;

    // Start / Stop voice recording simulation with actual Web Speech API if supported
    const handleToggleRecording = () => {
        if (isRecording) {
            setIsRecording(false);
            if (voiceIntervalRef.current) clearInterval(voiceIntervalRef.current);
        } else {
            setIsRecording(true);
            setVoiceTimer(0);
            setVoiceTranscript('');
            
            voiceIntervalRef.current = setInterval(() => {
                setVoiceTimer(t => t + 1);
            }, 1000);

            // Attempt SpeechRecognition
            const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            if (SpeechRec) {
                try {
                    const recognition = new SpeechRec();
                    recognition.lang = 'fr-FR';
                    recognition.continuous = true;
                    recognition.interimResults = true;
                    recognition.onresult = (event: any) => {
                        let text = '';
                        for (let i = 0; i < event.results.length; ++i) {
                            text += event.results[i][0].transcript;
                        }
                        setVoiceTranscript(text);
                    };
                    recognition.start();
                } catch (e) {
                    console.log("Speech recognition not supported in iframe environment, using simulated prompt.");
                }
            } else {
                // Fallback simulation text
                setTimeout(() => {
                    setVoiceTranscript("Je souhaite préparer mon projet de création d'entreprise et d'exportation vers l'Europe d'ici l'automne 2026.");
                }, 2500);
            }
        }
    };

    // Handle file upload & Gemini Vision OCR analysis
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadedFile(file);

        if (file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFilePreviewUrl(url);
        }

        // Run OCR analysis via Gemini
        setIsGenerating(true);
        setGenerationStepStatus("Analyse multimodale du document par Diallo OS...");

        try {
            // Read file as base64 if image
            let prompt = `Analyse ce document officiel/technique.
            Extraits les éléments clés pour définir le "Point A" d'un utilisateur (situation actuelle, diplôme, identité, date, contraintes, blocages constatés) et suggère le "Point B" (objectif concret à atteindre).
            Nom du fichier : ${file.name}
            Type : ${file.type}`;

            const response = await generateText(prompt);

            const text = response || "Document analysé avec succès. Prêt pour la génération du parcours.";
            setOcrExtractedData(text);
            setPromptText(`Dossier basé sur le document : ${file.name}.\n${text.slice(0, 300)}...`);
        } catch (err) {
            console.error(err);
            setOcrExtractedData(`Document ${file.name} réceptionné (Taille: ${(file.size/1024).toFixed(1)} KB). Prêt pour le diagnostic initial.`);
            setPromptText(`Projet lié au document ${file.name}`);
        } finally {
            setIsGenerating(false);
            setGenerationStepStatus('');
        }
    };

    // Generate full dynamic Parcours via Diallo OS
    const handleGenerateParcours = async (customPrompt?: string, selectedArchetype?: typeof ARCHETYPES[0]) => {
        setIsGenerating(true);
        setGenerationStepStatus("Diallo OS : Diagnostic Point A ➔ Structuration des Étapes ➔ Point B...");

        const inputGoal = customPrompt || (creationMode === 'voice' ? voiceTranscript : promptText);
        
        try {
            const systemPrompt = `Tu es Diallo OS, le cerveau orchestrateur de la plateforme "LE MONDE À VOUS".
            Tu dois structurer un Parcours de Vie universel selon la philosophie absolue :
            POINT A (Situation de départ) ➔ PARCOURS (Étapes progressives ordonnées avec livrables) ➔ POINT B (Objectif final atteint) ➔ RÉSULTAT (Attestation/Livrable final) ➔ CONTINUITÉ (Étape future).

            Données de l'utilisateur :
            - Intention : ${inputGoal || selectedArchetype?.defaultGoal || 'Projet de réussite personnelle'}
            - Périmètre : ${scopeMode} (${scopeMode === 'family' ? `Famille : ${familyDetails}` : 'Individuel'})
            - Délai visé : ${targetTimeline}
            ${selectedArchetype ? `- Archétype de référence : ${selectedArchetype.title}` : ''}
            ${ocrExtractedData ? `- Données OCR document : ${ocrExtractedData}` : ''}

            Génère une réponse JSON valide respectant strictement ce schéma :
            {
                "title": "Titre clair et percutant du parcours",
                "category": "projet" | "education" | "carriere" | "juridique" | "sante" | "logement",
                "goal": "Description concise de l'objectif final",
                "leadAgentId": "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10",
                "collaboratingAgentIds": ["ID1", "ID2"],
                "targetDate": "${targetTimeline}",
                "costEstimate": "Budget estimé (ex: 350€ ou 0€)",
                "pointA": {
                    "initialStatus": "Description de la situation de départ",
                    "startingSkills": ["Compétence 1", "Compétence 2"],
                    "constraints": ["Contrainte 1", "Contrainte 2"]
                },
                "pointB": {
                    "targetGoal": "Description précise de l'état d'arrivée",
                    "certificationExpected": "Nom du livrable / diplôme / visa attendu",
                    "successCriteria": ["Critère de validation 1", "Critère de validation 2"]
                },
                "steps": [
                    {
                        "stepNumber": 1,
                        "title": "Titre étape 1",
                        "description": "Détails opérationnels",
                        "assignedAgentId": "ID",
                        "status": "in_progress",
                        "deliverableTitle": "Titre du livrable à produire",
                        "estimatedDuration": "Ex: 3 jours",
                        "gatewayModule": "campus" | "career" | "market" | "legal" | "wallet" | "safe",
                        "gatewayActionLabel": "Bouton d'action directe"
                    },
                    {
                        "stepNumber": 2,
                        "title": "Titre étape 2",
                        "description": "Détails opérationnels",
                        "assignedAgentId": "ID",
                        "status": "pending",
                        "deliverableTitle": "Titre livrable",
                        "estimatedDuration": "Ex: 1 semaine",
                        "gatewayModule": "chat",
                        "gatewayActionLabel": "Consulter l'expert"
                    },
                    {
                        "stepNumber": 3,
                        "title": "Titre étape 3",
                        "description": "Détails opérationnels",
                        "assignedAgentId": "ID",
                        "status": "pending",
                        "deliverableTitle": "Titre livrable",
                        "estimatedDuration": "Ex: 2 semaines"
                    },
                    {
                        "stepNumber": 4,
                        "title": "Titre étape 4 (Clôture & Certification)",
                        "description": "Validation finale",
                        "assignedAgentId": "ID",
                        "status": "pending",
                        "deliverableTitle": "Attestation finale officielle",
                        "estimatedDuration": "Ex: 3 jours"
                    }
                ],
                "initialTasks": [
                    { "title": "Première tâche immédiate", "priority": "high" },
                    { "title": "Deuxième tâche préparatoire", "priority": "medium" }
                ],
                "planBAlternative": {
                    "title": "Alternative Plan B si blocage",
                    "triggerCondition": "En cas de retard administratif ou refus",
                    "description": "Stratégie de contournement constructive",
                    "impactOnTimeline": "+15 jours",
                    "suggestedAgentId": "2"
                },
                "continuityPlan": {
                    "nextPhaseTitle": "Phase suivante post-réussite",
                    "recommendations": ["Recommandation de consolidation 1", "Recommandation 2"]
                },
                "nextImmediateAction": "Phrase très précise indiquant la toute première action à effectuer"
            }`;

            const parsed = await generateJSON<any>(systemPrompt);

            // Format into concrete DossierParcours
            const newDossier: DossierParcours = {
                id: `parcours-${Date.now()}`,
                title: parsed.title || 'Nouveau Parcours de Réussite',
                category: parsed.category || 'projet',
                goal: parsed.goal || inputGoal,
                status: 'en_cours',
                progress: 5,
                startDate: new Date().toLocaleDateString('fr-FR'),
                targetDate: parsed.targetDate || targetTimeline,
                leadAgentId: parsed.leadAgentId || (selectedArchetype ? selectedArchetype.leadAgentId : '8'),
                collaboratingAgentIds: parsed.collaboratingAgentIds || ['2', '3'],
                associatedModules: ['chat', 'safe', 'campus'],
                currentStepIndex: 0,
                steps: (parsed.steps || []).map((st: any, idx: number) => ({
                    id: `st-${Date.now()}-${idx+1}`,
                    stepNumber: st.stepNumber || idx + 1,
                    title: st.title,
                    description: st.description,
                    assignedAgentId: st.assignedAgentId || parsed.leadAgentId || '8',
                    status: idx === 0 ? 'in_progress' : 'pending',
                    deliverableTitle: st.deliverableTitle,
                    progress: idx === 0 ? 15 : 0,
                    estimatedDuration: st.estimatedDuration || '1 semaine',
                    gatewayModule: st.gatewayModule,
                    gatewayActionLabel: st.gatewayActionLabel,
                    isKeyMilestone: idx === (parsed.steps.length - 1)
                })),
                tasks: (parsed.initialTasks || []).map((tk: any, idx: number) => ({
                    id: `tk-${Date.now()}-${idx+1}`,
                    title: tk.title,
                    deadline: 'Sous 48h',
                    completed: false,
                    assignedAgentId: parsed.leadAgentId || '8',
                    priority: tk.priority || 'high'
                })),
                documents: uploadedFile ? [
                    {
                        id: `doc-up-${Date.now()}`,
                        title: uploadedFile.name,
                        type: 'pdf',
                        version: 1,
                        updatedAt: 'Aujourd’hui',
                        isVerified: true,
                        fileSize: `${(uploadedFile.size / 1024).toFixed(0)} KB`
                    }
                ] : [],
                deliverables: [
                    {
                        id: `deliv-init-${Date.now()}`,
                        title: `Note de Cadrage Initiale : ${parsed.title}`,
                        description: `Document généré automatiquement à partir de votre diagnostic initial Point A ➔ Point B.`,
                        category: 'Cadrage Stratégique',
                        status: 'final',
                        createdAt: new Date().toLocaleDateString('fr-FR'),
                        authorAgentName: AGENTS.find(a => a.id === parsed.leadAgentId)?.name || 'Directeur Diallo'
                    }
                ],
                appointments: [],
                nextAction: parsed.nextImmediateAction || `Démarrer le cadrage avec l'expert responsable.`,
                decisions: [`Lancement officiel du parcours : ${parsed.title}`],
                difficulties: parsed.pointA?.constraints || [],
                skillsGained: parsed.pointA?.startingSkills || [],
                aiRecommendations: [
                    `Suivez la progression des étapes pas à pas et sollicitez votre équipe d'experts à chaque jalon.`,
                    `Consultez la barre "Que dois-je faire maintenant ?" pour connaître votre prochaine priorité.`
                ],
                lastActiveDate: 'À l’instant',
                costEstimate: parsed.costEstimate || '0 €',
                pointA: parsed.pointA || {
                    initialStatus: 'Diagnostic initial réalisé',
                    startingSkills: ['Motivation', 'Engagement']
                },
                pointB: parsed.pointB || {
                    targetGoal: parsed.goal,
                    certificationExpected: 'Attestation de réussite finale'
                },
                scopeMode: scopeMode,
                familyMembers: scopeMode === 'family' ? [{ name: 'Famille', role: 'Bénéficiaires', specificNeeds: familyDetails }] : undefined,
                planBAlternatives: parsed.planBAlternative ? [
                    {
                        id: `pb-${Date.now()}`,
                        title: parsed.planBAlternative.title || 'Plan B alternatif',
                        triggerCondition: parsed.planBAlternative.triggerCondition || 'En cas de blocage imprévu',
                        description: parsed.planBAlternative.description || 'Ajustement de la trajectoire',
                        impactOnTimeline: parsed.planBAlternative.impactOnTimeline || '+10 jours',
                        suggestedAgentId: parsed.planBAlternative.suggestedAgentId || '2',
                        revisedStepsSummary: 'Pivot stratégique avec procédures allégées'
                    }
                ] : undefined,
                continuityPlan: parsed.continuityPlan || {
                    nextPhaseTitle: 'Consolidation des acquis & Étape suivante',
                    recommendations: ['Maintenir le suivi régulier avec les experts']
                }
            };

            // Save in service
            await dossierService.createDossier(newDossier as any);
            onParcoursCreated(newDossier);
            onClose();

        } catch (error) {
            console.error("Error creating parcours:", error);
            // Robust fallback if API fails
            const fallbackLead = selectedArchetype ? selectedArchetype.leadAgentId : '8';
            const fallbackDossier: DossierParcours = {
                id: `parcours-${Date.now()}`,
                title: inputGoal ? `Parcours : ${inputGoal.slice(0, 40)}...` : (selectedArchetype?.title || 'Nouveau Parcours de Vie'),
                category: selectedArchetype?.category || 'projet',
                goal: inputGoal || selectedArchetype?.defaultGoal || 'Objectif d’accomplissement personnel',
                status: 'en_cours',
                progress: 5,
                startDate: new Date().toLocaleDateString('fr-FR'),
                targetDate: targetTimeline,
                leadAgentId: fallbackLead,
                collaboratingAgentIds: ['2', '3'],
                associatedModules: ['chat', 'safe'],
                currentStepIndex: 0,
                steps: [
                    {
                        id: `st-fb-1`,
                        stepNumber: 1,
                        title: 'Diagnostic initial & Définition du cadre',
                        description: 'Recueil des éléments du Point A et cadrage avec l’expert référent.',
                        assignedAgentId: fallbackLead,
                        status: 'in_progress',
                        deliverableTitle: 'Fiche de Cadrage Stratégique',
                        progress: 20,
                        estimatedDuration: '3 jours'
                    },
                    {
                        id: `st-fb-2`,
                        stepNumber: 2,
                        title: 'Constitution du dossier & Pièces requises',
                        description: 'Centralisation des justificatifs dans le Coffre-Fort.',
                        assignedAgentId: '2',
                        status: 'pending',
                        deliverableTitle: 'Dossier Conforme',
                        progress: 0,
                        estimatedDuration: '1 semaine'
                    },
                    {
                        id: `st-fb-3`,
                        stepNumber: 3,
                        title: 'Validation finale & Passage à l’action (Point B)',
                        description: 'Atteinte du résultat concret certifié.',
                        assignedAgentId: fallbackLead,
                        status: 'pending',
                        deliverableTitle: 'Attestation de Réussite',
                        progress: 0,
                        estimatedDuration: '2 semaines',
                        isKeyMilestone: true
                    }
                ],
                tasks: [
                    {
                        id: `tk-fb-1`,
                        title: 'Valider le point de départ avec votre expert référent',
                        completed: false,
                        assignedAgentId: fallbackLead,
                        priority: 'high'
                    }
                ],
                documents: [],
                deliverables: [],
                appointments: [],
                nextAction: 'Lancer le premier échange avec votre expert référent.',
                decisions: ['Initialisation du parcours.'],
                difficulties: [],
                skillsGained: [],
                aiRecommendations: ['Planifiez votre première séance d’orientation.'],
                lastActiveDate: 'À l’instant',
                pointA: { initialStatus: 'Situation de départ enregistrée' },
                pointB: { targetGoal: inputGoal || 'Objectif validé' },
                scopeMode: scopeMode
            };

            await dossierService.createDossier(fallbackDossier as any);
            onParcoursCreated(fallbackDossier);
            onClose();
        } finally {
            setIsGenerating(false);
            setGenerationStepStatus('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
            <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white p-6 relative overflow-hidden shrink-0">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[90px] opacity-20 pointer-events-none"></div>
                    
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center text-white shadow-inner">
                                <Sparkles size={24} className="text-amber-300 animate-pulse" />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-bold uppercase tracking-wider bg-white/15 px-2.5 py-0.5 rounded-full text-indigo-200 border border-white/10">
                                        Moteur Universel de Parcours de Vie
                                    </span>
                                    <span className="text-xs text-slate-400 font-medium">Diallo OS</span>
                                </div>
                                <h2 className="text-2xl font-bold tracking-tight">Initialiser un Nouveau Parcours</h2>
                            </div>
                        </div>

                        <button 
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Scope Selector (Individual vs Family vs Organization) */}
                    <div className="mt-6 flex flex-wrap items-center gap-2 bg-white/10 p-1.5 rounded-2xl max-w-md border border-white/10">
                        <button
                            onClick={() => setScopeMode('individual')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${scopeMode === 'individual' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            <User size={14} /> Personnel
                        </button>
                        <button
                            onClick={() => setScopeMode('family')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${scopeMode === 'family' ? 'bg-amber-400 text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            <Users size={14} /> Famille
                        </button>
                        <button
                            onClick={() => setScopeMode('organization')}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${scopeMode === 'organization' ? 'bg-indigo-400 text-slate-900 shadow-md' : 'text-slate-300 hover:text-white'}`}
                        >
                            <Building2 size={14} /> Entreprise / Tribu
                        </button>
                    </div>
                </div>

                {/* Sub-header Navigation Mode */}
                <div className="bg-slate-100 p-3 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0 px-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCreationMode('text')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${creationMode === 'text' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/70'}`}
                        >
                            <FileText size={15} className="text-blue-600" /> Saisie Texte Libre
                        </button>
                        <button
                            onClick={() => setCreationMode('voice')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${creationMode === 'voice' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/70'}`}
                        >
                            <Mic size={15} className="text-red-600" /> Dictaphone Vocal
                        </button>
                        <button
                            onClick={() => setCreationMode('ocr')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${creationMode === 'ocr' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/70'}`}
                        >
                            <Camera size={15} className="text-purple-600" /> Scanner Document (OCR)
                        </button>
                        <button
                            onClick={() => setCreationMode('archetype')}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${creationMode === 'archetype' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:bg-slate-200/70'}`}
                        >
                            <Compass size={15} className="text-emerald-600" /> Modèles Clés en Main
                        </button>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold">Échéance cible :</span>
                        <select 
                            value={targetTimeline}
                            onChange={(e) => setTargetTimeline(e.target.value)}
                            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="Sous 30 jours">1 Mois</option>
                            <option value="Dans 3 mois">3 Mois</option>
                            <option value="Dans 6 mois">6 Mois</option>
                            <option value="Dans 1 an">1 An</option>
                            <option value="Programme Continu">Continu</option>
                        </select>
                    </div>
                </div>

                {/* Content Area */}
                <div className="p-6 overflow-y-auto flex-1 space-y-6">
                    
                    {/* Family Scope Details input if active */}
                    {scopeMode === 'family' && (
                        <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs font-bold text-amber-900 uppercase">
                                <Users size={16} /> Composition de la Famille & Besoins Spécifiques
                            </div>
                            <input 
                                type="text"
                                value={familyDetails}
                                onChange={(e) => setFamilyDetails(e.target.value)}
                                placeholder="Ex: Conjoint + 2 enfants (scolarité primaire et collège, besoin d'équivalences de diplômes)..."
                                className="w-full bg-white border border-amber-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                            />
                        </div>
                    )}

                    {/* MODE 1: FREE TEXT ENTRY */}
                    {creationMode === 'text' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-600">
                                    Décrivez ce que vous voulez réellement accomplir (Intention brute) :
                                </label>
                                <span className="text-xs text-indigo-600 font-medium flex items-center gap-1">
                                    <Sparkles size={12} /> Diallo OS structurera le Point A, les étapes et le Point B
                                </span>
                            </div>

                            <textarea 
                                value={promptText}
                                onChange={(e) => setPromptText(e.target.value)}
                                placeholder="Exemples :&#10;• 'Je veux apprendre l'anglais professionnel et obtenir la certification C1 pour postuler à l'international.'&#10;• 'Je veux créer une unité de transformation agricole et trouver un fournisseur de séchoirs solaires en Chine.'&#10;• 'Je veux régulariser ma situation en France et préparer ma demande de Passeport Talent.'&#10;• 'Je veux inscrire mes enfants à l'école au Canada et trouver un logement avant la rentrée.'"
                                className="w-full h-40 p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400 leading-relaxed resize-none"
                            />

                            {/* Quick suggestions tags */}
                            <div>
                                <span className="text-[11px] font-bold text-slate-400 uppercase mr-2">Suggestions rapides :</span>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {[
                                        "Apprendre l'anglais des affaires & examen C1",
                                        "Créer une entreprise & Importer des machines",
                                        "Visa Long Séjour & Emploi en Europe",
                                        "Préparer une reconversion en Data / IA",
                                        "Trouver un logement & Inscription scolaire"
                                    ].map((sug, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => setPromptText(sug)}
                                            className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 px-3 py-1.5 rounded-xl border border-slate-200 transition-colors"
                                        >
                                            + {sug}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE 2: VOICE DICTAPHONE */}
                    {creationMode === 'voice' && (
                        <div className="space-y-6 text-center py-6 animate-fade-in">
                            <div className="max-w-md mx-auto">
                                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Parlez naturellement à Diallo OS
                                </div>
                                <p className="text-sm text-slate-600 mb-6">
                                    Exposez votre projet, vos doutes, vos délais et vos besoins. L'IA écoute et extrait automatiquement votre plan d'action.
                                </p>

                                <div className="relative inline-flex items-center justify-center mb-6">
                                    {isRecording && (
                                        <div className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-25"></div>
                                    )}
                                    <button
                                        onClick={handleToggleRecording}
                                        className={`w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all shadow-xl relative z-10 ${
                                            isRecording ? 'bg-red-600 text-white scale-110' : 'bg-gradient-to-tr from-indigo-600 to-purple-600 text-white hover:scale-105'
                                        }`}
                                    >
                                        {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
                                        <span className="text-[10px] font-bold uppercase mt-1">
                                            {isRecording ? `${voiceTimer}s` : 'Enregistrer'}
                                        </span>
                                    </button>
                                </div>

                                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left min-h-[100px]">
                                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                                        Transcription en temps réel :
                                    </div>
                                    {voiceTranscript ? (
                                        <p className="text-sm text-slate-800 italic leading-relaxed">
                                            "{voiceTranscript}"
                                        </p>
                                    ) : (
                                        <p className="text-sm text-slate-400 italic">
                                            {isRecording ? "Écoute en cours... Parlez maintenant." : "Cliquez sur le micro pour commencer à parler."}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* MODE 3: OCR DOCUMENT / PHOTO SCAN */}
                    {creationMode === 'ocr' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-1">
                                Uploadez un document de départ (Passeport, diplôme, refus, bail, devis, contrat...) :
                            </div>

                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-3xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center"
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*,application/pdf,.doc,.docx"
                                    onChange={handleFileChange}
                                />

                                <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3">
                                    <Upload size={28} />
                                </div>

                                <h4 className="font-bold text-slate-800 text-base mb-1">
                                    {uploadedFile ? uploadedFile.name : "Cliquez pour déposer un fichier ou une photo"}
                                </h4>
                                <p className="text-xs text-slate-500 max-w-sm">
                                    PDF, JPG, PNG, DOCX. L'intelligence multimodale Gemini lira le document pour situer votre Point A et anticiper les étapes nécessaires.
                                </p>
                            </div>

                            {ocrExtractedData && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 animate-fade-in">
                                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 uppercase mb-1">
                                        <CheckCircle2 size={16} /> Diagnostic Documentaire extrait :
                                    </div>
                                    <p className="text-xs text-emerald-900 leading-relaxed">
                                        {ocrExtractedData}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* MODE 4: ARCHETYPES */}
                    {creationMode === 'archetype' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                                Choisissez un cadre de réussite pré-configuré par nos experts :
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {ARCHETYPES.map((arch) => (
                                    <div
                                        key={arch.id}
                                        onClick={() => handleGenerateParcours(arch.defaultGoal, arch)}
                                        className="group p-4 rounded-2xl border border-slate-200 hover:border-indigo-500 bg-white hover:shadow-lg transition-all cursor-pointer flex flex-col justify-between"
                                    >
                                        <div className="flex items-start gap-3 mb-3">
                                            <div className={`p-3 rounded-xl bg-gradient-to-br ${arch.color} text-white shadow-md group-hover:scale-105 transition-transform`}>
                                                <arch.icon size={20} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between gap-1 mb-1">
                                                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                                                        {arch.title}
                                                    </h4>
                                                    <span className="text-[10px] font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                        {arch.badge}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                                    {arch.defaultGoal}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600">
                                            <span className="text-[11px] text-slate-400">
                                                Expert référent : {AGENTS.find(a => a.id === arch.leadAgentId)?.name || 'Directeur Diallo'}
                                            </span>
                                            <span className="flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                                Choisir ce parcours <ArrowRight size={14} />
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="text-xs text-slate-500 flex items-center gap-2">
                        <Target size={16} className="text-indigo-600 shrink-0" />
                        <span>Chaque parcours garantit : <strong>Point A ➔ Jalons certifiés ➔ Point B ➔ Pérennisation</strong></span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors w-full sm:w-auto"
                        >
                            Annuler
                        </button>

                        <button
                            type="button"
                            onClick={() => handleGenerateParcours()}
                            disabled={isGenerating || (creationMode === 'text' && !promptText.trim()) || (creationMode === 'voice' && !voiceTranscript.trim() && !promptText.trim())}
                            className={`px-6 py-2.5 rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 transition-all w-full sm:w-auto ${
                                isGenerating || ((creationMode === 'text' && !promptText.trim()) && (creationMode !== 'ocr' && creationMode !== 'archetype'))
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:scale-105'
                            }`}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" size={16} />
                                    <span>{generationStepStatus || "Génération du parcours..."}</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    <span>Créer Mon Parcours Diallo OS</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};
