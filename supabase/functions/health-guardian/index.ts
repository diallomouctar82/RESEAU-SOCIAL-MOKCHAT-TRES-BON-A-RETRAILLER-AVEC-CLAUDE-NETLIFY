// Gardien de santé MokNet — sondes de lecture et réparations contrôlées.
//
// Séquence imposée, sans raccourci possible :
//
//   DIAGNOSTIQUER → CONFIRMER → SAUVEGARDER → APPLIQUER → VÉRIFIER → JOURNALISER
//
// Ce que cette fonction ne fait JAMAIS :
//   • exécuter du SQL fourni par l'appelant — le seul paramètre d'une
//     réparation est une clé du catalogue fermé (migration health_guardian) ;
//   • appliquer une réparation sans sauvegarde — les deux vivent dans la même
//     transaction côté base, il est impossible d'obtenir l'une sans l'autre ;
//   • appliquer une réparation sans confirmation liée AU PÉRIMÈTRE EXACT
//     montré à la personne (voir le jeton signé plus bas) ;
//   • conclure sans re-mesurer — le verdict d'après action est renvoyé avec
//     le résultat, jamais déduit du succès de l'écriture.
//
// Rangs (contrôlés côté base, jamais ici) :
//   • lire / diagnostiquer → administrateur
//   • réparer / restaurer  → Admin Général (super_admin) uniquement

import { AccessToken } from 'npm:livekit-server-sdk@2.18.0';
import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';
import { evaluateAll, ProbeOutcome, RawMetrics } from './evaluate.ts';
import { SEUIL_DEGRADE_MS, type RawLiveTransportProbe, toLiveKitApiUrl } from './liveTransportProbe.ts';

// ─────────────────────────── CORS ───────────────────────────
//
// Volontairement PAS de `*`, contrairement aux cinq fonctions Edge
// existantes : c'est le constat O-03 de l'audit du 04/09/2026, et une
// nouvelle fonction n'a aucune raison de reproduire un défaut connu.
// `HEALTH_ALLOWED_ORIGINS` (liste séparée par des virgules) porte les
// domaines MokNet. Tant qu'elle n'est pas définie, on se replie sur `*` en
// le DISANT dans les journaux — un tableau de bord injoignable serait un
// faux problème de sécurité résolu par une vraie panne.

const ALLOWED_ORIGINS = (Deno.env.get('HEALTH_ALLOWED_ORIGINS') ?? '')
    .split(',').map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null): Record<string, string> {
    let allow = '*';
    if (ALLOWED_ORIGINS.length > 0) {
        allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
    } else {
        console.warn(
            'health-guardian: HEALTH_ALLOWED_ORIGINS non définie — CORS ouvert. ' +
            'Définir la variable pour restreindre aux domaines MokNet.',
        );
    }
    return {
        'Access-Control-Allow-Origin': allow,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Vary': 'Origin',
    };
}

function json(body: unknown, status = 200, origin: string | null = null): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' },
    });
}

// ───────────────────── JETON DE CONFIRMATION ─────────────────────
//
// Le jeton lie la confirmation de la personne à un périmètre PRÉCIS :
// (réparation, ligne, nombre de lignes concernées, auteur, expiration).
//
// Au moment d'appliquer, la fonction re-diagnostique et compare. Si le
// nombre de lignes a changé entre l'affichage et le clic — une story vient
// d'expirer, un direct vient de se clore — le jeton ne correspond plus et
// l'action est refusée : la personne doit revoir le nouveau périmètre et
// reconfirmer. Une confirmation ne peut donc pas être rejouée sur un
// périmètre qu'elle n'a jamais vu.

const CONFIRMATION_TTL_MS = 5 * 60_000;

