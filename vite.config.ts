import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Identité de la version construite, gelée dans le bundle au moment du build.
//
// Pourquoi : le bandeau Super Admin affichait « Diallo OS v2.5 — Supabase
// Cloud », une chaîne écrite en dur, donc IDENTIQUE en production et dans un
// aperçu de PR. Impossible, en regardant l'écran, de savoir quelle version on
// a sous les yeux — ce qui a fait conclure trois fois de suite « je ne vois
// aucun changement » alors que le changement était bien là, mais ailleurs.
//
// Netlify pose ces variables à la construction. En local elles sont absentes :
// on le dit, on ne l'invente pas.
const buildIdentity = {
    contexte: process.env.CONTEXT ?? null,           // production | deploy-preview | branch-deploy
    commit: process.env.COMMIT_REF ?? null,          // SHA complet
    branche: process.env.BRANCH ?? null,
    pr: process.env.REVIEW_ID ?? null,               // numéro de PR (aperçus)
    construitLe: new Date().toISOString(),
};

export default defineConfig(() => {
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        __MOK_BUILD__: JSON.stringify(buildIdentity),
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
