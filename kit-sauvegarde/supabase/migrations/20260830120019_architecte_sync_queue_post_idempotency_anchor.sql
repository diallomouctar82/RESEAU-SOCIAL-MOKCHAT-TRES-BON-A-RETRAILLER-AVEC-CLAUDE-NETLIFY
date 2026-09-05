-- Ancre d'idempotence pour la file de synchronisation hors-ligne de
-- l'Architecte (« Lazarus », paquet AI Studio reconstruit).
--
-- `messages` disposait déjà de son ancre (`client_message_id` + index unique
-- `uq_message_client_id` sur `(sender_id, client_message_id)`), ce qui rend un
-- rejeu d'envoi idempotent : le second insert échoue en 23505 et devient un
-- no-op côté client au lieu de créer un second message.
--
-- `posts` n'avait pas d'équivalent : une publication mise en file hors-ligne
-- puis rejouée après un échec ambigu (le serveur a écrit mais la réponse s'est
-- perdue) aurait produit un doublon. Cette migration lui donne la même
-- protection, sur exactement la même convention d'index.
--
-- Strictement additive : la colonne est nullable et l'index est PARTIEL
-- (`where client_post_id is not null`), donc les lignes existantes et toutes
-- les publications faites par le chemin normal — qui ne renseignent pas cette
-- colonne — ne sont pas concernées.

alter table public.posts
  add column if not exists client_post_id uuid;

comment on column public.posts.client_post_id is
  'Ancre d''idempotence de la file de synchronisation hors-ligne de l''Architecte : identifiant UUID de la tâche, généré une seule fois côté client et réutilisé à chaque rejeu. Renseigné uniquement par le chemin hors-ligne ; NULL pour toute publication faite en ligne par le composeur. Même rôle que messages.client_message_id.';

create unique index if not exists uq_post_client_id
  on public.posts (author_id, client_post_id)
  where client_post_id is not null;
