import { createClient, type SupabaseClient, type User } from '@supabase/supabase-js';
import type { Config, Context } from '@netlify/functions';
import {
  AdminValidationError,
  canManageTarget,
  isUuid,
  normalizePermissions,
  normalizeRole,
  parseBearerToken,
  validateCreatePayload,
  validatePatchPayload
} from './_shared/admin-contract';

type JsonRecord = Record<string, unknown>;

const AI_PROVIDER_ENVIRONMENT = Object.freeze([
  ['gemini', 'GEMINI_API_KEY'],
  ['openai', 'OPENAI_API_KEY'],
  ['claude', 'ANTHROPIC_API_KEY'],
  ['deepseek', 'DEEPSEEK_API_KEY'],
  ['kimi', 'KIMI_API_KEY'],
  ['qwen', 'QWEN_API_KEY'],
  ['mistral', 'MISTRAL_API_KEY'],
  ['grok', 'XAI_API_KEY'],
  ['openrouter', 'OPENROUTER_API_KEY'],
  ['replicate', 'REPLICATE_API_TOKEN'],
  ['huggingface', 'HUGGINGFACE_API_KEY']
] as const);

const json = (status: number, body: JsonRecord, requestId: string) =>
  new Response(JSON.stringify({ ...body, requestId }), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
      'x-request-id': requestId
    }
  });

const getAdminClient = (): SupabaseClient => {
  const url = Netlify.env.get('SUPABASE_URL') || Netlify.env.get('VITE_SUPABASE_URL');
  const serviceRoleKey = Netlify.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceRoleKey) throw new Error('SERVER_CONFIGURATION_MISSING');
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
  });
};

const readJson = async (request: Request): Promise<JsonRecord> => {
  const contentType = request.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) throw new AdminValidationError('Corps JSON requis.');
  try {
    return await request.json() as JsonRecord;
  } catch {
    throw new AdminValidationError('JSON invalide.');
  }
};

const serverProviderConfiguration = () => AI_PROVIDER_ENVIRONMENT.map(([provider, envVar]) => ({
  provider,
  envVar,
  configured: Boolean(Netlify.env.get(envVar))
}));

const invitationRedirect = (): string | undefined => {
  const configuredUrl = Netlify.env.get('URL') || Netlify.env.get('DEPLOY_PRIME_URL');
  if (!configuredUrl) return undefined;
  try {
    const url = new URL(configuredUrl);
    return url.protocol === 'https:' ? `${url.origin}/` : undefined;
  } catch {
    return undefined;
  }
};

const consumeMutationQuota = async (client: SupabaseClient, actorId: string): Promise<boolean> => {
  const { data, error } = await client.rpc('admin_consume_rate_limit', {
    p_actor_id: actorId,
    p_limit: 30
  });
  if (error) throw error;
  return data === true;
};

const loadActor = async (request: Request, client: SupabaseClient) => {
  const token = parseBearerToken(request.headers.get('authorization'));
  if (!token) return { error: 'AUTH_REQUIRED' as const };

  const { data: authData, error: authError } = await client.auth.getUser(token);
  if (authError || !authData.user) return { error: 'AUTH_INVALID' as const };

  const { data: profile, error: profileError } = await client
    .from('profiles')
    .select('id, email, name, role, status, permissions')
    .eq('id', authData.user.id)
    .single();

  if (profileError || !profile) return { error: 'PROFILE_MISSING' as const };
  const actor = {
    ...profile,
    role: normalizeRole(profile.role),
    permissions: normalizePermissions(profile.permissions, profile.role)
  };
  if (!['admin', 'super_admin'].includes(actor.role) || actor.status !== 'active') {
    return { error: 'FORBIDDEN' as const };
  }
  if (actor.role !== 'super_admin' && !actor.permissions.includes('manage_users')) {
    return { error: 'FORBIDDEN' as const };
  }
  return { actor, authUser: authData.user };
};

