-- Only the event's owner and stakeholders edit an event. The old rule also
-- let any guest change everything (and its auth.users lookup failed for
-- signed-in users). A guest's RSVP goes through /api/calendar/rsvp, which
-- checks they're a guest. Idempotent.
DROP POLICY IF EXISTS "Owners, guests and stakeholders change events" ON public.calendar_events;
DROP POLICY IF EXISTS "Owners and stakeholders change events" ON public.calendar_events;
CREATE POLICY "Owners and stakeholders change events" ON public.calendar_events
  FOR UPDATE TO authenticated
  USING ((user_id = auth.uid()) OR is_stakeholder());
