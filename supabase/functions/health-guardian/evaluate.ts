// Traduction des mesures brutes en verdicts, ligne par ligne.
//
// Fichier volontairement PUR : aucun accès à `Deno`, au réseau ni à la base.
// Il ne fait que transformer des mesures déjà prises en verdicts — trois blocs
// de chiffres venus de la base, plus (SAT-4) une observation réseau faite par
// `index.ts` et passée telle quelle. C'est ce qui le rend rejouable dans un
// test unitaire sans base ni serveur, et donc vérifiable autrement que par la
// confiance.
//
// Chaque évaluateur écrit son OBTENU en français : c'est ce texte que
// l'administrateur lit dans le tableau de bord. Un verdict sans phrase
// lisible oblige à retourner au code pour comprendre, ce qui n'est pas une
// console d'exploitation.

import {
    type RawLiveTransportProbe,
    SEUIL_DEGRADE_MS,
    describeLiveTransport,
    judgeLiveTransport,
    liveTransportVerdict,
} from './liveTransportProbe.ts';

export type HealthStatus = 'vert' | 'jaune' | 'orange' | 'rouge' | 'blanc';
export type ProofLevel = 'banc' | 'reel' | 'production' | 'non_eprouve';

export interface ProbeOutcome {
    lineId: string;
    status: HealthStatus;
    proofLevel: ProofLevel;
    measured: string;
    gap?: string;
    evidence?: Record<string, unknown>;
    ranAt: string;
    probeError?: string;
}

/** Les trois blocs de mesures renvoyés par les RPC `health_probe_*`. */
export interface RawMetrics {
    catalogue: Record<string, any>;
    data: Record<string, any>;
    operations: Record<string, any>;
    /**
     * SAT-4 — l'observation brute du transport du direct, la seule mesure de
     * ce fichier qui ne vienne pas de la base : elle vient d'un appel réel à
     * l'API serveur de LiveKit, fait par `index.ts` (le seul endroit qui a le
     * droit de toucher au réseau).
     *
     * `undefined` = la sonde n'a pas tourné. La ligne devient BLANCHE, jamais
     * verte : ne pas avoir regardé n'est pas un constat.
     */
    liveTransport?: {
        /** `false` quand aucune configuration de transport n'est active. */
        configured: boolean;
        probe: RawLiveTransportProbe | null;
    };
    /**
     * 05/09/2026 — le VPS du direct, vu de l'extérieur : la façade HTTPS
     * (nginx/CloudPanel) et la porte des appareils (`/rtc/validate`), avec un
     * jeton signé par la clé du coffre. `undefined` = sonde non exécutée →
     * lignes BLANCHES.
     */
    vps?: RawVpsMetrics;
    /**
     * 05/09/2026 — réponse de chaque fonction Edge à une requête de pré-vol
     * (OPTIONS) venue d'une origine inventée. C'est le constat O-03 de
     * l'audit, mesuré au lieu d'être supposé.
     */
    edgeCors?: RawEdgeCorsMetrics;
}

/** Une requête HTTP observée : atteinte ou non, code, délai. */
export interface RawHttpProbe {
    reached: boolean;
    httpStatus: number | null;
    latencyMs: number;
    timedOut: boolean;
}

export interface RawVpsMetrics {
    /** `false` quand aucune configuration de transport n'est active : rien à sonder. */
    configured: boolean;
    /** `GET /` sur le serveur du direct — la façade HTTPS. */
    front: RawHttpProbe | null;
    /** `GET /rtc/validate?access_token=…` — la porte réellement utilisée par les appareils. */
    rtc: RawHttpProbe | null;
}

export interface RawEdgeCorsMetrics {
    /** L'origine inventée envoyée dans la requête de pré-vol. */
    foreignOrigin: string;
    functions: {
        slug: string;
        /** `false` si la passerelle a répondu à la place de la fonction (404) ou si l'appel a échoué. */
        reached: boolean;
        httpStatus: number | null;
        /** Valeur brute de `Access-Control-Allow-Origin` renvoyée. */
        allowOrigin: string | null;
    }[];
}

interface Verdict {
    status: HealthStatus;
    measured: string;
    gap?: string;
    evidence?: Record<string, unknown>;
}

type Evaluator = (m: RawMetrics) => Verdict;

const n = (value: unknown): number => Number(value ?? 0);
const list = (value: unknown): string[] => (Array.isArray(value) ? value.map(String) : []);

/** Ratio en pourcentage, protégé contre la division par zéro. */
function ratio(part: number, total: number): number | null {
    return total <= 0 ? null : Math.round((part / total) * 1000) / 10;
}

