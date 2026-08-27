import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const read = (path) => readFile(`${root}${path}`, 'utf8');

test('la persistance métier est Supabase-first avec IndexedDB limité à la file offline', async () => {
  const source = await read('services/moduleRepository.ts');
  assert.match(source, /from\('module_records'\)/);
  assert.match(source, /mutation-queue/);
  assert.match(source, /pending-records/);
  assert.doesNotMatch(source, /localStorage/);
  assert.match(source, /window\.addEventListener\('online'/);
});

test('dossiers, carrière, campus, langues et studio utilisent le dépôt partagé', async () => {
  const files = await Promise.all([
    'services/dossierService.ts',
    'services/careerRadarEngine.ts',
    'services/campusRepository.ts',
    'components/CareerCenter.tsx',
    'components/LanguageCenter.tsx',
    'components/StudioCollaboration.tsx',
  ].map(read));
  for (const source of files) assert.match(source, /moduleRepository/);
  assert.doesNotMatch(files.join('\n'), /localStorage/);
});

test('la migration impose RLS, versionnement et ownership', async () => {
  const migration = await read('supabase/migrations/20260827213000_module_records.sql');
  assert.match(migration, /enable row level security/);
  assert.match(migration, /owner_id = auth\.uid\(\)/);
  assert.match(migration, /new\.version = old\.version \+ 1/);
  assert.match(migration, /unique \(owner_id, module, idempotency_key\)/);
});
