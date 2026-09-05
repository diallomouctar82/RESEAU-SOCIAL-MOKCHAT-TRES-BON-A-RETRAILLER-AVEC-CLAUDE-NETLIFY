/**
 * Garde-fous du kit de sauvegarde et de redéploiement (kit-sauvegarde/).
 *
 * Ces tests ne créent pas de zip et n'appellent aucun service : ils vérifient
 * que le kit reste cohérent avec le code (chaque variable lue par le code est
 * répertoriée dans le schéma), que l'historique des migrations embarqué est
 * complet et ordonné, que les prérequis couvrent pg_cron, et que le scanner
 * anti-secrets sait rougir.
 */
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const RACINE = path.resolve(__dirname, '..');
const KIT = path.join(RACINE, 'kit-sauvegarde');
const lireJSON = (p: string) => JSON.parse(fs.readFileSync(p, 'utf8'));

describe('kit-sauvegarde — schéma des variables', () => {
    const schema = lireJSON(path.join(KIT, 'env/schema-env.json'));
    const connues = new Set<string>([...schema.injectees_par_supabase, ...schema.heritees_non_lues.variables]);
    for (const f of schema.fournisseurs) for (const v of f.variables) { connues.add(v.nom); if (v.nom_installe) connues.add(v.nom_installe); }

    it('ne contient aucune valeur (seulement des noms, des cibles et des sources)', () => {
        const texte = fs.readFileSync(path.join(KIT, 'env/schema-env.json'), 'utf8');
        expect(texte).not.toMatch(/eyJ[A-Za-z0-9_-]{20,}\./);
        expect(texte).not.toMatch(/\bsk-[A-Za-z0-9_-]{20,}/);
        expect(texte).not.toMatch(/\bsbp_[a-f0-9]{30,}/);
        for (const f of schema.fournisseurs) for (const v of f.variables) expect(v).not.toHaveProperty('valeur');
    });

    it('répertorie chaque variable import.meta.env.* lue par le code du navigateur', () => {
        const fichiers = execSync('git ls-files -- "*.ts" "*.tsx"', { cwd: RACINE, encoding: 'utf8' }).trim().split('\n');
        const lues = new Set<string>();
        for (const rel of fichiers) {
            if (rel.startsWith('tests/') || rel.startsWith('supabase/')) continue;
            const texte = fs.readFileSync(path.join(RACINE, rel), 'utf8');
            for (const m of texte.matchAll(/import\.meta\.env\.([A-Z][A-Z0-9_]+)/g)) lues.add(m[1]);
        }
        expect(lues.size).toBeGreaterThan(0);
        for (const nom of lues) expect(connues.has(nom), `variable non répertoriée dans schema-env.json : ${nom}`).toBe(true);
    });

    it('répertorie chaque Deno.env.get(…) lu par les fonctions Edge', () => {
        const fichiers = execSync('git ls-files -- "supabase/functions/*.ts"', { cwd: RACINE, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
        const lues = new Set<string>();
        for (const rel of fichiers) {
            const texte = fs.readFileSync(path.join(RACINE, rel), 'utf8');
            for (const m of texte.matchAll(/Deno\.env\.get\(\s*['"]([A-Z][A-Z0-9_]+)['"]\s*\)/g)) lues.add(m[1]);
        }
        expect(lues.size).toBeGreaterThan(0);
        for (const nom of lues) expect(connues.has(nom), `secret de fonction Edge non répertorié : ${nom}`).toBe(true);
    });

    it('déclare chaque variable héritée comme réellement absente du code exécuté', () => {
        const fichiers = execSync('git ls-files -- "*.ts" "*.tsx" "supabase/functions/*.ts"', { cwd: RACINE, encoding: 'utf8' }).trim().split('\n');
        for (const nom of schema.heritees_non_lues.variables) {
            for (const rel of fichiers) {
                const texte = fs.readFileSync(path.join(RACINE, rel), 'utf8');
                expect(texte.includes(`import.meta.env.${nom}`), `${nom} est lue par ${rel}`).toBe(false);
                expect(texte.includes(`Deno.env.get('${nom}')`), `${nom} est lue par ${rel}`).toBe(false);
            }
        }
    });
});

describe('kit-sauvegarde — historique Supabase embarqué', () => {
    const projet = lireJSON(path.join(KIT, 'supabase/releve/projet.json'));
    const fichiers = fs.readdirSync(path.join(KIT, 'supabase/migrations')).filter((f) => f.endsWith('.sql')).sort();

    it('contient exactement le nombre de migrations relevé, ordonnées et non vides', () => {
        expect(fichiers.length).toBe(projet.migrations.nombre);
        expect(fichiers[0].replace(/\.sql$/, '')).toBe(projet.migrations.premiere);
        expect(fichiers[fichiers.length - 1].replace(/\.sql$/, '')).toBe(projet.migrations.derniere);
        let precedente = '';
        for (const f of fichiers) {
            const version = f.slice(0, 14);
            expect(version).toMatch(/^\d{14}$/);
            expect(version > precedente, `ordre des versions : ${f}`).toBe(true);
            precedente = version;
            expect(fs.statSync(path.join(KIT, 'supabase/migrations', f)).size).toBeGreaterThan(50);
        }
    });

    it('les prérequis créent pg_cron avant les migrations qui planifient des tâches', () => {
        const prerequis = fs.readFileSync(path.join(KIT, 'supabase/prerequis.sql'), 'utf8');
        expect(prerequis).toMatch(/create extension if not exists pg_cron/);
        const planifient = fichiers.filter((f) => /cron\.schedule/.test(fs.readFileSync(path.join(KIT, 'supabase/migrations', f), 'utf8')));
        expect(planifient.length).toBeGreaterThan(0);
        for (const f of planifient) expect(fs.readFileSync(path.join(KIT, 'supabase/migrations', f), 'utf8')).not.toMatch(/create extension[^;]*pg_cron/);
    });

    it('le relevé compte autant de tables, politiques et fonctions que projet.json', () => {
        expect(lireJSON(path.join(KIT, 'supabase/releve/tables.json')).length).toBe(projet.comptes.tables_public);
        expect(lireJSON(path.join(KIT, 'supabase/releve/policies.json')).length).toBe(projet.comptes.politiques_rls);
        expect(lireJSON(path.join(KIT, 'supabase/releve/functions.json')).length).toBe(projet.comptes.fonctions_public);
    });

    it('chaque fonction Edge du dépôt est décrite avec ses secrets réellement lus', () => {
        const slugs = fs.readdirSync(path.join(RACINE, 'supabase/functions')).filter((d) => fs.existsSync(path.join(RACINE, 'supabase/functions', d, 'index.ts'))).sort();
        expect(projet.fonctions_edge.map((f: { slug: string }) => f.slug).sort()).toEqual(slugs);
        for (const f of projet.fonctions_edge) {
            const dir = path.join(RACINE, 'supabase/functions', f.slug);
            const textes = execSync(`git ls-files -- "${path.relative(RACINE, dir)}/*.ts"`, { cwd: RACINE, encoding: 'utf8' }).trim().split('\n').filter(Boolean).map((r) => fs.readFileSync(path.join(RACINE, r), 'utf8')).join('\n');
            const lus = new Set<string>();
            for (const m of textes.matchAll(/Deno\.env\.get\(\s*['"]([A-Z][A-Z0-9_]+)['"]\s*\)/g)) lus.add(m[1]);
            expect([...lus].sort()).toEqual([...f.secrets_lus].sort());
        }
    });
});

describe('kit-sauvegarde — scanner anti-secrets', () => {
    it('sait rougir sur des secrets factices et rester muet sur un fichier sain', async () => {
        const { scannerSecrets } = await import('../kit-sauvegarde/lib/commun.mjs');
        const dir = fs.mkdtempSync(path.join(RACINE, 'node_modules/.tmp-kit-'));
        try {
            fs.writeFileSync(path.join(dir, 'sain.ts'), "export const url = 'https://exemple.test';\n");
            fs.writeFileSync(path.join(dir, 'fuite.ts'), "const k = 'sk-" + 'a'.repeat(32) + "';\nconst j = 'eyJ" + 'b'.repeat(30) + '.' + 'c'.repeat(30) + '.' + 'd'.repeat(20) + "';\n");
            const det = scannerSecrets(dir, ['sain.ts', 'fuite.ts']);
            expect(det.filter((d: { fichier: string }) => d.fichier === 'sain.ts')).toHaveLength(0);
            expect(det.filter((d: { fichier: string }) => d.fichier === 'fuite.ts').map((d: { motif: string }) => d.motif).sort()).toEqual(['cle_sk', 'jwt']);
            for (const d of det) expect(d.extrait).not.toContain('a'.repeat(20));
        } finally { fs.rmSync(dir, { recursive: true, force: true }); }
    });

    it('ne détecte aucun secret bloquant dans les fichiers du kit', async () => {
        const { scannerSecrets, listerFichiers, avertissementConnu } = await import('../kit-sauvegarde/lib/commun.mjs');
        const det = scannerSecrets(KIT, listerFichiers(KIT), { avertissementSeulement: avertissementConnu });
        expect(det.filter((d: { bloquant: boolean }) => d.bloquant)).toEqual([]);
    });
});

describe('kit-sauvegarde — assistant guidé', () => {
    it('déclare treize étapes dans l\'ordre du parcours et refuse la production sans autorisation', () => {
        const src = fs.readFileSync(path.join(KIT, 'redeployer.mjs'), 'utf8');
        expect(src).toMatch(/const TOTAL = 13;/);
        for (let n = 0; n <= 13; n++) expect(src, `étape ${n}`).toMatch(new RegExp(`etape\\(${n}, TOTAL,`));
        expect(src).toMatch(/REF_PRODUCTION = 'rqciahtpixdjbyoajomg'/);
        expect(src).toMatch(/--autoriser-production/);
        expect(src).toMatch(/Taper PRODUCTION/);
    });
});
