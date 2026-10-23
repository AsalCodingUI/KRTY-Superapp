-- Running projects can change their phases (add, rename, reorder, delete),
-- not just the process template. Positions are unique per project, so
-- reordering goes through negative temporaries in one function.

-- Puts the project's phases in p_ids order (positions 1..n) and keeps one
-- linear flow: phases before the active one done, after it to do.
CREATE OR REPLACE FUNCTION public.reorder_project_phases(
  p_project_id uuid, p_ids uuid[]
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_active integer;
BEGIN
  IF NOT is_stakeholder() THEN
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
$$;

-- Deletes a phase (its steps go with it; its tasks stay without a phase).
-- The active phase hands over to the next one (or the previous one).
CREATE OR REPLACE FUNCTION public.delete_project_phase(p_phase_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  ph project_phases%ROWTYPE;
  v_next uuid;
  v_ids uuid[];
BEGIN
  IF NOT is_stakeholder() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO ph FROM project_phases WHERE id = p_phase_id;
  IF NOT FOUND THEN RETURN; END IF;

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
$$;

REVOKE ALL ON FUNCTION public.reorder_project_phases(uuid, uuid[]) FROM public, anon;
REVOKE ALL ON FUNCTION public.delete_project_phase(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.reorder_project_phases(uuid, uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_project_phase(uuid) TO authenticated;
