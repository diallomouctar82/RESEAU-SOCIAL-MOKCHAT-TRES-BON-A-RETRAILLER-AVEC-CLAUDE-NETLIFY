-- Corrects core RLS correlation bugs, narrows grants, and provisions durable
-- social/profile media. Policies use parameterized helpers instead of ambiguous aliases.

begin;

-- Enforce RLS on every table in the partial Auth/Social/MokChat text scope.
alter table public.profiles enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_badges enable row level security;
alter table public.posts enable row level security;
alter table public.post_documents enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.stories enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_participants enable row level security;
alter table public.messages enable row level security;
alter table public.message_reactions enable row level security;
alter table public.user_presence enable row level security;
alter table public.user_blocks enable row level security;
alter table public.abuse_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- Replace every policy on these tables so no tautological live predicate remains.
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = any(array[
        'profiles','profile_skills','profile_badges','posts','post_documents',
        'comments','post_reactions','stories','conversations',
        'conversation_participants','messages','message_reactions','user_presence',
        'user_blocks','abuse_reports','notifications','audit_logs'
      ])
  loop
    execute format('drop policy if exists %I on %I.%I', r.policyname, r.schemaname, r.tablename);
  end loop;
end;
$$;

-- Profiles: full rows are only visible to the owner or administrators. The
-- directory uses search_public_profiles(), which returns a safe projection.
create policy profiles_select_self_or_admin on public.profiles
for select to authenticated
using (id = (select auth.uid()) or public.is_admin());
create policy profiles_update_self on public.profiles
for update to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

create policy profile_skills_select_self_or_admin on public.profile_skills
for select to authenticated
using (profile_id = (select auth.uid()) or public.is_admin());
create policy profile_skills_insert_self on public.profile_skills
for insert to authenticated
with check (profile_id = (select auth.uid()));
create policy profile_skills_update_self on public.profile_skills
for update to authenticated
using (profile_id = (select auth.uid()))
with check (profile_id = (select auth.uid()));
create policy profile_skills_delete_self on public.profile_skills
for delete to authenticated
using (profile_id = (select auth.uid()));

create policy profile_badges_select_self_or_admin on public.profile_badges
for select to authenticated
using (profile_id = (select auth.uid()) or public.is_admin());

-- Social domain.
create policy posts_select_visible on public.posts
for select to authenticated
using (private.can_view_post(id));
create policy posts_insert_self on public.posts
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (media_bucket is null or media_bucket = 'social-media')
  and (media_path is null or split_part(media_path, '/', 1) = (select auth.uid())::text)
);
create policy posts_update_self_or_admin on public.posts
for update to authenticated
using (author_id = (select auth.uid()) or public.is_admin())
with check (
  (author_id = (select auth.uid()) or public.is_admin())
  and (media_bucket is null or media_bucket = 'social-media')
);
create policy posts_delete_self_or_admin on public.posts
for delete to authenticated
using (author_id = (select auth.uid()) or public.is_admin());

create policy post_documents_select_visible on public.post_documents
for select to authenticated
using (private.can_view_post(post_id));
create policy post_documents_insert_owner on public.post_documents
for insert to authenticated
with check (
  exists (
    select 1 from public.posts p
    where p.id = post_documents.post_id and p.author_id = (select auth.uid())
  )
  and (bucket_id is null or bucket_id = 'social-media')
);
create policy post_documents_update_owner on public.post_documents
for update to authenticated
using (exists (select 1 from public.posts p where p.id = post_documents.post_id and p.author_id = (select auth.uid())))
with check (exists (select 1 from public.posts p where p.id = post_documents.post_id and p.author_id = (select auth.uid())));
create policy post_documents_delete_owner_or_admin on public.post_documents
for delete to authenticated
using (
  exists (select 1 from public.posts p where p.id = post_documents.post_id and p.author_id = (select auth.uid()))
  or public.is_admin()
);

