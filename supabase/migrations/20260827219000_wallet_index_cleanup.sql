-- Supprime l'index dupliqué détecté après la réconciliation du ledger.
-- uq_wallet_transaction_idempotency, créé par le socle, reste l'unique
-- contrainte d'idempotence (user_id, idempotency_key).
begin;

drop index if exists public.wallet_transactions_idempotency_idx;

commit;
