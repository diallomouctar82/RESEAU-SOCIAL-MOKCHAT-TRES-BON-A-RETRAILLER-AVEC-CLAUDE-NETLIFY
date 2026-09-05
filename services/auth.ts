
import { isAuthApiError } from '@supabase/supabase-js';
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { setRememberMe, supabase } from './supabaseClient';

/**
 * Connexion Google — identité minimale uniquement (email/profil). Ne demande
 * jamais les scopes Google Workspace (Drive/Chat/Meet) : voir
 * services/googleWorkspaceLink.ts pour ce flux séparé et optionnel.
 *
 * Architecture volontairement extensible : chaque provider OAuth
 * supplémentaire (Facebook, Apple, Microsoft...) n'est qu'un appel de plus
 * à supabase.auth.signInWithOAuth({ provider }) — aucune autre pièce du
 * système (trigger de création de profil, session, RLS) n'a besoin de
 * changer pour les accueillir.
 */
export const signInWithOAuthProvider = async (
    provider: 'google' | 'facebook' | 'apple' | 'azure',
    rememberMe = true
): Promise<void> => {
    setRememberMe(rememberMe);
    const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: window.location.origin },
    });
    if (error) throw error;
};

export const signInWithGoogle = (rememberMe = true): Promise<void> =>
    signInWithOAuthProvider('google', rememberMe);

/**
 * Inscription email + mot de passe. Si la confirmation d'email est activée
 * côté Supabase (comportement par défaut), `data.session` revient `null` —
 * l'appelant doit alors afficher un écran "vérifie ta boîte mail" plutôt que
 * de considérer l'utilisateur connecté.
 */
export const signUpWithEmail = async (
    email: string,
    password: string
): Promise<{ session: Session | null; needsEmailConfirmation: boolean }> => {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return { session: data.session, needsEmailConfirmation: data.session === null };
};

export const signInWithEmail = async (
    email: string,
    password: string,
    rememberMe = true
): Promise<void> => {
    setRememberMe(rememberMe);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
};

export const resendConfirmationEmail = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
};

/** Envoie le lien de réinitialisation. Le lien ramène sur l'app avec un événement PASSWORD_RECOVERY. */
export const sendPasswordResetEmail = async (email: string): Promise<void> => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
    });
    if (error) throw error;
};

/** À appeler uniquement depuis l'écran affiché après un événement PASSWORD_RECOVERY. */
export const updatePassword = async (newPassword: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
};

export const signOut = async (): Promise<void> => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
};

export const getSession = async (): Promise<Session | null> => {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
        console.error('Erreur récupération session Supabase:', error);
        return null;
    }
    return data.session;
};

/**
 * VERROU D'ENTRÉE — session relue depuis le stockage local, vérifiée auprès du
 * serveur avant d'ouvrir l'interface (Direction, 05/09/2026, DEC-2026-079).
 *
 * `getSession()` ne fait que relire ce que l'appareil a gardé : un jeton
 * périmé côté serveur, révoqué, forgé, ou celui d'un compte supprimé ou banni
 * passe cette relecture tant que sa date locale d'expiration n'est pas
 * atteinte. Jusqu'ici, l'application ouvrait alors l'interface interne — et
 * l'ouvrait AUSSI quand le chargement du profil échouait (« Local-First »).
 * Ici, le serveur d'authentification tranche (`GET /auth/v1/user` avec ce
 * jeton) :
 *   • `valide`        → l'utilisateur existe et le jeton est accepté ;
 *   • `invalide`      → refus du serveur (401/403, compte absent) : la session
 *                       locale est effacée, l'écran de connexion s'impose ;
 *   • `non-verifiee`  → aucun verdict du serveur (panne réseau, 5xx, 429,
 *                       réponse non JSON d'un intermédiaire, délai dépassé) :
 *                       la session locale non expirée est conservée, tolérance
 *                       DITE pour un réseau mobile capricieux — elle ne vaut
 *                       jamais pour un jeton que le serveur a refusé.
 * Le verdict est attaché au JETON, jamais à l'événement qui apporte la
 * session : supabase-js rejoue en `SIGNED_IN` la session lue dans le stockage
 * (initialisation, retour sur l'onglet, autre onglet) sans appel serveur —
 * `App.tsx` demande donc ce verdict pour tout jeton, une seule fois par jeton.
 */
