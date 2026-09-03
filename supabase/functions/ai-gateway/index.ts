// Point d'entrée unique de l'orchestrateur IA. Reçoit soit un appel de génération
// (mode 'call', sélection automatique + bascule sur échec/quota/indisponibilité),
// soit un test de connexion pour l'écran admin (mode 'test').
//
// Sécurité : cette fonction est le SEUL endroit où une clé fournisseur est déchiffrée.
// Le client (navigateur) n'obtient jamais la clé, seulement le résultat de l'appel IA.

import { createServiceRoleClient, createUserScopedClient } from './supabase.ts';
import { resolveAdapter } from './adapters/registry.ts';
import { AdapterError, AdapterMessage, AdapterRequest, ToolDeclaration } from './adapters/types.ts';
import { resolveToolExecutor } from './tools/registry.ts';
import { describeAction } from './tools/actions.ts';

// Nombre maximum d'allers-retours modèle <-> outils dans un même tour.
// Garde-fou contre une boucle infinie (un modèle qui redemanderait sans fin le
// même outil) et contre une facture qui s'emballe.
const MAX_TOOL_ITERATIONS = 4;

// Une ligne du classement renvoyé par get_ranked_ai_candidates.
interface RankedCandidate {
    provider_id: string;
    model_id: string;
    adapter_kind: string;
    base_url: string | null;
    adapter_config: Record<string, unknown> | null;
    cost_tier: 'free' | 'paid';
    sante: 'sain' | 'inconnu' | 'defaillant';
    cout_estime: number;
    latence_ms: number;
    /** Explication lisible du rang, reprise telle quelle dans le journal d'audit. */
    motif: string;
}

interface CatalogTool {
    id: string;
    display_name: string;
    description: string;
    category: 'search' | 'read' | 'action';
    parameters_schema: Record<string, unknown>;
    requires_confirmation: boolean;
    requires_auth: boolean;
}

// ── Caches mémoire à portée module ──────────────────────────────────────────
// Le runtime Deno d'une Edge Function reste chaud entre deux invocations : ces
// caches survivent donc d'un appel à l'autre sur la même instance, sans qu'un
// stockage externe soit nécessaire. Les TTL sont volontairement courts pour
// les données qui doivent refléter un état récent (classement, santé des
// fournisseurs) et plus longs pour les données quasi statiques (tarifs) ou
// coûteuses à répéter (secret déchiffré) — jamais indéfinis, pour qu'un
// changement d'administration (clé, tarif, désactivation) se propage vite.
const CANDIDATES_TTL_MS = 4_000;
const SECRET_TTL_MS = 30_000;
const MODEL_COST_TTL_MS = 5 * 60_000;

const candidatesCache = new Map<string, { data: RankedCandidate[]; expiresAt: number }>();
const secretCache = new Map<string, { key: string; expiresAt: number }>();
const modelCostCache = new Map<string, { row: { input_cost_per_million: number | null; output_cost_per_million: number | null; cost_per_call: number | null } | null; expiresAt: number }>();

/** Exécute une écriture d'audit sans bloquer la réponse au client. */
function fireAndForget(promise: Promise<unknown>) {
    const runtime = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
    const tracked = promise.catch((err) => console.error('ai-gateway: écriture différée en échec', err));
    if (runtime?.waitUntil) runtime.waitUntil(tracked);
}

const CORS_HEADERS: Record<string, string> = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
    });
}

interface GatewayBody {
    // 'warmup' (mission LT) : préchauffe sans appel fournisseur — voir plus bas.
    mode?: 'call' | 'test' | 'warmup';
    category?: 'llm' | 'voice' | 'image_video';
    providerId?: string; // forcer un fournisseur précis (pas de bascule) — sinon sélection auto
    modelId?: string;
    request?: AdapterRequest['llm'] | AdapterRequest['voice'] | AdapterRequest['imageVideo'];
    // Expert à l'origine de l'appel. Détermine les outils autorisés via
    // agent_tool_grants. Absent = aucun outil (comportement d'avant).
    agentId?: string;
    // Action confirmée par la personne au tour précédent. C'est le SEUL chemin
    // par lequel une écriture peut avoir lieu (voir la boucle d'outils).
    confirmedAction?: { toolId: string; args: Record<string, unknown> };
}

