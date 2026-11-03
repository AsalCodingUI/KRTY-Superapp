-- Sharing Santuy: move a week to another day, and tell people about it.
-- Additive and idempotent.
--
-- santuy_weeks gets a third kind, 'move': that week's session happens on
-- moved_date at moved_time (time optional: the usual start time). The
-- rotation is untouched, like 'skip' and 'assign' (src/shared/lib/santuy.ts).
-- A 'move' may also carry profile_id (moved and someone else presents).
--
-- santuy_notices remembers which scheduled notices went out (the Monday
-- reminder to the presenter, the day-of note to the queue), so the daily
-- job (/api/santuy/notify) never sends one twice.
--
-- Changing an upcoming week (off, moved, another presenter, or back to
-- normal) tells the active queue right away, from a trigger.

ALTER TABLE public.santuy_weeks
  ADD COLUMN IF NOT EXISTS moved_date date,
  ADD COLUMN IF NOT EXISTS moved_time time;

ALTER TABLE public.santuy_weeks DROP CONSTRAINT IF EXISTS santuy_weeks_kind_check;
ALTER TABLE public.santuy_weeks
  ADD CONSTRAINT santuy_weeks_kind_check
  CHECK (kind IN ('skip', 'assign', 'move'));

ALTER TABLE public.santuy_weeks DROP CONSTRAINT IF EXISTS santuy_weeks_check;
ALTER TABLE public.santuy_weeks
  ADD CONSTRAINT santuy_weeks_check
  CHECK (
    (kind = 'skip')
    OR (kind = 'assign' AND profile_id IS NOT NULL)
    OR (kind = 'move' AND moved_date IS NOT NULL)
  );

CREATE TABLE IF NOT EXISTS public.santuy_notices (
  -- The week's session day (santuy_weeks.date / the rotation slot).
  date date NOT NULL,
  kind text NOT NULL CHECK (kind IN ('presenter_week', 'day_of')),
  sent_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (date, kind)
);
ALTER TABLE public.santuy_notices ENABLE ROW LEVEL SECURITY;
-- Server only (service key); nobody else reads or writes it.

-- "Jumat, 6 Nov" in Indonesian, for notices.
CREATE OR REPLACE FUNCTION public.santuy_day_label(d date)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT (ARRAY['Minggu','Senin','Selasa','Rabu','Kamis','Jumat','Sabtu'])[extract(dow FROM d)::int + 1]
    || ', ' || extract(day FROM d)::int || ' '
    || (ARRAY['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'])[extract(month FROM d)::int]
$$;

CREATE OR REPLACE FUNCTION public.trg_santuy_weeks_notify()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row santuy_weeks%ROWTYPE;
  v_today date := (now() AT TIME ZONE 'Asia/Jakarta')::date;
  v_time text;
  v_title text;
  v_message text;
  v_who text;
BEGIN
  v_row := CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  -- Past weeks (history frozen by a queue edit) tell nobody.
  IF v_row.date < v_today THEN RETURN v_row; END IF;
  -- Nothing anyone would notice.
  IF TG_OP = 'UPDATE' AND NEW.kind = OLD.kind
     AND NEW.profile_id IS NOT DISTINCT FROM OLD.profile_id
     AND NEW.moved_date IS NOT DISTINCT FROM OLD.moved_date
     AND NEW.moved_time IS NOT DISTINCT FROM OLD.moved_time THEN
    RETURN NEW;
  END IF;

  -- The moved time while it's moved; back to normal means the usual time.
  SELECT to_char(
           CASE WHEN TG_OP = 'DELETE' THEN s.start_time
                ELSE coalesce(v_row.moved_time, s.start_time) END,
           'HH24:MI')
    INTO v_time FROM santuy_settings s WHERE s.id;

  IF TG_OP = 'DELETE' THEN
    v_title := 'Sharing Santuy balik normal';
    v_message := santuy_day_label(OLD.date) || ' kembali sesuai jadwal · ' || coalesce(v_time, '16:30');
  ELSIF NEW.kind = 'skip' THEN
    v_title := 'Sharing Santuy minggu ini libur';
    v_message := santuy_day_label(NEW.date) || ' libur dulu. Pembicaranya pindah ke minggu depan'
      || coalesce('. ' || nullif(btrim(NEW.note), ''), '.');
  ELSIF NEW.kind = 'move' THEN
    v_title := 'Sharing Santuy digeser';
    v_message := 'Pindah ke ' || santuy_day_label(NEW.moved_date) || ' · ' || coalesce(v_time, '16:30')
      || coalesce('. ' || nullif(btrim(NEW.note), ''), '');
  ELSE
    SELECT coalesce(nullif(btrim(full_name), ''), 'Seseorang') INTO v_who
      FROM profiles WHERE id = NEW.profile_id;
    v_title := 'Pembicara Sharing Santuy diganti';
    v_message := santuy_day_label(NEW.date) || ' giliran ' || coalesce(v_who, 'orang lain') || ' · ' || coalesce(v_time, '16:30');
  END IF;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT m.profile_id, v_title, left(v_message, 200), 'santuy_change', '/calendar/santuy'
  FROM santuy_members m
  JOIN profiles p ON p.id = m.profile_id
  WHERE m.active
    -- Whoever made the change already knows.
    AND m.profile_id IS DISTINCT FROM auth.uid();

  RETURN v_row;
END;
$$;

DROP TRIGGER IF EXISTS santuy_weeks_notify ON public.santuy_weeks;
CREATE TRIGGER santuy_weeks_notify
  AFTER INSERT OR UPDATE OR DELETE ON public.santuy_weeks
  FOR EACH ROW EXECUTE FUNCTION public.trg_santuy_weeks_notify();
