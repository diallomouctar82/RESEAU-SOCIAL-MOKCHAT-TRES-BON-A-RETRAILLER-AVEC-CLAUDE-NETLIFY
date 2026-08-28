import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

import { isUuid, newUuid } from '../../services/identifiers.ts';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (path) => readFile(resolve(repositoryRoot, path), 'utf8');

test('les identifiants idempotents sont toujours des UUID v4 valides', () => {
  const generated = new Set(Array.from({ length: 100 }, () => newUuid()));
  assert.equal(generated.size, 100);
  for (const value of generated) {
    assert.equal(isUuid(value), true);
    assert.match(value, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  }
  assert.equal(isUuid('u1'), false);
  assert.equal(isUuid('mock-member-1'), false);
});

test('les conversations utilisent la table de membres réelle, jamais les colonnes legacy', async () => {
  const [service, legacyClient] = await Promise.all([
    readSource('services/mokChat.ts'),
    readSource('services/supabaseClient.ts'),
  ]);
  const combined = `${service}\n${legacyClient}`;
  assert.match(service, /from\('conversation_participants'\)/);
  assert.match(service, /select\('conversation_id,last_read_at'\)/);
  assert.doesNotMatch(combined, /participant1_id|participant2_id/);
});

test('l’historique est borné, trié et paginé par curseur serveur', async () => {
  const service = await readSource('services/mokChat.ts');
  assert.match(service, /from\('messages'\)[\s\S]*eq\('conversation_id', conversationId\)/);
  assert.match(service, /order\('created_at', \{ ascending: false \}\)/);
  assert.match(service, /limit\(boundedLimit \+ 1\)/);
  assert.match(service, /if \(cursor\) request = request\.lt\('created_at', cursor\)/);
  assert.match(service, /messages: mapped\.reverse\(\)/);
});

test('les profils tiers passent uniquement par les RPC publiques minimales', async () => {
  const service = await readSource('services/mokChat.ts');
  assert.match(service, /rpc\('search_public_profiles'/);
  assert.match(service, /rpc\('get_public_profiles'/);
  assert.doesNotMatch(service, /from\('profiles'\)/);
  assert.doesNotMatch(service, /\bemail\b|\bcredits\b|privacy_settings/);
});

test('l’envoi texte est idempotent et n’active pas les pièces jointes durables', async () => {
  const [service, component] = await Promise.all([
    readSource('services/mokChat.ts'),
    readSource('components/MoocChatFloating.tsx'),
  ]);
  assert.match(service, /client_message_id: input\.clientId/);
  assert.match(service, /onConflict: 'sender_id,client_message_id'/);
  assert.doesNotMatch(`${service}\n${component}`, /chat-media|mediaStorage\.upload/);
  assert.doesNotMatch(component, /MOCK_MEMBERS|MOCK_CHATS/);
});

test('le chemin conversations/texte ne dépend ni de la présence ni des réactions', async () => {
  const service = await readSource('services/mokChat.ts');
  const listBody = service.slice(service.indexOf('async listConversations'), service.indexOf('async loadMessages'));
  const historyBody = service.slice(service.indexOf('async loadMessages'), service.indexOf('async createConversation'));
  const realtimeBody = service.slice(service.indexOf('subscribeToConversation'), service.indexOf('async setBlocked'));
  assert.doesNotMatch(listBody, /user_presence/);
  assert.doesNotMatch(historyBody, /message_reactions/);
  assert.doesNotMatch(realtimeBody, /message_reactions/);
});

test('la migration texte aligne le schéma, l’idempotence, les RPC et la RLS', async () => {
  const sql = await readSource('supabase/migrations/20260828131000_finalize_mokchat_conversations_text.sql');
  assert.match(sql, /add column if not exists client_message_id uuid/i);
  assert.match(sql, /create unique index if not exists uq_message_client_id/i);
  assert.match(sql, /create or replace function public\.create_conversation/i);
  assert.match(sql, /create or replace function public\.mark_conversation_read/i);
  assert.match(sql, /create policy messages_insert_if_participant/i);
  assert.match(sql, /alter publication supabase_realtime add table public\.messages/i);
});
