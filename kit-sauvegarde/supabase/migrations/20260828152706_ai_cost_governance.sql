-- Gouvernance des coûts IA : quotas gratuits en premier, plafonds journaliers et
-- mensuels, arrêt net au plafond, et traçabilité de CHAQUE décision de routage.

-- ── 1. Tarifs par modèle ─────────────────────────────────────────────────────
-- Coût pour un million de jetons, tel que publié par le fournisseur. À 0 pour
-- un modèle réellement gratuit : la dépense calculée reste alors nulle et ne
-- consomme aucun budget.
alter table public.ai_models
    add column if not exists input_cost_per_million  numeric(12,4) not null default 0,
    add column if not exists output_cost_per_million numeric(12,4) not null default 0;

-- ── 2. Palier tarifaire du fournisseur ───────────────────────────────────────
-- 'free' = offre gratuite ou quota gratuit ; essayé AVANT tout fournisseur
-- payant, à priorité égale.
alter table public.ai_providers
    add column if not exists cost_tier text not null default 'paid'
        check (cost_tier in ('free', 'paid'));

-- ── 3. Plafonds de dépense ───────────────────────────────────────────────────
-- Table à une seule ligne ('global'), volontairement extensible : une ligne par
-- fournisseur pourra être ajoutée plus tard sans changer le schéma.
create table if not exists public.ai_budget (
    id              text primary key default 'global',
    daily_cap_usd   numeric(12,2),
    monthly_cap_usd numeric(12,2),
    -- Interrupteur : à false, les plafonds sont ignorés (aucun blocage).
    enforced        boolean not null default true,
    updated_at      timestamptz not null default now()
);

insert into public.ai_budget (id, daily_cap_usd, monthly_cap_usd, enforced)
values ('global', null, null, true)
on conflict (id) do nothing;

alter table public.ai_budget enable row level security;
drop policy if exists ai_budget_read on public.ai_budget;
create policy ai_budget_read on public.ai_budget
    for select to authenticated using (public.is_admin());

-- ── 4. Journal d'audit : chaque décision de routage ──────────────────────────
-- On enrichit ai_call_log plutôt que de créer une seconde table : l'audit reste
-- ainsi consultable d'un seul endroit, et request_id regroupe toutes les
-- décisions prises pour UNE même requête (fournisseur retenu, écartés, échecs).
alter table public.ai_call_log
    add column if not exists request_id      uuid,
    add column if not exists decision        text,
    add column if not exists decision_reason text,
    add column if not exists input_tokens    integer,
    add column if not exists output_tokens   integer,
    add column if not exists cost_usd        numeric(12,6) not null default 0;

-- Le statut accueille désormais les décisions sans appel réseau.
alter table public.ai_call_log drop constraint if exists ai_call_log_status_check;
alter table public.ai_call_log add constraint ai_call_log_status_check
    check (status in ('success', 'error', 'skipped', 'blocked'));

create index if not exists ai_call_log_request_idx on public.ai_call_log(request_id);
create index if not exists ai_call_log_created_idx on public.ai_call_log(created_at desc);

-- ── 5. Dépense courante ──────────────────────────────────────────────────────
-- Fenêtres glissantes calendaires (jour et mois en cours, UTC).
create or replace function public.get_ai_spend()
returns table (spent_today numeric, spent_month numeric)
language sql
stable
security definer
set search_path = public
as $$
    select
        coalesce(sum(cost_usd) filter (where created_at >= date_trunc('day', now())), 0),
        coalesce(sum(cost_usd) filter (where created_at >= date_trunc('month', now())), 0)
    from public.ai_call_log;
$$;

-- ── 6. Pilotage administrateur ───────────────────────────────────────────────
create or replace function public.set_ai_budget(
    p_daily_cap numeric, p_monthly_cap numeric, p_enforced boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès réservé aux administrateurs.';
    end if;
    update public.ai_budget
       set daily_cap_usd = p_daily_cap,
           monthly_cap_usd = p_monthly_cap,
           enforced = p_enforced,
           updated_at = now()
     where id = 'global';
end;
$$;

create or replace function public.set_provider_cost_tier(p_provider_id text, p_tier text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès réservé aux administrateurs.';
    end if;
    if p_tier not in ('free', 'paid') then
        raise exception 'Palier invalide : attendu free ou paid.';
    end if;
    update public.ai_providers set cost_tier = p_tier, updated_at = now() where id = p_provider_id;
end;
$$;

create or replace function public.set_model_costs(
    p_provider_id text, p_model_id text, p_input numeric, p_output numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès réservé aux administrateurs.';
    end if;
    update public.ai_models
       set input_cost_per_million = p_input,
           output_cost_per_million = p_output,
           updated_at = now()
     where provider_id = p_provider_id and model_id = p_model_id;
end;
$$;

revoke all on function public.set_ai_budget(numeric, numeric, boolean) from public, anon;
revoke all on function public.set_provider_cost_tier(text, text) from public, anon;
revoke all on function public.set_model_costs(text, text, numeric, numeric) from public, anon;
grant execute on function public.set_ai_budget(numeric, numeric, boolean) to authenticated;
grant execute on function public.set_provider_cost_tier(text, text) to authenticated;
grant execute on function public.set_model_costs(text, text, numeric, numeric) to authenticated;
grant execute on function public.get_ai_spend() to authenticated, service_role;
