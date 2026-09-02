/**
 * ÉQUIPE 9 (Audio & Sonneries) — service de sonnerie d'appel MokNet.
 *
 * Tout est synthétisé en WebAudio à partir du catalogue déclaratif
 * `services/calls/ringtones.ts` : aucun fichier audio, aucun réseau.
 *
 * ── API consommée par le flux d'appel ENTRANT ─────────────────────────────
 *   startRinging(ringtoneId?)  → à la réception d'un appel. Sans argument,
 *                                joue la sonnerie choisie par l'utilisateur
 *                                (cache local `lmav_ringtone_v1`, alimenté
 *                                par les Paramètres ; le flux d'appel peut
 *                                aussi passer explicitement
 *                                `profile.privacySettings.ringtoneId`).
 *                                Gère AUSSI la vibration (motif doux répété
 *                                [300,150,300,800]) : un seul événement, le
 *                                service coordonne les deux.
 *   stopRinging()              → sur acceptation / refus / raccrochage /
 *                                expiration. Arrêt IMMÉDIAT : oscillateurs
 *                                stoppés, vibrate(0), timers effacés.
 *
 * ── API consommée par le flux d'appel SORTANT ─────────────────────────────
 *   startRingback()            → à l'émission de l'appel : tonalité de
 *                                retour discrète côté appelant (« tuuut…
 *                                tuuut » : sinus 440+480 Hz, 1 s de son /
 *                                3 s de silence, gain faible ~0.12) —
 *                                clairement distincte de la sonnerie
 *                                entrante, sans vibration.
 *   stopRingback()             → sur acceptation / refus / raccrochage /
 *                                expiration de l'appel sortant.
 *
 * ── Arrêt total (mission VF-2) ────────────────────────────────────────────
 *   stopAll()                  → stopRinging + stopRingback + stopPreview en
 *                                un seul appel idempotent, à poser sur CHAQUE
 *                                sortie de la phase sonore (voir plus bas).
 *
 * Garanties communes :
 *  - idempotence : deux `start…` successifs ne superposent JAMAIS deux
 *    boucles (arrêt implicite de la précédente sur le même canal) ;
 *  - arrêt de sécurité automatique après 45 s de boucle continue
 *    (RINGING_TIMEOUT_MS) — jamais une sonnerie qui continue toute seule ;
 *  - politique autoplay : l'AudioContext est créé au premier usage et
 *    `resume()` est tenté s'il est suspendu. `start…` renvoie
 *    Promise<boolean> : `true` = audible, `false` = pas d'audio possible
 *    (la vibration, elle, démarre quand même pour l'appel entrant). Les
 *    appelants peuvent ignorer la promesse (fire-and-forget) : vibration et
 *    timeout de sécurité sont armés de façon synchrone.
 *
 * ── Aperçu (Paramètres → Sonnerie d'appel) ────────────────────────────────
 *   previewRingtone(id)        → joue UNE itération puis s'arrête seule
 *                                (la promesse se résout à la fin).
 *   stopPreview()              → interrompt l'aperçu en cours (résout la
 *                                promesse d'aperçu).
 *
 * ── Choix de l'utilisateur ────────────────────────────────────────────────
 *   getRingtones()             → catalogue complet (5 sonneries).
 *   getSelectedRingtoneId()    → id choisi (cache localStorage, repli sur
 *                                DEFAULT_RINGTONE_ID).
 *   setSelectedRingtoneId(id)  → écrit le cache local. La VRAIE persistance
 *                                profil (profiles.privacy_settings.ringtoneId)
 *                                est faite par UnifiedSettingsModal via
 *                                onUpdateProfile — pas par ce service.
 */

import {
    DEFAULT_RINGTONE_ID,
    getRingtone,
    RINGTONES,
    type RingtoneSpec,
} from './ringtones';

export { DEFAULT_RINGTONE_ID, type RingtoneSpec } from './ringtones';

