/**
 * REGISTRE DES VERSIONS STABLES ET RESTAURATION CONTRÔLÉE — cœur pur.
 *
 * Demande de la Direction (05/09/2026) : voir, dans le tableau de bord de
 * l'Admin Général, les dernières versions stables (nom, date, commit, PR,
 * module, statut de production, preuves) et pouvoir revenir à une version
 * saine en cas de régression — « jamais à l'aveugle ».
 *
 * Ce module ne touche ni au réseau ni au DOM : il porte le registre (des
 * FAITS relevés dans `docs/HISTORIQUE_VERSIONS.md` et
 * `docs/JOURNAL_DECISIONS.md`, vérifiés par `tests/stableVersions.test.ts`),
 * l'identification de la version réellement servie à partir de ce que le
 * serveur renvoie, les pré-contrôles d'une restauration, la procédure exacte
 * et le verdict après restauration. Tout ce qui est incertain reste `null`
 * ou est dit en toutes lettres : rien n'est supposé.
 *
 * Ce que le registre N'EST PAS : l'ancien sous-onglet « Versions » de
 * « Workflows & Sauvegarde » (v6.3, données figées v6.3.0 / v6.2.0 / v6.1.0,
 * restauration de la configuration locale) reste en place tel quel — rien ne
 * disparaît — mais il ne décrit pas le code livré. Celui-ci le fait.
 */
import { VERSION_DU_CODE } from './versionDuCode';

// ─── Dépôt et site servis ────────────────────────────────────────────────

export const DEPOT_GITHUB =
    'https://github.com/diallomouctar82/RESEAU-SOCIAL-MOKCHAT-TRES-BON-A-RETRAILLER-AVEC-CLAUDE-NETLIFY';

/** Site Netlify de production (relevé le 05/09/2026 : `moknet.net` = `lovely-maamoul-478226`). */
export const SITE_PRODUCTION = {
    nom: 'lovely-maamoul-478226',
    url: 'https://moknet.net',
    console: 'https://app.netlify.com/projects/lovely-maamoul-478226',
    deploiements: 'https://app.netlify.com/projects/lovely-maamoul-478226/deploys?filter=main',
} as const;

// ─── Types ───────────────────────────────────────────────────────────────

/** Contenu de `/version.json`, émis au build (vite-plugins/versionJson.ts). */
export interface VersionJson {
    version: string;
    commit: string | null;
    deployId: string | null;
    branche: string | null;
    contexte: string | null;
    construitLe: string;
    bundle: string | null;
}

export type StatutRegistre = 'fusionnee' | 'en-preparation';

export interface PreuvesVersion {
    /** Typage TypeScript (`npx tsc --noEmit`). */
    typage: string;
    /** Suite de tests, chiffre mesuré sur l'arbre fusionné (« 1642/1642 (109 fichiers) »). */
    tests?: string;
    /** Identifiants des runs « CI — Green Gate » (tête exacte, `main`). */
    greenGate?: string[];
    /** Dossier des captures et mesures, relatif à la racine du dépôt. */
    captures?: string;
    /** Ce qui a été vérifié sur la page réellement servie après la fusion. */
    productionVerifiee?: string;
    /** Revue indépendante (producteur ≠ contrôleur) et contre-vérification. */
    revueIndependante?: string;
}

export interface RisqueRestauration {
    /** La version a introduit une migration de base versionnée. */
    migrationsBase: boolean;
    /** La version a écrit ou transformé des données réelles. */
    donneesTouchees: boolean;
    /** La version a changé la configuration servie (`netlify.toml` : redirections, en-têtes). */
    configurationServie: boolean;
    note?: string;
}

