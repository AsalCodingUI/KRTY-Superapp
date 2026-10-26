-- Team averages of a 360 cycle, for the "vs team" marker on a result.
-- Only aggregates leave the function (no one's own scores), and only when
-- at least 3 people have a result, so a small team can't back out a person.
CREATE OR REPLACE FUNCTION public.review_cycle_averages(p_cycle_id uuid)
RETURNS TABLE (
  people integer,
  overall_percentage numeric,
  score_quality numeric,
  score_reliability numeric,
  score_communication numeric,
  score_initiative numeric,
  score_leadership numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer,
         avg(overall_percentage),
         avg(score_quality),
         avg(score_reliability),
         avg(score_communication),
         avg(score_initiative),
         avg(score_leadership)
  FROM performance_summaries
  WHERE cycle_id = p_cycle_id
    AND overall_percentage IS NOT NULL
  HAVING count(*) >= 3;
$$;
REVOKE ALL ON FUNCTION public.review_cycle_averages(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.review_cycle_averages(uuid) TO authenticated;
