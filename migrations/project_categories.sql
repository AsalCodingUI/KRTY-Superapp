-- Projects page: categories, PMs create and move projects.
--
-- 1. project_categories (id, name, created_at) + projects.category_id.
--    Everyone signed in reads; stakeholders and PMs (job title "Project
--    Manager") write.
-- 2. PMs create projects: insert on projects, and the creating PM joins the
--    team at once (projects_add_creator_pm) so they can see the row, staff it
--    and get its process phases (apply_process allows a project PM to seed,
--    never replace).
-- 3. Status changes ("Pindahkan ke", drag on the board/list): stakeholders and
--    the project's PMs only. PMs get update on their projects; a trigger
--    refuses a status change from anyone else (e.g. an employee lead, who
--    keeps editing other fields as before).
-- 4. projects.updated_at now moves on every update ("recently updated" sort).
-- 5. PMs read processes (to pick one when creating a project).
--
-- Additive: new table/column/policies/triggers; apply_process keeps its
-- body, only its guard gains the PM case. Re-runnable.

BEGIN;

-- 1. Categories -------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.project_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> '' AND length(name) <= 60),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS project_categories_name_unique
  ON public.project_categories (lower(btrim(name)));

ALTER TABLE public.project_categories ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_categories TO authenticated;

DROP POLICY IF EXISTS "Project categories read" ON public.project_categories;
CREATE POLICY "Project categories read" ON public.project_categories
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Project categories write" ON public.project_categories;
CREATE POLICY "Project categories write" ON public.project_categories
  FOR ALL TO authenticated
  USING (is_stakeholder() OR is_pm())
  WITH CHECK (is_stakeholder() OR is_pm());

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS category_id uuid
  REFERENCES public.project_categories(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS projects_category_id_idx
  ON public.projects (category_id);

-- 2. PMs create projects ------------------------------------------------------

DROP POLICY IF EXISTS "Projects insert (PMs)" ON public.projects;
CREATE POLICY "Projects insert (PMs)" ON public.projects
  FOR INSERT TO authenticated WITH CHECK (is_pm());

-- The PM who creates a project is on its team (else they couldn't see it).
CREATE OR REPLACE FUNCTION public.trg_projects_add_creator_pm()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND is_pm() AND NOT is_stakeholder() THEN
    INSERT INTO project_assignments (project_id, user_id, role_in_project, is_lead)
    VALUES (NEW.id, auth.uid(), 'Project Manager', false)
    ON CONFLICT (project_id, user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- AFTER triggers fire by name: this one runs before projects_seed_phases.
DROP TRIGGER IF EXISTS projects_add_creator_pm ON public.projects;
CREATE TRIGGER projects_add_creator_pm
  AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trg_projects_add_creator_pm();

DROP POLICY IF EXISTS "Assignments insert (project PMs)" ON public.project_assignments;
CREATE POLICY "Assignments insert (project PMs)" ON public.project_assignments
  FOR INSERT TO authenticated WITH CHECK (is_project_pm(project_id));
DROP POLICY IF EXISTS "Assignments update (project PMs)" ON public.project_assignments;
CREATE POLICY "Assignments update (project PMs)" ON public.project_assignments
  FOR UPDATE TO authenticated
  USING (is_project_pm(project_id))
  WITH CHECK (is_project_pm(project_id));

CREATE OR REPLACE FUNCTION public.apply_process(p_project_id uuid, p_process_id uuid, p_replace boolean DEFAULT false)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_done boolean;
  v_pos integer := 0;
  ph record;
  st record;
  v_phase uuid;
  v_step_pos integer;
BEGIN
  -- A PM may seed (never replace) the phases of a project they are on;
  -- that is how their new project gets its process (projects_seed_phases).
  IF auth.uid() IS NOT NULL AND NOT is_stakeholder()
     AND NOT (NOT p_replace AND is_project_pm(p_project_id)) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  SELECT status::text NOT IN ('Planned', 'Active', 'Review') INTO v_done
    FROM projects WHERE id = p_project_id;
  IF v_done IS NULL THEN RETURN; END IF;

  IF p_replace THEN
    DELETE FROM project_tasks
      WHERE project_id = p_project_id AND phase_id IS NOT NULL AND NOT done;
    DELETE FROM project_phases WHERE project_id = p_project_id;
  ELSIF EXISTS (SELECT 1 FROM project_phases WHERE project_id = p_project_id) THEN
    RETURN;
  END IF;

  FOR ph IN SELECT * FROM process_phases WHERE process_id = p_process_id ORDER BY position, name LOOP
    v_pos := v_pos + 1;
    INSERT INTO project_phases (project_id, name, position, status, completed_at)
    VALUES (p_project_id, ph.name, v_pos,
            CASE WHEN v_done THEN 'done' WHEN v_pos = 1 THEN 'active' ELSE 'todo' END,
            CASE WHEN v_done THEN now() END)
    RETURNING id INTO v_phase;
    v_step_pos := 0;
    FOR st IN SELECT * FROM process_steps WHERE phase_id = ph.id ORDER BY position, title LOOP
      INSERT INTO project_steps (project_id, phase_id, title, description, position, status)
      VALUES (p_project_id, v_phase, st.title, st.description, v_step_pos,
              CASE WHEN v_done THEN 'done' ELSE 'draft' END);
      v_step_pos := v_step_pos + 1;
      INSERT INTO project_tasks (project_id, phase_id, title, done, completed_at)
      SELECT p_project_id, v_phase, t.title, v_done, CASE WHEN v_done THEN now() END
        FROM process_tasks t WHERE t.step_id = st.id ORDER BY t.position;
    END LOOP;
  END LOOP;

  -- An empty process still leaves the project with the old fixed phases.
  IF v_pos = 0 THEN
    PERFORM seed_project_phases(p_project_id, v_done);
  END IF;
  UPDATE projects SET process_id = p_process_id WHERE id = p_project_id
    AND process_id IS DISTINCT FROM p_process_id;
END;
$function$;

-- 3. Who moves a project ------------------------------------------------------

DROP POLICY IF EXISTS "Projects update (project PMs)" ON public.projects;
CREATE POLICY "Projects update (project PMs)" ON public.projects
  FOR UPDATE TO authenticated
  USING (is_project_pm(id))
  WITH CHECK (is_project_pm(id));

CREATE OR REPLACE FUNCTION public.trg_projects_guard_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status
     AND auth.uid() IS NOT NULL
     AND NOT (is_stakeholder() OR is_project_pm(NEW.id)) THEN
    RAISE EXCEPTION 'only stakeholders and the project''s PMs change its status'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_guard_status ON public.projects;
CREATE TRIGGER projects_guard_status
  BEFORE UPDATE OF status ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trg_projects_guard_status();

-- 4. updated_at ---------------------------------------------------------------

DROP TRIGGER IF EXISTS projects_touch ON public.projects;
CREATE TRIGGER projects_touch
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5. PMs read processes ---------------------------------------------------------

DROP POLICY IF EXISTS "Processes read (PMs)" ON public.processes;
CREATE POLICY "Processes read (PMs)" ON public.processes
  FOR SELECT TO authenticated USING (is_pm());

COMMIT;

NOTIFY pgrst, 'reload schema';
