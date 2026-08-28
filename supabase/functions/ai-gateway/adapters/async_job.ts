// Fabrique d'adaptateur générique pour les fournisseurs image/vidéo à API
// asynchrone (soumission d'un job -> sondage périodique -> URL du résultat).
// La forme exacte diffère par fournisseur (chemins JSON, en-têtes d'auth),
// donc paramétrée par une config plutôt que dupliquée fichier par fichier.
//
// IMPORTANT — honnêteté sur le niveau de confiance : ces intégrations sont
// écrites à partir de la documentation publique de chaque fournisseur, sans
// clé réelle pour les tester en direct dans cette session (voir le rapport
// remis à l'utilisateur). Kling et Pika en particulier ont des schémas
// d'authentification qui évoluent ; leur config est marquée `unverified`.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

function getPath(obj: unknown, path: string): unknown {
    return path.split('.').reduce<unknown>((acc, key) => {
        if (acc == null) return undefined;
        const idx = key.match(/^(\w+)\[(\d+)\]$/);
        if (idx) {
            const arr = (acc as Record<string, unknown>)[idx[1]];
            return Array.isArray(arr) ? arr[Number(idx[2])] : undefined;
        }
        return (acc as Record<string, unknown>)[key];
    }, obj);
}

export interface AsyncJobConfig {
    submitUrl: (modelId: string) => string;
    submitHeaders: (apiKey: string) => Record<string, string>;
    submitBody: (req: AdapterRequest, modelId: string) => Record<string, unknown>;
    jobIdPath: string; // chemin dans la réponse de soumission
    pollUrl: (jobId: string) => string;
    pollHeaders: (apiKey: string) => Record<string, string>;
    statusPath: string;
    doneValues: string[];
    failedValues: string[];
    assetUrlPath: string; // chemin dans la réponse de sondage une fois terminé
    testUrl?: (apiKey: string) => string;
    testHeaders?: (apiKey: string) => Record<string, string>;
    maxPolls?: number; // défaut 20
    pollIntervalMs?: number; // défaut 3000
}

export function createAsyncJobAdapter(config: AsyncJobConfig): ProviderAdapter {
    return {
        async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
            if (req.category !== 'image_video' || !req.imageVideo) {
                throw new AdapterError('Catégorie non supportée par cet adaptateur.', 'other');
            }
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 30_000);
            let submitRes: Response;
            try {
                submitRes = await fetch(config.submitUrl(req.modelId), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', ...config.submitHeaders(apiKey) },
                    body: JSON.stringify(config.submitBody(req, req.modelId)),
                    signal: controller.signal,
                });
            } catch (err) {
                throw new AdapterError(`Erreur réseau (soumission) : ${(err as Error).message}`, 'server_error');
            } finally {
                clearTimeout(timeout);
            }

            if (submitRes.status === 401 || submitRes.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
            if (submitRes.status === 429) throw new AdapterError('Quota ou limite de débit dépassé.', 'rate_limited');
            if (!submitRes.ok) {
                const text = await submitRes.text().catch(() => '');
                throw new AdapterError(`Échec de soumission (${submitRes.status}) : ${text.slice(0, 200)}`, 'other');
            }
            const submitJson = await submitRes.json();
            const jobId = String(getPath(submitJson, config.jobIdPath) ?? '');
            if (!jobId) throw new AdapterError('Identifiant de job introuvable dans la réponse.', 'other');

            const maxPolls = config.maxPolls ?? 20;
            const intervalMs = config.pollIntervalMs ?? 3000;
            for (let i = 0; i < maxPolls; i++) {
                await new Promise((r) => setTimeout(r, intervalMs));
                const pollRes = await fetch(config.pollUrl(jobId), { headers: config.pollHeaders(apiKey) });
                if (!pollRes.ok) continue;
                const pollJson = await pollRes.json();
                const status = String(getPath(pollJson, config.statusPath) ?? '').toLowerCase();
                if (config.failedValues.some((v) => v.toLowerCase() === status)) {
                    throw new AdapterError(`Le job a échoué côté fournisseur (statut: ${status}).`, 'other');
                }
                if (config.doneValues.some((v) => v.toLowerCase() === status)) {
                    const assetUrl = getPath(pollJson, config.assetUrlPath) as string | undefined;
                    return { jobId, assetUrl, raw: pollJson };
                }
            }
            // Pas encore terminé après le nombre de tentatives : on renvoie l'ID de job,
            // l'appelant peut sonder plus tard — ce n'est pas un échec.
            return { jobId };
        },

        async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
            if (!config.testUrl) return { ok: true, message: 'Clé enregistrée (test de connexion non disponible pour ce fournisseur).' };
            try {
                const res = await fetch(config.testUrl(apiKey), { headers: config.testHeaders?.(apiKey) ?? {} });
                if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
                if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
                return { ok: true, message: 'Connexion réussie.' };
            } catch (err) {
                return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
            }
        },
    };
}
