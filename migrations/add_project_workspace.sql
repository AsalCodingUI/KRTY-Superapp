-- Project workspace (DesignerHQ-style project detail, internal only).
--   phases     Wireframe -> High Fidelity -> Handover (the SLA milestones),
--              one row each per project, status todo / active / done
--   steps      the process inside a phase (draft / done)
--   tasks      project to-dos with assignee, due date, phase, subtasks
--   documents  uploaded proposals / contracts / other with a status
--   folders + files  the project library
--   client     contact fields on projects
-- Access: stakeholders everything; project members read everything and
-- work on steps, tasks and library files. Files live in the private
-- 'project-files' bucket under <project_id>/...

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_name text,
  ADD COLUMN IF NOT EXISTS client_contact text,
  ADD COLUMN IF NOT EXISTS client_email text,
  ADD COLUMN IF NOT EXISTS client_phone text;

CREATE OR REPLACE FUNCTION public.can_access_project(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT is_stakeholder() OR is_project_member(p_project_id) $$;

-- phases ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL,
  position int NOT NULL,
  status text NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'active', 'done')),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, position)
);

CREATE OR REPLACE FUNCTION public.seed_project_phases(p_project_id uuid, p_done boolean)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO project_phases (project_id, name, position, status, completed_at)
  SELECT p_project_id, v.name, v.position,
         CASE WHEN p_done THEN 'done' WHEN v.position = 1 THEN 'active' ELSE 'todo' END,
         CASE WHEN p_done THEN now() END
  FROM (VALUES ('Wireframe', 1), ('High Fidelity', 2), ('Handover', 3)) AS v(name, position)
  ON CONFLICT (project_id, position) DO NOTHING;
$$;

CREATE OR REPLACE FUNCTION public.trg_projects_seed_phases()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM seed_project_phases(NEW.id, NEW.status <> 'Active');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS projects_seed_phases ON public.projects;
CREATE TRIGGER projects_seed_phases AFTER INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.trg_projects_seed_phases();

SELECT seed_project_phases(id, status <> 'Active') FROM public.projects;

-- steps ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid NOT NULL REFERENCES public.project_phases(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'done')),
  position int NOT NULL DEFAULT 0,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_steps_phase_idx ON public.project_steps (phase_id, position);

-- tasks ----------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  phase_id uuid REFERENCES public.project_phases(id) ON DELETE SET NULL,
  parent_id uuid REFERENCES public.project_tasks(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (length(trim(title)) > 0),
  assignee_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date date,
  done boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_tasks_project_idx ON public.project_tasks (project_id, done, due_date);

-- documents ------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  kind text NOT NULL DEFAULT 'other' CHECK (kind IN ('proposal', 'contract', 'other')),
  title text NOT NULL CHECK (length(trim(title)) > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'approved', 'signed')),
  file_path text,
  file_name text,
  file_size bigint,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- library --------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.project_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (length(trim(name)) > 0),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, name)
);

CREATE TABLE IF NOT EXISTS public.project_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES public.project_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  file_size bigint,
  mime_type text,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS project_files_folder_idx ON public.project_files (project_id, folder_id);

-- RLS ------------------------------------------------------------------------
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['project_phases','project_steps','project_tasks','project_documents','project_folders','project_files'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Project team reads" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Project team reads" ON public.%I FOR SELECT TO authenticated USING (can_access_project(project_id))', t);
  END LOOP;

  -- The team works on steps, tasks and the library.
  FOREACH t IN ARRAY ARRAY['project_steps','project_tasks','project_folders','project_files'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Project team writes" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Project team writes" ON public.%I FOR ALL TO authenticated USING (can_access_project(project_id)) WITH CHECK (can_access_project(project_id))', t);
  END LOOP;

  -- Phases and documents are managed by stakeholders.
  FOREACH t IN ARRAY ARRAY['project_phases','project_documents'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Stakeholders write" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Stakeholders write" ON public.%I FOR ALL TO authenticated USING (is_stakeholder()) WITH CHECK (is_stakeholder())', t);
  END LOOP;
END $$;

-- storage --------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('project-files', 'project-files', false, 52428800)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Project files read" ON storage.objects;
CREATE POLICY "Project files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-files'
         AND public.can_access_project(((storage.foldername(name))[1])::uuid));
DROP POLICY IF EXISTS "Project files upload" ON storage.objects;
CREATE POLICY "Project files upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files'
              AND public.can_access_project(((storage.foldername(name))[1])::uuid));
DROP POLICY IF EXISTS "Project files delete" ON storage.objects;
CREATE POLICY "Project files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files'
         AND public.can_access_project(((storage.foldername(name))[1])::uuid));
