import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Plus, Sparkles, TrendingUp, 
  Radio, PlayCircle, Video, Play, Users, Trophy, UserPlus, Calendar, Languages, 
  FileText, ChevronLeft, MapPin, X, Bot, Camera, Image as ImageIcon, DollarSign, 
  Clock, Lock, Volume2, VolumeX, Music, Wand2, Zap, Globe, MessageSquare, Check, 
  Smile, Send, ChevronDown, ChevronUp, ArrowRight, Mic, Phone, PhoneCall, Paperclip, 
  MoreVertical, Hash, Search, Filter, CheckCircle, ChevronRight, Loader2, ThumbsUp,
  Repeat, Bookmark, Shield, Award, Eye, Download, UploadCloud, AlertCircle, Trash2, Archive
} from 'lucide-react';
import { 
  Post, Tribe, LiveStream, ReelDraft, LivePricing, Reel, Comment, 
  ChatConversation, ChatMessage, MemberProfile, Story, UserProfile, PostDocument, PostVisibility, PostReactionType 
} from '../types';
import { AGENTS, REELS, STORIES, ACTIVE_LIVES, TRIBES, LEADERBOARD, MOCK_CHATS, MOCK_MEMBERS, USER_PROFILE, POSTS as INITIAL_POSTS } from '../constants';
import { ReelsCreator } from './ReelsCreator';
import { SmartReelViewer } from './SmartReelViewer';
import { UniversalCreator } from './UniversalCreator';
import { AIPostAssistantModal } from './AIPostAssistantModal';
import { MemberProfileModal } from './MemberProfileModal';
import { StoryViewerModal } from './StoryViewerModal';
import { LiveCreationModal } from './LiveCreationModal';
import { LiveReplayModal } from './LiveReplayModal';
import { cloudService } from '../services/cloud';
import { supabaseService, SupabaseUserProfile } from '../services/supabaseClient';
import { useGlobal } from '../contexts/GlobalContext';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { interpretContentVoiceCommand, ContentVoiceAction } from '../services/content/contentVoiceCommands';
import { registerCapabilityHandlers } from '../services/architecte/capabilityBus';
import { interpretSocialVoiceCommand, SocialVoiceAction } from '../services/social/socialVoiceCommands';
import { addToQueue } from '../services/architecte/syncQueue';
import { checkNetworkStatus } from '../services/pwaService';
import { ShareButton } from './ui/ShareButton';
import { GrowthDashboard } from './growth/GrowthDashboard';
// ÉQUIPE 11 « Identité des publications » : résolution batchée de l'identité
// réelle des auteurs que l'embed profiles a masqués (RLS 'network' non-ami).
import { collectMissingAuthorIds, buildAuthorProfileMap, mergePostsWithAuthorProfiles, mergeStoriesWithAuthorProfiles, RawAuthoredRow } from '../services/social/contentAuthorIdentity';

interface SocialFeedProps {
  onOpenLive: (liveId: string, customLive?: LiveStream) => void;
  onOpenDirectChat?: (conversationId?: string, member?: MemberProfile) => void;
}

// Les posts de démonstration codés en dur (INITIAL_POSTS) restent mélangés au
// fil réel pour la présentation ; leurs ids ('post-1', 'post-2'...) n'existent
// pas dans la table `posts` réelle (clé uuid), donc commenter/réagir dessus ne
// doit jamais tenter d'écrire en base — seuls les vrais posts (id uuid généré
// par Postgres) ont des commentaires/réactions synchronisés avec Supabase.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isRealPostId = (id: string) => UUID_RE.test(id);

