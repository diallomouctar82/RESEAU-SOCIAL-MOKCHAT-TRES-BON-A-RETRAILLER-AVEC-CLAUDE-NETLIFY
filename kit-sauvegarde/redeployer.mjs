#!/usr/bin/env node
/**
 * ASSISTANT GUIDÉ DE REDÉPLOIEMENT MOKNET — un seul parcours, treize étapes.
 *
 *   node assistant/redeployer.mjs --destination <dossier> [--kit <dossier-du-kit>]
 *        [--simulation] [--reponses <fichier.json>] [--reprendre]
 *        [--sans-build] [--sans-tests] [--mode-migrations api|cli] [--autoriser-production]
 *
 * Il affiche l'état de l'application sauvegardée, puis demande chaque clé UNE
 * PAR UNE, au moment où elle sert, et la place lui-même au bon endroit :
 *   .env local · variables Netlify · secrets des fonctions Edge · configuration
 *   d'authentification · coffre Supabase. Il reconstruit Supabase (prérequis,
 *   110 migrations, compléments, fonctions Edge, secrets, authentification,
 *   LiveKit), écrit les variables, construit, teste, déploie sur Netlify,
 *   détecte les fournisseurs non répertoriés, vérifie et rend un rapport.
 *
 * Règles : aucun secret n'est jamais écrit dans un journal, dans l'état de
 * reprise ni dans le rapport ; un secret ne passe jamais en argument de
 * commande ; le projet Supabase de PRODUCTION est refusé comme cible sauf
 * autorisation explicite ; rien n'est publié en production Netlify sans le
 * mot PRODUCTION tapé en toutes lettres ; `--simulation` n'appelle jamais
 * Supabase, Netlify ni GitHub (les commandes locales tournent).
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    journal, titre, etape, ok, attention, erreur, info, gras, gris, horodatage, masquer,
    lireJSON, ecrireJSON, listerFichiers, executer, executerOuEchouer, Questionnaire, taille,
} from './lib/commun.mjs';
import { verifierKit, afficherVerdicts } from './verifier-kit.mjs';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const TOTAL = 13;
const REF_PRODUCTION = 'rqciahtpixdjbyoajomg';
const API_SUPABASE = 'https://api.supabase.com';
const API_NETLIFY = 'https://api.netlify.com/api/v1';
const V = { vert: '🟢', orange: '🟠', jaune: '🟡', rouge: '🔴', blanc: '⬜' };

/* ────────────────────────────── arguments ────────────────────────────── */
function usage() {
    journal(`Usage : node assistant/redeployer.mjs --destination <dossier> [--kit <dossier>] [--simulation]
        [--reponses <fichier.json>] [--reprendre] [--sans-build] [--sans-tests]
        [--mode-migrations api|cli] [--autoriser-production]`);
}
function analyserArguments(argv) {
    const o = { kit: path.resolve(ICI, '..'), destination: '', simulation: false, reponses: {}, reprendre: false, sansBuild: false, sansTests: false, modeMigrations: 'api', autoriserProduction: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--kit') o.kit = path.resolve(argv[++i]);
        else if (a === '--destination') o.destination = path.resolve(argv[++i]);
        else if (a === '--simulation') o.simulation = true;
        else if (a === '--reponses') o.reponses = lireJSON(path.resolve(argv[++i]));
        else if (a === '--reprendre') o.reprendre = true;
        else if (a === '--sans-build') o.sansBuild = true;
        else if (a === '--sans-tests') o.sansTests = true;
        else if (a === '--mode-migrations') { o.modeMigrations = argv[++i]; if (!['api', 'cli'].includes(o.modeMigrations)) throw new Error('--mode-migrations attend api ou cli'); }
        else if (a === '--autoriser-production') o.autoriserProduction = true;
        else if (a === '--aide' || a === '-h') { usage(); process.exit(0); }
        else throw new Error(`Argument inconnu : ${a}`);
    }
    if (!o.destination) { usage(); throw new Error('--destination est obligatoire (dossier où restaurer le dépôt et écrire le rapport).'); }
    return o;
}

/* ─────────────────── état persistant (jamais de secret) et rapport ─────────────────── */
const fichierEtat = (ctx) => path.join(ctx.destination, '.kit-redeploiement-etat.json');
function chargerEtat(ctx) {
    if (ctx.reprendre && fs.existsSync(fichierEtat(ctx))) return lireJSON(fichierEtat(ctx));
    return { commence_le: horodatage(), etapes_faites: [], valeurs: {} };
}
function sauverEtat(ctx) { ecrireJSON(fichierEtat(ctx), ctx.etat); }
const faite = (ctx, n) => ctx.etat.etapes_faites.includes(n);
function marquer(ctx, n, valeurs = {}) {
    if (!faite(ctx, n)) ctx.etat.etapes_faites.push(n);
    Object.assign(ctx.etat.valeurs, valeurs);
    sauverEtat(ctx);
}
function consigner(ctx, etapeNo, controle, attendu, obtenu, verdict, ecart = '') {
    ctx.rapport.push({ etape: etapeNo, controle, attendu, obtenu, ecart, verdict, quand: horodatage() });
    const ligne = `${verdict} ${controle} — attendu : ${attendu} ; obtenu : ${obtenu}${ecart ? ' ; écart : ' + ecart : ''}`;
    if (verdict === V.vert) ok(ligne); else if (verdict === V.rouge) erreur(ligne); else if (verdict === V.blanc) info(ligne); else attention(ligne);
}
const val = (ctx, k) => ctx.etat.valeurs[k];

/* ────────────────────────────── secrets en mémoire ────────────────────────────── */
async function secret(ctx, id, texte, options = {}) {
    if (ctx.secrets[id]) return ctx.secrets[id];
    const v = await ctx.q.demander(id, texte, { ...options, secret: true });
    if (v) ctx.secrets[id] = v;
    return v;
}

