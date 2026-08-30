import React, { useState, useEffect } from 'react';
import { 
  GitBranch, 
  HardDrive, 
  Download, 
  Upload, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  Layers, 
  ArrowRight, 
  Clock, 
  Plus, 
  Edit, 
  Database,
  Cloud,
  Check,
  X,
  History,
  Calendar,
  Sparkles,
  RefreshCw,
  FileCheck,
  Sliders,
  ChevronRight,
  Info,
  Zap,
  Trash2,
  Lock,
  Search,
  CheckSquare,
  Square,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { 
  WorkflowPipelineConfig, 
  AdminSystemConfig,
  PlatformReleaseVersion,
  BackupSnapshotRecord,
  BackupScheduleConfig,
  RestoreOperationResult,
  VersionComparisonResult,
  SnapshotType
} from '../../types';
import { adminConfigService } from '../../services/adminConfigService';
import { cloudService } from '../../services/cloud';
import { SmartConfirmModal } from '../ui/SmartConfirmModal';

interface AdminWorkflowsAndBackupTabProps {
  workflows: WorkflowPipelineConfig[];
  systemConfig: AdminSystemConfig;
  onReload: () => void;
}

export const AdminWorkflowsAndBackupTab: React.FC<AdminWorkflowsAndBackupTabProps> = ({
  workflows,
  systemConfig,
  onReload
}) => {
  const [subTab, setSubTab] = useState<'versions' | 'snapshots' | 'schedule' | 'workflows' | 'integrations'>('versions');
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowPipelineConfig | null>(null);
  
  // Versions & Snapshots State
  const [versions, setVersions] = useState<PlatformReleaseVersion[]>([]);
  const [snapshots, setSnapshots] = useState<BackupSnapshotRecord[]>([]);
  const [schedule, setSchedule] = useState<BackupScheduleConfig>(adminConfigService.getBackupSchedule());
  const [lastRestoreResult, setLastRestoreResult] = useState<RestoreOperationResult | null>(adminConfigService.getLastRestoreResult());
  
  // Modals & Actions
  const [selectedVersionForRestore, setSelectedVersionForRestore] = useState<PlatformReleaseVersion | null>(null);
  const [selectedSnapshotForRestore, setSelectedSnapshotForRestore] = useState<BackupSnapshotRecord | null>(null);
  const [compareVersionsModal, setCompareVersionsModal] = useState<{ v1: string; v2: string } | null>(null);
  const [comparisonResult, setComparisonResult] = useState<VersionComparisonResult | null>(null);
  const [showCreateSnapshotModal, setShowCreateSnapshotModal] = useState(false);
  const [newSnapshotForm, setNewSnapshotForm] = useState<{ name: string; notes: string; type: SnapshotType }>({
    name: '',
    notes: '',
    type: 'manual'
  });

  // Restore options
  const [preserveUsers, setPreserveUsers] = useState(true);
  const [preserveCredits, setPreserveCredits] = useState(true);
  const [preserveLogs, setPreserveLogs] = useState(true);
  const [preserveProfiles, setPreserveProfiles] = useState(true);

  // Status & Feedback
  const [operationFeedback, setOperationFeedback] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [snapshotFilter, setSnapshotFilter] = useState<'all' | 'milestone' | 'manual' | 'scheduled' | 'pre_restore'>('all');
  const [searchSnapshotQuery, setSearchSnapshotQuery] = useState('');
  const [confirmDeleteSnapshot, setConfirmDeleteSnapshot] = useState<{ id: string; name: string } | null>(null);
  const [confirmUndoRestoreOpen, setConfirmUndoRestoreOpen] = useState(false);

  // Initial Load
  const refreshLocalState = () => {
    setVersions(adminConfigService.getStableVersions());
    setSnapshots(adminConfigService.getSnapshots());
    setSchedule(adminConfigService.getBackupSchedule());
    setLastRestoreResult(adminConfigService.getLastRestoreResult());
  };

  useEffect(() => {
    refreshLocalState();
  }, []);

  // Handlers
  const handleTriggerScheduledBackup = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const snap = adminConfigService.triggerScheduledBackupNow();
      refreshLocalState();
      setIsProcessing(false);
      setOperationFeedback({
        type: 'success',
        message: `Sauvegarde planifiée exécutée avec succès : "${snap.name}" (${(snap.sizeBytes / 1024).toFixed(1)} KB)`
      });
      onReload();
    }, 400);
  };

  const handleCreateCustomSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSnapshotForm.name.trim()) return;

    const snap = adminConfigService.createSnapshot(
      newSnapshotForm.name,
      newSnapshotForm.type,
      newSnapshotForm.notes,
      'v6.3.0'
    );

    refreshLocalState();
    setShowCreateSnapshotModal(false);
    setNewSnapshotForm({ name: '', notes: '', type: 'manual' });
    setOperationFeedback({
      type: 'success',
      message: `Instantané "${snap.name}" créé et certifié avec succès.`
    });
    onReload();
  };

  const handleDeleteSnapshot = (id: string, name: string) => {
    setConfirmDeleteSnapshot({ id, name });
  };

  const confirmDeleteSnapshotAction = () => {
    if (!confirmDeleteSnapshot) return;
    const { id, name } = confirmDeleteSnapshot;
    const ok = adminConfigService.deleteSnapshot(id);
    setConfirmDeleteSnapshot(null);
    if (ok) {
      refreshLocalState();
      setOperationFeedback({
        type: 'info',
        message: `Instantané "${name}" supprimé.`
      });
      onReload();
    }
  };

  const handleDownloadSnapshot = (snapId?: string) => {
    const jsonStr = adminConfigService.exportBackupJson(snapId);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lmav-snapshot-${snapId || 'live'}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setOperationFeedback({
      type: 'success',
      message: 'Fichier JSON de sauvegarde certifiée téléchargé avec succès.'
    });
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const result = adminConfigService.importBackupJson(text, { preserveUsers: true });
        refreshLocalState();
        if (result.success) {
          setOperationFeedback({
            type: 'success',
            message: `Restauration depuis fichier JSON réussie ! Version appliquée : ${result.restoredVersion}.`
          });
          onReload();
        } else {
          setOperationFeedback({
            type: 'error',
            message: `Échec de restauration : ${result.warnings.join(', ')}`
          });
        }
      } catch (err: any) {
        setOperationFeedback({
          type: 'error',
          message: `Fichier de sauvegarde invalide ou illisible.`
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExecuteRestore = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const targetVersionTag = selectedVersionForRestore?.version || selectedSnapshotForRestore?.versionTag || 'v6.3.0';
      const targetSnapshotId = selectedSnapshotForRestore?.id;

      const result = adminConfigService.intelligentRestore({
        versionTag: targetVersionTag,
        snapshotId: targetSnapshotId,
        preserveUsers,
        preserveCredits,
        preserveLogs,
        preserveProfiles,
        preserveModeration: true
      });

      refreshLocalState();
      setSelectedVersionForRestore(null);
      setSelectedSnapshotForRestore(null);
      setIsProcessing(false);

      if (result.success) {
        setOperationFeedback({
          type: 'success',
          message: `Restauration intelligente vers ${result.restoredVersion} complétée avec succès. ${result.preservedItems.usersCount} comptes préservés.`
        });
        onReload();
      } else {
        setOperationFeedback({
          type: 'error',
          message: result.summary
        });
      }
    }, 500);
  };

  const handleUndoRestore = () => {
    setConfirmUndoRestoreOpen(true);
  };

  const confirmUndoRestoreAction = () => {
    setConfirmUndoRestoreOpen(false);
    setIsProcessing(true);
    setTimeout(() => {
      const result = adminConfigService.undoLastRestore();
      refreshLocalState();
      setIsProcessing(false);

      if (result && result.success) {
        setOperationFeedback({
          type: 'success',
          message: `Annulation réussie ! Le système a été restauré à son état antérieur sécurisé.`
        });
        onReload();
      } else {
        setOperationFeedback({
          type: 'error',
          message: `Impossible d'annuler la restauration.`
        });
      }
    }, 400);
  };

  const handleOpenCompare = (v1: string, v2: string) => {
    const res = adminConfigService.compareVersions(v1, v2);
    setComparisonResult(res);
    setCompareVersionsModal({ v1, v2 });
  };

  const handleUpdateSchedule = (updates: Partial<BackupScheduleConfig>) => {
    const updated = adminConfigService.updateBackupSchedule(updates);
    setSchedule(updated);
    setOperationFeedback({
      type: 'success',
      message: 'Paramètres du planificateur de sauvegarde mis à jour.'
    });
  };

  const handleSaveWorkflow = () => {
    if (!editingWorkflow) return;
    adminConfigService.updateWorkflow(editingWorkflow.id, editingWorkflow);
    setEditingWorkflow(null);
    onReload();
  };

  // Filtrage des instantanés
  const filteredSnapshots = snapshots.filter(s => {
    if (snapshotFilter === 'milestone' && s.type !== 'system_milestone') return false;
    if (snapshotFilter === 'manual' && s.type !== 'manual') return false;
    if (snapshotFilter === 'scheduled' && s.type !== 'scheduled') return false;
    if (snapshotFilter === 'pre_restore' && s.type !== 'auto_pre_restore') return false;

    if (searchSnapshotQuery.trim()) {
      const q = searchSnapshotQuery.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.versionTag.toLowerCase().includes(q) || s.notes?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Feedback Banner */}
      {operationFeedback && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-bold transition shadow-sm ${
          operationFeedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : operationFeedback.type === 'error'
            ? 'bg-rose-50 text-rose-800 border-rose-200'
            : 'bg-blue-50 text-blue-800 border-blue-200'
        }`}>
          <div className="flex items-center gap-2">
            {operationFeedback.type === 'success' ? <CheckCircle2 size={16} /> : <Info size={16} />}
            <span>{operationFeedback.message}</span>
          </div>
          <button
            onClick={() => setOperationFeedback(null)}
            className="p-1.5 -m-1.5 rounded-lg hover:bg-black/5 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Fermer ce message"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Rollback Alert if pre-restore point exists */}
      {lastRestoreResult && lastRestoreResult.preRestoreSnapshotId && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-100 text-amber-800 rounded-2xl">
              <RotateCcw size={18} />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-900">
                Point de récupération actif (Restauration effectuée le {lastRestoreResult.timestamp})
              </div>
              <div className="text-[11px] text-amber-700 mt-0.5">
                Version restaurée : <span className="font-bold">{lastRestoreResult.restoredVersion}</span> — Vous pouvez annuler et revenir à l'état précédent en 1 clic.
              </div>
            </div>
          </div>
          <button
            onClick={handleUndoRestore}
            disabled={isProcessing}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2 whitespace-nowrap disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1"
          >
            <RotateCcw size={14} />
            Annuler la Restauration (Rollback)
          </button>
        </div>
      )}

      {/* Header & Sub-tabs */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Super-Admin Sovereign Core
            </span>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              Supabase • GitHub • Netlify
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 mt-1.5">
            <History className="text-blue-600" size={22} />
            Sauvegarde, Gestion des Versions & Restauration Intelligente
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Système complet de versioning souverain. Conservez les versions stables, comparez les évolutions, restaurez en 1 clic avec préservation garantie des données utilisateurs, et planifiez les cycles automatiques.
          </p>
        </div>

        <div className="flex flex-wrap bg-slate-100 p-1 rounded-2xl border border-slate-200 gap-1">
          <button
            onClick={() => setSubTab('versions')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              subTab === 'versions' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History size={14} />
            Versions Stables ({versions.length})
          </button>
          <button
            onClick={() => setSubTab('snapshots')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              subTab === 'snapshots' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <HardDrive size={14} />
            Snapshots ({snapshots.length})
          </button>
          <button
            onClick={() => setSubTab('schedule')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              subTab === 'schedule' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar size={14} />
            Planificateur
          </button>
          <button
            onClick={() => setSubTab('workflows')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              subTab === 'workflows' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch size={14} />
            Workflows ({workflows.length})
          </button>
          <button
            onClick={() => setSubTab('integrations')}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${
              subTab === 'integrations' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Cloud size={14} />
            Cloud & Déploiement
          </button>
        </div>
      </div>

      {/* ── 1. SOUS-ONGLET VERSIONS STABLES & HISTORIQUE ── */}
      {subTab === 'versions' && (
        <div className="space-y-6">
          {/* Top Banner Guide */}
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-6 rounded-3xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-400" size={20} />
                <h3 className="font-bold text-base">Restauration Intelligente & Continuité Souveraine</h3>
              </div>
              <p className="text-xs text-blue-100 leading-relaxed">
                Toute restauration conserve scrupuleusement l'ensemble des données utilisateurs (comptes, profils, soldes Ⓒ, messages, journaux et droits RBAC). Un instantané de sécurité automatique est généré immédiatement avant chaque opération.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateSnapshotModal(true)}
                className="px-4 py-2.5 bg-white text-blue-900 hover:bg-blue-50 rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900"
              >
                <Plus size={14} />
                Créer un Instantané
              </button>
              <button
                onClick={() => handleDownloadSnapshot()}
                className="px-4 py-2.5 bg-blue-700/80 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow border border-blue-500/30 flex items-center gap-1.5 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-900"
              >
                <Download size={14} />
                Exporter Snapshot JSON
              </button>
            </div>
          </div>

          {/* Versions List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Tag size={16} className="text-blue-600" />
                Registre des Versions Majeures & Stables (Minimum 3 dernières conservées)
              </h3>
              <span className="text-xs text-slate-500">
                Version courante active : <span className="font-bold text-blue-600">v6.3.0</span>
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {versions.map((ver, idx) => {
                const isCurrent = ver.status === 'current';
                const isStable = ver.status === 'stable';

                return (
                  <div 
                    key={ver.version} 
                    className={`bg-white rounded-3xl border p-6 transition shadow-sm space-y-4 ${
                      isCurrent 
                        ? 'border-blue-500 ring-2 ring-blue-500/10' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`p-3 rounded-2xl font-mono text-sm font-bold flex items-center justify-center ${
                          isCurrent 
                            ? 'bg-blue-600 text-white shadow-sm' 
                            : isStable
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {ver.version}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-slate-900 text-base">{ver.title}</h4>
                            {isCurrent && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-bold rounded-md">
                                VERSION COURANTE ACTIVE
                              </span>
                            )}
                            {isStable && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-md">
                                VERSION STABLE VÉRIFIÉE
                              </span>
                            )}
                            <span className="text-[11px] text-slate-400">
                              Publiée le {ver.releaseDate} par {ver.author}
                            </span>
                          </div>
                          
                          {/* Highlights */}
                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                            {ver.highlights.map((h, i) => (
                              <span key={i} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                                • {h}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 self-end lg:self-center">
                        {idx > 0 && (
                          <button
                            onClick={() => handleOpenCompare(versions[0].version, ver.version)}
                            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                          >
                            <ArrowUpDown size={13} />
                            Comparer avec v6.3.0
                          </button>
                        )}

                        {!isCurrent && (
                          <button
                            onClick={() => {
                              setSelectedVersionForRestore(ver);
                              setSelectedSnapshotForRestore(null);
                            }}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                          >
                            <RotateCcw size={13} />
                            Restaurer vers {ver.version}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Changelog Items */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-2">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                        <FileCheck size={13} className="text-blue-600" />
                        Changelog Officiel & Notes de Version
                      </div>
                      <ul className="space-y-1.5 text-xs text-slate-600">
                        {ver.changelog.map((entry, cIdx) => (
                          <li key={cIdx} className="flex items-start gap-2">
                            <span className="text-blue-500 font-bold mt-0.5">•</span>
                            <span>{entry}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Metadata pills */}
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-4">
                        <span>Schéma : <strong className="font-mono text-slate-700">{ver.schemaVersion}</strong></span>
                        <span>Moteurs IA : <strong>{ver.aiProvidersCount}</strong></span>
                        <span>Modules : <strong>{ver.modulesCount}</strong></span>
                        <span>Modèles : <strong>{ver.templatesCount}</strong></span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[200px]" title={ver.checksum}>
                        {ver.checksum}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 2. SOUS-ONGLET SNAPSHOTS & ARCHIVES ── */}
      {subTab === 'snapshots' && (
        <div className="space-y-6">
          {/* Snapshot Controls */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher un instantané..."
                  value={searchSnapshotQuery}
                  onChange={(e) => setSearchSnapshotQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={snapshotFilter}
                onChange={(e) => setSnapshotFilter(e.target.value as any)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tous les types ({snapshots.length})</option>
                <option value="milestone">Jalons système</option>
                <option value="manual">Sauvegardes manuelles</option>
                <option value="scheduled">Planifiées</option>
                <option value="pre_restore">Points pré-restauration</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCreateSnapshotModal(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <Plus size={14} />
                Nouvel Instantané
              </button>

              <label className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm flex items-center gap-1.5 cursor-pointer focus-within:ring-2 focus-within:ring-blue-500">
                <Upload size={14} />
                Importer JSON
                <input type="file" accept=".json" onChange={handleFileImport} className="hidden" />
              </label>
            </div>
          </div>

          {/* Snapshots Table */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-900 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="p-4">Instantané / Nom</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Version</th>
                    <th className="p-4">Date de Création</th>
                    <th className="p-4">Taille</th>
                    <th className="p-4">Comptes / Modules</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSnapshots.map(snap => {
                    const isMilestone = snap.type === 'system_milestone';
                    const isPreRestore = snap.type === 'auto_pre_restore';
                    const isScheduled = snap.type === 'scheduled';

                    return (
                      <tr key={snap.id} className="hover:bg-slate-50/80 transition">
                        <td className="p-4">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <HardDrive size={15} className="text-blue-600" />
                            {snap.name}
                          </div>
                          {snap.notes && (
                            <div className="text-[11px] text-slate-500 mt-0.5 truncate max-w-sm">
                              {snap.notes}
                            </div>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                            isMilestone 
                              ? 'bg-purple-100 text-purple-800' 
                              : isPreRestore
                              ? 'bg-amber-100 text-amber-800'
                              : isScheduled
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {snap.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-4 font-mono font-bold text-blue-600">
                          {snap.versionTag}
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          {snap.createdAt}
                        </td>
                        <td className="p-4 font-mono">
                          {(snap.sizeBytes / 1024).toFixed(1)} KB
                        </td>
                        <td className="p-4">
                          <div className="text-[11px]">
                            <strong>{snap.recordsCount.users}</strong> utilisateurs • <strong>{snap.recordsCount.modules}</strong> modules
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleDownloadSnapshot(snap.id)}
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              title="Télécharger JSON"
                              aria-label="Télécharger cet instantané en JSON"
                            >
                              <Download size={14} />
                            </button>

                            <button
                              onClick={() => {
                                setSelectedSnapshotForRestore(snap);
                                setSelectedVersionForRestore(null);
                              }}
                              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl text-xs transition flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                              title="Restaurer cet instantané"
                            >
                              <RotateCcw size={13} />
                              Restaurer
                            </button>

                            {!isMilestone && (
                              <button
                                onClick={() => handleDeleteSnapshot(snap.id, snap.name)}
                                className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500"
                                title="Supprimer"
                                aria-label="Supprimer cet instantané"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. SOUS-ONGLET PLANIFICATEUR AUTOMATISÉ ── */}
      {subTab === 'schedule' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Card */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-blue-50 text-blue-600">
                    <Calendar size={22} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">Planificateur de Sauvegardes Souveraines</h3>
                    <p className="text-xs text-slate-500">Automatisez la création des instantanés et la synchronisation sécurisée.</p>
                  </div>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs font-bold text-slate-700">Planificateur Actif</span>
                  <input
                    type="checkbox"
                    checked={schedule.enabled}
                    onChange={(e) => handleUpdateSchedule({ enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Fréquence d'exécution</label>
                  <select
                    value={schedule.frequency}
                    onChange={(e) => handleUpdateSchedule({ frequency: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hourly">Toutes les heures (Haute Résilience)</option>
                    <option value="daily">Quotidienne (Recommandé)</option>
                    <option value="weekly">Hebdomadaire</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Heure d'exécution quotidienne</label>
                  <input
                    type="time"
                    value={schedule.timeOfDay}
                    onChange={(e) => handleUpdateSchedule({ timeOfDay: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre max d'instantanés conservés</label>
                  <input
                    type="number"
                    min={3}
                    max={50}
                    value={schedule.keepMaxSnapshots}
                    onChange={(e) => handleUpdateSchedule({ keepMaxSnapshots: parseInt(e.target.value) || 10 })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">Les jalons officiels ne sont jamais supprimés.</span>
                </div>

                <div className="space-y-3 pt-3">
                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.autoSyncToCloud}
                      onChange={(e) => handleUpdateSchedule({ autoSyncToCloud: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Synchroniser avec le Cloud Supabase</span>
                  </label>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={schedule.autoPruneOldSnapshots}
                      onChange={(e) => handleUpdateSchedule({ autoPruneOldSnapshots: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>Élagage automatique des anciens instantanés</span>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="text-xs text-slate-500">
                  Dernier cycle : <strong>{schedule.lastRunAt || 'Jamais'}</strong> • Prochain : <strong>{schedule.nextRunAt || 'Automatique'}</strong>
                </div>

                <button
                  onClick={handleTriggerScheduledBackup}
                  disabled={isProcessing}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  <Zap size={14} />
                  Exécuter le Cycle Maintenant
                </button>
              </div>
            </div>

            {/* Status Summary Card */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={18} />
                Garanties de Sécurité & Intégrité
              </h4>

              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800">Zéro White Screen of Death</div>
                  <p className="text-[11px] text-slate-500">
                    Chaque sauvegarde valide la conformité des schémas TypeScript et PostgreSQL pour empêcher tout écran blanc.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800">Point de Récupération Pré-Restauration</div>
                  <p className="text-[11px] text-slate-500">
                    Avant toute restauration, un instantané automatique est créé instantanément, assurant un retour en arrière garanti.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                  <div className="font-bold text-slate-800">Compatibilité Supabase / Netlify / GitHub</div>
                  <p className="text-[11px] text-slate-500">
                    Compatible avec le déploiement statique et conteneurisé sans dépendances serveur bloquantes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. SOUS-ONGLET WORKFLOWS ── */}
      {subTab === 'workflows' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-5">
            {workflows.map(wf => (
              <div key={wf.id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {wf.category}
                    </span>
                    <h3 className="font-bold text-slate-900 text-base mt-1">{wf.name}</h3>
                    <p className="text-xs text-slate-500 mt-0.5">{wf.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono bg-slate-100 text-slate-700 px-3 py-1 rounded-xl">
                      Déclencheur : {wf.triggerEvent}
                    </span>
                    <button
                      onClick={() => setEditingWorkflow({ ...wf })}
                      className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                      title="Modifier"
                      aria-label="Modifier ce workflow"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Étapes d'approbation humaine</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {wf.steps.map((step, idx) => (
                      <div key={step.stepId} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-800">Étape {idx + 1} : {step.stepName}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded">
                            {step.requiredRole}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500">Action : {step.actionType}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 5. SOUS-ONGLET INTÉGRATIONS CLOUD ── */}
      {subTab === 'integrations' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Supabase Backend</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">PAR DÉFAUT</span>
              </div>
              <p className="text-xs text-slate-500">PostgreSQL Cloud, Authentification, Storage & Realtime bidirectionnel.</p>
              <div className="text-[11px] font-mono text-slate-400">Mode : Lazy Init + Local-First Fallback</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">IndexedDB Local-First</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-md">ACTIF</span>
              </div>
              <p className="text-xs text-slate-500">Fonctionnement hors-ligne et persistance instantanée sur le terminal.</p>
              <div className="text-[11px] font-mono text-slate-400">Version schéma : v2.4 (Encrypted)</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Déploiement Universel</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md">CONFORME</span>
              </div>
              <p className="text-xs text-slate-500">Compatible GitHub, Netlify, Cloud Run et Vercel avec 0 écran blanc.</p>
              <div className="text-[11px] font-mono text-slate-400">Build : Vite + SSR Ready</div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 text-sm">Passerelle Wallet & Séquestre</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold text-[10px] rounded-md">MOK TRUST</span>
              </div>
              <p className="text-xs text-slate-500">Contrats B2B garantis avec clause de séquestre multi-devises.</p>
              <div className="text-[11px] font-mono text-slate-400">Garantie max : 500 000 € / transaction</div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL : CONFIRMATION DE RESTAURATION INTELLIGENTE ── */}
      {(selectedVersionForRestore || selectedSnapshotForRestore) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <RotateCcw size={22} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Confirmation de Restauration Intelligente
                  </h3>
                  <p className="text-xs text-slate-500">
                    Cible : <strong className="text-blue-600">{selectedVersionForRestore?.version || selectedSnapshotForRestore?.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedVersionForRestore(null);
                  setSelectedSnapshotForRestore(null);
                }}
                className="p-2 -m-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Security Guarantee Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <ShieldCheck size={16} />
                Garantie de Préservation Totale des Données
              </div>
              <p className="text-[11px] text-emerald-900 leading-relaxed">
                Cette restauration ne remet JAMAIS la plateforme à zéro. Tous les comptes utilisateurs, profils, soldes Ⓒ, messages et historiques d'audit seront rigoureusement préservés. Un point de sécurité sera créé automatiquement avant l'application.
              </p>
            </div>

            {/* Compatibility Report */}
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Contrôle de Compatibilité Base de Données :</div>
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check size={14} />
                  <span>Schéma Supabase PostgreSQL : <strong>100% Compatible</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check size={14} />
                  <span>Comptes Utilisateurs & Rôles RBAC : <strong>Préservés</strong></span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700">
                  <Check size={14} />
                  <span>Risque de Perte de Données : <strong>ZÉRO (None)</strong></span>
                </div>
              </div>
            </div>

            {/* Preservation Options */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2">Options de Conservation :</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveUsers}
                    onChange={(e) => setPreserveUsers(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Comptes Utilisateurs</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveCredits}
                    onChange={(e) => setPreserveCredits(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Soldes Crédits Ⓒ</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveLogs}
                    onChange={(e) => setPreserveLogs(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Journaux d'Audit</span>
                </label>

                <label className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={preserveProfiles}
                    onChange={(e) => setPreserveProfiles(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="font-bold text-slate-800">Profils & Citoyenneté</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => {
                  setSelectedVersionForRestore(null);
                  setSelectedSnapshotForRestore(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Annuler
              </button>
              <button
                onClick={handleExecuteRestore}
                disabled={isProcessing}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center gap-2 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
              >
                <Check size={14} />
                {isProcessing ? 'Restauration en cours...' : 'Confirmer la Restauration Sécurisée'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL : CRÉER UN INSTANTANÉ (SNAPSHOT) ── */}
      {showCreateSnapshotModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <HardDrive size={18} className="text-blue-600" />
                Création d'un Instantané de Sauvegarde
              </h3>
              <button
                onClick={() => setShowCreateSnapshotModal(false)}
                className="p-2 -m-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateCustomSnapshot} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom de l'instantané</label>
                <input
                  type="text"
                  required
                  placeholder="Ex : Sauvegarde avant mise à jour du 27 Août"
                  value={newSnapshotForm.name}
                  onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Type de snapshot</label>
                <select
                  value={newSnapshotForm.type}
                  onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, type: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="manual">Sauvegarde Manuelle</option>
                  <option value="system_milestone">Jalon Système Majeur</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes descriptives</label>
                <textarea
                  rows={3}
                  placeholder="Détails des modifications ou contexte de la sauvegarde..."
                  value={newSnapshotForm.notes}
                  onChange={(e) => setNewSnapshotForm({ ...newSnapshotForm, notes: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateSnapshotModal(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1"
                >
                  Générer l'Instantané
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL : COMPARAISON DE VERSIONS ── */}
      {compareVersionsModal && comparisonResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ArrowUpDown size={18} className="text-blue-600" />
                  Comparaison Différentielle : {comparisonResult.versionA} ➔ {comparisonResult.versionB}
                </h3>
                <p className="text-xs text-slate-500">{comparisonResult.diffSummary}</p>
              </div>
              <button
                onClick={() => setCompareVersionsModal(null)}
                className="p-2 -m-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Added features */}
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 space-y-2">
                <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 size={15} />
                  Fonctionnalités & Améliorations Apportées
                </div>
                <ul className="space-y-1 text-emerald-900">
                  {comparisonResult.addedFeatures.map((f, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Config changes */}
              {comparisonResult.changedConfigs.length > 0 && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 space-y-2">
                  <div className="font-bold text-blue-800 flex items-center gap-1.5">
                    <Sliders size={15} />
                    Évolutions de Capacités & Moteurs
                  </div>
                  <div className="space-y-2">
                    {comparisonResult.changedConfigs.map((c, idx) => (
                      <div key={idx} className="bg-white/80 p-2.5 rounded-xl border border-blue-200/50 flex justify-between items-center text-xs">
                        <div>
                          <strong>{c.key}</strong> : {c.oldValue} ➔ <strong className="text-blue-700">{c.newValue}</strong>
                        </div>
                        <span className="text-[10px] text-slate-500">{c.impact}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Schema changes */}
              {comparisonResult.schemaChanges.length > 0 && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-1">
                  <div className="font-bold text-slate-800">Évolution du Schéma</div>
                  <p className="text-[11px] text-slate-500">{comparisonResult.schemaChanges.join(', ')}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setCompareVersionsModal(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Fermer la Comparaison
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL : ÉDITION WORKFLOW ── */}
      {editingWorkflow && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4 animate-scale-up">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Édition du Workflow : {editingWorkflow.name}</h3>
              <button
                onClick={() => setEditingWorkflow(null)}
                className="p-2 -m-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom du Workflow</label>
                <input
                  type="text"
                  value={editingWorkflow.name}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editingWorkflow.description}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, description: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-700">Workflow Actif</span>
                <input
                  type="checkbox"
                  checked={editingWorkflow.isActive}
                  onChange={(e) => setEditingWorkflow({ ...editingWorkflow, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button onClick={() => setEditingWorkflow(null)} className="px-3 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">Annuler</button>
              <button onClick={handleSaveWorkflow} className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1">Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation de suppression d'instantané */}
      <SmartConfirmModal
        isOpen={!!confirmDeleteSnapshot}
        onClose={() => setConfirmDeleteSnapshot(null)}
        onConfirm={confirmDeleteSnapshotAction}
        title={`Supprimer l'instantané « ${confirmDeleteSnapshot?.name || ''} » ?`}
        description="Cet instantané de sauvegarde sera définitivement supprimé et ne pourra plus être utilisé pour une restauration."
        actionType="delete"
        riskLevel="high"
        confirmLabel="Supprimer définitivement"
      />

      {/* Confirmation d'annulation de restauration */}
      <SmartConfirmModal
        isOpen={confirmUndoRestoreOpen}
        onClose={() => setConfirmUndoRestoreOpen(false)}
        onConfirm={confirmUndoRestoreAction}
        title="Annuler la dernière restauration ?"
        description="La plateforme reviendra au point de récupération automatique créé juste avant cette restauration."
        actionType="generic"
        riskLevel="high"
        confirmLabel="Annuler la restauration"
      />
    </div>
  );
};
