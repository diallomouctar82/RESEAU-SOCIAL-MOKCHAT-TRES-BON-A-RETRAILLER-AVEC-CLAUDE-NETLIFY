
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// Exposé pour les écrans qui veulent adapter leur affichage (ex. masquer un
// bouton) selon que Supabase est réellement configuré — jamais utilisé ici
// pour basculer vers une session ou des données fabriquées côté client.
export const isSupabaseConfigured = Boolean(
    supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http') && !supabaseUrl.includes('placeholder')
);

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        "Supabase non configuré : VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY sont absentes. " +
        "L'authentification et les données distantes ne fonctionneront pas tant que ces variables ne sont pas définies sur Netlify (ou dans .env.local en développement)."
    );
}

const REMEMBER_ME_KEY = 'lmav_remember_me';

/**
 * "Se souvenir de moi" : à appeler AVANT signInWithPassword/signInWithOAuth/
 * signUp pour choisir où la session sera écrite juste après.
 * true (défaut) → localStorage, la session survit à la fermeture du navigateur.
 * false → sessionStorage, la session est effacée à la fermeture de l'onglet.
 */
export const setRememberMe = (remember: boolean): void => {
    try {
        localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
    } catch {
        // Stockage indisponible (navigation privée stricte) : reste sur le défaut mémorisé.
    }
};

export const getRememberMe = (): boolean => {
    try {
        const v = localStorage.getItem(REMEMBER_ME_KEY);
        return v === null ? true : v === 'true';
    } catch {
        return true;
    }
};

