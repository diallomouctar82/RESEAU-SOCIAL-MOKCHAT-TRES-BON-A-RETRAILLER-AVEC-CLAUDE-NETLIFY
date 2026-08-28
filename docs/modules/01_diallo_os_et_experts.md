# MODULE 01 — DIALLO OS, EXPERTS & CONSEIL COLLÉGIAL
> Noyau d’accompagnement, hub multi-experts et orchestration transversale

---

## 1. VISION & OBJECTIF
- **Vision** : proposer une famille cohérente d’experts spécialisés qui accompagne chaque utilisateur avec précision, continuité et chaleur humaine.
- **Objectif** : analyser les besoins transversaux, décomposer les projets de vie en étapes concrètes et coordonner les interventions des spécialistes métiers.

---

## 2. PARCOURS UTILISATEUR
1. L’utilisateur choisit un expert.
2. **Discuter** ouvre une conversation texte persistante dans l’interface Experts.
3. **Vocal** ouvre un appel conversationnel mains-libres : micro → transcription → routeur IA → synthèse vocale.
4. **Vidéo** ouvre le même salon d’appel avec caméra/vision multimodale disponible.
5. Le moteur de routage tente les fournisseurs activés selon la politique de résilience et bascule automatiquement en cas d’échec.
6. La synthèse vocale tente ElevenLabs via proxy serveur sécurisé, puis bascule vers la voix système du navigateur si ElevenLabs est absent ou indisponible.

---

## 3. ARCHITECTURE TECHNIQUE
### Composants clés
- `components/ExpertsHub.tsx` : annuaire, dossiers, sélection expert et ouverture du salon d’appel.
- `components/ExpertsCatalogue.tsx` : boutons **Discuter / Vocal / Vidéo** reliés aux callbacks du hub.
- `components/ChatInterface.tsx` : conversation texte, caméra, voix et affichage du moteur actif.
- `components/LiveSession.tsx` : salon vocal/vidéo résilient, sans clé fournisseur exposée dans le navigateur.
- `services/aiRoutingService.ts` : routage et bascule automatique entre fournisseurs.
- `services/voiceEngine.ts` : STT navigateur, ElevenLabs HD et fallback vocal natif.
- `components/MultimodalCameraHUD.tsx` : caméra et analyse visuelle contextuelle.

### Backend Netlify sécurisé
- `/api/ai/chat` → `netlify/functions/ai-chat.mts`
- `/api/ai/connectors` → `netlify/functions/ai-connectors.mts`
- `/api/tts` → `netlify/functions/tts.mts`
- `/api/tts/voices` → `netlify/functions/tts-voices.mts`
- `netlify.toml` assure les redirections API et le fallback SPA.

Les secrets (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `DEEPSEEK_API_KEY`, `GEMINI_API_KEY`, `ELEVENLABS_API_KEY`, etc.) restent exclusivement côté serveur Netlify.

---

## 4. RÉSILIENCE
### Conversation
Le client appelle uniquement `/api/ai/chat`. Le routeur choisit le fournisseur selon la configuration du Super Admin. Si un moteur échoue, `aiRoutingService` continue automatiquement avec le suivant et garde un journal de bascule.

### Voix
1. ElevenLabs via `/api/tts` si `ELEVENLABS_API_KEY` est configurée.
2. Si indisponible, `voiceEngine` utilise automatiquement Speech Synthesis du navigateur.
3. Une panne de TTS ne doit jamais provoquer un écran blanc ou empêcher le chat texte.

### Microphone
- Le salon vérifie la compatibilité Web Speech.
- Une permission refusée ou un navigateur incompatible produit un message explicite et un bouton Réessayer, sans crash de l’application.

---

## 5. SÉCURITÉ
- Aucun secret fournisseur dans les variables `VITE_*` destinées au navigateur.
- Aucun appel direct fournisseur ne doit être nécessaire pour le fonctionnement normal en production Netlify.
- Les clés sont détectées côté serveur et seul un statut `isConfigured` est retourné à l’interface.
- L’absence d’une clé est un état dégradé normal : l’application continue de fonctionner.

---

## 6. ÉTAT DE DÉVELOPPEMENT
### Opérationnel dans la branche de correction
- Bouton **Discuter** relié au ChatInterface.
- Boutons **Vocal** et **Vidéo** ouvrent le salon Expert.
- Appel vocal connecté au routeur multi-fournisseurs au lieu d’un client Gemini navigateur exigeant une clé au chargement.
- ElevenLabs protégé par fonction serveur Netlify avec fallback vocal natif.
- Endpoint serveur de conversation multi-fournisseurs ajouté pour Gemini, OpenAI, DeepSeek, Claude, Qwen, Kimi, Mistral, Grok et OpenRouter.
- Endpoint de diagnostic des connecteurs ajouté sans exposition des secrets.

### À vérifier avant fusion production
- Build Netlify de la branche.
- Variables serveur Netlify réellement configurées pour les fournisseurs souhaités.
- Permission microphone sur Chrome/Edge mobile et desktop.
- Test de conversation avec au moins un fournisseur IA réel.
- Test ElevenLabs puis test du fallback navigateur.
- Test caméra sur appareil mobile.

---

## 7. RÈGLE DE NON-RÉGRESSION
Toute future évolution des experts doit respecter :

**clic utilisateur → permission média explicite → proxy serveur sécurisé → routeur résilient → fallback gracieux → jamais d’écran blanc.**
