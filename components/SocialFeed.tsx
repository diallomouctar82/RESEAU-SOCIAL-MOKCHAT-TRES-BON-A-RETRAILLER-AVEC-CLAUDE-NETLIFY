import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Heart, MessageCircle, Share2, MoreHorizontal, Plus, Sparkles, TrendingUp, 
  Radio, PlayCircle, Video, Play, Users, Trophy, UserPlus, Calendar, Languages, 
  FileText, ChevronLeft, MapPin, X, Bot, Camera, Image as ImageIcon, DollarSign, 
  Clock, Lock, Volume2, VolumeX, Music, Wand2, Zap, Globe, MessageSquare, Check, 
  Smile, Send, ChevronDown, ChevronUp, ArrowRight, Mic, Phone, PhoneCall, Paperclip, 
  MoreVertical, Hash, Search, Filter, CheckCircle, ChevronRight, Loader2, ThumbsUp, 
  Repeat, Bookmark, Shield, ShieldAlert, Award, Eye, Download, UploadCloud, AlertCircle
} from 'lucide-react';
import { 
  Post, Tribe, LiveStream, ReelDraft, LivePricing, Reel, Comment, 
  ChatConversation, ChatMessage, MemberProfile, Story, UserProfile, PostDocument, PostVisibility, PostReactionType 
} from '../types';
import { AGENTS, ACTIVE_LIVES, TRIBES, LEADERBOARD } from '../constants';
import { ReelsCreator } from './ReelsCreator';
import { SmartReelViewer } from './SmartReelViewer';
import { UniversalCreator } from './UniversalCreator';
import { AIPostAssistantModal } from './AIPostAssistantModal';
import { MemberProfileModal } from './MemberProfileModal';
import { StoryViewerModal } from './StoryViewerModal';
import { LiveCreationModal } from './LiveCreationModal';
import { LiveReplayModal } from './LiveReplayModal';
import { supabaseService } from '../services/supabaseClient';
import { socialNetworkService } from '../services/socialNetwork';
import { mokChatService } from '../services/mokChat';
import { createMediaPreview, mediaStorage, revokeMediaPreview, validateMediaFile } from '../services/mediaStorage';
import { isUuid, newUuid } from '../services/identifiers';
import { useGlobal } from '../contexts/GlobalContext';

