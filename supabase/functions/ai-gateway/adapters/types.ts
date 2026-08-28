// Interface commune à tous les adaptateurs de fournisseurs IA de l'orchestrateur.
// Un adaptateur ne connaît que la forme d'API d'un fournisseur (ou d'un cluster de
// fournisseurs compatibles) ; il ne sait rien du catalogue, de Vault, ni de la bascule.

export type AiCategory = 'llm' | 'voice' | 'image_video';

export interface AdapterRequest {
    category: AiCategory;
    modelId: string;
    llm?: {
        messages: { role: 'system' | 'user' | 'assistant'; content: string }[];
        jsonMode?: boolean;
    };
    voice?: {
        // Texte -> parole (TTS)
        text?: string;
        voiceId?: string;
        // Parole -> texte (STT/transcription) — audio fourni en base64
        audioBase64?: string;
        audioMimeType?: string;
    };
    imageVideo?: {
        prompt: string;
        params?: Record<string, unknown>;
    };
}

export interface AdapterResult {
    text?: string;
    json?: unknown;
    audioBase64?: string;
    jobId?: string;
    assetUrl?: string;
    raw?: unknown;
}

// Erreur typée levée par un adaptateur : la boucle de bascule de index.ts l'utilise
// pour décider si le fournisseur suivant doit être tenté et pour journaliser la cause.
export class AdapterError extends Error {
    errorClass: 'auth' | 'rate_limited' | 'server_error' | 'timeout' | 'other';
    constructor(message: string, errorClass: AdapterError['errorClass'] = 'other') {
        super(message);
        this.errorClass = errorClass;
    }
}

export interface ProviderAdapter {
    call(req: AdapterRequest, apiKey: string, baseUrl: string | null): Promise<AdapterResult>;
    testConnection(apiKey: string, baseUrl: string | null): Promise<{ ok: boolean; message: string }>;
}
