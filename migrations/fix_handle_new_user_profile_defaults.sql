-- Fix new-auth-user profile creation so Google OAuth sign-ins do not fail
-- when profiles requires fields like job_title and krt_id.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
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
    monthly_salary,
    leave_balance,
    leave_used
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
    existing_profile.monthly_salary,
    COALESCE(existing_profile.leave_balance, 12),
    COALESCE(existing_profile.leave_used, 0)
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
    monthly_salary = COALESCE(public.profiles.monthly_salary, EXCLUDED.monthly_salary),
    leave_balance = COALESCE(public.profiles.leave_balance, EXCLUDED.leave_balance),
    leave_used = COALESCE(public.profiles.leave_used, EXCLUDED.leave_used);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
