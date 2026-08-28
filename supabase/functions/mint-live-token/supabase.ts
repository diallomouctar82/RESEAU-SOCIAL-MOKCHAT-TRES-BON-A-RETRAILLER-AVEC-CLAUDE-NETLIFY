import { createClient } from 'jsr:@supabase/supabase-js@2';

// Client service_role : contourne RLS, utilisé uniquement pour lire la clé
// Gemini via get_ai_provider_secret_internal (jamais exposée au navigateur).
export function createServiceRoleClient() {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

// Client scopé au JWT de l'appelant : sert uniquement à vérifier qu'il est
// authentifié (voir index.ts — même politique d'accès que ai-gateway mode 'call').
export function createUserScopedClient(authHeader: string | null) {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    return createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });
}
