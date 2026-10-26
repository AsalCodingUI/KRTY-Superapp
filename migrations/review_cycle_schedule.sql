-- 360 review cycles open and close on the admin's dates (WIB), and the
-- "360 dibuka" notice goes out when the window actually starts.
-- Run after performance_cleanup.sql and add_auto_clock_out.sql (pg_cron).
--
--   opened_notified_at   when "360 dibuka" went out for the current window
--                        (null = not yet; reset when the start moves ahead
--                        or the cycle is reopened)
--   closing_reminded_at  when the 3-days-left reminder went out
--
-- Replaces review_cycles_notify_insert, which notified on INSERT even for
-- a future start, and never on a reopen (UPDATE).

ALTER TABLE public.review_cycles
  ADD COLUMN IF NOT EXISTS opened_notified_at timestamptz,
  ADD COLUMN IF NOT EXISTS closing_reminded_at timestamptz;

-- "2026-Q4" -> "Q4 2026", as the app writes it.
CREATE OR REPLACE FUNCTION public.review_quarter_label(p_quarter text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN p_quarter ~ '^\d{4}-Q[1-4]$'
    THEN split_part(p_quarter, '-', 2) || ' ' || split_part(p_quarter, '-', 1)
    ELSE p_quarter END
$$;

-- "360 dibuka": employees to their own page, stakeholders to monitoring.
CREATE OR REPLACE FUNCTION public.notify_review_cycle_opened(
  p_quarter text,
  p_end timestamptz
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  until text := to_char(p_end AT TIME ZONE 'Asia/Jakarta', 'DD/MM');
  label text := public.review_quarter_label(p_quarter);
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT id,
         '360 review dibuka',
         'Periode 360 review ' || label || ' dibuka sampai ' || until ||
           '. Nilai rekan kerjamu.',
         'review_cycle',
         -- The cycle's own quarter: a reopened cycle can run into the next.
         '/performance?period=' || p_quarter
  FROM profiles WHERE role = 'employee';

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT id,
         '360 review dibuka',
         'Periode 360 review ' || label || ' berjalan sampai ' || until ||
           '. Pantau progresnya.',
         'review_cycle',
         '/performance/360-review'
  FROM profiles WHERE role = 'stakeholder';
END;
$$;

-- On save: a window that has started gets its notice now; one that starts
-- later (or a moved start) waits for the daily job.
CREATE OR REPLACE FUNCTION public.trg_review_cycles_schedule()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    -- Reopened, or the start moved: this is a new window to announce.
    IF (coalesce(NEW.is_active, false) AND NOT coalesce(OLD.is_active, false))
       OR NEW.start_date IS DISTINCT FROM OLD.start_date THEN
      NEW.opened_notified_at := NULL;
    END IF;
    IF NEW.end_date IS DISTINCT FROM OLD.end_date
       OR (coalesce(NEW.is_active, false) AND NOT coalesce(OLD.is_active, false)) THEN
      NEW.closing_reminded_at := NULL;
    END IF;
  END IF;

  IF coalesce(NEW.is_active, false)
     AND NEW.opened_notified_at IS NULL
     AND NEW.start_date <= now()
     AND NEW.end_date >= now() THEN
    PERFORM public.notify_review_cycle_opened(
      coalesce(NEW.quarter, NEW.name), NEW.end_date
    );
    NEW.opened_notified_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS review_cycles_notify_insert ON public.review_cycles;
DROP TRIGGER IF EXISTS review_cycles_schedule ON public.review_cycles;
CREATE TRIGGER review_cycles_schedule
BEFORE INSERT OR UPDATE ON public.review_cycles
FOR EACH ROW EXECUTE FUNCTION public.trg_review_cycles_schedule();

-- Daily (00:05 WIB): announce windows that started today, and remind
-- reviewers with reviews still to give 3 days before the close.
CREATE OR REPLACE FUNCTION public.run_review_cycle_schedule()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
  sent integer := 0;
BEGIN
  FOR c IN
    SELECT * FROM review_cycles
    WHERE is_active AND opened_notified_at IS NULL
      AND start_date <= now() AND end_date >= now()
    FOR UPDATE SKIP LOCKED
  LOOP
    PERFORM public.notify_review_cycle_opened(
      coalesce(c.quarter, c.name), c.end_date
    );
    UPDATE review_cycles SET opened_notified_at = now() WHERE id = c.id;
    sent := sent + 1;
  END LOOP;

  FOR c IN
    SELECT * FROM review_cycles
    WHERE is_active AND closing_reminded_at IS NULL
      AND start_date <= now()
      AND end_date >= now()
      AND end_date <= now() + interval '3 days'
      AND quarter IS NOT NULL
    FOR UPDATE SKIP LOCKED
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT pending.reviewer_id,
           '360 review segera ditutup',
           'Periode 360 review ' || public.review_quarter_label(c.quarter) ||
             ' ditutup ' ||
             to_char(c.end_date AT TIME ZONE 'Asia/Jakarta', 'DD/MM') ||
             '. Masih ada ' || pending.n || ' rekan yang belum kamu nilai.',
           'review_cycle',
           '/performance?period=' || c.quarter
    FROM (
      SELECT p.reviewer_id, count(*) AS n
      FROM public.review_pairs(c.quarter) p
      WHERE NOT EXISTS (
        SELECT 1 FROM performance_reviews r
        WHERE r.cycle_id = c.id
          AND r.reviewer_id = p.reviewer_id
          AND r.reviewee_id = p.reviewee_id
      )
      -- Processed results take no more reviews.
      AND NOT EXISTS (
        SELECT 1 FROM performance_summaries s
        WHERE s.cycle_id = c.id AND s.reviewee_id = p.reviewee_id
      )
      GROUP BY p.reviewer_id
    ) pending;
    UPDATE review_cycles SET closing_reminded_at = now() WHERE id = c.id;
    sent := sent + 1;
  END LOOP;

  RETURN sent;
END;
$$;

-- Cycles already announced before this migration shouldn't announce again.
UPDATE public.review_cycles
SET opened_notified_at = coalesce(opened_notified_at, created_at, now())
WHERE is_active AND start_date <= now();

CREATE EXTENSION IF NOT EXISTS pg_cron;
SELECT cron.unschedule(jobid) FROM cron.job WHERE jobname = 'review-cycle-schedule';
-- 17:05 UTC = 00:05 WIB.
SELECT cron.schedule(
  'review-cycle-schedule',
  '5 17 * * *',
  $$SELECT public.run_review_cycle_schedule()$$
);
