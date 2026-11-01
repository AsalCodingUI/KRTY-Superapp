-- Pictures and attachments in Aturan & Update documents: the same public
-- buckets as project notes (report-images, doc-files), in their own folder.
-- The folder is the nil UUID because the project policies on these buckets
-- cast the first folder to a uuid. Stakeholders write (they edit the rules);
-- everyone reads through the public URL.

DROP POLICY IF EXISTS "Policy doc files write" ON storage.objects;
CREATE POLICY "Policy doc files write" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id IN ('report-images', 'doc-files')
    AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
    AND is_stakeholder()
  )
  WITH CHECK (
    bucket_id IN ('report-images', 'doc-files')
    AND (storage.foldername(name))[1] = '00000000-0000-0000-0000-000000000000'
    AND is_stakeholder()
  );
