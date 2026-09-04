/**
 * Bus d'ondes de la surface d'eau — menu « Miroir d'eau » (DS-M2b).
 *
 * La nappe d'eau est peinte par `components/miroir/WaterMirror.tsx`, monté
 * une seule fois tout en haut de `Layout.tsx`. Les éléments qui doivent y
 * envoyer une onde (les cinq emplacements du dock, la goutte de la
 * messagerie) vivent beaucoup plus bas dans l'arbre — parfois dans un autre
 * composant. Faire descendre une fonction `ripple()` par les props aurait
 * demandé de traverser Layout → dock → chaque bouton, et
 * Layout → MessagingDropButton, pour un effet purement décoratif.
 *
 * Ce bus est donc volontairement minuscule : un `Set` d'abonnés, une
 * fraction horizontale (0 = bord gauche, 1 = bord droit de la fenêtre) et
 * rien d'autre. Aucun état, aucune dépendance, aucun effet de bord si
 * personne n'écoute — un appui sur le dock avant que la nappe soit montée
 * (ou quand l'utilisateur a demandé moins d'animations, cas où le canevas ne
 * s'abonne pas) ne fait tout simplement rien.
 */

/** Reçoit la position horizontale de l'appui, en fraction de la largeur. */
export type WaterRippleListener = (xFraction: number) => void;

const listeners = new Set<WaterRippleListener>();

/**
 * Abonne la nappe d'eau. Retourne la fonction de désabonnement à appeler au
 * démontage — sans elle, un canevas démonté continuerait de recevoir des
 * ondes et garderait une référence vivante vers son contexte 2D.
 */
export function subscribeWaterRipple(listener: WaterRippleListener): () => void {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

/**
 * Envoie une onde à la position donnée (fraction de largeur, bornée à
 * [0, 1] — une valeur hors bornes ou non finie est ramenée dans l'intervalle
 * plutôt que de faire naître une ride hors de l'écran).
 *
 * Un abonné qui lève n'empêche jamais les autres de recevoir l'onde : c'est
 * un effet décoratif, il ne doit sous aucun prétexte casser le clic réel du
 * bouton qui l'a déclenché.
 */
export function emitWaterRipple(xFraction: number): void {
    const clamped = Number.isFinite(xFraction) ? Math.min(1, Math.max(0, xFraction)) : 0.5;
    for (const listener of [...listeners]) {
        try {
            listener(clamped);
        } catch {
            /* une onde n'est jamais une raison de casser une navigation */
        }
    }
}

/**
 * Variante pratique pour un gestionnaire de clic : calcule la fraction
 * depuis le centre de l'élément touché. Sans élément mesurable (test JSDOM,
 * élément détaché du document), l'onde part du milieu plutôt que de ne pas
 * partir du tout.
 */
export function emitWaterRippleFrom(element: Element | null | undefined): void {
    const width = typeof window !== 'undefined' ? window.innerWidth : 0;
    if (!element || !width || typeof element.getBoundingClientRect !== 'function') {
        emitWaterRipple(0.5);
        return;
    }
    const box = element.getBoundingClientRect();
    if (!box || !box.width) {
        emitWaterRipple(0.5);
        return;
    }
    emitWaterRipple((box.left + box.width / 2) / width);
}

/** Réservé aux tests : nombre d'abonnés réellement attachés. */
export function waterRippleListenerCount(): number {
    return listeners.size;
}
