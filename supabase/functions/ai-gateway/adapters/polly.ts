// Amazon Polly (TTS) — nécessite une signature AWS SigV4 (pas de simple clé
// API Bearer). Le champ « clé » de l'écran admin doit contenir les 3 valeurs
// séparées par deux-points : accessKeyId:secretAccessKey:region
// (ex. AKIA...:wJalr...:eu-west-1).

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

async function hmac(key: ArrayBuffer | Uint8Array, data: string): Promise<ArrayBuffer> {
    const cryptoKey = await crypto.subtle.importKey('raw', key as BufferSource, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    return crypto.subtle.sign('HMAC', cryptoKey, new TextEncoder().encode(data));
}

async function sha256Hex(data: string): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
    return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function toHex(buf: ArrayBuffer): string {
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function signPollyRequest(accessKeyId: string, secretAccessKey: string, region: string, body: string) {
    const service = 'polly';
    const host = `polly.${region}.amazonaws.com`;
    const now = new Date();
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
    const dateStamp = amzDate.slice(0, 8);

    const canonicalHeaders = `content-type:application/json\nhost:${host}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = 'content-type;host;x-amz-date';
    const payloadHash = await sha256Hex(body);
    const canonicalRequest = `POST\n/v1/speech\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;

    const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${credentialScope}\n${await sha256Hex(canonicalRequest)}`;

    const kDate = await hmac(new TextEncoder().encode(`AWS4${secretAccessKey}`), dateStamp);
    const kRegion = await hmac(kDate, region);
    const kService = await hmac(kRegion, service);
    const kSigning = await hmac(kService, 'aws4_request');
    const signature = toHex(await hmac(kSigning, stringToSign));

    const authorization = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;
    return { host, amzDate, authorization };
}

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

export const pollyAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        if (req.category !== 'voice' || !req.voice?.text) {
            throw new AdapterError('Texte requis pour la synthèse vocale.', 'other');
        }
        const parts = apiKey.split(':');
        if (parts.length !== 3) {
            throw new AdapterError('Clé Polly invalide — attendu accessKeyId:secretAccessKey:region.', 'auth');
        }
        const [accessKeyId, secretAccessKey, region] = parts;
        const body = JSON.stringify({
            Text: req.voice.text,
            OutputFormat: 'mp3',
            VoiceId: req.voice.voiceId || 'Lea',
            Engine: 'neural',
        });
        const { host, amzDate, authorization } = await signPollyRequest(accessKeyId, secretAccessKey, region, body);

        const res = await fetch(`https://${host}/v1/speech`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Host: host, 'X-Amz-Date': amzDate, Authorization: authorization },
            body,
        });
        if (res.status === 401 || res.status === 403) throw new AdapterError('Identifiants AWS invalides ou refusés.', 'auth');
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new AdapterError(`Réponse inattendue (${res.status}) : ${text.slice(0, 200)}`, 'other');
        }
        const bytes = new Uint8Array(await res.arrayBuffer());
        return { audioBase64: bytesToBase64(bytes) };
    },

    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        const parts = apiKey.split(':');
        if (parts.length !== 3) return { ok: false, message: 'Format attendu : accessKeyId:secretAccessKey:region.' };
        try {
            const [accessKeyId, secretAccessKey, region] = parts;
            const body = JSON.stringify({ Text: 'test', OutputFormat: 'mp3', VoiceId: 'Lea', Engine: 'neural' });
            const { host, amzDate, authorization } = await signPollyRequest(accessKeyId, secretAccessKey, region, body);
            const res = await fetch(`https://${host}/v1/speech`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Host: host, 'X-Amz-Date': amzDate, Authorization: authorization },
                body,
            });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Identifiants AWS invalides ou refusés.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            return { ok: false, message: `Erreur : ${(err as Error).message}` };
        }
    },
};