export interface VersionStable {
    /** Étiquette (`v6.42.1`). */
    version: string;
    /** Nom lisible : ce que la version apporte. */
    nom: string;
    /** Décision du journal (`DEC-2026-079`). */
    dec: string;
    /** Modules touchés (fiches `docs/modules/`). */
    modules: string[];
    /** Numéro de la PR fusionnée ; `null` tant que la PR n'existe pas. */
    pr: number | null;
    /** SHA complet du commit de fusion (squash) sur `main` ; `null` avant fusion. */
    commit: string | null;
    /** Heure de la fusion, ISO 8601 UTC ; `null` avant fusion. */
    fusionUtc: string | null;
    /** Bundle d'entrée servi juste après la fusion (`/assets/index-XXXX.js`) ; `null` si non consigné. */
    bundle: string | null;
    statut: StatutRegistre;
    preuves: PreuvesVersion;
    risque: RisqueRestauration;
}

// ─── Le registre ─────────────────────────────────────────────────────────
//
// Ordre : la version que ce code déclare d'abord, puis les versions
// fusionnées de la plus récente à la plus ancienne (heure de fusion, pas
// numéro : la v6.42.1 a été fusionnée APRÈS la v6.43.0). Chaque fait vient de
// la mémoire vivante ; un fait absent reste `null` ou n'est pas écrit.

