
import { supabase } from './supabaseClient';

export type AiCategory = 'llm' | 'voice' | 'image_video';

export interface AiProviderModel {
    id: string;
    modelId: string;
    label: string;
    isDefault: boolean;
}

export interface MissingField {
    key: string;
    label: string;
    hint: string;
}

export interface AiProviderRow {
    id: string;
    category: AiCategory;
    displayName: string;
    adapterKind: string;
    priority: number;
    status: 'not_implemented' | 'active';
    apiKeyUrl: string | null;
    billingUrl: string | null;
    docsUrl: string | null;
    models: AiProviderModel[];
    isEnabled: boolean;
    keyHint: string | null;
    lastTestedAt: string | null;
    lastTestStatus: 'success' | 'failure' | null;
    lastTestMessage: string | null;
    // Auto-découverte (adapterKind === 'generic_http') — absent pour les fournisseurs codés en dur.
    discoveryStatus: 'manual' | 'pending' | 'analyzing' | 'ready' | 'needs_info' | 'failed';
    discoveryConfidence: number | null;
    discoverySummary: string | null;
    missingFields: MissingField[];
    authMethod: 'api_key' | 'oauth2' | 'webhook' | 'mcp' | 'unknown';
    pricingSummary: string | null;
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
            apiKeyUrl: p.api_key_url ?? null,
            billingUrl: p.billing_url ?? null,
            docsUrl: p.docs_url ?? null,
            discoveryStatus: p.discovery_status ?? 'manual',
            discoveryConfidence: p.discovery_confidence ?? null,
            discoverySummary: p.discovery_summary ?? null,
            missingFields: (p.missing_fields as MissingField[] | null) ?? [],
            authMethod: p.auth_method ?? 'unknown',
            pricingSummary: p.pricing_summary ?? null,
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

export interface DiscoveryResult {
    providerId: string;
    displayName: string;
    category: AiCategory;
    discoveryStatus: 'ready' | 'needs_info';
    authMethod: 'api_key' | 'oauth2' | 'webhook' | 'mcp' | 'unknown';
    confidence: number | null;
    notes: string | null;
    docsUrl: string | null;
    signupUrl: string | null;
    apiKeyUrl: string | null;
    billingUrl: string | null;
    pricingSummary: string | null;
    modelsDetected: number;
    missingFields: MissingField[];
}

/**
 * Assistant de découverte automatique : l'admin colle une URL, cette fonction
 * explore le site du fournisseur et enregistre directement une fiche exploitable
 * (liens + configuration d'appel générique) — aucun code à écrire. Voir la
 * fonction Edge discover-provider.
 */
export const discoverProvider = async (url: string): Promise<DiscoveryResult> => {
    const { data, error } = await supabase.functions.invoke('discover-provider', { body: { url } });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data as DiscoveryResult;
};

/**
 * Complète manuellement les champs que la découverte automatique n'a pas pu
 * déterminer (adapter_config partiel) puis marque le fournisseur prêt/actif.
 */
export const completeDiscoveredProvider = async (
    providerId: string,
    adapterConfigPatch: Record<string, unknown>,
): Promise<void> => {
    const { data: row, error: fetchError } = await supabase
        .from('ai_providers')
        .select('category, display_name, source_url, docs_url, api_key_url, billing_url, base_url, adapter_config, discovery_confidence, discovery_summary, auth_method, pricing_summary')
        .eq('id', providerId)
        .single();
    if (fetchError || !row) throw fetchError || new Error('Fournisseur introuvable.');

    const mergedConfig = { ...(row.adapter_config as Record<string, unknown>), ...adapterConfigPatch };
    // L'admin qui complète manuellement la config confirme de fait qu'une clé/jeton
    // statique fonctionne (sinon il n'aurait pas pu remplir ces champs) — on repasse
    // donc auth_method à 'api_key' pour que ce fournisseur redevienne activable.
    const { error } = await supabase.rpc('upsert_discovered_provider', {
        p_id: providerId,
        p_category: row.category,
        p_display_name: row.display_name,
        p_source_url: row.source_url,
        p_docs_url: row.docs_url,
        p_api_key_url: row.api_key_url,
        p_billing_url: row.billing_url,
        p_base_url: (adapterConfigPatch.base_url as string | undefined) ?? row.base_url,
        p_discovery_status: 'ready',
        p_discovery_confidence: row.discovery_confidence,
        p_discovery_summary: row.discovery_summary,
        p_adapter_config: mergedConfig,
        p_missing_fields: [],
        p_auth_method: 'api_key',
        p_pricing_summary: row.pricing_summary,
        p_models: [],
    });
    if (error) throw error;
};

export const testProviderConnection = async (providerId: string): Promise<{ ok: boolean; message: string }> => {
    const { data, error } = await supabase.functions.invoke('ai-gateway', {
        body: { mode: 'test', providerId },
    });
    if (error) {
        // Un test qui échoue renvoie un code HTTP non-2xx : supabase-js réduit
        // alors l'erreur au message générique « Edge Function returned a
        // non-2xx status code », et la vraie raison — celle qui dit quoi
        // corriger — reste dans le corps de la réponse. Sans cette lecture,
        // l'administrateur ne voit jamais que ce texte inutile.
        try {
            const body = await (error as { context?: { json?: () => Promise<{ message?: string }> } })
                .context?.json?.();
            if (body?.message) return { ok: false, message: body.message };
        } catch {
            // Corps illisible : on retombe sur le message générique ci-dessous.
        }
        return { ok: false, message: error.message || 'Échec du test de connexion.' };
    }
    return data as { ok: boolean; message: string };
};

/**
 * Renseigne l'identifiant d'espace de travail Anthropic. Une clé « liée à une
 * identité » l'exige dans l'en-tête anthropic-workspace-id, sans quoi chaque
 * appel échoue en 400 — quelle que soit la validité de la clé.
 */
export const setAnthropicWorkspaceId = async (providerId: string, workspaceId: string): Promise<void> => {
    const { error } = await supabase.rpc('set_provider_adapter_config', {
        p_provider_id: providerId,
        p_config: workspaceId.trim() ? { workspaceId: workspaceId.trim() } : {},
    });
    if (error) throw new Error(error.message);
};

/**
 * Enregistre la clé, teste immédiatement la connexion et, si elle est valide,
 * active le fournisseur — en un seul geste pour l'admin. « L'IA colle l'URL, teste
 * la connexion, et si elle est valide, le fournisseur est actif partout » : c'est
 * ce que cette fonction couvre pour l'étape clé -> activation ; la découverte de
 * la config elle-même se fait en amont via discoverProvider().
 */
export const saveKeyTestAndActivate = async (
    providerId: string,
    secret: string,
): Promise<{ ok: boolean; message: string }> => {
    await setProviderSecret(providerId, secret);
    const result = await testProviderConnection(providerId);
    if (result.ok) {
        await setProviderEnabled(providerId, true);
    }
    return result;
};

// ── Boîte à outils des experts ───────────────────────────────────────────────
// Le catalogue d'outils et les autorisations par expert vivent en base
// (ai_tools + agent_tool_grants). L'administrateur ouvre ou ferme un outil pour
// un expert donné depuis la console, sans qu'aucune ligne de code ne change et
// sans redéploiement : l'orchestrateur relit ces droits à chaque appel.

export interface ToolMatrixRow {
    toolId: string;
    displayName: string;
    description: string;
    category: 'search' | 'read' | 'action';
    requiresConfirmation: boolean;
    requiresAuth: boolean;
    /** Interrupteur global : coupe l'outil pour tous les experts d'un coup. */
    toolEnabled: boolean;
    /** agentId -> autorisé. Un expert absent de cette table n'a pas l'outil. */
    grants: Record<string, boolean>;
}

export const listToolMatrix = async (): Promise<ToolMatrixRow[]> => {
    const { data, error } = await supabase.rpc('get_tool_matrix');
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Record<string, unknown>) => ({
        toolId: r.tool_id as string,
        displayName: r.display_name as string,
        description: r.description as string,
        category: r.category as ToolMatrixRow['category'],
        requiresConfirmation: Boolean(r.requires_confirmation),
        requiresAuth: Boolean(r.requires_auth),
        toolEnabled: Boolean(r.tool_enabled),
        grants: (r.grants ?? {}) as Record<string, boolean>,
    }));
};

