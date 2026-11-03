-- Briefs: the offered sets the client took ("Yes, add it"), so they can
-- change their mind and drop them again (the sets the team asked for stay).
-- Additive and idempotent.
ALTER TABLE public.briefs
  ADD COLUMN IF NOT EXISTS accepted text[] NOT NULL DEFAULT '{}';

NOTIFY pgrst, 'reload schema';
