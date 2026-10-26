-- PIN tries counted per visitor (IP), so someone with the link can't lock
-- the real client out by guessing wrong: 5 wrong from one IP locks that IP
-- for 15 minutes. Many wrong across IPs (30 in 15 minutes) still locks the
-- whole portal, against a guessing run spread over many addresses.

CREATE TABLE IF NOT EXISTS public.project_portal_attempts (
  portal_id uuid NOT NULL REFERENCES public.project_portals(id) ON DELETE CASCADE,
  ip text NOT NULL,
  failed integer NOT NULL DEFAULT 0,
  locked_until timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (portal_id, ip)
);
ALTER TABLE public.project_portal_attempts ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.project_portal_attempts FROM anon, authenticated;

DROP FUNCTION IF EXISTS public.check_project_portal_pin(text, text);
CREATE OR REPLACE FUNCTION public.check_project_portal_pin(
  p_token text, p_pin text, p_ip text DEFAULT NULL
) RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
DECLARE
  p project_portals%ROWTYPE;
  a project_portal_attempts%ROWTYPE;
  who text := COALESCE(NULLIF(p_ip, ''), 'unknown');
  recent integer;
BEGIN
  SELECT * INTO p FROM project_portals WHERE token = p_token FOR UPDATE;
  IF NOT FOUND THEN RETURN 'missing'; END IF;
  IF p.locked_until IS NOT NULL AND p.locked_until > now() THEN
    RETURN 'locked';
  END IF;

  INSERT INTO project_portal_attempts (portal_id, ip) VALUES (p.id, who)
    ON CONFLICT DO NOTHING;
  SELECT * INTO a FROM project_portal_attempts
    WHERE portal_id = p.id AND ip = who FOR UPDATE;
  IF a.locked_until IS NOT NULL AND a.locked_until > now() THEN
    RETURN 'locked';
  END IF;

  IF p_pin ~ '^[0-9]{6}$' AND crypt(p_pin, p.pin_hash) = p.pin_hash THEN
    UPDATE project_portal_attempts SET failed = 0, locked_until = NULL, updated_at = now()
      WHERE portal_id = p.id AND ip = who;
    UPDATE project_portals SET last_seen_at = now() WHERE id = p.id;
    RETURN 'ok';
  END IF;

  -- Wrong: count it for this visitor (a stale count starts over).
  UPDATE project_portal_attempts
    SET failed = CASE WHEN updated_at < now() - interval '15 minutes' THEN 1 ELSE failed + 1 END,
        updated_at = now()
    WHERE portal_id = p.id AND ip = who
    RETURNING * INTO a;
  IF a.failed >= 5 THEN
    UPDATE project_portal_attempts
      SET failed = 0, locked_until = now() + interval '15 minutes'
      WHERE portal_id = p.id AND ip = who;
  END IF;

  -- And across everyone: too many in a short while locks the portal.
  SELECT COALESCE(sum(failed), 0) + COUNT(*) FILTER (WHERE locked_until > now()) * 5
    INTO recent
    FROM project_portal_attempts
    WHERE portal_id = p.id AND updated_at > now() - interval '15 minutes';
  IF recent >= 30 THEN
    UPDATE project_portals SET locked_until = now() + interval '15 minutes' WHERE id = p.id;
    DELETE FROM project_portal_attempts WHERE portal_id = p.id;
    RETURN 'locked';
  END IF;

  RETURN CASE WHEN a.failed >= 5 THEN 'locked' ELSE 'wrong' END;
END;
$$;
REVOKE ALL ON FUNCTION public.check_project_portal_pin(text, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_project_portal_pin(text, text, text) TO service_role;

-- A new PIN starts everyone's count over.
CREATE OR REPLACE FUNCTION public.project_portals_reset_attempts()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.pin_hash IS DISTINCT FROM OLD.pin_hash THEN
    DELETE FROM project_portal_attempts WHERE portal_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_portals_reset_attempts ON public.project_portals;
CREATE TRIGGER project_portals_reset_attempts AFTER UPDATE OF pin_hash ON public.project_portals
  FOR EACH ROW EXECUTE FUNCTION public.project_portals_reset_attempts();