/** Active ou coupe un outil pour UN expert précis. */
export const setAgentToolEnabled = async (
    agentId: string,
    toolId: string,
    enabled: boolean,
): Promise<void> => {
    const { error } = await supabase.rpc('set_agent_tool_enabled', {
        p_agent_id: agentId,
        p_tool_id: toolId,
        p_enabled: enabled,
    });
    if (error) throw new Error(error.message);
};

/** Interrupteur global d'un outil, tous experts confondus. */
export const setToolEnabled = async (toolId: string, enabled: boolean): Promise<void> => {
    const { error } = await supabase.rpc('set_tool_enabled', {
        p_tool_id: toolId,
        p_enabled: enabled,
    });
    if (error) throw new Error(error.message);
};

// ── Gouvernance des coûts ────────────────────────────────────────────────────
// Plafonds journalier et mensuel, palier tarifaire des fournisseurs, tarifs par
// modèle et journal d'audit des décisions de routage. Tout se règle depuis la
// console : l'orchestrateur relit ces valeurs à chaque appel, sans redéploiement.

export interface AiBudget {
    dailyCapUsd: number | null;
    monthlyCapUsd: number | null;
    /** À false, les plafonds sont conservés mais n'arrêtent plus les appels. */
    enforced: boolean;
    spentToday: number;
    spentMonth: number;
}

