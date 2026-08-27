
import { cloudService } from './cloud';
import { UserProfile, StoredDocument } from '../types';

export interface MemoryMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    image?: string;
    groundingSources?: { title: string, uri: string }[];
}

class MemoryService {
    private readonly STORAGE_KEY_PREFIX = 'chat_history_';

    /**
     * Sauvegarde une conversation
     */
    async saveConversation(agentId: string, messages: MemoryMessage[]): Promise<void> {
        try {
            const key = `${this.STORAGE_KEY_PREFIX}${agentId}`;
            await cloudService.saveData(key, {
                agentId,
                lastUpdated: Date.now(),
                messages
            });
        } catch (error) {
            console.error("Erreur sauvegarde mémoire:", error);
        }
    }

    /**
     * Récupère l'historique
     */
    async getConversation(agentId: string): Promise<MemoryMessage[] | null> {
        try {
            const key = `${this.STORAGE_KEY_PREFIX}${agentId}`;
            const data = await cloudService.getData(key);
            if (data && data.messages) return data.messages;
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * RAG SYSTEM: Récupère le contexte pertinent basé sur la requête utilisateur
     * Scanne le Profil, le Coffre-fort (métadonnées) et l'état actuel.
     */
    async retrieveContext(query: string, userProfile: UserProfile): Promise<string> {
        // 1. Récupération des métadonnées de documents pertinents
        const files = await cloudService.getAllFiles();
        // Simulation de recherche sémantique (mot-clé simple pour le prototype)
        const relevantDocs = files.filter((f: any) => 
            query.toLowerCase().includes(f.category.toLowerCase()) || 
            query.toLowerCase().includes('document') ||
            query.toLowerCase().includes('contrat') ||
            query.toLowerCase().includes('dossier')
        );

        let docContext = "";
        if (relevantDocs.length > 0) {
            docContext = `\n[DOCUMENTS DISPONIBLES DANS LE COFFRE-FORT]:\n${relevantDocs.map((d: any) => `- ${d.name} (${d.category})`).join('\n')}`;
        }

        // 2. Contexte du Profil
        const profileContext = `\n[PROFIL UTILISATEUR]:
        - Nom: ${userProfile.name}
        - Titre: ${userProfile.title}
        - Niveau: ${userProfile.level}
        - ID Citoyen: ${userProfile.citizenshipId}
        - Crédits: ${userProfile.credits}
        - Localisation (simulée): Paris, France`;

        // 3. Contexte Médical (si pertinent)
        let medicalContext = "";
        if (userProfile.medical && (query.includes('santé') || query.includes('mal') || query.includes('médicament'))) {
            medicalContext = `\n[DONNÉES MÉDICALES]:
            - Groupe: ${userProfile.medical.bloodType}
            - Allergies: ${userProfile.medical.allergies.join(', ')}
            - Conditions: ${userProfile.medical.conditions.join(', ')}`;
        }

        return `${profileContext}${docContext}${medicalContext}\n`;
    }
}

export const memoryService = new MemoryService();
