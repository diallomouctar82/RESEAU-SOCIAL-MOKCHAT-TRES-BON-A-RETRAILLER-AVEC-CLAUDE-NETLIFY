// Interface commune à tous les adaptateurs de fournisseurs IA de l'orchestrateur.
// Un adaptateur ne connaît que la forme d'API d'un fournisseur (ou d'un cluster de
// fournisseurs compatibles) ; il ne sait rien du catalogue, de Vault, ni de la bascule.

export type AiCategory = 'llm' | 'voice' | 'image_video';

// Outil mis à disposition du modèle. Construit à partir du catalogue en base
// (ai_tools + agent_tool_grants) : l'orchestrateur ne code en dur ni la liste
// des outils, ni qui a le droit de les utiliser.
export interface ToolDeclaration {
    name: string;
    description: string;
    parametersSchema: Record<string, unknown>;
}

// Demande d'appel d'outil émise par le modèle.
export interface ToolCall {
    // Identifiant fourni par le fournisseur pour rattacher le résultat à l'appel.
    // Gemini n'en émet pas : on en génère un localement.
    id: string;
    name: string;
    args: Record<string, unknown>;
}

export interface AdapterMessage {
    role: 'system' | 'user' | 'assistant' | 'tool';
    content: string;
    // Vision/OCR : image jointe à ce message (un seul message avec image par
    // requête suffit pour tous les usages actuels — caméra live, OCR de
    // document, analyse de photo).
    imageBase64?: string;
    imageMimeType?: string;
    // Tour d'assistant ayant demandé un ou plusieurs outils.
    toolCalls?: ToolCall[];
    // Tour de résultat d'outil (role 'tool') : rattachement à l'appel d'origine.
    toolCallId?: string;
    toolName?: string;
}

export interface AdapterRequest {
    category: AiCategory;
    modelId: string;
    llm?: {
        messages: AdapterMessage[];
        jsonMode?: boolean;
        // Outils autorisés pour cet expert. Absent ou vide = aucun outil.
        tools?: ToolDeclaration[];
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
    // Le modèle demande l'exécution d'outils avant de pouvoir répondre.
    // La boucle d'outils de index.ts les exécute puis relance l'adaptateur.
    toolCalls?: ToolCall[];
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
    // config : présent uniquement pour les fournisseurs auto-découverts (adapter_kind
    // 'generic_http') — c'est ai_providers.adapter_config, ignoré par tous les
    // adaptateurs codés en dur qui connaissent déjà la forme de leur API.
    call(req: AdapterRequest, apiKey: string, baseUrl: string | null, config?: Record<string, unknown>): Promise<AdapterResult>;
    testConnection(apiKey: string, baseUrl: string | null, config?: Record<string, unknown>): Promise<{ ok: boolean; message: string }>;
}
