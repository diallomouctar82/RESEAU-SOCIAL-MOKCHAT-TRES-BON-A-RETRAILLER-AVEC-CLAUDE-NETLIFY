-- Vision Smart AI Core — catalogue d'outil Moknet.
--
-- L'exécuteur est déployable avant le secret sans impact utilisateur : l'outil
-- reste désactivé et aucun agent ne reçoit de grant tant que le jeton serveur
-- AI Core n'est pas provisionné et validé.

insert into public.ai_tools (
    id,
    display_name,
    description,
    category,
    parameters_schema,
    requires_confirmation,
    requires_auth,
    is_enabled,
    sort_order
)
values (
    'search_ai_core_memory',
    'Mémoire institutionnelle Vision Smart',
    'Recherche dans Vision Smart AI Core les décisions, règles, incidents, résolutions et connaissances institutionnelles validées/actives. À utiliser lorsque la réponse dépend de ce que Vision Smart a officiellement décidé ou mémorisé. Si aucune connaissance active n’est trouvée, ne pas transformer une hypothèse en règle officielle.',
    'read',
    '{
      "type": "object",
      "required": ["query"],
      "properties": {
        "query": {
          "type": "string",
          "description": "Fait, décision, règle, incident ou connaissance institutionnelle à rechercher."
        },
        "type": {
          "type": "string",
          "description": "Type de connaissance AI Core à filtrer, seulement si le type exact est connu."
        },
        "limit": {
          "type": "integer",
          "minimum": 1,
          "maximum": 5,
          "description": "Nombre maximum de résultats, 3 par défaut et 5 au maximum."
        }
      }
    }'::jsonb,
    false,
    true,
    false,
    25
)
on conflict (id) do update
set display_name = excluded.display_name,
    description = excluded.description,
    category = excluded.category,
    parameters_schema = excluded.parameters_schema,
    requires_confirmation = excluded.requires_confirmation,
    requires_auth = excluded.requires_auth,
    -- Ne jamais activer implicitement lors d'une réapplication de migration.
    is_enabled = public.ai_tools.is_enabled,
    sort_order = excluded.sort_order,
    updated_at = now();
