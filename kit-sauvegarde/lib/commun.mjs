/**
 * Bibliothèque commune du kit de sauvegarde et de redéploiement MokNet.
 *
 * Zéro dépendance : Node ≥ 22 seulement. Ces fonctions n'écrivent jamais un
 * secret ailleurs que là où l'appelant le décide explicitement ; les valeurs
 * secrètes sont toujours masquées dans les journaux (`masquer`).
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import readline from 'node:readline';
import { spawnSync } from 'node:child_process';

const COULEUR = !!process.stdout.isTTY && !process.env.NO_COLOR;
const teinte = (code) => (s) => (COULEUR ? `\x1b[${code}m${s}\x1b[0m` : String(s));
export const gras = teinte('1');
export const vert = teinte('32');
export const jaune = teinte('33');
export const rouge = teinte('31');
export const bleu = teinte('36');
export const gris = teinte('90');

export function journal(msg = '') { process.stdout.write(String(msg) + '\n'); }
export function titre(t) { journal(''); journal(gras('══ ' + t)); }
export function etape(n, total, label) {
    journal('');
    journal(gras(bleu(`Étape ${n}/${total} — ${label}`)));
    journal(gris('─'.repeat(64)));
}
export function ok(msg) { journal(vert('  ✔ ') + msg); }
export function attention(msg) { journal(jaune('  ⚠ ') + msg); }
export function erreur(msg) { journal(rouge('  ✖ ') + msg); }
export function info(msg) { journal(gris('  · ') + msg); }
export function horodatage() { return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'); }

export function sha256Fichier(p) {
    const h = crypto.createHash('sha256');
    h.update(fs.readFileSync(p));
    return h.digest('hex');
}
export function sha256Texte(s) { return crypto.createHash('sha256').update(s).digest('hex'); }
export function lireJSON(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
export function ecrireJSON(p, obj) {
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n');
}
export function taille(octets) {
    if (octets < 1024) return `${octets} o`;
    if (octets < 1024 * 1024) return `${(octets / 1024).toFixed(1)} Ko`;
    return `${(octets / 1024 / 1024).toFixed(1)} Mo`;
}

/** Liste récursive des fichiers (chemins relatifs, séparateur `/`, triés). */
export function listerFichiers(racine, { exclure = [] } = {}) {
    const out = [];
    const marcher = (dir) => {
        const entrees = fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
        for (const e of entrees) {
            const abs = path.join(dir, e.name);
            const rel = path.relative(racine, abs).split(path.sep).join('/');
            if (exclure.some((x) => rel === x || rel.startsWith(x + '/'))) continue;
            if (e.isDirectory()) marcher(abs);
            else if (e.isFile()) out.push(rel);
        }
    };
    marcher(racine);
    return out;
}

/**
 * Exécute une commande. En simulation, la commande est seulement affichée.
 * Les secrets ne passent JAMAIS en argument (ils seraient visibles dans le
 * journal et dans la liste des processus) : ils passent par `env`.
 */
export function executer(cmd, args, { cwd, env, simulation = false, capture = false, silencieux = false, entree } = {}) {
    const ligne = [cmd, ...args].join(' ');
    if (simulation) {
        journal(gris('  [SIMULATION] ' + ligne + (cwd ? gris(`   (dans ${cwd})`) : '')));
        return { status: 0, stdout: '', stderr: '', simule: true };
    }
    if (!silencieux) journal(gris('  $ ' + ligne));
    const r = spawnSync(cmd, args, {
        cwd,
        env: { ...process.env, ...(env || {}) },
        encoding: 'utf8',
        stdio: capture ? ['pipe', 'pipe', 'pipe'] : [entree === undefined ? 'inherit' : 'pipe', 'inherit', 'inherit'],
        input: entree,
        maxBuffer: 256 * 1024 * 1024,
    });
    if (r.error) return { status: 127, stdout: '', stderr: String(r.error.message), erreur: r.error };
    return { status: r.status ?? 1, stdout: r.stdout || '', stderr: r.stderr || '' };
}
export function executerOuEchouer(cmd, args, options = {}) {
    const r = executer(cmd, args, options);
    if (r.status !== 0) {
        const detail = (r.stderr || r.stdout || '').trim().split('\n').slice(-5).join('\n');
        throw new Error(`Commande en échec (${r.status}) : ${cmd} ${args.join(' ')}${detail ? '\n' + detail : ''}`);
    }
    return r;
}

