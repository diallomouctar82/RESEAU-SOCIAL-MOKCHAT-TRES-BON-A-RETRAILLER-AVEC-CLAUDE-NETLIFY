import { isSupabaseConfigured, supabase } from './supabaseClient';
import type { Json } from './database.types';

export type CommerceOrderStatus =
  | 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';

const assertBackend = () => {
  if (!isSupabaseConfigured) throw new Error('COMMERCE_BACKEND_UNAVAILABLE');
};

export const commerceService = {
  async listRfqs() {
    assertBackend();
    const { data, error } = await supabase
      .from('trade_rfqs')
      .select('*,trade_rfq_quotes(*)')
      .order('created_at', { ascending: false });
    if (error) throw new Error(`RFQ_LIST_FAILED:${error.code}`);
    return data ?? [];
  },

  async listProducts() {
    assertBackend();
    const { data, error } = await supabase
      .from('products')
      .select('*,shops!inner(id,name,owner_id)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw new Error(`COMMERCE_PRODUCTS_FAILED:${error.code}`);
    return data ?? [];
  },

  async createRfq(input: {
    title: string;
    specifications: Record<string, unknown>;
    currency: string;
    budget?: number;
    deadline?: string;
    idempotencyKey: string;
  }) {
    assertBackend();
    if (!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const { data, error } = await supabase.rpc('create_trade_rfq', {
      p_title: input.title,
      p_specifications: input.specifications as Json,
      p_currency: input.currency,
      p_budget: input.budget ?? null,
      p_deadline: input.deadline ?? null,
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw new Error(`RFQ_CREATE_FAILED:${error.code}`);
    return data;
  },

  async submitQuote(input: {
    rfqId: string;
    amount: number;
    currency: string;
    incoterm?: string;
    proposal: Record<string, unknown>;
  }) {
    assertBackend();
    const { data, error } = await supabase.rpc('submit_trade_rfq_quote', {
      p_rfq_id: input.rfqId,
      p_amount: input.amount,
      p_currency: input.currency,
      p_incoterm: input.incoterm ?? null,
      p_proposal: input.proposal as Json,
    });
    if (error) throw new Error(error.message || `RFQ_QUOTE_FAILED:${error.code}`);
    return data;
  },

  async createOrder(input: {
    sellerId: string;
    shopId?: string;
    currency: string;
    items: Array<{ productId: string; quantity: number }>;
    shipping?: Record<string, unknown>;
    idempotencyKey: string;
  }) {
    assertBackend();
    if (input.items.length === 0) throw new Error('ORDER_ITEMS_REQUIRED');
    if (!input.idempotencyKey.trim()) throw new Error('IDEMPOTENCY_KEY_REQUIRED');
    const { data, error } = await supabase.rpc('create_commerce_order', {
      p_seller_id: input.sellerId,
      p_currency: input.currency,
      p_items: input.items.map((item) => ({ product_id: item.productId, quantity: item.quantity })) as Json,
      p_metadata: { shop_id: input.shopId ?? null, shipping: input.shipping ?? {} } as Json,
      p_idempotency_key: input.idempotencyKey,
    });
    if (error) throw new Error(error.message || `ORDER_CREATE_FAILED:${error.code}`);
    return data;
  },

  async transitionOrder(id: string, expectedStatus: CommerceOrderStatus, nextStatus: CommerceOrderStatus, metadata: Record<string, unknown> = {}) {
    assertBackend();
    const { data, error } = await supabase.rpc('transition_commerce_order', {
      p_order_id: id,
      p_expected_status: expectedStatus,
      p_next_status: nextStatus,
      p_metadata: metadata as Json,
    });
    if (error) throw new Error(error.message || `ORDER_TRANSITION_FAILED:${error.code}`);
    return data;
  },

  async createEscrow(orderId: string, idempotencyKey: string) {
    assertBackend();
    const { data, error } = await supabase.rpc('create_commerce_escrow', {
      p_order_id: orderId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message || `ESCROW_CREATE_FAILED:${error.code}`);
    return data;
  },

  async fundEscrow(escrowId: string, idempotencyKey: string) {
    assertBackend();
    const { data, error } = await supabase.rpc('fund_commerce_escrow', {
      p_escrow_id: escrowId,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message || `ESCROW_FUND_FAILED:${error.code}`);
    return data;
  },

  async settleEscrow(escrowId: string, action: 'release' | 'refund', idempotencyKey: string) {
    assertBackend();
    const { data, error } = await supabase.rpc('settle_commerce_escrow', {
      p_escrow_id: escrowId,
      p_action: action,
      p_idempotency_key: idempotencyKey,
    });
    if (error) throw new Error(error.message || `ESCROW_SETTLEMENT_FAILED:${error.code}`);
    return data;
  },

  async requestEscrowAction(escrowId: string, action: 'release' | 'refund' | 'dispute') {
    assertBackend();
    const { data, error } = await supabase.rpc('request_commerce_escrow_action', {
      p_escrow_id: escrowId,
      p_action: action,
    });
    if (error) throw new Error(error.message || `ESCROW_REQUEST_FAILED:${error.code}`);
    return data;
  },
};
