export type PlatformRole = 'user' | 'admin' | 'expert' | 'mentor' | 'moderator' | 'organization' | 'super_admin';
export type AccountStatus = 'active' | 'pending' | 'suspended';

export const PLATFORM_ROLES: readonly PlatformRole[] = Object.freeze([
  'user',
  'admin',
  'expert',
  'mentor',
  'moderator',
  'organization',
  'super_admin'
]);

export const ACCOUNT_STATUSES: readonly AccountStatus[] = Object.freeze(['active', 'pending', 'suspended']);

export const ADMIN_PERMISSIONS = Object.freeze([
  'manage_users',
  'manage_roles',
  'manage_permissions',
  'suspend_users',
  'delete_users',
  'view_audit_logs',
  'manage_moderation',
  'manage_modules',
  'manage_templates',
  'manage_workflows',
  'broadcast_notifications',
  'standard_access'
]);

const LEGACY_ROLE_MAP = Object.freeze({
  citizen: 'user',
  guest: 'user',
  partner: 'organization'
});

export class AdminValidationError extends Error {
  code: string;

  constructor(message: string, code = 'INVALID_INPUT') {
    super(message);
    this.name = 'AdminValidationError';
    this.code = code;
  }
}

export const normalizeRole = (role: unknown): PlatformRole => {
  const normalized = LEGACY_ROLE_MAP[String(role || '').trim()] || String(role || '').trim();
  return PLATFORM_ROLES.includes(normalized as PlatformRole) ? normalized as PlatformRole : 'user';
};

export const normalizePermissions = (permissions: unknown, role: unknown = 'user'): string[] => {
  if (normalizeRole(role) === 'super_admin') return ['all'];
  const requested = Array.isArray(permissions) ? permissions : [];
  const unique = [...new Set(requested.filter((permission) => ADMIN_PERMISSIONS.includes(permission)))];
  return unique.length > 0 ? unique : ['standard_access'];
};

export const parseBearerToken = (authorization: string | null): string | null => {
  if (typeof authorization !== 'string') return null;
  const match = authorization.match(/^Bearer\s+([^\s]+)$/i);
  return match?.[1] || null;
};

export const isUuid = (value: unknown): value is string =>
  typeof value === 'string' &&
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export const validateCreatePayload = (payload: unknown) => {
  const source = payload && typeof payload === 'object' ? payload as Record<string, any> : {};
  const email = String(source.email || '').trim().toLowerCase();
  const name = String(source.name || '').trim();
  const role = normalizeRole(source.role);

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    throw new AdminValidationError('Adresse e-mail invalide.');
  }
  if (name.length < 2 || name.length > 120) {
    throw new AdminValidationError('Le nom doit contenir entre 2 et 120 caractères.');
  }
  if (!PLATFORM_ROLES.includes(String(source.role || 'user') as PlatformRole)) {
    throw new AdminValidationError('Rôle non autorisé.');
  }

  return {
    email,
    name,
    role,
    status: ACCOUNT_STATUSES.includes(source.status) ? source.status : 'pending',
    permissions: normalizePermissions(source.permissions, role),
    country: String(source.country || '').trim().slice(0, 80),
    city: String(source.city || '').trim().slice(0, 80),
    title: String(source.title || '').trim().slice(0, 120)
  };
};

export const validatePatchPayload = (payload: unknown) => {
  const source = payload && typeof payload === 'object' ? payload as Record<string, any> : {};
  if (!isUuid(source.id)) throw new AdminValidationError('Identifiant utilisateur invalide.');

  const updates: Record<string, any> = {};
  if (source.name !== undefined) {
    const name = String(source.name).trim();
    if (name.length < 2 || name.length > 120) throw new AdminValidationError('Nom invalide.');
    updates.name = name;
  }
  if (source.role !== undefined) {
    if (!PLATFORM_ROLES.includes(source.role)) throw new AdminValidationError('Rôle non autorisé.');
    updates.role = source.role;
  }
  if (source.status !== undefined) {
    if (!ACCOUNT_STATUSES.includes(source.status)) throw new AdminValidationError('Statut non autorisé.');
    updates.status = source.status;
  }
  if (source.permissions !== undefined) {
    updates.permissions = normalizePermissions(source.permissions, source.role || 'user');
  }
  if (source.country !== undefined) updates.country = String(source.country).trim().slice(0, 80);
  if (source.city !== undefined) updates.city = String(source.city).trim().slice(0, 80);
  if (source.title !== undefined) updates.title = String(source.title).trim().slice(0, 120);
  if (source.kycVerified !== undefined) updates.kycVerified = Boolean(source.kycVerified);
  if (source.notes !== undefined) updates.notes = String(source.notes).trim().slice(0, 2000);

  if (Object.keys(updates).length === 0) {
    throw new AdminValidationError('Aucune modification valide fournie.');
  }

  return {
    id: source.id,
    reason: String(source.reason || '').trim().slice(0, 500),
    updates
  };
};

export const canManageTarget = ({ actor, targetRole = 'user', requestedRole, action }: {
  actor: { role?: unknown; permissions?: unknown };
  targetRole?: unknown;
  requestedRole?: unknown;
  action?: string | null;
}): boolean => {
  const actorRole = normalizeRole(actor?.role);
  const permissions = Array.isArray(actor?.permissions) ? actor.permissions : [];
  if (actorRole === 'super_admin') return true;
  if (actorRole !== 'admin' || !permissions.includes('manage_users')) return false;

  const normalizedTarget = normalizeRole(targetRole);
  const normalizedRequested = requestedRole ? normalizeRole(requestedRole) : undefined;
  if (normalizedTarget === 'admin' || normalizedTarget === 'super_admin') return false;
  if (normalizedRequested === 'admin' || normalizedRequested === 'super_admin') return false;

  const requiredPermission = {
    role: 'manage_roles',
    permissions: 'manage_permissions',
    status: 'suspend_users',
    delete: 'delete_users'
  }[action];

  return !requiredPermission || permissions.includes(requiredPermission);
};
