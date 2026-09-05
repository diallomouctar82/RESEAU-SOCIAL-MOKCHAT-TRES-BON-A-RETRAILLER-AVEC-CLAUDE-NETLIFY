# 🤖 MODULE 01 — DIALLO OS, EXPERTS & CONSEIL COLLÉGIAL
> **Noyau d'Intelligence Humanisée, Hub Multi-Agents et Orchestration Transversale**


## 🧑‍🚀 AVATAR VIVANT DE L'ARCHITECTE (DEC-2026-054 → DEC-2026-057, 04–05/09/2026)
Construit d'après la compétence **Vision Smart AI Core — playbook 15 « Avatar vivant personnalisable, présence conversationnelle vivante » (v1.0.0)** et le Future UI/UX Gate.

- **Niveau de présence livré : P1 + P2** (`ARCHITECTE_PRESENCE_LEVEL`) — présence légère en SVG/CSS et bouche animée pendant la parole. **P3** (avatar vidéo temps réel) et **P4** (avatar génératif personnel) ne sont ni livrés ni simulés.
- **Le bouton devient un visage** : le rond à icône de `ArchitecteFloatingBar` est remplacé par `ArchitecteAvatar`. Le visage par défaut est un **vrai portrait photographique** (`public/architecte/architecte.webp`, composé d'après la référence validée par la Direction) animé par `LivingPortrait` ; le dessin vectoriel `ArchitecteAvatarFace` n'est plus qu'un repli technique quand aucune photo n'est réglée.
- **Comment une photo vit** (`services/architecte/livingAvatar.ts`, moteur pur et déterministe — le temps écoulé entre, une pose sort, tout est testable sans navigateur) : respiration à deux ondes de périodes incommensurables (jamais une boucle de machine), clignements sur une table fixe d'intervalles irréguliers (220 ms, aussi pendant la parole), dérive de tête, inclinaisons de repos alternées, hochements sur le **phrasé** (emphase lissée, pas chaque syllabe), balancement lent pendant la parole, lèvres entrouvertes et largeur de bouche variable en parlant, **saccades du regard**. Le rendu est un **Canvas 2D** (`services/architecte/portraitPainter.ts`, `components/architecte/LivingPortrait.tsx`) : fond de bureau immobile, tête découpée et fondue qui respire devant lui, mâchoire **déformée en continu** (80 % du mouvement à la lèvre du bas, 100 % au menton, 0 au cou — le cou et le col ne bougent pas, aucune couture), cavité avec un soupçon de dents, paupières faites de la peau au-dessus des cils étirée dans une ellipse fondue par œil, regard déplacé dans deux ellipses fondues. Aucun rendu React par image : la boucle d'animation peint directement via `draw(pose)`.
- **Banc à pose fixée** : `design-lab/banc/portrait.html?jaw=0.8&eyelid=1&gazeX=1&tilt=5` (`npx vite`) isole chaque composante du rendu pour trouver un défaut sans le mouvement.
- **Calage par photo** (`PortraitRig` + `MouthAnchor`, réglables au Super-Admin) : ligne des yeux, hauteur des yeux, ligne entre les lèvres, course de mâchoire, bas du menton, centre et largeur de chaque œil, centre/largeur/inclinaison de la bouche. Valeurs par défaut **relevées sur grille** pour le portrait livré (yeux 46,3 % — centres à 41,75 et 63,25 %, larges de 9 % —, lèvres 67,3 %, menton 80 %, bouche centrée à 52,5 % et large de 18 %, −1,6°).
- **Page publique `/architecte`** (rendue avant l'écran de connexion, aucune donnée de compte) : l'avatar en grand, « Le faire parler à voix haute » avec la voix intégrée du navigateur — bouche au rythme des mots, annoncé tel quel — et une boucle muette de démonstration ; repli explicite si la voix est indisponible.
- **Huit états** (machine normative AI Core) : `rest`, `listening`, `thinking`, `speaking`, `success`, `error`, `fallback`, `offline`. `fallback` et `offline` manquaient à la grammaire du dépôt ; chaque état emprunte la teinte et l'animation d'`AvatarGrammarState` déjà en place.
- **Synchro labiale à trois niveaux, jamais surévalués** : `amplitude_reelle` (toute voix HD servie par la chaîne vocale — amplitude efficace **temporelle** mesurée sur l'élément `<audio>`, normalisée par une crête adaptative, bouche close sous 16 % de la crête ; la voix entendue est retardée de 60 ms pour que la bouche ne soit jamais en retard — corrélation son ↔ bouche mesurée 0,80 à 0 ms sur la phrase Vision Smart, DEC-2026-057), `rythme_des_mots` (moteur natif — `speechSynthesis` n'expose aucun flux audio ; frontières de mots relayées jusqu'à l'avatar), `aucune`. Tous les lissages (bouche, emphase, part de parole, attention, largeur de lèvres) sont des **constantes de temps**, pas des facteurs par image.
- **Voix : la chaîne vocale du Super-Admin, pas un fournisseur** : `voiceEngine` → `aiGateway.generateSpeechDetailed` → fonction Edge `ai-gateway` (catégorie `voice`) qui classe les fournisseurs en base (`get_ranked_ai_candidates`), lit les secrets côté serveur, **passe au suivant sur erreur**, applique les plafonds et journalise (`ai_call_log`). Adaptateurs de synthèse du registre : `elevenlabs`, `gemini_tts`, `polly`, `azure_speech`, `google_tts`, `cartesia`, `playht`, `generic_http`. Dernier relais : la voix intégrée du navigateur (bouche au rythme des mots, annoncé tel quel). Le navigateur ne voit jamais de clé, seulement un fichier audio.
- **Test avec son** : `public/architecte/vision-smart.wav` (phrase demandée par la Direction, voix HD) et le bouton « Écouter la phrase Vision Smart (voix HD) » sur `/architecte`, même chaîne audio que le moteur ; le RMS réellement mesuré est rejoué en test (`tests/fixtures/vision-smart-rms.json`) et la chaîne audio est gardée par `tests/voiceLipSyncChain.test.ts`.
- **Réglages Super-Admin** (`AdminArchitecteAvatarCard`) : changer l'avatar, remettre l'avatar par défaut, activer/désactiver les animations et la synchro labiale, régler la voix (catalogue `ELEVENLABS_CURATED_VOICES`), positionner la bouche sur une photo.
- **Garde-fous** : identité officielle visible (« Présence officielle MokNet »), pastille « média synthétique » sur une photo, animation coupée hors écran / onglet caché / mouvement réduit, état toujours écrit et porté par `aria-label`.

---

## 🎯 1. VISION & OBJECTIF
- **Vision** : Remplacer l'assistance robotique froide par une famille d'experts humains chevronnés (Famille DIALLO) qui accompagnent chaque utilisateur avec déontologie, précision et chaleur humaine.
- **Objectif** : Analyser les besoins transversaux des usagers, décomposer leurs projets de vie en étapes concrètes et coordonner les interventions des spécialistes métiers.

---

## 👥 2. UTILISATEURS CONCERNÉS & PARCOURS
- **Publics** : Tout citoyen du monde, étudiant, migrant, entrepreneur ou particulier cherchant un conseil spécialisé ou une feuille de route globale.
- **Parcours Type** :
  1. L'utilisateur pose une question ou exprime un projet (texte, voix, document).
  2. L'orchestrateur analyse l'intention et identifie l'expert leader et les collaborateurs.
  3. L'expert répond selon le format standardisé en 5 points (Analyse, Solutions, Démarches, Points d'attention, Actions immédiates).
  4. Si le sujet est complexe, la Salle de Conseil Collégial (`CouncilRoom.tsx`) est convoquée pour un avis concerté.

---

## ⚙️ 3. COMPOSANTS & ARCHITECTURE TECHNIQUE
- **Fichiers Clés** :
  - `components/ExpertsHub.tsx` : Annuaire des experts, dossiers actifs et historique.
  - `components/ChatInterface.tsx` : Espace de discussion interactif unifié.
  - `components/CouncilRoom.tsx` & `UnifiedCouncilRoom.tsx` : Salon de délibération collégiale.
  - `components/DialloOS.tsx` : Console système et coordination.
  - `services/orchestratorService.ts` : Moteur de routage et découpage d'intentions.
  - `services/voiceEngine.ts` : Synthèse et reconnaissance vocale.
- **Modèles de Données (`types.ts`)** :
  - `Agent`, `AgentRole`, `DossierParcours`, `DossierStep`, `DossierTask`, `DialloOrchestrationResult`.

---

## 🛡️ 4. RÈGLES MÉTIER & SÉCURITÉ
- **Règle Absolue d'Incarnation** : Interdiction formelle de se déclarer IA ou robot.
- **Limites Déontologiques** : Pas de diagnostic médical définitif, pas de conseil juridique engageant la responsabilité légale.
- **Garde-fous Géographiques** : Adaptation obligatoire des réponses au pays de résidence de l'usager.

---

## 📊 5. ÉTAT DE DÉVELOPPEMENT & ÉVOLUTIONS
- **Terminé** : 8 Experts modélisés, Salle de conseil opérationnelle, Orchestrateur fonctionnel, Synthèse vocale multilingue.
- **Partiel / En cours** : Intégration d'un historique de délibération persistant sous Cloud Firestore.
- **Évolutions Prévues** : Avatars 3D photo-réalistes animés en temps réel lors des sessions vocales.
