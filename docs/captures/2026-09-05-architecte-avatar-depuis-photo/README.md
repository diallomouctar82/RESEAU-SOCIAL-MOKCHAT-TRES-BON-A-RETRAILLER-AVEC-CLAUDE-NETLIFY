# Preuves — avatar vivant depuis une photo (5 septembre 2026, DEC-2026-077, v6.39.0)

Demande de la Direction : « ajoute dans Super Admin une option permettant à l'Administrateur général de fournir une photo afin que l'avatar vivant de l'Architecte prenne automatiquement la forme de cette photo, sans masquer MokNet » — avec aperçu, validation, sauvegarde et retour arrière ; preuves mobile, ordinateur et Super-Admin.

**Niveau de preuve : 🗄️ banc navigateur réel** — `design-lab/banc/super-admin-avatar.html` servi par vite : la carte Super-Admin réelle puis l'application (banc) avec la barre flottante réelle, remontée après chaque enregistrement ; Chromium 1194 piloté par Playwright ; **moteur MediaPipe réel** (wasm `@mediapipe/tasks-vision` 1.0.1 servi depuis `node_modules` à la place du CDN — le navigateur du banc n'a pas d'accès réseau —, modèles servis par l'application). Photo d'essai : le portrait d'usine inversé et teinté (la photo validée par la Direction n'est pas arrivée en fichier). Mesures brutes : `mesures.json`.

| Étape | Ordinateur (1280 × 800) | Téléphone (390 × 844) |
|---|---|---|
| 1 — Carte au repos (aucun élément fixe hors de l'ancrage de l'Architecte) | `ordinateur-1-super-admin-repos.jpg` | `mobile-1-super-admin-repos.jpg` |
| 2 — Photo choisie → analysée (478 repères) → aperçu vivant Actuel / Nouveau, note sur le modèle vidéo | `ordinateur-2-super-admin-apercu.jpg` | `mobile-2-super-admin-apercu.jpg` |
| 3 — Validée et enregistrée (bouton « Revenir à l'avatar précédent » présent) | `ordinateur-3-super-admin-enregistre.jpg` | `mobile-3-super-admin-enregistre.jpg` |
| 4 — Application : la sculpture prend la nouvelle forme, détourée par son propre masque (0,9 % / 2,1 % de l'écran) | `ordinateur-4-application-nouvel-avatar.jpg` | `mobile-4-application-nouvel-avatar.jpg` |
| 5 — Clic : petite barre seulement (2,5 % / 6,4 %), aucun panneau, pas de bouton Présentation (modèle d'un autre portrait) | `ordinateur-5-application-barre.jpg` | `mobile-5-application-barre.jpg` |
| 6 — Retour arrière dans la carte | `ordinateur-6-super-admin-retour.jpg` | `mobile-6-super-admin-retour.jpg` |
| 7 — Application : portrait et masque d'usine rétablis | `ordinateur-7-application-retour.jpg` | `mobile-7-application-retour.jpg` |

**Mesures** : analyse 1,9–2,5 s ; rig calculé (yeux 46,3 %, pupilles 39,3 / 60,7 %, lèvres 69 %, menton 83 %, sourcils 38,4 %) ; bouche 49,7 / 69 %, largeur 23,2 %, inclinaison 1,5° ; masque 512² : 136 048 opaques, 123 902 transparents, 2 194 de bord adouci, centre du visage opaque, coins transparents ; photo 90 371 octets, masque 25 714 octets ; retour arrière : `photoUrl` et masque d'usine, `previousAvatar` = null.

**Ce que ce banc ne prouve pas** : la photo validée par la Direction elle-même (fichier non reçu), le rendu sur Safari/iOS, la génération d'un modèle vidéo HeyGen depuis la nouvelle photo (étape suivante, sur accord).
