-- Daily reports in a project (e.g. a designer's "Report - @26 Oktober
-- 2026"): Markdown with images and links, written by the project's team.
-- Each can be shared on its own with the client through an unguessable
-- link (/r/<share_token>), read server-side; clearing the token unshares.
-- Images live in the public bucket report-images under "<project_id>/…"
-- with random names, so a shared report's pictures load for the client.
-- Idempotent.

CREATE TABLE IF NOT EXISTS public.project_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 160),
  body text NOT NULL DEFAULT '' CHECK (length(body) <= 200000),
  report_date date NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')::date,
  share_token text UNIQUE,
  shared_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS project_reports_project_date
  ON public.project_reports (project_id, report_date DESC, created_at DESC);

DROP TRIGGER IF EXISTS project_reports_updated_at ON public.project_reports;
CREATE TRIGGER project_reports_updated_at
  BEFORE UPDATE ON public.project_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.project_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project team reads reports" ON public.project_reports;
CREATE POLICY "Project team reads reports" ON public.project_reports
  FOR SELECT TO authenticated
  USING (can_access_project(project_id));

DROP POLICY IF EXISTS "Project team writes reports" ON public.project_reports;
CREATE POLICY "Project team writes reports" ON public.project_reports
  FOR INSERT TO authenticated
  WITH CHECK (can_access_project(project_id) AND author_id = auth.uid());

DROP POLICY IF EXISTS "Authors and admins edit reports" ON public.project_reports;
CREATE POLICY "Authors and admins edit reports" ON public.project_reports
  FOR UPDATE TO authenticated
  USING (can_access_project(project_id) AND (author_id = auth.uid() OR is_stakeholder()))
  WITH CHECK (can_access_project(project_id));

DROP POLICY IF EXISTS "Authors and admins delete reports" ON public.project_reports;
CREATE POLICY "Authors and admins delete reports" ON public.project_reports
  FOR DELETE TO authenticated
  USING (can_access_project(project_id) AND (author_id = auth.uid() OR is_stakeholder()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_reports TO authenticated;

-- Images: public bucket, 10 MB, pictures only.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('report-images', 'report-images', true, 10485760,
        ARRAY['image/png','image/jpeg','image/gif','image/webp','image/avif','image/svg+xml'])
ON CONFLICT (id) DO UPDATE SET public = true,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP POLICY IF EXISTS "Report images upload" ON storage.objects;
CREATE POLICY "Report images upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'report-images'
    AND can_access_project(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Report images delete" ON storage.objects;
CREATE POLICY "Report images delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'report-images'
    AND can_access_project(((storage.foldername(name))[1])::uuid)
  );

-- Removing a file through the storage API reads it first: the team needs
-- SELECT on its project's pictures (the public URL works for anyone anyway).
DROP POLICY IF EXISTS "Report images read" ON storage.objects;
CREATE POLICY "Report images read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'report-images'
    AND can_access_project(((storage.foldername(name))[1])::uuid)
  );
