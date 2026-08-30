import { supabaseService } from '../supabaseClient';
import { registerCapabilityHandlers, type CapabilityHandler } from './capabilityBus';

/**
 * Handler réel de la capacité Recherche, porté par l'Architecte lui-même.
 *
 * `search.universal.search` était la DERNIÈRE capacité du registre sans
 * handler (41/42) — un défaut relevé par l'audit du 30/08/2026 : la commande
 * de découverte annonçait « la recherche dans MokNet (profils, publications,
 * cours) » alors qu'aucune exécution n'existait. Une capacité annoncée mais
 * inexécutable est exactement la fausse promesse que ce dépôt interdit.
 *
 * Comme les domaines Tâches et Paramètres, la recherche n'a besoin d'AUCUN
 * état d'écran : elle appelle `universalSearch` (RPC `search_universal`,
 * LOOP 11/17 — accent-insensible, RLS de l'appelant appliquée normalement).
 * Elle est donc disponible partout, y compris depuis la barre vocale.
 *
 * Honnêteté du résultat, trois cas distincts jamais confondus :
 *   - échec réseau/RPC (`degraded`)  → `ok: false`, la recherche n'a PAS eu lieu ;
 *   - zéro correspondance            → `ok: true`, réponse réelle « rien trouvé » ;
 *   - correspondances                → `ok: true`, les premières listées par nom.
 */

const TYPE_LABELS: Record<string, string> = {
    profile: 'profil',
    post: 'publication',
    course: 'cours',
};

function extractQuery(params: any): string {
    if (typeof params === 'string') return params.trim();
    const candidate = params?.query ?? params?.searchQuery ?? params?.term ?? params?.q ?? '';
    return typeof candidate === 'string' ? candidate.trim() : '';
}

export function buildSearchCapabilityHandlers(): Record<string, CapabilityHandler> {
    return {
        'search.universal.search': async (params) => {
            const query = extractQuery(params);
            if (query.length < 2) {
                return { ok: false, message: "Dites-moi quoi chercher (au moins deux caractères)." };
            }

            const { results, degraded } = await supabaseService.universalSearch(query);
            if (degraded) {
                // La RPC a échoué : ne jamais confondre « la recherche n'a pas
                // pu aboutir » avec un vrai zéro résultat.
                return { ok: false, message: `La recherche « ${query} » n'a pas pu aboutir (problème de connexion). Réessayez.` };
            }
            if (results.length === 0) {
                return { ok: true, message: `Aucun résultat pour « ${query} » dans les profils, publications et cours.`, data: { query, results } };
            }

            const shown = results.slice(0, 5);
            const listing = shown
                .map((r) => `${TYPE_LABELS[r.type] || r.type} : ${r.title}${r.subtitle ? ` (${r.subtitle})` : ''}`)
                .join(' ; ');
            const suffix = results.length > shown.length ? ` — et ${results.length - shown.length} autre(s)` : '';
            return {
                ok: true,
                message: `${results.length} résultat(s) pour « ${query} » : ${listing}${suffix}.`,
                data: { query, results },
            };
        },
    };
}

/**
 * Enregistrement global (aucun contexte de rôle : lecture seule, RLS de la
 * session de l'appelant). Renvoie la fonction de retrait, à retourner depuis
 * un `useEffect` comme pour les domaines Tâches et Paramètres.
 */
export function registerSearchCapabilities(): () => void {
    return registerCapabilityHandlers(buildSearchCapabilityHandlers());
}
