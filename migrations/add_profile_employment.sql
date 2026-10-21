-- Employment data for annual-leave eligibility (see src/shared/lib/leave.ts):
--   magang (intern)      -> no annual leave
--   < 6 months           -> not eligible yet
--   6-11 months          -> 1 day per full month worked
--   >= 12 months / unset -> 12 days
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS join_date date,
  ADD COLUMN IF NOT EXISTS employment_type text NOT NULL DEFAULT 'karyawan';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_employment_type_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_employment_type_check
      CHECK (employment_type IN ('karyawan', 'magang'));
  END IF;
END $$;

COMMENT ON COLUMN public.profiles.join_date IS
  'Date the person became an employee (after any internship).';
COMMENT ON COLUMN public.profiles.employment_type IS
  'karyawan | magang. Interns get no annual leave.';
