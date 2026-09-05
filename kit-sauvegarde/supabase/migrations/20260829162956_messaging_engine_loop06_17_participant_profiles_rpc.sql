-- LOOP 06/17 — correctif découvert par test réel de bout en bout : la
-- policy profiles_select_visible (LOOP 06/17, correctif precedent) exige
-- profileVisibility='public' OU une amitié acceptée pour voir le profil
-- d'un tiers. Deux personnes qui demarrent une PREMIERE conversation ne
-- sont typiquement pas encore amies, et 'network' est le defaut de tout
-- nouveau compte (voir profiles_select_visible) — donc le nom/avatar du
-- destinataire d'une conversation reste invisible a l'autre participant
-- dans le cas le plus courant, verifie empiriquement (Bob voit sa propre
-- ligne mais pas celle d'Alice via le join imbrique conversation_participants(profiles(...))).
--
-- Corrige via une fonction etroite plutot qu'un assouplissement de la RLS
-- de `profiles` elle-meme : n'importe qui peut ajouter n'importe qui a une
-- conversation qu'il cree (conversation_participants_insert_if_member_or_self,
-- sans consentement prealable de l'autre partie) — assouplir profiles_select_visible
-- pour "partage une conversation" donnerait donc l'email/telephone/credits/
-- permissions/admin_notes de n'importe qui a n'importe qui pretendant vouloir
-- lui parler. Cette fonction n'expose que name/avatar_url/title/role — la
-- meme divulgation minimale qu'une app de messagerie grand public revele en
-- ouvrant une conversation (jamais la ligne complete de `profiles`).
create or replace function public.get_my_conversation_participant_profiles()
returns table (conversation_id uuid, id uuid, name text, avatar_url text, title text, role text)
language sql
security definer
set search_path = public
stable
as $$
  select cp.conversation_id, p.id, p.name, p.avatar_url, p.title, p.role
  from public.conversation_participants cp
  join public.profiles p on p.id = cp.user_id
  where cp.conversation_id in (
    select conversation_id from public.conversation_participants where user_id = auth.uid()
  );
$$;
revoke all on function public.get_my_conversation_participant_profiles() from public;
grant execute on function public.get_my_conversation_participant_profiles() to authenticated;
revoke execute on function public.get_my_conversation_participant_profiles() from anon;
