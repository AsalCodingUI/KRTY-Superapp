-- Leads: the sites the studio finds and answers leads on (Gmail, Telegram
-- Web, Dribbble, Behance …), shown in Kretya Flow as embedded web views
-- (the Leads workspace). One shared list: every PM and stakeholder sees
-- the same sites and any of them may add, rename or remove one.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.lead_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (length(trim(name)) BETWEEN 1 AND 60),
  url text NOT NULL CHECK (url ~* '^https://'),
  position double precision NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
    DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS lead_sources_position_idx
  ON public.lead_sources (position);

ALTER TABLE public.lead_sources ENABLE ROW LEVEL SECURITY;

-- PMs and stakeholders (the Leads workspace's audience).
CREATE OR REPLACE FUNCTION public.can_use_leads()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT public.is_stakeholder() OR public.is_pm()
$$;

DROP POLICY IF EXISTS "Lead sources read" ON public.lead_sources;
CREATE POLICY "Lead sources read" ON public.lead_sources
  FOR SELECT TO authenticated USING (public.can_use_leads());

DROP POLICY IF EXISTS "Lead sources insert" ON public.lead_sources;
CREATE POLICY "Lead sources insert" ON public.lead_sources
  FOR INSERT TO authenticated WITH CHECK (public.can_use_leads());

DROP POLICY IF EXISTS "Lead sources update" ON public.lead_sources;
CREATE POLICY "Lead sources update" ON public.lead_sources
  FOR UPDATE TO authenticated
  USING (public.can_use_leads()) WITH CHECK (public.can_use_leads());

DROP POLICY IF EXISTS "Lead sources delete" ON public.lead_sources;
CREATE POLICY "Lead sources delete" ON public.lead_sources
  FOR DELETE TO authenticated USING (public.can_use_leads());

-- The first sites, once (only while the list is empty).
INSERT INTO public.lead_sources (name, url, position, created_by)
SELECT v.name, v.url, v.position, NULL
FROM (VALUES
  ('Gmail', 'https://mail.google.com/mail/', 1),
  ('Telegram', 'https://web.telegram.org/a/', 2),
  ('Dribbble', 'https://dribbble.com/', 3),
  ('Behance', 'https://www.behance.net/', 4)
) AS v(name, url, position)
WHERE NOT EXISTS (SELECT 1 FROM public.lead_sources);
