import type { RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type { Comment, Post, PostReactionType, PostVisibility, Story } from '../types';
import { supabase } from './supabaseClient';
import { mediaStorage, type MediaBucket } from './mediaStorage';
import { isUuid } from './identifiers';

type JsonObject = Record<string, unknown>;

export interface SocialMediaMetadata {
    bucket: MediaBucket;
    path: string;
    name: string;
    size: number;
    mimeType: string;
}

export interface FeedPage {
    posts: Post[];
    userReactions: Record<string, PostReactionType>;
    nextCursor: string | null;
}

export interface CreatePostInput {
    authorId: string;
    content: string;
    visibility: PostVisibility;
    category?: string;
    tags?: string[];
    media?: SocialMediaMetadata;
}

export class SocialNetworkError extends Error {
    constructor(message: string, public readonly retryable = false, public readonly cause?: unknown) {
        super(message);
        this.name = 'SocialNetworkError';
    }
}

const isRetryable = (error: any): boolean => {
    const status = Number(error?.status ?? error?.statusCode ?? 0);
    return !status || status === 408 || status === 429 || status >= 500;
};

const asRecord = (value: unknown): JsonObject => value && typeof value === 'object' ? value as JsonObject : {};

const requireUuid = (value: unknown, label: string): string => {
    if (!isUuid(value)) throw new SocialNetworkError(`${label} est invalide. Reconnectez-vous avant de réessayer.`);
    return value;
};

const formatRelativeDate = (value?: string): string => {
    if (!value) return '';
    const date = new Date(value);
    const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
    if (seconds < 60) return 'À l’instant';
    if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
    if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
    return date.toLocaleDateString();
};

export class SocialNetworkService {
    constructor(private readonly client: SupabaseClient = supabase) {}

    async listFeed(currentUserId: string, cursor?: string, limit = 20): Promise<FeedPage> {
        requireUuid(currentUserId, 'La session utilisateur');
        const boundedLimit = Math.min(Math.max(limit, 1), 50);
        let request = this.client
            .from('posts')
            .select('*')
            .order('created_at', { ascending: false })
            .order('id', { ascending: false })
            .limit(boundedLimit + 1);
        if (cursor) request = request.lt('created_at', cursor);

        const { data: rows, error } = await request;
        if (error) throw new SocialNetworkError('Le fil d’actualité n’a pas pu être chargé.', isRetryable(error), error);
        const pageRows = (rows || []).slice(0, boundedLimit);
        if (!pageRows.length) return { posts: [], userReactions: {}, nextCursor: null };

        const postIds = pageRows.map((row: any) => row.id);
        const authorIds = Array.from(new Set(pageRows.map((row: any) => row.author_id)));
        const [{ data: profiles, error: profilesError }, { data: commentRows, error: commentsError }, { data: reactionRows, error: reactionsError }] = await Promise.all([
            this.client.rpc('get_public_profiles', { p_user_ids: authorIds }),
            this.client.from('comments').select('*').in('post_id', postIds).order('created_at', { ascending: true }).limit(500),
            this.client.from('post_reactions').select('post_id,user_id,type').in('post_id', postIds),
        ]);
        const firstError = profilesError || commentsError || reactionsError;
        if (firstError) throw new SocialNetworkError('Les détails du fil n’ont pas pu être chargés.', isRetryable(firstError), firstError);

        const commentAuthorIds = Array.from(new Set((commentRows || []).map((row: any) => row.author_id)));
        const missingProfileIds = commentAuthorIds.filter((id) => !authorIds.includes(id));
        const { data: commentProfiles, error: commentProfilesError } = missingProfileIds.length
            ? await this.client.rpc('get_public_profiles', { p_user_ids: missingProfileIds })
            : { data: [], error: null };
        if (commentProfilesError) throw new SocialNetworkError('Les auteurs des commentaires n’ont pas pu être chargés.', isRetryable(commentProfilesError), commentProfilesError);

        const profileById = new Map([...(profiles || []), ...(commentProfiles || [])].map((profile: any) => [profile.id, profile]));
        const reactionsByPost = new Map<string, Record<string, number>>();
        const userReactions: Record<string, PostReactionType> = {};
        for (const reaction of reactionRows || []) {
            const totals = reactionsByPost.get(reaction.post_id) || {};
            totals[reaction.type] = (totals[reaction.type] || 0) + 1;
            reactionsByPost.set(reaction.post_id, totals);
            if (reaction.user_id === currentUserId) userReactions[reaction.post_id] = reaction.type as PostReactionType;
        }

        const mapComment = (row: any): Comment => {
            const profile: any = profileById.get(row.author_id) || {};
            const children = (commentRows || []).filter((candidate: any) => candidate.parent_comment_id === row.id);
            return {
                id: row.id,
                authorId: row.author_id,
                authorName: profile.name || 'Membre Mok',
                authorAvatar: profile.avatar_url || '',
                content: row.content,
                timestamp: formatRelativeDate(row.created_at),
                likes: Number(row.likes_count || 0),
                replies: children.map((child: any) => mapComment(child)),
            };
        };

        const posts = await Promise.all(pageRows.map(async (row: any): Promise<Post> => {
            const profile: any = profileById.get(row.author_id) || {};
            const metadata = asRecord(row.media_metadata);
            const media = asRecord(metadata.media);
            let mediaUrl: string | undefined;
            if (row.media_path && (!row.media_bucket || row.media_bucket === 'social-media')) {
                try {
                    mediaUrl = await mediaStorage.createSignedUrl('social-media', row.media_path);
                } catch {
                    mediaUrl = undefined;
                }
            }
            const reactions = reactionsByPost.get(row.id) || {};
            const typedReactions = reactions as Partial<Record<PostReactionType, number>>;
            const comments = (commentRows || []).filter((comment: any) => comment.post_id === row.id && !comment.parent_comment_id).map(mapComment);
            const commentCount = (commentRows || []).filter((comment: any) => comment.post_id === row.id).length;
            const mediaType = row.media_type || media.type;
            const document = mediaType === 'document' && mediaUrl ? {
                name: typeof media.name === 'string' ? media.name : 'Document',
                url: mediaUrl,
                size: typeof media.size === 'number' ? `${(media.size / (1024 * 1024)).toFixed(1)} MB` : '',
                type: 'other' as const,
            } : undefined;
            return {
                id: row.id,
                authorId: row.author_id,
                authorName: profile.name || 'Membre Mok',
                authorAvatar: profile.avatar_url || '',
                authorTitle: profile.title || 'Membre de la communauté',
                content: row.content || '',
                timestamp: formatRelativeDate(row.created_at),
                likes: Object.values(reactions).reduce((sum, count) => sum + count, 0),
                comments: commentCount,
                commentsList: comments,
                imageUrl: mediaType === 'image' ? mediaUrl : undefined,
                videoUrl: mediaType === 'video' || mediaType === 'audio' ? mediaUrl : undefined,
                document,
                category: typeof metadata.category === 'string' ? metadata.category : undefined,
                tags: Array.isArray(metadata.tags) ? metadata.tags.filter((tag): tag is string => typeof tag === 'string') : undefined,
                visibility: row.visibility || 'public',
                shares: Number(row.shares_count || 0),
                reactions: typedReactions,
                userReaction: userReactions[row.id],
            };
        }));

        const hasMore = (rows || []).length > boundedLimit;
        return {
            posts,
            userReactions,
            nextCursor: hasMore ? pageRows[pageRows.length - 1]?.created_at ?? null : null,
        };
    }

    async createPost(input: CreatePostInput): Promise<string> {
        requireUuid(input.authorId, 'La session utilisateur');
        if (!input.content.trim() && !input.media) throw new SocialNetworkError('La publication est vide.');
        const { data, error } = await this.client.from('posts').insert({
            author_id: input.authorId,
            content: input.content.trim(),
            visibility: input.visibility,
            shares_count: 0,
            media_path: input.media?.path || null,
            media_bucket: input.media?.bucket || null,
            media_type: input.media ? input.media.mimeType.split('/')[0] === 'application' ? 'document' : input.media.mimeType.split('/')[0] : null,
            media_metadata: {
                category: input.category || null,
                tags: input.tags || [],
                media: input.media || null,
            },
        }).select('id').single();
        if (error || !data) throw new SocialNetworkError('La publication n’a pas pu être enregistrée.', isRetryable(error), error);
        return data.id;
    }

    async addComment(input: { postId: string; authorId: string; content: string; parentCommentId?: string }): Promise<string> {
        requireUuid(input.postId, 'La publication');
        requireUuid(input.authorId, 'La session utilisateur');
        if (input.parentCommentId) requireUuid(input.parentCommentId, 'Le commentaire parent');
        if (!input.content.trim()) throw new SocialNetworkError('Le commentaire est vide.');
        const { data, error } = await this.client.from('comments').insert({
            post_id: input.postId,
            author_id: input.authorId,
            parent_comment_id: input.parentCommentId || null,
            content: input.content.trim(),
            likes_count: 0,
        }).select('id').single();
        if (error || !data) throw new SocialNetworkError('Le commentaire n’a pas pu être envoyé.', isRetryable(error), error);
        return data.id;
    }

    async setReaction(postId: string, userId: string, reaction: PostReactionType | null): Promise<void> {
        requireUuid(postId, 'La publication');
        requireUuid(userId, 'La session utilisateur');
        const request = reaction
            ? this.client.from('post_reactions').upsert(
                { post_id: postId, user_id: userId, type: reaction },
                { onConflict: 'post_id,user_id' },
            )
            : this.client.from('post_reactions').delete().eq('post_id', postId).eq('user_id', userId);
        const { error } = await request;
        if (error) throw new SocialNetworkError('La réaction n’a pas pu être mise à jour.', isRetryable(error), error);
    }

    async createStory(input: { authorId: string; caption?: string; media: SocialMediaMetadata }): Promise<string> {
        requireUuid(input.authorId, 'La session utilisateur');
        if (!input.media.mimeType.startsWith('image/') && !input.media.mimeType.startsWith('video/')) {
            throw new SocialNetworkError('Une story doit contenir une image ou une vidéo.');
        }
        const mediaType = input.media.mimeType.startsWith('video/') ? 'video' : 'image';
        const { data, error } = await this.client.from('stories').insert({
            author_id: input.authorId,
            media_url: null,
            media_bucket: input.media.bucket,
            media_path: input.media.path,
            media_type: mediaType,
            visibility: 'public',
            caption: input.caption?.trim() || null,
            is_live: false,
            viewers_count: 0,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        }).select('id').single();
        if (error || !data) throw new SocialNetworkError('La story n’a pas pu être publiée.', isRetryable(error), error);
        return data.id;
    }

    async listStories(): Promise<Story[]> {
        const { data: rows, error } = await this.client.from('stories').select('*').gt('expires_at', new Date().toISOString()).order('created_at', { ascending: false }).limit(50);
        if (error) throw new SocialNetworkError('Les stories n’ont pas pu être chargées.', isRetryable(error), error);
        const authorIds = Array.from(new Set((rows || []).map((row: any) => row.author_id)));
        const { data: profiles, error: profileError } = authorIds.length
            ? await this.client.rpc('get_public_profiles', { p_user_ids: authorIds })
            : { data: [], error: null };
        if (profileError) throw new SocialNetworkError('Les auteurs des stories n’ont pas pu être chargés.', isRetryable(profileError), profileError);
        const profileById = new Map((profiles || []).map((profile: any) => [profile.id, profile]));
        return Promise.all((rows || []).map(async (row: any): Promise<Story> => {
            const profile: any = profileById.get(row.author_id) || {};
            let mediaUrl: string | undefined;
            if (row.media_path && (!row.media_bucket || row.media_bucket === 'social-media')) {
                try { mediaUrl = await mediaStorage.createSignedUrl('social-media', row.media_path); } catch { mediaUrl = undefined; }
            }
            return {
                id: row.id,
                author: profile.name || 'Membre Mok',
                authorId: row.author_id,
                avatar: profile.avatar_url || '',
                isLive: Boolean(row.is_live),
                mediaUrl,
                mediaType: row.media_type || 'image',
                caption: row.caption || undefined,
                timestamp: formatRelativeDate(row.created_at),
                viewersCount: Number(row.viewers_count || 0),
            };
        }));
    }

    subscribe(handlers: {
        onPost?: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: any) => void;
        onComment?: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: any) => void;
        onReaction?: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: any) => void;
        onStory?: (event: 'INSERT' | 'UPDATE' | 'DELETE', row: any) => void;
    }): () => void {
        const tables = [
            ['posts', handlers.onPost],
            ['comments', handlers.onComment],
            ['post_reactions', handlers.onReaction],
            ['stories', handlers.onStory],
        ] as const;
        const channels: RealtimeChannel[] = tables.filter(([, handler]) => Boolean(handler)).map(([table, handler]) =>
            this.client.channel(`network-${table}`)
                .on('postgres_changes', { event: '*', schema: 'public', table }, (payload) => handler?.(payload.eventType, payload.new || payload.old))
                .subscribe()
        );
        return () => { channels.forEach((channel) => this.client.removeChannel(channel).catch(() => undefined)); };
    }
}

export const socialNetworkService = new SocialNetworkService();
