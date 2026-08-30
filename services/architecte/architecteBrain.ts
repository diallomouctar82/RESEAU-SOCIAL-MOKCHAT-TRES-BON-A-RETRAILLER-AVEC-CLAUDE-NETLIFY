import { generateJSON } from '../aiGateway';
import { describeCapabilitiesForHumans, getCapability } from './capabilityRegistry';
import { executeCapability, listExecutableCapabilities } from './capabilityBus';
import { addSessionTurn, buildSessionContext, sessionHasImage } from './architecteSession';

/**
 * Cerveau unique de l'Architecte.
 *
 * Extrait tel quel de `components/DialloOS.tsx` (aucun changement de
 * comportement) au moment où une SECONDE incarnation est apparue : la barre
 * flottante vocale (`components/architecte/ArchitecteFloatingBar.tsx`),
 * reproduite d'après l'Architecte historique du dépôt
 * `ARCHITECTE-BON-INSPIRATION-POUR-MOKNET-2026`.
 *
 * Sans cette extraction, la même logique (prompt, garde-fous
 * anti-hallucination, confirmation proportionnelle au risque, statuts
 * d'exécution) aurait existé en double, avec la certitude de diverger — ce
 * que la règle transversale de la mission interdit explicitement : « UNE
 * CAPACITÉ, UN REGISTRE, PLUSIEURS INTERFACES ». Le modal (saisie clavier) et
 * la barre flottante (voix) sont deux incarnations, jamais deux cerveaux.
 */

export type ArchitecteActionType = 'NAVIGATE' | 'NOTIFICATION' | 'EXECUTE';

export interface ArchitecteAction {
    type: ArchitecteActionType;
    /** Pour NAVIGATE : identifiant de module. Pour EXECUTE : conservé pour `create_dossier` (cas historique). */
    target?: string;
    /** Pour EXECUTE : identifiant de capacité du registre plateforme (ex. `task.item.create`). */
    capabilityId?: string;
    payload?: any;
    explanation: string;
}

/** Phases d'exécution affichables — mêmes valeurs que celles déjà utilisées par le modal. */
export type ArchitectePhase = 'running' | 'done' | 'queued' | 'failed' | 'denied' | 'unsupported' | 'cancelled';

export interface ArchitecteOutcome {
    /** Réponse parlée/affichée de l'Architecte (« explanation » du modèle, ou le résumé de découverte). */
    spoken: string;
    /** Action retenue, absente si la commande a été traitée sans appel au modèle (découverte). */
    action?: ArchitecteAction;
    /** État réel de l'exécution, absent pour une simple navigation ou une découverte. */
    execution?: { phase: ArchitectePhase; message: string };
    /** Vrai uniquement pour la découverte, traitée sans appel au modèle. */
    handledLocally?: boolean;
}

/**
 * Formulations volontairement multi-mots : un simple « aide » aurait
 * intercepté de vraies commandes de navigation contenant ce mot
 * (ex. « aide-moi à trouver un emploi »).
 */
export const DISCOVERY_PHRASES = [
    'que peux-tu faire',
    "qu'est-ce que tu peux faire",
    "qu'est ce que tu peux faire",
    'quelles sont tes capacités',
    'que sais-tu faire',
    "qu'est-ce que tu sais faire",
];

export function isDiscoveryCommand(command: string): boolean {
    const normalized = command.trim().toLowerCase();
    return DISCOVERY_PHRASES.some((phrase) => normalized.includes(phrase));
}

/**
 * La question porte-t-elle sur ce que l'Architecte « voit » ?
 *
 * Détection délibérément DÉTERMINISTE (pas un appel au modèle) : c'est le
 * garde-fou contre l'hallucination visuelle constatée en usage réel —
 * l'Architecte a affirmé voir une montre alors qu'aucune image n'était
 * disponible. Une question de vision est routée vers la VRAIE analyse
 * d'image quand une image existe dans la session, et vers un aveu honnête
 * (« je ne dispose d'aucune image ») quand il n'y en a pas — jamais vers un
 * modèle texte libre d'inventer un contenu visuel.
 */
