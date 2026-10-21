-- 360 review: who reviews whom = employees who share a project in the
-- cycle's quarter (decision Oct 2026). Stakeholders are not reviewed.
-- Employees only see their own pairs; stakeholders and server code see all.
CREATE OR REPLACE FUNCTION public.review_pairs(p_quarter text)
RETURNS TABLE (reviewer_id uuid, reviewee_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT DISTINCT a.user_id, b.user_id
  FROM project_assignments a
  JOIN project_assignments b ON b.project_id = a.project_id AND b.user_id <> a.user_id
  JOIN projects p ON p.id = a.project_id
  JOIN profiles pa ON pa.id = a.user_id AND pa.role = 'employee'
  JOIN profiles pb ON pb.id = b.user_id AND pb.role = 'employee'
  WHERE p.quarter_id = p_quarter
    AND (auth.uid() IS NULL OR is_stakeholder() OR a.user_id = auth.uid());
$$;
REVOKE ALL ON FUNCTION public.review_pairs(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_pairs(text) TO authenticated, service_role;
