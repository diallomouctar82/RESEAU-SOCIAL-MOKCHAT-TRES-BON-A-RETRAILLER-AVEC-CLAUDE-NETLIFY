import React, { useEffect, useRef, useState } from 'react';
import { avatarHaloProps } from '../../services/live/liveMaterialSystem';
import {
    ARCHITECTE_DISCLOSURE,
    ARCHITECTE_STATE_LABEL,
    PRESENCE_TO_GRAMMAR,
    needsSyntheticMediaNotice,
    shouldAnimate,
    type ArchitecteAvatarConfig,
    type ArchitectePresenceState,
} from '../../services/architecte/architecteAvatar';
import {
    resolveLipSyncLevel,
    resolveMouthOpenness,
    smoothOpenness,
} from '../../services/architecte/lipSync';
import { realAvatarUrl } from '../../services/studio/avatarIdentity';
import { resolveLivingPose, STILL_POSE, type LivingPose, LIPS_PARTED_WHILE_SPEAKING } from '../../services/architecte/livingAvatar';
import { ArchitecteAvatarFace } from './ArchitecteAvatarFace';
import { LivingPortrait, type LivingPortraitHandle } from './LivingPortrait';

/**
 * AVATAR VIVANT DE L'ARCHITECTE — présence P1 + P2 (AI Core, playbook 15).
 *
 * Remplace le rond à icône par un VISAGE qui montre son état et dont la
 * bouche suit la voix. Ce que ce composant est, exactement :
 *
 *  - P1 présence légère : SVG + CSS, jamais une vidéo en boucle (playbook § 3) ;
 *  - P2 présence vocale : bouche animée pendant la parole réelle (§ 5).
 *
 * Ce qu'il n'est PAS, et ne prétend pas être : P3 (avatar vidéo temps réel)
 * ni P4 (avatar génératif personnel). Ces niveaux exigent une gateway
 * d'avatars et un fournisseur sélectionné par pilote.
 *
 * Trois règles du playbook sont tenues ici et vérifiées par test :
 *  - l'animation s'arrête hors écran et sur onglet caché (§ 3 et § 10) ;
 *  - le mouvement n'est jamais la seule information : l'état est aussi
 *    écrit et annoncé aux lecteurs d'écran (§ 3) ;
 *  - l'identité officielle est visible, et une PHOTO déclenche la mention de
 *    média synthétique (§ 1 et § 9).
 */

export interface ArchitecteAvatarProps {
    config: ArchitecteAvatarConfig;
    presence: ArchitectePresenceState;
    /** Moteur réellement en train de parler — décide du niveau de synchro labiale atteignable. */
    ttsEngine: 'elevenlabs' | 'browser_native' | null;
    /**
     * Dernier mot prononcé par la voix intégrée du navigateur (`speechSynthesis`),
     * qui ne donne pas accès à son signal audio : instant de la frontière de
     * mot (`performance.now()`) et longueur du mot. Ignoré avec ElevenLabs,
     * dont l'amplitude réelle est mesurée. `null` = pas de mot en cours.
     */
    wordPulse?: { at: number; length: number } | null;
    /** Niveau (0..1) de la voix prononcée, publié par `voiceEngine.onOutputVolume`. */
    outputLevel: number;
    /** Diamètre en pixels. */
    size?: number;
    onClick?: () => void;
    /** Libellé du bouton — l'action, pas la décoration. */
    actionLabel: string;
    className?: string;
    /** Reprend l'identifiant du bouton remplacé, pour ne casser aucun appelant ni aucun test. */
    testId?: string;
}

/** `prefers-reduced-motion` réel, réévalué si l'utilisateur change son réglage système. */
function usePrefersReducedMotion(): boolean {
    const [reduced, setReduced] = useState(false);
    useEffect(() => {
        if (typeof window === 'undefined' || !window.matchMedia) return;
        const query = window.matchMedia('(prefers-reduced-motion: reduce)');
        const apply = () => setReduced(query.matches);
        apply();
        query.addEventListener?.('change', apply);
        return () => query.removeEventListener?.('change', apply);
    }, []);
    return reduced;
}

/** Onglet réellement visible — une animation sur un onglet caché consomme sans être vue. */
function useDocumentVisible(): boolean {
    const [visible, setVisible] = useState(true);
    useEffect(() => {
        if (typeof document === 'undefined') return;
        const apply = () => setVisible(!document.hidden);
        apply();
        document.addEventListener('visibilitychange', apply);
        return () => document.removeEventListener('visibilitychange', apply);
    }, []);
    return visible;
}

