-- Extension minimale de la migration cœur 2026082721*. Ne redéfinit ni
-- profiles, ni handle_new_user(), ni is_admin(), ni audit_logs.
BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '["standard_access"]'::jsonb,
  ADD COLUMN IF NOT EXISTS admin_notes text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_status_check
      CHECK (status IN ('active', 'pending', 'suspended')) NOT VALID;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.profiles'::regclass
      AND conname = 'profiles_permissions_array_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_permissions_array_check
      CHECK (jsonb_typeof(permissions) = 'array') NOT VALID;
  END IF;
END;
$$;

ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_status_check;
ALTER TABLE public.profiles VALIDATE CONSTRAINT profiles_permissions_array_check;

UPDATE public.profiles
SET permissions = CASE
  WHEN role = 'super_admin' THEN '["all"]'::jsonb
  WHEN role = 'admin' AND permissions = '["standard_access"]'::jsonb
    THEN '["manage_users","manage_roles","manage_permissions","suspend_users","delete_users","view_audit_logs"]'::jsonb
  ELSE permissions
END;

-- Complément du trigger cœur : ces trois colonnes administratives sont elles
-- aussi immuables depuis une session navigateur ordinaire.
CREATE OR REPLACE FUNCTION public.protect_profile_admin_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF coalesce(auth.jwt() ->> 'role', '') <> 'service_role'
     AND (
       NEW.status IS DISTINCT FROM OLD.status OR
       NEW.permissions IS DISTINCT FROM OLD.permissions OR
       NEW.admin_notes IS DISTINCT FROM OLD.admin_notes
     ) THEN
    RAISE EXCEPTION 'Administrative profile fields require a trusted server operation'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_protect_admin_columns ON public.profiles;
CREATE TRIGGER trg_profiles_protect_admin_columns
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.protect_profile_admin_columns();

REVOKE ALL ON FUNCTION public.protect_profile_admin_columns() FROM PUBLIC, anon, authenticated;

-- Quota partagé entre toutes les instances Netlify. La fonction d'API refuse
-- les mutations si cette migration n'est pas présente (échec fermé).
CREATE TABLE IF NOT EXISTS public.admin_api_rate_limits (
  actor_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  window_started_at timestamptz NOT NULL DEFAULT now(),
  request_count integer NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_api_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.admin_api_rate_limits FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.admin_api_rate_limits TO service_role;

CREATE OR REPLACE FUNCTION public.admin_consume_rate_limit(
  p_actor_id uuid,
  p_limit integer DEFAULT 30
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  accepted_actor uuid;
BEGIN
  IF p_actor_id IS NULL OR p_limit < 1 OR p_limit > 300 THEN
    RETURN false;
  END IF;

  INSERT INTO public.admin_api_rate_limits AS limits (
    actor_id,
    window_started_at,
    request_count,
    updated_at
  ) VALUES (
    p_actor_id,
    now(),
    1,
    now()
  )
  ON CONFLICT (actor_id) DO UPDATE
  SET
    window_started_at = CASE
      WHEN limits.window_started_at <= now() - interval '1 minute' THEN now()
      ELSE limits.window_started_at
    END,
    request_count = CASE
      WHEN limits.window_started_at <= now() - interval '1 minute' THEN 1
      ELSE limits.request_count + 1
    END,
    updated_at = now()
  WHERE limits.window_started_at <= now() - interval '1 minute'
     OR limits.request_count < p_limit
  RETURNING actor_id INTO accepted_actor;

  RETURN accepted_actor IS NOT NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_consume_rate_limit(uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_consume_rate_limit(uuid, integer) TO service_role;

COMMIT;
