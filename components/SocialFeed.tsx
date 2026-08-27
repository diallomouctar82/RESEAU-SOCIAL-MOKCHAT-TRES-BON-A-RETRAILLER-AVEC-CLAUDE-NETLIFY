import React, { useState, useEffect, useRef } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Plus, Sparkles, TrendingUp, 
  Radio, PlayCircle, Video, Play, Users, Trophy, UserPlus, Calendar, Languages, 
  FileText, ChevronLeft, MapPin, X, Bot, Camera, Image as ImageIcon, DollarSign, 
  Clock, Lock, Volume2, VolumeX, Music, Wand2, Zap, Globe, MessageSquare, Check, 
  Smile, Send, ChevronDown, ChevronUp, ArrowRight, Mic, Phone, PhoneCall, Paperclip, 
  MoreVertical, Hash, Search, Filter, CheckCircle, ChevronRight, Loader2, ThumbsUp, 
  Repeat, Bookmark, Shield, Award, Eye, Download, UploadCloud, AlertCircle
} from 'lucide-react';
import { 
  Post, Tribe, LiveStream, ReelDraft, LivePricing, Reel, Comment, 
  ChatConversation, ChatMessage, MemberProfile, Story, UserProfile, PostDocument, PostVisibility, PostReactionType 
} from '../types';
import { AGENTS, REELS, STORIES, ACTIVE_LIVES, TRIBES, LEADERBOARD, MOCK_CHATS, MOCK_MEMBERS, POSTS as INITIAL_POSTS } from '../constants';
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

