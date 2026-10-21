-- Performance cleanup (audit, Oct 2026).
--
-- 1. review_cycles: drop the six empty legacy cycles (no reviews, no
--    summaries), add an explicit `quarter` (unique) so a cycle is no longer
--    looked up by its free-text name.
-- 2. performance_reviews: one review per reviewer/reviewee/cycle, leadership
--    score 1-5 like the others, indexes for the monitoring screen.
-- 3. save_assignment_scores(): saves a member's SLA + competency scores for a
--    project in one transaction (it used to delete first and then insert, so a
--    failed insert lost the old scores). Runs with the caller's rights, so the
--    score RLS (stakeholders, or the project lead for others) still applies.
-- 4. Notifications: Indonesian copy, WIB times, and far fewer of them.
--    - new 1:1 slot: employees only, at most once per 12 hours each
--    - booking: organizer + booker (no stakeholder broadcast)
--    - cancel / reschedule / release now notify the other side
--    - 360 cycle opened: employees only
--    - each submitted 360 review no longer pings every stakeholder
--    - 360 result ready: the reviewee only

-- 1. review cycles ------------------------------------------------------------
DELETE FROM public.review_cycles c
WHERE NOT EXISTS (SELECT 1 FROM public.performance_reviews r WHERE r.cycle_id = c.id::text)
  AND NOT EXISTS (SELECT 1 FROM public.performance_summaries s WHERE s.cycle_id = c.id)
  AND c.is_active = false;

ALTER TABLE public.review_cycles ADD COLUMN IF NOT EXISTS quarter text;
UPDATE public.review_cycles SET quarter = name
WHERE quarter IS NULL AND name ~ '^\d{4}-Q[1-4]$';
CREATE UNIQUE INDEX IF NOT EXISTS review_cycles_quarter_key
  ON public.review_cycles (quarter);
ALTER TABLE public.review_cycles DROP CONSTRAINT IF EXISTS review_cycles_quarter_format;
ALTER TABLE public.review_cycles ADD CONSTRAINT review_cycles_quarter_format
  CHECK (quarter IS NULL OR quarter ~ '^\d{4}-Q[1-4]$');

-- 2. reviews ------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS performance_reviews_once_per_cycle
  ON public.performance_reviews (cycle_id, reviewer_id, reviewee_id);
CREATE INDEX IF NOT EXISTS performance_reviews_reviewee_idx
  ON public.performance_reviews (cycle_id, reviewee_id);
ALTER TABLE public.performance_reviews DROP CONSTRAINT IF EXISTS performance_reviews_score_leadership_check;
ALTER TABLE public.performance_reviews ADD CONSTRAINT performance_reviews_score_leadership_check
  CHECK (score_leadership BETWEEN 1 AND 5);

