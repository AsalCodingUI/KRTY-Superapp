-- A "Company Holiday" made from an Indonesian national holiday
-- (src/shared/lib/id-holidays.ts) carries that holiday's key, e.g.
-- "id:2026-12-25", so the calendar knows it's set and can undo it.
-- The unique index stops the same holiday being set twice.
-- Additive; RLS already lets stakeholders insert/delete any event.

alter table public.calendar_events
  add column if not exists holiday_key text;

create unique index if not exists calendar_events_holiday_key_key
  on public.calendar_events (holiday_key)
  where holiday_key is not null;
