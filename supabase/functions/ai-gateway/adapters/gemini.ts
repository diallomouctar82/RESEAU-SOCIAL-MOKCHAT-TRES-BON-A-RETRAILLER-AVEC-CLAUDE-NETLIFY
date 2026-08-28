// Adaptateur Gemini (Google Generative Language API), côté serveur — même logique que
// l'ancien services/ai.ts côté client, mais la clé ne quitte jamais cette fonction.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

const DEFAULT_BASE_URL = 'https://generativelanguage.googleapis.com';

async function generateContent(baseUrl: string, apiKey: string, modelId: string, body: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
        res = await fetch(
            `${baseUrl}/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
                signal: controller.signal,
            },
        );
    } catch (err) {
        if ((err as Error).name === 'AbortError') throw new AdapterError('Délai dépassé.', 'timeout');
        throw new AdapterError(`Erreur réseau : ${(err as Error).message}`, 'server_error');
    } finally {
        clearTimeout(timeout);
    }

    if (res.status === 401 || res.status === 403) {
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        throw new AdapterError(`Clé API refusée (${res.status})${detail ? ` : ${detail}` : ''}`, 'auth');
    }
    if (res.status === 429) throw new AdapterError('Quota ou limite de débit dépassé.', 'rate_limited');
    if (res.status >= 500) throw new AdapterError(`Erreur serveur du fournisseur (${res.status}).`, 'server_error');
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new AdapterError(`Réponse inattendue (${res.status}) : ${text.slice(0, 200)}`, 'other');
    }
    return res.json();
}

export const geminiAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string, baseUrl: string | null): Promise<AdapterResult> {
        if (req.category !== 'llm' || !req.llm) {
            throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
        }
        const systemParts = req.llm.messages.filter((m) => m.role === 'system').map((m) => m.content);
        const contents = req.llm.messages
            .filter((m) => m.role !== 'system')
            .map((m) => {
                // Résultat d'outil : Gemini attend un rôle 'user' portant une
                // functionResponse rattachée au nom de la fonction appelée.
                if (m.role === 'tool') {
                    return {
                        role: 'user',
                        parts: [{ functionResponse: { name: m.toolName ?? 'tool', response: { result: m.content } } }],
                    };
                }
                // Tour d'assistant ayant demandé des outils : on rejoue les
                // functionCall pour que le modèle retrouve le fil de son
                // raisonnement au tour suivant.
                if (m.role === 'assistant' && m.toolCalls?.length) {
                    const parts: Record<string, unknown>[] = m.content ? [{ text: m.content }] : [];
                    for (const tc of m.toolCalls) parts.push({ functionCall: { name: tc.name, args: tc.args } });
                    return { role: 'model', parts };
                }
                return {
                    role: m.role === 'assistant' ? 'model' : 'user',
                    parts: m.imageBase64
                        ? [{ text: m.content }, { inlineData: { mimeType: m.imageMimeType || 'image/jpeg', data: m.imageBase64 } }]
                        : [{ text: m.content }],
                };
            });

        const body: Record<string, unknown> = { contents };
        if (systemParts.length) {
            body.systemInstruction = { parts: [{ text: systemParts.join('\n\n') }] };
        }
        // jsonMode et outils sont incompatibles : forcer une sortie JSON
        // empêcherait le modèle d'émettre un appel d'outil.
        if (req.llm.jsonMode && !req.llm.tools?.length) {
            body.generationConfig = { responseMimeType: 'application/json' };
        }
        if (req.llm.tools?.length) {
            body.tools = [{
                functionDeclarations: req.llm.tools.map((t) => ({
                    name: t.name,
                    description: t.description,
                    parameters: t.parametersSchema,
                })),
            }];
        }

        const data = await generateContent(baseUrl || DEFAULT_BASE_URL, apiKey, req.modelId, body) as {
            candidates?: { content?: { parts?: { text?: string; functionCall?: { name?: string; args?: Record<string, unknown> } }[] } }[];
            usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
        };

        const usage = {
            inputTokens: data.usageMetadata?.promptTokenCount,
            outputTokens: data.usageMetadata?.candidatesTokenCount,
        };

        const parts = data.candidates?.[0]?.content?.parts ?? [];
        const toolCalls = parts
            .filter((p) => p.functionCall?.name)
            .map((p, i) => ({
                id: `gemini_${Date.now()}_${i}`,
                name: p.functionCall!.name!,
                args: p.functionCall!.args ?? {},
            }));
        const text = parts.map((p) => p.text ?? '').join('');

        // Un tour qui ne contient que des appels d'outils est légitime : le
        // modèle attend leur résultat avant de pouvoir répondre.
        if (toolCalls.length) return { text, toolCalls, usage, raw: data };

        if (!text) throw new AdapterError('Réponse vide du fournisseur.', 'other');
        return req.llm.jsonMode ? { json: JSON.parse(text), usage, raw: data } : { text, usage, raw: data };
    },

    async testConnection(apiKey: string, baseUrl: string | null): Promise<{ ok: boolean; message: string }> {
        try {
            await generateContent(baseUrl || DEFAULT_BASE_URL, apiKey, 'gemini-2.5-flash', {
                contents: [{ role: 'user', parts: [{ text: 'ping' }] }],
            });
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            if (err instanceof AdapterError) return { ok: false, message: err.message };
            return { ok: false, message: String(err) };
        }
    },
};
