
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

/**
 * Charge le profil applicatif (table `profiles` + compétences/badges)
 * pour un utilisateur Supabase Auth déjà authentifié. La ligne `profiles`
 * est garantie exister (créée par le trigger serveur handle_new_user au
 * moment de l'inscription, dans la même transaction que auth.users) —
 * aucune race condition possible entre la connexion et ce fetch.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    const [{ data: profile, error: profileError }, { data: skills }, { data: badges }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).single(),
        supabase.from('profile_skills').select('name, progress').eq('profile_id', userId),
        supabase.from('profile_badges').select('id, badge_key, name, icon, description').eq('profile_id', userId),
    ]);

    if (profileError || !profile) {
        console.error('Erreur chargement profil Supabase:', profileError);
        return null;
    }

    return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        title: profile.title || undefined,
        role: profile.role,
        citizenshipId: profile.citizenship_id || '',
        level: profile.level,
        xp: profile.xp,
        nextLevelXp: profile.next_level_xp,
        credits: Number(profile.credits),
        avatarUrl: profile.avatar_url || '',
        preferredLanguage: profile.preferred_language,
        twoFactorEnabled: profile.two_factor_enabled,
        skills: skills || [],
        badges: (badges || []).map((b) => ({ id: b.id, name: b.name, icon: b.icon || '', description: b.description || '' })),
        interests: profile.interests || [],
    };
};
