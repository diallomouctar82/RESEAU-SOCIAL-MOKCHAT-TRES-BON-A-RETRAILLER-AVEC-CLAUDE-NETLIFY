/**
 * Mission VF-1 (appel entrant hors application) — côté application du
 * Web Push d'appel.
 *
 * Constat VF-0 : le signal d'appel est un broadcast Supabase éphémère, donc
 * un correspondant hors de l'application (onglet fermé, écran verrouillé) ne
 * recevait JAMAIS rien ; et `new Notification()` jette sur mobile. Le serveur
 * sait désormais envoyer un Web Push (fonction Edge `push-notify`, déployée
 * et prouvée) ; le service worker (Équipe P) affiche la notification et
 * relaie vers la fenêtre ouverte. Ce module est le pont entre les deux :
 *
 *  - `notifyCallPush()`          → envoi (invitation, annulation, appel
 *                                  manqué) — délai borné, ne lève JAMAIS,
 *                                  journal sans donnée personnelle ;
 *  - `listenPushCallEvents()`    → réception des messages du service worker
 *                                  (`moknet-push`, `moknet-push-action`) ;
 *  - `readPushLaunchParams()`    → lancement de l'application par un clic
 *                                  sur la notification (fenêtre fermée) :
 *                                  lit ET nettoie l'URL ;
 *  - `isFreshCallPayload()`      → un appel poussé n'a de sens que quelques
 *                                  dizaines de secondes.
 *
 * Contrat serveur (push-notify) :
 *   invoke('push-notify', { body: { action:'notify', topic, targetUserId,
 *   conversationId?, callId?, payload:{ callType?, reason? } } })
 *   → { total, sent, failed, results:[…], reason?:'no_subscription' }
 *   Autorisé : vers soi-même (autres appareils, sans conversationId) ou vers
 *   un membre d'une conversation partagée (conversationId requis).
 * Contrat service worker (Équipe P) :
 *   message { type:'moknet-push', payload } (push reçu, fenêtre ouverte) ;
 *   message { type:'moknet-push-action', action:'accept'|'reject'|'open', payload } ;
 *   sinon ouverture de `/?pushAction=…&pushType=…&callId=…&conv=…&from=…&callType=…&ts=…`.
 *   payload = { v:1, type, ts, callId, conversationId, from:{ id, name, avatarUrl }, callType?, reason? }.
 */

import { isSupabaseConfigured, supabase } from '../supabaseClient';

export type CallPushTopic = 'incoming_call' | 'call_cancelled' | 'missed_call' | 'message';
export type CallPushReason = 'answered' | 'cancelled' | 'missed' | 'rejected';
export type PushAction = 'accept' | 'reject' | 'open';

export interface NotifyCallPushParams {
    topic: CallPushTopic;
    targetUserId: string;
    /** Requis pour notifier un AUTRE membre ; absent pour ses propres appareils. */
    conversationId?: string;
    callId?: string;
    payload?: { callType?: 'audio' | 'video'; reason?: CallPushReason };
}

export interface NotifyCallPushResult {
    /** Au moins un appareil a réellement reçu le push. */
    ok: boolean;
    total?: number;
    sent?: number;
    /** 'no_subscription' | 'not_configured' | 'timeout' | 'http_error' | 'all_failed' | 'invalid_response' */
    reason?: string;
    error?: string;
}

/** Charge utile d'un push telle que relayée par le service worker (validée, jamais prise sur parole). */
export interface CallPushPayload {
    v: number;
    type: string;
    ts: number;
    callId: string | null;
    conversationId: string | null;
    from: { id: string; name: string; avatarUrl: string | null } | null;
    callType: 'audio' | 'video' | null;
    reason: string | null;
}

/** Paramètres d'URL posés par le service worker quand aucune fenêtre n'existait. */
export interface PushLaunch {
    action: PushAction;
    type: string;
    callId: string | null;
    conversationId: string | null;
    fromUserId: string | null;
    callType: 'audio' | 'video' | null;
    ts: number | null;
}

/** Délai maximal accordé à l'Edge Function : au-delà, l'appel continue sans elle. */
export const PUSH_INVOKE_TIMEOUT_MS = 6_000;
/** Un push d'appel plus ancien n'est plus un appel : l'appelant a déjà raccroché (expiration 35 s + marge). */
export const CALL_PUSH_FRESHNESS_MS = 40_000;

