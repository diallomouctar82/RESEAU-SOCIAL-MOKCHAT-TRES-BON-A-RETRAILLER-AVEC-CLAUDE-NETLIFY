
import type { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { setRememberMe, supabase } from './supabaseClient';
import { rememberDeepLink } from './navigation/deepLink';

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
    // `redirectTo` ramène sur la RACINE : le hash ne survit pas à l'aller-retour
    // chez le fournisseur. Quelqu'un venu de `…/#super-admin/sante` atterrirait
    // sur l'onglet par défaut. On met donc la route de côté avant de partir ;
    // deepLink.ts la reprend au retour, uniquement si l'URL n'en porte aucune.
    rememberDeepLink();
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
