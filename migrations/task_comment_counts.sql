-- Comment counts per task for some projects (card badges on the board and
-- in Tugas saya), counted in the database instead of downloading every
-- comment row to count in the browser. Security invoker: RLS on
-- project_task_comments applies, so a caller counts only what they may read.
-- Idempotent.
CREATE OR REPLACE FUNCTION public.task_comment_counts(p_project_ids uuid[])
RETURNS TABLE (task_id uuid, n int)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT c.task_id, count(*)::int AS n
    FROM project_task_comments c
   WHERE c.project_id = ANY (p_project_ids)
   GROUP BY c.task_id;
$$;

GRANT EXECUTE ON FUNCTION public.task_comment_counts(uuid[]) TO authenticated;

