-- Realtime DELETE events carry the old row only as far as the table's
-- replica identity goes (by default: the primary key). With FULL, the old
-- row has project_id / task_id too, so the app can tell a delete in another
-- project from one in the project that's open, and refresh only for its own
-- (useRealtimeRefresh). Where Realtime still sends only the key (RLS
-- tables may), the app keeps refreshing as before. FULL makes each
-- UPDATE / DELETE log the whole old row: fine for tables this size.
-- Idempotent (setting FULL again is a no-op); missing tables are skipped.
DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'project_tasks', 'project_task_comments', 'project_steps',
    'project_phases', 'project_reports', 'project_documents',
    'project_files', 'project_folders', 'briefs', 'brief_files',
    'project_assignments'
  ] LOOP
    IF to_regclass(format('public.%I', t)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I REPLICA IDENTITY FULL', t);
    END IF;
  END LOOP;
END $$;