/** Clé du cache local de la sonnerie choisie. */
export const RINGTONE_STORAGE_KEY = 'lmav_ringtone_v1';

/** Arrêt de sécurité : aucune boucle ne dépasse 45 s. */
export const RINGING_TIMEOUT_MS = 45_000;

/** Gain de sortie des sonneries (entrante + aperçu) — volume normalisé. */
export const MASTER_GAIN = 0.25;

/** Gain de sortie de la tonalité de retour d'appel (discrète). */
export const RINGBACK_GAIN = 0.12;

/** Motif de vibration doux, répété tant que ça sonne. */
export const VIBRATION_PATTERN: number[] = [300, 150, 300, 800];
const VIBRATION_PERIOD_MS = VIBRATION_PATTERN.reduce((a, b) => a + b, 0);

/**
 * Tonalité de retour d'appel (côté appelant). Volontairement HORS du
 * catalogue utilisateur : ce n'est pas un choix, c'est la convention
 * téléphonique (deux sinusoïdes 440 + 480 Hz simultanées dont le battement
 * fait le « tuuut »), 1 s de son / 3 s de silence.
 */
const RINGBACK_SPEC: RingtoneSpec = {
    id: '__ringback__',
    name: 'Retour d’appel',
    description: 'Tonalité entendue par l’appelant pendant que ça sonne en face.',
    waveform: 'sine',
    attack: 0.04,
    release: 0.1,
    harmonic: 0,
    loopDuration: 4.0,
    notes: [
        { time: 0, freq: 440, duration: 1.0, velocity: 1 },
        { time: 0, freq: 480, duration: 1.0, velocity: 1 },
    ],
};

/* ────────────────────────────── État module ────────────────────────────── */

interface LoopHandle {
    stopped: boolean;
    oscillators: OscillatorNode[];
    /** Nœuds du bus de sortie (gain, écho…) à déconnecter à l'arrêt. */
    busNodes: AudioNode[];
    loopInterval: number | null;
    safetyTimeout: number | null;
}

interface PreviewHandle {
    stopped: boolean;
    oscillators: OscillatorNode[];
    busNodes: AudioNode[];
    endTimer: number | null;
    resolve: () => void;
}

let audioCtx: AudioContext | null = null;
/**
 * AU-11 : un contexte audio a-t-il RÉELLEMENT démarré au moins une fois ?
 * Ce n'est pas une supposition : le drapeau est posé par `ensureAudioContext`
 * uniquement quand l'état du contexte est `running`.
 */
let audioUnlocked = false;
/** Écouteurs de déverrouillage installés (un seul jeu par page). */
let primingTeardown: (() => void) | null = null;
const channels: { ring: LoopHandle | null; ringback: LoopHandle | null } = {
    ring: null,
    ringback: null,
};
let currentPreview: PreviewHandle | null = null;
let vibrationInterval: number | null = null;

/* ─────────────────────────── AudioContext & bus ────────────────────────── */

/**
 * Crée (au premier usage) puis réveille l'AudioContext. Renvoie `null` si
 * l'audio est impossible ici (API absente, `resume()` refusé par la
 * politique autoplay…) — l'appelant sait alors qu'il n'y aura pas de son.
 */
async function ensureAudioContext(): Promise<AudioContext | null> {
    if (audioCtx && audioCtx.state === 'closed') audioCtx = null;
    if (!audioCtx) {
        const Ctor: typeof AudioContext | undefined =
            typeof window !== 'undefined'
                ? window.AudioContext || (window as any).webkitAudioContext
                : undefined;
        if (!Ctor) return null;
        try {
            audioCtx = new Ctor();
        } catch {
            return null;
        }
    }
    if (audioCtx.state === 'suspended') {
        try {
            await audioCtx.resume();
        } catch {
            return null;
        }
    }
    if (audioCtx.state !== 'running') return null;
    audioUnlocked = true;
    return audioCtx;
}

