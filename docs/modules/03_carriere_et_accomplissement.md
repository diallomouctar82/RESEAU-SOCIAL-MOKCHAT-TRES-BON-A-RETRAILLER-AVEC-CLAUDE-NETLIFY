# 🚀 MODULE 03 — CARRIÈRE & ACCOMPLISSEMENT PROFESSIONNEL
> **GPS de Trajectoire (Point A ➔ Point B), Diagnostic 17 Critères, Jumeau Numérique & Coach 3D**

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Rendre chaque utilisateur acteur direct de sa réussite professionnelle en lui traçant une route claire, jalonnée et personnalisée vers son objectif (emploi, reconversion, freelancing, création d'entreprise).
- **Objectif** : Mesurer objectivement les compétences actuelles (Point A), identifier la cible (Point B), combler les lacunes par la formation et l'entraînement intensif, puis piloter les candidatures et opportunités jusqu'au succès.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Demandeurs d'emploi, salariés en reconversion, indépendants, primo-arrivants sur un nouveau marché du travail.
- **Parcours Type** :
  1. Choix d'un objectif parmi 12 archétypes métiers ou saisie personnalisée.
  2. Diagnostic du Point A selon 17 critères (compétences, certifications, langues, budget, contraintes).
  3. Génération du plan d'action étape par étape avec passerelles vers Campus et Marché Mondial.
  4. Entraînement vocal intensif avec le Coach 3D interactif (simulations notées sur 10).
  5. Suivi des opportunités sur le pipeline Kanban et validation certifiée dans le Jumeau Numérique.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/CareerCenter.tsx` : Vue centrale du centre de carrière.
  - `components/career/CareerGoalSelector.tsx` : Sélecteur d'objectifs et 12 archétypes.
  - `components/career/CareerPointADiagnosticModal.tsx` : Formulaire d'évaluation 17 critères.
  - `components/career/CareerGPSNavigator.tsx` : Visualisation de l'itinéraire A➔B et Plan B.
  - `components/career/CareerDigitalTwinCard.tsx` : Jumeau professionnel certifié.
  - `components/career/CareerCoach3DModal.tsx` : Simulateur d'entretiens et de pitchs 3D vocaux.
  - `components/career/CareerContinuousFollowUp.tsx` : Tableau Kanban et rappels de relances.
  - `components/career/CareerExpertCouncilModal.tsx` : Conseil des experts pour avis stratégique.
- **Modèles de Données (`types.ts`)** :
  - `JobOffer`, `CompetencyRecord`, `UserProfile (skills, badges)`, `DossierParcours`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Pas de fausses promesses** : Conseiller Diallo n'assure aucune embauche garantie, mais optimise au maximum le potentiel réel du candidat.
- **Opposabilité du Jumeau Numérique** : Les badges et compétences ne sont validés qu'après réussite réelle d'examens ou simulations certifiées.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Carrière 1/7 (Terminé)** : Architecture modulaire complète, Diagnostic 17 critères, Coach 3D avec feedback vocal, Pipeline Kanban opérationnel, Jumeau Numérique certifié.
- **Carrière 2/7 (Terminé - Radar Intelligent & Agent de Conquête)** :
  - **Recherche par Intention Naturelle** : Décodage sémantique des intentions utilisateurs (emploi, clients B2B, fonds, sourcing achats) sans mots-clés rigides.
  - **Score de Compatibilité Explicable (Match IA & Confiance)** : Décomposition transparente (Compétences maîtrisées vs Compétences à acquérir avec passerelles directes vers Campus).
  - **4 Univers de Conquête** : Emploi & Missions, Clients B2B, Fonds & Bourses, Achats & Sourcing + Cartographie des horizons nouveaux.
  - **Niveaux de Préparation Temporelle** : ⚡ Prêt Maintenant (80%+ de match), 🎯 À Préparer (Plan d'action & cours Campus), 🌟 Objectif Futur (Jalon moyen terme).
  - **Cartographie Géographique d'Opportunités** : Filtrage par rayon d'action (Local, National, Régional UEMOA/CEDEAO/Europe, International, 100% Télétravail).
  - **Détection de Signaux Faibles** : Déduction d'opportunités non publiées à partir de faits réels du Réseau MOK et Marché Mondial (levées de fonds, ouvertures de filiales, projets d'expansion).
  - **Agent de Veille Continue ("Mon Agent cherche pour moi")** : Surveillance passive continue 24h/24 avec gestion de missions autonomes.
  - **Coffre d'Opportunités Personnel** : Sauvegarde, statut d'avancement (`a_etudier`, `a_preparer`, `prete`, `action_engagee`, `en_attente`, `reussie`, `refusee`, `expiree`), notes personnelles et actions rapides.
  - **Boucle d'Apprentissage & Feedback** : Qualification des refus/désintérêts (salaire, localisation, secteur, timing) pour affinage continu du radar.
- **Carrière 3/7 (Terminé - Mode Conquête, Salle de Préparation & Règle Humain Maître de l'Action)** :
  - **Salle de Préparation Multi-Onglets (`CareerConquestRoom.tsx`)** : Cockpit dédié par opportunité comprenant 5 piliers :
    1. **Diagnostic & Angle Stratégique** : Analyse 5D (Culture d'entreprise, mots-clés ATS, attentes non dites, leviers d'influence, score de préparation /100).
    2. **Dossier & Documents Ciblés** : CV Contextuel dérivé du CV Maître, lettre d'impact argumentée, note d'intention, devis / proposition sur mesure, liens de preuves.
    3. **Préparation Orale & Pitchs** : 5 formats de pitchs (30s ascenseur, 2min synthèse, 5min complet, technique, négociation tarifaire) + Téléprompteur interactif avec enregistreur vocal/vidéo (`CareerTeleprompterModal.tsx`).
    4. **Simulateur Réaliste & Crash Test** : 10 questions probables + 3 pièges, objections et réponses avec feedback IA instantané ou bascule vers le Coach 3D Vocal.
    5. **Checklist & Fiche Flash J-0** : Préparation 30 min & Répétition 5 min avant entretien (`CareerMeetingFlashModal.tsx`).
  - **CV Maître Universel (`CareerMasterResumeModal.tsx`)** : Base de vérité immuable contenant l'historique complet (expériences, formations, réalisations chiffrées, preuves), à partir duquel chaque CV ciblé est généré sans jamais falsifier la réalité.
  - **Éditeur de CV Contextuel (`CareerContextualResumeEditor.tsx`)** : Réorganisation des expériences et mise en avant des compétences pertinentes pour l'opportunité.
  - **Contrôle Qualité & Quality Gate Obligatoire (`CareerQualityGateModal.tsx`)** : Application stricte de la règle *« L'humain est le seul maître de l'action »*. Vérification anti-faute, conformité de ciblage, exactitude des pièces jointes et validation explicite avant toute transmission.
  - **Décodeur de Réponses Recruteur / Client (`CareerResponseAnalyzerModal.tsx`)** : Analyse fine des retours (acceptation, refus motivé, demande de test, contre-proposition) avec plan d'action immédiat et réajustement du pipeline.
- **Carrière 4/7 (Terminé - Suivi Autonome, Dossier Vivant & Agent de Continuité)** :
  - **Hub de Contrôle & Pulse de Carrière (`CareerContinuityControlHub.tsx`)** :
    - Vue globale unifiée du cap stratégique, avec 6 métriques clés (Dossiers engagés, En attente, À relancer J+8, Rendez-vous de la semaine, Échéances urgentes <48h, Résultats certifiés).
    - **Deux Commandes Héroïques Directes** :
      1. **« Que dois-je faire maintenant ? » (`CareerWhatShouldIDoNowModal.tsx`)** : Arbitrage IA en temps réel isolant les 3 à 4 actions prioritaires du jour avec justification de la valeur stratégique et déclenchement en 1 clic.
      2. **« Prépare-moi pour demain » (`CareerBriefingTomorrowModal.tsx`)** : Briefing de fin de journée anticipant les rendez-vous, alertes et fiches flash J-0 du lendemain + Vue stratégique de la semaine.
  - **Dossier Vivant & Timeline Chronologique (`CareerLiveDossierModal.tsx`)** :
    - Centralisation complète par opportunité : Timeline horodatée des interactions, Prochain Meilleur Pas (*Next Best Action*), stratégie de relance, gestion de réunion, documents attachés et notes personnelles.
  - **Moteur de Relance Intelligente Anti-Spam (`CareerSmartFollowUpModal.tsx`)** :
    - Diagnostic anti-harcèlement strict (timing courtois J+7/J+10, plafond de relances recommandées).
    - Principe d'apport de valeur systématique (ne jamais relancer sans élément d'actualité, document complémentaire ou clarification de jalon).
  - **Préparation de Rendez-vous & Fiche Flash J-0 (`CareerMeetingPrepModal.tsx`)** :
    - Fiche récapitulative contextuelle (Objectifs de l'échange, 3 arguments phares, questions pièges anticipées, questions intelligentes à poser à l'interlocuteur, lien visio / plan d'accès).
  - **Débriefing Vocal Instantané d'Après-Échange (« Comment ça s'est passé ? ») (`CareerPostMeetingDebriefModal.tsx`)** :
    - Saisie rapide ou dictée vocale enregistrée.
    - Qualification du sentiment (très positif, positif sous conditions, mitigé, défavorable), extraction des décisions actées, engagements réciproques et programmation automatique du prochain jalon dans la timeline.
  - **Résilience & Capitalisation Continue - Mode Plan B (`CareerPlanBModal.tsx`)** :
    - Règle d'or : *« Un refus produit du capital pour la tentative suivante »*.
    - Analyse objective des motifs de blocage, sauvegarde des actifs réutilisables (CV rédigé, devis chiffré, pitchs) et réallocation instantanée vers 2 à 3 opportunités de substitution hautement compatibles issues du Radar.
- **Carrière 5/7 (Terminé - Capital Relationnel, Réseau & Prospection)** :
  - **Philosophie Directrice** : *« Ne plus attendre qu'une opportunité apparaisse : aider l'utilisateur à créer lui-même ses opportunités en activant son réseau, sa visibilité et ses synergies. »*
  - **Hub Central de l'Écosystème Relationnel (`CareerRelationalEcosystemHub.tsx`)** :
    - Cockpit d'intelligence relationnelle avec métriques stratégiques (Contacts utiles, Nœuds à haut impact >90%, Deals & négociations, Introductions en attente, Relances courtoises J+7, Équipes actives).
    - Dialogue d'arbitrage instantané *« Qui dois-je contacter ou relancer aujourd'hui ? »* avec contrôle strict du délai de courtoisie.
  - **Carte Relationnelle Intelligente & Dynamique (`CareerRelationshipMapModal.tsx`)** :
    - Visualisation hiérarchique du graphe : *Moi (Point A) ➔ Objectif (Point B) ➔ Relations directes ➔ Facilitateurs & Intermédiaires vérifiés ➔ Décisionnaires & Opportunités cibles*.
    - Analyse de pertinence bidirectionnelle explicable : Ce que la relation peut apporter vs Ce que l'utilisateur lui apporte concrètement.
  - **Déduction Stratégique « Qui devrais-je connaître pour mon objectif ? » (`CareerWhoShouldIKnowModal.tsx`)** :
    - Déduction automatique des profils indispensables à partir du Point B (Distributeurs, acheteurs publics, régulateurs, mentors, partenaires techniques).
    - Identification des pistes concrètes dans les cercles autorisés avec score de matching et voie d'accès.
  - **Mode Introduction Professionnelle (`CareerIntroductionModal.tsx`)** :
    - Génération de messages d'approche personnalisés et qualifiés avec mention du facilitateur ou des intérêts convergents.
    - Règle de validation humaine obligatoire avant toute transmission (aucun message envoyé à l'insu de l'utilisateur).
    - Choix du format et canal : Discussion privée (Chat), Appel téléphonique, Visio Google Meet, Espace collaboratif partagé.
  - **Fiche Relationnelle 360° & Mémoire Active CRM (`CareerContactDetailModal.tsx`)** :
    - Pipeline à 10 étapes (Identifiée, À étudier, Introduction, Contact initial, Échange, Rendez-vous, Opportunité, Négociation, Résultat signé, Fidélisation).
    - Mémoire relationnelle ("Où en étais-je ?"), suivi des engagements réciproques (Qui doit faire quoi et pour quand ?), historique des notes privées et documents échangés.
    - Connexions directes avec les synergies du Réseau MOC (Tribus recommandées, Lives sectoriels, Idées de Reels vitrine de compétences).
  - **Équipes d'Opportunité & Réponse Collective (`CareerCollaborativeMissionModal.tsx`)** :
    - Constitution de consortia pluridisciplinaires (ex: Ingénieur + Juriste + Financier) pour répondre aux appels d'offres d'envergure.
    - Espace de travail partagé avec validation du consentement mutuel, répartition des rôles, tâches partagées et budget d'opportunité.
  - **Hub de Mentorat & Réputation Contextualisée (`CareerMentorshipModal.tsx`)** :
    - Boucle d'excellence : *J'apprends ➔ Je maîtrise ➔ J'accomplis ➔ Je transmets*.
    - Deux modes : *Trouver un mentor* et *Devenir mentor*.
    - Évaluation de la réputation par compétence spécifique (nombre de preuves auditées), sans score universel déshumanisant.
  - **Vue Synthétique 360° « Mon Écosystème Professionnel » (`CareerEcosystem360Modal.tsx`)** :
    - Tableau de bord en 8 piliers articulant Objectif, Deals, Capital Relationnel, Cible ICP, Partenariats, Équipes, Relances prioritaires et Capital de Preuve Mok Trust.
- **Carrière 6/7 (Terminé - Intelligence Stratégique, Trajectoires Prédictives & Orientation Continue)** :
  - **Philosophie Directrice** : *« Ne plus seulement accompagner la carrière actuelle de l'utilisateur : comprendre son évolution, anticiper les changements, détecter les meilleures trajectoires possibles et l'aider à accélérer vers son Point B. »*
  - **Formule Fondamentale** : `COMPRENDRE ➔ MESURER ➔ ANTICIPER ➔ CONSEILLER ➔ ACCÉLÉRER`.
  - **Hub Central d'Intelligence Stratégique (`CareerStrategicAdvisorHub.tsx`)** :
    - Cockpit en 8 piliers stratégiques intégrant la Boussole 4D, les 5 Trajectoires Types, le Graph de Compétences, les Plans 90j/1an, les Signaux Faibles, le Diagnostic de Plateau, le Conseil Multi-Experts et la Matrice de Décision Personnelle.
  - **Boussole Stratégique Professionnelle 4D (`CareerStrategicCompassModal.tsx`)** :
    - Articulation en 4 cadrans : *1. Où j'en suis (Point A & Score 74%) ➔ 2. Où je veux aller (Point B & Horizon 18m) ➔ 3. Où va le marché (Tendances & Signaux faibles) ➔ 4. Ce que je dois faire maintenant (Levier prioritaire & Rythme accéléré/équilibré)*.
  - **Simulateur de Trajectoires & Scénarios « Et si ? » (`CareerTrajectorySimulatorModal.tsx`)** :
    - Comparaison côte à côte de 5 trajectoires types (Trajectoire A: Verticale, Trajectoire B: Spécialisation Export, Trajectoire C: Management Filiale, Trajectoire D: Entrepreneuriat, Trajectoire E: Expatriation Internationale).
    - Moteur interactif de scénarios « Et si ? » (Impact sur le Point B, gain de temps, bonus salarial chiffré, premier pas recommandé).
  - **Skill Graph & Cartographie des Écarts (`CareerSkillGraphGapModal.tsx`)** :
    - Analyse de 6 catégories de compétences (Technique, Stratégie, Leadership, Langues, Relationnel, Digital IA) avec niveaux de preuve (déclarée, en apprentissage, évaluée, démontrée, utilisée, confirmée par réalisation).
    - Passerelles immédiates vers l'École Numérique / Campus pour combler les compétences bloquantes.
  - **Passeport de Compétences & Mode Reconversion (`CareerSkillsPassportModal.tsx`)** :
    - Cartographie des compétences transférables vers de nouveaux secteurs et métiers sans repartir de zéro.
  - **Plans d'Évolution 90 Jours & 1 An (`CareerEvolutionPlansModal.tsx`)** :
    - Feuille de route cadencée mois par mois (Mois 1: Fondations, Mois 2: Spécialisation, Mois 3: Clôture de Mandat Pilote) et trimestres T1 à T4.
  - **Diagnostic de Plateau & Commande « Débloque ma situation » (`CareerPlateauUnlockModal.tsx`)** :
    - Détection de stagnation, identification des verrous (compétence bloquante, positionnement trop étroit) et alternatives de déblocage avec calcul du Levier N°1.
  - **Conseil de Carrière Multi-Experts (`CareerMultiExpertCouncilModal.tsx`)** :
    - Orchestration de 4 experts clés de la Famille DIALLO (Mamadou / Carrière, Aïssata / Finance, Amadou / Langues, Fatoumata / Juridique-Expat) avec synthèses consolidées et feuille de route opérationnelle.
  - **Matrice de Décision Personnelle & Arbitrage d'Opportunités (`CareerDecisionMatrixModal.tsx`)** :
    - Pondération de 7 critères de vie (Rémunération, Potentiel, Autonomie, Équilibre, International, Stabilité, Sens) avec calcul de scores multicritères pour arbitrer entre plusieurs offres.
  - **Bilan de Carrière IA Généré (`CareerAIBilanModal.tsx`)** :
    - Synthèse globale (Réalisations, Compétences maîtrisées, Évolution du contexte, Opportunités ouvertes, Recommandations du prochain cycle).
  - **Visualisation Chronologique « Mon Évolution » (`CareerEvolutionTimelineModal.tsx`)** :
    - Timeline vivante : *Situation Initiale ➔ Point de Départ ➔ Compétences Acquises ➔ Opportunités Détectées ➔ Aujourd'hui (Momentum Clé) ➔ Prochaine Étape (J+60) ➔ Point B Cible*.
- **Carrière 7/7 (Terminé - Consolidation Finale, Cycle Perpétuel d'Accomplissement & Centre de Commande Unifié)** :
  - **Philosophie Directrice** : *« Consolider, pas reconstruire. L'accompagnement ne s'arrête pas à la réponse ou à l'action : il continue jusqu'au résultat, puis transforme ce résultat en nouveau point de départ. Plus le moteur devient puissant, plus l'interface devient simple. »*
  - **Dossier Maître Unique (`CareerMasterDossier`)** : Base de données vivante synchronisant l'identité, le cap (Point A ➔ Point B), le journal chronologique, les permissions de l'agent et les métriques d'impact.
  - **Moteur d'Orchestration Unifié (`careerUnifiedEngine.ts`)** :
    - `generateCareerNarrative` : Moteur de récit dynamique synthétisant l'épopée de l'utilisateur à partir des jalons du journal.
    - `askUniversalNextAction` : Moteur d'arbitrage décidant en temps réel de la meilleure action à accomplir avec justification de l'opportunité.
  - **Cockpit Unifié en Mode Simple & Avancé (`CareerMasterCommandHub.tsx`)** :
    - Mode Simple : *Ma Journée Carrière (Next Best Action & Checklist rapide), Avancement vers Point B, 3 Opportunités Chaudes, Accès Coach 3D*.
    - Mode Avancé : *Accès direct aux 7 piliers (GPS, Jumeau Pro, Radar, Réseau, Suivi Continu, Stratégie, Coach 3D)*.
  - **Commandes Universelles & Modals d'Accomplissement** :
    1. **« Raconte-moi mon parcours » (`CareerNarrativeStoryModal.tsx`)** : Récit valorisant et continu généré à partir du journal de bord, exportable en Markdown et écoutable vocalement.
    2. **« Que dois-je faire maintenant ? » (`CareerWhatShouldIDoModal.tsx`)** : Arbitrage instantané présentant les 3 meilleurs leviers avec gains attendus et déclenchement immédiat.
    3. **« J'ai une urgence » (`CareerEmergencyModal.tsx`)** : Prise en charge tactique éclair (Entretien dans 1h, Dossier ce soir, Offre à négocier, Réunion client) avec antisèche flash, 3 pièges mortels et simulateur 3D.
    4. **Mode Accomplissement & Boucle Infinie (`CareerAccomplishmentCelebrationModal.tsx`)** : Célébration de l'atteinte du Point B, capitalisation des acquis dans le Jumeau Pro, et proposition des 4 nouveaux caps (90 premiers jours, Nouvelle ambition, Pivot entrepreneurial, Rayonnement international).
    5. **Centre de Contrôle & Permissions IA (`CareerAgentPermissionsLogsModal.tsx`)** : Matrice granulaire d'autonomie (Standard, Copilote, Autonome), bouton de pause générale d'urgence et journal d'audit transparent de toutes les actions IA.
    6. **Onboarding Conversationnel Intelligent (`CareerConversationalOnboardingModal.tsx`)** : Diagnostic fluide guidé par la voix et les questions clés, sans formulaire rigide.
    7. **Recherche Universelle Carrière (`CareerUniversalSearchModal.tsx`)** : Moteur de recherche global indexant candidatures, CVs, contacts, compétences, entretiens et cours Campus.
    8. **Test de Cohérence du Cap (`CareerCoherenceAuditModal.tsx`)** : Vérification automatique de l'alignement entre les actions quotidiennes et le Point B de référence.
    9. **Opportunités Surprises (`CareerSurpriseOpportunityModal.tsx`)** : Décloisonnement algorithmique et détection de postes atypiques exploitant les compétences transférables.
    10. **Mon Impact & Transmission (`CareerImpactTransmissionModal.tsx`)** : Boucle vertueuse *Apprendre ➔ Progresser ➔ Accomplir ➔ Transmettre* avec métriques d'utilité collective (personnes aidées, mentorats, Tribus actives).

