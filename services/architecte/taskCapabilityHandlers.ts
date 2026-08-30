import { supabaseService } from '../supabaseClient';
import { registerCapabilityHandlers, type CapabilityHandler } from './capabilityBus';
import type { TaskVoiceSingleTask } from '../tasks/taskVoiceCommands';

/**
 * Handlers réels du domaine Tâches, portés par l'Architecte lui-même.
 *
 * Les 7 capacités `task.*` étaient jusqu'ici les seules du registre à n'avoir
 * AUCUN consommateur : leur registre et leur interprète existaient
 * (`services/tasks/taskVoiceCommands.ts`, LOOP 15/17) mais aucun écran ne les
 * hébergeait — le registre plateforme le documentait honnêtement
 * (« aucune UI Tâches n'existe encore pour héberger ce registre... capacité
 * déclarée et testée en isolation, mais sans écran à secourir »).
 *
 * Contrairement aux domaines Live/Contenu/Social, ces capacités n'ont besoin
 * d'AUCUN état d'écran : elles n'opèrent que sur la table `tasks` via des
 * méthodes `supabaseService` déjà réelles et déjà testées (LOOP 14-15/17).
 * L'Architecte peut donc les porter directement, et elles deviennent
 * exécutables partout dans l'application plutôt que nulle part.
 *
 * Règle de résolution, volontairement déterministe : quand une commande
 * désigne une tâche EXISTANTE par son titre, la correspondance est faite ici,
 * en TypeScript, contre les vraies lignes renvoyées par `getTasks` — jamais
 * par le modèle. Une correspondance ambiguë (plusieurs tâches plausibles) est
 * REFUSÉE avec la liste des candidates, jamais tranchée au hasard : agir sur
 * la mauvaise tâche est pire que ne rien faire.
 */

/** Normalisation pour la comparaison de titres : casse, accents et espaces superflus ignorés. */
function normalize(text: string): string {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ')
        .trim();
}

type TaskRow = { id: string; title: string; status: string };

type Resolution =
    | { ok: true; task: TaskRow }
    | { ok: false; message: string };

/**
 * Résout un titre énoncé vers UNE ligne réelle. Exact d'abord, puis
 * "contient" — et refus explicite si zéro ou plusieurs candidates.
 */
async function resolveTaskByTitle(userId: string, spokenTitle: string | undefined): Promise<Resolution> {
    const wanted = normalize(spokenTitle || '');
    if (!wanted) {
        return { ok: false, message: "Je n'ai pas compris de quelle tâche il s'agit." };
    }

    const rows = (await supabaseService.getTasks(userId)) as TaskRow[];
    if (!rows || rows.length === 0) {
        return { ok: false, message: "Vous n'avez aucune tâche enregistrée pour l'instant." };
    }

    const exact = rows.filter((t) => normalize(t.title) === wanted);
    const candidates = exact.length > 0 ? exact : rows.filter((t) => normalize(t.title).includes(wanted));

    if (candidates.length === 0) {
        return { ok: false, message: `Je ne trouve aucune tâche appelée « ${spokenTitle} ».` };
    }
    if (candidates.length > 1) {
        const list = candidates.slice(0, 4).map((t) => `« ${t.title} »`).join(', ');
        return {
            ok: false,
            message: `Plusieurs tâches correspondent (${list}). Précisez laquelle — je préfère ne rien faire plutôt que de modifier la mauvaise.`,
        };
    }
    return { ok: true, task: candidates[0] };
}

