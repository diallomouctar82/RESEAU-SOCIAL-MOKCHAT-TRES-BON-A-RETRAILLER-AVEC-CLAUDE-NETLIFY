// Tailwind de la PRÉVISUALISATION uniquement.
//
// L'application charge Tailwind depuis un CDN (index.html) ; la page de
// prévisualisation, elle, le COMPILE au build. Deux raisons, et aucune ne
// concerne l'application :
//   1. la page devient autonome — elle s'affiche identiquement sans réseau
//      tiers, donc une capture d'écran montre bien ce que le lien sert ;
//   2. c'est exactement le correctif recommandé par l'inspection pour le
//      frontend — autant que la première page qui en bénéficie le démontre.
//
// Les couleurs reprennent à l'identique le thème déclaré dans `index.html`,
// pour que le composant rende ici comme dans la console d'administration.

/** @type {import('tailwindcss').Config} */
const path = require('path');
const RACINE = path.resolve(__dirname, '../..');

module.exports = {
    // Chemins ABSOLUS : Tailwind résout ses globs depuis le répertoire courant
    // du processus (la racine du dépôt quand Vite s'exécute), pas depuis
    // l'emplacement de ce fichier. Avec des chemins relatifs, il ne trouvait
    // aucune classe et n'émettait que le préflight — la page sortait nue.
    content: [
        path.join(__dirname, 'index.html'),
        path.join(__dirname, 'main.tsx'),
        path.join(RACINE, 'components/admin/AiCoreControlTowerView.tsx'),
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
                display: ['Outfit', '"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                navy: { 950: '#070D1E', 900: '#0B132B', 800: '#14213D', 700: '#1E293B', 600: '#334155' },
                accent: { DEFAULT: '#EA580C', hover: '#C2410C', light: '#FFF7ED' },
            },
        },
    },
    plugins: [],
};
