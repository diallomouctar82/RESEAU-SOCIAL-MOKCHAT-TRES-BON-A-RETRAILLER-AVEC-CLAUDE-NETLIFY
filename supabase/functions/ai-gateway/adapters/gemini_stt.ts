// Transcription (parole → texte) par Gemini multimodal, avec traduction
// facultative dans la même réponse. C'est l'adaptateur qui rend l'interprète
// d'appel et la transcription des vocaux indépendants de la reconnaissance
// vocale du navigateur — absente ou muette sur la plupart des téléphones
// (mesuré avant cette mission : zéro appel STT journalisé, l'interprète ne
// s'était jamais déclenché en dehors d'un Chrome de bureau).
//
// Entrée : audio en base64 (WAV de préférence — le client fabrique lui-même
// des segments PCM 16 kHz), indication de langue et langue cible
// facultatives. Sortie : { text, language, translated } — JSON strict demandé
// au modèle (responseMimeType application/json), lu de manière tolérante
// (parseJsonModeText). Rien n'est inventé : audio sans parole → text vide.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter, parseJsonModeText } from './types.ts';

const TIMEOUT_MS = 30_000;

// Types MIME acceptés par l'API (WAV, MP3, AIFF, AAC, OGG, FLAC) + normalisation
// des variantes courantes envoyées par les navigateurs.
const MIME_ALIASES = new Map<string, string>([
    ['audio/wav', 'audio/wav'], ['audio/x-wav', 'audio/wav'], ['audio/wave', 'audio/wav'], ['audio/vnd.wave', 'audio/wav'],
    ['audio/mpeg', 'audio/mp3'], ['audio/mp3', 'audio/mp3'],
    ['audio/ogg', 'audio/ogg'], ['audio/flac', 'audio/flac'], ['audio/x-flac', 'audio/flac'],
    ['audio/aac', 'audio/aac'], ['audio/mp4', 'audio/aac'], ['audio/x-m4a', 'audio/aac'], ['audio/m4a', 'audio/aac'],
    ['audio/aiff', 'audio/aiff'], ['audio/x-aiff', 'audio/aiff'],
]);

function normalizeMime(mime: string): string {
    const base = mime.split(';')[0].trim().toLowerCase();
    return MIME_ALIASES.get(base) ?? base;
}

function buildPrompt(languageHint?: string, targetLanguage?: string): string {
    const lines = [
        "Tu es un moteur de transcription. Transcris fidèlement et intégralement la parole de cet enregistrement, dans la langue réellement parlée, sans rien ajouter, résumer, censurer ni corriger.",
        'Réponds UNIQUEMENT par un objet JSON de la forme {"text": string, "language": string, "translated": string | null}.',
        '- text : la transcription exacte ; chaîne vide "" s\'il n\'y a aucune parole intelligible (bruit, silence, musique).',
        '- language : le code ISO 639-1 de la langue parlée (fr, en, es, ar, ru, zh, ...) ; chaîne vide si text est vide.',
    ];
    if (languageHint) {
        lines.push(`- Indication (pas une certitude) : la langue attendue est probablement « ${languageHint} ». Si une autre langue est réellement parlée, transcris-la et indique-la.`);
    }
    if (targetLanguage) {
        lines.push(`- translated : la traduction fidèle et naturelle de text dans la langue de code « ${targetLanguage} ». Si la langue parlée est déjà « ${targetLanguage} », ou si text est vide, mets null.`);
    } else {
        lines.push('- translated : toujours null.');
    }
    return lines.join('\n');
}

async function readErrorDetail(res: Response): Promise<string> {
    const text = await res.text().catch(() => '');
    return text ? ` Détail fournisseur : ${text.slice(0, 300)}` : '';
}

interface GeminiResponse {
    candidates?: { content?: { parts?: { text?: string }[] }; finishReason?: string }[];
    usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    promptFeedback?: { blockReason?: string };
}

export const geminiSttAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string): Promise<AdapterResult> {
        if (req.category !== 'voice' || !req.voice?.audioBase64) {
            throw new AdapterError('Audio requis pour la transcription.', 'other');
        }
        const model = req.modelId || 'gemini-2.5-flash';
        const mimeType = normalizeMime(req.voice.audioMimeType || 'audio/wav');
        const languageHint = req.voice.languageHint?.trim().slice(0, 8) || undefined;
        const targetLanguage = req.voice.targetLanguage?.trim().slice(0, 8) || undefined;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
        let res: Response;
        try {
            res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
                method: 'POST',
                // La clé passe en en-tête, jamais dans l'URL (même discipline que gemini_tts).
                headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
                body: JSON.stringify({
                    contents: [{
                        parts: [
                            { text: buildPrompt(languageHint, targetLanguage) },
                            { inlineData: { mimeType, data: req.voice.audioBase64 } },
                        ],
                    }],
                    generationConfig: {
                        responseMimeType: 'application/json',
                        temperature: 0,
                        // Pas de « réflexion » pour une transcription : elle
                        // n'améliore rien et ajoutait plusieurs secondes de latence
                        // — inacceptable pour des sous-titres d'appel.
                        thinkingConfig: { thinkingBudget: 0 },
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

        if (res.status === 401 || res.status === 403) {
            throw new AdapterError(`Clé API invalide ou refusée.${await readErrorDetail(res)}`, 'auth');
        }
        if (res.status === 429) {
            throw new AdapterError(`Quota ou limite de débit dépassé.${await readErrorDetail(res)}`, 'rate_limited');
        }
        if (res.status >= 500) {
            throw new AdapterError(`Fournisseur indisponible (${res.status}).${await readErrorDetail(res)}`, 'server_error');
        }
        if (!res.ok) {
            throw new AdapterError(`Réponse inattendue (${res.status}).${await readErrorDetail(res)}`, 'other');
        }

        const json = await res.json() as GeminiResponse;
        if (json.promptFeedback?.blockReason) {
            throw new AdapterError(`Transcription refusée par le fournisseur (${json.promptFeedback.blockReason}).`, 'other');
        }
        const rawText = json.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';
        if (!rawText.trim()) throw new AdapterError('Réponse sans texte.', 'other');

        const parsed = parseJsonModeText(rawText) as { text?: unknown; language?: unknown; translated?: unknown };
        const text = typeof parsed.text === 'string' ? parsed.text.trim() : '';
        const language = typeof parsed.language === 'string' ? parsed.language.trim().toLowerCase().slice(0, 8) : '';
        const translatedRaw = typeof parsed.translated === 'string' ? parsed.translated.trim() : '';
        // Une « traduction » identique à l'original, ou vide, n'en est pas une.
        const translated = targetLanguage && translatedRaw && translatedRaw !== text ? translatedRaw : null;

        return {
            text,
            json: { text, language, translated, targetLanguage: targetLanguage ?? null },
            usage: {
                inputTokens: json.usageMetadata?.promptTokenCount,
                outputTokens: json.usageMetadata?.candidatesTokenCount,
            },
        };
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
