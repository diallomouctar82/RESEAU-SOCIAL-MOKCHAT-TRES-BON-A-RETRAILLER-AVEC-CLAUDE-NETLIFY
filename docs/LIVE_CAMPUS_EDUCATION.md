# MokNet Live Campus Éducation — spécification

> **Statut** : document de référence, écrit AVANT le développement (exigence
> de la Direction, 03/09/2026). Branche éducative de
> `docs/LIVE_INTELLIGENT.md` — elle en hérite tous les invariants (I1 à I7) et
> n'en contredit aucun.
>
> **Ordre imposé par la Direction** : « D'abord le live réel, ensuite les
> modules éducation. » Aucune loupe de ce document ne démarre avant que
> LV-6 (preuve réelle du live entre deux comptes) soit passée.
>
> **Ce document est de la VISION, pas de l'acquis.** L'existant à protéger est
> dans `docs/LIVE_SOCLE_EXISTANT.md` (invariants I1…I9, qui priment en cas de
> conflit) ; l'ordre d'exécution et les preuves, dans
> `docs/LIVE_INTELLIGENT_VALIDATION.md` (loupes **LV-12 à LV-18**).
>
> Chaque chapitre donne : **Objectif · Règles · Données · Rôles IA · Limites ·
> Critères · Preuves**.

---

## 0. Pourquoi — des lives utiles

Ailleurs, le direct sert à capter l'attention. Ici il sert à **former,
corriger et faire progresser**. C'est une exigence de produit, pas un slogan :
un live éducatif qui se termine sans avoir corrigé une erreur, produit une
fiche ou fait avancer quelqu'un d'un cran est un échec, même si tout le monde
s'est bien amusé.

**Conséquence de conception** : chaque live éducatif doit pouvoir répondre à
« qu'est-ce que cette personne sait faire de plus qu'avant ? » — et la réponse
doit venir de faits enregistrés, jamais d'une impression.

---

## 1. État réel du socle éducatif — mesuré, pas supposé

Vérifié en base et dans le code le 03/09/2026.

### Ce qui est RÉEL et solide

| Élément | Réalité |
|---|---|
| `services/curriculumRegistry.ts` | **962 lignes structurées**, 7 systèmes : Guinée (MEPU-A/MESRSI), Sénégal (Office du Bac), France (Éducation nationale), Côte d'Ivoire (MENA/DECO), US/International, Cambridge, + matrice d'équivalences. Cycles, niveaux, autorité officielle, année de revue, URL de vérification. Consommé par `Campus.tsx`, `CampusEquivalenceComparator.tsx`, `CampusEducationMap.tsx`, `campusPedagogicalEngine.ts`. |
| Coach multimodal | Vision (`analyzeImage`), OCR, voix (`useVoiceAssistant`), scanner d'exercice — réels et branchés sur la passerelle IA. |
| `profile_skills` / `profile_badges` | Tables réelles, RLS owner-only, **colonnes de provenance `source_type` / `source_id` déjà en place** — prévues exactement pour un enrichissement automatique par formations et activités. |

### Ce qui est VIDE — le vrai manque

| Table | Lignes | Consommateur `.from()` |
|---|---|---|
| `courses` | **0** | **aucun** |
| `enrollments` | **0** | **aucun** |
| `certificates` | **0** | **aucun** |
| `exam_sessions` | **0** | **aucun** |
| `profile_skills` | **0** | lecture seule (`services/profile.ts`) |
| `profile_badges` | **0** | lecture seule |

**Rien du parcours d'un apprenant n'a jamais été enregistré.** Le moteur
pédagogique vit intégralement en mémoire de session : fermer l'onglet efface
tout. C'est *le* trou à combler pour « l'IA garde l'historique d'apprentissage ».

**Tables absentes, à créer** : aucune table de quiz, d'exercice, de leçon, de
progression, ni de **tribu**. « Les tribus par niveau » n'ont aujourd'hui
aucun support de données.

### Défaut de documentation corrigé en même temps