const recordAudit = async (
  client: SupabaseClient,
  entry: {
    actorId: string;
    targetId?: string | null;
    action: string;
    outcome: 'success' | 'denied' | 'error';
    requestId: string;
    metadata?: JsonRecord;
  }
) => {
  const { error } = await client.from('audit_logs').insert({
    actor_id: entry.actorId,
    action: entry.action,
    entity_type: 'profile',
    entity_id: entry.targetId || null,
    request_id: entry.requestId,
    metadata: { ...(entry.metadata || {}), outcome: entry.outcome }
  });
  if (error) console.error(`[${entry.requestId}] audit_write_failed`, error.code);
};

const mapUser = (authUser: User, profile: Record<string, any> | undefined, presence?: Record<string, any>) => ({
  id: authUser.id,
  email: authUser.email || profile?.email || '',
  name: profile?.name || authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'Utilisateur',
  role: normalizeRole(profile?.role || authUser.app_metadata?.role),
  status: profile?.status || (authUser.banned_until && new Date(authUser.banned_until) > new Date() ? 'suspended' : 'active'),
  permissions: normalizePermissions(profile?.permissions, profile?.role),
  country: profile?.country || '',
  city: profile?.city || '',
  title: profile?.title || '',
  bio: profile?.bio || '',
  phone: profile?.phone || '',
  citizenshipId: profile?.citizenship_id || '',
  credits: Number(profile?.credits || 0),
  joinedAt: profile?.created_at || authUser.created_at,
  lastLogin: authUser.last_sign_in_at || '',
  kycVerified: profile?.is_verified === true,
  avatarUrl: profile?.avatar_url || authUser.user_metadata?.avatar_url || '',
  origin: 'supabase_cloud',
  level: Number(profile?.level || 1),
  xp: Number(profile?.xp || 0),
  lastSeenOnline: presence?.last_seen_at || null,
  isOnline: presence?.status === 'online' && Boolean(presence?.last_seen_at && Date.now() - new Date(presence.last_seen_at).getTime() < 120_000),
  notes: profile?.admin_notes || ''
});

const listDirectory = async (request: Request, client: SupabaseClient, actor: Record<string, any>, requestId: string) => {
  const url = new URL(request.url);
  const page = Math.max(1, Number.parseInt(url.searchParams.get('page') || '1', 10) || 1);
  const perPage = Math.min(200, Math.max(1, Number.parseInt(url.searchParams.get('per_page') || '100', 10) || 100));
  const query = (url.searchParams.get('q') || '').trim().toLowerCase().slice(0, 120);

  const mayViewAudit = actor.role === 'super_admin' || actor.permissions.includes('view_audit_logs');
  const auditRequest = mayViewAudit
    ? client
      .from('audit_logs')
      .select('id, created_at, actor_id, entity_id, action, request_id, metadata')
      .eq('entity_type', 'profile')
      .order('created_at', { ascending: false })
      .limit(100)
    : Promise.resolve({ data: [], error: null });

  const [{ data: authData, error: authError }, { data: auditRows, error: auditError }] = await Promise.all([
    client.auth.admin.listUsers({ page, perPage }),
    auditRequest
  ]);
  if (authError) throw authError;

  const authUsers = authData.users || [];
  const ids = authUsers.map((user) => user.id);
  const [{ data: profiles, error: profileError }, { data: presences, error: presenceError }] = ids.length > 0
    ? await Promise.all([
      client
        .from('profiles')
        .select('id,email,name,title,bio,role,status,permissions,country,city,citizenship_id,phone,credits,xp,level,avatar_url,is_verified,admin_notes,created_at')
        .in('id', ids),
      client.from('user_presence').select('user_id,status,last_seen_at').in('user_id', ids)
    ])
    : [{ data: [], error: null }, { data: [], error: null }];
  if (profileError) throw profileError;
  if (presenceError) console.error(`[${requestId}] presence_read_failed`, presenceError.code);

  const byId = new Map((profiles || []).map((profile: Record<string, any>) => [profile.id, profile]));
  const presenceById = new Map((presences || []).map((presence: Record<string, any>) => [presence.user_id, presence]));
  const users = authUsers
    .map((user) => mapUser(user, byId.get(user.id), presenceById.get(user.id)))
    .filter((user) => !query || `${user.name} ${user.email} ${user.country} ${user.city}`.toLowerCase().includes(query));

  return json(200, {
    users,
    audit: auditError ? [] : (auditRows || []).map((entry: Record<string, any>) => ({
      id: entry.id,
      created_at: entry.created_at,
      actor_id: entry.actor_id,
      target_id: entry.entity_id || null,
      action: entry.action,
      outcome: entry.metadata?.outcome || 'success',
      request_id: entry.request_id || '',
      metadata: entry.metadata || {}
    })),
    actor: { id: actor.id, role: actor.role, permissions: actor.permissions },
    serverConfiguration: { aiProviders: serverProviderConfiguration() },
    pagination: { page, perPage, returned: users.length }
  }, requestId);
};

