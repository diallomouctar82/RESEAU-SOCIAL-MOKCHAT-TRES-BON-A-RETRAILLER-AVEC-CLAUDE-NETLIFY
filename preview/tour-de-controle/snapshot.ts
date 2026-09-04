// Instantané RÉEL de la base de production, relevé le 4 septembre 2026.
//
// Pourquoi un instantané et non une connexion directe : la Tour de contrôle vit
// dans la console d'administration, derrière une session admin. Une page de
// prévisualisation publique ne peut pas — et ne doit pas — porter une session.
// On lui donne donc les MÊMES entrées, figées, et on les passe à la MÊME
// fonction `construireEtat` que la console : ce qui s'affiche ici est ce qui
// s'affichera là-bas, pas une imitation.
//
// Ces valeurs ne sont pas inventées : elles proviennent de lectures seules du
// projet `rqciahtpixdjbyoajomg` (tables ai_tools, agent_tool_grants, agents) le
// 4 septembre 2026. Aucune donnée personnelle, aucun secret : des identifiants
// d'agents, des noms d'outils et des booléens.

import type { EntreesTourDeControle, ManifesteDepot } from '../../services/aiCoreControlTowerModel';

/** Les 4 outils du catalogue, avec leur interrupteur global réel. */
const outils: EntreesTourDeControle['outils'] = [
    { id: 'web_search', display_name: 'Recherche web en temps réel', is_enabled: true },
    { id: 'get_user_context', display_name: 'Dossier de la personne', is_enabled: true },
    { id: 'search_ai_core_memory', display_name: 'Mémoire institutionnelle Vision Smart', is_enabled: false },
    { id: 'create_dossier', display_name: 'Ouvrir un dossier de vie', is_enabled: true },
];

const EXPERTS_IA = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

/** Les 31 lignes réelles de `agent_tool_grants`. */
const droits: EntreesTourDeControle['droits'] = [
    ...EXPERTS_IA.map((id) => ({ agent_id: id, tool_id: 'web_search', is_enabled: true })),
    ...EXPERTS_IA.map((id) => ({ agent_id: id, tool_id: 'get_user_context', is_enabled: true })),
    ...EXPERTS_IA.map((id) => ({ agent_id: id, tool_id: 'create_dossier', is_enabled: false })),
    { agent_id: 'architecte', tool_id: 'web_search', is_enabled: true },
];

/** Les 13 lignes réelles de `agents`. */
const agentsBase: EntreesTourDeControle['agentsBase'] = [
    { id: '1', name: 'Diallo', is_human: false, is_active: true },
    { id: '2', name: 'Maître Diallo', is_human: false, is_active: true },
    { id: '3', name: 'Conseiller Diallo', is_human: false, is_active: true },
    { id: '4', name: 'Professeur Diallo', is_human: false, is_active: true },
    { id: '5', name: 'Docteur Diallo', is_human: false, is_active: true },
    { id: '6', name: 'Monsieur Diallo', is_human: false, is_active: true },
    { id: '7', name: 'Guide Diallo', is_human: false, is_active: true },
    { id: '8', name: 'Directeur Diallo', is_human: false, is_active: true },
    { id: '9', name: 'Trésorier Diallo', is_human: false, is_active: true },
    { id: '10', name: 'Officier Diallo', is_human: false, is_active: true },
    { id: 'h1', name: 'Me Sarah Mansouri', is_human: true, is_active: true },
    { id: 'h2', name: 'Dr. Karim Ouedraogo', is_human: true, is_active: true },
    { id: 'h3', name: 'Fatou Ndiaye, CPA', is_human: true, is_active: true },
];

/**
 * Le manifeste n'est PAS importé statiquement.
 *
 * Il est produit au build (`scripts/build-ai-core-manifest.mjs`) et volontairement
 * absent du dépôt : un `import` figé faisait échouer `tsc` sur tout checkout
 * propre — c'est exactement ce qui a mis le Green Gate au rouge. Il est donc
 * chargé à l'exécution, par le même chemin que la console d'administration, ce
 * qui a un second mérite : les faits de code affichés ici se régénèrent à chaque
 * build au lieu de se figer et de mentir en silence après un prochain commit.
 */
export async function chargerManifestePreview(): Promise<ManifesteDepot | null> {
    try {
        const reponse = await fetch('./ai-core-manifest.json', { cache: 'no-store' });
        if (!reponse.ok) return null;
        return (await reponse.json()) as ManifesteDepot;
    } catch {
        return null;
    }
}

export const INSTANTANE: Omit<EntreesTourDeControle, 'manifeste'> = {
    outils,
    droits,
    agentsBase,
    // `ai_call_log` compte 17 colonnes, dont ni agent_id ni tools_used.
    sondeAgentId: { etat: 'ferme', raison: "La colonne agent_id n'existe pas dans ai_call_log." },
    sondeToolsUsed: { etat: 'ferme', raison: "La colonne tools_used n'existe pas dans ai_call_log." },
    appelsAiCore: {
        mesurable: false,
        nombre: null,
        raison: "La colonne ai_call_log.tools_used n'existe pas : aucun appel d'outil n'est tracé, donc aucun appel AI Core ne peut être ni prouvé ni infirmé.",
    },
    echecs: {},
    releveLe: '2026-09-04T06:15:00.000Z',
};

export const ORIGINE_INSTANTANE = {
    projet: 'rqciahtpixdjbyoajomg (production MokNet)',
    date: '4 septembre 2026',
    tables: 'ai_tools, agent_tool_grants, agents, ai_call_log (schéma)',
};
