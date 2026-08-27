-- Modules métier, IA, RFQ et séquestre MokChat.
-- Migration additive alignée sur les tables live existantes :
-- wallet_transactions, shops, products, orders, order_items.

begin;
create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

create or replace function public.is_platform_admin()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.role in ('admin', 'super_admin')
  );
$$;
revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- Renforcement additif du ledger live ; aucune seconde table transactionnelle.
alter table public.wallet_transactions add column if not exists idempotency_key text;
alter table public.wallet_transactions add column if not exists created_by uuid references auth.users(id) on delete set null;
alter table public.wallet_transactions add column if not exists metadata jsonb not null default '{}'::jsonb;
create unique index if not exists wallet_transactions_idempotency_idx
  on public.wallet_transactions(user_id, idempotency_key)
  where idempotency_key is not null;
create index if not exists wallet_transactions_user_currency_idx
  on public.wallet_transactions(user_id, currency, created_at desc);
do $$ begin
  if not exists (select 1 from pg_constraint where conname='wallet_transactions_idempotency_nonempty') then
    alter table public.wallet_transactions add constraint wallet_transactions_idempotency_nonempty
      check (idempotency_key is null or char_length(trim(idempotency_key)) between 1 and 200);
  end if;
end $$;

-- Enrichissement additif de la table orders live. La création atomique
-- ci-dessous calcule toujours les prix à partir de products.
alter table public.orders add column if not exists idempotency_key text;
alter table public.orders add column if not exists metadata jsonb not null default '{}'::jsonb;
create unique index if not exists orders_buyer_idempotency_idx
  on public.orders(buyer_id, idempotency_key)
  where idempotency_key is not null;
do $$ begin
  if not exists (select 1 from pg_constraint where conname='orders_idempotency_nonempty') then
    alter table public.orders add constraint orders_idempotency_nonempty
      check (idempotency_key is null or char_length(trim(idempotency_key)) between 1 and 200);
  end if;
end $$;

create or replace function public.prevent_wallet_transaction_mutation()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin
  raise exception using errcode = '55000', message = 'WALLET_LEDGER_IMMUTABLE';
end;
$$;
drop trigger if exists wallet_transactions_immutable on public.wallet_transactions;
create trigger wallet_transactions_immutable before update or delete on public.wallet_transactions
for each row execute function public.prevent_wallet_transaction_mutation();

