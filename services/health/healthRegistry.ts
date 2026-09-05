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

import { HealthBlock, HealthBlockId, HealthDomain, HealthDomainId, HealthLine } from './healthTypes';

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

/**
 * Les 7 blocs de lecture (Direction, 05/09/2026). Chaque bloc répond à une
 * question ; chaque ligne déclare le sien, explicitement. L'ordre est celui
 * de l'affichage.
 */
export const HEALTH_BLOCKS: HealthBlock[] = [
    { id: 'securite',    title: 'Sécurité',          question: "Qui peut lire ou écrire quoi, et le modèle de droits tient-il ?" },
    { id: 'application', title: 'Application',       question: "Ce que le navigateur reçoit et installe réellement : code servi, en-têtes, application installable." },
    { id: 'connecteurs', title: 'Connecteurs',       question: "Les intégrations configurées — IA, notifications, transport du direct — ont-elles ce qu'il faut pour marcher ?" },
    { id: 'live',        title: 'Live',              question: "Les directs et les appels sont-ils propres, joignables et sous contrôle ?" },
    { id: 'vps',         title: 'VPS',               question: "Le serveur de direct sur le VPS répond-il, avec nos identifiants, assez vite ?" },
    { id: 'base',        title: 'Base de données',   question: "Les données sont-elles intègres, tenues et versionnées ?" },
    { id: 'externes',    title: 'Services externes', question: "Les services tiers dont MokNet dépend répondent-ils correctement ?" },
];