export const REGISTRE_VERSIONS_STABLES: readonly VersionStable[] = [
    {
        version: VERSION_DU_CODE,
        nom: 'Super-Admin : onglet « Versions stables » — les dernières versions livrées avec leurs preuves, la version réellement servie par moknet.net, et un ordre de restauration contrôlée (pré-contrôles, confirmation saisie, motif, journal, procédure, vérification)',
        dec: 'DEC-2026-086',
        modules: ['Super-Admin — Sécurité & infrastructure (module 14)'],
        pr: 121,
        commit: null,
        fusionUtc: null,
        bundle: null,
        statut: 'en-preparation',
        preuves: {
            typage: '0 erreur',
            captures: 'docs/captures/2026-09-05-versions-stables-restauration',
        },
        risque: {
            migrationsBase: false,
            donneesTouchees: false,
            configurationServie: false,
            note: 'Aucune migration, aucune fonction Edge, aucune donnée touchée ; un fichier version.json est ajouté au build.',
        },
    },
    {
        version: 'v6.42.1',
        nom: 'Architecte : plus de bande sombre au sommet du cadre rond de /architecte — prolongement adouci du fond, portrait, affiche et vidéo régénérés',
        dec: 'DEC-2026-079',
        modules: ['Diallo OS & Architecte (module 01)'],
        pr: 111,
        commit: 'f6d9a168ed4bffbddb3a8dde593b6e059327f74e',
        fusionUtc: '2026-09-05T17:47:14Z',
        bundle: '/assets/index-C8Y6seFM.js',
        statut: 'fusionnee',
        preuves: {
            typage: '0 erreur',
            tests: '1642/1642 (109 fichiers)',
            greenGate: ['33981843750 (tête d5550ed)', '33982039577 (main)'],
            captures: 'docs/captures/2026-09-05-architecte-bande-sombre',
            productionVerifiee: 'moknet.net sert index-C8Y6seFM.js depuis 17:48 UTC ; ancien bundle index-C_IAplN2.js → 404 ; fumée Chromium : bande à 132 (portrait et vidéo) sur ordinateur et téléphone',
            revueIndependante: 'Huit constats, tous traités ; contre-vérification « PRÊT »',
        },
        risque: {
            migrationsBase: false,
            donneesTouchees: false,
            configurationServie: false,
            note: 'Actifs statiques régénérés (portrait, silhouette, affiche, vidéo) ; aucune migration, aucune donnée.',
        },
    },
    {
        version: 'v6.43.0',
        nom: 'Studio Live : bouton « Quitter le direct » clair et sortie propre selon le rôle, sans jamais recharger la page',
        dec: 'DEC-2026-082',
        modules: ['Réseau MOC & Social — Studio Live (module 05)'],
        pr: 112,
        commit: 'f6948b012af8dbbc2daa4acfad06501b4371c0ad',
        fusionUtc: '2026-09-05T17:23:30Z',
        bundle: '/assets/index-C_IAplN2.js',
        statut: 'fusionnee',
        preuves: {
            typage: '0 erreur',
            tests: '1635/1635 (108 fichiers)',
            greenGate: ['tête 97abca9 (success)', 'run #253 (main)'],
            productionVerifiee: 'Marqueurs live-quit-button et « Quitter le direct » présents dans le bundle servi (index-C_IAplN2.js à la fusion, puis index-C8Y6seFM.js), ancien libellé absent',
            revueIndependante: 'Revue indépendante « PRÊT » sur le diff',
        },
        risque: {
            migrationsBase: false,
            donneesTouchees: false,
            configurationServie: false,
            note: 'Un composant et un test ; captures du banc navigateur réel non versionnées.',
        },
    },
    {
        version: 'v6.42.0',
        nom: 'Accès public verrouillé : toute session vérifiée par le serveur avant l’interface (verdict par jeton), domaine canonique déclaré',
        dec: 'DEC-2026-081',
        modules: ['Authentification & sessions (fiche AUTHENTIFICATION)', 'Sécurité & infrastructure — netlify.toml (module 14)'],
        pr: 105,
        commit: 'daa6575f6a5aa6d2159dda51b4fe5c94e32d5cd8',
        fusionUtc: '2026-09-05T17:01:08Z',
        bundle: '/assets/index-CacRDIgE.js',
        statut: 'fusionnee',
        preuves: {
            typage: '0 erreur',
            tests: '1632/1632 (107 fichiers)',
            greenGate: ['33979505971 (tête 4247523)', '33979639128 (main)'],
            captures: 'docs/captures/2026-09-05-acces-public-authentification',
            productionVerifiee: 'index-CacRDIgE.js servi depuis 17:01:54 UTC avec les quatre marqueurs du verrou, ancien bundle → 404 ; contrôle cas par cas ordinateur / téléphone / tablette à 18:26 UTC',
            revueIndependante: '« À CORRIGER » (1 bloquant, rejeu SIGNED_IN) puis contre-vérification « PRÊT »',
        },
        risque: {
            migrationsBase: false,
            donneesTouchees: false,
            configurationServie: true,
            note: 'Redirections du domaine canonique (www → nu, http → https) dans netlify.toml : un déploiement antérieur à cette version ne les porte pas.',
        },
    },
    {
        version: 'v6.41.1',
        nom: 'Assistant IA Pré-Publication : « Appliquer à ma publication » visible et cliquable au-dessus de la barre du bas sur téléphone',
        dec: 'DEC-2026-080',
        modules: ['Réseau MOC & Social (module 05)'],
        pr: 109,
        commit: '81c66c8fcc5856ef9ae51579ccdd080240de0176',
        fusionUtc: '2026-09-05T16:46:29Z',
        bundle: '/assets/index-6ZrCib2c.js',
        statut: 'fusionnee',
        preuves: {
            typage: '0 erreur',
            tests: '1602/1602 (105 fichiers)',
            captures: 'docs/captures/2026-09-05-assistant-ia-modale-dock',
            productionVerifiee: 'index-6ZrCib2c.js servi depuis 16:47:11 UTC, ancien bundle → 404',
        },
        risque: {
            migrationsBase: false,
            donneesTouchees: false,
            configurationServie: false,
            note: 'Composant et bloc CSS d’index.html (couche aqua régénérée).',
        },
    },
    {
        version: 'v6.41.0',
        nom: 'La photo validée devient l’avatar vivant de l’Architecte ; onglet Super-Admin dédié à enregistrement immédiat ; réglage partagé platform_settings',
        dec: 'DEC-2026-079',
        modules: ['Diallo OS & Architecte (module 01)', 'Super-Admin — onglet « Avatar de l’Architecte »'],
        pr: 107,
        commit: '86b521b08e821926bf6aa8fa07b5a7b6c83f2d02',
        fusionUtc: '2026-09-05T15:49:48Z',
        bundle: null,
        statut: 'fusionnee',
        preuves: {
            typage: '0 erreur',
            tests: '1595/1595 (104 fichiers)',
            captures: 'docs/captures/2026-09-05-architecte-photo-validee',
        },
        risque: {
            migrationsBase: true,
            donneesTouchees: false,
            configurationServie: false,
            note: 'Migration platform_settings (20260905160000) versionnée avec retour arrière ; lecture/écriture du réglage partagé « architecte_avatar ».',
        },
    },
    {
        version: 'v6.40.1',
        nom: 'Assistant IA de Santé Globale : le champ de dialogue placé juste sous la conversation, rien à activer',
        dec: 'DEC-2026-060',
        modules: ['Santé Globale — Super-Admin (module 14)'],
        pr: 104,
        commit: 'd3415b4ae774d6a13e4dfbca33c1ed35d97f7711',
        fusionUtc: '2026-09-05T15:27:14Z',
        bundle: '/assets/index-CMCLckXy.js',
        statut: 'fusionnee',
        preuves: {
            typage: '0 erreur',
            tests: '1588/1588',
            greenGate: ['33974730535 (main)'],
            captures: 'docs/captures/2026-09-05-sante-assistant',
            productionVerifiee: 'index-CMCLckXy.js servi par moknet.net (15:31 UTC)',
        },
        risque: { migrationsBase: false, donneesTouchees: false, configurationServie: false },
    },
    {
        version: 'v6.40.0',
        nom: 'Réseau MOC : même disposition des boutons de publication et des options sur ordinateur et téléphone (CSS seulement)',
        dec: 'DEC-2026-078',
        modules: ['Réseau MOC & Social (module 05)'],
        pr: 100,
        commit: 'a6155937438c263444861abe1dd37bfc4e0bf2d3',
        fusionUtc: '2026-09-05T15:12:30Z',
        bundle: '/assets/index-Bm6woHcd.js',
        statut: 'fusionnee',
        preuves: {
            typage: '0 erreur',
            tests: '1589/1589 (104 fichiers)',
            greenGate: ['33974090869', '33974386653 (main)'],
            captures: 'docs/captures/2026-09-05-reseau-meme-disposition-telephone',
            productionVerifiee: 'Page servie par moknet.net à 15:13:19 UTC (index-Bm6woHcd.js)',
        },
        risque: { migrationsBase: false, donneesTouchees: false, configurationServie: false, note: 'Blocs CSS « COMPOSEUR A7 » et « BANDE AURORE » d’index.html.' },
    },
];

