import { ProviderAdapter } from './types.ts';
import { openaiCompatibleAdapter } from './openai_compatible.ts';
import { anthropicAdapter } from './anthropic.ts';
import { geminiAdapter } from './gemini.ts';
import { elevenlabsAdapter } from './elevenlabs.ts';
import { unimplementedAdapter } from './unimplemented.ts';

// Clé = ai_providers.adapter_kind. Plusieurs fournisseurs (OpenAI, DeepSeek, Qwen...)
// partagent la même entrée 'openai_compatible' ; ce qui les distingue (base_url, clé,
// model_id) vient de la ligne ai_providers/ai_models, pas du code de l'adaptateur.
export const ADAPTERS: Record<string, ProviderAdapter> = {
    openai_compatible: openaiCompatibleAdapter,
    anthropic: anthropicAdapter,
    gemini: geminiAdapter,
    elevenlabs: elevenlabsAdapter,
    unimplemented: unimplementedAdapter,
};

export function resolveAdapter(adapterKind: string): ProviderAdapter {
    return ADAPTERS[adapterKind] ?? unimplementedAdapter;
}
