
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, Notification, UserShop, WalletTransaction } from '../types';
import { USER_PROFILE, MOCK_TRANSACTIONS } from '../constants';
import { supabaseService } from '../services/supabaseClient';
import { memoryService } from '../services/memory';
import { setSyncQueueUser, startSyncQueueAutoResume } from '../services/architecte/syncQueue';
import { installSyncTaskHandlers } from '../services/architecte/syncTaskHandlers';
import { forgetPushSubscription } from '../services/push/pushService';
import { adminConfigService } from '../services/adminConfigService';
import { resolveNewAccountAvatarUrl } from '../services/studio/avatarStudio';
import { realAvatarUrl } from '../services/studio/avatarIdentity';

interface GlobalContextType {
    userProfile: UserProfile;
    notifications: Notification[];
    transactions: WalletTransaction[];
    isSupabaseConnected: boolean;
    /** `true` uniquement si la persistance a réellement abouti — voir l'implémentation. */
    updateUserProfile: (updates: Partial<UserProfile>) => Promise<boolean>;
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
    read: rn.read,
    priority: (['low', 'normal', 'high'] as const).includes(rn.priority) ? rn.priority : 'normal',
    targetAction: rn.target_action || undefined
});

/**
 * STUDIO AVATAR — avatar par défaut de l'Admin-Général.
 *
 * Appliqué à un profil qui n'a AUCUNE photo réellement exploitable : compte
 * fraîchement créé, ou session héritée portant encore le cliché de banque
 * d'images (que `realAvatarUrl` traite déjà comme « absent » partout dans
 * l'app). Un membre qui a sa propre photo — ou un avatar personnel Pro — n'est
 * jamais écrasé.
 *
 * Côté serveur, la ligne `profiles` d'un nouveau compte est créée par un
 * trigger Supabase que le client ne pilote pas : cette règle couvre donc la
 * session client, et l'affichage est en plus garanti pour TOUS les comptes par
 * `resolveActiveAvatar`, qui retombe sur le même défaut sans écrire en base.
 */
const applyPlatformDefaultAvatar = (profile: UserProfile): UserProfile => {
    if (realAvatarUrl(profile.avatarUrl)) return profile;
    try {
        const policy = adminConfigService.getDetailedSettings().studio.defaultAvatar;
        return { ...profile, avatarUrl: resolveNewAccountAvatarUrl(policy) };
    } catch {
        // Réglages illisibles : mieux vaut aucun avatar (donc les initiales)
        // qu'un écran cassé au démarrage — règle « zéro écran blanc ».
        return { ...profile, avatarUrl: '' };
    }
};