create or replace function public.transfer_wallet_balance(
  p_recipient_id uuid,
  p_amount numeric,
  p_currency text,
  p_reference text,
  p_idempotency_key text
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_sender uuid:=auth.uid(); v_balance numeric; v_sender_tx uuid; v_currency text:=upper(trim(p_currency)); v_existing public.wallet_transactions;
begin
  if v_sender is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
  if nullif(trim(p_idempotency_key),'') is null or char_length(p_idempotency_key)>180 then raise exception using errcode='22023',message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  if p_recipient_id is null or p_recipient_id=v_sender then raise exception using errcode='22023',message='INVALID_RECIPIENT'; end if;
  if not exists(select 1 from auth.users u where u.id=p_recipient_id) then raise exception using errcode='P0002',message='RECIPIENT_NOT_FOUND'; end if;
  if p_amount<=0 or v_currency !~ '^[A-Z0-9]{3,8}$' then raise exception using errcode='22023',message='INVALID_TRANSFER'; end if;
  perform pg_advisory_xact_lock(hashtextextended(least(v_sender::text,p_recipient_id::text)||':'||v_currency,0));
  perform pg_advisory_xact_lock(hashtextextended(greatest(v_sender::text,p_recipient_id::text)||':'||v_currency,0));
  select * into v_existing from public.wallet_transactions where user_id=v_sender and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.type<>'debit' or v_existing.amount<>-p_amount or v_existing.currency<>v_currency
       or v_existing.metadata->>'recipient_id'<>p_recipient_id::text then
      raise exception using errcode='22023',message='IDEMPOTENCY_CONFLICT';
    end if;
    return v_existing.id;
  end if;
  select coalesce(sum(w.amount),0) into v_balance from public.wallet_transactions w where w.user_id=v_sender and w.currency=v_currency;
  if v_balance<p_amount then raise exception using errcode='P0001',message='INSUFFICIENT_FUNDS'; end if;
  insert into public.wallet_transactions(user_id,type,amount,currency,reference,idempotency_key,created_by,metadata)
  values(v_sender,'debit',-p_amount,v_currency,p_reference,p_idempotency_key,v_sender,jsonb_build_object('kind','transfer','recipient_id',p_recipient_id))
  returning id into v_sender_tx;
  insert into public.wallet_transactions(user_id,type,amount,currency,reference,idempotency_key,created_by,metadata)
  values(p_recipient_id,'credit',p_amount,v_currency,p_reference,p_idempotency_key||':credit',v_sender,jsonb_build_object('kind','transfer','sender_id',v_sender,'source_transaction_id',v_sender_tx));
  return v_sender_tx;
end;
$$;
revoke all on function public.transfer_wallet_balance(uuid,numeric,text,text,text) from public, anon, authenticated;
grant execute on function public.transfer_wallet_balance(uuid,numeric,text,text,text) to authenticated;

create or replace function public.get_wallet_balances()
returns table(currency text,balance numeric) language sql stable security definer set search_path = '' as $$
  select w.currency,coalesce(sum(w.amount),0)::numeric
  from public.wallet_transactions w
  where w.user_id=auth.uid() and auth.uid() is not null
  group by w.currency
  order by w.currency;
$$;
revoke all on function public.get_wallet_balances() from public, anon, authenticated;
grant execute on function public.get_wallet_balances() to authenticated;
revoke insert, update, delete on public.wallet_transactions from anon, authenticated;

-- RFQ relié au commerce live, sans dupliquer shops/products/orders.
create table if not exists public.trade_rfqs (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references auth.users(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 200),
  specifications jsonb not null default '{}'::jsonb,
  currency text not null check (currency ~ '^[A-Z0-9]{3,8}$'),
  budget numeric(20,6) check (budget is null or budget >= 0),
  deadline timestamptz,
  status text not null default 'draft' check (status in ('draft','published','evaluating','awarded','cancelled','closed')),
  awarded_quote_id uuid,
  idempotency_key text not null check (char_length(trim(idempotency_key)) between 1 and 200),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (buyer_id, idempotency_key)
);

create table if not exists public.trade_rfq_quotes (
  id uuid primary key default gen_random_uuid(),
  rfq_id uuid not null references public.trade_rfqs(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(20,6) not null check (amount >= 0),
  currency text not null check (currency ~ '^[A-Z0-9]{3,8}$'),
  incoterm text,
  proposal jsonb not null default '{}'::jsonb,
  status text not null default 'submitted' check (status in ('submitted','shortlisted','accepted','rejected','withdrawn')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (rfq_id, seller_id)
);
alter table public.trade_rfqs drop constraint if exists trade_rfqs_awarded_quote_id_fkey;
alter table public.trade_rfqs add constraint trade_rfqs_awarded_quote_id_fkey
  foreign key (awarded_quote_id) references public.trade_rfq_quotes(id) on delete set null;

create table if not exists public.commerce_escrows (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null unique references public.orders(id) on delete restrict,
  buyer_id uuid not null references auth.users(id) on delete restrict,
  seller_id uuid not null references auth.users(id) on delete restrict,
  amount numeric(20,6) not null check (amount > 0),
  currency text not null check (currency ~ '^[A-Z0-9]{3,8}$'),
  status text not null default 'awaiting_funds' check (status in ('awaiting_funds','funded','release_requested','released','refund_requested','refunded','disputed')),
  hold_transaction_id uuid references public.wallet_transactions(id) on delete restrict,
  settlement_transaction_id uuid references public.wallet_transactions(id) on delete restrict,
  idempotency_key text not null check (char_length(trim(idempotency_key)) between 1 and 200),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (buyer_id, idempotency_key)
);

create table if not exists public.commerce_audit_events (
  id bigint generated always as identity primary key,
  actor_id uuid not null references auth.users(id) on delete restrict,
  entity_type text not null check (entity_type in ('order','rfq','quote','escrow')),
  entity_id uuid not null,
  from_status text,
  to_status text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

do $$
declare t text;
begin
  foreach t in array array['trade_rfqs','trade_rfq_quotes','commerce_escrows'] loop
    execute format('drop trigger if exists %I_set_updated_at on public.%I', t, t);
    execute format('create trigger %I_set_updated_at before update on public.%I for each row execute function public.set_updated_at()', t, t);
  end loop;
end $$;

alter table public.trade_rfqs enable row level security;
alter table public.trade_rfq_quotes enable row level security;
alter table public.commerce_escrows enable row level security;
alter table public.commerce_audit_events enable row level security;

drop policy if exists trade_rfqs_read on public.trade_rfqs;
create policy trade_rfqs_read on public.trade_rfqs for select to authenticated
using (status <> 'draft' or buyer_id = auth.uid() or public.is_platform_admin());
drop policy if exists trade_rfqs_buyer_write on public.trade_rfqs;
drop policy if exists trade_rfqs_buyer_insert on public.trade_rfqs;
create policy trade_rfqs_buyer_insert on public.trade_rfqs for insert to authenticated
with check (buyer_id = auth.uid() and status in ('draft','published'));
drop policy if exists trade_quotes_read on public.trade_rfq_quotes;
create policy trade_quotes_read on public.trade_rfq_quotes for select to authenticated
using (
  seller_id = auth.uid() or public.is_platform_admin()
  or exists (select 1 from public.trade_rfqs r where r.id = rfq_id and r.buyer_id = auth.uid())
);
drop policy if exists trade_quotes_seller_write on public.trade_rfq_quotes;
drop policy if exists trade_quotes_seller_insert on public.trade_rfq_quotes;
create policy trade_quotes_seller_insert on public.trade_rfq_quotes for insert to authenticated
with check (seller_id = auth.uid() and status = 'submitted');
drop policy if exists commerce_escrows_participant_read on public.commerce_escrows;
create policy commerce_escrows_participant_read on public.commerce_escrows for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_platform_admin());
drop policy if exists commerce_audit_participant_read on public.commerce_audit_events;
create policy commerce_audit_participant_read on public.commerce_audit_events for select to authenticated
using (
  actor_id = auth.uid() or public.is_platform_admin()
  or (entity_type = 'escrow' and exists (
    select 1 from public.commerce_escrows e
    where e.id = entity_id and auth.uid() in (e.buyer_id, e.seller_id)
  ))
);

-- Création atomique d'une commande : le client ne choisit ni le prix unitaire
-- ni le total. Les lignes produits sont validées et verrouillées côté SQL.
create or replace function public.create_trade_rfq(
  p_title text,
  p_specifications jsonb,
  p_currency text,
  p_budget numeric,
  p_deadline timestamptz,
  p_idempotency_key text
)
returns public.trade_rfqs language plpgsql security definer set search_path = '' as $$
declare v_buyer uuid:=auth.uid(); v_rfq public.trade_rfqs; v_currency text:=upper(trim(p_currency));
begin
  if v_buyer is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
  if char_length(trim(coalesce(p_title,''))) not between 3 and 200 then raise exception using errcode='22023',message='INVALID_RFQ_TITLE'; end if;
  if v_currency !~ '^[A-Z0-9]{3,8}$' or (p_budget is not null and p_budget<0) then raise exception using errcode='22023',message='INVALID_RFQ_TERMS'; end if;
  if nullif(trim(p_idempotency_key),'') is null or char_length(p_idempotency_key)>200 then raise exception using errcode='22023',message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  select * into v_rfq from public.trade_rfqs where buyer_id=v_buyer and idempotency_key=p_idempotency_key;
  if found then return v_rfq; end if;
  insert into public.trade_rfqs(buyer_id,title,specifications,currency,budget,deadline,status,idempotency_key)
  values(v_buyer,trim(p_title),coalesce(p_specifications,'{}'::jsonb),v_currency,p_budget,p_deadline,'published',p_idempotency_key)
  returning * into v_rfq;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,to_status)
  values(v_buyer,'rfq',v_rfq.id,'published');
  return v_rfq;
exception when unique_violation then
  select * into v_rfq from public.trade_rfqs where buyer_id=v_buyer and idempotency_key=p_idempotency_key;
  if found then return v_rfq; end if;
  raise;
end;
$$;

create or replace function public.submit_trade_rfq_quote(
  p_rfq_id uuid,
  p_amount numeric,
  p_currency text,
  p_incoterm text,
  p_proposal jsonb
)
returns public.trade_rfq_quotes language plpgsql security definer set search_path = '' as $$
declare v_seller uuid:=auth.uid(); v_rfq public.trade_rfqs; v_quote public.trade_rfq_quotes; v_currency text:=upper(trim(p_currency));
begin
  if v_seller is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
  select * into v_rfq from public.trade_rfqs where id=p_rfq_id for share;
  if not found then raise exception using errcode='P0002',message='RFQ_NOT_FOUND'; end if;
  if v_rfq.buyer_id=v_seller or v_rfq.status not in ('published','evaluating') then raise exception using errcode='42501',message='RFQ_NOT_OPEN'; end if;
  if p_amount<0 or v_currency<>v_rfq.currency then raise exception using errcode='22023',message='INVALID_QUOTE_TERMS'; end if;
  if p_incoterm is not null and (char_length(p_incoterm)>20 or p_incoterm !~ '^[A-Z0-9 -]+$') then raise exception using errcode='22023',message='INVALID_INCOTERM'; end if;
  insert into public.trade_rfq_quotes(rfq_id,seller_id,amount,currency,incoterm,proposal,status)
  values(v_rfq.id,v_seller,p_amount,v_currency,nullif(trim(p_incoterm),''),coalesce(p_proposal,'{}'::jsonb),'submitted')
  on conflict(rfq_id,seller_id) do update set
    amount=excluded.amount,currency=excluded.currency,incoterm=excluded.incoterm,proposal=excluded.proposal,status='submitted'
  returning * into v_quote;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,to_status,metadata)
  values(v_seller,'quote',v_quote.id,'submitted',jsonb_build_object('rfq_id',v_rfq.id));
  return v_quote;
end;
$$;

create or replace function public.create_commerce_order(
  p_seller_id uuid,
  p_currency text,
  p_items jsonb,
  p_metadata jsonb,
  p_idempotency_key text
)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare
  v_buyer uuid := auth.uid();
  v_currency text := upper(trim(p_currency));
  v_item jsonb;
  v_product public.products;
  v_quantity integer;
  v_total numeric(20,6) := 0;
  v_order public.orders;
begin
  if v_buyer is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
  if p_seller_id is null or p_seller_id=v_buyer then raise exception using errcode='22023',message='INVALID_SELLER'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception using errcode='22023',message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  if v_currency !~ '^[A-Z0-9]{3,8}$' then raise exception using errcode='22023',message='INVALID_CURRENCY'; end if;
  if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 100 then
    raise exception using errcode='22023',message='INVALID_ORDER_ITEMS';
  end if;

  select * into v_order from public.orders
  where buyer_id=v_buyer and idempotency_key=p_idempotency_key;
  if found then return v_order; end if;

  for v_item in select value from jsonb_array_elements(p_items) as item(value) loop
    begin
      v_quantity := (v_item->>'quantity')::integer;
      select * into strict v_product from public.products
      where id=(v_item->>'product_id')::uuid for share;
    exception
      when invalid_text_representation or no_data_found then
        raise exception using errcode='22023',message='INVALID_PRODUCT';
    end;
    if v_quantity<1 or not v_product.is_active or v_product.seller_id<>p_seller_id
       or upper(v_product.currency)<>v_currency or v_quantity<v_product.min_order_quantity
       or v_product.price<=0 or (v_product.stock_available is not null and v_quantity>v_product.stock_available) then
      raise exception using errcode='22023',message='INVALID_ORDER_ITEM';
    end if;
    v_total := v_total + (v_product.price * v_quantity);
  end loop;

  insert into public.orders(buyer_id,seller_id,total_amount,currency,status,idempotency_key,metadata)
  values(v_buyer,p_seller_id,v_total,v_currency,'pending',p_idempotency_key,coalesce(p_metadata,'{}'::jsonb))
  returning * into v_order;

  for v_item in select value from jsonb_array_elements(p_items) as item(value) loop
    select * into strict v_product from public.products where id=(v_item->>'product_id')::uuid;
    v_quantity := (v_item->>'quantity')::integer;
    insert into public.order_items(order_id,product_id,quantity,unit_price)
    values(v_order.id,v_product.id,v_quantity,v_product.price);
    if v_product.stock_available is not null then
      update public.products set stock_available=stock_available-v_quantity,updated_at=timezone('utc',now())
      where id=v_product.id;
    end if;
  end loop;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,to_status,metadata)
  values(v_buyer,'order',v_order.id,'pending',jsonb_build_object('item_count',jsonb_array_length(p_items)));
  return v_order;
