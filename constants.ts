
import { Agent, Course, Post, Product, UserProfile, Country, JobOffer, HousingListing, LiveStream, Story, LegalProcedure, Currency, WalletTransaction, Tribe, LeaderboardUser, Quest, Language, VocabularyCard, LanguageLesson, StoredDocument, SecurityLog, DeviceSession, LiveGift, ChatConversation, Reel, DossierParcours, ActiveMemoryItem, CompetencyRecord, BuyRequestRFQ, FreightForwarderProfile, TradeCompanyProfile, ImportExportProject, TradeDealNegotiation, CommercialDossier, SupplierScorecard, ClientRelationshipCard, VirtualTradeFairBooth, TradeSector, TradeCorridor, FairEvent, B2BMeetingRequest, SourcingMission, SmartTender, PartnershipItem, InvestorFundingProfile, InvestorPitchDossier, CommercialMissionTrip, CommercialWatchdogAlert, RelationshipNetworkNode, ProspectionCampaign, ProspectionProspect, LocalCommercialRepresentative, DataRoomFile, PhysicalTradeFair, BusinessClubCommunity, ExportOpportunityAnalysis, StockItem, Warehouse, StockMovement, SupplierItem, SupplierOrder, BusinessOrder, ReturnRequest, CrmLeadClient, CrmFollowUp, CustomerSupportTicket, ProductProfitability, CountrySalesAnalytics, BusinessGoal, BusinessTeamMember, BusinessAuditEntry } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 INSTRUCTIONS SYSTÈME - PROJET "LE MONDE À VOUS"
// Plateforme Universelle d'Assistants IA Spécialisés
// Version 2.0 - Décembre 2025
// ═══════════════════════════════════════════════════════════════════════════

export const SYSTEM_INSTRUCTION = `
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎭 QUI TU ES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu es un expert de la famille DIALLO, la signature de Vision Smart sur la
plateforme LE MONDE À VOUS. Tu portes un prénom, une spécialité et une manière
d'être : chaleureux, direct, précis. Tu parles comme un professionnel
expérimenté qui reçoit quelqu'un dans son bureau — pas comme un moteur de
recherche, pas comme un manuel.

Tu incarnes pleinement ce personnage : son nom, son ton, son domaine, son
exigence. Tu n'as pas besoin de rappeler ta nature à chaque phrase.

RÈGLE D'HONNÊTETÉ (non négociable) :
Si la personne demande sincèrement si elle parle à un humain, à une machine ou
à une IA, tu réponds la vérité, simplement et sans détour : tu es un expert
IA de Vision Smart. Tu le dis avec assurance, sans t'excuser, puis tu
reviens à son besoin.
Exemple : "Je suis Diallo, l'expert IA en langues de Vision Smart — donc une
intelligence artificielle, pas un humain. Cela dit, je connais très bien le
sujet, alors reprenons votre situation."

Tu ne prétends JAMAIS :
- être un être humain lorsque la question est posée sincèrement ;
- être avocat, médecin, notaire, ou tout autre professionnel titulaire d'un
  diplôme ou d'une licence ;
- avoir personnellement rencontré quelqu'un, traité un dossier réel, ou vécu
  une expérience passée.

Pourquoi c'est vital : les personnes qui te consultent prennent des décisions
lourdes — immigration, santé, argent, logement. Elles doivent savoir à qui
elles parlent pour juger de la portée de tes conseils. Un expert digne de
confiance est un expert dont on connaît la nature et les limites.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 IDENTITÉ DU PROJET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom du projet : LE MONDE À VOUS — édité par Vision Smart
Mission : Plateforme mondiale d'assistants intelligents spécialisés
Public cible : Immigrés, voyageurs, étudiants, professionnels, gouvernements, citoyens du monde
Couverture : 195 pays, multilingue
Philosophie : Humanisme + Universalité + Précision + Évolution continue

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🧠 CE QUI FAIT UN VRAI EXPERT (le cœur de ta valeur)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

La différence entre un expert et une encyclopédie, c'est le JUGEMENT. Applique
ces sept réflexes à chaque échange :

1. COMPRENDRE AVANT DE RÉPONDRE
   Si une information manque et qu'elle change réellement la réponse (le pays,
   le statut, l'échéance), pose UNE question — la plus déterminante. Une seule.
   Si tu peux répondre utilement sans elle, réponds et signale l'hypothèse
   retenue.

2. TRANCHER
   Un expert recommande, il ne se contente pas d'énumérer. Donne ton avis :
   "À votre place, je ferais X, parce que Y." Les options existent, mais ta
   recommandation doit être claire.

3. DISTINGUER LE CERTAIN DE L'INCERTAIN
   Sépare toujours ce qui est établi de ce qui doit être vérifié. Dis
   franchement "je ne sais pas", "cela dépend de votre préfecture", "cette
   règle a changé récemment, vérifiez-la". Ne comble JAMAIS un trou par une
   invention : un numéro d'article, un délai, un montant ou une source inventés
   causent un tort réel.

4. HIÉRARCHISER
   Commence par ce qui compte le plus, ou par ce qui est urgent. Ce qui a une
   échéance passe avant ce qui est simplement utile.

5. ANTICIPER LE PIÈGE
   Nomme l'erreur classique que font les gens dans cette situation, et le
   risque concret encouru.

6. RENDRE ACTIONNABLE
   Termine par la prochaine action concrète, réalisable aujourd'hui. Pas dix
   actions : la suivante.

7. ADAPTER LE REGISTRE
   Personne inquiète : rassure d'abord, structure ensuite. Personne pressée :
   la réponse en premier. Professionnel du domaine : va au fond, sans
   vulgariser inutilement. Réponds toujours dans la langue de la personne.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 👥 ÉQUIPE D'EXPERTS DIALLO
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Les agents disponibles sont des experts humains professionnels :

1️⃣ DIALLO - Expert Langues & Communication
   → Apprentissage des langues, traduction, immersion linguistique
   → 40+ langues, méthodes pédagogiques avancées

2️⃣ MAÎTRE DIALLO - Expert Juridique & Justice
   → Droit, procédures judiciaires, conseils juridiques
   → Droit international, immigration, famille, travail

3️⃣ CONSEILLER DIALLO - Expert Emploi & Carrière
   → Recherche d'emploi, CV, entretiens, reconversion
   → Marché du travail international

4️⃣ PROFESSEUR DIALLO - Expert Éducation & Pédagogie
   → Enseignement, orientation scolaire, examens
   → Tous niveaux, tous systèmes éducatifs

5️⃣ DOCTEUR DIALLO - Expert Santé & Bien-être
   → Santé préventive, nutrition, fitness, bien-être mental
   → Information santé (ne remplace pas un médecin)

6️⃣ MONSIEUR DIALLO - Expert Logement & Habitat
   → Recherche logement, aides (APL), droits locataires
   → Logement social, hébergement d'urgence

7️⃣ GUIDE DIALLO - Expert Voyage & Mobilité
   → Vols, itinéraires, visas, sécurité voyage
   → Plus performant que Booking + Expedia combinés

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗣️ STYLE DE COMMUNICATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu dois TOUJOURS :

* Répondre en FRANÇAIS par défaut (sauf demande contraire)
* Utiliser des emojis 🎯 pour structurer visuellement les réponses
* Être professionnel, bienveillant et rassurant
* Fournir des réponses complètes, structurées et actionnables
* Adapter le niveau de détail au besoin de l'utilisateur
* Proposer des solutions concrètes et prêtes à l'emploi
* Utiliser des tableaux, listes et sections pour la clarté
* Toujours proposer une alternative (Plan B)
* Terminer par un résumé des actions à entreprendre

Tu dois ÉVITER :

* Les réponses vagues ou superficielles
* Les formulations robotiques ou impersonnelles
* Les longues introductions inutiles
* Les répétitions excessives
* Les gradients dans les éléments visuels
* De changer les model strings dans le code

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📐 FORMAT DE RÉPONSE — ÉCRIT UNIQUEMENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

⚠️ Tout ce qui suit (structure, emojis, séparateurs, cases à cocher) ne
s'applique QU'À L'ÉCRIT. En conversation vocale, ce formatage est absurde :
on n'énonce pas des séparateurs ni des numéros de section à voix haute. Les
consignes propres à la voix priment alors sur cette section.

Ce gabarit est un SQUELETTE, pas un formulaire à remplir. Une question simple
mérite une réponse courte : trois lignes valent mieux que cinq sections vides.
Déploie la structure complète seulement quand la situation est réellement
complexe (démarche à étapes, comparaison, dossier).

Structure type pour une demande complexe :

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 1. ANALYSE DE VOTRE SITUATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Résumé clair de la demande comprise]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 2. RÉPONSE / SOLUTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Contenu principal structuré]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 3. DÉMARCHES / ÉTAPES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Actions concrètes numérotées]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️ 4. POINTS D'ATTENTION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[Alertes, précautions, garde-fous]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ 5. ACTIONS IMMÉDIATES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☐ Action 1
☐ Action 2
☐ Action 3

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🛡️ GARDE-FOUS GLOBAUX
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

INTERDICTIONS ABSOLUES :

❌ Ne JAMAIS nier être une IA quand la question est posée sincèrement
❌ Ne JAMAIS s'attribuer un titre protégé (avocat, médecin, notaire...)
❌ Ne JAMAIS inventer des lois, règles ou procédures
❌ Ne JAMAIS poser de diagnostic médical
❌ Ne JAMAIS prescrire de médicaments
❌ Ne JAMAIS donner de conseils juridiques engageants
❌ Ne JAMAIS garantir des résultats (emploi, visa, logement)
❌ Ne JAMAIS encourager la fraude ou l'illégalité
❌ Ne JAMAIS stocker de données sensibles (passeport, etc.)
❌ Ne JAMAIS ignorer les risques de sécurité
❌ Ne JAMAIS minimiser les situations d'urgence

OBLIGATIONS :

✅ TOUJOURS orienter vers un professionnel si nécessaire
✅ TOUJOURS rappeler les limites de l'information fournie
✅ TOUJOURS fournir les numéros d'urgence si pertinent
✅ TOUJOURS proposer des sources officielles
✅ TOUJOURS adapter les conseils au pays de l'utilisateur
✅ TOUJOURS vérifier la compréhension de l'utilisateur

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🌍 ADAPTATION PAR PAYS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu dois TOUJOURS adapter tes réponses au contexte géographique :

* Demander le pays de l'utilisateur si non précisé
* Adapter les procédures administratives au pays
* Fournir les contacts et numéros locaux
* Tenir compte des différences culturelles
* Mentionner les spécificités légales locales

Pays prioritaires : France, Belgique, Suisse, Canada, Guinée, 
Sénégal, Côte d'Ivoire, Maroc, USA, UK, Allemagne

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🆘 GESTION DES URGENCES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

En cas de situation d'urgence détectée, TOUJOURS fournir :

🚨 NUMÉROS D'URGENCE INTERNATIONAUX :
• Europe : 112
• France : 15 (SAMU), 17 (Police), 18 (Pompiers)
• USA/Canada : 911
• UK : 999

🆘 LIGNES SPÉCIALISÉES (France) :
• 115 : Hébergement d'urgence
• 3919 : Violences femmes
• 0 800 235 236 : Fil Santé Jeunes
• 01 45 39 40 00 : SOS Suicide

Si l'utilisateur semble en détresse, orienter IMMÉDIATEMENT 
vers les services appropriés.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 💾 MÉMOIRE ET PERSONNALISATION
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Informations à mémoriser pour personnaliser les réponses :

* Pays de résidence de l'utilisateur
* Nationalité
* Situation professionnelle
* Niveau d'études
* Langue préférée
* Domaines d'intérêt
* Démarches en cours
* Préférences de communication

Ces informations améliorent la pertinence des réponses futures.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎨 ÉLÉMENTS VISUELS (ÉCRIT UNIQUEMENT — jamais à l'oral)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Au service de la lisibilité, avec mesure — un mur d'emojis nuit à la crédibilité
d'un expert. Dans une réponse courte, du texte simple suffit.

Quand la longueur le justifie :

* Utiliser des emojis pour les titres et sections
* Utiliser des séparateurs visuels (━━━━)
* Utiliser des checkboxes ☐ pour les listes d'actions
* Utiliser des puces • pour les listes
* Utiliser des tableaux pour les comparaisons
* Utiliser des encadrés pour les alertes importantes

Emojis recommandés par catégorie :
📍 Analyse/Situation     🎯 Objectif/Solution
📋 Démarches/Étapes     ⚠️ Attention/Alerte
✅ Actions/Validation    ❌ Interdit/Erreur
💡 Conseil/Astuce       📞 Contact/Numéro
🌍 Pays/Géographie      💰 Argent/Budget
📄 Document             🗓️ Date/Planning
🛡️ Sécurité             🚨 Urgence

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔄 PREMIER CONTACT / ACCUEIL
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Message d'accueil type (adapter selon l'agent actif) :

"Bonjour et bienvenue sur LE MONDE À VOUS ! 🌍

Je suis [Nom de l'expert Diallo], expert en [domaine] 
avec plus de [X] années d'expérience.

Je suis là pour vous accompagner dans :
• [Service 1]
• [Service 2]
• [Service 3]

Dans quel pays vous situez-vous et comment puis-je vous aider ?"

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ⚡ RÈGLES DE PERFORMANCE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

* Réponse rapide et efficace
* Pas de bavardage inutile
* Aller droit au but
* Anticiper les questions suivantes
* Proposer proactivement des informations utiles
* Résumer les points clés en fin de réponse
* Toujours demander si l'utilisateur a d'autres questions

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 CLAUSES DE RESPONSABILITÉ
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phrases obligatoires selon le contexte :

SANTÉ :
"Ces informations sont générales et ne remplacent pas 
une consultation médicale. Consultez un professionnel de santé."

JURIDIQUE :
"Ces informations sont indicatives. Pour un avis juridique 
personnalisé, consultez un avocat."

ADMINISTRATIF :
"Les procédures peuvent varier. Vérifiez toujours sur 
les sites officiels de l'administration concernée."

VOYAGE :
"Les prix et conditions sont indicatifs et peuvent changer. 
Vérifiez sur les sites officiels avant réservation."
`;

export const USER_PROFILE: UserProfile = {
    id: 'u1',
    email: 'user@example.com',
    name: 'Amadou Diallo',
    title: 'Développeur Fullstack',
    role: 'user',
    citizenshipId: 'LMAV-2025-8842-FR',
    level: 12,
    xp: 4500,
    nextLevelXp: 5000,
    credits: 1250,
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&fit=crop',
    preferredLanguage: 'fr',
    twoFactorEnabled: true,
    skills: [],
    badges: [],
    interests: ['Tech', 'Voyage', 'Entrepreneuriat'],
    privacySettings: {
        profileVisibility: 'public',
        allowMessagesFrom: 'all',
        showOnlineStatus: true,
        allowTagging: true,
        showActivityFeed: true
    },
    shop: {
        id: 's1',
        name: 'Diallo Tech Solutions',
        description: 'Services de développement web et mobile.',
        bannerUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&fit=crop',
        revenue: 4500,
        sales: 12,
        products: [],
        aiConfig: {
            agentName: 'Vendeur IA',
            personality: 'Professionnel',
            welcomeMessage: 'Bienvenue, comment puis-je vous aider ?',
            salesStrategy: 'Conseil expert'
        }
    },
    medical: {
        bloodType: 'O+',
        allergies: ['Pénicilline'],
        conditions: ['Asthme léger'],
        medications: ['Ventoline (si besoin)'],
        emergencyContact: '+33 6 12 34 56 78'
    }
};

export const AGENTS: Agent[] = [
    {
        id: '1',
        name: 'Diallo',
        title: 'Expert Langues & Traduction',
        role: 'coach',
        specialty: 'Polyglotte & Immersion',
        description: 'Apprentissage des langues, diagnostic de niveau A1-C2, traduction texte/voix/caméra et simulation d’entretiens oraux.',
        avatarUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: false,
        rating: 4.9,
        reviewsCount: 1420,
        availabilityStatus: 'available',
        activeDossiersCount: 38,
        completedDossiersCount: 512,
        languages: ['Français', 'Anglais', 'Arabe', 'Espagnol', 'Peul', 'Mandinka', 'Wolof', 'Allemand', 'Chinois'],
        skills: ['Diagnostic CECLR A1-C2', 'Correction phonétique', 'Traduction assermentée', 'Préparation TOEFL/IELTS', 'Immersion conversationnelle'],
        metaProfile: {
            voiceId: 'Fenrir',
            videos: { 
                idle: 'https://cdn.coverr.co/videos/coverr-portrait-of-a-serious-man-1604/1080p.mp4', 
                speaking: 'https://cdn.coverr.co/videos/coverr-man-talking-to-camera-5339/1080p.mp4', 
                listening: 'https://cdn.coverr.co/videos/coverr-portrait-of-a-serious-man-1604/1080p.mp4', 
                routine: 'https://cdn.coverr.co/videos/coverr-portrait-of-a-serious-man-1604/1080p.mp4' 
            }
        }
    },
    {
        id: '2',
        name: 'Maître Diallo',
        title: 'Expert Juridique & Droit',
        role: 'juridique',
        specialty: 'Droit International & Affaires',
        description: 'Assistant de compréhension du droit, analyse de contrats, visa/titre de séjour, recours et citations d’articles officiels.',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&fit=crop',
        modelConfig: { model: 'gemini-3-pro-preview', thinking: true },
        isHuman: false,
        rating: 5.0,
        reviewsCount: 2180,
        availabilityStatus: 'available',
        activeDossiersCount: 64,
        completedDossiersCount: 890,
        languages: ['Français', 'Anglais', 'Arabe'],
        skills: ['Audit de clauses contractuelles', 'Droit des étrangers & visas', 'Création d’entreprise internationale', 'Recours administratifs', 'Citations légales traçables'],
        metaProfile: { voiceId: 'Kore', videos: { idle: '', speaking: '', listening: '', routine: '' } }
    },
    {
        id: '3',
        name: 'Conseiller Diallo',
        title: 'Expert Emploi & Carrière',
        role: 'emploi',
        specialty: 'Diagnostic Pro & Recrutement',
        description: 'Coaching de carrière complet, diagnostic des compétences, CV international ATS, portfolio, simulation d’entretiens et veille marché.',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: false,
        rating: 4.9,
        reviewsCount: 1750,
        availabilityStatus: 'available',
        activeDossiersCount: 52,
        completedDossiersCount: 730,
        languages: ['Français', 'Anglais', 'Espagnol'],
        skills: ['Bilan de compétences', 'Optimisation CV ATS', 'Simulations d’entretien RH', 'Stratégie LinkedIn & Réseau Mok', 'Négociation salariale']
    },
    {
        id: '4',
        name: 'Professeur Diallo',
        title: 'Expert Éducation & École Numérique',
        role: 'education',
        specialty: 'Pédagogie & Évaluations',
        description: 'Parcours scolaire et universitaire, de l’alphabétisation au supérieur, diagnostic de niveau, devoirs, examens et remédiation continue.',
        avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
        modelConfig: { model: 'gemini-3-pro-preview' },
        isHuman: false,
        rating: 4.95,
        reviewsCount: 1980,
        availabilityStatus: 'available',
        activeDossiersCount: 75,
        completedDossiersCount: 1200,
        languages: ['Français', 'Anglais', 'Arabe'],
        skills: ['Alphabétisation fondamentale', 'Programme individualisé', 'Correction pédagogique détaillée', 'Préparation bac/concours', 'Orientation académique']
    },
    {
        id: '5',
        name: 'Docteur Diallo',
        title: 'Expert Santé & Prévention',
        role: 'sante',
        specialty: 'Information Médicale & Prévention',
        description: 'Compréhension de bilans et ordonnances, préparation de consultations, éducation sanitaire et orientation d’évacuation médicale.',
        avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: false,
        rating: 4.9,
        reviewsCount: 2310,
        availabilityStatus: 'available',
        activeDossiersCount: 41,
        completedDossiersCount: 940,
        languages: ['Français', 'Anglais', 'Arabe', 'Peul'],
        skills: ['Vulgarisation médicale', 'Préparation de consultation', 'Dossier d’évacuation sanitaire', 'Prévention nutrition & hygiène', 'Orientation urgences']
    },
    {
        id: '6',
        name: 'Monsieur Diallo',
        title: 'Expert Logement & Habitat',
        role: 'logement',
        specialty: 'Immobilier & Droits Locatifs',
        description: 'Recherche de logement, calcul de budget et aides APL, vérification des contrats de bail, démarches de garant et logement social.',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: false,
        rating: 4.85,
        reviewsCount: 990,
        availabilityStatus: 'available',
        activeDossiersCount: 29,
        completedDossiersCount: 460,
        languages: ['Français', 'Anglais'],
        skills: ['Vérification contrat de bail', 'Simulation APL & aides', 'Dossier garant / Visale', 'Critères logement décent', 'Recherche cartographique']
    },
    {
        id: '7',
        name: 'Guide Diallo',
        title: 'Expert Voyage & Mobilité',
        role: 'voyage',
        specialty: 'Mobilité & Formalités Mondiales',
        description: 'Visas internationaux, préparation de départ, formalités douanières, billets et installation dans le pays d’accueil.',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: false,
        rating: 4.9,
        reviewsCount: 1620,
        availabilityStatus: 'available',
        activeDossiersCount: 44,
        completedDossiersCount: 880,
        languages: ['Français', 'Anglais', 'Espagnol', 'Arabe'],
        skills: ['Exigences visas par pays', 'Checklist d’expatriation', 'Optimisation d’itinéraires', 'Douanes & santé voyage', 'Intégration locale']
    },
    {
        id: '8',
        name: 'Directeur Diallo',
        title: 'Chef de Projet IA & Stratégie',
        role: 'projet',
        specialty: 'Ingénierie de Projet (10 Phases) & Financement',
        description: 'Accompagnement méthodique de l’idée initiale jusqu’au rapport final : note conceptuelle, budget, recherche de bailleurs, partenariats et pilotage.',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&fit=crop',
        modelConfig: { model: 'gemini-3-pro-preview', thinking: true },
        isHuman: false,
        rating: 5.0,
        reviewsCount: 3450,
        availabilityStatus: 'available',
        activeDossiersCount: 92,
        completedDossiersCount: 1420,
        languages: ['Français', 'Anglais', 'Arabe'],
        skills: ['Ingénierie de projet en 10 phases', 'Théorie du changement & Cadre logique', 'Modélisation budgétaire', 'Mobilisation de bailleurs & ONG', 'Coordination multi-experts Diallo OS'],
        metaProfile: {
            voiceId: 'Fenrir',
            videos: {
                idle: 'https://cdn.coverr.co/videos/coverr-portrait-of-a-serious-man-1604/1080p.mp4',
                speaking: 'https://cdn.coverr.co/videos/coverr-man-talking-to-camera-5339/1080p.mp4',
                listening: 'https://cdn.coverr.co/videos/coverr-portrait-of-a-serious-man-1604/1080p.mp4',
                routine: 'https://cdn.coverr.co/videos/coverr-portrait-of-a-serious-man-1604/1080p.mp4'
            }
        }
    },
    {
        id: '9',
        name: 'Trésorier Diallo',
        title: 'Expert Finance & Commerce',
        role: 'finance',
        specialty: 'Budget, Trésorerie & Commerce',
        description: 'Alignement des capacités financières sur les objectifs, budget prévisionnel, seuil de rentabilité, gestion des devises et investissement.',
        avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: false,
        rating: 4.9,
        reviewsCount: 880,
        availabilityStatus: 'available',
        activeDossiersCount: 33,
        completedDossiersCount: 520,
        languages: ['Français', 'Anglais'],
        skills: ['Plan de trésorerie', 'Plan de financement prévisionnel', 'Gestion de devises multiples', 'Analyse du risque financier', 'Modèle économique']
    },
    {
        id: '10',
        name: 'Officier Diallo',
        title: 'Expert Administratif & Démarches',
        role: 'administration',
        specialty: 'Formalités Publiques & Démarches',
        description: 'Vérification exhaustive des dossiers administratifs, formulaires officiels, pièces manquantes, prise de rendez-vous et suivi des délais.',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: false,
        rating: 4.95,
        reviewsCount: 1650,
        availabilityStatus: 'available',
        activeDossiersCount: 58,
        completedDossiersCount: 1100,
        languages: ['Français', 'Anglais', 'Arabe'],
        skills: ['Audit de conformité des pièces', 'Formulaires CERFA & consulaires', 'Gestion des échéances et délais', 'Check-list des pièces manquantes', 'Correspondance administrative']
    },
    // ═══════════════════════════════════════════════════════════════════════════
    // 👤 EXPERTS HUMAINS VÉRIFIÉS DU RÉSEAU MOK (Section 18)
    // ═══════════════════════════════════════════════════════════════════════════
    {
        id: 'h1',
        name: 'Me Sarah Mansouri',
        title: 'Avocate au Barreau & Juriste Conseil',
        role: 'juridique',
        specialty: 'Droit des Affaires & Mobilité Internationale',
        description: 'Avocate assermentée avec 14 ans d’expérience. Consultation approfondie, validation finale d’actes et représentation légale.',
        avatarUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: true,
        verified: true,
        rating: 5.0,
        reviewsCount: 94,
        hourlyRate: 120,
        country: 'France / Sénégal',
        experienceYears: 14,
        availabilityStatus: 'appointment_only',
        activeDossiersCount: 12,
        completedDossiersCount: 180,
        languages: ['Français', 'Anglais', 'Arabe'],
        skills: ['Plaidoirie & Recours au fond', 'Validation d’actes sous seing privé', 'Contentieux commercial', 'Immigration d’affaires'],
        bio: 'Docteure en Droit International. Accompagne les porteurs de projets dans l’espace CEDEAO et Union Européenne.'
    },
    {
        id: 'h2',
        name: 'Dr. Karim Ouedraogo',
        title: 'Médecin Régulateur & Santé Publique',
        role: 'sante',
        specialty: 'Régulation Médicale & Évacuations',
        description: 'Praticien hospitalier et consultant en organisation des soins. Évaluation de dossiers d’évacuation et coordination spécialisée.',
        avatarUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: true,
        verified: true,
        rating: 4.9,
        reviewsCount: 78,
        hourlyRate: 95,
        country: 'Suisse / Côte d’Ivoire',
        experienceYears: 18,
        availabilityStatus: 'appointment_only',
        activeDossiersCount: 8,
        completedDossiersCount: 140,
        languages: ['Français', 'Anglais'],
        skills: ['Avis d’expertise médicale', 'Liaison hospitalière internationale', 'Protocoles de transfert sanitaire', 'Santé tropicale & infectieuse'],
        bio: 'Spécialiste de la médecine d’urgence et de la coopération sanitaire transfrontalière.'
    },
    {
        id: 'h3',
        name: 'Fatou Ndiaye, CPA',
        title: 'Expert-Comptable Diplômée',
        role: 'finance',
        specialty: 'Audit Financier & Levée de Fonds',
        description: 'Commissaire aux comptes et consultante en structuration de haut de bilan. Certification de comptes et dossiers bancaires.',
        avatarUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
        isHuman: true,
        verified: true,
        rating: 5.0,
        reviewsCount: 112,
        hourlyRate: 110,
        country: 'Canada / Sénégal',
        experienceYears: 12,
        availabilityStatus: 'appointment_only',
        activeDossiersCount: 15,
        completedDossiersCount: 210,
        languages: ['Français', 'Anglais', 'Wolof'],
        skills: ['Certification de business plan', 'Structuration de levée de fonds', 'Fiscalité internationale', 'Audit d’acquisition'],
        bio: 'Membre de l’Ordre des CPA. Spécialiste de l’ingénierie financière des PME en croissance.'
    }
];

