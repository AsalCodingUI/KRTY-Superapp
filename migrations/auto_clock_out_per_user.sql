-- Auto clock-out becomes each employee's own choice (was one team-wide rule
-- in app_settings['auto_clock_out'], set by stakeholders).
--   attendance_preferences: one row per person, written by that person.
--   run_auto_clock_out(): closes an open session at its owner's cut-off,
--   only for people who turned it on. Same rules as before: "Lembur" and
--   sessions started after the cut-off close at 23:59, a running break ends
--   at the same moment, the row gets the AUTO_CLOCK_OUT tag and the person a
--   notification. The cron job from add_auto_clock_out.sql keeps calling it.
-- Run after add_auto_clock_out.sql.

CREATE TABLE IF NOT EXISTS public.attendance_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  auto_clock_out boolean NOT NULL DEFAULT false,
  auto_clock_out_time time NOT NULL DEFAULT time '17:00',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read own attendance preferences" ON public.attendance_preferences;
CREATE POLICY "Read own attendance preferences"
  ON public.attendance_preferences FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Insert own attendance preferences" ON public.attendance_preferences;
CREATE POLICY "Insert own attendance preferences"
  ON public.attendance_preferences FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Update own attendance preferences" ON public.attendance_preferences;
CREATE POLICY "Update own attendance preferences"
  ON public.attendance_preferences FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.run_auto_clock_out()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz constant text := 'Asia/Jakarta';
  r record;
  local_day date;
  out_at timestamptz;
  closed integer := 0;
BEGIN
  FOR r IN
    SELECT l.*, p.auto_clock_out_time AS cutoff
    FROM attendance_logs l
    JOIN attendance_preferences p ON p.user_id = l.user_id
    WHERE l.clock_out IS NULL AND p.auto_clock_out
    FOR UPDATE OF l SKIP LOCKED
  LOOP
    local_day := (r.clock_in AT TIME ZONE tz)::date;
    out_at := (local_day + r.cutoff) AT TIME ZONE tz;
    IF r.status = 'Lembur' OR out_at <= r.clock_in THEN
      out_at := (local_day + time '23:59') AT TIME ZONE tz;
    END IF;
    CONTINUE WHEN now() < out_at;

    UPDATE attendance_logs SET
      clock_out = out_at,
      break_total = coalesce(break_total, 0) + CASE
        WHEN is_break AND break_start IS NOT NULL
          THEN greatest(0, floor(extract(epoch FROM (out_at - break_start)) / 60))::int
        ELSE 0 END,
      is_break = false,
      break_start = NULL,
      notes = CASE
        WHEN notes IS NULL OR notes = '' THEN 'AUTO_CLOCK_OUT'
        WHEN 'AUTO_CLOCK_OUT' = ANY (string_to_array(notes, '|')) THEN notes
        ELSE notes || '|AUTO_CLOCK_OUT' END
    WHERE id = r.id;

    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      r.user_id,
      'Clock out otomatis',
      format(
        'Sesi kamu tanggal %s ditutup otomatis pukul %s. Hubungi admin kalau jamnya perlu dikoreksi.',
        to_char(local_day, 'DD/MM'),
        to_char(out_at AT TIME ZONE tz, 'HH24:MI')
      ),
      'attendance',
      '/leave'
    );
    closed := closed + 1;
  END LOOP;

  RETURN closed;
END;
$$;

REVOKE ALL ON FUNCTION public.run_auto_clock_out() FROM PUBLIC, anon, authenticated;