exception
  when unique_violation then
    select * into v_order from public.orders where buyer_id=v_buyer and idempotency_key=p_idempotency_key;
    if found then return v_order; end if;
    raise;
end;
$$;

create or replace function public.create_commerce_escrow(p_order_id uuid, p_idempotency_key text)
returns public.commerce_escrows language plpgsql security definer set search_path = '' as $$
declare v_order public.orders; v_escrow public.commerce_escrows;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='AUTH_REQUIRED'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception using errcode='22023',message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  select * into v_order from public.orders where id = p_order_id for update;
  if not found then raise exception using errcode='P0002', message='ORDER_NOT_FOUND'; end if;
  if v_order.buyer_id <> auth.uid() then raise exception using errcode='42501', message='FORBIDDEN'; end if;
  if v_order.status <> 'pending' then raise exception using errcode='40001', message='ORDER_STATUS_CONFLICT'; end if;
  if v_order.seller_id is null then raise exception using errcode='22023', message='ORDER_SELLER_REQUIRED'; end if;
  if v_order.total_amount <= 0 then raise exception using errcode='22023', message='INVALID_AMOUNT'; end if;
  select * into v_escrow from public.commerce_escrows where order_id=v_order.id;
  if found then return v_escrow; end if;
  insert into public.commerce_escrows(order_id,buyer_id,seller_id,amount,currency,idempotency_key)
  values(v_order.id,v_order.buyer_id,v_order.seller_id,v_order.total_amount,v_order.currency,p_idempotency_key)
  on conflict (buyer_id,idempotency_key) do update set idempotency_key=excluded.idempotency_key
  returning * into v_escrow;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,to_status)
  values(auth.uid(),'escrow',v_escrow.id,'awaiting_funds');
  return v_escrow;
