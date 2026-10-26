-- Project members see their whole team, not only their own assignment.
-- The project pages need it: the PIC picker, @mentions, card avatars and the
-- team list all read project_assignments. Before, a member who wasn't the
-- lead got only their own row, so they could only assign tasks to themselves.
-- Writes are unchanged (stakeholders, or the project's lead).
DROP POLICY IF EXISTS "Assignments read" ON public.project_assignments;
CREATE POLICY "Assignments read" ON public.project_assignments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.can_access_project(project_id));
