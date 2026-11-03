-- Notifications by email too: each person's choice (on by default, minus the
-- groups they mute), and a stamp on each notification once it was mailed so
-- the sender (/api/notifications/email) never mails one twice.
-- Additive and idempotent. The schedule that calls the sender lives in
-- notification_email_cron.sql (applied once the route is deployed).

CREATE TABLE IF NOT EXISTS public.notification_email_prefs (
  user_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  -- Group keys from src/shared/lib/notification-email.ts ("performance"…).
  muted text[] NOT NULL DEFAULT '{}',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_email_prefs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own email prefs" ON public.notification_email_prefs;
CREATE POLICY "Own email prefs" ON public.notification_email_prefs
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

GRANT SELECT, INSERT, UPDATE ON public.notification_email_prefs TO authenticated;

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS emailed_at timestamptz;

-- The sender's queue: recent, not yet mailed.
CREATE INDEX IF NOT EXISTS notifications_email_queue
  ON public.notifications (created_at)
  WHERE emailed_at IS NULL;

-- Who set it off, for the email's "Habibi via Kretya Flow". Notifications
-- are written by triggers in the acting person's session, so auth.uid()
-- is them; server jobs (reminders, cron) leave it empty. No foreign key:
-- a login whose id isn't a profile id must never make the insert fail.
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS actor_id uuid DEFAULT auth.uid();
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_actor_id_fkey;

-- Monday's weekly digest: one per person per week (the server job checks
-- this before sending). Server only.
CREATE TABLE IF NOT EXISTS public.email_digests (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, week_start)
);
ALTER TABLE public.email_digests ENABLE ROW LEVEL SECURITY;
