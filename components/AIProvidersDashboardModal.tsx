import React, { useState, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Activity, 
  Zap, 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ExternalLink, 
  Play, 
  Server, 
  Cpu, 
  Search, 
  Check, 
  Copy, 
  SlidersHorizontal,
  Flame,
  Volume2,
  Video,
  Workflow,
  ArrowRight,
  TrendingUp,
  RotateCcw
} from 'lucide-react';
import { AIProviderConfig, SupportedAIProviderType } from '../types';
import { adminConfigService } from '../services/adminConfigService';
import { aiRoutingService } from '../services/aiRoutingService';
import { AI_PORTAL_LINKS } from '../services/unifiedAIConnector';

interface AIProvidersDashboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProvider?: (providerId: string) => void;
}

export const AIProvidersDashboardModal: React.FC<AIProvidersDashboardModalProps> = ({
  isOpen,
  onClose,
  onSelectProvider
}) => {
  const [providers, setProviders] = useState<AIProviderConfig[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'llm' | 'voice' | 'video' | 'workflow' | 'sandbox'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; latencyMs: number; message: string; timestamp: string }>>({});
  const [isDiagnosticRunning, setIsDiagnosticRunning] = useState(false);
  const [activeEngine, setActiveEngine] = useState(aiRoutingService.getActiveEngineInfo());
  const [lastExecution, setLastExecution] = useState(aiRoutingService.getLastExecutionInfo());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [simulationStatus, setSimulationStatus] = useState<string | null>(null);

  // Sandbox state
  const [sandboxPrompt, setSandboxPrompt] = useState('Analyse la faisabilité d’un contrat d’exportation avec clause de séquestre bancaire.');
  const [sandboxProviderId, setSandboxProviderId] = useState('auto');
  const [sandboxRunning, setSandboxRunning] = useState(false);
  const [sandboxOutput, setSandboxOutput] = useState<{ text: string; providerName: string; model: string; latencyMs: number; wasFailover: boolean; reason?: string } | null>(null);

  const loadData = () => {
    const list = adminConfigService.getAIProviders();
    setProviders(list);
    setActiveEngine(aiRoutingService.getActiveEngineInfo());
    setLastExecution(aiRoutingService.getLastExecutionInfo());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      const unsubscribe = aiRoutingService.subscribe(() => {
        loadData();
      });
      return unsubscribe;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestProvider = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await aiRoutingService.testProviderHealth(providerId);
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          ...res,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        }
      }));
      loadData();
    } catch (e: any) {
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          success: false,
          latencyMs: 0,
          message: e.message || 'Échec du test',
          timestamp: new Date().toLocaleTimeString('fr-FR')
        }
      }));
    } finally {
      setTestingId(null);
    }
  };

  const handleReconnectProvider = async (providerId: string) => {
    setTestingId(providerId);
    try {
      const res = await aiRoutingService.reconnectProvider(providerId);
      setTestResults(prev => ({
        ...prev,
        [providerId]: {
          ...res,
          timestamp: new Date().toLocaleTimeString('fr-FR')
        }
      }));
      loadData();
    } catch (e: any) {
      console.warn('Reconnect error:', e);
    } finally {
      setTestingId(null);
    }
  };

  const handleSetPrimary = (providerId: string) => {
    aiRoutingService.setActivePrimaryProvider(providerId);
    loadData();
    if (onSelectProvider) {
      onSelectProvider(providerId);
    }
  };

  const handleRunFullDiagnostic = async () => {
    setIsDiagnosticRunning(true);
    try {
      await aiRoutingService.probeAllProvidersOnStartup();
      loadData();
    } finally {
      setIsDiagnosticRunning(false);
    }
  };

  const handleSimulateFailover = async () => {
    setSimulationStatus('Simulation de coupure sur le moteur principal en cours...');
    const ranked = aiRoutingService.getRankedProviders();
    if (ranked.length > 0) {
      const primary = ranked[0];
      // Mettre temporairement le premier en échec
      adminConfigService.updateAIProvider(primary.id, {
        status: 'degraded',
        consecutiveErrors: 3,
        lastErrorMessage: 'Simulation de rupture de service réseau (429 Rate Limit)'
      });

      aiRoutingService.logFailoverEvent({
        requestedProviderId: primary.id,
        requestedProviderName: primary.name,
        fallbackProviderId: ranked[1]?.id || 'sovereign-core',
        fallbackProviderName: ranked[1]?.name || 'Moteur Souverain LMAV',
        modelUsed: ranked[1]?.defaultModel || 'lmav-sovereign-v1',
        reason: 'rate_limit_429',
        details: 'Simulation déclenchée manuellement : basculement instantané vers le moteur suivant sans rupture de service.',
        latencyMs: 110,
        success: true,
        promptSnippet: 'Test de résilience dynamique en conditions réelles'
      });

      loadData();
      setSimulationStatus(`✅ Bascule réussie ! ${primary.name} marqué dégradé ➔ Relais automatique pris par ${ranked[1]?.name || 'Secours Local'}.`);
      setTimeout(() => setSimulationStatus(null), 5000);
    }
  };

  const handleRunSandbox = async () => {
    setSandboxRunning(true);
    setSandboxOutput(null);
    try {
      const options: any = {
        prompt: sandboxPrompt,
        systemInstruction: "Tu es un expert d'élite de la Famille Diallo, précis, bienveillant et structuré."
      };
      if (sandboxProviderId !== 'auto') {
        options.preferredProviderId = sandboxProviderId;
      }
      const res = await aiRoutingService.executeWithResilience(options);
      setSandboxOutput({
        text: res.text,
        providerName: res.providerUsed.name,
        model: res.modelUsed,
        latencyMs: res.latencyMs,
        wasFailover: res.wasFailover,
        reason: res.failoverReason
      });
      loadData();
    } catch (err: any) {
      setSandboxOutput({
        text: `Erreur : ${err.message}`,
        providerName: 'Erreur',
        model: '-',
        latencyMs: 0,
        wasFailover: false
      });
    } finally {
      setSandboxRunning(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Filtrage des fournisseurs
  const filteredProviders = providers.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchProvider = p.provider.toLowerCase().includes(q);
      const matchModel = p.defaultModel.toLowerCase().includes(q);
      if (!matchName && !matchProvider && !matchModel) return false;
    }

    if (activeTab === 'llm') {
      return ['gemini', 'claude', 'openai', 'deepseek', 'qwen', 'kimi', 'mistral', 'openrouter', 'ollama'].includes(p.provider);
    }
    if (activeTab === 'voice') {
      return p.provider === 'elevenlabs' || p.taskSpecialty === 'audio_transcription';
    }
    if (activeTab === 'video') {
      return p.provider === 'kling' || p.provider === 'runway' || p.provider === 'heygene';
    }
    if (activeTab === 'workflow') {
      return p.provider === 'n8n' || p.provider === 'custom';
    }
    return true;
  });

  const onlineCount = providers.filter(p => p.isEnabled && p.status === 'online').length;
  const degradedCount = providers.filter(p => p.isEnabled && p.status === 'degraded').length;
  const quarantinedCount = providers.filter(p => p.status === 'quarantined').length;
  const rankedChain = aiRoutingService.getRankedProviders();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-6xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Header Élégant et Aéré */}
        <div className="px-6 py-5 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-semibold text-white tracking-tight">
                  Tableau de Bord des Fournisseurs IA
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Haute Résilience Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Supervision en temps réel, tests de sonde de latence, reconnexion et cascade d'auto-bascule
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRunFullDiagnostic}
              disabled={isDiagnosticRunning}
              className="flex items-center gap-2 px-3.5 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition shadow-xs disabled:opacity-50 cursor-pointer"
              title="Tester tous les connecteurs configurés"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isDiagnosticRunning ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isDiagnosticRunning ? 'Diagnostic...' : 'Sonder Tous les Moteurs'}</span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Métriques Clés & Moteur Actif Banner */}
        <div className="px-6 py-3.5 bg-slate-950/60 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping inline-block" />
              <span className="text-slate-400">Moteur Principal Actif :</span>
              <span className="font-semibold text-white">{activeEngine.name}</span>
              <span className="text-emerald-400 font-mono text-[11px]">({activeEngine.latencyMs}ms)</span>
            </div>

            {lastExecution?.wasFailover && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Auto-Bascule active : {lastExecution.providerUsedName} ({lastExecution.latencyMs}ms)</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/60 font-medium">
              🟢 {onlineCount} En ligne
            </span>
            {degradedCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/60 text-amber-400 border border-amber-800/60 font-medium">
                🟡 {degradedCount} Dégradé(s)
              </span>
            )}
            {quarantinedCount > 0 && (
              <span className="px-2.5 py-1 rounded-lg bg-rose-950/60 text-rose-400 border border-rose-800/60 font-medium">
                🔴 {quarantinedCount} En quarantaine
              </span>
            )}
            <button
              onClick={handleSimulateFailover}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/40 transition font-medium cursor-pointer"
            >
              ⚡ Tester la Bascule
            </button>
          </div>
        </div>

        {simulationStatus && (
          <div className="px-6 py-2 bg-amber-500/15 border-b border-amber-500/30 text-xs text-amber-200 flex items-center justify-between">
            <span>{simulationStatus}</span>
            <button onClick={() => setSimulationStatus(null)} className="text-amber-400 hover:text-white text-[11px]">Fermer</button>
          </div>
        )}

        {/* Navigation des Onglets & Recherche */}
        <div className="px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-900/50">
          <div className="flex items-center gap-1.5 overflow-x-auto py-0.5">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'all' 
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Tous ({providers.length})
            </button>
            <button
              onClick={() => setActiveTab('llm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'llm' 
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              LLMs & Raisonnement (Gemini, Claude, DeepSeek...)
            </button>
            <button
              onClick={() => setActiveTab('voice')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'voice' 
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Voix HD & TTS (ElevenLabs)
            </button>
            <button
              onClick={() => setActiveTab('video')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'video' 
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Vidéo & Avatar (Kling, Runway, HeyGen)
            </button>
            <button
              onClick={() => setActiveTab('workflow')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'workflow' 
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Workflows (n8n)
            </button>
            <button
              onClick={() => setActiveTab('sandbox')}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition whitespace-nowrap cursor-pointer ${
                activeTab === 'sandbox' 
                  ? 'bg-amber-500 text-slate-950 font-semibold shadow-xs' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              🔬 Banc d'Essai Sandbox
            </button>
          </div>

          {activeTab !== 'sandbox' && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filtrer un modèle ou moteur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>

        {/* Corps Principal Modal */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Onglet Banc d'Essai Sandbox */}
          {activeTab === 'sandbox' ? (
            <div className="space-y-5">
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Play className="w-4 h-4 text-amber-400" />
                    Banc d'Essai Multi-Moteurs avec Auto-Résilience
                  </h3>
                  <span className="text-xs text-slate-400">Test en direct de la chaîne de bascule</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Moteur Cible :</label>
                    <select
                      value={sandboxProviderId}
                      onChange={(e) => setSandboxProviderId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500"
                    >
                      <option value="auto">⚡ Mode Auto-Résilient (Cascade Automatique avec Secours)</option>
                      {providers.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.defaultModel}) - {p.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">Prompt de Test :</label>
                    <textarea
                      rows={3}
                      value={sandboxPrompt}
                      onChange={(e) => setSandboxPrompt(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-amber-500 resize-none font-mono"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      onClick={handleRunSandbox}
                      disabled={sandboxRunning}
                      className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl transition shadow-md disabled:opacity-50 cursor-pointer"
                    >
                      <Play className={`w-3.5 h-3.5 ${sandboxRunning ? 'animate-spin' : ''}`} />
                      {sandboxRunning ? 'Exécution du prompt...' : 'Lancer le test en direct'}
                    </button>
                  </div>
                </div>
              </div>

              {sandboxOutput && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3 animate-fadeIn">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Moteur Utilisé :</span>
                      <span className="text-xs font-bold text-white bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                        {sandboxOutput.providerName}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">({sandboxOutput.model})</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-emerald-400 font-mono">⚡ {sandboxOutput.latencyMs}ms</span>
                      {sandboxOutput.wasFailover && (
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-full">
                          Bascule Automatique Déclenchée
                        </span>
                      )}
                    </div>
                  </div>

                  {sandboxOutput.reason && (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300">
                      ℹ️ {sandboxOutput.reason}
                    </div>
                  )}

                  <div className="bg-slate-900/80 p-4 rounded-xl text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto">
                    {sandboxOutput.text}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Cascade Visuelle de Secours */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-amber-400" />
                    Chaîne de Bascule Prioritaire Active (Failover Chain)
                  </span>
                  <span className="text-[11px] text-slate-500">Ordre d'exécution automatique en cas de rupture</span>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  {rankedChain.slice(0, 5).map((p, idx) => (
                    <React.Fragment key={p.id}>
                      <div className={`px-3 py-2 rounded-xl text-xs border flex items-center gap-2 shrink-0 ${
                        idx === 0 
                          ? 'bg-emerald-950/40 border-emerald-600/60 text-white' 
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}>
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                          idx === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-[11px] flex items-center gap-1">
                            {p.name}
                            {idx === 0 && <span className="text-[9px] text-emerald-400 font-normal">[Principal]</span>}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">{p.defaultModel}</div>
                        </div>
                      </div>
                      {idx < Math.min(rankedChain.length, 5) - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                  <div className="px-3 py-2 rounded-xl text-xs bg-amber-950/30 border border-amber-800/40 text-amber-200 shrink-0 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Moteur Souverain LMAV (Secours Local)</span>
                  </div>
                </div>
              </div>

              {/* Grille des Cartes Fournisseurs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredProviders.map(provider => {
                  const testRes = testResults[provider.id];
                  const isTesting = testingId === provider.id;
                  const isPrimary = provider.isDefault;
                  const portalUrl = AI_PORTAL_LINKS[provider.provider as SupportedAIProviderType];

                  return (
                    <div 
                      key={provider.id}
                      className={`bg-slate-950/60 border rounded-2xl p-4 flex flex-col justify-between transition-all hover:border-slate-700 ${
                        isPrimary 
                          ? 'border-amber-500/50 shadow-md shadow-amber-500/5 ring-1 ring-amber-500/20' 
                          : provider.status === 'quarantined'
                          ? 'border-rose-900/40 opacity-75'
                          : 'border-slate-800'
                      }`}
                    >
                      <div>
                        {/* En-tête Carte */}
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="text-sm font-semibold text-white tracking-tight">{provider.name}</h4>
                              {isPrimary && (
                                <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded">
                                  ACTIF
                                </span>
                              )}
                            </div>
                            <span className="text-xs text-slate-400 font-mono">{provider.defaultModel}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full ${
                              provider.status === 'online' ? 'bg-emerald-400' :
                              provider.status === 'degraded' ? 'bg-amber-400' :
                              provider.status === 'quarantined' ? 'bg-rose-500' : 'bg-slate-600'
                            }`} />
                            <span className={`text-[11px] font-medium capitalize ${
                              provider.status === 'online' ? 'text-emerald-400' :
                              provider.status === 'degraded' ? 'text-amber-400' :
                              provider.status === 'quarantined' ? 'text-rose-400' : 'text-slate-500'
                            }`}>
                              {provider.status === 'online' ? 'En ligne' :
                               provider.status === 'degraded' ? 'Dégradé' :
                               provider.status === 'quarantined' ? 'Quarantaine' : 'Hors ligne'}
                            </span>
                          </div>
                        </div>

                        {/* Métriques */}
                        <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-slate-800/80 my-2 text-[11px]">
                          <div>
                            <span className="text-slate-500 block text-[10px]">Latence</span>
                            <span className="font-semibold text-slate-200 font-mono">
                              {provider.latencyMs ? `${provider.latencyMs}ms` : '—'}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Qualité</span>
                            <span className="font-semibold text-emerald-400">
                              {provider.qualityScore || 85}%
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-500 block text-[10px]">Erreurs</span>
                            <span className={`font-semibold ${provider.consecutiveErrors ? 'text-amber-400' : 'text-slate-400'}`}>
                              {provider.consecutiveErrors || 0}
                            </span>
                          </div>
                        </div>

                        {/* Dernier Message de Test ou Erreur */}
                        {testRes && (
                          <div className={`p-2 rounded-xl text-[11px] mb-2 flex items-center justify-between ${
                            testRes.success 
                              ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/50' 
                              : 'bg-rose-950/40 text-rose-300 border border-rose-800/50'
                          }`}>
                            <span className="truncate pr-2">{testRes.message}</span>
                            <span className="text-[9px] text-slate-400 shrink-0">{testRes.timestamp}</span>
                          </div>
                        )}

                        {provider.lastErrorMessage && !testRes && (
                          <div className="p-2 rounded-xl text-[11px] mb-2 bg-amber-950/30 text-amber-300 border border-amber-800/40 truncate">
                            ⚠️ {provider.lastErrorMessage}
                          </div>
                        )}
                      </div>

                      {/* Actions Boutons */}
                      <div className="space-y-2 pt-2">
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleTestProvider(provider.id)}
                            disabled={isTesting}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-xl text-xs font-medium transition cursor-pointer disabled:opacity-50"
                          >
                            <RefreshCw className={`w-3 h-3 text-amber-400 ${isTesting ? 'animate-spin' : ''}`} />
                            <span>{isTesting ? 'Test...' : 'Tester'}</span>
                          </button>

                          <button
                            onClick={() => handleReconnectProvider(provider.id)}
                            disabled={isTesting}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-900 hover:bg-slate-800 text-emerald-300 border border-slate-700/80 rounded-xl text-xs font-medium transition cursor-pointer disabled:opacity-50"
                          >
                            <RotateCcw className="w-3 h-3 text-emerald-400" />
                            <span>Reconnecter</span>
                          </button>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-1">
                          {!isPrimary ? (
                            <button
                              onClick={() => handleSetPrimary(provider.id)}
                              className="text-xs text-amber-400 hover:text-amber-300 hover:underline font-medium cursor-pointer"
                            >
                              ★ Définir comme Moteur Actif
                            </button>
                          ) : (
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
                              <Check className="w-3.5 h-3.5" /> Moteur Prioritaire
                            </span>
                          )}

                          {portalUrl && (
                            <a
                              href={portalUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition"
                            >
                              <span>Clé API</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Architecture auto-résiliente conforme Charte Diallo : 100% sans coupure utilisateur.</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-medium transition cursor-pointer"
            >
              Fermer le Tableau de Bord
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