export const SocialFeed: React.FC<SocialFeedProps> = ({ onOpenLive, onOpenDirectChat }) => {
  const { userProfile: currentUser, isSupabaseConnected, updateUserProfile } = useGlobal();
  const [activeTab, setActiveTab] = useState<'feed' | 'reels' | 'lives' | 'tribes' | 'my_space'>('feed');
  const [feedFilter, setFeedFilter] = useState<'for_you' | 'following' | 'community' | 'tech' | 'legal' | 'business'>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [stories, setStories] = useState<Story[]>(STORIES);
  const [reels, setReels] = useState<Reel[]>(REELS);
  const [lives, setLives] = useState<LiveStream[]>(ACTIVE_LIVES);

  // Équipe F3 : le fil ne listait QUE des cartes de démonstration (ids
  // factices 'live1'…) — un spectateur cliquant dessus n'ouvrait jamais une
  // session réelle, donc n'entendait jamais le présentateur. Les sessions
  // réellement EN DIRECT passent devant ; les cartes de démonstration
  // restent derrière (elles s'ouvrent en « Aperçu », bannière honnête côté
  // studio).
  useEffect(() => {
    if (!supabaseService.isConfigured()) return;
    let cancelled = false;
    import('../services/live/liveSessionService')
      .then(({ fetchActiveLiveSessions }) => fetchActiveLiveSessions())
      .then((real) => {
        if (cancelled || real.length === 0) return;
        setLives((prev) => {
          const demo = prev.filter((l) => !real.some((r) => r.id === l.id));
          return [...real, ...demo];
        });
      })
      .catch(() => { /* lecture impossible : les cartes de démonstration restent */ });
    return () => { cancelled = true; };
  }, []);
  const [members, setMembers] = useState<MemberProfile[]>(MOCK_MEMBERS);
  const [friendships, setFriendships] = useState<any[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // User Reactions & Bookmarks state
  const [userReactions, setUserReactions] = useState<{ [postId: string]: PostReactionType }>({ 'post-1': 'like', 'post-3': 'insightful' });
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [showReactionPickerForPost, setShowReactionPickerForPost] = useState<string | null>(null);
  // Menu "..." archiver/supprimer (LOOP 02/17, gouvernance du contenu) —
  // un seul menu ouvert à la fois, identifié par l'id du post.
  const [openPostMenuId, setOpenPostMenuId] = useState<string | null>(null);
  // Retour visuel de la dernière commande vocale du composeur (LOOP 03/17)
  // — toujours affiché EN PLUS d'être dit à voix haute, jamais l'un sans
  // l'autre (l'écran reste visible pendant l'exécution).
  const [voiceContentFeedback, setVoiceContentFeedback] = useState<string | null>(null);
  // Découverte de personnes — LOOP 05/17.
  const [voiceSocialFeedback, setVoiceSocialFeedback] = useState<string | null>(null);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [mutualFriendsCounts, setMutualFriendsCounts] = useState<Record<string, number>>({});

  // Comments State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');
  const [replyingToCommentId, setReplyingToCommentId] = useState<string | null>(null);

  // Post Composer State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostCategory, setNewPostCategory] = useState('Tech & Innovation');
  const [newPostVisibility, setNewPostVisibility] = useState<PostVisibility>('public');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [newPostVideo, setNewPostVideo] = useState<string | null>(null);
  const [newPostDocument, setNewPostDocument] = useState<PostDocument | null>(null);
  // Fichiers bruts conservés séparément des aperçus ci-dessus (LOOP 01/17,
  // moteur de contenu unifié) : `newPostImage` peut aussi être une URL déjà
  // hébergée (image générée par l'IA, cf. handleApplyAIEnhancement) qui ne
  // doit jamais être re-uploadée — seul un fichier sélectionné localement
  // doit l'être, au moment de la publication (pas avant, pour ne pas
  // uploader un brouillon jamais publié).
  const [newPostImageFile, setNewPostImageFile] = useState<File | null>(null);
  const [newPostVideoFile, setNewPostVideoFile] = useState<File | null>(null);
  const [newPostDocumentFile, setNewPostDocumentFile] = useState<File | null>(null);
  const [newPostTags, setNewPostTags] = useState<string[]>([]);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  // Modals State
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedMemberForProfile, setSelectedMemberForProfile] = useState<MemberProfile | null>(null);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [selectedReplayForModal, setSelectedReplayForModal] = useState<LiveStream | null>(null);
  const [liveCategoryFilter, setLiveCategoryFilter] = useState<'all' | 'expert' | 'project_pitch' | 'campus' | 'tribe' | 'conference'>('all');
  const [isReelCreatorOpen, setIsReelCreatorOpen] = useState(false);
  const [selectedReelForViewer, setSelectedReelForViewer] = useState<string | null>(null);
  const [reelsViewMode, setReelsViewMode] = useState<'grid' | 'immersive'>('grid');
  const [isCreateStoryOpen, setIsCreateStoryOpen] = useState(false);
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryImage, setNewStoryImage] = useState<string | null>(null);
  const [newStoryImageFile, setNewStoryImageFile] = useState<File | null>(null);

  // File Input References
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const storyImageInputRef = useRef<HTMLInputElement>(null);

  // Chargement des membres — extrait de l'effet de montage (LOOP 05/17)
  // pour être réutilisable par la recherche de personnes (bouton/voix),
  // pas seulement au premier chargement. `query` absent = comportement
  // historique (liste des profils pour le fil).
  //
  // Renvoie la liste réellement chargée (ou null si rien n'a pu l'être) : la
  // résolution vocale d'un nom (G4) doit pouvoir retenter IMMÉDIATEMENT sur
  // le résultat serveur — l'état React `members`, mis à jour par setMembers,
  // ne serait visible qu'au rendu suivant, trop tard pour la commande en
  // cours.
  const loadMembers = async (query?: string): Promise<MemberProfile[] | null> => {
    if (!supabaseService.isConfigured()) return null;
    const profiles = await supabaseService.searchProfiles(query);
    if (!profiles || profiles.length === 0) return null;
    const rawFriendships = currentUser.id ? await supabaseService.getFriendshipsForUser(currentUser.id) : [];
    setFriendships(rawFriendships);
    // Abonnement (follow) et blocage — LOOP 04/17 : deux relations
    // réelles et indépendantes de l'amitié, jamais recalculées à
    // partir de friendshipStatus (qui ne représente que l'amitié).
    const [followingIds, blockedIds] = currentUser.id
      ? await Promise.all([
          supabaseService.getFollowingIdsForUser(currentUser.id),
          supabaseService.getBlockedUserIds(currentUser.id)
        ])
      : [[], []];

    const mappedMembers: MemberProfile[] = profiles.map(p => {
      const rel = rawFriendships.find((f: any) => f.requester_id === p.id || f.addressee_id === p.id);
      let friendshipStatus: MemberProfile['friendshipStatus'] = 'none';
      if (rel) {
        if (rel.status === 'accepted') friendshipStatus = 'friends';
        else if (rel.requester_id === currentUser.id) friendshipStatus = 'pending_sent';
        else friendshipStatus = 'pending_received';
      }

      return {
        id: p.id,
        name: p.name,
        avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
        title: p.title || (p.role === 'admin' ? 'Administrateur' : 'Citoyen du Monde'),
        bio: p.bio || 'Membre vérifié de la communauté Le Monde à Vous.',
        location: `${p.city || 'Paris'}, ${p.country || 'France'}`,
        joinedDate: p.created_at ? new Date(p.created_at).getFullYear().toString() : '2025',
        isVerified: p.is_verified ?? true,
        isFollowing: followingIds.includes(p.id),
        isBlockedByMe: blockedIds.includes(p.id),
        friendshipStatus,
        friendshipId: rel?.id,
        followersCount: p.followers_count ?? 12,
        followingCount: p.following_count ?? 8,
        postsCount: 5,
        storiesCount: 2,
        reelsCount: 1,
        livesCount: 0,
        skills: p.skills?.map((s: any) => s.name) || [],
        privacySettings: p.privacy_settings || {
          profileVisibility: 'public',
          allowMessagesFrom: 'all',
          showOnlineStatus: true,
          allowTagging: true,
          showActivityFeed: true,
          allowFriendRequestsFrom: 'all',
          showFollowersList: true,
          showFollowingList: true
        }
      };
    });
    // Une recherche explicite ne mélange pas les résultats avec les
    // membres de démonstration (MOCK_MEMBERS) — ceux-ci ne servent qu'à
    // peupler le fil par défaut quand aucune recherche n'est en cours.
    const mergedMembers = [...mappedMembers];
    if (!query) {
      MOCK_MEMBERS.forEach(mockM => {
        if (!mergedMembers.some(m => m.name.toLowerCase() === mockM.name.toLowerCase())) {
          mergedMembers.push(mockM);
        }
      });
    }
    setMembers(mergedMembers);
    return mergedMembers;
  };

  // Load Cloud Data on mount
  useEffect(() => {
    const fetchPostsAndMembers = async () => {
      setIsLoadingPosts(true);
      try {
        // 1. Fetch Posts from Supabase if connected, else IndexedDB
        // LOOP F4 : distinguer un fetch en ÉCHEC (→ repli cache local,
        // honnête hors-ligne) d'un fil légitimement vide (→ vérité serveur).
        let fetched: Post[] = [];
        let serverFetchSucceeded = false;
        // ÉQUIPE 11 : lignes brutes (posts/commentaires/stories) dont l'embed
        // `author:profiles!...` peut avoir été masqué par la RLS de profiles —
        // collectées ici pour UN SEUL appel batché getContentAuthorProfiles
        // après le chargement, jamais un appel par post.
        const rawAuthoredRows: RawAuthoredRow[] = [];
        if (supabaseService.isConfigured()) {
          try {
          // Délai de garde : sur un réseau semi-mort (mobile), la requête
          // peut PENDRE sans jamais résoudre ni rejeter — l'effet restait
          // alors suspendu et le fil figé sur son état initial. Au-delà de
          // 12 s, on traite la lecture comme échouée → repli cache.
          const remotePosts = await Promise.race([
            supabaseService.getPosts(),
            new Promise<never>((_, reject) => setTimeout(() => reject(new Error('délai de lecture du fil dépassé')), 12000)),
          ]);
          serverFetchSucceeded = true;
          if (remotePosts && remotePosts.length > 0) {
            const postIds = remotePosts.map(rp => rp.id);
            const [remoteComments, remoteReactions] = await Promise.all([
              supabaseService.getCommentsForPosts(postIds),
              supabaseService.getReactionsForPosts(postIds)
            ]);
            // ÉQUIPE 11 : mémoriser les lignes brutes pour la résolution
            // batchée d'identité des auteurs (après le bloc stories).
            rawAuthoredRows.push(...remotePosts, ...remoteComments);

            const mapComment = (rc: any): Comment => ({
              id: rc.id,
              authorId: rc.author_id,
              postId: rc.post_id,
              parentCommentId: rc.parent_comment_id || undefined,
              authorName: rc.author?.name || 'Membre',
              authorAvatar: rc.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
              content: rc.content,
              timestamp: new Date(rc.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              likes: rc.likes_count || 0,
              replies: []
            });

            const initialReactions: { [postId: string]: PostReactionType } = {};

            fetched = remotePosts.map(rp => {
              const postComments = remoteComments.filter(rc => rc.post_id === rp.id).map(mapComment);
              const topLevelComments = postComments.filter(c => !c.parentCommentId);
              topLevelComments.forEach(c => {
                c.replies = postComments.filter(rc => rc.parentCommentId === c.id);
              });

              const postReactions = remoteReactions.filter(rr => rr.post_id === rp.id);
              const reactionCounts = postReactions.reduce((acc, rr) => {
                acc[rr.type as PostReactionType] = (acc[rr.type as PostReactionType] || 0) + 1;
                return acc;
              }, {} as Record<PostReactionType, number>);
              const mine = postReactions.find(rr => rr.user_id === currentUser.id);
              if (mine) initialReactions[rp.id] = mine.type as PostReactionType;

              // post_documents!post_documents_post_id_fkey renvoie un tableau
              // (relation 1-N côté PostgREST même si l'UI n'affiche qu'un
              // seul document par post pour l'instant) — voir LOOP 01/17.
              const rawDoc = Array.isArray(rp.post_documents) ? rp.post_documents[0] : undefined;
              const document: PostDocument | undefined = rawDoc ? {
                name: rawDoc.name,
                url: rawDoc.url,
                size: typeof rawDoc.size === 'number' ? `${(rawDoc.size / (1024 * 1024)).toFixed(1)} MB` : String(rawDoc.size || ''),
                type: rawDoc.type,
                pageCount: rawDoc.page_count || undefined
              } : undefined;

              return {
                id: rp.id,
                authorId: rp.author_id,
                authorName: rp.author?.name || 'Membre',
                authorAvatar: rp.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
                authorTitle: rp.author?.title || 'Membre Communauté',
                content: rp.content,
                imageUrl: rp.image_url,
                videoUrl: rp.video_url || undefined,
                audioUrl: rp.audio_url || undefined,
                document,
                category: rp.category || 'Général',
                tags: rp.tags || [],
                visibility: rp.visibility || 'public',
                status: rp.status || 'published',
                format: rp.format || 'text',
                scheduledAt: rp.scheduled_at || undefined,
                sourceType: rp.source_type || undefined,
                sourceId: rp.source_id || undefined,
                timestamp: new Date(rp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                likes: postReactions.length,
                comments: postComments.length,
                reactions: reactionCounts,
                commentsList: topLevelComments
              };
            });

            setUserReactions(prev => ({ ...prev, ...initialReactions }));
          }
          } catch (err) {
            // Lecture serveur échouée (réseau instable) : on le SAIT désormais
            // (getPosts lève au lieu de renvoyer [] en silence) — repli cache.
            console.warn('Flux : lecture serveur échouée, repli sur le cache local', err);
          }
        }

        if (serverFetchSucceeded) {
          // Vérité serveur : synchroniser le cache local pour que le repli
          // hors-ligne montre la MÊME liste — purge les posts fantômes
          // pré-correctif (ids non-UUID) et les copies de posts supprimés.
          cloudService.replaceAllPosts(fetched).catch(() => {});
        } else if (fetched.length === 0) {
          fetched = await cloudService.getAllPosts();
        }

        if (fetched && fetched.length > 0) {
          const merged = [...fetched];
          INITIAL_POSTS.forEach(initP => {
            if (!merged.some(p => p.id === initP.id)) {
              merged.push(initP);
            }
          });
          setPosts(merged);
        } else {
          setPosts(INITIAL_POSTS);
        }

        // 2. Fetch Stories from Supabase if connected — la table `stories`
        // existe et est RLS-protégée depuis le début du projet mais n'était
        // jamais consommée par le client avant cette LOOP (voir handleCreateStory).
        // `getStories()` filtre déjà `expires_at > now()` côté requête.
        if (supabaseService.isConfigured()) {
          try {
            const remoteStories = await supabaseService.getStories();
            if (remoteStories && remoteStories.length > 0) {
              rawAuthoredRows.push(...remoteStories);
              const mappedStories: Story[] = remoteStories.map((rs: any) => ({
                id: rs.id,
                author: rs.author?.name || 'Membre',
                authorId: rs.author_id,
                avatar: rs.author?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
                isLive: !!rs.is_live,
                mediaUrl: rs.media_url,
                caption: rs.caption || undefined,
                timestamp: new Date(rs.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                viewersCount: rs.viewers_count || 0
              }));
              setStories(mappedStories);
            }
          } catch (e) {
            console.warn('Could not fetch stories from Supabase', e);
          }
        }

        // 2bis. ÉQUIPE 11 « Identité des publications » : les embeds
        // `author:profiles!...` sont soumis à `profiles_select_visible`
        // (profil 'public' OU amitié acceptée — 'network' est le défaut réel),
        // donc NULL pour tout auteur non-ami alors que la RLS des posts laisse
        // voir la publication. UN SEUL appel batché au RPC
        // `get_content_author_profiles` (SECURITY DEFINER étroit : nom/avatar/
        // titre uniquement, et uniquement pour les auteurs d'un contenu
        // réellement visible par l'appelant) complète les identités réelles.
        // Le repli « Membre » ne reste que pour un auteur réellement
        // introuvable (compte supprimé).
        if (supabaseService.isConfigured()) {
          try {
            const missingAuthorIds = collectMissingAuthorIds(rawAuthoredRows);
            if (missingAuthorIds.length > 0) {
              const authorProfiles = await supabaseService.getContentAuthorProfiles(missingAuthorIds);
              if (authorProfiles.length > 0) {
                const authorMap = buildAuthorProfileMap(authorProfiles);
                setPosts(prev => mergePostsWithAuthorProfiles(prev, authorMap));
                setStories(prev => mergeStoriesWithAuthorProfiles(prev, authorMap));
              }
            }
          } catch (e) {
            // Échec non bloquant : le fil reste affiché avec le repli générique.
            console.warn('Identité des auteurs non résolue (repli générique conservé)', e);
          }
        }

        // 3. Fetch Members from Supabase if connected
        await loadMembers();
      } catch (e) {
        console.warn("Using default initial posts", e);
        setPosts(INITIAL_POSTS);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    fetchPostsAndMembers();
  }, []);

  // Recommandation explicable, sans fuite d'information privée — LOOP
  // 05/17 : un nombre d'amis en commun (jamais leur identité) pour les
  // suggestions actuellement affichées, borné à 4 appels.
  useEffect(() => {
    if (!currentUser.id) return;
    const suggested = members.filter(m => m.id !== currentUser.id && isRealMemberId(m.id) && mutualFriendsCounts[m.id] === undefined).slice(0, 4);
    if (suggested.length === 0) return;
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(suggested.map(async (m) => [m.id, await supabaseService.getMutualFriendsCount(currentUser.id!, m.id)] as const));
      if (!cancelled) {
        setMutualFriendsCounts(prev => {
          const next = { ...prev };
          entries.forEach(([id, count]) => { next[id] = count; });
          return next;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [members, currentUser.id]);

  // Filter posts dynamically based on selected feed filter & search
  const filteredPosts = posts.filter(post => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = post.content.toLowerCase().includes(q) || 
                        post.authorName.toLowerCase().includes(q) ||
                        post.tags?.some(t => t.toLowerCase().includes(q)) ||
                        post.category?.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    if (feedFilter === 'following') {
      const followedMemberIds = members.filter(m => m.isFollowing).map(m => m.id);
      return (post.authorId && followedMemberIds.includes(post.authorId)) || post.authorId === 'u1';
    }
    if (feedFilter === 'tech') return post.category?.toLowerCase().includes('tech') || post.tags?.some(t => t.toLowerCase().includes('tech'));
    if (feedFilter === 'legal') return post.category?.toLowerCase().includes('juridique') || post.tags?.some(t => t.toLowerCase().includes('visa') || t.toLowerCase().includes('droit'));
    if (feedFilter === 'business') return post.category?.toLowerCase().includes('entrepreneuriat') || post.tags?.some(t => t.toLowerCase().includes('startup') || t.toLowerCase().includes('agritech'));
    
    return true; // 'for_you' & 'community' show all with high relevance
  });

  // Demandes d'amis : envoi / annulation / acceptation / refus / suppression.
  // Les membres de démonstration (MOCK_MEMBERS, ids 'u2'/'u3'/...) n'ont pas
  // de ligne réelle dans `profiles` — leur clic reste local uniquement,
  // exactement comme pour isRealPostId côté posts.
  const isRealMemberId = (id: string) => UUID_RE.test(id);

  const handleFriendAction = async (memberId: string, action: 'send' | 'cancel' | 'accept' | 'decline' | 'remove') => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const canSync = supabaseService.isConfigured() && !!currentUser.id && isRealMemberId(memberId);

    if (action === 'send') {
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, friendshipStatus: 'pending_sent' } : m));
      if (canSync) {
        try {
          await supabaseService.sendFriendRequest(currentUser.id!, memberId);
          const refreshed = await supabaseService.getFriendshipsForUser(currentUser.id!);
          setFriendships(refreshed);
          const rel = refreshed.find((f: any) => f.requester_id === memberId || f.addressee_id === memberId);
          setMembers(prev => prev.map(m => m.id === memberId ? {
            ...m,
            friendshipId: rel?.id,
            friendshipStatus: rel?.status === 'accepted' ? 'friends' : 'pending_sent',
            isFollowing: rel?.status === 'accepted'
          } : m));
        } catch (err) {
          console.warn('Could not send friend request', err);
          setMembers(prev => prev.map(m => m.id === memberId ? { ...m, friendshipStatus: 'none' } : m));
        }
      }
      return;
    }

    // accept / decline / cancel / remove agissent tous sur une relation déjà
    // existante (friendshipId) — pas d'action possible sans elle.
    const friendshipId = member.friendshipId;
    if (action === 'accept') {
      const previous = members.find(m => m.id === memberId);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, friendshipStatus: 'friends', isFollowing: true } : m));
      if (canSync && friendshipId) {
        try {
          await supabaseService.acceptFriendRequest(friendshipId);
        } catch (err) {
          // Une amitié affichée mais jamais enregistrée est un mensonge à
          // deux : l'autre personne ne devient jamais votre amie et ne le
          // saura jamais. On rétablit l'état réel plutôt que de laisser
          // croire à une acceptation.
          console.warn('Could not accept friend request', err);
          setMembers(prev => prev.map(m => m.id === memberId ? {
            ...m,
            friendshipStatus: previous?.friendshipStatus ?? 'pending_received',
            isFollowing: previous?.isFollowing ?? false
          } : m));
          alert("L'acceptation n'a pas pu être enregistrée. La demande est toujours en attente — réessayez.");
        }
      }
      return;
    }

    // cancel (demande envoyée par moi), decline (demande reçue) et remove
    // (ami existant) suppriment tous la même ligne côté base.
    const beforeRemoval = members.find(m => m.id === memberId);
    setMembers(prev => prev.map(m => m.id === memberId ? {
      ...m,
      friendshipStatus: 'none',
      friendshipId: undefined,
      isFollowing: false,
      followersCount: action === 'remove' ? Math.max(0, m.followersCount - 1) : m.followersCount
    } : m));
    if (canSync && friendshipId) {
      try {
        await supabaseService.removeFriendship(friendshipId);
      } catch (err) {
        // Même principe : une relation retirée à l'écran mais toujours
        // présente en base réapparaît au rechargement suivant.
        console.warn('Could not remove friendship', err);
        if (beforeRemoval) setMembers(prev => prev.map(m => m.id === memberId ? beforeRemoval : m));
        alert("La modification n'a pas pu être enregistrée. Réessayez.");
      }
    }
  };

  // Abonnement (follow) — LOOP 04/17. Modèle unilatéral et réel, distinct
  // de l'amitié : ne touche jamais friendshipStatus.
  const handleToggleFollow = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member) return;
    const nextFollowing = !member.isFollowing;
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isFollowing: nextFollowing } : m));
    if (supabaseService.isConfigured() && currentUser.id && isRealMemberId(memberId)) {
      try {
        if (nextFollowing) {
          await supabaseService.followUser(currentUser.id, memberId);
        } else {
          await supabaseService.unfollowUser(currentUser.id, memberId);
        }
      } catch (err) {
        console.warn('Could not update follow state', err);
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isFollowing: !nextFollowing } : m));
        if (nextFollowing) alert("Impossible de suivre ce membre pour le moment.");
      }
    }
  };

  // Blocage — LOOP 04/17. Action forte et personnelle, distincte du
  // signalement (qui remonte à la modération) : confirmée explicitement
  // car elle met fin, dans le même geste, à toute amitié/abonnement.
  const handleBlockUser = async (memberId: string) => {
    const member = members.find(m => m.id === memberId);
    if (!member || !currentUser.id || !isRealMemberId(memberId)) return;
    if (!window.confirm(`Bloquer ${member.name} ? Cela mettra fin à votre amitié et à tout abonnement mutuel, et l'empêchera de vous contacter ou de vous envoyer une demande. Vous pourrez débloquer cette personne à tout moment.`)) return;
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isBlockedByMe: true, friendshipStatus: 'none', friendshipId: undefined, isFollowing: false } : m));
    setSelectedMemberForProfile(null);
    try {
      await supabaseService.blockUser(currentUser.id, memberId);
    } catch (err) {
      // Un blocage affiché mais jamais enregistré est le plus dangereux des
      // faux succès de cet écran : la personne peut toujours écrire, suivre
      // et envoyer des demandes, alors que l'utilisateur se croit protégé.
      // On rétablit l'état réel et on le dit clairement.
      console.warn('Could not block user', err);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isBlockedByMe: false } : m));
      alert(`Le blocage n'a PAS pu être enregistré. ${member.name} n'est donc pas bloqué(e) et peut toujours vous contacter. Réessayez.`);
    }
  };

  const handleUnblockUser = async (memberId: string) => {
    if (!currentUser.id || !isRealMemberId(memberId)) return;
    setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isBlockedByMe: false } : m));
    try {
      await supabaseService.unblockUser(currentUser.id, memberId);
    } catch (err) {
      console.warn('Could not unblock user', err);
      setMembers(prev => prev.map(m => m.id === memberId ? { ...m, isBlockedByMe: true } : m));
      alert("Le déblocage n'a pas pu être enregistré. La personne reste bloquée — réessayez.");
    }
  };

  // Recherche de personnes — LOOP 05/17. Une requête vide revient à la
  // liste par défaut (comportement historique), jamais un fil vide.
  const runMemberSearch = (query: string) => {
    loadMembers(query.trim() || undefined);
  };

  // Reactions Handler
  const handleReaction = async (postId: string, reactionType: PostReactionType) => {
    const currentReaction = userReactions[postId];
    const newReactionsMap = { ...userReactions };
    const isRemoving = currentReaction === reactionType;

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const reactions = { ...(post.reactions || { like: post.likes || 0 }) };

    if (currentReaction === reactionType) {
      // Remove reaction
      delete newReactionsMap[postId];
      reactions[reactionType] = Math.max(0, (reactions[reactionType] || 1) - 1);
    } else {
      // Add or Change reaction
      if (currentReaction && reactions[currentReaction]) {
        reactions[currentReaction] = Math.max(0, reactions[currentReaction] - 1);
      }
      newReactionsMap[postId] = reactionType;
      reactions[reactionType] = (reactions[reactionType] || 0) + 1;
    }

    setUserReactions(newReactionsMap);
    setShowReactionPickerForPost(null);

    const totalLikes = Object.values(reactions).reduce<number>((a, b) => a + (Number(b) || 0), 0);
    const updatedPost: Post = {
      ...post,
      likes: totalLikes,
      reactions
    };

    const newPosts = [...posts];
    newPosts[postIndex] = updatedPost;
    setPosts(newPosts);
    cloudService.savePost(updatedPost);

    if (supabaseService.isConfigured() && currentUser.id && isRealPostId(postId)) {
      try {
        if (isRemoving) {
          await supabaseService.removeReaction(postId, currentUser.id);
        } else {
          await supabaseService.setReaction(postId, currentUser.id, reactionType);
        }
      } catch (err) {
        // Une réaction est une action à faible enjeu : pas d'alerte
        // bloquante (« un like n'a pas besoin d'un accusé », principe déjà
        // retenu pour les notifications), mais l'état local revient à la
        // vérité serveur plutôt que d'afficher un compteur inventé qui
        // disparaîtrait au rechargement.
        console.warn('Could not sync reaction to Supabase', err);
        setUserReactions(userReactions);
        const reverted = [...posts];
        reverted[postIndex] = post;
        setPosts(reverted);
      }
    }
  };

  // Toggle Bookmark
  const handleToggleBookmark = (postId: string) => {
    if (bookmarkedPosts.includes(postId)) {
      setBookmarkedPosts(bookmarkedPosts.filter(id => id !== postId));
    } else {
      setBookmarkedPosts([...bookmarkedPosts, postId]);
    }
  };

  // Comments & Replies
  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const currentComments = post.commentsList || [];
    const commentContent = commentInput.trim();
    const canSyncToSupabase = supabaseService.isConfigured() && !!currentUser.id && isRealPostId(postId);

    if (replyingToCommentId) {
      // Add nested reply
      const parentCommentId = replyingToCommentId;
      const newReply: Comment = {
        id: `reply-${Date.now()}`,
        parentCommentId,
        postId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatarUrl,
        content: commentContent,
        timestamp: 'À l\'instant',
        likes: 0
      };

      if (canSyncToSupabase) {
        try {
          const inserted = await supabaseService.createComment({
            post_id: postId,
            author_id: currentUser.id!,
            content: commentContent,
            parent_comment_id: parentCommentId
          });
          if (!inserted) throw new Error('createComment returned no row');
          newReply.id = inserted.id;
        } catch (err) {
          // Même défaut que la publication elle-même : une réponse affichée
          // sans avoir été enregistrée disparaît au rechargement et n'est
          // jamais vue par personne d'autre.
          console.warn('Could not sync reply to Supabase', err);
          alert("Votre réponse n'a pas pu être publiée. Réessayez.");
          return;
        }
      }

      const updatedList = currentComments.map(c => {
        if (c.id === parentCommentId) {
          return {
            ...c,
            replies: [...(c.replies || []), newReply]
          };
        }
        return c;
      });

      const updatedPost: Post = {
        ...post,
        comments: post.comments + 1,
        commentsList: updatedList
      };

      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      setPosts(newPosts);
      cloudService.savePost(updatedPost);
      setReplyingToCommentId(null);
    } else {
      // Add top-level comment
      const newCmt: Comment = {
        id: `cmt-${Date.now()}`,
        postId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatarUrl,
        content: commentContent,
        timestamp: 'À l\'instant',
        likes: 0,
        replies: []
      };

      if (canSyncToSupabase) {
        try {
          const inserted = await supabaseService.createComment({
            post_id: postId,
            author_id: currentUser.id!,
            content: commentContent
          });
          if (!inserted) throw new Error('createComment returned no row');
          newCmt.id = inserted.id;
        } catch (err) {
          // Idem : ne jamais afficher un commentaire qui n'existe pas
          // réellement côté serveur — il serait invisible pour l'auteur du
          // post comme pour tout le monde, et disparaîtrait au rechargement.
          console.warn('Could not sync comment to Supabase', err);
          alert("Votre commentaire n'a pas pu être publié. Réessayez.");
          return;
        }
      }

      const updatedPost: Post = {
        ...post,
        comments: post.comments + 1,
        commentsList: [newCmt, ...currentComments]
      };

      const newPosts = [...posts];
      newPosts[postIndex] = updatedPost;
      setPosts(newPosts);
      cloudService.savePost(updatedPost);
    }

    setCommentInput('');
  };

  // Upload Handlers — aperçu local léger (objectURL) + fichier brut conservé
  // pour un vrai upload Supabase Storage au moment de la publication
  // (LOOP 01/17, moteur de contenu unifié). Remplace le pattern base64
  // historique : plus léger en mémoire, et surtout l'URL finale persistée
  // sera une vraie URL hébergée qui survit au rechargement, pas un blob/
  // data URL local.
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostImageFile(file);
      setNewPostImage(URL.createObjectURL(file));
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewPostVideoFile(file);
      setNewPostVideo(URL.createObjectURL(file));
    }
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      setNewPostDocumentFile(file);
      setNewPostDocument({
        name: file.name,
        size: sizeStr,
        url: URL.createObjectURL(file),
        type: file.name.endsWith('.pdf') ? 'pdf' : 'doc',
        pageCount: 1
      });
    }
  };

  // Apply AI Enhanced Post
  const handleApplyAIEnhancement = (enhancedText: string, tags?: string[], generatedImageUrl?: string) => {
    setNewPostContent(enhancedText);
    if (tags) setNewPostTags(tags);
    if (generatedImageUrl) setNewPostImage(generatedImageUrl);
  };

  // Create Post Submit — `asDraft` implémente la distinction absolue
  // « préparer ≠ publier » du moteur de contenu unifié (LOOP 01/17) : un
  // brouillon est écrit avec status='draft' et n'est jamais visible par
  // personne d'autre que son auteur (voir la policy RLS posts_select_visible,
  // corrigée dans cette même LOOP pour ne plus dépendre uniquement de
  // `visibility`).
  // Renvoie le résultat RÉEL de la publication (LOOP Architecte — pont
  // d'exécution) : le bus de capacités doit pouvoir rapporter `done` ou
  // `failed` selon ce qui s'est vraiment passé, jamais un succès supposé.
  // Les appelants existants (boutons du composeur, dispatcher vocal)
  // ignorent simplement la valeur — comportement inchangé pour eux.
  const resetComposer = () => {
    setNewPostContent('');
    setNewPostImage(null);
    setNewPostVideo(null);
    setNewPostDocument(null);
    setNewPostImageFile(null);
    setNewPostVideoFile(null);
    setNewPostDocumentFile(null);
    setNewPostTags([]);
    setIsComposerFocused(false);
  };

  /**
   * Trois issues distinctes, jamais réduites à un booléen : `queued` est un
   * état réel — la publication n'est ni partie ni perdue — et le confondre
   * avec `published` serait exactement le faux succès que ce fichier évite
   * partout ailleurs.
   */
  const handlePublishPost = async (asDraft: boolean = false): Promise<'published' | 'queued' | 'failed'> => {
    if (!newPostContent.trim() && !newPostImage && !newPostVideo && !newPostDocument) return 'failed';

    setIsPublishing(true);

    let finalImageUrl = newPostImage || undefined;
    let finalVideoUrl = newPostVideo || undefined;
    let finalDocument = newPostDocument || undefined;
    const canUpload = supabaseService.isConfigured() && !!currentUser.id;

    if (canUpload) {
      // Upload réel vers Supabase Storage (LOOP 01/17) — uniquement pour les
      // fichiers sélectionnés localement ; une image déjà hébergée (générée
      // par l'IA via handleApplyAIEnhancement, par ex.) n'est jamais
      // re-uploadée. Résilience (LOOP 03/17) : `newPostImage`/`newPostVideo`
      // ne sont, à ce stade, que des objectURL locaux (voir
      // handleImageSelect/handleVideoSelect) qui ne survivraient ni à un
      // rechargement de page ni à un autre utilisateur — un échec d'upload
      // doit donc annuler la publication plutôt que d'enregistrer cette
      // référence morte comme si elle était valide (jamais de faux succès).
      try {
        if (newPostImageFile) {
          const url = await supabaseService.uploadContentMedia(currentUser.id!, newPostImageFile, 'posts');
          if (!url) throw new Error('upload image failed');
          finalImageUrl = url;
        }
        if (newPostVideoFile) {
          const url = await supabaseService.uploadContentMedia(currentUser.id!, newPostVideoFile, 'posts');
          if (!url) throw new Error('upload video failed');
          finalVideoUrl = url;
        }
        if (newPostDocumentFile && newPostDocument) {
          const url = await supabaseService.uploadContentMedia(currentUser.id!, newPostDocumentFile, 'documents');
          if (!url) throw new Error('upload document failed');
          finalDocument = { ...newPostDocument, url };
        }
      } catch (err) {
        console.warn('Could not upload post media to Supabase Storage', err);
        alert("L'envoi du média a échoué (connexion instable ?). La publication n'a pas été enregistrée — réessayez.");
        setIsPublishing(false);
        return 'failed';
      }
    } else if (newPostImageFile || newPostVideoFile || newPostDocumentFile) {
      // Pas de session Supabase active (mode démo/hors ligne) : repli sur le
      // comportement historique — une Data URL base64 auto-suffisante
      // (contrairement à un objectURL, elle survit au rechargement de page
      // et à la persistance IndexedDB via cloudService, cf. LOOP 03/17).
      const toDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => (typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('read failed')));
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
      try {
        if (newPostImageFile) finalImageUrl = await toDataUrl(newPostImageFile);
        if (newPostVideoFile) finalVideoUrl = await toDataUrl(newPostVideoFile);
        if (newPostDocumentFile && newPostDocument) finalDocument = { ...newPostDocument, url: await toDataUrl(newPostDocumentFile) };
      } catch (err) {
        console.warn('Could not read local media file', err);
        alert("La lecture du fichier a échoué. Réessayez.");
        setIsPublishing(false);
        return 'failed';
      }
    }

    const format: string = finalVideoUrl ? 'video' : finalDocument ? 'document' : finalImageUrl ? 'image' : 'text';

    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id || 'u1',
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorTitle: currentUser.title || 'Membre Communauté',
      content: newPostContent,
      imageUrl: finalImageUrl,
      videoUrl: finalVideoUrl,
      document: finalDocument,
      category: newPostCategory,
      tags: newPostTags.length > 0 ? newPostTags : undefined,
      visibility: newPostVisibility,
      status: asDraft ? 'draft' : 'published',
      format: format as Post['format'],
      timestamp: asDraft ? 'Brouillon' : 'À l\'instant',
      likes: 0,
      comments: 0,
      shares: 0,
      reactions: { like: 0, love: 0, celebrate: 0, insightful: 0, support: 0, fire: 0 },
      commentsList: []
    };

    if (canUpload) {
      try {
        const inserted = await supabaseService.createPost({
          author_id: currentUser.id,
          content: newPost.content,
          image_url: newPost.imageUrl,
          video_url: newPost.videoUrl,
          category: newPost.category,
          tags: newPost.tags || [],
          visibility: newPost.visibility,
          status: newPost.status,
          format: newPost.format
        });
        if (!inserted) throw new Error('createPost returned no row');
        newPost.id = inserted.id;
        if (finalDocument) {
          try {
            await supabaseService.createPostDocument({
              post_id: inserted.id,
              name: finalDocument.name,
              url: finalDocument.url,
              size: newPostDocumentFile?.size ?? 0,
              type: finalDocument.type,
              page_count: finalDocument.pageCount
            });
          } catch (docErr) {
            console.warn('Post created but its document could not be attached', docErr);
          }
        }
      } catch (err) {
        // Hors-ligne : la publication n'est ni partie ni perdue — elle entre
        // dans la file de synchronisation de l'Architecte et sera envoyée
        // automatiquement au retour du réseau, avec son identifiant de tâche
        // comme ancre d'idempotence (jamais de doublon si le rejeu croise une
        // écriture qui avait finalement abouti).
        //
        // Uniquement pour un contenu SANS fichier local : un média
        // sélectionné sur l'appareil ne peut pas être mis en file — il ne
        // survivrait pas au rechargement de la page, et le stockage du
        // navigateur n'est pas dimensionné pour des vidéos. On le dit
        // franchement plutôt que de promettre un envoi qui n'aurait pas lieu.
        const hasLocalMedia = !!(newPostImageFile || newPostVideoFile || newPostDocumentFile);
        if (!checkNetworkStatus() && !hasLocalMedia) {
          const queuedId = addToQueue('CREATE_POST', {
            authorId: currentUser.id,
            content: newPostContent,
            visibility: newPostVisibility,
            status: asDraft ? 'draft' : 'published',
            category: newPostCategory,
            tags: newPostTags,
            format,
          });
          if (queuedId) {
            alert("Vous êtes hors ligne. Votre publication est mise en attente et partira automatiquement dès le retour du réseau.");
            resetComposer();
            setIsPublishing(false);
            return 'queued';
          }
          // `addToQueue` a renvoyé null : le stockage du navigateur a refusé
          // d'enregistrer. On ne prétend surtout pas que c'est en attente.
        }
        // Ne jamais faire croire à une publication réussie si l'écriture en
        // base a réellement échoué (ex. contrainte de visibilité) — même
        // discipline que l'échec d'upload média ci-dessus : on annule
        // plutôt que d'ajouter un post fantôme à l'état local/IndexedDB.
        console.warn('Could not save post to Supabase', err);
        alert(
          checkNetworkStatus()
            ? "La publication a échoué (le serveur a refusé l'enregistrement). Réessayez."
            : "Vous êtes hors ligne et cette publication n'a pas pu être mise en attente. Réessayez une fois reconnecté."
        );
        setIsPublishing(false);
        return 'failed';
      }
    }

    // Un brouillon n'apparaît pas dans le fil (il n'est visible que par son
    // auteur, sur un futur écran de gestion de brouillons — LOOP 02/17) :
    // ne l'ajoute pas à l'état local `posts` du fil principal.
    if (!asDraft) {
      const updatedPosts = [newPost, ...posts];
      setPosts(updatedPosts);
      await cloudService.savePost(newPost);
    }

    resetComposer();
    setIsPublishing(false);
    return 'published';
  };

  // Create Story Submit — branchement réel sur la table `stories` (LOOP
  // 01/17, moteur de contenu unifié) : cette table existe et est RLS-
  // protégée depuis le début du projet mais n'était jamais consommée par le
  // client (état React local uniquement, perdu au rechargement). `expires_at`
  // est géré par la base (default now()+24h) — aucune logique d'expiration
  // à gérer ici côté client.
  const handleCreateStory = async () => {
    if (!newStoryImage && !newStoryCaption) return;
    const fallbackImage = 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&fit=crop';
    let mediaUrl = newStoryImage || fallbackImage;

    const newStory: Story = {
      id: `story-${Date.now()}`,
      author: currentUser.name,
      authorId: currentUser.id || 'u1',
      avatar: currentUser.avatarUrl,
      mediaUrl,
      caption: newStoryCaption || 'Nouvelle Story Mooc',
      timestamp: 'À l\'instant',
      isLive: false,
      viewersCount: 1
    };

    if (supabaseService.isConfigured() && currentUser.id) {
      try {
        if (newStoryImageFile) {
          const uploaded = await supabaseService.uploadContentMedia(currentUser.id, newStoryImageFile, 'stories');
          if (uploaded) mediaUrl = uploaded;
        }
        const inserted = await supabaseService.createStory({
          author_id: currentUser.id,
          media_url: mediaUrl,
          caption: newStoryCaption || undefined,
          is_live: false
        });
        if (inserted) {
          newStory.id = inserted.id;
          newStory.mediaUrl = mediaUrl;
        }
      } catch (err) {
        console.warn('Could not save story to Supabase', err);
      }
    }

    setStories([newStory, ...stories]);
    setIsCreateStoryOpen(false);
    setNewStoryCaption('');
    setNewStoryImage(null);
    setNewStoryImageFile(null);
  };

  // --- Gouvernance du contenu (LOOP 02/17) : suppression, archivage, partage ---
  const canManagePost = (post: Post) => post.authorId === (currentUser.id || 'u1') || currentUser.role === 'admin';

  const handleDeletePost = async (post: Post) => {
    setOpenPostMenuId(null);
    if (!window.confirm('Supprimer définitivement cette publication ? Cette action est irréversible.')) return;
    if (supabaseService.isConfigured() && isRealPostId(post.id)) {
      try {
        await supabaseService.deletePost(post.id);
      } catch (err) {
        console.warn('Could not delete post from Supabase', err);
        alert('La suppression a échoué. Réessayez.');
        return;
      }
    }
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  // Un post archivé sort immédiatement du fil (même règle côté serveur :
  // getPosts() ne renvoie que status='published', voir services/supabaseClient.ts)
  // — le désarchiver depuis ce fil n'a donc pas de sens ici ; une vraie vue
  // "mes archives" reste à construire (LOOP 03/17) pour le faire.
  const handleArchivePost = async (post: Post) => {
    setOpenPostMenuId(null);
    if (supabaseService.isConfigured() && isRealPostId(post.id)) {
      try {
        await supabaseService.updatePostStatus(post.id, 'archived');
      } catch (err) {
        console.warn('Could not archive post', err);
        alert("L'archivage a échoué. La publication reste visible — réessayez.");
        return;
      }
    }
    setPosts(prev => prev.filter(p => p.id !== post.id));
  };

  // Partage réel (LOOP 02/17, étendu ÉQUIPE F5) : le bouton Partager global
  // (components/ui/ShareButton) diffuse vers les canaux réellement joignables
  // avec un lien de retour attribuable ; l'incrément passe toujours par la
  // fonction serveur qui vérifie elle-même public+publié
  // (services/supabaseClient.ts::sharePost) — jamais un partage silencieux
  // d'un contenu qui ne devrait pas l'être, jamais un compteur inventé.
  const recordPostShare = async (post: Post) => {
    if (post.visibility !== 'public') return; // la RLS protège de toute façon — le compteur ne compte que les partages réellement publics.
    if (supabaseService.isConfigured() && isRealPostId(post.id)) {
      try {
        await supabaseService.sharePost(post.id);
        setPosts(prev => prev.map(p => p.id === post.id ? { ...p, shares: (p.shares || 0) + 1 } : p));
      } catch (err) {
        console.warn('Could not record share', err);
      }
    }
  };

  // --- Création de contenu par la voix (LOOP 03/17, Architecte MOCnet) ---
  // Même triptyque que services/live/liveVoiceCommands.ts + SocialLive.tsx
  // ::dispatchVoiceAction, déjà en production pour le LIVE : interpréter →
  // vérifier → exécuter de façon déterministe. La voix appelle exactement
  // les mêmes setters que les boutons du composeur — aucune logique
  // dupliquée.
  // Renvoie le résultat RÉEL de l'action (LOOP Architecte — pont d'exécution) :
  // le bus de capacités doit rapporter `done`/`failed` selon ce qui s'est
  // vraiment passé. Les cas qui ne font que modifier le composeur réussissent
  // réellement de façon synchrone ; PUBLISH/SAVE_DRAFT attendent le vrai
  // résultat de handlePublishPost, jamais un succès supposé.
  const dispatchContentVoiceAction = async (action: ContentVoiceAction): Promise<{ ok: boolean; message: string; queued?: boolean }> => {
    let lastSaid = '';
    const say = (text: string) => {
      lastSaid = text;
      setVoiceContentFeedback(text);
      voiceAssistant.speak(text);
    };

    switch (action.type) {
      case 'SET_CONTENT':
      case 'REWRITE_STYLE':
      case 'SHORTEN':
      case 'EXPAND':
      case 'TRANSLATE':
        if (action.payload?.text) {
          setNewPostContent(action.payload.text);
          setIsComposerFocused(true);
        }
        say(action.spokenConfirmation);
        break;
      case 'SET_VISIBILITY':
        if (action.payload?.visibility) setNewPostVisibility(action.payload.visibility as PostVisibility);
        say(action.spokenConfirmation);
        break;
      case 'SET_CATEGORY':
        if (action.payload?.category) setNewPostCategory(action.payload.category);
        say(action.spokenConfirmation);
        break;
      case 'ADD_TAGS':
        if (action.payload?.tags?.length) setNewPostTags(prev => Array.from(new Set([...prev, ...action.payload!.tags!])));
        say(action.spokenConfirmation);
        break;
      case 'SAVE_DRAFT': {
        say(action.spokenConfirmation);
        const draftOutcome = await handlePublishPost(true);
        if (draftOutcome === 'queued') {
          return { ok: false, queued: true, message: "Vous êtes hors ligne : le brouillon est en attente et sera enregistré au retour du réseau." };
        }
        return draftOutcome === 'published'
          ? { ok: true, message: 'Brouillon enregistré.' }
          : { ok: false, message: "Le brouillon n'a pas pu être enregistré." };
      }
      case 'PUBLISH': {
        say(action.spokenConfirmation);
        const pubOutcome = await handlePublishPost(false);
        if (pubOutcome === 'queued') {
          return { ok: false, queued: true, message: "Vous êtes hors ligne : votre publication est en attente et partira au retour du réseau." };
        }
        return pubOutcome === 'published'
          ? { ok: true, message: 'Publication enregistrée.' }
          : { ok: false, message: "La publication n'a pas abouti." };
      }
      case 'DISCARD_DRAFT':
        // Action à impact plus élevé (moderate) — confirmation explicite,
        // même règle que handleDeletePost.
        if (window.confirm('Abandonner ce brouillon ? Le contenu saisi sera perdu.')) {
          setNewPostContent('');
          setNewPostImage(null);
          setNewPostVideo(null);
          setNewPostDocument(null);
          setNewPostImageFile(null);
          setNewPostVideoFile(null);
          setNewPostDocumentFile(null);
          setNewPostTags([]);
          setIsComposerFocused(false);
          say(action.spokenConfirmation);
        } else {
          say("D'accord, je garde le brouillon.");
        }
        break;
      case 'DISCOVER_CAPABILITIES':
      case 'ASK_CLARIFICATION':
      case 'UNKNOWN':
      default:
        say(action.spokenConfirmation);
        // Découverte/clarification/incompris : rien n'a été modifié — ce
        // n'est pas un succès d'action, et le dire évite un faux « fait ».
        return { ok: false, message: lastSaid || "Je n'ai pas pu agir sur cette demande." };
    }
    return { ok: true, message: lastSaid || 'Fait.' };
  };

  const handleContentVoiceTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    const action = await interpretContentVoiceCommand(transcript, {
      currentContent: newPostContent,
      currentVisibility: newPostVisibility,
      currentCategory: newPostCategory,
      hasMedia: !!(newPostImage || newPostVideo || newPostDocument),
    });
    dispatchContentVoiceAction(action);
  };

  // Architecte — navigateur social (LOOP 05/17, élargi G4). Résolution du
  // nom vers un membre réel : code déterministe, jamais le LLM (qui n'a
  // fourni que le texte tel qu'énoncé) — 0 correspondance ou plusieurs →
  // clarification, jamais une action devinée sur la mauvaise personne.
  const filterMemberCandidates = (list: MemberProfile[], term: string) =>
    list.filter(m => m.id !== (currentUser.id || 'u1') && m.name.toLowerCase().includes(term));

  // G4 : (a) résolution ÉLARGIE — si aucun VRAI compte ne correspond parmi
  // les membres déjà chargés, une recherche serveur (discover_profiles, le
  // même chemin que le bouton Rechercher) est tentée UNE fois avant
  // d'abandonner ; (b) anti-faux-succès — les membres de démonstration
  // (MOCK_MEMBERS, ids non-UUID, aucune ligne réelle dans `profiles`) sont
  // EXCLUS de la résolution vocale : agir dessus n'écrirait jamais rien en
  // base, et le rapporter comme un succès serait un mensonge.
  const resolveMemberByName = async (
    rawName: string
  ): Promise<{ member: MemberProfile | null; candidates: MemberProfile[]; demoOnly: boolean }> => {
    const term = rawName.trim().toLowerCase();
    if (!term) return { member: null, candidates: [], demoOnly: false };

    let candidates = filterMemberCandidates(members, term);

    if (!candidates.some(m => isRealMemberId(m.id))) {
      const refreshed = await loadMembers(rawName.trim());
      if (refreshed) candidates = filterMemberCandidates(refreshed, term);
    }

    const realCandidates = candidates.filter(m => isRealMemberId(m.id));
    if (realCandidates.length === 0 && candidates.length > 0) {
      // Seuls des profils de démonstration correspondent — refus honnête.
      return { member: null, candidates: [], demoOnly: true };
    }
    return {
      member: realCandidates.length === 1 ? realCandidates[0] : null,
      candidates: realCandidates,
      demoOnly: false,
    };
  };

  // Renvoie le résultat RÉEL (LOOP Architecte — pont d'exécution) : `acted`
  // ne devient vrai que si une action a effectivement été déclenchée sur une
  // personne résolue SANS ambiguïté. Un nom introuvable, ambigu, ou qui ne
  // désigne qu'un profil de démonstration n'est jamais rapporté comme un
  // succès — c'est précisément le cas où agir au hasard serait le plus
  // dommageable.
  const dispatchSocialVoiceAction = async (action: SocialVoiceAction): Promise<{ ok: boolean; message: string }> => {
    let lastSaid = '';
    let acted = false;
    const say = (text: string) => {
      lastSaid = text;
      setVoiceSocialFeedback(text);
      voiceAssistant.speak(text);
    };

    const withResolvedMember = async (fn: (m: MemberProfile) => void) => {
      const name = action.payload?.memberName;
      if (!name) { say('Pour qui ? Dites le nom de la personne.'); return; }
      const { member, candidates, demoOnly } = await resolveMemberByName(name);
      if (member) { acted = true; fn(member); return; }
      if (demoOnly) {
        say(`« ${name} » correspond à un profil de démonstration, pas à un vrai compte — je ne peux pas faire cette action pour de vrai.`);
        return;
      }
      if (candidates.length > 1) {
        say(`Plusieurs personnes correspondent à "${name}" : ${candidates.slice(0, 3).map(c => c.name).join(', ')}. Pouvez-vous préciser ?`);
        return;
      }
      say(`Je ne trouve personne correspondant à "${name}", même en cherchant dans l'annuaire des membres.`);
    };

    switch (action.type) {
      case 'SEND_FRIEND_REQUEST':
        await withResolvedMember((m) => { handleFriendAction(m.id, 'send'); say(action.spokenConfirmation); });
        break;
      case 'ACCEPT_FRIEND_REQUEST':
        await withResolvedMember((m) => {
          if (m.friendshipStatus !== 'pending_received') { acted = false; say(`Aucune demande en attente de ${m.name}.`); return; }
          handleFriendAction(m.id, 'accept'); say(action.spokenConfirmation);
        });
        break;
      case 'DECLINE_FRIEND_REQUEST':
        await withResolvedMember((m) => {
          if (m.friendshipStatus !== 'pending_received') { acted = false; say(`Aucune demande en attente de ${m.name}.`); return; }
          handleFriendAction(m.id, 'decline'); say(action.spokenConfirmation);
        });
        break;
      case 'REMOVE_FRIEND':
        await withResolvedMember((m) => { handleFriendAction(m.id, 'remove'); say(action.spokenConfirmation); });
        break;
      case 'FOLLOW':
        await withResolvedMember((m) => { if (!m.isFollowing) handleToggleFollow(m.id); say(action.spokenConfirmation); });
        break;
      case 'UNFOLLOW':
        await withResolvedMember((m) => { if (m.isFollowing) handleToggleFollow(m.id); say(action.spokenConfirmation); });
        break;
      case 'BLOCK':
        // Réutilise exactement handleBlockUser, qui exige déjà une
        // confirmation explicite (window.confirm) — jamais de bypass vocal
        // pour une action de ce niveau de risque.
        await withResolvedMember((m) => { handleBlockUser(m.id); say(action.spokenConfirmation); });
        break;
      case 'UNBLOCK':
        await withResolvedMember((m) => { handleUnblockUser(m.id); say(action.spokenConfirmation); });
        break;
      case 'SEARCH_PEOPLE':
        if (action.payload?.query) {
          setMemberSearchQuery(action.payload.query);
          runMemberSearch(action.payload.query);
          acted = true;
        }
        say(action.spokenConfirmation);
        break;
      case 'DISCOVER_CAPABILITIES':
      case 'ASK_CLARIFICATION':
      case 'UNKNOWN':
      default:
        say(action.spokenConfirmation);
        break;
    }
    // `acted` reste faux si la personne visée était introuvable, ambiguë ou
    // un profil de démonstration : le message dit alors pourquoi, et le bus
    // rapportera `failed`, jamais un succès qui n'a pas eu lieu.
    return { ok: acted, message: lastSaid || "Je n'ai pas pu agir sur cette demande." };
  };

  // Création d'un LIVE — logique UNIQUE partagée entre la modale de création
  // (LiveCreationModal → onCreateLive, extraite telle quelle de l'ancien
  // callback inline) et la capacité vocale 'live.session.create' (G3) : le
  // direct rejoint le fil et, s'il n'est pas programmé, s'ouvre immédiatement
  // (onOpenLive → SocialLive, qui crée la session réelle côté serveur avec
  // ses propres contrôles — exactement le même chemin que depuis la modale).
  const handleCreateLive = (newLive: LiveStream) => {
    setLives(prev => [newLive, ...prev]);
    if (!newLive.isScheduled) {
      onOpenLive(newLive.id, newLive);
    }
  };

  // --- Pont d'exécution de l'Architecte (LOOP Architecte) ---
  // Cet écran DÉCLARE les capacités qu'il sait exécuter, plutôt que de laisser
  // l'Architecte fouiller dans son état interne. Tant qu'il est monté, ces
  // actions sont pilotables depuis n'importe où (barre Architecte, voix) ;
  // dès qu'il est démonté, le bus les rapporte honnêtement `unavailable`
  // au lieu de faire croire à une exécution.
  //
  // Chaque handler réutilise le dispatcher DÉJÀ testé de son domaine — aucune
  // logique dupliquée, et le résultat renvoyé est celui réellement produit
  // (une personne introuvable ou une publication refusée ne remonte jamais
  // comme un succès).
  useEffect(() => {
    const content = (type: string) => async (payload: any) => {
      const r = await dispatchContentVoiceAction({ type, payload, spokenConfirmation: '' } as any);
      // `queued` remonte tel quel : le bus doit pouvoir dire « mis en
      // attente » plutôt que « terminé » ou « échoué », qui seraient tous
      // deux faux pour une publication qui partira au retour du réseau.
      return { ok: r.ok, message: r.message, queued: r.queued };
    };
    const social = (type: string) => async (payload: any) => {
      const r = await dispatchSocialVoiceAction({ type, payload, spokenConfirmation: '' } as any);
      return { ok: r.ok, message: r.message };
    };
    // G3 — « lance un live » : mêmes valeurs par défaut que le studio de
    // création (LiveCreationModal, type public, copilote IA n°1, non
    // programmé), puis EXACTEMENT le même chemin que la modale
    // (handleCreateLive). La confirmation (risque 'moderate') est posée par
    // l'appelant (cerveau/bus), comme pour toute capacité du registre.
    const createLiveSession = async (payload: any) => {
      try {
        const rawTitle = typeof payload?.title === 'string' ? payload.title.trim() : '';
        const now = new Date();
        const title = rawTitle ||
          `Live de ${currentUser.name} — ${now.toLocaleDateString('fr-FR')} ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
        const assignedAgent = AGENTS.find(a => a.id === '1');
        const newLive: LiveStream = {
          id: `live-${Date.now()}`,
          title,
          description: "Session lancée à la voix via L'Architecte",
          type: 'public',
          hostName: currentUser.name,
          hostAvatar: currentUser.avatarUrl,
          viewers: 1,
          isMixed: true,
          aiAssistantId: assignedAgent?.id,
          startedAt: now,
          isScheduled: false,
          duration: 45,
          isPaid: false,
          language: 'Français',
          targetLanguage: 'Anglais',
          coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&fit=crop',
          isPrivate: false,
          allowedMemberIds: [],
          expertId: assignedAgent?.id,
          isRecordingEnabled: true,
          isTranslationEnabled: true,
          isQuestionsEnabled: true,
          isScreenShareEnabled: true,
          isVisionEnabled: true,
          isDataSaver: false,
          qualityMode: 'auto',
          tags: ['#Live', '#DialloOS', '#RéseauMok'],
          speakers: [
            {
              id: currentUser.id || 'u1',
              name: currentUser.name,
              avatar: currentUser.avatarUrl,
              role: 'host',
              isMuted: false,
              isVideoOn: true,
              isVerified: true
            },
            ...(assignedAgent ? [{
              id: `agent-${assignedAgent.id}`,
              name: `${assignedAgent.name} (IA)`,
              avatar: assignedAgent.avatarUrl,
              role: 'expert_ai' as const,
              isMuted: false,
              isVideoOn: true,
              isAi: true,
              specialty: assignedAgent.specialty,
              agentId: assignedAgent.id
            }] : [])
          ]
        };
        handleCreateLive(newLive);
        return { ok: true, message: `Votre live « ${title} » est créé — il s'ouvre à l'écran.` };
      } catch (e: any) {
        // Jamais ok:true si la création a échoué — la raison réelle remonte.
        return { ok: false, message: e?.message || "La création du live a échoué — rien n'a été ouvert." };
      }
    };
    return registerCapabilityHandlers({
      'live.session.create': createLiveSession,
      'content.post.compose': content('SET_CONTENT'),
      'content.post.rewrite_style': content('REWRITE_STYLE'),
      'content.post.shorten': content('SHORTEN'),
      'content.post.expand': content('EXPAND'),
      'content.post.translate': content('TRANSLATE'),
      'content.post.set_visibility': content('SET_VISIBILITY'),
      'content.post.set_category': content('SET_CATEGORY'),
      'content.post.add_tags': content('ADD_TAGS'),
      'content.post.save_draft': content('SAVE_DRAFT'),
      'content.post.publish': content('PUBLISH'),
      'content.post.discard': content('DISCARD_DRAFT'),
      'social.friend.request': social('SEND_FRIEND_REQUEST'),
      'social.friend.accept': social('ACCEPT_FRIEND_REQUEST'),
      'social.friend.decline': social('DECLINE_FRIEND_REQUEST'),
      'social.friend.remove': social('REMOVE_FRIEND'),
      'social.follow.start': social('FOLLOW'),
      'social.follow.stop': social('UNFOLLOW'),
      'social.block.add': social('BLOCK'),
      'social.block.remove': social('UNBLOCK'),
      'social.people.search': social('SEARCH_PEOPLE'),
    });
  });

  const handleSocialVoiceTranscript = async (transcript: string) => {
    if (!transcript.trim()) return;
    const action = await interpretSocialVoiceCommand(transcript, {
      visibleMemberNames: members.filter(m => m.id !== (currentUser.id || 'u1')).slice(0, 20).map(m => m.name),
    });
    await dispatchSocialVoiceAction(action);
  };

  // Un seul moteur vocal partagé (une capacité, un registre) — le champ
  // vers lequel router la transcription dépend du dernier bouton micro
  // pressé (composeur de contenu vs découverte sociale), jamais deux
  // instances de reconnaissance vocale actives en même temps.
  const voiceIntentScopeRef = useRef<'content' | 'social'>('content');
  const handleVoiceTranscript = async (transcript: string) => {
    if (voiceIntentScopeRef.current === 'social') {
      await handleSocialVoiceTranscript(transcript);
    } else {
      await handleContentVoiceTranscript(transcript);
    }
  };

  const voiceAssistant = useVoiceAssistant({ lang: 'fr-FR', onFinalTranscript: handleVoiceTranscript });
  const startContentVoiceCommand = () => { voiceIntentScopeRef.current = 'content'; voiceAssistant.startListening(); };
  const startSocialVoiceCommand = () => { voiceIntentScopeRef.current = 'social'; voiceAssistant.startListening(); };

  // Open Author Profile Modal
  const handleOpenAuthorProfile = (post: Post) => {
    const foundMember = members.find(m => m.id === post.authorId || m.name === post.authorName);
    if (foundMember) {
      setSelectedMemberForProfile(foundMember);
    } else {
      // Fallback synthetic profile
      setSelectedMemberForProfile({
        id: post.authorId || `u-synth-${Date.now()}`,
        name: post.authorName,
        avatarUrl: post.authorAvatar,
        title: post.authorTitle || 'Membre de la Communauté Mooc',
        bio: 'Membre actif du réseau collaboratif et intelligent Le Monde à Vous.',
        location: 'International',
        joinedDate: '2025',
        isVerified: true,
        isFollowing: false,
        followersCount: 320,
        followingCount: 140,
        postsCount: 1,
        storiesCount: 0,
        reelsCount: 0,
        livesCount: 0,
        privacySettings: {
          profileVisibility: 'public',
          allowMessagesFrom: 'all',
          showOnlineStatus: true,
          allowTagging: true,
          showActivityFeed: true
        }
      });
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-6 space-y-6 animate-fade-in">
      
      {/* 1. TOP HEADER & MAIN NAVIGATION */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Network Brand & Search */}
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <Sparkles size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-slate-900 tracking-tight">Réseau Mooc</h1>
                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-full border border-indigo-200">
                  Collaboratif & Intelligent
                </span>
              </div>
              <p className="text-xs text-slate-500">Le cœur social, multimodal et connecté de la communauté.</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher des posts, opportunités, hashtags..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Hub Navigation & Personal Space Button */}
        <div className="flex items-center gap-2 flex-wrap">
          
          {/* Main Space Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
            <button
              onClick={() => setActiveTab('feed')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'feed' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Fil d'actu
            </button>
            <button
              onClick={() => setActiveTab('reels')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'reels' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Reels
            </button>
            <button
              onClick={() => setActiveTab('lives')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'lives' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Lives
            </button>
            <button
              onClick={() => setActiveTab('tribes')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'tribes' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Tribus
            </button>
            {/* ÉQUIPE F7 — tableau de bord de croissance (mesures réelles) */}
            <button
              onClick={() => setActiveTab('my_space')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${activeTab === 'my_space' ? 'bg-white text-teal-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Croissance
            </button>
          </div>

          {/* Access Mon Espace Personnel */}
          <button
            onClick={() => {
              const myProfile: MemberProfile = {
                id: currentUser.id || 'u1',
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
                title: currentUser.title || (currentUser.role === 'admin' ? 'Superviseur Système' : 'Citoyen du Monde'),
                bio: currentUser.bio || 'Citoyen engagé de la communauté Le Monde à Vous.',
                location: `${currentUser.city || 'Paris'}, ${currentUser.country || 'France'}`,
                joinedDate: '2025',
                isVerified: true,
                isFollowing: false,
                followersCount: 142,
                followingCount: 38,
                postsCount: posts.filter(p => p.authorId === (currentUser.id || 'u1') || p.authorName === currentUser.name).length,
                storiesCount: stories.filter(s => s.author === currentUser.name).length,
                reelsCount: reels.filter(r => r.author === currentUser.name).length,
                livesCount: 0,
                skills: currentUser.skills.map(s => s.name),
                privacySettings: currentUser.privacySettings
              };
              setSelectedMemberForProfile(myProfile);
            }}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-2xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all flex items-center gap-2"
          >
            <img src={currentUser.avatarUrl} className="w-5 h-5 rounded-full object-cover border border-white/60" />
            <span>Mon Espace Personnel</span>
          </button>

        </div>

      </div>

      {/* 2. STORIES RAIL (Instagram / WhatsApp style) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
          
          {/* Add My Story Button */}
          <div 
            onClick={() => setIsCreateStoryOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-400 group-hover:border-indigo-600 bg-indigo-50/50 flex items-center justify-center transition-all">
              <img src={currentUser.avatarUrl} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
                  <Plus size={18} strokeWidth={3} />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[70px]">Ma Story</span>
          </div>

          {/* Active Stories */}
          {stories.map((story, index) => (
            <div
              key={story.id}
              onClick={() => setSelectedStoryIndex(index)}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
            >
              <div className={`p-0.5 rounded-2xl transition-all group-hover:scale-105 ${story.isLive ? 'bg-gradient-to-tr from-rose-500 via-red-500 to-amber-500 animate-pulse' : 'bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600'}`}>
                <div className="w-16 h-16 rounded-[14px] overflow-hidden bg-white p-0.5">
                  <img src={story.avatar} alt={story.author} className="w-full h-full object-cover rounded-[12px]" />
                </div>
              </div>
              <span className="text-[11px] font-semibold text-slate-800 truncate max-w-[72px] text-center">
                {story.author.split(' ')[0]}
              </span>
            </div>
          ))}

        </div>
      </div>

      {/* 3. MAIN CONTENT GRID (FEED OR TABS) */}
      {activeTab === 'feed' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT & CENTER COLUMN: COMPOSER & FEED (Col span 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* A. POST COMPOSER */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              
              {/* Top Row: User Avatar, Input & AI Enhancement Trigger */}
              <div className="flex items-start gap-3.5">
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20" />
                
                <div className="flex-1 space-y-2">
                  <textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    onFocus={() => setIsComposerFocused(true)}
                    placeholder="Quoi de neuf, Amadou ? Partagez une réflexion, opportunité, tutoriel ou document..."
                    rows={isComposerFocused || newPostContent ? 3 : 2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-3 text-xs font-medium text-slate-800 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all resize-none leading-relaxed"
                  />

                  {/* AI Enhancement Quick Action Bar */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    
                    {/* Big AI Assistant Pre-Publication Button */}
                    <button
                      onClick={() => setIsAIModalOpen(true)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 via-indigo-600 to-purple-600 hover:opacity-95 text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center gap-1.5 transition-all group"
                      title="Améliorer le style, traduire, ajouter des hashtags et visuels IA"
                    >
                      <Sparkles size={14} className="text-amber-200 group-hover:rotate-12 transition-transform" />
                      <span>Assistant IA Pré-Publication</span>
                    </button>

                    {/* Visibility & Category Pill */}
                    <div className="flex items-center gap-2">
                      <select
                        value={newPostVisibility}
                        onChange={(e) => setNewPostVisibility(e.target.value as PostVisibility)}
                        className="bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl px-2.5 py-1.5 outline-none border border-slate-200"
                      >
                        <option value="public">🌐 Public</option>
                        <option value="network">👥 Abonnés uniquement</option>
                        <option value="private">🔒 Privé</option>
                      </select>

                      <select
                        value={newPostCategory}
                        onChange={(e) => setNewPostCategory(e.target.value)}
                        className="bg-slate-100 text-slate-700 text-[11px] font-bold rounded-xl px-2.5 py-1.5 outline-none border border-slate-200"
                      >
                        <option value="Tech & Innovation">Tech & Innovation</option>
                        <option value="Juridique & Visas">Juridique & Visas</option>
                        <option value="Entrepreneuriat">Entrepreneuriat</option>
                        <option value="Formation & Campus">Formation & Campus</option>
                        <option value="Logement & Mobilité">Logement & Mobilité</option>
                      </select>
                    </div>

                  </div>
                </div>
              </div>

              {/* Attachments Preview (Images / Videos / Documents / Tags) */}
              {(newPostImage || newPostVideo || newPostDocument || newPostTags.length > 0) && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  
                  {/* Image Preview */}
                  {newPostImage && (
                    <div className="relative rounded-xl overflow-hidden max-h-56 bg-slate-900 group">
                      <img src={newPostImage} className="w-full h-full object-cover" />
                      <button 
                        onClick={() => setNewPostImage(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Video Preview */}
                  {newPostVideo && (
                    <div className="relative rounded-xl overflow-hidden max-h-56 bg-slate-900 group">
                      <video src={newPostVideo} controls className="w-full h-full" />
                      <button 
                        onClick={() => setNewPostVideo(null)}
                        className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-all"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Document Preview */}
                  {newPostDocument && (
                    <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 truncate">
                        <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs">
                          {newPostDocument.type.toUpperCase()}
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-bold text-slate-800 truncate">{newPostDocument.name}</div>
                          <div className="text-[10px] text-slate-500">{newPostDocument.size}</div>
                        </div>
                      </div>
                      <button onClick={() => setNewPostDocument(null)} className="p-1 text-slate-400 hover:text-slate-600">
                        <X size={14} />
                      </button>
                    </div>
                  )}

                  {/* Tags Preview */}
                  {newPostTags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {newPostTags.map(tag => (
                        <span key={tag} className="px-2.5 py-0.5 bg-indigo-100 text-indigo-700 text-[10px] font-bold rounded-md">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                </div>
              )}

              {/* Retour de la dernière commande vocale (LOOP 03/17) — toujours visible en plus d'être dit à voix haute */}
              {voiceContentFeedback && (
                <div className="flex items-center justify-between gap-2 px-3 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><Mic size={13} /> {voiceContentFeedback}</span>
                  <button onClick={() => setVoiceContentFeedback(null)} className="text-indigo-400 hover:text-indigo-700">
                    <X size={13} />
                  </button>
                </div>
              )}

              {/* Bottom Toolbar: Upload Buttons & Submit */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                
                {/* Hidden File Inputs */}
                <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
                <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoSelect} className="hidden" />
                <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.zip" onChange={handleDocSelect} className="hidden" />

                {/* Upload Buttons */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => imageInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold"
                    title="Ajouter une photo"
                  >
                    <ImageIcon size={17} className="text-emerald-500" />
                    <span className="hidden sm:inline">Photo</span>
                  </button>

                  <button
                    onClick={() => videoInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold"
                    title="Ajouter une vidéo"
                  >
                    <Video size={17} className="text-sky-500" />
                    <span className="hidden sm:inline">Vidéo</span>
                  </button>

                  <button
                    onClick={() => docInputRef.current?.click()}
                    className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold"
                    title="Joindre un document PDF / Word"
                  >
                    <FileText size={17} className="text-amber-500" />
                    <span className="hidden sm:inline">Document</span>
                  </button>

                  {/* Création de contenu par la voix (LOOP 03/17) — même hook que le LIVE (hooks/useVoiceAssistant.ts) */}
                  {voiceAssistant.isSupported && (
                    <button
                      onClick={() => (voiceAssistant.isListening ? voiceAssistant.stopListening() : startContentVoiceCommand())}
                      className={`p-2 rounded-xl transition-all flex items-center gap-1 text-xs font-semibold ${voiceAssistant.isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'text-slate-500 hover:text-indigo-600 hover:bg-indigo-50'}`}
                      title="Dicter ou commander la rédaction par la voix"
                    >
                      <Mic size={17} />
                      <span className="hidden sm:inline">{voiceAssistant.isListening ? 'Écoute...' : 'Voix'}</span>
                    </button>
                  )}
                </div>

                {/* Brouillon / Publier — distinction absolue "préparer ≠ publier" (LOOP 01/17) */}
                <button
                  onClick={() => handlePublishPost(true)}
                  disabled={isPublishing || (!newPostContent.trim() && !newPostImage && !newPostVideo && !newPostDocument)}
                  title="Enregistrer comme brouillon — jamais visible par les autres membres"
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  <span>Brouillon</span>
                </button>

                {/* Submit Button */}
                <button
                  onClick={() => handlePublishPost(false)}
                  disabled={isPublishing || (!newPostContent.trim() && !newPostImage && !newPostVideo && !newPostDocument)}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  {isPublishing ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  <span>Publier</span>
                </button>

              </div>

            </div>

            {/* B. FEED FILTERS BAR */}
            <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide py-1">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'for_you', label: '✨ Pour vous (IA)' },
                  { id: 'following', label: '👥 Abonnements' },
                  { id: 'community', label: '🌐 Communauté' },
                  { id: 'tech', label: '💻 Tech & IA' },
                  { id: 'legal', label: '⚖️ Visas & Droit' },
                  { id: 'business', label: '🌱 Entrepreneuriat' }
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setFeedFilter(filter.id as any)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap ${feedFilter === filter.id ? 'bg-indigo-600 text-white shadow-xs' : 'bg-white text-slate-600 border border-slate-200 hover:border-indigo-300'}`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>

            {/* C. POSTS STREAM */}
            <div className="space-y-5">
              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm space-y-3">
                  <div className="w-16 h-16 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Sparkles size={28} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">Aucune publication dans cette catégorie</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Abonnez-vous à d'autres membres ou changez de filtre pour découvrir de nouveaux partages.
                  </p>
                </div>
              ) : (
                filteredPosts.map(post => {
                  const currentReaction = userReactions[post.id];
                  const isBookmarked = bookmarkedPosts.includes(post.id);
                  const isExpanded = expandedPostId === post.id;

                  return (
                    <article 
                      key={post.id} 
                      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4 transition-all hover:shadow-md"
                    >
                      
                      {/* Post Header */}
                      <div className="flex items-center justify-between">
                        
                        {/* Author Info */}
                        <div 
                          className="flex items-center gap-3 cursor-pointer group"
                          onClick={() => handleOpenAuthorProfile(post)}
                        >
                          <img 
                            src={post.authorAvatar} 
                            alt={post.authorName} 
                            className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20 group-hover:scale-105 transition-transform" 
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h4 className="font-extrabold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors">
                                {post.authorName}
                              </h4>
                              {post.agentId && (
                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-800 text-[9px] font-black rounded-md flex items-center gap-1">
                                  <Sparkles size={10} /> Expert IA
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>{post.timestamp}</span>
                              <span>•</span>
                              <span className="flex items-center gap-1">
                                {post.visibility === 'network' ? <Users size={11} /> : post.visibility === 'private' ? <Lock size={11} /> : <Globe size={11} />}
                                <span className="capitalize">{post.visibility || 'Public'}</span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Category & Badge */}
                        <div className="flex items-center gap-2">
                          {post.category && (
                            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-lg">
                              {post.category}
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleBookmark(post.id)}
                            className={`p-2 rounded-xl transition-colors ${isBookmarked ? 'bg-amber-50 text-amber-600' : 'text-slate-400 hover:bg-slate-100'}`}
                            title="Enregistrer dans mes favoris"
                          >
                            <Bookmark size={16} fill={isBookmarked ? 'currentColor' : 'none'} />
                          </button>

                          {/* Menu Archiver/Supprimer — auteur ou admin uniquement (LOOP 02/17, gouvernance du contenu) */}
                          {canManagePost(post) && (
                            <div className="relative">
                              <button
                                onClick={() => setOpenPostMenuId(openPostMenuId === post.id ? null : post.id)}
                                className="p-2 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                                title="Plus d'options"
                              >
                                <MoreVertical size={16} />
                              </button>
                              {openPostMenuId === post.id && (
                                <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl border border-slate-100 shadow-xl z-20 py-1 animate-scale-up">
                                  <button
                                    onClick={() => handleArchivePost(post)}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
                                  >
                                    <Archive size={14} />
                                    <span>Archiver</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post)}
                                    className="w-full px-3 py-2 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2"
                                  >
                                    <Trash2 size={14} />
                                    <span>Supprimer</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                      </div>

                      {/* Post Text Content */}
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {post.content}
                      </p>

                      {/* Post Tags */}
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {post.tags.map(t => (
                            <span key={t} className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Post Image Media */}
                      {post.imageUrl && (
                        <div className="rounded-2xl overflow-hidden max-h-80 bg-slate-900 border border-slate-100">
                          <img src={post.imageUrl} alt="Contenu média" className="w-full h-full object-cover hover:scale-102 transition-transform duration-300" />
                        </div>
                      )}

                      {/* Post Video Media */}
                      {post.videoUrl && (
                        <div className="relative rounded-2xl overflow-hidden max-h-96 bg-slate-950 border border-slate-200/80 shadow-inner group">
                          <video 
                            src={post.videoUrl} 
                            controls 
                            playsInline
                            preload="auto"
                            className="w-full h-full max-h-96 object-contain bg-black"
                            onEnded={(e) => {
                              // Reset time to allow instant replay
                              const video = e.target as HTMLVideoElement;
                              video.currentTime = 0;
                            }}
                          />
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-bold text-white flex items-center gap-1 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                            <Video size={11} className="text-sky-400" />
                            <span>Vidéo HD</span>
                          </div>
                        </div>
                      )}

                      {/* Post Document Card */}
                      {post.document && (
                        <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/70 to-purple-50/70 rounded-2xl border border-indigo-100 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5 truncate">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-xs shadow-sm">
                              {post.document.type.toUpperCase()}
                            </div>
                            <div className="truncate">
                              <h5 className="text-xs font-bold text-slate-900 truncate">{post.document.name}</h5>
                              <span className="text-[11px] text-slate-500">{post.document.size} • {post.document.pageCount || 1} pages • Vérifié & Sécurisé</span>
                            </div>
                          </div>
                          
                          <a
                            href={post.document.url}
                            target="_blank"
                            rel="noreferrer"
                            className="px-3.5 py-2 bg-white hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold rounded-xl border border-indigo-200 shadow-2xs transition-all flex items-center gap-1.5 flex-shrink-0"
                          >
                            <Download size={14} />
                            <span>Télécharger</span>
                          </a>
                        </div>
                      )}

                      {/* Reaction Bar & Stats */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between relative">
                        
                        {/* Reaction Picker Popup */}
                        {showReactionPickerForPost === post.id && (
                          <div className="absolute -top-12 left-0 bg-white rounded-full p-1.5 shadow-xl border border-slate-200 flex items-center gap-1 z-30 animate-scale-up">
                            {[
                              { type: 'like', emoji: '❤️', label: 'J\'aime' },
                              { type: 'celebrate', emoji: '👏', label: 'Bravo' },
                              { type: 'insightful', emoji: '💡', label: 'Inspirant' },
                              { type: 'support', emoji: '🤝', label: 'Soutien' },
                              { type: 'fire', emoji: '🔥', label: 'Feu' }
                            ].map(r => (
                              <button
                                key={r.type}
                                onClick={() => handleReaction(post.id, r.type as PostReactionType)}
                                className="p-2 hover:scale-130 active:scale-95 transition-transform text-lg"
                                title={r.label}
                              >
                                {r.emoji}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Reaction Trigger */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setShowReactionPickerForPost(showReactionPickerForPost === post.id ? null : post.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${currentReaction ? 'bg-indigo-50 text-indigo-600 font-extrabold' : 'text-slate-600 hover:bg-slate-100'}`}
                          >
                            <span>{currentReaction === 'fire' ? '🔥' : currentReaction === 'celebrate' ? '👏' : currentReaction === 'insightful' ? '💡' : currentReaction === 'support' ? '🤝' : '❤️'}</span>
                            <span>{post.likes || 0}</span>
                          </button>

                          {/* Comments Button */}
                          <button
                            onClick={() => setExpandedPostId(isExpanded ? null : post.id)}
                            className="px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-all"
                          >
                            <MessageCircle size={15} />
                            <span>{post.comments || 0}</span>
                          </button>

                          {/* Direct Mooc Chat Message author */}
                          <button
                            onClick={() => {
                              const m = members.find(mem => mem.id === post.authorId || mem.name === post.authorName);
                              if (onOpenDirectChat) {
                                onOpenDirectChat(undefined, m);
                              }
                            }}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 transition-all"
                            title="Discuter avec l'auteur dans Mooc Chat"
                          >
                            <MessageSquare size={14} />
                            <span className="hidden sm:inline">Mooc Chat</span>
                          </button>
                        </div>

                        {/* Partager (ÉQUIPE F5) — diffusion réelle multi-canaux avec lien de retour */}
                        <ShareButton
                          url={`https://moknet.net/?post=${post.id}`}
                          title={`Publication de ${post.author} sur MokNet`}
                          text={(post.content || '').slice(0, 140)}
                          count={post.shares}
                          visibilityWarning={
                            post.visibility === 'private'
                              ? "Publication privée : personne d'autre que vous ne pourra l'ouvrir."
                              : post.visibility === 'network'
                                ? 'Réservée à vos amis et abonnés : seuls eux pourront ouvrir le lien.'
                                : undefined
                          }
                          onShared={() => { void recordPostShare(post); }}
                        />

                      </div>

                      {/* E. EXPANDED COMMENTS SECTION */}
                      {isExpanded && (
                        <div className="pt-3 border-t border-slate-100 space-y-4">
                          
                          {/* Add Comment Input */}
                          <div className="flex items-center gap-2">
                            <img src={currentUser.avatarUrl} className="w-8 h-8 rounded-full object-cover" />
                            <div className="flex-1 flex items-center bg-slate-100 rounded-2xl px-3 py-1.5">
                              <input
                                type="text"
                                value={commentInput}
                                onChange={(e) => setCommentInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                                placeholder={replyingToCommentId ? "Répondre au commentaire..." : "Écrire un commentaire..."}
                                className="w-full bg-transparent text-xs text-slate-800 placeholder-slate-400 outline-none"
                              />
                              <button
                                onClick={() => handleAddComment(post.id)}
                                disabled={!commentInput.trim()}
                                className="p-1.5 bg-indigo-600 text-white rounded-xl disabled:opacity-30 transition-all ml-1"
                              >
                                <Send size={13} />
                              </button>
                            </div>
                            {replyingToCommentId && (
                              <button onClick={() => setReplyingToCommentId(null)} className="text-xs text-slate-400 hover:text-slate-600">
                                Annuler
                              </button>
                            )}
                          </div>

                          {/* Comments List */}
                          <div className="space-y-3 pl-2">
                            {(post.commentsList || []).map(cmt => (
                              <div key={cmt.id} className="space-y-2">
                                <div className="flex items-start gap-2.5">
                                  <img src={cmt.authorAvatar} className="w-7 h-7 rounded-full object-cover mt-0.5" />
                                  <div className="flex-1 bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-xs text-slate-900">{cmt.authorName}</span>
                                      <span className="text-[10px] text-slate-400">{cmt.timestamp}</span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed">{cmt.content}</p>
                                    <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500 font-semibold">
                                      <button 
                                        onClick={() => setReplyingToCommentId(cmt.id)} 
                                        className="hover:text-indigo-600"
                                      >
                                        Répondre
                                      </button>
                                      <span>•</span>
                                      <span>{cmt.likes || 0} J'aime</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Nested Replies */}
                                {cmt.replies && cmt.replies.map(rep => (
                                  <div key={rep.id} className="flex items-start gap-2.5 pl-8">
                                    <img src={rep.authorAvatar} className="w-6 h-6 rounded-full object-cover mt-0.5" />
                                    <div className="flex-1 bg-indigo-50/50 p-2.5 rounded-2xl border border-indigo-100/50 space-y-1">
                                      <div className="flex items-center justify-between">
                                        <span className="font-bold text-xs text-slate-900">{rep.authorName}</span>
                                        <span className="text-[10px] text-slate-400">{rep.timestamp}</span>
                                      </div>
                                      <p className="text-xs text-slate-700 leading-relaxed">{rep.content}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ))}
                          </div>

                        </div>
                      )}

                    </article>
                  );
                })
              )}
            </div>

          </div>

          {/* RIGHT COLUMN: DISCOVER MEMBERS, ACTIVE TRIBES & LIVES (Col span 1) */}
          <div className="space-y-6">
            
            {/* 1. Discover Community Members / Friend Requests */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  Suggestions d'Amis
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Communauté Mooc</span>
              </div>

              {/* Recherche de personnes — LOOP 05/17 */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={memberSearchQuery}
                  onChange={(e) => setMemberSearchQuery(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') runMemberSearch(memberSearchQuery); }}
                  placeholder="Rechercher un membre..."
                  className="flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  onClick={() => runMemberSearch(memberSearchQuery)}
                  title="Rechercher"
                  className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all shrink-0"
                >
                  <Search size={14} />
                </button>
                {voiceAssistant.isSupported && (
                  <button
                    onClick={() => (voiceAssistant.isListening ? voiceAssistant.stopListening() : startSocialVoiceCommand())}
                    title="Commande vocale (suivre, ajouter en ami, bloquer, chercher...)"
                    className={`p-1.5 rounded-xl transition-all shrink-0 ${voiceAssistant.isListening ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'}`}
                  >
                    <Mic size={14} />
                  </button>
                )}
              </div>
              {voiceSocialFeedback && (
                <div className="text-[11px] text-indigo-700 bg-indigo-50 rounded-xl px-3 py-1.5 flex items-center gap-1.5">
                  <Mic size={12} /> {voiceSocialFeedback}
                </div>
              )}

              <div className="space-y-3">
                {members.filter(m => m.id !== 'u1').slice(0, 4).map(member => (
                  <div key={member.id} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-all">
                    <div
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer"
                      onClick={() => setSelectedMemberForProfile(member)}
                    >
                      <img src={member.avatarUrl} alt={member.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                          {member.name}
                          {member.isVerified && <CheckCircle size={12} className="text-blue-600" />}
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{member.title}</p>
                        {!!mutualFriendsCounts[member.id] && (
                          <p className="text-[10px] text-indigo-500 truncate">{mutualFriendsCounts[member.id]} ami{mutualFriendsCounts[member.id] > 1 ? 's' : ''} en commun</p>
                        )}
                      </div>
                    </div>

                    {member.isBlockedByMe ? (
                      <button
                        onClick={() => handleUnblockUser(member.id)}
                        title="Débloquer cette personne"
                        className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        Débloquer
                      </button>
                    ) : member.friendshipStatus === 'pending_received' ? (
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          onClick={() => handleFriendAction(member.id, 'accept')}
                          title="Accepter la demande"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => handleFriendAction(member.id, 'decline')}
                          title="Refuser la demande"
                          className="p-1.5 rounded-lg bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleFriendAction(
                          member.id,
                          member.friendshipStatus === 'friends' ? 'remove' : member.friendshipStatus === 'pending_sent' ? 'cancel' : 'send'
                        )}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${member.friendshipStatus === 'friends' || member.friendshipStatus === 'pending_sent' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {member.friendshipStatus === 'friends' ? 'Amis' : member.friendshipStatus === 'pending_sent' ? 'Demande envoyée' : '+ Ajouter'}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Active Lives & Streams */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Radio size={18} className="text-red-500 animate-pulse" />
                  Lives en Direct
                </h3>
                <button 
                  onClick={() => setIsLiveModalOpen(true)}
                  className="text-xs font-bold text-indigo-600 hover:underline"
                >
                  + Lancer un live
                </button>
              </div>

              <div className="space-y-3">
                {lives.map(live => (
                  <div 
                    key={live.id} 
                    onClick={() => onOpenLive(live.id, live)}
                    className="p-3 bg-slate-50 hover:bg-indigo-50/60 rounded-2xl border border-slate-200/80 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-black rounded-full uppercase flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> Live
                      </span>
                      <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
                        <Eye size={12} /> {live.viewers} spectateurs
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {live.title}
                    </h4>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <img src={live.hostAvatar} className="w-5 h-5 rounded-full object-cover" />
                      <span>{live.hostName}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Community Tribus & Groups */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-purple-600" />
                  Tribus Mooc
                </h3>
                <span className="text-[10px] font-bold text-slate-400">Rejoindre</span>
              </div>

              <div className="space-y-3">
                {TRIBES.map(tribe => (
                  <div key={tribe.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 truncate">
                      <img src={tribe.image} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="truncate">
                        <h5 className="text-xs font-bold text-slate-900 truncate">{tribe.name}</h5>
                        <p className="text-[10px] text-slate-500">{tribe.members} membres • {tribe.category}</p>
                      </div>
                    </div>
                    <button className="px-3 py-1 bg-white hover:bg-slate-100 text-indigo-600 text-xs font-bold rounded-xl border border-slate-200">
                      Entrer
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 4. REELS TAB VIEW */}
      {activeTab === 'reels' && (
        <div className="space-y-6">
          
          {/* Header & Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl text-white">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-400/30 font-black text-xs uppercase flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-300" /> Moteur de Découverte & Action
                </span>
                <span className="text-xs text-indigo-300 font-bold hidden sm:inline">LE MONDE À VOUS</span>
              </div>
              <h2 className="text-xl font-black">
                Reels Utiles, Savoirs & Opportunités
              </h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Apprenez en 60 secondes, posez des questions, passez des quiz et déclenchez des parcours concrets avec nos Experts et Tribus.
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Toggle Mode Immersion / Grille */}
              <div className="bg-black/40 backdrop-blur-md rounded-2xl p-1 border border-white/10 flex items-center text-xs font-bold">
                <button
                  onClick={() => setReelsViewMode('grid')}
                  className={`px-3 py-1.5 rounded-xl transition-all ${reelsViewMode === 'grid' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Grille
                </button>
                <button
                  onClick={() => {
                    setReelsViewMode('immersive');
                    if (!selectedReelForViewer && reels.length > 0) {
                      setSelectedReelForViewer(reels[0].id);
                    }
                  }}
                  className={`px-3 py-1.5 rounded-xl transition-all ${reelsViewMode === 'immersive' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Plein Écran
                </button>
              </div>

              <button
                onClick={() => setIsReelCreatorOpen(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white text-xs font-black rounded-2xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-transform active:scale-95"
              >
                <Video size={16} /> Créer avec IA
              </button>
            </div>
          </div>

          {/* Immersive View or Grid View */}
          {reelsViewMode === 'immersive' ? (
            <div className="w-full">
              <SmartReelViewer
                reels={reels}
                initialReelId={selectedReelForViewer || reels[0]?.id}
                onClose={() => setReelsViewMode('grid')}
                onOpenDirectChat={onOpenDirectChat}
                onCreateReel={() => setIsReelCreatorOpen(true)}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {reels.map(reel => (
                <div 
                  key={reel.id} 
                  onClick={() => {
                    setSelectedReelForViewer(reel.id);
                    setReelsViewMode('immersive');
                  }}
                  className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-xl group bg-slate-950 border border-slate-800 cursor-pointer hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300"
                >
                  <img 
                    src={reel.thumbnailUrl || 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=600'} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  
                  {/* Category & Status Pills Top */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
                    <span className="bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black text-white border border-white/10 flex items-center gap-1">
                      {reel.category === 'legal' && '⚖️ Juridique'}
                      {reel.category === 'career' && '💼 Emploi'}
                      {reel.category === 'health' && '🩺 Santé'}
                      {reel.category === 'language' && '🗣️ Langues'}
                      {reel.category === 'project' && '🚀 Projet'}
                      {reel.category === 'tribe' && '🔥 Tribu'}
                      {(!reel.category || reel.category === 'learning') && '🎓 Savoir'}
                    </span>

                    {reel.impactMetrics && (
                      <span className="bg-emerald-600/90 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black text-white shadow-sm flex items-center gap-1">
                        <Award size={11} /> {reel.impactMetrics.utilityScore}% Utilité
                      </span>
                    )}
                  </div>

                  {/* Center Play Pulse on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-xs">
                    <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center shadow-xl border border-white/40 group-hover:scale-110 transition-transform">
                      <Play size={26} fill="white" className="ml-1" />
                    </div>
                  </div>

                  {/* Gradient Overlay & Bottom Info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent p-4 flex flex-col justify-end space-y-2.5 z-10 pointer-events-none">
                    
                    {/* Author Badge */}
                    <div className="flex items-center gap-2">
                      <img 
                        src={reel.authorAvatar || USER_PROFILE.avatarUrl} 
                        className="w-7 h-7 rounded-full object-cover border border-white/80 shadow" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 text-xs font-black text-white truncate">
                          <span>{reel.author}</span>
                          {reel.isVerifiedExpert && <CheckCircle size={11} className="text-indigo-400" />}
                        </div>
                        {reel.authorRole && (
                          <span className="text-[10px] text-slate-300 block truncate">{reel.authorRole}</span>
                        )}
                      </div>
                    </div>

                    {/* Caption */}
                    <p className="text-xs text-white/95 line-clamp-2 leading-relaxed font-medium">
                      {reel.description}
                    </p>

                    {/* Action Gateway Preview Pill */}
                    {reel.actionGateway && (
                      <div className="pt-0.5">
                        <div className="w-full py-1.5 px-2.5 bg-gradient-to-r from-amber-500/90 to-indigo-600/90 text-white rounded-xl text-[10px] font-black shadow-md flex items-center justify-between">
                          <span className="truncate">{reel.actionGateway.label}</span>
                          <ArrowRight size={11} className="flex-shrink-0" />
                        </div>
                      </div>
                    )}

                    {/* Metrics Footer */}
                    <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1 border-t border-white/10 font-bold">
                      <span className="flex items-center gap-1">❤️ {reel.likes}</span>
                      <span className="flex items-center gap-1">💬 {reel.comments}</span>
                      <span className="flex items-center gap-1">👥 {reel.impactMetrics?.learnersStarted || 0} formés</span>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* 5. LIVES TAB VIEW */}
      {activeTab === 'lives' && (
        <div className="space-y-8 animate-fade-in">
          
          {/* Header & Launch CTA */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-3xl border border-white/10 shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-red-600/30 text-red-400 rounded-xl border border-red-500/30 font-black text-xs uppercase flex items-center gap-1.5">
                  <Radio size={14} className="animate-pulse" /> Espace Live Intelligent
                </span>
                <span className="text-xs text-indigo-300 font-bold hidden sm:inline">Propulsé par Diallo OS</span>
              </div>
              <h2 className="text-xl font-black text-white">
                Rencontres, Expertises & Formations en Temps Réel
              </h2>
              <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
                Participez à des sessions interactives bilingues, posez vos questions aux experts IA et humains, 
                ou lancez votre propre masterclass avec transcription et synthèse automatique.
              </p>
            </div>

            <button
              onClick={() => setIsLiveModalOpen(true)}
              className="px-6 py-3.5 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white text-xs font-extrabold rounded-2xl shadow-xl shadow-red-600/30 hover:scale-102 active:scale-98 transition-all flex items-center justify-center gap-2"
            >
              <Radio size={16} className="animate-pulse" /> Lancer ou Programmer un Live
            </button>
          </div>

          {/* Category Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'all', label: 'Tous les Lives', icon: '🌐' },
              { id: 'expert', label: 'Experts & Conseil', icon: '⚖️' },
              { id: 'project_pitch', label: 'Projets & Financement', icon: '🚀' },
              { id: 'campus', label: 'Campus & Éducation', icon: '🎓' },
              { id: 'tribe', label: 'Tribus & Communautés', icon: '🔥' },
              { id: 'conference', label: 'Conférences & Événements', icon: '🎙️' }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setLiveCategoryFilter(cat.id as any)}
                className={`px-4 py-2 rounded-2xl text-xs font-extrabold whitespace-nowrap transition-all flex items-center gap-1.5 ${liveCategoryFilter === cat.id ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Section 1: En Direct Maintenant */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping"></span>
                En Direct Maintenant ({lives.filter(l => !l.isScheduled).length})
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {lives.filter(l => !l.isScheduled && (liveCategoryFilter === 'all' || l.type === liveCategoryFilter)).map(live => (
                <div 
                  key={live.id}
                  onClick={() => onOpenLive(live.id, live)}
                  className="bg-white rounded-3xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="relative aspect-video bg-slate-950 overflow-hidden">
                    <img 
                      src={live.coverImage || live.hostAvatar} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90" 
                    />
                    
                    {/* Live Badges */}
                    <div className="absolute top-3 left-3 flex items-center gap-1.5">
                      <span className="bg-red-600 text-white text-[10px] font-black px-2.5 py-1 rounded-xl uppercase flex items-center gap-1.5 shadow-lg shadow-red-600/40">
                        <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span> DIRECT
                      </span>
                      <span className="bg-slate-900/80 backdrop-blur-xs text-indigo-300 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-white/10 capitalize">
                        {live.type || 'Public'}
                      </span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-xl flex items-center gap-1 border border-white/10">
                      <Eye size={12} className="text-red-400" /> {live.viewers.toLocaleString()}
                    </div>

                    {live.language && (
                      <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-md text-indigo-200 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-white/10">
                        🌐 {live.language} {live.targetLanguage ? `→ ${live.targetLanguage}` : ''}
                      </div>
                    )}
                  </div>

                  <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h4 className="font-black text-sm text-slate-900 group-hover:text-indigo-600 transition-colors leading-snug line-clamp-2">
                        {live.title}
                      </h4>
                      {live.description && (
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                          {live.description}
                        </p>
                      )}
                    </div>

                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={live.hostAvatar} className="w-7 h-7 rounded-xl object-cover" />
                          <span className="text-xs font-bold text-slate-800">{live.hostName}</span>
                        </div>
                        {live.aiAssistantId && (
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md flex items-center gap-1">
                            <Bot size={12} /> Copilote IA
                          </span>
                        )}
                      </div>

                      <button className="w-full py-2.5 bg-red-50 group-hover:bg-red-600 text-red-600 group-hover:text-white rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Play size={14} fill="currentColor" /> Rejoindre la Session
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Sessions Programmées & Fuseaux Horaires */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Calendar size={18} className="text-indigo-600" />
                Sessions Programmées & Masterclasses
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lives.filter(l => l.isScheduled).map(live => (
                <div 
                  key={live.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4 hover:border-indigo-300 transition-all flex flex-col justify-between"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-black rounded-lg uppercase inline-block">
                        🗓️ {live.scheduledFor || 'Bientôt'}
                      </span>
                      <h4 className="font-black text-sm text-slate-900 leading-snug">{live.title}</h4>
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{live.description}</p>
                    </div>
                    <img src={live.coverImage || live.hostAvatar} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-2">
                      <img src={live.hostAvatar} className="w-6 h-6 rounded-lg object-cover" />
                      <span className="text-xs font-bold text-slate-700">{live.hostName}</span>
                    </div>
                    <button 
                      onClick={() => alert(`Rappel activé pour le Live "${live.title}"`)}
                      className="px-4 py-2 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                    >
                      <Bookmark size={14} /> M'inscrire / Rappel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Replays Intelligents & Synthèses Diallo OS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
                <Sparkles size={18} className="text-purple-600" />
                Replays Intelligents & Synthèses Diallo OS
              </h3>
              <span className="text-xs text-slate-500">Chapitres, transcription & export Campus</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  id: 'rep-1',
                  title: 'Financement de Projet & Levée de Fonds 🚀',
                  host: 'Sarah Koné',
                  duration: '45 min',
                  cover: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=600&fit=crop',
                  takeaway: 'Structure complète du plan de trésorerie et subventions diaspora.'
                },
                {
                  id: 'rep-2',
                  title: 'Campus Live : Intelligence Artificielle & Deep Learning 🎓',
                  host: 'Pr. Touré',
                  duration: '60 min',
                  cover: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&fit=crop',
                  takeaway: 'Schéma neural complet et quiz certifiant validé.'
                },
                {
                  id: 'rep-3',
                  title: 'Permanence Juridique : Titres de Séjour & Contrats ⚖️',
                  host: 'Maître Diallo',
                  duration: '30 min',
                  cover: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&fit=crop',
                  takeaway: 'Checklist des pièces justificatives et recours administratifs.'
                }
              ].map(rep => (
                <div 
                  key={rep.id}
                  onClick={() => setSelectedReplayForModal(lives[0])}
                  className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3 group"
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900">
                    <img src={rep.cover} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/90 text-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                        <Play size={18} fill="currentColor" className="ml-0.5" />
                      </div>
                    </div>
                    <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-mono px-2 py-0.5 rounded-md">
                      {rep.duration}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-bold text-xs text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                      {rep.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 line-clamp-2">
                      💡 {rep.takeaway}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-indigo-600 font-bold pt-1 border-t border-slate-100">
                    <span>Voir le Replay & Chapitres</span>
                    <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* 6. TRIBES TAB VIEW */}
      {activeTab === 'tribes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Tribus & Espaces Thématiques</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {TRIBES.map(tribe => (
              <div key={tribe.id} className="bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm space-y-3 p-5">
                <div className="h-28 rounded-2xl overflow-hidden relative">
                  <img src={tribe.coverImage || tribe.image} className="w-full h-full object-cover" />
                </div>
                <div className="flex items-center gap-3 -mt-8 px-2">
                  <img src={tribe.image} className="w-14 h-14 rounded-2xl object-cover border-4 border-white shadow-md" />
                  <div className="pt-4">
                    <h4 className="font-extrabold text-xs text-slate-900">{tribe.name}</h4>
                    <span className="text-[11px] text-indigo-600 font-bold">{tribe.members} membres</span>
                  </div>
                </div>
                <p className="text-xs text-slate-600">{tribe.description}</p>
                <button className="w-full py-2 bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 text-xs font-bold rounded-xl transition-all">
                  Rejoindre la Tribu
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ÉQUIPE F7 — Croissance & Diffusion : tableau de bord réel + agent */}
      {activeTab === 'my_space' && (
        <div className="max-w-2xl mx-auto">
          <GrowthDashboard />
        </div>
      )}

      {/* 7. ALL MODALS INTEGRATION */}

      {/* Pre-publication AI Assistant Modal */}
      <AIPostAssistantModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        originalText={newPostContent}
        onApply={handleApplyAIEnhancement}
      />

      {/* Member Personal Space Profile Modal */}
      {selectedMemberForProfile && (
        <MemberProfileModal
          // État VIVANT, pas un instantané : la fiche recevait l'objet figé au
          // moment de l'ouverture — après « Accepter » ou « Suivre », ses
          // boutons affichaient encore l'ancien état (constaté par la preuve
          // navigateur du 30/08/2026, capture O5-echec) alors que la liste et
          // la base étaient à jour. On relit le membre dans la liste courante
          // à chaque rendu ; l'instantané ne sert que de repli (membre absent
          // de la page de liste actuelle).
          member={members.find((m) => m.id === selectedMemberForProfile.id) ?? selectedMemberForProfile}
          currentUser={currentUser}
          isOpen={!!selectedMemberForProfile}
          onClose={() => setSelectedMemberForProfile(null)}
          posts={posts}
          stories={stories}
          reels={reels}
          lives={lives}
          onFriendAction={handleFriendAction}
          onToggleFollow={handleToggleFollow}
          onBlockUser={handleBlockUser}
          onUnblockUser={handleUnblockUser}
          onStartChatWithMember={(m) => {
            if (onOpenDirectChat) onOpenDirectChat(undefined, m);
          }}
          // Confidentialité modifiable uniquement sur son propre profil —
          // ne jamais fournir ce callback pour la fiche d'un autre membre.
          onUpdatePrivacySettings={
            selectedMemberForProfile.id === (currentUser.id || 'u1')
              ? (newSettings) => updateUserProfile({ privacySettings: newSettings })
              : undefined
          }
        />
      )}

      {/* Story Viewer Modal */}
      {selectedStoryIndex !== null && (
        <StoryViewerModal
          stories={stories}
          initialIndex={selectedStoryIndex}
          isOpen={selectedStoryIndex !== null}
          onClose={() => setSelectedStoryIndex(null)}
          onOpenLiveSession={(st) => {
            const live = lives.find(l => l.hostName === st.author);
            if (live) onOpenLive(live.id, live);
          }}
        />
      )}

      {/* Create Story Modal */}
      {isCreateStoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 border border-slate-100 w-full max-w-md space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-slate-900">Créer une Story Mooc</h3>
              <button onClick={() => setIsCreateStoryOpen(false)} className="p-1 text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>

            <input
              ref={storyImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  setNewStoryImageFile(file);
                  setNewStoryImage(URL.createObjectURL(file));
                }
              }}
            />

            {newStoryImage ? (
              <div className="relative aspect-[9/16] max-h-72 rounded-2xl overflow-hidden bg-slate-900 mx-auto">
                <img src={newStoryImage} className="w-full h-full object-cover" />
                <button
                  onClick={() => { setNewStoryImage(null); setNewStoryImageFile(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-black/60 text-white rounded-full"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div 
                onClick={() => storyImageInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 hover:border-indigo-500 rounded-2xl p-8 text-center cursor-pointer space-y-2 bg-slate-50"
              >
                <Camera size={32} className="mx-auto text-indigo-600" />
                <p className="text-xs font-bold text-slate-700">Choisir une image pour la Story</p>
                <span className="text-[10px] text-slate-400">JPEG, PNG ou photo prise en direct</span>
              </div>
            )}

            <input
              type="text"
              value={newStoryCaption}
              onChange={(e) => setNewStoryCaption(e.target.value)}
              placeholder="Ajouter une légende ou question..."
              className="w-full bg-slate-100 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
            />

            <button
              onClick={handleCreateStory}
              disabled={!newStoryImage && !newStoryCaption}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-40"
            >
              Publier ma Story
            </button>
          </div>
        </div>
      )}

      {/* Reel Creator Modal */}
      {isReelCreatorOpen && (
        <ReelsCreator
          onClose={() => setIsReelCreatorOpen(false)}
          onPublish={(draft) => {
            const newReel: Reel = {
              id: `reel-${Date.now()}`,
              videoUrl: draft.videoUrl,
              likes: 1,
              comments: 0,
              shares: 0,
              saves: 0,
              viewsCount: 1,
              author: currentUser.name,
              authorAvatar: currentUser.avatarUrl,
              description: draft.caption,
              musicTrack: 'Piste Diallo OS 2026',
              tags: draft.hashtags,
              category: draft.category || 'learning',
              actionGateway: draft.actionGateway,
              quiz: draft.quiz,
              impactMetrics: {
                learnersStarted: 1,
                parcoursTriggered: 0,
                collaborationsCreated: 0,
                opportunitiesViewed: 0,
                campusEnrollments: 0,
                utilityScore: 90
              }
            };
            setReels([newReel, ...reels]);
            setIsReelCreatorOpen(false);
            setSelectedReelForViewer(newReel.id);
            setReelsViewMode('immersive');
          }}
        />
      )}

      {/* Live Creation Wizard Modal — même chemin de création que la
          capacité vocale live.session.create (handleCreateLive, G3). */}
      <LiveCreationModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        onCreateLive={handleCreateLive}
      />

      {/* Live Intelligent Replay Modal */}
      {selectedReplayForModal && (
        <LiveReplayModal
          isOpen={!!selectedReplayForModal}
          onClose={() => setSelectedReplayForModal(null)}
          liveStream={selectedReplayForModal}
        />
      )}

    </div>
  );
};
