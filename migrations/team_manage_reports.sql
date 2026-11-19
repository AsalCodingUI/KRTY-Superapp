-- Everyone on a project's team manages its reports as its PM does: edit,
-- share with the client (share_token) and delete anyone's report there.
-- (pm_manage_reports.sql gave this to the author, stakeholders and the
-- project's PM.) can_access_project = stakeholder or on the project's team.
-- Writing a new one stays the author's own (author_id = auth.uid()).
-- Idempotent.

DROP POLICY IF EXISTS "Authors and admins edit reports" ON public.project_reports;
DROP POLICY IF EXISTS "Project team edits reports" ON public.project_reports;
CREATE POLICY "Project team edits reports" ON public.project_reports
  FOR UPDATE TO authenticated
  USING (can_access_project(project_id))
  WITH CHECK (can_access_project(project_id));

DROP POLICY IF EXISTS "Authors and admins delete reports" ON public.project_reports;
DROP POLICY IF EXISTS "Project team deletes reports" ON public.project_reports;
CREATE POLICY "Project team deletes reports" ON public.project_reports
  FOR DELETE TO authenticated
  USING (can_access_project(project_id));
