-- 360 review fixes (Oct 2026).
--
-- 1. performance_reviews.cycle_id was text while review_cycles.id is uuid.
--    Now uuid with a foreign key (a review can't point at a missing cycle).
-- 2. Summary scores come from the reviews, not from the n8n/AI step. The
--    AI only writes the feedback text; a trigger fills every number from the
--    reviews whenever a summary is written, so they can't drift or be
--    hallucinated. Same formula the summaries already used:
--      score_x            = avg(score_x), 1 decimal
--      overall_score      = avg of the five criterion averages, 2 decimals
--      overall_percentage = round(overall_score / 5 * 100)
--      total_user         = number of reviews
--    A review added after the summary exists refreshes those numbers too.
-- 3. performance_reviews.status means something: "pending" when submitted,
--    "processed" once a summary's feedback was written from it.
-- 4. Data: quarters follow the calendar. 2026-Q3 had been opened with
--    October dates; it gets its calendar dates and is closed. 2026-Q4 is the
--    open one, from the start the admin chose (20 Oct) to the quarter's end.
--
-- Run as one transaction (psql -1).

-- 1. cycle_id: text -> uuid ---------------------------------------------------
ALTER TABLE public.performance_reviews
  ALTER COLUMN cycle_id TYPE uuid USING cycle_id::uuid;

ALTER TABLE public.performance_reviews
  DROP CONSTRAINT IF EXISTS performance_reviews_cycle_id_fkey;
ALTER TABLE public.performance_reviews
  ADD CONSTRAINT performance_reviews_cycle_id_fkey
  FOREIGN KEY (cycle_id) REFERENCES public.review_cycles (id) ON DELETE CASCADE;

-- 2. Summary numbers from the reviews ----------------------------------------
CREATE OR REPLACE FUNCTION public.trg_performance_summaries_scores()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  a record;
BEGIN
  SELECT
    count(*) AS n,
    avg(score_quality) AS q,
    avg(score_reliability) AS rl,
    avg(score_communication) AS cm,
    avg(score_initiative) AS i,
    avg(score_leadership) AS l
  INTO a
  FROM performance_reviews
  WHERE reviewee_id = NEW.reviewee_id AND cycle_id = NEW.cycle_id;

  -- No reviews (shouldn't happen): keep whatever was written.
  IF a.n = 0 THEN
    RETURN NEW;
  END IF;

  NEW.score_quality := round(a.q, 1);
  NEW.score_reliability := round(a.rl, 1);
  NEW.score_communication := round(a.cm, 1);
  NEW.score_initiative := round(a.i, 1);
  NEW.score_leadership := round(a.l, 1);
  NEW.overall_score := round((a.q + a.rl + a.cm + a.i + a.l) / 5, 2);
  NEW.overall_percentage := round((a.q + a.rl + a.cm + a.i + a.l) / 5 / 5 * 100);
  NEW.total_user := a.n;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS performance_summaries_scores ON public.performance_summaries;
CREATE TRIGGER performance_summaries_scores
BEFORE INSERT OR UPDATE ON public.performance_summaries
FOR EACH ROW EXECUTE FUNCTION public.trg_performance_summaries_scores();

-- A review added, changed or removed after the summary exists: refresh the
-- numbers (the BEFORE trigger above recomputes them on this touch).
CREATE OR REPLACE FUNCTION public.trg_performance_reviews_refresh_summary()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record := coalesce(NEW, OLD);
BEGIN
  UPDATE performance_summaries
  SET updated_at = now()
  WHERE reviewee_id = r.reviewee_id AND cycle_id = r.cycle_id;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS performance_reviews_refresh_summary ON public.performance_reviews;
CREATE TRIGGER performance_reviews_refresh_summary
AFTER INSERT OR DELETE OR UPDATE OF
  score_quality, score_reliability, score_communication, score_initiative, score_leadership
ON public.performance_reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_performance_reviews_refresh_summary();

-- 3. Review status ------------------------------------------------------------
-- Only when the summary's feedback is written (by the AI step), not on the
-- number refresh above, so a late review stays "pending" until it is
-- processed again.
CREATE OR REPLACE FUNCTION public.trg_performance_summaries_mark_processed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE performance_reviews
  SET status = 'processed', updated_at = now()
  WHERE reviewee_id = NEW.reviewee_id
    AND cycle_id = NEW.cycle_id
    AND status IS DISTINCT FROM 'processed';
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS performance_summaries_mark_processed ON public.performance_summaries;
CREATE TRIGGER performance_summaries_mark_processed
AFTER INSERT OR UPDATE OF
  additional_feedback, feedback_continue, feedback_start, feedback_stop
ON public.performance_summaries
FOR EACH ROW EXECUTE FUNCTION public.trg_performance_summaries_mark_processed();

-- Backfill: reviews already turned into a summary.
UPDATE public.performance_reviews r
SET status = 'processed'
WHERE status IS DISTINCT FROM 'processed'
  AND EXISTS (
    SELECT 1 FROM public.performance_summaries s
    WHERE s.reviewee_id = r.reviewee_id AND s.cycle_id = r.cycle_id
  );

-- The old per-review stakeholder ping (its trigger was dropped in
-- performance_cleanup.sql); the function was left behind.
DROP FUNCTION IF EXISTS public.trg_performance_reviews_notify_insert();

-- 4. Data: calendar quarters, Q4 open ---------------------------------------
UPDATE public.review_cycles
SET start_date = '2026-07-01 00:00:00+07',
    end_date = '2026-09-30 23:59:59+07',
    is_active = false
WHERE quarter = '2026-Q3';

UPDATE public.review_cycles
SET start_date = '2026-10-20 00:00:00+07',
    end_date = '2026-12-31 23:59:59+07',
    is_active = true
WHERE quarter = '2026-Q4';