/**
 * AU-11 — le son est-il réellement possible sur cet appareil, MAINTENANT ?
 * Répond sur un fait observé (un contexte audio a démarré), jamais sur une
 * hypothèse. Sert à dire honnêtement « la sonnerie ne pourra pas retentir »
 * plutôt que de laisser un silence inexpliqué.
 */
export function isRingtoneAudioUnlocked(): boolean {
    return audioUnlocked;
}

/**
 * AU-11 — déverrouille l'audio au PREMIER geste réel de l'utilisateur.
 *
 * Pourquoi c'est nécessaire : sur téléphone, un navigateur refuse de démarrer
 * l'audio tant que la personne n'a rien touché. Un appel qui arrive sur une
 * page ouverte mais jamais touchée depuis son chargement ne peut donc
 * PHYSIQUEMENT produire aucun son — `resume()` est refusé à ce moment-là,
 * puisqu'il n'y a pas de geste. C'est très exactement « parfois la sonnerie
 * ne sort pas, il n'y a même pas de vibration ».
 *
 * On ne peut pas déverrouiller à la place de l'utilisateur ; on peut en
 * revanche saisir le premier geste qu'il fait de toute façon (ouvrir un
 * écran, faire défiler, taper) pour démarrer le contexte à ce moment-là. Il
 * reste alors prêt quand l'appel arrive, sans rien demander à personne et
 * sans qu'aucun son ne soit joué ici.
 *
 * Idempotent, sans effet en dehors d'un navigateur. Renvoie la fonction de
 * retrait des écouteurs.
 */
export function primeRingtoneAudio(): () => void {
    if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') return () => {};
    if (audioUnlocked) return () => {};
    if (primingTeardown) return primingTeardown;

    const events: Array<keyof WindowEventMap> = ['pointerdown', 'touchend', 'keydown'];
    const onGesture = () => {
        void ensureAudioContext().then((ctx) => {
            // Tant que le contexte n'a pas démarré, on garde l'écoute : un
            // premier geste peut échouer (page encore en arrière-plan), le
            // suivant réussira. Aucune boucle : on retire dès que c'est fait.
            if (ctx) teardown();
        });
    };
    const teardown = () => {
        if (primingTeardown !== teardown) return;
        primingTeardown = null;
        for (const type of events) {
            try { window.removeEventListener(type, onGesture, true); } catch { /* déjà retiré */ }
        }
    };
    primingTeardown = teardown;
    for (const type of events) {
        try {
            window.addEventListener(type, onGesture, { capture: true, passive: true });
        } catch {
            // Navigateur sans options d'écouteur : repli sur la forme simple.
            try { window.addEventListener(type, onGesture, true); } catch { /* écoute impossible */ }
        }
    }
    return teardown;
}

/**
 * Construit le bus de sortie d'une lecture : GainNode de niveau `level`
 * relié à la destination, plus l'écho léger éventuel (delay + retour borné).
 * Renvoie le nœud d'entrée où brancher les notes et la liste des nœuds à
 * déconnecter à l'arrêt.
 */
function buildBus(
    ctx: AudioContext,
    level: number,
    echo: RingtoneSpec['echo'],
): { input: GainNode; nodes: AudioNode[] } {
    const out = ctx.createGain();
    out.gain.value = level;
    out.connect(ctx.destination);

    const input = ctx.createGain();
    input.gain.value = 1;
    input.connect(out);

    const nodes: AudioNode[] = [input, out];
    if (echo) {
        const delay = ctx.createDelay(1.0);
        delay.delayTime.value = echo.delay;
        const feedback = ctx.createGain();
        // Retour borné (< 0.35 dans le catalogue) : l'écho décroît toujours.
        feedback.gain.value = Math.min(echo.gain, 0.35);
        input.connect(delay);
        delay.connect(feedback);
        feedback.connect(out);
        feedback.connect(delay);
        nodes.push(delay, feedback);
    }
    return { input, nodes };
}

