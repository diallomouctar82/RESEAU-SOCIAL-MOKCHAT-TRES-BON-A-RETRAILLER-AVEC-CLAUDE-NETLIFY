import React, { useState, useEffect } from 'react';
import {
  Shield,
  LayoutDashboard,
  Users,
  BrainCircuit,
  FileText,
  GitBranch,
  Activity,
  HardDrive,
  Layers,
  Stamp,
  Radio,
  Sparkles,
  ShieldAlert,
  Sliders,
  Database,
  Cpu,
  HeartPulse,
  History
} from 'lucide-react';
import { adminConfigService } from '../services/adminConfigService';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminModerationTab } from './admin/AdminModerationTab';
import { AdminPlatformSettingsTab } from './admin/AdminPlatformSettingsTab';
import { AdminPlatformModulesTab } from './admin/AdminPlatformModulesTab';
import { AdminTemplatesAndStampsTab } from './admin/AdminTemplatesAndStampsTab';
import { AdminWorkflowsAndBackupTab } from './admin/AdminWorkflowsAndBackupTab';
import { AdminLogsAndBroadcastTab } from './admin/AdminLogsAndBroadcastTab';
import { AiOrchestrator } from './admin/AiOrchestrator';
import { AdminHealthTab } from './admin/AdminHealthTab';
import { AdminArchitecteAvatarTab } from './admin/AdminArchitecteAvatarTab';
import { AdminStableVersionsTab } from './admin/AdminStableVersionsTab';

