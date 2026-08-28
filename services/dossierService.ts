import { DossierParcours, DossierStep, DossierTask, DossierDocument, DossierDeliverable, DossierCategory } from '../types';
import { AIProxyClient } from './aiProxy';
import { memoryService } from './memory';
import { moduleRepository } from './moduleRepository';

class DossierService {
    private dossiersCache: DossierParcours[] | null = null;

    /**
     * Récupère tous les dossiers/parcours de l'utilisateur
     */
    async getAllDossiers(): Promise<DossierParcours[]> {
        if (this.dossiersCache) return this.dossiersCache;
        try {
            const records = await moduleRepository.list<DossierParcours>('dossiers', 'dossier');
            this.dossiersCache = records.map((record) => record.payload);
            return this.dossiersCache;
        } catch (e) {
            console.warn('Chargement des dossiers impossible', e);
            return [];
        }
    }

    /**
     * Récupère un dossier spécifique par son ID
     */
    async getDossierById(id: string): Promise<DossierParcours | null> {
        const dossiers = await this.getAllDossiers();
        return dossiers.find(d => d.id === id) || null;
    }

    /**
     * Crée un nouveau dossier / parcours de vie
     */
    async createDossier(data: {
        title: string;
        category: DossierCategory;
        goal: string;
        leadAgentId: string;
        collaboratingAgentIds?: string[];
        targetDate?: string;
    }): Promise<DossierParcours> {
        const dossiers = await this.getAllDossiers();
        const id = crypto.randomUUID();

        // Initialisation standardisée selon la méthodologie :
        // DIAGNOSTIQUER -> COMPRENDRE -> PLANIFIER -> ACCOMPAGNER -> PRODUIRE -> ÉVALUER -> CORRIGER -> SUIVRE -> ATTEINDRE L'OBJECTIF
        const initialSteps: DossierStep[] = [
            {
                id: `step-${Date.now()}-1`,
                stepNumber: 1,
                title: 'Diagnostic initial & Définition du cadre',
                description: 'Collecte des données de départ, identification des contraintes et validation des objectifs chiffrés.',
                assignedAgentId: data.leadAgentId,
                status: 'in_progress',
                deliverableTitle: 'Fiche de Cadrage Initiale',
                progress: 25,
                estimatedDuration: '3 jours'
            },
            {
                id: `step-${Date.now()}-2`,
                stepNumber: 2,
                title: 'Planification opérationnelle & Matrice d’action',
                description: 'Structuration du calendrier, allocation des ressources et revue des pièces nécessaires.',
                assignedAgentId: data.leadAgentId,
                status: 'pending',
                deliverableTitle: 'Plan d’Action Détaillé',
                progress: 0,
                estimatedDuration: '1 semaine'
            },
            {
                id: `step-${Date.now()}-3`,
                stepNumber: 3,
                title: 'Production des livrables & Rédaction technique',
                description: 'Élaboration des documents contractuels, rapports ou dossiers de candidature.',
                assignedAgentId: data.collaboratingAgentIds?.[0] || data.leadAgentId,
                status: 'pending',
                deliverableTitle: 'Dossier Technique Finalisé',
                progress: 0,
                estimatedDuration: '2 semaines'
            },
            {
                id: `step-${Date.now()}-4`,
                stepNumber: 4,
                title: 'Évaluation, Contrôle qualité & Clôture',
                description: 'Audit final par les experts, validation de conformité et passage à l’action concrète.',
                assignedAgentId: data.leadAgentId,
                status: 'pending',
                deliverableTitle: 'Attestation de Réalisation & Synthèse',
                progress: 0,
                estimatedDuration: '3 jours'
            }
        ];

        const newDossier: DossierParcours = {
            id,
            title: data.title,
            category: data.category,
            goal: data.goal,
            status: 'en_cours',
            progress: 10,
            startDate: new Date().toLocaleDateString('fr-FR'),
            targetDate: data.targetDate || 'Dans 3 mois',
            leadAgentId: data.leadAgentId,
            collaboratingAgentIds: data.collaboratingAgentIds || [data.leadAgentId],
            currentStepIndex: 0,
            steps: initialSteps,
            tasks: [
                {
                    id: `task-${Date.now()}-1`,
                    title: `Compléter l'entretien de cadrage avec l'expert référent`,
                    completed: false,
                    assignedAgentId: data.leadAgentId,
                    priority: 'high'
                }
            ],
            documents: [],
            deliverables: [],
            appointments: [],
            nextAction: `Démarrer le diagnostic initial avec l'expert responsable.`,
            decisions: [`Lancement officiel du dossier : "${data.title}"`],
            difficulties: [],
            skillsGained: [],
            aiRecommendations: [
                'Préparez tous les justificatifs préalables pour accélérer le traitement du dossier.'
            ],
            lastActiveDate: 'À l’instant'
        };

        dossiers.unshift(newDossier);
        this.dossiersCache = dossiers;
        await this.persist();

        // Enregistrement dans la mémoire active
        await memoryService.addOrUpdateMemory({
            category: 'objective',
            key: `Nouveau Dossier: ${data.title}`,
            value: data.goal,
            agentId: data.leadAgentId,
            dossierId: id,
            verified: false,
            confidence: 1,
        });

        return newDossier;
    }

