-- Projects without phases ("Side Task", a retainer client): an ongoing
-- bucket of work that never finishes. Additive only: deployed code that
-- doesn't know `phases_off` still gets phases on every new project.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS phases_off boolean NOT NULL DEFAULT false;

-- New projects created "Tanpa fase": no default process, nothing seeded.
CREATE OR REPLACE FUNCTION public.trg_projects_default_process()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.process_id IS NULL AND NOT NEW.phases_off THEN
    SELECT id INTO NEW.process_id FROM processes WHERE is_default LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_projects_seed_phases()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.phases_off THEN
    RETURN NEW;
  END IF;
  IF NEW.process_id IS NOT NULL THEN
    PERFORM apply_process(NEW.id, NEW.process_id, false);
  ELSE
    PERFORM seed_project_phases(
      NEW.id,
      NEW.status::text NOT IN ('Planned', 'Active', 'Review')
    );
  END IF;
  RETURN NEW;
END;
$$;

-- "Jangan pakai fase": the project's phases go, their steps (and phase SLA
-- scores) with them; tasks stay, just without a phase (the FK sets
-- project_tasks.phase_id to NULL — done explicitly here as well).
CREATE OR REPLACE FUNCTION public.remove_project_phases(p_project_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT is_stakeholder() THEN
    RAISE EXCEPTION 'not allowed' USING ERRCODE = '42501';
  END IF;
  UPDATE project_tasks SET phase_id = NULL
   WHERE project_id = p_project_id AND phase_id IS NOT NULL;
  DELETE FROM project_phases WHERE project_id = p_project_id;
  UPDATE projects SET phases_off = true, process_id = NULL
   WHERE id = p_project_id;
END;
$$;
REVOKE ALL ON FUNCTION public.remove_project_phases(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.remove_project_phases(uuid) TO authenticated;

-- "Pakai fase" again (a process applied, or a phase added by hand): the
-- project uses phases once it has one.
CREATE OR REPLACE FUNCTION public.trg_project_phases_on()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE projects SET phases_off = false
   WHERE id = NEW.project_id AND phases_off;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS project_phases_on ON public.project_phases;
CREATE TRIGGER project_phases_on AFTER INSERT ON public.project_phases
  FOR EACH ROW EXECUTE FUNCTION trg_project_phases_on();
