-- Not used: Sharing Santuy's scheduled notices runs inside the app's own job runner
-- (src/shared/lib/jobs/runner.ts, JOBS_ENABLED=1 on production), so the
-- database never has to call the app. Applying this only removes a job that
-- an earlier draft may have scheduled. Idempotent.

SELECT cron.unschedule('santuy-notify')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'santuy-notify');