export function masquer(v) {
    if (v === undefined || v === null || v === '') return '(vide)';
    const s = String(v);
    if (s.length <= 6) return '***';
    return s.slice(0, 3) + '…' + '*'.repeat(Math.min(6, s.length - 5)) + s.slice(-2);
}

/**
 * Questionnaire : pose les questions une par une. Trois sources de réponse,
 * dans l'ordre : fichier de réponses (`--reponses`, pour les tests et les
 * rejeux), saisie interactive, valeur par défaut. Une question secrète est
 * saisie sans écho et n'est jamais journalisée en clair.
 */
export class Questionnaire {
    constructor({ reponses = {}, interactif = !!process.stdin.isTTY } = {}) {
        this.reponses = reponses;
        this.interactif = interactif;
        this.rl = null;
        this.trace = [];
    }
    _rl() {
        if (!this.rl) this.rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
        return this.rl;
    }
    _lire(invite, secret) {
        const rl = this._rl();
        return new Promise((resolve) => {
            if (secret && process.stdin.isTTY) {
                const original = rl._writeToOutput;
                rl._writeToOutput = function (s) {
                    if (typeof s === 'string' && s.includes(invite)) original.call(rl, invite);
                    else if (s === '\r\n' || s === '\n') original.call(rl, s);
                    // sinon : rien n'est affiché (saisie masquée)
                };
                rl.question(invite, (rep) => { rl._writeToOutput = original; process.stdout.write('\n'); resolve(rep); });
            } else {
                rl.question(invite, resolve);
            }
        });
    }
    _fournie(id) { return Object.prototype.hasOwnProperty.call(this.reponses, id); }
    async demander(id, texte, { secret = false, defaut = '', optionnel = false, valider, choix } = {}) {
        const options = { secret, defaut, optionnel, valider, choix };
        let valeur;
        if (this._fournie(id)) {
            valeur = String(this.reponses[id] ?? '');
            info(`${texte} → ${secret ? masquer(valeur) : (valeur === '' ? '(vide)' : valeur)} ${gris('(réponse fournie)')}`);
        } else if (!this.interactif) {
            if (defaut !== '' || optionnel) valeur = defaut;
            else throw new Error(`Réponse requise hors mode interactif : « ${id} » (${texte}). Fournissez-la dans le fichier --reponses.`);
        } else {
            const suffixe = choix ? ` [${choix.join('/')}]` : defaut !== '' ? ` [${defaut}]` : optionnel ? ' [Entrée pour passer]' : '';
            valeur = (await this._lire(`  ? ${texte}${suffixe} : `, secret)).trim();
            if (valeur === '' && defaut !== '') valeur = defaut;
        }
        const redemander = () => (this.interactif && !this._fournie(id)) ? this.demander(id, texte, options) : null;
        if (valeur === '' && !optionnel) {
            erreur('Une valeur est nécessaire.');
            const r = redemander(); if (r) return r;
            throw new Error(`Valeur manquante pour « ${id} ».`);
        }
        if (valeur !== '' && choix && !choix.includes(valeur)) {
            erreur(`Réponse attendue parmi : ${choix.join(', ')}.`);
            const r = redemander(); if (r) return r;
            throw new Error(`Réponse invalide pour « ${id} » : ${valeur}.`);
        }
        if (valeur !== '' && valider) {
            const v = valider(valeur);
            if (v !== true) {
                erreur(typeof v === 'string' ? v : 'Valeur invalide.');
                const r = redemander(); if (r) return r;
                throw new Error(`Valeur invalide pour « ${id} »${typeof v === 'string' ? ' : ' + v : ''}.`);
            }
        }
        this.trace.push({ id, secret, valeur: secret ? masquer(valeur) : valeur });
        return valeur;
    }
    async confirmer(id, texte, { defaut = 'non' } = {}) {
        const r = await this.demander(id, texte, {
            defaut,
            valider: (v) => (['oui', 'o', 'non', 'n', 'yes', 'y', 'no'].includes(v.toLowerCase()) ? true : 'Répondre oui ou non.'),
        });
        return ['oui', 'o', 'yes', 'y'].includes(r.toLowerCase());
    }
    fermer() { if (this.rl) { this.rl.close(); this.rl = null; } }
}

/* ────────────────────────────── Scan anti-secrets ────────────────────────────── */