create policy comments_select_visible on public.comments
for select to authenticated
using (private.can_view_post(post_id));
create policy comments_insert_self on public.comments
for insert to authenticated
with check (author_id = (select auth.uid()) and private.can_view_post(post_id));
create policy comments_update_self on public.comments
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()) and private.can_view_post(post_id));
create policy comments_delete_self_or_admin on public.comments
for delete to authenticated
using (author_id = (select auth.uid()) or public.is_admin());

create policy post_reactions_select_visible on public.post_reactions
for select to authenticated
using (private.can_view_post(post_id));
create policy post_reactions_insert_self on public.post_reactions
for insert to authenticated
with check (user_id = (select auth.uid()) and private.can_view_post(post_id));
create policy post_reactions_delete_self on public.post_reactions
for delete to authenticated
using (user_id = (select auth.uid()));

create policy stories_select_visible on public.stories
for select to authenticated
using (private.can_view_story(id));
create policy stories_insert_self on public.stories
for insert to authenticated
with check (
  author_id = (select auth.uid())
  and (media_bucket is null or media_bucket = 'social-media')
  and (media_path is null or split_part(media_path, '/', 1) = (select auth.uid())::text)
);
create policy stories_update_self on public.stories
for update to authenticated
using (author_id = (select auth.uid()))
with check (author_id = (select auth.uid()));
create policy stories_delete_self_or_admin on public.stories
for delete to authenticated
using (author_id = (select auth.uid()) or public.is_admin());

-- Messaging. Each policy correlates against the row's explicit conversation id.
create policy conversations_select_member on public.conversations
for select to authenticated
using (private.is_conversation_member(id) or public.is_admin());
create policy conversations_update_manager on public.conversations
for update to authenticated
using (private.can_manage_conversation(id))
with check (private.can_manage_conversation(id));

create policy conversation_participants_select_member on public.conversation_participants
for select to authenticated
using (private.is_conversation_member(conversation_id) or public.is_admin());
create policy conversation_participants_update_self on public.conversation_participants
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));
create policy conversation_participants_delete_self_group on public.conversation_participants
for delete to authenticated
using (
  user_id = (select auth.uid())
  and exists (select 1 from public.conversations c where c.id = conversation_id and c.is_group)
);

create policy messages_select_member on public.messages
for select to authenticated
using (private.is_conversation_member(conversation_id) or public.is_admin());
create policy messages_insert_member on public.messages
for insert to authenticated
with check (
  sender_id = (select auth.uid())
  and private.is_conversation_member(conversation_id)
  and not private.conversation_has_block(conversation_id, sender_id)
);
create policy messages_update_sender on public.messages
for update to authenticated
using (sender_id = (select auth.uid()) and created_at >= now() - interval '24 hours')
with check (sender_id = (select auth.uid()) and private.is_conversation_member(conversation_id));

create policy message_reactions_select_member on public.message_reactions
for select to authenticated
using (exists (
  select 1 from public.messages m
  where m.id = message_reactions.message_id
    and private.is_conversation_member(m.conversation_id)
));
create policy message_reactions_insert_self on public.message_reactions
for insert to authenticated
with check (
  user_id = (select auth.uid())
  and exists (
    select 1 from public.messages m
    where m.id = message_reactions.message_id
      and private.is_conversation_member(m.conversation_id)
  )
);
create policy message_reactions_delete_self on public.message_reactions
for delete to authenticated
using (user_id = (select auth.uid()));

create policy user_presence_select_allowed on public.user_presence
for select to authenticated
using (private.can_view_presence(user_id));

create policy user_blocks_select_self on public.user_blocks
for select to authenticated
using (blocker_id = (select auth.uid()));
create policy user_blocks_insert_self on public.user_blocks
for insert to authenticated
with check (blocker_id = (select auth.uid()));
create policy user_blocks_delete_self on public.user_blocks
for delete to authenticated
using (blocker_id = (select auth.uid()));

