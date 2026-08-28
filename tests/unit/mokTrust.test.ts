import { describe, expect, it, vi } from 'vitest';

vi.mock('../../services/supabaseClient', () => ({
  isSupabaseConfigured: true,
  supabase: { rpc: vi.fn() },
}));

import { MokTrustService, MokTrustServiceError } from '../../services/mokTrust';

const serverRow = {
  user_id: '018f5f6b-bc7d-7f0d-8a6e-16fc4b14e123',
  score: 74,
  confidence: 68,
  status: 'established',
  account_age_days: 420,
  contributions_count: 16,
  reactions_received_count: 9,
  confirmed_findings_count: 0,
  components: {
    neutral_base: 35,
    account_maturity: 14,
    community_contributions: 20,
    peer_feedback: 12,
    moderation_adjustment: 0,
  },
  algorithm_version: 'community-v1',
  calculated_at: '2026-08-27T23:00:00.000Z',
};

describe('MokTrustService', () => {
  it('obtient exclusivement le score calculé par la RPC serveur', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [serverRow], error: null });
    const service = new MokTrustService({ rpc } as any, true);

    const score = await service.refreshMyScore();

    expect(rpc).toHaveBeenCalledOnce();
    expect(rpc).toHaveBeenCalledWith('refresh_my_mok_trust_score');
    expect(score).toMatchObject({
      score: 74,
      confidence: 68,
      algorithmVersion: 'community-v1',
      components: { communityContributions: 20 },
    });
  });

  it('refuse un faux score local quand Supabase est indisponible', async () => {
    const service = new MokTrustService({ rpc: vi.fn() } as any, false);

    await expect(service.refreshMyScore()).rejects.toBeInstanceOf(MokTrustServiceError);
    await expect(service.refreshMyScore()).rejects.toThrow(/Supabase authentifiée/);
  });

  it('propage une erreur serveur sans réutiliser de valeur en cache', async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { status: 503 } });
    const service = new MokTrustService({ rpc } as any, true);

    await expect(service.refreshMyScore()).rejects.toMatchObject({ retryable: true });
  });
});
