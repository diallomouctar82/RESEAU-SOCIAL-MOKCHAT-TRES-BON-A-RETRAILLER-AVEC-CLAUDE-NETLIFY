import { 
  SupportedAIProviderType, 
  ExternalAIConnectorMetadata 
} from '../types';

export interface AIUniversalChatOptions {
  provider?: SupportedAIProviderType;
  model?: string;
  messages: { role: 'user' | 'assistant' | 'system' | 'model'; content: string }[];
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface AIVideoGenerationOptions {
  provider: 'kling' | 'runway';
  prompt: string;
  aspectRatio?: '16:9' | '9:16';
  duration?: number;
  imageUrl?: string;
}

export interface AIAvatarGenerationOptions {
  text: string;
  avatarId?: string;
  voiceId?: string;
  title?: string;
}

export interface AIN8nTriggerOptions {
  webhookUrl?: string;
  eventName: string;
  payload: Record<string, any>;
}

export interface AIProviderPortalDetails {
  name: string;
  portalUrl: string;
  signupUrl: string;
  apiKeyUrl: string;
  docsUrl: string;
  billingUrl: string;
  description: string;
  envKey: string;
  secretEnvKey?: string;
  webhookEnvKey?: string;
  taskSpecialty: 'general' | 'coding' | 'reasoning' | 'legal_contract' | 'multilingual' | 'video_generation' | 'voice_speech' | 'workflow_automation';
  costLevel: '$' | '$$' | '$$$' | '$$$$';
  correctiveAction: string;
}

// Métadonnées exhaustives des plateformes IA connectées avec liens directs 1-clic
export const AI_PORTAL_LINKS: Record<string, AIProviderPortalDetails> = {
  gemini: {
    name: 'Google Gemini Core',
    portalUrl: 'https://aistudio.google.com/app/apikey',
    signupUrl: 'https://aistudio.google.com/',
    apiKeyUrl: 'https://aistudio.google.com/app/apikey',
    docsUrl: 'https://ai.google.dev/docs',
    billingUrl: 'https://console.cloud.google.com/billing',
    description: 'Vision native, compréhension multimodale, raisonnement rapide et grand contexte.',
    envKey: 'GEMINI_API_KEY',
    taskSpecialty: 'general',
    costLevel: '$',
    correctiveAction: 'Générez une clé sur Google AI Studio et définissez GEMINI_API_KEY dans votre fichier .env ou les variables Netlify/Vercel.'
  },
  claude: {
    name: 'Anthropic Claude (3.5 Sonnet / Haiku)',
    portalUrl: 'https://console.anthropic.com/settings/keys',
    signupUrl: 'https://console.anthropic.com/signup',
    apiKeyUrl: 'https://console.anthropic.com/settings/keys',
    docsUrl: 'https://docs.anthropic.com/en/docs/welcome',
    billingUrl: 'https://console.anthropic.com/settings/billing',
    description: 'Rédaction d’élite, analyse documentaire juridique et programmation précise.',
    envKey: 'ANTHROPIC_API_KEY',
    taskSpecialty: 'legal_contract',
    costLevel: '$$$',
    correctiveAction: 'Créez un compte Anthropic Console, approvisionnez les crédits dans "Plans & Billing", générez une clé et assignez ANTHROPIC_API_KEY.'
  },
  openai: {
    name: 'OpenAI (GPT-4o & o1/o3)',
    portalUrl: 'https://platform.openai.com/api-keys',
    signupUrl: 'https://platform.openai.com/signup',
    apiKeyUrl: 'https://platform.openai.com/api-keys',
    docsUrl: 'https://platform.openai.com/docs/overview',
    billingUrl: 'https://platform.openai.com/account/billing/overview',
    description: 'Modèle polyvalent mondial, vision et raisonnement logique profond.',
    envKey: 'OPENAI_API_KEY',
    taskSpecialty: 'general',
    costLevel: '$$$',
    correctiveAction: 'Connectez-vous sur OpenAI Platform, créez une clé API dans "API keys" et ajoutez OPENAI_API_KEY dans vos paramètres d\'environnement.'
  },
  deepseek: {
    name: 'DeepSeek AI (V3 & R1 Reasoner)',
    portalUrl: 'https://platform.deepseek.com/api_keys',
    signupUrl: 'https://platform.deepseek.com/sign_up',
    apiKeyUrl: 'https://platform.deepseek.com/api_keys',
    docsUrl: 'https://api-docs.deepseek.com/',
    billingUrl: 'https://platform.deepseek.com/top_up',
    description: 'Raisonnement mathématique et logique poussé, codage et coûts ultra-réduits.',
    envKey: 'DEEPSEEK_API_KEY',
    taskSpecialty: 'reasoning',
    costLevel: '$',
    correctiveAction: 'Rendez-vous sur platform.deepseek.com, rechargez le solde dans "Top up" et copiez votre clé dans DEEPSEEK_API_KEY.'
  },
  mistral: {
    name: 'Mistral AI (Large & Codestral)',
    portalUrl: 'https://console.mistral.ai/api-keys/',
    signupUrl: 'https://auth.mistral.ai/ui/registration',
    apiKeyUrl: 'https://console.mistral.ai/api-keys/',
    docsUrl: 'https://docs.mistral.ai/',
    billingUrl: 'https://console.mistral.ai/billing/',
    description: 'IA européenne souveraine, bilingue français de référence et génération de code Codestral.',
    envKey: 'MISTRAL_API_KEY',
    taskSpecialty: 'coding',
    costLevel: '$$',
    correctiveAction: 'Accédez à la console Mistral La Plateforme, générez votre clé dans "API Keys" et configurez MISTRAL_API_KEY.'
  },
  qwen: {
    name: 'Alibaba Qwen 2.5 72B (DashScope)',
    portalUrl: 'https://dashscope.console.aliyun.com/',
    signupUrl: 'https://account.aliyun.com/register/intl_register.htm',
    apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
    docsUrl: 'https://www.alibabacloud.com/help/en/model-studio/developer-reference/what-is-model-studio',
    billingUrl: 'https://usercenter2-intl.aliyun.com/billing',
    description: 'Expertise multilingue avancée (Asie, Afrique, Europe) et commerce international B2B.',
    envKey: 'QWEN_API_KEY',
    taskSpecialty: 'multilingual',
    costLevel: '$',
    correctiveAction: 'Ouvrez DashScope sur Alibaba Cloud, activez Model Studio et renseignez QWEN_API_KEY.'
  },
  kimi: {
    name: 'Moonshot Kimi K3 & K1.5',
    portalUrl: 'https://platform.moonshot.cn/console/api-keys',
    signupUrl: 'https://platform.moonshot.cn/login',
    apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
    docsUrl: 'https://platform.moonshot.cn/docs',
    billingUrl: 'https://platform.moonshot.cn/console/pay',
    description: 'Fenêtre de contexte ultra-longue 128k/200k pour gros dossiers juridiques et thèses.',
    envKey: 'KIMI_API_KEY',
    taskSpecialty: 'legal_contract',
    costLevel: '$$',
    correctiveAction: 'Inscrivez-vous sur platform.moonshot.cn, générez une clé et assignez KIMI_API_KEY.'
  },
  openrouter: {
    name: 'OpenRouter Unified Gateway',
    portalUrl: 'https://openrouter.ai/keys',
    signupUrl: 'https://openrouter.ai/signup',
    apiKeyUrl: 'https://openrouter.ai/keys',
    docsUrl: 'https://openrouter.ai/docs',
    billingUrl: 'https://openrouter.ai/credits',
    description: 'Accès unifié à plus de 200 modèles avec une seule clé et équilibrage automatique de charge.',
    envKey: 'OPENROUTER_API_KEY',
    taskSpecialty: 'general',
    costLevel: '$$',
    correctiveAction: 'Créez une clé sur openrouter.ai/keys, ajoutez des crédits et configurez OPENROUTER_API_KEY.'
  },
  kling: {
    name: 'Kling AI 1.5 (Kuaishou Video)',
    portalUrl: 'https://klingai.com/',
    signupUrl: 'https://klingai.com/',
    apiKeyUrl: 'https://klingai.com/',
    docsUrl: 'https://klingai.com/docs',
    billingUrl: 'https://klingai.com/pricing',
    description: 'Génération vidéo cinématographique ultra-réaliste Text-to-Video et Image-to-Video.',
    envKey: 'KLING_API_KEY',
    taskSpecialty: 'video_generation',
    costLevel: '$$$$',
    correctiveAction: 'Souscrivez à l\'API Kling sur le portail KlingAI et configurez KLING_API_KEY.'
  },
  runway: {
    name: 'RunwayML Gen-3 Alpha & Gen-2',
    portalUrl: 'https://app.runwayml.com/settings/api-keys',
    signupUrl: 'https://app.runwayml.com/signup',
    apiKeyUrl: 'https://app.runwayml.com/settings/api-keys',
    docsUrl: 'https://docs.runwayml.com/',
    billingUrl: 'https://app.runwayml.com/settings/billing',
    description: 'Génération vidéo studio, effets visuels haute fidélité et caméra cinématique IA.',
    envKey: 'RUNWAY_API_KEY',
    taskSpecialty: 'video_generation',
    costLevel: '$$$$',
    correctiveAction: 'Obtenez votre clé développeur sur RunwayML Developer Settings et déclarez RUNWAY_API_KEY.'
  },
  heygene: {
    name: 'HeyGen Interactive Avatars',
    portalUrl: 'https://app.heygen.com/settings?nav=API',
    signupUrl: 'https://app.heygen.com/signup',
    apiKeyUrl: 'https://app.heygen.com/settings?nav=API',
    docsUrl: 'https://docs.heygen.com/reference/overview',
    billingUrl: 'https://app.heygen.com/settings?nav=Billing',
    description: 'Création d’avatars vidéo parlants interactifs et restitution visuelle des experts.',
    envKey: 'HEYGEN_API_KEY',
    taskSpecialty: 'voice_speech',
    costLevel: '$$$',
    correctiveAction: 'Accédez à HeyGen API Settings, copiez votre clé API et déclarez HEYGEN_API_KEY.'
  },
  elevenlabs: {
    name: 'ElevenLabs HD Voice Studio',
    portalUrl: 'https://elevenlabs.io/app/settings/api-keys',
    signupUrl: 'https://elevenlabs.io/sign-up',
    apiKeyUrl: 'https://elevenlabs.io/app/settings/api-keys',
    docsUrl: 'https://elevenlabs.io/docs/introduction',
    billingUrl: 'https://elevenlabs.io/app/subscription',
    description: 'Synthèse vocale haute fidélité studio multilingue avec clonage express et expressivité émotionnelle.',
    envKey: 'ELEVENLABS_API_KEY',
    taskSpecialty: 'voice_speech',
    costLevel: '$$',
    correctiveAction: 'Créez une clé sur ElevenLabs API Keys et déclarez ELEVENLABS_API_KEY dans votre fichier .env.'
  },
  n8n: {
    name: 'n8n Workflow Automation',
    portalUrl: 'https://n8n.io/',
    signupUrl: 'https://n8n.io/',
    apiKeyUrl: 'https://n8n.io/',
    docsUrl: 'https://docs.n8n.io/',
    billingUrl: 'https://n8n.io/pricing/',
    description: 'Orchestration de pipelines, webhooks autonomes et intégrations métiers d\'entreprise.',
    envKey: 'N8N_WEBHOOK_URL',
    webhookEnvKey: 'N8N_WEBHOOK_URL',
    taskSpecialty: 'workflow_automation',
    costLevel: '$',
    correctiveAction: 'Déployez ou connectez votre instance n8n et configurez l\'URL du webhook dans N8N_WEBHOOK_URL.'
  },
  grok: {
    name: 'xAI Grok-2 Realtime',
    portalUrl: 'https://console.x.ai/',
    signupUrl: 'https://console.x.ai/',
    apiKeyUrl: 'https://console.x.ai/',
    docsUrl: 'https://docs.x.ai/',
    billingUrl: 'https://console.x.ai/billing',
    description: 'Raisonnement en temps réel, données d\'actualités et vision.',
    envKey: 'XAI_API_KEY',
    taskSpecialty: 'general',
    costLevel: '$$',
    correctiveAction: 'Obtenez une clé sur xAI Console et renseignez XAI_API_KEY dans vos variables.'
  },
  ollama: {
    name: 'Ollama Local Node (Air-Gapped)',
    portalUrl: 'https://ollama.com/',
    signupUrl: 'https://ollama.com/',
    apiKeyUrl: 'https://ollama.com/download',
    docsUrl: 'https://github.com/ollama/ollama/tree/main/docs',
    billingUrl: 'https://ollama.com/',
    description: 'Exécution 100% locale, privée et hors ligne sans coûts de jetons distants.',
    envKey: 'OLLAMA_ENDPOINT',
    taskSpecialty: 'reasoning',
    costLevel: '$',
    correctiveAction: 'Installez Ollama en local (`ollama run llama3`) et assurez-vous qu\'il écoute sur http://localhost:11434.'
  }
};

class UnifiedAIConnectorService {
  private static instance: UnifiedAIConnectorService;