/**
 * Programme UNE itération du motif à partir de `when` (horloge audio) :
 * pour chaque note, oscillateur principal + harmonique d'octave éventuelle,
 * enveloppe attack/hold/release, arrêt auto-programmé.
 */
function scheduleIteration(
    ctx: AudioContext,
    input: AudioNode,
    spec: RingtoneSpec,
    when: number,
    sink: OscillatorNode[],
): void {
    for (const note of spec.notes) {
        const t0 = when + note.time;
        const velocity = note.velocity ?? 1;
        const tHoldEnd = t0 + spec.attack + note.duration;
        const tEnd = tHoldEnd + spec.release;

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(0, t0);
        noteGain.gain.linearRampToValueAtTime(velocity, t0 + spec.attack);
        noteGain.gain.setValueAtTime(velocity, tHoldEnd);
        noteGain.gain.linearRampToValueAtTime(0, tEnd);
        noteGain.connect(input);

        const osc = ctx.createOscillator();
        osc.type = spec.waveform;
        osc.frequency.setValueAtTime(note.freq, t0);
        if (note.glideTo !== undefined) {
            osc.frequency.linearRampToValueAtTime(note.glideTo, tHoldEnd);
        }
        osc.connect(noteGain);
        osc.start(t0);
        osc.stop(tEnd + 0.05);
        sink.push(osc);

        if (spec.harmonic > 0) {
            const harmGain = ctx.createGain();
            harmGain.gain.value = spec.harmonic;
            harmGain.connect(noteGain);
            const harm = ctx.createOscillator();
            harm.type = 'sine';
            harm.frequency.setValueAtTime(note.freq * 2, t0);
            harm.connect(harmGain);
            harm.start(t0);
            harm.stop(tEnd + 0.05);
            sink.push(harm);
        }
    }
}

/** Arrêt immédiat et silencieux d'un lot d'oscillateurs. */
function killOscillators(oscillators: OscillatorNode[]): void {
    for (const osc of oscillators) {
        try {
            osc.stop();
        } catch {
            /* déjà stoppé — sans importance */
        }
        try {
            osc.disconnect();
        } catch {
            /* idem */
        }
    }
    oscillators.length = 0;
}

function disconnectNodes(nodes: AudioNode[]): void {
    for (const node of nodes) {
        try {
            node.disconnect();
        } catch {
            /* déjà déconnecté */
        }
    }
    nodes.length = 0;
}

/* ─────────────────────────────── Vibration ─────────────────────────────── */

function canVibrate(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
}

function startVibration(): void {
    if (!canVibrate()) return;
    try {
        navigator.vibrate(VIBRATION_PATTERN);
    } catch {
        return;
    }
    vibrationInterval = window.setInterval(() => {
        try {
            navigator.vibrate(VIBRATION_PATTERN);
        } catch {
            /* la vibration n'est jamais bloquante */
        }
    }, VIBRATION_PERIOD_MS);
}

function stopVibration(): void {
    if (vibrationInterval !== null) {
        window.clearInterval(vibrationInterval);
        vibrationInterval = null;
    }
    if (canVibrate()) {
        try {
            navigator.vibrate(0);
        } catch {
            /* rien à faire */
        }
    }
}

/* ─────────────────────────── Boucles (canaux) ──────────────────────────── */

type ChannelName = keyof typeof channels;

function stopChannel(name: ChannelName): void {
    const handle = channels[name];
    channels[name] = null;
    if (!handle) return;
    handle.stopped = true;
    if (handle.safetyTimeout !== null) window.clearTimeout(handle.safetyTimeout);
    handle.safetyTimeout = null;
    if (handle.loopInterval !== null) window.clearInterval(handle.loopInterval);
    handle.loopInterval = null;
    killOscillators(handle.oscillators);
    disconnectNodes(handle.busNodes);
}

