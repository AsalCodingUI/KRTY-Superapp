-- Leave & attendance guards (idempotent).
--
-- 1. Employees could write their own rows straight through PostgREST and
--    skip every rule in /api/leave/requests and /api/attendance/logs:
--    insert or flip their own request to "approved" (WFH/Sick), and forge
--    or rewrite clock times. Those routes write with the service role, so
--    employees no longer need direct write access:
--    - leave_requests: insert own only as "pending"; updates are for
--      stakeholders (who could not add manual leave for others unless
--      super admin; now any stakeholder can).
--    - attendance_logs: no direct insert/update for employees.
-- 2. One open attendance session per person (double clock-in from two tabs
--    or a double click raced past the API check).
-- 3. leave-proofs bucket: 5 MB per file (PDFs were unlimited).

-- 1. leave_requests ---------------------------------------------------------
DROP POLICY IF EXISTS "Create requests" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_own" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert_admin" ON public.leave_requests;
DROP POLICY IF EXISTS "leave_requests_insert" ON public.leave_requests;
CREATE POLICY "leave_requests_insert"
  ON public.leave_requests FOR INSERT TO authenticated
  WITH CHECK (
    (auth.uid() = user_id AND status = 'pending')
    OR public.is_stakeholder()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_super_admin = true
    )
  );

DROP POLICY IF EXISTS "leave_requests_update_own" ON public.leave_requests;
DROP POLICY IF EXISTS "Update requests" ON public.leave_requests;
CREATE POLICY "Update requests"
  ON public.leave_requests FOR UPDATE TO authenticated
  USING (public.is_stakeholder())
  WITH CHECK (public.is_stakeholder());

-- attendance_logs -----------------------------------------------------------
DROP POLICY IF EXISTS "Employees can insert own logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Employees can update own logs" ON public.attendance_logs;

-- 2. one open session per person ------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS attendance_logs_one_open_session
  ON public.attendance_logs (user_id)
  WHERE clock_out IS NULL;

-- 3. proof size -------------------------------------------------------------
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'leave-proofs';

-- 4. "New request" notification in Indonesian, like the status one
--    (was "Leave request pending" / "X submitted Annual Leave request.").
CREATE OR REPLACE FUNCTION public.trg_leave_requests_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  requester_name text;
  type_label text;
BEGIN
  -- Stakeholders adding leave by hand don't need to be told about it.
  IF NEW.status <> 'pending' THEN
    RETURN NEW;
  END IF;

  SELECT full_name INTO requester_name
  FROM public.profiles
  WHERE id = NEW.user_id;

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
    '/leave'
  );

  RETURN NEW;
END;
$function$;

-- 5. Calendar "new event" notification:
--    - Personal events notified every employee (their titles leaked);
--      they now notify nobody.
--    - The time was printed in UTC ("24 Aug 2026 17:00" for an all-day
--      holiday on the 25th): now WIB, date only for all-day events.
--    - Guests stored as {id, email} objects were not recognised, so the
--      whole team got notified instead of the guests.
--    - Indonesian title, like the other notifications.
CREATE OR REPLACE FUNCTION public.trg_calendar_events_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  formatted_time text;
  inserted_count integer := 0;
BEGIN
  IF NEW.event_type = 'Personal' THEN
    RETURN NEW;
  END IF;

  formatted_time := CASE
    WHEN COALESCE(NEW.all_day, false)
      THEN to_char(NEW.start_at AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY')
    ELSE to_char(NEW.start_at AT TIME ZONE 'Asia/Jakarta', 'DD/MM/YYYY HH24:MI')
  END;

  -- Guests (ids, or {id, email} objects): notify them; otherwise everyone.
  IF NEW.guests IS NOT NULL AND jsonb_typeof(NEW.guests::jsonb) = 'array' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT DISTINCT g.uid::uuid,
           'Jadwal baru',
           NEW.title || ' · ' || formatted_time,
           'calendar_event',
           '/calendar'
    FROM (
      SELECT CASE jsonb_typeof(e)
               WHEN 'string' THEN e #>> '{}'
               WHEN 'object' THEN e ->> 'id'
             END AS uid
      FROM jsonb_array_elements(NEW.guests::jsonb) AS e
    ) g
    WHERE g.uid ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND (NEW.user_id IS NULL OR g.uid::uuid <> NEW.user_id)
      AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = g.uid::uuid);

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;

  IF inserted_count = 0 THEN
    PERFORM public.notify_employees(
      'Jadwal baru',
      NEW.title || ' · ' || formatted_time,
      'calendar_event',
      '/calendar',
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$function$;
