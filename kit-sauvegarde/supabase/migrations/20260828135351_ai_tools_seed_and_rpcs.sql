-- ── Catalogue initial ────────────────────────────────────────────────────────
insert into public.ai_tools
    (id, display_name, description, category, parameters_schema, requires_confirmation, requires_auth, is_enabled, sort_order)
values
(
    'web_search',
    'Recherche web en temps réel',
    'Recherche sur le web des informations à jour et cite ses sources. À utiliser DÈS QUE la réponse dépend d''un fait susceptible d''avoir changé : loi, règlement, délai administratif, tarif, taux, condition de visa, actualité, coordonnées d''un organisme. Ne jamais deviner un montant, un délai ou un numéro d''article de mémoire : rechercher. Formuler une requête courte et précise, dans la langue du pays concerné quand c''est pertinent.',
    'search',
    '{"type":"object","properties":{"query":{"type":"string","description":"Requête de recherche, courte et précise."},"pays":{"type":"string","description":"Pays ou juridiction concernée, si la réponse en dépend (ex. France, Canada, Sénégal)."}},"required":["query"]}'::jsonb,
    false, false, true, 10
),
(
    'get_user_context',
    'Dossier de la personne',
    'Consulte le dossier de la personne connectée sur la plateforme : son profil, ses dossiers de vie en cours, ses formations suivies et ses objectifs de carrière. À utiliser quand la demande fait référence à sa situation personnelle ("mon dossier", "où j''en suis", "mes formations") plutôt que de lui redemander des informations qu''elle a déjà fournies. Ne renvoie que ce que cette personne a le droit de voir.',
    'read',
    '{"type":"object","properties":{"volet":{"type":"string","enum":["profil","dossiers","formations","carriere","tout"],"description":"Partie du dossier à consulter. Utiliser le volet le plus ciblé possible."}},"required":["volet"]}'::jsonb,
    false, true, true, 20
),
(
    'create_dossier',
    'Ouvrir un dossier de vie',
    'Ouvre un nouveau dossier de vie pour la personne (démarche administrative, projet, procédure à suivre dans le temps). À proposer quand la demande implique un suivi sur plusieurs étapes. La personne devra confirmer explicitement avant toute création : annoncer clairement ce qui va être créé.',
    'action',
    '{"type":"object","properties":{"titre":{"type":"string","description":"Titre court et explicite du dossier."},"description":{"type":"string","description":"Objectif du dossier en une ou deux phrases."},"categorie":{"type":"string","description":"Domaine : juridique, emploi, education, sante, logement, voyage, administration..."}},"required":["titre"]}'::jsonb,
    true, true, true, 30
)
on conflict (id) do update set
    display_name = excluded.display_name,
    description = excluded.description,
    parameters_schema = excluded.parameters_schema,
    requires_confirmation = excluded.requires_confirmation,
    requires_auth = excluded.requires_auth,
    sort_order = excluded.sort_order;

-- ── Autorisations par défaut ─────────────────────────────────────────────────
-- Tous les experts actuels reçoivent recherche + lecture ; l'action reste
-- fermée par défaut et s'ouvre expert par expert depuis la console.
insert into public.agent_tool_grants (agent_id, tool_id, is_enabled)
select a.agent_id, t.id,
       case when t.category = 'action' then false else true end
from (values ('1'),('2'),('3'),('4'),('5'),('6'),('7'),('8'),('9'),('10')) as a(agent_id)
cross join public.ai_tools t
on conflict (agent_id, tool_id) do nothing;

-- ── RPC lecture : outils actifs pour un expert ───────────────────────────────
-- Utilisée par l'Edge Function pour construire les déclarations d'outils.
create or replace function public.get_agent_tools(p_agent_id text)
returns table (
    id text,
    display_name text,
    description text,
    category text,
    parameters_schema jsonb,
    requires_confirmation boolean,
    requires_auth boolean
)
language sql
stable
security definer
set search_path = public
as $$
    select t.id, t.display_name, t.description, t.category,
           t.parameters_schema, t.requires_confirmation, t.requires_auth
    from public.ai_tools t
    join public.agent_tool_grants g
      on g.tool_id = t.id and g.agent_id = p_agent_id
    where t.is_enabled = true
      and g.is_enabled = true
    order by t.sort_order, t.id;
$$;

-- ── RPC admin : matrice complète experts x outils ────────────────────────────
create or replace function public.get_tool_matrix()
returns table (
    tool_id text,
    display_name text,
    description text,
    category text,
    requires_confirmation boolean,
    requires_auth boolean,
    tool_enabled boolean,
    sort_order integer,
    grants jsonb
)
language sql
stable
security definer
set search_path = public
as $$
    select t.id, t.display_name, t.description, t.category,
           t.requires_confirmation, t.requires_auth, t.is_enabled, t.sort_order,
           coalesce(
               (select jsonb_object_agg(g.agent_id, g.is_enabled)
                from public.agent_tool_grants g where g.tool_id = t.id),
               '{}'::jsonb
           )
    from public.ai_tools t
    where public.is_admin()
    order by t.sort_order, t.id;
$$;

-- ── RPC admin : activer/désactiver un outil pour un expert ───────────────────
create or replace function public.set_agent_tool_enabled(
    p_agent_id text, p_tool_id text, p_enabled boolean
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès réservé aux administrateurs.';
    end if;

    insert into public.agent_tool_grants (agent_id, tool_id, is_enabled)
    values (p_agent_id, p_tool_id, p_enabled)
    on conflict (agent_id, tool_id) do update set
        is_enabled = excluded.is_enabled,
        updated_at = now();
end;
$$;

-- ── RPC admin : interrupteur global d'un outil ───────────────────────────────
create or replace function public.set_tool_enabled(p_tool_id text, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
    if not public.is_admin() then
        raise exception 'Accès réservé aux administrateurs.';
    end if;
    update public.ai_tools set is_enabled = p_enabled, updated_at = now() where id = p_tool_id;
end;
$$;

revoke all on function public.get_tool_matrix() from public, anon;
revoke all on function public.set_agent_tool_enabled(text, text, boolean) from public, anon;
revoke all on function public.set_tool_enabled(text, boolean) from public, anon;
grant execute on function public.get_tool_matrix() to authenticated;
grant execute on function public.set_agent_tool_enabled(text, text, boolean) to authenticated;
grant execute on function public.set_tool_enabled(text, boolean) to authenticated;
grant execute on function public.get_agent_tools(text) to authenticated, service_role;
