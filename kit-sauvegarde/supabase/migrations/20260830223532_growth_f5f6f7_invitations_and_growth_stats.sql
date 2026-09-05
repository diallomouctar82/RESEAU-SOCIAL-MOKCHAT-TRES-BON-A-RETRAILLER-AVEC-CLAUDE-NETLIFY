-- ÉQUIPES F6/F7 — invitations réelles avec suivi + statistiques de
-- croissance réellement mesurées (jamais un chiffre inventé).

-- F6 : code d'invitation personnel (un par membre, généré côté serveur).
create table public.invite_codes (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  code text not null unique,
  created_at timestamptz not null default now()
);
alter table public.invite_codes enable row level security;
create policy invite_codes_select_own on public.invite_codes
  for select using (user_id = (select auth.uid()));
-- écriture uniquement via la fonction serveur ci-dessous (pas de policy INSERT client).

-- F6 : parrainages réellement aboutis (une ligne = un compte réellement
-- rattaché à un parrain — le « nombre d'envois » n'est PAS suivi ici, un
-- lien copié vers WhatsApp est hors de portée de mesure honnête).
create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  inviter_id uuid not null references public.profiles(id) on delete cascade,
  invited_user_id uuid not null references public.profiles(id) on delete cascade,
  code_used text not null,
  accepted_at timestamptz not null default now(),
  unique (invited_user_id) -- un compte n'est parrainé qu'une seule fois
);
alter table public.invitations enable row level security;
create policy invitations_select_involved on public.invitations
  for select using (inviter_id = (select auth.uid()) or invited_user_id = (select auth.uid()));
-- écriture uniquement via accept_invitation() ci-dessous.

-- Génère (ou renvoie) le code personnel de l'appelant.
create or replace function public.get_or_create_invite_code()
returns text
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_code text;
begin
  if v_uid is null then raise exception 'authentification requise'; end if;
  select code into v_code from public.invite_codes where user_id = v_uid;
  if v_code is not null then return v_code; end if;
  loop
    v_code := upper(substr(md5(gen_random_uuid()::text), 1, 8));
    begin
      insert into public.invite_codes (user_id, code) values (v_uid, v_code);
      return v_code;
    exception when unique_violation then
      -- collision de code (improbable) : on retente ; user_id déjà pris = course avec soi-même : relire.
      select code into v_code from public.invite_codes where user_id = v_uid;
      if v_code is not null then return v_code; end if;
    end;
  end loop;
end;
$$;
revoke execute on function public.get_or_create_invite_code() from public, anon;
grant execute on function public.get_or_create_invite_code() to authenticated;

-- Rattache le compte APPELANT au parrain propriétaire du code.
-- Refuse : code inconnu, auto-parrainage, compte déjà parrainé.
-- Notifie le parrain (vraie ligne notifications — priorité normale).
create or replace function public.accept_invitation(p_code text)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_inviter uuid;
  v_invited_name text;
begin
  if v_uid is null then raise exception 'authentification requise'; end if;
  select user_id into v_inviter from public.invite_codes where code = upper(trim(p_code));
  if v_inviter is null then
    return jsonb_build_object('accepted', false, 'reason', 'code_inconnu');
  end if;
  if v_inviter = v_uid then
    return jsonb_build_object('accepted', false, 'reason', 'auto_parrainage');
  end if;
  begin
    insert into public.invitations (inviter_id, invited_user_id, code_used)
    values (v_inviter, v_uid, upper(trim(p_code)));
  exception when unique_violation then
    return jsonb_build_object('accepted', false, 'reason', 'deja_parraine');
  end;
  select name into v_invited_name from public.profiles where id = v_uid;
  insert into public.notifications (user_id, type, title, message, priority, target_action)
  values (v_inviter, 'success', 'Invitation acceptée',
          coalesce(v_invited_name, 'Un nouveau membre') || ' a rejoint MokNet grâce à votre invitation.',
          'normal', 'growth');
  return jsonb_build_object('accepted', true);
end;
$$;
revoke execute on function public.accept_invitation(text) from public, anon;
grant execute on function public.accept_invitation(text) to authenticated;

-- F6 : suivi des résultats — noms des filleuls (divulgation volontairement
-- minimale : uniquement les personnes qui ONT utilisé MON code).
create or replace function public.get_my_invitations()
returns table (invited_name text, accepted_at timestamptz)
language sql security definer set search_path = public
as $$
  select coalesce(p.name, 'Membre'), i.accepted_at
  from public.invitations i
  left join public.profiles p on p.id = i.invited_user_id
  where i.inviter_id = auth.uid()
  order by i.accepted_at desc;
$$;
revoke execute on function public.get_my_invitations() from public, anon;
grant execute on function public.get_my_invitations() to authenticated;

-- F7 : statistiques de croissance PERSONNELLES — SECURITY INVOKER, la RLS
-- de chaque table s'applique normalement ; uniquement des mesures réelles.
create or replace function public.get_my_growth_stats()
returns jsonb
language sql security invoker set search_path = public
as $$
select jsonb_build_object(
  'posts_publies', (select count(*) from public.posts where author_id = auth.uid() and status = 'published'),
  'reactions_recues', (select count(*) from public.post_reactions pr join public.posts p on p.id = pr.post_id where p.author_id = auth.uid()),
  'commentaires_recus', (select count(*) from public.comments c join public.posts p on p.id = c.post_id where p.author_id = auth.uid() and c.author_id <> auth.uid()),
  'partages_recus', (select coalesce(sum(shares_count), 0) from public.posts where author_id = auth.uid()),
  'amis', (select count(*) from public.friendships where status = 'accepted' and (requester_id = auth.uid() or addressee_id = auth.uid())),
  'abonnes', (select count(*) from public.follows where followee_id = auth.uid()),
  'invitations_acceptees', (select count(*) from public.invitations where inviter_id = auth.uid()),
  'meilleure_heure', (
    select extract(hour from p.created_at)::int
    from public.posts p join public.post_reactions pr on pr.post_id = p.id
    where p.author_id = auth.uid()
    group by 1 order by count(*) desc limit 1
  )
);
$$;
revoke execute on function public.get_my_growth_stats() from public, anon;
grant execute on function public.get_my_growth_stats() to authenticated;
