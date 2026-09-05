-- VALIDATION REFUSÉE (01/09/2026) — VF-1 (sonnerie hors application) + VF-4
-- (traduction en appel sur téléphone).
--
-- 1) Abonnements Web Push : un appel entrant ne dépendait que d'un broadcast
--    Supabase Realtime éphémère — onglet en arrière-plan ou application fermée,
--    le correspondant ne sonnait jamais. Chaque navigateur/appareil enregistre
--    son abonnement push ; l'Edge Function `push-notify` réveille l'appelé.
-- 2) Clés VAPID : clé publique lisible par tout utilisateur connecté (elle sert
--    à s'abonner), clé privée UNIQUEMENT dans Vault, lue par la fonction
--    service_role `get_push_vapid_internal` (même patron que
--    `get_live_transport_config_internal`).
-- 3) Fournisseur logique `gemini_stt` (parole → texte, catégorie voice) : la
--    reconnaissance vocale du navigateur (Web Speech) n'est ni fiable ni
--    disponible sur téléphone pendant un appel WebRTC ; la transcription passe
--    désormais par la passerelle avec la clé Gemini déjà configurée (même
--    principe que `gemini_tts`, migration voice_ao2_*).

-- ── 1) Abonnements push ──────────────────────────────────────────────────
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
comment on table public.push_subscriptions is
  'Abonnements Web Push (un par navigateur/appareil). Écrits par save_push_subscription (un endpoint appartient toujours au DERNIER compte connecté sur cet appareil). Lus par l''Edge Function push-notify (service_role).';
create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions(user_id);
alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_select_own on public.push_subscriptions;
create policy push_subscriptions_select_own on public.push_subscriptions
  for select to authenticated using (user_id = (select auth.uid()));
drop policy if exists push_subscriptions_delete_own on public.push_subscriptions;
create policy push_subscriptions_delete_own on public.push_subscriptions
  for delete to authenticated using (user_id = (select auth.uid()));
-- Aucune policy INSERT/UPDATE : l'écriture passe par save_push_subscription
-- (ci-dessous), qui réattribue proprement un endpoint changé de compte.
grant select, delete on public.push_subscriptions to authenticated;
revoke all on public.push_subscriptions from anon;

do $$
begin
  if not exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'set_updated_at') then
    create function public.set_updated_at() returns trigger language plpgsql as $f$
    begin new.updated_at = now(); return new; end $f$;
  end if;
end $$;
drop trigger if exists push_subscriptions_set_updated_at on public.push_subscriptions;
create trigger push_subscriptions_set_updated_at before update on public.push_subscriptions
  for each row execute function public.set_updated_at();

create or replace function public.save_push_subscription(
  p_endpoint text, p_p256dh text, p_auth text, p_user_agent text default null
) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentification requise.'; end if;
  if p_endpoint is null or length(p_endpoint) < 20 or length(p_endpoint) > 2048 then raise exception 'endpoint invalide'; end if;
  if p_p256dh is null or length(p_p256dh) < 80 or p_auth is null or length(p_auth) < 16 then raise exception 'clés d''abonnement invalides'; end if;
  -- Un endpoint est lié à UN navigateur : s'il appartenait à un autre compte
  -- (précédente session sur le même appareil), il change de propriétaire —
  -- jamais un appel poussé vers la personne déconnectée.
  delete from public.push_subscriptions where endpoint = p_endpoint and user_id <> auth.uid();
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth, user_agent)
  values (auth.uid(), p_endpoint, p_p256dh, p_auth, left(p_user_agent, 300))
  on conflict (endpoint) do update
    set p256dh = excluded.p256dh, auth = excluded.auth, user_agent = excluded.user_agent, last_seen_at = now()
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.save_push_subscription(text, text, text, text) from public, anon;
grant execute on function public.save_push_subscription(text, text, text, text) to authenticated;

-- ── 2) Configuration VAPID ────────────────────────────────────────────────
create table if not exists public.push_vapid_config (
  id text primary key default 'default',
  public_key text not null,
  subject text not null,
  vault_secret_id uuid not null,
  created_at timestamptz not null default now()
);
comment on table public.push_vapid_config is
  'Clé publique VAPID (lisible via get_push_public_key) + référence Vault de la clé privée (jamais en clair ici). Aucune policy : service_role uniquement.';
alter table public.push_vapid_config enable row level security;
revoke all on public.push_vapid_config from anon, authenticated;

create or replace function public.get_push_public_key() returns text
language sql stable security definer set search_path = public as $$
  select public_key from public.push_vapid_config where id = 'default';
$$;
revoke all on function public.get_push_public_key() from public, anon;
grant execute on function public.get_push_public_key() to authenticated;

create or replace function public.get_push_vapid_internal()
returns table(public_key text, private_jwk text, subject text)
language plpgsql security definer set search_path = public, vault as $$
begin
  return query
  select c.public_key, ds.decrypted_secret, c.subject
  from public.push_vapid_config c
  join vault.decrypted_secrets ds on ds.id = c.vault_secret_id
  where c.id = 'default';
end $$;
revoke all on function public.get_push_vapid_internal() from public, anon, authenticated;

-- ── 3) Fournisseur de transcription Gemini ────────────────────────────────
insert into public.ai_providers (id, category, display_name, adapter_kind, priority, status, cost_tier, docs_url, api_key_url)
values (
  'gemini_stt', 'voice', 'Gemini transcription (Google)', 'gemini_stt', 100, 'active', 'free',
  'https://ai.google.dev/gemini-api/docs/audio',
  'https://aistudio.google.com/apikey'
)
on conflict (id) do update set
  category = excluded.category,
  adapter_kind = excluded.adapter_kind,
  status = 'active';

insert into public.ai_models (provider_id, model_id, label, is_default, capabilities, input_cost_per_million, output_cost_per_million, cost_per_call)
select 'gemini_stt', 'gemini-2.5-flash', 'Gemini 2.5 Flash (transcription + traduction)', true, '["stt"]'::jsonb, 0.3, 2.5, 0
where not exists (
  select 1 from public.ai_models where provider_id = 'gemini_stt' and model_id = 'gemini-2.5-flash'
);

insert into public.ai_provider_credentials (provider_id, vault_secret_id, key_hint, is_enabled)
select 'gemini_stt', c.vault_secret_id, coalesce(c.key_hint, '') || ' (partagée avec Gemini)', true
from public.ai_provider_credentials c
where c.provider_id = 'gemini' and c.is_enabled
  and not exists (select 1 from public.ai_provider_credentials x where x.provider_id = 'gemini_stt')
limit 1;
