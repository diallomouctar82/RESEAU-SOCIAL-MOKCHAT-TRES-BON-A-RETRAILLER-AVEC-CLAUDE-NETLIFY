// Adaptateur générique piloté par configuration (ai_providers.adapter_config).
// C'est le moteur qui permet à un fournisseur découvert automatiquement (voir la
// fonction discover-provider) de devenir appelable SANS écrire de code : la forme
// de sa requête/réponse est décrite en JSON plutôt que dans un fichier dédié.
//
// Toute la famille de fournisseurs codés en dur (openai_compatible, async_job, ...)
// continue d'exister telle quelle — celui-ci ne les remplace pas, il couvre le cas
// où aucun code spécifique n'a jamais été écrit pour ce fournisseur.

import { AdapterError, AdapterRequest, AdapterResult, ProviderAdapter } from './types.ts';

export interface GenericHttpConfig {
    method?: 'POST' | 'GET';
    path: string; // ajouté à baseUrl ; peut contenir {{MODEL_ID}}
    headers?: Record<string, string>; // valeurs interpolées ({{API_KEY}}, {{MODEL_ID}})
    authStyle?: 'bearer' | 'header' | 'query' | 'none';
    authHeaderName?: string; // requis si authStyle === 'header'
    authQueryParam?: string; // requis si authStyle === 'query'
    // Gabarit de corps JSON. Toute valeur chaîne strictement égale à un des jetons
    // ci-dessous est remplacée par la vraie valeur (pas une simple substitution de
    // sous-chaîne, pour pouvoir injecter un tableau/objet, pas juste du texte) :
    //   "{{MESSAGES}}"   -> tableau {role, content}[] (catégorie llm)
    //   "{{PROMPT}}"     -> dernier message utilisateur, ou req.imageVideo.prompt
    //   "{{TEXT}}"       -> req.voice.text
    //   "{{VOICE_ID}}"   -> req.voice.voiceId
    //   "{{MODEL_ID}}"   -> req.modelId
    //   "{{AUDIO_BASE64}}" -> req.voice.audioBase64
    bodyTemplate?: Record<string, unknown>;
    responseTextPath?: string; // chemin dans la réponse JSON vers le texte/URL de résultat
    isAsync?: boolean;
    jobIdPath?: string;
    pollPath?: string; // chemin ajouté à baseUrl, peut contenir {{JOB_ID}}
    pollHeaders?: Record<string, string>;
    statusPath?: string;
    doneValues?: string[];
    failedValues?: string[];
    maxPolls?: number;
    pollIntervalMs?: number;
    testPath?: string; // GET léger pour vérifier la clé (sinon test = clé non vide)
}

function getPath(obj: unknown, path: string): unknown {
    if (!path) return undefined;
    return path.split('.').reduce<unknown>((acc, key) => {
        if (acc == null) return undefined;
        const idx = key.match(/^(\w+)\[(\d+)\]$/);
        if (idx) {
            const arr = (acc as Record<string, unknown>)[idx[1]];
            return Array.isArray(arr) ? arr[Number(idx[2])] : undefined;
        }
        return (acc as Record<string, unknown>)[key];
    }, obj);
}

function interpolateString(value: string, vars: Record<string, string>): string {
    return Object.entries(vars).reduce((acc, [token, v]) => acc.split(token).join(v), value);
}

// Remplace récursivement les jetons dans un objet JSON. Un jeton seul (valeur de
// chaîne strictement égale au jeton) est remplacé par la vraie valeur typée
// (tableau, objet...) ; un jeton dans une chaîne plus longue fait une substitution
// texte classique.
function fillTemplate(node: unknown, tokenValues: Record<string, unknown>, stringVars: Record<string, string>): unknown {
    if (typeof node === 'string') {
        if (node in tokenValues) return tokenValues[node];
        return interpolateString(node, stringVars);
    }
    if (Array.isArray(node)) return node.map((n) => fillTemplate(n, tokenValues, stringVars));
    if (node && typeof node === 'object') {
        const out: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(node as Record<string, unknown>)) out[k] = fillTemplate(v, tokenValues, stringVars);
        return out;
    }
    return node;
}

function buildContext(req: AdapterRequest) {
    const lastUserMessage = req.llm?.messages?.slice().reverse().find((m) => m.role === 'user')?.content ?? '';
    const stringVars: Record<string, string> = {
        '{{MODEL_ID}}': req.modelId ?? '',
        '{{VOICE_ID}}': req.voice?.voiceId ?? '',
    };
    const tokenValues: Record<string, unknown> = {
        '{{MESSAGES}}': req.llm?.messages ?? [],
        '{{PROMPT}}': req.imageVideo?.prompt ?? lastUserMessage,
        '{{TEXT}}': req.voice?.text ?? '',
        '{{AUDIO_BASE64}}': req.voice?.audioBase64 ?? '',
    };
    return { stringVars, tokenValues };
}

function buildUrl(baseUrl: string, path: string, apiKey: string, config: GenericHttpConfig, stringVars: Record<string, string>): string {
    let url = (baseUrl.replace(/\/$/, '')) + '/' + interpolateString(path, stringVars).replace(/^\//, '');
    if (config.authStyle === 'query') {
        const param = config.authQueryParam || 'api_key';
        url += (url.includes('?') ? '&' : '?') + `${encodeURIComponent(param)}=${encodeURIComponent(apiKey)}`;
    }
    return url;
}

function buildHeaders(apiKey: string, config: GenericHttpConfig, stringVars: Record<string, string>): Record<string, string> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    for (const [k, v] of Object.entries(config.headers ?? {})) {
        headers[k] = interpolateString(v, { ...stringVars, '{{API_KEY}}': apiKey });
    }
    if (config.authStyle === 'bearer' && !Object.keys(config.headers ?? {}).some((h) => h.toLowerCase() === 'authorization')) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }
    if (config.authStyle === 'header') {
        const name = config.authHeaderName || 'X-API-Key';
        if (!headers[name]) headers[name] = apiKey;
    }
    return headers;
}

