# 🎓 MODULE 04 — CAMPUS MONDIAL INTELLIGENT & ACCOMPLISSEMENT ÉDUCATIF
> **Campus Multi-Pays, Multi-Programmes & Ultra-Personnalisé avec Professeur Diallo**

---

## 🎯 1. VISION & PHILOSOPHIE SUPRÊME
- **Vision** : Aucun programme universel n'est imposé. Le Campus s'adapte à l'endroit où l'apprenant étudie, à son niveau de départ réel, à l'examen officiel qu'il prépare (Baccalauréat, Concours, Alphabétisation, Brevet, Diplômes Internationaux) et à son style cognitif d'apprentissage.
- **Principe d'Accomplissement** : Prendre l'apprenant à son **Point A** (forces et lacunes diagnostiquées), définir son **Point B** (réussite d'un examen ou maîtrise d'un métier), et l'accompagner pas à pas avec validation par la maîtrise des compétences.

---

## 🌍 2. RÉFÉRENTIELS MULTI-PAYS VÉRIFIÉS
1. **Guinée (MEPU-A / MESRSI)** : Terminale SM, SE, SS, Concours, Alphabétisation & Calcul Utile pour adultes et jeunes non scolarisés.
2. **Sénégal (Office du Bac)** : Séries S1, S2, L1, L2.
3. **France (Éducation Nationale / Eduscol)** : Réforme du Baccalauréat Général & Technologique, Spécialités Maths/SES, Grand Oral.
4. **Côte d'Ivoire (MENA / DECO)** : Séries C, D, A.
5. **États-Unis / International** : US High School, AP Calculus, SAT Prep.
6. **Royaume-Uni / Cambridge** : GCE A-Levels & GCSE.
7. **Matrice de Passerelles & Équivalences** : Correspondances officielles entre systèmes pour la mobilité internationale.

---

## 🧠 3. MOTEUR PÉDAGOGIQUE ADAPTATIF, COACH MULTIMODAL & VISION IA
- **Dialogue Vocal Fluide & Bidirectionnel** : Reconnaissance vocale continue/push-to-talk avec écoute en temps réel, dictée de questions et synthèse vocale haute fidélité pour les réponses du Professeur Diallo.
- **Caméra Vidéo Interactive & HUD Vision Pédagogique** : Flux vidéo WebRTC en direct avec bascule caméra avant/arrière, détection de mouvement optique en temps réel (taux de mouvement %, zones actives) et reconnaissance d'objets (cahier d'exercices, calculatrice, feuille de cours, tableau, équations manuscrites).
- **Scanner & Résolution Pas-à-Pas** : Déclencheur direct "📸 Scanner mon exercice" pour analyser visuellement le travail de l'élève à la caméra et lui fournir une guidance pédagogique sans donner bêtement la solution brute.
- **Partage & Analyse de Documents (Devoirs, Sujets, PDF, Images)** : Import et drag-and-drop de fichiers avec analyse OCR et extraction multimodale par Professeur Diallo.
- **Diagnostic Initial** : Évaluation ciblée pour cartographier les compétences maîtrisées, partielles et fragiles.
- **Styles d'Apprentissage** : Exemples concrets & analogies, Audio/Oral, Démonstrations pas à pas, Fiches de lecture, Exercices pratiques, Dialogue avec Professeur Diallo.
- **Mode "Explique-moi autrement"** : Reformulation instantanée par analogie simple, découpage en étapes, exemple local/terrain ou langage facile sans jargon.
- **Salle d'Examen Blanc** : Épreuves chronométrées avec correction détaillée et grille d'évaluation des compétences.

---

