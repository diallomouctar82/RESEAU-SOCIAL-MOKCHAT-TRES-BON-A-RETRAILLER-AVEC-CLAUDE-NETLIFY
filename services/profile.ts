
import { supabase } from './supabaseClient';
import { UserProfile } from '../types';

/**
 * Charge le profil applicatif (table `profiles` + compétences/badges) pour un
 * utilisateur Supabase Auth déjà authentifié. La ligne `profiles` est
 * garantie exister (créée par le trigger serveur handle_new_user au moment
 * de l'inscription, dans la même transaction que auth.users) — aucune race
 * condition possible entre la connexion et ce fetch.
 *
 * Ne fabrique jamais de profil de repli : un échec de chargement doit rester
 * un échec visible (voir App.tsx), jamais une session/des crédits inventés.
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
        bio: profile.bio || undefined,
        role: profile.role,
        citizenshipId: profile.citizenship_id || '',
        country: profile.country || undefined,
        city: profile.city || undefined,
        phone: profile.phone || undefined,
        website: profile.website || undefined,
        level: profile.level,
        xp: profile.xp,
        nextLevelXp: profile.next_level_xp,
        credits: Number(profile.credits),
        avatarUrl: profile.avatar_url || '',
        preferredLanguage: profile.preferred_language,
        twoFactorEnabled: profile.two_factor_enabled,
        isVerified: profile.is_verified ?? false,
        followersCount: profile.followers_count ?? undefined,
        followingCount: profile.following_count ?? undefined,
        skills: skills || [],
        badges: (badges || []).map((b) => ({ id: b.id, name: b.name, icon: b.icon || '', description: b.description || '' })),
        interests: profile.interests || [],
        privacySettings: profile.privacy_settings || {
            profileVisibility: 'public',
            allowMessagesFrom: 'all',
            showOnlineStatus: true,
            allowTagging: true,
            showActivityFeed: true,
            allowFriendRequestsFrom: 'all',
            showFollowersList: true,
            showFollowingList: true
        },
    };
};
