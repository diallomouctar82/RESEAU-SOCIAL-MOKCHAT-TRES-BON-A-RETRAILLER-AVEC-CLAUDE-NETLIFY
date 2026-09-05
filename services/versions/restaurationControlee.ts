/**
 * RESTAURATION CONTRÔLÉE — entrées-sorties.
 *
 * Trois responsabilités, toutes honnêtes sur ce qu'elles savent :
 *   1. lire ce que le serveur SERT maintenant (`/version.json` sans cache,
 *      puis la page d'accueil pour le bundle) ;
 *   2. dire ce que CET onglet exécute (`__MOKNET_BUILD__` injecté au build,
 *      bundle lu dans le document) ;
 *   3. tenir le journal des ordres de restauration : réglage partagé de la
 *      plateforme (`platform_settings`, clé `restauration_versions`, écrit par
 *      un administrateur, lu par tous les administrateurs), doublé d'une copie
 *      locale et d'une ligne dans le journal d'audit de la console.
 *
 * Ce module ne bascule PAS la production : aucun secret Netlify ou GitHub ne
 * vit dans le navigateur, par conception. Il prépare, trace et vérifie ;
 * l'acte de publication reste manuel, nominatif et suit la procédure fournie.
 */
import { adminConfigService } from '../adminConfigService';
import { supabaseService } from '../supabaseClient';
import { extractEntryBundle, runningEntryBundle } from '../updateWatch';
import type { IdentificationServie, LectureProduction, PreControle, Verdict, VersionJson, VersionStable } from './stableVersions';
import { commitCourt, versionServie } from './stableVersions';

export const CLE_REGLAGE_RESTAURATIONS = 'restauration_versions';
const CLE_LOCALE_RESTAURATIONS = 'moknet_restauration_versions_v1';
const MAX_ORDRES = 50;

// ─── Ce que cet onglet exécute ───────────────────────────────────────────

/** Informations de build de l'onglet courant ; `null` en développement ou au banc. */
export function infoBuildCourant(): VersionJson | null {
    try {
        const b = typeof __MOKNET_BUILD__ !== 'undefined' ? __MOKNET_BUILD__ : null;
        if (!b || typeof b !== 'object' || typeof b.version !== 'string') return null;
        return { ...b, bundle: b.bundle ?? runningEntryBundle() };
    } catch {
        return null;
    }
}

// ─── Ce que le serveur sert ──────────────────────────────────────────────

function estVersionJson(x: unknown): x is VersionJson {
    if (!x || typeof x !== 'object') return false;
    const o = x as Record<string, unknown>;
    return typeof o.version === 'string' && typeof o.construitLe === 'string'
        && (o.commit === null || typeof o.commit === 'string')
        && (o.deployId === null || typeof o.deployId === 'string');
}

export interface LectureProductionDatee extends LectureProduction {
    /** Heure de la lecture, ISO 8601. */
    luLe: string;
}

/**
 * Adresse relue à chaque fois : le service worker de MokNet (`public/sw.js`)
 * sert « cache d'abord » toute requête GET de même origine hors navigation,
 * et `cache: 'no-store'` ne l'en empêche pas (`caches.match` ignore le mode
 * de cache). Une clé d'horodatage rend l'URL unique, donc réellement lue sur
 * le réseau ; Netlify ignore la requête pour servir le fichier. Coût : une
 * petite entrée de cache par lecture, à la main de l'Admin Général.
 */
export function urlSansCache(chemin: string, maintenant: () => Date = () => new Date()): string {
    return `${chemin}${chemin.includes('?') ? '&' : '?'}v=${maintenant().getTime()}`;
}

/**
 * Relit le serveur sans cache. `version.json` peut légitimement manquer
 * (déploiement antérieur à son introduction) : ce n'est pas une panne ;
 * `joignable` ne tombe à faux que si la page d'accueil elle-même ne répond
 * pas.
 */
export async function lireProductionServie(fetchImpl: typeof fetch = fetch, maintenant: () => Date = () => new Date()): Promise<LectureProductionDatee> {
    let versionJson: VersionJson | null = null;
    let bundle: string | null = null;
    let joignable = false;
    try {
        const r = await fetchImpl(urlSansCache('/version.json', maintenant), { cache: 'no-store', credentials: 'same-origin' });
        if (r.ok) {
            const ct = r.headers?.get?.('content-type') ?? '';
            // Une réécriture SPA renverrait la page HTML avec un 200 : ne pas la prendre pour du JSON.
            if (!ct || /json/i.test(ct)) {
                const brut: unknown = await r.json().catch(() => null);
                if (estVersionJson(brut)) { versionJson = brut; joignable = true; }
            }
        }
    } catch { /* absence ou panne : tranché ci-dessous par la page d'accueil */ }
    try {
        const r = await fetchImpl(urlSansCache('/', maintenant), { cache: 'no-store', credentials: 'same-origin' });
        if (r.ok) {
            joignable = true;
            bundle = extractEntryBundle(await r.text());
        }
    } catch { /* injoignable */ }
    return { versionJson, bundle, joignable, luLe: maintenant().toISOString() };
}

// ─── Journal des ordres de restauration ──────────────────────────────────

export interface AuteurOrdre {
    nom: string;
    email: string | null;
    id: string | null;
}

export interface EtatServiResume {
    version: string | null;
    commit: string | null;
    bundle: string | null;
    etat: IdentificationServie['etat'];
}

export interface OrdreRestauration {
    id: string;
    creeLe: string;
    par: AuteurOrdre;
    cible: { version: string; commit: string | null; bundle: string | null; pr: number | null; dec: string };
    servieAvant: EtatServiResume;
    motif: string;
    preControles: Array<{ id: string; verdict: Verdict }>;
    orangesReconnus: boolean;
    statut: 'ordonne' | 'verifie-vert' | 'verifie-orange' | 'verifie-rouge';
    verification?: { le: string; message: string; servie: EtatServiResume };
}

