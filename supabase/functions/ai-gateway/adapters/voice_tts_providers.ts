// Fournisseurs voix texte -> parole (TTS) restants : Cartesia, PlayHT,
// Azure Speech, Google TTS. Amazon Polly nécessite une signature AWS SigV4
// (voir polly.ts, dédié). Chaque fournisseur a sa propre forme de requête ;
// tous renvoient de l'audio binaire encodé en base64.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

async function fetchAudio(url: string, init: RequestInit): Promise<Uint8Array> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);
    let res: Response;
    try {
        res = await fetch(url, { ...init, signal: controller.signal });
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
    return new Uint8Array(await res.arrayBuffer());
}

function requireText(req: AdapterRequest): string {
    if (req.category !== 'voice' || !req.voice?.text) {
        throw new AdapterError('Texte requis pour la synthèse vocale.', 'other');
    }
    return req.voice.text;
}

export const cartesiaAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        const text = requireText(req);
        const bytes = await fetchAudio('https://api.cartesia.ai/tts/bytes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'X-API-Key': apiKey, 'Cartesia-Version': '2024-11-13' },
            body: JSON.stringify({
                model_id: req.modelId || 'sonic-2',
                transcript: text,
                voice: { mode: 'id', id: req.voice!.voiceId || 'a0e99841-438c-4a64-b679-ae501e7d6091' },
                output_format: { container: 'mp3', encoding: 'mp3', sample_rate: 44100 },
            }),
        });
        return { audioBase64: bytesToBase64(bytes) };
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://api.cartesia.ai/voices', { headers: { 'X-API-Key': apiKey, 'Cartesia-Version': '2024-11-13' } });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) { return { ok: false, message: `Erreur réseau : ${(err as Error).message}` }; }
    },
};

export const playhtAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        const text = requireText(req);
        // PlayHT nécessite AUSSI un "User-Id" distinct de la clé — non modélisé
        // par notre système à une seule clé par fournisseur ; à défaut on tente
        // sans, ce qui échouera proprement (erreur 'auth' catchée par la bascule)
        // tant que l'admin n'aura pas fourni les deux valeurs concaténées
        // (ex. "userId:apiKey") dans le champ clé.
        const [maybeUserId, maybeKey] = apiKey.includes(':') ? apiKey.split(/:(.+)/) : [undefined, apiKey];
        const bytes = await fetchAudio('https://api.play.ht/api/v2/tts/stream', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: maybeKey,
                ...(maybeUserId ? { 'X-User-Id': maybeUserId } : {}),
            },
            body: JSON.stringify({ text, voice: req.voice!.voiceId || 'larry', voice_engine: req.modelId || 'PlayHT2.0' }),
        });
        return { audioBase64: bytesToBase64(bytes) };
    },
    async testConnection(): Promise<{ ok: boolean; message: string }> {
        return { ok: true, message: "Clé enregistrée. PlayHT nécessite Api-Key ET User-Id — saisir sous la forme userId:apiKey si le test échoue." };
    },
};

export const azureSpeechAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string, baseUrl: string | null): Promise<AdapterResult> {
        const text = requireText(req);
        // La clé Azure doit inclure la région sous la forme "region:key" (aucun
        // champ région séparé dans notre modèle à une seule clé par fournisseur).
        const [region, key] = apiKey.includes(':') ? apiKey.split(':') : ['eastus', apiKey];
        const ssml = `<speak version='1.0' xml:lang='fr-FR'><voice xml:lang='fr-FR' name='${req.voice!.voiceId || 'fr-FR-DeniseNeural'}'>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</voice></speak>`;
        const bytes = await fetchAudio(`https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`, {
            method: 'POST',
            headers: {
                'Ocp-Apim-Subscription-Key': key,
                'Content-Type': 'application/ssml+xml',
                'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
            },
            body: ssml,
        });
        return { audioBase64: bytesToBase64(bytes) };
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        const [region, key] = apiKey.includes(':') ? apiKey.split(':') : ['eastus', apiKey];
        try {
            const res = await fetch(`https://${region}.api.cognitive.microsoft.com/sts/v1.0/issuetoken`, {
                method: 'POST', headers: { 'Ocp-Apim-Subscription-Key': key },
            });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}). Saisir la clé sous la forme region:cle si besoin.` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) { return { ok: false, message: `Erreur réseau : ${(err as Error).message}` }; }
    },
};

export const googleTtsAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        const text = requireText(req);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    input: { text },
                    voice: { languageCode: 'fr-FR', name: req.voice!.voiceId || 'fr-FR-Neural2-A' },
                    audioConfig: { audioEncoding: 'MP3' },
                }),
                signal: controller.signal,
            });
        } catch (err) {
            if ((err as Error).name === 'AbortError') throw new AdapterError('Délai dépassé.', 'timeout');
            throw new AdapterError(`Erreur réseau : ${(err as Error).message}`, 'server_error');
        } finally {
            clearTimeout(timeout);
        }
        if (res.status === 401 || res.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
        if (!res.ok) throw new AdapterError(`Réponse inattendue (${res.status}).`, 'other');
        const json = await res.json() as { audioContent?: string };
        if (!json.audioContent) throw new AdapterError('Réponse sans audio.', 'other');
        return { audioBase64: json.audioContent }; // déjà en base64 côté Google
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`);
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) { return { ok: false, message: `Erreur réseau : ${(err as Error).message}` }; }
    },
};