end;
$$;

create or replace function public.fund_commerce_escrow(p_escrow_id uuid, p_idempotency_key text)
returns public.commerce_escrows language plpgsql security definer set search_path = '' as $$
declare v_escrow public.commerce_escrows; v_balance numeric; v_tx uuid; v_order_status text; v_existing public.wallet_transactions;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='AUTH_REQUIRED'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception using errcode='22023',message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  select * into v_escrow from public.commerce_escrows where id=p_escrow_id for update;
  if not found then raise exception using errcode='P0002', message='ESCROW_NOT_FOUND'; end if;
  if v_escrow.buyer_id <> auth.uid() then raise exception using errcode='42501', message='FORBIDDEN'; end if;
  if v_escrow.status = 'funded' then return v_escrow; end if;
  if v_escrow.status <> 'awaiting_funds' then raise exception using errcode='40001', message='ESCROW_STATUS_CONFLICT'; end if;
  select status into v_order_status from public.orders where id=v_escrow.order_id for update;
  if v_order_status<>'pending' then raise exception using errcode='40001',message='ORDER_STATUS_CONFLICT'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_escrow.buyer_id::text || ':' || v_escrow.currency,0));
  select coalesce(sum(w.amount),0) into v_balance from public.wallet_transactions w
  where w.user_id=v_escrow.buyer_id and w.currency=v_escrow.currency;
  if v_balance < v_escrow.amount then raise exception using errcode='P0001', message='INSUFFICIENT_FUNDS'; end if;
  select * into v_existing from public.wallet_transactions
  where user_id=v_escrow.buyer_id and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.type<>'escrow_hold' or v_existing.amount<>-v_escrow.amount
       or v_existing.currency<>v_escrow.currency or v_existing.metadata->>'escrow_id'<>v_escrow.id::text then
      raise exception using errcode='22023',message='IDEMPOTENCY_CONFLICT';
    end if;
    v_tx:=v_existing.id;
  else
    insert into public.wallet_transactions(user_id,type,amount,currency,reference,idempotency_key,created_by,metadata)
    values(v_escrow.buyer_id,'escrow_hold',-v_escrow.amount,v_escrow.currency,'escrow:'||v_escrow.id,p_idempotency_key,auth.uid(),jsonb_build_object('escrow_id',v_escrow.id))
    returning id into v_tx;
  end if;
  update public.commerce_escrows set status='funded',hold_transaction_id=v_tx where id=v_escrow.id returning * into v_escrow;
  update public.orders set status='paid',updated_at=timezone('utc',now()) where id=v_escrow.order_id;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,from_status,to_status)
  values(auth.uid(),'escrow',v_escrow.id,'awaiting_funds','funded');
  return v_escrow;
