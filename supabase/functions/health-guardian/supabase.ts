import { createClient } from 'jsr:@supabase/supabase-js@2';

// Même convention que push-notify/supabase.ts et livekit-token/supabase.ts.
//
// Nuance propre à cette fonction : les sondes et les réparations passent par
// le client SCOPÉ AU JWT, jamais par le service_role. C'est délibéré — les
// fonctions `health_*` portent elles-mêmes le contrôle de rang
// (`health_require_admin` / `health_require_general_admin`) en s'appuyant sur
// `auth.uid()`. Les appeler en service_role ferait disparaître cette identité
// et donc le contrôle : la fonction ne saurait plus QUI agit, et le journal
// n'aurait plus d'auteur.
//
// Le service_role reste nécessaire pour une seule chose : écrire dans
// `audit_logs`, qui n'a aucune policy (refus par défaut) et n'est donc
// accessible à personne d'autre.

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
