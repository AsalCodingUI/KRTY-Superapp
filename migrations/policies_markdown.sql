-- Aturan (office rules) in Markdown with immutable published versions.
-- Reuses policy_documents / policy_versions from add_policies_tables.sql.
--
-- A document has at most one Draft version (editable by stakeholders) and any
-- number of Published versions (history, never edited). publish_policy()
-- turns the draft into the next numbered version.

ALTER TABLE public.policy_versions
  ADD COLUMN IF NOT EXISTS body text NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS policy_versions_one_draft
  ON public.policy_versions (document_id) WHERE status = 'Draft';

-- Readable by everyone once published and not archived.
CREATE OR REPLACE FUNCTION public.policy_is_live(p_document_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM policy_documents
    WHERE id = p_document_id
      AND archived_at IS NULL
      AND current_version_id IS NOT NULL
  );
$$;

DROP POLICY IF EXISTS "Authenticated users can view policy documents" ON public.policy_documents;
DROP POLICY IF EXISTS "Stakeholders can manage policy documents" ON public.policy_documents;
DROP POLICY IF EXISTS "Authenticated users can view policy versions" ON public.policy_versions;
DROP POLICY IF EXISTS "Stakeholders can manage policy versions" ON public.policy_versions;

CREATE POLICY "Policy documents read" ON public.policy_documents
  FOR SELECT TO authenticated
  USING (is_stakeholder() OR (archived_at IS NULL AND current_version_id IS NOT NULL));
CREATE POLICY "Policy documents write" ON public.policy_documents
  FOR ALL TO authenticated
  USING (is_stakeholder()) WITH CHECK (is_stakeholder());

-- Employees never see drafts.
CREATE POLICY "Policy versions read" ON public.policy_versions
  FOR SELECT TO authenticated
  USING (is_stakeholder() OR (status = 'Published' AND policy_is_live(document_id)));
-- Direct writes only touch the draft; publishing goes through publish_policy().
CREATE POLICY "Policy versions write draft" ON public.policy_versions
  FOR ALL TO authenticated
  USING (is_stakeholder() AND status = 'Draft')
  WITH CHECK (is_stakeholder() AND status = 'Draft');

-- Published versions are history: no edits, whoever asks.
CREATE OR REPLACE FUNCTION public.policy_versions_freeze()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF OLD.status = 'Published' THEN
    RAISE EXCEPTION 'Versi yang sudah terbit tidak bisa diubah';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS policy_versions_freeze ON public.policy_versions;
CREATE TRIGGER policy_versions_freeze BEFORE UPDATE ON public.policy_versions
  FOR EACH ROW EXECUTE FUNCTION policy_versions_freeze();

CREATE OR REPLACE FUNCTION public.publish_policy(
  p_document_id uuid,
  p_change_summary text,
  p_effective_at timestamptz DEFAULT NULL,
  p_notify boolean DEFAULT false
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_draft policy_versions%ROWTYPE;
  v_next int;
  v_first boolean;
BEGIN
  IF NOT is_stakeholder() THEN
    RAISE EXCEPTION 'Hanya admin yang bisa menerbitkan aturan';
  END IF;

  SELECT * INTO v_draft FROM policy_versions
  WHERE document_id = p_document_id AND status = 'Draft'
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tidak ada draf untuk diterbitkan';
  END IF;
  IF btrim(v_draft.title) = '' OR btrim(v_draft.body) = '' THEN
    RAISE EXCEPTION 'Judul dan isi aturan wajib diisi';
  END IF;

  SELECT count(*) = 0, coalesce(max(version_number::int), 0) + 1
    INTO v_first, v_next
  FROM policy_versions
  WHERE document_id = p_document_id AND status = 'Published';

  IF NOT v_first AND coalesce(btrim(p_change_summary), '') = '' THEN
    RAISE EXCEPTION 'Tulis apa yang berubah di versi ini';
  END IF;

  -- The freeze trigger only blocks rows that are already Published.
  UPDATE policy_versions SET
    status = 'Published',
    version_number = v_next::text,
    change_summary = nullif(btrim(coalesce(p_change_summary, '')), ''),
    effective_at = coalesce(p_effective_at, now()),
    published_at = now(),
    created_by = coalesce(created_by, auth.uid())
  WHERE id = v_draft.id;

  UPDATE policy_documents SET
    current_version_id = v_draft.id,
    title = v_draft.title,
    summary = v_draft.summary,
    archived_at = NULL
  WHERE id = p_document_id;

  IF p_notify THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT p.id,
      CASE WHEN v_first THEN 'Aturan baru' ELSE 'Aturan diperbarui' END,
      v_draft.title || coalesce(' · ' || nullif(btrim(coalesce(p_change_summary, '')), ''), ''),
      'policy',
      '/policies/' || p_document_id
    FROM profiles p
    WHERE p.id <> coalesce(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;

  RETURN v_draft.id;
END;
$$;

REVOKE ALL ON FUNCTION public.publish_policy(uuid, text, timestamptz, boolean) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.publish_policy(uuid, text, timestamptz, boolean) TO authenticated;
