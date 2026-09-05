
-- ═══════════════════════════════════════════════════════════
-- SOCIAL: posts, documents attachés, commentaires (self-FK),
-- réactions (anti-doublon), stories.
-- ═══════════════════════════════════════════════════════════

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null default '',
  visibility text not null default 'public' check (visibility in ('public','private')),
  shares_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.post_documents (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  name text not null,
  url text not null,
  size bigint,
  type text,
  page_count integer,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  parent_comment_id uuid references public.comments(id) on delete cascade,
  content text not null,
  likes_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.post_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  media_url text not null,
  caption text,
  is_live boolean not null default false,
  viewers_count integer not null default 0,
  expires_at timestamptz not null default (now() + interval '24 hours'),
  created_at timestamptz not null default now()
);

create index idx_posts_author_id on public.posts(author_id);
create index idx_posts_created_at on public.posts(created_at desc);
create index idx_post_documents_post_id on public.post_documents(post_id);
create index idx_comments_post_id on public.comments(post_id);
create index idx_comments_parent_id on public.comments(parent_comment_id);
create index idx_post_reactions_post_id on public.post_reactions(post_id);
create index idx_stories_author_id on public.stories(author_id);
create index idx_stories_expires_at on public.stories(expires_at);

create trigger trg_posts_updated_at before update on public.posts
for each row execute function public.set_updated_at();

-- ═══════════════════════════════════════════════════════════
-- RLS
-- ═══════════════════════════════════════════════════════════
alter table public.posts enable row level security;
alter table public.post_documents enable row level security;
alter table public.comments enable row level security;
alter table public.post_reactions enable row level security;
alter table public.stories enable row level security;

create policy "posts_select_visible" on public.posts
for select to authenticated
using (visibility = 'public' or author_id = auth.uid() or public.is_admin());

create policy "posts_insert_own" on public.posts
for insert to authenticated with check (author_id = auth.uid());

create policy "posts_update_own_or_admin" on public.posts
for update to authenticated
using (author_id = auth.uid() or public.is_admin())
with check (author_id = auth.uid() or public.is_admin());

create policy "posts_delete_own_or_admin" on public.posts
for delete to authenticated
using (author_id = auth.uid() or public.is_admin());

create policy "post_documents_select_if_post_visible" on public.post_documents
for select to authenticated
using (exists (
  select 1 from public.posts p where p.id = post_id
  and (p.visibility = 'public' or p.author_id = auth.uid() or public.is_admin())
));

create policy "post_documents_write_if_post_owner" on public.post_documents
for all to authenticated
using (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()))
with check (exists (select 1 from public.posts p where p.id = post_id and p.author_id = auth.uid()));

create policy "comments_select_if_post_visible" on public.comments
for select to authenticated
using (exists (
  select 1 from public.posts p where p.id = post_id
  and (p.visibility = 'public' or p.author_id = auth.uid() or public.is_admin())
));

create policy "comments_insert_if_post_visible" on public.comments
for insert to authenticated with check (
  author_id = auth.uid()
  and exists (
    select 1 from public.posts p where p.id = post_id
    and (p.visibility = 'public' or p.author_id = auth.uid() or public.is_admin())
  )
);

create policy "comments_update_own" on public.comments
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "comments_delete_own_or_admin" on public.comments
for delete to authenticated using (author_id = auth.uid() or public.is_admin());

create policy "post_reactions_select_if_post_visible" on public.post_reactions
for select to authenticated
using (exists (
  select 1 from public.posts p where p.id = post_id
  and (p.visibility = 'public' or p.author_id = auth.uid() or public.is_admin())
));

create policy "post_reactions_insert_own" on public.post_reactions
for insert to authenticated with check (user_id = auth.uid());

create policy "post_reactions_delete_own" on public.post_reactions
for delete to authenticated using (user_id = auth.uid());

create policy "stories_select_authenticated" on public.stories
for select to authenticated using (true);

create policy "stories_insert_own" on public.stories
for insert to authenticated with check (author_id = auth.uid());

create policy "stories_update_own" on public.stories
for update to authenticated using (author_id = auth.uid()) with check (author_id = auth.uid());

create policy "stories_delete_own_or_admin" on public.stories
for delete to authenticated using (author_id = auth.uid() or public.is_admin());
