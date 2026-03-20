-- Notifications automation: create notification records for key business events

-- 0) Allow users to delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "Users can delete their own notifications"
ON notifications FOR DELETE
USING ( auth.uid() = user_id );

-- 1) Helper: insert single notification
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id uuid,
  p_title text,
  p_message text,
  p_type text,
  p_link text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  VALUES (p_user_id, p_title, p_message, p_type, p_link);
END;
$$;

-- 2) Helper: notify all profiles (optionally exclude one user)
CREATE OR REPLACE FUNCTION public.notify_all_profiles(
  p_title text,
  p_message text,
  p_type text,
  p_link text,
  p_exclude uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT id, p_title, p_message, p_type, p_link
  FROM public.profiles
  WHERE (p_exclude IS NULL OR id <> p_exclude);
END;
$$;

-- 3) Helper: notify stakeholders / admins
CREATE OR REPLACE FUNCTION public.notify_stakeholders(
  p_title text,
  p_message text,
  p_type text,
  p_link text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT id, p_title, p_message, p_type, p_link
  FROM public.profiles
  WHERE role = 'stakeholder' OR COALESCE(is_super_admin, false) = true;
END;
$$;

-- 4) Helper: notify employees only
CREATE OR REPLACE FUNCTION public.notify_employees(
  p_title text,
  p_message text,
  p_type text,
  p_link text,
  p_exclude uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT id, p_title, p_message, p_type, p_link
  FROM public.profiles
  WHERE role = 'employee'
    AND (p_exclude IS NULL OR id <> p_exclude);
END;
$$;

-- =========================
-- LEAVE REQUESTS
-- =========================
CREATE OR REPLACE FUNCTION public.trg_leave_requests_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requester_name text;
  msg text;
BEGIN
  SELECT full_name INTO requester_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  msg := COALESCE(requester_name, 'Employee') ||
         ' submitted ' || COALESCE(NEW.leave_type, 'leave') ||
         ' request.';

  PERFORM public.notify_stakeholders(
    'Leave request pending',
    msg,
    'leave_request',
    '/leave'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leave_requests_notify_insert ON public.leave_requests;
CREATE TRIGGER leave_requests_notify_insert
AFTER INSERT ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.trg_leave_requests_notify_insert();

CREATE OR REPLACE FUNCTION public.trg_leave_requests_notify_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  status_label text;
  msg text;
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    status_label := COALESCE(NEW.status::text, 'updated');
    msg := 'Your ' || COALESCE(NEW.leave_type, 'leave') ||
           ' request was ' || status_label || '.';

    PERFORM public.create_notification(
      NEW.user_id,
      'Leave request ' || status_label,
      msg,
      'leave_status',
      '/leave'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS leave_requests_notify_update ON public.leave_requests;
CREATE TRIGGER leave_requests_notify_update
AFTER UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.trg_leave_requests_notify_update();

-- =========================
-- CALENDAR EVENTS
-- =========================
CREATE OR REPLACE FUNCTION public.trg_calendar_events_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  formatted_time text;
  inserted_count integer := 0;
BEGIN
  formatted_time := to_char(NEW.start_at::timestamptz, 'DD Mon YYYY HH24:MI');

  -- If guests contains UUIDs, notify them; otherwise notify all employees.
  IF NEW.guests IS NOT NULL AND jsonb_typeof(NEW.guests::jsonb) = 'array' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT value::uuid,
           'New calendar event',
           NEW.title || ' · ' || formatted_time,
           'calendar_event',
           '/calendar'
    FROM jsonb_array_elements_text(NEW.guests::jsonb) AS value
    WHERE value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND (NEW.user_id IS NULL OR value::uuid <> NEW.user_id);

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;

  IF inserted_count = 0 THEN
    PERFORM public.notify_employees(
      'New calendar event',
      NEW.title || ' · ' || formatted_time,
      'calendar_event',
      '/calendar',
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calendar_events_notify_insert ON public.calendar_events;
CREATE TRIGGER calendar_events_notify_insert
AFTER INSERT ON public.calendar_events
FOR EACH ROW EXECUTE FUNCTION public.trg_calendar_events_notify_insert();

-- =========================
-- 360 REVIEW CYCLE OPEN/CLOSE
-- =========================
CREATE OR REPLACE FUNCTION public.trg_review_cycles_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF COALESCE(NEW.is_active, false) = true THEN
    PERFORM public.notify_all_profiles(
      '360 review cycle opened',
      '360 review cycle ' || NEW.name || ' is now open.',
      'review_cycle',
      '/performance/360-review',
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS review_cycles_notify_insert ON public.review_cycles;
CREATE TRIGGER review_cycles_notify_insert
AFTER INSERT ON public.review_cycles
FOR EACH ROW EXECUTE FUNCTION public.trg_review_cycles_notify_insert();

-- =========================
-- 360 REVIEW SUBMISSION
-- =========================
CREATE OR REPLACE FUNCTION public.trg_performance_reviews_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  reviewer_name text;
  reviewee_name text;
BEGIN
  SELECT full_name INTO reviewer_name
  FROM public.profiles
  WHERE id = NEW.reviewer_id;

  SELECT full_name INTO reviewee_name
  FROM public.profiles
  WHERE id = NEW.reviewee_id;

  PERFORM public.notify_stakeholders(
    '360 review submitted',
    COALESCE(reviewer_name, 'A reviewer') || ' submitted a review for ' ||
      COALESCE(reviewee_name, 'an employee') || '.',
    'review_submitted',
    '/performance/360-review'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS performance_reviews_notify_insert ON public.performance_reviews;
CREATE TRIGGER performance_reviews_notify_insert
AFTER INSERT ON public.performance_reviews
FOR EACH ROW EXECUTE FUNCTION public.trg_performance_reviews_notify_insert();

-- =========================
-- 360 SUMMARY READY (n8n output)
-- =========================
CREATE OR REPLACE FUNCTION public.trg_performance_summaries_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.create_notification(
    NEW.reviewee_id,
    '360 review result ready',
    'Your 360 review results are ready to view.',
    'review_summary',
    '/performance/360-review'
  );

  PERFORM public.notify_stakeholders(
    '360 summary ready',
    '360 summary is ready for an employee.',
    'review_summary',
    '/performance/360-review'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS performance_summaries_notify_insert ON public.performance_summaries;
CREATE TRIGGER performance_summaries_notify_insert
AFTER INSERT ON public.performance_summaries
FOR EACH ROW EXECUTE FUNCTION public.trg_performance_summaries_notify_insert();

-- =========================
-- 1:1 (301) SLOTS
-- =========================
CREATE OR REPLACE FUNCTION public.trg_one_on_one_slots_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  formatted_time text;
BEGIN
  formatted_time := to_char(NEW.start_at::timestamptz, 'DD Mon YYYY HH24:MI');

  IF NEW.status = 'open' THEN
    PERFORM public.notify_all_profiles(
      '1:1 slot available',
      'New 1:1 slot for ' || NEW.cycle_name || ' · ' || formatted_time,
      'one_on_one',
      '/performance/one-on-one',
      NULL
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS one_on_one_slots_notify_insert ON public.one_on_one_slots;
CREATE TRIGGER one_on_one_slots_notify_insert
AFTER INSERT ON public.one_on_one_slots
FOR EACH ROW EXECUTE FUNCTION public.trg_one_on_one_slots_notify_insert();

CREATE OR REPLACE FUNCTION public.trg_one_on_one_slots_notify_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  organizer_name text;
  booker_name text;
  formatted_time text;
BEGIN
  formatted_time := to_char(NEW.start_at::timestamptz, 'DD Mon YYYY HH24:MI');

  IF NEW.booked_by IS NOT NULL AND (OLD.booked_by IS DISTINCT FROM NEW.booked_by) THEN
    SELECT full_name INTO organizer_name
    FROM public.profiles
    WHERE id = NEW.organizer_id;

    SELECT full_name INTO booker_name
    FROM public.profiles
    WHERE id = NEW.booked_by;

    -- Notify organizer (admin/lead)
    IF NEW.organizer_id IS NOT NULL THEN
      PERFORM public.create_notification(
        NEW.organizer_id,
        '1:1 slot booked',
        COALESCE(booker_name, 'Someone') || ' booked a 1:1 slot · ' || formatted_time,
        'one_on_one',
        '/performance/one-on-one'
      );
    END IF;

    -- Notify booker (employee)
    PERFORM public.create_notification(
      NEW.booked_by,
      '1:1 booking confirmed',
      'Your 1:1 slot with ' || COALESCE(organizer_name, 'a reviewer') ||
        ' is booked · ' || formatted_time,
      'one_on_one',
      '/performance/one-on-one'
    );

    -- Notify stakeholders
    PERFORM public.notify_stakeholders(
      '1:1 slot booked',
      COALESCE(booker_name, 'Someone') || ' booked a 1:1 slot · ' || formatted_time,
      'one_on_one',
      '/performance/one-on-one'
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS one_on_one_slots_notify_update ON public.one_on_one_slots;
CREATE TRIGGER one_on_one_slots_notify_update
AFTER UPDATE ON public.one_on_one_slots
FOR EACH ROW EXECUTE FUNCTION public.trg_one_on_one_slots_notify_update();
