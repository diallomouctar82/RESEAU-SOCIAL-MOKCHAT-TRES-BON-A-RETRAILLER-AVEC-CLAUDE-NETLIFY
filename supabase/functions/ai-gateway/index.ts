// Point d'entrée unique de l'orchestrateur IA. Reçoit soit un appel de génération
// (mode 'call', sélection automatique + bascule sur échec/quota/indisponibilité),
// soit un test de connexion pour l'écran admin (mode 'test').
//
// Sécurité : cette fonction est le SEUL endroit où une clé fournisseur est déchiffrée.
// Le client (navigateur) n'obtient jamais la clé, seulement le résultat de l'appel IA.

import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';
import { resolveAdapter } from './adapters/registry.ts';
import { AdapterError, AdapterRequest } from './adapters/types.ts';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}

interface GatewayBody {
    mode?: 'call' | 'test';
    category?: 'llm' | 'voice' | 'image_video';
    providerId?: string; // forcer un fournisseur précis (pas de bascule) — sinon sélection auto
    modelId?: string;
    request?: AdapterRequest['llm'] | AdapterRequest['voice'] | AdapterRequest['imageVideo'];
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401);

    let body: GatewayBody;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Corps de requête JSON invalide.' }, 400);
    }

    const service = createServiceRoleClient();
    const requestedBy = authData.user.id;

    // Le test de connexion et la gestion des clés restent réservés aux admins
    // (voir aussi les RPC set_ai_provider_*, admin-only côté base). La
    // génération elle-même (mode 'call' ci-dessous) est ouverte à tout
    // utilisateur authentifié : c'est ce qui permet à un fournisseur activé
    // par l'admin de devenir immédiatement utilisable par toute l'application.
    if (body.mode === 'test') {
        const { data: isAdmin, error: adminCheckError } = await userClient.rpc('is_admin');
        if (adminCheckError || !isAdmin) return json({ error: 'Accès réservé aux administrateurs.' }, 403);
        if (!body.providerId) return json({ error: 'providerId requis en mode test.' }, 400);
        const result = await testProvider(service, body.providerId);
        return json(result, result.ok ? 200 : 400);
    }

    if (!body.category) return json({ error: 'category requis.' }, 400);

    const { data: candidates, error: candidatesError } = await service
        .from('ai_providers')
        .select('id, adapter_kind, base_url, priority, ai_provider_credentials!inner(is_enabled)')
        .eq('category', body.category)
        .eq('status', 'active')
        .eq('ai_provider_credentials.is_enabled', true)
        .order('priority', { ascending: true });

    if (candidatesError) return json({ error: `Erreur catalogue : ${candidatesError.message}` }, 500);

    const ordered = body.providerId
        ? (candidates ?? []).filter((c) => c.id === body.providerId)
        : (candidates ?? []);

    if (ordered.length === 0) {
        return json({ error: 'Aucun fournisseur actif et configuré pour cette catégorie.' }, 503);
    }

    const attempts: { providerId: string; errorClass: string; message: string }[] = [];

    for (let i = 0; i < ordered.length; i++) {
        const provider = ordered[i];
        const attemptNumber = i + 1;
        const startedAt = Date.now();
        try {
            const { data: apiKey, error: secretError } = await service.rpc(
                'get_ai_provider_secret_internal',
                { p_provider_id: provider.id },
            );
            if (secretError || !apiKey) throw new AdapterError('Clé introuvable.', 'auth');

            const adapter = resolveAdapter(provider.adapter_kind);
            const modelId = body.modelId ?? (await defaultModelId(service, provider.id));
            if (!modelId) throw new AdapterError('Aucun modèle configuré pour ce fournisseur.', 'other');

            const adapterRequest: AdapterRequest = {
                category: body.category,
                modelId,
                ...(body.category === 'llm' ? { llm: body.request as AdapterRequest['llm'] } : {}),
                ...(body.category === 'voice' ? { voice: body.request as AdapterRequest['voice'] } : {}),
                ...(body.category === 'image_video' ? { imageVideo: body.request as AdapterRequest['imageVideo'] } : {}),
            };

            const result = await adapter.call(adapterRequest, apiKey as string, provider.base_url);

            await logCall(service, {
                category: body.category, providerId: provider.id, modelId, attemptNumber,
                status: 'success', latencyMs: Date.now() - startedAt, requestedBy,
            });

            return json({ providerId: provider.id, modelId, attempts: attemptNumber, result });
        } catch (err) {
            const adapterErr = err instanceof AdapterError ? err : new AdapterError(String(err), 'other');
            attempts.push({ providerId: provider.id, errorClass: adapterErr.errorClass, message: adapterErr.message });
            await logCall(service, {
                category: body.category, providerId: provider.id, modelId: body.modelId ?? null,
                attemptNumber, status: 'error', errorClass: adapterErr.errorClass,
                errorMessage: adapterErr.message, latencyMs: Date.now() - startedAt, requestedBy,
            });
            // Bascule automatique : on continue sur le fournisseur suivant, quelle que soit la cause.
        }
    }

    return json({ error: 'Tous les fournisseurs disponibles ont échoué.', attempts }, 502);
});

async function defaultModelId(service: ReturnType<typeof createServiceRoleClient>, providerId: string) {
    const { data } = await service
        .from('ai_models')
        .select('model_id')
        .eq('provider_id', providerId)
        .eq('is_default', true)
        .maybeSingle();
    return data?.model_id ?? null;
}

async function testProvider(service: ReturnType<typeof createServiceRoleClient>, providerId: string) {
    const { data: provider, error: providerError } = await service
        .from('ai_providers')
        .select('id, adapter_kind, base_url')
        .eq('id', providerId)
        .maybeSingle();
    if (providerError || !provider) return { ok: false, message: 'Fournisseur inconnu.' };

    const { data: apiKey, error: secretError } = await service.rpc(
        'get_ai_provider_secret_internal',
        { p_provider_id: providerId },
    );
    if (secretError || !apiKey) return { ok: false, message: 'Aucune clé configurée pour ce fournisseur.' };

    const adapter = resolveAdapter(provider.adapter_kind);
    const outcome = await adapter.testConnection(apiKey as string, provider.base_url);

    await service
        .from('ai_provider_credentials')
        .update({
            last_tested_at: new Date().toISOString(),
            last_test_status: outcome.ok ? 'success' : 'failure',
            last_test_message: outcome.message,
        })
        .eq('provider_id', providerId);

    return outcome;
}

async function logCall(
    service: ReturnType<typeof createServiceRoleClient>,
    entry: {
        category: string; providerId: string; modelId: string | null; attemptNumber: number;
        status: 'success' | 'error'; errorClass?: string; errorMessage?: string;
        latencyMs: number; requestedBy: string;
    },
) {
    await service.from('ai_call_log').insert({
        category: entry.category,
        provider_id: entry.providerId,
        model_id: entry.modelId,
        attempt_number: entry.attemptNumber,
        status: entry.status,
        error_class: entry.errorClass ?? null,
        error_message: entry.errorMessage ?? null,
        latency_ms: entry.latencyMs,
        requested_by: entry.requestedBy,
    });
}
