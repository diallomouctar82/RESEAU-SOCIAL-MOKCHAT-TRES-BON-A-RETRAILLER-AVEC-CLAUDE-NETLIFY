import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Notification, UserProfile, UserShop, WalletTransaction } from '../types';
import { MOCK_TRANSACTIONS } from '../constants';
import { completeOAuthCallback, hasOAuthCallbackCode, onAuthStateChange, signOut, type Session } from '../services/auth';
import { fetchUserProfile, updateOwnProfile } from '../services/profile';
import { isSupabaseConfigured } from '../services/supabaseClient';

interface GlobalContextType {
    userProfile: UserProfile;
    notifications: Notification[];
    transactions: WalletTransaction[];
    isSupabaseConnected: boolean;
    isAuthenticated: boolean;
    isAuthChecking: boolean;
    authError: string | null;
    refreshProfile: () => Promise<void>;
    updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>;
    addNotification: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'alert') => void;
    markNotificationRead: (id: string) => void;
    updateUserShop: (shop: UserShop) => void;
    updateUserCredits: (amount: number) => void;
    updateUserXp: (amount: number) => void;
    addTransaction: (transaction: WalletTransaction) => void;
    logout: () => Promise<void>;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

// État neutre, jamais présenté comme un compte connecté. L'identité affichée
// provient exclusivement de profiles après validation de la session Supabase.
const EMPTY_USER_PROFILE: UserProfile = {
    id: '',
    email: '',
    name: '',
    role: 'user',
    accountStatus: 'active',
    citizenshipId: '',
    level: 1,
    xp: 0,
    nextLevelXp: 500,
    credits: 0,
    avatarUrl: '',
    preferredLanguage: 'fr',
    twoFactorEnabled: false,
    skills: [],
    badges: [],
    interests: []
};

