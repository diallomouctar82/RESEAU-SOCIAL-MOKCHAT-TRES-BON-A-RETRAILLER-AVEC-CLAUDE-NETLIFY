// Google Veo (génération vidéo), via l'API Gemini (opération longue durée).
// Authentification par clé en paramètre d'URL, comme l'adaptateur Gemini —
// forme d'API distincte des autres fournisseurs vidéo (Bearer token).
// Non vérifié avec une clé réelle dans cette session (marqué `unverified`).

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export const veoAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        if (req.category !== 'image_video' || !req.imageVideo) {
            throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
        }
        const modelId = req.modelId || 'veo-3.0-generate-001';

        const submitRes = await fetch(`${BASE_URL}/models/${modelId}:predictLongRunning?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ instances: [{ prompt: req.imageVideo.prompt }], parameters: req.imageVideo.params ?? {} }),
        });
        if (submitRes.status === 401 || submitRes.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
        if (submitRes.status === 429) throw new AdapterError('Quota ou limite de débit dépassé.', 'rate_limited');
        if (!submitRes.ok) {
            const text = await submitRes.text().catch(() => '');
            throw new AdapterError(`Échec de soumission (${submitRes.status}) : ${text.slice(0, 200)}`, 'other');
        }
        const submitJson = await submitRes.json() as { name?: string };
        const operationName = submitJson.name;
        if (!operationName) throw new AdapterError('Opération introuvable dans la réponse.', 'other');

        for (let i = 0; i < 20; i++) {
            await new Promise((r) => setTimeout(r, 5000));
            const pollRes = await fetch(`${BASE_URL}/${operationName}?key=${apiKey}`);
            if (!pollRes.ok) continue;
            const pollJson = await pollRes.json() as {
                done?: boolean;
                error?: { message?: string };
                response?: { generateVideoResponse?: { generatedSamples?: { video?: { uri?: string } }[] } };
            };
            if (pollJson.error) throw new AdapterError(pollJson.error.message || 'Échec de génération vidéo.', 'other');
            if (pollJson.done) {
                const assetUrl = pollJson.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri;
                return { jobId: operationName, assetUrl, raw: pollJson };
            }
        }
        return { jobId: operationName };
    },

    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch(`${BASE_URL}/models?key=${apiKey}`);
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
        }
    },
};
