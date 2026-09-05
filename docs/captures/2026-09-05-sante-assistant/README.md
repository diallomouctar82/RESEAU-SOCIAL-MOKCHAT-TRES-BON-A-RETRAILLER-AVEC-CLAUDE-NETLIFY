# Captures de preuve — Assistant IA de Santé Globale (5 septembre 2026)

**Chemin exact dans l'application** : `https://moknet.net` → connexion Google
→ menu latéral → **Super Admin** → onglet **Santé Globale** → panneau
**« Assistant Santé Globale »** (juste sous la barre de commandement, avant
les graphiques).

**Comment ces captures ont été produites** : le composant de production
(`components/admin/AdminHealthTab.tsx`, Assistant compris) rendu dans un
harnais Chromium local sur les **mesures de production relevées le
5/09/2026** (sondes SQL rejouées avec le rang de l'Admin Général, VPS et CORS
mesurés, en-têtes et manifestes servis par `moknet.net`). Seul le réseau est
simulé ; la voix est coupée dans le harnais (pas de haut-parleur). Les
vidéos de l'avatar (CDN externe) ne se chargent pas dans le sandbox : le cadre
de l'avatar est donc sombre ici, il est animé en production.

Deux modes :

* **rang réel — `admin`** (celui de la Direction aujourd'hui) : l'Assistant
  écrit « Diagnostiquer », diagnostique sans rien modifier et le dit ;
* **BANC `super_admin` simulé** : rang et réparations simulés pour montrer le
  parcours complet — diagnostic → une confirmation pour le lot → réparation
  point par point → un échec avec cause, étapes exactes et lien → retour à
  l'état stable. **Rien de ce mode n'a touché la production.**

| Fichier | Mode | Ce qu'on y voit |
| :--- | :--- | :--- |
| `V3-01-ordinateur-assistant-bilan.jpg` | admin | Le bilan dit par l'Assistant dès l'analyse : état, santé 75 % sur 95 % mesuré, sécurité 51 % contre 61 % à l'audit, 6 R · 9 O · 5 blancs · 38 V, priorités, 8 réparations auto / 7 manuelles, rang ; boutons Analyser, Diagnostiquer tout le lot (15) / les rouges (6) / les oranges (9) / ce domaine / ce point |
| `V3-02-ordinateur-assistant-dialogue.jpg` | admin | « explique … » répond depuis le registre (constat, cause, impact, risque) ; « répare » sans portée → « Précisez la portée » |
| `V3-03-ordinateur-assistant-diagnostic-rouges.jpg` | admin | Diagnostic des rouges seuls : boucle 2/2 · 100 %, résultats point par point (2 diagnostiqués « rien n'a été modifié », 2 actions manuelles avec étapes et lien, 2 recommandées) |
| `V3-04-ordinateur-assistant-confirmation-lot.jpg` | banc | UNE confirmation pour le lot : périmètre exact par point (éléments, tables, restaurable), case « j'ai lu », bouton « Appliquer le lot (2) » inactif tant que la case n'est pas cochée, progression 50 % avec bouton Arrêt |
| `V3-05-ordinateur-assistant-resultats-reparation.jpg` | banc | Après application : boucle 4/4 · 100 %, 1 réparé et vérifié (sauvegarde prise), 1 **échec** avec **cause**, **étapes exactes** et lien « Ouvrir la fiche », 2 manuels avec « Ouvrir l'endroit exact », bouton « Restaurer le lot (1) » |
| `V3-06-ordinateur-assistant-restauration.jpg` | banc | Retour à l'état stable : 1/1 restauré, dit par l'Assistant |
| `V3-07-telephone-assistant.jpg` | admin | Le panneau sur téléphone (390 px) |
| `V3-08-telephone-confirmation-lot.jpg` | banc | La confirmation du lot sur téléphone |
| `V3-09-telephone-resultats.jpg` | banc | Résultats et « Restaurer le lot » sur téléphone |

`mesures.json` : les textes relevés par le harnais (bilan, boutons par rang,
dialogue, progression, résumé des résultats, cause et étapes de l'échec,
liens, restauration) — aucune erreur JavaScript sur les quatre parcours.
