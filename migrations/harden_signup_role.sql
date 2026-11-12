-- Security (audit 2026-11-13): a new account's role and job title never
-- come from the sign-up's own metadata (raw_user_meta_data is whatever the
-- caller sent to /auth/v1/signup, so `data: {role: "stakeholder"}` made a
-- stakeholder). A profile an admin made beforehand keeps its role; anyone
-- else starts as an employee, and a stakeholder promotes them in Tim.
-- Same function as profile_merge_on_signin.sql otherwise. Idempotent.
--
-- NOT APPLIED YET: run it in the Supabase SQL editor after reviewing.
-- Also worth doing there (settings, not SQL): turn off open email sign-up
-- (Auth → Providers → Email → "Allow new users to sign up") so only invited
-- people get in.

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
      'employee'::public.app_role
    );

  derived_job_title :=
    COALESCE(
      existing_profile.job_title,
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

  -- A profile made beforehand (an admin adding the person) under another
  -- id: move what points at it (page access, projects, notices…) to the
  -- signed-in one, then drop it, so the person isn't listed twice. Each
  -- step is guarded: signing in must never fail over this.
  IF existing_profile.id IS NOT NULL AND existing_profile.id <> new.id THEN
    PERFORM public.merge_profile_into(existing_profile.id, new.id);
  END IF;

  RETURN new;
END;
$function$;
