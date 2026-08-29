import { supabase, isSupabaseConfigured } from '../supabaseClient';
import { LiveChatMessage, LiveReaction } from '../../types';

/**
 * Chat, réactions et demandes de parole en temps réel (LOOP 05/14) — tables
 * live_messages/live_reactions (LOOP 02/14) + live_speakers.is_hand_raised
 * (LOOP 03/14), diffusées via Supabase Realtime. Même convention que
 * supabaseService.subscribeToChat (services/supabaseClient.ts) : un canal
 * par session, dégradation silencieuse si Supabase n'est pas configuré.
 */

interface LiveMessageRow {
    id: string;
    session_id: string;
    author_id: string | null;
    author_name: string | null;
    author_avatar: string | null;
    text: string;
    created_at: string;
}

function mapMessageRow(row: LiveMessageRow): LiveChatMessage {
    return {
        id: row.id,
        sessionId: row.session_id,
        authorId: row.author_id || undefined,
        authorName: row.author_name || 'Anonyme',
        authorAvatar: row.author_avatar || '',
        text: row.text,
        createdAt: row.created_at,
    };
}

export async function sendLiveMessage(
    sessionId: string,
    author: { id: string; name: string; avatar?: string },
    text: string,
): Promise<LiveChatMessage> {
    const { data, error } = await supabase
        .from('live_messages')
        .insert({ session_id: sessionId, author_id: author.id, author_name: author.name, author_avatar: author.avatar, text })
        .select()
        .single();
    if (error || !data) throw new Error(error?.message || "Échec d'envoi du message.");
    return mapMessageRow(data as LiveMessageRow);
}

export async function fetchRecentLiveMessages(sessionId: string, limit = 50): Promise<LiveChatMessage[]> {
    const { data, error } = await supabase
        .from('live_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(limit);
    if (error || !data) return [];
    return (data as LiveMessageRow[]).map(mapMessageRow);
}

export function subscribeToLiveMessages(sessionId: string, onMessage: (m: LiveChatMessage) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    try {
        const channel = supabase
            .channel(`live-messages:${sessionId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_messages', filter: `session_id=eq.${sessionId}` }, (payload) => {
                onMessage(mapMessageRow(payload.new as LiveMessageRow));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    } catch {
        return () => {};
    }
}

interface LiveReactionRow {
    id: string;
    session_id: string;
    user_id: string;
    type: string;
    created_at: string;
}

function mapReactionRow(row: LiveReactionRow): LiveReaction {
    return { id: row.id, sessionId: row.session_id, userId: row.user_id, type: row.type, createdAt: row.created_at };
}

export async function sendLiveReaction(sessionId: string, userId: string, type = 'heart'): Promise<void> {
    const { error } = await supabase.from('live_reactions').insert({ session_id: sessionId, user_id: userId, type });
    if (error) throw new Error(error.message);
}

export async function fetchLiveReactionCount(sessionId: string): Promise<number> {
    const { count, error } = await supabase
        .from('live_reactions')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', sessionId);
    if (error || count === null) return 0;
    return count;
}

export function subscribeToLiveReactions(sessionId: string, onReaction: (r: LiveReaction) => void): () => void {
    if (!isSupabaseConfigured) return () => {};
    try {
        const channel = supabase
            .channel(`live-reactions:${sessionId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_reactions', filter: `session_id=eq.${sessionId}` }, (payload) => {
                onReaction(mapReactionRow(payload.new as LiveReactionRow));
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    } catch {
        return () => {};
    }
}

interface LiveSpeakerChangeRow {
    id: string;
    session_id: string;
    user_id: string | null;
    name: string;
    avatar: string | null;
    role: string;
    is_hand_raised: boolean;
    left_at: string | null;
}

/** Diffuse les changements de live_speakers (main levée, promotion, départ) — utilisé par l'hôte/modérateur pour voir les demandes de parole en direct. */
export function subscribeToLiveSpeakerChanges(
    sessionId: string,
    onChange: (row: LiveSpeakerChangeRow) => void,
): () => void {
    if (!isSupabaseConfigured) return () => {};
    try {
        const channel = supabase
            .channel(`live-speakers:${sessionId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'live_speakers', filter: `session_id=eq.${sessionId}` }, (payload) => {
                onChange(payload.new as LiveSpeakerChangeRow);
            })
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'live_speakers', filter: `session_id=eq.${sessionId}` }, (payload) => {
                onChange(payload.new as LiveSpeakerChangeRow);
            })
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    } catch {
        return () => {};
    }
}
