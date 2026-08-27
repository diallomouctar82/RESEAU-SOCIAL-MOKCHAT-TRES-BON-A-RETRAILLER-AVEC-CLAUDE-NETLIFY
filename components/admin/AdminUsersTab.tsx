import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Check,
  CheckCircle2,
  Download,
  Edit3,
  History,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import type { AdminUserRecord, PlatformRole } from '../../types';
import type { AdminActor, AdminAuditRecord, CreateAdminUserInput, UpdateAdminUserInput } from '../../services/adminApi';

interface AdminUsersTabProps {
  users: AdminUserRecord[];
  audit: AdminAuditRecord[];
  actor: AdminActor | null;
  loading: boolean;
  error: string | null;
  notice: string | null;
  onRefresh: () => Promise<void>;
  onCreate: (input: CreateAdminUserInput) => Promise<void>;
  onUpdate: (input: UpdateAdminUserInput) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const ROLES: { value: PlatformRole; label: string }[] = [
  { value: 'user', label: 'Utilisateur' },
  { value: 'expert', label: 'Expert' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'moderator', label: 'Modérateur' },
  { value: 'organization', label: 'Organisation' },
  { value: 'admin', label: 'Administrateur' },
  { value: 'super_admin', label: 'Super-administrateur' }
];

const PERMISSIONS = [
  ['manage_users', 'Voir et gérer les utilisateurs'],
  ['manage_roles', 'Attribuer les rôles non administrateurs'],
  ['manage_permissions', 'Gérer les permissions'],
  ['suspend_users', 'Suspendre et réactiver'],
  ['delete_users', 'Supprimer les comptes'],
  ['view_audit_logs', 'Consulter le journal d’audit'],
  ['manage_moderation', 'Gérer la modération'],
  ['manage_modules', 'Gérer les modules'],
  ['manage_templates', 'Gérer les modèles'],
  ['manage_workflows', 'Gérer les workflows'],
  ['broadcast_notifications', 'Diffuser des notifications'],
  ['standard_access', 'Accès standard']
] as const;

const emptyCreate: CreateAdminUserInput = {
  email: '',
  name: '',
  role: 'user',
  status: 'pending',
  permissions: ['standard_access'],
  country: '',
  city: '',
  title: ''
};

const roleStyle: Record<PlatformRole, string> = {
  super_admin: 'bg-rose-100 text-rose-800 border-rose-200',
  admin: 'bg-amber-100 text-amber-800 border-amber-200',
  moderator: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  expert: 'bg-purple-100 text-purple-800 border-purple-200',
  mentor: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  organization: 'bg-teal-100 text-teal-800 border-teal-200',
  user: 'bg-blue-100 text-blue-800 border-blue-200'
};

const dateLabel = (value?: string) => {
  if (!value) return 'Jamais';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('fr', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase() || '?';

export const AdminUsersTab: React.FC<AdminUsersTabProps> = ({
  users,
  audit,
  actor,
  loading,
  error,
  notice,
  onRefresh,
  onCreate,
  onUpdate,
  onDelete
}) => {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | PlatformRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | AdminUserRecord['status']>('all');
  const [editing, setEditing] = useState<AdminUserRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [createInput, setCreateInput] = useState<CreateAdminUserInput>(emptyCreate);
  const [historyUser, setHistoryUser] = useState<AdminUserRecord | null>(null);
  const [pendingAction, setPendingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const firstDialogInput = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editing && !creating && !historyUser) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !pendingAction) {
        setEditing(null);
        setCreating(false);
        setHistoryUser(null);
        setActionError(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    const timer = window.setTimeout(() => firstDialogInput.current?.focus(), 0);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [editing, creating, historyUser, pendingAction]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter((user) => {
      const searchable = `${user.name} ${user.email} ${user.country || ''} ${user.city || ''}`.toLowerCase();
      return (!query || searchable.includes(query)) &&
        (roleFilter === 'all' || user.role === roleFilter) &&
        (statusFilter === 'all' || user.status === statusFilter);
    });
  }, [users, search, roleFilter, statusFilter]);

  const activeCount = users.filter((user) => user.status === 'active').length;
  const suspendedCount = users.filter((user) => user.status === 'suspended').length;
  const elevatedCount = users.filter((user) => ['admin', 'super_admin', 'moderator'].includes(user.role)).length;

  const canEdit = (user: AdminUserRecord) => actor?.role === 'super_admin' || !['admin', 'super_admin'].includes(user.role);
  const hasPermission = (permission: string) => actor?.role === 'super_admin' || actor?.permissions.includes(permission) === true;

  const runAction = async (key: string, action: () => Promise<void>, onSuccess?: () => void) => {
    setActionError(null);
    setPendingAction(key);
    try {
      await action();
      onSuccess?.();
    } catch (caught: any) {
      setActionError(caught?.message || 'L’opération a échoué.');
    } finally {
      setPendingAction(null);
    }
  };

  const submitCreate = (event: React.FormEvent) => {
    event.preventDefault();
    void runAction('create', () => onCreate(createInput), () => {
      setCreating(false);
      setCreateInput(emptyCreate);
    });
  };

  const submitEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    void runAction(`update:${editing.id}`, () => onUpdate({
      id: editing.id,
      name: editing.name,
      role: editing.role,
      status: editing.status,
      permissions: editing.permissions,
      country: editing.country,
      city: editing.city,
      title: editing.title,
      kycVerified: editing.kycVerified,
      notes: editing.notes,
      reason: 'Modification depuis la console Administration/RBAC'
    }), () => setEditing(null));
  };

  const togglePermission = (permission: string) => {
    if (!editing) return;
    const permissions = editing.permissions.includes(permission)
      ? editing.permissions.filter((item) => item !== permission)
      : [...editing.permissions, permission];
    setEditing({ ...editing, permissions });
  };

  const exportCsv = () => {
    const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`;
    const lines = [
      ['id', 'nom', 'email', 'role', 'statut', 'pays', 'ville', 'inscription', 'derniere_connexion'],
      ...filteredUsers.map((user) => [user.id, user.name, user.email, user.role, user.status, user.country, user.city, user.joinedAt, user.lastLogin])
    ].map((row) => row.map(escape).join(','));
    const url = URL.createObjectURL(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `mokchat-utilisateurs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const renderUserActions = (user: AdminUserRecord) => (
    <div className="flex items-center justify-end gap-1.5">
      <button type="button" onClick={() => setHistoryUser(user)} className="p-2 rounded-lg bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700 focus-visible:ring-2 focus-visible:ring-purple-500" aria-label={`Voir l’audit de ${user.name}`}>
        <History size={15} />
      </button>
      <button type="button" disabled={!canEdit(user) || Boolean(pendingAction)} onClick={() => { setEditing({ ...user, permissions: [...user.permissions] }); setActionError(null); }} className="p-2 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-blue-500" aria-label={`Modifier ${user.name}`}>
        <Edit3 size={15} />
      </button>
      <button
        type="button"
        disabled={!canEdit(user) || !hasPermission('delete_users') || actor?.id === user.id || Boolean(pendingAction)}
        onClick={() => {
          if (!window.confirm(`Supprimer définitivement le compte Auth et le profil de ${user.name} ?`)) return;
          void runAction(`delete:${user.id}`, () => onDelete(user.id));
        }}
        className="p-2 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-rose-500"
        aria-label={`Supprimer ${user.name}`}
      >
        {pendingAction === `delete:${user.id}` ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
      </button>
    </div>
  );

  return (
    <div className="space-y-5">
      <section className="rounded-3xl bg-slate-950 p-5 sm:p-7 text-white shadow-xl" aria-labelledby="admin-users-title">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-emerald-300">Source : Supabase Auth + profiles</span>
              {actor && <span className="rounded-full border border-white/20 px-3 py-1 text-slate-300">Session : {actor.role}</span>}
            </div>
            <h2 id="admin-users-title" className="flex items-center gap-2 text-2xl font-black"><Users className="text-blue-400" /> Utilisateurs et contrôle RBAC</h2>
            <p className="mt-1 max-w-3xl text-sm text-slate-300">Les actions sont exécutées côté serveur, autorisées à chaque requête et consignées dans le journal d’audit.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => void onRefresh()} disabled={loading || Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold hover:bg-white/20 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-400">
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualiser
            </button>
            <button type="button" onClick={() => { setCreating(true); setActionError(null); }} disabled={loading || Boolean(pendingAction)} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold hover:bg-blue-500 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-blue-300">
              <UserPlus size={15} /> Inviter un compte
            </button>
          </div>
        </div>
      </section>

      {(error || actionError) && (
        <div role="alert" className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-medium text-rose-800">
          <AlertCircle className="mt-0.5 shrink-0" size={18} /><span>{actionError || error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-medium text-emerald-800">
          <CheckCircle2 className="mt-0.5 shrink-0" size={18} /><span>{notice}</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          ['Comptes Auth', users.length, 'text-slate-900'],
          ['Actifs', activeCount, 'text-emerald-700'],
          ['Suspendus', suspendedCount, 'text-rose-700'],
          ['Rôles élevés', elevatedCount, 'text-amber-700']
        ].map(([label, value, color]) => (
          <div key={String(label)} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
            <p className={`mt-1 text-2xl font-black ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm" aria-label="Annuaire des comptes">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <label htmlFor="admin-user-search" className="sr-only">Rechercher un utilisateur</label>
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input id="admin-user-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nom, e-mail, pays ou ville…" className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
          </div>
          <div className="flex flex-wrap gap-2">
            <label className="sr-only" htmlFor="admin-role-filter">Filtrer par rôle</label>
            <select id="admin-role-filter" value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as any)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500">
              <option value="all">Tous les rôles</option>
              {ROLES.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
            </select>
            <label className="sr-only" htmlFor="admin-status-filter">Filtrer par statut</label>
            <select id="admin-status-filter" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as any)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-bold text-slate-700 focus:ring-2 focus:ring-blue-500">
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="pending">En attente</option>
              <option value="suspended">Suspendus</option>
            </select>
            <button type="button" onClick={exportCsv} disabled={filteredUsers.length === 0} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200 disabled:opacity-50"><Download size={14} /> CSV</button>
          </div>
        </div>

        {loading && users.length === 0 ? (
          <div className="flex min-h-56 items-center justify-center gap-3 text-sm font-bold text-slate-500"><Loader2 className="animate-spin text-blue-600" /> Chargement des comptes réels…</div>
        ) : filteredUsers.length === 0 ? (
          <div className="min-h-56 p-12 text-center text-sm text-slate-500"><Users className="mx-auto mb-3 opacity-30" size={40} /><p className="font-bold text-slate-700">Aucun compte correspondant</p><p>Actualisez la source ou ajustez les filtres.</p></div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-black uppercase tracking-wide text-slate-500">
                  <tr><th className="px-4 py-3">Utilisateur</th><th className="px-4 py-3">Rôle</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Localisation</th><th className="px-4 py-3">Dernière connexion</th><th className="px-4 py-3 text-right">Actions</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 font-black text-white">{initials(user.name)}</div><div className="min-w-0"><p className="truncate font-bold text-slate-900">{user.name}</p><p className="truncate font-mono text-[10px] text-slate-500">{user.email}</p></div></div></td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-black uppercase ${roleStyle[user.role]}`}>{user.role}</span></td>
                      <td className="px-4 py-3"><span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : user.status === 'suspended' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'}`}>{user.status}</span></td>
                      <td className="px-4 py-3 text-slate-600">{[user.city, user.country].filter(Boolean).join(', ') || 'Non renseignée'}</td>
                      <td className="px-4 py-3 text-[10px] text-slate-500">{dateLabel(user.lastLogin)}</td>
                      <td className="px-4 py-3">{renderUserActions(user)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid gap-3 p-3 md:hidden">
              {filteredUsers.map((user) => (
                <article key={user.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 font-black text-white">{initials(user.name)}</div><div className="min-w-0 flex-1"><h3 className="truncate font-bold text-slate-900">{user.name}</h3><p className="truncate text-xs text-slate-500">{user.email}</p><div className="mt-2 flex flex-wrap gap-1.5"><span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase ${roleStyle[user.role]}`}>{user.role}</span><span className="rounded-full bg-slate-100 px-2 py-0.5 text-[9px] font-bold">{user.status}</span></div></div></div>
                  <div className="mt-3 border-t border-slate-100 pt-3">{renderUserActions(user)}</div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {(editing || creating) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-user-dialog-title">
          <form onSubmit={editing ? submitEdit : submitCreate} className="my-6 w-full max-w-2xl space-y-5 rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div><h2 id="admin-user-dialog-title" className="flex items-center gap-2 text-lg font-black text-slate-900">{editing ? <Edit3 size={19} className="text-blue-600" /> : <UserPlus size={19} className="text-blue-600" />}{editing ? 'Modifier le compte' : 'Inviter un compte Supabase Auth'}</h2><p className="mt-1 text-xs text-slate-500">Aucun identifiant local n’est créé : Supabase Auth génère l’UUID.</p></div>
              <button type="button" disabled={Boolean(pendingAction)} onClick={() => { setEditing(null); setCreating(false); setActionError(null); }} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer"><X size={18} /></button>
            </div>

            {actionError && <div role="alert" className="flex gap-2 rounded-xl bg-rose-50 p-3 text-xs font-bold text-rose-800"><AlertCircle size={16} />{actionError}</div>}

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-700">Nom complet
                <input ref={firstDialogInput} required minLength={2} maxLength={120} value={editing?.name ?? createInput.name} onChange={(event) => editing ? setEditing({ ...editing, name: event.target.value }) : setCreateInput({ ...createInput, name: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              </label>
              <label className="text-xs font-bold text-slate-700">E-mail
                <input type="email" required disabled={Boolean(editing)} value={editing?.email ?? createInput.email} onChange={(event) => setCreateInput({ ...createInput, email: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none disabled:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200" />
              </label>
              <label className="text-xs font-bold text-slate-700">Rôle
                <select disabled={!hasPermission('manage_roles')} value={editing?.role ?? createInput.role} onChange={(event) => editing ? setEditing({ ...editing, role: event.target.value as PlatformRole }) : setCreateInput({ ...createInput, role: event.target.value as PlatformRole })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold disabled:opacity-60 focus:ring-2 focus:ring-blue-500">
                  {ROLES.filter((role) => actor?.role === 'super_admin' || !['admin', 'super_admin'].includes(role.value)).map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </label>
              <label className="text-xs font-bold text-slate-700">Statut
                <select disabled={!hasPermission('suspend_users')} value={editing?.status ?? createInput.status} onChange={(event) => editing ? setEditing({ ...editing, status: event.target.value as AdminUserRecord['status'] }) : setCreateInput({ ...createInput, status: event.target.value as AdminUserRecord['status'] })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-bold disabled:opacity-60 focus:ring-2 focus:ring-blue-500"><option value="active">Actif</option><option value="pending">En attente</option><option value="suspended">Suspendu</option></select>
              </label>
              <label className="text-xs font-bold text-slate-700">Pays
                <input maxLength={80} value={editing?.country ?? createInput.country ?? ''} onChange={(event) => editing ? setEditing({ ...editing, country: event.target.value }) : setCreateInput({ ...createInput, country: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:ring-2 focus:ring-blue-200" />
              </label>
              <label className="text-xs font-bold text-slate-700">Ville
                <input maxLength={80} value={editing?.city ?? createInput.city ?? ''} onChange={(event) => editing ? setEditing({ ...editing, city: event.target.value }) : setCreateInput({ ...createInput, city: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:ring-2 focus:ring-blue-200" />
              </label>
              <label className="text-xs font-bold text-slate-700 sm:col-span-2">Titre public
                <input maxLength={120} value={editing?.title ?? createInput.title ?? ''} onChange={(event) => editing ? setEditing({ ...editing, title: event.target.value }) : setCreateInput({ ...createInput, title: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 font-medium outline-none focus:ring-2 focus:ring-blue-200" />
              </label>
            </div>

            {editing && (
              <div className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-700"><input type="checkbox" checked={editing.kycVerified === true} onChange={(event) => setEditing({ ...editing, kycVerified: event.target.checked })} className="h-4 w-4 rounded text-blue-600" />Profil vérifié</label>
                <label className="text-xs font-bold text-slate-700 sm:col-span-2">Notes administratives
                  <textarea maxLength={2000} rows={3} value={editing.notes || ''} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} className="mt-1 w-full resize-y rounded-xl border border-slate-200 bg-white p-3 font-medium outline-none focus:ring-2 focus:ring-blue-200" />
                </label>
              </div>
            )}

            <fieldset disabled={!hasPermission('manage_permissions')} className="rounded-2xl border border-slate-200 bg-slate-50 p-4 disabled:opacity-60"><legend className="px-1 text-xs font-black uppercase tracking-wide text-slate-700">Permissions granulaires</legend><div className="mt-2 grid gap-2 sm:grid-cols-2">{PERMISSIONS.map(([id, label]) => {
              const values = editing?.permissions ?? createInput.permissions;
              return <label key={id} className="flex cursor-pointer items-start gap-2 rounded-xl p-2 text-xs hover:bg-white"><input type="checkbox" checked={values.includes(id)} onChange={() => editing ? togglePermission(id) : setCreateInput({ ...createInput, permissions: values.includes(id) ? values.filter((item) => item !== id) : [...values, id] })} className="mt-0.5 h-4 w-4 rounded text-blue-600" /><span className="font-medium text-slate-700">{label}</span></label>;
            })}</div></fieldset>

            <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
              <button type="button" disabled={Boolean(pendingAction)} onClick={() => { setEditing(null); setCreating(false); setActionError(null); }} className="rounded-xl bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-200">Annuler</button>
              <button type="submit" disabled={Boolean(pendingAction)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">{pendingAction ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}{editing ? 'Enregistrer côté serveur' : 'Envoyer l’invitation'}</button>
            </div>
          </form>
        </div>
      )}

      {historyUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="admin-audit-dialog-title">
          <div className="my-6 w-full max-w-2xl space-y-4 rounded-3xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4"><div><h2 id="admin-audit-dialog-title" className="flex items-center gap-2 text-lg font-black text-slate-900"><Activity size={19} className="text-purple-600" />Audit de {historyUser.name}</h2><p className="mt-1 text-xs text-slate-500">Événements persistés par la Function serveur</p></div><button ref={firstDialogInput as any} type="button" onClick={() => setHistoryUser(null)} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Fermer"><X size={18} /></button></div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto">
              {audit.filter((entry) => entry.target_id === historyUser.id || entry.actor_id === historyUser.id).length === 0 ? <p className="rounded-2xl bg-slate-50 p-8 text-center text-sm text-slate-500">Aucun événement audité pour ce compte.</p> : audit.filter((entry) => entry.target_id === historyUser.id || entry.actor_id === historyUser.id).map((entry) => <article key={entry.id} className="rounded-xl border border-slate-200 p-3 text-xs"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-black text-slate-800">{entry.action}</span><span className={`rounded-full px-2 py-0.5 font-bold ${entry.outcome === 'success' ? 'bg-emerald-100 text-emerald-800' : entry.outcome === 'denied' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'}`}>{entry.outcome}</span></div><p className="mt-1 font-mono text-[10px] text-slate-500">{dateLabel(entry.created_at)} · requête {entry.request_id}</p></article>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
