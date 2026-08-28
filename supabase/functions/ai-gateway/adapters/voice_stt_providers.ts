// Fournisseurs voix parole -> texte (transcription/STT) : Whisper (OpenAI),
// Deepgram, AssemblyAI. Prennent audioBase64 en entrée, renvoient `text`.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

function base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

function requireAudio(req: AdapterRequest): { audioBase64: string; mimeType: string } {
    if (req.category !== 'voice' || !req.voice?.audioBase64) {
        throw new AdapterError('Audio requis pour la transcription.', 'other');
    }
    return { audioBase64: req.voice.audioBase64, mimeType: req.voice.audioMimeType || 'audio/webm' };
}

export const whisperAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        const { audioBase64, mimeType } = requireAudio(req);
        const form = new FormData();
        form.append('file', new Blob([base64ToBytes(audioBase64)], { type: mimeType }), 'audio.webm');
        form.append('model', req.modelId || 'whisper-1');

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
                method: 'POST',
                headers: { Authorization: `Bearer ${apiKey}` },
                body: form,
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
        if (!res.ok) throw new AdapterError(`Réponse inattendue (${res.status}).`, 'other');
        const json = await res.json() as { text?: string };
        return { text: json.text || '' };
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) { return { ok: false, message: `Erreur réseau : ${(err as Error).message}` }; }
    },
};

export const deepgramAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        const { audioBase64, mimeType } = requireAudio(req);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch('https://api.deepgram.com/v1/listen?model=nova-2&language=fr', {
                method: 'POST',
                headers: { Authorization: `Token ${apiKey}`, 'Content-Type': mimeType },
                body: base64ToBytes(audioBase64),
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
        if (!res.ok) throw new AdapterError(`Réponse inattendue (${res.status}).`, 'other');
        const json = await res.json() as { results?: { channels?: { alternatives?: { transcript?: string }[] }[] } };
        const text = json.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
        return { text, raw: json };
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://api.deepgram.com/v1/projects', { headers: { Authorization: `Token ${apiKey}` } });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) { return { ok: false, message: `Erreur réseau : ${(err as Error).message}` }; }
    },
};

export const assemblyaiAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        const { audioBase64 } = requireAudio(req);
        const headers = { Authorization: apiKey };

        // 1) Upload de l'audio
        const uploadRes = await fetch('https://api.assemblyai.com/v2/upload', {
            method: 'POST', headers, body: base64ToBytes(audioBase64),
        });
        if (uploadRes.status === 401 || uploadRes.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
        if (!uploadRes.ok) throw new AdapterError(`Échec de l'envoi audio (${uploadRes.status}).`, 'other');
        const { upload_url } = await uploadRes.json() as { upload_url: string };

        // 2) Soumission du job de transcription
        const submitRes = await fetch('https://api.assemblyai.com/v2/transcript', {
            method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ audio_url: upload_url, language_code: 'fr' }),
        });
        if (!submitRes.ok) throw new AdapterError(`Échec de soumission (${submitRes.status}).`, 'other');
        const { id } = await submitRes.json() as { id: string };

        // 3) Sondage
        for (let i = 0; i < 20; i++) {
            await new Promise((r) => setTimeout(r, 3000));
            const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${id}`, { headers });
            if (!pollRes.ok) continue;
            const pollJson = await pollRes.json() as { status: string; text?: string; error?: string };
            if (pollJson.status === 'error') throw new AdapterError(pollJson.error || 'Échec de transcription.', 'other');
            if (pollJson.status === 'completed') return { text: pollJson.text || '', jobId: id };
        }
        return { jobId: id };
    },
    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://api.assemblyai.com/v2/transcript?limit=1', { headers: { Authorization: apiKey } });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) { return { ok: false, message: `Erreur réseau : ${(err as Error).message}` }; }
    },
};
