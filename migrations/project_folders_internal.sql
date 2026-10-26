-- A library folder can be internal: kept from the client when the project
-- is shared with them (the client view leaves these folders and their
-- files out). The team sees every folder either way. Idempotent.
ALTER TABLE public.project_folders
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;
