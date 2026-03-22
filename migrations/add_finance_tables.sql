CREATE TABLE IF NOT EXISTS public.payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO payment_methods (name) VALUES
  ('Bank Transfer'),
  ('Cash'),
  ('Wise'),
  ('PayPal');

CREATE TABLE IF NOT EXISTS public.project_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft','Sent','Partial','Paid','Overdue')),
  issue_date date NOT NULL,
  due_date date NOT NULL,
  amount_idr numeric NOT NULL DEFAULT 0,
  amount_paid_idr numeric NOT NULL DEFAULT 0,
  payment_method_id uuid REFERENCES payment_methods(id) ON DELETE SET NULL,
  notes text,
  line_items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage payment methods"
ON payment_methods FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

ALTER TABLE project_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage project invoices"
ON project_invoices FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
