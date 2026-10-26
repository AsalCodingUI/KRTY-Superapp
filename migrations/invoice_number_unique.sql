-- One invoice per number. The editor already checks the month's numbers,
-- but two tabs (or a double submit) could still save the same number twice.
-- Idempotent; run after invoice_builder.sql.
CREATE UNIQUE INDEX IF NOT EXISTS project_invoices_number_unique
  ON public.project_invoices (lower(btrim(invoice_number)));
