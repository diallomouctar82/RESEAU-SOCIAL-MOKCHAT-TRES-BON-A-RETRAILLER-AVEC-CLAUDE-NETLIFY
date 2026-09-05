/**
 * SÉQUENCES VIDÉO PRÉ-RENDUES DE L'ARCHITECTE — niveau P3a du playbook 15.
 *
 * Décision de la Direction (05/09/2026) : le modèle validé est la vidéo
 * générée par HeyGen à partir du portrait officiel et de la voix HD (phrase
 * Vision Smart, expressivité moyenne, 720p). Il devient la BASE FERME : on ne
 * change pas de modèle, on n'en crée pas un autre, on l'améliore par AJOUT.
 *
 * Ce module est le registre de ces séquences et le lecteur qui les joue dans
 * le cadre de l'avatar. Il ne dépend d'aucun composant ni d'aucun service
 * réseau : tout ce qui décide est testable sans navigateur. Le rig 2D
 * (`livingAvatar.ts`) n'est pas touché : il reste le repli automatique quand
 * une vidéo ne peut pas être lue, et le seul moteur pour la parole en direct.
 *
 * Aucune génération n'est faite ici : les séquences sont produites par la
 * méthode capitalisée dans Vision Smart AI Core (playbook 16), validées, puis
 * livrées avec l'application comme fichiers statiques.
 */

export interface SequenceSource {
    url: string;
    /** Le MP4 (H.264 + AAC) est universel ; le WebM (VP9 + Opus) sert aux navigateurs sans H.264. */
    type: 'video/mp4' | 'video/webm';
    sha256: string;
    sizeBytes: number;
}

export interface SequenceCue {
    startMs: number;
    endMs: number;
    text: string;
}

/**
 * Calage de la vidéo sur le PORTRAIT du rig. HeyGen re-cadre légèrement le
 * portrait qu'on lui donne : sans calage, le passage du portrait vivant à la
 * vidéo ferait sauter le visage. Mesuré sur les centroïdes des iris (05/09/2026).
 */
export interface SequenceAlignment {
    /** Échelle de la vidéo pour que l'écart de ses pupilles soit celui du portrait. */
    scale: number;
    /** Centre de l'échelle : les pupilles de la vidéo, en % du cadre. */
    originXPercent: number;
    originYPercent: number;
    /** Décalage (en % du cadre) qui pose ce centre sur les pupilles du portrait. */
    dxPercent: number;
    dyPercent: number;
}

/** Le cadre de la SCULPTURE flottante (bouton permanent de l'Architecte). */
export const SCULPTURE_SLOT = 'sculpture';

export interface ArchitecteSequence {
    /**
     * Le portrait dont ce modèle a été généré : la séquence ne se joue que si
     * l'avatar affiche ENCORE ce portrait — sinon la vidéo montrerait un autre
     * visage que la sculpture (photo remplacée depuis le Super-Admin).
     */
    portraitUrl?: string;
    key: string;
    title: string;
    /** Texte réellement prononcé — affiché en sous-titre et fourni en piste de légendes. */
    text: string;
    cues: readonly SequenceCue[];
    posterUrl: string;
    captionsUrl: string;
    durationMs: number;
    /** MP4 en premier : le navigateur prend la première source qu'il sait lire. */
    sources: readonly SequenceSource[];
    /**
     * La même vidéo, EMPILÉE avec son matte de silhouette (couleurs en haut,
     * alpha en bas, relevé image par image) : ce que joue la sculpture détourée.
     * Même son, même durée, mêmes images — seule la transparence est ajoutée.
     */
    cutoutSources: readonly SequenceSource[];
    provider: 'heygen';
    model: {
        portraitUrl: string;
        voice: string;
        settings: { aspectRatio: '1:1'; resolution: '720p'; expressiveness: 'low' | 'medium' | 'high'; fit: 'contain' };
    };
    generatedAt: string;
    validatedBy: string;
    validatedAt: string;
    alignment: SequenceAlignment;
}

export const ARCHITECTE_PRESENTATION_TEXT =
    'Bonjour, je suis l’Architecte de Vision Smart. Je suis ici pour accompagner, expliquer et guider les utilisateurs avec une voix claire, naturelle et professionnelle.';

