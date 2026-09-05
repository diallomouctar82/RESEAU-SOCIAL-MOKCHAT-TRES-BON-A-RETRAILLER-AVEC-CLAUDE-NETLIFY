-- LOOP 14/16 — Live Solidaire : niveaux de visibilité basiques sur les causes
-- (organisateur/participants du LIVE vs strictement privé) + activation
-- Realtime pour les tables réellement consommées par l'UI (causes/updates/proofs).

alter table public.live_solidarity_causes
  add column visibility text not null default 'live_participants'
    check (visibility in ('organizer_only','live_participants'));

comment on column public.live_solidarity_causes.visibility is
  'Niveau de visibilité basique (LOOP 14/16) : "live_participants" (défaut) = visible par
   quiconque peut voir la session LIVE ; "organizer_only" = strictement privé, seul
   l''organisateur (et l''admin) peut la voir. Pas de niveau "donateurs" séparé ni de
   page de transparence publique multi-niveaux (hors périmètre, voir rapport final).';

drop policy if exists live_solidarity_causes_select on public.live_solidarity_causes;
create policy live_solidarity_causes_select on public.live_solidarity_causes
  for select
  using (
    organizer_id = auth.uid()
    or is_admin()
    or (visibility = 'live_participants' and can_view_live_session(live_session_id))
  );

drop policy if exists live_solidarity_donors_select on public.live_solidarity_donors;
create policy live_solidarity_donors_select on public.live_solidarity_donors
  for select
  using (
    (exists (
      select 1 from public.live_solidarity_causes c
      where c.id = live_solidarity_donors.cause_id
      and (c.organizer_id = auth.uid() or is_admin() or (c.visibility = 'live_participants' and can_view_live_session(c.live_session_id)))
    ))
    or donor_id = auth.uid()
  );

drop policy if exists live_solidarity_proofs_select on public.live_solidarity_proofs;
create policy live_solidarity_proofs_select on public.live_solidarity_proofs
  for select
  using (
    exists (
      select 1 from public.live_solidarity_causes c
      where c.id = live_solidarity_proofs.cause_id
      and (c.organizer_id = auth.uid() or is_admin() or (c.visibility = 'live_participants' and can_view_live_session(c.live_session_id)))
    )
  );

drop policy if exists live_solidarity_updates_select on public.live_solidarity_updates;
create policy live_solidarity_updates_select on public.live_solidarity_updates
  for select
  using (
    exists (
      select 1 from public.live_solidarity_causes c
      where c.id = live_solidarity_updates.cause_id
      and (c.organizer_id = auth.uid() or is_admin() or (c.visibility = 'live_participants' and can_view_live_session(c.live_session_id)))
    )
  );

drop policy if exists live_solidarity_ledger_select on public.live_solidarity_wallet_ledger;
create policy live_solidarity_ledger_select on public.live_solidarity_wallet_ledger
  for select
  using (
    exists (
      select 1 from public.live_solidarity_causes c
      where c.id = live_solidarity_wallet_ledger.cause_id
      and (c.organizer_id = auth.uid() or is_admin() or (c.visibility = 'live_participants' and can_view_live_session(c.live_session_id)))
    )
  );

alter publication supabase_realtime add table public.live_solidarity_causes;
alter publication supabase_realtime add table public.live_solidarity_updates;
alter publication supabase_realtime add table public.live_solidarity_proofs;
