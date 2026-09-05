import path from 'path';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { defineConfig, Plugin } from 'vite';
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
/**
 * Copie le seul fichier dont la prévisualisation a besoin depuis `public/` :
 * le manifeste AI Core, qu'elle charge à l'exécution comme le fait la console.
 * Absent (build lancé sans `npm run manifest:ai-core`), la page le dit au lieu
 * d'inventer des chiffres — elle n'échoue pas ici en silence.
 */
function copierManifesteAiCore(): Plugin {
    const source = path.resolve(__dirname, 'public/ai-core-manifest.json');
    const destinationDossier = path.resolve(__dirname, 'dist-preview');
    return {
        name: 'copier-manifeste-ai-core',
        apply: 'build',
        closeBundle() {
            if (!existsSync(source)) {
                this.warn('Manifeste AI Core absent : la prévisualisation affichera « manifeste introuvable ».');
                return;
            }
            mkdirSync(destinationDossier, { recursive: true });
            copyFileSync(source, path.join(destinationDossier, 'ai-core-manifest.json'));
        },
    };
}

export default defineConfig({
    root: path.resolve(__dirname, 'preview/tour-de-controle'),
    // Chemins relatifs : la page fonctionne à la racine d'un site comme dans un
    // sous-dossier, sans supposer où elle sera déposée.
    base: './',
    // Surtout PAS `publicDir: public/` : cela déposerait le service worker de
    // MokNet, son manifeste PWA et ses icônes sur l'URL publique de
    // prévisualisation — des fichiers qui n'ont rien à y faire et qui feraient
    // passer la page pour l'application. Seul le manifeste AI Core est copié.
    publicDir: false,
    plugins: [react(), copierManifesteAiCore()],
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
