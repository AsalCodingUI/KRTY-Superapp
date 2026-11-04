-- Realtime for the shared work in projects: tasks, comments, phases and
-- steps, the team, reports, documents, the library and briefs, so what a
-- teammate (or a client filling a brief) changes shows up without a reload.
-- The app listens per project (INSERT / UPDATE filtered by project_id;
-- DELETE carries only the key, so it refreshes the open view). Idempotent.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'project_tasks', 'project_task_comments', 'project_steps',
    'project_phases', 'project_reports', 'project_documents',
    'project_files', 'project_folders', 'briefs', 'brief_files'
  ] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- Sharing Santuy (who presents when) too.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['santuy_weeks', 'santuy_members', 'santuy_settings'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;
