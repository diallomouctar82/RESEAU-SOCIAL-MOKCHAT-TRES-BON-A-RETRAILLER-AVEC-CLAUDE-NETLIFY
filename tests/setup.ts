import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

/**
 * Préparation commune des tests DOM.
 *
 * `localStorage` et `navigator.onLine` sont remis à zéro entre chaque test :
 * la file de synchronisation s'appuie sur les deux, et un état résiduel
 * produirait un vert trompeur — exactement le défaut relevé dans les tests
 * du paquet, où l'assertion ne pouvait pas échouer.
 */

beforeEach(() => {
    window.localStorage.clear();
    setOnline(true);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    window.localStorage.clear();
});

/** Bascule `navigator.onLine`, qui est en lecture seule par défaut. */
export function setOnline(value: boolean): void {
    Object.defineProperty(window.navigator, 'onLine', {
        configurable: true,
        get: () => value,
    });
}

// jsdom n'implémente pas Canvas 2D : le portrait vivant (Canvas) reste inerte
// en test, sans « Not implemented » à chaque montage. Le rendu réel est prouvé
// dans un vrai navigateur (captures et vidéo du design-lab / de la page /architecte).
if (typeof HTMLCanvasElement !== 'undefined') {
    HTMLCanvasElement.prototype.getContext = (() => null) as unknown as HTMLCanvasElement['getContext'];
}
