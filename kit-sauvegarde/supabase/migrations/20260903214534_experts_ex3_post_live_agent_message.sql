-- EX-3 : faire PARLER un expert dans le direct, sous sa propre identité.
--
-- Pourquoi une fonction et pas un simple insert : la policy
-- `live_messages_insert_own` exige `author_id = auth.uid()`. Un message
-- d'expert n'a par définition aucun compte derrière — sans ce canal, la seule
-- issue serait d'attribuer sa parole à un humain (malhonnête) ou de la garder
-- locale (le défaut que cette mission corrige : « les experts n'ont jamais pu
-- répondre »).
--
-- Les droits sont vérifiés ICI, en base, jamais seulement à l'écran :
--   1. l'appelant doit animer ou modérer CE direct ;
--   2. l'expert doit réellement être sur la scène (ligne live_speakers active) ;
--   3. le nom et l'avatar affichés viennent de cette ligne, jamais des
--      paramètres — impossible de faire parler « quelqu'un d'autre ».
create or replace function public.post_live_agent_message(
  p_session_id uuid,
  p_agent_id   text,
  p_text       text
)
returns uuid
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_name   text;
  v_avatar text;
  v_id     uuid;
  v_texte  text := btrim(coalesce(p_text, ''));
begin
  if not public.is_live_moderator_or_host(p_session_id) then
    raise exception 'Seul l''animateur ou un modérateur de ce direct peut faire parler un expert.'
      using errcode = '42501';
  end if;

  if v_texte = '' then
    raise exception 'Un expert ne publie pas un message vide.' using errcode = 'P0001';
  end if;

  select sp.name, sp.avatar into v_name, v_avatar
  from public.live_speakers sp
  where sp.session_id = p_session_id
    and sp.agent_id = p_agent_id
    and sp.left_at is null
  limit 1;

  if v_name is null then
    raise exception 'Cet expert n''est pas sur la scène de ce direct.' using errcode = 'P0001';
  end if;

  insert into public.live_messages (session_id, author_id, author_name, author_avatar, text)
  values (p_session_id, null, v_name, v_avatar, left(v_texte, 4000))
  returning id into v_id;

  return v_id;
end;
$$;

-- Grant restreint dès l'origine : le défaut Supabase accorde EXECUTE à public
-- (donc anon). Même correction que pour les fonctions des LOOP 02/04/06 — ici
-- appliquée avant tout usage, pas après coup.
revoke all on function public.post_live_agent_message(uuid, text, text) from public;
revoke all on function public.post_live_agent_message(uuid, text, text) from anon;
grant execute on function public.post_live_agent_message(uuid, text, text) to authenticated;
