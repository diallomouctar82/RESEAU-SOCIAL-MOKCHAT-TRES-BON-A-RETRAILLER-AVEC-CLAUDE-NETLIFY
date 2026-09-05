/**
 * AVATAR VIVANT DE L'ARCHITECTE — configuration et états.
 *
 * L'Architecte est « le guide permanent de toute la maison MokNet »
 * (consigne Direction RO-3, voir Layout.tsx) : jusqu'ici un rond de 48 px
 * avec une icône `UserRound`. Ce module lui donne un VISAGE, pilote ses
 * états animés, et expose ce qui est réglable depuis le Super-Admin.
 *
 * Module PUR : aucune dépendance React, réseau, audio ou `localStorage`.
 * Ce sont les décisions — quel visage, quel état, quelle ouverture de
 * bouche, quelles animations, quelle voix — qui vivent ici, donc elles se
 * vérifient par test sans navigateur et sans clé d'API.
 *
 * Réutilisation stricte de l'existant : les 10 états animés sont ceux de
 * `AvatarGrammarState` (services/live/liveMaterialSystem.ts), déjà dotés de
 * leurs animations CSS et de leurs couleurs de halo ; les voix sont celles
 * du catalogue réel `ELEVENLABS_CURATED_VOICES`. Rien n'est réinventé.
 */

import type { AvatarGrammarState } from '../live/liveMaterialSystem';
import { realAvatarUrl } from '../studio/avatarIdentity';
import { DEFAULT_PORTRAIT_RIG, type PortraitRig } from './livingAvatar';

// ─────────────────────────────────────────────────────────────────────────
// 1. CONFIGURATION
// ─────────────────────────────────────────────────────────────────────────

/**
 * Où se trouve la bouche sur le visage, en POURCENTAGE du cadre.
 *
 * Indispensable dès qu'on accepte une photo quelconque : le code ne peut pas
 * deviner où est la bouche d'un visage qu'il n'a jamais vu. L'Admin-Général
 * la positionne ; sans réglage, la valeur par défaut vise le tiers inférieur
 * centré, ce qui convient à un portrait cadré normalement.
 */
export interface MouthAnchor {
    /** 0 = bord gauche, 100 = bord droit. */
    xPercent: number;
    /** 0 = haut, 100 = bas. */
    yPercent: number;
    /** Largeur de la zone animée, en % de la largeur du cadre. */
    widthPercent: number;
    /**
     * Inclinaison de la ligne des lèvres, en degrés (sens horaire positif).
     * Une tête légèrement tournée a une bouche qui n'est pas horizontale ;
     * une cavité posée à plat sur des lèvres inclinées se voit tout de suite.
     */
    tiltDeg?: number;
}

// Relevé sur grille au 0,5 % (04/09/2026) : commissures à 43,5 et 61,5 % de la
// largeur, ligne des lèvres à 67,3 % de la hauteur, légèrement remontante à
// droite (la tête est un peu tournée).
export const DEFAULT_MOUTH_ANCHOR: MouthAnchor = { xPercent: 52.5, yPercent: 67.3, widthPercent: 18, tiltDeg: -1.6 };

export interface ArchitecteAvatarConfig {
    /**
     * PHOTO du visage — c'est elle qui est animée. Vide = repli technique sur
     * le tracé vectoriel, jamais une image manquante ; mais ce repli n'est
     * pas l'avatar : un dessin ne peut pas respirer de façon crédible.
     */
    photoUrl: string;
    /** Où sont les yeux et la mâchoire SUR CETTE photo — sans quoi rien ne peut être animé. */
    rig: PortraitRig;
    /** Nom affiché sous l'avatar et annoncé aux lecteurs d'écran. */
    displayName: string;
    mouthAnchor: MouthAnchor;
    /** `false` = avatar strictement immobile (préférence d'accessibilité ou choix de la Direction). */
    animationsEnabled: boolean;
    /** `false` = aucune animation de bouche, même quand l'Architecte parle. */
    lipSyncEnabled: boolean;
    /** Clé du catalogue `ELEVENLABS_CURATED_VOICES` ; vide = voix attitrée par défaut. */
    voiceKey: string;
    /**
     * Séquences vidéo pré-rendues (niveau P3a) : la présentation validée par la
     * Direction le 05/09/2026 (modèle HeyGen sur le portrait officiel et la voix
     * HD). `false` = l'avatar ne propose plus la vidéo ; le rig 2D reste actif.
     * Absent d'une configuration enregistrée avant cette version = `true`.
     */
    videoSequencesEnabled: boolean;
    updatedAt: string;
    updatedBy: string;
}

