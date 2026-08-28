import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity,
  BrainCircuit,
  FileText,
  GitBranch,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Shield,
  ShieldAlert,
  Sliders,
  Users
} from 'lucide-react';
import { adminConfigService } from '../services/adminConfigService';
import {
  AdminApiError,
  adminApi,
  type AdminActor,
  type AdminAuditRecord,
  type CreateAdminUserInput,
  type ServerProviderConfiguration,
  type UpdateAdminUserInput
} from '../services/adminApi';
import type { AdminUserRecord, SystemAuditLog } from '../types';
import { AdminUsersTab } from './admin/AdminUsersTab';
import { AdminModerationTab } from './admin/AdminModerationTab';
import { AdminPlatformSettingsTab } from './admin/AdminPlatformSettingsTab';
import { AdminAIAndModulesTab } from './admin/AdminAIAndModulesTab';
import { AdminTemplatesAndStampsTab } from './admin/AdminTemplatesAndStampsTab';
import { AdminWorkflowsAndBackupTab } from './admin/AdminWorkflowsAndBackupTab';
import { AdminLogsAndBroadcastTab } from './admin/AdminLogsAndBroadcastTab';

type AdminTab = 'overview' | 'users' | 'moderation' | 'settings' | 'ai-modules' | 'templates' | 'workflows' | 'logs';

const TABS: { id: AdminTab; label: string; icon: React.ComponentType<{ size?: number }> }[] = [
  { id: 'overview', label: 'Vue générale', icon: LayoutDashboard },
  { id: 'users', label: 'Utilisateurs & RBAC', icon: Users },
  { id: 'moderation', label: 'Modération', icon: ShieldAlert },
  { id: 'settings', label: 'Paramètres', icon: Sliders },
  { id: 'ai-modules', label: 'Modules & IA', icon: BrainCircuit },
  { id: 'templates', label: 'Modèles & sceaux', icon: FileText },
  { id: 'workflows', label: 'Workflows', icon: GitBranch },
  { id: 'logs', label: 'Audit & alertes', icon: Activity }
];

