// Actions écrivant dans l'application.
//
// GARDE-FOU STRUCTUREL : ces exécuteurs ne sont JAMAIS appelés depuis la boucle
// d'outils ordinaire. Quand le modèle demande une action, l'orchestrateur
// interrompt le tour et renvoie au client une action « en attente » décrivant
// précisément ce qui serait fait. L'écriture n'a lieu qu'au tour suivant, après
// que la personne a explicitement confirmé (voir `confirmedAction` dans
// index.ts). La confirmation n'est donc pas une politesse d'interface que l'on
// pourrait contourner : sans elle, aucun code d'écriture ne s'exécute.
//
// L'écriture se fait par ailleurs avec le client scopé au JWT : RLS s'applique,
// une action ne peut rien créer au nom de quelqu'un d'autre.

import { ToolExecutionContext, ToolResult } from './types.ts';

export async function executeCreateDossier(
    args: Record<string, unknown>,
    ctx: ToolExecutionContext,
): Promise<ToolResult> {
    const titre = typeof args.titre === 'string' ? args.titre.trim() : '';
    if (!titre) {
        return { ok: false, content: "Titre manquant : impossible de créer le dossier." };
    }

    const { data, error } = await ctx.userClient
        .from('dossiers')
        .insert({
            owner_id: ctx.userId,
            title: titre,
            // La colonne s'appelle `objective` dans le schéma (pas `description`).
            objective: typeof args.description === 'string' ? args.description : null,
            category: typeof args.categorie === 'string' ? args.categorie : null,
            // `lead_agent_id` est volontairement laissé vide : la colonne porte
            // une clé étrangère vers la table `agents`, actuellement vide (les
            // experts sont définis côté application, dans constants.ts). Y
            // écrire l'identifiant de l'expert ferait échouer l'insertion.
            // À réactiver le jour où les experts seront synchronisés en base.
            status: 'active',
        })
        .select('id, title')
        .maybeSingle();

    if (error) {
        console.error('create_dossier: échec de création', error.message);
        return { ok: false, content: `La création du dossier a échoué : ${error.message}. Le signaler à la personne sans réessayer automatiquement.` };
    }

    return {
        ok: true,
        content: `Dossier « ${data?.title ?? titre} » créé avec succès. Confirmer à la personne et lui indiquer la prochaine étape concrète.`,
    };
}

/**
 * Résumé lisible d'une action en attente, affiché à la personne avant qu'elle
 * confirme. Rédigé côté serveur pour que l'interface n'ait jamais à deviner ce
 * qu'une action va faire.
 */
export function describeAction(toolId: string, args: Record<string, unknown>): string {
    switch (toolId) {
        case 'create_dossier': {
            const titre = typeof args.titre === 'string' ? args.titre : 'sans titre';
            const cat = typeof args.categorie === 'string' ? ` (${args.categorie})` : '';
            return `Ouvrir un nouveau dossier de vie : « ${titre} »${cat}`;
        }
        default:
            return `Exécuter l'action « ${toolId} »`;
    }
}
