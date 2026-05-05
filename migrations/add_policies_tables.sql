CREATE TABLE IF NOT EXISTS public.policy_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  category text NOT NULL,
  summary text,
  owner_role text,
  current_version_id uuid,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.policy_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  version_number text NOT NULL,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Published', 'Archived')),
  title text NOT NULL,
  summary text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  change_summary text,
  effective_at timestamptz,
  published_at timestamptz,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, version_number)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'policy_documents_current_version_id_fkey'
  ) THEN
    ALTER TABLE public.policy_documents
      ADD CONSTRAINT policy_documents_current_version_id_fkey
      FOREIGN KEY (current_version_id)
      REFERENCES public.policy_versions(id)
      ON DELETE SET NULL;
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_policy_documents_category
  ON public.policy_documents(category);

CREATE INDEX IF NOT EXISTS idx_policy_versions_document_id
  ON public.policy_versions(document_id);

CREATE INDEX IF NOT EXISTS idx_policy_versions_status
  ON public.policy_versions(status);

CREATE OR REPLACE FUNCTION public.touch_policy_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_policy_documents_updated_at
ON public.policy_documents;

CREATE TRIGGER set_policy_documents_updated_at
BEFORE UPDATE ON public.policy_documents
FOR EACH ROW
EXECUTE FUNCTION public.touch_policy_updated_at();

DROP TRIGGER IF EXISTS set_policy_versions_updated_at
ON public.policy_versions;

CREATE TRIGGER set_policy_versions_updated_at
BEFORE UPDATE ON public.policy_versions
FOR EACH ROW
EXECUTE FUNCTION public.touch_policy_updated_at();

ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can view policy documents"
ON public.policy_documents;

CREATE POLICY "Authenticated users can view policy documents"
ON public.policy_documents FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Stakeholders can manage policy documents"
ON public.policy_documents;

CREATE POLICY "Stakeholders can manage policy documents"
ON public.policy_documents FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'stakeholder'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'stakeholder'
  )
);

DROP POLICY IF EXISTS "Authenticated users can view policy versions"
ON public.policy_versions;

CREATE POLICY "Authenticated users can view policy versions"
ON public.policy_versions FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Stakeholders can manage policy versions"
ON public.policy_versions;

CREATE POLICY "Stakeholders can manage policy versions"
ON public.policy_versions FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'stakeholder'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND profiles.role = 'stakeholder'
  )
);

INSERT INTO public.user_page_permissions (user_id, page_slug, granted, granted_by)
SELECT p.id, '/policies', true, NULL
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1
  FROM public.user_page_permissions upp
  WHERE upp.user_id = p.id
    AND upp.page_slug = '/policies'
)
AND (
  p.role = 'stakeholder'
  OR p.role = 'employee'
);
