-- VF-1 (sonnerie hors application) : auto-provisionnement de la clé VAPID
-- par la fonction Edge push-notify (rôle service). La clé privée est générée
-- côté serveur (WebCrypto) et rangée dans le Vault par cette fonction : elle
-- ne transite jamais par une requête SQL ni par le navigateur.

create or replace function public.store_push_vapid_internal(
  p_public_key text,
  p_private_jwk text,
  p_subject text
)
returns text
language plpgsql
security definer
set search_path = public, vault
as $$
declare
  v_existing text;
  v_secret_id uuid;
begin
  -- Idempotent : une configuration existante n'est jamais écrasée.
  select public_key into v_existing from public.push_vapid_config where id = 'default';
  if v_existing is not null then
    return v_existing;
  end if;
  if p_public_key is null or length(p_public_key) < 80
     or p_private_jwk is null or p_private_jwk !~ '"d"' then
    raise exception 'Clé VAPID invalide';
  end if;
  v_secret_id := vault.create_secret(
    p_private_jwk,
    'push_vapid_private_' || to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS'),
    'Clé privée VAPID (Web Push) — générée par push-notify, jamais exposée'
  );
  insert into public.push_vapid_config (id, public_key, subject, vault_secret_id)
  values ('default', p_public_key, coalesce(nullif(p_subject, ''), 'https://moknet.net'), v_secret_id);
  return p_public_key;
exception when unique_violation then
  -- Deux premiers appels simultanés : le second renvoie la clé du premier.
  select public_key into v_existing from public.push_vapid_config where id = 'default';
  return v_existing;
end;
$$;

revoke all on function public.store_push_vapid_internal(text, text, text) from public, anon, authenticated;
grant execute on function public.store_push_vapid_internal(text, text, text) to service_role;

-- Journal des envois push : preuve d'envoi réel + diagnostic (statut renvoyé
-- par le service de push du navigateur). Aucune policy : réservé au rôle
-- service (push-notify) et à l'administration SQL.
create table if not exists public.push_delivery_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  topic text not null,
  call_id text,
  endpoint_host text,
  status_code integer,
  ok boolean not null default false,
  error text,
  duration_ms integer,
  created_at timestamptz not null default now()
);
alter table public.push_delivery_log enable row level security;
revoke all on table public.push_delivery_log from anon, authenticated;
create index if not exists push_delivery_log_user_created_idx
  on public.push_delivery_log (user_id, created_at desc);

comment on table public.push_delivery_log is
  'Journal des notifications push (Web Push) envoyées par la fonction Edge push-notify : une ligne par abonnement ciblé, avec le statut HTTP réel du service de push.';
