-- Finance (stakeholders): recurring costs, and tighter invoice access.

-- 1. Invoices: any signed-in user could read AND write every invoice.
--    Members may read their own projects' invoices; only stakeholders write.
DROP POLICY IF EXISTS "Authenticated users can manage project invoices" ON public.project_invoices;
CREATE POLICY "Project invoices read" ON public.project_invoices
  FOR SELECT TO authenticated
  USING (is_stakeholder() OR can_access_project(project_id));
CREATE POLICY "Project invoices write" ON public.project_invoices
  FOR ALL TO authenticated
  USING (is_stakeholder()) WITH CHECK (is_stakeholder());

DROP POLICY IF EXISTS "Authenticated users can manage payment methods" ON public.payment_methods;
CREATE POLICY "Payment methods read" ON public.payment_methods
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Payment methods write" ON public.payment_methods
  FOR ALL TO authenticated
  USING (is_stakeholder()) WITH CHECK (is_stakeholder());

-- 2. Subscriptions and other recurring costs (software, salaries, rent...).
--    Charges are derived from anchor_date + cycle; nothing is stored per charge.
CREATE TABLE IF NOT EXISTS public.finance_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (btrim(name) <> '' AND length(name) <= 120),
  category text NOT NULL DEFAULT 'Software' CHECK (length(category) <= 60),
  amount_idr numeric NOT NULL CHECK (amount_idr >= 0 AND amount_idr < 1e13),
  cycle text NOT NULL DEFAULT 'monthly' CHECK (cycle IN ('monthly', 'yearly')),
  -- First charge; later charges fall on the same day each month/year.
  anchor_date date NOT NULL,
  -- Last day it is charged (cancelled); null while running.
  ends_on date,
  notes text CHECK (length(notes) <= 1000),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_on IS NULL OR ends_on >= anchor_date)
);

ALTER TABLE public.finance_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Finance subscriptions stakeholders" ON public.finance_subscriptions;
CREATE POLICY "Finance subscriptions stakeholders" ON public.finance_subscriptions
  FOR ALL TO authenticated
  USING (is_stakeholder()) WITH CHECK (is_stakeholder());
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_subscriptions TO authenticated;

CREATE OR REPLACE FUNCTION public.touch_finance_subscription()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS finance_subscriptions_touch ON public.finance_subscriptions;
CREATE TRIGGER finance_subscriptions_touch BEFORE UPDATE ON public.finance_subscriptions
  FOR EACH ROW EXECUTE FUNCTION touch_finance_subscription();

-- 3. Every stakeholder can open /finance (one had no row at all).
INSERT INTO public.user_page_permissions (user_id, page_slug, granted)
SELECT p.id, '/finance', true FROM public.profiles p
WHERE p.role = 'stakeholder'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_page_permissions u
    WHERE u.user_id = p.id AND u.page_slug = '/finance'
  );
UPDATE public.user_page_permissions u SET granted = true
FROM public.profiles p
WHERE u.user_id = p.id AND u.page_slug = '/finance' AND p.role = 'stakeholder';
