import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const readSource = (path) => readFile(resolve(repositoryRoot, path), 'utf8');

test('la migration persiste le calcul, active RLS et réserve les décisions aux modérateurs', async () => {
  const migration = await readSource('supabase/migrations/20260827217000_mok_trust_server_score.sql');

  assert.match(migration, /create table if not exists public\.mok_trust_scores/);
  assert.match(migration, /create table if not exists public\.mok_trust_findings/);
  assert.match(migration, /alter table public\.mok_trust_scores enable row level security/);
  assert.match(migration, /create or replace function public\.refresh_my_mok_trust_score\(\)/);
  assert.match(migration, /security definer\s+set search_path = ''/);
  assert.match(migration, /if auth\.uid\(\) is null or not private\.is_moderator\(\)/);
  assert.match(migration, /where f\.user_id = v_user_id\s+and f\.outcome = 'upheld'/);
  assert.match(migration, /on conflict \(user_id\) do update set/);
  assert.doesNotMatch(migration, /grant (insert|update|delete) on table public\.mok_trust/i);
});

test('les signalements ouverts et les blocages ne deviennent jamais une pénalité automatique', async () => {
  const migration = await readSource('supabase/migrations/20260827217000_mok_trust_server_score.sql');
  const refreshFunction = migration.split('create or replace function public.refresh_my_mok_trust_score()')[1];

  assert.ok(refreshFunction);
  assert.doesNotMatch(refreshFunction, /public\.abuse_reports/);
  assert.doesNotMatch(refreshFunction, /public\.user_blocks/);
  assert.match(refreshFunction, /v_moderation_penalty := least\(60, v_moderation_penalty\)/);
});

test('la console active n’affiche plus de transactions, avis ou scores fictifs', async () => {
  const [hub, shop] = await Promise.all([
    readSource('components/MokTrustReputationHub.tsx'),
    readSource('components/Shop.tsx'),
  ]);

  assert.match(hub, /mokTrustService\.refreshMyScore\(\)/);
  assert.match(hub, /Données insuffisantes/);
  assert.match(hub, /n’est ni une vérification d’identité/);
  assert.match(hub, /Aucun score local ou ancien n’est affiché/);
  assert.doesNotMatch(hub, /MOCK_|Achat Vérifié|commandes réelles certifiées/);
  assert.doesNotMatch(shop, /MokTrustCenter|98\.6%/);
});
