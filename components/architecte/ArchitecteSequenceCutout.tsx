import React, { useEffect, useRef } from 'react';
import {
    architecteSequencePlayer,
    type ArchitecteSequence,
    type SequencePlayer,
} from '../../services/architecte/sequences';
import { useSequencePlayerState } from './ArchitecteSequenceVideo';

/**
 * COUCHE VIDÉO DÉTOURÉE de la sculpture flottante.
 *
 * Le modèle validé (vidéo HeyGen) n'a pas de transparence : pour le montrer
 * « détouré, sans cadre ni page autour » (Direction, 05/09/2026), la vidéo
 * livrée ici est EMPILÉE — en haut les couleurs de la vidéo validée, en bas
 * son matte de silhouette, relevé image par image (204 images, méthode
 * capitalisée dans AI Core). À chaque image, ce composant recompose les deux
 * moitiés dans un canevas : la couleur avec l'alpha de la silhouette. Le son
 * sort du `<video>` lui-même, piloté par le même lecteur que le cadre rond.
 *
 * Portable : aucune transparence vidéo native (VP9 alpha, HEVC alpha) n'est
 * requise — Chromium, WebKit et Gecko, ordinateur et téléphone, même chemin.
 */
export interface ArchitecteSequenceCutoutProps {
    sequence: ArchitecteSequence;
    slot: string;
    player?: SequencePlayer;
    className?: string;
    style?: React.CSSProperties;
}

export function composeCutoutFrame(
    colour: Uint8ClampedArray,
    matte: Uint8ClampedArray,
    out: Uint8ClampedArray,
): void {
    // Le matte est gris : sa luminance (canal vert, identique aux autres) devient l'alpha.
    for (let i = 0; i < out.length; i += 4) {
        out[i] = colour[i];
        out[i + 1] = colour[i + 1];
        out[i + 2] = colour[i + 2];
        out[i + 3] = matte[i + 1];
    }
}

type VideoWithFrameCallback = HTMLVideoElement & {
    requestVideoFrameCallback?: (cb: () => void) => number;
    cancelVideoFrameCallback?: (handle: number) => void;
};

export const ArchitecteSequenceCutout: React.FC<ArchitecteSequenceCutoutProps> = ({
    sequence,
    slot,
    player = architecteSequencePlayer,
    className = '',
    style,
}) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
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
    const active = status === 'loading' || status === 'playing' || status === 'ended';

    // Recomposition image par image, seulement pendant que CE cadre joue.
    useEffect(() => {
        const video = videoRef.current as VideoWithFrameCallback | null;
        const canvas = canvasRef.current;
        if (!active || !video || !canvas) return undefined;
        const ctx = canvas.getContext('2d');
        if (!ctx) return undefined;
        let colourCanvas: HTMLCanvasElement | null = null;
        let matteCanvas: HTMLCanvasElement | null = null;
        let stopped = false;
        let handle = 0;
        let usesFrameCallback = false;

        const draw = () => {
            if (stopped) return;
            const w = video.videoWidth;
            const h = video.videoHeight;
            if (w > 0 && h > 0 && video.readyState >= 2) {
                const half = Math.floor(h / 2);
                const size = canvas.width;
                if (!colourCanvas) {
                    colourCanvas = document.createElement('canvas');
                    matteCanvas = document.createElement('canvas');
                }
                if (colourCanvas.width !== size) {
                    colourCanvas.width = size; colourCanvas.height = size;
                    matteCanvas!.width = size; matteCanvas!.height = size;
                }
                const cctx = colourCanvas.getContext('2d', { willReadFrequently: true });
                const mctx = matteCanvas!.getContext('2d', { willReadFrequently: true });
                if (cctx && mctx) {
                    cctx.drawImage(video, 0, 0, w, half, 0, 0, size, size);
                    mctx.drawImage(video, 0, half, w, half, 0, 0, size, size);
                    const colour = cctx.getImageData(0, 0, size, size);
                    const matte = mctx.getImageData(0, 0, size, size);
                    const out = ctx.createImageData(size, size);
                    composeCutoutFrame(colour.data, matte.data, out.data);
                    ctx.putImageData(out, 0, 0);
                }
            }
            schedule();
        };
        const schedule = () => {
            if (stopped) return;
            if (typeof video.requestVideoFrameCallback === 'function') {
                usesFrameCallback = true;
                handle = video.requestVideoFrameCallback(draw);
            } else {
                handle = requestAnimationFrame(draw);
            }
        };
        // Taille du canevas : la taille CSS × densité, plafonnée (le détourage
        // se recompose sur le processeur — 224 px suffisent à une sculpture de 112 px).
        const rect = canvas.getBoundingClientRect();
        const dpr = Math.min(2, typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);
        const px = Math.max(64, Math.min(360, Math.round((rect.width || 112) * dpr)));
        canvas.width = px;
        canvas.height = px;
        schedule();
        return () => {
            stopped = true;
            if (usesFrameCallback && typeof video.cancelVideoFrameCallback === 'function') video.cancelVideoFrameCallback(handle);
            else cancelAnimationFrame(handle);
        };
    }, [active]);

    return (
        <>
            <video
                ref={videoRef}
                playsInline
                preload="metadata"
                aria-hidden="true"
                tabIndex={-1}
                data-testid="architecte-sequence-video"
                data-sequence-key={sequence.key}
                data-sequence-slot={slot}
                data-sequence-status={status}
                data-sequence-layer="cutout"
                // Jamais affichée telle quelle (deux moitiés) : seule sa recomposition l'est.
                className="absolute w-px h-px opacity-0 pointer-events-none"
                style={{ left: -9999 }}
            >
                {sequence.cutoutSources.map((source) => (
                    <source key={source.url} src={source.url} type={source.type} />
                ))}
                <track kind="captions" srcLang="fr" label="Français" src={sequence.captionsUrl} />
            </video>
            <canvas
                ref={canvasRef}
                aria-hidden="true"
                data-testid="architecte-sequence-cutout"
                data-sequence-status={status}
                className={`absolute inset-0 w-full h-full pointer-events-none transition-opacity duration-300 ${
                    visible ? 'opacity-100' : 'opacity-0'
                } ${className}`}
                style={style}
            />
        </>
    );
};
