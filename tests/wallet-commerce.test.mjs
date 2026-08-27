import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url).pathname;
const read = (path) => readFile(`${root}${path}`, 'utf8');

test('le wallet lit tout le ledger et ne crédite jamais un état React local', async () => {
  const [service, component] = await Promise.all([
    read('services/walletLedger.ts'),
    read('components/Wallet.tsx'),
  ]);
  assert.match(service, /rpc\('get_wallet_balances'/);
  assert.match(service, /rpc\('transfer_wallet_balance'/);
  assert.match(component, /walletLedger\.transfer/);
  assert.doesNotMatch(component, /addTransaction|setTimeout\(|1,250|150,000|8842/);
  assert.match(component, /Aucun Mobile Money ou virement bancaire externe n’est simulé/);
});

test('commande, RFQ et cotation utilisent des RPC et aucun prix client', async () => {
  const [service, rfq] = await Promise.all([
    read('services/commerceService.ts'),
    read('components/TradeRFQHub.tsx'),
  ]);
  assert.match(service, /rpc\('create_commerce_order'/);
  assert.match(service, /rpc\('create_trade_rfq'/);
  assert.match(service, /rpc\('submit_trade_rfq_quote'/);
  assert.doesNotMatch(service, /unitPrice/);
  assert.match(rfq, /commerceService\.createRfq/);
  assert.match(rfq, /commerceService\.submitQuote/);
  assert.match(rfq, /Aucun succès local n’est affiché sans confirmation Supabase/);
});

test('la migration réutilise le schéma live et verrouille ledger et transitions', async () => {
  const sql = await read('supabase/migrations/20260827213100_wallet_commerce.sql');
  assert.doesNotMatch(sql, /create table if not exists public\.wallet_transactions/);
  assert.doesNotMatch(sql, /create table if not exists public\.commerce_(?:shops|products)/);
  assert.match(sql, /create trigger wallet_transactions_immutable/);
  assert.match(sql, /security definer set search_path = ''/);
  assert.match(sql, /revoke all on function public\.transfer_wallet_balance/);
  assert.match(sql, /when 'pending' then p_next_status='cancelled'/);
  assert.match(sql, /when 'paid' then p_next_status='shipped'/);
  assert.match(sql, /then 'completed'/);
  assert.doesNotMatch(sql, /public\.orders set status='(?:funded|accepted|processing|delivered|refunded|disputed)'/);
});
