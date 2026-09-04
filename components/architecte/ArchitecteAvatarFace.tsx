import React from 'react';

/**
 * VISAGE PAR DÉFAUT DE L'ARCHITECTE — dessin vectoriel original.
 *
 * Composé d'après la direction visuelle fournie par la Direction : androïde
 * de profil tourné vers la gauche, calotte claire, disque optique cyan à la
 * tempe, fond bleu nuit. C'est un DESSIN, pas la photo de référence : tant
 * que celle-ci n'est pas déposée dans le dépôt, l'Architecte a tout de même
 * un visage — jamais un cadre vide ni une image cassée.
 *
 * Pourquoi du SVG et pas une image : la bouche doit être un ÉLÉMENT
 * ADRESSABLE pour que la synchro labiale l'ouvre réellement. Sur une photo,
 * le code ne sait pas où est la bouche — d'où l'ancre réglable côté
 * Super-Admin pour ce cas-là.
 *
 * Géométrie (revue le 04/09/2026 après capture) : la tête REMPLIT le cadre.
 * La première version laissait une couronne sombre tout autour et plaçait la
 * bouche trop bas et trop peu contrastée — à 56 px, le bouton flottant réel,
 * on ne distinguait ni le profil ni l'ouverture. Le visage occupe désormais
 * la quasi-totalité du disque et la bouche est une fente lumineuse posée sur
 * l'arête du profil, là où l'œil la cherche.
 */

export interface ArchitecteAvatarFaceProps {
    /** 0 = bouche close, 1 = grande ouverte. Piloté par la synchro labiale. */
    mouthOpenness: number;
    /** Teinte de l'état courant (halo de la grammaire d'états). */
    accent: string;
    /** `false` = strictement immobile : ni clignement, ni pulsation. */
    animated: boolean;
    /** Dimensionnement par l'appelant (barre latérale, aperçu…). */
    className?: string;
}