export function resumerServie(id: IdentificationServie): EtatServiResume {
    const v = versionServie(id);
    return {
        version: v?.version ?? (id.etat === 'inconnue-du-registre' ? id.versionDeclaree : null),
        commit: 'commit' in id ? id.commit : null,
        bundle: 'bundle' in id ? id.bundle : null,
        etat: id.etat,
    };
}

export interface JournalRestaurations {
    charger(): Promise<{ ordres: OrdreRestauration[]; partage: boolean }>;
    enregistrer(ordre: OrdreRestauration): Promise<{ partage: boolean }>;
    marquerVerification(ordreId: string, verification: NonNullable<OrdreRestauration['verification']>, statut: OrdreRestauration['statut']): Promise<{ partage: boolean; ordre: OrdreRestauration | null }>;
}

function lireLocal(): OrdreRestauration[] {
    try {
        const brut = localStorage.getItem(CLE_LOCALE_RESTAURATIONS);
        const x = brut ? JSON.parse(brut) : null;
        return Array.isArray(x) ? (x as OrdreRestauration[]) : [];
    } catch {
        return [];
    }
}

function ecrireLocal(ordres: OrdreRestauration[]): void {
    try { localStorage.setItem(CLE_LOCALE_RESTAURATIONS, JSON.stringify(ordres)); } catch { /* stockage indisponible */ }
}

function fusionner(partages: OrdreRestauration[], locaux: OrdreRestauration[]): OrdreRestauration[] {
    const parId = new Map<string, OrdreRestauration>();
    for (const o of [...locaux, ...partages]) parId.set(o.id, o); // le partagé, plus récent en général, gagne
    return [...parId.values()].sort((a, b) => (a.creeLe < b.creeLe ? 1 : a.creeLe > b.creeLe ? -1 : 0)).slice(0, MAX_ORDRES);
}

/** Journal réel : réglage partagé Supabase + copie locale + journal d'audit de la console. */
export const journalRestaurations: JournalRestaurations = {
    async charger() {
        const partage = await supabaseService.loadPlatformSetting<{ ordres?: OrdreRestauration[] }>(CLE_REGLAGE_RESTAURATIONS).catch(() => null);
        const distants = Array.isArray(partage?.value?.ordres) ? partage!.value.ordres! : [];
        return { ordres: fusionner(distants, lireLocal()), partage: partage !== null };
    },
    async enregistrer(ordre) {
        const { ordres } = await this.charger();
        const suivant = fusionner([ordre], ordres);
        ecrireLocal(suivant);
        const partage = await supabaseService.savePlatformSetting(CLE_REGLAGE_RESTAURATIONS, { ordres: suivant }).catch(() => false);
        adminConfigService.addLog(
            'security',
            'admin',
            `ORDRE DE RESTAURATION ${ordre.id} : revenir à ${ordre.cible.version} (commit ${commitCourt(ordre.cible.commit)}, PR #${ordre.cible.pr ?? '?'}) — servie avant : ${ordre.servieAvant.version ?? 'non identifiée'} — motif : ${ordre.motif}${partage ? '' : ' — journal partagé indisponible, copie locale seule'}`,
            ordre.par.nom,
            { ordreId: ordre.id, cible: ordre.cible.version, servieAvant: ordre.servieAvant.version, partage },
        );
        return { partage };
    },
    async marquerVerification(ordreId, verification, statut) {
        const { ordres } = await this.charger();
        const idx = ordres.findIndex((o) => o.id === ordreId);
        if (idx < 0) return { partage: false, ordre: null };
        const maj: OrdreRestauration = { ...ordres[idx], statut, verification };
        const suivant = [...ordres];
        suivant[idx] = maj;
        ecrireLocal(suivant);
        const partage = await supabaseService.savePlatformSetting(CLE_REGLAGE_RESTAURATIONS, { ordres: suivant }).catch(() => false);
        adminConfigService.addLog(
            statut === 'verifie-vert' ? 'info' : 'warning',
            'admin',
            `VÉRIFICATION DE RESTAURATION ${ordreId} (${maj.cible.version}) : ${verification.message}`,
            maj.par.nom,
            { ordreId, statut, partage },
        );
        return { partage, ordre: maj };
    },
};

/** Identifiant lisible et unique : `RST-20260905-1934-x7k2`. */
export function nouvelIdOrdre(maintenant: Date = new Date(), alea: () => string = () => Math.random().toString(36).slice(2, 6)): string {
    const p = (n: number) => String(n).padStart(2, '0');
    return `RST-${maintenant.getUTCFullYear()}${p(maintenant.getUTCMonth() + 1)}${p(maintenant.getUTCDate())}-${p(maintenant.getUTCHours())}${p(maintenant.getUTCMinutes())}-${alea()}`;
}

export function construireOrdre(params: {
    id: string;
    creeLe: string;
    par: AuteurOrdre;
    cible: VersionStable;
    servie: IdentificationServie;
    motif: string;
    controles: PreControle[];
    orangesReconnus: boolean;
}): OrdreRestauration {
    const { id, creeLe, par, cible, servie, motif, controles, orangesReconnus } = params;
    return {
        id,
        creeLe,
        par,
        cible: { version: cible.version, commit: cible.commit, bundle: cible.bundle, pr: cible.pr, dec: cible.dec },
        servieAvant: resumerServie(servie),
        motif: motif.trim(),
        preControles: controles.map((c) => ({ id: c.id, verdict: c.verdict })),
        orangesReconnus,
        statut: 'ordonne',
    };
}