export const getBudget = async (): Promise<AiBudget> => {
    const [{ data: budget, error: be }, { data: spend, error: se }] = await Promise.all([
        supabase.from('ai_budget').select('daily_cap_usd, monthly_cap_usd, enforced').eq('id', 'global').maybeSingle(),
        supabase.rpc('get_ai_spend'),
    ]);
    if (be) throw new Error(be.message);
    if (se) throw new Error(se.message);
    const row = Array.isArray(spend) ? spend[0] : spend;
    return {
        dailyCapUsd: budget?.daily_cap_usd == null ? null : Number(budget.daily_cap_usd),
        monthlyCapUsd: budget?.monthly_cap_usd == null ? null : Number(budget.monthly_cap_usd),
        enforced: budget?.enforced ?? true,
        spentToday: Number(row?.spent_today ?? 0),
        spentMonth: Number(row?.spent_month ?? 0),
    };
};

export const setBudget = async (
    dailyCapUsd: number | null,
    monthlyCapUsd: number | null,
    enforced: boolean,
): Promise<void> => {
    const { error } = await supabase.rpc('set_ai_budget', {
        p_daily_cap: dailyCapUsd,
        p_monthly_cap: monthlyCapUsd,
        p_enforced: enforced,
    });
    if (error) throw new Error(error.message);
};

/** 'free' fait passer le fournisseur avant les payants, à priorité égale. */
export const setProviderCostTier = async (providerId: string, tier: 'free' | 'paid'): Promise<void> => {
    const { error } = await supabase.rpc('set_provider_cost_tier', { p_provider_id: providerId, p_tier: tier });
    if (error) throw new Error(error.message);
};

export const setModelCosts = async (
    providerId: string, modelId: string, inputPerMillion: number, outputPerMillion: number,
): Promise<void> => {
    const { error } = await supabase.rpc('set_model_costs', {
        p_provider_id: providerId, p_model_id: modelId,
        p_input: inputPerMillion, p_output: outputPerMillion,
    });
    if (error) throw new Error(error.message);
};

export interface RoutingDecision {
    createdAt: string;
    requestId: string | null;
    category: string | null;
    providerId: string | null;
    modelId: string | null;
    attemptNumber: number;
    status: 'success' | 'error' | 'skipped' | 'blocked';
    decision: string | null;
    decisionReason: string | null;
    errorMessage: string | null;
    latencyMs: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
    costUsd: number;
}

/** Journal d'audit : chaque décision de routage, la plus récente en premier. */
export const listRoutingDecisions = async (limit = 100): Promise<RoutingDecision[]> => {
    const { data, error } = await supabase
        .from('ai_call_log')
        .select('created_at, request_id, category, provider_id, model_id, attempt_number, status, decision, decision_reason, error_message, latency_ms, input_tokens, output_tokens, cost_usd')
        .order('created_at', { ascending: false })
        .limit(limit);
    if (error) throw new Error(error.message);
    return (data ?? []).map((r: Record<string, unknown>) => ({
        createdAt: r.created_at as string,
        requestId: r.request_id as string | null,
        category: r.category as string | null,
        providerId: r.provider_id as string | null,
        modelId: r.model_id as string | null,
        attemptNumber: Number(r.attempt_number ?? 0),
        status: r.status as RoutingDecision['status'],
        decision: r.decision as string | null,
        decisionReason: r.decision_reason as string | null,
        errorMessage: r.error_message as string | null,
        latencyMs: r.latency_ms == null ? null : Number(r.latency_ms),
        inputTokens: r.input_tokens == null ? null : Number(r.input_tokens),
        outputTokens: r.output_tokens == null ? null : Number(r.output_tokens),
        costUsd: Number(r.cost_usd ?? 0),
    }));
};
