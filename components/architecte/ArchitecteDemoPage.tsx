import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Volume2 } from 'lucide-react';
import { adminConfigService } from '../../services/adminConfigService';
import {
    ARCHITECTE_DISCLOSURE,
    ARCHITECTE_STATE_LABEL,
    mergeArchitecteAvatarConfig,
    type ArchitectePresenceState,
} from '../../services/architecte/architecteAvatar';
import { LIP_SYNC_LEVEL_LABEL } from '../../services/architecte/lipSync';
import { ArchitecteAvatar } from './ArchitecteAvatar';

/** Ce que dit l'Architecte quand on lui demande de parler à voix haute. */
export const PHRASE_DEMO = 'Bonjour. Je suis l’Architecte. Je vous accompagne dans MokNet.';

/**
 * Sans frontière de mot reçue depuis ce délai, on considère que le navigateur
 * n'en émet pas (cas connu sur Android) et on pulse la bouche nous-mêmes.
 */
const DELAI_SANS_FRONTIERE_MS = 1100;
/** Sans démarrage de la voix dans ce délai, la voix est déclarée indisponible. */
const DELAI_DEMARRAGE_VOIX_MS = 1800;

type EtatVoix = 'inactive' | 'parle' | 'indisponible';

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
    const [enPhrase, setEnPhrase] = useState(false);
    const [enBoucle, setEnBoucle] = useState(true);
    useEffect(() => { enBoucleRef.current = enBoucle; }, [enBoucle]);

    // VOIX RÉELLE : la voix intégrée du navigateur. Elle ne donne pas accès à
    // son signal audio ; la bouche suit donc les frontières de mots — niveau
    // « rythme des mots », annoncé tel quel à l'écran, jamais présenté comme
    // une synchro d'amplitude (AI Core 15 : ne pas surpromettre la synchro).
    const [voix, setVoix] = useState<EtatVoix>('inactive');
    const voixRef = useRef<EtatVoix>('inactive');
    const [mot, setMot] = useState<{ at: number; length: number } | null>(null);
    const motRef = useRef<{ at: number; length: number } | null>(null);
    const pulserMot = (length: number) => {
        const m = { at: performance.now(), length };
        motRef.current = m;
        setMot(m);
    };

    useEffect(() => {
        debutRef.current = performance.now() + 600;
        let frame = 0;
        const boucle = (maintenant: number) => {
            const debut = debutRef.current;
            // Voix du navigateur sans frontières de mots (Android, certains
            // WebView) : on pulse nous-mêmes, sinon elle parlerait bouche close.
            if (voixRef.current === 'parle' && maintenant - (motRef.current?.at ?? 0) > DELAI_SANS_FRONTIERE_MS) {
                const m = { at: maintenant, length: 5 };
                motRef.current = m;
                setMot(m);
            }
            if (debut === null) {
                setNiveau(0);
                setEnPhrase(false);
            } else {
                const t = maintenant - debut;
                setEnPhrase(t >= 0 && t < DUREE_PHRASE);
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

    const changerVoix = (etat: EtatVoix) => {
        voixRef.current = etat;
        setVoix(etat);
    };

    /**
     * Le faire parler À VOIX HAUTE. Si la voix intégrée manque ou ne démarre
     * pas (navigateur sans voix, lecture bloquée), on retombe sur la
     * démonstration muette — et on le DIT à l'écran.
     */
    const parlerAVoixHaute = () => {
        const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;
        if (!synth || typeof SpeechSynthesisUtterance === 'undefined') {
            changerVoix('indisponible');
            faireParler();
            return;
        }
        synth.cancel();
        const lecture = new SpeechSynthesisUtterance(PHRASE_DEMO);
        lecture.lang = 'fr-FR';
        lecture.rate = 0.95;
        const voixFrancaise = synth.getVoices().find((v) => (v.lang || '').toLowerCase().startsWith('fr'));
        if (voixFrancaise) lecture.voice = voixFrancaise;
        let demarree = false;
        lecture.onstart = () => {
            demarree = true;
            // La lecture à voix haute remplace la boucle muette.
            setEnBoucle(false);
            enBoucleRef.current = false;
            debutRef.current = null;
            changerVoix('parle');
            pulserMot(7);
        };
        lecture.onboundary = (e: SpeechSynthesisEvent) => {
            if (e.name && e.name !== 'word') return;
            const longueur = e.charLength && e.charLength > 0
                ? e.charLength
                : (PHRASE_DEMO.slice(e.charIndex).match(/^\S+/)?.[0].length ?? 5);
            pulserMot(longueur);
        };
        const fin = () => {
            changerVoix('inactive');
            motRef.current = null;
            setMot(null);
        };
        lecture.onend = fin;
        lecture.onerror = fin;
        synth.speak(lecture);
        window.setTimeout(() => {
            if (!demarree) {
                synth.cancel();
                changerVoix('indisponible');
                faireParler();
            }
        }, DELAI_DEMARRAGE_VOIX_MS);
    };
    const basculerBoucle = () => {
        const suivant = !enBoucleRef.current;
        enBoucleRef.current = suivant;
        setEnBoucle(suivant);
        if (suivant && debutRef.current === null) debutRef.current = performance.now();
    };

    const voixEnCours = voix === 'parle';
    const parle = voixEnCours || enPhrase;
    const presence: ArchitectePresenceState = parle ? 'speaking' : 'rest';
    const niveauSynchro = voixEnCours ? 'rythme_des_mots' : 'amplitude_reelle';

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
                    ttsEngine={voixEnCours ? 'browser_native' : 'elevenlabs'}
                    outputLevel={niveau}
                    wordPulse={mot}
                    size={400}
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
                {parle ? `« ${PHRASE_DEMO} »` : ''}
            </p>
            {voix === 'indisponible' && (
                <p data-testid="demo-voix" className="text-xs text-amber-300/90 text-center max-w-md">
                    Voix intégrée du navigateur indisponible sur cet appareil : démonstration muette.
                </p>
            )}
            {voixEnCours && (
                <p data-testid="demo-voix" className="text-xs text-cyan-200/80 text-center max-w-md">
                    {LIP_SYNC_LEVEL_LABEL[niveauSynchro]}
                </p>
            )}

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
                    onClick={parlerAVoixHaute}
                    className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-bold transition flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                    <Volume2 size={16} /> Le faire parler à voix haute
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
