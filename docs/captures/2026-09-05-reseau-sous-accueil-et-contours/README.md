# Captures avant / après — « Réseau MOC » sous « Accueil », contours des zones de saisie, invite du composeur (5 septembre 2026, DEC-2026-053)

Produites par le harnais local **non versionné** (Layout + Dashboard / fil social /
écran de connexion rendus sans Supabase) sur `origin/main` (**avant**, `ea3e050`)
et sur la branche (**après**), dans Chromium headless via Playwright, à 1600×900.
La bordure de chaque champ est **mesurée** par `getComputedStyle` (largeur, style,
couleur) et consignée dans la PR.

| Écran | Avant | Après |
| :--- | :--- | :--- |
| Barre latérale d’ordinateur (ordre des entrées) | `avant-barre-laterale.png` | `apres-barre-laterale.png` |
| Composeur du réseau social, au repos (invite + contour) | `avant-composeur.png` | `apres-composeur.png` |
| Composeur au focus (accent aqua) | `avant-composeur-focus.png` | `apres-composeur-focus.png` |
| Page du réseau social entière | `avant-reseau-page.png` | `apres-reseau-page.png` |
| Écran de connexion (champs e-mail / mot de passe) | `avant-connexion.png` | `apres-connexion.png` |

Niveau de preuve : 🧪 banc (navigateur réel, données locales, Supabase non
configuré). Le contrôle final dans l’application appartient à la Direction.
