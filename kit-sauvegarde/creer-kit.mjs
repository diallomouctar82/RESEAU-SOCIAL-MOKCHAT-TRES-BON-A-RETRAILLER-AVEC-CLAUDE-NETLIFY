#!/usr/bin/env node
/**
 * Crée le kit global de sauvegarde et de redéploiement de MokNet : un seul
 * fichier zip qui permet de tout reconstruire ailleurs.
 *
 *   node kit-sauvegarde/creer-kit.mjs [--sortie <dossier>] [--sans-fetch] [--nom <base>]
 *
 * Contenu produit (voir lib/documents.mjs → LISEZ-MOI) : bundle git complet,
 * archive du code source sans clés, paramètres de build, schéma des variables
 * sans valeurs, structure Supabase (migrations + relevé + guide), fonctions
 * Edge, assistant guidé, état exact de l'application, sommes de contrôle.
 *
 * Garde-fous : refus si un fichier `.env` (autre que `.env.example`) apparaît
 * dans la mise en scène ; scan anti-secrets bloquant ; `git bundle verify`
 * et `unzip -t` avant de conclure.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    journal, titre, ok, attention, erreur, info, gras, horodatage, sha256Fichier,
    lireJSON, ecrireJSON, listerFichiers, executer, executerOuEchouer, taille,
    scannerSecrets, avertissementConnu,
} from './lib/commun.mjs';
import { genererSchemaEnvMd, genererEtatSauvegardeMd, genererLisezMoi } from './lib/documents.mjs';
import { genererStructureMd } from './supabase/generer-structure-md.mjs';

const KIT_VERSION = '1.0.0';
const ICI = path.dirname(fileURLToPath(import.meta.url));
const RACINE = path.resolve(ICI, '..');

function analyserArguments(argv) {
    const o = { sortie: path.join(RACINE, 'kit-sauvegarde-sorties'), sansFetch: false, nom: 'moknet-kit', garderStaging: false };
    for (let i = 0; i < argv.length; i++) {
        const a = argv[i];
        if (a === '--sortie') o.sortie = path.resolve(argv[++i]);
        else if (a === '--sans-fetch') o.sansFetch = true;
        else if (a === '--nom') o.nom = argv[++i];
        else if (a === '--garder-staging') o.garderStaging = true;
        else if (a === '--aide' || a === '-h') { journal('Usage : node kit-sauvegarde/creer-kit.mjs [--sortie <dossier>] [--sans-fetch] [--nom <base>]'); process.exit(0); }
        else throw new Error(`Argument inconnu : ${a}`);
    }
    return o;
}

const git = (args, capture = true) => executerOuEchouer('git', args, { cwd: RACINE, capture, silencieux: true }).stdout.trim();

function collecterEtat() {
    const head = git(['rev-parse', 'HEAD']);
    const branche = git(['rev-parse', '--abbrev-ref', 'HEAD']);
    const refs = git(['for-each-ref', '--format=%(refname:short)\t%(objectname)', 'refs/heads', 'refs/remotes', 'refs/tags'])
        .split('\n').filter(Boolean).map((l) => { const [nom, sha] = l.split('\t'); return { nom, sha }; })
        .filter((r) => !r.nom.endsWith('/HEAD'));
    const tags = git(['tag', '--list']).split('\n').filter(Boolean);
    const fichiers = git(['ls-files']).split('\n').filter(Boolean);
    const pkg = lireJSON(path.join(RACINE, 'package.json'));
    const etatActuel = fs.existsSync(path.join(RACINE, 'docs/ETAT_ACTUEL.md')) ? fs.readFileSync(path.join(RACINE, 'docs/ETAT_ACTUEL.md'), 'utf8') : '';
    const journalDec = fs.existsSync(path.join(RACINE, 'docs/JOURNAL_DECISIONS.md')) ? fs.readFileSync(path.join(RACINE, 'docs/JOURNAL_DECISIONS.md'), 'utf8') : '';
    const version = (etatActuel.match(/Version Courante\s*:\s*(v[\d.]+)/) || [])[1] || '';
    const dec = (journalDec.match(/^### \[(DEC-\d{4}-\d{3})\]/m) || [])[1] || '';
    const ciYml = fs.existsSync(path.join(RACINE, '.github/workflows/ci.yml')) ? fs.readFileSync(path.join(RACINE, '.github/workflows/ci.yml'), 'utf8') : '';
    const nodeRequis = (ciYml.match(/node-version:\s*(\d+)/) || [])[1] || '22';
    const projet = lireJSON(path.join(ICI, 'supabase/releve/projet.json'));
    const tables = lireJSON(path.join(ICI, 'supabase/releve/tables.json'));
    const policies = lireJSON(path.join(ICI, 'supabase/releve/policies.json'));
    const functions = lireJSON(path.join(ICI, 'supabase/releve/functions.json'));
    const objets = lireJSON(path.join(ICI, 'supabase/releve/objets.json'));
    const complement = lireJSON(path.join(ICI, 'supabase/releve/complement.json'));
    const migrationsKit = fs.readdirSync(path.join(ICI, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();
    const nb = (kind) => complement.filter((r) => r.kind === kind).length;
    const nbObj = (kind) => objets.filter((o) => o.kind === kind).length;
    const schema = lireJSON(path.join(ICI, 'env/schema-env.json'));
    const netlify = lireJSON(path.join(ICI, 'netlify/parametres-build.json'));
    const versionOutil = (cmd, args) => { const r = executer(cmd, args, { capture: true, silencieux: true }); return r.status === 0 ? r.stdout.trim().replace(/^git version /, '') : 'absent'; };
    return {
        kit_version: KIT_VERSION,
        cree_le: horodatage(),
        depot: {
            head, branche,
            date_commit: git(['log', '-1', '--format=%cI']),
            sujet: git(['log', '-1', '--format=%s']),
            nb_commits: Number(git(['rev-list', '--count', 'HEAD'])),
            refs, tags,
            nb_fichiers_suivis: fichiers.length,
            nb_tests: fichiers.filter((f) => f.startsWith('tests/') && /\.test\.[cm]?[jt]sx?$/.test(f)).length,
            nb_composants: fichiers.filter((f) => f.startsWith('components/') && /\.tsx?$/.test(f)).length,
            nb_services: fichiers.filter((f) => f.startsWith('services/') && /\.tsx?$/.test(f)).length,
            fichiers,
        },
        application: {
            version, dec, paquet: pkg.name, node_requis: nodeRequis,
            scripts: pkg.scripts, dependances: pkg.dependencies, dev_dependances: pkg.devDependencies,
            lock_sha256: sha256Fichier(path.join(RACINE, 'package-lock.json')),
        },
        supabase: {
            projet: projet.projet, releve_le: projet.releve_le,
            migrations: { nombre: migrationsKit.length, premiere: migrationsKit[0].replace(/\.sql$/, ''), derniere: migrationsKit[migrationsKit.length - 1].replace(/\.sql$/, '') },
            migrations_depot: fs.existsSync(path.join(RACINE, 'supabase/migrations')) ? fs.readdirSync(path.join(RACINE, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).length : 0,
            comptes: {
                tables_public: tables.length, politiques_rls: policies.length, fonctions_public: functions.length,
                fonctions_private: nb('private_schema_function'), contraintes: nbObj('constraint'), index: nbObj('index'),
                declencheurs_public: nbObj('trigger'), declencheur_auth_users: nb('auth_trigger'), vues: nbObj('view'),
                taches_cron: nb('cron_job'), buckets: nb('bucket'), tables_realtime: nb('realtime_publication'),
                secrets_coffre_noms: nb('vault_secret_name_only'), extensions_installees: nb('extension'),
            },
            fonctions_edge: projet.fonctions_edge, hors_migrations: projet.hors_migrations,
        },
        netlify,
        env: { nb_variables: schema.fournisseurs.reduce((a, f) => a + f.variables.length, 0), nb_fournisseurs: schema.fournisseurs.length },
        outils: { node: process.version, npm: versionOutil('npm', ['--version']), git: versionOutil('git', ['--version']), zip: versionOutil('zip', ['-v']).split('\n')[0], plateforme: `${os.platform()} ${os.arch()}` },
        limites: [
            'Aucune donnée applicative (profils, messages, publications, journaux) : structure seulement. Les données réelles relèvent des sauvegardes Supabase (plan Pro : sauvegardes quotidiennes / PITR) et d\'un export `pg_dump` autorisé par la Direction.',
            'Aucun objet du stockage (fichiers des buckets `public`, `private`, `mok bouker`).',
            'Aucune valeur de secret : ni clés IA du coffre, ni jeton AI Core, ni clés LiveKit, ni clé privée VAPID, ni clés Netlify/Supabase. Elles sont demandées au redéploiement.',
            'Le serveur LiveKit auto-hébergé (VPS `live.moknet.net`) n\'est pas dans le kit : procédure dans `deploy/livekit/README.md` du code source.',
            'La configuration Supabase Auth (fournisseur Google, URL du site, listes de redirection) et les paramètres du tableau de bord non exposés par le catalogue SQL sont décrits dans `supabase/GUIDE_SUPABASE.md` et reposés par l\'assistant, pas relevés.',
            'Le domaine `moknet.net` est écrit en dur dans six fichiers du code (liens de partage, sondes de santé, origines par défaut des fonctions Edge, redirections Netlify) : un redéploiement sous un autre domaine doit les adapter (liste dans `netlify/parametres-build.json`).',
            'L\'historique git n\'est pas re-scanné pour des secrets à chaque création : il est celui du dépôt GitHub public ; seul l\'arbre du commit sauvegardé et les fichiers du kit sont scannés.',
            'Le relevé Supabase date du moment indiqué (`supabase/releve/projet.json`) : à rafraîchir avec `supabase/extraire-structure.sql` avant une nouvelle sauvegarde si la base a évolué.',
        ],
    };
}

function copierDossier(src, dst, { exclure = [] } = {}) {
    for (const rel of listerFichiers(src, { exclure })) {
        const d = path.join(dst, rel);
        fs.mkdirSync(path.dirname(d), { recursive: true });
        fs.copyFileSync(path.join(src, rel), d);
    }
}

async function main() {
    const o = analyserArguments(process.argv.slice(2));
    titre(`Création du kit de sauvegarde MokNet (${KIT_VERSION})`);
    if (executer('git', ['rev-parse', '--is-inside-work-tree'], { cwd: RACINE, capture: true, silencieux: true }).status !== 0) throw new Error(`Pas un dépôt git : ${RACINE}`);
    const sale = git(['status', '--porcelain']);
    if (sale) attention(`Modifications non commises ignorées (le kit sauvegarde le commit HEAD, pas l'arbre de travail) :\n${sale.split('\n').slice(0, 8).map((l) => '      ' + l).join('\n')}`);

    // Un clone superficiel (shallow) produirait un bundle qui référence des parents absents : `git bundle verify`
    // ne le voit pas, seul un vrai clone échoue. On complète l'historique d'abord, ou on refuse.
    const superficiel = git(['rev-parse', '--is-shallow-repository']) === 'true';
    if (superficiel) {
        if (o.sansFetch) throw new Error('Dépôt superficiel (shallow) et --sans-fetch : impossible de garantir un historique complet. Lancer `git fetch --unshallow origin` puis recommencer.');
        info('Dépôt superficiel : récupération de l\'historique complet (git fetch --unshallow)…');
        const r = executer('git', ['fetch', '--unshallow', 'origin', '+refs/heads/*:refs/remotes/origin/*'], { cwd: RACINE, capture: true, silencieux: true });
        if (r.status !== 0 || git(['rev-parse', '--is-shallow-repository']) === 'true') throw new Error(`Historique toujours incomplet après --unshallow (${(r.stderr || '').trim().split('\n').pop()}) : le kit n'est pas créé.`);
        ok('Historique complet récupéré.');
    }
    if (!o.sansFetch) {
        info('Récupération de toutes les branches distantes (git fetch origin --prune)…');
        const r = executer('git', ['fetch', 'origin', '--prune', '+refs/heads/*:refs/remotes/origin/*'], { cwd: RACINE, capture: true, silencieux: true });
        if (r.status === 0) ok('Branches distantes à jour.'); else attention(`fetch impossible (${(r.stderr || '').trim().split('\n').pop()}) : le bundle contiendra les références déjà connues localement.`);
    }

    const e = collecterEtat();
    ok(`Commit ${e.depot.head.slice(0, 12)} (${e.depot.branche}) — version ${e.application.version || '?'} — ${e.depot.refs.length} références — ${e.depot.nb_fichiers_suivis} fichiers suivis.`);

    const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'moknet-kit-'));
    const S = (...p) => path.join(staging, ...p);
    try {
        // 1. Dépôt git complet
        fs.mkdirSync(S('depot'), { recursive: true });
        info('Bundle git complet (toutes les références)…');
        executerOuEchouer('git', ['bundle', 'create', S('depot/moknet.bundle'), '--all'], { cwd: RACINE, capture: true, silencieux: true });
        executerOuEchouer('git', ['bundle', 'verify', S('depot/moknet.bundle')], { cwd: RACINE, capture: true, silencieux: true });
        const tetes = executerOuEchouer('git', ['bundle', 'list-heads', S('depot/moknet.bundle')], { cwd: RACINE, capture: true, silencieux: true }).stdout.trim().split('\n').filter(Boolean);
        fs.writeFileSync(S('depot/REFERENCES.txt'), `# Références contenues dans moknet.bundle (git bundle list-heads), commit sauvegardé ${e.depot.head}\n${tetes.join('\n')}\n`);
        const nbRefsBundle = tetes.filter((l) => !/ HEAD$/.test(l)).length;
        if (nbRefsBundle !== e.depot.refs.length) throw new Error(`Le bundle contient ${nbRefsBundle} références, le dépôt en compte ${e.depot.refs.length}.`);
        ok(`Bundle vérifié : ${nbRefsBundle} références (+ HEAD), ${taille(fs.statSync(S('depot/moknet.bundle')).size)}.`);
        // Épreuve réelle : un clone nu du bundle dans un dossier jetable. C'est le seul contrôle qui prouve
        // que le bundle se suffit à lui-même (prérequis absents, historique tronqué).
        const epreuve = fs.mkdtempSync(path.join(os.tmpdir(), 'moknet-kit-epreuve-'));
        try {
            executerOuEchouer('git', ['clone', '--quiet', '--bare', S('depot/moknet.bundle'), path.join(epreuve, 'clone.git')], { capture: true, silencieux: true });
            const headEpreuve = executerOuEchouer('git', ['rev-parse', '--verify', `${e.depot.head}^{commit}`], { cwd: path.join(epreuve, 'clone.git'), capture: true, silencieux: true }).stdout.trim();
            const nbCommitsEpreuve = Number(executerOuEchouer('git', ['rev-list', '--count', e.depot.head], { cwd: path.join(epreuve, 'clone.git'), capture: true, silencieux: true }).stdout.trim());
            if (headEpreuve !== e.depot.head || nbCommitsEpreuve !== e.depot.nb_commits) throw new Error(`Épreuve de clonage : ${nbCommitsEpreuve} commits accessibles au lieu de ${e.depot.nb_commits}.`);
            executerOuEchouer('git', ['fsck', '--connectivity-only', '--no-dangling'], { cwd: path.join(epreuve, 'clone.git'), capture: true, silencieux: true });
            e.depot.epreuve_clonage = { commits: nbCommitsEpreuve, fsck: 'ok' };
            ok(`Épreuve de clonage du bundle : ${nbCommitsEpreuve} commits accessibles, connectivité fsck ok.`);
        } finally { fs.rmSync(epreuve, { recursive: true, force: true }); }

        // 2. Code source sans clés
        fs.mkdirSync(S('source'), { recursive: true });
        const nomSource = `moknet-source-${e.depot.head.slice(0, 7)}.tar.gz`;
        executerOuEchouer('git', ['archive', '--format=tar.gz', `--prefix=moknet-${e.depot.head.slice(0, 7)}/`, '-o', S('source', nomSource), 'HEAD'], { cwd: RACINE, capture: true, silencieux: true });
        e.source = { nom: nomSource, nb_fichiers: e.depot.fichiers.length };
        ok(`Archive source : ${nomSource} (${taille(fs.statSync(S('source', nomSource)).size)}).`);

        // 3. Supabase : migrations, relevé, guides, fonctions Edge, script de fiche
        copierDossier(path.join(ICI, 'supabase'), S('supabase'), { exclure: ['STRUCTURE.md'] });
        fs.writeFileSync(S('supabase/STRUCTURE.md'), genererStructureMd(path.join(ICI, 'supabase/releve')));
        if (fs.existsSync(path.join(RACINE, 'supabase/functions'))) copierDossier(path.join(RACINE, 'supabase/functions'), S('supabase/fonctions-edge'));
        if (fs.existsSync(path.join(RACINE, 'supabase/rollback'))) copierDossier(path.join(RACINE, 'supabase/rollback'), S('supabase/rollback-depot'));
        ok(`Supabase : ${e.supabase.migrations.nombre} migrations, relevé, guide, ${e.supabase.fonctions_edge.length} fonctions Edge.`);

        // 4. Netlify
        fs.mkdirSync(S('netlify'), { recursive: true });
        fs.copyFileSync(path.join(ICI, 'netlify/parametres-build.json'), S('netlify/parametres-build.json'));
        if (fs.existsSync(path.join(RACINE, 'netlify.toml'))) fs.copyFileSync(path.join(RACINE, 'netlify.toml'), S('netlify/netlify.toml'));

        // 5. Variables (schéma sans valeurs)
        fs.mkdirSync(S('env'), { recursive: true });
        const schema = lireJSON(path.join(ICI, 'env/schema-env.json'));
        fs.copyFileSync(path.join(ICI, 'env/schema-env.json'), S('env/schema-env.json'));
        fs.writeFileSync(S('env/SCHEMA_ENV.md'), genererSchemaEnvMd(schema));
        if (fs.existsSync(path.join(RACINE, '.env.example'))) fs.copyFileSync(path.join(RACINE, '.env.example'), S('env/.env.example'));

        // 6. Assistant
        fs.mkdirSync(S('assistant/lib'), { recursive: true });
        for (const f of ['redeployer.mjs', 'verifier-kit.mjs']) fs.copyFileSync(path.join(ICI, f), S('assistant', f));
        for (const f of fs.readdirSync(path.join(ICI, 'lib'))) fs.copyFileSync(path.join(ICI, 'lib', f), S('assistant/lib', f));

        // 7. Garde-fous : jamais de .env, scan anti-secrets (kit + arbre suivi du dépôt)
        const fichiersKit = listerFichiers(staging);
        const envInterdit = fichiersKit.filter((f) => /(^|\/)\.env(\.[^/]*)?$/.test(f) && !f.endsWith('.env.example'));
        if (envInterdit.length) throw new Error(`Fichier d'environnement interdit dans le kit : ${envInterdit.join(', ')}`);
        info('Scan anti-secrets du kit et de l\'arbre suivi du dépôt…');
        const detKit = scannerSecrets(staging, fichiersKit.filter((f) => !f.startsWith('depot/') && !f.startsWith('source/')), { avertissementSeulement: avertissementConnu });
        const detDepot = scannerSecrets(RACINE, e.depot.fichiers, { avertissementSeulement: avertissementConnu });
        const detections = [...detKit.map((d) => ({ ...d, origine: 'kit' })), ...detDepot.map((d) => ({ ...d, origine: 'dépôt' }))];
        const bloquants = detections.filter((d) => d.bloquant);
        e.scan = { bloquants: bloquants.length, avertissements: detections.length - bloquants.length, detail: detections.map((d) => ({ origine: d.origine, fichier: d.fichier, ligne: d.ligne, motif: d.motif, bloquant: d.bloquant })) };
        for (const d of detections.filter((x) => !x.bloquant).slice(0, 12)) info(`avertissement connu : ${d.origine} ${d.fichier}:${d.ligne} (${d.motif}, ${d.extrait})`);
        if (bloquants.length) {
            for (const d of bloquants) erreur(`SECRET POSSIBLE : ${d.origine} ${d.fichier}:${d.ligne} (${d.motif}, ${d.extrait})`);
            throw new Error(`${bloquants.length} détection(s) bloquante(s) : le kit n'est PAS créé. Retirer le secret du dépôt (et de son historique si nécessaire) avant de recommencer.`);
        }
        ok(`Scan anti-secrets : 0 bloquant, ${e.scan.avertissements} avertissement(s) connu(s).`);

        // 8. Documents d'état, manifeste, sommes de contrôle
        const contenu = () => listerFichiers(staging).filter((f) => f !== 'SOMME_DE_CONTROLE.sha256').map((f) => ({ chemin: f, octets: fs.statSync(S(f)).size, sha256: sha256Fichier(S(f)) }));
        e.contenu = contenu();
        fs.writeFileSync(S('LISEZ-MOI.md'), genererLisezMoi(e));
        fs.writeFileSync(S('ETAT_SAUVEGARDE.md'), genererEtatSauvegardeMd(e));
        e.contenu = contenu();
        const manifeste = { ...e, depot: { ...e.depot, fichiers: undefined } };
        delete manifeste.depot.fichiers;
        ecrireJSON(S('manifeste.json'), manifeste);
        e.contenu = contenu();
        fs.writeFileSync(S('SOMME_DE_CONTROLE.sha256'), e.contenu.map((f) => `${f.sha256}  ${f.chemin}`).join('\n') + '\n');
        ok(`${e.contenu.length} fichiers, ${taille(e.contenu.reduce((a, f) => a + f.octets, 0))} — sommes de contrôle écrites.`);

        // 9. Zip et vérification
        fs.mkdirSync(o.sortie, { recursive: true });
        const horod = e.cree_le.replace(/[-:]/g, '').replace('T', '-').slice(0, 13);
        const zipPath = path.join(o.sortie, `${o.nom}-${horod}-${e.depot.head.slice(0, 7)}.zip`);
        if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
        executerOuEchouer('zip', ['-r', '-X', '-q', zipPath, '.'], { cwd: staging, capture: true, silencieux: true });
        executerOuEchouer('unzip', ['-tq', zipPath], { capture: true, silencieux: true });
        const shaZip = sha256Fichier(zipPath);
        fs.writeFileSync(zipPath + '.sha256', `${shaZip}  ${path.basename(zipPath)}\n`);
        journal('');
        ok(gras(`Kit créé : ${zipPath}`));
        ok(`Taille ${taille(fs.statSync(zipPath).size)} — SHA-256 ${shaZip}`);
        info(`Contrôle : unzip -tq ; ensuite, après extraction : node assistant/verifier-kit.mjs <dossier>`);
        if (o.garderStaging) info(`Mise en scène conservée : ${staging}`);
        return zipPath;
    } finally {
        if (!o.garderStaging) fs.rmSync(staging, { recursive: true, force: true });
    }
}

main().catch((err) => { erreur(err.message); process.exit(1); });
