import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const read = (path) => readFile(`${root}${path}`, 'utf8');

test('les modules Vie enregistrent leurs workflows dans module_records sans localStorage', async () => {
  const files = await Promise.all([
    'components/HealthCenter.tsx',
    'components/HousingCenter.tsx',
    'components/LegalCenter.tsx',
    'components/WorldHub.tsx',
    'hooks/useModuleRecords.ts',
  ].map(read));
  const source = files.join('\n');
  for (const namespace of ["'health'", "'housing'", "'legal'", "'mobility'"]) {
    assert.match(source, new RegExp(namespace));
  }
  assert.match(source, /moduleRepository\.(list|upsert)/);
  assert.doesNotMatch(source, /localStorage/);
  assert.match(source, /ModuleSyncStatus/);
});

test('les écrans ne présentent plus les catalogues logement et procédures fictifs', async () => {
  const housing = await read('components/HousingCenter.tsx');
  const legal = await read('components/LegalCenter.tsx');
  assert.doesNotMatch(housing, /HOUSING_LISTINGS/);
  assert.doesNotMatch(legal, /LEGAL_PROCEDURES|USER_PROFILE/);
  assert.match(housing, /Aucun montant d'aide n'est estimé/);
  assert.match(legal, /Aucune procédure enregistrée/);
});

test('les garde-fous médicaux et juridiques interdisent les affirmations autoritatives', async () => {
  const [health, housing, legal, mobility] = await Promise.all([
    'components/HealthCenter.tsx',
    'components/HousingCenter.tsx',
    'components/LegalCenter.tsx',
    'components/WorldHub.tsx',
  ].map(read));
  assert.match(health, /MEDICAL_DISCLAIMER/);
  assert.match(health, /tel:/);
  assert.match(health, /navigator\.geolocation/);
  assert.match(health, /speechSynthesis/);
  assert.match(housing, /N'invente ni revenu/);
  assert.match(legal, /N'invente aucune adresse/);
  assert.doesNotMatch(legal, /invente des références réalistes/);
  assert.match(mobility, /N'affirme aucun droit au visa/);
  assert.match(mobility, /MOBILITY_DISCLAIMER/);
});

test('les sources officielles sont configurables, HTTPS et présentées avec leur périmètre', async () => {
  const [sources, env] = await Promise.all([read('services/lifeSources.ts'), read('.env.example')]);
  for (const key of ['HEALTH', 'HOUSING', 'LEGAL', 'MOBILITY']) {
    assert.match(sources, new RegExp(`VITE_${key}_OFFICIAL_SOURCE_URL`));
    assert.match(env, new RegExp(`VITE_${key}_OFFICIAL_SOURCE_URL=https://`));
  }
  assert.match(sources, /parsed\.protocol === 'https:'/);
  assert.match(sources, /scope:/);
});

test('la migration existante autorise les quatre namespaces Vie avec RLS propriétaire', async () => {
  const migration = await read('supabase/migrations/20260827216000_module_records.sql');
  assert.match(migration, /'health','housing','legal'/);
  assert.match(migration, /'mobility'/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /owner_id = auth\.uid\(\)/);
});