/**
 * LA séquence validée. Les empreintes protègent le modèle : un fichier
 * remplacé sans passer par ce registre fait échouer la suite de tests.
 */
export const ARCHITECTE_PRESENTATION: ArchitecteSequence = {
    key: 'presentation',
    title: 'Présentation de l’Architecte',
    text: ARCHITECTE_PRESENTATION_TEXT,
    // Découpage sur l'alignement texte ↔ son de l'aligneur du produit
    // (buildVoiceTrack sur la voix livrée, 05/09/2026) : « Smart. » se termine à
    // 2 320 ms, « Je » commence à 2 470 ms ; « utilisateurs » se termine à
    // 6 380 ms ; dernier son à 9 060 ms.
    cues: [
        { startMs: 0, endMs: 2320, text: 'Bonjour, je suis l’Architecte de Vision Smart.' },
        { startMs: 2470, endMs: 6380, text: 'Je suis ici pour accompagner, expliquer et guider les utilisateurs' },
        { startMs: 6380, endMs: 9060, text: 'avec une voix claire, naturelle et professionnelle.' },
    ],
    posterUrl: '/architecte/vision-smart-heygen.webp',
    portraitUrl: '/architecte/architecte.webp',
    captionsUrl: '/architecte/vision-smart-heygen.fr.vtt',
    durationMs: 9082,
    // Bande sombre corrigée (Direction, 05/09/2026) : la photo validée n'a pas de
    // marge au-dessus du crâne, le modèle HeyGen portait donc la bande noire du
    // portrait cadré (89 px sur 720). Sans nouveau crédit, la zone de bande de
    // chacune des 228 images a été recomposée sur le portrait d'usine corrigé
    // (prolongement adouci du fond), à travers la silhouette du détourage ; le
    // reste des pixels HeyGen et le son AAC sont inchangés (H.264 crf 18, VP9).
    sources: [
        {
            url: '/architecte/vision-smart-heygen.mp4',
            type: 'video/mp4',
            sha256: '1f87a5983466bd84eb0a233f464fade3f29f5b26df834eb445be4abe83d900c7',
            sizeBytes: 1400595,
        },
        {
            url: '/architecte/vision-smart-heygen.webm',
            type: 'video/webm',
            sha256: '7358f2e22b343bc53232d4469846c45516cedb6ea94b233539657125b9cab8ac',
            sizeBytes: 561944,
        },
    ],
    // Détourage image par image (05/09/2026, photo validée) : silhouette relevée
    // sur chacune des 228 images par un modèle de segmentation local (rembg,
    // isnet-general-use), empilée sous les couleurs (720 × 1440) ; son AAC copié
    // tel quel du MP4 généré.
    cutoutSources: [
        {
            url: '/architecte/vision-smart-heygen.cutout.mp4',
            type: 'video/mp4',
            sha256: 'cdf49bd063a428b6244f9567450c4dd84839fd3dae34b64d4d8db8d96b1fb959',
            sizeBytes: 1810971,
        },
        {
            url: '/architecte/vision-smart-heygen.cutout.webm',
            type: 'video/webm',
            sha256: '55f330f61733fba2274f080ef56ad47da884a245860f28585c5796338b8dfb99',
            sizeBytes: 599002,
        },
    ],
    provider: 'heygen',
    model: {
        // Le portrait d'usine = la photo validée par la Direction (05/09/2026),
        // cadrée par le moteur de l'option Super-Admin (768 px), le débord du haut
        // comblé par le prolongement adouci du fond (v6.41.2).
        portraitUrl: '/architecte/architecte.webp',
        voice: 'Voix attitrée de l’Architecte — ElevenLabs « George » (eleven_multilingual_v2), la même que la barre flottante, enregistrée le 05/09/2026 sur la phrase officielle',
        settings: { aspectRatio: '1:1', resolution: '720p', expressiveness: 'medium', fit: 'contain' },
    },
    // Généré le 05/09/2026 à 15:20 UTC (HeyGen, 39 s, 4 crédits : 563 → 559) sur
    // instruction de la Direction : « base-toi strictement sur cette photo pour
    // remplacer l'avatar actuel ». Aperçu à confirmer par la Direction sur moknet.net.
    generatedAt: '2026-09-05T15:20:39Z',
    validatedBy: 'Direction Vision Smart',
    validatedAt: '2026-09-05',
    // Mesuré le 05/09/2026 par le moteur de production (Face Landmarker, 478
    // repères, image 1 de la vidéo contre le portrait livré) : pupilles du
    // portrait à (50,12 %, 46,20 %), écart 21,33 % ; celles de la vidéo à
    // (48,86 %, 47,28 %), écart 20,82 %. Appliqué à la couche vidéo de la
    // sculpture seulement — le cadre rond montre la vidéo telle quelle.
    alignment: { scale: 1.0248, originXPercent: 48.86, originYPercent: 47.28, dxPercent: 1.26, dyPercent: -1.08 },
};

