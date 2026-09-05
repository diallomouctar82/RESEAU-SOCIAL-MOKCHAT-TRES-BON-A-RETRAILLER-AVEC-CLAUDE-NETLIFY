
-- ═══════════════════════════════════════════════════════════
-- STORAGE — deux buckets seulement (pas un par écran) :
-- public = avatars/posts/stories (lecture publique)
-- private = documents/carrière/campus (jamais d'URL publique
-- permanente ; accès via signed URLs générées côté app pour les
-- partages, cf. document_shares/dossier_shares)
-- Convention de chemin : {domaine}/{user_id}/{fichier}
-- ═══════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public)
values ('public', 'public', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('private', 'private', false)
on conflict (id) do nothing;

create policy "public_bucket_read_anyone" on storage.objects
for select using (bucket_id = 'public');

create policy "public_bucket_write_own_folder" on storage.objects
for insert to authenticated
with check (bucket_id = 'public' and (storage.foldername(name))[2] = auth.uid()::text);

create policy "public_bucket_update_own_folder" on storage.objects
for update to authenticated
using (bucket_id = 'public' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()))
with check (bucket_id = 'public' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));

create policy "public_bucket_delete_own_folder" on storage.objects
for delete to authenticated
using (bucket_id = 'public' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));

create policy "private_bucket_owner_only" on storage.objects
for all to authenticated
using (bucket_id = 'private' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()))
with check (bucket_id = 'private' and ((storage.foldername(name))[2] = auth.uid()::text or public.is_admin()));
