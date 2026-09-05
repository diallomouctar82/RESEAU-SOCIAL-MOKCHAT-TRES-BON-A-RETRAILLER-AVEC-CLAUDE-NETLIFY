-- LOOP 01/17 (mission "L'Architecte MOCnet") — fondation du moteur de
-- contenu unifié. Additif uniquement : aucune colonne existante modifiée,
-- valeurs par défaut choisies pour préserver le comportement actuel de
-- `posts` (toute ligne existante ou insérée sans ces champs reste
-- immédiatement publique, comme aujourd'hui).

alter table public.posts
  add column if not exists video_url text,
  add column if not exists audio_url text,
  add column if not exists status text not null default 'published',
  add column if not exists scheduled_at timestamptz,
  add column if not exists format text not null default 'text',
  add column if not exists source_type text,
  add column if not exists source_id uuid;

alter table public.posts
  add constraint posts_status_check check (status in ('draft','published','scheduled','archived'));

-- 'story' volontairement absent : les stories restent la table séparée
-- public.stories (cycle de vie éphémère propre, expires_at) plutôt qu'un
-- format de post — le contenu composite/dérivé de Live utilise ce champ.
alter table public.posts
  add constraint posts_format_check check (format in ('text','image','video','audio','document','live_extract','composite'));

comment on column public.posts.status is
  'Cycle de vie du contenu (moteur de contenu unifié, LOOP 01/17). draft = jamais visible publiquement quel que soit visibility ; published = visible selon visibility (comportement historique, valeur par défaut) ; scheduled = publication différée (voir scheduled_at, bascule vers published non automatisée avant LOOP 15/17 — scheduler transversal) ; archived = masqué du fil sans suppression.';
comment on column public.posts.scheduled_at is
  'Horodatage de publication différée quand status=''scheduled''. Aucun job serveur ne fait encore basculer status automatiquement (voir LOOP 15/17).';
comment on column public.posts.format is
  'Propriété du contenu (moteur de contenu unifié) — indique quels champs média sont pertinents, ne détermine pas une architecture séparée. Ne remplace pas public.stories.';
comment on column public.posts.source_type is
  'Provenance du contenu quand il est dérivé d''un autre objet MOCnet (ex. ''live_session''). NULL = création directe. Consommé à partir de LOOP 03/17.';
comment on column public.posts.source_id is
  'Référence polymorphe vers l''objet source (table dépendant de source_type, pas de contrainte FK stricte).';

-- Correctif de sécurité découvert en construisant cette LOOP : la policy
-- SELECT existante ne tenait pas compte du statut — un brouillon avec
-- visibility='public' était donc visible par tout le monde avant même sa
-- publication, ce qui viole directement le principe "Préparer ≠ Publier"
-- déjà posé pour cette mission. Correction : seul un post status='published'
-- peut être visible par un tiers ; l'auteur et les admins gardent un accès
-- total quel que soit le statut (pour éditer/consulter leurs propres
-- brouillons et publications programmées).
drop policy if exists posts_select_visible on public.posts;
create policy posts_select_visible on public.posts
  for select
  using (
    (status = 'published' and visibility = 'public')
    or author_id = (select auth.uid())
    or is_admin()
  );
