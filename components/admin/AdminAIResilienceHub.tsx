import React, { useState, useEffect } from 'react';
import { 
  BrainCircuit, 
  Sparkles, 
  Shield, 
  ShieldAlert,
  ShieldCheck,
  Activity, 
  Zap, 
  Layers, 
  Sliders, 
  SlidersHorizontal,
  RefreshCw, 
  Check, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  ArrowUp, 
  ArrowDown, 
  Plus, 
  Trash2, 
  Play, 
  Server, 
  Cpu, 
  Globe, 
  Flame,
  Search,
  CheckCircle2,
  XCircle,
  HelpCircle,
  BarChart3,
  ListOrdered
} from 'lucide-react';
import { 
  AIProviderConfig, 
  SupportedAIProviderType, 
  AIProviderTier, 
  AIRoutingPolicyConfig, 
  AIFailoverEvent, 
  AIExecutionResult 
} from '../../types';
import { adminConfigService } from '../../services/adminConfigService';
import type { ServerProviderConfiguration } from '../../services/adminApi';
import { aiRoutingService } from '../../services/aiRoutingService';

interface AdminAIResilienceHubProps {
  providers: AIProviderConfig[];
  serverProviders: ServerProviderConfiguration[];
  onReload: () => void;
  onRefreshServer: () => Promise<void>;
}

