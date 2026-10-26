-- Personal vs project calendar, and Sharing Santuy.
--
-- 1. calendar_events SELECT: "Personal" events only for their owner (not even
--    stakeholders). Everything else: the owner, stakeholders, the guests, and
--    everyone for company-wide events (Sharing Santuy, holidays, or no guests).
-- 2. toggle_sharing_santuy_join(): join or leave a Sharing Santuy session.
--    Participants live in `guests` as [{ "id": uuid, "name": text }].
-- 3. New-event notifications: none for Personal events.
-- 4. Approved leave is readable by Project Managers too (team leave on the
--    project calendar). Other employees still only see their own.

-- 1) Who can read an event ------------------------------------------------
CREATE OR REPLACE FUNCTION public.calendar_event_visible(
  p_user_id uuid,
  p_event_type text,
  p_guests jsonb
) RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p_user_id = auth.uid()
    OR (
      p_event_type IS DISTINCT FROM 'Personal'
      AND (
        public.is_stakeholder()
        OR p_event_type IN ('Sharing Santuy', 'Company Holiday', 'Public Holiday')
        OR p_guests IS NULL
        OR jsonb_typeof(p_guests) <> 'array'
        OR jsonb_array_length(p_guests) = 0
        OR p_guests @> jsonb_build_array(auth.uid()::text)
        OR p_guests @> jsonb_build_array(jsonb_build_object('id', auth.uid()::text))
        OR p_guests @> jsonb_build_array(jsonb_build_object(
             'email', (SELECT email FROM auth.users WHERE id = auth.uid())))
      )
    );
$$;

DROP POLICY IF EXISTS "Signed-in users read events" ON public.calendar_events;
DROP POLICY IF EXISTS "Read own, invited and company-wide events" ON public.calendar_events;
CREATE POLICY "Read own, invited and company-wide events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (public.calendar_event_visible(user_id, event_type, guests::jsonb));

-- Guests could edit any field through the RSVP rule; Personal events are
-- the owner's alone.
DROP POLICY IF EXISTS "Owners, guests and stakeholders change events" ON public.calendar_events;
CREATE POLICY "Owners, guests and stakeholders change events"
  ON public.calendar_events FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR (
      event_type IS DISTINCT FROM 'Personal'
      AND (
        is_stakeholder()
        OR guests @> jsonb_build_array(jsonb_build_object(
             'email', (SELECT email FROM auth.users WHERE id = auth.uid())))
      )
    )
  );

DROP POLICY IF EXISTS "Owners and stakeholders delete events" ON public.calendar_events;
CREATE POLICY "Owners and stakeholders delete events"
  ON public.calendar_events FOR DELETE TO authenticated
  USING (
    user_id = auth.uid()
    OR (event_type IS DISTINCT FROM 'Personal' AND is_stakeholder())
  );

-- 2) Join / leave Sharing Santuy -----------------------------------------
CREATE OR REPLACE FUNCTION public.toggle_sharing_santuy_join(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  my_name text;
  current_guests jsonb;
  next_guests jsonb;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'not signed in';
  END IF;

  SELECT COALESCE(guests::jsonb, '[]'::jsonb) INTO current_guests
  FROM public.calendar_events
  WHERE id = p_event_id AND event_type = 'Sharing Santuy'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'not a Sharing Santuy event';
  END IF;
  IF jsonb_typeof(current_guests) <> 'array' THEN
    current_guests := '[]'::jsonb;
  END IF;

  IF current_guests @> jsonb_build_array(jsonb_build_object('id', me::text)) THEN
    SELECT COALESCE(jsonb_agg(g), '[]'::jsonb) INTO next_guests
    FROM jsonb_array_elements(current_guests) AS g
    WHERE g->>'id' IS DISTINCT FROM me::text;
  ELSE
    SELECT full_name INTO my_name FROM public.profiles WHERE id = me;
    next_guests := current_guests
      || jsonb_build_array(jsonb_build_object('id', me::text, 'name', my_name));
  END IF;

  UPDATE public.calendar_events
  SET guests = next_guests, updated_at = now()
  WHERE id = p_event_id;

  RETURN next_guests;
END;
$$;

REVOKE ALL ON FUNCTION public.toggle_sharing_santuy_join(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_sharing_santuy_join(uuid) TO authenticated;

-- 3) Notifications: skip Personal; Sharing Santuy tells everyone -----------
CREATE OR REPLACE FUNCTION public.trg_calendar_events_notify_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  formatted_time text;
  inserted_count integer := 0;
  event_link text;
BEGIN
  IF NEW.event_type = 'Personal' THEN
    RETURN NEW;
  END IF;

  formatted_time := to_char(NEW.start_at::timestamptz, 'DD Mon YYYY HH24:MI');
  event_link := CASE
    WHEN NEW.event_type = 'Sharing Santuy' THEN '/calendar/personal'
    ELSE '/calendar'
  END;

  -- Invited people (uuid guests) only; otherwise it's company-wide.
  IF NEW.event_type IS DISTINCT FROM 'Sharing Santuy'
     AND NEW.guests IS NOT NULL
     AND jsonb_typeof(NEW.guests::jsonb) = 'array' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT value::uuid,
           'New calendar event',
           NEW.title || ' · ' || formatted_time,
           'calendar_event',
           event_link
    FROM jsonb_array_elements_text(NEW.guests::jsonb) AS value
    WHERE value ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND (NEW.user_id IS NULL OR value::uuid <> NEW.user_id);

    GET DIAGNOSTICS inserted_count = ROW_COUNT;
  END IF;

  IF inserted_count = 0 THEN
    PERFORM public.notify_employees(
      CASE WHEN NEW.event_type = 'Sharing Santuy'
        THEN 'Sharing Santuy baru' ELSE 'New calendar event' END,
      NEW.title || ' · ' || formatted_time,
      'calendar_event',
      event_link,
      NEW.user_id
    );
  END IF;

  RETURN NEW;
END;
$$;

-- 4) Team leave for Project Managers -------------------------------------
DROP POLICY IF EXISTS "Project managers view approved leave" ON public.leave_requests;
CREATE POLICY "Project managers view approved leave"
  ON public.leave_requests FOR SELECT TO authenticated
  USING (
    status = 'approved'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND job_title = 'Project Manager'
    )
  );
