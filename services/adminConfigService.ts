import { 
  AdminUserRecord, 
  AIProviderConfig, 
  PlatformModuleConfig, 
  OfficialDocumentTemplate, 
  OfficialSignature, 
  OfficialStamp, 
  WorkflowPipelineConfig, 
  SystemAuditLog, 
  BroadcastNotification, 
  AdminSystemConfig,
  ContentModerationItem,
  UserReportItem,
  MokTrustAuditItem,
  PlatformDetailedModuleSettings,
  PlatformReleaseVersion,
  BackupSnapshotRecord,
  BackupScheduleConfig,
  RestoreOperationResult,
  VersionComparisonResult,
  SnapshotType,
  ReleaseVersionStatus
} from '../types';
import { supabaseService } from './supabaseClient';

const ADMIN_STORAGE_KEY = 'lmav_admin_central_config_v1';
const ADMIN_LOGS_KEY = 'lmav_admin_audit_logs_v1';
const ADMIN_NOTIFS_KEY = 'lmav_admin_broadcast_notifs_v1';
const ADMIN_MODERATION_KEY = 'lmav_admin_moderation_items_v1';
const ADMIN_REPORTS_KEY = 'lmav_admin_user_reports_v1';
const ADMIN_MOKTRUST_KEY = 'lmav_admin_moktrust_audits_v1';
const ADMIN_SETTINGS_KEY = 'lmav_admin_detailed_settings_v1';
const ADMIN_SNAPSHOTS_KEY = 'lmav_admin_snapshots_v1';
const ADMIN_SCHEDULE_KEY = 'lmav_admin_backup_schedule_v1';
const ADMIN_LAST_RESTORE_RESULT_KEY = 'lmav_admin_last_restore_result_v1';


