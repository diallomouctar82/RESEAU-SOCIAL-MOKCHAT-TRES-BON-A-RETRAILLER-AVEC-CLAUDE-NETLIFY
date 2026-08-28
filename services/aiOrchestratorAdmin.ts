
import { supabase } from './supabaseClient';

export type AiCategory = 'llm' | 'voice' | 'image_video';

export interface AiProviderModel {
    id: string;
    modelId: string;
    label: string;
    isDefault: boolean;
}

export interface AiProviderRow {
    id: string;
    category: AiCategory;
    displayName: string;
    adapterKind: string;
    priority: number;
    status: 'not_implemented' | 'active';
    models: AiProviderModel[];
    isEnabled: boolean;
    keyHint: string | null;
    lastTestedAt: string | null;
    lastTestStatus: 'success' | 'failure' | null;
    lastTestMessage: string | null;
}

/**
 * Combine le catalogue (ai_providers/ai_models, lisible en RLS par un admin) avec le
 * statut des identifiants (get_ai_provider_status(), qui ne renvoie jamais le secret
 * lui-même — seulement un indice et l'état de la dernière tentative de connexion).
 */
export const listProviders = async (): Promise<AiProviderRow[]> => {
    const [{ data: providers, error: providersError }, { data: models }, { data: status, error: statusError }] =
        await Promise.all([
            supabase.from('ai_providers').select('*').order('category').order('priority'),
            supabase.from('ai_models').select('*'),
            supabase.rpc('get_ai_provider_status'),
        ]);

    if (providersError || !providers) {
        console.error('Erreur chargement catalogue orchestrateur IA:', providersError);
        throw providersError || new Error('Catalogue introuvable.');
    }
    if (statusError) {
        console.error('Erreur chargement statut identifiants orchestrateur IA:', statusError);
    }

    const statusByProvider = new Map((status || []).map((s: any) => [s.provider_id, s]));

    return providers.map((p) => {
        const s = statusByProvider.get(p.id);
        return {
            id: p.id,
            category: p.category,
            displayName: p.display_name,
            adapterKind: p.adapter_kind,
            priority: p.priority,
            status: p.status,
            models: (models || [])
                .filter((m) => m.provider_id === p.id)
                .map((m) => ({ id: m.id, modelId: m.model_id, label: m.label, isDefault: m.is_default })),
            isEnabled: s?.is_enabled ?? false,
            keyHint: s?.key_hint ?? null,
            lastTestedAt: s?.last_tested_at ?? null,
            lastTestStatus: s?.last_test_status ?? null,
            lastTestMessage: s?.last_test_message ?? null,
        };
    });
};

export const setProviderSecret = async (providerId: string, secret: string): Promise<void> => {
    const { error } = await supabase.rpc('set_ai_provider_secret', { p_provider_id: providerId, p_secret: secret });
    if (error) throw error;
};

export const setProviderEnabled = async (providerId: string, enabled: boolean): Promise<void> => {
    const { error } = await supabase.rpc('set_ai_provider_enabled', { p_provider_id: providerId, p_enabled: enabled });
    if (error) throw error;
};

export const setProviderPriority = async (providerId: string, priority: number): Promise<void> => {
    const { error } = await supabase.rpc('set_ai_provider_priority', { p_provider_id: providerId, p_priority: priority });
    if (error) throw error;
};

export const testProviderConnection = async (providerId: string): Promise<{ ok: boolean; message: string }> => {
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { mode: 'test', providerId },
    });
    if (error) {
        return { ok: false, message: error.message || 'Échec du test de connexion.' };
    }
    return data as { ok: boolean; message: string };
};
