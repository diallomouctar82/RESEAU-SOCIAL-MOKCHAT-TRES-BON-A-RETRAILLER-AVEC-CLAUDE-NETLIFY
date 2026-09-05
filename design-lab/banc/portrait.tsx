import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { LivingPortrait, type LivingPortraitHandle } from '../../components/architecte/LivingPortrait';
import { DEFAULT_ARCHITECTE_AVATAR } from '../../services/architecte/architecteAvatar';
import { STILL_POSE, type LivingPose } from '../../services/architecte/livingAvatar';

/**
 * BANC À POSE FIXÉE — le peintre du portrait vivant, une composante à la fois.
 * Sert à isoler un défaut de rendu (couture, bande, décalage) sans le
 * mouvement : la pose vient de l'URL et ne change pas.
 */
const q = new URLSearchParams(window.location.search);
const nombre = (cle: string, defaut: number) => {
    const v = Number(q.get(cle));
    return q.has(cle) && Number.isFinite(v) ? v : defaut;
};
const pose: LivingPose = {
    ...STILL_POSE,
    jawOpen: nombre('jaw', 0),
    eyelid: nombre('eyelid', 0),
    gazeX: nombre('gazeX', 0),
    gazeY: nombre('gazeY', 0),
    headRotate: nombre('tilt', 0),
    headX: nombre('x', 0),
    headY: nombre('y', 0),
    breathScale: nombre('scale', 1),
    breathY: nombre('breathY', 0),
    mouthWidth: nombre('mouthWidth', 1),
    browRaise: nombre('brow', 0),
};

function Banc() {
    const ref = useRef<LivingPortraitHandle>(null);
    useEffect(() => {
        // Le peintre ne peint qu'une fois la photo décodée : on repousse la pose régulièrement.
        const id = window.setInterval(() => ref.current?.draw(pose), 150);
        return () => window.clearInterval(id);
    }, []);
    return (
        <>
            <div className="cadre">
                <LivingPortrait
                    ref={ref}
                    photoUrl={DEFAULT_ARCHITECTE_AVATAR.photoUrl}
                    rig={DEFAULT_ARCHITECTE_AVATAR.rig}
                    mouth={DEFAULT_ARCHITECTE_AVATAR.mouthAnchor}
                    accent="#8FE3FF"
                />
            </div>
            <pre className="pose">{JSON.stringify(pose)}</pre>
        </>
    );
}

createRoot(document.getElementById('root')!).render(<Banc />);
