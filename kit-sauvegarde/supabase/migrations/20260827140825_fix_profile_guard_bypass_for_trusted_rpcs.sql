
-- protect_profile_sensitive_columns reverted role/credits/xp/level on
-- EVERY update not made via the service_role JWT — but a SECURITY
-- DEFINER RPC called by a normal authenticated user still carries
-- auth.role() = 'authenticated' (SECURITY DEFINER changes execution
-- privileges, not the request's JWT role GUC). award_xp_and_credits()
-- would have silently no-op'd. Fix: a transaction-local escape-hatch
-- GUC that only trusted RPCs set right before their own UPDATE.
create or replace function public.protect_profile_sensitive_columns()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and coalesce(current_setting('app.bypass_profile_guard', true), '') <> 'on' then
    new.role := old.role;
    new.credits := old.credits;
    new.xp := old.xp;
    new.level := old.level;
    new.next_level_xp := old.next_level_xp;
  end if;
  return new;
end;
$$;

create or replace function public.award_xp_and_credits(p_user_id uuid, p_xp_delta integer, p_credits_delta numeric)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.profiles;
  v_new_xp integer;
begin
  if not (auth.uid() = p_user_id or public.is_admin()) then
    raise exception 'Non autorisé';
  end if;

  perform set_config('app.bypass_profile_guard', 'on', true);

  select xp into v_new_xp from public.profiles where id = p_user_id;
  v_new_xp := greatest(0, v_new_xp + p_xp_delta);

  update public.profiles
  set xp = v_new_xp,
      credits = greatest(0, credits + p_credits_delta),
      level = case when v_new_xp >= next_level_xp then level + 1 else level end,
      next_level_xp = case when v_new_xp >= next_level_xp then next_level_xp + (level + 1) * 500 else next_level_xp end
  where id = p_user_id
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.award_xp_and_credits(uuid, integer, numeric) to authenticated;