## ⚙️ 4. ARCHITECTURE TECHNIQUE & MODULES OPÉRATIONNELS
- **Fichiers Clés & Composants** :
  - `types.ts` : Modèles complets `EducationalCurriculumFramework`, `CurriculumSubject`, `StudentPedagogicalProfile`, `StudentMasteryItem`, `MockExamBlueprint`, `MockExamReport`, `AcademicEquivalenceComparison`, `Course`, `Lesson`, `Certificate`.
  - `services/curriculumRegistry.ts` : Répertoire officiel exhaustif des programmes (Guinée, France, Sénégal, Côte d'Ivoire, USA, UK, Alphabétisation) et banques d'épreuves d'examens blancs.
  - `services/formationsRegistry.ts` : Catalogue exhaustif des Formations Certifiantes & Diplômes d'Élite (Tech & IA, Droit, Médecine, Finance, Agro, Doctorats) avec crédits ECTS, prérequis et compétences cibles.
  - `services/campusPedagogicalEngine.ts` : Moteur de génération pédagogique adaptative, diagnostic et reformulations (4 modes cognitifs).
  - `components/Campus.tsx` : Hub principal avec navigation par onglets (Programme Officiel, Formations, Examens Blancs, Passerelles, Diplômes).
  - `components/CampusCourseEnrollmentModal.tsx` : Modal de présentation académique et procédure d'inscription officielle (Parcours Certifiant avec diplôme vs Auditeur Libre).
  - `components/CampusClassroomView.tsx` : Salle de classe immersive avec Professeur Diallo (voix/vidéo), théorie interactive, lab de mise en pratique avec exécuteur, quiz formatif, prise de notes synchronisée et accès direct aux ressources.
  - `components/CampusCertifyingExamView.tsx` : Salle d'épreuve certifiante sous minuterie, barème officiel, délibération automatique du jury académique et délivrance de diplôme numéroté.
  - `components/CampusDiplomaViewerModal.tsx` : Parchemin officiel de diplôme certifié avec sceau institutionnel, signature du Professeur Diallo, QR Code d'authentification et export PDF/Impression.
  - `components/CampusDiagnosticModal.tsx` : Test de positionnement interactif Point A ➔ Point B, cartographie des compétences et recalibration dynamique du plan de travail.
  - `components/CampusEquivalenceComparator.tsx` : Simulateur et comparateur officiel d'équivalences de diplômes et passerelles internationales.
  - `components/CampusEducationMap.tsx` : Carte mondiale des pays, cycles et sélection des programmes.
  - `components/CampusProfessorCoach.tsx` : Coach interactif multimédia avec voix et vision optique.
  - `components/CampusMockExamView.tsx` : Interface d'examen blanc chronométré avec notation instantanée /20 et rapport détaillé.

---

## 📊 5. ÉTAT DE DÉPLOIEMENT & VALIDATION

> **Correction du 03/09/2026.** Cette section annonçait « Statut : 100 %
> Opérationnel » et « examens blancs chronométrés opérationnels ». C'était
> **faux au regard de la base** : les quatre tables du domaine sont vides et
> aucune n'est lue par le code. L'affirmation est corrigée ici — une
> documentation qui ment est un défaut au même titre qu'un bug.

**RÉEL et vérifié**
- `services/curriculumRegistry.ts` : **962 lignes structurées**, 7 systèmes
  éducatifs (cycles, niveaux, autorité officielle, année de revue, URL de
  vérification), réellement consommé par `Campus.tsx`,
  `CampusEquivalenceComparator.tsx`, `CampusEducationMap.tsx` et
  `campusPedagogicalEngine.ts`. Navigation multi-programmes et équivalences
  internationales fonctionnent sur cette base.
- Coach multimodal : voix, vision (`analyzeImage`), OCR, scanner d'exercice —
  branchés sur la passerelle IA réelle.

**NON PERSISTÉ — le vrai manque** (mesuré le 03/09/2026)
| Table | Lignes | Lue par le code ? |
|---|---|---|
| `courses` | 0 | non |
| `enrollments` | 0 | non |
| `certificates` | 0 | non |
| `exam_sessions` | 0 | non |
| `profile_skills` / `profile_badges` | 0 | lecture seule (`services/profile.ts`) |

**Conséquence honnête** : le moteur pédagogique vit intégralement en mémoire de
session — fermer l'onglet efface tout. Aucun parcours d'apprenant n'a jamais
été enregistré, aucun examen blanc n'a jamais été conservé. C'est précisément
ce que la branche **MokNet Live Campus Éducation** vient combler :
voir `docs/LIVE_CAMPUS_EDUCATION.md` (loupes LV-12 à LV-18).

**Limite du référentiel** : `curriculumRegistry` est un **instantané maintenu
à la main** (champ `lastCurriculumReviewYear`, `verificationSourceUrl`), pas un
flux des ministères. Ces deux informations doivent être affichées à
l'organisateur d'un cours, qui reste responsable de la conformité au programme
en vigueur.

---

## 🛡️ 6. RÈGLES MÉTIER ET DÉONTOLOGIE
- **Incarnation Humaine Déontologique** : Professeur Diallo est un enseignant émérite de la Famille DIALLO, jamais une IA ou un robot.
- **Non-infantilisation** : Respect absolu du rythme d'apprentissage des adultes et adolescents.
