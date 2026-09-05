// Registre de santé de MokNet — le périmètre, ligne par ligne.
//
// C'est la source de vérité UNIQUE de ce qui est surveillé. Ajouter une
// surveillance = ajouter une ligne ici et la sonde correspondante côté
// `health-guardian`. Rien n'est surveillé « implicitement » : ce qui n'est pas
// dans ce fichier n'est pas mesuré, et le tableau de bord le dit (couverture).
//
// Chaque ligne porte son ATTENDU, écrit AVANT toute mesure — sans quoi le
// verdict se rédige après coup pour coller au résultat obtenu, ce qui n'est
// plus un contrôle.
//
// Les identifiants de réparation (`remediation.id`) ne sont que des clés : le
// catalogue réel des opérations vit dans la migration SQL
// (`health_remediation_spec`). Le navigateur ne peut donc jamais élargir la
// portée d'une action, seulement demander une entrée du catalogue.

import { HealthDomain, HealthDomainId, HealthLine } from './healthTypes';

/** Poids des domaines dans la note globale. Somme contrôlée par un test. */
export const HEALTH_DOMAINS: HealthDomain[] = [
    {
        id: 'securite',
        title: 'Sécurité & accès',
        purpose: "Qui peut lire quoi, qui peut écrire quoi, et où vivent les clés.",
        weight: 18,
    },
    {
        id: 'donnees',
        title: 'Intégrité des données',
        purpose: "Aucune ligne orpheline, aucune relation cassée, aucun doublon silencieux.",
        weight: 11,
    },
    {
        id: 'ia',
        title: 'Orchestrateur IA',
        purpose: "Fournisseurs disponibles, dépense maîtrisée, appels qui aboutissent.",
        weight: 11,
    },
    {
        id: 'messagerie',
        title: 'Messagerie & appels',
        purpose: "Les conversations tiennent, les appels aboutissent, les blocages sont respectés.",
        weight: 9,
    },
    {
        id: 'deploiement',
        title: 'Déploiement & navigateur',
        purpose: "Ce que le navigateur reçoit réellement : en-têtes, origines, chiffrement.",
        weight: 9,
    },
    {
        id: 'contenu',
        title: 'Contenu & vie sociale',
        purpose: "Le fil publie, les stories expirent, les notifications ne s'entassent pas.",
        weight: 7,
    },
    {
        id: 'live',
        title: 'Studio LIVE',
        purpose: "Sessions propres, rétention des transcriptions respectée.",
        weight: 7,
    },
    {
        id: 'notifications',
        title: 'Notifications push',
        purpose: "Les appels réveillent bien le téléphone du correspondant.",
        weight: 7,
    },
    {
        id: 'gouvernance',
        title: 'Gouvernance & traçabilité',
        purpose: "Le schéma est versionné, les actions sont journalisées, les avis sont traités.",
        weight: 7,
    },
    {
        id: 'experience',
        title: "Expérience & application installée",
        purpose: "Ce que vit réellement l'utilisateur : application installable, hors-ligne, module autonome.",
        weight: 6,
    },
    {
        id: 'stockage',
        title: 'Stockage & médias',
        purpose: "Les fichiers survivent, sans traîner de références mortes.",
        weight: 5,
    },
    {
        id: 'dependances',
        title: 'Dépendances & chaîne de build',
        purpose: "Le code livré est typé, testé, et sans vulnérabilité connue.",
        weight: 3,
    },
];