interface SocialFeedProps {
  onOpenLive: (liveId: string, customLive?: LiveStream) => void;
  onOpenDirectChat?: (conversationId?: string, member?: MemberProfile) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ onOpenLive, onOpenDirectChat }) => {
  const { userProfile: currentUser, isSupabaseConnected, addNotification } = useGlobal();
  const [activeTab, setActiveTab] = useState<'feed' | 'reels' | 'lives' | 'tribes' | 'my_space'>('feed');
  const [feedFilter, setFeedFilter] = useState<'for_you' | 'community' | 'tech' | 'legal' | 'business'>('for_you');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Data States
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [reels, setReels] = useState<Reel[]>([]);
  const [lives, setLives] = useState<LiveStream[]>(ACTIVE_LIVES);
  const [members, setMembers] = useState<MemberProfile[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [nextFeedCursor, setNextFeedCursor] = useState<string | null>(null);

  // User Reactions & Bookmarks state
  const [userReactions, setUserReactions] = useState<{ [postId: string]: PostReactionType }>({});
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
  const [newPostMediaFile, setNewPostMediaFile] = useState<File | null>(null);
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
  const [reportingPost, setReportingPost] = useState<Post | null>(null);
  const [reportCategory, setReportCategory] = useState<'spam' | 'harassment' | 'hate' | 'fraud' | 'nudity' | 'violence' | 'impersonation' | 'other'>('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [alsoBlockReportedAuthor, setAlsoBlockReportedAuthor] = useState(false);
  const [isReportingPost, setIsReportingPost] = useState(false);
  const [newStoryCaption, setNewStoryCaption] = useState('');
  const [newStoryImage, setNewStoryImage] = useState<string | null>(null);
  const [newStoryFile, setNewStoryFile] = useState<File | null>(null);
  const [isPublishingStory, setIsPublishingStory] = useState(false);

  // File Input References
  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const storyImageInputRef = useRef<HTMLInputElement>(null);
  const previewUrlsRef = useRef<Set<string>>(new Set());

  const applyFeed = useCallback((fetchedPosts: Post[], reactions: Record<string, PostReactionType>) => {
    setPosts(fetchedPosts);
    setUserReactions(reactions);
    setReels(fetchedPosts.filter(post => Boolean(post.videoUrl)).map(post => ({
      id: post.id,
      videoUrl: post.videoUrl!,
      likes: post.likes,
      comments: post.comments,
      shares: post.shares || 0,
      author: post.authorName || 'Membre Mok',
      authorAvatar: post.authorAvatar,
      authorId: post.authorId,
      authorRole: post.authorTitle,
      description: post.content,
      musicTrack: 'Audio original',
      tags: post.tags,
      category: 'all',
    })));
  }, []);

  const loadNetworkData = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setNetworkError('Vous êtes hors ligne. Le fil cloud ne peut pas être actualisé.');
      return;
    }
    if (!supabaseService.isConfigured() || !isSupabaseConnected) {
      setNetworkError('Connexion réseau requise pour synchroniser le Réseau Mok.');
      return;
    }
    if (!isUuid(currentUser.id)) {
      setPosts([]);
      setStories([]);
      setReels([]);
      setMembers([]);
      setNetworkError('Une session Supabase authentifiée est requise pour afficher le Réseau Mok.');
      return;
    }
    setIsLoadingPosts(true);
    try {
      const [feed, remoteStories, remoteMembers] = await Promise.all([
        socialNetworkService.listFeed(currentUser.id),
        socialNetworkService.listStories(),
        mokChatService.searchMembers('', currentUser.id),
      ]);
      applyFeed(feed.posts, feed.userReactions);
      setNextFeedCursor(feed.nextCursor);
      setStories(remoteStories);
      setMembers(remoteMembers);
      setNetworkError(null);
    } catch (error) {
      setNetworkError(error instanceof Error ? error.message : 'Le Réseau Mok est temporairement indisponible.');
    } finally {
      setIsLoadingPosts(false);
    }
  }, [applyFeed, currentUser.id, isSupabaseConnected]);

  useEffect(() => {
    void loadNetworkData();
    let refreshTimer: number | undefined;
    const scheduleRefresh = () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => void loadNetworkData(), 200);
    };
    if (!isUuid(currentUser.id) || !supabaseService.isConfigured()) return;
    const unsubscribe = socialNetworkService.subscribe({
      onPost: scheduleRefresh,
      onComment: scheduleRefresh,
      onReaction: scheduleRefresh,
      onStory: scheduleRefresh,
    });
    return () => {
      if (refreshTimer) window.clearTimeout(refreshTimer);
      unsubscribe();
    };
  }, [loadNetworkData]);

  useEffect(() => {
    const handleOnline = () => void loadNetworkData();
    const handleOffline = () => setNetworkError('Vous êtes hors ligne. Les nouvelles actions ne seront pas envoyées.');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [loadNetworkData]);

  useEffect(() => () => {
    previewUrlsRef.current.forEach(revokeMediaPreview);
    previewUrlsRef.current.clear();
  }, []);

  const handleLoadMorePosts = async () => {
    if (!nextFeedCursor || isLoadingPosts) return;
    setIsLoadingPosts(true);
    try {
      const page = await socialNetworkService.listFeed(currentUser.id, nextFeedCursor);
      setNextFeedCursor(page.nextCursor);
      setUserReactions(prev => ({ ...prev, ...page.userReactions }));
      setPosts(prev => [...prev, ...page.posts.filter(post => !prev.some(existing => existing.id === post.id))]);
      setReels(prev => [...prev, ...page.posts.filter(post => Boolean(post.videoUrl) && !prev.some(existing => existing.id === post.id)).map(post => ({
        id: post.id,
        videoUrl: post.videoUrl!,
        likes: post.likes,
        comments: post.comments,
        shares: post.shares || 0,
        author: post.authorName || 'Membre Mok',
        authorAvatar: post.authorAvatar,
        authorId: post.authorId,
        authorRole: post.authorTitle,
        description: post.content,
        musicTrack: 'Audio original',
        tags: post.tags,
        category: 'all',
      }))]);
    } catch (error) {
      setNetworkError(error instanceof Error ? error.message : 'La suite du fil n’a pas pu être chargée.');
    } finally {
      setIsLoadingPosts(false);
    }
  };

  // Filter posts dynamically based on selected feed filter & search
  const filteredPosts = posts.filter(post => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchText = post.content.toLowerCase().includes(q) || 
                        post.authorName?.toLowerCase().includes(q) ||
                        post.tags?.some(t => t.toLowerCase().includes(q)) ||
                        post.category?.toLowerCase().includes(q);
      if (!matchText) return false;
    }

    if (feedFilter === 'tech') return post.category?.toLowerCase().includes('tech') || post.tags?.some(t => t.toLowerCase().includes('tech'));
    if (feedFilter === 'legal') return post.category?.toLowerCase().includes('juridique') || post.tags?.some(t => t.toLowerCase().includes('visa') || t.toLowerCase().includes('droit'));
    if (feedFilter === 'business') return post.category?.toLowerCase().includes('entrepreneuriat') || post.tags?.some(t => t.toLowerCase().includes('startup') || t.toLowerCase().includes('agritech'));
    
    return true; // 'for_you' & 'community' show all with high relevance
  });

  // Reactions Handler
  const handleReaction = async (postId: string, reactionType: PostReactionType) => {
    const currentReaction = userReactions[postId];
    const previousReactionMap = userReactions;
    const previousPosts = posts;
    const newReactionsMap = { ...userReactions };

    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex === -1) return;

    const post = posts[postIndex];
    const reactions: Partial<Record<PostReactionType, number>> = { ...(post.reactions || { like: post.likes || 0 }) };

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

    const totalLikes = Object.values(reactions).reduce<number>((total, count) => total + (count || 0), 0);
    const updatedPost: Post = {
      ...post,
      likes: totalLikes,
      reactions
    };

    const newPosts = [...posts];
    newPosts[postIndex] = updatedPost;
    setPosts(newPosts);
    try {
      await socialNetworkService.setReaction(postId, currentUser.id, currentReaction === reactionType ? null : reactionType);
      setNetworkError(null);
    } catch (error) {
      setUserReactions(previousReactionMap);
      setPosts(previousPosts);
      setNetworkError(error instanceof Error ? error.message : 'Réaction non synchronisée.');
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

  const handleReportPost = (post: Post) => {
    if (!post.authorId || post.authorId === currentUser.id) return;
    setReportingPost(post);
    setReportCategory('spam');
    setReportDescription('');
    setAlsoBlockReportedAuthor(false);
  };

  const handleSubmitPostReport = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!reportingPost?.authorId) return;
    setIsReportingPost(true);
    try {
      await mokChatService.reportAbuse({
        reporterId: currentUser.id,
        reportedUserId: reportingPost.authorId,
        postId: reportingPost.id,
        reason: reportCategory,
        details: reportDescription.trim() || 'Publication signalée depuis le fil Réseau Mok.',
      });
      if (alsoBlockReportedAuthor) {
        await mokChatService.setBlocked(currentUser.id, reportingPost.authorId, true);
        setPosts(prev => prev.filter(post => post.authorId !== reportingPost.authorId));
        setReels(prev => prev.filter(reel => reel.authorId !== reportingPost.authorId));
        setStories(prev => prev.filter(story => story.authorId !== reportingPost.authorId));
        setMembers(prev => prev.filter(member => member.id !== reportingPost.authorId));
      }
      addNotification('Signalement transmis', 'La modération examinera cette publication.', 'success');
      setReportingPost(null);
      setReportDescription('');
    } catch (error) {
      setNetworkError(error instanceof Error ? error.message : 'Le signalement n’a pas pu être transmis.');
    } finally {
      setIsReportingPost(false);
    }
  };

  // Comments & Replies
  const handleAddComment = async (postId: string) => {
    if (!commentInput.trim()) return;
    const content = commentInput.trim();
    const parentId = replyingToCommentId || undefined;
    setCommentInput('');
    setReplyingToCommentId(null);
    try {
      const id = await socialNetworkService.addComment({
        postId,
        authorId: currentUser.id,
        content,
        parentCommentId: parentId,
      });
      const comment: Comment = {
        id,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatarUrl,
        content,
        timestamp: 'À l’instant',
        likes: 0,
        replies: [],
      };
      setPosts(prev => prev.map(post => {
        if (post.id !== postId) return post;
        if (!parentId) return { ...post, comments: post.comments + 1, commentsList: [comment, ...(post.commentsList || [])] };
        return {
          ...post,
          comments: post.comments + 1,
          commentsList: (post.commentsList || []).map(parent => parent.id === parentId ? { ...parent, replies: [...(parent.replies || []), comment] } : parent),
        };
      }));
      setNetworkError(null);
    } catch (error) {
      setCommentInput(content);
      setReplyingToCommentId(parentId || null);
      setNetworkError(error instanceof Error ? error.message : 'Commentaire non envoyé.');
    }
  };

  // Upload Handlers
  const clearPostMediaPreview = () => {
    [newPostImage, newPostVideo, newPostDocument?.url].forEach(url => {
      if (url?.startsWith('blob:')) {
        revokeMediaPreview(url);
        previewUrlsRef.current.delete(url);
      }
    });
    setNewPostImage(null);
    setNewPostVideo(null);
    setNewPostDocument(null);
    setNewPostMediaFile(null);
  };

  const registerPostMedia = (file: File) => {
    try {
      validateMediaFile('social-media', file);
      clearPostMediaPreview();
      const preview = createMediaPreview(file);
      previewUrlsRef.current.add(preview);
      setNewPostMediaFile(file);
      if (file.type.startsWith('image/')) setNewPostImage(preview);
      else if (file.type.startsWith('video/')) setNewPostVideo(preview);
      else setNewPostDocument({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        url: preview,
        type: file.type === 'application/pdf' ? 'pdf' : 'doc',
        pageCount: undefined,
      });
      setNetworkError(null);
    } catch (error) {
      setNetworkError(error instanceof Error ? error.message : 'Fichier non autorisé.');
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) registerPostMedia(file);
    e.target.value = '';
  };

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) registerPostMedia(file);
    e.target.value = '';
  };

  const handleDocSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) registerPostMedia(file);
    e.target.value = '';
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
    let uploaded: Awaited<ReturnType<typeof mediaStorage.upload>> | undefined;
    try {
      let fileToUpload = newPostMediaFile;
      if (!fileToUpload && newPostImage) {
        const response = await fetch(newPostImage);
        const blob = await response.blob();
        fileToUpload = new File([blob], `image-${Date.now()}.${blob.type.split('/')[1] || 'png'}`, { type: blob.type || 'image/png' });
      }
      if (fileToUpload) {
        uploaded = await mediaStorage.upload({
          bucket: 'social-media',
          ownerId: currentUser.id,
          scopeId: newUuid(),
          file: fileToUpload,
        });
      }
      await socialNetworkService.createPost({
        authorId: currentUser.id,
        content: newPostContent,
        visibility: newPostVisibility,
        category: newPostCategory,
        tags: newPostTags,
        media: uploaded ? {
          bucket: uploaded.bucket,
          path: uploaded.path,
          name: uploaded.originalName,
          size: uploaded.size,
          mimeType: uploaded.mimeType,
        } : undefined,
      });
      clearPostMediaPreview();
      setNewPostContent('');
      setNewPostTags([]);
      setIsComposerFocused(false);
      setNetworkError(null);
      await loadNetworkData();
    } catch (error) {
      if (uploaded) await mediaStorage.remove(uploaded.bucket, uploaded.path).catch(() => undefined);
      setNetworkError(error instanceof Error ? error.message : 'La publication n’a pas pu être envoyée.');
    } finally {
      setIsPublishing(false);
    }
  };

  // Create Story Submit
  const handleCreateStory = async () => {
    if (!newStoryFile || isPublishingStory) {
      setNetworkError('Ajoutez une photo ou une vidéo à la story.');
      return;
    }
    setIsPublishingStory(true);
    let uploaded: Awaited<ReturnType<typeof mediaStorage.upload>> | undefined;
    try {
      uploaded = await mediaStorage.upload({
        bucket: 'social-media',
        ownerId: currentUser.id,
        scopeId: newUuid(),
        file: newStoryFile,
      });
      const id = await socialNetworkService.createStory({
        authorId: currentUser.id,
        caption: newStoryCaption,
        media: {
          bucket: uploaded.bucket,
          path: uploaded.path,
          name: uploaded.originalName,
          size: uploaded.size,
          mimeType: uploaded.mimeType,
        },
      });
      setStories(prev => [{
        id,
        author: currentUser.name,
        authorId: currentUser.id,
        avatar: currentUser.avatarUrl,
        mediaUrl: uploaded!.signedUrl,
        mediaType: uploaded!.mimeType.startsWith('video/') ? 'video' : 'image',
        caption: newStoryCaption || undefined,
        timestamp: 'À l’instant',
        isLive: false,
        viewersCount: 0,
      }, ...prev]);
      if (newStoryImage?.startsWith('blob:')) {
        revokeMediaPreview(newStoryImage);
        previewUrlsRef.current.delete(newStoryImage);
      }
      setIsCreateStoryOpen(false);
      setNewStoryCaption('');
      setNewStoryImage(null);
      setNewStoryFile(null);
      setNetworkError(null);
    } catch (error) {
      if (uploaded) await mediaStorage.remove(uploaded.bucket, uploaded.path).catch(() => undefined);
      setNetworkError(error instanceof Error ? error.message : 'La story n’a pas pu être publiée.');
    } finally {
      setIsPublishingStory(false);
    }
  };

  const handlePublishReel = async (draft: ReelDraft) => {
    let uploaded: Awaited<ReturnType<typeof mediaStorage.upload>> | undefined;
    try {
      const response = await fetch(draft.videoUrl);
      if (!response.ok && !draft.videoUrl.startsWith('blob:') && !draft.videoUrl.startsWith('data:')) {
        throw new Error('La vidéo du Reel n’est pas accessible.');
      }
      const blob = await response.blob();
      const file = new File([blob], `reel-${Date.now()}.${blob.type.split('/')[1] || 'mp4'}`, { type: blob.type || 'video/mp4' });
      validateMediaFile('social-media', file);
      uploaded = await mediaStorage.upload({
        bucket: 'social-media',
        ownerId: currentUser.id,
        scopeId: newUuid(),
        file,
      });
      const postId = await socialNetworkService.createPost({
        authorId: currentUser.id,
        content: draft.caption,
        visibility: 'public',
        category: `Reel:${draft.category || 'all'}`,
        tags: draft.hashtags,
        media: {
          bucket: uploaded.bucket,
          path: uploaded.path,
          name: uploaded.originalName,
          size: uploaded.size,
          mimeType: uploaded.mimeType,
        },
      });
      if (draft.videoUrl.startsWith('blob:')) revokeMediaPreview(draft.videoUrl);
      await loadNetworkData();
      setIsReelCreatorOpen(false);
      setSelectedReelForViewer(postId);
      setReelsViewMode('immersive');
      setNetworkError(null);
    } catch (error) {
      if (uploaded) await mediaStorage.remove(uploaded.bucket, uploaded.path).catch(() => undefined);
      setNetworkError(error instanceof Error ? error.message : 'Le Reel n’a pas pu être publié.');
    }
  };

  // Open Author Profile Modal
  const handleOpenAuthorProfile = (post: Post) => {
    const foundMember = members.find(m => m.id === post.authorId || m.name === post.authorName);
    if (foundMember) {
      setSelectedMemberForProfile(foundMember);
    } else {
      setNetworkError('Ce profil n’est pas visible ou n’est plus disponible.');
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
                id: currentUser.id,
                name: currentUser.name,
                avatarUrl: currentUser.avatarUrl,
                title: currentUser.title || (currentUser.role === 'admin' ? 'Superviseur Système' : 'Citoyen du Monde'),
                bio: currentUser.bio || '',
                location: [currentUser.city, currentUser.country].filter(Boolean).join(', '),
                joinedDate: '',
                isVerified: Boolean(currentUser.isVerified),
                isFollowing: false,
                followersCount: Number(currentUser.followersCount || 0),
                followingCount: Number(currentUser.followingCount || 0),
                postsCount: posts.filter(p => p.authorId === currentUser.id).length,
                storiesCount: stories.filter(s => s.author === currentUser.name).length,
                reelsCount: reels.filter(r => r.author === currentUser.name).length,
                livesCount: 0,
                skills: currentUser.skills || [],
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
            <img src={currentUser.avatarUrl} alt="" className="w-5 h-5 rounded-full object-cover border border-white/60" />
            <span>Mon Espace Personnel</span>
          </button>

        </div>

      </div>

      {networkError && (
        <div role="alert" className="flex items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <span>{networkError}</span>
          <button type="button" aria-label="Fermer l’alerte" onClick={() => setNetworkError(null)} className="text-amber-700 hover:text-amber-900"><X size={15} /></button>
        </div>
      )}

      {/* 2. STORIES RAIL (Instagram / WhatsApp style) */}
      <div className="bg-white rounded-3xl p-4 border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide py-1">
          
          {/* Add My Story Button */}
          <button
            type="button"
            onClick={() => setIsCreateStoryOpen(true)}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group"
          >
            <div className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-dashed border-indigo-400 group-hover:border-indigo-600 bg-indigo-50/50 flex items-center justify-center transition-all">
              <img src={currentUser.avatarUrl} alt="" className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-md">
                  <Plus size={18} strokeWidth={3} />
                </div>
              </div>
            </div>
            <span className="text-[11px] font-bold text-slate-700 truncate max-w-[70px]">Ma Story</span>
          </button>

          {/* Active Stories */}
          {stories.map((story, index) => (
            <button
              type="button"
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
            </button>
          ))}

          {!isLoadingPosts && stories.length === 0 && (
            <p className="px-3 text-xs text-slate-400">Aucune story active.</p>
          )}

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
                    placeholder={`Quoi de neuf, ${currentUser.name.split(' ')[0] || 'membre'} ? Partagez une réflexion, opportunité, tutoriel ou document...`}
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
                      <img src={newPostImage} alt="Aperçu de la publication" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        aria-label="Retirer l’image"
                        onClick={clearPostMediaPreview}
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
                        type="button"
                        aria-label="Retirer la vidéo"
                        onClick={clearPostMediaPreview}
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
                      <button type="button" aria-label="Retirer le document" onClick={clearPostMediaPreview} className="p-1 text-slate-400 hover:text-slate-600">
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
              {isLoadingPosts && posts.length === 0 ? (
                <div role="status" className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm text-xs text-slate-500">
                  Chargement du fil synchronisé…
                </div>
              ) : filteredPosts.length === 0 ? (
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
                        <button
                          type="button"
                          className="flex items-center gap-3 cursor-pointer group text-left"
                          onClick={() => handleOpenAuthorProfile(post)}
                        >
                          {post.authorAvatar ? (
                            <img
                              src={post.authorAvatar}
                              alt=""
                              className="w-11 h-11 rounded-2xl object-cover ring-2 ring-indigo-500/20 group-hover:scale-105 transition-transform"
                            />
                          ) : (
                            <span aria-hidden="true" className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black">
                              {(post.authorName || 'M').slice(0, 1).toUpperCase()}
                            </span>
                          )}
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
                        </button>

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
                          {post.authorId && post.authorId !== currentUser.id && (
                            <button
                              type="button"
                              onClick={() => void handleReportPost(post)}
                              className="p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 rounded-xl transition-colors"
                              title="Signaler cette publication"
                              aria-label="Signaler cette publication"
                            >
                              <ShieldAlert size={16} />
                            </button>
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
                            <img src={currentUser.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />
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
                                  <img src={cmt.authorAvatar} alt="" className="w-7 h-7 rounded-full object-cover mt-0.5" />
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
                                    <img src={rep.authorAvatar} alt="" className="w-6 h-6 rounded-full object-cover mt-0.5" />
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

            {nextFeedCursor && (
              <button
                type="button"
                onClick={() => void handleLoadMorePosts()}
                disabled={isLoadingPosts}
                className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 text-xs font-bold text-indigo-700 shadow-sm hover:bg-indigo-50 disabled:opacity-50"
              >
                {isLoadingPosts ? 'Chargement…' : 'Afficher les publications précédentes'}
              </button>
            )}

          </div>

          {/* RIGHT COLUMN: DISCOVER MEMBERS, ACTIVE TRIBES & LIVES (Col span 1) */}
          <div className="space-y-6">
            
            {/* 1. Annuaire communautaire */}
            <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Users size={18} className="text-indigo-600" />
                  Annuaire des membres
                </h3>
                <span className="text-[10px] font-bold text-indigo-600 uppercase">Communauté Mooc</span>
              </div>

              <div className="space-y-3">
                {members.filter(m => m.id !== currentUser.id).slice(0, 4).map(member => (
                  <div key={member.id} className="flex items-center justify-between gap-3 p-2 hover:bg-slate-50 rounded-2xl transition-all">
                    <button
                      type="button"
                      className="flex items-center gap-2.5 min-w-0 cursor-pointer text-left"
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
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedMemberForProfile(member)}
                      className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                    >
                      Voir
                    </button>
                  </div>
                ))}
                {!isLoadingPosts && members.length === 0 && (
                  <p className="py-4 text-center text-xs text-slate-400">Aucun membre visible.</p>
                )}
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
                      {reel.authorAvatar ? (
                        <img
                          src={reel.authorAvatar}
                          alt=""
                          className="w-7 h-7 rounded-full object-cover border border-white/80 shadow"
                        />
                      ) : (
                        <span aria-hidden="true" className="w-7 h-7 rounded-full border border-white/80 bg-indigo-600 text-white shadow flex items-center justify-center text-[10px] font-black">
                          {(reel.author || 'M').slice(0, 1).toUpperCase()}
                        </span>
                      )}
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

      {reportingPost && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="post-report-title"
            onSubmit={handleSubmitPostReport}
            className="w-full max-w-md space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 id="post-report-title" className="text-sm font-extrabold text-slate-900">Signaler cette publication</h3>
                <p className="mt-1 text-xs text-slate-500">Le signalement sera enregistré dans la file de modération.</p>
              </div>
              <button type="button" aria-label="Fermer le signalement" onClick={() => setReportingPost(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                <X size={17} />
              </button>
            </div>

            <label className="block text-xs font-bold text-slate-700">
              Motif
              <select
                value={reportCategory}
                onChange={(event) => setReportCategory(event.target.value as typeof reportCategory)}
                className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
              >
                <option value="spam">Spam</option>
                <option value="harassment">Harcèlement</option>
                <option value="hate">Discours haineux</option>
                <option value="fraud">Fraude</option>
                <option value="nudity">Nudité</option>
                <option value="violence">Violence</option>
                <option value="impersonation">Usurpation d’identité</option>
                <option value="other">Autre</option>
              </select>
            </label>

            <label className="block text-xs font-bold text-slate-700">
              Précisions
              <textarea
                value={reportDescription}
                onChange={(event) => setReportDescription(event.target.value)}
                maxLength={2000}
                rows={4}
                placeholder="Décrivez le problème sans inclure de donnée sensible."
                className="mt-1.5 w-full resize-none rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs outline-none focus:ring-2 focus:ring-rose-500/20"
              />
            </label>

            <label className="flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 p-3 text-xs font-semibold text-rose-900">
              <input type="checkbox" checked={alsoBlockReportedAuthor} onChange={(event) => setAlsoBlockReportedAuthor(event.target.checked)} className="mt-0.5" />
              <span>Bloquer aussi cet auteur pour mon compte</span>
            </label>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setReportingPost(null)} className="rounded-xl px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100">Annuler</button>
              <button type="submit" disabled={isReportingPost} className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white disabled:opacity-50">
                {isReportingPost ? 'Transmission…' : 'Transmettre'}
              </button>
            </div>
          </form>
        </div>
      )}
      
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
              <button onClick={() => {
                if (newStoryImage?.startsWith('blob:')) {
                  revokeMediaPreview(newStoryImage);
                  previewUrlsRef.current.delete(newStoryImage);
                }
                setNewStoryImage(null);
                setNewStoryFile(null);
                setIsCreateStoryOpen(false);
              }} className="p-1 text-slate-400 hover:text-slate-600" aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <input
              ref={storyImageInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    validateMediaFile('social-media', file);
                    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error('Une story doit contenir une image ou une vidéo.');
                    if (newStoryImage?.startsWith('blob:')) {
                      revokeMediaPreview(newStoryImage);
                      previewUrlsRef.current.delete(newStoryImage);
                    }
                    const preview = createMediaPreview(file);
                    previewUrlsRef.current.add(preview);
                    setNewStoryFile(file);
                    setNewStoryImage(preview);
                    setNetworkError(null);
                  } catch (error) {
                    setNetworkError(error instanceof Error ? error.message : 'Fichier non autorisé.');
                  }
                }
                e.target.value = '';
              }}
            />

            {newStoryImage ? (
              <div className="relative aspect-[9/16] max-h-72 rounded-2xl overflow-hidden bg-slate-900 mx-auto">
                {newStoryFile?.type.startsWith('video/') ? (
                  <video src={newStoryImage} className="w-full h-full object-cover" controls playsInline />
                ) : (
                  <img src={newStoryImage} alt="Aperçu de la story" className="w-full h-full object-cover" />
                )}
                <button 
                  onClick={() => {
                    revokeMediaPreview(newStoryImage);
                    previewUrlsRef.current.delete(newStoryImage);
                    setNewStoryImage(null);
                    setNewStoryFile(null);
                  }}
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
                <p className="text-xs font-bold text-slate-700">Choisir une image ou vidéo</p>
                <span className="text-[10px] text-slate-400">JPEG, PNG, WebP, MP4 ou WebM</span>
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
              onClick={() => void handleCreateStory()}
              disabled={!newStoryFile || isPublishingStory}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-md disabled:opacity-40"
            >
              {isPublishingStory ? 'Publication…' : 'Publier ma Story'}
            </button>
          </div>
        </div>
      )}

      {/* Reel Creator Modal */}
      {isReelCreatorOpen && (
        <ReelsCreator
          onClose={() => setIsReelCreatorOpen(false)}
          onPublish={(draft) => void handlePublishReel(draft)}
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