`docs/modules/04_campus_et_education.md` annonçait **« Statut : 100 %
Opérationnel »** et « examens blancs chronométrés opérationnels ». C'est faux
au regard de la base : les quatre tables concernées sont vides et jamais lues.
La fiche est corrigée par le même commit que ce document — la documentation
fait partie du développement, une doc qui ment est un défaut au même titre
qu'un bug.

---

## 2. Les lives éducatifs

**Objectif** — Ouvrir un direct rattaché à une classe, un niveau ou un cursus,
public ou privé, pour réviser, apprendre et progresser.

**Règles**
- Un live éducatif est **rattaché** à un point du référentiel
  (`curriculumRegistry`) : pays → cycle → niveau → matière → chapitre. Un live
  « de révision » sans ancrage est un live libre, pas un live éducatif.
- **Public** : visible dans le fil, ouvert à qui veut. **Privé** : réservé aux
  membres de la classe/du groupe — la RLS le garantit, pas l'écran.
- La **taille du groupe** est annoncée à la création. Un cours à 200 personnes
  et un soutien à 4 ne se conduisent pas pareil.
- Un mineur n'est **jamais** exposé publiquement par défaut (voir § 8).

**Données** — `live_sessions.type = 'education'` (nouvelle valeur), plus un
rattachement curriculaire à poser (`curriculum_ref`), `is_private` déjà réel.

**Rôles IA** — Aucun à ce stade : c'est de la structure.

**Limites** — Le référentiel est un **instantané maintenu à la main**, pas un
flux des ministères. Il porte `lastCurriculumReviewYear` et une URL de
vérification : ces deux informations doivent être **affichées** à l'organisateur,
qui reste responsable de la conformité au programme en vigueur.

**Critères / Preuves** — Un live éducatif réel créé, rattaché à un chapitre
existant du registre, visible (public) ou invisible (privé) pour un tiers
selon le cas, **vérifié par impersonation RLS**, pas seulement à l'écran.

---

## 3. L'expert IA éducation

**Objectif** — Expliquer, corriger, faire progresser. Jamais faire le travail
à la place de l'élève.

**Règles**
- **Corriger, pas donner la réponse.** Sur un exercice montré, l'IA guide
  pas à pas ; elle ne livre la solution brute que si l'élève la demande
  explicitement après avoir essayé.
- **Reformuler sur demande** (« explique-moi autrement ») : analogie, découpage
  en étapes, exemple local, langage simple.
- **Encourager sur le fait, jamais sur la personne** : « ta démarche tient
  compte de l'unité », jamais « tu es bon en maths ».
- **Ne jamais humilier ni comparer publiquement** un élève à un autre.
- **Se taire** quand la classe avance seule.
- **Ne jamais inventer un contenu de programme.** Si le chapitre n'est pas dans
  le registre, l'IA le dit et propose de travailler hors référentiel.

**Données** — `services/aiGateway.ts` (existant), `curriculumRegistry`
(existant), `live_messages` pour la trace.

**Rôles IA** — Explication · correction guidée · encouragement · orientation.
**Jamais** : décision officielle (§ 7), notation publique (§ 8), diagnostic
médical ou psychologique.

