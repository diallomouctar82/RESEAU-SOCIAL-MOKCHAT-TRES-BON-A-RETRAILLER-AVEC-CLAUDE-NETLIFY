
drop policy "post_documents_select_if_post_visible" on public.post_documents;
create policy "post_documents_select_if_post_visible" on public.post_documents
for select to authenticated
using (exists (
  select 1 from public.posts p where p.id = post_id
  and (p.visibility = 'public' or p.author_id = (select auth.uid()) or public.is_admin())
));

drop policy "comments_select_if_post_visible" on public.comments;
create policy "comments_select_if_post_visible" on public.comments
for select to authenticated
using (exists (
  select 1 from public.posts p where p.id = post_id
  and (p.visibility = 'public' or p.author_id = (select auth.uid()) or public.is_admin())
));

drop policy "post_reactions_select_if_post_visible" on public.post_reactions;
create policy "post_reactions_select_if_post_visible" on public.post_reactions
for select to authenticated
using (exists (
  select 1 from public.posts p where p.id = post_id
  and (p.visibility = 'public' or p.author_id = (select auth.uid()) or public.is_admin())
));
