-- Sharing Santuy rotation: the weekly sharing session where one person
-- presents, taking turns in a queue that loops forever. Additive only.
--
-- The schedule itself isn't stored: the app computes it from these three
-- tables (src/shared/lib/santuy.ts documents the rules).
--   santuy_settings  one row: when (weekday, time, length) + the anchor
--                    (anchor_date is a session date, anchor_index the queue
--                    position presenting then) + the Meet link.
--   santuy_members   the queue. Removing someone sets active = false, so the
--                    row (and their past turns) stays.
--   santuy_weeks     per-date exceptions: 'skip' (libur, nobody shifts) or
--                    'assign' (that week's presenter, nobody shifts). Rows
--                    before the anchor are frozen history.
--
-- Everyone signed in reads; stakeholders and PMs write.

CREATE TABLE IF NOT EXISTS public.santuy_settings (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  -- 0 = Sunday … 6 = Saturday (JS getDay / Postgres dow). 5 = Friday.
  weekday smallint NOT NULL DEFAULT 5 CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL DEFAULT '16:00',
  duration_min int NOT NULL DEFAULT 60 CHECK (duration_min BETWEEN 5 AND 600),
  timezone text NOT NULL DEFAULT 'Asia/Jakarta',
  anchor_date date NOT NULL DEFAULT '2026-11-06',
  anchor_index int NOT NULL DEFAULT 0 CHECK (anchor_index >= 0),
  meet_url text,
  google_event_id text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.santuy_members (
  profile_id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  position int NOT NULL,
  active boolean NOT NULL DEFAULT true,
  added_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.santuy_weeks (
  date date PRIMARY KEY,
  kind text NOT NULL CHECK (kind IN ('skip', 'assign')),
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (kind = 'skip' OR profile_id IS NOT NULL)
);

ALTER TABLE public.santuy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santuy_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.santuy_weeks ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.santuy_settings TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.santuy_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.santuy_weeks TO authenticated;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['santuy_settings', 'santuy_members', 'santuy_weeks']
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%s read" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s read" ON public.%I FOR SELECT TO authenticated USING (true)',
      t, t);
    EXECUTE format('DROP POLICY IF EXISTS "%s write" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "%s write" ON public.%I FOR ALL TO authenticated
         USING (is_stakeholder() OR is_pm())
         WITH CHECK (is_stakeholder() OR is_pm())',
      t, t);
  END LOOP;
END;
$$;

-- Defaults: Fridays 16:00–17:00 WIB, Bagas first on 2026-11-06.
INSERT INTO public.santuy_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

-- The queue the owner asked for, in order (matched by name on prod; Rensi
-- has two profiles with one email, this is the one that signs in).
INSERT INTO public.santuy_members (profile_id, position)
SELECT v.profile_id, v.position
FROM (VALUES
  ('d802b25b-1407-49f5-b1a8-0618eec6fec1'::uuid, 0), -- Bagas Ivaniajie
  ('b9f50266-afbc-4196-accd-f5f959c3dc26'::uuid, 1), -- Rizki Fadhilah Muhammad Habibi
  ('4526a930-fb6d-41d4-8180-d1e8cf080b4d'::uuid, 2), -- Rizal Dwi Artanto
  ('d66224d0-5a7a-40ac-8bc6-4560f438828f'::uuid, 3), -- Farah Intan Maisuri Dinaya
  ('e79b78af-fa94-4b12-98e0-8c693bca5e95'::uuid, 4), -- Gilang Mukti Setio Bekti
  ('eb08b69d-dea4-4097-833f-c42750cef2a6'::uuid, 5), -- Adi Pamungkas
  ('d3b1ef57-a5a0-4347-8feb-5ff0c81130fc'::uuid, 6), -- Rensi Meila Yulvinata
  ('069b0370-1a2f-4048-ab21-7a3ece808fbf'::uuid, 7), -- Haqqi Ilmiawan
  ('549d771a-3c07-4e05-90d8-ab9c80129e94'::uuid, 8), -- Hafiza Aprilia
  ('32ec1be4-c17f-459f-94aa-d68aac065cfe'::uuid, 9)  -- Taufiq
) AS v(profile_id, position)
WHERE EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = v.profile_id)
ON CONFLICT (profile_id) DO NOTHING;

-- Owner correction (first applied as Thursday): sessions are on Friday.
-- Only moves the untouched default row; the app re-anchors later edits.
UPDATE public.santuy_settings
SET weekday = 5, anchor_date = '2026-11-06', updated_at = now()
WHERE weekday = 4 AND anchor_date = '2026-11-05';