**Limites** — L'IA peut se tromper sur un contenu disciplinaire. Toute
correction doit être **rattachable** à sa source (chapitre du registre,
document fourni par l'enseignant) pour être vérifiable par un humain.

**Critères / Preuves** — Un exercice réellement montré à la caméra, une
correction guidée qui ne donne pas la réponse au premier tour, et un cas où
l'IA dit honnêtement qu'un chapitre demandé n'est pas au référentiel.

---

## 4. Multilingue

**Objectif** — Expliquer dans la langue de l'élève.

**Règles**
- L'élève choisit sa langue ; l'explication arrive dans **sa** langue, le
  vocabulaire disciplinaire officiel restant cité dans la langue du programme
  (un élève guinéen révise « dérivée », pas seulement sa traduction).
- La langue d'origine reste **toujours accessible** — jamais un remplacement
  silencieux (règle déjà en vigueur pour la messagerie et les appels).
- Aucune traduction automatique d'un énoncé d'examen officiel sans le signaler.

**Données** — chaîne de traduction existante (`ai-gateway`), `preferred_language`
sur `profiles` (colonne réelle, désormais écrite).

**Limites** — La qualité de traduction d'un énoncé scientifique n'est pas
garantie ; un énoncé d'examen traduit est marqué comme tel.

**Critères / Preuves** — Une même explication rendue dans deux langues, avec
l'original consultable, et le vocabulaire officiel préservé.

---

## 5. Quiz, exercices, fiches de révision

**Objectif** — Faire pratiquer, pas seulement écouter.

**Règles**
- Un quiz est rattaché à un **chapitre réel** du référentiel.
- Les réponses sont **enregistrées** : sans persistance, il n'y a ni progrès ni
  historique — seulement une impression.
- La correction explique **pourquoi** une réponse est fausse, jamais seulement
  qu'elle l'est.
- Un exercice généré est marqué comme **généré par l'IA**, distinct d'un sujet
  officiel.
- **Aucune note publique** sans le consentement de l'élève (§ 8).

**Données à créer** — `live_quizzes`, `live_quiz_questions`,
`live_quiz_answers` (réponse par élève, horodatée), `learning_progress`.
Conventions imposées : RLS dès la création, `EXECUTE` révoqué pour `anon` sur
toute fonction `SECURITY DEFINER`, écritures append-only pour les réponses.

**Critères / Preuves** — Un quiz réellement passé par un compte de test : les
réponses existent **en base**, la correction est explicative, et un tiers ne
peut pas les lire (impersonation RLS).

---

## 6. Fiches, résumés, exercices, rapports — après le live

**Objectif** — Le live laisse une trace exploitable.

**Règles**
- Les documents sont produits **à partir du live réel** (transcription, chat,
  quiz passés) — jamais d'un résumé fabriqué sur un live vide. Si rien n'a été
  échangé, le dire.
- Le document est **réel et téléchargeable**, rattaché à la session et à son
  auteur.
- Un rapport à destination d'un parent ou d'un enseignant ne contient **que**
  des faits enregistrés.

**Données** — `live_documents` (table existante, 0 ligne — premier
consommateur réel).

**Critères / Preuves** — Un document réellement produit et téléchargé, sa ligne
en base, son lien vers la session, et un cas « live sans matière » où l'IA
refuse honnêtement de produire un résumé.

---

## 7. Décisions officielles — passage, redoublement

**C'est le chapitre le plus sensible du document.**

**Objectif** — Aider la décision, jamais la prendre.

**Règles — non négociables**
1. **L'IA recommande, un humain nommé valide.** Toujours. Sans exception.
2. La recommandation porte **ses raisons** et **les faits qui la fondent** —
   jamais un score seul.
3. La validation enregistre **qui** a validé, **quand**, et si la décision
   humaine **diffère** de la recommandation. Un désaccord est une information
   légitime, pas une anomalie à masquer.
4. Une recommandation **n'est jamais montrée à l'élève avant** la validation
   humaine.
5. L'IA **ne produit aucune décision** si les données sont insuffisantes : elle
   dit ce qui lui manque.

**Données à créer** — `academic_decisions` : élève, période, recommandation IA,
faits cités, décision humaine, `validated_by`, `validated_at`, écart
oui/non. Historique **immuable** (pas de mise à jour destructive).

**Limites — à énoncer dans le produit, pas seulement ici**
- **MokNet n'est pas un établissement accrédité.** Une décision de passage ou
  de redoublement a une portée institutionnelle et parfois légale qui dépasse
  la plateforme. Ce que MokNet produit est un **avis outillé**, pas un acte
  officiel, sauf accord explicite avec un établissement — accord qui n'existe
  aujourd'hui avec aucun.
- Cette limite doit être **affichée** sur l'écran de décision.

**Critères / Preuves** — Une recommandation réelle avec ses faits ; une
validation humaine tracée ; un cas de **désaccord** enregistré tel quel ; et la
preuve qu'aucune décision non validée n'est visible par l'élève.

---

## 8. Motivation — titres, badges, classements

**Objectif** — Encourager par des repères visibles : meilleur du jour, de la
semaine, bronze / argent / or, talent de l'année.

**Une tension à traiter franchement, pas à contourner.**
`docs/LIVE_INTELLIGENT.md` § 5 interdit « tout score social global opaque » et
pose la progression privée par défaut. Les classements demandés ici ne
contredisent pas cette règle — **à quatre conditions**, qui font partie de la
spécification :

1. **Le classement est explicite et explicable.** On sait exactement ce qui est
   compté (quiz passés, exercices réussis, régularité), et on peut demander
   pourquoi on est à cette place. Ce qui reste interdit, c'est le score
   **caché** qui influence secrètement ce qu'on vous propose.
2. **Le classement est borné.** Une classe, un live, un cursus — jamais un
   palmarès global de la plateforme.
3. **Il est volontaire.** Y figurer est un choix. Un élève qui refuse continue
   d'apprendre, de gagner des badges et de recevoir des recommandations
   exactement comme les autres — seul son nom n'apparaît pas.
4. **Les mineurs ne sont jamais classés publiquement par défaut.** Pour eux,
   le classement est privé, ou visible du seul enseignant, sauf autorisation
   explicite.

**Règles complémentaires**
- **Progression autant que performance.** « Meilleur » et « a le plus
  progressé » sont deux distinctions distinctes, et la seconde compte autant —
  sans quoi le classement décourage exactement ceux qu'il devrait aider.
- Un badge dit **ce qui a été fait**, pas ce que la personne vaut.
- Aucun badge n'est retiré une fois gagné.

**Données** — `profile_badges` (existante, avec `source_type='activity'` /
`source_id` = session), plus `learning_progress` et une vue de classement
**calculée**, jamais un score stocké et figé.

**Critères / Preuves** — Un badge réellement gagné et écrit avec sa provenance ;
un classement dont on peut afficher le détail du calcul ; un élève retiré du
classement qui conserve tout le reste ; un mineur absent du classement public.

---

## 9. Tribus par niveau, par objectif, par progression

**Objectif** — Regrouper utilement : niveau, meilleurs, et **progression**.

**Règles**
- Trois axes coexistent : **thème**, **niveau**, **objectif**. Une tribu
  « progression » regroupe ceux qui avancent, pas seulement ceux qui sont
  devant.
- L'IA **propose**, l'élève décide (invariant I5). Aucune affectation d'office.
- Passer dans une tribu plus avancée est une **proposition motivée**, jamais
  une sanction pour les autres.
- Quitter une tribu ne retire aucun badge acquis.

**Données à créer** — **aucune table de tribu n'existe aujourd'hui** : c'est un
sous-système entier (tribu, appartenance, axe, niveau), pas un ajout mineur.

**Critères / Preuves** — Une proposition réelle fondée sur des faits
enregistrés, un refus respecté sans insistance, et l'adhésion créée
uniquement après un geste humain.

---

## 10. Historique d'apprentissage et suivi des progrès

**Objectif** — L'IA se souvient du parcours pour aider, et rien de plus.

**Règles**
- **Portée respectée** : ce qui est appris dans un cours reste rattaché à ce
  cours ; cela ne devient pas une étiquette globale sur la personne.
- **Résultat ≠ identité** : « difficulté sur les fractions au 12/09 », jamais
  « faible en maths ».
- **Consultable et corrigible** par l'élève.
- **Confidentialité** : l'historique est privé. Un enseignant y accède pour ses
  élèves ; un parent selon un lien explicite ; personne d'autre.
- **Réutiliser l'existant** : `user_memory` (scopes et RLS owner-only déjà en
  place) et `profile_skills` / `profile_badges` avec leur provenance. **Jamais
  un second système parallèle.**

