import { cloudService } from './cloud';
import { UserProfile, StoredDocument, ActiveMemoryItem } from '../types';
import { INITIAL_ACTIVE_MEMORIES } from '../constants';

export interface MemoryMessage {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    image?: string;
    groundingSources?: { title: string, uri: string }[];
}

class MemoryService {
    private readonly STORAGE_KEY_PREFIX = 'chat_history_';
    private readonly ACTIVE_MEMORY_KEY = 'lmav_active_memory_v1';
    private memoryCache: ActiveMemoryItem[] | null = null;

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
     * Récupère la liste des éléments de mémoire active
     */
    async getActiveMemories(): Promise<ActiveMemoryItem[]> {
        if (this.memoryCache) return this.memoryCache;
        try {
            const stored = localStorage.getItem(this.ACTIVE_MEMORY_KEY);
            if (stored) {
                this.memoryCache = JSON.parse(stored);
                return this.memoryCache || INITIAL_ACTIVE_MEMORIES;
            }
            this.memoryCache = [...INITIAL_ACTIVE_MEMORIES];
            this.persistActiveMemories();
            return this.memoryCache;
        } catch (e) {
            return INITIAL_ACTIVE_MEMORIES;
        }
    }

    /**
     * Ajoute ou met à jour un élément de mémoire active
     */
    async addOrUpdateMemory(item: Omit<ActiveMemoryItem, 'id' | 'timestamp'> & { id?: string }): Promise<ActiveMemoryItem> {
        const list = await this.getActiveMemories();
        const existingIndex = item.id ? list.findIndex(m => m.id === item.id) : -1;

        const updatedItem: ActiveMemoryItem = {
            id: item.id || `mem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            category: item.category,
            key: item.key,
            value: item.value,
            agentId: item.agentId,
            dossierId: item.dossierId,
            timestamp: new Date().toLocaleDateString('fr-FR'),
            verified: item.verified ?? true,
            confidence: item.confidence ?? 0.95
        };

        if (existingIndex >= 0) {
            list[existingIndex] = updatedItem;
        } else {
            list.unshift(updatedItem);
        }

        this.memoryCache = list;
        this.persistActiveMemories();
        return updatedItem;
    }

    /**
     * Supprime un élément de mémoire active
     */
    async deleteMemory(id: string): Promise<boolean> {
        const list = await this.getActiveMemories();
        const filtered = list.filter(m => m.id !== id);
        this.memoryCache = filtered;
        this.persistActiveMemories();
        return true;
    }

    /**
     * Réinitialise la mémoire active
     */
    async resetMemories(): Promise<void> {
        this.memoryCache = [...INITIAL_ACTIVE_MEMORIES];
        this.persistActiveMemories();
    }

    private persistActiveMemories() {
        if (this.memoryCache) {
            try {
                localStorage.setItem(this.ACTIVE_MEMORY_KEY, JSON.stringify(this.memoryCache));
            } catch (e) {
                console.error("Erreur sauvegarde locale mémoire", e);
            }
        }
    }

    /**
     * RAG SYSTEM: Récupère le contexte pertinent basé sur la requête utilisateur
     * Scanne le Profil, le Coffre-fort, les Dossiers et la Mémoire Active structurée.
     */
    async retrieveContext(query: string, userProfile: UserProfile, currentDossierId?: string): Promise<string> {
        // 1. Récupération des métadonnées de documents pertinents
        const files = await cloudService.getAllFiles();
        const queryLower = query.toLowerCase();

        const relevantDocs = files.filter((f: any) => 
            queryLower.includes(f.category?.toLowerCase() || '') || 
            queryLower.includes('document') ||
            queryLower.includes('contrat') ||
            queryLower.includes('dossier') ||
            queryLower.includes('pdf') ||
            queryLower.includes('statut')
        );

        let docContext = "";
        if (relevantDocs.length > 0) {
            docContext = `\n[DOCUMENTS DISPONIBLES DANS LE BUREAU NUMÉRIQUE]:\n${relevantDocs.map((d: any) => `- ${d.name} (${d.category})`).join('\n')}`;
        }

        // 2. Contexte de la Mémoire Active Structurée
        const activeMemories = await this.getActiveMemories();
        const relevantMemories = activeMemories.filter(m => 
            (currentDossierId && m.dossierId === currentDossierId) ||
            queryLower.includes(m.key.toLowerCase()) ||
            queryLower.includes(m.category.toLowerCase()) ||
            m.category === 'objective' ||
            m.category === 'decision'
        );

        let memoryContext = "";
        if (relevantMemories.length > 0) {
            memoryContext = `\n[MÉMOIRE ACTIVE STRUCTURÉE DU PARCOURS]:\n${relevantMemories.slice(0, 6).map(m => `• [${m.category.toUpperCase()}] ${m.key}: ${m.value}`).join('\n')}`;
        }

        // 3. Contexte du Profil
        const profileContext = `\n[PROFIL UTILISATEUR & CADRE]:
- Nom: ${userProfile.name}
- Titre: ${userProfile.title}
- Niveau d'Expérience: ${userProfile.level}
- Compétences: ${userProfile.skills?.join(', ') || 'Polyvalent'}
- ID Citoyen: ${userProfile.citizenshipId}
- Nationalité / Résidence: Paris, France (Adaptation locale active)`;

        // 4. Contexte Médical (si pertinent)
        let medicalContext = "";
        if (userProfile.medical && (queryLower.includes('santé') || queryLower.includes('mal') || queryLower.includes('médicament') || queryLower.includes('soin'))) {
            medicalContext = `\n[DONNÉES MÉDICALES D'URGENCE]:
- Groupe Sanguin: ${userProfile.medical.bloodType}
- Allergies: ${userProfile.medical.allergies.join(', ')}
- Conditions: ${userProfile.medical.conditions.join(', ')}`;
        }

        return `${profileContext}${memoryContext}${docContext}${medicalContext}\n`;
    }
}

export const memoryService = new MemoryService();
