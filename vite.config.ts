import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
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
