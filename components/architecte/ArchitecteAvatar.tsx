import React, { useEffect, useRef, useState } from 'react';
import { avatarHaloProps } from '../../services/live/liveMaterialSystem';
import {
    ARCHITECTE_DISCLOSURE,
    ARCHITECTE_STATE_LABEL,
    PRESENCE_TO_GRAMMAR,
    needsSyntheticMediaNotice,
    sculptureMaskFor,
    shouldAnimate,
    type ArchitecteAvatarConfig,
    type ArchitectePresenceState,
} from '../../services/architecte/architecteAvatar';
import {
    MAX_SPEECH_OPENNESS,
    MOUTH_TEETH_MS,
    resolveLipSyncLevel,
    resolveMouthOpenness,
    smoothOpenness,
    type MouthShape,
} from '../../services/architecte/lipSync';
import {
    adoptSprings,
    createProsodyTracker,
    createScoreTracker,
    updateProsody,
    updateScore,
    type ProsodyScore,
    type ScoreTracker,
} from '../../services/architecte/gestures';
import type { VoiceTrackRef } from '../../services/voiceEngine';
import { realAvatarUrl } from '../../services/studio/avatarIdentity';
import {
    resolveLivingPose,
    STILL_POSE,
    type LivingPose,
    type Attention,
    LIPS_PARTED_WHILE_SPEAKING,
    LIP_SHAPES,
    LIP_CLOSURE_EVERY,
    LIP_CLOSURE_MS,
    SYLLABLE_ONSET,
    SYLLABLE_RELEASE,
    easeFactor,
    EMPHASIS_RISE_MS,
    EMPHASIS_FALL_MS,
    SPEAKING_BLEND_MS,
    ATTENTION_BLEND_MS,
    LIP_WIDTH_MS,
    adaptQuality,
    medianOf,
} from '../../services/architecte/livingAvatar';
import { ArchitecteAvatarFace } from './ArchitecteAvatarFace';
import { LivingPortrait, type LivingPortraitHandle } from './LivingPortrait';
import { ArchitecteSequenceVideo, useSequencePlayerState } from './ArchitecteSequenceVideo';
import { ArchitecteSequenceCutout } from './ArchitecteSequenceCutout';
import { architecteSequencePlayer, type ArchitecteSequence, type SequencePlayer } from '../../services/architecte/sequences';

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
    /** Même chose par référence mutable (aucun rendu React par mot). Prioritaire sur `wordPulse`. */
    wordPulseRef?: { readonly current: { at: number; length: number } | null } | null;
    /** Niveau (0..1) de la voix prononcée, publié par `voiceEngine.onOutputVolume`. */
    outputLevel: number;
    /**
     * Même niveau, mais par RÉFÉRENCE mutable lue à chaque image : évite un
     * rendu React à 60 Hz de tout l'appelant pendant la parole. Prioritaire
     * sur `outputLevel` quand il est fourni.
     */
    outputLevelRef?: { readonly current: number } | null;
    /**
     * FORME de bouche mesurée sur la voix HD (visèmes acoustiques : mâchoire,
     * largeur des lèvres, dents, lèvres jointes), publiée par
     * `voiceEngine.onMouthShape`. Prioritaire sur le niveau quand elle existe.
     */
    mouthShapeRef?: { readonly current: MouthShape | null } | null;
    /**
     * PISTE PHONÉTIQUE en cours de lecture (texte aligné sur le son, voir
     * alignment.ts) : partition des gestes et origine de son horloge. Quand
     * elle existe, hochements, sourcils, regard et clignements sont
     * PLANIFIÉS (anticipés) sur les syllabes accentuées et les pauses du
     * texte ; sinon ils sont déduits de la voix, après coup.
     */
    voiceTrackRef?: { readonly current: VoiceTrackRef | null } | null;
    /** `true` quand la bouche suit une piste phonétique alignée (annoncé pour ce qu'il est). */
    voiceAligned?: boolean;
    /** Budget de pixels du canevas du portrait (bancs de preuve) ; défaut : `CANVAS_PIXEL_BUDGET`. */
    pixelBudget?: number;
    /**
     * Séquence vidéo pré-rendue (niveau P3a) jouable DANS ce cadre — la
     * présentation validée par la Direction. Absente = cadre sans vidéo.
     * Elle ne joue que sur `sequencePlayer.play(key, sequenceSlot)`.
     */
    sequence?: ArchitecteSequence | null;
    /** Nom de ce cadre pour le lecteur (« demo », « panel »…). Défaut : `testId`. */
    sequenceSlot?: string;
    sequencePlayer?: SequencePlayer;
    /** Diamètre en pixels. */
    size?: number;
    /**
     * `cadre` (défaut) : le rond bordé, halo d'état, vidéo dans le cadre.
     * `sculpture` : le visage DÉTOURÉ, sans cadre ni fond — la sculpture
     * vivante flottante demandée par la Direction (05/09/2026) ; l'état se lit
     * dans la lueur portée par la silhouette. Retombe sur `cadre` quand aucun
     * masque ne vaut pour la photo réglée.
     */
    variant?: 'cadre' | 'sculpture';
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
    outputLevelRef = null,
    mouthShapeRef = null,
    voiceTrackRef = null,
    voiceAligned = false,
    pixelBudget,
    sequence = null,
    sequenceSlot,
    sequencePlayer,
    wordPulse = null,
    wordPulseRef = null,
    size = 48,
    variant = 'cadre',
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
        aligned: voiceAligned,
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
    const wordPulseLocalRef = useRef<{ at: number; length: number } | null>(null);
    /** Dents visibles, lissées ; et suiveur de prosodie (gestes portés par la voix). */
    const teethRef = useRef(0);
    const prosodyRef = useRef(createProsodyTracker());
    /** Suiveur de la PARTITION (piste alignée) et la partition qu'il suit. */
    const scoreRef = useRef<ScoreTracker | null>(null);
    const scoreForRef = useRef<ProsodyScore | null>(null);
    // Emphase : enveloppe LENTE de la voix, pour des hochements qui suivent
    // le phrasé et non chaque syllabe (retour Direction : « pas naturel »).
    const emphasisRef = useRef(0);
    // Part « parole » lissée (~200 ms) : les transitions parole ↔ repos ne
    // font sauter ni la respiration, ni le balancement, ni l'inclinaison.
    const speakingBlendRef = useRef(0);
    // Formes de lèvres : une par syllabe (attaque détectée sur la cible), et
    // une syllabe sur trois se termine lèvres jointes — c'est ce qui fait
    // qu'une bouche PARLE au lieu de battre.
    const syllableRef = useRef({ index: 0, wasOpen: false, closureUntil: 0, width: 1 });
    // Attention (écoute / réflexion) et sa part lissée.
    const attentionRef = useRef<Attention>(null);
    const attentionBlendRef = useRef(0);
    // Le portrait se peint lui-même (Canvas) : pas de rendu React à 60 Hz.
    const portraitRef = useRef<LivingPortraitHandle>(null);
    // Cadence RÉELLE : durées des 60 dernières images ; si l'appareil ne suit
    // pas, la résolution du portrait baisse d'un cran (playbook 15 § 3).
    const frameTimesRef = useRef<number[]>([]);
    const qualityRef = useRef(1);
    levelRef.current = outputLevel;
    wordPulseLocalRef.current = wordPulse;
    speakingRef.current = presence === 'speaking';
    attentionRef.current = presence === 'listening' ? 'listening' : presence === 'thinking' ? 'thinking' : null;

    useEffect(() => {
        if (!animated) {
            opennessRef.current = 0;
            emphasisRef.current = 0;
            speakingBlendRef.current = 0;
            attentionBlendRef.current = 0;
            syllableRef.current = { index: 0, wasOpen: false, closureUntil: 0, width: 1 };
            teethRef.current = 0;
            prosodyRef.current = createProsodyTracker();
            scoreRef.current = null;
            scoreForRef.current = null;
            portraitRef.current?.draw(STILL_POSE);
            setPose(STILL_POSE);
            return;
        }
        let frame = 0;
        if (origineRef.current === null) origineRef.current = performance.now();
        const debut = origineRef.current;
        let imagePrecedente = performance.now();
        const boucle = (maintenant: number) => {
            // Durée réelle de l'image : les lissages sont en temps, pas en images.
            const dt = Math.min(100, Math.max(1, maintenant - imagePrecedente));
            imagePrecedente = maintenant;
            const durees = frameTimesRef.current;
            durees.push(dt);
            if (durees.length >= 60) {
                const suivante = adaptQuality(qualityRef.current, medianOf(durees));
                durees.length = 0;
                if (suivante !== qualityRef.current) {
                    qualityRef.current = suivante;
                    portraitRef.current?.setQuality(suivante);
                }
            }
            const pulse = wordPulseRef ? wordPulseRef.current : wordPulseLocalRef.current;
            const niveau = outputLevelRef ? outputLevelRef.current : levelRef.current;
            const forme = mouthShapeRef ? mouthShapeRef.current : null;
            let cible = resolveMouthOpenness(lipSyncLevel, {
                amplitude: niveau,
                elapsedMs: pulse ? maintenant - pulse.at : undefined,
                wordLength: pulse ? pulse.length : undefined,
            });
            const syl = syllableRef.current;
            let largeurVisee = 1;
            let dentsVisees = 0;
            let niveauVoix = cible;
            if (forme && (lipSyncLevel === 'amplitude_reelle' || lipSyncLevel === 'visemes_alignes')) {
                // VOIX HD : la forme vient de la piste phonétique alignée (visèmes
                // du texte, calés sur le son) ou, à défaut, du spectre de la voix —
                // voyelle ouverte ou fermée, lèvres étirées ou arrondies, dents sur
                // une fricative, lèvres jointes sur « m », « b », « p » et les silences.
                // Fermeture CONTINUE (plus de bascule à 0,5 : elle faisait un
                // à-coup à chaque « m », « b », « p »).
                const jointes = forme.closed <= 0.4 ? 0 : forme.closed >= 0.7 ? 1 : (() => { const x = (forme.closed - 0.4) / 0.3; return x * x * (3 - 2 * x); })();
                cible = forme.open * (1 - jointes);
                largeurVisee = forme.width;
                dentsVisees = forme.teeth;
                niveauVoix = forme.level;
                syl.wasOpen = cible >= SYLLABLE_ONSET;
            } else {
                // RYTHME DES MOTS (voix du navigateur) ou démonstration : syllabes
                // comptées sur la cible ; attaque → forme de lèvres suivante ;
                // retombée → parfois lèvres jointes un instant (« m », « b », « p »).
                if (cible >= SYLLABLE_ONSET && !syl.wasOpen) {
                    syl.wasOpen = true;
                    syl.index += 1;
                } else if (cible <= SYLLABLE_RELEASE && syl.wasOpen) {
                    syl.wasOpen = false;
                    if (syl.index % LIP_CLOSURE_EVERY === LIP_CLOSURE_EVERY - 1) syl.closureUntil = maintenant + LIP_CLOSURE_MS;
                }
                largeurVisee = speakingRef.current ? LIP_SHAPES[syl.index % LIP_SHAPES.length] : 1;
                // Lèvres entrouvertes tant qu'il parle : une bouche qui se referme
                // complètement entre deux syllabes claque comme une marionnette —
                // sauf pendant une fermeture voulue.
                if (maintenant < syl.closureUntil) cible = 0;
                else if (speakingRef.current) cible = Math.max(cible, LIPS_PARTED_WHILE_SPEAKING);
            }
            syl.width += (largeurVisee - syl.width) * easeFactor(LIP_WIDTH_MS, dt);
            teethRef.current += (dentsVisees - teethRef.current) * easeFactor(MOUTH_TEETH_MS, dt);
            opennessRef.current = smoothOpenness(opennessRef.current, cible, dt);
            const ouverture = opennessRef.current;
            // GESTES. Piste alignée : partition PLANIFIÉE sur le texte (hochement
            // anticipé sur la syllabe accentuée, sourcils au premier mot, regard,
            // clignement dans la pause). Sinon : déclenchés par la voix, après coup.
            // Une seule horloge — celle de la pose (ms écoulées) — pour dater les
            // clignements : datés sur `performance.now()`, ils n'étaient jamais
            // joués dans le navigateur (origine non nulle), seulement au montage.
            const piste = voiceTrackRef ? voiceTrackRef.current : null;
            let geste;
            if (piste) {
                if (scoreForRef.current !== piste.score || !scoreRef.current) {
                    // Nouvelle piste (segment suivant) : les ressorts héritent de
                    // l'état courant — jamais un retour brutal à zéro entre deux phrases.
                    const suivant = createScoreTracker(piste.score);
                    adoptSprings(scoreRef.current ?? prosodyRef.current, suivant);
                    scoreForRef.current = piste.score;
                    scoreRef.current = suivant;
                }
                geste = updateScore(scoreRef.current, { t: maintenant - piste.t0Perf, dtMs: dt, elapsedMs: maintenant - debut });
            } else {
                if (scoreRef.current) {
                    adoptSprings(scoreRef.current, prosodyRef.current);
                    scoreRef.current = null;
                    scoreForRef.current = null;
                }
                geste = updateProsody(prosodyRef.current, {
                    t: maintenant - debut,
                    open: Math.min(1, cible / MAX_SPEECH_OPENNESS),
                    loud: niveauVoix,
                    speaking: speakingRef.current,
                    dtMs: dt,
                    elapsedMs: maintenant - debut,
                });
            }
            emphasisRef.current += (ouverture - emphasisRef.current)
                * easeFactor(ouverture > emphasisRef.current ? EMPHASIS_RISE_MS : EMPHASIS_FALL_MS, dt);
            speakingBlendRef.current += ((speakingRef.current ? 1 : 0) - speakingBlendRef.current) * easeFactor(SPEAKING_BLEND_MS, dt);
            attentionBlendRef.current += ((attentionRef.current ? 1 : 0) - attentionBlendRef.current) * easeFactor(ATTENTION_BLEND_MS, dt);
            const pose = resolveLivingPose({
                elapsedMs: maintenant - debut,
                mouthOpenness: ouverture,
                emphasis: emphasisRef.current,
                animated: true,
                speaking: speakingRef.current,
                speakingBlend: speakingBlendRef.current,
                mouthWidth: syl.width,
                attention: attentionRef.current,
                attentionBlend: attentionBlendRef.current,
                mouthTeeth: teethRef.current,
                gesture: geste,
            });
            // Photo : le portrait se peint directement. Repli vectoriel : état React.
            if (portraitRef.current) portraitRef.current.draw(pose);
            else setPose(pose);
            frame = requestAnimationFrame(boucle);
        };
        frame = requestAnimationFrame(boucle);
        return () => cancelAnimationFrame(frame);
    }, [animated, lipSyncLevel, outputLevelRef, mouthShapeRef, wordPulseRef, voiceTrackRef]);

    const openness = pose.jawOpen;

    const photo = realAvatarUrl(config.photoUrl);
    const stateLabel = ARCHITECTE_STATE_LABEL[presence];
    const mouth = config.mouthAnchor;
    const player = sequencePlayer ?? architecteSequencePlayer;
    const slot = sequenceSlot ?? testId;
    const sequenceEnabled = sequence !== null && config.videoSequencesEnabled !== false;
    const sequenceState = useSequencePlayerState(player);
    const sequenceStatus =
        sequenceEnabled && sequence && sequenceState.key === sequence.key && sequenceState.slot === slot
            ? sequenceState.status
            : 'idle';

    // SCULPTURE : masque de silhouette (alpha) sur le portrait vivant ET sur la
    // vidéo, qui est calée sur le portrait pour que l'un succède à l'autre sans
    // saut. La lueur d'état remplace le halo rond : elle épouse la silhouette.
    const maskUrl = variant === 'sculpture' ? sculptureMaskFor(config) : null;
    const sculpture = maskUrl !== null;
    const haloColor = (halo.style['--halo-color'] as string | undefined) || 'rgba(143,227,255,0.45)';
    const maskStyle: React.CSSProperties = sculpture
        ? {
              WebkitMaskImage: `url(${maskUrl})`,
              maskImage: `url(${maskUrl})`,
              WebkitMaskSize: '100% 100%',
              maskSize: '100% 100%',
              WebkitMaskRepeat: 'no-repeat',
              maskRepeat: 'no-repeat',
          }
        : {};
    const videoStyle: React.CSSProperties | undefined =
        sculpture && sequence
            ? {
                  transformOrigin: `${sequence.alignment.originXPercent}% ${sequence.alignment.originYPercent}%`,
                  transform: `translate(${sequence.alignment.dxPercent}%, ${sequence.alignment.dyPercent}%) scale(${sequence.alignment.scale})`,
              }
            : undefined;
    const glow = presence === 'rest' ? 10 : 18;
    // Un appelant qui positionne lui-même l'avatar (`fixed …`) ne doit pas se
    // faire contredire par `relative` (défini APRÈS `fixed` dans la feuille
    // Tailwind, il l'emporterait : l'avatar flottant se retrouvait en haut à
    // gauche, décalé de ses marges). Sans classe de position, `relative` sert
    // de repère aux couches absolues.
    const positionClass = /\b(fixed|absolute|sticky)\b/.test(className) ? '' : 'relative';

    const portraitVivant = (
        <>
            {photo ? (
                /* LE PORTRAIT VIVANT : la photo respire, cligne et parle. */
                <LivingPortrait
                    ref={portraitRef}
                    photoUrl={photo}
                    rig={config.rig}
                    mouth={mouth}
                    accent={accent}
                    pixelBudget={pixelBudget}
                />
            ) : (
                /* Repli technique quand AUCUNE photo n'est configurée. Ce n'est
                   pas l'avatar : un tracé vectoriel ne respire pas de façon
                   crédible — il évite seulement un cadre vide. */
                <ArchitecteAvatarFace mouthOpenness={openness} accent={accent} animated={animated} />
            )}
        </>
    );

    const visage = (
        <>
            {portraitVivant}

            {/* SÉQUENCE VIDÉO VALIDÉE (P3a) : jouée par-dessus le portrait, dans
                le même cadre ; invisible au repos, le rig reprend dès la fin. */}
            {sequenceEnabled && sequence && (
                <ArchitecteSequenceVideo sequence={sequence} slot={slot} player={player} />
            )}
        </>
    );

    if (sculpture) {
        return (
            <button
                ref={hostRef}
                type="button"
                onClick={onClick}
                aria-label={`${config.displayName} — ${stateLabel}. ${actionLabel}`}
                title={`${config.displayName} — ${stateLabel}`}
                data-testid={testId}
                data-presence={presence}
                data-animated={animated ? 'true' : 'false'}
                data-lipsync={lipSyncLevel}
                data-sequence={sequenceStatus}
                data-variant="sculpture"
                style={{ width: size, height: size, filter: `drop-shadow(0 0 ${glow}px ${haloColor})` }}
                className={`${positionClass} shrink-0 bg-transparent p-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] rounded-2xl ${className}`}
            >
                {/* Le portrait vivant (rig 2D, repli technique) porte le masque
                    de silhouette relevé sur le portrait ; la vidéo validée, elle,
                    est détourée image par image par sa propre couche. */}
                <span aria-hidden="true" className="absolute inset-0 block" style={maskStyle} data-testid={`${testId}-silhouette`}>
                    {portraitVivant}
                </span>
                {sequenceEnabled && sequence && (
                    <ArchitecteSequenceCutout sequence={sequence} slot={slot} player={player} style={videoStyle} />
                )}
                {needsSyntheticMediaNotice(config) && (
                    <span
                        aria-hidden="true"
                        title="Média synthétique"
                        className="absolute bottom-1 right-1 w-3 h-3 rounded-full bg-cyan-400 border border-[#0f172a]"
                    />
                )}
            </button>
        );
    }

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
            data-sequence={sequenceStatus}
            data-variant="cadre"
            style={{ width: size, height: size }}
            className={`${positionClass} shrink-0 rounded-full overflow-hidden border border-cyan-500/60 bg-[#0A1622] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0f172a] ${className}`}
        >
            {/* Halo d'état — réutilise le système verre/eau/lumière du dépôt. */}
            <span
                aria-hidden="true"
                className={`absolute inset-0 rounded-full pointer-events-none ${animated ? halo.className : ''}`}
                style={halo.style as React.CSSProperties}
            />

            {visage}

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
