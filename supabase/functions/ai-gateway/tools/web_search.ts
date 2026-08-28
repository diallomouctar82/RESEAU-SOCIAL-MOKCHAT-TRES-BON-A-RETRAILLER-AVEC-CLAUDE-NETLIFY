// Recherche web réelle, exécutée côté serveur.
//
// Implémentation : le grounding Google Search natif de Gemini. Aucun compte ni
// clé supplémentaire (Brave, Tavily, Serper...) n'est nécessaire — on réutilise
// la clé Gemini déjà enregistrée dans l'orchestrateur.
//
// Point important : cet outil est utilisable par TOUS les fournisseurs. Quand
// c'est OpenAI, Claude ou DeepSeek qui mène la conversation et demande une
// recherche, c'est l'orchestrateur qui exécute la recherche via Gemini puis lui
// renvoie le résultat. La capacité de recherche ne dépend donc pas du modèle
// choisi pour la conversation.

import { ToolExecutionContext, ToolResult } from './types.ts';

interface GroundingChunk {
    web?: { uri?: string; title?: string };
}

export async function executeWebSearch(
    args: Record<string, unknown>,
    ctx: ToolExecutionContext,
): Promise<ToolResult> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) {
        return { ok: false, content: "Requête de recherche vide : préciser ce qui doit être recherché." };
    }
    const pays = typeof args.pays === 'string' && args.pays.trim() ? args.pays.trim() : null;

    // Clé Gemini : on la relit via le même chemin que le reste de
    // l'orchestrateur (Vault), jamais depuis une variable d'environnement.
    const { data: provider } = await ctx.service
        .from('ai_providers')
        .select('id, ai_provider_credentials!inner(is_enabled)')
        .eq('adapter_kind', 'gemini')
        .eq('status', 'active')
        .eq('ai_provider_credentials.is_enabled', true)
        .maybeSingle();

    if (!provider) {
        return {
            ok: false,
            content: "La recherche web est indisponible : aucun fournisseur Gemini actif dans Super Admin → Connecteurs & Modèles IA. Répondre sans inventer de fait vérifiable, et le signaler à la personne.",
        };
    }

    const { data: apiKey } = await ctx.service.rpc('get_ai_provider_secret_internal', {
        p_provider_id: provider.id,
    });
    if (!apiKey) {
        return { ok: false, content: "La recherche web est indisponible (clé Gemini illisible côté serveur)." };
    }

    const prompt = pays
        ? `${query}\n\nContexte géographique : ${pays}. Privilégier les sources officielles de ce pays.`
        : query;

    const res = await fetch(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey as string },
            body: JSON.stringify({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                tools: [{ google_search: {} }],
                generationConfig: { temperature: 0 },
            }),
        },
    );

    if (!res.ok) {
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        console.error(`web_search: échec de la recherche (${res.status})`, detail);
        return { ok: false, content: `La recherche web a échoué (${res.status}). Répondre sans inventer de fait vérifiable et le signaler.` };
    }

    const data = await res.json();
    const candidate = data?.candidates?.[0];
    const text: string = (candidate?.content?.parts ?? [])
        .map((p: { text?: string }) => p.text ?? '')
        .join('')
        .trim();

    // Sources réellement consultées par le grounding : elles permettent à
    // l'expert de citer plutôt que d'affirmer.
    const chunks: GroundingChunk[] = candidate?.groundingMetadata?.groundingChunks ?? [];
    const sources = chunks
        .map((c) => c.web)
        .filter((w): w is { uri?: string; title?: string } => Boolean(w?.uri))
        .map((w) => `- ${w.title ?? 'Source'} : ${w.uri}`);

    // Dédoublonnage : le grounding renvoie souvent plusieurs fois le même site.
    const uniqueSources = [...new Set(sources)].slice(0, 8);

    if (!text) {
        return { ok: false, content: "La recherche n'a rien renvoyé d'exploitable. Le signaler plutôt que de combler par une supposition." };
    }

    const sourcesBlock = uniqueSources.length
        ? `\n\nSOURCES CONSULTÉES (à citer à la personne) :\n${uniqueSources.join('\n')}`
        : "\n\n(Aucune source explicite renvoyée : présenter cette information comme à vérifier.)";

    return {
        ok: true,
        content: `RÉSULTAT DE RECHERCHE WEB pour « ${query} » :\n\n${text}${sourcesBlock}`,
    };
}
