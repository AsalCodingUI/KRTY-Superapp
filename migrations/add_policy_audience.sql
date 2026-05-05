ALTER TABLE public.policy_documents
  ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'Everyone'
  CHECK (audience IN ('Everyone', 'Stakeholder', 'Employee', 'Project Team'));