/**
 * Les trois formes d'une même phrase de comptage. Les écrire explicitement
 * plutôt que d'ajouter un « s » à la fin : le français accorde le NOM, pas la
 * formule entière — un accord automatique produisait « 2 direct ouvert depuis
 * plus de 24 hs », qui décrédibilise tout le tableau de bord.
 */
interface Formes {
    /** Cas zéro, accordé en genre : « Aucune story conservée après expiration. » */
    aucun: string;
    /** Exactement un : « story conservée après expiration ». */
    un: string;
    /** Deux et plus : « stories conservées après expiration ». */
    plusieurs: string;
}

/**
 * Verdict d'un compteur qui doit rester à zéro : au-delà, la gravité dépend
 * de l'ampleur, jamais du simple fait qu'il soit non nul.
 */
function zeroIsGood(
    count: number,
    formes: Formes,
    orangeUpTo: number,
    evidence?: Record<string, unknown>,
): Verdict {
    if (count === 0) return { status: 'vert', measured: `${formes.aucun}.`, evidence };
    return {
        status: count <= orangeUpTo ? 'orange' : 'rouge',
        measured: `${count} ${count > 1 ? formes.plusieurs : formes.un}.`,
        gap: `Attendu 0, mesuré ${count}.`,
        evidence,
    };
}

/**
 * Nombre de tables déjà capturées dans les migrations versionnées du dépôt.
 *
 * Maintenue à la main, et VÉRIFIÉE par `tests/healthRegistry.test.ts`, qui
 * recompte les `create table` des fichiers de migration et échoue si la
 * constante a dérivé. Sans ce test, la ligne « schéma versionné » finirait
 * par mentir dans le sens rassurant — exactement ce qu'on cherche à empêcher.
 */
export const VERSIONED_TABLE_COUNT = 2;

