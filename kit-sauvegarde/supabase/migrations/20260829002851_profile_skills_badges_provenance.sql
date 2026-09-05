alter table public.profile_skills
  add column source_type text not null default 'manual'
    check (source_type in ('manual','course_completion','certificate','project','recommendation','activity')),
  add column source_id uuid null;

comment on column public.profile_skills.source_id is
  'Pointeur polymorphe optionnel vers la ligne d''origine (ex. enrollments.id si source_type=course_completion, certificates.id si source_type=certificate). Pas de FK — la table cible dépend de source_type. Aucun code ne peuple encore les valeurs autres que ''manual'' : colonnes préparées pour un futur système d''enrichissement automatique (formations, projets, certifications, recommandations, activités), pas encore implémenté.';

alter table public.profile_skills
  add constraint profile_skills_profile_id_name_key unique (profile_id, name);

alter table public.profile_badges
  add column source_type text not null default 'manual'
    check (source_type in ('manual','course_completion','certificate','project','recommendation','activity')),
  add column source_id uuid null;

comment on column public.profile_badges.source_id is
  'Même principe que profile_skills.source_id — voir ce commentaire.';
