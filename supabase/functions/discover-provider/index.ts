// Assistant de découverte automatique de fournisseur IA.
//
// L'admin colle une seule URL (site du fournisseur). Cette fonction :
//  1. explore quelques pages du site (accueil + doc/tarifs/inscription détectées),
//  2. demande à un LLM déjà actif dans l'orchestrateur d'en extraire une fiche
//     structurée (liens utiles + forme technique de l'API principale),
//  3. construit une configuration d'appel générique (adapter_kind='generic_http',
//     interprétée par adapters/generic_http.ts dans ai-gateway — voir ce fichier),
//  4. enregistre tout via la RPC admin-only upsert_discovered_provider.
//
// Le fournisseur apparaît alors dans le tableau de bord comme n'importe quel
// autre : dès que l'admin colle sa clé et l'active, il est utilisable partout
// dans l'app — sans qu'aucun code n'ait été écrit pour lui spécifiquement.

import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), { status, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } });
}

async function fetchWithTimeout(url: string, ms: number): Promise<Response | null> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), ms);
    try {
        return await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MokchatProviderDiscovery/1.0)' },
        });
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
}

function htmlToText(html: string, maxLen: number): string {
    const stripped = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<!--([\s\S]*?)-->/g, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/\s+/g, ' ')
        .trim();
    return stripped.slice(0, maxLen);
}

function extractLinks(html: string, baseUrl: string): { href: string; text: string }[] {
    const links: { href: string; text: string }[] = [];
    const re = /<a\s+[^>]*href=["']([^"'#]+)["'][^>]*>([\s\S]*?)<\/a>/gi;
    let m: RegExpExecArray | null;
    while ((m = re.exec(html)) && links.length < 200) {
        try {
            const href = new URL(m[1], baseUrl).toString();
            const text = m[2].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
            links.push({ href, text });
        } catch { /* lien invalide, ignoré */ }
    }
    return links;
}

function pickCandidates(links: { href: string; text: string }[], keywords: string[]): string[] {
    const scored = links
        .filter((l) => {
            const hay = (l.href + ' ' + l.text).toLowerCase();
            return keywords.some((k) => hay.includes(k));
        })
        .map((l) => l.href);
    return Array.from(new Set(scored)).slice(0, 3);
}

function slugify(input: string): string {
    return input
        .toLowerCase()
        .normalize('NFD').replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40) || 'fournisseur';
}

interface ExtractionResult {
    display_name: string;
    category: 'llm' | 'voice' | 'image_video';
    docs_url: string | null;
    signup_url: string | null;
    api_key_url: string | null;
    billing_url: string | null;
    base_url: string | null;
    auth: { style: 'bearer' | 'header' | 'query' | 'none'; header_name: string | null; query_param: string | null };
    primary_endpoint: {
        method: 'POST' | 'GET';
        path: string | null;
        body_template: Record<string, unknown> | null;
        response_text_path: string | null;
        is_async: boolean;
        job_id_path: string | null;
        poll_path: string | null;
        status_path: string | null;
        done_values: string[] | null;
    } | null;
    confidence: number;
    notes: string;
    missing_fields: { key: string; label: string; hint: string }[];
}

