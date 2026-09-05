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

export interface ArchitecteSequence {
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
    provider: 'heygen';
    model: {
        portraitUrl: string;
        voice: string;
        settings: { aspectRatio: '1:1'; resolution: '720p'; expressiveness: 'low' | 'medium' | 'high'; fit: 'contain' };
    };
    generatedAt: string;
    validatedBy: string;
    validatedAt: string;
}

export const ARCHITECTE_PRESENTATION_TEXT =
    'Bonjour, je suis l’avatar de Vision Smart. Je suis ici pour accompagner, expliquer et guider les utilisateurs avec une voix claire, naturelle et professionnelle.';

/**
 * LA séquence validée. Les empreintes protègent le modèle : un fichier
 * remplacé sans passer par ce registre fait échouer la suite de tests.
 */
export const ARCHITECTE_PRESENTATION: ArchitecteSequence = {
    key: 'presentation',
    title: 'Présentation de l’Architecte',
    text: ARCHITECTE_PRESENTATION_TEXT,
    // Découpage aux pauses de ponctuation mesurées sur la voix HD (alignement
    // phonétique du 05/09 : « Smart. » 1 830–2 090 ms, « claire, » 6 140–6 500 ms).
    cues: [
        { startMs: 0, endMs: 1900, text: 'Bonjour, je suis l’avatar de Vision Smart.' },
        { startMs: 2050, endMs: 6200, text: 'Je suis ici pour accompagner, expliquer et guider les utilisateurs' },
        { startMs: 6450, endMs: 8190, text: 'avec une voix claire, naturelle et professionnelle.' },
    ],
    posterUrl: '/architecte/vision-smart-heygen.webp',
    captionsUrl: '/architecte/vision-smart-heygen.fr.vtt',
    durationMs: 8190,
    sources: [
        {
            url: '/architecte/vision-smart-heygen.mp4',
            type: 'video/mp4',
            sha256: 'a000fde4ab829d50ec4a4319e902bc61a09d3a163207ec5cd1932a9dad361f94',
            sizeBytes: 2457265,
        },
        {
            url: '/architecte/vision-smart-heygen.webm',
            type: 'video/webm',
            sha256: '4ce2750470330a931c3c45a7aaf72f7681145989ace980c79441544f5ed3b4ca',
            sizeBytes: 975088,
        },
    ],
    provider: 'heygen',
    model: {
        portraitUrl: '/architecte/architecte.webp',
        voice: 'ElevenLabs « Claire » (voix HD de la passerelle, enregistrée le 04/09/2026)',
        settings: { aspectRatio: '1:1', resolution: '720p', expressiveness: 'medium', fit: 'contain' },
    },
    generatedAt: '2026-09-05T09:47:49Z',
    validatedBy: 'Direction Vision Smart',
    validatedAt: '2026-09-05',
};

export const ARCHITECTE_SEQUENCES: readonly ArchitecteSequence[] = [ARCHITECTE_PRESENTATION];

export function findArchitecteSequence(key: string): ArchitecteSequence | null {
    return ARCHITECTE_SEQUENCES.find((s) => s.key === key) ?? null;
}

/** Libellé humain d'une durée de séquence : « 8,2 s ». */
export function formatSequenceDuration(durationMs: number): string {
    return `${(Math.max(0, durationMs) / 1000).toFixed(1).replace('.', ',')} s`;
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
    stop(): void;
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

    const stop = () => {
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
                if (isMine() && state.status === 'playing') stop();
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
            emit({ key, slot: target.slot, status: 'loading', error: null });
            try {
                target.video.currentTime = 0;
                const result = target.video.play();
                if (result && typeof (result as Promise<void>).then === 'function') {
                    (result as Promise<void>).catch(() => {
                        if (current && current.id === target.id) transition('error', 'Lecture refusée par le navigateur : touchez l’avatar pour réessayer.');
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
