-- Invoice builder (Kretya template): payment methods with real details
-- (bank, crypto, PayPal, Payoneer…), payment schedules (full / DP / milestone)
-- and a snapshot of client + payment details on every invoice, so an old
-- invoice keeps the account/wallet it was sent with even after it changes.
-- Additive only.

-- Payment methods ------------------------------------------------------------
ALTER TABLE public.payment_methods
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS qr_path text,
  -- Crypto deposit addresses (e.g. from an exchange) can change: stakeholders
  -- confirm them, and the editor warns when the last check is old.
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS sort integer NOT NULL DEFAULT 0;

DO $$ BEGIN
  ALTER TABLE public.payment_methods ADD CONSTRAINT payment_methods_type_check
    CHECK (type IN ('bank', 'crypto', 'paypal', 'payoneer', 'stripe', 'wise', 'cash', 'other'));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

UPDATE public.payment_methods SET type = CASE
    WHEN name ILIKE 'bank%' THEN 'bank'
    WHEN name ILIKE 'paypal%' THEN 'paypal'
    WHEN name ILIKE 'wise%' THEN 'wise'
    WHEN name ILIKE 'cash%' THEN 'cash'
    ELSE type END
  WHERE type = 'other';

-- Account numbers and wallets: stakeholders only (they were readable by
-- everyone signed in while they held just a name).
DROP POLICY IF EXISTS "Payment methods read" ON public.payment_methods;
CREATE POLICY "Payment methods read" ON public.payment_methods
  FOR SELECT TO authenticated USING (is_stakeholder());

-- Invoices -------------------------------------------------------------------
ALTER TABLE public.project_invoices
  -- [{ id, label, percent, status: unpaid|pending|paid, paid_at }]
  ADD COLUMN IF NOT EXISTS payment_schedule jsonb NOT NULL DEFAULT '[]'::jsonb,
  -- Who it was billed to, as printed (name, email, address, contact).
  ADD COLUMN IF NOT EXISTS client_snapshot jsonb,
  -- The payment method as printed (type, details, notes, qr_path).
  ADD COLUMN IF NOT EXISTS payment_snapshot jsonb,
  -- Line under the totals, e.g. "Down payment required to start."
  ADD COLUMN IF NOT EXISTS terms_note text;

ALTER TABLE public.project_invoices DROP CONSTRAINT IF EXISTS project_invoices_status_check;
ALTER TABLE public.project_invoices ADD CONSTRAINT project_invoices_status_check
  CHECK (status IN ('Draft', 'Sent', 'Partial', 'Paid', 'Overdue', 'Refunded'));

-- Clients --------------------------------------------------------------------
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS address text CHECK (length(address) <= 500);

-- QR codes for payment methods ----------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('finance-assets', 'finance-assets', false, 5242880,
        ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Finance assets stakeholders" ON storage.objects;
CREATE POLICY "Finance assets stakeholders" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'finance-assets' AND is_stakeholder())
  WITH CHECK (bucket_id = 'finance-assets' AND is_stakeholder());
