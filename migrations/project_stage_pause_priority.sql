-- Projects: a work stage (what the team is doing now: Design, Development,
-- Branding…), a Paused status (on hold, not archived), and a manual order
-- for the list. Tasks: a priority. Additive and idempotent.

-- Paused sits between Review and Completed.
ALTER TYPE public.project_status_enum ADD VALUE IF NOT EXISTS 'Paused' AFTER 'Review';

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS stage text,
  ADD COLUMN IF NOT EXISTS position double precision;

-- 'design' reads "UI Design".
UPDATE public.projects SET stage = NULL
 WHERE stage IS NOT NULL AND stage NOT IN ('branding', 'design', 'development');
ALTER TABLE public.projects DROP CONSTRAINT IF EXISTS projects_stage_check;
ALTER TABLE public.projects ADD CONSTRAINT projects_stage_check CHECK (
  stage IS NULL OR stage IN ('branding', 'design', 'development')
);

ALTER TABLE public.project_tasks
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'none';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'project_tasks_priority_check'
  ) THEN
    ALTER TABLE public.project_tasks ADD CONSTRAINT project_tasks_priority_check
      CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent'));
  END IF;
END $$;

-- Reordering the list doesn't count as editing the project ("Terakhir
-- diubah" stays put).
CREATE OR REPLACE FUNCTION public.trg_projects_touch()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (to_jsonb(NEW) - 'position' - 'updated_at')
     = (to_jsonb(OLD) - 'position' - 'updated_at') THEN
    RETURN NEW;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS projects_touch ON public.projects;
CREATE TRIGGER projects_touch BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trg_projects_touch();

-- The list's manual order: ids top to bottom. Only rows the caller may edit
-- move (stakeholders, the project's PMs); RLS applies (security invoker).
CREATE OR REPLACE FUNCTION public.reorder_projects(p_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY INVOKER
SET search_path = public
AS $$
  UPDATE projects p
     SET position = o.ord * 1024
    FROM unnest(p_ids) WITH ORDINALITY AS o(id, ord)
   WHERE p.id = o.id
     AND p.position IS DISTINCT FROM o.ord * 1024;
$$;

GRANT EXECUTE ON FUNCTION public.reorder_projects(uuid[]) TO authenticated;