async function hmacKey(): Promise<CryptoKey> {
    // Matière de clé : le secret de service, déjà présent dans
    // l'environnement de la fonction. Il ne sort jamais — seule la signature
    // circule, et une signature ne permet pas de remonter à la clé.
    const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    return crypto.subtle.importKey(
        'raw', new TextEncoder().encode(secret),
        { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify'],
    );
}

interface PlanClaims {
    remediationId: string;
    lineId: string;
    affectedCount: number;
    actorId: string;
    exp: number;
}

function canonical(claims: PlanClaims): string {
    return [claims.remediationId, claims.lineId, claims.affectedCount, claims.actorId, claims.exp].join('|');
}

async function signPlan(claims: PlanClaims): Promise<string> {
    const key = await hmacKey();
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical(claims)));
    const b64 = btoa(String.fromCharCode(...new Uint8Array(sig)));
    return `${btoa(JSON.stringify(claims))}.${b64}`;
}

async function verifyPlan(token: string): Promise<PlanClaims | null> {
    try {
        const [payload, sig] = token.split('.');
        if (!payload || !sig) return null;
        const claims = JSON.parse(atob(payload)) as PlanClaims;
        const key = await hmacKey();
        const expected = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(canonical(claims)));
        // Comparaison à temps constant : une comparaison de chaînes qui
        // s'arrête au premier écart laisse mesurer la signature attendue.
        const got = Uint8Array.from(atob(sig), (c) => c.charCodeAt(0));
        const exp = new Uint8Array(expected);
        if (got.length !== exp.length) return null;
        let diff = 0;
        for (let i = 0; i < exp.length; i++) diff |= got[i] ^ exp[i];
        if (diff !== 0) return null;
        if (Date.now() > claims.exp) return null;
        return claims;
    } catch {
        return null;
    }
}

// ─────────────────────────── SONDES ───────────────────────────

type UserClient = ReturnType<typeof createUserScopedClient>;

// ───────────── SAT-4 : LA SEULE SONDE QUI SORT DE LA BASE ─────────────
//
// Tout le reste de ce tableau de bord interroge Postgres. Celle-ci appelle le
// serveur LiveKit — parce que c'est le seul moyen de savoir si un direct peut
// réellement démarrer. La règle de décision, elle, vit dans
// `liveTransportProbe.ts` et ne fait aucun réseau : ici on OBSERVE, là-bas on
// JUGE. Les tests exécutent le jugement réel, pas une imitation.

/**
 * Délai au-delà duquel on abandonne l'appel.
 *
 * DÉRIVÉ du seuil de dégradation plutôt que choisi à part, et ce n'est pas un
 * détail : si on coupait AU seuil, l'état « dégradé » deviendrait
 * inobservable — un serveur qui répond en 2 s serait déclaré INJOIGNABLE
 * alors qu'il répond. La garde mentirait dans le sens alarmant, ce qui est
 * aussi grave qu'un faux vert. L'écrire comme un calcul, et non comme une
 * constante voisine, empêche les deux valeurs de se croiser un jour.
 */
const PROBE_TIMEOUT_MS = Math.max(5_000, SEUIL_DEGRADE_MS * 2);

/** Le jeton de la sonde : lecture seule, très court, et rien d'autre. */
const PROBE_TOKEN_TTL_S = 60;

interface LiveTransportConfigRow {
    server_url: string;
    api_key: string;
    api_secret: string;
}

/**
 * Observe le transport du direct. Ne juge pas, ne lève jamais.
 *
 * L'appel émis est exactement celui que `livekit-token` fait pour laisser
 * entrer quelqu'un (`POST /twirp/livekit.RoomService/ListRooms`), signé par le
 * même SDK et la même clé. Ce que la sonde éprouve est donc précisément ce
 * dont dépend un direct — pas une approximation.
 */