Deno.serve(async (req: Request) => {
    if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS });
    if (req.method !== 'POST') return json({ error: 'Méthode non supportée.' }, 405);

    const authHeader = req.headers.get('Authorization');
    const userClient = createUserScopedClient(authHeader);
    const { data: authData } = await userClient.auth.getUser();
    if (!authData?.user) return json({ error: 'Authentification requise.' }, 401);

    let body: GatewayBody;
    try {
        body = await req.json();
    } catch {
        return json({ error: 'Corps de requête JSON invalide.' }, 400);
    }

    const service = createServiceRoleClient();
    const requestedBy = authData.user.id;

    // Le test de connexion et la gestion des clés restent réservés aux admins
    // (voir aussi les RPC set_ai_provider_*, admin-only côté base). La
    // génération elle-même (mode 'call' ci-dessous) est ouverte à tout
    // utilisateur authentifié : c'est ce qui permet à un fournisseur activé
    // par l'admin de devenir immédiatement utilisable par toute l'application.
    if (body.mode === 'test') {
        const { data: isAdmin, error: adminCheckError } = await userClient.rpc('is_admin');
        if (adminCheckError || !isAdmin) return json({ error: 'Accès réservé aux administrateurs.' }, 403);
        if (!body.providerId) return json({ error: 'providerId requis en mode test.' }, 400);
        const result = await testProvider(service, body.providerId);
        return json(result, result.ok ? 200 : 400);
    }

    // ── Préchauffe (mission LT — latence des appels traduits) ────────────────
    // Appelée par l'écran d'appel dès qu'une traduction devient probable
    // (langue choisie, ou langue du correspondant reçue) : l'isolat est
    // réveillé, la connexion du navigateur ouverte, le classement des
    // fournisseurs de la catégorie et le secret de la tête de chaque
    // sous-famille (TTS et STT) déjà en cache pour la première vraie requête.
    // AUCUN fournisseur n'est appelé, rien n'est journalisé : c'est une
    // préparation, pas un appel IA — et une erreur ici n'en est pas une pour
    // l'appelant (réponse 200 avec `ok:false`), la première requête réelle se
    // débrouillera seule.
    if (body.mode === 'warmup') {
        const startedAt = Date.now();
        const category = body.category ?? 'voice';
        try {
            const { data, error } = await service.rpc('get_ranked_ai_candidates', { p_category: category });
            if (error) return json({ ok: false, warmedMs: Date.now() - startedAt });
            const ranked = (data ?? []) as RankedCandidate[];
            candidatesCache.set(category, { data: ranked, expiresAt: Date.now() + CANDIDATES_TTL_MS });
            const sttKinds = new Set(['whisper', 'deepgram', 'assemblyai', 'gemini_stt']);
            const heads = category === 'voice'
                ? [ranked.find((c) => !sttKinds.has(c.adapter_kind)), ranked.find((c) => sttKinds.has(c.adapter_kind))]
                : [ranked[0]];
            await Promise.all(heads.filter((c): c is RankedCandidate => !!c).map(async (c) => {
                const cached = secretCache.get(c.provider_id);
                if (cached && cached.expiresAt > Date.now()) return;
                const { data: secret, error: secretError } = await service.rpc('get_ai_provider_secret_internal', { p_provider_id: c.provider_id });
                if (!secretError && secret) secretCache.set(c.provider_id, { key: secret as string, expiresAt: Date.now() + SECRET_TTL_MS });
            }));
            return json({ ok: true, category, candidates: ranked.length, warmedMs: Date.now() - startedAt });
        } catch (err) {
            console.warn('ai-gateway: préchauffe en échec', err);
            return json({ ok: false, warmedMs: Date.now() - startedAt });
        }
    }

    if (!body.category) return json({ error: 'category requis.' }, 400);

    // Classement établi en base par get_ranked_ai_candidates : AUCUN fournisseur
    // n'est privilégié par principe. Tous les couples (fournisseur, modèle)
    // éligibles concourent à égalité, départagés uniquement par des critères
    // objectifs et mesurés — palier gratuit, santé récente, coût, latence.
    // Le classement dépend de mesures qui évoluent lentement (santé sur 7
    // jours) : un court cache mémoire (CANDIDATES_TTL_MS) évite de le
    // recalculer en base à chaque appel sans retarder la détection d'un
    // fournisseur qui redevient fiable ou tombe en panne de plus de quelques
    // secondes.
    // ── Trois lectures indépendantes menées de front ──────────────────────────
    // Le classement, les plafonds de dépense et les outils autorisés pour cet
    // expert ne dépendent pas les uns des autres : les enchaîner en séquence
    // ne fait qu'additionner leurs allers-retours DB pour rien.
    const candidatesPromise: Promise<{ data: RankedCandidate[] | null; error: { message: string } | null }> =
        (() => {
            const cached = candidatesCache.get(body.category!);
            if (cached && cached.expiresAt > Date.now()) {
                return Promise.resolve({ data: cached.data, error: null });
            }
            return service.rpc('get_ranked_ai_candidates', { p_category: body.category }).then((res) => {
                if (!res.error) candidatesCache.set(body.category!, { data: res.data ?? [], expiresAt: Date.now() + CANDIDATES_TTL_MS });
                return res;
            });
        })();

    const budgetPromise = checkBudget(service);

    const agentToolsPromise = (body.category === 'llm' && body.agentId)
        ? service.rpc('get_agent_tools', { p_agent_id: body.agentId })
        : Promise.resolve<{ data: CatalogTool[] | null; error: null }>({ data: null, error: null });

    const [{ data: candidates, error: candidatesError }, budgetVerdict, { data: agentTools, error: toolsError }] =
        await Promise.all([candidatesPromise, budgetPromise, agentToolsPromise]);

    if (candidatesError) return json({ error: `Erreur catalogue : ${candidatesError.message}` }, 500);

    // Identifiant de requête : relie entre elles toutes les décisions prises
    // pour un même appel (fournisseur retenu, écartés, échecs successifs).
    // C'est lui qui rend l'audit lisible dans ai_call_log.
    const requestId = crypto.randomUUID();

    // L'ordre vient entièrement du classement calculé en base : aucun tri local
    // ne vient le contredire. `providerId` reste possible pour forcer un
    // fournisseur précis (test admin, appel spécialisé), sans bascule.
    let ordered = body.providerId
        ? (candidates ?? []).filter((c: RankedCandidate) => c.provider_id === body.providerId)
        : (candidates ?? []);

    // ── Sous-familles de la catégorie « voice » ──────────────────────────────
    // TTS (texte → parole) et STT (parole → texte) partagent la catégorie mais
    // sont des capacités DISJOINTES : sans ce filtre, la bascule d'une
    // synthèse en échec « essayait » Deepgram/Whisper/AssemblyAI, qui
    // répondaient « Audio requis pour la transcription » — 68 échecs de
    // routage journalisés en 48 h (audit du 31/08/2026), du temps perdu à
    // chaque phrase parlée. La forme de la requête dit sans ambiguïté ce que
    // le client veut ; les adaptateurs inconnus (auto-découverts) restent
    // traités comme TTS, comportement le plus courant.
    if (body.category === 'voice' && !body.providerId) {
        const voiceReq = body.request as AdapterRequest['voice'];
        const sttKinds = new Set(['whisper', 'deepgram', 'assemblyai', 'gemini_stt']);
        const wantsStt = !!voiceReq?.audioBase64 && !voiceReq?.text;
        ordered = ordered.filter((c: RankedCandidate) =>
            sttKinds.has(c.adapter_kind) === wantsStt
        );
    }

    if (ordered.length === 0) {
        return json({ error: 'Aucun fournisseur actif et configuré pour cette catégorie.' }, 503);
    }

    // ── Plafonds de dépense ─────────────────────────────────────────────────
    // Vérifiés AVANT tout appel réseau : au plafond, plus rien ne part.
    if (budgetVerdict.blocked) {
        fireAndForget(logCall(service, {
            requestId, category: body.category, providerId: null, modelId: null,
            attemptNumber: 0, status: 'blocked', decision: 'blocked_budget',
            decisionReason: budgetVerdict.reason, latencyMs: 0, requestedBy,
        }));
        return json({ error: budgetVerdict.reason, budgetExceeded: true }, 402);
    }

    // ── Outils autorisés pour cet expert ─────────────────────────────────────
    // La liste vient entièrement de la base (ai_tools x agent_tool_grants) :
    // l'administrateur ouvre ou ferme un outil pour un expert donné sans qu'une
    // ligne de code change ici. Les outils s'appliquent donc à TOUS les experts
    // qui y ont droit, pas seulement à Diallo.
    const toolsById = new Map<string, CatalogTool>();
    let toolDeclarations: ToolDeclaration[] | undefined;

    if (body.category === 'llm' && body.agentId) {
        if (toolsError) {
            // Un incident sur le catalogue ne doit pas priver la personne de
            // réponse : on continue sans outils plutôt que d'échouer.
            console.error('ai-gateway: lecture du catalogue d\'outils impossible', toolsError.message);
        } else {
            const usable = (agentTools ?? []) as CatalogTool[];
            for (const t of usable) toolsById.set(t.id, t);
            if (usable.length) {
                toolDeclarations = usable.map((t) => ({
                    name: t.id,
                    description: t.description,
                    parametersSchema: t.parameters_schema,
                }));
            }
        }
    }

    // ── Action confirmée : exécution déterministe, AVANT toute génération ────
    // On n'attend pas que le modèle veuille bien ré-émettre son appel d'outil :
    // il peut très bien répondre par une phrase au lieu de le refaire, et
    // l'accord de la personne resterait alors sans effet. L'action validée est
    // donc exécutée ici, une seule fois, hors de la boucle de bascule entre
    // fournisseurs (l'exécuter dedans risquerait une double écriture si le
    // premier fournisseur échouait après coup). Son résultat est ensuite injecté
    // dans la conversation pour que le modèle rédige la réponse finale.
    const confirmedMessages: AdapterMessage[] = [];
    if (body.category === 'llm' && body.confirmedAction) {
        const { toolId, args } = body.confirmedAction;
        const tool = toolsById.get(toolId);
        const executor = resolveToolExecutor(toolId);

        if (!tool) {
            return json({ error: `L'outil « ${toolId} » n'est pas autorisé pour cet expert.` }, 403);
        }
        if (!executor) {
            return json({ error: `L'outil « ${toolId} » n'a pas d'implémentation disponible.` }, 400);
        }

        const outcome = await executor(args ?? {}, { userClient, service, userId: requestedBy, agentId: body.agentId });
        const callId = `confirmed_${Date.now()}`;
        confirmedMessages.push(
            { role: 'assistant', content: '', toolCalls: [{ id: callId, name: toolId, args: args ?? {} }] },
            { role: 'tool', content: outcome.content, toolCallId: callId, toolName: toolId },
        );
    }

    const attempts: { providerId: string; errorClass: string; message: string }[] = [];

    for (let i = 0; i < ordered.length; i++) {
        const provider = ordered[i] as RankedCandidate;
        const attemptNumber = i + 1;
        const startedAt = Date.now();
        try {
            // Le secret déchiffré ne change qu'à la modification manuelle d'une
            // clé côté admin : un court cache mémoire évite de repayer le coût
            // de déchiffrement à chaque tentative de bascule sur ce même
            // fournisseur, tout en restant assez court pour qu'un changement de
            // clé se propage en quelques dizaines de secondes.
            let apiKey: string | undefined = secretCache.get(provider.provider_id)?.key;
            if (apiKey === undefined || (secretCache.get(provider.provider_id)?.expiresAt ?? 0) < Date.now()) {
                const { data, error: secretError } = await service.rpc(
                    'get_ai_provider_secret_internal',
                    { p_provider_id: provider.provider_id },
                );
                if (secretError || !data) throw new AdapterError('Clé introuvable.', 'auth');
                apiKey = data as string;
                secretCache.set(provider.provider_id, { key: apiKey, expiresAt: Date.now() + SECRET_TTL_MS });
            }

            const adapter = resolveAdapter(provider.adapter_kind);
            // Le modèle vient du classement (couple fournisseur+modèle évalué ensemble).
            const modelId = body.modelId ?? provider.model_id;
            if (!modelId) throw new AdapterError('Aucun modèle configuré pour ce fournisseur.', 'other');

            const adapterRequest: AdapterRequest = {
                category: body.category,
                modelId,
                ...(body.category === 'llm' ? {
                    llm: {
                        ...(body.request as AdapterRequest['llm'])!,
                        // Le résultat de l'action confirmée fait partie de la
                        // conversation : le modèle sait ce qui vient d'être fait
                        // et rédige sa réponse en conséquence.
                        messages: [...(body.request as AdapterRequest['llm'])!.messages, ...confirmedMessages],
                        tools: toolDeclarations,
                    },
                } : {}),
                ...(body.category === 'voice' ? { voice: body.request as AdapterRequest['voice'] } : {}),
                ...(body.category === 'image_video' ? { imageVideo: body.request as AdapterRequest['imageVideo'] } : {}),
            };

            const callProvider = (r: AdapterRequest) => adapter.call(
                r,
                apiKey as string,
                provider.base_url,
                provider.adapter_config ?? undefined,
            );

            let result = await callProvider(adapterRequest);
            // Consommation cumulée sur l'ensemble du tour (boucle d'outils incluse).
            let totalInput = result.usage?.inputTokens ?? 0;
            let totalOutput = result.usage?.outputTokens ?? 0;
            let pendingAction: { toolId: string; label: string; args: Record<string, unknown> } | null = null;
            // L'action confirmée a déjà été exécutée avant la boucle : elle
            // compte parmi les outils utilisés pour ce tour.
            const toolsUsed: string[] = body.confirmedAction ? [body.confirmedAction.toolId] : [];

            // ── Boucle d'outils ──────────────────────────────────────────────
            // Tant que le modèle demande des outils, on les exécute et on le
            // relance avec leurs résultats, jusqu'à ce qu'il produise une
            // réponse finale (ou qu'une action requière une confirmation).
            for (let iter = 0; iter < MAX_TOOL_ITERATIONS && result.toolCalls?.length; iter++) {
                const history: AdapterMessage[] = [
                    ...adapterRequest.llm!.messages,
                    { role: 'assistant', content: result.text ?? '', toolCalls: result.toolCalls },
                ];

                // GARDE-FOU — CONFIRMATION OBLIGATOIRE.
                // Un appel exigeant confirmation interrompt le tour à sa place
                // dans l'ordre du modèle : rien après lui ne s'exécute (identique
                // au comportement précédent). Les appels qui le PRÉCÈDENT sont en
                // revanche indépendants les uns des autres — les exécuter en
                // parallèle plutôt qu'en séquence évite d'additionner leurs
                // latences pour rien, sans toucher à la garantie de confirmation :
                // l'exécuteur d'un outil à confirmation obligatoire n'est jamais
                // atteint ici, qu'il soit premier ou dernier de la liste.
                const confirmIdx = result.toolCalls.findIndex((call) => toolsById.get(call.name)?.requires_confirmation);
                const callsToRun = confirmIdx === -1 ? result.toolCalls : result.toolCalls.slice(0, confirmIdx);

                const outcomes = await Promise.all(callsToRun.map(async (call) => {
                    const tool = toolsById.get(call.name);
                    if (!tool) return { call, content: `Outil « ${call.name} » non autorisé pour cet expert.`, used: false };
                    const executor = resolveToolExecutor(call.name);
                    if (!executor) return { call, content: `Outil « ${call.name} » sans implémentation disponible.`, used: false };
                    const outcome = await executor(call.args, { userClient, service, userId: requestedBy, agentId: body.agentId });
                    return { call, content: outcome.content, used: true };
                }));
                for (const o of outcomes) {
                    if (o.used) toolsUsed.push(o.call.name);
                    history.push({ role: 'tool', content: o.content, toolCallId: o.call.id, toolName: o.call.name });
                }

                let suspended = false;
                if (confirmIdx !== -1) {
                    const call = result.toolCalls[confirmIdx];
                    pendingAction = { toolId: call.name, label: describeAction(call.name, call.args), args: call.args };
                    suspended = true;
                }

                if (suspended) break;

                adapterRequest.llm!.messages = history;
                result = await callProvider(adapterRequest);
                totalInput += result.usage?.inputTokens ?? 0;
                totalOutput += result.usage?.outputTokens ?? 0;
            }

            // Le coût agrège TOUS les allers-retours du tour (boucle d'outils
            // comprise) : une réponse ayant nécessité trois appels au modèle est
            // facturée trois fois, et le budget doit le refléter.
            const costUsd = await computeCost(service, provider.provider_id, modelId, {
                inputTokens: totalInput, outputTokens: totalOutput,
            });

            // Écriture d'audit détachée de la réponse : la personne n'a aucune
            // raison d'attendre l'INSERT dans ai_call_log pour recevoir sa
            // réponse. `fireAndForget` la maintient en vie via
            // EdgeRuntime.waitUntil quand le runtime le permet.
            fireAndForget(logCall(service, {
                requestId, category: body.category, providerId: provider.provider_id, modelId, attemptNumber,
                status: 'success', decision: 'selected',
                decisionReason: `Retenu — ${provider.cost_tier === 'free' ? 'palier gratuit' : 'palier payant'}, coût estimé ${provider.cout_estime} $. ${provider.motif}`,
                latencyMs: Date.now() - startedAt, requestedBy,
                inputTokens: totalInput, outputTokens: totalOutput, costUsd,
            }));

            return json({
                providerId: provider.provider_id,
                modelId,
                attempts: attemptNumber,
                result,
                ...(toolsUsed.length ? { toolsUsed } : {}),
                // Le client doit afficher une confirmation puis rappeler la
                // fonction avec confirmedAction pour que l'écriture ait lieu.
                ...(pendingAction ? { pendingAction } : {}),
            });
        } catch (err) {
            const adapterErr = err instanceof AdapterError ? err : new AdapterError(String(err), 'other');
            attempts.push({ providerId: provider.provider_id, errorClass: adapterErr.errorClass, message: adapterErr.message });
            const resteDesCandidats = i < ordered.length - 1;
            fireAndForget(logCall(service, {
                requestId, category: body.category, providerId: provider.provider_id, modelId: body.modelId ?? null,
                attemptNumber, status: 'error', errorClass: adapterErr.errorClass,
                decision: resteDesCandidats ? 'failover' : 'exhausted',
                decisionReason: adapterErr.errorClass === 'rate_limited'
                    // Cas typique d'un quota gratuit épuisé : la bascule vers le
                    // fournisseur suivant est exactement le comportement voulu.
                    ? `Quota ou limite de débit atteint sur ${provider.provider_id}${resteDesCandidats ? ' — bascule sur le fournisseur suivant.' : ' — plus aucun candidat.'}`
                    : `Échec (${adapterErr.errorClass})${resteDesCandidats ? ' — bascule sur le fournisseur suivant.' : ' — plus aucun candidat.'}`,
                errorMessage: adapterErr.message, latencyMs: Date.now() - startedAt, requestedBy,
            }));
            // Bascule automatique : on continue sur le fournisseur suivant, quelle que soit la cause.
        }
    }

    return json({ error: 'Tous les fournisseurs disponibles ont échoué.', attempts }, 502);
});