// ─── Lecture du registre ─────────────────────────────────────────────────

export function versionsFusionnees(registre: readonly VersionStable[] = REGISTRE_VERSIONS_STABLES): VersionStable[] {
    return registre
        .filter((v) => v.statut === 'fusionnee' && v.commit && v.fusionUtc)
        .sort((a, b) => (a.fusionUtc! < b.fusionUtc! ? 1 : a.fusionUtc! > b.fusionUtc! ? -1 : 0));
}

/** Versions qu'un ordre de restauration peut viser : fusionnées, avec commit et heure connus. */
export function versionsRestaurables(registre: readonly VersionStable[] = REGISTRE_VERSIONS_STABLES): VersionStable[] {
    return versionsFusionnees(registre);
}

export function trouverVersion(etiquette: string, registre: readonly VersionStable[] = REGISTRE_VERSIONS_STABLES): VersionStable | undefined {
    return registre.find((v) => v.version === etiquette);
}

export function commitCourt(sha: string | null): string {
    return sha ? sha.slice(0, 7) : '—';
}

export function urlCommit(v: VersionStable): string | null {
    return v.commit ? `${DEPOT_GITHUB}/commit/${v.commit}` : null;
}

export function urlPr(v: VersionStable): string | null {
    return v.pr ? `${DEPOT_GITHUB}/pull/${v.pr}` : null;
}

export function urlCaptures(v: VersionStable): string | null {
    return v.preuves.captures ? `${DEPOT_GITHUB}/tree/main/${v.preuves.captures}` : null;
}