-- Moderation, notifications and immutable audit records.
create policy abuse_reports_select_reporter_or_moderator on public.abuse_reports
for select to authenticated
using (reporter_id = (select auth.uid()) or private.is_moderator());
create policy abuse_reports_insert_reporter on public.abuse_reports
for insert to authenticated
with check (reporter_id = (select auth.uid()));
create policy abuse_reports_update_moderator on public.abuse_reports
for update to authenticated
using (private.is_moderator())
with check (private.is_moderator());

create policy notifications_select_owner_or_admin on public.notifications
for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
create policy notifications_update_owner_read_state on public.notifications
for update to authenticated
using (user_id = (select auth.uid()))
with check (user_id = (select auth.uid()));

create policy audit_logs_select_admin on public.audit_logs
for select to authenticated
using (public.is_admin());
-- ---------------------------------------------------------------------------
-- Durable Storage for the partial Social/Profile scope.
-- Profile media is public but writable only under {auth.uid()}/... .
-- ---------------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values
  ('social-media','social-media',false,262144000,array[
    'image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm',
    'audio/mpeg','audio/mp4','audio/webm','audio/ogg','application/pdf'
  ]),
  ('profile-media','profile-media',true,10485760,array[
    'image/jpeg','image/png','image/webp','image/gif'
  ])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create or replace function private.can_read_social_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.posts p
    where p.media_bucket = 'social-media'
      and p.media_path = p_name
      and private.can_view_post(p.id)
  ) or exists (
    select 1 from public.stories s
    where s.media_bucket = 'social-media'
      and s.media_path = p_name
      and private.can_view_story(s.id)
  ) or exists (
    select 1 from public.post_documents d
    where d.bucket_id = 'social-media'
      and d.object_path = p_name
      and private.can_view_post(d.post_id)
  );
$$;

do $$
declare r record;
begin
  for r in
    select policyname from pg_policies
    where schemaname='storage' and tablename='objects'
      and policyname = any(array[
        'mokchat_profile_media_read','mokchat_profile_media_insert',
        'mokchat_profile_media_update','mokchat_profile_media_delete',
        'mokchat_social_media_read','mokchat_social_media_insert',
        'mokchat_social_media_update','mokchat_social_media_delete'
      ])
  loop
    execute format('drop policy if exists %I on storage.objects', r.policyname);
  end loop;
end;
$$;