export type VerdictSession =
    | { statut: 'valide'; session: Session }
    | { statut: 'non-verifiee'; session: Session; raison: string }
    | { statut: 'invalide'; raison: string };

/** Budget de la vérification : au-delà, la session est « non vérifiée », jamais « invalide ». */
export const DELAI_VERIFICATION_SESSION_MS = 8000;

/**
 * Efface la session de CET appareil sans dépendre de la réponse du serveur
 * (`scope: 'local'` : un 401/403/404 du serveur est ignoré par supabase-js,
 * la session locale part dans tous les cas). Ne lève jamais.
 */
const effacerSessionLocale = async (): Promise<void> => {
    try {
        await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
        console.warn('Effacement de la session locale : erreur ignorée', err);
    }
};

export const verifierSession = async (
    session: Session,
    delaiMs: number = DELAI_VERIFICATION_SESSION_MS
): Promise<VerdictSession> => {
    const jeton = session?.access_token;
    const idAttendu = session?.user?.id;
    if (!jeton || !idAttendu) {
        await effacerSessionLocale();
        return { statut: 'invalide', raison: 'session locale incomplète (jeton ou utilisateur absent)' };
    }
    let minuteur: ReturnType<typeof setTimeout> | undefined;
    const delai = new Promise<'delai'>((resolve) => {
        minuteur = setTimeout(() => resolve('delai'), delaiMs);
    });
    try {
        // Le jeton est passé explicitement : la vérification porte sur CE
        // jeton, sans verrou multi-onglets ni relecture du stockage.
        const requete = supabase.auth.getUser(jeton);
        // Si le délai gagne la course, la requête continue seule : son éventuel
        // rejet tardif est marqué comme géré (pas de « unhandledrejection »).
        void requete.catch(() => undefined);
        const resultat = await Promise.race([requete, delai]);
        if (resultat === 'delai') {
            return { statut: 'non-verifiee', session, raison: `serveur d'authentification sans réponse en ${delaiMs} ms` };
        }
        const { data, error } = resultat;
        if (error) {
            const motif: string = error.message;
            // Seul un refus JSON du serveur d'authentification lui-même vaut
            // « invalide » : 401 (jeton invalide ou périmé côté serveur), 403
            // (compte supprimé, banni, jeton interdit). Tout le reste — fetch
            // qui échoue, 5xx, 429, réponse HTML d'un portail captif ou d'un
            // proxy, erreur inconnue — n'est pas un verdict.
            if (isAuthApiError(error) && (error.status === 401 || error.status === 403)) {
                await effacerSessionLocale();
                return { statut: 'invalide', raison: `refus du serveur d'authentification (${error.status}) : ${motif}` };
            }
            return { statut: 'non-verifiee', session, raison: `serveur d'authentification sans verdict : ${motif}` };
        }
        if (!data?.user?.id || data.user.id !== idAttendu) {
            await effacerSessionLocale();
            return { statut: 'invalide', raison: 'le jeton ne correspond pas à l\'utilisateur de la session locale' };
        }
        return { statut: 'valide', session };
    } catch (err) {
        // supabase-js renvoie ses refus dans `error`, il ne les lève pas : une
        // exception ici est une panne d'exécution, pas un verdict du serveur.
        return { statut: 'non-verifiee', session, raison: `vérification interrompue : ${String(err)}` };
    } finally {
        if (minuteur !== undefined) clearTimeout(minuteur);
    }
};

/**
 * event distingue notamment PASSWORD_RECOVERY (l'utilisateur vient de
 * cliquer un lien de réinitialisation — afficher l'écran "nouveau mot de
 * passe", pas connecter normalement) des connexions/déconnexions standard.
 */
export const onAuthStateChange = (
    callback: (session: Session | null, event: AuthChangeEvent) => void
): (() => void) => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
        callback(session, event);
    });
    return () => data.subscription.unsubscribe();
};

export type { AuthChangeEvent, Session, User };