/** Deux SHA désignent le même commit si l'un est le préfixe (≥ 7) de l'autre. */
export function memeCommit(a: string | null | undefined, b: string | null | undefined): boolean {
    if (!a || !b) return false;
    const x = a.trim().toLowerCase();
    const y = b.trim().toLowerCase();
    if (x.length < 7 || y.length < 7) return false;
    return x.startsWith(y) || y.startsWith(x);
}

// ─── Identification de la version réellement servie ─────────────────────

export type IdentificationServie =
    /** `version.json` ou le bundle servi correspond à une entrée du registre. */
    | { etat: 'identifiee'; version: VersionStable; source: 'version.json' | 'bundle'; commit: string | null; bundle: string | null; deployId: string | null }
    /** `version.json` présent : le code se déclare vX (du registre) mais le commit servi n'est pas celui consigné (documentation seule, ou code postérieur non encore consigné). */
    | { etat: 'declaree'; version: VersionStable; commit: string | null; bundle: string | null; deployId: string | null }
    /** `version.json` présent mais la version déclarée n'est pas dans le registre. */
    | { etat: 'inconnue-du-registre'; versionDeclaree: string; commit: string | null; bundle: string | null; deployId: string | null }
    /** Pas de `version.json` (déploiement antérieur au registre) et bundle absent du registre. */
    | { etat: 'non-identifiable'; bundle: string | null }
    /** Le serveur n'a pas répondu : on ne sait pas ce qui est servi. */
    | { etat: 'injoignable' };

export interface LectureProduction {
    versionJson: VersionJson | null;
    bundle: string | null;
    joignable: boolean;
}

export function identifierVersionServie(
    lecture: LectureProduction,
    registre: readonly VersionStable[] = REGISTRE_VERSIONS_STABLES,
): IdentificationServie {
    if (!lecture.joignable) return { etat: 'injoignable' };
    const { versionJson, bundle } = lecture;
    if (versionJson) {
        const parCommit = registre.find((v) => memeCommit(v.commit, versionJson.commit));
        if (parCommit) {
            return { etat: 'identifiee', version: parCommit, source: 'version.json', commit: versionJson.commit, bundle: versionJson.bundle ?? bundle, deployId: versionJson.deployId };
        }
        const parEtiquette = registre.find((v) => v.version === versionJson.version);
        if (parEtiquette) {
            return { etat: 'declaree', version: parEtiquette, commit: versionJson.commit, bundle: versionJson.bundle ?? bundle, deployId: versionJson.deployId };
        }
        return { etat: 'inconnue-du-registre', versionDeclaree: versionJson.version, commit: versionJson.commit, bundle: versionJson.bundle ?? bundle, deployId: versionJson.deployId };
    }
    if (bundle) {
        const parBundle = registre.find((v) => v.bundle && v.bundle === bundle);
        if (parBundle) return { etat: 'identifiee', version: parBundle, source: 'bundle', commit: parBundle.commit, bundle, deployId: null };
    }
    return { etat: 'non-identifiable', bundle: bundle ?? null };
}

/** La version du registre que la production sert, si elle est connue. */
export function versionServie(id: IdentificationServie): VersionStable | null {
    return id.etat === 'identifiee' || id.etat === 'declaree' ? id.version : null;
}

// ─── Pré-contrôles d'une restauration ────────────────────────────────────

export type Verdict = 'vert' | 'orange' | 'rouge';

export interface PreControle {
    id: string;
    libelle: string;
    verdict: Verdict;
    detail: string;
}

export interface ResultatPreControles {
    controles: PreControle[];
    /** Vrai seulement sans aucun rouge. Un orange est dit, et doit être reconnu par la personne. */
    autorise: boolean;
    oranges: number;
}

/** Versions fusionnées APRÈS la cible (celles que la restauration retirerait de la production). */
export function versionsPosterieures(cible: VersionStable, registre: readonly VersionStable[] = REGISTRE_VERSIONS_STABLES): VersionStable[] {
    if (!cible.fusionUtc) return [];
    return versionsFusionnees(registre).filter((v) => v.fusionUtc! > cible.fusionUtc!);
}

