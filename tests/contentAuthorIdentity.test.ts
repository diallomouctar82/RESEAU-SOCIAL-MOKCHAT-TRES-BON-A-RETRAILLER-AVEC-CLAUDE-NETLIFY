// ÉQUIPE 11 « Identité des publications » — fonctions pures de fusion des
// profils batchés (RPC get_content_author_profiles) dans les posts /
// commentaires / stories mappés par SocialFeed.
import { describe, it, expect } from 'vitest';
import {
    collectMissingAuthorIds,
    buildAuthorProfileMap,
    mergePostsWithAuthorProfiles,
    mergeStoriesWithAuthorProfiles,
    ContentAuthorProfile,
} from '../services/social/contentAuthorIdentity';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';
const C = '33333333-3333-4333-8333-333333333333';

const FALLBACK_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop';

describe('collectMissingAuthorIds', () => {
    it("collecte uniquement les auteurs dont l'embed est NULL, dédupliqués", () => {
        const ids = collectMissingAuthorIds([
            { author_id: A, author: null },
            { author_id: A, author: undefined },            // doublon → une seule fois
            { author_id: B, author: { name: 'Awa' } },       // embed fourni → pas collecté
            { author_id: C, author: null },
            { author_id: null, author: null },               // pas d'auteur → ignoré
            { author_id: undefined },                        // idem
        ]);
        expect(ids).toEqual([A, C]);
    });

    it('renvoie un tableau vide quand tout est résolu par les embeds', () => {
        expect(collectMissingAuthorIds([{ author_id: A, author: { name: 'Awa' } }])).toEqual([]);
        expect(collectMissingAuthorIds([])).toEqual([]);
    });
});

describe('buildAuthorProfileMap', () => {
    it('indexe par id et ignore les lignes sans id', () => {
        const rows: ContentAuthorProfile[] = [
            { id: A, name: 'Awa Diallo', avatar_url: 'https://x/a.png', title: 'Ingénieure' },
            { id: '', name: 'Fantôme', avatar_url: null, title: null },
        ];
        const map = buildAuthorProfileMap(rows);
        expect(Object.keys(map)).toEqual([A]);
        expect(map[A].name).toBe('Awa Diallo');
    });
});

describe('mergePostsWithAuthorProfiles', () => {
    const post = (over: Record<string, unknown> = {}) => ({
        id: 'p1',
        authorId: A,
        authorName: 'Membre',
        authorAvatar: FALLBACK_AVATAR,
        authorTitle: 'Membre Communauté',
        commentsList: [] as any[],
        ...over,
    });

    it("remplace le repli « Membre » par l'identité réelle (nom, avatar, titre)", () => {
        const map = buildAuthorProfileMap([
            { id: A, name: 'Awa Diallo', avatar_url: 'https://x/a.png', title: 'Ingénieure Logiciel' },
        ]);
        const [merged] = mergePostsWithAuthorProfiles([post()], map);
        expect(merged.authorName).toBe('Awa Diallo');
        expect(merged.authorAvatar).toBe('https://x/a.png');
        expect(merged.authorTitle).toBe('Ingénieure Logiciel');
    });

    it("garde l'avatar/titre de repli quand le profil réel n'en a pas, mais prend le vrai nom", () => {
        const map = buildAuthorProfileMap([{ id: A, name: 'Awa Diallo', avatar_url: null, title: null }]);
        const [merged] = mergePostsWithAuthorProfiles([post()], map);
        expect(merged.authorName).toBe('Awa Diallo');
        expect(merged.authorAvatar).toBe(FALLBACK_AVATAR);
        expect(merged.authorTitle).toBe('Membre Communauté');
    });

    it('laisse « Membre » pour un auteur réellement introuvable (compte supprimé)', () => {
        const map = buildAuthorProfileMap([{ id: B, name: 'Autre', avatar_url: null, title: null }]);
        const posts = [post()]; // auteur A, absent de la map
        const merged = mergePostsWithAuthorProfiles(posts, map);
        expect(merged[0].authorName).toBe('Membre');
        expect(merged[0]).toBe(posts[0]); // référence inchangée
    });

    it('complète aussi les commentaires ET leurs réponses imbriquées', () => {
        const map = buildAuthorProfileMap([
            { id: B, name: 'Boubacar Bah', avatar_url: 'https://x/b.png', title: null },
        ]);
        const posts = [post({
            authorId: C, // auteur du post non résolu → reste « Membre »
            commentsList: [{
                authorId: B, authorName: 'Membre', authorAvatar: FALLBACK_AVATAR,
                replies: [{ authorId: B, authorName: 'Membre', authorAvatar: FALLBACK_AVATAR }],
            }],
        })];
        const [merged] = mergePostsWithAuthorProfiles(posts, map);
        expect(merged.authorName).toBe('Membre');
        expect(merged.commentsList[0].authorName).toBe('Boubacar Bah');
        expect(merged.commentsList[0].authorAvatar).toBe('https://x/b.png');
        expect(merged.commentsList[0].replies![0].authorName).toBe('Boubacar Bah');
    });

    it('renvoie le MÊME tableau quand rien ne change (map vide ou sans correspondance)', () => {
        const posts = [post()];
        expect(mergePostsWithAuthorProfiles(posts, {})).toBe(posts);
        const mapSans = buildAuthorProfileMap([{ id: B, name: 'X', avatar_url: null, title: null }]);
        expect(mergePostsWithAuthorProfiles(posts, mapSans)).toBe(posts);
    });

    it('ne touche pas aux posts de démonstration sans authorId uuid', () => {
        const demo = post({ authorId: undefined, authorName: 'Aïcha Koné (démo)' });
        const map = buildAuthorProfileMap([{ id: A, name: 'Awa', avatar_url: null, title: null }]);
        const merged = mergePostsWithAuthorProfiles([demo], map);
        expect(merged[0].authorName).toBe('Aïcha Koné (démo)');
    });
});

describe('mergeStoriesWithAuthorProfiles', () => {
    it("remplace le repli des stories par l'identité réelle", () => {
        const map = buildAuthorProfileMap([
            { id: A, name: 'Awa Diallo', avatar_url: 'https://x/a.png', title: null },
        ]);
        const stories = [
            { id: 's1', authorId: A, author: 'Membre', avatar: FALLBACK_AVATAR },
            { id: 's2', authorId: B, author: 'Membre', avatar: FALLBACK_AVATAR },
        ];
        const merged = mergeStoriesWithAuthorProfiles(stories, map);
        expect(merged[0].author).toBe('Awa Diallo');
        expect(merged[0].avatar).toBe('https://x/a.png');
        expect(merged[1].author).toBe('Membre'); // introuvable → repli conservé
        expect(merged[1]).toBe(stories[1]);
    });

    it('renvoie le même tableau quand la map est vide', () => {
        const stories = [{ id: 's1', authorId: A, author: 'Membre', avatar: FALLBACK_AVATAR }];
        expect(mergeStoriesWithAuthorProfiles(stories, {})).toBe(stories);
    });
});
