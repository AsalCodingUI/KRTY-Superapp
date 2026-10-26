-- KPI from project phases.
--
-- SLA milestones are the project's phases: each phase gets a due date (and
-- an optional SLA weight). The app derives each member's result from the
-- phase's due date and the day it was completed:
--   done ≥ 2 days early → Faster · done by the due date → On Time ·
--   done late, or not done once the due date has passed → Delay (automatic).
-- A milestone counts in the quarter it was due, or earlier if delivered
-- earlier, so a project running Q2 → Q4 scores in every quarter it delivers.
--
-- Leads/stakeholders can override one member's result for a phase (with a
-- reason): a project_sla_scores row with phase_id set.
--
-- Closed quarters are locked: kpi_period_locks marks the quarter and
-- kpi_snapshots keeps each person's numbers as they were at the lock, so a
-- later edit can't silently change a finished period.
--
-- Run after performance_cleanup.sql and project_phase_edit.sql.

-- 1. Phases as milestones ----------------------------------------------------
ALTER TABLE public.project_phases
  ADD COLUMN IF NOT EXISTS due_date date,
  ADD COLUMN IF NOT EXISTS sla_weight numeric
    CHECK (sla_weight IS NULL OR (sla_weight > 0 AND sla_weight <= 100));

-- 2. Per-member overrides ------------------------------------------------------
ALTER TABLE public.project_sla_scores
  ADD COLUMN IF NOT EXISTS phase_id uuid
    REFERENCES public.project_phases (id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS override_reason text;

CREATE UNIQUE INDEX IF NOT EXISTS project_sla_scores_phase_override_key
  ON public.project_sla_scores (assignment_id, phase_id)
  WHERE phase_id IS NOT NULL;

-- Replaces one member's phase overrides (results only; weights live on the
-- phases). p_overrides: [{ "phaseId": uuid, "result": text, "reason": text }].
CREATE OR REPLACE FUNCTION public.save_phase_overrides(
  p_assignment_id uuid,
  p_overrides jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NOT can_score_assignment(p_assignment_id) THEN
    RAISE EXCEPTION 'Kamu tidak bisa menilai anggota ini' USING ERRCODE = '42501';
  END IF;
  IF EXISTS (
    SELECT 1 FROM jsonb_array_elements(coalesce(p_overrides, '[]'::jsonb)) o
    WHERE o ->> 'result' NOT IN ('Faster', 'On Time', 'Delay')
       OR nullif(trim(o ->> 'reason'), '') IS NULL
  ) THEN
    RAISE EXCEPTION 'Setiap penyesuaian butuh hasil dan alasan' USING ERRCODE = '22023';
  END IF;

  DELETE FROM project_sla_scores
   WHERE assignment_id = p_assignment_id AND phase_id IS NOT NULL;

  INSERT INTO project_sla_scores (
    assignment_id, phase_id, milestone_name, weight_percentage, actual_result,
    score_achieved, score_target, target_percentage, override_reason
  )
  SELECT p_assignment_id,
         ph.id,
         ph.name,
         coalesce(ph.sla_weight, 0),
         o ->> 'result',
         coalesce(ph.sla_weight, 0) * CASE o ->> 'result'
           WHEN 'Faster' THEN 120 WHEN 'Delay' THEN 80 ELSE 100 END,
         coalesce(ph.sla_weight, 0) * 100,
         100,
         trim(o ->> 'reason')
  FROM jsonb_array_elements(coalesce(p_overrides, '[]'::jsonb)) o
  JOIN project_phases ph ON ph.id = (o ->> 'phaseId')::uuid
  JOIN project_assignments pa ON pa.id = p_assignment_id
   AND pa.project_id = ph.project_id;
END;
$$;
REVOKE ALL ON FUNCTION public.save_phase_overrides(uuid, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_phase_overrides(uuid, jsonb) TO authenticated;

-- 3. Locked quarters -----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.kpi_period_locks (
  period text PRIMARY KEY CHECK (period ~ '^\d{4}-Q[1-4]$'),
  locked_at timestamptz NOT NULL DEFAULT now(),
  locked_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.kpi_snapshots (
  period text NOT NULL REFERENCES public.kpi_period_locks (period) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  parts jsonb NOT NULL,
  final jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (period, user_id)
);

ALTER TABLE public.kpi_period_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kpi_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS kpi_period_locks_read ON public.kpi_period_locks;
CREATE POLICY kpi_period_locks_read ON public.kpi_period_locks
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS kpi_period_locks_write ON public.kpi_period_locks;
CREATE POLICY kpi_period_locks_write ON public.kpi_period_locks
  FOR ALL TO authenticated USING (is_stakeholder()) WITH CHECK (is_stakeholder());

DROP POLICY IF EXISTS kpi_snapshots_read ON public.kpi_snapshots;
CREATE POLICY kpi_snapshots_read ON public.kpi_snapshots
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_stakeholder());
DROP POLICY IF EXISTS kpi_snapshots_write ON public.kpi_snapshots;
CREATE POLICY kpi_snapshots_write ON public.kpi_snapshots
  FOR ALL TO authenticated USING (is_stakeholder()) WITH CHECK (is_stakeholder());