/**
 * Réglages d'usine. `photoUrl` vide EXPRÈS : tant que la Direction n'a pas
 * fourni la photo de référence, l'avatar dessiné par l'application est
 * affiché — un vrai visage, pas un cadre vide ni une image cassée.
 */
export const DEFAULT_ARCHITECTE_AVATAR: ArchitecteAvatarConfig = {
    // Portrait livré avec l'application. Mesures d'ancrage relevées sur CETTE
    // image : œil à 45 % de la hauteur, mâchoire à 65 %, lèvres à 75 %.
    photoUrl: '/architecte/architecte.webp',
    rig: DEFAULT_PORTRAIT_RIG,
    displayName: "L'Architecte",
    mouthAnchor: DEFAULT_MOUTH_ANCHOR,
    animationsEnabled: true,
    lipSyncEnabled: true,
    voiceKey: '',
    videoSequencesEnabled: true,
    updatedAt: '',
    updatedBy: '',
};

/** Complète une configuration partielle ou héritée — jamais de champ `undefined` lu par l'écran. */
export function mergeArchitecteAvatarConfig(stored: unknown): ArchitecteAvatarConfig {
    const source = (stored && typeof stored === 'object' ? stored : {}) as Partial<ArchitecteAvatarConfig>;
    return {
        ...DEFAULT_ARCHITECTE_AVATAR,
        ...source,
        mouthAnchor: { ...DEFAULT_MOUTH_ANCHOR, ...(source.mouthAnchor || {}) },
        rig: { ...DEFAULT_PORTRAIT_RIG, ...(source.rig || {}) },
    };
}

export type AvatarPhotoRejectionCode = 'placeholder' | 'protocole' | 'vide';

export interface AvatarPhotoRejection {
    code: AvatarPhotoRejectionCode;
    message: string;
}

/**
 * Contrôle de l'adresse saisie par l'Admin-Général. `null` = acceptée.
 * Mêmes garde-fous que l'avatar par défaut de la plateforme : le cliché de
 * banque d'images hérité est refusé (l'app le traite déjà comme « absent »),
 * et seules les adresses `https://`, les chemins internes et les images
 * encodées sont acceptées.
 */
export function validateArchitectePhotoUrl(rawUrl: string): AvatarPhotoRejection | null {
    const url = rawUrl.trim();
    if (!url) {
        return { code: 'vide', message: 'Indiquez l’adresse de la photo, ou remettez l’avatar par défaut.' };
    }
    if (!realAvatarUrl(url)) {
        return {
            code: 'placeholder',
            message:
                'Cette photo est le cliché de banque d’images hérité : l’application le traite déjà comme « avatar absent ».',
        };
    }
    if (!/^(https:\/\/|\/|data:image\/)/.test(url)) {
        return {
            code: 'protocole',
            message: 'Adresse invalide : utilisez https://, un chemin interne commençant par « / », ou une image importée.',
        };
    }
    return null;
}

/** Borne l'ancre dans le cadre : un réglage hors limites placerait la bouche hors du visage. */
export function clampMouthAnchor(anchor: Partial<MouthAnchor>): MouthAnchor {
    const clamp = (value: number, min: number, max: number, fallback: number) =>
        Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
    return {
        xPercent: clamp(anchor.xPercent!, 0, 100, DEFAULT_MOUTH_ANCHOR.xPercent),
        yPercent: clamp(anchor.yPercent!, 0, 100, DEFAULT_MOUTH_ANCHOR.yPercent),
        widthPercent: clamp(anchor.widthPercent!, 4, 60, DEFAULT_MOUTH_ANCHOR.widthPercent),
        tiltDeg: clamp(anchor.tiltDeg!, -15, 15, DEFAULT_MOUTH_ANCHOR.tiltDeg!),
    };
}

