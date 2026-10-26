-- Notifications for attendance delete requests, calendar RSVP / changes and
-- cancelled leave (idempotent).
--
-- 1. attendance_request  — employee asks to delete a log (DELETE_REQUESTED tag
--    added to attendance_logs.notes by /api/attendance/logs) → stakeholders.
-- 2. attendance_decision — a stakeholder approves (row deleted) or declines
--    (tag removed) that request → the employee.
-- 3. calendar_update     — time / place changes, or the event is deleted →
--    the same people the insert trigger tells (guests, else all employees),
--    plus the creator; never the actor. Personal and past events: nobody.
-- 4. leave_cancelled     — an employee cancels their own pending request
--    (DELETE via /api/leave/requests) → stakeholders.
--
-- The auto clock-out job (run_auto_clock_out) already tells the employee
-- ("Clock out otomatis"), so it is left as is.

-- 1 & 2) attendance_logs ------------------------------------------------------
CREATE OR REPLACE FUNCTION public.trg_attendance_logs_notify_delete_request()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  tag constant text := 'DELETE_REQUESTED';
  had_tag boolean;
  has_tag boolean;
  person_name text;
  log_row public.attendance_logs%ROWTYPE;
  day_label text;
  span_label text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    log_row := OLD;
    had_tag := tag = ANY (string_to_array(coalesce(OLD.notes, ''), '|'));
    has_tag := false;
  ELSE
    log_row := NEW;
    had_tag := tag = ANY (string_to_array(coalesce(OLD.notes, ''), '|'));
    has_tag := tag = ANY (string_to_array(coalesce(NEW.notes, ''), '|'));
  END IF;

  IF had_tag = has_tag THEN
    RETURN NULL;
  END IF;

  -- Person gone (profile delete cascading here): nobody to tell.
  SELECT full_name INTO person_name FROM public.profiles WHERE id = log_row.user_id;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  day_label := to_char(log_row.date, 'DD/MM');
  span_label := to_char(log_row.clock_in AT TIME ZONE 'Asia/Jakarta', 'HH24:MI')
    || COALESCE('–' || to_char(log_row.clock_out AT TIME ZONE 'Asia/Jakarta', 'HH24:MI'), '');

  IF has_tag THEN
    -- New request → stakeholders (not the requester, not the actor).
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT p.id,
           'Permintaan hapus absensi',
           left(COALESCE(person_name, 'Karyawan'), 60) || ' · ' || day_label || ' · ' || span_label,
           'attendance_request',
           '/leave/attendance'
    FROM public.profiles p
    WHERE (p.role = 'stakeholder' OR COALESCE(p.is_super_admin, false))
      AND p.id <> log_row.user_id
      AND (actor IS NULL OR p.id <> actor);
  ELSIF actor IS NULL OR actor <> log_row.user_id THEN
    -- Decision → the employee.
    PERFORM public.create_notification(
      log_row.user_id,
      CASE WHEN TG_OP = 'DELETE'
        THEN 'Absensi dihapus' ELSE 'Permintaan hapus ditolak' END,
      CASE WHEN TG_OP = 'DELETE'
        THEN 'Absen ' || day_label || ' · ' || span_label || ' sudah dihapus.'
        ELSE 'Absen ' || day_label || ' · ' || span_label || ' tetap tercatat.' END,
      'attendance_decision',
      '/leave'
    );
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS attendance_logs_notify_delete_request ON public.attendance_logs;
CREATE TRIGGER attendance_logs_notify_delete_request
  AFTER UPDATE OF notes OR DELETE ON public.attendance_logs
  FOR EACH ROW EXECUTE FUNCTION public.trg_attendance_logs_notify_delete_request();

-- 3) calendar_events -----------------------------------------------------

