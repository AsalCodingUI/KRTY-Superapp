-- Notifications for project tasks, project leads and KPI.
-- Run after project_tasks_board.sql, kpi_phase_sla.sql and the existing
-- notification triggers (project_task_comments_notify,
-- project_assignments_notify_insert). Idempotent.
--
--   task_assigned  project_tasks: assignee set/changed      → new assignee
--   task_comment   project_task_comments insert             → task assignee + creator
--                  (minus the author and anyone @mentioned, who already get "mention")
--   task_due       daily 08:00 WIB: due tomorrow / overdue since yesterday → assignee
--   project_lead   project_assignments: is_lead false→true, or inserted as lead
--                  (the insert notice becomes the lead notice, so one message)
--   kpi_scored     project_work_quality_scores changed for a member → that member
--                  (at most one per member+project per hour)
--   kpi_locked     kpi_snapshots written for a locked quarter → every employee

-- "28 Okt"
CREATE OR REPLACE FUNCTION public.tgl_id(d date)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT extract(day FROM d)::int || ' ' ||
    (ARRAY['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'])
      [extract(month FROM d)::int];
$$;

-- "2026-Q3" → "Q3 2026"
CREATE OR REPLACE FUNCTION public.quarter_label(p text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p ~ '^\d{4}-Q[1-4]$'
    THEN split_part(p, '-', 2) || ' ' || split_part(p, '-', 1)
    ELSE p END;
$$;

-- ---------------------------------------------------------------------------
-- task_assigned
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_project_tasks_notify_assignee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor uuid;
  v_project text;
BEGIN
  IF NEW.assignee_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND NEW.assignee_id IS NOT DISTINCT FROM OLD.assignee_id THEN
    RETURN NEW;
  END IF;
  IF NEW.done THEN RETURN NEW; END IF;

  v_actor := coalesce(auth.uid(), CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by END);
  IF NEW.assignee_id = v_actor THEN RETURN NEW; END IF;

  SELECT name INTO v_project FROM projects WHERE id = NEW.project_id;

  PERFORM create_notification(
    NEW.assignee_id,
    'Tugas baru untukmu',
    left(
      NEW.title || ' · ' || coalesce(v_project, 'Project') ||
        CASE WHEN NEW.due_date IS NOT NULL THEN ' · tenggat ' || tgl_id(NEW.due_date) ELSE '' END,
      140),
    'task_assigned',
    '/projects/' || NEW.project_id || '/tasks?task=' || NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_tasks_notify_assignee ON public.project_tasks;
CREATE TRIGGER project_tasks_notify_assignee
  AFTER INSERT OR UPDATE OF assignee_id ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_tasks_notify_assignee();

-- ---------------------------------------------------------------------------
-- task_comment
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_project_task_comments_notify_followers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_task project_tasks%ROWTYPE;
  v_author text;
BEGIN
  SELECT * INTO v_task FROM project_tasks WHERE id = NEW.task_id;
  IF NOT FOUND THEN RETURN NEW; END IF;

  SELECT coalesce(nullif(btrim(full_name), ''), 'Seseorang') INTO v_author
  FROM profiles WHERE id = NEW.author_id;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT DISTINCT p.id,
    left(coalesce(v_author, 'Seseorang'), 28) || ' berkomentar',
    left(v_task.title || ' · ' || regexp_replace(btrim(NEW.body), '\s+', ' ', 'g'), 140),
    'task_comment',
    '/projects/' || v_task.project_id || '/tasks?task=' || v_task.id
  FROM unnest(ARRAY[v_task.assignee_id, v_task.created_by]) AS r(id)
  JOIN profiles p ON p.id = r.id
  WHERE p.id <> NEW.author_id
    -- @mentioned people already get the "mention" notice for this comment.
    AND NOT (p.id = ANY (coalesce(NEW.mentions, '{}')));

  RETURN NEW;
END;
$$;

-- project_task_comments is owned by supabase_admin, so postgres can create a
-- trigger on it but not drop one: create it only when missing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger
                 WHERE tgname = 'project_task_comments_notify_followers'
                   AND tgrelid = 'public.project_task_comments'::regclass) THEN
    CREATE TRIGGER project_task_comments_notify_followers
      AFTER INSERT ON public.project_task_comments
      FOR EACH ROW EXECUTE FUNCTION public.trg_project_task_comments_notify_followers();
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- task_due (daily)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.run_task_due_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_count integer;
BEGIN
  WITH due AS (
    SELECT t.id, t.project_id, t.title, t.due_date, t.assignee_id, pr.name AS project,
      CASE WHEN t.due_date = v_today + 1 THEN 'Tenggat besok' ELSE 'Lewat tenggat' END AS kind
    FROM project_tasks t
    JOIN projects pr ON pr.id = t.project_id
    WHERE NOT t.done
      AND t.assignee_id IS NOT NULL
      AND t.due_date IN (v_today + 1, v_today - 1)
  )
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT d.assignee_id,
    d.kind,
    left(d.title || ' · ' || d.project || ' · tenggat ' || tgl_id(d.due_date), 140),
    'task_due',
    '/projects/' || d.project_id || '/tasks?task=' || d.id
  FROM due d
  JOIN profiles p ON p.id = d.assignee_id
  -- Once per task per kind (and so a re-run the same day sends nothing).
  WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = d.assignee_id
      AND n.type = 'task_due'
      AND n.title = d.kind
      AND n.link = '/projects/' || d.project_id || '/tasks?task=' || d.id
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.run_task_due_reminders() FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'task-due-reminders';
-- 01:00 UTC = 08:00 WIB.
SELECT cron.schedule(
  'task-due-reminders',
  '0 1 * * *',
  $$SELECT public.run_task_due_reminders()$$
);

-- ---------------------------------------------------------------------------
-- project_lead
-- ---------------------------------------------------------------------------
-- Insert: one notice. Added as lead → the lead notice, else "ditambahkan".
CREATE OR REPLACE FUNCTION public.trg_project_assignments_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_name text;
BEGIN
  -- Adding yourself needs no notice.
  IF NEW.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  SELECT name INTO project_name FROM public.projects WHERE id = NEW.project_id;

  IF coalesce(NEW.is_lead, false) THEN
    PERFORM public.create_notification(
      NEW.user_id,
      'Kamu jadi lead project',
      COALESCE(project_name, 'Project') || ' · kamu ditambahkan sebagai lead',
      'project_lead',
      '/projects/' || NEW.project_id
    );
  ELSE
    PERFORM public.create_notification(
      NEW.user_id,
      'Kamu ditambahkan ke project',
      COALESCE(project_name, 'Project'),
      'project_assignment',
      '/projects/' || NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_project_assignments_notify_lead()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_name text;
BEGIN
  IF NOT coalesce(NEW.is_lead, false) OR coalesce(OLD.is_lead, false) THEN
    RETURN NEW;
  END IF;
  IF NEW.user_id = auth.uid() THEN
    RETURN NEW;
  END IF;

  SELECT name INTO project_name FROM public.projects WHERE id = NEW.project_id;

  PERFORM public.create_notification(
    NEW.user_id,
    'Kamu jadi lead project',
    COALESCE(project_name, 'Project'),
    'project_lead',
    '/projects/' || NEW.project_id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_assignments_notify_lead ON public.project_assignments;
CREATE TRIGGER project_assignments_notify_lead
  AFTER UPDATE OF is_lead ON public.project_assignments
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_assignments_notify_lead();

-- ---------------------------------------------------------------------------
-- kpi_scored
-- ---------------------------------------------------------------------------
-- save_assignment_scores() replaces a member's rows (DELETE then INSERT), so
-- the DELETE statement trigger remembers the state before the save (per
-- transaction, in krt.wq_prev) and the INSERT/UPDATE trigger compares the
-- state after it. Re-saving the same answers sends nothing.

-- Sorted [[competency_id, is_achieved], ...] of the rows given.
CREATE OR REPLACE FUNCTION public.wq_state(p_rows jsonb)
RETURNS jsonb
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT coalesce(jsonb_agg(jsonb_build_array(r ->> 'competency_id', coalesce((r ->> 'is_achieved')::boolean, false))
           ORDER BY r ->> 'competency_id'), '[]'::jsonb)
  FROM jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) r;
$$;

CREATE OR REPLACE FUNCTION public.notify_kpi_scored(p_assignment_id uuid, p_first boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid;
  v_project_id uuid;
  v_project text;
  v_quarter text;
  v_done int;
  v_total int;
  v_link text;
BEGIN
  SELECT pa.user_id, pa.project_id, pr.name, pr.quarter_id
    INTO v_user, v_project_id, v_project, v_quarter
  FROM project_assignments pa
  JOIN projects pr ON pr.id = pa.project_id
  WHERE pa.id = p_assignment_id;
  IF v_user IS NULL OR v_user = auth.uid() THEN RETURN; END IF;

  v_link := '/performance?period=' || v_quarter || '&project=' || v_project_id;

  -- At most one per member + project per hour.
  IF EXISTS (
    SELECT 1 FROM notifications
    WHERE user_id = v_user AND type = 'kpi_scored' AND link = v_link
      AND created_at > now() - interval '1 hour'
  ) THEN
    RETURN;
  END IF;

  SELECT count(*) FILTER (WHERE is_achieved), count(*) INTO v_done, v_total
  FROM project_work_quality_scores WHERE assignment_id = p_assignment_id;

  PERFORM create_notification(
    v_user,
    CASE WHEN p_first THEN 'Nilai kualitas project kamu sudah diisi'
         ELSE 'Nilai kualitas project kamu diperbarui' END,
    left(coalesce(v_project, 'Project') || ' · ' || quarter_label(v_quarter) || ' · ' ||
      v_done || '/' || v_total || ' kompetensi tercapai', 140),
    'kpi_scored',
    v_link
  );
END;
$$;

REVOKE ALL ON FUNCTION public.notify_kpi_scored(uuid, boolean) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_wq_scores_remember()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev jsonb := coalesce(nullif(current_setting('krt.wq_prev', true), '')::jsonb, '{}'::jsonb);
  r record;
BEGIN
  -- State before this delete = rows still there + rows just deleted.
  FOR r IN
    SELECT o.assignment_id,
      wq_state(jsonb_agg(to_jsonb(x))) AS state
    FROM (SELECT DISTINCT assignment_id FROM old_rows) o
    JOIN LATERAL (
      SELECT competency_id, is_achieved FROM project_work_quality_scores s
      WHERE s.assignment_id = o.assignment_id
      UNION ALL
      SELECT competency_id, is_achieved FROM old_rows d
      WHERE d.assignment_id = o.assignment_id
    ) x ON true
    GROUP BY o.assignment_id
  LOOP
    -- Keep the earliest state in the transaction.
    IF NOT v_prev ? r.assignment_id::text THEN
      v_prev := v_prev || jsonb_build_object(r.assignment_id::text, r.state);
    END IF;
  END LOOP;
  PERFORM set_config('krt.wq_prev', v_prev::text, true);
  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_wq_scores_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_prev jsonb := coalesce(nullif(current_setting('krt.wq_prev', true), '')::jsonb, '{}'::jsonb);
  v_before jsonb;
  v_after jsonb;
  r record;
BEGIN
  FOR r IN SELECT DISTINCT assignment_id FROM new_rows LOOP
    SELECT wq_state(jsonb_agg(to_jsonb(s))) INTO v_after
    FROM project_work_quality_scores s WHERE s.assignment_id = r.assignment_id;

    IF v_prev ? r.assignment_id::text THEN
      v_before := v_prev -> r.assignment_id::text;
      v_prev := v_prev - r.assignment_id::text;
    ELSIF TG_OP = 'UPDATE' THEN
      SELECT wq_state(jsonb_agg(to_jsonb(x))) INTO v_before FROM (
        SELECT competency_id, is_achieved FROM project_work_quality_scores s
        WHERE s.assignment_id = r.assignment_id
          AND s.id NOT IN (SELECT id FROM new_rows)
        UNION ALL
        SELECT competency_id, is_achieved FROM old_rows o
        WHERE o.assignment_id = r.assignment_id
      ) x;
    ELSE
      SELECT wq_state(jsonb_agg(to_jsonb(s))) INTO v_before
      FROM project_work_quality_scores s
      WHERE s.assignment_id = r.assignment_id
        AND s.id NOT IN (SELECT id FROM new_rows);
    END IF;

    IF v_after <> '[]'::jsonb AND v_after IS DISTINCT FROM v_before THEN
      PERFORM notify_kpi_scored(r.assignment_id, v_before = '[]'::jsonb);
    END IF;
  END LOOP;
  PERFORM set_config('krt.wq_prev', v_prev::text, true);
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS wq_scores_remember ON public.project_work_quality_scores;
CREATE TRIGGER wq_scores_remember
  AFTER DELETE ON public.project_work_quality_scores
  REFERENCING OLD TABLE AS old_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.trg_wq_scores_remember();

DROP TRIGGER IF EXISTS wq_scores_notify_insert ON public.project_work_quality_scores;
CREATE TRIGGER wq_scores_notify_insert
  AFTER INSERT ON public.project_work_quality_scores
  REFERENCING NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.trg_wq_scores_notify();

DROP TRIGGER IF EXISTS wq_scores_notify_update ON public.project_work_quality_scores;
CREATE TRIGGER wq_scores_notify_update
  AFTER UPDATE ON public.project_work_quality_scores
  REFERENCING OLD TABLE AS old_rows NEW TABLE AS new_rows
  FOR EACH STATEMENT EXECUTE FUNCTION public.trg_wq_scores_notify();

-- ---------------------------------------------------------------------------
-- kpi_locked
-- ---------------------------------------------------------------------------
-- lockPeriod() inserts the lock, then the snapshot, and drops the lock if the
-- snapshot fails, so the notice goes out on the snapshot insert (only once
-- the quarter is really closed).
CREATE OR REPLACE FUNCTION public.trg_kpi_snapshots_notify_locked()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  v_link text;
BEGIN
  FOR r IN
    SELECT l.period, l.locked_at, l.locked_by
    FROM kpi_period_locks l
    WHERE l.period IN (SELECT DISTINCT period FROM new_rows)
  LOOP
    v_link := '/performance?period=' || r.period;
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT p.id,
      'KPI ' || quarter_label(r.period) || ' dikunci',
      'Nilai KPI kamu untuk ' || quarter_label(r.period) || ' sudah final',
      'kpi_locked',
      v_link
    FROM profiles p
    WHERE p.role = 'employee'
      AND p.id IS DISTINCT FROM coalesce(auth.uid(), r.locked_by)
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = p.id AND n.type = 'kpi_locked' AND n.link = v_link
          AND n.created_at >= r.locked_at
      );
  END LOOP;
  RETURN NULL;
END;
$$;

-- kpi_snapshots is owned by supabase_admin (see above): create only when missing.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger
                 WHERE tgname = 'kpi_snapshots_notify_locked'
                   AND tgrelid = 'public.kpi_snapshots'::regclass) THEN
    CREATE TRIGGER kpi_snapshots_notify_locked
      AFTER INSERT ON public.kpi_snapshots
      REFERENCING NEW TABLE AS new_rows
      FOR EACH STATEMENT EXECUTE FUNCTION public.trg_kpi_snapshots_notify_locked();
  END IF;
END $$;
