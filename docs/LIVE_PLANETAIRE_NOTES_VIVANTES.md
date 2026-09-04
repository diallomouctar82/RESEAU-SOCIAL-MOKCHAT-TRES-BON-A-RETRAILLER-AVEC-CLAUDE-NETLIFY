# LIVE planétaire — les notes vivantes du direct (LP-7)

> La parole du direct est transcrite **une seule fois**, **publiée** à ceux
> qu'elle concerne, et **gardée** uniquement si l'animateur l'a décidé.
> C'est le socle de LP-8 (« me mettre à jour »), LP-9 (compte-rendu),
> LP-10 (questions intelligentes) et LP-11 (extraits, replay traduit).
>
> Chiffres et comportements ci-dessous : **mesurés**, jamais estimés. Ce qui
> n'a pas été mesuré est écrit comme tel au § 6.

---

## 1. Ce qui manquait, et pourquoi c'était invisible

La chaîne de traduction fabriquait déjà tout le nécessaire — une
transcription par phrase, N traductions — puis **jetait le texte**. Deux
conséquences, toutes deux silencieuses :

| Constat (audit LP-7) | Effet réel |
|---|---|
| `publishCaption` déclaré (`liveInterpreterProducer.ts`) et appelé à l'échec d'une voix, mais **fourni par aucun appelant** (grep repo-wide : zéro) | Le repli § 17 « lire au lieu d'entendre » n'a **jamais** pu se déclencher. LP-5 a mesuré **12,3 % d'échecs de synthèse** sur le journal de production : environ une phrase sur huit laissait un silence inexpliqué à quelqu'un dont la traduction texte était pourtant prête. |
| Ce chemin ne se serait déclenché **qu'à l'échec** | Même branché, les ~88 % de phrases réussies n'auraient produit aucun sous-titre. La barre de l'écran serait restée sur « Aucun sous-titre pour l'instant » pendant tout le direct. |
| Le LIVE n'utilisait **aucun canal de données** (`sendData`/`onDataReceived` : zéro occurrence dans `SocialLive.tsx`) | Aucun texte ne pouvait atteindre les autres, quelle que soit la correction faite côté producteur. |
| `setCurrentSubtitle` n'était appelé nulle part (constat LP-0) | La barre de sous-titres était décorative depuis l'origine. |

**Correction LP-7** : la publication a lieu **au moment où le texte est
connu**, pas à l'échec de la voix. Le repli § 17 devient alors une
conséquence, pas un chemin séparé — le texte est déjà chez l'auditeur quand
la synthèse échoue.

---

## 2. Ce qui voyage, et vers qui

Une phrase captée produit **1 + N messages**, N = nombre de langues
réellement produites :

```
« Bonjour à toutes et à tous. »   (fr, détecté)
   ├─ original                          → ceux qui écoutent en « Original »
   ├─ + traduction en          → en     → ceux qui écoutent en anglais
   └─ + traduction en          → ru     → ceux qui écoutent en russe
```

Chacun n'en lit **qu'un** : `subtitleForListener()`
(`services/live/liveListeningLanguage.ts`) trie à l'arrivée. Sans ce tri,
l'auditeur en « Original » verrait défiler les trois versions par-dessus les
mots qu'il voulait lire, et chaque personne choisissant une langue en
ajouterait une de plus à l'écran de tout le monde.

**Le cas qui mérite l'attention** : j'écoute en anglais et l'intervenant
parle **déjà** anglais. Il n'a rien à traduire (règle « ne jamais traduire
inutilement »), donc **aucune copie traduite n'existe** — c'est l'original
qui est ma version. Un tri naïf me laisserait sans sous-titre alors que je
comprends parfaitement ce qui se dit. Un test le tient.

**Mutualisation, ici aussi** : mille anglophones ne font pas mille messages,
ils en font un. Le volume est en O(langues), jamais en O(auditeurs) — exactement
comme les pistes audio (LP-2).

### Format et transport

Le message réutilise **tel quel** le type `caption` des appels
(`CallCaptionMessage`, `encodeCallData`/`decodeCallData` dans
`services/messaging/speechLanguage.ts`), envoyé sur le canal de données
LiveKit en mode `reliable`. Aucun second protocole n'a été inventé : c'est
exactement la même chose — un texte, sa langue, sa traduction éventuelle —
et deux formats à maintenir pour la même donnée est précisément ce que la
mission interdit.

Le **nom affiché** vient du roster de la room, jamais du message : personne
ne choisit sous quel nom sa parole apparaît chez les autres.

---

## 3. Ce qui est gardé — et ce qui ne l'est pas

| | Voyage dans le direct | Gardé en base |
|---|---|---|
| Les mots d'origine | Oui, toujours | **Seulement si l'animateur a activé l'enregistrement** |
| Les traductions | Oui, une par langue produite | **Jamais** — elles se recalculent à partir de l'original |
| La voix (audio) | Oui, par les pistes `interpreter:<langue>` | Jamais (hors périmètre LP-7 ; voir LP-12) |

**Le garde-fou tient en une ligne de policy**, pas en une condition côté
écran :

```sql
create policy live_transcript_lines_insert_own on public.live_transcript_lines
    for insert with check (
        speaker_id = (select auth.uid())
        and can_view_live_session(session_id)
        and exists (select 1 from public.live_sessions s
                    where s.id = session_id and s.is_recording_enabled)
    );
```

