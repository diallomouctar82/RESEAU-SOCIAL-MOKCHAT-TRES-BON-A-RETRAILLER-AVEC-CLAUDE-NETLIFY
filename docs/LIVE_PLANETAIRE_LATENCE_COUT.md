# LIVE planétaire — dégradations, latence, coût et montée en charge (LP-5)

> Chiffres **mesurés**, pas estimés. La source est `ai_call_log` du projet
> Supabase de production, sur les 14 derniers jours (mesure du 04/09/2026).
> Là où une valeur n'est pas mesurée, c'est écrit — jamais remplacé par une
> estimation présentée comme un fait.

---

## 1. Ce qui se passe quand une brique tombe (§17)

La règle qui les couvre toutes : **une panne de traduction ne doit jamais
emporter le direct**. L'audio d'origine continue dans tous les cas.

| Situation | Ce que la personne entend | Ce que l'écran dit | Où c'est décidé |
|---|---|---|---|
| Traduction disponible | La voix traduite ; l'originale est coupée | Rien | `speakerAudioDecision → 'interpreted'` |
| Personne ne produit encore ma langue | **L'audio d'origine** | « Traduction en X pas encore disponible » (point ambre) | `speakerAudioDecision → 'not_available_yet'` + `listeningStatusLine` |
| La personne parle déjà ma langue | L'audio d'origine, entier | Rien — il n'y a rien à traduire | `speakerAudioDecision → 'same_language'` |
| **Traduction texte OK, voix en panne** | L'audio d'origine, **et le texte traduit s'affiche** | Le sous-titre lui-même | `onPhraseOutcome → 'subtitled'` + `publishTranscript` (LP-7) |
| Traduction texte en panne | L'audio d'origine | Rien pour cette phrase ; la suivante réessaie | `voiceFor` catch → étape `failed` |
| Chaîne indisponible chez l'intervenant | L'audio d'origine | « Traduction indisponible pour l'instant » (point rouge) | `onUnavailable` → `producerError` |
| Plus de 3 langues demandées | Les 3 servies s'entendent ; les autres restent en original | Les langues non servies sont **nommées** dans `plan.unserved` | `languagesToProduce` |
| Je repasse en « Original » | L'audio d'origine, immédiatement | La pastille redevient 🌐 Original | `listeningLanguageCode(null)` |

**La garde anti-silence** est la plus importante : la voix originale n'est
coupée **que lorsque son remplacement est réellement reçu**. Sans elle, une
personne ayant déclaré l'anglais mais parlant français verrait sa voix coupée
sans rien à interpréter — silence total. Ce défaut a réellement eu lieu côté
appels ; un test le nomme, et la contre-épreuve a montré qu'il vire au rouge
seul quand on retire la garde.

**Correction faite en LP-5, et elle comptait :** le producteur annonçait
`voiced` juste après avoir mis la phrase en file — donc *avant* toute
synthèse. La latence mesurée ne comptait pas la voix, et une synthèse en
panne passait pour un succès. Désormais `voiced` n'est émis qu'au **démarrage
réel du son**, rapporté par la piste elle-même.

---

## 2. La latence, étape par étape (§18)

### Ce qui est mesuré aujourd'hui, sur la vraie passerelle

`ai_call_log`, 14 jours, production :

| Étape | Fournisseur | Appels | p50 | p90 | Réussite |
|---|---|---:|---:|---:|---:|
| Reconnaissance (parole → texte + langue) | `gemini_stt` | 322 | **1,56 s** | 2,45 s | 305 / 322 (94,7 %) |
| Traduction (texte → texte) | `deepseek` | 864 | **1,06 s** | 3,96 s | 822 / 864 (95,1 %) |
| Synthèse (texte → voix) | `gemini_tts` | 383 | **2,46 s** | **7,20 s** | 336 / 383 (**87,7 %**) |

Deux fournisseurs sont **hors service** et le journal le prouve :
`elevenlabs` 6 réussites sur 121 (quota), `deepgram` 15 sur 87.

### Ce que cela donne bout à bout

En chaîne, sans la traduction offerte : **1,56 + 1,06 + 2,46 ≈ 5,1 s au p50**,
et **jusqu'à 13,6 s au p90**. Pour la langue la plus demandée, la traduction
voyage gratuitement avec la transcription → **≈ 4,0 s au p50**.

**Le point qui coûte le plus est la synthèse**, pas la traduction : 2,46 s au
p50 et 7,2 s au p90, avec 12,3 % d'échecs. C'est exactement ce que la loupe
VT-2 (voix rapide) doit traiter — et c'est aussi pourquoi le repli en
sous-titre livré ici n'est pas théorique : il concerne une phrase sur huit.

### Comment relire ces chiffres pendant un vrai direct

