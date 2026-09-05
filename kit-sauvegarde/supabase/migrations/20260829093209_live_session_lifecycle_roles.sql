-- LOOP 03/14 — cycle de vie de session + rôles.
--
-- live_speakers sert de roster unique de tout participant connecté à une
-- session (pas seulement les rôles "sur scène") : un spectateur obtient une
-- ligne role='viewer' en la créant lui-même (déjà permis par la policy
-- d'écriture existante, user_id = auth.uid()) ; is_hand_raised sur cette même
-- ligne EST la demande de parole (pas de table séparée) ; le passage
-- viewer -> speaker/guest se fait en modifiant `role` sur la même ligne
-- (promotion par l'hôte ou un modérateur), sans réinsertion.

-- 1. Élargir les rôles possibles : 'viewer' (spectateur, absent du schéma
-- d'origine qui ne couvrait que les rôles "sur scène") et 'moderator'
-- (modérateur humain — seul 'moderator_ai' existait, asymétrie qui bloquait
-- la modération humaine prévue par la spécification).
alter table public.live_speakers drop constraint live_speakers_role_check;
alter table public.live_speakers add constraint live_speakers_role_check
  check (role = any (array[
    'host','cohost','guest','viewer','moderator',
    'expert_ai','expert_human','speaker','secretary_ai','moderator_ai','director_ai'
  ]));

-- 2. Présence réelle : une ligne par (session, utilisateur) — rejoindre doit
-- mettre à jour la ligne existante (upsert), pas en créer une seconde
-- (aucune contrainte ne l'empêchait jusqu'ici). Les NULL (agent_id renseigné,
-- user_id absent pour les rôles IA) restent hors de cette contrainte, comme
-- le veut la sémantique standard de UNIQUE en Postgres.
alter table public.live_speakers add constraint live_speakers_session_user_key unique (session_id, user_id);

-- `left_at` marque un départ explicite sans supprimer l'historique de
-- présence (utile pour un futur décompte de spectateurs et pour l'audit) ;
-- une ligne avec left_at IS NULL = participant actuellement présent.
alter table public.live_speakers add column left_at timestamptz null;

-- 3. Un modérateur doit avoir un pouvoir réel (mute/kick/promotion, cf.
-- prompt 4/7 et extension prévue de la modération au LOOP 12), pas
-- seulement un badge visuel — même schéma que is_live_host().
create or replace function public.is_live_moderator_or_host(p_session_id uuid)
returns boolean
language sql
stable security definer
set search_path to 'public'
as $$
  select public.is_live_host(p_session_id)
    or exists (
      select 1 from public.live_speakers sp
      where sp.session_id = p_session_id
        and sp.user_id = auth.uid()
        and sp.role = 'moderator'
        and sp.left_at is null
    );
$$;

-- 4. Étendre les policies d'écriture existantes aux modérateurs (en plus de
-- l'hôte et de l'auto-gestion de sa propre ligne), sans rien retirer à
-- l'existant.
drop policy if exists live_speakers_write_host on public.live_speakers;
create policy live_speakers_write_host_or_moderator on public.live_speakers
  for all
  using (public.is_live_moderator_or_host(session_id) or user_id = (select auth.uid()))
  with check (public.is_live_moderator_or_host(session_id) or user_id = (select auth.uid()));

drop policy if exists live_messages_delete_own_or_host on public.live_messages;
create policy live_messages_delete_own_or_moderator on public.live_messages
  for delete using (
    author_id = (select auth.uid())
    or public.is_live_moderator_or_host(session_id)
  );
