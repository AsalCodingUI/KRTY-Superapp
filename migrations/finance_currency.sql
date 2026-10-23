-- Multi-currency money. Clients pay in USD/EUR/IDR…, tools bill in USD but
-- are paid in IDR with a bank/card markup.
--
-- Each amount stays in its original `currency`. NOTE: the existing columns
-- keep their names for compatibility with deployed code (staging shares this
-- database): `amount_idr` / `amount_paid_idr` now hold the amount in
-- `currency` units, which is IDR for every row created before this change.
--
-- fx_rate = IDR actually paid/received per 1 unit (markup included). Null
-- means "use the default" from app_settings.finance_fx_rates
-- ({"USD": 16750, "EUR": 18200, ...}). Reports always total in IDR.

ALTER TABLE public.finance_subscriptions
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR'
    CHECK (currency ~ '^[A-Z]{3}$'),
  ADD COLUMN IF NOT EXISTS fx_rate numeric CHECK (fx_rate IS NULL OR fx_rate > 0);

ALTER TABLE public.project_invoices
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'IDR'
    CHECK (currency ~ '^[A-Z]{3}$'),
  ADD COLUMN IF NOT EXISTS fx_rate numeric CHECK (fx_rate IS NULL OR fx_rate > 0);
