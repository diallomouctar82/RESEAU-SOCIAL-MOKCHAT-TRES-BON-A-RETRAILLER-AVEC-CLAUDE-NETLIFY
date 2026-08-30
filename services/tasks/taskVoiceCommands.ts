import { generateJSON } from '../aiGateway';

/**
 * Architecte — moteur de tâches (LOOP 15/17, mission Architecte MOCnet —
 * tâches/agenda/planification : orchestration & automatisation). Même
 * patron que services/social/socialVoiceCommands.ts,
 * services/content/contentVoiceCommands.ts et services/live/liveVoiceCommands.ts :
 * interprétation en langage naturel via generateJSON, exécution 100%
 * déterministe côté client (jamais le LLM n'écrit en base) — le LLM extrait
 * seulement l'intention et les libellés tels qu'énoncés (titre de tâche,
 * date relative), la résolution vers une vraie ligne `tasks` et l'appel
 * réel à services/supabaseClient.ts restent du code déterministe, à câbler
 * par le futur écran qui hébergera ce registre (aucune UI Tâches n'existe
 * encore — voir docs/SUPABASE_ARCHITECTURE.md, ligne Tâches, LOOP 14-15/17).
 *
 * CREATE_MULTIPLE_TASKS est la réponse volontairement minimale à "commandes
 * composées décomposées en plan explicite" : une seule commande peut créer
 * plusieurs tâches d'un coup (ex. "crée 3 tâches : rédiger le brief, le
 * relire, le publier"), chacune restant une simple création (risque faible,
 * réversible) — un moteur d'automatisation conditionnelle générique avec
 * approbation humaine pour les déclencheurs de jugement humain est hors
 * périmètre de cette LOOP. La SEULE automatisation conditionnelle réellement
 * livrée cette LOOP n'apparaît pas dans ce registre car elle n'est jamais
 * déclenchable par une commande vocale : `generate_recurring_task_instances()`
 * (pg_cron, 5 min, côté base) engendre la prochaine occurrence d'une tâche
 * récurrente dès qu'elle passe à 'completed' — déclencheur structuré, jamais
 * un jugement humain, donc aucune approbation supplémentaire requise. Voir
 * docs/SUPABASE_ARCHITECTURE.md, ligne Tâches.
 */

export type TaskVoiceActionType =
    | 'CREATE_TASK'
    | 'CREATE_RECURRING_TASK'
    | 'CREATE_MULTIPLE_TASKS'
    | 'COMPLETE_TASK'
    | 'RESCHEDULE_TASK'
    | 'ADD_DEPENDENCY'
    | 'DELETE_TASK'
    | 'DISCOVER_CAPABILITIES'
    | 'ASK_CLARIFICATION'
    | 'UNKNOWN';

export interface TaskVoiceSingleTask {
    title: string;
    description?: string;
    priority?: 'low' | 'medium' | 'high';
    /** ISO 8601 complet — calculé par le LLM à partir de `context.nowIso` pour une date relative non ambiguë ("demain", "vendredi"). Absent si aucune échéance n'a été énoncée (une tâche sans échéance est valide). */
    dueAt?: string;
    recurrenceRule?: 'daily' | 'weekly' | 'monthly';
}

export interface TaskVoiceAction {
    type: TaskVoiceActionType;
    payload?: {
        task?: TaskVoiceSingleTask;
        tasks?: TaskVoiceSingleTask[];
        /** Titre tel qu'énoncé par l'utilisateur pour désigner une tâche EXISTANTE — jamais un id, la résolution vers une vraie ligne se fait côté client parmi context.visibleTaskTitles. */
        taskTitle?: string;
        dependsOnTaskTitle?: string;
        newDueAt?: string;
        question?: string;
    };
    /** Toujours une phrase courte à dire à voix haute — jamais vide, même pour UNKNOWN. */
    spokenConfirmation: string;
}

export interface TaskVoiceCommandContext {
    /** Horodatage ISO courant — indispensable pour convertir une date relative ("demain", "dans 3 jours") en date absolue sans jamais deviner "maintenant" côté LLM. */
    nowIso: string;
    /** Titres des tâches déjà visibles/chargées côté client — sert à mieux résoudre un titre approximatif pour COMPLETE_TASK/RESCHEDULE_TASK/ADD_DEPENDENCY/DELETE_TASK, jamais une liste exhaustive garantie complète. */
    visibleTaskTitles: string[];
}

export type TaskVoiceRiskLevel = 'low' | 'moderate';

export interface TaskVoiceCapability {
    id: string;
    actionType: TaskVoiceActionType;
    description: string;
    riskLevel: TaskVoiceRiskLevel;
}

/**
 * Registre de capacités du moteur de tâches (même convention que
 * SOCIAL_VOICE_CAPABILITIES/CONTENT_VOICE_CAPABILITIES/LIVE_VOICE_CAPABILITIES :
 * id = domaine.objet.verbe). DELETE_TASK est 'moderate' — seule action
 * destructive du domaine, une confirmation explicite reste exigée côté
 * futur dispatch, jamais exécutée silencieusement.
 */
