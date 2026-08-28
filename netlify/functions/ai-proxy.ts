import type { Config, Context } from '@netlify/functions';
import { GoogleGenAI } from '@google/genai';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

declare const Netlify: { env: { get(name: string): string | undefined } } | undefined;

type ErrorCode =
  | 'METHOD_NOT_ALLOWED' | 'PAYLOAD_TOO_LARGE' | 'INVALID_JSON' | 'INVALID_REQUEST'
  | 'AUTH_INVALID' | 'RATE_LIMITED' | 'MODEL_NOT_ALLOWED' | 'PROVIDER_NOT_CONFIGURED'
  | 'OPERATION_FORBIDDEN' | 'ASSET_NOT_FOUND' | 'UPSTREAM_TIMEOUT' | 'UPSTREAM_FAILED';
interface AuthenticatedUser { id: string; }
interface StoredAsset { storagePath: string; signedUrl: string; mimeType: string; assetId: string; }

const MODEL_ALLOWLIST = new Set([
  'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3-flash-preview',
  'gemini-3-pro-preview', 'gemini-3-pro-image-preview', 'gemini-2.5-flash-image',
  'gemini-2.5-flash-preview-tts', 'veo-3.1-fast-generate-preview',
]);
const INPUT_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']);
const IMAGE_ASPECT_RATIOS = new Set(['1:1', '3:2', '2:3', '4:3', '3:4', '16:9', '9:16']);
const VIDEO_ASPECT_RATIOS = new Set(['16:9', '9:16']);
const VOICE_ALLOWLIST = new Set(['Fenrir']);

const json = (status: number, body: object): Response => new Response(JSON.stringify(body), {
  status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
});
const fail = (status: number, code: ErrorCode, message: string) => json(status, { ok: false, error: { code, message } });
const env = (name: string): string | undefined => typeof Netlify === 'undefined' ? undefined : Netlify.env.get(name);
const bearer = (request: Request): string | null => {
  const value = request.headers.get('authorization');
  return value?.startsWith('Bearer ') ? value.slice(7).trim() : null;
};

class UpstreamTimeoutError extends Error {}
const withTimeout = async <T>(work: Promise<T>, timeoutMs: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      work,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new UpstreamTimeoutError('UPSTREAM_TIMEOUT')), timeoutMs);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const serviceClient = (): SupabaseClient | null => {
  const url = env('SUPABASE_URL');
  const serviceKey = env('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !serviceKey) return null;
  return createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
};

const verifyUser = async (request: Request): Promise<AuthenticatedUser | null> => {
  const token = bearer(request);
  const supabaseUrl = env('SUPABASE_URL');
  const anonKey = env('SUPABASE_ANON_KEY');
  if (!token || !supabaseUrl || !anonKey) return null;
  const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: anonKey }, signal: AbortSignal.timeout(6_000),
  });
  if (!response.ok) return null;
  const user = await response.json() as { id?: string };
  return user.id ? { id: user.id } : null;
};

const consumeQuota = async (userId: string): Promise<boolean> => {
  const client = serviceClient();
  if (!client) return false;
  const configured = Number(env('AI_REQUESTS_PER_MINUTE') ?? '20');
  const limit = Number.isFinite(configured) ? Math.max(1, Math.min(configured, 120)) : 20;
  const { data, error } = await client.rpc('consume_api_quota', {
    p_user_id: userId, p_scope: 'ai-proxy', p_limit: limit, p_window_seconds: 60,
  });
  return !error && data === true;
};

const readBody = async (request: Request): Promise<Record<string, unknown>> => {
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > 5_000_000) throw new Error('PAYLOAD_TOO_LARGE');
  const text = await request.text();
  if (text.length > 5_000_000) throw new Error('PAYLOAD_TOO_LARGE');
  try {
    const parsed = JSON.parse(text) as unknown;
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('INVALID_JSON');
    return parsed as Record<string, unknown>;
  } catch { throw new Error('INVALID_JSON'); }
};