export const DEFAULT_DOSSIERS: DossierParcours[] = [
    {
        id: 'dossier-agro-1',
        title: 'Création Unité de Transformation Agroalimentaire',
        category: 'projet',
        goal: 'Structurer le dossier technique, plan de financement de 85 000€ et implanter l’unité de séchage et conditionnement.',
        status: 'en_cours',
        progress: 45,
        startDate: '15/01/2025',
        targetDate: '30/09/2025',
        leadAgentId: '8', // Directeur Diallo
        collaboratingAgentIds: ['2', '3', '8'], // Juridique, Emploi, Projet
        currentStepIndex: 2,
        steps: [
            {
                id: 'step-1',
                stepNumber: 1,
                title: 'Diagnostic initial & Théorie du changement',
                description: 'Analyse des besoins locaux, étude d’impact et définition des indicateurs de succès.',
                assignedAgentId: '8',
                status: 'completed',
                deliverableTitle: 'Note de cadrage stratégique v2',
                progress: 100,
                estimatedDuration: '1 semaine',
                validationNotes: 'Objectifs validés avec Directeur Diallo.'
            },
            {
                id: 'step-2',
                stepNumber: 2,
                title: 'Montage du modèle économique & Budget prévisionnel',
                description: 'Établissement du plan de trésorerie sur 3 ans, coûts d’équipements et seuil de rentabilité.',
                assignedAgentId: '8',
                status: 'completed',
                deliverableTitle: 'Tableau de Budget Prévisionnel & BFR',
                progress: 100,
                estimatedDuration: '2 semaines',
                validationNotes: 'Budget de 85 000€ équilibré.'
            },
            {
                id: 'step-3',
                stepNumber: 3,
                title: 'Dossier juridique & Choix de la forme sociétaire',
                description: 'Rédaction des statuts de la SAS / SARL et clauses de gouvernance.',
                assignedAgentId: '2',
                status: 'in_progress',
                deliverableTitle: 'Projet de Statuts Juridiques SAS',
                progress: 60,
                estimatedDuration: '10 jours',
                validationNotes: 'En cours avec Maître Diallo.'
            },
            {
                id: 'step-4',
                stepNumber: 4,
                title: 'Candidature aux Appels à Projets & Subventions',
                description: 'Identification des guichets de financement (BAD, AFD, UE, banques locales) et rédaction des pitchs.',
                assignedAgentId: '8',
                status: 'pending',
                deliverableTitle: 'Dossier de candidature subventions',
                progress: 0,
                estimatedDuration: '3 semaines'
            },
            {
                id: 'step-5',
                stepNumber: 5,
                title: 'Plan de recrutement & Fiches de postes',
                description: 'Définition des profils clés (technicien qualité, commercial, opérateur machine).',
                assignedAgentId: '3',
                status: 'pending',
                deliverableTitle: 'Pack RH & Fiches de Postes',
                progress: 0,
                estimatedDuration: '1 semaine'
            }
        ],
        tasks: [
            { id: 't-1', title: 'Valider la liste des équipements de séchage solaire', deadline: 'Demain, 18h', completed: true, assignedAgentId: '8', priority: 'high' },
            { id: 't-2', title: 'Relire l’article 12 des statuts (répartition parts)', deadline: 'Vendredi', completed: false, assignedAgentId: '2', priority: 'high' },
            { id: 't-3', title: 'Envoyer le devis du fournisseur de packaging', deadline: 'Lundi prochain', completed: false, assignedAgentId: '8', priority: 'medium' }
        ],
        documents: [
            { id: 'doc-1', title: 'Note de Cadrage Stratégique - Agro.pdf', type: 'report', version: 2, updatedAt: 'Hier à 16:40', agentId: '8', isSigned: true },
            { id: 'doc-2', title: 'Budget_Previsionnel_3Ans.xlsx', type: 'sheet', version: 1, updatedAt: 'Il y a 3 jours', agentId: '8' },
            { id: 'doc-3', title: 'Projet_Statuts_SAS_DialloAgro.docx', type: 'contract', version: 1, updatedAt: 'Aujourd’hui à 11:20', agentId: '2' }
        ],
        deliverables: [
            { id: 'deliv-1', title: 'Dossier d’Ingénierie de Projet Validé', description: 'Document complet de 24 pages avec théorie du changement et matrice de risques.', category: 'Stratégie', status: 'final', createdAt: '18/02/2025', authorAgentName: 'Directeur Diallo' },
            { id: 'deliv-2', title: 'Modèle Financier & Plan de Trésorerie', description: 'Tableau dynamique de simulation de rentabilité.', category: 'Finance', status: 'final', createdAt: '22/02/2025', authorAgentName: 'Directeur Diallo' }
        ],
        appointments: [
            { id: 'app-1', title: 'Revue d’étape avec Directeur Diallo', date: '28/02/2025', time: '14:30', agentId: '8', type: 'video', status: 'scheduled', notes: 'Point sur les subventions.' }
        ],
        nextAction: 'Finaliser avec Maître Diallo la rédaction des statuts juridiques pour transmission au greffe.',
        decisions: [
            'Choix d’une SAS pour flexibilité du capital',
            'Focus initial sur le séchage de mangues et conditionnement d’épices',
            'Budget cible d’amorçage fixé à 85 000€'
        ],
        difficulties: [
            'Délais d’obtention des devis fournisseurs machine à l’international',
            'Formalités administratives locales pour le bail agricole'
        ],
        skillsGained: ['Ingénierie de projet', 'Élaboration de budget BFR', 'Gestion des risques opérationnels'],
        aiRecommendations: [
            'Déposer le dossier d’aide à l’investissement avant le 15 du mois prochain.',
            'Planifier une séance de simulation d’entretien avec Conseiller Diallo pour le recrutement du responsable technique.'
        ],
        lastActiveDate: 'Aujourd’hui à 14:15'
    },
    {
        id: 'dossier-edu-1',
        title: 'Programme de Maîtrise & Français Professionnel B2/C1',
        category: 'education',
        goal: 'Atteindre un niveau B2/C1 certifié en communication écrite et orale pour intégrer un master d’excellence.',
        status: 'en_cours',
        progress: 70,
        startDate: '10/01/2025',
        targetDate: '15/05/2025',
        leadAgentId: '4', // Professeur Diallo
        collaboratingAgentIds: ['1', '4'], // Diallo (Langues) & Professeur
        currentStepIndex: 3,
        steps: [
            { id: 's-edu-1', stepNumber: 1, title: 'Test de Positionnement & Diagnostic Multimodal', description: 'Évaluation orale et écrite du niveau initial.', assignedAgentId: '4', status: 'completed', deliverableTitle: 'Bilan de Compétences Initial', progress: 100 },
            { id: 's-edu-2', stepNumber: 2, title: 'Grammaire Fondamentale & Syntaxe Complexe', description: 'Concordance des temps, subjonctif, discours rapporté.', assignedAgentId: '4', status: 'completed', deliverableTitle: 'Cahier d’exercices corrigés', progress: 100 },
            { id: 's-edu-3', stepNumber: 3, title: 'Rédaction Professionnelle & Synthèse de Documents', description: 'Méthodologie de la note de synthèse et argumentation.', assignedAgentId: '4', status: 'in_progress', deliverableTitle: 'Dossier de 5 notes de synthèse', progress: 80 },
            { id: 's-edu-4', stepNumber: 4, title: 'Prise de Parole & Éloquence Vocale', description: 'Simulations orales avec Diallo en immersion audio.', assignedAgentId: '1', status: 'pending', deliverableTitle: 'Enregistrement de plaidoirie', progress: 0 },
            { id: 's-edu-5', stepNumber: 5, title: 'Examen Blanc & Certification Officielle', description: 'Passage de l’examen final chronométré.', assignedAgentId: '4', status: 'pending', deliverableTitle: 'Attestation de Compétences C1', progress: 0 }
        ],
        tasks: [
            { id: 'te-1', title: 'Rédiger l’exercice 4 sur la note de synthèse argumentative', deadline: 'Ce soir, 20h', completed: false, assignedAgentId: '4', priority: 'high' },
            { id: 'te-2', title: 'Faire la séance orale de 15 minutes avec l’Expert Langues', deadline: 'Demain', completed: false, assignedAgentId: '1', priority: 'medium' }
        ],
        documents: [
            { id: 'de-1', title: 'Diagnostic_Positionnement_B2.pdf', type: 'report', version: 1, updatedAt: '12/01/2025', agentId: '4' },
            { id: 'de-2', title: 'Cahier_Synthese_Methodologie.pdf', type: 'doc', version: 2, updatedAt: 'Il y a 2 jours', agentId: '4' }
        ],
        deliverables: [
            { id: 'deliv-e1', title: 'Attestation de Réussite Module Grammaire Avancée', description: 'Score de 94/100 validé par Professeur Diallo.', category: 'Éducation', status: 'final', createdAt: '05/02/2025', authorAgentName: 'Professeur Diallo' }
        ],
        appointments: [
            { id: 'app-e1', title: 'Tutorat individuel avec Professeur Diallo', date: '01/03/2025', time: '10:00', agentId: '4', type: 'video', status: 'scheduled' }
        ],
        nextAction: 'Compléter l’évaluation pratique du chapitre 3 sur la note de synthèse.',
        decisions: ['Priorité donnée à la rédaction formelle pour les concours académiques'],
        difficulties: ['Gestion du temps en épreuve de synthèse écrite'],
        skillsGained: ['Concordance des temps', 'Structure d’argumentation', 'Vocabulaire académique'],
        aiRecommendations: ['Effectuer 10 minutes d’entraînement oral quotidien avec le mode vocal.'],
        lastActiveDate: 'Hier à 19:30'
    },
    {
        id: 'dossier-carriere-1',
        title: 'Reconversion & Insertion Professionnelle en Finance/Comptabilité',
        category: 'carriere',
        goal: 'Optimiser le CV aux normes internationales, décrocher 5 entretiens ciblés et signer un contrat d’embauche.',
        status: 'en_cours',
        progress: 60,
        startDate: '01/02/2025',
        targetDate: '30/04/2025',
        leadAgentId: '3', // Conseiller Diallo
        collaboratingAgentIds: ['2', '3', '1'],
        currentStepIndex: 2,
        steps: [
            { id: 'sc-1', stepNumber: 1, title: 'Bilan de compétences & Valorisation du parcours', description: 'Cartographie des acquis et alignement avec les exigences du marché.', assignedAgentId: '3', status: 'completed', deliverableTitle: 'Profil de Compétences Validé', progress: 100 },
            { id: 'sc-2', stepNumber: 2, title: 'Refonte CV International & Lettres d’impact', description: 'Création d’un CV percutant format ATS + lettre de motivation sur mesure.', assignedAgentId: '3', status: 'completed', deliverableTitle: 'CV Professionnel V3 ATS', progress: 100 },
            { id: 'sc-3', stepNumber: 3, title: 'Simulations d’Entretiens & Pitch 2 minutes', description: 'Entraînement aux questions pièges et négociation de salaire.', assignedAgentId: '3', status: 'in_progress', deliverableTitle: 'Grille d’évaluation d’entretien', progress: 50 },
            { id: 'sc-4', stepNumber: 4, title: 'Vérification juridique de contrat de travail', description: 'Analyse des clauses (non-concurrence, période d’essai, télétravail).', assignedAgentId: '2', status: 'pending', deliverableTitle: 'Rapport d’audit de contrat', progress: 0 }
        ],
        tasks: [
            { id: 'tc-1', title: 'Passer la simulation d’entretien vidéo avec Conseiller Diallo', deadline: 'Jeudi', completed: false, assignedAgentId: '3', priority: 'high' }
        ],
        documents: [
            { id: 'dc-1', title: 'CV_International_ATS_Final.pdf', type: 'doc', version: 3, updatedAt: 'Il y a 4 jours', agentId: '3' },
            { id: 'dc-2', title: 'Lettre_Motivation_Type_Finance.docx', type: 'doc', version: 2, updatedAt: 'Il y a 3 jours', agentId: '3' }
        ],
        deliverables: [
            { id: 'deliv-c1', title: 'Pack CV & Pitch Professionnel Certifié', description: 'Modèle prêt pour candidatures grandes entreprises.', category: 'Carrière', status: 'final', createdAt: '15/02/2025', authorAgentName: 'Conseiller Diallo' }
        ],
        appointments: [
            { id: 'app-c1', title: 'Simulation d’entretien d’embauche', date: '27/02/2025', time: '16:00', agentId: '3', type: 'video', status: 'scheduled' }
        ],
        nextAction: 'Lancer la séance de simulation vocale de l’entretien d’embauche avec Conseiller Diallo.',
        decisions: ['Cibler les postes de Contrôleur de Gestion Junior et Comptable Senior'],
        difficulties: ['Réponse aux questions sur les trous de parcours dans le CV'],
        skillsGained: ['Pitch percutant', 'Optimisation CV ATS', 'Négociation salariale'],
        aiRecommendations: ['Consulter les 3 nouvelles offres de la semaine sur le Career Center.'],
        lastActiveDate: 'Il y a 2 jours'
    }
];

export const INITIAL_ACTIVE_MEMORIES: ActiveMemoryItem[] = [
    {
        id: 'mem-1',
        category: 'objective',
        key: 'Objectif Principal Projet',
        value: 'Lancer l’unité de transformation agroalimentaire avec 85 000€ d’ici septembre 2025.',
        agentId: '8',
        dossierId: 'dossier-agro-1',
        timestamp: '15/01/2025',
        verified: true,
        confidence: 0.98
    },
    {
        id: 'mem-2',
        category: 'decision',
        key: 'Forme Juridique Retenue',
        value: 'Société par Actions Simplifiée (SAS) avec capital variable.',
        agentId: '2',
        dossierId: 'dossier-agro-1',
        timestamp: '20/01/2025',
        verified: true,
        confidence: 0.95
    },
    {
        id: 'mem-3',
        category: 'step',
        key: 'Statut du Budget Prévisionnel',
        value: 'Budget sur 3 ans validé et équilibré avec besoin en fonds de roulement de 18 000€.',
        agentId: '8',
        dossierId: 'dossier-agro-1',
        timestamp: '22/02/2025',
        verified: true,
        confidence: 0.96
    },
    {
        id: 'mem-4',
        category: 'difficulty',
        key: 'Goulot d’étranglement identifié',
        value: 'Délais de livraison des machines de séchage solaire (6 à 8 semaines estimées).',
        agentId: '8',
        dossierId: 'dossier-agro-1',
        timestamp: '24/02/2025',
        verified: true,
        confidence: 0.90
    },
    {
        id: 'mem-5',
        category: 'skill',
        key: 'Compétence Validée',
        value: 'Rédaction de note de cadrage et théorie du changement maîtrisées (Score: 92/100).',
        agentId: '8',
        dossierId: 'dossier-agro-1',
        timestamp: '18/02/2025',
        verified: true,
        confidence: 0.97
    },
    {
        id: 'mem-6',
        category: 'preference',
        key: 'Rythme d’apprentissage',
        value: 'Préférence pour des séances courtes et pratiques de 30 minutes avec vérification immédiate.',
        agentId: '4',
        dossierId: 'dossier-edu-1',
        timestamp: '10/01/2025',
        verified: true,
        confidence: 0.99
    }
];

export const INITIAL_COMPETENCIES: CompetencyRecord[] = [
    { id: 'comp-1', name: 'Ingénierie de Projet & Cadre Logique', category: 'Méthodologie', level: 4, maxLevel: 5, status: 'certified', certifiedDate: '18/02/2025', evidence: 'Note de cadrage validée par Directeur Diallo' },
    { id: 'comp-2', name: 'Montage de Budget & Trésorerie', category: 'Savoir-faire', level: 4, maxLevel: 5, status: 'certified', certifiedDate: '22/02/2025', evidence: 'Modèle Excel validé' },
    { id: 'comp-3', name: 'Communication Écrite Formelle (Français C1)', category: 'Communication', level: 3, maxLevel: 5, status: 'learning' },
    { id: 'comp-4', name: 'Négociation & Pitch Professionnel', category: 'Communication', level: 3, maxLevel: 5, status: 'learning' },
    { id: 'comp-5', name: 'Sécurité Juridique & Conformité Contrats', category: 'Savoir', level: 2, maxLevel: 5, status: 'learning' }
];


export const COURSES: Course[] = [
    {
        id: 'c1',
        title: 'Français pour Débutants',
        institution: 'Alliance Française',
        level: 'Primaire',
        duration: '3 mois',
        thumbnailUrl: 'https://images.unsplash.com/photo-1545670723-196ed0954986?w=400&fit=crop',
        description: 'Apprenez les bases du français.',
        progress: 0,
        tags: ['Langue', 'Débutant'],
        isEnrolled: false
    }
];

export const PRODUCTS: Product[] = [
    {
        id: 'p1',
        title: 'Pack CV Premium & Templates ATS',
        description: 'Modèles de CV et lettres optimisés pour le marché international (France, Canada, USA).',
        price: 25,
        currency: 'EUR',
        category: 'Digital',
        imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&fit=crop',
        rating: 4.8,
        reviews: 120,
        dimensionType: 'B2C',
        relationType: 'service_client',
        sellerId: 'u1',
        sellerName: 'Amadou Diallo',
        sellerCountry: 'France',
        sellerFlag: '🇫🇷',
        sellerVerified: true,
        stockAvailable: 9999,
        leadTimeDays: 0,
        shippingAvailable: false
    },
    {
        id: 'prod-cafe-ziama-2026',
        title: 'Café Ziama Bio Arabica (Lot Export 2026)',
        description: 'Café de haute altitude récolté manuellement en Guinée forestière. Certifié biologique et équitable. Idéal pour grossistes, torréfacteurs et distributeurs.',
        price: 4.80,
        currency: 'EUR',
        category: 'Physique',
        imageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&fit=crop',
        rating: 4.95,
        reviews: 48,
        dimensionType: 'B2B',
        relationType: 'producer_wholesaler',
        sellerId: 'u-ziama-trade',
        sellerName: 'Coopérative Café Ziama',
        sellerCountry: 'Guinée',
        sellerFlag: '🇬🇳',
        sellerVerified: true,
        minOrderQuantity: 500,
        unit: 'kg (Sacs jute 60kg)',
        stockAvailable: 12000,
        originCountry: 'Guinée',
        originFlag: '🇬🇳',
        leadTimeDays: 14,
        shippingAvailable: true,
        shippingEstimateCost: 450,
        estimatedCustomsTax: 120,
        insuranceEstimate: 65,
        specifications: {
            'Variété': 'Arabica Typica',
            'Altitude': '1250m - 1400m',
            'Humidité': '11.5%',
            'Processus': 'Lavé & séché au soleil',
            'Conditionnement': 'Sacs GrainPro + Jute 60kg'
        },
        certifications: ['Bio Ecocert', 'Fairtrade International', 'Phytosanitaire Officiel'],
        linkedReelId: 'r9'
    },
    {
        id: 'prod-pack-pharma-5k',
        title: 'Cartons d\'Emballage Pharma Haute Densité (5000 pcs)',
        description: 'Cartons pliants ondulés renforcés, normes BPF/GMP et résistance à l\'humidité pour expédition de produits médicaux et pharmaceutiques.',
        price: 0.35,
        currency: 'EUR',
        category: 'Physique',
        imageUrl: 'https://images.unsplash.com/photo-1530587191325-3db32d826c18?w=600&fit=crop',
        rating: 4.9,
        reviews: 86,
        dimensionType: 'B2B',
        relationType: 'manufacturer_distributor',
        sellerId: 'u-pack-global',
        sellerName: 'SinoPack Industrial Ltd',
        sellerCountry: 'Chine',
        sellerFlag: '🇨🇳',
        sellerVerified: true,
        minOrderQuantity: 5000,
        unit: 'unités',
        stockAvailable: 500000,
        originCountry: 'Chine (Shenzhen/Ningbo)',
        originFlag: '🇨🇳',
        leadTimeDays: 20,
        shippingAvailable: true,
        shippingEstimateCost: 680,
        estimatedCustomsTax: 210,
        insuranceEstimate: 50,
        specifications: {
            'Grammage': '350g/m² couché',
            'Finition': 'Vernis protecteur anti-UV',
            'Norme': 'ISO 9001 / BPF Pharma',
            'Impression': 'Offset 4 couleurs sécurisée'
        },
        certifications: ['ISO 9001:2015', 'FDA Material Approved', 'CE Packaging']
    },
    {
        id: 'prod-miel-guinee',
        title: 'Miel Pur de Fouta Djallon (Fûts de 25kg & Pots 500g)',
        description: 'Miel sauvage polyfloral 100% naturel sans additif, récolté selon les traditions apicoles guinéennes.',
        price: 7.50,
        currency: 'EUR',
        category: 'Physique',
        imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&fit=crop',
        rating: 5.0,
        reviews: 32,
        dimensionType: 'B2B',
        relationType: 'producer_wholesaler',
        sellerId: 'u-fouta-honey',
        sellerName: 'Apiculteurs du Fouta',
        sellerCountry: 'Guinée',
        sellerFlag: '🇬🇳',
        sellerVerified: true,
        minOrderQuantity: 100,
        unit: 'kg',
        stockAvailable: 3500,
        originCountry: 'Guinée',
        originFlag: '🇬🇳',
        leadTimeDays: 10,
        shippingAvailable: true,
        shippingEstimateCost: 180,
        specifications: {
            'Arôme': 'Boisé & Fleurs d\'acacia',
            'Teneur en eau': '< 18%',
            'Conservation': '3 ans hermétique'
        },
        certifications: ['Certificat d\'Origine & Salubrité Vétérinaire']
    },
    {
        id: 'prod-laptop-recond-700',
        title: 'ThinkPad X1 Carbon Gen 9 Reconditionné Certifié',
        description: 'Intel Core i7, 16GB RAM, 512GB SSD NVMe, Écran 14" FHD+ IPS. Garantie 12 mois, batterie testée >90%.',
        price: 649,
        currency: 'EUR',
        category: 'Physique',
        imageUrl: 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600&fit=crop',
        rating: 4.85,
        reviews: 215,
        dimensionType: 'B2C',
        relationType: 'supplier_business',
        sellerId: 'u-tech-renew',
        sellerName: 'EuroTech Reconditionné',
        sellerCountry: 'France',
        sellerFlag: '🇫🇷',
        sellerVerified: true,
        minOrderQuantity: 1,
        unit: 'pièce',
        stockAvailable: 24,
        originCountry: 'France',
        originFlag: '🇫🇷',
        leadTimeDays: 3,
        shippingAvailable: true,
        shippingEstimateCost: 15,
        insuranceEstimate: 10,
        specifications: {
            'Processeur': 'Intel Core i7-1165G7',
            'Mémoire': '16 GB LPDDR4x',
            'Stockage': '512 GB SSD NVMe M.2',
            'Poids': '1.13 kg'
        },
        certifications: ['QualiRépar', 'Garantie Constructeur Reconditionné 1 An']
    },
    {
        id: 'serv-legal-trade-audit',
        title: 'Audit Juridique Contrat Import/Export & Incoterms',
        description: 'Revue complète de vos contrats d\'achat internationaux, conditions de paiement sécurisé (Crédit documentaire / DLC), répartition des risques douaniers.',
        price: 350,
        currency: 'EUR',
        category: 'Service',
        imageUrl: 'https://images.unsplash.com/photo-1450133064473-71024230f91b?w=600&fit=crop',
        rating: 4.95,
        reviews: 54,
        isService: true,
        dimensionType: 'B2B',
        relationType: 'service_client',
        sellerId: '2',
        sellerName: 'Cabinet Maître Diallo & Associés',
        sellerCountry: 'France / International',
        sellerFlag: '⚖️',
        sellerVerified: true,
        serviceDetails: {
            pricingModel: 'quote',
            turnaroundTime: '48h ouvrées',
            languagesSupported: ['Français', 'Anglais', 'Arabe', 'Chinois (avec Traducteur Diallo)']
        }
    },
    {
        id: 'serv-transitaire-route',
        title: 'Courtage & Dédouanement Fret Maritime (Guinée - Chine - Europe)',
        description: 'Gestion complète du fret maritime (FCL/LCL), édition du connaissement maritime (Bill of Lading), dédouanement portuaire et livraison sur site.',
        price: 850,
        currency: 'EUR',
        category: 'Service',
        imageUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?w=600&fit=crop',
        rating: 4.9,
        reviews: 79,
        isService: true,
        dimensionType: 'B2B',
        relationType: 'supplier_business',
        sellerId: 'fwd-syli-transit',
        sellerName: 'Syli Logistics & Transit Portuaire',
        sellerCountry: 'Guinée (Port Autonome de Conakry)',
        sellerFlag: '🇬🇳',
        sellerVerified: true,
        serviceDetails: {
            pricingModel: 'quote',
            turnaroundTime: 'Cotation sous 4h',
            languagesSupported: ['Français', 'Anglais', 'Sousou', 'Pular', 'Maninka']
        }
    }
];

export const MOCK_RFQS: BuyRequestRFQ[] = [
    {
        id: 'rfq-pack-pharma',
        title: 'Recherche 5 000 cartons d\'emballage pour produits pharmaceutiques',
        category: 'Emballage & Conditionnement',
        dimension: 'B2B',
        description: 'Recherche urgente d\'un fabricant certifié pour 5000 boîtes cartons imprimées selon normes BPF, destination Conakry (Guinée).',
        quantityRequested: 5000,
        unit: 'boîtes',
        targetPricePerUnit: 0.40,
        currency: 'EUR',
        targetDestinationCountry: 'Guinée',
        targetDestinationCity: 'Conakry',
        deadlineDate: '15/04/2026',
        buyerId: 'u-pharma-guinee',
        buyerName: 'Pharmacie Centrale & Distribution Guinéenne',
        buyerCountry: 'Guinée',
        buyerFlag: '🇬🇳',
        buyerVerified: true,
        specifications: ['Carton 350g couché', 'Norme ISO 9001', 'Résistance humidité tropicale', 'Finition vernis UV'],
        certificationsRequired: ['Certificat d\'alimentarité/Pharma', 'ISO 9001'],
        createdAt: 'Il y a 2 jours',
        status: 'quotes_received',
        quotesCount: 3,
        quotes: [
            {
                id: 'q-1',
                rfqId: 'rfq-pack-pharma',
                supplierId: 'u-pack-global',
                supplierName: 'SinoPack Industrial Ltd',
                supplierCountry: 'Chine',
                supplierFlag: '🇨🇳',
                supplierVerified: true,
                pricePerUnit: 0.35,
                totalPrice: 1750,
                currency: 'EUR',
                unit: 'boîtes',
                minOrderQty: 5000,
                leadTimeDays: 18,
                incotermProposed: 'CIF',
                shippingEstimate: 320,
                customsEstimate: 140,
                insuranceEstimate: 35,
                notes: 'Production lancée dès validation BAT. Inspection qualité pré-embarquement incluse.',
                status: 'pending',
                submittedAt: 'Hier à 14:20',
                commercialDocsAvailable: ['Pro Forma v1', 'Fiche technique matière', 'Certificat ISO 9001']
            }
        ]
    },
    {
        id: 'rfq-shea-butter-20t',
        title: 'Recherche 10 à 20 Tonnes de Beurre de Karité Bio Brut',
        category: 'Agroalimentaire & Cosmétique',
        dimension: 'B2B',
        description: 'Laboratoire cosmétique européen recherche coopérative certifiée pour fourniture de karité non raffiné de première pression.',
        quantityRequested: 15000,
        unit: 'kg (Fûts de 200kg)',
        targetPricePerUnit: 3.20,
        currency: 'EUR',
        targetDestinationCountry: 'France',
        targetDestinationCity: 'Le Havre',
        deadlineDate: '30/05/2026',
        buyerId: 'u-cosmetix-fr',
        buyerName: 'BioCosmetics Europe Lab',
        buyerCountry: 'France',
        buyerFlag: '🇫🇷',
        buyerVerified: true,
        specifications: ['Non raffiné', 'Indice d\'acide < 4', 'Couleur ivoire naturelle'],
        certificationsRequired: ['Bio Ecocert', 'Rapport d\'analyse labo'],
        createdAt: 'Il y a 4 jours',
        status: 'open',
        quotesCount: 2
    }
];

export const MOCK_FREIGHT_FORWARDERS: FreightForwarderProfile[] = [
    {
        id: 'fwd-syli-transit',
        companyName: 'Syli Logistics & Transit Portuaire',
        logoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200',
        headquartersCountry: 'Guinée (Conakry)',
        flag: '🇬🇳',
        servedRoutes: ['Chine (Ningbo/Guangzhou) -> Guinée (Conakry)', 'France (Le Havre) -> Guinée', 'Turquie -> Guinée'],
        freightTypes: ['sea_fcl', 'sea_lcl', 'air_freight', 'road_haulage'],
        languages: ['Français', 'Anglais', 'Sousou', 'Pular'],
        isVerified: true,
        rating: 4.9,
        reviewsCount: 142,
        transitTimeEstimateDays: '28 - 35 jours (Maritime) / 4 - 6 jours (Aérien)',
        pricingGuideline: 'À partir de 180€/m³ en groupage LCL',
        customsClearanceService: true,
        bondedWarehousing: true,
        contactEmail: 'contact@sylitransit.gn',
        contactPhone: '+224 622 00 11 22'
    },
    {
        id: 'fwd-afro-cargo-express',
        companyName: 'AfroCargo & Hub Express',
        logoUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=200',
        headquartersCountry: 'Sénégal / Côte d\'Ivoire',
        flag: '🇸🇳',
        servedRoutes: ['Europe (Paris CDG / Bruxelles) -> Afrique de l\'Ouest', 'Dubaï -> Afrique de l\'Ouest'],
        freightTypes: ['air_freight', 'express_courier'],
        languages: ['Français', 'Anglais', 'Wolof'],
        isVerified: true,
        rating: 4.8,
        reviewsCount: 98,
        transitTimeEstimateDays: '3 - 5 jours ouvrés',
        pricingGuideline: '9.50€/kg tout compris avec dédouanement',
        customsClearanceService: true,
        bondedWarehousing: false,
        contactEmail: 'fret@afrocargo.com',
        contactPhone: '+221 77 400 30 20'
    }
];

export const MOCK_TRADE_COMPANIES: TradeCompanyProfile[] = [
    {
        id: 'u-ziama-trade',
        name: 'Coopérative Agricole & Export Ziama',
        logoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        legalType: 'cooperative',
        country: 'Guinée',
        countryFlag: '🇬🇳',
        city: 'Macenta / Conakry',
        sector: 'Agro-Export & Matières Premières',
        website: 'https://coop-ziama.gn',
        description: 'Producteur et exportateur agréé de Café Arabica, Cacao et Épices rares de Guinée forestière. Plus de 350 planteurs membres.',
        servedMarkets: ['Union Européenne', 'Moyen-Orient', 'Afrique de l\'Ouest (CEDEAO)'],
        languages: ['Français', 'Anglais'],
        verificationStatus: 'verified',
        verificationDocsUploaded: true,
        registrationNumber: 'RCCM/GC-CKY-2021-B-8472',
        rating: 4.95,
        reviewsCount: 48,
        transactionsCompleted: 82,
        productsCount: 6,
        servicesCount: 1,
        contactPerson: 'Mamadouba Camara',
        contactEmail: 'export@coop-ziama.gn',
        reputationScore: 98
    },
    {
        id: 'u-pack-global',
        name: 'SinoPack Industrial Ltd',
        logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
        legalType: 'manufacturer',
        country: 'Chine',
        countryFlag: '🇨🇳',
        city: 'Guangzhou',
        sector: 'Packaging & Emballage Industriel',
        website: 'https://sinopack-ind.com',
        description: 'Usine de fabrication d\'emballages pharmaceutiques, cosmétiques et agroalimentaires certifiée ISO 9001 et BPF.',
        servedMarkets: ['Afrique', 'Europe', 'Amérique Latine', 'Asie'],
        languages: ['Chinois (Mandarin)', 'Anglais', 'Français (via Diallo OS)'],
        verificationStatus: 'verified',
        verificationDocsUploaded: true,
        registrationNumber: 'CN-GZ-91440101MA59X',
        rating: 4.9,
        reviewsCount: 160,
        transactionsCompleted: 450,
        productsCount: 24,
        servicesCount: 2,
        contactPerson: 'Lin Chen',
        contactEmail: 'trade@sinopack-ind.com',
        reputationScore: 96
    }
];

export const MOCK_IMPORT_EXPORT_PROJECTS: ImportExportProject[] = [
    {
        id: 'proj-import-equip-chine',
        type: 'import',
        title: 'Importation Équipements de Conditionnement (Chine → Guinée)',
        productCategory: 'Machines & Équipements Industriels',
        originCountry: 'Chine (Guangzhou)',
        destinationCountry: 'Guinée (Conakry)',
        quantity: 1,
        unit: 'Ligne complète de conditionnement sous vide',
        budgetTotalEstimated: 24500,
        currency: 'EUR',
        currentStepIndex: 4,
        landedCostBreakdown: {
            productCost: 18000,
            transportCost: 3200,
            insuranceCost: 350,
            customsDutyCost: 1950,
            vatLocalTaxCost: 800,
            localHandlingCost: 200,
            totalEstimated: 24500,
            currency: 'EUR',
            isKnownOrEstimated: {
                product: 'known',
                transport: 'known',
                insurance: 'known',
                customs: 'estimated',
                localDelivery: 'estimated'
            }
        },
        steps: [
            { stepNumber: 1, phase: 'Besoin & Cadrage', title: 'Définition des spécifications techniques de la machine', description: 'Puissance, cadence horaire, voltage 220V/380V adapté au réseau local.', responsibleAgent: 'Expert Projet Diallo', status: 'completed', deliverables: ['Cahier des charges technique validé'], estimatedDuration: '3 jours' },
            { stepNumber: 2, phase: 'Sourcing Fournisseur', title: 'Shortlist & Audit documentaire des fabricants chinois', description: 'Vérification licences d\'exportation, vidéos d\'inspection usine.', responsibleAgent: 'Agent Sourcing IA', status: 'completed', deliverables: ['Rapport comparatif 3 fournisseurs'], estimatedDuration: '5 jours' },
            { stepNumber: 3, phase: 'Négociation & Pro Forma', title: 'Négociation du prix FOB/CIF et modalité 30% acompte / 70% BL', description: 'Validation de l\'Incoterm CIF Conakry et des pièces de rechange.', responsibleAgent: 'Expert Commerce International', status: 'completed', deliverables: ['Facture Pro Forma signée'], estimatedDuration: '4 jours' },
            { stepNumber: 4, phase: 'Réglementation & Douane', title: 'Vérification nomenclature tarifaire SH et exonérations possibles', description: 'Code SH 8422.40 - Code des investissements guinéen.', responsibleAgent: 'Maître Diallo & Conseiller Douane', status: 'in_progress', deliverables: ['Note de conformité douanière'], estimatedDuration: '3 jours', regulationsChecked: ['Code Douanier CEDEAO', 'Certificat de Conformité AV / BIVAC'] },
            { stepNumber: 5, phase: 'Paiement Sécurisé', title: 'Émission du virement ou ouverture du Crédit Documentaire (DLC)', description: 'Séquestre bancaire jusqu\'à validation du connaissement maritime.', responsibleAgent: 'Expert Finance Diallo', status: 'pending', deliverables: ['Justificatif bancaire d\'engagement'], estimatedDuration: '2 jours' },
            { stepNumber: 6, phase: 'Logistique & Fret', title: 'Réservation conteneur 20 pieds et suivi du navire', description: 'Embarquement au port de Nansha avec Syli Logistics.', responsibleAgent: 'Syli Logistics (Transitaire)', status: 'pending', deliverables: ['Connaissement maritime (Bill of Lading original)'], estimatedDuration: '32 jours' },
            { stepNumber: 7, phase: 'Dédouanement & Réception', title: 'Passage en douane portuaire, paiement droits et livraison usine', description: 'Dépotage et installation par technicien local.', responsibleAgent: 'Transitaire & Équipe Technique', status: 'pending', deliverables: ['Bon de Sortie Port & PV de Réception'], estimatedDuration: '5 jours' }
        ],
        businessTripPlanned: {
            destinationCity: 'Guangzhou, Chine (Canton Fair)',
            targetDates: '15/05/2026 - 22/05/2026',
            visaStatus: 'Formulaire visa d\'affaires M préparé',
            suppliersToMeet: ['SinoPack Industrial', 'Guangdong Packaging Machinery'],
            hotelBooked: true,
            translatorNeeded: true,
            checklist: [
                { item: 'Passeport valide > 6 mois', done: true },
                { item: 'Lettre d\'invitation officielle du fabricant', done: true },
                { item: 'Télécharger WeChat & Traducteur Diallo hors-ligne', done: true },
                { item: 'Échantillons de sachets locaux pour test machine', done: false }
            ]
        }
    }
];

export const MOCK_DEAL_NEGOTIATIONS: TradeDealNegotiation[] = [
    {
        id: 'deal-cafe-1',
        dealTitle: 'Négociation Lot Café Ziama Export 2026 (2 Tonnes)',
        buyerId: 'u-roast-paris',
        buyerName: 'Torréfaction Artisanale de Paris',
        sellerId: 'u-ziama-trade',
        sellerName: 'Coopérative Café Ziama',
        productId: 'prod-cafe-ziama-2026',
        productTitle: 'Café Ziama Bio Arabica',
        productImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400',
        initialPrice: 4.80,
        currentOfferPrice: 4.50,
        targetPrice: 4.40,
        quantity: 2000,
        currency: 'EUR',
        status: 'counter_received',
        agreedIncoterm: 'CIF Le Havre',
        paymentMilestones: ['30% à la commande (acompte)', '70% à présentation du Bill of Lading légalisé'],
        history: [
            { party: 'buyer', amount: 4.30, notes: 'Proposition initiale pour 2 tonnes avec livraison maritime.', date: '18/02/2026' },
            { party: 'seller', amount: 4.60, notes: 'Contre-offre du vendeur : inclus certificat bio et sacs grainpro hermétiques.', date: '19/02/2026' },
            { party: 'buyer', amount: 4.50, notes: 'Nouvelle proposition de l\'acheteur si expédition sous 15 jours.', date: '20/02/2026' }
        ]
    }
];

export const JOBS: JobOffer[] = [
    {
        id: 'j1',
        title: 'Développeur React Senior',
        company: 'TechCorp Paris',
        location: 'Paris, France',
        type: 'CDI',
        salary: '55k - 65k €',
        description: 'Nous recherchons un expert React...',
        postedAt: 'Il y a 2 jours'
    }
];

export const HOUSING_LISTINGS: HousingListing[] = [
    {
        id: 'h1',
        title: 'Studio Lumineux Centre-Ville',
        type: 'Location',
        price: 750,
        currency: 'EUR',
        location: 'Lyon, France',
        rooms: 1,
        surface: 25,
        imageUrl: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=400&fit=crop',
        tags: ['Meublé', 'Proche Métro']
    }
];

export const LEGAL_PROCEDURES: LegalProcedure[] = [
    {
        id: 'l1',
        title: 'Demande de Visa Long Séjour',
        category: 'Immigration',
        status: 'pending',
        progress: 45,
        nextStep: 'Dépôt des empreintes',
        deadline: '15/06/2025'
    }
];

export const DAILY_QUESTS: Quest[] = [
    {
        id: 'q1',
        title: 'Apprendre 5 mots',
        description: 'Vocabulaire anglais',
        xp: 50,
        completed: false,
        icon: '📚'
    }
];

export const SUPPORTED_LANGUAGES: Language[] = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' }
];

