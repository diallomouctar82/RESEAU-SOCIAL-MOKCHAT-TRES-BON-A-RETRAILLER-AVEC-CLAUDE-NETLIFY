import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserPlus, 
  Shield, 
  CheckCircle, 
  XCircle, 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash2, 
  CreditCard, 
  Key, 
  Check, 
  X, 
  Sparkles,
  Award,
  Globe,
  Coins,
  RefreshCw,
  Wrench,
  Download,
  FileSpreadsheet,
  FileCode,
  History,
  AlertTriangle,
  UserCheck,
  UserX,
  Plus,
  Minus,
  Activity,
  Database,
  Cloud,
  CheckCircle2,
  Lock,
  Eye,
  Sliders
} from 'lucide-react';
import { AdminUserRecord, SystemAuditLog } from '../../types';
import { adminConfigService } from '../../services/adminConfigService';
import { supabaseService } from '../../services/supabaseClient';

interface AdminUsersTabProps {
  users: AdminUserRecord[];
  onReload: () => void;
}

const ALL_PERMISSIONS = [
  { id: 'all', label: 'Accès Total Super-Admin', category: 'Système' },
  { id: 'manage_users', label: 'Gestion des Utilisateurs & Rôles', category: 'Sécurité' },
  { id: 'manage_ai', label: 'Configuration IA & Fournisseurs', category: 'Système' },
  { id: 'manage_modules', label: 'Activation/Désactivation Modules', category: 'Système' },
  { id: 'manage_moderation', label: 'Modération & Signalements', category: 'Sécurité' },
  { id: 'manage_templates', label: 'Édition des Modèles de Lettres', category: 'Juridique' },
  { id: 'sign_documents', label: 'Apposition de Signature Officielle', category: 'Juridique' },
  { id: 'stamp_documents', label: 'Apposition de Cachet Officiel', category: 'Juridique' },
  { id: 'manage_workflows', label: 'Orchestration des Workflows A➔B', category: 'Opérations' },
  { id: 'system_backup', label: 'Export/Import & Restauration Système', category: 'Système' },
  { id: 'broadcast_notifications', label: 'Diffusion d’Alertes Générales', category: 'Communication' },
  { id: 'access_council', label: 'Siège au Conseil des Sages', category: 'Experts' },
  { id: 'b2b_market', label: 'Accès Marché Mondial B2B & RFQ', category: 'Commerce' },
  { id: 'standard_access', label: 'Accès Citoyen Standard', category: 'Général' }
];

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({ users, onReload }) => {
  const [search, setSearch] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedKyc, setSelectedKyc] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'joined' | 'login' | 'credits' | 'name'>('joined');

  // Cloud Sync & Diagnosis state
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRepairing, setIsRepairing] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState<string | null>(null);
  const [repairReport, setRepairReport] = useState<{ fixedCount: number; details: string[] } | null>(null);

  // Modals state
  const [editingUser, setEditingUser] = useState<AdminUserRecord | null>(null);
  const [historyUser, setHistoryUser] = useState<AdminUserRecord | null>(null);
  const [userLogs, setUserLogs] = useState<SystemAuditLog[]>([]);
  const [creditModalUser, setCreditModalUser] = useState<AdminUserRecord | null>(null);
  const [creditAdjustment, setCreditAdjustment] = useState<number>(100);
  const [creditReason, setCreditReason] = useState<string>('Bonus d’encouragement');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // New user form state
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    role: 'citizen' as AdminUserRecord['role'],
    country: 'France',
    city: 'Paris',
    title: 'Citoyen Actif',
    bio: 'Membre engagé de la communauté Le Monde à Vous.',
    credits: 250,
    status: 'active' as AdminUserRecord['status'],
    permissions: ['standard_access'],
    kycVerified: true,
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
    notes: ''
  });

  const isSupabaseLive = supabaseService.isConfigured();

  // Auto-sync on component mount
  useEffect(() => {
    handleSyncCloud(true);
  }, []);

  const handleSyncCloud = async (isBackground: boolean = false) => {
    if (!isBackground) setIsSyncing(true);
    try {
      const res = await adminConfigService.syncWithSupabase();
      if (res.success) {
        if (!isBackground) {
          setSyncStatusMessage(`Synchronisation réussie : ${res.totalUsers} comptes à jour (${res.newUsersCount} nouveaux découverts).`);
          setTimeout(() => setSyncStatusMessage(null), 4000);
        }
      } else {
        if (!isBackground) {
          setSyncStatusMessage(`Sync partielle : ${res.errors.join(' - ')}`);
        }
      }
      onReload();
    } catch (e: any) {
      if (!isBackground) {
        setSyncStatusMessage(`Erreur sync : ${e?.message || 'Inconnue'}`);
      }
    } finally {
      if (!isBackground) setIsSyncing(false);
    }
  };

  const handleRepairAllAccounts = async () => {
    setIsRepairing(true);
    try {
      const report = await adminConfigService.reconcileAndRepairAllAccounts();
      setRepairReport(report);
      onReload();
    } catch (err: any) {
      setSyncStatusMessage(`Erreur diagnostic : ${err?.message}`);
    } finally {
      setIsRepairing(false);
    }
  };

  // Filter and Sort Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase()) ||
      user.country.toLowerCase().includes(search.toLowerCase()) ||
      (user.citizenshipId && user.citizenshipId.toLowerCase().includes(search.toLowerCase())) ||
      (user.city && user.city.toLowerCase().includes(search.toLowerCase())) ||
      (user.notes && user.notes.toLowerCase().includes(search.toLowerCase()));

    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    const matchesOrigin = selectedOrigin === 'all' || (user.origin || 'local_session') === selectedOrigin;
    const matchesKyc = selectedKyc === 'all' || (selectedKyc === 'verified' ? user.kycVerified : !user.kycVerified);

    return matchesSearch && matchesRole && matchesStatus && matchesOrigin && matchesKyc;
  }).sort((a, b) => {
    if (sortBy === 'joined') return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
    if (sortBy === 'login') return b.lastLogin.localeCompare(a.lastLogin);
    if (sortBy === 'credits') return b.credits - a.credits;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  // Metrics summary
  const totalCount = users.length;
  const activeCount = users.filter(u => u.status === 'active').length;
  const pendingCount = users.filter(u => u.status === 'pending').length;
  const suspendedCount = users.filter(u => u.status === 'suspended').length;
  const kycVerifiedCount = users.filter(u => u.kycVerified).length;
  const totalCredits = users.reduce((acc, u) => acc + (u.credits || 0), 0);
  const expertsCount = users.filter(u => u.role === 'expert').length;
  const cloudCount = users.filter(u => u.origin === 'supabase_cloud').length;

  const handleSaveEdit = () => {
    if (!editingUser) return;
    adminConfigService.updateUser(editingUser.id, editingUser);
    setEditingUser(null);
    onReload();
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserData.name || !newUserData.email) return;
    adminConfigService.addUser(newUserData);
    setIsAddModalOpen(false);
    setNewUserData({
      name: '',
      email: '',
      role: 'citizen',
      country: 'France',
      city: 'Paris',
      title: 'Citoyen Actif',
      bio: 'Membre engagé de la communauté Le Monde à Vous.',
      credits: 250,
      status: 'active',
      permissions: ['standard_access'],
      kycVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&h=120&fit=crop',
      notes: ''
    });
    onReload();
  };

  const handleDeleteUser = (id: string, name: string) => {
    if (window.confirm(`Confirmez-vous la suppression définitive du compte de ${name} (${id}) ? Cette action est irréversible.`)) {
      adminConfigService.deleteUser(id);
      onReload();
    }
  };

  const handleToggleStatus = (user: AdminUserRecord) => {
    if (user.role === 'super_admin') return;
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    adminConfigService.setUserStatus(user.id, nextStatus);
    onReload();
  };

  const handleToggleKyc = (user: AdminUserRecord) => {
    adminConfigService.updateUser(user.id, { kycVerified: !user.kycVerified });
    onReload();
  };

  const handleOpenHistory = (user: AdminUserRecord) => {
    setHistoryUser(user);
    const logs = adminConfigService.getUserAuditHistory(user.id);
    setUserLogs(logs);
  };

  const handleApplyCreditAdjustment = () => {
    if (!creditModalUser) return;
    adminConfigService.adjustUserCredits(creditModalUser.id, creditAdjustment, creditReason);
    setCreditModalUser(null);
    onReload();
  };

  const togglePermission = (permId: string) => {
    if (!editingUser) return;
    const current = editingUser.permissions || [];
    if (current.includes(permId)) {
      setEditingUser({ ...editingUser, permissions: current.filter(p => p !== permId) });
    } else {
      setEditingUser({ ...editingUser, permissions: [...current, permId] });
    }
  };

  const handleExportCSV = () => {
    const csvContent = adminConfigService.exportUsersCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lmav_utilisateurs_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportJSON = () => {
    const jsonContent = adminConfigService.exportUsersJSON();
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lmav_utilisateurs_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedUserIds(filteredUsers.map(u => u.id));
    } else {
      setSelectedUserIds([]);
    }
  };

  const handleToggleSelectUser = (id: string) => {
    if (selectedUserIds.includes(id)) {
      setSelectedUserIds(selectedUserIds.filter(i => i !== id));
    } else {
      setSelectedUserIds([...selectedUserIds, id]);
    }
  };

  const handleBatchApprove = () => {
    selectedUserIds.forEach(id => adminConfigService.approveUser(id));
    setSelectedUserIds([]);
    onReload();
  };

  return (
    <div className="space-y-6 animate-fade-up">
      {/* Real-time Cloud Sync & Health Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 rounded-3xl border border-blue-900/60 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
                isSupabaseLive ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isSupabaseLive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                {isSupabaseLive ? 'Supabase Cloud Connecté (Temps Réel Actif)' : 'Mode Local-First Souverain'}
              </span>
              <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                <Database size={13} className="text-blue-400" />
                {totalCount} Comptes indexés
              </span>
              <span className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
                <Cloud size={13} className="text-emerald-400" />
                {cloudCount} Cloud Supabase
              </span>
            </div>
            <h2 className="text-2xl lg:text-3xl font-black tracking-tight flex items-center gap-3">
              <Users className="text-blue-400" size={28} />
              Gestion & Visibilité Totale des Utilisateurs
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 mt-1 max-w-2xl">
              Chaque compte créé ou connecté via Supabase ou en session locale apparaît en temps réel. Gérez les approbations, rôles RBAC, crédits Ⓒ, suspensions et historiques détaillés.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 shrink-0">
            <button
              onClick={() => handleSyncCloud(false)}
              disabled={isSyncing}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2"
              title="Forcer la synchronisation avec la base Supabase"
            >
              <RefreshCw size={15} className={isSyncing ? 'animate-spin' : ''} />
              {isSyncing ? 'Synchronisation...' : 'Actualiser Supabase'}
            </button>

            <button
              onClick={handleRepairAllAccounts}
              disabled={isRepairing}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2"
              title="Scanner, réparer les anomalies et réconcilier tous les profils invisibles"
            >
              <Wrench size={15} className={isRepairing ? 'animate-spin' : ''} />
              {isRepairing ? 'Diagnostic...' : 'Réparer Comptes'}
            </button>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-xl font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <UserPlus size={15} />
              Créer un Compte
            </button>
          </div>
        </div>

        {/* Sync Toast Notification */}
        {syncStatusMessage && (
          <div className="mt-4 p-3 bg-blue-950/80 border border-blue-400/40 rounded-xl text-xs text-blue-200 flex items-center gap-2 animate-fade-up">
            <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
            <span>{syncStatusMessage}</span>
          </div>
        )}

        {/* Repair Report Notification */}
        {repairReport && (
          <div className="mt-4 p-4 bg-amber-950/80 border border-amber-400/50 rounded-2xl text-xs text-amber-200 space-y-2 animate-fade-up">
            <div className="flex justify-between items-center font-bold">
              <span className="flex items-center gap-2">
                <Wrench size={16} className="text-amber-400" />
                Rapport de Réconciliation : {repairReport.fixedCount} corrections appliquées
              </span>
              <button onClick={() => setRepairReport(null)} className="text-amber-400 hover:text-white">
                <X size={16} />
              </button>
            </div>
            {repairReport.details.length > 0 ? (
              <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-300/90 font-mono">
                {repairReport.details.slice(0, 5).map((d, idx) => (
                  <li key={idx}>{d}</li>
                ))}
                {repairReport.details.length > 5 && (
                  <li>...et {repairReport.details.length - 5} autres ajustements.</li>
                )}
              </ul>
            ) : (
              <p className="text-[11px] text-emerald-300">Tous les comptes sont parfaitement alignés, sains et visibles.</p>
            )}
          </div>
        )}
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Comptes</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{totalCount}</p>
          <p className="text-[10px] text-blue-600 font-bold mt-0.5">100% Visibles</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Actifs</p>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Accès autorisé</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">En Attente</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{pendingCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Vérification</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Suspendus</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{suspendedCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Bloqués</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-purple-600 uppercase tracking-wider">KYC Vérifiés</p>
          <p className="text-2xl font-black text-purple-700 mt-1">{kycVerifiedCount}</p>
          <p className="text-[10px] text-purple-500 font-bold mt-0.5">{Math.round((kycVerifiedCount/Math.max(1, totalCount))*100)}% Certifiés</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Experts Diallo</p>
          <p className="text-2xl font-black text-indigo-700 mt-1">{expertsCount}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Conseil des Sages</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">Masse Crédits Ⓒ</p>
          <p className="text-2xl font-black text-blue-900 mt-1 font-mono">{totalCredits.toLocaleString()}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">En circulation</p>
        </div>
      </div>

      {/* Filter and Action Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-center justify-between">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Rechercher nom, email, pays, passeport LMAV..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap gap-2 w-full lg:w-auto items-center">
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Tous les rôles ({totalCount})</option>
              <option value="super_admin">👑 Super-Administrateurs</option>
              <option value="admin">🛡️ Administrateurs</option>
              <option value="expert">🌟 Experts Diallo</option>
              <option value="partner">💼 Partenaires B2B</option>
              <option value="citizen">🌍 Citoyens LMAV</option>
              <option value="guest">👤 Invités</option>
            </select>

            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Tous statuts</option>
              <option value="active">🟢 Actif</option>
              <option value="pending">🟡 En attente</option>
              <option value="suspended">🔴 Suspendu</option>
            </select>

            <select
              value={selectedOrigin}
              onChange={(e) => setSelectedOrigin(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Toutes origines</option>
              <option value="supabase_cloud">☁️ Supabase Cloud</option>
              <option value="local_session">💻 Session Locale</option>
            </select>

            <select
              value={selectedKyc}
              onChange={(e) => setSelectedKyc(e.target.value)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="all">Tous KYC</option>
              <option value="verified">✅ KYC Vérifié</option>
              <option value="unverified">⏳ Non vérifié</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none"
            >
              <option value="joined">📅 Date Inscription</option>
              <option value="login">⏱️ Dernière Connexion</option>
              <option value="credits">🪙 Solde Crédits</option>
              <option value="name">🔤 Nom A-Z</option>
            </select>
          </div>
        </div>

        {/* Batch & Export Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-medium">
              {filteredUsers.length} compte{filteredUsers.length > 1 ? 's' : ''} correspondant{filteredUsers.length > 1 ? 's' : ''}
            </span>

            {selectedUserIds.length > 0 && (
              <div className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200 text-blue-800 font-bold">
                <span>{selectedUserIds.length} sélectionné(s)</span>
                <button
                  onClick={handleBatchApprove}
                  className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] transition"
                >
                  Valider KYC & Activer
                </button>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-1.5"
              title="Exporter les utilisateurs en CSV"
            >
              <FileSpreadsheet size={14} />
              Export CSV
            </button>

            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition flex items-center gap-1.5"
              title="Exporter les utilisateurs en JSON"
            >
              <FileCode size={14} />
              Export JSON
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/90 border-b border-slate-200 text-[11px] font-black uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4 w-10">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedUserIds.length > 0 && selectedUserIds.length === filteredUsers.length}
                    className="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                </th>
                <th className="py-3.5 px-4">Utilisateur & Passeport</th>
                <th className="py-3.5 px-4">Rôle & Rang</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4">Origine</th>
                <th className="py-3.5 px-4">Pays / Ville</th>
                <th className="py-3.5 px-4">Solde Ⓒ</th>
                <th className="py-3.5 px-4">Dernière Connexion</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <Users size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
                    <p className="font-bold text-slate-600">Aucun compte ne correspond aux filtres.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Cliquez sur « Actualiser Supabase » ou ajustez votre recherche.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const isSelected = selectedUserIds.includes(user.id);
                  const isSuperAdmin = user.role === 'super_admin' || user.email.toLowerCase() === 'visionsmart224@gmail.com';

                  return (
                    <tr key={user.id} className={`hover:bg-slate-50/80 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}>
                      <td className="py-3.5 px-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelectUser(user.id)}
                          className="w-3.5 h-3.5 text-blue-600 rounded"
                        />
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                            {user.kycVerified && (
                              <span title="Identité vérifiée KYC" className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow">
                                <CheckCircle size={13} className="text-blue-600 fill-blue-100" />
                              </span>
                            )}
                          </div>
                          <div className="truncate max-w-[220px]">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="truncate">{user.name}</span>
                              {isSuperAdmin && <span title="Super-Admin" className="text-red-600 font-bold text-[10px]">👑</span>}
                            </div>
                            <div className="text-[11px] text-slate-500 font-mono truncate">{user.email}</div>
                            {user.citizenshipId && (
                              <div className="text-[10px] text-blue-700 bg-blue-50/80 px-1.5 py-0.2 rounded font-mono inline-block mt-0.5 border border-blue-200/50">
                                {user.citizenshipId}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase inline-flex items-center gap-1 ${
                          user.role === 'super_admin' ? 'bg-red-100 text-red-700 border border-red-200' :
                          user.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                          user.role === 'expert' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                          user.role === 'partner' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 
                          'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {user.role === 'super_admin' && <Shield size={11} />}
                          {user.role === 'admin' && <Shield size={11} />}
                          {user.role === 'expert' && <Sparkles size={11} />}
                          {user.role}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleStatus(user)}
                          disabled={isSuperAdmin}
                          className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase transition cursor-pointer flex items-center gap-1 ${
                            user.status === 'active' ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' :
                            user.status === 'suspended' ? 'bg-rose-100 text-rose-800 hover:bg-rose-200' : 
                            'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Cliquer pour basculer le statut"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-500' : user.status === 'suspended' ? 'bg-rose-500' : 'bg-amber-500'}`}></span>
                          {user.status === 'active' ? 'Actif' : user.status === 'suspended' ? 'Suspendu' : 'En attente'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                          user.origin === 'supabase_cloud' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {user.origin === 'supabase_cloud' ? '☁️ Supabase' : '💻 Local'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        <div>{user.country}</div>
                        {user.city && <div className="text-[10px] text-slate-400">{user.city}</div>}
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setCreditModalUser(user)}
                          className="font-mono font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-lg border border-blue-200 transition flex items-center gap-1"
                          title="Ajuster les crédits"
                        >
                          <Coins size={12} className="text-blue-500" />
                          {user.credits.toLocaleString()} Ⓒ
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        <div>{user.lastLogin}</div>
                        <div className="text-[10px] text-slate-400">Inscrit : {user.joinedAt}</div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleKyc(user)}
                            className={`p-1.5 rounded-lg transition ${user.kycVerified ? 'text-blue-600 bg-blue-50 hover:bg-blue-100' : 'text-slate-400 bg-slate-100 hover:bg-slate-200'}`}
                            title={user.kycVerified ? 'KYC Vérifié (cliquer pour révoquer)' : 'Valider KYC'}
                          >
                            <UserCheck size={14} />
                          </button>

                          <button
                            onClick={() => handleOpenHistory(user)}
                            className="p-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 rounded-lg text-slate-600 transition"
                            title="Voir l'historique et logs du compte"
                          >
                            <History size={14} />
                          </button>

                          <button
                            onClick={() => setEditingUser({ ...user })}
                            className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-slate-600 transition"
                            title="Modifier profil & permissions RBAC"
                          >
                            <Edit size={14} />
                          </button>

                          {!isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteUser(user.id, user.name)}
                              className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-slate-600 transition"
                              title="Supprimer définitivement"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Edit User & Granular RBAC Permissions */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-6 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Edit className="text-blue-600" size={18} />
                  Édition Complète & Droits RBAC : {editingUser.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Identifiant : {editingUser.id} • Passeport : {editingUser.citizenshipId || 'Non assigné'}</p>
              </div>
              <button 
                onClick={() => setEditingUser(null)} 
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet</label>
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Adresse Email</label>
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre Professionnel</label>
                <input
                  type="text"
                  value={editingUser.title || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                  placeholder="ex: Avocat International, Citoyen Actif..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Passeport Citoyen ID</label>
                <input
                  type="text"
                  value={editingUser.citizenshipId || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, citizenshipId: e.target.value })}
                  placeholder="ex: LMAV-2026-XXXX-FR"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-900 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Rôle Système</label>
                <select
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="super_admin">👑 Super-Administrateur Suprême</option>
                  <option value="admin">🛡️ Administrateur</option>
                  <option value="expert">🌟 Expert de la Famille Diallo</option>
                  <option value="partner">💼 Partenaire B2B / Entreprise</option>
                  <option value="citizen">🌍 Citoyen LMAV</option>
                  <option value="guest">👤 Invité</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Statut du Compte</label>
                <select
                  value={editingUser.status}
                  onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as any })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="active">🟢 Actif (Accès autorisé)</option>
                  <option value="pending">🟡 En attente de vérification</option>
                  <option value="suspended">🔴 Suspendu / Bloqué</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Solde Crédits LMAV (Ⓒ)</label>
                <div className="relative">
                  <Coins className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={16} />
                  <input
                    type="number"
                    value={editingUser.credits}
                    onChange={(e) => setEditingUser({ ...editingUser, credits: Number(e.target.value) })}
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Pays / Ville</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingUser.country}
                    onChange={(e) => setEditingUser({ ...editingUser, country: e.target.value })}
                    placeholder="Pays"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />
                  <input
                    type="text"
                    value={editingUser.city || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, city: e.target.value })}
                    placeholder="Ville"
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Notes Administratives Internes</label>
              <textarea
                value={editingUser.notes || ''}
                onChange={(e) => setEditingUser({ ...editingUser, notes: e.target.value })}
                rows={2}
                placeholder="Historique particulier, notes de conformité ou motif d'attribution de privilèges..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
              />
            </div>

            {/* KYC Checkbox */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck size={16} className="text-blue-600" />
                  Certification KYC & Passeport Citoyen Validé
                </p>
                <p className="text-[11px] text-slate-500">Donne accès prioritaire aux services officiels et aux actes certifiés.</p>
              </div>
              <input
                type="checkbox"
                checked={editingUser.kycVerified}
                onChange={(e) => setEditingUser({ ...editingUser, kycVerified: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded cursor-pointer"
              />
            </div>

            {/* Granular RBAC Permissions */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                <Sliders size={14} className="text-blue-600" />
                Permissions & Privilèges Granulaires (RBAC)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 max-h-48 overflow-y-auto">
                {ALL_PERMISSIONS.map(perm => {
                  const hasPerm = editingUser.permissions?.includes(perm.id) || editingUser.permissions?.includes('all');
                  return (
                    <label key={perm.id} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white transition cursor-pointer text-xs">
                      <input
                        type="checkbox"
                        checked={hasPerm}
                        onChange={() => togglePermission(perm.id)}
                        className="w-3.5 h-3.5 text-blue-600 rounded"
                      />
                      <div>
                        <span className="font-bold text-slate-800">{perm.label}</span>
                        <span className="text-[10px] text-slate-400 ml-1">({perm.category})</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md transition flex items-center gap-2"
              >
                <Check size={14} />
                Enregistrer les Modifications
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Account History & Audit Logs */}
      {historyUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <img src={historyUser.avatarUrl} alt={historyUser.name} className="w-12 h-12 rounded-full object-cover border border-slate-200" />
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <History className="text-purple-600" size={18} />
                    Historique & Audit : {historyUser.name}
                  </h3>
                  <p className="text-xs text-slate-500">{historyUser.email} • Inscrit le {historyUser.joinedAt}</p>
                </div>
              </div>
              <button onClick={() => setHistoryUser(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Account snapshot */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Passeport</p>
                <p className="font-bold font-mono text-blue-900">{historyUser.citizenshipId || 'LMAV-CITIZEN'}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Rôle Actuel</p>
                <p className="font-bold text-slate-900">{historyUser.role.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Solde Crédits</p>
                <p className="font-bold font-mono text-emerald-700">{historyUser.credits.toLocaleString()} Ⓒ</p>
              </div>
              <div>
                <p className="text-slate-400 font-medium text-[10px] uppercase">Dernière Connexion</p>
                <p className="font-bold font-mono text-slate-700">{historyUser.lastLogin}</p>
              </div>
            </div>

            {/* Audit Logs list */}
            <div className="space-y-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Activity size={14} className="text-purple-600" />
                Journal d'Audit & Événements Liés
              </h4>

              {userLogs.length === 0 ? (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-100">
                  <p className="text-xs font-medium">Aucun événement de sécurité ou modification spécifique enregistré.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {userLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            log.level === 'security' ? 'bg-red-100 text-red-700' :
                            log.level === 'warning' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {log.category}
                          </span>
                          <span className="font-bold text-slate-800">{log.message}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-mono">Acteur : {log.actor}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.timestamp}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setHistoryUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Adjust Credits */}
      {creditModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4 animate-scale">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Coins className="text-blue-600" size={18} />
                  Ajuster les Crédits Ⓒ : {creditModalUser.name}
                </h3>
                <p className="text-xs text-slate-500">Solde actuel : <strong className="text-blue-700 font-mono">{creditModalUser.credits.toLocaleString()} Ⓒ</strong></p>
              </div>
              <button onClick={() => setCreditModalUser(null)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Montant de l'ajustement (positif ou négatif)</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCreditAdjustment(prev => prev - 50)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    value={creditAdjustment}
                    onChange={(e) => setCreditAdjustment(Number(e.target.value))}
                    className="flex-1 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-sm font-mono font-bold text-blue-900 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setCreditAdjustment(prev => prev + 50)}
                    className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  Nouveau solde estimé : <strong className="font-mono text-emerald-700">{Math.max(0, creditModalUser.credits + creditAdjustment).toLocaleString()} Ⓒ</strong>
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motif de l'ajustement</label>
                <input
                  type="text"
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="ex: Récompense contribution, compensation..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCreditModalUser(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleApplyCreditAdjustment}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5"
              >
                <Check size={14} />
                Appliquer l'Ajustement
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Create User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleCreateUser} className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserPlus className="text-blue-600" size={18} />
                  Créer un Nouvel Utilisateur ou Expert
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Le compte est instantanément persisté et synchronisé avec Supabase.</p>
              </div>
              <button type="button" onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nom complet *</label>
                <input
                  type="text"
                  required
                  value={newUserData.name}
                  onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                  placeholder="ex: Dr. Mamadou Diallo ou Aminata Sy"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email *</label>
                <input
                  type="email"
                  required
                  value={newUserData.email}
                  onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                  placeholder="ex: contact@exemple.com"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rôle</label>
                  <select
                    value={newUserData.role}
                    onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value as any })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                  >
                    <option value="citizen">Citoyen Standard</option>
                    <option value="expert">Expert Famille Diallo</option>
                    <option value="partner">Partenaire B2B</option>
                    <option value="admin">Administrateur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Crédits Initiaux Ⓒ</label>
                  <input
                    type="number"
                    value={newUserData.credits}
                    onChange={(e) => setNewUserData({ ...newUserData, credits: Number(e.target.value) })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-blue-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pays</label>
                  <input
                    type="text"
                    value={newUserData.country}
                    onChange={(e) => setNewUserData({ ...newUserData, country: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ville</label>
                  <input
                    type="text"
                    value={newUserData.city}
                    onChange={(e) => setNewUserData({ ...newUserData, city: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center gap-2"
              >
                <Check size={14} />
                Créer & Synchroniser
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
