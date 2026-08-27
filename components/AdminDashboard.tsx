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
  Database
} from 'lucide-react';
import { adminConfigService } from '../services/adminConfigService';
import { AdminOverviewTab } from './admin/AdminOverviewTab';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminModerationTab } from './admin/AdminModerationTab';
import { AdminPlatformSettingsTab } from './admin/AdminPlatformSettingsTab';
import { AdminAIAndModulesTab } from './admin/AdminAIAndModulesTab';
import { AdminTemplatesAndStampsTab } from './admin/AdminTemplatesAndStampsTab';
import { AdminWorkflowsAndBackupTab } from './admin/AdminWorkflowsAndBackupTab';
import { AdminLogsAndBroadcastTab } from './admin/AdminLogsAndBroadcastTab';

type AdminTab = 'overview' | 'users' | 'moderation' | 'settings' | 'ai-modules' | 'templates' | 'workflows' | 'logs';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
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

  return (
    <div className="p-4 sm:p-6 bg-slate-50 min-h-full space-y-6 animate-fade-up text-slate-900">
      
      {/* Top Central Admin Header & Global Navigation */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-5 sm:p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-wider">
              Administration Générale
            </span>
            <span className="text-xs text-slate-400 font-mono">Diallo OS v2.5 — Supabase Cloud</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2.5 mt-1">
            <Shield className="text-blue-600 shrink-0" size={26} />
            Tableau de Bord Super-Admin Souverain
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Supervisez les utilisateurs, modérez les contenus, ajustez les paramètres des modules (Live, B2B, MokTrust) et orchestrez l'IA.
          </p>
        </div>

        {/* Unified Tab Bar */}
        <div className="flex overflow-x-auto sm:flex-wrap gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-full xl:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'overview' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LayoutDashboard size={15} />
            Vue Générale
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'moderation' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <ShieldAlert size={15} />
            Modération & MokTrust
            {(pendingReportsCount > 0 || flaggedCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Sliders size={15} />
            Paramètres Plateforme
          </button>

          <button
            onClick={() => setActiveTab('ai-modules')}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              activeTab === 'ai-modules' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <BrainCircuit size={15} />
            Modules & IA
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
            className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
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
          onNavigateTab={(tab) => setActiveTab(tab as AdminTab)}
        />
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

      {activeTab === 'settings' && (
        <AdminPlatformSettingsTab
          detailedSettings={detailedSettings}
          onReload={handleReload}
        />
      )}

      {activeTab === 'ai-modules' && (
        <AdminAIAndModulesTab
          aiProviders={aiProviders}
          modules={modules}
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