interface SocialFeedProps {
  onOpenLive: (liveId: string, customLive?: LiveStream) => void;
  onOpenDirectChat?: (conversationId?: string, member?: MemberProfile) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ onOpenLive, onOpenDirectChat }) => {
  const { userProfile: currentUser, isSupabaseConnected } = useGlobal();
  const [activeTab, setActiveTab] = useState<'feed' | 'reels' | 'lives' | 'tribes' | 'my_space'>('feed');
  const [feedFilter, setFeedFilter] = useState<'for_you' | 'following' | 'community' | 'tech' | 'legal' | 'business'>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [stories, setStories] = useState<Story[]>(STORIES);
  const [reels, setReels] = useState<Reel[]>(REELS);
  const [lives, setLives] = useState<LiveStream[]>(ACTIVE_LIVES);
  const [members, setMembers] = useState<MemberProfile[]>(MOCK_MEMBERS);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);

  // User Reactions & Bookmarks state
  const [userReactions, setUserReactions] = useState<{ [postId: string]: PostReactionType }>({ 'post-1': 'like', 'post-3': 'insightful' });
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [showReactionPickerForPost, setShowReactionPickerForPost] = useState<string | null>(null);

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

  // File Input References
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const storyImageInputRef = useRef<HTMLInputElement>(null);

  // Load Cloud Data on mount
  useEffect(() => {
    const fetchPostsAndMembers = async () => {
      setIsLoadingPosts(true);
      try {
        // 1. Fetch Posts from Supabase if connected, else IndexedDB
        let fetched: Post[] = [];
        if (supabaseService.isConfigured()) {
          const remotePosts = await supabaseService.getPosts();
          if (remotePosts && remotePosts.length > 0) {
            fetched = remotePosts.map(rp => ({
              id: rp.id,
              authorId: rp.author_id,
              authorName: rp.author_name,
              authorAvatar: rp.author_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
              authorTitle: rp.author_role || 'Membre Communauté',
              content: rp.content,
              imageUrl: rp.image_url,
              videoUrl: rp.video_url,
              document: rp.document,
              category: rp.category || 'Général',
              tags: rp.tags || [],
              visibility: rp.visibility || 'public',
              timestamp: new Date(rp.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              likes: rp.likes_count || 0,
              comments: rp.comments_count || 0,
              reactions: rp.reactions || { like: rp.likes_count || 0 },
              commentsList: []
            }));
          }
        }

        if (fetched.length === 0) {
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

        // 2. Fetch Members from Supabase if connected
        if (supabaseService.isConfigured()) {
          const profiles = await supabaseService.searchProfiles();
          if (profiles && profiles.length > 0) {
            const mappedMembers: MemberProfile[] = profiles.map(p => ({
              id: p.id,
              name: p.name,
              avatarUrl: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
              title: p.title || 'Citoyen du Monde',
              bio: 'Membre de la communauté Le Monde à Vous.',
              location: `${p.city || 'Paris'}, ${p.country || 'France'}`,
              joinedDate: '2025',
              isVerified: p.is_verified ?? true,
              isFollowing: false,
              followersCount: p.followers_count ?? 12,
              followingCount: p.following_count ?? 8,
              postsCount: 5,
              storiesCount: 2,
              reelsCount: 1,
              livesCount: 0,
              skills: ['Coopération', 'Tech'],
              privacySettings: {
                profileVisibility: 'public',
                allowMessagesFrom: 'all',
                showOnlineStatus: true,
                allowTagging: true,
                showActivityFeed: true
              }
            }));
            // Merge with MOCK_MEMBERS
            const mergedMembers = [...mappedMembers];
            MOCK_MEMBERS.forEach(mockM => {
              if (!mergedMembers.some(m => m.name.toLowerCase() === mockM.name.toLowerCase())) {
                mergedMembers.push(mockM);
              }
            });
            setMembers(mergedMembers);
          }
        }
      } catch (e) {
        console.warn("Using default initial posts", e);
        setPosts(INITIAL_POSTS);
      } finally {
        setIsLoadingPosts(false);
      }
    };
    fetchPostsAndMembers();
  }, []);

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

  // Toggle Follow on Member
  const handleToggleFollow = (memberId: string) => {
    setMembers(prev => prev.map(m => {
      if (m.id === memberId) {
        const nextState = !m.isFollowing;
        return {
          ...m,
          isFollowing: nextState,
          followersCount: m.followersCount + (nextState ? 1 : -1)
        };
      }
      return m;
    }));
  };

  // Reactions Handler
  const handleReaction = (postId: string, reactionType: PostReactionType) => {
    const currentReaction = userReactions[postId];
    const newReactionsMap = { ...userReactions };

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

    const totalLikes = Object.values(reactions).reduce((a, b) => (a || 0) + (b || 0), 0);
    const updatedPost: Post = {
      ...post,
      likes: totalLikes,
      reactions
    };

    const newPosts = [...posts];
    newPosts[postIndex] = updatedPost;
    setPosts(newPosts);
    cloudService.savePost(updatedPost);
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
  const handleAddComment = (postId: string) => {
    if (!commentInput.trim()) return;

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const currentComments = post.commentsList || [];

    if (replyingToCommentId) {
      // Add nested reply
      const updatedList = currentComments.map(c => {
        if (c.id === replyingToCommentId) {
          return {
            ...c,
            replies: [
              ...(c.replies || []),
              {
                id: `reply-${Date.now()}`,
                authorName: currentUser.name,
                authorAvatar: currentUser.avatarUrl,
                content: commentInput.trim(),
                timestamp: 'À l\'instant',
                likes: 0
              }
            ]
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
        authorName: currentUser.name,
        authorAvatar: currentUser.avatarUrl,
        content: commentInput.trim(),
        timestamp: 'À l\'instant',
        likes: 0,
        replies: []
      };

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

  // Upload Handlers
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewPostImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setNewPostVideo(url);
    }
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const url = URL.createObjectURL(file);
      setNewPostDocument({
        name: file.name,
        size: sizeStr,
        url: url,
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

  // Create Post Submit
  const handlePublishPost = async () => {
    if (!newPostContent.trim() && !newPostImage && !newPostVideo && !newPostDocument) return;

    setIsPublishing(true);
    const newPost: Post = {
      id: `post-${Date.now()}`,
      authorId: currentUser.id || 'u1',
      authorName: currentUser.name,
      authorAvatar: currentUser.avatarUrl,
      authorTitle: currentUser.title || 'Membre Communauté',
      content: newPostContent,
      imageUrl: newPostImage || undefined,
      videoUrl: newPostVideo || undefined,
      document: newPostDocument || undefined,
      category: newPostCategory,
      tags: newPostTags.length > 0 ? newPostTags : undefined,
      visibility: newPostVisibility,
      timestamp: 'À l\'instant',
      likes: 0,
      comments: 0,
      shares: 0,
      reactions: { like: 0 },
      commentsList: []
    };

    const updatedPosts = [newPost, ...posts];
    setPosts(updatedPosts);

    // Save to Supabase if connected
    if (supabaseService.isConfigured()) {
      try {
        await supabaseService.createPost({
          id: newPost.id,
          author_id: currentUser.id || 'u1',
          author_name: currentUser.name,
          author_role: currentUser.title || 'Citoyen',
          author_avatar: currentUser.avatarUrl,
          content: newPost.content,
          image_url: newPost.imageUrl,
          video_url: newPost.videoUrl,
          document: newPost.document,
          category: newPost.category,
          tags: newPost.tags || [],
          visibility: newPost.visibility,
          likes_count: 0,
          comments_count: 0,
          reactions: { like: 0 }
        });
      } catch (err) {
        console.warn('Could not save post to Supabase', err);
      }
    }
    await cloudService.savePost(newPost);

    // Reset Composer
    setNewPostContent('');
    setNewPostImage(null);
    setNewPostVideo(null);
    setNewPostDocument(null);
    setNewPostTags([]);
    setIsComposerFocused(false);
    setIsPublishing(false);
  };

  // Create Story Submit
  const handleCreateStory = () => {
    if (!newStoryImage && !newStoryCaption) return;
    const newStory: Story = {
      id: `story-${Date.now()}`,
      author: currentUser.name,
      authorId: 'u1',
      avatar: currentUser.avatarUrl,
      mediaUrl: newStoryImage || 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800&fit=crop',
      caption: newStoryCaption || 'Nouvelle Story Mooc',
      timestamp: 'À l\'instant',
      isLive: false,
      viewersCount: 1
    };

    setStories([newStory, ...stories]);
    setIsCreateStoryOpen(false);
    setNewStoryCaption('');
    setNewStoryImage(null);
  };

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
                skills: ['Coopération', 'Tech', 'Innovation'],
                privacySettings: {
                  profileVisibility: 'public',
                  allowMessagesFrom: 'all',
                  showOnlineStatus: true,
                  allowTagging: true,
                  showActivityFeed: true
                }
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
                </div>

                {/* Submit Button */}
                <button
                  onClick={handlePublishPost}
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
                        <div className="rounded-2xl overflow-hidden max-h-80 bg-slate-950 border border-slate-100">
                          <video src={post.videoUrl} controls className="w-full h-full" />
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

                        {/* Shares Count & Button */}
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(`https://lemondeavous.org/mooc/posts/${post.id}`);
                            alert('Lien de la publication copié !');
                          }}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
                          title="Partager le post"
                        >
                          <Share2 size={16} />
                        </button>

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
            
            {/* 1. Discover Community Members to Follow */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  Membres à Suivre
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Communauté Mooc</span>
              </div>

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
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleFollow(member.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${member.isFollowing ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                    >
                      {member.isFollowing ? 'Abonné' : '+ Suivre'}
                    </button>
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
          member={selectedMemberForProfile}
          currentUser={currentUser}
          isOpen={!!selectedMemberForProfile}
          onClose={() => setSelectedMemberForProfile(null)}
          posts={posts}
          stories={stories}
          reels={reels}
          lives={lives}
          onToggleFollow={handleToggleFollow}
          onStartChatWithMember={(m) => {
            if (onOpenDirectChat) onOpenDirectChat(undefined, m);
          }}
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
                  const reader = new FileReader();
                  reader.onloadend = () => setNewStoryImage(reader.result as string);
                  reader.readAsDataURL(file);
                }
              }}
            />

            {newStoryImage ? (
              <div className="relative aspect-[9/16] max-h-72 rounded-2xl overflow-hidden bg-slate-900 mx-auto">
                <img src={newStoryImage} className="w-full h-full object-cover" />
                <button 
                  onClick={() => setNewStoryImage(null)}
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

      {/* Live Creation Wizard Modal */}
      <LiveCreationModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
        onCreateLive={(newLive) => {
          setLives([newLive, ...lives]);
          if (!newLive.isScheduled) {
            onOpenLive(newLive.id, newLive);
          }
        }}
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
