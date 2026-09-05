# Preuves — la photo validée devient l'avatar vivant de l'Architecte (05/09/2026)

Niveau de preuve : 🧪 banc navigateur réel (Chromium 1.56, `npx vite` sur le dépôt, Supabase absent, moteur MediaPipe **réel**
servi depuis `node_modules`, modèles servis par l'application) — puis 🚀 production à vérifier après fusion (voir le journal).

## Photo validée → portrait d'usine (même moteur que l'option Super-Admin)

| Fichier | Contenu |
|---|---|
| `mesures-moteur-photo-validee.json` | analyse de la photo par le moteur de production : 478 repères, aucun avertissement, portrait 768 px (42 466 o), masque 512² (17 507 o), rig et ancre de bouche d'usine |
| `portrait-valide-detourage-controle.jpg` | portrait cadré composé sur fond vert avec le masque relevé (contrôle visuel du détourage) |
| `calage-video.cjs` | mesure des pupilles (portrait livré et image 1 de la vidéo) par le moteur de production → `alignment` du registre |
| `empreintes-fichiers-video.txt` | tailles et SHA-256 des fichiers vidéo, poster inclus, tels qu'enregistrés dans `services/architecte/sequences.ts` |

## Super-Admin réel (`design-lab/banc/super-admin.html`, `essai-super-admin-onglet.cjs`)

Ordinateur 1280 × 800 et téléphone 390 × 844 : tableau de bord → onglet **« Avatar de l'Architecte »** (2ᵉ onglet, visible sans
défilement sur les deux écrans) → « Choisir une photo… » (visible sans défilement) → photo validée → « Photo analysée (478 repères) » →
aperçu actuel / nouveau → « Valider et enregistrer » → bandeau « Enregistré dans les réglages de la plateforme à HH:MM:SS » →
stockage vérifié (`lmav_admin_detailed_settings_v1` : photo et masque en `data:`) → **rechargement de la page : l'avatar validé est
toujours là** → « Revenir à l'avatar précédent » → « Paramètres Plateforme » ne porte plus la carte, seulement la note de renvoi.

Captures : `super-admin-ordinateur-1…6`, `super-admin-telephone-1…4`.

## Application (`design-lab/banc/sculpture.html`, `essai-zero-obstruction.cjs`)

Sculpture détourée du portrait validé au repos, puis **présentation vidéo** (vision-smart-heygen.cutout.webm, `speaking`) dans la
sculpture ; mesures d'obstruction inchangées : ordinateur 0,9 % (repos) / 2,4 % (barre), téléphone 2,1 % / 6,8 %, dock libre.

Captures : `application-ordinateur-1-repos`, `application-ordinateur-2-presentation-video`, `application-telephone-1-repos`,
`application-telephone-2-presentation-video`.

## Fil réel : retrait pendant la saisie (`mesurer-composeur-saisie.cjs`, harnais authentifié local, onglet Réseau)

Constat (relevé par la revue de la PR #100, confirmé ici) : au repos, la sculpture (84 × 84) couvrait **2 301 px²** du bouton
« Publier » du composeur à 390 × 844 et **2 419 px²** à 360 × 800 (centre du bouton inatteignable). Pendant la saisie dans le composeur,
la sculpture se retire en pastille (29 × 29) dans son coin : **0 px² de recouvrement, centre et coin droit de « Publier »
atteignables** sur les deux écrans ; elle attend 400 ms après la sortie du champ avant de revenir.

Captures : `fil-reel-390x844-1-repos`, `fil-reel-390x844-2-saisie-retrait`, `fil-reel-360x800-2-saisie-retrait`.
