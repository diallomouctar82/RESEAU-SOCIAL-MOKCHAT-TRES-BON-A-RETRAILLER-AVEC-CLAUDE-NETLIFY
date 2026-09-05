# 🛰️ Tour de contrôle Vision Smart AI Core

> Écran d'administration : rendre AI Core visible pour l'Administrateur Général.
> **Lecture seule.** Aucun élément de cet écran n'active un outil, n'accorde un
> droit ni ne déploie quoi que ce soit.

---

## 1 — Pourquoi cet écran existe

L'inspection du 4 septembre 2026 a établi qu'AI Core **n'orientait aucun agent**
alors que son code était présent, propre et bien gardé. Le défaut n'était pas
technique : il était **invisible**. Rien, dans MokNet, ne permettait de voir que
l'outil était désactivé au catalogue et que pas un seul agent n'en détenait le
droit.

Cet écran répond à ce défaut précis. Il ne corrige pas AI Core — il le rend
constatable.

---

## 2 — Où il se trouve

| Élément | Fichier |
| --- | --- |
| Vue pure (sans réseau ni session) | `components/admin/AiCoreControlTowerView.tsx` |
| Conteneur (lecture en base) | `components/admin/AiCoreControlTower.tsx` |
| Modèle et raisonnement (pur) | `services/aiCoreControlTowerModel.ts` |
| Lecture réelle (Supabase) | `services/aiCoreControlTower.ts` |
| Faits du dépôt, mesurés au build | `scripts/build-ai-core-manifest.mjs` → `public/ai-core-manifest.json` |
| Montage dans la console | `components/admin/AiOrchestrator.tsx` (en tête) |
| Tests | `tests/aiCoreControlTower.test.tsx` |

Accès : **Super Admin → Connecteurs & Modèles IA**, en haut de l'écran.

---

## 3 — D'où vient chaque information

L'écran affiche **la provenance de chaque case**, parce qu'une information non
mesurée ne vaut pas une information mesurée.

| Mention à l'écran | Signification |
| --- | --- |
| `lu en base` | Lu en direct dans Supabase par la session de l'administrateur, sous RLS. |
| `mesuré au build` | Fait du dépôt, mesuré par le script de manifeste au moment du build. |
| `non lisible ici` | Hors de portée d'un navigateur. L'état reste **inconnu**, jamais supposé. |

### Ce que la console ne voit pas — et pourquoi

1. **Le jeton `AI_CORE_SERVICE_TOKEN`** — secret runtime d'une fonction Edge. Il
   ne doit pas être lisible depuis un navigateur, et il ne l'est pas. Le rendre
   constatable demanderait un mode `test` côté passerelle, qui n'existe pas
   encore (chantier L1-C du plan Loop 1).
2. **Le nombre de migrations en base** — le schéma `supabase_migrations` n'est
   pas exposé à l'API REST. La valeur affichée est un **relevé hors ligne daté**,
   présenté comme tel.
3. **L'usage réel d'AI Core** — `ai_call_log` ne journalise ni l'agent ni les
   outils utilisés. Tant que ces colonnes n'existent pas, aucun appel AI Core ne
   peut être prouvé **ni infirmé** : l'écran affiche « non mesurable », jamais
   « 0 ».

Ces trois points sont listés à l'écran dans **« Ce que cette console ne voit
pas »**. Une case absente du tableau de bord n'est pas une case verte.

---

## 4 — Règle de calcul du statut global

| Statut | Condition |
| --- | --- |
| 🔴 **Rouge** | Au moins un des quatre verrous obligatoires est fermé. |
| 🟠 **Orange** | Aucun verrou fermé, mais au moins un non éprouvé. |
| 🟢 **Vert** | Les cinq verrous ouverts **et mesurés**. |
| ⬜ **Inconnu** | La base n'a pas pu être lue. |

Le verrou 4 (jeton de service) n'entre pas dans le décompte des obligatoires,
mais **son état inconnu suffit à interdire le vert**. Un test verrouille ce
comportement : `un verrou non éprouvé ne peut JAMAIS produire un statut vert`.

---

## 5 — Prévisualisation publique

La console vit derrière une session administrateur. Pour qu'elle puisse être
relue et validée sans compte, une page de prévisualisation rend **le composant
réel** avec un **instantané réel** de la base, passé par **la même fonction de
calcul**.

```
preview/tour-de-controle/     page de prévisualisation
  ├── index.html              autonome : Tailwind compilé, aucun CDN
  ├── main.tsx                rend AiCoreControlTowerView
  ├── snapshot.ts             instantané réel, daté et sourcé
  └── tailwind.preview.config.cjs
vite.config.preview.ts        build isolé → dist-preview/
deploy/preview/netlify.toml   configuration de déploiement de la prévisualisation
```

La page **n'embarque pas le client Supabase** (vérifié : 0 occurrence de
`createClient`, `supabase.co`, `VITE_SUPABASE` dans le bundle), ne porte aucune
session et n'interroge aucune base.

### Procédure de déploiement de la prévisualisation

```bash
# 1. Construire
npm run build:preview

# 2. Poser la configuration de prévisualisation à la racine, le temps du déploiement
cp deploy/preview/netlify.toml netlify.toml

# 3. Déployer sur le site de prévisualisation (JAMAIS sur moknet.net)
#    Le site de prévisualisation est distinct : moknet-tour-de-controle-ai-core

# 4. RESTAURER immédiatement le netlify.toml de moknet.net
git checkout netlify.toml
```

> ⚠️ L'étape 4 n'est pas optionnelle. Le `netlify.toml` de la racine est celui
> de **moknet.net** : le laisser modifié changerait la configuration du site de
> production au prochain déploiement.

### Identité du build

Le manifeste inscrit le commit du build. Les déploiements par téléversement
n'ayant pas de dépôt git utilisable, le script lit `COMMIT_REF` en repli — à
définir sur le site de prévisualisation avant chaque déploiement, faute de quoi
la page affiche un build sans identité.

---

## 6 — Ce que cet écran ne fait pas

- Il **n'active** aucun outil (`ai_tools.is_enabled` reste inchangé).
- Il **n'accorde** aucun droit (`agent_tool_grants` reste inchangé).
- Il **n'ajoute** aucune RPC, aucune migration, aucune colonne.
- Il **n'écrit** rien, nulle part. Le seul bouton, « Actualiser », relit.

Un test verrouille cette propriété : la vue ne contient **aucun** `button`,
`input` ni `select`, et son texte ne contient aucun verbe d'action
(`Activer`, `Accorder`, `Déployer`, `Supprimer`).

---

## 7 — Journal

| Date | Évolution |
| --- | --- |
| 04/09/2026 | Création. Statut relevé à la mise en service : **🔴 rouge — AI Core n'oriente aucun agent** (verrous 2, 3 et 5 fermés, verrou 4 non éprouvé). |
