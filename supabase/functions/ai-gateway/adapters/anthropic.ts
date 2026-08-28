// Adaptateur Claude (Anthropic Messages API) — forme de requête distincte d'OpenAI :
// `system` est un champ séparé, pas un message, et le contenu de la réponse est un tableau de blocs.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

const DEFAULT_BASE_URL = 'https://api.anthropic.com';

async function messages(baseUrl: string, apiKey: string, body: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
        res = await fetch(`${baseUrl}/v1/messages`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (err) {
        if ((err as Error).name === 'AbortError') throw new AdapterError('Délai dépassé.', 'timeout');
        throw new AdapterError(`Erreur réseau : ${(err as Error).message}`, 'server_error');
    } finally {
        clearTimeout(timeout);
    }

    if (res.status === 401 || res.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
    if (res.status === 429) throw new AdapterError('Quota ou limite de débit dépassé.', 'rate_limited');
    if (res.status >= 500) throw new AdapterError(`Erreur serveur du fournisseur (${res.status}).`, 'server_error');
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new AdapterError(`Réponse inattendue (${res.status}) : ${text.slice(0, 200)}`, 'other');
    }
    return res.json();
}

function splitSystem(msgs: { role: string; content: string; imageBase64?: string; imageMimeType?: string }[]) {
    const systemParts = msgs.filter((m) => m.role === 'system').map((m) => m.content);
    const rest = msgs
        .filter((m) => m.role !== 'system')
        .map((m) => {
            // Résultat d'outil : bloc tool_result porté par un tour 'user'.
            if (m.role === 'tool') {
                return {
                    role: 'user',
                    content: [{ type: 'tool_result', tool_use_id: m.toolCallId, content: m.content }],
                };
            }
            // Tour d'assistant ayant demandé des outils : blocs tool_use rejoués.
            if (m.role === 'assistant' && m.toolCalls?.length) {
                const blocks: Record<string, unknown>[] = m.content ? [{ type: 'text', text: m.content }] : [];
                for (const tc of m.toolCalls) {
                    blocks.push({ type: 'tool_use', id: tc.id, name: tc.name, input: tc.args });
                }
                return { role: 'assistant', content: blocks };
            }
            return {
                role: m.role === 'assistant' ? 'assistant' : 'user',
                content: m.imageBase64
                    ? [
                        { type: 'text', text: m.content },
                        { type: 'image', source: { type: 'base64', media_type: m.imageMimeType || 'image/jpeg', data: m.imageBase64 } },
                    ]
                    : m.content,
            };
        });
    return { system: systemParts.join('\n\n') || undefined, rest };
}

export const anthropicAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string, baseUrl: string | null): Promise<AdapterResult> {
        if (req.category !== 'llm' || !req.llm) {
            throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
        }
        const { system, rest } = splitSystem(req.llm.messages);
        const payload: Record<string, unknown> = {
            model: req.modelId,
            system,
            messages: rest,
            max_tokens: 4096,
        };
        if (req.llm.tools?.length) {
            payload.tools = req.llm.tools.map((t) => ({
                name: t.name,
                description: t.description,
                input_schema: t.parametersSchema,
            }));
        }
        const data = await messages(baseUrl || DEFAULT_BASE_URL, apiKey, payload) as {
            content?: { type: string; text?: string; id?: string; name?: string; input?: Record<string, unknown> }[];
            usage?: { input_tokens?: number; output_tokens?: number };
        };
        const blocks = data.content ?? [];
        const text = blocks.filter((b) => b.type === 'text').map((b) => b.text ?? '').join('');
        const usage = {
            inputTokens: data.usage?.input_tokens,
            outputTokens: data.usage?.output_tokens,
        };

        const toolCalls = blocks
            .filter((b) => b.type === 'tool_use' && b.name)
            .map((b, i) => ({ id: b.id ?? `toolu_${Date.now()}_${i}`, name: b.name!, args: b.input ?? {} }));
        if (toolCalls.length) return { text, toolCalls, usage, raw: data };

        if (!text) throw new AdapterError('Réponse vide du fournisseur.', 'other');
        return req.llm.jsonMode ? { json: JSON.parse(text), usage, raw: data } : { text, usage, raw: data };
    },

    async testConnection(apiKey: string, baseUrl: string | null): Promise<{ ok: boolean; message: string }> {
        try {
            await messages(baseUrl || DEFAULT_BASE_URL, apiKey, {
                model: 'claude-haiku-4-5-20251001',
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 1,
            });
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            if (err instanceof AdapterError) {
                // On ne peut pas deviner un vrai model_id sans configuration
                // admin : une erreur portant sur le MODÈLE prouve donc que la
                // clé a été acceptée. Toute autre erreur 400 (identifiant
                // d'espace de travail manquant, permission refusée...) est un
                // vrai défaut de configuration : la signaler au lieu d'afficher
                // un succès trompeur, qui laisserait croire le fournisseur
                // opérationnel alors que chaque appel échouera.
                if (err.errorClass === 'other' && /model/i.test(err.message)) {
                    return { ok: true, message: 'Clé acceptée par le fournisseur (modèle de test non résolu, normal).' };
                }
                return { ok: false, message: err.message };
            }
            return { ok: false, message: String(err) };
        }
    },
};
