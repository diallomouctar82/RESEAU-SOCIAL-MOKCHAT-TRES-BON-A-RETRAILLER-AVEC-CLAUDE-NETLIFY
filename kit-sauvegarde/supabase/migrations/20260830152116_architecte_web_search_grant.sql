-- FINALISATION F : l'Architecte devient un agent de plein droit pour la
-- recherche web DÉJÀ implémentée côté serveur (tools/web_search.ts —
-- grounding Gemini, sources citées, échecs honnêtes). Aucun nouveau système :
-- une ligne de droit d'usage dans le mécanisme existant (ai_tools ×
-- agent_tool_grants), comme les 10 experts IA qui l'ont depuis l'origine.
insert into public.agent_tool_grants (tool_id, agent_id, is_enabled)
values ('web_search', 'architecte', true)
on conflict do nothing;