export const GlobalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userProfile, setUserProfile] = useState<UserProfile>(() => {
        try {
            const stored = localStorage.getItem('lmav_session_v2');
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && parsed.email) {
                    return applyPlatformDefaultAvatar({ ...USER_PROFILE, ...parsed });
                }
            }
        } catch {
            // Ignore parse errors
        }
        return applyPlatformDefaultAvatar(USER_PROFILE);
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

    // Le chargement du profil applicatif complet (profil + compétences +
    // badges + confidentialité) est entièrement géré par App.tsx via
    // services/profile.ts::fetchUserProfile, qui va chercher les vraies
    // tables profile_skills/profile_badges — le dupliquer ici (comme
    // c'était le cas auparavant) faisait tourner une seconde implémentation
    // incomplète en parallèle, sans ces jointures, avec un résultat qui
    // dépendait de l'ordre de résolution des deux. Ce contexte ne gère donc
    // plus que ce qui n'est pas déjà couvert par ce chemin : l'état de
    // connexion Supabase et les notifications réelles.
    useEffect(() => {
        const isConfig = supabaseService.isConfigured();
        setIsSupabaseConnected(isConfig);
        if (!isConfig) return;

        // Réel temps réel (LOOP 08/17) : `notifications` est dans la
        // publication Realtime depuis l'origine, mais jusqu'ici seul
        // `loadRealNotifications` (fetch ponctuel) la consommait — une
        // notification créée pendant que l'app est déjà ouverte (ami qui
        // accepte, nouveau message reçu) n'apparaissait qu'au rechargement
        // suivant. Un seul canal actif à la fois, réattaché à chaque
        // changement d'utilisateur (le filtre `user_id` est figé à la
        // création du canal).
        // LOOP 09/17 : `onUpdate` reflète en direct un changement fait sur un
        // autre appareil (ex. `read` passé à true) — jusqu'ici seul l'INSERT
        // était écouté, un second appareil déjà ouvert restait bloqué sur
        // l'ancien état jusqu'au rechargement complet de la page.
        let unsubscribeNotifications: (() => void) | null = null;
        const attachNotificationsRealtime = (userId: string) => {
            unsubscribeNotifications?.();
            unsubscribeNotifications = supabaseService.subscribeToNotifications(userId, {
                onInsert: (row) => {
                    const mapped = mapSupabaseNotification(row);
                    setNotifications(prev => prev.some(n => n.id === mapped.id) ? prev : [mapped, ...prev]);
                },
                onUpdate: (row) => {
                    const mapped = mapSupabaseNotification(row);
                    setNotifications(prev => prev.map(n => n.id === mapped.id ? mapped : n));
                },
            });
        };

        // File de synchronisation hors-ligne de l'Architecte (« Lazarus »).
        // Les traitements sont enregistrés une fois pour toutes ; la reprise
        // automatique s'attache à l'événement `online` du navigateur, comme
        // dans le paquet d'origine. Les deux sont idempotents.
        installSyncTaskHandlers();
        const stopSyncAutoResume = startSyncQueueAutoResume();

        supabaseService.getCurrentUser().then(currentUser => {
            if (currentUser) {
                loadRealNotifications(currentUser.id);
                attachNotificationsRealtime(currentUser.id);
                // LOOP 12/17 (mémoire contextuelle) : mémoire active
                // désormais réelle par utilisateur — memoryService a besoin
                // de savoir qui est connecté, exactement comme les
                // notifications juste au-dessus.
                memoryService.setCurrentUserId(currentUser.id);
                // Même raison pour la file : elle est scindée par compte, pour
                // qu'un second utilisateur sur le même appareil n'hérite jamais
                // des tâches en attente du premier — et ne les envoie pas sous
                // son identité.
                setSyncQueueUser(currentUser.id);
            }
        });

        const { unsubscribe } = supabaseService.onAuthStateChange(async (event, session) => {
            if (session?.user) {
                await loadRealNotifications(session.user.id);
                attachNotificationsRealtime(session.user.id);
                memoryService.setCurrentUserId(session.user.id);
                setSyncQueueUser(session.user.id);
            } else {
                unsubscribeNotifications?.();
                unsubscribeNotifications = null;
                memoryService.setCurrentUserId(null);
                setSyncQueueUser(null);
            }
        });

        return () => {
            unsubscribe();
            unsubscribeNotifications?.();
            stopSyncAutoResume();
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

    /**
     * Renvoie `true` seulement si la persistance a RÉELLEMENT abouti.
     *
     * L'échec était auparavant avalé (`catch { console.warn }`) : l'état React
     * local était mis à jour dans tous les cas, si bien qu'un écran de
     * réglages — et surtout l'Architecte, qui annonce vocalement ce qu'il
     * vient de faire — affichait un succès alors que rien n'avait été
     * enregistré. Même discipline anti-faux-succès que celle appliquée à la
     * publication, à l'amitié, au blocage et aux commentaires.
     *
     * Le repli hors-ligne reste intact : quand Supabase n'est pas configuré,
     * l'écriture locale seule est un succès légitime (`true`), pas un échec.
     */
    const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
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
                    privacy_settings: updates.privacySettings || userProfile.privacySettings,
                    // LOOP 13/17 : colonne réelle, déjà lue (services/profile.ts)
                    // mais jamais incluse ici — un nouveau sélecteur de langue
                    // (UnifiedSettingsModal.tsx) aurait mis à jour l'état React
                    // local sans jamais persister le changement.
                    // Mission « Harmonisation de la langue » : `null` est une
                    // valeur légitime (« Par défaut » = aucune traduction) et
                    // doit être ÉCRITE — un `||` l'aurait silencieusement
                    // remplacée par l'ancienne langue.
                    preferred_language: 'preferredLanguage' in updates
                        ? (updates.preferredLanguage ?? null)
                        : (userProfile.preferredLanguage ?? null),
                });
                return true;
            } catch (err) {
                console.warn('Error syncing profile to Supabase', err);
                return false;
            }
        }
        // Supabase non configuré : le mode local est le comportement nominal
        // attendu ici, pas une panne — l'écriture localStorage ci-dessus a
        // bien eu lieu.
        return true;
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
        // Équipe P (VF-1) : cet appareil ne doit plus sonner pour ce compte
        // (désabonnement push navigateur + ligne serveur) — jamais bloquant.
        void forgetPushSubscription();
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