// ─────────────────────────────────────────────────────────────────────────
// 2. NIVEAU DE PRÉSENCE (AI Core, playbook 15 § « Niveaux de présence »)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Ce que l'Architecte sait réellement faire aujourd'hui, dans le vocabulaire
 * normatif d'AI Core. Déclaré explicitement pour qu'aucun écran, aucune PR et
 * aucun rapport ne laisse croire à un niveau supérieur.
 *
 *  P0 identité statique · P1 présence légère · P2 présence vocale ·
 *  P3 avatar vidéo temps réel · P4 avatar personnel génératif.
 *
 * Cette livraison atteint **P1 + P2** : présence légère en SVG/CSS et bouche
 * animée pendant la parole. P3 et P4 ne sont NI livrés NI simulés — ils
 * exigent une gateway d'avatars, un fournisseur sélectionné par pilote et un
 * consentement séparé (playbook 15 § 6 et § 8).
 */
export type PresenceLevel = 'P0' | 'P1' | 'P2' | 'P3' | 'P3a' | 'P4';

/** Niveau de la présence en direct (rig 2D dans le navigateur). */
export const ARCHITECTE_PRESENCE_LEVEL: PresenceLevel = 'P2';
/** Niveau des séquences vidéo pré-rendues validées (playbook 15 v1.1.0, ADR-0025 d'AI Core). */
export const ARCHITECTE_VIDEO_LEVEL: PresenceLevel = 'P3a';

/**
 * Étiquette de divulgation — principe NON NÉGOCIABLE n°1 du playbook 15 :
 * « Un avatar officiel porte un libellé visible ».
 *
 * Le playbook autorise trois formes : « IA Moknet », « Assistant Moknet », ou
 * **une identité officielle approuvée**. C'est la troisième qui est retenue,
 * parce que la règle §4.1 d'`AGENTS.md` interdit à cette plateforme de faire
 * dire « je suis une intelligence artificielle » à ses figures. « L'Architecte,
 * présence officielle MokNet » satisfait les deux : l'identité est visible et
 * officielle, et rien ne se fait passer pour une personne réelle précise.
 */
export const ARCHITECTE_DISCLOSURE = 'Présence officielle MokNet';

/**
 * Le visage par défaut est un dessin ouvertement mécanique : aucune confusion
 * raisonnable avec une personne réelle n'est possible. Dès que la Direction
 * dépose une PHOTO, la confusion redevient possible — le playbook impose
 * alors la mention de média synthétique (§ 9 « Anti-usurpation »).
 */
export function needsSyntheticMediaNotice(config: ArchitecteAvatarConfig): boolean {
    return !!realAvatarUrl(config.photoUrl);
}

// ─────────────────────────────────────────────────────────────────────────
// 3. MACHINE D'ÉTATS DE PRÉSENCE (playbook 15 § 4)
// ─────────────────────────────────────────────────────────────────────────

/**
 * Machine d'états NORMATIVE d'AI Core. Les huit états sont repris tels quels,
 * y compris les deux que la grammaire visuelle du dépôt n'avait pas :
 *
 *  - `fallback` : le mode riche est indisponible, la conversation continue —
 *    sans lui, une panne de moteur vocal aurait laissé l'avatar « au repos »,
 *    donc l'air parfaitement sain pendant une dégradation réelle ;
 *  - `offline` : aucun média temps réel possible — le Gate Future UI/UX exige
 *    explicitement un état hors ligne.
 */
export type ArchitectePresenceState =
    | 'rest'
    | 'listening'
    | 'thinking'
    | 'speaking'
    | 'success'
    | 'error'
    | 'fallback'
    | 'offline';

/**
 * Signaux RÉELLEMENT émis par le moteur vocal et la barre de l'Architecte
 * (`useVoiceAssistant` : `isSpeaking`, `isListening`, `ttsEngine`,
 * `conversationalTurn` ; la barre ajoute « réfléchit » et « micro en échec »).
 * Aucun état inventé, aucune émotion simulée.
 */
