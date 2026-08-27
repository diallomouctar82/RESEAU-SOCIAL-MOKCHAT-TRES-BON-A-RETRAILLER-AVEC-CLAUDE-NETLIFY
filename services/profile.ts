import { getSupabaseClient, isSupabaseConfigured, isUuid } from './supabaseClient';
import type { UserProfile } from '../types';

/**
 * Loads the current Auth user's application profile. The server trigger is
 * the only creator of `profiles`; the browser never races it with an upsert.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!isSupabaseConfigured || !isUuid(userId)) return null;
    const client = getSupabaseClient();
    const [profileResult, skillsResult, badgesResult] = await Promise.all([
        client.from('profiles').select('*').eq('id', userId).maybeSingle(),
        client.from('profile_skills').select('name, progress').eq('profile_id', userId),
        client.from('profile_badges').select('id, badge_key, name, icon, description').eq('profile_id', userId),
    ]);

    const profile = profileResult.data as any;
    if (profileResult.error || !profile) {
        console.error('Erreur chargement profil Supabase:', profileResult.error);
        return null;
    }

    const skills = (skillsResult.data || []) as Array<{ name: string; progress: number }>;
    const badges = (badgesResult.data || []) as Array<{
        id: string;
        badge_key: string;
        name: string;
        icon: string | null;
        description: string | null;
    }>;

    return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        title: profile.title || undefined,
        bio: profile.bio || undefined,
        country: profile.country || undefined,
        city: profile.city || undefined,
        phone: profile.phone || undefined,
        website: profile.website || undefined,
        role: profile.role === 'admin' || profile.role === 'super_admin' ? 'admin' : 'user',
        citizenshipId: profile.citizenship_id || '',
        level: profile.level ?? 1,
        xp: profile.xp ?? 0,
        nextLevelXp: profile.next_level_xp ?? 1000,
        credits: Number(profile.credits ?? 0),
        avatarUrl: profile.avatar_url || '',
        preferredLanguage: profile.preferred_language || 'fr',
        twoFactorEnabled: Boolean(profile.two_factor_enabled),
        isVerified: Boolean(profile.is_verified),
        followersCount: profile.followers_count ?? 0,
        followingCount: profile.following_count ?? 0,
        skills,
        badges: badges.map((badge) => ({
            id: badge.id,
            name: badge.name,
            icon: badge.icon || '',
            description: badge.description || '',
        })),
        interests: Array.isArray(profile.interests) ? profile.interests : [],
    };
};