`useLiveListeningLanguage` expose `latency` (module `liveLatency.ts`), qui
donne **médiane et 90ᵉ centile**, jamais une moyenne — une seule phrase à 12 s
suffit à rendre une moyenne mensongère. Trois règles de mesure y sont
verrouillées par des tests :

- une phrase **abandonnée n'a pas une latence de zéro** : elle est comptée à
  part, sinon on embellirait précisément les moments où la chaîne va mal ;
- la traduction **offerte** par la transcription n'est pas comptée comme
  « une traduction en 0 ms » (ce n'est pas le traducteur qui a travaillé) ;
- la reconnaissance est comptée **une fois par phrase**, pas une fois par
  langue — sinon un intervenant écouté en trois langues verrait sa
  reconnaissance comptée trois fois.

---

## 3. Coût : il dépend des LANGUES, pas des auditeurs (§29)

Coût unitaire **mesuré** (dépense totale ÷ appels, 14 jours) :

- reconnaissance : `0,052371 $ ÷ 322` = **0,000163 $ / appel**
- traduction : `0,560584 $ ÷ 864` = **0,000649 $ / appel**
- synthèse : **non facturée dans le journal** (`gemini_tts` = 0,00 $). À ne
  pas lire comme « gratuit » : c'est **non mesuré**, et cela devra être
  chiffré avant toute promesse de coût au client.

Hypothèse de découpage, issue des réglages réels (segments 550 ms → 6,5 s) :
**≈ 360 segments par heure** de parole soutenue.

| Langues servies | Reconnaissance | Traductions payées | Synthèse | Total mesurable / heure |
|---|---:|---:|---:|---:|
| 0 (personne ne demande) | 0 $ | 0 $ | 0 $ | **0 $** |
| 1 | 0,059 $ | 0 $ (offerte) | non mesurée | **≈ 0,06 $** |
| 2 | 0,059 $ | 0,234 $ | non mesurée | **≈ 0,29 $** |
| 3 | 0,059 $ | 0,467 $ | non mesurée | **≈ 0,53 $** |

**Le chiffre qui compte : ce tableau ne change pas avec le nombre de
spectateurs.** 10 auditeurs anglophones ou 10 000 : une transcription, une
traduction, une voix, une piste. C'est toute la raison d'être de la
mutualisation par langue cible.

### Ce qui change vraiment avec l'audience : la bande passante

| Audience | Coût IA / heure (3 langues) | Ce qui bouge |
|---|---|---|
| 10 | ≈ 0,53 $ | Rien de notable |
| 100 | ≈ 0,53 $ | Rien de notable |
| 1 000 | ≈ 0,53 $ | Le serveur LiveKit devient le sujet |
| 10 000 | ≈ 0,53 $ | **Hors de portée d'un seul VPS** |

Une piste de parole Opus tourne autour de **32 kbit/s**. À 10 000 auditeurs en
traduction, l'émission audio seule approche **640 Mbit/s** — et il faut y
ajouter la vidéo. Un nœud LiveKit unique sur un VPS Hostinger ne tient pas
cette charge ; l'échelle 10 000 demande soit LiveKit Cloud, soit une
diffusion en aval (HLS/egress) pour ceux qui ne font qu'écouter.

**Un point mesurable et corrigeable, relevé ici** : un auditeur en traduction
reçoit **les deux pistes** — l'originale (rendue muette par `muted`) *et*
celle de l'interprète. Sa bande passante audio est donc doublée. Se
désabonner de l'originale l'économiserait, mais **coûterait la garde
anti-silence** : sans elle sous la main, une traduction qui s'arrête laisse
un blanc. Arbitrage à poser explicitement, pas à trancher en douce.

---

## 4. Le plafond honnête d'aujourd'hui

Le producteur tourne dans **le navigateur de l'intervenant**, plafonné à
`MAX_BROWSER_PRODUCED_LANGUAGES = 3`. Les langues au-delà ne sont pas
escamotées : elles remontent dans `plan.unserved` pour que l'écran puisse le
dire à ceux qui les ont choisies.

Le nom de piste `interpreter:<langue>` est **volontairement identique** à ce
qu'un agent serveur GPU publierait. Le jour où ce renfort arrive, il remplace
le producteur navigateur **sans un seul changement côté auditeur** — et le
plafond de 3 langues tombe avec lui.

---

## 5. Ce que ce document ne prouve pas

- **Le coût de la synthèse** n'est pas mesuré (journal à 0,00 $). Il faut le
  chiffrer avant d'annoncer un coût par heure à un client.
- **Les chiffres viennent des appels**, pas d'un direct multi-langues réel :
  la chaîne est la même, mais un direct à trois langues simultanées n'a pas
  encore tourné. C'est l'objet de LP-6.
- **La charge à 1 000 et 10 000** est un calcul, pas une mesure. Le bac à
  sable n'autorise que le TCP 443 en sortie : les ports média du VPS ne sont
  pas sondables d'ici.
