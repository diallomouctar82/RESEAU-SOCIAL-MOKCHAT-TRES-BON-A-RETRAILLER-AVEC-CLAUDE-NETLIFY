
import {
    createClient,
    type AuthChangeEvent,
    type Session,
    type SupabaseClient,
    type User,
} from '@supabase/supabase-js';
import type { Database } from './database.types';

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

let supabaseClient: SupabaseClient<Database> | null = null;

/** Lazy singleton: importing a module never opens a network connection. */
export const getSupabaseClient = (): SupabaseClient<Database> => {
    if (!supabaseClient) {
        supabaseClient = createClient<Database>(
            supabaseUrl && supabaseUrl.startsWith('http') ? supabaseUrl : 'https://placeholder.supabase.co',
            supabaseAnonKey || 'placeholder-anon-key',
            {
                auth: {
                    flowType: 'pkce',
                    // Le callback PKCE est échangé explicitement par
                    // completeOAuthCallback(), ce qui évite une course entre
                    // l'auto-détection et le listener de session React.
                    detectSessionInUrl: false,
                    persistSession: true,
                    autoRefreshToken: true,
                },
            },
        );
    }
    return supabaseClient;
};

// Compatibility export for the focused domain services. createClient itself
// performs no request; network access still starts only when a service queries.
export const supabase = getSupabaseClient();

export const isUuid = (value: unknown): value is string =>
    typeof value === 'string'
    && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

export interface SupabaseUserProfile {
    id: string;
    email: string;
    name: string;
    title?: string;
    bio?: string;
    role: 'user' | 'admin' | 'super_admin' | 'expert' | 'mentor' | 'moderator' | 'organization';
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
    privacy_settings?: Record<string, unknown>;
    created_at?: string;
}

export type PublicSupabaseProfile = Pick<
    SupabaseUserProfile,
    'id' | 'name' | 'title' | 'avatar_url' | 'country' | 'city' | 'is_verified' | 'followers_count' | 'following_count'
>;

export interface EditableProfileChanges {
    name?: string;
    title?: string;
    bio?: string;
    country?: string;
    city?: string;
    phone?: string;
    website?: string;
    avatar_url?: string;
    preferred_language?: string;
    interests?: string[];
    privacy_settings?: Record<string, unknown>;
}

const toEditableProfileChanges = (profile: Partial<SupabaseUserProfile>): EditableProfileChanges => ({
    ...(profile.name !== undefined ? { name: profile.name } : {}),
    ...(profile.title !== undefined ? { title: profile.title } : {}),
    ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
    ...(profile.country !== undefined ? { country: profile.country } : {}),
    ...(profile.city !== undefined ? { city: profile.city } : {}),
    ...(profile.phone !== undefined ? { phone: profile.phone } : {}),
    ...(profile.website !== undefined ? { website: profile.website } : {}),
    ...(profile.avatar_url !== undefined ? { avatar_url: profile.avatar_url } : {}),
    ...(profile.interests !== undefined ? { interests: profile.interests } : {}),
});

export class SupabaseService {
    public isConfigured(): boolean {
        return isSupabaseConfigured;
    }

    public async getCurrentUser(): Promise<User | null> {
        if (!this.isConfigured()) return null;
        try {
            const { data: { user }, error } = await getSupabaseClient().auth.getUser();
            if (error || !user) return null;
            return user;
        } catch (err) {
            console.warn('Erreur getCurrentUser Supabase:', err);
            return null;
        }
    }

    public async getProfile(userId: string): Promise<SupabaseUserProfile | null> {
        if (!this.isConfigured() || !isUuid(userId)) return null;
        try {
            const { data, error } = await getSupabaseClient().from('profiles')
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

    public async updateMyProfile(changes: EditableProfileChanges): Promise<SupabaseUserProfile | null> {
        if (!this.isConfigured()) return null;
        try {
            // The generated types represent the currently deployed schema. This
            // RPC is delivered by the versioned reconciliation migration.
            const { data, error } = await (getSupabaseClient() as any)
                .rpc('update_my_profile', { p_changes: changes });

            if (error) {
                console.warn('Erreur updateMyProfile Supabase:', error);
                return null;
            }
            return data as SupabaseUserProfile;
        } catch (err) {
            console.warn('Exception updateMyProfile Supabase:', err);
            return null;
        }
    }

    /**
     * Compatibility adapter for legacy callers. It intentionally is not an
     * upsert: Auth owns profile creation and only the current UUID user may
     * update the public, editable fields through the allow-listed RPC.
     */
    public async upsertProfile(profile: Partial<SupabaseUserProfile> & { id?: string }): Promise<SupabaseUserProfile | null> {
        if (!this.isConfigured() || !isUuid(profile.id)) return null;
        const currentUser = await this.getCurrentUser();
        if (!currentUser || currentUser.id !== profile.id) return null;
        return this.updateMyProfile(toEditableProfileChanges(profile));
    }

    public async searchProfiles(query?: string): Promise<PublicSupabaseProfile[]> {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await (getSupabaseClient() as any)
                .rpc('search_public_profiles', {
                    p_query: query?.trim() || '',
                    p_limit: 50,
                });
            if (error || !data) return [];
            return data as PublicSupabaseProfile[];
        } catch (err) {
            console.warn('Erreur searchProfiles Supabase:', err);
            return [];
        }
    }

    public async fetchAdminProfiles(): Promise<any[]> {
        if (!this.isConfigured()) return [];
        try {
            const { data, error } = await getSupabaseClient().from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error || !data) return [];
            return data;
        } catch (err) {
            console.warn('Erreur fetchAdminProfiles Supabase:', err);
            return [];
        }
    }