end;
$$;

create or replace function public.settle_commerce_escrow(p_escrow_id uuid, p_action text, p_idempotency_key text)
returns public.commerce_escrows language plpgsql security definer set search_path = '' as $$
declare v_escrow public.commerce_escrows; v_tx uuid; v_recipient uuid; v_type text; v_next text; v_order_status text; v_existing public.wallet_transactions;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='AUTH_REQUIRED'; end if;
  if nullif(trim(p_idempotency_key),'') is null then raise exception using errcode='22023',message='IDEMPOTENCY_KEY_REQUIRED'; end if;
  select * into v_escrow from public.commerce_escrows where id=p_escrow_id for update;
  if not found then raise exception using errcode='P0002', message='ESCROW_NOT_FOUND'; end if;
  select status into v_order_status from public.orders where id=v_escrow.order_id for update;
  if p_action='release' then
    if auth.uid() <> v_escrow.buyer_id and not public.is_platform_admin() then raise exception using errcode='42501', message='FORBIDDEN'; end if;
    if v_escrow.status='released' then return v_escrow; end if;
    if v_escrow.status not in ('funded','release_requested') or v_order_status<>'shipped' then raise exception using errcode='40001', message='ESCROW_STATUS_CONFLICT'; end if;
    v_recipient:=v_escrow.seller_id; v_type:='escrow_release'; v_next:='released';
  elsif p_action='refund' then
    if not public.is_platform_admin() then raise exception using errcode='42501', message='FORBIDDEN'; end if;
    if v_escrow.status='refunded' then return v_escrow; end if;
    if v_escrow.status not in ('refund_requested','disputed') then raise exception using errcode='40001', message='ESCROW_STATUS_CONFLICT'; end if;
    v_recipient:=v_escrow.buyer_id; v_type:='credit'; v_next:='refunded';
  else raise exception using errcode='22023', message='INVALID_ESCROW_ACTION';
  end if;
  select * into v_existing from public.wallet_transactions where user_id=v_recipient and idempotency_key=p_idempotency_key;
  if found then
    if v_existing.type<>v_type or v_existing.amount<>v_escrow.amount
       or v_existing.currency<>v_escrow.currency or v_existing.metadata->>'escrow_id'<>v_escrow.id::text then
      raise exception using errcode='22023',message='IDEMPOTENCY_CONFLICT';
    end if;
    v_tx:=v_existing.id;
  else
    insert into public.wallet_transactions(user_id,type,amount,currency,reference,idempotency_key,created_by,metadata)
    values(v_recipient,v_type,v_escrow.amount,v_escrow.currency,'escrow:'||v_escrow.id,p_idempotency_key,auth.uid(),jsonb_build_object('kind',case when p_action='refund' then 'escrow_refund' else 'escrow_release' end,'escrow_id',v_escrow.id))
    returning id into v_tx;
  end if;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,from_status,to_status)
  values(auth.uid(),'escrow',v_escrow.id,v_escrow.status,v_next);
  update public.commerce_escrows set status=v_next,settlement_transaction_id=v_tx where id=v_escrow.id returning * into v_escrow;
  update public.orders set status=case when v_next='released' then 'completed' else 'cancelled' end,updated_at=timezone('utc',now()) where id=v_escrow.order_id;
  if v_next='refunded' then
    update public.products p set stock_available=p.stock_available+i.quantity,updated_at=timezone('utc',now())
    from public.order_items i where i.order_id=v_escrow.order_id and i.product_id=p.id and p.stock_available is not null;
  end if;
  return v_escrow;
