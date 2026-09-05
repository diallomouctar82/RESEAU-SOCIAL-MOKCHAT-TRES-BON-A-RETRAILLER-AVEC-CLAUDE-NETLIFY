// Tour de contrôle Vision Smart AI Core — LECTURE RÉELLE.
//
// RÈGLE ABSOLUE DE CE FICHIER : il ne fait que LIRE, et uniquement par des
// surfaces qui existent déjà. Aucune nouvelle RPC, aucune migration, aucune
// écriture, aucun octroi de droit. Brancher la tour de contrôle ne doit
// modifier ni le comportement d'AI Core, ni celui d'un seul agent.
//
// Tout le raisonnement vit dans `aiCoreControlTowerModel.ts` : ici, on
// rassemble les entrées et on les lui passe. Cette séparation n'est pas
// cosmétique — c'est elle qui garantit que la prévisualisation publique montre
// le MÊME calcul, à partir d'un instantané réel.

import { supabase } from './supabaseClient';
import {
    EntreesTourDeControle,
    EtatTourDeControle,
    EtatVerrou,
    ManifesteDepot,
    construireEtat,
} from './aiCoreControlTowerModel';

export * from './aiCoreControlTowerModel';

const OUTIL_AI_CORE = 'search_ai_core_memory';

/** Code PostgreSQL « colonne inexistante » — sert à sonder un schéma sans RPC. */
const COLONNE_INEXISTANTE = '42703';

/**
 * Sonde l'existence d'une colonne sans rien écrire ni ajouter de RPC : on
 * demande la colonne avec `limit(0)`. PostgREST répond 42703 si elle n'existe
 * pas, une liste vide si elle existe. Un droit manquant se distingue d'une
 * colonne manquante par le code d'erreur — on ne confond pas les deux.
 */
async function sonderColonne(table: string, colonne: string): Promise<{ etat: EtatVerrou; raison: string }> {
    const { error } = await supabase.from(table).select(colonne).limit(0);
    if (!error) return { etat: 'ouvert', raison: `Colonne ${colonne} présente.` };
    if (error.code === COLONNE_INEXISTANTE) {
        return { etat: 'ferme', raison: `La colonne ${colonne} n'existe pas dans ${table}.` };
    }
    return { etat: 'inconnu', raison: `Lecture impossible (${error.code || 'erreur'}) : ${error.message}` };
}

async function chargerManifeste(): Promise<ManifesteDepot | null> {
    try {
        const reponse = await fetch('/ai-core-manifest.json', { cache: 'no-store' });
        if (!reponse.ok) return null;
        return (await reponse.json()) as ManifesteDepot;
    } catch {
        return null;
    }
}

/**
 * Relevé en direct : rassemble les entrées depuis la base et le manifeste, puis
 * délègue TOUT le raisonnement à `construireEtat`. Aucune règle métier ici —
 * c'est ce qui permet à la prévisualisation de montrer exactement ce que la
 * console montrera, à partir d'un instantané réel.
 */
export async function collecterEtatTourDeControle(): Promise<EtatTourDeControle> {
    // Les six lectures sont indépendantes : les enchaîner en série n'ajouterait
    // que des allers-retours.
    const [
        manifeste,
        outilsReponse,
        droitsReponse,
        agentsReponse,
        sondeAgentId,
        sondeToolsUsed,
    ] = await Promise.all([
        chargerManifeste(),
        supabase.from('ai_tools').select('id, display_name, is_enabled'),
        supabase.from('agent_tool_grants').select('agent_id, tool_id, is_enabled'),
        supabase.from('agents').select('id, name, is_human, is_active').order('id'),
        sonderColonne('ai_call_log', 'agent_id'),
        sonderColonne('ai_call_log', 'tools_used'),
    ]);

    // Le comptage des appels AI Core n'a de sens que si la colonne existe :
    // l'interroger sans elle produirait une erreur PostgREST déguisée en zéro.
    let appelsAiCore: EtatTourDeControle['appelsAiCore'];
    if (sondeToolsUsed.etat === 'ouvert') {
        const { count, error } = await supabase
            .from('ai_call_log')
            .select('id', { count: 'exact', head: true })
            .contains('tools_used', [OUTIL_AI_CORE]);
        appelsAiCore = error
            ? { mesurable: false, nombre: null, raison: `Comptage impossible : ${error.message}` }
            : { mesurable: true, nombre: count ?? 0, raison: 'Compté sur ai_call_log.tools_used.' };
    } else {
        appelsAiCore = {
            mesurable: false,
            nombre: null,
            raison: "La colonne ai_call_log.tools_used n'existe pas : aucun appel d'outil n'est tracé, donc aucun appel AI Core ne peut être ni prouvé ni infirmé.",
        };
    }

    return construireEtat({
        manifeste,
        outils: (outilsReponse.data ?? []) as EntreesTourDeControle['outils'],
        droits: (droitsReponse.data ?? []) as EntreesTourDeControle['droits'],
        agentsBase: (agentsReponse.data ?? []) as EntreesTourDeControle['agentsBase'],
        sondeAgentId,
        sondeToolsUsed,
        appelsAiCore,
        echecs: {
            outils: outilsReponse.error?.message,
            droits: droitsReponse.error?.message,
            agents: agentsReponse.error?.message,
        },
    });
}
