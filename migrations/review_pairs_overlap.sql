-- 360 pairs: teammates on a project that runs during the quarter (dates
-- overlap) or is still Active, not only projects that END in the quarter.
-- Otherwise a fresh quarter (no project ending yet) had nobody to review.
CREATE OR REPLACE FUNCTION public.review_pairs(p_quarter text)
RETURNS TABLE (reviewer_id uuid, reviewee_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH q AS (
    SELECT make_date(split_part(p_quarter, '-Q', 1)::int,
                     (split_part(p_quarter, '-Q', 2)::int - 1) * 3 + 1, 1) AS qs
  )
  SELECT DISTINCT a.user_id, b.user_id
  FROM q
  JOIN projects p ON (
        (p.start_date <= (q.qs + interval '3 months' - interval '1 day')::date
         AND p.end_date >= q.qs)
     OR p.status = 'Active')
  JOIN project_assignments a ON a.project_id = p.id
  JOIN project_assignments b ON b.project_id = p.id AND b.user_id <> a.user_id
  JOIN profiles pa ON pa.id = a.user_id AND pa.role = 'employee'
  JOIN profiles pb ON pb.id = b.user_id AND pb.role = 'employee'
  WHERE p_quarter ~ '^\d{4}-Q[1-4]$'
    AND (auth.uid() IS NULL OR is_stakeholder() OR a.user_id = auth.uid());
$$;