end;
$$;

create or replace function public.request_commerce_escrow_action(p_escrow_id uuid, p_action text)
returns public.commerce_escrows language plpgsql security definer set search_path = '' as $$
declare v_escrow public.commerce_escrows; v_next text; v_order_status text;
begin
  if auth.uid() is null then raise exception using errcode='42501',message='AUTH_REQUIRED'; end if;
  select * into v_escrow from public.commerce_escrows where id=p_escrow_id for update;
  if not found then raise exception using errcode='P0002',message='ESCROW_NOT_FOUND'; end if;
  select status into v_order_status from public.orders where id=v_escrow.order_id;
  if p_action='release' then
    if v_escrow.status='release_requested' and auth.uid()=v_escrow.seller_id then return v_escrow; end if;
    if auth.uid()<>v_escrow.seller_id or v_escrow.status<>'funded' or v_order_status<>'shipped' then
      raise exception using errcode='42501',message='ESCROW_RELEASE_REQUEST_FORBIDDEN';
    end if;
    v_next:='release_requested';
  elsif p_action='refund' then
    if v_escrow.status='refund_requested' and auth.uid()=v_escrow.buyer_id then return v_escrow; end if;
    if auth.uid()<>v_escrow.buyer_id or v_escrow.status not in ('funded','release_requested') then
      raise exception using errcode='42501',message='ESCROW_REFUND_REQUEST_FORBIDDEN';
    end if;
    v_next:='refund_requested';
  elsif p_action='dispute' then
    if v_escrow.status='disputed' and auth.uid() in (v_escrow.buyer_id,v_escrow.seller_id) then return v_escrow; end if;
    if (auth.uid()<>v_escrow.buyer_id and auth.uid()<>v_escrow.seller_id)
       or v_escrow.status not in ('funded','release_requested','refund_requested') then
      raise exception using errcode='42501',message='ESCROW_DISPUTE_FORBIDDEN';
    end if;
    v_next:='disputed';
  else raise exception using errcode='22023',message='INVALID_ESCROW_ACTION';
  end if;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,from_status,to_status)
  values(auth.uid(),'escrow',v_escrow.id,v_escrow.status,v_next);
  update public.commerce_escrows set status=v_next where id=v_escrow.id returning * into v_escrow;
  return v_escrow;
