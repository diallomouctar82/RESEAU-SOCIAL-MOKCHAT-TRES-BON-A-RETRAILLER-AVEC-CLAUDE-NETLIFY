// Émet un jeton éphémère pour l'API Gemini Live (appel vocal/vidéo en direct,
// Experts IA), à partir de la clé Gemini enregistrée dans l'orchestrateur
// (Super Admin → Connecteurs & Modèles IA), jamais depuis une variable
// d'environnement de build séparée.
//
// Pourquoi un jeton éphémère plutôt que la clé brute : l'API Gemini Live se
// connecte directement depuis le navigateur (WebSocket bidirectionnel, non
// proxyable simplement comme les autres catégories de l'orchestrateur). Un
// jeton éphémère (1 usage, expire vite) évite d'exposer la clé permanente
// dans le client — voir https://ai.google.dev/gemini-api/docs/ephemeral-tokens.
//
// Accès : tout utilisateur authentifié (même politique que ai-gateway en
// mode 'call') — c'est ce qui permet à un fournisseur Gemini activé par
// l'admin de rendre les appels vocaux immédiatement opérationnels partout.

import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401);

    const service = createServiceRoleClient();

    const { data: provider } = await service
        .from('ai_providers')
        .select('id, ai_provider_credentials!inner(is_enabled)')
        .eq('adapter_kind', 'gemini')
        .eq('status', 'active')
        .eq('ai_provider_credentials.is_enabled', true)
        .maybeSingle();

    if (!provider) {
        return json({
            error: "Aucune clé Gemini active n'est configurée. Un administrateur doit en ajouter une dans Super Admin → Connecteurs & Modèles IA → Gemini pour activer les appels vocaux Experts IA.",
        }, 503);
    }

    const { data: apiKey, error: secretError } = await service.rpc(
        'get_ai_provider_secret_internal',
        { p_provider_id: provider.id },
    );
    if (secretError || !apiKey) {
        return json({ error: 'Clé Gemini introuvable côté serveur.' }, 503);
    }

    let body: { model?: string } = {};
    try {
        body = await req.json();
    } catch { /* corps optionnel */ }
    const model = body.model || 'gemini-2.5-flash-native-audio-preview-09-2025';

    const now = Date.now();
    const newSessionExpireTime = new Date(now + 60_000).toISOString(); // 1 min pour démarrer la session
    const expireTime = new Date(now + 30 * 60_000).toISOString(); // 30 min de session max

    // v1beta rejette liveConnectConstraints ("Unknown name ... Cannot find
    // field.") : ce champ n'existe que sur v1alpha, seule version où les
    // jetons éphémères Live API sont exposés pour l'instant (fonctionnalité
    // expérimentale, Gemini Developer API uniquement — pas Vertex AI).
    const mintRes = await fetch('https://generativelanguage.googleapis.com/v1alpha/auth_tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey as string },
        body: JSON.stringify({
            uses: 1,
            newSessionExpireTime,
            expireTime,
            liveConnectConstraints: {
                model,
                config: { responseModalities: ['AUDIO'] },
            },
        }),
    });

    if (!mintRes.ok) {
        const text = await mintRes.text().catch(() => '');
        // Diagnostic serveur uniquement (jamais la clé) : la vraie raison du refus
        // Google n'atteignait pas les logs jusqu'ici, rendant le débogage impossible.
        console.error(`mint-live-token: Google a refusé la génération du jeton (${mintRes.status})`, text.slice(0, 500));
        if (mintRes.status === 401 || mintRes.status === 403) {
            return json({ error: 'Clé Gemini invalide ou refusée par Google.' }, 502);
        }
        return json({ error: `Échec de génération du jeton Gemini Live (${mintRes.status}) : ${text.slice(0, 300)}` }, 502);
    }

    const mintJson = await mintRes.json() as { name?: string };
    if (!mintJson.name) {
        return json({ error: 'Réponse Gemini sans jeton.' }, 502);
    }

    return json({ token: mintJson.name, model, expiresAt: expireTime });
});