  private constructor() {}

  public static getInstance(): UnifiedAIConnectorService {
    if (!UnifiedAIConnectorService.instance) {
      UnifiedAIConnectorService.instance = new UnifiedAIConnectorService();
    }
    return UnifiedAIConnectorService.instance;
  }

  /**
   * Récupère la liste de tous les connecteurs avec leur état de configuration serveur
   */
  public async getConnectorsStatus(): Promise<ExternalAIConnectorMetadata[]> {
    try {
      const response = await fetch('/api/ai/connectors');
      if (!response.ok) {
        throw new Error(`Erreur serveur connecteurs : ${response.statusText}`);
      }
      const data = await response.json();
      return data.connectors || [];
    } catch (err) {
      console.warn('Fallback local pour les métadonnées connecteurs IA:', err);
      // Fallback local
      return Object.entries(AI_PORTAL_LINKS).map(([id, meta]) => ({
        id,
        provider: id as SupportedAIProviderType,
        displayName: meta.name,
        category: (id === 'kling' || id === 'runway') ? 'video_generation' : (id === 'heygene' || id === 'elevenlabs') ? 'avatar_speech' : id === 'n8n' ? 'workflow_automation' : 'llm_reasoning',
        description: meta.description,
        officialPortalUrl: meta.portalUrl,
        apiKeyEnvVar: meta.envKey,
        defaultModel: 'standard',
        supportedModels: ['standard'],
        isConfigured: false,
        capabilities: ['chat'],
        iconName: 'Sparkles',
        badgeColor: 'amber'
      }));
    }
  }