-- Who hears about an event: its guests (uuid strings, {id} or {email}
-- objects) if any resolve to a profile, else every employee — the insert
-- trigger's rule — plus the creator. Never the actor.
CREATE OR REPLACE FUNCTION public.calendar_event_audience(
  p_guests jsonb,
  p_creator uuid,
  p_exclude uuid
) RETURNS SETOF uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guest_ids uuid[];
BEGIN
  IF p_guests IS NOT NULL AND jsonb_typeof(p_guests) = 'array' THEN
    SELECT array_agg(DISTINCT p.id) INTO guest_ids
    FROM jsonb_array_elements(p_guests) AS e
    JOIN public.profiles p ON
      (jsonb_typeof(e) = 'string'
        AND (e #>> '{}') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND p.id = (e #>> '{}')::uuid)
      OR (jsonb_typeof(e) = 'object'
        AND (e ->> 'id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
        AND p.id = (e ->> 'id')::uuid)
      OR (jsonb_typeof(e) = 'object'
        AND e ->> 'id' IS NULL
        AND e ->> 'email' IS NOT NULL
        AND p.id = (SELECT u.id FROM auth.users u
                    WHERE lower(u.email) = lower(e ->> 'email') LIMIT 1));
  END IF;

  RETURN QUERY
  SELECT DISTINCT x.id FROM (
    SELECT unnest(guest_ids) AS id
    UNION ALL
    SELECT p.id FROM public.profiles p
    WHERE COALESCE(cardinality(guest_ids), 0) = 0 AND p.role = 'employee'
    UNION ALL
    SELECT p.id FROM public.profiles p WHERE p.id = p_creator
  ) x
  WHERE x.id IS NOT NULL
    AND (p_exclude IS NULL OR x.id <> p_exclude);
END;
$$;

REVOKE ALL ON FUNCTION public.calendar_event_audience(jsonb, uuid, uuid) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.trg_calendar_events_notify_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  when_label text;
  msg text;
BEGIN
  -- Cancelled ---------------------------------------------------------------
  IF TG_OP = 'DELETE' THEN
    IF OLD.event_type = 'Personal' OR OLD.end_at < now() THEN
      RETURN NULL;
    END IF;
    when_label := CASE WHEN COALESCE(OLD.all_day, false)
      THEN to_char(OLD.start_at AT TIME ZONE 'Asia/Jakarta', 'DD/MM')
      ELSE public.wib(OLD.start_at) END;
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT a, 'Jadwal dibatalkan',
           left(OLD.title, 80) || ' · ' || when_label,
           'calendar_update', '/calendar'
    FROM public.calendar_event_audience(OLD.guests::jsonb, OLD.user_id, actor) AS a;
    RETURN NULL;
  END IF;

  -- Time / place changed → guests ----------------------------------------------
  IF NEW.event_type IS DISTINCT FROM 'Personal'
     AND NEW.end_at >= now()
     AND (NEW.start_at IS DISTINCT FROM OLD.start_at
          OR NEW.end_at IS DISTINCT FROM OLD.end_at
          OR COALESCE(NEW.all_day, false) IS DISTINCT FROM COALESCE(OLD.all_day, false)
          OR NULLIF(trim(NEW.location), '') IS DISTINCT FROM NULLIF(trim(OLD.location), '')) THEN
    when_label := CASE WHEN COALESCE(NEW.all_day, false)
      THEN to_char(NEW.start_at AT TIME ZONE 'Asia/Jakarta', 'DD/MM')
      ELSE public.wib(NEW.start_at) END;
    msg := left(NEW.title, 60) || ' · ' || when_label;
    IF NULLIF(trim(NEW.location), '') IS NOT NULL THEN
      msg := msg || ' · ' || left(trim(NEW.location), 40);
    END IF;
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT a, 'Jadwal diubah', msg, 'calendar_update', '/calendar'
    FROM public.calendar_event_audience(NEW.guests::jsonb, NEW.user_id, actor) AS a;
  END IF;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS calendar_events_notify_change ON public.calendar_events;
CREATE TRIGGER calendar_events_notify_change
  AFTER UPDATE OR DELETE ON public.calendar_events
  FOR EACH ROW EXECUTE FUNCTION public.trg_calendar_events_notify_change();

-- 4) leave_requests: cancelled while pending -----------------------------------
CREATE OR REPLACE FUNCTION public.trg_leave_requests_notify_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor uuid := auth.uid();
  requester_name text;
  type_label text;
  span_label text;
BEGIN
  -- Only the requester (or the server acting for them) cancelling a pending
  -- request; a stakeholder deleting one already knows.
  IF OLD.status <> 'pending' OR (actor IS NOT NULL AND actor <> OLD.user_id) THEN
    RETURN NULL;
  END IF;

  SELECT full_name INTO requester_name FROM public.profiles WHERE id = OLD.user_id;
  IF NOT FOUND THEN
    RETURN NULL; -- profile delete cascading
  END IF;

  type_label := CASE OLD.leave_type
    WHEN 'Annual Leave' THEN 'cuti tahunan'
    WHEN 'Sick Leave' THEN 'izin sakit'
    WHEN 'WFH' THEN 'WFH'
    WHEN 'Work From Home' THEN 'WFH'
    ELSE COALESCE(OLD.leave_type, 'cuti')
  END;
  span_label := to_char(OLD.start_date, 'DD/MM')
    || CASE WHEN OLD.end_date IS DISTINCT FROM OLD.start_date
         THEN '–' || to_char(OLD.end_date, 'DD/MM') ELSE '' END;

  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT p.id,
         'Pengajuan dibatalkan',
         left(COALESCE(requester_name, 'Karyawan'), 60) || ' batal ' || type_label || ' · ' || span_label,
         'leave_cancelled',
         '/leave'
  FROM public.profiles p
  WHERE (p.role = 'stakeholder' OR COALESCE(p.is_super_admin, false))
    AND p.id <> OLD.user_id;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS leave_requests_notify_cancel ON public.leave_requests;
CREATE TRIGGER leave_requests_notify_cancel
  AFTER DELETE ON public.leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.trg_leave_requests_notify_cancel();
