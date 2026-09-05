# 🔄 GUIDE OPÉRATIONNEL DE CONTINUITÉ & CHARTE DU DÉVELOPPEUR
> **Protocole Impératif pour tout Développeur Humain et tout Agent d'Ingénierie IA**  
> *Règle d'or : « DOCUMENTATION = PARTIE DE L'EXÉCUTION »*

---

## 🎯 1. LE CYCLE DE VIE D'UNE MISSION

Chaque mission de développement ou d'évolution sur **Le Monde à Vous** doit impérativement respecter les 7 étapes séquentielles de la boucle de continuité :

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       LE CYCLE PERMANENT EN 7 ÉTAPES                        │
│                                                                             │
│  1. CONSULTER LA MÉMOIRE ➔ Lire LIVRE_DE_VISION.md, le module et les déc. │
│  2. CONTRÔLE DE COHÉRENCE ➔ Vérifier les règles, éviter les doublons        │
│  3. CADRAGE & CONCEPTION ➔ Définir précisément l'action sans dérive         │
│  4. EXÉCUTION DU CODE    ➔ Développer de manière modulaire et typée         │
│  5. VÉRIFICATION TECHNIQUE ➔ Compiler et valider l'intégrité                │
│  6. MISE À JOUR DOCUMENTAIRE ➔ Journal des Décisions, Module & État Actuel  │
│  7. CLÔTURE PROPRE       ➔ Bilan clair et scannable sans jargon superflu    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ 2. CHECKLIST ANTI-CONTRADICTIONS (AVANT TOUTE MODIFICATION)

Avant d'écrire la moindre ligne de code, l'agent ou le développeur doit valider :
- [ ] Cette fonctionnalité existe-t-elle déjà dans un autre module ?
- [ ] Contredit-elle la règle absolue de l'Expertise Humaine Diallo (interdiction de se déclarer IA/bot) ?
- [ ] Modifie-t-elle un modèle partagé (`types.ts`) ou un contrat de service ? Si oui, les autres modules appelants sont-ils préservés ?
- [ ] Respecte-t-elle la charte visuelle anti-slop (pas de gradients violets, contrastes WCAG AA) ?
- [ ] S'inscrit-elle fidèlement dans la colonne vertébrale définie dans le Livre de Vision ?

---

## 📝 3. LE FORMAT DE TRACE OBLIGATOIRE
Toute décision ou évolution notable doit être consignée sous le schéma logique :

> **Ce qui existait ➔ Ce qui a été demandé ➔ Ce qui a été décidé ➔ Ce qui a été modifié ➔ Pourquoi ➔ Comment ➔ Résultat obtenu.**

---

## 🔒 4. CRITÈRES DE FIN DE MISSION (DOD — DEFINITION OF DONE)
Aucune tâche ne peut être déclarée achevée tant que les 4 conditions suivantes ne sont pas réunies :
1. ✅ Le code source est complet, modulaire, typé et testé.
2. ✅ L'application compile sans erreur (`compile_applet` vert).
3. ✅ Le document du module concerné dans `docs/modules/` a été mis à jour avec les nouvelles fonctionnalités ou corrections.
4. ✅ Le `docs/JOURNAL_DECISIONS.md` et `docs/ETAT_ACTUEL.md` reflètent la réalité du système à jour.

Pour toute mission qui touche le **code livré**, les conditions suivantes s'ajoutent (méthode de référence, § 5) — elles ne remplacent pas les quatre premières :

5. ✅ La suite de tests complète est verte (`npm test`) et le typage est relancé **après** l'écriture des tests (`npx tsc --noEmit`) ; le Green Gate est vert sur la tête exacte fusionnée.
6. ✅ Des captures avant/après **mesurées** existent sur trois écrans (`docs/captures/<date>-<sujet>/` avec README et JSON de mesures), et les images ont été regardées une fois.
7. ✅ Une **revue indépendante** (producteur ≠ contrôleur) puis une **contre-vérification** ont rendu « PRÊT » sur la tête finale ; tous les constats bloquants et importants sont corrigés et couverts par des tests.
8. ✅ La production n'a été déployée que sur **feu vert écrit** de la Direction, une seule fusion à la fois, et a été **vérifiée immédiatement** (page servie, bundle, ancien bundle 404, miroir Chromium) ; le rapport final nomme ce qui n'a pas pu être vérifié.

---

## 🚀 5. PRODUCTION CONTRÔLÉE — LA MÉTHODE DE RÉFÉRENCE (VALIDÉE PAR LA DIRECTION LE 5 SEPTEMBRE 2026)

Le cycle en 7 étapes (§ 1) reste la colonne vertébrale. Pour amener une évolution jusqu'à `moknet.net`, il est **exécuté à travers la compétence** [`.claude/skills/production-controlee/SKILL.md`](../.claude/skills/production-controlee/SKILL.md), consolidée à partir des missions DEC-2026-058 (bande « Aurore ») et DEC-2026-061 (composeur A7 et studio Visuel IA B10), et validée par la Direction avec la consigne : « cette approche est validée et doit être conservée telle quelle, améliorable, seulement en mieux, jamais en moins strict ».

Résumé des loops (détail, garde-fous, outils et pièges dans la compétence) :

```
P0 AUDIT ─────── existant, gestionnaires, tests qui figent, capacités réelles, identifiants libres sur main
P1 IMPLÉMENTER ── étendre sans rien retirer, CSS en bloc nommé + @container avec repli, couche aqua régénérée
P2 TESTER ─────── comportements + gardes CSS (postcss), suite complète verte, tsc après les tests
P3 CAPTURER ───── harnais non versionné, 3 écrans, avant (origin/main) / après, mesures JSON, README
P4 CONTRÔLER ──── PR brouillon (gabarit ADR-0016), Green Gate, preview vérifié, miroir Chromium,
                  revue indépendante → corrections → contre-vérification jusqu'à « PRÊT »
P5 PRODUIRE ───── feu vert écrit, main inchangé, une fusion à la fois, squash sur la tête exacte,
                  vérification immédiate de moknet.net, PR de documentation, réalignement, rapport final
```

Invariants qui ne se négocient pas : rien ne disparaît ; aucun bouton factice ; l'élément déclaré intouchable reste identique à l'octet ; jamais de faux vert ; retour immédiat à l'état stable si un problème n'est pas maîtrisable ; aucune production sans feu vert écrit. Outils d'appui : [`scripts/production-controlee/`](../scripts/production-controlee/README.md).