**Critères / Preuves** — Une progression réellement écrite après un quiz ;
invisible pour un tiers (impersonation RLS) ; une correction par l'élève qui
remplace la valeur au lieu de s'empiler.

---

## 11. Gratuit et Premium

**Objectif** — Apprendre reste gratuit ; l'accompagnement poussé est un service.

**Toujours gratuit** — rejoindre un live éducatif, écouter, poser une question,
passer les quiz du live, recevoir la correction, gagner des badges, consulter
son historique, recevoir des recommandations d'orientation.

**Premium** — coaching éducatif suivi dans la durée, documents détaillés
(rapports complets, plans de révision personnalisés), préparation d'examen
approfondie.

**Règles**
- La frontière est **annoncée avant** l'action, jamais découverte au milieu
  d'un cours.
- Un élève sans Premium n'est jamais **exclu** d'un live ni privé de correction.
- Aucune pression, aucun compte à rebours culpabilisant.

**Limite structurelle, à répéter** — **le mouvement réel d'argent exige un
prestataire de paiement autorisé** (compte + clé), indisponible dans cet
environnement. Le produit peut porter la frontière, les droits et l'affichage ;
l'encaissement reste « INTÉGRATION EXTERNE REQUISE ».

**Critères / Preuves** — Parcourir tout le gratuit sans rencontrer un mur ; la
frontière affichée avant l'action ; aucun encaissement simulé, jamais.