// Le modèle par défaut est désormais résolu par get_ranked_ai_candidates, qui
// évalue le couple (fournisseur, modèle) d'un seul tenant — la recherche
// séparée qui existait ici n'a plus d'objet.

async function testProvider(service: ReturnType<typeof createServiceRoleClient>, providerId: string) {
    const { data: provider, error: providerError } = await service
        .from('ai_providers')
        .select('id, adapter_kind, base_url, adapter_config')
        .eq('id', providerId)
        .maybeSingle();
    if (providerError || !provider) return { ok: false, message: 'Fournisseur inconnu.' };

    const { data: apiKey, error: secretError } = await service.rpc(
        'get_ai_provider_secret_internal',
        { p_provider_id: providerId },
    );
    if (secretError || !apiKey) return { ok: false, message: 'Aucune clé configurée pour ce fournisseur.' };

    const adapter = resolveAdapter(provider.adapter_kind);
    const outcome = await adapter.testConnection(
        apiKey as string,
        provider.base_url,
        provider.adapter_config ?? undefined,
    );

    await service
        .from('ai_provider_credentials')
        .update({
            last_tested_at: new Date().toISOString(),
            last_test_status: outcome.ok ? 'success' : 'failure',
            last_test_message: outcome.message,
        })
        .eq('provider_id', providerId);

    return outcome;
}

