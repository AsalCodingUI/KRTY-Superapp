-- Design links on a project (Figma files, prototypes…): several per
-- project, added by stakeholders and PMs, read by everyone on the project.

CREATE TABLE IF NOT EXISTS public.project_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  url text NOT NULL CHECK (url ~* '^https?://'),
  title text,
  position integer NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_links_project_idx ON public.project_links (project_id, position);
ALTER TABLE public.project_links ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Project team reads links" ON public.project_links;
CREATE POLICY "Project team reads links" ON public.project_links
  FOR SELECT TO authenticated USING (can_access_project(project_id));

DROP POLICY IF EXISTS "Stakeholders and PMs manage links" ON public.project_links;
CREATE POLICY "Stakeholders and PMs manage links" ON public.project_links
  FOR ALL TO authenticated
  USING (can_access_project(project_id) AND (is_stakeholder() OR is_pm()))
  WITH CHECK (can_access_project(project_id) AND (is_stakeholder() OR is_pm()));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_links TO authenticated;
