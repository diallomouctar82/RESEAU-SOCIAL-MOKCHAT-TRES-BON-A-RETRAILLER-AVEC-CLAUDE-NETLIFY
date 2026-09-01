// Lecture de la mémoire institutionnelle Vision Smart via Vision Smart AI Core.
//
// Sécurité :
// - exécuté uniquement côté Edge Function, jamais dans le navigateur ;
// - le jeton de service AI Core vient de `AI_CORE_SERVICE_TOKEN`, secret runtime ;
// - lecture seule ; aucune proposition/revue/écriture n'est exposée par cet outil ;
// - la recherche AI Core ne renvoie par défaut que les entrées VALIDATED/ACTIVE ;
// - le catalogue garde l'outil désactivé tant que le secret n'est pas provisionné.

import { ToolExecutionContext, ToolResult } from './types.ts';

const DEFAULT_BASE_URL = 'https://ai-core.moknet.net';
const DEFAULT_PROJECT_ID = '6aeffdc5-e681-4ec4-ad36-7d9d71449d66';
const MAX_RESULTS = 5;
const REQUEST_TIMEOUT_MS = 8_000;
const MAX_CONTENT_CHARS = 2_500;

interface KnowledgeEntry {
    id: string;
    project_id: string;
    type?: string;
    title?: string;
    canonical_key?: string;
    status?: string;
    current_version_id?: string | null;
    confidence?: number | null;
    provenance?: Record<string, unknown>;
}

interface KnowledgeVersion {
    id: string;
    knowledge_entry_id: string;
    version_number?: number;
    content?: string;
    summary?: string | null;
    source_type?: string | null;
    source_uri?: string | null;
    validated_at?: string | null;
}

function boundedInt(value: unknown, fallback: number): number {
    const parsed = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    return Math.max(1, Math.min(MAX_RESULTS, Math.trunc(parsed)));
}

function safeBaseUrl(raw: string): string | null {
    try {
        const url = new URL(raw);
        if (url.protocol !== 'https:') return null;
        return url.toString().replace(/\/$/, '');
    } catch {
        return null;
    }
}

async function aiCoreJson<T>(url: string, token: string): Promise<{ ok: true; data: T } | { ok: false; status: number; message: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(url, {
            headers: {
                Accept: 'application/json',
                Authorization: `Bearer ${token}`,
                'X-Correlation-ID': crypto.randomUUID(),
            },
            signal: controller.signal,
        });
        if (!response.ok) {
            const body = (await response.text().catch(() => '')).slice(0, 300);
            return { ok: false, status: response.status, message: body };
        }
        return { ok: true, data: await response.json() as T };
    } catch (err) {
        const message = (err as Error)?.name === 'AbortError'
            ? 'délai dépassé'
            : ((err as Error)?.message || 'erreur réseau');
        return { ok: false, status: 0, message };
    } finally {
        clearTimeout(timeout);
    }
}

export async function executeSearchAiCoreMemory(
    args: Record<string, unknown>,
    _ctx: ToolExecutionContext,
): Promise<ToolResult> {
    const query = typeof args.query === 'string' ? args.query.trim() : '';
    if (!query) {
        return { ok: false, content: 'Recherche AI Core vide : préciser le fait, la décision, la règle ou l’incident recherché.' };
    }

    const token = Deno.env.get('AI_CORE_SERVICE_TOKEN')?.trim();
    if (!token) {
        return {
            ok: false,
            content: 'La mémoire institutionnelle AI Core n’est pas encore activée pour cet environnement serveur. Ne pas inventer de connaissance institutionnelle ; répondre à partir des autres sources autorisées.',
        };
    }

    const baseUrl = safeBaseUrl(Deno.env.get('AI_CORE_BASE_URL')?.trim() || DEFAULT_BASE_URL);
    if (!baseUrl) {
        return { ok: false, content: 'Configuration AI Core invalide côté serveur (URL HTTPS requise).' };
    }

    const projectId = Deno.env.get('AI_CORE_PROJECT_ID')?.trim() || DEFAULT_PROJECT_ID;
    const limit = boundedInt(args.limit, 3);
    const type = typeof args.type === 'string' && args.type.trim() ? args.type.trim() : null;

    const searchUrl = new URL(`${baseUrl}/v1/knowledge/search`);
    searchUrl.searchParams.set('project_id', projectId);
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('limit', String(limit));
    if (type) searchUrl.searchParams.set('type', type);

    const search = await aiCoreJson<{ items?: KnowledgeEntry[] }>(searchUrl.toString(), token);
    if (!search.ok) {
        console.error(`ai_core_memory: recherche refusée/indisponible status=${search.status} detail=${search.message}`);
        return {
            ok: false,
            content: `La mémoire institutionnelle AI Core est indisponible pour cette recherche (${search.status || 'réseau'}). Ne pas remplacer le résultat par une supposition.`,
        };
    }

    const entries = Array.isArray(search.data?.items) ? search.data.items.slice(0, limit) : [];
    if (!entries.length) {
        return {
            ok: true,
            content: `AI CORE — aucune connaissance institutionnelle VALIDATED/ACTIVE trouvée pour « ${query} ». Ne pas présenter une proposition ou une hypothèse comme une règle officielle.`,
        };
    }

    const rendered = await Promise.all(entries.map(async (entry) => {
        const historyUrl = `${baseUrl}/v1/knowledge/${encodeURIComponent(entry.id)}/history`;
        const history = await aiCoreJson<KnowledgeVersion[]>(historyUrl, token);
        if (!history.ok || !Array.isArray(history.data)) {
            return `- ${entry.title || entry.canonical_key || entry.id} [${entry.type || 'UNKNOWN'} / ${entry.status || 'UNKNOWN'}]\n  Contenu courant indisponible.`;
        }

        const versions = history.data;
        const current = versions.find((version) => version.id === entry.current_version_id)
            ?? versions.slice().sort((a, b) => Number(b.version_number ?? 0) - Number(a.version_number ?? 0))[0];
        const rawContent = (current?.content || current?.summary || '').trim();
        const content = rawContent.length > MAX_CONTENT_CHARS
            ? `${rawContent.slice(0, MAX_CONTENT_CHARS)}…`
            : rawContent;
        const provenance = current?.source_uri ? `\n  Source : ${current.source_uri}` : '';
        const confidence = entry.confidence == null ? '' : ` / confiance ${entry.confidence}`;
        return `- ${entry.title || entry.canonical_key || entry.id} [${entry.type || 'UNKNOWN'} / ${entry.status || 'UNKNOWN'}${confidence}]\n  ${content || 'Contenu vide.'}${provenance}`;
    }));

    return {
        ok: true,
        content:
            `MÉMOIRE INSTITUTIONNELLE VISION SMART — AI CORE\n` +
            `Recherche : « ${query} »\n` +
            `Seules les connaissances VALIDATED/ACTIVE sont retournées par défaut.\n\n` +
            rendered.join('\n\n'),
    };
}
