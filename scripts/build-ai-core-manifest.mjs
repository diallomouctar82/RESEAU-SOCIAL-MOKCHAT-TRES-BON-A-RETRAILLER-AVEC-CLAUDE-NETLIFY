#!/usr/bin/env node
// Manifeste AI Core — faits du DÉPÔT, mesurés au build.
//
// Pourquoi ce fichier existe : la Tour de contrôle doit dire l'état réel des
// cinq verrous d'AI Core. Trois d'entre eux se lisent en base depuis le
// navigateur (catalogue, droits, journalisation) ; deux ne s'y lisent PAS —
// « l'exécuteur est-il présent dans le code ? » et « combien d'appels IA
// portent une identité d'agent ? » sont des faits du dépôt, pas de la base.
//
// Plutôt que de les coder en dur (ils deviendraient faux au premier commit),
// on les MESURE ici, à chaque build, et on les publie dans un fichier statique
// que la console lit comme n'importe quelle donnée — avec sa date et le commit
// qui l'a produit, pour qu'on sache toujours de quand il parle.
//
// Aucun secret n'entre ici : que des comptages et des booléens.

import { execSync } from 'node:child_process';
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const RACINE = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SORTIE = join(RACINE, 'public', 'ai-core-manifest.json');

/** Exécute une commande git sans jamais faire échouer le build. */
function git(commande) {
    try {
        return execSync(`git ${commande}`, { cwd: RACINE, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    } catch {
        return null;
    }
}

/**
 * Identité du build. Les systèmes de build hébergés (Netlify, entre autres)
 * n'exposent pas toujours un dépôt git utilisable : sans repli, la Tour de
 * contrôle afficherait « commit inconnu » sur une page pourtant construite à
 * partir d'un commit précis. Les variables d'environnement du build font
 * autorité quand git n'a rien à dire.
 */
// L'ORDRE compte, et il a coûté deux déploiements pour le comprendre.
//
// 1. `AI_CORE_BUILD_COMMIT` d'abord, parce qu'il est POSÉ DÉLIBÉRÉMENT pour
//    dire quel commit est déployé. Deux pièges l'ont imposé :
//    — `COMMIT_REF` est un nom RÉSERVÉ par Netlify : une valeur qu'on y définit
//      soi-même est ignorée silencieusement ;
//    — un déploiement par téléversement initialise un dépôt git NEUF côté
//      build. `git rev-parse` réussit donc, mais renvoie un commit synthétique
//      sur une branche « master » qui n'existe nulle part. En laissant git
//      passer devant, la Tour de contrôle affichait une identité de build
//      FABRIQUÉE — plus trompeur qu'une identité absente.
// 2. git ensuite, pour un build local ou un dépôt réellement rattaché.
// 3. `COMMIT_REF` en dernier, quand Netlify le renseigne lui-même (build
//    connecté à GitHub).
const commit = (process.env.AI_CORE_BUILD_COMMIT || '').slice(0, 7)
    || git('rev-parse --short HEAD')
    || (process.env.COMMIT_REF || '').slice(0, 7)
    || null;
const branche = process.env.AI_CORE_BUILD_BRANCH
    || git('rev-parse --abbrev-ref HEAD')
    || process.env.BRANCH
    || null;

/** Liste récursive des fichiers d'un dossier, extensions filtrées. */
function fichiers(dossier, extensions, accumulateur = []) {
    if (!existsSync(dossier)) return accumulateur;
    for (const entree of readdirSync(dossier, { withFileTypes: true })) {
        if (entree.name === 'node_modules' || entree.name.startsWith('.')) continue;
        const chemin = join(dossier, entree.name);
        if (entree.isDirectory()) fichiers(chemin, extensions, accumulateur);
        else if (extensions.some((e) => entree.name.endsWith(e))) accumulateur.push(chemin);
    }
    return accumulateur;
}

function lire(chemin) {
    try {
        return readFileSync(chemin, 'utf8');
    } catch {
        return '';
    }
}

// ── Verrou 1 — l'exécuteur AI Core est-il présent ET enregistré ? ────────────
const cheminExecuteur = join(RACINE, 'supabase/functions/ai-gateway/tools/ai_core_memory.ts');
const cheminRegistre = join(RACINE, 'supabase/functions/ai-gateway/tools/registry.ts');
const sourceExecuteur = lire(cheminExecuteur);
const sourceRegistre = lire(cheminRegistre);

const executeurPresent = sourceExecuteur.includes('executeSearchAiCoreMemory');
const executeurEnregistre = /search_ai_core_memory\s*:/.test(sourceRegistre);

// ── Verrou 5 — combien d'appels IA portent une identité d'agent ? ────────────
// Une fenêtre de N lignes produisait des faux positifs : dans les composants de
// chat, un `agentId:` d'état React (`setChatHistory([{ agentId, text }])`) suit
// souvent un appel au modèle sans avoir le moindre rapport avec lui. On extrait
// donc les ARGUMENTS RÉELS de chaque appel, par équilibrage de parenthèses, et
// on n'y cherche `agentId` que là.
const APPEL_LLM = /generate(?:Text|TextDetailed|JSON|Json)(?:<[^>]*>)?\s*\(/g;

/** Texte des arguments d'un appel, depuis la parenthèse ouvrante. */
function argumentsDeLAppel(source, indexParenthese) {
    let profondeur = 0;
    for (let i = indexParenthese; i < source.length; i++) {
        const c = source[i];
        if (c === '(') profondeur++;
        else if (c === ')') {
            profondeur--;
            if (profondeur === 0) return source.slice(indexParenthese + 1, i);
        }
    }
    return '';
}

const sourcesApp = [
    ...fichiers(join(RACINE, 'components'), ['.ts', '.tsx']),
    ...fichiers(join(RACINE, 'services'), ['.ts', '.tsx']),
].filter((f) => !f.endsWith('services/aiGateway.ts'));

let appelsLlm = 0;
let appelsAvecAgent = 0;
const fichiersAvecAgent = new Set();

for (const fichier of sourcesApp) {
    const source = lire(fichier);
    for (const correspondance of source.matchAll(APPEL_LLM)) {
        const ouvrante = correspondance.index + correspondance[0].length - 1;
        appelsLlm++;
        if (/\bagentId\s*:/.test(argumentsDeLAppel(source, ouvrante))) {
            appelsAvecAgent++;
            fichiersAvecAgent.add(fichier.replace(`${RACINE}/`, ''));
        }
    }
}

// ── Journalisation — le code écrit-il l'agent et les outils ? ────────────────
// Sans la garde en début de motif, `p_agent_id:` — l'argument du RPC
// `get_agent_tools`, présent dans le même fichier — suffisait à faire répondre
// « oui » alors que RIEN n'est journalisé. Le tableau de bord aurait affiché un
// vert imaginaire sur le point que l'inspection a justement trouvé manquant.
const sourcePasserelle = lire(join(RACINE, 'supabase/functions/ai-gateway/index.ts'));
const journaliseAgent = /(?<![A-Za-z_])agent_id\s*:/.test(sourcePasserelle);
const journaliseOutils = /(?<![A-Za-z_])tools_used\s*:/.test(sourcePasserelle);

// ── Migrations versionnées dans le dépôt ────────────────────────────────────
const dossierMigrations = join(RACINE, 'supabase/migrations');
const migrationsDepot = existsSync(dossierMigrations)
    ? readdirSync(dossierMigrations).filter((f) => f.endsWith('.sql')).length
    : 0;

// ── Tests ───────────────────────────────────────────────────────────────────
const fichiersTests = fichiers(join(RACINE, 'tests'), ['.test.ts', '.test.tsx']);
const testsAiCore = fichiersTests.filter((f) => /ai.?core/i.test(lire(f))).length;
const testsDeno = fichiers(join(RACINE, 'supabase/functions'), ['_test.ts']).length;

// ── Mesures hors ligne ──────────────────────────────────────────────────────
// Faits qu'AUCUN navigateur ne peut lire : le schéma `supabase_migrations`
// n'est pas exposé par l'API REST. Relevé à la main, daté, et affiché comme
// tel — jamais présenté comme une lecture en direct.
const mesuresHorsLigne = {
    migrationsEnBase: 103,
    releveLe: '2026-09-04',
    methode: "list_migrations sur le projet rqciahtpixdjbyoajomg (lecture seule)",
};

const manifeste = {
    genereLe: new Date().toISOString(),
    commit,
    branche,
    verrou1_executeur: {
        present: executeurPresent,
        enregistre: executeurEnregistre,
        fichier: 'supabase/functions/ai-gateway/tools/ai_core_memory.ts',
    },
    verrou5_identiteAgent: {
        appelsLlmTotal: appelsLlm,
        appelsAvecAgentId: appelsAvecAgent,
        fichiers: [...fichiersAvecAgent].sort(),
    },
    journalisation: {
        agentIdEcrit: journaliseAgent,
        outilsEcrits: journaliseOutils,
    },
    migrations: {
        dansLeDepot: migrationsDepot,
        ...mesuresHorsLigne,
    },
    tests: {
        fichiersVitest: fichiersTests.length,
        fichiersCouvrantAiCore: testsAiCore,
        fichiersDeno: testsDeno,
    },
};

mkdirSync(dirname(SORTIE), { recursive: true });
writeFileSync(SORTIE, `${JSON.stringify(manifeste, null, 2)}\n`, 'utf8');

console.log(`Manifeste AI Core écrit : ${SORTIE.replace(`${RACINE}/`, '')}`);
console.log(
    `  exécuteur ${executeurPresent && executeurEnregistre ? 'présent et enregistré' : 'ABSENT'}` +
    ` · ${appelsAvecAgent}/${appelsLlm} appels avec agentId` +
    ` · journalisation agent=${journaliseAgent} outils=${journaliseOutils}` +
    ` · ${migrationsDepot} migrations au dépôt` +
    ` · ${testsAiCore} test(s) AI Core`,
);
