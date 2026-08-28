// Replicate (catalogue LLM) — utilise l'endpoint "modèles officiels"
// (POST /v1/models/{owner}/{name}/predictions, sans hash de version requis).
// req.modelId doit être au format "owner/name" (ex. meta/meta-llama-3-70b-instruct).

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

export const replicateAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        if (req.category !== 'llm' || !req.llm) {
            throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
        }
        const prompt = req.llm.messages.map((m) => `${m.role}: ${m.content}`).join('\n');

        const submitRes = await fetch(`https://api.replicate.com/v1/models/${req.modelId}/predictions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, Prefer: 'wait' },
            body: JSON.stringify({ input: { prompt } }),
        });
        if (submitRes.status === 401 || submitRes.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
        if (submitRes.status === 429) throw new AdapterError('Quota ou limite de débit dépassé.', 'rate_limited');
        if (!submitRes.ok) {
            const text = await submitRes.text().catch(() => '');
            throw new AdapterError(`Échec de soumission (${submitRes.status}) : ${text.slice(0, 200)}`, 'other');
        }
        let json = await submitRes.json() as { id: string; status: string; output?: unknown; urls?: { get?: string } };

        for (let i = 0; i < 20 && json.status !== 'succeeded' && json.status !== 'failed' && json.status !== 'canceled'; i++) {
            await new Promise((r) => setTimeout(r, 2000));
            const pollRes = await fetch(json.urls?.get || `https://api.replicate.com/v1/predictions/${json.id}`, {
                headers: { Authorization: `Bearer ${apiKey}` },
            });
            if (!pollRes.ok) continue;
            json = await pollRes.json();
        }
        if (json.status === 'failed' || json.status === 'canceled') {
            throw new AdapterError(`Le job Replicate a échoué (statut: ${json.status}).`, 'other');
        }
        const output = json.output;
        const text = Array.isArray(output) ? output.join('') : String(output ?? '');
        if (!text) throw new AdapterError('Réponse vide du fournisseur.', 'other');
        return { text, raw: json };
    },

    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://api.replicate.com/v1/account', { headers: { Authorization: `Bearer ${apiKey}` } });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
        }
    },
};
