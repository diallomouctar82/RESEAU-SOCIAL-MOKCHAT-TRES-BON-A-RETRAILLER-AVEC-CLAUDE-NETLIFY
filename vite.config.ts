import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VERSION_DU_CODE } from './services/versions/versionDuCode';
import { construireVersionJson, versionJsonPlugin } from './vite-plugins/versionJson';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      // `version.json` à la racine du build + carte d'identité du build dans le
      // code : la version que ce code déclare, le commit et le déploiement
      // Netlify construits (services/versions, onglet Super-Admin « Versions
      // stables »). Aucun secret : un commit et un identifiant de déploiement
      // sont déjà publics.
      plugins: [react(), versionJsonPlugin(VERSION_DU_CODE)],
      define: {
        __MOKNET_BUILD__: JSON.stringify(construireVersionJson(VERSION_DU_CODE, process.env, new Date(), null)),
      },
      // Plus aucune clé IA injectée au build : tout appel IA passe par
      // l'orchestrateur central (services/aiGateway.ts), configuré depuis
      // Super Admin → Connecteurs & Modèles IA — source de vérité unique.
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
