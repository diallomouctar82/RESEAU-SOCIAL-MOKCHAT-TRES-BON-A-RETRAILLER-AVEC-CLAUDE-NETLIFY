import React from 'react';

/**
 * DS-L1 — les deux motifs vivants de l'image de référence du Studio Live,
 * isolés ici pour qu'ils restent une seule source de vérité (le même geste
 * dans la scène, le panneau et les modales) et qu'ils soient testables sans
 * monter tout SocialLive.
 *
 * Rien d'aléatoire : les positions, tailles et retards sont dérivés de
 * l'index. Un `Math.random()` aurait redistribué les bulles à chaque rendu
 * de React — une carte qui « saute » à chaque état changé, exactement le
 * genre de mouvement gratuit que la direction artistique interdit.
 */

/** Bulles qui montent À L'INTÉRIEUR d'une carte (jamais par-dessus une vraie vidéo). */
export function LiveBubbles({ count = 5 }: { count?: number }): React.ReactElement {
    return (
        <span className="live-bubbles" aria-hidden="true">
            {Array.from({ length: count }, (_, i) => {
                const taille = 6 + ((i * 5) % 11); // 6 → 16 px
                return (
                    <span
                        key={i}
                        style={{
                            left: `${8 + i * 19}%`,
                            width: `${taille}px`,
                            height: `${taille}px`,
                            animationDelay: `${i * 1.7}s`,
                            animationDuration: `${8 + (i % 3) * 2.5}s`,
                        }}
                    />
                );
            })}
        </span>
    );
}

/**
 * Onde de voix — la voix devient visible à côté du visage. `level` (0-100)
 * est le VRAI niveau audio quand on l'a ; sans lui les barres gardent leur
 * respiration de repos plutôt que de simuler une parole qui n'existe pas.
 */
export function LiveVoiceWave({
    level,
    muted = false,
    bars = 5,
}: {
    level?: number;
    muted?: boolean;
    bars?: number;
}): React.ReactElement {
    const amplitude = typeof level === 'number' ? Math.max(0, Math.min(100, level)) / 100 : undefined;
    return (
        <span className={`live-wave${muted ? ' live-wave--muted' : ''}`} aria-hidden="true">
            {Array.from({ length: bars }, (_, i) => (
                <i
                    key={i}
                    style={{
                        animationDelay: `${i * 0.13}s`,
                        // Un niveau réel fige la hauteur (pas d'animation qui
                        // contredirait la mesure) ; sans mesure, on laisse la
                        // respiration par défaut définie en CSS.
                        ...(amplitude !== undefined && !muted
                            ? { animation: 'none', transform: `scaleY(${0.22 + amplitude * 0.78})` }
                            : {}),
                    }}
                />
            ))}
        </span>
    );
}
