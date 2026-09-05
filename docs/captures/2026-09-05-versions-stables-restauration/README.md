# Versions stables & restauration contrôlée — captures et mesures (5 septembre 2026, DEC-2026-086, v6.45.0)

Onglet Super-Admin « Versions stables » : les dernières versions livrées avec leurs preuves, ce que `moknet.net` sert réellement, et un ordre de restauration contrôlée — jamais à l'aveugle.

## Niveau de preuve

🧪 **Banc** : harnais local non versionné (`preview-harness.tsx`, rend le vrai `AdminDashboard` sans Supabase), Vite en développement, Chromium headless 1194 (Playwright 1.55), Tailwind Play servi en local. **Avant** = `origin/main` `b393726` (arbre de travail séparé, port 3001) ; **après** = la branche (port 3000). Les deux serveurs ne tournent **jamais en même temps** avec un `node_modules` partagé : le cache `node_modules/.vite` commun produit deux copies de React (« Invalid hook call ») — constaté, corrigé en séquençant.

La **production simulée** par Playwright (`route`) est celle relevée le 05/09/2026 sur le vrai site : `/version.json` → `{ version: v6.42.1, commit f6d9a168…, deployId 6a9c6540a62aa9000714444b, bundle /assets/index-C8Y6seFM.js }` (déploiement réel de `main` `b393726`, commit réel de la v6.42.1), page d'accueil → bundle `index-C8Y6seFM.js`. Le vrai `moknet.net` ne sert pas encore de `version.json` (il naît avec cette version) : sur la production réelle, l'onglet identifiera d'abord la version par le **bundle** consigné, puis par `version.json` après la fusion.

Limites honnêtes : polices de secours (Google Fonts hors d'atteinte du navigateur de la session) ; Supabase absent → le journal partagé est **indisponible** et l'écran le dit (« copie locale et journal d'audit seulement ») ; l'auteur de l'ordre est « Admin-Général » sans e-mail (aucune session).

## Fichiers

| Fichier | Ce qu'il montre |
| :--- | :--- |
| `avant-<écran>-01-barre.png` | Barre d'onglets de `origin/main` : **aucun** onglet « Versions ». |
| `avant-<écran>-02-ancien-sous-onglet-versions.png` | Sous-onglet « Versions » de « Workflows & Sauvegarde » : « Version courante active : v6.3.0 », v6.3.0 / v6.2.0 / v6.1.0 / v6.0.0 / v5.14.0 — données figées, sans lien avec la production (`moknet.net` servait la v6.42.1). |
| `apres-<écran>-01-barre.png` | Barre avec l'onglet « Versions stables » (4ᵉ, après « Santé Globale »). |
| `apres-<écran>-02-onglet.png` / `apres-ordinateur-1440x900-02b-onglet-page.png` | L'onglet : production lue (version servie identifiée, commit, déploiement, bundle, source), « votre onglet exécute … », cartes des versions (7 fusionnées + celle en préparation) avec nom, date UTC, commit (lien), PR (lien), décision, modules, preuves, portée et risques. |
| `apres-<écran>-03-precontroles.png` | Ordre vers v6.42.0 : sept pré-contrôles, tous verts ; formulaire verrouillé. |
| `apres-<écran>-04-ordre-procedure.png` | Ordre enregistré (identifiant, heure UTC, auteur, cible, servie avant, journal indisponible dit), voie A Netlify (lien, « Publish deploy », verrou), voie B Git (commandes exactes, `revert` de v6.42.1 puis v6.43.0), liste de vérification. |
| `apres-<écran>-05-verification.png` | « Vérifier la version servie maintenant » : la production simulée sert toujours v6.42.1 → verdict **rouge**, honnête. |
| `avant-mesures.json`, `apres-mesures.json` | Mesures DOM (ci-dessous). |

## Mesures avant / après

| Mesure | Avant (`origin/main`) | Après (branche) |
| :--- | :--- | :--- |
| Onglet « Versions stables » dans la barre | absent (3 écrans) | présent (3 écrans) : 158 × 38 px ordinateur et tablette, 105 × 38 px téléphone (libellé court « Versions ») |
| Débordement horizontal de la page | non | non (3 écrans) |
| Erreurs JS (bruits connus filtrés : Supabase absent, polices, Tailwind Play) | 0 | 0 (3 écrans) |
| Version servie identifiée | — (rien ne la lisait) | `identifiee` par `version.json` : v6.42.1, commit f6d9a16, déploiement 6a9c6540a62aa9000714444b, bundle index-C8Y6seFM.js |
| Cartes de versions affichées | 5 fictives (v6.3.0 … v5.14.0) | 8 réelles (v6.45.0 en préparation, v6.42.1, v6.43.0, v6.42.0, v6.41.1, v6.41.0, v6.40.1, v6.40.0), chacune avec PR, date UTC, module, preuves ; commit lié pour les 7 fusionnées |
| Bouton « Restaurer » de la version servie | — | désactivé (v6.42.1) ; désactivé pour v6.45.0 (non fusionnée) ; actif pour les 6 autres |
| Boutons de l'onglet : hauteur ≥ 44 px, dans l'écran | — | 9 boutons visibles, 0 sous 44 px, 0 hors écran (3 écrans) |
| Pré-contrôles (cible v6.42.0, servie v6.42.1) | — | 7/7 verts (cible consignée, éprouvée, production lisible, cible différente — retire v6.42.1 et v6.43.0 —, schéma, données, configuration) |
| Bouton « Enregistrer l'ordre » avant / après saisie exacte + motif | — | désactivé → activé (3 écrans) |
| Ordre enregistré | — | `RST-20260905-2017-xxxx`, cible v6.42.0, servie avant v6.42.1, journal partagé indisponible dit |
| Commandes de la voie Git | — | `git log --oneline daa6575..origin/main`, `git revert --no-edit f6d9a16`, `git revert --no-edit f6948b0`, typage + suite + build, push |
| Lien Netlify | — | `https://app.netlify.com/projects/lovely-maamoul-478226/deploys?filter=main` |
| Verdict après (production inchangée) | — | **rouge** : « sert encore v6.42.1 (commit f6d9a16), pas v6.42.0 » (3 écrans) |

Limite inhérente à la barre existante : tous ses onglets font 38 px de haut (style commun, non modifié) ; sur téléphone la barre défile horizontalement et l'onglet « Versions » est le 4ᵉ (hors de la première vue, comme « Workflows & Sync » sur `main`). Dans l'onglet lui-même, toutes les cibles font au moins 44 px.

## Ce que ces captures ne prouvent pas

La publication réelle d'un déploiement Netlify et le retour arrière Git ne sont **pas** rejoués ici (aucune action sur la production sans feu vert écrit) ; la vérification après restauration est prouvée dans les deux sens au banc DOM (`tests/adminStableVersionsTab.test.tsx` : rouge quand la production n'a pas bougé, vert quand elle sert la cible). Le rendu sur appareil réel et l'appréciation visuelle finale appartiennent à la Direction.
