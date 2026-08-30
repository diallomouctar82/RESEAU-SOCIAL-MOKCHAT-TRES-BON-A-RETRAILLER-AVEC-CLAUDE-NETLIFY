// Adaptateur ElevenLabs (texte -> parole), fournisseur de référence pour la catégorie voix.
// Réponse binaire (audio/mpeg) — encodée en base64 pour transiter dans AdapterResult.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

const DEFAULT_BASE_URL = 'https://api.elevenlabs.io/v1';
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // voix par défaut publique ElevenLabs ("Rachel")

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

export const elevenlabsAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string, baseUrl: string | null): Promise<AdapterResult> {
        if (req.category !== 'voice' || !req.voice?.text) {
            throw new AdapterError('Texte requis pour la synthèse vocale.', 'other');
        }
        const base = baseUrl || DEFAULT_BASE_URL;
        const voiceId = req.voice.voiceId || DEFAULT_VOICE_ID;
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch(`${base}/text-to-speech/${voiceId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey,
                    Accept: 'audio/mpeg',
                },
                // voice_settings uniquement si le client en fournit — les
                // écrans qui n'en passent pas (Experts Diallo) gardent
                // exactement les défauts du fournisseur, comme avant.
                body: JSON.stringify({
                    text: req.voice.text,
                    model_id: req.modelId,
                    ...(req.voice.voiceSettings ? { voice_settings: req.voice.voiceSettings } : {}),
                }),
                signal: controller.signal,
            });
        } catch (err) {
            if ((err as Error).name === 'AbortError') throw new AdapterError('Délai dépassé.', 'timeout');
            throw new AdapterError(`Erreur réseau : ${(err as Error).message}`, 'server_error');
        } finally {
            clearTimeout(timeout);
        }

        // Diagnostic Équipe V (30/08/2026) : ElevenLabs renvoie des 401 pour
        // des raisons très différentes (clé invalide, quota gratuit épuisé,
        // activité jugée inhabituelle) — notre libellé uniforme masquait la
        // vraie cause dans ai_call_log et rendait le problème indiagnosticable
        // (56 échecs « auth » le 30/08 sans qu'on sache pourquoi). On joint
        // désormais le détail du fournisseur, tronqué.
        if (res.status === 401 || res.status === 403) {
            const detail = await res.text().catch(() => '');
            throw new AdapterError(`Clé API invalide ou refusée.${detail ? ` Détail fournisseur : ${detail.slice(0, 180)}` : ''}`, 'auth');
        }
        if (res.status === 429) {
            const detail = await res.text().catch(() => '');
            throw new AdapterError(`Quota ou limite de débit dépassé.${detail ? ` Détail fournisseur : ${detail.slice(0, 180)}` : ''}`, 'rate_limited');
        }
        if (res.status >= 500) throw new AdapterError(`Erreur serveur du fournisseur (${res.status}).`, 'server_error');
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new AdapterError(`Réponse inattendue (${res.status}) : ${text.slice(0, 200)}`, 'other');
        }
        const buf = new Uint8Array(await res.arrayBuffer());
        return { audioBase64: bytesToBase64(buf) };
    },

    async testConnection(apiKey: string, baseUrl: string | null): Promise<{ ok: boolean; message: string }> {
        const base = baseUrl || DEFAULT_BASE_URL;
        try {
            const res = await fetch(`${base}/user`, { headers: { 'xi-api-key': apiKey } });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
        }
    },
};