---

## 12. Ordre d'intégration — progressif, sans casser le socle

Exigence de la Direction : « D'abord le live réel, ensuite les modules
éducation. »

| Ordre | Loupe | Condition de démarrage |
|---|---|---|
| 1 | **LV-6** — preuve réelle du live entre deux comptes | — |
| 2 | **LV-12** — Live éducatif : rattachement au référentiel, public/privé | LV-6 passée |
| 3 | **LV-13** — Expert IA éducation : expliquer, corriger, reformuler, multilingue | LV-12 |
| 4 | **LV-14** — Quiz, exercices, progression persistée | LV-13 |
| 5 | **LV-15** — Motivation : badges, titres, classements bornés et volontaires | LV-14 |
| 6 | **LV-16** — Documents après le live (fiches, résumés, rapports) | LV-14 |
| 7 | **LV-17** — Décisions officielles : IA recommande, humain valide | LV-14 + LV-16 |
| 8 | **LV-18** — Tribus par niveau, objectif et progression | LV-15 |

**Règle de non-régression** : chaque loupe éducative est **additive**. Aucune
ne modifie le comportement d'un live libre ou à thème. `live_sessions.type`
reste la seule bascule ; aucune colonne existante n'est réinterprétée.

---

## 13. Critères transversaux et preuves

Valables pour **toutes** les loupes éducatives, en plus des critères propres à
chacune (`docs/LIVE_INTELLIGENT_VALIDATION.md` § « Ce qui est exigé de chaque
loupe ») :

1. `tsc` 0 · suite vitest entière verte · build propre.
2. Toute nouvelle table : **RLS dès la création**, `EXECUTE` révoqué pour
   `anon` sur toute fonction `SECURITY DEFINER`, `get_advisors` relu — zéro
   nouvelle alerte ERROR.
3. **Toute donnée d'apprentissage est vérifiée invisible pour un tiers** par
   impersonation RLS réelle, jamais par lecture du code.
4. Aucune capacité annoncée qui ne soit démontrée (invariant I1).
5. Zéro trace : comptes de démonstration supprimés, balayage des clés
   étrangères = 0.
6. La documentation est mise à jour **dans le même commit** que le code.

---

## 14. Limites assumées, écrites d'avance

- **MokNet n'est pas un établissement accrédité** (§ 7).
- Le référentiel des programmes est un **instantané maintenu à la main**, pas un
  flux officiel (§ 2).
- L'IA peut se tromper sur un contenu disciplinaire ; toute correction doit
  rester **vérifiable** par un humain (§ 3).
- L'encaissement Premium exige un prestataire externe (§ 11).
- Aucune reconnaissance biométrique d'élève, en aucune circonstance —
  définitivement hors périmètre.
- Les tribus n'ont **aucun support de données** aujourd'hui : c'est un
  sous-système à construire, pas un ajout (§ 9).