const validateContents = (contents: unknown): boolean => {
  let totalText = 0;
  let totalInline = 0;
  let nodes = 0;
  const visit = (value: unknown, depth: number): boolean => {
    if (depth > 10 || ++nodes > 600) return false;
    if (typeof value === 'string') { totalText += value.length; return totalText <= 120_000; }
    if (value === null || typeof value !== 'object') return true;
    if (Array.isArray(value)) return value.length <= 100 && value.every((entry) => visit(entry, depth + 1));
    const object = value as Record<string, unknown>;
    if (object.inlineData && typeof object.inlineData === 'object') {
      const inline = object.inlineData as Record<string, unknown>;
      if (!INPUT_MIME_TYPES.has(String(inline.mimeType ?? '')) || typeof inline.data !== 'string') return false;
      totalInline += inline.data.length;
      if (totalInline > 4_500_000) return false;
    }
    return Object.entries(object).every(([key, entry]) => key.length <= 80 && visit(entry, depth + 1));
  };
  return visit(contents, 0);
};

const numberInRange = (value: unknown, min: number, max: number): number | undefined => {
  const number = Number(value);
  return Number.isFinite(number) && number >= min && number <= max ? number : undefined;
};

const sanitizeGenerateConfig = (raw: unknown): Record<string, unknown> => {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { maxOutputTokens: 8192 };
  const input = raw as Record<string, any>;
  const safe: Record<string, unknown> = { maxOutputTokens: numberInRange(input.maxOutputTokens, 1, 8192) ?? 8192 };
  if (typeof input.systemInstruction === 'string' && input.systemInstruction.length <= 16_000) safe.systemInstruction = input.systemInstruction;
  if (input.responseMimeType === 'application/json' || input.responseMimeType === 'text/plain') safe.responseMimeType = input.responseMimeType;
  const temperature = numberInRange(input.temperature, 0, 2);
  const topP = numberInRange(input.topP, 0, 1);
  const topK = numberInRange(input.topK, 1, 100);
  if (temperature !== undefined) safe.temperature = temperature;
  if (topP !== undefined) safe.topP = topP;
  if (topK !== undefined) safe.topK = topK;
  const thinkingBudget = numberInRange(input.thinkingConfig?.thinkingBudget, 0, 2048);
  if (thinkingBudget !== undefined) safe.thinkingConfig = { thinkingBudget };
  if (input.imageConfig && IMAGE_ASPECT_RATIOS.has(input.imageConfig.aspectRatio)) {
    safe.imageConfig = { aspectRatio: input.imageConfig.aspectRatio, imageSize: input.imageConfig.imageSize === '2K' ? '2K' : '1K' };
  }
  const voiceName = input.speechConfig?.voiceConfig?.prebuiltVoiceConfig?.voiceName;
  if (Array.isArray(input.responseModalities) && input.responseModalities.length === 1
      && input.responseModalities[0] === 'AUDIO' && VOICE_ALLOWLIST.has(voiceName)) {
    safe.responseModalities = ['AUDIO'];
    safe.speechConfig = { voiceConfig: { prebuiltVoiceConfig: { voiceName } } };
  }
  return safe;
};

const sanitizeVideoConfig = (raw: unknown): Record<string, unknown> => {
  const input = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw as Record<string, unknown> : {};
  return { numberOfVideos: 1, resolution: '720p', aspectRatio: VIDEO_ASPECT_RATIOS.has(input.aspectRatio as string) ? input.aspectRatio : '16:9' };
};

const wavFromPcm = (pcm: Buffer, sampleRate = 24_000): Buffer => {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0); header.writeUInt32LE(36 + pcm.length, 4); header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16); header.writeUInt16LE(1, 20); header.writeUInt16LE(1, 22);
  header.writeUInt32LE(sampleRate, 24); header.writeUInt32LE(sampleRate * 2, 28);
  header.writeUInt16LE(2, 32); header.writeUInt16LE(16, 34); header.write('data', 36); header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
};

const signStoragePath = async (client: SupabaseClient, storagePath: string): Promise<string> => {
  const { data, error } = await client.storage.from('studio-generated').createSignedUrl(storagePath, 3600);
  if (error || !data?.signedUrl) throw error ?? new Error('SIGNED_URL_FAILED');
  return data.signedUrl;
};

