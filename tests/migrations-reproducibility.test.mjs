import assert from 'node:assert/strict';
import test from 'node:test';
import { verifyMigrations } from '../scripts/verify-migrations.mjs';

test('la chaîne Supabase est versionnée, canonique et reproductible', () => {
  const result = verifyMigrations();
  assert.deepEqual(result.errors, []);
  assert.equal(result.baselineTableCount, 58);
  assert.ok(result.migrationCount >= 14);
  assert.ok(result.tableCount >= result.baselineTableCount);
});