    /**
     * Fait progresser une étape du dossier
     */
    async updateStepStatus(dossierId: string, stepId: string, status: DossierStep['status'], progress: number = 100): Promise<DossierParcours | null> {
        const dossier = await this.getDossierById(dossierId);
        if (!dossier) return null;

        const step = dossier.steps.find(s => s.id === stepId);
        if (step) {
            step.status = status;
            step.progress = progress;
        }

        // Calcul du progrès global
        const completedSteps = dossier.steps.filter(s => s.status === 'completed').length;
        const inProgressSteps = dossier.steps.filter(s => s.status === 'in_progress').length;
        const totalSteps = dossier.steps.length;
        
        dossier.progress = Math.round(((completedSteps + (inProgressSteps * 0.5)) / totalSteps) * 100);
        dossier.lastActiveDate = 'Aujourd’hui';

        // Si l'étape courante est complétée, passer à la suivante
        const nextStep = dossier.steps.find(s => s.status === 'pending');
        if (nextStep && status === 'completed') {
            nextStep.status = 'in_progress';
            nextStep.progress = 20;
            dossier.currentStepIndex = dossier.steps.findIndex(s => s.id === nextStep.id);
            dossier.nextAction = `Poursuivre l'étape "${nextStep.title}" avec l'expert assigné.`;
        }

        await this.persist();
        return dossier;
    }

    /**
     * Ajoute ou coche une tâche dans un dossier
     */
    async toggleTask(dossierId: string, taskId: string): Promise<DossierParcours | null> {
        const dossier = await this.getDossierById(dossierId);
        if (!dossier) return null;

        const task = dossier.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            dossier.lastActiveDate = 'À l’instant';
            await this.persist();
        }
        return dossier;
    }

    /**
     * Ajoute une nouvelle tâche
     */
    async addTask(dossierId: string, task: Omit<DossierTask, 'id'>): Promise<DossierParcours | null> {
        const dossier = await this.getDossierById(dossierId);
        if (!dossier) return null;

        dossier.tasks.push({
            id: `task-${Date.now()}`,
            ...task
        });
        dossier.lastActiveDate = 'À l’instant';
        await this.persist();
        return dossier;
    }

    /**
     * Ajoute un document ou livrable produit par un expert
     */
    async addDeliverable(dossierId: string, deliverable: Omit<DossierDeliverable, 'id' | 'createdAt'>): Promise<DossierParcours | null> {
        const dossier = await this.getDossierById(dossierId);
        if (!dossier) return null;

        dossier.deliverables.push({
            id: `deliv-${Date.now()}`,
            createdAt: new Date().toLocaleDateString('fr-FR'),
            ...deliverable
        });

        if (deliverable.documentUrl) {
            dossier.documents.push({
                id: `doc-${Date.now()}`,
                title: deliverable.title,
                type: 'report',
                version: 1,
                url: deliverable.documentUrl,
                updatedAt: 'À l’instant',
                isSigned: false,
            });
        }

        dossier.lastActiveDate = 'À l’instant';
        await this.persist();
        return dossier;
    }

    /**
     * Génère une analyse IA pour recommander la prochaine action sur le dossier
     */
    async generateNextActionRecommendation(dossier: DossierParcours): Promise<string> {
        try {
            const ai = new AIProxyClient();
            const prompt = `
            Tu es l'Orchestrateur Central de la plateforme 'Le Monde à Vous'.
            Analyse ce dossier en cours :
            - Titre : ${dossier.title}
            - Catégorie : ${dossier.category}
            - Objectif : ${dossier.goal}
            - Progrès : ${dossier.progress}%
            - Étapes : ${JSON.stringify(dossier.steps.map(s => ({ title: s.title, status: s.status })))}
            - Tâches restantes : ${JSON.stringify(dossier.tasks.filter(t => !t.completed).map(t => t.title))}
            - Décisions clés : ${dossier.decisions.join(' | ')}
            - Blocages : ${dossier.difficulties.join(' | ') || 'Aucun'}

            Fournis une recommandation d'action immédiate, concrète et opérationnelle (1 ou 2 phrases percutantes).
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt
            });

            return response.text?.trim() || dossier.nextAction;
        } catch (e) {
            return dossier.nextAction;
        }
    }

    public async persist(): Promise<void> {
        if (this.dossiersCache) {
            await Promise.all(this.dossiersCache.map((dossier) => moduleRepository.upsert(
                'dossiers',
                'dossier',
                dossier,
                { id: dossier.id, status: dossier.status === 'complete' || dossier.status === 'objectif_atteint' ? 'completed' : 'active' },
            )));
        }
    }
}

export const dossierService = new DossierService();
