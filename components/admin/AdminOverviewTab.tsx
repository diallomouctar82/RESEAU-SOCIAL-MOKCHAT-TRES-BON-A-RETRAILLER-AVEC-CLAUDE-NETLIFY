import React, { useState } from 'react';
import { 
  Shield, 
  Users, 
  BrainCircuit, 
  HardDrive, 
  FileText, 
  GitBranch, 
  Bell, 
  Activity, 
  Server, 
  Lock, 
  Globe, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Wifi, 
  Database, 
  RefreshCw, 
  Layers, 
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { AdminSystemConfig, AdminUserRecord, PlatformModuleConfig, SystemAuditLog } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';
import { cloudService } from '../../services/cloud';

interface AdminOverviewTabProps {
  systemConfig: AdminSystemConfig;
  users: AdminUserRecord[];
  modules: PlatformModuleConfig[];
  logs: SystemAuditLog[];
  onNavigateTab: (tabId: string) => void;
}

export const AdminOverviewTab: React.FC<AdminOverviewTabProps> = ({
  systemConfig,
  users,
  modules,
  logs,
  onNavigateTab
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [config, setConfig] = useState(systemConfig);

  const activeUsersCount = users.filter(u => u.status === 'active').length;
  const activeModulesCount = modules.filter(m => m.isEnabled && !m.inMaintenance).length;
  const activeSecurityAlerts = logs.filter(l => l.level === 'security' || l.level === 'error').length;

  const handleToggleMaintenance = () => {
    const updated = !config.maintenanceMode;
    adminConfigService.updateSystemConfig({ maintenanceMode: updated });
    setConfig(prev => ({ ...prev, maintenanceMode: updated }));
  };

  const handleToggleRegistration = () => {
    const updated = !config.registrationOpen;
    adminConfigService.updateSystemConfig({ registrationOpen: updated });
    setConfig(prev => ({ ...prev, registrationOpen: updated }));
  };

  const handleToggleHighSecurity = () => {
    const updated = !config.highSecurityMode;
    adminConfigService.updateSystemConfig({ highSecurityMode: updated });
    setConfig(prev => ({ ...prev, highSecurityMode: updated }));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Super-Admin Status Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl shadow-xl border border-blue-900/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Console Souveraine Actuelle
              </span>
              <span className="text-xs text-slate-400">Nœud : {config.primaryNode}</span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight">{config.systemName}</h2>
            <p className="text-sm text-slate-300 mt-1">
              Supervision unifiée de l'écosystème : Utilisateurs, Moteurs IA, Lettres officielles, Cachets et Flux opérationnels.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleToggleMaintenance}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                config.maintenanceMode 
                  ? 'bg-amber-500 text-slate-950 ring-4 ring-amber-500/30 font-black' 
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <AlertTriangle size={15} />
              {config.maintenanceMode ? 'Mode Maintenance ACTIF' : 'Mode Maintenance : OFF'}
            </button>

            <button
              onClick={handleToggleHighSecurity}
              className={`px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${
                config.highSecurityMode 
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400 font-bold' 
                  : 'bg-white/10 hover:bg-white/20 text-slate-300 border border-white/10'
              }`}
            >
              <Lock size={15} />
              {config.highSecurityMode ? 'Haute Sécurité : ACTIVE' : 'Haute Sécurité : Standard'}
            </button>

            <button
              onClick={handleRefresh}
              className={`p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all ${isRefreshing ? 'animate-spin' : ''}`}
              title="Rafraîchir les métriques"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div 
          onClick={() => onNavigateTab('users')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Users size={22} />
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              {activeUsersCount} Actifs
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">{users.length}</div>
          <div className="text-xs font-bold text-slate-500 mt-1 flex items-center justify-between">
            <span>Citoyens & Experts</span>
            <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 text-blue-600 transition" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('ai-modules')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <BrainCircuit size={22} />
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700">
              Gemini 2.5 Core
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">5 Fournisseurs</div>
          <div className="text-xs font-bold text-slate-500 mt-1 flex items-center justify-between">
            <span>Passerelle IA & Modèles</span>
            <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 text-indigo-600 transition" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('templates')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
              <FileText size={22} />
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800">
              4 Sceaux Actifs
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">Signatures & Lettres</div>
          <div className="text-xs font-bold text-slate-500 mt-1 flex items-center justify-between">
            <span>Actes & Modèles Certifiés</span>
            <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 text-amber-600 transition" />
          </div>
        </div>

        <div 
          onClick={() => onNavigateTab('workflows')}
          className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group"
        >
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <GitBranch size={22} />
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700">
              {activeModulesCount} Modules ON
            </span>
          </div>
          <div className="text-3xl font-black text-slate-900">Workflows & Sync</div>
          <div className="text-xs font-bold text-slate-500 mt-1 flex items-center justify-between">
            <span>Local-First & Sauvegardes</span>
            <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 text-emerald-600 transition" />
          </div>
        </div>
      </div>

      {/* Grid: Infrastructure & Modules Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Infrastructure & Node Topology */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Server className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900 text-base">Topologie & Serveurs</h3>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
              Opérationnel
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Nœud Primaire (Europe)</p>
                <p className="text-slate-500 text-[11px]">{config.primaryNode}</p>
              </div>
              <span className="font-mono font-bold text-emerald-600">LATENCE 18ms</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Nœud Relais (Afrique de l'Ouest)</p>
                <p className="text-slate-500 text-[11px]">{config.fallbackNode}</p>
              </div>
              <span className="font-mono font-bold text-blue-600">STANDBY / SYNC</span>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 flex justify-between items-center">
              <div>
                <p className="font-bold text-slate-800">Dernière Sauvegarde Système</p>
                <p className="text-slate-500 text-[11px]">{config.lastBackupDate}</p>
              </div>
              <span className="font-mono font-bold text-slate-700">TOUTES LES {config.cloudBackupIntervalHours}H</span>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
              <span>Stockage Utilisé (IndexedDB Local-First)</span>
              <span className="font-bold text-slate-800">{cloudService.formatBytes(config.totalStorageUsedBytes)}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full w-[28%] rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Middle: Modules Status Matrix */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Layers className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900 text-base">État des Modules Piliers</h3>
            </div>
            <button 
              onClick={() => onNavigateTab('ai-modules')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Gérer
            </button>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {modules.slice(0, 6).map(mod => (
              <div key={mod.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 text-xs">
                <div className="flex items-center gap-2.5 truncate">
                  <span className={`w-2 h-2 rounded-full ${mod.isEnabled ? (mod.inMaintenance ? 'bg-amber-400' : 'bg-emerald-500') : 'bg-slate-300'}`}></span>
                  <span className="font-bold text-slate-800 truncate">{mod.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-slate-500">{mod.activeSessionsCount} usagers</span>
                  <span className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] ${
                    mod.isEnabled ? (mod.inMaintenance ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800') : 'bg-slate-200 text-slate-600'
                  }`}>
                    {mod.isEnabled ? (mod.inMaintenance ? 'MAINT.' : 'ACTIF') : 'OFF'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('ai-modules')}
            className="w-full py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition text-center"
          >
            Voir les {modules.length} modules de la plateforme
          </button>
        </div>

        {/* Right: Security Logs & Audit Stream */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="text-blue-600" size={20} />
              <h3 className="font-bold text-slate-900 text-base">Flux d'Audit & Sécurité</h3>
            </div>
            <button 
              onClick={() => onNavigateTab('logs')}
              className="text-xs font-bold text-blue-600 hover:text-blue-700"
            >
              Tous ({logs.length})
            </button>
          </div>

          <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className={`px-1.5 py-0.2 rounded font-bold uppercase ${
                    log.level === 'security' ? 'bg-purple-100 text-purple-800' :
                    log.level === 'warning' ? 'bg-amber-100 text-amber-800' :
                    log.level === 'error' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {log.level}
                  </span>
                  <span className="text-slate-400 font-mono">{log.timestamp.split(' ')[1]}</span>
                </div>
                <p className="text-xs text-slate-800 font-medium line-clamp-2 leading-relaxed">{log.message}</p>
                <p className="text-[10px] text-slate-500 font-mono">Acteur : {log.actor}</p>
              </div>
            ))}
          </div>

          <button
            onClick={() => onNavigateTab('logs')}
            className="w-full py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold transition text-center"
          >
            Consulter les journaux d'audit complets
          </button>
        </div>
      </div>
    </div>
  );
};
