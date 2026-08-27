import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const read = (path) => readFile(`${root}${path}`, 'utf8');
const compact = (source) => source.replace(/\s+/g, ' ').trim();

test('le namespace experts est aligné entre migration, dépôt et types Supabase', async () => {
  const [migration, repository, databaseTypes] = await Promise.all([
    read('supabase/migrations/20260827218000_expert_ai_persistence.sql'),
    read('services/moduleRepository.ts'),
    read('services/database.types.ts'),
  ]);

  assert.match(compact(migration), /module_records_module_check check \(module in \([^)]*'experts'/);
  assert.match(repository, /\| 'experts'/);
  assert.match(databaseTypes, /module_records: \{[\s\S]*owner_id: string[\s\S]*payload: Json/);
});

test('les tables de chat refusent anon et limitent authenticated au CRUD', async () => {
  const migration = compact(await read('supabase/migrations/20260827218000_expert_ai_persistence.sql'));

  for (const table of ['agent_chat_sessions', 'agent_chat_messages']) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`revoke all on table public\\.${table} from anon`));
    assert.match(migration, new RegExp(`grant select, insert, update, delete on table public\\.${table} to authenticated`));
    assert.doesNotMatch(migration, new RegExp(`grant[^;]*(truncate|references|trigger)[^;]*public\\.${table}[^;]*authenticated`, 'i'));
  }
});

test('chaque opération RLS reste bornée au propriétaire de la session', async () => {
  const migration = await read('supabase/migrations/20260827218000_expert_ai_persistence.sql');

  for (const operation of ['select', 'insert', 'update', 'delete']) {
    assert.match(migration, new RegExp(`create policy agent_chat_sessions_${operation}_own`));
    assert.match(migration, new RegExp(`create policy agent_chat_messages_${operation}_own`));
  }
  assert.match(migration, /user_id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /from public\.agent_chat_sessions session[\s\S]*session\.id = agent_chat_messages\.session_id[\s\S]*session\.user_id = \(select auth\.uid\(\)\)/);
});

test('les rejeux de message disposent d’une clé idempotente par session', async () => {
  const [migration, databaseTypes] = await Promise.all([
    read('supabase/migrations/20260827218000_expert_ai_persistence.sql'),
    read('services/database.types.ts'),
  ]);

  assert.match(migration, /add column if not exists idempotency_key uuid/);
  assert.match(compact(migration), /unique \(session_id, idempotency_key\)/);
  assert.match(databaseTypes, /agent_chat_messages: \{[\s\S]*idempotency_key: string \| null/);
});

test('un nouveau message actualise l’activité de sa session', async () => {
  const migration = compact(await read('supabase/migrations/20260827218000_expert_ai_persistence.sql'));

  assert.match(migration, /create or replace function public\.touch_agent_chat_session_from_message\(\)/);
  assert.match(migration, /update public\.agent_chat_sessions set updated_at = timezone\('utc', now\(\)\) where id = new\.session_id/);
  assert.match(migration, /create trigger agent_chat_messages_touch_session after insert on public\.agent_chat_messages/);
});

test('le service de persistance cible Supabase et traite les collisions comme des rejeux', async () => {
  const service = await read('services/expertPersistence.ts');

  assert.match(service, /from\('agent_chat_sessions'\)/);
  assert.match(service, /from\('agent_chat_messages'\)/);
  assert.match(service, /error\.code === '23505'/);
  assert.match(service, /moduleRepository\.upsert\('experts'/);
  assert.doesNotMatch(service, /localStorage/);
});

test('le chat Expert hydrate puis persiste les deux côtés de l’échange', async () => {
  const chat = await read('components/ChatInterface.tsx');

  assert.match(chat, /loadExpertMessages\(agent\.id\)/);
  assert.match(chat, /await persistExpertMessage\(agent\.id, newUserMsg\)/);
  assert.match(chat, /await persistExpertMessage\(agent\.id, newAiMsg\)/);
  assert.match(chat, /retryPendingMessage/);
  assert.doesNotMatch(chat, /Désolé, je n'ai pas pu générer de réponse/);
});

test('Conseil, Diallo OS et les résultats Expert empruntent le dépôt durable', async () => {
  const [council, unifiedCouncil, diallo, hub] = await Promise.all([
    read('components/CouncilRoom.tsx'),
    read('components/UnifiedCouncilRoom.tsx'),
    read('components/DialloOS.tsx'),
    read('components/ExpertsHub.tsx'),
  ]);

  assert.match(council, /await saveCouncilResult\(/);
  assert.match(unifiedCouncil, /await saveCouncilResult\(/);
  assert.match(diallo, /await saveOrchestrationResult\(/);
  assert.match(hub, /await saveExpertResult\(/);
  assert.doesNotMatch([council, unifiedCouncil, diallo, hub].join('\n'), /JSON\.parse\(.*(?:response|res)\.text/);
});
