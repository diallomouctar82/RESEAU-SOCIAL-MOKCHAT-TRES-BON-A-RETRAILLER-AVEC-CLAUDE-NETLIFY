import { createClient } from 'jsr:@supabase/supabase-js@2';

// Même convention que livekit-token/supabase.ts : client service_role pour
// lire les abonnements push et la clé VAPID (jamais exposés au navigateur),
// client scopé au JWT de l'appelant pour savoir QUI demande l'envoi.
export function createServiceRoleClient() {
    const url = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}

export function createUserScopedClient(authHeader: string | null) {
    const url = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    return createClient(url, anonKey, {
        auth: { persistSession: false },
        global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });
}