const VISION_QUESTION_PATTERNS: RegExp[] = [
    /\bque?\s+vois[\s-]?tu\b/i,
    /\bqu'est[\s-]?ce que tu vois\b/i,
    /\btu vois quoi\b/i,
    /\bdécris (cette |l'|la |ce que tu vois)/i,
    /\bsur (cette|la) (photo|image|capture)\b/i,
    /\bregarde\b/i,
    /\banalyse (cette|la|l')\s*(photo|image|capture)/i,
];

export function isVisionQuestion(command: string): boolean {
    return VISION_QUESTION_PATTERNS.some((p) => p.test(command));
}

/**
 * Identité d'agent de l'Architecte auprès de l'orchestrateur `ai-gateway`.
 *
 * La recherche web RÉELLE existe côté serveur depuis l'origine de
 * l'orchestrateur (`tools/web_search.ts` — grounding Gemini, sources citées,
 * échec honnête si aucun fournisseur actif) : elle s'active par le système
 * de droits existant (`ai_tools` × `agent_tool_grants`), jamais par un
 * second mécanisme. La migration `architecte_web_search_grant` donne ce
 * droit à cet identifiant.
 */
export const ARCHITECTE_AGENT_ID = 'architecte';

const WEB_SEARCH_PATTERNS: RegExp[] = [
    /cherche\w* sur (internet|le web|le net|google)/i,
    /recherche\w* sur (internet|le web|le net)/i,
    /regarde sur (internet|le web)/i,
    /\bsur internet\b/i,
    /derni[èe]res (actualit[ée]s|nouvelles|infos)/i,
    /actualit[ée]s? (du jour|r[ée]centes?)/i,
];

/** La personne demande-t-elle explicitement une recherche sur Internet ? Détection déterministe. */
export function isWebSearchCommand(command: string): boolean {
    return WEB_SEARCH_PATTERNS.some((p) => p.test(command));
}

// ─────────────────────────────────────────────────────────────────────────
// COMPORTEMENT HUMAIN DE L'ARCHITECTE (Boucle 1)
// « Ce n'est pas l'utilisateur qui doit apprendre à utiliser l'Architecte.
//   C'est l'Architecte qui doit comprendre l'utilisateur et l'accompagner. »
// Une seule identité, une seule personnalité, une seule continuité — et les
// réponses identitaires sont DÉTERMINISTES : qui est l'Architecte ne dépend
// jamais de l'humeur d'un modèle.
// ─────────────────────────────────────────────────────────────────────────

const IDENTITY_PATTERNS: RegExp[] = [
    /\bqui es[\s-]?tu\b/i,
    /\bt'es qui\b/i,
    /\btu es qui\b/i,
    /\bcomment (tu )?t'appelles/i,
    /\bpr[ée]sente[\s-]?toi\b/i,
    /\bc'est quoi l'architecte\b/i,
    /\bqui est l'architecte\b/i,
];

/** « Qui es-tu ? » — détection déterministe. */
export function isIdentityQuestion(command: string): boolean {
    return IDENTITY_PATTERNS.some((p) => p.test(command));
}

/** Présentation stable de l'Architecte — la même, toujours, quel que soit le modèle. */
export function describeArchitecteIdentity(callName?: string): string {
    return (
        "Je suis L'Architecte — votre guide dans Le Monde à Vous. " +
        "Vous n'avez rien à apprendre ici : dites-moi ce que vous voulez accomplir, " +
        "je vous montre le chemin et je peux agir pour vous. " +
        `Alors${callName ? `, ${callName}` : ''} : qu'aimeriez-vous faire ?`
    );
}

/**
 * L'accueil : c'est l'Architecte qui va vers la personne, jamais l'inverse.
 *
 * Le marqueur nouveau/connu est la fiche de consentement
 * (`privacy_settings.architecte`) : absente = première rencontre → accueil
 * complet qui se présente ET propose la configuration ; présente = personne
 * connue → accueil léger avec son nom choisi, sans jamais refaire
 * l'onboarding. Les deux textes sont courts : faits pour être DITS, pas lus.
 */
export function buildArchitecteGreeting(
    consent: { callName?: string } | null | undefined,
    userName: string
): { text: string; firstMeeting: boolean } {
    if (!consent?.callName) {
        return {
            firstMeeting: true,
            text:
                "Bonjour, et bienvenue ! Je suis L'Architecte, votre guide ici. " +
                "Dites-moi simplement ce que vous aimeriez faire — je m'occupe du chemin. " +
                "Voulez-vous d'abord régler comment je m'adresse à vous ? Dites oui, ou lancez-vous.",
        };
    }
    return {
        firstMeeting: false,
        text: `Bonjour ${consent.callName || userName}. Que puis-je faire pour vous aujourd'hui ?`,
    };
}

/**
 * Besoin flou exprimé tel quel (« je ne sais pas trop », « aucune idée ») :
 * stratégie de clarification STABLE (complément Équipe A §6) — la phrase
 * brute n'est jamais envoyée seule au modèle en espérant une réponse
 * heureuse. Volontairement borné aux énoncés qui ne contiennent RIEN
 * d'autre : « je ne sais pas comment faire un CV » a un sujet, il part au
 * cerveau normalement.
 */
const VAGUE_NEED_PATTERNS: RegExp[] = [
    /^je (ne )?sais pas( trop| vraiment)?[\s.,!…]*$/i,
    /^je (ne )?sais pas( trop| vraiment)? (quoi faire|ce que je veux|par o[ùu] commencer)[\s.,!…]*$/i,
    /^(aucune |pas d')id[ée]e[\s.,!…]*$/i,
    /^j'h[ée]site[\s.,!…]*$/i,
];

export function isVagueNeed(text: string): boolean {
    const t = text.trim();
    if (t.length > 60) return false;
    return VAGUE_NEED_PATTERNS.some((p) => p.test(t));
}

/** UNE question douce qui débloque, par grandes familles — jamais vingt possibilités d'un coup. */
export function buildVagueNeedReply(callName?: string): string {
    return (
        `Aucun problème${callName ? `, ${callName}` : ''}. ` +
        "Qu'est-ce qui vous occupe le plus en ce moment : travailler sur quelque chose, apprendre, " +
        "communiquer avec quelqu'un, créer, ou organiser quelque chose ? On part de là, tranquillement."
    );
}

/**
 * Un « oui » court en réponse à une proposition de l'Architecte.
 * Volontairement borné aux réponses BRÈVES : « oui, je veux voyager » est une
 * commande, pas une acceptation de l'offre en cours.
 */
export function isAffirmativeReply(text: string): boolean {
    return /^(oui|ouais|d'accord|daccord|ok|volontiers|avec plaisir|je veux bien|vas[\s-]?y|allons[\s-]?y|pourquoi pas)[\s.,!]*$/i.test(text.trim());
}

/** Modules de navigation connus — repris à l'identique du prompt d'origine. */
const NAVIGATION_MODULES = `            - 'home' (Dashboard)
            - 'social' (Réseau, Feed)
            - 'world' (Mobilité, Visas, Simulation voyage)
            - 'career' (Emploi, CV, Recrutement)
            - 'campus' (Formation, Cours)
            - 'wallet' (Banque, Transfert)
            - 'legal' (Juridique, Documents)
            - 'health' (Santé, SOS)
            - 'housing' (Logement)
            - 'chat' (Experts IA)
            - 'live' (Appel direct)
            - 'studio' (Création contenu)`;

export function buildArchitecteSystemPrompt(userName: string, userLevel: number | string, callName?: string): string {
    // Catalogue construit à l'instant T à partir des handlers RÉELLEMENT
    // enregistrés — pas les 42 capacités théoriques du registre. Le modèle ne
    // peut donc pas proposer une action qui échouerait aussitôt faute d'écran
    // ouvert : ce qui est offert est ce qui est faisable, ici et maintenant.
    const executable = listExecutableCapabilities();
    const executableCatalogue = executable.length > 0
        ? executable.map((c) => `            - capabilityId: "${c.id}" — ${c.description}`).join('\n')
        : '            (aucune capacité exécutable dans le contexte actuel — n\'utilise pas "capabilityId")';

    // Contexte de session : le fil récent (texte, images montrées, documents
    // fournis), borné — jamais tout l'historique dans chaque requête.
    const sessionContext = buildSessionContext();
    const visionTruth = sessionHasImage()
        ? "Une ou plusieurs images ont été montrées dans cette session (voir le contexte) — mais TOI, tu n'as pas accès à leurs pixels ici : ne décris jamais leur contenu de mémoire."
        : "AUCUNE image n'a été montrée dans cette session : si l'on te demande ce que tu « vois », réponds honnêtement que tu ne disposes d'aucune image — n'invente JAMAIS un contenu visuel.";

    return `Tu es L'ARCHITECTE, le guide personnel de l'application 'Le Monde à Vous' (MokNet).
            UNE SEULE IDENTITÉ : tu es L'Architecte, toujours — jamais « Diallo OS », jamais un « expert », jamais une autre personnalité.
            L'utilisateur est : ${userName}, Niveau ${userLevel}.${callName ? `
            La personne souhaite qu'on l'appelle « ${callName} » : utilise ce nom, et ne le redemande jamais.` : ''}

            RÈGLES DE CONDUITE (aussi importantes que le routage) :
            - Tu es un guide chaleureux et compétent, pas une machine à commandes. Français naturel, phrases courtes faites pour être DITES à voix haute. Ni robotique, ni théâtral.
            - ADAPTE ton rythme au fil des échanges (le contexte récent te montre comment la personne s'exprime) : pressé ou très direct → réponse courte, action immédiate ; hésitant ou débutant → plus d'accompagnement, une étape à la fois ; expert → pas d'explications élémentaires ; bavard → laisse-lui la place et réponds à l'essentiel. Jamais de diagnostic psychologique : tu t'ajustes à la conversation, pas à un jugement sur la personne.
            - Accorde ton ton au contexte : sobre quand la personne est concentrée, chaleureux quand elle est enthousiaste, rassurant quand elle hésite — sans surjouer, et sans jamais prétendre ressentir des émotions humaines.
            - PAROLE VIVANTE (tes réponses sont dites à voix haute par une synthèse) : construis-les pour l'oreille, pas pour la page. Phrases courtes, une idée par phrase, ponctuation naturelle qui rythme la respiration (virgule = micro-pause, point = pause, question = intonation). Jamais une longue énumération récitée : deux ou trois éléments reliés naturellement (« d'abord... ensuite... »), le reste à l'écrit si nécessaire. Jamais de « euh », de bégaiement ou d'hésitation fabriqués — le naturel vient du rythme et de la formulation, pas d'une imitation.
            - BESOIN FLOU (« je ne sais pas », « je veux voir ce que je peux faire », « j'aimerais améliorer quelque chose ») : ne force jamais une commande parfaite et ne navigue pas au hasard. Réponds { "type": "NOTIFICATION" } avec UNE question douce qui débloque, en proposant les grandes familles : apprendre, travailler, communiquer, créer, ou organiser quelque chose.
            - PRODUCTION ÉCRITE (« écris-moi une lettre », « prépare mon CV », « fais-moi une liste », « rédige... ») : réponds { "type": "NOTIFICATION" } et mets la PRODUCTION COMPLÈTE demandée dans "explanation" — le texte final lui-même, pas un résumé ni une promesse du genre « je vais la préparer ». L'interface affiche automatiquement le texte long ; toi, tu livres le contenu.
            - OUTILS AU BON MOMENT : si la demande gagnerait à MONTRER quelque chose (un problème visible sur un objet → propose la caméra : « Montrez-le-moi, je peux ouvrir la caméra si vous voulez » ; un document à vérifier comme un CV → propose le bouton Fichier : « Envoyez-le-moi et je le regarde avec vous »), propose-le dans "explanation" — n'impose jamais un outil que la tâche n'exige pas.
            - Ne récite jamais spontanément la liste complète de tes capacités, et ne pousse pas de suggestions non sollicitées.
${sessionContext ? `
            Contexte récent de la conversation (pour comprendre les références comme « lui », « ce document », « cette image », « continue ») :
${sessionContext}
` : ''}
            Vérité visuelle : ${visionTruth}

            Ta mission : Analyser la demande de l'utilisateur et déterminer l'action UI à effectuer dans l'application.

            Deux principes de lecture, avant de choisir :

            1) COMPRENDS L'INTENTION, PAS SEULEMENT LES MOTS. Une personne
               décrit rarement le module dont elle a besoin — elle décrit sa
               situation. « Mon bail se termine dans deux mois » est une
               demande de logement, pas une remarque. « On me propose un poste
               à Montréal » touche la carrière ET la mobilité. Va au besoin réel
               derrière la phrase, sans jamais inventer un détail que la
               personne n'a pas donné.

            2) FAIS LES LIENS ENTRE LES SERVICES. Les modules de MokNet ne sont
               pas cloisonnés : un projet d'expatriation touche la mobilité, le
               logement, l'administratif et parfois la formation. Choisis le
               module le plus utile MAINTENANT, et mentionne brièvement dans
               "explanation" la suite naturelle quand elle est évidente — sans
               noyer la personne : une seule suite, jamais une liste.

            Les modules disponibles (target) sont :
${NAVIGATION_MODULES}

            Réponds UNIQUEMENT en JSON strict au format suivant :
            {
                "type": "NAVIGATE",
                "target": "id_du_module",
                "explanation": "Court texte futuriste expliquant l'action (ex: 'Initialisation du protocole de recherche de logement...')",
                "payload": { "searchQuery": "..." } // Optionnel, données contextuelles
            }

            Exemple User: "Je veux partir travailler au Canada"
            Réponse JSON: { "type": "NAVIGATE", "target": "world", "explanation": "Activation du simulateur de mobilité vers le Canada.", "payload": { "country": "Canada", "intent": "work" } }

            Tu peux aussi déclencher une action RÉELLE (écriture réelle, jamais une simulation) avec le type "EXECUTE".

            1) Cas particulier, avec "target" :
            - target: "create_dossier" — ouvre un vrai dossier de suivi pour la personne.
              payload attendu : { "titre": "Titre court et explicite", "categorie": "emploi|logement|sante|juridique|education|voyage|administration", "description": "Objectif en une phrase (optionnel)" }
              N'utilise "create_dossier" QUE si la personne demande explicitement d'ouvrir, créer ou démarrer un dossier/suivi pour sa démarche (ex: "ouvre-moi un dossier pour chercher un emploi au Canada"). Dans le doute, préfère "NAVIGATE".

            Exemple User: "Ouvre-moi un dossier pour chercher un emploi au Canada"
            Réponse JSON: { "type": "EXECUTE", "target": "create_dossier", "explanation": "Ouverture d'un dossier de suivi pour votre recherche d'emploi au Canada.", "payload": { "titre": "Recherche d'emploi au Canada", "categorie": "emploi", "description": "Trouver un emploi et préparer les démarches d'installation au Canada." } }

            2) Capacités enregistrées, avec "capabilityId" (JAMAIS "target") :
${executableCatalogue}

            Règles absolues pour "capabilityId" :
            - N'utilise QUE l'un des identifiants listés ci-dessus, copié à l'identique. N'en invente jamais un autre, même s'il te semble logique : un identifiant absent de cette liste sera refusé.
            - Si la demande ne correspond à aucun identifiant listé, n'utilise PAS "EXECUTE" — préfère "NAVIGATE" vers le module concerné.
            - N'invente jamais un titre de tâche existante, ni une date : si la personne n'a pas énoncé d'échéance, omets simplement dueAt.
            - Date et heure actuelles (ISO 8601) pour convertir toute date relative : ${new Date().toISOString()}

            Exemple User: "Rappelle-moi d'appeler le notaire demain"
            Réponse JSON: { "type": "EXECUTE", "capabilityId": "task.item.create", "explanation": "Création de la tâche.", "payload": { "task": { "title": "Appeler le notaire", "dueAt": "<date ISO de demain>" } } }
            `;
}

export interface RunArchitecteOptions {
    userName: string;
    userLevel: number | string;
    /** Nom choisi dans la fiche de consentement — mémoire de la relation (§22) : jamais redemandé. */
    callName?: string;
    /**
     * Demande de confirmation, posée AVANT toute écriture. Fournie par
     * l'interface appelante, qui seule sait comment la formuler dans son
     * contexte (dialogue natif pour le modal, dialogue explicite pour la
     * barre vocale). Renvoyer `false` annule sans rien modifier.
     */
    confirm: (message: string) => Promise<boolean> | boolean;
    /** Exécution du cas historique `create_dossier`, portée par l'appelant (écriture directe hors bus). */
    runLegacyTarget?: (target: string, payload: any) => Promise<{ ok: boolean; message: string }>;
    /** Notifié dès que la phase change, pour afficher l'avancement réel plutôt qu'un spinner générique. */
    onPhase?: (phase: ArchitectePhase, message: string) => void;
}

/**
 * Interprète UNE commande et l'exécute réellement.
 *
 * Ne renvoie jamais un succès qui n'a pas eu lieu : le statut porté par
 * `execution` est celui réellement renvoyé par le bus de capacités
 * (`done`/`failed`/`denied`/`unavailable`), jamais une confirmation
 * anticipée.
 */
export async function runArchitecteCommand(
    command: string,
    options: RunArchitecteOptions
): Promise<ArchitecteOutcome> {
    const trimmed = command.trim();
    if (!trimmed) {
        return { spoken: '', handledLocally: true };
    }

    // Historique de session unique : le cerveau est le point de passage des
    // deux incarnations (barre vocale, clavier) — enregistrer ICI garantit
    // « 1 historique » sans double écriture nulle part.
    addSessionTurn({ role: 'utilisateur', kind: 'texte', text: trimmed });
    const outcome = await interpretAndExecute(trimmed, options);
    const reply = outcome.execution?.message || outcome.spoken;
    if (reply) addSessionTurn({ role: 'architecte', kind: 'texte', text: reply });
    return outcome;
}

async function interpretAndExecute(
    trimmed: string,
    options: RunArchitecteOptions
): Promise<ArchitecteOutcome> {

    // Découverte : traitée SANS appel au modèle, directement depuis le
    // registre — la réponse ne peut donc jamais contenir une capacité
    // inventée.
    if (isDiscoveryCommand(trimmed)) {
        return { spoken: describeCapabilitiesForHumans(), handledLocally: true };
    }

    // Identité : réponse stable et déterministe — qui est l'Architecte ne
    // dépend jamais d'un modèle (cohérence d'identité, Boucle 1 §13).
    if (isIdentityQuestion(trimmed)) {
        return { spoken: describeArchitecteIdentity(options.callName), handledLocally: true };
    }

    // Besoin flou pur (« je ne sais pas trop ») : clarification stable par
    // grandes familles — le modèle reste le chemin des formulations plus
    // riches, encadré par la directive BESOIN FLOU du prompt.
    if (isVagueNeed(trimmed)) {
        return { spoken: buildVagueNeedReply(options.callName), handledLocally: true };
    }

    const systemPrompt = buildArchitecteSystemPrompt(options.userName, options.userLevel, options.callName);
    const action = (await generateJSON<ArchitecteAction>(`Commande utilisateur : "${trimmed}"`, {
        systemInstruction: systemPrompt,
    })) || ({} as ArchitecteAction);

    if (action.type !== 'EXECUTE') {
        return { spoken: action.explanation, action };
    }

    // ── Chemin historique : dossier de suivi, écrit directement par l'appelant.
    if (action.target && options.runLegacyTarget) {
        options.onPhase?.('running', 'Ouverture du dossier en cours...');
        const outcome = await options.runLegacyTarget(action.target, action.payload || {});
        const phase: ArchitectePhase = outcome.ok === true ? 'done' : 'failed';
        return { spoken: action.explanation, action, execution: { phase, message: outcome.message } };
    }

    // ── Chemin général : registre de capacités + bus d'exécution.
    if (action.capabilityId) {
        const capability = getCapability(action.capabilityId);

        // Confirmation proportionnelle au risque, AVANT toute écriture —
        // jamais contournable, même si le modèle a formulé la demande comme
        // une évidence (« la sécurité reste supérieure à la préférence »).
        if (capability?.confirmationRequired) {
            const confirmed = await options.confirm(
                `${capability.description}\n\nCette action est ${capability.riskLevel === 'high' ? 'sensible' : 'à confirmer'}. Voulez-vous que je la fasse ?`
            );
            if (!confirmed) {
                const message = "Action annulée — rien n'a été modifié.";
                options.onPhase?.('cancelled', message);
                return { spoken: action.explanation, action, execution: { phase: 'cancelled', message } };
            }
        }

        options.onPhase?.('running', 'Exécution en cours...');
        const outcome = await executeCapability(action.capabilityId, action.payload || {});
        const phase: ArchitectePhase =
            outcome.status === 'done' ? 'done'
            // Hors-ligne : l'action attend dans la file de synchronisation.
            // Ni « terminé » ni « échoué » — l'Architecte doit dire exactement
            // ce qui s'est passé.
            : outcome.status === 'queued' ? 'queued'
            : outcome.status === 'denied' ? 'denied'
            : outcome.status === 'failed' ? 'failed'
            : 'unsupported';
        return { spoken: action.explanation, action, execution: { phase, message: outcome.message } };
    }

    // Le modèle a demandé une exécution sans désigner de capacité réelle :
    // on le dit, on n'invente rien.
    const message = "Je n'ai pas identifié d'action réelle correspondante — reformulez, ou dites-moi où vous voulez aller.";
    return { spoken: action.explanation, action, execution: { phase: 'unsupported', message } };
}
