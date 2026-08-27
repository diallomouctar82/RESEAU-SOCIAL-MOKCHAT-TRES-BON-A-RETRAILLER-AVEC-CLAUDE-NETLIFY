
import { supabase, isSupabaseConfigured, supabaseService } from './supabaseClient';
import { UserProfile } from '../types';
import { USER_PROFILE } from '../constants';

/**
 * Charge le profil applicatif (table `profiles` + compétences/badges)
 * pour un utilisateur authentifié avec repli automatique et auto-création si nécessaire.
 */
export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!userId) return null;

    if (isSupabaseConfigured) {
        try {
            const [{ data: profile, error: profileError }, { data: skills }, { data: badges }] = await Promise.all([
                supabase.from('profiles').select('*').eq('id', userId).single(),
                supabase.from('profile_skills').select('name, progress').eq('profile_id', userId),
                supabase.from('profile_badges').select('id, badge_key, name, icon, description').eq('profile_id', userId),
            ]);

            if (profile && !profileError) {
                return {
                    id: profile.id,
                    email: profile.email,
                    name: profile.name,
                    title: profile.title || undefined,
                    role: profile.role === 'admin' || profile.role === 'super_admin' ? 'admin' : 'user',
                    citizenshipId: profile.citizenship_id || `LMAV-GN-2026-${userId.slice(0, 4)}`,
                    country: profile.country || 'Guinée',
                    city: profile.city || '',
                    phone: profile.phone || '',
                    website: profile.website || '',
                    level: profile.level ?? 1,
                    xp: profile.xp ?? 100,
                    nextLevelXp: profile.next_level_xp ?? 1000,
                    credits: Number(profile.credits ?? 100),
                    avatarUrl: profile.avatar_url || '',
                    preferredLanguage: profile.preferred_language || 'fr',
                    twoFactorEnabled: profile.two_factor_enabled ?? false,
                    isVerified: profile.is_verified ?? false,
                    skills: skills && skills.length > 0 ? skills : USER_PROFILE.skills,
                    badges: badges && badges.length > 0 
                        ? badges.map((b) => ({ id: b.id, name: b.name, icon: b.icon || '🏅', description: b.description || '' }))
                        : USER_PROFILE.badges,
                    interests: profile.interests || ['Commerce', 'Tech', 'Éducation', 'Diplomatie'],
                };
            }
        } catch (err) {
            console.warn('Erreur chargement profil Supabase:', err);
        }
    }

    // Repli depuis le stockage local (session courante)
    try {
        const stored = localStorage.getItem('lmav_session_v2') || sessionStorage.getItem('lmav_session_v2');
        if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed && (parsed.id === userId || parsed.email)) {
                return {
                    ...USER_PROFILE,
                    ...parsed,
                    id: userId || parsed.id,
                };
            }
        }
    } catch {}

    // Profil citoyen par défaut si introuvable
    return {
        ...USER_PROFILE,
        id: userId,
        name: 'Citoyen Le Monde à Vous',
        citizenshipId: `LMAV-GN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
        level: 1,
        xp: 100,
        credits: 100,
    };
};

/**
 * Crée ou met à jour un profil complet
 */
export const createOrUpdateProfile = async (profileData: Partial<UserProfile> & { id: string; email: string; name: string }): Promise<UserProfile> => {
    const fullProfile: UserProfile = {
        ...USER_PROFILE,
        ...profileData,
        updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured) {
        try {
            await supabaseService.upsertProfile({
                id: profileData.id,
                email: profileData.email,
                name: profileData.name,
                title: profileData.title,
                bio: profileData.bio,
                role: (profileData.role === 'admin' || profileData.role === 'super_admin') ? 'admin' : 'citizen',
                country: profileData.country || 'Guinée',
                city: profileData.city,
                citizenship_id: profileData.citizenshipId,
                phone: profileData.phone,
                website: profileData.website,
                level: profileData.level ?? 1,
                xp: profileData.xp ?? 100,
                credits: profileData.credits ?? 100,
                avatar_url: profileData.avatarUrl,
                is_verified: profileData.isVerified ?? false,
                interests: profileData.interests || []
            });
        } catch (err) {
            console.warn('Erreur createOrUpdateProfile Supabase:', err);
        }
    }

    try {
        localStorage.setItem('lmav_session_v2', JSON.stringify(fullProfile));
    } catch {}

    return fullProfile;
};

