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

interface GeminiModel {
    name?: string;
    supportedGenerationMethods?: string[];
}

// Modèles Live découverts, mis en cache le temps de vie de l'instance (les
// instances Edge sont recyclées souvent : pas de risque de cache périmé long).
let cachedLiveModels: string[] | null = null;

async function listLiveModels(apiKey: string): Promise<string[]> {
    if (cachedLiveModels) return cachedLiveModels;

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000', {
        headers: { 'x-goog-api-key': apiKey },
    });
    if (!res.ok) {
        console.error(`mint-live-token: ListModels a échoué (${res.status})`, (await res.text().catch(() => '')).slice(0, 300));
        return [];
    }

    const data = await res.json() as { models?: GeminiModel[] };
    const live = (data.models ?? [])
        // `bidiGenerateContent` = capacité Live API (WebSocket bidirectionnel).
        .filter((m) => m.supportedGenerationMethods?.includes('bidiGenerateContent'))
        .map((m) => (m.name ?? '').replace(/^models\//, ''))
        .filter(Boolean);

    console.log(`mint-live-token: ${live.length} modèle(s) Live disponible(s) :`, live.join(', '));
    cachedLiveModels = live;
    return live;
}

/**
 * Choisit le modèle Live à utiliser : celui demandé s'il est réellement
 * disponible, sinon le meilleur candidat (audio natif en priorité — voix plus
 * naturelle et latence plus faible), sinon n'importe quel modèle Live.
 */
async function resolveLiveModel(apiKey: string, requested?: string): Promise<string | null> {
    const available = await listLiveModels(apiKey);
    if (available.length === 0) return requested ?? null;

    if (requested && available.includes(requested)) return requested;

    const nativeAudio = available.filter((m) => m.includes('native-audio'));
    const chosen = nativeAudio[0] ?? available[0];
    if (requested && requested !== chosen) {
        console.log(`mint-live-token: modèle demandé "${requested}" indisponible, bascule sur "${chosen}".`);
    }
    return chosen;
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

    // Le nom des modèles Live est en préversion et change tous les quelques
    // mois (…-09-2025, …-12-2025, gemini-3.1-flash-live-preview…). Le coder en
    // dur garantit une panne à la prochaine rotation : on demande donc à
    // Google la liste réelle des modèles capables de `bidiGenerateContent`
    // et on choisit le meilleur disponible pour CETTE clé.
    const model = await resolveLiveModel(apiKey as string, body.model);
    if (!model) {
        return json({
            error: "Aucun modèle Gemini Live n'est disponible pour cette clé API. Vérifiez que l'API Live (bidiGenerateContent) est activée sur le projet Google associé à la clé.",
        }, 502);
    }

    const now = Date.now();
    const newSessionExpireTime = new Date(now + 60_000).toISOString(); // 1 min pour démarrer la session
    const expireTime = new Date(now + 30 * 60_000).toISOString(); // 30 min de session max

    // Corps = ressource AuthToken. Attention : `liveConnectConstraints` est un
    // nom propre au SDK (qui le traduit avant l'envoi) ; en REST brut il
    // n'existe pas et Google rejette la requête avec
    // « Unknown name "liveConnectConstraints" at 'auth_token' » (400
    // INVALID_ARGUMENT). Le champ REST équivalent est
    // `bidiGenerateContentSetup`.
    //
    // On le laisse volontairement absent : dans ce cas le jeton « allows full
    // flexibility in LiveConnectConfig for each session connection », donc le
    // client fournit sa propre configuration (modèle, voix, instruction) sans
    // risque de divergence avec une contrainte figée côté serveur — cause
    // classique de rejet au moment du WebSocket. La portée du jeton reste
    // étroite : usage unique, 30 min, émis uniquement pour un utilisateur
    // authentifié.
    const payload = {
        uses: 1,
        newSessionExpireTime,
        expireTime,
    };

    const mintRes = await fetch('https://generativelanguage.googleapis.com/v1alpha/auth_tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey as string },
        body: JSON.stringify(payload),
    });

    if (!mintRes.ok) {
        const text = await mintRes.text().catch(() => '');
        // Diagnostic serveur uniquement (jamais la clé) : la vraie raison du refus
        // Google n'atteignait pas les logs jusqu'ici, rendant le débogage impossible.
        // On journalise la requête envoyée (jamais la clé : elle est dans
        // l'en-tête, pas dans le corps) pour pouvoir identifier immédiatement
        // le champ fautif en cas de nouveau rejet.
        console.error(
            `mint-live-token: Google a refusé la génération du jeton (${mintRes.status}) — modèle "${model}" — requête envoyée : ${JSON.stringify(payload)}`,
            text.slice(0, 500),
        );
        if (mintRes.status === 401 || mintRes.status === 403) {
            return json({ error: 'Clé Gemini invalide ou refusée par Google.' }, 502);
        }
        return json({ error: `Échec de génération du jeton Gemini Live (${mintRes.status}) : ${text.slice(0, 300)}` }, 502);
    }

    const mintJson = await mintRes.json() as { name?: string };
    if (!mintJson.name) {
        return json({ error: 'Réponse Gemini sans jeton.' }, 502);
    }

    console.log(`mint-live-token: jeton généré avec succès pour le modèle "${model}".`);

    return json({ token: mintJson.name, model, expiresAt: expireTime });
});
