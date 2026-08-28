import { isSupabaseConfigured, supabase } from './supabaseClient';

export interface WalletAccount {
  ownerId: string;
  currency: string;
  balance: number;
}

export interface WalletLedgerTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  reference?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

const requireSession = async (): Promise<string> => {
  if (!isSupabaseConfigured) throw new Error('WALLET_BACKEND_UNAVAILABLE');
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error('AUTH_REQUIRED');
  return userId;
};

export const walletLedger = {
  async listTransactions(limit = 100): Promise<WalletLedgerTransaction[]> {
    const userId = await requireSession();
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('id,type,amount,currency,reference,metadata,created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(Math.min(Math.max(limit, 1), 250));
    if (error) throw new Error(`WALLET_TRANSACTIONS_FAILED:${error.code}`);
    return (data ?? []).map((row) => ({
      id: row.id,
      type: row.type,
      amount: Number(row.amount),
      currency: row.currency,
      reference: row.reference ?? undefined,
      metadata: row.metadata && typeof row.metadata === 'object' && !Array.isArray(row.metadata)
        ? row.metadata as Record<string, unknown>
        : {},
      createdAt: row.created_at,
    }));
  },

  async listAccounts(): Promise<WalletAccount[]> {
    const userId = await requireSession();
    const { data, error } = await supabase.rpc('get_wallet_balances');
    if (error) throw new Error(error.message || `WALLET_BALANCES_FAILED:${error.code}`);
    return (data ?? []).map((row: { currency: string; balance: number | string }) => ({
      ownerId: userId,
      currency: row.currency,
      balance: Number(row.balance),
    }));
  },

  async transfer(input: {
    recipientId: string;
    amount: number;
    currency: string;
    reference: string;
    idempotencyKey: string;
  }): Promise<string> {
    await requireSession();
    if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('INVALID_AMOUNT');
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(input.recipientId)) {
      throw new Error('INVALID_RECIPIENT');
    }
    if (!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const { data, error } = await supabase.rpc('transfer_wallet_balance', {
      p_recipient_id: input.recipientId,
      p_amount: input.amount,
      p_currency: input.currency.toUpperCase(),
      p_reference: input.reference,
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw new Error(error.message || `WALLET_TRANSFER_FAILED:${error.code}`);
    return String(data);
  },
};
