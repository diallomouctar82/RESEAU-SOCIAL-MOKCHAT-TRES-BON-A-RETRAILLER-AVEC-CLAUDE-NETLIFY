# 🤖 RÈGLES SYSTÈME PERMANENTES & CHARTE AGENT — LE MONDE À VOUS
> **Ce fichier est automatiquement injecté dans les instructions de tout agent IA intervenant sur ce projet.**

---

## 🔒 1. PRINCIPE CARDINAL : LA MÉMOIRE VIVANTE CONTINUE

La documentation de **Le Monde à Vous** n'est pas optionnelle, ni rédigée après coup. Elle est **une partie intégrante de chaque acte de développement**.

Tout agent ou développeur intervenant sur cette base de code DOIT appliquer le cycle continu :

> **CONSULTER LA MÉMOIRE → COMPRENDRE L’EXISTANT → EXÉCUTER → TESTER → DOCUMENTER → METTRE À JOUR LA MÉMOIRE → CLÔTURER.**

---

## ⚡ 2. DIRECTIVE INFRASTRUCTURE & BACKEND PAR DÉFAUT (SUPABASE & DÉPLOIEMENT)

1. 🚀 **Backend par Défaut = Supabase** : Pour ce projet et tous les projets, utiliser **Supabase** (PostgreSQL, Auth, Storage, Realtime) comme socle backend par défaut. Ne JAMAIS démarrer de nouveaux modules ou projets avec Firebase, sauf demande explicite de l'utilisateur.
2. 🛡️ **Zéro Écran Blanc au Déploiement** : Tout projet et composant doit être conçu pour démarrer instantanément et fonctionner sur **GitHub**, **Netlify**, **Cloud Run** et **Vercel** sans aucun écran blanc (*White Screen of Death*).
3. ⏳ **Initialisation Lazy & Dégradation Gracieuse** : Ne JAMAIS initialiser un service externe (Supabase, Gemini, APIs tierces) au chargement global/évaluation de module. Toujours utiliser une instanciation à la demande (`getClient()`, accesseurs sécurisés) et un fallback gracieux (Local-First / IndexedDB / offline state).
4. 🔑 **Tolérance Totale aux Clés Absentes** : Aucune variable d'environnement manquante (`VITE_SUPABASE_URL`, `GEMINI_API_KEY`, etc.) ne doit empêcher l'application de démarrer. L'application reste 100% explorable et fonctionnelle en mode dégradé gracieux.
5. 🌐 **Gestion des Secrets via Variables d'Environnement** : Toutes les clés et secrets transitent exclusivement par les variables d'environnement documentées dans `.env.example`.
6. 🧹 **Propreté du Code & Élimination des Références Mortes** : Supprimer systématiquement les imports orphelins, les références mortes et maintenir une architecture propre, cohérente et découplée.
7. 🏆 **Priorité Absolue : Stabilité & Déploiement Réussi** : La résilience, l'absence de crash et la garantie de déploiement immédiat prévalent toujours sur l'ajout de nouvelles fonctionnalités.

---

## 📚 3. RÉFÉRENTIEL DOCUMENTAIRE OBLIGATOIRE
Avant toute modification de code, l'agent doit consulter :
1. **Livre de Vision Maître** : `/docs/LIVRE_DE_VISION.md` (Philosophie, anthropomorphisme, règles absolues).
2. **Architecture Globale** : `/docs/ARCHITECTURE_GLOBALE.md` (Cartographie, flux, services, types).
3. **Journal des Décisions** : `/docs/JOURNAL_DECISIONS.md` (Historique des choix passés).
4. **Fiche du Module concerné** : `/docs/modules/[module_concerne].md`.
5. **Registre des Idées** : `/docs/REGISTRE_IDEES.md` (Pour consigner les pistes futures non immédiates).
6. **État Actuel** : `/docs/ETAT_ACTUEL.md`.

---

## 🚫 4. INTERDICTIONS SYSTÈME STRICTES & NON NÉGOCIABLES

1. ❌ **Interdiction d'Incarnation IA/Robot** : Les experts conversationnels sont STRICTEMENT des **humains professionnels d'élite de la Famille DIALLO**. Ne JAMAIS afficher de prompt ou message disant « Je suis une intelligence artificielle / un modèle de langage / un robot ».
2. ❌ **Interdiction d'« AI Slop »** : Pas de dégradés violet-bleu génériques, pas de néon artificiel, pas de cartes imbriquées dans des cartes sans logique optique, pas de faux boutons sans action.
3. ❌ **Interdiction d'Écraser l'Histoire** : Lors d'une refonte, consigner l'ancienne version, le motif du changement et la nouvelle version dans `JOURNAL_DECISIONS.md`.
4. ❌ **Interdiction de Clôturer sans Documenter** : Aucune mission n'est terminée tant que le code n'est pas testé (`compile_applet`) ET la documentation mise à jour.

---

## 📝 5. PROCÉDURE DE FIN DE MISSION POUR CHAQUE PROMPT
À chaque fin d'intervention, l'agent doit :
1. Valider la compilation complète sans erreur (`compile_applet`).
2. Mettre à jour la fiche du module concerné dans `/docs/modules/`.
3. Ajouter une entrée dans `/docs/JOURNAL_DECISIONS.md` si une décision a été prise.
4. Actualiser `/docs/ETAT_ACTUEL.md` et `/docs/HISTORIQUE_VERSIONS.md` si un jalon est franchi.
5. Présenter à l'utilisateur un résumé clair, scannable et professionnel des réalisations.