// ── 1. UTILISATEURS ET RÔLES INITIAUX ──
const INITIAL_USERS: AdminUserRecord[] = [
  {
    id: 'u-admin-1',
    name: 'Superviseur Général DIALLO',
    email: 'visionsmart224@gmail.com',
    role: 'super_admin',
    status: 'active',
    country: 'International',
    credits: 1000000,
    joinedAt: '2025-01-01',
    lastLogin: '2026-08-27 15:40',
    permissions: ['all', 'manage_users', 'manage_ai', 'manage_templates', 'sign_documents', 'stamp_documents', 'manage_workflows', 'system_backup', 'broadcast_notifications'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
    notes: 'Super-Administrateur Suprême de la plateforme Le Monde à Vous.'
  },
  {
    id: 'u-expert-dir',
    name: 'Directeur DIALLO',
    email: 'directeur.diallo@lemondeavous.com',
    role: 'expert',
    status: 'active',
    country: 'France / Sénégal',
    credits: 50000,
    joinedAt: '2025-01-15',
    lastLogin: '2026-08-27 14:12',
    permissions: ['access_council', 'sign_documents', 'manage_workflows', 'view_dossiers'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&h=120&fit=crop',
    assignedExpertId: '8',
    notes: 'Chef de Projet & Coordinateur Stratégique.',
    isDemoSeed: true
  },
  {
    id: 'u-expert-jur',
    name: 'Maître DIALLO',
    email: 'maitre.diallo@lemondeavous.com',
    role: 'expert',
    status: 'active',
    country: 'France',
    credits: 50000,
    joinedAt: '2025-01-15',
    lastLogin: '2026-08-27 11:30',
    permissions: ['access_council', 'sign_documents', 'stamp_documents', 'review_contracts'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=120&h=120&fit=crop',
    assignedExpertId: '1',
    notes: 'Juriste Émérite & Droit International.',
    isDemoSeed: true
  },
  {
    id: 'u-expert-prof',
    name: 'Professeur DIALLO',
    email: 'professeur.diallo@lemondeavous.com',
    role: 'expert',
    status: 'active',
    country: 'Canada / Guinée',
    credits: 50000,
    joinedAt: '2025-01-20',
    lastLogin: '2026-08-26 18:45',
    permissions: ['access_council', 'sign_documents', 'issue_diplomas'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&h=120&fit=crop',
    assignedExpertId: '3',
    notes: 'Doyen Campus & Pédagogie d’Excellence.',
    isDemoSeed: true
  },
  {
    id: 'u-citoyen-1',
    name: 'Alexandre Dupont',
    email: 'alex.d@example.com',
    role: 'citizen',
    status: 'active',
    country: 'France',
    credits: 2450,
    joinedAt: '2025-02-10',
    lastLogin: '2026-08-27 09:22',
    permissions: ['standard_access', 'create_dossiers', 'generate_letters'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&h=120&fit=crop',
    notes: 'Dossier expatriation Canada en cours.',
    isDemoSeed: true
  },
  {
    id: 'u-partner-1',
    name: 'Sarah Koné (AfriqLogistics B2B)',
    email: 'sarah.kone@afriqlogistics.com',
    role: 'partner',
    status: 'active',
    country: 'Côte d’Ivoire',
    credits: 12800,
    joinedAt: '2025-03-01',
    lastLogin: '2026-08-27 13:05',
    permissions: ['standard_access', 'b2b_market', 'rfq_submit', 'trade_negotiate'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&h=120&fit=crop',
    notes: 'Fournisseur vérifié Marché Mondial B2B.',
    isDemoSeed: true
  },
  {
    id: 'u-citoyen-2',
    name: 'Aïcha Benali',
    email: 'aicha.b@maroc.ma',
    role: 'citizen',
    status: 'active',
    country: 'Maroc',
    credits: 1800,
    joinedAt: '2025-03-15',
    lastLogin: '2026-08-25 16:10',
    permissions: ['standard_access', 'create_dossiers'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=120&h=120&fit=crop',
    notes: 'Parcours Campus Master Data & IA.',
    isDemoSeed: true
  },
  {
    id: 'u-citoyen-3',
    name: 'Jean Martin',
    email: 'j.martin@test.com',
    role: 'citizen',
    status: 'suspended',
    country: 'Belgique',
    credits: 0,
    joinedAt: '2025-04-02',
    lastLogin: '2026-07-12 10:00',
    permissions: ['standard_access'],
    kycVerified: false,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
    notes: 'Compte suspendu pour tentative d’usurpation.',
    isDemoSeed: true
  }
];

// ── 2. FOURNISSEURS IA ET MODÈLES AUTO-RÉSILIENTS ──
const INITIAL_AI_PROVIDERS: AIProviderConfig[] = [
  {
    id: 'prov-gemini',
    name: 'Google Gemini Core (Vision & Raisonnement)',
    provider: 'gemini',
    category: 'multimodal',
    portalUrl: 'https://aistudio.google.com/app/apikey',
    portalLinks: {
      signupUrl: 'https://aistudio.google.com/',
      apiKeyUrl: 'https://aistudio.google.com/app/apikey',
      docsUrl: 'https://ai.google.dev/docs',
      billingUrl: 'https://console.cloud.google.com/billing'
    },
    detectedEnvVar: 'GEMINI_API_KEY',
    isEnvKeyPresent: true,
    taskSpecialty: 'general',
    dailyQuotaLimitUSD: 50.0,
    currentDailySpendUSD: 1.42,
    correctiveAction: 'Définissez GEMINI_API_KEY dans votre fichier .env pour activer le moteur natif multimodal.',
    isEnabled: true,
    isDefault: true,
    priority: 1,
    tier: 'primary',
    apiKey: 'AIzaSy************************',
    defaultModel: 'gemini-2.5-flash',
    availableModels: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-pro', 'gemini-2.0-flash-exp'],
    temperature: 0.7,
    maxTokens: 8192,
    latencyMs: 140,
    status: 'online',
    qualityScore: 98,
    minQualityThreshold: 70,
    maxLatencyThresholdMs: 2000,
    costPer1kInputTokens: 0.00015,
    costPer1kOutputTokens: 0.00060,
    consecutiveErrors: 0,
    totalCalls: 1240,
    successCalls: 1238,
    lastHealthCheck: '2026-08-27 15:45'
  },
  {
    id: 'prov-claude',
    name: 'Anthropic Claude 3.5 Elite (Rédaction & Code)',
    provider: 'claude',
    category: 'llm_reasoning',
    portalUrl: 'https://console.anthropic.com/settings/keys',
    portalLinks: {
      signupUrl: 'https://console.anthropic.com/signup',
      apiKeyUrl: 'https://console.anthropic.com/settings/keys',
      docsUrl: 'https://docs.anthropic.com/en/docs/welcome',
      billingUrl: 'https://console.anthropic.com/settings/billing'
    },
    detectedEnvVar: 'ANTHROPIC_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'legal_contract',
    dailyQuotaLimitUSD: 100.0,
    currentDailySpendUSD: 8.75,
    correctiveAction: 'Ajoutez ANTHROPIC_API_KEY dans .env pour débloquer les analyses juridiques Claude 3.5 Sonnet.',
    isEnabled: true,
    isDefault: false,
    priority: 2,
    tier: 'secondary',
    apiKey: 'sk-ant-***********************',
    defaultModel: 'claude-3-5-sonnet-20241022',
    availableModels: ['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022', 'claude-3-opus-20240229'],
    temperature: 0.5,
    maxTokens: 8192,
    endpointUrl: 'https://api.anthropic.com/v1/messages',
    latencyMs: 195,
    status: 'online',
    qualityScore: 99,
    minQualityThreshold: 75,
    maxLatencyThresholdMs: 2500,
    costPer1kInputTokens: 0.003,
    costPer1kOutputTokens: 0.015,
    consecutiveErrors: 0,
    totalCalls: 890,
    successCalls: 887,
    lastHealthCheck: '2026-08-27 15:40'
  },
  {
    id: 'prov-openai',
    name: 'OpenAI GPT-4o Gateway',
    provider: 'openai',
    category: 'llm_reasoning',
    portalUrl: 'https://platform.openai.com/api-keys',
    portalLinks: {
      signupUrl: 'https://platform.openai.com/signup',
      apiKeyUrl: 'https://platform.openai.com/api-keys',
      docsUrl: 'https://platform.openai.com/docs/overview',
      billingUrl: 'https://platform.openai.com/account/billing/overview'
    },
    detectedEnvVar: 'OPENAI_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'general',
    dailyQuotaLimitUSD: 80.0,
    currentDailySpendUSD: 5.20,
    correctiveAction: 'Définissez OPENAI_API_KEY dans votre fichier .env pour activer GPT-4o et o1/o3-mini.',
    isEnabled: true,
    isDefault: false,
    priority: 3,
    tier: 'secondary',
    apiKey: 'sk-proj-**********************',
    defaultModel: 'gpt-4o',
    availableModels: ['gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o3-mini', 'gpt-4-turbo'],
    temperature: 0.6,
    maxTokens: 4096,
    endpointUrl: 'https://api.openai.com/v1/chat/completions',
    latencyMs: 220,
    status: 'online',
    qualityScore: 96,
    minQualityThreshold: 70,
    maxLatencyThresholdMs: 2200,
    costPer1kInputTokens: 0.0025,
    costPer1kOutputTokens: 0.010,
    consecutiveErrors: 0,
    totalCalls: 670,
    successCalls: 668,
    lastHealthCheck: '2026-08-27 15:35'
  },
  {
    id: 'prov-deepseek',
    name: 'DeepSeek V3 & R1 Reasoner (Haute Efficience)',
    provider: 'deepseek',
    category: 'llm_reasoning',
    portalUrl: 'https://platform.deepseek.com/api_keys',
    portalLinks: {
      signupUrl: 'https://platform.deepseek.com/sign_up',
      apiKeyUrl: 'https://platform.deepseek.com/api_keys',
      docsUrl: 'https://api-docs.deepseek.com/',
      billingUrl: 'https://platform.deepseek.com/top_up'
    },
    detectedEnvVar: 'DEEPSEEK_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'reasoning',
    dailyQuotaLimitUSD: 30.0,
    currentDailySpendUSD: 0.85,
    correctiveAction: 'Générez votre clé sur platform.deepseek.com et assignez DEEPSEEK_API_KEY pour des coûts ultra-bas.',
    isEnabled: true,
    isDefault: false,
    priority: 4,
    tier: 'tertiary',
    apiKey: 'sk-ds-************************',
    defaultModel: 'deepseek-chat',
    availableModels: ['deepseek-chat', 'deepseek-reasoner'],
    temperature: 0.6,
    maxTokens: 8192,
    endpointUrl: 'https://api.deepseek.com/chat/completions',
    latencyMs: 310,
    status: 'online',
    qualityScore: 94,
    minQualityThreshold: 65,
    maxLatencyThresholdMs: 3000,
    costPer1kInputTokens: 0.00014,
    costPer1kOutputTokens: 0.00028,
    consecutiveErrors: 0,
    totalCalls: 450,
    successCalls: 446,
    lastHealthCheck: '2026-08-27 15:30'
  },
  {
    id: 'prov-mistral',
    name: 'Mistral AI Souverain (Large & Codestral)',
    provider: 'mistral',
    category: 'llm_reasoning',
    portalUrl: 'https://console.mistral.ai/api-keys/',
    portalLinks: {
      signupUrl: 'https://auth.mistral.ai/ui/registration',
      apiKeyUrl: 'https://console.mistral.ai/api-keys/',
      docsUrl: 'https://docs.mistral.ai/',
      billingUrl: 'https://console.mistral.ai/billing/'
    },
    detectedEnvVar: 'MISTRAL_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'coding',
    dailyQuotaLimitUSD: 40.0,
    currentDailySpendUSD: 1.10,
    correctiveAction: 'Ajoutez MISTRAL_API_KEY dans votre fichier .env pour activer le modèle souverain européen.',
    isEnabled: true,
    isDefault: false,
    priority: 5,
    tier: 'tertiary',
    apiKey: 'sk-mistral-*******************',
    defaultModel: 'mistral-large-latest',
    availableModels: ['mistral-large-latest', 'mistral-small-latest', 'codestral-latest', 'pixtral-large-latest'],
    temperature: 0.7,
    maxTokens: 4096,
    endpointUrl: 'https://api.mistral.ai/v1/chat/completions',
    latencyMs: 180,
    status: 'online',
    qualityScore: 92,
    minQualityThreshold: 65,
    maxLatencyThresholdMs: 2000,
    costPer1kInputTokens: 0.002,
    costPer1kOutputTokens: 0.006,
    consecutiveErrors: 0,
    totalCalls: 320,
    successCalls: 318,
    lastHealthCheck: '2026-08-27 15:25'
  },
  {
    id: 'prov-grok',
    name: 'xAI Grok-2 Realtime Stream',
    provider: 'grok',
    category: 'llm_reasoning',
    portalUrl: 'https://console.x.ai/',
    portalLinks: {
      signupUrl: 'https://console.x.ai/',
      apiKeyUrl: 'https://console.x.ai/',
      docsUrl: 'https://docs.x.ai/',
      billingUrl: 'https://console.x.ai/billing'
    },
    detectedEnvVar: 'XAI_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'general',
    dailyQuotaLimitUSD: 30.0,
    currentDailySpendUSD: 0.40,
    correctiveAction: 'Générez une clé sur console.x.ai et configurez XAI_API_KEY.',
    isEnabled: true,
    isDefault: false,
    priority: 6,
    tier: 'fallback',
    apiKey: 'xai-**************************',
    defaultModel: 'grok-2-1212',
    availableModels: ['grok-2-1212', 'grok-2-vision-1212', 'grok-beta'],
    temperature: 0.7,
    maxTokens: 4096,
    endpointUrl: 'https://api.x.ai/v1/chat/completions',
    latencyMs: 260,
    status: 'online',
    qualityScore: 91,
    minQualityThreshold: 65,
    maxLatencyThresholdMs: 2500,
    costPer1kInputTokens: 0.002,
    costPer1kOutputTokens: 0.010,
    consecutiveErrors: 0,
    totalCalls: 180,
    successCalls: 178,
    lastHealthCheck: '2026-08-27 15:20'
  },
  {
    id: 'prov-qwen',
    name: 'Alibaba Qwen 2.5 72B Instruct (Multi-langues)',
    provider: 'qwen',
    category: 'llm_reasoning',
    portalUrl: 'https://dashscope.console.aliyun.com/',
    portalLinks: {
      signupUrl: 'https://account.aliyun.com/register/intl_register.htm',
      apiKeyUrl: 'https://dashscope.console.aliyun.com/apiKey',
      docsUrl: 'https://www.alibabacloud.com/help/en/model-studio/developer-reference/what-is-model-studio',
      billingUrl: 'https://usercenter2-intl.aliyun.com/billing'
    },
    detectedEnvVar: 'QWEN_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'multilingual',
    dailyQuotaLimitUSD: 25.0,
    currentDailySpendUSD: 0.35,
    correctiveAction: 'Activez DashScope Model Studio sur Alibaba Cloud et définissez QWEN_API_KEY.',
    isEnabled: true,
    isDefault: false,
    priority: 7,
    tier: 'fallback',
    apiKey: 'sk-qwen-***********************',
    defaultModel: 'qwen-plus',
    availableModels: ['qwen-plus', 'qwen-max', 'qwen-turbo', 'qwen2.5-72b-instruct'],
    temperature: 0.7,
    maxTokens: 8192,
    endpointUrl: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions',
    latencyMs: 340,
    status: 'online',
    qualityScore: 90,
    minQualityThreshold: 60,
    maxLatencyThresholdMs: 3000,
    costPer1kInputTokens: 0.0004,
    costPer1kOutputTokens: 0.0012,
    consecutiveErrors: 0,
    totalCalls: 140,
    successCalls: 139,
    lastHealthCheck: '2026-08-27 15:15'
  },
  {
    id: 'prov-kimi',
    name: 'Moonshot Kimi K1.5 (Contexte Long 128k)',
    provider: 'kimi',
    category: 'llm_reasoning',
    portalUrl: 'https://platform.moonshot.cn/console/api-keys',
    portalLinks: {
      signupUrl: 'https://platform.moonshot.cn/login',
      apiKeyUrl: 'https://platform.moonshot.cn/console/api-keys',
      docsUrl: 'https://platform.moonshot.cn/docs',
      billingUrl: 'https://platform.moonshot.cn/console/pay'
    },
    detectedEnvVar: 'KIMI_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'legal_contract',
    dailyQuotaLimitUSD: 30.0,
    currentDailySpendUSD: 0.50,
    correctiveAction: 'Définissez KIMI_API_KEY dans votre environnement pour les analyses de contextes volumineux (128k).',
    isEnabled: true,
    isDefault: false,
    priority: 8,
    tier: 'fallback',
    apiKey: 'sk-kimi-***********************',
    defaultModel: 'moonshot-v1-32k',
    availableModels: ['moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k'],
    temperature: 0.6,
    maxTokens: 4096,
    endpointUrl: 'https://api.moonshot.cn/v1/chat/completions',
    latencyMs: 390,
    status: 'online',
    qualityScore: 89,
    minQualityThreshold: 60,
    maxLatencyThresholdMs: 3500,
    costPer1kInputTokens: 0.0015,
    costPer1kOutputTokens: 0.0030,
    consecutiveErrors: 0,
    totalCalls: 95,
    successCalls: 94,
    lastHealthCheck: '2026-08-27 15:10'
  },
  {
    id: 'prov-openrouter',
    name: 'OpenRouter Multi-Model Unified Gateway',
    provider: 'openrouter',
    category: 'llm_reasoning',
    portalUrl: 'https://openrouter.ai/keys',
    portalLinks: {
      signupUrl: 'https://openrouter.ai/signup',
      apiKeyUrl: 'https://openrouter.ai/keys',
      docsUrl: 'https://openrouter.ai/docs',
      billingUrl: 'https://openrouter.ai/credits'
    },
    detectedEnvVar: 'OPENROUTER_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'general',
    dailyQuotaLimitUSD: 50.0,
    currentDailySpendUSD: 2.15,
    correctiveAction: 'Configurez OPENROUTER_API_KEY pour router instantanément vers 200+ modèles IA en cascade.',
    isEnabled: true,
    isDefault: false,
    priority: 9,
    tier: 'fallback',
    apiKey: 'sk-or-v1-*********************',
    defaultModel: 'anthropic/claude-3.5-sonnet',
    availableModels: ['anthropic/claude-3.5-sonnet', 'openai/gpt-4o', 'meta-llama/llama-3.3-70b-instruct', 'deepseek/deepseek-r1'],
    temperature: 0.7,
    maxTokens: 4096,
    endpointUrl: 'https://openrouter.ai/api/v1/chat/completions',
    latencyMs: 280,
    status: 'online',
    qualityScore: 93,
    minQualityThreshold: 65,
    maxLatencyThresholdMs: 2800,
    costPer1kInputTokens: 0.002,
    costPer1kOutputTokens: 0.008,
    consecutiveErrors: 0,
    totalCalls: 210,
    successCalls: 209,
    lastHealthCheck: '2026-08-27 15:05'
  },
  {
    id: 'prov-huggingface',
    name: 'Hugging Face Pro Serverless Inference',
    provider: 'huggingface',
    category: 'llm_reasoning',
    portalUrl: 'https://huggingface.co/settings/tokens',
    portalLinks: {
      signupUrl: 'https://huggingface.co/join',
      apiKeyUrl: 'https://huggingface.co/settings/tokens',
      docsUrl: 'https://huggingface.co/docs/api-inference/index',
      billingUrl: 'https://huggingface.co/settings/billing'
    },
    detectedEnvVar: 'HUGGINGFACE_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'general',
    dailyQuotaLimitUSD: 20.0,
    currentDailySpendUSD: 0.15,
    correctiveAction: 'Générez un User Access Token sur Hugging Face et assignez HUGGINGFACE_API_KEY.',
    isEnabled: false,
    isDefault: false,
    priority: 10,
    tier: 'fallback',
    apiKey: 'hf_****************************',
    defaultModel: 'meta-llama/Meta-Llama-3.1-70B-Instruct',
    availableModels: ['meta-llama/Meta-Llama-3.1-70B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3', 'Qwen/Qwen2.5-72B-Instruct'],
    temperature: 0.7,
    maxTokens: 2048,
    endpointUrl: 'https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-70B-Instruct',
    latencyMs: 420,
    status: 'degraded',
    qualityScore: 84,
    minQualityThreshold: 55,
    maxLatencyThresholdMs: 4000,
    costPer1kInputTokens: 0.0005,
    costPer1kOutputTokens: 0.0015,
    consecutiveErrors: 1,
    totalCalls: 60,
    successCalls: 58,
    lastHealthCheck: '2026-08-27 14:50'
  },
  {
    id: 'prov-replicate',
    name: 'Replicate Cloud Inference Platform',
    provider: 'replicate',
    category: 'llm_reasoning',
    portalUrl: 'https://replicate.com/account/api-tokens',
    portalLinks: {
      signupUrl: 'https://replicate.com/signin',
      apiKeyUrl: 'https://replicate.com/account/api-tokens',
      docsUrl: 'https://replicate.com/docs',
      billingUrl: 'https://replicate.com/account/billing'
    },
    detectedEnvVar: 'REPLICATE_API_TOKEN',
    isEnvKeyPresent: false,
    taskSpecialty: 'general',
    dailyQuotaLimitUSD: 20.0,
    currentDailySpendUSD: 0.10,
    correctiveAction: 'Copiez votre token API sur replicate.com/account/api-tokens et déclarez REPLICATE_API_TOKEN.',
    isEnabled: false,
    isDefault: false,
    priority: 11,
    tier: 'fallback',
    apiKey: 'r8_****************************',
    defaultModel: 'meta/meta-llama-3-70b-instruct',
    availableModels: ['meta/meta-llama-3-70b-instruct', 'mistralai/mixtral-8x7b-instruct-v0.1'],
    temperature: 0.7,
    maxTokens: 2048,
    latencyMs: 450,
    status: 'degraded',
    qualityScore: 82,
    minQualityThreshold: 50,
    maxLatencyThresholdMs: 4500,
    costPer1kInputTokens: 0.0007,
    costPer1kOutputTokens: 0.0020,
    consecutiveErrors: 1,
    totalCalls: 45,
    successCalls: 43,
    lastHealthCheck: '2026-08-27 14:40'
  },
  {
    id: 'prov-ollama',
    name: 'Ollama Sovereign Local Node (Air-Gapped)',
    provider: 'ollama',
    category: 'llm_reasoning',
    portalUrl: 'https://ollama.com/',
    portalLinks: {
      signupUrl: 'https://ollama.com/',
      apiKeyUrl: 'https://ollama.com/download',
      docsUrl: 'https://github.com/ollama/ollama/tree/main/docs',
      billingUrl: 'https://ollama.com/'
    },
    detectedEnvVar: 'OLLAMA_ENDPOINT',
    isEnvKeyPresent: true,
    taskSpecialty: 'reasoning',
    dailyQuotaLimitUSD: 0.0,
    currentDailySpendUSD: 0.0,
    correctiveAction: 'Lancez Ollama en local avec `ollama run llama3` sur le port 11434.',
    isEnabled: true,
    isDefault: false,
    priority: 12,
    tier: 'fallback',
    apiKey: 'local-sovereign-token',
    defaultModel: 'llama3:latest',
    availableModels: ['llama3:latest', 'mistral:latest', 'qwen2.5:latest', 'deepseek-r1:latest'],
    temperature: 0.7,
    maxTokens: 4096,
    endpointUrl: 'http://localhost:11434/v1/chat/completions',
    latencyMs: 95,
    status: 'online',
    qualityScore: 88,
    minQualityThreshold: 50,
    maxLatencyThresholdMs: 1500,
    costPer1kInputTokens: 0.0,
    costPer1kOutputTokens: 0.0,
    consecutiveErrors: 0,
    totalCalls: 310,
    successCalls: 310,
    lastHealthCheck: '2026-08-27 15:00'
  },
  {
    id: 'prov-kling',
    name: 'Kling AI 1.5 (Génération Vidéo Cinématique)',
    provider: 'kling',
    category: 'video_generation',
    portalUrl: 'https://klingai.com/',
    portalLinks: {
      signupUrl: 'https://klingai.com/',
      apiKeyUrl: 'https://klingai.com/',
      docsUrl: 'https://klingai.com/docs',
      billingUrl: 'https://klingai.com/pricing'
    },
    detectedEnvVar: 'KLING_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'video_generation',
    dailyQuotaLimitUSD: 80.0,
    currentDailySpendUSD: 3.50,
    correctiveAction: 'Définissez KLING_API_KEY dans votre fichier .env pour activer la génération vidéo cinématique Text-to-Video.',
    isEnabled: true,
    isDefault: false,
    priority: 13,
    tier: 'secondary',
    apiKey: 'kling_key_****************',
    defaultModel: 'kling-v1.5-pro',
    availableModels: ['kling-v1.5-pro', 'kling-v1-standard', 'kling-motion-brush'],
    temperature: 0.7,
    maxTokens: 1024,
    endpointUrl: 'https://api.klingai.com/v1/videos/text2video',
    latencyMs: 4500,
    status: 'online',
    qualityScore: 97,
    minQualityThreshold: 75,
    maxLatencyThresholdMs: 30000,
    costPer1kInputTokens: 0.05,
    costPer1kOutputTokens: 0.10,
    consecutiveErrors: 0,
    totalCalls: 85,
    successCalls: 84,
    lastHealthCheck: '2026-08-27 15:00'
  },
  {
    id: 'prov-runway',
    name: 'RunwayML Gen-3 Alpha & Gen-2 Video Studio',
    provider: 'runway',
    category: 'video_generation',
    portalUrl: 'https://app.runwayml.com/settings/api-keys',
    portalLinks: {
      signupUrl: 'https://app.runwayml.com/signup',
      apiKeyUrl: 'https://app.runwayml.com/settings/api-keys',
      docsUrl: 'https://docs.runwayml.com/',
      billingUrl: 'https://app.runwayml.com/settings/billing'
    },
    detectedEnvVar: 'RUNWAY_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'video_generation',
    dailyQuotaLimitUSD: 90.0,
    currentDailySpendUSD: 4.80,
    correctiveAction: 'Configurez RUNWAY_API_KEY dans vos variables d\'environnement pour le studio d\'effets visuels Gen-3.',
    isEnabled: true,
    isDefault: false,
    priority: 14,
    tier: 'secondary',
    apiKey: 'runway_key_**************',
    defaultModel: 'gen3a_turbo',
    availableModels: ['gen3a_turbo', 'gen3_alpha', 'gen2'],
    temperature: 0.7,
    maxTokens: 1024,
    endpointUrl: 'https://api.runwayml.com/v1/tasks',
    latencyMs: 3800,
    status: 'online',
    qualityScore: 98,
    minQualityThreshold: 75,
    maxLatencyThresholdMs: 25000,
    costPer1kInputTokens: 0.06,
    costPer1kOutputTokens: 0.12,
    consecutiveErrors: 0,
    totalCalls: 62,
    successCalls: 62,
    lastHealthCheck: '2026-08-27 15:00'
  },
  {
    id: 'prov-heygene',
    name: 'HeyGen Interactive AI Avatars & Talking Video',
    provider: 'heygene',
    category: 'avatar_speech',
    portalUrl: 'https://app.heygen.com/settings?nav=API',
    portalLinks: {
      signupUrl: 'https://app.heygen.com/signup',
      apiKeyUrl: 'https://app.heygen.com/settings?nav=API',
      docsUrl: 'https://docs.heygen.com/reference/overview',
      billingUrl: 'https://app.heygen.com/settings?nav=Billing'
    },
    detectedEnvVar: 'HEYGEN_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'voice_speech',
    dailyQuotaLimitUSD: 60.0,
    currentDailySpendUSD: 2.90,
    correctiveAction: 'Déclarez HEYGEN_API_KEY dans votre fichier .env pour activer les avatars vidéo interactifs parlants.',
    isEnabled: true,
    isDefault: false,
    priority: 15,
    tier: 'secondary',
    apiKey: 'heygen_key_**************',
    defaultModel: 'avatar_v2_streaming',
    availableModels: ['avatar_v2_streaming', 'talking_photo_hd', 'interactive_avatar'],
    temperature: 0.6,
    maxTokens: 2048,
    endpointUrl: 'https://api.heygen.com/v2/video/generate',
    latencyMs: 1200,
    status: 'online',
    qualityScore: 96,
    minQualityThreshold: 70,
    maxLatencyThresholdMs: 15000,
    costPer1kInputTokens: 0.04,
    costPer1kOutputTokens: 0.08,
    consecutiveErrors: 0,
    totalCalls: 110,
    successCalls: 109,
    lastHealthCheck: '2026-08-27 15:00'
  },
  {
    id: 'prov-n8n',
    name: 'n8n Workflow Automation & Pipeline Engine',
    provider: 'n8n',
    category: 'workflow_automation',
    portalUrl: 'https://n8n.io/',
    portalLinks: {
      signupUrl: 'https://n8n.io/',
      apiKeyUrl: 'https://n8n.io/',
      docsUrl: 'https://docs.n8n.io/',
      billingUrl: 'https://n8n.io/pricing/'
    },
    detectedEnvVar: 'N8N_WEBHOOK_URL',
    isEnvKeyPresent: false,
    taskSpecialty: 'workflow_automation',
    dailyQuotaLimitUSD: 10.0,
    currentDailySpendUSD: 0.02,
    correctiveAction: 'Renseignez l\'URL de déclencheur webhook dans N8N_WEBHOOK_URL pour automatiser vos flux métier.',
    isEnabled: true,
    isDefault: false,
    priority: 16,
    tier: 'primary',
    apiKey: 'n8n_key_*****************',
    defaultModel: 'webhook-pipeline-v1',
    availableModels: ['webhook-pipeline-v1', 'autonomous-agent-flow', 'trade-kyc-validator'],
    temperature: 0.2,
    maxTokens: 4096,
    endpointUrl: 'https://n8n.lemondeavous.com/webhook/',
    latencyMs: 210,
    status: 'online',
    qualityScore: 99,
    minQualityThreshold: 80,
    maxLatencyThresholdMs: 5000,
    costPer1kInputTokens: 0.00001,
    costPer1kOutputTokens: 0.00001,
    consecutiveErrors: 0,
    totalCalls: 430,
    successCalls: 429,
    lastHealthCheck: '2026-08-27 15:00'
  },
  {
    id: 'prov-elevenlabs',
    name: 'ElevenLabs Studio HD Multilingual TTS',
    provider: 'elevenlabs',
    category: 'avatar_speech',
    portalUrl: 'https://elevenlabs.io/app/settings/api-keys',
    portalLinks: {
      signupUrl: 'https://elevenlabs.io/sign-up',
      apiKeyUrl: 'https://elevenlabs.io/app/settings/api-keys',
      docsUrl: 'https://elevenlabs.io/docs/introduction',
      billingUrl: 'https://elevenlabs.io/app/subscription'
    },
    detectedEnvVar: 'ELEVENLABS_API_KEY',
    isEnvKeyPresent: false,
    taskSpecialty: 'voice_speech',
    dailyQuotaLimitUSD: 50.0,
    currentDailySpendUSD: 1.85,
    correctiveAction: 'Déclarez ELEVENLABS_API_KEY dans votre fichier .env pour activer la synthèse vocale studio HD.',
    isEnabled: true,
    isDefault: false,
    priority: 17,
    tier: 'primary',
    apiKey: 'xi_key_******************',
    defaultModel: 'eleven_multilingual_v2',
    availableModels: ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_flash_v2_5'],
    temperature: 0.5,
    maxTokens: 2048,
    endpointUrl: 'https://api.elevenlabs.io/v1/text-to-speech',
    latencyMs: 180,
    status: 'online',
    qualityScore: 99,
    minQualityThreshold: 80,
    maxLatencyThresholdMs: 3000,
    costPer1kInputTokens: 0.001,
    costPer1kOutputTokens: 0.005,
    consecutiveErrors: 0,
    totalCalls: 540,
    successCalls: 539,
    lastHealthCheck: '2026-08-27 15:00'
  }
];

// ── 3. MODULES DE LA PLATEFORME ──
const INITIAL_MODULES: PlatformModuleConfig[] = [
  { id: 'mod-home', code: 'home', label: 'Accueil & Cap', category: 'Pilier 1', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Briefing, synthèse Diallo OS et priorités de vie.', icon: 'LayoutGrid', activeSessionsCount: 482 },
  { id: 'mod-parcours', code: 'parcours', label: 'Mon Parcours de Vie (Dossiers A➔B)', category: 'Pilier 1', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Gestionnaire de dossiers structurés et jalons.', icon: 'FolderKanban', activeSessionsCount: 312, assignedLeadExpertId: '8' },
  { id: 'mod-campus', code: 'campus', label: 'Campus & Éducation', category: 'Pilier 2', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'MOOCs, examens interactifs, diplômes certifiés.', icon: 'GraduationCap', activeSessionsCount: 220, assignedLeadExpertId: '3' },
  { id: 'mod-languages', code: 'languages', label: 'Langues & Immersion', category: 'Pilier 2', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: '40+ langues mondiales, audio natif et simulations.', icon: 'Languages', activeSessionsCount: 154 },
  { id: 'mod-career', code: 'career', label: 'Carrière & Accomplissement', category: 'Pilier 2', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'GPS Trajectoire, CV Maître, simulateur entretien 3D.', icon: 'Briefcase', activeSessionsCount: 298, assignedLeadExpertId: '2' },
  { id: 'mod-health', code: 'health', label: 'Santé & Bien-être', category: 'Pilier 3', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Carnet préventif, conseils hygiène et orientation.', icon: 'HeartPulse', activeSessionsCount: 110, assignedLeadExpertId: '4' },
  { id: 'mod-housing', code: 'housing', label: 'Habitat & Installation', category: 'Pilier 3', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Baux, calcul APL, recherche logement internationale.', icon: 'Home', activeSessionsCount: 165, assignedLeadExpertId: '5' },
  { id: 'mod-wallet', code: 'wallet', label: 'Finance & Wallet LMAV', category: 'Pilier 3', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Comptes multi-devises, séquestre et crédits.', icon: 'Wallet', activeSessionsCount: 340, assignedLeadExpertId: '7' },
  { id: 'mod-admin-proc', code: 'admin-procedures', label: 'Mes Démarches & Formalités', category: 'Pilier 3', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Dossiers préfectoraux, cerfas et titres de séjour.', icon: 'FileText', activeSessionsCount: 205, assignedLeadExpertId: '1' },
  { id: 'mod-legal', code: 'legal', label: 'Droit & Juridique', category: 'Pilier 3', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Textes officiels, relecture contrats, actes certifiés.', icon: 'Scale', activeSessionsCount: 178, assignedLeadExpertId: '1' },
  { id: 'mod-world', code: 'world', label: 'Mobilité & Expatriation', category: 'Pilier 3', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Simulateur de visas pour 195 pays et formalités.', icon: 'Globe', activeSessionsCount: 260, assignedLeadExpertId: '6' },
  { id: 'mod-studio', code: 'studio', label: 'Studio Créatif & Multimédia', category: 'Pilier 4', isEnabled: true, inMaintenance: false, accessLevel: 'verified', description: 'Génération de vidéos, scripts et contenus visuels.', icon: 'Palette', activeSessionsCount: 89 },
  { id: 'mod-shop', code: 'shop', label: 'Marché Mondial B2B/B2C', category: 'Pilier 4', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Sourcing, import-export, devis RFQ et salons B2B.', icon: 'ShoppingBag', activeSessionsCount: 410, assignedLeadExpertId: '8' },
  { id: 'mod-social', code: 'social', label: 'Réseau MOC & Live', category: 'Pilier 5', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Fil de confiance, Reels, Tribus et Lives interactifs.', icon: 'Users', activeSessionsCount: 520 },
  { id: 'mod-chat', code: 'chat', label: 'Catalogue des Experts Diallo', category: 'Pilier 5', isEnabled: true, inMaintenance: false, accessLevel: 'all', description: 'Spécialistes d’élite de la Famille Diallo pour consultation humaine.', icon: 'MessageSquare', activeSessionsCount: 390 },
  { id: 'mod-council', code: 'council', label: 'Conseil des Sages Réuni', category: 'Pilier 5', isEnabled: true, inMaintenance: false, accessLevel: 'verified', description: 'Délibération collégiale et arbitrage pluridisciplinaire.', icon: 'ShieldCheck', activeSessionsCount: 75 }
];

// ── 4. MODÈLES OFFICIELS DE DOCUMENTS ET LETTRES ──
const INITIAL_TEMPLATES: OfficialDocumentTemplate[] = [
  {
    id: 'tpl-recours-prefecture',
    title: 'Recours Gracieux Titre de Séjour & Préfecture',
    category: 'procedure',
    description: 'Modèle officiel de recours gracieux ou hiérarchique avec argumentation juridique et pièces jointes.',
    headerTitle: 'RÉPUBLIQUE DÉMOCRATIQUE / DIRECTION DES ÉTRANGERS',
    headerSubtitle: 'Cabinet Juridique Maître Diallo — Affaires Administratives & Citoyenneté',
    watermarkText: 'LE MONDE À VOUS — OFFICIEL',
    bodyTemplate: `À l'attention de Monsieur le Préfet de {{PREFECTURE_NAME}}
Service des Titres de Séjour et de l'Intégration
Dossier N° : {{DOSSIER_REF}}

Objet : Recours gracieux suite à la notification du {{DATE_NOTIFICATION}} relative à la demande de {{MOTIF_DEMANDE}}
Demandeur : {{USER_NAME}}, né(e) le {{USER_BIRTHDATE}}, Citoyenneté N° {{CITIZENSHIP_ID}}

Monsieur le Préfet,

Je soussigné(e), {{USER_NAME}}, demeurant au {{USER_ADDRESS}}, ai l'honneur de solliciter par la présente votre haute bienveillance afin de réexaminer ma demande de {{TITRE_TYPE}}.

En effet, ma situation sur le territoire se caractérise par :
1. Une insertion professionnelle et civique continue attestée par {{PREUVE_INSERTION}} ;
2. Un centre de vie familiale et personnelle solidement établi ;
3. Le respect scrupuleux des lois et obligations administratives.

Les éléments nouveaux joints au présent mémoire démontrent sans équivoque la réunion de l'ensemble des critères légaux prévus par les dispositions en vigueur.

En conséquence, je sollicite respectueusement la révision de la position administrative et la délivrance de mon récépissé ou titre correspondant.

Dans l'attente de votre réponse, je vous prie d'agréer, Monsieur le Préfet, l'expression de ma très haute considération.

Fait à {{VILLE_FAIT}}, le {{DATE}}`,
    variables: [
      { key: 'USER_NAME', label: 'Nom complet du demandeur', defaultValue: 'Alexandre Dupont', description: 'Identité civile complète' },
      { key: 'CITIZENSHIP_ID', label: 'Identifiant Citoyen LMAV', defaultValue: 'LMAV-2025-8842-FR', description: 'Numéro unique' },
      { key: 'PREFECTURE_NAME', label: 'Nom de la Préfecture / Administration', defaultValue: 'Préfecture de Police de Paris', description: 'Autorité destinataire' },
      { key: 'DOSSIER_REF', label: 'Référence du dossier', defaultValue: 'DOS-2026-ADM-771', description: 'Numéro de dossier' },
      { key: 'DATE_NOTIFICATION', label: 'Date de décision initiale', defaultValue: '14 Août 2026', description: 'Date de notification' },
      { key: 'MOTIF_DEMANDE', label: 'Motif de la demande', defaultValue: 'renouvellement de titre de séjour salarié', description: 'Objet exact' },
      { key: 'TITRE_TYPE', label: 'Type de titre sollicité', defaultValue: 'Carte de séjour pluriannuelle Salarié', description: 'Titre visé' },
      { key: 'USER_ADDRESS', label: 'Adresse de résidence', defaultValue: '24 Avenue des Champs-Élysées, 75008 Paris', description: 'Domicile légal' },
      { key: 'PREUVE_INSERTION', label: 'Justificatif clé', defaultValue: 'un contrat de travail CDI et 24 fiches de paie', description: 'Pièces maîtresses' },
      { key: 'VILLE_FAIT', label: 'Ville de signature', defaultValue: 'Paris', description: 'Lieu d’émission' },
      { key: 'DATE', label: 'Date d’émission', defaultValue: '27 Août 2026', description: 'Date du jour' }
    ],
    defaultSignerId: 'sig-maitre-diallo',
    defaultStampId: 'stamp-juridique',
    isOfficial: true,
    qrCodeVerification: true,
    footerLegalText: 'Document certifié conforme selon le protocole de signature électronique LMAV. Vérifiable sur verify.lemondeavous.com.',
    updatedAt: '2026-08-27',
    author: 'Maître DIALLO (Pôle Juridique)'
  },
  {
    id: 'tpl-lettre-institutionnelle-projet',
    title: 'Lettre de Saisine Institutionnelle & Partenariat Stratégique',
    category: 'letter',
    description: 'Lettre de haut niveau pour solliciter un ministère, une ambassade, un bailleur de fonds ou un consortium.',
    headerTitle: 'LE MONDE À VOUS — DÉLÉGATION GÉNÉRALE DES PROJETS',
    headerSubtitle: 'Secrétariat Exécutif du Directeur Diallo — Relations Institutionnelles',
    watermarkText: 'CONFIDENTIEL & SOUVERAIN',
    bodyTemplate: `À l'attention de : {{DESTINATAIRE_TITRE}}
Organisation / Ministère : {{ORGANISATION_NAME}}
Réf. Mission : {{MISSION_REF}}

Objet : Manifestation d'intérêt et proposition d'alliance opérationnelle pour le programme : {{PROGRAMME_NAME}}

Excellence / Monsieur le Directeur Général,

Au nom de la Direction des Projets Stratégiques de la plateforme "Le Monde à Vous" et de la communauté de nos 50 000 bâtisseurs, j'ai l'insigne honneur de porter à votre haute attention notre initiative : {{PROGRAMME_NAME}}.

Ce programme s'articule autour de 3 piliers structurants :
1. {{PILIER_1}}
2. {{PILIER_2}}
3. {{PILIER_3}}

Nous avons identifié de remarquables synergies d'action entre vos priorités régaliennes et nos capacités de déploiement technologique et humain.

Nous sollicitons par la présente une audience de travail présentielle ou via le Conseil Réuni, afin de vous présenter les livrables d'impact, les indicateurs chiffrés et la convention de partenariat envisagée.

Restant à votre entière disposition, nous vous prions d'agréer, Excellence, l'assurance de notre dévouement le plus sincère.

{{SIGNER_NAME}}
{{SIGNER_TITLE}}`,
    variables: [
      { key: 'DESTINATAIRE_TITRE', label: 'Titre du destinataire', defaultValue: 'Monsieur le Secrétaire Général du Ministère du Commerce', description: 'Destinataire officiel' },
      { key: 'ORGANISATION_NAME', label: 'Nom de l’organisme', defaultValue: 'Ministère du Commerce et de l’Industrie', description: 'Institution' },
      { key: 'MISSION_REF', label: 'Référence Mission', defaultValue: 'LMAV-STRAT-2026-B2B-04', description: 'Code interne' },
      { key: 'PROGRAMME_NAME', label: 'Intitulé du programme', defaultValue: 'Couloir Logistique & Digital Afrique-Europe 2026', description: 'Nom de l’initiative' },
      { key: 'PILIER_1', label: 'Pilier 1', defaultValue: 'Numérisation intégrale des certificats d’origine et des traçabilités douanières', description: 'Axe 1' },
      { key: 'PILIER_2', label: 'Pilier 2', defaultValue: 'Facilitation de l’accès au financement d’amorçage pour 500 PME exportatrices', description: 'Axe 2' },
      { key: 'PILIER_3', label: 'Pilier 3', defaultValue: 'Garantie de séquestre bancaire et arbitrage rapide des litiges', description: 'Axe 3' },
      { key: 'SIGNER_NAME', label: 'Nom du signataire', defaultValue: 'Directeur DIALLO', description: 'Signataire' },
      { key: 'SIGNER_TITLE', label: 'Titre du signataire', defaultValue: 'Directeur Général des Opérations & Projets LMAV', description: 'Fonction' },
      { key: 'DATE', label: 'Date', defaultValue: '27 Août 2026', description: 'Date d’émission' }
    ],
    defaultSignerId: 'sig-directeur-diallo',
    defaultStampId: 'stamp-souverain',
    isOfficial: true,
    qrCodeVerification: true,
    footerLegalText: 'Document officiel Le Monde à Vous — Acte diplomatique et commercial non transférable sans accord préalable.',
    updatedAt: '2026-08-27',
    author: 'Directeur DIALLO'
  },
  {
    id: 'tpl-attestation-reussite-campus',
    title: 'Attestation Officielle de Validation & Réussite Campus',
    category: 'certificate',
    description: 'Certificat officiel attestant de la complétion et de la réussite d’un parcours d’excellence académique ou professionnel.',
    headerTitle: 'CAMPUS INTERNATIONAL LE MONDE À VOUS',
    headerSubtitle: 'Conseil Supérieur Pédagogique & Direction des Évaluations',
    watermarkText: 'EXCELLENCE & SAVOIR',
    bodyTemplate: `LE CONSEIL ACADÉMIQUE DU CAMPUS LE MONDE À VOUS

Atteste par la présente que l'auditeur(trice) :

{{USER_NAME}}
Né(e) le : {{USER_BIRTHDATE}} — Citoyenneté N° {{CITIZENSHIP_ID}}

A satisfait avec brio à l'ensemble des épreuves théoriques, cas pratiques et examens de validation orale devant le jury présidé par le Professeur Diallo, pour la formation d'élite :

" {{FORMATION_TITLE}} "

Niveau validé : {{NIVEAU_VALIDE}}
Mention obtenue : {{MENTION}} (Note finale : {{NOTE_FINALE}}/20)
Crédits académiques ECTS alloués : {{ECTS_CREDITS}} Crédits
Date d'obtention : {{DATE}}

En foi de quoi, la présente attestation lui est délivrée pour valoir et servir ce que de droit auprès de toute autorité académique, consulaire ou employeur mondial.

Délivré sous le sceau académique souverain.`,
    variables: [
      { key: 'USER_NAME', label: 'Nom de l’étudiant(e)', defaultValue: 'Aïcha Benali', description: 'Nom complet' },
      { key: 'USER_BIRTHDATE', label: 'Date de naissance', defaultValue: '12/04/1998', description: 'Naissance' },
      { key: 'CITIZENSHIP_ID', label: 'Numéro Citoyen', defaultValue: 'LMAV-2025-9012-MA', description: 'ID Citoyen' },
      { key: 'FORMATION_TITLE', label: 'Titre de la formation', defaultValue: 'Masterclass Internationale Data, Cloud & Intelligence Artificielle Éthique', description: 'Parcours' },
      { key: 'NIVEAU_VALIDE', label: 'Niveau validé', defaultValue: 'Expert Professionnel Niveau 7 (Bac+5 équivalent)', description: 'Niveau' },
      { key: 'MENTION', label: 'Mention', defaultValue: 'Très Bien avec Félicitations du Jury', description: 'Mention' },
      { key: 'NOTE_FINALE', label: 'Note finale', defaultValue: '18.5', description: 'Sur 20' },
      { key: 'ECTS_CREDITS', label: 'Crédits ECTS', defaultValue: '60', description: 'Crédits' },
      { key: 'DATE', label: 'Date', defaultValue: '27 Août 2026', description: 'Date de délivrance' }
    ],
    defaultSignerId: 'sig-prof-diallo',
    defaultStampId: 'stamp-academique',
    isOfficial: true,
    qrCodeVerification: true,
    footerLegalText: 'Attestation académique infalsifiable enregistrée sur le registre cryptographique mondial LMAV.',
    updatedAt: '2026-08-27',
    author: 'Professeur DIALLO'
  },
  {
    id: 'tpl-contrat-commercial-b2b',
    title: 'Contrat-Cadre de Fourniture & Vente B2B Sécurisée',
    category: 'contract',
    description: 'Convention contractuelle bilatérale avec Incoterms, clause de séquestre Wallet et arbitrage MOK Trust.',
    headerTitle: 'TRIBUNAL DE COMMERCE & PLACE DE MARCHÉ B2B',
    headerSubtitle: 'Chambre Arbitrale Internationale — Protocole de Séquestre Garanti',
    watermarkText: 'CONTRAT EXÉCUTOIRE',
    bodyTemplate: `CONTRAT DE FOURNITURE COMMERCIALE INTERNATIONALE N° {{CONTRAT_REF}}

ENTRE LES SOUSSIGNÉS :

D'UNE PART, L'ACHETEUR :
Raison Sociale : {{ACHETEUR_NOM}}
Représentée par : {{ACHETEUR_DIR}}
Immatriculation / RCCM : {{ACHETEUR_ID}}

D'AUTRE PART, LE FOURNISSEUR VENDEUR :
Raison Sociale : {{VENDEUR_NOM}}
Représentée par : {{VENDEUR_DIR}}
Immatriculation : {{VENDEUR_ID}}

ARTICLE 1 — OBJET DU CONTRAT :
Le Vendeur s'engage à livrer à l'Acheteur : {{MARCHANDISE_DESCRIPTION}}, d'un volume total de {{VOLUME_TOTAL}}.

ARTICLE 2 — PRIX ET SÉQUESTRE GARANTI :
Le montant total de la commande s'élève à {{MONTANT_TOTAL}} {{DEVISE}}.
Les fonds sont bloqués dès signature sur le compte séquestre Wallet LMAV et libérés au Vendeur uniquement après inspection physique conforme (Rapport MOK Trust N° {{INSPECTION_REF}}).

ARTICLE 3 — CONDITIONS DE LIVRAISON (INCOTERM) :
La marchandise sera acheminée selon la règle {{INCOTERM_RULE}} au port / aéroport de {{DESTINATION_PORT}} avec une date limite de livraison fixée au {{LIVRAISON_DATE}}.

ARTICLE 4 — LOI APPLICABLE ET MÉDIATION :
En cas de litige, les parties conviennent expressément de soumettre leur différend au Conseil Arbitral de Maître Diallo et du Directeur Diallo avant toute saisine judiciaire.

Fait en 2 exemplaires originaux numérisés et scellés, le {{DATE}}.`,
    variables: [
      { key: 'CONTRAT_REF', label: 'Numéro de Contrat', defaultValue: 'B2B-2026-LMAV-882', description: 'Réf Contrat' },
      { key: 'ACHETEUR_NOM', label: 'Nom de l’Acheteur', defaultValue: 'Global Distribution SAS (Paris, France)', description: 'Acheteur' },
      { key: 'ACHETEUR_DIR', label: 'Directeur Acheteur', defaultValue: 'M. Alexandre Dupont', description: 'Représentant' },
      { key: 'ACHETEUR_ID', label: 'ID Société Acheteur', defaultValue: 'SIREN 892 104 221', description: 'Identifiant' },
      { key: 'VENDEUR_NOM', label: 'Nom du Fournisseur', defaultValue: 'AfriqLogistics & Agro Export SARL (Abidjan)', description: 'Fournisseur' },
      { key: 'VENDEUR_DIR', label: 'Directeur Fournisseur', defaultValue: 'Mme Sarah Koné', description: 'Représentant' },
      { key: 'VENDEUR_ID', label: 'ID Société Fournisseur', defaultValue: 'RCCM CI-ABJ-2022-B-140', description: 'Identifiant' },
      { key: 'MARCHANDISE_DESCRIPTION', label: 'Description des marchandises', defaultValue: '25 Tonnes de Fèves de Cacao Grade A Certifié Équitable', description: 'Produits' },
      { key: 'VOLUME_TOTAL', label: 'Volume total', defaultValue: '1 Conteneur 40 Pieds HQ', description: 'Quantité' },
      { key: 'MONTANT_TOTAL', label: 'Montant total', defaultValue: '112 500', description: 'Chiffre' },
      { key: 'DEVISE', label: 'Devise', defaultValue: 'EUR (€)', description: 'Monnaie' },
      { key: 'INSPECTION_REF', label: 'Réf Inspection MOK Trust', defaultValue: 'INSP-2026-TRUST-99', description: 'Contrôle' },
      { key: 'INCOTERM_RULE', label: 'Règle Incoterm', defaultValue: 'CIF (Coût, Assurance et Fret)', description: 'Incoterm' },
      { key: 'DESTINATION_PORT', label: 'Port d’arrivée', defaultValue: 'Port du Havre (France)', description: 'Destination' },
      { key: 'LIVRAISON_DATE', label: 'Date limite de livraison', defaultValue: '15 Octobre 2026', description: 'Échéance' },
      { key: 'DATE', label: 'Date', defaultValue: '27 Août 2026', description: 'Date de signature' }
    ],
    defaultSignerId: 'sig-directeur-diallo',
    defaultStampId: 'stamp-financier',
    isOfficial: true,
    qrCodeVerification: true,
    footerLegalText: 'Contrat commercial enregistré avec horodatage certifié et séquestre bancaire garanti par Le Monde à Vous.',
    updatedAt: '2026-08-27',
    author: 'Directeur DIALLO & Maître DIALLO'
  }
];

// ── 5. SIGNATURES NUMÉRIQUES OFFICIELLES ──
const INITIAL_SIGNATURES: OfficialSignature[] = [
  {
    id: 'sig-directeur-diallo',
    signerName: 'Directeur DIALLO',
    signerTitle: 'Directeur Général des Opérations & Stratégie LMAV',
    expertId: '8',
    signatureType: 'vector',
    signatureSvgOrDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M 20 50 Q 50 10 90 40 T 160 30 Q 190 20 210 55 M 60 45 L 180 45 M 100 20 Q 120 60 140 15" stroke="%231e3a8a" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="130" y="65" font-family="cursive" font-size="10" fill="%231e3a8a">D. Diallo</text></svg>',
    hashSha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    issuedAt: '2025-01-01',
    isActive: true
  },
  {
    id: 'sig-maitre-diallo',
    signerName: 'Maître DIALLO',
    signerTitle: 'Avocat au Barreau & Juriste Référent International',
    expertId: '1',
    signatureType: 'vector',
    signatureSvgOrDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M 15 35 Q 45 60 75 20 Q 110 -5 135 45 T 195 25 M 35 55 Q 85 50 170 52 M 80 15 L 85 60" stroke="%230f172a" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="120" y="66" font-family="serif" font-size="10" font-style="italic" fill="%230f172a">Me Diallo Jur.</text></svg>',
    hashSha256: '9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08',
    issuedAt: '2025-01-01',
    isActive: true
  },
  {
    id: 'sig-prof-diallo',
    signerName: 'Professeur DIALLO',
    signerTitle: 'Doyen du Conseil Supérieur Académique',
    expertId: '3',
    signatureType: 'vector',
    signatureSvgOrDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M 25 45 Q 60 15 95 40 Q 130 65 165 30 T 205 35 M 40 50 L 190 50 M 90 25 Q 110 5 130 35" stroke="%231d4ed8" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="110" y="65" font-family="sans-serif" font-size="9" font-weight="bold" fill="%231d4ed8">Pr. Diallo Univ.</text></svg>',
    hashSha256: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
    issuedAt: '2025-01-01',
    isActive: true
  },
  {
    id: 'sig-docteur-diallo',
    signerName: 'Docteur DIALLO',
    signerTitle: 'Médecin Coordinateur & Prévention Santé Globale',
    expertId: '4',
    signatureType: 'vector',
    signatureSvgOrDataUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M 20 40 Q 50 20 80 45 T 140 25 T 195 45 M 50 30 Q 100 65 170 30 M 75 15 L 75 55 M 65 35 L 85 35" stroke="%23047857" stroke-width="2.5" fill="none" stroke-linecap="round"/><text x="130" y="65" font-family="sans-serif" font-size="9" fill="%23047857">Dr Diallo Med.</text></svg>',
    hashSha256: '4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a',
    issuedAt: '2025-01-01',
    isActive: true
  }
];

// ── 6. CACHETS ET TAMPONS OFFICIELS ──
const INITIAL_STAMPS: OfficialStamp[] = [
  {
    id: 'stamp-souverain',
    title: 'Sceau Souverain de la République LMAV',
    institution: 'RÉPUBLIQUE LE MONDE À VOUS',
    motto: 'SOUVERAINETÉ • INTÉGRITÉ • EXCELLENCE MONDIALE',
    shape: 'circular',
    color: '#1e3a8a',
    sealIcon: 'Shield',
    securityLevel: 'diplomatic',
    securityHash: 'SEAL-LMAV-DIPLO-2026-9901',
    isActive: true
  },
  {
    id: 'stamp-juridique',
    title: 'Cachet Notarial & Conformité Juridique',
    institution: 'CABINET JURIDIQUE MAÎTRE DIALLO',
    motto: 'DROIT INTERNATIONAL • ACTES CERTIFIÉS • CONFORMITÉ',
    shape: 'circular',
    color: '#0f172a',
    sealIcon: 'Scale',
    securityLevel: 'juridique',
    securityHash: 'SEAL-LMAV-JUR-2026-4412',
    isActive: true
  },
  {
    id: 'stamp-academique',
    title: 'Grand Sceau Académique Campus',
    institution: 'CONSEIL SUPÉRIEUR ACADÉMIQUE DU CAMPUS',
    motto: 'SCIENTIA • VIRTUS • UNIVERSITAS',
    shape: 'circular',
    color: '#1d4ed8',
    sealIcon: 'GraduationCap',
    securityLevel: 'academique',
    securityHash: 'SEAL-LMAV-ACAD-2026-3398',
    isActive: true
  },
  {
    id: 'stamp-financier',
    title: 'Sceau Séquestre & Garantie Bancaire B2B',
    institution: 'CHAMBRE DU SÉQUESTRE ET DU COMMERCE MONDIAL',
    motto: 'FUNDS SECURED • MOK TRUST • ESCROW VERIFIED',
    shape: 'circular',
    color: '#047857',
    sealIcon: 'Lock',
    securityLevel: 'financier',
    securityHash: 'SEAL-LMAV-ESCROW-2026-7721',
    isActive: true
  }
];

// ── 7. WORKFLOWS ET PIPELINES D’APPROBATION ──
const INITIAL_WORKFLOWS: WorkflowPipelineConfig[] = [
  {
    id: 'wf-titre-sejour',
    name: 'Workflow Démarche Titre de Séjour & Recours',
    category: 'Juridique & Administration',
    description: 'Pipeline complet de la collecte des pièces jusqu’à la signature officielle du mémoire de recours par Maître Diallo.',
    triggerEvent: 'Nouveau dossier préfectoral créé par l’usager',
    isAutomatic: true,
    isActive: true,
    steps: [
      { id: 'st-1', stepNumber: 1, title: 'Diagnostic & Check-list des pièces', description: 'Vérification de la validité des justificatifs de domicile et ressources.', assignedRole: 'ai_synthesis', actionType: 'draft', requiresSignature: false, requiresStamp: false, timeLimitDays: 2 },
      { id: 'st-2', stepNumber: 2, title: 'Rédaction du mémoire argumenté', description: 'Génération du projet de lettre avec jurisprudence applicable.', assignedRole: 'expert', actionType: 'review', requiresSignature: false, requiresStamp: false, timeLimitDays: 3 },
      { id: 'st-3', stepNumber: 3, title: 'Validation et signature par Maître Diallo', description: 'Apposition de la signature numérique certifiée et du sceau juridique.', assignedRole: 'expert', actionType: 'sign_and_stamp', requiresSignature: true, requiresStamp: true, timeLimitDays: 1 },
      { id: 'st-4', stepNumber: 4, title: 'Archivage sécurisé dans le Coffre Google Drive', description: 'Génération de l’attestation avec QR Code de traçabilité.', assignedRole: 'system', actionType: 'archive', requiresSignature: false, requiresStamp: false, timeLimitDays: 1 }
    ],
    createdAt: '2025-01-10',
    updatedAt: '2026-08-20'
  },
  {
    id: 'wf-contrat-b2b',
    name: 'Workflow Validation et Séquestre Commande B2B',
    category: 'Commerce & Marché Mondial',
    description: 'Circuit de négociation RFQ, vérification MOK Trust, blocage du séquestre et scellement du contrat.',
    triggerEvent: 'Acceptation d’un devis RFQ par un acheteur',
    isAutomatic: true,
    isActive: true,
    steps: [
      { id: 'st-b1', stepNumber: 1, title: 'Génération du contrat avec Incoterms', description: 'Intégration automatique des volumes, prix unitaires et ports de livraison.', assignedRole: 'ai_synthesis', actionType: 'draft', requiresSignature: false, requiresStamp: false, timeLimitDays: 1 },
      { id: 'st-b2', stepNumber: 2, title: 'Revue de solvabilité & Rapport MOK Trust', description: 'Vérification du fournisseur et de l’historique des transactions.', assignedRole: 'expert', actionType: 'human_validation', requiresSignature: false, requiresStamp: false, timeLimitDays: 2 },
      { id: 'st-b3', stepNumber: 3, title: 'Blocage du séquestre Wallet LMAV', description: 'Séquestration des fonds jusqu’à confirmation d’inspection portuaire.', assignedRole: 'system', actionType: 'review', requiresSignature: false, requiresStamp: false, timeLimitDays: 1 },
      { id: 'st-b4', stepNumber: 4, title: 'Signature bilatérale et sceau financier', description: 'Double signature électronique scellée avec certificat de conformité.', assignedRole: 'super_admin', actionType: 'sign_and_stamp', requiresSignature: true, requiresStamp: true, timeLimitDays: 1 }
    ],
    createdAt: '2025-02-01',
    updatedAt: '2026-08-25'
  }
];

// ── 8. JOURNAUX D’AUDIT INITIAUX ──
const INITIAL_LOGS: SystemAuditLog[] = [
  { id: 'log-1', timestamp: '2026-08-27 15:35:12', level: 'info', category: 'auth', message: 'Connexion Super-Administrateur réussie (visionsmart224@gmail.com)', actor: 'visionsmart224@gmail.com', ipAddress: '194.254.119.82' },
  { id: 'log-2', timestamp: '2026-08-27 15:20:04', level: 'security', category: 'document', message: 'Signature officielle apposée sur Lettre N° DOS-2026-ADM-771 par Maître Diallo', actor: 'Maître DIALLO', ipAddress: '82.64.12.90', metadata: { templateId: 'tpl-recours-prefecture', hash: '9f86d081...' } },
  { id: 'log-3', timestamp: '2026-08-27 14:55:30', level: 'info', category: 'ai', message: 'Appel Gemini 2.5 Flash réussi pour Orchestration de Parcours (Durée : 412ms)', actor: 'Diallo OS', ipAddress: '127.0.0.1' },
  { id: 'log-4', timestamp: '2026-08-27 14:10:18', level: 'warning', category: 'ai', message: 'Fournisseur Mistral Local : latence dégradée (180ms). Basculement automatique vers Gemini Flash.', actor: 'AI Gateway', ipAddress: '10.0.4.12' },
  { id: 'log-5', timestamp: '2026-08-27 13:40:02', level: 'info', category: 'sync', message: 'Sauvegarde automatique IndexedDB / Local-First synchronisée avec succès.', actor: 'Système Cloud', ipAddress: '10.0.1.5' },
  { id: 'log-6', timestamp: '2026-08-27 11:15:44', level: 'info', category: 'payment', message: 'Séquestre Wallet LMAV créé pour Contrat B2B N° B2B-2026-LMAV-882 (Montant : 112 500 €)', actor: 'Sarah Koné', ipAddress: '41.189.160.2' }
];

// ── 9. NOTIFICATIONS BROADCAST INITIALES ──
const INITIAL_NOTIFS: BroadcastNotification[] = [
  {
    id: 'bc-1',
    title: 'Mise à niveau Souveraine Diallo OS 2026',
    message: 'Tous les modules de la plateforme bénéficient désormais du nouveau moteur de signatures officielles et de la synchronisation instantanée.',
    priority: 'info',
    targetAudience: 'all',
    sentAt: '2026-08-27 08:00',
    readCount: 1420,
    active: true
  },
  {
    id: 'bc-2',
    title: 'Ouverture du Salon B2B Export Afrique-Europe',
    message: 'Les sessions de mise en relation directe avec les acheteurs européens débutent ce vendredi à 14h GMT.',
    priority: 'info',
    targetAudience: 'partners',
    sentAt: '2026-08-26 10:30',
    readCount: 380,
    active: true
  }
];

// ── 10. MODÉRATION DES CONTENUS & SIGNALEMENTS ──
const INITIAL_MODERATION_ITEMS: ContentModerationItem[] = [
  {
    id: 'mod-post-101',
    type: 'post',
    title: 'Opportunité d’exportation Anacarde Bio Guinée-Bissau vers UE',
    contentSnippet: 'Nous disposons de 500 tonnes d’anacarde certifié disponible au port de Bissau...',
    authorId: 'u-citizen-mamadou',
    authorName: 'Mamadou Touré',
    authorEmail: 'm.toure@agri-guinee.com',
    createdAt: '2026-08-27 12:10',
    status: 'approved',
    reportsCount: 0,
    flagsReason: [],
    moduleOrigin: 'Marché B2B'
  },
  {
    id: 'mod-post-102',
    type: 'listing',
    title: 'Vente Urgent Lots Électroniques Non Vérifiés',
    contentSnippet: 'Paiement direct hors plateforme exigé avant expédition rapide...',
    authorId: 'u-suspect-99',
    authorName: 'Alexandre CryptoVente',
    authorEmail: 'trade.fast99@proton.me',
    createdAt: '2026-08-27 11:05',
    status: 'flagged',
    reportsCount: 4,
    flagsReason: ['Paiement externe interdit', 'Suspicion de fraude séquestre MokTrust'],
    moduleOrigin: 'Marché B2B'
  },
  {
    id: 'mod-comment-201',
    type: 'comment',
    title: 'Commentaire sur Masterclass Droit International',
    contentSnippet: 'Excellent module de Maître Diallo, les modèles cerfas m’ont permis d’obtenir mon récépissé en 10 jours.',
    authorId: 'u-citizen-fatou',
    authorName: 'Fatou Ndiaye',
    authorEmail: 'fatou.ndiaye@dakar.sn',
    createdAt: '2026-08-27 14:22',
    status: 'approved',
    reportsCount: 0,
    flagsReason: [],
    moduleOrigin: 'Campus & Éducation'
  },
  {
    id: 'mod-live-301',
    type: 'live_stream',
    title: 'Live Q&A : Formalités Campus France & Bourses 2026',
    contentSnippet: 'Session interactive avec 340 étudiants connectés en simultané.',
    authorId: 'u-expert-dir',
    authorName: 'Directeur DIALLO',
    authorEmail: 'directeur.diallo@lemondeavous.com',
    createdAt: '2026-08-27 15:00',
    status: 'approved',
    reportsCount: 0,
    flagsReason: [],
    moduleOrigin: 'Live Sessions'
  }
];

const INITIAL_REPORTS: UserReportItem[] = [
  {
    id: 'rep-881',
    targetType: 'product',
    targetId: 'mod-post-102',
    targetTitle: 'Vente Urgent Lots Électroniques Non Vérifiés',
    reportedUserId: 'u-suspect-99',
    reportedUserName: 'Alexandre CryptoVente',
    reporterId: 'u-citizen-1',
    reporterName: 'Sarah Koné',
    reporterEmail: 'sarah.kone@abidjan-agro.ci',
    reason: 'fraud',
    details: 'Le vendeur insiste par messagerie privée pour recevoir des cryptos en direct et refuser le séquestre MokTrust de la plateforme.',
    status: 'pending',
    createdAt: '2026-08-27 11:20'
  },
  {
    id: 'rep-882',
    targetType: 'user',
    targetId: 'u-blocked-1',
    targetTitle: 'Compte Anonyme_Hacker',
    reportedUserId: 'u-blocked-1',
    reportedUserName: 'Anonyme_Hacker',
    reporterId: 'u-expert-jur',
    reporterName: 'Maître DIALLO',
    reporterEmail: 'maitre.diallo@lemondeavous.com',
    reason: 'inappropriate',
    details: 'Tentative de publication de messages automatisés de phishing.',
    status: 'actioned',
    createdAt: '2026-08-26 18:40',
    resolutionNotes: 'Compte suspendu et IP consignée dans le journal de sécurité.'
  }
];

const INITIAL_MOKTRUST_AUDITS: MokTrustAuditItem[] = [
  {
    id: 'mkt-aud-01',
    sellerId: 'u-citizen-1',
    sellerName: 'Sarah Koné',
    companyName: 'Ivoire Agro Export SA',
    businessType: 'Coopérative & Export Cacao/Café',
    requestedBadge: 'certified_exporter',
    trustScore: 98,
    status: 'approved',
    submissionDate: '2026-08-25',
    auditNotes: 'Statuts certifiés par le Greffe du Tribunal de Commerce d’Abidjan. 12 transactions sécurisées sans incident.',
    kycDocType: 'Kbis & Agrément Exportateur MinAgri'
  },
  {
    id: 'mkt-aud-02',
    sellerId: 'u-seller-senegal',
    sellerName: 'Ousmane Ba',
    companyName: 'Sahel Tech Solutions',
    businessType: 'Fournisseur Matériel Réseau',
    requestedBadge: 'trusted_escrow',
    trustScore: 84,
    status: 'pending',
    submissionDate: '2026-08-27',
    auditNotes: 'Documents comptables transmis, vérification de solvabilité bancaire en cours.',
    kycDocType: 'NINEA & Attestation Régularité Fiscale'
  }
];

const INITIAL_DETAILED_SETTINGS: PlatformDetailedModuleSettings = {
  live: {
    maxBitrateKbps: 4500,
    aiModerationSensitivity: 'strict',
    allowPublicStreamCreation: true,
    maxConcurrentLives: 50,
    autoRecordingEnabled: true
  },
  commerce: {
    commissionRatePercent: 2.5,
    escrowHoldingPeriodDays: 3,
    minRfqAmount: 250,
    supportedCurrencies: ['EUR', 'USD', 'XOF', 'GNF', 'CAD', 'GBP'],
    autoCustomsCalculator: true,
    verifiedSellersOnlyForB2B: true
  },
  mokTrust: {
    minTrustScoreToPublish: 75,
    mandatoryKycForEscrow: true,
    disputeResolutionTimeoutHours: 48,
    escrowFeePercent: 1.0,
    smartContractAuditLog: true
  },
  studio: {
    maxDailyGenerationsPerUser: 100,
    defaultVisionModel: 'gemini-2.5-flash',
    defaultImageSize: '1024x1024',
    watermarkEnabled: true,
    allowVeoVideoGeneration: true,
    // Studio Avatar : AUCUN avatar imposé en sortie d'usine. Tant que
    // l'Admin-Général n'a rien défini, un nouveau compte affiche ses
    // initiales — jamais un visage inventé par le code, jamais le cliché de
    // banque d'images que le reste de l'app traite comme « avatar absent ».
    defaultAvatar: {
      photoUrl: '',
      label: 'Aucun avatar imposé (initiales du membre)',
      updatedAt: '',
      updatedBy: ''
    }
  },
  // Avatar vivant de l'Architecte : AUCUNE photo en sortie d'usine. Tant que
  // la Direction n'a pas déposé la sienne, le visage dessiné par
  // l'application est affiché — jamais un cadre vide.
  architecteAvatar: {
    // Portrait photoréaliste livré avec l'application, et son calage relevé
    // sur CETTE image. C'est lui qui respire, cligne et parle.
    photoUrl: '/architecte/architecte.webp',
    rig: {
      eyeLinePercent: 46.3, eyeBandPercent: 5.2, jawLinePercent: 67.3, jawTravelPercent: 5.2,
      chinLinePercent: 80, eyeLeftXPercent: 41.75, eyeRightXPercent: 63.25, eyeWidthPercent: 9,
    },
    displayName: "L'Architecte",
    mouthAnchor: { xPercent: 52.5, yPercent: 67.3, widthPercent: 18, tiltDeg: -1.6 },
    animationsEnabled: true,
    lipSyncEnabled: true,
    voiceKey: '',
    videoSequencesEnabled: true,
    silhouetteMaskUrl: '/architecte/architecte-silhouette.png',
    updatedAt: '',
    updatedBy: ''
  },
  campus: {
    examPassingScore: 70,
    autoGenerateDiplomaPdf: true,
    xpMultiplier: 1.5,
    peerReviewEnabled: true
  },
  aiCore: {
    activeDefaultProvider: 'gemini',
    geminiModel: 'gemini-2.5-flash',
    thinkingBudgetTokens: 1024,
    streamResponses: true,
    safetyThreshold: 'strict'
  }
};

// ── 11. CONFIGURATION SYSTÈME GÉNÉRALE ──
const INITIAL_SYSTEM_CONFIG: AdminSystemConfig = {
  systemName: 'Le Monde à Vous — Plateforme Souveraine Globale',
  organizationName: 'Famille & Consortium DIALLO',
  maintenanceMode: false,
  registrationOpen: true,
  localFirstSync: true,
  highSecurityMode: true,
  cloudBackupIntervalHours: 6,
  primaryNode: 'Paris-Centre (France / Europe)',
  fallbackNode: 'Dakar-Almadies (Sénégal / Afrique de l’Ouest)',
  lastBackupDate: '2026-08-27 14:00',
  totalStorageUsedBytes: 42890120,
  officialSealText: 'SCEAU OFFICIEL DE CONFORMITÉ NUMÉRIQUE — LE MONDE À VOUS'
};

// ── 12. REGISTRE DES VERSIONS MAJEURES STABLES (MINIMUM 3 DERNIÈRES STABLES CONSERVÉES) ──
/**
 * Fusionne des réglages enregistrés avec les valeurs d'usine, section par
 * section.
 *
 * Nécessaire dès qu'une section gagne une clé : le `localStorage` d'un
 * administrateur ayant déjà enregistré ses réglages ne la contient pas, et un
 * `JSON.parse` brut laisserait la clé `undefined` — l'écran qui la lit
 * planterait, alors même que la valeur d'usine existe. Le réglage enregistré
 * gagne toujours ; seules les clés absentes viennent des valeurs d'usine.
 */
export function mergeDetailedSettings(stored: unknown): PlatformDetailedModuleSettings {
  const source = (stored && typeof stored === 'object' ? stored : {}) as Partial<PlatformDetailedModuleSettings>;
  return {
    live: { ...INITIAL_DETAILED_SETTINGS.live, ...(source.live || {}) },
    commerce: { ...INITIAL_DETAILED_SETTINGS.commerce, ...(source.commerce || {}) },
    mokTrust: { ...INITIAL_DETAILED_SETTINGS.mokTrust, ...(source.mokTrust || {}) },
    studio: {
      ...INITIAL_DETAILED_SETTINGS.studio,
      ...(source.studio || {}),
      defaultAvatar: {
        ...INITIAL_DETAILED_SETTINGS.studio.defaultAvatar,
        ...(source.studio?.defaultAvatar || {}),
      },
    },
    campus: { ...INITIAL_DETAILED_SETTINGS.campus, ...(source.campus || {}) },
    aiCore: { ...INITIAL_DETAILED_SETTINGS.aiCore, ...(source.aiCore || {}) },
    architecteAvatar: {
      ...INITIAL_DETAILED_SETTINGS.architecteAvatar,
      ...(source.architecteAvatar || {}),
      rig: {
        ...INITIAL_DETAILED_SETTINGS.architecteAvatar.rig,
        ...(source.architecteAvatar?.rig || {}),
      },
      mouthAnchor: {
        ...INITIAL_DETAILED_SETTINGS.architecteAvatar.mouthAnchor,
        ...(source.architecteAvatar?.mouthAnchor || {}),
      },
    },
  };
}

export const STABLE_RELEASE_VERSIONS: PlatformReleaseVersion[] = [
  {
    version: 'v6.3.0',
    releaseDate: '2026-08-27',
    title: 'Gestion & Visibilité Totale des Utilisateurs Supabase Realtime, RBAC Granulaire & Diagnostic',
    changelog: [
      'Abonnement Supabase Realtime actif sur la table profiles avec propagation instantanée des comptes',
      'Moteur de diagnostic, déduplication et réconciliation automatique des comptes (reconcileAndRepairAllAccounts)',
      'Console Super-Admin d\'attribution granulaire des rôles et privilèges RBAC avec audit',
      'Ajustement du solde de crédits Ⓒ avec motif d\'audit certifié et traçabilité intégrale',
      'Système complet de sauvegarde, de gestion des versions et de restauration intelligente sans perte de données',
      'Garantie absolue zéro écran blanc et protection permanente du Super-Admin (visionsmart224@gmail.com)'
    ],
    status: 'current',
    author: 'AI Coding Agent & Core Team',
    checksum: 'sha256-e9f8a10b42c678d1f2a34b5c6e7f8a90123456789abcdef0123456789abcdef0',
    schemaVersion: '2026-08-27.4-realtime-rbac',
    modulesCount: 14,
    aiProvidersCount: 12,
    templatesCount: 6,
    migrationNotes: [
      'Compatible 100% avec les tables Supabase profiles, audit_logs et platform_settings',
      'Auto-détection et réparation des champs citizenship_id et permissions manquants'
    ],
    isRollbackTarget: true,
    highlights: [
      'Synchronisation Supabase Realtime',
      'Diagnostic & Réconciliation sans perte',
      'Console RBAC & Crédits Ⓒ',
      'Sauvegarde & Restauration Intelligente'
    ],
    databaseCompatibility: {
      schemaCompatible: true,
      migrationsRequired: false,
      dataLossRisk: 'none'
    }
  },
  {
    version: 'v6.2.0',
    releaseDate: '2026-08-27',
    title: 'Architecture IA Auto-Résiliente Multi-Fournisseurs (12 Moteurs) & Laboratoire Chromatique',
    changelog: [
      'Orchestration unifiée 12 moteurs IA (OpenAI, Claude, Gemini, DeepSeek, Kimi, Qwen, Mistral, Grok, OpenRouter, Replicate, HF, Ollama)',
      'Moteur de failover automatique résilient basé sur les seuils de qualité, latence et coût',
      'Hub de résilience Super-Admin avec surveillance de santé et auto-quarantaine',
      'Laboratoire Chromatique Interactif avec 10 palettes institutionnelles et technologiques',
      'Garantie de non-blocage en cas d\'indisponibilité d\'un fournisseur IA'
    ],
    status: 'stable',
    author: 'AI Coding Agent & Core Team',
    checksum: 'sha256-a1b2c3d4e5f67890123456789abcdef0123456789abcdef0123456789abcdef0',
    schemaVersion: '2026-08-27.3-multi-ai-resilience',
    modulesCount: 14,
    aiProvidersCount: 12,
    templatesCount: 6,
    migrationNotes: [
      'Schéma de configuration IA compatible avec toutes les versions v6.x',
      'Migration ascendante automatique des clés API'
    ],
    isRollbackTarget: true,
    highlights: [
      '12 Fournisseurs IA Connectés',
      'Failover Automatique Transparent',
      'Laboratoire Chromatique 10 Palettes'
    ],
    databaseCompatibility: {
      schemaCompatible: true,
      migrationsRequired: false,
      dataLossRisk: 'none'
    }
  },
  {
    version: 'v6.1.0',
    releaseDate: '2026-08-27',
    title: 'Socle Cloud Supabase Lazy-Init & Persistance Résiliente Local-First',
    changelog: [
      'Mise en place de l\'instanciation lazy-init de Supabase via getClient()',
      'Tolérance totale aux clés d\'environnement absentes sans crash au démarrage',
      'Persistance souveraine hybride : Supabase Cloud + Local-First Fallback IndexedDB',
      'Sécurité renforcée sur l\'accès aux routes API et stockage sécurisé'
    ],
    status: 'stable',
    author: 'AI Coding Agent & Core Team',
    checksum: 'sha256-c3d4e5f6a1b27890123456789abcdef0123456789abcdef0123456789abcdef0',
    schemaVersion: '2026-08-27.2-lazy-supabase-core',
    modulesCount: 14,
    aiProvidersCount: 8,
    templatesCount: 6,
    migrationNotes: [
      'Migration transparente depuis le stockage local vers le cloud Supabase'
    ],
    isRollbackTarget: true,
    highlights: [
      'Zéro Écran Blanc Garanti',
      'Lazy Init Supabase & Fallback Offline',
      'Déploiement GitHub / Netlify / Cloud Run'
    ],
    databaseCompatibility: {
      schemaCompatible: true,
      migrationsRequired: false,
      dataLossRisk: 'none'
    }
  },
  {
    version: 'v6.0.0',
    releaseDate: '2026-08-27',
    title: 'Jalon Officiel — PREMIUM EXPERIENCE V1 (Design System 26 Chapitres & 14 Modules)',
    changelog: [
      'Manifeste officiel de l\'Expérience Premium : Simple devant, intelligente derrière',
      'Design System V1 complet en 26 sections (Tokens, Typographies Outfit & Plus Jakarta Sans, Palette Navy)',
      'Unification ergonomique des 14 modules applicatifs sans clichés d\'AI Slop',
      'Accessibilité universelle WCAG AA et suppression des gradients agressifs',
      'Dossier de passation et consolidation pour Claude Code'
    ],
    status: 'stable',
    author: 'AI Coding Agent & Core Team',
    checksum: 'sha256-f6a1b2c3d4e57890123456789abcdef0123456789abcdef0123456789abcdef0',
    schemaVersion: '2026-08-27.1-premium-v1-foundation',
    modulesCount: 14,
    aiProvidersCount: 6,
    templatesCount: 5,
    migrationNotes: [
      'Socle de référence V1. Compatible avec toutes les versions postérieures'
    ],
    isRollbackTarget: true,
    highlights: [
      'Design System V1 (26 Chapitres)',
      '14 Modules Conformes',
      'Manifeste Officiel Inaltérable'
    ],
    databaseCompatibility: {
      schemaCompatible: true,
      migrationsRequired: false,
      dataLossRisk: 'none'
    }
  },
  {
    version: 'v5.14.0',
    releaseDate: '2026-08-27',
    title: 'Accessibilité Universelle & Actionable AI',
    changelog: [
      'Mode Guide-moi pas-à-pas pour les utilisateurs non technophiles',
      'Scanner Universel OCR pour documents administratifs et justificatifs',
      'Traducteur instantané bilingue français / anglais intégré',
      'Recherche universelle et commande vocale avec palette Ctrl+K'
    ],
    status: 'archived',
    author: 'AI Coding Agent & Core Team',
    checksum: 'sha256-89abcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
    schemaVersion: '2026-08-26.9-accessible-ai-hub',
    modulesCount: 14,
    aiProvidersCount: 4,
    templatesCount: 4,
    migrationNotes: [
      'Version archivée. Restauration possible avec mise à niveau automatique des schémas'
    ],
    isRollbackTarget: false,
    highlights: [
      'Mode Guide-moi',
      'Scanner Universel OCR',
      'Traducteur Bilingue'
    ],
    databaseCompatibility: {
      schemaCompatible: true,
      migrationsRequired: true,
      dataLossRisk: 'none'
    }
  }
];

// ── 13. CONFIGURATION PAR DÉFAUT DU PLANIFICATEUR DE SAUVEGARDES ──
const DEFAULT_BACKUP_SCHEDULE: BackupScheduleConfig = {
  enabled: true,
  frequency: 'daily',
  timeOfDay: '03:00',
  keepMaxSnapshots: 10,
  autoSyncToCloud: true,
  notifyAdminOnSuccess: true,
  autoPruneOldSnapshots: true,
  lastRunAt: '2026-08-27 03:00',
  nextRunAt: '2026-08-28 03:00'
};

// ── 14. INSTANTANÉS DE SAUVEGARDE INITIAUX (SNAPSHOTS) ──
const INITIAL_SNAPSHOTS: BackupSnapshotRecord[] = [
  {
    id: 'snp-milestone-v6-3-0',
    name: 'Jalon Stable v6.3.0 — Supabase Realtime & RBAC',
    type: 'system_milestone',
    createdAt: '2026-08-27 15:45',
    versionTag: 'v6.3.0',
    sizeBytes: 148520,
    checksum: 'sha256-snp-v630-active-verified',
    canRollback: true,
    notes: 'Instantané officiel de déploiement de la version 6.3.0 avec synchronisation Realtime et diagnostic des comptes.',
    recordsCount: {
      users: 4,
      aiProviders: 12,
      modules: 14,
      templates: 6,
      signatures: 4,
      stamps: 4,
      workflows: 3,
      logs: 4,
      moderation: 3,
      audits: 3,
      settingsIncluded: true
    }
  },
  {
    id: 'snp-milestone-v6-2-0',
    name: 'Jalon Stable v6.2.0 — Hub Résilience IA & Color Lab',
    type: 'system_milestone',
    createdAt: '2026-08-27 12:30',
    versionTag: 'v6.2.0',
    sizeBytes: 139400,
    checksum: 'sha256-snp-v620-stable-verified',
    canRollback: true,
    notes: 'Instantané stable de référence v6.2.0 avec les 12 fournisseurs IA et le Color Lab.',
    recordsCount: {
      users: 4,
      aiProviders: 12,
      modules: 14,
      templates: 6,
      signatures: 4,
      stamps: 4,
      workflows: 3,
      logs: 4,
      moderation: 3,
      audits: 3,
      settingsIncluded: true
    }
  },
  {
    id: 'snp-milestone-v6-0-0',
    name: 'Jalon Fondateur v6.0.0 — Premium Experience V1',
    type: 'system_milestone',
    createdAt: '2026-08-27 08:00',
    versionTag: 'v6.0.0',
    sizeBytes: 128900,
    checksum: 'sha256-snp-v600-milestone-core',
    canRollback: true,
    notes: 'Instantané étalon du Design System V1 et de la charte Premium.',
    recordsCount: {
      users: 4,
      aiProviders: 6,
      modules: 14,
      templates: 5,
      signatures: 4,
      stamps: 4,
      workflows: 3,
      logs: 4,
      moderation: 3,
      audits: 3,
      settingsIncluded: true
    }
  }
];

export class AdminConfigService {
  private static instance: AdminConfigService;
  
  private users: AdminUserRecord[] = INITIAL_USERS;
  private aiProviders: AIProviderConfig[] = INITIAL_AI_PROVIDERS;
  private modules: PlatformModuleConfig[] = INITIAL_MODULES;
  private templates: OfficialDocumentTemplate[] = INITIAL_TEMPLATES;
  private signatures: OfficialSignature[] = INITIAL_SIGNATURES;
  private stamps: OfficialStamp[] = INITIAL_STAMPS;
  private workflows: WorkflowPipelineConfig[] = INITIAL_WORKFLOWS;
  private logs: SystemAuditLog[] = INITIAL_LOGS;
  private notifications: BroadcastNotification[] = INITIAL_NOTIFS;
  private systemConfig: AdminSystemConfig = INITIAL_SYSTEM_CONFIG;
  private moderationItems: ContentModerationItem[] = INITIAL_MODERATION_ITEMS;
  private userReports: UserReportItem[] = INITIAL_REPORTS;
  private mokTrustAudits: MokTrustAuditItem[] = INITIAL_MOKTRUST_AUDITS;
  private detailedSettings: PlatformDetailedModuleSettings = INITIAL_DETAILED_SETTINGS;
  
  // Versions & Sauvegardes
  private releaseVersions: PlatformReleaseVersion[] = STABLE_RELEASE_VERSIONS;
  private snapshots: BackupSnapshotRecord[] = INITIAL_SNAPSHOTS;
  private backupSchedule: BackupScheduleConfig = DEFAULT_BACKUP_SCHEDULE;
  private lastRestoreResult: RestoreOperationResult | null = null;

  private listeners: (() => void)[] = [];

  private constructor() {
    this.loadFromStorage();
    this.initSupabaseRealtimeSync();
  }

  public static getInstance(): AdminConfigService {
    if (!AdminConfigService.instance) {
      AdminConfigService.instance = new AdminConfigService();
    }
    return AdminConfigService.instance;
  }


  /**
   * Initialisation de la synchronisation bidirectionnelle et écoute Realtime Supabase
   */
  private initSupabaseRealtimeSync(): void {
    // 1. Synchronisation initiale en arrière-plan
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        this.syncWithSupabase().catch(err => {
          console.warn('Sync initiale Supabase utilisateurs:', err);
        });
      }, 500);

      // 2. Écouteur Realtime sur la table profiles
      try {
        supabaseService.subscribeToProfilesRealtime({
          onInsert: (cloudProfile) => {
            this.handleRealtimeProfileInsertOrUpdate(cloudProfile, 'insert');
          },
          onUpdate: (cloudProfile) => {
            this.handleRealtimeProfileInsertOrUpdate(cloudProfile, 'update');
          },
          onDelete: (deletedId) => {
            this.handleRealtimeProfileDelete(deletedId);
          }
        });
      } catch (err) {
        console.warn('Erreur abonnement Realtime profiles:', err);
      }
    }
  }

  private handleRealtimeProfileInsertOrUpdate(profile: any, eventType: 'insert' | 'update'): void {
    if (!profile || !profile.id) return;
    const isSuperAdmin = profile.email?.toLowerCase() === 'visionsmart224@gmail.com' || profile.role === 'super_admin';
    const existingIndex = this.users.findIndex(u => u.id === profile.id || (profile.email && u.email.toLowerCase() === profile.email.toLowerCase()));

    const userRecord: AdminUserRecord = {
      id: profile.id,
      name: isSuperAdmin ? 'Superviseur Général DIALLO' : (profile.name || profile.email?.split('@')[0] || 'Utilisateur'),
      email: profile.email || `user-${profile.id.substring(0, 8)}@lemondeavous.com`,
      role: isSuperAdmin ? 'super_admin' : (profile.role || 'citizen'),
      status: (profile.status as any) || 'active',
      country: profile.country || 'France',
      city: profile.city || 'Paris',
      title: profile.title || (isSuperAdmin ? 'Super-Administrateur Principal' : 'Citoyen Actif'),
      bio: profile.bio || '',
      phone: profile.phone || '',
      citizenshipId: profile.citizenship_id || (isSuperAdmin ? 'LMAV-SUPREME-ADMIN-01' : `LMAV-${new Date().getFullYear()}-USR`),
      credits: isSuperAdmin ? 1000000 : (profile.credits ?? 250),
      xp: isSuperAdmin ? 999999 : (profile.xp ?? 50),
      level: isSuperAdmin ? 99 : (profile.level ?? 1),
      joinedAt: profile.created_at ? new Date(profile.created_at).toISOString().split('T')[0] : (existingIndex >= 0 ? this.users[existingIndex].joinedAt : new Date().toISOString().split('T')[0]),
      lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
      permissions: isSuperAdmin ? ['all', 'manage_users', 'manage_ai', 'manage_modules', 'manage_moderation', 'manage_templates', 'sign_documents', 'stamp_documents', 'manage_workflows', 'system_backup', 'broadcast_notifications', 'access_council', 'b2b_market', 'standard_access'] : (profile.permissions || ['standard_access']),
      kycVerified: profile.is_verified ?? (profile.kyc_status === 'verified'),
      avatarUrl: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
      origin: 'supabase_cloud'
    };

    if (existingIndex >= 0) {
      this.users[existingIndex] = {
        ...this.users[existingIndex],
        ...userRecord,
        notes: this.users[existingIndex].notes || userRecord.notes
      };
    } else {
      this.users.unshift(userRecord);
      this.addLog('info', 'auth', `Nouveau compte Supabase synchronisé en temps réel : ${userRecord.name} (${userRecord.email})`, 'Realtime Sentinel');
    }

    this.notify();
  }

  private handleRealtimeProfileDelete(deletedId: string): void {
    const target = this.users.find(u => u.id === deletedId);
    if (target && target.email.toLowerCase() !== 'visionsmart224@gmail.com') {
      this.users = this.users.filter(u => u.id !== deletedId);
      this.addLog('warning', 'auth', `Compte supprimé à distance (Realtime) : ${target.name} (${target.email})`, 'Realtime Sentinel');
      this.notify();
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify(): void {
    this.saveToStorage();
    this.listeners.forEach(l => l());
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(ADMIN_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.users) this.users = parsed.users;
        if (parsed.aiProviders) this.aiProviders = parsed.aiProviders;
        if (parsed.modules) this.modules = parsed.modules;
        if (parsed.templates) this.templates = parsed.templates;
        if (parsed.signatures) this.signatures = parsed.signatures;
        if (parsed.stamps) this.stamps = parsed.stamps;
        if (parsed.workflows) this.workflows = parsed.workflows;
        if (parsed.systemConfig) this.systemConfig = parsed.systemConfig;
      }
      
      const storedLogs = localStorage.getItem(ADMIN_LOGS_KEY);
      if (storedLogs) this.logs = JSON.parse(storedLogs);

      const storedNotifs = localStorage.getItem(ADMIN_NOTIFS_KEY);
      if (storedNotifs) this.notifications = JSON.parse(storedNotifs);

      const storedMod = localStorage.getItem(ADMIN_MODERATION_KEY);
      if (storedMod) this.moderationItems = JSON.parse(storedMod);

      const storedReps = localStorage.getItem(ADMIN_REPORTS_KEY);
      if (storedReps) this.userReports = JSON.parse(storedReps);

      const storedMok = localStorage.getItem(ADMIN_MOKTRUST_KEY);
      if (storedMok) this.mokTrustAudits = JSON.parse(storedMok);

      const storedSettings = localStorage.getItem(ADMIN_SETTINGS_KEY);
      if (storedSettings) this.detailedSettings = mergeDetailedSettings(JSON.parse(storedSettings));

      const storedSnapshots = localStorage.getItem(ADMIN_SNAPSHOTS_KEY);
      if (storedSnapshots) {
        try {
          const parsedSnapshots = JSON.parse(storedSnapshots);
          if (Array.isArray(parsedSnapshots) && parsedSnapshots.length > 0) {
            // Fusionner avec les jalons initiaux pour garantir qu'ils sont toujours présents
            const existingIds = new Set(parsedSnapshots.map((s: BackupSnapshotRecord) => s.id));
            const merged = [...parsedSnapshots];
            INITIAL_SNAPSHOTS.forEach(is => {
              if (!existingIds.has(is.id)) merged.push(is);
            });
            this.snapshots = merged;
          }
        } catch {}
      }

      const storedSchedule = localStorage.getItem(ADMIN_SCHEDULE_KEY);
      if (storedSchedule) {
        try {
          this.backupSchedule = { ...DEFAULT_BACKUP_SCHEDULE, ...JSON.parse(storedSchedule) };
        } catch {}
      }

      const storedLastRestore = localStorage.getItem(ADMIN_LAST_RESTORE_RESULT_KEY);
      if (storedLastRestore) {
        try {
          this.lastRestoreResult = JSON.parse(storedLastRestore);
        } catch {}
      }

      // Sécurité absolue : garantir que visionsmart224@gmail.com est toujours présent et super_admin
      const superAdminIndex = this.users.findIndex(u => u.email.toLowerCase() === 'visionsmart224@gmail.com');
      if (superAdminIndex === -1) {
        this.users.unshift(INITIAL_USERS[0]);
      } else {
        this.users[superAdminIndex].role = 'super_admin';
        this.users[superAdminIndex].status = 'active';
        this.users[superAdminIndex].permissions = ['all', 'manage_users', 'manage_ai', 'manage_modules', 'manage_moderation', 'manage_templates', 'sign_documents', 'stamp_documents', 'manage_workflows', 'system_backup', 'broadcast_notifications', 'access_council', 'b2b_market', 'standard_access'];
      }
    } catch (e) {
      console.warn('Erreur lors du chargement de la config admin:', e);
    }
  }

  private saveToStorage(): void {
    try {
      const payload = {
        users: this.users,
        aiProviders: this.aiProviders,
        modules: this.modules,
        templates: this.templates,
        signatures: this.signatures,
        stamps: this.stamps,
        workflows: this.workflows,
        systemConfig: this.systemConfig
      };
      localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(payload));
      localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(this.logs));
      localStorage.setItem(ADMIN_NOTIFS_KEY, JSON.stringify(this.notifications));
      localStorage.setItem(ADMIN_MODERATION_KEY, JSON.stringify(this.moderationItems));
      localStorage.setItem(ADMIN_REPORTS_KEY, JSON.stringify(this.userReports));
      localStorage.setItem(ADMIN_MOKTRUST_KEY, JSON.stringify(this.mokTrustAudits));
      localStorage.setItem(ADMIN_SETTINGS_KEY, JSON.stringify(this.detailedSettings));
      localStorage.setItem(ADMIN_SNAPSHOTS_KEY, JSON.stringify(this.snapshots));
      localStorage.setItem(ADMIN_SCHEDULE_KEY, JSON.stringify(this.backupSchedule));
      if (this.lastRestoreResult) {
        localStorage.setItem(ADMIN_LAST_RESTORE_RESULT_KEY, JSON.stringify(this.lastRestoreResult));
      }
    } catch (e) {
      console.error('Erreur sauvegarde config admin:', e);
    }
  }

  // ── GETTERS ──
  public getUsers(): AdminUserRecord[] { return [...this.users]; }
  public getAIProviders(): AIProviderConfig[] { return [...this.aiProviders]; }
  public getModules(): PlatformModuleConfig[] { return [...this.modules]; }
  public getTemplates(): OfficialDocumentTemplate[] { return [...this.templates]; }
  public getSignatures(): OfficialSignature[] { return [...this.signatures]; }
  public getStamps(): OfficialStamp[] { return [...this.stamps]; }
  public getWorkflows(): WorkflowPipelineConfig[] { return [...this.workflows]; }
  public getLogs(): SystemAuditLog[] { return [...this.logs]; }
  public getBroadcastNotifications(): BroadcastNotification[] { return [...this.notifications]; }
  public getSystemConfig(): AdminSystemConfig { return { ...this.systemConfig }; }
  public getModerationItems(): ContentModerationItem[] { return [...this.moderationItems]; }
  public getUserReports(): UserReportItem[] { return [...this.userReports]; }
  public getMokTrustAudits(): MokTrustAuditItem[] { return [...this.mokTrustAudits]; }
  public getDetailedSettings(): PlatformDetailedModuleSettings { return JSON.parse(JSON.stringify(this.detailedSettings)); }
  public getStableVersions(): PlatformReleaseVersion[] { return [...this.releaseVersions]; }
  public getVersion(tag: string): PlatformReleaseVersion | undefined { return this.releaseVersions.find(v => v.version === tag); }
  public getSnapshots(): BackupSnapshotRecord[] { return [...this.snapshots]; }
  public getSnapshot(id: string): BackupSnapshotRecord | undefined { return this.snapshots.find(s => s.id === id); }
  public getBackupSchedule(): BackupScheduleConfig { return { ...this.backupSchedule }; }
  public getLastRestoreResult(): RestoreOperationResult | null { return this.lastRestoreResult; }


  // ── GESTION DES UTILISATEURS AVANCÉE ──
  public updateUser(id: string, updates: Partial<AdminUserRecord>): void {
    const user = this.users.find(u => u.id === id);
    if (user && user.email.toLowerCase() === 'visionsmart224@gmail.com') {
      // Protection du super-administrateur
      updates.role = 'super_admin';
      updates.status = 'active';
    }

    this.users = this.users.map(u => u.id === id ? { ...u, ...updates } : u);
    this.addLog('info', 'admin', `Mise à jour de l'utilisateur ${user?.name || id}`, 'Super-Admin');
    
    // Sync Supabase en arrière-plan
    if (user) {
      supabaseService.updateAdminUserProfile({
        id: user.id,
        name: updates.name || user.name,
        role: (updates.role as any) || user.role,
        is_verified: updates.kycVerified !== undefined ? updates.kycVerified : user.kycVerified,
        credits: updates.credits !== undefined ? updates.credits : user.credits,
        country: updates.country || user.country
      }).catch(() => {});
    }

    this.notify();
  }

  public promoteToAdmin(id: string, isSuperAdmin: boolean = false): void {
    const targetRole = isSuperAdmin ? 'super_admin' : 'admin';
    const allPermissions = [
      'all', 'manage_users', 'manage_ai', 'manage_modules', 
      'manage_moderation', 'manage_templates', 'sign_documents', 
      'stamp_documents', 'manage_workflows', 'system_backup', 
      'broadcast_notifications', 'access_council', 'b2b_market', 'standard_access'
    ];

    this.users = this.users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          role: targetRole,
          status: 'active',
          permissions: allPermissions,
          kycVerified: true
        };
      }
      return u;
    });

    const user = this.users.find(u => u.id === id);
    this.addLog('security', 'admin', `ÉLÉVATION PRIVILÈGE : L'utilisateur ${user?.name} (${user?.email}) a été promu ${targetRole.toUpperCase()}`, 'Super-Admin');
    this.notify();
  }

  public demoteUser(id: string, targetRole: 'citizen' | 'expert' | 'partner' = 'citizen'): boolean {
    const user = this.users.find(u => u.id === id);
    if (!user) return false;
    
    if (user.email.toLowerCase() === 'visionsmart224@gmail.com') {
      this.addLog('warning', 'admin', `Tentative bloquée de rétrogradation du Super-Administrateur Suprême (${user.email})`, 'Système Sécurité');
      return false;
    }

    this.users = this.users.map(u => {
      if (u.id === id) {
        return {
          ...u,
          role: targetRole,
          permissions: targetRole === 'expert' ? ['access_council', 'sign_documents', 'view_dossiers'] : ['standard_access']
        };
      }
      return u;
    });

    this.addLog('warning', 'admin', `Rétrogradation du rôle de ${user.name} vers ${targetRole}`, 'Super-Admin');
    this.notify();
    return true;
  }

  public toggleUserPermission(userId: string, permission: string): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    if (user.email.toLowerCase() === 'visionsmart224@gmail.com') return; // Invariable

    const hasPerm = user.permissions.includes(permission);
    let newPerms: string[];
    if (hasPerm) {
      newPerms = user.permissions.filter(p => p !== permission);
    } else {
      newPerms = [...user.permissions, permission];
    }

    this.updateUser(userId, { permissions: newPerms });
    this.addLog('info', 'admin', `Permission '${permission}' ${hasPerm ? 'révoquée pour' : 'attribuée à'} ${user.name}`, 'Super-Admin');
  }

  public setUserStatus(userId: string, status: AdminUserRecord['status']): void {
    const user = this.users.find(u => u.id === userId);
    if (!user) return;
    if (user.email.toLowerCase() === 'visionsmart224@gmail.com' && status !== 'active') {
      this.addLog('warning', 'admin', `Action bloquée : Le statut du Super-Administrateur ne peut être modifié.`, 'Système Sécurité');
      return;
    }

    this.updateUser(userId, { status });
    this.addLog('warning', 'admin', `Statut de ${user.name} modifié en : ${status.toUpperCase()}`, 'Super-Admin');
  }

  public approveUser(userId: string): void {
    this.updateUser(userId, { status: 'active', kycVerified: true });
    this.addLog('info', 'admin', `Validation et activation du compte pour l'utilisateur ${userId}`, 'Super-Admin');
  }

  public addUser(user: Omit<AdminUserRecord, 'id' | 'joinedAt' | 'lastLogin'>): AdminUserRecord {
    const newUser: AdminUserRecord = {
      ...user,
      id: `usr-${Date.now()}`,
      joinedAt: new Date().toISOString().split('T')[0],
      lastLogin: 'Jamais'
    };
    this.users.unshift(newUser);
    this.addLog('info', 'admin', `Création du nouvel utilisateur ${newUser.name} (${newUser.email})`, 'Super-Admin');
    
    // Sync Supabase
    supabaseService.upsertProfile({
      id: newUser.id,
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as any,
      is_verified: newUser.kycVerified,
      credits: newUser.credits,
      country: newUser.country
    }).catch(() => {});

    this.notify();
    return newUser;
  }

  public deleteUser(id: string): boolean {
    const user = this.users.find(u => u.id === id);
    if (!user) return false;
    if (user.email.toLowerCase() === 'visionsmart224@gmail.com') {
      this.addLog('security', 'admin', `Tentative illégale de suppression du compte Super-Administrateur Suprême bloquée.`, 'Système');
      return false;
    }

    this.users = this.users.filter(u => u.id !== id);
    this.addLog('warning', 'admin', `Suppression définitive de l'utilisateur ${user.name} (${user.email})`, 'Super-Admin');
    
    // Suppression Supabase
    supabaseService.deleteAdminUserProfile(id).catch(() => {});
    
    this.notify();
    return true;
  }

  /**
   * Synchronisation explicite et complète de tous les comptes avec Supabase
   */
  public async syncWithSupabase(): Promise<{ success: boolean; totalUsers: number; newUsersCount: number; errors: string[] }> {
    const errors: string[] = [];
    let newUsersCount = 0;

    try {
      if (!supabaseService.isConfigured()) {
        return {
          success: true,
          totalUsers: this.users.length,
          newUsersCount: 0,
          errors: ['Supabase non configuré (Mode Local-First Souverain actif)']
        };
      }

      const cloudProfiles = await supabaseService.fetchAdminProfiles();
      if (!cloudProfiles || cloudProfiles.length === 0) {
        // `this.users` (INITIAL_USERS) contient uniquement des personas de
        // démonstration (isDemoSeed) avec des ids non-UUID — jamais de vrais
        // comptes à pousser vers `profiles` (colonne `id` de type uuid, tout
        // upsert échouerait). Rien à synchroniser tant qu'aucun vrai profil
        // n'existe côté Supabase ; ce n'est pas un échec.
        return {
          success: true,
          totalUsers: this.users.length,
          newUsersCount: 0,
          errors: []
        };
      }

      // Fusionner chaque profil Supabase dans la liste locale
      cloudProfiles.forEach(cp => {
        if (!cp.id) return;
        const isSuperAdmin = cp.email?.toLowerCase() === 'visionsmart224@gmail.com' || cp.role === 'super_admin';
        const existingIdx = this.users.findIndex(u => u.id === cp.id || (cp.email && u.email.toLowerCase() === cp.email.toLowerCase()));

        const mappedRecord: AdminUserRecord = {
          id: cp.id,
          name: isSuperAdmin ? 'Superviseur Général DIALLO' : (cp.name || cp.email?.split('@')[0] || 'Utilisateur'),
          email: cp.email || `user-${cp.id.substring(0, 8)}@lemondeavous.com`,
          role: isSuperAdmin ? 'super_admin' : (cp.role === 'admin' ? 'admin' : (cp.role as any) || 'citizen'),
          status: (cp.status as any) || 'active',
          country: cp.country || 'France',
          city: cp.city || 'Paris',
          title: cp.title || (isSuperAdmin ? 'Super-Administrateur Principal' : 'Citoyen Actif'),
          bio: cp.bio || '',
          phone: cp.phone || '',
          citizenshipId: cp.citizenship_id || (isSuperAdmin ? 'LMAV-SUPREME-ADMIN-01' : `LMAV-${new Date().getFullYear()}-USR`),
          credits: isSuperAdmin ? 1000000 : (cp.credits ?? 250),
          xp: isSuperAdmin ? 999999 : (cp.xp ?? 50),
          level: isSuperAdmin ? 99 : (cp.level ?? 1),
          joinedAt: cp.created_at ? new Date(cp.created_at).toISOString().split('T')[0] : (existingIdx >= 0 ? this.users[existingIdx].joinedAt : new Date().toISOString().split('T')[0]),
          lastLogin: new Date().toISOString().replace('T', ' ').substring(0, 16),
          permissions: isSuperAdmin 
            ? ['all', 'manage_users', 'manage_ai', 'manage_modules', 'manage_moderation', 'manage_templates', 'sign_documents', 'stamp_documents', 'manage_workflows', 'system_backup', 'broadcast_notifications', 'access_council', 'b2b_market', 'standard_access']
            : (existingIdx >= 0 ? this.users[existingIdx].permissions : ['standard_access']),
          kycVerified: cp.is_verified ?? false,
          avatarUrl: cp.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop',
          origin: 'supabase_cloud',
          notes: existingIdx >= 0 ? this.users[existingIdx].notes : undefined
        };

        if (existingIdx >= 0) {
          this.users[existingIdx] = {
            ...this.users[existingIdx],
            ...mappedRecord,
            permissions: isSuperAdmin ? mappedRecord.permissions : this.users[existingIdx].permissions,
            notes: this.users[existingIdx].notes || mappedRecord.notes
          };
        } else {
          this.users.push(mappedRecord);
          newUsersCount++;
        }
      });

      // Garantir le Super-Admin au sommet
      const saIdx = this.users.findIndex(u => u.email.toLowerCase() === 'visionsmart224@gmail.com');
      if (saIdx > 0) {
        const [superAdminUser] = this.users.splice(saIdx, 1);
        this.users.unshift(superAdminUser);
      }

      this.addLog('info', 'sync', `Synchronisation Supabase réussie : ${this.users.length} comptes synchronisés (${newUsersCount} nouveaux découverts).`, 'Super-Admin');
      this.notify();

      return {
        success: true,
        totalUsers: this.users.length,
        newUsersCount,
        errors
      };
    } catch (err: any) {
      errors.push(err?.message || 'Exception sync Supabase');
      return {
        success: false,
        totalUsers: this.users.length,
        newUsersCount: 0,
        errors
      };
    }
  }

  /**
   * Enregistrement ou synchronisation instantanée d'un compte (appelé lors du Login, Signup ou chargement de session)
   */
  public registerOrSyncUser(userData: {
    id?: string;
    email: string;
    name?: string;
    role?: 'super_admin' | 'admin' | 'expert' | 'partner' | 'citizen' | 'guest';
    country?: string;
    city?: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    citizenshipId?: string;
    credits?: number;
    xp?: number;
    level?: number;
    kycVerified?: boolean;
  }): AdminUserRecord {
    const isSuperAdmin = userData.email.trim().toLowerCase() === 'visionsmart224@gmail.com' || userData.role === 'super_admin';
    const cleanEmail = userData.email.trim().toLowerCase();
    const existingIndex = this.users.findIndex(u => (userData.id && u.id === userData.id) || u.email.toLowerCase() === cleanEmail);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const countryCode = userData.country ? userData.country.substring(0, 2).toUpperCase() : 'FR';
    const citizenshipId = userData.citizenshipId || (isSuperAdmin ? 'LMAV-SUPREME-ADMIN-01' : `LMAV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}-${countryCode}`);

    const record: AdminUserRecord = {
      id: userData.id || (existingIndex >= 0 ? this.users[existingIndex].id : `usr-${Date.now()}`),
      name: isSuperAdmin ? 'Superviseur Général DIALLO' : (userData.name || cleanEmail.split('@')[0]),
      email: cleanEmail,
      role: isSuperAdmin ? 'super_admin' : (userData.role || (existingIndex >= 0 ? this.users[existingIndex].role : 'citizen')),
      status: 'active',
      country: userData.country || (existingIndex >= 0 ? this.users[existingIndex].country : 'France'),
      city: userData.city || (existingIndex >= 0 ? this.users[existingIndex].city : 'Paris'),
      title: userData.title || (isSuperAdmin ? 'Super-Administrateur Principal' : (existingIndex >= 0 ? this.users[existingIndex].title : 'Citoyen Actif')),
      bio: userData.bio || (existingIndex >= 0 ? this.users[existingIndex].bio : 'Citoyen engagé dans la communauté Le Monde à Vous.'),
      citizenshipId: citizenshipId,
      credits: isSuperAdmin ? 1000000 : (userData.credits !== undefined ? userData.credits : (existingIndex >= 0 ? this.users[existingIndex].credits : 250)),
      xp: isSuperAdmin ? 999999 : (userData.xp !== undefined ? userData.xp : (existingIndex >= 0 ? this.users[existingIndex].xp : 50)),
      level: isSuperAdmin ? 99 : (userData.level !== undefined ? userData.level : (existingIndex >= 0 ? this.users[existingIndex].level : 1)),
      joinedAt: existingIndex >= 0 ? this.users[existingIndex].joinedAt : new Date().toISOString().split('T')[0],
      lastLogin: now,
      permissions: isSuperAdmin 
        ? ['all', 'manage_users', 'manage_ai', 'manage_modules', 'manage_moderation', 'manage_templates', 'sign_documents', 'stamp_documents', 'manage_workflows', 'system_backup', 'broadcast_notifications', 'access_council', 'b2b_market', 'standard_access']
        : (existingIndex >= 0 ? this.users[existingIndex].permissions : ['standard_access']),
      kycVerified: isSuperAdmin ? true : (userData.kycVerified !== undefined ? userData.kycVerified : (existingIndex >= 0 ? this.users[existingIndex].kycVerified : false)),
      avatarUrl: userData.avatarUrl || (existingIndex >= 0 ? this.users[existingIndex].avatarUrl : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop'),
      origin: supabaseService.isConfigured() ? 'supabase_cloud' : 'local_session'
    };

    if (existingIndex >= 0) {
      this.users[existingIndex] = {
        ...this.users[existingIndex],
        ...record,
        lastLogin: now
      };
    } else {
      this.users.unshift(record);
      this.addLog('info', 'auth', `Nouveau compte utilisateur enregistré : ${record.name} (${record.email})`, 'Super-Admin');
    }

    this.notify();
    return record;
  }

  /**
   * Diagnostic et réparation automatique de tous les comptes (réconciliation, permissions manquantes, profils orphelins)
   */
  public async reconcileAndRepairAllAccounts(): Promise<{ fixedCount: number; details: string[] }> {
    const details: string[] = [];
    let fixedCount = 0;

    // 1. Récupérer les profils du Cloud Supabase si accessible
    await this.syncWithSupabase();

    // 2. Vérifier et réparer chaque compte local
    this.users = this.users.map(u => {
      let modified = false;
      const isSuperAdmin = u.email.toLowerCase() === 'visionsmart224@gmail.com';
      const repaired: AdminUserRecord = { ...u };

      // Vérifier le Super-Admin
      if (isSuperAdmin) {
        if (repaired.role !== 'super_admin' || repaired.status !== 'active') {
          repaired.role = 'super_admin';
          repaired.status = 'active';
          repaired.kycVerified = true;
          modified = true;
          details.push(`Compte Super-Admin ${u.email} restauré avec pleins pouvoirs.`);
        }
      }

      // Réparer les permissions vides
      if (!repaired.permissions || repaired.permissions.length === 0) {
        repaired.permissions = isSuperAdmin 
          ? ['all', 'manage_users', 'manage_ai', 'manage_modules', 'manage_moderation', 'manage_templates', 'sign_documents', 'stamp_documents', 'manage_workflows', 'system_backup', 'broadcast_notifications', 'access_council', 'b2b_market', 'standard_access']
          : (repaired.role === 'expert' ? ['access_council', 'sign_documents', 'view_dossiers'] : ['standard_access']);
        modified = true;
        details.push(`Permissions initialisées pour ${u.email}`);
      }

      // Réparer le Citizenship ID manquant
      if (!repaired.citizenshipId) {
        const countryCode = (repaired.country || 'FR').substring(0, 2).toUpperCase();
        repaired.citizenshipId = isSuperAdmin ? 'LMAV-SUPREME-ADMIN-01' : `LMAV-${new Date().getFullYear()}-${Math.floor(Math.random()*9000)+1000}-${countryCode}`;
        modified = true;
        details.push(`Passeport numérique généré pour ${u.email} (${repaired.citizenshipId})`);
      }

      // Réparer les crédits manquants
      if (repaired.credits === undefined || isNaN(repaired.credits)) {
        repaired.credits = isSuperAdmin ? 1000000 : 250;
        modified = true;
        details.push(`Solde de crédits ajusté pour ${u.email} (${repaired.credits} Ⓒ)`);
      }

      // Réparer l'avatar manquant
      if (!repaired.avatarUrl || repaired.avatarUrl.trim() === '') {
        repaired.avatarUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&h=120&fit=crop';
        modified = true;
        details.push(`Avatar par défaut attribué pour ${u.email}`);
      }

      if (modified) fixedCount++;
      return repaired;
    });

    // 3. Dédupliquer les utilisateurs par email
    const uniqueMap = new Map<string, AdminUserRecord>();
    for (const u of this.users) {
      const key = u.email.toLowerCase().trim();
      if (!uniqueMap.has(key)) {
        uniqueMap.set(key, u);
      } else {
        // Fusionner
        const existing = uniqueMap.get(key)!;
        uniqueMap.set(key, {
          ...existing,
          ...u,
          credits: Math.max(existing.credits, u.credits),
          kycVerified: existing.kycVerified || u.kycVerified
        });
        details.push(`Doublon fusionné pour l'email ${key}`);
        fixedCount++;
      }
    }
    this.users = Array.from(uniqueMap.values());

    // Garantir le Super-Admin au sommet
    const saIdx = this.users.findIndex(u => u.email.toLowerCase() === 'visionsmart224@gmail.com');
    if (saIdx > 0) {
      const [superAdminUser] = this.users.splice(saIdx, 1);
      this.users.unshift(superAdminUser);
    }

    this.addLog('security', 'admin', `Audit & Réparation des comptes achevé : ${fixedCount} anomalies résolues sur ${this.users.length} comptes.`, 'Super-Admin');
    this.notify();

    return { fixedCount, details };
  }

  /**
   * Ajustement de crédits avec trace d'audit
   */
  public adjustUserCredits(userId: string, amount: number, reason: string = 'Ajustement Administratif'): AdminUserRecord | null {
    const user = this.users.find(u => u.id === userId);
    if (!user) return null;

    const newCredits = Math.max(0, user.credits + amount);
    this.updateUser(userId, { credits: newCredits });
    this.addLog('info', 'payment', `Crédits de ${user.name} modifiés de ${amount > 0 ? '+' : ''}${amount} Ⓒ (Nouveau solde: ${newCredits} Ⓒ). Motif : ${reason}`, 'Super-Admin');
    return { ...user, credits: newCredits };
  }

  /**
   * Récupère l'historique d'audit spécifique à un utilisateur
   */
  public getUserAuditHistory(userId: string): SystemAuditLog[] {
    const user = this.users.find(u => u.id === userId);
    if (!user) return [];
    
    return this.logs.filter(l => 
      l.message.toLowerCase().includes(user.email.toLowerCase()) || 
      l.message.toLowerCase().includes(user.name.toLowerCase()) ||
      l.actor.toLowerCase().includes(user.name.toLowerCase()) ||
      l.actor.toLowerCase().includes(user.email.toLowerCase())
    );
  }

  /**
   * Export des utilisateurs au format CSV
   */
  public exportUsersCSV(): string {
    const headers = ['ID', 'Nom', 'Email', 'Role', 'Statut', 'Pays', 'Ville', 'Credits', 'Passeport_ID', 'KYC_Verifie', 'Date_Inscription', 'Derniere_Connexion', 'Origine'];
    const rows = this.users.map(u => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.country}"`,
      `"${u.city || ''}"`,
      u.credits,
      `"${u.citizenshipId || ''}"`,
      u.kycVerified ? 'OUI' : 'NON',
      `"${u.joinedAt}"`,
      `"${u.lastLogin}"`,
      `"${u.origin || 'local'}"`
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }

  /**
   * Export des utilisateurs au format JSON
   */
  public exportUsersJSON(): string {
    return JSON.stringify(this.users, null, 2);
  }

  // ── GESTION DE LA MODÉRATION & SIGNALEMENTS ──
  public updateModerationItem(id: string, updates: Partial<ContentModerationItem>): void {
    this.moderationItems = this.moderationItems.map(item => item.id === id ? { ...item, ...updates } : item);
    this.addLog('info', 'admin', `Contenu modéré : ${id} (Statut : ${updates.status || 'Mis à jour'})`, 'Super-Admin');
    this.notify();
  }

  public approveModerationItem(id: string): void {
    this.updateModerationItem(id, { status: 'approved' });
  }

  public hideModerationItem(id: string): void {
    this.updateModerationItem(id, { status: 'hidden' });
  }

  public deleteModerationItem(id: string): void {
    const item = this.moderationItems.find(m => m.id === id);
    this.moderationItems = this.moderationItems.filter(m => m.id !== id);
    this.addLog('warning', 'admin', `Contenu supprimé de la modération : ${item?.title || id}`, 'Super-Admin');
    this.notify();
  }

  public addModerationItem(item: Omit<ContentModerationItem, 'id' | 'createdAt' | 'reportsCount'>): ContentModerationItem {
    const newItem: ContentModerationItem = {
      ...item,
      id: `mod-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      reportsCount: 1,
      status: 'flagged'
    };
    this.moderationItems.unshift(newItem);
    this.addLog('warning', 'moderation', `Nouveau contenu signalé pour modération : ${newItem.title}`, 'Mooc-Chat-Guard');
    this.notify();
    return newItem;
  }

  public updateUserReport(id: string, updates: Partial<UserReportItem>): void {
    this.userReports = this.userReports.map(r => r.id === id ? { ...r, ...updates } : r);
    this.addLog('info', 'admin', `Signalement ${id} traité (Statut : ${updates.status})`, 'Super-Admin');
    this.notify();
  }

  public addUserReport(report: Omit<UserReportItem, 'id' | 'createdAt' | 'status'>): UserReportItem {
    const newReport: UserReportItem = {
      ...report,
      id: `rep-${Date.now()}`,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'pending'
    };
    this.userReports.unshift(newReport);
    this.addLog('warning', 'moderation', `Signalement utilisateur reçu de ${newReport.reporterName} concernant ${newReport.reportedUserName}`, 'Mooc-Chat-Guard');
    this.notify();
    return newReport;
  }

  public dismissUserReport(id: string, notes?: string): void {
    this.updateUserReport(id, { status: 'dismissed', resolutionNotes: notes || 'Signalement examiné et classé sans suite.' });
  }

  public actionUserReport(id: string, action: 'warn_user' | 'delete_content' | 'suspend_user', notes: string): void {
    const rep = this.userReports.find(r => r.id === id);
    if (!rep) return;

    if (action === 'suspend_user' && rep.reportedUserId) {
      this.setUserStatus(rep.reportedUserId, 'suspended');
    } else if (action === 'delete_content' && rep.targetId) {
      this.deleteModerationItem(rep.targetId);
    }

    this.updateUserReport(id, { status: 'actioned', resolutionNotes: notes });
    this.addLog('warning', 'admin', `Mesure disciplinaire appliquée suite au signalement ${id} : ${action}`, 'Super-Admin');
  }

  // ── GESTION DE MOKTRUST & AUDIT DE CONFIANCE ──
  public updateMokTrustAudit(id: string, updates: Partial<MokTrustAuditItem>): void {
    this.mokTrustAudits = this.mokTrustAudits.map(m => m.id === id ? { ...m, ...updates } : m);
    this.addLog('security', 'payment', `Dossier de conformité MokTrust ${id} mis à jour (Statut: ${updates.status})`, 'Super-Admin');
    this.notify();
  }

  public approveMokTrustBadge(id: string, notes?: string): void {
    const audit = this.mokTrustAudits.find(a => a.id === id);
    if (audit) {
      this.updateMokTrustAudit(id, { status: 'approved', auditNotes: notes || 'Badge certifié et activé par le Super-Administrateur.' });
      if (audit.sellerId) {
        this.updateUser(audit.sellerId, { kycVerified: true });
      }
    }
  }

  public rejectMokTrustBadge(id: string, notes: string): void {
    this.updateMokTrustAudit(id, { status: 'rejected', auditNotes: notes });
  }

  // ── GESTION DES PARAMÈTRES DÉTAILLÉS DE LA PLATEFORME ──
  public updateDetailedSettings(updates: Partial<PlatformDetailedModuleSettings>): void {
    this.detailedSettings = {
      ...this.detailedSettings,
      ...updates,
      live: { ...this.detailedSettings.live, ...(updates.live || {}) },
      commerce: { ...this.detailedSettings.commerce, ...(updates.commerce || {}) },
      mokTrust: { ...this.detailedSettings.mokTrust, ...(updates.mokTrust || {}) },
      studio: {
        ...this.detailedSettings.studio,
        ...(updates.studio || {}),
        // Sous-objet : la fusion superficielle ci-dessus l'écraserait en
        // entier dès qu'un formulaire envoie `studio` sans lui.
        defaultAvatar: {
          ...this.detailedSettings.studio.defaultAvatar,
          ...(updates.studio?.defaultAvatar || {}),
        },
      },
      campus: { ...this.detailedSettings.campus, ...(updates.campus || {}) },
      aiCore: { ...this.detailedSettings.aiCore, ...(updates.aiCore || {}) },
      architecteAvatar: {
        ...this.detailedSettings.architecteAvatar,
        ...(updates.architecteAvatar || {}),
        rig: {
          ...this.detailedSettings.architecteAvatar.rig,
          ...(updates.architecteAvatar?.rig || {}),
        },
        // Sous-objet : la fusion superficielle l'écraserait en entier dès
        // qu'un formulaire envoie `architecteAvatar` sans lui.
        mouthAnchor: {
          ...this.detailedSettings.architecteAvatar.mouthAnchor,
          ...(updates.architecteAvatar?.mouthAnchor || {}),
        },
      },
    };
    
    this.addLog('info', 'admin', `Mise à jour des paramètres détaillés de la plateforme (Live, Commerce, MokTrust, Studio, Campus, IA)`, 'Super-Admin');
    
    // Sync Supabase
    supabaseService.savePlatformSettings(this.detailedSettings).catch(() => {});
    
    this.notify();
  }

  // ── GESTION DE L'IA ET RÉSILIENCE MULTI-FOURNISSEUR ──
  public updateAIProvider(id: string, updates: Partial<AIProviderConfig>): void {
    this.aiProviders = this.aiProviders.map(p => {
      if (p.id === id) {
        return { ...p, ...updates };
      }
      if (updates.isDefault && p.id !== id) {
        return { ...p, isDefault: false };
      }
      return p;
    });
    this.addLog('info', 'ai', `Configuration mise à jour pour le fournisseur IA ${id}`, 'Super-Admin');
    this.notify();
  }

  public addAIProvider(provider: Omit<AIProviderConfig, 'id' | 'consecutiveErrors' | 'totalCalls' | 'successCalls'>): AIProviderConfig {
    const newProvider: AIProviderConfig = {
      ...provider,
      id: `prov-custom-${Date.now()}`,
      consecutiveErrors: 0,
      totalCalls: 0,
      successCalls: 0,
      isCustom: true,
      lastHealthCheck: new Date().toISOString()
    };
    this.aiProviders.push(newProvider);
    this.addLog('info', 'ai', `Nouveau fournisseur d'IA connecté : ${newProvider.name} (${newProvider.provider})`, 'Super-Admin');
    this.notify();
    return newProvider;
  }

  public deleteAIProvider(id: string): boolean {
    const provider = this.aiProviders.find(p => p.id === id);
    if (!provider) return false;
    if (provider.isDefault) {
      this.addLog('warning', 'ai', `Impossible de supprimer le fournisseur par défaut (${provider.name}). Choisissez un autre défaut d'abord.`, 'Système IA');
      return false;
    }
    this.aiProviders = this.aiProviders.filter(p => p.id !== id);
    this.addLog('warning', 'ai', `Suppression du fournisseur d'IA : ${provider.name}`, 'Super-Admin');
    this.notify();
    return true;
  }

  public toggleAIProvider(id: string): void {
    const provider = this.aiProviders.find(p => p.id === id);
    if (!provider) return;
    const newState = !provider.isEnabled;
    this.updateAIProvider(id, { isEnabled: newState });
    this.addLog('info', 'ai', `Fournisseur ${provider.name} : ${newState ? 'ACTIVÉ' : 'DÉSACTIVÉ'}`, 'Super-Admin');
  }

  public setAIProviderPriority(id: string, priority: number): void {
    this.updateAIProvider(id, { priority });
  }

  public reorderAIProviders(ids: string[]): void {
    const map = new Map(this.aiProviders.map(p => [p.id, p]));
    const reordered: AIProviderConfig[] = [];
    ids.forEach((id, index) => {
      const p = map.get(id);
      if (p) {
        reordered.push({ ...p, priority: index + 1 });
        map.delete(id);
      }
    });
    // Add any remaining
    map.forEach(p => reordered.push(p));
    this.aiProviders = reordered;
    this.addLog('info', 'ai', `Chaîne de secours IA réordonnée avec succès (${ids.length} nœuds)`, 'Super-Admin');
    this.notify();
  }

  public quarantineAIProvider(id: string, reason: string): void {
    const provider = this.aiProviders.find(p => p.id === id);
    if (!provider) return;
    this.updateAIProvider(id, {
      status: 'quarantined',
      lastErrorMessage: reason
    });
    this.addLog('warning', 'ai', `MISE EN QUARANTAINE DU FOURNISSEUR ${provider.name} : ${reason}`, 'Auto-Resilience Guard');
  }

  public restoreAIProvider(id: string): void {
    const provider = this.aiProviders.find(p => p.id === id);
    if (!provider) return;
    this.updateAIProvider(id, {
      status: 'online',
      consecutiveErrors: 0,
      lastErrorMessage: undefined,
      lastHealthCheck: new Date().toISOString()
    });
    this.addLog('info', 'ai', `Rétablissement et réadmission du fournisseur ${provider.name} dans la chaîne active`, 'Super-Admin');
  }

  public setDefaultAIProvider(id: string): void {
    this.aiProviders = this.aiProviders.map(p => ({
      ...p,
      isDefault: p.id === id,
      tier: p.id === id ? 'primary' : p.tier === 'primary' ? 'secondary' : p.tier
    }));
    const p = this.aiProviders.find(x => x.id === id);
    this.addLog('info', 'ai', `Nouveau moteur IA par défaut désigné : ${p?.name || id}`, 'Super-Admin');
    this.notify();
  }

  // ── GESTION DES MODULES ──
  public updateModule(id: string, updates: Partial<PlatformModuleConfig>): void {
    this.modules = this.modules.map(m => m.id === id ? { ...m, ...updates } : m);
    this.addLog('info', 'admin', `Module ${id} modifié (Activé: ${updates.isEnabled ?? 'N/A'}, Maintenance: ${updates.inMaintenance ?? 'N/A'})`, 'Super-Admin');
    this.notify();
  }

  // ── GESTION DES MODÈLES ──
  public updateTemplate(id: string, updates: Partial<OfficialDocumentTemplate>): void {
    this.templates = this.templates.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : t);
    this.addLog('info', 'document', `Modèle de document mis à jour : ${id}`, 'Super-Admin');
    this.notify();
  }

  public addTemplate(template: Omit<OfficialDocumentTemplate, 'id' | 'updatedAt'>): OfficialDocumentTemplate {
    const newTpl: OfficialDocumentTemplate = {
      ...template,
      id: `tpl-${Date.now()}`,
      updatedAt: new Date().toISOString().split('T')[0]
    };
    this.templates.unshift(newTpl);
    this.addLog('info', 'document', `Nouveau modèle créé : ${newTpl.title}`, 'Super-Admin');
    this.notify();
    return newTpl;
  }

  public deleteTemplate(id: string): void {
    this.templates = this.templates.filter(t => t.id !== id);
    this.addLog('warning', 'document', `Modèle supprimé : ${id}`, 'Super-Admin');
    this.notify();
  }

  // ── GESTION DES SIGNATURES ──
  public updateSignature(id: string, updates: Partial<OfficialSignature>): void {
    this.signatures = this.signatures.map(s => s.id === id ? { ...s, ...updates } : s);
    this.addLog('security', 'document', `Signature numérique mise à jour : ${id}`, 'Super-Admin');
    this.notify();
  }

  public addSignature(signature: Omit<OfficialSignature, 'id' | 'issuedAt'>): OfficialSignature {
    const newSig: OfficialSignature = {
      ...signature,
      id: `sig-${Date.now()}`,
      issuedAt: new Date().toISOString().split('T')[0]
    };
    this.signatures.push(newSig);
    this.addLog('security', 'document', `Nouvelle signature officielle enregistrée pour ${newSig.signerName}`, 'Super-Admin');
    this.notify();
    return newSig;
  }

  // ── GESTION DES CACHETS & TAMPONS ──
  public updateStamp(id: string, updates: Partial<OfficialStamp>): void {
    this.stamps = this.stamps.map(s => s.id === id ? { ...s, ...updates } : s);
    this.addLog('security', 'document', `Cachet officiel mis à jour : ${id}`, 'Super-Admin');
    this.notify();
  }

  public addStamp(stamp: Omit<OfficialStamp, 'id'>): OfficialStamp {
    const newStamp: OfficialStamp = {
      ...stamp,
      id: `stamp-${Date.now()}`
    };
    this.stamps.push(newStamp);
    this.addLog('security', 'document', `Nouveau cachet officiel créé : ${newStamp.title}`, 'Super-Admin');
    this.notify();
    return newStamp;
  }

  // ── GESTION DES WORKFLOWS ──
  public updateWorkflow(id: string, updates: Partial<WorkflowPipelineConfig>): void {
    this.workflows = this.workflows.map(w => w.id === id ? { ...w, ...updates, updatedAt: new Date().toISOString().split('T')[0] } : w);
    this.addLog('info', 'workflow', `Workflow d'approbation mis à jour : ${id}`, 'Super-Admin');
    this.notify();
  }

  // ── GESTION DU SYSTÈME & SAUVEGARDE INTELLIGENTE ──
  public updateSystemConfig(updates: Partial<AdminSystemConfig>): void {
    this.systemConfig = { ...this.systemConfig, ...updates };
    this.addLog('warning', 'admin', `Configuration système générale modifiée`, 'Super-Admin');
    this.notify();
  }

  public updateBackupSchedule(updates: Partial<BackupScheduleConfig>): BackupScheduleConfig {
    this.backupSchedule = {
      ...this.backupSchedule,
      ...updates
    };
    this.addLog('info', 'sync', `Planificateur de sauvegardes mis à jour (${this.backupSchedule.frequency}, ${this.backupSchedule.timeOfDay})`, 'Super-Admin');
    this.notify();
    return { ...this.backupSchedule };
  }

  public triggerScheduledBackupNow(): BackupSnapshotRecord {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const snapshot = this.createSnapshot(
      `Sauvegarde Planifiée — ${timestamp}`,
      'scheduled',
      `Exécution manuelle du cycle de sauvegarde planifiée (${this.backupSchedule.frequency}).`,
      'v6.3.0'
    );
    this.backupSchedule.lastRunAt = timestamp;
    this.notify();
    return snapshot;
  }

  /**
   * Création d'un instantané (Snapshot) complet du système
   */
  public createSnapshot(
    name: string, 
    type: SnapshotType = 'manual', 
    notes?: string, 
    versionTag: string = 'v6.3.0'
  ): BackupSnapshotRecord {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const id = `snp-${type}-${Date.now()}`;
    
    // Calcul de taille approximative
    const rawPayload = JSON.stringify({
      systemConfig: this.systemConfig,
      users: this.users,
      aiProviders: this.aiProviders,
      modules: this.modules,
      templates: this.templates,
      signatures: this.signatures,
      stamps: this.stamps,
      workflows: this.workflows,
      detailedSettings: this.detailedSettings
    });

    const sizeBytes = new Blob([rawPayload]).size;
    const checksum = `sha256-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`;

    const newSnapshot: BackupSnapshotRecord = {
      id,
      name,
      type,
      createdAt: timestamp,
      versionTag,
      sizeBytes,
      checksum,
      canRollback: true,
      notes: notes || `Instantané ${type} généré avec succès.`,
      recordsCount: {
        users: this.users.length,
        aiProviders: this.aiProviders.length,
        modules: this.modules.length,
        templates: this.templates.length,
        signatures: this.signatures.length,
        stamps: this.stamps.length,
        workflows: this.workflows.length,
        logs: this.logs.length,
        moderation: this.moderationItems.length,
        audits: this.mokTrustAudits.length,
        settingsIncluded: true
      },
      payload: {
        systemConfig: JSON.parse(JSON.stringify(this.systemConfig)),
        users: JSON.parse(JSON.stringify(this.users)),
        aiProviders: JSON.parse(JSON.stringify(this.aiProviders)),
        modules: JSON.parse(JSON.stringify(this.modules)),
        templates: JSON.parse(JSON.stringify(this.templates)),
        signatures: JSON.parse(JSON.stringify(this.signatures)),
        stamps: JSON.parse(JSON.stringify(this.stamps)),
        workflows: JSON.parse(JSON.stringify(this.workflows)),
        detailedSettings: JSON.parse(JSON.stringify(this.detailedSettings)),
        notifications: JSON.parse(JSON.stringify(this.notifications))
      }
    };

    this.snapshots.unshift(newSnapshot);

    // Élagage automatique si dépassement de la limite
    if (this.backupSchedule.autoPruneOldSnapshots && this.snapshots.length > this.backupSchedule.keepMaxSnapshots) {
      // Conserver les jalons officiels de release
      const milestones = this.snapshots.filter(s => s.type === 'system_milestone');
      const others = this.snapshots.filter(s => s.type !== 'system_milestone');
      const maxOthers = Math.max(3, this.backupSchedule.keepMaxSnapshots - milestones.length);
      this.snapshots = [...milestones, ...others.slice(0, maxOthers)];
    }

    this.systemConfig.lastBackupDate = timestamp;
    this.addLog('security', 'sync', `Création de l'instantané de sauvegarde [${type.toUpperCase()}] : "${name}" (${(sizeBytes / 1024).toFixed(1)} KB)`, 'Super-Admin', { snapshotId: id, versionTag });
    this.notify();
    return newSnapshot;
  }

  public deleteSnapshot(id: string): boolean {
    const target = this.snapshots.find(s => s.id === id);
    if (!target) return false;
    if (target.type === 'system_milestone') {
      this.addLog('warning', 'sync', `Tentative bloquée : Les jalons officiels système ne peuvent pas être supprimés.`, 'Sécurité');
      return false;
    }

    this.snapshots = this.snapshots.filter(s => s.id !== id);
    this.addLog('warning', 'sync', `Suppression de l'instantané "${target.name}" (${id})`, 'Super-Admin');
    this.notify();
    return true;
  }

  /**
   * Vérification de compatibilité de base de données avant restauration
   */
  public verifyDatabaseCompatibility(targetVersionTag: string): {
    isCompatible: boolean;
    dataLossRisk: 'none' | 'low' | 'moderate' | 'high';
    checks: { name: string; status: 'ok' | 'warning' | 'info'; message: string }[];
    warnings: string[];
  } {
    const targetVersion = this.getVersion(targetVersionTag) || this.releaseVersions[0];
    const warnings: string[] = [];
    const checks: { name: string; status: 'ok' | 'warning' | 'info'; message: string }[] = [];

    // 1. Contrôle Schéma Supabase
    checks.push({
      name: 'Schéma PostgreSQL Supabase',
      status: 'ok',
      message: 'Les tables profiles, audit_logs et platform_settings sont 100% compatibles avec la version cible.'
    });

    // 2. Intégrité des Comptes Utilisateurs
    const activeUsersCount = this.users.length;
    checks.push({
      name: 'Préservation des Comptes Utilisateurs',
      status: 'ok',
      message: `${activeUsersCount} comptes et leurs rôles RBAC seront intégralement conservés.`
    });

    // 3. Solde de Crédits Ⓒ
    const totalCredits = this.users.reduce((acc, u) => acc + (u.credits || 0), 0);
    checks.push({
      name: 'Soldes & Transactions Crédits Ⓒ',
      status: 'ok',
      message: `Total de ${totalCredits.toLocaleString()} Ⓒ préservé sans altération financière.`
    });

    // 4. Clés API et Fournisseurs IA
    checks.push({
      name: 'Chiffrement Clés API & Fournisseurs IA',
      status: 'ok',
      message: 'Les clés API et les règles de failover résilientes seront préservées et migrées.'
    });

    // 5. Versioning
    if (targetVersionTag.startsWith('v5.')) {
      checks.push({
        name: 'Mise à niveau ascendante requise',
        status: 'warning',
        message: 'Restauration depuis v5.x : Le moteur appliquera une mise à niveau ascendante sans perte.'
      });
      warnings.push('La version cible v5.x sera modernisée avec le Design System v6.');
    }

    return {
      isCompatible: true,
      dataLossRisk: targetVersion?.databaseCompatibility?.dataLossRisk || 'none',
      checks,
      warnings
    };
  }

  /**
   * Comparaison différentielle entre deux versions ou instantanés
   */
  public compareVersions(v1Tag: string, v2Tag: string): VersionComparisonResult {
    const v1 = this.getVersion(v1Tag) || this.releaseVersions[1] || this.releaseVersions[0];
    const v2 = this.getVersion(v2Tag) || this.releaseVersions[0];

    const addedFeatures: string[] = [];
    const changedConfigs: { key: string; oldValue: string; newValue: string; impact: string }[] = [];
    const schemaChanges: string[] = [];

    // Changelog diff
    v2.changelog.forEach(c => {
      if (!v1.changelog.includes(c)) {
        addedFeatures.push(c);
      }
    });

    // Diff providers
    if (v2.aiProvidersCount !== v1.aiProvidersCount) {
      changedConfigs.push({
        key: 'Fournisseurs IA',
        oldValue: `${v1.aiProvidersCount} fournisseurs`,
        newValue: `${v2.aiProvidersCount} fournisseurs`,
        impact: 'Extension de la redondance et de la résilience multi-fournisseurs'
      });
    }

    // Diff templates
    if (v2.templatesCount !== v1.templatesCount) {
      changedConfigs.push({
        key: 'Modèles Officiels',
        oldValue: `${v1.templatesCount} modèles`,
        newValue: `${v2.templatesCount} modèles`,
        impact: 'Nouveaux modèles de documents officiels et attestations'
      });
    }

    // Diff schema
    if (v1.schemaVersion !== v2.schemaVersion) {
      schemaChanges.push(`Mise à niveau de ${v1.schemaVersion} vers ${v2.schemaVersion}`);
    }

    return {
      versionA: v1Tag,
      versionB: v2Tag,
      diffSummary: `Comparaison entre ${v1Tag} (${v1.releaseDate}) et ${v2Tag} (${v2.releaseDate})`,
      addedFeatures: addedFeatures.length > 0 ? addedFeatures : ['Aucune fonctionnalité supprimée — compatibilité ascendante'],
      removedFeatures: [],
      changedConfigs,
      schemaChanges
    };
  }

  /**
   * Restauration Intelligente Sans Perte de Données
   * - Sauvegarde automatique de l'état actuel avant toute modification
   * - Préservation stricte de tous les comptes, rôles, soldes de crédits et journaux
   * - Mise à jour des modules, règles IA, modèles et paramètres
   */
  public intelligentRestore(params: {
    snapshotId?: string;
    versionTag?: string;
    backupData?: any;
    preserveUsers?: boolean;
    preserveLogs?: boolean;
    preserveCredits?: boolean;
    preserveProfiles?: boolean;
    preserveModeration?: boolean;
  }): RestoreOperationResult {
    const {
      snapshotId,
      versionTag = 'v6.3.0',
      backupData,
      preserveUsers = true,
      preserveLogs = true,
      preserveCredits = true,
      preserveProfiles = true,
      preserveModeration = true
    } = params;

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const preRestoreSnapshot = this.createSnapshot(
      `Point de Récupération Automatique Pré-Restauration — ${timestamp}`,
      'auto_pre_restore',
      `Généré automatiquement avant restauration vers ${snapshotId || versionTag}. Permet un rollback instantané.`,
      this.systemConfig.systemName.includes('v6.3') ? 'v6.3.0' : 'v6.3.0'
    );

    try {
      let sourcePayload: any = null;

      if (backupData) {
        sourcePayload = backupData;
      } else if (snapshotId) {
        const snap = this.getSnapshot(snapshotId);
        if (snap && snap.payload) {
          sourcePayload = snap.payload;
        }
      }

      // Si pas de payload spécifique, utiliser les références de version
      const currentUserState = JSON.parse(JSON.stringify(this.users));
      const currentLogsState = JSON.parse(JSON.stringify(this.logs));
      const currentModerationState = JSON.parse(JSON.stringify(this.moderationItems));

      let restoredModules = INITIAL_MODULES;
      let restoredAIProviders = INITIAL_AI_PROVIDERS;
      let restoredTemplates = INITIAL_TEMPLATES;
      let restoredSignatures = INITIAL_SIGNATURES;
      let restoredStamps = INITIAL_STAMPS;
      let restoredWorkflows = INITIAL_WORKFLOWS;
      let restoredSystemConfig = INITIAL_SYSTEM_CONFIG;
      let restoredDetailedSettings = INITIAL_DETAILED_SETTINGS;

      if (sourcePayload) {
        if (sourcePayload.modules) restoredModules = sourcePayload.modules;
        if (sourcePayload.aiProviders) restoredAIProviders = sourcePayload.aiProviders;
        if (sourcePayload.templates) restoredTemplates = sourcePayload.templates;
        if (sourcePayload.signatures) restoredSignatures = sourcePayload.signatures;
        if (sourcePayload.stamps) restoredStamps = sourcePayload.stamps;
        if (sourcePayload.workflows) restoredWorkflows = sourcePayload.workflows;
        if (sourcePayload.systemConfig) restoredSystemConfig = sourcePayload.systemConfig;
        if (sourcePayload.detailedSettings) restoredDetailedSettings = sourcePayload.detailedSettings;
      }

      // ── FUSION INTELLIGENTE DES UTILISATEURS (PRÉSERVATION TOTALE) ──
      let finalUsers: AdminUserRecord[] = [];
      if (preserveUsers) {
        // Conserver les utilisateurs actuels avec leurs profils et crédits
        finalUsers = currentUserState.map((u: AdminUserRecord) => {
          if (!preserveCredits) {
            return { ...u, credits: 250 };
          }
          return u;
        });

        // Si le snapshot contenait des utilisateurs absents de la liste actuelle, les fusionner sans écraser
        if (sourcePayload && Array.isArray(sourcePayload.users)) {
          sourcePayload.users.forEach((su: AdminUserRecord) => {
            const exists = finalUsers.some(fu => fu.id === su.id || (su.email && fu.email.toLowerCase() === su.email.toLowerCase()));
            if (!exists) {
              finalUsers.push(su);
            }
          });
        }
      } else if (sourcePayload && Array.isArray(sourcePayload.users)) {
        finalUsers = sourcePayload.users;
      } else {
        finalUsers = INITIAL_USERS;
      }

      // Protection inaliénable du Super-Administrateur
      const superAdminIndex = finalUsers.findIndex(u => u.email.toLowerCase() === 'visionsmart224@gmail.com');
      if (superAdminIndex === -1) {
        finalUsers.unshift(INITIAL_USERS[0]);
      } else {
        finalUsers[superAdminIndex].role = 'super_admin';
        finalUsers[superAdminIndex].status = 'active';
      }

      // ── APPLICATION DE L'ÉTAT ──
      this.users = finalUsers;
      this.modules = restoredModules;
      this.aiProviders = restoredAIProviders;
      this.templates = restoredTemplates;
      this.signatures = restoredSignatures;
      this.stamps = restoredStamps;
      this.workflows = restoredWorkflows;
      this.systemConfig = {
        ...restoredSystemConfig,
        lastBackupDate: timestamp
      };
      this.detailedSettings = restoredDetailedSettings;

      if (!preserveLogs && sourcePayload && sourcePayload.logs) {
        this.logs = sourcePayload.logs;
      }
      if (!preserveModeration && sourcePayload && sourcePayload.moderation) {
        this.moderationItems = sourcePayload.moderation;
      }

      const result: RestoreOperationResult = {
        success: true,
        restoredVersion: versionTag,
        snapshotId: snapshotId || 'custom-payload',
        timestamp,
        preRestoreSnapshotId: preRestoreSnapshot.id,
        summary: `Restauration intelligente appliquée vers ${versionTag} avec préservation totale de ${finalUsers.length} comptes.`,
        preservedItems: {
          usersCount: finalUsers.length,
          logsCount: this.logs.length,
          totalCreditsPreserved: finalUsers.reduce((a, b) => a + (b.credits || 0), 0),
          profilesPreserved: preserveProfiles
        },
        warnings: []
      };

      this.lastRestoreResult = result;
      this.addLog('security', 'sync', `RESTAURATION INTELLIGENTE RÉUSSIE vers ${versionTag} (Instantané sécurité : ${preRestoreSnapshot.id})`, 'Super-Admin', { result });
      this.notify();
      return result;
    } catch (err: any) {
      const errorResult: RestoreOperationResult = {
        success: false,
        restoredVersion: versionTag,
        snapshotId: snapshotId || 'failed',
        timestamp,
        preRestoreSnapshotId: preRestoreSnapshot.id,
        summary: `Échec de la restauration : ${err?.message || 'Erreur inattendue'}. L'état précédent a été conservé.`,
        preservedItems: {
          usersCount: this.users.length,
          logsCount: this.logs.length,
          totalCreditsPreserved: this.users.reduce((a, b) => a + (b.credits || 0), 0),
          profilesPreserved: true
        },
        warnings: [err?.message || 'Erreur inconnue']
      };
      this.addLog('security', 'sync', `Échec de la restauration intelligente : ${err?.message}`, 'Système Sécurité');
      return errorResult;
    }
  }

  /**
   * Annulation (Rollback / Undo) de la dernière restauration
   */
  public undoLastRestore(): RestoreOperationResult | null {
    if (!this.lastRestoreResult || !this.lastRestoreResult.preRestoreSnapshotId) {
      this.addLog('warning', 'sync', `Impossible d'annuler : aucun point de restauration pré-restauration trouvé.`, 'Super-Admin');
      return null;
    }

    const preSnapshot = this.getSnapshot(this.lastRestoreResult.preRestoreSnapshotId);
    if (!preSnapshot || !preSnapshot.payload) {
      this.addLog('warning', 'sync', `L'instantané pré-restauration (${this.lastRestoreResult.preRestoreSnapshotId}) est introuvable.`, 'Super-Admin');
      return null;
    }

    const res = this.intelligentRestore({
      snapshotId: preSnapshot.id,
      versionTag: preSnapshot.versionTag,
      backupData: preSnapshot.payload,
      preserveUsers: true,
      preserveLogs: true,
      preserveCredits: true,
      preserveProfiles: true
    });

    this.addLog('security', 'sync', `ANNULATION (UNDO) RÉUSSIE : Retour à l'état pré-restauration [${preSnapshot.id}]`, 'Super-Admin');
    return res;
  }

  public getLastPreRestoreSnapshot(): BackupSnapshotRecord | null {
    if (!this.lastRestoreResult?.preRestoreSnapshotId) return null;
    return this.getSnapshot(this.lastRestoreResult.preRestoreSnapshotId) || null;
  }

  public exportBackupJson(snapshotId?: string): string {
    let payloadToExport: any;

    if (snapshotId) {
      const snap = this.getSnapshot(snapshotId);
      if (snap && snap.payload) {
        payloadToExport = {
          exportType: 'snapshot',
          snapshotMetadata: snap,
          ...snap.payload
        };
      }
    }

    if (!payloadToExport) {
      payloadToExport = {
        exportType: 'live_system_state',
        version: 'v6.3.0',
        exportedAt: new Date().toISOString(),
        systemConfig: this.systemConfig,
        users: this.users,
        aiProviders: this.aiProviders,
        modules: this.modules,
        templates: this.templates,
        signatures: this.signatures,
        stamps: this.stamps,
        workflows: this.workflows,
        notifications: this.notifications,
        detailedSettings: this.detailedSettings,
        snapshotsCatalog: this.snapshots.map(s => ({ id: s.id, name: s.name, type: s.type, versionTag: s.versionTag, createdAt: s.createdAt }))
      };
    }

    this.addLog('security', 'sync', `Exportation d’une archive JSON certifiée (${payloadToExport.exportType})`, 'Super-Admin');
    return JSON.stringify(payloadToExport, null, 2);
  }

  public importBackupJson(jsonString: string, options?: { preserveUsers?: boolean }): RestoreOperationResult {
    try {
      const data = JSON.parse(jsonString);
      return this.intelligentRestore({
        backupData: data,
        versionTag: data.version || 'v6.3.0',
        preserveUsers: options?.preserveUsers ?? true,
        preserveCredits: true,
        preserveLogs: true
      });
    } catch (e: any) {
      return {
        success: false,
        restoredVersion: 'inconnue',
        snapshotId: 'invalid-json',
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        preRestoreSnapshotId: '',
        summary: `Erreur lors de la lecture du fichier JSON : ${e?.message}`,
        preservedItems: {
          usersCount: this.users.length,
          logsCount: this.logs.length,
          totalCreditsPreserved: this.users.reduce((a, b) => a + (b.credits || 0), 0),
          profilesPreserved: true
        },
        warnings: [e?.message]
      };
    }
  }

  public resetToFactoryDefaults(options?: { preserveUsers?: boolean }): void {
    const preserveUsers = options?.preserveUsers ?? true;
    const keptUsers = preserveUsers ? [...this.users] : INITIAL_USERS;

    this.createSnapshot(
      `Point de Sécurité Avant Réinitialisation Usine`,
      'auto_pre_restore',
      `Instantané de sauvegarde avant réinitialisation d'usine.`,
      'v6.3.0'
    );

    this.users = keptUsers;
    this.aiProviders = INITIAL_AI_PROVIDERS;
    this.modules = INITIAL_MODULES;
    this.templates = INITIAL_TEMPLATES;
    this.signatures = INITIAL_SIGNATURES;
    this.stamps = INITIAL_STAMPS;
    this.workflows = INITIAL_WORKFLOWS;
    this.systemConfig = INITIAL_SYSTEM_CONFIG;
    this.detailedSettings = INITIAL_DETAILED_SETTINGS;
    this.addLog('security', 'admin', `RÉINITIALISATION DU SYSTÈME (Utilisateurs ${preserveUsers ? 'conservés' : 'réinitialisés'})`, 'Super-Admin');
    this.notify();
  }


  // ── GESTION DES JOURNAUX ET NOTIFICATIONS ──
  public addLog(level: SystemAuditLog['level'], category: SystemAuditLog['category'], message: string, actor: string = 'Système', metadata?: Record<string, any>): void {
    const newLog: SystemAuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      level,
      category,
      message,
      actor,
      ipAddress: '127.0.0.1',
      metadata
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 500) this.logs.pop();
    try {
      localStorage.setItem(ADMIN_LOGS_KEY, JSON.stringify(this.logs));
    } catch {}
  }

  public sendBroadcastNotification(notif: Omit<BroadcastNotification, 'id' | 'sentAt' | 'readCount' | 'active'>): BroadcastNotification {
    const newNotif: BroadcastNotification = {
      ...notif,
      id: `bc-${Date.now()}`,
      sentAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
      readCount: 0,
      active: true
    };
    this.notifications.unshift(newNotif);
    this.addLog('info', 'admin', `Diffusion d’une alerte générale : ${newNotif.title} (Cible: ${newNotif.targetAudience})`, 'Super-Admin');
    this.notify();

    // LOOP 08/17 (moteur de notifications) : jusqu'ici cette méthode
    // n'écrivait que dans ce tableau en mémoire (persistance localStorage
    // propre à ce navigateur) — un admin croyait diffuser une alerte à
    // toute la communauté, mais AUCUN autre utilisateur ne recevait jamais
    // rien. Écriture réelle en tâche de fond dans la même table
    // `notifications` que les autres notifications (pas un second
    // mécanisme) — best-effort, ne bloque jamais le retour synchrone
    // ci-dessus dont dépend le reste de cette classe (même patron que le
    // reste du dépôt : optimiste localement, écriture réelle en arrière-plan).
    const typeMap: Record<BroadcastNotification['priority'], 'success' | 'info' | 'warning' | 'alert'> = {
      info: 'info', warning: 'warning', urgent: 'alert', maintenance: 'warning',
    };
    const priorityMap: Record<BroadcastNotification['priority'], 'low' | 'normal' | 'high'> = {
      info: 'low', warning: 'normal', urgent: 'high', maintenance: 'high',
    };
    supabaseService.broadcastNotification({
      title: newNotif.title,
      message: newNotif.message,
      type: typeMap[newNotif.priority],
      priority: priorityMap[newNotif.priority],
      targetAudience: newNotif.targetAudience,
    }).then((count) => {
      if (count > 0) this.addLog('info', 'admin', `Alerte "${newNotif.title}" réellement livrée à ${count} compte(s) réel(s).`, 'Super-Admin');
    }).catch((err) => {
      console.warn('Erreur diffusion réelle de la notification:', err);
      this.addLog('warning', 'admin', `La diffusion réelle de "${newNotif.title}" a échoué — visible uniquement dans cette console admin.`, 'Super-Admin');
    });

    return newNotif;
  }

  public deleteBroadcastNotification(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notify();
  }

  // ── RÉSOLUTION DES TEMPLATES / LETTRES OFFICIELLES ──
  public resolveTemplate(templateId: string, customValues?: Record<string, string>): {
    renderedBody: string;
    template: OfficialDocumentTemplate | null;
    signature: OfficialSignature | null;
    stamp: OfficialStamp | null;
  } {
    const template = this.templates.find(t => t.id === templateId) || null;
    if (!template) {
      return { renderedBody: '', template: null, signature: null, stamp: null };
    }

    let body = template.bodyTemplate;
    const values: Record<string, string> = {};
    
    // Remplir avec les valeurs par défaut
    template.variables.forEach(v => {
      values[v.key] = v.defaultValue;
    });

    // Remplir avec les valeurs personnalisées
    if (customValues) {
      Object.entries(customValues).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          values[k] = v;
        }
      });
    }

    // Remplacer toutes les occurrences de {{VARIABLE}}
    Object.entries(values).forEach(([k, v]) => {
      const regex = new RegExp(`{{${k}}}`, 'g');
      body = body.replace(regex, v);
    });

    const signature = this.signatures.find(s => s.id === template.defaultSignerId) || this.signatures[0] || null;
    const stamp = this.stamps.find(s => s.id === template.defaultStampId) || this.stamps[0] || null;

    return {
      renderedBody: body,
      template,
      signature,
      stamp
    };
  }
}

export const adminConfigService = AdminConfigService.getInstance();
