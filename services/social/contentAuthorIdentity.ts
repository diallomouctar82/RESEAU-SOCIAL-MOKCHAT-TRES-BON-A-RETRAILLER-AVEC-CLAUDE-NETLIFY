/**
 * ÉQUIPE 11 « Identité des publications » (loops 13-15) — fonctions PURES de
 * résolution de l'identité réelle des auteurs de contenu.
 *
 * Contexte : les embeds PostgREST `author:profiles!...` de getPosts /
 * getCommentsForPosts / getStories sont soumis à la RLS
 * `profiles_select_visible` (profil 'public' OU amitié acceptée — or
 * 'network' est le défaut réel à l'inscription). L'embed renvoie donc NULL
 * pour tout auteur non-ami et SocialFeed retombait SILENCIEUSEMENT sur
 * « Membre » + avatar Unsplash générique, alors que la RLS des POSTS laissait
 * bien voir la publication elle-même.
 *
 * Le correctif : collecter les author_id dont l'embed n'a rien fourni
 * (collectMissingAuthorIds), UN SEUL appel batché au RPC
 * `get_content_author_profiles` (SECURITY DEFINER étroit : identité
 * d'annuaire minimale — nom, avatar, titre — uniquement pour les auteurs d'un
 * contenu réellement visible par l'appelant), puis fusionner les profils
 * reçus dans les posts/commentaires/stories déjà mappés (mergeXxx ci-dessous).
 *
 * Le repli « Membre » ne reste QUE pour un auteur réellement introuvable
 * (compte supprimé, ou aucun contenu visible ne le justifiant).
 */

/** Ligne renvoyée par le RPC `get_content_author_profiles`. */
export interface ContentAuthorProfile {
    id: string;
    name: string | null;
    avatar_url: string | null;
    title: string | null;
}

/** Ligne brute (Supabase) porteuse d'un auteur potentiellement masqué par la RLS. */
export interface RawAuthoredRow {
    author_id?: string | null;
    author?: unknown;
}

interface CommentLike {
    authorId?: string;
    authorName: string;
    authorAvatar: string;
    replies?: CommentLike[];
}

interface PostLike {
    authorId?: string;
    authorName: string;
    authorAvatar: string;
    authorTitle?: string;
    commentsList?: CommentLike[];
}

interface StoryLike {
    authorId?: string;
    author: string;
    avatar: string;
}

/**
 * Ids d'auteurs dont l'embed `author:profiles!...` n'a RIEN fourni (RLS) —
 * dédupliqués, dans l'ordre de première apparition. À collecter sur les
 * lignes BRUTES (jamais sur les objets mappés : « Membre » pourrait être un
 * vrai nom).
 */
export function collectMissingAuthorIds(rows: RawAuthoredRow[]): string[] {
    const ids = new Set<string>();
    for (const row of rows) {
        if (row && row.author_id && !row.author) ids.add(row.author_id);
    }
    return Array.from(ids);
}

/** Index id → profil pour la fusion. Les lignes sans id sont ignorées. */
export function buildAuthorProfileMap(profiles: ContentAuthorProfile[]): Record<string, ContentAuthorProfile> {
    const map: Record<string, ContentAuthorProfile> = {};
    for (const p of profiles) {
        if (p && p.id) map[p.id] = p;
    }
    return map;
}

const hasText = (v: string | null | undefined): v is string => typeof v === 'string' && v.trim().length > 0;

function mergeComment<C extends CommentLike>(comment: C, map: Record<string, ContentAuthorProfile>): C {
    const profile = comment.authorId ? map[comment.authorId] : undefined;
    const replies = comment.replies ? comment.replies.map(r => mergeComment(r, map)) : comment.replies;
    const repliesChanged = !!comment.replies && replies!.some((r, i) => r !== comment.replies![i]);
    if (!profile && !repliesChanged) return comment;
    return {
        ...comment,
        ...(profile ? {
            authorName: hasText(profile.name) ? profile.name : comment.authorName,
            authorAvatar: hasText(profile.avatar_url) ? profile.avatar_url : comment.authorAvatar,
        } : {}),
        ...(comment.replies ? { replies } : {}),
    };
}

/**
 * Complète noms/avatars/titres réels des posts (et de leurs commentaires,
 * réponses incluses) à partir des profils batchés. Ne touche que les auteurs
 * présents dans `map` (= ceux que l'embed avait masqués) ; renvoie les MÊMES
 * références quand rien ne change (rendu React stable).
 */
export function mergePostsWithAuthorProfiles<T extends PostLike>(posts: T[], map: Record<string, ContentAuthorProfile>): T[] {
    if (Object.keys(map).length === 0) return posts;
    let changed = false;
    const merged = posts.map(post => {
        const profile = post.authorId ? map[post.authorId] : undefined;
        const commentsList = post.commentsList ? post.commentsList.map(c => mergeComment(c, map)) : post.commentsList;
        const commentsChanged = !!post.commentsList && commentsList!.some((c, i) => c !== post.commentsList![i]);
        if (!profile && !commentsChanged) return post;
        changed = true;
        return {
            ...post,
            ...(profile ? {
                authorName: hasText(profile.name) ? profile.name : post.authorName,
                authorAvatar: hasText(profile.avatar_url) ? profile.avatar_url : post.authorAvatar,
                authorTitle: hasText(profile.title) ? profile.title : post.authorTitle,
            } : {}),
            ...(post.commentsList ? { commentsList } : {}),
        };
    });
    return changed ? merged : posts;
}

/** Même fusion pour les stories (champs `author` = nom, `avatar`). */
export function mergeStoriesWithAuthorProfiles<T extends StoryLike>(stories: T[], map: Record<string, ContentAuthorProfile>): T[] {
    if (Object.keys(map).length === 0) return stories;
    let changed = false;
    const merged = stories.map(story => {
        const profile = story.authorId ? map[story.authorId] : undefined;
        if (!profile) return story;
        changed = true;
        return {
            ...story,
            author: hasText(profile.name) ? profile.name : story.author,
            avatar: hasText(profile.avatar_url) ? profile.avatar_url : story.avatar,
        };
    });
    return changed ? merged : stories;
}