/** Validation minimale d'une date ISO — ne jamais écrire une échéance que la base refusera ensuite. */
function isValidIso(value: unknown): value is string {
    return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function readTask(params: any): TaskVoiceSingleTask | null {
    const task = params?.task;
    if (!task || typeof task.title !== 'string' || !task.title.trim()) return null;
    return task as TaskVoiceSingleTask;
}

/**
 * Construit les handlers pour un utilisateur donné. `userId` est capturé à
 * l'enregistrement : chaque écriture reste ainsi bornée au propriétaire réel,
 * en plus de la RLS `tasks` (owner-only) qui reste la garantie de fond.
 */
export function buildTaskCapabilityHandlers(userId: string): Record<string, CapabilityHandler> {
    const createOne = async (task: TaskVoiceSingleTask) => {
        const created = await supabaseService.createTask(userId, {
            title: task.title.trim(),
            description: task.description,
            priority: task.priority,
            dueAt: isValidIso(task.dueAt) ? task.dueAt : undefined,
            recurrenceRule: task.recurrenceRule,
        });
        if (!created) throw new Error("La tâche n'a pas pu être enregistrée.");
        return created;
    };

    return {
        'task.item.create': async (params) => {
            const task = readTask(params);
            if (!task) return { ok: false, message: "Il me manque le titre de la tâche à créer." };
            const created = await createOne(task);
            return { ok: true, message: `Tâche « ${created.title} » créée.`, data: created };
        },

        'task.item.create_recurring': async (params) => {
            const task = readTask(params);
            if (!task) return { ok: false, message: "Il me manque le titre de la tâche récurrente à créer." };
            if (!task.recurrenceRule) {
                return { ok: false, message: "Je n'ai pas compris la fréquence (quotidienne, hebdomadaire ou mensuelle ?)." };
            }
            const created = await createOne(task);
            const label = { daily: 'quotidienne', weekly: 'hebdomadaire', monthly: 'mensuelle' }[task.recurrenceRule];
            return { ok: true, message: `Tâche ${label} « ${created.title} » créée.`, data: created };
        },

        'task.item.create_multiple': async (params) => {
            const tasks: TaskVoiceSingleTask[] = Array.isArray(params?.tasks) ? params.tasks : [];
            const valid = tasks.filter((t) => t && typeof t.title === 'string' && t.title.trim());
            if (valid.length === 0) return { ok: false, message: "Je n'ai identifié aucune tâche à créer." };

            // Rapport honnête d'un succès partiel : on n'annonce jamais « 3 tâches
            // créées » si une seule a réellement abouti (même discipline que les
            // rapports « 18 sur 20 » appliquée ailleurs dans cette mission).
            const created: string[] = [];
            const failed: string[] = [];
            for (const task of valid) {
                try {
                    const row = await createOne(task);
                    created.push(row.title);
                } catch {
                    failed.push(task.title);
                }
            }
            if (created.length === 0) {
                return { ok: false, message: `Aucune des ${valid.length} tâches n'a pu être créée.` };
            }
            if (failed.length > 0) {
                return {
                    ok: true,
                    message: `${created.length} tâche(s) créée(s), mais ${failed.length} a échoué : ${failed.join(', ')}.`,
                    data: { created, failed },
                };
            }
            return { ok: true, message: `${created.length} tâches créées : ${created.join(', ')}.`, data: { created } };
        },

        'task.item.complete': async (params) => {
            const resolved = await resolveTaskByTitle(userId, params?.taskTitle);
            if (resolved.ok !== true) return { ok: false, message: resolved.message };
            if (resolved.task.status === 'completed') {
                return { ok: true, message: `« ${resolved.task.title} » était déjà terminée.` };
            }
            await supabaseService.updateTaskStatus(userId, resolved.task.id, 'completed');
            return { ok: true, message: `« ${resolved.task.title} » marquée comme terminée.` };
        },

        'task.item.reschedule': async (params) => {
            if (!isValidIso(params?.newDueAt)) {
                return { ok: false, message: "Je n'ai pas compris la nouvelle date — pouvez-vous la préciser ?" };
            }
            const resolved = await resolveTaskByTitle(userId, params?.taskTitle);
            if (resolved.ok !== true) return { ok: false, message: resolved.message };
            // `rescheduleTask` refuse déjà côté service une tâche terminée/annulée
            // et lève — le bus convertira en `failed` avec ce message réel.
            await supabaseService.rescheduleTask(userId, resolved.task.id, params.newDueAt);
            const when = new Date(params.newDueAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            return { ok: true, message: `« ${resolved.task.title} » replanifiée au ${when}.` };
        },

        'task.item.add_dependency': async (params) => {
            const target = await resolveTaskByTitle(userId, params?.taskTitle);
            if (target.ok !== true) return { ok: false, message: target.message };
            const blocker = await resolveTaskByTitle(userId, params?.dependsOnTaskTitle);
            if (blocker.ok !== true) return { ok: false, message: blocker.message };
            if (target.task.id === blocker.task.id) {
                return { ok: false, message: 'Une tâche ne peut pas dépendre d\'elle-même.' };
            }
            // Le trigger `validate_task_dependency` reste la garantie de fond
            // (auto-référence, dépendance vers un autre utilisateur) : une
            // violation lève et devient un `failed` honnête, jamais un succès.
            await supabaseService.setTaskDependency(userId, target.task.id, blocker.task.id);
            return { ok: true, message: `« ${target.task.title} » dépend maintenant de « ${blocker.task.title} ».` };
        },

        'task.item.delete': async (params) => {
            const resolved = await resolveTaskByTitle(userId, params?.taskTitle);
            if (resolved.ok !== true) return { ok: false, message: resolved.message };
            await supabaseService.deleteTask(userId, resolved.task.id);
            return { ok: true, message: `« ${resolved.task.title} » supprimée.` };
        },
    };
}

/**
 * Enregistre les handlers Tâches pour l'utilisateur courant et renvoie la
 * fonction de retrait. Appelée depuis l'Architecte lui-même : contrairement
 * aux domaines portés par un écran, ces capacités restent disponibles partout
 * dans l'application, puisqu'elles ne dépendent d'aucun état d'interface.
 */
export function registerTaskCapabilities(userId: string): () => void {
    return registerCapabilityHandlers(buildTaskCapabilityHandlers(userId));
}
