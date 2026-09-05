alter table public.posts
  add column if not exists image_url text,
  add column if not exists category text,
  add column if not exists tags text[] not null default '{}'::text[];