export type AdminTab = 'overview' | 'health' | 'versions' | 'ai-connectors' | 'architecte' | 'users' | 'moderation' | 'settings' | 'modules' | 'templates' | 'workflows' | 'logs';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('ai-connectors');
  const [tick, setTick] = useState(0);

  // Sync state with adminConfigService
  useEffect(() => {
    const unsubscribe = adminConfigService.subscribe(() => {
      setTick(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const users = adminConfigService.getUsers();
  const aiProviders = adminConfigService.getAIProviders();
  const modules = adminConfigService.getModules();
  const templates = adminConfigService.getTemplates();
  const signatures = adminConfigService.getSignatures();
  const stamps = adminConfigService.getStamps();
  const workflows = adminConfigService.getWorkflows();
  const logs = adminConfigService.getLogs();
  const notifications = adminConfigService.getBroadcastNotifications();
  const systemConfig = adminConfigService.getSystemConfig();
  const moderationItems = adminConfigService.getModerationItems();
  const userReports = adminConfigService.getUserReports();
  const mokTrustAudits = adminConfigService.getMokTrustAudits();
  const detailedSettings = adminConfigService.getDetailedSettings();

  const handleReload = () => {
    setTick(prev => prev + 1);
  };

  const pendingReportsCount = userReports.filter(r => r.status === 'pending').length;
  const flaggedCount = moderationItems.filter(m => m.status === 'flagged').length;
  const activeProvidersCount = aiProviders.filter(p => p.isEnabled).length;

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-full space-y-6 animate-fade-up text-slate-900">
      
      {/* Top Central Admin Header & Global Navigation */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
              Console Super-Admin Souveraine
            </span>
            <span className="text-xs text-slate-400 font-mono">Diallo OS v2.5 — Supabase Cloud</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Shield className="text-blue-600 shrink-0" size={26} />
            Tableau de Bord Super-Admin
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Orchestrez les connecteurs IA (Gemini, DeepSeek, Claude, OpenAI...), supervisez les utilisateurs, modérez et configurez la plateforme.
          </p>
        </div>

        {/* Unified Tab Bar with prominent AI Connectors tab */}
        <div className="flex overflow-x-auto sm:flex-wrap gap-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full xl:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LayoutDashboard size={15} />
            Vue Générale
          </button>

          {/* Avatar de l'Architecte — onglet dédié (Direction, 05/09/2026) : créer ou
              remplacer l'avatar vivant depuis une photo, aperçu, validation, retour arrière. */}
          <button
            onClick={() => setActiveTab('architecte')}
            data-testid="admin-onglet-architecte"
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'architecte'
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-cyan-800 hover:text-cyan-900 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200'
            }`}
          >
            <Sparkles size={15} />
            <span className="hidden sm:inline">Avatar de l’Architecte</span>
            <span className="sm:hidden">Avatar</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'health'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <HeartPulse size={15} />
            Santé Globale
          </button>

          {/* Versions stables & restauration contrôlée — onglet dédié (Direction, 05/09/2026) :
              les dernières versions livrées avec leurs preuves, la version réellement servie,
              et un ordre de restauration contrôlée, jamais à l'aveugle. */}
          <button
            onClick={() => setActiveTab('versions')}
            data-testid="admin-onglet-versions"
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'versions'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-amber-900 hover:text-amber-950 bg-amber-50 hover:bg-amber-100 border border-amber-200'
            }`}
          >
            <History size={15} />
            <span className="hidden sm:inline">Versions stables</span>
            <span className="sm:hidden">Versions</span>
          </button>

          {/* Connecteurs & Modèles IA — Mise en avant stratégique */}
          <button
            onClick={() => setActiveTab('ai-connectors')}
            className={`px-3.5 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'ai-connectors'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md ring-2 ring-blue-400/40'
                : 'bg-white text-indigo-700 hover:bg-indigo-50 border border-indigo-200 shadow-xs'
            }`}
          >
            <BrainCircuit size={16} className={activeTab === 'ai-connectors' ? 'text-white' : 'text-indigo-600'} />
            <span>Connecteurs & Modèles IA</span>
            <span className={`text-[10px] font-black px-1.5 py-0.2 rounded-full ${
              activeTab === 'ai-connectors' ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-800'
            }`}>
              {aiProviders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Users size={15} />
            Utilisateurs & RBAC
          </button>

          <button
            onClick={() => setActiveTab('moderation')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'moderation'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldAlert size={15} />
            Modération & MokTrust
            {(pendingReportsCount > 0 || flaggedCount > 0) && (
              <span className="relative inline-flex w-2 h-2">
                <span className="animate-ping absolute inline-flex w-full h-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full w-2 h-2 bg-red-500"></span>
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('modules')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'modules'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Layers size={15} />
            Modules Plateforme
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sliders size={15} />
            Paramètres Plateforme
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'templates'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FileText size={15} />
            Modèles & Sceaux
          </button>

          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'workflows'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <GitBranch size={15} />
            Workflows & Sync
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              activeTab === 'logs'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Activity size={15} />
            Journaux & Alertes
          </button>
        </div>
      </div>

      {/* ACTIVE TAB CONTENT */}
      {activeTab === 'overview' && (
        <AdminOverviewTab
          systemConfig={systemConfig}
          users={users}
          modules={modules}
          logs={logs}
          aiProviders={aiProviders}
          signatures={signatures}
          stamps={stamps}
          onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
        />
      )}

      {/* 🩺 SANTÉ GLOBALE — état de toute l'application, ligne par ligne, actions contrôlées */}
      {activeTab === 'health' && (
        <div className="animate-fade-up">
          <AdminHealthTab />
        </div>
      )}

      {/* 🗂️ VERSIONS STABLES & RESTAURATION CONTRÔLÉE — registre, version servie, ordre de restauration */}
      {activeTab === 'versions' && (
        <div className="animate-fade-up">
          <AdminStableVersionsTab />
        </div>
      )}

      {/* 🧠 CONNECTEURS & MODÈLES IA — orchestrateur central (Supabase Vault + ai-gateway) */}
      {activeTab === 'ai-connectors' && (
        <div className="animate-fade-up">
          <AiOrchestrator />
        </div>
      )}

      {activeTab === 'users' && (
        <AdminUsersTab
          users={users}
          onReload={handleReload}
        />
      )}

      {activeTab === 'moderation' && (
        <AdminModerationTab
          moderationItems={moderationItems}
          reports={userReports}
          mokTrustAudits={mokTrustAudits}
          onReload={handleReload}
        />
      )}

      {activeTab === 'modules' && (
        <AdminPlatformModulesTab
          modules={modules}
          onReload={handleReload}
        />
      )}

      {activeTab === 'architecte' && (
        <AdminArchitecteAvatarTab
          architecteAvatar={detailedSettings.architecteAvatar}
          onReload={handleReload}
        />
      )}

      {activeTab === 'settings' && (
        <AdminPlatformSettingsTab
          detailedSettings={detailedSettings}
          onReload={handleReload}
        />
      )}

      {activeTab === 'templates' && (
        <AdminTemplatesAndStampsTab
          templates={templates}
          signatures={signatures}
          stamps={stamps}
          onReload={handleReload}
        />
      )}

      {activeTab === 'workflows' && (
        <AdminWorkflowsAndBackupTab
          workflows={workflows}
          systemConfig={systemConfig}
          onReload={handleReload}
          onOuvrirVersionsStables={() => setActiveTab('versions')}
        />
      )}

      {activeTab === 'logs' && (
        <AdminLogsAndBroadcastTab
          logs={logs}
          notifications={notifications}
          onReload={handleReload}
        />
      )}

    </div>
  );
};