/** Élément réellement à l'écran. Sans `IntersectionObserver`, on suppose visible plutôt que de tout figer. */
function useOnScreen(ref: React.RefObject<HTMLElement>): boolean {
    const [onScreen, setOnScreen] = useState(true);
    useEffect(() => {
        const node = ref.current;
        if (!node || typeof IntersectionObserver === 'undefined') return;
        const observer = new IntersectionObserver(([entry]) => setOnScreen(entry.isIntersecting), {
            threshold: 0.01,
        });
        observer.observe(node);
        return () => observer.disconnect();
    }, [ref]);
    return onScreen;
}

export const ArchitecteAvatar: React.FC<ArchitecteAvatarProps> = ({
    config,
    presence,
    ttsEngine,
    outputLevel,
    wordPulse = null,
    size = 48,
    onClick,
    actionLabel,
    className = '',
    testId = 'architecte-avatar',
}) => {
    const hostRef = useRef<HTMLButtonElement>(null);
    const prefersReducedMotion = usePrefersReducedMotion();
    const documentVisible = useDocumentVisible();
    const onScreen = useOnScreen(hostRef as React.RefObject<HTMLElement>);

    const animated = shouldAnimate(config, { prefersReducedMotion, documentVisible, onScreen });
    const grammar = PRESENCE_TO_GRAMMAR[presence];
    const halo = avatarHaloProps(grammar);
    const accent = (halo.style['--halo-color'] || '#8FE3FF').replace(/rgba?\(([^)]+),\s*[\d.]+\)/, 'rgb($1)');

    const lipSyncLevel = resolveLipSyncLevel({
        isSpeaking: presence === 'speaking',
        engine: ttsEngine,
        lipSyncEnabled: config.lipSyncEnabled,
        prefersReducedMotion,
    });

    /**
     * BOUCLE D'ANIMATION — c'est elle qui rend le portrait vivant.
     *
     * Une seule `requestAnimationFrame` produit tout : respiration, dérive de
     * la tête, clignement et ouverture de mâchoire. Elle ne démarre PAS quand
     * l'avatar doit rester immobile (réglage coupé, mouvement réduit, onglet
     * caché, hors écran) — donc aucune image n'est calculée pour rien.
     *
     * L'ouverture de bouche est lissée ici et non dans le domaine : la valeur
     * brute de l'analyseur saute d'une image à l'autre et donnerait un
     * claquement de mâchoire au lieu d'une parole.
     */
    const [pose, setPose] = useState<LivingPose>(STILL_POSE);
    const opennessRef = useRef(0);
    const levelRef = useRef(0);
    const speakingRef = useRef(false);
    // Origine du temps UNIQUE pour toute la vie du composant : si elle
    // repartait à zéro à chaque changement d'état (parole ↔ repos), la table
    // des clignements et la dérive de tête recommenceraient leur cycle au
    // même point — et les premiers clignements n'arriveraient jamais.
    const origineRef = useRef<number | null>(null);
    const wordPulseRef = useRef<{ at: number; length: number } | null>(null);
    // Emphase : enveloppe LENTE de la voix, pour des hochements qui suivent
    // le phrasé et non chaque syllabe (retour Direction : « pas naturel »).
    const emphasisRef = useRef(0);
    // Part « parole » lissée (~200 ms) : les transitions parole ↔ repos ne
    // font sauter ni la respiration, ni le balancement, ni l'inclinaison.
    const speakingBlendRef = useRef(0);
    // Le portrait se peint lui-même (Canvas) : pas de rendu React à 60 Hz.
    const portraitRef = useRef<LivingPortraitHandle>(null);
    levelRef.current = outputLevel;
    wordPulseRef.current = wordPulse;
    speakingRef.current = presence === 'speaking';

    useEffect(() => {
        if (!animated) {
            opennessRef.current = 0;
            emphasisRef.current = 0;
            speakingBlendRef.current = 0;
            portraitRef.current?.draw(STILL_POSE);
            setPose(STILL_POSE);
            return;
        }
        let frame = 0;
        if (origineRef.current === null) origineRef.current = performance.now();
        const debut = origineRef.current;
        const boucle = (maintenant: number) => {
            const pulse = wordPulseRef.current;
            let cible = resolveMouthOpenness(lipSyncLevel, {
                amplitude: levelRef.current,
                elapsedMs: pulse ? maintenant - pulse.at : undefined,
                wordLength: pulse ? pulse.length : undefined,
            });
            // Lèvres entrouvertes tant qu'il parle : une bouche qui se referme
            // complètement entre deux syllabes claque comme une marionnette.
            if (speakingRef.current) cible = Math.max(cible, LIPS_PARTED_WHILE_SPEAKING);
            opennessRef.current = smoothOpenness(opennessRef.current, cible);
            const ouverture = opennessRef.current;
            emphasisRef.current += (ouverture - emphasisRef.current) * (ouverture > emphasisRef.current ? 0.06 : 0.035);
            speakingBlendRef.current += ((speakingRef.current ? 1 : 0) - speakingBlendRef.current) * 0.08;
            const pose = resolveLivingPose({
                elapsedMs: maintenant - debut,
                mouthOpenness: ouverture,
                emphasis: emphasisRef.current,
                animated: true,
                speaking: speakingRef.current,
                speakingBlend: speakingBlendRef.current,
            });
            // Photo : le portrait se peint directement. Repli vectoriel : état React.
            if (portraitRef.current) portraitRef.current.draw(pose);
            else setPose(pose);
            frame = requestAnimationFrame(boucle);
        };
        frame = requestAnimationFrame(boucle);
        return () => cancelAnimationFrame(frame);
    }, [animated, lipSyncLevel]);

    const openness = pose.jawOpen;

    const photo = realAvatarUrl(config.photoUrl);
    const stateLabel = ARCHITECTE_STATE_LABEL[presence];
    const mouth = config.mouthAnchor;

    return (
        <button
            ref={hostRef}
            type="button"
            onClick={onClick}
            // L'état est DANS le nom accessible : un lecteur d'écran annonce
            // « L'Architecte parle », le mouvement n'est jamais seul à le dire.
            aria-label={`${config.displayName} — ${stateLabel}. ${actionLabel}`}
            title={`${config.displayName} — ${stateLabel}`}
            data-testid={testId}
            data-presence={presence}
            data-animated={animated ? 'true' : 'false'}
            data-lipsync={lipSyncLevel}
            style={{ width: size, height: size }}
            className={`relative shrink-0 rounded-full overflow-hidden border border-cyan-500/60 bg-[#0A1622] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] ${className}`}
        >
            {/* Halo d'état — réutilise le système verre/eau/lumière du dépôt. */}
            <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full pointer-events-none ${animated ? halo.className : ''}`}
                style={halo.style as React.CSSProperties}
            />

            {photo ? (
                /* LE PORTRAIT VIVANT : la photo respire, cligne et parle. */
                <LivingPortrait
                    ref={portraitRef}
                    photoUrl={photo}
                    rig={config.rig}
                    mouth={mouth}
                    accent={accent}
                />
            ) : (
                /* Repli technique quand AUCUNE photo n'est configurée. Ce n'est
                   pas l'avatar : un tracé vectoriel ne respire pas de façon
                   crédible — il évite seulement un cadre vide. */
                <ArchitecteAvatarFace mouthOpenness={openness} accent={accent} animated={animated} />
            )}

            {/* Média synthétique : obligatoire dès qu'une photo remplace le
                dessin, puisqu'une confusion redevient alors possible. */}
            {needsSyntheticMediaNotice(config) && (
                <span
                    aria-hidden="true"
                    title="Média synthétique"
                    className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-cyan-400 border border-[#0f172a]"
                />
            )}
        </button>
    );
};

/**
 * Étiquette d'identité officielle + état, à poser À CÔTÉ de l'avatar.
 *
 * Séparée du bouton exprès : le playbook demande un libellé VISIBLE, pas une
 * info-bulle. Dans une barre étroite, l'appelant choisit où la placer sans
 * déformer l'avatar.
 */
export const ArchitecteIdentityBadge: React.FC<{
    config: ArchitecteAvatarConfig;
    presence: ArchitectePresenceState;
}> = ({ config, presence }) => (
    <span className="flex flex-col leading-tight min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-widest text-cyan-300/90 truncate">
            {ARCHITECTE_DISCLOSURE}
        </span>
        <span className="text-[10px] text-slate-400 truncate" data-testid="architecte-state-text">
            {config.displayName} {ARCHITECTE_STATE_LABEL[presence]}
        </span>
    </span>
);
