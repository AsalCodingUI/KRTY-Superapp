ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_salary numeric NULL;