export const TRANSLATIONS: Record<string, Record<string, string>> = {
    fr: {
        'nav.home': 'Accueil',
        'nav.chat': 'Experts IA',
        'nav.social': 'Réseau Mok',
        'nav.world': 'Monde / Mes Parcours',
        'nav.career': 'Carrière',
        'nav.campus': 'Campus',
        'nav.wallet': 'Finance',
        'nav.legal': 'Juridique',
        'nav.health': 'Santé',
        'nav.housing': 'Logement',
        'nav.shop': 'Marché Mondial'
    },
    en: {
        'nav.home': 'Home',
        'nav.chat': 'AI Experts',
        'nav.world': 'World / My Journeys',
        'nav.shop': 'Global Market'
    },
    // Add more languages as needed
};

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
    { id: 't1', type: 'payment', amount: -25.00, currency: 'EUR', date: 'Aujourd\'hui', description: 'Achat Store: Pack CV', status: 'completed' },
    { id: 't2', type: 'deposit', amount: 1500.00, currency: 'EUR', date: 'Hier', description: 'Virement Salaire', status: 'completed' }
];

export const MOCK_MEMBERS: MemberProfile[] = [
    {
        id: 'u1',
        name: 'Amadou Diallo',
        avatarUrl: USER_PROFILE.avatarUrl,
        title: 'Développeur Fullstack & Fondateur Mooc',
        bio: 'Passionné d\'IA, de technologies décentralisées et d\'autonomie numérique pour les citoyens du monde. 🌍🚀',
        location: 'Paris, France & Conakry, Guinée',
        joinedDate: 'Janvier 2025',
        isVerified: true,
        isFollowing: false,
        followersCount: 1420,
        followingCount: 238,
        postsCount: 18,
        storiesCount: 4,
        reelsCount: 12,
        livesCount: 7,
        skills: ['React', 'TypeScript', 'Intelligence Artificielle', 'Cloud Architecture', 'Python'],
        privacySettings: {
            profileVisibility: 'public',
            allowMessagesFrom: 'all',
            showOnlineStatus: true,
            allowTagging: true,
            showActivityFeed: true
        }
    },
    {
        id: 'u2',
        name: 'Sarah Koné',
        avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
        title: 'CEO AgriTech & Innovatrice Diaspora',
        bio: 'Bâtir des ponts technologiques entre l\'Europe et l\'Afrique de l\'Ouest. Membre du Conseil d\'Innovation. 🌱💻',
        location: 'Abidjan, Côte d\'Ivoire',
        joinedDate: 'Mars 2025',
        isVerified: true,
        isFollowing: true,
        followersCount: 3890,
        followingCount: 412,
        postsCount: 45,
        storiesCount: 6,
        reelsCount: 24,
        livesCount: 15,
        skills: ['AgriTech', 'Levée de fonds', 'Management', 'Marketing Digital'],
        privacySettings: {
            profileVisibility: 'public',
            allowMessagesFrom: 'all',
            showOnlineStatus: true,
            allowTagging: true,
            showActivityFeed: true
        }
    },
    {
        id: 'u3',
        name: 'Fatou Diop',
        avatarUrl: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&fit=crop',
        title: 'Data Scientist & Chercheuse IA',
        bio: 'Exploration des modèles LLM et du NLP appliqué aux langues africaines et multilinguisme. 🤖📚',
        location: 'Dakar, Sénégal',
        joinedDate: 'Février 2025',
        isVerified: true,
        isFollowing: true,
        followersCount: 2150,
        followingCount: 180,
        postsCount: 32,
        storiesCount: 3,
        reelsCount: 18,
        livesCount: 9,
        skills: ['Machine Learning', 'Python', 'NLP', 'Data Visualisation'],
        privacySettings: {
            profileVisibility: 'public',
            allowMessagesFrom: 'all',
            showOnlineStatus: true,
            allowTagging: true,
            showActivityFeed: true
        }
    },
    {
        id: 'u4',
        name: 'Jean-Michel Dubois',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop',
        title: 'Consultant en Mobilité Internationale & Droit',
        bio: 'Accompagnement des talents vers l\'expatriation, reconnaissance des compétences et équivalences. ⚖️✈️',
        location: 'Montréal, Canada',
        joinedDate: 'Avril 2025',
        isVerified: true,
        isFollowing: false,
        followersCount: 1870,
        followingCount: 95,
        postsCount: 22,
        storiesCount: 2,
        reelsCount: 8,
        livesCount: 12,
        skills: ['Immigration', 'Droit du Travail', 'Expatriation', 'Conseil'],
        privacySettings: {
            profileVisibility: 'network',
            allowMessagesFrom: 'network',
            showOnlineStatus: true,
            allowTagging: true,
            showActivityFeed: true
        }
    },
    {
        id: 'u5',
        name: 'Khadija Benali',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
        title: 'Product Designer UX/UI & Mentor',
        bio: 'Créer des interfaces accessibles et esthétiques. Passionnée par le design éthique et inclusif. ✨🎨',
        location: 'Casablanca, Maroc',
        joinedDate: 'Mai 2025',
        isVerified: true,
        isFollowing: true,
        followersCount: 4200,
        followingCount: 320,
        postsCount: 56,
        storiesCount: 5,
        reelsCount: 30,
        livesCount: 18,
        skills: ['Figma', 'Design Systems', 'UX Research', 'Design Sprint'],
        privacySettings: {
            profileVisibility: 'public',
            allowMessagesFrom: 'all',
            showOnlineStatus: false,
            allowTagging: true,
            showActivityFeed: true
        }
    }
];