export interface ArchitecteRuntimeSignals {
    isSpeaking: boolean;
    isListening: boolean;
    isThinking: boolean;
    /** Le micro a réellement échoué — jamais « en panne » par défaut. */
    micFailed: boolean;
    /** Dernière action exécutée : succès, échec, ou incomprise. */
    lastOutcome?: 'succes' | 'erreur' | 'incertitude';
    /** Analyse visuelle en cours (caméra HUD). */
    visionActive?: boolean;
    /** `false` = navigateur hors ligne. */
    online?: boolean;
    /**
     * Le mode riche a réellement été dégradé : la voix HD a basculé sur le
     * moteur du navigateur, ou le fournisseur a échoué. Jamais présumé.
     */
    degraded?: boolean;
}

/**
 * Traduit les signaux réels en état de présence.
 *
 * L'ordre EST la règle de priorité, et il suit le playbook : ce qui empêche
 * la conversation passe avant ce qui la décore. Hors ligne d'abord — inutile
 * de montrer une écoute attentive quand plus rien ne peut partir.
 */
export function resolveArchitectePresence(signals: ArchitecteRuntimeSignals): ArchitectePresenceState {
    if (signals.online === false) return 'offline';
    if (signals.micFailed) return 'error';
    if (signals.isSpeaking) return 'speaking';
    if (signals.isListening) return 'listening';
    if (signals.isThinking) return 'thinking';
    // La dégradation ne se montre qu'une fois l'échange au calme : l'annoncer
    // pendant que l'Architecte parle déjà couperait l'information utile.
    if (signals.degraded) return 'fallback';
    if (signals.lastOutcome === 'erreur') return 'error';
    if (signals.lastOutcome === 'incertitude') return 'fallback';
    if (signals.lastOutcome === 'succes') return 'success';
    return 'rest';
}

/**
 * Habillage visuel : chaque état de présence emprunte la teinte et
 * l'animation d'un état de la grammaire DÉJÀ en place dans le dépôt
 * (`AvatarGrammarState`, CSS existant). On réutilise le système verre/eau/
 * lumière au lieu d'en inventer un second.
 */
export const PRESENCE_TO_GRAMMAR: Record<ArchitectePresenceState, AvatarGrammarState> = {
    rest: 'repos',
    listening: 'ecoute',
    thinking: 'reflexion',
    speaking: 'reponse',
    success: 'succes',
    error: 'erreur',
    fallback: 'incertitude',
    offline: 'incertitude',
};

/**
 * Phrase d'état — le playbook l'exige : « Aucun mouvement ne doit être le
 * seul moyen d'indiquer un statut : couleur, icône et texte le complètent. »
 * Ces libellés sont lus par les lecteurs d'écran ET affichés.
 */
export const ARCHITECTE_STATE_LABEL: Record<ArchitectePresenceState, string> = {
    rest: 'au repos',
    listening: 'vous écoute',
    thinking: 'réfléchit',
    speaking: 'parle',
    success: 'a terminé',
    error: 'a rencontré une erreur',
    fallback: 'fonctionne en mode allégé',
    offline: 'hors ligne',
};

/**
 * Une animation ne tourne QUE si les quatre conditions sont réunies. Les deux
 * dernières viennent du playbook § 3 (« les animations s'arrêtent hors écran,
 * en arrière-plan ») et § 10 (batterie, mobile) : une boucle qui continue sur
 * un onglet caché consomme sans que personne ne la voie.
 */
export function shouldAnimate(
    config: ArchitecteAvatarConfig,
    context: { prefersReducedMotion: boolean; documentVisible: boolean; onScreen: boolean },
): boolean {
    return (
        config.animationsEnabled &&
        !context.prefersReducedMotion &&
        context.documentVisible &&
        context.onScreen
    );
}

// ─────────────────────────────────────────────────────────────────────────
// 4. VOIX
// ─────────────────────────────────────────────────────────────────────────

/**
 * Identifiant de voix effectif. `voiceKey` vide ou inconnue → `fallbackId`,
 * c'est-à-dire la voix attitrée de l'Architecte déjà déclarée par la barre
 * flottante. Un réglage effacé ne rend jamais l'Architecte muet.
 */
export function resolveArchitecteVoiceId(
    config: ArchitecteAvatarConfig,
    catalogue: Record<string, { id: string }>,
    fallbackId: string,
): string {
    const chosen = config.voiceKey ? catalogue[config.voiceKey] : undefined;
    return chosen?.id || fallbackId;
}