const toOwnProfilePayload = (profile: UserProfile, updates: Partial<UserProfile>) => ({
    name: updates.name ?? profile.name,
    title: updates.title ?? profile.title,
    bio: updates.bio ?? profile.bio,
    country: updates.country ?? profile.country,
    city: updates.city ?? profile.city,
    phone: updates.phone ?? profile.phone,
    website: updates.website ?? profile.website,
    avatar_url: updates.avatarUrl ?? profile.avatarUrl,
    preferred_language: updates.preferredLanguage ?? profile.preferredLanguage,
    interests: updates.interests ?? profile.interests
});

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<UserProfile>(EMPTY_USER_PROFILE);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAuthChecking, setIsAuthChecking] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    const currentSessionRef = useRef<Session | null>(null);
    const loadedSessionKeyRef = useRef<string | null | undefined>(undefined);
    const authRequestRef = useRef(0);

    const [notifications, setNotifications] = useState<Notification[]>([
        { id: '1', title: 'Système Prêt', message: 'Bienvenue sur Le Monde à Vous.', type: 'success', timestamp: new Date(), read: false }
    ]);
    const [transactions, setTransactions] = useState<WalletTransaction[]>(MOCK_TRANSACTIONS);

    const loadSessionProfile = async (session: Session | null, force = false) => {
        const sessionKey = session?.access_token || null;
        if (!force && loadedSessionKeyRef.current === sessionKey) return;
        loadedSessionKeyRef.current = sessionKey;
        const requestId = ++authRequestRef.current;
        currentSessionRef.current = session;
        setAuthError(null);

        if (!session?.user) {
            setUserProfile(EMPTY_USER_PROFILE);
            setIsAuthenticated(false);
            setIsAuthChecking(false);
            return;
        }

        let profile: UserProfile | null;
        try {
            profile = await fetchUserProfile(session.user.id);
        } catch {
            if (requestId !== authRequestRef.current) return;
            loadedSessionKeyRef.current = undefined;
            setUserProfile(EMPTY_USER_PROFILE);
            setIsAuthenticated(false);
            setAuthError('Impossible de charger votre profil. Réessayez dans quelques instants.');
            setIsAuthChecking(false);
            return;
        }
        if (requestId !== authRequestRef.current) return;
        if (!profile) {
            loadedSessionKeyRef.current = undefined;
            setUserProfile(EMPTY_USER_PROFILE);
            setIsAuthenticated(false);
            setAuthError('Votre identité est valide, mais votre profil applicatif est introuvable. Contactez un administrateur.');
            setIsAuthChecking(false);
            return;
        }

        if (profile.accountStatus !== 'active') {
            currentSessionRef.current = null;
            loadedSessionKeyRef.current = null;
            setUserProfile(EMPTY_USER_PROFILE);
            setIsAuthenticated(false);
            setAuthError(profile.accountStatus === 'suspended'
                ? 'Ce compte est suspendu. Contactez un administrateur.'
                : 'Ce compte est en attente d’activation par un administrateur.');
            setIsAuthChecking(false);
            await signOut().catch(() => undefined);
            return;
        }

        setUserProfile(profile);
        setIsAuthenticated(true);
        setIsAuthChecking(false);
    };

    useEffect(() => {
        let active = true;
        const callbackPending = hasOAuthCallbackCode();
        // Supabase émet INITIAL_SESSION : un getSession() parallèle ferait
        // une seconde synchronisation inutile du même profil.
        const unsubscribe = onAuthStateChange((event, session) => {
            // Pendant un retour OAuth, l'ancienne INITIAL_SESSION ne doit pas
            // masquer l'écran de chargement avant l'échange du nouveau code.
            if (callbackPending && event === 'INITIAL_SESSION') return;
            if (active) void loadSessionProfile(session).catch(() => {
                if (!active) return;
                loadedSessionKeyRef.current = undefined;
                setAuthError('Impossible de vérifier la nouvelle session.');
                setIsAuthChecking(false);
            });
        });
        if (callbackPending) {
            void completeOAuthCallback()
                .then((session) => {
                    if (active) return loadSessionProfile(session);
                })
                .catch((error: unknown) => {
                    if (!active) return;
                    loadedSessionKeyRef.current = undefined;
                    setUserProfile(EMPTY_USER_PROFILE);
                    setIsAuthenticated(false);
                    setAuthError(error instanceof Error
                        ? `Connexion Google impossible : ${error.message}`
                        : 'Connexion Google impossible. Relancez la connexion.');
                    setIsAuthChecking(false);
                });
        }
        return () => {
            active = false;
            authRequestRef.current += 1;
            unsubscribe();
        };
    }, []);

    const addNotification = (title: string, message: string, type: 'success' | 'info' | 'warning' | 'alert') => {
        const newNotif: Notification = {
            id: crypto.randomUUID(),
            title,
            message,
            type,
            timestamp: new Date(),
            read: false
        };
        setNotifications((previous) => [newNotif, ...previous]);
    };

    const markNotificationRead = (id: string) => {
        setNotifications((previous) => previous.map((notification) => notification.id === id ? { ...notification, read: true } : notification));
    };

    const refreshProfile = async () => {
        await loadSessionProfile(currentSessionRef.current, true);
    };

    const updateUserProfile = async (updates: Partial<UserProfile>) => {
        const session = currentSessionRef.current;
        if (!session?.user || session.user.id !== userProfile.id) throw new Error('Session requise pour modifier le profil.');

        await updateOwnProfile(session.user.id, toOwnProfilePayload(userProfile, updates));
        setUserProfile((previous) => ({
            ...previous,
            ...updates,
            id: previous.id,
            email: previous.email,
            role: previous.role,
            accountStatus: previous.accountStatus
        }));
    };

    const updateUserShop = (shop: UserShop) => setUserProfile((previous) => ({ ...previous, shop }));

    const updateUserCredits = (amount: number) => {
        setUserProfile((previous) => ({ ...previous, credits: previous.credits + amount }));
    };

    const addTransaction = (transaction: WalletTransaction) => {
        setTransactions((previous) => [transaction, ...previous]);
        if (transaction.currency === 'Credits' || transaction.currency === 'Ⓒ') updateUserCredits(transaction.amount);
    };

    const updateUserXp = (amount: number) => {
        setUserProfile((previous) => {
            const xp = previous.xp + amount;
            if (xp < previous.nextLevelXp) return { ...previous, xp };
            const level = previous.level + 1;
            addNotification('Niveau supérieur ! 🌟', `Félicitations, vous êtes passé niveau ${level} !`, 'success');
            return { ...previous, xp, level, nextLevelXp: previous.nextLevelXp + level * 500 };
        });
    };

    const logout = async () => {
        await signOut();
        currentSessionRef.current = null;
        loadedSessionKeyRef.current = null;
        setUserProfile(EMPTY_USER_PROFILE);
        setIsAuthenticated(false);
    };

    return (
        <GlobalContext.Provider value={{
            userProfile,
            notifications,
            transactions,
            isSupabaseConnected: isSupabaseConfigured,
            isAuthenticated,
            isAuthChecking,
            authError,
            refreshProfile,
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
    if (!context) throw new Error('useGlobal must be used within a GlobalProvider');
    return context;
};