export const ARCHITECTE_SEQUENCES: readonly ArchitecteSequence[] = [ARCHITECTE_PRESENTATION];

export function findArchitecteSequence(key: string): ArchitecteSequence | null {
    return ARCHITECTE_SEQUENCES.find((s) => s.key === key) ?? null;
}

/** Libellé humain d'une durée de séquence : « 8,2 s ». */
export function formatSequenceDuration(durationMs: number): string {
    return `${(Math.max(0, durationMs) / 1000).toFixed(1).replace('.', ',')} s`;
}

const MOIS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

/** « 2026-09-05 » → « 5 septembre 2026 » ; toute autre forme est rendue telle quelle. */
export function formatDateFr(isoDate: string): string {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate);
    if (!m) return isoDate;
    const mois = MOIS_FR[Number(m[2]) - 1];
    if (!mois) return isoDate;
    const jour = Number(m[3]);
    return `${jour === 1 ? '1er' : jour} ${mois} ${m[1]}`;
}

/** Réglage d'expressivité HeyGen, dit en français. */
export function formatExpressiveness(level: 'low' | 'medium' | 'high'): string {
    return level === 'low' ? 'faible' : level === 'high' ? 'forte' : 'moyenne';
}

// ─────────────────────────────────────────────────────────────────────────
// LÉGENDES (WebVTT) — générées depuis les mêmes repères que les sous-titres
// ─────────────────────────────────────────────────────────────────────────

function vttTime(ms: number): string {
    const total = Math.max(0, Math.round(ms));
    const h = Math.floor(total / 3_600_000);
    const m = Math.floor((total % 3_600_000) / 60_000);
    const s = Math.floor((total % 60_000) / 1000);
    const r = total % 1000;
    const pad = (n: number, w: number) => String(n).padStart(w, '0');
    return `${pad(h, 2)}:${pad(m, 2)}:${pad(s, 2)}.${pad(r, 3)}`;
}

export function toWebVtt(cues: readonly SequenceCue[]): string {
    const lines = ['WEBVTT', ''];
    cues.forEach((cue, i) => {
        lines.push(String(i + 1), `${vttTime(cue.startMs)} --> ${vttTime(cue.endMs)}`, cue.text, '');
    });
    return lines.join('\n');
}

/** Sous-titre à afficher à un instant donné (ou `null` entre deux légendes). */
export function cueAt(sequence: ArchitecteSequence, tMs: number): SequenceCue | null {
    return sequence.cues.find((c) => tMs >= c.startMs && tMs < c.endMs) ?? null;
}

// ─────────────────────────────────────────────────────────────────────────
// ÉTATS DE LECTURE — une petite machine, testable sans vidéo
// ─────────────────────────────────────────────────────────────────────────

export type SequenceStatus = 'idle' | 'loading' | 'playing' | 'ended' | 'failed';
export type SequenceEvent = 'request' | 'playing' | 'ended' | 'error' | 'stop';

export function nextSequenceStatus(status: SequenceStatus, event: SequenceEvent): SequenceStatus {
    switch (event) {
        case 'request':
            return 'loading';
        case 'playing':
            return status === 'loading' || status === 'playing' ? 'playing' : status;
        case 'ended':
            return status === 'loading' || status === 'playing' ? 'ended' : status;
        case 'error':
            return 'failed';
        case 'stop':
            return 'idle';
        default:
            return status;
    }
}

export interface SequencePlayerState {
    key: string | null;
    /** Emplacement (avatar) qui joue réellement : chaque cadre ne montre la vidéo que si c'est le sien. */
    slot: string | null;
    status: SequenceStatus;
    error: string | null;
}