end;
$$;

create or replace function public.transition_commerce_order(p_order_id uuid,p_expected_status text,p_next_status text,p_metadata jsonb default '{}'::jsonb)
returns public.orders language plpgsql security definer set search_path = '' as $$
declare v_order public.orders; v_allowed boolean;
begin
  if auth.uid() is null then raise exception using errcode='42501', message='AUTH_REQUIRED'; end if;
  select * into v_order from public.orders where id=p_order_id for update;
  if not found then raise exception using errcode='P0002', message='ORDER_NOT_FOUND'; end if;
  if auth.uid()<>v_order.buyer_id and (v_order.seller_id is null or auth.uid()<>v_order.seller_id) and not public.is_platform_admin() then raise exception using errcode='42501',message='FORBIDDEN'; end if;
  if v_order.status<>p_expected_status then raise exception using errcode='40001',message='ORDER_STATUS_CONFLICT'; end if;
  v_allowed:=case p_expected_status
    when 'pending' then p_next_status='cancelled' and (auth.uid()=v_order.buyer_id or public.is_platform_admin())
    when 'paid' then p_next_status='shipped' and (auth.uid()=v_order.seller_id or public.is_platform_admin())
    else false end;
  if not v_allowed then raise exception using errcode='22023',message='INVALID_ORDER_TRANSITION'; end if;
  update public.orders set status=p_next_status,updated_at=timezone('utc',now()) where id=p_order_id returning * into v_order;
  if p_expected_status='pending' and p_next_status='cancelled' then
    update public.products p set stock_available=p.stock_available+i.quantity,updated_at=timezone('utc',now())
    from public.order_items i where i.order_id=p_order_id and i.product_id=p.id and p.stock_available is not null;
  end if;
  insert into public.commerce_audit_events(actor_id,entity_type,entity_id,from_status,to_status,metadata)
  values(auth.uid(),'order',p_order_id,p_expected_status,p_next_status,coalesce(p_metadata,'{}'::jsonb));
  return v_order;
