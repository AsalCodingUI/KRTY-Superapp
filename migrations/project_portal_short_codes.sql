-- Portal links read like /p/<project-name>-<code>: the token becomes a
-- 6-character code (no look-alike characters: 31^6 ≈ 887M), unguessable
-- enough next to the PIN and its per-IP lockout.

CREATE OR REPLACE FUNCTION public.new_portal_code()
RETURNS text LANGUAGE plpgsql SET search_path = public, extensions AS $$
DECLARE
  alphabet constant text := 'abcdefghjkmnpqrstuvwxyz23456789';
  bytes bytea;
  code text;
BEGIN
  LOOP
    bytes := gen_random_bytes(6);
    code := '';
    FOR i IN 0..5 LOOP
      code := code || substr(alphabet, 1 + get_byte(bytes, i) % 31, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM project_portals WHERE token = code);
  END LOOP;
  RETURN code;
END;
$$;
REVOKE ALL ON FUNCTION public.new_portal_code() FROM public, anon, authenticated;

CREATE OR REPLACE FUNCTION public.set_project_portal(p_project_id uuid, p_pin text)
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions AS $$
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
  VALUES (p_project_id, new_portal_code(), crypt(p_pin, gen_salt('bf')), auth.uid())
  ON CONFLICT (project_id) DO UPDATE
    SET pin_hash = crypt(p_pin, gen_salt('bf')),
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now()
  RETURNING token INTO v_token;
  RETURN v_token;
END;
$$;

-- Existing portals get a short code (their old long links stop working).
UPDATE project_portals SET token = new_portal_code() WHERE length(token) <> 6;
