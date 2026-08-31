// Adaptateur générique pour tout fournisseur exposant une API compatible OpenAI
// (POST {baseUrl}/chat/completions). Couvre : OpenAI, DeepSeek, Qwen (DashScope
// compatible-mode), Kimi (Moonshot), Mistral, Grok (xAI), OpenRouter, Together AI,
// Fireworks AI, Cerebras — un seul fichier, paramétré par baseUrl à l'appel.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter, parseJsonModeText } from './types.ts';

async function chatCompletions(baseUrl: string, apiKey: string, body: Record<string, unknown>) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
        res = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
        });
    } catch (err) {
        if ((err as Error).name === 'AbortError') {
            throw new AdapterError('Délai dépassé.', 'timeout');
        }
        throw new AdapterError(`Erreur réseau : ${(err as Error).message}`, 'server_error');
    } finally {
        clearTimeout(timeout);
    }

    if (res.status === 401 || res.status === 403) {
        // Le message du fournisseur est indispensable au diagnostic : une clé
        // révoquée, une clé de projet exigeant un en-tête d'organisation et un
        // compte sans crédit donnent tous un 401, avec des remèdes différents.
        // Le corps d'erreur ne contient jamais la clé elle-même.
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        throw new AdapterError(
            `Clé API refusée (${res.status})${detail ? ` : ${detail}` : ''}`,
            'auth',
        );
    }
    if (res.status === 429) {
        // « Crédit épuisé » et « trop de requêtes par minute » donnent tous deux
        // un 429 mais appellent des actions opposées : recharger le compte, ou
        // simplement ralentir. Sans le message du fournisseur, impossible de
        // savoir lequel — et l'administrateur cherche au mauvais endroit.
        const detail = (await res.text().catch(() => '')).slice(0, 300);
        throw new AdapterError(
            `Quota ou limite de débit dépassé${detail ? ` : ${detail}` : ''}`,
            'rate_limited',
        );
    }
    if (res.status >= 500) {
        throw new AdapterError(`Erreur serveur du fournisseur (${res.status}).`, 'server_error');
    }
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new AdapterError(`Réponse inattendue (${res.status}) : ${text.slice(0, 200)}`, 'other');
    }
    return res.json();
}

export const openaiCompatibleAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string, baseUrl: string | null): Promise<AdapterResult> {
        if (!baseUrl) throw new AdapterError('base_url manquant pour ce fournisseur.', 'other');
        if (req.category !== 'llm' || !req.llm) {
            throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
        }
        // Format vision OpenAI : le contenu d'un message devient un tableau de
        // blocs {type:'text'|'image_url'} dès qu'une image lui est jointe ; les
        // autres messages restent de simples chaînes (compatible avec tous les
        // fournisseurs de ce cluster, y compris ceux qui ignorent les images).
        const messages = req.llm.messages.map((m) => {
            // Résultat d'outil : rôle dédié, rattaché par tool_call_id.
            if (m.role === 'tool') {
                return { role: 'tool', tool_call_id: m.toolCallId, content: m.content };
            }
            // Tour d'assistant ayant demandé des outils : on rejoue les tool_calls.
            if (m.role === 'assistant' && m.toolCalls?.length) {
                return {
                    role: 'assistant',
                    content: m.content || null,
                    tool_calls: m.toolCalls.map((tc) => ({
                        id: tc.id,
                        type: 'function',
                        function: { name: tc.name, arguments: JSON.stringify(tc.args) },
                    })),
                };
            }
            return m.imageBase64
                ? {
                    role: m.role,
                    content: [
                        { type: 'text', text: m.content },
                        { type: 'image_url', image_url: { url: `data:${m.imageMimeType || 'image/jpeg'};base64,${m.imageBase64}` } },
                    ],
                }
                : { role: m.role, content: m.content };
        });
        const body: Record<string, unknown> = {
            model: req.modelId,
            messages,
        };
        // jsonMode et outils sont incompatibles : imposer un objet JSON en
        // sortie empêcherait le modèle d'émettre un appel d'outil.
        if (req.llm.jsonMode && !req.llm.tools?.length) {
            body.response_format = { type: 'json_object' };
        }
        if (req.llm.tools?.length) {
            body.tools = req.llm.tools.map((t) => ({
                type: 'function',
                function: { name: t.name, description: t.description, parameters: t.parametersSchema },
            }));
            body.tool_choice = 'auto';
        }
        const data = await chatCompletions(baseUrl, apiKey, body) as {
            choices?: { message?: {
                content?: string;
                tool_calls?: { id?: string; function?: { name?: string; arguments?: string } }[];
            } }[];
            usage?: { prompt_tokens?: number; completion_tokens?: number };
        };
        const message = data.choices?.[0]?.message;
        const content = message?.content ?? '';
        const usage = {
            inputTokens: data.usage?.prompt_tokens,
            outputTokens: data.usage?.completion_tokens,
        };

        const rawCalls = message?.tool_calls ?? [];
        if (rawCalls.length) {
            const toolCalls = rawCalls
                .filter((c) => c.function?.name)
                .map((c, i) => {
                    let args: Record<string, unknown> = {};
                    try {
                        args = c.function?.arguments ? JSON.parse(c.function.arguments) : {};
                    } catch {
                        // Arguments malformés : on transmet un objet vide plutôt que
                        // de faire échouer tout le tour ; l'exécuteur signalera le
                        // paramètre manquant au modèle.
                    }
                    return { id: c.id ?? `call_${Date.now()}_${i}`, name: c.function!.name!, args };
                });
            if (toolCalls.length) return { text: content, toolCalls, usage, raw: data };
        }

        if (!content) {
            throw new AdapterError('Réponse vide du fournisseur.', 'other');
        }
        return req.llm.jsonMode
            ? { json: parseJsonModeText(content), usage, raw: data }
            : { text: content, usage, raw: data };
    },

    async testConnection(apiKey: string, baseUrl: string | null): Promise<{ ok: boolean; message: string }> {
        if (!baseUrl) return { ok: false, message: 'base_url manquant pour ce fournisseur.' };
        try {
            await chatCompletions(baseUrl, apiKey, {
                model: 'test',
                messages: [{ role: 'user', content: 'ping' }],
                max_tokens: 1,
            });
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            if (err instanceof AdapterError) {
                // Une erreur portant sur le MODÈLE confirme que la clé est
                // acceptée : on ne peut pas connaître un vrai model_id sans
                // configuration admin. En revanche, toute autre erreur 400
                // (organisation manquante, permission refusée, compte non
                // provisionné) est un vrai défaut : la signaler plutôt que
                // d'afficher un succès, qui laisserait le fournisseur au vert
                // dans la console alors que chaque appel échouera.
                if (err.errorClass === 'other' && /model/i.test(err.message)) {
                    return { ok: true, message: 'Clé acceptée par le fournisseur (modèle de test non résolu, normal).' };
                }
                return { ok: false, message: err.message };
            }
            return { ok: false, message: String(err) };
        }
    },
};
