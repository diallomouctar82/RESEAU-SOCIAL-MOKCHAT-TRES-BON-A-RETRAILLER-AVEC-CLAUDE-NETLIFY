// Résolution des liens des guides d'action manuelle.
//
// Un guide dit « Supabase → SQL Editor » et pointe vers `{supabase}/sql/new` ;
// c'est ici que `{supabase}` devient la console du projet RÉELLEMENT servi
// (déduite de l'URL Supabase de l'application, jamais écrite en dur) et que
// `{repo}` devient le dépôt GitHub. Fonctions pures : testables sans
// navigateur.

/** Dépôt GitHub de l'application — l'endroit exact où vivent les fichiers cités par les guides. */
export const REPO_URL = 'https://github.com/diallomouctar82/RESEAU-SOCIAL-MOKCHAT-TRES-BON-A-RETRAILLER-AVEC-CLAUDE-NETLIFY';

/**
 * Console Supabase du projet dont l'application se sert. `null` quand l'URL
 * Supabase n'a pas la forme attendue (`https://<ref>.supabase.co`) — on ne
 * fabrique pas de lien vers un projet inventé.
 */
export function supabaseDashboardUrl(supabaseUrl: string | undefined | null): string | null {
    if (!supabaseUrl) return null;
    try {
        const host = new URL(supabaseUrl).hostname;
        const match = /^([a-z0-9]{20})\.supabase\.co$/i.exec(host);
        return match ? `https://supabase.com/dashboard/project/${match[1]}` : null;
    } catch {
        return null;
    }
}

/**
 * Résout un lien de guide. Renvoie `null` si le lien dépend d'une console
 * inconnue : l'interface affiche alors le chemin en clair sans bouton, plutôt
 * qu'un bouton vers nulle part.
 */
export function resolveGuideUrl(
    url: string | undefined,
    options: { supabaseUrl?: string | null },
): string | null {
    if (!url) return null;
    if (url.startsWith('{repo}')) return REPO_URL + url.slice('{repo}'.length);
    if (url.startsWith('{supabase}')) {
        const base = supabaseDashboardUrl(options.supabaseUrl);
        return base ? base + url.slice('{supabase}'.length) : null;
    }
    return /^https:\/\//.test(url) ? url : null;
}
