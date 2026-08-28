import { createClient } from 'jsr:@supabase/supabase-js@2';

// Client service_role : contourne RLS par conception, n'est jamais exposé au navigateur.
// Utilisé uniquement à l'intérieur de cette fonction pour lire le catalogue et déchiffrer
// les clés via get_ai_provider_secret_internal (dont l'exécution est révoquée pour
// anon/authenticated côté base — voir la migration ai_orchestrator_rpcs).
export function createServiceRoleClient() {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

// Client scopé au JWT de l'appelant : sert uniquement à vérifier qui appelle et
// s'il est admin (is_admin() respecte RLS avec ce client, contrairement au service_role).
export function createUserScopedClient(authHeader: string | null) {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    return createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });
}
