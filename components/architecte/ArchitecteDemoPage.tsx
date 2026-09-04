import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';
import { adminConfigService } from '../../services/adminConfigService';
import {
    ARCHITECTE_DISCLOSURE,
    ARCHITECTE_STATE_LABEL,
    mergeArchitecteAvatarConfig,
    type ArchitectePresenceState,
} from '../../services/architecte/architecteAvatar';
import { ArchitecteAvatar } from './ArchitecteAvatar';

/**
 * DÉMONSTRATION PUBLIQUE DE L'AVATAR VIVANT — route `/architecte`.
 *
 * Raison d'être : l'application entière est derrière l'écran de connexion
 * (`App.tsx` : `if (!isAuthenticated) return <Auth />`). La Direction ne
 * pouvait donc PAS constater l'avatar par elle-même sur une prévisualisation
 * — elle tombait sur « Se connecter ». Cette page est rendue AVANT ce verrou :
 * elle ne lit aucune donnée de compte, n'écrit rien, et n'expose aucune
 * fonction de l'application. Elle ne fait que rendre le composant réel.
 *
 * Elle n'appartient donc pas au produit : c'est une page de preuve, et elle
 * le dit à l'écran.
 */

/** Enveloppe d'une phrase parlée : syllabes et silences, en millisecondes. */
const SYLLABES: readonly (readonly [number, number])[] = [
    [180, 0.62], [210, 0.78], [430, 0], [150, 0.45], [165, 0.55], [135, 0.4],
    [190, 0.7], [155, 0.5], [200, 0.8], [520, 0], [145, 0.44], [170, 0.56],
    [150, 0.48], [175, 0.62], [185, 0.72], [135, 0.42], [175, 0.64], [205, 0.82],
    [700, 0],
] as const;

const PHRASE = (() => {
    let t = 0;
    return SYLLABES.map(([duree, force]) => { const s = { debut: t, duree, force }; t += duree; return s; });
})();
const DUREE_PHRASE = PHRASE[PHRASE.length - 1].debut + PHRASE[PHRASE.length - 1].duree;

function amplitudeDeLaPhrase(t: number): number {
    const s = PHRASE.find((x) => t >= x.debut && t < x.debut + x.duree);
    if (!s || s.force === 0) return 0;
    const phase = (t - s.debut) / s.duree;
    const enveloppe = phase < 0.25 ? phase / 0.25 : Math.pow(1 - (phase - 0.25) / 0.75, 0.7);
    return s.force * enveloppe * (0.82 + 0.18 * Math.sin(t / 26));
}

export const ArchitecteDemoPage: React.FC = () => {
    const config = useMemo(
        () => mergeArchitecteAvatarConfig(adminConfigService.getDetailedSettings().architecteAvatar),
        [],
    );
    // Horloge de la phrase en RÉFÉRENCES, pas en état : la première version
    // appelait `setNiveau` à l'intérieur de la fonction de mise à jour de
    // `setParleDepuis`. En production, React n'exécute ces fonctions qu'au
    // rendu suivant — l'amplitude n'était jamais poussée et l'avatar restait
    // « au repos » sur toute la vidéo de preuve. Défaut vu à l'image, pas en
    // développement, où les mises à jour sont exécutées immédiatement.
    const debutRef = useRef<number | null>(null);
    const enBoucleRef = useRef(true);
    const [niveau, setNiveau] = useState(0);
    const [enBoucle, setEnBoucle] = useState(true);
    useEffect(() => { enBoucleRef.current = enBoucle; }, [enBoucle]);

    useEffect(() => {
        debutRef.current = performance.now() + 600;
        let frame = 0;
        const boucle = (maintenant: number) => {
            const debut = debutRef.current;
            if (debut === null) {
                setNiveau(0);
            } else {
                const t = maintenant - debut;
                if (t >= DUREE_PHRASE) {
                    setNiveau(0);
                    // Pause de repos de 4,2 s entre deux phrases : assez pour
                    // VOIR la respiration, la dérive et un clignement.
                    debutRef.current = enBoucleRef.current ? maintenant + 4200 : null;
                } else {
                    setNiveau(t < 0 ? 0 : amplitudeDeLaPhrase(t));
                }
            }
            frame = requestAnimationFrame(boucle);
        };
        frame = requestAnimationFrame(boucle);
        return () => cancelAnimationFrame(frame);
    }, []);

    const faireParler = () => {
        setEnBoucle(false);
        enBoucleRef.current = false;
        debutRef.current = performance.now();
    };
    const basculerBoucle = () => {
        const suivant = !enBoucleRef.current;
        enBoucleRef.current = suivant;
        setEnBoucle(suivant);
        if (suivant && debutRef.current === null) debutRef.current = performance.now();
    };

    const parle = niveau > 0.01;
    const presence: ArchitectePresenceState = parle ? 'speaking' : 'rest';

    return (
        <div data-miroir className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col items-center px-5 py-10">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-cyan-300/90">
                {ARCHITECTE_DISCLOSURE}
            </p>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2 text-center">L’Architecte — avatar vivant</h1>
            <p className="text-sm text-slate-400 mt-2 text-center max-w-lg leading-relaxed">
                Il respire, sa tête bouge, il cligne des yeux, et sa bouche suit l’amplitude de sa voix.
                Page de démonstration : aucune donnée de compte n’est lue ni écrite.
            </p>

            {/* L'avatar, en grand — c'est le composant RÉEL de l'application. */}
            <div className="mt-9">
                <ArchitecteAvatar
                    config={config}
                    presence={presence}
                    ttsEngine="elevenlabs"
                    outputLevel={niveau}
                    size={340}
                    actionLabel="Avatar de démonstration"
                />
            </div>

            <p
                data-testid="demo-etat"
                className="mt-6 text-sm font-semibold text-cyan-200 h-6"
                role="status"
            >
                L’Architecte {ARCHITECTE_STATE_LABEL[presence]}
            </p>

            <p className="text-sm text-slate-300 italic text-center mt-1 max-w-md min-h-[3rem]">
                {parle ? '« Bonjour. Je suis l’Architecte. Je vous accompagne dans MokNet. »' : ''}
            </p>

            {/* Amplitude visible : la bouche n'est pas une animation décorative,
                elle suit ce chiffre. */}
            <div className="w-full max-w-sm mt-2">
                <div className="flex justify-between text-[11px] text-slate-400 mb-1.5">
                    <span>Amplitude de la voix</span>
                    <span className="font-mono text-cyan-300">{Math.round(niveau * 100)} %</span>
                </div>
                <div className="h-2 rounded-full bg-cyan-400/10 overflow-hidden">
                    <div className="h-full bg-cyan-300 rounded-full" style={{ width: `${niveau * 100}%` }} />
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 mt-8">
                <button
                    type="button"
                    onClick={faireParler}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                    <Volume2 size={16} /> Le faire parler
                </button>
                <button
                    type="button"
                    onClick={basculerBoucle}
                    className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-100 text-sm font-bold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
                >
                    {enBoucle ? <Pause size={16} /> : <Play size={16} />}
                    {enBoucle ? 'Arrêter la boucle' : 'Répéter en boucle'}
                </button>
            </div>

            <p className="text-[11px] text-slate-500 mt-8 text-center max-w-md leading-relaxed">
                Au repos, observez la respiration, la dérive lente de la tête et le clignement — ils continuent
                même quand il ne parle pas. Un appareil réglé sur « réduire les animations » le laisse immobile,
                volontairement.
            </p>
        </div>
    );
};
