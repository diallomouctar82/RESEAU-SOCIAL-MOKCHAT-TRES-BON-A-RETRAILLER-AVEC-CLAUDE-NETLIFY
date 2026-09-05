-- Défense en profondeur : ces RPC vérifient déjà is_admin() en interne, mais par défaut
-- Postgres accorde EXECUTE à PUBLIC sur toute nouvelle fonction. On restreint explicitement
-- l'accès à `authenticated` uniquement (jamais `anon`), comme pour get_ai_provider_secret_internal.

revoke execute on function public.set_ai_provider_secret(text, text) from public, anon;
grant execute on function public.set_ai_provider_secret(text, text) to authenticated;

revoke execute on function public.set_ai_provider_enabled(text, boolean) from public, anon;
grant execute on function public.set_ai_provider_enabled(text, boolean) to authenticated;

revoke execute on function public.set_ai_provider_priority(text, integer) from public, anon;
grant execute on function public.set_ai_provider_priority(text, integer) to authenticated;

revoke execute on function public.get_ai_provider_status() from public, anon;
grant execute on function public.get_ai_provider_status() to authenticated;
