import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const migration = await readFile(
  new URL('../supabase/migrations/20260828034514_finalize_auth_oauth_session_profile.sql', import.meta.url),
  'utf8',
);

test('la migration Auth complète le contrat profil sans écraser les comptes existants', () => {
  for (const column of ['status', 'bio', 'country', 'city', 'phone', 'website', 'is_verified', 'followers_count', 'following_count']) {
    assert.match(migration, new RegExp(`add column if not exists ${column}`));
  }
  assert.match(migration, /where not exists \(select 1 from public\.profiles p where p\.id = u\.id\)/);
  assert.doesNotMatch(migration, /visionsmart224|1000000|999999/);
});

test('le profil complet reste privé et les mutations passent par une RPC allow-listée', () => {
  assert.match(migration, /profiles_select_self_or_admin[\s\S]*id = \(select auth\.uid\(\)\)/);
  assert.match(migration, /revoke update on table public\.profiles from authenticated/);
  assert.match(migration, /create or replace function public\.update_my_profile\(p_changes jsonb\)/);
  assert.match(migration, /where p\.id = auth\.uid\(\)/);
  assert.match(migration, /revoke all on function public\.update_my_profile\(jsonb\) from public, anon/);
  assert.match(migration, /grant execute on function public\.update_my_profile\(jsonb\) to authenticated/);
});