async function observeLiveTransport(): Promise<{ configured: boolean; probe: RawLiveTransportProbe | null }> {
    const service = createServiceRoleClient();
    const environment = Deno.env.get('LIVE_TRANSPORT_ENVIRONMENT') ?? 'development';

    const { data: config } = await service
        .rpc('get_live_transport_config_internal', { p_environment: environment })
        .maybeSingle<LiveTransportConfigRow>();

    if (!config?.server_url || !config?.api_key || !config?.api_secret) {
        return { configured: false, probe: null };
    }

    let jeton: string;
    try {
        const at = new AccessToken(config.api_key, config.api_secret, {
            identity: 'health-guardian',
            ttl: PROBE_TOKEN_TTL_S,
        });
        // `roomList` seul : la sonde peut LIRE la liste des directs, jamais en
        // créer un, en rejoindre un, ni publier quoi que ce soit.
        at.addGrant({ roomList: true });
        jeton = await at.toJwt();
    } catch (err) {
        // Un jeton non signable est un défaut de configuration, pas une panne
        // du serveur : on le dit sans accuser le transport.
        console.error('health-guardian: signature du jeton de sonde impossible', err);
        return { configured: false, probe: null };
    }

    const url = `${toLiveKitApiUrl(config.server_url)}/twirp/livekit.RoomService/ListRooms`;
    const controller = new AbortController();
    const minuterie = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    const debut = Date.now();

    try {
        const res = await fetch(url, {
            method: 'POST',
            headers: { Authorization: `Bearer ${jeton}`, 'Content-Type': 'application/json' },
            body: '{}',
            signal: controller.signal,
        });
        const texte = await res.text();
        // Le corps est lu SANS supposer qu'il est du JSON : un reverse-proxy
        // égaré rend volontiers une page HTML avec un 200. `judgeLiveTransport`
        // exige la forme réelle du contrat, et un corps illisible arrive donc
        // ici en `null` — ce qui le range en « inutilisable », jamais en succès.
        let corps: unknown = null;
        try { corps = JSON.parse(texte); } catch { corps = texte; }
        return {
            configured: true,
            probe: {
                reached: true,
                httpStatus: res.status,
                body: corps,
                latencyMs: Date.now() - debut,
                timedOut: false,
            },
        };
    } catch (err) {
        const expire = err instanceof DOMException && err.name === 'AbortError';
        return {
            configured: true,
            probe: {
                reached: false,
                httpStatus: null,
                body: null,
                latencyMs: Date.now() - debut,
                timedOut: expire,
            },
        };
    } finally {
        clearTimeout(minuterie);
    }
}

async function runProbes(userClient: UserClient): Promise<{ outcomes: ProbeOutcome[]; error?: string }> {
    const [cat, data, ops, liveTransport] = await Promise.all([
        userClient.rpc('health_probe_catalogue'),
        userClient.rpc('health_probe_data'),
        userClient.rpc('health_probe_operations'),
        // Ne lève jamais : une sonde réseau qui casserait la fonction entière
        // ferait disparaître TOUTES les lignes du tableau de bord pour un seul
        // service indisponible.
        observeLiveTransport().catch((err) => {
            console.error('health-guardian: sonde de transport en échec', err);
            return undefined;
        }),
    ]);

    // Une sonde en échec ne produit PAS de vert par défaut : on renvoie
    // l'erreur, et le client marque les lignes concernées en blanc (non
    // éprouvé). C'est la règle « aucun faux vert » appliquée au cas où la
    // mesure elle-même tombe.
    const failure = cat.error ?? data.error ?? ops.error;
    if (failure) {
        return { outcomes: [], error: failure.message };
    }

    const metrics: RawMetrics = {
        catalogue: (cat.data ?? {}) as Record<string, unknown>,
        data: (data.data ?? {}) as Record<string, unknown>,
        operations: (ops.data ?? {}) as Record<string, unknown>,
        liveTransport,
    };
    return { outcomes: evaluateAll(metrics) };
}

