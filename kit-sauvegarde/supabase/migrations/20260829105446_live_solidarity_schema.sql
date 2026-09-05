-- LOOP 09/14 : Live Solidaire (complément reçu pendant LOOP 05/14, intégré
-- aux LOOPs restantes plutôt que traité comme une mission séparée — voir le
-- plan). Schéma additif complet appliqué maintenant car LOOP 09 (création
-- vocale d'une mission) en a réellement besoin pour la première fois ;
-- ledger/preuves/mises à jour/donateurs n'ont pas encore de consommateur
-- (arrivera aux LOOPs 11/12), même principe que profile_skills/profile_badges
-- : schéma + RLS prêts, UI ultérieure, jamais un schéma laissé incohérent.
--
-- Séparation architecturale non négociable (point 25 de la spec) : ces
-- tables ne détiennent JAMAIS de vrais fonds — ledger = suivi/traçabilité
-- uniquement (append-only, jamais un solde stocké, même principe que
-- wallet_transactions/get_wallet_balance() déjà établi dans ce dépôt). Le
-- mouvement réel d'argent reste "INTÉGRATION EXTERNE REQUISE" (prestataire
-- de paiement/wallet autorisé), hors périmètre de ce sandbox.

create table public.live_solidarity_causes (
  id uuid primary key default gen_random_uuid(),
  live_session_id uuid not null references public.live_sessions(id) on delete cascade,
  organizer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  beneficiary_description text not null,
  beneficiary_type text not null check (beneficiary_type in ('person','community','project','medical','complex')),
  target_amount numeric(12,2),
  currency text not null default 'XOF',
  organizer_fee_percent numeric(5,2) not null default 0 check (organizer_fee_percent >= 0 and organizer_fee_percent <= 100),
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.live_solidarity_causes is
  'Mission de solidarité créée depuis un LIVE (souvent par la voix — LOOP 09/14). Continue d''exister après la fin du direct (point "continuité après le LIVE" de la spec) jusqu''à sa clôture (status).';
comment on column public.live_solidarity_causes.organizer_fee_percent is
  'Politique de frais d''organisation — configurable par l''administration (spec : ex. 5-10%, jamais un taux inventé librement), affichée avant le don. Défaut 0 tant qu''aucune UI d''administration ne le configure.';

create table public.live_solidarity_wallet_ledger (
  id uuid primary key default gen_random_uuid(),
  cause_id uuid not null references public.live_solidarity_causes(id) on delete cascade,
  entry_type text not null check (entry_type in ('collected','used')),
  amount numeric(12,2) not null check (amount > 0),
  description text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.live_solidarity_wallet_ledger is
  'Écritures append-only (collecté/utilisé) — jamais un solde stocké, même principe que wallet_transactions/get_wallet_balance(). Aucun mouvement réel de fonds ici : ce ledger trace, il ne détient jamais d''argent (le transfert réel passe par un prestataire de paiement externe, hors périmètre).';

create table public.live_solidarity_proofs (
  id uuid primary key default gen_random_uuid(),
  cause_id uuid not null references public.live_solidarity_causes(id) on delete cascade,
  step_label text not null,
  expense_description text,
  amount numeric(12,2),
  proof_type text not null check (proof_type in ('photo','video','invoice','receipt','document')),
  document_url text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.live_solidarity_proofs is
  'Preuve structurée (photo/vidéo/facture/reçu/document) associée à une cause + une étape + une dépense + un montant — traçabilité réelle, pas un fil social (spec point "preuves structurées").';

create table public.live_solidarity_updates (
  id uuid primary key default gen_random_uuid(),
  cause_id uuid not null references public.live_solidarity_causes(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  text text not null,
  created_at timestamptz not null default now()
);

create table public.live_solidarity_donors (
  id uuid primary key default gen_random_uuid(),
  cause_id uuid not null references public.live_solidarity_causes(id) on delete cascade,
  donor_id uuid references auth.users(id) on delete set null,
  amount numeric(12,2) not null check (amount > 0),
  is_anonymous_public boolean not null default false,
  wants_impact_updates boolean not null default false,
  created_at timestamptz not null default now()
);

comment on table public.live_solidarity_donors is
  'Enregistrement du don côté MokNet (suivi/transparence) — pas le mouvement réel de fonds, qui passe par un prestataire de paiement externe (hors périmètre de ce sandbox). donor_id nullable : un don peut être anonyme y compris en base.';

alter table public.live_solidarity_causes enable row level security;
alter table public.live_solidarity_wallet_ledger enable row level security;
alter table public.live_solidarity_proofs enable row level security;
alter table public.live_solidarity_updates enable row level security;
alter table public.live_solidarity_donors enable row level security;

-- Causes : visible à qui peut voir le LIVE d'origine (réutilise
-- can_view_live_session, déjà correcte) ; création par l'organisateur
-- authentifié uniquement ; modification/annulation par l'organisateur ou un
-- admin. Visibilité publique large (transparence "public") volontairement
-- différée au LOOP 12/14 (permissions/confidentialité) — nécessite de
-- séparer les champs sensibles des champs publics, pas fait ici.
create policy live_solidarity_causes_select on public.live_solidarity_causes
  for select using (public.can_view_live_session(live_session_id) or organizer_id = auth.uid() or public.is_admin());
create policy live_solidarity_causes_insert on public.live_solidarity_causes
  for insert with check (organizer_id = auth.uid());
create policy live_solidarity_causes_update on public.live_solidarity_causes
  for update using (organizer_id = auth.uid() or public.is_admin()) with check (organizer_id = auth.uid() or public.is_admin());
create policy live_solidarity_causes_delete on public.live_solidarity_causes
  for delete using (organizer_id = auth.uid() or public.is_admin());

-- Ledger/preuves/mises à jour/donateurs : même périmètre de visibilité que
-- leur cause parente ; écriture réservée à l'organisateur de la cause ou un
-- admin (aucun consommateur applicatif avant LOOP 11/12 — schéma prêt).
create policy live_solidarity_ledger_select on public.live_solidarity_wallet_ledger
  for select using (exists (select 1 from public.live_solidarity_causes c where c.id = cause_id and (public.can_view_live_session(c.live_session_id) or c.organizer_id = auth.uid() or public.is_admin())));
create policy live_solidarity_ledger_write on public.live_solidarity_wallet_ledger
  for insert with check (exists (select 1 from public.live_solidarity_causes c where c.id = cause_id and (c.organizer_id = auth.uid() or public.is_admin())));

create policy live_solidarity_proofs_select on public.live_solidarity_proofs
  for select using (exists (select 1 from public.live_solidarity_causes c where c.id = cause_id and (public.can_view_live_session(c.live_session_id) or c.organizer_id = auth.uid() or public.is_admin())));
create policy live_solidarity_proofs_write on public.live_solidarity_proofs
  for insert with check (exists (select 1 from public.live_solidarity_causes c where c.id = cause_id and (c.organizer_id = auth.uid() or public.is_admin())));

create policy live_solidarity_updates_select on public.live_solidarity_updates
  for select using (exists (select 1 from public.live_solidarity_causes c where c.id = cause_id and (public.can_view_live_session(c.live_session_id) or c.organizer_id = auth.uid() or public.is_admin())));
create policy live_solidarity_updates_write on public.live_solidarity_updates
  for insert with check (exists (select 1 from public.live_solidarity_causes c where c.id = cause_id and (c.organizer_id = auth.uid() or public.is_admin())));

create policy live_solidarity_donors_select on public.live_solidarity_donors
  for select using (exists (select 1 from public.live_solidarity_causes c where c.id = cause_id and (public.can_view_live_session(c.live_session_id) or c.organizer_id = auth.uid() or public.is_admin())) or donor_id = auth.uid());
create policy live_solidarity_donors_write on public.live_solidarity_donors
  for insert with check (donor_id = auth.uid() or donor_id is null or public.is_admin());
