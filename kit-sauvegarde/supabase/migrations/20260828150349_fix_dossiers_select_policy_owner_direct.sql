-- Corrige un blocage sur INSERT ... RETURNING.
--
-- can_access_dossier() est STABLE et interroge public.dossiers pour vérifier la
-- propriété. Pendant un INSERT ... RETURNING (ce que fait tout
-- `.insert(...).select(...)` côté client), la ligne venant d'être insérée n'est
-- pas encore visible dans l'instantané de la fonction : celle-ci renvoie donc
-- false et la politique SELECT rejette l'opération, avec l'erreur trompeuse
-- « new row violates row-level security policy ».
--
-- Résultat : toute création de dossier suivie d'une relecture échouait, dans
-- l'application comme dans les outils de l'orchestrateur.
--
-- Le correctif teste d'abord la propriété DIRECTEMENT sur la ligne évaluée
-- (owner_id = auth.uid()), sans repasser par une requête sur la table. Cela
-- n'élargit aucun droit — le propriétaire avait déjà accès via
-- can_access_dossier lors d'une lecture ordinaire — et accélère au passage le
-- cas le plus courant en évitant une sous-requête.

drop policy if exists dossiers_select on public.dossiers;
create policy dossiers_select on public.dossiers
    for select to authenticated
    using (owner_id = (select auth.uid()) or public.can_access_dossier(id));