create policy mokchat_profile_media_read on storage.objects
for select to public using (bucket_id = 'profile-media');
create policy mokchat_profile_media_insert on storage.objects
for insert to authenticated
with check (
  bucket_id = 'profile-media'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
create policy mokchat_profile_media_update on storage.objects
for update to authenticated
using (bucket_id='profile-media' and owner_id=(select auth.uid())::text)
with check (bucket_id='profile-media' and owner_id=(select auth.uid())::text);
create policy mokchat_profile_media_delete on storage.objects
for delete to authenticated
using (bucket_id='profile-media' and owner_id=(select auth.uid())::text);

create policy mokchat_social_media_read on storage.objects
for select to authenticated
using (
  bucket_id='social-media'
  and (owner_id=(select auth.uid())::text or private.can_read_social_object(name) or public.is_admin())
);
create policy mokchat_social_media_insert on storage.objects
for insert to authenticated
with check (
  bucket_id='social-media'
  and (storage.foldername(name))[1]=(select auth.uid())::text
);
create policy mokchat_social_media_update on storage.objects
for update to authenticated
using (bucket_id='social-media' and owner_id=(select auth.uid())::text)
with check (bucket_id='social-media' and owner_id=(select auth.uid())::text);
create policy mokchat_social_media_delete on storage.objects
for delete to authenticated
using (bucket_id='social-media' and (owner_id=(select auth.uid())::text or public.is_admin()));

-- ---------------------------------------------------------------------------
-- Grants. Anonymous users get no Data API access; signed-in users get only the
-- operations used by the browser. Sensitive RPCs are service-role only.
-- ---------------------------------------------------------------------------
revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from public, anon, authenticated;
revoke execute on all functions in schema private from public, anon, authenticated;
alter default privileges in schema public revoke all on tables from anon;
alter default privileges in schema public revoke execute on functions from public, anon;

revoke all on table public.profiles from authenticated;
grant select on table public.profiles to authenticated;
grant select,insert,update,delete on table public.profile_skills to authenticated;
grant select on table public.profile_badges to authenticated;
grant select,insert,update,delete on table public.posts to authenticated;
grant select,insert,update,delete on table public.post_documents to authenticated;
grant select,insert,update,delete on table public.comments to authenticated;
grant select,insert,delete on table public.post_reactions to authenticated;
grant select,insert,update,delete on table public.stories to authenticated;
revoke all on table public.conversations from authenticated;
grant select,update (title,last_message_at,last_message_preview,updated_at) on table public.conversations to authenticated;
revoke all on table public.conversation_participants from authenticated;
grant select,delete on table public.conversation_participants to authenticated;
grant update (last_read_at,is_muted,is_pinned) on table public.conversation_participants to authenticated;
revoke all on table public.messages from authenticated;
grant select,insert on table public.messages to authenticated;
grant update (content,status,metadata,is_pinned,edited_at,deleted_at,updated_at) on table public.messages to authenticated;
grant select,insert,delete on table public.message_reactions to authenticated;
grant select on table public.user_presence to authenticated;
grant select,insert,delete on table public.user_blocks to authenticated;
grant select,insert on table public.abuse_reports to authenticated;
grant update (status,assigned_to,resolution,updated_at) on table public.abuse_reports to authenticated;
grant select on table public.notifications to authenticated;
grant update (read) on table public.notifications to authenticated;
grant select on table public.audit_logs to authenticated;

grant usage on schema private to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.search_public_profiles(text,integer) to authenticated;
grant execute on function public.get_public_profiles(uuid[]) to authenticated;
grant execute on function public.update_my_profile(jsonb) to authenticated;
grant execute on function public.admin_set_user_role(uuid,text,text) to authenticated;
grant execute on function public.admin_update_user_profile(uuid,jsonb,text) to authenticated;
grant execute on function public.create_conversation(uuid[],text,boolean) to authenticated;
grant execute on function public.add_conversation_member(uuid,uuid) to authenticated;
grant execute on function public.mark_conversation_read(uuid) to authenticated;
grant execute on function public.set_user_presence(text,text) to authenticated;
grant execute on function public.admin_update_abuse_report(uuid,text,text) to authenticated;
grant execute on function private.is_moderator() to authenticated;
grant execute on function private.is_conversation_member(uuid) to authenticated;
grant execute on function private.can_manage_conversation(uuid) to authenticated;
grant execute on function private.users_are_blocked(uuid,uuid) to authenticated;
grant execute on function private.conversation_has_block(uuid,uuid) to authenticated;
grant execute on function private.can_view_post(uuid) to authenticated;
grant execute on function private.can_view_story(uuid) to authenticated;
grant execute on function private.can_view_presence(uuid) to authenticated;
grant execute on function private.can_read_social_object(text) to authenticated;

grant execute on function public.award_xp_and_credits(uuid,integer,numeric) to service_role;
grant execute on function public.insert_wallet_transaction(uuid,text,numeric,text,text,text) to service_role;

-- Existing safe predicate/read RPCs remain available to signed-in users.
do $$
declare fn regprocedure;
begin
  foreach fn in array array[
    to_regprocedure('public.can_access_dossier(uuid)'),
    to_regprocedure('public.can_write_dossier(uuid)'),
    to_regprocedure('public.get_wallet_balance(uuid,text)')
  ]
  loop
    if fn is not null then execute format('grant execute on function %s to authenticated', fn); end if;
  end loop;
end;
$$;

-- Realtime publication is additive and idempotent.
do $$
declare v_table text;
begin
  foreach v_table in array array[
    'posts','comments','post_reactions','stories','messages','message_reactions',
    'user_presence','notifications'
  ]
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname='supabase_realtime' and schemaname='public' and tablename=v_table
    ) then
      execute format('alter publication supabase_realtime add table public.%I', v_table);
    end if;
  end loop;
end;
$$;

commit;