/* ────────────────────────────── appels réseau ────────────────────────────── */
function resumer(corps) {
    const masque = (k, v) => (typeof v === 'string' && /secret|token|password|passwd|api_key|apikey|jwk|value/i.test(k) ? masquer(v) : v);
    const parcourir = (x) => Array.isArray(x) ? x.map(parcourir) : (x && typeof x === 'object') ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, typeof v === 'object' ? parcourir(v) : masque(k, v)])) : x;
    const s = JSON.stringify(parcourir(corps));
    return s.length > 300 ? s.slice(0, 300) + '…' : s;
}
function simuler(service, methode, url) {
    const ref = val_ref_global || 'ref';
    if (service === 'supabase' && methode === 'GET' && /\/v1\/projects\/[a-z]{20}$/.test(url)) return { ref, name: '(simulation)', status: 'ACTIVE_HEALTHY', region: 'eu-west-1' };
    if (service === 'supabase' && /api-keys/.test(url)) return [{ name: 'anon', api_key: `SIMULATION-ANON-KEY-${ref}` }, { name: 'service_role', api_key: `SIMULATION-SERVICE-ROLE-KEY-${ref}` }];
    if (service === 'supabase' && /database\/query/.test(url)) return [];
    if (service === 'supabase' && /\/functions$/.test(url)) return [];
    if (service === 'netlify' && /\/sites(\/|$)/.test(url)) return { id: 'simulation-site-id', name: 'simulation', ssl_url: 'https://simulation.netlify.app', url: 'https://simulation.netlify.app', account_id: 'simulation-account', account_slug: 'simulation' };
    return {};
}
let val_ref_global = '';
async function requete(ctx, service, methode, url, { corps, formData, jeton } = {}) {
    if (ctx.simulation) {
        info(gris(`[SIMULATION] ${methode} ${url}${corps ? ' corps=' + resumer(corps) : formData ? ' (multipart)' : ''}`));
        return simuler(service, methode, url);
    }
    const entetes = { Authorization: `Bearer ${jeton}` };
    let body;
    if (formData) body = formData;
    else if (corps !== undefined) { entetes['Content-Type'] = 'application/json'; body = JSON.stringify(corps); }
    const ctl = new AbortController();
    const minuterie = setTimeout(() => ctl.abort(), 180000);
    let r;
    try { r = await fetch(url, { method: methode, headers: entetes, body, signal: ctl.signal }); }
    catch (e) { throw new Error(`${service} ${methode} ${url} : ${e.message}`); }
    finally { clearTimeout(minuterie); }
    const texte = await r.text();
    let data; try { data = texte ? JSON.parse(texte) : null; } catch { data = texte; }
    if (!r.ok) throw new Error(`${service} ${methode} ${url} → HTTP ${r.status} : ${(typeof data === 'string' ? data : JSON.stringify(data)).slice(0, 400)}`);
    return data;
}
const sql = (ctx, requeteSql) => requete(ctx, 'supabase', 'POST', `${API_SUPABASE}/v1/projects/${val(ctx, 'supabase_ref')}/database/query`, { corps: { query: requeteSql }, jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
const sqlLitteral = (s) => `'${String(s).replace(/'/g, "''")}'`;
function dollar(texte) {
    let tag = '$kit_migration$';
    while (texte.includes(tag)) tag = `$kit_${Math.random().toString(36).slice(2, 8)}$`;
    return `${tag}${texte}${tag}`;
}

/* ────────────────────────────── étapes ────────────────────────────── */
async function etape0_kitEtEtat(ctx) {
    etape(0, TOTAL, 'Vérification du kit et état de l\'application sauvegardée');
    const r = verifierKit(ctx.kit);
    afficherVerdicts(r.lignes);
    if (!r.ok) throw new Error('Kit non conforme : arrêt avant toute action.');
    const m = r.manifeste;
    ctx.manifeste = m;
    journal('');
    journal(gras('  État de l\'application au moment de la sauvegarde'));
    journal(`  · Version applicative : ${gras(m.application.version || 'non lue')}   Dernière décision : ${m.application.dec || '?'}`);
    journal(`  · Commit : ${m.depot.head}   Branche : ${m.depot.branche}   Daté du ${m.depot.date_commit}`);
    journal(`  · Sujet : ${m.depot.sujet}`);
    journal(`  · Dépôt : ${m.depot.nb_commits} commits, ${m.depot.refs.length} références, ${m.depot.nb_fichiers_suivis} fichiers suivis (${m.depot.nb_tests} tests, ${m.depot.nb_composants} composants, ${m.depot.nb_services} services)`);
    journal(`  · Supabase relevé le ${m.supabase.releve_le} : ${m.supabase.migrations.nombre} migrations, ${m.supabase.comptes.tables_public} tables, ${m.supabase.comptes.politiques_rls} politiques RLS, ${m.supabase.comptes.fonctions_public} fonctions, ${m.supabase.fonctions_edge.length} fonctions Edge, ${m.supabase.comptes.taches_cron} tâches cron, ${m.supabase.comptes.buckets} buckets`);
    journal(`  · Netlify : site ${m.netlify.site_production.nom} (${m.netlify.site_production.url}), build « ${m.netlify.build.commande} » → ${m.netlify.build.repertoire_publie}, Node ${m.netlify.build.node}`);
    journal(`  · Variables : ${m.env.nb_variables} variables, ${m.env.nb_fournisseurs} fournisseurs (schéma sans valeurs : env/SCHEMA_ENV.md)`);
    journal(`  · Limites dites : ${m.limites.length} (ETAT_SAUVEGARDE.md § 8)`);
    journal(`  · Mode : ${ctx.simulation ? gras('SIMULATION (aucun appel Supabase / Netlify / GitHub)') : 'RÉEL'} ; migrations par ${ctx.modeMigrations.toUpperCase()}`);
    journal('');
    if (!(await ctx.q.confirmer('kit.continuer', 'Continuer le redéploiement avec ce kit ?', { defaut: 'oui' }))) throw new Error('Arrêt demandé.');
    consigner(ctx, 0, 'Kit intègre et état affiché', 'vérifié', 'vérifié', V.vert);
    marquer(ctx, 0, { kit_commit: m.depot.head, kit_version: m.application.version, kit_cree_le: m.cree_le });
}

function versionOutil(cmd, args) { const r = executer(cmd, args, { capture: true, silencieux: true }); return r.status === 0 ? r.stdout.trim().split('\n')[0] : null; }
async function etape1_prerequis(ctx) {
    etape(1, TOTAL, 'Prérequis du poste');
    const majeure = Number(process.versions.node.split('.')[0]);
    consigner(ctx, 1, 'Node.js', '≥ 22', process.version, majeure >= 22 ? V.vert : V.rouge);
    for (const [nom, cmd, args] of [['git', 'git', ['--version']], ['npm', 'npm', ['--version']], ['npx', 'npx', ['--version']], ['unzip', 'unzip', ['-v']]]) {
        const v = versionOutil(cmd, args);
        consigner(ctx, 1, nom, 'présent', v || 'absent', v ? V.vert : (nom === 'unzip' ? V.orange : V.rouge));
    }
    if (majeure < 22 || !versionOutil('git', ['--version']) || !versionOutil('npm', ['--version'])) throw new Error('Prérequis manquants (Node ≥ 22, git, npm).');
    info('Les CLI Supabase et Netlify ne sont pas requises : l\'assistant passe par leurs API ; `npx` les télécharge seulement pour le déploiement Netlify et le mode migrations « cli ».');
    marquer(ctx, 1);
}

async function etape2_restaurerCode(ctx) {
    etape(2, TOTAL, 'Restauration du dépôt git complet depuis le bundle');
    const m = ctx.manifeste;
    const bundle = path.join(ctx.kit, 'depot/moknet.bundle');
    const dest = path.join(ctx.destination, 'moknet');
    ctx.depot = dest;
    if (fs.existsSync(path.join(dest, '.git'))) {
        const head = executer('git', ['rev-parse', 'HEAD'], { cwd: dest, capture: true, silencieux: true }).stdout.trim();
        if (head === m.depot.head) { ok(`Dépôt déjà restauré au bon commit : ${dest}`); consigner(ctx, 2, 'Commit restauré', m.depot.head.slice(0, 12), head.slice(0, 12), V.vert); marquer(ctx, 2, { depot: dest }); return; }
        throw new Error(`${dest} existe déjà sur un autre commit (${head.slice(0, 12)}). Choisir une destination vide ou relancer avec --reprendre après contrôle.`);
    }
    fs.mkdirSync(ctx.destination, { recursive: true });
    executerOuEchouer('git', ['clone', '--quiet', bundle, dest], { capture: true });
    // Les branches distantes connues à la sauvegarde sont dans le bundle sous refs/remotes/origin/* : importées sous origin-sauvegarde/* (le remote « kit » pointe vers le bundle, « origin » reste libre pour GitHub).
    const f = executer('git', ['fetch', '--quiet', bundle, '+refs/remotes/origin/*:refs/remotes/origin-sauvegarde/*'], { cwd: dest, capture: true, silencieux: true });
    if (f.status !== 0) attention('Branches distantes du bundle non importées (le commit sauvegardé et les branches locales le sont).');
    executer('git', ['remote', 'rename', 'origin', 'kit'], { cwd: dest, capture: true, silencieux: true });
    executerOuEchouer('git', ['checkout', '--quiet', '-B', m.depot.branche, m.depot.head], { cwd: dest, capture: true });
    const head = executerOuEchouer('git', ['rev-parse', 'HEAD'], { cwd: dest, capture: true, silencieux: true }).stdout.trim();
    const nbRefs = executer('git', ['for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes', 'refs/tags'], { cwd: dest, capture: true, silencieux: true }).stdout.trim().split('\n').filter((x) => x && !x.endsWith('/HEAD')).length;
    consigner(ctx, 2, 'Commit restauré', m.depot.head.slice(0, 12), head.slice(0, 12), head === m.depot.head ? V.vert : V.rouge);
    consigner(ctx, 2, 'Références importées', `≥ ${m.depot.refs.length}`, String(nbRefs), nbRefs >= m.depot.refs.length ? V.vert : V.orange, nbRefs >= m.depot.refs.length ? '' : 'certaines branches distantes n\'ont pas été importées');
    const fichiers = executerOuEchouer('git', ['ls-files'], { cwd: dest, capture: true, silencieux: true }).stdout.trim().split('\n').filter(Boolean).length;
    consigner(ctx, 2, 'Fichiers suivis', String(m.depot.nb_fichiers_suivis), String(fichiers), fichiers === m.depot.nb_fichiers_suivis ? V.vert : V.orange);
    if (head !== m.depot.head) throw new Error('Le commit restauré ne correspond pas au manifeste.');
    marquer(ctx, 2, { depot: dest });
}

async function etape3_github(ctx) {
    etape(3, TOTAL, 'Dépôt distant GitHub (facultatif)');
    if (faite(ctx, 3)) { info('Déjà faite.'); return; }
    const pousser = await ctx.q.confirmer('github.pousser', 'Pousser le dépôt restauré vers un dépôt GitHub distant maintenant ?', { defaut: 'non' });
    if (!pousser) { consigner(ctx, 3, 'Dépôt distant', 'facultatif', 'ignoré à la demande', V.jaune); marquer(ctx, 3); return; }
    const url = await ctx.q.demander('github.url', 'URL du dépôt distant (créé vide au préalable)', { valider: (u) => (/^(https:\/\/|git@)/.test(u) ? true : 'URL https:// ou git@ attendue') });
    info('Aucun jeton n\'est écrit : git utilise l\'authentification du poste (gh auth login, SSH ou gestionnaire d\'identifiants).');
    executer('git', ['remote', 'remove', 'origin'], { cwd: ctx.depot, capture: true, silencieux: true, simulation: ctx.simulation });
    executerOuEchouer('git', ['remote', 'add', 'origin', url], { cwd: ctx.depot, capture: true, simulation: ctx.simulation });
    const r1 = executer('git', ['push', '--all', 'origin'], { cwd: ctx.depot, simulation: ctx.simulation });
    const r2 = executer('git', ['push', '--tags', 'origin'], { cwd: ctx.depot, simulation: ctx.simulation });
    const okPush = r1.status === 0 && r2.status === 0;
    consigner(ctx, 3, 'Poussée vers GitHub', 'toutes les branches et étiquettes', ctx.simulation ? 'simulée' : okPush ? 'poussées' : 'échec', ctx.simulation ? V.blanc : okPush ? V.vert : V.rouge);
    if (!okPush && !ctx.simulation) throw new Error('git push en échec : vérifier les droits sur le dépôt distant puis relancer avec --reprendre.');
    marquer(ctx, 3, { github_url: url });
}

async function etape4_supabaseProjet(ctx) {
    etape(4, TOTAL, 'Supabase : projet cible et jeton d\'accès');
    journal('  Il faut un projet Supabase (de préférence VIDE, créé pour ce redéploiement) et un jeton personnel d\'accès.');
    journal('  · Jeton : https://supabase.com/dashboard/account/tokens (préfixe sbp_) — gardé en mémoire seulement.');
    journal('  · Référence du projet : tableau de bord → Settings → General → Reference ID (20 lettres).');
    await secret(ctx, 'SUPABASE_ACCESS_TOKEN', 'Jeton personnel d\'accès Supabase (sbp_…)', { valider: (v) => (v.length >= 20 ? true : 'jeton trop court') });
    const ref = val(ctx, 'supabase_ref') || await ctx.q.demander('supabase.ref', 'Référence du projet Supabase cible', { valider: (v) => (/^[a-z]{20}$/.test(v) ? true : '20 lettres minuscules attendues') });
    if (ref === REF_PRODUCTION) {
        erreur(`« ${ref} » est le projet de PRODUCTION de MokNet (relevé dans le kit).`);
        if (!ctx.autoriserProduction) throw new Error('Refus : l\'assistant ne cible jamais la production sans --autoriser-production ET confirmation écrite.');
        const mot = await ctx.q.demander('supabase.confirmer_production', 'Taper PRODUCTION en toutes lettres pour confirmer que la cible est bien la production', {});
        if (mot !== 'PRODUCTION') throw new Error('Confirmation absente : arrêt.');
    }
    val_ref_global = ref;
    marquer(ctx, -1, { supabase_ref: ref, supabase_url: `https://${ref}.supabase.co` });
    const projet = await requete(ctx, 'supabase', 'GET', `${API_SUPABASE}/v1/projects/${ref}`, { jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
    consigner(ctx, 4, 'Projet Supabase joignable', 'ACTIVE_HEALTHY', `${projet?.name || '?'} — ${projet?.status || '?'}`, ctx.simulation ? V.blanc : projet?.status === 'ACTIVE_HEALTHY' ? V.vert : V.orange);
    const vide = await ctx.q.confirmer('supabase.projet_vide', 'Ce projet est-il vide (aucune table dans public) ?', { defaut: 'oui' });
    if (!vide) attention('Projet non vide : les migrations déjà enregistrées seront sautées, les autres appliquées ; un conflit de nom arrêtera l\'assistant à la migration fautive (rien après elle n\'est appliqué).');
    marquer(ctx, 4, { supabase_projet_vide: vide });
}

function listerMigrations(ctx) {
    const dir = path.join(ctx.kit, 'supabase/migrations');
    return fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => {
        const m = f.match(/^(\d{14})_(.+)\.sql$/);
        return { fichier: f, version: m ? m[1] : f, nom: m ? m[2] : f, sql: fs.readFileSync(path.join(dir, f), 'utf8') };
    });
}
async function etape5_supabaseStructure(ctx) {
    etape(5, TOTAL, 'Supabase : reconstruction de la structure (prérequis → migrations → compléments)');
    if (faite(ctx, 5)) { info('Déjà faite.'); return; }
    const migrations = listerMigrations(ctx);
    const prerequis = fs.readFileSync(path.join(ctx.kit, 'supabase/prerequis.sql'), 'utf8');
    const complements = fs.readFileSync(path.join(ctx.kit, 'supabase/complements-hors-migrations.sql'), 'utf8');
    info(`${migrations.length} migrations dans le kit, de ${migrations[0].version} à ${migrations[migrations.length - 1].version}.`);
    if (ctx.modeMigrations === 'cli') return etape5_modeCli(ctx, migrations, prerequis, complements);
    await sql(ctx, `create schema if not exists supabase_migrations;
create table if not exists supabase_migrations.schema_migrations (version text primary key, statements text[], name text);`);
    const dejaRows = await sql(ctx, 'select version from supabase_migrations.schema_migrations order by version');
    const deja = new Set((Array.isArray(dejaRows) ? dejaRows : []).map((r) => r.version));
    info(`Migrations déjà enregistrées sur la cible : ${deja.size}.`);
    await sql(ctx, prerequis);
    consigner(ctx, 5, 'Prérequis (extensions)', 'appliqués', ctx.simulation ? 'simulés' : 'appliqués', ctx.simulation ? V.blanc : V.vert);
    let appliquees = 0, sautees = 0;
    for (const m of migrations) {
        if (deja.has(m.version)) { sautees++; continue; }
        const corps = `begin;\n${m.sql}\ninsert into supabase_migrations.schema_migrations (version, name, statements) values (${sqlLitteral(m.version)}, ${sqlLitteral(m.nom)}, array[${dollar(m.sql)}]);\ncommit;`;
        try { await sql(ctx, corps); appliquees++; if (!ctx.simulation) info(`migration ${m.version} ${m.nom} ✔`); }
        catch (e) {
            consigner(ctx, 5, `Migration ${m.version}_${m.nom}`, 'appliquée', 'ÉCHEC', V.rouge, e.message.slice(0, 300));
            throw new Error(`Arrêt à la migration ${m.fichier} (${appliquees} appliquée(s) avant elle, transaction de celle-ci annulée). Corriger la cause puis relancer avec --reprendre.`);
        }
    }
    consigner(ctx, 5, 'Migrations', `${migrations.length} (appliquées ou déjà présentes)`, ctx.simulation ? `${appliquees} simulées, ${sautees} déjà présentes` : `${appliquees} appliquées, ${sautees} déjà présentes`, ctx.simulation ? V.blanc : V.vert);
    if (await ctx.q.confirmer('supabase.complements', 'Appliquer les compléments hors migrations (bucket « mok bouker ») ?', { defaut: 'oui' })) {
        await sql(ctx, complements);
        consigner(ctx, 5, 'Compléments hors migrations', 'appliqués', ctx.simulation ? 'simulés' : 'appliqués', ctx.simulation ? V.blanc : V.vert);
    } else consigner(ctx, 5, 'Compléments hors migrations', 'appliqués', 'ignorés à la demande', V.jaune);
    await verifierStructure(ctx);
    marquer(ctx, 5);
}
async function etape5_modeCli(ctx, migrations, prerequis, complements) {
    const w = path.join(ctx.destination, 'supabase-cli-workdir');
    fs.mkdirSync(path.join(w, 'supabase/migrations'), { recursive: true });
    fs.writeFileSync(path.join(w, 'supabase/config.toml'), 'project_id = "moknet-kit"\n');
    fs.writeFileSync(path.join(w, 'supabase/migrations/20260101000000_kit_prerequis.sql'), prerequis);
    for (const m of migrations) fs.writeFileSync(path.join(w, 'supabase/migrations', m.fichier), m.sql);
    fs.writeFileSync(path.join(w, 'supabase/migrations/20991231235959_kit_complements.sql'), complements);
    info(`Espace de travail CLI : ${w} (${migrations.length + 2} fichiers). Les versions kit_prerequis et kit_complements seront enregistrées en plus des 110 versions de production.`);
    const motDePasse = await secret(ctx, 'SUPABASE_DB_PASSWORD', 'Mot de passe de la base du projet (Settings → Database)', {});
    const env = { SUPABASE_ACCESS_TOKEN: ctx.secrets.SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD: motDePasse };
    const r1 = executer('npx', ['--yes', 'supabase@2', 'link', '--project-ref', val(ctx, 'supabase_ref')], { cwd: w, env, simulation: ctx.simulation });
    const r2 = r1.status === 0 ? executer('npx', ['--yes', 'supabase@2', 'db', 'push'], { cwd: w, env, simulation: ctx.simulation }) : r1;
    const okCli = r1.status === 0 && r2.status === 0;
    consigner(ctx, 5, 'Migrations (CLI supabase db push)', 'appliquées', ctx.simulation ? 'simulées' : okCli ? 'appliquées' : 'échec', ctx.simulation ? V.blanc : okCli ? V.vert : V.rouge);
    if (!okCli && !ctx.simulation) throw new Error('supabase db push en échec : lire la sortie ci-dessus, corriger, relancer avec --reprendre.');
    await verifierStructure(ctx);
    marquer(ctx, 5);
}
async function verifierStructure(ctx) {
    const m = ctx.manifeste.supabase.comptes;
    const attendu = { tables: m.tables_public, politiques: m.politiques_rls, fonctions: m.fonctions_public, declencheurs: m.declencheurs_public, cron: m.taches_cron, buckets: m.buckets, realtime: m.tables_realtime, migrations: ctx.manifeste.supabase.migrations.nombre };
    const rows = await sql(ctx, `select
 (select count(*) from pg_class where relnamespace='public'::regnamespace and relkind='r') as tables,
 (select count(*) from pg_policies where schemaname in ('public','storage')) as politiques,
 (select count(*) from pg_proc where pronamespace='public'::regnamespace) as fonctions,
 (select count(*) from pg_trigger t join pg_class c on c.oid=t.tgrelid where not t.tgisinternal and c.relnamespace='public'::regnamespace) as declencheurs,
 (select count(*) from cron.job) as cron,
 (select count(*) from storage.buckets) as buckets,
 (select count(*) from pg_publication_tables where pubname='supabase_realtime') as realtime,
 (select count(*) from supabase_migrations.schema_migrations where version ~ '^2026(08|09)') as migrations`);
    const obtenu = Array.isArray(rows) && rows[0] ? rows[0] : null;
    for (const [k, a] of Object.entries(attendu)) {
        const o = obtenu ? Number(obtenu[k]) : null;
        consigner(ctx, 5, `Structure : ${k}`, String(a), o === null ? (ctx.simulation ? 'non éprouvé (simulation)' : '?') : String(o), o === null ? V.blanc : o === a ? V.vert : V.orange, o !== null && o !== a ? `${o - a > 0 ? '+' : ''}${o - a}` : '');
    }
}

async function etape6_fonctionsEdge(ctx) {
    etape(6, TOTAL, 'Supabase : fonctions Edge et leurs secrets');
    if (faite(ctx, 6)) { info('Déjà faite.'); return; }
    const ref = val(ctx, 'supabase_ref');
    const racine = path.join(ctx.kit, 'supabase/fonctions-edge');
    const slugs = fs.existsSync(racine) ? fs.readdirSync(racine).filter((d) => fs.existsSync(path.join(racine, d, 'index.ts'))).sort() : [];
    for (const slug of slugs) {
        const dir = path.join(racine, slug);
        const form = new FormData();
        form.append('metadata', JSON.stringify({ entrypoint_path: `supabase/functions/${slug}/index.ts`, name: slug, verify_jwt: true }));
        let n = 0;
        for (const rel of listerFichiers(dir)) {
            if (!/\.(ts|js|mjs|json)$/.test(rel)) continue;
            form.append('file', new Blob([fs.readFileSync(path.join(dir, rel))]), `supabase/functions/${slug}/${rel}`);
            n++;
        }
        try {
            await requete(ctx, 'supabase', 'POST', `${API_SUPABASE}/v1/projects/${ref}/functions/deploy?slug=${slug}`, { formData: form, jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
            consigner(ctx, 6, `Fonction Edge ${slug}`, `déployée (${n} fichiers, JWT vérifié)`, ctx.simulation ? 'simulée' : 'déployée', ctx.simulation ? V.blanc : V.vert);
        } catch (e) {
            consigner(ctx, 6, `Fonction Edge ${slug}`, 'déployée', 'ÉCHEC', V.rouge, e.message.slice(0, 200));
            attention(`Repli manuel : dans le dépôt restauré, \`SUPABASE_ACCESS_TOKEN=… npx --yes supabase@2 functions deploy ${slug} --project-ref ${ref}\``);
        }
    }
    if (!ctx.simulation) {
        const liste = await requete(ctx, 'supabase', 'GET', `${API_SUPABASE}/v1/projects/${ref}/functions`, { jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
        const actives = (Array.isArray(liste) ? liste : []).filter((f) => f.status === 'ACTIVE').map((f) => f.slug);
        consigner(ctx, 6, 'Fonctions Edge actives', slugs.join(', '), actives.join(', ') || 'aucune', slugs.every((s) => actives.includes(s)) ? V.vert : V.orange);
    }
    journal('');
    journal('  Secrets des fonctions Edge — demandés un par un (Entrée = passer une valeur facultative) :');
    const schema = lireJSON(path.join(ctx.kit, 'env/schema-env.json'));
    const secrets = [];
    for (const f of schema.fournisseurs) for (const v of f.variables) {
        if (!v.cibles.includes('supabase_secrets_fonctions')) continue;
        const texte = `${v.nom} — ${v.sert_a || f.nom}${v.ou_obtenir ? ' (' + v.ou_obtenir + ')' : ''}`;
        const valeur = v.secret ? await secret(ctx, v.nom, texte, { optionnel: !v.obligatoire }) : await ctx.q.demander(`secret.${v.nom}`, texte, { defaut: v.defaut || '', optionnel: !v.obligatoire, choix: v.choix });
        if (valeur) secrets.push({ name: v.nom, value: valeur });
    }
    if (secrets.length) {
        await requete(ctx, 'supabase', 'POST', `${API_SUPABASE}/v1/projects/${ref}/secrets`, { corps: secrets, jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
        consigner(ctx, 6, 'Secrets des fonctions Edge', secrets.map((s) => s.name).join(', '), ctx.simulation ? 'simulés' : 'posés', ctx.simulation ? V.blanc : V.vert);
    } else consigner(ctx, 6, 'Secrets des fonctions Edge', 'facultatifs', 'aucun fourni', V.jaune);
    marquer(ctx, 6, { secrets_fonctions: secrets.map((s) => s.name) });
}

async function etape7_authentification(ctx) {
    etape(7, TOTAL, 'Supabase : authentification (URL du site, connexion Google)');
    if (faite(ctx, 7)) { info('Déjà faite.'); return; }
    const ref = val(ctx, 'supabase_ref');
    const siteUrl = await ctx.q.demander('auth.site_url', 'URL publique prévue du site (https://…)', { defaut: val(ctx, 'site_url') || 'https://moknet.net', valider: (u) => (/^https:\/\/[^\s/]+/.test(u) ? true : 'URL https:// attendue') });
    const clientId = await ctx.q.demander('auth.google_client_id', 'Identifiant client Google OAuth (vide = connexion Google désactivée)', { optionnel: true });
    let corps = { site_url: siteUrl, uri_allow_list: `${siteUrl},${siteUrl}/*,${siteUrl}/architecte,${siteUrl}/messagerie` };
    if (clientId) {
        const clientSecret = await secret(ctx, 'GOOGLE_OAUTH_CLIENT_SECRET', 'Secret client Google OAuth', {});
        corps = { ...corps, external_google_enabled: true, external_google_client_id: clientId, external_google_secret: clientSecret };
    }
    await requete(ctx, 'supabase', 'PATCH', `${API_SUPABASE}/v1/projects/${ref}/config/auth`, { corps, jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
    consigner(ctx, 7, 'Configuration d\'authentification', `site_url ${siteUrl}${clientId ? ', Google activé' : ''}`, ctx.simulation ? 'simulée' : 'posée', ctx.simulation ? V.blanc : V.vert);
    if (clientId) {
        journal('');
        attention(gras('ACTION HUMAINE') + ` — console Google Cloud → identifiant client OAuth → « Authorized redirect URIs » : ajouter\n      https://${ref}.supabase.co/auth/v1/callback\n      et, dans « Authorized JavaScript origins », ${siteUrl}. Sans cela, la connexion Google échoue.`);
        consigner(ctx, 7, 'URI de redirection Google', `https://${ref}.supabase.co/auth/v1/callback déclarée`, 'à faire par la Direction', V.jaune);
    }
    marquer(ctx, 7, { site_url: siteUrl, google_client_id: clientId || '' });
}

async function etape8_livekit(ctx) {
    etape(8, TOTAL, 'Supabase : coffre LiveKit (direct) — facultatif');
    if (faite(ctx, 8)) { info('Déjà faite.'); return; }
    journal('  Le serveur LiveKit (VPS) n\'est pas dans le kit : voir deploy/livekit/README.md du code source.');
    if (!(await ctx.q.confirmer('livekit.configurer', 'Enregistrer maintenant les identifiants d\'un serveur LiveKit dans le coffre ?', { defaut: 'non' }))) {
        consigner(ctx, 8, 'Transport LiveKit', 'facultatif', 'ignoré : les directs resteront indisponibles jusqu\'à sa configuration', V.jaune); marquer(ctx, 8); return;
    }
    const envir = await ctx.q.demander('livekit.environnement', 'Environnement', { defaut: 'production', choix: ['development', 'production'] });
    const url = await ctx.q.demander('livekit.url', 'URL du serveur LiveKit (wss://…)', { valider: (u) => (/^wss?:\/\//.test(u) ? true : 'URL ws:// ou wss:// attendue') });
    const cle = await ctx.q.demander('livekit.api_key', 'LIVEKIT_API_KEY (identifiant de clé)', {});
    const sec = await secret(ctx, 'LIVEKIT_API_SECRET', 'LIVEKIT_API_SECRET', {});
    const nomSecret = `livekit-${envir}-secret`;
    const requeteSql = `do $$ declare v_id uuid; begin
  select id into v_id from vault.secrets where name = ${sqlLitteral(nomSecret)};
  if v_id is null then v_id := vault.create_secret(${sqlLitteral(sec)}, ${sqlLitteral(nomSecret)}, 'Clé LiveKit posée par le kit de redéploiement');
  else perform vault.update_secret(v_id, ${sqlLitteral(sec)}); end if;
  update public.live_transport_config set is_active = false where environment = ${sqlLitteral(envir)};
  insert into public.live_transport_config (provider, server_url, api_key, vault_secret_id, environment, is_active)
  values ('livekit', ${sqlLitteral(url)}, ${sqlLitteral(cle)}, v_id, ${sqlLitteral(envir)}, true);
end $$;`;
    if (ctx.simulation) info(gris(`[SIMULATION] SQL coffre LiveKit (${nomSecret}, ${url}, clé ${cle}, secret ${masquer(sec)})`));
    else await sql(ctx, requeteSql);
    consigner(ctx, 8, 'Transport LiveKit', `${envir} → ${url}, secret ${nomSecret}`, ctx.simulation ? 'simulé' : 'enregistré', ctx.simulation ? V.blanc : V.vert);
    marquer(ctx, 8, { livekit_environnement: envir, livekit_url: url });
}

async function etape9_variablesLocales(ctx) {
    etape(9, TOTAL, 'Variables d\'environnement locales (.env du dépôt restauré)');
    if (faite(ctx, 9)) { info('Déjà faite.'); return; }
    const ref = val(ctx, 'supabase_ref');
    const cles = await requete(ctx, 'supabase', 'GET', `${API_SUPABASE}/v1/projects/${ref}/api-keys?reveal=true`, { jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
    const anon = (Array.isArray(cles) ? cles : []).find((k) => k.name === 'anon')?.api_key || (Array.isArray(cles) ? cles : []).find((k) => /publishable/.test(k.name || '') || /^sb_publishable_/.test(k.api_key || ''))?.api_key;
    if (!anon) throw new Error('Clé anon introuvable via l\'API : vérifier le jeton et le projet.');
    ctx.secrets.VITE_SUPABASE_ANON_KEY = anon;
    consigner(ctx, 9, 'Clé anon récupérée', 'par l\'API', masquer(anon), V.vert);
    const maps = await ctx.q.demander('env.VITE_GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_MAPS_API_KEY — explorateur cartographique (vide = mode dégradé)', { optionnel: true });
    const oauth = val(ctx, 'google_client_id') || '';
    const lignes = [
        `# Généré par l'assistant de redéploiement MokNet le ${horodatage()} — jamais commis (.gitignore : .env)`,
        `VITE_SUPABASE_URL=https://${ref}.supabase.co`,
        `VITE_SUPABASE_ANON_KEY=${anon}`,
        maps ? `VITE_GOOGLE_MAPS_API_KEY=${maps}` : '# VITE_GOOGLE_MAPS_API_KEY= (non fournie)',
        oauth ? `VITE_GOOGLE_OAUTH_CLIENT_ID=${oauth}` : '# VITE_GOOGLE_OAUTH_CLIENT_ID= (non fournie)',
        '',
    ];
    const cible = path.join(ctx.depot, '.env');
    fs.writeFileSync(cible, lignes.join('\n'), { mode: 0o600 });
    fs.chmodSync(cible, 0o600);
    const ignore = executer('git', ['check-ignore', '-q', '.env'], { cwd: ctx.depot, capture: true, silencieux: true }).status === 0;
    consigner(ctx, 9, 'Fichier .env écrit', `${cible} (0600), ignoré par git`, `${lignes.length - 1} lignes, ${ignore ? 'ignoré par git' : 'NON ignoré par git'}`, ignore ? V.vert : V.rouge);
    if (!ignore) throw new Error('.env n\'est pas ignoré par git : arrêt pour ne jamais risquer de le commettre.');
    marquer(ctx, 9, { maps_fournie: !!maps });
}

async function etape10_buildEtTests(ctx) {
    etape(10, TOTAL, 'Installation, typage, tests et build de production');
    if (faite(ctx, 10)) { info('Déjà faite.'); return; }
    if (ctx.sansBuild) { consigner(ctx, 10, 'Build local', 'exécuté', 'ignoré (--sans-build)', V.jaune); marquer(ctx, 10); return; }
    const etapes = [
        ['npm ci', 'npm', ['ci', '--no-audit', '--no-fund'], true],
        ['typage (tsc --noEmit)', 'npx', ['tsc', '--noEmit'], true],
        ...(ctx.sansTests ? [] : [['tests (npm test)', 'npm', ['test', '--', '--reporter=dot'], false]]),
        ['build (npm run build)', 'npm', ['run', 'build'], true],
    ];
    for (const [nom, cmd, args, bloquant] of etapes) {
        const debut = Date.now();
        const r = executer(cmd, args, { cwd: ctx.depot, capture: true });
        const duree = `${((Date.now() - debut) / 1000).toFixed(0)} s`;
        const dernieres = (r.stdout + r.stderr).trim().split('\n').filter(Boolean).slice(-3).join(' | ');
        consigner(ctx, 10, nom, 'code de sortie 0', `code ${r.status} en ${duree}`, r.status === 0 ? V.vert : V.rouge, r.status === 0 ? '' : dernieres.slice(0, 300));
        if (r.status !== 0 && bloquant) throw new Error(`${nom} en échec : le redéploiement s'arrête avant Netlify (rien n'est publié).`);
    }
    if (ctx.sansTests) consigner(ctx, 10, 'tests (npm test)', 'exécutés', 'ignorés (--sans-tests)', V.jaune);
    const index = path.join(ctx.depot, 'dist/index.html');
    const html = fs.existsSync(index) ? fs.readFileSync(index, 'utf8') : '';
    const bundle = (html.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0] || '';
    consigner(ctx, 10, 'dist/index.html avec bundle', 'présent', bundle || 'absent', bundle ? V.vert : V.rouge);
    if (!bundle) throw new Error('Build sans bundle : arrêt.');
    marquer(ctx, 10, { bundle });
}

async function etape11_netlify(ctx) {
    etape(11, TOTAL, 'Netlify : site, paramètres de build, variables, déploiement');
    if (faite(ctx, 11)) { info('Déjà faite.'); return; }
    if (ctx.sansBuild) { consigner(ctx, 11, 'Déploiement Netlify', 'exécuté', 'ignoré (--sans-build : pas de dist/)', V.jaune); marquer(ctx, 11); return; }
    const jeton = await secret(ctx, 'NETLIFY_AUTH_TOKEN', 'Jeton personnel Netlify (https://app.netlify.com/user/applications#personal-access-tokens)', {});
    let siteId = val(ctx, 'netlify_site_id') || await ctx.q.demander('netlify.site_id', 'Identifiant d\'un site Netlify existant (vide = créer un site)', { optionnel: true });
    let site;
    if (siteId) site = await requete(ctx, 'netlify', 'GET', `${API_NETLIFY}/sites/${siteId}`, { jeton });
    else {
        const nom = await ctx.q.demander('netlify.nom', 'Nom du nouveau site (sous-domaine .netlify.app, lettres/chiffres/tirets)', { valider: (v) => (/^[a-z0-9-]{3,63}$/.test(v) ? true : 'nom invalide') });
        const compte = await ctx.q.demander('netlify.compte', 'Équipe Netlify (slug ; vide = équipe par défaut)', { optionnel: true });
        site = await requete(ctx, 'netlify', 'POST', compte ? `${API_NETLIFY}/${compte}/sites` : `${API_NETLIFY}/sites`, { corps: { name: nom }, jeton });
        siteId = site.id;
    }
    const b = ctx.manifeste.netlify.build;
    await requete(ctx, 'netlify', 'PATCH', `${API_NETLIFY}/sites/${siteId}`, { corps: { build_settings: { cmd: b.commande, dir: b.repertoire_publie } }, jeton });
    consigner(ctx, 11, 'Paramètres de build Netlify', `${b.commande} → ${b.repertoire_publie}`, ctx.simulation ? 'simulés' : 'posés', ctx.simulation ? V.blanc : V.vert);
    const compteId = site?.account_id || site?.account_slug;
    const variables = [
        ['VITE_SUPABASE_URL', val(ctx, 'supabase_url')],
        ['VITE_SUPABASE_ANON_KEY', ctx.secrets.VITE_SUPABASE_ANON_KEY],
        ['NODE_VERSION', b.node],
    ];
    const envLocal = fs.existsSync(path.join(ctx.depot, '.env')) ? fs.readFileSync(path.join(ctx.depot, '.env'), 'utf8') : '';
    for (const nom of ['VITE_GOOGLE_MAPS_API_KEY', 'VITE_GOOGLE_OAUTH_CLIENT_ID']) {
        const m = envLocal.match(new RegExp(`^${nom}=(.+)$`, 'm'));
        if (m) variables.push([nom, m[1].trim()]);
    }
    for (const [key, value] of variables) {
        const corps = { key, scopes: ['builds', 'functions', 'runtime', 'post-processing'], values: [{ value, context: 'all' }] };
        try { await requete(ctx, 'netlify', 'POST', `${API_NETLIFY}/accounts/${compteId}/env?site_id=${siteId}`, { corps: [corps], jeton }); }
        catch { await requete(ctx, 'netlify', 'PUT', `${API_NETLIFY}/accounts/${compteId}/env/${key}?site_id=${siteId}`, { corps, jeton }); }
    }
    consigner(ctx, 11, 'Variables Netlify', variables.map((v) => v[0]).join(', '), ctx.simulation ? 'simulées' : 'posées', ctx.simulation ? V.blanc : V.vert);
    const env = { NETLIFY_AUTH_TOKEN: jeton, NETLIFY_SITE_ID: siteId };
    const brouillon = executer('npx', ['--yes', 'netlify-cli', 'deploy', '--dir', 'dist', '--site', siteId, '--json', '--message', `Kit de redéploiement MokNet — commit ${ctx.manifeste.depot.head.slice(0, 12)}`], { cwd: ctx.depot, env, capture: true, simulation: ctx.simulation });
    let urlBrouillon = '';
    try { urlBrouillon = JSON.parse(brouillon.stdout || '{}').deploy_url || ''; } catch { urlBrouillon = (brouillon.stdout.match(/https:\/\/[a-z0-9-]+--[a-z0-9-]+\.netlify\.app/) || [])[0] || ''; }
    consigner(ctx, 11, 'Déploiement brouillon (aperçu)', 'URL d\'aperçu', ctx.simulation ? 'simulé' : urlBrouillon || `échec (code ${brouillon.status})`, ctx.simulation ? V.blanc : urlBrouillon ? V.vert : V.rouge);
    if (!ctx.simulation && !urlBrouillon) throw new Error('Déploiement brouillon en échec : rien n\'est publié en production.');
    const urlSite = site?.ssl_url || site?.url || '';
    journal('');
    journal(gras('  Publication en production : autorisation explicite requise.') + ` Aperçu : ${urlBrouillon || '(simulation)'}`);
    const mot = await ctx.q.demander('netlify.production', 'Taper PRODUCTION pour publier sur le site (Entrée = rester en aperçu)', { optionnel: true });
    if (mot === 'PRODUCTION') {
        const prod = executer('npx', ['--yes', 'netlify-cli', 'deploy', '--dir', 'dist', '--site', siteId, '--prod', '--json', '--message', `Kit de redéploiement MokNet — production — commit ${ctx.manifeste.depot.head.slice(0, 12)}`], { cwd: ctx.depot, env, capture: true, simulation: ctx.simulation });
        consigner(ctx, 11, 'Publication en production', urlSite || 'site', ctx.simulation ? 'simulée' : prod.status === 0 ? 'publiée' : `échec (code ${prod.status})`, ctx.simulation ? V.blanc : prod.status === 0 ? V.vert : V.rouge);
    } else consigner(ctx, 11, 'Publication en production', 'sur autorisation', 'non demandée (aperçu seulement)', V.jaune);
    if (urlSite && urlSite !== val(ctx, 'site_url')) {
        info(`L'URL réelle du site (${urlSite}) diffère de celle déclarée à l'authentification (${val(ctx, 'site_url')}) : mise à jour de site_url et des redirections autorisées.`);
        await requete(ctx, 'supabase', 'PATCH', `${API_SUPABASE}/v1/projects/${val(ctx, 'supabase_ref')}/config/auth`, { corps: { site_url: urlSite, uri_allow_list: `${urlSite},${urlSite}/*,${val(ctx, 'site_url')},${val(ctx, 'site_url')}/*` }, jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
    }
    info('Pour les déploiements continus depuis GitHub : Netlify → Site configuration → Build & deploy → Link repository (action dans l\'interface, non automatisable sans l\'application GitHub de Netlify).');
    marquer(ctx, 11, { netlify_site_id: siteId, netlify_url: urlSite, apercu_url: urlBrouillon, production_publiee: mot === 'PRODUCTION' });
}

async function etape12_autresFournisseurs(ctx) {
    etape(12, TOTAL, 'Autres fournisseurs : détection dans le code et clés restantes');
    if (faite(ctx, 12)) { info('Déjà faite.'); return; }
    const schema = lireJSON(path.join(ctx.kit, 'env/schema-env.json'));
    const connues = new Set([...schema.injectees_par_supabase, ...schema.heritees_non_lues.variables]);
    for (const f of schema.fournisseurs) for (const v of f.variables) { connues.add(v.nom); if (v.nom_installe) connues.add(v.nom_installe); }
    const fichiers = executerOuEchouer('git', ['ls-files', '--', '*.ts', '*.tsx', '*.js', '*.mjs', '*.cjs'], { cwd: ctx.depot, capture: true, silencieux: true }).stdout.trim().split('\n').filter(Boolean);
    const trouvees = new Map();
    for (const rel of fichiers) {
        const texte = fs.readFileSync(path.join(ctx.depot, rel), 'utf8');
        for (const m of texte.matchAll(/import\.meta\.env\.([A-Z][A-Z0-9_]+)/g)) trouvees.set(m[1], { portee: 'navigateur', fichier: rel });
        for (const m of texte.matchAll(/Deno\.env\.get\(\s*['"]([A-Z][A-Z0-9_]+)['"]\s*\)/g)) trouvees.set(m[1], { portee: 'fonction Edge', fichier: rel });
    }
    const inconnues = [...trouvees].filter(([n]) => !connues.has(n) && !['MODE', 'DEV', 'PROD', 'BASE_URL', 'SSR'].includes(n));
    consigner(ctx, 12, 'Variables lues par le code', `${trouvees.size} détectées, toutes répertoriées`, `${trouvees.size} détectées, ${inconnues.length} non répertoriée(s)`, inconnues.length ? V.orange : V.vert, inconnues.map(([n, i]) => `${n} (${i.portee}, ${i.fichier})`).join(' ; '));
    const posees = [];
    for (const [nom, i] of inconnues) {
        const valeur = await ctx.q.demander(`fournisseur.${nom}`, `${nom} — lue par ${i.fichier} (${i.portee}). Valeur (Entrée = ignorer)`, { optionnel: true, secret: /SECRET|TOKEN|KEY|PASSWORD/.test(nom) });
        if (!valeur) continue;
        if (i.portee === 'navigateur') {
            fs.appendFileSync(path.join(ctx.depot, '.env'), `${nom}=${valeur}\n`);
            posees.push(`${nom} → .env (à reporter dans Netlify : netlify env:set ${nom} …)`);
        } else {
            await requete(ctx, 'supabase', 'POST', `${API_SUPABASE}/v1/projects/${val(ctx, 'supabase_ref')}/secrets`, { corps: [{ name: nom, value: valeur }], jeton: ctx.secrets.SUPABASE_ACCESS_TOKEN });
            posees.push(`${nom} → secrets des fonctions Edge`);
        }
    }
    if (posees.length) consigner(ctx, 12, 'Variables non répertoriées posées', 'selon leur portée', posees.join(' ; '), ctx.simulation ? V.blanc : V.vert);
    const ia = schema.fournisseurs.find((f) => f.id === 'ai_providers');
    journal('');
    journal(gras('  Clés des fournisseurs IA') + ` — ${ia.coffre_noms_releves.length} entrées relevées dans le coffre de production :`);
    journal('  ' + ia.coffre_noms_releves.map((n) => n.replace('ai_provider:', '')).join(', '));
    journal('  Elles se saisissent dans l\'application : Super Admin → Connecteurs & Modèles IA (chaque clé part au coffre par la RPC set_ai_provider_secret). Rien à taper ici.');
    consigner(ctx, 12, 'Clés IA du coffre', `${ia.coffre_noms_releves.length} à saisir dans Super Admin`, 'à faire après la première connexion', V.jaune);
    const email = await ctx.q.demander('admin.email', 'Adresse e-mail du premier Super Admin (compte déjà connecté une fois ; vide = plus tard)', { optionnel: true });
    if (email) {
        const rows = await sql(ctx, `update public.profiles set role = 'super_admin' where lower(email) = lower(${sqlLitteral(email)}) returning id`);
        const n = Array.isArray(rows) ? rows.length : 0;
        consigner(ctx, 12, 'Promotion Super Admin', `1 profil (${email})`, ctx.simulation ? 'simulée' : `${n} profil(s) mis à jour`, ctx.simulation ? V.blanc : n === 1 ? V.vert : V.orange, n === 1 || ctx.simulation ? '' : 'le compte doit s\'être connecté une fois (le profil est créé par handle_new_user)');
    } else consigner(ctx, 12, 'Promotion Super Admin', 'un profil', 'reportée', V.jaune);
    marquer(ctx, 12);
}

async function sonde(url, options = {}) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), 20000);
    try { const r = await fetch(url, { ...options, signal: ctl.signal }); const texte = await r.text(); return { status: r.status, texte }; }
    catch (e) { return { status: 0, texte: e.message }; }
    finally { clearTimeout(t); }
}
async function etape13_verificationEtRapport(ctx) {
    etape(13, TOTAL, 'Vérification finale et rapport');
    const ref = val(ctx, 'supabase_ref');
    const urlSite = val(ctx, 'production_publiee') ? val(ctx, 'netlify_url') : (val(ctx, 'apercu_url') || val(ctx, 'netlify_url'));
    if (ctx.simulation) {
        consigner(ctx, 13, 'Page servie', 'HTML avec bundle', 'non éprouvé (simulation)', V.blanc);
        consigner(ctx, 13, 'API REST Supabase', '200 avec la clé anon', 'non éprouvé (simulation)', V.blanc);
        consigner(ctx, 13, 'Fonction Edge ai-gateway sans jeton', '401 (JWT vérifié)', 'non éprouvé (simulation)', V.blanc);
    } else {
        if (urlSite) { const p = await sonde(urlSite); const bundle = (p.texte.match(/assets\/index-[A-Za-z0-9_-]+\.js/) || [])[0]; consigner(ctx, 13, `Page servie ${urlSite}`, 'HTTP 200 avec bundle', `HTTP ${p.status}${bundle ? ', ' + bundle : ''}`, p.status === 200 && bundle ? V.vert : V.rouge); }
        else consigner(ctx, 13, 'Page servie', 'HTTP 200', 'aucune URL (déploiement ignoré)', V.jaune);
        const rest = await sonde(`https://${ref}.supabase.co/rest/v1/`, { headers: { apikey: ctx.secrets.VITE_SUPABASE_ANON_KEY || '' } });
        consigner(ctx, 13, 'API REST Supabase', 'HTTP 200', `HTTP ${rest.status}`, rest.status === 200 ? V.vert : V.rouge);
        const edge = await sonde(`https://${ref}.supabase.co/functions/v1/ai-gateway`, { method: 'POST', body: '{}' });
        consigner(ctx, 13, 'Fonction Edge ai-gateway sans jeton', 'HTTP 401', `HTTP ${edge.status}`, edge.status === 401 ? V.vert : edge.status === 404 ? V.rouge : V.orange);
    }
    const verts = ctx.rapport.filter((l) => l.verdict === V.vert).length, rouges = ctx.rapport.filter((l) => l.verdict === V.rouge).length, oranges = ctx.rapport.filter((l) => l.verdict === V.orange).length, jaunes = ctx.rapport.filter((l) => l.verdict === V.jaune).length, blancs = ctx.rapport.filter((l) => l.verdict === V.blanc).length;
    const verdict = rouges ? `${V.rouge} NON CONFORME — ${rouges} contrôle(s) rouge(s)` : oranges ? `${V.orange} PARTIEL — ${oranges} écart(s) à examiner` : blancs ? `${V.blanc} NON ÉPROUVÉ EN RÉEL — ${blancs} contrôle(s) simulé(s)` : `${V.vert} CONFORME`;
    const actions = [];
    if (val(ctx, 'google_client_id')) actions.push(`Console Google Cloud : ajouter https://${ref}.supabase.co/auth/v1/callback aux URI de redirection autorisées.`);
    actions.push('Super Admin → Connecteurs & Modèles IA : saisir les clés des fournisseurs IA (13 entrées relevées).');
    if (!ctx.etat.valeurs.livekit_url) actions.push('Configurer un serveur LiveKit (deploy/livekit/README.md) puis relancer l\'étape 8.');
    if (!val(ctx, 'production_publiee')) actions.push('Publier en production quand l\'aperçu est validé (relancer avec --reprendre, taper PRODUCTION).');
    actions.push('Netlify : lier le dépôt GitHub pour les déploiements continus ; configurer le domaine et adapter netlify.toml si le domaine change.');
    actions.push('Vérifier à la main un parcours complet : connexion, Réseau MokNet, messagerie, une fonction Edge (santé), un direct si LiveKit est configuré.');
    const L = [];
    L.push('# Rapport de redéploiement MokNet');
    L.push('');
    L.push(`> Généré le ${horodatage()} par l'assistant guidé (${ctx.simulation ? 'SIMULATION' : 'RÉEL'}, migrations par ${ctx.modeMigrations}). Kit : commit \`${ctx.manifeste.depot.head}\`, version ${ctx.manifeste.application.version || '?'}, créé le ${ctx.manifeste.cree_le}. Destination : \`${ctx.destination}\`. Aucun secret dans ce rapport.`);
    L.push('');
    L.push(`## Verdict : ${verdict}`);
    L.push('');
    L.push(`${verts} 🟢 · ${oranges} 🟠 · ${jaunes} 🟡 · ${rouges} 🔴 · ${blancs} ⬜ (🟢 validé, 🟠 partiel, 🟡 reporté, 🔴 non conforme, ⬜ non éprouvé)`);
    L.push('');
    L.push('## Cibles');
    L.push('');
    L.push(`- Supabase : \`${ref || '?'}\` (${val(ctx, 'supabase_url') || '?'})`);
    L.push(`- Netlify : site \`${val(ctx, 'netlify_site_id') || 'non déployé'}\` — ${val(ctx, 'netlify_url') || ''} ${val(ctx, 'apercu_url') ? '(aperçu : ' + val(ctx, 'apercu_url') + ')' : ''}`);
    L.push(`- Dépôt restauré : \`${ctx.depot}\` sur \`${ctx.manifeste.depot.branche}\` — bundle \`${val(ctx, 'bundle') || 'non construit'}\``);
    if (val(ctx, 'github_url')) L.push(`- GitHub : ${val(ctx, 'github_url')}`);
    L.push('');
    L.push('## Contrôles (ATTENDU → OBTENU → ÉCART → VERDICT)');
    L.push('');
    L.push('| Étape | Contrôle | Attendu | Obtenu | Écart | Verdict |');
    L.push('| :---: | :--- | :--- | :--- | :--- | :---: |');
    for (const l of ctx.rapport) L.push(`| ${l.etape} | ${l.controle.replace(/\|/g, '\\|')} | ${String(l.attendu).replace(/\|/g, '\\|')} | ${String(l.obtenu).replace(/\|/g, '\\|')} | ${String(l.ecart).replace(/\|/g, '\\|')} | ${l.verdict} |`);
    L.push('');
    L.push('## Actions humaines restantes');
    L.push('');
    for (const a of actions) L.push(`- ${a}`);
    L.push('');
    L.push('## Réponses données (secrets masqués)');
    L.push('');
    for (const t of ctx.q.trace) L.push(`- \`${t.id}\` : ${t.valeur === '' ? '(vide)' : t.valeur}`);
    L.push('');
    const rapport = path.join(ctx.destination, 'rapport-redeploiement.md');
    fs.writeFileSync(rapport, L.join('\n') + '\n');
    journal('');
    journal(gras(`  ${verdict}`));
    ok(`Rapport écrit : ${rapport}`);
    journal(gras('  Actions humaines restantes :'));
    for (const a of actions) journal(`   - ${a}`);
    marquer(ctx, 13, { rapport, verdict, termine_le: horodatage() });
}

/* ────────────────────────────── parcours ────────────────────────────── */
async function main() {
    const o = analyserArguments(process.argv.slice(2));
    const ctx = { ...o, q: new Questionnaire({ reponses: o.reponses }), secrets: {}, rapport: [], etat: null, manifeste: null, depot: '' };
    titre('Assistant guidé de redéploiement MokNet — un seul parcours, treize étapes');
    journal(gris(`  Kit : ${ctx.kit}\n  Destination : ${ctx.destination}${ctx.simulation ? '\n  Mode : SIMULATION' : ''}`));
    fs.mkdirSync(ctx.destination, { recursive: true });
    ctx.etat = chargerEtat(ctx);
    if (ctx.reprendre && ctx.etat.etapes_faites.length) info(`Reprise : étapes déjà faites ${ctx.etat.etapes_faites.filter((n) => n >= 0).join(', ')}.`);
    if (ctx.etat.valeurs.supabase_ref) val_ref_global = ctx.etat.valeurs.supabase_ref;
    try {
        await etape0_kitEtEtat(ctx);
        await etape1_prerequis(ctx);
        await etape2_restaurerCode(ctx);
        await etape3_github(ctx);
        await etape4_supabaseProjet(ctx);
        await etape5_supabaseStructure(ctx);
        await etape6_fonctionsEdge(ctx);
        await etape7_authentification(ctx);
        await etape8_livekit(ctx);
        await etape9_variablesLocales(ctx);
        await etape10_buildEtTests(ctx);
        await etape11_netlify(ctx);
        await etape12_autresFournisseurs(ctx);
        await etape13_verificationEtRapport(ctx);
    } catch (e) {
        erreur(e.message);
        sauverEtat(ctx);
        const partiel = path.join(ctx.destination, 'rapport-redeploiement-partiel.md');
        fs.writeFileSync(partiel, `# Rapport partiel — arrêt\n\n> ${horodatage()} — ${e.message.replace(/\n/g, ' ')}\n\n| Étape | Contrôle | Attendu | Obtenu | Écart | Verdict |\n| :---: | :--- | :--- | :--- | :--- | :---: |\n${ctx.rapport.map((l) => `| ${l.etape} | ${l.controle} | ${l.attendu} | ${l.obtenu} | ${l.ecart} | ${l.verdict} |`).join('\n')}\n\nRelancer avec \`--reprendre\` (même destination) après correction.\n`);
        info(`État sauvegardé (sans secret) : ${fichierEtat(ctx)} — rapport partiel : ${partiel}`);
        ctx.q.fermer();
        process.exit(2);
    }
    ctx.q.fermer();
}

main().catch((e) => { erreur(e.message); process.exit(1); });
