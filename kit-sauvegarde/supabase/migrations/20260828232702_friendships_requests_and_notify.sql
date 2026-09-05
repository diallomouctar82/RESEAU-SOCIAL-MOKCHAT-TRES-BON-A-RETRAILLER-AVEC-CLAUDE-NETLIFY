create table public.friendships (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint friendships_no_self check (requester_id <> addressee_id)
);

create unique index friendships_unique_pair_idx
  on public.friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));

create index friendships_requester_idx on public.friendships (requester_id);
create index friendships_addressee_idx on public.friendships (addressee_id);

alter table public.friendships enable row level security;

create policy friendships_select_own on public.friendships
  for select to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create policy friendships_insert_own on public.friendships
  for insert to authenticated
  with check (requester_id = (select auth.uid()) and status = 'pending');

create policy friendships_update_addressee_accept on public.friendships
  for update to authenticated
  using (addressee_id = (select auth.uid()))
  with check (addressee_id = (select auth.uid()) and status = 'accepted');

create policy friendships_delete_own on public.friendships
  for delete to authenticated
  using (requester_id = (select auth.uid()) or addressee_id = (select auth.uid()));

create trigger trg_friendships_updated_at
  before update on public.friendships
  for each row execute function public.set_updated_at();

create or replace function public.notify_friendship_event()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requester_name text;
  addressee_name text;
begin
  if TG_OP = 'INSERT' then
    select name into requester_name from public.profiles where id = new.requester_id;
    insert into public.notifications (user_id, type, title, message, target_action)
    values (new.addressee_id, 'info', 'Nouvelle demande d''ami', coalesce(requester_name, 'Un membre') || ' souhaite vous ajouter en ami.', 'friend_requests');
  elsif TG_OP = 'UPDATE' and old.status = 'pending' and new.status = 'accepted' then
    select name into addressee_name from public.profiles where id = new.addressee_id;
    insert into public.notifications (user_id, type, title, message, target_action)
    values (new.requester_id, 'success', 'Demande d''ami acceptée', coalesce(addressee_name, 'Un membre') || ' a accepté votre demande d''ami.', 'friends');
  end if;
  return new;
end;
$$;

create trigger trg_friendship_notify
  after insert or update on public.friendships
  for each row execute function public.notify_friendship_event();
