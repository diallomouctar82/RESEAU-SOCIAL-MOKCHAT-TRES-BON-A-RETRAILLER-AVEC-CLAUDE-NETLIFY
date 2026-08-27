import React, { useState, useEffect } from 'react';
import { Story } from '../types';
import { X, ChevronLeft, ChevronRight, Heart, Send, Sparkles, Radio, Eye } from 'lucide-react';

interface StoryViewerModalProps {
  stories: Story[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onOpenLiveSession?: (story: Story) => void;
}

export const StoryViewerModal: React.FC<StoryViewerModalProps> = ({
  stories,
  initialIndex,
  isOpen,
  onClose,
  onOpenLiveSession
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionSent, setReactionSent] = useState<string | null>(null);

  const story = stories[currentIndex];

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setProgress(0);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen || !story || isPaused) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < stories.length - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + 2;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isOpen, currentIndex, stories.length, isPaused, story, onClose]);

  if (!isOpen || !story) return null;

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleSendReaction = (emoji: string) => {
    setReactionSent(emoji);
    setTimeout(() => setReactionSent(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in select-none">
      
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-6 right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all z-20 backdrop-blur-md"
      >
        <X size={24} />
      </button>

      {/* Story Stage Frame */}
      <div 
        className="relative w-full max-w-md aspect-[9/16] max-h-[90vh] bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col justify-between"
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        
        {/* Background media */}
        <img
          src={story.mediaUrl || story.avatar}
          alt={story.author}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/60 pointer-events-none" />

        {/* Floating Reaction Animation */}
        {reactionSent && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
            <span className="text-7xl animate-bounce">{reactionSent}</span>
          </div>
        )}

        {/* Top Progress Bars */}
        <div className="relative z-10 p-3 pt-4 flex gap-1.5">
          {stories.map((s, idx) => (
            <div key={s.id} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-100 ease-linear"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%'
                }}
              />
            </div>
          ))}
        </div>

        {/* Top Author Info */}
        <div className="relative z-10 px-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img src={story.avatar} alt={story.author} className="w-10 h-10 rounded-full object-cover border-2 border-white" />
              {story.isLive && (
                <span className="absolute -bottom-1 -right-1 bg-red-600 text-white text-[8px] font-black px-1 rounded-full uppercase animate-pulse">
                  Live
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-white leading-tight">{story.author}</h4>
                <Sparkles size={12} className="text-amber-400" />
              </div>
              <span className="text-[10px] text-white/70">{story.timestamp || 'Il y a 1h'}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {story.viewersCount && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-white/80 bg-black/40 px-2 py-0.5 rounded-full">
                <Eye size={12} /> {story.viewersCount}
              </span>
            )}
            {story.isLive && (
              <button
                onClick={() => onOpenLiveSession && onOpenLiveSession(story)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-[11px] font-extrabold rounded-full flex items-center gap-1 shadow-md animate-pulse"
              >
                <Radio size={12} /> Rejoindre
              </button>
            )}
          </div>
        </div>

        {/* Tap areas for left / right navigation */}
        <div className="absolute inset-y-20 inset-x-0 flex z-10 pointer-events-auto">
          <div onClick={handlePrev} className="w-1/3 h-full cursor-pointer" />
          <div onClick={handleNext} className="w-2/3 h-full cursor-pointer" />
        </div>

        {/* Bottom Story Caption & Interaction */}
        <div className="relative z-10 p-4 space-y-3">
          {story.caption && (
            <p className="text-xs font-medium text-white/95 leading-relaxed bg-black/40 backdrop-blur-md p-3 rounded-2xl border border-white/10">
              {story.caption}
            </p>
          )}

          {/* Quick Reaction Emojis */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5 flex-1 overflow-x-auto scrollbar-hide py-1">
              {['❤️', '🔥', '👏', '💡', '😍', '🙌'].map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendReaction(emoji)}
                  className="px-2.5 py-1.5 bg-white/20 hover:bg-white/40 active:scale-125 rounded-full text-base backdrop-blur-md transition-transform"
                >
                  {emoji}
                </button>
              ))}
            </div>

            <button
              onClick={() => handleSendReaction('❤️')}
              className="p-2.5 bg-rose-600 text-white rounded-full shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              <Heart size={18} fill="white" />
            </button>
          </div>
        </div>

      </div>

      {/* Side Navigation Chevrons */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrev}
          className="absolute left-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full hidden md:flex items-center justify-center transition-all"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {currentIndex < stories.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-6 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full hidden md:flex items-center justify-center transition-all"
        >
          <ChevronRight size={24} />
        </button>
      )}

    </div>
  );
};
