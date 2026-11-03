-- A project can continue an earlier one (same client, next piece of work:
-- website done, branding next). The new one keeps its own KPI, invoices and
-- dates; the link is only for finding the history. Additive and idempotent.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS previous_id uuid
    REFERENCES public.projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS projects_previous_id_idx
  ON public.projects (previous_id);

-- Projects already named `p_name` (case and outer spaces ignored), also
-- ones the caller isn't on: PMs only see their own projects, so without
-- this they re-enter one that exists. Only stakeholders and PMs ask;
-- `can_open` says whether the caller may open it.
CREATE OR REPLACE FUNCTION public.project_name_twins(p_name text)
RETURNS TABLE (id uuid, name text, status project_status_enum, end_date date,
               client_name text, can_open boolean)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.name, p.status, p.end_date, p.client_name,
         can_access_project(p.id)
    FROM projects p
   WHERE (is_stakeholder() OR is_pm())
     AND lower(btrim(p.name)) = lower(btrim(p_name))
     AND btrim(p_name) <> ''
   ORDER BY p.end_date DESC
   LIMIT 5;
$$;

GRANT EXECUTE ON FUNCTION public.project_name_twins(text) TO authenticated;