export const MOTIFS_SECRETS = [
    { id: 'jwt', re: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/g },
    { id: 'cle_sk', re: /\bsk-[A-Za-z0-9_-]{20,}/g },
    { id: 'cle_google', re: /\bAIza[0-9A-Za-z_-]{30,}/g },
    { id: 'jeton_github', re: /\bgh[pousr]_[A-Za-z0-9]{30,}/g },
    { id: 'jeton_supabase', re: /\bsbp_[a-f0-9]{30,}/g },
    { id: 'cle_supabase_moderne', re: /\bsb_(?:publishable|secret)_[A-Za-z0-9_-]{20,}/g },
    { id: 'jeton_netlify', re: /\bnf[po]_[A-Za-z0-9]{30,}/g },
    { id: 'bloc_cle_privee', re: /-----BEGIN [A-Z ]*PRIVATE KEY-----/g },
    // Valeur sans espace d'au moins 16 caractères après un nom de clé : une phrase de l'interface (avec espaces) n'est pas un secret.
    { id: 'secret_en_dur', re: /\b(?:secret|api[_-]?key|access[_-]?token|auth[_-]?token|password|mot_de_passe)\s*[:=]\s*["'][A-Za-z0-9_\-./+=]{16,}["']/gi },
    // Littéral (pas un paramètre p_secret, pas un gabarit <…>) passé au coffre.
    { id: 'vault_create_secret_litteral', re: /vault\.create_secret\s*\(\s*'[A-Za-z0-9_\-./+=]{8,}'/g },
    { id: 'url_avec_identifiants', re: /\b[a-z][a-z0-9+.-]*:\/\/[^\s/:@]+:[^\s/@]{6,}@/gi },
];
const EXTENSIONS_TEXTE = new Set(['.ts', '.tsx', '.js', '.mjs', '.cjs', '.json', '.md', '.sql', '.toml', '.html', '.css', '.txt', '.yml', '.yaml', '.sh', '.py', '.webmanifest', '.example', '.env', '.vtt', '.svg', '.xml', '.csv', '.sha256']);
const TAILLE_MAX_SCAN = 3 * 1024 * 1024;

export function estTexteScannable(rel) {
    const base = path.basename(rel);
    if (base.startsWith('.env')) return true;
    return EXTENSIONS_TEXTE.has(path.extname(base).toLowerCase());
}

/**
 * Scanne des fichiers ; retourne les détections (fichier, motif, extrait masqué).
 * @param {string} racine
 * @param {string[]} fichiers chemins relatifs à `racine`
 * @param {{ avertissementSeulement?: (rel: string, motifId: string, valeur: string) => boolean }} [options]
 * @returns {{ fichier: string, ligne: number, motif: string, extrait: string, bloquant: boolean }[]}
 */
export function scannerSecrets(racine, fichiers, options = {}) {
    /** @type {(rel: string, motifId: string, valeur: string) => boolean} */
    const avertissementSeulement = options.avertissementSeulement || (() => false);
    const detections = [];
    for (const rel of fichiers) {
        if (!estTexteScannable(rel)) continue;
        const abs = path.join(racine, rel);
        let st; try { st = fs.statSync(abs); } catch { continue; }
        if (!st.isFile() || st.size > TAILLE_MAX_SCAN) continue;
        const texte = fs.readFileSync(abs, 'utf8');
        for (const motif of MOTIFS_SECRETS) {
            motif.re.lastIndex = 0;
            let m;
            while ((m = motif.re.exec(texte)) !== null) {
                const ligne = texte.slice(0, m.index).split('\n').length;
                detections.push({
                    fichier: rel, ligne, motif: motif.id,
                    extrait: masquer(m[0]),
                    bloquant: !avertissementSeulement(rel, motif.id, m[0]),
                });
                if (detections.length > 500) return detections;
            }
        }
    }
    return detections;
}

/**
 * Faux positifs connus : signalés, jamais bloquants.
 * @param {string} rel chemin relatif du fichier
 * @param {string} motifId identifiant du motif
 * @param {string} valeur texte détecté
 * @returns {boolean}
 */
export function avertissementConnu(rel, motifId, valeur) {
    // Doublures de tests, mesures de captures, documentation et maquettes : jetons factices ou exemples, relus par un humain.
    if (rel.startsWith('tests/') || rel.startsWith('docs/') || rel.startsWith('design-lab/') || /README\.md$/.test(rel)) return true;
    // Valeur qui se déclare elle-même factice, locale ou gabarit (« local-sovereign-token », « changeme », « SIMULATION-… »).
    if (/local|placeholder|changeme|exemple|example|simulation|factice|dummy|sample|<[A-Z_]+>/i.test(valeur)) return true;
    void motifId;
    return false;
}
