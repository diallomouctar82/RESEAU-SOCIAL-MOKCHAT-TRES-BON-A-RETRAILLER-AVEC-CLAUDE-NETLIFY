import { supabase } from './supabaseClient';

export const Modality = { AUDIO: 'AUDIO', TEXT: 'TEXT', IMAGE: 'IMAGE' } as const;

export type AIProxyTask = 'generate' | 'video.start' | 'video.poll' | 'asset.sign';

export class AIProxyError extends Error {
  constructor(public readonly code: string, message: string, public readonly status = 500) {
    super(message);
    this.name = 'AIProxyError';
  }
}

interface AIProxyResponse {
  ok: boolean;
  text?: string;
  parts?: Array<{ text?: string; fileData?: { mimeType: string; fileUri: string; storagePath?: string; assetId?: string } }>;
  mediaUrl?: string;
  storagePath?: string;
  operation?: ProxyVideoOperation;
  asset?: { assetId: string; storagePath: string; mimeType: string; url: string };
  provider?: string;
  model?: string;
  error?: { code: string; message: string };
}

export interface ProxyVideoOperation {
  name: string;
  done: boolean;
  response?: { generatedVideos?: Array<{ video?: { uri?: string; storagePath?: string; assetId?: string } }> };
  error?: { code?: number; message?: string };
}

const callProxy = async (task: AIProxyTask, payload: Record<string, unknown>, timeoutMs = 45_000): Promise<AIProxyResponse> => {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new AIProxyError('AUTH_REQUIRED', 'Connectez-vous pour utiliser ce service.', 401);

  const controller = new AbortController();
  const timeout = globalThis.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch('/api/ai', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ task, ...payload }),
      signal: controller.signal,
    });
    const body = await response.json().catch(() => ({
      ok: false,
      error: { code: 'INVALID_PROXY_RESPONSE', message: 'Réponse serveur illisible.' },
    })) as AIProxyResponse;
    if (!response.ok || !body.ok) {
      throw new AIProxyError(body.error?.code ?? 'AI_PROXY_FAILED', body.error?.message ?? 'Service indisponible.', response.status);
    }
    return body;
  } catch (error) {
    if (error instanceof AIProxyError) throw error;
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new AIProxyError('AI_PROXY_TIMEOUT', 'Le service a dépassé le délai autorisé.', 504);
    }
    throw new AIProxyError('AI_PROXY_UNREACHABLE', 'Le service sécurisé est momentanément indisponible.', 503);
  } finally {
    globalThis.clearTimeout(timeout);
  }
};

export class AIProxyClient {
  constructor(_legacyClientOptions?: unknown) {}

  readonly models = {
    generateContent: async (options: Record<string, any>) => {
      const result = await callProxy('generate', {
        model: options.model,
        contents: options.contents,
        config: options.config,
      });
      const parts = result.parts ?? (result.text ? [{ text: result.text }] : []);
      return {
        text: result.text ?? parts.find((part) => part.text)?.text ?? '',
        mediaUrl: result.mediaUrl,
        candidates: [{ content: { parts } }],
      };
    },
    generateVideos: async (options: Record<string, any>): Promise<ProxyVideoOperation> => {
      const result = await callProxy('video.start', options, 55_000);
      if (!result.operation) throw new AIProxyError('VIDEO_OPERATION_MISSING', 'Opération vidéo introuvable.');
      return result.operation;
    },
  };

  readonly operations = {
    getVideosOperation: async ({ operation }: { operation: ProxyVideoOperation }): Promise<ProxyVideoOperation> => {
      const result = await callProxy('video.poll', { operationName: operation.name }, 55_000);
      if (!result.operation) throw new AIProxyError('VIDEO_OPERATION_MISSING', 'Opération vidéo introuvable.');
      return result.operation;
    },
  };

  readonly live = {
    connect: async (_options?: unknown): Promise<any> => {
      throw new AIProxyError(
        'LIVE_AUDIO_PROXY_REQUIRED',
        'Le mode audio temps réel nécessite une passerelle WebSocket serveur dédiée.',
        503,
      );
    },
  };
}

export const aiProxy = {
  async generateText(prompt: string, options: { model?: string; systemInstruction?: string } = {}): Promise<string> {
    const client = new AIProxyClient();
    const result = await client.models.generateContent({
      model: options.model ?? 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: options.systemInstruction },
    });
    return result.text;
  },

  async generateJson<T>(prompt: string, options: { model?: string; systemInstruction?: string } = {}): Promise<T> {
    const client = new AIProxyClient();
    const result = await client.models.generateContent({
      model: options.model ?? 'gemini-2.5-flash',
      contents: prompt,
      config: { systemInstruction: options.systemInstruction, responseMimeType: 'application/json' },
    });
    try {
      return JSON.parse(result.text.replace(/```json|```/g, '').trim()) as T;
    } catch {
      throw new AIProxyError('INVALID_STRUCTURED_RESPONSE', 'La réponse structurée du service est invalide.', 502);
    }
  },

  async signAsset(storagePath: string): Promise<{ assetId: string; storagePath: string; mimeType: string; url: string }> {
    const result = await callProxy('asset.sign', { storagePath });
    if (!result.asset) throw new AIProxyError('ASSET_NOT_FOUND', 'Actif introuvable.', 404);
    return result.asset;
  },
};