const createUser = async (request: Request, client: SupabaseClient, actor: Record<string, any>, requestId: string) => {
  const input = validateCreatePayload(await readJson(request));
  const createActions = [
    input.role !== 'user' ? 'role' : 'profile',
    input.permissions.some(permission => permission !== 'standard_access') ? 'permissions' : null,
    input.status !== 'pending' ? 'status' : null
  ].filter(Boolean);
  if (createActions.some(action => !canManageTarget({ actor, requestedRole: input.role, action }))) {
    await recordAudit(client, { actorId: actor.id, action: 'user.create', outcome: 'denied', requestId, metadata: { requestedRole: input.role } });
    return json(403, { error: { code: 'ROLE_FORBIDDEN', message: 'Vous ne pouvez pas attribuer ce rôle.' } }, requestId);
  }

  const { data: inviteData, error: inviteError } = await client.auth.admin.inviteUserByEmail(input.email, {
    data: { name: input.name },
    redirectTo: invitationRedirect()
  });
  if (inviteError || !inviteData.user) throw inviteError || new Error('AUTH_USER_CREATION_FAILED');

  const userId = inviteData.user.id;
  const { data: createdProfile, error: profileError } = await client.from('profiles').update({
    name: input.name,
    role: input.role,
    status: input.status,
    permissions: input.permissions,
    country: input.country,
    city: input.city,
    title: input.title,
    updated_at: new Date().toISOString()
  }).eq('id', userId).select('id').single();

  if (profileError || !createdProfile) {
    await client.auth.admin.deleteUser(userId, false);
    throw profileError || new Error('PROFILE_TRIGGER_FAILED');
  }

  const { error: metadataError } = await client.auth.admin.updateUserById(userId, { app_metadata: { role: input.role } });
  if (metadataError) {
    await client.auth.admin.deleteUser(userId, false);
    throw metadataError;
  }
  if (input.status === 'suspended') {
    const { error: banError } = await client.auth.admin.updateUserById(userId, { ban_duration: '876000h' });
    if (banError) {
      await client.auth.admin.deleteUser(userId, false);
      throw banError;
    }
  }
  await recordAudit(client, { actorId: actor.id, targetId: userId, action: 'user.create', outcome: 'success', requestId, metadata: { role: input.role, status: input.status } });
  return json(201, { user: { id: userId }, message: 'Invitation créée et profil Supabase synchronisé.' }, requestId);
};

