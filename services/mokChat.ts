import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { ChatConversation, ChatMessage, MemberProfile } from '../types';
import { supabase } from './supabaseClient';
import { isUuid, newUuid } from './identifiers';

export { isUuid } from './identifiers';

export interface SendMessageInput {
    conversationId: string;
    senderId: string;
    content?: string;
    clientId: string;
    replyToId?: string;
}

export interface MessagePage {
    messages: ChatMessage[];
    nextCursor: string | null;
}

export interface ChatServiceErrorOptions {
    retryable?: boolean;
    cause?: unknown;
}

export class ChatServiceError extends Error {
    readonly retryable: boolean;
    readonly cause?: unknown;

    constructor(message: string, options: ChatServiceErrorOptions = {}) {
        super(message);
        this.name = 'ChatServiceError';
        this.retryable = options.retryable ?? false;
        this.cause = options.cause;
    }
}

const isRetryable = (error: any): boolean => {
    const status = Number(error?.status ?? error?.statusCode ?? 0);
    return !status || status === 408 || status === 429 || status >= 500;
};

const safeQuery = (value: string): string => value.replace(/[,%()]/g, ' ').trim().slice(0, 80);

const requireUuid = (value: unknown, label: string): string => {
    if (!isUuid(value)) {
        throw new ChatServiceError(`${label} est invalide. Reconnectez-vous avant de réessayer.`);
    }
    return value;
};

const requireUuidList = (values: string[], label: string): string[] => values.map((value) => requireUuid(value, label));

const mapMember = (profile: any, online = false): MemberProfile => ({
    id: profile.id,
    name: profile.name || 'Membre Mok',
    avatarUrl: profile.avatar_url || '',
    title: profile.title || 'Membre de la communauté',
    bio: '',
    location: [profile.city, profile.country].filter(Boolean).join(', '),
    country: profile.country || '',
    joinedDate: '',
    isVerified: Boolean(profile.is_verified),
    isOnline: online,
    isFollowing: false,
    followersCount: Number(profile.followers_count || 0),
    followingCount: Number(profile.following_count || 0),
    postsCount: 0,
    storiesCount: 0,
    reelsCount: 0,
    livesCount: 0,
    privacySettings: {
        profileVisibility: 'public',
        allowMessagesFrom: 'all',
        showOnlineStatus: true,
        allowTagging: true,
        showActivityFeed: true,
    },
});

export class MokChatService {
    constructor(private readonly client: SupabaseClient = supabase) {}

    async searchMembers(query: string, currentUserId: string, limit = 40): Promise<MemberProfile[]> {
        requireUuid(currentUserId, 'La session utilisateur');
        const normalizedQuery = safeQuery(query);
        const { data, error } = await this.client.rpc('search_public_profiles', {
            p_query: normalizedQuery,
            p_limit: Math.min(Math.max(limit, 1), 50),
        });

        if (error) {
            throw new ChatServiceError('L’annuaire des membres est temporairement indisponible.', { cause: error, retryable: isRetryable(error) });
        }

        const visibleProfiles = data || [];
        const profileIds = visibleProfiles.map((profile: any) => profile.id);
        const [{ data: presenceRows, error: presenceError }, blocked] = await Promise.all([
            profileIds.length
                ? this.client.from('user_presence').select('user_id,status,last_seen_at').in('user_id', profileIds)
                : Promise.resolve({ data: [], error: null }),
            this.listBlockedUserIds(currentUserId),
        ]);
        if (presenceError) {
            throw new ChatServiceError('La présence des membres n’a pas pu être chargée.', { cause: presenceError, retryable: isRetryable(presenceError) });
        }
        const statusByUser = new Map((presenceRows || []).map((row: any) => [row.user_id, row.status]));
        return visibleProfiles
            .filter((profile: any) => profile.id !== currentUserId && !blocked.has(profile.id))
            .map((profile: any) => mapMember(profile, statusByUser.get(profile.id) === 'online'));
    }

