import { ProviderAdapter } from './types.ts';
import { openaiCompatibleAdapter } from './openai_compatible.ts';
import { anthropicAdapter } from './anthropic.ts';
import { geminiAdapter } from './gemini.ts';
import { elevenlabsAdapter } from './elevenlabs.ts';
import { geminiTtsAdapter } from './gemini_tts.ts';
import { geminiSttAdapter } from './gemini_stt.ts';
import { replicateAdapter } from './replicate.ts';
import { whisperAdapter, deepgramAdapter, assemblyaiAdapter } from './voice_stt_providers.ts';
import { cartesiaAdapter, playhtAdapter, azureSpeechAdapter, googleTtsAdapter } from './voice_tts_providers.ts';
import { pollyAdapter } from './polly.ts';
import { ideogramAdapter, recraftAdapter } from './sync_image.ts';
import {
    fluxAdapter, leonardoAdapter, runwayAdapter, heygenAdapter, lumaAdapter, klingAdapter, pikaAdapter,
} from './image_video_providers.ts';
import { veoAdapter } from './veo.ts';
import { genericHttpAdapter } from './generic_http.ts';
import { unimplementedAdapter } from './unimplemented.ts';

// Clé = ai_providers.adapter_kind. Plusieurs fournisseurs (OpenAI, DeepSeek, Qwen...)
// partagent la même entrée 'openai_compatible' ; ce qui les distingue (base_url, clé,
// model_id) vient de la ligne ai_providers/ai_models, pas du code de l'adaptateur.
export const ADAPTERS: Record<string, ProviderAdapter> = {
    openai_compatible: openaiCompatibleAdapter,
    anthropic: anthropicAdapter,
    gemini: geminiAdapter,
    replicate: replicateAdapter,
    elevenlabs: elevenlabsAdapter,
    gemini_tts: geminiTtsAdapter,
    gemini_stt: geminiSttAdapter,
    whisper: whisperAdapter,
    deepgram: deepgramAdapter,
    assemblyai: assemblyaiAdapter,
    cartesia: cartesiaAdapter,
    playht: playhtAdapter,
    azure_speech: azureSpeechAdapter,
    google_tts: googleTtsAdapter,
    polly: pollyAdapter,
    ideogram: ideogramAdapter,
    recraft: recraftAdapter,
    flux: fluxAdapter,
    leonardo: leonardoAdapter,
    runway: runwayAdapter,
    heygen: heygenAdapter,
    luma: lumaAdapter,
    kling: klingAdapter,
    pika: pikaAdapter,
    veo: veoAdapter,
    // Fournisseurs ajoutés via l'auto-découverte (module "coller une URL") : aucun
    // code écrit pour eux, leur forme d'appel vit entièrement dans ai_providers.adapter_config.
    generic_http: genericHttpAdapter,
    unimplemented: unimplementedAdapter,
};

export function resolveAdapter(adapterKind: string): ProviderAdapter {
    return ADAPTERS[adapterKind] ?? unimplementedAdapter;
}