export function preControlesRestauration(
    cible: VersionStable,
    servie: IdentificationServie,
    registre: readonly VersionStable[] = REGISTRE_VERSIONS_STABLES,
): ResultatPreControles {
    const controles: PreControle[] = [];
    const posterieures = versionsPosterieures(cible, registre);

    controles.push(
        cible.statut === 'fusionnee' && cible.commit && cible.fusionUtc
            ? { id: 'cible-consignee', libelle: 'Version cible consignée', verdict: 'vert', detail: `${cible.version} — commit ${commitCourt(cible.commit)}, PR #${cible.pr ?? '?'}, fusionnée le ${formaterUtc(cible.fusionUtc)}.` }
            : { id: 'cible-consignee', libelle: 'Version cible consignée', verdict: 'rouge', detail: `${cible.version} n'est pas une version fusionnée avec un commit connu : rien à restaurer.` },
    );

    const preuves = cible.preuves;
    const eprouvee = Boolean(preuves.tests) && Boolean((preuves.greenGate && preuves.greenGate.length) || preuves.productionVerifiee);
    controles.push(
        eprouvee
            ? { id: 'cible-eprouvee', libelle: 'Version cible éprouvée', verdict: 'vert', detail: `Typage ${preuves.typage} ; tests ${preuves.tests} ; ${preuves.greenGate?.length ? `Green Gate ${preuves.greenGate.join(' · ')}` : 'production vérifiée après fusion'}.` }
            : { id: 'cible-eprouvee', libelle: 'Version cible éprouvée', verdict: 'rouge', detail: 'Preuves insuffisantes dans le registre (tests et contrôle indépendant requis) : aucune restauration vers une version non éprouvée.' },
    );

    if (servie.etat === 'injoignable') {
        controles.push({ id: 'production-lisible', libelle: 'Production lisible', verdict: 'rouge', detail: `${SITE_PRODUCTION.url} n'a pas répondu : impossible de savoir ce qui est servi. Aucune restauration à l'aveugle — réessayer la lecture d'abord.` });
    } else if (servie.etat === 'non-identifiable' || servie.etat === 'inconnue-du-registre') {
        controles.push({ id: 'production-lisible', libelle: 'Production lisible', verdict: 'orange', detail: servie.etat === 'non-identifiable' ? `Le serveur répond mais la version servie n'est pas identifiable (bundle ${servie.bundle ?? 'inconnu'}, aucun version.json). La restauration reste possible ; la vérification après restauration se fera par le bundle.` : `Le serveur se déclare ${servie.versionDeclaree}, absente du registre : le registre est en retard sur la production. À reconnaître avant de continuer.` });
    } else {
        controles.push({ id: 'production-lisible', libelle: 'Production lisible', verdict: 'vert', detail: `${SITE_PRODUCTION.url} sert ${servie.version.version} (commit ${commitCourt(servie.commit)}${servie.etat === 'declaree' ? ', postérieur au commit consigné' : ''}).` });
    }

    const memeQueServie = versionServie(servie)?.version === cible.version;
    controles.push(
        memeQueServie
            ? { id: 'cible-differente', libelle: 'Cible différente de la version servie', verdict: 'rouge', detail: `${cible.version} est déjà la version servie : il n'y a rien à restaurer.` }
            : { id: 'cible-differente', libelle: 'Cible différente de la version servie', verdict: 'vert', detail: posterieures.length ? `La restauration retire de la production : ${posterieures.map((v) => v.version).join(', ')}.` : 'Aucune version postérieure consignée dans le registre : lister les commits réellement postérieurs avant d’agir (procédure, voie Git).' },
    );

    const migrations = posterieures.filter((v) => v.risque.migrationsBase);
    controles.push(
        migrations.length
            ? { id: 'schema-base', libelle: 'Schéma de base', verdict: 'orange', detail: `${migrations.map((v) => v.version).join(', ')} ont introduit une migration : le code restauré sera plus ancien que le schéma. Un retour de code ne rejoue jamais une migration à l'envers ; vérifier la compatibilité (Santé Globale) avant et après.` }
            : { id: 'schema-base', libelle: 'Schéma de base', verdict: 'vert', detail: 'Aucune migration introduite après la cible dans le registre.' },
    );

    const donnees = posterieures.filter((v) => v.risque.donneesTouchees);
    controles.push(
        donnees.length
            ? { id: 'donnees', libelle: 'Données réelles', verdict: 'orange', detail: `${donnees.map((v) => v.version).join(', ')} ont touché des données : elles restent telles quelles, le code plus ancien doit les tolérer.` }
            : { id: 'donnees', libelle: 'Données réelles', verdict: 'vert', detail: 'Aucune donnée réelle transformée après la cible : une restauration de code ne touche aucune donnée.' },
    );

    const configuration = posterieures.filter((v) => v.risque.configurationServie);
    controles.push(
        configuration.length
            ? { id: 'configuration-servie', libelle: 'Configuration servie (netlify.toml)', verdict: 'orange', detail: `${configuration.map((v) => v.version).join(', ')} ont changé la configuration servie (${configuration.map((v) => v.risque.note ?? '').filter(Boolean).join(' ')}). Publier un déploiement antérieur rétablit AUSSI l'ancienne configuration.` }
            : { id: 'configuration-servie', libelle: 'Configuration servie (netlify.toml)', verdict: 'vert', detail: 'Aucun changement de configuration servie après la cible.' },
    );

    const rouges = controles.filter((c) => c.verdict === 'rouge').length;
    const oranges = controles.filter((c) => c.verdict === 'orange').length;
    return { controles, autorise: rouges === 0, oranges };
}