/** Journalise dans `audit_logs`, qui n'est accessible qu'au service_role. */
async function journal(
    entry: {
        actorId: string;
        action: string;
        lineId: string;
        metadata: Record<string, unknown>;
    },
): Promise<string | null> {
    const service = createServiceRoleClient();
    const { data, error } = await service.from('audit_logs').insert({
        actor_id: entry.actorId,
        action: entry.action,
        entity_type: 'health',
        entity_id: entry.lineId,
        request_id: crypto.randomUUID(),
        metadata: entry.metadata,
    }).select('id').maybeSingle();

    if (error) {
        // Une action appliquée mais non journalisée doit se voir : elle est
        // signalée dans la réponse, jamais avalée.
        console.error('health-guardian: journalisation en échec', error.message);
        return null;
    }
    return (data as { id?: string } | null)?.id ?? null;
}

interface RequestBody {
    action?: 'probe' | 'diagnose' | 'repair' | 'restore' | 'journal';
    remediationId?: string;
    lineId?: string;
    confirmationToken?: string;
    snapshotId?: string;
    limit?: number;
}

Deno.serve(async (req: Request) => {
    const origin = req.headers.get('Origin');
    if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders(origin) });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405, origin);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401, origin);
    const actorId = authData.user.id;

    let body: RequestBody;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Corps de requête JSON invalide.' }, 400, origin);
    }

    // Rang de l'appelant : l'interface s'en sert pour n'afficher un bouton
    // d'action que s'il a une chance d'aboutir.
    const { data: rank } = await userClient.rpc('health_my_rank');
    const canRepair = (rank as { canRepair?: boolean } | null)?.canRepair === true;

    switch (body.action) {

        // ── LIRE ────────────────────────────────────────────────────────
        case 'probe': {
            const { outcomes, error } = await runProbes(userClient);
            if (error) return json({ error: `Sondes indisponibles : ${error}`, rank }, 403, origin);
            return json({ outcomes, rank, ranAt: new Date().toISOString() }, 200, origin);
        }

        case 'journal': {
            const { data, error } = await userClient.rpc('health_journal', { p_limit: body.limit ?? 50 });
            if (error) return json({ error: error.message }, 403, origin);
            return json({ entries: data ?? [], rank }, 200, origin);
        }

        // ── DIAGNOSTIQUER (aucune écriture) ─────────────────────────────
        case 'diagnose': {
            if (!body.remediationId || !body.lineId) {
                return json({ error: 'remediationId et lineId requis.' }, 400, origin);
            }
            const { data, error } = await userClient.rpc('health_diagnose_remediation', {
                p_remediation_id: body.remediationId,
            });
            if (error) return json({ error: error.message }, 403, origin);

            const plan = data as { affectedCount?: number; affectedTables?: string[]; sample?: unknown[] };
            const affectedCount = Number(plan?.affectedCount ?? 0);
            const claims: PlanClaims = {
                remediationId: body.remediationId,
                lineId: body.lineId,
                affectedCount,
                actorId,
                exp: Date.now() + CONFIRMATION_TTL_MS,
            };

            return json({
                lineId: body.lineId,
                remediationId: body.remediationId,
                summary: affectedCount === 0
                    ? "Rien à corriger : aucune ligne ne correspond actuellement."
                    : `${affectedCount} élément(s) seront modifiés, après sauvegarde.`,
                affectedCount,
                affectedTables: plan?.affectedTables ?? [],
                sample: plan?.sample ?? [],
                reversible: true,
                // Un jeton n'est émis que si l'appelant peut réellement agir :
                // inutile de faire miroiter une confirmation qui sera refusée.
                confirmationToken: canRepair && affectedCount > 0 ? await signPlan(claims) : null,
                expiresAt: new Date(claims.exp).toISOString(),
                rank,
            }, 200, origin);
        }

        // ── RÉPARER ─────────────────────────────────────────────────────
        case 'repair': {
            if (!body.remediationId || !body.lineId || !body.confirmationToken) {
                return json({ error: 'remediationId, lineId et confirmationToken requis.' }, 400, origin);
            }

            const claims = await verifyPlan(body.confirmationToken);
            if (!claims) {
                return json({ error: 'Confirmation invalide ou expirée. Relancez le diagnostic.' }, 400, origin);
            }
            if (claims.actorId !== actorId
                || claims.remediationId !== body.remediationId
                || claims.lineId !== body.lineId) {
                return json({ error: "Cette confirmation ne correspond pas à l'action demandée." }, 403, origin);
            }

            // Le périmètre a-t-il bougé depuis l'affichage ? Si oui, la
            // personne n'a pas confirmé CE qui serait fait maintenant.
            const { data: fresh, error: freshError } = await userClient.rpc('health_diagnose_remediation', {
                p_remediation_id: body.remediationId,
            });
            if (freshError) return json({ error: freshError.message }, 403, origin);
            const freshCount = Number((fresh as { affectedCount?: number })?.affectedCount ?? 0);
            if (freshCount !== claims.affectedCount) {
                return json({
                    error: `Le périmètre a changé depuis votre confirmation (${claims.affectedCount} → ${freshCount}). `
                        + `Relancez le diagnostic pour voir ce qui serait fait maintenant.`,
                }, 409, origin);
            }

            // SAUVEGARDER + APPLIQUER : une seule transaction côté base.
            const { data: applied, error: applyError } = await userClient.rpc('health_apply_remediation', {
                p_remediation_id: body.remediationId,
                p_line_id: body.lineId,
            });
            if (applyError) return json({ error: applyError.message }, 403, origin);

            const result = applied as { snapshotId?: string; changedCount?: number };

            // VÉRIFIER : on re-mesure, on ne déduit rien du succès de l'écriture.
            const { outcomes } = await runProbes(userClient);
            const verification = outcomes.find((o) => o.lineId === body.lineId) ?? null;

            const journalId = await journal({
                actorId,
                action: 'health.repair',
                lineId: body.lineId,
                metadata: {
                    remediationId: body.remediationId,
                    snapshotId: result?.snapshotId ?? null,
                    changedCount: result?.changedCount ?? 0,
                    statusAfter: verification?.status ?? null,
                    measuredAfter: verification?.measured ?? null,
                },
            });

            return json({
                lineId: body.lineId,
                remediationId: body.remediationId,
                ok: true,
                snapshotId: result?.snapshotId ?? null,
                changedCount: result?.changedCount ?? 0,
                verification,
                journalId,
                message: journalId
                    ? `${result?.changedCount ?? 0} élément(s) corrigé(s). Sauvegarde conservée pour restauration.`
                    : `${result?.changedCount ?? 0} élément(s) corrigé(s), mais la journalisation a échoué — à signaler.`,
                outcomes,
                rank,
            }, 200, origin);
        }

        // ── RESTAURER ───────────────────────────────────────────────────
        case 'restore': {
            if (!body.snapshotId || !body.lineId) {
                return json({ error: 'snapshotId et lineId requis.' }, 400, origin);
            }

            const { data: restored, error: restoreError } = await userClient.rpc('health_restore_snapshot', {
                p_snapshot_id: body.snapshotId,
            });
            if (restoreError) return json({ error: restoreError.message }, 403, origin);

            const { outcomes } = await runProbes(userClient);
            const verification = outcomes.find((o) => o.lineId === body.lineId) ?? null;

            const journalId = await journal({
                actorId,
                action: 'health.restore',
                lineId: body.lineId,
                metadata: {
                    snapshotId: body.snapshotId,
                    restoredCount: (restored as { restoredCount?: number })?.restoredCount ?? 0,
                    statusAfter: verification?.status ?? null,
                    measuredAfter: verification?.measured ?? null,
                },
            });

            return json({
                lineId: body.lineId,
                ok: true,
                snapshotId: body.snapshotId,
                changedCount: (restored as { restoredCount?: number })?.restoredCount ?? 0,
                verification,
                journalId,
                message: "État antérieur rétabli depuis la sauvegarde.",
                outcomes,
                rank,
            }, 200, origin);
        }

        default:
            return json({ error: "Action inconnue. Attendu : probe, diagnose, repair, restore, journal." }, 400, origin);
    }
});
