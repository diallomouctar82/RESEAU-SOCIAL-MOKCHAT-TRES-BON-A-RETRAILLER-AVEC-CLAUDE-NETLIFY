// Tour de contrôle Vision Smart AI Core — MODÈLE PUR (types + raisonnement).
//
// Ce fichier n'importe RIEN : ni client de base, ni réseau. C'est ce qui
// permet à la page de prévisualisation publique d'afficher exactement le même
// raisonnement que la console d'administration sans embarquer le client
// Supabase ni porter la moindre session. La lecture réelle vit à côté, dans
// `aiCoreControlTower.ts`.
//
// Seconde règle : ne jamais présenter une absence de mesure comme un résultat.
// Quand une information n'est pas lisible depuis le navigateur — le jeton de
// service, le schéma des migrations — l'état renvoyé est `inconnu`, avec la
// raison. Un tableau de bord qui invente du vert est pire que pas de tableau
// de bord : l'inspection du 4 septembre a montré qu'AI Core paraissait branché
// alors qu'il n'orientait aucun agent.

export type EtatVerrou = 'ouvert' | 'ferme' | 'inconnu';
export type StatutGlobal = 'vert' | 'orange' | 'rouge' | 'inconnu';

/** D'où vient l'information affichée — jamais masqué à l'écran. */
export type Source = 'base' | 'depot' | 'hors-ligne' | 'indisponible';

export interface Verrou {
    numero: number;
    titre: string;
    etat: EtatVerrou;
    /** Ce qui a été mesuré, en clair. */
    detail: string;
    source: Source;
    /** Pourquoi ce n'est pas lisible, quand l'état est `inconnu`. */
    raisonInconnue?: string;
}

export interface DroitOutil {
    toolId: string;
    libelle: string;
    /** L'outil est-il ouvert POUR CET AGENT ? */
    accorde: boolean;
    /** L'interrupteur global du catalogue — un droit accordé ne sert à rien s'il est coupé. */
    outilActif: boolean;
}

export interface AgentTour {
    id: string;
    nom: string;
    estHumain: boolean;
    actif: boolean;
    /** Présent dans la table `agents` — un agent absent n'est pilotable par aucune console. */
    presentEnBase: boolean;
    droits: DroitOutil[];
    aAiCore: boolean;
}

export interface ManifesteDepot {
    genereLe: string;
    commit: string | null;
    commitDate: string | null;
    branche: string | null;
    verrou1_executeur: { present: boolean; enregistre: boolean; fichier: string };
    verrou5_identiteAgent: { appelsLlmTotal: number; appelsAvecAgentId: number; fichiers: string[] };
    journalisation: { agentIdEcrit: boolean; outilsEcrits: boolean };
    migrations: { dansLeDepot: number; migrationsEnBase: number; releveLe: string; methode: string };
    tests: { fichiersVitest: number; fichiersCouvrantAiCore: number; fichiersDeno: number };
}

export interface EtatTourDeControle {
    releveLe: string;
    statutGlobal: StatutGlobal;
    resumeGlobal: string;
    verrous: Verrou[];
    agents: AgentTour[];
    architecte: {
        /** L'identifiant utilisé par le code de l'Architecte. */
        identifiant: string;
        presentEnBase: boolean;
        aDesDroits: boolean;
        droits: string[];
        pilotableDepuisLaConsole: boolean;
    };
    appelsAiCore: {
        mesurable: boolean;
        nombre: number | null;
        raison: string;
    };
    journalisation: {
        colonneAgentId: EtatVerrou;
        colonneToolsUsed: EtatVerrou;
        codeEcritAgentId: boolean;
        codeEcritOutils: boolean;
    };
    tests: ManifesteDepot['tests'] & { couvreAiCore: boolean };
    coherence: {
        migrationsDepot: number;
        migrationsBase: number;
        alignees: boolean;
        releveLe: string;
        methode: string;
    };
    manifeste: ManifesteDepot | null;
    /** Points que cette console ne PEUT PAS voir, listés pour l'administrateur. */
    anglesMorts: string[];
    /** Erreurs de lecture rencontrées — affichées, jamais avalées. */
    erreurs: string[];
}

const IDENTIFIANT_ARCHITECTE = 'architecte';
const OUTIL_AI_CORE = 'search_ai_core_memory';

