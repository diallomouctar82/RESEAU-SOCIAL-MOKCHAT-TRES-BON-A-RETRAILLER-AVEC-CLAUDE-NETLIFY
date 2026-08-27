import React, { useState } from 'react';
import { MemberProfile, Post, Story, Reel, LiveStream, UserProfile } from '../types';
import { X, UserPlus, UserCheck, MessageSquare, Shield, Globe, Lock, Users, MapPin, Calendar, Award, Sparkles, Play, Video, Eye, Radio, FileText, CheckCircle2, Sliders, Bell, Share2, Heart, MessageCircle } from 'lucide-react';

interface MemberProfileModalProps {
  member: MemberProfile;
  currentUser: UserProfile;
  isOpen: boolean;
  onClose: () => void;
  posts: Post[];
  stories: Story[];
  reels: Reel[];
  lives: LiveStream[];
  onToggleFollow: (memberId: string) => void;
  onStartChatWithMember: (member: MemberProfile) => void;
  onUpdatePrivacySettings?: (newSettings: MemberProfile['privacySettings']) => void;
}

export const MemberProfileModal: React.FC<MemberProfileModalProps> = ({
  member,
  currentUser,
  isOpen,
  onClose,
  posts,
  stories,
  reels,
  lives,
  onToggleFollow,
  onStartChatWithMember,
  onUpdatePrivacySettings
}) => {
  const isMe = member.id === 'u1' || member.name === currentUser.name || member.id === currentUser.id;
  const [activeTab, setActiveTab] = useState<'posts' | 'stories' | 'reels' | 'lives' | 'privacy'>('posts');
  const [privacySettings, setPrivacySettings] = useState(member.privacySettings);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  // Filter content for this member
  const memberPosts = posts.filter(p => p.authorId === member.id || p.authorName === member.name);
  const memberStories = stories.filter(s => s.authorId === member.id || s.author === member.name);
  const memberReels = reels.filter(r => r.authorId === member.id || r.author === member.name);
  const memberLives = lives.filter(l => l.hostName === member.name);

  const handlePrivacyChange = (key: keyof MemberProfile['privacySettings'], value: any) => {
    const updated = { ...privacySettings, [key]: value };
    setPrivacySettings(updated);
    if (onUpdatePrivacySettings) {
      onUpdatePrivacySettings(updated);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard.writeText(`https://lemondeavous.org/mooc/members/${member.id}`);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        
        {/* Banner Cover & Close */}
        <div className="relative h-44 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 flex-shrink-0">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all shadow-md z-10"
          >
            <X size={20} />
          </button>

          {/* Quick Share */}
          <button 
            onClick={handleShareProfile}
            className="absolute top-4 right-16 px-3 py-1.5 bg-black/40 hover:bg-black/60 text-white text-xs font-bold rounded-full backdrop-blur-md transition-all shadow-md flex items-center gap-1.5 z-10"
          >
            <Share2 size={13} />
            {copiedLink ? 'Lien copié !' : 'Partager'}
          </button>
        </div>

        {/* Profile Header Bar */}
        <div className="px-6 pb-4 pt-0 border-b border-slate-100 bg-white relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-16 mb-4">
            
            {/* Avatar & Badges */}
            <div className="flex items-end gap-4">
              <div className="relative">
                <img 
                  src={member.avatarUrl} 
                  alt={member.name} 
                  className="w-28 h-28 rounded-3xl object-cover border-4 border-white shadow-xl ring-2 ring-indigo-500/20"
                />
                {member.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white shadow-sm" title="Membre Vérifié Mooc">
                    <CheckCircle2 size={14} />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl font-black text-slate-900">{member.name}</h2>
                  {isMe && (
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-extrabold rounded-md border border-indigo-200">
                      Vous (Espace Personnel)
                    </span>
                  )}
                </div>
                <p className="text-xs font-semibold text-indigo-600">{member.title}</p>
                <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                  <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-400" /> {member.location}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1"><Calendar size={12} className="text-slate-400" /> Membre depuis {member.joinedDate}</span>
                </div>
              </div>
            </div>

            {/* Actions Buttons */}
            <div className="flex items-center gap-2 pt-2 sm:pt-0">
              {!isMe ? (
                <>
                  <button
                    onClick={() => onToggleFollow(member.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm ${member.isFollowing ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-95 text-white'}`}
                  >
                    {member.isFollowing ? (
                      <>
                        <UserCheck size={16} /> Abonné(e)
                      </>
                    ) : (
                      <>
                        <UserPlus size={16} /> S'abonner
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => { onClose(); onStartChatWithMember(member); }}
                    className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition-all flex items-center gap-2"
                  >
                    <MessageSquare size={16} /> Mooc Chat
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setActiveTab('privacy')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-all flex items-center gap-2"
                >
                  <Sliders size={16} /> Paramètres Espace
                </button>
              )}
            </div>

          </div>

          {/* Bio & Skills */}
          <p className="text-xs text-slate-700 leading-relaxed max-w-3xl mb-3">{member.bio}</p>

          {member.skills && member.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-4">
              {member.skills.map(s => (
                <span key={s} className="px-2.5 py-1 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-lg">
                  #{s}
                </span>
              ))}
            </div>
          )}

          {/* Metrics Counters */}
          <div className="flex items-center gap-6 py-2 border-t border-slate-100 text-xs text-slate-600">
            <div><strong className="text-slate-900 font-black text-sm">{member.followersCount}</strong> abonnés</div>
            <div><strong className="text-slate-900 font-black text-sm">{member.followingCount}</strong> abonnements</div>
            <div><strong className="text-slate-900 font-black text-sm">{member.postsCount || memberPosts.length}</strong> publications</div>
            <div><strong className="text-slate-900 font-black text-sm">{member.reelsCount || memberReels.length}</strong> reels</div>
            <div><strong className="text-slate-900 font-black text-sm">{member.livesCount || memberLives.length}</strong> lives</div>
          </div>
        </div>

        {/* Space Tabs */}
        <div className="flex border-b border-slate-100 bg-slate-50 px-6 gap-2 overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setActiveTab('posts')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'posts' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <FileText size={15} />
            Publications ({memberPosts.length})
          </button>

          <button
            onClick={() => setActiveTab('stories')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'stories' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Sparkles size={15} />
            Stories ({memberStories.length})
          </button>

          <button
            onClick={() => setActiveTab('reels')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'reels' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Video size={15} />
            Reels & Vidéos ({memberReels.length})
          </button>

          <button
            onClick={() => setActiveTab('lives')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'lives' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <Radio size={15} />
            Lives & Replays ({memberLives.length})
          </button>

          {isMe && (
            <button
              onClick={() => setActiveTab('privacy')}
              className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'privacy' ? 'border-indigo-600 text-indigo-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
            >
              <Shield size={15} />
              Confidentialité & Paramètres
            </button>
          )}
        </div>

        {/* Tab Content Display */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-50/50">
          
          {/* POSTS TAB */}
          {activeTab === 'posts' && (
            <div className="space-y-4 max-w-2xl mx-auto">
              {memberPosts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
                  <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-3 text-indigo-500">
                    <FileText size={24} />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">Aucune publication pour le moment</h4>
                  <p className="text-xs text-slate-500 mt-1">Les contenus partagés par ce membre apparaîtront ici.</p>
                </div>
              ) : (
                memberPosts.map(post => (
                  <article key={post.id} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span className="font-bold text-slate-800">{post.authorName}</span>
                        <span>•</span>
                        <span>{post.timestamp}</span>
                        <span>•</span>
                        <span className="capitalize">{post.visibility || 'Public'}</span>
                      </div>
                      {post.category && (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md">
                          {post.category}
                        </span>
                      )}
                    </div>
                    
                    <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">{post.content}</p>
                    
                    {post.imageUrl && (
                      <div className="rounded-xl overflow-hidden max-h-60 bg-slate-100">
                        <img src={post.imageUrl} className="w-full h-full object-cover" />
                      </div>
                    )}

                    {post.document && (
                      <div className="p-3 bg-indigo-50/60 rounded-xl border border-indigo-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                            PDF
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-800">{post.document.name}</div>
                            <div className="text-[10px] text-slate-500">{post.document.size} • {post.document.pageCount || 1} pages</div>
                          </div>
                        </div>
                        <a 
                          href={post.document.url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-200 shadow-xs"
                        >
                          Ouvrir
                        </a>
                      </div>
                    )}

                    <div className="flex items-center gap-4 pt-2 border-t border-slate-50 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-semibold"><Heart size={14} className="text-red-500" /> {post.likes}</span>
                      <span className="flex items-center gap-1 font-semibold"><MessageCircle size={14} className="text-blue-500" /> {post.comments}</span>
                    </div>
                  </article>
                ))
              )}
            </div>
          )}

          {/* STORIES TAB */}
          {activeTab === 'stories' && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {memberStories.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
                  <p className="text-xs text-slate-500">Aucune story active dans l'espace personnel.</p>
                </div>
              ) : (
                memberStories.map(story => (
                  <div key={story.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-md group border border-slate-200 bg-slate-900">
                    <img src={story.mediaUrl || member.avatarUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-white bg-black/40 px-2 py-0.5 rounded-full backdrop-blur-xs self-start">
                        {story.timestamp || 'Récent'}
                      </span>
                      <p className="text-xs text-white font-medium line-clamp-2">{story.caption || 'Story Mooc'}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* REELS TAB */}
          {activeTab === 'reels' && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {memberReels.length === 0 ? (
                <div className="col-span-full text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
                  <p className="text-xs text-slate-500">Aucun Reel publié pour le moment.</p>
                </div>
              ) : (
                memberReels.map(reel => (
                  <div key={reel.id} className="relative aspect-[9/16] rounded-2xl overflow-hidden shadow-md group bg-slate-900 border border-slate-200">
                    <img src={reel.thumbnailUrl || member.avatarUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-3 flex flex-col justify-between">
                      <div className="flex items-center justify-between text-white text-[11px] font-bold">
                        <span className="flex items-center gap-1"><Play size={12} fill="white" /> {reel.likes}</span>
                      </div>
                      <div>
                        <p className="text-xs text-white font-semibold line-clamp-2">{reel.description}</p>
                        <span className="text-[10px] text-slate-300 mt-1 block">🎵 {reel.musicTrack}</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* LIVES TAB */}
          {activeTab === 'lives' && (
            <div className="space-y-3 max-w-xl mx-auto">
              {memberLives.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl border border-slate-100 p-8">
                  <p className="text-xs text-slate-500">Aucun live enregistré ou programmé.</p>
                </div>
              ) : (
                memberLives.map(live => (
                  <div key={live.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold">
                        <Radio size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900">{live.title}</h4>
                        <span className="text-[11px] text-slate-500">{live.viewers} spectateurs • {live.duration} min</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-600 text-xs font-bold rounded-lg">Replay</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* PRIVACY SETTINGS TAB (Only for Me) */}
          {activeTab === 'privacy' && isMe && (
            <div className="max-w-xl mx-auto bg-white rounded-2xl p-6 border border-slate-100 space-y-6">
              <div>
                <h3 className="font-bold text-sm text-slate-900 mb-1 flex items-center gap-2">
                  <Shield className="text-indigo-600" size={18} />
                  Paramètres de Confidentialité & Espace Personnel
                </h3>
                <p className="text-xs text-slate-500">Contrôlez qui peut voir vos contenus, vous envoyer des messages et interagir avec vous.</p>
              </div>

              {/* Profile Visibility */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Visibilité du Profil :</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'public', label: 'Public', icon: Globe, desc: 'Visible par tous' },
                    { id: 'network', label: 'Réseau', icon: Users, desc: 'Abonnés uniquement' },
                    { id: 'private', label: 'Privé', icon: Lock, desc: 'Moi uniquement' }
                  ].map(opt => (
                    <button
                      key={opt.id}
                      onClick={() => handlePrivacyChange('profileVisibility', opt.id)}
                      className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-1 ${privacySettings.profileVisibility === opt.id ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}
                    >
                      <opt.icon size={16} />
                      <span className="text-xs">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Messages Permission */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Autoriser les messages Mooc Chat depuis :</label>
                <select
                  value={privacySettings.allowMessagesFrom}
                  onChange={(e) => handlePrivacyChange('allowMessagesFrom', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  <option value="all">Tous les membres de la communauté Mooc</option>
                  <option value="network">Uniquement mes abonnés et contacts réciproques</option>
                  <option value="none">Désactiver la réception de nouveaux messages</option>
                </select>
              </div>

              {/* Toggles */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-700">Afficher mon statut en ligne dans Mooc Chat</span>
                  <input
                    type="checkbox"
                    checked={privacySettings.showOnlineStatus}
                    onChange={(e) => handlePrivacyChange('showOnlineStatus', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-700">Autoriser les mentions et tags dans les publications</span>
                  <input
                    type="checkbox"
                    checked={privacySettings.allowTagging}
                    onChange={(e) => handlePrivacyChange('allowTagging', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-xs font-semibold text-slate-700">Partager automatiquement mon activité d'apprentissage (Badges & Certificats)</span>
                  <input
                    type="checkbox"
                    checked={privacySettings.showActivityFeed}
                    onChange={(e) => handlePrivacyChange('showActivityFeed', e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded"
                  />
                </label>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                Vos paramètres sont synchronisés et appliqués en temps réel sur l'ensemble de la plateforme.
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