export const AdminAIResilienceHub: React.FC<AdminAIResilienceHubProps> = ({
  providers,
  serverProviders,
  onReload,
  onRefreshServer
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'governance' | 'testbench' | 'logs'>('providers');
  const [routingPolicy, setRoutingPolicy] = useState<AIRoutingPolicyConfig>(aiRoutingService.getPolicy());
  const [failoverLogs, setFailoverLogs] = useState<AIFailoverEvent[]>(aiRoutingService.getFailoverLogs());
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string; qualityScore?: number }>>({});
  const [isServerRefreshing, setIsServerRefreshing] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');

  // Test bench state
  const [testBenchPrompt, setTestBenchPrompt] = useState('Analyse la faisabilité d\'un contrat d\'exportation d\'anacarde avec clause de séquestre bancaire.');
  const [testBenchProviderId, setTestBenchProviderId] = useState<string>('auto');
  const [testBenchIsRunning, setTestBenchIsRunning] = useState(false);
  const [testBenchResult, setTestBenchResult] = useState<AIExecutionResult | null>(null);
  const [testBenchError, setTestBenchError] = useState<string | null>(null);

  // New provider form state
  const [newProviderForm, setNewProviderForm] = useState<{
    name: string;
    provider: SupportedAIProviderType;
    defaultModel: string;
    availableModels: string;
    temperature: number;
    maxTokens: number;
    priority: number;
    tier: AIProviderTier;
    minQualityThreshold: number;
    maxLatencyThresholdMs: number;
    costPer1kInputTokens: number;
    costPer1kOutputTokens: number;
  }>({
    name: '',
    provider: 'openai',
    defaultModel: 'gpt-4o',
    availableModels: 'gpt-4o, gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4096,
    priority: providers.length + 1,
    tier: 'tertiary',
    minQualityThreshold: 65,
    maxLatencyThresholdMs: 2500,
    costPer1kInputTokens: 0.002,
    costPer1kOutputTokens: 0.008
  });

  useEffect(() => {
    setRoutingPolicy(aiRoutingService.getPolicy());
    setFailoverLogs(aiRoutingService.getFailoverLogs());
  }, [providers]);

  const handleTestProvider = async (id: string) => {
    setTestingProviderId(id);
    try {
      const res = await aiRoutingService.testProviderHealth(id);
      setTestResults(prev => ({ ...prev, [id]: res }));
      onReload();
    } catch (e: any) {
      setTestResults(prev => ({
        ...prev,
        [id]: { success: false, latencyMs: 0, message: e.message || 'Échec du test' }
      }));
    } finally {
      setTestingProviderId(null);
    }
  };

  const handleRefreshServerConfiguration = async () => {
    setIsServerRefreshing(true);
    try {
      await onRefreshServer();
    } finally {
      setIsServerRefreshing(false);
    }
  };

  const handleSavePolicy = (updates: Partial<AIRoutingPolicyConfig>) => {
    const updated = aiRoutingService.updatePolicy(updates);
    setRoutingPolicy(updated);
  };

  const handleReorder = (id: string, direction: 'up' | 'down') => {
    const sorted = [...providers].sort((a, b) => a.priority - b.priority);
    const index = sorted.findIndex(p => p.id === id);
    if (index === -1) return;
    if (direction === 'up' && index > 0) {
      const temp = sorted[index];
      sorted[index] = sorted[index - 1];
      sorted[index - 1] = temp;
    } else if (direction === 'down' && index < sorted.length - 1) {
      const temp = sorted[index];
      sorted[index] = sorted[index + 1];
      sorted[index + 1] = temp;
    }
    const ids = sorted.map(p => p.id);
    adminConfigService.reorderAIProviders(ids);
    onReload();
  };

  const handleRunTestBench = async () => {
    if (!testBenchPrompt.trim()) return;
    setTestBenchIsRunning(true);
    setTestBenchResult(null);
    setTestBenchError(null);

    try {
      const result = await aiRoutingService.executeWithResilience({
        prompt: testBenchPrompt,
        preferredProviderId: testBenchProviderId !== 'auto' ? testBenchProviderId : undefined
      });
      setTestBenchResult(result);
      setFailoverLogs(aiRoutingService.getFailoverLogs());
    } catch (err: any) {
      setTestBenchError(err.message || "Erreur lors de l'exécution du banc d'essai.");
    } finally {
      setTestBenchIsRunning(false);
    }
  };

  const handleCreateNewProvider = () => {
    if (!newProviderForm.name.trim() || !newProviderForm.defaultModel.trim()) return;
    const modelsArr = newProviderForm.availableModels
      .split(',')
      .map(m => m.trim())
      .filter(Boolean);

    adminConfigService.addAIProvider({
      name: newProviderForm.name,
      provider: newProviderForm.provider,
      isEnabled: true,
      isDefault: false,
      priority: newProviderForm.priority,
      tier: newProviderForm.tier,
      defaultModel: newProviderForm.defaultModel,
      availableModels: modelsArr.length > 0 ? modelsArr : [newProviderForm.defaultModel],
      temperature: newProviderForm.temperature,
      maxTokens: newProviderForm.maxTokens,
      status: 'unknown',
      qualityScore: 0,
      minQualityThreshold: newProviderForm.minQualityThreshold,
      maxLatencyThresholdMs: newProviderForm.maxLatencyThresholdMs,
      costPer1kInputTokens: newProviderForm.costPer1kInputTokens,
      costPer1kOutputTokens: newProviderForm.costPer1kOutputTokens
    });

    setShowNewModal(false);
    onReload();
  };

  const filteredProviders = providers.filter(p => 
    p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.provider.toLowerCase().includes(searchFilter.toLowerCase()) ||
    p.defaultModel.toLowerCase().includes(searchFilter.toLowerCase())
  ).sort((a, b) => a.priority - b.priority);

  const configuredCount = serverProviders.filter(provider => provider.configured).length;
  const unconfiguredCount = serverProviders.length - configuredCount;
  const defaultProvider = providers.find(p => p.isDefault) || providers[0];
  const editingServerProvider = editingProvider
    ? serverProviders.find(provider => provider.provider === editingProvider.provider)
    : undefined;

  return (
    <div className="space-y-6">
      {/* 1. Cockpit Haut de Contrôle & Résilience */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-400" />
                Configuration IA côté serveur
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Secrets isolés dans Netlify
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-2 tracking-tight">
              Gestionnaire Central Multi-Fournisseurs d'IA
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Le navigateur ne reçoit jamais les clés ni les endpoints privés. L’état configuré ci-dessous est vérifié par la Function d’administration à partir des variables Netlify.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => void handleRefreshServerConfiguration()}
              disabled={isServerRefreshing}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              <Activity size={15} className={isServerRefreshing ? 'animate-spin' : ''} />
              {isServerRefreshing ? 'Actualisation...' : 'Actualiser l’état serveur'}
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Plus size={15} />
              Ajouter au catalogue public
            </button>
          </div>
        </div>

        {/* Métriques clés en bandeau */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Pilote de la politique</span>
            <div className="text-sm font-black text-white mt-1 truncate flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-400 flex-shrink-0" />
              {defaultProvider ? defaultProvider.name : 'Aucun'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{defaultProvider?.defaultModel}</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Secrets configurés</span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {configuredCount} <span className="text-xs text-slate-400 font-normal">/ {serverProviders.length} variables présentes</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Valeurs jamais renvoyées au navigateur</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">À configurer</span>
            <div className="text-xl font-black text-amber-400 mt-1">
              {unconfiguredCount} <span className="text-xs text-slate-400 font-normal">variable(s) absente(s)</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Configurer dans Netlify → Environment variables</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Stratégie Active</span>
            <div className="text-sm font-black text-blue-400 mt-1 truncate">
              {routingPolicy.strategy === 'auto_resilient_quality' ? 'Auto-Résilience & Qualité' :
               routingPolicy.strategy === 'strict_priority' ? 'Priorité Stricte par Rangs' :
               routingPolicy.strategy === 'lowest_latency' ? 'Latence Minimale' : 'Budget Optimisé'}
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Qualité min. globale : {routingPolicy.globalMinQualityScore}/100</span>
          </div>
        </div>
      </div>

      {/* 2. Navigation des Sous-Onglets */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('providers')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'providers' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cpu size={15} className="text-blue-600" />
          Nœuds & Chaîne de Secours ({providers.length})
        </button>

        <button
          onClick={() => setActiveTab('governance')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'governance' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <SlidersHorizontal size={15} className="text-emerald-600" />
          Seuils de Qualité & Gouvernance
        </button>

        <button
          onClick={() => setActiveTab('testbench')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'testbench' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Play size={15} className="text-amber-600" />
          Banc d'Essai & Simulation Directe
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
            activeTab === 'logs' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/80' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 size={15} className="text-purple-600" />
          Journal des Bascules ({failoverLogs.length})
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────── */}
      {/* SOUS-ONGLET 1: FOURNISSEURS & CARTES DE CONTRÔLE */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'providers' && (
        <div className="space-y-4">
          {/* Barre de filtre et recherche */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                type="text"
                placeholder="Filtrer un modèle, fournisseur..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500 font-medium">
              Ordre de priorité calculé : <span className="font-bold text-slate-800">1 = Déclenchement Prioritaire</span>
            </div>
          </div>

          {/* Grille des fournisseurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProviders.map((provider, index) => {
              const testResult = testResults[provider.id];
              const isTesting = testingProviderId === provider.id;
              const serverProvider = serverProviders.find(item => item.provider === provider.provider);
              const isConfigured = serverProvider?.configured === true;

              return (
                <div 
                  key={provider.id}
                  className={`bg-white rounded-3xl border transition shadow-sm p-5 space-y-4 relative flex flex-col justify-between ${
                    provider.isDefault ? 'border-blue-600 ring-2 ring-blue-500/20' : 
                    !provider.isEnabled ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Badge de statut et priorité */}
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-mono font-bold text-xs text-slate-700">
                          #{provider.priority}
                        </span>
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                          provider.tier === 'primary' ? 'bg-blue-100 text-blue-700' :
                          provider.tier === 'secondary' ? 'bg-emerald-100 text-emerald-700' :
                          provider.tier === 'tertiary' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {provider.tier}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        {provider.isDefault && (
                          <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles size={10} />
                            Pilote
                          </span>
                        )}
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${isConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'}`}>
                          {isConfigured ? 'Configuré serveur' : 'Non configuré'}
                        </span>
                      </div>
                    </div>

                    {/* En-tête du fournisseur */}
                    <div className="flex items-center gap-3 mt-3">
                      <div className={`p-3 rounded-2xl flex-shrink-0 ${
                        provider.provider === 'gemini' ? 'bg-blue-50 text-blue-700' :
                        provider.provider === 'openai' ? 'bg-emerald-50 text-emerald-700' :
                        provider.provider === 'claude' ? 'bg-amber-50 text-amber-800' :
                        provider.provider === 'deepseek' ? 'bg-cyan-50 text-cyan-700' :
                        provider.provider === 'mistral' ? 'bg-orange-50 text-orange-700' :
                        provider.provider === 'grok' ? 'bg-red-50 text-red-700' :
                        provider.provider === 'ollama' ? 'bg-emerald-50 text-emerald-900' : 'bg-purple-50 text-purple-700'
                      }`}>
                        <BrainCircuit size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{provider.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                          <span className="text-[11px] font-mono text-slate-500 uppercase">{isConfigured ? 'configured' : 'not_configured'}</span>
                        </div>
                      </div>
                    </div>

                    {/* État serveur vérifié, sans télémétrie simulée */}
                    <div className="grid grid-cols-2 gap-2 mt-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Variable Netlify</span>
                        <span className="mt-1 block truncate font-mono text-[10px] font-bold text-slate-700">{serverProvider?.envVar || 'NON_DÉFINIE'}</span>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Télémétrie</span>
                        <span className="mt-1 block text-[11px] font-bold text-slate-600">Non disponible</span>
                      </div>
                    </div>

                    {/* Détails techniques */}
                    <div className="space-y-1.5 text-xs mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Modèle actif :</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                          {provider.defaultModel}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Coût estimé / 1k :</span>
                        <span className="font-mono text-slate-700 text-[11px]">
                          ${provider.costPer1kInputTokens || 0} in / ${provider.costPer1kOutputTokens || 0} out
                        </span>
                      </div>

                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between gap-3">
                        <span className="text-slate-500 text-[11px]">Secret :</span>
                        <span className="text-right text-[10px] font-bold text-slate-600">Géré exclusivement dans Netlify</span>
                      </div>
                    </div>

                    {/* Message de résultat du dernier test de sonde */}
                    {testResult && (
                      <div className={`p-2.5 rounded-xl text-xs font-medium mt-2 flex items-start gap-2 ${
                        testResult.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
                      }`}>
                        {testResult.success ? <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0 mt-0.5" /> : <XCircle size={14} className="text-red-600 flex-shrink-0 mt-0.5" />}
                        <span className="truncate">{testResult.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions rapides */}
                  <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 mt-4">
                    {/* Réordonnancement */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleReorder(provider.id, 'up')}
                        title="Augmenter la priorité"
                        disabled={index === 0}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs disabled:opacity-30"
                      >
                        <ArrowUp size={13} />
                      </button>
                      <button
                        onClick={() => handleReorder(provider.id, 'down')}
                        title="Diminuer la priorité"
                        disabled={index === filteredProviders.length - 1}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs disabled:opacity-30"
                      >
                        <ArrowDown size={13} />
                      </button>
                    </div>

                    {/* Actions de test, quarantaine et réglage */}
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleTestProvider(provider.id)}
                        disabled={isTesting || !isConfigured}
                        className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                        title="Tester la sonde de santé"
                      >
                        <Activity size={13} className={isTesting ? 'animate-spin' : ''} />
                      </button>

                      {provider.status === 'quarantined' ? (
                        <button
                          onClick={() => {
                            adminConfigService.restoreAIProvider(provider.id);
                            onReload();
                          }}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl text-xs font-bold transition"
                        >
                          Réadmettre
                        </button>
                      ) : (
                        !provider.isDefault && (
                          <button
                            onClick={() => {
                              adminConfigService.setDefaultAIProvider(provider.id);
                              onReload();
                            }}
                            className="px-2.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl text-xs font-bold transition"
                          >
                            Pilote
                          </button>
                        )
                      )}

                      <button
                        onClick={() => setEditingProvider({ ...provider })}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-sm"
                      >
                        <Sliders size={12} />
                        Ajuster
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SOUS-ONGLET 2: SEUILS DE QUALITÉ & GOUVERNANCE */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'governance' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="text-emerald-600" size={20} />
                Politique Globale de Résilience & Seuils d'Exclusion
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Définissez les règles strictes qui régissent la cascade de bascule automatique, les seuils de qualité minimaux et l'auto-quarantaine des fournisseurs défaillants.
              </p>
            </div>

            {/* 1. Sélection de la Stratégie de Routage */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Stratégie d'Orchestration & Bascule
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  {
                    id: 'auto_resilient_quality',
                    title: 'Auto-Résilience & Qualité d\'Élite',
                    desc: 'Pilote par défaut d\'abord, puis cascade automatique vers le fournisseur disponible ayant le score de qualité le plus élevé.',
                    badge: 'Recommandé'
                  },
                  {
                    id: 'strict_priority',
                    title: 'Priorité Stricte par Rangs',
                    desc: 'Cascade rigoureusement ordonnée selon les rangs configurés (#1 -> #2 -> #3) jusqu\'à obtention d\'une réponse saine.',
                    badge: 'Hiérarchique'
                  },
                  {
                    id: 'lowest_latency',
                    title: 'Vitesse & Latence Minimale',
                    desc: 'Achemine instantanément vers le fournisseur ayant la plus faible latence mesurée (idéal pour le streaming temps réel).',
                    badge: 'Ultra-Rapide'
                  },
                  {
                    id: 'lowest_cost',
                    title: 'Budget & Économie Maximale',
                    desc: 'Privilégie les modèles les plus compétitifs en coût de token tout en maintenant le seuil de conformité.',
                    badge: 'Éco-Responsable'
                  }
                ].map(strat => (
                  <div
                    key={strat.id}
                    onClick={() => handleSavePolicy({ strategy: strat.id as any })}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition flex flex-col justify-between ${
                      routingPolicy.strategy === strat.id 
                        ? 'border-blue-600 bg-blue-50/50 shadow-sm' 
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-xs font-black text-slate-900">{strat.title}</span>
                        <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                          {strat.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">{strat.desc}</p>
                    </div>
                    {routingPolicy.strategy === strat.id && (
                      <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 mt-3">
                        <CheckCircle2 size={14} /> Stratégie Sélectionnée
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Sliders de Seuils et Gouvernance */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
              {/* Seuil minimum de qualité */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    Seuil Minimum de Qualité Global ({routingPolicy.globalMinQualityScore}/100)
                  </label>
                  <span className="font-mono font-bold text-blue-600 text-xs">{routingPolicy.globalMinQualityScore}%</span>
                </div>
                <input
                  type="range"
                  min="40"
                  max="95"
                  step="5"
                  value={routingPolicy.globalMinQualityScore}
                  onChange={(e) => handleSavePolicy({ globalMinQualityScore: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-blue-600"
                />
                <p className="text-[11px] text-slate-500">
                  Tout fournisseur dont le score mesuré tombe sous ce seuil sera automatiquement exclu des requêtes.
                </p>
              </div>

              {/* Plafond de latence tolérée */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    Plafond de Latence Toléré ({routingPolicy.globalMaxLatencyMs} ms)
                  </label>
                  <span className="font-mono font-bold text-emerald-600 text-xs">{routingPolicy.globalMaxLatencyMs} ms</span>
                </div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={routingPolicy.globalMaxLatencyMs}
                  onChange={(e) => handleSavePolicy({ globalMaxLatencyMs: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-emerald-600"
                />
                <p className="text-[11px] text-slate-500">
                  Déclenche une bascule vers le secours suivant si le fournisseur met plus de temps à répondre.
                </p>
              </div>

              {/* Nombre d'erreurs avant auto-quarantaine */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    Échecs Consécutifs avant Quarantaine ({routingPolicy.maxConsecutiveErrorsBeforeQuarantine})
                  </label>
                  <span className="font-mono font-bold text-red-600 text-xs">{routingPolicy.maxConsecutiveErrorsBeforeQuarantine} échecs</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={routingPolicy.maxConsecutiveErrorsBeforeQuarantine}
                  onChange={(e) => handleSavePolicy({ maxConsecutiveErrorsBeforeQuarantine: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-red-600"
                />
                <p className="text-[11px] text-slate-500">
                  Isole immédiatement le fournisseur pour préserver l'expérience utilisateur et les crédits.
                </p>
              </div>

              {/* Intervalle de réévaluation (failback) */}
              <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-800">
                    Intervalle de Réadmission Automatique ({routingPolicy.autoFailbackIntervalSec}s)
                  </label>
                  <span className="font-mono font-bold text-purple-600 text-xs">{routingPolicy.autoFailbackIntervalSec} secondes</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="300"
                  step="15"
                  value={routingPolicy.autoFailbackIntervalSec}
                  onChange={(e) => handleSavePolicy({ autoFailbackIntervalSec: parseInt(e.target.value) })}
                  className="w-full cursor-pointer accent-purple-600"
                />
                <p className="text-[11px] text-slate-500">
                  Teste automatiquement la guérison du moteur principal pour y restaurer le trafic sans intervention humaine.
                </p>
              </div>
            </div>

            {/* Toggles d'activation */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-slate-100">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={routingPolicy.autoQuarantineEnabled}
                  onChange={(e) => handleSavePolicy({ autoQuarantineEnabled: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                Mise en Quarantaine Automatique Active
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                <input
                  type="checkbox"
                  checked={routingPolicy.enableBudgetThresholdRouting}
                  onChange={(e) => handleSavePolicy({ enableBudgetThresholdRouting: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                />
                Plafond de Coût / Requête Activé ($0.10 max)
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SOUS-ONGLET 3: BANC D'ESSAI & SIMULATION DIRECTE */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'testbench' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Play className="text-amber-600" size={20} />
                Banc d'Essai Interactif & Test de Résilience en Direct
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Soumettez une invite de test pour observer en temps réel la sélection du fournisseur, la latence de traitement et le déclenchement éventuel de la bascule de secours.
              </p>
            </div>

            {/* Sélecteurs de presets */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-slate-400 font-bold self-center mr-1">Exemples :</span>
              {[
                "Analyse juridique de contrat export avec clause séquestre",
                "Calcul de rentabilité B2B conteneur 40 pieds Abidjan-Anvers",
                "Synthèse des compétences candidat pour poste Directeur Logistique",
                "Simulation d'incident et bascule forcée"
              ].map(promptSample => (
                <button
                  key={promptSample}
                  onClick={() => setTestBenchPrompt(promptSample)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition"
                >
                  {promptSample}
                </button>
              ))}
            </div>

            {/* Zone de texte de l'invite */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Invite de test (Prompt)</label>
              <textarea
                rows={3}
                value={testBenchPrompt}
                onChange={(e) => setTestBenchPrompt(e.target.value)}
                placeholder="Entrez votre instruction de test..."
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Fournisseur ciblé */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700">Fournisseur visé :</label>
                <select
                  value={testBenchProviderId}
                  onChange={(e) => setTestBenchProviderId(e.target.value)}
                  className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="auto">Auto-Routage Résilient (Cascade Complète)</option>
                  {providers.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.defaultModel})</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleRunTestBench}
                disabled={testBenchIsRunning || !testBenchPrompt.trim()}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                <Play size={14} className={testBenchIsRunning ? 'animate-spin' : ''} />
                {testBenchIsRunning ? 'Exécution en cours...' : 'Lancer le Test de Sonde'}
              </button>
            </div>

            {/* Affichage du résultat */}
            {testBenchResult && (
              <div className="mt-5 p-5 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3 animate-fade-in">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} />
                      Exécution Réussie
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Moteur utilisé : <strong className="text-white">{testBenchResult.providerUsed.name}</strong> ({testBenchResult.modelUsed})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono">
                    <span className="text-blue-400">Latence : <strong>{testBenchResult.latencyMs}ms</strong></span>
                    {testBenchResult.wasFailover && (
                      <span className="text-amber-400 font-bold bg-amber-500/20 px-2 py-0.5 rounded">
                        Bascule Activée ({testBenchResult.failoverAttemptsCount} essais)
                      </span>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Réponse Inférencée :</span>
                  <div className="p-3 bg-slate-950 rounded-xl text-xs font-mono text-slate-200 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed border border-slate-800">
                    {testBenchResult.text}
                  </div>
                </div>
              </div>
            )}

            {testBenchError && (
              <div className="mt-4 p-4 bg-red-50 text-red-900 rounded-2xl border border-red-200 flex items-start gap-3">
                <AlertTriangle size={18} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-xs">Échec du banc d'essai</h5>
                  <p className="text-xs text-red-700 mt-0.5">{testBenchError}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* SOUS-ONGLET 4: JOURNAL DES BASCULES (AUDIT LOGS) */}
      {/* ────────────────────────────────────────────────────────── */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <BarChart3 className="text-purple-600" size={20} />
                  Journal d'Audit des Bascules de Secours
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Historique horodaté des incidents réseau, dépassements de latence et déclenchements de la cascade de résilience.
                </p>
              </div>

              {failoverLogs.length > 0 && (
                <button
                  onClick={() => {
                    aiRoutingService.clearFailoverLogs();
                    setFailoverLogs([]);
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Trash2 size={13} />
                  Effacer les Journaux
                </button>
              )}
            </div>

            {failoverLogs.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                <CheckCircle2 size={32} className="text-emerald-500 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Aucun incident de bascule enregistré</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Tous les appels sont acheminés directement sans rupture de service.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 overflow-hidden">
                {failoverLogs.map((log) => (
                  <div key={log.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] text-slate-400">{log.timestamp.replace('T', ' ').substring(0, 19)}</span>
                        <span className="px-2 py-0.5 rounded-md font-bold uppercase text-[10px] bg-amber-100 text-amber-800">
                          {log.reason}
                        </span>
                        <span className="font-bold text-slate-800">
                          {log.requestedProviderName} ➔ <strong className="text-blue-600">{log.fallbackProviderName}</strong>
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{log.details}</p>
                    </div>

                    <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
                      <span>{log.latencyMs}ms</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${log.success ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                        {log.success ? 'RÉTABLI' : 'CASCADE_CONTINUE'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: AJUSTER UN FOURNISSEUR EXISTANT */}
      {/* ────────────────────────────────────────────────────────── */}
      {editingProvider && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Sliders className="text-blue-600" size={18} />
                  Configuration : {editingProvider.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Préférences publiques d'inférence. Les secrets restent exclusivement côté serveur.</p>
              </div>
              <button onClick={() => setEditingProvider(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className={`rounded-xl border p-3 ${editingServerProvider?.configured ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                <p className="font-bold text-slate-800">Secret serveur : {editingServerProvider?.configured ? 'configuré' : 'non configuré'}</p>
                <p className="mt-1 text-[11px] text-slate-600">Variable attendue : <span className="font-mono font-bold">{editingServerProvider?.envVar || 'Aucune variable serveur déclarée'}</span>. Modifiez-la dans Netlify, jamais dans ce navigateur.</p>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Modèle par Défaut</label>
                <input
                  type="text"
                  value={editingProvider.defaultModel}
                  onChange={(e) => setEditingProvider({ ...editingProvider, defaultModel: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Température ({editingProvider.temperature})</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={editingProvider.temperature}
                    onChange={(e) => setEditingProvider({ ...editingProvider, temperature: parseFloat(e.target.value) })}
                    className="w-full cursor-pointer accent-blue-600"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Max Tokens</label>
                  <input
                    type="number"
                    value={editingProvider.maxTokens}
                    onChange={(e) => setEditingProvider({ ...editingProvider, maxTokens: parseInt(e.target.value) || 2048 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rang de Priorité</label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={editingProvider.priority}
                    onChange={(e) => setEditingProvider({ ...editingProvider, priority: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Niveau / Tier</label>
                  <select
                    value={editingProvider.tier}
                    onChange={(e) => setEditingProvider({ ...editingProvider, tier: e.target.value as any })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="primary">Primaire</option>
                    <option value="secondary">Secondaire</option>
                    <option value="tertiary">Tertiaire</option>
                    <option value="fallback">Secours</option>
                    <option value="quarantined">Quarantaine</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-2">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingProvider.isEnabled}
                    onChange={(e) => setEditingProvider({ ...editingProvider, isEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  Fournisseur Activé
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={editingProvider.isDefault}
                    onChange={(e) => setEditingProvider({ ...editingProvider, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 accent-blue-600"
                  />
                  Définir comme Pilote Principal
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setEditingProvider(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  adminConfigService.updateAIProvider(editingProvider.id, editingProvider);
                  setEditingProvider(null);
                  onReload();
                }}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Check size={14} />
                Enregistrer la Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────── */}
      {/* MODAL: CONNECTER UN NOUVEAU FOURNISSEUR */}
      {/* ────────────────────────────────────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Plus className="text-emerald-600" size={18} />
                  Ajouter un fournisseur au catalogue public
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Cette fiche ne stocke qu’un nom, des modèles et une politique. Le secret doit être ajouté dans Netlify.</p>
              </div>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nom d'affichage</label>
                  <input
                    type="text"
                    placeholder="Ex: Mistral Large Souverain"
                    value={newProviderForm.name}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, name: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Protocole / Famille</label>
                  <select
                    value={newProviderForm.provider}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, provider: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="gemini">Google Gemini</option>
                    <option value="openai">OpenAI (GPT-4o, o3)</option>
                    <option value="claude">Anthropic Claude</option>
                    <option value="deepseek">DeepSeek (V3, R1)</option>
                    <option value="mistral">Mistral AI</option>
                    <option value="grok">xAI Grok</option>
                    <option value="qwen">Alibaba Qwen</option>
                    <option value="kimi">Moonshot Kimi</option>
                    <option value="openrouter">OpenRouter Gateway</option>
                    <option value="huggingface">Hugging Face Serverless</option>
                    <option value="replicate">Replicate Cloud</option>
                    <option value="ollama">Ollama Local (Souverain)</option>
                    <option value="custom">Autre / Endpoint Custom</option>
                  </select>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-[11px] text-blue-900">
                <strong>Aucun secret n’est demandé ici.</strong> Après ajout, configurez la variable indiquée dans Netlify → Site configuration → Environment variables.
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modèle par Défaut</label>
                  <input
                    type="text"
                    placeholder="gpt-4o / mistral-large / deepseek-chat"
                    value={newProviderForm.defaultModel}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, defaultModel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modèles disponibles (séparés par virgule)</label>
                  <input
                    type="text"
                    placeholder="model-1, model-2"
                    value={newProviderForm.availableModels}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, availableModels: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rang dans la chaîne</label>
                  <input
                    type="number"
                    min="1"
                    value={newProviderForm.priority}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, priority: parseInt(e.target.value) || 1 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                onClick={handleCreateNewProvider}
                disabled={!newProviderForm.name.trim() || !newProviderForm.defaultModel.trim()}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2 disabled:opacity-50"
              >
                <Check size={14} />
                Ajouter la préférence publique
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
