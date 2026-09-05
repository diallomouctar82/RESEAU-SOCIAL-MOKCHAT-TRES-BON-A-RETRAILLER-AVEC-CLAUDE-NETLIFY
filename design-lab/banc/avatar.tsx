import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArchitecteAvatar } from '../../components/architecte/ArchitecteAvatar';
import {
    DEFAULT_ARCHITECTE_AVATAR,
    type ArchitectePresenceState,
} from '../../services/architecte/architecteAvatar';

/**
 * BANC DE DÉMONSTRATION — monte le VRAI composant, pas une copie.
 *
 * Joue une scène complète : repos qui respire et cligne, puis une phrase
 * prononcée avec une enveloppe d'amplitude réaliste (syllabes, pauses), puis
 * retour au repos. C'est ce que la caméra filme.
 */

/** Enveloppe d'une phrase parlée : suite de syllabes et de silences, en ms. */
const PHRASE: { debut: number; duree: number; force: number }[] = [];
(() => {
    let t = 0;
    // « Bon-jour. Je suis l'Ar-chi-tecte. Je vous ac-com-pagne dans Mok-Net. »
    const syllabes = [
        [170, 0.55], [200, 0.7], [420, 0], [150, 0.4], [160, 0.5], [130, 0.35],
        [180, 0.62], [150, 0.45], [190, 0.72], [500, 0], [140, 0.4], [160, 0.5],
        [150, 0.45], [170, 0.58], [180, 0.66], [130, 0.38], [170, 0.6], [200, 0.75],
        [600, 0],
    ] as const;
    for (const [duree, force] of syllabes) { PHRASE.push({ debut: t, duree, force }); t += duree; }
})();
const DUREE_PHRASE = PHRASE[PHRASE.length - 1].debut + PHRASE[PHRASE.length - 1].duree;

/** Amplitude simulée à l'instant t — forme d'onde d'une voix, pas un signal carré. */
function amplitudeDeLaPhrase(t: number): number {
    const s = PHRASE.find((x) => t >= x.debut && t < x.debut + x.duree);
    if (!s || s.force === 0) return 0;
    const phase = (t - s.debut) / s.duree;
    // Attaque franche, extinction douce : le profil d'une syllabe.
    const enveloppe = phase < 0.25 ? phase / 0.25 : Math.pow(1 - (phase - 0.25) / 0.75, 0.7);
    // Vibration rapide de la voix, pour que la bouche ne soit pas lisse.
    const grain = 0.82 + 0.18 * Math.sin(t / 26);
    return s.force * enveloppe * grain;
}

const CYCLE = 4000 + DUREE_PHRASE + 3000;

const Scene = () => {
    const [t, setT] = useState(0);
    useEffect(() => {
        const debut = performance.now();
        let f = 0;
        const boucle = (m: number) => { setT((m - debut) % CYCLE); f = requestAnimationFrame(boucle); };
        f = requestAnimationFrame(boucle);
        return () => cancelAnimationFrame(f);
    }, []);

    const parle = t >= 4000 && t < 4000 + DUREE_PHRASE;
    const niveau = parle ? amplitudeDeLaPhrase(t - 4000) : 0;
    const presence: ArchitectePresenceState = parle ? 'speaking' : t < 2000 ? 'rest' : 'listening';

    return (
        <>
            <h1>L’Architecte — avatar vivant</h1>
            <p className="sub">
                Respiration, clignement, micro-mouvements de tête et synchro labiale sur une PHOTO.
                Composant réel, animé en direct.
            </p>

            <div className="scene">
                <div className="cell">
                    <ArchitecteAvatar
                        config={DEFAULT_ARCHITECTE_AVATAR}
                        presence={presence}
                        ttsEngine="elevenlabs"
                        outputLevel={niveau}
                        size={300}
                        actionLabel="Aperçu"
                    />
                    <span className="cap"><b>Grand format</b>ce que voit la Direction</span>
                </div>
                <div className="cell">
                    <ArchitecteAvatar
                        config={DEFAULT_ARCHITECTE_AVATAR}
                        presence={presence}
                        ttsEngine="elevenlabs"
                        outputLevel={niveau}
                        size={56}
                        actionLabel="Aperçu"
                    />
                    <span className="cap"><b>56 px</b>taille réelle du bouton flottant</span>
                </div>
                <div className="etat">
                    <div className="ligne"><span>État</span><b>{presence}</b></div>
                    <div className="ligne"><span>Amplitude de la voix</span><b>{Math.round(niveau * 100)} %</b></div>
                    <div className="jauge"><i style={{ width: `${niveau * 100}%` }} /></div>
                    <p className="note">
                        {parle
                            ? '« Bonjour. Je suis l’Architecte. Je vous accompagne dans MokNet. »'
                            : 'Au repos : il respire et cligne des yeux.'}
                    </p>
                </div>
            </div>
        </>
    );
};

createRoot(document.getElementById('root')!).render(<Scene />);
