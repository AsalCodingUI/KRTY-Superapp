-- Profile pictures: a public `avatars` bucket, one folder per person
-- (avatars/<profile id>/<file>). Anyone may look (public URL); a person
-- writes only their own folder, stakeholders write anyone's (Team page).
--
-- profiles needs nothing new: "Update Profiles" already lets a person
-- update their own row, and the guard_profile_changes trigger refuses a
-- non-stakeholder changing role, job_title, team, salary, dates, etc.
-- avatar_url (and full_name) are the only fields left open to them.
--
-- Additive: creates the bucket if missing and (re)creates only its own
-- policies.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5 MB; the app scales pictures to 512px first
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Listing / remove() look rows up first: let signed-in people see them
-- (the pictures are public anyway).
DROP POLICY IF EXISTS "Avatars read" ON storage.objects;
CREATE POLICY "Avatars read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Avatars upload" ON storage.objects;
CREATE POLICY "Avatars upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_stakeholder()
    )
  );

DROP POLICY IF EXISTS "Avatars update" ON storage.objects;
CREATE POLICY "Avatars update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_stakeholder()
    )
  )
  WITH CHECK (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_stakeholder()
    )
  );

DROP POLICY IF EXISTS "Avatars delete" ON storage.objects;
CREATE POLICY "Avatars delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (
      (storage.foldername(name))[1] = auth.uid()::text
      OR is_stakeholder()
    )
  );
