-- A sent 360 review can be changed once while the cycle runs (and before
-- the reviewee's result is processed). edited_at marks that it was.
ALTER TABLE public.performance_reviews
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;