-- 3. atomic score save --------------------------------------------------------
CREATE OR REPLACE FUNCTION public.save_assignment_scores(
  p_assignment_id uuid,
  p_sla jsonb,
  p_quality jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  total_weight numeric;
BEGIN
  IF NOT can_score_assignment(p_assignment_id) THEN
    RAISE EXCEPTION 'Kamu tidak bisa menilai anggota ini' USING ERRCODE = '42501';
  END IF;

  IF p_sla IS NOT NULL THEN
    SELECT coalesce(sum((m ->> 'weight')::numeric), 0) INTO total_weight
    FROM jsonb_array_elements(p_sla) m;
    IF jsonb_array_length(p_sla) > 0 AND total_weight <> 100 THEN
      RAISE EXCEPTION 'Total bobot milestone harus 100%% (sekarang %)', total_weight
        USING ERRCODE = '22023';
    END IF;

    DELETE FROM project_sla_scores WHERE assignment_id = p_assignment_id;
    INSERT INTO project_sla_scores (
      assignment_id, milestone_name, weight_percentage, actual_result,
      score_achieved, score_target, target_percentage
    )
    SELECT p_assignment_id,
           m ->> 'name',
           (m ->> 'weight')::numeric,
           m ->> 'result',
           (m ->> 'weight')::numeric * CASE m ->> 'result'
             WHEN 'Faster' THEN 120 WHEN 'Delay' THEN 80 ELSE 100 END,
           (m ->> 'weight')::numeric * 100,
           100
    FROM jsonb_array_elements(p_sla) m;
  END IF;

  IF p_quality IS NOT NULL THEN
    DELETE FROM project_work_quality_scores WHERE assignment_id = p_assignment_id;
    INSERT INTO project_work_quality_scores (assignment_id, competency_id, is_achieved)
    SELECT p_assignment_id, (q ->> 'competencyId')::uuid, (q ->> 'isAchieved')::boolean
    FROM jsonb_array_elements(p_quality) q;
  END IF;
END;
$$;
REVOKE ALL ON FUNCTION public.save_assignment_scores(uuid, jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_assignment_scores(uuid, jsonb, jsonb) TO authenticated;

-- 4. notifications ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.wib(ts timestamptz)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT to_char(ts AT TIME ZONE 'Asia/Jakarta', 'DD/MM, HH24:MI') || ' WIB';
$$;

CREATE OR REPLACE FUNCTION public.trg_one_on_one_slots_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'open' THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT p.id,
           'Slot 1:1 baru',
           'Ada slot 1:1 baru, mulai ' || wib(NEW.start_at) || '. Pilih jadwalmu di Jadwal 1:1.',
           'one_on_one',
           '/performance/one-on-one'
    FROM profiles p
    WHERE p.role = 'employee'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = p.id
          AND n.type = 'one_on_one'
          AND n.title = 'Slot 1:1 baru'
          AND n.created_at > now() - interval '12 hours'
      );
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_one_on_one_slots_notify_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  organizer_name text;
  booker_name text;
BEGIN
  SELECT full_name INTO organizer_name FROM profiles WHERE id = NEW.organizer_id;

  -- Booked
  IF NEW.booked_by IS NOT NULL AND OLD.booked_by IS DISTINCT FROM NEW.booked_by
     AND NEW.status = 'booked' THEN
    SELECT full_name INTO booker_name FROM profiles WHERE id = NEW.booked_by;
    IF NEW.organizer_id IS NOT NULL AND NEW.organizer_id <> NEW.booked_by THEN
      PERFORM create_notification(NEW.organizer_id, 'Slot 1:1 dipilih',
        coalesce(booker_name, 'Seseorang') || ' memilih slot 1:1 · ' || wib(NEW.start_at),
        'one_on_one', '/performance/one-on-one');
    END IF;
    PERFORM create_notification(NEW.booked_by, 'Jadwal 1:1 terkonfirmasi',
      '1:1 dengan ' || coalesce(organizer_name, 'admin') || ' · ' || wib(NEW.start_at),
      'one_on_one', '/performance/one-on-one');
    RETURN NEW;
  END IF;

  -- Released by the employee
  IF OLD.booked_by IS NOT NULL AND NEW.booked_by IS NULL AND NEW.status = 'open' THEN
    SELECT full_name INTO booker_name FROM profiles WHERE id = OLD.booked_by;
    IF NEW.organizer_id IS NOT NULL THEN
      PERFORM create_notification(NEW.organizer_id, 'Slot 1:1 dilepas',
        coalesce(booker_name, 'Seseorang') || ' melepas slot 1:1 · ' || wib(NEW.start_at),
        'one_on_one', '/performance/one-on-one');
    END IF;
    RETURN NEW;
  END IF;

  -- Cancelled by the organizer while booked
  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled'
     AND OLD.booked_by IS NOT NULL THEN
    PERFORM create_notification(OLD.booked_by, 'Jadwal 1:1 dibatalkan',
      '1:1 ' || wib(OLD.start_at) || ' dibatalkan. Pilih slot lain di Jadwal 1:1.',
      'one_on_one', '/performance/one-on-one');
    RETURN NEW;
  END IF;

  -- Rescheduled while booked
  IF NEW.booked_by IS NOT NULL AND NEW.status = 'booked'
     AND (NEW.start_at IS DISTINCT FROM OLD.start_at) THEN
    PERFORM create_notification(NEW.booked_by, 'Jadwal 1:1 diubah',
      '1:1 dipindah ke ' || wib(NEW.start_at) || '.',
      'one_on_one', '/performance/one-on-one');
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_review_cycles_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF coalesce(NEW.is_active, false) THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT id,
           '360 review dibuka',
           'Periode 360 review ' || coalesce(NEW.quarter, NEW.name) ||
             ' sudah dibuka sampai ' || to_char(NEW.end_date AT TIME ZONE 'Asia/Jakarta', 'DD/MM') ||
             '. Nilai rekan satu project kamu.',
           'review_cycle',
           '/performance/360-review'
    FROM profiles WHERE role = 'employee';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_performance_summaries_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM create_notification(NEW.reviewee_id, 'Hasil 360 review sudah keluar',
    'Hasil 360 review kamu sudah bisa dilihat.', 'review_summary',
    '/performance/360-review');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS performance_reviews_notify_insert ON public.performance_reviews;
