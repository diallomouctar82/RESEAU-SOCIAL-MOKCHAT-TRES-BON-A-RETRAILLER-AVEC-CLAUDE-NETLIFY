import type {
  AIFailoverEvent,
  AIExecutionResult,
  AIProviderConfig,
  AIRoutingPolicyConfig,
} from '../types';
import { aiProxy } from './aiProxy';

export const DEFAULT_ROUTING_POLICY: AIRoutingPolicyConfig = {
  strategy: 'auto_resilient_quality',
  globalMinQualityScore: 70,
  globalMaxLatencyMs: 45_000,
  maxConsecutiveErrorsBeforeQuarantine: 3,
  autoFailbackIntervalSec: 60,
  autoQuarantineEnabled: true,
  enableBudgetThresholdRouting: true,
  maxCostPerCallCapUSD: 0.10,
  fallbackChainOrder: ['server-managed-router'],
};

type ClientSafeProviderConfig = Omit<AIProviderConfig, 'apiKey' | 'endpointUrl' | 'headers'>;

const SERVER_PROVIDER: ClientSafeProviderConfig = {
  id: 'server-managed-router',
  name: 'Passerelle IA sécurisée MokChat',
  provider: 'custom',
  isEnabled: true,
  isDefault: true,
  priority: 1,
  tier: 'primary',
  defaultModel: 'gemini-2.5-flash',
  availableModels: [
    'gemini-2.5-flash',
    'gemini-2.5-pro',
    'gemini-3-pro-preview',
    'gemini-3-pro-image-preview',
    'gemini-2.5-flash-preview-tts',
  ],
  temperature: 0.7,
  maxTokens: 4096,
  status: 'online',
  qualityScore: 90,
  minQualityThreshold: 70,
  maxLatencyThresholdMs: 45_000,
  costPer1kInputTokens: 0,
  costPer1kOutputTokens: 0,
  consecutiveErrors: 0,
  totalCalls: 0,
  successCalls: 0,
};

// Compatibilité transitoire avec AIExecutionResult : aucun champ sensible
// n'existe réellement dans l'objet envoyé aux composants.
const executionProvider = (): AIProviderConfig => ({ ...SERVER_PROVIDER } as AIProviderConfig);

class AIRoutingService {
  private static instance: AIRoutingService;
  private policy = { ...DEFAULT_ROUTING_POLICY };
  private failoverLogs: AIFailoverEvent[] = [];

  static getInstance(): AIRoutingService {
    if (!AIRoutingService.instance) AIRoutingService.instance = new AIRoutingService();
    return AIRoutingService.instance;
  }

  getPolicy(): AIRoutingPolicyConfig {
    return { ...this.policy, fallbackChainOrder: [...this.policy.fallbackChainOrder] };
  }

  updatePolicy(updates: Partial<AIRoutingPolicyConfig>): AIRoutingPolicyConfig {
    this.policy = { ...this.policy, ...updates };
    return this.getPolicy();
  }

  getFailoverLogs(): AIFailoverEvent[] {
    return [...this.failoverLogs];
  }

  clearFailoverLogs(): void {
    this.failoverLogs = [];
  }

  logFailoverEvent(event: Omit<AIFailoverEvent, 'id' | 'timestamp'>): AIFailoverEvent {
    const full: AIFailoverEvent = {
      ...event,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
    };
    this.failoverLogs = [full, ...this.failoverLogs].slice(0, 100);
    return full;
  }

  getRankedProviders(): AIProviderConfig[] {
    return [executionProvider()];
  }

  async executeWithResilience<T = unknown>(options: {
    prompt: string;
    systemInstruction?: string;
    jsonSchemaDescription?: string;
    isJson?: boolean;
    preferredProviderId?: string;
    preferredModel?: string;
    maxBudgetUSD?: number;
  }): Promise<AIExecutionResult<T>> {
    const startedAt = performance.now();
    const model = options.preferredModel ?? SERVER_PROVIDER.defaultModel;
    try {
      if (options.isJson) {
        const data = await aiProxy.generateJson<T>(
          options.jsonSchemaDescription
            ? `${options.prompt}\n\nContrat JSON : ${options.jsonSchemaDescription}`
            : options.prompt,
          { model, systemInstruction: options.systemInstruction },
        );
        return {
          text: JSON.stringify(data),
          data,
          providerUsed: { ...executionProvider(), totalCalls: 1, successCalls: 1 },
          modelUsed: model,
          latencyMs: Math.round(performance.now() - startedAt),
          wasFailover: false,
          failoverAttemptsCount: 1,
        };
      }

      const text = await aiProxy.generateText(options.prompt, {
        model,
        systemInstruction: options.systemInstruction,
      });
      return {
        text,
        providerUsed: { ...executionProvider(), totalCalls: 1, successCalls: 1 },
        modelUsed: model,
        latencyMs: Math.round(performance.now() - startedAt),
        wasFailover: false,
        failoverAttemptsCount: 1,
      };
    } catch (error) {
      this.logFailoverEvent({
        requestedProviderId: SERVER_PROVIDER.id,
        requestedProviderName: SERVER_PROVIDER.name,
        fallbackProviderId: 'none',
        fallbackProviderName: 'Aucun faux moteur local',
        modelUsed: model,
        reason: 'error_5xx',
        details: error instanceof Error ? error.message : 'Échec de la passerelle sécurisée',
        latencyMs: Math.round(performance.now() - startedAt),
        success: false,
        promptSnippet: options.prompt.slice(0, 100),
      });
      throw error;
    }
  }

  async testProviderHealth(_providerId: string): Promise<{ success: boolean; latencyMs: number; message: string; qualityScore?: number }> {
    const startedAt = performance.now();
    try {
      await aiProxy.generateText('Réponds uniquement OK.', { model: 'gemini-2.5-flash' });
      return { success: true, latencyMs: Math.round(performance.now() - startedAt), message: 'Passerelle serveur opérationnelle.', qualityScore: 90 };
    } catch (error) {
      return {
        success: false,
        latencyMs: Math.round(performance.now() - startedAt),
        message: error instanceof Error ? error.message : 'Passerelle indisponible.',
      };
    }
  }

  async runFullResilienceDiagnostic() {
    const result = await this.testProviderHealth(SERVER_PROVIDER.id);
    return {
      totalProviders: 1,
      onlineCount: result.success ? 1 : 0,
      quarantinedCount: 0,
      averageLatencyMs: result.latencyMs,
      results: { [SERVER_PROVIDER.id]: result },
    };
  }
}

export const aiRoutingService = AIRoutingService.getInstance();
