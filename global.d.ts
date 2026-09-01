/**
 * Déclarations ambiantes du projet.
 *
 * `window.aistudio` est une API fournie par l'hôte Google AI Studio lorsque
 * l'application y est prévisualisée. Elle n'existe PAS en production sur
 * moknet.net : `components/Studio.tsx` et `components/VideoGenerator.tsx`
 * gardent donc chaque appel derrière un test de présence. La déclaration
 * ci-dessous ne fait que rendre ce contrat explicite pour le compilateur —
 * elle ne crée aucun objet et ne change aucun comportement d'exécution.
 */
declare global {
    interface Window {
        aistudio?: {
            /** Indique si une clé API a déjà été sélectionnée dans l'hôte. */
            hasSelectedApiKey?: () => Promise<boolean>;
            /** Ouvre le sélecteur de clé de l'hôte. */
            openSelectKey?: () => Promise<void>;
        };
    }
}

export {};
