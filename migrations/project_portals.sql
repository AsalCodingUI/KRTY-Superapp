-- Client portal of a project: one unguessable link (/p/<token>) opened
-- with a 6-digit PIN. The PIN is stored hashed (pgcrypto bcrypt); changing
-- it signs every client out (their session is derived from the hash).
-- Five wrong PINs lock the portal for 15 minutes. Stakeholders manage it
-- through set_project_portal / disable_project_portal; the portal pages
-- check PINs server-side with check_project_portal_pin (service role).
-- Idempotent.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.project_portals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL UNIQUE REFERENCES public.projects(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  pin_hash text NOT NULL,
  failed_attempts integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  last_seen_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.project_portals ENABLE ROW LEVEL SECURITY;

-- Stakeholders see whether a project has a portal (never the PIN, which
-- is only a hash anyway).
DROP POLICY IF EXISTS "Stakeholders read portals" ON public.project_portals;
CREATE POLICY "Stakeholders read portals" ON public.project_portals
  FOR SELECT TO authenticated USING (is_stakeholder());
REVOKE ALL ON public.project_portals FROM anon, authenticated;
GRANT SELECT (id, project_id, token, last_seen_at, locked_until, created_at, updated_at)
  ON public.project_portals TO authenticated;

-- Turn the portal on or change its PIN; returns the link token.
CREATE OR REPLACE FUNCTION public.set_project_portal(p_project_id uuid, p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token text;
BEGIN
  IF NOT is_stakeholder() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'pin' USING ERRCODE = '22023';
  END IF;
  INSERT INTO project_portals (project_id, token, pin_hash, created_by)
  VALUES (
    p_project_id,
    translate(encode(gen_random_bytes(18), 'base64'), '+/=', '-_'),
    crypt(p_pin, gen_salt('bf')),
    auth.uid()
  )
  ON CONFLICT (project_id) DO UPDATE
    SET pin_hash = crypt(p_pin, gen_salt('bf')),
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now()
  RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

CREATE OR REPLACE FUNCTION public.disable_project_portal(p_project_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT is_stakeholder() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  DELETE FROM project_portals WHERE project_id = p_project_id;
END;
$$;

-- 'ok' | 'wrong' | 'locked' | 'missing'; counts failures, locks at 5.
CREATE OR REPLACE FUNCTION public.check_project_portal_pin(p_token text, p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  p project_portals%ROWTYPE;
BEGIN
  SELECT * INTO p FROM project_portals WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RETURN 'missing'; END IF;
  IF p.locked_until IS NOT NULL AND p.locked_until > now() THEN
    RETURN 'locked';
  END IF;
  IF p_pin ~ '^[0-9]{6}$' AND crypt(p_pin, p.pin_hash) = p.pin_hash THEN
    UPDATE project_portals
      SET failed_attempts = 0, locked_until = NULL, last_seen_at = now()
      WHERE id = p.id;
    RETURN 'ok';
  END IF;
  UPDATE project_portals
    SET failed_attempts = CASE WHEN failed_attempts + 1 >= 5 THEN 0 ELSE failed_attempts + 1 END,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END
    WHERE id = p.id;
  RETURN CASE WHEN p.failed_attempts + 1 >= 5 THEN 'locked' ELSE 'wrong' END;
END;
$$;

REVOKE ALL ON FUNCTION public.set_project_portal(uuid, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.set_project_portal(uuid, text) TO authenticated;
REVOKE ALL ON FUNCTION public.disable_project_portal(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.disable_project_portal(uuid) TO authenticated;
REVOKE ALL ON FUNCTION public.check_project_portal_pin(text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_project_portal_pin(text, text) TO service_role;