export const SEQUENCE_IDLE_STATE: SequencePlayerState = { key: null, slot: null, status: 'idle', error: null };

/** Le temps pendant lequel la dernière image reste avant de rendre la main au rig. */
export const SEQUENCE_ENDED_HOLD_MS = 400;

/** Le strict nécessaire d'un `<video>` — un faux objet suffit pour tester le lecteur. */
export interface SequenceVideoLike {
    play(): Promise<void> | void;
    pause(): void;
    currentTime: number;
    /** `true` quand le média est arrivé à sa fin (les navigateurs émettent `pause` AVANT `ended`). */
    readonly ended?: boolean;
    addEventListener(type: string, listener: () => void): void;
    removeEventListener(type: string, listener: () => void): void;
}

export interface SequenceAttachment {
    id: number;
    detach(): void;
}

export interface SequencePlayer {
    /** Enregistre un `<video>` pour une séquence, dans un emplacement nommé (« demo », « panel », …). */
    attach(video: SequenceVideoLike, key: string, slot: string): SequenceAttachment;
    /**
     * Demande la lecture — SYNCHRONE : à appeler dans le gestionnaire du clic,
     * sans quoi les navigateurs mobiles refusent le son. `slot` choisit le
     * cadre ; sans `slot`, le dernier cadre attaché pour cette clé.
     * Renvoie `false` si aucune vidéo n'est disponible (le rig reste seul).
     */
    play(key: string, slot?: string): boolean;
    /** Arrête la lecture ; avec `slot`, seulement si c'est ce cadre qui joue. */
    stop(slot?: string): void;
    getState(): SequencePlayerState;
    subscribe(listener: (state: SequencePlayerState) => void): () => void;
}

interface AttachedVideo {
    id: number;
    key: string;
    slot: string;
    video: SequenceVideoLike;
    unbind: () => void;
}

