-- Briefs: the client is optional (a brief can go out before we know the
-- client well; it takes the project's client once linked to one).
-- Additive and idempotent.
ALTER TABLE public.briefs ALTER COLUMN client_id DROP NOT NULL;

NOTIFY pgrst, 'reload schema';
