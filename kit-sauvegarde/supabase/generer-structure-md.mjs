#!/usr/bin/env node
/**
 * Génère STRUCTURE.md (fiche lisible de la structure Supabase) à partir du
 * relevé machine `releve/*.json`. Déterministe : même relevé → même fiche.
 * Aucune donnée applicative, aucun secret : le relevé n'en contient pas.
 *
 * Usage : node kit-sauvegarde/supabase/generer-structure-md.mjs [sortie.md]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const lire = (dir, nom) => JSON.parse(fs.readFileSync(path.join(dir, nom), 'utf8'));
const court = (s, n = 140) => (s ? String(s).replace(/\s+/g, ' ').trim().slice(0, n) + (String(s).length > n ? '…' : '') : '');
const cellule = (s) => String(s ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function genererStructureMd(releveDir) {
    const projet = lire(releveDir, 'projet.json');
    const tables = lire(releveDir, 'tables.json');
    const policies = lire(releveDir, 'policies.json');
    const functions = lire(releveDir, 'functions.json');
    const objets = lire(releveDir, 'objets.json');
    const complement = lire(releveDir, 'complement.json');
    const par = (kind) => complement.filter((r) => r.kind === kind);
    const objetsPar = (kind) => objets.filter((o) => o.kind === kind);
    const L = [];
    const p = (s = '') => L.push(s);

    p('# Structure Supabase de MokNet — fiche générée');
    p();
    p(`> Générée par \`kit-sauvegarde/supabase/generer-structure-md.mjs\` à partir du relevé du **${projet.releve_le}** sur le projet **${projet.projet.nom}** (\`${projet.projet.ref}\`, ${projet.projet.region}, Postgres ${projet.projet.postgres}).`);
    p('> Structure seulement : aucune ligne de données, aucune valeur de secret (seuls les NOMS des entrées du coffre sont relevés).');
    p();
    p('## Vue d\'ensemble');
    p();
    p('| Objet | Nombre |');
    p('| :--- | ---: |');
    p(`| Migrations appliquées (historique complet embarqué dans \`migrations/\`) | ${projet.migrations.nombre} |`);
    p(`| Tables du schéma \`public\` | ${tables.length} |`);
    p(`| Politiques RLS (\`public\` + \`storage\`) | ${policies.length} |`);
    p(`| Fonctions \`public\` | ${functions.length} |`);
    p(`| Fonctions \`private\` | ${par('private_schema_function').length} |`);
    p(`| Contraintes (PK, FK, unique, check) | ${objetsPar('constraint').length} |`);
    p(`| Index | ${objetsPar('index').length} |`);
    p(`| Déclencheurs (\`public\`) | ${objetsPar('trigger').length} |`);
    p(`| Déclencheur sur \`auth.users\` | ${par('auth_trigger').length} |`);
    p(`| Vues | ${objetsPar('view').length} |`);
    p(`| Énumérations | ${objetsPar('enum').length} |`);
    p(`| Tâches pg_cron | ${par('cron_job').length} |`);
    p(`| Buckets de stockage | ${par('bucket').length} |`);
    p(`| Tables publiées en temps réel | ${par('realtime_publication').length} |`);
    p(`| Entrées du coffre (noms seulement) | ${par('vault_secret_name_only').length} |`);
    p(`| Extensions installées | ${par('extension').length} |`);
    p();

    p('## Tables (schéma `public`)');
    p();
    p('| Table | RLS | Colonnes | Lignes (estimation) | Commentaire |');
    p('| :--- | :---: | ---: | ---: | :--- |');
    const lignes = Object.fromEntries(par('table_rows_estimate').map((r) => [r.name, r.info]));
    for (const t of tables) {
        const nom = t.name.replace(/^public\./, '');
        p(`| \`${nom}\` | ${t.rls_enabled ? 'oui' : '**non**'} | ${t.columns.length} | ${lignes[nom] ?? t.rows ?? ''} | ${cellule(court(t.comment, 110))} |`);
    }
    p();

    p('## Détail des tables');
    p();
    const politiquesPar = {};
    for (const pol of policies) (politiquesPar[`${pol.schemaname}.${pol.tablename}`] ||= []).push(pol);
    const triggersPar = {};
    for (const o of objetsPar('trigger')) (triggersPar[o.tbl] ||= []).push(o);
    const contraintesPar = {};
    for (const o of objetsPar('constraint')) (contraintesPar[o.tbl] ||= []).push(o);
    const indexPar = {};
    for (const o of objetsPar('index')) (indexPar[o.tbl] ||= []).push(o);
    for (const t of tables) {
        const nom = t.name.replace(/^public\./, '');
        p(`### \`${nom}\``);
        p();
        if (t.comment) p(`> ${t.comment.replace(/\n/g, ' ')}`), p();
        p('| Colonne | Type | Nul | Défaut | Contrainte |');
        p('| :--- | :--- | :---: | :--- | :--- |');
        for (const c of t.columns) {
            const opts = c.options || [];
            p(`| \`${c.name}\` | ${cellule(c.data_type)} | ${opts.includes('nullable') ? 'oui' : 'non'} | ${cellule(court(c.default_value, 60))} | ${cellule(court(c.check, 80))} |`);
        }
        p();
        if (t.primary_keys?.length) p(`- Clé primaire : ${t.primary_keys.map((k) => `\`${k}\``).join(', ')}`);
        for (const fk of t.foreign_key_constraints || []) {
            p(`- Clé étrangère \`${fk.name}\` : (${fk.source_columns.join(', ')}) → \`${fk.target_table}\` (${fk.target_columns.join(', ')})`);
        }
        const autres = (contraintesPar[nom] || []).filter((c) => !/^(PRIMARY KEY|FOREIGN KEY)/.test(c.def));
        for (const c of autres) p(`- Contrainte \`${c.name}\` : \`${court(c.def, 160)}\``);
        const pols = politiquesPar[`public.${nom}`] || [];
        if (pols.length) {
            p();
            p('| Politique RLS | Commande | Rôles | Type |');
            p('| :--- | :--- | :--- | :--- |');
            for (const pol of pols) p(`| \`${pol.policyname}\` | ${pol.cmd} | ${cellule(pol.roles)} | ${pol.permissive} |`);
        }
        const trg = triggersPar[nom] || [];
        if (trg.length) { p(); for (const o of trg) p(`- Déclencheur \`${o.name}\` : \`${court(o.def, 160)}\``); }
        const idx = indexPar[nom] || [];
        if (idx.length) p(`- Index (${idx.length}) : ${idx.map((i) => `\`${i.name}\``).join(', ')}`);
        p();
    }

    p('## Politiques RLS du stockage (`storage.objects`)');
    p();
    const storagePols = policies.filter((pol) => pol.schemaname === 'storage');
    if (storagePols.length) {
        p('| Politique | Table | Commande | Rôles |');
        p('| :--- | :--- | :--- | :--- |');
        for (const pol of storagePols) p(`| \`${pol.policyname}\` | ${pol.tablename} | ${pol.cmd} | ${cellule(pol.roles)} |`);
    } else p('_Aucune politique relevée sur le schéma `storage`._');
    p();

    p('## Fonctions (`public`)');
    p();
    const acl = Object.fromEntries(par('func_acl').map((r) => [r.name, r.info]));
    const secu = Object.fromEntries(par('func_security').map((r) => [r.name, r.info]));
    p('| Fonction | Genre | Sécurité | Droits d\'exécution |');
    p('| :--- | :--- | :--- | :--- |');
    for (const f of functions) {
        const sig = `${f.name}(${f.args})`;
        const s = secu[sig] || '';
        const droits = (acl[sig] || '(défaut)').replace(/\/postgres/g, '');
        p(`| \`${cellule(court(sig, 90))}\` | ${f.prokind === 'p' ? 'procédure' : 'fonction'} | ${cellule(s.split(' | ')[0])} | ${cellule(court(droits, 90))} |`);
    }
    p();
    p('Définitions complètes : `releve/functions.json` (champ `def`, `pg_get_functiondef`).');
    p();
    p('## Fonctions (`private`)');
    p();
    for (const r of par('private_schema_function')) p(`- \`private.${r.name}\` — ${cellule(court(r.info.split('\n').slice(0, 2).join(' '), 140))}`);
    p();

    p('## Vues et énumérations');
    p();
    for (const o of objetsPar('view')) p(`- Vue \`${o.name}\` : \`${court(o.def, 200)}\``);
    for (const o of objetsPar('enum')) p(`- Énumération \`${o.name}\` : ${o.def}`);
    if (!objetsPar('view').length && !objetsPar('enum').length) p('_Aucune._');
    p();

    p('## Déclencheur sur `auth.users`');
    p();
    for (const r of par('auth_trigger')) p(`- \`${r.name}\` : \`${r.info}\``);
    p();

    p('## Tâches planifiées (pg_cron)');
    p();
    p('| Tâche | Planification | Commande | Active |');
    p('| :--- | :--- | :--- | :---: |');
    for (const r of par('cron_job')) {
        const j = JSON.parse(r.info);
        p(`| \`${r.name}\` | \`${j.schedule}\` | \`${cellule(j.command)}\` | ${j.active ? 'oui' : 'non'} |`);
    }
    p();

    p('## Buckets de stockage');
    p();
    p('| Bucket | Public | Créé par migration |');
    p('| :--- | :---: | :---: |');
    for (const r of par('bucket')) {
        const j = JSON.parse(r.info);
        p(`| \`${r.name}\` | ${j.public ? 'oui' : 'non'} | ${projet.hors_migrations.buckets.includes(r.name) ? '**non** (complément)' : 'oui'} |`);
    }
    p();

    p('## Temps réel (publication `supabase_realtime`)');
    p();
    p(par('realtime_publication').map((r) => `\`${r.name}\``).join(', '));
    p();

    p('## Extensions installées');
    p();
    p('| Extension | Version / schéma | Créée par une migration |');
    p('| :--- | :--- | :---: |');
    for (const r of par('extension')) {
        const e = projet.extensions_installees.find((x) => x.nom === r.name);
        p(`| \`${r.name}\` | ${r.info} | ${e?.creee_par_migration ? 'oui' : '**non** (prerequis.sql)'} |`);
    }
    p();

    p('## Coffre (`vault.secrets`) — noms seulement');
    p();
    p('| Nom | Description | Recréé par |');
    p('| :--- | :--- | :--- |');
    for (const r of par('vault_secret_name_only')) {
        const par_ = r.name.startsWith('ai_provider:') ? 'Super Admin → Connecteurs & Modèles IA'
            : r.name.startsWith('push_vapid') ? 'automatique (fonction Edge push-notify)'
                : 'étape LiveKit de l\'assistant';
        p(`| \`${r.name}\` | ${cellule(r.info)} | ${par_} |`);
    }
    p();

    p('## Schémas et privilèges par défaut');
    p();
    p(`Schémas présents : ${par('schema').map((r) => `\`${r.name}\``).join(', ')}.`);
    p();
    for (const r of par('default_privileges')) p(`- ${r.name} : \`${r.info}\``);
    p();
    p('## Commentaires de colonnes');
    p();
    for (const r of par('column_comment')) p(`- \`${r.name}\` : ${cellule(court(r.info, 200))}`);
    p();
    return L.join('\n') + '\n';
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
    const sortie = process.argv[2] ? path.resolve(process.argv[2]) : path.join(ICI, 'STRUCTURE.md');
    const texte = genererStructureMd(path.join(ICI, 'releve'));
    fs.writeFileSync(sortie, texte);
    process.stdout.write(`STRUCTURE.md écrit : ${sortie} (${texte.length} caractères)\n`);
}
