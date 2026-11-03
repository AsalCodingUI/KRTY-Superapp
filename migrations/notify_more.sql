-- More notices. Additive and idempotent.
--   task_due            + "Tenggat hari ini" (the morning of the due day)
--   task_status         a task you're on moved to another column, by someone else
--   invoice_due         an unpaid invoice is due in 3 days / today / is overdue
--   invoice_paid        an invoice got fully paid
--   attendance_reminder not clocked in by 10:00 on a working day
-- Invoice notices go to stakeholders and the project's leads.

-- ---------------------------------------------------------------------------
-- task_due: the day before, the day itself, the day after.
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
      CASE
        WHEN t.due_date = v_today + 1 THEN 'Tenggat besok'
        WHEN t.due_date = v_today THEN 'Tenggat hari ini'
        ELSE 'Lewat tenggat'
      END AS kind
    FROM project_tasks t
    JOIN projects pr ON pr.id = t.project_id
    WHERE NOT t.done
      AND t.assignee_id IS NOT NULL
      AND t.due_date IN (v_today + 1, v_today, v_today - 1)
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

-- ---------------------------------------------------------------------------
-- task_status: someone else moved your task (board column or done).
CREATE OR REPLACE FUNCTION public.task_status_label(s text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE s
    WHEN 'todo' THEN 'Akan dikerjakan'
    WHEN 'in_progress' THEN 'Dikerjakan'
    WHEN 'review' THEN 'Review'
    WHEN 'done' THEN 'Selesai'
    ELSE coalesce(s, '-')
  END
$$;

CREATE OR REPLACE FUNCTION public.trg_project_tasks_notify_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_by text;
  v_project text;
BEGIN
  IF NEW.assignee_id IS NULL
     OR NEW.status IS NOT DISTINCT FROM OLD.status
     -- Your own move tells nobody; server jobs (no session) neither.
     OR auth.uid() IS NULL
     OR auth.uid() = NEW.assignee_id
     -- Reassigned in the same save: the new person gets "Tugas baru".
     OR NEW.assignee_id IS DISTINCT FROM OLD.assignee_id THEN
    RETURN NEW;
  END IF;

  SELECT coalesce(nullif(split_part(btrim(full_name), ' ', 1), ''), 'Seseorang')
    INTO v_by FROM profiles WHERE id = auth.uid();
  SELECT name INTO v_project FROM projects WHERE id = NEW.project_id;

  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.assignee_id,
    left(coalesce(v_by, 'Seseorang') || ' mindahin tugasmu ke ' || task_status_label(NEW.status), 120),
    left(NEW.title || ' · ' || coalesce(v_project, 'project') || ' · dari ' || task_status_label(OLD.status), 140),
    'task_status',
    '/projects/' || NEW.project_id || '/tasks?task=' || NEW.id
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_tasks_notify_status ON public.project_tasks;
CREATE TRIGGER project_tasks_notify_status
  AFTER UPDATE OF status ON public.project_tasks
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_tasks_notify_status();

-- ---------------------------------------------------------------------------
-- Invoices: who hears about a project's money.
CREATE OR REPLACE FUNCTION public.invoice_watchers(p_project uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE role = 'stakeholder'
  UNION
  SELECT a.user_id FROM project_assignments a
  WHERE a.project_id = p_project AND a.is_lead
$$;

CREATE OR REPLACE FUNCTION public.run_invoice_reminders()
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
    SELECT i.id, i.project_id, i.invoice_number, i.due_date, pr.name AS project,
      CASE
        WHEN i.due_date = v_today + 3 THEN 'Invoice jatuh tempo 3 hari lagi'
        WHEN i.due_date = v_today THEN 'Invoice jatuh tempo hari ini'
        ELSE 'Invoice lewat jatuh tempo'
      END AS kind
    FROM project_invoices i
    JOIN projects pr ON pr.id = i.project_id
    WHERE i.status IN ('Sent', 'Partial', 'Overdue')
      AND i.due_date IN (v_today + 3, v_today, v_today - 1)
  )
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT w.id,
    d.kind,
    left(d.invoice_number || ' · ' || d.project || ' · jatuh tempo ' || tgl_id(d.due_date), 140),
    'invoice_due',
    '/projects/' || d.project_id || '/invoices'
  FROM due d
  CROSS JOIN LATERAL invoice_watchers(d.project_id) AS w(id)
  WHERE NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = w.id AND n.type = 'invoice_due' AND n.title = d.kind
      AND n.message LIKE d.invoice_number || ' · %'
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_project_invoices_notify_paid()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_project text;
BEGIN
  IF NEW.status <> 'Paid' OR OLD.status IS NOT DISTINCT FROM 'Paid' THEN
    RETURN NEW;
  END IF;
  SELECT name INTO v_project FROM projects WHERE id = NEW.project_id;
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT w.id,
    'Invoice lunas',
    left(NEW.invoice_number || ' · ' || coalesce(v_project, 'project') || ' udah dibayar penuh', 140),
    'invoice_paid',
    '/projects/' || NEW.project_id || '/invoices'
  FROM invoice_watchers(NEW.project_id) AS w(id)
  -- Whoever marked it paid already knows.
  WHERE w.id IS DISTINCT FROM auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS project_invoices_notify_paid ON public.project_invoices;
CREATE TRIGGER project_invoices_notify_paid
  AFTER UPDATE OF status ON public.project_invoices
  FOR EACH ROW EXECUTE FUNCTION public.trg_project_invoices_notify_paid();

-- ---------------------------------------------------------------------------
-- attendance_reminder: 10:00 on a working day (Mon–Fri, not a company
-- holiday), not on approved leave, not clocked in yet. Only people who used
-- attendance in the last 30 days (so old accounts stay quiet).
CREATE OR REPLACE FUNCTION public.run_clock_in_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz constant text := 'Asia/Jakarta';
  v_today date := (now() AT TIME ZONE tz)::date;
  v_count integer;
BEGIN
  IF extract(isodow FROM v_today) > 5 THEN RETURN 0; END IF;
  IF EXISTS (
    SELECT 1 FROM calendar_events e
    WHERE e.event_type = 'Company Holiday'
      AND v_today BETWEEN (e.start_at AT TIME ZONE tz)::date
                      AND (coalesce(e.end_at, e.start_at) AT TIME ZONE tz - interval '1 second')::date
  ) THEN
    RETURN 0;
  END IF;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT p.id,
    'Belum clock in',
    'Udah mulai kerja? Jangan lupa clock in ya.',
    'attendance_reminder',
    '/leave'
  FROM profiles p
  WHERE EXISTS (
      SELECT 1 FROM attendance_logs l
      WHERE l.user_id = p.id AND l.date >= v_today - 30
    )
    AND NOT EXISTS (
      SELECT 1 FROM attendance_logs l
      WHERE l.user_id = p.id AND l.date = v_today
    )
    AND NOT EXISTS (
      SELECT 1 FROM leave_requests r
      WHERE r.user_id = p.id AND r.status::text = 'approved'
        -- WFH is still a working day: they clock in too.
        AND coalesce(r.leave_type, '') <> 'WFH'
        AND v_today BETWEEN r.start_date AND r.end_date
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = p.id AND n.type = 'attendance_reminder'
        AND (n.created_at AT TIME ZONE tz)::date = v_today
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

-- Schedules (UTC): invoices 08:00 WIB, clock-in 10:00 WIB.
SELECT cron.unschedule('invoice-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'invoice-reminders');
SELECT cron.schedule('invoice-reminders', '0 1 * * *', 'SELECT public.run_invoice_reminders()');

SELECT cron.unschedule('clock-in-reminders')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'clock-in-reminders');
SELECT cron.schedule('clock-in-reminders', '0 3 * * 1-5', 'SELECT public.run_clock_in_reminders()');
