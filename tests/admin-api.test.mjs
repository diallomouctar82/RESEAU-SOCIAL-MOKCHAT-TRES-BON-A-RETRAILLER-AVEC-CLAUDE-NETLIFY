import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AdminValidationError,
  canManageTarget,
  normalizePermissions,
  normalizeRole,
  parseBearerToken,
  validateCreatePayload,
  validatePatchPayload
} from '../netlify/functions/_shared/admin-contract.ts';
import { readFile } from 'node:fs/promises';

test('legacy roles are normalized to the production RBAC vocabulary', () => {
  assert.equal(normalizeRole('citizen'), 'user');
  assert.equal(normalizeRole('partner'), 'organization');
  assert.equal(normalizeRole('super_admin'), 'super_admin');
  assert.equal(normalizeRole('unknown'), 'user');
});

test('permissions are allow-listed and deduplicated', () => {
  assert.deepEqual(
    normalizePermissions(['manage_users', 'manage_users', 'not-real'], 'admin'),
    ['manage_users']
  );
  assert.deepEqual(normalizePermissions([], 'user'), ['standard_access']);
  assert.deepEqual(normalizePermissions(['standard_access'], 'super_admin'), ['all']);
});

test('bearer parser rejects malformed authorization values', () => {
  assert.equal(parseBearerToken('Bearer valid-token'), 'valid-token');
  assert.equal(parseBearerToken('Basic abc'), null);
  assert.equal(parseBearerToken('Bearer token with space'), null);
});

test('create validation rejects bad email and unsupported role', () => {
  assert.throws(
    () => validateCreatePayload({ email: 'bad', name: 'Nom Valide', role: 'user' }),
    AdminValidationError
  );
  assert.throws(
    () => validateCreatePayload({ email: 'valid@example.com', name: 'Nom Valide', role: 'owner' }),
    /Rôle non autorisé/
  );
});

test('create validation never accepts a client-supplied identifier', () => {
  const value = validateCreatePayload({
    id: 'usr-local-123',
    redirectTo: 'https://phishing.example/callback',
    email: 'valid@example.com',
    name: 'Compte Réel',
    role: 'mentor',
    permissions: ['standard_access']
  });
  assert.equal('id' in value, false);
  assert.equal('redirectTo' in value, false);
  assert.equal(value.role, 'mentor');
});

test('patch validation strips forbidden fields and requires UUID', () => {
  const value = validatePatchPayload({
    id: 'fdb99e48-31af-4ac4-a630-160d9a8cdd77',
    name: 'Nom Corrigé',
    credits: 999999,
    email: 'attacker@example.com'
  });
  assert.deepEqual(value.updates, { name: 'Nom Corrigé' });
  assert.throws(() => validatePatchPayload({ id: 'usr-123', name: 'Nom' }), /Identifiant/);
});

test('an admin cannot manage another admin or elevate to an admin role', () => {
  const actor = {
    role: 'admin',
    permissions: ['manage_users', 'manage_roles', 'manage_permissions', 'suspend_users', 'delete_users']
  };
  assert.equal(canManageTarget({ actor, targetRole: 'admin', action: 'status' }), false);
  assert.equal(canManageTarget({ actor, targetRole: 'user', requestedRole: 'admin', action: 'role' }), false);
  assert.equal(canManageTarget({ actor, targetRole: 'user', requestedRole: 'mentor', action: 'role' }), true);
});

test('super admin may manage all target roles', () => {
  assert.equal(
    canManageTarget({ actor: { role: 'super_admin', permissions: [] }, targetRole: 'admin', requestedRole: 'super_admin', action: 'role' }),
    true
  );
});

test('la migration Admin fournit audit, permissions et quota serveur', async () => {
  const sql = await readFile(new URL('../supabase/migrations/20260828130000_finalize_admin_users_rbac.sql', import.meta.url), 'utf8');
  assert.match(sql, /create table if not exists public\.audit_logs/i);
  assert.match(sql, /add column if not exists permissions/i);
  assert.match(sql, /create or replace function public\.admin_consume_rate_limit/i);
  assert.match(sql, /grant execute on function public\.admin_consume_rate_limit\(uuid, integer\) to service_role/i);
  assert.doesNotMatch(sql, /grant execute[\s\S]*to authenticated/i);
});
