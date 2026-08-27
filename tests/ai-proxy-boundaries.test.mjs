import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const walk = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(path));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
  return files;
};

test('le bundle frontend ne contient aucun client ou secret Gemini direct', async () => {
  const files = [...await walk(join(root, 'components')), ...await walk(join(root, 'services')), join(root, 'vite.config.ts')];
  const forbidden = /@google\/genai|new\s+GoogleGenAI|GEMINI_API_KEY|process\.env\.API_KEY/;
  const violations = [];
  for (const file of files) {
    if (forbidden.test(await readFile(file, 'utf8'))) violations.push(file.replace(root, ''));
  }
  assert.deepEqual(violations, []);
});

test('la fonction IA est fail-closed, bornée et lie les opérations à leur propriétaire', async () => {
  const source = await readFile(join(root, 'netlify/functions/ai-proxy.ts'), 'utf8');
  assert.match(source, /Netlify\.env\.get/);
  assert.doesNotMatch(source, /process\.env/);
  assert.match(source, /MODEL_ALLOWLIST/);
  assert.match(source, /sanitizeGenerateConfig/);
  assert.match(source, /withTimeout\(ai\.models\.generateContent/);
  assert.match(source, /const owned = await ownedOperation\(user\.id, operationName\)/);
  assert.match(source, /body\.task === 'asset\.sign'/);
  assert.doesNotMatch(source, /parts\.push\(\{\s*inlineData/);
});

test('les actifs Studio sont privés, persistés et re-signables', async () => {
  const migration = await readFile(join(root, 'supabase/migrations/20260827214000_ai_proxy_assets.sql'), 'utf8');
  assert.match(migration, /create table if not exists public\.ai_generated_assets/);
  assert.match(migration, /create table if not exists public\.ai_operations/);
  assert.match(migration, /using\(owner_id=auth\.uid\(\)\)/);
  assert.match(migration, /values\('studio-generated','studio-generated',false/);
  assert.match(migration, /audio\/wav/);
  assert.match(migration, /revoke all on function public\.consume_api_quota/);
});
