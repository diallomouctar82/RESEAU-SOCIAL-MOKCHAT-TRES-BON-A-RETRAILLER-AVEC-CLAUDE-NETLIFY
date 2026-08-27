
import { createClient, type Session, type User, type RealtimeChannel } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isSupabaseConfigured = Boolean(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl.startsWith('http') &&
    !supabaseUrl.includes('placeholder') &&
    supabaseAnonKey !== 'placeholder-anon-key'
);

if (!isSupabaseConfigured) {
    console.warn(
        "Supabase en mode Local-First : VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY non définies ou avec valeurs par défaut. " +
        "L'application démarre et fonctionne en mode local-first sécurisé avec persistance IndexedDB/LocalStorage."
    );
}

// createClient() avec fallback résilient pour empêcher tout écran blanc
export const supabase = createClient(
    supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
);

export interface SupabaseUserProfile {
    id: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    role: 'citizen' | 'admin' | 'super_admin' | 'expert';
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

export class SupabaseService {
    public isConfigured(): boolean {
        return isSupabaseConfigured;
    }

    public async getCurrentUser(): Promise<User | null> {
        if (!this.isConfigured()) return null;
        try {
            const { data: { user }, error } = await supabase.auth.getUser();
            if (error || !user) return null;
            return user;
        } catch (err) {
            console.warn('Erreur getCurrentUser Supabase:', err);
            return null;
        }
    }

