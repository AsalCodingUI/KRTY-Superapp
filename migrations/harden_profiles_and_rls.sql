-- Security hardening (Performance audit, Oct 2026).
--
-- 1. profiles: a member could update their own row with any columns, incl.
--    role / is_super_admin / salary (and the role trigger then copies the
--    role into their JWT). A guard trigger now only lets non-stakeholders
--    change their own name/avatar; only super admins can grant super admin.
-- 2. profiles salary: hourly_rate / monthly_salary are no longer readable by
--    the browser roles. Stakeholders read them via get_team_compensation().
-- 3. calendar_events: drop "allow all" for anon (anyone with the public key
--    could read/write) and authenticated; owners, guests (RSVP) and
--    stakeholders can change events, everyone signed in can read them.
-- 4. competency_library: readable by everyone, writable by stakeholders only.
-- 5. performance_reviews: no direct inserts from the browser; reviews go
--    through POST /api/performance/reviews which enforces the rules.
-- 6. project scores: leads can no longer score themselves.

-- 1. profiles guard ---------------------------------------------------------
CREATE OR REPLACE FUNCTION public.guard_profile_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    OR NEW.leave_balance IS DISTINCT FROM OLD.leave_balance
    OR NEW.leave_used IS DISTINCT FROM OLD.leave_used
    OR NEW.join_date IS DISTINCT FROM OLD.join_date
    OR NEW.employment_type IS DISTINCT FROM OLD.employment_type
  ) THEN
    RAISE EXCEPTION 'Only admins can change these profile fields'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_profile_changes ON public.profiles;
CREATE TRIGGER guard_profile_changes
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.guard_profile_changes();

-- Two near-identical update policies existed; keep one.
DROP POLICY IF EXISTS "Update profiles" ON public.profiles;

-- 2. salary columns ----------------------------------------------------------
REVOKE SELECT, INSERT, UPDATE ON public.profiles FROM anon, authenticated;
GRANT SELECT (
  id, krt_id, email, full_name, avatar_url, role, job_title, team_id,
  created_at, updated_at, leave_balance, leave_used, manager_id,
  is_super_admin, join_date, employment_type
) ON public.profiles TO authenticated;
GRANT INSERT (
  id, krt_id, email, full_name, avatar_url, role, job_title, team_id,
  created_at, updated_at, manager_id, is_super_admin, join_date,
  employment_type
) ON public.profiles TO authenticated;
GRANT UPDATE (
  krt_id, email, full_name, avatar_url, role, job_title, team_id,
  updated_at, leave_balance, leave_used, manager_id, is_super_admin,
  join_date, employment_type
) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_team_compensation()
RETURNS TABLE (
  id uuid,
  full_name text,
  job_title text,
  role app_role,
  hourly_rate numeric,
  monthly_salary numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.full_name, p.job_title::text, p.role,
         p.hourly_rate::numeric, p.monthly_salary::numeric
  FROM profiles p
  WHERE is_stakeholder()
  ORDER BY p.full_name;
$$;
REVOKE ALL ON FUNCTION public.get_team_compensation() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_team_compensation() TO authenticated;

-- 3. calendar_events ---------------------------------------------------------
DROP POLICY IF EXISTS "Allow all access for anon users" ON public.calendar_events;
DROP POLICY IF EXISTS "Allow all access for authenticated users" ON public.calendar_events;
DROP POLICY IF EXISTS "Employees view relevant events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users insert their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users update their own events" ON public.calendar_events;
DROP POLICY IF EXISTS "Users delete their own events" ON public.calendar_events;

CREATE POLICY "Signed-in users read events"
  ON public.calendar_events FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Users add their own events"
  ON public.calendar_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR is_stakeholder());
CREATE POLICY "Owners, guests and stakeholders change events"
  ON public.calendar_events FOR UPDATE TO authenticated
  USING (
    user_id = auth.uid()
    OR is_stakeholder()
    OR guests @> jsonb_build_array(jsonb_build_object(
      'email', (SELECT email FROM auth.users WHERE id = auth.uid())))
  );
CREATE POLICY "Owners and stakeholders delete events"
  ON public.calendar_events FOR DELETE TO authenticated
  USING (user_id = auth.uid() OR is_stakeholder());
REVOKE ALL ON public.calendar_events FROM anon;

-- 4. competency_library -------------------------------------------------------
DROP POLICY IF EXISTS "Access All" ON public.competency_library;
CREATE POLICY "Signed-in users read competencies"
  ON public.competency_library FOR SELECT TO authenticated
  USING (true);
CREATE POLICY "Stakeholders manage competencies"
  ON public.competency_library FOR ALL TO authenticated
  USING (is_stakeholder()) WITH CHECK (is_stakeholder());

-- 5. performance_reviews ------------------------------------------------------
DROP POLICY IF EXISTS "Employees can insert reviews" ON public.performance_reviews;
DROP POLICY IF EXISTS "Employees can update own draft reviews" ON public.performance_reviews;

-- 6. project scores: a lead scores others on their project, never themselves
CREATE OR REPLACE FUNCTION public.can_score_assignment(p_assignment_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_stakeholder() OR EXISTS (
    SELECT 1
    FROM project_assignments pa_row
    JOIN project_assignments pa_lead ON pa_lead.project_id = pa_row.project_id
    WHERE pa_row.id = p_assignment_id
      AND pa_lead.user_id = auth.uid()
      AND pa_lead.is_lead = true
      AND pa_row.user_id <> auth.uid()
  );
$$;

DO $$
DECLARE
  t text;
  label text;
BEGIN
  FOREACH t IN ARRAY ARRAY['project_sla_scores', 'project_work_quality_scores'] LOOP
    label := CASE t WHEN 'project_sla_scores' THEN 'SLA' ELSE 'Quality' END;
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', label || ' scores insert', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', label || ' scores update', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', label || ' scores delete', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (can_score_assignment(assignment_id))',
      label || ' scores insert', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (can_score_assignment(assignment_id)) WITH CHECK (can_score_assignment(assignment_id))',
      label || ' scores update', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (can_score_assignment(assignment_id))',
      label || ' scores delete', t);
  END LOOP;
END $$;
