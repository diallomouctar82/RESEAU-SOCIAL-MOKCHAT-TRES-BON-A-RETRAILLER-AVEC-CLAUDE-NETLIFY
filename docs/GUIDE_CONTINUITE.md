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