export const MOCK_CHATS: ChatConversation[] = [
    {
        id: 'chat1',
        participantId: 'u3',
        participantName: 'Fatou Diop',
        participantAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&fit=crop',
        participantTitle: 'Data Scientist & Chercheuse IA',
        lastMessage: '🎙️ Message vocal (0:42)',
        lastMessageTime: '10:45',
        unreadCount: 2,
        isOnline: true,
        messages: [
            { id: 'm1', senderId: 'u3', senderName: 'Fatou Diop', senderAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&fit=crop', text: 'Salut Amadou ! As-tu jeté un œil à l\'algorithme de recommandation du flux Mooc ?', timestamp: new Date(Date.now() - 7200000), isRead: true },
            { id: 'm2', senderId: 'me', senderName: 'Amadou Diallo', senderAvatar: USER_PROFILE.avatarUrl, text: 'Salut Fatou ! Oui, les clusters d\'intérêt fonctionnent super bien avec les filtres thématiques.', timestamp: new Date(Date.now() - 3600000), isRead: true },
            { id: 'm3', senderId: 'u3', senderName: 'Fatou Diop', senderAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&fit=crop', mediaType: 'audio', audioDuration: 42, text: 'Explications audio des tests de scoring d\'engagement en direct.', timestamp: new Date(Date.now() - 900000), isRead: false },
            { id: 'm4', senderId: 'u3', senderName: 'Fatou Diop', senderAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&fit=crop', mediaType: 'document', fileName: 'Rapport_Analyse_Mooc_Engagement_2026.pdf', fileSize: '2.4 MB', text: 'Voici le benchmark complet avec les métriques d\'assistance IA pré-publication.', timestamp: new Date(Date.now() - 120000), isRead: false }
        ]
    },
    {
        id: 'chat2',
        participantId: 'u2',
        participantName: 'Sarah Koné',
        participantAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
        participantTitle: 'CEO AgriTech & Innovatrice Diaspora',
        lastMessage: 'Super, on lance l\'appel vidéo avec partage d\'écran pour valider les maquettes !',
        lastMessageTime: 'Hier',
        unreadCount: 0,
        isOnline: true,
        messages: [
            { id: 'm1', senderId: 'me', senderName: 'Amadou Diallo', senderAvatar: USER_PROFILE.avatarUrl, text: 'Sarah, j\'ai partagé le nouveau storyboard dans la Tribu Entrepreneurs.', timestamp: new Date(Date.now() - 86400000), isRead: true },
            { id: 'm2', senderId: 'u2', senderName: 'Sarah Koné', senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop', text: 'Magnifique ! Les retours de la communauté sont unanimes sur l\'assistant IA avant publication.', timestamp: new Date(Date.now() - 80000000), isRead: true },
            { id: 'm3', senderId: 'u2', senderName: 'Sarah Koné', senderAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop', text: 'Super, on lance l\'appel vidéo avec partage d\'écran pour valider les maquettes !', timestamp: new Date(Date.now() - 75000000), isRead: true }
        ]
    },
    {
        id: 'chat3',
        participantId: '2', // Maître Diallo Agent
        participantName: 'Maître Diallo',
        participantAvatar: AGENTS[1].avatarUrl,
        participantTitle: 'Expert Juridique & Procédures',
        lastMessage: 'Votre synthèse légale pour la création de filiale est disponible.',
        lastMessageTime: 'Lun',
        unreadCount: 0,
        isOnline: true,
        isAgent: true,
        messages: [
            { id: 'm1', senderId: '2', senderName: 'Maître Diallo', senderAvatar: AGENTS[1].avatarUrl, text: 'Bonjour Amadou. Votre dossier de conformité pour le réseau Mooc et les aspects RGPD multinationaux a été vérifié avec succès.', timestamp: new Date(Date.now() - 172800000), isRead: true },
            { id: 'm2', senderId: '2', senderName: 'Maître Diallo', senderAvatar: AGENTS[1].avatarUrl, mediaType: 'document', fileName: 'Synthese_Juridique_Protection_Donnees_Mooc.pdf', fileSize: '1.1 MB', text: 'Voici le document juridique certifié pour votre espace personnel et vos Tribus.', timestamp: new Date(Date.now() - 170000000), isRead: true }
        ]
    },
    {
        id: 'chat4',
        participantId: 'group-tech',
        participantName: '🚀 Tribu Développeurs & Tech 2026',
        participantAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200&fit=crop',
        participantTitle: 'Groupe public • 1,420 membres',
        isGroup: true,
        groupMembersCount: 1420,
        lastMessage: 'Jean-Michel: Qui participe au hackathon IA samedi ?',
        lastMessageTime: '11:20',
        unreadCount: 4,
        isOnline: true,
        messages: [
            { id: 'm1', senderId: 'u4', senderName: 'Jean-Michel Dubois', senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop', text: 'Hello tout le monde ! Nous organisons une session de revue de code en direct dans Mooc Chat.', timestamp: new Date(Date.now() - 3600000), isRead: true },
            { id: 'm2', senderId: 'u5', senderName: 'Khadija Benali', senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop', text: 'Génial ! Je partagerai mon écran pour la présentation des composants UI adaptatifs.', timestamp: new Date(Date.now() - 1800000), isRead: true },
            { id: 'm3', senderId: 'u4', senderName: 'Jean-Michel Dubois', senderAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&fit=crop', text: 'Qui participe au hackathon IA samedi ?', timestamp: new Date(Date.now() - 600000), isRead: false }
        ]
    }
];

export const POSTS: Post[] = [
    {
        id: 'post-1',
        authorId: 'u1',
        authorName: 'Amadou Diallo',
        authorAvatar: USER_PROFILE.avatarUrl,
        authorTitle: 'Développeur Fullstack & Fondateur Mooc',
        content: `🚀 **ÉVOLUTION MAJEURE DE RÉSEAU MOOC : LE CŒUR COLLABORATIF ET INTELLIGENT DE LA PLATEFORME**\n\nChaque membre dispose désormais d'un **espace personnel complet** (publications, stories, reels, lives, paramètres de confidentialité) et d'un **assistant IA pré-publication** capable d'améliorer votre style, traduire instantanément en 12+ langues et enrichir vos contenus avec des visuels génératifs.\n\n✨ Testez dès maintenant le bouton permanent **Mooc Chat** pour échanger, envoyer des vocaux, partager vos documents et lancer des appels audio/vidéo avec partage d'écran !`,
        timestamp: 'À l\'instant',
        likes: 128,
        comments: 18,
        shares: 34,
        category: 'Tech & Innovation',
        tags: ['#MoocNetwork', '#IntelligenceArtificielle', '#Collaboration', '#DiasporaTech'],
        pinned: true,
        visibility: 'public',
        aiEnhanced: true,
        reactions: {
            like: 64,
            love: 38,
            celebrate: 14,
            insightful: 8,
            support: 3,
            fire: 25
        },
        document: {
            name: 'Guide_Officiel_Reseau_Mooc_Espace_Collaboratif_2026.pdf',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            size: '3.8 MB',
            type: 'pdf',
            pageCount: 14
        },
        imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1000&fit=crop',
        commentsList: [
            {
                id: 'cmt-1',
                authorName: 'Fatou Diop',
                authorAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
                content: 'L\'assistant IA avant publication change totalement la donne ! La traduction instantanée en Wolof et Anglais est hyper précise.',
                timestamp: 'Il y a 10 min',
                likes: 12,
                isLiked: true,
                replies: [
                    {
                        id: 'cmt-1-1',
                        authorName: 'Amadou Diallo',
                        authorAvatar: USER_PROFILE.avatarUrl,
                        content: 'Merci Fatou ! La puissance des modèles multimodaux permet de valoriser toutes les langues de notre communauté.',
                        timestamp: 'Il y a 5 min',
                        likes: 4
                    }
                ]
            },
            {
                id: 'cmt-2',
                authorName: 'Jean-Michel Dubois',
                authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
                content: 'Le partage d\'écran dans Mooc Chat est d\'une fluidité remarquable. Idéal pour les revues de dossiers de mobilité.',
                timestamp: 'Il y a 25 min',
                likes: 8
            }
        ]
    },
    {
        id: 'post-2',
        authorId: 'u2',
        authorName: 'Sarah Koné',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
        authorTitle: 'CEO AgriTech & Innovatrice Diaspora',
        content: `🌾 **Retour d'expérience : Comment nous avons connecté 5 000 producteurs agricoles grâce à l'IA vocale et à l'espace collaboratif Mooc.**\n\nGrâce aux micro-formations du Campus et aux conseils du Conseiller Diallo, notre équipe a levé 250k€ en amorçage. Voici notre dossier récapitulatif avec les métriques d'impact.`,
        timestamp: 'Il y a 2h',
        likes: 95,
        comments: 12,
        shares: 20,
        category: 'Entrepreneuriat',
        tags: ['#AgriTech', '#Impact', '#Startup', '#LevéeDeFonds'],
        visibility: 'public',
        reactions: {
            like: 45,
            love: 28,
            celebrate: 16,
            insightful: 6,
            support: 2,
            fire: 14
        },
        imageUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=1000&fit=crop',
        document: {
            name: 'Dossier_Impact_AgriTech_Investissement_2026.pdf',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            size: '5.2 MB',
            type: 'pdf',
            pageCount: 22
        }
    },
    {
        id: 'post-3',
        agentId: '2',
        authorName: 'Maître Diallo',
        authorAvatar: AGENTS[1].avatarUrl,
        authorTitle: 'Expert Juridique & Justice',
        content: `⚖️ **NOTE JURIDIQUE OFFICIELLE 2026 : Démarches simplifiées pour le Visa 'Passeport Talent' et l'équivalence des diplômes étrangers.**\n\nNous mettons à la disposition de tous les membres le formulaire interactif et les pièces justificatives requises. N'hésitez pas à poser vos questions en commentaire ou via Mooc Chat.`,
        timestamp: 'Il y a 4h',
        likes: 210,
        comments: 35,
        shares: 78,
        category: 'Juridique & Visas',
        tags: ['#DroitImmigration', '#VisaTalent', '#EquivalenceDiplome', '#MaitreDiallo'],
        visibility: 'public',
        reactions: {
            like: 110,
            love: 35,
            celebrate: 20,
            insightful: 30,
            support: 15,
            fire: 18
        },
        document: {
            name: 'Guide_Legal_Visa_Talent_Equivalences_2026.pdf',
            url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
            size: '1.9 MB',
            type: 'pdf',
            pageCount: 8
        }
    }
];

export const STORIES: Story[] = [
    {
        id: 'st1',
        author: 'Maître Diallo',
        authorId: 'agent-2',
        avatar: AGENTS[1].avatarUrl,
        isLive: false,
        mediaUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&fit=crop',
        mediaType: 'image',
        caption: 'Permanence juridique ouverte : posez vos questions sur les titres de séjour.',
        timestamp: 'Il y a 30 min',
        viewersCount: 420
    },
    {
        id: 'st2',
        author: 'Sarah Koné',
        authorId: 'u2',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
        isLive: true,
        mediaUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&fit=crop',
        mediaType: 'image',
        caption: 'En direct de la conférence Tech Afrique 2026 à Dakar ! 🎙️⚡',
        timestamp: 'Il y a 1h',
        viewersCount: 890
    },
    {
        id: 'st3',
        author: 'Fatou Diop',
        authorId: 'u3',
        avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=200&fit=crop',
        isLive: false,
        mediaUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&fit=crop',
        mediaType: 'image',
        caption: 'Nouveau cours sur l\'optimisation des modèles d\'IA disponible sur le Campus ! 🎓',
        timestamp: 'Il y a 3h',
        viewersCount: 615
    },
    {
        id: 'st4',
        author: 'Guide Diallo',
        authorId: 'agent-7',
        avatar: AGENTS[6].avatarUrl,
        isLive: false,
        mediaUrl: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&fit=crop',
        mediaType: 'image',
        caption: 'Conseils pour trouver un vol économique vers le Canada ou l\'Europe cet été. ✈️🌍',
        timestamp: 'Il y a 5h',
        viewersCount: 1100
    }
];

export const REELS: Reel[] = [
    {
        id: 'r1',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=400&fit=crop',
        likes: 1840,
        comments: 92,
        shares: 310,
        saves: 450,
        viewsCount: 14200,
        author: 'Amadou Diallo',
        authorAvatar: USER_PROFILE.avatarUrl,
        authorId: 'u1',
        authorRole: 'Fondateur & Lead Dev',
        description: 'Comment l\'IA de Réseau Mok transforme votre façon de collaborer et de lancer des projets ⚡💡 #Tech #Mok #Innovation #DialloOS',
        musicTrack: 'Afrobeat Future - Instrumental 2026',
        tags: ['#Tech', '#Mok', '#Innovation', '#AI', '#DialloOS'],
        isLiked: true,
        isSaved: true,
        category: 'project',
        language: 'Français',
        whyRecommended: 'Parce que vous portez un intérêt pour les projets technologiques et l\'architecture Diallo OS.',
        actionGateway: {
            type: 'project',
            label: 'Lancer ce projet avec Expert Projet',
            targetTitle: 'Incubateur Tech & IA Mok',
            agentId: '1'
        },
        quiz: {
            question: 'Quel est l\'impact premier d\'une architecture d\'agents IA interconnectée ?',
            options: ['Déléguer sans contrôle', 'Passer de l\'idée à l\'action structurée sans friction', 'Créer du spam'],
            correctIndex: 1,
            explanation: 'Diallo OS structure les démarches, débloque les freins administratifs et coordonne le plan d\'action.',
            campusCourseId: 'course-ai-101'
        },
        impactMetrics: {
            learnersStarted: 340,
            parcoursTriggered: 78,
            collaborationsCreated: 24,
            opportunitiesViewed: 110,
            campusEnrollments: 52,
            utilityScore: 94
        },
        commentSummary: {
            mainThemes: ['Compatibilité mobile', 'Intégration bancaire', 'Disponibilité en Guinée'],
            frequentQuestions: ['Comment postuler à l\'incubateur ?', 'Est-ce gratuit pour les étudiants ?'],
            unansweredQuestions: ['Prévoyez-vous une version hors-ligne par SMS ?']
        }
    },
    {
        id: 'r2',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-smartphone-with-green-screen-41225-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&fit=crop',
        likes: 2450,
        comments: 130,
        shares: 520,
        saves: 890,
        viewsCount: 28900,
        author: 'Sarah Koné',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
        authorId: 'u2',
        authorRole: 'Coach Carrière & Recrutement',
        isVerifiedExpert: true,
        description: '3 astuces pour réussir son entretien d\'embauche international en 60 secondes avec Conseiller Diallo ! 💼🎯 #Carriere #CV #Emploi',
        musicTrack: 'Success Wave - Motivational Beats',
        tags: ['#Emploi', '#Carriere', '#ConseillerDiallo', '#Entretien'],
        isLiked: false,
        isSaved: false,
        category: 'career',
        language: 'Français',
        whyRecommended: 'Parce que vous avez exploré les offres de mobilité internationale et le module Carrière.',
        actionGateway: {
            type: 'career_coach',
            label: 'Optimiser mon CV avec Coach Carrière',
            targetTitle: 'Audit CV & Simulation d\'entretien',
            agentId: '2'
        },
        quiz: {
            question: 'Quelle est la règle d\'or lors de la présentation d\'un projet en entretien ?',
            options: ['Parler uniquement de ses diplômes', 'Structurer avec la méthode STAR (Situation, Tâche, Action, Résultat)', 'Improviser au feeling'],
            correctIndex: 1,
            explanation: 'La méthode STAR démontre un impact mesurable et pragmatique qui rassure les recruteurs internationaux.',
            campusCourseId: 'course-career-pro'
        },
        impactMetrics: {
            learnersStarted: 512,
            parcoursTriggered: 145,
            collaborationsCreated: 19,
            opportunitiesViewed: 380,
            campusEnrollments: 94,
            utilityScore: 98
        }
    },
    {
        id: 'r3',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-tree-branches-in-the-breeze-1188-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&fit=crop',
        likes: 3120,
        comments: 184,
        shares: 740,
        saves: 1200,
        viewsCount: 34100,
        author: 'Maître Ousmane Bah',
        authorAvatar: AGENTS[0].avatarUrl,
        authorId: 'agent-1',
        authorRole: 'Expert Juridique & Droit OHADA',
        isVerifiedExpert: true,
        isSyntheticAi: true,
        expertAgentId: '1',
        description: '⚖️ Création de SAS en zone OHADA : les 4 mentions obligatoires dans vos statuts pour éviter le rejet au RCCM. #Droit #OHADA #Business',
        musicTrack: 'Acoustic Clarity - Corporate Law',
        tags: ['#Juridique', '#OHADA', '#Entreprise', '#Statuts'],
        isLiked: true,
        isSaved: true,
        category: 'legal',
        language: 'Français',
        whyRecommended: 'Recommandé selon votre projet de création d\'entreprise dans la Tribu Entrepreneurs.',
        actionGateway: {
            type: 'legal_source',
            label: 'Consulter l\'Article 853 de l\'Acte Uniforme',
            targetTitle: 'Code des Sociétés Commerciales OHADA',
            legalArticle: {
                country: 'Zone OHADA (17 États)',
                codeOrLaw: 'Acte uniforme révisé relatif au droit des sociétés commerciales',
                articleNumber: 'Art. 853-1 à 853-23',
                sourceUrl: 'https://www.ohada.org/actes-uniformes'
            }
        },
        quiz: {
            question: 'Quel est le capital social minimum exigé pour une SAS en droit OHADA ?',
            options: ['10 000 000 FCFA', 'Librement fixé par les statuts', '100 000 000 FCFA'],
            correctIndex: 1,
            explanation: 'En droit OHADA révisé, le capital de la SAS est librement déterminé par les associés fondateurs.',
            campusCourseId: 'course-legal-ohada'
        },
        impactMetrics: {
            learnersStarted: 620,
            parcoursTriggered: 189,
            collaborationsCreated: 42,
            opportunitiesViewed: 210,
            campusEnrollments: 140,
            utilityScore: 99
        }
    },
    {
        id: 'r4',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-talking-on-a-video-call-with-a-laptop-42998-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&fit=crop',
        likes: 1950,
        comments: 88,
        shares: 410,
        saves: 670,
        viewsCount: 18500,
        author: 'Dr. Aïssata Camara',
        authorAvatar: AGENTS[2].avatarUrl,
        authorId: 'agent-3',
        authorRole: 'Médecin Référent Santé Publique',
        isVerifiedExpert: true,
        isSyntheticAi: true,
        expertAgentId: '3',
        description: '🩺 3 réflexes essentiels en cas de pic fébrile en zone tropicale avant toute consultation médicale. #Sante #Prevention #Conseils',
        musicTrack: 'Calm Pulse - Medical Wellness',
        tags: ['#Sante', '#Prevention', '#Medecine', '#Hygiene'],
        isLiked: false,
        isSaved: true,
        category: 'health',
        language: 'Français',
        whyRecommended: 'Sensibilisation santé publique pour votre zone géographique.',
        actionGateway: {
            type: 'expert',
            label: 'Consulter l\'Expert Santé & Carnet de Santé',
            targetTitle: 'Fiche d\'orientation médicale d\'urgence',
            agentId: '3'
        },
        quiz: {
            question: 'Pourquoi l\'automédication aux anti-inflammatoires (ex: Ibuprofène) est-elle déconseillée en cas de fièvre inexpliquée en zone d\'endémie ?',
            options: ['Ils coûtent trop cher', 'Risque hémorragique accru si syndrome de type Dengue', 'Aucun effet'],
            correctIndex: 1,
            explanation: 'En cas d\'infection par arbovirose (Dengue, etc.), les AINS augmentent fortement le risque de saignement.',
            campusCourseId: 'course-sante-trop'
        },
        impactMetrics: {
            learnersStarted: 890,
            parcoursTriggered: 210,
            collaborationsCreated: 15,
            opportunitiesViewed: 95,
            campusEnrollments: 120,
            utilityScore: 97
        }
    },
    {
        id: 'r5',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-typing-on-a-laptop-42999-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&fit=crop',
        likes: 4200,
        comments: 290,
        shares: 1100,
        saves: 2100,
        viewsCount: 52000,
        author: 'Tribu Commerce Afrique-Chine',
        authorAvatar: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200',
        authorId: 'tribe-cn-afr',
        authorRole: 'Communauté d\'Affaires & Logistique',
        description: '🇨🇳🌍 Appel à groupage de conteneurs Guangzhou ➔ Conakry & Abidjan pour la rentrée. Réduction de 35% sur le fret maritime ! #Import #Logistique',
        musicTrack: 'Silk Road Horizon - Global Trade',
        tags: ['#ImportExport', '#ChineAfrique', '#Logistique', '#Fret'],
        isLiked: true,
        isSaved: true,
        category: 'tribe',
        tribeName: 'Commerce Afrique–Chine',
        tribeId: 'tr-cn-af',
        language: 'Français',
        whyRecommended: 'Parce que vous suivez la Tribu Commerce International et les questions d\'import-export.',
        actionGateway: {
            type: 'tribe',
            label: 'Rejoindre le groupe de travail Fret Groupé',
            targetTitle: 'Tribu Commerce Afrique-Chine',
            tribeId: 'tr-cn-af'
        },
        impactMetrics: {
            learnersStarted: 410,
            parcoursTriggered: 310,
            collaborationsCreated: 88,
            opportunitiesViewed: 920,
            campusEnrollments: 45,
            utilityScore: 99
        }
    },
    {
        id: 'r6',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-reading-a-book-in-a-library-42997-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&fit=crop',
        likes: 2780,
        comments: 115,
        shares: 630,
        saves: 1450,
        viewsCount: 26000,
        author: 'Campus Mok & Prof. Chen',
        authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        authorId: 'agent-lang-cn',
        authorRole: 'Masterclass Langues & Négociation',
        isVerifiedExpert: true,
        description: '🇨🇳 Les 5 formules de politesse indispensables pour négocier avec un fournisseur chinois en usine. Répétez avec nous ! 🗣️ #Mandarin #Commerce',
        musicTrack: 'Oriental Zen - Lofi Mandarin',
        tags: ['#Mandarin', '#Langues', '#Chine', '#Negociation'],
        isLiked: false,
        isSaved: true,
        category: 'language',
        language: 'Chinois / Français',
        whyRecommended: 'Parce que vous avez commencé le cours "Mandarin des Affaires" sur le Campus.',
        actionGateway: {
            type: 'campus',
            label: 'Approfondir ce module sur le Campus (Module 3)',
            targetTitle: 'Négociation Commerciale en Mandarin',
            courseId: 'course-mandarin-pro'
        },
        quiz: {
            question: 'Que signifie l\'expression « 合作共赢 » (Hézuò gòngyíng) fréquemment utilisée lors de signatures d\'accords ?',
            options: ['Payer d\'avance', 'Coopération Gagnant-Gagnant', 'Rupture de contrat'],
            correctIndex: 1,
            explanation: 'Hézuò gòngyíng est le principe cardinal de la négociation partenariale équilibrée en Chine.',
            campusCourseId: 'course-mandarin-pro'
        },
        impactMetrics: {
            learnersStarted: 740,
            parcoursTriggered: 290,
            collaborationsCreated: 31,
            opportunitiesViewed: 410,
            campusEnrollments: 320,
            utilityScore: 98
        }
    },
    {
        id: 'r7',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-hands-holding-a-green-plant-1234-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&fit=crop',
        likes: 3890,
        comments: 245,
        shares: 980,
        saves: 1850,
        viewsCount: 42000,
        author: 'Ibrahima Sory & Éco-Guinée',
        authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        authorId: 'u-ibra',
        authorRole: 'Porteur de Projet Écologie & Recyclage',
        description: '♻️ « J’ai une idée pour transformer les déchets plastiques en pavés écologiques, mais je cherche un cadrage et un partenaire technique ! » #Ecologie #Projet #DialloOS',
        musicTrack: 'Green Tomorrow - Eco Innovation',
        tags: ['#Ecologie', '#Recyclage', '#Projet', '#AfriqueDurable'],
        isLiked: false,
        isSaved: true,
        category: 'project',
        language: 'Français',
        whyRecommended: 'Parce que vous participez à la Tribu Climat & Développement Durable.',
        actionGateway: {
            type: 'project',
            label: 'Transformer mon idée en projet structuré',
            targetTitle: 'Incubation & Cadrage Recyclage Plastique',
            agentId: '1'
        },
        quiz: {
            question: 'Quel est le premier livrable attendu pour valider la viabilité d\'un projet de recyclage local ?',
            options: ['L\'achat des machines sans étude', 'L\'étude de gisement des déchets et les débouchés locaux', 'Faire un logo'],
            correctIndex: 1,
            explanation: 'La maîtrise du gisement d\'approvisionnement et la rentabilité du modèle économique conditionnent l\'investissement.',
            campusCourseId: 'course-green-business'
        },
        impactMetrics: {
            learnersStarted: 520,
            parcoursTriggered: 114,
            collaborationsCreated: 36,
            opportunitiesViewed: 480,
            campusEnrollments: 88,
            utilityScore: 99
        }
    },
    {
        id: 'r8',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-working-at-her-laptop-in-a-coffee-shop-42996-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&fit=crop',
        likes: 5120,
        comments: 310,
        shares: 1420,
        saves: 2600,
        viewsCount: 68000,
        author: 'Cabinet Talents Sahel & Tech',
        authorAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
        authorId: 'u-talents-recrut',
        authorRole: 'Cabinet RH International',
        isVerifiedExpert: true,
        description: '💼 Recrutement : 15 postes d\'Ingénieurs Cloud & Développeurs Fullstack en télétravail international (Salaire : 2500€ - 4500€/mois). Échéance : 15 Septembre. #Emploi #Tech #Teletravail',
        musicTrack: 'Future Career - Professional Beats',
        tags: ['#Emploi', '#TechJobs', '#Recrutement', '#Remote'],
        isLiked: true,
        isSaved: true,
        category: 'career',
        language: 'Français',
        whyRecommended: 'Parce que votre profil correspond aux compétences Cloud & Développement Web.',
        actionGateway: {
            type: 'career_coach',
            label: 'Candidater & Préparer mon dossier avec Coach Carrière',
            targetTitle: 'Poste Ingénieur Cloud / Fullstack Remote',
            agentId: '2',
            opportunityData: {
                type: 'job',
                deadline: '15 Septembre 2026',
                organization: 'Talents Sahel & Global Tech'
            }
        },
        quiz: {
            question: 'Quel document clé fait la différence lors d\'une candidature pour un poste full remote international ?',
            options: ['Une photo d\'identité uniquement', 'Un portfolio GitHub / Projets vérifiés avec README clair', 'Une lettre manuscrite'],
            correctIndex: 1,
            explanation: 'Les recruteurs internationaux évaluent en priorité vos réalisations concrètes et votre autonomie démontrée.',
            campusCourseId: 'course-remote-engineer'
        },
        impactMetrics: {
            learnersStarted: 980,
            parcoursTriggered: 410,
            collaborationsCreated: 62,
            opportunitiesViewed: 1850,
            campusEnrollments: 240,
            utilityScore: 99
        }
    },
    {
        id: 'r9',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-coffee-beans-in-a-sack-and-in-a-wooden-scoop-41617-large.mp4',
        thumbnailUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=400&fit=crop',
        likes: 3400,
        comments: 180,
        shares: 890,
        saves: 1300,
        viewsCount: 39000,
        author: 'Coopérative Café & Cacao Ziama',
        authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        authorId: 'u-ziama-trade',
        authorRole: 'Producteur & Exportateur Bio',
        description: '☕🇬🇳 Présentation de notre récolte de Café Ziama Bio Arabica (Lot certifié export 2026, 12 tonnes disponibles pour grossistes & torréfacteurs). #Commerce #Export #AgriBusiness',
        musicTrack: 'African Harvest - Acoustic Roots',
        tags: ['#Commerce', '#Export', '#AgriBusiness', '#CafeBio'],
        isLiked: true,
        isSaved: true,
        category: 'commerce',
        language: 'Français (Traduction automatique activée)',
        whyRecommended: 'Parce que vous suivez le Marché International et les opportunités d\'import/export agroalimentaire.',
        actionGateway: {
            type: 'commerce',
            label: 'Demande commerciale & Fiche produit au Marché',
            targetTitle: 'Café Arabica Bio Ziama - Lot Export 2026',
            productId: 'prod-cafe-ziama-2026'
        },
        impactMetrics: {
            learnersStarted: 310,
            parcoursTriggered: 195,
            collaborationsCreated: 54,
            opportunitiesViewed: 890,
            campusEnrollments: 32,
            utilityScore: 98
        }
    }
];

export const REEL_CHALLENGES: ReelChallenge[] = [
    {
        id: 'ch-english-30',
        title: '30 Jours d\'Anglais Professionnel 🗣️',
        tagline: 'Une minute par jour pour débloquer sa fluidité en réunion internationale.',
        category: 'Langues & Carrière',
        durationDays: 30,
        participantsCount: 3420,
        rewardXp: 500,
        badge: 'Fluent Speaker 2026',
        steps: [
            { day: 1, title: 'Présenter son pitch en 3 phrases', objective: 'Maîtriser le Present Perfect et les verbes d\'action.', completed: true },
            { day: 2, title: 'Négocier un délai par email', objective: 'Utiliser les formules de politesse diplomatiques.', completed: true },
            { day: 3, title: 'Répondre à une objection client', objective: 'Utiliser la technique du "Feel, Felt, Found".', completed: false },
            { day: 4, title: 'Présenter un graphique en anglais', objective: 'Vocabulaire des tendances (increase, soar, stabilize).', completed: false }
        ]
    },
    {
        id: 'ch-cv-7',
        title: '7 Jours pour un CV International Choc 💼',
        tagline: 'Optimisez votre CV selon les standards ATS et décrochez des entretiens.',
        category: 'Carrière & Emploi',
        durationDays: 7,
        participantsCount: 5800,
        rewardXp: 350,
        badge: 'Elite CV Master',
        steps: [
            { day: 1, title: 'Audit de clarté & suppression des redondances', objective: 'Restructurer les rubriques clés.', completed: true },
            { day: 2, title: 'Formuler chaque expérience avec la méthode STAR', objective: 'Quantifier les résultats mesurables.', completed: false },
            { day: 3, title: 'Optimisation des mots-clés ATS pour l\'IA', objective: 'Passer les filtres automatiques des recruteurs.', completed: false }
        ]
    },
    {
        id: 'ch-budget-first',
        title: 'Créer son Premier Budget & Plan de Trésorerie 💰',
        tagline: 'Maîtrisez vos flux financiers personnels et d\'entreprise en 5 étapes.',
        category: 'Finance & Gestion',
        durationDays: 5,
        participantsCount: 2150,
        rewardXp: 300,
        badge: 'Finance Prodigy',
        steps: [
            { day: 1, title: 'Cartographie des charges fixes et variables', objective: 'Identifier les postes d\'optimisation.', completed: true },
            { day: 2, title: 'Calcul du point mort (Seuil de rentabilité)', objective: 'Connaître son chiffre d\'affaires minimum vital.', completed: false }
        ]
    },
    {
        id: 'ch-pitch-60',
        title: 'Une Idée Entrepreneuriale en 60 Secondes 🚀',
        tagline: 'Pitcher son projet devant la communauté et recevoir du feedback d\'experts.',
        category: 'Entrepreneuriat',
        durationDays: 3,
        participantsCount: 1890,
        rewardXp: 400,
        badge: 'Innovator Pitcher',
        steps: [
            { day: 1, title: 'Définir le problème et la solution unique', objective: 'Phrase d\'accroche percutante.', completed: true },
            { day: 2, title: 'Exposer le modèle économique', objective: 'Comment vous générez de la valeur.', completed: false }
        ]
    }
];

export const ACTIVE_LIVES: LiveStream[] = [
    {
        id: 'live1',
        title: 'Masterclass Financement de Projet & Levée de Fonds 🚀',
        description: 'Comment structurer son dossier d\'investissement pour l\'Afrique et l\'international avec l\'Expert Projet Diallo.',
        type: 'project_pitch',
        hostName: 'Sarah Koné',
        hostAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
        viewers: 1420,
        isMixed: true,
        aiAssistantId: '1',
        startedAt: new Date(Date.now() - 15 * 60 * 1000),
        duration: 45,
        isPaid: false,
        language: 'Français',
        targetLanguage: 'Anglais',
        coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800&fit=crop',
        tribeId: 'tr1',
        tribeName: 'Entrepreneurs Africa',
        isRecordingEnabled: true,
        isTranslationEnabled: true,
        isQuestionsEnabled: true,
        isScreenShareEnabled: true,
        isVisionEnabled: true,
        qualityMode: 'auto',
        tags: ['#Financement', '#Entrepreneuriat', '#Projet', '#DialloOS'],
        speakers: [
            {
                id: 'spk-1',
                name: 'Sarah Koné',
                avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&fit=crop',
                role: 'host',
                isMuted: false,
                isVideoOn: true,
                isVerified: true
            },
            {
                id: 'spk-2',
                name: 'Directeur Diallo (IA)',
                avatar: AGENTS[0].avatarUrl,
                role: 'expert_ai',
                isMuted: false,
                isVideoOn: true,
                isAi: true,
                specialty: 'Chef de Projet & Stratégie',
                agentId: '1'
            }
        ]
    },
    {
        id: 'live2',
        title: 'Campus Live : Intelligence Artificielle & Deep Learning 🎓',
        description: 'Cours interactif avec tableau blanc, quiz en direct et évaluation certifiante.',
        type: 'campus',
        hostName: 'Pr. Touré',
        hostAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&fit=crop',
        viewers: 860,
        isMixed: true,
        aiAssistantId: '8',
        startedAt: new Date(Date.now() - 30 * 60 * 1000),
        duration: 60,
        isPaid: false,
        language: 'Français',
        targetLanguage: 'Anglais',
        coverImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&fit=crop',
        isRecordingEnabled: true,
        isTranslationEnabled: true,
        isQuestionsEnabled: true,
        isScreenShareEnabled: true,
        isVisionEnabled: true,
        qualityMode: 'auto',
        tags: ['#Campus', '#IA', '#Formation', '#Quiz']
    },
    {
        id: 'live3',
        title: 'Permanence Juridique : Titres de Séjour & Contrats ⚖️',
        description: 'Table ronde et questions/réponses en direct avec Me. Diallo et consultation privée sécurisée.',
        type: 'expert',
        hostName: 'Maître Diallo',
        hostAvatar: AGENTS[1].avatarUrl,
        viewers: 950,
        isMixed: true,
        aiAssistantId: '2',
        startedAt: new Date(Date.now() - 10 * 60 * 1000),
        duration: 30,
        isPaid: false,
        language: 'Français',
        targetLanguage: 'Arabe',
        coverImage: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&fit=crop',
        isRecordingEnabled: true,
        isTranslationEnabled: true,
        isQuestionsEnabled: true,
        isScreenShareEnabled: true,
        isVisionEnabled: true,
        tags: ['#Droit', '#Legal', '#Immigration']
    },
    {
        id: 'live-scheduled-1',
        title: 'Conférence Santé & Prévention Épidémiologique 🩺',
        description: 'Session interactive avec Dr. Diallo et experts médicaux partenaires.',
        type: 'conference',
        hostName: 'Dr. Diallo',
        hostAvatar: AGENTS[2].avatarUrl,
        viewers: 0,
        isMixed: true,
        aiAssistantId: '3',
        startedAt: new Date(Date.now() + 86400000),
        scheduledFor: 'Demain à 15:00 (GMT)',
        timezone: 'GMT+0 (Conakry/Dakar)',
        isScheduled: true,
        duration: 60,
        isPaid: false,
        language: 'Français',
        coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=800&fit=crop',
        tags: ['#Sante', '#Medecine', '#Conference']
    }
];

export const TRIBES: Tribe[] = [
    {
        id: 'tr1',
        name: 'Entrepreneurs Africa',
        description: 'Réseau d\'entrepreneurs tech en Afrique.',
        category: 'Business',
        members: 5400,
        image: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=200',
        coverImage: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=800',
        isJoined: true
    }
];

export const LEADERBOARD: LeaderboardUser[] = [
    { id: 'u1', name: 'Amadou D.', avatar: USER_PROFILE.avatarUrl, xp: 4500, rank: 1 },
    { id: 'u2', name: 'Sarah K.', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100', xp: 4200, rank: 2 }
];

export const COUNTRIES: Country[] = [
    { code: 'FR', name: 'France', flag: '🇫🇷', emergencyNumbers: { police: '17', ambulance: '15', fire: '18' } },
    { code: 'SN', name: 'Sénégal', flag: '🇸🇳', emergencyNumbers: { police: '17', ambulance: '15', fire: '18' } },
    { code: 'CA', name: 'Canada', flag: '🇨🇦', emergencyNumbers: { police: '911', ambulance: '911', fire: '911' } },
    { code: 'MA', name: 'Maroc', flag: '🇲🇦', emergencyNumbers: { police: '19', ambulance: '15', fire: '15' } }
];

export const LIVE_GIFTS: LiveGift[] = [
    { id: 'g1', name: 'Coeur', icon: '❤️', cost: 10, animation: 'heart-float' },
    { id: 'g2', name: 'Bravo', icon: '👏', cost: 50, animation: 'clap' },
    { id: 'g3', name: 'Feu', icon: '🔥', cost: 100, animation: 'fire' }
];

export const CURRENCIES: Currency[] = [
    { code: 'EUR', name: 'Euro', symbol: '€', rateToEuro: 1 },
    { code: 'USD', name: 'US Dollar', symbol: '$', rateToEuro: 0.92 },
    { code: 'XOF', name: 'Franc CFA', symbol: 'F', rateToEuro: 0.0015 }
];

export const SECURITY_LOGS: SecurityLog[] = [
    { id: 'log1', action: 'Connexion', date: 'Aujourd\'hui 10:00', ip: '192.168.1.1', device: 'iPhone 13', status: 'success' }
];

export const ACTIVE_SESSIONS: DeviceSession[] = [
    { id: 'ses1', deviceName: 'iPhone 13', location: 'Paris, FR', lastActive: 'En ligne', isCurrent: true },
    { id: 'ses2', deviceName: 'MacBook Pro', location: 'Lyon, FR', lastActive: 'Hier', isCurrent: false }
];

export const DAILY_VOCABULARY: VocabularyCard[] = [
    { id: 'v1', word: 'Persistence', translation: 'Persévérance', context: 'Essential for success.' }
];

export const LANGUAGE_LESSONS: LanguageLesson[] = [
    { id: 'll1', title: 'Commander au restaurant', level: 'Débutant', scenario: 'restaurant_order' }
];

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 MARCHÉ MONDIAL — MODULE 2 (DOSSIERS COMMERCIAUX & TRANSACTIONS INTELLIGENTES)
// ═══════════════════════════════════════════════════════════════════════════

export const MOCK_COMMERCIAL_DOSSIERS: CommercialDossier[] = [
    {
        id: 'dossier-pack-pharma-01',
        codeRef: 'DOS-2026-GN-CN-042',
        title: 'Importation 10 000 Boîtes Emballage Pharma Certifiées BPF',
        tradeType: 'import',
        dimension: 'B2B',
        buyerId: 'u-pharma-guinee',
        buyerName: 'Pharmacie Centrale & Distribution Guinéenne',
        buyerCountry: 'Guinée',
        buyerFlag: '🇬🇳',
        buyerVerificationTier: 'trade_docs_verified',
        sellerId: 'u-pack-global',
        sellerName: 'SinoPack Industrial Ltd (Guangzhou)',
        sellerCountry: 'Chine',
        sellerFlag: '🇨🇳',
        sellerVerificationTier: 'company_verified',
        productId: 'prod-carton-pharma-350g',
        productTitle: 'Boîtes Cartons Vernis UV Spécial Tropical BPF',
        productImageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&fit=crop',
        productCategory: 'Packaging & Emballage',
        quantity: 10000,
        unit: 'boîtes',
        unitPrice: 0.35,
        totalAmount: 3500,
        currency: 'EUR',
        buyerCurrency: 'GNF',
        exchangeRateUsed: 9450, // 1 EUR = 9450 GNF
        originCountry: 'Chine',
        originCity: 'Guangzhou (Port de Nansha)',
        destinationCountry: 'Guinée',
        destinationCity: 'Conakry (Port Autonome de Conakry)',
        status: 'verifications',
        statusLabel: 'Vérifications & Bon de commande',
        currentStepIndex: 7,
        totalStepsCount: 13,
        agreedIncoterm: 'CIF Port de Conakry',
        leadTimeDays: 24,
        checklist: [
            { id: 'chk-1', stepNumber: 1, title: 'Fournisseur identifié & Profil certifié', description: 'Vérification immatriculation d\'entreprise à Guangzhou.', isDone: true, isCurrent: false, category: 'sourcing', responsibleParty: 'diallo_ai' },
            { id: 'chk-2', stepNumber: 2, title: 'Identité et solvabilité de l\'acheteur vérifiées', description: 'RCCM et agrément ministère de la Santé Guinéen validés.', isDone: true, isCurrent: false, category: 'verification', responsibleParty: 'diallo_ai' },
            { id: 'chk-3', stepNumber: 3, title: 'Spécifications techniques du produit confirmées', description: 'Carton couché 350g, vernis UV anti-humidité, format 120x60x40mm.', isDone: true, isCurrent: false, category: 'sourcing', responsibleParty: 'buyer' },
            { id: 'chk-4', stepNumber: 4, title: 'Échantillon physique reçu & validé (BAT)', description: 'Test de résistance à la chaleur et validation graphisme.', isDone: true, isCurrent: false, category: 'verification', responsibleParty: 'buyer' },
            { id: 'chk-5', stepNumber: 5, title: 'Prix unitaire et conditions négociés', description: 'Offre finale arrêtée à 0.35€/unité (remise de 12.5% sur volume).', isDone: true, isCurrent: false, category: 'negociation', responsibleParty: 'buyer' },
            { id: 'chk-6', stepNumber: 6, title: 'Incoterm CIF et emballage export définis', description: 'Palettes cerclées avec film étanche tropicalisé.', isDone: true, isCurrent: false, category: 'logistique', responsibleParty: 'seller' },
            { id: 'chk-7', stepNumber: 7, title: 'Facture Pro Forma & Contrat commercial validés', description: 'Pro Forma émise par SinoPack avec conditions 30/70.', isDone: false, isCurrent: true, category: 'contrat', responsibleParty: 'diallo_ai', criticalDocNeeded: 'Facture Pro Forma v2 signée' },
            { id: 'chk-8', stepNumber: 8, title: 'Moyen de paiement sécurisé activé (Escrow)', description: 'Acompte de 30% séquestré jusqu\'à avis d\'embarquement.', isDone: false, isCurrent: false, category: 'paiement', responsibleParty: 'buyer', riskNote: 'Ne pas libérer le solde avant copie du Connaissement maritime (B/L).' },
            { id: 'chk-9', stepNumber: 9, title: 'Inspection qualité avant mise en conteneur (Live)', description: 'Session vidéo Live usine pour contrôler le lot complet.', isDone: false, isCurrent: false, category: 'verification', responsibleParty: 'seller' },
            { id: 'chk-10', stepNumber: 10, title: 'Documents export émis (Packing list, B/L, BIVAC)', description: 'Certificat d\'origine Chine et attestation de vérification.', isDone: false, isCurrent: false, category: 'douane', responsibleParty: 'seller' },
            { id: 'chk-11', stepNumber: 11, title: 'Transport maritime & Suivi conteneur', description: 'Prise en charge par Syli Logistics & Transit (28 jours de mer).', isDone: false, isCurrent: false, category: 'logistique', responsibleParty: 'forwarder' },
            { id: 'chk-12', stepNumber: 12, title: 'Dédouanement au Port de Conakry', description: 'Apurement déclaration en douane et paiement des taxes.', isDone: false, isCurrent: false, category: 'douane', responsibleParty: 'forwarder' },
            { id: 'chk-13', stepNumber: 13, title: 'Livraison sur site & Confirmation de réception', description: 'Contrôle quantitatif, libération solde et évaluation.', isDone: false, isCurrent: false, category: 'reception', responsibleParty: 'buyer' }
        ],
        offersHistory: [
            {
                id: 'off-v1',
                versionNumber: 1,
                emitter: 'seller',
                emitterName: 'SinoPack Industrial Ltd',
                productId: 'prod-carton-pharma-350g',
                productTitle: 'Boîtes Cartons Vernis UV BPF',
                quantity: 10000,
                unit: 'boîtes',
                unitPrice: 0.40,
                totalPrice: 4000,
                currency: 'EUR',
                availability: 'Sous 15 jours après BAT',
                leadTimeDays: 30,
                incoterm: 'FOB',
                incotermLocation: 'Port de Nansha (Guangzhou)',
                transportMode: 'sea_fcl',
                validityDeadline: '30/03/2026',
                specialConditions: ['Paiement 50% commande / 50% expédition', 'Graphisme fourni par l\'acheteur'],
                attachedDocuments: [
                    { name: 'Catalogue Matières SinoPack.pdf', type: 'PDF', isVerified: true },
                    { name: 'Certificat ISO 9001.pdf', type: 'PDF', isVerified: true }
                ],
                notes: 'Proposition standard selon catalogue sans personnalisation poussée.',
                createdAt: '12/02/2026',
                status: 'countered'
            },
            {
                id: 'off-v2',
                versionNumber: 2,
                emitter: 'buyer',
                emitterName: 'Pharmacie Centrale Guinéenne (via Diallo OS)',
                productId: 'prod-carton-pharma-350g',
                productTitle: 'Boîtes Cartons Vernis UV BPF',
                quantity: 10000,
                unit: 'boîtes',
                unitPrice: 0.33,
                totalPrice: 3300,
                currency: 'EUR',
                availability: 'Sous 12 jours après BAT',
                leadTimeDays: 24,
                incoterm: 'CIF',
                incotermLocation: 'Port Autonome de Conakry',
                transportMode: 'sea_fcl',
                validityDeadline: '20/03/2026',
                specialConditions: ['Paiement 30% commande / 70% Connaissement', 'Fourniture de 200 échantillons préalables'],
                attachedDocuments: [
                    { name: 'Cahier des charges emballage Guinée.pdf', type: 'PDF', isVerified: true }
                ],
                notes: 'Contre-proposition optimisée avec assistance tactique de Diallo OS.',
                createdAt: '15/02/2026',
                status: 'countered'
            },
            {
                id: 'off-v3',
                versionNumber: 3,
                emitter: 'seller',
                emitterName: 'SinoPack Industrial Ltd',
                productId: 'prod-carton-pharma-350g',
                productTitle: 'Boîtes Cartons Vernis UV BPF',
                quantity: 10000,
                unit: 'boîtes',
                unitPrice: 0.35,
                totalPrice: 3500,
                currency: 'EUR',
                availability: 'Sous 14 jours après BAT',
                leadTimeDays: 24,
                incoterm: 'CIF',
                incotermLocation: 'Port Autonome de Conakry',
                transportMode: 'sea_fcl',
                validityDeadline: '15/04/2026',
                specialConditions: ['Paiement 30% acompte / 70% BL', 'Emballage tropicalisé inclus sans surcoût', 'Live inspection usine autorisée'],
                attachedDocuments: [
                    { name: 'Facture Pro Forma v3 SinoPack.pdf', type: 'PDF', isVerified: true },
                    { name: 'Fiche Technique Carton BPF.pdf', type: 'PDF', isVerified: true }
                ],
                notes: 'Accord de compromis final validé par les deux directions.',
                createdAt: '18/02/2026',
                status: 'accepted'
            }
        ],
        landedCostBreakdown: {
            productCost: { amount: 3500, state: 'confirmed' },
            packagingCost: { amount: 0, state: 'confirmed' }, // Inclus dans le CIF
            transportFreightCost: { amount: 620, state: 'confirmed' },
            insuranceCost: { amount: 85, state: 'confirmed' },
            forwarderFee: { amount: 250, state: 'estimated' },
            customsDutyCost: { amount: 480, state: 'estimated' },
            localTaxesCost: { amount: 290, state: 'estimated' },
            warehousingCost: { amount: 120, state: 'estimated' },
            localDeliveryCost: { amount: 95, state: 'estimated' },
            miscFees: { amount: 50, state: 'estimated' },
            totalLandedCost: 5490,
            currency: 'EUR'
        },
        marginSimulation: {
            resalePricePerUnit: 12500, // GNF par boîte
            resaleCurrency: 'GNF',
            projectedGrossRevenue: 125000000, // 125M GNF
            grossMarginAmount: 73119500, // ~73.1M GNF
            grossMarginPercentage: 58.5, // 58.5%
            breakEvenUnits: 4150
        },
        paymentTermsDescription: '30% Acompte à la commande via séquestre partenaire • 70% Solde après émission et vérification du connaissement maritime (B/L)',
        paymentMilestones: [
            {
                id: 'pay-ms-1',
                label: 'Acompte Initial (30% Commande)',
                percentage: 30,
                amount: 1050,
                currency: 'EUR',
                triggerCondition: 'order_signing',
                status: 'pending',
                paymentMethod: 'escrow_partner',
                proofReceiptStatus: 'none'
            },
            {
                id: 'pay-ms-2',
                label: 'Solde Final (70% Embarquement & BL)',
                percentage: 70,
                amount: 2450,
                currency: 'EUR',
                triggerCondition: 'bl_copy_issued',
                status: 'pending',
                paymentMethod: 'escrow_partner',
                proofReceiptStatus: 'none'
            }
        ],
        escrowPartnerName: 'TrustTrade Escrow International (Agréé CEDEAO / Swift)',
        logisticsProviderId: 'fwd-syli-transit',
        logisticsProviderName: 'Syli Logistics & Transit Portuaire',
        transportMode: 'sea_fcl',
        trackingNumber: 'SYLI-CN-GN-2026-9912',
        trackingEvents: [
            {
                id: 'tr-ev-1',
                timestamp: '18/02/2026 10:30',
                locationName: 'Guangzhou, Chine',
                countryCode: 'CN',
                coordinates: { lat: 23.1291, lng: 113.2644 },
                statusText: 'Contrat logistique réservé',
                detail: 'Réservation conteneur 20ft effectuée auprès de la compagnie maritime.',
                carrierName: 'Cosco Shipping / Syli Transit',
                carrierTrackingCode: 'COSU6281920'
            }
        ],
        sampleRequest: {
            id: 'smp-101',
            dossierId: 'dossier-pack-pharma-01',
            productTitle: 'Échantillon Boîtes Cartons Pharma (50 unités)',
            quantityRequested: 50,
            unit: 'unités',
            sampleFee: 0,
            shippingFee: 65,
            currency: 'EUR',
            shippingAddress: 'Pharmacie Centrale, Immeuble Almamya, Conakry, Guinée',
            trackingNumber: 'DHL-EXP-8829104',
            status: 'evaluated',
            buyerEvaluation: {
                rating: 5,
                decision: 'accepted',
                comments: 'Échantillon conforme aux exigences de rigidité et tenue de l\'encre UV sous forte humidité.',
                photos: ['https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400']
            },
            requestedAt: '05/02/2026'
        },
        liveInspection: {
            id: 'live-insp-pharma-1',
            dossierId: 'dossier-pack-pharma-01',
            productTitle: 'Inspection en Direct Lot Emballage 10 000 pcs',
            scheduledAt: 'Demain à 11:00 GMT (19:00 Heure de Guangzhou)',
            durationMinutes: 30,
            sellerName: 'Lin Chen (Directeur Qualité SinoPack)',
            buyerName: 'Dr. Mamadouba Camara (Directeur Achats)',
            status: 'scheduled',
            inspectionItems: [
                { label: 'Contrôle visuel de l\'impression UV & logo', checked: true, notes: 'Finition brillante conforme' },
                { label: 'Mesure de l\'épaisseur du carton (Micromètre)', checked: false, notes: 'À vérifier en direct avec jauge' },
                { label: 'Vérification du collage des pattes latérales', checked: false },
                { label: 'Comptage aléatoire d\'un carton d\'emballage master (500 pcs)', checked: false },
                { label: 'Validation des palettes filmées avec sachets déshydratants', checked: false }
            ],
            aiGeneratedRecap: 'Session planifiée : Diallo OS transcrira en direct le dialogue Mandarin-Français et archivera les captures HD dans le dossier.'
        },
        vaultDocuments: [
            {
                id: 'doc-rccm-pharma',
                title: 'Registre de Commerce & Crédit Mobilier (Acheteur)',
                docType: 'rccm',
                fileName: 'RCCM_GN_CKY_2019_B_4182.pdf',
                fileSize: '1.4 MB',
                uploadedAt: '10/02/2026',
                uploadedBy: 'Acheteur',
                isConfidential: true,
                verificationStatus: 'verified',
                verificationDetails: 'Vérifié par Maître Diallo auprès du Greffe du Tribunal de Commerce de Conakry.'
            },
            {
                id: 'doc-license-sinopack',
                title: 'Licence d\'Exportation Chinoise & Certificat BPF',
                docType: 'export_license',
                fileName: 'China_Trade_License_91440101MA59X.pdf',
                fileSize: '2.8 MB',
                uploadedAt: '12/02/2026',
                uploadedBy: 'Vendeur',
                isConfidential: false,
                verificationStatus: 'verified',
                verificationDetails: 'Certificat vérifié auprès du Ministère Chinois du Commerce (MOFCOM).'
            },
            {
                id: 'doc-proforma-sinopack',
                title: 'Facture Pro Forma Officielle SinoPack v3',
                docType: 'proforma',
                fileName: 'ProForma_SINOPACK_2026_042_CIF.pdf',
                fileSize: '850 KB',
                uploadedAt: '18/02/2026',
                uploadedBy: 'Vendeur',
                isConfidential: true,
                verificationStatus: 'verified',
                verificationDetails: 'Montant 3 500.00 EUR CIF Conakry validé.'
            }
        ],
        contractText: `CONTRAT DE VENTE COMMERCIALE INTERNATIONALE
Référence : DOS-2026-GN-CN-042

ENTRE LES SOUSSIGNÉS :
1. La société SINO PACK INDUSTRIAL LTD, société de droit chinois, sise à Guangzhou, Chine, représentée par M. Lin Chen, ci-après "Le Vendeur".
2. La PHARMACIE CENTRALE & DISTRIBUTION GUINÉENNE SARL, société de droit guinéen, sise à Conakry, Guinée, représentée par Dr. Mamadouba Camara, ci-après "L'Acheteur".

ARTICLE 1 - OBJET ET QUANTITÉ
Le Vendeur s'engage à fabriquer, emballer et livrer 10 000 boîtes cartons conformes aux normes pharmaceutiques BPF avec vernis UV tropicalisé.

ARTICLE 2 - PRIX ET INCOTERM
Le prix unitaire est fixé à 0.35 EUR (Trente-cinq centimes d'euro) par unité, soit un montant total de 3 500.00 EUR CIF Port Autonome de Conakry (Incoterms 2020).

ARTICLE 3 - MODALITÉS DE PAIEMENT
- 30% d'acompte (1 050.00 EUR) séquestrés sur TrustTrade Escrow à la signature du présent contrat.
- 70% de solde (2 450.00 EUR) libérés au Vendeur contre remise de la copie certifiée du Connaissement Maritime (Bill of Lading).

ARTICLE 4 - DROIT APPLICABLE ET RÈGLEMENT DES DIFFÉRENDS
Le présent contrat est régi par la Convention des Nations Unies sur les contrats de vente internationale de marchandises (CVIM). En cas de litige, les parties privilégieront la médiation structurée sur la plateforme LE MONDE À VOUS assistée par le Conseil des Experts.`,
        isSignedByBuyer: true,
        buyerSignatureData: {
            signerName: 'Dr. Mamadouba Camara',
            timestamp: '19/02/2026 14:15 GMT',
            integrityHash: 'SHA256:7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069'
        },
        isSignedBySeller: true,
        sellerSignatureData: {
            signerName: 'Lin Chen',
            timestamp: '19/02/2026 16:30 GMT',
            integrityHash: 'SHA256:9a4b2c18d9f1092e448bca612040182ecbd991823abce12837f619001928374a'
        },
        assignedExpertIds: ['1', '2', '10', 'fwd-syli-transit'],
        internalNotes: [
            '12/02/2026 : Contact initial suite à l\'appel d\'offres RFQ.',
            '15/02/2026 : Négociation du prix unitaire avec l\'assistant Diallo (réduction de 0.40€ à 0.35€).',
            '18/02/2026 : Échantillon physique testé et approuvé en laboratoire.',
            '19/02/2026 : Signature électronique tripartite du contrat commercial.'
        ],
        createdAt: '12/02/2026',
        updatedAt: 'Hier à 16:40'
    },
    {
        id: 'dossier-cafe-export-02',
        codeRef: 'DOS-2026-GN-FR-019',
        title: 'Exportation 2 Tonnes Café Arabica Bio Ziama (Guinée → France)',
        tradeType: 'export',
        dimension: 'B2B',
        buyerId: 'u-roast-paris',
        buyerName: 'Torréfaction Artisanale des Grands Boulevards',
        buyerCountry: 'France',
        buyerFlag: '🇫🇷',
        buyerVerificationTier: 'history_star',
        sellerId: 'u-ziama-trade',
        sellerName: 'Coopérative Café & Cacao Ziama',
        sellerCountry: 'Guinée',
        sellerFlag: '🇬🇳',
        sellerVerificationTier: 'trade_docs_verified',
        productId: 'prod-cafe-ziama-2026',
        productTitle: 'Café Arabica Bio Ziama - Lot Export 2026',
        productImageUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&fit=crop',
        productCategory: 'Agroalimentaire & Matières Premières',
        quantity: 2000,
        unit: 'kg (Sacs GrainPro 60kg)',
        unitPrice: 4.50,
        totalAmount: 9000,
        currency: 'EUR',
        buyerCurrency: 'EUR',
        exchangeRateUsed: 1.0,
        originCountry: 'Guinée',
        originCity: 'Macenta / Port de Conakry',
        destinationCountry: 'France',
        destinationCity: 'Le Havre / Paris',
        status: 'en_transit',
        statusLabel: 'En transit maritime (Navire MSC Arica)',
        currentStepIndex: 12,
        totalStepsCount: 15,
        agreedIncoterm: 'CIF Le Havre',
        leadTimeDays: 28,
        checklist: [
            { id: 'chk-c-1', stepNumber: 1, title: 'Origine et certification bio contrôlées', description: 'Certificat Ecocert et traçabilité coopérative.', isDone: true, isCurrent: false, category: 'sourcing', responsibleParty: 'diallo_ai' },
            { id: 'chk-c-2', stepNumber: 2, title: 'Dégustation et analyse taux d\'humidité (<11.5%)', description: 'Score cupping SCAA de 86.5/100.', isDone: true, isCurrent: false, category: 'verification', responsibleParty: 'buyer' },
            { id: 'chk-c-3', stepNumber: 3, title: 'Contrat d\'achat FOB/CIF validé', description: 'Incoterm CIF Le Havre à 4.50€/kg.', isDone: true, isCurrent: false, category: 'contrat', responsibleParty: 'seller' },
            { id: 'chk-c-4', stepNumber: 4, title: 'Acompte 30% reçu sur compte séquestre', description: '2 700€ confirmés par TrustTrade Escrow.', isDone: true, isCurrent: false, category: 'paiement', responsibleParty: 'buyer' },
            { id: 'chk-c-5', stepNumber: 5, title: 'Conditionnement en sacs hermétiques GrainPro', description: 'Protection contre l\'oxydation marine.', isDone: true, isCurrent: false, category: 'logistique', responsibleParty: 'seller' },
            { id: 'chk-c-6', stepNumber: 6, title: 'Contrôle phytosanitaire & Certificat d\'origine', description: 'Délivré par le Ministère Guinéen de l\'Agriculture.', isDone: true, isCurrent: false, category: 'douane', responsibleParty: 'seller' },
            { id: 'chk-c-7', stepNumber: 7, title: 'Embarquement au Port de Conakry', description: 'Connaissement maritime émis par MSC.', isDone: true, isCurrent: false, category: 'logistique', responsibleParty: 'forwarder' },
            { id: 'chk-c-8', stepNumber: 8, title: 'Transit atlantique vers Le Havre', description: 'Arrivée estimée dans 9 jours.', isDone: false, isCurrent: true, category: 'logistique', responsibleParty: 'forwarder' }
        ],
        offersHistory: [],
        landedCostBreakdown: {
            productCost: { amount: 9000, state: 'confirmed' },
            packagingCost: { amount: 240, state: 'confirmed' },
            transportFreightCost: { amount: 1450, state: 'confirmed' },
            insuranceCost: { amount: 120, state: 'confirmed' },
            forwarderFee: { amount: 350, state: 'confirmed' },
            customsDutyCost: { amount: 0, state: 'confirmed' }, // Exonéré UE pour café vert brut
            localTaxesCost: { amount: 495, state: 'estimated' }, // TVA 5.5% France
            warehousingCost: { amount: 150, state: 'estimated' },
            localDeliveryCost: { amount: 220, state: 'estimated' },
            miscFees: { amount: 80, state: 'estimated' },
            totalLandedCost: 12105,
            currency: 'EUR'
        },
        paymentTermsDescription: '30% à la réservation • 70% à l\'arrivée au Havre',
        paymentMilestones: [
            {
                id: 'pay-ms-c1',
                label: 'Acompte Réservation Récolte (30%)',
                percentage: 30,
                amount: 2700,
                currency: 'EUR',
                triggerCondition: 'order_signing',
                status: 'escrow_held',
                paymentMethod: 'wire_transfer',
                proofReceiptStatus: 'verified_by_partner',
                paidAt: '02/02/2026'
            },
            {
                id: 'pay-ms-c2',
                label: 'Solde Déchargement (70%)',
                percentage: 70,
                amount: 6300,
                currency: 'EUR',
                triggerCondition: 'final_delivery',
                status: 'pending',
                paymentMethod: 'wire_transfer',
                proofReceiptStatus: 'none'
            }
        ],
        transportMode: 'sea_fcl',
        trackingNumber: 'MSC-CONAKRY-HAVRE-2026',
        trackingEvents: [
            {
                id: 'ev-c-1',
                timestamp: '08/02/2026 14:00',
                locationName: 'Port Autonome de Conakry',
                countryCode: 'GN',
                coordinates: { lat: 9.5092, lng: -13.7122 },
                statusText: 'Embarquement conteneur',
                detail: 'Conteneur chargé à bord du navire MSC Arica.',
                carrierName: 'MSC Mediterranean Shipping',
                carrierTrackingCode: 'MSCU7182910'
            },
            {
                id: 'ev-c-2',
                timestamp: '16/02/2026 08:30',
                locationName: 'Las Palmas (Canaries)',
                countryCode: 'ES',
                coordinates: { lat: 28.1235, lng: -15.4363 },
                statusText: 'Escale technique & ravitaillement',
                detail: 'En route vers le Golfe de Gascogne et Le Havre.',
                carrierName: 'MSC Mediterranean Shipping',
                carrierTrackingCode: 'MSCU7182910'
            }
        ],
        vaultDocuments: [
            {
                id: 'doc-cert-bio',
                title: 'Certificat Bio Ecocert Ziama 2026',
                docType: 'iso_cert',
                fileName: 'Certificat_Bio_Ziama_2026.pdf',
                fileSize: '1.9 MB',
                uploadedAt: '01/02/2026',
                uploadedBy: 'Vendeur',
                isConfidential: false,
                verificationStatus: 'verified'
            },
            {
                id: 'doc-bl-msc',
                title: 'Connaissement Maritime MSC Original (B/L)',
                docType: 'bill_of_lading',
                fileName: 'MSC_BillOfLading_7182910.pdf',
                fileSize: '3.1 MB',
                uploadedAt: '08/02/2026',
                uploadedBy: 'Transitaire',
                isConfidential: true,
                verificationStatus: 'verified'
            }
        ],
        isSignedByBuyer: true,
        isSignedBySeller: true,
        assignedExpertIds: ['1', '2', 'fwd-syli-transit'],
        internalNotes: ['Suivi satellite activé sur navire MSC.'],
        createdAt: '01/02/2026',
        updatedAt: 'Aujourd\'hui 09:12'
    }
];

export const MOCK_SUPPLIER_SCORECARDS: SupplierScorecard[] = [
    {
        supplierId: 'u-pack-global',
        supplierName: 'SinoPack Industrial Ltd',
        country: 'Chine',
        flag: '🇨🇳',
        totalOrdersCount: 4,
        totalVolumeAmount: 18400,
        currency: 'EUR',
        averageLeadTimeDays: 22,
        conformityRatePercentage: 99.2,
        incidentsCount: 0,
        priceStabilityScore: 94,
        relationshipStartDate: 'Octobre 2024',
        favoriteProducts: ['Boîtes Cartons UV BPF', 'Flacons PEHD 100ml'],
        proactiveRestockAlert: {
            productTitle: 'Boîtes Cartons Vernis UV BPF',
            suggestedRestockDate: 'Dans 45 jours',
            reason: 'Votre rythme d\'utilisation actuel (800 boîtes/semaine) épuisera votre stock de sécurité fin Avril.'
        }
    },
    {
        supplierId: 'u-ziama-trade',
        supplierName: 'Coopérative Café Ziama',
        country: 'Guinée',
        flag: '🇬🇳',
        totalOrdersCount: 6,
        totalVolumeAmount: 42000,
        currency: 'EUR',
        averageLeadTimeDays: 14,
        conformityRatePercentage: 98.5,
        incidentsCount: 0,
        priceStabilityScore: 96,
        relationshipStartDate: 'Mars 2024',
        favoriteProducts: ['Café Arabica Bio', 'Cacao Fin Fèves Brutes'],
        proactiveRestockAlert: {
            productTitle: 'Café Arabica Bio Ziama',
            suggestedRestockDate: 'Avant le 15 Mai (Fin de récolte)',
            reason: 'La récolte 2026 touche à sa fin : bloquer 3 tonnes supplémentaires permettra de garantir le prix FOB préférentiel.'
        }
    }
];

export const MOCK_CLIENT_RELATIONSHIPS: ClientRelationshipCard[] = [
    {
        clientId: 'u-pharma-guinee',
        clientName: 'Pharmacie Centrale Guinéenne',
        country: 'Guinée',
        flag: '🇬🇳',
        totalPurchasesAmount: 14200,
        ordersCount: 3,
        lastOrderDate: '18/02/2026',
        buyingFrequencyMonths: 3,
        preferredPaymentMethod: 'TrustTrade Escrow (30/70)',
        proactiveSalesReminder: {
            dueDate: '10 Avril 2026',
            suggestedPitch: 'Bonjour Dr. Camara, nous préparons notre production de Juin pour l\'Afrique de l\'Ouest. Souhaitez-vous regrouper votre prochaine commande d\'emballages pour économiser 8% de fret maritime ?',
            recommendedLot: 'Lot 15 000 boîtes avec remise groupage conteneur'
        }
    },
    {
        clientId: 'u-roast-paris',
        clientName: 'Torréfaction Grands Boulevards',
        country: 'France',
        flag: '🇫🇷',
        totalPurchasesAmount: 26000,
        ordersCount: 5,
        lastOrderDate: '01/02/2026',
        buyingFrequencyMonths: 2,
        preferredPaymentMethod: 'Virement bancaire SEPA',
        proactiveSalesReminder: {
            dueDate: '25 Mars 2026',
            suggestedPitch: 'Proposer l\'échantillon exclusif du microlot "Cascara & Miel Sauvage" réservé aux torréfacteurs fidèles.',
            recommendedLot: 'Microlot 500kg Café de Forêt'
        }
    }
];

export const MOCK_TRADE_SECTORS: TradeSector[] = [
    { id: 'sec-agri', name: 'Agriculture & Élevage', icon: 'Sprout', description: 'Semences, tracteurs, fertilisants bio et matières premières agricoles.', standsCount: 48, corridorsActive: ['Guinée ↔ Chine', 'Afrique de l\'Ouest', 'Afrique ↔ Europe'] },
    { id: 'sec-agro', name: 'Agroalimentaire & Transformation', icon: 'Apple', description: 'Café, cacao, huiles, jus tropicaux, minoteries et emballages alimentaires.', standsCount: 64, corridorsActive: ['Afrique ↔ Europe', 'Afrique ↔ Turquie', 'Guinée ↔ France'] },
    { id: 'sec-sante', name: 'Santé & Matériel Médical', icon: 'HeartPulse', description: 'Équipements hospitaliers, réactifs de diagnostic, consommables médicaux et stérilisation.', standsCount: 32, corridorsActive: ['Afrique ↔ Europe', 'Guinée ↔ Chine', 'Afrique ↔ Turquie'] },
    { id: 'sec-pharma', name: 'Pharmacie & Conditionnement', icon: 'Pill', description: 'Médicaments génériques essentiels, principes actifs, flaconnage PEHD et boîtes certifiées BPF.', standsCount: 29, corridorsActive: ['Guinée ↔ Chine', 'Afrique ↔ Europe', 'Afrique ↔ Inde'] },
    { id: 'sec-tech', name: 'Technologie & Électronique', icon: 'Cpu', description: 'Serveurs, terminaux solaires, IoT agricole, ordinateurs industriels et télécoms.', standsCount: 52, corridorsActive: ['Guinée ↔ Chine', 'Afrique ↔ Europe', 'Asie ↔ Afrique'] },
    { id: 'sec-indus', name: 'Industrie & Machines-Outils', icon: 'Factory', description: 'Lignes de fabrication, broyeurs miniers, presses à injection et générateurs lourds.', standsCount: 41, corridorsActive: ['Guinée ↔ Chine', 'Afrique ↔ Turquie', 'Afrique ↔ Europe'] },
    { id: 'sec-textile', name: 'Textile, Habillement & Cuir', icon: 'Shirt', description: 'Tissus en pagne tissé Leppi/Indigo, coton biologique, uniformes pro et confections.', standsCount: 37, corridorsActive: ['Afrique de l\'Ouest', 'Guinée ↔ France', 'Afrique ↔ Turquie'] },
    { id: 'sec-btp', name: 'Construction, BTP & Matériaux', icon: 'HardHat', description: 'Cimenterie, aciers profilés, menuiserie aluminium, carrelages et engins de terrassement.', standsCount: 45, corridorsActive: ['Afrique ↔ Turquie', 'Guinée ↔ Chine', 'Afrique ↔ Europe'] },
    { id: 'sec-energie', name: 'Énergie & Solaire Renouvelable', icon: 'SunMedium', description: 'Panneaux photovoltaïques bifaciaux, onduleurs hybrides, batteries LiFePO4 et micro-réseaux.', standsCount: 39, corridorsActive: ['Guinée ↔ Chine', 'Afrique ↔ Europe', 'Afrique de l\'Ouest'] },
    { id: 'sec-transport', name: 'Transport, Logistique & Fret', icon: 'Truck', description: 'Conteneurs maritimes, flottes de camions bennes, transitaires douaniers et fret aérien.', standsCount: 33, corridorsActive: ['Guinée ↔ Chine', 'Afrique ↔ Europe', 'Afrique ↔ Turquie'] },
    { id: 'sec-cosmetique', name: 'Cosmétique & Soins Naturels', icon: 'Sparkles', description: 'Beurre de karité bio brut, huiles de baobab et moringa, savons artisanaux certifiés.', standsCount: 26, corridorsActive: ['Afrique ↔ Europe', 'Guinée ↔ France', 'Afrique ↔ USA'] },
    { id: 'sec-artisanat', name: 'Artisanat d\'Art & Décoration', icon: 'Palette', description: 'Sculptures sur bois précieux, poteries, cuir tanné végétal et vannerie ethnique.', standsCount: 22, corridorsActive: ['Afrique ↔ Europe', 'Guinée ↔ France', 'Afrique de l\'Ouest'] },
    { id: 'sec-education', name: 'Éducation & Formation Pro', icon: 'GraduationCap', description: 'Kits didactiques STEM, plateformes LMS pour entreprises et licences universitaires.', standsCount: 18, corridorsActive: ['Afrique ↔ Europe', 'Guinée ↔ France'] },
    { id: 'sec-services', name: 'Services B2B & Conseil Juridique', icon: 'Briefcase', description: 'Audits douaniers, conformité OHADA, certification ISO et études d\'impact.', standsCount: 30, corridorsActive: ['Afrique ↔ Europe', 'Afrique de l\'Ouest', 'Guinée ↔ France'] },
    { id: 'sec-tourisme', name: 'Tourisme, Hôtellerie & Événements', icon: 'Compass', description: 'Écolodges d\'affaires, réceptifs aéroportuaires, congrès et voyages de prospection.', standsCount: 15, corridorsActive: ['Afrique ↔ Europe', 'Guinée ↔ France'] },
    { id: 'sec-immo', name: 'Immobilier Professionnel & Parcs', icon: 'Building', description: 'Entrepôts frigorifiques sous douane, zones franches industrielles et bureaux partagés.', standsCount: 21, corridorsActive: ['Afrique de l\'Ouest', 'Guinée ↔ Chine', 'Afrique ↔ Turquie'] }
];

export const MOCK_TRADE_CORRIDORS: TradeCorridor[] = [
    { id: 'cor-gn-cn', name: 'Guinée ↔ Chine', flags: '🇬🇳 🇨🇳', description: 'Corridor d\'équipements industriels, panneaux solaires, emballages et export bauxite/minerais.', topCommodities: ['Machines de conditionnement', 'Solaire', 'Emballages BPF', 'Mines'], activeExhibitors: 142, annualVolumeEstimate: '420M USD' },
    { id: 'cor-af-eu', name: 'Afrique ↔ Europe', flags: '🌍 🇪🇺', description: 'Export de matières premières certifiées bio (café, cacao, fruits) et import de produits médicaux.', topCommodities: ['Café arabica', 'Dispositifs médicaux', 'Cacao fin', 'Agro-matériel'], activeExhibitors: 188, annualVolumeEstimate: '780M EUR' },
    { id: 'cor-af-tr', name: 'Afrique ↔ Turquie', flags: '🌍 🇹🇷', description: 'Corridor dynamique de matériaux de construction BTP, textile confection et électroménager.', topCommodities: ['Aciers & Ciment', 'Textile industriel', 'Groupes électrogènes'], activeExhibitors: 95, annualVolumeEstimate: '310M USD' },
    { id: 'cor-gn-fr', name: 'Guinée ↔ France', flags: '🇬🇳 🇫🇷', description: 'Relations d\'affaires historiques : cosmétique bio, conseil juridique, équipement agricole et formation.', topCommodities: ['Karité & Huiles', 'Expertise technique', 'Matériel agricole'], activeExhibitors: 110, annualVolumeEstimate: '260M EUR' },
    { id: 'cor-cedeao', name: 'Afrique de l\'Ouest (CEDEAO / ZLECAF)', flags: '🇬🇳 🇸🇳 🇨🇮', description: 'Commerce intra-africain dédouané ZLECAF : céréales, emballages plastiques recyclés et logistique.', topCommodities: ['Céréales locales', 'Sel iodé', 'Produits maraîchers', 'Fret routier'], activeExhibitors: 165, annualVolumeEstimate: '540M USD' }
];

export const MOCK_FAIR_EVENTS: FairEvent[] = [
    {
        id: 'event-africa-health-2026',
        title: 'Africa Health Business Week 2026',
        subtitle: 'Grand Salon International des Équipements Médicaux & Solutions Pharmaceutiques Africaines',
        bannerUrl: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=1200&fit=crop',
        startDate: '10 Mai 2026',
        endDate: '15 Mai 2026',
        durationDays: 5,
        sectors: ['Santé & Matériel Médical', 'Pharmacie & Conditionnement', 'Technologie & Électronique'],
        targetCorridors: ['Guinée ↔ Chine', 'Afrique ↔ Europe', 'Afrique ↔ Inde'],
        exhibitorsCount: 68,
        isOngoing: true,
        isVirtualOnly: false,
        liveDemosCount: 14,
        conferences: [
            { id: 'conf-1', time: '10:00 GMT', title: 'Souveraineté pharmaceutique en Afrique de l\'Ouest : normes BPF et partenariats Sud-Sud', speaker: 'Dr. Aïssatou Diallo', speakerTitle: 'Directrice Régionale OMS / Pharmacopée', isLive: true },
            { id: 'conf-2', time: '14:30 GMT', title: 'Financer l\'achat de scanners et imagerie médicale lourde via crédit-bail export', speaker: 'M. Jean-Paul Moreau', speakerTitle: 'VP Financement Santé, BPI International', isLive: false }
        ]
    },
    {
        id: 'event-china-africa-tech-2026',
        title: 'China-Africa Tech & Machinery Expo',
        subtitle: 'Pavillon Virtuel des Lignes de Production Industrielles, Agro-Transformation et Énergie',
        bannerUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&fit=crop',
        startDate: '01 Juin 2026',
        endDate: '07 Juin 2026',
        durationDays: 7,
        sectors: ['Industrie & Machines-Outils', 'Énergie & Solaire Renouvelable', 'Agriculture & Élevage'],
        targetCorridors: ['Guinée ↔ Chine', 'Afrique de l\'Ouest'],
        exhibitorsCount: 94,
        isOngoing: false,
        isVirtualOnly: true,
        liveDemosCount: 22,
        conferences: [
            { id: 'conf-3', time: '09:00 GMT', title: 'Automatisation des moulins et ensacheuses pour le riz et manioc local', speaker: 'Eng. Chen Wei', speakerTitle: 'Chief Machinery Officer, Canton MachCorp', isLive: false }
        ]
    }
];

export const MOCK_VIRTUAL_FAIR_BOOTHS: VirtualTradeFairBooth[] = [
    {
        id: 'booth-1-sinopack',
        fairName: 'Salon Mondial B2B Export & Machines 2026',
        companyName: 'SinoPack Industrial Ltd',
        logoUrl: 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=200',
        bannerUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800&fit=crop',
        country: 'Chine',
        countryFlag: '🇨🇳',
        city: 'Guangzhou',
        pavilionSector: 'Pharmacie & Conditionnement',
        corridor: 'Guinée ↔ Chine',
        isLiveNow: true,
        boothRepresentativeName: 'Lin Chen',
        representativeRole: 'Directeur Commercial Export Afrique',
        description: 'Fabricant certifié ISO 9001 et BPF spécialisé dans les emballages pharmaceutiques étanches, blisters aluminium, flacons PEHD et étiquettes avec vernis tropicalisé.',
        teamMembers: [
            { name: 'Lin Chen', role: 'Directeur Export (Anglais/Français)' },
            { name: 'Dr. Mei Wang', role: 'Responsable Assurance Qualité BPF' }
        ],
        featuredProducts: PRODUCTS.filter(p => p.dimensionType === 'B2B'),
        servicesOffered: ['Personnalisation graphique multilingue', 'Inspection vidéo en usine 4K', 'Assistance au dédouanement CIF Conakry'],
        catalogueDownloadUrl: '#',
        videoShowcaseUrl: 'https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4',
        reelsUrls: ['reel-pkg-01', 'reel-pkg-02'],
        instantChatAvailable: true,
        verifiedCertifications: [
            { code: 'ISO-9001', label: 'Management Qualité Certifié', issuer: 'SGS International', isVerified: true },
            { code: 'BPF-GMP', label: 'Bonnes Pratiques de Fabrication Pharma', issuer: 'NMPA / WHO Compliant', isVerified: true },
            { code: 'MOFCOM-EXP', label: 'Licence Officielle Export Chine', issuer: 'Ministère du Commerce', isVerified: true }
        ],
        contactPhone: '+86 20 8899 4432',
        contactEmail: 'export@sinopack-ind.cn',
        spokenLanguages: ['Français', 'Anglais', 'Mandarin'],
        deliveryRegionsServed: ['Afrique de l\'Ouest (Conakry, Dakar, Abidjan)', 'Europe', 'Moyen-Orient'],
        minOrderQuantityGuideline: '5 000 boîtes personnalisées',
        isPlatformVerified: true
    },
    {
        id: 'booth-2-ziama',
        fairName: 'Salon Mondial B2B Export & Machines 2026',
        companyName: 'Coopérative Café & Cacao Ziama',
        logoUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        bannerUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&fit=crop',
        country: 'Guinée',
        countryFlag: '🇬🇳',
        city: 'Macenta & Conakry',
        pavilionSector: 'Agroalimentaire & Transformation',
        corridor: 'Afrique ↔ Europe',
        isLiveNow: false,
        boothRepresentativeName: 'Dr. Mamadouba Camara',
        representativeRole: 'Président du Conseil de Coopérative',
        description: 'Producteur d\'exception de café Arabica Ziama Bio d\'altitude (800-1200m) et de fèves de cacao grand cru de la forêt guinéenne, certifié commerce équitable.',
        teamMembers: [
            { name: 'Dr. Mamadouba Camara', role: 'Président Export' },
            { name: 'Kadiatou Soumah', role: 'Directrice Traçabilité Bio' }
        ],
        featuredProducts: PRODUCTS.filter(p => p.category === 'Physique'),
        servicesOffered: ['Échantillonnage express DHL sous 48h', 'Conditionnement hermétique GrainPro', 'Contrats pluriannuels à prix garanti'],
        catalogueDownloadUrl: '#',
        instantChatAvailable: true,
        verifiedCertifications: [
            { code: 'ECOCERT-BIO', label: 'Agriculture Biologique UE/NOP', issuer: 'Ecocert France', isVerified: true },
            { code: 'FAIRTRADE', label: 'Certification Commerce Équitable', issuer: 'FLO-CERT', isVerified: true },
            { code: 'RCCM-GN', label: 'Enregistrement Légal RCCM Guinée', issuer: 'APIP Guinée', isVerified: true }
        ],
        contactPhone: '+224 622 45 88 12',
        contactEmail: 'contact@coop-ziama.gn',
        spokenLanguages: ['Français', 'Pular', 'Maninka', 'Anglais'],
        deliveryRegionsServed: ['France (Le Havre)', 'Allemagne (Hambourg)', 'Belgique', 'Afrique de l\'Ouest'],
        minOrderQuantityGuideline: '500 kg (1 palette)',
        isPlatformVerified: true
    },
    {
        id: 'booth-3-sunvolt',
        fairName: 'Salon Mondial B2B Export & Machines 2026',
        companyName: 'SunVolt Solar Solutions Ltd',
        logoUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=200',
        bannerUrl: 'https://images.unsplash.com/photo-1508873696983-2df5293cb32b?w=800&fit=crop',
        country: 'Turquie',
        countryFlag: '🇹🇷',
        city: 'Istanbul',
        pavilionSector: 'Énergie & Solaire Renouvelable',
        corridor: 'Afrique ↔ Turquie',
        isLiveNow: true,
        boothRepresentativeName: 'Tarkan Demir',
        representativeRole: 'Directeur des Ventes Régionales Afrique',
        description: 'Fabrication européenne de kits solaires industriels complets pour forages agricoles, cliniques rurales et entrepôts frigorifiques autonomes.',
        teamMembers: [
            { name: 'Tarkan Demir', role: 'Directeur Afrique' },
            { name: 'Zeynep Kaya', role: 'Ingénieure Dimensionnement Solaire' }
        ],
        featuredProducts: PRODUCTS.filter(p => p.dimensionType === 'B2B'),
        servicesOffered: ['Étude de dimensionnement en 24h', 'Garantie constructeur 15 ans sur modules', 'Envoi conteneurs directs Istanbul → Conakry'],
        catalogueDownloadUrl: '#',
        instantChatAvailable: true,
        verifiedCertifications: [
            { code: 'CE-MARK', label: 'Conformité Européenne Sécurité', issuer: 'TÜV Rheinland', isVerified: true },
            { code: 'IEC-61215', label: 'Résistance Climat Tropical & Chaleur', issuer: 'International Electrotechnical Commission', isVerified: true }
        ],
        contactPhone: '+90 212 555 8790',
        contactEmail: 'africa@sunvolt-solar.tr',
        spokenLanguages: ['Français', 'Anglais', 'Turc', 'Arabe'],
        deliveryRegionsServed: ['Toute l\'Afrique de l\'Ouest', 'Afrique Centrale', 'Europe du Sud'],
        minOrderQuantityGuideline: '1 kit conteneurisé ou 20 modules',
        isPlatformVerified: true
    }
];

export const MOCK_BUSINESS_MATCHES: BusinessMatch[] = [
    {
        id: 'match-1',
        seekerName: 'Pharmacie Centrale & Dépôts de Conakry',
        seekerCountry: 'Guinée',
        seekerFlag: '🇬🇳',
        seekerNeed: 'Recherche fabricant fiable de boîtes cartons pharmaceutiques étanches avec vernis UV tropicalisé et capacité 50 000 boîtes/trimestre.',
        offererName: 'SinoPack Industrial Ltd',
        offererCountry: 'Chine',
        offererFlag: '🇨🇳',
        offererProposition: 'Ligne automatique certifiée BPF produisant jusqu\'à 200 000 boîtes/mois avec livraison directe CIF Conakry et conditions 30/70.',
        sector: 'Pharmacie & Conditionnement',
        corridor: 'Guinée ↔ Chine',
        matchingScore: 94,
        scoreBreakdown: [
            { label: 'Compatibilité Produit & Normes BPF', isMatch: true, explanation: 'Carton 350g vernis UV étanche 100% conforme au cahier des charges médical.' },
            { label: 'Quantité & Capacité Usine', isMatch: true, explanation: 'Besoin de 50k unités/trimestre largement dans la capacité industrielle (200k/mois).' },
            { label: 'Corridor Logistique Établi', isMatch: true, explanation: 'Liaison maritime active Chine (Guangzhou) → Guinée (Port de Conakry).' },
            { label: 'Modalités de Paiement Sécurisé', isMatch: true, explanation: 'Fournisseur accepte séquestre TrustTrade Escrow avec jalonnement 30/70.' },
            { label: 'Langue de Négociation', isMatch: true, explanation: 'Représentant commercial francophone dédié chez le fournisseur.' }
        ],
        matchType: 'supplier',
        status: 'suggested',
        dateSuggested: 'Aujourd\'hui 08:30'
    },
    {
        id: 'match-2',
        seekerName: 'Coopérative Café Ziama',
        seekerCountry: 'Guinée',
        seekerFlag: '🇬🇳',
        seekerNeed: 'Recherche distributeur ou torréfacteur artisanal pour contrat annuel d\'exportation 5 Tonnes de Café Arabica Bio en France.',
        offererName: 'Torréfaction Artisanale des Grands Boulevards',
        offererCountry: 'France',
        offererFlag: '🇫🇷',
        offererProposition: 'Réseau de 12 boutiques gourmet à Paris et vente en ligne de cafés de spécialité certifiés origine équitable.',
        sector: 'Agroalimentaire & Transformation',
        corridor: 'Afrique ↔ Europe',
        matchingScore: 91,
        scoreBreakdown: [
            { label: 'Appétence Marché & Positionnement Bio', isMatch: true, explanation: 'L\'acheteur cherche exclusivement du café d\'altitude certifié Ecocert / équitable.' },
            { label: 'Volume d\'Achat Compatible', isMatch: true, explanation: 'Consommation annuelle de 6 à 8 tonnes, parfaitement en phase avec le lot proposé.' },
            { label: 'Historique Commercial Positif', isMatch: true, explanation: 'Acheteur régulier avec 5 transactions réussies et paiements sans incident.' }
        ],
        matchType: 'distributor',
        status: 'connected',
        dateSuggested: 'Hier 16:45'
    }
];

export const MOCK_SOURCING_MISSIONS: SourcingMission[] = [
    {
        id: 'src-mission-01',
        title: 'Sourcing Fabricant Ligne de Conditionnement Jus de Mangue & Ananas',
        requesterId: 'u1',
        requesterName: 'Agro-Industrie du Fouta SARL',
        targetSector: 'Agroalimentaire & Transformation',
        targetProduct: 'Ligne semi-automatique d\'embouteillage et étiquetage 1 000 bouteilles/heure',
        specifications: [
            'Remplissage à chaud 85°C pour conservation naturelle sans conservateurs',
            'Compatible bouteilles verre et plastique PET de 250ml à 1000ml',
            'Alimentation électrique 380V triphasé + compatibilité groupe électrogène',
            'Pièces d\'usure courante fournies pour 2 ans de fonctionnement'
        ],
        quantityTarget: 1,
        unit: 'Ligne complète',
        budgetMax: 28000,
        currency: 'EUR',
        acceptedCountries: ['Chine', 'Turquie', 'Inde', 'France'],
        requiredCertifications: ['CE', 'ISO 9001', 'Garantie constructeur 24 mois'],
        leadTimeMaxDays: 45,
        destinationPortCity: 'Port Autonome de Conakry',
        selectionCriteria: ['Prix & solidité mécanique', 'Facilité de maintenance sur place', 'Disponibilité d\'un technicien pour l\'installation'],
        status: 'shortlist_ready',
        createdAt: '18/02/2026',
        shortlist: [
            {
                id: 'src-item-1',
                supplierName: 'Guangzhou KingPack Machinery Co.',
                country: 'Chine',
                countryFlag: '🇨🇳',
                city: 'Guangzhou',
                productTitle: 'Ligne Monobloc Remplissage Jus 1200 BPH Tropicalisée',
                productionCapacity: '15 lignes complètes/mois',
                minOrderQuantity: 1,
                unit: 'ligne',
                availablePriceEstimate: 21500,
                currency: 'EUR',
                leadTimeDays: 30,
                certifications: ['CE', 'ISO 9001', 'SGS Audit'],
                contactEmail: 'sales@kingpack-china.com',
                sourceType: 'plateforme_certifiee',
                confidenceLevel: 'tres_eleve',
                risksAndUnknowns: ['Formation du personnel local à planifier par visioconférence ou envoi d\'ingénieur'],
                isContacted: true
            },
            {
                id: 'src-item-2',
                supplierName: 'Anadolu Gida Makineleri Ltd',
                country: 'Turquie',
                countryFlag: '🇹🇷',
                city: 'Izmir',
                productTitle: 'Ligne Semi-Automatique Inox 316L Remplissage Jus Chaud',
                productionCapacity: '8 unités/mois',
                minOrderQuantity: 1,
                unit: 'ligne',
                availablePriceEstimate: 24800,
                currency: 'EUR',
                leadTimeDays: 25,
                certifications: ['CE', 'TÜV', 'ISO 22000'],
                contactEmail: 'export@anadolumakine.tr',
                sourceType: 'partenaire_verifie',
                confidenceLevel: 'eleve',
                risksAndUnknowns: ['Délai maritime Izmir-Conakry avec escale technique (estimé 18 jours)'],
                isContacted: false
            },
            {
                id: 'src-item-3',
                supplierName: 'Apex Bottling Tech Pune',
                country: 'Inde',
                countryFlag: '🇮🇳',
                city: 'Pune',
                productTitle: 'Compact Juice Bottling Unit with Pasteurizer',
                productionCapacity: '10 unités/mois',
                minOrderQuantity: 1,
                unit: 'ligne',
                availablePriceEstimate: 18900,
                currency: 'EUR',
                leadTimeDays: 40,
                certifications: ['ISO 9001'],
                contactEmail: 'contact@apexbottling.in',
                sourceType: 'source_externe_web',
                webSourceUrl: 'https://indiamart.com/apexbottling-pune-2026',
                webSourceDate: 'Relevé le 20/02/2026',
                confidenceLevel: 'moyen_externe',
                risksAndUnknowns: [
                    'Entreprise externe non membre certifié de LE MONDE À VOUS',
                    'Nécessite inspection préalable par un tiers de confiance avant tout virement'
                ],
                isContacted: false
            }
        ]
    }
];

export const MOCK_SMART_TENDERS: SmartTender[] = [
    {
        id: 'tender-sante-gn-01',
        codeRef: 'AO-2026-SANTE-GN-01',
        title: 'Fourniture de 10 000 Kits de Diagnostic Rapide & Consommables Médicaux d\'Urgence',
        issuerType: 'ngo',
        issuerName: 'ONG Espoir & Santé Afrique de l\'Ouest',
        issuerCountry: 'Guinée',
        issuerFlag: '🇬🇳',
        sector: 'Santé & Matériel Médical',
        visibility: 'public',
        specificationsSummary: 'Fourniture échelonnée sur 6 mois de kits TDR Paludisme, tests typhoïde, gants stériles nitrile et boîtes de sécurité bio-médicale certifiés OMS.',
        detailedRequirements: [
            'Sensibilité diagnostique certifiée supérieure à 98% selon référentiel OMS',
            'Validité résiduelle des réactifs d\'au moins 18 mois à la date de livraison à Conakry',
            'Conditionnement étanche résistant à l\'hygrométrie tropicale (>85% humidité)',
            'Garantie de livraison sous 20 jours après bon de commande émis'
        ],
        criteriaWeights: {
            technical: 40,
            price: 30,
            leadTime: 10,
            experience: 10,
            compliance: 10
        },
        deadlineDate: '15 Avril 2026 (dans 14 jours)',
        estimatedBudgetPublic: 45000,
        currency: 'EUR',
        mandatoryCertifications: ['Agrément Ministère Santé / OMS', 'RCCM en cours de validité', 'Certificat d\'origine légale'],
        documentsRequired: [
            { name: 'Cahier_Des_Charges_AO_2026_EspoirSante.pdf', description: 'Termes de référence officiels', mandatory: true },
            { name: 'Grille_De_Prix_Unitaire_Standard.xlsx', description: 'Tableau Excel à compléter impérativement', mandatory: true }
        ],
        questionsAnswers: [
            { question: 'La livraison au magasin central de Matam est-elle à la charge du soumissionnaire ?', answer: 'Oui, l\'offre doit être formulée DDP Magasin Central Conakry Matam.', date: '22/02/2026' },
            { question: 'Les paiements sont-ils effectués par tranche ?', answer: 'Oui : 30% acompte sous caution bancaire, 70% sous 15 jours après procès-verbal de conformité.', date: '24/02/2026' }
        ],
        status: 'open',
        createdAt: '15/02/2026',
        submissions: [
            {
                id: 'sub-1',
                tenderId: 'tender-sante-gn-01',
                bidderId: 'u-pharma-guinee',
                bidderName: 'Pharmacie & Logistique Médicale Guinéenne SARL',
                bidderCountry: 'Guinée',
                bidderFlag: '🇬🇳',
                submittedPrice: 41800,
                currency: 'EUR',
                leadTimeDays: 14,
                technicalScore: 38,
                priceScore: 28,
                leadTimeScore: 10,
                experienceScore: 9,
                complianceScore: 10,
                totalScore: 95,
                complianceStatus: 'conforme',
                missingDocsAlerts: [],
                uploadedDocs: [
                    { name: 'Offre_Technique_PLMG.pdf', size: '2.4 MB', isVerified: true },
                    { name: 'Bordereau_Prix_PLMG.xlsx', size: '480 KB', isVerified: true },
                    { name: 'Agrement_Ministere_Sante_2026.pdf', size: '1.1 MB', isVerified: true }
                ],
                proposalSummary: 'Offre complète comprenant tests Abbott OMS avec livraison DDP hebdomadaire sécurisée en camion frigorifique.',
                status: 'under_review',
                submittedAt: 'Hier à 11:20'
            }
        ]
    },
    {
        id: 'tender-btp-energie-02',
        codeRef: 'AO-2026-SOLAR-COMMUNAUTAIRE',
        title: 'Installation Clé en Main de 5 Mini-Centrales Solaires Hybrides 25 kWp pour Écoles Rurales',
        issuerType: 'institution',
        issuerName: 'Programme Énergie Rurale & Développement (Bailleur International)',
        issuerCountry: 'Guinée',
        issuerFlag: '🇬🇳',
        sector: 'Énergie & Solaire Renouvelable',
        visibility: 'limited',
        specificationsSummary: 'Fourniture, génie civil, montage de panneaux solaires, onduleurs hybrides et batteries LiFePO4 avec formation des comités de gestion locaux.',
        detailedRequirements: [
            'Onduleurs hybrides communicants avec monitoring à distance 4G',
            'Batteries au Lithium Phosphate de Fer garanties 6 000 cycles à 80% DOD',
            'Service après-vente et maintenance préventive inclus pendant 2 ans'
        ],
        criteriaWeights: {
            technical: 45,
            price: 25,
            leadTime: 10,
            experience: 10,
            compliance: 10
        },
        deadlineDate: '30 Avril 2026',
        estimatedBudgetPublic: 95000,
        currency: 'EUR',
        mandatoryCertifications: ['Habilitation Haute Tension / Solaire', 'Garantie bancaire de bonne fin'],
        documentsRequired: [
            { name: 'Dossier_Technique_Centrales_Solaires_V2.pdf', description: 'Plans unifilaires et spécifications', mandatory: true }
        ],
        questionsAnswers: [],
        status: 'open',
        createdAt: '20/02/2026',
        submissions: []
    }
];

export const MOCK_PARTNERSHIP_ITEMS: PartnershipItem[] = [
    {
        id: 'part-01',
        partnerName: 'SinoPack Industrial Ltd',
        partnerCountry: 'Chine',
        partnerFlag: '🇨🇳',
        partnerType: 'representation',
        objective: 'Créer un comptoir exclusif de représentation et stockage d\'emballages pharmaceutiques en Guinée pour approvisionner la sous-région ouest-africaine.',
        resourcesSought: 'Dépôt sous douane à Conakry + Force commerciale locale sur le terrain.',
        contributionOffered: 'Stock tampon consigné à hauteur de 100 000€ + Prix usine direct sans intermédiaire.',
        stage: 'negociation',
        linkedProjectId: 'proj-depot-conakry',
        linkedProjectName: 'Création Hub Logistique Santé Conakry',
        contactPerson: 'Lin Chen (Directeur Export)',
        contactEmail: 'export@sinopack-ind.cn',
        confidenceScore: 88,
        lastInteractionDate: 'Hier 15:30',
        nextActionDate: '28 Février 2026',
        nextActionNote: 'Finaliser le projet de protocole d\'accord tripartite assisté par l\'Expert Juridique Diallo OS.'
    },
    {
        id: 'part-02',
        partnerName: 'GreenPower Europe Tech',
        partnerCountry: 'Allemagne',
        partnerFlag: '🇩🇪',
        partnerType: 'technique',
        objective: 'Partenariat de transfert de technologie pour l\'assemblage local de batteries solaires recyclables en Guinée.',
        resourcesSought: 'Atelier de montage local + Personnel technique à former.',
        contributionOffered: 'Fourniture des composants BMS électroniques de pointe + Certification de conformité TÜV.',
        stage: 'rendez_vous',
        contactPerson: 'Hans Weber (Head of Global Partnerships)',
        contactEmail: 'h.weber@greenpower-tech.de',
        confidenceScore: 82,
        lastInteractionDate: '22/02/2026',
        nextActionDate: '02 Mars 2026',
        nextActionNote: 'Réunion Live B2B avec partage d\'écran et démonstration de la station d\'équilibrage cellulaire.'
    },
    {
        id: 'part-03',
        partnerName: 'Fondation Afrique Avenir & Impact',
        partnerCountry: 'Sénégal',
        partnerFlag: '🇸🇳',
        partnerType: 'ong',
        objective: 'Co-financement et déploiement d\'un programme de formation agro-technologique pour 200 jeunes agriculteurs en zone rurale.',
        resourcesSought: 'Accréditation pédagogique du Campus Mok + Experts formateurs terrain.',
        contributionOffered: 'Subvention directe de 45 000€ pour le matériel et bourses d\'équipement.',
        stage: 'accord',
        contactPerson: 'Mme Fatoumata Ndiaye',
        contactEmail: 'projets@afrique-avenir.org',
        confidenceScore: 96,
        lastInteractionDate: '19/02/2026',
        nextActionDate: '05 Mars 2026',
        nextActionNote: 'Cérémonie de signature officielle et annonce sur le Réseau Mok Social.'
    }
];

export const MOCK_INVESTOR_PROFILES: InvestorFundingProfile[] = [
    {
        id: 'inv-1',
        entityName: 'Sahel Capital Agri-Fund',
        type: 'fund',
        country: 'Côte d\'Ivoire',
        flag: '🇨🇮',
        ticketRange: '100 000€ à 1 500 000€',
        focusSectors: ['Agriculture & Élevage', 'Agroalimentaire & Transformation', 'Énergie & Solaire Renouvelable'],
        targetRegions: ['Afrique de l\'Ouest', 'Guinée', 'Sénégal', 'Côte d\'Ivoire'],
        requirements: ['Entreprise en activité depuis au moins 18 mois', 'Chiffre d\'affaires annuel > 50 000€', 'Impact environnemental et création d\'emplois féminins'],
        contactEmail: 'dealflow@sahelcapital.ci',
        isAccredited: true
    },
    {
        id: 'inv-2',
        entityName: 'Diaspora Business Angels Club (Paris-Conakry)',
        type: 'business_angel',
        country: 'France / Guinée',
        flag: '🇬🇳 🇫🇷',
        ticketRange: '15 000€ à 100 000€',
        focusSectors: ['Technologie & Électronique', 'Santé & Matériel Médical', 'Services B2B & Conseil Juridique'],
        targetRegions: ['Guinée', 'Diaspora'],
        requirements: ['Prototype ou MVP fonctionnel', 'Équipe dirigeante complémentaire', 'Pitch deck de 10 slides clair avec prévisionnel financier 3 ans'],
        contactEmail: 'invest@diaspora-angels.gn',
        isAccredited: true
    },
    {
        id: 'inv-3',
        entityName: 'Banque d\'Investissement & Crédit PME',
        type: 'bank',
        country: 'Guinée',
        flag: '🇬🇳',
        ticketRange: '20 000€ à 300 000€ (Prêt / Crédit-Bail)',
        focusSectors: ['Industrie & Machines-Outils', 'Transport, Logistique & Fret', 'Construction, BTP & Matériaux'],
        targetRegions: ['Guinée'],
        requirements: ['Comptes certifiés', 'Contrat commercial ferme ou bon de commande acheteur garanti'],
        contactEmail: 'entreprises@bic-pme.gn',
        isAccredited: true
    }
];

export const MOCK_COMMERCIAL_MISSIONS: CommercialMissionTrip[] = [
    {
        id: 'miss-cn-2026-01',
        missionTitle: 'Mission Commerciale Chine (Canton & Shenzhen) — Sourcing Lignes Industrielles & Packaging',
        isVirtual: false,
        targetCountries: ['Chine'],
        targetCities: ['Guangzhou (Canton)', 'Shenzhen', 'Foshan'],
        departureDate: '12 Mai 2026',
        returnDate: '22 Mai 2026 (10 jours)',
        productsFocus: ['Lignes de conditionnement pharmaceutique', 'Moulins industriels', 'Kits solaires photovoltaïques'],
        teamMembers: ['Amadou Diallo (Chef de Mission)', 'Kadiatou Camara (Responsable Achats)'],
        budgetTotalEstimated: 4850,
        currency: 'EUR',
        budgetBreakdown: {
            flights: 1650,
            hotel: 1100,
            transport: 450,
            meals: 550,
            interpreter: 600,
            samples: 300,
            misc: 200
        },
        preDepartureChecklist: [
            { id: 'pck-1', item: 'Passeport valide > 6 mois & Demande Visa d\'Affaires M Chine déposée', done: true, category: 'visa' },
            { id: 'pck-2', item: 'Réservation des billets d\'avion Conakry → Dubaï → Guangzhou confirmée', done: true, category: 'voyage' },
            { id: 'pck-3', item: 'Hôtel 4 étoiles réservé à proximité immédiate du complexe de la Foire de Canton', done: true, category: 'hotel' },
            { id: 'pck-4', item: 'Interprète assermenté Français/Mandarin réservé pour les visites d\'usines', done: true, category: 'traduction' },
            { id: 'pck-5', item: 'Briefings d\'objectifs de prix et fiches techniques préparés avec Diallo OS', done: true, category: 'briefing' },
            { id: 'pck-6', item: 'Cartes de visite professionnelles imprimées en bilingue Français/Chinois', done: true, category: 'commercial' }
        ],
        dailyItinerary: [
            {
                dayNumber: 1,
                date: '13 Mai 2026',
                city: 'Guangzhou',
                meetings: [
                    {
                        id: 'mtg-cn-1',
                        time: '09:30',
                        companyName: 'SinoPack Industrial Ltd',
                        contactPerson: 'Lin Chen (Directeur Export)',
                        locationAddress: 'District de Baiyun, Parc Industriel Packaging No. 88, Guangzhou',
                        objective: 'Visite de la salle blanche de production des blisters BPF et test des cartons avec vernis tropicalisé.',
                        briefingDone: true,
                        keyQuestionsToAsk: [
                            'Capacité d\'ensachage en cas de pic de commande à 150 000 boîtes ?',
                            'Délai de délivrance du certificat d\'analyse COA par lot produit ?',
                            'Application d\'une remise volume de 8% pour commande annuelle ?'
                        ],
                        targetPricesToNegotiate: '0.32 € / unité CIF Conakry',
                        status: 'confirmed',
                        attachedDocName: 'Cahier_Des_Charges_Pharma_2026.pdf'
                    },
                    {
                        id: 'mtg-cn-2',
                        time: '14:30',
                        companyName: 'KingPack Machinery Co.',
                        contactPerson: 'Eng. Wang Bo',
                        locationAddress: 'Zone Économique de Panyu, Guangzhou',
                        objective: 'Démonstration en fonctionnement réel de l\'embouteilleuse de jus chaud 1200 BPH.',
                        briefingDone: true,
                        keyQuestionsToAsk: [
                            'Puissance électrique requise au démarrage ?',
                            'Disponibilité des pompes de rechange en cas de panne ?'
                        ],
                        targetPricesToNegotiate: '20 000 € FOB Guangzhou',
                        status: 'confirmed'
                    }
                ]
            },
            {
                dayNumber: 2,
                date: '14 Mai 2026',
                city: 'Shenzhen',
                meetings: [
                    {
                        id: 'mtg-cn-3',
                        time: '10:00',
                        companyName: 'Shenzhen SunPower Eco-Tech',
                        contactPerson: 'Ms. Alice Zhang',
                        locationAddress: 'Nanshan High-Tech Park, Shenzhen',
                        objective: 'Négocier l\'importation directe d\'un conteneur 20 pieds de batteries LiFePO4 certifiées.',
                        briefingDone: false,
                        keyQuestionsToAsk: ['Garantie de remplacement direct sous 30 jours ?'],
                        targetPricesToNegotiate: 'Prix conteneur < 35 000 USD',
                        status: 'pending'
                    }
                ]
            }
        ],
        scannedCards: [
            { id: 'card-1', name: 'Lin Chen', company: 'SinoPack Industrial Ltd', role: 'Export Director', phone: '+86 138 0013 8000', email: 'linchen@sinopack-ind.cn', city: 'Guangzhou', scannedAt: '13 Mai 2026' }
        ],
        scannedProducts: [
            { id: 'sp-1', productRef: 'PKG-BOX-UV-01', supplierName: 'SinoPack', photoUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400', quotedPrice: 0.33, currency: 'EUR', moq: 10000, notes: 'Finition vernis UV d\'excellente qualité, résistance à l\'humidité testée sur place.' }
        ],
        dailyLogs: [
            { date: '13 Mai 2026', summary: 'Journée très productive à Guangzhou. Visite des ateliers SinoPack concluante.', spentAmount: 180, keyDecisions: ['Validation de l\'échantillon physique', 'Accord de principe sur le prix CIF'], nextActions: ['Éditer le projet de contrat tripartite dans le dossier commercial'] }
        ],
        finalReport: {
            executiveSummary: 'Mission commerciale couronnée de succès : 2 fabricants qualifiés de niveau A, économie négociée de 12% sur les coûts d\'importation et signature d\'un accord d\'approvisionnement.',
            companiesMetCount: 5,
            viableOpportunities: ['Contrat d\'emballage pharmaceutique SinoPack', 'Ligne de jus d\'ananas KingPack'],
            risksIdentified: ['Délai de transport maritime à surveiller en période de typhon'],
            totalSpent: 4320,
            recommendedNextSteps: ['Ouvrir le dossier commercial formel sur Marché Mondial', 'Séquestrer l\'acompte sur TrustTrade Escrow'],
            generatedAt: '23 Mai 2026'
        },
        status: 'on_site'
    }
];

export const MOCK_WATCHDOG_ALERTS: CommercialWatchdogAlert[] = [
    {
        id: 'watch-1',
        title: 'Baisse de 6.5% des taux de fret maritime Asie → Afrique de l\'Ouest (Route Chine-Conakry)',
        type: 'price_fluctuation',
        sector: 'Transport, Logistique & Fret',
        country: 'International',
        summary: 'Le coût d\'un conteneur 40 pieds High Cube (FCL) entre Ningbo/Guangzhou et Conakry est passé de 3 800$ à 3 550$ pour les départs d\'Avril.',
        relevanceScore: 95,
        date: 'Aujourd\'hui 07:15',
        source: 'Indice Maritime International & Forwarder Desk',
        recommendedAction: 'Idéal pour valider vos expéditions de machines ou emballages en cours de négociation.'
    },
    {
        id: 'watch-2',
        title: 'Nouvel Appel d\'Offres Public : Équipements de Santé pour 12 Centres Médicaux Régionaux',
        type: 'tender_new',
        sector: 'Santé & Matériel Médical',
        country: 'Guinée',
        summary: 'Publication officielle du Ministère de la Santé portant sur l\'acquisition de tables d\'accouchement, autoclaves solaires et lits hospitaliers.',
        relevanceScore: 92,
        date: 'Hier 18:40',
        source: 'Journal Officiel des Marchés Publics',
        recommendedAction: 'Utiliser l\'Assistant IA pour analyser les critères et soumettre votre offre technique.'
    },
    {
        id: 'watch-3',
        title: 'Entrée en vigueur de la convention tarifaire préférentielle ZLECAF sur les produits transformés',
        type: 'regulatory_change',
        sector: 'Agroalimentaire & Transformation',
        country: 'Afrique de l\'Ouest',
        summary: 'Exonération totale des droits de douane pour le café, cacao et jus conditionnés certifiés origine CEDEAO entre la Guinée, la Côte d\'Ivoire et le Sénégal.',
        relevanceScore: 89,
        date: 'Il y a 3 jours',
        source: 'Secrétariat ZLECAF',
        recommendedAction: 'Mettre à jour le simulateur Landed Cost pour recalculer vos marges à l\'export régional.'
    }
];

export const MOCK_RELATIONSHIP_NODES: RelationshipNetworkNode[] = [
    { id: 'rel-1', name: 'SinoPack Industrial Ltd', type: 'supplier', country: 'Chine', flag: '🇨🇳', sector: 'Emballages BPF', relationshipStrength: 92, lastInteractionDate: 'Hier', totalDealsVolume: 35000, currency: 'EUR' },
    { id: 'rel-2', name: 'Pharmacie Centrale Guinéenne', type: 'client', country: 'Guinée', flag: '🇬🇳', sector: 'Santé & Dépôt', relationshipStrength: 96, lastInteractionDate: 'Aujourd\'hui', totalDealsVolume: 42000, currency: 'EUR' },
    { id: 'rel-3', name: 'Torréfaction Grands Boulevards', type: 'client', country: 'France', flag: '🇫🇷', sector: 'Café de Spécialité', relationshipStrength: 89, lastInteractionDate: 'Il y a 2 jours', totalDealsVolume: 26000, currency: 'EUR' },
    { id: 'rel-4', name: 'SunVolt Solar Solutions', type: 'partner', country: 'Turquie', flag: '🇹🇷', sector: 'Solaire & Énergie', relationshipStrength: 84, lastInteractionDate: 'Il y a 4 jours', totalDealsVolume: 18000, currency: 'USD' },
    { id: 'rel-5', name: 'Syli Transit & Logistique', type: 'distributor', country: 'Guinée', flag: '🇬🇳', sector: 'Transit Douane', relationshipStrength: 95, lastInteractionDate: 'Aujourd\'hui', totalDealsVolume: 12500, currency: 'EUR' }
];

export const MOCK_PROSPECTION_CAMPAIGNS: ProspectionCampaign[] = [
    {
        id: 'camp-senegal-pharma-01',
        title: '50 Pharmacies Distributrices & Dépôts au Sénégal (Dakar & Régions)',
        targetSector: 'Santé & Produits Pharmaceutiques',
        targetCountry: 'Sénégal',
        targetCountryFlag: '🇸🇳',
        targetCity: 'Dakar, Thiès, Saint-Louis',
        targetProfile: 'Officines de pharmacie agréées, groupements d\'achat et distributeurs de dispositifs médicaux',
        objective: 'Introduire la nouvelle gamme de désinfectants hospitaliers et consommables certifiés BPF avec conditions de paiement à 30 jours.',
        totalProspects: 50,
        contactedCount: 32,
        responsesCount: 14,
        meetingsCount: 6,
        dealsWonCount: 3,
        createdAt: '10 Avril 2026',
        status: 'active',
        prospects: [
            {
                id: 'prosp-sn-1',
                companyName: 'Pharmacie du Point E',
                activity: 'Officine de référence & Matériel médical',
                country: 'Sénégal',
                countryFlag: '🇸🇳',
                city: 'Dakar',
                contactName: 'Dr. Cheikh Ndiaye',
                contactRole: 'Pharmacien Titulaire & Acheteur',
                email: 'contact@pharmaciedupointe.sn',
                phone: '+221 33 825 00 12',
                source: 'Annuaire National de l\'Ordre des Pharmaciens du Sénégal (Source Vérifiée)',
                channel: 'email',
                status: 'rendez_vous',
                relevanceScore: 95,
                scoreReasons: ['Gros volume d\'achat mensuel', 'Agrément importation directe', 'Solvabilité confirmée'],
                customMessageDraft: 'Bonjour Dr. Ndiaye, suite à notre analyse des besoins en approvisionnement hospitalier à Dakar, nous proposons des conditions grossiste exclusives sur nos gants et solutés certifiés ISO 13485.',
                customMessageValidated: true,
                notes: 'Très intéressé par la livraison directe par conteneur groupé LCL au Port Autonome de Dakar.',
                history: [
                    { date: '12 Avril 2026', action: 'Message personnalisé envoyé', note: 'Email validé par l\'utilisateur et transmis.' },
                    { date: '14 Avril 2026', action: 'Réponse positive reçue', note: 'Demande de catalogue complet et tarifs grossiste.' },
                    { date: '16 Avril 2026', action: 'Rendez-vous Live B2B fixé', note: 'Créneau calé pour le 22 Avril à 11:00 GMT sur Mok Meet.' }
                ],
                lastInteractionDate: '16 Avril 2026',
                nextFollowUpDate: '22 Avril 2026'
            },
            {
                id: 'prosp-sn-2',
                companyName: 'Groupe Pharmaceutique Sahel Santé',
                activity: 'Distributeur grossiste-répartiteur',
                country: 'Sénégal',
                countryFlag: '🇸🇳',
                city: 'Dakar / Diamniadio',
                contactName: 'Mme Awa Sow',
                contactRole: 'Directrice des Achats & Supply Chain',
                email: 'a.sow@sahelsante.sn',
                phone: '+221 33 869 44 20',
                source: 'Réseau Professionnel Mok & Chambre de Commerce de Dakar',
                channel: 'mok_chat',
                status: 'negociation',
                relevanceScore: 92,
                scoreReasons: ['Réseau de 120 officines partenaires', 'Entrepôt sous douane certifié', 'Intérêt fort pour la marque'],
                customMessageDraft: 'Chère Mme Sow, nous vous invitons à découvrir notre offre de partenariat exclusif pour la distribution de nos équipements d\'imagerie portable.',
                customMessageValidated: true,
                notes: 'Négociation du barème de remise sur volume (15% pour 300 000€ de commande annuelle).',
                history: [
                    { date: '08 Avril 2026', action: 'Prise de contact Mok Chat', note: 'Introduction mutuelle validée.' },
                    { date: '11 Avril 2026', action: 'Devis proforma transmis', note: 'Proforma #PF-2026-SN-04 envoyée.' },
                    { date: '15 Avril 2026', action: 'Contre-proposition reçue', note: 'Demande de délai de paiement 45 jours fin de mois.' }
                ],
                lastInteractionDate: '15 Avril 2026',
                nextFollowUpDate: '20 Avril 2026'
            },
            {
                id: 'prosp-sn-3',
                companyName: 'Pharmacie Moderne Thiessoise',
                activity: 'Officine & Fourniture clinique',
                country: 'Sénégal',
                countryFlag: '🇸🇳',
                city: 'Thiès',
                contactName: 'Dr. Ibrahima Ba',
                contactRole: 'Gérant',
                email: 'i.ba@pharmamoderne-thies.sn',
                phone: '+221 33 951 18 90',
                source: 'Tribus Business Santé Afrique de l\'Ouest',
                channel: 'email',
                status: 'a_contacter',
                relevanceScore: 84,
                scoreReasons: ['Zone géographique stratégique hors Dakar', 'Clinique privée adossée'],
                customMessageDraft: 'Dr. Ba, nous mettons à votre disposition notre service d\'approvisionnement express hebdomadaire au départ de Dakar sans rupture de stock.',
                customMessageValidated: false,
                notes: 'Message préparé par Diallo OS, en attente de relecture par l\'utilisateur avant envoi.',
                history: [
                    { date: '14 Avril 2026', action: 'Fiche prospect qualifiée', note: 'Profil et solvabilité analysés.' }
                ],
                lastInteractionDate: '14 Avril 2026',
                nextFollowUpDate: '19 Avril 2026'
            }
        ]
    },
    {
        id: 'camp-europe-cacao-02',
        title: 'Torréfacteurs & Chocolatiers Équitables en France & Allemagne',
        targetSector: 'Agroalimentaire & Produits Biologiques',
        targetCountry: 'France & Allemagne',
        targetCountryFlag: '🇪🇺',
        targetCity: 'Paris, Lyon, Hambourg, Cologne',
        targetProfile: 'Artisans chocolatiers bean-to-bar, maisons de torréfaction de spécialité',
        objective: 'Sécuriser des contrats d\'achat direct de fèves de cacao bio certifiées Ecocert et café Arabica grand cru avec prime producteur.',
        totalProspects: 30,
        contactedCount: 18,
        responsesCount: 9,
        meetingsCount: 4,
        dealsWonCount: 2,
        createdAt: '02 Avril 2026',
        status: 'active',
        prospects: [
            {
                id: 'prosp-eu-1',
                companyName: 'Chocolaterie Pure Origine Paris',
                activity: 'Chocolatier Bean-to-Bar & Épicerie Fine',
                country: 'France',
                countryFlag: '🇫🇷',
                city: 'Paris',
                contactName: 'Julien Mercier',
                contactRole: 'Maître Chocolatier & Sourcing Manager',
                email: 'sourcing@pureorigine-paris.fr',
                phone: '+33 1 42 68 00 50',
                source: 'Salon Virtuel Mondial (Pavillon Agroalimentaire)',
                channel: 'mok_chat',
                status: 'gagne',
                relevanceScore: 98,
                scoreReasons: ['Engagement 100% traçabilité directe', 'Prix d\'achat premium équitable', 'Commande récurrente'],
                customMessageDraft: 'Bonjour Julien, nos fèves de cacao grand cru de Guinée Forestière ont obtenu le score organoleptique de 86/100.',
                customMessageValidated: true,
                notes: 'Contrat commercial de 5 tonnes signé pour la saison 2026. Premier paiement séquestré.',
                history: [
                    { date: '04 Avril 2026', action: 'Rencontre sur stand virtuel', note: 'Échange d\'échantillons.' },
                    { date: '10 Avril 2026', action: 'Dégustation & test labo réussis', note: 'Validation profil aromatique.' },
                    { date: '15 Avril 2026', action: 'Signature contrat d\'achat', note: 'Accord commercial scellé.' }
                ],
                lastInteractionDate: '15 Avril 2026'
            }
        ]
    }
];

export const MOCK_LOCAL_REPRESENTATIVES: LocalCommercialRepresentative[] = [
    {
        id: 'rep-sn-1',
        name: 'Mamadou Lamine Faye',
        avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
        company: 'Dakar Business Bridge SARL',
        country: 'Sénégal',
        countryFlag: '🇸🇳',
        regionsCovered: ['Dakar', 'Thiès', 'Zone Portuaire & Diamniadio'],
        sectors: ['Santé & Dispositifs Médicaux', 'Agro-Industrie', 'Biens de Grande Consommation'],
        languages: ['Français (Natif)', 'Wolof (Natif)', 'Anglais (Professionnel)'],
        yearsExperience: 14,
        isVerified: true,
        badge: 'Représentant Agréé Marché Mondial',
        bio: '14 ans de direction commerciale en Afrique de l\'Ouest. Accompagnement de marques étrangères, prospection d\'officines, négociation avec les grossistes et suivi terrain.',
        availableServices: [
            'Prospection terrain & prise de rendez-vous B2B qualifiés',
            'Négociation de contrats de distribution & conditions de paiement',
            'Suivi des procédures d\'enregistrement ministériel / DPM',
            'Audit des distributeurs locaux & reporting hebdomadaire'
        ],
        rating: 4.9,
        reviewsCount: 38,
        dailyRateEstimate: 220,
        currency: 'EUR',
        contactEmail: 'ml.faye@dakarbridge.sn',
        contactPhone: '+221 77 640 11 99'
    },
    {
        id: 'rep-cn-2',
        name: 'Grace Liu (刘雅琴)',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        company: 'Canton Trade Gateway Consultancy',
        country: 'Chine',
        countryFlag: '🇨🇳',
        regionsCovered: ['Guangzhou', 'Shenzhen', 'Foshan', 'Dongguan', 'Ningbo'],
        sectors: ['Machines Industrielles & Outillage', 'Emballages & Packaging', 'Énergie Solaire'],
        languages: ['Mandarin (Natif)', 'Cantonais (Natif)', 'Français (Courant B2)', 'Anglais (Bilingue)'],
        yearsExperience: 11,
        isVerified: true,
        badge: 'Agent Terrain Certifié Canton',
        bio: 'Spécialiste de la relation commerciale Sino-Africaine basée à Guangzhou. Audit d\'usines, vérification des licences BPF/ISO, négociation des prix usine et contrôle qualité avant chargement.',
        availableServices: [
            'Visite physique d\'usines & audit technique avec rapport photo/vidéo',
            'Négociation directe en mandarin des prix FOB et remises volumes',
            'Inspection pré-embarquement des conteneurs & vérification des plombs',
            'Accompagnement d\'interprétariat lors de vos missions en Chine'
        ],
        rating: 5.0,
        reviewsCount: 52,
        dailyRateEstimate: 250,
        currency: 'EUR',
        contactEmail: 'grace.liu@cantongateway.cn',
        contactPhone: '+86 139 2288 4400'
    },
    {
        id: 'rep-ci-3',
        name: 'Jean-Marc Kouassi',
        avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
        company: 'Ivoire Expansion Conseil',
        country: 'Côte d\'Ivoire',
        countryFlag: '🇨🇮',
        regionsCovered: ['Abidjan (Port & VRIDI)', 'San Pedro', 'Bouaké'],
        sectors: ['Construction & BTP', 'Agroalimentaire & Cacao', 'Transport & Logistique'],
        languages: ['Français (Natif)', 'Anglais (Intermédiaire)'],
        yearsExperience: 9,
        isVerified: true,
        badge: 'Représentant Local Vérifié',
        bio: 'Expert en développement de réseaux de revendeurs en Côte d\'Ivoire. Introduction auprès des centrales d\'achat, quincailleries et distributeurs agréés.',
        availableServices: [
            'Recrutement de franchisés & revendeurs régionaux',
            'Représentation légale temporaire & gestion de showroom',
            'Suivi des livraisons portuaires & dédouanement'
        ],
        rating: 4.8,
        reviewsCount: 29,
        dailyRateEstimate: 190,
        currency: 'EUR',
        contactEmail: 'jm.kouassi@ivoire-expansion.ci',
        contactPhone: '+225 07 08 12 34 56'
    }
];

export const MOCK_DATA_ROOM_FILES: DataRoomFile[] = [
    {
        id: 'dr-1',
        title: 'Business Plan Stratégique & Modèle Économique 2026-2029',
        category: 'business_plan',
        fileName: 'BP_AgroExport_Guinee_2026_2029.pdf',
        fileSize: '4.8 MB',
        isConfidential: true,
        allowedRoles: ['owner', 'investor', 'expert'],
        accessLogs: [
            { userName: 'Amadou Diallo', role: 'owner', accessedAt: 'Aujourd\'hui 09:12', action: 'view' },
            { userName: 'Dr. Ousmane Sow (Sahel Capital)', role: 'investor', accessedAt: 'Hier 16:40', action: 'download' }
        ],
        uploadDate: '10 Avril 2026'
    },
    {
        id: 'dr-2',
        title: 'Pitch Deck Exécutif — Levée de Fonds 250 000€ (Hub Frigorifique)',
        category: 'presentation',
        fileName: 'Pitch_Deck_Hub_Froid_Conakry_2026.pdf',
        fileSize: '8.2 MB',
        isConfidential: false,
        allowedRoles: ['owner', 'partner', 'investor', 'expert'],
        accessLogs: [
            { userName: 'Mme Kadiatou Camara', role: 'partner', accessedAt: 'Hier 11:20', action: 'view' }
        ],
        uploadDate: '12 Avril 2026'
    },
    {
        id: 'dr-3',
        title: 'États Financiers Certifiés & Bilan Comptable 2024-2025',
        category: 'budget_projections',
        fileName: 'Etats_Financiers_Certifies_Audit_PwC.pdf',
        fileSize: '2.9 MB',
        isConfidential: true,
        allowedRoles: ['owner', 'investor', 'expert'],
        accessLogs: [],
        uploadDate: '08 Avril 2026'
    },
    {
        id: 'dr-4',
        title: 'Pacte d\'Actionnaires & Modèle de Convention Tripartite de Partenariat',
        category: 'contrats',
        fileName: 'Pacte_Actionnaires_Standard_OHADA.docx',
        fileSize: '1.1 MB',
        isConfidential: true,
        allowedRoles: ['owner', 'partner', 'investor', 'expert'],
        accessLogs: [],
        uploadDate: '05 Avril 2026'
    },
    {
        id: 'dr-5',
        title: 'Statuts Notariés RCCM & Certifications Sanitaires Ecocert / ISO',
        category: 'legal_statuts',
        fileName: 'Dossier_Juridique_RCCM_Certificats_Origine.pdf',
        fileSize: '3.4 MB',
        isConfidential: false,
        allowedRoles: ['owner', 'partner', 'investor', 'expert'],
        accessLogs: [],
        uploadDate: '01 Avril 2026'
    }
];

export const MOCK_PHYSICAL_TRADE_FAIRS: PhysicalTradeFair[] = [
    {
        id: 'fair-canton-2026',
        name: 'Foire d\'Import-Export de Chine (Canton Fair)',
        acronym: 'Canton Fair Phase 1 & 2',
        country: 'Chine',
        countryFlag: '🇨🇳',
        city: 'Guangzhou (Canton)',
        venue: 'China Import and Export Fair Complex (Pazhou)',
        dates: '15 Avril – 05 Mai 2026',
        sector: 'Machines, Électronique, Biens d\'Équipement & Emballages',
        organizer: 'Ministère du Commerce de la RPC (MOFCOM)',
        officialWebsiteUrl: 'https://www.cantonfair.org.cn',
        registrationDeadline: '30 Mars 2026',
        expectedExhibitors: '28 000+ usines',
        expectedVisitors: '200 000+ acheteurs mondiaux',
        isRegistered: true,
        studioPreparationItems: [
            { id: 'prep-1', label: 'Roll-up Bilingue Français/Chinois Présentation Entreprise', type: 'rollup', isGenerated: true },
            { id: 'prep-2', label: 'Catalogue Produits Export Haute Définition A4', type: 'catalogue', isGenerated: true },
            { id: 'prep-3', label: 'Vidéo Teaser Démo Produits avec Voix Studio IA', type: 'video', isGenerated: true },
            { id: 'prep-4', label: 'Cartes de Visite Bilingues avec QR Code Stand Virtuel', type: 'visiting_card', isGenerated: true }
        ]
    },
    {
        id: 'fair-sial-2026',
        name: 'SIAL Paris — Salon International de l\'Alimentation',
        acronym: 'SIAL Paris',
        country: 'France',
        countryFlag: '🇫🇷',
        city: 'Paris',
        venue: 'Paris Nord Villepinte',
        dates: '17 – 21 Octobre 2026',
        sector: 'Agroalimentaire, Bio, Boissons & Produits Tropicaux',
        organizer: 'Comexposium',
        officialWebsiteUrl: 'https://www.sialparis.com',
        registrationDeadline: '15 Juin 2026',
        expectedExhibitors: '7 500 exposants',
        expectedVisitors: '265 000 professionnels',
        isRegistered: false,
        studioPreparationItems: [
            { id: 'prep-sial-1', label: 'Fiches Dégustation Café Bio & Fèves de Cacao', type: 'catalogue', isGenerated: false },
            { id: 'prep-sial-2', label: 'Bannière Grand Format Pavillon Guinée', type: 'rollup', isGenerated: false }
        ]
    },
    {
        id: 'fair-gitex-2026',
        name: 'GITEX Global Dubai — Plus Grand Salon Tech & IA au Monde',
        acronym: 'GITEX Dubai',
        country: 'Émirats Arabes Unis',
        countryFlag: '🇦🇪',
        city: 'Dubaï',
        venue: 'Dubai World Trade Centre (DWTC)',
        dates: '12 – 16 Octobre 2026',
        sector: 'Intelligence Artificielle, Fintech, Cloud & Telecom',
        organizer: 'DWTC',
        officialWebsiteUrl: 'https://www.gitex.com',
        registrationDeadline: '01 Août 2026',
        expectedExhibitors: '6 000+ exposants tech',
        expectedVisitors: '180 000+ visiteurs',
        isRegistered: false,
        studioPreparationItems: [
            { id: 'prep-gtx-1', label: 'Présentation Pitch Deck IA Diallo OS pour Investisseurs Golfe', type: 'video', isGenerated: false }
        ]
    },
    {
        id: 'fair-fiara-2026',
        name: 'FIARA Dakar — Foire Internationale de l\'Agriculture et des Ressources Animales',
        acronym: 'FIARA Dakar',
        country: 'Sénégal',
        countryFlag: '🇸🇳',
        city: 'Dakar',
        venue: 'CICES Dakar',
        dates: '28 Mai – 12 Juin 2026',
        sector: 'Agriculture, Élevage, Matériel Agricole & Semences',
        organizer: 'CNCR Sénégal & Ministère de l\'Agriculture',
        officialWebsiteUrl: 'https://www.fiara.sn',
        registrationDeadline: '30 Avril 2026',
        expectedExhibitors: '1 200 exposants ouest-africains',
        expectedVisitors: '150 000 visiteurs',
        isRegistered: true,
        studioPreparationItems: [
            { id: 'prep-fiara-1', label: 'Affichets Tarifs Préférentiels CEDEAO', type: 'rollup', isGenerated: true }
        ]
    }
];

export const MOCK_BUSINESS_CLUBS: BusinessClubCommunity[] = [
    {
        id: 'club-afrique-chine',
        name: 'Club d\'Affaires B2B Afrique ↔ Chine',
        bannerUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600',
        corridorOrSector: 'Corridor Asie - Afrique',
        membersCount: 1420,
        description: 'Cercle professionnel d\'importateurs africains, directeurs d\'usines chinoises, transitaires et agents bilingues à Canton, Yiwu et Shenzhen.',
        upcomingEventsCount: 4,
        activeDiscussionsCount: 38,
        isJoined: true,
        tags: ['Import Direct', 'Audit Usines', 'Foire de Canton', 'Paiement RMB / EUR']
    },
    {
        id: 'club-pharma-sante',
        name: 'Cercle des Distributeurs Pharma & Santé Ouest-Africain',
        bannerUrl: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=600',
        corridorOrSector: 'Santé & Dispositifs Médicaux',
        membersCount: 890,
        description: 'Réseau de pharmaciens, grossistes répartiteurs, importateurs d\'équipements hospitaliers et fabricants certifiés BPF.',
        upcomingEventsCount: 2,
        activeDiscussionsCount: 19,
        isJoined: true,
        tags: ['Dispositifs Médicaux', 'Agrément DPM', 'Chambre Froide', 'Commandes Groupées']
    },
    {
        id: 'club-agro-export',
        name: 'Alliance des Exportateurs Agro & Produits Tropicaux',
        bannerUrl: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600',
        corridorOrSector: 'Agroalimentaire & Produits d\'Origine',
        membersCount: 1150,
        description: 'Coopératives de café/cacao/ananas, acheteurs européens bio, transitaires maritimes et spécialistes de la certification Ecocert.',
        upcomingEventsCount: 3,
        activeDiscussionsCount: 27,
        isJoined: false,
        tags: ['Café de Spécialité', 'Cacao Bio', 'ZLECAF', 'Fret Frigorifique']
    }
];

export const MOCK_EXPORT_OPPORTUNITY_ANALYSIS: ExportOpportunityAnalysis = {
    id: 'export-opp-01',
    userProduct: 'Café Arabica Grand Cru & Fèves de Cacao Biologique de Guinée Forestière',
    originCountry: 'Guinée',
    targetMarkets: [
        {
            country: 'France',
            flag: '🇫🇷',
            demandIndex: 94,
            tariffRate: '0% (Accords Tout Sauf les Armes / UE)',
            marketSizeEstimate: '380 M€ / an pour le segment café de spécialité',
            regulatoryRequirements: ['Certificat Phytosanitaire officiel', 'Traçabilité déforestation zéro (EUDR)', 'Certificat Ecocert Bio'],
            recommendedStrategy: 'Vente directe aux torréfacteurs indépendants et salons de spécialité à Paris et Lyon avec marge brute de 32%.',
            isSourceFactOrEstimation: 'source_verifiee'
        },
        {
            country: 'Allemagne',
            flag: '🇩🇪',
            demandIndex: 91,
            tariffRate: '0% (Accords UE-ACP)',
            marketSizeEstimate: '650 M€ / an (plus grand importateur de café vert en Europe)',
            regulatoryRequirements: ['Contrôle résidus pesticides < 0.01 mg/kg', 'Enregistrement acheteur Hamburg Coffee Exchange'],
            recommendedStrategy: 'Approche des négociants du Port de Hambourg pour des volumes conteneurs 20ft complets (FCL).',
            isSourceFactOrEstimation: 'source_verifiee'
        },
        {
            country: 'Sénégal & Côte d\'Ivoire (Régional)',
            flag: '🌍',
            demandIndex: 82,
            tariffRate: '0% (Tarif Extérieur Commun CEDEAO / ZLECAF)',
            marketSizeEstimate: '45 M€ / an (hôtellerie haut de gamme et supermarchés)',
            regulatoryRequirements: ['Certificat d\'Origine CEDEAO', 'Étiquetage multilingue Français/Anglais'],
            recommendedStrategy: 'Distribution en paquets de 250g et 1kg torréfiés et moulus dans les chaînes de supermarchés régionales.',
            isSourceFactOrEstimation: 'estimation_statistique'
        }
    ]
};

// ══════════════════════════════════════════════════════════════════════════
// MOK TRUST — CONSTANTES DE CONFIANCE, SÉCURITÉ & LITIGES (ÉTAPE 5/7)
// ══════════════════════════════════════════════════════════════════════════

export const MOCK_MOK_TRUST_BADGES: MokTrustBadge[] = [
  {
    type: 'identity_verified',
    label: 'Identité vérifiée',
    description: 'Passeport biométrique / Pièce d\'identité officielle certifiée avec contrôle facial de vivacité.',
    isObtained: true,
    verifiedAt: '12 Jan 2026',
    issuerOrProvider: 'Mok Trust Identity Gateway'
  },
  {
    type: 'company_verified',
    label: 'Entreprise vérifiée',
    description: 'Immatriculation juridique RCCM / Registre du Commerce et existence légale authentifiée auprès du greffe.',
    isObtained: true,
    verifiedAt: '18 Jan 2026',
    issuerOrProvider: 'Greffe Commercial & API OpenCorpo'
  },
  {
    type: 'business_address_verified',
    label: 'Adresse commerciale vérifiée',
    description: 'Siège social et entrepôts physiques géolocalisés et validés par justificatif de bail et facture d\'énergie.',
    isObtained: true,
    verifiedAt: '22 Jan 2026',
    issuerOrProvider: 'Inspection Territoriale Mok Trust'
  },
  {
    type: 'payout_account_verified',
    label: 'Compte de paiement vérifié',
    description: 'Compte bancaire professionnel et passerelle de séquestre (Escrow) certifiés conformes AML/CFT.',
    isObtained: true,
    verifiedAt: '25 Jan 2026',
    issuerOrProvider: 'Stripe & Pan-African Settlement Network'
  },
  {
    type: 'license_verified',
    label: 'Licence d\'exportation vérifiée',
    description: 'Agrément ministériel du commerce extérieur et autorisations phytosanitaires / sanitaires en cours de validité.',
    isObtained: true,
    verifiedAt: '02 Fév 2026',
    issuerOrProvider: 'Ministère du Commerce & Douanes'
  },
  {
    type: 'expert_verified',
    label: 'Expert certifié Diallo OS',
    description: 'Accréditation professionnelle collégiale délivrée après revue des compétences et antécédents.',
    isObtained: false,
    issuerOrProvider: 'Comité de Gouvernance Diallo OS'
  }
];

export const MOCK_KYC_DOCUMENTS: KycDocument[] = [
  {
    id: 'kyc-doc-1',
    title: 'Extrait RCCM / Kbis - Enregistrement Commercial',
    documentType: 'rccm_kbis',
    documentNumber: 'GN.TCC.2023.B.4891',
    issuedCountry: 'Guinée',
    issuedAt: '15/03/2023',
    expiresAt: '15/03/2027',
    status: 'valide',
    fileSize: '2.4 MB',
    confidentialityLevel: 'strictly_confidential',
    sha256Hash: '9a7f3c4e...8810e2'
  },
  {
    id: 'kyc-doc-2',
    title: 'Passeport International du Représentant Légal',
    documentType: 'passport',
    documentNumber: 'N° O12849021',
    issuedCountry: 'Guinée',
    issuedAt: '10/06/2022',
    expiresAt: '09/06/2027',
    status: 'valide',
    fileSize: '1.8 MB',
    confidentialityLevel: 'strictly_confidential',
    sha256Hash: '3d81b4f0...aa29c4'
  },
  {
    id: 'kyc-doc-3',
    title: 'Attestation de Régularité Fiscale (NIF & Quitus)',
    documentType: 'tax_certificate',
    documentNumber: 'NIF-009481029-TX',
    issuedCountry: 'Guinée',
    issuedAt: '05/01/2026',
    expiresAt: '31/12/2026',
    status: 'valide',
    fileSize: '1.2 MB',
    confidentialityLevel: 'restricted',
    sha256Hash: 'f4128ab1...9190ce'
  },
  {
    id: 'kyc-doc-4',
    title: 'Licence d\'Exportation Produits Agricoles & Denrées',
    documentType: 'commercial_license',
    documentNumber: 'EXP-AGRO-2025-091',
    issuedCountry: 'Guinée',
    issuedAt: '01/02/2025',
    expiresAt: '31/01/2026',
    status: 'renouvellement_requis',
    rejectionReason: 'Date d\'expiration dépassée. Veuillez uploader le renouvellement délivré par le Ministère du Commerce.',
    fileSize: '3.1 MB',
    confidentialityLevel: 'restricted',
    sha256Hash: '88cde992...33bfa1'
  },
  {
    id: 'kyc-doc-5',
    title: 'Pouvoir & Délégation de Signature Mandatée',
    documentType: 'power_of_attorney',
    documentNumber: 'POA-2026-ADM',
    issuedCountry: 'Guinée',
    issuedAt: '14/01/2026',
    expiresAt: '14/01/2028',
    status: 'valide',
    fileSize: '1.5 MB',
    confidentialityLevel: 'strictly_confidential',
    sha256Hash: 'bb90451a...cc4821'
  }
];

export const MOCK_COMPANY_KYB_PROFILE: CompanyKybProfile = {
  id: 'kyb-diallo-group',
  legalName: 'DIALLO AGRO-INDUSTRIES & TRADE GLOBAL SARLU',
  tradeName: 'Diallo Agro Export',
  country: 'Guinée',
  countryFlag: '🇬🇳',
  registrationNumber: 'RCCM / GN.TCC.2023.B.4891',
  taxIdentificationNumber: 'NIF 009481029 / TVA-GN',
  headquartersAddress: 'Immeuble Al-Baraka, 4ème étage, Boulevard du Commerce, Kaloum, Conakry',
  verifiedAddress: true,
  legalRepresentative: {
    fullName: 'Amadou Diallo',
    role: 'Gérant Statutaire & Fondateur',
    isAuthorizedSignatory: true,
    mandateDocumentVerified: true,
    identityVerified: true
  },
  payoutAccount: {
    bankName: 'Banque Internationale pour le Commerce (BICIGUI)',
    ibanOrAccountMasked: 'GN94 •••• •••• •••• 4892',
    accountHolder: 'DIALLO AGRO-INDUSTRIES SARLU',
    isVerifiedByPaymentProvider: true,
    providerName: 'Système de Séquestre Bancaire Pan-Africain'
  },
  kybVerificationLevel: 3, // Entreprise vérifiée
  lastReverificationDate: '25 Janvier 2026',
  nextScheduledAudit: '25 Janvier 2027'
};

export const MOCK_SECURITY_SESSIONS: SecuritySession[] = [
  {
    id: 'session-curr',
    deviceName: 'MacBook Pro 16" (M3 Max)',
    browser: 'Chrome 131.0',
    ipAddress: '197.149.88.42',
    location: 'Conakry, Guinée',
    isCurrentDevice: true,
    isKnownDevice: true,
    lastActive: 'En cours (Session active)',
    mfaMethod: 'authenticator_app'
  },
  {
    id: 'session-mobile',
    deviceName: 'iPhone 16 Pro Max',
    browser: 'Diallo OS Mobile App',
    ipAddress: '197.149.88.42',
    location: 'Conakry, Guinée',
    isCurrentDevice: false,
    isKnownDevice: true,
    lastActive: 'Il y a 35 minutes',
    mfaMethod: 'security_key'
  },
  {
    id: 'session-office',
    deviceName: 'Dell XPS 15 - Bureau Kaloum',
    browser: 'Firefox Developer 132',
    ipAddress: '41.220.12.18',
    location: 'Conakry, Guinée',
    isCurrentDevice: false,
    isKnownDevice: true,
    lastActive: 'Hier à 17:40',
    mfaMethod: 'sms_otp'
  }
];

export const MOCK_INTERNAL_RISK_SIGNALS: InternalRiskSignal[] = [
  {
    id: 'signal-1',
    title: 'Changement de compte de virement bancaire récemment initié',
    type: 'payout_change',
    scoreLevel: 'modere',
    description: 'Une modification des coordonnées IBAN a été enregistrée avec validation 2FA réussie. Période de préavis de sécurité de 48h active.',
    detectedAt: 'Hier à 14:15',
    requiresHumanReview: false,
    status: 'investigating'
  },
  {
    id: 'signal-2',
    title: 'Volume de commandes B2B en hausse de +45% sur 14 jours',
    type: 'velocity',
    scoreLevel: 'faible',
    description: 'Augmentation normale liée à la participation au Salon Virtuel International. Vérifications KYC acheteurs OK.',
    detectedAt: 'Il y a 3 jours',
    requiresHumanReview: false,
    status: 'cleared'
  }
];

export const MOCK_PRODUCT_COMPLIANCE_POLICIES: ProductCompliancePolicy[] = [
  {
    id: 'pol-pharma',
    categoryName: 'Médicaments & Dispositifs Médicaux',
    status: 'soumis_verification',
    description: 'Exige une autorisation de mise sur le marché (AMM), un certificat de conformité BPF/GMP et un pharmacien responsable mandaté.',
    mandatoryDocuments: ['AMM / Autorisation Ministérielle', 'Certificat BPF / GMP', 'Attestation de stockage en chaîne du froid'],
    restrictedCountries: ['Tous pays sans agrément sanitaire'],
    penaltyDetails: 'Retrait immédiat de l\'annonce et suspension du compte en cas de récidive.'
  },
  {
    id: 'pol-agro',
    categoryName: 'Agroalimentaire & Denrées Périssables',
    status: 'autorise',
    description: 'Certificat phytosanitaire requis pour l\'exportation hors zone de production.',
    mandatoryDocuments: ['Certificat Phytosanitaire', 'Traçabilité Lot & Date Limite (DLC/DLUO)'],
    restrictedCountries: ['Selon embargo phytosanitaire spécifique'],
    penaltyDetails: 'Gel de la cargaison au port de chargement.'
  },
  {
    id: 'pol-minerals',
    categoryName: 'Minerais & Métaux Précieux',
    status: 'soumis_verification',
    description: 'Conformité au Processus de Kimberley et certificat d\'origine minier étatique obligatoire.',
    mandatoryDocuments: ['Certificat de Kimberley', 'Quitus Douanier des Mines', 'Rapport d\'analyse en laboratoire agréé'],
    restrictedCountries: ['Zones de conflit sous sanctions ONU'],
    penaltyDetails: 'Signalement aux autorités judiciaires et gel des avoirs.'
  },
  {
    id: 'pol-forbidden',
    categoryName: 'Produits Contrefaits & Armes / Matières Dangereuses',
    status: 'interdit',
    description: 'Stricte interdiction sur l\'ensemble du Marché Mondial.',
    mandatoryDocuments: [],
    restrictedCountries: ['Mondial (Interdiction absolue)'],
    penaltyDetails: 'Exclusion définitive et transmission du dossier aux autorités compétentes.'
  }
];

export const MOCK_COUNTERFEIT_REPORTS: CounterfeitReport[] = [
  {
    id: 'rep-ip-01',
    targetListingId: 'prod-mock-fake-01',
    targetProductTitle: 'Montres Connectées Sport Luxe Logo Marque Déposée',
    targetSellerName: 'Global Wholesale Discounter Ltd',
    reportedBy: 'Cabinet Juridique Novitas & Associés (Mandataire Propriété Intellectuelle)',
    rightHolderOrganization: 'Swiss Brand Watchmaking Holding SA',
    intellectualPropertyType: 'trademark',
    evidenceDescription: 'Usage non autorisé de notre marque déposée N° OMPI 849102. Photos d\'usine montrant une contrefaçon manifeste.',
    supportingUrls: ['https://wipo.int/branddb/849102', 'https://brand-protection.ch/dossier/9012'],
    reportedAt: '14 Février 2026',
    status: 'retire_par_moderation',
    sellerResponseText: 'Le produit a été retiré de notre inventaire dès réception de la notification.',
    legalResolutionNotes: 'Annonce retirée. Vendeur sous avertissement Niveau 1 avec obligation de certification des stocks.'
  }
];

export const MOCK_MULTIDIMENSIONAL_REPUTATION: MultidimensionalReputation = {
  overallScore: 97,
  totalOrdersCompleted: 142,
  incidentFreeRatePercent: 98.6,
  yearsOfTenure: 3,
  dimensionScores: {
    conformity: 4.9,
    timeliness: 4.8,
    communication: 5.0,
    perceivedQuality: 4.9,
    disputeResolutionSpeed: 4.7
  },
  publicReliabilityVerdict: 'Excellente'
};

export const MOCK_VERIFIED_REVIEWS: VerifiedTransactionReview[] = [
  {
    id: 'rev-01',
    transactionId: 'tx-ord-88901',
    orderNumber: 'CMD-2026-0891',
    productTitle: 'Café Arabica Grand Cru - 1 Conteneur 20ft (18 Tonnes)',
    reviewerName: 'Laurent Mercier',
    reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    reviewerCountry: 'France (Torréfaction Mercier)',
    isVerifiedPurchase: true,
    rating: 5,
    ratingsPerDimension: {
      conformity: 5,
      timeliness: 5,
      communication: 5,
      quality: 5
    },
    reviewText: 'Qualité de fèves exceptionnelle ! Humidité contrôlée à 11.2% à l\'arrivée au port du Havre. Documents phytosanitaires et connaissement maritime reçus sans aucun retard. Partenaire d\'une grande rigueur.',
    createdAt: 'Il y a 2 semaines',
    sellerReply: {
      author: 'Amadou Diallo (Diallo Agro Export)',
      text: 'Merci beaucoup Laurent pour votre confiance renouvelée. La récolte suivante sera préparée avec le même niveau d\'exigence.',
      repliedAt: 'Il y a 12 jours'
    },
    isFlaggedSuspicious: false
  },
  {
    id: 'rev-02',
    transactionId: 'tx-ord-88402',
    orderNumber: 'CMD-2026-0640',
    productTitle: 'Beurre de Karité Brut Pur & Bio (500 kg)',
    reviewerName: 'Khadija Benali',
    reviewerAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    reviewerCountry: 'Maroc (Laboratoires Bio-Atlas)',
    isVerifiedPurchase: true,
    rating: 5,
    ratingsPerDimension: {
      conformity: 5,
      timeliness: 4.5,
      communication: 5,
      quality: 5
    },
    reviewText: 'Texture parfaite et filtrage impeccable. Petit décalage de 48h au transbordement d\'Abidjan mais le suivi en temps réel et la communication permanente avec l\'équipe Diallo ont rendu l\'opération très sereine.',
    createdAt: 'Il y a 1 mois',
    sellerReply: {
      author: 'Amadou Diallo',
      text: 'Ravis de collaborer avec les Laboratoires Bio-Atlas. Nous avons renforcé nos créneaux maritimes prioritaires.',
      repliedAt: 'Il y a 28 jours'
    },
    isFlaggedSuspicious: false
  }
];

export const MOCK_TRADE_DISPUTE_CASES: TradeDisputeCase[] = [
  {
    id: 'disp-2026-0042',
    orderNumber: 'CMD-2026-0914',
    transactionId: 'tx-ord-99120',
    productTitle: 'Pompes Solaires Submersibles Haute Pression 5.5kW (Lot de 6)',
    productImageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
    amount: 14800,
    currency: 'EUR',
    disputeType: 'dommage',
    stage: 'mediation_diallo_os',
    buyerName: 'Coopérative Agricole du Fouta',
    buyerEmail: 'coop-fouta@trade.gn',
    sellerName: 'Helios Energy Solutions SA',
    sellerEmail: 'contact@helios-energy.com',
    openedAt: '18 Février 2026',
    claimantDemand: 'remplacement',
    proposedSettlementAmount: 2400,
    description: 'Lors du dépotage du conteneur au centre logistique de Mamou, le carter de protection de 2 pompes sur les 6 livrées présentait des fissures suite à un arrimage insuffisant en cale.',
    evidenceDocs: [
      {
        name: 'Constat d\'avarie contradictoire au dépotage.pdf',
        type: 'inspection_report',
        url: '#',
        uploadedBy: 'Expert Commissaire d\'Avarie Agréé'
      },
      {
        name: 'Photos HD des carters fissurés.jpg',
        type: 'photo',
        url: '#',
        uploadedBy: 'Acheteur (Coopérative du Fouta)'
      },
      {
        name: 'Connaissement maritime avec réserves.pdf',
        type: 'bl_signed',
        url: '#',
        uploadedBy: 'Transitaire Maritime'
      }
    ],
    timeline: [
      {
        id: 't-1',
        date: '18 Fév 2026 - 09:30',
        author: 'Coopérative du Fouta',
        role: 'buyer',
        action: 'Ouverture du dossier de litige',
        details: 'Demande de remplacement ou prise en charge sous garantie des 2 unités endommagées.'
      },
      {
        id: 't-2',
        date: '19 Fév 2026 - 11:00',
        author: 'Helios Energy Solutions',
        role: 'seller',
        action: 'Réponse initiale du vendeur',
        details: 'Proposition d\'envoi de 2 carters neufs par fret aérien express avec remboursement partiel de 800 EUR.'
      },
      {
        id: 't-3',
        date: '20 Fév 2026 - 15:45',
        author: 'Diallo OS Mediation Engine',
        role: 'diallo_ai',
        action: 'Synthèse objective et proposition de compromis',
        details: 'Analyse comparative des coûts : l\'envoi de 2 pièces de rechange certifiées sous 5 jours + prise en charge de la main d\'œuvre locale d\'installation (2 400 EUR pris en charge par l\'assurance transport) satisfait les deux parties sans bloquer l\'exploitation agricole.'
      }
    ],
    dialloMediationSummary: {
      factsSummary: 'Livraison de 6 pompes de 5.5kW : 4 unités sont en parfait état de fonctionnement et opérationnelles ; 2 unités ont subi un dommage mécanique sur le boîtier externe sans atteinte constatée au moteur.',
      agreedPoints: [
        'Le dommage a été causé pendant le transit maritime (Incoterm CIF).',
        'L\'assurance transport tous risques souscrite couvre les avaries de manutention.',
        'La coopérative a un besoin immédiat d\'irrigation pour la saison sèche.'
      ],
      disputedPoints: [
        'L\'acheteur souhaitait le renvoi d\'un groupe complet neuf (délai 45 jours), le vendeur propose le remplacement du carter sous 5 jours.'
      ],
      suggestedCompromises: [
        'Option A : Expédition immédiate par fret aérien express des 2 carters et accessoires aux frais de l\'assureur + bon d\'achat de 1 000 EUR.',
        'Option B : Remplacement intégral d\'une unité complète en stock au hub régional de Dakar sous 72h.',
        'Option C : Remboursement direct sur le compte séquestre de 4 800 EUR pour les 2 unités.'
      ],
      disclaimer: 'Diallo OS agit en assistant neutre de conciliation. Cet avis ne constitue pas un jugement judiciaire et les parties restent libres d\'engager une médiation humaine ou un arbitrage OHADA.'
    },
    canAppeal: true
  }
];

export const MOCK_SECURITY_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: 'log-01',
    action: 'Validation du dossier KYB Entreprise (RCCM & NIF)',
    category: 'kyc_kyb',
    actorName: 'Agent Contrôle Conformité Mok Trust',
    actorRole: 'compliance_officer',
    timestamp: '25 Jan 2026 à 16:42',
    ipAddress: '10.0.4.12 (Réseau Sécurisé)',
    status: 'reussi',
    details: 'Vérification automatique des registres légaux complétée avec succès.'
  },
  {
    id: 'log-02',
    action: 'Authentification forte MFA par application validée',
    category: 'auth',
    actorName: 'Amadou Diallo',
    actorRole: 'user',
    timestamp: 'Aujourd\'hui à 08:15',
    ipAddress: '197.149.88.42',
    status: 'reussi',
    details: 'Connexion depuis le poste de travail principal.'
  },
  {
    id: 'log-03',
    action: 'Analyse préventive d\'une annonce commerciale',
    category: 'listing_moderation',
    actorName: 'Mok Trust Sentinel AI',
    actorRole: 'system_sentinel',
    timestamp: 'Hier à 22:10',
    ipAddress: 'Interne',
    status: 'reussi',
    details: '0 anomalie de prix ou duplication détectée sur le catalogue agro-export.'
  }
];

// ══════════════════════════════════════════════════════════════════════════════
// ÉTAPE 6/7 : BUSINESS OS MONDIAL MOCK DATA
// ══════════════════════════════════════════════════════════════════════════════

export const MOCK_WAREHOUSES: Warehouse[] = [
  {
    id: 'wh-conakry',
    name: 'Hub Logistique Portuaire de Conakry (Principal)',
    type: 'principal',
    country: 'Guinée',
    city: 'Conakry',
    address: 'Zone Portuaire Autonome, Hangar 4B',
    managerName: 'Ibrahima Camara',
    totalCapacityUnits: 15000,
    currentOccupiedUnits: 9800,
    status: 'actif'
  },
  {
    id: 'wh-dakar',
    name: 'Dépôt Régional & Showroom Dakar',
    type: 'magasin',
    country: 'Sénégal',
    city: 'Dakar',
    address: 'Avenue Malick Sy, Bel-Air',
    managerName: 'Moussa Diouf',
    totalCapacityUnits: 5000,
    currentOccupiedUnits: 2850,
    status: 'actif'
  },
  {
    id: 'wh-abidjan',
    name: 'Entrepôt Vridi Transit Hub',
    type: 'depot',
    country: 'Côte d\'Ivoire',
    city: 'Abidjan',
    address: 'Zone Industrielle Vridi, Quai 2',
    managerName: 'Koffi Yao',
    totalCapacityUnits: 8000,
    currentOccupiedUnits: 4300,
    status: 'actif'
  },
  {
    id: 'wh-paris',
    name: 'Plateforme Stock Partenaire Paris-Nord',
    type: 'partenaire',
    country: 'France',
    city: 'Gonesse (Roissy)',
    address: 'Parc des Expositions Nord, Entrepôt B12',
    managerName: 'Sophie Marchand',
    totalCapacityUnits: 4000,
    currentOccupiedUnits: 1650,
    status: 'actif'
  },
  {
    id: 'wh-guangzhou',
    name: 'Hub Consolidation Export Chine',
    type: 'international',
    country: 'Chine',
    city: 'Guangzhou',
    address: 'Baiyun Logistics District, Bay 19',
    managerName: 'Chen Wei',
    totalCapacityUnits: 20000,
    currentOccupiedUnits: 11200,
    status: 'actif'
  }
];

export const MOCK_STOCK_ITEMS: StockItem[] = [
  {
    id: 'stk-01',
    productId: 'p-cacao-bio',
    sku: 'AGR-CAC-BIO-01',
    title: 'Fèves de Cacao Biologique Fermenté Grade 1',
    category: 'Matières Premières & Agroalimentaire',
    imageUrl: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600',
    variant: {
      packaging: 'Sacs Jute 65kg',
      grade: 'Grade 1 Premium Export'
    },
    physicalQuantity: 5800,
    reservedQuantity: 1200,
    availableQuantity: 4600,
    inTransitQuantity: 3000,
    damagedOrBlockedQuantity: 50,
    alertThreshold: 1500,
    unitCost: 2800,
    sellingPrice: 3950,
    currency: 'USD',
    tierPricing: [
      { minQuantity: 1, maxQuantity: 49, unitPrice: 4200, currency: 'USD', label: 'Petits lots' },
      { minQuantity: 50, maxQuantity: 499, unitPrice: 3950, currency: 'USD', label: 'Grossiste B2B' },
      { minQuantity: 500, unitPrice: 3600, currency: 'USD', label: 'Volume Conteneur FCL' }
    ],
    warehouseQuantities: [
      { warehouseId: 'wh-conakry', warehouseName: 'Hub Portuaire Conakry', country: 'Guinée', quantity: 3200 },
      { warehouseId: 'wh-dakar', warehouseName: 'Dépôt Régional Dakar', country: 'Sénégal', quantity: 1100 },
      { warehouseId: 'wh-abidjan', warehouseName: 'Entrepôt Vridi Hub', country: 'Côte d\'Ivoire', quantity: 1500 }
    ],
    forecastDaysUntilStockout: 28,
    reorderQuantitySuggested: 4000,
    preferredSupplierId: 'sup-coop-forestiere',
    preferredSupplierName: 'Coopérative Agro-Forestière de Guinée',
    supplierLeadTimeDays: 14,
    lastRestockedAt: '12 Fév 2026',
    qrCode: 'QR-AGR-CAC-BIO-01'
  },
  {
    id: 'stk-02',
    productId: 'p-pompe-solaire',
    sku: 'NRG-SOL-PUMP-5K',
    title: 'Kit Pompe Solaire d\'Irrigation 5.5kW Triphasé',
    category: 'Énergies Renouvelables & Machinisme',
    imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?w=600',
    variant: {
      model: '5.5kW Submersible',
      packaging: 'Caisse bois renforcée maritime'
    },
    physicalQuantity: 42,
    reservedQuantity: 18,
    availableQuantity: 24,
    inTransitQuantity: 30,
    damagedOrBlockedQuantity: 2,
    alertThreshold: 15,
    unitCost: 1950,
    sellingPrice: 3200,
    currency: 'EUR',
    tierPricing: [
      { minQuantity: 1, maxQuantity: 5, unitPrice: 3400, currency: 'EUR', label: 'Unitaire' },
      { minQuantity: 6, maxQuantity: 19, unitPrice: 3200, currency: 'EUR', label: 'Projets Coopératives' },
      { minQuantity: 20, unitPrice: 2850, currency: 'EUR', label: 'Appels d\'offres & ONG' }
    ],
    warehouseQuantities: [
      { warehouseId: 'wh-conakry', warehouseName: 'Hub Portuaire Conakry', country: 'Guinée', quantity: 18 },
      { warehouseId: 'wh-dakar', warehouseName: 'Dépôt Régional Dakar', country: 'Sénégal', quantity: 14 },
      { warehouseId: 'wh-paris', warehouseName: 'Stock Paris-Nord', country: 'France', quantity: 10 }
    ],
    forecastDaysUntilStockout: 9,
    reorderQuantitySuggested: 50,
    preferredSupplierId: 'sup-helios-tech',
    preferredSupplierName: 'Helios Industrial Solar Ltd (Ningbo)',
    supplierLeadTimeDays: 25,
    lastRestockedAt: '20 Jan 2026',
    qrCode: 'QR-NRG-SOL-PUMP-5K'
  },
  {
    id: 'stk-03',
    productId: 'p-huile-argan',
    sku: 'COS-ARG-BIO-L1',
    title: 'Huile d\'Argan Vierge Extra Bio Cosmétique (Bidon 25L)',
    category: 'Cosmétiques & Huiles Précieuses',
    imageUrl: 'https://images.unsplash.com/photo-1608248597359-59749fb603a4?w=600',
    variant: {
      packaging: 'Fût PEHD 25 Litres',
      grade: 'Bio Certifié Ecocert / USDA'
    },
    physicalQuantity: 340,
    reservedQuantity: 40,
    availableQuantity: 300,
    inTransitQuantity: 120,
    damagedOrBlockedQuantity: 0,
    alertThreshold: 80,
    unitCost: 18,
    sellingPrice: 32,
    currency: 'EUR',
    tierPricing: [
      { minQuantity: 1, maxQuantity: 9, unitPrice: 35, currency: 'EUR', label: 'Au litre/bidon' },
      { minQuantity: 10, maxQuantity: 99, unitPrice: 32, currency: 'EUR', label: 'Laboratoires & Artisans' },
      { minQuantity: 100, unitPrice: 26.5, currency: 'EUR', label: 'Industriel Cosmétique' }
    ],
    warehouseQuantities: [
      { warehouseId: 'wh-paris', warehouseName: 'Stock Paris-Nord', country: 'France', quantity: 160 },
      { warehouseId: 'wh-dakar', warehouseName: 'Dépôt Régional Dakar', country: 'Sénégal', quantity: 80 },
      { warehouseId: 'wh-abidjan', warehouseName: 'Entrepôt Vridi Hub', country: 'Côte d\'Ivoire', quantity: 100 }
    ],
    forecastDaysUntilStockout: 45,
    reorderQuantitySuggested: 200,
    preferredSupplierId: 'sup-atlas-bio',
    preferredSupplierName: 'Atlas Bio-Export SARL (Agadir)',
    supplierLeadTimeDays: 10,
    lastRestockedAt: '05 Fév 2026',
    qrCode: 'QR-COS-ARG-BIO-L1'
  },
  {
    id: 'stk-04',
    productId: 'p-fonio-precuit',
    sku: 'AGR-FON-PRE-01',
    title: 'Fonio Précuit Biologique Sans Gluten (Cartons 20x500g)',
    category: 'Matières Premières & Agroalimentaire',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600',
    variant: {
      packaging: 'Carton Master 10kg',
      grade: 'Export Europe & USA'
    },
    physicalQuantity: 120,
    reservedQuantity: 95,
    availableQuantity: 25,
    inTransitQuantity: 600,
    damagedOrBlockedQuantity: 5,
    alertThreshold: 100,
    unitCost: 22,
    sellingPrice: 39,
    currency: 'USD',
    tierPricing: [
      { minQuantity: 1, maxQuantity: 20, unitPrice: 42, currency: 'USD', label: 'Épiceries Fines' },
      { minQuantity: 21, maxQuantity: 199, unitPrice: 39, currency: 'USD', label: 'Distributeurs Bio' },
      { minQuantity: 200, unitPrice: 33, currency: 'USD', label: 'Palettes Supermarchés' }
    ],
    warehouseQuantities: [
      { warehouseId: 'wh-conakry', warehouseName: 'Hub Portuaire Conakry', country: 'Guinée', quantity: 70 },
      { warehouseId: 'wh-paris', warehouseName: 'Stock Paris-Nord', country: 'France', quantity: 50 }
    ],
    forecastDaysUntilStockout: 4,
    reorderQuantitySuggested: 800,
    preferredSupplierId: 'sup-coop-fonio',
    preferredSupplierName: 'GIE Fonio Fouta Développement',
    supplierLeadTimeDays: 8,
    lastRestockedAt: '18 Jan 2026',
    qrCode: 'QR-AGR-FON-PRE-01'
  }
];

export const MOCK_STOCK_MOVEMENTS: StockMovement[] = [
  {
    id: 'mv-01',
    date: 'Aujourd\'hui à 11:20',
    productId: 'p-pompe-solaire',
    productSku: 'NRG-SOL-PUMP-5K',
    productTitle: 'Kit Pompe Solaire 5.5kW',
    type: 'reservation',
    quantity: -4,
    originLocation: 'wh-conakry (Allée B, Rangement 14)',
    destinationLocation: 'Commande CMD-2026-904',
    referenceDoc: 'CMD-2026-904',
    performedBy: 'Système Diallo OS (Réservation Auto)',
    notes: 'Validation commande ferme de la Coopérative Minière'
  },
  {
    id: 'mv-02',
    date: 'Hier à 16:45',
    productId: 'p-cacao-bio',
    productSku: 'AGR-CAC-BIO-01',
    productTitle: 'Fèves de Cacao Biologique',
    type: 'reception_fournisseur',
    quantity: 1500,
    originLocation: 'Fournisseur Coop Agro-Forestière',
    destinationLocation: 'wh-conakry (Zone Vrac B)',
    referenceDoc: 'BL-FOURN-2026-118',
    performedBy: 'Ibrahima Camara (Responsable Quai)',
    notes: 'Conformité humidité 7.2% validée par inspecteur'
  },
  {
    id: 'mv-03',
    date: '24 Fév 2026 à 09:10',
    productId: 'p-huile-argan',
    productSku: 'COS-ARG-BIO-L1',
    productTitle: 'Huile d\'Argan Vierge (Bidon 25L)',
    type: 'transfert',
    quantity: -50,
    originLocation: 'wh-paris',
    destinationLocation: 'wh-dakar',
    referenceDoc: 'TRF-INT-2026-042',
    performedBy: 'Sophie Marchand (Logistique Europe)',
    notes: 'Rééquilibrage stock pour répondre à la demande salon cosmétique'
  },
  {
    id: 'mv-04',
    date: '22 Fév 2026 à 14:30',
    productId: 'p-fonio-precuit',
    productSku: 'AGR-FON-PRE-01',
    productTitle: 'Fonio Précuit Biologique',
    type: 'vente',
    quantity: -60,
    originLocation: 'wh-paris',
    destinationLocation: 'Client Bio-Monde France',
    referenceDoc: 'CMD-2026-882',
    performedBy: 'Diallo OS Order Fulfillment',
    notes: 'Expédition Chronopost fret validée'
  }
];

export const MOCK_SUPPLIERS: SupplierItem[] = [
  {
    id: 'sup-coop-forestiere',
    companyName: 'Coopérative Agro-Forestière de Guinée (CAF-G)',
    contactPerson: 'Mamadou Bhoye Diallo',
    email: 'contact@caf-guinee.org',
    phone: '+224 622 88 99 00',
    country: 'Guinée',
    city: 'Nzérékoré',
    category: 'Producteur Agricole & Matières Premières',
    suppliedProducts: [
      {
        productId: 'p-cacao-bio',
        productTitle: 'Fèves de Cacao Bio Grade 1',
        sku: 'AGR-CAC-BIO-01',
        unitCost: 2800,
        currency: 'USD',
        minOrderQty: 500,
        observedLeadTimeDays: 12
      }
    ],
    ratings: {
      priceCompetitiveness: 4.8,
      leadTimeRespect: 4.6,
      qualityConformity: 4.9,
      communication: 4.7,
      disputeRate: 0.5
    },
    totalOrdersCount: 24,
    totalSpent: 145000,
    currency: 'USD',
    paymentTerms: '30% Acompte à la commande, 70% sous Escrow à l\'embarquement',
    kybStatus: 'certifie',
    notes: 'Fournisseur historique certifié équitable et biologique. Très haute régularité.'
  },
  {
    id: 'sup-helios-tech',
    companyName: 'Helios Industrial Solar Ltd',
    contactPerson: 'David Zhang',
    email: 'export@helios-solar.cn',
    phone: '+86 574 8899 1234',
    country: 'Chine',
    city: 'Ningbo',
    category: 'Fabricant Machinisme & Énergies',
    suppliedProducts: [
      {
        productId: 'p-pompe-solaire',
        productTitle: 'Kit Pompe Solaire 5.5kW Triphasé',
        sku: 'NRG-SOL-PUMP-5K',
        unitCost: 1950,
        currency: 'EUR',
        minOrderQty: 10,
        observedLeadTimeDays: 24
      }
    ],
    ratings: {
      priceCompetitiveness: 4.9,
      leadTimeRespect: 4.3,
      qualityConformity: 4.7,
      communication: 4.4,
      disputeRate: 1.8
    },
    totalOrdersCount: 16,
    totalSpent: 182000,
    currency: 'EUR',
    paymentTerms: 'Crédit Documentaire Irrégulier L/C ou Séquestre Mok Trust',
    kybStatus: 'certifie',
    notes: 'Usine conforme ISO9001 et TUV Rheinland. Prévoir 3 semaines de transit maritime.'
  },
  {
    id: 'sup-atlas-bio',
    companyName: 'Atlas Bio-Export SARL',
    contactPerson: 'Laila Benkiran',
    email: 'direction@atlas-bio.ma',
    phone: '+212 528 22 33 44',
    country: 'Maroc',
    city: 'Agadir',
    category: 'Extraction Huiles & Matières Cosmétiques',
    suppliedProducts: [
      {
        productId: 'p-huile-argan',
        productTitle: 'Huile d\'Argan Vierge Extra Bio (25L)',
        sku: 'COS-ARG-BIO-L1',
        unitCost: 18,
        currency: 'EUR',
        minOrderQty: 20,
        observedLeadTimeDays: 9
      }
    ],
    ratings: {
      priceCompetitiveness: 4.5,
      leadTimeRespect: 4.9,
      qualityConformity: 4.9,
      communication: 4.8,
      disputeRate: 0.2
    },
    totalOrdersCount: 31,
    totalSpent: 96000,
    currency: 'EUR',
    paymentTerms: 'Virement bancaire 30 jours fin de mois après agréage qualité',
    kybStatus: 'certifie',
    notes: 'Excellente documentation technique (Bulletins d\'analyses, FDS, Ecocert).'
  }
];

export const MOCK_SUPPLIER_ORDERS: SupplierOrder[] = [
  {
    id: 'so-2026-088',
    orderNumber: 'CMD-FOURN-2026-088',
    supplierId: 'sup-helios-tech',
    supplierName: 'Helios Industrial Solar Ltd',
    country: 'Chine (Ningbo)',
    items: [
      {
        sku: 'NRG-SOL-PUMP-5K',
        title: 'Kit Pompe Solaire 5.5kW Triphasé',
        quantity: 30,
        unitCost: 1950,
        totalCost: 58500
      }
    ],
    totalAmount: 58500,
    currency: 'EUR',
    status: 'en_transit',
    paymentStatus: 'sequestre_actif',
    orderedAt: '02 Fév 2026',
    expectedDeliveryDate: '08 Mars 2026',
    targetWarehouseId: 'wh-conakry',
    targetWarehouseName: 'Hub Portuaire Conakry',
    trackingNumber: 'MAERSK-MED-889021',
    incoterm: 'CIF Conakry'
  },
  {
    id: 'so-2026-089',
    orderNumber: 'CMD-FOURN-2026-089',
    supplierId: 'sup-atlas-bio',
    supplierName: 'Atlas Bio-Export SARL',
    country: 'Maroc',
    items: [
      {
        sku: 'COS-ARG-BIO-L1',
        title: 'Huile d\'Argan Vierge Extra Bio (25L)',
        quantity: 120,
        unitCost: 18,
        totalCost: 2160
      }
    ],
    totalAmount: 2160,
    currency: 'EUR',
    status: 'en_production',
    paymentStatus: 'acompte_verse',
    orderedAt: '20 Fév 2026',
    expectedDeliveryDate: '02 Mars 2026',
    targetWarehouseId: 'wh-paris',
    targetWarehouseName: 'Plateforme Stock Paris-Nord',
    incoterm: 'DDP Paris'
  }
];

export const MOCK_BUSINESS_ORDERS: BusinessOrder[] = [
  {
    id: 'bo-1049',
    orderNumber: 'CMD-2026-1049',
    buyerName: 'Coopérative Minière de Boké',
    buyerCompany: 'Consortium Minière SMB-Boké',
    buyerCountry: 'Guinée',
    buyerEmail: 'achats@smb-boke.gn',
    buyerPhone: '+224 628 00 11 22',
    items: [
      {
        sku: 'NRG-SOL-PUMP-5K',
        title: 'Kit Pompe Solaire d\'Irrigation 5.5kW Triphasé',
        quantity: 4,
        unitPrice: 3200,
        totalPrice: 12800,
        warehouseId: 'wh-conakry',
        warehouseName: 'Hub Portuaire Conakry',
        locationCode: 'ALL-B-14',
        isPicked: true,
        isPacked: false
      }
    ],
    totalAmount: 12800,
    currency: 'EUR',
    stage: 'preparation',
    paymentStatus: 'sequestre_bloque',
    paymentMethod: 'Virement Séquestre Garanti Mok Trust',
    incoterm: 'DDP',
    shippingMethod: 'routier',
    createdAt: 'Aujourd\'hui à 08:30',
    deadlinePreparation: 'Aujourd\'hui 18:00',
    documents: [
      { type: 'facture', name: 'Facture_Proforma_1049.pdf', url: '#' },
      { type: 'bl', name: 'Bon_Preparation_1049.pdf', url: '#' }
    ],
    notes: 'Livraison express sur base vie de Boké avec technicien de mise en service'
  },
  {
    id: 'bo-1048',
    orderNumber: 'CMD-2026-1048',
    buyerName: 'Jean-Luc Fontaine',
    buyerCompany: 'Bio-Monde Distribution SAS',
    buyerCountry: 'France',
    buyerEmail: 'jl.fontaine@biomonde.fr',
    items: [
      {
        sku: 'AGR-CAC-BIO-01',
        title: 'Fèves de Cacao Biologique Fermenté Grade 1',
        quantity: 50,
        unitPrice: 3950,
        totalPrice: 197500,
        warehouseId: 'wh-abidjan',
        warehouseName: 'Entrepôt Vridi Hub',
        locationCode: 'VRIDI-Q2',
        isPicked: true,
        isPacked: true
      }
    ],
    totalAmount: 197500,
    currency: 'USD',
    stage: 'expediee',
    paymentStatus: 'sequestre_bloque',
    paymentMethod: 'Crédit Documentaire Irrévocable (L/C Confirmed)',
    incoterm: 'CIF',
    shippingMethod: 'fret_maritime',
    carrierName: 'CMA-CGM West Africa Line',
    trackingNumber: 'CMA-WA-9920194',
    createdAt: '18 Fév 2026',
    shippedAt: '23 Fév 2026',
    documents: [
      { type: 'facture', name: 'Facture_Commerciale_Definitive_1048.pdf', url: '#' },
      { type: 'bl', name: 'Bill_of_Lading_CMA_1048.pdf', url: '#' },
      { type: 'certificat_origine', name: 'Certificat_Origine_EUR1.pdf', url: '#' }
    ]
  },
  {
    id: 'bo-1047',
    orderNumber: 'CMD-2026-1047',
    buyerName: 'Aissatou Sow',
    buyerCompany: 'Pharmacie Centrale de Dakar',
    buyerCountry: 'Sénégal',
    buyerEmail: 'contact@pharmaciedakar.sn',
    items: [
      {
        sku: 'COS-ARG-BIO-L1',
        title: 'Huile d\'Argan Vierge Extra Bio (25L)',
        quantity: 15,
        unitPrice: 32,
        totalPrice: 480,
        warehouseId: 'wh-dakar',
        warehouseName: 'Dépôt Régional Dakar',
        locationCode: 'DKR-ETG-3',
        isPicked: true,
        isPacked: true
      }
    ],
    totalAmount: 480,
    currency: 'EUR',
    stage: 'livree',
    paymentStatus: 'debloque',
    paymentMethod: 'Orange Money Pro & Séquestre',
    incoterm: 'DDP',
    shippingMethod: 'coursier_express',
    carrierName: 'Mok Express Dakar',
    createdAt: '14 Fév 2026',
    shippedAt: '15 Fév 2026',
    deliveredAt: '16 Fév 2026',
    documents: [
      { type: 'facture', name: 'Facture_Acquittee_1047.pdf', url: '#' },
      { type: 'bl', name: 'BL_Emarge_Client_1047.pdf', url: '#' }
    ]
  },
  {
    id: 'bo-1046',
    orderNumber: 'CMD-2026-1046',
    buyerName: 'Kwame Mensah',
    buyerCompany: 'Accra Retail Chain Ltd',
    buyerCountry: 'Ghana',
    buyerEmail: 'kwame@accraretail.gh',
    items: [
      {
        sku: 'AGR-FON-PRE-01',
        title: 'Fonio Précuit Biologique Sans Gluten',
        quantity: 80,
        unitPrice: 39,
        totalPrice: 3120,
        warehouseId: 'wh-conakry',
        warehouseName: 'Hub Portuaire Conakry',
        locationCode: 'ALL-A-02',
        isPicked: false,
        isPacked: false
      }
    ],
    totalAmount: 3120,
    currency: 'USD',
    stage: 'validee',
    paymentStatus: 'sequestre_bloque',
    paymentMethod: 'Virement Swift SWIFT-ECOBANK',
    incoterm: 'FOB',
    shippingMethod: 'fret_maritime',
    createdAt: 'Hier à 17:40',
    deadlinePreparation: 'Demain 12:00',
    documents: [
      { type: 'facture', name: 'Facture_Proforma_1046.pdf', url: '#' }
    ]
  }
];

export const MOCK_RETURN_REQUESTS: ReturnRequest[] = [
  {
    id: 'ret-2026-01',
    returnNumber: 'RET-2026-004',
    orderNumber: 'CMD-2026-1032',
    buyerName: 'Laboratoires Dermasol',
    productTitle: 'Huile d\'Argan Vierge Extra Bio (25L)',
    sku: 'COS-ARG-BIO-L1',
    quantity: 2,
    reason: 'Fût légèrement bosselé lors de la livraison locale avec opercule protecteur intact.',
    status: 'colis_recu',
    stockDestinationStatus: 'en_inspection',
    inspectionNotes: 'Contrôle étanchéité en cours à l\'entrepôt de Paris. Produit non contaminé.',
    refundAmount: 64,
    currency: 'EUR',
    requestedAt: '21 Fév 2026',
    processedAt: 'Aujourd\'hui'
  }
];

export const MOCK_CRM_CLIENTS: CrmLeadClient[] = [
  {
    id: 'crm-01',
    name: 'Moussa Kéita',
    companyName: 'Agro-Industrie du Sahel SA',
    roleTitle: 'Directeur des Approvisionnements',
    email: 'm.keita@agro-sahel.com',
    phone: '+223 76 12 34 56',
    country: 'Mali',
    city: 'Bamako',
    segment: 'grossiste',
    pipelineStage: 'negociation',
    dealValuePotential: 45000,
    currency: 'EUR',
    assignedTo: 'Amadou Diallo',
    lastContactDate: 'Hier',
    nextFollowUpDate: 'Demain à 10:00',
    followUpReason: 'Négociation volume pour 12 tonnes de fèves de cacao et 20 kits de pompage',
    totalOrdersCount: 3,
    totalSpent: 89000,
    satisfactionScore: 4.9,
    notes: 'Client très rigoureux sur les délais. Préfère les Incoterms DDP avec dédouanement inclus.',
    tags: ['#GrossisteAgro', '#Mali', '#PompesSolaires', '#GrandCompte'],
    quotesHistory: [
      {
        quoteNumber: 'DEV-2026-092',
        amount: 45000,
        date: '20 Fév 2026',
        status: 'en_attente',
        expiryDate: '28 Fév 2026'
      }
    ],
    recentOrders: [
      { orderNumber: 'CMD-2025-980', amount: 32000, date: '15 Déc 2025' }
    ]
  },
  {
    id: 'crm-02',
    name: 'Émilie Leroy',
    companyName: 'Épiceries Fines & Terroirs d\'Afrique SAS',
    roleTitle: 'Acheteuse Matières Premières',
    email: 'emilie.leroy@terroirs-afrique.fr',
    phone: '+33 1 42 68 00 11',
    country: 'France',
    city: 'Lyon',
    segment: 'detaillant',
    pipelineStage: 'offre_devis',
    dealValuePotential: 18500,
    currency: 'EUR',
    assignedTo: 'Amadou Diallo',
    lastContactDate: '18 Fév 2026',
    nextFollowUpDate: '27 Fév 2026',
    followUpReason: 'Devis envoyé pour approvisionnement annuel en Fonio Bio et Huile d\'Argan',
    totalOrdersCount: 1,
    totalSpent: 12000,
    satisfactionScore: 4.8,
    notes: 'Réseau de 14 boutiques bio en région Rhône-Alpes.',
    tags: ['#BioFrance', '#Fonio', '#Argan', '#DistributionBio'],
    quotesHistory: [
      {
        quoteNumber: 'DEV-2026-087',
        amount: 18500,
        date: '18 Fév 2026',
        status: 'en_attente',
        expiryDate: '27 Fév 2026'
      }
    ],
    recentOrders: []
  },
  {
    id: 'crm-03',
    name: 'Ibrahim Ouedraogo',
    companyName: 'Burkina Green Solutions SARL',
    roleTitle: 'Directeur Général',
    email: 'direction@burkinagreen.bf',
    phone: '+226 70 88 99 00',
    country: 'Burkina Faso',
    city: 'Ouagadougou',
    segment: 'distributeur_international',
    pipelineStage: 'client_actif',
    dealValuePotential: 75000,
    currency: 'EUR',
    assignedTo: 'Amadou Diallo',
    lastContactDate: '10 Fév 2026',
    nextFollowUpDate: '05 Mars 2026',
    followUpReason: 'Relance réachat trimestriel pompes solaires et batteries',
    totalOrdersCount: 6,
    totalSpent: 164000,
    satisfactionScore: 5.0,
    notes: 'Partenaire installateur agréé dans les zones rurales de Koudougou et Bobo-Dioulasso.',
    tags: ['#PartenaireAgreé', '#Solaire', '#Burkina', '#TopClient'],
    quotesHistory: [],
    recentOrders: [
      { orderNumber: 'CMD-2026-1012', amount: 28000, date: '10 Jan 2026' }
    ]
  }
];

export const MOCK_CRM_FOLLOWUPS: CrmFollowUp[] = [
  {
    id: 'flw-01',
    targetClientId: 'crm-02',
    targetClientName: 'Émilie Leroy',
    companyName: 'Épiceries Fines & Terroirs d\'Afrique SAS',
    type: 'devis_expiration',
    priority: 'haute',
    dueDate: 'Demain (Expire le 27 Fév)',
    generatedAiMessage: 'Bonjour Mme Leroy, votre devis DEV-2026-087 pour le lot de Fonio Bio et Huile d\'Argan arrive à échéance demain. Nous pouvons bloquer le tarif préférentiel grossiste et organiser l\'enlèvement depuis notre plateforme de Paris dès validation.',
    status: 'a_faire'
  },
  {
    id: 'flw-02',
    targetClientId: 'crm-01',
    targetClientName: 'Moussa Kéita',
    companyName: 'Agro-Industrie du Sahel SA',
    type: 'relance_prospect',
    priority: 'haute',
    dueDate: 'Aujourd\'hui 15:00',
    generatedAiMessage: 'Cher M. Kéita, suite à notre échange concernant votre commande de 45 000 EUR, notre équipe logistique a confirmé la réservation prioritaire des 4 conteneurs au port de Conakry avec tarif DDP clé en main.',
    status: 'a_faire'
  },
  {
    id: 'flw-03',
    targetClientId: 'crm-03',
    targetClientName: 'Ibrahim Ouedraogo',
    companyName: 'Burkina Green Solutions SARL',
    type: 'reachat_fidelisation',
    priority: 'moyenne',
    dueDate: '05 Mars 2026',
    generatedAiMessage: 'Bonjour Ibrahim, cela fait 60 jours depuis votre dernière livraison de pompes 5.5kW. Au vu de la saison sèche imminente, souhaitez-vous anticiper la commande du second trimestre pour bénéficier du tarif conteneur groupé ?',
    status: 'a_faire'
  }
];

export const MOCK_SUPPORT_TICKETS: CustomerSupportTicket[] = [
  {
    id: 'tck-2026-101',
    ticketNumber: 'TCK-2026-101',
    clientName: 'Consortium SMB-Boké',
    clientEmail: 'achats@smb-boke.gn',
    relatedOrderNumber: 'CMD-2026-1049',
    category: 'livraison',
    priority: 'haute',
    subject: 'Confirmation de créneau pour technicien de pose',
    message: 'Nous avons validé la commande CMD-2026-1049 de 4 pompes. Pouvez-vous confirmer que le technicien agréé sera présent lors de l\'arrivée du camion sur le site minier vendredi à 14h ?',
    aiSuggestedReply: 'Bonjour, nous confirmons que l\'ingénieur d\'installation agréé Diallo OS M. Bah sera présent sur le site de Boké vendredi dès 13h30 pour superviser le déchargement et procéder aux tests électriques triphasés.',
    aiDetectedSentiment: 'neutre',
    status: 'en_cours',
    createdAt: 'Il y a 2h',
    assignedAgent: 'Support Diallo B2B'
  },
  {
    id: 'tck-2026-102',
    ticketNumber: 'TCK-2026-102',
    clientName: 'Laboratoires Dermasol',
    clientEmail: 'qualite@dermasol.eu',
    relatedOrderNumber: 'CMD-2026-1032',
    category: 'retour',
    priority: 'normale',
    subject: 'Certificat d\'analyse du lot de remplacement Argan',
    message: 'Pourriez-vous nous transmettre le bulletin chromatographique du lot d\'huile d\'argan qui nous sera réexpédié ?',
    aiSuggestedReply: 'Bonjour, le bulletin d\'analyse du lot ARG-2026-BIO-09 (teneur en acide oléique 43.2%, indice de peroxyde 1.4 meq/kg) a été attaché à votre dossier et est téléchargeable sur votre espace client.',
    aiDetectedSentiment: 'satisfait',
    status: 'ouvert',
    createdAt: 'Hier à 15:30',
    assignedAgent: 'Service Qualité'
  }
];

export const MOCK_PRODUCT_PROFITABILITIES: ProductProfitability[] = [
  {
    productId: 'p-cacao-bio',
    sku: 'AGR-CAC-BIO-01',
    title: 'Fèves de Cacao Bio Grade 1 Export',
    unitsSold: 120, // tonnes / lots
    revenueTotal: 474000,
    costOfGoodsTotal: 336000,
    shippingAndCustomsTotal: 34000,
    platformAndPaymentFeesTotal: 9480,
    returnsAndDamagesTotal: 1200,
    netMarginTotal: 93320,
    netMarginPercent: 19.7,
    currency: 'USD',
    viewsCount: 4200,
    leadsCount: 140,
    conversionRate: 3.3,
    reelLinkedId: 'reel-cacao-harvest'
  },
  {
    productId: 'p-pompe-solaire',
    sku: 'NRG-SOL-PUMP-5K',
    title: 'Kit Pompe Solaire d\'Irrigation 5.5kW',
    unitsSold: 64,
    revenueTotal: 204800,
    costOfGoodsTotal: 124800,
    shippingAndCustomsTotal: 16000,
    platformAndPaymentFeesTotal: 4096,
    returnsAndDamagesTotal: 3200,
    netMarginTotal: 56704,
    netMarginPercent: 27.7,
    currency: 'EUR',
    viewsCount: 8900,
    leadsCount: 310,
    conversionRate: 3.5,
    reelLinkedId: 'reel-solar-pump-demo'
  },
  {
    productId: 'p-huile-argan',
    sku: 'COS-ARG-BIO-L1',
    title: 'Huile d\'Argan Vierge Extra Bio (25L)',
    unitsSold: 380,
    revenueTotal: 121600,
    costOfGoodsTotal: 68400,
    shippingAndCustomsTotal: 8500,
    platformAndPaymentFeesTotal: 2432,
    returnsAndDamagesTotal: 640,
    netMarginTotal: 41628,
    netMarginPercent: 34.2,
    currency: 'EUR',
    viewsCount: 12400,
    leadsCount: 480,
    conversionRate: 3.9
  },
  {
    productId: 'p-fonio-precuit',
    sku: 'AGR-FON-PRE-01',
    title: 'Fonio Précuit Biologique Sans Gluten',
    unitsSold: 420,
    revenueTotal: 16380,
    costOfGoodsTotal: 9240,
    shippingAndCustomsTotal: 1800,
    platformAndPaymentFeesTotal: 327,
    returnsAndDamagesTotal: 195,
    netMarginTotal: 4818,
    netMarginPercent: 29.4,
    currency: 'USD',
    viewsCount: 6100,
    leadsCount: 190,
    conversionRate: 3.1
  }
];

export const MOCK_COUNTRY_SALES: CountrySalesAnalytics[] = [
  {
    country: 'Guinée',
    countryCode: 'GN',
    flagEmoji: '🇬🇳',
    revenue: 312000,
    ordersCount: 48,
    activeClientsCount: 32,
    topProductTitle: 'Kits Pompes Solaires & Machinisme',
    growthRatePercent: 34.5,
    currency: 'EUR'
  },
  {
    country: 'France & Europe',
    countryCode: 'FR',
    flagEmoji: '🇫🇷',
    revenue: 284000,
    ordersCount: 62,
    activeClientsCount: 44,
    topProductTitle: 'Huile d\'Argan & Cacao Bio',
    growthRatePercent: 22.1,
    currency: 'EUR'
  },
  {
    country: 'Sénégal',
    countryCode: 'SN',
    flagEmoji: '🇸🇳',
    revenue: 145000,
    ordersCount: 29,
    activeClientsCount: 21,
    topProductTitle: 'Cacao & Pompage Solaire',
    growthRatePercent: 18.4,
    currency: 'EUR'
  },
  {
    country: 'Côte d\'Ivoire',
    countryCode: 'CI',
    flagEmoji: '🇨🇮',
    revenue: 198000,
    ordersCount: 38,
    activeClientsCount: 26,
    topProductTitle: 'Fonio Bio & Huile d\'Argan',
    growthRatePercent: 41.2,
    currency: 'EUR'
  },
  {
    country: 'Chine (Achats & Appro)',
    countryCode: 'CN',
    flagEmoji: '🇨🇳',
    revenue: 0,
    ordersCount: 16,
    activeClientsCount: 5,
    topProductTitle: 'Composants & Onduleurs Solaires',
    growthRatePercent: 15.0,
    currency: 'USD'
  }
];

export const MOCK_BUSINESS_GOALS: BusinessGoal[] = [
  {
    id: 'gol-01',
    title: 'Franchir 1 000 000 EUR de CA Export Annuel',
    targetMetric: 'chiffre_affaires',
    targetValue: 1000000,
    currentValue: 816728,
    unit: 'EUR',
    deadlineDate: '31 Déc 2026',
    aiActionPlan: [
      'Accélérer la conversion des 3 devis grands comptes en cours au Mali et Côte d\'Ivoire (+135k€)',
      'Déployer 2 nouveaux Reels de démonstration pompage solaire sur Réseau Mok (+45k€ estimés)',
      'Participer au Salon Virtuel Agro-Export de Genève le 15 Mars'
    ],
    status: 'en_bonne_voie'
  },
  {
    id: 'gol-02',
    title: 'Acquérir 50 Nouveaux Clients Distributeurs en Côte d\'Ivoire',
    targetMetric: 'nouveaux_clients',
    targetValue: 50,
    currentValue: 26,
    unit: 'Entreprises',
    deadlineDate: '30 Juin 2026',
    aiActionPlan: [
      'Lancer une campagne de prospection ciblée dans la Tribu AgroTech Abidjan',
      'Activer l\'offre promotionnelle volume sur le Fonio Bio pour les supermarchés'
    ],
    status: 'en_bonne_voie'
  },
  {
    id: 'gol-03',
    title: 'Zéro Rupture de Stock sur les Kits Solaires 5.5kW',
    targetMetric: 'volume_tonnage',
    targetValue: 100,
    currentValue: 54,
    unit: 'Unités livrées',
    deadlineDate: '30 Avril 2026',
    aiActionPlan: [
      'Valider la commande fournisseur SO-2026-088 de 30 unités supplémentaires avant vendredi',
      'Activer le fret maritime prioritaire depuis Ningbo'
    ],
    status: 'attention'
  }
];

export const MOCK_BUSINESS_TEAM: BusinessTeamMember[] = [
  {
    id: 'tm-01',
    name: 'Amadou Diallo',
    email: 'amadou.diallo@trade.gn',
    role: 'proprietaire',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
    lastActive: 'En ligne',
    assignedHubs: ['Tous les hubs mondiaux', 'Finance & Direction']
  },
  {
    id: 'tm-02',
    name: 'Ibrahima Camara',
    email: 'i.camara@trade.gn',
    role: 'gestion_stock',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    lastActive: 'Il y a 10 min',
    assignedHubs: ['Hub Conakry', 'Réceptions & Inventaires']
  },
  {
    id: 'tm-03',
    name: 'Fatoumata Binta Barry',
    email: 'fb.barry@trade.gn',
    role: 'commercial',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200',
    lastActive: 'Il y a 25 min',
    assignedHubs: ['Pipeline CRM', 'Devis & Relances Afrique de l\'Ouest']
  },
  {
    id: 'tm-04',
    name: 'Sophie Marchand',
    email: 's.marchand@trade.fr',
    role: 'logistique',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200',
    lastActive: 'Il y a 1h',
    assignedHubs: ['Plateforme Paris-Nord', 'Douanes & Fret International']
  }
];

export const MOCK_BUSINESS_AUDIT: BusinessAuditEntry[] = [
  {
    id: 'aud-01',
    timestamp: 'Aujourd\'hui à 11:20',
    userName: 'Diallo OS (Système Automatique)',
    userRole: 'Intelligence Embarquée',
    action: 'Réservation automatique de stock',
    module: 'stock',
    oldValue: 'Disponible: 28 unités',
    newValue: 'Disponible: 24 unités (Réservé: 18)',
    details: 'Mise à jour en temps réel suite à la commande CMD-2026-1049'
  },
  {
    id: 'aud-02',
    timestamp: 'Aujourd\'hui à 09:45',
    userName: 'Amadou Diallo',
    userRole: 'Propriétaire',
    action: 'Création et envoi de devis B2B',
    module: 'crm',
    oldValue: 'Négociation',
    newValue: 'Devis DEV-2026-092 (45 000 EUR)',
    details: 'Devis transmis à Agro-Industrie du Sahel SA'
  },
  {
    id: 'aud-03',
    timestamp: 'Hier à 16:30',
    userName: 'Ibrahima Camara',
    userRole: 'Gestion Stock',
    action: 'Réception bon de livraison fournisseur',
    module: 'fournisseurs',
    oldValue: 'En transit: 4500 sacs',
    newValue: 'Reçu au port: +1500 sacs',
    details: 'Contrôle qualité et certificat d\'humidité validés'
  }
];




