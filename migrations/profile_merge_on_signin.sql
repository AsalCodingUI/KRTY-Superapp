-- Signing in for the first time when an admin already added the person:
-- handle_new_user made a second profile (the auth user's id) and left the
-- first one, so people showed up twice. merge_profile_into moves every
-- reference to the old profile onto the new one and deletes the old one;
-- handle_new_user now calls it. Idempotent.

CREATE OR REPLACE FUNCTION public.merge_profile_into(old_id uuid, new_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $fn$
DECLARE
  r record;
  row_id tid;
BEGIN
  IF old_id IS NULL OR new_id IS NULL OR old_id = new_id THEN RETURN; END IF;
  FOR r IN
    SELECT kcu.table_schema s, kcu.table_name t, kcu.column_name c
    FROM information_schema.referential_constraints rc
    JOIN information_schema.key_column_usage kcu
      ON kcu.constraint_name = rc.constraint_name
     AND kcu.constraint_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON ccu.constraint_name = rc.unique_constraint_name
     AND ccu.constraint_schema = rc.unique_constraint_schema
    WHERE ccu.table_schema = 'public' AND ccu.table_name = 'profiles'
      AND ccu.column_name = 'id'
  LOOP
    BEGIN
      EXECUTE format('UPDATE %I.%I SET %I = $1 WHERE %I = $2', r.s, r.t, r.c, r.c)
        USING new_id, old_id;
    EXCEPTION WHEN unique_violation THEN
      -- Some rows clash with ones the new profile already has (e.g. the
      -- same page access): row by row, move the rest and drop the clashes.
      FOR row_id IN EXECUTE format(
        'SELECT ctid FROM %I.%I WHERE %I = $1', r.s, r.t, r.c) USING old_id
      LOOP
        BEGIN
          EXECUTE format('UPDATE %I.%I SET %I = $1 WHERE ctid = $2', r.s, r.t, r.c)
            USING new_id, row_id;
        EXCEPTION WHEN unique_violation THEN
          EXECUTE format('DELETE FROM %I.%I WHERE ctid = $1', r.s, r.t)
            USING row_id;
        END;
      END LOOP;
    WHEN others THEN
      RAISE WARNING 'merge_profile_into: % .% left as is (%)', r.t, r.c, SQLERRM;
    END;
  END LOOP;
  BEGIN
    DELETE FROM public.profiles WHERE id = old_id;
  EXCEPTION WHEN others THEN
    RAISE WARNING 'merge_profile_into: old profile % kept (%)', old_id, SQLERRM;
  END;
END;
$fn$;

REVOKE ALL ON FUNCTION public.merge_profile_into(uuid, uuid) FROM PUBLIC, anon, authenticated;

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
