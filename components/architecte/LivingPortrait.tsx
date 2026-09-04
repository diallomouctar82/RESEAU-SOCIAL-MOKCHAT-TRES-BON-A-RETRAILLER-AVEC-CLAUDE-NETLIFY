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
 *  3. BOUCHE : la lèvre du haut ne bouge JAMAIS ; tout ce qui est sous la
 *     ligne des lèvres (lèvre du bas, menton, cou) est redessiné par-dessus,
 *     décalé vers le bas. L'écartement ainsi créé laisse voir une cavité
 *     sombre — et un soupçon de dents quand la bouche s'ouvre franchement.
 *     L'image complète reste dessous : aucun trou ne peut apparaître.
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

/** Hauteur du fondu de part et d'autre de la ligne de mâchoire, hors bouche (% du cadre). */
const JAW_FEATHER = 3.5;
/** Épaisseur de la bande de peau de paupière étirée pour fermer l'œil (% du cadre). */
const LID_SOURCE_HEIGHT = 1.3;
/** Étendue horizontale de la paupière : les yeux, pas les cheveux ni les tempes. */
const LID_LEFT = 22;
const LID_WIDTH = 56;

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
    // Paupière. Première version : la bande des yeux était DÉCALÉE vers le
    // bas de toute sa hauteur — ce qui ramenait les sourcils sur les yeux
    // (vu image par image sur la vidéo du 04/09). Désormais une fine bande de
    // peau prise JUSTE au-dessus des cils est ÉTIRÉE verticalement jusqu'à
    // recouvrir l'œil : la paupière close est faite de la peau de la paupière.
    const lidTop = rig.eyeLinePercent - rig.eyeBandPercent / 2;
    const lidSourceTop = lidTop - LID_SOURCE_HEIGHT;
    const lidCover = rig.eyeBandPercent * pose.eyelid;
    const lidStretch = (LID_SOURCE_HEIGHT + lidCover) / LID_SOURCE_HEIGHT;

    const clipRound = `${instanceId}-round`;
    const clipJaw = `${instanceId}-jaw`;
    const clipLid = `${instanceId}-lid`;
    const gradMouth = `${instanceId}-mouth`;
    const gradTeeth = `${instanceId}-teeth`;
    const gradShadow = `${instanceId}-shadow`;

    // Géométrie de la bouche, dans le repère de la photo.
    const lipLine = mouth.yPercent;
    const mouthTilt = mouth.tiltDeg ?? 0;
    const halfWidth = mouth.widthPercent / 2;
    // Colonne de la bouche : un peu plus large que les commissures, avec des
    // bords fondus pour que la coupure verticale du masque ne se voie pas.
    const columnWidth = mouth.widthPercent + 4;
    const columnLeft = mouth.xPercent - columnWidth / 2;
    // La cavité s'arrête juste avant les commissures, qui restent en place —
    // une bouche ne s'ouvre pas jusqu'aux coins.
    const cavityHalfWidth = halfWidth * 0.92;
    // Profondeur dessinée : l'écartement réel, plus une marge que la lèvre du
    // bas (redessinée par-dessus) recouvre — ainsi aucun liseré de peau ne
    // reste visible entre cavité et lèvre.
    const cavityDepth = jawOffset + 1.8;
    // Dents : visibles seulement quand la bouche s'ouvre franchement.
    const teethHeight = Math.min(1.35, jawOffset * 0.32);
    const teethOpacity = Math.min(1, Math.max(0, (pose.jawOpen - 0.25) * 3)) * 0.85;

    return (
        <svg viewBox="0 0 100 100" className={className} aria-hidden="true" focusable="false">
            <defs>
                <clipPath id={clipRound}>
                    <circle cx="50" cy="50" r="50" />
                </clipPath>
                {/* Mâchoire : MASQUE à bord fondu, et non découpe franche.
                    Une découpe nette laissait une couture horizontale visible
                    en travers de la joue et du cou dès que la mâchoire
                    descendait. Hors bouche, le dégradé fait disparaître la
                    jonction ; DANS la colonne de la bouche, la coupure est
                    franche et posée exactement entre les lèvres, là où la
                    cavité la cache. */}
                <linearGradient id={`${clipJaw}-g`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="100%" stopColor="#fff" />
                </linearGradient>
                <linearGradient id={`${clipJaw}-hb`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000" stopOpacity="0" />
                    <stop offset="14%" stopColor="#000" stopOpacity="1" />
                    <stop offset="86%" stopColor="#000" stopOpacity="1" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${clipJaw}-hw`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0" />
                    <stop offset="14%" stopColor="#fff" stopOpacity="1" />
                    <stop offset="86%" stopColor="#fff" stopOpacity="1" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <mask id={clipJaw}>
                    <rect
                        x="0"
                        y={rig.jawLinePercent - JAW_FEATHER}
                        width="100"
                        height={JAW_FEATHER * 2}
                        fill={`url(#${clipJaw}-g)`}
                    />
                    <rect
                        x="0"
                        y={rig.jawLinePercent + JAW_FEATHER}
                        width="100"
                        height={100 - rig.jawLinePercent - JAW_FEATHER}
                        fill="#fff"
                    />
                    <g transform={`rotate(${mouthTilt} ${mouth.xPercent} ${lipLine})`}>
                        {/* Au-dessus de la ligne des lèvres : rien ne bouge (lèvre du haut fixe). */}
                        <rect
                            x={columnLeft}
                            y={lipLine - JAW_FEATHER - 2}
                            width={columnWidth}
                            height={JAW_FEATHER + 2}
                            fill={`url(#${clipJaw}-hb)`}
                        />
                        {/* En dessous : tout descend d'un bloc (lèvre du bas + menton). */}
                        <rect
                            x={columnLeft}
                            y={lipLine}
                            width={columnWidth}
                            height={JAW_FEATHER + 2}
                            fill={`url(#${clipJaw}-hw)`}
                        />
                    </g>
                </mask>
                {/* Paupière — masque fondu haut, bas ET côtés, pour que la
                    peau étirée se pose sans laisser de bord net. */}
                <linearGradient id={`${clipLid}-g`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" />
                    <stop offset="25%" stopColor="#fff" />
                    <stop offset="82%" stopColor="#fff" />
                    <stop offset="100%" stopColor="#000" />
                </linearGradient>
                <linearGradient id={`${clipLid}-h`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#000" stopOpacity="1" />
                    <stop offset="12%" stopColor="#000" stopOpacity="0" />
                    <stop offset="88%" stopColor="#000" stopOpacity="0" />
                    <stop offset="100%" stopColor="#000" stopOpacity="1" />
                </linearGradient>
                <mask id={clipLid}>
                    <rect
                        x={LID_LEFT}
                        y={lidSourceTop}
                        width={LID_WIDTH}
                        height={LID_SOURCE_HEIGHT + lidCover + 0.6}
                        fill={`url(#${clipLid}-g)`}
                    />
                    <rect
                        x={LID_LEFT}
                        y={lidSourceTop}
                        width={LID_WIDTH}
                        height={LID_SOURCE_HEIGHT + lidCover + 0.6}
                        fill={`url(#${clipLid}-h)`}
                    />
                </mask>
                <linearGradient id={gradMouth} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#120608" />
                    <stop offset="55%" stopColor="#2A0E12" />
                    <stop offset="100%" stopColor="#4A1B22" />
                </linearGradient>
                <linearGradient id={gradTeeth} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F4EFE7" />
                    <stop offset="100%" stopColor="#BDB4A8" />
                </linearGradient>
                <linearGradient id={gradShadow} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </linearGradient>
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

                    {/* 2. Cavité de la bouche, SOUS la lèvre du bas redessinée :
                        son bord haut épouse la lèvre du haut, son bord bas est
                        recouvert par la lèvre du bas qui descend. On ne voit
                        donc que l'écartement réel. */}
                    {jawOffset > 0.01 && (
                        <g transform={`rotate(${mouthTilt} ${mouth.xPercent} ${lipLine})`}>
                            <path
                                d={
                                    `M ${mouth.xPercent - cavityHalfWidth} ${lipLine} ` +
                                    `Q ${mouth.xPercent} ${lipLine - 0.3} ${mouth.xPercent + cavityHalfWidth} ${lipLine} ` +
                                    `C ${mouth.xPercent + cavityHalfWidth * 0.6} ${lipLine + cavityDepth * 1.33} ` +
                                    `${mouth.xPercent - cavityHalfWidth * 0.6} ${lipLine + cavityDepth * 1.33} ` +
                                    `${mouth.xPercent - cavityHalfWidth} ${lipLine} Z`
                                }
                                fill={`url(#${gradMouth})`}
                            />
                            {teethOpacity > 0.02 && teethHeight > 0.1 && (
                                <path
                                    d={
                                        `M ${mouth.xPercent - cavityHalfWidth * 0.5} ${lipLine + 0.1} ` +
                                        `L ${mouth.xPercent + cavityHalfWidth * 0.5} ${lipLine + 0.1} ` +
                                        `Q ${mouth.xPercent} ${lipLine + 0.1 + teethHeight * 1.6} ` +
                                        `${mouth.xPercent - cavityHalfWidth * 0.5} ${lipLine + 0.1} Z`
                                    }
                                    fill={`url(#${gradTeeth})`}
                                    opacity={teethOpacity * 0.8}
                                />
                            )}
                            {/* Ombre portée de la lèvre du haut sur l'intérieur de la bouche. */}
                            <rect
                                x={mouth.xPercent - cavityHalfWidth}
                                y={lipLine - 0.1}
                                width={cavityHalfWidth * 2}
                                height={Math.min(0.9, cavityDepth * 0.35)}
                                fill={`url(#${gradShadow})`}
                            />
                        </g>
                    )}

                    {/* 3. Lèvre du bas, menton et cou redessinés par-dessus,
                        décalés vers le bas. */}
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

                    {/* 4. Paupière : la peau au-dessus des cils, étirée vers le
                        bas jusqu'à recouvrir l'œil. */}
                    {lidCover > 0.05 && (
                        <g mask={`url(#${clipLid})`}>
                            <image
                                href={photoUrl}
                                x="0"
                                y="0"
                                width="100"
                                height="100"
                                preserveAspectRatio="xMidYMid slice"
                                transform={`translate(0 ${lidSourceTop}) scale(1 ${lidStretch}) translate(0 ${-lidSourceTop})`}
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
