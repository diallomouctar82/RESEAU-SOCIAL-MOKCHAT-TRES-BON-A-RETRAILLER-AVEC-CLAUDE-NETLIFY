
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Notification, UserShop, WalletTransaction } from '../types';
import { USER_PROFILE, MOCK_TRANSACTIONS } from '../constants';
import { supabaseService, SupabaseUserProfile } from '../services/supabaseClient';

interface GlobalContextType {
    userProfile: UserProfile;
    notifications: Notification[];
    transactions: WalletTransaction[];
    isSupabaseConnected: boolean;
    updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
    addNotification: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'alert') => void;
    markNotificationRead: (id: string) => void;
    updateUserShop: (shop: UserShop) => void;
    updateUserCredits: (amount: number) => void;
    updateUserXp: (amount: number) => void;
    addTransaction: (transaction: WalletTransaction) => void;
    logout: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Convertit une ligne réelle de `notifications` (déclenchées par exemple par
// le trigger de demande d'ami) vers le type local — même table que ce que
// AdminDashboard/etc. pourraient produire plus tard, jamais lue nulle part
// avant ce branchement.
const mapSupabaseNotification = (rn: any): Notification => ({
    id: rn.id,
    title: rn.title,
    message: rn.message,
    type: (['success', 'info', 'warning', 'alert'] as const).includes(rn.type) ? rn.type : 'info',
    timestamp: new Date(rn.created_at),
    read: rn.read
});

// Helper to convert Supabase DB Profile into App UserProfile
const mapSupabaseToUserProfile = (db: SupabaseUserProfile, current: UserProfile): UserProfile => {
    return {
        ...current,
        id: db.id || current.id,
        email: db.email || current.email,
        name: db.name || current.name,
        title: db.title || current.title,
        bio: db.bio || current.bio,
        role: db.role === 'super_admin' || db.role === 'admin' ? 'admin' : 'user',
        country: db.country || current.country,
        city: db.city || current.city,
        citizenshipId: db.citizenship_id || current.citizenshipId,
        phone: db.phone || current.phone,
        website: db.website || current.website,
        level: db.level ?? current.level,
        xp: db.xp ?? current.xp,
        credits: db.credits ?? current.credits,
        avatarUrl: db.avatar_url || current.avatarUrl,
        isVerified: db.is_verified ?? current.isVerified,
        followersCount: db.followers_count ?? current.followersCount,
        followingCount: db.following_count ?? current.followingCount,
        skills: db.skills && Array.isArray(db.skills) ? db.skills : current.skills,
        badges: db.badges && Array.isArray(db.badges) ? db.badges : current.badges,
        interests: db.interests && Array.isArray(db.interests) ? db.interests : current.interests,
    };
};

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        try {
            const stored = localStorage.getItem('lmav_session_v2');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.email) {
                    return { ...USER_PROFILE, ...parsed };
                }
            }
        } catch {
            // Ignore parse errors
        }
        return USER_PROFILE;
    });

    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'Système Prêt', message: 'Bienvenue sur la version optimisée de Le Monde à Vous.', type: 'success', timestamp: new Date(), read: false }
    ]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
    const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean>(supabaseService.isConfigured());

    // Notifications réelles (ex. déclenchées par le trigger de demande d'ami
    // en base) — fusionnées avec les notifications locales existantes plutôt
    // que de les remplacer, pour ne pas perdre le message de bienvenue local.
    const loadRealNotifications = async (userId: string) => {
        const real = await supabaseService.getNotifications(userId);
        if (real.length === 0) return;
        const mapped = real.map(mapSupabaseNotification);
        setNotifications(prev => {
            const localOnly = prev.filter(n => !UUID_RE.test(n.id));
            return [...mapped, ...localOnly].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        });
    };

    // Sync profile with Supabase on mount and auth state change
    useEffect(() => {
        const checkCloudProfile = async () => {
            const isConfig = supabaseService.isConfigured();
            setIsSupabaseConnected(isConfig);

            if (isConfig) {
                const currentUser = await supabaseService.getCurrentUser();
                if (currentUser) {
                    const dbProfile = await supabaseService.getProfile(currentUser.id);
                    if (dbProfile) {
                        setUserProfile(prev => {
                            const merged = mapSupabaseToUserProfile(dbProfile, prev);
                            localStorage.setItem('lmav_session_v2', JSON.stringify(merged));
                            return merged;
                        });
                    }
                    await loadRealNotifications(currentUser.id);
                }
            }
        };

        checkCloudProfile();

        const { unsubscribe } = supabaseService.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                const dbProfile = await supabaseService.getProfile(session.user.id);
                if (dbProfile) {
                    setUserProfile(prev => {
                        const merged = mapSupabaseToUserProfile(dbProfile, prev);
                        localStorage.setItem('lmav_session_v2', JSON.stringify(merged));
                        return merged;
                    });
                }
                await loadRealNotifications(session.user.id);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []);

    const addNotification = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'alert') => {
        const newNotif: Notification = {
            id: Date.now().toString(),
            title,
            message,
            type,
            timestamp: new Date(),
            read: false
        };
        setNotifications(prev => [newNotif, ...prev]);
    };

    const markNotificationRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        if (UUID_RE.test(id)) {
            supabaseService.markNotificationRead(id).catch(err => console.warn('Could not sync notification read state', err));
        }
    };

    const updateUserProfile = async (updates: Partial<UserProfile>) => {
        setUserProfile(prev => {
            const updated = { ...prev, ...updates };
            try {
                localStorage.setItem('lmav_session_v2', JSON.stringify(updated));
            } catch (err) {
                console.warn('Could not save to localStorage', err);
            }
            return updated;
        });

        // Sync to Supabase if connected
        if (supabaseService.isConfigured() && (updates.id || userProfile.id)) {
            const targetId = updates.id || userProfile.id;
            try {
                // Ne jamais envoyer skills/badges (pas des colonnes de `profiles`,
                // ce sont les tables séparées profile_skills/profile_badges — les
                // inclure fait échouer TOUTE la requête avec un 400, y compris
                // pour un simple changement de bio) ni role/credits/xp/level (un
                // trigger BDD les protège déjà contre l'auto-modification ; les
                // envoyer quand même n'a pas de sens depuis ce chemin d'édition
                // de profil utilisateur). Voir Chantier 1 pour la suite (décision
                // produit skills/badges, privacy_settings).
                await supabaseService.upsertProfile({
                    id: targetId,
                    email: updates.email || userProfile.email,
                    name: updates.name || userProfile.name,
                    title: updates.title || userProfile.title,
                    bio: updates.bio || userProfile.bio,
                    country: updates.country || userProfile.country,
                    city: updates.city || userProfile.city,
                    phone: updates.phone || userProfile.phone,
                    website: updates.website || userProfile.website,
                    avatar_url: updates.avatarUrl || userProfile.avatarUrl,
                    citizenship_id: updates.citizenshipId || userProfile.citizenshipId,
                    interests: updates.interests || userProfile.interests,
                });
            } catch (err) {
                console.warn('Error syncing profile to Supabase', err);
            }
        }
    };

    const updateUserShop = (shop: UserShop) => {
        updateUserProfile({ shop });
    };

    const updateUserCredits = (amount: number) => {
        setUserProfile(prev => {
            const newCredits = prev.credits + amount;
            const updated = { ...prev, credits: newCredits };
            localStorage.setItem('lmav_session_v2', JSON.stringify(updated));
            return updated;
        });
    };

    const addTransaction = (transaction: WalletTransaction) => {
        setTransactions(prev => [transaction, ...prev]);
        if (transaction.currency === 'Credits' || transaction.currency === 'Ⓒ') {
             updateUserCredits(transaction.amount);
        }
    };

    const updateUserXp = (amount: number) => {
        setUserProfile(prev => {
            const newXp = prev.xp + amount;
            let newLevel = prev.level;
            let nextXp = prev.nextLevelXp;
            
            if (newXp >= prev.nextLevelXp) {
                newLevel += 1;
                nextXp = prev.nextLevelXp + (newLevel * 500);
                addNotification("Niveau Supérieur ! 🌟", `Félicitations, vous êtes passé niveau ${newLevel} !`, "success");
            }
            const updated = { ...prev, xp: newXp, level: newLevel, nextLevelXp: nextXp };
            localStorage.setItem('lmav_session_v2', JSON.stringify(updated));
            return updated;
        });
    };

    const logout = () => {
        localStorage.removeItem('lmav_session_v2');
        supabaseService.signOut();
        setUserProfile(USER_PROFILE);
    };

    return (
        <GlobalContext.Provider value={{
            userProfile,
            notifications,
            transactions,
            isSupabaseConnected,
            updateUserProfile,
            addNotification,
            markNotificationRead,
            updateUserShop,
            updateUserCredits,
            updateUserXp,
            addTransaction,
            logout
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (context === undefined) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};