const PUSH_URL_PARAMS = ['pushAction', 'pushType', 'callId', 'conv', 'from', 'callType', 'ts'] as const;

const asString = (v: unknown, max: number): string | null =>
    typeof v === 'string' && v.length > 0 ? v.slice(0, max) : null;

const asCallType = (v: unknown): 'audio' | 'video' | null => (v === 'audio' || v === 'video' ? v : null);

const asAction = (v: unknown): PushAction | null => (v === 'accept' || v === 'reject' || v === 'open' ? v : null);

/**
 * Valide une charge utile de push. `null` si elle n'a pas la forme du
 * contrat (type ou horodatage manquants) — un message inattendu sur le canal
 * du service worker ne doit jamais déclencher un appel.
 */
export function parsePushPayload(raw: unknown): CallPushPayload | null {
    if (!raw || typeof raw !== 'object') return null;
    const r = raw as Record<string, unknown>;
    const type = asString(r.type, 32);
    const ts = typeof r.ts === 'number' && Number.isFinite(r.ts) ? r.ts : null;
    if (!type || ts === null) return null;
    let from: CallPushPayload['from'] = null;
    if (r.from && typeof r.from === 'object') {
        const f = r.from as Record<string, unknown>;
        const id = asString(f.id, 64);
        if (id) from = { id, name: asString(f.name, 120) ?? '', avatarUrl: asString(f.avatarUrl, 500) };
    }
    return {
        v: typeof r.v === 'number' ? r.v : 1,
        type,
        ts,
        callId: asString(r.callId, 64),
        conversationId: asString(r.conversationId, 64),
        from,
        callType: asCallType(r.callType),
        reason: asString(r.reason, 32),
    };
}

/** Un push d'appel est-il encore d'actualité (≤ 40 s) ? Une horloge légèrement en avance (ts futur) reste fraîche. */
export function isFreshCallPayload(payload: { ts: number } | null | undefined, now: number = Date.now()): boolean {
    if (!payload || typeof payload.ts !== 'number' || !Number.isFinite(payload.ts)) return false;
    return now - payload.ts <= CALL_PUSH_FRESHNESS_MS;
}

/** Lecture de la réponse de push-notify, sans jamais faire confiance à sa forme. */
function resultFromResponse(data: unknown): NotifyCallPushResult {
    if (!data || typeof data !== 'object') return { ok: false, reason: 'invalid_response' };
    const d = data as Record<string, unknown>;
    const total = typeof d.total === 'number' ? d.total : undefined;
    const sent = typeof d.sent === 'number' ? d.sent : undefined;
    if (d.reason === 'no_subscription') return { ok: false, total: total ?? 0, sent: sent ?? 0, reason: 'no_subscription' };
    if (typeof d.error === 'string') return { ok: false, reason: 'http_error', error: d.error };
    if (sent === undefined) return { ok: false, total, reason: 'invalid_response' };
    if (sent > 0) return { ok: true, total, sent };
    return { ok: false, total, sent, reason: 'all_failed' };
}

/**
 * Envoie un push d'appel via l'Edge Function `push-notify`. Ne lève JAMAIS
 * (l'appel lui-même ne dépend pas du push : le broadcast temps réel reste le
 * canal principal) ; borné à 6 s ; journalise un résumé en console.info sans
 * identifiant ni nom (topic, résultat, compteurs).
 */
