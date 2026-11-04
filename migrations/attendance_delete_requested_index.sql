-- Attendance delete requests: a partial index for the sidebar badge count
-- (src/components/use-nav-badges.ts) and the approval inbox
-- (src/page-slices/leave/ui/components/ApprovalInbox.tsx).
--
-- The request is a tag in attendance_logs.notes, which holds "|"-joined
-- tags in any order (e.g. 'AUTO_CLOCK_OUT|DELETE_REQUESTED', see
-- mergeAttendanceNote in src/shared/lib/attendance.ts), so neither an
-- exact nor a prefix match would find every request. Both queries filter
-- with exactly `notes LIKE '%DELETE_REQUESTED%'`, which this index's
-- predicate matches: only the handful of tagged rows are indexed, and the
-- count reads those instead of scanning every log. Ordered by date for the
-- inbox's "newest first".
--
-- Additive and optional: the app works the same without it. Safe to re-run.
-- CONCURRENTLY: no write lock while building; run it outside a transaction
-- (not with psql -1).

CREATE INDEX CONCURRENTLY IF NOT EXISTS attendance_logs_delete_requested_idx
  ON public.attendance_logs (date DESC)
  WHERE notes LIKE '%DELETE_REQUESTED%';
