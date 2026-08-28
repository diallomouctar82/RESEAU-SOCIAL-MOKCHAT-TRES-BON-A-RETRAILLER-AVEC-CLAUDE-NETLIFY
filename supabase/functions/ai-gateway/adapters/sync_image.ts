// Fournisseurs image à réponse synchrone (pas de sondage nécessaire) :
// Ideogram et Recraft renvoient l'URL de l'image directement dans la
// réponse de génération.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    let res: Response;
    try {
        res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...headers },
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
    if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new AdapterError(`Réponse inattendue (${res.status}) : ${text.slice(0, 200)}`, 'other');
    }
    return res.json();
}

export const ideogramAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        if (req.category !== 'image_video' || !req.imageVideo) {
            throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
        }
        const data = await postJson('https://api.ideogram.ai/generate', { 'Api-Key': apiKey }, {
            image_request: { prompt: req.imageVideo.prompt, model: req.modelId, ...(req.imageVideo.params ?? {}) },
        }) as { data?: { url?: string }[] };
        const assetUrl = data.data?.[0]?.url;
        if (!assetUrl) throw new AdapterError('Réponse sans URL image.', 'other');
        return { assetUrl, raw: data };
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://api.ideogram.ai/generate', { method: 'POST', headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' }, body: '{}' });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            return { ok: true, message: 'Clé acceptée par le fournisseur.' };
        } catch (err) {
            return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
        }
    },
};

export const recraftAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        if (req.category !== 'image_video' || !req.imageVideo) {
            throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
        }
        const data = await postJson('https://external.api.recraft.ai/v1/images/generations', { Authorization: `Bearer ${apiKey}` }, {
            prompt: req.imageVideo.prompt, model: req.modelId || 'recraftv3', ...(req.imageVideo.params ?? {}),
        }) as { data?: { url?: string }[] };
        const assetUrl = data.data?.[0]?.url;
        if (!assetUrl) throw new AdapterError('Réponse sans URL image.', 'other');
        return { assetUrl, raw: data };
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://external.api.recraft.ai/v1/users/me', { headers: { Authorization: `Bearer ${apiKey}` } });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
        }
    },
};
