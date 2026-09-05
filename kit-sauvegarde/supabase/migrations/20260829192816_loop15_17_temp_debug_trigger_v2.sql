
create or replace function public.__debug_live_sessions_insert()
returns trigger language plpgsql as $$
begin
  if new.host_id = auth.uid() then
    return new;
  end if;
  raise exception 'DEBUG MISMATCH host_id=% auth_uid=%', new.host_id, auth.uid();
end;
$$;
