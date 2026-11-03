-- Briefs (Dokumen): the questionnaire a client fills before a project
-- starts (UI Design, Branding, Development, or a mix), sent as a secret
-- link on the client site. It belongs to a client (at most two each) and,
-- once there is one, a project. The questions are copied into the brief
-- (`sections`), so each brief can be edited on its own; answers save as
-- the client types. Additive and idempotent.

CREATE TABLE IF NOT EXISTS public.briefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (btrim(title) <> '' AND length(title) <= 160),
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  -- The secret in the client's link (/b/<token>).
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'base64'),
  -- Question sets the client answers, and the ones offered to them
  -- ("Need branding too?") that they haven't taken or turned down yet.
  sets text[] NOT NULL DEFAULT '{}',
  offers text[] NOT NULL DEFAULT '{}',
  declined text[] NOT NULL DEFAULT '{}',
  sections jsonb NOT NULL DEFAULT '[]',
  answers jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'in_progress', 'submitted')),
  opened_at timestamptz,
  saved_at timestamptz,
  submitted_at timestamptz,
  created_by uuid DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- URL-safe token.
CREATE OR REPLACE FUNCTION public.trg_briefs_token()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.token := translate(NEW.token, '+/=', '-_');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS briefs_token ON public.briefs;
CREATE TRIGGER briefs_token BEFORE INSERT ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION public.trg_briefs_token();

DROP TRIGGER IF EXISTS briefs_touch ON public.briefs;
CREATE TRIGGER briefs_touch BEFORE UPDATE ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- At most two briefs per client (a second context, not a pile).
CREATE OR REPLACE FUNCTION public.trg_briefs_per_client()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (SELECT count(*) FROM briefs
       WHERE client_id = NEW.client_id AND id <> NEW.id) >= 2 THEN
    RAISE EXCEPTION 'a client has at most two briefs' USING ERRCODE = 'P0001';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS briefs_per_client ON public.briefs;
CREATE TRIGGER briefs_per_client BEFORE INSERT OR UPDATE OF client_id ON public.briefs
  FOR EACH ROW EXECUTE FUNCTION public.trg_briefs_per_client();

CREATE INDEX IF NOT EXISTS briefs_client_idx ON public.briefs (client_id);
CREATE INDEX IF NOT EXISTS briefs_project_idx ON public.briefs (project_id);

-- What the client uploaded (kept as sent, never recompressed). Copied into
-- the project's library ("Aset dari klien") once the brief has a project.
CREATE TABLE IF NOT EXISTS public.brief_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brief_id uuid NOT NULL REFERENCES public.briefs(id) ON DELETE CASCADE,
  question_id text,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  project_file_id uuid REFERENCES public.project_files(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brief_files_brief_idx ON public.brief_files (brief_id);

-- The team: stakeholders and PMs run briefs; a project's team reads the
-- ones on its project. Clients never touch these tables (the client site
-- reads and writes server side, by token).
ALTER TABLE public.briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brief_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Briefs managers" ON public.briefs;
CREATE POLICY "Briefs managers" ON public.briefs TO authenticated
  USING (is_stakeholder() OR is_pm()) WITH CHECK (is_stakeholder() OR is_pm());
DROP POLICY IF EXISTS "Briefs project team reads" ON public.briefs;
CREATE POLICY "Briefs project team reads" ON public.briefs FOR SELECT TO authenticated
  USING (project_id IS NOT NULL AND can_access_project(project_id));

DROP POLICY IF EXISTS "Brief files managers" ON public.brief_files;
CREATE POLICY "Brief files managers" ON public.brief_files TO authenticated
  USING (is_stakeholder() OR is_pm()) WITH CHECK (is_stakeholder() OR is_pm());
DROP POLICY IF EXISTS "Brief files project team reads" ON public.brief_files;
CREATE POLICY "Brief files project team reads" ON public.brief_files FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM briefs b WHERE b.id = brief_id
                 AND b.project_id IS NOT NULL AND can_access_project(b.project_id)));