export const HEALTH_LINES: HealthLine[] = [

    // ───────────────────────────── SÉCURITÉ ─────────────────────────────

    {
        id: 'securite.forge_credits',
        domain: 'securite',
        bloc: 'securite',
        title: "Attribution de crédits réservée au serveur",
        why: "Un compte ordinaire ne doit pas pouvoir se créditer lui-même : les crédits achètent en boutique, offrent en LIVE et alimentent les cagnottes.",
        weight: 20,
        location: 'serveur',
        expected: "`award_xp_and_credits` n'est PAS exécutable par le rôle `authenticated`.",
        cause:
            "`award_xp_and_credits` est `SECURITY DEFINER`, exécutable par défaut par `authenticated`, et " +
            "son contrôle interne autorise l'appelant à se cibler lui-même avant de désactiver le garde des " +
            "colonnes sensibles (constat R-01 de l'audit du 04/09/2026).",
        impact:
            "N'importe quel compte connecté peut, en un seul appel, se créditer un montant arbitraire et le " +
            "dépenser en boutique, en cadeaux de LIVE ou dans les cagnottes : l'économie de MokNet perd toute " +
            "intégrité.",
        risk: 'critique',
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
        bloc: 'securite',
        title: "Crédit de portefeuille non déclarable par le client",
        why: "Un crédit doit naître d'un encaissement constaté, jamais d'un montant envoyé par le navigateur.",
        weight: 13,
        location: 'serveur',
        expected: "`insert_wallet_transaction` n'est PAS exécutable par le rôle `authenticated`.",
        cause:
            "`insert_wallet_transaction` ne vérifie le solde que pour les débits et les blocages : pour le " +
            "type `credit`, le montant envoyé par le navigateur est inscrit tel quel dans le grand livre " +
            "(constat R-03 de l'audit).",
        impact:
            "Un compte peut se fabriquer un solde de portefeuille arbitraire. Le grand livre est vide et la " +
            "boutique inactive aujourd'hui ; dès l'ouverture du commerce, des achats seraient réglés avec un " +
            "argent jamais encaissé.",
        risk: 'critique',
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
        bloc: 'securite',
        title: "Sécurité au niveau ligne active partout",
        why: "Sans RLS, une seule requête bien formée depuis un compte quelconque lit toute la table.",
        weight: 13,
        location: 'serveur',
        expected: "100 % des tables du schéma `public` ont la RLS activée.",
        cause:
            "Une table a été créée, depuis la console ou par une migration, sans `enable row level security`, " +
            "ou la RLS a été désactivée le temps d'un débogage et jamais réactivée.",
        impact:
            "Chaque table citée dans le verdict est lisible et modifiable en entier par n'importe quel compte " +
            "connecté, d'une seule requête sur l'API : messages, profils ou journaux selon la table.",
        risk: 'critique',
        recommendedAction:
            "Pour chaque table citée dans le verdict, exécuter dans l'éditeur SQL Supabase " +
            "`alter table public.<table> enable row level security;` puis écrire ses politiques — une table " +
            "protégée sans politique refuse tout le monde (voir « Tables verrouillées volontairement »). " +
            "Relancer la mesure.",
    },
    {
        id: 'securite.coffre_cles',
        domain: 'securite',
        bloc: 'securite',
        title: "Coffre de clés hors de portée du navigateur",
        why: "Les clés des fournisseurs IA, la clé privée VAPID et les secrets LiveKit ne doivent jamais être atteignables depuis une session utilisateur.",
        weight: 14,
        location: 'serveur',
        expected:
            "Aucune fonction `*_internal` (secrets fournisseurs, VAPID, transport LIVE) n'est " +
            "exécutable par le rôle `authenticated`.",
        cause:
            "Une fonction `*_internal` a été créée ou recréée sans `revoke execute … from authenticated` : " +
            "PostgreSQL accorde par défaut le droit d'exécution à `public`, donc à tout compte connecté.",
        impact:
            "Un compte ordinaire peut lire les clés des fournisseurs IA, la clé privée VAPID ou le secret " +
            "LiveKit, puis dépenser le budget IA, forger des notifications ou ouvrir des salles de direct au " +
            "nom de MokNet.",
        risk: 'critique',
        recommendedAction:
            "Pour chaque fonction citée dans le verdict, exécuter dans l'éditeur SQL Supabase " +
            "`revoke execute on function public.<fonction> from public, anon, authenticated;` — seul " +
            "`service_role` doit la conserver. Faire ensuite tourner les clés exposées (fournisseurs IA, " +
            "VAPID, LiveKit) par précaution, puis relancer la mesure.",
    },
    {
        id: 'securite.garde_role',
        domain: 'securite',
        bloc: 'securite',
        title: "Élévation de rôle impossible",
        why: "Sans ce garde-fou, une simple mise à jour de son propre profil suffirait à se nommer administrateur.",
        weight: 12,
        location: 'serveur',
        expected:
            "Le déclencheur `trg_profiles_protect_sensitive` est présent et ACTIF sur `profiles`.",
        cause:
            "Le déclencheur a été désactivé (`alter table … disable trigger`) pour une opération de " +
            "maintenance et n'a pas été réarmé, ou il a été perdu lors d'une recréation de la table `profiles`.",
        impact:
            "Toute personne connectée peut, en modifiant son propre profil, se donner le rôle administrateur, " +
            "des crédits, de l'XP ou un niveau : c'est la porte d'entrée de toute la gouvernance de MokNet.",
        risk: 'critique',
        recommendedAction:
            "Réarmer immédiatement le déclencheur dans l'éditeur SQL Supabase : " +
            "`alter table public.profiles enable trigger trg_profiles_protect_sensitive;`. S'il est absent, le " +
            "recréer d'après sa définition de production (`supabase db pull`), puis vérifier qu'aucun profil " +
            "n'a changé de rôle entre-temps (`select id, role from public.profiles where role in ('admin', " +
            "'super_admin');`). Relancer la mesure.",
    },
    {
        id: 'securite.secdef_search_path',
        domain: 'securite',
        bloc: 'securite',
        title: "Chemin de recherche figé sur les fonctions privilégiées",
        why: "Une fonction privilégiée au chemin de recherche libre peut être détournée vers une table piégée.",
        weight: 10,
        location: 'serveur',
        expected: "Toutes les fonctions `SECURITY DEFINER` ont un `search_path` explicitement figé.",
        cause:
            "Une fonction `SECURITY DEFINER` a été créée ou recréée sans la clause `set search_path`, le plus " +
            "souvent depuis l'éditeur SQL de la console, en dehors des migrations qui la posent " +
            "systématiquement.",
        impact:
            "Un compte capable de créer un objet dans un schéma consulté avant `public` peut y placer une " +
            "table ou une fonction piégée et faire exécuter son code avec les droits du propriétaire de la " +
            "fonction.",
        risk: 'eleve',
        recommendedAction:
            "Pour chaque fonction citée dans le verdict, exécuter dans l'éditeur SQL Supabase " +
            "`alter function public.<fonction>(<types des arguments>) set search_path = public, pg_temp;` " +
            "(la signature exacte se lit dans Database → Functions). Relancer la mesure.",
    },
    {
        id: 'securite.depense_ia_publique',
        domain: 'securite',
        bloc: 'securite',
        title: "Dépense IA réservée aux administrateurs",
        why: "Le budget consommé par l'organisation n'a pas à être lisible par n'importe quel compte.",
        weight: 6,
        location: 'serveur',
        expected: "`get_ai_spend` n'est pas exécutable par le rôle `authenticated`.",
        cause:
            "`get_ai_spend` a reçu à sa création le droit d'exécution par défaut de PostgreSQL, alors " +
            "qu'elle n'est appelée que depuis l'écran Super Admin (constat J-01a de l'audit).",
        impact:
            "Tout compte connecté peut consulter le budget IA consommé par l'organisation, jour par jour : " +
            "une information de gestion interne devient publique, sans possibilité d'agir sur les dépenses.",
        risk: 'moyen',
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
        bloc: 'securite',
        title: "Portée du rôle anonyme",
        why: "La RLS tient, mais un droit de lecture anonyme trop large transforme la moindre politique permissive écrite demain en fuite publique.",
        weight: 5,
        location: 'serveur',
        expected:
            "Le rôle `anon` n'a de droit de lecture que sur les tables réellement publiques " +
            "(fil public et profils).",
        cause:
            "Supabase accorde par défaut `SELECT` au rôle `anon` sur chaque nouvelle table du schéma " +
            "`public` ; personne ne l'a retiré sur les tables qui ne servent pas le fil public (constat O-05 : " +
            "78 tables concernées).",
        impact:
            "Aujourd'hui la RLS bloque les lignes et rien ne fuit. Mais la première politique écrite demain " +
            "avec `using (true)` sur l'une de ces tables la rendrait lisible sans compte, depuis n'importe " +
            "quel navigateur.",
        risk: 'moyen',
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
        bloc: 'securite',
        title: "Refus des mots de passe compromis",
        why: "Un mot de passe déjà présent dans une fuite connue rend le compte prenable sans aucune faille applicative.",
        weight: 3,
        location: 'humain',
        expected: "La vérification HaveIBeenPwned est activée dans Supabase Auth.",
        cause:
            "L'option « Leaked password protection » de Supabase Auth est désactivée par défaut à la " +
            "création d'un projet, et elle n'a jamais été cochée (constat O-06 de l'audit).",
        impact:
            "Une personne qui s'inscrit avec un mot de passe déjà présent dans une fuite publique peut se " +
            "faire prendre son compte par simple rejeu, sans qu'aucune faille de MokNet soit nécessaire.",
        risk: 'moyen',
        humanAction:
            "Console Supabase → Authentication → Policies → activer « Leaked password protection ». " +
            "Aucun code à modifier ; réglage hors de portée d'une fonction serveur.",
        manual: {
            where: "Supabase → Authentication → Attack Protection",
            url: "{supabase}/auth/protection",
            steps: [
                "Ouvrir la console du projet MokNet, menu Authentication, puis la page Attack Protection.",
                "Activer l'interrupteur « Leaked password protection » (vérification HaveIBeenPwned) et enregistrer.",
                "Aucun code à modifier : les mots de passe compromis seront refusés dès la prochaine inscription ou le prochain changement de mot de passe.",
                "Cette ligne restant une vérification humaine, noter la date d'activation dans le journal des décisions.",
            ],
        },
    },
    {
        id: 'securite.cors_fonctions',
        domain: 'securite',
        bloc: 'securite',
        title: "Fonctions serveur réservées aux origines MokNet",
        why: "Une fonction serveur qui répond à n'importe quel site (« * ») laisse une page étrangère l'appeler avec un jeton dérobé, sans que le navigateur s'y oppose.",
        weight: 4,
        location: 'serveur',
        expected:
            "Aucune fonction Edge ne renvoie `Access-Control-Allow-Origin: *` ni n'accepte une origine " +
            "étrangère (mesuré par une requête de pré-vol depuis une origine inventée).",
        cause:
            "Les cinq premières fonctions ont été écrites avec l'en-tête CORS ouvert par défaut " +
            "(constat O-03 de l'audit du 04/09/2026) ; `health-guardian` se restreint seule.",
        impact:
            "Un site tiers peut appeler l'API au nom d'un utilisateur dont le jeton a fuité. Aucune " +
            "donnée n'est exposée par cet en-tête seul : c'est une marge de défense en profondeur perdue.",
        risk: 'moyen',
        humanAction:
            "Remplacer `'*'` par la liste des origines MokNet dans `corsHeaders` des cinq fonctions " +
            "ai-gateway, discover-provider, livekit-token, mint-live-token et push-notify, puis les redéployer.",
        manual: {
            where: "Dépôt GitHub → supabase/functions/<fonction>/index.ts (cinq fichiers)",
            url: "{repo}/tree/main/supabase/functions",
            steps: [
                "Dans chacun des cinq fichiers index.ts, remplacer 'Access-Control-Allow-Origin': '*' par l'origine appelante si elle est dans la liste MokNet (https://moknet.net, https://www.moknet.net, le site Netlify de production), sinon la première de la liste — même règle que health-guardian.",
                "Ajouter 'Vary': 'Origin' à côté, pour que les caches ne servent pas la réponse d'une origine à une autre.",
                "Redéployer les cinq fonctions (supabase functions deploy <nom>), puis relancer la mesure : la ligne passe au vert quand plus aucune ne répond « * » à une origine inconnue.",
            ],
        },
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
        bloc: 'base',
        title: "Messages rattachés à une conversation existante",
        why: "Un message orphelin n'est plus lisible par personne mais reste stocké, et fausse tous les comptages.",
        weight: 22,
        location: 'serveur',
        expected:
            "Aucun message orphelin, ET la contrainte `messages_conversation_id_fkey` " +
            "(ON DELETE CASCADE) toujours en place.",
        cause:
            "La contrainte `messages_conversation_id_fkey` a été supprimée ou recréée sans `ON DELETE " +
            "CASCADE`, généralement lors d'une modification manuelle de la table `messages` ou d'un import " +
            "de données.",
        impact:
            "À chaque suppression de conversation, ses messages restent stockés sans être lisibles par " +
            "personne ; les comptages et statistiques de messagerie deviennent faux, et la table grossit sans " +
            "limite.",
        risk: 'eleve',
        humanAction:
            "Si cette ligne vire au rouge, la contrainte de clé étrangère a été perdue : la rétablir " +
            "plutôt que purger les orphelins, sinon ils reviendront.",
        manual: {
            where: "Supabase → SQL Editor (projet MokNet)",
            url: "{supabase}/sql/new",
            steps: [
                "Vérifier la contrainte : select pg_get_constraintdef(oid) from pg_constraint where conname = 'messages_conversation_id_fkey'; — elle doit contenir ON DELETE CASCADE.",
                "Si elle manque, la rétablir : alter table public.messages add constraint messages_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade;",
                "Si cette commande est refusée à cause d'orphelins déjà présents, les exporter (Table Editor → messages) puis les supprimer : delete from public.messages m where not exists (select 1 from public.conversations c where c.id = m.conversation_id); et rejouer l'étape précédente.",
                "Relancer la mesure : la ligne repasse au vert quand la contrainte est en place et le compteur d'orphelins à zéro.",
            ],
        },
    },
    {
        id: 'donnees.participants_fantomes',
        domain: 'donnees',
        bloc: 'base',
        title: "Participants rattachés à un compte existant",
        why: "Un participant fantôme fait apparaître un correspondant introuvable dans une conversation.",
        weight: 20,
        location: 'serveur',
        expected:
            "Aucun participant orphelin, ET les deux contraintes de " +
            "`conversation_participants` toujours en place.",
        cause:
            "L'une des deux contraintes de `conversation_participants` (vers `conversations` ou vers " +
            "`profiles`) a été supprimée ou recréée sans cascade lors d'une intervention manuelle sur la table.",
        impact:
            "Une conversation affiche un correspondant introuvable, ou un compte supprimé reste « membre » de " +
            "ses anciens fils : listes de participants, compteurs de non-lus et vérifications d'appartenance " +
            "(jetons d'appel, notifications) deviennent faux.",
        risk: 'eleve',
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue avant toute " +
            "purge.",
        manual: {
            where: "Supabase → SQL Editor (projet MokNet)",
            url: "{supabase}/sql/new",
            steps: [
                "Lister les contraintes présentes : select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid = 'public.conversation_participants'::regclass; — les deux clés étrangères doivent porter ON DELETE CASCADE.",
                "Rétablir celle qui manque, par exemple : alter table public.conversation_participants add constraint conversation_participants_conversation_id_fkey foreign key (conversation_id) references public.conversations(id) on delete cascade; (même forme vers public.profiles(id) pour la colonne user_id).",
                "Si la commande est refusée à cause de fantômes déjà présents, les exporter puis les supprimer : delete from public.conversation_participants p where not exists (select 1 from public.conversations c where c.id = p.conversation_id); et rejouer l'étape précédente.",
                "Relancer la mesure.",
            ],
        },
    },
    {
        id: 'donnees.conversations_vides',
        domain: 'donnees',
        bloc: 'base',
        title: "Conversations avec au moins un participant",
        why: "Une conversation sans participant n'est accessible à personne et encombre les listes. Cas réel : la suppression d'un compte emporte ses participations en cascade et peut laisser la conversation vide derrière elle.",
        weight: 16,
        location: 'serveur',
        expected: "Aucune conversation sans aucun participant.",
        cause:
            "La suppression d'un compte emporte ses participations en cascade ; quand il était le dernier " +
            "membre, la conversation reste en base sans plus aucun participant, car rien ne la supprime à " +
            "son tour.",
        impact:
            "Ces conversations encombrent les listes d'administration et les comptages sans être accessibles " +
            "à personne ; leurs messages restent stockés pour rien.",
        risk: 'faible',
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
        bloc: 'base',
        title: "Réactions et commentaires rattachés à un contenu existant",
        why: "Des réactions orphelines gonflent artificiellement les compteurs d'un contenu supprimé.",
        weight: 16,
        location: 'serveur',
        expected:
            "Aucune réaction ni commentaire orphelin, ET les contraintes vers `posts` " +
            "toujours en place.",
        cause:
            "Une contrainte de `post_reactions` ou de `comments` vers `posts` a été supprimée ou recréée " +
            "sans `ON DELETE CASCADE` lors d'une intervention manuelle.",
        impact:
            "Les réactions et commentaires d'une publication supprimée restent comptés : les compteurs du fil " +
            "et les classements de popularité se gonflent artificiellement, sans qu'aucune donnée " +
            "confidentielle ne soit exposée.",
        risk: 'faible',
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue avant toute " +
            "purge.",
        manual: {
            where: "Supabase → SQL Editor (projet MokNet)",
            url: "{supabase}/sql/new",
            steps: [
                "Vérifier les contraintes : select conname, pg_get_constraintdef(oid) from pg_constraint where conrelid in ('public.post_reactions'::regclass, 'public.comments'::regclass); — celles vers posts doivent porter ON DELETE CASCADE.",
                "Rétablir celle qui manque, par exemple : alter table public.post_reactions add constraint post_reactions_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade; (même forme pour la contrainte de comments vers posts).",
                "Si la commande est refusée à cause d'orphelins déjà présents, les exporter puis les supprimer : delete from public.post_reactions r where not exists (select 1 from public.posts p where p.id = r.post_id); (même requête pour comments), et rejouer l'étape précédente.",
                "Relancer la mesure.",
            ],
        },
    },
    {
        id: 'donnees.coherence_amities',
        domain: 'donnees',
        bloc: 'base',
        title: "Relations d'amitié cohérentes",
        why: "Une auto-amitié ou un doublon symétrique casse les comptages d'amis communs et le calcul de visibilité réseau.",
        weight: 14,
        location: 'serveur',
        expected: "Aucune auto-amitié, aucun couple en double.",
        cause:
            "Deux demandes croisées envoyées au même instant, ou une insertion faite hors de l'application, " +
            "ont contourné la vérification côté client : `friendships` n'a ni contrainte d'unicité sur le " +
            "couple non ordonné, ni règle interdisant `requester_id = addressee_id`.",
        impact:
            "Les amis communs sont comptés deux fois, une personne peut apparaître « amie avec elle-même », " +
            "et la visibilité « réseau » des publications se calcule sur des relations fausses.",
        risk: 'faible',
        recommendedAction:
            "Dans l'éditeur SQL Supabase, après export des lignes concernées : supprimer les auto-amitiés " +
            "(`delete from public.friendships where requester_id = addressee_id;`) et, pour chaque couple en " +
            "double, ne conserver que la ligne la plus ancienne ; poser ensuite une contrainte " +
            "`check (requester_id <> addressee_id)` et un index unique sur " +
            "`(least(requester_id, addressee_id), greatest(requester_id, addressee_id))` pour que le cas ne " +
            "revienne pas. Relancer la mesure.",
    },
    {
        id: 'donnees.profils_sans_compte',
        domain: 'donnees',
        bloc: 'base',
        title: "Profils adossés à un compte réel",
        why: "Un profil sans compte d'authentification est un fantôme : il apparaît en recherche mais personne ne peut s'y connecter.",
        weight: 12,
        location: 'serveur',
        expected: "Chaque profil correspond à un compte `auth.users` existant.",
        cause:
            "Un compte a été supprimé directement dans Supabase Auth (console ou API d'administration) alors " +
            "que `profiles` n'est pas lié à `auth.users` par une cascade, ou un profil a été inséré à la main " +
            "sans compte correspondant.",
        impact:
            "Le profil fantôme apparaît dans la recherche, les suggestions et les listes d'amis, mais " +
            "personne ne peut s'y connecter ni le joindre : messages et demandes d'amitié partent dans le " +
            "vide.",
        risk: 'eleve',
        humanAction:
            "Aucune purge automatique : supprimer un profil détruit ses publications, messages et " +
            "relations en cascade. À traiter au cas par cas depuis Super Admin → Utilisateurs.",
        manual: {
            where: "Supabase → SQL Editor (identification), puis MokNet → Super Admin → Utilisateurs (suppression)",
            url: "{supabase}/sql/new",
            steps: [
                "Identifier les profils concernés : select p.id, p.name, p.email from public.profiles p where not exists (select 1 from auth.users u where u.id = p.id);",
                "Pour chacun, vérifier dans Authentication → Users qu'aucun compte ne lui correspond ; en cas de doute, contacter la personne avant toute suppression.",
                "Supprimer le profil fantôme depuis Super Admin → Utilisateurs, un par un — ses publications, messages et relations partent en cascade : exporter d'abord ce qui doit être conservé.",
                "Relancer la mesure.",
            ],
        },
    },

    // ───────────────────────────── IA ─────────────────────────────

    {
        id: 'ia.fournisseur_actif',
        domain: 'ia',
        bloc: 'connecteurs',
        title: "Au moins un fournisseur actif par catégorie",
        why: "Sans fournisseur actif, la traduction, la voix et les Experts cessent de répondre sans message clair.",
        weight: 24,
        location: 'serveur',
        expected: "Chaque catégorie (texte, voix, image/vidéo) a au moins un fournisseur actif avec un secret.",
        cause:
            "Le dernier fournisseur d'une catégorie a été désactivé, ou sa clé retirée, dans Super Admin → " +
            "Connecteurs IA sans qu'un remplaçant soit activé — ou la catégorie n'a jamais reçu de fournisseur " +
            "sur cet environnement.",
        impact:
            "La traduction, la transcription vocale, la génération d'images ou les Experts cessent de " +
            "répondre pour tous les utilisateurs, avec une erreur générique et sans explication.",
        risk: 'critique',
        recommendedAction:
            "Dans MokNet → Super Admin → Connecteurs IA, activer au moins un fournisseur pour chaque " +
            "catégorie citée dans le verdict (texte, voix, image/vidéo) et enregistrer sa clé : le fournisseur " +
            "doit être au statut « actif » ET posséder un secret en Vault. Relancer la mesure.",
    },
    {
        id: 'ia.secrets_presents',
        domain: 'ia',
        bloc: 'connecteurs',
        title: "Chaque fournisseur activé possède sa clé",
        why: "Un fournisseur activé sans secret échoue à chaque appel et fait basculer inutilement vers le suivant.",
        weight: 18,
        location: 'serveur',
        expected: "Aucun fournisseur marqué actif sans référence de secret en Vault.",
        cause:
            "Un fournisseur a été activé dans Super Admin → Connecteurs IA avant que sa clé soit " +
            "enregistrée, ou son secret a été supprimé du Vault sans que le fournisseur soit désactivé.",
        impact:
            "Chaque requête routée vers ce fournisseur échoue avant même de partir puis bascule vers le " +
            "suivant : latence doublée pour les utilisateurs, statistiques d'échec faussées, et fournisseur " +
            "marqué « défaillant » à tort pendant sept jours.",
        risk: 'moyen',
        recommendedAction:
            "Dans MokNet → Super Admin → Connecteurs IA, ouvrir chaque fournisseur cité dans le verdict et " +
            "soit enregistrer sa clé (rangée dans le Vault par `set_ai_provider_secret`), soit le désactiver " +
            "s'il ne doit plus servir. Relancer la mesure.",
    },
    {
        id: 'ia.budget_arme',
        domain: 'ia',
        bloc: 'connecteurs',
        title: "Plafond de dépense armé",
        why: "Sans plafond appliqué, une boucle d'appels peut consommer le budget IA en une nuit.",
        weight: 18,
        location: 'serveur',
        expected: "`ai_budget.enforced` est vrai et au moins un plafond (jour ou mois) est défini.",
        cause:
            "`ai_budget.enforced` a été laissé à faux après la saisie des plafonds (mode observation), ou " +
            "aucun plafond journalier ni mensuel n'a jamais été saisi dans Super Admin → Connecteurs IA.",
        impact:
            "Une boucle d'appels, un compte abusif ou un Expert mal réglé peut consommer en une nuit tout le " +
            "budget IA de l'organisation, facturé par les fournisseurs sans qu'aucune limite ne s'interpose.",
        risk: 'eleve',
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
        bloc: 'connecteurs',
        title: "Plafond par utilisateur",
        why: "Le plafond actuel est global : un seul compte peut épuiser le budget de toute l'organisation.",
        weight: 16,
        location: 'serveur',
        expected: "Un plafond par utilisateur et par fenêtre existe, en plus du plafond global.",
        cause:
            "La passerelle `ai-gateway` n'a été écrite qu'avec un plafond global (`ai_budget`, ligne " +
            "`global`) ; le compteur par expéditeur n'existe que dans `push-notify` (constat O-01 de l'audit).",
        impact:
            "Un seul compte, par abus ou par script, peut atteindre le plafond global et priver tous les " +
            "autres utilisateurs de traduction, de voix et d'Experts jusqu'à la fenêtre suivante.",
        risk: 'moyen',
        humanAction:
            "Développement requis dans `supabase/functions/ai-gateway` : reprendre le compteur par " +
            "expéditeur déjà écrit dans `push-notify` (MAX_SENDS_PER_MINUTE). Aucune réparation " +
            "automatique possible — c'est du code, pas un réglage.",
        manual: {
            where: "Dépôt GitHub → supabase/functions/ai-gateway/index.ts",
            url: "{repo}/blob/main/supabase/functions/ai-gateway/index.ts",
            steps: [
                "Confier à l'équipe de développement l'ajout d'un compteur par utilisateur et par fenêtre glissante dans ai-gateway, sur le modèle de MAX_SENDS_PER_MINUTE dans supabase/functions/push-notify/index.ts (refus 429 au-delà du seuil).",
                "Faire passer la modification par une pull request avec ses tests, puis par le Green Gate (onglet Actions du dépôt).",
                "Déployer la fonction (supabase functions deploy ai-gateway) et faire mettre à jour la sonde de cette ligne pour qu'elle mesure le nouveau plafond au lieu de rapporter l'état du code.",
                "Relancer la mesure.",
            ],
        },
    },
    {
        id: 'ia.taux_echec',
        domain: 'ia',
        bloc: 'externes',
        title: "Taux d'échec des appels IA",
        why: "Un taux d'échec qui grimpe signale une clé expirée, un quota atteint ou un fournisseur en panne, bien avant que les utilisateurs se plaignent.",
        weight: 14,
        location: 'serveur',
        expected: "Moins de 10 % d'appels en échec sur les 24 dernières heures.",
        cause:
            "Une clé de fournisseur a expiré ou été révoquée, le quota du fournisseur est atteint, le " +
            "fournisseur lui-même est en panne, ou le plafond de dépense est atteint et refuse les appels.",
        impact:
            "Les utilisateurs reçoivent des réponses vides ou des erreurs en traduction, en transcription et " +
            "dans les Experts ; les basculements successifs allongent chaque requête et gonflent la dépense " +
            "sans résultat.",
        risk: 'eleve',
        recommendedAction:
            "Lire `ai_call_log` sur les 24 dernières heures (Supabase → Table Editor, filtrer " +
            "`status <> 'success'`) pour identifier le fournisseur et le message d'erreur dominants ; puis, " +
            "selon le cas, renouveler la clé dans Super Admin → Connecteurs IA, relever le plafond " +
            "`ai_budget`, ou désactiver temporairement le fournisseur en panne pour que le routage bascule. " +
            "Relancer la mesure.",
    },
    {
        id: 'ia.journal_appels',
        domain: 'ia',
        bloc: 'base',
        title: "Volume du journal des appels IA",
        why: "Le journal d'appels est la seule trace des décisions de routage ; laissé sans purge, il finit par peser sur chaque requête.",
        weight: 10,
        location: 'serveur',
        expected: "Moins de 100 000 lignes dans `ai_call_log`.",
        cause:
            "Aucune purge planifiée n'existe pour `ai_call_log` : chaque appel IA y ajoute une ligne, et le " +
            "volume croît indéfiniment avec l'usage.",
        impact:
            "Les statistiques de santé des fournisseurs et l'écran Super Admin ralentissent à chaque " +
            "ouverture, et la base porte des mois de journal sans valeur de diagnostic au-delà de 90 jours.",
        risk: 'moyen',
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
        bloc: 'connecteurs',
        title: "Transport temps réel configuré",
        why: "Sans configuration de transport active, aucun appel ni direct ne peut s'établir.",
        weight: 30,
        location: 'serveur',
        expected: "Une configuration `live_transport_config` active existe pour l'environnement servi.",
        cause:
            "Aucune ligne n'a été insérée dans `live_transport_config` pour l'environnement servi, ou la " +
            "ligne existante a été supprimée lors d'un changement de serveur (le secret vit dans le Vault, " +
            "la ligne doit le référencer).",
        impact:
            "`livekit-token` ne peut délivrer aucun jeton : plus aucun appel ni aucun direct ne peut " +
            "s'établir, pour personne.",
        risk: 'eleve',
        recommendedAction:
            "Insérer la configuration du serveur de direct dans `live_transport_config` avec la requête SQL " +
            "de deploy/livekit/README.md (étape 4 : secret créé dans le Vault, `server_url`, `api_key`, " +
            "`environment`, `is_active = true`), puis vérifier que le secret `LIVE_TRANSPORT_ENVIRONMENT` de " +
            "la fonction `livekit-token` désigne le même environnement. Relancer la mesure.",
    },
    {
        id: 'messagerie.appels_bloques',
        domain: 'messagerie',
        bloc: 'live',
        title: "Aucun appel resté en cours anormalement",
        why: "Un appel resté « en cours » côté base fait sonner l'interface dans le vide et fausse les diagnostics.",
        weight: 26,
        location: 'serveur',
        expected: "Aucun diagnostic d'appel au statut « en cours » depuis plus de 6 heures.",
        cause:
            "Le rapport de fin d'appel n'a jamais été écrit : application fermée brutalement, réseau coupé " +
            "avant l'envoi du diagnostic final, ou onglet suspendu par le navigateur pendant l'appel.",
        impact:
            "L'interface continue de présenter l'appel comme en cours, les statistiques comptent des durées " +
            "de plusieurs heures, et le « Taux d'échec des appels » perd sa fiabilité.",
        risk: 'moyen',
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
        bloc: 'live',
        title: "Taux d'échec des appels",
        why: "C'est le signal le plus direct d'une panne de transport, de jeton ou de réseau chez les utilisateurs.",
        weight: 24,
        location: 'serveur',
        expected: "Moins de 20 % d'appels en échec sur les 24 dernières heures.",
        cause:
            "Le serveur de direct refuse les jetons ou ne répond plus, le serveur TURN n'est pas joignable " +
            "depuis les réseaux mobiles, ou le serveur LiveKit et le SDK client ne parlent plus la même " +
            "version de protocole.",
        impact:
            "Les appels ne s'établissent pas ou se coupent pour une large part des utilisateurs, qui ne " +
            "voient qu'un message d'échec ; MokNet perd sa fonction d'appel sans alerte côté administration.",
        risk: 'eleve',
        recommendedAction:
            "Lire les rapports `call_diagnostics` des 24 dernières heures (Supabase → Table Editor) pour " +
            "identifier le motif dominant (« correspondant perdu », « échec », erreur de négociation) ; " +
            "croiser avec les lignes du bloc VPS (HTTPS, porte `/rtc`, version LiveKit) et vérifier que la " +
            "version de `livekit-client` épinglée dans package.json reste compatible avec le serveur " +
            "(deploy/livekit/README.md). Relancer la mesure.",
    },
    {
        id: 'messagerie.blocages_operationnels',
        domain: 'messagerie',
        bloc: 'securite',
        title: "Mécanisme de blocage opérationnel",
        why: "Si la vérification de blocage tombe, une personne bloquée peut de nouveau notifier sa cible.",
        weight: 20,
        location: 'serveur',
        expected: "La fonction `are_users_blocked` existe et répond.",
        cause:
            "La fonction `are_users_blocked` a été supprimée ou renommée lors d'une intervention sur la " +
            "base ; elle appartient au schéma de production non versionné, aucune migration du dépôt ne la " +
            "recrée.",
        impact:
            "Selon l'appelant, soit l'envoi est refusé pour tout le monde (`push-notify` répond 503 tant " +
            "qu'il ne peut pas vérifier), soit la vérification est sautée et une personne bloquée peut de " +
            "nouveau joindre ou notifier sa cible.",
        risk: 'eleve',
        recommendedAction:
            "Recréer `public.are_users_blocked(p_user_a uuid, p_user_b uuid)` à partir de sa définition de " +
            "production (sauvegarde Supabase ou `supabase db pull` récent), en `SECURITY DEFINER` avec " +
            "`search_path` figé, puis vérifier qu'elle répond : " +
            "`select public.are_users_blocked('<id A>', '<id B>');`. Relancer la mesure.",
    },

    // ────────────────────── DÉPLOIEMENT & NAVIGATEUR ──────────────────────

    {
        id: 'deploiement.scripts_tiers',
        domain: 'deploiement',
        bloc: 'application',
        title: "Aucun script tiers exécuté",
        why: "Un script servi par un domaine tiers s'exécute avec tous les droits de la page : il peut lire le jeton de session et agir au nom de l'utilisateur.",
        weight: 34,
        location: 'client',
        expected:
            "Aucune balise `<script>` ne pointe vers une origine externe (les polices, qui ne sont " +
            "pas exécutables, ne comptent pas).",
        cause:
            "`index.html` hérite du gabarit AI Studio : il charge `cdn.tailwindcss.com` et un `importmap` " +
            "vers `aistudiocdn.com`, conservés tels quels dans le build de production (constat R-02 de " +
            "l'audit du 04/09/2026).",
        impact:
            "Quiconque contrôle l'un de ces domaines — ou intercepte leur trafic — exécute du code dans la " +
            "session de chaque visiteur : lecture du jeton Supabase et des messages privés, actions au nom " +
            "du compte.",
        risk: 'critique',
        humanAction:
            "Retirer `cdn.tailwindcss.com` et l'`importmap` `aistudiocdn.com` d'`index.html`, et " +
            "passer Tailwind en dépendance de build. Le paquet npm est déjà complet. " +
            "Attention : `tests/tailwindClassValidity.test.ts` vérifie aujourd'hui la PRÉSENCE du " +
            "CDN — ce garde-fou doit être retravaillé en même temps.",
        manual: {
            where: "Dépôt GitHub → index.html (puis tests/tailwindClassValidity.test.ts)",
            url: "{repo}/blob/main/index.html",
            steps: [
                "Dans index.html, supprimer la balise script qui charge https://cdn.tailwindcss.com et le bloc script type=importmap qui pointe vers aistudiocdn.com.",
                "Passer Tailwind en dépendance de build : le paquet npm est déjà installé, il reste à ajouter la configuration Tailwind/PostCSS au projet Vite et à importer les directives @tailwind dans la feuille de style de l'application.",
                "Retravailler tests/tailwindClassValidity.test.ts, qui vérifie aujourd'hui la présence du CDN, pour qu'il vérifie au contraire son absence.",
                "Après fusion et déploiement, vérifier que dist/index.html ne cite plus aucune origine tierce hors polices, puis relancer la mesure depuis le navigateur.",
            ],
        },
    },
    {
        id: 'deploiement.csp',
        domain: 'deploiement',
        bloc: 'application',
        title: "Politique de sécurité du contenu",
        why: "La CSP est la dernière barrière : même en cas d'injection, elle empêche le code injecté de joindre un serveur extérieur.",
        weight: 26,
        location: 'client',
        expected: "Un en-tête `Content-Security-Policy` est servi sur la page.",
        cause:
            "Aucune `Content-Security-Policy` n'a jamais été écrite dans `netlify.toml` : tant que la page " +
            "charge des scripts tiers, toute politique devrait les autoriser explicitement, ce qui a repoussé " +
            "sa mise en place (constat O-02 de l'audit).",
        impact:
            "En cas d'injection de code (dépendance compromise, extension malveillante, faille future), rien " +
            "n'empêche le code injecté d'envoyer les jetons et les messages vers un serveur extérieur.",
        risk: 'eleve',
        humanAction:
            "Ajouter la politique dans `netlify.toml`, d'abord en `Content-Security-Policy-Report-Only` " +
            "pendant une semaine. À faire APRÈS le retrait des scripts tiers, sinon la politique doit " +
            "autoriser les domaines que l'on cherche justement à supprimer.",
        manual: {
            where: "Dépôt GitHub → netlify.toml, bloc [headers.values]",
            url: "{repo}/blob/main/netlify.toml",
            steps: [
                "Attendre que la ligne « Aucun script tiers exécuté » soit verte : une politique écrite avant devrait autoriser les domaines que l'on retire.",
                "Ajouter dans netlify.toml, sous [headers.values], une ligne Content-Security-Policy-Report-Only listant les seules origines légitimes : default-src 'self' ; connect-src vers le projet Supabase (https et wss) et https://live.moknet.net ; img-src et media-src 'self' data: blob: plus le stockage Supabase ; font-src et style-src pour les polices ; frame-ancestors 'self'.",
                "Déployer, observer une semaine les violations rapportées dans la console du navigateur (aucun blocage en Report-Only), puis renommer l'en-tête en Content-Security-Policy.",
                "Relancer la mesure depuis le navigateur : la ligne est orange en mode observation, verte une fois la politique appliquée.",
            ],
        },
    },
    {
        id: 'deploiement.entetes_securite',
        domain: 'deploiement',
        bloc: 'application',
        title: "En-têtes de sécurité présents",
        why: "Ils bloquent le détournement de clic, la devinette de type MIME et la fuite d'URL vers l'extérieur.",
        weight: 22,
        location: 'client',
        expected:
            "`X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy` et `Permissions-Policy` " +
            "sont tous les quatre servis.",
        cause:
            "Le bloc `[[headers]]` de `netlify.toml` a été modifié ou retiré, ou le site Netlify servi n'est " +
            "pas déployé depuis la branche qui contient ce fichier (un en-tête absent de la réponse l'est " +
            "pour tous les visiteurs).",
        impact:
            "Sans `X-Frame-Options`, MokNet peut être intégré dans une page piège (détournement de clic) ; " +
            "sans `X-Content-Type-Options`, un fichier téléversé peut être interprété comme un script ; sans " +
            "`Referrer-Policy`, l'URL complète fuit vers les sites externes ; sans `Permissions-Policy`, une " +
            "iframe tierce peut demander caméra et micro.",
        risk: 'moyen',
        recommendedAction:
            "Vérifier que `netlify.toml` à la racine du dépôt contient toujours le bloc `[[headers]]` avec " +
            "les quatre en-têtes, que le site Netlify déploie bien la branche `main`, puis contrôler la " +
            "réponse réelle avec `curl -I https://moknet.net/`. Relancer la mesure depuis le navigateur.",
    },
    {
        id: 'deploiement.https_strict',
        domain: 'deploiement',
        bloc: 'application',
        title: "Transport chiffré imposé",
        why: "Sans HSTS, une première visite en clair peut être détournée avant la redirection.",
        weight: 18,
        location: 'client',
        expected: "La page est servie en HTTPS et l'en-tête `Strict-Transport-Security` est présent.",
        cause:
            "Le certificat du site Netlify n'est pas provisionné ou « Force HTTPS » est désactivé, ou la " +
            "page a été ouverte depuis une adresse sans TLS (aperçu, domaine non rattaché) : Netlify n'envoie " +
            "l'en-tête HSTS que sur un site servi en HTTPS.",
        impact:
            "Un visiteur qui tape l'adresse sans https peut être intercepté sur un réseau hostile avant la " +
            "redirection : jeton de session, messages et mots de passe passent en clair pendant cette " +
            "première requête.",
        risk: 'eleve',
        recommendedAction:
            "Dans Netlify → Site → Domain management → HTTPS, vérifier que le certificat est actif et que " +
            "« Force HTTPS » est coché (Netlify ajoute alors `Strict-Transport-Security` lui-même), et " +
            "n'ouvrir MokNet que par ses adresses en https. Contrôler ensuite avec " +
            "`curl -I https://moknet.net/`. Relancer la mesure depuis le navigateur.",
    },

    // ───────────────────────────── LIVE ─────────────────────────────

    {
        id: 'live.transport_utilisable',
        domain: 'live',
        bloc: 'vps',
        title: "Un direct peut réellement démarrer",
        why:
            "Le serveur de direct peut répondre « je suis vivant » tout en refusant nos identifiants : " +
            "plus aucun direct ne démarrerait, et une surveillance fondée sur le ping afficherait vert " +
            "pendant la panne. Cette ligne interroge l'appel dont dépend réellement l'ouverture d'un direct.",
        // La plus lourde du domaine : sans elle, aucune des trois autres n'a
        // d'objet — il n'y a plus de direct du tout à tenir propre.
        weight: 28,
        location: 'serveur',
        expected:
            "`POST /twirp/livekit.RoomService/ListRooms`, signé avec la clé du coffre, répond 200 avec " +
            "une liste de directs exploitable, dans le délai que la porte d'admission peut attendre " +
            "(le verdict rappelle le seuil exact en millisecondes).",
        cause:
            "La clé API du VPS (`.env.production`) et celle référencée par `live_transport_config` ont " +
            "divergé après une rotation, le conteneur LiveKit ou nginx ne répond plus, ou la machine est " +
            "saturée et dépasse le délai de 1 500 ms que la porte d'admission peut attendre.",
        impact:
            "Aucun direct ne peut plus s'ouvrir (la porte d'admission n'obtient pas la liste des salles) et, " +
            "selon la panne, les appels tombent aussi — alors qu'un simple ping du serveur afficherait " +
            "encore vert.",
        risk: 'critique',
        humanAction:
            "Rouge « refuse nos identifiants » : la clé API du VPS et celle du coffre ont divergé — " +
            "les réaligner (voir deploy/livekit/README.md). Rouge « injoignable » : vérifier le conteneur " +
            "LiveKit et le reverse-proxy sur le VPS. Orange : le serveur répond trop lentement pour que " +
            "la porte d'admission tienne — regarder la charge de la machine.",
        manual: {
            where: "VPS Hostinger (SSH) → /opt/moknet-livekit, puis Supabase → Table Editor → live_transport_config",
            url: "{repo}/blob/main/deploy/livekit/README.md",
            steps: [
                "Rouge « refuse nos identifiants » (401) : en SSH, lire LIVEKIT_API_KEY dans /opt/moknet-livekit/.env.production et la comparer à la colonne api_key de live_transport_config ; réaligner la clé et le secret (Vault) du côté qui a changé — sans redémarrer le serveur si seule la base est fausse.",
                "Rouge « injoignable » : docker compose -f /opt/moknet-livekit/docker-compose.yml ps puis systemctl status nginx — redémarrer le service tombé (docker compose up -d livekit coupe les directs en cours : choisir une fenêtre calme).",
                "Orange « trop lent » : regarder la charge de la machine (uptime, docker stats) et le nombre de directs ouverts ; prévoir une machine plus grande avant la prochaine montée en charge.",
                "Relancer la mesure : la ligne repasse au vert quand ListRooms répond 200 en moins de 1 500 ms avec la clé du coffre.",
            ],
        },
    },
    {
        id: 'vps.reverse_proxy',
        domain: 'live',
        bloc: 'vps',
        title: "Le VPS répond en HTTPS",
        why: "Devant LiveKit, c'est nginx (CloudPanel) qui porte le certificat et le port 443 : s'il tombe ou si le certificat expire, aucun téléphone ne peut plus joindre le direct, même si LiveKit tourne derrière.",
        weight: 8,
        location: 'serveur',
        expected: "`GET https://<serveur du direct>/` obtient une réponse HTTP (quel que soit son code) en moins de 3 secondes.",
        cause: "nginx arrêté, certificat TLS expiré ou non renouvelé, port 443 fermé par le pare-feu, ou machine éteinte.",
        impact: "Plus aucun direct ni aucun appel ne peut s'établir ; l'application affiche des erreurs de connexion sans explication.",
        risk: 'critique',
        humanAction:
            "Se connecter en SSH au VPS Hostinger et vérifier nginx/CloudPanel, le certificat et le pare-feu " +
            "(deploy/livekit/README.md).",
        manual: {
            where: "VPS Hostinger (SSH) → panneau CloudPanel",
            url: "{repo}/blob/main/deploy/livekit/README.md",
            steps: [
                "Depuis n'importe quel poste : curl -I https://<serveur du direct>/ — une réponse HTTP, même 404, prouve que nginx et le certificat vont bien.",
                "Sinon, en SSH : systemctl status nginx, puis vérifier le certificat dans CloudPanel (renouvellement Let's Encrypt).",
                "Vérifier que le port 443/tcp est ouvert dans le pare-feu du VPS.",
                "Relancer la mesure une fois le service revenu.",
            ],
        },
    },
    {
        id: 'vps.signalisation',
        domain: 'live',
        bloc: 'vps',
        title: "La porte des appareils (/rtc) accepte nos jetons",
        why: "Les téléphones n'utilisent pas l'API d'administration : ils frappent à `/rtc`. Cette porte peut tomber seule — mauvais bloc nginx, WebSocket non relayé — pendant que l'API répond encore.",
        weight: 10,
        location: 'serveur',
        expected: "`GET /rtc/validate` avec un jeton signé par la clé du coffre répond 200.",
        cause: "Le reverse-proxy ne relaie plus `/rtc`, LiveKit refuse la clé (clés du VPS et du coffre divergentes) ou le conteneur LiveKit est arrêté.",
        impact: "Directs et appels échouent à la connexion pour tous les appareils, alors que le reste du tableau peut sembler sain.",
        risk: 'critique',
        humanAction:
            "Réaligner les clés LiveKit du VPS et du coffre, ou rétablir le relais `/rtc` dans nginx " +
            "(deploy/livekit/README.md, étape 3).",
        manual: {
            where: "VPS Hostinger (SSH) → /opt/moknet-livekit",
            url: "{repo}/blob/main/deploy/livekit/README.md",
            steps: [
                "En SSH : docker compose -f /opt/moknet-livekit/docker-compose.yml ps — le conteneur LiveKit doit être « running ».",
                "Réponse 401 « invalid authorization token » : la clé API du VPS (.env.production) et celle de live_transport_config ont divergé — les réaligner.",
                "Réponse 404 ou 502 : le bloc nginx de /rtc (WebSocket, en-têtes Upgrade) manque — le rétablir d'après le README, étape 3.",
                "Relancer la mesure.",
            ],
        },
    },
    {
        id: 'vps.version_livekit',
        domain: 'live',
        bloc: 'vps',
        title: "Version du serveur LiveKit suivie",
        why: "Le serveur du VPS (1.8.4 au 04/09/2026) est en retard sur le SDK client (2.22.1) : les écarts de protocole se paient en appels qui échouent sans explication.",
        weight: 6,
        location: 'humain',
        expected: "Le serveur LiveKit du VPS est à une version compatible avec le SDK `livekit-client` du dépôt, revérifiée à chaque montée de version.",
        cause: "La version du serveur n'est lisible que sur la machine (image Docker) : aucune sonde réseau ne peut la constater.",
        impact: "Incompatibilités silencieuses entre l'application et le serveur de direct à chaque mise à jour du SDK.",
        risk: 'moyen',
        humanAction:
            "Relever la version en SSH (tag de l'image LiveKit) et la monter selon deploy/livekit/README.md ; " +
            "noter la version relevée dans docs/APPELS_AUDIO_VALIDATION_APPAREILS.md.",
        manual: {
            where: "VPS Hostinger (SSH) → /opt/moknet-livekit/docker-compose.yml",
            url: "{repo}/blob/main/deploy/livekit/README.md",
            steps: [
                "En SSH : docker compose -f /opt/moknet-livekit/docker-compose.yml images — lire le tag de l'image livekit/livekit-server.",
                "Comparer avec la version de livekit-client dans package.json ; en cas d'écart majeur, monter l'image (docker compose pull, puis docker compose up -d) hors heures de direct.",
                "Vérifier ensuite un appel réel sur deux appareils, puis noter la version relevée dans docs/APPELS_AUDIO_VALIDATION_APPAREILS.md.",
            ],
        },
    },
    {
        id: 'live.sessions_zombies',
        domain: 'live',
        bloc: 'live',
        title: "Aucun direct resté ouvert",
        why: "Un direct jamais clôturé continue d'apparaître « en cours » à tout le monde et garde une salle de transport réservée.",
        weight: 22,
        location: 'serveur',
        expected: "Aucune session LIVE au statut « en cours » depuis plus de 24 heures.",
        cause:
            "L'animateur a fermé l'application ou perdu le réseau sans que la fin du direct soit " +
            "enregistrée : `ended_at` reste vide alors que la salle LiveKit s'est vidée d'elle-même.",
        impact:
            "Le direct apparaît « en cours » dans le fil et les listes pour tout le monde, les spectateurs " +
            "qui cliquent tombent sur une salle vide, et les comptages de directs actifs sont faux.",
        risk: 'moyen',
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
        bloc: 'live',
        title: "Rétention des transcriptions respectée",
        why: "La règle annoncée aux utilisateurs est une purge 30 jours après la fin du direct : la tenir est un engagement, pas une option.",
        weight: 16,
        location: 'serveur',
        expected: "Aucune ligne de transcription au-delà de 30 jours après la fin de son direct.",
        cause:
            "La purge automatique à 30 jours n'est pas planifiée, ou sa tâche a été désactivée : les lignes " +
            "de `live_transcript_lines` restent en base après la fin du direct.",
        impact:
            "MokNet conserve des propos transcrits au-delà de la durée promise aux utilisateurs : un " +
            "engagement de confidentialité non tenu, et une exposition inutile de données personnelles en cas " +
            "d'incident.",
        risk: 'moyen',
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
        bloc: 'live',
        title: "Intervenants rattachés à un direct existant",
        why: "Des intervenants orphelins faussent la composition de scène et les comptages de participation.",
        weight: 10,
        location: 'serveur',
        expected:
            "Aucun intervenant orphelin, ET la contrainte `live_speakers_session_id_fkey` " +
            "(ON DELETE CASCADE) toujours en place.",
        cause:
            "La contrainte `live_speakers_session_id_fkey` a été supprimée ou recréée sans `ON DELETE " +
            "CASCADE` lors d'une intervention manuelle sur la table `live_speakers`.",
        impact:
            "Les intervenants d'un direct supprimé restent comptés : la composition de scène et les " +
            "statistiques de participation deviennent fausses, et l'historique affiche des intervenants " +
            "sans direct.",
        risk: 'moyen',
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue avant toute " +
            "purge.",
        manual: {
            where: "Supabase → SQL Editor (projet MokNet)",
            url: "{supabase}/sql/new",
            steps: [
                "Vérifier la contrainte : select pg_get_constraintdef(oid) from pg_constraint where conname = 'live_speakers_session_id_fkey'; — elle doit contenir ON DELETE CASCADE.",
                "Si elle manque, la rétablir : alter table public.live_speakers add constraint live_speakers_session_id_fkey foreign key (session_id) references public.live_sessions(id) on delete cascade;",
                "Si la commande est refusée à cause d'orphelins déjà présents, les exporter puis les supprimer : delete from public.live_speakers s where not exists (select 1 from public.live_sessions ls where ls.id = s.session_id); et rejouer l'étape précédente.",
                "Relancer la mesure.",
            ],
        },
    },

    // ────────────────────────── NOTIFICATIONS ──────────────────────────

    {
        id: 'notifications.vapid_configuree',
        domain: 'notifications',
        bloc: 'connecteurs',
        title: "Clé de signature des notifications présente",
        why: "Sans clé VAPID, aucune notification ne part : l'appel ne réveille jamais le téléphone du correspondant.",
        weight: 34,
        location: 'serveur',
        expected: "Une configuration VAPID (clé publique + référence privée en Vault) existe.",
        cause:
            "La fonction `push-notify` n'a jamais été appelée depuis le déploiement (c'est elle qui génère " +
            "la paire VAPID au premier appel et la range dans le Vault), ou la ligne de `push_vapid_config` " +
            "a été supprimée.",
        impact:
            "Aucune notification ne peut être signée : aucun appel entrant ne réveille le téléphone du " +
            "correspondant, aucun message n'est notifié hors de l'application, pour tous les utilisateurs.",
        risk: 'critique',
        recommendedAction:
            "Vérifier que la fonction `push-notify` est déployée (Supabase → Edge Functions), puis provoquer " +
            "un premier envoi réel (activer les notifications depuis un compte et s'envoyer un message) : la " +
            "fonction crée la clé via `store_push_vapid_internal`. Si la ligne reste absente, lire les " +
            "journaux de la fonction pour l'erreur exacte. Relancer la mesure.",
    },
    {
        id: 'notifications.taux_echec',
        domain: 'notifications',
        bloc: 'externes',
        title: "Taux d'échec des envois",
        why: "Un taux qui grimpe signale une clé changée ou un service de push qui rejette : les appels cessent d'aboutir sans erreur visible.",
        weight: 28,
        location: 'serveur',
        expected: "Moins de 25 % d'échecs d'envoi sur les 24 dernières heures.",
        cause:
            "La clé VAPID a changé après l'abonnement des appareils (les services de push rejettent alors " +
            "chaque envoi), un service de push refuse temporairement, ou de nombreux abonnements morts n'ont " +
            "pas été retirés.",
        impact:
            "Les appels entrants ne font plus sonner les téléphones et les messages ne sont plus notifiés " +
            "hors de l'application, sans qu'aucune erreur ne soit visible par l'expéditeur.",
        risk: 'eleve',
        recommendedAction:
            "Lire `push_delivery_log` sur les 24 dernières heures (Supabase → Table Editor, filtrer " +
            "`ok = false`) et regrouper par statut HTTP : 401/403 signale une clé VAPID changée (chaque " +
            "appareil doit se réabonner), 410/404 des abonnements morts (utiliser la réparation « Abonnements " +
            "vivants »), 429/5xx un service de push en difficulté (attendre et surveiller). Relancer la mesure.",
    },
    {
        id: 'notifications.abonnements_morts',
        domain: 'notifications',
        bloc: 'connecteurs',
        title: "Abonnements vivants",
        why: "Un abonnement mort est réessayé à chaque appel, ralentit l'envoi et pollue les statistiques d'échec.",
        weight: 22,
        location: 'serveur',
        expected: "Aucun abonnement dont le dernier envoi a été refusé définitivement (410 ou 404).",
        cause:
            "Des appareils ont désinstallé MokNet, révoqué la permission de notification ou changé de " +
            "navigateur : leur abonnement reste en base alors que le service de push l'a définitivement " +
            "refusé (410 ou 404).",
        impact:
            "Chaque appel ou message déclenche des envois vers des adresses mortes : l'envoi utile est " +
            "ralenti, le journal se remplit d'échecs et le taux d'échec de la ligne voisine monte sans panne " +
            "réelle.",
        risk: 'moyen',
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
        bloc: 'base',
        title: "Volume du journal d'envoi",
        why: "Le journal sert au diagnostic récent ; conservé indéfiniment, il devient du poids mort.",
        weight: 16,
        location: 'serveur',
        expected: "Moins de 50 000 lignes dans `push_delivery_log`.",
        cause:
            "Aucune purge planifiée n'existe pour `push_delivery_log` : chaque remise y ajoute une ligne, et " +
            "le volume croît avec chaque appel et chaque message notifié.",
        impact:
            "Les statistiques d'échec des 24 dernières heures se calculent de plus en plus lentement, et la " +
            "base porte des mois de journal sans utilité de diagnostic.",
        risk: 'moyen',
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
        bloc: 'base',
        title: "Schéma de production versionné",
        why: "Un schéma absent du dépôt n'est ni revu, ni reproductible en essai, ni restaurable — et rend toute revue de sécurité fondée sur le code source trompeuse.",
        weight: 34,
        location: 'serveur',
        expected:
            "Le nombre de tables en production est couvert par les migrations versionnées du dépôt.",
        cause:
            "Les 89 tables et la soixantaine de fonctions de production ont été créées directement depuis " +
            "la console Supabase ; le dépôt ne contient que quelques migrations récentes (constat R-04 de " +
            "l'audit du 04/09/2026).",
        impact:
            "Aucune revue par un tiers du modèle de sécurité (c'est ainsi que la forge de crédits est passée " +
            "inaperçue), aucun environnement d'essai reproductible, aucun retour arrière propre après une " +
            "modification malheureuse.",
        risk: 'eleve',
        humanAction:
            "`supabase db pull` pour capturer le schéma réel dans des migrations, puis rendre la " +
            "revue de migration obligatoire. Aucune réparation automatique : capturer un schéma " +
            "n'est pas une opération de base, c'est un acte de gouvernance qui doit passer en revue.",
        manual: {
            where: "Poste de développement (CLI Supabase) → dépôt GitHub → supabase/migrations",
            url: "{repo}/tree/main/supabase/migrations",
            steps: [
                "Depuis un poste où la CLI Supabase est connectée au projet : supabase db pull --project-ref rqciahtpixdjbyoajomg — la CLI écrit le schéma réel dans un nouveau fichier de supabase/migrations.",
                "Ouvrir une pull request avec ce fichier et le lire en revue (chaque fonction SECURITY DEFINER, chaque politique) avant de fusionner.",
                "Mettre à jour la constante VERSIONED_TABLE_COUNT dans supabase/functions/health-guardian/evaluate.ts (le test tests/healthGuardian.test.ts recompte les create table et échoue tant qu'elle ne correspond pas), puis redéployer health-guardian.",
                "Rendre la revue de migration obligatoire : toute modification de schéma passe désormais par une migration versionnée, jamais par la console. Relancer la mesure.",
            ],
        },
    },
    {
        id: 'gouvernance.tables_sans_politique',
        domain: 'gouvernance',
        bloc: 'securite',
        title: "Tables verrouillées volontairement, et elles seules",
        why: "Une table avec RLS mais sans aucune politique refuse TOUT le monde. C'est le bon choix pour un coffre ; c'est une fonctionnalité muette pour n'importe quelle autre table — et rien ne le signale à l'exécution.",
        weight: 26,
        location: 'serveur',
        expected:
            "Les seules tables sans politique sont les coffres assumés : `ai_provider_credentials`, " +
            "`push_vapid_config`, `live_transport_config`, `audit_logs`, `admin_api_rate_limits`, " +
            "`push_delivery_log`, `health_snapshots`.",
        cause:
            "Une table a reçu la RLS sans qu'aucune politique soit écrite ensuite (oubli après création, ou " +
            "politique supprimée), alors qu'elle n'est pas un coffre réservé au rôle service.",
        impact:
            "La fonctionnalité qui lit ou écrit cette table échoue en silence pour tous les utilisateurs : " +
            "listes vides, enregistrements qui ne s'enregistrent pas, sans message d'erreur ni trace côté " +
            "administration.",
        risk: 'moyen',
        recommendedAction:
            "Pour chaque table citée dans le verdict, décider : soit écrire ses politiques dans l'éditeur " +
            "SQL (`create policy … on public.<table> for select using (auth.uid() = user_id);` selon " +
            "l'usage), soit, si c'est bien un coffre réservé au serveur, l'ajouter à la liste des coffres " +
            "assumés (attendu de cette ligne et constante `COFFRES` de " +
            "`supabase/functions/health-guardian/evaluate.ts`) et redéployer la fonction. Relancer la mesure.",
    },
    {
        id: 'gouvernance.journal_actions',
        domain: 'gouvernance',
        bloc: 'securite',
        title: "Journal des actions alimenté",
        why: "Sans journal, une réparation appliquée un dimanche soir n'est traçable par personne.",
        weight: 20,
        location: 'serveur',
        expected: "La table `audit_logs` existe et reçoit les actions de santé.",
        cause:
            "La table `audit_logs` a été supprimée ou renommée lors d'une intervention sur la base ; elle " +
            "appartient au schéma de production non versionné, aucune migration du dépôt ne la recrée.",
        impact:
            "Les réparations et restaurations du tableau de bord ne peuvent plus être tracées ni restaurées " +
            "(le journal porte les identifiants de sauvegarde) : toute action de santé devient invisible et " +
            "irréversible.",
        risk: 'eleve',
        recommendedAction:
            "Rétablir `public.audit_logs` depuis la dernière sauvegarde Supabase (Database → Backups) ou la " +
            "recréer avec les colonnes lues par `health_journal` (`id`, `action`, `entity_type`, " +
            "`entity_id`, `actor_id`, `metadata`, `created_at`), RLS activée sans politique (coffre réservé " +
            "au serveur), puis vérifier que les actions de santé s'y inscrivent à nouveau. Relancer la mesure.",
    },
    {
        id: 'gouvernance.rang_admin_general',
        domain: 'gouvernance',
        bloc: 'securite',
        title: "Un Admin Général reconnu par la base",
        why: "Réparer et restaurer sont réservés au rang `super_admin`, contrôlé en base. Si aucun compte ne le porte, aucune réparation n'est possible pour personne : le tableau de bord ne peut que diagnostiquer.",
        weight: 20,
        location: 'serveur',
        expected: "Au moins un profil porte le rôle `super_admin` en base — et pas plus de trois.",
        cause:
            "Le rang Admin Général n'a jamais été posé en base : l'application le déduit d'une adresse " +
            "e-mail écrite en dur dans le code (constat J-01b de l'audit), que la base ignore.",
        impact:
            "Toutes les réparations automatiques de ce tableau restent en « Diagnostic seulement », y " +
            "compris pour la Direction ; les restaurations aussi.",
        risk: 'eleve',
        humanAction:
            "Poser le rôle `super_admin` sur le profil de l'Admin Général, en base : une décision de la " +
            "Direction, une seule requête, réversible.",
        manual: {
            where: "Supabase → SQL Editor (projet MokNet)",
            url: "{supabase}/sql/new",
            steps: [
                "Ouvrir l'éditeur SQL du projet et coller : update public.profiles set role = 'super_admin' where email = '<adresse de l'Admin Général>';",
                "Exécuter (Run). Le déclencheur anti-élévation laisse passer cette écriture : elle vient de la console, pas d'une session utilisateur.",
                "Se déconnecter puis se reconnecter à MokNet et relancer la mesure : le mode passe à « Réparation activée » et les boutons Réparer deviennent actifs.",
                "Retour arrière si besoin : la même requête avec role = 'admin'.",
            ],
        },
    },

    // ─────────────────────────── STOCKAGE ───────────────────────────

    {
        id: 'stockage.bucket_public',
        domain: 'stockage',
        bloc: 'base',
        title: "Espace de stockage disponible",
        why: "Sans le bucket `public`, tout téléversement de média échoue silencieusement à la publication.",
        weight: 40,
        location: 'serveur',
        expected: "Le bucket `public` existe.",
        cause:
            "Le bucket `public` a été supprimé ou renommé dans Supabase → Storage, ou le projet a été " +
            "restauré sans ses buckets.",
        impact:
            "Chaque photo, vidéo, document ou story envoyé échoue à la publication, pour tous les " +
            "utilisateurs, avec une erreur silencieuse ; les médias déjà publiés deviennent inaccessibles.",
        risk: 'critique',
        recommendedAction:
            "Dans Supabase → Storage → New bucket, créer un bucket nommé exactement `public`, coché « Public " +
            "bucket » (lecture anonyme des médias), puis reposer ses politiques d'écriture réservées aux " +
            "comptes connectés et ses limites de type et de taille. Relancer la mesure.",
    },
    {
        id: 'stockage.documents_orphelins',
        domain: 'stockage',
        bloc: 'base',
        title: "Documents rattachés à une publication existante",
        why: "Un document orphelin occupe l'espace sans qu'aucune interface ne puisse plus l'afficher ni le supprimer.",
        weight: 34,
        location: 'serveur',
        expected:
            "Aucune référence de document orpheline, ET la contrainte " +
            "`post_documents_post_id_fkey` (ON DELETE CASCADE) toujours en place.",
        cause:
            "La contrainte `post_documents_post_id_fkey` a été supprimée ou recréée sans `ON DELETE " +
            "CASCADE` lors d'une intervention manuelle sur la table `post_documents`.",
        impact:
            "Les documents d'une publication supprimée gardent une référence qu'aucune interface ne peut " +
            "plus afficher ni supprimer ; les comptages de pièces jointes sont faux et le nettoyage du " +
            "stockage devient impossible à piloter.",
        risk: 'moyen',
        humanAction:
            "Si cette ligne vire au rouge, rétablir la contrainte de clé étrangère perdue. " +
            "Note distincte : la cascade retire la RÉFÉRENCE en base, jamais le fichier dans le " +
            "bucket — le nettoyage du stockage lui-même reste à écrire.",
        manual: {
            where: "Supabase → SQL Editor (projet MokNet), puis Storage → bucket public",
            url: "{supabase}/sql/new",
            steps: [
                "Vérifier la contrainte : select pg_get_constraintdef(oid) from pg_constraint where conname = 'post_documents_post_id_fkey'; — elle doit contenir ON DELETE CASCADE.",
                "Si elle manque, la rétablir : alter table public.post_documents add constraint post_documents_post_id_fkey foreign key (post_id) references public.posts(id) on delete cascade;",
                "Si la commande est refusée à cause de références orphelines, relever leurs chemins de fichiers (select * from public.post_documents d where not exists (select 1 from public.posts p where p.id = d.post_id);), supprimer ces lignes, puis retirer les fichiers correspondants à la main dans Storage → bucket public — la cascade ne touche jamais au fichier.",
                "Relancer la mesure.",
            ],
        },
    },
    {
        id: 'stockage.validation_televersement',
        domain: 'stockage',
        bloc: 'securite',
        title: "Validation des fichiers téléversés",
        why: "Sans limite de type ni de taille, un seul envoi peut saturer le stockage ou déposer un contenu inattendu.",
        weight: 26,
        location: 'humain',
        expected: "Type MIME et taille validés côté application ET limités sur le bucket.",
        cause:
            "`uploadContentMedia` envoie le fichier tel quel vers le bucket `public`, sans contrôle de type " +
            "ni de taille, et le bucket n'a reçu aucune limite à sa création (constat J-01c de l'audit).",
        impact:
            "Un seul compte peut saturer le stockage avec des fichiers énormes, ou déposer un contenu d'un " +
            "type inattendu (exécutable, page HTML) qui sera servi depuis le domaine de stockage de MokNet.",
        risk: 'moyen',
        humanAction:
            "Ajouter la validation dans `uploadContentMedia` (services/supabaseClient.ts) et poser " +
            "les mêmes limites sur le bucket dans la console Supabase → Storage.",
        manual: {
            where: "Dépôt GitHub → services/supabaseClient.ts (uploadContentMedia), puis Supabase → Storage → bucket public",
            url: "{repo}/blob/main/services/supabaseClient.ts",
            steps: [
                "Confier à l'équipe de développement l'ajout, en tête de uploadContentMedia, d'une liste blanche de types MIME par dossier (images, vidéos, audio, PDF et bureautique pour les documents) et d'une taille maximale, avec un message clair à l'utilisateur en cas de refus.",
                "Poser les mêmes limites sur le bucket : Supabase → Storage → bucket public → Edit bucket → « Restrict file upload size » et « Allowed MIME types ».",
                "Vérifier avec un fichier trop gros et un fichier d'un type interdit que les deux refus s'affichent, puis noter la date et les limites retenues dans le journal des décisions.",
            ],
        },
    },

    // ─────────────────────── CONTENU & VIE SOCIALE ───────────────────────

    {
        id: 'contenu.publications_bloquees',
        domain: 'contenu',
        bloc: 'base',
        title: "Publications programmées effectivement parties",
        why: "Une publication dont l'heure est passée mais qui reste en brouillon ne paraîtra jamais : l'auteur croit avoir publié, personne ne voit rien.",
        weight: 30,
        location: 'serveur',
        expected: "Aucune publication dont l'heure programmée est dépassée et qui n'est pas publiée.",
        cause:
            "La tâche planifiée `publish_scheduled_posts()` ne s'est pas exécutée (extension `pg_cron` " +
            "désactivée ou tâche supprimée), ou l'heure programmée a été enregistrée dans un mauvais fuseau.",
        impact:
            "L'auteur croit sa publication parue alors que personne ne la voit : annonces, offres et " +
            "événements programmés manquent leur moment, et la confiance dans la programmation s'érode.",
        risk: 'moyen',
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
        bloc: 'base',
        title: "Stories retirées à leur expiration",
        why: "Une story est un contenu éphémère : la garder au-delà de sa date d'expiration trahit l'attente de la personne qui l'a publiée.",
        weight: 26,
        location: 'serveur',
        expected: "Aucune story conservée au-delà de sa date d'expiration.",
        cause:
            "Aucune purge automatique ne retire les stories à leur date d'expiration : l'application se " +
            "contente de ne plus les afficher, et la ligne reste en base.",
        impact:
            "Un contenu que son auteur croyait disparu au bout de 24 heures reste stocké et consultable par " +
            "l'administration ou par une requête directe : la promesse d'éphémère n'est pas tenue.",
        risk: 'moyen',
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
        bloc: 'base',
        title: "File de notifications maîtrisée",
        why: "Des notifications lues accumulées pendant des mois alourdissent chaque ouverture de l'application sans rien apporter.",
        weight: 24,
        location: 'serveur',
        expected: "Moins de 20 000 notifications, et aucune notification lue de plus de 90 jours.",
        cause:
            "Rien ne purge les notifications une fois lues : chaque interaction en ajoute une, et la table " +
            "grossit avec l'activité sans jamais diminuer.",
        impact:
            "Chaque ouverture de l'application charge une file de plus en plus lourde : démarrage ralenti, " +
            "surtout sur mobile, et comptage des non-lus de plus en plus coûteux pour tous.",
        risk: 'moyen',
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
        bloc: 'connecteurs',
        title: "Experts disponibles",
        why: "Sans expert actif, les Experts IA disparaissent du LIVE, du fil et de l'Architecte sans message d'explication.",
        weight: 20,
        location: 'serveur',
        expected: "Au moins un expert actif dans le catalogue.",
        cause:
            "Le dernier expert du catalogue a été désactivé (`agents.is_active = false`) ou supprimé, ou le " +
            "catalogue n'a jamais été rempli sur cet environnement.",
        impact:
            "Les Experts IA disparaissent du LIVE, du fil et de l'Architecte pour tous les utilisateurs, " +
            "sans message d'explication : la fonctionnalité semble simplement absente.",
        risk: 'eleve',
        recommendedAction:
            "Réactiver au moins un expert dans l'éditeur SQL Supabase : lister le catalogue " +
            "(`select * from public.agents;`) puis " +
            "`update public.agents set is_active = true where id = '<identifiant de l'expert>';`, et " +
            "vérifier dans MokNet que les Experts réapparaissent dans le fil et le LIVE. Relancer la mesure.",
    },

    // ──────────────── EXPÉRIENCE & APPLICATION INSTALLÉE ────────────────
    //
    // Domaine mesuré DEPUIS LE NAVIGATEUR : ce sont les seules lignes que le
    // serveur ne peut pas constater à la place de l'utilisateur.

    {
        id: 'experience.service_worker',
        domain: 'experience',
        bloc: 'application',
        title: "Service worker actif",
        why: "C'est lui qui réveille le téléphone sur un appel entrant et qui fait fonctionner l'application hors connexion. Sans lui, les notifications d'appel ne s'affichent jamais.",
        weight: 35,
        location: 'client',
        expected: "Un service worker est enregistré et contrôle la page.",
        cause:
            "Le fichier `/sw.js` n'est pas servi par le déploiement (absent de `dist/`, mauvais type MIME), " +
            "ou le navigateur ne prend pas en charge les service workers (navigation privée, navigateur " +
            "intégré à une autre application, système ancien).",
        impact:
            "Aucune notification d'appel ne s'affiche sur cet appareil, l'application ne fonctionne plus hors " +
            "connexion et l'installation sur l'écran d'accueil est refusée : l'utilisateur rate ses appels " +
            "sans le savoir.",
        risk: 'critique',
        recommendedAction:
            "Vérifier que `https://moknet.net/sw.js` répond 200 en `application/javascript` (le fichier vit " +
            "dans `public/sw.js` et doit être copié tel quel dans `dist/`), puis recharger l'application : " +
            "`registerPwaServiceWorker` l'enregistre au chargement. Si seul cet appareil est concerné, sortir " +
            "de la navigation privée ou ouvrir MokNet dans un navigateur à jour. Relancer la mesure.",
    },
    {
        id: 'experience.manifeste',
        domain: 'experience',
        bloc: 'application',
        title: "Manifeste d'installation joignable",
        why: "Sans manifeste, MokNet ne peut pas être installé sur l'écran d'accueil : l'application reste un simple onglet.",
        weight: 25,
        location: 'client',
        expected: "`/manifest.webmanifest` répond et contient un nom et des icônes.",
        cause:
            "`public/manifest.webmanifest` a été retiré du déploiement ou la balise `<link rel=manifest>` " +
            "d'`index.html` a été perdue, ou le fichier a été modifié et ne contient plus de nom ni d'icônes " +
            "valides.",
        impact:
            "MokNet ne peut plus être installé sur l'écran d'accueil et les installations existantes " +
            "perdent leur icône et leur nom : l'application redevient un simple onglet pour tous.",
        risk: 'moyen',
        recommendedAction:
            "Vérifier que `https://moknet.net/manifest.webmanifest` répond 200 avec un JSON contenant `name` " +
            "et un tableau `icons` non vide (fichier `public/manifest.webmanifest` du dépôt, icônes dans " +
            "`public/icons/`), et qu'`index.html` conserve sa balise `<link rel=manifest>`. Relancer la " +
            "mesure depuis le navigateur.",
    },
    {
        id: 'experience.module_messagerie',
        domain: 'experience',
        bloc: 'application',
        title: "Module messagerie autonome installable",
        why: "La messagerie s'installe comme une application séparée ; si sa route ou son manifeste tombe, l'icône déjà posée sur les téléphones ouvre une page d'erreur.",
        weight: 20,
        location: 'client',
        expected: "`/manifests/messagerie.webmanifest` répond et `/messagerie` renvoie l'application.",
        cause:
            "Les deux réécritures `/messagerie` de `netlify.toml` ont été retirées (Netlify répond alors " +
            "404), ou `public/manifests/messagerie.webmanifest` n'est plus déployé.",
        impact:
            "L'icône « Messagerie » déjà installée sur les téléphones ouvre une page d'erreur, et le module " +
            "ne peut plus être installé : les personnes qui n'utilisent que la messagerie perdent leur accès.",
        risk: 'moyen',
        recommendedAction:
            "Vérifier que `netlify.toml` contient toujours les deux blocs `[[redirects]]` de `/messagerie` " +
            "et `/messagerie/*` vers `/index.html` (statut 200), que " +
            "`https://moknet.net/manifests/messagerie.webmanifest` répond 200, et que " +
            "`https://moknet.net/messagerie` affiche le module. Relancer la mesure depuis le navigateur.",
    },
    {
        id: 'experience.stockage_local',
        domain: 'experience',
        bloc: 'application',
        title: "Stockage local disponible",
        why: "La session, le brouillon en cours et le cache des conversations y vivent : sans lui, l'utilisateur est déconnecté à chaque rechargement.",
        weight: 20,
        location: 'client',
        expected: "`localStorage` est accessible en lecture et en écriture.",
        cause:
            "Le navigateur bloque le stockage local : navigation privée, réglage « bloquer les données de " +
            "site », espace de stockage saturé, ou MokNet ouvert dans une iframe tierce où le stockage est " +
            "refusé.",
        impact:
            "Sur cet appareil, l'utilisateur est déconnecté à chaque rechargement, perd son brouillon en " +
            "cours et le cache de ses conversations ; aucun autre utilisateur n'est concerné.",
        risk: 'faible',
        recommendedAction:
            "Constat propre à l'appareil, rien à corriger côté serveur : sortir de la navigation privée, " +
            "autoriser les données de site pour moknet.net dans les réglages du navigateur (cookies et " +
            "données de site), libérer de l'espace si le stockage est saturé, puis recharger. Relancer la " +
            "mesure depuis ce navigateur.",
    },

    // ────────────────────────── DÉPENDANCES ──────────────────────────

    {
        id: 'dependances.vulnerabilites',
        domain: 'dependances',
        bloc: 'application',
        title: "Dépendances sans vulnérabilité connue",
        why: "Une bibliothèque qui analyse des fichiers fournis par les utilisateurs est le premier endroit où une vulnérabilité connue devient exploitable.",
        weight: 55,
        location: 'humain',
        expected: "`npm audit --audit-level=high` ne remonte aucune vulnérabilité.",
        cause:
            "`npm audit` n'est pas exécuté dans le Green Gate : une vulnérabilité publiée après " +
            "l'installation d'une dépendance n'est vue par personne. Connu au 04/09/2026 : `xlsx@0.18.5` " +
            "(pollution de prototype, CVE-2023-30533), sans correctif sur le registre npm (constat O-04).",
        impact:
            "Un classeur Excel piégé, envoyé par un utilisateur, peut faire exécuter du code dans le " +
            "navigateur de la personne qui l'ouvre dans MokNet ; d'autres vulnérabilités peuvent s'accumuler " +
            "sans signal.",
        risk: 'moyen',
        humanAction:
            "Mesure non exécutable depuis le navigateur. Ajouter `npm audit --audit-level=high` au " +
            "Green Gate (.github/workflows/ci.yml) : la ligne deviendra alors verte ou rouge à " +
            "chaque intégration, au lieu de rester non éprouvée. " +
            "Connu au 04/09/2026 : `xlsx@0.18.5`, 1 vulnérabilité haute sans correctif npm.",
        manual: {
            where: "Dépôt GitHub → .github/workflows/ci.yml, puis package.json",
            url: "{repo}/blob/main/.github/workflows/ci.yml",
            steps: [
                "Ajouter au Green Gate, après l'étape « Installer les dépendances », une étape « Audit des dépendances » exécutant npm audit --audit-level=high : la ligne deviendra rouge ou verte à chaque intégration au lieu de rester non éprouvée.",
                "Traiter xlsx : passer sur le canal officiel SheetJS (version 0.20.2 ou plus, hors registre npm) ou isoler l'analyse des classeurs dans un Worker dédié, comme le recommande l'audit.",
                "Après fusion, lire le résultat dans l'onglet Actions du dépôt et noter la date du contrôle dans le journal des décisions.",
            ],
        },
    },
    {
        id: 'dependances.green_gate',
        domain: 'dependances',
        bloc: 'application',
        title: "Contrôle indépendant au vert",
        why: "Le typage, les tests et le build sont la seule preuve que ce qui est livré fonctionne encore.",
        weight: 45,
        location: 'humain',
        expected: "Le dernier passage du Green Gate est vert sur la branche principale.",
        cause:
            "Le dernier passage du Green Gate sur `main` a échoué (typage, test ou build) sans que personne " +
            "ne le lise, ou une fusion a été faite sans attendre son résultat.",
        impact:
            "Ce qui est servi aux utilisateurs peut ne plus compiler, ne plus passer ses tests ou ne plus se " +
            "construire : une régression atteint la production sans aucun signal indépendant.",
        risk: 'faible',
        humanAction:
            "Mesure non exécutable depuis le navigateur. À lire dans l'onglet Actions du dépôt, ou à " +
            "rendre automatique en publiant le résultat du Green Gate dans une table de santé.",
        manual: {
            where: "Dépôt GitHub → onglet Actions → workflow « CI — Green Gate »",
            url: "{repo}/actions",
            steps: [
                "Ouvrir l'onglet Actions du dépôt et lire le dernier passage du workflow « CI — Green Gate » sur la branche main : il doit être vert (typage, tests, build).",
                "S'il est rouge, ouvrir le passage, lire l'étape en échec, et faire corriger la cause par une pull request avant tout nouveau déploiement.",
                "Pour rendre la mesure automatique, faire publier le résultat de chaque passage dans une table de santé lue par la sonde (développement à programmer).",
                "Noter la date et le résultat du contrôle dans le journal des décisions.",
            ],
        },
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

export const HEALTH_BLOCK_BY_ID: ReadonlyMap<HealthBlockId, HealthBlock> = new Map(
    HEALTH_BLOCKS.map((block) => [block.id, block]),
);

/** Lignes d'un bloc de lecture, dans l'ordre de déclaration. */
export function linesOfBlock(blockId: HealthBlockId): HealthLine[] {
    return HEALTH_LINES.filter((line) => line.bloc === blockId);
}

/**
 * Catalogue des réparations réellement proposées par le registre. Sert de
 * contrôle croisé avec le catalogue SQL : un identifiant présent d'un seul
 * côté est une erreur de câblage, pas une fonctionnalité.
 */
export const REMEDIATION_IDS: string[] = HEALTH_LINES
    .map((line) => line.remediation?.id)
    .filter((id): id is string => Boolean(id));
