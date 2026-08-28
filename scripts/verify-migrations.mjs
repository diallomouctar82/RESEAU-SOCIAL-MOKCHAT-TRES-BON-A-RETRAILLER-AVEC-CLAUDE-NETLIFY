import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDirectory = resolve(root, 'supabase/migrations');
const snapshotName = '20260827130000_live_schema_snapshot.sql';

const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
const unique = (values) => [...new Set(values)];

const tableDefinitions = (sql) => [...sql.matchAll(/create\s+table\s+if\s+not\s+exists\s+public\.([a-z0-9_]+)/gi)]
  .map((match) => match[1]);

export const verifyMigrations = () => {
  const errors = [];
  const configPath = resolve(root, 'supabase/config.toml');
  const manifestPath = resolve(root, 'supabase/schema-manifest.json');

  if (!existsSync(configPath)) errors.push('supabase/config.toml est absent.');
  if (!existsSync(manifestPath)) errors.push('supabase/schema-manifest.json est absent.');
  if (errors.length) return { errors, migrationCount: 0, baselineTableCount: 0, tableCount: 0 };

  const config = readFileSync(configPath, 'utf8');
  const manifest = readJson(manifestPath);
  if (!/^project_id\s*=\s*"mokchat"/m.test(config)) errors.push('Le project_id local Supabase est invalide.');
  if (!new RegExp(`major_version\\s*=\\s*${manifest.postgresMajorVersion}`).test(config)) {
    errors.push('La version PostgreSQL locale ne correspond pas à la production.');
  }

  const files = readdirSync(migrationsDirectory)
    .filter((name) => name.endsWith('.sql'))
    .sort();
  const invalidNames = files.filter((name) => !/^\d{14}_[a-z0-9_]+\.sql$/.test(name));
  if (invalidNames.length) errors.push(`Noms de migration invalides: ${invalidNames.join(', ')}`);

  const versions = files.map((name) => name.slice(0, 14));
  if (unique(versions).length !== versions.length) errors.push('Des versions de migration sont dupliquées.');
  if (!files.includes('20260828034923_finalize_auth_oauth_session_profile.sql')) {
    errors.push('La migration Auth locale n’est pas alignée sur la version appliquée en production.');
  }

  const sqlByFile = new Map(files.map((name) => [name, readFileSync(resolve(migrationsDirectory, name), 'utf8')]));
  for (const [name, sql] of sqlByFile) {
    const begins = (sql.match(/^\s*begin;\s*$/gim) || []).length;
    const commits = (sql.match(/^\s*commit;\s*$/gim) || []).length;
    if (begins !== 1 || commits !== 1) errors.push(`${name} doit contenir une transaction BEGIN/COMMIT unique.`);
  }

  const snapshot = sqlByFile.get(snapshotName) || '';
  const snapshotTables = unique(tableDefinitions(snapshot)).sort();
  const expectedBaseline = [...manifest.baselineTables].sort();
  if (JSON.stringify(snapshotTables) !== JSON.stringify(expectedBaseline)) {
    errors.push('Le snapshot ne correspond pas exactement aux 58 tables observées en production.');
  }

  const fullSql = [...sqlByFile.values()].join('\n');
  const allTables = unique(tableDefinitions(fullSql)).sort();
  for (const legacyName of manifest.forbiddenLegacyNames) {
    if (new RegExp(`\\b${legacyName}\\b`, 'i').test(fullSql)) errors.push(`Nom SQL historique interdit: ${legacyName}.`);
  }
  for (const table of allTables) {
    const rls = new RegExp(`alter\\s+table\\s+(?:if\\s+exists\\s+)?public\\.${table}\\s+enable\\s+row\\s+level\\s+security`, 'i');
    if (!rls.test(fullSql)) errors.push(`RLS absente pour public.${table}.`);
  }

  return {
    errors,
    migrationCount: files.length,
    baselineTableCount: snapshotTables.length,
    tableCount: allTables.length,
  };
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = verifyMigrations();
  if (result.errors.length) {
    for (const error of result.errors) console.error(`- ${error}`);
    process.exitCode = 1;
  } else {
    console.log(`Migrations valides: ${result.migrationCount} fichiers, ${result.baselineTableCount} tables de production, ${result.tableCount} tables après extensions.`);
  }
}
