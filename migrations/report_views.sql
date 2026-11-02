-- When a client opens a shared report: one row per visit, from the public
-- link (/r/<key>) or the client portal. Written by the server only (the
-- service key, after skipping the team, bots and repeat visits within 30
-- minutes); read by the project's team. No raw IP is kept: visitor_hash is
-- a salted hash of IP + user agent, for deduping only.
-- Additive and idempotent.

CREATE TABLE IF NOT EXISTS public.report_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES public.project_reports(id) ON DELETE CASCADE,
  viewed_at timestamptz NOT NULL DEFAULT now(),
  source text NOT NULL CHECK (source IN ('link', 'portal')),
  visitor_hash text NOT NULL CHECK (length(visitor_hash) <= 64),
  -- 'mobile' | 'tablet' | 'desktop'
  device text CHECK (device IN ('mobile', 'tablet', 'desktop')),
  -- A short label like "iPhone · Safari", never the full string.
  user_agent text CHECK (length(user_agent) <= 60),
  country text CHECK (length(country) <= 2)
);

CREATE INDEX IF NOT EXISTS report_views_report_time
  ON public.report_views (report_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS report_views_visitor_time
  ON public.report_views (report_id, visitor_hash, viewed_at DESC);

ALTER TABLE public.report_views ENABLE ROW LEVEL SECURITY;

-- Reading: whoever can open the report's project (members, stakeholders).
DROP POLICY IF EXISTS "Project team reads report views" ON public.report_views;
CREATE POLICY "Project team reads report views" ON public.report_views
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_reports r
      WHERE r.id = report_views.report_id
        AND can_access_project(r.project_id)
    )
  );

-- No insert/update/delete policy: only the service role writes.
REVOKE ALL ON public.report_views FROM anon, authenticated;
GRANT SELECT ON public.report_views TO authenticated;
