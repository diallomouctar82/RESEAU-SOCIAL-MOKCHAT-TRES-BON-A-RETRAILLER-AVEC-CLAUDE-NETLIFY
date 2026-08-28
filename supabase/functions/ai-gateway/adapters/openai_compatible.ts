// Adaptateur générique pour tout fournisseur exposant une API compatible OpenAI
// (POST {baseUrl}/chat/completions). Couvre : OpenAI, DeepSeek, Qwen (DashScope
// compatible-mode), Kimi (Moonshot), Mistral, Grok (xAI), OpenRouter, Together AI,
// Fireworks AI, Cerebras — un seul fichier, paramétré par baseUrl à l'appel.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

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
        throw new AdapterError('Clé API invalide ou refusée.', 'auth');
    }
    if (res.status === 429) {
        throw new AdapterError('Quota ou limite de débit dépassé.', 'rate_limited');
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
        const messages = req.llm.messages.map((m) =>
            m.imageBase64
                ? {
                    role: m.role,
                    content: [
                        { type: 'text', text: m.content },
                        { type: 'image_url', image_url: { url: `data:${m.imageMimeType || 'image/jpeg'};base64,${m.imageBase64}` } },
                    ],
                }
                : { role: m.role, content: m.content }
        );
        const body: Record<string, unknown> = {
            model: req.modelId,
            messages,
        };
        if (req.llm.jsonMode) {
            body.response_format = { type: 'json_object' };
        }
        const data = await chatCompletions(baseUrl, apiKey, body) as {
            choices?: { message?: { content?: string } }[];
        };
        const content = data.choices?.[0]?.message?.content ?? '';
        if (!content) {
            throw new AdapterError('Réponse vide du fournisseur.', 'other');
        }
        return req.llm.jsonMode
            ? { json: JSON.parse(content), raw: data }
            : { text: content, raw: data };
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
                // Une erreur "modèle inconnu" (400) confirme quand même que la clé est acceptée
                // par le fournisseur — on ne peut pas connaître un vrai model_id sans config admin.
                if (err.errorClass === 'other') {
                    return { ok: true, message: 'Clé acceptée par le fournisseur (modèle de test non résolu, normal).' };
                }
                return { ok: false, message: err.message };
            }
            return { ok: false, message: String(err) };
        }
    },
};