/** Ce que la tour de contrôle a réussi à lire. Séparé du calcul pour que la
 *  prévisualisation exerce EXACTEMENT la même logique qu'en production, à
 *  partir d'un instantané réel — et non une seconde implémentation qui
 *  divergerait au premier changement. */
export interface EntreesTourDeControle {
    manifeste: ManifesteDepot | null;
    outils: { id: string; display_name: string; is_enabled: boolean }[];
    droits: { agent_id: string; tool_id: string; is_enabled: boolean }[];
    agentsBase: { id: string; name: string; is_human: boolean; is_active: boolean }[];
    sondeAgentId: { etat: EtatVerrou; raison: string };
    sondeToolsUsed: { etat: EtatVerrou; raison: string };
    appelsAiCore: EtatTourDeControle['appelsAiCore'];
    /** Message d'échec par surface, quand la lecture n'a pas abouti. */
    echecs: { outils?: string; droits?: string; agents?: string };
    /** Horodatage du relevé — figé pour un instantané, `now` en direct. */
    releveLe?: string;
}

export function construireEtat(entrees: EntreesTourDeControle): EtatTourDeControle {
    const { manifeste, outils, droits, agentsBase, sondeAgentId, sondeToolsUsed, appelsAiCore, echecs } = entrees;
    const erreurs: string[] = [];
    const anglesMorts: string[] = [];

    if (echecs.outils) erreurs.push(`Catalogue d'outils illisible : ${echecs.outils}`);
    if (echecs.droits) erreurs.push(`Droits par agent illisibles : ${echecs.droits}`);
    if (echecs.agents) erreurs.push(`Catalogue d'agents illisible : ${echecs.agents}`);
    if (!manifeste) {
        erreurs.push("Manifeste du dépôt introuvable — les faits de code (exécuteur, identité d'agent, tests) ne sont pas mesurables.");
    }

    const outilParId = new Map(outils.map((o) => [o.id, o]));
    const outilAiCore = outilParId.get(OUTIL_AI_CORE);
    const droitsAiCore = droits.filter((d) => d.tool_id === OUTIL_AI_CORE && d.is_enabled);

    // ── Verrou 1 — exécuteur présent et enregistré (fait du dépôt) ───────────
    const v1: Verrou = manifeste
        ? {
            numero: 1,
            titre: 'Exécuteur déployé',
            etat: manifeste.verrou1_executeur.present && manifeste.verrou1_executeur.enregistre ? 'ouvert' : 'ferme',
            detail: manifeste.verrou1_executeur.present && manifeste.verrou1_executeur.enregistre
                ? `Présent et enregistré dans le registre d'outils (${manifeste.verrou1_executeur.fichier}).`
                : "L'exécuteur est absent du code ou n'est pas enregistré.",
            source: 'depot',
        }
        : {
            numero: 1, titre: 'Exécuteur déployé', etat: 'inconnu',
            detail: 'Non mesuré.', source: 'indisponible',
            raisonInconnue: 'Manifeste du dépôt indisponible.',
        };

    // ── Verrou 2 — interrupteur global du catalogue ──────────────────────────
    const v2: Verrou = echecs.outils
        ? {
            numero: 2, titre: 'Outil activé au catalogue', etat: 'inconnu',
            detail: 'Catalogue illisible.', source: 'indisponible',
            raisonInconnue: echecs.outils,
        }
        : !outilAiCore
            ? {
                numero: 2, titre: 'Outil activé au catalogue', etat: 'ferme',
                detail: `Aucune entrée « ${OUTIL_AI_CORE} » dans le catalogue ai_tools.`, source: 'base',
            }
            : {
                numero: 2, titre: 'Outil activé au catalogue', etat: outilAiCore.is_enabled ? 'ouvert' : 'ferme',
                detail: outilAiCore.is_enabled
                    ? 'Interrupteur global ouvert : l\'outil peut être proposé aux agents qui en ont le droit.'
                    : 'Interrupteur global fermé — aucun agent ne peut recevoir cet outil, quels que soient ses droits.',
                source: 'base',
            };

    // ── Verrou 3 — droits accordés ───────────────────────────────────────────
    const v3: Verrou = echecs.droits
        ? {
            numero: 3, titre: 'Droit accordé à un agent', etat: 'inconnu',
            detail: 'Droits illisibles.', source: 'indisponible',
            raisonInconnue: echecs.droits,
        }
        : {
            numero: 3, titre: 'Droit accordé à un agent', etat: droitsAiCore.length > 0 ? 'ouvert' : 'ferme',
            detail: droitsAiCore.length > 0
                ? `${droitsAiCore.length} agent(s) ont le droit : ${droitsAiCore.map((d) => d.agent_id).join(', ')}.`
                : 'Aucun agent ne détient ce droit. AI Core n\'oriente donc aucun agent.',
            source: 'base',
        };

    // ── Verrou 4 — jeton de service ──────────────────────────────────────────
    // Volontairement `inconnu` : un secret runtime de fonction Edge n'est pas
    // lisible depuis un navigateur, et il ne DOIT pas l'être. Le rendre visible
    // demanderait un mode `test` côté passerelle, qui n'existe pas encore.
    const v4: Verrou = {
        numero: 4,
        titre: 'Jeton de service AI Core',
        etat: 'inconnu',
        detail: 'AI_CORE_SERVICE_TOKEN est un secret serveur : sa présence ne se lit pas depuis la console.',
        source: 'indisponible',
        raisonInconnue: "Aucun mode de test AI Core n'existe côté passerelle. Tant qu'il n'est pas ajouté, ce verrou reste non éprouvé — jamais supposé vert.",
    };
    anglesMorts.push("Présence du jeton AI_CORE_SERVICE_TOKEN : invisible par conception (secret serveur).");

    // ── Verrou 5 — identité d'agent transmise ────────────────────────────────
    const v5: Verrou = manifeste
        ? (() => {
            const { appelsAvecAgentId, appelsLlmTotal } = manifeste.verrou5_identiteAgent;
            const part = appelsLlmTotal > 0 ? appelsAvecAgentId / appelsLlmTotal : 0;
            return {
                numero: 5,
                titre: "Identité d'agent transmise",
                // Un appel sans agentId ne reçoit AUCUN outil : sous 50 %, le
                // verrou est considéré fermé, pas « partiellement ouvert ».
                etat: appelsAvecAgentId === 0 ? 'ferme' : part >= 0.5 ? 'ouvert' : 'ferme',
                detail: `${appelsAvecAgentId} appel(s) IA sur ${appelsLlmTotal} transmettent un agentId. Les autres n'obtiennent aucun outil, AI Core compris.`,
                source: 'depot',
            } as Verrou;
        })()
        : {
            numero: 5, titre: "Identité d'agent transmise", etat: 'inconnu',
            detail: 'Non mesuré.', source: 'indisponible',
            raisonInconnue: 'Manifeste du dépôt indisponible.',
        };

    const verrous = [v1, v2, v3, v4, v5];

    // ── Agents et droits ─────────────────────────────────────────────────────
    // On part des agents de la BASE, puis on ajoute les identifiants qui
    // apparaissent dans les droits sans exister comme agent : ce sont
    // précisément les cas invisibles des consoles existantes.
    const idsEnBase = new Set(agentsBase.map((a) => a.id));
    const idsOrphelins = [...new Set(droits.map((d) => d.agent_id))].filter((id) => !idsEnBase.has(id));

    const construireDroits = (agentId: string): DroitOutil[] =>
        outils.map((outil) => {
            const ligne = droits.find((d) => d.agent_id === agentId && d.tool_id === outil.id);
            return {
                toolId: outil.id,
                libelle: outil.display_name,
                accorde: Boolean(ligne?.is_enabled),
                outilActif: outil.is_enabled,
            };
        });

    const agents: AgentTour[] = [
        ...agentsBase.map((a) => ({
            id: a.id,
            nom: a.name,
            estHumain: a.is_human,
            actif: a.is_active,
            presentEnBase: true,
            droits: construireDroits(a.id),
            aAiCore: droits.some((d) => d.agent_id === a.id && d.tool_id === OUTIL_AI_CORE && d.is_enabled),
        })),
        ...idsOrphelins.map((id) => ({
            id,
            nom: id === IDENTIFIANT_ARCHITECTE ? "L'Architecte" : id,
            estHumain: false,
            actif: true,
            presentEnBase: false,
            droits: construireDroits(id),
            aAiCore: droits.some((d) => d.agent_id === id && d.tool_id === OUTIL_AI_CORE && d.is_enabled),
        })),
    ];

    const droitsArchitecte = droits.filter((d) => d.agent_id === IDENTIFIANT_ARCHITECTE && d.is_enabled);
    const architectePresentEnBase = idsEnBase.has(IDENTIFIANT_ARCHITECTE);
    if (!architectePresentEnBase) {
        anglesMorts.push("L'Architecte n'est pas dans la table agents : aucune console ne peut lui ouvrir ou fermer un outil.");
    }

    // ── Appels AI Core détectés ──────────────────────────────────────────────
    // Le comptage lui-même est fait par l'appelant (il demande la base) ; ici on
    // se contente d'en tirer l'angle mort quand il n'a pas pu avoir lieu.
    if (!appelsAiCore.mesurable) {
        anglesMorts.push("Usage réel d'AI Core : non traçable tant que ai_call_log ne journalise pas les outils.");
    }

    // ── Statut global ────────────────────────────────────────────────────────
    const obligatoires = verrous.filter((v) => v.numero !== 4);
    const fermes = obligatoires.filter((v) => v.etat === 'ferme').length;
    const inconnus = verrous.filter((v) => v.etat === 'inconnu').length;

    let statutGlobal: StatutGlobal;
    let resumeGlobal: string;
    if (echecs.outils && echecs.droits) {
        statutGlobal = 'inconnu';
        resumeGlobal = "État non mesurable : la console n'a pas pu lire la base.";
    } else if (fermes > 0) {
        statutGlobal = 'rouge';
        resumeGlobal = droitsAiCore.length === 0
            ? `AI Core n'oriente aucun agent. ${fermes} verrou(x) fermé(s) sur 4 obligatoires.`
            : `${fermes} verrou(x) fermé(s) sur 4 obligatoires.`;
    } else if (inconnus > 0) {
        statutGlobal = 'orange';
        resumeGlobal = `Aucun verrou fermé, mais ${inconnus} reste(nt) non éprouvé(s) — pas de vert sans preuve.`;
    } else {
        statutGlobal = 'vert';
        resumeGlobal = 'Les cinq verrous sont ouverts et mesurés.';
    }

    const migrationsDepot = manifeste?.migrations.dansLeDepot ?? 0;
    const migrationsBase = manifeste?.migrations.migrationsEnBase ?? 0;
    anglesMorts.push("Nombre de migrations en base : le schéma supabase_migrations n'est pas exposé à l'API REST — valeur relevée hors ligne, pas en direct.");

    return {
        releveLe: entrees.releveLe ?? new Date().toISOString(),
        statutGlobal,
        resumeGlobal,
        verrous,
        agents,
        architecte: {
            identifiant: IDENTIFIANT_ARCHITECTE,
            presentEnBase: architectePresentEnBase,
            aDesDroits: droitsArchitecte.length > 0,
            droits: droitsArchitecte.map((d) => d.tool_id),
            pilotableDepuisLaConsole: architectePresentEnBase,
        },
        appelsAiCore,
        journalisation: {
            colonneAgentId: sondeAgentId.etat,
            colonneToolsUsed: sondeToolsUsed.etat,
            codeEcritAgentId: manifeste?.journalisation.agentIdEcrit ?? false,
            codeEcritOutils: manifeste?.journalisation.outilsEcrits ?? false,
        },
        tests: {
            fichiersVitest: manifeste?.tests.fichiersVitest ?? 0,
            fichiersCouvrantAiCore: manifeste?.tests.fichiersCouvrantAiCore ?? 0,
            fichiersDeno: manifeste?.tests.fichiersDeno ?? 0,
            couvreAiCore: (manifeste?.tests.fichiersCouvrantAiCore ?? 0) > 0,
        },
        coherence: {
            migrationsDepot,
            migrationsBase,
            alignees: migrationsDepot === migrationsBase && migrationsBase > 0,
            releveLe: manifeste?.migrations.releveLe ?? '—',
            methode: manifeste?.migrations.methode ?? '—',
        },
        manifeste,
        anglesMorts,
        erreurs,
    };
}

