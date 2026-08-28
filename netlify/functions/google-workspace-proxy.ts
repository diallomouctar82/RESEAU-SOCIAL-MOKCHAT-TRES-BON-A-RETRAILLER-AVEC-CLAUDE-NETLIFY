import type { Config, Context } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

declare const Netlify: { env: { get(name: string): string | undefined } } | undefined;

const json = (status: number, body: object) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const fail = (status: number, code: string, message: string) => json(status, { ok: false, error: { code, message } });
const env = (name: string) => typeof Netlify !== 'undefined' ? Netlify.env.get(name) : undefined;
const ALLOWED_ACTIONS = new Set([
  'drive.list', 'drive.createFolder', 'drive.delete', 'drive.upload',
  'chat.listSpaces', 'chat.createSpace', 'chat.listMessages', 'chat.sendMessage',
  'meet.create', 'meet.get',
]);

const verifyUser = async (request: Request): Promise<string | null> => {
  const authorization = request.headers.get('authorization');
  const token = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  const url = env('SUPABASE_URL');
  const anon = env('SUPABASE_ANON_KEY');
  if (!token || !url || !anon) return null;
  const response = await fetch(`${url.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anon },
    signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) return null;
  const user = await response.json() as { id?: string };
  return user.id ?? null;
};

const consumeQuota = async (userId: string): Promise<boolean> => {
  const url = env('SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return false;
  const client = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.rpc('consume_api_quota', {
    p_user_id: userId,
    p_scope: 'google-workspace-proxy',
    p_limit: 60,
    p_window_seconds: 60,
  });
  return !error && data === true;
};

const googleFetch = async (url: string, token: string, init: RequestInit = {}) => {
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  let response: Response;
  try {
    response = await fetch(url, { ...init, headers, signal: AbortSignal.timeout(15_000) });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new Error('GOOGLE_TIMEOUT');
    throw error;
  }
  if (!response.ok) throw new Error(`GOOGLE_${response.status}`);
  if (response.status === 204) return {};
  const declared = Number(response.headers.get('content-length') ?? 0);
  if (declared > 2_000_000) throw new Error('GOOGLE_RESPONSE_TOO_LARGE');
  const raw = await response.text();
  if (new TextEncoder().encode(raw).byteLength > 2_000_000) throw new Error('GOOGLE_RESPONSE_TOO_LARGE');
  try { return JSON.parse(raw); } catch { throw new Error('GOOGLE_INVALID_RESPONSE'); }
};

const validDriveId = (value: unknown) => typeof value === 'string' && /^[A-Za-z0-9_-]{5,200}$/.test(value);
const validSpace = (value: unknown) => typeof value === 'string' && /^spaces\/[A-Za-z0-9_-]{3,200}$/.test(value);

const execute = async (action: string, body: Record<string, any>, token: string) => {
  if (action === 'drive.list') {
    const params = new URLSearchParams({
      pageSize: '50',
      fields: 'nextPageToken,files(id,name,mimeType,modifiedTime,size,iconLink,thumbnailLink,webViewLink,webContentLink,starred,trashed,parents)',
      orderBy: 'folder,modifiedTime desc',
    });
    let query = 'trashed = false';
    if (body.folderId) {
      if (!validDriveId(body.folderId)) throw new Error('INVALID_REQUEST');
      query += ` and '${body.folderId}' in parents`;
    }
    if (body.searchQuery) query += ` and name contains '${String(body.searchQuery).slice(0, 100).replace(/'/g, "\\'")}'`;
    params.set('q', query);
    return googleFetch(`https://www.googleapis.com/drive/v3/files?${params}`, token);
  }
  if (action === 'drive.createFolder') {
    if (!body.name || String(body.name).length > 140 || (body.parentId && !validDriveId(body.parentId))) throw new Error('INVALID_REQUEST');
    return googleFetch('https://www.googleapis.com/drive/v3/files?fields=id,name,mimeType,webViewLink,parents', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: String(body.name), mimeType: 'application/vnd.google-apps.folder', ...(body.parentId ? { parents: [body.parentId] } : {}) }),
    });
  }
  if (action === 'drive.delete') {
    if (!validDriveId(body.fileId)) throw new Error('INVALID_REQUEST');
    return googleFetch(`https://www.googleapis.com/drive/v3/files/${body.fileId}`, token, { method: 'DELETE' });
  }
  if (action === 'drive.upload') {
    const data = String(body.data ?? '');
    if (!body.name || data.length > 5_500_000 || data.length < 1 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data)
      || (body.parentId && !validDriveId(body.parentId))) throw new Error('INVALID_REQUEST');
    const metadata = { name: String(body.name).slice(0, 255), mimeType: String(body.mimeType || 'application/octet-stream'), ...(body.parentId ? { parents: [body.parentId] } : {}) };
    if (metadata.mimeType.length > 120) throw new Error('INVALID_REQUEST');
    const decoded = Buffer.from(data, 'base64');
    if (decoded.byteLength > 4_000_000) throw new Error('INVALID_REQUEST');
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([decoded], { type: metadata.mimeType }), metadata.name);
    return googleFetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink,thumbnailLink', token, { method: 'POST', body: form });
  }
  if (action === 'chat.listSpaces') return googleFetch('https://chat.googleapis.com/v1/spaces?pageSize=50', token);
  if (action === 'chat.createSpace') {
    if (!body.displayName || String(body.displayName).length > 128) throw new Error('INVALID_REQUEST');
    return googleFetch('https://chat.googleapis.com/v1/spaces', token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ spaceType: 'SPACE', displayName: String(body.displayName), ...(body.description ? { spaceDetails: { description: String(body.description).slice(0, 500) } } : {}) }),
    });
  }
  if (action === 'chat.listMessages') {
    if (!validSpace(body.spaceName)) throw new Error('INVALID_REQUEST');
    return googleFetch(`https://chat.googleapis.com/v1/${body.spaceName}/messages?pageSize=50&orderBy=createTime%20desc`, token);
  }
  if (action === 'chat.sendMessage') {
    if (!validSpace(body.spaceName) || !body.text || String(body.text).length > 4_000) throw new Error('INVALID_REQUEST');
    return googleFetch(`https://chat.googleapis.com/v1/${body.spaceName}/messages`, token, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: String(body.text) }),
    });
  }
  if (action === 'meet.create') return googleFetch('https://meet.googleapis.com/v2/spaces', token, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  if (action === 'meet.get') {
    if (!validSpace(body.spaceName)) throw new Error('INVALID_REQUEST');
    return googleFetch(`https://meet.googleapis.com/v2/${body.spaceName}`, token);
  }
  throw new Error('INVALID_REQUEST');
};

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'POST') return fail(405, 'METHOD_NOT_ALLOWED', 'Méthode non autorisée.');
  const declared = Number(request.headers.get('content-length') ?? 0);
  if (declared > 6_000_000) return fail(413, 'PAYLOAD_TOO_LARGE', 'La requête dépasse la taille autorisée.');
  const userId = await verifyUser(request).catch(() => null);
  if (!userId) return fail(401, 'AUTH_INVALID', 'Session Supabase invalide ou expirée.');
  const googleToken = request.headers.get('x-google-access-token');
  if (!googleToken || googleToken.length > 4096) return fail(401, 'GOOGLE_CONSENT_REQUIRED', 'Autorisation Google requise.');
  let body: Record<string, any>;
  try {
    const raw = await request.arrayBuffer();
    if (raw.byteLength > 6_000_000) return fail(413, 'PAYLOAD_TOO_LARGE', 'La requête dépasse la taille autorisée.');
    body = JSON.parse(new TextDecoder().decode(raw));
  } catch { return fail(400, 'INVALID_JSON', 'Corps JSON invalide.'); }
  const action = String(body.action ?? '');
  if (!ALLOWED_ACTIONS.has(action)) return fail(400, 'INVALID_REQUEST', 'Action non autorisée.');
  if (!await consumeQuota(userId)) return fail(429, 'RATE_LIMITED', 'Quota temporaire atteint.');
  try {
    const data = await execute(action, body, googleToken);
    return json(200, { ok: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : '';
    if (message === 'INVALID_REQUEST') return fail(400, 'INVALID_REQUEST', 'Paramètres invalides.');
    if (message === 'GOOGLE_TIMEOUT') return fail(504, 'GOOGLE_TIMEOUT', 'Google Workspace n’a pas répondu dans le délai autorisé.');
    if (message === 'GOOGLE_RESPONSE_TOO_LARGE') return fail(502, 'GOOGLE_RESPONSE_TOO_LARGE', 'La réponse Google dépasse la taille autorisée.');
    console.error('google-workspace upstream failure', message);
    return fail(502, 'GOOGLE_UPSTREAM_FAILED', 'Google Workspace n’a pas pu traiter la demande. Vérifiez le consentement et les APIs activées.');
  }
};

export const config: Config = { path: '/api/google-workspace' };