// ─── Procédure de restauration ───────────────────────────────────────────

export interface ProcedureRestauration {
    /** Voie A — Netlify : publier à nouveau le déploiement de la cible (immédiat, réversible, sans nouveau code). */
    voieNetlify: { titre: string; etapes: string[]; lien: string };
    /** Voie B — Git : revenir en arrière par un `revert` passé par la chaîne complète (durable, tracé dans `main`). */
    voieGit: { titre: string; etapes: string[]; commandes: string[] };
    /** Ce qu'il faut constater après, quelle que soit la voie. */
    verificationApres: string[];
}

export function procedureRestauration(cible: VersionStable, registre: readonly VersionStable[] = REGISTRE_VERSIONS_STABLES): ProcedureRestauration {
    const posterieures = versionsPosterieures(cible, registre);
    const court = commitCourt(cible.commit);
    const branche = `restauration/${cible.version}`;
    const reverts = posterieures.map((v) => `git revert --no-edit ${commitCourt(v.commit)}   # retire ${v.version} (PR #${v.pr ?? '?'})`);

    return {
        voieNetlify: {
            titre: `Voie A — republier le déploiement de ${cible.version} sur Netlify (immédiat, réversible)`,
            etapes: [
                `Ouvrir la liste des déploiements du site ${SITE_PRODUCTION.nom} (branche main).`,
                `Repérer le déploiement de production du commit ${court} (fusion du ${formaterUtc(cible.fusionUtc)}, PR #${cible.pr ?? '?'}) ; contrôler que sa page de détail porte bien ce commit.`,
                `Ouvrir d'abord son lien permanent (« Preview ») et vérifier l'écran attendu avant toute publication.`,
                `Cliquer « Publish deploy » : ${SITE_PRODUCTION.url} sert ce déploiement en quelques secondes${cible.bundle ? ` (bundle attendu : ${cible.bundle})` : ''}.`,
                `Conséquence à connaître : Netlify verrouille alors la publication automatique (« Deploys are locked ») — les fusions suivantes construisent mais ne se publient plus tant que l'on n'a pas cliqué « Unlock ». Le noter dans l'ordre.`,
            ],
            lien: SITE_PRODUCTION.deploiements,
        },
        voieGit: {
            titre: `Voie B — revenir à ${cible.version} par revert dans main (durable, tracé, passe par la chaîne complète)`,
            etapes: [
                'Lister tous les commits réellement postérieurs à la cible : le registre ne consigne que les versions livrées par la méthode ; un commit non consigné doit aussi être annulé.',
                'Annuler les commits du plus récent au plus ancien (un revert par squash), puis typage, suite complète, build.',
                'PR brouillon « restauration », Green Gate vert sur la tête exacte, revue indépendante, puis fusion squash sur feu vert écrit.',
                'Aucune migration ni donnée n’est touchée par un revert de code ; si une version postérieure a migré la base, le dire dans la PR et vérifier la compatibilité.',
            ],
            commandes: [
                'git fetch origin main',
                `git checkout -b ${branche} origin/main`,
                `git log --oneline ${court}..origin/main   # tout ce que la restauration doit annuler`,
                ...(reverts.length ? reverts : ['# (aucune version postérieure consignée : annuler les commits listés ci-dessus, du plus récent au plus ancien)']),
                'npx tsc --noEmit && npx vitest run && npm run build',
                `git push -u origin ${branche}   # puis PR brouillon, Green Gate, revue, fusion sur feu vert`,
            ],
        },
        verificationApres: [
            `Relire ${SITE_PRODUCTION.url}/version.json (sans cache) : ${cible.bundle ? `commit ${court} ou bundle ${cible.bundle}` : `commit ${court}`} attendu ; sinon, la restauration n'est pas effective.`,
            'Recharger l’application dans un onglet neuf et rejouer le parcours qui avait régressé.',
            'Vérifier Santé Globale (aucune ligne rouge nouvelle) et le journal des erreurs.',
            'Consigner le résultat dans l’ordre de restauration (vert ou rouge), puis dans la mémoire vivante.',
        ],
    };
}

