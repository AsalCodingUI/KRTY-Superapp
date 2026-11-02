-- PMs manage the projects they're on: phases (add, rename, reorder, status,
-- due dates, delete, "Jangan pakai fase" / "Pakai fase", switching process),
-- the team (add, remove, role, lead) and the client portal (on/off, PIN).
-- "PM on a project" = is_project_pm(project_id): job_title 'Project Manager'
-- and a row in project_assignments for that project.
--
-- Still stakeholder-only: deleting the project, linking/editing the client,
-- invoices (PMs read), processes themselves, and removing a team member who
-- already has saved SLA / quality scores (that would erase them).
--
-- Additive: new policies next to the existing ones; the RPCs below keep
-- their bodies and only widen the permission check.

-- 1. Phases: project PMs write their project's phases. ------------------------

DROP POLICY IF EXISTS "Project PMs write" ON public.project_phases;
CREATE POLICY "Project PMs write" ON public.project_phases
  FOR ALL TO authenticated
  USING (is_project_pm(project_id))
  WITH CHECK (is_project_pm(project_id));

CREATE OR REPLACE FUNCTION public.reorder_project_phases(p_project_id uuid, p_ids uuid[])
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE v_active integer;
BEGIN
  IF NOT (is_stakeholder() OR is_project_pm(p_project_id)) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF (SELECT count(*) FROM project_phases WHERE project_id = p_project_id)
       <> coalesce(cardinality(p_ids), 0)
     OR (SELECT count(*) FROM project_phases
          WHERE project_id = p_project_id AND id = ANY (p_ids))
       <> (SELECT count(DISTINCT x) FROM unnest(p_ids) x) THEN
    RAISE EXCEPTION 'phase list does not match the project' USING ERRCODE = '22023';
  END IF;

  UPDATE project_phases SET position = -position - 1000
   WHERE project_id = p_project_id;
  UPDATE project_phases ph SET position = x.ord
    FROM unnest(p_ids) WITH ORDINALITY AS x(id, ord)
   WHERE ph.id = x.id;

  SELECT position INTO v_active FROM project_phases
   WHERE project_id = p_project_id AND status = 'active'
   ORDER BY position LIMIT 1;
  IF v_active IS NOT NULL THEN
    UPDATE project_phases SET
      status = CASE WHEN position < v_active THEN 'done'
                    WHEN position = v_active THEN 'active' ELSE 'todo' END,
      completed_at = CASE WHEN position < v_active
                          THEN coalesce(completed_at, now()) END
    WHERE project_id = p_project_id;
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.delete_project_phase(p_phase_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  ph project_phases%ROWTYPE;
  v_next uuid;
  v_ids uuid[];
BEGIN
  SELECT * INTO ph FROM project_phases WHERE id = p_phase_id;
  IF NOT (is_stakeholder() OR (FOUND AND is_project_pm(ph.project_id))) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF ph.id IS NULL THEN RETURN; END IF;

  IF ph.status = 'active' THEN
    SELECT id INTO v_next FROM project_phases
     WHERE project_id = ph.project_id AND id <> ph.id
     ORDER BY (position > ph.position) DESC,
              abs(position - ph.position)
     LIMIT 1;
    IF v_next IS NOT NULL THEN
      UPDATE project_phases SET status = 'active', completed_at = NULL
       WHERE id = v_next;
    END IF;
  END IF;

  DELETE FROM project_phases WHERE id = ph.id;
  SELECT array_agg(id ORDER BY position) INTO v_ids
    FROM project_phases WHERE project_id = ph.project_id;
  IF v_ids IS NOT NULL THEN
    PERFORM reorder_project_phases(ph.project_id, v_ids);
  END IF;
END;
$function$;

CREATE OR REPLACE FUNCTION public.remove_project_phases(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (is_stakeholder() OR is_project_pm(p_project_id)) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  UPDATE project_tasks SET phase_id = NULL
   WHERE project_id = p_project_id AND phase_id IS NOT NULL;
  DELETE FROM project_phases WHERE project_id = p_project_id;
  UPDATE projects SET phases_off = true, process_id = NULL
   WHERE id = p_project_id;
END;
$function$;

-- Seeding and now also replacing: a project PM switches their project's
-- process ("Ganti proses", "Pakai fase").
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
  IF auth.uid() IS NOT NULL
     AND NOT (is_stakeholder() OR is_project_pm(p_project_id)) THEN
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

-- 2. Team: project PMs remove members too (insert/update they already had),
-- except someone with saved scores (removing erases those). ------------------

-- Definer: the score tables' RLS hides scores from a PM who isn't the lead.
CREATE OR REPLACE FUNCTION public.assignment_has_scores(p_assignment_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM project_sla_scores WHERE assignment_id = p_assignment_id)
      OR EXISTS (SELECT 1 FROM project_work_quality_scores WHERE assignment_id = p_assignment_id)
$function$;

DROP POLICY IF EXISTS "Assignments delete (project PMs)" ON public.project_assignments;
CREATE POLICY "Assignments delete (project PMs)" ON public.project_assignments
  FOR DELETE TO authenticated
  USING (is_project_pm(project_id) AND NOT assignment_has_scores(id));

-- 3. Client portal: project PMs see it, turn it on/off and change the PIN. ----

DROP POLICY IF EXISTS "Project PMs read portals" ON public.project_portals;
CREATE POLICY "Project PMs read portals" ON public.project_portals
  FOR SELECT TO authenticated USING (is_project_pm(project_id));

CREATE OR REPLACE FUNCTION public.set_project_portal(p_project_id uuid, p_pin text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'extensions'
AS $function$
DECLARE
  v_token text;
BEGIN
  IF NOT (is_stakeholder() OR is_project_pm(p_project_id)) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  IF p_pin !~ '^[0-9]{6}$' THEN
    RAISE EXCEPTION 'pin' USING ERRCODE = '22023';
  END IF;
  INSERT INTO project_portals (project_id, token, pin_hash, created_by)
  VALUES (p_project_id, new_portal_code(), crypt(p_pin, gen_salt('bf')), auth.uid())
  ON CONFLICT (project_id) DO UPDATE
    SET pin_hash = crypt(p_pin, gen_salt('bf')),
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now()
  RETURNING token INTO v_token;
  RETURN v_token;
END;
$function$;

CREATE OR REPLACE FUNCTION public.disable_project_portal(p_project_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT (is_stakeholder() OR is_project_pm(p_project_id)) THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  DELETE FROM project_portals WHERE project_id = p_project_id;
END;
$function$;
