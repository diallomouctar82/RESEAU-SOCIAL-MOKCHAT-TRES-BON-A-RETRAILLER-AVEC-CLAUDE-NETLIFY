import path from 'path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Outillage de test DOM.
 *
 * C'est le seul apport du `package.json` du paquet Architecte que MokNet
 * n'avait pas : `vitest` + `@testing-library/react`. Le dépôt savait
 * jusqu'ici tester du service pur (bundle esbuild + Node), mais rien qui
 * touche au DOM — c'est précisément pour cela que le démontage de la barre
 * flottante, qui laissait le micro ouvert, n'avait été détecté qu'en lisant
 * le code.
 *
 * Configuration séparée de `vite.config.ts` : la configuration de build de
 * l'application n'a pas à porter celle des tests, et un fichier distinct
 * évite tout risque de faire fuiter des réglages de test dans le bundle
 * livré.
 */
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: { '@': path.resolve(__dirname, '.') },
    },
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./tests/setup.ts'],
        include: ['tests/**/*.test.{ts,tsx}'],
        // Chaque fichier dans son propre environnement : les modules de ce
        // dépôt portent de l'état de module (file de synchronisation,
        // registre de capacités). Les isoler évite qu'un test en pollue un
        // autre — et surtout évite un faux vert dû à un état laissé derrière.
        isolate: true,
    },
});
