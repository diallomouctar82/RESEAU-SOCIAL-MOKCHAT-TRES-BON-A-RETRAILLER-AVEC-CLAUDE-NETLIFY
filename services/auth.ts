
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

/**
 * Connexion — identité minimale uniquement (email/profil). Ne demande
 * jamais les scopes Google Workspace (Drive/Chat/Meet) : voir
 * services/googleWorkspaceLink.ts pour ce flux séparé et optionnel.
 */
export const signInWithGoogle = async (): Promise<void> => {
    const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: window.location.origin,
        },
    });
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

export const onAuthStateChange = (callback: (session: Session | null) => void): (() => void) => {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        callback(session);
    });
    return () => data.subscription.unsubscribe();
};

export type { Session, User };
