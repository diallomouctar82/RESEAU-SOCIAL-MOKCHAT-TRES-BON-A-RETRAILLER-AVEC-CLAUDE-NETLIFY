
create or replace function public.__debug_live_sessions_insert()
returns trigger language plpgsql as $$
begin
  raise exception 'DEBUG host_id=% auth_uid=% match=% current_user=% jwt_claim_sub=%',
    new.host_id, auth.uid(), (new.host_id = auth.uid()), current_user,
    current_setting('request.jwt.claim.sub', true);
end;
$$;
create trigger __debug_live_sessions_insert before insert on public.live_sessions
for each row execute function public.__debug_live_sessions_insert();
