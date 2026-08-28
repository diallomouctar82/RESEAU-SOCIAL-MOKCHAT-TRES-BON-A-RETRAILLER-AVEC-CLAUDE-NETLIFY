import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const read = (path) => readFile(`${root}${path}`, 'utf8');

test('les consentements Google sont incrémentaux, minimaux et gardés en mémoire', async () => {
  const source = await read('services/googleWorkspaceLink.ts');
  assert.match(source, /drive\.file/);
  assert.match(source, /chat\.spaces\.readonly/);
  assert.match(source, /chat\.spaces\.create/);
  assert.match(source, /chat\.messages\.readonly/);
  assert.match(source, /chat\.messages\.create/);
  assert.match(source, /meetings\.space\.created/);
  assert.match(source, /hasWorkspaceCapabilities/);
  assert.match(source, /tokenExpiresAt/);
  assert.doesNotMatch(source, /localStorage|sessionStorage/);
  assert.doesNotMatch(source, /auth\/drive['"]|auth\/drive\.readonly|auth\/chat\.spaces['"]|auth\/chat\.messages['"]/);
});

test('le frontend passe uniquement par le proxy same-origin et Meet ne fabrique aucun lien', async () => {
  const [service, meet] = await Promise.all([
    read('services/googleWorkspace.ts'),
    read('components/GoogleMeetCenter.tsx'),
  ]);
  assert.match(service, /fetch\('\/api\/google-workspace'/);
  assert.doesNotMatch(service, /fetch\(['"`]https:\/\/(?:www\.googleapis|chat\.googleapis|meet\.googleapis)/);
  assert.doesNotMatch(meet, /fallbackCode|meet-demo|meet\.google\.com\/mok-|Math\.random\(\)/);
  assert.match(meet, /aucun lien de réunion valide/);
});

test('la fonction Netlify est fail-closed, authentifiée, bornée et allowlistée', async () => {
  const source = await read('netlify/functions/google-workspace-proxy.ts');
  assert.match(source, /export default async \(request: Request/);
  assert.match(source, /Netlify\.env\.get/);
  assert.doesNotMatch(source, /process\.env|VITE_SUPABASE/);
  assert.match(source, /auth\/v1\/user/);
  assert.match(source, /consume_api_quota/);
  assert.match(source, /ALLOWED_ACTIONS/);
  assert.match(source, /raw\.byteLength > 6_000_000/);
  assert.match(source, /AbortSignal\.timeout\(15_000\)/);
  assert.match(source, /GOOGLE_TIMEOUT/);
  assert.doesNotMatch(source, /Access-Control-Allow-Origin/);
});
