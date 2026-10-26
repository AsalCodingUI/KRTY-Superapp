-- Files dropped into a project's notes, reports or task descriptions (PDF,
-- video, documents…), linked from the text. Public bucket with random
-- folder names, like report-images, so a report shared with a client can
-- link them; written by the project's team only. 50 MB each. Idempotent.
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('doc-files', 'doc-files', true, 52428800)
ON CONFLICT (id) DO UPDATE SET public = true,
  file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "Doc files upload" ON storage.objects;
CREATE POLICY "Doc files upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'doc-files'
    AND can_access_project(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Doc files read" ON storage.objects;
CREATE POLICY "Doc files read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'doc-files'
    AND can_access_project(((storage.foldername(name))[1])::uuid)
  );

DROP POLICY IF EXISTS "Doc files delete" ON storage.objects;
CREATE POLICY "Doc files delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'doc-files'
    AND can_access_project(((storage.foldername(name))[1])::uuid)
  );