const persistMedia = async (userId: string, data: string, sourceMimeType: string): Promise<StoredAsset> => {
  const client = serviceClient();
  if (!client) throw new Error('PROVIDER_NOT_CONFIGURED');
  let bytes = Buffer.from(data, 'base64');
  let mimeType = sourceMimeType.split(';')[0].toLowerCase();
  if (sourceMimeType.toLowerCase().startsWith('audio/pcm')) { bytes = wavFromPcm(bytes); mimeType = 'audio/wav'; }
  if (bytes.length === 0 || bytes.length > 100 * 1024 * 1024) throw new Error('INVALID_MEDIA');
  const extension = mimeType === 'image/png' ? 'png' : mimeType === 'image/jpeg' ? 'jpg'
    : mimeType === 'image/webp' ? 'webp' : mimeType === 'audio/wav' ? 'wav' : mimeType.startsWith('video/') ? 'mp4' : 'bin';
  const storagePath = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await client.storage.from('studio-generated').upload(storagePath, bytes, { contentType: mimeType, upsert: false });
  if (error) throw error;
  const { data: asset, error: assetError } = await client.from('ai_generated_assets').insert({
    owner_id: userId, storage_path: storagePath, mime_type: mimeType, byte_size: bytes.length,
  }).select('id').single();
  if (assetError || !asset) {
    await client.storage.from('studio-generated').remove([storagePath]);
    throw assetError ?? new Error('ASSET_RECORD_FAILED');
  }
  return { storagePath, signedUrl: await signStoragePath(client, storagePath), mimeType, assetId: String(asset.id) };
};

const sanitizeParts = async (response: any, userId: string) => {
  const source = Array.isArray(response?.candidates?.[0]?.content?.parts) ? response.candidates[0].content.parts.slice(0, 20) : [];
  const parts: Array<Record<string, unknown>> = [];
  for (const part of source) {
    if (typeof part?.text === 'string') { parts.push({ text: part.text.slice(0, 250_000) }); continue; }
    if (typeof part?.inlineData?.data === 'string' && typeof part?.inlineData?.mimeType === 'string') {
      const asset = await persistMedia(userId, part.inlineData.data, part.inlineData.mimeType);
      parts.push({ fileData: { mimeType: asset.mimeType, fileUri: asset.signedUrl, storagePath: asset.storagePath, assetId: asset.assetId } });
    }
  }
  return parts;
};

const generate = async (body: Record<string, unknown>, user: AuthenticatedUser) => {
  const model = String(body.model ?? 'gemini-2.5-flash');
  if (!MODEL_ALLOWLIST.has(model) || model.startsWith('veo-')) return fail(400, 'MODEL_NOT_ALLOWED', 'Modèle non autorisé pour cette opération.');
  const key = env('GEMINI_API_KEY');
  if (!key) return fail(503, 'PROVIDER_NOT_CONFIGURED', 'Le fournisseur IA serveur n’est pas configuré.');
  if (!body.contents || !validateContents(body.contents)) return fail(400, 'INVALID_REQUEST', 'Le contenu est invalide ou dépasse les limites.');
  const ai = new GoogleGenAI({ apiKey: key });
  const response = await withTimeout(ai.models.generateContent({ model, contents: body.contents as any, config: sanitizeGenerateConfig(body.config) }), 45_000);
  const parts = await sanitizeParts(response, user.id);
  const firstAsset = parts.find((part) => part.fileData) as { fileData?: { fileUri?: string; storagePath?: string } } | undefined;
  return json(200, { ok: true, text: String(response.text ?? '').slice(0, 250_000), parts,
    mediaUrl: firstAsset?.fileData?.fileUri, storagePath: firstAsset?.fileData?.storagePath, provider: 'gemini', model });
};

const sanitizeOperation = (operation: any, asset?: StoredAsset) => ({
  name: String(operation?.name ?? ''), done: Boolean(operation?.done),
  error: operation?.error ? { code: Number(operation.error.code ?? 0), message: String(operation.error.message ?? '').slice(0, 500) } : undefined,
  response: asset ? { generatedVideos: [{ video: { uri: asset.signedUrl, storagePath: asset.storagePath, assetId: asset.assetId } }] } : undefined,
});

