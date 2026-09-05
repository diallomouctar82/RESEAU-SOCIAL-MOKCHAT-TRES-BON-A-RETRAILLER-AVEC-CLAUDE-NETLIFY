
-- Drop the SECURITY DEFINER view flagged as ERROR by the linter — a
-- public-subset view that bypasses base-table RLS is more risk than
-- this app needs. Simpler, safer design: any signed-in user can read
-- any profile row (standard for a social app's directory/mentions/
-- author-display needs), writes stay strictly owner+admin.
drop view if exists public.profile_cards;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
for select to authenticated
using (true);

-- Harden set_updated_at with an explicit search_path (linter WARN fix).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- handle_new_user / protect_profile_sensitive_columns are trigger-only
-- functions (Postgres already refuses to run them outside trigger
-- context), but revoke EXECUTE anyway so they don't appear as callable
-- RPC endpoints at all. is_admin() stays executable: it only ever
-- reports the caller's own admin status (auth.uid()-scoped), so it is
-- safe and useful for the frontend to call directly.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.protect_profile_sensitive_columns() from public, anon, authenticated;
