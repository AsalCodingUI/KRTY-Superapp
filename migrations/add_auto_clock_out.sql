-- Auto clock-out: closes attendance sessions people forgot to end.
--   app_settings['auto_clock_out'] = {"enabled": bool, "time": "HH:MM"}
--   Every 10 minutes, open sessions whose cut-off has passed are closed at
--   the cut-off (Asia/Jakarta) on the day they started. "Lembur" sessions and
--   sessions started after the cut-off close at 23:59 instead. A running
--   break is ended at the same moment. Closed rows get the AUTO_CLOCK_OUT note
--   tag and the person gets a notification.

CREATE EXTENSION IF NOT EXISTS pg_cron;

CREATE TABLE IF NOT EXISTS public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone signed in can read app settings" ON public.app_settings;
CREATE POLICY "Anyone signed in can read app settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can change app settings" ON public.app_settings;
CREATE POLICY "Admins can change app settings"
  ON public.app_settings FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.role = 'stakeholder'::app_role OR profiles.is_super_admin)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
      AND (profiles.role = 'stakeholder'::app_role OR profiles.is_super_admin)
  ));

INSERT INTO public.app_settings (key, value)
VALUES ('auto_clock_out', '{"enabled": false, "time": "17:00"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION public.run_auto_clock_out()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  tz constant text := 'Asia/Jakarta';
  cfg jsonb;
  cutoff time;
  r record;
  local_day date;
  out_at timestamptz;
  closed integer := 0;
BEGIN
  SELECT value INTO cfg FROM app_settings WHERE key = 'auto_clock_out';
  IF cfg IS NULL OR NOT coalesce((cfg ->> 'enabled')::boolean, false) THEN
    RETURN 0;
  END IF;
  cutoff := coalesce(nullif(cfg ->> 'time', '')::time, time '17:00');

  FOR r IN
    SELECT * FROM attendance_logs WHERE clock_out IS NULL FOR UPDATE SKIP LOCKED
  LOOP
    local_day := (r.clock_in AT TIME ZONE tz)::date;
    out_at := (local_day + cutoff) AT TIME ZONE tz;
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

DO $$
BEGIN
  PERFORM cron.unschedule(jobid) FROM cron.job WHERE jobname = 'auto-clock-out';
  PERFORM cron.schedule('auto-clock-out', '*/10 * * * *', 'SELECT public.run_auto_clock_out()');
END $$;