export const EVALUATORS: Record<string, Evaluator> = {

    // ───────────────────────── SÉCURITÉ ─────────────────────────

    'securite.forge_credits': ({ catalogue }) => catalogue.creditForgeryOpen
        ? {
            status: 'rouge',
            measured: "`award_xp_and_credits` est exécutable par tout compte connecté.",
            gap: "Un compte ordinaire peut s'attribuer des crédits et de l'XP sans limite.",
        }
        : { status: 'vert', measured: "Le droit d'exécution est retiré aux comptes ordinaires." },

    'securite.portefeuille_credit': ({ catalogue }) => catalogue.walletWriteOpen
        ? {
            status: 'rouge',
            measured: "`insert_wallet_transaction` est exécutable par tout compte connecté.",
            gap: "Un crédit de portefeuille peut être déclaré depuis le navigateur.",
        }
        : { status: 'vert', measured: "L'écriture directe du grand livre est fermée." },

    'securite.rls_couverture': ({ catalogue }) => {
        const total = n(catalogue.tablesTotal);
        const withRls = n(catalogue.tablesWithRls);
        const without = list(catalogue.tablesWithoutRls);
        if (without.length === 0) {
            return { status: 'vert', measured: `${withRls} tables sur ${total}, toutes protégées.` };
        }
        return {
            status: 'rouge',
            measured: `${without.length} table(s) sans RLS sur ${total}.`,
            gap: `Sans protection : ${without.slice(0, 8).join(', ')}${without.length > 8 ? '…' : ''}`,
            evidence: { tablesWithoutRls: without },
        };
    },

    'securite.coffre_cles': ({ catalogue }) => {
        const leaks = list(catalogue.vaultLeaks);
        if (leaks.length === 0) {
            return { status: 'vert', measured: "Aucune fonction de coffre atteignable depuis une session." };
        }
        return {
            status: 'rouge',
            measured: `${leaks.length} fonction(s) de coffre exécutable(s) par un compte connecté.`,
            gap: `Exposées : ${leaks.join(', ')}`,
            evidence: { vaultLeaks: leaks },
        };
    },

    'securite.garde_role': ({ catalogue }) => catalogue.roleGuardEnabled
        ? { status: 'vert', measured: "Le déclencheur anti-élévation de rôle est actif." }
        : {
            status: 'rouge',
            measured: "Le déclencheur `trg_profiles_protect_sensitive` est absent ou désactivé.",
            gap: "Une mise à jour de son propre profil pourrait suffire à se nommer administrateur.",
        },

    'securite.secdef_search_path': ({ catalogue }) => {
        const mutable = list(catalogue.mutableSearchPath);
        if (mutable.length === 0) {
            return { status: 'vert', measured: "Toutes les fonctions privilégiées ont un chemin figé." };
        }
        return {
            status: 'orange',
            measured: `${mutable.length} fonction(s) privilégiée(s) au chemin de recherche libre.`,
            gap: `À figer : ${mutable.slice(0, 6).join(', ')}${mutable.length > 6 ? '…' : ''}`,
            evidence: { mutableSearchPath: mutable },
        };
    },

    'securite.depense_ia_publique': ({ catalogue }) => catalogue.aiSpendOpen
        ? {
            status: 'orange',
            measured: "`get_ai_spend` est lisible par tout compte connecté.",
            gap: "La dépense IA de l'organisation n'a pas à être publique.",
        }
        : { status: 'vert', measured: "La dépense IA est réservée aux administrateurs." },

    'securite.grants_anon': ({ catalogue }) => {
        const PUBLIQUES = new Set(['posts', 'profiles', 'comments', 'post_reactions', 'follows']);
        const anon = list(catalogue.anonReadableTables);
        const excess = anon.filter((t) => !PUBLIQUES.has(t));
        if (excess.length === 0) {
            return { status: 'vert', measured: `Lecture anonyme limitée à ${anon.length} table(s) publique(s).` };
        }
        return {
            // Orange et non rouge : la RLS reste le verrou effectif, et aucune
            // fuite n'a été constatée. C'est la marge de sécurité qui manque,
            // pas la sécurité elle-même — le dire autrement serait un faux rouge.
            status: 'orange',
            measured: `${excess.length} table(s) non publiques restent lisibles par le rôle anonyme.`,
            gap: "La RLS bloque effectivement les lignes ; c'est la défense en profondeur qui manque.",
            evidence: { excess: excess.slice(0, 20), total: excess.length },
        };
    },

    // ───────────────────────── DONNÉES ─────────────────────────
    //
    // Les liens ci-dessous sont garantis par des clés étrangères en cascade :
    // un compteur non nul signifie qu'une CONTRAINTE a été perdue, pas qu'il
    // faut purger. Le verdict le dit explicitement.

    'donnees.messages_orphelins': ({ data, catalogue }) => {
        const fk = list(catalogue.foreignKeys).includes('messages_conversation_id_fkey');
        const count = n(data.orphanMessages);
        if (count === 0 && fk) {
            return { status: 'vert', measured: "Aucun orphelin, contrainte en cascade en place." };
        }
        if (!fk) {
            return {
                status: 'rouge',
                measured: `Contrainte « messages_conversation_id_fkey » ABSENTE (${count} orphelin(s)).`,
                gap: "Rétablir la contrainte : purger sans elle ne ferait que repousser le problème.",
            };
        }
        return zeroIsGood(count, { aucun: 'Aucun message orphelin', un: 'message orphelin', plusieurs: 'messages orphelins' }, 10);
    },

    'donnees.participants_fantomes': ({ data, catalogue }) => {
        const fk = list(catalogue.foreignKeys).includes('conversation_participants_conversation_id_fkey');
        const count = n(data.orphanParticipants);
        if (count === 0 && fk) {
            return { status: 'vert', measured: "Aucun participant fantôme, contraintes en place." };
        }
        if (!fk) {
            return {
                status: 'rouge',
                measured: `Contrainte de participation ABSENTE (${count} fantôme(s)).`,
                gap: "Rétablir la contrainte avant toute purge.",
            };
        }
        return zeroIsGood(count, { aucun: 'Aucun participant fantôme', un: 'participant fantôme', plusieurs: 'participants fantômes' }, 10);
    },

    'donnees.conversations_vides': ({ data }) =>
        zeroIsGood(n(data.emptyConversations), { aucun: 'Aucune conversation sans participant', un: 'conversation sans participant', plusieurs: 'conversations sans participant' }, 5),

    'donnees.reactions_orphelines': ({ data, catalogue }) => {
        const fk = list(catalogue.foreignKeys).includes('post_reactions_post_id_fkey');
        const count = n(data.orphanReactions);
        if (count === 0 && fk) {
            return { status: 'vert', measured: "Aucune réaction orpheline, contraintes en place." };
        }
        if (!fk) {
            return {
                status: 'rouge',
                measured: `Contrainte « post_reactions_post_id_fkey » ABSENTE (${count} orphelin(s)).`,
                gap: "Rétablir la contrainte avant toute purge.",
            };
        }
        return zeroIsGood(count, { aucun: 'Aucune réaction orpheline', un: 'réaction orpheline', plusieurs: 'réactions orphelines' }, 20);
    },

    'donnees.coherence_amities': ({ data }) => {
        const self = n(data.selfFriendships);
        const dupes = n(data.duplicateFriendships);
        if (self === 0 && dupes === 0) {
            return { status: 'vert', measured: "Aucune auto-amitié, aucun couple en double." };
        }
        return {
            status: 'orange',
            measured: `${self} auto-amitié(s), ${dupes} couple(s) en double.`,
            gap: "Fausse les amis communs et la visibilité « réseau » des publications.",
            evidence: { self, dupes },
        };
    },

    'donnees.profils_sans_compte': ({ data }) =>
        zeroIsGood(n(data.profilesWithoutAccount), { aucun: 'Aucun profil sans compte', un: 'profil sans compte', plusieurs: 'profils sans compte' }, 3),

    // ─────────────────────────── IA ───────────────────────────

    'ia.fournisseur_actif': ({ operations }) => {
        const cats = list(operations.activeProviderCategories);
        const ATTENDUES = ['llm', 'voice', 'image_video'];
        const manquantes = ATTENDUES.filter((c) => !cats.includes(c));
        if (manquantes.length === 0) {
            return { status: 'vert', measured: "Les trois catégories ont un fournisseur actif." };
        }
        return {
            status: manquantes.length === ATTENDUES.length ? 'rouge' : 'orange',
            measured: `Catégorie(s) sans fournisseur actif : ${manquantes.join(', ')}.`,
            gap: "Les fonctions correspondantes cessent de répondre.",
            evidence: { actives: cats, manquantes },
        };
    },

    'ia.secrets_presents': ({ operations }) =>
        zeroIsGood(n(operations.enabledWithoutSecret), { aucun: 'Aucun fournisseur activé sans clé', un: 'fournisseur activé sans clé', plusieurs: 'fournisseurs activés sans clé' }, 1),

    'ia.budget_arme': ({ operations }) => {
        const enforced = operations.budgetEnforced === true;
        const hasCap = operations.budgetHasCap === true;
        if (enforced && hasCap) return { status: 'vert', measured: "Plafond armé et défini." };
        if (!enforced && hasCap) {
            return {
                status: 'orange',
                measured: "Des plafonds sont saisis mais ne sont PAS appliqués.",
                gap: "`ai_budget.enforced` est faux : les plafonds sont décoratifs.",
            };
        }
        return {
            status: 'orange',
            measured: enforced ? "Application activée, mais aucun plafond saisi." : "Aucun plafond, aucune application.",
            gap: "Rien ne borne la dépense IA.",
        };
    },

    'ia.quota_par_utilisateur': () => ({
        // Constat de conception : il n'existe aujourd'hui aucun compteur par
        // utilisateur dans ai-gateway. La sonde ne peut pas mesurer ce qui
        // n'est pas écrit ; elle rapporte l'état connu du code.
        status: 'orange',
        measured: "Le seul plafond en place est global (`ai_budget`), pas par utilisateur.",
        gap: "Un compte unique peut épuiser le budget IA de toute l'organisation.",
    }),

    'ia.taux_echec': ({ operations }) => {
        const total = n(operations.aiCalls24h);
        const fails = n(operations.aiFailures24h);
        const pct = ratio(fails, total);
        if (pct === null) return { status: 'jaune', measured: "Aucun appel IA sur 24 h : rien à mesurer." };
        if (pct < 10) return { status: 'vert', measured: `${pct} % d'échecs sur ${total} appels (24 h).` };
        return {
            status: pct < 35 ? 'orange' : 'rouge',
            measured: `${pct} % d'échecs sur ${total} appels (24 h).`,
            gap: "Attendu moins de 10 %.",
            evidence: { total, fails },
        };
    },

    'ia.journal_appels': ({ operations }) => {
        const rows = n(operations.aiCallLogRows);
        if (rows < 100_000) return { status: 'vert', measured: `${rows.toLocaleString('fr-FR')} lignes de journal.` };
        return {
            status: rows < 400_000 ? 'orange' : 'rouge',
            measured: `${rows.toLocaleString('fr-FR')} lignes de journal.`,
            gap: "Au-delà de 100 000, le journal pèse sur chaque requête.",
        };
    },

    // ─────────────────── MESSAGERIE & APPELS ───────────────────

    'messagerie.transport_live_configure': ({ operations }) => operations.liveTransportConfigured
        ? { status: 'vert', measured: "Configuration de transport présente." }
        : {
            status: 'rouge',
            measured: "Aucune configuration de transport LIVE.",
            gap: "Ni appel ni direct ne peut s'établir.",
        },

    'messagerie.appels_bloques': ({ operations }) =>
        zeroIsGood(n(operations.stuckCalls), { aucun: 'Aucun appel resté en cours depuis plus de 6 h', un: 'appel resté en cours depuis plus de 6 h', plusieurs: 'appels restés en cours depuis plus de 6 h' }, 5),

    'messagerie.appels_en_echec': ({ operations }) => {
        const total = n(operations.calls24h);
        const fails = n(operations.callFailures24h);
        const pct = ratio(fails, total);
        if (pct === null) return { status: 'jaune', measured: "Aucun appel sur 24 h : rien à mesurer." };
        if (pct < 20) return { status: 'vert', measured: `${pct} % d'appels en échec sur ${total} (24 h).` };
        return {
            status: pct < 50 ? 'orange' : 'rouge',
            measured: `${pct} % d'appels en échec sur ${total} (24 h).`,
            gap: "Attendu moins de 20 %.",
            evidence: { total, fails },
        };
    },

    'messagerie.blocages_operationnels': ({ operations }) => operations.blockFunctionPresent
        ? { status: 'vert', measured: "La vérification de blocage répond." }
        : {
            status: 'rouge',
            measured: "`are_users_blocked` est absente.",
            gap: "Une personne bloquée pourrait de nouveau notifier sa cible.",
        },

    // ─────────────────────────── LIVE ───────────────────────────

    // SAT-4 — la seule ligne du tableau de bord qui juge un service EXTÉRIEUR
    // à la base. Elle ne conclut jamais sur `GET /` : elle conclut sur
    // `ListRooms`, l'appel dont dépend réellement l'ouverture d'un direct.
    // Voir l'encadré de `liveTransportProbe.ts`.
    'live.transport_utilisable': ({ liveTransport }) => {
        if (!liveTransport) {
            // La sonde n'a pas tourné. On ne sait rien — et ne pas savoir
            // n'est pas un constat : `evaluateAll` transforme cette exception
            // en ligne BLANCHE, jamais en vert par défaut.
            throw new Error("La sonde du transport LIVE n'a pas été exécutée.");
        }
        const health = judgeLiveTransport(liveTransport.probe, { configured: liveTransport.configured });
        if (health.status === 'unconfigured') {
            // Rien n'est branché : il n'y a pas de panne à annoncer, et la
            // ligne « Transport temps réel configuré » dit déjà cela — le
            // compter rouge ici pénaliserait deux fois le même défaut.
            throw new Error(describeLiveTransport(health));
        }
        return liveTransportVerdict(health);
    },

    'live.sessions_zombies': ({ operations }) =>
        zeroIsGood(n(operations.zombieSessions), { aucun: 'Aucun direct ouvert depuis plus de 24 h', un: 'direct ouvert depuis plus de 24 h', plusieurs: 'directs ouverts depuis plus de 24 h' }, 3),

    'live.transcriptions_a_purger': ({ operations }) => {
        const count = n(operations.expiredTranscripts);
        if (count === 0) return { status: 'vert', measured: "Rétention à 30 jours respectée." };
        return {
            // Rouge d'emblée, quel que soit le volume : c'est un engagement de
            // conservation pris envers les utilisateurs, pas une métrique de
            // confort. Une ligne conservée en trop est déjà un manquement.
            status: 'rouge',
            measured: `${count} ligne(s) de transcription au-delà de 30 jours.`,
            gap: "La rétention annoncée aux utilisateurs n'est pas tenue.",
        };
    },

    'live.intervenants_orphelins': ({ data, catalogue }) => {
        const fk = list(catalogue.foreignKeys).includes('live_speakers_session_id_fkey');
        const count = n(data.orphanSpeakers);
        if (count === 0 && fk) {
            return { status: 'vert', measured: "Aucun intervenant orphelin, contrainte en place." };
        }
        if (!fk) {
            return {
                status: 'rouge',
                measured: `Contrainte « live_speakers_session_id_fkey » ABSENTE (${count} orphelin(s)).`,
                gap: "Rétablir la contrainte avant toute purge.",
            };
        }
        return zeroIsGood(count, { aucun: 'Aucun intervenant orphelin', un: 'intervenant orphelin', plusieurs: 'intervenants orphelins' }, 10);
    },

    // ────────────────────── NOTIFICATIONS ──────────────────────

    'notifications.vapid_configuree': ({ operations }) => operations.vapidConfigured
        ? { status: 'vert', measured: "Clé de signature présente." }
        : {
            status: 'rouge',
            measured: "Aucune configuration VAPID.",
            gap: "Aucune notification ne part : les appels ne réveillent pas le correspondant.",
        },

    'notifications.taux_echec': ({ operations }) => {
        const total = n(operations.pushSends24h);
        const fails = n(operations.pushFailures24h);
        const pct = ratio(fails, total);
        if (pct === null) return { status: 'jaune', measured: "Aucun envoi sur 24 h : rien à mesurer." };
        if (pct < 25) return { status: 'vert', measured: `${pct} % d'échecs sur ${total} envois (24 h).` };
        return {
            status: pct < 60 ? 'orange' : 'rouge',
            measured: `${pct} % d'échecs sur ${total} envois (24 h).`,
            gap: "Attendu moins de 25 %.",
            evidence: { total, fails },
        };
    },

    'notifications.abonnements_morts': ({ operations }) =>
        zeroIsGood(n(operations.deadSubscriptions), { aucun: 'Aucun abonnement refusé définitivement', un: 'abonnement refusé définitivement', plusieurs: 'abonnements refusés définitivement' }, 5),

    'notifications.journal_volume': ({ operations }) => {
        const rows = n(operations.pushDeliveryLogRows);
        if (rows < 50_000) return { status: 'vert', measured: `${rows.toLocaleString('fr-FR')} lignes de journal.` };
        return {
            status: rows < 200_000 ? 'orange' : 'rouge',
            measured: `${rows.toLocaleString('fr-FR')} lignes de journal.`,
            gap: "Au-delà de 50 000, le journal devient du poids mort.",
        };
    },

    // ──────────────────── CONTENU & VIE SOCIALE ────────────────────

    'contenu.publications_bloquees': ({ data }) =>
        zeroIsGood(n(data.stuckScheduledPosts), { aucun: 'Aucune publication programmée en retard', un: 'publication programmée jamais parue', plusieurs: 'publications programmées jamais parues' }, 3),

    'contenu.stories_expirees': ({ data }) =>
        zeroIsGood(n(data.expiredStories), { aucun: 'Aucune story conservée après expiration', un: 'story conservée après expiration', plusieurs: 'stories conservées après expiration' }, 10),

    'contenu.notifications_obsoletes': ({ data }) => {
        const total = n(data.notificationsTotal);
        const stale = n(data.staleNotifications);
        if (total < 20_000 && stale === 0) {
            return { status: 'vert', measured: `${total.toLocaleString('fr-FR')} notifications, aucune obsolète.` };
        }
        return {
            status: total > 100_000 ? 'rouge' : 'orange',
            measured: `${total.toLocaleString('fr-FR')} notifications dont ${stale} lue(s) de plus de 90 jours.`,
            gap: "Alourdit chaque ouverture de l'application.",
            evidence: { total, stale },
        };
    },

    'contenu.experts_disponibles': ({ data }) => {
        const active = n(data.activeAgents);
        if (active > 0) return { status: 'vert', measured: `${active} expert(s) actif(s) au catalogue.` };
        return {
            status: 'rouge',
            measured: "Aucun expert actif.",
            gap: "Les Experts IA disparaissent du LIVE, du fil et de l'Architecte.",
        };
    },

    // ─────────────────────── STOCKAGE ───────────────────────

    'stockage.documents_orphelins': ({ data, catalogue }) => {
        const fk = list(catalogue.foreignKeys).includes('post_documents_post_id_fkey');
        const count = n(data.orphanDocuments);
        if (count === 0 && fk) {
            return { status: 'vert', measured: "Aucune référence orpheline, contrainte en place." };
        }
        if (!fk) {
            return {
                status: 'rouge',
                measured: `Contrainte « post_documents_post_id_fkey » ABSENTE (${count} orphelin(s)).`,
                gap: "Rétablir la contrainte avant toute purge.",
            };
        }
        return zeroIsGood(count, { aucun: 'Aucune référence de document orpheline', un: 'référence de document orpheline', plusieurs: 'références de document orphelines' }, 10);
    },

    'stockage.bucket_public': ({ operations }) => operations.publicBucketPresent
        ? { status: 'vert', measured: "Le bucket `public` existe." }
        : {
            status: 'rouge',
            measured: "Le bucket `public` est introuvable.",
            gap: "Tout téléversement de média échoue au moment de publier.",
        },

    // ────────────────────── GOUVERNANCE ──────────────────────

    'gouvernance.schema_versionne': ({ catalogue }) => {
        const total = n(catalogue.tablesTotal);
        const couvert = VERSIONED_TABLE_COUNT;
        const pct = ratio(couvert, total) ?? 0;
        if (couvert >= total) {
            return { status: 'vert', measured: `Les ${total} tables sont couvertes par des migrations.` };
        }
        return {
            status: pct < 50 ? 'rouge' : 'orange',
            measured: `${couvert} table(s) versionnée(s) sur ${total} en production (${pct} %).`,
            gap: "Le modèle de sécurité n'est ni revu, ni reproductible, ni restaurable.",
            evidence: { tablesEnProduction: total, tablesVersionnees: couvert },
        };
    },

    'gouvernance.tables_sans_politique': ({ catalogue }) => {
        // Coffres assumés : refus par défaut voulu, documenté dans la
        // migration qui les crée. Toute AUTRE table sans politique est très
        // probablement une fonctionnalité muette — la lecture échoue en
        // silence, sans erreur visible côté application.
        const COFFRES = new Set([
            'ai_provider_credentials', 'push_vapid_config', 'live_transport_config',
            'audit_logs', 'admin_api_rate_limits', 'push_delivery_log', 'health_snapshots',
        ]);
        const sansPolitique = list(catalogue.rlsNoPolicy);
        const inattendues = sansPolitique.filter((t) => !COFFRES.has(t));
        if (inattendues.length === 0) {
            return {
                status: 'vert',
                measured: `${sansPolitique.length} table(s) verrouillée(s), toutes assumées.`,
                evidence: { coffres: sansPolitique },
            };
        }
        return {
            status: 'orange',
            measured: `${inattendues.length} table(s) refusent tout le monde sans que ce soit prévu.`,
            gap: `À vérifier : ${inattendues.join(', ')}`,
            evidence: { inattendues },
        };
    },

    'gouvernance.journal_actions': ({ catalogue, operations }) => {
        if (!catalogue.auditLogPresent) {
            return {
                status: 'rouge',
                measured: "La table `audit_logs` est absente.",
                gap: "Aucune action de santé ne peut être tracée.",
            };
        }
        const count = n(operations.healthActionsLogged);
        return {
            status: 'vert',
            measured: count === 0
                ? "Journal en place, aucune action de santé encore enregistrée."
                : `Journal en place, ${count} action(s) de santé enregistrée(s).`,
            evidence: { healthActionsLogged: count },
        };
    },
    // ───────────────────── 05/09/2026 — RANG, CORS, VPS ─────────────────────

    'gouvernance.rang_admin_general': ({ catalogue }) => {
        if (!('superAdminCount' in catalogue)) {
            // Compteur absent = migration 20260905090000 non appliquée. On ne
            // devine pas : la ligne reste blanche avec la raison.
            throw new Error("Compteur `superAdminCount` absent de la sonde : migration 20260905090000 non appliquée.");
        }
        const superAdmins = n(catalogue.superAdminCount);
        const admins = n(catalogue.adminCount);
        const evidence = { superAdminCount: superAdmins, adminCount: admins };
        if (superAdmins === 0) {
            return {
                status: 'orange',
                measured: `Aucun compte ne porte le rang super_admin (${admins} administrateur${admins > 1 ? 's' : ''} ordinaire${admins > 1 ? 's' : ''}).`,
                gap: "Réparer et restaurer sont impossibles pour tout le monde : ce tableau ne peut que diagnostiquer.",
                evidence,
            };
        }
        if (superAdmins > 3) {
            return {
                status: 'orange',
                measured: `${superAdmins} comptes portent le rang super_admin.`,
                gap: "Un rang qui donne le pouvoir de réparer et de restaurer ne devrait tenir que dans une poignée de mains.",
                evidence,
            };
        }
        return {
            status: 'vert',
            measured: `${superAdmins} compte${superAdmins > 1 ? 's' : ''} Admin Général reconnu${superAdmins > 1 ? 's' : ''} par la base.`,
            evidence,
        };
    },

    'securite.cors_fonctions': ({ edgeCors }) => {
        if (!edgeCors) throw new Error("La sonde CORS des fonctions Edge n'a pas été exécutée.");
        const reached = edgeCors.functions.filter((f) => f.reached);
        const unreached = edgeCors.functions.filter((f) => !f.reached).map((f) => f.slug);
        const open = reached
            .filter((f) => f.allowOrigin === '*' || f.allowOrigin === edgeCors.foreignOrigin)
            .map((f) => f.slug);
        const evidence = {
            foreignOrigin: edgeCors.foreignOrigin,
            functions: edgeCors.functions.map((f) => ({ slug: f.slug, allowOrigin: f.allowOrigin, httpStatus: f.httpStatus })),
        };
        if (reached.length === 0) {
            throw new Error(`Aucune fonction n'a pu être interrogée (${unreached.join(', ') || 'liste vide'}).`);
        }
        if (open.length > 0) {
            return {
                status: 'orange',
                measured: `${open.length} fonction${open.length > 1 ? 's' : ''} sur ${reached.length} répond${open.length > 1 ? 'ent' : ''} à n'importe quelle origine : ${open.join(', ')}.`,
                gap: "Attendu : aucune. Chaque fonction doit n'accepter que les origines MokNet (constat O-03 de l'audit).",
                evidence,
            };
        }
        if (unreached.length > 0) {
            return {
                status: 'orange',
                measured: `${reached.length} fonction${reached.length > 1 ? 's' : ''} restreinte${reached.length > 1 ? 's' : ''} aux origines MokNet, mais ${unreached.length} non interrogeable${unreached.length > 1 ? 's' : ''} : ${unreached.join(', ')}.`,
                gap: "Une fonction non interrogeable n'est pas prouvée fermée.",
                evidence,
            };
        }
        return {
            status: 'vert',
            measured: `Les ${reached.length} fonctions n'acceptent que les origines MokNet.`,
            evidence,
        };
    },

    'vps.reverse_proxy': ({ vps }) => {
        if (!vps) throw new Error("La sonde du VPS n'a pas été exécutée.");
        if (!vps.configured) throw new Error("Aucune configuration de transport active : le VPS ne peut pas être sondé.");
        const front = vps.front;
        if (!front) throw new Error("La façade HTTPS du VPS n'a pas pu être observée.");
        const evidence = { httpStatus: front.httpStatus, latencyMs: front.latencyMs, seuilDegradeMs: SEUIL_DEGRADE_MS };
        if (!front.reached) {
            return {
                status: 'rouge',
                measured: front.timedOut
                    ? `Le VPS ne répond pas en HTTPS dans le délai (${front.latencyMs} ms).`
                    : "Le VPS est injoignable en HTTPS (erreur réseau ou certificat).",
                gap: "Aucun téléphone ne peut joindre le direct tant que la façade ne répond pas.",
                evidence,
            };
        }
        if (front.latencyMs > SEUIL_DEGRADE_MS) {
            return {
                status: 'orange',
                measured: `Le VPS répond en HTTPS (HTTP ${front.httpStatus}) mais en ${front.latencyMs} ms.`,
                gap: `Attendu : moins de ${SEUIL_DEGRADE_MS} ms. Une machine lente fait échouer les connexions au direct.`,
                evidence,
            };
        }
        return {
            status: 'vert',
            measured: `Le VPS répond en HTTPS (HTTP ${front.httpStatus}) en ${front.latencyMs} ms.`,
            evidence,
        };
    },

    'vps.signalisation': ({ vps }) => {
        if (!vps) throw new Error("La sonde du VPS n'a pas été exécutée.");
        if (!vps.configured) throw new Error("Aucune configuration de transport active : la porte /rtc ne peut pas être sondée.");
        const rtc = vps.rtc;
        if (!rtc) throw new Error("Le jeton de sonde n'a pas pu être signé : la porte /rtc n'a pas été observée.");
        const evidence = { httpStatus: rtc.httpStatus, latencyMs: rtc.latencyMs };
        if (!rtc.reached) {
            return {
                status: 'rouge',
                measured: rtc.timedOut
                    ? `La porte /rtc ne répond pas dans le délai (${rtc.latencyMs} ms).`
                    : "La porte /rtc est injoignable (erreur réseau ou certificat).",
                gap: "Les appareils ne peuvent pas ouvrir de direct ni d'appel.",
                evidence,
            };
        }
        if (rtc.httpStatus === 200) {
            return {
                status: 'vert',
                measured: `La porte /rtc valide notre jeton en ${rtc.latencyMs} ms.`,
                evidence,
            };
        }
        if (rtc.httpStatus === 401 || rtc.httpStatus === 403) {
            return {
                status: 'rouge',
                measured: `La porte /rtc refuse notre jeton (HTTP ${rtc.httpStatus}).`,
                gap: "La clé du VPS et celle du coffre ont divergé : aucun appareil ne peut entrer.",
                evidence,
            };
        }
        return {
            status: 'rouge',
            measured: `La porte /rtc ne répond pas correctement (HTTP ${rtc.httpStatus}).`,
            gap: "Le relais nginx de /rtc ou le conteneur LiveKit est en défaut.",
            evidence,
        };
    },
};

/**
 * Applique tous les évaluateurs. Une sonde qui lève une exception produit une
 * ligne BLANCHE portant l'erreur — jamais un vert par défaut, jamais un rouge
 * qui ferait passer une panne de mesure pour une panne du système.
 */
export function evaluateAll(metrics: RawMetrics, ranAt = new Date().toISOString()): ProbeOutcome[] {
    return Object.entries(EVALUATORS).map(([lineId, evaluate]) => {
        try {
            const verdict = evaluate(metrics);
            return {
                lineId,
                status: verdict.status,
                proofLevel: 'reel' as ProofLevel,
                measured: verdict.measured,
                gap: verdict.gap,
                evidence: verdict.evidence,
                ranAt,
            };
        } catch (err) {
            return {
                lineId,
                status: 'blanc' as HealthStatus,
                proofLevel: 'non_eprouve' as ProofLevel,
                measured: "La sonde n'a pas pu conclure.",
                ranAt,
                probeError: err instanceof Error ? err.message : String(err),
            };
        }
    });
}

/** Identifiants couverts par une sonde serveur — sert au contrôle croisé. */
export function serverLineIds(): string[] {
    return Object.keys(EVALUATORS);
}