`live_sessions.is_recording_enabled` vaut `false` à la création. Sans le
geste de l'animateur, la parole voyage dans la room et **ne se pose nulle
part** — un client modifié ne peut pas passer outre, c'est la base qui
refuse. C'est la réponse concrète à « ne jamais stocker inutilement la
totalité de la conversation vocale » (§ 28).

La table est **append-only** : aucune policy `UPDATE`, aucune policy
`DELETE`. Une parole gardée ne se réécrit pas.

### Rétention

`purge_expired_live_transcripts()` (job `pg_cron`
`purge-expired-live-transcripts`, tous les jours à 03:30 UTC) efface la
transcription mot à mot **30 jours après la fin du direct**. Le compte-rendu
et le replay, eux, restent. Sans ce ménage, « gardée » finirait par vouloir
dire « pour toujours ».

### Pourquoi une table dédiée

- **Pas `live_replays.transcript`** (jsonb, déjà là) : c'est un bloc écrit
  une fois à la fin. Y ajouter une phrase pendant le direct demanderait de
  relire et réécrire tout le bloc — deux intervenants qui parlent en même
  temps s'écraseraient mutuellement. Le replay reste la **destination** ;
  `live_transcript_lines` en est la **source**.
- **Pas `live_personal_notes`** : sa forme (catégorie, module cible, date de
  rappel) est celle d'une note écrite **à la main** par quelqu'un pour
  lui-même. Ce n'est pas de la parole transcrite.

---

## 4. Preuves

**Base réelle** (impersonation RLS, 3 comptes éphémères, direct **privé**,
`04/09/2026`) — **10 contrôles, 10 OK** :

| # | Cas | Résultat mesuré |
|---|---|---|
| 1 | Enregistrement **désactivé** → écriture | refusée (`42501`) |
| 2 | Enregistrement **activé** → écriture | acceptée |
| 3 | Écrire au nom d'un tiers | refusée (`42501`) |
| 4 | Spectateur du direct → lecture | 1 ligne |
| 5 | Tiers hors du direct privé → lecture | 0 ligne |
| 6 | Visiteur non connecté → lecture | refusée (`42501`) |
| 7 | Auteur → réécrire / effacer sa propre parole | 0 modifiée, 0 supprimée |
| 8 | Utilisateur connecté → appel direct de la purge | refusée (`42501`) |
| 9 | Purge d'un direct terminé il y a **40 jours** | 1 ligne supprimée (1 → 0) |
| 10 | Même purge : direct terminé il y a 2 jours + direct en cours | intacts (1 et 1) |

Données de preuve entièrement supprimées après coup : balayage dynamique de
toutes les colonnes pointant vers `profiles`/`auth.users`, puis vérification
`comptes 0 · profils 0 · lignes de transcription 0 · sessions de preuve 0`.

**Tests automatisés** : `vitest 940/940` (68 fichiers, +13 pour LP-7 —
7 sur le tri à l'arrivée, 6 sur la publication côté producteur), `tsc 0`,
`vite build` propre.

**Advisors Supabase (sécurité)** : 218 lints, **0 ERROR**. Les deux seules
lignes nouvelles concernent `live_transcript_lines` et sont le bruit de fond
générique `pg_graphql_*_table_exposed` que porte chacune des ~80 tables de ce
schéma. **Aucune** alerte `SECURITY DEFINER` exécutable : l'`EXECUTE` de la
fonction de purge a été révoqué dès l'origine pour `public`, `anon` et
`authenticated`.

---

## 5. Où c'est écrit

| Rôle | Fichier |
|---|---|
| Publie la parole (côté intervenant) | `services/live/liveInterpreterProducer.ts` → `publishTranscript` |
| Envoie sur le canal de données + expose pour la conservation | `hooks/useLiveListeningLanguage.ts` |
| Trie à l'arrivée (règle pure, testée) | `services/live/liveListeningLanguage.ts` → `subtitleForListener` |
| Affiche | `components/SocialLive.tsx` → `onLiveDataRef` → `setCurrentSubtitle` |
| Garde et relit | `services/live/liveTranscriptService.ts` |
| Schéma, RLS, rétention | migration `live_lp7_transcript_lines` |

---

## 6. Ce que ce document ne prouve pas

- **Aucun direct réel à trois langues n'a été rejoué depuis LP-7.** Les 10
  contrôles ci-dessus portent sur la base et les règles ; le banc navigateur
  complet (trois comptes, voix réelles) date de LP-6 et n'a pas été rejoué
  avec les sous-titres. Le voir à l'écran pendant un vrai direct reste à
  faire.
- **Aucun bouton d'interface n'active encore l'enregistrement.**
  `is_recording_enabled` existe, la base l'exige, mais le geste de
  l'animateur qui le passe à `true` est l'objet de **LP-12**. En l'état, la
  conservation est donc **inerte en production** — ce qui est le
  comportement voulu par défaut, pas un manque caché.
- **Le volume réel du canal de données** n'est pas mesuré. Il s'agit de
  phrases de quelques dizaines de caractères face à un flux audio/vidéo,
  mais aucune mesure n'a été prise.
