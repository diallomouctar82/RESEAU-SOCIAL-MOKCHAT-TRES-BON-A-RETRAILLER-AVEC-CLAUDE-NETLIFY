
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        "Supabase non configuré : VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY sont absentes. " +
        "L'authentification et les données distantes ne fonctionneront pas tant que ces variables ne sont pas définies sur Netlify (ou dans .env.local en développement)."
    );
}

// createClient() lève une exception synchrone si l'URL est vide/invalide.
// Comme ce module est importé tôt (dès App.tsx), une telle exception
// bloquerait le montage de toute l'application — exactement la classe de
// bug déjà corrigée sur le client Gemini (services/ai.ts). L'URL de repli
// est syntaxiquement valide : elle garantit que l'app démarre toujours ;
// si la config manque vraiment, seuls les appels réseau Supabase
// échoueront (proprement, côté appelant), jamais le chargement du bundle.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key'
);