export const genericHttpAdapter: ProviderAdapter = {
    async call(req: AdapterRequest, apiKey: string, baseUrl: string | null, config?: Record<string, unknown>): Promise<AdapterResult> {
        const c = config as unknown as GenericHttpConfig | undefined;
        if (!c || !c.path) {
            throw new AdapterError("Ce fournisseur n'a pas de configuration d'appel exploitable (découverte incomplète).", 'other');
        }
        if (!baseUrl) throw new AdapterError('URL de base manquante pour ce fournisseur.', 'other');

        const { stringVars, tokenValues } = buildContext(req);
        const url = buildUrl(baseUrl, c.path, apiKey, c, stringVars);
        const headers = buildHeaders(apiKey, c, stringVars);
        const body = c.bodyTemplate ? fillTemplate(c.bodyTemplate, tokenValues, { ...stringVars, '{{API_KEY}}': apiKey }) : undefined;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 30_000);
        let res: Response;
        try {
            res = await fetch(url, {
                method: c.method ?? 'POST',
                headers,
                body: (c.method ?? 'POST') === 'GET' ? undefined : JSON.stringify(body ?? {}),
                signal: controller.signal,
            });
        } catch (err) {
            throw new AdapterError(`Erreur réseau : ${(err as Error).message}`, 'server_error');
        } finally {
            clearTimeout(timeout);
        }

        if (res.status === 401 || res.status === 403) throw new AdapterError('Clé API invalide ou refusée.', 'auth');
        if (res.status === 429) throw new AdapterError('Quota ou limite de débit dépassé.', 'rate_limited');
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new AdapterError(`Échec de l'appel (${res.status}) : ${text.slice(0, 200)}`, res.status >= 500 ? 'server_error' : 'other');
        }
        let json = await res.json().catch(() => ({}));

        if (c.isAsync) {
            const jobId = String(getPath(json, c.jobIdPath ?? '') ?? '');
            if (!jobId) throw new AdapterError('Identifiant de job introuvable dans la réponse.', 'other');
            const maxPolls = c.maxPolls ?? 20;
            const intervalMs = c.pollIntervalMs ?? 3000;
            for (let i = 0; i < maxPolls; i++) {
                await new Promise((r) => setTimeout(r, intervalMs));
                const pollUrl = buildUrl(baseUrl, (c.pollPath ?? '').replace('{{JOB_ID}}', jobId), apiKey, c, stringVars);
                const pollHeaders = { ...buildHeaders(apiKey, c, stringVars), ...(c.pollHeaders ?? {}) };
                const pollRes = await fetch(pollUrl, { headers: pollHeaders });
                if (!pollRes.ok) continue;
                const pollJson = await pollRes.json().catch(() => ({}));
                const status = String(getPath(pollJson, c.statusPath ?? '') ?? '').toLowerCase();
                if ((c.failedValues ?? []).some((v) => v.toLowerCase() === status)) {
                    throw new AdapterError(`Le job a échoué côté fournisseur (statut : ${status}).`, 'other');
                }
                if ((c.doneValues ?? ['succeeded', 'completed', 'done', 'success']).some((v) => v.toLowerCase() === status)) {
                    const result = getPath(pollJson, c.responseTextPath ?? '');
                    return { jobId, assetUrl: typeof result === 'string' ? result : undefined, text: typeof result === 'string' ? result : undefined, raw: pollJson };
                }
            }
            return { jobId };
        }

        const result = getPath(json, c.responseTextPath ?? '');
        if (result === undefined) throw new AdapterError('Réponse vide ou chemin de résultat introuvable dans la réponse.', 'other');
        const isUrlLike = typeof result === 'string' && /^https?:\/\//.test(result);
        return {
            text: typeof result === 'string' && !isUrlLike ? result : undefined,
            assetUrl: isUrlLike ? (result as string) : undefined,
            raw: json,
        };
    },

    async testConnection(apiKey: string, baseUrl: string | null, config?: Record<string, unknown>): Promise<{ ok: boolean; message: string }> {
        const c = config as unknown as GenericHttpConfig | undefined;
        if (!apiKey) return { ok: false, message: 'Clé API vide.' };
        if (!c?.testPath || !baseUrl) {
            return { ok: true, message: 'Clé enregistrée. Test de connexion non disponible pour ce fournisseur — vérifiez avec un appel réel.' };
        }
        try {
            const { stringVars } = buildContext({ category: 'llm', modelId: '' });
            const url = buildUrl(baseUrl, c.testPath, apiKey, c, stringVars);
            const res = await fetch(url, { headers: buildHeaders(apiKey, c, stringVars) });
            if (res.status === 401 || res.status === 403) return { ok: false, message: 'Clé API invalide ou refusée.' };
            if (!res.ok) return { ok: false, message: `Réponse inattendue (${res.status}).` };
            return { ok: true, message: 'Connexion réussie.' };
        } catch (err) {
            return { ok: false, message: `Erreur réseau : ${(err as Error).message}` };
        }
    },
};
