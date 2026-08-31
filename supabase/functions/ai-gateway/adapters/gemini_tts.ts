// Synthèse vocale Gemini (API generativelanguage, modèles *-tts) — le SECOURS
// HD réel de la plateforme : quand le quota ElevenLabs est épuisé (mesuré le
// 30-31/08/2026 : « quota_exceeded, 0 credits remaining », tous les
// utilisateurs entendaient la voix de synthèse du navigateur), la boucle de
// bascule de l'orchestrateur peut désormais servir une vraie voix haute
// définition avec la clé Gemini déjà configurée — aucun compte supplémentaire.
//
// Particularité : Gemini TTS renvoie du PCM brut (16 bits, mono, 24 kHz),
// pas un conteneur lisible par <audio>. L'adaptateur fabrique l'en-tête WAV
// (44 octets) et renvoie `audioMimeType: 'audio/wav'` pour que le client joue
// l'audio avec son type réel.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

const TIMEOUT_MS = 30_000;

/** Conversion par blocs : la concaténation caractère par caractère coûtait
 * O(n) allocations sur plusieurs centaines de Ko. */
function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const CHUNK = 8192;
    for (let i = 0; i < bytes.length; i += CHUNK) {
        binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
    }
    return btoa(binary);
}

function base64ToBytes(b64: string): Uint8Array {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
}

/** En-tête WAV standard (RIFF/PCM) devant des échantillons PCM 16 bits mono. */
function pcmToWav(pcm: Uint8Array, sampleRate: number): Uint8Array {
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const header = new ArrayBuffer(44);
    const v = new DataView(header);
    const writeStr = (offset: number, s: string) => { for (let i = 0; i < s.length; i++) v.setUint8(offset + i, s.charCodeAt(i)); };
    writeStr(0, 'RIFF');
    v.setUint32(4, 36 + pcm.length, true);
    writeStr(8, 'WAVE');
    writeStr(12, 'fmt ');
    v.setUint32(16, 16, true);           // taille du bloc fmt
    v.setUint16(20, 1, true);            // PCM linéaire
    v.setUint16(22, numChannels, true);
    v.setUint32(24, sampleRate, true);
    v.setUint32(28, byteRate, true);
    v.setUint16(32, blockAlign, true);
    v.setUint16(34, bitsPerSample, true);
    writeStr(36, 'data');
    v.setUint32(40, pcm.length, true);
    const out = new Uint8Array(44 + pcm.length);
    out.set(new Uint8Array(header), 0);
    out.set(pcm, 44);
    return out;
}

/**
 * Voix Gemini retenue pour une demande. Les identifiants ElevenLabs (chaînes
 * de 20 caractères) n'existent évidemment pas chez Google : on les mappe vers
 * la voix Gemini au caractère le plus proche — jamais un identifiant inventé.
 * Un nom déjà « Gemini » (Fenrir, Kore, Puck...) passe tel quel.
 */
const GEMINI_VOICE_NAMES = new Set([
    'Zephyr', 'Puck', 'Charon', 'Kore', 'Fenrir', 'Leda', 'Orus', 'Aoede',
    'Callirrhoe', 'Autonoe', 'Enceladus', 'Iapetus', 'Umbriel', 'Algieba',
    'Despina', 'Erinome', 'Algenib', 'Rasalgethi', 'Laomedeia', 'Achernar',
    'Alnilam', 'Schedar', 'Gacrux', 'Pulcherrima', 'Achird', 'Zubenelgenubi',
    'Vindemiatrix', 'Sadachbia', 'Sadaltager', 'Sulafat',
]);
const FEMININE_ELEVENLABS_IDS = new Set([
    '21m00Tcm4TlvDq8ikWAM', // Rachel
]);

function resolveGeminiVoice(voiceId?: string): string {
    if (voiceId && GEMINI_VOICE_NAMES.has(voiceId)) return voiceId;
    if (voiceId && FEMININE_ELEVENLABS_IDS.has(voiceId)) return 'Kore';
    // Défaut : Charon — grave, posé, informatif ; le caractère le plus proche
    // de la référence « George » (Professeur Diallo / Architecte).
    return 'Charon';
}

async function readErrorDetail(res: Response): Promise<string> {
    const text = await res.text().catch(() => '');
    return text ? ` Détail fournisseur : ${text.slice(0, 300)}` : '';
}

export const geminiTtsAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        if (req.category !== 'voice' || !req.voice?.text) {
            throw new AdapterError('Texte requis pour la synthèse vocale.', 'other');
        }
        const model = req.modelId || 'gemini-2.5-flash-preview-tts';
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        let res: Response;
        try {
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
                method: 'POST',
                // La clé passe en en-tête, jamais dans l'URL (les URLs finissent
                // dans des journaux ; un en-tête, non).
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: req.voice.text }] }],
                    generationConfig: {
                        responseModalities: ['AUDIO'],
                        speechConfig: {
                            voiceConfig: {
                                prebuiltVoiceConfig: { voiceName: resolveGeminiVoice(req.voice.voiceId) },
                            },
                        },
                    },
                }),
                signal: controller.signal,
            });
        } catch (err) {
            if ((err as Error).name === 'AbortError') throw new AdapterError('Délai dépassé.', 'timeout');
            throw new AdapterError(`Erreur réseau : ${(err as Error).message}`, 'server_error');
        } finally {
            clearTimeout(timeout);
        }

        // Le DÉTAIL du fournisseur est conservé dans le message (même
        // discipline que l'adaptateur ElevenLabs depuis f7439da) : un libellé
        // uniforme rendait la cause indiagnosticable dans ai_call_log.
        if (res.status === 401 || res.status === 403) {
            throw new AdapterError(`Clé API invalide ou refusée.${await readErrorDetail(res)}`, 'auth');
        }
        if (res.status === 429) {
            throw new AdapterError(`Quota ou limite de débit dépassé.${await readErrorDetail(res)}`, 'rate_limited');
        }
        if (!res.ok) {
            throw new AdapterError(`Réponse inattendue (${res.status}).${await readErrorDetail(res)}`, 'other');
        }

        const json = await res.json() as {
            candidates?: { content?: { parts?: { inlineData?: { mimeType?: string; data?: string } }[] } }[];
        };
        const inline = json.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data)?.inlineData;
        if (!inline?.data) throw new AdapterError('Réponse sans audio.', 'other');

        // mimeType typique : "audio/L16;codec=pcm;rate=24000" — PCM brut à
        // envelopper en WAV. Si un jour le modèle renvoyait un conteneur déjà
        // lisible (mp3/wav/ogg), il passerait tel quel avec son vrai type.
        const mime = inline.mimeType || '';
        if (/mpeg|mp3|wav|ogg/i.test(mime)) {
            return { audioBase64: inline.data, audioMimeType: /wav/i.test(mime) ? 'audio/wav' : /ogg/i.test(mime) ? 'audio/ogg' : 'audio/mpeg' };
        }
        const rate = Number(/rate=(\d+)/.exec(mime)?.[1] || 24000);
        const wav = pcmToWav(base64ToBytes(inline.data), rate);
        return { audioBase64: bytesToBase64(wav), audioMimeType: 'audio/wav' };
    },

    async testConnection(apiKey: string): Promise<{ ok: boolean; message: string }> {
        try {
            const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models?pageSize=1', {
                headers: { 'x-goog-api-key': apiKey },
            });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
        }
    },
};