// ─── Verdict après restauration ──────────────────────────────────────────

export type VerdictRestauration = { verdict: Verdict | 'blanc'; message: string };

export function verdictRestauration(cible: VersionStable, servie: IdentificationServie): VerdictRestauration {
    switch (servie.etat) {
        case 'injoignable':
            return { verdict: 'rouge', message: `${SITE_PRODUCTION.url} n'a pas répondu : aucun verdict possible.` };
        case 'identifiee':
            return servie.version.version === cible.version
                ? { verdict: 'vert', message: `${SITE_PRODUCTION.url} sert ${cible.version} (commit ${commitCourt(servie.commit)}${servie.source === 'bundle' ? `, identifiée par le bundle ${servie.bundle}` : ''}) : restauration effective.` }
                : { verdict: 'rouge', message: `${SITE_PRODUCTION.url} sert encore ${servie.version.version} (commit ${commitCourt(servie.commit)}), pas ${cible.version}.` };
        case 'declaree':
            return servie.version.version === cible.version
                ? { verdict: 'orange', message: `Le code servi se déclare ${cible.version} mais son commit (${commitCourt(servie.commit)}) n'est pas celui consigné (${commitCourt(cible.commit)}) : vérifier qu'il s'agit bien du déploiement voulu.` }
                : { verdict: 'rouge', message: `${SITE_PRODUCTION.url} sert encore ${servie.version.version}, pas ${cible.version}.` };
        case 'inconnue-du-registre':
            return { verdict: 'rouge', message: `Le serveur se déclare ${servie.versionDeclaree}, absente du registre : ce n'est pas ${cible.version}.` };
        case 'non-identifiable':
            return { verdict: 'blanc', message: `Version servie non identifiable (bundle ${servie.bundle ?? 'inconnu'}) : aucune conclusion — comparer le bundle au déploiement publié dans Netlify.` };
    }
}

// ─── Utilitaires d'affichage ─────────────────────────────────────────────

export function formaterUtc(iso: string | null): string {
    if (!iso) return 'date inconnue';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const p = (n: number) => String(n).padStart(2, '0');
    return `${p(d.getUTCDate())}/${p(d.getUTCMonth() + 1)}/${d.getUTCFullYear()} à ${p(d.getUTCHours())}:${p(d.getUTCMinutes())} UTC`;
}
