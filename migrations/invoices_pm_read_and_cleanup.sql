-- 1. Project Managers (job title) read the invoices of projects they're on,
--    read-only, like stakeholders read all. They also need the FX rates (for
--    the IDR totals) and the payment QR images printed on the invoice.
-- 2. The daily invoice reminder is gone (it notified leads who can't open
--    invoices).
-- 3. profiles.leave_balance / leave_used are dropped: nothing shows them;
--    leave balance is computed from approved requests (annualLeaveSummary).
-- Idempotent.

CREATE OR REPLACE FUNCTION public.is_project_pm(p_project_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND job_title = 'Project Manager'
  ) AND is_project_member(p_project_id)
$$;

CREATE OR REPLACE FUNCTION public.is_pm()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND job_title = 'Project Manager'
  )
$$;

DROP POLICY IF EXISTS "Project invoices read" ON public.project_invoices;
CREATE POLICY "Project invoices read" ON public.project_invoices
  FOR SELECT TO authenticated
  USING (is_stakeholder() OR is_project_pm(project_id));

DROP POLICY IF EXISTS "Anyone signed in can read app settings" ON public.app_settings;
CREATE POLICY "Anyone signed in can read app settings" ON public.app_settings
  FOR SELECT TO authenticated
  USING (
    key NOT LIKE 'finance\_%'
    OR is_stakeholder()
    OR (key = 'finance_fx_rates' AND is_pm())
  );

DROP POLICY IF EXISTS "Finance assets PM read" ON storage.objects;
CREATE POLICY "Finance assets PM read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'finance-assets' AND is_pm());

-- 2. Invoice reminders off.
-- The job belongs to supabase_admin: run this file as that user, or the
-- unschedule is skipped (and the function drop below makes the job a no-op
-- error until it is removed).
DO $$
BEGIN
  PERFORM cron.unschedule('invoice-reminders');
EXCEPTION WHEN others THEN
  RAISE NOTICE 'invoice-reminders not unscheduled: %', SQLERRM;
END $$;
DROP FUNCTION IF EXISTS public.run_invoice_reminders();

-- 3. Legacy leave counters.
DROP TRIGGER IF EXISTS on_leave_approval ON public.leave_requests;
DROP FUNCTION IF EXISTS public.update_leave_balance();

-- New profiles and the profile guard no longer touch the counters.
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  existing_profile public.profiles%ROWTYPE;
  next_krt_number integer;
  derived_role public.app_role;
  derived_job_title public.job_title;
BEGIN
  SELECT *
  INTO existing_profile
  FROM public.profiles
  WHERE lower(email) = lower(new.email)
  ORDER BY created_at ASC NULLS LAST
  LIMIT 1;

  derived_role :=
    COALESCE(
      existing_profile.role,
      CASE
        WHEN COALESCE(new.raw_user_meta_data->>'role', '') = 'stakeholder'
          THEN 'stakeholder'::public.app_role
        ELSE 'employee'::public.app_role
      END
    );

  derived_job_title :=
    COALESCE(
      existing_profile.job_title,
      CASE
        WHEN COALESCE(new.raw_user_meta_data->>'job_title', '') IN ('Admin', 'Project Manager', 'Designer', 'Web Developer')
          THEN (new.raw_user_meta_data->>'job_title')::public.job_title
        ELSE NULL
      END,
      CASE
        WHEN derived_role = 'stakeholder'::public.app_role
          THEN 'Admin'::public.job_title
        ELSE 'Designer'::public.job_title
      END
    );

  SELECT COALESCE(
    MAX(
      NULLIF(
        regexp_replace(krt_id, '[^0-9]', '', 'g'),
        ''
      )::integer
    ),
    0
  ) + 1
  INTO next_krt_number
  FROM public.profiles;

  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    avatar_url,
    role,
    job_title,
    krt_id,
    hourly_rate,
    team_id,
    manager_id,
    is_super_admin,
    monthly_salary
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(
      existing_profile.full_name,
      new.raw_user_meta_data->>'full_name',
      new.raw_user_meta_data->>'name',
      split_part(new.email, '@', 1)
    ),
    COALESCE(existing_profile.avatar_url, new.raw_user_meta_data->>'avatar_url'),
    derived_role,
    derived_job_title,
    COALESCE(existing_profile.krt_id, 'KRT_' || next_krt_number::text),
    COALESCE(existing_profile.hourly_rate, 0),
    existing_profile.team_id,
    existing_profile.manager_id,
    COALESCE(existing_profile.is_super_admin, false),
    existing_profile.monthly_salary
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = EXCLUDED.role,
    job_title = COALESCE(public.profiles.job_title, EXCLUDED.job_title),
    krt_id = COALESCE(public.profiles.krt_id, EXCLUDED.krt_id),
    hourly_rate = COALESCE(public.profiles.hourly_rate, EXCLUDED.hourly_rate),
    team_id = COALESCE(public.profiles.team_id, EXCLUDED.team_id),
    manager_id = COALESCE(public.profiles.manager_id, EXCLUDED.manager_id),
    is_super_admin = COALESCE(public.profiles.is_super_admin, EXCLUDED.is_super_admin),
    monthly_salary = COALESCE(public.profiles.monthly_salary, EXCLUDED.monthly_salary);

  RETURN new;
END;
$function$;

CREATE OR REPLACE FUNCTION public.guard_profile_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  actor uuid := auth.uid();
  actor_is_stakeholder boolean;
  actor_is_super boolean;
BEGIN
  -- Server-side code (service role, triggers without a user) is trusted.
  IF actor IS NULL OR coalesce(auth.role(), '') <> 'authenticated' THEN
    RETURN NEW;
  END IF;

  SELECT role = 'stakeholder', coalesce(is_super_admin, false)
    INTO actor_is_stakeholder, actor_is_super
    FROM profiles WHERE id = actor;
  actor_is_stakeholder := coalesce(actor_is_stakeholder, false);
  actor_is_super := coalesce(actor_is_super, false);

  IF TG_OP = 'INSERT' THEN
    IF NOT actor_is_stakeholder THEN
      NEW.role := 'employee';
      NEW.is_super_admin := false;
      NEW.hourly_rate := NULL;
      NEW.monthly_salary := NULL;
      NEW.manager_id := NULL;
    ELSIF NOT actor_is_super THEN
      NEW.is_super_admin := false;
    END IF;
    RETURN NEW;
  END IF;

  IF NEW.is_super_admin IS DISTINCT FROM OLD.is_super_admin AND NOT actor_is_super THEN
    RAISE EXCEPTION 'Only a super admin can change super admin access'
      USING ERRCODE = '42501';
  END IF;

  IF NOT actor_is_stakeholder AND (
       NEW.role IS DISTINCT FROM OLD.role
    OR NEW.hourly_rate IS DISTINCT FROM OLD.hourly_rate
    OR NEW.monthly_salary IS DISTINCT FROM OLD.monthly_salary
    OR NEW.manager_id IS DISTINCT FROM OLD.manager_id
    OR NEW.team_id IS DISTINCT FROM OLD.team_id
    OR NEW.job_title IS DISTINCT FROM OLD.job_title
    OR NEW.email IS DISTINCT FROM OLD.email
    OR NEW.krt_id IS DISTINCT FROM OLD.krt_id
    OR NEW.join_date IS DISTINCT FROM OLD.join_date
    OR NEW.employment_type IS DISTINCT FROM OLD.employment_type
  ) THEN
    RAISE EXCEPTION 'Only admins can change these profile fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;

ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS leave_balance,
  DROP COLUMN IF EXISTS leave_used;
