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

    if (res.status === 401 || res.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
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
            .map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: m.imageBase64
                    ? [{ text: m.content }, { inlineData: { mimeType: m.imageMimeType || 'image/jpeg', data: m.imageBase64 } }]
                    : [{ text: m.content }],
            }));

        const body: Record<string, unknown> = { contents };
        if (systemParts.length) {
            body.systemInstruction = { parts: [{ text: systemParts.join('\n\n') }] };
        }
        if (req.llm.jsonMode) {
            body.generationConfig = { responseMimeType: 'application/json' };
        }

        const data = await generateContent(baseUrl || DEFAULT_BASE_URL, apiKey, req.modelId, body) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        if (!text) throw new AdapterError('Réponse vide du fournisseur.', 'other');
        return req.llm.jsonMode ? { json: JSON.parse(text), raw: data } : { text, raw: data };
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
