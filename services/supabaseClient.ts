
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
        "Supabase non configuré : VITE_SUPABASE_URL et/ou VITE_SUPABASE_ANON_KEY sont absentes. " +
        "L'authentification et les données distantes ne fonctionneront pas tant que ces variables ne sont pas définies sur Netlify (ou dans .env.local en développement)."
    );
}

const REMEMBER_ME_KEY = 'lmav_remember_me';

/**
 * "Se souvenir de moi" : à appeler AVANT signInWithPassword/signInWithOAuth/
 * signUp pour choisir où la session sera écrite juste après.
 * true (défaut) → localStorage, la session survit à la fermeture du navigateur.
 * false → sessionStorage, la session est effacée à la fermeture de l'onglet.
 */
export const setRememberMe = (remember: boolean): void => {
    try {
        localStorage.setItem(REMEMBER_ME_KEY, remember ? 'true' : 'false');
    } catch {
        // Stockage indisponible (navigation privée stricte) : reste sur le défaut mémorisé.
    }
};

export const getRememberMe = (): boolean => {
    try {
        const v = localStorage.getItem(REMEMBER_ME_KEY);
        return v === null ? true : v === 'true';
    } catch {
        return true;
    }
};

// Adapte dynamiquement où Supabase persiste la session selon setRememberMe(),
// sans avoir à recréer le client. La préférence elle-même reste toujours en
// localStorage (petite donnée non sensible) ; seul le token de session bascule.
const hybridStorage = {
    getItem: (key: string) => {
        try {
            return localStorage.getItem(key) ?? sessionStorage.getItem(key);
        } catch {
            return null;
        }
    },
    setItem: (key: string, value: string) => {
        try {
            if (getRememberMe()) {
                sessionStorage.removeItem(key);
                localStorage.setItem(key, value);
            } else {
                localStorage.removeItem(key);
                sessionStorage.setItem(key, value);
            }
        } catch {
            // Stockage indisponible : la session ne survivra pas au reload, dégradation silencieuse acceptable.
        }
    },
    removeItem: (key: string) => {
        try {
            localStorage.removeItem(key);
            sessionStorage.removeItem(key);
        } catch {
            // ignore
        }
    },
};

// createClient() lève une exception synchrone si l'URL est vide/invalide.
// Comme ce module est importé tôt (dès App.tsx), une telle exception
// bloquerait le montage de toute l'application — exactement la classe de
// bug déjà corrigée sur le client Gemini (services/ai.ts). L'URL de repli
// est syntaxiquement valide : elle garantit que l'app démarre toujours ;
// si la config manque vraiment, seuls les appels réseau Supabase
// échoueront (proprement, côté appelant), jamais le chargement du bundle.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-anon-key',
    { auth: { storage: hybridStorage } }
);