    public async getProfile(userId: string): Promise<SupabaseUserProfile | null> {
        if (!this.isConfigured() || !userId) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !data) return null;
            return data as SupabaseUserProfile;
        } catch (err) {
            console.warn('Erreur getProfile Supabase:', err);
            return null;
        }
    }

    public async upsertProfile(profile: Partial<SupabaseUserProfile>): Promise<any> {
        if (!this.isConfigured() || !profile.id) return null;
        try {
            const payload: any = {
                ...profile,
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('profiles')
                .upsert(payload)
                .select()
                .single();

            if (error) {
                // Si la base Supabase n'a pas encore exécuté la migration pour certaines colonnes (badges, skills, city, etc.)
                if (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column')) {
                    console.warn('Colonne manquante dans profiles Supabase, tentative avec payload de base:', error.message);
                    
                    // Extraire le nom de colonne si présent
                    const match = error.message?.match(/Could not find the '([^']+)' column/);
                    const missingCol = match ? match[1] : null;
                    
                    const safePayload: any = { ...payload };
                    if (missingCol) {
                        delete safePayload[missingCol];
                    } else {
                        // Supprimer les colonnes optionnelles étendues pour garantir l'upsert
                        delete safePayload.badges;
                        delete safePayload.skills;
                        delete safePayload.city;
                        delete safePayload.interests;
                        delete safePayload.privacy_settings;
                        delete safePayload.permissions;
                        delete safePayload.metadata;
                    }

                    const retry = await supabase
                        .from('profiles')
                        .upsert(safePayload)
                        .select()
                        .single();

                    if (retry.error) {
                        console.warn('Erreur seconde tentative upsertProfile Supabase:', retry.error);
                        // Troisième tentative ultra-minimale (champs essentiels PostgreSQL)
                        const minimalPayload = {
                            id: profile.id,
                            email: profile.email,
                            name: profile.name,
                            role: profile.role || 'citizen',
                            updated_at: new Date().toISOString()
                        };
                        const minimalRetry = await supabase
                            .from('profiles')
                            .upsert(minimalPayload)
                            .select()
                            .single();
                        return minimalRetry.data || null;
                    }
                    return retry.data;
                }

                console.warn('Erreur upsertProfile Supabase:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.warn('Exception upsertProfile Supabase:', err);
            return null;
        }
    }

    public async searchProfiles(query?: string): Promise<SupabaseUserProfile[]> {
        if (!this.isConfigured()) return [];
        try {
            let req = supabase.from('profiles').select('*').limit(50);
            if (query && query.trim()) {
                req = req.or(`name.ilike.%${query}%,email.ilike.%${query}%,title.ilike.%${query}%`);
            }
            const { data, error } = await req;
            if (error || !data) return [];
            return data as SupabaseUserProfile[];
        } catch (err) {
            console.warn('Erreur searchProfiles Supabase:', err);
            return [];
        }
    }

    public async fetchAdminProfiles(): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error || !data) return [];
            return data;
        } catch (err) {
            console.warn('Erreur fetchAdminProfiles Supabase:', err);
            return [];
        }
    }

    public async updateAdminUserProfile(id: string, updates: any): Promise<any> {
        if (!this.isConfigured() || !id) return null;
        try {
            const { data, error } = await supabase
                .from('profiles')
                .update({ ...updates, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select();

            if (error) {
                console.warn('Erreur updateAdminUserProfile:', error);
                return null;
            }
            return data;
        } catch (err) {
            console.warn('Exception updateAdminUserProfile:', err);
            return null;
        }
    }

    public async deleteAdminUserProfile(id: string): Promise<boolean> {
        if (!this.isConfigured() || !id) return false;
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            return !error;
        } catch (err) {
            console.warn('Erreur deleteAdminUserProfile:', err);
            return false;
        }
    }

    public onAuthStateChange(callback: (event: string, session: Session | null) => void): { unsubscribe: () => void } {
        if (!this.isConfigured()) {
            return { unsubscribe: () => {} };
        }
        try {
            const { data } = supabase.auth.onAuthStateChange((event, session) => {
                callback(event, session);
            });
            return {
                unsubscribe: () => {
                    data.subscription.unsubscribe();
                }
            };
        } catch (err) {
            console.warn('Erreur onAuthStateChange:', err);
            return { unsubscribe: () => {} };
        }
    }

    public async signOut(): Promise<void> {
        if (!this.isConfigured()) return;
        try {
            await supabase.auth.signOut();
        } catch (err) {
            console.warn('Erreur signOut Supabase:', err);
        }
    }

    public async getPosts(): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(50);

            if (error || !data) return [];
            return data;
        } catch (err) {
            console.warn('Erreur getPosts Supabase:', err);
            return [];
        }
    }

    public async createPost(post: any): Promise<any> {
        if (!this.isConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('posts')
                .insert([{
                    ...post,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) return null;
            return data;
        } catch (err) {
            console.warn('Erreur createPost Supabase:', err);
            return null;
        }
    }

    public async getConversations(userId: string): Promise<any[]> {
        if (!this.isConfigured() || !userId) return [];
        try {
            const { data, error } = await supabase
                .from('conversations')
                .select('*')
                .or(`participant1_id.eq.${userId},participant2_id.eq.${userId}`)
                .order('updated_at', { ascending: false });

            if (error || !data) return [];
            return data;
        } catch (err) {
            console.warn('Erreur getConversations Supabase:', err);
            return [];
        }
    }

    public subscribeToPresence(
        userInfo: { id: string; name: string; avatarUrl?: string; avatar?: string },
        onSync: (state: Record<string, any>) => void
    ): () => void {
        if (!this.isConfigured() || !userInfo?.id) {
            return () => {};
        }
        try {
            const channel: RealtimeChannel = supabase.channel('online-users', {
                config: {
                    presence: {
                        key: userInfo.id,
                    },
                },
            });

            channel
                .on('presence', { event: 'sync' }, () => {
                    const presenceState = channel.presenceState();
                    onSync(presenceState);
                })
                .subscribe(async (status) => {
                    if (status === 'SUBSCRIBED') {
                        await channel.track({
                            id: userInfo.id,
                            name: userInfo.name,
                            avatar: userInfo.avatarUrl || userInfo.avatar,
                            onlineAt: new Date().toISOString()
                        });
                    }
                });

            return () => {
                channel.untrack().catch(() => {});
                supabase.removeChannel(channel).catch(() => {});
            };
        } catch (err) {
            console.warn('Erreur subscribeToPresence Supabase:', err);
            return () => {};
        }
    }

    public subscribeToCallSignals(userId: string, onSignal: (signal: any) => void): () => void {
        if (!this.isConfigured() || !userId) return () => {};
        try {
            const channel = supabase
                .channel(`calls-${userId}`)
                .on('broadcast', { event: 'call_signal' }, (payload) => {
                    if (payload && payload.payload) {
                        onSignal(payload.payload);
                    }
                })
                .subscribe();

            return () => {
                supabase.removeChannel(channel).catch(() => {});
            };
        } catch (err) {
            console.warn('Erreur subscribeToCallSignals:', err);
            return () => {};
        }
    }

    public async sendCallSignal(targetUserId: string, signal: any): Promise<void> {
        if (!this.isConfigured() || !targetUserId) return;
        try {
            const channel = supabase.channel(`calls-${targetUserId}`);
            await channel.subscribe();
            await channel.send({
                type: 'broadcast',
                event: 'call_signal',
                payload: signal
            });
        } catch (err) {
            console.warn('Erreur sendCallSignal:', err);
        }
    }

    public subscribeToChat(
        chatId: string,
        handlers: {
            onMessage?: (msg: any) => void;
            onUpdate?: (msg: any) => void;
            onDelete?: (id: string) => void;
        }
    ): () => void {
        if (!this.isConfigured() || !chatId) return () => {};
        try {
            const channel = supabase
                .channel(`chat-${chatId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'INSERT',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${chatId}`
                    },
                    (payload) => {
                        handlers.onMessage?.(payload.new);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${chatId}`
                    },
                    (payload) => {
                        handlers.onUpdate?.(payload.new);
                    }
                )
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'messages',
                        filter: `conversation_id=eq.${chatId}`
                    },
                    (payload) => {
                        handlers.onDelete?.(payload.old?.id);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel).catch(() => {});
            };
        } catch (err) {
            console.warn('Erreur subscribeToChat Supabase:', err);
            return () => {};
        }
    }

    public async sendMessage(msg: any): Promise<any> {
        if (!this.isConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{
                    ...msg,
                    created_at: new Date().toISOString()
                }])
                .select()
                .single();

            if (error) return null;
            return data;
        } catch (err) {
            console.warn('Erreur sendMessage Supabase:', err);
            return null;
        }
    }

    public async updateChatMessage(msgId: string, updates: any): Promise<any> {
        if (!this.isConfigured() || !msgId) return null;
        try {
            const { data, error } = await supabase
                .from('messages')
                .update(updates)
                .eq('id', msgId)
                .select()
                .single();

            if (error) return null;
            return data;
        } catch (err) {
            console.warn('Erreur updateChatMessage Supabase:', err);
            return null;
        }
    }

    public async deleteChatMessage(msgId: string): Promise<boolean> {
        if (!this.isConfigured() || !msgId) return false;
        try {
            const { error } = await supabase
                .from('messages')
                .delete()
                .eq('id', msgId);

            return !error;
        } catch (err) {
            console.warn('Erreur deleteChatMessage Supabase:', err);
            return false;
        }
    }

    public subscribeToProfilesRealtime(handlers: {
        onInsert?: (profile: any) => void;
        onUpdate?: (profile: any) => void;
        onDelete?: (id: string) => void;
    }): () => void {
        if (!this.isConfigured()) return () => {};
        try {
            const channel = supabase
                .channel('realtime-profiles-sync')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'profiles' },
                    (payload) => handlers.onInsert?.(payload.new)
                )
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'profiles' },
                    (payload) => handlers.onUpdate?.(payload.new)
                )
                .on(
                    'postgres_changes',
                    { event: 'DELETE', schema: 'public', table: 'profiles' },
                    (payload) => handlers.onDelete?.(payload.old?.id)
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel).catch(() => {});
            };
        } catch (err) {
            console.warn('Erreur subscribeToProfilesRealtime:', err);
            return () => {};
        }
    }

    public async savePlatformSettings(settings: any): Promise<any> {
        if (!this.isConfigured()) return null;
        try {
            const { data, error } = await supabase
                .from('system_settings')
                .upsert({
                    id: 'platform_config',
                    settings,
                    updated_at: new Date().toISOString()
                });

            if (error) return null;
            return data;
        } catch (err) {
            console.warn('Erreur savePlatformSettings:', err);
            return null;
        }
    }
}

export const supabaseService = new SupabaseService();
export type { Session, User };

