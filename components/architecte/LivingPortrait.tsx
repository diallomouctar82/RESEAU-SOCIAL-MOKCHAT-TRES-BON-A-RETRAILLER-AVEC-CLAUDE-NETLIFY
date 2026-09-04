import React from 'react';
import type { LivingPose, PortraitRig } from '../../services/architecte/livingAvatar';
import type { MouthAnchor } from '../../services/architecte/architecteAvatar';

/**
 * PORTRAIT VIVANT — anime une VRAIE PHOTO, pas un dessin.
 *
 * Refonte du 04/09/2026 : la première livraison proposait un androïde
 * vectoriel, refusé par la Direction — « ce n'est pas un avatar vivant, ce
 * n'est pas humain ». Un dessin ne pourra jamais l'être. Ce composant part
 * donc d'un portrait photographique et lui applique le mouvement qui le rend
 * vivant, selon le playbook AI Core 15 § 3.
 *
 * Comment un portrait fixe respire, cligne et parle, sans vidéo ni
 * fournisseur externe — trois gestes, tous en SVG :
 *
 *  1. RESPIRATION et DÉRIVE : l'image entière est très légèrement mise à
 *     l'échelle, translatée et pivotée. Amplitudes sous le pour cent et sous
 *     le degré : perceptible comme de la vie, jamais comme un effet.
 *
 *  2. CLIGNEMENT : une bande de l'image à hauteur des yeux est redessinée
 *     avec le contenu situé JUSTE AU-DESSUS — le front. La paupière est donc
 *     faite des vrais pixels du même visage : lumière, teinte et matière
 *     concordent forcément, ce qu'aucune forme dessinée ne peut garantir.
 *
 *  3. MÂCHOIRE : la partie basse du visage est redessinée par-dessus,
 *     décalée vers le bas, et une cavité sombre s'ouvre à la hauteur des
 *     lèvres. L'image complète reste dessous : aucun trou ne peut apparaître.
 *
 * Le composant ne DÉCIDE de rien : il reçoit une pose déjà calculée par
 * `services/architecte/livingAvatar.ts`. Tout ce qui bouge est donc testable
 * sans navigateur.
 */

export interface LivingPortraitProps {
    photoUrl: string;
    pose: LivingPose;
    rig: PortraitRig;
    mouth: MouthAnchor;
    accent: string;
    /** Identifiant unique — les `clipPath` SVG sont globaux au document. */
    instanceId: string;
    className?: string;
}

export const LivingPortrait: React.FC<LivingPortraitProps> = ({
    photoUrl,
    pose,
    rig,
    mouth,
    accent,
    instanceId,
    className = 'w-full h-full',
}) => {
    const jawOffset = rig.jawTravelPercent * pose.jawOpen;
    // Descente de la paupière : au maximum toute la hauteur de la bande, ce
    // qui recouvre exactement l'œil.
    const lidDrop = rig.eyeBandPercent * pose.eyelid;
    const lidTop = rig.eyeLinePercent - rig.eyeBandPercent / 2;

    const clipRound = `${instanceId}-round`;
    const clipJaw = `${instanceId}-jaw`;
    const clipLid = `${instanceId}-lid`;
    const gradMouth = `${instanceId}-mouth`;

    // Ouverture de bouche : hauteur en % du cadre. Reste à zéro quand la
    // mâchoire ne bouge pas — pas de trou noir sur un visage au repos.
    const mouthHeight = pose.jawOpen * mouth.widthPercent * 0.62;

    return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
            <defs>
                <clipPath id={clipRound}>
                    <circle cx="50" cy="50" r="50" />
                </clipPath>
                {/* Mâchoire : MASQUE à bord fondu, et non découpe franche.
                    Une découpe nette laissait une couture horizontale visible
                    en travers de la joue et du cou dès que la mâchoire
                    descendait — le défaut le plus visible de la première
                    version. Le dégradé fait disparaître la jonction. */}
                <linearGradient id={`${clipJaw}-g`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="100%" stopColor="#fff" />
                </linearGradient>
                <mask id={clipJaw}>
                    <rect
                        x="0"
                        y={rig.jawLinePercent - 9}
                        width="100"
                        height="9"
                        fill={`url(#${clipJaw}-g)`}
                    />
                    <rect x="0" y={rig.jawLinePercent} width="100" height={100 - rig.jawLinePercent} fill="#fff" />
                </mask>
                {/* Bande des yeux — masque fondu haut ET bas, pour que la
                    paupière se pose sans laisser de bord net. */}
                <linearGradient id={`${clipLid}-g`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="22%" stopColor="#fff" />
                    <stop offset="78%" stopColor="#fff" />
                    <stop offset="100%" stopColor="#000" />
                </linearGradient>
                <mask id={clipLid}>
                    <rect x="0" y={lidTop} width="100" height={rig.eyeBandPercent} fill={`url(#${clipLid}-g)`} />
                </mask>
                <radialGradient id={gradMouth} cx="50%" cy="45%" r="55%">
                    <stop offset="0%" stopColor="#02060A" stopOpacity="0.97" />
                    <stop offset="62%" stopColor="#050D14" stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#0A1824" stopOpacity="0" />
                </radialGradient>
            </defs>

            <g clipPath={`url(#${clipRound})`}>
                <g
                    transform={
                        `translate(${pose.headX + 50} ${pose.headY + pose.breathY + 50}) ` +
                        `rotate(${pose.headRotate}) ` +
                        `scale(${pose.breathScale}) ` +
                        `translate(-50 -50)`
                    }
                    style={{ transition: 'none' }}
                >
                    {/* 1. Le portrait, en entier. Il reste sous tout le reste :
                        aucun décalage ne peut donc ouvrir un trou. */}
                    <image
                        href={photoUrl}
                        x="0"
                        y="0"
                        width="100"
                        height="100"
                        preserveAspectRatio="xMidYMid slice"
                    />

                    {/* 2. Mâchoire redessinée par-dessus, décalée vers le bas. */}
                    {jawOffset > 0.01 && (
                        <g mask={`url(#${clipJaw})`} transform={`translate(0 ${jawOffset})`}>
                            <image
                                href={photoUrl}
                                x="0"
                                y="0"
                                width="100"
                                height="100"
                                preserveAspectRatio="xMidYMid slice"
                            />
                        </g>
                    )}

                    {/* 3. Cavité de la bouche, à l'ancre réglée pour cette photo. */}
                    {mouthHeight > 0.15 && (
                        <ellipse
                            cx={mouth.xPercent}
                            cy={mouth.yPercent + mouthHeight * 0.3}
                            rx={mouth.widthPercent / 2}
                            ry={mouthHeight / 2}
                            fill={`url(#${gradMouth})`}
                        />
                    )}

                    {/* 4. Paupière : la bande des yeux redessinée avec le front. */}
                    {lidDrop > 0.05 && (
                        <g mask={`url(#${clipLid})`}>
                            <image
                                href={photoUrl}
                                x="0"
                                y={lidDrop}
                                width="100"
                                height="100"
                                preserveAspectRatio="xMidYMid slice"
                            />
                        </g>
                    )}
                </g>
            </g>

            {/* Liseré intérieur teinté par l'état — la lumière comme langage,
                posée SUR la photo sans la masquer. */}
            <circle
                cx="50"
                cy="50"
                r="49"
                fill="none"
                stroke={accent}
                strokeWidth="2"
                opacity="0.55"
            />
        </svg>
    );
};
