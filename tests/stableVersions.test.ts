/**
 * REGISTRE DES VERSIONS STABLES — le registre est un relevé de FAITS, pas
 * une déclaration : chaque version fusionnée doit exister dans la mémoire
 * vivante (`docs/HISTORIQUE_VERSIONS.md`, `docs/JOURNAL_DECISIONS.md`) avec
 * son commit, sa PR et sa décision ; la version que le code déclare est
 * l'entrée la plus récente ; l'identification de la version servie, les
 * pré-contrôles, la procédure et le verdict sont des fonctions pures testées
 * sur des cas réels du 05/09/2026.
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { VERSION_DU_CODE } from '../services/versions/versionDuCode';
import {
    REGISTRE_VERSIONS_STABLES, SITE_PRODUCTION, commitCourt, identifierVersionServie, memeCommit,
    preControlesRestauration, procedureRestauration, trouverVersion, verdictRestauration, versionsFusionnees,
    versionsPosterieures, versionsRestaurables,
    type IdentificationServie, type VersionJson,
} from '../services/versions/stableVersions';

const historique = readFileSync(resolve(__dirname, '../docs/HISTORIQUE_VERSIONS.md'), 'utf8');
const journal = readFileSync(resolve(__dirname, '../docs/JOURNAL_DECISIONS.md'), 'utf8');
const fusionnees = versionsFusionnees();

const v6421 = trouverVersion('v6.42.1')!;
const v6430 = trouverVersion('v6.43.0')!;
const v6420 = trouverVersion('v6.42.0')!;
const v6411 = trouverVersion('v6.41.1')!;

const vj = (partiel: Partial<VersionJson>): VersionJson => ({
    version: VERSION_DU_CODE, commit: null, deployId: null, branche: 'main', contexte: 'production',
    construitLe: '2026-09-05T20:00:00.000Z', bundle: null, ...partiel,
});

describe('le registre est un relevé de faits', () => {
    it('la version que le code déclare est la première entrée du registre, et elle est unique', () => {
        expect(REGISTRE_VERSIONS_STABLES[0].version).toBe(VERSION_DU_CODE);
        const etiquettes = REGISTRE_VERSIONS_STABLES.map((v) => v.version);
        expect(new Set(etiquettes).size).toBe(etiquettes.length);
        expect(VERSION_DU_CODE).toMatch(/^v\d+\.\d+\.\d+$/);
    });

    it('au moins trois versions stables fusionnées, chacune avec nom, date, commit complet, PR, module, décision et preuves', () => {
        expect(fusionnees.length).toBeGreaterThanOrEqual(3);
        for (const v of fusionnees) {
            expect(v.nom.length, v.version).toBeGreaterThan(20);
            expect(v.commit, v.version).toMatch(/^[0-9a-f]{40}$/);
            expect(Number.isNaN(new Date(v.fusionUtc!).getTime()), v.version).toBe(false);
            expect(v.pr, v.version).toBeGreaterThan(0);
            expect(v.modules.length, v.version).toBeGreaterThan(0);
            expect(v.dec, v.version).toMatch(/^DEC-2026-\d{3}$/);
            expect(v.preuves.typage, v.version).toBe('0 erreur');
            expect(v.preuves.tests, v.version).toMatch(/^\d+\/\d+/);
            if (v.bundle) expect(v.bundle, v.version).toMatch(/^\/assets\/index-[^/]+\.js$/);
        }
    });

    it('les versions fusionnées sont ordonnées par heure de fusion, la plus récente d’abord (v6.42.1 a été fusionnée après v6.43.0)', () => {
        for (let i = 1; i < fusionnees.length; i++) {
            expect(fusionnees[i - 1].fusionUtc! >= fusionnees[i].fusionUtc!).toBe(true);
        }
        expect(fusionnees[0].version).toBe('v6.42.1');
        expect(fusionnees[1].version).toBe('v6.43.0');
    });

    it('chaque version du registre existe dans la mémoire vivante : ligne du tableau, commit court, PR, décision — et une section détaillée pour la version du code et les trois dernières fusionnées', () => {
        for (const v of REGISTRE_VERSIONS_STABLES) {
            expect(historique, `ligne ${v.version}`).toContain(`| **${v.version}** |`);
            expect(journal, `décision ${v.dec} de ${v.version}`).toContain(`### [${v.dec}]`);
            if (v.commit) expect(historique + journal, `commit ${commitCourt(v.commit)} de ${v.version}`).toContain(commitCourt(v.commit));
            if (v.pr) expect(historique + journal, `PR #${v.pr} de ${v.version}`).toContain(`#${v.pr}`);
        }
        // La ligne du tableau est le contrat ; la section détaillée est exigée pour ce que l'Admin Général restaurera en premier.
        for (const v of [REGISTRE_VERSIONS_STABLES[0], ...fusionnees.slice(0, 3)]) {
            expect(historique, `section ${v.version}`).toContain(`### [Version ${v.version.slice(1)}]`);
        }
    });

    it('les versions restaurables sont exactement les versions fusionnées avec commit et heure connus', () => {
        expect(versionsRestaurables().map((v) => v.version)).toEqual(fusionnees.map((v) => v.version));
        expect(versionsRestaurables().some((v) => v.version === VERSION_DU_CODE)).toBe(false);
    });

    it('le site de production est celui relevé le 05/09/2026', () => {
        expect(SITE_PRODUCTION.url).toBe('https://moknet.net');
        expect(SITE_PRODUCTION.nom).toBe('lovely-maamoul-478226');
    });
});

describe('memeCommit', () => {
    it('reconnaît un préfixe d’au moins 7 caractères, dans les deux sens, jamais moins', () => {
        expect(memeCommit('f6d9a168ed4bffbddb3a8dde593b6e059327f74e', 'f6d9a16')).toBe(true);
        expect(memeCommit('f6d9a16', 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e')).toBe(true);
        expect(memeCommit('f6d9a1', 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e')).toBe(false);
        expect(memeCommit('f6d9a168ed4bffbddb3a8dde593b6e059327f74e', 'daa6575f6a5aa6d2159dda51b4fe5c94e32d5cd8')).toBe(false);
        expect(memeCommit(null, 'f6d9a16')).toBe(false);
    });
});

describe('identifier la version réellement servie', () => {
    it('serveur injoignable → « injoignable », jamais une supposition', () => {
        expect(identifierVersionServie({ versionJson: null, bundle: null, joignable: false })).toEqual({ etat: 'injoignable' });
    });

    it('version.json dont le commit est consigné → identifiée par version.json', () => {
        const id = identifierVersionServie({ versionJson: vj({ version: 'v6.42.1', commit: 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e', deployId: 'd1', bundle: '/assets/index-C8Y6seFM.js' }), bundle: '/assets/index-C8Y6seFM.js', joignable: true });
        expect(id.etat).toBe('identifiee');
        if (id.etat === 'identifiee') {
            expect(id.version.version).toBe('v6.42.1');
            expect(id.source).toBe('version.json');
            expect(id.deployId).toBe('d1');
        }
    });

    it('version.json qui déclare une version du registre mais un commit non consigné (documentation seule, code postérieur) → « déclarée », dit en toutes lettres', () => {
        const id = identifierVersionServie({ versionJson: vj({ version: VERSION_DU_CODE, commit: 'b393726f8a0d094336800cc79e1a14e4e1513338' }), bundle: '/assets/index-XXXX.js', joignable: true });
        expect(id.etat).toBe('declaree');
        if (id.etat === 'declaree') {
            expect(id.version.version).toBe(VERSION_DU_CODE);
            expect(id.commit).toBe('b393726f8a0d094336800cc79e1a14e4e1513338');
        }
    });

    it('version.json qui déclare une version absente du registre → « inconnue du registre »', () => {
        const id = identifierVersionServie({ versionJson: vj({ version: 'v9.99.0', commit: '0123456789abcdef0123456789abcdef01234567' }), bundle: null, joignable: true });
        expect(id.etat).toBe('inconnue-du-registre');
        if (id.etat === 'inconnue-du-registre') expect(id.versionDeclaree).toBe('v9.99.0');
    });

    it('pas de version.json (déploiement antérieur au registre) mais bundle consigné → identifiée par le bundle', () => {
        const id = identifierVersionServie({ versionJson: null, bundle: '/assets/index-CacRDIgE.js', joignable: true });
        expect(id.etat).toBe('identifiee');
        if (id.etat === 'identifiee') {
            expect(id.version.version).toBe('v6.42.0');
            expect(id.source).toBe('bundle');
        }
    });

    it('pas de version.json et bundle inconnu → « non identifiable », le bundle est conservé pour le dire', () => {
        expect(identifierVersionServie({ versionJson: null, bundle: '/assets/index-INCONNU.js', joignable: true })).toEqual({ etat: 'non-identifiable', bundle: '/assets/index-INCONNU.js' });
    });
});

const servieV6421: IdentificationServie = { etat: 'identifiee', version: v6421, source: 'version.json', commit: v6421.commit, bundle: v6421.bundle, deployId: null };

describe('pré-contrôles d’une restauration — jamais à l’aveugle', () => {
    it('revenir à v6.42.0 depuis v6.42.1 : tout vert, la restauration retire v6.42.1 et v6.43.0', () => {
        const r = preControlesRestauration(v6420, servieV6421);
        expect(r.autorise).toBe(true);
        expect(r.oranges).toBe(0);
        expect(r.controles.map((c) => c.id)).toEqual(['cible-consignee', 'cible-eprouvee', 'production-lisible', 'cible-differente', 'schema-base', 'donnees', 'configuration-servie']);
        expect(r.controles.find((c) => c.id === 'cible-differente')!.detail).toContain('v6.42.1, v6.43.0');
        expect(versionsPosterieures(v6420).map((v) => v.version)).toEqual(['v6.42.1', 'v6.43.0']);
    });

    it('la version déjà servie ne se restaure pas : rouge, refusé', () => {
        const r = preControlesRestauration(v6421, servieV6421);
        expect(r.autorise).toBe(false);
        expect(r.controles.find((c) => c.id === 'cible-differente')!.verdict).toBe('rouge');
    });

    it('production injoignable : rouge, refusé — on ne restaure pas sans savoir ce qui est servi', () => {
        const r = preControlesRestauration(v6420, { etat: 'injoignable' });
        expect(r.autorise).toBe(false);
        expect(r.controles.find((c) => c.id === 'production-lisible')!.verdict).toBe('rouge');
    });

    it('production non identifiable : orange (permis mais à reconnaître), la vérification se fera par le bundle', () => {
        const r = preControlesRestauration(v6420, { etat: 'non-identifiable', bundle: '/assets/index-INCONNU.js' });
        expect(r.autorise).toBe(true);
        expect(r.oranges).toBeGreaterThanOrEqual(1);
        expect(r.controles.find((c) => c.id === 'production-lisible')!.verdict).toBe('orange');
    });

    it('revenir avant v6.42.0 (domaine canonique) : la configuration servie change → orange nommé', () => {
        const r = preControlesRestauration(v6411, servieV6421);
        expect(r.autorise).toBe(true);
        const conf = r.controles.find((c) => c.id === 'configuration-servie')!;
        expect(conf.verdict).toBe('orange');
        expect(conf.detail).toContain('v6.42.0');
        expect(conf.detail).toContain('netlify.toml');
    });

    it('revenir avant une version qui a introduit une migration → orange « schéma de base »', () => {
        const v6400 = trouverVersion('v6.40.0')!;
        const r = preControlesRestauration(v6400, servieV6421);
        const schema = r.controles.find((c) => c.id === 'schema-base')!;
        expect(schema.verdict).toBe('orange');
        expect(schema.detail).toContain('v6.41.0');
    });

    it('une version non fusionnée ou sans preuves suffisantes est refusée', () => {
        const enPreparation = REGISTRE_VERSIONS_STABLES[0];
        const r = preControlesRestauration(enPreparation, servieV6421);
        expect(r.autorise).toBe(false);
        expect(r.controles.find((c) => c.id === 'cible-consignee')!.verdict).toBe('rouge');
        expect(r.controles.find((c) => c.id === 'cible-eprouvee')!.verdict).toBe('rouge');
    });
});

describe('procédure de restauration', () => {
    it('voie Netlify : le déploiement du commit cible, l’aperçu d’abord, « Publish deploy », et le verrou de publication dit', () => {
        const p = procedureRestauration(v6420);
        expect(p.voieNetlify.lien).toBe(SITE_PRODUCTION.deploiements);
        const texte = p.voieNetlify.etapes.join('\n');
        expect(texte).toContain('daa6575');
        expect(texte).toContain('Publish deploy');
        expect(texte).toContain('index-CacRDIgE.js');
        expect(texte).toMatch(/verrouille/);
    });

    it('voie Git : liste des commits postérieurs, un revert par version postérieure du plus récent au plus ancien, typage + suite + build, PR', () => {
        const p = procedureRestauration(v6420);
        expect(p.voieGit.commandes).toContain('git fetch origin main');
        expect(p.voieGit.commandes.some((c) => c.startsWith('git log --oneline daa6575..origin/main'))).toBe(true);
        const reverts = p.voieGit.commandes.filter((c) => c.startsWith('git revert'));
        expect(reverts.map((c) => c.split(' ')[3])).toEqual(['f6d9a16', 'f6948b0']);
        expect(p.voieGit.commandes).toContain('npx tsc --noEmit && npx vitest run && npm run build');
        expect(p.verificationApres.join(' ')).toContain('version.json');
    });

    it('sans version postérieure consignée, la procédure le dit au lieu d’inventer un revert', () => {
        const p = procedureRestauration(v6421);
        expect(p.voieGit.commandes.some((c) => c.startsWith('git revert'))).toBe(false);
        expect(p.voieGit.commandes.some((c) => c.includes('aucune version postérieure consignée'))).toBe(true);
    });
});

describe('verdict après restauration', () => {
    it('la cible est servie → vert ; une autre version → rouge ; injoignable → rouge ; non identifiable → blanc', () => {
        expect(verdictRestauration(v6420, { etat: 'identifiee', version: v6420, source: 'bundle', commit: v6420.commit, bundle: v6420.bundle, deployId: null }).verdict).toBe('vert');
        expect(verdictRestauration(v6420, servieV6421).verdict).toBe('rouge');
        expect(verdictRestauration(v6420, { etat: 'injoignable' }).verdict).toBe('rouge');
        expect(verdictRestauration(v6420, { etat: 'non-identifiable', bundle: null }).verdict).toBe('blanc');
        expect(verdictRestauration(v6420, { etat: 'inconnue-du-registre', versionDeclaree: 'v9.0.0', commit: null, bundle: null, deployId: null }).verdict).toBe('rouge');
    });

    it('la cible déclarée mais avec un commit différent du consigné → orange, jamais un vert', () => {
        expect(verdictRestauration(v6430, { etat: 'declaree', version: v6430, commit: '0000000abcdef', bundle: null, deployId: null }).verdict).toBe('orange');
    });
});