const recordOperation = async (userId: string, operationName: string, model: string, status: string, storagePath?: string) => {
  const client = serviceClient();
  if (!client) throw new Error('PROVIDER_NOT_CONFIGURED');
  const { error } = await client.from('ai_operations').insert({
    operation_name: operationName, owner_id: userId, model, status, storage_path: storagePath ?? null,
  });
  if (error) throw error;
};

const ownedOperation = async (userId: string, operationName: string) => {
  const client = serviceClient();
  if (!client) throw new Error('PROVIDER_NOT_CONFIGURED');
  const { data, error } = await client.from('ai_operations').select('operation_name,owner_id,model,status,storage_path')
    .eq('operation_name', operationName).maybeSingle();
  if (error) throw error;
  if (!data || data.owner_id !== userId) return null;
  return data as { model: string; status: string; storage_path?: string | null };
};

const markOperation = async (operationName: string, status: string, storagePath?: string) => {
  const client = serviceClient();
  if (!client) throw new Error('PROVIDER_NOT_CONFIGURED');
  const { error } = await client.from('ai_operations').update({ status, storage_path: storagePath ?? null }).eq('operation_name', operationName);
  if (error) throw error;
};

const persistCompletedVideo = async (operation: any, userId: string, apiKey: string): Promise<{ safe: ReturnType<typeof sanitizeOperation>; asset?: StoredAsset }> => {
  const uri = operation?.response?.generatedVideos?.[0]?.video?.uri;
  if (!uri) return { safe: sanitizeOperation(operation) };
  const response = await fetch(`${uri}${uri.includes('?') ? '&' : '?'}key=${encodeURIComponent(apiKey)}`, { signal: AbortSignal.timeout(20_000) });
  if (!response.ok) throw new Error(`VIDEO_DOWNLOAD_${response.status}`);
  const asset = await persistMedia(userId, Buffer.from(await response.arrayBuffer()).toString('base64'), response.headers.get('content-type') ?? 'video/mp4');
  return { safe: sanitizeOperation(operation, asset), asset };
};

const videoStart = async (body: Record<string, unknown>, user: AuthenticatedUser) => {
  const model = String(body.model ?? 'veo-3.1-fast-generate-preview');
  if (!MODEL_ALLOWLIST.has(model) || !model.startsWith('veo-')) return fail(400, 'MODEL_NOT_ALLOWED', 'Modèle vidéo non autorisé.');
  const prompt = String(body.prompt ?? '').trim();
  if (!prompt || prompt.length > 8_000) return fail(400, 'INVALID_REQUEST', 'Le prompt vidéo est invalide.');
  const key = env('GEMINI_API_KEY');
  if (!key) return fail(503, 'PROVIDER_NOT_CONFIGURED', 'Le fournisseur vidéo serveur n’est pas configuré.');
  const ai = new GoogleGenAI({ apiKey: key });
  const operation = await withTimeout(ai.models.generateVideos({ model, prompt, config: sanitizeVideoConfig(body.config) }), 45_000);
  const operationName = String(operation?.name ?? '');
  if (!operationName) throw new Error('MISSING_OPERATION_NAME');
  const completed = operation.done ? await persistCompletedVideo(operation, user.id, key) : { safe: sanitizeOperation(operation), asset: undefined };
  await recordOperation(user.id, operationName, model, operation.done ? 'completed' : 'running', completed.asset?.storagePath);
  return json(202, { ok: true, operation: completed.safe, provider: 'gemini', model });
};

