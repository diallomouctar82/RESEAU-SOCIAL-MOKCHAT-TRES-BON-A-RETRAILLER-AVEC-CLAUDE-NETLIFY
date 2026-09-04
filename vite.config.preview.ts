import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

/**
 * Build de la PRÉVISUALISATION uniquement — jamais celui de l'application.
 *
 * Configuration séparée délibérément : la prévisualisation a sa propre racine
 * (`preview/tour-de-controle`) et sa propre sortie (`dist-preview/`), pour
 * qu'aucun de ses réglages ne puisse fuiter dans le bundle livré sur
 * moknet.net. `npm run build` reste strictement inchangé.
 */
export default defineConfig({
    root: path.resolve(__dirname, 'preview/tour-de-controle'),
    // Chemins relatifs : la page fonctionne à la racine d'un site comme dans un
    // sous-dossier, sans supposer où elle sera déposée.
    base: './',
    plugins: [react()],
    // PostCSS déclaré ICI et nulle part ailleurs : sans fichier
    // `postcss.config.*` à la racine, le build de l'application reste
    // strictement identique à ce qu'il était.
    css: {
        postcss: {
            plugins: [
                tailwindcss({ config: path.resolve(__dirname, 'preview/tour-de-controle/tailwind.preview.config.cjs') }),
                autoprefixer(),
            ],
        },
    },
    resolve: {
        alias: { '@': path.resolve(__dirname, '.') },
    },
    build: {
        outDir: path.resolve(__dirname, 'dist-preview'),
        emptyOutDir: true,
    },
});
