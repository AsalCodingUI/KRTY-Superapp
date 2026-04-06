-- Fix new-auth-user profile creation so Google OAuth sign-ins do not fail
-- when profiles requires fields like job_title and krt_id.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  next_krt_number integer;
  derived_job_title public.job_title;
BEGIN
  derived_job_title :=
    COALESCE(
      (new.raw_user_meta_data->>'job_title')::public.job_title,
      CASE
        WHEN COALESCE(new.raw_user_meta_data->>'role', 'employee') = 'stakeholder'
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
    krt_id
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    COALESCE(
      (new.raw_user_meta_data->>'role')::public.app_role,
      'employee'::public.app_role
    ),
    derived_job_title,
    'KRT_' || next_krt_number::text
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, public.profiles.avatar_url),
    role = EXCLUDED.role,
    job_title = COALESCE(public.profiles.job_title, EXCLUDED.job_title),
    krt_id = COALESCE(public.profiles.krt_id, EXCLUDED.krt_id);

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
