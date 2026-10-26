-- Overdue invoice reminders for the team (not the client).
--   run_invoice_reminders(): once a day (08:00 Asia/Jakarta)
--     1. unpaid Sent/Partial invoices past their due date become Overdue;
--     2. stakeholders and the project's leads (PM) get an 'invoice_due'
--        notification the first day it is overdue and every 7 days after
--        that. At most one per person, invoice and day, so a re-run (or a
--        manual call) never doubles up.
-- Run after invoice_builder.sql and add_auto_clock_out.sql (pg_cron).

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- The daily scan only looks at unpaid invoices.
CREATE INDEX IF NOT EXISTS project_invoices_open_due_idx
  ON public.project_invoices (due_date)
  WHERE status IN ('Sent', 'Partial', 'Overdue');

-- Same-day duplicate check below.
CREATE INDEX IF NOT EXISTS notifications_invoice_due_idx
  ON public.notifications (user_id, link, created_at)
  WHERE type = 'invoice_due';

CREATE OR REPLACE FUNCTION public.run_invoice_reminders()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz constant text := 'Asia/Jakarta';
  today date := (now() AT TIME ZONE tz)::date;
  day_start timestamptz := (today::timestamp) AT TIME ZONE tz;
  r record;
  days integer;
  left_to_pay numeric;
  v_title text;
  v_msg text;
  v_link text;
  sent integer := 0;
  n integer;
BEGIN
  -- 1. Past due and still unpaid → Overdue.
  UPDATE project_invoices SET status = 'Overdue', updated_at = now()
  WHERE status IN ('Sent', 'Partial')
    AND due_date < today
    AND coalesce(amount_paid_idr, 0) < coalesce(amount_idr, 0);

  -- 2. Notify about invoices at a reminder point today.
  FOR r IN
    SELECT i.id, i.project_id, i.invoice_number, i.due_date, i.currency,
           i.amount_idr, i.amount_paid_idr, p.name AS project_name
    FROM project_invoices i
    JOIN projects p ON p.id = i.project_id
    WHERE i.status IN ('Sent', 'Partial', 'Overdue')
      AND coalesce(i.amount_paid_idr, 0) < coalesce(i.amount_idr, 0)
      AND i.due_date < today
  LOOP
    days := r.due_date - today;
    CONTINUE WHEN (-days - 1) % 7 <> 0;

    left_to_pay := greatest(0, coalesce(r.amount_idr, 0) - coalesce(r.amount_paid_idr, 0));
    v_title := 'Invoice lewat jatuh tempo';
    v_msg := format(
      '%s (%s) · sisa %s %s · jatuh tempo %s (telat %s hari). Tolong follow up ke klien.',
      r.invoice_number,
      r.project_name,
      coalesce(r.currency, 'IDR'),
      to_char(left_to_pay, 'FM999G999G999G990'),
      to_char(r.due_date, 'DD/MM/YYYY'),
      -days
    );
    v_link := format('/projects/%s/invoices?invoice=%s', r.project_id, r.id);

    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT people.user_id, v_title, v_msg, 'invoice_due', v_link
    FROM (
      SELECT pr.id AS user_id FROM profiles pr
      WHERE pr.role = 'stakeholder'::app_role OR coalesce(pr.is_super_admin, false)
      UNION
      SELECT pa.user_id FROM project_assignments pa
      WHERE pa.project_id = r.project_id AND coalesce(pa.is_lead, false)
    ) people
    WHERE NOT EXISTS (
      SELECT 1 FROM notifications nt
      WHERE nt.user_id = people.user_id
        AND nt.type = 'invoice_due'
        AND nt.link = v_link
        AND nt.created_at >= day_start
    );
    GET DIAGNOSTICS n = ROW_COUNT;
    sent := sent + n;
  END LOOP;

  RETURN sent;
END;
$$;

REVOKE ALL ON FUNCTION public.run_invoice_reminders() FROM PUBLIC, anon, authenticated;

-- 01:00 UTC = 08:00 Asia/Jakarta.
DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'invoice-reminders';
  PERFORM cron.schedule('invoice-reminders', '0 1 * * *', 'SELECT public.run_invoice_reminders()');
END $$;
