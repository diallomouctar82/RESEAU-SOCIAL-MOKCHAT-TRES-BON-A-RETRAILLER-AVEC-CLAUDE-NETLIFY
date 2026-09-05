
-- dossiers
drop policy "dossiers_insert_own" on public.dossiers;
create policy "dossiers_insert_own" on public.dossiers for insert to authenticated with check (owner_id = (select auth.uid()));
drop policy "dossiers_delete_owner" on public.dossiers;
create policy "dossiers_delete_owner" on public.dossiers for delete to authenticated using (owner_id = (select auth.uid()) or public.is_admin());

-- dossier_shares
drop policy "dossier_shares_select" on public.dossier_shares;
create policy "dossier_shares_select" on public.dossier_shares for select to authenticated using (
  shared_with_user_id = (select auth.uid()) or exists (select 1 from public.dossiers d where d.id = dossier_id and d.owner_id = (select auth.uid())) or public.is_admin()
);
drop policy "dossier_shares_write_owner" on public.dossier_shares;
create policy "dossier_shares_write_owner" on public.dossier_shares for all to authenticated using (
  exists (select 1 from public.dossiers d where d.id = dossier_id and d.owner_id = (select auth.uid()))
) with check (
  exists (select 1 from public.dossiers d where d.id = dossier_id and d.owner_id = (select auth.uid()))
);

-- career_*
drop policy "career_goals_owner" on public.career_goals;
create policy "career_goals_owner" on public.career_goals for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
drop policy "career_opportunities_owner" on public.career_opportunities;
create policy "career_opportunities_owner" on public.career_opportunities for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
drop policy "career_opportunity_feedback_owner" on public.career_opportunity_feedback;
create policy "career_opportunity_feedback_owner" on public.career_opportunity_feedback for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
drop policy "career_search_missions_owner" on public.career_search_missions;
create policy "career_search_missions_owner" on public.career_search_missions for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
drop policy "master_resumes_owner" on public.master_resumes;
create policy "master_resumes_owner" on public.master_resumes for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
drop policy "career_snapshots_owner" on public.career_snapshots;
create policy "career_snapshots_owner" on public.career_snapshots for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));

-- education
drop policy "enrollments_owner" on public.enrollments;
create policy "enrollments_owner" on public.enrollments for all to authenticated using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()));
drop policy "exam_sessions_owner" on public.exam_sessions;
create policy "exam_sessions_owner" on public.exam_sessions for all to authenticated
using (exists (select 1 from public.enrollments e where e.id = enrollment_id and (e.user_id = (select auth.uid()) or public.is_admin())))
with check (exists (select 1 from public.enrollments e where e.id = enrollment_id and e.user_id = (select auth.uid())));
drop policy "certificates_select_owner" on public.certificates;
create policy "certificates_select_owner" on public.certificates for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());
drop policy "certificates_insert_system" on public.certificates;
create policy "certificates_insert_system" on public.certificates for insert to authenticated with check (user_id = (select auth.uid()));

-- commerce
drop policy "shops_write_owner" on public.shops;
create policy "shops_write_owner" on public.shops for all to authenticated using (owner_id = (select auth.uid()) or public.is_admin()) with check (owner_id = (select auth.uid()));
drop policy "products_select_active_or_owner" on public.products;
create policy "products_select_active_or_owner" on public.products for select to authenticated
using (is_active or seller_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = (select auth.uid())));
drop policy "products_write_owner" on public.products;
create policy "products_write_owner" on public.products for all to authenticated
using (seller_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = (select auth.uid())))
with check (seller_id = (select auth.uid()) or public.is_admin() or exists (select 1 from public.shops s where s.id = shop_id and s.owner_id = (select auth.uid())));
drop policy "orders_select_buyer_or_seller" on public.orders;
create policy "orders_select_buyer_or_seller" on public.orders for select to authenticated using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin());
drop policy "orders_insert_buyer" on public.orders;
create policy "orders_insert_buyer" on public.orders for insert to authenticated with check (buyer_id = (select auth.uid()));
drop policy "orders_update_buyer_or_seller" on public.orders;
create policy "orders_update_buyer_or_seller" on public.orders for update to authenticated
using (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin())
with check (buyer_id = (select auth.uid()) or seller_id = (select auth.uid()) or public.is_admin());
drop policy "order_items_select" on public.order_items;
create policy "order_items_select" on public.order_items for select to authenticated
using (exists (select 1 from public.orders o where o.id = order_id and (o.buyer_id = (select auth.uid()) or o.seller_id = (select auth.uid()) or public.is_admin())));
drop policy "order_items_insert_buyer" on public.order_items;
create policy "order_items_insert_buyer" on public.order_items for insert to authenticated
with check (exists (select 1 from public.orders o where o.id = order_id and o.buyer_id = (select auth.uid())));

-- wallet_transactions
drop policy "wallet_transactions_select_own" on public.wallet_transactions;
create policy "wallet_transactions_select_own" on public.wallet_transactions for select to authenticated using (user_id = (select auth.uid()) or public.is_admin());

-- notifications
drop policy "notifications_owner" on public.notifications;
create policy "notifications_owner" on public.notifications for all to authenticated
using (user_id = (select auth.uid()) or public.is_admin()) with check (user_id = (select auth.uid()) or public.is_admin());

-- documents / document_shares
drop policy "documents_select" on public.documents;
create policy "documents_select" on public.documents for select to authenticated
using (owner_id = (select auth.uid()) or public.is_admin()
  or exists (select 1 from public.document_shares s where s.document_id = id and s.shared_with_user_id = (select auth.uid())));
drop policy "documents_write_owner" on public.documents;
create policy "documents_write_owner" on public.documents for all to authenticated
using (owner_id = (select auth.uid()) or public.is_admin()) with check (owner_id = (select auth.uid()));
drop policy "document_shares_select" on public.document_shares;
create policy "document_shares_select" on public.document_shares for select to authenticated
using (shared_with_user_id = (select auth.uid()) or exists (select 1 from public.documents d where d.id = document_id and d.owner_id = (select auth.uid())) or public.is_admin());
drop policy "document_shares_write_owner" on public.document_shares;
create policy "document_shares_write_owner" on public.document_shares for all to authenticated
using (exists (select 1 from public.documents d where d.id = document_id and d.owner_id = (select auth.uid())))
with check (exists (select 1 from public.documents d where d.id = document_id and d.owner_id = (select auth.uid())));
