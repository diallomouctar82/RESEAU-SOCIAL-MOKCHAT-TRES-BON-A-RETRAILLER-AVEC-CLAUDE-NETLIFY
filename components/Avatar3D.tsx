
import React, { useEffect, useRef, useState } from 'react';
import { AGENTS } from '../constants';
import { AvatarGrammarState, avatarHaloProps } from '../services/live/liveMaterialSystem';

type LegacyAvatarState = 'idle' | 'speaking' | 'thinking' | 'routine';

interface Avatar3DProps {
    avatarId: string;
    state: LegacyAvatarState;
    audioLevel?: number; // 0 to 100
    className?: string;
    showHud?: boolean;
    metaverseMode?: boolean; // New prop for immersive mode
    /**
     * Grammaire d'états étendue (LOOP 10/14, prompt 5/7) — optionnelle,
     * réservée au LIVE pour l'instant (les autres appelants d'Avatar3D
     * continuent avec `state` seul, comportement inchangé). Quand fournie,
     * pilote le halo verre/eau/lumière ET la vidéo affichée (voir
     * GRAMMAR_TO_LEGACY_STATE) — l'avatar est intégré au même système que
     * le LIVE, pas un composant isolé.
     */
    grammarState?: AvatarGrammarState;
}

/** Un seul des 4 supports vidéo existants par état de grammaire — la différenciation visuelle des 10 états vient du halo, pas de 10 vidéos qui n'existent pas. */
const GRAMMAR_TO_LEGACY_STATE: Record<AvatarGrammarState, LegacyAvatarState> = {
    repos: 'idle',
    ecoute: 'thinking',
    vision_active: 'thinking',
    comprehension: 'thinking',
    reflexion: 'thinking',
    reponse: 'speaking',
    action: 'speaking',
    succes: 'speaking',
    incertitude: 'idle',
    erreur: 'idle',
};

export const Avatar3D: React.FC<Avatar3DProps> = ({ avatarId, state, audioLevel = 0, className = "", showHud = true, metaverseMode = false, grammarState }) => {
    const agent = AGENTS.find(a => a.id === avatarId);
    const metaProfile = agent?.metaProfile;
    const effectiveState = grammarState ? GRAMMAR_TO_LEGACY_STATE[grammarState] : state;

    // Fallback if no meta profile
    const currentSrc = !metaProfile ?
        (effectiveState === 'speaking' ? 'https://cdn.coverr.co/videos/coverr-man-talking-to-camera-5339/1080p.mp4' : 'https://cdn.coverr.co/videos/coverr-portrait-of-a-serious-man-1604/1080p.mp4')
        : (effectiveState === 'speaking' ? metaProfile.videos.speaking :
           effectiveState === 'thinking' ? metaProfile.videos.listening :
           effectiveState === 'routine' ? metaProfile.videos.routine :
           metaProfile.videos.idle);

    const videoRef = useRef<HTMLVideoElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    // Physics: Head Tracking Parallax
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!containerRef.current) return;
            const { innerWidth, innerHeight } = window;
            // Normalize -1 to 1
            const x = (e.clientX / innerWidth) * 2 - 1;
            const y = (e.clientY / innerHeight) * 2 - 1;
            setMousePos({ x, y });
        };

        if (metaverseMode) {
            window.addEventListener('mousemove', handleMouseMove);
        }
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [metaverseMode]);

    // Transforms
    const rotateY = mousePos.x * 5; // Look left/right
    const rotateX = -mousePos.y * 5; // Look up/down
    const translateX = mousePos.x * 15; // Move slightly
    const translateY = mousePos.y * 10;

    return (
        <div 
            ref={containerRef}
            className={`relative overflow-hidden perspective-container ${className} ${metaverseMode ? 'w-full h-screen fixed inset-0 z-0' : ''}`}
            style={{ perspective: '1000px' }}
        >
            {/* Background Environment (Metaverse Mode Only) */}
            {metaverseMode && metaProfile && (
                <div className="absolute inset-0 z-[-1]">
                    <video 
                        src={metaProfile.environment}
                        autoPlay loop muted playsInline
                        className="w-full h-full object-cover opacity-60 blur-sm scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50"></div>
                </div>
            )}

            {/* Halo verre/eau/lumière (LOOP 10/14) — seul élément qui différencie visuellement les 10 états de la grammaire ; les 4 supports vidéo existants ne suffisent pas à eux seuls. */}
            {grammarState && (() => {
                const halo = avatarHaloProps(grammarState);
                return <div className={halo.className} style={halo.style} />;
            })()}

            {/* Character Video - "Floating" Effect */}
            <div
                className={`w-full h-full relative transition-transform duration-100 ease-out will-change-transform flex items-end justify-center ${effectiveState === 'speaking' ? 'animate-breathe-fast' : 'animate-breathe'}`}
                style={{
                    transform: metaverseMode ? `
                        rotateY(${rotateY}deg) 
                        rotateX(${rotateX}deg) 
                        translate3d(${translateX}px, ${translateY}px, 0)
                        scale(1.05)
                    ` : 'none'
                }}
            >
                {/* Simulated Lighting */}
                {metaverseMode && (
                    <div 
                        className="absolute inset-0 bg-gradient-to-tr from-brand-500/20 to-purple-500/20 mix-blend-overlay pointer-events-none z-10 rounded-full blur-3xl transform translate-y-20"
                        style={{
                            transform: `translate(${translateX * -2}px, ${translateY * -2}px)`
                        }}
                    ></div>
                )}

                <video
                    ref={videoRef}
                    key={currentSrc} // Force reload on src change for smooth transition
                    src={currentSrc}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className={`object-cover transition-all duration-1000 ${metaverseMode ? 'h-[110%] w-auto max-w-none mask-video-bottom' : 'w-full h-full'}`}
                    style={{ 
                        filter: metaverseMode ? 'contrast(1.1) saturate(1.1) drop-shadow(0 0 20px rgba(0,0,0,0.5))' : 'none'
                    }}
                />
            </div>

            {/* Simple HUD if not metaverse (or specific metaverse HUD) */}
            {showHud && !metaverseMode && (
                <div className="absolute top-4 left-4 bg-black/60 px-2 py-1 rounded text-white text-xs font-bold uppercase backdrop-blur-md">
                    {grammarState || state}
                </div>
            )}
            
            <style>{`
                .mask-video-bottom {
                    -webkit-mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
                    mask-image: linear-gradient(to bottom, black 80%, transparent 100%);
                }
            `}</style>
        </div>
    );
};
