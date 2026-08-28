// Registre des exécuteurs d'outils.
//
// Le CATALOGUE (quels outils existent, qui a le droit de les utiliser) vit en
// base — ai_tools + agent_tool_grants — et se pilote depuis la console
// d'administration sans toucher au code. Ce fichier ne contient que
// l'IMPLÉMENTATION de chaque outil.
//
// Ajouter un outil = un fichier ici + une ligne dans ai_tools. Les autorisations
// par expert suivent automatiquement.

import { ToolExecutor } from './types.ts';
import { executeWebSearch } from './web_search.ts';
import { executeGetUserContext } from './user_context.ts';
import { executeCreateDossier } from './actions.ts';

const EXECUTORS: Record<string, ToolExecutor> = {
    web_search: executeWebSearch,
    get_user_context: executeGetUserContext,
    create_dossier: executeCreateDossier,
};

export function resolveToolExecutor(toolId: string): ToolExecutor | null {
    return EXECUTORS[toolId] ?? null;
}