const apiErrorMessage = (error: unknown) => {
  if (error instanceof AdminApiError) {
    return `${error.message}${error.requestId ? ` (requête ${error.requestId})` : ''}`;
  }
  return error instanceof Error ? error.message : 'Impossible de charger la console d’administration.';
};

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [, setLocalConfigTick] = useState(0);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [audit, setAudit] = useState<AdminAuditRecord[]>([]);
  const [actor, setActor] = useState<AdminActor | null>(null);
  const [serverProviders, setServerProviders] = useState<ServerProviderConfiguration[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadDirectory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminApi.list();
      setUsers(result.users);
      setAudit(result.audit);
      setActor(result.actor);
      setServerProviders(result.serverConfiguration.aiProviders);
    } catch (caught) {
      setError(apiErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    adminConfigService.activateAdminRuntime();
    const unsubscribe = adminConfigService.subscribe(() => setLocalConfigTick((value) => value + 1));
    void loadDirectory();
    return unsubscribe;
  }, [loadDirectory]);

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(null), 5000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const runMutation = async (action: () => Promise<{ message: string }>) => {
    const result = await action();
    setNotice(result.message);
    await loadDirectory();
  };

  const createUser = (input: CreateAdminUserInput) => runMutation(() => adminApi.create(input));
  const updateUser = (input: UpdateAdminUserInput) => runMutation(() => adminApi.update(input));
  const deleteUser = (id: string) => runMutation(() => adminApi.remove(id));

  const realLogs = useMemo<SystemAuditLog[]>(() => audit.map((entry) => ({
    id: entry.id,
    timestamp: entry.created_at,
    level: entry.outcome === 'success' ? 'info' : entry.outcome === 'denied' ? 'security' : 'error',
    category: 'admin',
    message: entry.action,
    actor: entry.actor_id || 'Compte supprimé',
    ipAddress: 'Non collectée',
    metadata: { ...entry.metadata, targetId: entry.target_id, requestId: entry.request_id, outcome: entry.outcome }
  })), [audit]);

  const aiProviders = adminConfigService.getAIProviders();
  const modules = adminConfigService.getModules();
  const templates = adminConfigService.getTemplates();
  const signatures = adminConfigService.getSignatures();
  const stamps = adminConfigService.getStamps();
  const workflows = adminConfigService.getWorkflows();
  const notifications = adminConfigService.getBroadcastNotifications();
  const systemConfig = adminConfigService.getSystemConfig();
  const moderationItems = adminConfigService.getModerationItems();
  const userReports = adminConfigService.getUserReports();
  const mokTrustAudits = adminConfigService.getMokTrustAudits();
  const detailedSettings = adminConfigService.getDetailedSettings();

  const onLocalReload = () => setLocalConfigTick((value) => value + 1);
  const activeUsers = users.filter((user) => user.status === 'active').length;
  const suspendedUsers = users.filter((user) => user.status === 'suspended').length;
  const elevatedUsers = users.filter((user) => ['admin', 'super_admin', 'moderator'].includes(user.role)).length;
  const deniedActions = audit.filter((entry) => entry.outcome === 'denied').length;

  return (
    <div className="min-h-full space-y-5 bg-slate-50 p-3 pb-32 text-slate-900 sm:p-6">
      <header className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white">Administration générale</span>
              <span className="text-xs font-mono text-slate-400">Supabase Auth · Function serveur · audit persistant</span>
            </div>
            <h1 className="mt-2 flex items-center gap-2 text-2xl font-black"><Shield className="text-blue-600" /> Console d’administration sécurisée</h1>
            <p className="mt-1 max-w-3xl text-xs text-slate-500">Les utilisateurs et indicateurs d’identité proviennent exclusivement de la source cloud authentifiée.</p>
          </div>
          <button type="button" onClick={() => void loadDirectory()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-bold text-white hover:bg-slate-800 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-500">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />} Actualiser les données réelles
          </button>
        </div>

        <nav aria-label="Sections d’administration" className="mt-5 flex w-full gap-1.5 overflow-x-auto rounded-2xl border border-slate-200 bg-slate-100 p-1.5">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            return <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} aria-current={activeTab === tab.id ? 'page' : undefined} className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-blue-500 ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-white hover:text-slate-900'}`}><Icon size={15} />{tab.label}</button>;
          })}
        </nav>
      </header>

      {activeTab === 'overview' && (
        <section className="space-y-5" aria-labelledby="admin-live-overview">
          <div className="rounded-3xl bg-slate-950 p-6 text-white shadow-xl">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-widest text-blue-300">État vérifié à la demande</p><h2 id="admin-live-overview" className="mt-1 text-2xl font-black">Vue d’ensemble identité et sécurité</h2><p className="mt-1 text-sm text-slate-300">Aucune estimation locale : les compteurs ci-dessous sont calculés sur les comptes renvoyés par Supabase Auth.</p></div>{actor && <span className="rounded-full border border-blue-400/30 bg-blue-400/10 px-3 py-1.5 text-xs font-bold text-blue-200">Accès serveur : {actor.role}</span>}</div>
          </div>

          {error && <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-800">{error}</div>}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              ['Comptes retournés', users.length, 'text-blue-700'],
              ['Comptes actifs', activeUsers, 'text-emerald-700'],
              ['Comptes suspendus', suspendedUsers, 'text-rose-700'],
              ['Rôles élevés', elevatedUsers, 'text-amber-700']
            ].map(([label, value, color]) => <button key={String(label)} type="button" onClick={() => setActiveTab('users')} className="rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm hover:border-blue-300 focus-visible:ring-2 focus-visible:ring-blue-500"><p className="text-[11px] font-black uppercase tracking-wide text-slate-500">{label}</p><p className={`mt-2 text-3xl font-black ${color}`}>{loading && users.length === 0 ? '—' : value}</p></button>)}
          </div>

          <div className="grid gap-5 lg:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:col-span-2"><div className="flex items-center justify-between"><h3 className="flex items-center gap-2 font-black"><Activity className="text-purple-600" size={19} />Dernières opérations administratives</h3><button type="button" onClick={() => setActiveTab('logs')} className="text-xs font-bold text-blue-700">Voir le journal</button></div><div className="mt-4 space-y-2">{audit.length === 0 ? <p className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">Aucune opération auditée retournée.</p> : audit.slice(0, 6).map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-100 p-3 text-xs"><div><p className="font-bold text-slate-800">{entry.action}</p><p className="font-mono text-[10px] text-slate-400">{new Date(entry.created_at).toLocaleString('fr')}</p></div><span className={`rounded-full px-2 py-0.5 font-bold ${entry.outcome === 'success' ? 'bg-emerald-100 text-emerald-800' : entry.outcome === 'denied' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{entry.outcome}</span></div>)}</div></div>
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="flex items-center gap-2 font-black"><ShieldAlert className="text-rose-600" size={19} />Contrôles d’accès</h3><dl className="mt-4 space-y-3 text-xs"><div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Actions refusées auditées</dt><dd className="mt-1 text-2xl font-black text-amber-700">{deniedActions}</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Clé privilégiée dans le navigateur</dt><dd className="mt-1 font-black text-emerald-700">Aucune</dd></div><div className="rounded-xl bg-slate-50 p-3"><dt className="text-slate-500">Source de rôle</dt><dd className="mt-1 font-black text-slate-900">Profil vérifié côté serveur</dd></div></dl></div>
          </div>
        </section>
      )}

      {activeTab === 'users' && <AdminUsersTab users={users} audit={audit} actor={actor} loading={loading} error={error} notice={notice} onRefresh={loadDirectory} onCreate={createUser} onUpdate={updateUser} onDelete={deleteUser} />}
      {activeTab === 'moderation' && <AdminModerationTab moderationItems={moderationItems} reports={userReports} mokTrustAudits={mokTrustAudits} onReload={onLocalReload} />}
      {activeTab === 'settings' && <AdminPlatformSettingsTab detailedSettings={detailedSettings} onReload={onLocalReload} />}
      {activeTab === 'ai-modules' && <AdminAIAndModulesTab aiProviders={aiProviders} serverProviders={serverProviders} modules={modules} onReload={onLocalReload} onRefreshServer={loadDirectory} />}
      {activeTab === 'templates' && <AdminTemplatesAndStampsTab templates={templates} signatures={signatures} stamps={stamps} onReload={onLocalReload} />}
      {activeTab === 'workflows' && <AdminWorkflowsAndBackupTab workflows={workflows} systemConfig={systemConfig} onReload={onLocalReload} />}
      {activeTab === 'logs' && <AdminLogsAndBroadcastTab logs={realLogs} notifications={notifications} onReload={onLocalReload} />}
    </div>
  );
};
