import React, { useEffect, useRef, useState } from 'react';
import {
    architecteSequencePlayer,
    type ArchitecteSequence,
    type SequencePlayer,
    type SequencePlayerState,
} from '../../services/architecte/sequences';

/**
 * COUCHE VIDÉO de l'avatar : la séquence pré-rendue validée (HeyGen) jouée
 * DANS le cadre circulaire, par-dessus le portrait vivant. Invisible tant
 * qu'elle ne joue pas ; fondu à l'apparition et à la fin ; le rig 2D continue
 * dessous, prêt à reprendre la main à la seconde où la vidéo s'arrête ou
 * échoue. Aucun démarrage automatique : `SequencePlayer.play()` est appelé
 * par l'appelant, dans le geste de la personne.
 */
export interface ArchitecteSequenceVideoProps {
    sequence: ArchitecteSequence;
    /** Nom du cadre (« demo », « panel », « presentation »…) : seul le cadre qui joue montre la vidéo. */
    slot: string;
    player?: SequencePlayer;
    className?: string;
    /** Calage éventuel (sculpture) : transformation CSS posée sur la vidéo. */
    style?: React.CSSProperties;
}

export function useSequencePlayerState(player: SequencePlayer): SequencePlayerState {
    const [state, setState] = useState<SequencePlayerState>(player.getState());
    useEffect(() => {
        setState(player.getState());
        return player.subscribe(setState);
    }, [player]);
    return state;
}

export const ArchitecteSequenceVideo: React.FC<ArchitecteSequenceVideoProps> = ({
    sequence,
    slot,
    player = architecteSequencePlayer,
    className = '',
    style,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const state = useSequencePlayerState(player);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return undefined;
        const attachment = player.attach(video, sequence.key, slot);
        return () => attachment.detach();
    }, [player, sequence.key, slot]);

    const mine = state.key === sequence.key && state.slot === slot;
    const status = mine ? state.status : 'idle';
    const visible = status === 'playing' || status === 'ended';

    return (
        <video
            ref={videoRef}
            playsInline
            preload="metadata"
            // Pas d'affiche : elle ne serait jamais visible (le portrait vivant est
            // dessous) et coûterait un téléchargement à chaque montage.
            aria-hidden="true"
            tabIndex={-1}
            data-testid="architecte-sequence-video"
            data-sequence-key={sequence.key}
            data-sequence-slot={slot}
            data-sequence-status={status}
            className={`absolute inset-0 w-full h-full object-cover pointer-events-none transition-opacity duration-300 ${
                visible ? 'opacity-100' : 'opacity-0'
            } ${className}`}
            style={style}
        >
            {sequence.sources.map((source) => (
                <source key={source.url} src={source.url} type={source.type} />
            ))}
            <track kind="captions" srcLang="fr" label="Français" src={sequence.captionsUrl} />
        </video>
    );
};
