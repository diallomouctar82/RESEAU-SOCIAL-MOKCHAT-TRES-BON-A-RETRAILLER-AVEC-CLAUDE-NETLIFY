import { UserProfile, ActiveMemoryItem } from '../types';
import { cloudService } from './cloud';
import { supabaseService } from './supabaseClient';

/**
 * LOOP 12/17 (moteur de mémoire contextuelle, fondation) : la Mémoire
 * Active (consommée par ExpertsHub.tsx, WorldHub.tsx, ParcoursDetailView.tsx
 * et services/dossierService.ts) vivait entièrement dans
 * `localStorage['lmav_active_memory_v1']` — une clé plate, jamais scindée
 * par utilisateur (sur un appareil partagé, un second compte hérite
 * silencieusement de la mémoire du premier), et pré-remplie pour tout
 * nouveau compte réel avec un scénario agroalimentaire entièrement fictif
 * (`constants.ts::INITIAL_ACTIVE_MEMORIES`, supprimé par cette LOOP).
 * Remplacée par la table réelle `user_memory` (RLS owner-only) —
 * `setCurrentUserId` est appelé depuis `GlobalContext.tsx` dès que
 * l'authentification est connue, exactement comme le fait déjà l'attache
 * Realtime des notifications dans ce même fichier.
 *
 * Signatures externes volontairement inchangées (aucun appelant existant
 * n'a besoin d'être modifié) : seul l'utilisateur courant, gardé en
 * mémoire de service, détermine désormais où lire/écrire.
 */
class MemoryService {
    private currentUserId: string | null = null;

    setCurrentUserId(userId: string | null) {
        this.currentUserId = userId;
    }

    /**
     * LOOP 13/17 (multi-appareils) : notifie `onChange` à chaque
     * insertion/modification/suppression de mémoire pour l'utilisateur
     * courant, sur N'IMPORTE QUEL appareil — l'appelant décide comment
     * réagir (typiquement re-fetch via `getActiveMemories()`). Retourne un
     * no-op si aucun utilisateur n'est connu.
     */
    subscribeToChanges(onChange: () => void): () => void {
        if (!this.currentUserId) return () => {};
        return supabaseService.subscribeToMemoryChanges(this.currentUserId, onChange);
    }

    private mapRow(row: any): ActiveMemoryItem {
        return {
            id: row.id,
            category: row.category,
            key: row.key,
            value: row.value,
            agentId: row.agent_id || undefined,
            dossierId: row.dossier_id || undefined,
            layer: row.layer || undefined,
            timestamp: new Date(row.created_at).toLocaleDateString('fr-FR'),
            verified: row.verified,
            confidence: row.confidence != null ? Number(row.confidence) : 0.95,
        };
    }

    /**
     * Aucun utilisateur connecté → liste vide, jamais un scénario fictif de
     * remplacement (voir suppression d'`INITIAL_ACTIVE_MEMORIES` ci-dessus).
     */
    async getActiveMemories(): Promise<ActiveMemoryItem[]> {
        if (!this.currentUserId) return [];
        const rows = await supabaseService.getMemories(this.currentUserId);
        return rows.map((r) => this.mapRow(r));
    }

    /**
     * `scope` déduit du contexte plutôt qu'ajouté comme nouveau paramètre
     * (aucun appelant existant ne le fournit) : `category==='preference'`
     * est une préférence durable (LOOP 13/17 — une correction sur la même
     * clé remplace la valeur au lieu de s'empiler, index unique partiel
     * côté base) ; un élément rattaché à un dossier est un jalon de
     * parcours (`project`, historique préservé) ; sinon, une activité
     * ponctuelle (`recent_activity`, historique préservé).
     */
    /**
     * `verified` et `confidence` sont facultatifs à l'appel : la table
     * `user_memory` porte déjà les bons défauts (`verified` = true,
     * `confidence` nullable). Les rendre obligatoires ici forçait les
     * appelants à inventer un score de confiance qu'ils ne mesurent pas.
     */
    async addOrUpdateMemory(
        item: Omit<ActiveMemoryItem, 'id' | 'timestamp' | 'verified' | 'confidence'>
            & { id?: string; verified?: boolean; confidence?: number }
    ): Promise<ActiveMemoryItem> {
        if (!this.currentUserId) {
            throw new Error("Impossible d'enregistrer un élément de mémoire sans utilisateur connecté.");
        }
        const scope = item.category === 'preference' ? 'durable_preference' : (item.dossierId ? 'project' : 'recent_activity');
        const row = await supabaseService.upsertMemory(this.currentUserId, {
            id: item.id,
            scope,
            category: item.category,
            key: item.key,
            value: item.value,
            agentId: item.agentId,
            dossierId: item.dossierId,
            layer: item.layer,
            verified: item.verified,
            confidence: item.confidence,
        });
        if (!row) throw new Error("Échec de l'enregistrement de la mémoire.");
        return this.mapRow(row);
    }

    async deleteMemory(id: string): Promise<boolean> {
        if (!this.currentUserId) return false;
        await supabaseService.deleteMemory(this.currentUserId, id);
        return true;
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
        // LOOP 12/17 : la ligne "Résidence" affichait auparavant
        // "Paris, France" codé en dur pour CHAQUE utilisateur, quel que soit
        // son vrai pays/ville réels (colonnes `country`/`city` pourtant déjà
        // présentes sur `UserProfile`) — une donnée fabriquée injectée dans
        // le contexte envoyé au LLM à chaque appel. Utilise désormais les
        // vraies valeurs, avec un repli honnête si elles ne sont pas renseignées.
        const location = [userProfile.city, userProfile.country].filter(Boolean).join(', ');
        const profileContext = `\n[PROFIL UTILISATEUR & CADRE]:
- Nom: ${userProfile.name}
- Titre: ${userProfile.title}
- Niveau d'Expérience: ${userProfile.level}
- Compétences: ${userProfile.skills && userProfile.skills.length > 0 ? userProfile.skills.map(s => s.name).join(', ') : 'Non renseignées'}
- ID Citoyen: ${userProfile.citizenshipId}
- Résidence: ${location || 'Non renseignée'}`;

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
