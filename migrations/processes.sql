-- Processes: reusable project templates (phases → steps → team tasks), e.g.
-- Branding, UI Design, Web Development. A new project copies its process
-- (or the default one); later template edits don't touch running projects.
-- Additive only: deployed code that inserts projects without process_id
-- still gets phases (from the default process).

CREATE TABLE IF NOT EXISTS public.processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> '' AND length(name) <= 80),
  description text CHECK (length(description) <= 500),
  is_default boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS processes_name_unique ON public.processes (lower(btrim(name)));
CREATE UNIQUE INDEX IF NOT EXISTS processes_one_default ON public.processes (is_default) WHERE is_default;

CREATE TABLE IF NOT EXISTS public.process_phases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processes(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (btrim(name) <> '' AND length(name) <= 80),
  description text CHECK (length(description) <= 500),
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS process_phases_process_idx ON public.process_phases (process_id, position);

-- What the client sees (a deliverable or milestone).
CREATE TABLE IF NOT EXISTS public.process_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_id uuid NOT NULL REFERENCES public.process_phases(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (btrim(title) <> '' AND length(title) <= 120),
  description text CHECK (length(description) <= 500),
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS process_steps_phase_idx ON public.process_steps (phase_id, position);

-- What the team does for a step (copied to project tasks).
CREATE TABLE IF NOT EXISTS public.process_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  step_id uuid NOT NULL REFERENCES public.process_steps(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (btrim(title) <> '' AND length(title) <= 200),
  position integer NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS process_tasks_step_idx ON public.process_tasks (step_id, position);

ALTER TABLE public.processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.process_tasks ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['processes','process_phases','process_steps','process_tasks'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Processes stakeholders" ON public.%I', t);
    EXECUTE format('CREATE POLICY "Processes stakeholders" ON public.%I FOR ALL TO authenticated USING (is_stakeholder()) WITH CHECK (is_stakeholder())', t);
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.touch_processes()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS processes_touch ON public.processes;
CREATE TRIGGER processes_touch BEFORE UPDATE ON public.processes
  FOR EACH ROW EXECUTE FUNCTION touch_processes();

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS process_id uuid REFERENCES public.processes(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS projects_process_id_idx ON public.projects (process_id);
ALTER TABLE public.project_steps ADD COLUMN IF NOT EXISTS description text;

-- Copies a process onto a project: phases, steps, and team tasks. With
-- p_replace the project's current phases, steps and unfinished phase tasks go
-- first (finished tasks stay, just without a phase).
CREATE OR REPLACE FUNCTION public.apply_process(
  p_project_id uuid, p_process_id uuid, p_replace boolean DEFAULT false
)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_done boolean;
  v_pos integer := 0;
  ph record;
  st record;
  v_phase uuid;
  v_step_pos integer;
BEGIN
  IF auth.uid() IS NOT NULL AND NOT is_stakeholder() THEN
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
$$;
REVOKE ALL ON FUNCTION public.apply_process(uuid, uuid, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.apply_process(uuid, uuid, boolean) TO authenticated;

-- New projects: no process chosen → the default one.
CREATE OR REPLACE FUNCTION public.trg_projects_default_process()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.process_id IS NULL THEN
    SELECT id INTO NEW.process_id FROM processes WHERE is_default LIMIT 1;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS projects_default_process ON public.projects;
CREATE TRIGGER projects_default_process BEFORE INSERT ON public.projects
  FOR EACH ROW EXECUTE FUNCTION trg_projects_default_process();

CREATE OR REPLACE FUNCTION public.trg_projects_seed_phases()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
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

-- Starter processes. "UI Design" matches the phases every project had so far.
DO $$
DECLARE
  v_proc uuid;
  v_phase uuid;
  v_step uuid;
  p jsonb;
  s jsonb;
  t text;
  pi integer;
  si integer;
  ti integer;
  def jsonb := '[
    {"name":"UI Design","default":true,"description":"Wireframe sampai handover desain aplikasi atau web.","phases":[
      {"name":"Wireframe","steps":[
        {"title":"Kickoff & brief","tasks":["Kumpulkan brief & referensi","Susun user flow"]},
        {"title":"Wireframe low-fi","tasks":["Buat wireframe halaman utama"]},
        {"title":"Review wireframe","tasks":[]}]},
      {"name":"High Fidelity","steps":[
        {"title":"Desain high-fidelity","tasks":["Siapkan style guide","Desain semua layar"]},
        {"title":"Prototype","tasks":["Hubungkan prototype interaktif"]},
        {"title":"Revisi","tasks":[]}]},
      {"name":"Handover","steps":[
        {"title":"Serah terima aset","tasks":["Rapikan file desain","Export aset & dokumentasi"]},
        {"title":"Invoice pelunasan","tasks":[]}]}]},
    {"name":"Branding","default":false,"description":"Riset sampai brand guideline.","phases":[
      {"name":"Discovery","steps":[
        {"title":"Proposal","tasks":[]},
        {"title":"Kontrak","tasks":[]},
        {"title":"Invoice DP","tasks":[]},
        {"title":"Workshop discovery","tasks":["Siapkan materi workshop","Rangkum hasil workshop"]}]},
      {"name":"Strategy","steps":[
        {"title":"Brand strategy","tasks":["Riset kompetitor","Susun positioning & tone of voice"]},
        {"title":"Moodboard","tasks":["Kumpulkan referensi visual"]}]},
      {"name":"Design","steps":[
        {"title":"Konsep logo","tasks":["Eksplorasi 3 arah konsep"]},
        {"title":"Identitas visual","tasks":["Warna, tipografi, elemen grafis"]},
        {"title":"Revisi","tasks":[]}]},
      {"name":"Delivery","steps":[
        {"title":"Brand guideline","tasks":["Susun dokumen guideline"]},
        {"title":"Serah terima file","tasks":["Export semua format logo"]},
        {"title":"Invoice pelunasan","tasks":[]}]}]},
    {"name":"Web Development","default":false,"description":"Dari desain siap sampai website live.","phases":[
      {"name":"Discovery","steps":[
        {"title":"Proposal & kontrak","tasks":[]},
        {"title":"Invoice DP","tasks":[]},
        {"title":"Sitemap & spesifikasi","tasks":["Susun sitemap","Tentukan stack & hosting"]}]},
      {"name":"Development","steps":[
        {"title":"Setup project","tasks":["Repo, CI, environment staging"]},
        {"title":"Implementasi halaman","tasks":["Slicing semua halaman","Integrasi CMS / API"]},
        {"title":"Demo staging","tasks":[]}]},
      {"name":"QA & Launch","steps":[
        {"title":"QA","tasks":["Uji responsif & browser","Cek performa & SEO dasar"]},
        {"title":"Go live","tasks":["Deploy production","Setup domain & analytics"]},
        {"title":"Invoice pelunasan","tasks":[]}]}]}
  ]';
BEGIN
  IF EXISTS (SELECT 1 FROM processes) THEN RETURN; END IF;
  FOR p IN SELECT * FROM jsonb_array_elements(def) LOOP
    INSERT INTO processes (name, description, is_default)
    VALUES (p->>'name', p->>'description', (p->>'default')::boolean)
    RETURNING id INTO v_proc;
    pi := 0;
    FOR s IN SELECT * FROM jsonb_array_elements(p->'phases') LOOP
      INSERT INTO process_phases (process_id, name, position)
      VALUES (v_proc, s->>'name', pi) RETURNING id INTO v_phase;
      pi := pi + 1;
      si := 0;
      FOR t IN SELECT value FROM jsonb_array_elements(s->'steps') LOOP
        INSERT INTO process_steps (phase_id, title, position)
        VALUES (v_phase, (t::jsonb)->>'title', si) RETURNING id INTO v_step;
        si := si + 1;
        INSERT INTO process_tasks (step_id, title, position)
        SELECT v_step, x.value, x.ord - 1
          FROM jsonb_array_elements_text((t::jsonb)->'tasks') WITH ORDINALITY AS x(value, ord);
      END LOOP;
    END LOOP;
  END LOOP;
END $$;

-- Existing projects already have the UI Design phases.
UPDATE public.projects SET process_id = (SELECT id FROM processes WHERE name = 'UI Design')
WHERE process_id IS NULL;
