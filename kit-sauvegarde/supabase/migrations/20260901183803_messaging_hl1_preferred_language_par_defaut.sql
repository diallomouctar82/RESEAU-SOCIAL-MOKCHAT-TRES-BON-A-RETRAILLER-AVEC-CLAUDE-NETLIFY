-- Mission « Harmonisation de la langue » (HL-1) : « Par défaut » = aucune
-- langue choisie = aucune traduction (texte, vocaux, appels). La colonne
-- devient nullable ; NULL est l'état initial de tout compte. Les valeurs 'fr'
-- existantes provenaient du DEFAULT de colonne (jamais d'un choix explicite
-- disponible avant ce jour) : elles sont remises à NULL — un membre qui veut
-- la traduction choisit sa langue en un clic dans sa boîte de messagerie.
alter table public.profiles alter column preferred_language drop not null;
alter table public.profiles alter column preferred_language set default null;
update public.profiles set preferred_language = null where preferred_language = 'fr';
comment on column public.profiles.preferred_language is
  'Langue choisie par le membre (« Ma langue », messagerie). NULL = « Par défaut » : aucune traduction, on lit et on entend l''original. Un code ISO 639-1 = traduction du texte, des vocaux et des appels vers cette langue.';
