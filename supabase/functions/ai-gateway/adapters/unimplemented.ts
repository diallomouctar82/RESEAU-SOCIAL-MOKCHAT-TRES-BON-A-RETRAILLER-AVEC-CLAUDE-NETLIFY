// Utilisé par tout fournisseur enregistré au catalogue mais dont l'adaptateur n'est
// pas encore écrit (status='not_implemented'). Erreur structurée et explicite plutôt
// qu'un échec ambigu — la boucle de bascule de index.ts passe simplement au suivant.

import { AdapterError, AdapterResult, ProviderAdapter } from './types.ts';

export const unimplementedAdapter: ProviderAdapter = {
    call(): Promise<AdapterResult> {
        throw new AdapterError("Adaptateur pas encore implémenté pour ce fournisseur.", 'other');
    },
    testConnection(): Promise<{ ok: boolean; message: string }> {
        return Promise.resolve({ ok: false, message: "Adaptateur pas encore implémenté pour ce fournisseur." });
    },
};