export const ArchitecteAvatarFace: React.FC<ArchitecteAvatarFaceProps> = ({
    mouthOpenness,
    accent,
    animated,
    className = 'w-full h-full',
}) => {
    const openness = Math.min(1, Math.max(0, Number.isFinite(mouthOpenness) ? mouthOpenness : 0));
    // 2 px au repos (un trait net, visible même à 56 px), jusqu'à 11 px.
    const mouthHeight = 1.6 + openness * 9.4;

    return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="arch-skull" x1="0.1" y1="0" x2="0.9" y2="1">
                    <stop offset="0%" stopColor="#FDFEFF" />
                    <stop offset="42%" stopColor="#DCE7F0" />
                    <stop offset="100%" stopColor="#8FA2B4" />
                </linearGradient>
                <linearGradient id="arch-face" x1="0" y1="0" x2="1" y2="0.6">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="60%" stopColor="#E4EDF5" />
                    <stop offset="100%" stopColor="#B6C6D6" />
                </linearGradient>
                <radialGradient id="arch-optic" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FFFFFF" />
                    <stop offset="30%" stopColor={accent} />
                    <stop offset="78%" stopColor="#0B4A5E" />
                    <stop offset="100%" stopColor="#04212C" />
                </radialGradient>
                <radialGradient id="arch-ground" cx="42%" cy="34%" r="78%">
                    <stop offset="0%" stopColor="#16294A" />
                    <stop offset="100%" stopColor="#060B18" />
                </radialGradient>
            </defs>

            <circle cx="50" cy="50" r="50" fill="url(#arch-ground)" />

            {/* Cou et col mécanique, posés avant la tête. */}
            <path d="M44 76 L70 80 L74 100 L40 100 Z" fill="#4E5F72" />
            <path d="M46 80 L69 84 L70 92 L45 89 Z" fill="#33414F" />

            {/* Tête de profil, tournée vers la gauche — elle remplit le cadre.
                Le tracé part du menton, remonte l'arête du visage (lèvres,
                nez, front), passe la calotte, redescend l'occiput et ferme
                par la mâchoire. */}
            <path
                d="M31 71
                   L24 62 L27 57 L21 50 L15 44 L25 38 L23 28 L33 15
                   Q46 3 63 7
                   Q86 13 90 40
                   Q93 63 79 78
                   L68 82 Z"
                fill="url(#arch-skull)"
            />
            {/* Masque clair du visage lui-même, plus lumineux que la calotte. */}
            <path
                d="M31 71 L24 62 L27 57 L21 50 L15 44 L25 38 L23 28 L33 15 Q40 9 48 9 L50 74 Z"
                fill="url(#arch-face)"
                opacity="0.85"
            />
            {/* Couture de la coque — ce qui fait « machine » et non « peau ». */}
            <path d="M35 13 Q41 40 38 74" stroke="#94A7B8" strokeWidth="1.1" fill="none" opacity="0.65" />
            <path d="M56 8 Q60 30 57 52" stroke="#A6B7C6" strokeWidth="0.8" fill="none" opacity="0.4" />

            {/* Sourcil et arête du nez. */}
            <path d="M23 33 L31 36" stroke="#8598A9" strokeWidth="1.3" strokeLinecap="round" />
            <path d="M25 40 Q19 46 22 50 L27 51" stroke="#93A6B6" strokeWidth="0.9" fill="none" />

            {/* Œil — la seule pastille de vie du visage. */}
            <ellipse cx="31" cy="43" rx="5.2" ry="3.4" fill="#0C1A24" />
            <ellipse cx="31.6" cy="43" rx="3.1" ry="2.2" fill={accent}>
                {animated && (
                    <animate
                        attributeName="ry"
                        values="2.2;0.15;2.2"
                        dur="6.5s"
                        repeatCount="indefinite"
                        keyTimes="0;0.04;0.08"
                    />
                )}
            </ellipse>
            <circle cx="30.4" cy="42.2" r="0.9" fill="#FFFFFF" opacity="0.9" />

            {/* BOUCHE — c'est CET élément que la synchro labiale ouvre : sa
                hauteur est pilotée, jamais décorative.

                Dessinée comme une CAVITÉ SOMBRE bordée de lumière, et non
                comme une barre de la teinte d'état : la première version
                utilisait la couleur du halo, qui au repos est presque
                blanche — une bouche blanche sur un visage clair se lisait
                comme une pastille collée sur la joue, pas comme une bouche.
                Une ouverture sombre se lit à toutes les tailles et dans
                tous les états. Posée sur l'arête du profil, là où l'œil la
                cherche. */}
            <g transform="rotate(-11 26 61)">
                <rect
                    x="19"
                    y={61 - mouthHeight / 2}
                    width="14"
                    height={mouthHeight}
                    rx={Math.min(2.4, mouthHeight / 2)}
                    fill="#08131C"
                    opacity={0.72 + openness * 0.28}
                />
                <rect
                    x="19"
                    y={61 - mouthHeight / 2}
                    width="14"
                    height={mouthHeight}
                    rx={Math.min(2.4, mouthHeight / 2)}
                    fill="none"
                    stroke={accent}
                    strokeWidth={0.9 + openness * 0.5}
                    opacity={0.5 + openness * 0.5}
                    style={{ filter: `drop-shadow(0 0 ${1 + openness * 4}px ${accent})` }}
                />
            </g>

            {/* Disque optique de la tempe — la signature de la référence. */}
            <circle cx="66" cy="45" r="21" fill="#0A1621" />
            <circle cx="66" cy="45" r="18" fill="url(#arch-optic)" />
            <circle cx="66" cy="45" r="9.5" fill="#06222E" />
            <circle cx="66" cy="45" r="4.6" fill={accent}>
                {animated && <animate attributeName="r" values="4.6;6.2;4.6" dur="3.4s" repeatCount="indefinite" />}
            </circle>
            <circle cx="66" cy="45" r="1.8" fill="#FFFFFF" opacity="0.95" />
            {/* Couronne segmentée du disque. */}
            <circle
                cx="66"
                cy="45"
                r="19.6"
                fill="none"
                stroke={accent}
                strokeWidth="1.4"
                strokeDasharray="5 4"
                opacity="0.8"
            >
                {animated && (
                    <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0 66 45"
                        to="360 66 45"
                        dur="20s"
                        repeatCount="indefinite"
                    />
                )}
            </circle>

            {/* Nappe de nuque : câblage suggéré, jamais détaillé. */}
            <path d="M74 66 Q84 74 80 88" stroke="#41505F" strokeWidth="2.2" fill="none" />
            <path d="M69 71 Q76 79 73 90" stroke="#35424F" strokeWidth="1.6" fill="none" />
        </svg>
    );
};
