-- ═══════════════════════════════════════════════════════════════════════════
-- CORRECTIF DE SÉCURITÉ — deux failles réelles, prouvées avant correction.
--
-- FAILLE 1 (CRITIQUE) — `award_xp_and_credits` : garde neutralisé par la
-- logique ternaire SQL. `not (auth.uid() = p_user_id or is_admin())` vaut
-- NULL quand `auth.uid()` est NULL (appelant anonyme) ; un `if NULL then`
-- ne se déclenche pas, donc la mise à jour s'exécutait quand même.
-- Prouvé par évaluation directe de l'expression : le if ne part pas.
-- Conséquence : n'importe qui, avec la clé anonyme publique embarquée dans
-- le bundle, pouvait créditer XP et crédits sur n'importe quel compte.
--
-- FAILLE 2 — droit EXECUTE accordé par défaut à `anon` sur des fonctions
-- SECURITY DEFINER sensibles. Vérifié en conditions réelles : `get_ai_spend`
-- renvoyait les dépenses IA réelles et `get_ranked_ai_candidates` la
-- configuration des fournisseurs à un appelant NON authentifié.
--
-- Aucun droit n'est retiré à `authenticated` ni à `service_role` : les
-- appelants légitimes (écrans admin authentifiés, fonctions Edge en
-- service_role) sont inchangés.
-- ═══════════════════════════════════════════════════════════════════════════

-- ---------- FAILLE 1 : garde explicite contre l'appelant anonyme ----------
create or replace function public.award_xp_and_credits(
  p_user_id uuid, p_xp_delta integer, p_credits_delta numeric
) returns public.profiles
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row public.profiles;
  v_new_xp integer;
begin
  -- `auth.uid() is null` est testé EN PREMIER et séparément : sans cela,
  -- l'expression entière vaut NULL pour un appelant anonyme et le garde
  -- ne se déclenche pas (logique ternaire SQL).
  if auth.uid() is null then
    raise exception 'Non autorisé : authentification requise';
  end if;
  if not (auth.uid() = p_user_id or public.is_admin()) then
    raise exception 'Non autorisé';
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);

  select xp into v_new_xp from public.profiles where id = p_user_id;
  if v_new_xp is null then
    raise exception 'Profil introuvable';
  end if;
  v_new_xp := greatest(0, v_new_xp + p_xp_delta);

  update public.profiles
  set xp = v_new_xp,
      credits = greatest(0, credits + p_credits_delta),
      level = case when v_new_xp >= 1000 then 3 when v_new_xp >= 300 then 2 else 1 end,
      updated_at = now()
  where id = p_user_id
  returning * into v_row;

  return v_row;
end;
$function$;

-- ---------- FAILLE 2 : retrait du droit EXECUTE pour anon/public ----------
do $$
declare
  fn text;
  sensibles text[] := array[
    'award_xp_and_credits', 'insert_wallet_transaction', 'get_wallet_balance',
    'get_ai_spend', 'get_ranked_ai_candidates', 'get_agent_tools',
    'upsert_discovered_provider', 'get_public_profiles',
    'mark_conversation_read', 'can_access_dossier', 'can_write_dossier',
    'can_view_live_session', 'is_live_host', 'is_live_moderator_or_host',
    'is_admin', 'handle_follow_change', 'notify_friendship_event'
  ];
  r record;
begin
  foreach fn in array sensibles loop
    for r in
      select p.oid::regprocedure as sig
      from pg_proc p join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = fn
    loop
      execute format('revoke execute on function %s from anon', r.sig);
      execute format('revoke execute on function %s from public', r.sig);
    end loop;
  end loop;
end $$;