/**
 * Démarre une boucle sur un canal : arrêt implicite de la précédente
 * (idempotence), timeout de sécurité armé de façon SYNCHRONE, puis audio si
 * possible. Renvoie `true` seulement si la boucle est réellement audible.
 */
async function startChannel(
    name: ChannelName,
    spec: RingtoneSpec,
    level: number,
    onSafetyStop: () => void,
): Promise<boolean> {
    stopChannel(name);
    const handle: LoopHandle = {
        stopped: false,
        oscillators: [],
        busNodes: [],
        loopInterval: null,
        safetyTimeout: null,
    };
    channels[name] = handle;
    handle.safetyTimeout = window.setTimeout(() => {
        if (channels[name] === handle) onSafetyStop();
    }, RINGING_TIMEOUT_MS);

    const ctx = await ensureAudioContext();
    if (handle.stopped || channels[name] !== handle) return false;
    if (!ctx) return false;

    const bus = buildBus(ctx, level, spec.echo);
    handle.busNodes = bus.nodes;

    let nextTime = ctx.currentTime + 0.05;
    const scheduleNext = () => {
        scheduleIteration(ctx, bus.input, spec, nextTime, handle.oscillators);
        nextTime += spec.loopDuration;
    };
    scheduleNext();
    handle.loopInterval = window.setInterval(
        scheduleNext,
        Math.round(spec.loopDuration * 1000),
    );
    return true;
}

/* ──────────────────────────── API appel ENTRANT ────────────────────────── */

/**
 * Fait sonner l'appel entrant : boucle audio + vibration coordonnées.
 * `true` = audible ; `false` = vibration seule (audio impossible ici).
 * Idempotent : un `startRinging` en cours est d'abord arrêté proprement.
 */
export async function startRinging(ringtoneId?: string): Promise<boolean> {
    stopPreview();
    stopVibration();
    const spec =
        getRingtone(ringtoneId ?? getSelectedRingtoneId()) ??
        getRingtone(DEFAULT_RINGTONE_ID)!;
    startVibration();
    return startChannel('ring', spec, MASTER_GAIN, stopRinging);
}

/**
 * Arrêt IMMÉDIAT de la sonnerie entrante : oscillateurs stoppés,
 * vibrate(0), intervalles et timeout de sécurité effacés.
 */
export function stopRinging(): void {
    stopVibration();
    stopChannel('ring');
}

/** La sonnerie entrante est-elle en cours (audio ou vibration seule) ? */
export function isRinging(): boolean {
    return channels.ring !== null;
}

/* ──────────────────────────── API appel SORTANT ────────────────────────── */

/**
 * Tonalité de retour d'appel côté appelant (« tuuut… tuuut », discrète,
 * sans vibration). `true` = audible. Idempotent sur son canal ; n'interfère
 * pas avec la sonnerie entrante.
 */
export async function startRingback(): Promise<boolean> {
    stopPreview();
    return startChannel('ringback', RINGBACK_SPEC, RINGBACK_GAIN, stopRingback);
}

/** Arrêt IMMÉDIAT de la tonalité de retour d'appel. */
export function stopRingback(): void {
    stopChannel('ringback');
}

/** La tonalité de retour d'appel est-elle en cours ? */
export function isRingbackActive(): boolean {
    return channels.ringback !== null;
}

/* ─────────────────────────── Arrêt total (VF-2) ────────────────────────── */

/**
 * Mission VF-2 (« sonnerie qui s'arrête net ») : arrêt de TOUT ce qui peut
 * sonner — sonnerie entrante (+ vibration), retour d'appel, aperçu. Un seul
 * appel, idempotent, à placer sur CHAQUE sortie de la phase sonore : décroché
 * (AVANT toute activation du micro, sinon il capte la fin de la sonnerie),
 * `call_accepted` reçu, refus, fin, expiration, erreur, prise en charge sur
 * un autre appareil, première voix distante, démontage de l'écran d'appel.
 * L'audit VF-0 a montré qu'à arrêter les canaux un par un, il y avait
 * toujours un chemin oublié — et une sonnerie qui continuait sous la voix.
 */
