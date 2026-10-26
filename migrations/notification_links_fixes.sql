-- Notification links that open the right place for the recipient, and two
-- recipient fixes (calendar guests stored by email; stakeholders told about
-- their own leave request).

-- Stakeholders, optionally leaving one person out (the one who did it).
DROP FUNCTION IF EXISTS public.notify_stakeholders(text, text, text, text);
CREATE OR REPLACE FUNCTION public.notify_stakeholders(
  p_title text, p_message text, p_type text, p_link text, p_exclude uuid DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT id, p_title, p_message, p_type, p_link
  FROM public.profiles
  WHERE (role = 'stakeholder' OR COALESCE(is_super_admin, false) = true)
    AND (p_exclude IS NULL OR id <> p_exclude);
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_leave_requests_notify_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  requester_name text;
  type_label text;
BEGIN
  -- Stakeholders adding leave by hand don't need to be told about it.
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO requester_name FROM public.profiles WHERE id = NEW.user_id;

  type_label := CASE NEW.leave_type
    WHEN 'Annual Leave' THEN 'cuti tahunan'
    WHEN 'Sick Leave' THEN 'izin sakit'
    WHEN 'WFH' THEN 'WFH'
    WHEN 'Work From Home' THEN 'WFH'
    ELSE COALESCE(NEW.leave_type, 'cuti')
  END;

  PERFORM public.notify_stakeholders(
    'Pengajuan baru',
    COALESCE(requester_name, 'Karyawan') || ' mengajukan ' || type_label || '.',
    'leave_request',
    '/leave?inbox=leave&request=' || NEW.id,
    NEW.user_id
  );
  RETURN NEW;
END;
$$;

-- New meeting: the same audience as a change (guests by id or email, the
-- creator left out; no guests = every employee), linked to your own agenda.
CREATE OR REPLACE FUNCTION public.trg_calendar_events_notify_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  when_label text;
BEGIN
  IF NEW.event_type = 'Personal' THEN
    RETURN NEW;
  END IF;
  when_label := CASE WHEN COALESCE(NEW.all_day, false)
    THEN to_char(NEW.start_at AT TIME ZONE 'Asia/Jakarta', 'DD/MM')
    ELSE public.wib(NEW.start_at) END;
  INSERT INTO public.notifications (user_id, title, message, type, link)
  SELECT a, 'Jadwal baru', left(NEW.title, 80) || ' · ' || when_label,
         'calendar_event', '/calendar/personal'
  FROM public.calendar_event_audience(NEW.guests::jsonb, NULL, NEW.user_id) AS a;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_calendar_events_notify_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  actor uuid := auth.uid();
  when_label text;
  msg text;
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.event_type = 'Personal' OR OLD.end_at < now() THEN
      RETURN NULL;
    END IF;
    when_label := CASE WHEN COALESCE(OLD.all_day, false)
      THEN to_char(OLD.start_at AT TIME ZONE 'Asia/Jakarta', 'DD/MM')
      ELSE public.wib(OLD.start_at) END;
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT a, 'Jadwal dibatalkan', left(OLD.title, 80) || ' · ' || when_label,
           'calendar_update', '/calendar/personal'
    FROM public.calendar_event_audience(OLD.guests::jsonb, OLD.user_id, actor) AS a;
    RETURN NULL;
  END IF;

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
    SELECT a, 'Jadwal diubah', msg, 'calendar_update', '/calendar/personal'
    FROM public.calendar_event_audience(NEW.guests::jsonb, NEW.user_id, actor) AS a;
  END IF;
  RETURN NULL;
END;
$$;

-- Where a person sees performance things: stakeholders have the 360 and 1:1
-- tabs; members get them as cards on their KPI page (for a quarter).
CREATE OR REPLACE FUNCTION public.performance_link(
  p_user uuid, p_tab text, p_quarter text DEFAULT NULL
) RETURNS text LANGUAGE sql STABLE SET search_path = public AS $$
  SELECT CASE
    WHEN EXISTS (SELECT 1 FROM profiles
                 WHERE id = p_user
                   AND (role = 'stakeholder' OR COALESCE(is_super_admin, false)))
      THEN '/performance/' || p_tab
    ELSE '/performance' || COALESCE('?period=' || p_quarter, '')
  END
$$;

CREATE OR REPLACE FUNCTION public.trg_performance_summaries_notify_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  q text;
BEGIN
  SELECT quarter INTO q FROM review_cycles WHERE id = NEW.cycle_id;
  PERFORM create_notification(NEW.reviewee_id, 'Hasil 360 review sudah keluar',
    'Hasil 360 review kamu sudah bisa dilihat.', 'review_summary',
    public.performance_link(NEW.reviewee_id, '360-review', q));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.trg_one_on_one_slots_notify_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'open' THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT p.id,
           'Slot 1:1 baru',
           'Ada slot 1:1 baru, mulai ' || wib(NEW.start_at) || '. Pilih jadwalmu di Jadwal 1:1.',
           'one_on_one',
           '/performance'
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
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  organizer_name text;
  booker_name text;
BEGIN
  SELECT full_name INTO organizer_name FROM profiles WHERE id = NEW.organizer_id;

  IF NEW.booked_by IS NOT NULL AND OLD.booked_by IS DISTINCT FROM NEW.booked_by
     AND NEW.status = 'booked' THEN
    SELECT full_name INTO booker_name FROM profiles WHERE id = NEW.booked_by;
    IF NEW.organizer_id IS NOT NULL AND NEW.organizer_id <> NEW.booked_by THEN
      PERFORM create_notification(NEW.organizer_id, 'Slot 1:1 dipilih',
        coalesce(booker_name, 'Seseorang') || ' memilih slot 1:1 · ' || wib(NEW.start_at),
        'one_on_one', public.performance_link(NEW.organizer_id, 'one-on-one'));
    END IF;
    PERFORM create_notification(NEW.booked_by, 'Jadwal 1:1 terkonfirmasi',
      '1:1 dengan ' || coalesce(organizer_name, 'admin') || ' · ' || wib(NEW.start_at),
      'one_on_one', public.performance_link(NEW.booked_by, 'one-on-one'));
    RETURN NEW;
  END IF;

  IF OLD.booked_by IS NOT NULL AND NEW.booked_by IS NULL AND NEW.status = 'open' THEN
    SELECT full_name INTO booker_name FROM profiles WHERE id = OLD.booked_by;
    IF NEW.organizer_id IS NOT NULL THEN
      PERFORM create_notification(NEW.organizer_id, 'Slot 1:1 dilepas',
        coalesce(booker_name, 'Seseorang') || ' melepas slot 1:1 · ' || wib(NEW.start_at),
        'one_on_one', public.performance_link(NEW.organizer_id, 'one-on-one'));
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled'
     AND OLD.booked_by IS NOT NULL THEN
    PERFORM create_notification(OLD.booked_by, 'Jadwal 1:1 dibatalkan',
      '1:1 ' || wib(OLD.start_at) || ' dibatalkan. Pilih slot lain di Jadwal 1:1.',
      'one_on_one', public.performance_link(OLD.booked_by, 'one-on-one'));
    RETURN NEW;
  END IF;

  IF NEW.booked_by IS NOT NULL AND NEW.status = 'booked'
     AND (NEW.start_at IS DISTINCT FROM OLD.start_at) THEN
    PERFORM create_notification(NEW.booked_by, 'Jadwal 1:1 diubah',
      '1:1 dipindah ke ' || wib(NEW.start_at) || '.',
      'one_on_one', public.performance_link(NEW.booked_by, 'one-on-one'));
  END IF;
  RETURN NEW;
END;
$$;

-- Existing rows: point members' old links at the page they can open.
UPDATE notifications n SET link = '/performance'
FROM profiles p
WHERE p.id = n.user_id
  AND p.role = 'employee' AND NOT COALESCE(p.is_super_admin, false)
  AND n.link IN ('/performance/360-review', '/performance/one-on-one');
UPDATE notifications SET link = '/calendar/personal'
WHERE type IN ('calendar_event', 'calendar_update') AND link = '/calendar';

-- Attendance deletion requests link to that request in the inbox too:
-- trg_attendance_logs_notify_delete_request now uses
-- '/leave/attendance?inbox=attendance&request=' || log_row.id (applied live).
