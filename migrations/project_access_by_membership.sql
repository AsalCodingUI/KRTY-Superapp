-- Project access by membership (see src/shared/config/access.ts).
--
-- 1. Projects: stakeholders read every project, everyone else only the
--    projects they're assigned to (can_access_project). Writes stay as they
--    are (stakeholders, via the app's server actions).
-- 2. Being added to a project notifies the person, linking to the project.
-- 3. Per-person page toggles are no longer read by the app; the table stays
--    for now so this can be rolled back. Drop it once things have settled:
--      DROP TABLE public.user_page_permissions;

-- 1) Projects: replace every SELECT policy with the membership rule.
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'projects' AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.projects', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Projects read (stakeholders, members)" ON public.projects
  FOR SELECT TO authenticated
  USING (public.can_access_project(id));

-- 2) Notify on assignment.
CREATE OR REPLACE FUNCTION public.trg_project_assignments_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_name text;
BEGIN
  -- Adding yourself needs no notice.
  IF NEW.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  SELECT name INTO project_name FROM public.projects WHERE id = NEW.project_id;

  PERFORM public.create_notification(
    NEW.user_id,
    'Kamu ditambahkan ke project',
    COALESCE(project_name, 'Project') ||
      CASE WHEN NEW.is_lead THEN ' · sebagai lead' ELSE '' END,
    'project_assignment',
    '/projects/' || NEW.project_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_assignments_notify_insert ON public.project_assignments;
CREATE TRIGGER project_assignments_notify_insert
AFTER INSERT ON public.project_assignments
FOR EACH ROW EXECUTE FUNCTION public.trg_project_assignments_notify_insert();