/**
 * Montant lisible : arrondir un plafond de quelques millièmes à deux décimales
 * afficherait « 0.00 $ sur 0.00 $ », message incompréhensible pour la personne
 * qui vient d'être bloquée.
 */
function money(n: number): string {
    if (n === 0) return '0 $';
    if (n < 0.01) return `${n.toFixed(6)} $`;
    return `${n.toFixed(2)} $`;
}

/**
 * Vérifie les plafonds de dépense avant tout appel réseau.
 * Un plafond non renseigné (null) signifie « pas de limite ». L'interrupteur
 * `enforced` permet de suspendre entièrement le contrôle sans effacer les
 * montants configurés.
 */
async function checkBudget(
    service: ReturnType<typeof createServiceRoleClient>,
): Promise<{ blocked: boolean; reason: string; spentToday: number; spentMonth: number }> {
    // Les deux lectures sont indépendantes (config du plafond vs. dépense déjà
    // engagée) : les mener de front évite d'attendre deux allers-retours DB en
    // série pour un contrôle exécuté à CHAQUE appel.
    const [{ data: budget }, { data: spend }] = await Promise.all([
        service.from('ai_budget').select('daily_cap_usd, monthly_cap_usd, enforced').eq('id', 'global').maybeSingle(),
        service.rpc('get_ai_spend'),
    ]);
    const row = Array.isArray(spend) ? spend[0] : spend;
    const spentToday = Number(row?.spent_today ?? 0);
    const spentMonth = Number(row?.spent_month ?? 0);

    if (!budget?.enforced) return { blocked: false, reason: '', spentToday, spentMonth };

    const daily = budget.daily_cap_usd == null ? null : Number(budget.daily_cap_usd);
    const monthly = budget.monthly_cap_usd == null ? null : Number(budget.monthly_cap_usd);

    if (daily != null && spentToday >= daily) {
        return {
            blocked: true,
            reason: `Plafond journalier atteint (${money(spentToday)} sur ${money(daily)}). Les appels IA sont suspendus jusqu'à demain, ou jusqu'à ce qu'un administrateur relève le plafond.`,
            spentToday, spentMonth,
        };
    }
    if (monthly != null && spentMonth >= monthly) {
        return {
            blocked: true,
            reason: `Plafond mensuel atteint (${money(spentMonth)} sur ${money(monthly)}). Les appels IA sont suspendus jusqu'au mois prochain, ou jusqu'à ce qu'un administrateur relève le plafond.`,
            spentToday, spentMonth,
        };
    }
    return { blocked: false, reason: '', spentToday, spentMonth };
}