    public async updateAdminUserProfile(
        idOrProfile: string | ({ id: string; role?: string } & Record<string, unknown>),
        requestedUpdates: Record<string, unknown> = {},
    ): Promise<SupabaseUserProfile | null> {
        const id = typeof idOrProfile === 'string' ? idOrProfile : idOrProfile.id;
        const updates = typeof idOrProfile === 'string' ? requestedUpdates : { ...idOrProfile };
        delete updates.id;
        if (!this.isConfigured() || !isUuid(id)) return null;
        try {
            let latest: SupabaseUserProfile | null = null;
            const role = typeof updates.role === 'string' ? updates.role : undefined;
            delete updates.role;

            if (Object.keys(updates).length > 0) {
                const { data, error } = await (getSupabaseClient() as any).rpc('admin_update_user_profile', {
                    p_user_id: id,
                    p_changes: updates,
                    p_reason: 'Mise à jour depuis la console d’administration',
                });
                if (error) throw error;
                latest = data as SupabaseUserProfile;
            }
            if (role) {
                const { data, error } = await (getSupabaseClient() as any).rpc('admin_set_user_role', {
                    p_user_id: id,
                    p_role: role,
                    p_reason: 'Changement depuis la console d’administration',
                });
                if (error) throw error;
                latest = data as SupabaseUserProfile;
            }
            return latest;
        } catch (err) {
            console.warn('Exception updateAdminUserProfile:', err);
            return null;
        }
    }

    public async deleteAdminUserProfile(id: string): Promise<boolean> {
        if (!this.isConfigured() || !isUuid(id)) return false;
        console.warn('La suppression d’un compte Auth requiert la fonction serveur Admin dédiée; aucune ligne profile n’a été supprimée.');
        return false;
    }

    public onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void): { unsubscribe: () => void } {
        if (!this.isConfigured()) {
            return { unsubscribe: () => {} };
        }
        try {
            const { data } = getSupabaseClient().auth.onAuthStateChange((event, session) => {
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
            await getSupabaseClient().auth.signOut();
        } catch (err) {
            console.warn('Erreur signOut Supabase:', err);
        }
    }

    public subscribeToCallSignals(userId: string, onSignal: (signal: any) => void): () => void {
        if (!this.isConfigured() || !userId) return () => {};
        try {
            const channel = getSupabaseClient().channel(`calls-${userId}`)
                .on('broadcast', { event: 'call_signal' }, (payload) => {
                    if (payload && payload.payload) {
                        onSignal(payload.payload);
                    }
                })
                .subscribe();

            return () => {
                getSupabaseClient().removeChannel(channel).catch(() => {});
            };
        } catch (err) {
            console.warn('Erreur subscribeToCallSignals:', err);
            return () => {};
        }
    }

    public async sendCallSignal(targetUserId: string, signal: any): Promise<void> {
        if (!this.isConfigured() || !targetUserId) return;
        try {
            const channel = getSupabaseClient().channel(`calls-${targetUserId}`);
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

    public subscribeToProfilesRealtime(handlers: {
        onInsert?: (profile: any) => void;
        onUpdate?: (profile: any) => void;
        onDelete?: (id: string) => void;
    }): () => void {
        if (!this.isConfigured()) return () => {};
        try {
            const channel = getSupabaseClient().channel('realtime-profiles-sync')
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
                getSupabaseClient().removeChannel(channel).catch(() => {});
            };
        } catch (err) {
            console.warn('Erreur subscribeToProfilesRealtime:', err);
            return () => {};
        }
    }

    public async savePlatformSettings(settings: any): Promise<any> {
        if (!this.isConfigured()) return null;
        try {
            // `system_settings` is supplied by the Admin migration and is not
            // part of the live types generated before that migration.
            const { data, error } = await (getSupabaseClient() as any).from('system_settings')
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
