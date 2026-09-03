/**
 * AU-7 — RAPPORT DE DIAGNOSTIC D'APPEL, envoyé automatiquement au serveur.
 *
 * Constat : sur deux vrais téléphones, un iPhone recevait la ligne mais ne
 * publiait jamais son micro (« Micro non publié », « Reconnexion… », puis
 * « UnexpectedConnectionState: pcManager is not ready ») et l'appel tombait
 * à la minute. Depuis le bac à sable, aucun trafic média n'est reproductible,
 * et l'utilisateur ne peut pas lire une console sur son téléphone. Ce module
 * fait donc ce qu'un ingénieur ferait à côté de lui : il note, dans l'ordre et
 * avec l'heure, tout ce que le transport et l'écran d'appel voient — états de
 * connexion, raisons de reconnexion et de déconnexion données par le SDK,
 * publications/souscriptions de pistes, erreurs de capture, chemin réseau
 * réellement négocié (type de candidat ICE, protocole), verdicts audio
 * périodiques — puis dépose ce journal dans `public.call_diagnostics`
 * (une ligne par appel, par compte, par appareil ; lecture réservée au
 * propriétaire et aux administrateurs).
 *
 * Règles :
 *  - jamais de contenu audio, jamais de jeton (les URL sont épurées), jamais
 *    d'adresse IP locale (seul le TYPE de candidat local est conservé) ;
 *  - taille bornée (nombre d'événements et octets) — le dernier mot compte
 *    plus que le premier : les plus anciens sont écartés d'abord ;
 *  - ne lève jamais : un échec d'envoi ne doit pas toucher l'appel.
 */

import { isSupabaseConfigured, supabase } from '../supabaseClient';

export type CallDiagnosticKind =
    | 'call'      // écran d'appel (statut, décroché, fin)
    | 'captions'  // Mission VT : sous-titres/interprète (transcription serveur en difficulté, rétablie, indisponible)
    | 'voice'     // Mission VT : voix de l'interprète (générée, publiée dans l'appel, reçue, en échec → repli) — jamais le texte dit
    | 'transport' // hook de transport (état, relances)
    | 'sdk'       // journal interne du SDK de transport
    | 'media'     // publication/souscription/capture
    | 'network'   // chemin ICE négocié
    | 'audio'     // verdicts de la liaison audio
    | 'error';

export interface CallDiagnosticEvent {
    /** Millisecondes depuis le début du rapport. */
    t: number;
    k: CallDiagnosticKind;
    m: string;
    d?: unknown;
}

export interface CallDiagnosticDevice {
    ua: string;
    platform: string;
    standalone: boolean;
    language: string;
    online: boolean;
    connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number };
    screen?: { w: number; h: number; dpr: number };
    visibility?: string;
}

export interface CallDiagnosticSession {
    callId: string;
    conversationId: string | null;
    role: 'appelant' | 'appelé';
    deviceId: string;
    startedAt: number;
}