const updateUser = async (request: Request, client: SupabaseClient, actor: Record<string, any>, requestId: string) => {
  const input = validatePatchPayload(await readJson(request));
  const { data: target, error: targetError } = await client
    .from('profiles')
    .select('id,email,name,role,status,permissions,country,city,title,is_verified,admin_notes')
    .eq('id', input.id)
    .single();
  if (targetError || !target) return json(404, { error: { code: 'USER_NOT_FOUND', message: 'Compte introuvable.' } }, requestId);

  if (!canManageTarget({ actor, targetRole: target.role, action: 'profile' })) {
    await recordAudit(client, { actorId: actor.id, targetId: input.id, action: 'user.update', outcome: 'denied', requestId });
    return json(403, { error: { code: 'TARGET_FORBIDDEN', message: 'Vous ne pouvez pas modifier ce compte.' } }, requestId);
  }

  const actions = [
    input.updates.role !== undefined ? 'role' : null,
    input.updates.permissions !== undefined ? 'permissions' : null,
    input.updates.status !== undefined ? 'status' : null
  ].filter(Boolean);
  if (actions.some((action) => !canManageTarget({ actor, targetRole: target.role, requestedRole: input.updates.role, action }))) {
    await recordAudit(client, { actorId: actor.id, targetId: input.id, action: 'user.update', outcome: 'denied', requestId });
    return json(403, { error: { code: 'TARGET_FORBIDDEN', message: 'Vous ne pouvez pas modifier ce compte.' } }, requestId);
  }
  if (actor.id === input.id && input.updates.status && input.updates.status !== 'active') {
    return json(409, { error: { code: 'SELF_SUSPEND_FORBIDDEN', message: 'Vous ne pouvez pas suspendre votre propre compte.' } }, requestId);
  }
  if (normalizeRole(target.role) === 'super_admin' && (
    (input.updates.role && input.updates.role !== 'super_admin') ||
    (input.updates.status && input.updates.status !== 'active')
  )) {
    const { count } = await client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'super_admin');
    if ((count || 0) <= 1) {
      return json(409, { error: { code: 'LAST_SUPER_ADMIN', message: 'Le dernier super-administrateur doit rester actif.' } }, requestId);
    }
  }

  const profileUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const key of ['name', 'role', 'status', 'permissions', 'country', 'city', 'title']) {
    if (input.updates[key] !== undefined) profileUpdates[key] = input.updates[key];
  }
  if (input.updates.kycVerified !== undefined) profileUpdates.is_verified = input.updates.kycVerified;
  if (input.updates.notes !== undefined) profileUpdates.admin_notes = input.updates.notes;

  const { error: updateError } = await client.from('profiles').update(profileUpdates).eq('id', input.id);
  if (updateError) throw updateError;

  const authUpdates: Record<string, unknown> = {};
  if (input.updates.role) authUpdates.app_metadata = { role: input.updates.role };
  if (input.updates.status) authUpdates.ban_duration = input.updates.status === 'suspended' ? '876000h' : 'none';
  if (Object.keys(authUpdates).length > 0) {
    const { error: authUpdateError } = await client.auth.admin.updateUserById(input.id, authUpdates);
    if (authUpdateError) {
      await client.from('profiles').update({
        role: target.role,
        status: target.status,
        permissions: target.permissions,
        name: target.name,
        country: target.country,
        city: target.city,
        title: target.title,
        is_verified: target.is_verified,
        admin_notes: target.admin_notes
      }).eq('id', input.id);
      throw authUpdateError;
    }
  }

  await recordAudit(client, {
    actorId: actor.id,
    targetId: input.id,
    action: 'user.update',
    outcome: 'success',
    requestId,
    metadata: { fields: Object.keys(input.updates), reason: input.reason || undefined }
  });
  return json(200, { message: 'Compte mis à jour côté serveur.' }, requestId);
};