    async listConversations(currentUserId: string): Promise<ChatConversation[]> {
        requireUuid(currentUserId, 'La session utilisateur');
        const { data: ownMemberships, error: membershipError } = await this.client
            .from('conversation_participants')
            .select('conversation_id,last_read_at')
            .eq('user_id', currentUserId);

        if (membershipError) {
            throw new ChatServiceError('Les conversations n’ont pas pu être chargées.', { cause: membershipError, retryable: isRetryable(membershipError) });
        }

        const ids = (ownMemberships || []).map((row: any) => row.conversation_id);
        if (ids.length === 0) return [];

        const [{ data: conversationRows, error: conversationError }, { data: participantRows, error: participantError }, { data: messageRows, error: messageError }] = await Promise.all([
            this.client.from('conversations').select('*').in('id', ids).order('updated_at', { ascending: false }),
            this.client.from('conversation_participants').select('conversation_id,user_id,joined_at,last_read_at').in('conversation_id', ids),
            this.client.from('messages').select('id,conversation_id,sender_id,content,message_type,created_at,deleted_at').in('conversation_id', ids).is('deleted_at', null).order('created_at', { ascending: false }).limit(Math.min(ids.length * 20, 500)),
        ]);

        const firstError = conversationError || participantError || messageError;
        if (firstError) {
            throw new ChatServiceError('Les conversations n’ont pas pu être assemblées.', { cause: firstError, retryable: isRetryable(firstError) });
        }

        const participantIds = Array.from(new Set((participantRows || []).map((row: any) => row.user_id)));
        const [{ data: profiles, error: profileError }, { data: presenceRows, error: presenceError }] = participantIds.length
            ? await Promise.all([
                this.client.rpc('get_public_profiles', { p_user_ids: participantIds }),
                this.client.from('user_presence').select('user_id,status,last_seen_at').in('user_id', participantIds),
            ])
            : [{ data: [], error: null }, { data: [], error: null }];
        const participantDetailsError = profileError || presenceError;
        if (participantDetailsError) {
            throw new ChatServiceError('Les participants n’ont pas pu être chargés.', { cause: participantDetailsError, retryable: isRetryable(participantDetailsError) });
        }

        const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
        const presenceById = new Map((presenceRows || []).map((presence: any) => [presence.user_id, presence.status]));
        const latestByConversation = new Map<string, any>();
        for (const row of messageRows || []) {
            if (!latestByConversation.has(row.conversation_id)) latestByConversation.set(row.conversation_id, row);
        }
        const membershipByConversation = new Map((ownMemberships || []).map((row: any) => [row.conversation_id, row]));

        return (conversationRows || []).map((conversation: any): ChatConversation => {
            const members = (participantRows || []).filter((row: any) => row.conversation_id === conversation.id);
            const other = members.find((row: any) => row.user_id !== currentUserId) || members[0];
            const otherProfile: any = profileById.get(other?.user_id) || {};
            const latest = latestByConversation.get(conversation.id);
            const lastReadAt = membershipByConversation.get(conversation.id)?.last_read_at;
            const unreadCount = (messageRows || []).filter((row: any) =>
                row.conversation_id === conversation.id &&
                row.sender_id !== currentUserId &&
                (!lastReadAt || row.created_at > lastReadAt)
            ).length;

            return {
                id: conversation.id,
                participantId: other?.user_id || conversation.created_by,
                participantName: conversation.is_group ? (conversation.title || 'Groupe Mok') : (otherProfile.name || 'Membre Mok'),
                participantAvatar: conversation.is_group ? '' : (otherProfile.avatar_url || ''),
                participantTitle: conversation.is_group ? `${members.length} membres` : (otherProfile.title || 'Membre de la communauté'),
                isGroup: Boolean(conversation.is_group),
                groupMembersCount: members.length,
                groupMembers: members.map((member: any) => {
                    const profile: any = profileById.get(member.user_id) || {};
                    return { id: member.user_id, name: profile.name || 'Membre Mok', avatar: profile.avatar_url || '' };
                }),
                lastMessage: latest?.content || (latest?.message_type && latest.message_type !== 'text' ? 'Média partagé' : 'Nouvelle conversation'),
                lastMessageTime: latest?.created_at || conversation.updated_at || conversation.created_at,
                unreadCount,
                isOnline: !conversation.is_group && presenceById.get(other?.user_id) === 'online',
                messages: [],
            };
        });
    }

