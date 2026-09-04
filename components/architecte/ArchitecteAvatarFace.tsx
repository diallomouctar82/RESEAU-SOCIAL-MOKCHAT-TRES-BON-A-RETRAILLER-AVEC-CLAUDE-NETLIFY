import React from 'react';

/**
 * VISAGE PAR DÉFAUT DE L'ARCHITECTE — dessin vectoriel original.
 *
 * Composé d'après la direction visuelle fournie par la Direction (androïde
 * de profil, calotte claire, disque optique cyan à la tempe, fond bleu nuit).
 * C'est un DESSIN, pas la photo de référence : tant que celle-ci n'est pas
 * déposée dans le dépôt, l'Architecte a tout de même un visage — jamais un
 * cadre vide ni une image cassée. La Direction la remplace quand elle veut
 * par « Changer l'avatar » dans le Super-Admin.
 *
 * Pourquoi du SVG et pas une image : la bouche doit être un ÉLÉMENT
 * ADRESSABLE pour que la synchro labiale l'ouvre réellement. Sur une photo,
 * le code ne sait pas où est la bouche — d'où l'ancre réglable côté
 * Super-Admin pour ce cas-là.
 */

export interface ArchitecteAvatarFaceProps {
    /** 0 = bouche close, 1 = grande ouverte. Piloté par la synchro labiale. */
    mouthOpenness: number;
    /** Teinte de l'état courant (halo de la grammaire d'états). */
    accent: string;
    /** `false` = strictement immobile : ni clignement, ni pulsation. */
    animated: boolean;
}

export const ArchitecteAvatarFace: React.FC<ArchitecteAvatarFaceProps> = ({
    mouthOpenness,
    accent,
    animated,
}) => {
    // Hauteur de la fente lumineuse qui tient lieu de bouche : 1,5 px au
    // repos (un trait), jusqu'à 9 px grande ouverte. Bornée pour qu'une
    // valeur aberrante ne déforme jamais le visage.
    const openness = Math.min(1, Math.max(0, Number.isFinite(mouthOpenness) ? mouthOpenness : 0));
    const mouthHeight = 1.5 + openness * 7.5;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="arch-skull" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#F4F8FB" />
                    <stop offset="55%" stopColor="#D3DEE8" />
                    <stop offset="100%" stopColor="#9AAAB9" />
                </linearGradient>
                <radialGradient id="arch-optic" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#EAFEFF" />
                    <stop offset="45%" stopColor={accent} />
                    <stop offset="100%" stopColor="#06323F" />
                </radialGradient>
                <linearGradient id="arch-ground" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#111C3A" />
                    <stop offset="100%" stopColor="#070D1E" />
                </linearGradient>
            </defs>

            {/* Fond bleu nuit — la teinte institutionnelle du dépôt (navy-950). */}
            <circle cx="50" cy="50" r="50" fill="url(#arch-ground)" />

            {/* Nuque et col mécanique, posés avant la tête. */}
            <path d="M58 74 L58 96 Q50 100 42 96 L44 74 Z" fill="#5C6B7A" />
            <path d="M46 78 L58 78 L58 84 L46 85 Z" fill="#3B4854" opacity="0.9" />

            {/* Calotte crânienne, de profil, tournée vers la gauche. */}
            <path
                d="M62 22 Q76 32 76 50 Q76 66 66 76 L44 78 Q34 74 30 62 Q24 58 25 50 Q26 42 32 40 Q34 26 48 20 Q56 17 62 22 Z"
                fill="url(#arch-skull)"
            />
            {/* Ligne de séparation de la coque — la couture qui fait « machine ». */}
            <path d="M48 20 Q52 40 50 60" stroke="#8FA0B0" strokeWidth="0.8" fill="none" opacity="0.7" />

            {/* Front et arête du nez. */}
            <path d="M32 40 Q28 46 29 51 L33 53 Q31 57 34 58" stroke="#7E8FA0" strokeWidth="0.7" fill="none" />

            {/* Œil — la seule pastille de vie du visage. */}
            <ellipse cx="38" cy="47" rx="3.4" ry="2.2" fill="#0B1B26" />
            <ellipse cx="38.4" cy="47" rx="2.1" ry="1.5" fill={accent}>
                {animated && (
                    <animate attributeName="ry" values="1.5;0.12;1.5" dur="6s" repeatCount="indefinite" keyTimes="0;0.045;0.09" />
                )}
            </ellipse>

            {/* Bouche : fente lumineuse. C'est CET élément que la synchro
                labiale ouvre — sa hauteur est pilotée, pas décorative. */}
            <rect
                x="32"
                y={60 - mouthHeight / 2}
                width="13"
                height={mouthHeight}
                rx={mouthHeight / 2}
                fill={accent}
                opacity={0.35 + openness * 0.55}
            />

            {/* Disque optique de la tempe — la signature de la référence. */}
            <circle cx="62" cy="50" r="15" fill="#0A1622" />
            <circle cx="62" cy="50" r="12.5" fill="url(#arch-optic)" opacity="0.92" />
            <circle cx="62" cy="50" r="7" fill="#08222C" />
            <circle cx="62" cy="50" r="3.2" fill={accent}>
                {animated && (
                    <animate attributeName="r" values="3.2;4.4;3.2" dur="3.4s" repeatCount="indefinite" />
                )}
            </circle>
            {/* Couronne segmentée du disque. */}
            <circle
                cx="62"
                cy="50"
                r="14"
                fill="none"
                stroke={accent}
                strokeWidth="1.1"
                strokeDasharray="4 3"
                opacity="0.75"
            >
                {animated && (
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 62 50"
                        to="360 62 50"
                        dur="18s"
                        repeatCount="indefinite"
                    />
                )}
            </circle>

            {/* Nappe de nuque : câblage suggéré, jamais détaillé. */}
            <path d="M66 62 Q72 68 70 78" stroke="#4A5A6A" strokeWidth="1.6" fill="none" />
            <path d="M62 66 Q66 72 64 80" stroke="#3E4C5A" strokeWidth="1.2" fill="none" />
        </svg>
    );
};
