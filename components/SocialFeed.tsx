
import React, { useState, useEffect, useRef } from 'react';
import { AGENTS, USER_PROFILE, REELS, STORIES, ACTIVE_LIVES, TRIBES, LEADERBOARD, MOCK_CHATS } from '../constants';
import { Heart, MessageCircle, Share2, MoreHorizontal, Plus, Sparkles, TrendingUp, Radio, PlayCircle, Video, Play, Users, Trophy, UserPlus, Calendar, Languages, FileText, ChevronLeft, MapPin, X, Bot, Camera, Image as ImageIcon, DollarSign, Clock, Lock, Volume2, VolumeX, Music, Wand2, Zap, Globe, MessageSquare, Check, Smile, Send, ChevronDown, ChevronUp, ArrowRight, Mic, Phone, PhoneCall, Paperclip, MoreVertical, Hash, Search, Filter, CheckCircle, ChevronRight, Loader2, ThumbsUp, Repeat, Bookmark } from 'lucide-react';
import { Post, Tribe, LiveStream, ReelDraft, LivePricing, Reel, Comment, ChatConversation, ChatMessage } from '../types';
import { ReelsCreator } from './ReelsCreator';
import { UniversalCreator } from './UniversalCreator';
import { Avatar3D } from './Avatar3D';
import { cloudService } from '../services/cloud';

interface SocialFeedProps {
    onOpenLive: (liveId: string, customLive?: LiveStream) => void;
}

