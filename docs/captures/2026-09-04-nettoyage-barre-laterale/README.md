# Captures avant / après — nettoyage de la barre latérale (4 septembre 2026, DEC-2026-052)

Produites par le même harnais local **non versionné** que pour DEC-2026-051
(Layout + Dashboard rendus authentifiés, favoris par défaut) sur `origin/main`
(**avant**) et sur la branche `claude/cleanup-home-interface-szp8qv` (**après**),
dans Chromium headless via Playwright.

Retirés de l’affichage : le bouton « L’Architecte », le bloc « Mes Favoris »,
le bloc « Récents ». Conservés : les étoiles de favori sur chaque entrée
(visuel cible de la Direction), les piliers, le pied de barre latérale, la
pastille flottante de l’Architecte, le tiroir mobile.

| Écran | Avant | Après |
| :--- | :--- | :--- |
| Ordinateur 1600×900, page entière | `avant-ordinateur.png` | `apres-ordinateur.png` |
| Ordinateur — barre latérale seule | `avant-ordinateur-barre-laterale.png` | `apres-ordinateur-barre-laterale.png` |
| Ordinateur — en-tête (inchangé, témoin) | `avant-ordinateur-entete.png` | `apres-ordinateur-entete.png` |
| Téléphone 390×844, page entière (inchangé, témoin) | `avant-telephone.png` | `apres-telephone.png` |

Niveau de preuve : 🧪 banc (navigateur réel, données locales, Supabase non
configuré). Le jugement visuel final appartient à la Direction sur l’aperçu de
déploiement.