const videoPoll = async (body: Record<string, unknown>, user: AuthenticatedUser) => {
  const operationName = String(body.operationName ?? '');
  if (!/^models\/[^/]+\/operations\/[A-Za-z0-9._-]+$/.test(operationName) && !/^operations\/[A-Za-z0-9._-]+$/.test(operationName)) {
    return fail(400, 'INVALID_REQUEST', 'Identifiant d’opération invalide.');
  }
  const owned = await ownedOperation(user.id, operationName);
  if (!owned) return fail(403, 'OPERATION_FORBIDDEN', 'Cette opération ne vous appartient pas.');
  const client = serviceClient();
  if (owned.status === 'completed' && owned.storage_path && client) {
    const signedUrl = await signStoragePath(client, owned.storage_path);
    return json(200, { ok: true, operation: { name: operationName, done: true,
      response: { generatedVideos: [{ video: { uri: signedUrl, storagePath: owned.storage_path } }] } }, provider: 'gemini' });
  }
  const key = env('GEMINI_API_KEY');
  if (!key) return fail(503, 'PROVIDER_NOT_CONFIGURED', 'Le fournisseur vidéo serveur n’est pas configuré.');
  const ai = new GoogleGenAI({ apiKey: key });
  const operation = await withTimeout(ai.operations.getVideosOperation({ operation: { name: operationName } as any }), 30_000);
  const completed = operation.done ? await persistCompletedVideo(operation, user.id, key) : { safe: sanitizeOperation(operation), asset: undefined };
  await markOperation(operationName, operation.done ? 'completed' : 'running', completed.asset?.storagePath);
  return json(200, { ok: true, operation: completed.safe, provider: 'gemini', model: owned.model });
};

const signAsset = async (body: Record<string, unknown>, user: AuthenticatedUser) => {
  const storagePath = String(body.storagePath ?? '');
  if (!/^[0-9a-f-]{36}\/[A-Za-z0-9._-]{1,200}$/.test(storagePath)) return fail(400, 'INVALID_REQUEST', 'Chemin de stockage invalide.');
  const client = serviceClient();
  if (!client) return fail(503, 'PROVIDER_NOT_CONFIGURED', 'Le stockage serveur n’est pas configuré.');
  const { data, error } = await client.from('ai_generated_assets').select('id,owner_id,mime_type,storage_path').eq('storage_path', storagePath).maybeSingle();
  if (error) throw error;
  if (!data || data.owner_id !== user.id) return fail(404, 'ASSET_NOT_FOUND', 'Actif introuvable.');
  return json(200, { ok: true, asset: { assetId: data.id, storagePath, mimeType: data.mime_type, url: await signStoragePath(client, storagePath) } });
};

export default async (request: Request, _context: Context): Promise<Response> => {
  if (request.method !== 'POST') return fail(405, 'METHOD_NOT_ALLOWED', 'Méthode non autorisée.');
  let body: Record<string, unknown>;
  try { body = await readBody(request); } catch (error) {
    return error instanceof Error && error.message === 'PAYLOAD_TOO_LARGE'
      ? fail(413, 'PAYLOAD_TOO_LARGE', 'La requête dépasse la taille autorisée.') : fail(400, 'INVALID_JSON', 'Corps JSON invalide.');
  }
  const user = await verifyUser(request).catch(() => null);
  if (!user) return fail(401, 'AUTH_INVALID', 'Session Supabase invalide ou expirée.');
  if (!await consumeQuota(user.id)) return fail(429, 'RATE_LIMITED', 'Quota temporaire atteint. Réessayez plus tard.');
  try {
    if (body.task === 'generate') return await generate(body, user);
    if (body.task === 'video.start') return await videoStart(body, user);
    if (body.task === 'video.poll') return await videoPoll(body, user);
    if (body.task === 'asset.sign') return await signAsset(body, user);
    return fail(400, 'INVALID_REQUEST', 'Opération inconnue.');
  } catch (error) {
    if (error instanceof UpstreamTimeoutError || (error instanceof DOMException && error.name === 'TimeoutError')) {
      return fail(504, 'UPSTREAM_TIMEOUT', 'Le fournisseur a dépassé le délai autorisé.');
    }
    console.error('ai-proxy upstream failure', error instanceof Error ? error.message : 'unknown');
    return fail(502, 'UPSTREAM_FAILED', 'Le fournisseur sécurisé n’a pas pu traiter la demande.');
  }
};

export const config: Config = { path: '/api/ai' };
