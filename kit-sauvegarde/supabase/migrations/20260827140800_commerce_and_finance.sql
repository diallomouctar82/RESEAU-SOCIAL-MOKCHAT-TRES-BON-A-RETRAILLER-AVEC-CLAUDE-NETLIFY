
-- ═══════════════════════════════════════════════════════════
-- COMMERCE (minimal — boutique + commandes, pas le Trade B2B)
-- ═══════════════════════════════════════════════════════════

create table public.shops (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  banner_url text,
  revenue numeric not null default 0,
  sales_count integer not null default 0,
  ai_config jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (owner_id)
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references public.shops(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete set null,
  title text not null,
  description text,
  price numeric not null default 0,
  currency text not null default 'EUR',
  category text check (category in ('Digital','Service','Physique')),
  image_url text,
  rating numeric default 0,
  reviews_count integer default 0,
  seller_country text,
  seller_flag text,
  seller_verified boolean default false,
  dimension_type text check (dimension_type in ('B2C','B2B','C2C')),
  min_order_quantity integer,
  unit text,
  stock_available integer,
  origin_country text,
  lead_time_days integer,
  shipping_available boolean default false,
  is_service boolean default false,
  service_details jsonb,
  linked_reel_id text,
  linked_live_id uuid references public.live_sessions(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  buyer_id uuid not null references public.profiles(id) on delete cascade,
  seller_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending','paid','shipped','completed','cancelled')),
  total_amount numeric not null default 0,
  currency text not null default 'EUR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete restrict,
  quantity integer not null default 1,
  unit_price numeric not null,
  created_at timestamptz not null default now()
);

create index idx_products_shop on public.products(shop_id);
create index idx_products_seller on public.products(seller_id);
create index idx_orders_buyer on public.orders(buyer_id);
create index idx_orders_seller on public.orders(seller_id);
create index idx_order_items_order on public.order_items(order_id);

create trigger trg_shops_updated_at before update on public.shops for each row execute function public.set_updated_at();
create trigger trg_products_updated_at before update on public.products for each row execute function public.set_updated_at();
create trigger trg_orders_updated_at before update on public.orders for each row execute function public.set_updated_at();

alter table public.shops enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

create policy "shops_select_authenticated" on public.shops for select to authenticated using (true);
create policy "shops_write_owner" on public.shops for all to authenticated using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid());

create policy "products_select_active_or_owner" on public.products for select to authenticated
using (is_active or seller_id = auth.uid() or public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));
create policy "products_write_owner" on public.products for all to authenticated
using (seller_id = auth.uid() or public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()))
with check (seller_id = auth.uid() or public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = auth.uid()));

create policy "orders_select_buyer_or_seller" on public.orders for select to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());
create policy "orders_insert_buyer" on public.orders for insert to authenticated with check (buyer_id = auth.uid());
create policy "orders_update_buyer_or_seller" on public.orders for update to authenticated
using (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin())
with check (buyer_id = auth.uid() or seller_id = auth.uid() or public.is_admin());

create policy "order_items_select" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = auth.uid() or o.seller_id = auth.uid() or public.is_admin())));
create policy "order_items_insert_buyer" on public.order_items for insert to authenticated
with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = auth.uid()));

-- ═══════════════════════════════════════════════════════════
-- FINANCE — solde dérivé, jamais stocké, jamais modifiable
-- directement par le client.
-- ═══════════════════════════════════════════════════════════
create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('credit','debit','escrow_hold','escrow_release')),
  amount numeric not null,
  currency text not null default 'Credits',
  reference text,
  created_at timestamptz not null default now()
);

create index idx_wallet_transactions_user on public.wallet_transactions(user_id, currency);

alter table public.wallet_transactions enable row level security;

create policy "wallet_transactions_select_own" on public.wallet_transactions for select to authenticated
using (user_id = auth.uid() or public.is_admin());
-- Pas de policy INSERT directe : uniquement via la fonction insert_wallet_transaction() ci-dessous.

create or replace function public.get_wallet_balance(p_user_id uuid, p_currency text default 'Credits')
returns numeric
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(sum(case when type in ('credit','escrow_release') then amount
                           when type in ('debit','escrow_hold') then -amount
                           else 0 end), 0)
  from public.wallet_transactions
  where user_id = p_user_id and currency = p_currency;
$$;

grant execute on function public.get_wallet_balance(uuid, text) to authenticated;

create or replace function public.insert_wallet_transaction(p_type text, p_amount numeric, p_currency text, p_reference text)
returns public.wallet_transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_row public.wallet_transactions;
begin
  if p_type in ('debit','escrow_hold') then
    v_balance := public.get_wallet_balance(auth.uid(), p_currency);
    if v_balance < p_amount then
      raise exception 'Solde insuffisant';
    end if;
  end if;

  insert into public.wallet_transactions (user_id, type, amount, currency, reference)
  values (auth.uid(), p_type, p_amount, p_currency, p_reference)
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.insert_wallet_transaction(text, numeric, text, text) to authenticated;

-- ═══════════════════════════════════════════════════════════
-- RPC centralisée pour ajuster credits/xp/level (colonnes
-- protégées de profiles) — jamais d'update direct côté client.
-- ═══════════════════════════════════════════════════════════
create or replace function public.award_xp_and_credits(p_user_id uuid, p_xp_delta integer, p_credits_delta numeric)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
begin
  if not (auth.uid() = p_user_id or public.is_admin()) then
    raise exception 'Non autorisé';
  end if;

  update public.profiles
  set xp = greatest(0, xp + p_xp_delta),
      credits = greatest(0, credits + p_credits_delta),
      level = case when xp + p_xp_delta >= next_level_xp then level + 1 else level end,
      next_level_xp = case when xp + p_xp_delta >= next_level_xp then next_level_xp + (level + 1) * 500 else next_level_xp end
  where id = p_user_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.award_xp_and_credits(uuid, integer, numeric) to authenticated;
