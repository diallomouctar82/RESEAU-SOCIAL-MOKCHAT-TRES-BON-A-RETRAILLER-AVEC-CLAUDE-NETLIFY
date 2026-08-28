import { createClient } from 'jsr:@supabase/supabase-js@2';

// Client service_role : contourne RLS, utilisé uniquement pour lire le catalogue
// (recherche d'un LLM actif pour l'extraction) et déchiffrer sa clé.
export function createServiceRoleClient() {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

// Client scopé au JWT de l'appelant : vérifie l'admin ET porte son identité pour
// les RPC SECURITY DEFINER qui lisent auth.uid() (upsert_discovered_provider).
export function createUserScopedClient(authHeader: string | null) {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    return createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });
}