    async loadMessages(conversationId: string, cursor?: string, limit = 40): Promise<MessagePage> {
        requireUuid(conversationId, 'La conversation');
        const boundedLimit = Math.min(Math.max(limit, 1), 100);
        let request = this.client
            .from('messages')
            .select('*')
            .eq('conversation_id', conversationId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
            .limit(boundedLimit + 1);
        if (cursor) request = request.lt('created_at', cursor);

        const { data: rows, error } = await request;
        if (error) {
            throw new ChatServiceError('L’historique des messages n’a pas pu être chargé.', { cause: error, retryable: isRetryable(error) });
        }

        const pageRows = (rows || []).slice(0, boundedLimit);
        const senderIds = Array.from(new Set(pageRows.map((row: any) => row.sender_id)));
        const messageIds = pageRows.map((row: any) => row.id);
        const [{ data: profiles, error: profilesError }, { data: reactions, error: reactionsError }] = await Promise.all([
            senderIds.length ? this.client.rpc('get_public_profiles', { p_user_ids: senderIds }) : Promise.resolve({ data: [], error: null }),
            messageIds.length ? this.client.from('message_reactions').select('message_id,user_id,reaction').in('message_id', messageIds) : Promise.resolve({ data: [], error: null }),
        ]);
        const relatedError = profilesError || reactionsError;
        if (relatedError) {
            throw new ChatServiceError('Les auteurs ou réactions des messages n’ont pas pu être chargés.', { cause: relatedError, retryable: isRetryable(relatedError) });
        }
        const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
        const reactionsByMessage = new Map<string, Record<string, string[]>>();
        for (const reaction of reactions || []) {
            const grouped = reactionsByMessage.get(reaction.message_id) || {};
            grouped[reaction.reaction] = [...(grouped[reaction.reaction] || []), reaction.user_id];
            reactionsByMessage.set(reaction.message_id, grouped);
        }

        const mapped = await Promise.all(pageRows.map(async (row: any) => {
            const profile: any = profileById.get(row.sender_id) || {};
            return {
                id: row.id,
                conversationId: row.conversation_id,
                clientId: row.client_message_id,
                senderId: row.sender_id,
                senderName: profile.name || 'Membre Mok',
                senderAvatar: profile.avatar_url || '',
                senderRole: profile.title || '',
                text: row.content || undefined,
                mediaType: row.message_type || 'text',
                mediaUrl: row.attachment_url || undefined,
                fileName: row.media_name || undefined,
                fileSize: typeof row.media_size === 'number' ? `${(row.media_size / (1024 * 1024)).toFixed(1)} MB` : undefined,
                timestamp: row.created_at,
                isRead: true,
                status: row.status || 'sent',
                reactions: reactionsByMessage.get(row.id) || {},
                replyTo: row.reply_to_id ? { id: row.reply_to_id } : undefined,
                isEdited: Boolean(row.edited_at),
                isPinned: Boolean(row.is_pinned),
            } satisfies ChatMessage;
        }));

        const hasMore = (rows || []).length > boundedLimit;
        return {
            messages: mapped.reverse(),
            nextCursor: hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null,
        };
    }

    async createConversation(currentUserId: string, memberIds: string[], title?: string): Promise<string> {
        requireUuid(currentUserId, 'La session utilisateur');
        const uniqueMemberIds = Array.from(new Set([currentUserId, ...requireUuidList(memberIds, 'Un membre')])).filter(Boolean);
        if (uniqueMemberIds.length < 2) throw new ChatServiceError('Sélectionnez au moins un autre membre.');
        const { data, error } = await this.client.rpc('create_conversation', {
            p_member_ids: uniqueMemberIds,
            p_title: title?.trim() || null,
            p_is_group: uniqueMemberIds.length > 2,
        });
        if (error || !data) {
            throw new ChatServiceError('La conversation n’a pas pu être créée.', { cause: error, retryable: isRetryable(error) });
        }
        return typeof data === 'string' ? data : (data as any).id;
    }

    async sendMessage(input: SendMessageInput): Promise<ChatMessage> {
        requireUuid(input.conversationId, 'La conversation');
        requireUuid(input.senderId, 'La session utilisateur');
        requireUuid(input.clientId, 'L’identifiant du message');
        if (input.replyToId) requireUuid(input.replyToId, 'Le message cité');
        if (!input.content?.trim()) throw new ChatServiceError('Le message est vide.');
        const { data, error } = await this.client
            .from('messages')
            .upsert({
                conversation_id: input.conversationId,
                sender_id: input.senderId,
                client_message_id: input.clientId,
                content: input.content?.trim() || null,
                message_type: 'text',
                status: 'sent',
                attachment_url: null,
                metadata: {},
                reply_to_id: input.replyToId || null,
            }, { onConflict: 'sender_id,client_message_id', ignoreDuplicates: false })
            .select('*')
            .single();
        if (error || !data) {
            throw new ChatServiceError('Le message n’a pas pu être envoyé.', { cause: error, retryable: isRetryable(error) });
        }
        return {
            id: data.id,
            clientId: data.client_message_id,
            conversationId: data.conversation_id,
            senderId: data.sender_id,
            text: data.content || undefined,
            mediaType: data.message_type || 'text',
            timestamp: data.created_at,
            isRead: true,
            status: 'sent',
            replyTo: input.replyToId ? { id: input.replyToId } : undefined,
        };
    }

    async markConversationRead(conversationId: string): Promise<void> {
        requireUuid(conversationId, 'La conversation');
        const { error } = await this.client.rpc('mark_conversation_read', { p_conversation_id: conversationId });
        if (error) throw new ChatServiceError('La lecture n’a pas pu être synchronisée.', { cause: error, retryable: isRetryable(error) });
    }

    async toggleReaction(messageId: string, userId: string, emoji: string, active: boolean): Promise<void> {
        requireUuid(messageId, 'Le message');
        requireUuid(userId, 'La session utilisateur');
        const request = active
            ? this.client.from('message_reactions').upsert({ message_id: messageId, user_id: userId, reaction: emoji }, { onConflict: 'message_id,user_id,reaction' })
            : this.client.from('message_reactions').delete().eq('message_id', messageId).eq('user_id', userId).eq('reaction', emoji);
        const { error } = await request;
        if (error) throw new ChatServiceError('La réaction n’a pas pu être synchronisée.', { cause: error, retryable: isRetryable(error) });
    }

    async setPinned(messageId: string, isPinned: boolean): Promise<void> {
        requireUuid(messageId, 'Le message');
        const { error } = await this.client.from('messages').update({ is_pinned: isPinned }).eq('id', messageId);
        if (error) throw new ChatServiceError('Le message n’a pas pu être épinglé.', { cause: error, retryable: isRetryable(error) });
    }

    async deleteMessage(messageId: string): Promise<void> {
        requireUuid(messageId, 'Le message');
        const { error } = await this.client.from('messages').update({ deleted_at: new Date().toISOString(), content: null, attachment_url: null }).eq('id', messageId);
        if (error) throw new ChatServiceError('Le message n’a pas pu être supprimé.', { cause: error, retryable: isRetryable(error) });
    }

    async setPresence(userId: string, status: 'online' | 'away' | 'offline'): Promise<void> {
        requireUuid(userId, 'La session utilisateur');
        const { error } = await this.client.rpc('set_user_presence', { p_status: status });
        if (error) throw new ChatServiceError('La présence n’a pas pu être synchronisée.', { cause: error, retryable: isRetryable(error) });
    }

    subscribeToPresence(onChange: (userId: string, status: string) => void): () => void {
        const channel = this.client.channel('mokchat-presence-db')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'user_presence' }, (payload) => {
                const row: any = payload.new || payload.old;
                if (row?.user_id) onChange(row.user_id, row.status || 'offline');
            })
            .subscribe();
        return () => { this.client.removeChannel(channel).catch(() => undefined); };
    }

    subscribeToConversation(conversationId: string, handlers: {
        onInsert?: (row: any) => void;
        onUpdate?: (row: any) => void;
        onDelete?: (row: any) => void;
        onReaction?: (row: any) => void;
    }): () => void {
        requireUuid(conversationId, 'La conversation');
        const channels: RealtimeChannel[] = [];
        channels.push(this.client.channel(`mokchat-messages-${conversationId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, ({ new: row }) => handlers.onInsert?.(row))
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, ({ new: row }) => handlers.onUpdate?.(row))
            .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, ({ old: row }) => handlers.onDelete?.(row))
            .subscribe());
        channels.push(this.client.channel(`mokchat-reactions-${conversationId}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'message_reactions' }, ({ new: row, old }) => handlers.onReaction?.(row || old))
            .subscribe());
        return () => { channels.forEach((channel) => this.client.removeChannel(channel).catch(() => undefined)); };
    }

    async setBlocked(currentUserId: string, targetUserId: string, blocked: boolean): Promise<void> {
        requireUuid(currentUserId, 'La session utilisateur');
        requireUuid(targetUserId, 'Le membre');
        if (currentUserId === targetUserId) throw new ChatServiceError('Vous ne pouvez pas vous bloquer vous-même.');
        const request = blocked
            ? this.client.from('user_blocks').upsert({ blocker_id: currentUserId, blocked_id: targetUserId }, { onConflict: 'blocker_id,blocked_id' })
            : this.client.from('user_blocks').delete().eq('blocker_id', currentUserId).eq('blocked_id', targetUserId);
        const { error } = await request;
        if (error) throw new ChatServiceError('Le blocage n’a pas pu être synchronisé.', { cause: error, retryable: isRetryable(error) });
    }

    async listBlockedUserIds(currentUserId: string): Promise<Set<string>> {
        requireUuid(currentUserId, 'La session utilisateur');
        const { data, error } = await this.client.from('user_blocks').select('blocked_id').eq('blocker_id', currentUserId);
        if (error) throw new ChatServiceError('La liste de blocage n’a pas pu être chargée.', { cause: error, retryable: isRetryable(error) });
        return new Set((data || []).map((row: any) => row.blocked_id));
    }

    async reportAbuse(input: {
        reporterId: string;
        reportedUserId?: string;
        conversationId?: string;
        messageId?: string;
        postId?: string;
        reason: string;
        details?: string;
    }): Promise<void> {
        requireUuid(input.reporterId, 'La session utilisateur');
        if (input.reportedUserId) requireUuid(input.reportedUserId, 'Le membre signalé');
        if (input.conversationId) requireUuid(input.conversationId, 'La conversation');
        if (input.messageId) requireUuid(input.messageId, 'Le message');
        if (input.postId) requireUuid(input.postId, 'La publication');
        if (!input.reportedUserId && !input.conversationId && !input.messageId && !input.postId) {
            throw new ChatServiceError('Le signalement doit cibler un membre ou un contenu.');
        }
        const allowedCategories = new Set(['spam', 'harassment', 'hate', 'fraud', 'nudity', 'violence', 'impersonation', 'other']);
        const category = allowedCategories.has(input.reason) ? input.reason : 'other';
        const { error } = await this.client.from('abuse_reports').insert({
            reporter_id: input.reporterId,
            target_user_id: input.reportedUserId || null,
            conversation_id: input.conversationId || null,
            message_id: input.messageId || null,
            post_id: input.postId || null,
            category,
            description: input.details?.trim() || input.reason,
            status: 'open',
        });
        if (error) throw new ChatServiceError('Le signalement n’a pas pu être transmis.', { cause: error, retryable: isRetryable(error) });
    }
}

export const mokChatService = new MokChatService();

export const newClientMessageId = (): string => newUuid();
