
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UserProfile, Notification, UserShop, WalletTransaction } from '../types';
import { USER_PROFILE, MOCK_TRANSACTIONS } from '../constants';

interface GlobalContextType {
    userProfile: UserProfile;
    notifications: Notification[];
    transactions: WalletTransaction[];
    updateUserProfile: (updates: Partial<UserProfile>) => void;
    addNotification: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'alert') => void;
    markNotificationRead: (id: string) => void;
    updateUserShop: (shop: UserShop) => void;
    updateUserCredits: (amount: number) => void;
    updateUserXp: (amount: number) => void;
    addTransaction: (transaction: WalletTransaction) => void;
    logout: () => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<UserProfile>(USER_PROFILE);
    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'Système Prêt', message: 'Bienvenue sur la version optimisée de Le Monde à Vous.', type: 'success', timestamp: new Date(), read: false }
    ]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);

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
    };

    const updateUserProfile = (updates: Partial<UserProfile>) => {
        setUserProfile(prev => ({ ...prev, ...updates }));
    };

    const updateUserShop = (shop: UserShop) => {
        updateUserProfile({ shop });
    };

    const updateUserCredits = (amount: number) => {
        setUserProfile(prev => ({ ...prev, credits: prev.credits + amount }));
    };

    const addTransaction = (transaction: WalletTransaction) => {
        setTransactions(prev => [transaction, ...prev]);
        // Update credits automatically if currency is Credits
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
            return { ...prev, xp: newXp, level: newLevel, nextLevelXp: nextXp };
        });
    };

    const logout = () => {
        setUserProfile(USER_PROFILE);
    };

    return (
        <GlobalContext.Provider value={{
            userProfile,
            notifications,
            transactions,
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