end;
$$;

revoke all on function public.create_commerce_order(uuid,text,jsonb,jsonb,text) from public, anon, authenticated;
revoke all on function public.create_trade_rfq(text,jsonb,text,numeric,timestamptz,text) from public, anon, authenticated;
revoke all on function public.submit_trade_rfq_quote(uuid,numeric,text,text,jsonb) from public, anon, authenticated;
revoke all on function public.create_commerce_escrow(uuid,text) from public, anon, authenticated;
revoke all on function public.fund_commerce_escrow(uuid,text) from public, anon, authenticated;
revoke all on function public.settle_commerce_escrow(uuid,text,text) from public, anon, authenticated;
revoke all on function public.request_commerce_escrow_action(uuid,text) from public, anon, authenticated;
revoke all on function public.transition_commerce_order(uuid,text,text,jsonb) from public, anon, authenticated;
grant execute on function public.create_commerce_order(uuid,text,jsonb,jsonb,text) to authenticated;
grant execute on function public.create_trade_rfq(text,jsonb,text,numeric,timestamptz,text) to authenticated;
grant execute on function public.submit_trade_rfq_quote(uuid,numeric,text,text,jsonb) to authenticated;
grant execute on function public.create_commerce_escrow(uuid,text) to authenticated;
grant execute on function public.fund_commerce_escrow(uuid,text) to authenticated;
grant execute on function public.settle_commerce_escrow(uuid,text,text) to authenticated;
grant execute on function public.request_commerce_escrow_action(uuid,text) to authenticated;
grant execute on function public.transition_commerce_order(uuid,text,text,jsonb) to authenticated;
revoke all on table public.trade_rfqs,public.trade_rfq_quotes,public.commerce_escrows,public.commerce_audit_events from anon, authenticated;
grant select on table public.trade_rfqs,public.trade_rfq_quotes,public.commerce_escrows,public.commerce_audit_events to authenticated;

commit;
