-- PMs on a project manage its reports like the author does: edit, share
-- with the client (share_token) and delete anyone's report there
-- (is_project_pm: job title "Project Manager" + on the project's team).
-- Reading was already the whole team's. Idempotent.

DROP POLICY IF EXISTS "Authors and admins edit reports" ON public.project_reports;
CREATE POLICY "Authors and admins edit reports" ON public.project_reports
  FOR UPDATE TO authenticated
  USING (
    can_access_project(project_id)
    AND (author_id = auth.uid() OR is_stakeholder() OR is_project_pm(project_id))
  )
  WITH CHECK (can_access_project(project_id));

DROP POLICY IF EXISTS "Authors and admins delete reports" ON public.project_reports;
CREATE POLICY "Authors and admins delete reports" ON public.project_reports
  FOR DELETE TO authenticated
  USING (
    can_access_project(project_id)
    AND (author_id = auth.uid() OR is_stakeholder() OR is_project_pm(project_id))
  );
