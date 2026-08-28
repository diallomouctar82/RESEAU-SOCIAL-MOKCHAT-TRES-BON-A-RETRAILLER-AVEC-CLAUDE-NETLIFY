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
  Key, 
  Eye, 
  EyeOff, 
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
  ListOrdered,
  ExternalLink,
  FileText,
  CreditCard,
  Copy,
  CheckCheck,
  Tag,
  ToggleLeft,
  ToggleRight,
  Volume2,
  Video,
  Workflow,
  Code,
  Scale,
  Terminal,
  UserPlus
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
import { aiRoutingService } from '../../services/aiRoutingService';
import { AI_PORTAL_LINKS } from '../../services/unifiedAIConnector';
import { AIConnectorsHubModal } from '../AIConnectorsHubModal';

interface AdminAIResilienceHubProps {
  providers: AIProviderConfig[];
  onReload: () => void;
}

export const AdminAIResilienceHub: React.FC<AdminAIResilienceHubProps> = ({
  providers,
  onReload
}) => {
  const [activeTab, setActiveTab] = useState<'providers' | 'governance' | 'testbench' | 'logs'>('providers');
  const [routingPolicy, setRoutingPolicy] = useState<AIRoutingPolicyConfig>(aiRoutingService.getPolicy());
  const [failoverLogs, setFailoverLogs] = useState<AIFailoverEvent[]>(aiRoutingService.getFailoverLogs());
  const [startupReport, setStartupReport] = useState(aiRoutingService.getStartupDiagnosticReport());
  const [editingProvider, setEditingProvider] = useState<AIProviderConfig | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showConnectorsHub, setShowConnectorsHub] = useState(false);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string; qualityScore?: number }>>({});
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [diagnosticSummary, setDiagnosticSummary] = useState<any | null>(null);
  const [searchFilter, setSearchFilter] = useState('');
  const [taskSpecialtyFilter, setTaskSpecialtyFilter] = useState<string>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

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
    apiKey: string;
    defaultModel: string;
    availableModels: string;
    temperature: number;
    maxTokens: number;
    endpointUrl: string;
    priority: number;
    tier: AIProviderTier;
    qualityScore: number;
    minQualityThreshold: number;
    maxLatencyThresholdMs: number;
    costPer1kInputTokens: number;
    costPer1kOutputTokens: number;
  }>({
    name: '',
    provider: 'openai',
    apiKey: '',
    defaultModel: 'gpt-4o',
    availableModels: 'gpt-4o, gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 4096,
    endpointUrl: '',
    priority: providers.length + 1,
    tier: 'tertiary',
    qualityScore: 90,
    minQualityThreshold: 65,
    maxLatencyThresholdMs: 2500,
    costPer1kInputTokens: 0.002,
    costPer1kOutputTokens: 0.008
  });

  useEffect(() => {
    setRoutingPolicy(aiRoutingService.getPolicy());
    setFailoverLogs(aiRoutingService.getFailoverLogs());
    setStartupReport(aiRoutingService.getStartupDiagnosticReport());
  }, [providers]);

  const handleToggleShowKey = (id: string) => {
    setShowKey(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleEnabled = (id: string, currentVal: boolean) => {
    adminConfigService.updateAIProvider(id, { isEnabled: !currentVal });
    onReload();
  };

  const handleCopyEnv = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleTestProvider = async (id: string) => {
    setTestingProviderId(id);
    try {
      const res = await aiRoutingService.testProviderHealth(id);
      setTestResults(prev => ({ ...prev, [id]: res }));
      setStartupReport(aiRoutingService.getStartupDiagnosticReport());
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

  const handleRunFullDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    try {
      const rep = await aiRoutingService.probeAllProvidersOnStartup();
      setStartupReport(rep);
      const res = await aiRoutingService.runFullResilienceDiagnostic();
      setDiagnosticSummary(res);
      setTestResults(res.results);
      onReload();
    } catch (err) {
      console.error("Diagnostic error:", err);
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const handleSimulateFailover = async () => {
    setSimulationStatus("⚡ Simulation de rupture de clé en cours sur le moteur principal...");
    setTestBenchIsRunning(true);
    try {
      // Simuler une requête où le premier provider échoue volontairement
      const result = await aiRoutingService.executeWithResilience({
        prompt: "Simulation test de bascule d'urgence : validation de la continuité de service sans écran blanc.",
        preferredProviderId: 'prov-kling' // Fournisseur vidéo/complexe pour forcer la bascule
      });
      setTestBenchResult(result);
      setFailoverLogs(aiRoutingService.getFailoverLogs());
      setSimulationStatus(`✅ Bascule réussie en ${result.latencyMs}ms vers ${result.providerUsed.name} (Zéro interruption utilisateur).`);
      setTimeout(() => setSimulationStatus(null), 6000);
    } catch (e: any) {
      setSimulationStatus(`❌ Échec de la simulation : ${e.message}`);
    } finally {
      setTestBenchIsRunning(false);
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
      apiKey: newProviderForm.apiKey,
      defaultModel: newProviderForm.defaultModel,
      availableModels: modelsArr.length > 0 ? modelsArr : [newProviderForm.defaultModel],
      temperature: newProviderForm.temperature,
      maxTokens: newProviderForm.maxTokens,
      endpointUrl: newProviderForm.endpointUrl || undefined,
      status: 'online',
      qualityScore: newProviderForm.qualityScore,
      minQualityThreshold: newProviderForm.minQualityThreshold,
      maxLatencyThresholdMs: newProviderForm.maxLatencyThresholdMs,
      costPer1kInputTokens: newProviderForm.costPer1kInputTokens,
      costPer1kOutputTokens: newProviderForm.costPer1kOutputTokens
    });

    setShowNewModal(false);
    onReload();
  };

  const filteredProviders = providers.filter(p => {
    const term = searchFilter.toLowerCase();
    const matchesSearch = 
      !term ||
      p.name.toLowerCase().includes(term) ||
      p.provider.toLowerCase().includes(term) ||
      p.defaultModel.toLowerCase().includes(term) ||
      (p.detectedEnvVar && p.detectedEnvVar.toLowerCase().includes(term)) ||
      (p.taskSpecialty && p.taskSpecialty.toLowerCase().includes(term));

    const matchesSpecialty = taskSpecialtyFilter === 'all' || p.taskSpecialty === taskSpecialtyFilter;
    return matchesSearch && matchesSpecialty;
  }).sort((a, b) => a.priority - b.priority);

  const activeCount = providers.filter(p => p.isEnabled && p.status !== 'quarantined').length;
  const quarantinedCount = providers.filter(p => p.status === 'quarantined').length;
  const defaultProvider = providers.find(p => p.isDefault) || providers[0];

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
                Orchestrateur Souverain & Auto-Résilience
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                Bascule Zéro-Interruption Active
              </span>
            </div>
            <h1 className="text-2xl font-black text-white mt-2 tracking-tight">
              Gestionnaire Central Multi-Fournisseurs d'IA
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl mt-1 leading-relaxed">
              Supervision unifiée de Gemini, OpenAI, Claude, DeepSeek, Mistral, Grok, Qwen, Kimi, OpenRouter, Replicate, Hugging Face et nœuds souverains locaux avec cascade automatique en cas d'indisponibilité.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowConnectorsHub(true)}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-amber-500/30"
            >
              <Zap size={15} />
              Hub Connecteurs (DeepSeek, Claude, Kling, n8n...)
            </button>

            <button
              onClick={handleRunFullDiagnostic}
              disabled={isDiagnosticRunning}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
            >
              <Activity size={15} className={isDiagnosticRunning ? 'animate-spin' : ''} />
              {isDiagnosticRunning ? 'Test de Sonde Global...' : 'Sonde Globale de Résilience'}
            </button>

            <button
              onClick={() => setShowNewModal(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-lg shadow-emerald-600/30"
            >
              <Plus size={15} />
              Connecter un Fournisseur
            </button>
          </div>
        </div>

        {/* Métriques clés en bandeau */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Moteur Pilote Actif</span>
            <div className="text-sm font-black text-white mt-1 truncate flex items-center gap-1.5">
              <Sparkles size={14} className="text-blue-400 flex-shrink-0" />
              {defaultProvider ? defaultProvider.name : 'Aucun'}
            </div>
            <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">{defaultProvider?.defaultModel}</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Nœuds Connectés</span>
            <div className="text-xl font-black text-emerald-400 mt-1">
              {activeCount} <span className="text-xs text-slate-400 font-normal">/ {providers.length} opérationnels</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">{providers.filter(p => p.isEnabled).length} actifs dans la chaîne</span>
          </div>

          <div className="bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/60">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Quarantaine Sécurisée</span>
            <div className="text-xl font-black text-amber-400 mt-1">
              {quarantinedCount} <span className="text-xs text-slate-400 font-normal">fournisseur(s) exclus</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-0.5 block">Seuil échecs : {routingPolicy.maxConsecutiveErrorsBeforeQuarantine} consécutifs</span>
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

      {/* Résumé du dernier diagnostic global ou rapport de démarrage */}
      {startupReport && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-3xl border border-slate-700 shadow-md space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-2xl">
                <ShieldCheck size={24} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-black text-white text-sm">Diagnostic de Démarrage & Statut Résilience</h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {startupReport.onlineCount} Connecteur(s) Prêt(s)
                  </span>
                  {startupReport.missingKeysCount > 0 && (
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {startupReport.missingKeysCount} Clé(s) en attente (Auto-secours activé)
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                  {startupReport.statusMessage}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button 
                onClick={handleRunFullDiagnostic}
                disabled={isDiagnosticRunning}
                className="text-xs font-bold text-white px-3.5 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 disabled:opacity-50"
              >
                <Activity size={14} className={isDiagnosticRunning ? 'animate-spin' : ''} />
                {isDiagnosticRunning ? 'Test en cours...' : 'Re-tester tous les connecteurs'}
              </button>
            </div>
          </div>

          {/* Cascade active ordonnée */}
          {startupReport.failoverChainSummary && startupReport.failoverChainSummary.length > 0 && (
            <div className="pt-3 border-t border-slate-700/60 flex items-center gap-2 overflow-x-auto text-xs pb-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                <ArrowRightLeft size={13} className="text-blue-400" /> Ordre de bascule actif :
              </span>
              {startupReport.failoverChainSummary.slice(0, 6).map((item, idx) => (
                <div 
                  key={item.id}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap flex items-center gap-1.5 ${
                    idx === 0 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : item.status === 'online' 
                        ? 'bg-slate-800 text-emerald-300 border border-emerald-500/30' 
                        : 'bg-slate-800/60 text-slate-400 border border-slate-700'
                  }`}
                >
                  <span className="opacity-70 font-mono">#{idx + 1}</span>
                  <span>{item.name}</span>
                  {idx === 0 && <span className="bg-blue-400/30 text-white text-[9px] px-1 rounded">Pilote</span>}
                </div>
              ))}
              <div className="px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap bg-emerald-950/80 text-emerald-400 border border-emerald-600/40">
                🛡️ Repli Souverain Local
              </div>
            </div>
          )}
        </div>
      )}

      {/* Alerte & Recommandations pour les clés d'API manquantes */}
      {startupReport && startupReport.missingKeyProviders.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-5 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="text-amber-500 flex-shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {startupReport.missingKeyProviders.length} Connecteur(s) en mode Dégradé Toléré (Clés d'environnement facultatives)
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  L'application continue de fonctionner sans interruption grâce aux moteurs disponibles et au repli souverain. Pour débloquer ces moteurs spécialisés (vidéo Kling, voix ElevenLabs, DeepSeek, etc.), ajoutez les variables suivantes dans votre fichier <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> :
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
            {startupReport.missingKeyProviders.slice(0, 6).map((missing) => (
              <div key={missing.id} className="bg-white p-3 rounded-2xl border border-amber-200/80 shadow-xs flex flex-col justify-between gap-2">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <span className="font-bold text-slate-900 text-xs block">{missing.name}</span>
                    <span className="font-mono text-[11px] text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded mt-1 inline-block">
                      {missing.envKey}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCopyEnv(`${missing.envKey}=`)}
                    className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    title="Copier le nom de la variable"
                  >
                    {copiedKey === `${missing.envKey}=` ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                  </button>
                </div>
                {missing.portalUrl && missing.portalUrl !== 'https://lemondeavous.com' && (
                  <a
                    href={missing.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 mt-1"
                  >
                    Obtenir la clé <ExternalLink size={10} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Résumé du dernier diagnostic global */}
      {diagnosticSummary && (
        <div className="bg-white p-5 rounded-3xl border border-blue-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-700 rounded-2xl">
              <Activity size={24} />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Rapport de Sonde Multi-Moteurs Exécuté</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {diagnosticSummary.onlineCount} moteurs en ligne sur {diagnosticSummary.totalProviders} testés. Latence moyenne : <span className="font-bold text-blue-600 font-mono">{diagnosticSummary.averageLatencyMs}ms</span>.
              </p>
            </div>
          </div>
          <button 
            onClick={() => setDiagnosticSummary(null)} 
            className="text-xs font-bold text-slate-400 hover:text-slate-700 px-3 py-1.5 bg-slate-100 rounded-xl"
          >
            Fermer le rapport
          </button>
        </div>
      )}

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
          {/* Barre de recherche et filtre par spécialité de tâche */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                <input
                  type="text"
                  placeholder="Filtrer un modèle, fournisseur, variable..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Cascade ordonnée par rang : <span className="font-bold text-slate-800">#1 = Déclenchement Prioritaire</span>
              </div>
            </div>

            {/* Chips de filtres par spécialité */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider mr-1 flex items-center gap-1">
                <Filter size={12} /> Spécialité :
              </span>
              {[
                { id: 'all', label: 'Tous les Connecteurs' },
                { id: 'reasoning', label: 'Raisonnement & LLM' },
                { id: 'legal_contract', label: 'Juridique & Contrats' },
                { id: 'coding', label: 'Code & Architecture' },
                { id: 'multilingual', label: 'Multilingue Global' },
                { id: 'video_generation', label: 'Vidéo & Cinéma' },
                { id: 'voice_speech', label: 'Voix & Speech' },
                { id: 'workflow_automation', label: 'Workflows & n8n' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setTaskSpecialtyFilter(cat.id)}
                  className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition text-xs ${
                    taskSpecialtyFilter === cat.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grille des fournisseurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredProviders.map((provider, index) => {
              const testResult = testResults[provider.id];
              const isTesting = testingProviderId === provider.id;
              const portal = provider.portalLinks || (AI_PORTAL_LINKS as any)[provider.provider];

              return (
                <div 
                  key={provider.id}
                  className={`bg-white rounded-3xl border transition shadow-sm p-5 space-y-4 relative flex flex-col justify-between ${
                    provider.isDefault ? 'border-blue-600 ring-2 ring-blue-500/20' : 
                    provider.status === 'quarantined' ? 'border-red-300 bg-red-50/20' :
                    !provider.isEnabled ? 'border-slate-200 opacity-60 bg-slate-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div>
                    {/* Badge de statut, priorité et interrupteur ON/OFF */}
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
                        {provider.taskSpecialty && (
                          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[110px]">
                            {provider.taskSpecialty}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Toggle On/Off */}
                        <button
                          onClick={() => handleToggleEnabled(provider.id, provider.isEnabled)}
                          title={provider.isEnabled ? 'Désactiver le fournisseur' : 'Activer le fournisseur'}
                          className={`p-1 rounded-xl transition ${
                            provider.isEnabled ? 'text-emerald-600 hover:text-emerald-700' : 'text-slate-400 hover:text-slate-600'
                          }`}
                        >
                          {provider.isEnabled ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                        </button>

                        {provider.isDefault && (
                          <span className="bg-blue-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <Sparkles size={10} />
                            Pilote
                          </span>
                        )}
                        {provider.status === 'quarantined' && (
                          <span className="bg-red-600 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                            <ShieldAlert size={10} />
                            Quarantaine
                          </span>
                        )}
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
                        provider.provider === 'qwen' ? 'bg-indigo-50 text-indigo-700' :
                        provider.provider === 'kimi' ? 'bg-sky-50 text-sky-700' :
                        provider.provider === 'kling' ? 'bg-purple-50 text-purple-700' :
                        provider.provider === 'elevenlabs' ? 'bg-teal-50 text-teal-700' :
                        provider.provider === 'heygen' ? 'bg-violet-50 text-violet-700' :
                        provider.provider === 'runway' ? 'bg-pink-50 text-pink-700' :
                        provider.provider === 'openrouter' ? 'bg-blue-50 text-blue-800' :
                        provider.provider === 'n8n' ? 'bg-rose-50 text-rose-700' :
                        provider.provider === 'grok' ? 'bg-red-50 text-red-700' :
                        provider.provider === 'ollama' ? 'bg-emerald-50 text-emerald-900' : 'bg-purple-50 text-purple-700'
                      }`}>
                        <BrainCircuit size={22} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-slate-900 text-sm truncate">{provider.name}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${
                            provider.status === 'online' ? 'bg-emerald-500' :
                            provider.status === 'degraded' ? 'bg-amber-400' :
                            provider.status === 'quarantined' ? 'bg-red-500' : 'bg-slate-400'
                          }`}></span>
                          <span className="text-[11px] font-mono text-slate-500 uppercase">{provider.status}</span>
                          {provider.latencyMs && (
                            <span className="text-[10px] font-mono font-bold text-slate-400">({provider.latencyMs}ms)</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Détection de variable d'environnement */}
                    {provider.detectedEnvVar && (
                      <div className="mt-2.5 flex items-center justify-between bg-slate-50 border border-slate-200/80 px-2.5 py-1.5 rounded-xl text-[11px]">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${provider.isEnvKeyPresent ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span className="font-mono text-slate-700 font-bold truncate">{provider.detectedEnvVar}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                            provider.isEnvKeyPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {provider.isEnvKeyPresent ? 'Détectée' : 'Manquante'}
                          </span>
                          <button
                            onClick={() => handleCopyEnv(`${provider.detectedEnvVar}=`)}
                            title="Copier le nom de la variable"
                            className="text-slate-400 hover:text-slate-700 p-0.5"
                          >
                            {copiedKey === `${provider.detectedEnvVar}=` ? (
                              <CheckCheck size={12} className="text-emerald-600" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Boutons d'accès direct 1-clic aux portails officiels */}
                    {portal && (
                      <div className="mt-3 grid grid-cols-4 gap-1 pt-2 border-t border-slate-100">
                        {portal.signupUrl && (
                          <a
                            href={portal.signupUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold text-center truncate flex items-center justify-center gap-0.5"
                            title="Créer un compte officiel"
                          >
                            <UserPlus size={10} /> Compte
                          </a>
                        )}
                        {portal.apiKeyUrl && (
                          <a
                            href={portal.apiKeyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-[10px] font-bold text-center truncate flex items-center justify-center gap-0.5"
                            title="Générer une clé API"
                          >
                            <Key size={10} /> Clé API
                          </a>
                        )}
                        {portal.docsUrl && (
                          <a
                            href={portal.docsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold text-center truncate flex items-center justify-center gap-0.5"
                            title="Documentation technique"
                          >
                            <FileText size={10} /> Doc
                          </a>
                        )}
                        {portal.billingUrl && (
                          <a
                            href={portal.billingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-1.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold text-center truncate flex items-center justify-center gap-0.5"
                            title="Quotas & Facturation"
                          >
                            <CreditCard size={10} /> Quotas
                          </a>
                        )}
                      </div>
                    )}

                    {/* Métriques de qualité et taux de succès */}
                    <div className="grid grid-cols-2 gap-2 mt-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-100 text-xs">
                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Score Qualité</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                provider.qualityScore >= 90 ? 'bg-emerald-500' :
                                provider.qualityScore >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                              }`}
                              style={{ width: `${provider.qualityScore}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-slate-800 text-[11px]">{provider.qualityScore}%</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 text-[10px] uppercase font-bold block">Taux de Succès</span>
                        <div className="font-mono font-bold text-slate-800 text-[11px] mt-0.5">
                          {provider.totalCalls > 0 
                            ? `${Math.round((provider.successCalls / provider.totalCalls) * 100)}%` 
                            : '100%'}
                          <span className="text-[10px] text-slate-400 font-normal ml-1">({provider.successCalls}/{provider.totalCalls})</span>
                        </div>
                      </div>
                    </div>

                    {/* Détails techniques & Quotas */}
                    <div className="space-y-1.5 text-xs mt-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Modèle actif :</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[150px]">
                          {provider.defaultModel}
                        </span>
                      </div>

                      <div className="flex justify-between items-center">
                        <span className="text-slate-500 text-[11px]">Coût estimé / 1k :</span>
                        <span className="font-mono text-slate-700 text-[11px]">
                          ${provider.costPer1kInputTokens || 0} in / ${provider.costPer1kOutputTokens || 0} out
                        </span>
                      </div>

                      {provider.dailyQuotaLimitUSD && provider.dailyQuotaLimitUSD > 0 ? (
                        <div className="flex justify-between items-center">
                          <span className="text-slate-500 text-[11px]">Quota / jour :</span>
                          <span className="font-mono font-bold text-slate-700 text-[11px]">
                            ${provider.currentDailySpendUSD || 0} / ${provider.dailyQuotaLimitUSD} USD
                          </span>
                        </div>
                      ) : null}

                      <div className="pt-1.5 border-t border-slate-200/60 flex items-center justify-between">
                        <span className="text-slate-500 text-[11px] flex items-center gap-1">
                          <Key size={11} /> Clé :
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[11px]">
                          <span className="text-slate-600">
                            {showKey[provider.id] ? (provider.apiKey || 'Aucune') : '••••••••••••••••'}
                          </span>
                          <button 
                            onClick={() => handleToggleShowKey(provider.id)} 
                            className="text-slate-400 hover:text-slate-700 ml-1"
                          >
                            {showKey[provider.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                          </button>
                        </div>
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
                        disabled={isTesting}
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

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={handleSimulateFailover}
                  disabled={testBenchIsRunning}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-2xl text-xs font-black shadow-md shadow-amber-500/20 flex items-center gap-2 disabled:opacity-50 transition"
                  title="Simule une clé manquante ou indisponible pour vérifier l'auto-bascule instantanée"
                >
                  <Zap size={14} className="text-slate-950" />
                  Simuler une Rupture de Clé & Auto-Bascule
                </button>

                <button
                  onClick={handleRunTestBench}
                  disabled={testBenchIsRunning || !testBenchPrompt.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <Play size={14} className={testBenchIsRunning ? 'animate-spin' : ''} />
                  {testBenchIsRunning ? 'Exécution en cours...' : 'Lancer le Test de Sonde'}
                </button>
              </div>
            </div>

            {simulationStatus && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-bold text-amber-900 animate-fade-in flex items-center gap-2">
                <Activity size={15} className="text-amber-600 animate-spin" />
                {simulationStatus}
              </div>
            )}

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
                <p className="text-xs text-slate-500 mt-0.5">Paramètres d'inférence, clé API et seuils de qualité</p>
              </div>
              <button onClick={() => setEditingProvider(null)} className="text-slate-400 hover:text-slate-700">
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs max-h-[70vh] overflow-y-auto pr-1">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Clé API Principale (Secret Token / API Key)</label>
                <input
                  type="text"
                  placeholder="Ex: sk-..., nvapi-..., claude-..."
                  value={editingProvider.apiKey}
                  onChange={(e) => setEditingProvider({ ...editingProvider, apiKey: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
                {editingProvider.detectedEnvVar && (
                  <span className="text-[10px] text-slate-500 mt-1 block font-mono">
                    Variable d'environnement associée : <strong className="text-slate-800">{editingProvider.detectedEnvVar}</strong>
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Clé Secrète / Jeton Secondaire (Optionnel)</label>
                  <input
                    type="text"
                    placeholder="Jeton secret additionnel"
                    value={editingProvider.apiSecret || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, apiSecret: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">URL Webhook / Déclencheur Automatisé</label>
                  <input
                    type="text"
                    placeholder="https://n8n.votredomaine.com/webhook/..."
                    value={editingProvider.webhookUrl || ''}
                    onChange={(e) => setEditingProvider({ ...editingProvider, webhookUrl: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Modèle par Défaut</label>
                  <input
                    type="text"
                    value={editingProvider.defaultModel}
                    onChange={(e) => setEditingProvider({ ...editingProvider, defaultModel: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Spécialité Principale de Tâche</label>
                  <select
                    value={editingProvider.taskSpecialty || 'General Reasoning'}
                    onChange={(e) => setEditingProvider({ ...editingProvider, taskSpecialty: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 outline-none"
                  >
                    <option value="General Reasoning">Raisonnement Général & LLM</option>
                    <option value="Legal & Contracting">Juridique & Analyse de Contrats</option>
                    <option value="Coding & Architecture">Code & Programmation</option>
                    <option value="Multilingual & Translation">Multilingue & Traduction</option>
                    <option value="Voice & Speech Synthesis">Voix & Synthèse Vocale</option>
                    <option value="Video Generation">Génération Vidéo Cinématique</option>
                    <option value="Avatar Video">Génération d'Avatars & Présentateurs</option>
                    <option value="Workflow Automation">Automatisation & Workflows n8n</option>
                  </select>
                </div>
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
                  <label className="block font-bold text-slate-700 mb-1">Plafond Quota Quotidien ($ USD)</label>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    placeholder="0 = Illimité"
                    value={editingProvider.dailyQuotaLimitUSD || 0}
                    onChange={(e) => setEditingProvider({ ...editingProvider, dailyQuotaLimitUSD: parseFloat(e.target.value) || 0 })}
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

              {/* Accès Directs Développeur pour ce Connecteur */}
              {(editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) && (
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                    Portails Officiels & Quotas Directs
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                    {((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).signupUrl && (
                      <a
                        href={((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).signupUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-center font-bold text-slate-800 text-[11px] flex flex-col items-center gap-1 shadow-xs"
                      >
                        <UserPlus size={14} className="text-blue-600" />
                        Créer Compte
                      </a>
                    )}
                    {((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).apiKeyUrl && (
                      <a
                        href={((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).apiKeyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white hover:bg-blue-50 border border-blue-200 rounded-xl text-center font-bold text-blue-800 text-[11px] flex flex-col items-center gap-1 shadow-xs"
                      >
                        <Key size={14} className="text-blue-600" />
                        Générer Clé
                      </a>
                    )}
                    {((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).docsUrl && (
                      <a
                        href={((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-center font-bold text-slate-800 text-[11px] flex flex-col items-center gap-1 shadow-xs"
                      >
                        <FileText size={14} className="text-emerald-600" />
                        Documentation
                      </a>
                    )}
                    {((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).billingUrl && (
                      <a
                        href={((editingProvider.portalLinks || (AI_PORTAL_LINKS as any)[editingProvider.provider]) as any).billingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white hover:bg-emerald-50 border border-emerald-200 rounded-xl text-center font-bold text-emerald-800 text-[11px] flex flex-col items-center gap-1 shadow-xs"
                      >
                        <CreditCard size={14} className="text-emerald-600" />
                        Quotas & Facturation
                      </a>
                    )}
                  </div>
                </div>
              )}

              {/* Action Corrective Recommandée */}
              {editingProvider.correctiveAction && (
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs space-y-1">
                  <span className="font-bold flex items-center gap-1 text-[11px] uppercase tracking-wider">
                    <AlertTriangle size={13} className="text-amber-600" /> Action Corrective Conseillée :
                  </span>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    {editingProvider.correctiveAction}
                  </p>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Endpoint Personnalisée (Optionnel)</label>
                <input
                  type="text"
                  placeholder="https://api.votre-serveur.com/v1/chat/completions"
                  value={editingProvider.endpointUrl || ''}
                  onChange={(e) => setEditingProvider({ ...editingProvider, endpointUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                />
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
                  Connecter un Nouveau Fournisseur d'IA
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Compatible OpenAI, Claude, DeepSeek, Qwen, Kimi, Grok, Replicate, Ollama, etc.</p>
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Clé API (Secret Key / Bearer Token)</label>
                <input
                  type="text"
                  placeholder="sk-..."
                  value={newProviderForm.apiKey}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, apiKey: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">URL Endpoint API (si personnalisé ou relai)</label>
                <input
                  type="text"
                  placeholder="https://api.votre-relais.com/v1/chat/completions"
                  value={newProviderForm.endpointUrl}
                  onChange={(e) => setNewProviderForm({ ...newProviderForm, endpointUrl: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Score Qualité Initial (0-100)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newProviderForm.qualityScore}
                    onChange={(e) => setNewProviderForm({ ...newProviderForm, qualityScore: parseInt(e.target.value) || 85 })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 outline-none"
                  />
                </div>

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
                Connecter et Intégrer à la Chaîne
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hub Connecteurs & Portails Directs Modal */}
      <AIConnectorsHubModal
        isOpen={showConnectorsHub}
        onClose={() => setShowConnectorsHub(false)}
      />
    </div>
  );
};
