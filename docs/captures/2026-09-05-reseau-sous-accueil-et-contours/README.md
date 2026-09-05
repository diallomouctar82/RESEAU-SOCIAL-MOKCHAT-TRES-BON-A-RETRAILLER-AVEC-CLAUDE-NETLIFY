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

## Mesures (`getComputedStyle`, Chromium, écran de densité 1)

| Champ | Avant | Après |
| :--- | :--- | :--- |
| Composeur au repos | `1px solid rgb(226, 232, 240)` (slate-200, presque invisible) | `2px solid color(srgb 0.118 0.161 0.231 / 0.55)` (55 % de la couleur du texte) |
| Composeur au focus | `1px solid rgb(226, 232, 240)` | `2px solid rgb(14, 116, 144)` (accent aqua) |
| Champ e-mail de connexion (focalisé au chargement) | `1px solid rgb(12, 144, 178)` | `2px solid rgb(14, 116, 144)` |
| Invite du composeur | « Quoi de neuf, Amadou ? Partagez une réflexion, opportunité, tutoriel ou document... » | « Quoi de neuf ? Partage une réflexion, une opportunité, un tutoriel ou un document. » |
| Barre latérale (3 premiers, dernier) | Accueil, Mon Parcours de Vie, Campus & Éducation … Conseil des Sages | Accueil, **Réseau MOC**, Mon Parcours de Vie … Conseil des Sages |

Leçon consignée : la première version à 1,5 px se mesurait à **1 px** (arrondi de
densité 1) — d'où le passage à 2 px avant fusion.
