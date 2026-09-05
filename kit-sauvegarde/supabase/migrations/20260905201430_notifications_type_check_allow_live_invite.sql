-- LV-2 L5 — L'invitation à un direct (`invite_to_live_session`) écrit une
-- notification de type 'live_invite'. La contrainte CHECK ne l'autorisait pas,
-- si bien que l'insertion (et donc TOUTE la fonction, transaction unique :
-- l'octroi d'accès `allowed_member_ids` compris) échouait silencieusement
-- depuis toujours — les invitations ne fonctionnaient jamais.
--
-- Correctif ADDITIF, zéro régression : on élargit l'ensemble autorisé au seul
-- type manquant réellement produit par l'application (énumération exhaustive
-- des fonctions SQL + du code client : success/info/warning/alert déjà écrits,
-- + live_invite). Les 345 lignes existantes (info/success) restent valides.
-- Un seul ALTER TABLE atomique (drop + add) : la table n'est jamais sans
-- contrainte.
alter table public.notifications
  drop constraint notifications_type_check,
  add constraint notifications_type_check
    check (type = any (array['success', 'info', 'warning', 'alert', 'live_invite']));