export const TASK_VOICE_CAPABILITIES: TaskVoiceCapability[] = [
    { id: 'task.item.create', actionType: 'CREATE_TASK', description: 'créer une seule tâche personnelle, payload.task = { title, description?, priority?, dueAt? }', riskLevel: 'low' },
    { id: 'task.item.create_recurring', actionType: 'CREATE_RECURRING_TASK', description: 'créer une tâche récurrente (quotidienne/hebdomadaire/mensuelle), payload.task inclut recurrenceRule', riskLevel: 'low' },
    { id: 'task.item.create_multiple', actionType: 'CREATE_MULTIPLE_TASKS', description: 'créer plusieurs tâches en une seule commande (commande composée), payload.tasks = liste', riskLevel: 'low' },
    { id: 'task.item.complete', actionType: 'COMPLETE_TASK', description: 'marquer une tâche existante nommée comme terminée, payload.taskTitle', riskLevel: 'low' },
    { id: 'task.item.reschedule', actionType: 'RESCHEDULE_TASK', description: "changer la date d'échéance d'une tâche existante nommée, payload.taskTitle + payload.newDueAt", riskLevel: 'low' },
    { id: 'task.item.add_dependency', actionType: 'ADD_DEPENDENCY', description: "indiquer qu'une tâche existante nommée dépend d'une autre tâche existante nommée, payload.taskTitle + payload.dependsOnTaskTitle", riskLevel: 'low' },
    { id: 'task.item.delete', actionType: 'DELETE_TASK', description: 'supprimer définitivement une tâche existante nommée, payload.taskTitle — action destructive', riskLevel: 'moderate' },
];

function buildSystemInstruction(ctx: TaskVoiceCommandContext): string {
    const actionsList = TASK_VOICE_CAPABILITIES.map((c) => `- ${c.actionType} : ${c.description}`).join('\n');
    const titlesHint = ctx.visibleTaskTitles.length > 0
        ? `Tâches actuellement visibles côté utilisateur (aide à résoudre un titre approximatif — ce n'est PAS forcément la liste complète) : ${ctx.visibleTaskTitles.join(', ')}.`
        : `Aucune tâche visible côté utilisateur actuellement.`;
    return `Tu es l'assistant de tâches personnelles de Le Monde à Vous (MokNet).
Date et heure actuelles (ISO 8601, à utiliser pour convertir toute date relative en date absolue) : ${ctx.nowIso}.
Ta mission : transformer UNE commande vocale en UNE action JSON strictement parmi la liste ci-dessous. Ne jamais inventer un type d'action hors de cette liste. Tu n'exécutes jamais l'action toi-même — tu extrais seulement l'intention, les titres et les dates, la résolution vers une vraie ligne et l'écriture réelle se font ailleurs.

${titlesHint}

Actions disponibles :
${actionsList}
- DISCOVER_CAPABILITIES : l'utilisateur demande ce qu'il peut faire ici. payload vide. spokenConfirmation résume en 2-3 phrases maximum, jamais une liste technique d'identifiants.
- ASK_CLARIFICATION : le titre de la tâche visée, ou une date mentionnée mais trop vague pour être convertie de façon fiable (ex. "un de ces jours", "bientôt"), sont absents ou ambigus — payload.question = UNE SEULE question courte.
- UNKNOWN : aucune action ne correspond à la commande.

Règles absolues anti-invention :
- N'invente jamais un titre de tâche existante qui n'a pas été prononcé ou clairement désigné — utilise ASK_CLARIFICATION plutôt que de deviner parmi les tâches visibles.
- N'invente jamais une date : si l'utilisateur n'a mentionné aucune échéance, omets simplement dueAt (une tâche sans échéance est parfaitement valide) — ne calcule une date que si l'utilisateur en a réellement énoncé une, relative ou absolue.
- Pour CREATE_MULTIPLE_TASKS, n'invente jamais un nombre ou un contenu de tâche au-delà de ce que l'utilisateur a explicitement énuméré.

Réponds UNIQUEMENT en JSON strict, sans texte autour :
{ "type": "...", "payload": { ... }, "spokenConfirmation": "courte phrase en français à dire à voix haute, une seule phrase" }`;
}

/**
 * Interprète une commande vocale de gestion de tâches. Dégradation
 * gracieuse : une IA indisponible ne doit jamais bloquer la création/gestion
 * manuelle de tâches (une fois une UI construite) — juste ne pas exécuter
 * cette commande vocale précise.
 */
export async function interpretTaskVoiceCommand(promptText: string, context: TaskVoiceCommandContext): Promise<TaskVoiceAction> {
    try {
        const action = await generateJSON<TaskVoiceAction>(promptText, { systemInstruction: buildSystemInstruction(context) });
        if (!action || !action.type) {
            return { type: 'UNKNOWN', spokenConfirmation: "Je n'ai pas compris cette commande, pouvez-vous reformuler ?" };
        }
        return action;
    } catch {
        return { type: 'UNKNOWN', spokenConfirmation: "Désolé, je n'ai pas pu traiter cette commande vocale." };
    }
}
