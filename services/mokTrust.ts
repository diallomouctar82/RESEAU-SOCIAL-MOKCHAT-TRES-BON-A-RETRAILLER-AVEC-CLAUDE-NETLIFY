import type { SupabaseClient } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from './supabaseClient';

export type MokTrustStatus = 'insufficient_data' | 'provisional' | 'established';

export interface MokTrustComponents {
    neutralBase: number;
    accountMaturity: number;
    communityContributions: number;
    peerFeedback: number;
    moderationAdjustment: number;
}

export interface MokTrustScore {
    userId: string;
    score: number;
    confidence: number;
    status: MokTrustStatus;
    accountAgeDays: number;
    contributionsCount: number;
    reactionsReceivedCount: number;
    confirmedFindingsCount: number;
    components: MokTrustComponents;
    algorithmVersion: string;
    calculatedAt: string;
}

export class MokTrustServiceError extends Error {
    readonly retryable: boolean;
    readonly cause?: unknown;

    constructor(message: string, retryable = false, cause?: unknown) {
        super(message);
        this.name = 'MokTrustServiceError';
        this.retryable = retryable;
        this.cause = cause;
    }
}

const boundedInteger = (value: unknown, minimum: number, maximum = Number.MAX_SAFE_INTEGER): number => {
    const number = Number(value);
    if (!Number.isFinite(number)) return minimum;
    return Math.min(maximum, Math.max(minimum, Math.round(number)));
};

const componentValue = (components: Record<string, unknown>, key: string): number => {
    const value = Number(components[key]);
    return Number.isFinite(value) ? Math.round(value) : 0;
};

const mapScore = (row: any): MokTrustScore => {
    if (!row || typeof row !== 'object' || typeof row.user_id !== 'string') {
        throw new MokTrustServiceError('Le serveur MokTrust a renvoyé une réponse invalide.');
    }
    const rawComponents = row.components && typeof row.components === 'object'
        ? row.components as Record<string, unknown>
        : {};
    const status: MokTrustStatus = ['insufficient_data', 'provisional', 'established'].includes(row.status)
        ? row.status
        : 'insufficient_data';

    return {
        userId: row.user_id,
        score: boundedInteger(row.score, 0, 100),
        confidence: boundedInteger(row.confidence, 0, 100),
        status,
        accountAgeDays: boundedInteger(row.account_age_days, 0),
        contributionsCount: boundedInteger(row.contributions_count, 0),
        reactionsReceivedCount: boundedInteger(row.reactions_received_count, 0),
        confirmedFindingsCount: boundedInteger(row.confirmed_findings_count, 0),
        components: {
            neutralBase: componentValue(rawComponents, 'neutral_base'),
            accountMaturity: componentValue(rawComponents, 'account_maturity'),
            communityContributions: componentValue(rawComponents, 'community_contributions'),
            peerFeedback: componentValue(rawComponents, 'peer_feedback'),
            moderationAdjustment: componentValue(rawComponents, 'moderation_adjustment'),
        },
        algorithmVersion: typeof row.algorithm_version === 'string' ? row.algorithm_version : 'community-v1',
        calculatedAt: typeof row.calculated_at === 'string' ? row.calculated_at : '',
    };
};

const isRetryable = (error: any): boolean => {
    const status = Number(error?.status ?? error?.statusCode ?? 0);
    return !status || status === 408 || status === 429 || status >= 500;
};

export class MokTrustService {
    private readonly client: SupabaseClient;
    private readonly configured: boolean;

    constructor(
        client: SupabaseClient = supabase,
        configured = isSupabaseConfigured,
    ) {
        this.client = client;
        this.configured = configured;
    }

    async refreshMyScore(): Promise<MokTrustScore> {
        if (!this.configured) {
            throw new MokTrustServiceError('MokTrust nécessite une connexion Supabase authentifiée.');
        }

        const { data, error } = await this.client.rpc('refresh_my_mok_trust_score');
        if (error) {
            throw new MokTrustServiceError(
                'Le calcul MokTrust n’a pas pu être actualisé.',
                isRetryable(error),
                error,
            );
        }

        const row = Array.isArray(data) ? data[0] : data;
        if (!row) {
            throw new MokTrustServiceError('Aucun indice MokTrust n’est disponible pour ce profil.');
        }
        return mapScore(row);
    }
}

export const mokTrustService = new MokTrustService();