// Appel LLM minimal, indépendant d'ai-gateway (pas d'import inter-fonctions côté
// Edge Functions) : réutilise le même catalogue/Vault, mais ne gère que les 3
// formes déjà connues (gemini / anthropic / openai-compatible) — largement
// suffisant puisque Gemini est garanti actif dans ce projet.
async function callLlmForJson(service: ReturnType<typeof createServiceRoleClient>, prompt: string): Promise<unknown> {
    const { data: candidates } = await service
        .from('ai_providers')
        .select('id, adapter_kind, base_url, ai_provider_credentials!inner(is_enabled)')
        .eq('category', 'llm')
        .eq('status', 'active')
        .eq('ai_provider_credentials.is_enabled', true)
        .order('priority', { ascending: true })
        .limit(1);

    const provider = candidates?.[0];
    if (!provider) throw new Error("Aucun fournisseur LLM actif n'est disponible pour analyser ce site. Activez-en un dans l'orchestrateur (Gemini par exemple) avant d'utiliser la découverte automatique.");

    const { data: apiKey } = await service.rpc('get_ai_provider_secret_internal', { p_provider_id: provider.id });
    if (!apiKey) throw new Error('Clé introuvable pour le fournisseur LLM utilisé pour l\'analyse.');

    if (provider.adapter_kind === 'gemini') {
        const model = 'gemini-2.0-flash';
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                generationConfig: { responseMimeType: 'application/json' },
            }),
        });
        if (!res.ok) throw new Error(`Échec de l'analyse LLM (Gemini, ${res.status}).`);
        const j = await res.json();
        const text = j?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('Réponse vide du LLM d\'analyse.');
        return JSON.parse(text);
    }

    if (provider.adapter_kind === 'anthropic') {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey as string, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-3-5-sonnet-latest', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
        });
        if (!res.ok) throw new Error(`Échec de l'analyse LLM (Anthropic, ${res.status}).`);
        const j = await res.json();
        const text = j?.content?.[0]?.text;
        if (!text) throw new Error('Réponse vide du LLM d\'analyse.');
        const match = text.match(/\{[\s\S]*\}/);
        return JSON.parse(match ? match[0] : text);
    }

    // openai_compatible (couvre aussi DeepSeek, Qwen, Mistral, Grok, OpenRouter, etc.)
    const base = (provider.base_url || 'https://api.openai.com/v1').replace(/\/$/, '');
    const res = await fetch(`${base}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
        }),
    });
    if (!res.ok) throw new Error(`Échec de l'analyse LLM (${res.status}).`);
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content;
    if (!text) throw new Error('Réponse vide du LLM d\'analyse.');
    return JSON.parse(text);
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401);

    const { data: isAdmin } = await userClient.rpc('is_admin');
    if (!isAdmin) return json({ error: 'Accès réservé aux administrateurs.' }, 403);

    let body: { url?: string };
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Corps de requête JSON invalide.' }, 400);
    }
    if (!body.url || !body.url.trim()) return json({ error: 'URL requise.' }, 400);

    let siteUrl: URL;
    try {
        siteUrl = new URL(/^https?:\/\//i.test(body.url.trim()) ? body.url.trim() : `https://${body.url.trim()}`);
    } catch {
        return json({ error: 'URL invalide.' }, 400);
    }

    // 1) Page d'accueil.
    const homeRes = await fetchWithTimeout(siteUrl.toString(), 8000);
    if (!homeRes || !homeRes.ok) {
        return json({ error: `Site injoignable (${homeRes?.status ?? 'timeout'}).` }, 502);
    }
    const homeHtml = await homeRes.text();
    const links = extractLinks(homeHtml, siteUrl.toString());

    // 2) Pages candidates : doc, tarifs, inscription/clé.
    const docCandidates = pickCandidates(links, ['doc', 'api-reference', 'developer', 'reference']);
    const pricingCandidates = pickCandidates(links, ['pricing', 'tarif', 'plans', 'price']);
    const signupCandidates = pickCandidates(links, ['signup', 'sign-up', 'register', 'get-started', 'dashboard', 'console', 'api-key', 'apikey']);
    const extraUrls = Array.from(new Set([...docCandidates, ...pricingCandidates.slice(0, 1), ...signupCandidates.slice(0, 1)])).slice(0, 4);

    const pages: { url: string; text: string }[] = [{ url: siteUrl.toString(), text: htmlToText(homeHtml, 6000) }];
    for (const u of extraUrls) {
        const r = await fetchWithTimeout(u, 6000);
        if (r && r.ok) pages.push({ url: u, text: htmlToText(await r.text(), 6000) });
    }

    const corpus = pages.map((p) => `--- PAGE: ${p.url} ---\n${p.text}`).join('\n\n').slice(0, 22000);
    const allLinksSummary = links.slice(0, 80).map((l) => `${l.text.slice(0, 60)} -> ${l.href}`).join('\n').slice(0, 6000);

    const prompt = `Tu analyses le site web d'un fournisseur d'API IA pour construire une fiche technique exploitable par un programme, sans intervention humaine. Réponds UNIQUEMENT avec un objet JSON valide, sans texte autour, respectant exactement ce schéma :
{
  "display_name": string,
  "category": "llm" | "voice" | "image_video",
  "docs_url": string | null,
  "signup_url": string | null,
  "api_key_url": string | null,
  "billing_url": string | null,
  "base_url": string | null,
  "auth": { "style": "bearer" | "header" | "query" | "none", "header_name": string | null, "query_param": string | null },
  "primary_endpoint": {
    "method": "POST" | "GET",
    "path": string | null,
    "body_template": object | null,
    "response_text_path": string | null,
    "is_async": boolean,
    "job_id_path": string | null,
    "poll_path": string | null,
    "status_path": string | null,
    "done_values": string[] | null
  } | null,
  "confidence": number entre 0 et 1,
  "notes": string courte,
  "missing_fields": [{ "key": string, "label": string, "hint": string }]
}
Règles :
- "category" : llm = génération de texte/chat, voice = synthèse ou transcription vocale, image_video = génération d'image ou de vidéo.
- "primary_endpoint" décrit l'endpoint principal de génération (pas l'authentification ni la liste des modèles). "path" est relatif à base_url (ex. "/v1/chat/completions"). "response_text_path" est le chemin JSON (notation pointée, ex. "choices[0].message.content") vers le texte ou l'URL de résultat dans la réponse.
- Si l'API est asynchrone (soumission d'un job puis sondage), remplis is_async=true, job_id_path, poll_path (chemin relatif, peut contenir {{JOB_ID}}), status_path, done_values.
- "body_template" est un exemple de corps JSON de requête ; utilise exactement les jetons {{MESSAGES}} (tableau de messages), {{PROMPT}}, {{TEXT}}, {{VOICE_ID}}, {{MODEL_ID}} ou {{AUDIO_BASE64}} là où la vraie valeur doit être injectée à l'exécution.
- Si une information ne peut pas être déterminée avec confiance à partir du contenu fourni, mets la valeur à null et ajoute une entrée dans "missing_fields" décrivant précisément ce qui manque, avec un indice pour aider un humain à répondre.
- "confidence" reflète ta certitude globale sur "primary_endpoint" uniquement (pas sur les liens).
- N'invente jamais un chemin d'endpoint que tu n'as pas vu dans le contenu ; dans le doute, laisse à null et documente-le dans missing_fields.

Liens trouvés sur le site (texte -> URL) :
${allLinksSummary}

Contenu textuel des pages :
${corpus}`;

    let extraction: ExtractionResult;
    const service = createServiceRoleClient();
    try {
        extraction = await callLlmForJson(service, prompt) as ExtractionResult;
    } catch (err) {
        return json({ error: (err as Error).message }, 502);
    }

    const hasUsableEndpoint = !!(
        extraction?.primary_endpoint?.path &&
        extraction?.primary_endpoint?.response_text_path &&
        (extraction.confidence ?? 0) >= 0.5
    );
    const discoveryStatus = hasUsableEndpoint ? 'ready' : 'needs_info';

    const missingFields = extraction.missing_fields ?? [];
    if (!hasUsableEndpoint && missingFields.length === 0) {
        missingFields.push({
            key: 'primary_endpoint',
            label: "Endpoint principal de l'API",
            hint: "Collez l'URL de la doc de l'endpoint de génération (méthode, chemin, corps de requête, forme de la réponse).",
        });
    }

    const ep = extraction.primary_endpoint;
    const adapterConfig = ep ? {
        method: ep.method ?? 'POST',
        path: ep.path ?? '',
        headers: {},
        authStyle: extraction.auth?.style ?? 'bearer',
        authHeaderName: extraction.auth?.header_name ?? undefined,
        authQueryParam: extraction.auth?.query_param ?? undefined,
        bodyTemplate: ep.body_template ?? undefined,
        responseTextPath: ep.response_text_path ?? undefined,
        isAsync: ep.is_async ?? false,
        jobIdPath: ep.job_id_path ?? undefined,
        pollPath: ep.poll_path ?? undefined,
        statusPath: ep.status_path ?? undefined,
        doneValues: ep.done_values ?? undefined,
    } : {};

    // Id stable dérivé de l'hôte, pour que ré-analyser la même URL mette à jour la
    // même fiche plutôt que d'en créer une nouvelle.
    let providerId = slugify(siteUrl.hostname.replace(/^www\./, '').split('.')[0] || extraction.display_name);
    const { data: existing } = await service.from('ai_providers').select('id, adapter_kind').eq('id', providerId).maybeSingle();
    if (existing && existing.adapter_kind !== 'generic_http') {
        providerId = `${providerId}-auto`;
    }

    const { error: rpcError } = await userClient.rpc('upsert_discovered_provider', {
        p_id: providerId,
        p_category: extraction.category ?? 'llm',
        p_display_name: extraction.display_name || siteUrl.hostname,
        p_source_url: siteUrl.toString(),
        p_docs_url: extraction.docs_url,
        p_api_key_url: extraction.api_key_url ?? extraction.signup_url,
        p_billing_url: extraction.billing_url,
        p_base_url: extraction.base_url,
        p_discovery_status: discoveryStatus,
        p_discovery_confidence: extraction.confidence ?? null,
        p_discovery_summary: extraction.notes ?? null,
        p_adapter_config: adapterConfig,
        p_missing_fields: missingFields,
    });
    if (rpcError) return json({ error: `Échec de l'enregistrement : ${rpcError.message}` }, 500);

    return json({
        providerId,
        displayName: extraction.display_name || siteUrl.hostname,
        category: extraction.category,
        discoveryStatus,
        confidence: extraction.confidence,
        notes: extraction.notes,
        docsUrl: extraction.docs_url,
        signupUrl: extraction.signup_url,
        apiKeyUrl: extraction.api_key_url,
        billingUrl: extraction.billing_url,
        missingFields,
    });
});