export function createSequencePlayer(): SequencePlayer {
    const attached: AttachedVideo[] = [];
    const listeners = new Set<(state: SequencePlayerState) => void>();
    let state: SequencePlayerState = SEQUENCE_IDLE_STATE;
    let nextId = 1;
    let current: AttachedVideo | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    /**
     * Jeton de la DERNIÈRE demande de lecture. Un second `play()` sur le même
     * cadre (double appui) met la première promesse `play()` en échec
     * (`AbortError`) : ce rejet appartient à une demande dépassée et ne doit
     * jamais faire basculer la lecture en cours en « failed ».
     */
    let playSeq = 0;

    const emit = (next: SequencePlayerState) => {
        state = next;
        listeners.forEach((l) => l(state));
    };
    const clearHold = () => {
        if (holdTimer !== null) {
            clearTimeout(holdTimer);
            holdTimer = null;
        }
    };
    const transition = (event: SequenceEvent, error: string | null = null) => {
        const status = nextSequenceStatus(state.status, event);
        if (status === state.status && event !== 'error') return;
        emit({ ...state, status, error: status === 'failed' ? error : null });
        if (status === 'ended') {
            clearHold();
            holdTimer = setTimeout(() => {
                holdTimer = null;
                if (state.status === 'ended') emit({ ...SEQUENCE_IDLE_STATE });
            }, SEQUENCE_ENDED_HOLD_MS);
        }
    };

    const stop = (slot?: string) => {
        if (slot !== undefined && (!current || current.slot !== slot)) return;
        clearHold();
        if (current) {
            try {
                current.video.pause();
            } catch {
                // un élément déjà retiré du document peut refuser : sans conséquence
            }
        }
        current = null;
        if (state.status !== 'idle') emit({ ...SEQUENCE_IDLE_STATE });
    };

    return {
        attach(video, key, slot) {
            const id = nextId++;
            const isMine = () => current !== null && current.id === id;
            const onPlaying = () => { if (isMine()) transition('playing'); };
            const onEnded = () => { if (isMine()) transition('ended'); };
            const onError = () => { if (isMine()) transition('error', 'La vidéo n’a pas pu être lue sur cet appareil.'); };
            const onPause = () => {
                // Une pause qui n'est ni la fin ni un arrêt demandé (autre lecteur,
                // onglet masqué) rend la main au rig plutôt que de figer l'image.
                // À la fin naturelle, les navigateurs émettent `pause` PUIS `ended`
                // (`video.ended` est déjà vrai) : on laisse alors `onEnded` faire
                // son travail — sinon l'état « ended » n'existerait jamais.
                if (isMine() && state.status === 'playing' && !video.ended) stop();
            };
            video.addEventListener('playing', onPlaying);
            video.addEventListener('ended', onEnded);
            video.addEventListener('error', onError);
            video.addEventListener('pause', onPause);
            const entry: AttachedVideo = {
                id, key, slot, video,
                unbind: () => {
                    video.removeEventListener('playing', onPlaying);
                    video.removeEventListener('ended', onEnded);
                    video.removeEventListener('error', onError);
                    video.removeEventListener('pause', onPause);
                },
            };
            attached.push(entry);
            return {
                id,
                detach: () => {
                    const index = attached.indexOf(entry);
                    if (index >= 0) attached.splice(index, 1);
                    entry.unbind();
                    if (current && current.id === id) stop();
                },
            };
        },
        play(key, slot) {
            const candidates = attached.filter((a) => a.key === key && (slot === undefined || a.slot === slot));
            const target = candidates[candidates.length - 1];
            if (!target) {
                emit({ key, slot: slot ?? null, status: 'failed', error: 'Aucune vidéo disponible pour cette séquence.' });
                return false;
            }
            stop();
            current = target;
            const token = ++playSeq;
            emit({ key, slot: target.slot, status: 'loading', error: null });
            try {
                target.video.currentTime = 0;
                const result = target.video.play();
                if (result && typeof (result as Promise<void>).then === 'function') {
                    (result as Promise<void>).catch((reason: unknown) => {
                        // Demande dépassée par un `play()` plus récent, ou interruption
                        // par notre propre `pause()` : ce n'est pas un refus.
                        if (token !== playSeq) return;
                        const name = typeof reason === 'object' && reason !== null ? (reason as { name?: unknown }).name : undefined;
                        if (name === 'AbortError') return;
                        if (current && current.id === target.id) transition('error', 'Lecture refusée par le navigateur.');
                    });
                }
            } catch {
                transition('error', 'La vidéo n’a pas pu démarrer.');
                return false;
            }
            return true;
        },
        stop,
        getState: () => state,
        subscribe(listener) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
    };
}

/** Le lecteur de l'application : un seul, partagé par tous les cadres de l'avatar. */
export const architecteSequencePlayer: SequencePlayer = createSequencePlayer();

// ─────────────────────────────────────────────────────────────────────────
// PROPOSER LA PRÉSENTATION — jamais un démarrage automatique
// ─────────────────────────────────────────────────────────────────────────

export const PRESENTATION_SEEN_KEY = 'moknet_architecte_presentation_vue';

interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

function defaultStorage(): StorageLike | null {
    try {
        return typeof localStorage !== 'undefined' ? localStorage : null;
    } catch {
        return null;
    }
}

export function hasSeenPresentation(storage: StorageLike | null = defaultStorage()): boolean {
    try {
        return storage?.getItem(PRESENTATION_SEEN_KEY) === '1';
    } catch {
        return false;
    }
}

export function rememberPresentationSeen(storage: StorageLike | null = defaultStorage()): void {
    try {
        storage?.setItem(PRESENTATION_SEEN_KEY, '1');
    } catch {
        // stockage indisponible : on proposera de nouveau, ce n'est pas grave
    }
}

/**
 * Proposer (afficher l'invitation), pas jouer : la vidéo a du son, elle ne
 * démarre que sur un geste de la personne. Le réglage « réduire les
 * animations » n'empêche pas de la proposer : c'est un contenu, pas un décor.
 */
export function shouldOfferPresentation(input: { enabled: boolean; seen: boolean; sequence: ArchitecteSequence | null }): boolean {
    return input.enabled && !input.seen && input.sequence !== null;
}

/** La séquence peut-elle se jouer sur l'avatar qui affiche `photoUrl` ? */
export function sequenceFitsPhoto(sequence: Pick<ArchitecteSequence, 'portraitUrl'>, photoUrl: string): boolean {
    return !sequence.portraitUrl || sequence.portraitUrl === photoUrl;
}
