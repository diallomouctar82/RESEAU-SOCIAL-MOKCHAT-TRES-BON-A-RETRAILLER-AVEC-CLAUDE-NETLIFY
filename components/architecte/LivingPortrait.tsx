import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { STILL_POSE, type LivingPose, type PortraitRig } from '../../services/architecte/livingAvatar';
import type { MouthAnchor } from '../../services/architecte/architecteAvatar';
import { createPortraitPainter, type PortraitPainter } from '../../services/architecte/portraitPainter';

/**
 * PORTRAIT VIVANT — anime une VRAIE PHOTO, pas un dessin.
 *
 * Refonte du 04/09/2026 : la première livraison proposait un androïde
 * vectoriel, refusé par la Direction — « ce n'est pas un avatar vivant, ce
 * n'est pas humain ». Puis une photo animée en SVG par couches translatées,
 * refusée à son tour — « pas assez fluide ni naturel ». Ce composant est
 * désormais un Canvas peint image par image par `portraitPainter.ts` : fond
 * fixe, tête qui respire devant lui, mâchoire déformée en douceur (le cou
 * ne bouge pas), paupières de peau, regard qui se déplace.
 *
 * Le composant ne DÉCIDE de rien et ne rend rien par React à chaque image :
 * l'appelant lui pousse une pose via `draw()` (poignée), ce qui évite un
 * rendu React à 60 Hz. La pose est calculée par `livingAvatar.ts` — tout ce
 * qui bouge reste testable sans navigateur.
 */

export interface LivingPortraitHandle {
    draw(pose: LivingPose): void;
    /** Qualité de rendu (0,5..1) décidée par l'appelant d'après la cadence réellement mesurée. */
    setQuality(quality: number): void;
}

export interface LivingPortraitProps {
    photoUrl: string;
    rig: PortraitRig;
    mouth: MouthAnchor;
    accent: string;
    className?: string;
    /** Budget de pixels du canevas (défaut : `CANVAS_PIXEL_BUDGET`) — les bancs de preuve peuvent le relever. */
    pixelBudget?: number;
}

export const LivingPortrait = forwardRef<LivingPortraitHandle, LivingPortraitProps>(function LivingPortrait(
    { photoUrl, rig, mouth, accent, className = 'w-full h-full block', pixelBudget },
    ref,
) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const painterRef = useRef<PortraitPainter | null>(null);
    const poseRef = useRef<LivingPose>(STILL_POSE);
    const settingsRef = useRef({ rig, mouth, accent });
    settingsRef.current = { rig, mouth, accent };

    const repaint = () => {
        const s = settingsRef.current;
        painterRef.current?.draw(poseRef.current, s.rig, s.mouth, s.accent);
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return undefined;
        const painter = createPortraitPainter(canvas, photoUrl, pixelBudget !== undefined ? { pixelBudget } : {});
        painterRef.current = painter;
        painter.onReady(repaint);
        // Une taille qui change (téléphone pivoté, fenêtre redimensionnée)
        // doit repeindre : le canvas se réadapte à sa taille CSS au prochain trait.
        const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(repaint) : null;
        observer?.observe(canvas);
        return () => {
            observer?.disconnect();
            painter.dispose();
            painterRef.current = null;
        };
    }, [photoUrl]);

    useEffect(() => { repaint(); }, [rig, mouth, accent]);
    useEffect(() => {
        if (pixelBudget !== undefined) painterRef.current?.setPixelBudget(pixelBudget);
        repaint();
    }, [pixelBudget]);

    useImperativeHandle(ref, () => ({
        draw(pose: LivingPose) {
            poseRef.current = pose;
            repaint();
        },
        setQuality(quality: number) {
            painterRef.current?.setQuality(quality);
        },
    }), []);

    return (
        <canvas
            ref={canvasRef}
            className={className}
            data-portrait-src={photoUrl}
            aria-hidden="true"
        />
    );
});