export const HEALTH_LINES: HealthLine[] = [

    // ───────────────────────────── SÉCURITÉ ─────────────────────────────

    {
        id: 'securite.forge_credits',
        domain: 'securite',
        title: "Attribution de crédits réservée au serveur",
        why: "Un compte ordinaire ne doit pas pouvoir se créditer lui-même : les crédits achètent en boutique, offrent en LIVE et alimentent les cagnottes.",
        weight: 22,
        location: 'serveur',
        expected: "`award_xp_and_credits` n'est PAS exécutable par le rôle `authenticated`.",
        remediation: {
            id: 'securite.revoke_credit_forgery',
            label: "Retirer le droit d'exécution aux comptes ordinaires",
            consequence:
                "Le droit d'exécution de `award_xp_and_credits` est retiré au rôle `authenticated` ; " +
                "seuls les administrateurs et le serveur peuvent encore l'appeler. Toute attribution " +
                "de crédits déclenchée depuis le navigateur cessera de fonctionner jusqu'à ce que la " +
                "fonction soit réécrite avec un barème serveur. Réversible d'un clic.",
            reversible: true,
        },
    },
    {
        id: 'securite.portefeuille_credit',
        domain: 'securite',
        title: "Crédit de portefeuille non déclarable par le client",
        why: "Un crédit doit naître d'un encaissement constaté, jamais d'un montant envoyé par le navigateur.",
        weight: 14,
        location: 'serveur',
        expected: "`insert_wallet_transaction` n'est PAS exécutable par le rôle `authenticated`.",
        remediation: {
            id: 'securite.revoke_wallet_self_credit',
            label: "Fermer l'écriture directe du grand livre",
            consequence:
                "Le droit d'exécution d'`insert_wallet_transaction` est retiré au rôle `authenticated`. " +
                "Mesure volontairement large : elle coupe aussi les débits légitimes. Sans effet visible " +
                "aujourd'hui (grand livre vide, boutique inactive), à lever une fois la fonction " +
                "réécrite. Réversible d'un clic.",
            reversible: true,
        },
    },
    {
        id: 'securite.rls_couverture',
        domain: 'securite',
        title: "Sécurité au niveau ligne active partout",
        why: "Sans RLS, une seule requête bien formée depuis un compte quelconque lit toute la table.",
        weight: 14,
        location: 'serveur',
        expected: "100 % des tables du schéma `public` ont la RLS activée.",
    },
    {
        id: 'securite.coffre_cles',
        domain: 'securite',
        title: "Coffre de clés hors de portée du navigateur",
        why: "Les clés des fournisseurs IA, la clé privée VAPID et les secrets LiveKit ne doivent jamais être atteignables depuis une session utilisateur.",
        weight: 14,
        location: 'serveur',
        expected:
            "Aucune fonction `*_internal` (secrets fournisseurs, VAPID, transport LIVE) n'est " +
            "exécutable par le rôle `authenticated`.",
    },
    {
        id: 'securite.garde_role',
        domain: 'securite',
        title: "Élévation de rôle impossible",
        why: "Sans ce garde-fou, une simple mise à jour de son propre profil suffirait à se nommer administrateur.",
        weight: 12,
        location: 'serveur',
        expected:
            "Le déclencheur `trg_profiles_protect_sensitive` est présent et ACTIF sur `profiles`.",
    },
    {
        id: 'securite.secdef_search_path',
        domain: 'securite',
        title: "Chemin de recherche figé sur les fonctions privilégiées",
        why: "Une fonction privilégiée au chemin de recherche libre peut être détournée vers une table piégée.",
        weight: 10,
        location: 'serveur',
        expected: "Toutes les fonctions `SECURITY DEFINER` ont un `search_path` explicitement figé.",
    },
    {
        id: 'securite.depense_ia_publique',
        domain: 'securite',
        title: "Dépense IA réservée aux administrateurs",
        why: "Le budget consommé par l'organisation n'a pas à être lisible par n'importe quel compte.",
        weight: 6,
        location: 'serveur',
        expected: "`get_ai_spend` n'est pas exécutable par le rôle `authenticated`.",
        remediation: {
            id: 'securite.restrict_ai_spend',
            label: "Réserver la lecture de la dépense aux administrateurs",
            consequence:
                "Le droit d'exécution de `get_ai_spend` est retiré au rôle `authenticated`. " +
                "L'écran Super Admin continue de fonctionner (il appelle la fonction avec un compte " +
                "administrateur). Réversible d'un clic.",
            reversible: true,
        },
    },
    {
        id: 'securite.grants_anon',
        domain: 'securite',
        title: "Portée du rôle anonyme",
        why: "La RLS tient, mais un droit de lecture anonyme trop large transforme la moindre politique permissive écrite demain en fuite publique.",
        weight: 5,
        location: 'serveur',
        expected:
            "Le rôle `anon` n'a de droit de lecture que sur les tables réellement publiques " +
            "(fil public et profils).",
        remediation: {
            id: 'securite.revoke_anon_selects',
            label: "Retirer la lecture anonyme aux tables non publiques",
            consequence:
                "Le droit `SELECT` du rôle `anon` est retiré sur toutes les tables sauf `posts`, " +
                "`profiles`, `comments`, `post_reactions` et `follows`, qui servent le fil public. " +
                "Aucun effet sur les comptes connectés. Réversible d'un clic.",
            reversible: true,
        },
    },
    {
        id: 'securite.mots_de_passe_fuites',
        domain: 'securite',
        title: "Refus des mots de passe compromis",
        why: "Un mot de passe déjà présent dans une fuite connue rend le compte prenable sans aucune faille applicative.",
        weight: 3,
        location: 'humain',
        expected: "La vérification HaveIBeenPwned est activée dans Supabase Auth.",
        humanAction:
            "Console Supabase → Authentication → Policies → activer « Leaked password protection ». " +
            "Aucun code à modifier ; réglage hors de portée d'une fonction serveur.",
    },

    // ─────────────────────────── DONNÉES ───────────────────────────

    // Note de conception (mesurée le 04/09/2026, pas supposée) : les liens
    // ci-dessous sont TOUS protégés par une clé étrangère `ON DELETE CASCADE`.
    // Un orphelin y est donc structurellement impossible tant que la
    // contrainte tient. Ces lignes ne sont pas décoratives pour autant : elles
    // vérifient que la GARANTIE tient toujours. Si l'une vire au rouge, cela
    // signifie qu'une contrainte a été perdue — et la réponse n'est pas de
    // purger les orphelins, c'est de rétablir la contrainte. Aucun bouton de
    // purge n'est donc proposé : il ne pourrait jamais rien purger, et
    // masquerait la vraie cause.

    {
        id: 'donnees.messages_orphelins',
        domain: 'donnees',
        title: "Messages rattachés à une conversation existante",
        why: "Un message orphelin n'est plus lisible par personne mais reste stocké, et fausse tous les comptages.",
        weight: 22,
        location: 'serveur',
        expected:
            "Aucun message orphelin, ET la contrainte `messages_conversation_id_fkey` " +
            "(ON DELETE CASCADE) toujours en place.",
        humanAction:
            "Si cette ligne vire au rouge, la contrainte de clé étrangère a été perdue : la rétablir " +
            "plutôt que purger les orphelins, sinon ils reviendront.",
    },
    {
        id: 'donnees.participants_fantomes',
        domain: 'donnees',
        title: "Participants rattachés à un compte existant",
        why: "Un participant fantôme fait apparaître un correspondant introuvable dans une conversation.",
        weight: 20,
        location: 'serveur',
        expected:
            "Aucun participant orphelin, ET les deux contraintes de " +
            "`conversation_participants` toujours en place.",
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue avant toute " +
            "purge.",
    },
    {
        id: 'donnees.conversations_vides',
        domain: 'donnees',
        title: "Conversations avec au moins un participant",
        why: "Une conversation sans participant n'est accessible à personne et encombre les listes. Cas réel : la suppression d'un compte emporte ses participations en cascade et peut laisser la conversation vide derrière elle.",
        weight: 16,
        location: 'serveur',
        expected: "Aucune conversation sans aucun participant.",
        remediation: {
            id: 'donnees.purge_empty_conversations',
            label: "Purger les conversations sans participant",
            consequence:
                "Les conversations n'ayant plus aucun participant sont sauvegardées puis supprimées. " +
                "Leurs messages partent en cascade — ils ne sont accessibles à personne, la " +
                "conversation n'ayant plus de membre. La sauvegarde couvre la conversation ET ses " +
                "messages : la restauration rétablit les deux.",
            reversible: true,
        },
    },
    {
        id: 'donnees.reactions_orphelines',
        domain: 'donnees',
        title: "Réactions et commentaires rattachés à un contenu existant",
        why: "Des réactions orphelines gonflent artificiellement les compteurs d'un contenu supprimé.",
        weight: 16,
        location: 'serveur',
        expected:
            "Aucune réaction ni commentaire orphelin, ET les contraintes vers `posts` " +
            "toujours en place.",
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue avant toute " +
            "purge.",
    },
    {
        id: 'donnees.coherence_amities',
        domain: 'donnees',
        title: "Relations d'amitié cohérentes",
        why: "Une auto-amitié ou un doublon symétrique casse les comptages d'amis communs et le calcul de visibilité réseau.",
        weight: 14,
        location: 'serveur',
        expected: "Aucune auto-amitié, aucun couple en double.",
    },
    {
        id: 'donnees.profils_sans_compte',
        domain: 'donnees',
        title: "Profils adossés à un compte réel",
        why: "Un profil sans compte d'authentification est un fantôme : il apparaît en recherche mais personne ne peut s'y connecter.",
        weight: 12,
        location: 'serveur',
        expected: "Chaque profil correspond à un compte `auth.users` existant.",
        humanAction:
            "Aucune purge automatique : supprimer un profil détruit ses publications, messages et " +
            "relations en cascade. À traiter au cas par cas depuis Super Admin → Utilisateurs.",
    },

    // ───────────────────────────── IA ─────────────────────────────

    {
        id: 'ia.fournisseur_actif',
        domain: 'ia',
        title: "Au moins un fournisseur actif par catégorie",
        why: "Sans fournisseur actif, la traduction, la voix et les Experts cessent de répondre sans message clair.",
        weight: 24,
        location: 'serveur',
        expected: "Chaque catégorie (texte, voix, image/vidéo) a au moins un fournisseur actif avec un secret.",
    },
    {
        id: 'ia.secrets_presents',
        domain: 'ia',
        title: "Chaque fournisseur activé possède sa clé",
        why: "Un fournisseur activé sans secret échoue à chaque appel et fait basculer inutilement vers le suivant.",
        weight: 18,
        location: 'serveur',
        expected: "Aucun fournisseur marqué actif sans référence de secret en Vault.",
    },
    {
        id: 'ia.budget_arme',
        domain: 'ia',
        title: "Plafond de dépense armé",
        why: "Sans plafond appliqué, une boucle d'appels peut consommer le budget IA en une nuit.",
        weight: 18,
        location: 'serveur',
        expected: "`ai_budget.enforced` est vrai et au moins un plafond (jour ou mois) est défini.",
        remediation: {
            id: 'ia.enforce_budget',
            label: "Armer le plafond de dépense",
            consequence:
                "`ai_budget.enforced` passe à vrai. Les plafonds déjà saisis deviennent bloquants : " +
                "une fois atteints, les appels IA sont refusés jusqu'au lendemain. Réversible d'un clic.",
            reversible: true,
        },
    },
    {
        id: 'ia.quota_par_utilisateur',
        domain: 'ia',
        title: "Plafond par utilisateur",
        why: "Le plafond actuel est global : un seul compte peut épuiser le budget de toute l'organisation.",
        weight: 16,
        location: 'serveur',
        expected: "Un plafond par utilisateur et par fenêtre existe, en plus du plafond global.",
        humanAction:
            "Développement requis dans `supabase/functions/ai-gateway` : reprendre le compteur par " +
            "expéditeur déjà écrit dans `push-notify` (MAX_SENDS_PER_MINUTE). Aucune réparation " +
            "automatique possible — c'est du code, pas un réglage.",
    },
    {
        id: 'ia.taux_echec',
        domain: 'ia',
        title: "Taux d'échec des appels IA",
        why: "Un taux d'échec qui grimpe signale une clé expirée, un quota atteint ou un fournisseur en panne, bien avant que les utilisateurs se plaignent.",
        weight: 14,
        location: 'serveur',
        expected: "Moins de 10 % d'appels en échec sur les 24 dernières heures.",
    },
    {
        id: 'ia.journal_appels',
        domain: 'ia',
        title: "Volume du journal des appels IA",
        why: "Le journal d'appels est la seule trace des décisions de routage ; laissé sans purge, il finit par peser sur chaque requête.",
        weight: 10,
        location: 'serveur',
        expected: "Moins de 100 000 lignes dans `ai_call_log`.",
        remediation: {
            id: 'ia.purge_old_call_log',
            label: "Purger le journal au-delà de 90 jours",
            consequence:
                "Les lignes d'`ai_call_log` antérieures à 90 jours sont sauvegardées puis supprimées. " +
                "Les statistiques de santé des fournisseurs portent sur 7 jours : elles ne sont pas " +
                "affectées. Restaurable intégralement.",
            reversible: true,
        },
    },

    // ─────────────────────── MESSAGERIE & APPELS ───────────────────────

    {
        id: 'messagerie.transport_live_configure',
        domain: 'messagerie',
        title: "Transport temps réel configuré",
        why: "Sans configuration de transport active, aucun appel ni direct ne peut s'établir.",
        weight: 30,
        location: 'serveur',
        expected: "Une configuration `live_transport_config` active existe pour l'environnement servi.",
    },
    {
        id: 'messagerie.appels_bloques',
        domain: 'messagerie',
        title: "Aucun appel resté en cours anormalement",
        why: "Un appel resté « en cours » côté base fait sonner l'interface dans le vide et fausse les diagnostics.",
        weight: 26,
        location: 'serveur',
        expected: "Aucun diagnostic d'appel au statut « en cours » depuis plus de 6 heures.",
        remediation: {
            id: 'messagerie.close_stuck_calls',
            label: "Clôturer les appels restés en cours",
            consequence:
                "Les diagnostics d'appel « en cours » depuis plus de 6 heures passent au statut " +
                "« interrompu ». Aucune donnée supprimée, aucun appel réel interrompu (leur durée de " +
                "vie réelle se compte en minutes). L'état antérieur est sauvegardé et restaurable.",
            reversible: true,
        },
    },
    {
        id: 'messagerie.appels_en_echec',
        domain: 'messagerie',
        title: "Taux d'échec des appels",
        why: "C'est le signal le plus direct d'une panne de transport, de jeton ou de réseau chez les utilisateurs.",
        weight: 24,
        location: 'serveur',
        expected: "Moins de 20 % d'appels en échec sur les 24 dernières heures.",
    },
    {
        id: 'messagerie.blocages_operationnels',
        domain: 'messagerie',
        title: "Mécanisme de blocage opérationnel",
        why: "Si la vérification de blocage tombe, une personne bloquée peut de nouveau notifier sa cible.",
        weight: 20,
        location: 'serveur',
        expected: "La fonction `are_users_blocked` existe et répond.",
    },

    // ────────────────────── DÉPLOIEMENT & NAVIGATEUR ──────────────────────

    {
        id: 'deploiement.scripts_tiers',
        domain: 'deploiement',
        title: "Aucun script tiers exécuté",
        why: "Un script servi par un domaine tiers s'exécute avec tous les droits de la page : il peut lire le jeton de session et agir au nom de l'utilisateur.",
        weight: 34,
        location: 'client',
        expected:
            "Aucune balise `<script>` ne pointe vers une origine externe (les polices, qui ne sont " +
            "pas exécutables, ne comptent pas).",
        humanAction:
            "Retirer `cdn.tailwindcss.com` et l'`importmap` `aistudiocdn.com` d'`index.html`, et " +
            "passer Tailwind en dépendance de build. Le paquet npm est déjà complet. " +
            "Attention : `tests/tailwindClassValidity.test.ts` vérifie aujourd'hui la PRÉSENCE du " +
            "CDN — ce garde-fou doit être retravaillé en même temps.",
    },
    {
        id: 'deploiement.csp',
        domain: 'deploiement',
        title: "Politique de sécurité du contenu",
        why: "La CSP est la dernière barrière : même en cas d'injection, elle empêche le code injecté de joindre un serveur extérieur.",
        weight: 26,
        location: 'client',
        expected: "Un en-tête `Content-Security-Policy` est servi sur la page.",
        humanAction:
            "Ajouter la politique dans `netlify.toml`, d'abord en `Content-Security-Policy-Report-Only` " +
            "pendant une semaine. À faire APRÈS le retrait des scripts tiers, sinon la politique doit " +
            "autoriser les domaines que l'on cherche justement à supprimer.",
    },
    {
        id: 'deploiement.entetes_securite',
        domain: 'deploiement',
        title: "En-têtes de sécurité présents",
        why: "Ils bloquent le détournement de clic, la devinette de type MIME et la fuite d'URL vers l'extérieur.",
        weight: 22,
        location: 'client',
        expected:
            "`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` et `Permissions-Policy` " +
            "sont tous les quatre servis.",
    },
    {
        id: 'deploiement.https_strict',
        domain: 'deploiement',
        title: "Transport chiffré imposé",
        why: "Sans HSTS, une première visite en clair peut être détournée avant la redirection.",
        weight: 18,
        location: 'client',
        expected: "La page est servie en HTTPS et l'en-tête `Strict-Transport-Security` est présent.",
    },

    // ───────────────────────────── LIVE ─────────────────────────────

    {
        id: 'live.transport_utilisable',
        domain: 'live',
        title: "Un direct peut réellement démarrer",
        why:
            "Le serveur de direct peut répondre « je suis vivant » tout en refusant nos identifiants : " +
            "plus aucun direct ne démarrerait, et une surveillance fondée sur le ping afficherait vert " +
            "pendant la panne. Cette ligne interroge l'appel dont dépend réellement l'ouverture d'un direct.",
        // La plus lourde du domaine : sans elle, aucune des trois autres n'a
        // d'objet — il n'y a plus de direct du tout à tenir propre.
        weight: 34,
        location: 'serveur',
        expected:
            "`POST /twirp/livekit.RoomService/ListRooms`, signé avec la clé du coffre, répond 200 avec " +
            "une liste de directs exploitable, dans le délai que la porte d'admission peut attendre " +
            "(le verdict rappelle le seuil exact en millisecondes).",
        humanAction:
            "Rouge « refuse nos identifiants » : la clé API du VPS et celle du coffre ont divergé — " +
            "les réaligner (voir deploy/livekit/README.md). Rouge « injoignable » : vérifier le conteneur " +
            "LiveKit et le reverse-proxy sur le VPS. Orange : le serveur répond trop lentement pour que " +
            "la porte d'admission tienne — regarder la charge de la machine.",
    },
    {
        id: 'live.sessions_zombies',
        domain: 'live',
        title: "Aucun direct resté ouvert",
        why: "Un direct jamais clôturé continue d'apparaître « en cours » à tout le monde et garde une salle de transport réservée.",
        weight: 28,
        location: 'serveur',
        expected: "Aucune session LIVE au statut « en cours » depuis plus de 24 heures.",
        remediation: {
            id: 'live.close_zombie_sessions',
            label: "Clôturer les directs restés ouverts",
            consequence:
                "Les sessions LIVE « en cours » depuis plus de 24 heures passent au statut « terminé », " +
                "avec une heure de fin posée à maintenant. Aucun direct réellement en cours n'est " +
                "concerné (aucun ne dure 24 heures). L'état antérieur est sauvegardé et restaurable.",
            reversible: true,
        },
    },
    {
        id: 'live.transcriptions_a_purger',
        domain: 'live',
        title: "Rétention des transcriptions respectée",
        why: "La règle annoncée aux utilisateurs est une purge 30 jours après la fin du direct : la tenir est un engagement, pas une option.",
        weight: 22,
        location: 'serveur',
        expected: "Aucune ligne de transcription au-delà de 30 jours après la fin de son direct.",
        remediation: {
            id: 'live.purge_expired_transcripts',
            label: "Appliquer la purge à 30 jours",
            consequence:
                "Les lignes de transcription dont le direct est terminé depuis plus de 30 jours sont " +
                "sauvegardées puis supprimées, conformément à la rétention annoncée. Restaurable " +
                "tant que la sauvegarde existe.",
            reversible: true,
        },
    },
    {
        id: 'live.intervenants_orphelins',
        domain: 'live',
        title: "Intervenants rattachés à un direct existant",
        why: "Des intervenants orphelins faussent la composition de scène et les comptages de participation.",
        weight: 16,
        location: 'serveur',
        expected:
            "Aucun intervenant orphelin, ET la contrainte `live_speakers_session_id_fkey` " +
            "(ON DELETE CASCADE) toujours en place.",
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue avant toute " +
            "purge.",
    },

    // ────────────────────────── NOTIFICATIONS ──────────────────────────

    {
        id: 'notifications.vapid_configuree',
        domain: 'notifications',
        title: "Clé de signature des notifications présente",
        why: "Sans clé VAPID, aucune notification ne part : l'appel ne réveille jamais le téléphone du correspondant.",
        weight: 34,
        location: 'serveur',
        expected: "Une configuration VAPID (clé publique + référence privée en Vault) existe.",
    },
    {
        id: 'notifications.taux_echec',
        domain: 'notifications',
        title: "Taux d'échec des envois",
        why: "Un taux qui grimpe signale une clé changée ou un service de push qui rejette : les appels cessent d'aboutir sans erreur visible.",
        weight: 28,
        location: 'serveur',
        expected: "Moins de 25 % d'échecs d'envoi sur les 24 dernières heures.",
    },
    {
        id: 'notifications.abonnements_morts',
        domain: 'notifications',
        title: "Abonnements vivants",
        why: "Un abonnement mort est réessayé à chaque appel, ralentit l'envoi et pollue les statistiques d'échec.",
        weight: 22,
        location: 'serveur',
        expected: "Aucun abonnement dont le dernier envoi a été refusé définitivement (410 ou 404).",
        remediation: {
            id: 'notifications.prune_dead_subscriptions',
            label: "Retirer les abonnements refusés définitivement",
            consequence:
                "Les abonnements dont le service de push a répondu 410 ou 404 sont sauvegardés puis " +
                "supprimés. L'appareil concerné se réabonnera seul à sa prochaine ouverture de " +
                "l'application. Restaurable intégralement.",
            reversible: true,
        },
    },
    {
        id: 'notifications.journal_volume',
        domain: 'notifications',
        title: "Volume du journal d'envoi",
        why: "Le journal sert au diagnostic récent ; conservé indéfiniment, il devient du poids mort.",
        weight: 16,
        location: 'serveur',
        expected: "Moins de 50 000 lignes dans `push_delivery_log`.",
        remediation: {
            id: 'notifications.purge_delivery_log',
            label: "Purger le journal au-delà de 30 jours",
            consequence:
                "Les lignes de `push_delivery_log` antérieures à 30 jours sont sauvegardées puis " +
                "supprimées. Le diagnostic récent (24 h) n'est pas affecté. Restaurable intégralement.",
            reversible: true,
        },
    },

    // ────────────────────────── GOUVERNANCE ──────────────────────────

    {
        id: 'gouvernance.schema_versionne',
        domain: 'gouvernance',
        title: "Schéma de production versionné",
        why: "Un schéma absent du dépôt n'est ni revu, ni reproductible en essai, ni restaurable — et rend toute revue de sécurité fondée sur le code source trompeuse.",
        weight: 40,
        location: 'serveur',
        expected:
            "Le nombre de tables en production est couvert par les migrations versionnées du dépôt.",
        humanAction:
            "`supabase db pull` pour capturer le schéma réel dans des migrations, puis rendre la " +
            "revue de migration obligatoire. Aucune réparation automatique : capturer un schéma " +
            "n'est pas une opération de base, c'est un acte de gouvernance qui doit passer en revue.",
    },
    {
        id: 'gouvernance.tables_sans_politique',
        domain: 'gouvernance',
        title: "Tables verrouillées volontairement, et elles seules",
        why: "Une table avec RLS mais sans aucune politique refuse TOUT le monde. C'est le bon choix pour un coffre ; c'est une fonctionnalité muette pour n'importe quelle autre table — et rien ne le signale à l'exécution.",
        weight: 32,
        location: 'serveur',
        expected:
            "Les seules tables sans politique sont les coffres assumés : `ai_provider_credentials`, " +
            "`push_vapid_config`, `live_transport_config`, `audit_logs`, `admin_api_rate_limits`, " +
            "`push_delivery_log`, `health_snapshots`.",
    },
    {
        id: 'gouvernance.journal_actions',
        domain: 'gouvernance',
        title: "Journal des actions alimenté",
        why: "Sans journal, une réparation appliquée un dimanche soir n'est traçable par personne.",
        weight: 28,
        location: 'serveur',
        expected: "La table `audit_logs` existe et reçoit les actions de santé.",
    },

    // ─────────────────────────── STOCKAGE ───────────────────────────

    {
        id: 'stockage.bucket_public',
        domain: 'stockage',
        title: "Espace de stockage disponible",
        why: "Sans le bucket `public`, tout téléversement de média échoue silencieusement à la publication.",
        weight: 40,
        location: 'serveur',
        expected: "Le bucket `public` existe.",
    },
    {
        id: 'stockage.documents_orphelins',
        domain: 'stockage',
        title: "Documents rattachés à une publication existante",
        why: "Un document orphelin occupe l'espace sans qu'aucune interface ne puisse plus l'afficher ni le supprimer.",
        weight: 34,
        location: 'serveur',
        expected:
            "Aucune référence de document orpheline, ET la contrainte " +
            "`post_documents_post_id_fkey` (ON DELETE CASCADE) toujours en place.",
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue. " +
            "Note distincte : la cascade retire la RÉFÉRENCE en base, jamais le fichier dans le " +
            "bucket — le nettoyage du stockage lui-même reste à écrire.",
    },
    {
        id: 'stockage.validation_televersement',
        domain: 'stockage',
        title: "Validation des fichiers téléversés",
        why: "Sans limite de type ni de taille, un seul envoi peut saturer le stockage ou déposer un contenu inattendu.",
        weight: 26,
        location: 'humain',
        expected: "Type MIME et taille validés côté application ET limités sur le bucket.",
        humanAction:
            "Ajouter la validation dans `uploadContentMedia` (services/supabaseClient.ts) et poser " +
            "les mêmes limites sur le bucket dans la console Supabase → Storage.",
    },

    // ─────────────────────── CONTENU & VIE SOCIALE ───────────────────────

    {
        id: 'contenu.publications_bloquees',
        domain: 'contenu',
        title: "Publications programmées effectivement parties",
        why: "Une publication dont l'heure est passée mais qui reste en brouillon ne paraîtra jamais : l'auteur croit avoir publié, personne ne voit rien.",
        weight: 30,
        location: 'serveur',
        expected: "Aucune publication dont l'heure programmée est dépassée et qui n'est pas publiée.",
        remediation: {
            id: 'contenu.release_scheduled_posts',
            label: "Publier les publications en retard",
            consequence:
                "Les publications dont l'heure programmée est dépassée passent au statut « publiée » " +
                "et deviennent visibles selon leur visibilité d'origine. Leur contenu n'est pas " +
                "modifié. L'état antérieur est sauvegardé et restaurable.",
            reversible: true,
        },
    },
    {
        id: 'contenu.stories_expirees',
        domain: 'contenu',
        title: "Stories retirées à leur expiration",
        why: "Une story est un contenu éphémère : la garder au-delà de sa date d'expiration trahit l'attente de la personne qui l'a publiée.",
        weight: 26,
        location: 'serveur',
        expected: "Aucune story conservée au-delà de sa date d'expiration.",
        remediation: {
            id: 'contenu.purge_expired_stories',
            label: "Retirer les stories expirées",
            consequence:
                "Les stories dont la date d'expiration est dépassée sont sauvegardées puis supprimées, " +
                "conformément à leur nature éphémère. Restaurable tant que la sauvegarde existe.",
            reversible: true,
        },
    },
    {
        id: 'contenu.notifications_obsoletes',
        domain: 'contenu',
        title: "File de notifications maîtrisée",
        why: "Des notifications lues accumulées pendant des mois alourdissent chaque ouverture de l'application sans rien apporter.",
        weight: 24,
        location: 'serveur',
        expected: "Moins de 20 000 notifications, et aucune notification lue de plus de 90 jours.",
        remediation: {
            id: 'contenu.purge_old_notifications',
            label: "Purger les notifications lues de plus de 90 jours",
            consequence:
                "Les notifications DÉJÀ LUES et antérieures à 90 jours sont sauvegardées puis " +
                "supprimées. Aucune notification non lue n'est touchée. Restaurable intégralement.",
            reversible: true,
        },
    },
    {
        id: 'contenu.experts_disponibles',
        domain: 'contenu',
        title: "Experts disponibles",
        why: "Sans expert actif, les Experts IA disparaissent du LIVE, du fil et de l'Architecte sans message d'explication.",
        weight: 20,
        location: 'serveur',
        expected: "Au moins un expert actif dans le catalogue.",
    },

    // ──────────────── EXPÉRIENCE & APPLICATION INSTALLÉE ────────────────
    //
    // Domaine mesuré DEPUIS LE NAVIGATEUR : ce sont les seules lignes que le
    // serveur ne peut pas constater à la place de l'utilisateur.

    {
        id: 'experience.service_worker',
        domain: 'experience',
        title: "Service worker actif",
        why: "C'est lui qui réveille le téléphone sur un appel entrant et qui fait fonctionner l'application hors connexion. Sans lui, les notifications d'appel ne s'affichent jamais.",
        weight: 35,
        location: 'client',
        expected: "Un service worker est enregistré et contrôle la page.",
    },
    {
        id: 'experience.manifeste',
        domain: 'experience',
        title: "Manifeste d'installation joignable",
        why: "Sans manifeste, MokNet ne peut pas être installé sur l'écran d'accueil : l'application reste un simple onglet.",
        weight: 25,
        location: 'client',
        expected: "`/manifest.webmanifest` répond et contient un nom et des icônes.",
    },
    {
        id: 'experience.module_messagerie',
        domain: 'experience',
        title: "Module messagerie autonome installable",
        why: "La messagerie s'installe comme une application séparée ; si sa route ou son manifeste tombe, l'icône déjà posée sur les téléphones ouvre une page d'erreur.",
        weight: 20,
        location: 'client',
        expected: "`/manifests/messagerie.webmanifest` répond et `/messagerie` renvoie l'application.",
    },
    {
        id: 'experience.stockage_local',
        domain: 'experience',
        title: "Stockage local disponible",
        why: "La session, le brouillon en cours et le cache des conversations y vivent : sans lui, l'utilisateur est déconnecté à chaque rechargement.",
        weight: 20,
        location: 'client',
        expected: "`localStorage` est accessible en lecture et en écriture.",
    },

    // ────────────────────────── DÉPENDANCES ──────────────────────────

    {
        id: 'dependances.vulnerabilites',
        domain: 'dependances',
        title: "Dépendances sans vulnérabilité connue",
        why: "Une bibliothèque qui analyse des fichiers fournis par les utilisateurs est le premier endroit où une vulnérabilité connue devient exploitable.",
        weight: 55,
        location: 'humain',
        expected: "`npm audit --audit-level=high` ne remonte aucune vulnérabilité.",
        humanAction:
            "Mesure non exécutable depuis le navigateur. Ajouter `npm audit --audit-level=high` au " +
            "Green Gate (.github/workflows/ci.yml) : la ligne deviendra alors verte ou rouge à " +
            "chaque intégration, au lieu de rester non éprouvée. " +
            "Connu au 04/09/2026 : `xlsx@0.18.5`, 1 vulnérabilité haute sans correctif npm.",
    },
    {
        id: 'dependances.green_gate',
        domain: 'dependances',
        title: "Contrôle indépendant au vert",
        why: "Le typage, les tests et le build sont la seule preuve que ce qui est livré fonctionne encore.",
        weight: 45,
        location: 'humain',
        expected: "Le dernier passage du Green Gate est vert sur la branche principale.",
        humanAction:
            "Mesure non exécutable depuis le navigateur. À lire dans l'onglet Actions du dépôt, ou à " +
            "rendre automatique en publiant le résultat du Green Gate dans une table de santé.",
    },
];

/** Index par identifiant — utilisé par le service et l'interface. */
export const HEALTH_LINE_BY_ID: ReadonlyMap<string, HealthLine> = new Map(
    HEALTH_LINES.map((line) => [line.id, line]),
);

export const HEALTH_DOMAIN_BY_ID: ReadonlyMap<HealthDomainId, HealthDomain> = new Map(
    HEALTH_DOMAINS.map((domain) => [domain.id, domain]),
);

/** Lignes d'un domaine, dans l'ordre de déclaration. */
export function linesOfDomain(domainId: HealthDomainId): HealthLine[] {
    return HEALTH_LINES.filter((line) => line.domain === domainId);
}

/**
 * Catalogue des réparations réellement proposées par le registre. Sert de
 * contrôle croisé avec le catalogue SQL : un identifiant présent d'un seul
 * côté est une erreur de câblage, pas une fonctionnalité.
 */
export const REMEDIATION_IDS: string[] = HEALTH_LINES
    .map((line) => line.remediation?.id)
    .filter((id): id is string => Boolean(id));
