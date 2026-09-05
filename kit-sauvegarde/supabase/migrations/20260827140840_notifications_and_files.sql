
-- ═══════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- ═══════════════════════════════════════════════════════════
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null default 'info' check (type in ('success','info','warning','alert')),
  title text not null,
  message text not null,
  priority text default 'normal',
  target_action text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_user_unread on public.notifications(user_id, read);

alter table public.notifications enable row level security;

create policy "notifications_owner" on public.notifications for all to authenticated
using (user_id = auth.uid() or public.is_admin()) with check (user_id = auth.uid() or public.is_admin());

alter publication supabase_realtime add table public.notifications;

-- ═══════════════════════════════════════════════════════════
-- FICHIERS — métadonnées (le stockage réel vit dans Supabase
-- Storage, buckets créés séparément). Digital Safe / Coffre-fort
-- était un stub vide côté code — première vraie implémentation.
-- ═══════════════════════════════════════════════════════════
create table public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  category text,
  storage_path text not null,
  file_size bigint,
  mime_type text,
  visibility text not null default 'private' check (visibility in ('private','shared')),
  expiry_date timestamptz,
  is_verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.document_shares (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  shared_with_user_id uuid not null references public.profiles(id) on delete cascade,
  permission text not null default 'read' check (permission in ('read','write')),
  created_at timestamptz not null default now(),
  unique (document_id, shared_with_user_id)
);

create index idx_documents_owner on public.documents(owner_id);
create index idx_document_shares_document on public.document_shares(document_id);
create index idx_document_shares_user on public.document_shares(shared_with_user_id);

alter table public.documents enable row level security;
alter table public.document_shares enable row level security;

create policy "documents_select" on public.documents for select to authenticated
using (owner_id = auth.uid() or public.is_admin()
  or exists (select 1 from public.document_shares s where s.document_id = id and s.shared_with_user_id = auth.uid()));
create policy "documents_write_owner" on public.documents for all to authenticated
using (owner_id = auth.uid() or public.is_admin()) with check (owner_id = auth.uid());

create policy "document_shares_select" on public.document_shares for select to authenticated
using (shared_with_user_id = auth.uid() or exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()) or public.is_admin());
create policy "document_shares_write_owner" on public.document_shares for all to authenticated
using (exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()))
with check (exists (select 1 from public.documents d where d.id = document_id and d.owner_id = auth.uid()));