export function stopAll(): void {
    stopRinging();
    stopRingback();
    stopPreview();
}

/* ─────────────────────────────── Aperçu ────────────────────────────────── */

/**
 * Joue UNE itération de la sonnerie `id` puis s'arrête seule. La promesse
 * se résout à la fin de l'itération — ou immédiatement si l'audio est
 * impossible, si l'id est inconnu, ou si `stopPreview()` interrompt.
 * Un seul aperçu à la fois (le précédent est arrêté).
 */
export async function previewRingtone(id: string): Promise<void> {
    stopPreview();
    const spec = getRingtone(id);
    if (!spec) return;

    let resolveDone: () => void = () => {};
    const done = new Promise<void>((resolve) => {
        resolveDone = resolve;
    });
    const handle: PreviewHandle = {
        stopped: false,
        oscillators: [],
        busNodes: [],
        endTimer: null,
        resolve: resolveDone,
    };
    currentPreview = handle;

    const ctx = await ensureAudioContext();
    if (handle.stopped) return done;
    if (!ctx) {
        finishPreview(handle);
        return done;
    }

    const bus = buildBus(ctx, MASTER_GAIN, spec.echo);
    handle.busNodes = bus.nodes;
    scheduleIteration(ctx, bus.input, spec, ctx.currentTime + 0.05, handle.oscillators);
    handle.endTimer = window.setTimeout(
        () => finishPreview(handle),
        Math.round(spec.loopDuration * 1000),
    );
    return done;
}

/** Interrompt l'aperçu en cours (sa promesse se résout aussitôt). */
export function stopPreview(): void {
    if (currentPreview) finishPreview(currentPreview);
}

function finishPreview(handle: PreviewHandle): void {
    if (handle.stopped) return;
    handle.stopped = true;
    if (handle.endTimer !== null) window.clearTimeout(handle.endTimer);
    handle.endTimer = null;
    killOscillators(handle.oscillators);
    disconnectNodes(handle.busNodes);
    if (currentPreview === handle) currentPreview = null;
    handle.resolve();
}

/* ─────────────────────────── Choix utilisateur ─────────────────────────── */

/** Catalogue complet, dans l'ordre d'affichage. */
export function getRingtones(): RingtoneSpec[] {
    return [...RINGTONES];
}

/**
 * Id de la sonnerie choisie sur CET appareil (cache localStorage). Repli
 * systématique sur la Signature MokNet si rien n'est stocké ou si la valeur
 * ne correspond plus à aucune sonnerie du catalogue.
 */
export function getSelectedRingtoneId(): string {
    try {
        const stored = window.localStorage.getItem(RINGTONE_STORAGE_KEY);
        if (stored && getRingtone(stored)) return stored;
    } catch {
        /* localStorage indisponible → défaut */
    }
    return DEFAULT_RINGTONE_ID;
}

/**
 * Écrit le cache local (id inconnu → défaut). La persistance profil, elle,
 * passe par onUpdateProfile (voir UnifiedSettingsModal).
 */
export function setSelectedRingtoneId(id: string): void {
    const valid = getRingtone(id) ? id : DEFAULT_RINGTONE_ID;
    try {
        window.localStorage.setItem(RINGTONE_STORAGE_KEY, valid);
    } catch {
        /* cache impossible — le choix profil reste la source de vérité */
    }
}

/* ────────────────────────────── Tests only ─────────────────────────────── */

/** Réinitialisation complète de l'état module — réservé aux tests. */
export function __resetRingtoneServiceForTests(): void {
    stopAll();
    if (audioCtx) {
        try {
            void audioCtx.close();
        } catch {
            /* certains mocks n'implémentent pas close() */
        }
    }
    audioCtx = null;
    primingTeardown?.();
    primingTeardown = null;
    audioUnlocked = false;
}