export const SocialFeed: React.FC<SocialFeedProps> = ({ onOpenLive }) => {
  const [activeTab, setActiveTab] = useState<'feed' | 'reels' | 'lives' | 'tribes' | 'messages'>('feed');
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [muted, setMuted] = useState(true);
  
  // Comments State
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState<string>('');

  // Post Creation State
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostImage, setNewPostImage] = useState<string | null>(null);
  const [isComposerFocused, setIsComposerFocused] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Tribe State
  const [selectedTribe, setSelectedTribe] = useState<Tribe | null>(null);

  // Live Creation State
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [liveForm, setLiveForm] = useState({
      title: '',
      category: 'Général',
      selectedAgentId: AGENTS[0].id,
      pricingEnabled: false,
      pricePerMinute: 0.10,
      payer: 'viewer' as 'host' | 'viewer'
  });

  // Creator States
  const [isReelCreatorOpen, setIsReelCreatorOpen] = useState(false);
  const [isUniversalCreatorOpen, setIsUniversalCreatorOpen] = useState(false);

  // Story Viewer State
  const [viewingStoryAgentId, setViewingStoryAgentId] = useState<string | null>(null);

  // CHAT STATE
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [chats, setChats] = useState<ChatConversation[]>(MOCK_CHATS);
  const [chatInput, setChatInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const chatFileRef = useRef<HTMLInputElement>(null);

  // LOAD POSTS FROM CLOUD
  useEffect(() => {
    const fetchPosts = async () => {
        setIsLoadingPosts(true);
        try {
            const fetchedPosts = await cloudService.getAllPosts();
            // Sort by ID assuming descending order (simulated timestamp)
            const sortedPosts = fetchedPosts.sort((a, b) => (b.id > a.id ? 1 : -1));
            setPosts(sortedPosts);
        } catch (e) {
            console.error("Failed to load posts", e);
        } finally {
            setIsLoadingPosts(false);
        }
    };
    fetchPosts();
  }, []);

  useEffect(() => {
      if (activeTab === 'messages' && activeChatId) {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [chats, activeTab, activeChatId]);

  const handleLike = (postId: string) => {
    const isLiked = likedPosts.includes(postId);
    const updatedLikedPosts = isLiked ? likedPosts.filter(id => id !== postId) : [...likedPosts, postId];
    setLikedPosts(updatedLikedPosts);

    // Update Post in Cloud
    const postIndex = posts.findIndex(p => p.id === postId);
    if (postIndex >= 0) {
        const updatedPost = { ...posts[postIndex], likes: posts[postIndex].likes + (isLiked ? -1 : 1) };
        const newPosts = [...posts];
        newPosts[postIndex] = updatedPost;
        setPosts(newPosts);
        cloudService.savePost(updatedPost);
    }
  };

  const handleToggleComments = (postId: string) => {
      setExpandedPostId(expandedPostId === postId ? null : postId);
      setCommentInput('');
  };

  const handlePostComment = (postId: string) => {
      if (!commentInput.trim()) return;

      const newComment: Comment = {
          id: `cmt-${Date.now()}`,
          authorName: USER_PROFILE.name,
          authorAvatar: USER_PROFILE.avatarUrl,
          content: commentInput,
          timestamp: 'À l\'instant'
      };

      const postIndex = posts.findIndex(p => p.id === postId);
      if (postIndex >= 0) {
          const updatedPost = {
              ...posts[postIndex],
              comments: posts[postIndex].comments + 1,
              commentsList: [newComment, ...(posts[postIndex].commentsList || [])]
          };
          
          const newPosts = [...posts];
          newPosts[postIndex] = updatedPost;
          setPosts(newPosts);
          cloudService.savePost(updatedPost);
      }

      setCommentInput('');
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => setNewPostImage(reader.result as string);
          reader.readAsDataURL(file);
      }
  };

  const handleCreatePost = async () => {
      if (!newPostContent.trim() && !newPostImage) return;
      setIsPublishing(true);

      const newPost: Post = {
          id: `user-post-${Date.now()}`,
          authorName: USER_PROFILE.name,
          authorAvatar: USER_PROFILE.avatarUrl,
          content: newPostContent,
          imageUrl: newPostImage || undefined,
          timestamp: 'À l\'instant',
          likes: 0,
          comments: 0,
          commentsList: []
      };

      // Save to Cloud & Update State
      await cloudService.savePost(newPost);
      setPosts([newPost, ...posts]);
      
      setNewPostContent('');
      setNewPostImage(null);
      setIsComposerFocused(false);
      setIsPublishing(false);
  };

  const handleStartLive = () => {
      if (!liveForm.title) return;
      const newLive: LiveStream = {
          id: `custom-${Date.now()}`,
          title: liveForm.title,
          hostName: USER_PROFILE.name,
          hostAvatar: USER_PROFILE.avatarUrl,
          viewers: 0,
          isMixed: true,
          aiAssistantId: liveForm.selectedAgentId,
          panelists: [],
          startedAt: new Date(),
          duration: 0,
          isPaid: false,
          pricing: { isEnabled: liveForm.pricingEnabled, pricePerMinute: liveForm.pricePerMinute, payer: liveForm.payer },
          donationGoal: { targetAmount: 100, currentAmount: 0, title: "Soutien", tiers: [] },
          tags: [liveForm.category]
      };
      setIsLiveModalOpen(false);
      onOpenLive(newLive.id, newLive);
  };

  // --- RENDERERS ---

  const renderStoryRail = () => (
      <div className="flex gap-4 overflow-x-auto pb-6 px-4 pt-2 scrollbar-hide snap-x items-center">
          {/* Add Story Button */}
          <div className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group relative snap-start" onClick={() => setIsUniversalCreatorOpen(true)}>
              <div className="w-16 h-16 rounded-full border-2 border-dashed border-indigo-300 flex items-center justify-center bg-indigo-50 group-hover:bg-indigo-100 group-hover:border-indigo-500 transition-all relative shadow-sm">
                 <div className="absolute bottom-0 right-0 bg-indigo-600 text-white rounded-full p-1 border-2 border-white shadow-md transform group-hover:scale-110 transition-transform"><Plus size={12} strokeWidth={3} /></div>
                 <img src={USER_PROFILE.avatarUrl} className="w-full h-full rounded-full object-cover opacity-90 p-0.5" />
              </div>
              <span className="text-[11px] font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">Ma Story</span>
          </div>
          
          {/* Stories List */}
          {STORIES.map((story) => {
              const agent = AGENTS.find(a => a.name.includes(story.author.split(' ')[0]));
              return (
                <div key={story.id} onClick={() => setViewingStoryAgentId(agent?.id || null)} className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group snap-start">
                    <div className={`w-16 h-16 rounded-full p-[2px] ${story.isLive ? 'bg-gradient-to-tr from-red-500 via-orange-500 to-yellow-500 animate-pulse' : 'bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500'} group-hover:scale-105 transition-transform shadow-md`}>
                        <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                            <img src={story.avatar} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                        </div>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-700 max-w-[64px] truncate text-center group-hover:text-indigo-600 transition-colors">{story.author.split(' ')[0]}</span>
                </div>
              );
          })}
      </div>
  );

  const renderPost = (post: Post) => {
      const agent = AGENTS.find(a => a.id === post.agentId);
      const authorName = agent ? agent.name : (post.authorName || 'Utilisateur');
      const authorAvatar = agent ? agent.avatarUrl : (post.authorAvatar || USER_PROFILE.avatarUrl);
      const isAi = !!agent;
      const isLiked = likedPosts.includes(post.id);
      const isCommentsOpen = expandedPostId === post.id;

      return (
        <article key={post.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden mb-5 hover:shadow-lg transition-all duration-300 group animate-fade-up">
            {/* Header */}
            <div className="p-4 flex justify-between items-start">
                <div className="flex items-center gap-3">
                    <div className="relative cursor-pointer hover:opacity-80 transition-opacity">
                        <img src={authorAvatar} className="w-11 h-11 rounded-full object-cover border border-slate-100" />
                        {isAi && <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-[9px] px-1.5 py-0.5 rounded-full border-2 border-white font-bold shadow-sm">IA</div>}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-900 text-sm hover:text-indigo-600 cursor-pointer transition-colors">{authorName}</h3>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                            {agent && <span className="text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded font-medium text-[10px]">{agent.title}</span>}
                            <span>•</span>
                            <span className="text-slate-400">{post.timestamp}</span>
                            <span>•</span>
                            <Globe size={10} className="text-slate-400" />
                        </div>
                    </div>
                </div>
                <button className="text-slate-400 hover:text-slate-600 hover:bg-slate-50 p-2 rounded-full transition-colors"><MoreHorizontal size={20} /></button>
            </div>
            
            {/* Content */}
            <div className="px-4 pb-3">
                <p className="text-slate-800 text-[15px] leading-relaxed whitespace-pre-wrap">{post.content}</p>
            </div>
            
            {/* Media */}
            {post.imageUrl && (
                <div className="w-full relative cursor-pointer overflow-hidden bg-slate-100">
                    <img src={post.imageUrl} className="w-full h-auto object-cover max-h-[600px] transition-transform duration-500" />
                    {isAi && (
                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="bg-black/60 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 hover:bg-black/80 shadow-lg transform hover:scale-105 transition-all">
                                <Wand2 size={12} /> Remix IA
                            </button>
                        </div>
                    )}
                </div>
            )}
            
            {/* Actions Bar */}
            <div className="px-2 py-2 flex items-center justify-between border-t border-slate-50 mx-2">
                <div className="flex items-center gap-1">
                    <button onClick={() => handleLike(post.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isLiked ? 'text-red-600 bg-red-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                        <Heart size={20} className={isLiked ? 'fill-current' : ''} />
                        <span className="text-sm font-bold">{post.likes + (isLiked ? 1 : 0)}</span>
                    </button>
                    
                    <button onClick={() => handleToggleComments(post.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${isCommentsOpen ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
                        <MessageCircle size={20} />
                        <span className="text-sm font-bold">{post.comments}</span>
                    </button>
                    
                    <button className="flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-slate-500 hover:bg-slate-50 hover:text-slate-700">
                        <Share2 size={20} />
                    </button>
                </div>
                
                <button className="text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-50 transition-colors">
                    <Bookmark size={20} />
                </button>
            </div>

            {/* COMMENTS SECTION */}
            {isCommentsOpen && (
                <div className="bg-slate-50/50 border-t border-slate-100 p-4 animate-fade-up">
                    <div className="max-h-60 overflow-y-auto mb-4 space-y-4 pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                        {(!post.commentsList || post.commentsList.length === 0) ? (
                            <div className="text-center py-8">
                                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2 text-slate-300">
                                    <MessageSquare size={20} />
                                </div>
                                <p className="text-xs text-slate-400 font-medium">Aucun commentaire. Lancez la discussion !</p>
                            </div>
                        ) : (
                            post.commentsList.map(comment => (
                                <div key={comment.id} className="flex gap-3 group/comment">
                                    <img src={comment.authorAvatar} className="w-8 h-8 rounded-full flex-shrink-0 object-cover ring-2 ring-white shadow-sm" />
                                    <div className="flex-1">
                                        <div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <span className="text-xs font-bold text-slate-900">{comment.authorName}</span>
                                                <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                            </div>
                                            <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                                        </div>
                                        <div className="flex gap-3 mt-1 ml-2">
                                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">J'aime</button>
                                            <button className="text-[10px] font-bold text-slate-400 hover:text-slate-600 transition-colors">Répondre</button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    <div className="flex gap-3 items-end bg-white p-2 rounded-2xl border border-slate-200 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                        <img src={USER_PROFILE.avatarUrl} className="w-8 h-8 rounded-full object-cover mb-1" />
                        <textarea 
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handlePostComment(post.id);
                                }
                            }}
                            placeholder="Ajouter un commentaire..."
                            className="flex-1 bg-transparent text-sm outline-none placeholder-slate-400 resize-none py-2 min-h-[36px] max-h-24"
                            rows={1}
                        />
                        <button 
                            onClick={() => handlePostComment(post.id)}
                            disabled={!commentInput.trim()}
                            className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-all shadow-sm mb-0.5"
                        >
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </article>
      );
  };

  return (
    <div className="flex h-full bg-[#f8f9fa] relative font-sans overflow-hidden">
      
      {/* Story Viewer (Overlay) */}
      {viewingStoryAgentId && (
        <div className="fixed inset-0 z-[100] bg-black animate-fade-up flex items-center justify-center backdrop-blur-xl bg-black/95">
            <div className="relative w-full max-w-md h-full md:h-[90vh] md:rounded-3xl overflow-hidden bg-gray-900 shadow-2xl border border-white/10">
                 <Avatar3D avatarId={viewingStoryAgentId} state="speaking" className="w-full h-full object-cover" showHud={false} />
                 <div className="absolute top-0 left-0 right-0 p-4 pt-8 z-10 bg-gradient-to-b from-black/80 to-transparent">
                     <div className="flex gap-1 mb-4 px-1">
                         <div className="h-1 bg-white/30 flex-1 rounded-full overflow-hidden"><div className="h-full bg-white w-1/2 animate-[width_5s_linear]"></div></div>
                     </div>
                     <div className="flex justify-between items-center">
                         <div className="flex items-center gap-3">
                             <div className="p-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full">
                                <img src={AGENTS.find(a => a.id === viewingStoryAgentId)?.avatarUrl} className="w-9 h-9 rounded-full border-2 border-black" />
                             </div>
                             <div className="text-white">
                                 <h3 className="font-bold text-sm">{AGENTS.find(a => a.id === viewingStoryAgentId)?.name}</h3>
                                 <span className="text-xs opacity-70 flex items-center gap-1">Il y a 3h <Globe size={10} /></span>
                             </div>
                         </div>
                         <button onClick={() => setViewingStoryAgentId(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X className="text-white" size={24} /></button>
                     </div>
                 </div>
                 {/* Story interaction */}
                 <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 to-transparent flex items-center gap-3 pb-8">
                     <input placeholder="Envoyer un message..." className="flex-1 bg-white/10 backdrop-blur-md border border-white/30 rounded-full px-5 py-3 text-white placeholder-white/50 text-sm focus:bg-white/20 outline-none transition-all" />
                     <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-red-500/80 hover:scale-110 transition-all"><Heart size={24} /></button>
                     <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-indigo-500/80 hover:scale-110 transition-all"><Send size={24} /></button>
                 </div>
            </div>
        </div>
      )}

      {/* Main Feed Container */}
      <div className="flex-1 flex flex-col max-w-3xl mx-auto w-full h-full relative border-r border-slate-200/50 bg-slate-50 shadow-sm">
          
          {/* Navigation Tab Bar */}
          <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-slate-100 pt-2 px-4 transition-all">
              <div className="flex items-center justify-between mb-2">
                  <h1 className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">Réseau <span className="text-slate-800 font-light">Mok</span></h1>
                  <div className="flex gap-2">
                      <button onClick={() => setIsLiveModalOpen(true)} className="p-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-all hover:scale-105 border border-red-100 shadow-sm" title="Lancer un Live"><Radio size={20} /></button>
                      <button onClick={() => setIsUniversalCreatorOpen(true)} className="p-2 bg-slate-900 text-white rounded-full hover:bg-slate-800 transition-all hover:scale-105 shadow-lg flex items-center justify-center" title="Créer"><Plus size={20} /></button>
                  </div>
              </div>
              
              {/* Tabs */}
              <div className="flex gap-6 text-sm font-bold text-slate-500 overflow-x-auto scrollbar-hide -mb-px">
                  {[
                      { id: 'feed', label: 'Fil d\'actu' },
                      { id: 'reels', label: 'Reels' },
                      { id: 'lives', label: 'Lives' },
                      { id: 'tribes', label: 'Tribus' }
                  ].map(tab => (
                      <button 
                        key={tab.id}
                        onClick={() => {setActiveTab(tab.id as any); setSelectedTribe(null);}} 
                        className={`pb-3 border-b-[3px] transition-all whitespace-nowrap px-1 ${activeTab === tab.id ? 'text-indigo-600 border-indigo-600' : 'border-transparent hover:text-slate-800 hover:border-slate-200'}`}
                      >
                          {tab.label}
                      </button>
                  ))}
              </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-hide pb-24 bg-[#fafafa]">
              
              {/* FEED VIEW */}
              {activeTab === 'feed' && (
                  <div className="pt-4">
                      {renderStoryRail()}
                      <div className="px-4 mt-6">
                          
                          {/* Modern Composer */}
                          <div className={`bg-white rounded-2xl p-4 mb-8 shadow-sm border transition-all duration-300 ${isComposerFocused ? 'border-indigo-200 shadow-md ring-4 ring-indigo-50/30' : 'border-slate-100'}`}>
                              <div className="flex gap-4">
                                  <img src={USER_PROFILE.avatarUrl} className="w-10 h-10 rounded-full object-cover border border-slate-100 shadow-sm" />
                                  <div className="flex-1">
                                      <textarea
                                          value={newPostContent}
                                          onChange={(e) => setNewPostContent(e.target.value)}
                                          onFocus={() => setIsComposerFocused(true)}
                                          onBlur={() => !newPostContent && !newPostImage && setIsComposerFocused(false)}
                                          placeholder={`Quoi de neuf, ${USER_PROFILE.name.split(' ')[0]} ?`}
                                          className="w-full bg-transparent border-none p-2 focus:ring-0 outline-none resize-none text-base min-h-[50px] placeholder-slate-400"
                                      />
                                      {newPostImage && (
                                          <div className="relative mt-3 mb-2 animate-fade-up">
                                              <img src={newPostImage} className="w-full max-h-64 object-cover rounded-xl border border-slate-100" />
                                              <button onClick={() => setNewPostImage(null)} className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-full hover:bg-black/80 backdrop-blur-md transition-all"><X size={16} /></button>
                                          </div>
                                      )}
                                      
                                      <div className="flex justify-between items-center mt-3 pt-2 border-t border-slate-50">
                                          <div className="flex gap-1">
                                              <button onClick={() => fileInputRef.current?.click()} className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors tooltip" title="Image"><ImageIcon size={20} /></button>
                                              <button className="p-2 text-pink-500 hover:bg-pink-50 rounded-lg transition-colors" title="Vidéo"><Video size={20} /></button>
                                              <button className="p-2 text-purple-500 hover:bg-purple-50 rounded-lg transition-colors" title="IA"><Wand2 size={20} /></button>
                                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                          </div>
                                          <button 
                                              onClick={handleCreatePost}
                                              disabled={!newPostContent.trim() && !newPostImage || isPublishing}
                                              className="bg-indigo-600 text-white px-5 py-2 rounded-full font-bold text-sm hover:bg-indigo-700 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95"
                                          >
                                              {isPublishing ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                              {isPublishing ? 'Envoi...' : 'Publier'}
                                          </button>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Posts Feed */}
                          {isLoadingPosts ? (
                              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={48} /></div>
                          ) : (
                              <div className="space-y-6">
                                {posts.map(renderPost)}
                              </div>
                          )}
                          
                          {!isLoadingPosts && posts.length > 0 && (
                              <div className="py-12 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                                  <CheckCircle size={24} className="text-slate-300 mb-1" />
                                  <span>Vous êtes à jour !</span>
                              </div>
                          )}
                      </div>
                  </div>
              )}

              {/* REELS VIEW */}
              {activeTab === 'reels' && (
                  <div className="h-full bg-black snap-y snap-mandatory overflow-y-scroll scrollbar-hide relative rounded-t-3xl mt-4 mx-2">
                      {REELS.map((reel) => (
                          <div key={reel.id} className="h-full w-full snap-start relative group">
                              <video src={reel.videoUrl} className="w-full h-full object-cover" loop muted={muted} autoPlay playsInline />
                              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/80 pointer-events-none"></div>
                              
                              {/* Sidebar Actions */}
                              <div className="absolute bottom-20 right-4 flex flex-col gap-6 items-center pointer-events-auto z-10">
                                  <button className="flex flex-col items-center gap-1 group/btn"><div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white group-hover/btn:bg-white/20 transition-all border border-white/10 hover:scale-110"><Heart size={28} /></div><span className="text-xs font-bold text-white shadow-black drop-shadow-md">{reel.likes}</span></button>
                                  <button className="flex flex-col items-center gap-1 group/btn"><div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white group-hover/btn:bg-white/20 transition-all border border-white/10 hover:scale-110"><MessageCircle size={28} /></div><span className="text-xs font-bold text-white shadow-black drop-shadow-md">{reel.comments}</span></button>
                                  <button className="flex flex-col items-center gap-1 group/btn"><div className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white group-hover/btn:bg-white/20 transition-all border border-white/10 hover:scale-110"><Share2 size={28} /></div><span className="text-xs font-bold text-white shadow-black drop-shadow-md">{reel.shares}</span></button>
                                  <button className="p-3 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 border border-white/10 mt-2 animate-spin-slow"><Music size={24} /></button>
                              </div>
                              
                              {/* Info Content */}
                              <div className="absolute bottom-6 left-4 right-16 text-white pointer-events-none z-10">
                                  <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 p-[2px]">
                                          <div className="w-full h-full rounded-full bg-black flex items-center justify-center font-bold text-xs">{reel.author[0]}</div>
                                      </div>
                                      <div className="flex flex-col">
                                          <span className="font-bold text-base hover:underline cursor-pointer">@{reel.author.replace(/\s/g, '').toLowerCase()}</span>
                                          <button className="text-[10px] border border-white/50 px-2 py-0.5 rounded-md hover:bg-white/20 transition-colors w-fit font-medium">Suivre</button>
                                      </div>
                                  </div>
                                  <p className="text-sm opacity-90 line-clamp-2 mb-2 font-medium">{reel.description}</p>
                                  <div className="flex items-center gap-2 text-xs font-medium bg-black/30 w-fit px-3 py-1 rounded-full backdrop-blur-md border border-white/10">
                                      <Music size={12} className="animate-pulse" /> {reel.musicTrack}
                                  </div>
                              </div>
                              <button onClick={() => setMuted(!muted)} className="absolute top-6 right-4 p-2 bg-black/40 rounded-full text-white backdrop-blur-md hover:bg-black/60 transition-colors pointer-events-auto">{muted ? <VolumeX size={20}/> : <Volume2 size={20}/>}</button>
                          </div>
                      ))}
                  </div>
              )}

              {/* LIVES VIEW */}
              {activeTab === 'lives' && (
                  <div className="p-4 grid grid-cols-1 gap-6">
                      {ACTIVE_LIVES.map(live => (
                          <div key={live.id} onClick={() => onOpenLive(live.id)} className="relative aspect-video rounded-2xl overflow-hidden cursor-pointer group shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 ring-1 ring-black/5">
                              <img src={live.hostAvatar} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-black/30 opacity-80 group-hover:opacity-60 transition-opacity"></div>
                              
                              <div className="absolute top-4 left-4 flex gap-2">
                                  <span className="bg-red-600 text-white px-3 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1.5 animate-pulse shadow-lg"><div className="w-2 h-2 bg-white rounded-full"></div> Live</span>
                                  {live.isMixed && <span className="bg-indigo-600/90 backdrop-blur-md text-white px-3 py-1 rounded-md text-xs font-bold uppercase flex items-center gap-1 border border-white/10"><Bot size={12} /> + IA</span>}
                              </div>
                              
                              <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md px-2 py-1 rounded-lg text-white text-xs font-mono flex items-center gap-1 border border-white/10">
                                  <Users size={12} /> {live.viewers}
                              </div>

                              <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-black via-black/80 to-transparent">
                                  <h3 className="font-bold text-xl leading-tight text-white mb-2">{live.title}</h3>
                                  <div className="flex items-center gap-2">
                                      <img src={live.hostAvatar} className="w-6 h-6 rounded-full border border-white/50" /> 
                                      <span className="text-white/90 text-sm font-medium">{live.hostName}</span>
                                  </div>
                              </div>
                              
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/50 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                                      <Play className="ml-1 text-white fill-current" size={32} />
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              )}

              {/* TRIBES VIEW */}
              {activeTab === 'tribes' && (
                  selectedTribe ? (
                      // ... Tribe Detail (could be extracted but kept inline for now)
                      <div className="p-4">
                          <button onClick={() => setSelectedTribe(null)} className="mb-4 flex items-center gap-2 text-slate-500 font-bold hover:text-slate-900 transition-colors"><ChevronLeft /> Retour</button>
                          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                              <h2 className="text-2xl font-black text-slate-900 mb-2">{selectedTribe.name}</h2>
                              <p className="text-slate-600">{selectedTribe.description}</p>
                          </div>
                      </div>
                  ) : (
                      <div className="p-6 grid grid-cols-1 gap-4">
                          {TRIBES.map(tribe => (
                              <div key={tribe.id} onClick={() => setSelectedTribe(tribe)} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-5 cursor-pointer hover:shadow-lg hover:border-indigo-100 transition-all group">
                                  <div className="w-24 h-24 rounded-xl overflow-hidden shrink-0 relative shadow-md">
                                      <img src={tribe.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                      {tribe.isJoined && <div className="absolute bottom-0 right-0 bg-green-500 text-white p-1 rounded-tl-lg rounded-br-lg"><Check size={12} /></div>}
                                  </div>
                                  <div className="flex-1">
                                      <h3 className="font-black text-slate-900 text-lg group-hover:text-indigo-600 transition-colors line-clamp-1">{tribe.name}</h3>
                                      <p className="text-sm text-slate-500 line-clamp-2 mt-1 leading-relaxed">{tribe.description}</p>
                                      <div className="flex items-center gap-3 mt-3">
                                          <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold">{tribe.category}</span>
                                          <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><Users size={12} /> {tribe.members}</span>
                                      </div>
                                  </div>
                                  <div className="self-center">
                                      <ChevronRight className="text-slate-300 group-hover:text-indigo-400 transition-colors" />
                                  </div>
                              </div>
                          ))}
                      </div>
                  )
              )}
          </div>
      </div>

      {/* Right Sidebar (Desktop Only) */}
      <div className="hidden xl:flex w-80 bg-white border-l border-slate-200/60 p-6 flex-col gap-8 h-full overflow-y-auto">
          
          {/* Trending Box */}
          <div className="animate-fade-up">
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg"><TrendingUp className="text-pink-500" /> Tendances</h3>
              <div className="space-y-2">
                  {[
                      { tag: '#SenegalTech', posts: '12.5k' },
                      { tag: '#VisaFrance', posts: '8.2k' },
                      { tag: '#InnovationAfrique', posts: '5.1k' },
                      { tag: '#FormationGratuite', posts: '3.9k' }
                  ].map((trend, i) => (
                      <div key={i} className="flex justify-between items-center group cursor-pointer hover:bg-slate-50 p-3 rounded-xl transition-colors">
                          <div>
                              <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{trend.tag}</div>
                              <div className="text-xs text-slate-400 font-medium">{trend.posts} posts</div>
                          </div>
                          <MoreHorizontal size={16} className="text-slate-300 hover:text-slate-600" />
                      </div>
                  ))}
              </div>
          </div>

          {/* Suggestions Box */}
          <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
              <h3 className="font-black text-slate-900 mb-4 flex items-center gap-2 text-lg"><UserPlus className="text-indigo-500" /> Suggestions</h3>
              <div className="space-y-4">
                  {LEADERBOARD.slice(0, 3).map((user, i) => (
                      <div key={i} className="flex items-center gap-3">
                          <img src={user.avatar} className="w-10 h-10 rounded-full object-cover border border-slate-100" />
                          <div className="flex-1 min-w-0">
                              <div className="font-bold text-sm text-slate-900 truncate">{user.name}</div>
                              <div className="text-xs text-slate-500 truncate">Expert {i === 0 ? 'Droit' : 'Tech'}</div>
                          </div>
                          <button className="text-xs font-bold text-indigo-600 hover:bg-indigo-50 px-3 py-1.5 rounded-full transition-colors border border-indigo-100">Suivre</button>
                      </div>
                  ))}
              </div>
          </div>

          {/* Leaderboard Mini */}
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl p-5 text-white shadow-lg animate-fade-up" style={{ animationDelay: '0.2s' }}>
              <h3 className="font-bold mb-4 flex items-center gap-2"><Trophy className="text-yellow-300" size={18} /> Top Contributeurs</h3>
              <div className="space-y-3">
                  {LEADERBOARD.slice(0, 3).map((user, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/10 p-2 rounded-xl border border-white/10 backdrop-blur-sm">
                          <div className="font-bold text-yellow-300 w-4 text-center text-sm">{i+1}</div>
                          <img src={user.avatar} className="w-8 h-8 rounded-full border border-white/30" />
                          <div className="flex-1 text-xs font-bold truncate">{user.name}</div>
                          <div className="text-xs font-mono text-indigo-200">{user.xp/1000}k</div>
                      </div>
                  ))}
              </div>
              <button className="w-full mt-4 py-2 bg-white text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-colors shadow-sm">Voir le classement complet</button>
          </div>

          <div className="text-xs text-slate-400 text-center mt-auto">
              © 2025 Le Monde à Vous • Confidentialité • Conditions
          </div>
      </div>

      {/* Creator Modals */}
      {isLiveModalOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-scale-in">
              <div className="bg-white rounded-[2rem] w-full max-w-md p-8 relative overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-500"></div>
                  <button onClick={() => setIsLiveModalOpen(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                  
                  <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-600 shadow-inner ring-4 ring-red-50">
                          <Radio size={40} className="animate-pulse" />
                      </div>
                      <h2 className="text-2xl font-black text-slate-900">Lancer un Live</h2>
                      <p className="text-slate-500 mt-2 text-sm">Invitez une IA pour co-animer avec vous et engagez votre audience.</p>
                  </div>
                  
                  <div className="space-y-5">
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-1.5 block">Titre du Live</label>
                          <input 
                            value={liveForm.title} 
                            onChange={e => setLiveForm({...liveForm, title: e.target.value})} 
                            placeholder="Ex: Q&A Immigration Canada..." 
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-bold text-slate-800 focus:ring-2 focus:ring-red-500 outline-none transition-all placeholder-slate-400" 
                          />
                      </div>
                      
                      <div>
                          <label className="text-xs font-bold text-slate-500 uppercase ml-1 mb-2 block">Co-Animateur IA</label>
                          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                              {AGENTS.map(agent => (
                                  <div 
                                    key={agent.id} 
                                    onClick={() => setLiveForm({...liveForm, selectedAgentId: agent.id})} 
                                    className={`flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer p-2 rounded-2xl border-2 transition-all ${liveForm.selectedAgentId === agent.id ? 'border-red-500 bg-red-50 ring-2 ring-red-200 scale-105' : 'border-transparent hover:bg-slate-50 hover:border-slate-100'}`}
                                  >
                                      <img src={agent.avatarUrl} className="w-12 h-12 rounded-full object-cover shadow-sm" />
                                      <span className="text-[10px] font-bold text-center leading-tight line-clamp-1">{agent.name}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
                  
                  <button onClick={handleStartLive} className="w-full mt-6 bg-gradient-to-r from-red-600 to-orange-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-500/30 hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                      <Radio size={20} /> Passer au Direct
                  </button>
              </div>
          </div>
      )}

      {isUniversalCreatorOpen && <UniversalCreator onClose={() => setIsUniversalCreatorOpen(false)} onPublish={(post) => { 
          // Handle publish (mock)
          setIsUniversalCreatorOpen(false); 
          alert('Contenu publié !');
      }} />}
      
      {isReelCreatorOpen && <ReelsCreator onClose={() => setIsReelCreatorOpen(false)} onPublish={() => { 
          setIsReelCreatorOpen(false); 
          alert('Reel publié !'); 
      }} />}

    </div>
  );
};