// Adapte dynamiquement où Supabase persiste la session selon setRememberMe(),
// sans avoir à recréer le client. La préférence elle-même reste toujours en
// localStorage (petite donnée non sensible) ; seul le token de session bascule.
const hybridStorage = {
    getItem: (key: string) => {
        try {
            return localStorage.getItem(key) ?? sessionStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: (key: string, value: string) => {
        try {
            if (getRememberMe()) {
                sessionStorage.removeItem(key);
                localStorage.setItem(key, value);
            } else {
                localStorage.removeItem(key);
                sessionStorage.setItem(key, value);
            }
        } catch {
            // Stockage indisponible : la session ne survivra pas au reload, dégradation silencieuse acceptable.
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        } catch {
            // ignore
        }
    },
};

// createClient() lève une exception synchrone si l'URL est vide/invalide.
// Comme ce module est importé tôt (dès App.tsx), une telle exception
// bloquerait le montage de toute l'application — exactement la classe de
// bug déjà corrigée sur le client Gemini (services/ai.ts). L'URL de repli
// est syntaxiquement valide : elle garantit que l'app démarre toujours ;
// si la config manque vraiment, seuls les appels réseau Supabase
// échoueront (proprement, côté appelant), jamais le chargement du bundle.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    { auth: { storage: hybridStorage } }
);

export interface SupabaseUserProfile {
    id: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    role: string;
    country?: string;
    city?: string;
    citizenship_id?: string;
    phone?: string;
    website?: string;
    level?: number;
    xp?: number;
    credits?: number;
    avatar_url?: string;
    is_verified?: boolean;
    followers_count?: number;
    following_count?: number;
    skills?: any[];
    badges?: any[];
    interests?: string[];
}

/**
 * Wrapper fin autour du client Supabase réel — jamais de session/profil
 * fabriqué localement. Utilisé par GlobalContext pour synchroniser le profil
 * applicatif avec la table `profiles` (lecture au montage + écriture depuis
 * Settings.tsx) ; l'authentification elle-même reste entièrement gérée par
 * services/auth.ts, seule source de vérité pour la session.
 */
export const supabaseService = {
    isConfigured(): boolean {
        return isSupabaseConfigured;
    },
    async getCurrentUser() {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.auth.getUser();
        if (error) return null;
        return data.user;
    },
    async getProfile(userId: string): Promise<SupabaseUserProfile | null> {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (error || !data) return null;
        return data as SupabaseUserProfile;
    },
    async upsertProfile(profile: Partial<SupabaseUserProfile> & { id: string }): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('profiles').update(profile).eq('id', profile.id);
        if (error) throw error;
    },
    /**
     * Écoute Realtime des changements sur `profiles` (utilisé par la console
     * Super Admin pour refléter en direct les nouveaux comptes / mises à
     * jour). Ne fait rien si Supabase n'est pas configuré ; renvoie un
     * unsubscribe no-op dans ce cas.
     */
    subscribeToProfilesRealtime(handlers: {
        onInsert?: (profile: SupabaseUserProfile) => void;
        onUpdate?: (profile: SupabaseUserProfile) => void;
        onDelete?: (deletedId: string) => void;
    }) {
        if (!isSupabaseConfigured) return { unsubscribe: () => {} };
        const channel = supabase
            .channel('admin-profiles-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, (payload) => {
                handlers.onInsert?.(payload.new as SupabaseUserProfile);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
                handlers.onUpdate?.(payload.new as SupabaseUserProfile);
            })
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'profiles' }, (payload) => {
                const deletedId = (payload.old as { id?: string })?.id;
                if (deletedId) handlers.onDelete?.(deletedId);
            })
            .subscribe();
        return { unsubscribe: () => { supabase.removeChannel(channel); } };
    },
    onAuthStateChange(callback: (event: string, session: import('@supabase/supabase-js').Session | null) => void) {
        const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
        return { unsubscribe: () => data.subscription.unsubscribe() };
    },
    async signOut(): Promise<void> {
        if (!isSupabaseConfigured) return;
        await supabase.auth.signOut();
    },

    // --- Messagerie (MoocChatFloating) --------------------------------
    // Best-effort : jamais d'exception non gérée. En cas d'échec (table/
    // colonne absente, non configuré...), on dégrade silencieusement — le
    // widget de chat continue de fonctionner en état local optimiste.
    async getConversations(userId: string): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant_one_id.eq.${userId},participant_two_id.eq.${userId}`);
            if (error || !data) return [];
            return data;
        } catch {
            return [];
        }
    },

    subscribeToPresence(
        user: { id: string; name?: string; avatarUrl?: string },
        callback: (state: Record<string, unknown>) => void,
    ): () => void {
        if (!isSupabaseConfigured) return () => {};
        try {
            const channel = supabase.channel('lmav-presence', { config: { presence: { key: user.id } } });
            channel
                .on('presence', { event: 'sync' }, () => callback(channel.presenceState()))
                .subscribe((status) => {
                    if (status === 'SUBSCRIBED') {
                        channel.track({ id: user.id, name: user.name, avatarUrl: user.avatarUrl });
                    }
                });
            return () => { supabase.removeChannel(channel); };
        } catch {
            return () => {};
        }
    },

    subscribeToCallSignals(userId: string, callback: (signal: any) => void): () => void {
        if (!isSupabaseConfigured) return () => {};
        try {
            const channel = supabase
                .channel(`call-signals:${userId}`)
                .on('broadcast', { event: 'signal' }, ({ payload }) => callback(payload))
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        } catch {
            return () => {};
        }
    },

    async sendCallSignal(toUserId: string, signal: any): Promise<void> {
        if (!isSupabaseConfigured) return;
        try {
            const channel = supabase.channel(`call-signals:${toUserId}`);
            await channel.subscribe();
            await channel.send({ type: 'broadcast', event: 'signal', payload: signal });
            supabase.removeChannel(channel);
        } catch {
            // dégradation silencieuse — l'appel ne partira pas, pas de crash.
        }
    },

    subscribeToChat(
        conversationId: string,
        handlers: { onMessage?: (m: any) => void; onUpdate?: (m: any) => void; onDelete?: (id: string) => void },
    ): () => void {
        if (!isSupabaseConfigured) return () => {};
        try {
            const channel = supabase
                .channel(`chat:${conversationId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
                    handlers.onMessage?.(payload.new);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
                    handlers.onUpdate?.(payload.new);
                })
                .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (payload) => {
                    const deletedId = (payload.old as { id?: string })?.id;
                    if (deletedId) handlers.onDelete?.(deletedId);
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        } catch {
            return () => {};
        }
    },

    async sendMessage(message: Record<string, unknown>): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('messages').insert(message);
        if (error) throw error;
    },

    async updateChatMessage(messageId: string, updates: Record<string, unknown>): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('messages').update(updates).eq('id', messageId);
        if (error) throw error;
    },

    async deleteChatMessage(messageId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('messages').delete().eq('id', messageId);
        if (error) throw error;
    },

    // --- Fil social (SocialFeed) ---------------------------------------
    async getPosts(): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase
            .from('posts')
            .select('*, author:profiles!posts_author_id_fkey(name, avatar_url, title)')
            .order('created_at', { ascending: false });
        if (error || !data) return [];
        return data;
    },
    async searchProfiles(): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('profiles').select('*').limit(100);
        if (error || !data) return [];
        return data;
    },
    async createPost(post: Record<string, unknown>): Promise<{ id: string; created_at: string } | null> {
        if (!isSupabaseConfigured) return null;
        // Pas d'`id` dans `post` : la colonne a `default gen_random_uuid()`,
        // laisser Postgres le générer plutôt que forcer un id local
        // (`post-${Date.now()}`) dans une colonne `uuid` — ce qui échouait
        // systématiquement ("invalid input syntax for type uuid").
        const { data, error } = await supabase.from('posts').insert(post).select('id, created_at').single();
        if (error) throw error;
        return data;
    },

    // --- Commentaires & réactions (fil social) --------------------------
    async getCommentsForPosts(postIds: string[]): Promise<any[]> {
        if (!isSupabaseConfigured || postIds.length === 0) return [];
        const { data, error } = await supabase
            .from('comments')
            .select('*, author:profiles!comments_author_id_fkey(name, avatar_url)')
            .in('post_id', postIds)
            .order('created_at', { ascending: true });
        if (error || !data) return [];
        return data;
    },
    async createComment(comment: { post_id: string; author_id: string; content: string; parent_comment_id?: string }): Promise<any | null> {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from('comments')
            .insert(comment)
            .select('*, author:profiles!comments_author_id_fkey(name, avatar_url)')
            .single();
        if (error) throw error;
        return data;
    },
    async getReactionsForPosts(postIds: string[]): Promise<{ post_id: string; user_id: string; type: string }[]> {
        if (!isSupabaseConfigured || postIds.length === 0) return [];
        const { data, error } = await supabase.from('post_reactions').select('post_id, user_id, type').in('post_id', postIds);
        if (error || !data) return [];
        return data;
    },
    async setReaction(postId: string, userId: string, type: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        // Une réaction par utilisateur et par post (contrainte UNIQUE post_id+
        // user_id) ; aucune politique RLS UPDATE sur post_reactions (design
        // volontaire : on ajoute/retire, jamais de modification en place) —
        // donc on retire l'éventuelle réaction existante puis on ajoute la
        // nouvelle, plutôt qu'un upsert qui échouerait sur le conflit.
        await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', userId);
        const { error } = await supabase.from('post_reactions').insert({ post_id: postId, user_id: userId, type });
        if (error) throw error;
    },
    async removeReaction(postId: string, userId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('post_reactions').delete().eq('post_id', postId).eq('user_id', userId);
        if (error) throw error;
    },

    // --- Demandes d'amis (friendships) -----------------------------------
    /**
     * Toutes les relations (en attente ou acceptées) impliquant cet
     * utilisateur, avec le profil de l'AUTRE partie déjà résolu (peu importe
     * qu'il soit requester ou addressee) pour simplifier l'affichage côté
     * client.
     */
    async getFriendshipsForUser(userId: string): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase
            .from('friendships')
            .select(`
                id, status, requester_id, addressee_id, created_at,
                requester:profiles!friendships_requester_id_fkey(id, name, avatar_url, title),
                addressee:profiles!friendships_addressee_id_fkey(id, name, avatar_url, title)
            `)
            .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);
        if (error || !data) return [];
        return data;
    },
    /**
     * Envoie une demande. Si une demande inverse est déjà en attente (l'autre
     * personne m'avait déjà demandé), l'accepte directement au lieu de créer
     * une seconde ligne — deux demandes croisées doivent aboutir à une amitié,
     * pas à un doublon bloqué par l'index unique sur la paire.
     */
    async sendFriendRequest(requesterId: string, addresseeId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { data: existingReverse } = await supabase
            .from('friendships')
            .select('id, status')
            .eq('requester_id', addresseeId)
            .eq('addressee_id', requesterId)
            .maybeSingle();

        if (existingReverse) {
            if (existingReverse.status === 'pending') {
                const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', existingReverse.id);
                if (error) throw error;
            }
            return;
        }

        const { error } = await supabase.from('friendships').insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' });
        if (error) throw error;
    },
    async acceptFriendRequest(friendshipId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('friendships').update({ status: 'accepted' }).eq('id', friendshipId);
        if (error) throw error;
    },
    /** Refuser une demande reçue, annuler une demande envoyée, ou retirer un ami : dans les trois cas, on retire la ligne. */
    async removeFriendship(friendshipId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('friendships').delete().eq('id', friendshipId);
        if (error) throw error;
    },

    // --- Notifications réelles --------------------------------------------
    async getNotifications(userId: string): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);
        if (error || !data) return [];
        return data;
    },
    async markNotificationRead(notificationId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
        if (error) throw error;
    },

    // --- Console Super Admin --------------------------------------------
    async fetchAdminProfiles(): Promise<SupabaseUserProfile[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('profiles').select('*');
        if (error || !data) return [];
        return data as SupabaseUserProfile[];
    },
    async updateAdminUserProfile(profile: Partial<SupabaseUserProfile> & { id: string }): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('profiles').update(profile).eq('id', profile.id);
        if (error) throw error;
    },
    async deleteAdminUserProfile(id: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('profiles').delete().eq('id', id);
        if (error) throw error;
    },
    async savePlatformSettings(settings: Record<string, unknown>): Promise<void> {
        if (!isSupabaseConfigured) return;
        // Aucune table de configuration plateforme dédiée pour l'instant :
        // dégradation silencieuse, l'admin console reste utilisable en local.
        return;
    },
};
