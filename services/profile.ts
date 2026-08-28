
import { isUuid, supabase } from './supabaseClient';
import { UserProfile } from '../types';
import type { Json } from './database.types';

/**
 * Charge le profil applicatif (table `profiles` + compétences/badges)
 * pour un utilisateur Supabase Auth déjà authentifié. La ligne `profiles`
 * est garantie exister (créée par le trigger serveur handle_new_user au
 * moment de l'inscription, dans la même transaction que auth.users) —
 * aucune race condition possible entre la connexion et ce fetch.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!isUuid(userId)) return null;
    const [{ data: profile, error: profileError }, { data: skills }, { data: badges }] = await Promise.all([
        supabase
            .from('profiles')
            .select('id,email,name,title,bio,role,status,citizenship_id,level,xp,next_level_xp,credits,avatar_url,preferred_language,two_factor_enabled,interests,country,city,phone,website,is_verified,followers_count,following_count,created_at')
            .eq('id', userId)
            .maybeSingle(),
        supabase.from('profile_skills').select('name, progress').eq('profile_id', userId),
        supabase.from('profile_badges').select('id, badge_key, name, icon, description').eq('profile_id', userId),
    ]);

    if (profileError || !profile) {
        console.error('Erreur chargement profil Supabase:', profileError);
        return null;
    }

    const allowedRoles = ['user', 'admin', 'expert', 'mentor', 'moderator', 'organization', 'super_admin'] as const;
    type AllowedRole = typeof allowedRoles[number];
    const role: AllowedRole = allowedRoles.includes(profile.role as AllowedRole)
        ? profile.role as AllowedRole
        : 'user';
    const allowedStatuses = ['active', 'pending', 'suspended'] as const;
    type AllowedStatus = typeof allowedStatuses[number];
    const accountStatus: AllowedStatus = allowedStatuses.includes(profile.status as AllowedStatus)
        ? profile.status as AllowedStatus
        : 'active';

    return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        title: profile.title || undefined,
        bio: profile.bio || undefined,
        country: profile.country || undefined,
        city: profile.city || undefined,
        location: [profile.city, profile.country].filter(Boolean).join(', ') || undefined,
        phone: profile.phone || undefined,
        website: profile.website || undefined,
        role,
        accountStatus,
        citizenshipId: profile.citizenship_id || '',
        level: Number(profile.level || 1),
        xp: Number(profile.xp || 0),
        nextLevelXp: Number(profile.next_level_xp || 500),
        credits: Number(profile.credits || 0),
        avatarUrl: profile.avatar_url || '',
        preferredLanguage: profile.preferred_language || 'fr',
        twoFactorEnabled: profile.two_factor_enabled === true,
        isVerified: profile.is_verified === true,
        followersCount: Number(profile.followers_count || 0),
        followingCount: Number(profile.following_count || 0),
        joinedDate: profile.created_at || undefined,
        skills: skills || [],
        badges: (badges || []).map((b) => ({ id: b.id, name: b.name, icon: b.icon || '', description: b.description || '' })),
        interests: profile.interests || [],
    };
};

const OWN_PROFILE_FIELDS = [
    'name',
    'title',
    'bio',
    'country',
    'city',
    'phone',
    'website',
    'avatar_url',
    'preferred_language',
    'interests'
] as const;

/**
 * Met à jour uniquement les champs éditables par le titulaire. Les rôles,
 * permissions, crédits, XP et niveaux sont volontairement exclus du contrat
 * navigateur et restent gérés par des opérations serveur auditées.
 */
export const updateOwnProfile = async (userId: string, values: Record<string, unknown>): Promise<void> => {
    if (!isUuid(userId)) throw new Error('Invalid profile identifier.');
    const safeValues = Object.fromEntries(
        OWN_PROFILE_FIELDS
            .filter((field) => values[field] !== undefined)
            .map((field) => [field, values[field]])
    );
    if (Object.keys(safeValues).length === 0) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) throw new Error('Session profile mismatch.');
    const { error } = await supabase.rpc('update_my_profile', { p_changes: safeValues as Json });
    if (error) throw error;
};
