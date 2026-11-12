-- Leads: the sites PMs and stakeholders keep open to find and answer leads
-- (Dribbble, Behance, Gmail, Telegram Web …), shown in Kretya Flow as
-- embedded web views (the Leads workspace). A row with no user_id is a
-- studio default (stakeholders manage those); a row with a user_id is that
-- person's own. Each person may hide studio defaults for themselves.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- NULL: a studio default, everyone (PM up) gets it.
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  url text NOT NULL CHECK (url ~* '^https://'),
  position double precision NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_sources_user_idx
  ON public.lead_sources (user_id, position);

CREATE TABLE IF NOT EXISTS public.lead_source_hidden (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES public.lead_sources(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, source_id)
);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_source_hidden ENABLE ROW LEVEL SECURITY;

-- PMs and stakeholders (the Leads workspace's audience).
CREATE OR REPLACE FUNCTION public.can_use_leads()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_stakeholder() OR public.is_pm()
$$;

-- Read: the studio defaults and your own.
DROP POLICY IF EXISTS "Lead sources read" ON public.lead_sources;
CREATE POLICY "Lead sources read" ON public.lead_sources
  FOR SELECT TO authenticated
  USING (public.can_use_leads() AND (user_id IS NULL OR user_id = auth.uid()));

-- Add: your own; a studio default only as a stakeholder.
DROP POLICY IF EXISTS "Lead sources insert" ON public.lead_sources;
CREATE POLICY "Lead sources insert" ON public.lead_sources
  FOR INSERT TO authenticated
  WITH CHECK (
    public.can_use_leads()
    AND (user_id = auth.uid() OR (user_id IS NULL AND public.is_stakeholder()))
  );

DROP POLICY IF EXISTS "Lead sources update" ON public.lead_sources;
CREATE POLICY "Lead sources update" ON public.lead_sources
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND public.is_stakeholder()))
  WITH CHECK (user_id = auth.uid() OR (user_id IS NULL AND public.is_stakeholder()));

DROP POLICY IF EXISTS "Lead sources delete" ON public.lead_sources;
CREATE POLICY "Lead sources delete" ON public.lead_sources
  FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR (user_id IS NULL AND public.is_stakeholder()));

-- Hidden defaults: each person's own.
DROP POLICY IF EXISTS "Lead source hidden own" ON public.lead_source_hidden;
CREATE POLICY "Lead source hidden own" ON public.lead_source_hidden
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid() AND public.can_use_leads());

-- The studio defaults, once.
INSERT INTO public.lead_sources (user_id, name, url, position)
SELECT NULL, v.name, v.url, v.position
FROM (VALUES
  ('Gmail', 'https://mail.google.com/mail/', 1),
  ('Telegram', 'https://web.telegram.org/a/', 2),
  ('Dribbble', 'https://dribbble.com/', 3),
  ('Behance', 'https://www.behance.net/', 4)
) AS v(name, url, position)
WHERE NOT EXISTS (SELECT 1 FROM public.lead_sources WHERE user_id IS NULL);
