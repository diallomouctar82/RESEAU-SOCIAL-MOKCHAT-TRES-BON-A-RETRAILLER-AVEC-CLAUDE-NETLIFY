// SAT-3 — Le refus du serveur, tel qu'il doit arriver JUSQU'À L'ÉCRAN.
//
// SAT-2 a fermé la porte côté serveur : un direct plein rend un 409 qui porte
// `code: 'live_full'` ET les chiffres réels. Mais `supabase.functions.invoke`
// aplatit tout échec HTTP en une seule phrase générique — « Edge Function
// returned a non-2xx status code » — et le corps de la réponse n'est plus
// accessible que par `error.context` (l'objet `Response`).
//
// Sans cette lecture, le refus arrivait à l'écran comme une panne indistincte,
// et l'écran affichait « Connexion au direct… » en boucle : la personne attend
// indéfiniment une place qui ne viendra jamais. C'est très exactement ce que
// SAT-3 doit supprimer.
//
// Ce fichier ne contient QUE la décision — pas de Supabase, pas de réseau, pas
// de React. Il est donc importable tel quel par la suite de tests : la règle
// est vérifiée pour de vrai au lieu d'être cherchée dans le texte d'un fichier.

/** Refus NOMMÉ du serveur de jetons, reconstitué depuis le corps de la réponse. */
export interface LiveAccessRefusal {
    /** Code machine tel que la fonction Edge l'a écrit (`live_full`, `transport_unconfigured`…). */
    code: string;
    /**
     * Phrase du SERVEUR, destinée à un humain. Chaîne vide quand il n'en a pas
     * rédigé — jamais remplacée ici par une phrase inventée : c'est l'appelant
     * qui choisit son repli, en toute connaissance de cause.
     */
    message: string;
    /** Places réellement occupées à l'instant du refus. Absent si le serveur ne l'a pas dit. */
    occupied?: number;
    /** Capacité de la room au même instant. Absent si le serveur ne l'a pas dit. */
    capacity?: number;
}

/** Le code que SAT-2 renvoie quand un direct est plein. */
export const LIVE_FULL_CODE = 'live_full';

/** Un compteur ne compte que s'il est fini et positif ou nul — sinon il n'existe pas. */
function compteur(value: unknown): number | undefined {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return undefined;
    return Math.trunc(value);
}

/**
 * Reconstitue le refus depuis le corps JSON déjà lu.
 *
 * Rend `null` dès que le corps ne porte pas de `code` : un échec sans code
 * n'est PAS un refus nommé (panne réseau, 500, HTML d'une passerelle) et doit
 * continuer à suivre le chemin d'erreur générique. Ne jamais transformer une
 * panne en « direct complet » — ce serait mentir dans l'autre sens.
 */
export function readLiveRefusal(body: unknown): LiveAccessRefusal | null {
    if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
    const raw = body as Record<string, unknown>;
    const code = typeof raw.code === 'string' ? raw.code.trim() : '';
    if (!code) return null;
    const refusal: LiveAccessRefusal = {
        code,
        message: typeof raw.error === 'string' ? raw.error.trim() : '',
    };
    const occupied = compteur(raw.occupied);
    const capacity = compteur(raw.capacity);
    if (occupied !== undefined) refusal.occupied = occupied;
    if (capacity !== undefined) refusal.capacity = capacity;
    return refusal;
}

/**
 * Échec de `fetchLiveKitToken` qui porte un refus NOMMÉ.
 *
 * Reste une `Error` ordinaire : tout code existant qui lit `err.message`
 * continue de fonctionner sans savoir que ce type existe.
 */
export class LiveAccessError extends Error {
    readonly refusal: LiveAccessRefusal;

    constructor(refusal: LiveAccessRefusal, fallbackMessage: string) {
        super(refusal.message || fallbackMessage);
        this.name = 'LiveAccessError';
        this.refusal = refusal;
    }
}

/** Ce refus est-il « le direct est plein » ? */
export function isLiveFull(refusal: LiveAccessRefusal | null | undefined): boolean {
    return refusal?.code === LIVE_FULL_CODE;
}

/**
 * Les chiffres que l'écran a le DROIT d'afficher.
 *
 * `null` tant que le serveur n'a pas donné les DEUX : « 12 personnes » sur un
 * total inconnu ne veut rien dire, et une capacité nulle ou absurde ne se
 * montre pas. L'écran doit alors dire « complet » sans chiffre plutôt que
 * d'inventer — un chiffre faux serait pire que pas de chiffre, et c'est
 * exactement la discipline appliquée partout ailleurs dans cette mission.
 */
export function liveFullOccupancy(
    refusal: LiveAccessRefusal | null | undefined,
): { occupied: number; capacity: number } | null {
    if (!isLiveFull(refusal)) return null;
    const { occupied, capacity } = refusal as LiveAccessRefusal;
    if (occupied === undefined || capacity === undefined || capacity <= 0) return null;
    return { occupied, capacity };
}