export const CALL_DIAGNOSTICS_MAX_EVENTS = 400;
export const CALL_DIAGNOSTICS_MAX_BYTES = 60_000;
const FLUSH_INTERVAL_MS = 15_000;
const TOKEN_PATTERNS = [/access_token=[^&\s"']+/gi, /Bearer\s+[A-Za-z0-9._-]+/g, /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/g];

let session: CallDiagnosticSession | null = null;
let events: CallDiagnosticEvent[] = [];
let outcome: string | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let rowId: string | null = null;
let flushing: Promise<void> | null = null;
let dirty = false;

/** Épure jetons/URLs signées d'un texte libre (journal SDK compris). */
export function scrubDiagnosticText(text: string): string {
    let out = text;
    for (const re of TOKEN_PATTERNS) out = out.replace(re, '[jeton masqué]');
    return out;
}

function safeJson(value: unknown, depth = 0): unknown {
    if (value === null || value === undefined) return value;
    if (typeof value === 'string') return scrubDiagnosticText(value).slice(0, 600);
    if (typeof value === 'number' || typeof value === 'boolean') return value;
    if (typeof value === 'bigint') return Number(value);
    if (value instanceof Error) return { name: value.name, message: scrubDiagnosticText(value.message).slice(0, 300) };
    if (depth >= 3) return String(value).slice(0, 120);
    if (Array.isArray(value)) return value.slice(0, 20).map((v) => safeJson(v, depth + 1));
    if (typeof value === 'object') {
        const out: Record<string, unknown> = {};
        let n = 0;
        for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
            if (n++ >= 25) break;
            if (typeof v === 'function') continue;
            out[key] = safeJson(v, depth + 1);
        }
        return out;
    }
    return String(value).slice(0, 120);
}

function bytesOf(list: CallDiagnosticEvent[]): number {
    try { return JSON.stringify(list).length; } catch { return Number.MAX_SAFE_INTEGER; }
}

/** Borne le journal : nombre d'événements puis octets, en écartant les plus ANCIENS. */
export function trimDiagnosticEvents(list: CallDiagnosticEvent[], maxEvents = CALL_DIAGNOSTICS_MAX_EVENTS, maxBytes = CALL_DIAGNOSTICS_MAX_BYTES): CallDiagnosticEvent[] {
    let out = list.length > maxEvents ? list.slice(list.length - maxEvents) : list.slice();
    let guard = 0;
    while (out.length > 1 && bytesOf(out) > maxBytes && guard++ < 10_000) out = out.slice(Math.max(1, Math.floor(out.length / 10)));
    return out;
}

/** Photographie de l'appareil (aucune donnée personnelle : modèle/navigateur/réseau/écran). */
export function snapshotDevice(): CallDiagnosticDevice {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    const conn = (nav as unknown as { connection?: { type?: string; effectiveType?: string; downlink?: number; rtt?: number } } | undefined)?.connection;
    const standalone = typeof window !== 'undefined'
        ? (window.matchMedia?.('(display-mode: standalone)')?.matches || !!(nav as unknown as { standalone?: boolean } | undefined)?.standalone)
        : false;
    return {
        ua: nav?.userAgent ?? '',
        platform: nav?.platform ?? '',
        standalone,
        language: nav?.language ?? '',
        online: nav?.onLine ?? true,
        connection: conn ? { type: conn.type, effectiveType: conn.effectiveType, downlink: conn.downlink, rtt: conn.rtt } : undefined,
        screen: typeof window !== 'undefined' ? { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio } : undefined,
        visibility: typeof document !== 'undefined' ? document.visibilityState : undefined,
    };
}

/** Démarre un rapport pour cet appel (un seul à la fois ; un nouveau remplace l'ancien après l'avoir envoyé). */
export function startCallDiagnostics(next: Omit<CallDiagnosticSession, 'startedAt'>): void {
    if (session && session.callId === next.callId && session.deviceId === next.deviceId) return;
    if (session) void stopCallDiagnostics(outcome ?? 'remplacé');
    session = { ...next, startedAt: Date.now() };
    events = [];
    outcome = null;
    rowId = null;
    dirty = true;
    recordCallEvent('call', 'rapport démarré', { role: next.role, device: snapshotDevice() });
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = setInterval(() => { void flushCallDiagnostics(); }, FLUSH_INTERVAL_MS);
}

export function isCallDiagnosticsActive(): boolean {
    return session !== null;
}

/** Note un événement. Sans rapport actif : ignoré (le LIVE n'en produit pas). */
export function recordCallEvent(kind: CallDiagnosticKind, message: string, data?: unknown): void {
    if (!session) return;
    const event: CallDiagnosticEvent = { t: Date.now() - session.startedAt, k: kind, m: scrubDiagnosticText(String(message)).slice(0, 300) };
    if (data !== undefined) event.d = safeJson(data);
    events.push(event);
    if (events.length > CALL_DIAGNOSTICS_MAX_EVENTS + 50) events = trimDiagnosticEvents(events);
    dirty = true;
}

/** Copie du journal courant (tests, affichage éventuel). */
export function peekCallDiagnostics(): { session: CallDiagnosticSession | null; events: CallDiagnosticEvent[]; outcome: string | null } {
    return { session, events: events.slice(), outcome };
}

/** Photographie SYNCHRONE de ce qui doit partir — un nouveau rapport peut remplacer l'état du module pendant l'envoi. */
interface DiagnosticSnapshot { session: CallDiagnosticSession; events: CallDiagnosticEvent[]; outcome: string; }

async function writeRow(snapshot: DiagnosticSnapshot): Promise<void> {
    if (!isSupabaseConfigured) return;
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id;
    if (!userId) return;
    const payload = {
        user_id: userId,
        call_id: snapshot.session.callId,
        device_id: snapshot.session.deviceId,
        conversation_id: snapshot.session.conversationId,
        role: snapshot.session.role,
        outcome: snapshot.outcome,
        device: snapshotDevice(),
        events: snapshot.events,
        updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
        .from('call_diagnostics')
        .upsert(payload, { onConflict: 'user_id,call_id,device_id' })
        .select('id')
        .maybeSingle();
    if (error) {
        console.warn('[appel] diagnostic non envoyé', error.message);
        return;
    }
    if (data?.id && session && session.callId === snapshot.session.callId) rowId = data.id;
}

function takeSnapshot(final: boolean): DiagnosticSnapshot | null {
    if (!session) return null;
    return { session, events: trimDiagnosticEvents(events), outcome: outcome ?? (final ? 'inconnu' : 'en cours') };
}

/** Envoie l'état courant (idempotent : une ligne par appel/compte/appareil, remplacée à chaque envoi). */
export async function flushCallDiagnostics(final = false): Promise<void> {
    if (!session || (!dirty && !final)) return;
    if (flushing) { await flushing; if (!final) return; }
    const snapshot = takeSnapshot(final);
    if (!snapshot) return;
    dirty = false;
    flushing = writeRow(snapshot).catch((err) => { console.warn('[appel] diagnostic : envoi impossible', err); }).finally(() => { flushing = null; });
    await flushing;
}

/** Termine le rapport avec son issue (« terminé », « correspondant perdu »…), l'envoie une dernière fois. */
export async function stopCallDiagnostics(finalOutcome: string): Promise<void> {
    if (!session) return;
    outcome = finalOutcome;
    recordCallEvent('call', `rapport terminé : ${finalOutcome}`);
    if (flushTimer) { clearInterval(flushTimer); flushTimer = null; }
    // L'état du module est libéré AVANT l'envoi (asynchrone) : un nouvel appel
    // peut démarrer son propre rapport sans que l'envoi de celui-ci ne le lise.
    const snapshot = takeSnapshot(true)!;
    session = null; events = []; outcome = null; rowId = null; dirty = false;
    if (flushing) { try { await flushing; } catch { /* déjà journalisé */ } }
    try { await writeRow(snapshot); } catch (err) { console.warn('[appel] diagnostic : envoi final impossible', err); }
}

/** Identifiant de la ligne serveur (null tant qu'aucun envoi n'a abouti). */
export function callDiagnosticsRowId(): string | null {
    return rowId;
}

/** Réinitialisation complète — tests uniquement. */
export function __resetCallDiagnosticsForTests(): void {
    if (flushTimer) clearInterval(flushTimer);
    flushTimer = null; session = null; events = []; outcome = null; rowId = null; flushing = null; dirty = false;
}
