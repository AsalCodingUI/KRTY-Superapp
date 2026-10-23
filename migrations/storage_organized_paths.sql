-- Readable storage paths: project files live under
-- "<project-slug>--<project-uuid>/<library|dokumen>/<file-slug>.<ext>"
-- (old paths are just "<project-uuid>/..."). Access still comes from the
-- project id, now read from the end of the first folder. Files can also be
-- renamed/moved in place (UPDATE), which the app uses for "Ubah nama".

CREATE OR REPLACE FUNCTION public.storage_project_id(p_name text)
RETURNS uuid LANGUAGE sql IMMUTABLE AS $$
  SELECT substring(
    split_part(p_name, '/', 1)
    FROM '([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$'
  )::uuid
$$;

DROP POLICY IF EXISTS "Project files read" ON storage.objects;
CREATE POLICY "Project files read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'project-files'
         AND can_access_project(public.storage_project_id(name)));

DROP POLICY IF EXISTS "Project files upload" ON storage.objects;
CREATE POLICY "Project files upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files'
              AND can_access_project(public.storage_project_id(name)));

DROP POLICY IF EXISTS "Project files delete" ON storage.objects;
CREATE POLICY "Project files delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'project-files'
         AND can_access_project(public.storage_project_id(name)));

-- Rename/move stays inside the same project.
DROP POLICY IF EXISTS "Project files rename" ON storage.objects;
CREATE POLICY "Project files rename" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'project-files'
         AND can_access_project(public.storage_project_id(name)))
  WITH CHECK (bucket_id = 'project-files'
              AND can_access_project(public.storage_project_id(name)));
