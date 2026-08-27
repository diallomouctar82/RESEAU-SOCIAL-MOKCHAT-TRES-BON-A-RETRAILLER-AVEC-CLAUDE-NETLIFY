-- Fixes legacy RLS correlations which compared an inner alias with itself.
-- The helpers receive the outer row id explicitly, so a row in another
-- user's document can never satisfy a tautological predicate.

begin;

create or replace function private.can_view_document(p_document_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.documents d
    where d.id = p_document_id
      and (
        d.owner_id = auth.uid()
        or public.is_admin()
        or exists (
          select 1
          from public.document_shares ds
          where ds.document_id = d.id
            and ds.shared_with_user_id = auth.uid()
        )
      )
  );
$$;

drop policy if exists documents_select on public.documents;
create policy documents_select on public.documents
for select to authenticated
using (private.can_view_document(id));

revoke all on function private.can_view_document(uuid) from public, anon, authenticated;
grant execute on function private.can_view_document(uuid) to authenticated;

commit;
