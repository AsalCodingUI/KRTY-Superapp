CREATE TABLE IF NOT EXISTS public.project_calculations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled Calculation',
  revenue_usd numeric NOT NULL DEFAULT 0,
  exchange_rate numeric NOT NULL DEFAULT 15000,
  hours_per_day numeric NOT NULL DEFAULT 8,
  target_margin numeric NOT NULL DEFAULT 40,
  phases jsonb NOT NULL DEFAULT '[]',
  squad jsonb NOT NULL DEFAULT '[]',
  freelance_squad jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE project_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage project calculations"
ON project_calculations FOR ALL
USING (
  auth.role() = 'authenticated'
  AND project_id IN (SELECT id FROM projects)
)
WITH CHECK (
  auth.role() = 'authenticated'
  AND project_id IN (SELECT id FROM projects)
);
