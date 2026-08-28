
import { supabase } from './supabaseClient';

/**
 * Point d'entrée client vers l'orchestrateur IA (Edge Function ai-gateway).
 * Sélectionne automatiquement le meilleur fournisseur actif et configuré
 * pour la catégorie demandée, avec bascule automatique en cas d'échec.
 * Dès qu'un admin active un fournisseur (clé + interrupteur) dans la
 * Console Super Admin, tout code qui appelle cette fonction en bénéficie
 * immédiatement, sans redéploiement.
 *
 * NB : accès réservé aux administrateurs côté serveur (ai-gateway vérifie
 * is_admin()) — utilisée pour l'instant par les fonctionnalités déjà
 * migrées vers l'orchestrateur (voir docs/SUPABASE_ARCHITECTURE.md §9).
 * Les autres fonctionnalités IA de l'app continuent d'appeler Gemini
 * directement tant qu'elles n'ont pas été migrées une à une.
 */
export const callAiGatewayText = async (
    messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
    options?: { providerId?: string; modelId?: string; jsonMode?: boolean }
): Promise<string> => {
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: {
            mode: 'call',
            category: 'llm',
            providerId: options?.providerId,
            modelId: options?.modelId,
            request: { messages, jsonMode: options?.jsonMode },
        },
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data?.result?.text ?? '';
};