export async function notifyCallPush(params: NotifyCallPushParams): Promise<NotifyCallPushResult> {
    const summary = (result: NotifyCallPushResult): NotifyCallPushResult => {
        try {
            console.info('[appel] push', { topic: params.topic, ok: result.ok, total: result.total ?? null, sent: result.sent ?? null, reason: result.reason ?? null });
        } catch {
            /* console indisponible — sans importance */
        }
        return result;
    };
    if (!isSupabaseConfigured) return summary({ ok: false, reason: 'not_configured' });
    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const timeout = new Promise<NotifyCallPushResult>((resolve) => {
        timer = setTimeout(() => {
            try { controller?.abort(); } catch { /* déjà terminé */ }
            resolve({ ok: false, reason: 'timeout' });
        }, PUSH_INVOKE_TIMEOUT_MS);
    });
    const request = (async (): Promise<NotifyCallPushResult> => {
        try {
            const { data, error } = await supabase.functions.invoke('push-notify', {
                body: {
                    action: 'notify',
                    topic: params.topic,
                    targetUserId: params.targetUserId,
                    conversationId: params.conversationId,
                    callId: params.callId,
                    payload: params.payload ?? {},
                },
                ...(controller ? { signal: controller.signal } : {}),
            });
            if (error) {
                // FunctionsHttpError porte la réponse ; on tente d'en lire le message serveur (400/403/413/429/503).
                let serverMessage: string | undefined;
                const ctx = (error as { context?: { json?: () => Promise<unknown> } }).context;
                if (ctx && typeof ctx.json === 'function') {
                    try {
                        const body = await ctx.json();
                        if (body && typeof body === 'object' && typeof (body as { error?: unknown }).error === 'string') serverMessage = (body as { error: string }).error;
                    } catch { /* corps illisible — on garde le message générique */ }
                }
                return { ok: false, reason: 'http_error', error: serverMessage ?? (error instanceof Error ? error.message : String(error)) };
            }
            return resultFromResponse(data);
        } catch (err) {
            return { ok: false, reason: 'http_error', error: err instanceof Error ? err.message : String(err) };
        }
    })();
    try {
        return summary(await Promise.race([request, timeout]));
    } finally {
        if (timer !== null) clearTimeout(timer);
    }
}

/**
 * Lit les paramètres de lancement posés par le service worker, puis NETTOIE
 * l'URL (history.replaceState) pour qu'un rechargement ne rejoue jamais
 * l'action. `null` si l'URL n'en porte pas (ou hors navigateur). Les autres
 * paramètres de l'URL sont conservés tels quels.
 */
export function readPushLaunchParams(): PushLaunch | null {
    try {
        if (typeof window === 'undefined' || !window.location) return null;
        const params = new URLSearchParams(window.location.search);
        const action = asAction(params.get('pushAction'));
        if (!action) return null;
        const tsRaw = params.get('ts');
        const ts = tsRaw !== null && tsRaw.trim() !== '' && Number.isFinite(Number(tsRaw)) ? Number(tsRaw) : null;
        const launch: PushLaunch = {
            action,
            type: asString(params.get('pushType'), 32) ?? 'unknown',
            callId: asString(params.get('callId'), 64),
            conversationId: asString(params.get('conv'), 64),
            fromUserId: asString(params.get('from'), 64),
            callType: asCallType(params.get('callType')),
            ts,
        };
        for (const key of PUSH_URL_PARAMS) params.delete(key);
        const rest = params.toString();
        const cleanUrl = window.location.pathname + (rest ? `?${rest}` : '') + window.location.hash;
        try {
            window.history.replaceState(window.history.state, '', cleanUrl);
        } catch {
            /* history indisponible — l'action reste consommée une seule fois par l'appelant */
        }
        return launch;
    } catch {
        return null;
    }
}

/**
 * Écoute les messages du service worker relatifs aux appels. `onIncoming`
 * reçoit toute charge utile VALIDE d'un push arrivé fenêtre ouverte (le
 * consommateur filtre par `payload.type`) ; `onAction` reçoit les clics sur
 * la notification (accepter / refuser / ouvrir). Tout message d'une autre
 * forme est ignoré. Renvoie la fonction de désabonnement ; sans service
 * worker (navigateur ancien, tests), ne fait rien.
 */
export function listenPushCallEvents(handlers: {
    onIncoming: (payload: CallPushPayload) => void;
    onAction: (action: PushAction, payload: CallPushPayload) => void;
}): () => void {
    const sw = typeof navigator !== 'undefined' ? navigator.serviceWorker : undefined;
    if (!sw || typeof sw.addEventListener !== 'function') return () => {};
    const onMessage = (event: MessageEvent) => {
        try {
            const data = event.data;
            if (!data || typeof data !== 'object') return;
            const d = data as Record<string, unknown>;
            if (d.type === 'moknet-push') {
                const payload = parsePushPayload(d.payload);
                if (payload) handlers.onIncoming(payload);
            } else if (d.type === 'moknet-push-action') {
                const action = asAction(d.action);
                const payload = parsePushPayload(d.payload);
                if (action && payload) handlers.onAction(action, payload);
            }
        } catch (err) {
            // Un message malformé ne doit jamais casser l'écoute des suivants.
            console.warn('[appel] message du service worker ignoré', err);
        }
    };
    sw.addEventListener('message', onMessage as EventListener);
    return () => {
        try { sw.removeEventListener('message', onMessage as EventListener); } catch { /* déjà retiré */ }
    };
}