/**
 * Coût d'un appel, à partir des tarifs du modèle et de la consommation
 * rapportée par le fournisseur. Un tarif à zéro (offre gratuite, ou grille non
 * renseignée) donne un coût nul : la console signale les modèles sans tarif,
 * car ils resteraient invisibles pour le budget.
 */
async function computeCost(
    service: ReturnType<typeof createServiceRoleClient>,
    providerId: string,
    modelId: string,
    usage?: { inputTokens?: number; outputTokens?: number },
): Promise<number> {
    // Grille tarifaire quasi statique (elle ne change qu'à une mise à jour
    // manuelle des tarifs) : la cacher évite une lecture DB à chaque appel
    // réussi, y compris à chaque itération de la boucle d'outils.
    const cacheKey = `${providerId}:${modelId}`;
    const cached = modelCostCache.get(cacheKey);
    let model = cached && cached.expiresAt > Date.now() ? cached.row : undefined;
    if (model === undefined) {
        const { data } = await service
            .from('ai_models')
            .select('input_cost_per_million, output_cost_per_million, cost_per_call')
            .eq('provider_id', providerId)
            .eq('model_id', modelId)
            .maybeSingle();
        model = data ?? null;
        modelCostCache.set(cacheKey, { row: model, expiresAt: Date.now() + MODEL_COST_TTL_MS });
    }
    if (!model) return 0;

    const perCall = Number(model.cost_per_call ?? 0);
    const inTok = usage?.inputTokens ?? 0;
    const outTok = usage?.outputTokens ?? 0;
    const tokenCost =
        (inTok / 1_000_000) * Number(model.input_cost_per_million ?? 0) +
        (outTok / 1_000_000) * Number(model.output_cost_per_million ?? 0);

    return perCall + tokenCost;
}

async function logCall(
    service: ReturnType<typeof createServiceRoleClient>,
    entry: {
        requestId: string; category: string; providerId: string | null; modelId: string | null;
        attemptNumber: number; status: 'success' | 'error' | 'skipped' | 'blocked';
        decision?: string; decisionReason?: string;
        errorClass?: string; errorMessage?: string;
        latencyMs: number; requestedBy: string;
        inputTokens?: number; outputTokens?: number; costUsd?: number;
    },
) {
    await service.from('ai_call_log').insert({
        request_id: entry.requestId,
        category: entry.category,
        provider_id: entry.providerId,
        model_id: entry.modelId,
        attempt_number: entry.attemptNumber,
        status: entry.status,
        decision: entry.decision ?? null,
        decision_reason: entry.decisionReason ?? null,
        error_class: entry.errorClass ?? null,
        error_message: entry.errorMessage ?? null,
        latency_ms: entry.latencyMs,
        requested_by: entry.requestedBy,
        input_tokens: entry.inputTokens ?? null,
        output_tokens: entry.outputTokens ?? null,
        cost_usd: entry.costUsd ?? 0,
    });
}
