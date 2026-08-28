import { createServiceRoleClient, createUserScopedClient } from '../supabase.ts';

export interface ToolExecutionContext {
    // Client scopé au JWT de la personne connectée. TOUTE lecture de données
    // personnelles passe par lui : RLS applique alors exactement ses droits.
    // Utiliser service_role pour lire un dossier utilisateur contournerait
    // silencieusement les rôles — c'est précisément ce qu'on interdit ici.
    userClient: ReturnType<typeof createUserScopedClient>;
    // Réservé aux opérations d'infrastructure (lecture d'une clé fournisseur
    // dans Vault pour la recherche web). Jamais pour lire des données métier.
    service: ReturnType<typeof createServiceRoleClient>;
    userId: string;
    /** Expert à l'origine de l'appel, tracé sur les objets qu'il crée. */
    agentId?: string;
}

export interface ToolResult {
    ok: boolean;
    // Texte renvoyé au modèle. En cas d'échec, il doit expliquer quoi faire
    // (« signaler à la personne », « ne pas inventer ») plutôt que d'être un
    // simple code d'erreur : le modèle s'en sert pour formuler sa réponse.
    content: string;
}

export type ToolExecutor = (
    args: Record<string, unknown>,
    ctx: ToolExecutionContext,
) => Promise<ToolResult>;