const deleteUser = async (request: Request, client: SupabaseClient, actor: Record<string, any>, requestId: string) => {
  const url = new URL(request.url);
  const id = url.searchParams.get('id') || '';
  if (!isUuid(id)) throw new AdminValidationError('Identifiant utilisateur invalide.');
  if (actor.id === id) return json(409, { error: { code: 'SELF_DELETE_FORBIDDEN', message: 'Vous ne pouvez pas supprimer votre propre compte.' } }, requestId);

  const { data: target, error: targetError } = await client.from('profiles').select('id,email,role').eq('id', id).single();
  if (targetError || !target) return json(404, { error: { code: 'USER_NOT_FOUND', message: 'Compte introuvable.' } }, requestId);
  if (!canManageTarget({ actor, targetRole: target.role, action: 'delete' })) {
    await recordAudit(client, { actorId: actor.id, targetId: id, action: 'user.delete', outcome: 'denied', requestId });
    return json(403, { error: { code: 'TARGET_FORBIDDEN', message: 'Vous ne pouvez pas supprimer ce compte.' } }, requestId);
  }
  if (normalizeRole(target.role) === 'super_admin') {
    const { count } = await client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'super_admin');
    if ((count || 0) <= 1) return json(409, { error: { code: 'LAST_SUPER_ADMIN', message: 'Le dernier super-administrateur ne peut pas être supprimé.' } }, requestId);
  }

  const { error: deleteError } = await client.auth.admin.deleteUser(id, false);
  if (deleteError) throw deleteError;
  await recordAudit(client, { actorId: actor.id, targetId: id, action: 'user.delete', outcome: 'success', requestId, metadata: { targetRole: normalizeRole(target.role) } });
  return json(200, { message: 'Compte Auth et profil supprimés.' }, requestId);
};

export default async (request: Request, context: Context): Promise<Response> => {
  const requestId = context.requestId || crypto.randomUUID();
  if (request.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: { 'cache-control': 'no-store', 'x-content-type-options': 'nosniff', 'x-request-id': requestId }
    });
  }
  if (!['GET', 'POST', 'PATCH', 'DELETE'].includes(request.method)) {
    return json(405, { error: { code: 'METHOD_NOT_ALLOWED', message: 'Méthode non autorisée.' } }, requestId);
  }

  try {
    const client = getAdminClient();
    const loaded = await loadActor(request, client);
    if ('error' in loaded) {
      const status = loaded.error === 'FORBIDDEN' ? 403 : 401;
      return json(status, { error: { code: loaded.error, message: status === 403 ? 'Accès administrateur refusé.' : 'Authentification requise.' } }, requestId);
    }

    if (request.method !== 'GET' && !await consumeMutationQuota(client, loaded.actor.id)) {
      await recordAudit(client, {
        actorId: loaded.actor.id,
        action: 'admin.rate_limit',
        outcome: 'denied',
        requestId,
        metadata: { method: request.method }
      });
      return json(429, { error: { code: 'RATE_LIMITED', message: 'Trop d’opérations administratives. Réessayez dans une minute.' } }, requestId);
    }

    if (request.method === 'GET') return listDirectory(request, client, loaded.actor, requestId);
    if (request.method === 'POST') return createUser(request, client, loaded.actor, requestId);
    if (request.method === 'PATCH') return updateUser(request, client, loaded.actor, requestId);
    return deleteUser(request, client, loaded.actor, requestId);
  } catch (error: any) {
    const validation = error instanceof AdminValidationError;
    const configuration = error?.message === 'SERVER_CONFIGURATION_MISSING';
    console.error(`[${requestId}] admin_users_failed`, error?.code || error?.name || 'UNKNOWN');
    return json(configuration ? 503 : validation ? 400 : 500, {
      error: {
        code: configuration ? 'SERVER_CONFIGURATION_MISSING' : validation ? error.code : 'INTERNAL_ERROR',
        message: configuration
          ? 'La fonction d’administration n’est pas configurée.'
          : validation
            ? error.message
            : 'L’opération administrative a échoué.'
      }
    }, requestId);
  }
};

export const config: Config = {
  path: '/api/admin/users',
  method: ['GET', 'POST', 'PATCH', 'DELETE']
};