  /**
   * Exécute une requête de chat / raisonnement sur le provider choisi
   */
  public async executeChat(options: AIUniversalChatOptions): Promise<{ text: string; provider: string; model: string }> {
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: options.provider || 'deepseek',
          model: options.model,
          messages: options.messages,
          temperature: options.temperature || 0.7,
          max_tokens: options.maxTokens || 4096,
          systemPrompt: options.systemPrompt
        })
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Erreur [${response.status}] sur ${options.provider}`);
      }

      const data = await response.json();
      return {
        text: data.text || '',
        provider: data.provider || options.provider || 'deepseek',
        model: data.model || 'default'
      };
    } catch (err: any) {
      console.warn(`[UnifiedAIConnector] Erreur requête chat ${options.provider}:`, err);
      throw err;
    }
  }

  /**
   * Lance une génération vidéo (Kling AI ou Runway)
   */
  public async generateVideo(options: AIVideoGenerationOptions): Promise<any> {
    const response = await fetch('/api/ai/video', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || `Erreur génération vidéo sur ${options.provider}`);
    }

    return await response.json();
  }

  /**
   * Lance une génération d'avatar parlant (HeyGen)
   */
  public async generateAvatarVideo(options: AIAvatarGenerationOptions): Promise<any> {
    const response = await fetch('/api/ai/avatar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Erreur génération avatar HeyGen');
    }

    return await response.json();
  }

  /**
   * Déclenche un workflow n8n via webhook
   */
  public async triggerN8nWorkflow(options: AIN8nTriggerOptions): Promise<any> {
    const response = await fetch('/api/ai/n8n/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(options)
    });

    if (!response.ok) {
      const errJson = await response.json().catch(() => ({}));
      throw new Error(errJson.error || 'Erreur déclenchement workflow n8n');
    }

    return await response.json();
  }
}

export const unifiedAIConnector = UnifiedAIConnectorService.getInstance();
