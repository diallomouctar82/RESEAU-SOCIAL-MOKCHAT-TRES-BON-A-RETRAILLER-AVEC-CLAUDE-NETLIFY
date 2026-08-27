import React, { createContext, useContext, useState, type ReactNode } from 'react';
import type { UserProfile, Notification, UserShop, WalletTransaction } from '../types';
import { USER_PROFILE, MOCK_TRANSACTIONS } from '../constants';
import { supabaseService, type EditableProfileChanges } from '../services/supabaseClient';

interface GlobalContextType {
    userProfile: UserProfile;
    notifications: Notification[];
    transactions: WalletTransaction[];
    isSupabaseConnected: boolean;
    hydrateUserProfile: (profile: UserProfile | null) => void;
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

const editableAppPatch = (updates: Partial<UserProfile>): Partial<UserProfile> => ({
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
    ...(updates.country !== undefined ? { country: updates.country } : {}),
    ...(updates.city !== undefined ? { city: updates.city } : {}),
    ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
    ...(updates.website !== undefined ? { website: updates.website } : {}),
    ...(updates.avatarUrl !== undefined ? { avatarUrl: updates.avatarUrl } : {}),
    ...(updates.preferredLanguage !== undefined ? { preferredLanguage: updates.preferredLanguage } : {}),
    ...(updates.interests !== undefined ? { interests: updates.interests } : {}),
    ...(updates.shop !== undefined ? { shop: updates.shop } : {}),
});

const editableDatabasePatch = (updates: Partial<UserProfile>): EditableProfileChanges => ({
    ...(updates.name !== undefined ? { name: updates.name } : {}),
    ...(updates.title !== undefined ? { title: updates.title } : {}),
    ...(updates.bio !== undefined ? { bio: updates.bio } : {}),
    ...(updates.country !== undefined ? { country: updates.country } : {}),
    ...(updates.city !== undefined ? { city: updates.city } : {}),
    ...(updates.phone !== undefined ? { phone: updates.phone } : {}),
    ...(updates.website !== undefined ? { website: updates.website } : {}),
    ...(updates.avatarUrl !== undefined ? { avatar_url: updates.avatarUrl } : {}),
    ...(updates.preferredLanguage !== undefined ? { preferred_language: updates.preferredLanguage } : {}),
    ...(updates.interests !== undefined ? { interests: updates.interests } : {}),
});

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<UserProfile>(USER_PROFILE);
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'Système Prêt', message: 'Bienvenue sur la version optimisée de Le Monde à Vous.', type: 'success', timestamp: new Date(), read: false },
    ]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);
    const isSupabaseConnected = supabaseService.isConfigured();

    // Auth/App owns hydration. Keeping it separate from editing prevents the
    // fetched role/credits/id from being written back by a second sync loop.
    const hydrateUserProfile = (profile: UserProfile | null) => {
        setUserProfile(profile || USER_PROFILE);
    };

    const addNotification = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'alert') => {
        setNotifications((previous) => [{
            id: crypto.randomUUID(),
            title,
            message,
            type,
            timestamp: new Date(),
            read: false,
        }, ...previous]);
    };

    const markNotificationRead = (id: string) => {
        setNotifications((previous) => previous.map((notification) => (
            notification.id === id ? { ...notification, read: true } : notification
        )));
    };

    const updateUserProfile = async (updates: Partial<UserProfile>) => {
        const localPatch = editableAppPatch(updates);
        setUserProfile((previous) => ({ ...previous, ...localPatch }));

        const databasePatch = editableDatabasePatch(updates);
        if (isSupabaseConnected && Object.keys(databasePatch).length > 0) {
            const saved = await supabaseService.updateMyProfile(databasePatch);
            if (!saved) throw new Error('La mise à jour du profil n’a pas été enregistrée.');
        }
    };

    const updateUserShop = (shop: UserShop) => {
        void updateUserProfile({ shop });
    };

    // These two values remain transient UI projections. Durable changes are
    // only made by the trusted award/ledger RPCs, never by browser upserts.
    const updateUserCredits = (amount: number) => {
        setUserProfile((previous) => ({ ...previous, credits: previous.credits + amount }));
    };

    const updateUserXp = (amount: number) => {
        setUserProfile((previous) => {
            const xp = previous.xp + amount;
            const levelUp = xp >= previous.nextLevelXp;
            if (levelUp) {
                queueMicrotask(() => addNotification(
                    'Niveau Supérieur ! 🌟',
                    `Félicitations, vous êtes passé niveau ${previous.level + 1} !`,
                    'success',
                ));
            }
            return {
                ...previous,
                xp,
                level: levelUp ? previous.level + 1 : previous.level,
                nextLevelXp: levelUp ? previous.nextLevelXp + ((previous.level + 1) * 500) : previous.nextLevelXp,
            };
        });
    };

    const addTransaction = (transaction: WalletTransaction) => {
        setTransactions((previous) => [transaction, ...previous]);
        if (transaction.currency === 'Credits' || transaction.currency === 'Ⓒ') {
            updateUserCredits(transaction.amount);
        }
    };

    const logout = () => {
        setUserProfile(USER_PROFILE);
        setTransactions(MOCK_TRANSACTIONS);
    };

    return (
        <GlobalContext.Provider value={{
            userProfile,
            notifications,
            transactions,
            isSupabaseConnected,
            hydrateUserProfile,
            updateUserProfile,
            addNotification,
            markNotificationRead,
            updateUserShop,
            updateUserCredits,
            updateUserXp,
            addTransaction,
            logout,
        }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
    return context;
};
