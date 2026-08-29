
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
    interests?: string[];
    privacy_settings?: {
        profileVisibility: 'public' | 'network' | 'private';
        allowMessagesFrom: 'all' | 'network' | 'none';
        showOnlineStatus: boolean;
        allowTagging: boolean;
        showActivityFeed: boolean;
        allowFriendRequestsFrom?: 'all' | 'none';
        showFollowersList?: boolean;
        showFollowingList?: boolean;
        notificationsMuted?: boolean;
    };
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
    /**
     * LOOP 06/17 (moteur de messagerie) : réécrite entièrement — l'ancienne
     * version filtrait sur `participant_one_id`/`participant_two_id`, deux
     * colonnes qui n'ont jamais existé sur `conversations` (le vrai modèle
     * relationnel passe par `conversation_participants`, resté du code mort
     * côté client jusqu'ici). Toute conversation réelle retournait `[]`
     * silencieusement — `MoocChatFloating.tsx` ne montrait donc jamais que
     * `MOCK_CHATS`. RLS filtre déjà aux conversations dont `userId` est
     * membre — inutile de le refiltrer ici.
     */
    async getConversationsForUser(userId: string): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        try {
            // Le join imbrique `profiles(...)` ci-dessous est filtré ligne par
            // ligne par la RLS de `profiles` (profiles_select_visible) — or
            // deux personnes qui démarrent une PREMIÈRE conversation ne sont
            // typiquement pas encore amies, et 'network' (qui exige une
            // amitié acceptée) est le défaut de tout nouveau compte. Vérifié
            // empiriquement : le nom/avatar de l'autre participant disparaît
            // silencieusement dans le cas le plus courant. `get_my_
            // conversation_participant_profiles` (SECURITY DEFINER, LOOP
            // 06/17) contourne ce filtrage pour cette seule divulgation
            // minimale (nom/avatar/titre/rôle — jamais email/téléphone/
            // crédits/permissions), la même que révèle n'importe quelle app
            // de messagerie grand public en ouvrant une conversation.
            const [convResult, profilesResult] = await Promise.all([
                supabase
                    .from('conversations')
                    .select(`
                        id, is_group, title, last_message_at, last_message_preview,
                        conversation_participants(user_id, member_role, last_read_at)
                    `)
                    .order('last_message_at', { ascending: false, nullsFirst: false }),
                supabase.rpc('get_my_conversation_participant_profiles'),
            ]);
            const { data, error } = convResult;
            if (error || !data) return [];

            const profilesByConversation = new Map<string, Map<string, { id: string; name: string; avatar_url: string | null; title: string | null; role: string | null }>>();
            (profilesResult.data || []).forEach((row: any) => {
                if (!profilesByConversation.has(row.conversation_id)) profilesByConversation.set(row.conversation_id, new Map());
                profilesByConversation.get(row.conversation_id)!.set(row.id, row);
            });

            return data.map((conv: any) => ({
                ...conv,
                conversation_participants: (conv.conversation_participants || []).map((cp: any) => ({
                    ...cp,
                    profiles: profilesByConversation.get(conv.id)?.get(cp.user_id) || null,
                })),
            }));
        } catch {
            return [];
        }
    },
    /** Historique réel d'une conversation — jamais fourni avant cette LOOP (le client ne recevait que les messages arrivés après ouverture, via `subscribeToChat`). */
    async getConversationMessages(conversationId: string, limit = 50): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        try {
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: false })
                .limit(limit);
            if (error || !data) return [];
            return data.reverse();
        } catch {
            return [];
        }
    },
    /**
     * Conversation directe (non-groupe), idempotente via `direct_key`
     * (index unique déjà présent en base) : réutilise le fil existant s'il
     * y en a déjà un entre ces deux personnes plutôt que d'en créer un
     * second. Aucune fonction de création n'existait avant cette LOOP.
     */
    async createDirectConversation(userId: string, otherUserId: string): Promise<string | null> {
        if (!isSupabaseConfigured) return null;
        const [a, b] = [userId, otherUserId].sort();
        const directKey = `${a}:${b}`;

        const { data: existing } = await supabase.from('conversations').select('id').eq('direct_key', directKey).maybeSingle();
        if (existing) return existing.id;

        // LOOP 07/17 : vérifie AVANT toute écriture que le destinataire
        // accepte ce message (`allowMessagesFrom`, combiné au blocage —
        // `can_message_user`, même fonction que la policy RLS ci-dessous).
        // Nécessaire car `conversations` n'a AUCUNE policy DELETE : si
        // l'échec survenait seulement au moment d'ajouter le second
        // participant (après la création de la conversation elle-même),
        // la conversation resterait orpheline en base, impossible à
        // nettoyer côté client. `error.code = 'MESSAGING_NOT_ALLOWED'`
        // permet à l'appelant de distinguer ce refus légitime d'un échec
        // réseau générique et d'informer honnêtement l'utilisateur.
        const { data: allowed, error: permError } = await supabase.rpc('can_message_user', { p_sender: userId, p_recipient: otherUserId });
        if (permError) throw permError;
        if (!allowed) {
            const err: any = new Error('Ce membre limite qui peut lui écrire.');
            err.code = 'MESSAGING_NOT_ALLOWED';
            throw err;
        }

        // Volontairement sans `.select()` : `INSERT ... RETURNING` exigerait
        // que la policy SELECT (appartenance à la conversation) soit déjà
        // vraie au moment même de l'insertion, hors le créateur ne devient
        // participant que via le trigger `enroll_creator_as_participant`
        // (AFTER INSERT) — l'id est donc généré côté client pour éviter ce
        // problème d'oeuf-et-poule plutôt que de dépendre de la valeur
        // renvoyée par la base.
        const newId = crypto.randomUUID();
        const { error } = await supabase.from('conversations').insert({ id: newId, is_group: false, created_by: userId, direct_key: directKey });
        if (error) {
            if (error.code === '23505') {
                const { data: raced } = await supabase.from('conversations').select('id').eq('direct_key', directKey).maybeSingle();
                if (raced) return raced.id;
            }
            throw error;
        }

        const { error: participantError } = await supabase.from('conversation_participants').insert({ conversation_id: newId, user_id: otherUserId });
        if (participantError && participantError.code !== '23505') throw participantError;
        return newId;
    },
    /** Marque la conversation comme lue par `userId` jusqu'à maintenant — utilisé pour dériver l'état "lu" des messages de l'AUTRE participant sans écrire un flag par message. */
    async markConversationRead(conversationId: string, userId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        await supabase.from('conversation_participants').update({ last_read_at: new Date().toISOString() }).eq('conversation_id', conversationId).eq('user_id', userId);
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

    /**
     * Réécrite pour les vraies colonnes de `messages` (LOOP 06/17) : l'ancien
     * appel envoyait `text`/`sender_name`/`sender_avatar`/`sender_role`/
     * `media_type`/`media_url`/`voice_url`/`voice_duration`/`reply_to`,
     * aucune de ces colonnes n'existe réellement (`content`/
     * `attachment_url`/`message_type`/`reply_to_id` sont les vraies) — tout
     * envoi vers un Supabase réellement configuré échouait donc à 100%,
     * silencieusement avalé par le `.catch()` de l'appelant. `clientMessageId`
     * est l'ancrage d'idempotence (index unique déjà présent en base) :
     * généré une seule fois côté client par tentative d'envoi logique, un
     * retry réutilise le même id — un doublon devient un no-op (23505),
     * jamais un second message.
     */
    async sendChatMessage(params: {
        conversationId: string;
        senderId: string;
        clientMessageId: string;
        content?: string;
        attachmentUrl?: string;
        messageType?: 'text' | 'image' | 'video' | 'audio' | 'document';
        replyToId?: string;
    }): Promise<{ id: string; createdAt: string; status: string } | null> {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase
            .from('messages')
            .insert({
                conversation_id: params.conversationId,
                sender_id: params.senderId,
                client_message_id: params.clientMessageId,
                content: params.content || '',
                attachment_url: params.attachmentUrl,
                message_type: params.messageType || 'text',
                reply_to_id: params.replyToId,
            })
            .select('id, created_at, status')
            .single();
        if (error) {
            if (error.code === '23505') return null; // déjà envoyé — no-op idempotent, pas une erreur.
            throw error;
        }
        return { id: data.id, createdAt: data.created_at, status: data.status };
    },

    async updateChatMessage(messageId: string, updates: Record<string, unknown>): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('messages').update(updates).eq('id', messageId);
        if (error) throw error;
    },

    /** Ajoute/retire la réaction de l'utilisateur courant — via la fonction atomique `toggle_message_reaction` (LOOP 06/17), jamais un lire-modifier-écrire côté client sujet à une course entre deux personnes réagissant en même temps. */
    async toggleMessageReaction(messageId: string, emoji: string): Promise<Record<string, string[]>> {
        if (!isSupabaseConfigured) return {};
        const { data, error } = await supabase.rpc('toggle_message_reaction', { p_message_id: messageId, p_emoji: emoji });
        if (error) throw error;
        return (data as Record<string, string[]>) || {};
    },

    /** Suppression douce (LOOP 06/17) : `deleted_at` plutôt qu'un `DELETE` définitif — l'historique de la conversation pour l'autre participant n'est pas perdu, seul le contenu est masqué à l'affichage. */
    async deleteChatMessage(messageId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('messages').update({ deleted_at: new Date().toISOString(), content: '' }).eq('id', messageId);
        if (error) throw error;
    },

    // --- Fil social (SocialFeed) ---------------------------------------
    async getPosts(): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        // Le fil principal ne montre jamais un brouillon/une publication
        // programmée non encore déclenchée/un contenu archivé — y compris
        // les siens (une vraie vue "mes brouillons" est un écran séparé à
        // construire en LOOP 02/17, pas ce fil). La policy RLS laisserait
        // l'auteur les relire ici sinon, ce qui romprait "préparer ≠ publier".
        const { data, error } = await supabase
            .from('posts')
            .select('*, author:profiles!posts_author_id_fkey(name, avatar_url, title), post_documents!post_documents_post_id_fkey(*)')
            .eq('status', 'published')
            .order('created_at', { ascending: false });
        if (error || !data) return [];
        return data;
    },
    /**
     * LOOP 05/17 (découverte) : `query` filtre réellement par nom/titre
     * (recherche de personnes) — absent, se comporte exactement comme
     * avant (liste des profils, pour l'écran principal du fil).
     */
    async searchProfiles(query?: string): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        let q = supabase.from('profiles').select('*').limit(100);
        if (query && query.trim()) {
            const term = `%${query.trim()}%`;
            q = q.or(`name.ilike.${term},title.ilike.${term}`);
        }
        const { data, error } = await q;
        if (error || !data) return [];
        return data;
    },
    /**
     * LOOP 10/17 (fondation) puis LOOP 11/17 (intelligence & Architecte) —
     * recherche transversale réelle : `profiles`/`posts`/`courses`, un seul
     * appel RPC (`search_universal`, `SECURITY INVOKER` — RLS de chaque
     * table appliquée normalement pour l'appelant, jamais de contournement)
     * remplaçant les 5-6 requêtes REST séparées de la LOOP 10/17 :
     * accent-insensible (`unaccent`, installé par cette LOOP — comble une
     * lacune documentée depuis `searchProfiles`, LOOP 05/17) et le nom de
     * l'auteur d'une publication résolu par une jointure côté serveur
     * (jamais un second aller-retour réseau, jamais un nom fabriqué : si
     * l'auteur n'est pas visible pour l'appelant, la jointure le filtre
     * silencieusement — la publication reste, sans nom d'auteur).
     *
     * `degraded: true` distingue explicitement « l'appel a échoué » de
     * « aucun résultat » — l'UI ne doit jamais présenter un échec comme un
     * simple silence (dégradation gracieuse honnête, jamais un résultat
     * fantôme ni une fausse certitude de zéro résultat).
     *
     * Volontairement absent (voir lots du plan, hors périmètre de cette
     * mission à ce stade) : messages (scope par conversation-membre, différé
     * depuis la LOOP 06/17), recherche sémantique/vectorielle (`pgvector`
     * disponible mais non installé, aucun pipeline d'embedding), classement
     * par pertinence au-delà de l'ordre naturel, `live_sessions`/`documents`.
     */
    async universalSearch(query: string): Promise<{ results: Array<{ id: string; type: 'profile' | 'post' | 'course'; title: string; subtitle?: string; avatarUrl?: string }>; degraded: boolean }> {
        if (!isSupabaseConfigured) return { results: [], degraded: false };
        const term = query.trim();
        if (term.length < 2) return { results: [], degraded: false };

        const { data, error } = await supabase.rpc('search_universal', { term });
        if (error) return { results: [], degraded: true };

        const results = (data || []).map((row: any) => ({
            id: row.id,
            type: row.result_type as 'profile' | 'post' | 'course',
            title: row.title,
            subtitle: row.subtitle || undefined,
            avatarUrl: row.avatar_url || undefined,
        }));
        return { results, degraded: false };
    },
    /**
     * Nombre d'amis en commun entre l'utilisateur courant et un autre
     * membre — recommandation explicable (un chiffre, jamais l'identité
     * des amis communs) sans fuite d'information privée : la fonction
     * SECURITY DEFINER ne retourne qu'un entier, jamais les lignes
     * `friendships` d'un tiers que la RLS de l'appelant ne pourrait pas
     * voir directement.
     */
    async getMutualFriendsCount(userId: string, otherUserId: string): Promise<number> {
        if (!isSupabaseConfigured || userId === otherUserId) return 0;
        const { data, error } = await supabase.rpc('get_mutual_friends_count', { p_user_a: userId, p_user_b: otherUserId });
        if (error || typeof data !== 'number') return 0;
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

    // --- Moteur de contenu unifié (LOOP 01/17, mission Architecte MOCnet) --
    /**
     * Upload réel vers le bucket Storage `public` (lecture publique à
     * quiconque connaît l'URL, écriture restreinte au dossier de
     * l'utilisateur par les policies `public_bucket_*` — le chemin doit donc
     * commencer par `<dossier>/<userId>/...`). Remplace le pattern base64/
     * blob-URL historique de SocialFeed : le fichier survit désormais au
     * rechargement de page au lieu d'être perdu (documents/vidéos) ou
     * alourdir la ligne `posts` elle-même (images).
     */
    async uploadContentMedia(userId: string, file: File, folder: 'posts' | 'stories' | 'documents'): Promise<string | null> {
        if (!isSupabaseConfigured) return null;
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${folder}/${userId}/${Date.now()}-${safeName}`;
        const { error } = await supabase.storage.from('public').upload(path, file, { upsert: false });
        if (error) throw error;
        const { data } = supabase.storage.from('public').getPublicUrl(path);
        return data.publicUrl;
    },
    async createPostDocument(doc: { post_id: string; name: string; url: string; size: number; type: string; page_count?: number }): Promise<any | null> {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.from('post_documents').insert(doc).select().single();
        if (error) throw error;
        return data;
    },
    // Table réelle et RLS-protégée depuis le début du projet mais jamais
    // consommée par le client avant cette LOOP (StoryViewerModal/SocialFeed
    // ne géraient les stories qu'en état React local, perdu au rechargement).
    async getStories(): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase
            .from('stories')
            .select('*, author:profiles!stories_author_id_fkey(name, avatar_url)')
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });
        if (error || !data) return [];
        return data;
    },
    async createStory(story: { author_id: string; media_url: string; caption?: string; is_live?: boolean }): Promise<{ id: string; created_at: string; expires_at: string } | null> {
        if (!isSupabaseConfigured) return null;
        const { data, error } = await supabase.from('stories').insert(story).select('id, created_at, expires_at').single();
        if (error) throw error;
        return data;
    },

    // --- Gouvernance du contenu (LOOP 02/17, mission Architecte MOCnet) ----
    /** Suppression réelle et définitive — RLS (`posts_delete_own_or_admin`) limite déjà l'accès à l'auteur ou un admin ; la confirmation avant appel est de la responsabilité de l'appelant UI. */
    async deletePost(postId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('posts').delete().eq('id', postId);
        if (error) throw error;
    },
    /** Archiver/désarchiver/republier — réutilise le statut ajouté en LOOP 01/17 ; RLS limite déjà à l'auteur ou un admin. */
    async updatePostStatus(postId: string, status: 'published' | 'archived'): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('posts').update({ status }).eq('id', postId);
        if (error) throw error;
    },
    /**
     * Partage réel avec vérification de droits (LOOP 02/17) : appelle la
     * fonction `increment_post_shares` (SECURITY DEFINER, vérifie elle-même
     * que le post est public ET publié avant d'incrémenter — jamais de
     * partage silencieux d'un contenu privé/brouillon/archivé).
     */
    async sharePost(postId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.rpc('increment_post_shares', { p_post_id: postId });
        if (error) throw error;
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
     *
     * Anti-doublon (LOOP 04/17) : un second appel pour la même paire (double
     * clic, retry réseau, répétition vocale) percute l'index unique côté
     * base (23505) — traité ici comme un no-op idempotent, jamais une
     * erreur, puisque l'état désiré (une relation existe déjà) est déjà
     * atteint. Un refus RLS (42501 — bloqué, ou destinataire ayant désactivé
     * les demandes) est en revanche une vraie erreur, propagée telle quelle
     * pour un message honnête côté UI.
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
        if (error && error.code !== '23505') throw error;
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

    // --- Abonnements (follows) — LOOP 04/17 --------------------------------
    // Modèle unilatéral, distinct de l'amitié (réciproque) : les deux ne
    // sont jamais mélangés (décision d'architecture centrale du moteur
    // social). RLS empêche un abonnement vers/depuis une personne qui a
    // bloqué l'autre partie ; les compteurs profiles.followers_count/
    // following_count sont maintenus par un trigger réel (LOOP 04/17).
    /** Le jeu d'ids que `userId` suit réellement — utilisé pour calculer `isFollowing` indépendamment du statut d'amitié. */
    async getFollowingIdsForUser(userId: string): Promise<string[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('follows').select('followee_id').eq('follower_id', userId);
        if (error || !data) return [];
        return data.map((r: any) => r.followee_id);
    },
    async followUser(followerId: string, followeeId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('follows').insert({ follower_id: followerId, followee_id: followeeId });
        if (error && error.code !== '23505') throw error;
    },
    async unfollowUser(followerId: string, followeeId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('follows').delete().eq('follower_id', followerId).eq('followee_id', followeeId);
        if (error) throw error;
    },

    // --- Blocage (user_blocks) — LOOP 04/17 --------------------------------
    // Action forte et personnelle, distincte du signalement (qui remonte à
    // la modération) : le blocage ne remonte nulle part, il ne fait
    // qu'agir sur la relation entre les deux personnes. RLS restreint la
    // visibilité d'une ligne à son seul auteur (blocker_id = auth.uid()) —
    // la personne bloquée ne peut jamais le découvrir via une lecture
    // directe de cette table.
    /** Bloque `blockedId` et met fin, dans le même geste explicite et disclosed à l'utilisateur, à toute amitié/abonnement existant entre les deux — jamais une automatisation cachée : c'est la conséquence directe et annoncée de CETTE action. */
    async blockUser(blockerId: string, blockedId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('user_blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
        if (error && error.code !== '23505') throw error;

        const { data: existingFriendship } = await supabase
            .from('friendships')
            .select('id')
            .or(`and(requester_id.eq.${blockerId},addressee_id.eq.${blockedId}),and(requester_id.eq.${blockedId},addressee_id.eq.${blockerId})`)
            .maybeSingle();
        if (existingFriendship) {
            await supabase.from('friendships').delete().eq('id', existingFriendship.id);
        }
        await supabase.from('follows').delete().eq('follower_id', blockerId).eq('followee_id', blockedId);
        await supabase.from('follows').delete().eq('follower_id', blockedId).eq('followee_id', blockerId);
    },
    async unblockUser(blockerId: string, blockedId: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('user_blocks').delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
        if (error) throw error;
    },
    /** Uniquement les blocages posés PAR `userId` — jamais ceux dont il/elle fait l'objet (RLS ne les exposerait de toute façon pas). */
    async getBlockedUserIds(userId: string): Promise<string[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase.from('user_blocks').select('blocked_id').eq('blocker_id', userId);
        if (error || !data) return [];
        return data.map((r: any) => r.blocked_id);
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
    /**
     * LOOP 08/17 (moteur de notifications, fondation) : la table
     * `notifications` est réellement dans la publication `supabase_realtime`
     * depuis l'origine, mais jamais consommée — `GlobalContext.tsx` ne
     * faisait qu'un fetch ponctuel au montage/à l'auth, jamais de mise à
     * jour en direct (un ami qui accepte une demande, un nouveau message,
     * pendant que l'app est ouverte, n'apparaissait qu'au rechargement
     * suivant). Même patron que `subscribeToChat`.
     * LOOP 09/17 (orchestration proactive) : `onUpdate` ajouté pour le
     * multi-appareils — sans lui, marquer une notification lue sur un
     * appareil ne se reflétait jamais sur un second appareil déjà ouvert
     * (seul l'INSERT était écouté).
     */
    subscribeToNotifications(userId: string, handlers: { onInsert: (n: any) => void; onUpdate?: (n: any) => void }): () => void {
        if (!isSupabaseConfigured) return () => {};
        try {
            const channel = supabase
                .channel(`notifications:${userId}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
                    handlers.onInsert(payload.new);
                })
                .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
                    handlers.onUpdate?.(payload.new);
                })
                .subscribe();
            return () => { supabase.removeChannel(channel); };
        } catch {
            return () => {};
        }
    },
    /**
     * LOOP 09/17 (orchestration proactive) : première écriture cliente vers
     * `reminders` (schéma + moteur cron ajoutés par cette LOOP). Aucune UI de
     * création dédiée pour l'instant (décision explicite de périmètre) — le
     * moteur est testé directement via SQL/REST, voir
     * docs/SUPABASE_ARCHITECTURE.md. `fire_due_reminders()` (pg_cron, toutes
     * les 5 min) transforme un rappel dû en notification réelle une seule
     * fois (`pending`→`fired`), jamais récurrent par défaut.
     */
    async createReminder(userId: string, message: string, remindAt: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('reminders').insert({ user_id: userId, message, remind_at: remindAt });
        if (error) throw error;
    },

    // --- Mémoire contextuelle (LOOP 12/17) ----------------------------
    /**
     * LOOP 12/17 (moteur de mémoire contextuelle, fondation) : `user_memory`
     * remplace `localStorage['lmav_active_memory_v1']` (clé plate, jamais
     * scindée par utilisateur — sur un appareil partagé, un second compte
     * héritait de la mémoire du premier). RLS owner-only, aucune fonction
     * `SECURITY DEFINER` nécessaire. Seules les lignes `status='active'`
     * sont renvoyées (le statut `superseded`/`expired` sera exploité par la
     * LOOP 13/17, colonnes déjà prêtes).
     */
    async getMemories(userId: string): Promise<any[]> {
        if (!isSupabaseConfigured) return [];
        const { data, error } = await supabase
            .from('user_memory')
            .select('*')
            .eq('user_id', userId)
            .eq('status', 'active')
            .order('created_at', { ascending: false });
        if (error || !data) return [];
        return data;
    },
    /**
     * Insertion par défaut (historique : deux appels sans `id` — ex. deux
     * tentatives d'examen — restent deux lignes distinctes, jamais fusionnées
     * par clé) ; mise à jour uniquement si `item.id` est fourni ET appartient
     * à l'appelant (`.eq('user_id', userId)` en plus de l'id, en complément
     * de RLS).
     */
    async upsertMemory(userId: string, item: { id?: string; scope: string; category: string; key: string; value: string; agentId?: string; dossierId?: string; layer?: string; verified?: boolean; confidence?: number }): Promise<any | null> {
        if (!isSupabaseConfigured) return null;
        const row = {
            user_id: userId,
            scope: item.scope,
            category: item.category,
            key: item.key,
            value: item.value,
            agent_id: item.agentId ?? null,
            dossier_id: item.dossierId ?? null,
            layer: item.layer ?? null,
            verified: item.verified ?? true,
            confidence: item.confidence ?? null,
        };
        if (item.id) {
            const { data, error } = await supabase.from('user_memory').update(row).eq('id', item.id).eq('user_id', userId).select().single();
            if (error) throw error;
            return data;
        }
        const { data, error } = await supabase.from('user_memory').insert(row).select().single();
        if (error) throw error;
        return data;
    },
    async deleteMemory(userId: string, id: string): Promise<void> {
        if (!isSupabaseConfigured) return;
        const { error } = await supabase.from('user_memory').delete().eq('id', id).eq('user_id', userId);
        if (error) throw error;
    },
    /**
     * Diffusion admin réelle — jusqu'ici `adminConfigService.sendBroadcastNotification`
     * n'écrivait que dans un tableau en mémoire (`localStorage`), lu par
     * personne d'autre : un admin croyait diffuser une alerte à toute la
     * communauté, mais aucun autre utilisateur ne recevait jamais rien.
     * Réutilise la même table `notifications` (pas un second mécanisme) —
     * `notifications_owner` autorise déjà un admin (`is_admin()`) à écrire
     * pour n'importe quel `user_id`, aucune fonction SECURITY DEFINER
     * n'est donc nécessaire ici (à la différence des notifications entre
     * deux utilisateurs ordinaires, qui passent par des triggers).
     *
     * `targetAudience` vient de `BroadcastNotification` (vocabulaire
     * 'citizens'/'partners' d'AdminConfigService — hérité d'un modèle de
     * rôles fictif jamais réconcilié avec la vraie contrainte
     * `profiles_role_check`, découvert en testant cette fonction : les
     * vraies valeurs sont `user`/`admin`/`expert`/`mentor`/`moderator`/
     * `organization`/`super_admin`, AUCUNE ligne n'a jamais `role='citizen'`
     * ou `role='partner'` — filtrer sur ces valeurs littérales aurait
     * toujours matché zéro destinataire. Mappé ici vers l'équivalent réel
     * le plus proche (`user` = membre ordinaire, `organization` = partenaire)
     * — réconcilier tout le vocabulaire de rôles d'AdminConfigService est un
     * chantier à part entière, hors périmètre d'une LOOP notifications.
     */
    async broadcastNotification(params: {
        title: string;
        message: string;
        type: 'success' | 'info' | 'warning' | 'alert';
        priority: 'low' | 'normal' | 'high';
        targetAudience: 'all' | 'citizens' | 'partners' | 'admins';
    }): Promise<number> {
        if (!isSupabaseConfigured) return 0;
        let query = supabase.from('profiles').select('id');
        if (params.targetAudience === 'citizens') query = query.eq('role', 'user');
        else if (params.targetAudience === 'partners') query = query.eq('role', 'organization');
        else if (params.targetAudience === 'admins') query = query.in('role', ['admin', 'super_admin']);
        const { data: recipients, error: fetchError } = await query;
        if (fetchError || !recipients || recipients.length === 0) return 0;

        const rows = recipients.map((r: { id: string }) => ({
            user_id: r.id,
            type: params.type,
            title: params.title,
            message: params.message,
            priority: params.priority,
            target_action: 'broadcast',
        }));
        const { error } = await supabase.from('notifications').insert(rows);
        if (error) throw error;
        return rows.length;
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
