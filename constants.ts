
import { Agent, Course, Post, Product, UserProfile, Country, JobOffer, HousingListing, LiveStream, Story, LegalProcedure, Currency, WalletTransaction, Tribe, LeaderboardUser, Quest, Language, VocabularyCard, LanguageLesson, StoredDocument, SecurityLog, DeviceSession, LiveGift, ChatConversation, Reel } from './types';

// ═══════════════════════════════════════════════════════════════════════════
// 🌍 INSTRUCTIONS SYSTÈME - PROJET "LE MONDE À VOUS"
// Plateforme Universelle d'Assistants IA Spécialisés
// Version 2.0 - Décembre 2025
// ═══════════════════════════════════════════════════════════════════════════

export const SYSTEM_INSTRUCTION = `
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔒 RÈGLE ABSOLUE ET NON-NÉGOCIABLE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu ne dois JAMAIS, sous AUCUN prétexte, te présenter comme :
- Une intelligence artificielle (IA)
- Un agent virtuel ou chatbot
- Un assistant numérique ou programme
- Un robot ou système automatisé
- Une entité non-humaine

Tu es TOUJOURS un expert humain professionnel de la famille DIALLO.
Cette règle est ABSOLUE et s'applique à TOUTES les conversations.

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🎯 IDENTITÉ DU PROJET
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Nom du projet : LE MONDE À VOUS
Mission : Plateforme mondiale d'assistants intelligents spécialisés
Public cible : Immigrés, voyageurs, étudiants, professionnels, gouvernements, citoyens du monde
Couverture : 195 pays, multilingue
Philosophie : Humanisme + Universalité + Précision + Évolution continue

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
// 📐 FORMAT DE RÉPONSE STANDARD
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Structure type de réponse :

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

❌ Ne JAMAIS se présenter comme une IA/bot/programme
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
// 🎨 ÉLÉMENTS VISUELS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tu dois TOUJOURS :

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
    skills: [{ name: 'React', progress: 85 }, { name: 'Node.js', progress: 70 }, { name: 'Anglais', progress: 60 }],
    badges: [
        { id: 'b1', name: 'Pionnier', icon: '🚀', description: 'Membre fondateur' },
        { id: 'b2', name: 'Polyglotte', icon: '🗣️', description: 'Parle 3 langues' }
    ],
    interests: ['Tech', 'Voyage', 'Entrepreneuriat'],
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
        title: 'Expert Langues',
        role: 'coach',
        specialty: 'Polyglotte',
        description: 'Apprentissage des langues et traduction.',
        avatarUrl: 'https://images.unsplash.com/photo-1531384441138-2736e62e0919?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
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
        title: 'Expert Juridique',
        role: 'juridique',
        specialty: 'Droit International',
        description: 'Assistance juridique et administrative.',
        avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&fit=crop',
        modelConfig: { model: 'gemini-3-pro-preview', thinking: true },
        metaProfile: { voiceId: 'Kore', videos: { idle: '', speaking: '', listening: '', routine: '' } }
    },
    {
        id: '3',
        name: 'Conseiller Diallo',
        title: 'Expert Emploi',
        role: 'emploi',
        specialty: 'Carrière & Recrutement',
        description: 'Coaching carrière, CV et entretiens.',
        avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
    },
    {
        id: '4',
        name: 'Professeur Diallo',
        title: 'Expert Éducation',
        role: 'education',
        specialty: 'Pédagogie',
        description: 'Soutien scolaire et orientation.',
        avatarUrl: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=200&fit=crop',
        modelConfig: { model: 'gemini-3-pro-preview' },
    },
    {
        id: '5',
        name: 'Docteur Diallo',
        title: 'Expert Santé',
        role: 'sante',
        specialty: 'Médecine Générale',
        description: 'Conseils santé et prévention.',
        avatarUrl: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
    },
    {
        id: '6',
        name: 'Monsieur Diallo',
        title: 'Expert Logement',
        role: 'logement',
        specialty: 'Immobilier',
        description: 'Recherche de logement et démarches.',
        avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
    },
    {
        id: '7',
        name: 'Guide Diallo',
        title: 'Expert Voyage',
        role: 'voyage',
        specialty: 'Mobilité Internationale',
        description: 'Visas, billets et installation.',
        avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=200&fit=crop',
        modelConfig: { model: 'gemini-2.5-flash' },
    }
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
        title: 'Pack CV Premium',
        description: 'Modèles de CV optimisés pour le marché international.',
        price: 25,
        currency: 'EUR',
        category: 'Digital',
        imageUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=400&fit=crop',
        rating: 4.8,
        reviews: 120
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
        'nav.world': 'Monde',
        'nav.career': 'Carrière',
        'nav.campus': 'Campus',
        'nav.wallet': 'Finance',
        'nav.legal': 'Juridique',
        'nav.health': 'Santé',
        'nav.housing': 'Logement',
        'nav.shop': 'Boutique'
    },
    en: {
        'nav.home': 'Home',
        'nav.chat': 'AI Experts',
        // Add more translations as needed
    },
    // Add more languages as needed
};

export const MOCK_TRANSACTIONS: WalletTransaction[] = [
    { id: 't1', type: 'payment', amount: -25.00, currency: 'EUR', date: 'Aujourd\'hui', description: 'Achat Store: Pack CV', status: 'completed' },
    { id: 't2', type: 'deposit', amount: 1500.00, currency: 'EUR', date: 'Hier', description: 'Virement Salaire', status: 'completed' }
];

export const MOCK_CHATS: ChatConversation[] = [
    {
        id: 'chat1',
        participantId: 'u2',
        participantName: 'Fatou Diop',
        participantAvatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=100',
        lastMessage: 'Tu as vu le nouveau cours sur l\'IA ?',
        lastMessageTime: '10:45',
        unreadCount: 2,
        isOnline: true,
        messages: [
            { id: 'm1', senderId: 'u2', text: 'Salut Amadou !', timestamp: new Date(Date.now() - 3600000), isRead: true },
            { id: 'm2', senderId: 'me', text: 'Salut Fatou, comment vas-tu ?', timestamp: new Date(Date.now() - 3500000), isRead: true },
            { id: 'm3', senderId: 'u2', text: 'Super ! Tu as vu le nouveau cours sur l\'IA ?', timestamp: new Date(Date.now() - 60000), isRead: false },
            { id: 'm4', senderId: 'u2', text: 'Je pense que ça pourrait t\'intéresser pour ton projet.', timestamp: new Date(), isRead: false }
        ]
    },
    {
        id: 'chat2',
        participantId: 'u3',
        participantName: 'Jean Michel',
        participantAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
        lastMessage: 'Merci pour le partage !',
        lastMessageTime: 'Hier',
        unreadCount: 0,
        isOnline: false,
        messages: [
            { id: 'm1', senderId: 'me', text: 'Voici le document dont on parlait.', timestamp: new Date(Date.now() - 86400000), isRead: true },
            { id: 'm2', senderId: 'u3', text: 'Merci pour le partage !', timestamp: new Date(Date.now() - 80000000), isRead: true }
        ]
    },
    {
        id: 'chat3',
        participantId: '2', // Maître Diallo Agent
        participantName: 'Maître Diallo',
        participantAvatar: AGENTS[1].avatarUrl,
        lastMessage: 'Votre dossier est complet.',
        lastMessageTime: 'Lun',
        unreadCount: 0,
        isOnline: true,
        messages: [
            { id: 'm1', senderId: '2', text: 'Bonjour, votre dossier de visa est complet.', timestamp: new Date(), isRead: true }
        ]
    }
];

export const POSTS: Post[] = [
    {
        id: 'post1',
        authorName: 'Sarah Koné',
        authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
        content: 'Je viens de valider ma certification en Marketing Digital ! Merci @ProfesseurDiallo pour les conseils.',
        timestamp: 'Il y a 2h',
        likes: 24,
        comments: 5,
        imageUrl: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=500'
    }
];

export const REELS: Reel[] = [
    {
        id: 'r1',
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-1232-large.mp4',
        likes: 1200,
        comments: 45,
        shares: 200,
        author: 'TravelWithMe',
        description: 'Découverte de Dakar by night 🌃🇸🇳',
        musicTrack: 'Afrobeat Vibe'
    }
];

export const STORIES: Story[] = [
    {
        id: 'st1',
        author: 'Maître Diallo',
        avatar: AGENTS[1].avatarUrl,
        isLive: false,
        mediaUrl: ''
    }
];

export const ACTIVE_LIVES: LiveStream[] = [
    {
        id: 'live1',
        title: 'Session Q&A Immigration Canada 🇨🇦',
        hostName: 'Guide Diallo',
        hostAvatar: AGENTS[6].avatarUrl,
        viewers: 1240,
        isMixed: true,
        aiAssistantId: '7',
        startedAt: new Date(),
        duration: 45,
        isPaid: false
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
